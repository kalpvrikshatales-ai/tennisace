'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0f1520', border: '1px solid #333', borderRadius: 6,
  color: '#fff', padding: '12px 14px', fontSize: 15, outline: 'none',
}

export default function SparringLoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [otpSent,  setOtpSent]  = useState(false)
  const [otp,      setOtp]      = useState('')
  const [sending,  setSending]  = useState(false)
  const [verifying,setVerifying]= useState(false)
  const [emailErr, setEmailErr] = useState('')
  const [otpErr,   setOtpErr]   = useState('')

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
      // Step 1 — verify OTP
      const vRes  = await fetch('/api/sparring/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      })
      const vData = await vRes.json()
      if (!vData.verified) { setOtpErr(vData.error ?? 'Invalid code. Try again.'); return }

      // Step 2 — look up profile by email
      const em   = email.trim().toLowerCase()
      const pRes = await fetch(`${BACKEND}/sparring/profiles/by-email?email=${encodeURIComponent(em)}`)

      if (pRes.ok) {
        const profile = await pRes.json()
        localStorage.setItem('sparring_profile_id', profile.id)
        localStorage.setItem('sparring_email',      em)
        router.push('/sparring/my-requests')
      } else {
        // No profile found — send them to create with a prompt
        router.push('/sparring/create?from=login')
      }
    } catch { setOtpErr('Network error. Try again.') }
    finally { setVerifying(false) }
  }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <div style={{ padding: '12px 16px' }}>
        <Link href="/sparring" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
      </div>

      <div style={{ maxWidth: 400, margin: '40px auto', padding: '0 16px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
            Sign in to your profile
          </h1>
          <p style={{ color: '#555', fontSize: 14, margin: 0 }}>
            Enter the email you used when creating your profile
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={email}
              onChange={e => { setEmail(e.target.value); if (otpSent) { setOtpSent(false); setOtp('') } }}
              placeholder="you@example.com"
              type="email"
              disabled={otpSent}
              style={{ ...inputStyle, flex: 1, color: otpSent ? '#555' : '#fff', borderColor: otpSent ? '#1a2535' : '#333' }}
            />
            <button
              onClick={sendOtp}
              disabled={sending || !email.includes('@')}
              style={{
                padding: '0 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
                background: sending || !email.includes('@') ? '#1a1a1a' : '#39FF14',
                color:      sending || !email.includes('@') ? '#444'    : '#0a0f1a',
              }}
            >
              {sending ? '…' : otpSent ? 'Resend' : 'Send Code'}
            </button>
          </div>
          {emailErr && <p style={{ color: '#e87070', fontSize: 12, margin: '6px 0 0' }}>{emailErr}</p>}
        </div>

        {/* OTP */}
        {otpSent && (
          <div style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: 20, marginBottom: 12 }}>
            <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 14px' }}>
              Check your inbox — 6-digit code sent to <strong style={{ color: '#fff' }}>{email}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                style={{ ...inputStyle, flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 10, padding: '12px 8px' }}
              />
              <button
                onClick={verify}
                disabled={verifying || otp.length < 6}
                style={{
                  padding: '0 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: 14,
                  background: verifying || otp.length < 6 ? '#1a1a1a' : '#39FF14',
                  color:      verifying || otp.length < 6 ? '#444'    : '#0a0f1a',
                }}
              >
                {verifying ? '…' : 'Verify'}
              </button>
            </div>
            {otpErr && <p style={{ color: '#e87070', fontSize: 12, margin: '10px 0 0' }}>{otpErr}</p>}
          </div>
        )}

        <p style={{ color: '#444', fontSize: 13, margin: '20px 0 0', textAlign: 'center' }}>
          Don&apos;t have a profile?{' '}
          <Link href="/sparring/create" style={{ color: '#39FF14', fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
