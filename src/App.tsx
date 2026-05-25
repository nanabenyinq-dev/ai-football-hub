import { useAuth } from './hooks/useAuth'
import { usePlausible, useAdSense } from './hooks/useAnalytics'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { useState } from 'react'

export default function App() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  usePlausible()
  useAdSense()

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', gap: 16
      }}>
        <div style={{ fontSize: 40 }}>⚽</div>
        <div style={{ width: 120, height: 4, background: 'var(--card)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '60%', background: 'var(--green)', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI Football Hub</div>
      </div>
    )
  }

  if (user) return <Dashboard />
  if (showAuth) return <Auth onBack={() => setShowAuth(false)} />
  return <Landing onGetStarted={() => setShowAuth(true)} />
}
