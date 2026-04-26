const BASE = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'
const TOKEN_KEY = 'admin_token'
const TOKEN_EXPIRY_KEY = 'admin_token_expires_at'

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? 0)
  if (!token || Date.now() / 1000 > expiresAt) return null
  return token
}

export function setToken(access_token, expires_at) {
  localStorage.setItem(TOKEN_KEY, access_token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expires_at))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

async function authFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `API error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? 'Login failed')
    }
    const data = await res.json()
    setToken(data.access_token, data.expires_at)
    return data
  },

  logout: () => {
    clearToken()
  },

  getGuestbookAdmin: () => authFetch('/api/guestbook/admin/all'),
  approveImage: (id) => authFetch(`/api/guestbook/${id}/approve-image`, { method: 'PATCH' }),
  deleteEntry: (id) => authFetch(`/api/guestbook/${id}`, { method: 'DELETE' }),

  getDispatchesAdmin: () => authFetch('/api/dispatches/admin/all'),
  createDispatch: (data) => authFetch('/api/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  updateDispatch: (id, data) => authFetch(`/api/dispatches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDispatch: (id) => authFetch(`/api/dispatches/${id}`, { method: 'DELETE' }),
}
