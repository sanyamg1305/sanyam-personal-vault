import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'restaurants'
const EMPTY = { name: '', cuisine: '', location: '', status: 'Want to Visit', rating: 0, priceRange: '$$', dateVisited: '', notes: '' }

function Stars({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star${n <= value ? ' filled' : ''}`} onClick={() => onChange && onChange(n)}>★</span>
      ))}
    </div>
  )
}

export default function Restaurants() {
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
    if (!form.name) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this restaurant?')) await deleteDocument(id)
  }

  const filtered = docs
    .filter(d => (filter === 'all' || d.status === filter))
    .filter(d => `${d.name} ${d.cuisine} ${d.location}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Restaurants <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Restaurant</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search restaurants…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="Want to Visit">Want to Visit</option>
          <option value="Visited">Visited</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <div className="empty-title">No restaurants yet</div>
          <div className="empty-desc">Track places you want to visit or have visited.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Restaurant</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.name}</div>
                  <div className="card-subtitle">{item.cuisine}</div>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>

              <div className="flex-gap" style={{ marginBottom: 10 }}>
                <span className={`badge ${item.status === 'Visited' ? 'badge-success' : 'badge-accent'}`}>{item.status}</span>
                <span className="badge badge-default">{item.priceRange}</span>
              </div>

              {item.rating > 0 && <Stars value={item.rating} />}

              {item.location && (
                <div className="card-field" style={{ marginTop: 8 }}>
                  <span className="field-label">Location</span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.location}</span>
                </div>
              )}
              {item.dateVisited && (
                <div className="card-field">
                  <span className="field-label">Date Visited</span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{item.dateVisited}</span>
                </div>
              )}
              {item.notes && (
                <div className="card-field">
                  <span className="field-label">Notes</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Restaurant' : 'Add Restaurant'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Restaurant name" />
          </div>
          <div className="form-group">
            <label className="form-label">Cuisine</label>
            <input className="form-input" value={form.cuisine} onChange={set('cuisine')} placeholder="Italian, Indian…" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Location / Address</label>
          <input className="form-input" value={form.location} onChange={set('location')} placeholder="City or full address" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              <option>Want to Visit</option>
              <option>Visited</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Price Range</label>
            <select className="form-select" value={form.priceRange} onChange={set('priceRange')}>
              {['$','$$','$$$','$$$$'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Rating</label>
            <Stars value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Date Visited</label>
            <input className="form-input" type="date" value={form.dateVisited} onChange={set('dateVisited')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Dishes to try, ambience, parking…" />
        </div>
      </Modal>
    </div>
  )
}
