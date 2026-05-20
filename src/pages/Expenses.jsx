import { useState, useMemo } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'

const COL = 'expenses'
const CATEGORIES = ['Food','Transport','Shopping','Bills','Health','Entertainment','Travel','Education','Salary','Other']
const EMPTY = { date: new Date().toISOString().split('T')[0], category: 'Food', amount: '', currency: '₹', description: '', paymentMethod: 'UPI' }

export default function Expenses() {
  const { docs, loading } = useCollection(COL, 'date')
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`
  })
  const [catFilter, setCatFilter] = useState('all')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = item => { setEditing(item); setForm({ ...item }); setModal(true) }

  const handleSave = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this expense?')) await deleteDocument(id)
  }

  const monthDocs = useMemo(() =>
    docs.filter(d => d.date?.startsWith(monthFilter)),
    [docs, monthFilter]
  )

  const filtered = catFilter === 'all' ? monthDocs : monthDocs.filter(d => d.category === catFilter)
  const total = monthDocs.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
  const avg = monthDocs.length > 0 ? total / new Date(monthFilter + '-01').getDate() : 0

  const catTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = monthDocs.filter(d => d.category === cat).reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
    return acc
  }, {})
  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0]

  const CAT_ICONS = { Food:'🍔', Transport:'🚗', Shopping:'🛍️', Bills:'📋', Health:'💊', Entertainment:'🎮', Travel:'✈️', Education:'📖', Salary:'💰', Other:'📦' }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
      </div>

      <div className="expense-summary">
        <div className="expense-stat">
          <div className="expense-stat-label">Total This Month</div>
          <div className="expense-stat-value">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="expense-stat-sub">{monthDocs.length} transactions</div>
        </div>
        <div className="expense-stat">
          <div className="expense-stat-label">Daily Average</div>
          <div className="expense-stat-value">₹{avg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="expense-stat">
          <div className="expense-stat-label">Top Category</div>
          <div className="expense-stat-value">{topCat && topCat[1] > 0 ? `${CAT_ICONS[topCat[0]]} ${topCat[0]}` : '—'}</div>
          {topCat && topCat[1] > 0 && <div className="expense-stat-sub">₹{topCat[1].toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>}
        </div>
      </div>

      <div className="section-tools">
        <input type="month" className="filter-select" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <div className="empty-title">No expenses this month</div>
          <div className="empty-desc">Start tracking your spending.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
        </div>
      ) : (
        <div className="grid grid-1">
          {filtered.sort((a,b) => b.date?.localeCompare(a.date)).map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
              <span style={{ fontSize: 24 }}>{CAT_ICONS[item.category] || '📦'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{item.description || item.category}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {item.date} · {item.category} · {item.paymentMethod}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)', flexShrink: 0 }}>
                {item.currency}{parseFloat(item.amount).toLocaleString('en-IN')}
              </div>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Expense' : 'Add Expense'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.date} onChange={set('date')} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={form.currency} onChange={set('currency')}>
              {['₹','$','€','£','¥','AED','SGD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input className="form-input" type="number" value={form.amount} onChange={set('amount')} placeholder="500" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description} onChange={set('description')} placeholder="What was it for?" />
        </div>
        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <select className="form-select" value={form.paymentMethod} onChange={set('paymentMethod')}>
            {['UPI','Credit Card','Debit Card','Cash','Bank Transfer','Wallet','Other'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  )
}
