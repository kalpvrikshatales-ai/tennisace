'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const DAYS  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const TIMES = ['morning', 'afternoon', 'evening'] as const

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: '#1a3a1a', color: '#6ee86e' },
  intermediate: { bg: '#1a2a3a', color: '#6eb8e8' },
  advanced:     { bg: '#3a1a1a', color: '#e87070' },
  competitive:  { bg: '#39FF14', color: '#000'    },
}

const PLAY_ICON: Record<string, string> = {
  rally:       '🎯',
  match_play:  '🏆',
  drills:      '🔄',
  both:        '⚡',
}

type Profile = {
  id: string
  name: string
  photo_url?: string
  city: string
  country: string
  level: string
  surface: string[]
  play_type?: string
  bio?: string
  role?: string
  favorite_players?: string
  coaching_level?: string
  coaching_fee?: string
  created_at: string
  availability: { day: string; time: string }[]
}

function AvailabilityGrid({ availability }: { availability: { day: string; time: string }[] }) {
  const filled = new Set(availability.map(a => `${a.day}-${a.time}`))
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        <div />
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>
      {TIMES.map(t => (
        <div key={t} style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          <div style={{ color: '#555', fontSize: 11, fontWeight: 600, textTransform: 'capitalize', paddingTop: 8 }}>
            {t}
          </div>
          {DAYS.map(d => {
            const on = filled.has(`${d}-${t}`)
            return (
              <div key={d} style={{ height: 32, borderRadius: 4, background: on ? '#39FF14' : '#1a1a1a', border: `1px solid ${on ? '#39FF14' : '#2a2a2a'}` }} />
            )
          })}
        </div>
      ))}
    </div>
  )
}

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳' },
  { code: '+1',  flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+61', flag: '🇦🇺' },
  { code: '+971',flag: '🇦🇪' },
  { code: '+65', flag: '🇸🇬' },
]

function RequestModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [requesterName, setRequesterName] = useState('')
  const [requesterCity, setRequesterCity] = useState('')
  const [fromEmail,     setFromEmail]     = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('sparring_email') ?? '') : ''
  )
  const [countryCode,   setCountryCode]   = useState('+91')
  const [phoneNumber,   setPhoneNumber]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const fieldStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#1a1a1a', border: '1px solid #333', borderRadius: 6,
    color: '#fff', padding: '10px 12px', fontSize: 14,
    outline: 'none', marginBottom: 12,
  }

  const send = async () => {
    if (!requesterName.trim()) { setError('Enter your name'); return }
    if (!requesterCity.trim()) { setError('Enter your city'); return }
    if (!fromEmail.trim() || !fromEmail.includes('@')) { setError('Enter a valid email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${BACKEND}/sparring/requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_profile_id:   profile.id,
          from_profile_id: localStorage.getItem('sparring_profile_id') || undefined,
          requester_name:  requesterName.trim(),
          requester_city:  requesterCity.trim(),
          from_email:      fromEmail.trim().toLowerCase(),
          from_phone:      phoneNumber.trim() ? `${countryCode}${phoneNumber.trim()}` : undefined,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Failed') }
      setSent(true)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380 }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>Request sent!</p>
            <p style={{ color: '#555', fontSize: 14, margin: '0 0 4px' }}>{profile.name} will see your request.</p>
            <p style={{ color: '#444', fontSize: 13, margin: '0 0 20px' }}>Your contact is shared only if they accept.</p>
            <button onClick={onClose} style={{ background: '#39FF14', color: '#000', fontWeight: 800, fontSize: 14, padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>
              {profile.role === 'coach' ? 'Request a session' : 'Request to play'}
            </p>
            <p style={{ color: '#555', fontSize: 13, margin: '0 0 20px' }}>
              {profile.role === 'coach' ? `Request a coaching session with ${profile.name}` : `Send a sparring request to ${profile.name}`}
            </p>

            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Your name</label>
            <input value={requesterName} onChange={e => setRequesterName(e.target.value)} placeholder="e.g. Alex" style={fieldStyle} />

            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Your city</label>
            <input value={requesterCity} onChange={e => setRequesterCity(e.target.value)} placeholder="e.g. London" style={fieldStyle} />

            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Your email (to track requests)</label>
            <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@example.com" type="email" style={fieldStyle} />

            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Your phone (optional — shared only if accepted)</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#fff', padding: '10px 6px', fontSize: 13, outline: 'none', flexShrink: 0 }}>
                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Phone number" inputMode="tel"
                style={{ ...fieldStyle, flex: 1, marginBottom: 0 }} />
            </div>
            <p style={{ color: '#444', fontSize: 11, margin: '0 0 14px' }}>Leave blank to skip.</p>

            {error && <p style={{ color: '#e87070', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#aaa', fontWeight: 700, fontSize: 14, padding: '10px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={send} disabled={loading}
                style={{ flex: 2, background: loading ? '#333' : '#39FF14', border: 'none', borderRadius: 6, color: loading ? '#666' : '#000', fontWeight: 800, fontSize: 14, padding: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SparringProfilePage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  function handleRequestClick() {
    if (!localStorage.getItem('sparring_profile_id')) {
      router.push('/sparring/create?from=request')
      return
    }
    setShowModal(true)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/sparring/profiles/${id}`)
      if (res.ok) setProfile(await res.json())
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setIsOwnProfile(localStorage.getItem('sparring_profile_id') === id)
  }, [id])

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555', fontSize: 14 }}>Loading profile…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: 0 }}>Profile not found</p>
        <Link href="/sparring" style={{ color: '#39FF14', fontSize: 14 }}>← Back to sparring</Link>
      </div>
    )
  }

  const lvl         = LEVEL_STYLE[profile.level] ?? LEVEL_STYLE.beginner
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isCoach     = profile.role === 'coach'

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ padding: '12px 16px 0' }}>
        <Link href="/sparring" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', height: 280, background: '#111', overflow: 'hidden' }}>
        {profile.photo_url ? (
          <img src={profile.photo_url} alt={profile.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCoach ? '#0a0a1a' : '#0a1a0a' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: isCoach ? '#8080ff' : '#39FF14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 900, color: '#000' }}>
              {(profile.name ?? '?')[0].toUpperCase()}
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(transparent, #000)' }} />
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>

        {/* Name + role + level */}
        <div style={{ marginTop: -24, marginBottom: 20 }}>
          {/* Role badge — prominent */}
          <div style={{ marginBottom: 8 }}>
            <span style={{
              display: 'inline-block',
              background: isCoach ? '#1a1a3a' : '#0a1a0a',
              color:      isCoach ? '#8080ff' : '#39FF14',
              fontSize: 12, fontWeight: 900, padding: '4px 10px', borderRadius: 5,
              textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {isCoach ? '🎓 Coach' : '🎾 Player'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>
                {profile.name}
              </h1>
              <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 2px', fontWeight: 600 }}>
                📍 {profile.city}, {profile.country}
              </p>
              <p style={{ color: '#444', fontSize: 12, margin: 0 }}>
                Member since {memberSince}
              </p>
            </div>
            <span style={{ background: lvl.bg, color: lvl.color, fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 5, textTransform: 'capitalize', whiteSpace: 'nowrap', marginBottom: 4 }}>
              {profile.level}
            </span>
          </div>
        </div>

        {/* Coach info card */}
        {isCoach && (profile.coaching_level || profile.coaching_fee) && (
          <div style={{ background: '#0d0d1f', border: '1px solid #2a2a5a', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ color: '#8080ff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
              Coaching Info
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {profile.coaching_level && (
                <div>
                  <p style={{ color: '#555', fontSize: 11, margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase' }}>Trains</p>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>{profile.coaching_level}</p>
                </div>
              )}
              {profile.coaching_fee && (
                <div>
                  <p style={{ color: '#555', fontSize: 11, margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase' }}>Sessions</p>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>{profile.coaching_fee}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{profile.bio}</p>
          </div>
        )}

        {/* Favourite players */}
        {profile.favorite_players && (
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ color: '#555', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>
              Favourite players
            </p>
            <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>{profile.favorite_players}</p>
          </div>
        )}

        {/* Surfaces + play type */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {profile.surface.map(s => (
            <span key={s} style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', color: '#ccc', fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 5 }}>
              {s}
            </span>
          ))}
          {!isCoach && profile.play_type && (
            <span style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', color: '#ccc', fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 5 }}>
              {PLAY_ICON[profile.play_type] ?? '🎾'} {profile.play_type.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Availability */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '16px', marginBottom: 20 }}>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 14px' }}>Availability</p>
          <AvailabilityGrid availability={profile.availability} />
        </div>

        {/* CTA */}
        {isOwnProfile ? (
          <Link href="/sparring/create" style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            background: '#1a1a1a', border: '1px solid #333', borderRadius: 8,
            color: '#aaa', fontWeight: 800, fontSize: 16, padding: '16px',
            textAlign: 'center', textDecoration: 'none', letterSpacing: -0.3,
          }}>
            Edit my profile
          </Link>
        ) : (
          <button onClick={handleRequestClick}
            style={{ width: '100%', background: isCoach ? '#8080ff' : '#39FF14', border: 'none', borderRadius: 8, color: '#000', fontWeight: 900, fontSize: 16, padding: '16px', cursor: 'pointer', letterSpacing: -0.3 }}>
            {isCoach ? 'Request a Session' : 'Request to Play'}
          </button>
        )}
      </div>

      {showModal && <RequestModal profile={profile} onClose={() => setShowModal(false)} />}
    </div>
  )
}
