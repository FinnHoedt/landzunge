# Docker Local Development Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `docker-compose.yml` at repo root so all three services start with hot reload via `docker compose up`.

**Architecture:** Single compose file, three services on a shared `landzunge-dev` network. Frontend and admin run Vite dev servers with `/api` proxied to the backend container. Backend runs `nest start --watch` with chokidar polling enabled.

**Tech Stack:** Docker Compose, Node 24 Alpine, Vite, NestJS

---

### Task 1: Prepare environment files

**Files:**
- Modify: `backend/.env`
- Modify: `frontend/.env`

- [ ] **Step 1: Add PORT and CORS_ORIGINS to `backend/.env`**

Open `backend/.env` and ensure these two lines are present (add them if missing):

```
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

- [ ] **Step 2: Create `frontend/.env` with Supabase keys**

Run from repo root:

```bash
grep VITE_SUPABASE .env > frontend/.env
```

Verify `frontend/.env` now contains:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`.env` files are gitignored — no commit needed for this task.

---

### Task 2: Add Vite proxy and watch polling to frontend

**Files:**
- Modify: `frontend/vite.config.js`

- [ ] **Step 1: Replace `frontend/vite.config.js` with the following**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        dispatches: 'dispatches.html',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://backend:3000',
    },
    watch: {
      usePolling: true,
    },
  },
})
```

`server.proxy` only activates during `vite dev` — production builds are unaffected. `usePolling` is required for reliable file watching on macOS Docker bind mounts.

- [ ] **Step 2: Verify dev server still starts on host (optional sanity check)**

```bash
cd frontend && npm run dev
```

Expected: Vite starts at `http://localhost:5173`. Ctrl-C to stop.

- [ ] **Step 3: Commit**

```bash
git add frontend/vite.config.js
git commit -m "chore: add dev proxy and polling for docker local dev"
```

---

### Task 3: Add Vite proxy and watch polling to admin

**Files:**
- Modify: `admin/vite.config.js`

- [ ] **Step 1: Replace `admin/vite.config.js` with the following**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    proxy: {
      '/api': 'http://backend:3000',
    },
    watch: {
      usePolling: true,
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add admin/vite.config.js
git commit -m "chore: add dev proxy and polling for docker local dev"
```

---

### Task 4: Create docker-compose.yml

**Files:**
- Create: `docker-compose.yml` (repo root)

- [ ] **Step 1: Create `docker-compose.yml` at repo root**

```yaml
services:
  backend:
    image: node:24-alpine
    working_dir: /app
    volumes:
      - ./backend:/app
    command: npm run start:dev
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    environment:
      CHOKIDAR_USEPOLLING: "true"
    networks:
      - landzunge-dev

  frontend:
    image: node:24-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: npm run dev -- --host
    ports:
      - "5173:5173"
    env_file:
      - ./frontend/.env
    depends_on:
      - backend
    networks:
      - landzunge-dev

  admin:
    image: node:24-alpine
    working_dir: /app
    volumes:
      - ./admin:/app
    command: npm run dev -- --host --port 5174
    ports:
      - "5174:5174"
    depends_on:
      - backend
    networks:
      - landzunge-dev

networks:
  landzunge-dev:
    driver: bridge
```

Notes:
- `--host` makes Vite listen on `0.0.0.0` inside the container (required for port mapping to work)
- `--port 5174` makes admin listen on 5174 inside its container to match the host port mapping
- `CHOKIDAR_USEPOLLING=true` enables polling for NestJS file watching on macOS bind mounts
- No `env_file` for admin — no vars needed in local dev
- `node_modules` live on the host Mac; the bind mount makes them visible at `/app/node_modules` inside each container

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add docker-compose for local development"
```

---

### Task 5: Smoke test

- [ ] **Step 1: Ensure host dependencies are installed**

```bash
cd frontend && npm install
cd ../admin && npm install
cd ../backend && npm install
cd ..
```

- [ ] **Step 2: Start all services**

```bash
docker compose up
```

Expected output (all three services): Vite ready messages and NestJS startup log. Example:
```
frontend-1  |   ➜  Local:   http://localhost:5173/
admin-1     |   ➜  Local:   http://localhost:5174/
backend-1   | [Nest] LOG [NestApplication] Nest application successfully started
```

- [ ] **Step 3: Verify services respond**

```bash
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok"} or similar

open http://localhost:5173   # public site
open http://localhost:5174   # admin panel
```

- [ ] **Step 4: Verify hot reload — backend**

Edit any file in `backend/src/` (e.g., add a comment). Watch the compose logs — NestJS should recompile and restart within ~5 seconds.

- [ ] **Step 5: Verify hot reload — frontend**

Edit any file in `frontend/src/` (e.g., change visible text in `index.html`). Browser at `http://localhost:5173` should hot-reload within ~2 seconds.

- [ ] **Step 6: Stop services**

```bash
docker compose down
```

- [ ] **Step 7: Commit smoke test passing (no code change needed — just note in PR)**

If any step above failed, see troubleshooting below before committing.

---

## Troubleshooting

**`env_file not found` error on compose up:**
`backend/.env` or `frontend/.env` doesn't exist. Re-run Task 1.

**`Cannot find module` on backend startup:**
`node_modules` not installed on host. Run `cd backend && npm install`.

**Vite can't connect to backend proxy:**
Backend may still be starting. Wait 10–15 seconds and refresh. Check `docker compose logs backend`.

**Hot reload not triggering:**
If `usePolling: true` in Vite config or `CHOKIDAR_USEPOLLING=true` in compose env is missing, re-check Task 2/3/4 steps.
