import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import CopyButton from '../components/CopyButton'

const COL = 'dump'

export default function Dump() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, deleteDocument } = useFirestore(COL)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await addDocument({ content: text.trim() })
      setText('')
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this entry?')) await deleteDocument(id)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd()
  }

  const filtered = docs.filter(d => d.content?.toLowerCase().includes(search.toLowerCase()))

  const fmt = ts => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Random Dump <span>{docs.length}</span></h1>
      </div>

      <div style={{ marginBottom: 20 }}>
        <textarea
          className="form-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Dump anything here — links, thoughts, random info… (Ctrl+Enter to save)"
          style={{ minHeight: 100, fontSize: 14, marginBottom: 10, width: '100%' }}
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !text.trim()}>
          {saving ? 'Saving…' : '+ Dump it'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 10 }}>or Ctrl+Enter</span>
      </div>

      {docs.length > 4 && (
        <div className="section-tools" style={{ marginBottom: 16 }}>
          <input className="search-input" placeholder="Search dump…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 && docs.length > 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No matches found</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">Your dump is empty</div>
          <div className="empty-desc">Use this as a scratchpad for anything and everything.</div>
        </div>
      ) : (
        filtered.map(item => (
          <div key={item.id} className="dump-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="dump-timestamp">{fmt(item.createdAt)}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <CopyButton text={item.content} />
                <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>
            <div className="dump-content">{item.content}</div>
          </div>
        ))
      )}
    </div>
  )
}
