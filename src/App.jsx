import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import Dashboard from './pages/Dashboard'
import Banking from './pages/Banking'
import Cards from './pages/Cards'
import Restaurants from './pages/Restaurants'
import Music from './pages/Music'
import Books from './pages/Books'
import Movies from './pages/Movies'
import Expenses from './pages/Expenses'
import Subscriptions from './pages/Subscriptions'
import Notes from './pages/Notes'
import Dump from './pages/Dump'
import Contacts from './pages/Contacts'
import Passwords from './pages/Passwords'
import Documents from './pages/Documents'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="banking" element={<Banking />} />
        <Route path="cards" element={<Cards />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="music" element={<Music />} />
        <Route path="books" element={<Books />} />
        <Route path="movies" element={<Movies />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="notes" element={<Notes />} />
        <Route path="dump" element={<Dump />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="passwords" element={<Passwords />} />
        <Route path="documents" element={<Documents />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
