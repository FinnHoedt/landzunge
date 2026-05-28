# Finn's Landzunge — Frontend Redesign Spec
**Date:** 2026-05-27  
**Branch:** 25-feat-complete-frontend-redesign  
**Scope:** `frontend/` only — admin dashboard excluded

---

## 1. Overview

Complete visual and structural overhaul of the public-facing site. The existing neon cyberpunk aesthetic (cyan/magenta, Orbitron, scanlines) is replaced with Avant-Garde Brutalism: pure black/white/acid green, massive editorial typography, B&W grainy photography layered with data, gallery-room navigation.

The site is rebuilt as a 4-room scroll-snap experience on `index.html`, plus a redesigned `dispatches.html`. No framework — vanilla JS + Vite, same as current.

**Removed in this redesign:**
- EN/DE language toggle and all `data-en`/`data-de` attributes
- Sound system (dial-up + ambient lake loop)
- Orbitron, Rajdhani, VT323 font imports
- Neon cyan/magenta palette
- Scanline background texture
- Custom scrollbar styling

---

## 2. Design System

### 2.1 Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `--black` | `#000000` | Page background |
| `--white` | `#FFFFFF` | Primary text, headlines |
| `--acid` | `#CCFF00` | Accent only: hover states, active cursor, primary CTA, section label highlights |
| `--dim` | `#888888` | Body text, metadata, secondary labels |

`--acid` is used sparingly and intentionally. It must not appear as a general text colour.

### 2.2 Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Headlines | Inter | 900 (Black) | Self-hosted via `@fontsource/inter`. Uppercase, `letter-spacing: -0.03em`, tight `line-height: 0.9` |
| Body & data | Space Mono | 400 | Self-hosted via `@fontsource/space-mono`. Uppercase, `letter-spacing: 0.04em` |

No other typefaces. VT323, Orbitron, and Rajdhani packages are removed from `package.json`.

### 2.3 Imagery

- User-supplied B&W photographs of Finn's Landzunge placed in `frontend/public/images/`
- Applied CSS treatment: `filter: grayscale(100%) contrast(1.3) brightness(0.85)`
- Grain overlay: CSS pseudo-element (`::after`) using an inline SVG `feTurbulence` filter as `background-image`, `mix-blend-mode: overlay`, `opacity: 0.35`, `pointer-events: none`
- Images used: `hero.jpg` (Room 01), `weather.jpg` (Room 02), plus 3 narrow slivers for Room 03 (`sliver-1.jpg`, `sliver-2.jpg`, `sliver-3.jpg`)
- Filenames are placeholders — user provides actual files before build

### 2.4 Navigation Architecture

`scroll-snap-type: y mandatory` on the `<html>` element. Each room section is `height: 100dvh`, `scroll-snap-align: start`. Overflow on the root is `scroll` not `auto` to enable programmatic scrolling.

**Persistent chrome:** A single room counter `01 / 04` in Space Mono acid green (`font-size: 0.65rem`), `position: fixed`, bottom-right (`1.5rem` from edges). Updates as the user scrolls between rooms via an `IntersectionObserver`. This is the only persistent UI element.

No sticky navigation bar. No hamburger menu. No back-to-top button.

---

## 3. Room Architecture — index.html

### Room 01 — Entrance

**Background:** Full-bleed `hero.jpg` with grain overlay. `object-fit: cover`, `object-position: center`.

**Content:** Centered vertically and horizontally.
- GPS coordinates as two lines in Inter Black: `51°15'41"N` and `12°20'22"E`. Font size: `clamp(3.5rem, 12vw, 10rem)`. Colour: `#FFFFFF`.
- Below coordinates: `FINN'S LANDZUNGE // EXPERIMENTAL PORTFOLIO` in Space Mono `0.7rem` `#888`.
- Bottom center, `position: absolute`: `[ ENTER EXHIBITION ]` button. Space Mono, `0.8rem`. Border `1px solid #CCFF00`. Colour `#CCFF00`. `letter-spacing: 0.12em`. Blinks at 1Hz via CSS `animation: blink 1s step-end infinite`. On click: `document.querySelector('#room-02').scrollIntoView({ behavior: 'smooth' })`.

No visible `<h1>` on this room — the coordinates serve as the visual headline. Add a visually hidden `<h1>Finn's Landzunge</h1>` (CSS `clip: rect(0,0,0,0); position: absolute`) for SEO and screen reader context. The coordinates div gets `role="img" aria-label="GPS coordinates: 51°15'41N 12°20'22E"`.

### Room 02 — Live Weather Monument

