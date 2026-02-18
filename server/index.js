import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { validateProjects } from './config.js';
import pty from 'node-pty';
import { initDb, saveMessage, getMessages, deleteMessages, testConnection, closeDb, getBoard, getAllCards, createCard, updateCard, moveCard, deleteCard, initKanban } from './db.js';
import { createProject } from './create-project.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 4446;

const activeSessions = new Map();
const sessionHistory = new Map();

// Terminal sessions (separate from claude sessions)
const terminalSessions = new Map();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const projects = validateProjects();
console.log('Available projects:', Object.keys(projects));

// Strip ANSI escape codes
function stripAnsi(str) {
  return str
    // Standard ANSI escapes
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, '')
    .replace(/\x1B\[\?[0-9;]*[A-Za-z]/g, '')
    .replace(/\x1B\[<[a-zA-Z]/g, '')
    .replace(/\x1B[()][0-9A-Za-z]/g, '')
    .replace(/\x1B[>=<]/g, '')
    // Carriage returns and other control chars
    .replace(/\r/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
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

// --- Create Project API ---
app.post('/api/v1/projects/create', async (req, res) => {
  const { name, idea } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Project name is required (min 2 chars)' });
  }
  if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
    return res.status(400).json({ error: 'Project idea is required (min 10 chars)' });
  }

  console.log(`[create] Creating project: ${name}`);

  try {
    const result = await createProject({ name: name.trim(), idea: idea.trim() });
    console.log(`[create] Project created: ${result.slug} (${result.steps.length} steps)`);
    res.json(result);
  } catch (error) {
    console.error(`[create] Failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Terminal API ---
app.post('/api/v1/terminal', (req, res) => {
  const sessionId = uuidv4();
  const shell = pty.spawn('bash', [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || '/home/alice',
    env: { ...process.env, TERM: 'xterm-256color' }
  });
  terminalSessions.set(sessionId, { id: sessionId, pty: shell, createdAt: Date.now(), ws: null });
  console.log(`[terminal] Created session ${sessionId.slice(0,8)}`);
  res.json({ sessionId });
});

app.get('/api/v1/terminal/sessions', (req, res) => {
  const sessions = [];
  for (const [id, s] of terminalSessions) {
    sessions.push({ id, createdAt: s.createdAt });
  }
  res.json({ sessions });
});

app.delete('/api/v1/terminal/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = terminalSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Not found' });
  try { session.pty.kill(); } catch {}
  terminalSessions.delete(sessionId);
  console.log(`[terminal] Killed session ${sessionId.slice(0,8)}`);
  res.json({ success: true });
});

// --- Chat Messages API ---
app.get('/api/v1/chat/:projectId/:agentName', async (req, res) => {
  const { projectId, agentName } = req.params;
  const limit = parseInt(req.query.limit) || 100;
  
  if (!projects[projectId]) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  try {
    const messages = await getMessages(projectId, agentName, limit);
    res.json({ messages });
  } catch (error) {
    console.error(`[chat] Failed to get messages for ${projectId}:${agentName}:`, error.message);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

app.post('/api/v1/chat/:projectId/:agentName', async (req, res) => {
  const { projectId, agentName } = req.params;
  const { role, content } = req.body;
  
  if (!projects[projectId]) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  if (!role || !content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Role and content are required' });
  }
  
  if (!['user', 'assistant', 'error'].includes(role)) {
    return res.status(400).json({ error: 'Role must be user, assistant, or error' });
  }
  
  try {
    const result = await saveMessage(projectId, agentName, role, content);
    res.json({ 
      id: `db-${result.id}`,
      timestamp: new Date(result.created_at).getTime(),
      success: true 
    });
  } catch (error) {
    console.error(`[chat] Failed to save message for ${projectId}:${agentName}:`, error.message);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.delete('/api/v1/chat/:projectId/:agentName', async (req, res) => {
  const { projectId, agentName } = req.params;
  
  if (!projects[projectId]) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  try {
    const deletedCount = await deleteMessages(projectId, agentName);
    res.json({ success: true, deletedCount });
  } catch (error) {
    console.error(`[chat] Failed to delete messages for ${projectId}:${agentName}:`, error.message);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

// ─── Kanban API ───

app.get('/api/v1/kanban/all', async (req, res) => {
  try {
    // Init boards for all known projects
    for (const pid of Object.keys(projects)) {
      await initKanban(pid);
    }
    const data = await getAllCards();
    res.json(data);
  } catch (error) {
    console.error('[kanban] Failed to get all cards:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/kanban/:projectId', async (req, res) => {
  try {
    const board = await getBoard(req.params.projectId);
    res.json(board);
  } catch (error) {
    console.error('[kanban] Failed to get board:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/kanban/:projectId/cards', async (req, res) => {
  const { column, title, description, assignee, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const card = await createCard(req.params.projectId, column, title, description, assignee, priority);
    res.json(card);
  } catch (error) {
    console.error('[kanban] Failed to create card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/v1/kanban/cards/:cardId', async (req, res) => {
  try {
    const card = await updateCard(parseInt(req.params.cardId), req.body);
    res.json(card);
  } catch (error) {
    console.error('[kanban] Failed to update card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/v1/kanban/cards/:cardId', async (req, res) => {
  try {
    const ok = await deleteCard(parseInt(req.params.cardId));
    res.json({ success: ok });
  } catch (error) {
    console.error('[kanban] Failed to delete card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/kanban/:projectId/sync-notion', async (req, res) => {
  // Placeholder for Notion sync
  res.json({ status: 'not_implemented', message: 'Notion sync coming soon' });
});

wss.on('connection', (ws, req) => {
  // Handle terminal WebSocket connections
  const termMatch = req.url?.match(/\/ws\/terminal\/(.+)/);
  if (termMatch) {
    const sessionId = termMatch[1];
    const session = terminalSessions.get(sessionId);
    if (!session) { ws.close(1000, 'Invalid terminal session'); return; }
    session.ws = ws;
    console.log(`[terminal] WS connected ${sessionId.slice(0,8)}`);

    session.pty.onData((data) => {
      if (ws.readyState === 1) ws.send(data);
    });

    ws.on('message', (msg) => {
      const str = msg.toString();
      try {
        const parsed = JSON.parse(str);
        if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
          session.pty.resize(parsed.cols, parsed.rows);
          return;
        }
      } catch {}
      session.pty.write(str);
    });

    ws.on('close', () => {
      console.log(`[terminal] WS disconnected ${sessionId.slice(0,8)}`);
      session.ws = null;
      // Kill PTY on disconnect
      try { session.pty.kill(); } catch {}
      terminalSessions.delete(sessionId);
    });
    return;
  }
  // Handle claude session WebSocket connections
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

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  for (const [, session] of activeSessions) {
    if (session.process) session.process.kill();
  }
  await closeDb();
  server.close(() => process.exit(0));
});

// Initialize database and start server
async function startServer() {
  try {
    await testConnection();
    await initDb();
    
    server.listen(PORT, () => {
      console.log(`🚀 Mission Control API running on port ${PORT}`);
      console.log(`📡 WebSocket: ws://localhost:${PORT}/ws/:sessionId`);
      console.log('🌍 Projects:', Object.keys(projects).join(', '));
      console.log('💾 PostgreSQL chat persistence enabled');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
