import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DispatchesPage() {
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.getDispatchesAdmin()
      .then(setDispatches)
      .catch(() => setError('Failed to load dispatches.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await api.deleteDispatch(id)
      setDispatches(prev => prev.filter(d => d.id !== id))
    } catch {
      alert('Failed to delete dispatch.')
    }
  }

  async function handleTogglePublished(dispatch) {
    try {
      const updated = await api.updateDispatch(dispatch.id, { published: !dispatch.published })
      setDispatches(prev => prev.map(d => d.id === dispatch.id ? { ...d, published: updated.published } : d))
    } catch {
      alert('Failed to update dispatch.')
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <div className="actions-row">
        <h2>Dispatches ({dispatches.length})</h2>
        <button className="primary" onClick={() => navigate('/dispatches/new')}>+ New dispatch</button>
      </div>
      {dispatches.length === 0 && <p>No dispatches yet.</p>}
      {dispatches.map(d => (
        <div key={d.id} className="card">
          <div className="card-meta">
            {formatDate(d.created_at)}
            {' · '}
            <span className={`badge ${d.published ? 'badge-published' : 'badge-draft'}`}>
              {d.published ? 'Published' : 'Draft'}
            </span>
          </div>
          <strong>{d.title}</strong>
          <div className="actions">
            <button onClick={() => navigate(`/dispatches/${d.id}/edit`)}>Edit</button>
            <button onClick={() => handleTogglePublished(d)}>
              {d.published ? 'Unpublish' : 'Publish'}
            </button>
            <button className="danger" onClick={() => handleDelete(d.id, d.title)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
