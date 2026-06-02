import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useFirestore(col) {
  const { user } = useAuth()

  // Strip internal fields before storing in data JSONB
  function toData(form) {
    const { id, createdAt, updatedAt, ...rest } = form
    return rest
  }

  const addDocument = async (form) => {
    const { error } = await supabase.from('vault_items').insert({
      user_id: user.uid,
      collection: col,
      data: toData(form),
    })
    if (error) throw error
  }

  const updateDocument = async (id, form) => {
    const { error } = await supabase
      .from('vault_items')
      .update({ data: toData(form) })
      .eq('id', id)
      .eq('user_id', user.uid)
    if (error) throw error
  }

  const deleteDocument = async (id) => {
    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid)
    if (error) throw error
  }

  return { addDocument, updateDocument, deleteDocument }
}
