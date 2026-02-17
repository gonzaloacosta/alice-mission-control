# Interactive Chat Feature - Mission Control Pro

## Overview

This feature adds the ability to click on a planet, focus the camera on it, and send Claude Code prompts to agents within each project. The system consists of a backend API server and frontend React components.

## Architecture

### Backend API Server (Port 4446)

Located in `/server/` directory:

- **Express API**: REST endpoints for project management and prompt execution
- **WebSocket Server**: Real-time streaming of Claude Code output
- **Project Config**: Maps project IDs to directories and available agents

#### Key Files:
- `server/index.js` - Main server with Express + WebSocket
- `server/config.js` - Project configuration and agent discovery
- `server/package.json` - Dependencies (express, ws, cors, uuid)

#### API Endpoints:
- `GET /api/v1/projects` - List all projects with their agents
- `POST /api/v1/projects/:id/prompt` - Send a prompt, returns session ID
- `GET /api/v1/projects/:id/sessions` - List recent sessions
- `POST /api/v1/sessions/:sessionId/stop` - Stop a running session
- `WebSocket /ws/:sessionId` - Stream Claude Code output in real-time

### Frontend Changes

#### New Components:
- `ChatPanel.tsx` - Right-side chat interface with streaming support
- `CameraController.tsx` - Smooth camera animation for planet focusing

#### Updated Components:
- `SolarSystem.tsx` - Added planet click handlers and focus indicators
- `store/index.ts` - Extended Zustand store with chat state
- `App.tsx` - Added ChatPanel to the main layout

#### State Management:
New Zustand store properties:
```typescript
focusedProjectId: string | null;
isChatOpen: boolean;
selectedAgent: string | null;
chatMessages: Record<string, ChatMessage[]>;
isStreaming: boolean;
currentSessionId: string | null;
```

### User Flow

1. **Click Planet** → Triggers `focusProject()` and `openChat()`
2. **Camera Animation** → Smooth transition to focus on the selected planet
3. **Chat Panel Opens** → Slides in from the right (full-width on mobile)
4. **Agent Selection** → Dropdown populated from `.claude/agents/` directory
5. **Send Message** → Creates API request to start Claude Code session
6. **WebSocket Stream** → Real-time output appears in chat
7. **Close Chat** → Returns camera to overview mode

## Technical Details

### Claude Code Integration

The backend spawns Claude Code CLI processes:
```bash
claude --dangerously-skip-permissions -p "prompt" --project-dir /path/to/project [--agent agentname] --output-format stream-json
```

### WebSocket Protocol

Messages sent to clients:
```javascript
{ type: "stream", data: {...} }      // Structured streaming data
{ type: "output", text: "..." }     // Plain text output
{ type: "error", text: "..." }      // Error messages
{ type: "done", code: 0 }           // Process completion
```

### Project Configuration

Projects are auto-discovered from the config in `server/config.js`:
```javascript
const PROJECTS = {
  cid: { dir: '/home/alice/github/cid', agents: ['backend', 'devops', ...] },
  vpn: { dir: '/home/alice/github/vpn-project', agents: [] },
  // ...
};
```

Agents are automatically discovered from `.claude/agents/` directories when available.

## Development

### Starting the Backend
```bash
cd server/
npm install
npm start  # Runs on port 4446
```

### Starting the Frontend
```bash
npm run dev  # Runs on port 4444 with API proxy
```

### Production Deployment

The backend runs natively (not dockerized) to access Claude CLI and host filesystem:
```bash
cd server/
npm install
npm start &
```

Frontend is built and served via Docker + Caddy.

## Configuration Files Updated

### Vite Config (`vite.config.ts`)
Added proxy configuration for `/api` and `/ws` routes.

### Caddy Config (`/etc/caddy/Caddyfile`)
```
handle /api/v1/* {
    reverse_proxy localhost:4446
}
handle /ws/* {
    reverse_proxy localhost:4446
}
```

## Styling

Chat panel matches the cyberpunk theme:
- Background: `#0a0a2e/90` with backdrop blur
- Text: `#00f0ff` (cyan) for headers, `#e0e0ff` for content
- Borders: `#00f0ff/20` semi-transparent cyan
- Monospace font for code blocks
- Mobile responsive (full-width overlay)

## Features

- ✅ Planet click → camera focus animation
- ✅ Real-time Claude Code streaming
- ✅ Agent selection dropdown
- ✅ Chat history per project
- ✅ Error handling and display
- ✅ Stop button for running processes
- ✅ Mobile-responsive design
- ✅ WebSocket connection management
- ✅ Session tracking and cleanup

## Testing

Test the basic workflow:
1. Start backend: `cd server && npm start`
2. Start frontend: `npm run dev`
3. Click on the CID planet
4. Select an agent (if available)
5. Send prompt: "what files are in this project?"
6. Observe streaming response

The system gracefully handles Claude CLI errors and connection issues.