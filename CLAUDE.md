# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A deadpan heritage/tourism site for "Finn's Landzunge" — a grassy lakeside promontory in Leipzig, Saxony. Presents a real Google Maps landmark as a genuine protected natural monument. The humor is in the straight-faced presentation. Rebuilt with 90s Geocities-inspired aesthetic: retro VT323 font accents, scanline texture, styled scrollbar, real guestbook (Supabase), and sound (dial-up modem on first click → ambient lake loop).

## Commands

```bash
npm run dev      # local dev server at localhost:5173
npm run build    # production build → dist/
npm run preview  # preview built output
```

## Architecture

**Vite + vanilla JS, no framework.** Deployed via GitHub Actions → GitHub Pages.

```
src/
  main.js       # entry: calls initI18n(), initSound(), initGuestbook()
  i18n.js       # EN/DE language toggle (data-en/data-de attributes + localStorage)
  sound.js      # dial-up on first click → ambient lake loop; toggle persists
  guestbook.js  # Supabase read/write, DOM render, 1hr rate limit
  supabase.js   # createClient() with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
public/sounds/
  dialup.mp3         # gitignored — source from freesound.org
  lake-ambient.mp3   # gitignored — source from freesound.org
```

## i18n

All user-visible text has `data-en` and `data-de` attributes. English text is the visible fallback. `applyLang(lang)` in `i18n.js` swaps `innerHTML` on every `[data-en]`/`[data-de]` element, updates `<html lang>`, `document.title`, the toggle label, and persists to `localStorage`.

**Important:** Vite's HTML parser (parse5) chokes on Unicode curly quotes (`"` `"` `„`) inside HTML attribute values. Use HTML entities instead: `&ldquo;` `&rdquo;` `&bdquo;`.

## Guestbook (Supabase)

Table: `guestbook_entries` (id uuid, name text, message text, created_at timestamptz). RLS: anon can SELECT + INSERT. Env vars needed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — copy `.env.example` → `.env`. Add the same vars as GitHub repo secrets for the Actions deploy.

## Sound

Both audio files must exist in `public/sounds/` for sound to work. Browser autoplay policy: first user click triggers dial-up, ambient follows after dial-up ends. Sound toggle at top-right persists via `localStorage`.

## Design Conventions

- **Palette:** background `#f8f5f0`, text `#2c2c2c`, accent/green `#4a5c4e`, muted `#5a5a5a`
- **Fonts:** Playfair Display (headings), Georgia/serif (body), VT323 (retro accents: counter, timestamps, guestbook button)
- **Layout:** centered, max-width 680px, thin `<hr class="divider">` between sections
- Tone: deadpan-serious heritage bureaucratic prose throughout

## Fonts

Fonts are self-hosted via `@fontsource` npm packages (Orbitron, Rajdhani, VT323). Vite bundles the woff2 files at build time — no external font CDN requests. Do NOT add Google Fonts `<link>` tags or `@import url('fonts.googleapis.com/...')` back — loading fonts from Google's CDN sends user IPs to Google, which violates GDPR under German law (LG München ruling, Jan 2022).

## Privacy / GDPR

- **No cookie banner needed:** `localStorage` is used only for language preference and sound toggle — both are strictly necessary functional storage, not tracking. EU ePrivacy Directive exempts these from consent requirements.
- **No external tracking:** No analytics, ad pixels, or third-party cookies. Keep it this way.
- **Self-hosted fonts:** See above. Any future third-party resource that phones home (fonts, analytics, embeds) needs GDPR evaluation before adding.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds on push to `main` and deploys `dist/` to GitHub Pages with `cname: finnslandzunge.com`. Secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in repo settings.
