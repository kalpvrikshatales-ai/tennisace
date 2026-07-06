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
const DAY_LABEL: Record<string, string> = { mon:'M', tue:'T', wed:'W', thu:'T', fri:'F', sat:'S', sun:'S' }

const LEVEL_OPTS   = ['beginner','intermediate','advanced','competitive']
const SURFACE_OPTS = ['Hard','Clay','Grass','Indoor']
const HAND_OPTS    = ['Right','Left']
const BACK_OPTS    = ['One-handed','Two-handed']
const STYLE_OPTS   = ['Baseline','Serve & Volley','All-Court','Defensive']
const ROLE_OPTS    = ['player','coach']

const LEVEL_COLOR: Record<string, string> = {
  beginner:'#6ee86e', intermediate:'#6eb8e8', advanced:'#e87070', competitive:'#39FF14',
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg:'#1a1a2a', color:'#6eb8e8', label:'Pending'  },
  accepted: { bg:'#0a1a0a', color:'#39FF14', label:'Accepted' },
  declined: { bg:'#1a0a0a', color:'#e87070', label:'Declined' },
}

type AvailSlot = { day: string; time: string }
type Profile = {
  id: string; name: string; city: string; country: string; level: string
  role?: string; bio?: string; photo_url?: string; cover_url?: string
  surface: string[]; play_type?: string; play_style?: string
  dominant_hand?: string; backhand?: string; years_playing?: number
  favorite_players?: string; coaching_level?: string; coaching_fee?: string
  created_at: string; availability: AvailSlot[]; partners_count?: number
}
type Request = {
  id: string; status: 'pending'|'accepted'|'declined'; created_at: string
  requester_name?: string; requester_city?: string; from_phone?: string
  to_profile?: { id?: string; name?: string; city?: string; country?: string; phone?: string }
}

// ─── helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`
}

async function uploadFile(file: File, path: string): Promise<string | null> {
  if (!supabase) return null
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) { console.error(error); return null }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