**Background:** Full-bleed `weather.jpg` with grain overlay. A semi-transparent black overlay (`rgba(0,0,0,0.45)`) sits between image and content to ensure legibility.

**Top-left metadata strip** (Space Mono `0.6rem`, `#888`, `position: absolute`, `top: 1.5rem`, `left: 1.5rem`):
```
FINN'S LANDZUNGE // EXPERIMENTAL PORTFOLIO
DATA FEED: STATION_01
```

**Data display** (vertically centered, left-aligned with `padding-left: 5vw`):
- `WIND: [value] KM/H` — Inter Black, `clamp(8vw, 14vw, 18rem)`, `#FFFFFF`, `line-height: 0.88`
- `TEMP: [value]°C` — Inter Black, `clamp(5vw, 9vw, 12rem)`, `#FFFFFF`
- `WATER: [value]°C` — Inter Black, `clamp(3.5vw, 6vw, 8rem)`, `#888` (dimmer — secondary data)

Loading state: values show `--` with `opacity` pulsing `0.4 → 1` over 1.5s. Weather data fetched from existing backend API (no change to `weather.js` logic, only the DOM rendering).

### Room 03 — Exhibition Plaque

**Background:** Pure `#000000`.

**Layout:** Two columns, no gap, full-height.
- Left: `width: 65%`, `overflow-y: auto`, `height: 100dvh` (inner scroll)
- Right: `width: 35%`, `position: sticky`, `top: 0`, `height: 100dvh`, `overflow: hidden`

**Right column:** Three vertical photo slivers (`sliver-1.jpg`, `sliver-2.jpg`, `sliver-3.jpg`) stacked with `height: 33.333%` each, `1px #000` gap. `object-fit: cover`. Same grayscale/contrast CSS treatment. No captions.

**Left column content** (padding `3rem 3rem 3rem 4rem`):

Each sub-section follows the same pattern: a large section label in Inter Black, then body text in Space Mono, separated by a `1px solid #222` rule.

1. **HISTORY** — label at `clamp(3rem, 8vw, 7rem)`, partially cropped at top (section starts `margin-top: -0.15em` to bleed into the padding). Body: existing History and Geography prose, condensed to remove i18n markup. Uppercase, Space Mono `0.72rem`, `#888`, `line-height: 1.8`.

2. **GEOGRAPHY** — same label treatment at `clamp(2rem, 5vw, 4.5rem)`. Body: Sector Analysis prose.

3. **HERITAGE** — label + Heritage Protocol prose.

4. **NAVIGATION** — label + data table. Table rendered as `<dl>` (definition list) for clean markup: `<dt>` in Space Mono `0.6rem` `#555` uppercase, `<dd>` in Space Mono `0.75rem` `#ccc`. Rows: GPS UPLINK · GRID SECTOR · ACCESS WINDOW · CLEARANCE · INFRASTRUCTURE · MAP LINK. Map link in `#CCFF00`.

5. **FIELD TRANSMISSION** — the existing quote block. `border-left: 3px solid #CCFF00`. Italic Space Mono `0.8rem` `#ccc`. Attribution in `#555`.

The inner scroll has no visible scrollbar (`scrollbar-width: none`). Users scroll naturally within the left column when their cursor is over it.

### Room 04 — Visitor Canvas

**Background:** Pure `#000000`.

**Ghost text layer** (`position: absolute`, `inset: 0`, `pointer-events: none`, `z-index: 0`): 3 words placed at fixed random positions — e.g. `CHAOS` at `top: 10%, left: 20%`; `BEAUTIFUL` at `top: 55%, left: 40%`; `LOST` at `top: 75%, left: 10%`. Inter Black, `clamp(8rem, 20vw, 20rem)`, `color: #FFFFFF`, `opacity: 0.06`.

**Entries layer** (`position: absolute`, `inset: 0`, `overflow: hidden`, `z-index: 1`): Each guestbook entry rendered as an absolutely positioned element. Position seeded from entry `id` hash to ensure consistent placement across reloads (not re-randomised on every render). Formula: `left = (hash % 70) + 5` percent, `top = ((hash >> 4) % 75) + 5` percent. Font size cycles through `[0.65rem, 0.8rem, 1rem, 1.1rem]` based on `hash % 4`.

Entry markup:
```html
<div class="canvas-entry" style="left: X%; top: Y%;">
  <span class="canvas-handle">HANDLE</span>
  <span class="canvas-message">message text</span>
</div>
```
Handle: Space Mono `#CCFF00`. Message: Space Mono `#888`. Newest entry: message colour `#FFFFFF`.

