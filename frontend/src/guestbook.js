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

async function uploadImage(file) {
  const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  const ext = mimeToExt[file.type] ?? 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('guestbook-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Image upload failed: ' + error.message)
  return path
}

export async function initGuestbook() {
  await loadEntries()
  setupForm()
  setupImagePicker()
}

async function loadEntries() {
  const { data } = await supabase
    .from('guestbook_entries')
    .select('name, message, created_at, image_path, image_approved')
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
    if (error) {
      if (image_path) {
        await supabase.storage.from('guestbook-images').remove([image_path])
      }
      alert('Failed to submit. Try again.')
      return
    }
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
