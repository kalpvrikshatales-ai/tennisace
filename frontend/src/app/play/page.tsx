'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import SparringShell from '@/app/sparring/SparringShell'
import CityPicker from '@/components/CityPicker'
import BackButton from '@/components/BackButton'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const TIME_SLOTS   = ['Morning', 'Afternoon', 'Evening', 'Any time']
const FORMATS      = ['singles', 'doubles', 'hitting', 'coaching'] as const
const FORMAT_LABEL = { singles: 'Singles', doubles: 'Doubles', hitting: 'Hitting', coaching: 'Coaching' }
const LEVELS       = ['beginner', 'intermediate', 'advanced', 'competitive']
const SURFACES     = ['clay', 'hard', 'grass', 'indoor']

type PlayRequest = {
  id:             string
  city:           string
  country:        string
  date:           string
  time_slot:      string
  players_needed: number
  level?:         string
  surface?:       string
  format?:        string
  location_name?: string
  notes?:         string
  status:         string
  join_count:     number
  spots_left:     number
  creator: {
    id?:              string
    name?:            string
    photo_url?:       string
    founding_number?: number
  }
}

function fmtDate(iso: string): { day: string; date: string } {
  try {
    const d = new Date(iso + 'T12:00:00Z')
    return {
      day:  d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase(),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    }
  } catch { return { day: '', date: iso } }
}

function Chip({ label, color = 'rgba(255,255,255,0.4)' }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 6,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      color, fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
    }}>{label}</span>
  )
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

