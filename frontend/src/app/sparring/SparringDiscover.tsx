'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import SparringFilters from './SparringFilters'
import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/hooks/useTheme'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: '#1a3a1a', color: '#6ee86e' },
  intermediate: { bg: '#1a2a3a', color: '#6eb8e8' },
  advanced:     { bg: '#3a1a1a', color: '#e87070' },
  competitive:  { bg: '#0f1a2e', color: '#39FF14'  },
}

// Convert availability slots to a single human-readable line
function availabilityLine(availability: any[]): string | null {
  if (!availability?.length) return null
  const days = new Set(availability.map((a: any) => a.day))
  const times = new Set(availability.map((a: any) => a.time))
  const hasWeekend  = days.has('sat') || days.has('sun')
  const hasWeekday  = ['mon','tue','wed','thu','fri'].some(d => days.has(d))
  const hasMorning  = times.has('morning')
  const hasEvening  = times.has('evening')

  if (hasWeekend && !hasWeekday) return 'Free this weekend'
  if (hasWeekend)               return 'Free weekends & weekdays'
  if (hasWeekday && hasMorning) return 'Available weekday mornings'
  if (hasWeekday && hasEvening) return 'Free evenings'
  if (hasWeekday)               return 'Available on weekdays'
  return null
}

function PlayerCard({ p, mutualSlots }: { p: any; mutualSlots?: number }) {
  const [hovered, setHovered] = useState(false)
  const lvl    = LEVEL_STYLE[p.level] ?? LEVEL_STYLE.beginner
  const avLine = availabilityLine(p.availability)

  return (
    <Link href={`/sparring/${p.id}`} style={{ textDecoration: 'none', display: 'block', minWidth: 220, maxWidth: 260, flexShrink: 0 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#0f1520',
          border: `1px solid ${hovered ? 'rgba(57,255,20,0.2)' : '#1a2535'}`,
          borderRadius: 10, overflow: 'hidden', height: '100%',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? '0 0 20px rgba(57,255,20,0.08)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Photo */}
        <div style={{ height: 140, background: '#141c2e', position: 'relative', overflow: 'hidden' }}>
          {p.photo_url ? (
            <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.role === 'coach' ? '#0a0a1a' : '#0a1a0f' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.role === 'coach' ? '#8080ff' : '#39FF14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#0a0f1a' }}>
                {(p.name ?? '?')[0].toUpperCase()}
              </div>
            </div>
          )}
          <span style={{ position: 'absolute', top: 8, right: 8, background: lvl.bg, color: lvl.color, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, textTransform: 'capitalize' }}>
            {p.level}
          </span>
          {mutualSlots != null && mutualSlots > 0 && (
            <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(57,255,20,0.15)', border: '1px solid #39FF14', color: '#39FF14', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>
              {mutualSlots} mutual slot{mutualSlots > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>{p.name}</p>
            <span style={{ background: p.role === 'coach' ? '#1a1a3a' : '#0a1a0f', color: p.role === 'coach' ? '#8080ff' : '#39FF14', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
              {p.role === 'coach' ? 'Coach' : 'Player'}
            </span>
          </div>
          <p style={{ color: '#556', fontSize: 12, margin: '0 0 8px' }}>{p.city}, {p.country}</p>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: avLine ? 6 : 8 }}>
            {(p.surface ?? []).map((s: string) => (
              <span key={s} style={{ background: '#1a2535', border: '1px solid #243045', color: '#7a8ca0', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3 }}>{s}</span>
            ))}
          </div>
          {avLine && (
            <p style={{ color: '#556', fontSize: 11, margin: '0 0 8px', lineHeight: 1.3 }}>{avLine}</p>
          )}
          <div style={{ display: 'flex', gap: 3 }}>
            {['mon','tue','wed','thu','fri','sat','sun'].map((d, i) => {
              const label = ['M','T','W','T','F','S','S'][i]
              const active = (p.availability ?? []).some((a: any) => a.day === d)
              return (
                <span key={d} style={{ width: 18, height: 18, borderRadius: '50%', background: active ? '#39FF14' : '#1a2535', color: active ? '#0a0f1a' : '#3a4a5a', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Section({ title, profiles, ownAvailability }: { title: string; profiles: any[]; ownAvailability: Set<string> }) {
  if (profiles.length === 0) return null

  function mutualSlots(p: any): number {
    if (ownAvailability.size === 0) return 0
    return (p.availability ?? []).filter((a: any) => ownAvailability.has(`${a.day}-${a.time}`)).length
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: -0.3, margin: '0 0 14px 0' }}>{title}</p>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {profiles.map(p => (
          <PlayerCard key={p.id} p={p} mutualSlots={mutualSlots(p)} />
        ))}
      </div>
    </div>
  )
}

export default function SparringDiscover({ initialProfiles }: { initialProfiles: any[] }) {
  const { user, profile } = useAuth()
  const { isDark } = useTheme()
  const [ownId,           setOwnId]           = useState<string | null>(null)
  const [ownAvailability, setOwnAvailability] = useState<Set<string>>(new Set())
  const [cityCount,       setCityCount]       = useState<{ count: number; city: string } | null>(null)

  useEffect(() => {
    setOwnId(localStorage.getItem('sparring_profile_id'))
  }, [])

  // Fetch own sparring availability for mutual slots calculation
  useEffect(() => {
    const id = localStorage.getItem('sparring_profile_id')
    if (!id) return
    fetch(`${BACKEND}/sparring/profiles/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (!p?.availability) return
        setOwnAvailability(new Set(p.availability.map((a: any) => `${a.day}-${a.time}`)))
      })
      .catch(() => {})
  }, [])

  // City / total player counter
  useEffect(() => {
    const userCity = (profile?.city || '').toLowerCase().trim()
    if (userCity && initialProfiles.length > 0) {
      const inCity = initialProfiles.filter(p => p.city?.toLowerCase().trim() === userCity).length
      if (inCity > 0) { setCityCount({ count: inCity, city: profile!.city! }); return }
    }
    if (initialProfiles.length > 0) {
      setCityCount({ count: initialProfiles.length, city: '' })
    }
  }, [profile, initialProfiles])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || ''
  const avatarUrl   = user?.user_metadata?.avatar_url
  const initials    = displayName.slice(0, 2).toUpperCase()

  // Filter own profile
  const profiles = ownId ? initialProfiles.filter(p => p.id !== ownId) : initialProfiles

  // Sections
  const now         = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const userCity    = (profile?.city || '').toLowerCase().trim()

  const weekend    = profiles.filter(p => p.availability?.some((a: any) => a.day === 'sat' || a.day === 'sun')).slice(0, 6)
  const newPlayers = profiles.filter(p => new Date(p.created_at).getTime() > sevenDaysAgo).slice(0, 6)
  const nearYou    = userCity ? profiles.filter(p => p.city?.toLowerCase().trim() === userCity).slice(0, 6) : []

  const noSections = weekend.length === 0 && newPlayers.length === 0 && nearYou.length === 0

  return (
    <div style={{ background: isDark ? '#0a0f1a' : '#f5f5f5', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${isDark ? '#1a2535' : '#e0e0e0'}`, padding: '16px 16px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ color: isDark ? '#fff' : '#0f1520', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Find a Partner</h1>
              <p style={{ color: isDark ? '#556' : '#777', fontSize: 13, margin: '2px 0 0' }}>Find a hitting partner near you</p>
              {/* City / total counter */}
              {cityCount && cityCount.count > 0 && (
                <p style={{ color: '#39FF14', fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>
                  🎾 {cityCount.count} {cityCount.city
                    ? `player${cityCount.count !== 1 ? 's' : ''} looking for a partner in ${cityCount.city}`
                    : `player${cityCount.count !== 1 ? 's' : ''} on TennisAce`
                  }
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link href="/sparring/my-requests" style={{ background: 'transparent', color: '#aaa', fontWeight: 700, fontSize: 12, padding: '8px 12px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid #1a2535' }}>
                My Requests
              </Link>

              {user ? (
                <Link href="/sparring/profile" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', background: '#0f1520', border: '1px solid #1a2535', borderRadius: 6, padding: '6px 10px' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#00C875', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#0a0f1a' }}>{initials}</div>
                  )}
                  <span style={{ color: '#ccc', fontWeight: 700, fontSize: 12 }}>{displayName}</span>
                </Link>
              ) : (
                <Link href="/auth/login" style={{ background: 'transparent', color: '#aaa', fontWeight: 700, fontSize: 12, padding: '8px 12px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid #1a2535' }}>
                  Sign in
                </Link>
              )}

              {ownId ? (
                <Link href="/sparring/profile" style={{ background: '#39FF14', color: '#0a0f1a', fontWeight: 800, fontSize: 13, padding: '9px 16px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  My Profile
                </Link>
              ) : (
                <Link href="/sparring/create" style={{ background: '#39FF14', color: '#0a0f1a', fontWeight: 800, fontSize: 13, padding: '9px 16px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  + Add my profile
                </Link>
              )}
            </div>
          </div>

          <Suspense fallback={null}>
            <div style={{ paddingBottom: 16 }}>
              <SparringFilters />
            </div>
          </Suspense>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {noSections ? (
          profiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>No players in this area yet</p>
              <p style={{ color: '#556', fontSize: 14, margin: '6px 0 24px' }}>
                Be the first to add your profile
              </p>
              <Link href="/sparring/create" style={{ background: '#39FF14', color: '#0a0f1a', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 6, textDecoration: 'none' }}>
                Add my profile →
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: -0.3, margin: '0 0 14px 0' }}>All players</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
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
            {nearYou.length > 0   && <Section title="Players near you"       profiles={nearYou}    ownAvailability={ownAvailability} />}
            {weekend.length > 0   && <Section title="Available this weekend"  profiles={weekend}    ownAvailability={ownAvailability} />}
            {newPlayers.length > 0 && <Section title="New players"            profiles={newPlayers} ownAvailability={ownAvailability} />}
          </>
        )}
      </div>
    </div>
  )
}
