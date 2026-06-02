import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCollection } from '../hooks/useCollection'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATS_META = [
  { key: 'banking',       label: 'Bank Accounts', to: '/banking',       icon: '🏦', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'cards',         label: 'Cards',          to: '/cards',         icon: '💳', color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'expenses',      label: 'This Month',     to: '/expenses',      icon: '💸', color: '#10b981', bg: '#ecfdf5' },
  { key: 'subscriptions', label: 'Active Subs',    to: '/subscriptions', icon: '🔄', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'restaurants',   label: 'Restaurants',    to: '/restaurants',   icon: '🍽️', color: '#ef4444', bg: '#fef2f2' },
  { key: 'notes',         label: 'Notes',          to: '/notes',         icon: '📝', color: '#6366f1', bg: '#eef2ff' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { docs: banking }       = useCollection('banking')
  const { docs: cards }         = useCollection('cards')
  const { docs: expenses }      = useCollection('expenses', 'date')
  const { docs: subscriptions } = useCollection('subscriptions')
  const { docs: notes }         = useCollection('notes')
  const { docs: restaurants }   = useCollection('restaurants')

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`
  const totalThisMonth = expenses
    .filter(e => e.date?.startsWith(monthKey))
    .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)

  const activeSubs = subscriptions.filter(s => s.status === 'Active')
  const monthlySubTotal = activeSubs.reduce((s, sub) => {
    const amt = parseFloat(sub.amount) || 0
    return s + (sub.billingCycle === 'Yearly' ? amt / 12 : sub.billingCycle === 'Weekly' ? amt * 4.33 : amt)
  }, 0)

  const upcomingSubs = activeSubs
    .filter(s => { const d = (new Date(s.nextBillingDate) - now) / 86400000; return d >= 0 && d <= 7 })
    .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))

  const statValues = {
    banking:       banking.length,
    cards:         cards.length,
    expenses:      `₹${totalThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    subscriptions: activeSubs.length,
    restaurants:   restaurants.length,
    notes:         notes.length,
  }

  return (
    <div>
      {/* Greeting */}
      <div className="dash-greeting-block">
        <div className="dash-greeting-text">
          {greeting()}, <span>{user?.displayName?.split(' ')[0]}</span> 👋
        </div>
        <div className="dash-greeting-date">
          {now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {STATS_META.map(s => (
          <Link key={s.key} to={s.to} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-card-body">
              <div className="stat-card-value">{statValues[s.key]}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
            <div className="stat-card-arrow" style={{ color: s.color }}>→</div>
          </Link>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="dashboard-sections">

        {/* Upcoming renewals */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <span className="dash-panel-dot" style={{ background: '#f59e0b' }} />
              Upcoming Renewals
            </div>
            <Link to="/subscriptions" className="dash-panel-link">View all</Link>
          </div>
          {upcomingSubs.length === 0
            ? <div className="dash-empty">No renewals in the next 7 days 🎉</div>
            : upcomingSubs.map(s => (
              <div key={s.id} className="dash-row">
                <span className="dash-row-name">{s.serviceName}</span>
                <span className="dash-row-badge warning">
                  {new Date(s.nextBillingDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                </span>
              </div>
            ))
          }
        </div>

        {/* Recent notes */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <span className="dash-panel-dot" style={{ background: '#6366f1' }} />
              Recent Notes
            </div>
            <Link to="/notes" className="dash-panel-link">View all</Link>
          </div>
          {notes.length === 0
            ? <div className="dash-empty">No notes yet</div>
            : notes.slice(0,4).map(n => (
              <div key={n.id} className="dash-row">
                <span className="dash-row-name">{n.title}</span>
                {n.tags && <span className="dash-row-badge accent">{n.tags.split(',')[0].trim()}</span>}
              </div>
            ))
          }
        </div>

        {/* Subscription spend */}
        <div className="dash-panel dash-panel-spend">
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <span className="dash-panel-dot" style={{ background: '#10b981' }} />
              Monthly Spend
            </div>
            <Link to="/subscriptions" className="dash-panel-link">Manage</Link>
          </div>
          <div className="dash-spend-amount">
            ₹{monthlySubTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            <span>/mo</span>
          </div>
          <div className="dash-spend-sub">
            ₹{(monthlySubTotal * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })} yearly
            · {activeSubs.length} active subscription{activeSubs.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Recent restaurants */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <span className="dash-panel-dot" style={{ background: '#ef4444' }} />
              Recent Restaurants
            </div>
            <Link to="/restaurants" className="dash-panel-link">View all</Link>
          </div>
          {restaurants.length === 0
            ? <div className="dash-empty">No restaurants added yet</div>
            : restaurants.slice(0,4).map(r => (
              <div key={r.id} className="dash-row">
                <span className="dash-row-name">{r.name}</span>
                <span className={`dash-row-badge ${r.status === 'Visited' ? 'success' : 'accent'}`}>{r.status}</span>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}
