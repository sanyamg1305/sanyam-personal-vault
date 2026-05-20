import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'
import CopyButton from '../components/CopyButton'

const COL = 'cards'
const EMPTY = { cardHolder: '', cardNumber: '', expiryDate: '', cvv: '', cardType: 'Credit', network: 'Visa', bankName: '', billingAddress: '', notes: '' }

function mask(num) {
  const clean = (num || '').replace(/\s/g, '')
  if (clean.length < 4) return clean
  return '•••• •••• •••• ' + clean.slice(-4)
}

function formatCardNumber(num) {
  return (num || '').replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
}

const NETWORK_COLORS = {
  Visa: 'linear-gradient(135deg,#1a1f71,#4168b1)',
  Mastercard: 'linear-gradient(135deg,#eb001b,#f79e1b)',
  Amex: 'linear-gradient(135deg,#007b5e,#00b59c)',
  RuPay: 'linear-gradient(135deg,#f26522,#ef3e23)',
  Other: 'linear-gradient(135deg,#7c6dfa,#b06dfa)',
}

export default function Cards() {
  const { docs, loading } = useCollection(COL)
  const { addDocument, updateDocument, deleteDocument } = useFirestore(COL)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showNums, setShowNums] = useState({})
  const [showCvvs, setShowCvvs] = useState({})
  const [showFormCvv, setShowFormCvv] = useState(false)
  const [showFormNum, setShowFormNum] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = item => { setEditing(item); setForm({ ...item }); setModal(true) }

  const handleSave = async () => {
    if (!form.cardHolder || !form.cardNumber) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this card?')) await deleteDocument(id)
  }

  const filtered = docs.filter(d =>
    `${d.cardHolder} ${d.bankName} ${d.network} ${d.cardType}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cards <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Card</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search cards…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <div className="empty-title">No cards yet</div>
          <div className="empty-desc">Add your credit and debit cards.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Card</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div
                className="card-visual"
                style={{ background: NETWORK_COLORS[item.network] || NETWORK_COLORS.Other }}
              >
                <div className="card-visual-number">
                  {showNums[item.id] ? formatCardNumber(item.cardNumber) : mask(item.cardNumber)}
                </div>
                <div className="card-visual-row">
                  <div>
                    <div className="card-visual-holder">{item.cardHolder?.toUpperCase()}</div>
                    <div className="card-visual-expiry">EXP: {item.expiryDate}</div>
                  </div>
                  <div className="card-visual-network">{item.network}<br/><span style={{fontSize:10,opacity:0.7}}>{item.cardType}</span></div>
                </div>
              </div>

              <div className="card-header" style={{ marginBottom: 8 }}>
                <div>
                  <div className="card-title">{item.bankName || item.cardHolder}</div>
                  <div className="card-subtitle">{item.bankName ? item.cardHolder : ''}</div>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>

              <div className="flex-gap" style={{ marginBottom: 8 }}>
                <button className="copy-btn" onClick={() => setShowNums(p => ({ ...p, [item.id]: !p[item.id] }))}>
                  {showNums[item.id] ? '🙈 Hide' : '👁 Show Number'}
                </button>
                {showNums[item.id] && <CopyButton text={item.cardNumber} label="Copy Number" />}
              </div>

              <div className="field-row">
                <div className="card-field">
                  <span className="field-label">Expiry</span>
                  <div className="flex-gap">
                    <span className="field-value">{item.expiryDate}</span>
                    <CopyButton text={item.expiryDate} />
                  </div>
                </div>
                <div className="card-field">
                  <span className="field-label">CVV</span>
                  <div className="flex-gap">
                    <span className="field-value">{showCvvs[item.id] ? item.cvv : '•••'}</span>
                    <button className="copy-btn" onClick={() => setShowCvvs(p => ({ ...p, [item.id]: !p[item.id] }))}>
                      {showCvvs[item.id] ? '🙈' : '👁'}
                    </button>
                    {showCvvs[item.id] && <CopyButton text={item.cvv} />}
                  </div>
                </div>
              </div>

              {item.billingAddress && (
                <div className="card-field">
                  <span className="field-label">Billing Address</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.billingAddress}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Card' : 'Add Card'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Card Holder Name *</label>
            <input className="form-input" value={form.cardHolder} onChange={set('cardHolder')} placeholder="Full name on card" />
          </div>
          <div className="form-group">
            <label className="form-label">Bank / Issuer</label>
            <input className="form-input" value={form.bankName} onChange={set('bankName')} placeholder="HDFC Bank" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Card Number *</label>
          <div className="input-with-toggle">
            <input className="form-input" type={showFormNum ? 'text' : 'password'} value={form.cardNumber} onChange={set('cardNumber')} placeholder="1234567890123456" />
            <button type="button" className="input-toggle-btn" onClick={() => setShowFormNum(v => !v)}>{showFormNum ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input className="form-input" value={form.expiryDate} onChange={set('expiryDate')} placeholder="MM/YY" />
          </div>
          <div className="form-group">
            <label className="form-label">CVV</label>
            <div className="input-with-toggle">
              <input className="form-input" type={showFormCvv ? 'text' : 'password'} value={form.cvv} onChange={set('cvv')} placeholder="•••" />
              <button type="button" className="input-toggle-btn" onClick={() => setShowFormCvv(v => !v)}>{showFormCvv ? '🙈' : '👁'}</button>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Card Type</label>
            <select className="form-select" value={form.cardType} onChange={set('cardType')}>
              {['Credit','Debit','Prepaid'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Network</label>
            <select className="form-select" value={form.network} onChange={set('network')}>
              {['Visa','Mastercard','Amex','RuPay','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Billing Address</label>
          <textarea className="form-textarea" value={form.billingAddress} onChange={set('billingAddress')} placeholder="Street, City, State, PIN" style={{ minHeight: 60 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Any notes…" style={{ minHeight: 50 }} />
        </div>
      </Modal>
    </div>
  )
}
