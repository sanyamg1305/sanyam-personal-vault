import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'music'
const EMPTY = { title: '', artist: '', album: '', type: 'Song', genre: '', platform: 'Spotify', recommendedBy: '', notes: '' }

const PLATFORM_COLORS = { Spotify: '#1DB954', 'Apple Music': '#fc3c44', YouTube: '#FF0000', 'YouTube Music': '#FF0000', Other: 'var(--accent)' }

export default function Music() {
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
    if (window.confirm('Delete this?')) await deleteDocument(id)
  }

  const filtered = docs
    .filter(d => filter === 'all' || d.type === filter)
    .filter(d => `${d.title} ${d.artist} ${d.album} ${d.genre}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Music <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search music…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Types</option>
          {['Song','Album','Playlist','Artist','Podcast'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <div className="empty-title">No music saved yet</div>
          <div className="empty-desc">Save songs, albums, playlists and artists you love.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Music</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.title}</div>
                  <div className="card-subtitle">{item.artist}{item.album ? ` · ${item.album}` : ''}</div>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
              <div className="flex-gap">
                <span className="badge badge-accent">{item.type}</span>
                {item.genre && <span className="badge badge-default">{item.genre}</span>}
                {item.platform && (
                  <span className="badge" style={{ background: PLATFORM_COLORS[item.platform] + '22', color: PLATFORM_COLORS[item.platform] }}>
                    {item.platform}
                  </span>
                )}
              </div>
              {item.recommendedBy && (
                <div className="card-field" style={{ marginTop: 8 }}>
                  <span className="field-label">Recommended by</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.recommendedBy}</span>
                </div>
              )}
              {item.notes && (
                <div className="card-field" style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit' : 'Add Music'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')} placeholder="Song / Album name" />
          </div>
          <div className="form-group">
            <label className="form-label">Artist</label>
            <input className="form-input" value={form.artist} onChange={set('artist')} placeholder="Artist name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Album</label>
            <input className="form-input" value={form.album} onChange={set('album')} placeholder="Album name" />
          </div>
          <div className="form-group">
            <label className="form-label">Genre</label>
            <input className="form-input" value={form.genre} onChange={set('genre')} placeholder="Pop, Hip-hop…" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={set('type')}>
              {['Song','Album','Playlist','Artist','Podcast'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Platform</label>
            <select className="form-select" value={form.platform} onChange={set('platform')}>
              {['Spotify','Apple Music','YouTube Music','YouTube','Amazon Music','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Recommended By</label>
          <input className="form-input" value={form.recommendedBy} onChange={set('recommendedBy')} placeholder="Friend's name, podcast…" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Why you love it, lyrics, mood…" />
        </div>
      </Modal>
    </div>
  )
}
