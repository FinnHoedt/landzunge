import { supabase } from './supabase.js'
import profanity from 'leo-profanity'

const RATE_LIMIT_KEY = 'gb_last_submit'
const RATE_LIMIT_MS = 60 * 60 * 1000 // 1 hour

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

export async function initGuestbook() {
  await loadEntries()
  setupForm()
}

async function loadEntries() {
  const { data } = await supabase
    .from('guestbook_entries')
    .select('name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
  renderEntries(data ?? [])
}

function renderEntries(entries) {
  const container = document.getElementById('guestbook-entries')
  if (entries.length === 0) {
    container.innerHTML = '<p style="color:#7a7a90; font-family: VT323, monospace; font-size: 1.1rem;">// NO TRANSMISSIONS LOGGED. UPLINK NOW.</p>'
    return
  }
  container.innerHTML = entries.map(e => `
    <div class="guestbook-card">
      <div class="card-header">${esc(e.name)} &middot; ${formatDate(e.created_at)}</div>
      <p>${esc(e.message)}</p>
    </div>
  `).join('')
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
    if (profanity.check(name) || profanity.check(message)) {
      alert('Please keep entries respectful. This is a protected natural monument.')
      return
    }
    const btn = ev.target.querySelector('button[type="submit"]')
    btn.disabled = true
    const { error } = await supabase.from('guestbook_entries').insert({ name, message })
    btn.disabled = false
    if (error) { alert('Failed to submit. Try again.'); return }
    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
    ev.target.reset()
    await loadEntries()
  })
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
