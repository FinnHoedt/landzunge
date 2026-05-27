# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the neon cyberpunk frontend with an Avant-Garde Brutalist design: pure black/white/acid green, Inter Black + Space Mono typography, B&W grainy photography, 4-room scroll-snap gallery navigation.

**Architecture:** `index.html` becomes a 4-room scroll-snap experience (Entrance → Weather Monument → Exhibition Plaque → Visitor Canvas). `dispatches.html` gets an independent brutalist redesign. No framework — vanilla JS + Vite. i18n, sound, and tracker modules are deleted. CSS and HTML are replaced wholesale; `guestbook.js` and `weather.js` are updated for new DOM targets and simplified.

**Tech Stack:** Vite + vanilla JS, `@fontsource/inter` (900w), `@fontsource/space-mono` (400w), Supabase via existing backend API, CSS scroll-snap, IntersectionObserver.

**Spec:** `docs/superpowers/specs/2026-05-27-frontend-redesign-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `frontend/package.json` | Swap @fontsource packages |
| Replace | `frontend/style.css` | Entire new design system |
| Replace | `frontend/index.html` | 4-room snap structure |
| Replace | `frontend/dispatches.html` | Brutalist dispatches page |
| Modify | `frontend/src/main.js` | Remove deleted modules, add room-counter |
| Modify | `frontend/src/weather.js` | Remove i18n, target new DOM elements |
| Modify | `frontend/src/guestbook.js` | Canvas rendering, hash positioning, new form |
| Modify | `frontend/src/dispatches.js` | Update markup classes for new CSS |
| Create | `frontend/src/room-counter.js` | IntersectionObserver for room counter |
| Create | `frontend/public/images/.gitkeep` | Image directory (user drops files here) |
| Delete | `frontend/src/i18n.js` | No longer needed |
| Delete | `frontend/src/sound.js` | No longer needed |
| Delete | `frontend/src/tracker.js` | No longer needed |

---

## Task 1: Swap font packages

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Update package.json dependencies**

Replace the `dependencies` block entirely:

```json
{
  "name": "landzunge",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@fontsource/inter": "^5.1.0",
    "@fontsource/space-mono": "^5.1.0"
  },
  "devDependencies": {
    "vite": "^6.3.2"
  }
}
```

- [ ] **Step 2: Install new packages, remove old**

```bash
cd frontend
npm install
```

Expected: `node_modules/@fontsource/inter/` and `node_modules/@fontsource/space-mono/` appear. `@fontsource/orbitron`, `@fontsource/rajdhani`, `@fontsource/vt323` are gone from `node_modules`.

- [ ] **Step 3: Verify weight files exist**

```bash
ls frontend/node_modules/@fontsource/inter/900.css
ls frontend/node_modules/@fontsource/space-mono/400.css
```

Expected: both files exist (no "No such file" error).

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): swap fonts to Inter 900 + Space Mono"
```

---

## Task 2: New CSS foundation

**Files:**
- Replace: `frontend/style.css`

This task writes the full new `style.css`. Subsequent tasks will add room-specific rules to it.

- [ ] **Step 1: Replace style.css with the design system foundation**

```css
/* ── Fonts ──────────────────────────────────────────────────── */
@import '@fontsource/inter/900.css';
@import '@fontsource/space-mono/400.css';

/* ── Tokens ─────────────────────────────────────────────────── */
:root {
  --black: #000000;
  --white: #ffffff;
  --acid:  #ccff00;
  --dim:   #888888;
}

/* ── Keyframes ───────────────────────────────────────────────── */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1;   }
}

/* ── Reset ───────────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Snap container ──────────────────────────────────────────── */
/* Uses a wrapper div so scroll-snap doesn't conflict with
   the body on Safari. body stays height: auto. */
.snap-container {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}

/* ── Room base ───────────────────────────────────────────────── */
.room {
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always;   /* prevent skipping rooms on fast swipe */
  position: relative;
  background-color: var(--black);
  overflow: hidden;
}

/* ── Background image layer ──────────────────────────────────── */
/* Applied inside each room; filter only affects the image,
   not the text content above it. */
.room__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #111; /* fallback when image not yet provided */
  filter: grayscale(100%) contrast(1.3) brightness(0.85);
  z-index: 0;
}

/* ── Dark overlay (Room 02 only) ─────────────────────────────── */
.room__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1;
}

/* ── Grain overlay ───────────────────────────────────────────── */
.room__grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  opacity: 0.35;
  pointer-events: none;
  z-index: 2;
}

/* ── Room content wrapper ────────────────────────────────────── */
.room__content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
}

/* ── Room counter (fixed chrome) ─────────────────────────────── */
#room-counter {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: var(--acid);
  letter-spacing: 0.1em;
  z-index: 1000;
  pointer-events: none;
}
```

- [ ] **Step 2: Run dev server and verify no import errors**

```bash
cd frontend && npm run dev
```

Open http://localhost:5173. Expected: blank black page (no content yet), no console errors about missing fonts or CSS.

- [ ] **Step 3: Commit**

```bash
git add frontend/style.css
git commit -m "feat(frontend): new CSS design system foundation"
```

---

## Task 3: index.html — 4-room skeleton

**Files:**
- Replace: `frontend/index.html`

Establishes the 4-room snap structure. Each room has placeholder content so scroll-snap can be verified before content is added.

- [ ] **Step 1: Replace index.html with the room skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Finn's Landzunge — a naturally formed lakeside promontory in Leipzig, Saxony. Coordinates: 51°15′41″N 12°20′22″E. Logged 2019." />
  <link rel="canonical" href="https://finnslandzunge.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Finn's Landzunge — Leipzig, Sachsen" />
  <meta property="og:description" content="A naturally formed lakeside promontory in Leipzig, Saxony. Coordinates: 51°15′41″N 12°20′22″E." />
  <meta property="og:url" content="https://finnslandzunge.com/" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LandmarksOrHistoricalBuildings",
    "name": "Finn's Landzunge",
    "description": "A naturally formed lakeside promontory in Leipzig, Saxony.",
    "url": "https://finnslandzunge.com/",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 51.261389,
      "longitude": 12.339444
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Leipzig",
      "addressRegion": "Saxony",
      "addressCountry": "DE"
    }
  }
  </script>
  <title>Finn's Landzunge — Leipzig, Sachsen</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23000'/><text y='24' font-size='24'>🏔</text></svg>" />
