'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import SparringFilters from './SparringFilters'
import SparringShell from './SparringShell'
import { useAuth } from '@/components/AuthProvider'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

type PlayRequest = {
  id:             string
  city:           string
  date:           string
  time_slot:      string
  players_needed: number
  level?:         string
  surface?:       string
  format?:        string
  location_name?: string
  status:         string
  join_count:     number
  spots_left:     number
  creator: { id?: string; name?: string; photo_url?: string; founding_number?: number }
}

const FORMAT_LABEL: Record<string, string> = {
  singles: 'Singles', doubles: 'Doubles', hitting: 'Hitting', coaching: 'Coaching',
}

function fmtDateShort(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00Z')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  } catch { return iso }
}

function PlayRequestMiniCard({
  req, ownId, onJoin, onCancel,
}: {
  req: PlayRequest
  ownId: string | null
  onJoin: (id: string) => Promise<{ creator_phone?: string } | null>
  onCancel: (id: string) => Promise<void>
}) {
  const [joining,  setJoining]  = useState(false)
  const [joined,   setJoined]   = useState(false)
  const [phone,    setPhone]    = useState<string | null>(null)
  const [error,    setError]    = useState('')

  const isOwn  = ownId && req.creator?.id === ownId
  const isFull = req.spots_left <= 0

  async function handleJoin() {
    if (!ownId) { window.location.href = '/sparring/create'; return }
    setJoining(true); setError('')
    const res = await onJoin(req.id)
    setJoining(false)
    if (res) { setJoined(true); if (res.creator_phone) setPhone(res.creator_phone) }
    else setError('Could not join')
  }

  return (
    <div style={{
      background: 'var(--sr-card)', border: `1px solid ${joined ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--sr-border)'}`,
      borderRadius: 12, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div>
        <p style={{ color: 'var(--sr-text)', fontSize: 16, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.3 }}>
          {fmtDateShort(req.date)}
        </p>
        <p style={{ color: 'color-mix(in srgb, var(--accent) 80%, transparent)', fontSize: 11, fontWeight: 700, margin: 0 }}>
          {req.time_slot}{req.location_name ? ` · ${req.location_name}` : ''}
        </p>
      </div>

      {/* Creator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: req.creator.photo_url
            ? `url(${req.creator.photo_url}) center/cover no-repeat`
            : 'color-mix(in srgb, var(--accent) 15%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, color: 'var(--accent)', overflow: 'hidden',
        }}>
          {!req.creator.photo_url && (req.creator.name ?? '?')[0].toUpperCase()}
        </div>
        <span style={{ color: 'var(--sr-text-2)', fontSize: 12, fontWeight: 600 }}>{req.creator.name}</span>
        {req.creator.founding_number && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 20, flexShrink: 0,
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid var(--accent)',
            color: 'var(--accent)', fontSize: 5, fontWeight: 900,
          }}>#{req.creator.founding_number}</span>
        )}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {req.format  && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)', fontSize: 9, fontWeight: 800, textTransform: 'capitalize' }}>{FORMAT_LABEL[req.format] ?? req.format}</span>}
        {req.level   && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'var(--sr-card-2)', border: '1px solid var(--sr-border)', color: 'var(--sr-muted)', fontSize: 9, fontWeight: 700 }}>{req.level}</span>}
        {req.surface && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'var(--sr-card-2)', border: '1px solid var(--sr-border)', color: 'var(--sr-muted)', fontSize: 9, fontWeight: 700 }}>{req.surface}</span>}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: isFull ? 'rgba(255,80,80,0.7)' : 'var(--sr-accent)', fontSize: 11, fontWeight: 800 }}>
          {isFull ? 'Full' : `${req.spots_left} spot${req.spots_left !== 1 ? 's' : ''} left`}
        </span>
        {joined ? (
          <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 800 }}>
            Joined ✓{phone ? ` · ${phone}` : ''}
          </span>
        ) : isOwn ? (
          <button onClick={() => onCancel(req.id)}
            style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: 'rgba(255,80,80,0.7)', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>
            Cancel
          </button>
        ) : (
          <button onClick={handleJoin} disabled={joining || isFull}
            style={{
              background: 'var(--accent)', color: '#000', fontWeight: 900, fontSize: 12,
              padding: '7px 14px', borderRadius: 7, border: 'none',
              cursor: (joining || isFull) ? 'default' : 'pointer',
              opacity: isFull ? 0.4 : 1,
            }}>
            {joining ? '…' : 'Join →'}
          </button>
        )}
      </div>
      {error && <p style={{ color: 'rgba(255,80,80,0.7)', fontSize: 10, margin: 0 }}>{error}</p>}
    </div>
  )
}

const LEVEL_BADGE: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'rgba(110,232,110,0.12)', color: '#6ee86e' },
  intermediate: { bg: 'rgba(110,184,232,0.12)', color: '#6eb8e8' },
  advanced:     { bg: 'rgba(232,112,112,0.12)', color: '#e87070' },
  competitive:  { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',   color: 'var(--sr-accent)' },
}

function availLine(availability: any[]): string | null {
  if (!availability?.length) return null
  const days  = new Set(availability.map((a: any) => a.day))
  const times = new Set(availability.map((a: any) => a.time))
  const hasWeekend = days.has('sat') || days.has('sun')
  const hasWeekday = ['mon','tue','wed','thu','fri'].some(d => days.has(d))
  if (hasWeekend && !hasWeekday) return 'Free this weekend'
  if (hasWeekend)                return 'Free weekends & weekdays'
  if (hasWeekday && times.has('morning')) return 'Available weekday mornings'
  if (hasWeekday && times.has('evening')) return 'Free evenings'
  if (hasWeekday)                return 'Available weekdays'
  return null
}

function PlayerCard({ p, mutualSlots }: { p: any; mutualSlots?: number }) {
  const [hov, setHov] = useState(false)
  const lvl   = LEVEL_BADGE[p.level] ?? LEVEL_BADGE.beginner
  const avail = p.availability ?? []
  const line  = availLine(avail)

  return (
    <Link href={`/sparring/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'var(--sr-card)',
          border: `1px solid ${hov ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'var(--sr-border)'}`,
          borderRadius: 14,
          overflow: 'hidden',
          transform: hov ? 'translateY(-3px)' : 'none',
          boxShadow: hov ? '0 8px 32px color-mix(in srgb, var(--accent) 8%, transparent), var(--sr-shadow)' : 'var(--sr-shadow-s)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
      >
        {/* Photo */}
        <div style={{ height: 148, background: 'var(--sr-card-2)', position: 'relative', overflow: 'hidden' }}>
          {p.photo_url ? (
            <img src={p.photo_url} alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p.role === 'coach' ? 'rgba(128,128,255,0.08)' : 'color-mix(in srgb, var(--accent) 5%, transparent)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%',
                background: p.role === 'coach' ? '#8080ff' : 'var(--sr-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: 'var(--sr-on-acc)' }}>
                {(p.name ?? '?')[0].toUpperCase()}
              </div>
            </div>
          )}

          {/* Level badge */}
          <span style={{ position: 'absolute', top: 10, right: 10,
            background: lvl.bg, color: lvl.color, border: `1px solid ${lvl.color}33`,
            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
            textTransform: 'capitalize', backdropFilter: 'blur(6px)' }}>
            {p.level}
          </span>

          {/* Role badge */}
          <span style={{ position: 'absolute', top: 10, left: 10,
            background: p.role === 'coach' ? 'rgba(128,128,255,0.2)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
            color: p.role === 'coach' ? '#8080ff' : 'var(--sr-accent)',
            fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 5,
            textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {p.role === 'coach' ? 'Coach' : 'Player'}
          </span>

          {/* Mutual slots */}
          {mutualSlots != null && mutualSlots > 0 && (
            <span style={{ position: 'absolute', bottom: 10, left: 10,
              background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid var(--sr-accent)',
              color: 'var(--sr-accent)', fontSize: 10, fontWeight: 800,
              padding: '3px 8px', borderRadius: 6 }}>
              {mutualSlots} mutual slot{mutualSlots > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 15, margin: 0 }}>{p.name}</p>
            {p.founding_number && (
              <span
                title={`Founding Member #${p.founding_number} · ${p.city}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 30, flexShrink: 0,
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 50%, transparent))',
                  color: 'var(--accent)', fontSize: 7, fontWeight: 900, letterSpacing: 0,
                }}
              >#{p.founding_number}</span>
            )}
          </div>
          <p style={{ color: 'var(--sr-muted)', fontSize: 12, margin: '0 0 10px' }}>
            {[p.city, p.country].filter(Boolean).join(', ')}
          </p>

          {/* Surface tags */}
          {(p.surface ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {(p.surface ?? []).map((s: string) => (
                <span key={s} style={{ background: 'var(--sr-card-2)', border: '1px solid var(--sr-border)',
                  color: 'var(--sr-text-2)', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5 }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Availability line */}
          {line && <p style={{ color: 'var(--sr-muted)', fontSize: 11, margin: '0 0 10px', fontStyle: 'italic' }}>{line}</p>}

          {/* Day dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['mon','tue','wed','thu','fri','sat','sun'].map((d, i) => {
              const active = avail.some((a: any) => a.day === d)
              return (
                <span key={d} style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: active ? 'var(--sr-accent)' : 'var(--sr-border)',
                  color: active ? 'var(--sr-on-acc)' : 'var(--sr-muted)',
                  fontSize: 7, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {['M','T','W','T','F','S','S'][i]}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Section({ title, profiles, ownAvailability }: {
  title: string; profiles: any[]; ownAvailability: Set<string>
}) {
  if (profiles.length === 0) return null
  function mutual(p: any) {
    return ownAvailability.size === 0 ? 0
      : (p.availability ?? []).filter((a: any) => ownAvailability.has(`${a.day}-${a.time}`)).length
  }
  return (
    <div style={{ marginBottom: 36 }}>
      <p style={{ color: 'var(--sr-text)', fontWeight: 900, fontSize: 17, letterSpacing: -0.4, margin: '0 0 14px' }}>{title}</p>
      <div className="sr-scroll">
        {profiles.map(p => (
          <div key={p.id} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0 }}>
            <PlayerCard p={p} mutualSlots={mutual(p)} />
          </div>
        ))}
      </div>
    </div>
  )
}

type Tab = 'players' | 'coaches' | 'play'

export default function SparringDiscover({ initialProfiles }: { initialProfiles: any[] }) {
  const { user, profile } = useAuth()
  const [ownId,           setOwnId]           = useState<string | null>(null)
  const [ownAvailability, setOwnAvailability] = useState<Set<string>>(new Set())
  const [cityLine,        setCityLine]        = useState<{ count: number; city: string } | null>(null)
  const [activeTab,       setActiveTab]       = useState<Tab>('players')
  const [playRequests,    setPlayRequests]    = useState<PlayRequest[]>([])
  const [playLoading,     setPlayLoading]     = useState(false)
  const [ownCity,         setOwnCity]         = useState('')

  useEffect(() => { setOwnId(localStorage.getItem('sparring_profile_id')) }, [])

  useEffect(() => {
    const id = localStorage.getItem('sparring_profile_id')
    if (!id) return
    fetch(`${BACKEND}/sparring/profiles/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p?.availability) setOwnAvailability(new Set(p.availability.map((a: any) => `${a.day}-${a.time}`)))
        if (p?.city) setOwnCity(p.city)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const city = (profile?.city || '').toLowerCase().trim()
    if (city && initialProfiles.length > 0) {
      const n = initialProfiles.filter(p => p.city?.toLowerCase().trim() === city).length
      if (n > 0) { setCityLine({ count: n, city: profile!.city! }); return }
    }
    if (initialProfiles.length > 0) setCityLine({ count: initialProfiles.length, city: '' })
  }, [profile, initialProfiles])

  // Fetch play requests when tab is opened
  useEffect(() => {
    if (activeTab !== 'play') return
    setPlayLoading(true)
    const city = ownCity || profile?.city || ''
    const qs   = city ? `?city=${encodeURIComponent(city)}` : ''
    fetch(`${BACKEND}/play-requests${qs}`)
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => setPlayRequests(d.requests ?? []))
      .catch(() => setPlayRequests([]))
      .finally(() => setPlayLoading(false))
  }, [activeTab, ownCity, profile?.city])

  async function handleJoin(id: string) {
    if (!ownId) return null
    try {
      const r = await fetch(`${BACKEND}/play-requests/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: ownId }),
      })
      if (!r.ok) return null
      const data = await r.json()
      setPlayRequests(prev => prev.map(req => req.id === id
        ? { ...req, join_count: req.join_count + 1, spots_left: Math.max(0, req.spots_left - 1) }
        : req
      ))
      return data
    } catch { return null }
  }

  async function handleCancel(id: string) {
    if (!ownId) return
    try {
      await fetch(`${BACKEND}/play-requests/${id}?profile_id=${ownId}`, { method: 'DELETE' })
      setPlayRequests(prev => prev.filter(r => r.id !== id))
    } catch {}
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || ''
  const avatarUrl   = user?.user_metadata?.avatar_url
  const initials    = displayName.slice(0, 2).toUpperCase()

  const profiles = ownId ? initialProfiles.filter(p => p.id !== ownId) : initialProfiles
  const now          = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const userCity     = (profile?.city || '').toLowerCase().trim()

  const weekend    = profiles.filter(p => p.availability?.some((a: any) => a.day === 'sat' || a.day === 'sun')).slice(0, 8)
  const newPlayers = profiles.filter(p => new Date(p.created_at).getTime() > sevenDaysAgo).slice(0, 8)
  const nearYou    = userCity ? profiles.filter(p => p.city?.toLowerCase().trim() === userCity).slice(0, 8) : []
  const noSections = weekend.length === 0 && newPlayers.length === 0 && nearYou.length === 0

  return (
    <SparringShell>
      <div className="sr-page">
        {/* ── Header ── */}
        <div style={{ borderBottom: '1px solid var(--sr-border)', padding: '18px 16px 0' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ color: 'var(--sr-text)', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
                  Find a Partner
                </h1>
                <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: '3px 0 0' }}>
                  Find a hitting partner near you
                </p>
                {cityLine && cityLine.count > 0 && (
                  <p style={{ color: 'var(--sr-accent)', fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>
                    🎾 {cityLine.count}{' '}
                    {cityLine.city
                      ? `player${cityLine.count !== 1 ? 's' : ''} looking in ${cityLine.city}`
                      : `player${cityLine.count !== 1 ? 's' : ''} on TennisAce`}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {/* My Requests — hidden on mobile (use bottom bar) */}
                <Link href="/sparring/my-requests"
                  className="hidden md:block"
                  style={{ color: 'var(--sr-muted)', fontWeight: 700, fontSize: 12, padding: '9px 14px',
                    borderRadius: 10, textDecoration: 'none', border: '1px solid var(--sr-border)',
                    whiteSpace: 'nowrap' }}>
                  Requests
                </Link>

                {/* Auth user avatar */}
                {user && (
                  <Link href="/sparring/profile"
                    className="hidden md:flex"
                    style={{ alignItems: 'center', gap: 7, textDecoration: 'none',
                      background: 'var(--sr-card)', border: '1px solid var(--sr-border)',
                      borderRadius: 10, padding: '6px 10px' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#00C875',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 900, color: '#0a0f1a' }}>{initials}</div>
                    }
                    <span style={{ color: 'var(--sr-text-2)', fontWeight: 700, fontSize: 12 }}>{displayName}</span>
                  </Link>
                )}

                {/* Primary CTA */}
                {ownId ? (
                  <Link href="/sparring/profile"
                    style={{ background: 'var(--sr-accent)', color: 'var(--sr-on-acc)', fontWeight: 800,
                      fontSize: 13, padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
                      whiteSpace: 'nowrap', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    My Profile
                  </Link>
                ) : (
                  <Link href="/sparring/create"
                    style={{ background: 'var(--sr-accent)', color: 'var(--sr-on-acc)', fontWeight: 800,
                      fontSize: 13, padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
                      whiteSpace: 'nowrap', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    + Add profile
                  </Link>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, paddingBottom: 0, marginTop: 4 }}>
              {([
                { key: 'players',  label: 'Players'  },
                { key: 'coaches',  label: 'Coaches'  },
                { key: 'play',     label: 'Play Requests' },
              ] as { key: Tab; label: string }[]).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    padding: '9px 16px', border: 'none', cursor: 'pointer',
                    background: 'none', fontWeight: 700, fontSize: 13,
                    color: activeTab === t.key ? 'var(--sr-accent)' : 'var(--sr-muted)',
                    borderBottom: activeTab === t.key ? '2px solid var(--sr-accent)' : '2px solid transparent',
                    transition: 'color 0.15s, border-color 0.15s',
                    whiteSpace: 'nowrap',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filter bar — only on players/coaches */}
            {activeTab !== 'play' && (
              <Suspense fallback={null}>
                <div style={{ paddingBottom: 14, paddingTop: 4 }}>
                  <SparringFilters />
                </div>
              </Suspense>
            )}
            {activeTab === 'play' && <div style={{ paddingBottom: 14 }} />}
          </div>
        </div>

        {/* ── Play Requests tab ── */}
        {activeTab === 'play' && (
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'var(--sr-muted)', fontSize: 12, margin: 0 }}>
                {ownCity ? `Open games in ${ownCity}` : 'Open games near you'}
              </p>
              <Link href="/play"
                style={{
                  background: 'var(--sr-accent)', color: 'var(--sr-on-acc)',
                  fontWeight: 800, fontSize: 12, padding: '8px 16px',
                  borderRadius: 8, textDecoration: 'none',
                }}>
                + Post request
              </Link>
            </div>

            {playLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sr-muted)', fontSize: 13 }}>
                Loading…
              </div>
            ) : playRequests.filter(r => r.status === 'open' && r.spots_left > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 14 }}>
                <p style={{ fontSize: 32, margin: '0 0 12px' }}>🎾</p>
                <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 16, margin: '0 0 6px' }}>No open games yet</p>
                <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: '0 0 20px' }}>Be the first to post one</p>
                <Link href="/play"
                  style={{ display: 'inline-block', background: 'var(--sr-accent)', color: 'var(--sr-on-acc)', fontWeight: 800, fontSize: 13, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
                  Post a request →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {playRequests
                  .filter(r => r.status === 'open' && r.spots_left > 0)
                  .map(req => (
                    <PlayRequestMiniCard
                      key={req.id}
                      req={req}
                      ownId={ownId}
                      onJoin={handleJoin}
                      onCancel={handleCancel}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── Players / Coaches sections ── */}
        {activeTab !== 'play' && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
          {noSections ? (
            profiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
                <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>
                  Your tennis circle starts here.
                </p>
                <p style={{ color: 'var(--sr-muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                  No players listed yet. Add your profile and be the first hit request someone else sees.
                </p>
                <Link href="/sparring/create"
                  style={{ display: 'inline-block', background: 'var(--sr-accent)', color: 'var(--sr-on-acc)',
                    fontWeight: 800, fontSize: 14, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>
                  Add my profile →
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--sr-text)', fontWeight: 900, fontSize: 17, letterSpacing: -0.4, margin: '0 0 16px' }}>
                  All players
                </p>
                <div className="sr-grid">
                  {profiles.map(p => {
                    const mutual = ownAvailability.size > 0
                      ? (p.availability ?? []).filter((a: any) => ownAvailability.has(`${a.day}-${a.time}`)).length
                      : undefined
                    return <PlayerCard key={p.id} p={p} mutualSlots={mutual} />
                  })}
                </div>
              </div>
            )
          ) : (
            <>
              {nearYou.length    > 0 && <Section title="Players near you"        profiles={nearYou}    ownAvailability={ownAvailability} />}
              {weekend.length    > 0 && <Section title="Available this weekend"   profiles={weekend}    ownAvailability={ownAvailability} />}
              {newPlayers.length > 0 && <Section title="Joined recently"          profiles={newPlayers} ownAvailability={ownAvailability} />}
            </>
          )}
        </div>
        )}
      </div>
    </SparringShell>
  )
}
