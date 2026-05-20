import { useState, useMemo } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'subscriptions'
const CATS = ['Entertainment','Productivity','Health','News','Cloud','Shopping','Finance','Education','Other']
const EMPTY = { serviceName: '', amount: '', currency: '₹', billingCycle: 'Monthly', nextBillingDate: '', category: 'Entertainment', status: 'Active', website: '', notes: '' }

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

export default function Subscriptions() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = item => { setEditing(item); setForm({ ...item }); setModal(true) }

  const handleSave = async () => {
    if (!form.serviceName || !form.amount) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this subscription?')) await deleteDocument(id)
  }

  const active = docs.filter(d => d.status === 'Active')

  const monthlyTotal = useMemo(() => active.reduce((s, sub) => {
    const amt = parseFloat(sub.amount) || 0
    if (sub.billingCycle === 'Yearly') return s + amt / 12
    if (sub.billingCycle === 'Weekly') return s + amt * 4.33
    return s + amt
  }, 0), [active])

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter)

  const CAT_ICONS = { Entertainment:'🎬', Productivity:'⚡', Health:'💊', News:'📰', Cloud:'☁️', Shopping:'🛍️', Finance:'💰', Education:'📚', Other:'📦' }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Subscriptions <span>{active.length} active</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Subscription</button>
      </div>

      <div className="sub-banner">
        <div className="sub-banner-item">
          <div className="sub-banner-label">MONTHLY COST</div>
          <div className="sub-banner-value">₹{monthlyTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="sub-banner-item">
          <div className="sub-banner-label">YEARLY COST</div>
          <div className="sub-banner-value">₹{(monthlyTotal * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="sub-banner-item">
          <div className="sub-banner-label">ACTIVE</div>
          <div className="sub-banner-value">{active.length}</div>
        </div>
      </div>

      <div className="section-tools">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option>Active</option>
          <option>Paused</option>
          <option>Cancelled</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔄</div>
          <div className="empty-title">No subscriptions yet</div>
          <div className="empty-desc">Track all your recurring payments in one place.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Subscription</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(item => {
            const days = daysUntil(item.nextBillingDate)
            const urgent = days !== null && days <= 7 && days >= 0
            return (
              <div key={item.id} className="card" style={urgent ? { borderColor: 'var(--warning)' } : {}}>
                <div className="card-header">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>{CAT_ICONS[item.category] || '📦'}</span>
                    <div>
                      <div className="card-title">{item.serviceName}</div>
                      <div className="card-subtitle">{item.category}</div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                    <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                  </div>
                </div>

                <div className="field-row">
                  <div className="card-field">
                    <span className="field-label">Amount</span>
                    <span className="field-value" style={{ fontSize: 18, fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text-1)' }}>
                      {item.currency}{parseFloat(item.amount).toLocaleString('en-IN')}
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>/{item.billingCycle === 'Monthly' ? 'mo' : item.billingCycle === 'Yearly' ? 'yr' : 'wk'}</span>
                    </span>
                  </div>
                  <div className="card-field">
                    <span className="field-label">Status</span>
                    <span className={`badge ${item.status === 'Active' ? 'badge-success' : item.status === 'Paused' ? 'badge-warning' : 'badge-danger'}`}>{item.status}</span>
                  </div>
                </div>

                {item.nextBillingDate && (
                  <div className="card-field">
                    <span className="field-label">Next Billing</span>
                    <span style={{ fontSize: 13, color: urgent ? 'var(--warning)' : 'var(--text-2)' }}>
                      {item.nextBillingDate}
                      {days !== null && days >= 0 && ` · ${days === 0 ? 'Today!' : `in ${days}d`}`}
                      {days !== null && days < 0 && ' · Overdue'}
                    </span>
                  </div>
                )}

                {item.website && (
                  <div className="card-field">
                    <span className="field-label">Website</span>
                    <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>{item.website}</a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Subscription' : 'Add Subscription'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input className="form-input" value={form.serviceName} onChange={set('serviceName')} placeholder="Netflix, Spotify…" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={set('category')}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={form.currency} onChange={set('currency')}>
              {['₹','$','€','£','AED'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input className="form-input" type="number" value={form.amount} onChange={set('amount')} placeholder="199" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Billing Cycle</label>
            <select className="form-select" value={form.billingCycle} onChange={set('billingCycle')}>
              {['Monthly','Yearly','Weekly','Quarterly'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Next Billing Date</label>
            <input className="form-input" type="date" value={form.nextBillingDate} onChange={set('nextBillingDate')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              {['Active','Paused','Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="form-input" value={form.website} onChange={set('website')} placeholder="netflix.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Login email, plan details…" style={{ minHeight: 60 }} />
        </div>
      </Modal>
    </div>
  )
}
