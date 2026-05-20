import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Modal from '../components/Modal'
import CopyButton from '../components/CopyButton'

const COL = 'banking'
const EMPTY = { accountHolder: '', bankName: '', accountNumber: '', accountType: 'Savings', ifsc: '', routingNumber: '', swiftCode: '', branch: '', upiId: '', notes: '' }

function formatAll(item) {
  return [
    `Bank: ${item.bankName}`,
    `Account Holder: ${item.accountHolder}`,
    `Account Number: ${item.accountNumber}`,
    `Account Type: ${item.accountType}`,
    item.ifsc ? `IFSC: ${item.ifsc}` : '',
    item.routingNumber ? `Routing: ${item.routingNumber}` : '',
    item.swiftCode ? `SWIFT: ${item.swiftCode}` : '',
    item.branch ? `Branch: ${item.branch}` : '',
    item.upiId ? `UPI ID: ${item.upiId}` : '',
  ].filter(Boolean).join('\n')
}

export default function Banking() {
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
    if (!form.bankName || !form.accountNumber) return
    setSaving(true)
    try {
      editing ? await updateDocument(editing.id, form) : await addDocument(form)
      setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (window.confirm('Delete this account?')) await deleteDocument(id)
  }

  const filtered = docs.filter(d =>
    `${d.bankName} ${d.accountHolder} ${d.accountNumber}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Banking <span>{docs.length}</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
      </div>

      <div className="section-tools">
        <input className="search-input" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading">Loading…</div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <div className="empty-title">No bank accounts yet</div>
          <div className="empty-desc">Add your first bank account to get started.</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.bankName}</div>
                  <div className="card-subtitle">{item.accountHolder}</div>
                </div>
                <div className="card-actions">
                  <span className="badge badge-accent">{item.accountType}</span>
                  <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>

              <div className="card-field">
                <span className="field-label">Account Number</span>
                <div className="flex-gap">
                  <span className="field-value">{item.accountNumber}</span>
                  <CopyButton text={item.accountNumber} />
                </div>
              </div>

              {item.ifsc && (
                <div className="field-row">
                  <div className="card-field">
                    <span className="field-label">IFSC</span>
                    <div className="flex-gap">
                      <span className="field-value">{item.ifsc}</span>
                      <CopyButton text={item.ifsc} />
                    </div>
                  </div>
                  {item.branch && (
                    <div className="card-field">
                      <span className="field-label">Branch</span>
                      <span className="field-value">{item.branch}</span>
                    </div>
                  )}
                </div>
              )}

              {item.routingNumber && (
                <div className="card-field">
                  <span className="field-label">Routing Number</span>
                  <div className="flex-gap">
                    <span className="field-value">{item.routingNumber}</span>
                    <CopyButton text={item.routingNumber} />
                  </div>
                </div>
              )}

              {item.swiftCode && (
                <div className="card-field">
                  <span className="field-label">SWIFT / BIC</span>
                  <div className="flex-gap">
                    <span className="field-value">{item.swiftCode}</span>
                    <CopyButton text={item.swiftCode} />
                  </div>
                </div>
              )}

              {item.upiId && (
                <div className="card-field">
                  <span className="field-label">UPI ID</span>
                  <div className="flex-gap">
                    <span className="field-value">{item.upiId}</span>
                    <CopyButton text={item.upiId} />
                  </div>
                </div>
              )}

              {item.notes && (
                <div className="card-field" style={{ marginTop: 6 }}>
                  <span className="field-label">Notes</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.notes}</span>
                </div>
              )}

              <div className="divider" />
              <CopyButton text={formatAll(item)} label="Copy All Details" />
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Account' : 'Add Bank Account'} onSave={handleSave} saving={saving}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bank Name *</label>
            <input className="form-input" value={form.bankName} onChange={set('bankName')} placeholder="HDFC Bank" />
          </div>
          <div className="form-group">
            <label className="form-label">Account Holder *</label>
            <input className="form-input" value={form.accountHolder} onChange={set('accountHolder')} placeholder="Full name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Account Number *</label>
            <input className="form-input" value={form.accountNumber} onChange={set('accountNumber')} placeholder="1234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-select" value={form.accountType} onChange={set('accountType')}>
              {['Savings','Current','Checking','Fixed Deposit','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">IFSC Code</label>
            <input className="form-input" value={form.ifsc} onChange={set('ifsc')} placeholder="HDFC0001234" />
          </div>
          <div className="form-group">
            <label className="form-label">Branch</label>
            <input className="form-input" value={form.branch} onChange={set('branch')} placeholder="Mumbai Main" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Routing Number</label>
            <input className="form-input" value={form.routingNumber} onChange={set('routingNumber')} placeholder="For US accounts" />
          </div>
          <div className="form-group">
            <label className="form-label">SWIFT / BIC</label>
            <input className="form-input" value={form.swiftCode} onChange={set('swiftCode')} placeholder="HDFCINBB" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">UPI ID</label>
          <input className="form-input" value={form.upiId} onChange={set('upiId')} placeholder="name@bank" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" />
        </div>
      </Modal>
    </div>
  )
}
