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

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <div className="actions-row">
        <h2>Guestbook ({entries.length})</h2>
      </div>
      {entries.length === 0 && <p>No entries yet.</p>}
      {entries.map(entry => (
        <div key={entry.id} className="card">
          <div className="card-meta">
            <span className="card-name">{entry.name}</span>
            {' · '}
            {formatDate(entry.created_at)}
          </div>
          <p className="card-message">{entry.message}</p>
          {entry.image_url && (
            <div style={{ marginTop: '0.5rem' }}>
              <img
                src={entry.image_url}
                alt="visitor upload"
                style={{ maxWidth: 200, maxHeight: 150, display: 'block', objectFit: 'cover', borderRadius: 4 }}
              />
              <div style={{ marginTop: '0.25rem' }}>
                {entry.image_approved
                  ? <span className="badge badge-approved">Image approved</span>
                  : <span className="badge badge-pending">Pending approval</span>
                }
              </div>
            </div>
          )}
          <div className="actions">
            {entry.image_url && !entry.image_approved && (
              <button onClick={() => handleApprove(entry.id)}>Approve image</button>
            )}
            <button className="danger" onClick={() => handleDelete(entry.id, entry.name)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
