import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface AuthProps {
  onBack: () => void
}

export function Auth({ onBack }: AuthProps) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const inp = {
    width: '100%', background: 'var(--card)', border: '1px solid var(--border2)',
    color: 'var(--text)', padding: '13px 14px', borderRadius: 10,
    fontSize: 14, outline: 'none'
  }

  const handleSubmit = async () => {
    setError(null); setSuccess(null); setLoading(true)
    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
      if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
      const { error } = await signUp(email, password, name)
      if (error) setError(error)
      else setSuccess('Account created! Check your email to confirm.')
    } else {
      const { error } = await resetPassword(email)
      if (error) setError(error)
      else setSuccess('Reset link sent! Check your email.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true); setError(null)
    const { error } = await signInWithGoogle()
    if (error) { setError(error); setLoading(false) }
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', scrollbarWidth: 'none', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px' }}>

        <button onClick={onBack} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚽</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>
            AI <span style={{ color: 'var(--green)' }}>Football</span> Hub
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your free account' : 'Reset your password'}
          </p>
        </div>

        {mode !== 'reset' && (
          <>
            <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
              {(['signin', 'signup'] as const).map(m => (
                <div key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }} style={{ flex: 1, padding: 10, textAlign: 'center', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: mode === m ? 'var(--card)' : 'transparent', color: mode === m ? 'var(--green)' : 'var(--text2)', transition: 'all 0.2s' }}>
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </div>
              ))}
            </div>

            <button onClick={handleGoogle} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: 'var(--card)', border: '1px solid var(--border2)', color: 'var(--text)', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0', color: 'var(--text3)', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />or<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13, color: 'var(--red)' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13, color: 'var(--green)' }}>
            ✅ {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Full Name</div>
              <input style={inp} type="text" placeholder="Kwame Asante" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Email Address</div>
            <input style={inp} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {mode !== 'reset' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Password</div>
              <input style={inp} type="password" placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}
        </div>

        {mode === 'signin' && (
          <div style={{ textAlign: 'right', margin: '10px 0' }}>
            <span onClick={() => { setMode('reset'); setError(null) }} style={{ fontSize: 12, color: 'var(--green)', cursor: 'pointer' }}>Forgot password?</span>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{ display: 'block', width: '100%', background: loading ? 'var(--border2)' : 'var(--green)', color: '#080b0e', border: 'none', padding: 15, borderRadius: 12, fontWeight: 900, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 16 }}>
          {loading ? '⏳ Please wait...' : mode === 'signin' ? 'Sign In →' : mode === 'signup' ? 'Create Free Account →' : 'Send Reset Link →'}
        </button>

        {mode === 'reset' && (
          <button onClick={() => setMode('signin')} style={{ display: 'block', width: '100%', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', padding: 14, borderRadius: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer', marginTop: 10 }}>
            ← Back to Sign In
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.<br />
          <span style={{ border: '1px solid var(--text3)', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>18+</span> Must be 18 or over to use this platform.
        </div>
      </div>
    </div>
  )
}
