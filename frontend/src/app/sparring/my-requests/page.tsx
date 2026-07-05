'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
const SESSION_KEY = 'sparring_verified_email'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#1a1a2a', color: '#6eb8e8', label: 'Pending'  },
  accepted: { bg: '#0a1a0a', color: '#39FF14', label: 'Accepted' },
  declined: { bg: '#1a0a0a', color: '#e87070', label: 'Declined' },
}

type Request = {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  requester_name?: string
  requester_city?: string
  from_phone?: string
  to_phone?: string
  to_profile?: { id?: string; name?: string; city?: string; country?: string; phone?: string }
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#1a1a1a', border: '1px solid #333', borderRadius: 6,
  color: '#fff', padding: '10px 12px', fontSize: 14, outline: 'none',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ContactReveal({ phone, label }: { phone?: string | null; label: string }) {
  if (!phone) return null
  return (
    <div style={{ marginTop: 10, background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ color: '#555', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</p>
      <p style={{ color: '#39FF14', fontSize: 15, fontWeight: 800, margin: 0 }}>{phone}</p>
    </div>
  )
}

function ReceivedCard({ req, onAccept, onDecline, acting }: {
  req: Request; onAccept: (id: string) => void; onDecline: (id: string) => void; acting: string | null
}) {
  const s = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending
  const isActing = acting === req.id
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{req.requester_name}</p>
          <p style={{ color: '#555', fontSize: 12, margin: 0 }}>{req.requester_city} · {timeAgo(req.created_at)}</p>
        </div>
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
          {s.label}
        </span>
      </div>
      {req.status === 'accepted' && <ContactReveal phone={req.from_phone} label="Their number" />}
      {req.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => onDecline(req.id)} disabled={!!acting}
            style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#aaa', fontWeight: 700, fontSize: 13, padding: '9px', cursor: acting ? 'not-allowed' : 'pointer' }}>
            Decline
          </button>
          <button onClick={() => onAccept(req.id)} disabled={!!acting}
            style={{ flex: 2, background: isActing ? '#333' : '#39FF14', border: 'none', borderRadius: 6, color: isActing ? '#666' : '#000', fontWeight: 800, fontSize: 13, padding: '9px', cursor: acting ? 'not-allowed' : 'pointer' }}>
            {isActing ? 'Accepting…' : 'Accept'}
          </button>
        </div>
      )}
    </div>
  )
}

function SentCard({ req }: { req: Request }) {
  const s = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending
  const p = req.to_profile
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{p?.name ?? '—'}</p>
          <p style={{ color: '#555', fontSize: 12, margin: 0 }}>{p?.city}{p?.country ? `, ${p.country}` : ''} · {timeAgo(req.created_at)}</p>
        </div>
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
          {s.label}
        </span>
      </div>
      {req.status === 'accepted' && <ContactReveal phone={p?.phone} label="Their number" />}
    </div>
  )
}

