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
