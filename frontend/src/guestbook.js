const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'
const RATE_LIMIT_KEY = 'gb_last_submit'
const RATE_LIMIT_MS  = 5 * 60 * 1000   // 5 minutes

const ENTRY_MAX_WIDTH = 220  // px — must match `.canvas-entry { max-width }` in style.css
const ENTRY_CLEARANCE = 16   // px — ~1rem right-edge breathing room

// Mirrors the backend FileInterceptor contract (POST /api/guestbook)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024   // 5 MB

// Deterministic hash of the entry UUID → number for stable positioning
function hashId(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function entryPosition(id) {
  const hashX = hashId(id)
  const hashY = hashId(id + 'y')
  const hashS = hashId(id + 's')
  const rawLeft = (hashX % 55) + 5    // 5% – 60% base spread
  // Clamp so a max-width entry never spills past the right edge on narrow viewports
  const maxLeft = Math.max(5, Math.floor(((window.innerWidth - ENTRY_MAX_WIDTH - ENTRY_CLEARANCE) / window.innerWidth) * 100))
  const left = Math.min(rawLeft, maxLeft)
  const top  = (hashY % 70) + 5       // 5% – 75%, fully decorrelated from left
  const sizes = ['0.65rem', '0.8rem', '1rem', '1.1rem']
  const fontSize = sizes[hashS % 4]
  return { left, top, fontSize }
}

let lastEntries = []

function renderEntries(entries) {
  lastEntries = entries
  const container = document.getElementById('canvas-entries')
  if (!container) return

  if (entries.length === 0) {
    // Leave canvas empty — ghost words carry the empty state
    container.innerHTML = ''
    return
  }

  // Determine newest client-side so the highlight doesn't depend on API sort order
  const newestId = entries.reduce(
    (acc, e) => (!acc || new Date(e.created_at) > new Date(acc.created_at) ? e : acc),
    null
  )?.id

  container.innerHTML = entries.map(e => {
    const { left, top, fontSize } = entryPosition(e.id)
    const isNewest = e.id === newestId
    const imgHtml = e.image_url
      ? `<img class="canvas-entry-image" src="${esc(e.image_url)}" alt="" loading="lazy" />`
      : ''
    return `
      <div class="canvas-entry${isNewest ? ' canvas-entry--newest' : ''}"
           style="left: ${left}%; top: ${top}%; font-size: ${fontSize};"
           role="listitem">
        <span class="canvas-handle">${esc(e.name)}</span>
        <span class="canvas-message">${esc(e.message)}</span>
        ${imgHtml}
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
  const imageBtn   = document.getElementById('gb_image_btn')
  const imageInput = document.getElementById('gb_image')
  const imageName  = document.getElementById('gb_image_name')

  if (!strip || !expanded || !form) return

  function resetImageLabel() {
    if (imageName) {
      imageName.textContent = 'NO FILE SELECTED'
      imageName.classList.remove('has-file')
    }
  }

  function openForm() {
    strip.hidden = true
    expanded.hidden = false
    form.querySelector('#gb_name')?.focus()
  }

  function closeForm() {
    expanded.hidden = true
    strip.hidden = false
    form.reset()
    resetImageLabel()
  }

  strip.addEventListener('click', openForm)
  strip.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openForm() }
  })
  cancel?.addEventListener('click', closeForm)

  imageBtn?.addEventListener('click', () => imageInput?.click())
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0]
    if (!file) { resetImageLabel(); return }
    const err = validateImage(file)
    if (err) {
      alert(err)
      imageInput.value = ''
      resetImageLabel()
      return
    }
    if (imageName) {
      imageName.textContent = file.name
      imageName.classList.add('has-file')
    }
  })

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

    const imageFile = imageInput?.files[0] ?? null
    if (imageFile) {
      const err = validateImage(imageFile)
      if (err) { alert(err); return }
    }

    const submitBtn = form.querySelector('.canvas-submit')
    if (submitBtn) submitBtn.disabled = true

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
        alert(body.message ?? 'INVALID SUBMISSION.')
        if (submitBtn) submitBtn.disabled = false
        return
      }
      if (!res.ok) throw new Error()
    } catch {
      alert('UPLINK FAILED. TRY AGAIN.')
      if (submitBtn) submitBtn.disabled = false
      return
    }

    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
    if (submitBtn) submitBtn.disabled = false
    closeForm()
    await loadEntries()
  })
}

function validateImage(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'ONLY JPG, PNG, OR WEBP VISUALS ACCEPTED.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'VISUAL EXCEEDS 5MB LIMIT.'
  }
  return null
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function setupReflow() {
  // entryPosition() clamps against window.innerWidth, so positions must be
  // recomputed when the viewport changes (resize / phone rotation).
  let raf = 0
  const reflow = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => renderEntries(lastEntries))
  }
  window.addEventListener('resize', reflow)
  window.addEventListener('orientationchange', reflow)
}

export async function initGuestbook() {
  await loadEntries()
  setupForm()
  setupReflow()
}
