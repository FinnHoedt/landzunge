# i18n Language Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an EN/DE language toggle to the Finn's Landzunge landing page using `data-en`/`data-de` attributes and ~20 lines of vanilla JS.

**Architecture:** Every translatable element gets `data-en` and `data-de` attributes. A `<script>` block at the bottom of `index.html` reads `localStorage` for saved language preference, then swaps all `innerHTML` values on toggle. No external files added.

**Tech Stack:** HTML5 data attributes, vanilla JS, localStorage, CSS (button styling only)

---

### Task 1: Toggle button, CSS, JS engine, hero data attributes

**Files:**
- Modify: `index.html`
- Modify: `style.css`

This task wires up the full i18n engine end-to-end using just the hero elements as the first translated content. After this task the toggle button is visible and switching EN↔DE works for the hero section.

- [ ] **Step 1: Add toggle button as first child of `<body>`**

In `index.html`, insert immediately after `<body>`:

```html
  <button id="lang-toggle" class="lang-toggle">DE</button>
```

- [ ] **Step 2: Add `data-en` and `data-de` to hero elements**

Replace the three translatable hero elements (leave `hero__coords` and `hero__title` unchanged — coordinates are universal notation, title is a proper name):

```html
  <header class="hero">
    <p class="hero__label" data-en="Protected Natural Heritage Site" data-de="Geschütztes Naturdenkmal">Protected Natural Heritage Site</p>
    <h1 class="hero__title">Finn's Landzunge</h1>
    <p class="hero__subtitle" data-en="Leipzig, Saxony &middot; Est. 2019" data-de="Leipzig, Sachsen &middot; Gegr. 2019">Leipzig, Saxony &middot; Est. 2019</p>
    <p class="hero__coords">51°15′41″N 12°20′22″E</p>
  </header>
```

- [ ] **Step 3: Add `<script>` block before `</body>`**

Insert immediately before `</body>`:

```html
  <script>
    var titles = {
      en: "Finn\u2019s Landzunge \u2014 Protected Natural Heritage Site",
      de: "Finn\u2019s Landzunge \u2014 Gesch\u00fctztes Naturdenkmal"
    };

    function applyLang(lang) {
      document.querySelectorAll('[data-' + lang + ']').forEach(function(el) {
        el.innerHTML = el.getAttribute('data-' + lang);
      });
      document.documentElement.lang = lang;
      document.title = titles[lang];
      document.getElementById('lang-toggle').textContent = lang === 'en' ? 'DE' : 'EN';
      localStorage.setItem('lang', lang);
    }

    document.getElementById('lang-toggle').addEventListener('click', function() {
      applyLang(document.documentElement.lang === 'en' ? 'de' : 'en');
    });

    applyLang(localStorage.getItem('lang') || 'en');
  </script>
```

- [ ] **Step 4: Add `.lang-toggle` CSS to `style.css`**

Append to the end of `style.css`, before the closing of the responsive block:

```css
/* ── Language toggle ──────────────────────────────── */
.lang-toggle {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: 1px solid #4a5c4e;
  color: #4a5c4e;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  padding: 0.3rem 0.65rem;
  cursor: pointer;
  z-index: 100;
  transition: background 0.15s, color 0.15s;
}

.lang-toggle:hover,
.lang-toggle:focus-visible {
  background: #4a5c4e;
  color: #f8f5f0;
  outline: none;
}
```

- [ ] **Step 5: Open `index.html` in a browser. Verify:**
  - Toggle button is visible top-right
  - Clicking DE switches hero label to "Geschütztes Naturdenkmal" and subtitle to "Leipzig, Sachsen · Gegr. 2019"
  - Clicking EN switches back
  - Refreshing the page after switching to DE keeps DE active (localStorage)
  - Button shows "EN" when German is active, "DE" when English is active

  (If running in a CLI-only context, skip browser check and verify the HTML/JS is syntactically correct.)

- [ ] **Step 6: Commit**

```bash
git add index.html style.css
git commit -m "feat: add language toggle button and i18n JS engine"
```

---

### Task 2: Add German translations to all remaining sections

**Files:**
- Modify: `index.html`

Add `data-en` and `data-de` to every remaining translatable element. Use `innerHTML`-safe content (HTML entities for any markup inside attribute values).

- [ ] **Step 1: Translate History section headings and paragraphs**

Replace the `#history` section content:

