# Mission Control Pro

Real-time 3D agent monitoring dashboard built with React, Vite, Three.js/R3F, and Zustand.

## Architecture

```
Browser → Cloudflare (SSL + Zero Trust) → Caddy → Docker (nginx:alpine, port 4445)
```

- **Frontend**: React + Three.js/R3F + Tailwind CSS — built to static files
- **Serving**: nginx:alpine in Docker (SPA routing via `try_files`)
- **Reverse Proxy**: Caddy on the host
- **Auth**: Cloudflare Zero Trust with Google Auth
- **Domain**: app.gonzaloacosta.me

## Quick Start

### Development

```bash
npm install
npm run dev    # Vite dev server on :5173
```

### Production (Docker)

```bash
# Build and start
sudo docker compose up -d --build

# Verify
curl localhost:4445

# Logs
sudo docker compose logs -f

# Rebuild after changes
sudo docker compose up -d --build
```

## Docker Setup

**Dockerfile** (multi-stage):
1. `node:22-alpine` — install deps + `vite build`
2. `nginx:alpine` — copy `dist/` + custom `nginx.conf` for SPA routing

**docker-compose.yml**: single service mapping `4445:80`, restart `unless-stopped`.

## Project Structure

```
├── Dockerfile
├── docker-compose.yml
├── nginx.conf            # SPA routing config
├── src/
│   ├── components/
│   │   ├── hud/          # 2D overlay panels
│   │   └── scene/        # 3D scene components
│   ├── services/         # Data fetching
│   ├── store/            # Zustand state
│   └── types.ts
├── public/
└── vite.config.ts
```
