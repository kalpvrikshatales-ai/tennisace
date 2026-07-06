'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
const BUCKET  = 'sparring-photos'

const DAYS  = ['mon','tue','wed','thu','fri','sat','sun'] as const
const TIMES = ['morning','afternoon','evening'] as const
const DAY_LABEL: Record<string, string> = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
const TIME_LABEL: Record<string, string> = { morning:'AM', afternoon:'PM', evening:'Eve' }

const LEVEL_OPTS   = ['beginner','intermediate','advanced','competitive']
const SURFACE_OPTS = ['Hard','Clay','Grass','Indoor']
const HAND_OPTS    = ['Right','Left']
const BACK_OPTS    = ['One-handed','Two-handed']
const STYLE_OPTS   = ['Baseline','Serve & Volley','All-Court','Defensive']

type AvailSlot = { day: string; time: string }
type Profile = {
  id: string; name: string; city: string; country: string; level: string
  role?: string; bio?: string; photo_url?: string; cover_url?: string
  surface: string[]; play_type?: string; play_style?: string
  dominant_hand?: string; backhand?: string; years_playing?: number
  favorite_players?: string; coaching_level?: string; coaching_fee?: string
  created_at: string; availability: AvailSlot[]; email?: string
}
type Request = {
  id: string; status: 'pending'|'accepted'|'declined'; created_at: string
  requester_name?: string; requester_city?: string; from_phone?: string
  to_profile?: { id?: string; name?: string; city?: string; country?: string; phone?: string }
}

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1)  return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

// ─── Tennis court SVG lines ───────────────────────────────────────────────────
function CourtLines() {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18, pointerEvents:'none' }}
      viewBox="0 0 1920 200" preserveAspectRatio="xMidYMid slice">
      <rect x="160" y="16" width="1600" height="168" fill="none" stroke="#39FF14" strokeWidth="2"/>
      <line x1="160" y1="100" x2="1760" y2="100" stroke="#39FF14" strokeWidth="1.5"/>
      <line x1="960" y1="16"  x2="960"  y2="184" stroke="#39FF14" strokeWidth="1.5"/>
      <line x1="560" y1="16"  x2="560"  y2="184" stroke="#39FF14" strokeWidth="1"/>
      <line x1="1360" y1="16" x2="1360" y2="184" stroke="#39FF14" strokeWidth="1"/>
      <line x1="960" y1="0"   x2="960"  y2="200" stroke="#39FF14" strokeWidth="3" strokeDasharray="6 4" opacity="0.6"/>
    </svg>
  )
}

