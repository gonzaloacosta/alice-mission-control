import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { validateProjects } from './config.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 4446;

// Store active sessions
const activeSessions = new Map();
const sessionHistory = new Map(); // projectId -> sessions[]

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize projects config
const projects = validateProjects();
console.log('Available projects:', Object.keys(projects));

// Routes

// Get all projects with their agents
app.get('/api/v1/projects', (req, res) => {
  const projectList = Object.entries(projects).map(([id, config]) => ({
    id,
    name: id.toUpperCase(),
    dir: config.dir,
    agents: config.agents
  }));
  
  res.json({ projects: projectList });
});

// Send a prompt to a project
app.post('/api/v1/projects/:id/prompt', async (req, res) => {
  const { id } = req.params;
  const { prompt, agent } = req.body;

  if (!projects[id]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const sessionId = uuidv4();
  const projectConfig = projects[id];
  
  try {
    // Build claude command
    const claudeArgs = [
      '--dangerously-skip-permissions',
      '-p', prompt,
      '--project-dir', projectConfig.dir,
      '--output-format', 'stream-json'
    ];
    
    // Add agent if specified and valid
    if (agent && projectConfig.agents.includes(agent)) {
      claudeArgs.push('--agent', agent);
    }

    console.log(`Starting Claude session ${sessionId} for ${id}:`, claudeArgs.join(' '));

    // Spawn claude process
    const claudeProcess = spawn('claude', claudeArgs, {
      cwd: projectConfig.dir,
      stdio: 'pipe'
    });

    // Store session info
    const sessionInfo = {
      id: sessionId,
      projectId: id,
      agent: agent || null,
      prompt,
      timestamp: Date.now(),
      status: 'running',
      process: claudeProcess
    };

    activeSessions.set(sessionId, sessionInfo);

    // Track in history
    if (!sessionHistory.has(id)) {
      sessionHistory.set(id, []);
    }
    sessionHistory.get(id).unshift({
      id: sessionId,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      agent: agent || null,
      timestamp: Date.now(),
      status: 'running'
    });

    // Keep only last 20 sessions per project
    if (sessionHistory.get(id).length > 20) {
      sessionHistory.set(id, sessionHistory.get(id).slice(0, 20));
    }

    res.json({ sessionId });

  } catch (error) {
    console.error('Error starting Claude session:', error);
    res.status(500).json({ error: 'Failed to start Claude session' });
  }
});

// Get recent sessions for a project
app.get('/api/v1/projects/:id/sessions', (req, res) => {
  const { id } = req.params;
  
  if (!projects[id]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const sessions = sessionHistory.get(id) || [];
  res.json({ sessions });
});

// Stop a session
app.post('/api/v1/sessions/:sessionId/stop', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    session.process.kill('SIGTERM');
    session.status = 'stopped';
    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

// WebSocket handling
wss.on('connection', (ws, req) => {
  const sessionId = req.url?.split('/').pop();
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    ws.close(1000, 'Invalid session ID');
    return;
  }

  const session = activeSessions.get(sessionId);
  console.log(`WebSocket connected for session ${sessionId}`);

  // Handle claude process output
  if (session.process) {
    // Handle stdout (main output)
    session.process.stdout.on('data', (data) => {
      const text = data.toString();
      
      try {
        // Try to parse as stream-json format
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            // Forward the parsed JSON to the client
            ws.send(JSON.stringify({
              type: 'stream',
              data: parsed
            }));
          } catch (parseError) {
            // If not valid JSON, send as plain text
            if (line.trim()) {
              ws.send(JSON.stringify({
                type: 'output',
                text: line
              }));
            }
          }
        }
      } catch (error) {
        // Fallback: send as plain text
        ws.send(JSON.stringify({
          type: 'output',
          text: text
        }));
      }
    });

    // Handle stderr (errors)
    session.process.stderr.on('data', (data) => {
      ws.send(JSON.stringify({
        type: 'error',
        text: data.toString()
      }));
    });

    // Handle process completion
    session.process.on('close', (code) => {
      console.log(`Claude process ${sessionId} exited with code ${code}`);
      
      session.status = code === 0 ? 'completed' : 'failed';
      
      ws.send(JSON.stringify({
        type: 'done',
        code,
        status: session.status
      }));

      // Update session history
      if (sessionHistory.has(session.projectId)) {
        const sessions = sessionHistory.get(session.projectId);
        const historySession = sessions.find(s => s.id === sessionId);
        if (historySession) {
          historySession.status = session.status;
        }
      }

      // Clean up after a delay
      setTimeout(() => {
        activeSessions.delete(sessionId);
      }, 30000); // Keep for 30 seconds for any remaining cleanup
    });

    session.process.on('error', (error) => {
      console.error(`Claude process ${sessionId} error:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        text: `Process error: ${error.message}`
      }));
    });
  }

  // Handle WebSocket close
  ws.on('close', () => {
    console.log(`WebSocket disconnected for session ${sessionId}`);
  });
});

// Error handling
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  
  // Kill all active claude processes
  for (const [sessionId, session] of activeSessions) {
    if (session.process) {
      console.log(`Killing claude process ${sessionId}`);
      session.process.kill('SIGTERM');
    }
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Mission Control API running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws/:sessionId`);
  console.log('🌍 Projects:', Object.keys(projects).join(', '));
});