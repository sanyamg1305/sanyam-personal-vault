import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

export function useCollection(col, order = 'createdAt') {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)

    // Timeout: if Firestore doesn't respond in 12s, stop loading
    const timeout = setTimeout(() => {
      setLoading(false)
      setError('Connection timed out. Check Firestore rules in Firebase Console.')
    }, 12000)

    const ref = collection(db, 'users', user.uid, col)
    // No orderBy — sort client-side to avoid index requirements on named databases
    const q = query(ref)

    const unsub = onSnapshot(q, (snap) => {
      clearTimeout(timeout)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sort client-side by the requested field descending
      data.sort((a, b) => {
        const av = a[order], bv = b[order]
        if (av?.toMillis) return bv?.toMillis?.() - av.toMillis()
        if (typeof av === 'string' && typeof bv === 'string') return bv.localeCompare(av)
        return (bv || 0) - (av || 0)
      })
      setDocs(data)
      setLoading(false)
    }, (err) => {
      clearTimeout(timeout)
      console.error('Firestore error:', err.code, err.message)
      setError(err.message)
      setLoading(false)
    })

    return () => { clearTimeout(timeout); unsub() }
  }, [user, col, order])

  return { docs, loading, error }
}
