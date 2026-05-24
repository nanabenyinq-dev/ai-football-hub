import { useAuth } from './hooks/useAuth'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { useState } from 'react'

export default function App() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16
      }}>
        <div style={{ fontSize: 40 }}>⚽</div>
        <div style={{
          width: 40, height: 4, background: 'var(--border2)',
          borderRadius: 2, overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: '60%', background: 'var(--green)',
            animation: 'shimmer 1s ease-in-out infinite'
          }} />
        </div>
      </div>
    )
  }

  if (user) return <Dashboard />
  if (showAuth) return <Auth onBack={() => setShowAuth(false)} />
  return <Landing onGetStarted={() => setShowAuth(true)} />
}
