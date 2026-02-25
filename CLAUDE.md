# CLAUDE.md — Alice Mission Control

## Project Overview

**Alice Mission Control** is a cyberpunk-themed 3D dashboard for managing AI agent projects. Built with React 19, Three.js (React Three Fiber), and a Node.js backend with PostgreSQL.

**Live:** https://alice.gonzaloacosta.me

## Architecture

```
Browser → Cloudflare → Caddy (:80/443) → nginx container (:4445) [static]
                                        → API server (:4446) [REST + WS]
                                        → PostgreSQL (:5432) [chat persistence]
```

### Key Services
- **Frontend**: React + R3F, served by nginx in Docker (port 4445)
- **API Server**: Node.js + Express (port 4446), runs as systemd service `mission-control-api`
- **Database**: PostgreSQL 16 in Docker, DB `alice_mc`
- **News**: `/data/news.json` mounted as Docker volume, updated by OpenClaw cron

### Tech Stack
- React 19 + TypeScript + Vite
- Three.js via React Three Fiber + Drei
- Zustand (state), Tailwind CSS 4
- xterm.js + node-pty (terminal)
- Express 5 + ws (WebSocket)
- PostgreSQL 16, Docker Compose

## Project Structure

- `src/components/scene/` — 3D solar system (planets = projects, moons = agents)
- `src/components/hud/` — HUD panels (Chat, News, Logs, Terminal, Settings)
- `src/components/layout/` — Sidebar + MainLayout
- `src/store/index.ts` — Zustand store (projects, events, chat state)
- `src/types/index.ts` — TypeScript types
- `server/` — Express API + WebSocket + PostgreSQL
- `server/config.js` — Project directory mapping

## Commands

```bash
npm run dev          # Dev server with HMR (port 4444)
npx vite build       # Production build (skip tsc, has pre-existing type errors in mock.ts)
docker compose up -d --build  # Rebuild + deploy
sudo systemctl restart mission-control-api  # Restart API server
```

## Important Notes

- Use `npx vite build` (NOT `npm run build`) — mock.ts has pre-existing TS errors
- The nginx container serves static files only; API/WS go through Caddy to :4446
- `server/config.js` maps project IDs to directories for Claude CLI integration
- Git author: Gonzalo Acosta <gonzaloacostapeiro@gmail.com>
- All project repos live in `/home/alice/github/`
