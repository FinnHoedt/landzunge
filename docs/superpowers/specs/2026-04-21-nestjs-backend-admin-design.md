# NestJS Backend & Admin Dashboard Design

**Date:** 2026-04-21
**Status:** Approved

## Overview

Introduce a NestJS backend as the sole Supabase client, replacing direct browser-to-Supabase calls in the vanilla JS frontend. Add a React admin dashboard served by NestJS for managing guestbook entries and authoring "dispatches" (short heritage-style blog posts). All three parts live in the same git repo as flat directories.

## Repository Structure

```
landzunge/
  frontend/          # existing Vite + vanilla JS → GitHub Pages
  backend/           # NestJS → Docker on VPS
  admin/             # React + Vite → served as static files by NestJS
  .github/workflows/
    deploy-frontend.yml   # builds frontend/, deploys to GitHub Pages
    deploy-backend.yml    # builds Docker image, deploys to VPS
```

## Architecture

```
Browser (GitHub Pages — finnslandzunge.com)
  └─→ NestJS API  (api.finnslandzunge.com)
        └─→ Supabase

Admin SPA (admin.finnslandzunge.com — served by NestJS)
  └─→ NestJS API  (api.finnslandzunge.com)
        └─→ Supabase
```

- `finnslandzunge.com` → GitHub Pages (existing CNAME, unchanged)
- `api.finnslandzunge.com` → VPS A record
- `admin.finnslandzunge.com` → VPS A record

NestJS holds the Supabase **service role key** — never exposed to the browser. The frontend's `@supabase/supabase-js` dependency and `VITE_SUPABASE_*` env vars are removed entirely.

## NestJS Backend

### Module Structure

```
backend/
  src/
    auth/          # Supabase JWT validation, admin role guard
    guestbook/     # entries CRUD, image approval
    dispatches/    # blog posts CRUD
    storage/       # image proxy (serves guestbook images)
    app.module.ts
    main.ts
  Dockerfile
  .env            # SUPABASE_URL, SUPABASE_SERVICE_KEY
```

### API Surface

**Public (no auth):**
```
GET  /api/guestbook          # paginated entries (approved images only)
POST /api/guestbook          # submit entry + image upload (multipart/form-data)
GET  /api/dispatches         # list published posts (teaser fields)
GET  /api/dispatches/:slug   # full post
```

**Admin (Supabase JWT + admin role required):**
```
PATCH  /api/guestbook/:id/approve-image
DELETE /api/guestbook/:id
POST   /api/dispatches
PATCH  /api/dispatches/:id
DELETE /api/dispatches/:id
```

### Auth

- Admin logs in via Supabase Auth in the admin SPA → receives a JWT
- JWT sent as `Authorization: Bearer <token>` on all admin requests
- NestJS validates JWT with Supabase, checks an `admins` table for the user's ID
- Non-admin authenticated users are rejected with 403

### Rate Limiting

Server-side rate limiting on `POST /api/guestbook` (1 submission per IP per hour). The existing localStorage check in the frontend stays as a UX nicety only.

## Frontend Changes

**Removed:**
- `src/supabase.js`
- `@supabase/supabase-js` dependency
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars

**Changed:**
- `guestbook.js` replaces Supabase calls with `fetch('https://api.finnslandzunge.com/api/guestbook')`
- Image uploads become `multipart/form-data` POST to the API

**Added:**
- Dispatches teaser section on `index.html` — 3 most recent published posts (title, date, first line), heritage aesthetic
- New `dispatches.html` — full post list, same styling, linked from teaser

i18n, sound, and all other systems are untouched.

## Admin Dashboard

### Structure

```
admin/
  src/
    pages/
      Login.jsx           # Supabase Auth login form
      GuestbookPage.jsx   # list entries, approve/reject images, delete
      DispatchesPage.jsx  # list posts, create/edit/delete
      EditorPage.jsx      # Tiptap rich text editor for post content
    components/
      ProtectedRoute.jsx  # redirects to login if no valid session
      Layout.jsx          # sidebar nav
    lib/
      supabaseClient.js   # Supabase Auth only (no DB/storage calls)
      api.js              # fetch wrapper for api.finnslandzunge.com
  vite.config.js
```

### Key Points

- Supabase client is **auth-only** — login/session management, no DB or storage access
- After login, all data fetching goes through NestJS with JWT as Bearer token
- Tiptap rich text editor for dispatches — outputs HTML stored in Supabase via NestJS
- NestJS serves built `admin/dist/` as static files at `admin.finnslandzunge.com`
- Styling: functional and minimal, does not need to match the heritage aesthetic

## Docker & Deployment

### Dockerfile

```dockerfile
FROM node:24-alpine AS admin-build
WORKDIR /admin
COPY admin/package*.json ./
RUN npm ci
COPY admin/ ./
RUN npm run build

FROM node:24-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=admin-build /admin/dist ./public/admin
CMD ["node", "dist/main.js"]
```

### GitHub Actions

- `deploy-frontend.yml` — builds `frontend/`, deploys to GitHub Pages (path updated from root to `frontend/`)
- `deploy-backend.yml` — on push to `main`, builds Docker image, SSHs into VPS, pulls and restarts container

### VPS Setup

- nginx reverse proxy handling `api.finnslandzunge.com` and `admin.finnslandzunge.com`
- Certbot (Let's Encrypt) SSL for both subdomains
- `.env` on VPS with `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

## Supabase Changes

- Add `admins` table: `(id uuid references auth.users, created_at timestamptz)`
- Add `dispatches` table: `(id uuid, slug text unique, title text, body html, published bool, created_at timestamptz)`
- RLS on `guestbook_entries` tightened — anon SELECT/INSERT removed, all access goes through service role via NestJS

## Out of Scope

- No multi-tenancy or user registration
- No comments on dispatches
- No image management beyond guestbook approval
- No analytics
