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
  strip.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openForm() }
  })
  cancel?.addEventListener('click', closeForm)

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
