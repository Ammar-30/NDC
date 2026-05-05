import { createContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)
const TOKEN_KEY = 'laundry_token'

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const decoded = JSON.parse(atob(padded))
    return decoded
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      const payload = decodeJWT(token)
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        setUser({
          id: payload.userId,
          name: payload.name,
          role: payload.role,
          branchId: payload.branchId,
          ownerId: payload.ownerId,
        })
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    let res
    let data
    try {
      res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      data = await res.json().catch(() => ({}))
    } catch {
      throw new Error('Network error — check your connection')
    }

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      toast.error('Invalid email or password')
      throw new Error(data.error || 'Invalid credentials')
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Login failed')
    }

    const token = data.token
    localStorage.setItem(TOKEN_KEY, token)
    const payload = decodeJWT(token)
    if (!payload) {
      localStorage.removeItem(TOKEN_KEY)
      throw new Error('Invalid token received from server')
    }
    const u = {
      id: payload.userId,
      name: payload.name,
      role: payload.role,
      branchId: payload.branchId,
      ownerId: payload.ownerId,
    }
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.location.assign('/login')
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
