# i18n Language Toggle Design

**Date:** 2026-04-15
**Status:** Approved

## Overview

Add English/German language toggle to the Finn's Landzunge static landing page. Single-page client-side switching with no page reload. Language preference persisted in `localStorage`.

## Architecture

All translatable text nodes get `data-en` and `data-de` attributes inline on their elements. A small `<script>` block at the bottom of `index.html` (~20 lines, no external file) handles:

1. On load: read `localStorage` for saved language, default to `"en"`, apply translations
2. Toggle button click: switch language, update `<html lang="">`, save to `localStorage`, re-render

No new files. Only `index.html` changes.

## What Gets Translated

All user-visible text:

- Hero: label, title, subtitle (coordinates stay unchanged)
- All section `<h2>` headings
- All `<p>` body text
- Blockquote `<p>` and `<cite>`
- Visit table `<th>` labels (Coordinates, Location, Opening Hours, Admission, Facilities, Directions)
- Visit table `<td>` values (Dawn to Dusk, Year-Round; Free of Charge; None. The Landzunge provides itself.; Leipzig, Saxony, Federal Republic of Germany)
- Footer copyright line

## What Does NOT Get Translated

- Google Maps link text ("View on Google Maps") — proper name, stays English
- Coordinates (51.2614894° N, 12.339342° E) — universal notation
- The URL in the Google Maps link

## Toggle Button

- Positioned top-right of the page, fixed or in the hero
- Shows the *other* language label: "DE" when English active, "EN" when German active
- Styled to match the site aesthetic (minimal, serif-adjacent, no bright colors)

## Implementation Pattern

```html
<span data-en="History" data-de="Geschichte">History</span>
```

```js
function applyLang(lang) {
  document.querySelectorAll('[data-' + lang + ']').forEach(el => {
    el.textContent = el.getAttribute('data-' + lang);
  });
  document.documentElement.lang = lang;
  document.querySelector('#lang-toggle').textContent = lang === 'en' ? 'DE' : 'EN';
}
```

## Out of Scope

- More than two languages
- URL-based language routing (e.g. `/de/`)
- Server-side language detection
- External translation files
