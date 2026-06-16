import { useState, useEffect } from 'react'
import { api, getEmail } from '../lib/api'
import { ROLE_NAMES as ROLES } from '../lib/roles'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState('admin')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [createdCreds, setCreatedCreds] = useState(null)
  const currentEmail = getEmail()

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(id, role) {
    try {
      await api.updateUserRole(id, role)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleRemove(id) {
    try {
      await api.removeUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      const { password, ...user } = await api.addUser(addEmail, addRole)
      setUsers(prev => [...prev, user])
      setAddEmail('')
      setAddRole('admin')
      setCreatedCreds(password ? { email: user.email, password } : null)
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddLoading(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Users</h2>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {createdCreds && (
        <div className="mb-6 border border-green-300 bg-green-50 rounded p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-green-800 mb-1">Account created for {createdCreds.email}</p>
              <p className="text-slate-600 mb-2">
                Save this password now — it won't be shown again. Share it with the new user over a secure channel.
              </p>
              <code className="block bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-800 break-all">
                {createdCreds.password}
              </code>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => navigator.clipboard?.writeText(createdCreds.password)}
                className="text-xs border border-slate-300 rounded px-2 py-1 hover:bg-slate-100 cursor-pointer"
              >
                Copy
              </button>
              <button
                onClick={() => setCreatedCreds(null)}
                className="text-xs text-slate-500 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="text-left border-b border-slate-200">
            <th className="pb-2 font-semibold">Email</th>
            <th className="pb-2 font-semibold">Role</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b border-slate-100">
              <td className="py-3 pr-4 text-slate-700">{user.email}</td>
              <td className="py-3 pr-4">
                <select
                  value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value)}
                  disabled={user.email === currentEmail}
                  className="border border-slate-300 rounded px-2 py-1 text-sm disabled:opacity-50"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td className="py-3 text-right">
                <button
                  onClick={() => handleRemove(user.id)}
                  disabled={user.email === currentEmail}
                  className="text-red-500 text-xs hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold mb-3">Add user</h3>
        <form onSubmit={handleAdd} className="flex gap-3 items-start flex-wrap">
          <input
            type="email"
            value={addEmail}
            onChange={e => setAddEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-64"
          />
          <select
            value={addRole}
            onChange={e => setAddRole(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="submit"
            disabled={addLoading}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {addLoading ? 'Adding...' : 'Add'}
          </button>
        </form>
        {addError && <p className="text-red-600 text-xs mt-2">{addError}</p>}
      </div>
    </div>
  )
}
