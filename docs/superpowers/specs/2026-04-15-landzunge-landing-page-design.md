# Finn's Landzunge — Landing Page Design

**Date:** 2026-04-15
**Status:** Approved

## Overview

A single-page static website for "Finn's Landzunge", a Google Maps entry marked as a historical landmark. The page plays it completely straight — deadpan serious heritage/tourism site aesthetic, as if the spot were a genuine protected natural monument. The joke is entirely in the presentation, not in winking at the audience.

The real location: a grassy lakeside spot in Leipzig, Saxony. Coordinates: 51.2614894, 12.339342.

## Architecture

- Single `index.html` + `style.css`
- No build step, no JavaScript framework, no dependencies
- Optional `assets/` folder for future photos
- Deployed via GitHub Pages

## Content Sections

### 1. Hero
- Name: "Finn's Landzunge"
- Subtitle: "Protected Natural Heritage Site · Leipzig, Saxony"
- Established year (plausible, e.g. 2019)
- Coordinates displayed formally

### 2. History
- 2–3 paragraphs of deadpan founding lore
- Finn discovers/claims the Landzunge, names it after himself
- Fake historical context tied loosely to Leipzig geography

### 3. Geographic Significance
- Formal description of the tongue of land projecting into the lake
- Why the specific topography is notable

### 4. Notable Visitor
- Fake quote attributed to Finn Hoedt, with a date
- Presented like a placard quote at a real heritage site

### 5. Heritage Status
- Fake designation, e.g. "Listed under the Leipzig Municipal Heritage Register, 2021"
- Formal bureaucratic language

### 6. Visit
- Real coordinates dressed up formally
- Opening hours: "Dawn to Dusk, Year-Round"
- Admission: Free of charge
- Link to Google Maps entry

### 7. Footer
- "© Finn's Landzunge Heritage Foundation"

## Visual Design

- **Aesthetic:** Old-money conservation trust / serious heritage site
- **Fonts:** Playfair Display (headings), system sans-serif (body)
- **Colors:** Off-white background (`#f8f5f0`), dark slate text (`#2c2c2c`), olive/dark teal accent (`#4a5c4e`)
- **Layout:** Centered narrow column (~680px), generous whitespace, thin `<hr>` between sections
- **Decorative elements:** Small SVG divider or landmark icon between sections
- **Responsive:** Mobile-friendly, single column

## Out of Scope

- No JavaScript
- No CMS or dynamic content
- No photos at launch (can add to `assets/` later)
- No multi-page structure