</head>
<body>

  <!-- Room progress counter — only persistent chrome -->
  <div id="room-counter" aria-live="polite" aria-label="Room 1 of 4">01 / 04</div>

  <div class="snap-container">

    <!-- Room 01: Entrance -->
    <section id="room-01" class="room room--entrance"
             aria-label="Entrance — Finn's Landzunge, coordinates 51°15'41″N 12°20'22″E">
      <div class="room__bg room__bg--entrance"></div>
      <div class="room__grain"></div>
      <div class="room__content"><!-- Room 01 content goes here --></div>
    </section>

    <!-- Room 02: Weather Monument -->
    <section id="room-02" class="room room--weather"
             aria-label="Live weather data from Finn's Landzunge">
      <div class="room__bg room__bg--weather"></div>
      <div class="room__overlay"></div>
      <div class="room__grain"></div>
      <div class="room__content"><!-- Room 02 content goes here --></div>
    </section>

    <!-- Room 03: Exhibition Plaque -->
    <section id="room-03" class="room room--plaque"
             aria-label="Exhibition plaque — history, geography, heritage">
      <div class="room__content room__content--plaque"><!-- Room 03 content goes here --></div>
    </section>

    <!-- Room 04: Visitor Canvas -->
    <section id="room-04" class="room room--canvas"
             aria-label="Visitor canvas — log your transmission">
      <div class="room__content"><!-- Room 04 content goes here --></div>
    </section>

  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify scroll-snap works**

Run `npm run dev`. Open http://localhost:5173. Scroll down — the page should snap to 4 distinct full-height black sections. Verify 4 snap stops exist.

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "feat(frontend): 4-room scroll-snap skeleton"
```

---

## Task 4: Room 01 — Entrance

**Files:**
- Modify: `frontend/index.html` (Room 01 content)
- Modify: `frontend/style.css` (Room 01 rules)

- [ ] **Step 1: Add Room 01 HTML content** inside `<div class="room__content">` of `#room-01`

```html
<div class="room__content">
  <!-- Visually hidden h1 for SEO + screen readers -->
  <h1 class="sr-only">Finn's Landzunge</h1>

  <!-- GPS coordinates — the visual headline -->
  <div class="entrance__coords" role="img" aria-label="GPS coordinates: 51 degrees 15 minutes 41 seconds North, 12 degrees 20 minutes 22 seconds East">
    <span>51°15′41″N</span>
    <span>12°20′22″E</span>
  </div>

  <!-- Subtitle label -->
  <p class="entrance__label">FINN'S LANDZUNGE // EXPERIMENTAL PORTFOLIO</p>

  <!-- Entry CTA -->
  <button class="entrance__cta" id="enter-btn" type="button">
    [ ENTER EXHIBITION ]
  </button>
</div>
```

- [ ] **Step 2: Add Room 01 CSS to end of style.css**

```css
/* ══════════════════════════════════════════════════
   ROOM 01 — ENTRANCE
   ══════════════════════════════════════════════════ */

.room__bg--entrance {
  background-image: url('/images/hero.jpg');
}

/* Visually hidden utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.room--entrance .room__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.entrance__coords {
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-size: clamp(3.5rem, 12vw, 10rem);
  line-height: 0.9;
  letter-spacing: -0.03em;
  color: var(--white);
  text-transform: uppercase;
  margin-bottom: 2rem;
}

.entrance__label {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--dim);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0;
}

.entrance__cta {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  border: 1px solid var(--acid);
  color: var(--acid);
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  animation: blink 1s step-end infinite;
  white-space: nowrap;
}

.entrance__cta:hover {
  background: var(--acid);
  color: var(--black);
  animation: none;
}
```

- [ ] **Step 3: Wire the enter button in main.js** (temporary — Task 9 replaces main.js with its final form)

Add to `frontend/src/main.js` after the existing `initI18n()` line (keep other existing calls intact for now):

```js
document.getElementById('enter-btn')?.addEventListener('click', () => {
  document.getElementById('room-02')?.scrollIntoView({ behavior: 'smooth' })
})
```

- [ ] **Step 4: Verify Room 01**

`npm run dev`. Open http://localhost:5173. Verify:
- GPS coordinates display at large scale, centered
- Label text is dim and small beneath
- Green blinking `[ ENTER EXHIBITION ]` button at bottom center
- Background is dark (image placeholder `#111` until photos are added)
- Clicking the button scrolls to Room 02

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/style.css frontend/src/main.js
git commit -m "feat(frontend): Room 01 Entrance layout"
```

---

## Task 5: Room 02 — Weather Monument

**Files:**
- Modify: `frontend/index.html` (Room 02 content)
- Modify: `frontend/style.css` (Room 02 rules)
- Modify: `frontend/src/weather.js` (new DOM targets, remove i18n)

- [ ] **Step 1: Add Room 02 HTML content** inside `<div class="room__content">` of `#room-02`

```html
<div class="room__content">
  <!-- Top-left metadata strip -->
  <div class="wx-meta">
    <span>FINN'S LANDZUNGE // EXPERIMENTAL PORTFOLIO</span>
    <span>DATA FEED: STATION_01</span>
  </div>

  <!-- Weather data — vertically centered -->
  <div class="wx-display" aria-live="polite">
    <div class="wx-row wx-row--wind">
      WIND: <span id="wx-wind" class="wx-value">--</span> KM/H
    </div>
    <div class="wx-row wx-row--temp">
      TEMP: <span id="wx-temp" class="wx-value">--</span>°C
    </div>
    <div class="wx-row wx-row--water">
      WATER: <span id="wx-water" class="wx-value">--</span>°C
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add Room 02 CSS**

```css
/* ══════════════════════════════════════════════════
   ROOM 02 — WEATHER MONUMENT
   ══════════════════════════════════════════════════ */

