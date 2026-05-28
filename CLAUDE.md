# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A deadpan heritage/tourism site for "Finn's Landzunge" — a grassy lakeside promontory in Leipzig, Saxony. Presents a real Google Maps landmark as a genuine protected natural monument. The humor is in the straight-faced presentation. Built with an Avant-Garde Brutalist aesthetic: pure black/white/`#CCFF00` acid green, Inter Black 900 + Space Mono, 4-room scroll-snap experience.

## Commands

```bash
npm run dev      # local dev server at localhost:5173
npm run build    # production build → dist/
npm run preview  # preview built output
```

## Docker Local Development

Runs all three services (frontend, admin, backend) with hot reload via Docker Compose.

```bash
docker compose up        # start all services (first run installs deps, ~30s)
docker compose down      # stop all services (named volumes persist)
docker compose down -v   # stop and remove named volumes (forces fresh npm install)
```

Services:
- Frontend: http://localhost:5173
- Admin: http://localhost:5174
- Backend API: http://localhost:3000

**Required before first run:** create `backend/.env` from `backend/.env.example` and fill in real Supabase credentials. `frontend/.env` needs `VITE_API_URL=http://localhost:3000`.

**Hot reload:** source file edits on host are reflected immediately. Adding/removing npm packages requires `docker compose down -v && docker compose up` to re-run `npm install` inside containers.

## Architecture

**Vite + vanilla JS, no framework.** Deployed via GitHub Actions → GitHub Pages.

```
frontend/
  index.html          # 4-room scroll-snap page
  dispatches.html     # Field dispatches sub-page
  style.css           # All styles — room sections clearly delimited by comments
  src/
    main.js           # entry: wires up room counter, plaque escape, guestbook, weather
    guestbook.js      # canvas guestbook — hash-positioned entries, POST form
    weather.js        # fetches live weather data, renders Room 02
    room-counter.js   # IntersectionObserver-based room progress counter
  public/
    images/           # Room backgrounds: weather.jpg, sliver-1/2/3.jpg, dispatches-hero.jpg
```

## Rooms

- **Room 01** — Entrance: GPS coordinates as headline, blinking `[ ENTER EXHIBITION ]` CTA
- **Room 02** — Weather Monument: screen-filling live WIND / TEMP / WATER data art
- **Room 03** — Exhibition Plaque: two-column layout (scrollable text left, photo slivers right)
- **Room 04** — Visitor Canvas: hash-positioned guestbook entries on black, expand-form strip

## Guestbook

Table: `guestbook_entries` (id uuid, name text, message text, created_at timestamptz, image_path text, image_approved bool). RLS: anon can SELECT + INSERT. Env vars needed: `VITE_API_URL` (frontend), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (backend).

**Image uploads** are handled by the backend only — there is no file input in the public form. Uploaded images are converted to greyscale JPEG (max 600px wide, 72% quality) via `sharp` before storage. Images require admin approval (`image_approved = true`) before appearing on the canvas.

Rate limit: 5 minutes between submissions (client-side `localStorage`).

## Design Conventions

- **Palette:** background `#000`, text `#fff`, accent `#CCFF00` (acid green), muted `#888`
- **Fonts:** Inter Black 900 (headings/display), Space Mono 400 (body/UI) — self-hosted via `@fontsource`
- **Layout:** full-viewport rooms, scroll-snap, no max-width container
- Tone: deadpan-serious heritage bureaucratic prose throughout

## Fonts

Fonts are self-hosted via `@fontsource` npm packages. Vite bundles the woff2 files at build time — no external font CDN requests. Do NOT add Google Fonts `<link>` tags or `@import url('fonts.googleapis.com/...')` back — loading fonts from Google's CDN sends user IPs to Google, which violates GDPR under German law (LG München ruling, Jan 2022).

## Privacy / GDPR

- **No cookie banner needed:** `localStorage` is used only for functional storage (no tracking).
- **No external tracking:** No analytics, ad pixels, or third-party cookies. Keep it this way.
- **Self-hosted fonts:** See above. Any future third-party resource that phones home needs GDPR evaluation before adding.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds on push to `main` and deploys `dist/` to GitHub Pages with `cname: finnslandzunge.com`. Secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in repo settings.
