'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

type PlayRequest = {
  id:             string
  date:           string
  time_slot:      string
  players_needed: number
  level?:         string
  surface?:       string
  format?:        string
  location_name?: string
  status:         string
  spots_left:     number
  creator: { name?: string; photo_url?: string; founding_number?: number }
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

function WeekendRequestCard({ req }: { req: PlayRequest }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 14px',
    }}>
      <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 900, margin: '0 0 3px', letterSpacing: -0.3 }}>
        {fmtDateShort(req.date)}
      </p>
      <p style={{ color: 'rgba(57,255,20,0.8)', fontSize: 11, fontWeight: 700, margin: '0 0 10px' }}>
        {req.time_slot}{req.location_name ? ` · ${req.location_name}` : ''}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: req.creator.photo_url
            ? `url(${req.creator.photo_url}) center/cover no-repeat`
            : 'rgba(57,255,20,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, color: '#39FF14', overflow: 'hidden',
        }}>
          {!req.creator.photo_url && (req.creator.name ?? '?')[0].toUpperCase()}
        </div>
        <span style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 600 }}>{req.creator.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {req.format  && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', color: '#39FF14', fontSize: 9, fontWeight: 800 }}>{FORMAT_LABEL[req.format] ?? req.format}</span>}
        {req.level   && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 9, fontWeight: 700 }}>{req.level}</span>}
        {req.surface && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 9, fontWeight: 700 }}>{req.surface}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#39FF14', fontSize: 11, fontWeight: 800 }}>
          {req.spots_left} spot{req.spots_left !== 1 ? 's' : ''} left
        </span>
        <Link href="/play"
          style={{ background: '#39FF14', color: '#000', fontWeight: 900, fontSize: 11, padding: '6px 12px', borderRadius: 7, textDecoration: 'none' }}>
          Join →
        </Link>
      </div>
    </div>
  )
}

type Member = {
  id: string
  name: string
  photo_url?: string
  founding_number?: number
  profile_type: string
}

type CityData = {
  city: string
  country: string
  player_count: number
  coach_count: number
  player_target: number
  coach_target: number
  status: string
  next_number: number
  founding_members: Member[]
}

const MILESTONES = [
  { count: 50,  label: 'Early Access',      key: 'early_access'      },
  { count: 200, label: 'Community Launch',  key: 'community_launch'  },
  { count: 500, label: 'Full Launch',       key: 'full_launch'       },
]

function HexBadge({ number }: { number: number }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: 44, height: 50,
      clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
      background: 'rgba(57,255,20,0.08)', border: '1px solid #39FF14',
      boxShadow: '0 0 8px rgba(57,255,20,0.2)',
      color: '#39FF14', flexShrink: 0, gap: 1,
    }}>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.8 }}>FM</span>
      <span style={{ fontSize: 12, fontWeight: 900 }}>#{number}</span>
    </div>
  )
}

function AnimatedBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const [width, setWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => setWidth(pct), delay)
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [pct, delay])

  return (
    <div ref={ref} style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 4,
        background: 'linear-gradient(90deg, #39FF14, #00C875)',
        width: `${width}%`,
        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  )
}

