import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import { storage } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['Personal ID', 'School', 'College', 'Medical', 'Financial', 'Legal', 'Property', 'Work', 'Other']

const CAT_ICONS = {
  'Personal ID': '🪪', 'School': '🏫', 'College': '🎓', 'Medical': '🏥',
  'Financial': '💰', 'Legal': '⚖️', 'Property': '🏠', 'Work': '💼', 'Other': '📎',
}

function fileIcon(type) {
  if (!type) return '📎'
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('sheet') || type.includes('excel')) return '📊'
  return '📎'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Documents() {
  const { user } = useAuth()
  const { docs, loading, error } = useCollection('documents')
  const { addDocument, deleteDocument } = useFirestore('documents')

  const [category, setCategory] = useState('Personal ID')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef()

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) { setUploadError('File too large. Max size is 20MB.'); return }

    setUploading(true)
    setProgress(0)
    setUploadError('')

    const storagePath = `users/${user.uid}/documents/${Date.now()}_${file.name}`
    const storageRef = ref(storage, storagePath)
    const task = uploadBytesResumable(storageRef, file)

    task.on('state_changed',
      (snap) => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      (err) => { setUploadError('Upload failed: ' + err.message); setUploading(false) },
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref)
        await addDocument({ name: file.name, storagePath, downloadURL, category, size: file.size, type: file.type })
        setUploading(false)
        setProgress(0)
      }
    )
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try { await deleteObject(ref(storage, item.storagePath)) } catch {}
    await deleteDocument(item.id)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleUpload(e.dataTransfer.files)
  }

  const filtered = docs
    .filter(d => filter === 'all' || d.category === filter)
    .filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))

  // Group by category for display
  const grouped = filter !== 'all' ? null : CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(d => d.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Documents <span>{docs.length}</span></h1>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !uploading && fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        {uploading ? (
          <>
            <div className="upload-icon">⏳</div>
            <div className="upload-text">Uploading… {progress}%</div>
            <div className="upload-progress-bar-wrap">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="upload-icon">{dragging ? '📂' : '📤'}</div>
            <div className="upload-text">{dragging ? 'Drop to upload' : 'Drop file here or click to upload'}</div>
            <div className="upload-sub">PDF, JPG, PNG, DOC, XLS — max 20MB</div>
          </>
        )}
      </div>

      {uploadError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{uploadError}</p>}

      {/* Category picker for upload */}
      <div style={{ marginBottom: 20 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>Upload category:</div>
        <div className="cat-picker">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cat-pill ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {CAT_ICONS[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Filter + search */}
      <div className="section-tools">
        <input className="search-input" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <div className="empty-title">No documents yet</div>
          <div className="empty-desc">Upload your Aadhar, PAN, certificates, marksheets, and more.</div>
        </div>
      ) : filter !== 'all' ? (
        <div className="grid grid-3">
          {filtered.map(item => <DocCard key={item.id} item={item} onDelete={handleDelete} />)}
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{CAT_ICONS[cat]}</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{cat}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{items.length} file{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-3">
              {items.map(item => <DocCard key={item.id} item={item} onDelete={handleDelete} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DocCard({ item, onDelete }) {
  const isImage = item.type?.startsWith('image/')

  return (
    <div className="card doc-card">
      {isImage ? (
        <a href={item.downloadURL} target="_blank" rel="noopener noreferrer">
          <img src={item.downloadURL} alt={item.name} className="doc-preview-img" />
        </a>
      ) : (
        <div className="doc-file-icon">{fileIcon(item.type)}</div>
      )}
      <div className="doc-name" title={item.name}>{item.name}</div>
      <div className="flex-gap" style={{ marginTop: 5, marginBottom: 10 }}>
        {item.size ? <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatSize(item.size)}</span> : null}
        {item.createdAt ? <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDate(item.createdAt)}</span> : null}
      </div>
      <div className="flex-gap">
        <a href={item.downloadURL} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
          👁 View
        </a>
        <a href={item.downloadURL} download={item.name} className="btn btn-sm btn-secondary">⬇</a>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(item)}>🗑️</button>
      </div>
    </div>
  )
}
