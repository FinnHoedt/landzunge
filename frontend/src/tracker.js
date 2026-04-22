const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

export async function initTracker() {
  try {
    const res = await fetch(`${API_URL}/api/tracker`, { method: 'POST' })
    if (!res.ok) throw new Error()
    const { count } = await res.json()
    if (count != null) {
      document.getElementById('hit-counter').textContent = String(count).padStart(7, '0')
    }
  } catch {
    // silently ignore tracker errors
  }
}
