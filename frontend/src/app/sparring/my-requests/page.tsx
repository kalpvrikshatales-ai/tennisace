'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SparringShell from '../SparringShell'

const BACKEND     = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
const PROFILE_KEY = 'sparring_profile_id'
const EMAIL_KEY   = 'sparring_email'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'var(--sr-pending)', color: 'var(--sr-pend-t)', label: 'Pending'  },
  accepted: { bg: 'var(--sr-success)', color: 'var(--sr-succ-t)', label: 'Accepted' },
  declined: { bg: 'var(--sr-danger)',  color: 'var(--sr-dang-t)', label: 'Declined' },
}

type Request = {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  requester_name?: string
  requester_city?: string
  from_phone?: string
  to_profile?: { id?: string; name?: string; city?: string; country?: string; phone?: string }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h    = Math.floor(diff / 3600000)
  if (h < 1)  return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ContactReveal({ phone, label }: { phone?: string | null; label: string }) {
  if (!phone) return null
  return (
    <div style={{ marginTop: 10, background: 'var(--sr-success)', border: '1px solid var(--sr-succ-t)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: 'var(--sr-muted)', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</p>
      <p style={{ color: 'var(--sr-succ-t)', fontSize: 15, fontWeight: 800, margin: 0 }}>{phone}</p>
    </div>
  )
}

function ReceivedCard({ req, onAccept, onDecline, acting }: {
  req: Request; onAccept: (id: string) => void; onDecline: (id: string) => void; acting: string | null
}) {
  const s        = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending
  const isActing = acting === req.id
  return (
    <div style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{req.requester_name}</p>
          <p style={{ color: 'var(--sr-muted)', fontSize: 12, margin: 0 }}>{req.requester_city} · {timeAgo(req.created_at)}</p>
        </div>
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>
          {s.label}
        </span>
      </div>
      {req.status === 'accepted' && <ContactReveal phone={req.from_phone} label="Their number" />}
      {req.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => onDecline(req.id)} disabled={!!acting}
            style={{ flex: 1, background: 'var(--sr-card-2)', border: '1px solid var(--sr-border)', borderRadius: 8, color: 'var(--sr-text-2)', fontWeight: 700, fontSize: 13, padding: '10px', cursor: acting ? 'not-allowed' : 'pointer', minHeight: 44 }}>
            Decline
          </button>
          <button onClick={() => onAccept(req.id)} disabled={!!acting}
            style={{ flex: 2, background: isActing ? 'var(--sr-card)' : 'var(--sr-accent)', border: 'none', borderRadius: 8, color: isActing ? 'var(--sr-muted)' : 'var(--sr-on-acc)', fontWeight: 800, fontSize: 13, padding: '10px', cursor: acting ? 'not-allowed' : 'pointer', minHeight: 44 }}>
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
    <div style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{p?.name ?? '—'}</p>
          <p style={{ color: 'var(--sr-muted)', fontSize: 12, margin: 0 }}>{p?.city}{p?.country ? `, ${p.country}` : ''} · {timeAgo(req.created_at)}</p>
        </div>
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>
          {s.label}
        </span>
      </div>
      {req.status === 'accepted' && <ContactReveal phone={p?.phone} label="Their number" />}
    </div>
  )
}

export default function MyRequestsPage() {
  const router = useRouter()
  const [email,            setEmail]            = useState<string | null>(null)
  const [received,         setReceived]         = useState<Request[]>([])
  const [sent,             setSent]             = useState<Request[]>([])
  const [loading,          setLoading]          = useState(true)
  const [acting,           setActing]           = useState<string | null>(null)
  const [fetchError,       setFetchError]       = useState('')
  const [showSignOutModal, setShowSignOutModal] = useState(false)

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

  useEffect(() => {
    const profileId = localStorage.getItem(PROFILE_KEY)
    const em        = localStorage.getItem(EMAIL_KEY)
    if (!profileId || !em) {
      router.replace('/sparring/create?from=requests')
      return
    }
    setEmail(em)
    loadRequests(em)
  }, [router, loadRequests])

  function confirmSignOut() {
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(EMAIL_KEY)
    router.push('/sparring')
  }

  async function handleAccept(requestId: string) {
    setActing(requestId)
    try {
      const res = await fetch(`${BACKEND}/sparring/requests/${requestId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setReceived(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted', from_phone: updated.from_phone ?? r.from_phone } : r))
    } catch {} finally { setActing(null) }
  }

  async function handleDecline(requestId: string) {
    setActing(requestId)
    try {
      const res = await fetch(`${BACKEND}/sparring/requests/${requestId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      })
      if (res.ok) setReceived(prev => prev.map(r => r.id === requestId ? { ...r, status: 'declined' } : r))
    } finally { setActing(null) }
  }

  if (loading) {
    return (
      <SparringShell>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--sr-border)', borderTopColor: 'var(--sr-accent)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </SparringShell>
    )
  }

  return (
    <SparringShell>
      <div className="sr-page">
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--sr-border)', padding: '16px 16px' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: 'var(--sr-text)', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>My Requests</h1>
              <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: '2px 0 0' }}>Accept requests to reveal contact numbers</p>
            </div>
            <Link href="/sparring" className="hidden md:block" style={{ color: 'var(--sr-muted)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
          </div>
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px' }}>
          {fetchError && <p style={{ color: 'var(--sr-dang-t)', fontSize: 13, textAlign: 'center' }}>{fetchError}</p>}

          {/* Signed in as */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: 0 }}>
              Signed in as <span style={{ color: 'var(--sr-text)', fontWeight: 700 }}>{email}</span>
            </p>
            <button onClick={() => setShowSignOutModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--sr-muted)', fontSize: 12, cursor: 'pointer' }}>
              Sign out
            </button>
          </div>

          {/* Sign-out modal */}
          {showSignOutModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
              <div style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 14, padding: 24, maxWidth: 340, width: '100%' }}>
                <p style={{ color: 'var(--sr-text)', fontWeight: 900, fontSize: 18, margin: '0 0 8px' }}>Sign out?</p>
                <p style={{ color: 'var(--sr-muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
                  You can sign back in with your email anytime.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowSignOutModal(false)}
                    style={{ flex: 1, background: 'var(--sr-card-2)', border: '1px solid var(--sr-border)', borderRadius: 8, color: 'var(--sr-text-2)', fontWeight: 700, fontSize: 14, padding: '12px', cursor: 'pointer', minHeight: 44 }}>
                    Cancel
                  </button>
                  <button onClick={confirmSignOut}
                    style={{ flex: 1, background: 'var(--sr-border)', border: 'none', borderRadius: 8, color: 'var(--sr-text)', fontWeight: 800, fontSize: 14, padding: '12px', cursor: 'pointer', minHeight: 44 }}>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Received */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: 'var(--sr-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Requests received ({received.length})
            </p>
            {received.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <p style={{ fontSize: 36, margin: '0 0 10px' }}>📬</p>
                  <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 15, margin: '0 0 6px' }}>No requests yet</p>
                  <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                    When someone wants to hit with you, they'll show up here.
                  </p>
                </div>
              )
              : received.map(req => (
                  <ReceivedCard key={req.id} req={req} onAccept={handleAccept} onDecline={handleDecline} acting={acting} />
                ))}
          </div>

          {/* Sent */}
          <div>
            <p style={{ color: 'var(--sr-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Requests sent ({sent.length})
            </p>
            {sent.length === 0
              ? <p style={{ color: 'var(--sr-muted)', fontSize: 14 }}>No requests sent yet.{' '}
                  <Link href="/sparring" style={{ color: 'var(--sr-accent)', fontWeight: 700 }}>Find a partner →</Link>
                </p>
              : sent.map(req => <SentCard key={req.id} req={req} />)}
          </div>
        </div>
      </div>
    </SparringShell>
  )
}
