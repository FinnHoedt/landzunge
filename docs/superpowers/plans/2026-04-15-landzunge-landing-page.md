# Finn's Landzunge Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page static heritage site for Finn's Landzunge — a deadpan-serious historical landmark page for a grassy lakeside spot in Leipzig.

**Architecture:** One `index.html` file with inline or linked `style.css`. No build step, no JS. Deployed to GitHub Pages by pushing to `main` with Pages configured to serve from root.

**Tech Stack:** HTML5, CSS3, Google Fonts (Playfair Display via `<link>`), GitHub Pages

---

### Task 1: Scaffold HTML structure

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html` with full document skeleton and all seven section stubs**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Finn's Landzunge — Protected Natural Heritage Site</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <header class="hero">
    <p class="hero__label">Protected Natural Heritage Site</p>
    <h1 class="hero__title">Finn's Landzunge</h1>
    <p class="hero__subtitle">Leipzig, Saxony &middot; Est. 2019</p>
    <p class="hero__coords">51°15′41″N 12°20′22″E</p>
  </header>

  <main>

    <section class="section" id="history">
      <h2>History</h2>
      <!-- content Task 3 -->
    </section>

    <hr class="divider" />

    <section class="section" id="geography">
      <h2>Geographic Significance</h2>
      <!-- content Task 3 -->
    </section>

    <hr class="divider" />

    <section class="section" id="visitor">
      <h2>Notable Visitor</h2>
      <!-- content Task 3 -->
    </section>

    <hr class="divider" />

    <section class="section" id="heritage">
      <h2>Heritage Status</h2>
      <!-- content Task 3 -->
    </section>

    <hr class="divider" />

    <section class="section" id="visit">
      <h2>Plan Your Visit</h2>
      <!-- content Task 3 -->
    </section>

  </main>

  <footer class="footer">
    <p>&copy; Finn's Landzunge Heritage Foundation</p>
  </footer>

</body>
</html>
```

- [ ] **Step 2: Open `index.html` in browser, verify structure renders without errors (unstyled is fine)**

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: scaffold HTML structure for landing page"
```

---

### Task 2: Write CSS

**Files:**
- Create: `style.css`

- [ ] **Step 1: Create `style.css`**

```css
/* ── Reset & base ─────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #f8f5f0;
  color: #2c2c2c;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.0625rem;
  line-height: 1.75;
}

/* ── Layout ───────────────────────────────────────── */
.hero,
main,
.footer {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ── Hero ─────────────────────────────────────────── */
.hero {
  text-align: center;
  padding-top: 5rem;
  padding-bottom: 4rem;
}

.hero__label {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 0.875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4a5c4e;
  margin-bottom: 1rem;
}

.hero__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2.25rem, 6vw, 3.5rem);
  font-weight: 700;
  line-height: 1.15;
  color: #2c2c2c;
  margin-bottom: 0.75rem;
}

.hero__subtitle {
  font-size: 0.9375rem;
  letter-spacing: 0.06em;
  color: #5a5a5a;
  margin-bottom: 0.5rem;
}

.hero__coords {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 0.875rem;
  color: #4a5c4e;
}

/* ── Divider ──────────────────────────────────────── */
.divider {
  border: none;
  border-top: 1px solid #d4cdc4;
  max-width: 680px;
  margin: 3rem auto;
}

/* ── Sections ─────────────────────────────────────── */
.section {
  padding: 0 0 0.5rem;
}

.section h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: #2c2c2c;
  margin-bottom: 1.25rem;
  letter-spacing: 0.02em;
}

.section p {
  margin-bottom: 1rem;
  color: #3a3a3a;
}

.section p:last-child {
  margin-bottom: 0;
}

/* ── Blockquote (Notable Visitor) ─────────────────── */
blockquote {
  border-left: 3px solid #4a5c4e;
  margin: 0;
  padding: 0.75rem 0 0.75rem 1.5rem;
}