.room__bg--weather {
  background-image: url('/images/weather.jpg');
}

.room--weather .room__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 5vw;
  padding-right: 5vw;
}

.wx-meta {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--dim);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.wx-display {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.wx-row {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  color: var(--white);
  line-height: 0.88;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.wx-row--wind  { font-size: clamp(4rem, 11vw, 14rem); }
.wx-row--temp  { font-size: clamp(3rem,  8vw,  10rem); }
.wx-row--water { font-size: clamp(2rem,  5vw,   7rem); color: var(--dim); }

/* Pulse animation on loading dashes */
.wx-value:empty,
.wx-value[data-loading] {
  animation: pulse 1.5s ease-in-out infinite;
}
```

- [ ] **Step 3: Rewrite weather.js**

Replace the entire contents of `frontend/src/weather.js`:

```js
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

function setLoading() {
  const ids = ['wx-wind', 'wx-temp', 'wx-water']
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el) {
      el.textContent = '--'
      el.setAttribute('data-loading', '')
    }
  })
}

function setValues(wind, temp, water) {
  const windEl  = document.getElementById('wx-wind')
  const tempEl  = document.getElementById('wx-temp')
  const waterEl = document.getElementById('wx-water')

  if (windEl)  { windEl.textContent  = wind;  windEl.removeAttribute('data-loading') }
  if (tempEl)  { tempEl.textContent  = temp;  tempEl.removeAttribute('data-loading') }
  if (waterEl) { waterEl.textContent = water; waterEl.removeAttribute('data-loading') }
}