// ── Log Match modal ───────────────────────────────────────────────────────────
function LogMatchModal({
  myProfileId,
  opponentId,
  opponentName,
  playRequestId,
  onClose,
}: {
  myProfileId:   string
  opponentId:    string | null
  opponentName:  string | null
  playRequestId: string
  onClose:       () => void
}) {
  const [oppId,   setOppId]   = useState(opponentId ?? '')
  const [winner,  setWinner]  = useState<'me'|'them'|'draw'>('me')
  const [score,   setScore]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const inp: React.CSSProperties = {
    width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.06)',
    border:'1px solid rgba(255,255,255,0.12)', borderRadius:8,
    color:'#fff', fontSize:14, padding:'11px 13px', outline:'none', fontFamily:'inherit',
  }

  async function submit() {
    const oid = oppId.trim()
    if (!oid) { setError('Enter your opponent\'s profile ID'); return }
    if (oid === myProfileId) { setError('Opponent must be different from you'); return }
    setSaving(true); setError('')
    try {
      const winnerVal = winner === 'me' ? myProfileId : winner === 'them' ? oid : 'draw'
      const res = await fetch(`${BACKEND_URL}/match-history`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          player1_profile_id: myProfileId,
          player2_profile_id: oid,
          winner_profile_id:  winnerVal,
          score:              score.trim() || undefined,
          notes:              notes.trim() || undefined,
          play_request_id:    playRequestId,
          format:             'singles',
          played_at:          new Date().toISOString().split('T')[0],
        }),
      })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.detail || 'Failed to log') }
      setSaved(true)
    } catch (e: any) { setError(e.message ?? 'Something went wrong') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, padding:16, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#0f1520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, maxWidth:400, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
        {saved ? (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <p style={{ fontSize:36, margin:'0 0 12px' }}>✅</p>
            <p style={{ color:'#fff', fontWeight:900, fontSize:18, margin:'0 0 8px' }}>Match logged!</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:'0 0 24px' }}>Result saved to your match history.</p>
            <button onClick={onClose} style={{ background:'#39FF14', border:'none', borderRadius:10, color:'#000', fontWeight:800, fontSize:14, padding:'12px 28px', cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <p style={{ color:'#fff', fontWeight:900, fontSize:16, margin:0 }}>Log the result</p>
              <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:22, cursor:'pointer', lineHeight:1, padding:'0 2px' }}>×</button>
            </div>

            {error && <p style={{ color:'#f87171', fontSize:13, margin:'0 0 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'8px 12px' }}>{error}</p>}

            {!opponentId && (
              <div style={{ marginBottom:16 }}>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, margin:'0 0 6px' }}>Opponent profile ID</p>
                <input value={oppId} onChange={e => setOppId(e.target.value)} style={inp} placeholder="Paste opponent's profile ID or URL" />
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:'5px 0 0' }}>Find it in their profile URL: tennisace.live/sparring/[id]</p>
              </div>
            )}

            {opponentId && opponentName && (
              <div style={{ background:'rgba(57,255,20,0.06)', border:'1px solid rgba(57,255,20,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(57,255,20,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#39FF14', flexShrink:0 }}>
                  {opponentName[0].toUpperCase()}
                </div>
                <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:0 }}>vs {opponentName}</p>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, margin:'0 0 8px' }}>Who won?</p>
              <div style={{ display:'flex', gap:8 }}>
                {(['me','them','draw'] as const).map(opt => (
                  <button key={opt} onClick={() => setWinner(opt)}
                    style={{ flex:1, background:winner===opt ? '#39FF14' : 'rgba(255,255,255,0.06)', border:`1px solid ${winner===opt ? '#39FF14' : 'rgba(255,255,255,0.12)'}`, borderRadius:8, color:winner===opt ? '#000' : 'rgba(255,255,255,0.6)', fontWeight:700, fontSize:13, padding:'10px 8px', cursor:'pointer', textTransform:'capitalize' }}>
                    {opt === 'me' ? 'You' : opt === 'them' ? (opponentName ?? 'Them') : 'Draw'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, margin:'0 0 6px' }}>Score (optional)</p>
              <input value={score} onChange={e => setScore(e.target.value)} style={inp} placeholder="e.g. 6-3, 6-4" />
            </div>

            <div style={{ marginBottom:24 }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, margin:'0 0 6px' }}>Notes (optional)</p>
              <input value={notes} onChange={e => setNotes(e.target.value)} style={inp} placeholder="Surface, highlights…" />
            </div>

            <button onClick={submit} disabled={saving}
              style={{ width:'100%', background:saving ? 'rgba(57,255,20,0.4)' : '#39FF14', border:'none', borderRadius:10, color:saving ? '#39FF14' : '#000', fontWeight:800, fontSize:15, padding:'14px', cursor:saving ? 'not-allowed' : 'pointer', minHeight:48, transition:'background 0.15s' }}>
              {saving ? 'Saving…' : 'Log Result'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function RequestCard({
  req,
  ownProfileId,
  onJoin,
  onCancel,
}: {
  req: PlayRequest
  ownProfileId: string | null
  onJoin: (id: string) => Promise<{ creator_phone?: string } | null>
  onCancel: (id: string) => Promise<void>
}) {
  const [joining,   setJoining]   = useState(false)
  const [joined,    setJoined]    = useState(false)
  const [creatorPh, setCreatorPh] = useState<string | null>(null)
  const [error,     setError]     = useState('')
  const [showLog,   setShowLog]   = useState(false)

  const { day, date: dLabel } = fmtDate(req.date)
  const isOwn   = ownProfileId && req.creator?.id === ownProfileId
  const isFull  = req.spots_left <= 0
  const expired = req.status !== 'open' || isFull

  async function handleJoin() {
    if (!ownProfileId) { window.location.href = '/sparring/create'; return }
    setJoining(true); setError('')
    const res = await onJoin(req.id)
    setJoining(false)
    if (res) {
      setJoined(true)
      if (res.creator_phone) setCreatorPh(res.creator_phone)
    } else {
      setError('Could not join — try again')
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${joined ? 'rgba(57,255,20,0.4)' : expired ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 14, padding: '20px 18px',
      opacity: expired && !joined ? 0.6 : 1,
      transition: 'border-color 0.2s',
    }}>

      {/* Date + time hero */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: '#39FF14', fontSize: 12, fontWeight: 900, letterSpacing: 1.5 }}>{day}</span>
          <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{dLabel}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>· {req.time_slot}</span>
        </div>
        {req.location_name && (
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: '4px 0 0' }}>
            📍 {req.location_name}
          </p>
        )}
      </div>

      {/* Creator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: req.creator.photo_url
            ? `url(${req.creator.photo_url}) center/cover no-repeat`
            : 'rgba(57,255,20,0.15)',
          border: '1.5px solid rgba(57,255,20,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: '#39FF14', overflow: 'hidden',
        }}>
          {!req.creator.photo_url && (req.creator.name ?? '?')[0].toUpperCase()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{req.creator.name ?? 'Unknown'}</span>
          {req.creator.founding_number && (
            <span
              title={`Founding Member #${req.creator.founding_number}`}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 22, flexShrink: 0,
                clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                background: 'rgba(57,255,20,0.1)', border: '1px solid #39FF14',
                color: '#39FF14', fontSize: 6, fontWeight: 900,
              }}>
              #{req.creator.founding_number}
            </span>
          )}
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        {req.format  && <Chip label={FORMAT_LABEL[req.format as keyof typeof FORMAT_LABEL] ?? req.format} color='rgba(57,255,20,0.7)' />}
        {req.level   && <Chip label={req.level} />}
        {req.surface && <Chip label={req.surface} />}
      </div>

      {req.notes && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 14px', lineHeight: 1.5, fontStyle: 'italic' }}>
          "{req.notes}"
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{
          color: isFull ? 'rgba(255,80,80,0.7)' : '#39FF14',
          fontSize: 12, fontWeight: 800,
        }}>
          {isFull ? 'Full' : `${req.spots_left} spot${req.spots_left !== 1 ? 's' : ''} left`}
        </span>

        {joined ? (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#39FF14', fontSize: 12, fontWeight: 800 }}>Joined ✓</span>
            {creatorPh && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '3px 0 0' }}>
                Contact: <strong style={{ color: '#fff' }}>{creatorPh}</strong>
              </p>
            )}
          </div>
        ) : isOwn ? (
          <button
            onClick={() => onCancel(req.id)}
            style={{
              background: 'transparent', border: '1px solid rgba(255,80,80,0.3)',
              color: 'rgba(255,80,80,0.7)', fontWeight: 700, fontSize: 12,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            }}>
            Cancel
          </button>
        ) : expired ? (
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 600 }}>Closed</span>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{
              background: joining ? 'rgba(57,255,20,0.4)' : '#39FF14',
              color: '#000', fontWeight: 900, fontSize: 13,
              padding: '9px 20px', borderRadius: 9, border: 'none',
              cursor: joining ? 'default' : 'pointer',
              boxShadow: '0 0 12px rgba(57,255,20,0.25)',
              transition: 'background 0.15s',
            }}>
            {joining ? '…' : 'Join →'}
          </button>
        )}
      </div>
      {error && <p style={{ color: 'rgba(255,80,80,0.8)', fontSize: 11, margin: '8px 0 0' }}>{error}</p>}

      {/* Log result — visible on own card or after joining */}
      {ownProfileId && (isOwn || joined) && (
        <button onClick={() => setShowLog(true)}
          style={{ marginTop:10, background:'none', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:12, fontWeight:700, padding:'7px 14px', cursor:'pointer', width:'100%' }}>
          Log the result →
        </button>
      )}

      {showLog && ownProfileId && (
        <LogMatchModal
          myProfileId={ownProfileId}
          opponentId={joined && req.creator?.id ? req.creator.id : null}
          opponentName={joined && req.creator?.name ? req.creator.name : null}
          playRequestId={req.id}
          onClose={() => setShowLog(false)}
        />
      )}
    </div>
  )
}

