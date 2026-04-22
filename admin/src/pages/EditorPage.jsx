import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { api } from '../lib/api'

function Toolbar({ editor }) {
  if (!editor) return null
  const btn = (label, action, active) => (
    <button
      type="button"
      onClick={action}
      className={`text-xs px-2 py-1 border rounded cursor-pointer ${active ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex gap-1 flex-wrap p-2 border-b border-gray-200">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('" Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      {btn('— HR', () => editor.chain().focus().setHorizontalRule().run(), false)}
    </div>
  )
}

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEditing)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  })

  useEffect(() => {
    if (!isEditing || !editor) return
    api.getDispatchesAdmin().then(dispatches => {
      const d = dispatches.find(d => d.id === id)
      if (!d) { setError('Dispatch not found.'); setLoading(false); return }
      setTitle(d.title)
      setPublished(d.published)
      editor.commands.setContent(d.body ?? '')
      setLoading(false)
    }).catch(() => { setError('Failed to load dispatch.'); setLoading(false) })
  }, [id, editor, isEditing])

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return }
    setError('')
    setSaving(true)
    try {
      const body = editor.getHTML()
      if (isEditing) {
        await api.updateDispatch(id, { title: title.trim(), body, published })
      } else {
        await api.createDispatch({ title: title.trim(), body, published })
      }
      navigate('/dispatches')
    } catch (e) {
      setError(e.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{isEditing ? 'Edit Dispatch' : 'New Dispatch'}</h2>
        <button
          onClick={() => navigate('/dispatches')}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
        >
          ← Back
        </button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Dispatch title"
          maxLength={200}
          className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1">Body</label>
        <div className="border border-gray-300 rounded focus-within:ring-2 focus-within:ring-blue-500">
          <Toolbar editor={editor} />
          <div className="p-3 min-h-[200px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={e => setPublished(e.target.checked)}
          className="w-auto"
        />
        <label htmlFor="published" className="text-xs font-semibold">Published</label>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create dispatch'}
      </button>
    </div>
  )
}
