# Frontend Refactor + Admin Dashboard — Implementation Plan (Part 2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Supabase from the public frontend, add a dispatches section, and build the React admin dashboard for managing guestbook entries and authoring dispatches.

**Architecture:** Frontend (`frontend/`) talks only to NestJS at `api.finnslandzunge.com` via fetch — no Supabase access. Admin (`admin/`) is a React SPA served by NestJS at the root `/`; it uses Supabase Auth only for login, then makes all data calls through NestJS. A small patch to the backend adds the missing admin guestbook endpoint, updates dispatches admin to include body, and changes `serveRoot` from `/admin` to `/` so the SPA is accessible at the domain root.

**Tech Stack:** Vite 6, vanilla JS (frontend), React 18 + React Router 6 + Tiptap 2 (admin), @supabase/supabase-js (admin auth only), Node 24

---

## File Map

**Modified (backend — small patches):**
- `backend/src/app.module.ts` — change `serveRoot: '/admin'` → `serveRoot: '/'`
- `backend/src/guestbook/guestbook.service.ts` — add `getAllAdmin()` method
- `backend/src/guestbook/guestbook.service.spec.ts` — add `getAllAdmin` test
- `backend/src/guestbook/guestbook.controller.ts` — add `GET admin/all` route
- `backend/src/guestbook/guestbook.controller.spec.ts` — add controller test
- `backend/src/dispatches/dispatches.service.ts` — add `body` to `getAllAdmin()` select

**Modified (frontend):**
- `frontend/package.json` — remove `@supabase/supabase-js`, `leo-profanity`
- `frontend/.env.example` — replace `VITE_SUPABASE_*` with `VITE_API_URL`
- `frontend/vite.config.js` — add multi-page input for `dispatches.html`
- `frontend/src/main.js` — add `initDispatchesTeaser()` call
- `frontend/src/guestbook.js` — full rewrite using fetch (no Supabase)
- `frontend/index.html` — add dispatches teaser section
- `frontend/style.css` — add dispatches teaser styles

**Deleted (frontend):**
- `frontend/src/supabase.js`

**Created (frontend):**
- `frontend/src/dispatches.js` — fetch/render teaser on index, full list on dispatches.html
- `frontend/dispatches.html` — full dispatches list page

**Created (admin/):**
- `admin/package.json`
- `admin/vite.config.js`
- `admin/index.html`
- `admin/.env.example`
- `admin/src/main.jsx`
- `admin/src/App.jsx`
- `admin/src/admin.css`
- `admin/src/lib/supabaseClient.js`
- `admin/src/lib/api.js`
- `admin/src/pages/Login.jsx`
- `admin/src/components/ProtectedRoute.jsx`
- `admin/src/components/Layout.jsx`
- `admin/src/pages/GuestbookPage.jsx`
- `admin/src/pages/DispatchesPage.jsx`
- `admin/src/pages/EditorPage.jsx`

---