// ─── Read-only availability grid ──────────────────────────────────────────────
function AvailGrid({ slots, isOwn, onEdit }: { slots: AvailSlot[]; isOwn: boolean; onEdit?: () => void }) {
  const set = new Set(slots.map(s => `${s.day}-${s.time}`))
  return (
    <div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', minWidth:340 }}>
          <thead>
            <tr>
              <td style={{ width:50 }} />
              {DAYS.map(d => (
                <th key={d} style={{ color:'#555', fontSize:11, fontWeight:700, padding:'4px 5px', textAlign:'center', letterSpacing:0.3 }}>
                  {DAY_LABEL[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(t => (
              <tr key={t}>
                <td style={{ color:'#444', fontSize:10, fontWeight:700, paddingRight:6, textAlign:'right', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:0.4 }}>
                  {TIME_LABEL[t]}
                </td>
                {DAYS.map(d => {
                  const on = set.has(`${d}-${t}`)
                  return (
                    <td key={d} style={{ padding:'3px 4px', textAlign:'center' }}>
                      <div style={{
                        width:28, height:28, borderRadius:6, margin:'0 auto',
                        background: on ? 'rgba(57,255,20,0.15)' : '#111',
                        border: `1px solid ${on ? '#39FF14' : '#1e1e1e'}`,
                      }} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isOwn && (
        <button onClick={onEdit}
          style={{ marginTop:10, background:'none', border:'none', color:'#39FF14', fontSize:12, fontWeight:700, padding:'4px 0', cursor:'pointer' }}>
          Edit availability →
        </button>
      )}
    </div>
  )
}

// ─── Interactive availability editor ─────────────────────────────────────────
function AvailEditor({ value, onChange }: { value: AvailSlot[]; onChange: (v: AvailSlot[]) => void }) {
  const set = new Set(value.map(s => `${s.day}-${s.time}`))
  function toggle(d: string, t: string) {
    const key = `${d}-${t}`
    if (set.has(key)) onChange(value.filter(s => !(s.day===d && s.time===t)))
    else               onChange([...value, { day:d, time:t }])
  }
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ borderCollapse:'collapse', minWidth:300 }}>
        <thead>
          <tr>
            <td style={{ width:44 }} />
            {DAYS.map(d => (
              <th key={d} style={{ color:'#555', fontSize:10, fontWeight:700, padding:'4px 4px', textAlign:'center' }}>
                {DAY_LABEL[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIMES.map(t => (
            <tr key={t}>
              <td style={{ color:'#444', fontSize:9, fontWeight:700, paddingRight:5, textAlign:'right', textTransform:'uppercase', letterSpacing:0.4 }}>
                {TIME_LABEL[t]}
              </td>
              {DAYS.map(d => {
                const on = set.has(`${d}-${t}`)
                return (
                  <td key={d} style={{ padding:'2px 3px', textAlign:'center' }}>
                    <button onClick={() => toggle(d,t)}
                      style={{ width:26, height:26, borderRadius:5, border:`1px solid ${on?'#39FF14':'#2a2a2a'}`, background:on?'rgba(57,255,20,0.18)':'#111', cursor:'pointer' }} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Generic edit modal ───────────────────────────────────────────────────────
type FieldDef = {
  key: string; label: string; type: 'text'|'number'|'textarea'|'select'|'surface-multi'|'availability'
  options?: string[]
}

function EditModal({ field, value, onSave, onClose, saving }: {
  field: FieldDef; value: any; onSave: (v: any) => void; onClose: () => void; saving: boolean
}) {
  const [val, setVal] = useState(value)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:14, padding:24, maxWidth:440, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ color:'#fff', fontWeight:800, fontSize:16, margin:0 }}>{field.label}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', lineHeight:1, padding:4 }}>×</button>
        </div>

        {field.type === 'select' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(field.options??[]).map(opt => (
              <button key={opt} onClick={() => setVal(opt)}
                style={{ background:val===opt?'rgba(57,255,20,0.12)':'#1a1a1a', border:`1px solid ${val===opt?'#39FF14':'#2a2a2a'}`, borderRadius:8, color:val===opt?'#39FF14':'#aaa', fontWeight:700, fontSize:14, padding:'12px 16px', textAlign:'left', cursor:'pointer', textTransform:'capitalize' }}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {field.type === 'surface-multi' && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {SURFACE_OPTS.map(s => {
              const arr: string[] = Array.isArray(val) ? val : []
              const on = arr.includes(s)
              return (
                <button key={s} onClick={() => setVal(on ? arr.filter(x=>x!==s) : [...arr,s])}
                  style={{ background:on?'rgba(57,255,20,0.12)':'#1a1a1a', border:`1px solid ${on?'#39FF14':'#2a2a2a'}`, borderRadius:8, color:on?'#39FF14':'#aaa', fontWeight:700, fontSize:14, padding:'10px 18px', cursor:'pointer' }}>
                  {s}
                </button>
              )
            })}
          </div>
        )}

        {field.type === 'text' && (
          <input value={val??''} onChange={e => setVal(e.target.value)}
            style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', fontSize:15, padding:'12px 14px', outline:'none', boxSizing:'border-box' }} />
        )}

        {field.type === 'number' && (
          <input type="number" value={val??''} onChange={e => setVal(e.target.value ? Number(e.target.value) : null)}
            style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', fontSize:15, padding:'12px 14px', outline:'none', boxSizing:'border-box' }} />
        )}

        {field.type === 'textarea' && (
          <textarea value={val??''} onChange={e => setVal(e.target.value)} rows={4}
            style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', fontSize:15, padding:'12px 14px', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.5 }} />
        )}

        {field.type === 'availability' && (
          <AvailEditor value={val??[]} onChange={setVal} />
        )}

        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={onClose}
            style={{ flex:1, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#aaa', fontWeight:700, fontSize:14, padding:'12px', cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSave(val)} disabled={saving}
            style={{ flex:2, background:saving?'#1a3a1a':'#39FF14', border:'none', borderRadius:8, color:saving?'#39FF14':'#000', fontWeight:800, fontSize:14, padding:'12px', cursor:saving?'not-allowed':'pointer' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field card ───────────────────────────────────────────────────────────────
const FIELD_ICONS: Record<string, string> = {
  level:'🎾', play_style:'🎯', dominant_hand:'✋', backhand:'🔄',
  surface:'🏟️', years_playing:'📅', city:'📍', country:'🌍', bio:'📝',
}

function FieldCard({ fieldKey, label, value, isOwn, onClick }: {
  fieldKey: string; label: string; value: string|null; isOwn: boolean; onClick?: () => void
}) {
  const empty = !value
  return (
    <button
      onClick={isOwn ? onClick : undefined}
      disabled={!isOwn}
      style={{
        background:'#111', border:'1px solid #222', borderRadius:10,
        padding:'14px 12px', textAlign:'left', display:'flex', flexDirection:'column',
        gap:5, cursor:isOwn?'pointer':'default', minHeight:90, width:'100%', transition:'border-color 0.15s',
      }}
      onMouseEnter={e => isOwn && (e.currentTarget.style.borderColor='#333')}
      onMouseLeave={e => (e.currentTarget.style.borderColor='#222')}
    >
      <span style={{ fontSize:16 }}>{FIELD_ICONS[fieldKey] ?? '•'}</span>
      <span style={{ color:'#555', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.7 }}>{label}</span>
      <span style={{ color:empty?'#2d6a2d':'#fff', fontSize:12, fontWeight:empty?600:700, textTransform:fieldKey==='level'?'capitalize':'none', wordBreak:'break-word' }}>
        {empty ? '+ Add' : value}
      </span>
    </button>
  )
}

// ─── Partners tab ─────────────────────────────────────────────────────────────
function PartnersTab({ profileId }: { profileId: string }) {
  const [partners, setPartners] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const email = localStorage.getItem('sparring_email')
    if (!email) { setLoading(false); return }
    Promise.all([
      fetch(`${BACKEND}/sparring/requests/received?email=${encodeURIComponent(email)}`).then(r=>r.ok?r.json():{requests:[]}),
      fetch(`${BACKEND}/sparring/requests/sent?email=${encodeURIComponent(email)}`    ).then(r=>r.ok?r.json():{requests:[]}),
    ]).then(([rec, sent]) => {
      const list: any[] = []
      for (const r of (rec.requests??[])) {
        if (r.status==='accepted') list.push({ name:r.requester_name, city:r.requester_city })
      }
      for (const r of (sent.requests??[])) {
        if (r.status==='accepted' && r.to_profile) list.push(r.to_profile)
      }
      setPartners(list)
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [profileId])

  if (loading) return <p style={{ color:'#555', fontSize:14, textAlign:'center', padding:'40px 0' }}>Loading…</p>

  if (partners.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'48px 16px' }}>
        <p style={{ fontSize:32, margin:'0 0 12px' }}>🎾</p>
        <p style={{ color:'#555', fontSize:14, lineHeight:1.6, margin:0 }}>
          No partners yet.<br/>Send a request to connect.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {partners.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#111', border:'1px solid #222', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#39FF14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#000', flexShrink:0 }}>
            {(p.name??'?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 1px' }}>{p.name}</p>
            <p style={{ color:'#555', fontSize:12, margin:'0 0 2px' }}>{p.city}</p>
            <p style={{ color:'#39FF14', fontSize:11, fontWeight:700, margin:0 }}>Tennis Partner</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Requests tab (own only) ──────────────────────────────────────────────────
function RequestsTab({ email }: { email?: string }) {
  const [received, setReceived] = useState<Request[]>([])
  const [sent,     setSent]     = useState<Request[]>([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState<string|null>(null)

  useEffect(() => {
    if (!email) { setLoading(false); return }
    Promise.all([
      fetch(`${BACKEND}/sparring/requests/received?email=${encodeURIComponent(email)}`).then(r=>r.ok?r.json():{requests:[]}),
      fetch(`${BACKEND}/sparring/requests/sent?email=${encodeURIComponent(email)}`    ).then(r=>r.ok?r.json():{requests:[]}),
    ]).then(([rec, sent]) => {
      setReceived(rec.requests??[])
      setSent(sent.requests??[])
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [email])

  async function accept(id: string) {
    setActing(id)
    try {
      const res = await fetch(`${BACKEND}/sparring/requests/${id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status:'accepted' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setReceived(prev => prev.map(r => r.id===id ? {...r, status:'accepted', from_phone:updated.from_phone??r.from_phone} : r))
      }
    } catch {} finally { setActing(null) }
  }

  async function decline(id: string) {
    setActing(id)
    try {
      const res = await fetch(`${BACKEND}/sparring/requests/${id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status:'declined' }),
      })
      if (res.ok) setReceived(prev => prev.map(r => r.id===id ? {...r, status:'declined'} : r))
    } catch {} finally { setActing(null) }
  }

  const STATUS: Record<string, {bg:string;color:string;label:string}> = {
    pending:  { bg:'#1a1a2a', color:'#6eb8e8', label:'Pending'  },
    accepted: { bg:'#0a1a0a', color:'#39FF14', label:'Accepted' },
    declined: { bg:'#1a0a0a', color:'#e87070', label:'Declined' },
  }

  if (loading) return <p style={{ color:'#555', fontSize:14, textAlign:'center', padding:'40px 0' }}>Loading…</p>

  return (
    <div>
      <p style={{ color:'#aaa', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, margin:'0 0 12px' }}>
        Received ({received.length})
      </p>
      {received.length === 0
        ? <p style={{ color:'#444', fontSize:14, marginBottom:28 }}>No requests received yet.</p>
        : received.map(req => {
            const s = STATUS[req.status] ?? STATUS.pending
            return (
              <div key={req.id} style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 2px' }}>{req.requester_name}</p>
                    <p style={{ color:'#555', fontSize:12, margin:0 }}>{req.requester_city} · {timeAgo(req.created_at)}</p>
                  </div>
                  <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:800, padding:'3px 8px', borderRadius:4, flexShrink:0 }}>{s.label}</span>
                </div>
                {req.status==='accepted' && req.from_phone && (
                  <div style={{ background:'#0a1a0a', border:'1px solid #1a3a1a', borderRadius:6, padding:'8px 12px', marginTop:8 }}>
                    <p style={{ color:'#555', fontSize:10, margin:'0 0 2px', textTransform:'uppercase', fontWeight:700 }}>Their number</p>
                    <p style={{ color:'#39FF14', fontSize:15, fontWeight:800, margin:0 }}>{req.from_phone}</p>
                  </div>
                )}
                {req.status==='pending' && (
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button onClick={()=>decline(req.id)} disabled={!!acting}
                      style={{ flex:1, background:'#1a1a1a', border:'1px solid #333', borderRadius:6, color:'#aaa', fontWeight:700, fontSize:13, padding:'9px', cursor:acting?'not-allowed':'pointer' }}>
                      Decline
                    </button>
                    <button onClick={()=>accept(req.id)} disabled={!!acting}
                      style={{ flex:2, background:acting===req.id?'#1a3a1a':'#39FF14', border:'none', borderRadius:6, color:acting===req.id?'#39FF14':'#000', fontWeight:800, fontSize:13, padding:'9px', cursor:acting?'not-allowed':'pointer' }}>
                      {acting===req.id ? 'Accepting…' : 'Accept'}
                    </button>
                  </div>
                )}
              </div>
            )
          })
      }

      <p style={{ color:'#aaa', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, margin:'28px 0 12px' }}>
        Sent ({sent.length})
      </p>
      {sent.length === 0
        ? <p style={{ color:'#444', fontSize:14 }}>No requests sent yet.</p>
        : sent.map(req => {
            const s = STATUS[req.status] ?? STATUS.pending
            const p = req.to_profile
            return (
              <div key={req.id} style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 2px' }}>{p?.name ?? '—'}</p>
                    <p style={{ color:'#555', fontSize:12, margin:0 }}>
                      {[p?.city, p?.country].filter(Boolean).join(', ')} · {timeAgo(req.created_at)}
                    </p>
                  </div>
                  <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:800, padding:'3px 8px', borderRadius:4, flexShrink:0 }}>{s.label}</span>
                </div>
                {req.status==='accepted' && p?.phone && (
                  <div style={{ background:'#0a1a0a', border:'1px solid #1a3a1a', borderRadius:6, padding:'8px 12px', marginTop:8 }}>
                    <p style={{ color:'#555', fontSize:10, margin:'0 0 2px', textTransform:'uppercase', fontWeight:700 }}>Their number</p>
                    <p style={{ color:'#39FF14', fontSize:15, fontWeight:800, margin:0 }}>{p.phone}</p>
                  </div>
                )}
              </div>
            )
          })
      }
    </div>
  )
}

// ─── Request to Play modal ────────────────────────────────────────────────────
function RequestModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [phone,   setPhone]   = useState('')
  const [name,    setName]    = useState('')
  const [city,    setCity]    = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSentOk]  = useState(false)
  const [error,   setError]   = useState('')

  async function submit() {
    if (!phone.trim()) { setError('Phone number is required'); return }
    setSending(true); setError('')
    try {
      const ownId    = localStorage.getItem('sparring_profile_id')
      const ownEmail = localStorage.getItem('sparring_email')
      const res = await fetch(`${BACKEND}/sparring/requests`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          to_profile_id: profile.id, from_phone: phone.trim(),
          requester_name: name.trim() || 'Anonymous',
          requester_city: city.trim() || profile.city,
          from_profile_id: ownId, from_email: ownEmail,
          message: message.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(()=>({}))
        throw new Error(d.detail || 'Failed to send request')
      }
      setSentOk(true)
    } catch (e: any) { setError(e.message ?? 'Something went wrong') }
    finally { setSending(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#111', border:'1px solid #222', borderRadius:14, padding:24, maxWidth:420, width:'100%' }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <p style={{ fontSize:36, margin:'0 0 12px' }}>✅</p>
            <p style={{ color:'#fff', fontWeight:800, fontSize:18, margin:'0 0 6px' }}>Request sent!</p>
            <p style={{ color:'#555', fontSize:14, margin:'0 0 24px', lineHeight:1.5 }}>{profile.name} will see your request. If they accept, you'll both get each other's number.</p>
            <button onClick={onClose} style={{ background:'#39FF14', border:'none', borderRadius:8, color:'#000', fontWeight:800, fontSize:14, padding:'12px 28px', cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <p style={{ color:'#fff', fontWeight:800, fontSize:16, margin:0 }}>Request to Play</p>
              <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', lineHeight:1, padding:4 }}>×</button>
            </div>
            <p style={{ color:'#555', fontSize:13, margin:'0 0 16px', lineHeight:1.5 }}>
              Send a request to <strong style={{ color:'#fff' }}>{profile.name}</strong>. If they accept, you'll both receive each other's contact.
            </p>
            {error && <p style={{ color:'#e87070', fontSize:13, margin:'0 0 12px' }}>{error}</p>}
            {[['Your name', name, setName], ['Your city', city, setCity]].map(([lbl, val, setter]: any) => (
              <div key={lbl} style={{ marginBottom:12 }}>
                <label style={{ color:'#555', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:5 }}>{lbl}</label>
                <input value={val} onChange={e => setter(e.target.value)}
                  style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', fontSize:14, padding:'10px 12px', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={{ color:'#555', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:5 }}>
                Phone number <span style={{ color:'#e87070' }}>*</span>
              </label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" type="tel"
                style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', fontSize:14, padding:'10px 12px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ color:'#555', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:5 }}>Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Hey! Let's hit some balls…"
                style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', fontSize:14, padding:'10px 12px', outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.5 }} />
            </div>
            <button onClick={submit} disabled={sending}
              style={{ width:'100%', background:sending?'#1a3a1a':'#39FF14', border:'none', borderRadius:8, color:sending?'#39FF14':'#000', fontWeight:800, fontSize:15, padding:'13px', cursor:sending?'not-allowed':'pointer' }}>
              {sending ? 'Sending…' : 'Send Request'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Upload button ────────────────────────────────────────────────────────────
function UploadBtn({ onFile, children, style }: { onFile: (f: File) => void; children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button onClick={() => ref.current?.click()} style={{ background:'none', border:'none', padding:0, cursor:'pointer', ...style }}>
        {children}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => { const f=e.target.files?.[0]; if(f) onFile(f); e.target.value='' }} />
    </>
  )
}

// ─── Field definitions ────────────────────────────────────────────────────────
const FIELD_DEFS: FieldDef[] = [
  { key:'level',         label:'Tennis Level',  type:'select',       options:LEVEL_OPTS   },
  { key:'play_style',    label:'Play Style',    type:'select',       options:STYLE_OPTS   },
  { key:'dominant_hand', label:'Dominant Hand', type:'select',       options:HAND_OPTS    },
  { key:'backhand',      label:'Backhand',       type:'select',       options:BACK_OPTS    },
  { key:'surface',       label:'Fav Surface',   type:'surface-multi'                      },
  { key:'years_playing', label:'Years Playing', type:'number'                             },
  { key:'city',          label:'City',          type:'text'                               },
  { key:'country',       label:'Country',       type:'text'                               },
  { key:'bio',           label:'Bio',           type:'textarea'                           },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SparringProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [profile,       setProfile]       = useState<Profile|null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [isOwn,         setIsOwn]         = useState(false)
  const [activeTab,     setActiveTab]     = useState<'overview'|'partners'|'requests'>('overview')
  const [editField,     setEditField]     = useState<FieldDef|null>(null)
  const [savingField,   setSavingField]   = useState(false)
  const [showRequest,   setShowRequest]   = useState(false)
  const [uploading,     setUploading]     = useState<'cover'|'avatar'|null>(null)
  const [uploadError,   setUploadError]   = useState<string|null>(null)
  const [partnersCount, setPartnersCount] = useState(0)

  // Load profile
  useEffect(() => {
    fetch(`${BACKEND}/sparring/profiles/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then(data => setProfile(data))
      .catch(() => setError('Profile not found.'))
      .finally(() => setLoading(false))
  }, [id])

  // Own profile detection
  useEffect(() => {
    setIsOwn(localStorage.getItem('sparring_profile_id') === id)
  }, [id])

  // Partners count (only on own profile)
  useEffect(() => {
    const email = localStorage.getItem('sparring_email')
    if (!email) return
    Promise.all([
      fetch(`${BACKEND}/sparring/requests/received?email=${encodeURIComponent(email)}`).then(r=>r.ok?r.json():{requests:[]}),
      fetch(`${BACKEND}/sparring/requests/sent?email=${encodeURIComponent(email)}`    ).then(r=>r.ok?r.json():{requests:[]}),
    ]).then(([rec, sent]) => {
      const n =
        (rec.requests??[]).filter((r:any)=>r.status==='accepted').length +
        (sent.requests??[]).filter((r:any)=>r.status==='accepted').length
      setPartnersCount(n)
    }).catch(()=>{})
  }, [id])

  async function saveField(field: FieldDef, value: any) {
    if (!profile) return
    setSavingField(true)
    try {
      const body: Record<string,any> = field.key==='surface'
        ? { surface: Array.isArray(value) ? value : [] }
        : { [field.key]: value }
      const res = await fetch(`${BACKEND}/sparring/profiles/${id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
      })
      if (res.ok) { setProfile(await res.json()); setEditField(null) }
    } catch {} finally { setSavingField(false) }
  }

  async function uploadImage(type: 'cover'|'avatar', file: File) {
    if (!profile) return
    if (!supabase) { setUploadError('Storage not configured'); return }
    setUploading(type)
    setUploadError(null)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      // Unique filename per upload so the browser never serves a stale cached copy
      const filename = `${Date.now()}.${ext}`
      const path = type === 'cover' ? `covers/${id}/${filename}` : `avatars/${id}/${filename}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      if (!data?.publicUrl) throw new Error('Could not get public URL')
      const url = data.publicUrl
      const res = await fetch(`${BACKEND}/sparring/profiles/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'cover' ? { cover_url: url } : { photo_url: url }),
      })
      if (!res.ok) throw new Error('Failed to save photo URL')
      const updated = await res.json()
      // Update local state immediately — no page refresh needed
      setProfile(updated)
    } catch (e: any) {
      setUploadError(e?.message ?? 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  function getFieldDisplay(f: FieldDef): string|null {
    if (!profile) return null
    const raw = (profile as any)[f.key]
    if (f.key==='surface') return Array.isArray(raw) && raw.length ? raw.join(', ') : null
    return (raw==null || raw==='') ? null : String(raw)
  }

  function getFieldRaw(f: FieldDef) {
    if (!profile) return null
    return (profile as any)[f.key]
  }

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div style={{ background:'#000', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #1a1a1a', borderTopColor:'#39FF14', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }
  if (error || !profile) {
    return (
      <div style={{ background:'#000', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <p style={{ color:'#555', fontSize:16 }}>{error || 'Profile not found.'}</p>
        <Link href="/sparring" style={{ color:'#39FF14', fontSize:14 }}>← Back to Find a Partner</Link>
      </div>
    )
  }

  const initial = (profile.name ?? '?')[0].toUpperCase()
  const ownEmail = typeof window !== 'undefined' ? (localStorage.getItem('sparring_email') ?? undefined) : undefined

  const tabs = [
    { key:'overview',  label:'Overview'  },
    { key:'partners',  label:'Partners'  },
    ...(isOwn ? [{ key:'requests', label:'Requests' }] : []),
  ] as const

  return (
    <div style={{ background:'#000', minHeight:'100vh', paddingBottom:80 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Cover banner ── */}
      <div style={{
        height:200, width:'100%', position:'relative', overflow:'hidden',
        background: profile.cover_url
          ? `url(${profile.cover_url}) center/cover no-repeat`
          : '#0a0a0a',
      }}>
        {!profile.cover_url && <CourtLines />}

        {/* Back */}
        <button onClick={() => router.back()}
          style={{ position:'absolute', top:14, left:14, background:'rgba(0,0,0,0.6)', border:'1px solid #333', borderRadius:8, color:'#ccc', fontSize:13, fontWeight:700, padding:'7px 13px', cursor:'pointer', backdropFilter:'blur(6px)' }}>
          ← Back
        </button>

        {/* Cover upload (own) */}
        {isOwn && (
          <UploadBtn onFile={f => uploadImage('cover', f)}
            style={{ position:'absolute', bottom:12, right:12 }}>
            <div style={{ background:'rgba(0,0,0,0.65)', border:'1px solid #444', borderRadius:8, color:'#ddd', fontSize:12, fontWeight:700, padding:'7px 12px', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', gap:6 }}>
              {uploading==='cover'
                ? <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #333', borderTopColor:'#39FF14', animation:'spin 0.7s linear infinite' }} />
                : <>✏️ Edit cover</>}
            </div>
          </UploadBtn>
        )}
      </div>

      {/* ── Profile content ── */}
      <div style={{ maxWidth:640, margin:'0 auto', padding:'0 16px' }}>

        {/* ── Avatar + buttons row ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:-48, paddingBottom:14 }}>

          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            {/* Avatar circle */}
            <div style={{
              width:96, height:96, borderRadius:'50%', border:'4px solid #000',
              background: profile.photo_url ? `url(${profile.photo_url}) center/cover no-repeat` : '#39FF14',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:36, fontWeight:900, color:'#000', overflow:'hidden',
              position:'relative',
            }}>
              {!profile.photo_url && initial}
              {/* Full-circle spinner overlay while uploading */}
              {uploading === 'avatar' && (
                <div style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  background:'rgba(0,0,0,0.6)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid #1a1a1a', borderTopColor:'#39FF14', animation:'spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>
            {/* Camera button */}
            {isOwn && (
              <UploadBtn onFile={f => uploadImage('avatar', f)}
                style={{ position:'absolute', bottom:2, right:2 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'#1a1a1a', border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
                  📷
                </div>
              </UploadBtn>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
            {isOwn ? (
              <>
                <Link href={`/sparring/edit/${id}`}
                  style={{ background:'transparent', border:'1px solid #333', borderRadius:8, color:'#aaa', fontWeight:700, fontSize:13, padding:'9px 14px', textDecoration:'none', whiteSpace:'nowrap' }}>
                  Settings
                </Link>
                <Link href={`/sparring/edit/${id}`}
                  style={{ background:'#39FF14', border:'none', borderRadius:8, color:'#000', fontWeight:800, fontSize:13, padding:'9px 16px', textDecoration:'none', whiteSpace:'nowrap' }}>
                  Edit Profile
                </Link>
              </>
            ) : (
              <button onClick={() => setShowRequest(true)}
                style={{ background:'#39FF14', border:'none', borderRadius:8, color:'#000', fontWeight:800, fontSize:13, padding:'9px 18px', cursor:'pointer', whiteSpace:'nowrap' }}>
                Request to Play
              </button>
            )}
          </div>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div style={{ background:'#1a0a0a', border:'1px solid #3a1a1a', borderRadius:8, padding:'8px 14px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            <span style={{ color:'#e87070', fontSize:13 }}>{uploadError}</span>
            <button onClick={() => setUploadError(null)} style={{ background:'none', border:'none', color:'#e87070', cursor:'pointer', fontSize:16, lineHeight:1, padding:2 }}>×</button>
          </div>
        )}

        {/* ── Profile info ── */}
        <div style={{ marginBottom:22 }}>
          {profile.level && (
            <span style={{ display:'inline-block', border:'1px solid #39FF14', borderRadius:20, color:'#39FF14', fontSize:11, fontWeight:800, padding:'3px 10px', marginBottom:8, textTransform:'capitalize', letterSpacing:0.3 }}>
              {profile.level}
            </span>
          )}
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'0 0 4px', letterSpacing:-0.5, lineHeight:1.2 }}>
            {profile.name}
          </h1>
          {(profile.city || profile.country) && (
            <p style={{ color:'#666', fontSize:14, margin:'0 0 4px' }}>
              @{[profile.city, profile.country].filter(Boolean).join(', ')}
            </p>
          )}
          <p style={{ color:'#555', fontSize:13, margin:0 }}>
            {partnersCount} partner{partnersCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', borderBottom:'1px solid #222', marginBottom:24 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              style={{
                background:'none', border:'none',
                borderBottom: activeTab===tab.key ? '2px solid #39FF14' : '2px solid transparent',
                marginBottom:-1,
                padding:'12px 18px 11px',
                color: activeTab===tab.key ? '#fff' : '#555',
                fontWeight: activeTab===tab.key ? 800 : 600,
                fontSize:14, cursor:'pointer', transition:'color 0.15s',
                whiteSpace:'nowrap',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab==='overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:24 }}>
              {FIELD_DEFS.map(f => (
                <FieldCard
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  value={getFieldDisplay(f)}
                  isOwn={isOwn}
                  onClick={() => setEditField(f)}
                />
              ))}
            </div>

            <div style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:'16px' }}>
              <p style={{ color:'#555', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.7, margin:'0 0 14px' }}>Availability</p>
              <AvailGrid
                slots={profile.availability ?? []}
                isOwn={isOwn}
                onEdit={() => setEditField({ key:'availability', label:'Availability', type:'availability' })}
              />
            </div>
          </div>
        )}

        {/* ── Partners ── */}
        {activeTab==='partners' && <PartnersTab profileId={id} />}

        {/* ── Requests ── */}
        {activeTab==='requests' && isOwn && (
          <RequestsTab email={profile.email ?? ownEmail} />
        )}
      </div>

      {/* ── Edit modal ── */}
      {editField && (
        <EditModal
          field={editField}
          value={getFieldRaw(editField)}
          onSave={v => saveField(editField, v)}
          onClose={() => setEditField(null)}
          saving={savingField}
        />
      )}

      {/* ── Request modal ── */}
      {showRequest && <RequestModal profile={profile} onClose={() => setShowRequest(false)} />}
    </div>
  )
}