function MemberAvatar({ member, blur }: { member: Member; blur: boolean }) {
  const init = (member.name ?? '?')[0].toUpperCase()
  return (
    <Link href={blur ? '/sparring/create' : `/sparring/${member.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: member.photo_url ? `url(${member.photo_url}) center/cover no-repeat` : 'rgba(57,255,20,0.15)',
          border: '2px solid rgba(57,255,20,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 900, color: '#39FF14',
          filter: blur ? 'blur(4px)' : 'none',
          transition: 'filter 0.2s',
          overflow: 'hidden',
        }}>
          {!member.photo_url && init}
        </div>
        {member.founding_number && (
          <span style={{
            position: 'absolute', bottom: 22, right: -2,
            background: 'var(--bg)', border: '1px solid #39FF14',
            borderRadius: 6, color: '#39FF14', fontSize: 8, fontWeight: 900,
            padding: '1px 4px', lineHeight: 1.4,
          }}>#{member.founding_number}</span>
        )}
        {!blur && (
          <span style={{ color: 'var(--text-2)', fontSize: 10, fontWeight: 600, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.name.split(' ')[0]}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function CityProgressClient({ city, initialData }: { city: string; initialData: CityData | null }) {
  const data: CityData = initialData ?? {
    city, country: 'India',
    player_count: 0, coach_count: 0,
    player_target: 500, coach_target: 50,
    status: 'building', next_number: 1,
    founding_members: [],
  }

  const [weekendRequests, setWeekendRequests] = useState<PlayRequest[]>([])

  useEffect(() => {
    fetch(`${BACKEND}/play-requests?city=${encodeURIComponent(city)}`)
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => {
        const now  = new Date()
        const day  = now.getDay()
        const diff = (day === 0) ? 0 : (6 - day)
        const sat  = new Date(now); sat.setDate(now.getDate() + diff)
        const sun  = new Date(sat); sun.setDate(sat.getDate() + 1)
        const satStr = sat.toISOString().split('T')[0]
        const sunStr = sun.toISOString().split('T')[0]
        const weekend = (d.requests ?? []).filter((r: PlayRequest) =>
          r.status === 'open' && r.spots_left > 0 &&
          (r.date === satStr || r.date === sunStr)
        ).slice(0, 3)
        setWeekendRequests(weekend)
      })
      .catch(() => {})
  }, [city])

  const total         = data.player_count + data.coach_count
  const playerPct     = Math.min((data.player_count / data.player_target) * 100, 100)
  const coachPct      = Math.min((data.coach_count  / data.coach_target)  * 100, 100)
  const nextMilestone = MILESTONES.find(m => total < m.count) ?? MILESTONES[MILESTONES.length - 1]
  const milestoneLeft = Math.max(0, nextMilestone.count - total)

  const first20   = data.founding_members.slice(0, 20)
  const blurFrom  = 12

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* ── Back nav ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <Link href="/sparring" style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Find a Partner
        </Link>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: '40px 20px 32px', textAlign: 'center', animation: 'fade-up 0.5s ease' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)',
          borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 800,
          color: '#39FF14', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
        }}>
          {data.country} · Tennis Community
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 10px', letterSpacing: -1, lineHeight: 1.1 }}>
          {city}
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, margin: '0 0 6px' }}>
          Building the tennis community
        </p>
        <p style={{ color: '#39FF14', fontSize: 14, fontWeight: 700, margin: 0 }}>
          {total} founding member{total !== 1 ? 's' : ''} and counting
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* ── Progress bars ── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, marginBottom: 24,
          animation: 'fade-up 0.5s ease 0.1s both',
        }}>
          <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 20px' }}>
            Community Progress
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>🎾 Players</span>
              <span style={{ color: 'var(--text-2)', fontSize: 13 }}>
                {data.player_count} / {data.player_target}
              </span>
            </div>
            <AnimatedBar pct={playerPct} delay={200} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>🎓 Coaches</span>
              <span style={{ color: 'var(--text-2)', fontSize: 13 }}>
                {data.coach_count} / {data.coach_target}
              </span>
            </div>
            <AnimatedBar pct={coachPct} delay={400} />
          </div>
        </div>

        {/* ── Milestones ── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, marginBottom: 24,
          animation: 'fade-up 0.5s ease 0.2s both',
        }}>
          <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 20px' }}>
            Milestones
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MILESTONES.map((m, i) => {
              const reached  = total >= m.count
              const isCurrent = !reached && (i === 0 || total >= MILESTONES[i - 1].count)
              return (
                <div key={m.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 10,
                  background: isCurrent ? 'rgba(57,255,20,0.08)' : 'transparent',
                  border: `1px solid ${isCurrent ? 'rgba(57,255,20,0.3)' : 'var(--border)'}`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: reached ? 'rgba(57,255,20,0.2)' : isCurrent ? 'rgba(57,255,20,0.1)' : 'var(--surface-2)',
                    border: `1px solid ${reached || isCurrent ? '#39FF14' : 'var(--border)'}`,
                    color: reached ? '#39FF14' : isCurrent ? '#39FF14' : 'var(--text-2)',
                    fontSize: 14,
                  }}>
                    {reached ? '✓' : isCurrent ? '→' : `${i + 1}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: reached || isCurrent ? 'var(--text)' : 'var(--text-2)', fontWeight: 800, fontSize: 14, margin: '0 0 2px' }}>
                      {m.label}
                    </p>
                    <p style={{ color: 'var(--text-2)', fontSize: 11, margin: 0 }}>
                      {m.count} members
                    </p>
                  </div>
                  {isCurrent && (
                    <span style={{ color: '#39FF14', fontSize: 11, fontWeight: 800, animation: 'pulse 2s ease-in-out infinite' }}>
                      {milestoneLeft} to go
                    </span>
                  )}
                  {reached && (
                    <span style={{ color: '#39FF14', fontSize: 11, fontWeight: 800 }}>Done</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Founding members grid ── */}
        {first20.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, marginBottom: 24,
            animation: 'fade-up 0.5s ease 0.3s both',
          }}>
            <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 20px' }}>
              Founding Members
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {first20.map((m, i) => (
                <MemberAvatar key={m.id} member={m} blur={i >= blurFrom} />
              ))}
            </div>
            {first20.length >= blurFrom && (
              <p style={{ color: 'var(--text-2)', fontSize: 12, margin: '16px 0 0', textAlign: 'center' }}>
                Sign in to see all founding members
              </p>
            )}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link href={`/community/${encodeURIComponent(city)}/founding-wall`}
                style={{ color: '#39FF14', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View all {total} founding members →
              </Link>
            </div>
          </div>
        )}

        {/* ── This Weekend ── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, marginBottom: 24,
          animation: 'fade-up 0.5s ease 0.35s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
              This Weekend
            </p>
            <Link href="/play"
              style={{ color: 'rgba(57,255,20,0.7)', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
              See all →
            </Link>
          </div>

          {weekendRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '0 0 14px' }}>
                No games this weekend yet — be the first to post one
              </p>
              <Link href="/play"
                style={{
                  display: 'inline-block', background: '#39FF14', color: '#000',
                  fontWeight: 900, fontSize: 13, padding: '10px 20px', borderRadius: 9, textDecoration: 'none',
                }}>
                Post a request →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weekendRequests.map(req => (
                <WeekendRequestCard key={req.id} req={req} />
              ))}
            </div>
          )}
        </div>

        {/* ── Join CTA ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(57,255,20,0.1) 0%, rgba(0,200,117,0.05) 100%)',
          border: '1.5px solid rgba(57,255,20,0.3)',
          borderRadius: 16, padding: '28px 24px', textAlign: 'center',
          animation: 'fade-up 0.5s ease 0.4s both',
        }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 64, marginBottom: 16,
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
            background: 'rgba(57,255,20,0.12)', border: '1px solid #39FF14',
            boxShadow: '0 0 20px rgba(57,255,20,0.3)',
            color: '#39FF14',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>FM</span>
            <span style={{ fontSize: 14, fontWeight: 900 }}>#{data.next_number}</span>
          </div>
          <p style={{ color: 'var(--text)', fontSize: 20, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.3 }}>
            Be Founding Player #{data.next_number}
          </p>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
            Help build {city}'s tennis community from the ground up.
            Your founding badge stays forever.
          </p>
          <Link href="/sparring/create"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#39FF14', color: '#000', fontWeight: 900, fontSize: 15,
              padding: '14px 28px', borderRadius: 10, textDecoration: 'none',
              boxShadow: '0 0 20px rgba(57,255,20,0.3)',
            }}>
            Join the founding members →
          </Link>
        </div>
      </div>
    </div>
  )
}