export function initWeather() {
  setLoading()
  fetch(`${API_URL}/api/weather`)
    .then(r => r.json())
    .then(data => {
      const wind  = data.wind_speed_10m  != null ? String(Math.round(data.wind_speed_10m))  : '--'
      const temp  = data.temperature_2m  != null ? String(data.temperature_2m)  : '--'
      const water = data.water_temperature != null ? String(data.water_temperature) : '--'
      setValues(wind, temp, water)
    })
    .catch(() => setValues('--', '--', '--'))
}
```

- [ ] **Step 4: Verify Room 02**

`npm run dev`. Scroll to Room 02. Verify:
- Top-left metadata strip is visible in dim Space Mono
- `WIND: -- KM/H`, `TEMP: --°C`, `WATER: --°C` display at large scale
- If backend is running (`docker compose up`), values populate after load
- Background is dark (`#111` placeholder)

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/style.css frontend/src/weather.js
git commit -m "feat(frontend): Room 02 Weather Monument"
```

---

## Task 6: Room 03 — Exhibition Plaque

**Files:**
- Modify: `frontend/index.html` (Room 03 content)
- Modify: `frontend/style.css` (Room 03 rules)

- [ ] **Step 1: Add Room 03 HTML content**

Replace `<!-- Room 03 content goes here -->` inside `<div class="room__content room__content--plaque">`:

```html
<!-- Left column: scrollable text -->
<div class="plaque-left">

  <section class="plaque-section">
    <h2 class="plaque-label" style="font-size: clamp(3rem, 8vw, 7rem);">HISTORY</h2>
    <hr class="plaque-rule" />
    <p class="plaque-body">FINN'S LANDZUNGE WAS FIRST LOGGED IN THE THIRD CYCLE OF 2019 BY OPERATIVE FINN &mdash; A LEIPZIG-BASED BIOSECTOR ANALYST AND ROGUE GEOGRAPHER &mdash; DURING A SOLO SWEEP OF THE SOUTHERN LAKESHORE PERIMETER. DETECTING AN ANOMALOUS GRASS-COVERED PROMONTORY PROJECTING INTO THE WATER SECTOR, FINN LOCKED COORDINATES WITH PRECISION AND UPLOADED THE SITE TO THE PUBLIC GEOGRAPHIC NETWORK UNDER THE DESIGNATION <em>FINN'S LANDZUNGE</em> &mdash; A TAG THAT HAS SINCE REMAINED UNCONTESTED IN THE DATASTREAM.</p>
    <p class="plaque-body">THE NODE SITS WITHIN THE BROADER GRID OF POST-INDUSTRIAL WATER SECTORS RECLAIMED FROM FORMER LIGNITE EXTRACTION ZONES ACROSS THE LEIPZIG LOWLANDS &mdash; A TERRAIN OVERWRITE THAT HAS RESHAPED SOUTHERN SAXONY ACROSS PRECEDING CYCLES. AGAINST THIS BACKDROP OF ECOLOGICAL SYSTEM RECOVERY, THE LANDZUNGE REPRESENTS A RARE INSTANCE OF NATURALLY ACCUMULATED SHORELINE: A PROMONTORY OF COMPACTED EARTH AND BIOMASS PROJECTING INTO THE WATER SECTOR WITHOUT SYNTHETIC REINFORCEMENT.</p>
    <p class="plaque-body">SINCE ITS UPLOAD, THE LANDZUNGE HAS DRAWN THE QUIET ATTENTION OF THOSE WHO SEEK LOW-SIGNAL NATURAL ANOMALIES. THE DESIGNATION APPEARS IN NO OFFICIAL MUNICIPAL DATABASE PRIOR TO FINN'S INTERVENTION &mdash; A GAP IN THE RECORD THAT HAS LED SOME ANALYSTS TO CONCLUDE THE NODE EXISTED, UNDOCUMENTED AND UNTAGGED, DEEP IN THE SYSTEM FOR MANY CYCLES BEFORE ITS DISCOVERY.</p>
  </section>

  <hr class="plaque-rule" />

  <section class="plaque-section">
    <h3 class="plaque-sublabel">GEOGRAPHY</h3>
    <hr class="plaque-rule" />
    <p class="plaque-body">THE LANDZUNGE CONSTITUTES A CLASS-1 GEOMORPHOLOGICAL ANOMALY: A NARROW PROMONTORY NODE PROJECTING FROM THE SOUTHERN BANK PERIMETER INTO THE OPEN WATER SECTOR. ITS SURFACE LAYER CONSISTS OF DENSE LOW-PROFILE BIOMASS, WITH A GRADUAL SLOPE TOWARD THE WATER INTERFACE ON BOTH FLANKS. THE TERMINAL EDGE PROVIDES AN UNOBSTRUCTED 270-DEGREE VISUAL SWEEP ACROSS THE LAKE &mdash; AN ACCESS POINT AVAILABLE FROM NO OTHER NODE ALONG THIS SECTOR OF BANK.</p>
    <p class="plaque-body">THE LEGACY TERM <em>LANDZUNGE</em> &mdash; LITERALLY &ldquo;TONGUE OF LAND&rdquo; IN THE GERMANIC PROTOCOL &mdash; IS A PRECISE TOPOGRAPHIC DESCRIPTOR FOR THIS CLASS OF GEOMORPHOLOGICAL FEATURE. COORDINATES (51.2614894&deg; N, 12.339342&deg; E) LOCATE THE NODE WITHIN THE WIDER NEUSEENLAND SECTOR OF SAXONY &mdash; A ZONE OF CONSIDERABLE ECOLOGICAL AND RECREATIONAL BANDWIDTH. THE LANDZUNGE HOLDS A MODEST BUT IRREPLACEABLE POSITION IN THIS NETWORK.</p>
  </section>

  <hr class="plaque-rule" />

  <section class="plaque-section">
    <h3 class="plaque-sublabel">HERITAGE</h3>
    <hr class="plaque-rule" />
    <p class="plaque-body">FINN'S LANDZUNGE IS LOGGED AS A NODE OF INFORMAL GEOGRAPHIC AND CULTURAL SIGNIFICANCE IN THE LEIPZIG MUNICIPAL DATA REGISTRY (ENTRY FILED, CYCLE 2021). THE CLASSIFICATION ACKNOWLEDGES THE SITE'S STATUS AS A DOCUMENTED BIOSECTOR FEATURE OF THE POST-EXTRACTION LAKE NETWORK AND RECOGNISES FINN'S DISCOVERY AND TAGGING OF THE NODE AS AN ACT OF CIVIC GEOGRAPHIC UPLINK.</p>
    <p class="plaque-body">THE HERITAGE PROTOCOL REQUESTS THAT ALL USERS INTERFACE WITH THE NODE RESPONSIBLY: NO EXCAVATION, NO ALTERATION OF THE NATURAL SHORELINE PERIMETER, NO EXTRACTION OF MATERIAL FROM THE SECTOR. THE LANDZUNGE RUNS ON AN OPEN-ACCESS PROTOCOL. IT BELONGS TO THE NETWORK. THE NODE IS NAMED AFTER FINN.</p>
  </section>

  <hr class="plaque-rule" />

  <section class="plaque-section">
    <h3 class="plaque-sublabel">NAVIGATION</h3>
    <hr class="plaque-rule" />
    <dl class="plaque-nav">
      <div class="plaque-nav__row">
        <dt>GPS UPLINK</dt>
        <dd>51.2614894&deg; N &nbsp; 12.339342&deg; E</dd>
      </div>
      <div class="plaque-nav__row">
        <dt>GRID SECTOR</dt>
        <dd>LEIPZIG, SAXONY GRID, FEDERAL REPUBLIC OF GERMANY</dd>
      </div>
      <div class="plaque-nav__row">
        <dt>ACCESS WINDOW</dt>
        <dd>0000&ndash;2400 // ALL CYCLES</dd>
      </div>
      <div class="plaque-nav__row">
        <dt>CLEARANCE</dt>
        <dd>NONE REQUIRED</dd>
      </div>
      <div class="plaque-nav__row">
        <dt>INFRASTRUCTURE</dt>
        <dd>NULL. THE NODE SUSTAINS ITSELF.</dd>
      </div>
      <div class="plaque-nav__row">
        <dt>MAP LINK</dt>
        <dd>
          <a class="plaque-link"
             href="https://www.google.com/maps/place/Finn's+Landzunge/@51.3097009,12.3624668,13z/data=!4m6!3m5!1s0x47a6fb004174db55:0x11202b8ea125de6b!8m2!3d51.2614894!4d12.339342!16s%2Fg%2F11z5slxmbk"
             target="_blank" rel="noopener">
            &gt; OPEN MAP INTERFACE
          </a>
        </dd>
      </div>
      <div class="plaque-nav__row">
        <dt>DISPATCHES</dt>
        <dd><a class="plaque-link" href="/dispatches.html">&gt; VIEW FIELD DISPATCHES</a></dd>
      </div>
    </dl>
  </section>

  <hr class="plaque-rule" />

  <section class="plaque-section plaque-section--quote">
    <h3 class="plaque-sublabel">FIELD TRANSMISSION</h3>
    <hr class="plaque-rule" />
    <blockquote class="plaque-quote">
      <p>&ldquo;STANDING AT THE TERMINAL EDGE. WATER ON BOTH FLANKS. OPEN SECTOR AHEAD. FOR A MOMENT, THE GRID MAKES A SMALL CONCESSION.&rdquo;</p>
      <cite>&mdash; FINN // SECTOR 7 // JUNE 2019</cite>
    </blockquote>
  </section>

</div>

<!-- Right column: fixed photo slivers -->
<div class="plaque-right" aria-hidden="true">
  <div class="plaque-sliver" style="background-image: url('/images/sliver-1.jpg')"></div>
  <div class="plaque-sliver" style="background-image: url('/images/sliver-2.jpg')"></div>
  <div class="plaque-sliver" style="background-image: url('/images/sliver-3.jpg')"></div>
</div>
```

- [ ] **Step 2: Add Room 03 CSS**

```css
/* ══════════════════════════════════════════════════
   ROOM 03 — EXHIBITION PLAQUE
   ══════════════════════════════════════════════════ */

