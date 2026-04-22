import { supabase } from './supabaseClient'

const BASE = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

async function authFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
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
  getGuestbookAdmin: () => authFetch('/api/guestbook/admin/all'),
  approveImage: (id) => authFetch(`/api/guestbook/${id}/approve-image`, { method: 'PATCH' }),
  deleteEntry: (id) => authFetch(`/api/guestbook/${id}`, { method: 'DELETE' }),

  getDispatchesAdmin: () => authFetch('/api/dispatches/admin/all'),
  createDispatch: (data) => authFetch('/api/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  updateDispatch: (id, data) => authFetch(`/api/dispatches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDispatch: (id) => authFetch(`/api/dispatches/${id}`, { method: 'DELETE' }),
}
