import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'
import CopyButton from '../components/CopyButton'

const COL = 'passwords'
const EMPTY = { siteName: '', siteUrl: '', username: '', password: '', category: 'General', notes: '' }
const CATS = ['General','Work','Social','Finance','Shopping','Email','Entertainment','Other']

export default function Passwords() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showPws, setShowPws] = useState({})
  const [showFormPw, setShowFormPw] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = item => { setEditing(item); setForm({ ...item }); setModal(true) }

  const handleSave = async () => {
    if (!form.siteName || !form.password) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this password?')) await deleteDocument(id)
  }

  const filtered = docs
    .filter(d => filter === 'all' || d.category === filter)
    .filter(d => `${d.siteName} ${d.username} ${d.siteUrl}`.toLowerCase().includes(search.toLowerCase()))

  const genPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    setForm(f => ({ ...f, password: Array.from({length:16}, () => chars[Math.floor(Math.random()*chars.length)]).join('') }))
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Passwords <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Password</button>
      </div>
      <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: 'var(--warning)', marginBottom: 20 }}>
        ⚠️ Passwords are stored in Firestore and protected by your Google login. For critical accounts, consider a dedicated password manager.
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search passwords…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔑</div>
          <div className="empty-title">No passwords saved</div>
          <div className="empty-desc">Store website credentials for quick access.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Password</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.siteName}</div>
                  {item.siteUrl && <div className="card-subtitle">{item.siteUrl.replace(/^https?:\/\//, '')}</div>}
                </div>
                <div className="card-actions">
                  <span className="badge badge-default" style={{ fontSize: 10 }}>{item.category}</span>
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>

              {item.username && (
                <div className="card-field">
                  <span className="field-label">Username / Email</span>
                  <div className="flex-gap">
                    <span className="field-value" style={{ fontFamily: 'var(--font)', fontSize: 13 }}>{item.username}</span>
                    <CopyButton text={item.username} />
                  </div>
                </div>
              )}

              <div className="card-field">
                <span className="field-label">Password</span>
                <div className="flex-gap">
                  <span className="field-value">{showPws[item.id] ? item.password : '••••••••••••'}</span>
                  <button className="copy-btn" onClick={() => setShowPws(p => ({ ...p, [item.id]: !p[item.id] }))}>
                    {showPws[item.id] ? '🙈 Hide' : '👁 Show'}
                  </button>
                  <CopyButton text={item.password} />
                </div>
              </div>

              {item.notes && (
                <div className="card-field" style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Password' : 'Add Password'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Site / App Name *</label>
            <input className="form-input" value={form.siteName} onChange={set('siteName')} placeholder="Google, Netflix…" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={set('category')}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Website URL</label>
          <input className="form-input" value={form.siteUrl} onChange={set('siteUrl')} placeholder="https://google.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Username / Email</label>
          <input className="form-input" value={form.username} onChange={set('username')} placeholder="username or email" />
        </div>
        <div className="form-group">
          <label className="form-label">Password *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="input-with-toggle" style={{ flex: 1 }}>
              <input className="form-input" type={showFormPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Password" />
              <button type="button" className="input-toggle-btn" onClick={() => setShowFormPw(v => !v)}>{showFormPw ? '🙈' : '👁'}</button>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={genPassword} title="Generate password">⚡ Generate</button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Security questions, backup codes…" style={{ minHeight: 60 }} />
        </div>
      </Modal>
    </div>
  )
}