async function saveField(profileId: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`${BACKEND}/sparring/profiles/${profileId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

// ─── AvailabilityGrid (read-only) ────────────────────────────────────────────
function AvailabilityGrid({ availability }: { availability: AvailSlot[] }) {
  const filled = new Set(availability.map(a => `${a.day}-${a.time}`))
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 340 }}>
        <div style={{ display:'grid', gridTemplateColumns:'80px repeat(7,1fr)', gap:4, marginBottom:4 }}>
          <div />
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', color:'#444', fontSize:10, fontWeight:800, textTransform:'uppercase' }}>
              {DAY_LABEL[d]}
            </div>
          ))}
        </div>
        {TIMES.map(t => (
          <div key={t} style={{ display:'grid', gridTemplateColumns:'80px repeat(7,1fr)', gap:4, marginBottom:4 }}>
            <div style={{ color:'#444', fontSize:10, fontWeight:700, textTransform:'capitalize', paddingTop:6 }}>{t}</div>
            {DAYS.map(d => {
              const on = filled.has(`${d}-${t}`)
              return <div key={d} style={{ height:28, borderRadius:4, background: on ? '#39FF14' : '#1a1a1a', border:`1px solid ${on ? '#39FF14' : '#222'}` }} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AvailabilityEditor (interactive) ────────────────────────────────────────
function AvailabilityEditor({ initial, onSave }: {
  initial: AvailSlot[]
  onSave: (slots: AvailSlot[]) => Promise<void>
}) {
  type Key = `${typeof DAYS[number]}-${typeof TIMES[number]}`
  const [slots, setSlots] = useState<Set<Key>>(
    new Set(initial.map(a => `${a.day}-${a.time}` as Key))
  )
  const [saving, setSaving] = useState(false)

  function toggle(d: typeof DAYS[number], t: typeof TIMES[number]) {
    const k = `${d}-${t}` as Key
    setSlots(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  }

  async function handleSave() {
    setSaving(true)
    const parsed = Array.from(slots).map(k => { const [day,time] = k.split('-'); return { day, time } })
    await onSave(parsed)
    setSaving(false)
  }

  return (
    <div>
      <div style={{ overflowX:'auto', marginBottom:16 }}>
        <div style={{ minWidth:340 }}>
          <div style={{ display:'grid', gridTemplateColumns:'80px repeat(7,1fr)', gap:4, marginBottom:4 }}>
            <div />
            {DAYS.map(d => (
              <div key={d} style={{ textAlign:'center', color:'#555', fontSize:10, fontWeight:800, textTransform:'uppercase' }}>
                {DAY_LABEL[d]}
              </div>
            ))}
          </div>
          {TIMES.map(t => (
            <div key={t} style={{ display:'grid', gridTemplateColumns:'80px repeat(7,1fr)', gap:4, marginBottom:4 }}>
              <div style={{ color:'#555', fontSize:10, fontWeight:700, textTransform:'capitalize', paddingTop:6 }}>{t}</div>
              {DAYS.map(d => {
                const k = `${d}-${t}` as Key
                const on = slots.has(k)
                return (
                  <button key={d} onClick={() => toggle(d,t)} style={{
                    height:32, borderRadius:4, border:`1px solid ${on ? '#39FF14' : '#333'}`,
                    background: on ? '#39FF14' : '#111', cursor:'pointer',
                  }} />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} style={{
        width:'100%', padding:'12px', borderRadius:8, border:'none',
        background: saving ? '#222' : '#39FF14', color: saving ? '#555' : '#000',
        fontWeight:800, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer',
      }}>
        {saving ? 'Saving…' : 'Save availability'}
      </button>
    </div>
  )
}

// ─── EditModal ────────────────────────────────────────────────────────────────
type FieldDef = { key: string; label: string; type: 'text'|'select'|'textarea'|'number'|'availability'; opts?: string[] }

function EditModal({ field, profile, onClose, onSaved }: {
  field: FieldDef; profile: Profile
  onClose: () => void; onSaved: (patch: Partial<Profile>) => void
}) {
  const rawVal = (profile as any)[field.key]
  const [value, setValue] = useState<string>(rawVal != null ? String(rawVal) : '')
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  async function handleSave() {
    setSaving(true); setErr('')
    const body = field.key === 'surface'
      ? { surface: value.split(',').map(s => s.trim()).filter(Boolean) }
      : { [field.key]: field.type === 'number' ? (parseInt(value) || null) : value || null }
    const ok = await saveField(profile.id, body)
    if (ok) { onSaved(body as Partial<Profile>); onClose() }
    else    { setErr('Failed to save. Try again.'); setSaving(false) }
  }

  async function handleAvailSave(slots: AvailSlot[]) {
    const ok = await saveField(profile.id, { availability: slots })
    if (ok) { onSaved({ availability: slots }); onClose() }
    else    { setErr('Failed to save.') }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}
    >
      <div style={{ background:'#111', border:'1px solid #222', borderRadius:14, padding:24, width:'100%', maxWidth:420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ color:'#fff', fontWeight:900, fontSize:17, margin:0 }}>Edit {field.label}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {field.type === 'availability' ? (
          <AvailabilityEditor initial={profile.availability} onSave={handleAvailSave} />
        ) : field.type === 'select' ? (
          <select value={value} onChange={e => setValue(e.target.value)} style={{
            width:'100%', background:'#1a1a1a', border:'1px solid #333', borderRadius:8,
            color: value ? '#fff' : '#444', padding:'12px 14px', fontSize:14, outline:'none', marginBottom:16,
          }}>
            <option value="">Select…</option>
            {field.opts?.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            value={value} onChange={e => setValue(e.target.value)} rows={4}
            placeholder={`Write your ${field.label.toLowerCase()}…`}
            style={{ width:'100%', boxSizing:'border-box', background:'#1a1a1a', border:'1px solid #333', borderRadius:8, color:'#fff', padding:'12px 14px', fontSize:14, outline:'none', resize:'vertical', marginBottom:16 }}
          />
        ) : (
          <input
            type={field.type} value={value} onChange={e => setValue(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}…`}
            style={{ width:'100%', boxSizing:'border-box', background:'#1a1a1a', border:'1px solid #333', borderRadius:8, color:'#fff', padding:'12px 14px', fontSize:14, outline:'none', marginBottom:16 }}
          />
        )}

        {err && <p style={{ color:'#e87070', fontSize:13, margin:'0 0 12px' }}>{err}</p>}

        {field.type !== 'availability' && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:8, border:'1px solid #333', background:'#1a1a1a', color:'#aaa', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:8, border:'none', background: saving ? '#333' : '#39FF14', color: saving ? '#666' : '#000', fontWeight:800, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FieldCard ────────────────────────────────────────────────────────────────
function FieldCard({ icon, label, value, isOwn, onClick }: {
  icon: string; label: string; value?: string | null
  isOwn: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isOwn}
      style={{
        background:'#111', border:'1px solid #222', borderRadius:10,
        padding:'14px 12px', textAlign:'left', cursor: isOwn ? 'pointer' : 'default',
        display:'flex', flexDirection:'column', gap:6, width:'100%',
        transition:'border-color 0.15s',
      }}
      onMouseEnter={e => { if (isOwn) (e.currentTarget as HTMLElement).style.borderColor = '#39FF14' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#222' }}
    >
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={{ color:'#555', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:0.7 }}>{label}</span>
      <span style={{ color: value ? '#fff' : '#333', fontSize:12, fontWeight: value ? 700 : 500, lineHeight:1.4 }}>
        {value || '+ Add'}
      </span>
    </button>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
const FIELD_DEFS: FieldDef[] = [
  { key:'country',       label:'Country',        type:'text'         },
  { key:'level',         label:'Tennis Level',   type:'select', opts: LEVEL_OPTS   },
  { key:'play_style',    label:'Play Style',     type:'select', opts: STYLE_OPTS   },
  { key:'dominant_hand', label:'Dominant Hand',  type:'select', opts: HAND_OPTS    },
  { key:'backhand',      label:'Backhand',       type:'select', opts: BACK_OPTS    },
  { key:'surface',       label:'Surfaces',       type:'text'         },
  { key:'availability',  label:'Availability',   type:'availability' },
  { key:'years_playing', label:'Years Playing',  type:'number'       },
  { key:'bio',           label:'Bio',            type:'textarea'     },
]

const FIELD_ICONS: Record<string, string> = {
  country:'🌍', level:'📶', play_style:'⚡', dominant_hand:'✋',
  backhand:'🔁', surface:'🎾', availability:'📅', years_playing:'⏱', bio:'📝',
}

function OverviewTab({ profile, isOwn, onPatch }: {
  profile: Profile; isOwn: boolean; onPatch: (p: Partial<Profile>) => void
}) {
  const [editField, setEditField] = useState<FieldDef | null>(null)

  function displayValue(key: string): string | null {
    const val = (profile as any)[key]
    if (key === 'surface')      return Array.isArray(val) ? val.join(', ') : val
    if (key === 'availability') return profile.availability?.length ? `${profile.availability.length} slots set` : null
    if (val == null || val === '') return null
    return String(val)
  }

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:28 }}>
        {FIELD_DEFS.map(f => (
          <FieldCard key={f.key}
            icon={FIELD_ICONS[f.key]} label={f.label}
            value={displayValue(f.key)}
            isOwn={isOwn}
            onClick={() => isOwn && setEditField(f)}
          />
        ))}
      </div>

      {profile.availability?.length > 0 && (
        <div style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:16, marginBottom:24 }}>
          <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 14px' }}>Availability</p>
          <AvailabilityGrid availability={profile.availability} />
          {isOwn && (
            <button onClick={() => setEditField(FIELD_DEFS.find(f => f.key === 'availability')!)}
              style={{ marginTop:12, background:'none', border:'1px solid #333', borderRadius:6, color:'#555', fontSize:12, padding:'7px 14px', cursor:'pointer', fontWeight:700 }}>
              Edit slots
            </button>
          )}
        </div>
      )}

      {editField && (
        <EditModal
          field={editField} profile={profile}
          onClose={() => setEditField(null)}
          onSaved={patch => { onPatch(patch); setEditField(null) }}
        />
      )}
    </>
  )
}

