# Guestbook Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional image attachments to guestbook entries, hidden until manually approved via Supabase dashboard.

**Architecture:** Browser uploads image directly to a public Supabase Storage bucket (`guestbook-images`) before inserting the row. `image_path` (nullable text) and `image_approved` (boolean, default false) are added to `guestbook_entries`. Cards render the image only when both fields are set. Admin approves by flipping `image_approved = true` in the Supabase table editor.

**Tech Stack:** Supabase JS SDK (storage), vanilla JS, Vite. No test framework — manual browser verification steps provided.

---

## File Map

| File | Change |
|---|---|
| Supabase SQL editor | Add columns, create storage policies |
| Supabase dashboard | Create `guestbook-images` bucket |
| `index.html` | Add file input to guestbook form |
| `src/guestbook.js` | Add validation, upload, wire submit, update render |
| `style.css` | Add `.guestbook-card__image` styles |

---

### Task 1: Schema migration

**Files:**
- No code files — SQL run in Supabase SQL editor

- [ ] **Step 1: Open Supabase SQL editor**

Navigate to your Supabase project → SQL Editor → New query.

- [ ] **Step 2: Run migration**

```sql
ALTER TABLE guestbook_entries
  ADD COLUMN image_path text DEFAULT NULL,
  ADD COLUMN image_approved boolean NOT NULL DEFAULT false;
```

- [ ] **Step 3: Verify columns exist**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'guestbook_entries'
  AND column_name IN ('image_path', 'image_approved');
```

Expected: two rows — `image_path` (text, null), `image_approved` (boolean, false).

---

### Task 2: Supabase Storage bucket + RLS policies

**Files:**
- No code files — configured in Supabase dashboard + SQL editor

- [ ] **Step 1: Create bucket**

Supabase dashboard → Storage → New bucket:
- Name: `guestbook-images`
- Public bucket: **ON**
- Click Create

- [ ] **Step 2: Set storage RLS policies**

In SQL Editor:

```sql
CREATE POLICY "anon can upload guestbook images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'guestbook-images');

CREATE POLICY "public can read guestbook images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'guestbook-images');
```

- [ ] **Step 3: Verify**

Supabase dashboard → Storage → guestbook-images → Policies tab. Both policies should be listed.

---

### Task 3: Add image input to form

**Files:**
- Modify: `index.html` (~line 171, after the `gb_message` field block)

- [ ] **Step 1: Add file input**

In `index.html`, after the closing `</div>` of the `gb_message` field and before the submit `<button>`:

```html
        <div class="guestbook-form__field">
          <label for="gb_image" data-en="VISUAL LOG (OPTIONAL)" data-de="VISUELLES LOG (OPTIONAL)">VISUAL LOG (OPTIONAL)</label>
          <input id="gb_image" name="gb_image" type="file" accept="image/*" capture="environment" />
        </div>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`, scroll to guestbook form. A file input labeled "VISUAL LOG (OPTIONAL)" should appear below the textarea. On mobile it triggers camera/gallery; on desktop it opens a file picker.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add image file input to guestbook form"
```

---

### Task 4: Add image validation helper

**Files:**
- Modify: `src/guestbook.js` — add constants and `validateImage` after the existing rate-limit constants

- [ ] **Step 1: Add constants and validateImage**

After the `RATE_LIMIT_MS` line in `src/guestbook.js`, add:

```js
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, or WEBP images allowed.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Image must be under 5MB.'
  }
  return null
}
```

- [ ] **Step 2: Manual test in browser console**

With dev server running, open devtools console and run:

```js
const fakeGif = new File([''], 'test.gif', { type: 'image/gif' })
console.assert(validateImage(fakeGif) === 'Only JPG, PNG, or WEBP images allowed.', 'gif rejected')

const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
console.assert(validateImage(bigFile) !== null, 'big file rejected')

const good = new File([''], 'photo.jpg', { type: 'image/jpeg' })
console.assert(validateImage(good) === null, 'valid file passes')
```

All three should pass silently (no assertion errors).

- [ ] **Step 3: Commit**

```bash
git add src/guestbook.js
git commit -m "feat: add client-side image type and size validation"
```

---

### Task 5: Add image upload helper

**Files:**
- Modify: `src/guestbook.js` — add `uploadImage` after `validateImage`

- [ ] **Step 1: Add uploadImage function**

```js
async function uploadImage(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('guestbook-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Image upload failed: ' + error.message)
  return path
}
```

