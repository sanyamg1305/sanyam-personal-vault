import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCollection } from '../hooks/useCollection'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Dashboard() {
  const { user } = useAuth()
  const { docs: banking } = useCollection('banking')
  const { docs: cards } = useCollection('cards')
  const { docs: expenses } = useCollection('expenses', 'date')
  const { docs: subscriptions } = useCollection('subscriptions')
  const { docs: notes } = useCollection('notes')
  const { docs: restaurants } = useCollection('restaurants')

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`
  const thisMonthExpenses = expenses.filter(e => e.date?.startsWith(monthKey))
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)

  const activeSubs = subscriptions.filter(s => s.status === 'Active')
  const monthlySubTotal = activeSubs.reduce((s, sub) => {
    const amt = parseFloat(sub.amount) || 0
    return s + (sub.billingCycle === 'Yearly' ? amt / 12 : sub.billingCycle === 'Weekly' ? amt * 4.33 : amt)
  }, 0)

  const upcomingSubs = activeSubs
    .filter(s => {
      if (!s.nextBillingDate) return false
      const days = (new Date(s.nextBillingDate) - now) / 86400000
      return days >= 0 && days <= 7
    })
    .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))

  const stats = [
    { icon: '🏦', value: banking.length,    label: 'Bank Accounts',    to: '/banking' },
    { icon: '💳', value: cards.length,      label: 'Cards',            to: '/cards' },
    { icon: '💸', value: `₹${totalThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, label: 'This Month', to: '/expenses' },
    { icon: '🔄', value: activeSubs.length, label: 'Subscriptions',    to: '/subscriptions' },
    { icon: '🍽️', value: restaurants.length, label: 'Restaurants',    to: '/restaurants' },
    { icon: '📝', value: notes.length,      label: 'Notes',            to: '/notes' },
  ]

  return (
    <div>
      <p className="dashboard-greeting">{greeting()}, {user?.displayName?.split(' ')[0]} 👋</p>
      <p className="dashboard-date">{now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>

      <div className="stats-grid">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">🔄 Upcoming Renewals</span>
            <Link to="/subscriptions">View all</Link>
          </div>
          {upcomingSubs.length === 0 ? (
            <p className="dash-empty">No renewals in the next 7 days</p>
          ) : upcomingSubs.map(s => (
            <div key={s.id} className="dash-item">
              <span className="dash-item-name">{s.serviceName}</span>
              <span className="dash-item-value text-warning">
                {new Date(s.nextBillingDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
              </span>
            </div>
          ))}
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">📝 Recent Notes</span>
            <Link to="/notes">View all</Link>
          </div>
          {notes.length === 0 ? (
            <p className="dash-empty">No notes yet</p>
          ) : notes.slice(0, 4).map(n => (
            <div key={n.id} className="dash-item">
              <span className="dash-item-name">{n.title}</span>
              <span className="dash-item-value">{n.tags?.split(',')[0]?.trim() || ''}</span>
            </div>
          ))}
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">💸 Subscription Cost</span>
            <Link to="/subscriptions">Manage</Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)' }}>
              ₹{monthlySubTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>/mo</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              ₹{(monthlySubTotal * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })} yearly across {activeSubs.length} active subs
            </div>
          </div>
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">🍽️ Recent Restaurants</span>
            <Link to="/restaurants">View all</Link>
          </div>
          {restaurants.length === 0 ? (
            <p className="dash-empty">No restaurants added yet</p>
          ) : restaurants.slice(0, 4).map(r => (
            <div key={r.id} className="dash-item">
              <span className="dash-item-name">{r.name}</span>
              <span className={`badge ${r.status === 'Visited' ? 'badge-success' : 'badge-accent'}`} style={{ fontSize: 10 }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