### Task 1: Backend patches — admin endpoints + serveRoot fix

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/guestbook/guestbook.service.ts`
- Modify: `backend/src/guestbook/guestbook.service.spec.ts`
- Modify: `backend/src/guestbook/guestbook.controller.ts`
- Modify: `backend/src/guestbook/guestbook.controller.spec.ts`
- Modify: `backend/src/dispatches/dispatches.service.ts`

- [ ] **Step 1: Fix `serveRoot` in app.module.ts**

In `backend/src/app.module.ts`, change the ServeStaticModule config from `serveRoot: '/admin'` to `serveRoot: '/'`:

```typescript
ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'public', 'admin'),
  serveRoot: '/',
  serveStaticOptions: { fallthrough: true },
  exclude: ['/api/(.*)'],
}),
```

- [ ] **Step 2: Add `getAllAdmin` to guestbook service spec**

Add this describe block to `backend/src/guestbook/guestbook.service.spec.ts` inside the top-level `describe('GuestbookService')`:

```typescript
describe('getAllAdmin', () => {
  it('returns all entries including unapproved images with image_url', async () => {
    const rows = [
      { id: '1', name: 'Finn', message: 'Hi', created_at: '2026-01-01T00:00:00Z', image_path: 'img.jpg', image_approved: false },
      { id: '2', name: 'Guest', message: 'Hey', created_at: '2026-01-02T00:00:00Z', image_path: null, image_approved: false },
    ]
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: rows, error: null }),
    }
    const supabase = makeSupabase()
    supabase.client.from.mockReturnValue(mockChain)

    const service = new GuestbookService(supabase as any, makeConfig() as any)
    const result = await service.getAllAdmin()

    expect(result[0].image_url).toBe('https://test.supabase.co/storage/v1/object/public/guestbook-images/img.jpg')
    expect(result[0].image_approved).toBe(false)
    expect(result[1].image_url).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd /Users/finn/Code/landzunge/backend && npm test -- guestbook.service.spec
```

Expected: FAIL — `service.getAllAdmin is not a function`

- [ ] **Step 4: Add `getAllAdmin` to guestbook service**

Add this method to `backend/src/guestbook/guestbook.service.ts` after `getEntries()`:

```typescript
async getAllAdmin() {
  const { data, error } = await this.supabase.client
    .from('guestbook_entries')
    .select('id, name, message, created_at, image_path, image_approved')
    .order('created_at', { ascending: false })

  if (error) throw new InternalServerErrorException('Failed to fetch entries')

  const base = this.config.getOrThrow('SUPABASE_URL')
  return data.map((e) => ({
    id: e.id,
    name: e.name,
    message: e.message,
    created_at: e.created_at,
    image_path: e.image_path,
    image_approved: e.image_approved,
    image_url: e.image_path
      ? `${base}/storage/v1/object/public/guestbook-images/${e.image_path}`
      : null,
  }))
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
cd /Users/finn/Code/landzunge/backend && npm test -- guestbook.service.spec
```

Expected: PASS (all guestbook service tests)

- [ ] **Step 6: Add controller test for admin endpoint**

Add this test to `backend/src/guestbook/guestbook.controller.spec.ts`:

```typescript
it('GET /api/guestbook/admin/all calls getAllAdmin', async () => {
  mockService.getAllAdmin = jest.fn().mockResolvedValue([])
  await controller.getAllAdmin()
  expect(mockService.getAllAdmin).toHaveBeenCalled()
})
```

Also add `getAllAdmin: jest.fn()` to the `mockService` object at the top of the file.

- [ ] **Step 7: Add `getAllAdmin` to guestbook controller**

In `backend/src/guestbook/guestbook.controller.ts`, add this method. It MUST be declared before `@Get()` to avoid routing issues:

```typescript
@Get('admin/all')
@UseGuards(SupabaseAuthGuard, AdminGuard)
getAllAdmin() {
  return this.service.getAllAdmin()
}
```

Place it after the constructor and before `getEntries()`.

- [ ] **Step 8: Add `body` to dispatches `getAllAdmin` response**

In `backend/src/dispatches/dispatches.service.ts`, update the `getAllAdmin()` method to include `body` in the select:

```typescript
async getAllAdmin() {
  const { data, error } = await this.supabase.client
    .from('dispatches')
    .select('id, slug, title, body, published, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new InternalServerErrorException()
  return data
}
```

- [ ] **Step 9: Run all backend tests**

```bash
cd /Users/finn/Code/landzunge/backend && npm test
```

Expected: All tests PASS (controller test may show `getAllAdmin is not a function on mockService` if you forgot to add it to mockService — fix that first).

- [ ] **Step 10: Commit**

```bash
cd /Users/finn/Code/landzunge
git add backend/src/
git commit -m "feat: add admin guestbook endpoint, include body in dispatches admin, fix serveRoot"
```

---

### Task 2: Remove Supabase from frontend

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/.env.example`
- Delete: `frontend/src/supabase.js`

- [ ] **Step 1: Update `frontend/package.json`**

Remove `@supabase/supabase-js` and `leo-profanity` from dependencies:

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
    "@fontsource/orbitron": "^5.2.8",
    "@fontsource/rajdhani": "^5.2.7",
    "@fontsource/vt323": "^5.2.7"
  },
  "devDependencies": {
    "vite": "^6.3.2"
  }
}
```

- [ ] **Step 2: Update `frontend/.env.example`**

```
VITE_API_URL=https://api.finnslandzunge.com
```

- [ ] **Step 3: Delete `frontend/src/supabase.js`**

```bash
git rm /Users/finn/Code/landzunge/frontend/src/supabase.js
```

- [ ] **Step 4: Reinstall frontend dependencies**

```bash
cd /Users/finn/Code/landzunge/frontend && npm install
```

Expected: `node_modules/` updated, `@supabase/supabase-js` and `leo-profanity` no longer present.

- [ ] **Step 5: Commit**

```bash
cd /Users/finn/Code/landzunge
git add frontend/package.json frontend/package-lock.json frontend/.env.example
git commit -m "feat: remove Supabase and leo-profanity from frontend"
```

---

### Task 3: Rewrite guestbook.js to use the NestJS API

**Files:**
- Modify: `frontend/src/guestbook.js`

The guestbook API now returns `image_url` (string | null) instead of `image_path` + `image_approved`. Image uploads are `multipart/form-data` POSTs to the API. Rate limiting is server-side; localStorage check stays as a UX nicety.

- [ ] **Step 1: Replace entire content of `frontend/src/guestbook.js`:**

```javascript
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'
const RATE_LIMIT_KEY = 'gb_last_submit'
const RATE_LIMIT_MS = 60 * 60 * 1000

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, or WEBP images allowed.'
  if (file.size > MAX_SIZE_BYTES) return 'Image must be under 5MB.'
  return null
}

