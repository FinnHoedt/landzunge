import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { api } from '../lib/api'

function Toolbar({ editor }) {
  if (!editor) return null
  return (
    <div className="editor-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
      >B</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
      ><em>I</em></button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
      >H2</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'active' : ''}
      >• List</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'active' : ''}
      >" Quote</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >— HR</button>
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

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div className="actions-row">
        <h2>{isEditing ? 'Edit Dispatch' : 'New Dispatch'}</h2>
        <button onClick={() => navigate('/dispatches')}>← Back</button>
      </div>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      <div className="form-field">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Dispatch title"
          maxLength={200}
        />
      </div>
      <div className="form-field">
        <label>Body</label>
        <div className="editor-wrapper">
          <Toolbar editor={editor} />
          <EditorContent editor={editor} className="editor-content" />
        </div>
      </div>
      <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={e => setPublished(e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="published" style={{ marginBottom: 0 }}>Published</label>
      </div>
      <button className="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create dispatch'}
      </button>
    </div>
  )
}
