import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getGuestbookAdmin()
      .then(setEntries)
      .catch(() => setError('Failed to load entries.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(id) {
    try {
      await api.approveImage(id)
      setEntries(prev => prev.map(e => e.id === id ? { ...e, image_approved: true } : e))
    } catch {
      alert('Failed to approve image.')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete entry from "${name}"?`)) return
    try {
      await api.deleteEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      alert('Failed to delete entry.')
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Guestbook ({entries.length})</h2>
      </div>
      {entries.length === 0 && <p className="text-gray-500">No entries yet.</p>}
      {entries.map(entry => (
        <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <div className="text-xs text-gray-500 mb-1">
            <span className="font-bold text-gray-800">{entry.name}</span>
            {' · '}
            {formatDate(entry.created_at)}
          </div>
          <p className="my-2 text-sm">{entry.message}</p>
          {entry.image_url && (
            <div className="mt-2">
              <img
                src={entry.image_url}
                alt="visitor upload"
                className="max-w-[200px] max-h-[150px] object-cover rounded"
              />
              <div className="mt-1">
                {entry.image_approved
                  ? <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">Image approved</span>
                  : <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">Pending approval</span>
                }
              </div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap mt-2">
            {entry.image_url && !entry.image_approved && (
              <button
                onClick={() => handleApprove(entry.id)}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
              >
                Approve image
              </button>
            )}
            <button
              onClick={() => handleDelete(entry.id, entry.name)}
              className="text-sm px-3 py-1.5 border border-red-400 text-red-600 rounded bg-white hover:bg-red-50 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