export async function initGuestbook() {
  await loadEntries()
  setupForm()
  setupImagePicker()
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

function renderEntries(entries) {
  const container = document.getElementById('guestbook-entries')
  if (entries.length === 0) {
    container.innerHTML = '<p style="color:#7a7a90; font-family: VT323, monospace; font-size: 1.1rem;">// NO TRANSMISSIONS LOGGED. UPLINK NOW.</p>'
    return
  }
  container.innerHTML = entries.map(e => {
    const imageHtml = e.image_url
      ? `<img class="guestbook-card__image" src="${esc(e.image_url)}" alt="visitor image" loading="lazy" />`
      : ''
    return `
      <div class="guestbook-card">
        <div class="card-header">${esc(e.name)} &middot; ${formatDate(e.created_at)}</div>
        <p>${esc(e.message)}</p>
        ${imageHtml}
      </div>
    `
  }).join('')
}

function setupForm() {
  document.getElementById('guestbook-form').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const last = localStorage.getItem(RATE_LIMIT_KEY)
    if (last && Date.now() - Number(last) < RATE_LIMIT_MS) {
      alert('One entry per hour. Come back later.')
      return
    }
    const name = ev.target.gb_name.value.trim().slice(0, 50)
    const message = ev.target.gb_message.value.trim().slice(0, 280)
    if (!name || !message) return

    const imageFile = ev.target.gb_image.files[0] ?? null
    if (imageFile) {
      const err = validateImage(imageFile)
      if (err) { alert(err); return }
    }

    const btn = ev.target.querySelector('button[type="submit"]')
    btn.disabled = true

    const formData = new FormData()
    formData.append('name', name)
    formData.append('message', message)
    if (imageFile) formData.append('image', imageFile)

    try {
      const res = await fetch(`${API_URL}/api/guestbook`, {
        method: 'POST',
        body: formData,
      })
      if (res.status === 400) {
        const body = await res.json()
        alert(body.message ?? 'Invalid submission.')
        return
      }
      if (!res.ok) throw new Error()
    } catch {
      alert('Failed to submit. Try again.')
      btn.disabled = false
      return
    }

    btn.disabled = false
    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
    ev.target.reset()
    const nameSpan = document.getElementById('gb_image_name')
    nameSpan.textContent = 'NO FILE SELECTED'
    nameSpan.classList.remove('has-file')
    await loadEntries()
  })
}

