const BASE = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'
const TOKEN_KEY = 'admin_token'
const TOKEN_EXPIRY_KEY = 'admin_token_expires_at'
const ROLE_KEY = 'admin_role'
const EMAIL_KEY = 'admin_email'

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

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function setRole(role) {
  localStorage.setItem(ROLE_KEY, role)
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY)
}

export function getEmail() {
  return localStorage.getItem(EMAIL_KEY)
}

export function setEmail(email) {
  localStorage.setItem(EMAIL_KEY, email)
}

export function clearEmail() {
  localStorage.removeItem(EMAIL_KEY)
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
    setRole(data.user.role)
    setEmail(data.user.email)
    return data
  },

  logout: () => {
    clearToken()
    clearRole()
    clearEmail()
  },

  getGuestbookAdmin: () => authFetch('/api/guestbook/admin/all'),
  approveImage: (id) => authFetch(`/api/guestbook/${id}/approve-image`, { method: 'PATCH' }),
  deleteEntry: (id) => authFetch(`/api/guestbook/${id}`, { method: 'DELETE' }),

  getDispatchesAdmin: () => authFetch('/api/dispatches/admin/all'),
  createDispatch: (data) => authFetch('/api/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  updateDispatch: (id, data) => authFetch(`/api/dispatches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDispatch: (id) => authFetch(`/api/dispatches/${id}`, { method: 'DELETE' }),

  getUsers: () => authFetch('/api/users'),
  addUser: (email, role) => authFetch('/api/users', { method: 'POST', body: JSON.stringify({ email, role }) }),
  updateUserRole: (id, role) => authFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeUser: (id) => authFetch(`/api/users/${id}`, { method: 'DELETE' }),
}
