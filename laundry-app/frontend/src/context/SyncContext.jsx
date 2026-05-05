import { createContext, useState, useEffect, useCallback } from 'react'

export const SyncContext = createContext(null)

const TOKEN_KEY = 'laundry_token'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const HEALTH_CHECK_MS = 20000

export function SyncProvider({ children }) {
  const [syncStatus, setSyncStatus] = useState('offline')
  const [lastSynced, setLastSynced] = useState(null)

  const checkConnection = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || !navigator.onLine) {
      setSyncStatus('offline')
      return
    }

    setSyncStatus('syncing')

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else if (res.status === 401 || res.status === 403) {
        setSyncStatus('error')
      } else {
        setSyncStatus('offline')
      }
    } catch {
      setSyncStatus('offline')
    }
  }, [])

  const triggerSync = useCallback(() => {
    checkConnection()
  }, [checkConnection])

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      checkConnection()
    }, 0)
    const onOnline = () => checkConnection()
    const onOffline = () => setSyncStatus('offline')
    const interval = setInterval(checkConnection, HEALTH_CHECK_MS)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      clearTimeout(bootTimer)
      clearInterval(interval)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [checkConnection])

  return (
    <SyncContext.Provider value={{ syncStatus, lastSynced, triggerSync }}>
      {children}
    </SyncContext.Provider>
  )
}
