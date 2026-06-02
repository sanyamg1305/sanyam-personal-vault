import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Flatten a Supabase row: spread data JSONB so pages get flat objects (same shape as before)
function flatten(row) {
  return {
    id: row.id,
    ...row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useCollection(col, order = 'createdAt') {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', user.uid)
      .eq('collection', col)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      setError(error.message)
      setLoading(false)
      return
    }

    const flat = data.map(flatten)

    // Client-side sort by the requested order field
    flat.sort((a, b) => {
      const av = a[order] ?? a.createdAt ?? ''
      const bv = b[order] ?? b.createdAt ?? ''
      if (typeof av === 'string' && typeof bv === 'string') return bv.localeCompare(av)
      return (bv || 0) - (av || 0)
    })

    setDocs(flat)
    setLoading(false)
  }, [user, col, order])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchData()

    // Real-time: re-fetch when anything changes in this collection
    const channel = supabase
      .channel(`vault_${col}_${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vault_items' },
        (payload) => {
          const changed = payload.new?.collection || payload.old?.collection
          if (changed === col) fetchData()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, col, fetchData])

  return { docs, loading, error }
}