.room__content--plaque {
  display: flex;
  height: 100dvh;
}

/* Left column — scrollable */
.plaque-left {
  width: 65%;
  height: 100dvh;
  overflow-y: auto;
  scrollbar-width: none;          /* hide scrollbar — brutalist friction */
  padding: 3rem 3rem 3rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  overscroll-behavior: contain;   /* prevent triggering page snap */
}

.plaque-left::-webkit-scrollbar { display: none; }

/* Right column — fixed slivers */
.plaque-right {
  width: 35%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--black);       /* 1px gap colour */
  flex-shrink: 0;
}

.plaque-sliver {
  flex: 1;
  background-color: #111;         /* fallback until images provided */
  background-size: cover;
  background-position: center;
  filter: grayscale(100%) contrast(1.3) brightness(0.85);
}

/* Section labels */
.plaque-label {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  color: var(--white);
  letter-spacing: -0.03em;
  line-height: 0.9;
  text-transform: uppercase;
  margin-top: -0.1em;             /* bleed into top padding slightly */
  margin-bottom: 1.25rem;
}

.plaque-sublabel {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 4vw, 3.5rem);
  color: var(--white);
  letter-spacing: -0.02em;
  line-height: 0.95;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

/* Divider rules */
.plaque-rule {
  border: none;
  border-top: 1px solid #222;
  margin: 1.5rem 0;
}

/* Body text */
.plaque-body {
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  color: var(--dim);
  letter-spacing: 0.04em;
  line-height: 1.8;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.plaque-body em {
  font-style: italic;
  color: var(--white);
}

.plaque-section {
  margin-bottom: 0.5rem;
}

/* Navigation DL */
.plaque-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plaque-nav__row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 1rem;
  align-items: baseline;
}

.plaque-nav dt {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: #555;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.plaque-nav dd {
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  color: #ccc;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.plaque-link {
  color: var(--acid);
  text-decoration: none;
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.plaque-link:hover {
  text-decoration: underline;
}

/* Quote block */
.plaque-quote {
  border-left: 3px solid var(--acid);
  padding-left: 1.25rem;
  margin: 0;
}

.plaque-quote p {
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  color: #ccc;
  letter-spacing: 0.04em;
  font-style: italic;
  line-height: 1.7;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.plaque-quote cite {
  display: block;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: #555;
  letter-spacing: 0.08em;
  font-style: normal;
  text-transform: uppercase;
}

/* Responsive: stack on narrow screens */
@media (max-width: 768px) {
  .room__content--plaque { flex-direction: column; }
  .plaque-left  { width: 100%; height: auto; }
  .plaque-right { width: 100%; height: 25dvh; flex-direction: row; }
}
```

- [ ] **Step 3: Verify Room 03**

`npm run dev`. Scroll to Room 03. Verify:
- Two-column layout: left 65% scrollable text, right 35% dark slivers
- Left column scrolls independently without triggering a snap to Room 04
- HISTORY label is massive, subsequent section labels are smaller
- Monospace body text in dim grey
- Navigation DL renders with GPS and map link
- Quote block has acid green left border
- Right slivers show `#111` placeholder (until images provided)

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/style.css
git commit -m "feat(frontend): Room 03 Exhibition Plaque"
```

---

## Task 7: Room 04 — Visitor Canvas (HTML + CSS)

**Files:**
- Modify: `frontend/index.html` (Room 04 content)
- Modify: `frontend/style.css` (Room 04 rules)

- [ ] **Step 1: Add Room 04 HTML content** inside `<div class="room__content">` of `#room-04`

```html
<div class="room__content">
  <!-- Ghost words layer (decorative, behind entries) -->
  <div class="canvas-ghosts" aria-hidden="true">
    <span class="canvas-ghost" style="top: 10%; left: 20%;">CHAOS</span>
    <span class="canvas-ghost" style="top: 52%; left: 42%;">BEAUTIFUL</span>
    <span class="canvas-ghost" style="top: 72%; left: 8%;">LOST</span>
  </div>

  <!-- Entries layer — populated by guestbook.js -->
  <div id="canvas-entries" class="canvas-entries" role="list" aria-label="Visitor transmissions"></div>

  <!-- Collapsed form strip (default state) -->
  <div id="canvas-form-strip" class="canvas-form-strip">
    <div class="canvas-cursor" aria-hidden="true"></div>
    <span class="canvas-prompt">LOG YOUR TRANSMISSION_</span>
  </div>

  <!-- Expanded form (hidden by default) -->
  <div id="canvas-form-expanded" class="canvas-form-expanded" hidden>
    <form id="canvas-form" class="canvas-form" novalidate>
      <div class="canvas-form__field">
        <input id="gb_name" name="gb_name" type="text" maxlength="50" required
               autocomplete="off" placeholder="HANDLE" class="canvas-input" />
      </div>
      <div class="canvas-form__field">
        <textarea id="gb_message" name="gb_message" maxlength="280" rows="3" required
                  placeholder="TRANSMISSION..." class="canvas-input"></textarea>
      </div>
      <div class="canvas-form__actions">
        <button type="submit" class="canvas-submit">[ UPLINK ]</button>
        <button type="button" id="canvas-cancel" class="canvas-cancel">[ CANCEL ]</button>
      </div>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Add Room 04 CSS**

```css
/* ══════════════════════════════════════════════════
   ROOM 04 — VISITOR CANVAS
   ══════════════════════════════════════════════════ */

.room--canvas .room__content {
  position: relative;
  overflow: hidden;
}

/* Ghost words */
.canvas-ghosts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.canvas-ghost {
  position: absolute;
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-size: clamp(6rem, 18vw, 18rem);
  color: var(--white);
  opacity: 0.06;
  letter-spacing: -0.04em;
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
}

/* Entries layer */
.canvas-entries {
  position: absolute;
  inset: 0;
  bottom: 2.5rem;       /* above form strip */
  overflow: hidden;
  z-index: 1;
}

.canvas-entry {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 220px;
}

.canvas-handle {
  font-family: 'Space Mono', monospace;
  color: var(--acid);
  letter-spacing: 0.06em;
  line-height: 1.2;
  font-size: inherit;
  text-transform: uppercase;
}

.canvas-message {
  font-family: 'Space Mono', monospace;
  color: var(--dim);
  letter-spacing: 0.03em;
  line-height: 1.4;
  font-size: inherit;
}

.canvas-entry--newest .canvas-message {
  color: var(--white);
}

/* Collapsed form strip */
.canvas-form-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5rem;
  background: var(--black);
  border-top: 1px solid #111;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem;
  cursor: pointer;
  z-index: 2;
}

.canvas-cursor {
  width: 6px;
  height: 1.2rem;
  background: var(--acid);
  animation: blink 1s step-end infinite;
  flex-shrink: 0;
}

.canvas-prompt {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: #444;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Expanded form */
.canvas-form-expanded {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--black);
  border-top: 1px solid #222;
  padding: 1.25rem 1.5rem;
  z-index: 2;
}

.canvas-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 480px;
}

