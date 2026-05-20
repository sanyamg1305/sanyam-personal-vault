import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

export function useCollection(col, order = 'createdAt') {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const ref = collection(db, 'users', user.uid, col)
    const q = query(ref, orderBy(order, 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error('Firestore error:', err.code, err.message)
      setLoading(false)
    })
    return unsub
  }, [user, col, order])

  return { docs, loading }
}
