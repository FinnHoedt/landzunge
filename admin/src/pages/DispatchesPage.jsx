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

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dispatches ({dispatches.length})</h2>
        <button
          onClick={() => navigate('/dispatches/new')}
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 cursor-pointer"
        >
          + New dispatch
        </button>
      </div>
      {dispatches.length === 0 && <p className="text-gray-500">No dispatches yet.</p>}
      {dispatches.map(d => (
        <div key={d.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
            {formatDate(d.created_at)}
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${d.published ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
              {d.published ? 'Published' : 'Draft'}
            </span>
          </div>
          <strong className="text-sm">{d.title}</strong>
          <div className="flex gap-2 flex-wrap mt-2">
            <button
              onClick={() => navigate(`/dispatches/${d.id}/edit`)}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={() => handleTogglePublished(d)}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
            >
              {d.published ? 'Unpublish' : 'Publish'}
            </button>
            <button
              onClick={() => handleDelete(d.id, d.title)}
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