- [ ] **Step 2: Manual test**

In browser devtools, select a small JPG via the form's file input, then run in console:

```js
const input = document.getElementById('gb_image')
const file = input.files[0]
uploadImage(file).then(path => console.log('uploaded:', path)).catch(console.error)
```

Expected: logs a path like `1713456789012-abc123.jpg`. Verify the file appears in Supabase dashboard → Storage → guestbook-images.

- [ ] **Step 3: Commit**

```bash
git add src/guestbook.js
git commit -m "feat: add uploadImage helper for Supabase Storage"
```

---

### Task 6: Wire upload into form submit

**Files:**
- Modify: `src/guestbook.js` — replace `setupForm` function entirely

- [ ] **Step 1: Replace setupForm**

Replace the entire `setupForm` function with:

```js
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
    if (profanity.check(name) || profanity.check(message)) {
      alert('Please keep entries respectful. This is a protected natural monument.')
      return
    }

    const imageFile = ev.target.gb_image.files[0] ?? null
    if (imageFile) {
      const err = validateImage(imageFile)
      if (err) { alert(err); return }
    }

    const btn = ev.target.querySelector('button[type="submit"]')
    btn.disabled = true

    let image_path = null
    if (imageFile) {
      try {
        image_path = await uploadImage(imageFile)
      } catch {
        alert('Image upload failed. Try again or submit without image.')
        btn.disabled = false
        return
      }
    }

    const { error } = await supabase.from('guestbook_entries').insert({ name, message, image_path })
    btn.disabled = false
    if (error) { alert('Failed to submit. Try again.'); return }
    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
    ev.target.reset()
    await loadEntries()
  })
}
```

- [ ] **Step 2: Test text-only submit**

Submit name + message with no image. Entry appears in guestbook immediately. No console errors.

- [ ] **Step 3: Test submit with valid image**

Attach a JPG under 5MB, submit. Entry text appears immediately, image does NOT render (pending approval). In Supabase: Storage bucket has the file; table row has `image_path` set and `image_approved = false`.

- [ ] **Step 4: Test invalid image is rejected**

Attach a `.gif` or a file over 5MB. Click submit. Should alert the error message and NOT submit the entry.

- [ ] **Step 5: Commit**

```bash
git add src/guestbook.js
git commit -m "feat: wire image upload into guestbook form submit"
```

---

### Task 7: Render approved images in cards

**Files:**
- Modify: `src/guestbook.js` — update `loadEntries` and `renderEntries`

- [ ] **Step 1: Update loadEntries to fetch image fields**

Replace `loadEntries`:

```js
async function loadEntries() {
  const { data } = await supabase
    .from('guestbook_entries')
    .select('name, message, created_at, image_path, image_approved')
    .order('created_at', { ascending: false })
    .limit(20)
  renderEntries(data ?? [])
}
```

- [ ] **Step 2: Update renderEntries to conditionally show images**

Replace `renderEntries`:

```js
function renderEntries(entries) {
  const container = document.getElementById('guestbook-entries')
  if (entries.length === 0) {
    container.innerHTML = '<p style="color:#7a7a90; font-family: VT323, monospace; font-size: 1.1rem;">// NO TRANSMISSIONS LOGGED. UPLINK NOW.</p>'
    return
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  container.innerHTML = entries.map(e => {
    const imageHtml = (e.image_path && e.image_approved)
      ? `<img class="guestbook-card__image" src="${supabaseUrl}/storage/v1/object/public/guestbook-images/${esc(e.image_path)}" alt="visitor image" loading="lazy" />`
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
```

- [ ] **Step 3: Test approval flow**

In Supabase table editor, set `image_approved = true` on a row with an `image_path`. Reload `http://localhost:5173`. The image should now render below the message text in that card.

- [ ] **Step 4: Commit**

```bash
git add src/guestbook.js
git commit -m "feat: render approved images in guestbook cards"
```

---

### Task 8: Style guestbook card images

**Files:**
- Modify: `style.css` — add `.guestbook-card__image` after the existing `.guestbook-card p` block (~line 343)

- [ ] **Step 1: Add image styles**

After the `.guestbook-card p { ... }` block, add:

```css
.guestbook-card__image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  margin-top: 0.75rem;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 2px;
}
```

- [ ] **Step 2: Verify styling**

With an approved image entry visible, check that the image: renders below message text, stays within card width, is capped at 300px tall, has a subtle cyan border matching the existing `.guestbook-card` border style.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: style guestbook card images"
```