function setupImagePicker() {
  const btn = document.getElementById('gb_image_btn')
  const input = document.getElementById('gb_image')
  const nameSpan = document.getElementById('gb_image_name')
  btn.addEventListener('click', () => input.click())
  input.addEventListener('change', () => {
    const file = input.files[0]
    if (file) {
      nameSpan.textContent = file.name
      nameSpan.classList.add('has-file')
    } else {
      nameSpan.textContent = 'NO FILE SELECTED'
      nameSpan.classList.remove('has-file')
    }
  })
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
```

- [ ] **Step 2: Verify the frontend builds**

```bash
cd /Users/finn/Code/landzunge/frontend && npm run build
```

Expected: Builds successfully with no errors referencing Supabase or leo-profanity.

- [ ] **Step 3: Commit**

```bash
cd /Users/finn/Code/landzunge
git add frontend/src/guestbook.js
git commit -m "feat: refactor guestbook to use NestJS API instead of Supabase directly"
```

---

### Task 4: Add dispatches.js and update vite.config.js + main.js

**Files:**
- Create: `frontend/src/dispatches.js`
- Modify: `frontend/vite.config.js`
- Modify: `frontend/src/main.js`

- [ ] **Step 1: Create `frontend/src/dispatches.js`**

```javascript
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

export async function initDispatchesTeaser() {
  const container = document.getElementById('dispatches-teaser-list')
  if (!container) return
  try {
    const res = await fetch(`${API_URL}/api/dispatches`)
    if (!res.ok) throw new Error()
    const dispatches = await res.json()
    if (dispatches.length === 0) {
      container.innerHTML = '<p class="dispatches-empty">// NO DISPATCHES FILED.</p>'
      return
    }
    container.innerHTML = dispatches.slice(0, 3).map(d => `
      <div class="dispatch-teaser">
        <div class="dispatch-teaser__date retro">${formatDate(d.created_at)}</div>
        <h3 class="dispatch-teaser__title">${esc(d.title)}</h3>
        <p class="dispatch-teaser__excerpt">${esc(d.excerpt)}</p>
      </div>
    `).join('')
  } catch {
    container.innerHTML = '<p class="dispatches-empty">// UPLINK FAILED.</p>'
  }
}

export async function initDispatchesPage() {
  const container = document.getElementById('dispatches-list')
  if (!container) return
  try {
    const res = await fetch(`${API_URL}/api/dispatches`)
    if (!res.ok) throw new Error()
    const dispatches = await res.json()
    if (dispatches.length === 0) {
      container.innerHTML = '<p class="dispatches-empty">// NO DISPATCHES FILED. STANDBY.</p>'
      return
    }
    container.innerHTML = dispatches.map(d => `
      <article class="dispatch">
        <div class="dispatch__date retro">${formatDate(d.created_at)}</div>
        <h2 class="dispatch__title">${esc(d.title)}</h2>
        <p class="dispatch__excerpt">${esc(d.excerpt)}</p>
        <hr class="divider" />
      </article>
    `).join('')
  } catch {
    container.innerHTML = '<p class="dispatches-empty">// UPLINK FAILED.</p>'
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
```

- [ ] **Step 2: Update `frontend/vite.config.js` for multi-page build**

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        dispatches: 'dispatches.html',
      },
    },
  },
})
```

- [ ] **Step 3: Update `frontend/src/main.js` to call `initDispatchesTeaser()`**

```javascript
import { initI18n } from './i18n.js'
import { initSound } from './sound.js'
import { initGuestbook } from './guestbook.js'
import { initTracker } from './tracker.js'
import { initWeather } from './weather.js'
import { initDispatchesTeaser } from './dispatches.js'

initI18n()
initSound()
initGuestbook()
initTracker()
initWeather()
initDispatchesTeaser()
```

- [ ] **Step 4: Commit**

```bash
cd /Users/finn/Code/landzunge
git add frontend/src/dispatches.js frontend/vite.config.js frontend/src/main.js
git commit -m "feat: add dispatches module and multi-page Vite build config"
```

---

### Task 5: Add dispatches teaser to index.html and dispatches.html

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/dispatches.html`
- Modify: `frontend/style.css`

- [ ] **Step 1: Add dispatches teaser section to `frontend/index.html`**

Insert before the `<section class="section" id="guestbook">` line (which starts at approximately line 183). Add:

```html
    <hr class="divider" />

    <section class="section" id="dispatches">
      <h2 data-en="FIELD DISPATCHES" data-de="FELDDEPESCHEN">FIELD DISPATCHES</h2>
      <p data-en="Transmissions filed from the Landzunge and surrounding sectors."
         data-de="Übertragungen aus der Landzunge und umliegenden Sektoren.">
        Transmissions filed from the Landzunge and surrounding sectors.
      </p>
      <div id="dispatches-teaser-list"></div>
      <p class="dispatches-more">
        <a href="/dispatches.html" data-en="&gt; VIEW ALL DISPATCHES" data-de="&gt; ALLE DEPESCHEN ANZEIGEN">&gt; VIEW ALL DISPATCHES</a>
      </p>
    </section>

```

- [ ] **Step 2: Create `frontend/dispatches.html`**

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
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23050510'/><path d='M10 4 L22 4 Q25 16 16 29 Q7 16 10 4 Z' fill='%2300ffff'/></svg>" />
</head>
<body>
  <header class="hero">
    <p class="hero__label">BIONODE // SECTOR 7 // FIELD DISPATCHES</p>
    <h1 class="hero__title">Field Dispatches</h1>
    <p class="hero__subtitle">TRANSMISSIONS FROM FINN'S LANDZUNGE</p>
  </header>

  <main>
    <section class="section">
      <p><a href="/" style="color: var(--cyan); font-family: var(--font-mono, monospace);">&lt; RETURN TO BASE</a></p>
    </section>

    <hr class="divider" />

    <section class="section">
      <div id="dispatches-list"></div>
    </section>
  </main>

  <footer class="footer">
    <p data-en="&copy; FINN&#x2019;S LANDZUNGE HERITAGE PROTOCOL">&copy; FINN'S LANDZUNGE HERITAGE PROTOCOL</p>
  </footer>

  <script type="module">
    import { initDispatchesPage } from '/src/dispatches.js'
    initDispatchesPage()
  </script>
</body>
</html>
```

- [ ] **Step 3: Add dispatches styles to `frontend/style.css`**

Append to the end of `frontend/style.css`:

```css
/* ── Dispatches ────────────────────────────────────── */
.dispatch-teaser,
.dispatch {
  margin-bottom: 2rem;
}

.dispatch-teaser__date,
.dispatch__date {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-bottom: 0.25rem;
}

.dispatch-teaser__title,
.dispatch__title {
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  color: var(--cyan);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dispatch-teaser__excerpt,
.dispatch__excerpt {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.6;
}

.dispatches-more {
  margin-top: 1.5rem;
}

.dispatches-more a {
  color: var(--cyan);
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  text-decoration: none;
}

.dispatches-more a:hover {
  text-decoration: underline;
}

.dispatches-empty {
  color: var(--text-dim);
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
}
```

- [ ] **Step 4: Verify the frontend builds**

```bash
cd /Users/finn/Code/landzunge/frontend && npm run build
```

Expected: `frontend/dist/` contains both `index.html` and `dispatches.html`. No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/finn/Code/landzunge
git add frontend/index.html frontend/dispatches.html frontend/style.css
git commit -m "feat: add dispatches teaser section and dispatches.html page"
```

---

### Task 6: Scaffold admin/ directory

**Files:**
- Create: `admin/package.json`
- Create: `admin/vite.config.js`
- Create: `admin/index.html`
- Create: `admin/.env.example`

- [ ] **Step 1: Create `admin/package.json`**

```json
{
  "name": "landzunge-admin",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4",
    "@tiptap/react": "^2.11.5",
    "@tiptap/starter-kit": "^2.11.5",
    "@tiptap/pm": "^2.11.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.22",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.4.1",
    "vite": "^6.3.2"
  }
}
```

- [ ] **Step 2: Create `admin/vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
})
```

- [ ] **Step 3: Create `admin/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Landzunge Admin</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create `admin/.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.finnslandzunge.com
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/finn/Code/landzunge/admin && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/finn/Code/landzunge
git add admin/
git commit -m "feat: scaffold admin React+Vite package"
```