**Form** (`position: absolute`, `bottom: 0`, `left: 0`, `right: 0`, `z-index: 2`): A `2.5rem` tall strip, `background: #000`, `border-top: 1px solid #111`. Contains:
- A blinking `#CCFF00` cursor block (`6px × 1.2rem`, `animation: blink 1s step-end infinite`)
- Placeholder text in Space Mono `#444`: `LOG YOUR TRANSMISSION_`
- On click: expands to reveal handle input + message textarea + `[ UPLINK ]` submit button, all in Space Mono on black. No visible borders — inputs have only a bottom `1px solid #333` underline.
- Rate limiting and Supabase logic unchanged from existing `guestbook.js`

---

## 4. Dispatches Page — dispatches.html

Same global styles (black, Inter Black, Space Mono, grain treatment).

No scroll-snap on this page — normal document scroll throughout.

**Header section** (`min-height: 100dvh`, full-bleed, not snapped):
- `DISPATCHES` in Inter Black, `clamp(5rem, 18vw, 16rem)`, white, partially cropped at top
- Below: `FIELD TRANSMISSIONS FROM FINN'S LANDZUNGE` in Space Mono `0.7rem` `#888`
- No background image on this page — pure black

**Dispatches list** (flows naturally below the header):
- Each `<article>`: date in Space Mono `0.65rem` `#555`, title in Inter Black `1.8rem`, excerpt in Space Mono `0.75rem` `#888`, `1px solid #1a1a1a` rule between entries. Padding `3rem 4rem`.
- Max-width `900px`, centered.

**Navigation:** `← RETURN` in Space Mono `#CCFF00`, `position: fixed`, `top: 1.5rem`, `left: 1.5rem`. Links to `/`.

---

## 5. Technical Notes

### Fonts
Add to `package.json`:
```
@fontsource/inter (with 900 weight variant)
@fontsource/space-mono
```
Remove: `@fontsource/orbitron`, `@fontsource/rajdhani`, `@fontsource/vt323`

### CSS Architecture
Replace `style.css` wholesale. New file structured as:
1. Font imports
2. CSS custom properties (tokens)
3. Keyframe animations (`blink`, `pulse`)
4. Reset + base
5. Room layout (snap container, room sections)
6. Room 01 styles
7. Room 02 styles
8. Room 03 styles (plaque columns, sub-sections)
9. Room 04 styles (canvas, entries, form)
10. Room counter (fixed chrome)
11. Dispatches page styles

### JavaScript changes
- `main.js`: remove `initI18n()`, `initSound()`, `initTracker()` calls
- Delete: `i18n.js`, `sound.js`, `tracker.js`
- Keep: `guestbook.js`, `weather.js`, `dispatches.js`, `dispatches-page.js`
- New: `room-counter.js` — `IntersectionObserver` watching each room section, updates the `01 / 04` counter text
- `guestbook.js`: update DOM rendering to produce `.canvas-entry` markup with hash-seeded positioning; update form expand/collapse logic
- `weather.js`: update DOM rendering to target new Room 02 elements instead of `.terminal-block`

### HTML changes
- `index.html`: replace all section content and structure; remove `data-en`/`data-de` attributes; remove sound/lang toggle buttons; add room sections with IDs `room-01` through `room-04`; add room counter element
- `dispatches.html`: replace header and list structure

### Images
Required files in `frontend/public/images/`:
- `hero.jpg` — water/lake photo for Room 01
- `weather.jpg` — water photo for Room 02 (can reuse hero)
- `sliver-1.jpg`, `sliver-2.jpg`, `sliver-3.jpg` — nature detail shots (roots, dirt, concrete) for Room 03

User provides these before build. Implementation can use CSS `background-color: #111` as placeholder.

### Scroll Snap Caveats
- `scroll-snap-type: y mandatory` on `html`, `overflow-y: scroll`
- Room 03 left column: `overflow-y: auto` with `overscroll-behavior: contain` so inner scroll doesn't trigger page snap
- Room 04 canvas form expansion must not trigger a snap jump — use `scroll-snap-stop: always` on rooms and ensure form is within Room 04 bounds

### Accessibility
- Room 01 section: `aria-label="Entrance — Finn's Landzunge, coordinates 51°15'41″N 12°20'22″E"`
- Room counter: `aria-live="polite"`, `aria-label="Room X of 4"`
- Enter Exhibition button: standard `<button>` element
- Canvas entries: wrapped in `role="list"` + `role="listitem"` for screen reader traversal

---

## 6. Out of Scope

- Admin dashboard (`admin/`) — untouched
- Backend API (`backend/`) — untouched  
- Supabase schema — untouched
- GitHub Actions deploy workflow — untouched
- SEO meta tags and structured data — preserved as-is, updated copy where i18n markup is removed
