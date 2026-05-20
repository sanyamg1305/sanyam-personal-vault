import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'books'
const EMPTY = { title: '', author: '', genre: '', status: 'Want to Read', rating: 0, dateRead: '', notes: '' }

function Stars({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star${n <= value ? ' filled' : ''}`} onClick={() => onChange && onChange(n)}>★</span>
      ))}
    </div>
  )
}

const STATUS_BADGE = { 'Want to Read': 'badge-accent', 'Reading': 'badge-warning', 'Read': 'badge-success' }

export default function Books() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = item => { setEditing(item); setForm({ ...item }); setModal(true) }

  const handleSave = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this book?')) await deleteDocument(id)
  }

  const filtered = docs
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => `${d.title} ${d.author} ${d.genre}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Books <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search books…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option>Want to Read</option>
          <option>Reading</option>
          <option>Read</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-title">No books yet</div>
          <div className="empty-desc">Track books you want to read, are reading, or have finished.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.title}</div>
                  <div className="card-subtitle">by {item.author}</div>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
              <div className="flex-gap" style={{ marginBottom: 8 }}>
                <span className={`badge ${STATUS_BADGE[item.status] || 'badge-default'}`}>{item.status}</span>
                {item.genre && <span className="badge badge-default">{item.genre}</span>}
              </div>
              {item.rating > 0 && <Stars value={item.rating} />}
              {item.dateRead && (
                <div className="card-field" style={{ marginTop: 8 }}>
                  <span className="field-label">Date Read</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.dateRead}</span>
                </div>
              )}
              {item.notes && (
                <div className="card-field" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Book' : 'Add Book'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')} placeholder="Book title" />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input className="form-input" value={form.author} onChange={set('author')} placeholder="Author name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Genre</label>
            <input className="form-input" value={form.genre} onChange={set('genre')} placeholder="Fiction, Self-help…" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              <option>Want to Read</option>
              <option>Reading</option>
              <option>Read</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Rating</label>
            <Stars value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Date Read</label>
            <input className="form-input" type="date" value={form.dateRead} onChange={set('dateRead')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Your thoughts, key takeaways…" />
        </div>
      </Modal>
    </div>
  )
}