const TODAY = new Date().toISOString().split('T')[0]

export default function PlayPage() {
  const [requests,      setRequests]      = useState<PlayRequest[]>([])
  const [loading,       setLoading]       = useState(true)
  const [ownProfileId,  setOwnProfileId]  = useState<string | null>(null)
  const [ownCity,       setOwnCity]       = useState('')
  const [ownCountry,    setOwnCountry]    = useState('')
  const [showForm,      setShowForm]      = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [submitOk,      setSubmitOk]      = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // Form state
  const [fDate,     setFDate]     = useState(TODAY)
  const [fSlot,     setFSlot]     = useState('Morning')
  const [fNeeded,   setFNeeded]   = useState(1)
  const [fCity,     setFCity]     = useState('')
  const [fCountry,  setFCountry]  = useState('')
  const [fLevel,    setFLevel]    = useState('')
  const [fSurface,  setFSurface]  = useState('')
  const [fFormat,   setFFormat]   = useState<string>('singles')
  const [fLocation, setFLocation] = useState('')
  const [fNotes,    setFNotes]    = useState('')

  useEffect(() => {
    const id = localStorage.getItem('sparring_profile_id')
    setOwnProfileId(id)
    if (id) {
      fetch(`${BACKEND}/sparring/profiles/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) { setOwnCity(p.city || ''); setOwnCountry(p.country || ''); setFCity(p.city || ''); setFCountry(p.country || '') } })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!ownCity) return
    setLoading(true)
    fetch(`${BACKEND}/play-requests?city=${encodeURIComponent(ownCity)}`)
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => setRequests(d.requests ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [ownCity])

  // Also fetch all if no city
  useEffect(() => {
    if (ownCity) return
    setLoading(true)
    fetch(`${BACKEND}/play-requests`)
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => setRequests(d.requests ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [ownCity])

  async function handleJoin(id: string) {
    if (!ownProfileId) return null
    try {
      const r = await fetch(`${BACKEND}/play-requests/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: ownProfileId }),
      })
      if (!r.ok) return null
      const data = await r.json()
      // Refresh list
      setRequests(prev => prev.map(req => req.id === id
        ? { ...req, join_count: req.join_count + 1, spots_left: Math.max(0, req.spots_left - 1) }
        : req
      ))
      return data
    } catch { return null }
  }

  async function handleCancel(id: string) {
    if (!ownProfileId) return
    try {
      await fetch(`${BACKEND}/play-requests/${id}?profile_id=${ownProfileId}`, { method: 'DELETE' })
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ownProfileId) { window.location.href = '/sparring/create'; return }
    setSubmitting(true)
    try {
      const r = await fetch(`${BACKEND}/play-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id:     ownProfileId,
          city:           fCity || ownCity,
          country:        fCountry || ownCountry,
          date:           fDate,
          time_slot:      fSlot,
          players_needed: fNeeded,
          level:          fLevel || undefined,
          surface:        fSurface || undefined,
          format:         fFormat || undefined,
          location_name:  fLocation || undefined,
          notes:          fNotes || undefined,
        }),
      })
      if (r.ok) {
        const newReq = await r.json()
        setRequests(prev => [newReq, ...prev])
        setSubmitOk(true)
        setShowForm(false)
        setFDate(TODAY); setFSlot('Morning'); setFNeeded(1)
        setFLevel(''); setFSurface(''); setFFormat('singles')
        setFLocation(''); setFNotes('')
        setTimeout(() => setSubmitOk(false), 4000)
      }
    } catch {}
    setSubmitting(false)
  }

  const openRequests = requests.filter(r => r.status === 'open' && r.spots_left > 0)

  return (
    <SparringShell>
      <div className="sr-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <style>{`
          @keyframes fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          .play-input { width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:9px; color:#fff; font-size:14px; outline:none; box-sizing:border-box; }
          .play-input:focus { border-color:rgba(57,255,20,0.4); }
          .play-input option { background:#1a2a3e; color:#fff; }
          .play-slot { padding:9px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.5); font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s; }
          .play-slot.active { background:rgba(57,255,20,0.12); border-color:rgba(57,255,20,0.4); color:#39FF14; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 20px 0' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <BackButton />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 18 }}>
              <div>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>
                  Play Requests
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                  {ownCity ? `Open games in ${ownCity}` : 'Find a game or post your own'}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(s => !s); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }}
                style={{
                  background: '#39FF14', color: '#000', fontWeight: 900, fontSize: 13,
                  padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', minHeight: 44, boxShadow: '0 0 12px rgba(57,255,20,0.2)',
                }}>
                + Post request
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 80px' }}>

          {/* ── Success toast ── */}
          {submitOk && (
            <div style={{
              background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              color: '#39FF14', fontSize: 13, fontWeight: 700,
              animation: 'fade-up 0.3s ease',
            }}>
              ✓ Request posted! Players near you will see it.
            </div>
          )}

          {/* ── Requests list ── */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>
              {ownCity ? `Happening in ${ownCity}` : 'Open requests'}
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                Loading…
              </div>
            ) : openRequests.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 24px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
              }}>
                <p style={{ fontSize: 32, margin: '0 0 12px' }}>🎾</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 16, margin: '0 0 6px' }}>
                  No games posted yet.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                  Post the first one — someone in your city is looking.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    background: '#39FF14', color: '#000', fontWeight: 900,
                    fontSize: 13, padding: '11px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  }}>
                  Post a request →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {openRequests.map((req, i) => (
                  <div key={req.id} style={{ animation: `fade-up 0.4s ease ${i * 0.05}s both` }}>
                    <RequestCard
                      req={req}
                      ownProfileId={ownProfileId}
                      onJoin={handleJoin}
                      onCancel={handleCancel}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Post a request form ── */}
          <div ref={formRef}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${showForm ? 'rgba(57,255,20,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 16, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              <button
                onClick={() => setShowForm(s => !s)}
                style={{
                  width: '100%', padding: '18px 20px', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', color: '#fff',
                }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Post a request</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, transition: 'transform 0.2s', transform: showForm ? 'rotate(180deg)' : 'none' }}>
                  ⌄
                </span>
              </button>

              {showForm && (
                <form onSubmit={handleSubmit} style={{ padding: '0 20px 24px' }}>
                  {!ownProfileId && (
                    <div style={{
                      background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)',
                      borderRadius: 10, padding: '12px 14px', marginBottom: 20,
                    }}>
                      <p style={{ color: '#39FF14', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>
                        Create a profile first
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 10px' }}>
                        You need a sparring profile to post requests.
                      </p>
                      <Link href="/sparring/create"
                        style={{ color: '#39FF14', fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>
                        Create profile →
                      </Link>
                    </div>
                  )}

                  {/* City picker */}
                  <div style={{ marginBottom: 16 }}>
                    <CityPicker
                      label="City"
                      value={fCity && fCountry ? `${fCity}, ${fCountry}` : undefined}
                      onChange={({ city: c, country: co }) => { setFCity(c); setFCountry(co) }}
                      inputStyle={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#fff', height: 42 }}
                    />
                    {fCountry && (
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: '4px 0 0' }}>{fCountry}</p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Date</label>
                      <input type="date" required value={fDate} min={TODAY}
                        onChange={e => setFDate(e.target.value)}
                        className="play-input" />
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Players needed</label>
                      <select value={fNeeded} onChange={e => setFNeeded(+e.target.value)} className="play-input">
                        {[1, 2, 3].map(n => <option key={n} value={n}>{n} player{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Time slot</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {TIME_SLOTS.map(s => (
                        <button key={s} type="button"
                          onClick={() => setFSlot(s)}
                          className={`play-slot${fSlot === s ? ' active' : ''}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Format</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {FORMATS.map(f => (
                        <button key={f} type="button"
                          onClick={() => setFFormat(f)}
                          className={`play-slot${fFormat === f ? ' active' : ''}`}>
                          {FORMAT_LABEL[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Level</label>
                      <select value={fLevel} onChange={e => setFLevel(e.target.value)} className="play-input">
                        <option value="">Any level</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Surface</label>
                      <select value={fSurface} onChange={e => setFSurface(e.target.value)} className="play-input">
                        <option value="">Any surface</option>
                        {SURFACES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Location / court name</label>
                    <input type="text" placeholder="e.g. Parque de la Ciutadella"
                      value={fLocation} onChange={e => setFLocation(e.target.value)}
                      className="play-input" />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Notes (optional)</label>
                    <textarea
                      placeholder="e.g. Casual hitting session, all levels welcome"
                      value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2}
                      className="play-input" style={{ resize: 'vertical', minHeight: 60 }} />
                  </div>

                  <button type="submit" disabled={submitting || !ownProfileId}
                    style={{
                      width: '100%', background: '#39FF14', color: '#000',
                      fontWeight: 900, fontSize: 15, padding: '13px', borderRadius: 10,
                      border: 'none', cursor: (!ownProfileId || submitting) ? 'default' : 'pointer',
                      opacity: (!ownProfileId || submitting) ? 0.5 : 1,
                      boxShadow: '0 0 16px rgba(57,255,20,0.2)',
                    }}>
                    {submitting ? 'Posting…' : 'Post request →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </SparringShell>
  )
}