```html
    <section class="section" id="history">
      <h2 data-en="History" data-de="Geschichte">History</h2>
      <p data-en="The Landzunge was first formally identified and documented in the spring of 2019 by Finn Hoedt, a Leipzig-based naturalist and informal geographer, during a solitary survey of the southern lakeshore. Hoedt, noting the unusual projection of grassed land into the water, marked the coordinates with precision and entered the site into the public geographic record under the name &lt;em&gt;Finn&#x2019;s Landzunge&lt;/em&gt; — a designation that has since remained uncontested." data-de="Die Landzunge wurde im Frühjahr 2019 erstmals offiziell erfasst und dokumentiert von Finn Hoedt, einem Naturkundler und informellen Geographen aus Leipzig, im Zuge einer einsamen Erkundung des südlichen Seeufers. Hoedt bemerkte den ungewöhnlichen Vorsprung des Grünlandes ins Wasser, vermaß die Koordinaten präzise und trug den Ort unter dem Namen &lt;em&gt;Finn&#x2019;s Landzunge&lt;/em&gt; in das öffentliche geographische Register ein — eine Bezeichnung, die seitdem unangefochten geblieben ist.">
        The Landzunge was first formally identified and documented in the spring of 2019 by Finn Hoedt,
        a Leipzig-based naturalist and informal geographer, during a solitary survey of the southern
        lakeshore. Hoedt, noting the unusual projection of grassed land into the water, marked the
        coordinates with precision and entered the site into the public geographic record under the
        name <em>Finn's Landzunge</em> — a designation that has since remained uncontested.
      </p>
      <p data-en="The site sits within the broader network of post-industrial lakes formed by the reclamation of former lignite mining pits in the Leipzig lowlands, a landscape transformation that has reshaped southern Saxony over the preceding decades. Against this backdrop of ecological renewal, the Landzunge represents a rare instance of naturally accumulated shoreline — a tongue of compacted earth and grass extending approximately into the lake without artificial reinforcement." data-de="Der Ort liegt im weiteren Netzwerk postindustrieller Seen, die durch die Rekultivierung ehemaliger Braunkohlegruben im Leipziger Tiefland entstanden sind — eine Landschaftsveränderung, die Südsachsen über die vergangenen Jahrzehnte grundlegend neu gestaltet hat. Vor dem Hintergrund dieser ökologischen Erneuerung stellt die Landzunge ein seltenes Beispiel natürlich angesammelten Uferlands dar — eine Zunge aus festem Erdreich und Gras, die sich ohne künstliche Befestigung ins Wasser erstreckt.">
        The site sits within the broader network of post-industrial lakes formed by the reclamation of
        former lignite mining pits in the Leipzig lowlands, a landscape transformation that has reshaped
        southern Saxony over the preceding decades. Against this backdrop of ecological renewal, the
        Landzunge represents a rare instance of naturally accumulated shoreline — a tongue of compacted
        earth and grass extending approximately into the lake without artificial reinforcement.
      </p>
      <p data-en="Since its documentation, the site has attracted the quiet attention of those who value understated natural phenomena. Its name appears in no official municipal register prior to Hoedt&#x2019;s intervention, a circumstance which has led some to conclude that the Landzunge existed, unknown and unnamed, for many years before its discovery." data-de="Seit seiner Dokumentation hat der Ort die stille Aufmerksamkeit jener auf sich gezogen, die unaufdringliche Naturphänomene zu schätzen wissen. Sein Name taucht in keinem offiziellen städtischen Register vor Hoedts Eingreifen auf — ein Umstand, der manche zu dem Schluss geführt hat, dass die Landzunge viele Jahre lang unbekannt und unbenannt existiert hatte, bevor sie entdeckt wurde.">
        Since its documentation, the site has attracted the quiet attention of those who value
        understated natural phenomena. Its name appears in no official municipal register prior to
        Hoedt's intervention, a circumstance which has led some to conclude that the Landzunge existed,
        unknown and unnamed, for many years before its discovery.
      </p>
    </section>
```

- [ ] **Step 2: Translate Geographic Significance section**

Replace the `#geography` section content:

```html
    <section class="section" id="geography">
      <h2 data-en="Geographic Significance" data-de="Geographische Bedeutung">Geographic Significance</h2>
      <p data-en="The Landzunge constitutes a minor but distinct geomorphological feature: a narrow promontory of level ground projecting from the southern bank into the open water. Its surface is composed of dense, low-lying grass, with a gradual slope toward the waterline on both flanks. The shoreline at the tip offers an unobstructed 270-degree prospect across the lake — a view available from no other point along this stretch of bank." data-de="Die Landzunge stellt ein kleines, aber markantes geomorphologisches Merkmal dar: eine schmale Landzunge aus ebenem Boden, die vom südlichen Ufer ins offene Wasser ragt. Ihre Oberfläche besteht aus dichtem, niedrig wachsendem Gras, mit einem sanften Gefälle zur Wasserlinie hin an beiden Flanken. Das Ufer an der Spitze bietet einen unverstellten 270-Grad-Ausblick über den See — eine Aussicht, die von keinem anderen Punkt entlang dieses Uferabschnitts zugänglich ist.">
        The Landzunge constitutes a minor but distinct geomorphological feature: a narrow promontory
        of level ground projecting from the southern bank into the open water. Its surface is composed
        of dense, low-lying grass, with a gradual slope toward the waterline on both flanks. The
        shoreline at the tip offers an unobstructed 270-degree prospect across the lake — a view
        available from no other point along this stretch of bank.
      </p>
      <p data-en="The term &lt;em&gt;Landzunge&lt;/em&gt; — literally &quot;tongue of land&quot; in German — is a precise topographic descriptor for this class of feature. The site&#x2019;s coordinates (51.2614894° N, 12.339342° E) place it within the wider Neuseenland region of Saxony, a landscape of considerable ecological and recreational interest. The Landzunge occupies a modest but irreplaceable position within this geography." data-de="Der Begriff &lt;em&gt;Landzunge&lt;/em&gt; — wörtlich „Zunge des Landes" — ist ein präziser topographischer Fachausdruck für diese Art von Formation. Die Koordinaten des Ortes (51,2614894° N, 12,339342° O) verorten ihn im weiteren Neuseenland Sachsens, einer Landschaft von erheblichem ökologischen und Freizeitwert. Die Landzunge nimmt eine bescheidene, aber unersetzliche Stellung in dieser Geographie ein.">
        The term <em>Landzunge</em> — literally "tongue of land" in German — is a precise topographic
        descriptor for this class of feature. The site's coordinates (51.2614894° N, 12.339342° E)
        place it within the wider Neuseenland region of Saxony, a landscape of considerable ecological
        and recreational interest. The Landzunge occupies a modest but irreplaceable position within
        this geography.
      </p>
    </section>
```

- [ ] **Step 3: Translate Notable Visitor section**

Replace the `#visitor` section content:

```html
    <section class="section" id="visitor">
      <h2 data-en="Notable Visitor" data-de="Bemerkenswerter Besucher">Notable Visitor</h2>
      <blockquote>
        <p data-en="&quot;There is something clarifying about standing at the very end of it. The water on both sides, the open lake ahead. One feels, briefly, that geography has made a small concession.&quot;" data-de="„Es gibt etwas Klärendes daran, ganz am äußersten Ende zu stehen. Das Wasser auf beiden Seiten, der offene See voraus. Für einen kurzen Moment hat man das Gefühl, die Geographie habe ein kleines Zugeständnis gemacht."">
          "There is something clarifying about standing at the very end of it. The water on both sides,
          the open lake ahead. One feels, briefly, that geography has made a small concession."
        </p>
        <cite data-en="— Finn Hoedt, at the Landzunge, June 2019" data-de="— Finn Hoedt, an der Landzunge, Juni 2019">— Finn Hoedt, at the Landzunge, June 2019</cite>
      </blockquote>
    </section>
```

- [ ] **Step 4: Translate Heritage Status section**

Replace the `#heritage` section content:

