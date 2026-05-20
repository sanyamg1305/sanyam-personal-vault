import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const NAV = [
  { group: 'OVERVIEW', items: [
    { to: '/', icon: '⚡', label: 'Dashboard', end: true },
  ]},
  { group: 'FINANCE', items: [
    { to: '/banking',       icon: '🏦', label: 'Banking' },
    { to: '/cards',         icon: '💳', label: 'Cards' },
    { to: '/expenses',      icon: '💸', label: 'Expenses' },
    { to: '/subscriptions', icon: '🔄', label: 'Subscriptions' },
  ]},
  { group: 'LIFESTYLE', items: [
    { to: '/restaurants', icon: '🍽️', label: 'Restaurants' },
    { to: '/contacts',    icon: '👥', label: 'Contacts' },
  ]},
  { group: 'ENTERTAINMENT', items: [
    { to: '/movies', icon: '🎬', label: 'Movies & TV' },
    { to: '/music',  icon: '🎵', label: 'Music' },
    { to: '/books',  icon: '📚', label: 'Books' },
  ]},
  { group: 'WORKSPACE', items: [
    { to: '/notes',      icon: '📝', label: 'Notes' },
    { to: '/dump',       icon: '📦', label: 'Random Dump' },
    { to: '/passwords',  icon: '🔑', label: 'Passwords' },
    { to: '/documents',  icon: '📂', label: 'Documents' },
  ]},
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🔐</span>
            <span className="logo-text">MyVault</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ group, items }) => (
            <div key={group} className="nav-group">
              <span className="nav-group-label">{group}</span>
              {items.map(({ to, icon, label, end }) => (
                <NavLink
                  key={to} to={to} end={end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-icon">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            {user?.photoURL && <img src={user.photoURL} alt="" className="user-avatar" />}
            <span className="user-name">{user?.displayName?.split(' ')[0] || 'You'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">⏻</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(v => !v)}>☰</button>
          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