// ─── PARTNERS TAB ─────────────────────────────────────────────────────────────
function PartnersTab({ received, sent }: { received: Request[]; sent: Request[] }) {
  const accepted = [
    ...received.filter(r => r.status === 'accepted').map(r => ({
      name: r.requester_name ?? '—', city: r.requester_city ?? '', id: null as string|null,
    })),
    ...sent.filter(r => r.status === 'accepted').map(r => ({
      name: r.to_profile?.name ?? '—', city: r.to_profile?.city ?? '', id: r.to_profile?.id ?? null,
    })),
  ]

  if (accepted.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'48px 0' }}>
        <p style={{ fontSize:36, marginBottom:12 }}>🎾</p>
        <p style={{ color:'#fff', fontWeight:800, fontSize:16, margin:'0 0 6px' }}>No partners yet</p>
        <p style={{ color:'#555', fontSize:13, margin:0 }}>Accept sparring requests to build your network</p>
      </div>
    )
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      {accepted.map((p, i) => (
        <div key={i} style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#39FF14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#000', marginBottom:10 }}>
            {(p.name[0] ?? '?').toUpperCase()}
          </div>
          <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 2px' }}>{p.name}</p>
          <p style={{ color:'#555', fontSize:12, margin:'0 0 8px' }}>{p.city}</p>
          <span style={{ background:'#0a1a0a', color:'#39FF14', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:4 }}>Played together</span>
        </div>
      ))}
    </div>
  )
}

