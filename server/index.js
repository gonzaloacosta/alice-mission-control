import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { validateProjects } from './config.js';
import pty from 'node-pty';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 4446;

const activeSessions = new Map();
const sessionHistory = new Map();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const projects = validateProjects();
console.log('Available projects:', Object.keys(projects));

// Strip ANSI escape codes
function stripAnsi(str) {
  return str.replace(/[\x1B\x9B][\[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g, '')
    .replace(/\]9;[^]*?(?:\x07|\x1B\\)/g, '')
    .replace(/\r/g, '');
}

app.get('/api/v1/projects', (req, res) => {
  const projectList = Object.entries(projects).map(([id, config]) => ({
    id, name: id.toUpperCase(), dir: config.dir, agents: config.agents
  }));
  res.json({ projects: projectList });
});

app.post('/api/v1/projects/:id/prompt', (req, res) => {
  const { id } = req.params;
  const { prompt, agent } = req.body;

  if (!projects[id]) return res.status(404).json({ error: 'Project not found' });
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt is required' });

  const sessionId = uuidv4();
  const projectConfig = projects[id];

  const claudeArgs = [
    '--dangerously-skip-permissions',
    '-p', prompt,
    '--output-format', 'text'
  ];

  if (agent && projectConfig.agents.includes(agent)) {
    claudeArgs.push('--agent', agent);
  }

  console.log(`[${sessionId.slice(0,8)}] Spawning claude for ${id}: ${prompt.slice(0,60)}`);
  console.log(`[${sessionId.slice(0,8)}] Args:`, JSON.stringify(claudeArgs));
  console.log(`[${sessionId.slice(0,8)}] CWD:`, projectConfig.dir);

  // Use node-pty to allocate a PTY (Claude CLI requires TTY)
  console.log(`[${sessionId.slice(0,8)}] About to pty.spawn`);
  const ptyProcess = pty.spawn('claude', claudeArgs, {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    cwd: projectConfig.dir,
    env: { ...process.env, HOME: process.env.HOME || '/home/alice' }
  });

  const session = {
    id: sessionId,
    projectId: id,
    agent: agent || null,
    prompt,
    timestamp: Date.now(),
    status: 'running',
    process: ptyProcess,
    buffer: [],
    ws: null,
    done: false
  };

  function emit(msg) {
    if (session.ws && session.ws.readyState === 1) {
      session.ws.send(JSON.stringify(msg));
    } else {
      session.buffer.push(msg);
    }
  }

  // PTY data event — streams output in real-time
  ptyProcess.onData((data) => {
    const clean = stripAnsi(data);
    if (clean.trim()) {
      console.log(`[${sessionId.slice(0,8)}] PTY data: ${clean.trim().slice(0,80)}`);
      emit({ type: 'output', text: clean });
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[${sessionId.slice(0,8)}] Claude exited with code ${exitCode}`);
    session.status = exitCode === 0 ? 'completed' : 'failed';
    session.done = true;
    emit({ type: 'done', code: exitCode, status: session.status });

    const hist = sessionHistory.get(id);
    if (hist) {
      const h = hist.find(s => s.id === sessionId);
      if (h) h.status = session.status;
    }

    setTimeout(() => activeSessions.delete(sessionId), 60000);
  });

  activeSessions.set(sessionId, session);

  if (!sessionHistory.has(id)) sessionHistory.set(id, []);
  sessionHistory.get(id).unshift({
    id: sessionId, prompt: prompt.substring(0, 100),
    agent: agent || null, timestamp: Date.now(), status: 'running'
  });
  if (sessionHistory.get(id).length > 20) sessionHistory.set(id, sessionHistory.get(id).slice(0, 20));

  res.json({ sessionId });
});

app.get('/api/v1/projects/:id/sessions', (req, res) => {
  const { id } = req.params;
  if (!projects[id]) return res.status(404).json({ error: 'Project not found' });
  res.json({ sessions: sessionHistory.get(id) || [] });
});

app.post('/api/v1/sessions/:sessionId/stop', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  try {
    session.process.kill();
    session.status = 'stopped';
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

wss.on('connection', (ws, req) => {
  const sessionId = req.url?.split('/').pop();
  if (!sessionId || !activeSessions.has(sessionId)) {
    ws.close(1000, 'Invalid session ID');
    return;
  }

  const session = activeSessions.get(sessionId);
  session.ws = ws;
  console.log(`[${sessionId.slice(0,8)}] WS connected (buffered: ${session.buffer.length} msgs)`);

  // Replay buffered messages
  for (const msg of session.buffer) {
    ws.send(JSON.stringify(msg));
  }
  session.buffer = [];

  ws.on('close', () => {
    console.log(`[${sessionId.slice(0,8)}] WS disconnected`);
    session.ws = null;
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  for (const [, session] of activeSessions) {
    if (session.process) session.process.kill();
  }
  server.close(() => process.exit(0));
});

server.listen(PORT, () => {
  console.log(`🚀 Mission Control API running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws/:sessionId`);
  console.log('🌍 Projects:', Object.keys(projects).join(', '));
});