// ── OTP step ─────────────────────────────────────────────────────────────────
function OtpAuth({ onVerified }: { onVerified: (email: string) => void }) {
  const [emailInput, setEmailInput] = useState('')
  const [otpSent,    setOtpSent]    = useState(false)
  const [otp,        setOtp]        = useState('')
  const [sending,    setSending]    = useState(false)
  const [verifying,  setVerifying]  = useState(false)
  const [emailErr,   setEmailErr]   = useState('')
  const [otpErr,     setOtpErr]     = useState('')

  async function sendOtp() {
    setEmailErr('')
    if (!emailInput.includes('@')) { setEmailErr('Enter a valid email'); return }
    setSending(true)
    try {
      const res  = await fetch('/api/sparring/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput.trim().toLowerCase() }) })
      const data = await res.json()
      if (!res.ok) { setEmailErr(data.error ?? 'Failed to send code'); return }
      setOtpSent(true)
    } catch { setEmailErr('Network error. Try again.') }
    finally { setSending(false) }
  }

  async function verifyOtp() {
    setOtpErr('')
    if (otp.length < 6) { setOtpErr('Enter the 6-digit code'); return }
    setVerifying(true)
    try {
      const res  = await fetch('/api/sparring/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput.trim().toLowerCase(), otp }) })
      const data = await res.json()
      if (data.verified) {
        const em = emailInput.trim().toLowerCase()
        localStorage.setItem(SESSION_KEY, em)
        onVerified(em)
      } else { setOtpErr(data.error ?? 'Invalid code. Try again.') }
    } catch { setOtpErr('Network error.') }
    finally { setVerifying(false) }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: '0 0 4px' }}>Sign in to view your requests</p>
      <p style={{ color: '#555', fontSize: 13, margin: '0 0 20px' }}>Enter the email you used when creating your profile</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input value={emailInput} onChange={e => { setEmailInput(e.target.value); setOtpSent(false); setOtp('') }}
          placeholder="you@example.com" type="email"
          disabled={otpSent}
          style={{ ...inputStyle, flex: 1, color: otpSent ? '#555' : '#fff' }} />
        <button onClick={sendOtp} disabled={sending || !emailInput.includes('@')}
          style={{ padding: '0 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
            background: sending || !emailInput.includes('@') ? '#222' : '#39FF14',
            color: sending || !emailInput.includes('@') ? '#555' : '#000' }}>
          {sending ? '…' : otpSent ? 'Resend' : 'Send Code'}
        </button>
      </div>
      {emailErr && <p style={{ color: '#e87070', fontSize: 12, margin: '0 0 8px' }}>{emailErr}</p>}

      {otpSent && (
        <div style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 8, padding: 16, marginTop: 12 }}>
          <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 10px' }}>Check your inbox — enter the 6-digit code sent to {emailInput}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" inputMode="numeric" maxLength={6}
              style={{ ...inputStyle, flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 900, letterSpacing: 8 }} />
            <button onClick={verifyOtp} disabled={verifying || otp.length < 6}
              style={{ padding: '0 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
                background: verifying || otp.length < 6 ? '#222' : '#39FF14',
                color: verifying || otp.length < 6 ? '#555' : '#000' }}>
              {verifying ? '…' : 'Verify'}
            </button>
          </div>
          {otpErr && <p style={{ color: '#e87070', fontSize: 12, margin: '8px 0 0' }}>{otpErr}</p>}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyRequestsPage() {
  const [email,      setEmail]      = useState<string | null>(null)
  const [received,   setReceived]   = useState<Request[]>([])
  const [sent,       setSent]       = useState<Request[]>([])
  const [loading,    setLoading]    = useState(false)
  const [acting,     setActing]     = useState<string | null>(null)
  const [fetchError, setFetchError] = useState('')

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) { setEmail(saved); loadRequests(saved) }
  }, [])

  const loadRequests = useCallback(async (em: string) => {
    setLoading(true); setFetchError('')
    try {
      const [recRes, sentRes] = await Promise.all([
        fetch(`${BACKEND}/sparring/requests/received?email=${encodeURIComponent(em)}`),
        fetch(`${BACKEND}/sparring/requests/sent?email=${encodeURIComponent(em)}`),
      ])
      setReceived(recRes.ok  ? (await recRes.json()).requests  ?? [] : [])
      setSent(    sentRes.ok ? (await sentRes.json()).requests ?? [] : [])
    } catch { setFetchError('Could not load requests. Try again.') }
    finally { setLoading(false) }
  }, [])

  function handleVerified(em: string) { setEmail(em); loadRequests(em) }

  function signOut() { localStorage.removeItem(SESSION_KEY); setEmail(null); setReceived([]); setSent([]) }

  async function handleAccept(requestId: string) {
    setActing(requestId)
    try {
      const res = await fetch(`${BACKEND}/sparring/requests/${requestId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' }) })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setReceived(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted', from_phone: updated.from_phone ?? r.from_phone } : r))
    } catch {} finally { setActing(null) }
  }

  async function handleDecline(requestId: string) {
    setActing(requestId)
    try {
      const res = await fetch(`${BACKEND}/sparring/requests/${requestId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'declined' }) })
      if (res.ok) setReceived(prev => prev.map(r => r.id === requestId ? { ...r, status: 'declined' } : r))
    } finally { setActing(null) }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 16px 16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>My Requests</h1>
            <p style={{ color: '#555', fontSize: 13, margin: '2px 0 0' }}>Accept requests to reveal contact numbers</p>
          </div>
          <Link href="/sparring" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px' }}>
        {!email ? (
          <OtpAuth onVerified={handleVerified} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
              Signed in as <span style={{ color: '#fff', fontWeight: 700 }}>{email}</span>
            </p>
            <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        )}

        {loading && <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Loading…</p>}
        {fetchError && <p style={{ color: '#e87070', fontSize: 13, textAlign: 'center' }}>{fetchError}</p>}

        {email && !loading && (
          <>
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: '#aaa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
                Requests received ({received.length})
              </p>
              {received.length === 0
                ? <p style={{ color: '#444', fontSize: 14 }}>No requests received yet.</p>
                : received.map(req => <ReceivedCard key={req.id} req={req} onAccept={handleAccept} onDecline={handleDecline} acting={acting} />)}
            </div>
            <div>
              <p style={{ color: '#aaa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
                Requests sent ({sent.length})
              </p>
              {sent.length === 0
                ? <p style={{ color: '#444', fontSize: 14 }}>No requests sent yet.{' '}<Link href="/sparring" style={{ color: '#39FF14' }}>Find a partner →</Link></p>
                : sent.map(req => <SentCard key={req.id} req={req} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
