import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'
import CopyButton from '../components/CopyButton'

const COL = 'contacts'
const EMPTY = { name: '', phone: '', email: '', relationship: '', company: '', address: '', notes: '' }

export default function Contacts() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [search, setSearch] = useState('')
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
    if (window.confirm('Delete this contact?')) await deleteDocument(id)
  }

  const filtered = docs.filter(d =>
    `${d.name} ${d.phone} ${d.email} ${d.relationship} ${d.company}`.toLowerCase().includes(search.toLowerCase())
  )

  const initials = name => name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?'

  const COLORS = ['#7c6dfa','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#8b5cf6']
  const colorFor = name => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contacts <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No contacts yet</div>
          <div className="empty-desc">Save important phone numbers and emails.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: colorFor(item.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {initials(item.name)}
                  </div>
                  <div>
                    <div className="card-title">{item.name}</div>
                    {item.relationship && <div className="card-subtitle">{item.relationship}{item.company ? ` · ${item.company}` : ''}</div>}
                  </div>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>

              {item.phone && (
                <div className="card-field">
                  <span className="field-label">Phone</span>
                  <div className="flex-gap">
                    <span className="field-value">{item.phone}</span>
                    <CopyButton text={item.phone} />
                  </div>
                </div>
              )}
              {item.email && (
                <div className="card-field">
                  <span className="field-label">Email</span>
                  <div className="flex-gap">
                    <span className="field-value" style={{ fontFamily: 'var(--font)', fontSize: 12 }}>{item.email}</span>
                    <CopyButton text={item.email} />
                  </div>
                </div>
              )}
              {item.address && (
                <div className="card-field">
                  <span className="field-label">Address</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.address}</span>
                </div>
              )}
              {item.notes && (
                <div className="card-field">
                  <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Contact' : 'Add Contact'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Relationship</label>
            <input className="form-input" value={form.relationship} onChange={set('relationship')} placeholder="Friend, Doctor, Lawyer…" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Company / Organization</label>
          <input className="form-input" value={form.company} onChange={set('company')} placeholder="Company name" />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-textarea" value={form.address} onChange={set('address')} placeholder="Full address" style={{ minHeight: 60 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Additional notes" style={{ minHeight: 50 }} />
        </div>
      </Modal>
    </div>
  )
}