blockquote p {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 1.0625rem;
  color: #2c2c2c;
}

blockquote cite {
  display: block;
  margin-top: 0.75rem;
  font-style: normal;
  font-size: 0.875rem;
  color: #5a5a5a;
  letter-spacing: 0.04em;
}

/* ── Visit table ──────────────────────────────────── */
.visit-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  font-size: 0.9375rem;
}

.visit-table td {
  padding: 0.5rem 0;
  vertical-align: top;
  border-bottom: 1px solid #e8e3db;
}

.visit-table td:first-child {
  width: 45%;
  color: #5a5a5a;
  font-size: 0.8125rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-right: 1rem;
}

.visit-table a {
  color: #4a5c4e;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.visit-table a:hover {
  color: #2c2c2c;
}

/* ── Footer ───────────────────────────────────────── */
.footer {
  text-align: center;
  padding: 3rem 1.5rem 4rem;
  font-size: 0.8125rem;
  color: #8a8a8a;
  letter-spacing: 0.06em;
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 480px) {
  .hero {
    padding-top: 3rem;
    padding-bottom: 2.5rem;
  }
}
```

- [ ] **Step 2: Reload `index.html` in browser, verify hero renders correctly with fonts and colors**

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add CSS styling for heritage site aesthetic"
```

---

### Task 3: Write all section content

**Files:**
- Modify: `index.html`

Replace each `<!-- content Task 3 -->` comment with the content below.

- [ ] **Step 1: Replace History section stub**

Replace:
```html
      <h2>History</h2>
      <!-- content Task 3 -->
```
With:
```html
      <h2>History</h2>
      <p>
        The Landzunge was first formally identified and documented in the spring of 2019 by Finn Hoedt,
        a Leipzig-based naturalist and informal geographer, during a solitary survey of the southern
        lakeshore. Hoedt, noting the unusual projection of grassed land into the water, marked the
        coordinates with precision and entered the site into the public geographic record under the
        name <em>Finn's Landzunge</em> — a designation that has since remained uncontested.
      </p>
      <p>
        The site sits within the broader network of post-industrial lakes formed by the reclamation of
        former lignite mining pits in the Leipzig lowlands, a landscape transformation that has reshaped
        southern Saxony over the preceding decades. Against this backdrop of ecological renewal, the
        Landzunge represents a rare instance of naturally accumulated shoreline — a tongue of compacted
        earth and grass extending approximately into the lake without artificial reinforcement.
      </p>
      <p>
        Since its documentation, the site has attracted the quiet attention of those who value
        understated natural phenomena. Its name appears in no official municipal register prior to
        Hoedt's intervention, a circumstance which has led some to conclude that the Landzunge existed,
        unknown and unnamed, for many years before its discovery.
      </p>
```

- [ ] **Step 2: Replace Geographic Significance section stub**

Replace:
```html
      <h2>Geographic Significance</h2>
      <!-- content Task 3 -->
```
With:
```html
      <h2>Geographic Significance</h2>
      <p>
        The Landzunge constitutes a minor but distinct geomorphological feature: a narrow promontory
        of level ground projecting from the southern bank into the open water. Its surface is composed
        of dense, low-lying grass, with a gradual slope toward the waterline on both flanks. The
        shoreline at the tip offers an unobstructed 270-degree prospect across the lake — a view
        available from no other point along this stretch of bank.
      </p>
      <p>
        The term <em>Landzunge</em> — literally "tongue of land" in German — is a precise topographic
        descriptor for this class of feature. The site's coordinates (51.2614894° N, 12.339342° E)
        place it within the wider Neuseenland region of Saxony, a landscape of considerable ecological
        and recreational interest. The Landzunge occupies a modest but irreplaceable position within
        this geography.
      </p>
```

- [ ] **Step 3: Replace Notable Visitor section stub**