```html
    <section class="section" id="heritage">
      <h2 data-en="Heritage Status" data-de="Denkmalstatus">Heritage Status</h2>
      <p data-en="Finn&#x2019;s Landzunge is listed as a site of informal geographic and cultural significance under the Leipzig Municipal Heritage Register (entry filed 2021). The designation recognises the site&#x2019;s role as a documented natural feature of the post-mining lake landscape and acknowledges its discovery and naming by Finn Hoedt as an act of civic geographic contribution." data-de="Finn&#x2019;s Landzunge ist als Stätte von informeller geographischer und kultureller Bedeutung im Leipziger Stadtdenkmalregister eingetragen (Eintrag 2021). Die Auszeichnung würdigt die Rolle des Ortes als dokumentiertes Naturdenkmal in der Seenlandschaft des ehemaligen Bergbaugebiets und erkennt seine Entdeckung und Benennung durch Finn Hoedt als einen Akt bürgerschaftlichen geographischen Beitrags an.">
        Finn's Landzunge is listed as a site of informal geographic and cultural significance under
        the Leipzig Municipal Heritage Register (entry filed 2021). The designation recognises the
        site's role as a documented natural feature of the post-mining lake landscape and acknowledges
        its discovery and naming by Finn Hoedt as an act of civic geographic contribution.
      </p>
      <p data-en="The Heritage Foundation requests that visitors treat the site with appropriate respect: no excavation, no alteration of the natural shoreline, and no removal of material. The Landzunge is a shared resource. It belongs to everyone, but it is named after Finn." data-de="Die Denkmalstiftung bittet Besucher, den Ort mit angemessenem Respekt zu behandeln: kein Graben, keine Veränderung des natürlichen Ufers und keine Entnahme von Material. Die Landzunge ist ein gemeinsames Gut. Sie gehört allen — aber sie ist nach Finn benannt.">
        The Heritage Foundation requests that visitors treat the site with appropriate respect:
        no excavation, no alteration of the natural shoreline, and no removal of material. The
        Landzunge is a shared resource. It belongs to everyone, but it is named after Finn.
      </p>
    </section>
```

- [ ] **Step 5: Translate Visit section heading and table**

Replace the `#visit` section content:

```html
    <section class="section" id="visit">
      <h2 data-en="Plan Your Visit" data-de="Besuch planen">Plan Your Visit</h2>
      <table class="visit-table">
        <tr>
          <th scope="row" data-en="Coordinates" data-de="Koordinaten">Coordinates</th>
          <td>51.2614894° N, 12.339342° E</td>
        </tr>
        <tr>
          <th scope="row" data-en="Location" data-de="Standort">Location</th>
          <td data-en="Leipzig, Saxony, Federal Republic of Germany" data-de="Leipzig, Sachsen, Bundesrepublik Deutschland">Leipzig, Saxony, Federal Republic of Germany</td>
        </tr>
        <tr>
          <th scope="row" data-en="Opening Hours" data-de="Öffnungszeiten">Opening Hours</th>
          <td data-en="Dawn to Dusk, Year-Round" data-de="Von Sonnenaufgang bis Sonnenuntergang, ganzjährig">Dawn to Dusk, Year-Round</td>
        </tr>
        <tr>
          <th scope="row" data-en="Admission" data-de="Eintritt">Admission</th>
          <td data-en="Free of Charge" data-de="Kostenlos">Free of Charge</td>
        </tr>
        <tr>
          <th scope="row" data-en="Facilities" data-de="Einrichtungen">Facilities</th>
          <td data-en="None. The Landzunge provides itself." data-de="Keine. Die Landzunge genügt sich selbst.">None. The Landzunge provides itself.</td>
        </tr>
        <tr>
          <th scope="row" data-en="Directions" data-de="Anfahrt">Directions</th>
          <td>
            <a href="https://www.google.com/maps/place/Finn's+Landzunge/@51.3097009,12.3624668,13z/data=!4m6!3m5!1s0x47a6fb004174db55:0x11202b8ea125de6b!8m2!3d51.2614894!4d12.339342!16s%2Fg%2F11z5slxmbk" target="_blank" rel="noopener">
              View on Google Maps
            </a>
          </td>
        </tr>
      </table>
    </section>
```

- [ ] **Step 6: Translate footer**

Replace the footer paragraph:

```html
  <footer class="footer">
    <p data-en="&copy; Finn&#x2019;s Landzunge Heritage Foundation" data-de="&copy; Finn&#x2019;s Landzunge Denkmalstiftung">&copy; Finn's Landzunge Heritage Foundation</p>
  </footer>
```

- [ ] **Step 7: Verify no translatable element was missed**

Run:
```bash
grep -n "History\|Geographic\|Notable\|Heritage Status\|Plan Your\|Coordinates\|Location\|Opening Hours\|Admission\|Facilities\|Directions\|Heritage Foundation" /Users/finn.hoedt/Code/landzunge/index.html | grep -v "data-en"
```

Expected: no output (every translatable element has a `data-en` attribute).

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add data-en/data-de translations to all sections"
```
