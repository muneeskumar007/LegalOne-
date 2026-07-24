
// Authcontext.jsx


import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const TOKEN_KEY    = 'legalone_token'
const ADVOCATE_KEY = 'legalone_advocate'

// Axios instance with auth header injection
const authApi = axios.create({ baseURL: '/api', timeout: 30000 })

authApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function AuthProvider({ children }) {
  const [advocate, setAdvocate] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADVOCATE_KEY)) } catch { return null }
  })
  const [token, setToken]       = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Verify token on mount
  useEffect(() => {
    if (token) {
      authApi.get('/auth/me')
        .then(r => { setAdvocate(r.data.advocate) })
        .catch(() => { logout() })
    }
  }, [])

  const _save = (tok, adv) => {
    localStorage.setItem(TOKEN_KEY,    tok)
    localStorage.setItem(ADVOCATE_KEY, JSON.stringify(adv))
    setToken(tok)
    setAdvocate(adv)
    authApi.defaults.headers.common.Authorization = `Bearer ${tok}`
  }

  const login = useCallback(async (email, password) => {
    setLoading(true); setError('')
    try {
      const { data } = await authApi.post('/auth/login', { email, password })
      _save(data.access_token, data.advocate)
      return { success: true, message: data.message }
    } catch(e) {
      const isNetwork = !e.response
      const msg = isNetwork
        ? 'Cannot connect to server. Please ensure the backend is running.'
        : (e.response?.data?.detail || 'Invalid email or password')
      setError(msg)
      return { success: false, message: msg }
    } finally { setLoading(false) }
  }, [])

  const signup = useCallback(async (fields) => {
    setLoading(true); setError('')
    try {
      const { data } = await authApi.post('/auth/signup', fields)
      _save(data.access_token, data.advocate)
      return { success: true, message: data.message }
    } catch(e) {
      const isNetwork = !e.response
      const msg = isNetwork
        ? 'Cannot connect to server. Please ensure the backend is running.'
        : (e.response?.data?.detail || e.response?.data?.message || 'Registration failed. Try a different email.')
      setError(msg)
      return { success: false, message: msg }
    } finally { setLoading(false) }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADVOCATE_KEY)
    delete authApi.defaults.headers.common.Authorization
    setToken(null)
    setAdvocate(null)
  }, [])

  const updateProfile = useCallback(async (fields) => {
    const { data } = await authApi.put('/auth/profile', fields)
    setAdvocate(data.advocate)
    localStorage.setItem(ADVOCATE_KEY, JSON.stringify(data.advocate))
    return data
  }, [])

  return (
    <AuthContext.Provider value={{
      advocate, token, loading, error,
      isLoggedIn: !!advocate,
      login, signup, logout, updateProfile,
      clearError: () => setError(''),
      authApi,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Export authApi for use in other hooks
export { authApi }
