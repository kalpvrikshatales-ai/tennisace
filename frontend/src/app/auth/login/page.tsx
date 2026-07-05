'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) { setError(err.message); setBusy(false) }
  }

  async function sendCode() {
    if (!supabase) return
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email'); return }
    setBusy(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setBusy(false)
    if (err) setError(err.message)
    else setOtpSent(true)
  }

  async function verifyCode() {
    if (!supabase) return
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setBusy(true); setError('')
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'email',
    })
    setBusy(false)
    if (err) setError(err.message)
    else router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#111', border: '1px solid #222', borderRadius: 10,
    color: '#fff', padding: '14px', fontSize: 15, outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <img src="/logo.png" alt="TennisAce"
          style={{ width: 60, height: 60, borderRadius: 16, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: -0.5, margin: 0 }}>TennisAce</p>
        <p style={{ color: '#555', fontSize: 14, margin: '4px 0 0' }}>Sign in to continue</p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Google */}
        <button onClick={signInWithGoogle} disabled={busy} style={{
          width: '100%', padding: '14px', borderRadius: 10,
          border: '1px solid #2a2a2a', background: '#111', color: '#fff',
          fontWeight: 700, fontSize: 15, cursor: busy ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          marginBottom: 20, opacity: busy ? 0.6 : 1,
        }}>
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
          <span style={{ color: '#444', fontSize: 12, fontWeight: 600 }}>or use email</span>
          <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
        </div>

        {!otpSent ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && sendCode()}
                style={inputStyle}
              />
            </div>
            <button onClick={sendCode} disabled={busy} style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: '#00C875', color: '#000', fontWeight: 800, fontSize: 15,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
            }}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#777', fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
              Code sent to <span style={{ color: '#fff', fontWeight: 700 }}>{email}</span>
            </p>
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={e => e.key === 'Enter' && verifyCode()}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 26, letterSpacing: 10, fontWeight: 900 }}
              />
            </div>
            <button onClick={verifyCode} disabled={busy} style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: '#00C875', color: '#000', fontWeight: 800, fontSize: 15,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
              marginBottom: 10,
            }}>
              {busy ? 'Verifying…' : 'Sign in'}
            </button>
            <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }} style={{
              width: '100%', padding: '10px', background: 'none', border: 'none',
              color: '#555', fontSize: 13, cursor: 'pointer',
            }}>
              ← Change email
            </button>
          </>
        )}

        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 14 }}>{error}</p>
        )}
      </div>
    </div>
  )
}