.canvas-form__field { display: flex; flex-direction: column; }

.canvas-input {
  background: none;
  border: none;
  border-bottom: 1px solid #333;
  color: var(--white);
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  padding: 0.4rem 0;
  outline: none;
  text-transform: uppercase;
  width: 100%;
  resize: none;
}

.canvas-input::placeholder {
  color: #444;
}

.canvas-input:focus {
  border-bottom-color: var(--acid);
}

.canvas-form__actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0.25rem;
}

.canvas-submit {
  background: none;
  border: 1px solid var(--acid);
  color: var(--acid);
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  padding: 0.4rem 1rem;
  cursor: pointer;
}

.canvas-submit:hover {
  background: var(--acid);
  color: var(--black);
}

.canvas-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.canvas-cancel {
  background: none;
  border: none;
  color: #555;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  padding: 0;
}

.canvas-cancel:hover { color: var(--dim); }
```

- [ ] **Step 3: Verify Room 04 structure**

`npm run dev`. Scroll to Room 04. Verify:
- Black room with faint ghost words visible ("CHAOS", "BEAUTIFUL", "LOST")
- Blinking green cursor strip at the very bottom
- Clicking the strip expands the form
- Pressing Cancel returns to the cursor strip
- The form has handle input, message textarea, UPLINK button

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/style.css
git commit -m "feat(frontend): Room 04 Visitor Canvas layout"
```

---

## Task 8: Update guestbook.js for canvas rendering

**Files:**
- Replace: `frontend/src/guestbook.js`

- [ ] **Step 1: Replace guestbook.js entirely**

```js
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'
const RATE_LIMIT_KEY = 'gb_last_submit'
const RATE_LIMIT_MS  = 5 * 60 * 1000   // 5 minutes

// Deterministic hash of the entry UUID → number for stable positioning
function hashId(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = Math.imul((h << 5) + h, 1) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function entryPosition(id) {
  const hash = hashId(id)
  const left = (hash % 70) + 5        // 5% – 75%
  const top  = ((hash >> 4) % 70) + 5 // 5% – 75%
  const sizes = ['0.65rem', '0.8rem', '1rem', '1.1rem']
  const fontSize = sizes[hash % 4]
  return { left, top, fontSize }
}

function renderEntries(entries) {
  const container = document.getElementById('canvas-entries')
  if (!container) return

  if (entries.length === 0) {
    // Leave canvas empty — ghost words carry the empty state
    container.innerHTML = ''
    return
  }

  const newestId = entries[0]?.id  // API returns newest first

  container.innerHTML = entries.map(e => {
    const { left, top, fontSize } = entryPosition(e.id)
    const isNewest = e.id === newestId
    return `
      <div class="canvas-entry${isNewest ? ' canvas-entry--newest' : ''}"
           style="left: ${left}%; top: ${top}%; font-size: ${fontSize};"
           role="listitem">
        <span class="canvas-handle">${esc(e.name)}</span>
        <span class="canvas-message">${esc(e.message)}</span>
      </div>
    `
  }).join('')
}

async function loadEntries() {
  try {
    const res = await fetch(`${API_URL}/api/guestbook`)
    if (!res.ok) throw new Error()
    const entries = await res.json()
    renderEntries(entries)
  } catch {
    renderEntries([])
  }
}

function setupForm() {
  const strip    = document.getElementById('canvas-form-strip')
  const expanded = document.getElementById('canvas-form-expanded')
  const form     = document.getElementById('canvas-form')
  const cancel   = document.getElementById('canvas-cancel')

  if (!strip || !expanded || !form) return

  function openForm() {
    strip.hidden = true
    expanded.hidden = false
    form.querySelector('#gb_name')?.focus()
  }

  function closeForm() {
    expanded.hidden = true
    strip.hidden = false
    form.reset()
  }

  strip.addEventListener('click', openForm)
  cancel.addEventListener('click', closeForm)

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()

    const last = localStorage.getItem(RATE_LIMIT_KEY)
    if (last && Date.now() - Number(last) < RATE_LIMIT_MS) {
      alert('ONE TRANSMISSION PER 5 MINUTES. STAND BY.')
      return
    }

    const name    = form.gb_name.value.trim().slice(0, 50)
    const message = form.gb_message.value.trim().slice(0, 280)
    if (!name || !message) return

    const submitBtn = form.querySelector('.canvas-submit')
    submitBtn.disabled = true

    const formData = new FormData()
    formData.append('name', name)
    formData.append('message', message)

    try {
      const res = await fetch(`${API_URL}/api/guestbook`, {
        method: 'POST',
        body: formData,
      })
      if (res.status === 400) {
        const body = await res.json()
        alert(body.message ?? 'INVALID SUBMISSION.')
        submitBtn.disabled = false
        return
      }
      if (!res.ok) throw new Error()
    } catch {
      alert('UPLINK FAILED. TRY AGAIN.')
      submitBtn.disabled = false
      return
    }

    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
    submitBtn.disabled = false
    closeForm()
    await loadEntries()
  })
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function initGuestbook() {
  await loadEntries()
  setupForm()
}
```

