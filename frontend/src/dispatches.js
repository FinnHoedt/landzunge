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
    .replace(/'/g, '&#39;')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
