import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

export function useFirestore(col) {
  const { user } = useAuth()

  const addDocument = (data) =>
    addDoc(collection(db, 'users', user.uid, col), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

  const updateDocument = (id, data) =>
    updateDoc(doc(db, 'users', user.uid, col, id), {
      ...data,
      updatedAt: serverTimestamp(),
    })

  const deleteDocument = (id) =>
    deleteDoc(doc(db, 'users', user.uid, col, id))

  return { addDocument, updateDocument, deleteDocument }
}