- [ ] **Step 2: Verify guestbook canvas**

`npm run dev`. Scroll to Room 04. With backend running (`docker compose up`), existing entries should appear scattered at fixed positions across the canvas. Click the cursor strip — form expands. Submit a test entry — closes form, entry appears on canvas. Refreshing the page shows entries at the same positions (hash-stable).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/guestbook.js
git commit -m "feat(frontend): guestbook canvas rendering with hash positioning"
```

---

## Task 9: Room counter JS

**Files:**
- Create: `frontend/src/room-counter.js`
- Modify: `frontend/src/main.js`

- [ ] **Step 1: Create room-counter.js**

```js
export function initRoomCounter() {
  const counter = document.getElementById('room-counter')
  if (!counter) return

  const container = document.querySelector('.snap-container')
  const rooms = Array.from(document.querySelectorAll('.room'))
  const total = rooms.length

  function updateCounter(index) {
    const num = String(index + 1).padStart(2, '0')
    const tot = String(total).padStart(2, '0')
    counter.textContent = `${num} / ${tot}`
    counter.setAttribute('aria-label', `Room ${index + 1} of ${total}`)
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio >= 0.5) {
        const idx = rooms.indexOf(entry.target)
        if (idx !== -1) updateCounter(idx)
      }
    })
  }, {
    root: container,
    threshold: 0.5,
  })

  rooms.forEach(room => observer.observe(room))
  updateCounter(0)  // initialise to Room 01
}
```

- [ ] **Step 2: Add initRoomCounter to main.js**

Replace the full contents of `frontend/src/main.js`:

```js
import { initGuestbook }    from './guestbook.js'
import { initWeather }      from './weather.js'
import { initRoomCounter }  from './room-counter.js'

// Enter button → Room 02
document.getElementById('enter-btn')
  ?.addEventListener('click', () => {
    document.getElementById('room-02')
      ?.scrollIntoView({ behavior: 'smooth' })
  })

initWeather()
initGuestbook()
initRoomCounter()
```

- [ ] **Step 3: Verify room counter**

`npm run dev`. Open http://localhost:5173. Counter shows `01 / 04`. Scroll to Room 02 — counter updates to `02 / 04`. Continue through all 4 rooms — counter tracks correctly.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/room-counter.js frontend/src/main.js
git commit -m "feat(frontend): room counter IntersectionObserver"
```

---

## Task 10: Delete removed modules

**Files:**
- Delete: `frontend/src/i18n.js`
- Delete: `frontend/src/sound.js`
- Delete: `frontend/src/tracker.js`

- [ ] **Step 1: Delete the three files**

```bash
rm frontend/src/i18n.js
rm frontend/src/sound.js
rm frontend/src/tracker.js
```

- [ ] **Step 2: Verify no console errors**

`npm run dev`. Open http://localhost:5173. Open browser console. Verify no "Cannot find module" or "Failed to fetch" errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(frontend): remove i18n, sound, tracker modules"
```

---

## Task 11: Redesign dispatches page

**Files:**
- Replace: `frontend/dispatches.html`
- Modify: `frontend/src/dispatches.js` (update markup classes)
- Modify: `frontend/style.css` (add dispatches rules)

- [ ] **Step 1: Replace dispatches.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Field dispatches from Finn's Landzunge — transmissions logged from the Leipzig biosector." />
  <link rel="canonical" href="https://finnslandzunge.com/dispatches.html" />
  <title>Field Dispatches — Finn's Landzunge</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23000'/><text y='24' font-size='24'>🏔</text></svg>" />
</head>
<body class="dispatches-page">

  <!-- Fixed return link -->
  <a href="/" class="dispatches-return">&larr; RETURN</a>

  <!-- Header: full-height intro -->
  <header class="dispatches-header">
    <h1 class="dispatches-title">DISPATCHES</h1>
    <p class="dispatches-subtitle">FIELD TRANSMISSIONS FROM FINN'S LANDZUNGE</p>
  </header>

  <!-- Dispatch list -->
  <main class="dispatches-main">
    <div id="dispatches-list"></div>
  </main>

  <script type="module" src="/src/dispatches-page.js"></script>
</body>
</html>
```

- [ ] **Step 2: Update dispatches.js — initDispatchesPage markup**

In `frontend/src/dispatches.js`, replace the `initDispatchesPage` function (lines 26–48). Leave `initDispatchesTeaser` and the helper functions unchanged:

```js
export async function initDispatchesPage() {
  const container = document.getElementById('dispatches-list')
  if (!container) return
  try {
    const res = await fetch(`${API_URL}/api/dispatches`)
    if (!res.ok) throw new Error()
    const dispatches = await res.json()
    if (dispatches.length === 0) {
      container.innerHTML = '<p class="dispatch-empty">// NO DISPATCHES FILED. STANDBY.</p>'
      return
    }
    container.innerHTML = dispatches.map(d => `
      <article class="dispatch-item">
        <time class="dispatch-item__date">${formatDate(d.created_at)}</time>
        <h2 class="dispatch-item__title">${esc(d.title)}</h2>
        <p class="dispatch-item__excerpt">${esc(d.excerpt)}</p>
        <hr class="dispatch-divider" />
      </article>
    `).join('')
  } catch {
    container.innerHTML = '<p class="dispatch-empty">// UPLINK FAILED.</p>'
  }
}
```

- [ ] **Step 3: Add dispatches page CSS to end of style.css**