---

### Task 7: Admin lib — supabaseClient.js and api.js

**Files:**
- Create: `admin/src/lib/supabaseClient.js`
- Create: `admin/src/lib/api.js`

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/finn/Code/landzunge/admin/src/lib
```

- [ ] **Step 2: Create `admin/src/lib/supabaseClient.js`**

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

- [ ] **Step 3: Create `admin/src/lib/api.js`**

```javascript
import { supabase } from './supabaseClient'

const BASE = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

async function authFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `API error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getGuestbookAdmin: () => authFetch('/api/guestbook/admin/all'),
  approveImage: (id) => authFetch(`/api/guestbook/${id}/approve-image`, { method: 'PATCH' }),
  deleteEntry: (id) => authFetch(`/api/guestbook/${id}`, { method: 'DELETE' }),

  getDispatchesAdmin: () => authFetch('/api/dispatches/admin/all'),
  createDispatch: (data) => authFetch('/api/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  updateDispatch: (id, data) => authFetch(`/api/dispatches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDispatch: (id) => authFetch(`/api/dispatches/${id}`, { method: 'DELETE' }),
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/finn/Code/landzunge
git add admin/src/lib/
git commit -m "feat: add admin Supabase auth client and API fetch wrapper"
```

---

### Task 8: App routing — App.jsx, Login.jsx, ProtectedRoute.jsx, main.jsx, admin.css

**Files:**
- Create: `admin/src/main.jsx`
- Create: `admin/src/App.jsx`
- Create: `admin/src/admin.css`
- Create: `admin/src/pages/Login.jsx`
- Create: `admin/src/components/ProtectedRoute.jsx`

- [ ] **Step 1: Create directories**

```bash
mkdir -p /Users/finn/Code/landzunge/admin/src/pages
mkdir -p /Users/finn/Code/landzunge/admin/src/components
```

- [ ] **Step 2: Create `admin/src/admin.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #f5f5f5;
  color: #222;
  font-size: 15px;
}

