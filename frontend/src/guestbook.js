import { computeCanvasLayout, entryFontSize } from './canvas-layout.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'
let _entries = []
let _layoutRaf = 0
const RATE_LIMIT_KEY = 'gb_last_submit'
const RATE_LIMIT_MS  = 5 * 60 * 1000   // 5 minutes

// Mirrors the backend FileInterceptor contract (POST /api/guestbook)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024   // 5 MB

// Placeholder height reserved while an entry's thumbnail is still downloading;
// replaced with the real measured height once the image fires load/error.
const PENDING_IMAGE_HEIGHT_PX = 80

function layoutEntries() {
  const container = document.getElementById('canvas-entries')
  if (!container) return

  const nodes = Array.from(container.querySelectorAll('.canvas-entry'))
  if (nodes.length === 0) {
    container.style.setProperty('--canvas-height', '0px')
    return
  }

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  if (containerWidth === 0 || containerHeight === 0) return

  // Anchor at (0, 0) before measuring so entries near the right edge are never
  // shrink-to-fit narrower than their true natural width (up to max-width).
  for (const el of nodes) {
    el.style.left = '0px'
    el.style.top = '0px'
  }

  const items = nodes.map(el => {
    const rect = el.getBoundingClientRect()
    const img = el.querySelector('.canvas-entry-image')
    const pendingImgExtra = img && !img.complete ? PENDING_IMAGE_HEIGHT_PX : 0
    return {
      id: el.dataset.entryId,
      createdAt: Number(el.dataset.createdAt) || 0,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height) + pendingImgExtra,
    }
  })

  const { positions, canvasHeight, overflowed } = computeCanvasLayout(items, {
    containerWidth,
    containerHeight,
  })

  for (const el of nodes) {
    const pos = positions.get(el.dataset.entryId)
    if (pos) {
      el.style.left = `${pos.x}px`
      el.style.top = `${pos.y}px`
    }
  }

  container.style.setProperty('--canvas-height', overflowed ? `${canvasHeight}px` : '0px')
}

function scheduleLayout() {
  if (_layoutRaf) return
  _layoutRaf = requestAnimationFrame(() => {
    _layoutRaf = 0
    layoutEntries()
  })
}

function renderEntries(entries) {
  const container = document.getElementById('canvas-entries')
  if (!container) return

  if (entries.length === 0) {
    // Leave canvas empty — ghost words carry the empty state
    container.innerHTML = ''
    container.style.setProperty('--canvas-height', '0px')
    return
  }

  // Determine newest client-side so the highlight doesn't depend on API sort order
  const newestId = entries.reduce(
    (acc, e) => (!acc || new Date(e.created_at) > new Date(acc.created_at) ? e : acc),
    null
  )?.id

  container.innerHTML = entries.map(e => {
    const fontSize = entryFontSize(e.id)
    const isNewest = e.id === newestId
    const createdAt = Date.parse(e.created_at) || 0
    const imgHtml = e.image_url
      ? `<img class="canvas-entry-image" src="${esc(e.image_url)}" alt="" decoding="async" />`
      : ''
    return `
      <div class="canvas-entry${isNewest ? ' canvas-entry--newest' : ''}"
           data-entry-id="${esc(e.id)}"
           data-created-at="${createdAt}"
           style="font-size: ${fontSize};"
           role="listitem">
        <span class="canvas-handle">${esc(e.name)}</span>
        <span class="canvas-message">${esc(e.message)}</span>
        ${imgHtml}
      </div>
    `
  }).join('')

  for (const img of container.querySelectorAll('.canvas-entry-image')) {
    if (!img.complete) {
      img.addEventListener('load', scheduleLayout, { once: true })
      img.addEventListener('error', scheduleLayout, { once: true })
    }
  }

  if (_layoutRaf) {
    cancelAnimationFrame(_layoutRaf)
    _layoutRaf = 0
  }
  layoutEntries()
}

async function loadEntries() {
  try {
    const res = await fetch(`${API_URL}/api/guestbook`)
    if (!res.ok) throw new Error()
    _entries = await res.json()
    renderEntries(_entries)
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

export async function initGuestbook() {
  await loadEntries()
  setupForm()

  const container = document.getElementById('canvas-entries')
  if (container && typeof ResizeObserver !== 'undefined') {
    let lastW = container.clientWidth
    let lastH = container.clientHeight
    const observer = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w !== lastW || h !== lastH) {
        lastW = w
        lastH = h
        scheduleLayout()
      }
    })
    observer.observe(container)
  } else {
    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(scheduleLayout, 150)
    })
  }

  document.fonts?.ready?.then(() => {
    if (_entries.length > 0) scheduleLayout()
  })
}
