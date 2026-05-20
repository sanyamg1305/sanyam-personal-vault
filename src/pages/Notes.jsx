import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'notes'
const EMPTY = { title: '', content: '', tags: '' }

export default function Notes() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = item => { setEditing(item); setForm({ ...item }); setModal(true); setViewModal(null) }

  const handleSave = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this note?')) { await deleteDocument(id); setViewModal(null) }
  }

  const allTags = [...new Set(docs.flatMap(d => (d.tags || '').split(',').map(t => t.trim()).filter(Boolean)))]

  const filtered = docs.filter(d => {
    const matchSearch = `${d.title} ${d.content} ${d.tags}`.toLowerCase().includes(search.toLowerCase())
    const matchTag = !tagFilter || (d.tags || '').split(',').map(t => t.trim()).includes(tagFilter)
    return matchSearch && matchTag
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notes <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ New Note</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
        {allTags.length > 0 && (
          <select className="filter-select" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t}>{t}</option>)}
          </select>
        )}
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-title">No notes yet</div>
          <div className="empty-desc">Capture your thoughts, ideas, and important information.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ New Note</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setViewModal(item)}>
              <div className="card-header">
                <div className="card-title" style={{ flex: 1 }}>{item.title}</div>
                <div className="card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
              <p className="note-content">{item.content}</p>
              {item.tags && (
                <div className="note-tags">
                  {item.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="note-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewModal.title}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(viewModal)}>✏️ Edit</button>
                <button className="modal-close" onClick={() => setViewModal(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{viewModal.content}</p>
              {viewModal.tags && (
                <div className="note-tags" style={{ marginTop: 16 }}>
                  {viewModal.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="note-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Note' : 'New Note'} onSave={handleSave} saving={saving} size="lg">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={set('title')} placeholder="Note title" />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea className="form-textarea" value={form.content} onChange={set('content')} placeholder="Write your note here…" style={{ minHeight: 200 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="work, personal, ideas" />
        </div>
      </Modal>
    </div>
  )
}