// ─── REQUESTS TAB ─────────────────────────────────────────────────────────────
function RequestsTab({ profileId, email }: { profileId: string; email: string }) {
  const [received, setReceived] = useState<Request[]>([])
  const [sent,     setSent]     = useState<Request[]>([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState<string | null>(null)

  useEffect(() => {
    if (!email) return
    Promise.all([
      fetch(`${BACKEND}/sparring/requests/received?email=${encodeURIComponent(email)}`).then(r => r.ok ? r.json() : { requests:[] }),
      fetch(`${BACKEND}/sparring/requests/sent?email=${encodeURIComponent(email)}`).then(r => r.ok ? r.json() : { requests:[] }),
    ]).then(([rec, snt]) => {
      setReceived(rec.requests ?? [])
      setSent(snt.requests ?? [])
    }).finally(() => setLoading(false))
  }, [email])

  async function accept(id: string) {
    setActing(id)
    const res = await fetch(`${BACKEND}/sparring/requests/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'accepted' }),
    })
    if (res.ok) {
      const updated = await res.json()
      setReceived(prev => prev.map(r => r.id === id ? { ...r, status:'accepted', from_phone: updated.from_phone ?? r.from_phone } : r))
    }
    setActing(null)
  }

  async function decline(id: string) {
    setActing(id)
    const res = await fetch(`${BACKEND}/sparring/requests/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'declined' }),
    })
    if (res.ok) setReceived(prev => prev.map(r => r.id === id ? { ...r, status:'declined' } : r))
    setActing(null)
  }

  if (loading) return <p style={{ color:'#555', textAlign:'center', padding:'32px 0', fontSize:14 }}>Loading…</p>

  const s = (status: string) => STATUS_STYLE[status] ?? STATUS_STYLE.pending

  return (
    <div>
      <p style={{ color:'#555', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1, margin:'0 0 12px' }}>
        Received ({received.length})
      </p>
      {received.length === 0
        ? <p style={{ color:'#333', fontSize:14, marginBottom:28 }}>No requests received yet.</p>
        : received.map(req => (
          <div key={req.id} style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: req.status === 'pending' ? 10 : 0 }}>
              <div>
                <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 2px' }}>{req.requester_name}</p>
                <p style={{ color:'#555', fontSize:12, margin:0 }}>{req.requester_city} · {timeAgo(req.created_at)}</p>
              </div>
              <span style={{ background:s(req.status).bg, color:s(req.status).color, fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:4 }}>
                {s(req.status).label}
              </span>
            </div>
            {req.status === 'accepted' && req.from_phone && (
              <div style={{ marginTop:8, background:'#0a1a0a', border:'1px solid #1a3a1a', borderRadius:6, padding:'8px 12px' }}>
                <p style={{ color:'#555', fontSize:10, margin:'0 0 2px', textTransform:'uppercase', fontWeight:800 }}>Their number</p>
                <p style={{ color:'#39FF14', fontSize:15, fontWeight:800, margin:0 }}>{req.from_phone}</p>
              </div>
            )}
            {req.status === 'pending' && (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => decline(req.id)} disabled={!!acting}
                  style={{ flex:1, background:'#1a1a1a', border:'1px solid #333', borderRadius:6, color:'#aaa', fontWeight:700, fontSize:13, padding:'9px', cursor: acting ? 'not-allowed' : 'pointer' }}>
                  Decline
                </button>
                <button onClick={() => accept(req.id)} disabled={!!acting}
                  style={{ flex:2, background: acting === req.id ? '#333' : '#39FF14', border:'none', borderRadius:6, color: acting === req.id ? '#666' : '#000', fontWeight:800, fontSize:13, padding:'9px', cursor: acting ? 'not-allowed' : 'pointer' }}>
                  {acting === req.id ? 'Accepting…' : 'Accept'}
                </button>
              </div>
            )}
          </div>
        ))
      }

      <p style={{ color:'#555', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1, margin:'24px 0 12px' }}>
        Sent ({sent.length})
      </p>
      {sent.length === 0
        ? <p style={{ color:'#333', fontSize:14 }}>No requests sent yet.</p>
        : sent.map(req => {
          const p = req.to_profile
          return (
            <div key={req.id} style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:'0 0 2px' }}>{p?.name ?? '—'}</p>
                  <p style={{ color:'#555', fontSize:12, margin:0 }}>{p?.city}{p?.country ? `, ${p.country}` : ''} · {timeAgo(req.created_at)}</p>
                </div>
                <span style={{ background:s(req.status).bg, color:s(req.status).color, fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:4 }}>
                  {s(req.status).label}
                </span>
              </div>
              {req.status === 'accepted' && p?.phone && (
                <div style={{ marginTop:8, background:'#0a1a0a', border:'1px solid #1a3a1a', borderRadius:6, padding:'8px 12px' }}>
                  <p style={{ color:'#555', fontSize:10, margin:'0 0 2px', textTransform:'uppercase', fontWeight:800 }}>Their number</p>
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

// ─── UPLOAD BUTTON ────────────────────────────────────────────────────────────
function UploadBtn({ label, onChange }: { label: string; onChange: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = '' }} />
      <button onClick={() => ref.current?.click()} style={{
        background:'rgba(0,0,0,0.6)', border:'1px solid #333', borderRadius:6,
        color:'#ccc', fontSize:11, fontWeight:700, padding:'5px 10px', cursor:'pointer',
      }}>
        {label}
      </button>
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'partners' | 'requests'

export default function SparringProfilePage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const { user, profile: authProfile } = useAuth()

  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<TabId>('overview')
  const [coverUploading, setCoverUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showRequest, setShowRequest] = useState(false)

  const isOwn   = typeof window !== 'undefined' && localStorage.getItem('sparring_profile_id') === id
  const ownEmail = typeof window !== 'undefined' ? (localStorage.getItem('sparring_email') ?? '') : ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/sparring/profiles/${id}`)
      if (res.ok) setProfile(await res.json())
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  // partners count from requests (if own profile)
  const [received, setReceived] = useState<Request[]>([])
  const [sent,     setSent]     = useState<Request[]>([])
  useEffect(() => {
    if (!isOwn || !ownEmail) return
    Promise.all([
      fetch(`${BACKEND}/sparring/requests/received?email=${encodeURIComponent(ownEmail)}`).then(r => r.ok ? r.json() : {requests:[]}),
      fetch(`${BACKEND}/sparring/requests/sent?email=${encodeURIComponent(ownEmail)}`).then(r => r.ok ? r.json() : {requests:[]}),
    ]).then(([rec, snt]) => {
      setReceived(rec.requests ?? [])
      setSent(snt.requests ?? [])
    })
  }, [isOwn, ownEmail])

  async function handleCoverUpload(file: File) {
    if (!profile) return
    setCoverUploading(true)
    const url = await uploadFile(file, `covers/${profile.id}`)
    if (url) {
      await saveField(profile.id, { cover_url: url })
      setProfile(p => p ? { ...p, cover_url: url } : p)
    }
    setCoverUploading(false)
  }

  async function handleAvatarUpload(file: File) {
    if (!profile) return
    setAvatarUploading(true)
    const url = await uploadFile(file, `avatars/${profile.id}`)
    if (url) {
      await saveField(profile.id, { photo_url: url })
      setProfile(p => p ? { ...p, photo_url: url } : p)
    }
    setAvatarUploading(false)
  }

  function patchProfile(patch: Partial<Profile>) {
    setProfile(p => p ? { ...p, ...patch } : p)
  }

  function handleRequestClick() {
    const hasProfile = !!localStorage.getItem('sparring_profile_id')
    if (!hasProfile) { router.push('/sparring/create?from=request'); return }
    setShowRequest(true)
  }

  if (loading) {
    return (
      <div style={{ background:'#000', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #1a1a1a', borderTopColor:'#39FF14', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ background:'#000', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
        <p style={{ color:'#fff', fontWeight:800, fontSize:18, margin:0 }}>Profile not found</p>
        <Link href="/sparring" style={{ color:'#39FF14', fontSize:14 }}>← Back to sparring</Link>
      </div>
    )
  }

  const levelColor = LEVEL_COLOR[profile.level] ?? '#6ee86e'
  const initials   = (profile.name ?? '?')[0].toUpperCase()
  const isCoach    = profile.role === 'coach'
  const partnersCount =
    received.filter(r => r.status === 'accepted').length +
    sent.filter(r => r.status === 'accepted').length

  const tabs: { id: TabId; label: string }[] = [
    { id:'overview', label:'Overview' },
    { id:'partners', label:`Partners${isOwn && partnersCount > 0 ? ` (${partnersCount})` : ''}` },
    ...(isOwn ? [{ id:'requests' as TabId, label:`Requests${received.filter(r=>r.status==='pending').length > 0 ? ` · ${received.filter(r=>r.status==='pending').length}` : ''}` }] : []),
  ]

  return (
    <div style={{ background:'#000', minHeight:'100vh', paddingBottom:80 }}>

      {/* ── Cover ── */}
      <div style={{ height:200, position:'relative', overflow:'hidden', background:'#0a0a0a' }}>
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          /* CSS tennis court line pattern */
          <div style={{ width:'100%', height:'100%', position:'relative' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0d1a0d 0%,#080808 60%,#0a0a14 100%)' }} />
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.09 }} viewBox="0 0 700 200" preserveAspectRatio="xMidYMid slice">
              <rect x="60" y="16" width="580" height="168" fill="none" stroke="#39FF14" strokeWidth="1.5"/>
              <line x1="350" y1="16" x2="350" y2="184" stroke="#39FF14" strokeWidth="1"/>
              <line x1="60" y1="100" x2="640" y2="100" stroke="#39FF14" strokeWidth="1"/>
              <rect x="185" y="16" width="330" height="84" fill="none" stroke="#39FF14" strokeWidth="1"/>
              <rect x="185" y="100" width="330" height="84" fill="none" stroke="#39FF14" strokeWidth="1"/>
              <line x1="350" y1="90" x2="350" y2="110" stroke="#39FF14" strokeWidth="2"/>
            </svg>
          </div>
        )}
        {/* gradient fade bottom */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:80, background:'linear-gradient(transparent,#000)' }} />
        {/* back link */}
        <Link href="/sparring" style={{
          position:'absolute', top:14, left:16, color:'#ccc', fontSize:13, fontWeight:700,
          textDecoration:'none', background:'rgba(0,0,0,0.5)', padding:'5px 10px', borderRadius:6,
        }}>← Back</Link>
        {/* cover upload */}
        {isOwn && (
          <div style={{ position:'absolute', bottom:14, right:16 }}>
            {coverUploading
              ? <span style={{ color:'#39FF14', fontSize:12, fontWeight:700 }}>Uploading…</span>
              : <UploadBtn label="📷 Change cover" onChange={handleCoverUpload} />
            }
          </div>
        )}
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'0 16px' }}>

        {/* ── Avatar row ── */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:-48, marginBottom:16 }}>
          <div style={{ position:'relative' }}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name}
                style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover', objectPosition:'top', border:'4px solid #000', display:'block' }} />
            ) : (
              <div style={{ width:96, height:96, borderRadius:'50%', border:'4px solid #000', background:'#39FF14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, fontWeight:900, color:'#000' }}>
                {initials}
              </div>
            )}
            {isOwn && (
              <div style={{ position:'absolute', bottom:2, right:2 }}>
                {avatarUploading
                  ? <span style={{ background:'rgba(0,0,0,0.8)', color:'#39FF14', fontSize:10, padding:'2px 4px', borderRadius:4 }}>…</span>
                  : <UploadBtn label="✏️" onChange={handleAvatarUpload} />
                }
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ paddingBottom:8 }}>
            {isOwn ? (
              <Link href="/sparring/create" style={{
                background:'#39FF14', color:'#000', fontWeight:800, fontSize:13,
                padding:'9px 18px', borderRadius:8, textDecoration:'none', display:'inline-block',
              }}>
                Edit Profile
              </Link>
            ) : (
              <button onClick={handleRequestClick} style={{
                background: isCoach ? '#8080ff' : '#39FF14', border:'none', borderRadius:8,
                color:'#000', fontWeight:900, fontSize:14, padding:'10px 20px', cursor:'pointer',
              }}>
                {isCoach ? 'Request Session' : 'Request to Play'}
              </button>
            )}
          </div>
        </div>

        {/* ── Level badge + name ── */}
        <div style={{ marginBottom:20 }}>
          <span style={{
            display:'inline-block', border:`1px solid ${levelColor}`, borderRadius:20,
            color: levelColor, fontSize:11, fontWeight:800, padding:'3px 12px', marginBottom:8,
            textTransform:'capitalize', letterSpacing:0.5,
          }}>
            {isCoach ? '🎓 Coach' : `🎾 ${profile.level}`}
          </span>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, margin:'0 0 2px', letterSpacing:-0.4 }}>{profile.name}</h1>
          <p style={{ color:'#444', fontSize:13, margin:'0 0 2px', fontWeight:600 }}>@{profile.city?.toLowerCase().replace(/\s+/g,'_')}</p>
          <p style={{ color:'#333', fontSize:13, margin:0 }}>
            {partnersCount} partner{partnersCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1e1e1e', marginBottom:24 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'11px 18px', background:'none', border:'none', cursor:'pointer',
              color: tab === t.id ? '#39FF14' : '#555', fontWeight:800, fontSize:13,
              borderBottom: tab === t.id ? '2px solid #39FF14' : '2px solid transparent',
              marginBottom:-1, transition:'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {tab === 'overview' && (
          <OverviewTab profile={profile} isOwn={isOwn} onPatch={patchProfile} />
        )}
        {tab === 'partners' && (
          <PartnersTab received={received} sent={sent} />
        )}
        {tab === 'requests' && isOwn && (
          <RequestsTab profileId={profile.id} email={ownEmail} />
        )}
      </div>

      {/* ── Request modal (non-own profile) ── */}
      {showRequest && !isOwn && (
        <RequestModal profile={profile} onClose={() => setShowRequest(false)} />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── REQUEST MODAL (non-own profiles) ────────────────────────────────────────
const CC = [
  { code:'+91', flag:'🇮🇳' }, { code:'+1',  flag:'🇺🇸' },
  { code:'+44', flag:'🇬🇧' }, { code:'+61', flag:'🇦🇺' },
  { code:'+971',flag:'🇦🇪' }, { code:'+65', flag:'🇸🇬' },
]

function RequestModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [requesterName, setRequesterName] = useState('')
  const [requesterCity, setRequesterCity] = useState('')
  const [fromEmail,     setFromEmail]     = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sparring_email') ?? '' : '')
  const [cc,            setCc]            = useState('+91')
  const [phone,         setPhone]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [sent,          setSent]          = useState(false)
  const [error,         setError]         = useState('')

  const f: React.CSSProperties = { width:'100%', boxSizing:'border-box', background:'#1a1a1a', border:'1px solid #333', borderRadius:6, color:'#fff', padding:'10px 12px', fontSize:14, outline:'none', marginBottom:12 }

  async function send() {
    if (!requesterName.trim()) { setError('Enter your name'); return }
    if (!requesterCity.trim()) { setError('Enter your city'); return }
    if (!fromEmail.trim() || !fromEmail.includes('@')) { setError('Enter a valid email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${BACKEND}/sparring/requests`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          to_profile_id:   profile.id,
          from_profile_id: typeof window !== 'undefined' ? localStorage.getItem('sparring_profile_id') || undefined : undefined,
          requester_name:  requesterName.trim(),
          requester_city:  requesterCity.trim(),
          from_email:      fromEmail.trim().toLowerCase(),
          from_phone:      phone.trim() ? `${cc}${phone.trim()}` : undefined,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Failed') }
      setSent(true)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const isCoach = profile.role === 'coach'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#111', border:'1px solid #222', borderRadius:14, padding:24, width:'100%', maxWidth:380 }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p style={{ color:'#fff', fontWeight:800, fontSize:18, margin:'0 0 8px' }}>Request sent!</p>
            <p style={{ color:'#555', fontSize:14, margin:'0 0 20px' }}>{profile.name} will see your request.</p>
            <button onClick={onClose} style={{ background:'#39FF14', color:'#000', fontWeight:800, fontSize:14, padding:'10px 20px', borderRadius:6, border:'none', cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <p style={{ color:'#fff', fontWeight:900, fontSize:18, margin:'0 0 4px' }}>{isCoach ? 'Request a session' : 'Request to play'}</p>
            <p style={{ color:'#555', fontSize:13, margin:'0 0 20px' }}>with {profile.name}</p>
            <label style={{ color:'#aaa', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>Your name</label>
            <input value={requesterName} onChange={e => setRequesterName(e.target.value)} placeholder="e.g. Alex" style={f} />
            <label style={{ color:'#aaa', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>Your city</label>
            <input value={requesterCity} onChange={e => setRequesterCity(e.target.value)} placeholder="e.g. London" style={f} />
            <label style={{ color:'#aaa', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>Your email</label>
            <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@example.com" type="email" style={f} />
            <label style={{ color:'#aaa', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>Phone (optional)</label>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              <select value={cc} onChange={e => setCc(e.target.value)} style={{ background:'#1a1a1a', border:'1px solid #333', borderRadius:6, color:'#fff', padding:'10px 6px', fontSize:13, outline:'none', flexShrink:0 }}>
                {CC.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} placeholder="Phone number" inputMode="tel" style={{ ...f, flex:1, marginBottom:0 }} />
            </div>
            {error && <p style={{ color:'#e87070', fontSize:13, margin:'0 0 12px' }}>{error}</p>}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onClose} style={{ flex:1, background:'#1a1a1a', border:'1px solid #333', borderRadius:6, color:'#aaa', fontWeight:700, fontSize:14, padding:'10px', cursor:'pointer' }}>Cancel</button>
              <button onClick={send} disabled={loading} style={{ flex:2, background: loading ? '#333' : '#39FF14', border:'none', borderRadius:6, color: loading ? '#666' : '#000', fontWeight:800, fontSize:14, padding:'10px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
