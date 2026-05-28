# Finn's Landzunge

A deadpan heritage and tourism site for [Finn's Landzunge](https://finnslandzunge.com) — a grassy lakeside promontory in Leipzig, Saxony, presented as a genuine protected natural monument. Built with an Avant-Garde Brutalist aesthetic: black/white/`#CCFF00` acid green, scroll-snap rooms, live weather data.

**Live site:** https://finnslandzunge.com

---

## Repo layout

```
frontend/   Vite + vanilla JS — the public-facing 4-room site
admin/      Vite app — internal image moderation panel
backend/    NestJS API — guestbook entries, image uploads, Supabase integration
docs/       Additional design and feature documentation
```

---

## Local development (Docker)

Runs all three services with hot reload.

```bash
# 1. Set up environment files
cp backend/.env.example backend/.env   # fill in Supabase credentials
echo "VITE_API_URL=http://localhost:3000" > frontend/.env

# 2. Start everything (~30s on first run)
docker compose up
```

| Service      | URL                    |
|--------------|------------------------|
| Frontend     | http://localhost:5173  |
| Admin        | http://localhost:5174  |
| Backend API  | http://localhost:3000  |

```bash
docker compose down      # stop (volumes persist)
docker compose down -v   # stop and delete volumes (re-runs npm install)
```

Adding or removing npm packages requires `docker compose down -v && docker compose up`.

---

## Local development (without Docker)

**Prerequisite:** create `backend/.env` from `backend/.env.example` and fill in real Supabase credentials. Set `VITE_API_URL=http://localhost:3000` in `frontend/.env`.

Run each package individually:

```bash
# Frontend (localhost:5173)
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run preview

# Admin (localhost:5174)
cd admin && npm run dev

# Backend API (localhost:3000)
cd backend && npm run start:dev   # watch mode
cd backend && npm run build       # compile
cd backend && npm run start       # run compiled output
```

---

## Deployment

| Target   | Trigger                       | How                                               |
|----------|-------------------------------|---------------------------------------------------|
| Frontend | manual (`workflow_dispatch`)  | GitHub Actions builds and pushes to GitHub Pages  |
| Backend  | git tag `v*`                  | Docker image built and pushed to GHCR             |

Secrets required in repo settings: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## Privacy / GDPR

- Fonts are self-hosted via `@fontsource` — no requests to Google Fonts CDN.
- No analytics, ad pixels, or third-party cookies.
- `localStorage` is used only for functional rate-limiting (not tracking) — no cookie banner required.

---

## Further reading

- [`CLAUDE.md`](CLAUDE.md) — architecture notes, room descriptions, guestbook schema, design conventions (for AI tooling and contributors)
- [`DESIGN.md`](DESIGN.md) — visual system, typography, interaction principles
- [`docs/`](docs/) — additional feature and design documentation
