const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

export async function initTracker() {
  try {
    const res = await fetch(`${API_URL}/api/tracker`, { method: 'POST' })

    let count
    if (res.ok) {
      ;({ count } = await res.json())
    } else {
      // POST failed (rate-limited, server error, etc.): fetch current count without incrementing
      const fallback = await fetch(`${API_URL}/api/tracker`)
      if (fallback.ok) {
        ;({ count } = await fallback.json())
      }
    }

    if (count != null) {
      document.getElementById('hit-counter').textContent = String(count).padStart(7, '0')
    }
  } catch {
    // silently ignore tracker errors
  }
}
