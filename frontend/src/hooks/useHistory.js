import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useHistory(module) {
  const { isLoggedIn, authApi } = useAuth()
  const [saving, setSaving] = useState(false)
  const [items,  setItems]  = useState([])
  const [loading, setLoading] = useState(false)

  const save = useCallback(async (payload) => {
    if (!isLoggedIn) return null
    setSaving(true)
    try {
      const { data } = await authApi.post('/history', { module, ...payload })
      return data.history
    } catch(e) {
      console.error('[History] save failed:', e.response?.data || e.message)
      return null
    } finally { setSaving(false) }
  }, [isLoggedIn, module, authApi])

  const load = useCallback(async (filters = {}) => {
    if (!isLoggedIn) return []
    setLoading(true)
    try {
      const params = { module, ...filters }
      const { data } = await authApi.get('/history', { params })
      setItems(data.items || [])
      return data.items || []
    } catch(e) {
      console.error('[History] load failed:', e)
      return []
    } finally { setLoading(false) }
  }, [isLoggedIn, module, authApi])

  const remove = useCallback(async (id) => {
    if (!isLoggedIn) return
    await authApi.delete(`/history/${id}`)
    setItems(prev => prev.filter(i => i.id !== id))
  }, [isLoggedIn, authApi])

  const toggleStar = useCallback(async (id, current) => {
    if (!isLoggedIn) return
    const { data } = await authApi.put(`/history/${id}`, { is_starred: !current })
    setItems(prev => prev.map(i => i.id === id ? data.history : i))
  }, [isLoggedIn, authApi])

  const updateNotes = useCallback(async (id, notes) => {
    if (!isLoggedIn) return
    await authApi.put(`/history/${id}`, { notes })
  }, [isLoggedIn, authApi])

  return { save, load, remove, toggleStar, updateNotes, saving, items, loading }
}