```css
/* ══════════════════════════════════════════════════
   DISPATCHES PAGE
   ══════════════════════════════════════════════════ */

.dispatches-page {
  background: var(--black);
  color: var(--white);
  font-family: 'Space Mono', monospace;
  min-height: 100dvh;
}

/* Fixed return link */
.dispatches-return {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--acid);
  letter-spacing: 0.1em;
  text-decoration: none;
  text-transform: uppercase;
  z-index: 100;
}

.dispatches-return:hover { text-decoration: underline; }

/* Header */
.dispatches-header {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 3rem 4rem 4rem;
  overflow: hidden;
}

.dispatches-title {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-size: clamp(5rem, 18vw, 16rem);
  line-height: 0.88;
  letter-spacing: -0.03em;
  color: var(--white);
  text-transform: uppercase;
  margin-top: -0.1em;   /* bleed into top edge */
  margin-bottom: 1.5rem;
}

.dispatches-subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--dim);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* Dispatch list */
.dispatches-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 4rem 6rem;
}

.dispatch-item {
  padding: 2.5rem 0;
}

.dispatch-item__date {
  display: block;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: #555;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.dispatch-item__title {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--white);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.dispatch-item__excerpt {
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  color: var(--dim);
  letter-spacing: 0.04em;
  line-height: 1.8;
  text-transform: uppercase;
}

.dispatch-divider {
  border: none;
  border-top: 1px solid #1a1a1a;
  margin-top: 2.5rem;
}

.dispatch-empty {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: #555;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3rem 0;
}

@media (max-width: 768px) {
  .dispatches-header { padding: 3rem 1.5rem 3rem; }
  .dispatches-main   { padding: 0 1.5rem 4rem; }
}
```

- [ ] **Step 4: Verify dispatches page**

`npm run dev`. Navigate to http://localhost:5173/dispatches.html. Verify:
- Fixed `← RETURN` link in acid green top-left
- `DISPATCHES` massive title, partially cropped at top of viewport
- Below: dim subtitle in Space Mono
- Scroll down — dispatches list with date / title / excerpt / divider format
- Return link navigates to `/`

- [ ] **Step 5: Commit**

```bash
git add frontend/dispatches.html frontend/src/dispatches.js frontend/style.css
git commit -m "feat(frontend): redesign dispatches page"
```

---

## Task 12: Image directory setup

**Files:**
- Create: `frontend/public/images/.gitkeep`

- [ ] **Step 1: Create the images directory**

```bash
mkdir -p frontend/public/images
touch frontend/public/images/.gitkeep
```

- [ ] **Step 2: Document required image files**

Create `frontend/public/images/README.md`:

```markdown
# Required Images

Drop these files here before building. All should be **colour photos** — CSS applies
`grayscale + contrast + brightness` treatment automatically.

| Filename | Used in | Notes |
|---|---|---|
| `hero.jpg` | Room 01 Entrance background | Lake/water shot, landscape orientation |
| `weather.jpg` | Room 02 Weather Monument background | Water/ripples, can reuse hero.jpg |
| `sliver-1.jpg` | Room 03 right column, top sliver | Nature detail: roots, soil, bark |
| `sliver-2.jpg` | Room 03 right column, middle sliver | Nature detail: stone, concrete, water |
| `sliver-3.jpg` | Room 03 right column, bottom sliver | Nature detail: grass, shoreline |

Portrait or landscape all work — images are `object-fit: cover`.

While images are missing, rooms show `#111` dark grey placeholder backgrounds.
```

- [ ] **Step 3: Commit**

```bash
git add frontend/public/images/
git commit -m "chore(frontend): add images directory with README"
```

---

## Task 13: Final integration and production build

**Files:** None (verification only)

- [ ] **Step 1: Run dev and do a full walkthrough**

```bash
cd frontend && npm run dev
```

Walk through the complete experience:
1. **Room 01** — GPS coordinates visible, label below, blinking entry button. Counter shows `01 / 04`.
2. Click `[ ENTER EXHIBITION ]` — smooth scroll to Room 02. Counter shows `02 / 04`.
3. **Room 02** — WIND, TEMP, WATER values display (or `--` if backend offline). Meta strip top-left.
4. Scroll to **Room 03** — counter `03 / 04`. Two-column layout. Left column scrolls through HISTORY → GEOGRAPHY → HERITAGE → NAVIGATION → FIELD TRANSMISSION. Right column slivers stay fixed. Navigation DL contains map link and dispatches link.
5. Scroll to **Room 04** — counter `04 / 04`. Ghost words visible. Cursor strip at bottom blinks. Click strip — form expands. Cancel returns to strip.
6. Navigate to `/dispatches.html` via Room 03 dispatches link. Verify page loads, massive title, list, return link.

- [ ] **Step 2: Verify production build**

```bash
npm run build
```

Expected: `dist/` generated, no build errors. Open `npm run preview` and repeat the walkthrough on the built output.

- [ ] **Step 3: Check no console errors in either page**

Open browser DevTools → Console. Both `index.html` and `dispatches.html` should show zero errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(frontend): complete brutalist redesign — Inter Black + Space Mono, 4-room scroll-snap

- Room 01 Entrance: GPS coordinates as headline, blinking entry CTA
- Room 02 Weather Monument: screen-filling WIND/TEMP/WATER data art
- Room 03 Exhibition Plaque: two-column inner-scroll, B&W slivers
- Room 04 Visitor Canvas: hash-positioned entries, expand-form
- Dispatches page: brutalist editorial redesign
- Remove: i18n, sound, tracker modules; neon palette; Orbitron/Rajdhani/VT323"
```

---

## Notes for agentic execution

- **Images:** Tasks 4–6 show `#111` placeholder backgrounds — this is correct. The user will drop real photos into `frontend/public/images/` separately.
- **Backend:** Weather data and guestbook entries require the backend running (`docker compose up` from repo root). Both modules gracefully handle offline state (`--` values, empty canvas).
- **Browser test during dev:** Use Chrome or Firefox with DevTools. Safari has known quirks with `scroll-snap-type` on the `html` element — the `.snap-container` wrapper resolves this.
- **Inter 900 import:** The font file is `@fontsource/inter/900.css`. If the build complains, verify the file exists at `frontend/node_modules/@fontsource/inter/900.css`.
