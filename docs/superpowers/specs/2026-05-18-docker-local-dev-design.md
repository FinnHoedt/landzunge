# Docker Local Development Setup

**Date:** 2026-05-18  
**Branch:** 15-chore-setup-docker-for-local-development

## Goal

Run all three services (frontend, admin, backend) locally with hot reload via a single `docker compose up` command.

## Architecture

Single `docker-compose.yml` at repo root. Three services on one internal Docker network (`landzunge-dev`). No dev Dockerfiles — all use `node:24-alpine` base image directly. Production `backend/Dockerfile` is untouched.

```
browser
  ├─ http://localhost:5173  → frontend container (vite dev)
  │     └─ /api/*  proxy → backend:3000
  ├─ http://localhost:5174  → admin container (vite dev)
  │     └─ /api/*  proxy → backend:3000
  └─ http://localhost:3000  → backend container (nest start --watch)
```

Each service mounts its own directory as a bind volume. `node_modules` live on the host Mac and are visible to the container via the same mount — no installation inside containers.

## Files Changed

### New: `docker-compose.yml` (repo root)

Three services:

- **frontend** — image `node:24-alpine`, mounts `./frontend`, runs `npm run dev -- --host`, port `5173:5173`, `env_file: ./frontend/.env`
- **admin** — image `node:24-alpine`, mounts `./admin`, runs `npm run dev -- --host`, port `5174:5174`, `env_file: ./admin/.env`
- **backend** — image `node:24-alpine`, mounts `./backend`, runs `npm run start:dev`, port `3000:3000`, `env_file: ./backend/.env`, env `CHOKIDAR_USEPOLLING=true`

All three on network `landzunge-dev`.

### Edit: `frontend/vite.config.js`

Add to `defineConfig`:
```js
server: {
  proxy: { '/api': 'http://backend:3000' },
  watch: { usePolling: true },
}
```

### Edit: `admin/vite.config.js`

Same addition as frontend.

## Environment Variables

**`backend/.env`** — add:
```
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

**`frontend/.env`** — needs Supabase keys (frontend calls Supabase directly for the guestbook). No `VITE_API_URL` needed. Copy from root `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**`admin/.env`** — no vars needed for dev (proxy handles `/api/*`). File must exist (can be empty).

## File Watching

- **Backend:** `nest start --watch` uses chokidar. `CHOKIDAR_USEPOLLING=true` set in compose env for reliable macOS bind-mount watching.
- **Frontend/Admin:** Vite `server.watch.usePolling: true` added to both vite configs. Only active during `vite dev`, no effect on production builds.

## Workflow

```bash
# First time — install deps on host per service:
cd frontend && npm install
cd admin && npm install
cd backend && npm install

# Start all services:
docker compose up

# Stop:
docker compose down
```

## Out of Scope

- Production Dockerfile changes
- Makefile / convenience wrappers
- Supabase local emulation