Replace:
```html
      <h2>Notable Visitor</h2>
      <!-- content Task 3 -->
```
With:
```html
      <h2>Notable Visitor</h2>
      <blockquote>
        <p>
          "There is something clarifying about standing at the very end of it. The water on both sides,
          the open lake ahead. One feels, briefly, that geography has made a small concession."
        </p>
        <cite>— Finn Hoedt, at the Landzunge, June 2019</cite>
      </blockquote>
```

- [ ] **Step 4: Replace Heritage Status section stub**

Replace:
```html
      <h2>Heritage Status</h2>
      <!-- content Task 3 -->
```
With:
```html
      <h2>Heritage Status</h2>
      <p>
        Finn's Landzunge is listed as a site of informal geographic and cultural significance under
        the Leipzig Municipal Heritage Register (entry filed 2021). The designation recognises the
        site's role as a documented natural feature of the post-mining lake landscape and acknowledges
        its discovery and naming by Finn Hoedt as an act of civic geographic contribution.
      </p>
      <p>
        The Heritage Foundation requests that visitors treat the site with appropriate respect:
        no excavation, no alteration of the natural shoreline, and no removal of material. The
        Landzunge is a shared resource. It belongs to everyone, but it is named after Finn.
      </p>
```

- [ ] **Step 5: Replace Visit section stub**

Replace:
```html
      <h2>Plan Your Visit</h2>
      <!-- content Task 3 -->
```
With:
```html
      <h2>Plan Your Visit</h2>
      <table class="visit-table">
        <tr>
          <td>Coordinates</td>
          <td>51.2614894° N, 12.339342° E</td>
        </tr>
        <tr>
          <td>Location</td>
          <td>Leipzig, Saxony, Federal Republic of Germany</td>
        </tr>
        <tr>
          <td>Opening Hours</td>
          <td>Dawn to Dusk, Year-Round</td>
        </tr>
        <tr>
          <td>Admission</td>
          <td>Free of Charge</td>
        </tr>
        <tr>
          <td>Facilities</td>
          <td>None. The Landzunge provides itself.</td>
        </tr>
        <tr>
          <td>Directions</td>
          <td>
            <a href="https://www.google.com/maps/place/Finn's+Landzunge/@51.3097009,12.3624668,13z/data=!4m6!3m5!1s0x47a6fb004174db55:0x11202b8ea125de6b!8m2!3d51.2614894!4d12.339342!16s%2Fg%2F11z5slxmbk" target="_blank" rel="noopener">
              View on Google Maps
            </a>
          </td>
        </tr>
      </table>
```

- [ ] **Step 6: Reload in browser, read all sections, verify content looks correct and no stubs remain**

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add all section content for landing page"
```

---

### Task 4: Configure GitHub Pages deployment

**Files:**
- No code changes — GitHub repository settings only

- [ ] **Step 1: Push `main` branch to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 2: In the GitHub repository settings, navigate to Pages → Source → Deploy from branch → `main` / `/ (root)` → Save**

- [ ] **Step 3: Wait ~60 seconds, then visit `https://<your-github-username>.github.io/landzunge/` (or the custom domain if configured) to verify the page loads**

- [ ] **Step 4: Copy the live URL and paste it into the Google Maps listing under "Website" or "Add a missing detail"**

---

### Task 5: Final review pass

**Files:**
- Modify: `index.html` and/or `style.css` as needed

- [ ] **Step 1: Open the live page on both desktop and mobile (or use browser DevTools device simulation at 375px width)**

- [ ] **Step 2: Check the following:**
  - [ ] Hero title doesn't overflow on small screens
  - [ ] Coordinates display correctly (`51°15′41″N 12°20′22″E`)
  - [ ] Google Maps link opens correctly
  - [ ] Font (Playfair Display) loads — if offline fallback (Georgia) also looks acceptable
  - [ ] No unstyled stubs or HTML comments visible

- [ ] **Step 3: Commit any fixes**

```bash
git add index.html style.css
git commit -m "fix: final review adjustments"
```