a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }

button {
  cursor: pointer;
  padding: 0.4rem 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
}

button:hover { background: #f0f0f0; }
button.danger { color: #dc2626; border-color: #dc2626; }
button.danger:hover { background: #fef2f2; }
button.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
button.primary:hover { background: #1d4ed8; }

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

label { display: block; font-weight: 600; margin-bottom: 0.25rem; font-size: 13px; }

.form-field { margin-bottom: 1rem; }

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.card-meta { font-size: 12px; color: #666; margin-bottom: 0.25rem; }
.card-name { font-weight: 700; }
.card-message { margin: 0.5rem 0; }

.badge { font-size: 11px; padding: 0.15rem 0.4rem; border-radius: 3px; font-weight: 600; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-approved { background: #d1fae5; color: #065f46; }
.badge-draft { background: #e5e7eb; color: #374151; }
.badge-published { background: #dbeafe; color: #1e40af; }

.layout { display: flex; min-height: 100vh; }

.sidebar {
  width: 200px;
  background: #1e293b;
  color: #cbd5e1;
  padding: 1.5rem 1rem;
  flex-shrink: 0;
}

.sidebar h1 { font-size: 14px; color: #fff; margin-bottom: 1.5rem; letter-spacing: 0.05em; }
.sidebar nav a {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 0.25rem;
}
.sidebar nav a:hover, .sidebar nav a.active { background: #334155; color: #fff; text-decoration: none; }
.sidebar-footer { margin-top: auto; padding-top: 2rem; }
.sidebar-footer button { background: transparent; border: 1px solid #475569; color: #94a3b8; width: 100%; }
.sidebar-footer button:hover { background: #334155; color: #fff; }

.main-content { flex: 1; padding: 2rem; }
.main-content h2 { font-size: 1.25rem; margin-bottom: 1.5rem; }

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.login-box {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 2rem;
  width: 360px;
}

.login-box h1 { font-size: 1.1rem; margin-bottom: 1.5rem; }
.login-error { color: #dc2626; font-size: 13px; margin-top: 0.5rem; }

.editor-wrapper { border: 1px solid #ccc; border-radius: 4px; }
.editor-toolbar {
  padding: 0.4rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.editor-toolbar button { padding: 0.2rem 0.5rem; font-size: 13px; }
.editor-toolbar button.active { background: #dbeafe; border-color: #2563eb; }
.editor-content { padding: 0.75rem; min-height: 200px; }
.editor-content:focus-within { outline: 2px solid #2563eb; outline-offset: -1px; }
.ProseMirror { outline: none; min-height: 180px; }
.ProseMirror p { margin-bottom: 0.5rem; }
.ProseMirror h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
.ProseMirror blockquote { border-left: 3px solid #ccc; padding-left: 0.75rem; color: #555; }
.ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 0.5rem; }

.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
.actions-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
```

- [ ] **Step 3: Create `admin/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './admin.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 4: Create `admin/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import GuestbookPage from './pages/GuestbookPage'
import DispatchesPage from './pages/DispatchesPage'
import EditorPage from './pages/EditorPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/guestbook" element={
          <ProtectedRoute><Layout><GuestbookPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches" element={
          <ProtectedRoute><Layout><DispatchesPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches/new" element={
          <ProtectedRoute><Layout><EditorPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches/:id/edit" element={
          <ProtectedRoute><Layout><EditorPage /></Layout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/guestbook" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Create `admin/src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/guestbook')
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Landzunge Admin</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `admin/src/components/ProtectedRoute.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div style={{ padding: '2rem' }}>Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 7: Verify admin builds**

```bash
cd /Users/finn/Code/landzunge/admin && npm run build
```

Expected: `admin/dist/` created, no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/finn/Code/landzunge
git add admin/src/
git commit -m "feat: add admin app routing, login page, and protected route"
```

---

### Task 9: Layout component

**Files:**
- Create: `admin/src/components/Layout.jsx`

- [ ] **Step 1: Create `admin/src/components/Layout.jsx`**

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Layout({ children }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>LANDZUNGE</h1>
        <nav>
          <NavLink to="/guestbook" className={({ isActive }) => isActive ? 'active' : ''}>
            Guestbook
          </NavLink>
          <NavLink to="/dispatches" className={({ isActive }) => isActive ? 'active' : ''}>
            Dispatches
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify admin builds**

```bash
cd /Users/finn/Code/landzunge/admin && npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/finn/Code/landzunge
git add admin/src/components/Layout.jsx
git commit -m "feat: add admin Layout with sidebar nav"
```

---

### Task 10: GuestbookPage component

**Files:**
- Create: `admin/src/pages/GuestbookPage.jsx`

The guestbook admin page lists all entries including those with unapproved images, lets the admin approve images and delete entries.

- [ ] **Step 1: Create `admin/src/pages/GuestbookPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getGuestbookAdmin()
      .then(setEntries)
      .catch(() => setError('Failed to load entries.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(id) {
    try {
      await api.approveImage(id)
      setEntries(prev => prev.map(e => e.id === id ? { ...e, image_approved: true } : e))
    } catch {
      alert('Failed to approve image.')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete entry from "${name}"?`)) return
    try {
      await api.deleteEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      alert('Failed to delete entry.')
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <div className="actions-row">
        <h2>Guestbook ({entries.length})</h2>
      </div>
      {entries.length === 0 && <p>No entries yet.</p>}
      {entries.map(entry => (
        <div key={entry.id} className="card">
          <div className="card-meta">
            <span className="card-name">{entry.name}</span>
            {' · '}
            {formatDate(entry.created_at)}
          </div>
          <p className="card-message">{entry.message}</p>
          {entry.image_url && (
            <div style={{ marginTop: '0.5rem' }}>
              <img
                src={entry.image_url}
                alt="visitor upload"
                style={{ maxWidth: 200, maxHeight: 150, display: 'block', objectFit: 'cover', borderRadius: 4 }}
              />
              <div style={{ marginTop: '0.25rem' }}>
                {entry.image_approved
                  ? <span className="badge badge-approved">Image approved</span>
                  : <span className="badge badge-pending">Pending approval</span>
                }
              </div>
            </div>
          )}
          <div className="actions">
            {entry.image_url && !entry.image_approved && (
              <button onClick={() => handleApprove(entry.id)}>Approve image</button>
            )}
            <button className="danger" onClick={() => handleDelete(entry.id, entry.name)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify admin builds**

```bash
cd /Users/finn/Code/landzunge/admin && npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/finn/Code/landzunge
git add admin/src/pages/GuestbookPage.jsx
git commit -m "feat: add GuestbookPage admin component"
```

---

### Task 11: DispatchesPage and EditorPage with Tiptap

**Files:**
- Create: `admin/src/pages/DispatchesPage.jsx`
- Create: `admin/src/pages/EditorPage.jsx`

The EditorPage handles both creating new dispatches and editing existing ones (determined by the `:id` URL param). It uses Tiptap as the rich text editor.

- [ ] **Step 1: Create `admin/src/pages/DispatchesPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DispatchesPage() {
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.getDispatchesAdmin()
      .then(setDispatches)
      .catch(() => setError('Failed to load dispatches.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await api.deleteDispatch(id)
      setDispatches(prev => prev.filter(d => d.id !== id))
    } catch {
      alert('Failed to delete dispatch.')
    }
  }

  async function handleTogglePublished(dispatch) {
    try {
      const updated = await api.updateDispatch(dispatch.id, { published: !dispatch.published })
      setDispatches(prev => prev.map(d => d.id === dispatch.id ? { ...d, published: updated.published } : d))
    } catch {
      alert('Failed to update dispatch.')
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <div className="actions-row">
        <h2>Dispatches ({dispatches.length})</h2>
        <button className="primary" onClick={() => navigate('/dispatches/new')}>+ New dispatch</button>
      </div>
      {dispatches.length === 0 && <p>No dispatches yet.</p>}
      {dispatches.map(d => (
        <div key={d.id} className="card">
          <div className="card-meta">
            {formatDate(d.created_at)}
            {' · '}
            <span className={`badge ${d.published ? 'badge-published' : 'badge-draft'}`}>
              {d.published ? 'Published' : 'Draft'}
            </span>
          </div>
          <strong>{d.title}</strong>
          <div className="actions">
            <button onClick={() => navigate(`/dispatches/${d.id}/edit`)}>Edit</button>
            <button onClick={() => handleTogglePublished(d)}>
              {d.published ? 'Unpublish' : 'Publish'}
            </button>
            <button className="danger" onClick={() => handleDelete(d.id, d.title)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `admin/src/pages/EditorPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { api } from '../lib/api'

function Toolbar({ editor }) {
  if (!editor) return null
  return (
    <div className="editor-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
      >B</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
      ><em>I</em></button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
      >H2</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'active' : ''}
      >• List</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'active' : ''}
      >" Quote</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >— HR</button>
    </div>
  )
}

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEditing)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  })

  useEffect(() => {
    if (!isEditing || !editor) return
    api.getDispatchesAdmin().then(dispatches => {
      const d = dispatches.find(d => d.id === id)
      if (!d) { setError('Dispatch not found.'); setLoading(false); return }
      setTitle(d.title)
      setPublished(d.published)
      editor.commands.setContent(d.body ?? '')
      setLoading(false)
    }).catch(() => { setError('Failed to load dispatch.'); setLoading(false) })
  }, [id, editor, isEditing])

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return }
    setError('')
    setSaving(true)
    try {
      const body = editor.getHTML()
      if (isEditing) {
        await api.updateDispatch(id, { title: title.trim(), body, published })
      } else {
        await api.createDispatch({ title: title.trim(), body, published })
      }
      navigate('/dispatches')
    } catch (e) {
      setError(e.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div className="actions-row">
        <h2>{isEditing ? 'Edit Dispatch' : 'New Dispatch'}</h2>
        <button onClick={() => navigate('/dispatches')}>← Back</button>
      </div>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      <div className="form-field">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Dispatch title"
          maxLength={200}
        />
      </div>
      <div className="form-field">
        <label>Body</label>
        <div className="editor-wrapper">
          <Toolbar editor={editor} />
          <EditorContent editor={editor} className="editor-content" />
        </div>
      </div>
      <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={e => setPublished(e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="published" style={{ marginBottom: 0 }}>Published</label>
      </div>
      <button className="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create dispatch'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify admin builds**

```bash
cd /Users/finn/Code/landzunge/admin && npm run build
```

Expected: `admin/dist/` created with no errors. Tiptap and all dependencies resolve correctly.

- [ ] **Step 4: Commit**

```bash
cd /Users/finn/Code/landzunge
git add admin/src/pages/
git commit -m "feat: add DispatchesPage and EditorPage with Tiptap rich text editor"
```

---

### Task 12: Verify both builds and final cleanup

**Files:** No new files — verification only.

- [ ] **Step 1: Verify frontend builds clean**

```bash
cd /Users/finn/Code/landzunge/frontend && npm run build
```

Expected: `frontend/dist/` contains `index.html` and `dispatches.html`. No errors.

- [ ] **Step 2: Verify admin builds clean**

```bash
cd /Users/finn/Code/landzunge/admin && npm run build
```

Expected: `admin/dist/` contains `index.html` and assets. No errors.

- [ ] **Step 3: Verify backend still passes all tests**

```bash
cd /Users/finn/Code/landzunge/backend && npm test
```

Expected: All tests PASS.

- [ ] **Step 4: Verify backend TypeScript build**

```bash
cd /Users/finn/Code/landzunge/backend && npm run build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 5: Check git log**

```bash
cd /Users/finn/Code/landzunge && git log --oneline -20
```

Report what you see — no action needed.

- [ ] **Step 6: Final commit if any fixes were needed**

If any fixes were made in steps 1-4:
```bash
cd /Users/finn/Code/landzunge
git add -A
git commit -m "fix: resolve build issues from final verification"
```

If nothing needed fixing, skip this step.
