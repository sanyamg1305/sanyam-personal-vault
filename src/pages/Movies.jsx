import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'movies'
const EMPTY = { title: '', type: 'Movie', genre: '', status: 'Want to Watch', rating: 0, platform: '', seasons: '', notes: '' }

function Stars({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star${n <= value ? ' filled' : ''}`} onClick={() => onChange && onChange(n)}>★</span>
      ))}
    </div>
  )
}

const STATUS_BADGE = { 'Want to Watch': 'badge-accent', 'Watching': 'badge-warning', 'Watched': 'badge-success' }

export default function Movies() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
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
    if (window.confirm('Delete this?')) await deleteDocument(id)
  }

  const filtered = docs
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .filter(d => filterType === 'all' || d.type === filterType)
    .filter(d => `${d.title} ${d.genre} ${d.platform}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Movies & TV <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search movies & shows…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {['Movie','TV Series','Documentary','Anime','Mini-Series'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option>Want to Watch</option>
          <option>Watching</option>
          <option>Watched</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <div className="empty-title">No movies or shows yet</div>
          <div className="empty-desc">Build your watchlist and track what you've seen.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Movie / Show</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.title}</div>
                  <div className="card-subtitle">{item.type}{item.seasons ? ` · ${item.seasons} seasons` : ''}</div>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
              <div className="flex-gap" style={{ marginBottom: 8 }}>
                <span className={`badge ${STATUS_BADGE[item.status] || 'badge-default'}`}>{item.status}</span>
                {item.genre && <span className="badge badge-default">{item.genre}</span>}
                {item.platform && <span className="badge badge-default">{item.platform}</span>}
              </div>
              {item.rating > 0 && <Stars value={item.rating} />}
              {item.notes && (
                <div className="card-field" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit' : 'Add Movie / Show'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')} placeholder="Title" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={set('type')}>
              {['Movie','TV Series','Documentary','Anime','Mini-Series'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Genre</label>
            <input className="form-input" value={form.genre} onChange={set('genre')} placeholder="Action, Comedy…" />
          </div>
          <div className="form-group">
            <label className="form-label">Platform</label>
            <input className="form-input" value={form.platform} onChange={set('platform')} placeholder="Netflix, Prime…" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              <option>Want to Watch</option>
              <option>Watching</option>
              <option>Watched</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Seasons (TV)</label>
            <input className="form-input" value={form.seasons} onChange={set('seasons')} placeholder="3" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <Stars value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Thoughts, where you left off…" />
        </div>
      </Modal>
    </div>
  )
}
