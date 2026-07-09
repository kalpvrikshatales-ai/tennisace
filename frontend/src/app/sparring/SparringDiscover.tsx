'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import SparringFilters from './SparringFilters'
import SparringShell from './SparringShell'
import { useAuth } from '@/components/AuthProvider'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const LEVEL_BADGE: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'rgba(110,232,110,0.12)', color: '#6ee86e' },
  intermediate: { bg: 'rgba(110,184,232,0.12)', color: '#6eb8e8' },
  advanced:     { bg: 'rgba(232,112,112,0.12)', color: '#e87070' },
  competitive:  { bg: 'rgba(57,255,20,0.12)',   color: 'var(--sr-accent)' },
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
          border: `1px solid ${hov ? 'rgba(57,255,20,0.25)' : 'var(--sr-border)'}`,
          borderRadius: 14,
          overflow: 'hidden',
          transform: hov ? 'translateY(-3px)' : 'none',
          boxShadow: hov ? '0 8px 32px rgba(57,255,20,0.08), var(--sr-shadow)' : 'var(--sr-shadow-s)',
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
              background: p.role === 'coach' ? 'rgba(128,128,255,0.08)' : 'rgba(57,255,20,0.05)' }}>
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
            background: p.role === 'coach' ? 'rgba(128,128,255,0.2)' : 'rgba(57,255,20,0.12)',
            color: p.role === 'coach' ? '#8080ff' : 'var(--sr-accent)',
            fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 5,
            textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {p.role === 'coach' ? 'Coach' : 'Player'}
          </span>

          {/* Mutual slots */}
          {mutualSlots != null && mutualSlots > 0 && (
            <span style={{ position: 'absolute', bottom: 10, left: 10,
              background: 'rgba(57,255,20,0.15)', border: '1px solid var(--sr-accent)',
              color: 'var(--sr-accent)', fontSize: 10, fontWeight: 800,
              padding: '3px 8px', borderRadius: 6 }}>
              {mutualSlots} mutual slot{mutualSlots > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px 14px' }}>
          <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{p.name}</p>
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

export default function SparringDiscover({ initialProfiles }: { initialProfiles: any[] }) {
  const { user, profile } = useAuth()
  const [ownId,           setOwnId]           = useState<string | null>(null)
  const [ownAvailability, setOwnAvailability] = useState<Set<string>>(new Set())
  const [cityLine,        setCityLine]        = useState<{ count: number; city: string } | null>(null)

  useEffect(() => { setOwnId(localStorage.getItem('sparring_profile_id')) }, [])

  useEffect(() => {
    const id = localStorage.getItem('sparring_profile_id')
    if (!id) return
    fetch(`${BACKEND}/sparring/profiles/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p?.availability) setOwnAvailability(new Set(p.availability.map((a: any) => `${a.day}-${a.time}`))) })
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

            {/* Filter bar */}
            <Suspense fallback={null}>
              <div style={{ paddingBottom: 14 }}>
                <SparringFilters />
              </div>
            </Suspense>
          </div>
        </div>

        {/* ── Sections ── */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
          {noSections ? (
            profiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
                <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>
                  No players in this area yet
                </p>
                <p style={{ color: 'var(--sr-muted)', fontSize: 14, margin: '0 0 24px' }}>
                  Be the first to add your profile
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
      </div>
    </SparringShell>
  )
}
