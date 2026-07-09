'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SparringShell from '../SparringShell'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

export default function SparringLoginPage() {
  const router = useRouter()

  const [email,     setEmail]     = useState('')
  const [otpSent,   setOtpSent]   = useState(false)
  const [otp,       setOtp]       = useState('')
  const [sending,   setSending]   = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [emailErr,  setEmailErr]  = useState('')
  const [otpErr,    setOtpErr]    = useState('')

  async function sendOtp() {
    setEmailErr('')
    if (!email.trim() || !email.includes('@')) { setEmailErr('Enter a valid email address'); return }
    setSending(true)
    try {
      const res  = await fetch('/api/sparring/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailErr(data.error ?? 'Failed to send code'); return }
      setOtpSent(true)
    } catch { setEmailErr('Network error. Try again.') }
    finally { setSending(false) }
  }

  async function verify() {
    setOtpErr('')
    if (otp.length < 6) { setOtpErr('Enter the 6-digit code'); return }
    setVerifying(true)
    try {
      const vRes  = await fetch('/api/sparring/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      })
      const vData = await vRes.json()
      if (!vData.verified) { setOtpErr(vData.error ?? 'Invalid code. Try again.'); return }

      const em   = email.trim().toLowerCase()
      const pRes = await fetch(`${BACKEND}/sparring/profiles/by-email?email=${encodeURIComponent(em)}`)

      if (pRes.ok) {
        const profile = await pRes.json()
        localStorage.setItem('sparring_profile_id', profile.id)
        localStorage.setItem('sparring_email',      em)
        router.push('/sparring/my-requests')
      } else {
        router.push('/sparring/create?from=login')
      }
    } catch { setOtpErr('Network error. Try again.') }
    finally { setVerifying(false) }
  }

  const inputBase: React.CSSProperties = {
    background: 'var(--sr-input)', border: '1px solid var(--sr-border)', borderRadius: 10,
    color: 'var(--sr-text)', padding: '0 14px', height: 48, fontSize: 15, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <SparringShell>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/sparring" style={{ color: 'var(--sr-muted)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: 'var(--sr-text)', fontSize: 24, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
            Sign in to your profile
          </h1>
          <p style={{ color: 'var(--sr-muted)', fontSize: 14, margin: 0 }}>
            Enter the email you used when creating your profile
          </p>
        </div>

        {/* Email row */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={email}
              onChange={e => { setEmail(e.target.value); if (otpSent) { setOtpSent(false); setOtp('') } }}
              placeholder="you@example.com"
              type="email"
              disabled={otpSent}
              style={{ ...inputBase, flex: 1, color: otpSent ? 'var(--sr-muted)' : 'var(--sr-text)' }}
            />
            <button
              onClick={sendOtp}
              disabled={sending || !email.includes('@')}
              style={{
                padding: '0 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', height: 48,
                background: sending || !email.includes('@') ? 'var(--sr-card)' : 'var(--sr-accent)',
                color:      sending || !email.includes('@') ? 'var(--sr-muted)' : 'var(--sr-on-acc)',
              }}
            >
              {sending ? '…' : otpSent ? 'Resend' : 'Send Code'}
            </button>
          </div>
          {emailErr && <p style={{ color: 'var(--sr-dang-t)', fontSize: 12, margin: '6px 0 0' }}>{emailErr}</p>}
        </div>

        {/* OTP panel */}
        {otpSent && (
          <div style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
            <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: '0 0 14px' }}>
              Check your inbox — 6-digit code sent to <strong style={{ color: 'var(--sr-text)' }}>{email}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                style={{ ...inputBase, flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 10, height: 60 }}
              />
              <button
                onClick={verify}
                disabled={verifying || otp.length < 6}
                style={{
                  padding: '0 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: 14, height: 60,
                  background: verifying || otp.length < 6 ? 'var(--sr-card)' : 'var(--sr-accent)',
                  color:      verifying || otp.length < 6 ? 'var(--sr-muted)' : 'var(--sr-on-acc)',
                }}
              >
                {verifying ? '…' : 'Verify'}
              </button>
            </div>
            {otpErr && <p style={{ color: 'var(--sr-dang-t)', fontSize: 12, margin: '10px 0 0' }}>{otpErr}</p>}
          </div>
        )}

        <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: '20px 0 0', textAlign: 'center' }}>
          Don&apos;t have a profile?{' '}
          <Link href="/sparring/create" style={{ color: 'var(--sr-accent)', fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </div>
    </SparringShell>
  )
}
