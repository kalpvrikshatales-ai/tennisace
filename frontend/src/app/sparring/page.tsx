import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import SparringFilters from './SparringFilters'

export const metadata: Metadata = {
  title: 'Find a Hitting Partner | TennisAce Sparring',
  description: 'Find a tennis hitting partner near you. Browse players by city, level, surface, and availability.',
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: '#1a3a1a', color: '#6ee86e' },
  intermediate: { bg: '#1a2a3a', color: '#6eb8e8' },
  advanced:     { bg: '#3a1a1a', color: '#e87070' },
  competitive:  { bg: '#39FF14', color: '#000'    },
}

const DAY_DOT: Record<string, string> = {
  mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S',
}

async function fetchProfiles(params: Record<string, string>) {
  const qs = new URLSearchParams()
  if (params.city)    qs.set('city',    params.city)
  if (params.level)   qs.set('level',   params.level)
  if (params.surface) qs.set('surface', params.surface)
  if (params.day)     qs.set('day',     params.day)
  if (params.time)    qs.set('time',    params.time)

  try {
    const res = await fetch(`${BACKEND}/sparring/profiles?${qs}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.profiles ?? []
  } catch {
    return []
  }
}

export default async function SparringPage({
  searchParams,
}: {
  searchParams: { city?: string; level?: string; surface?: string; day?: string; time?: string }
}) {
  const profiles = await fetchProfiles({
    city:    searchParams.city    ?? '',
    level:   searchParams.level   ?? '',
    surface: searchParams.surface ?? '',
    day:     searchParams.day     ?? '',
    time:    searchParams.time    ?? '',
  })

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 16px 0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
                Sparring
              </h1>
              <p style={{ color: '#555', fontSize: 13, margin: '2px 0 0' }}>
                Find a hitting partner near you
              </p>
            </div>
            <Link
              href="/sparring/create"
              style={{
                background: '#39FF14', color: '#000', fontWeight: 800,
                fontSize: 13, padding: '9px 16px', borderRadius: 6,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              + Add my profile
            </Link>
          </div>

          {/* Filters — client component, wrapped in Suspense for useSearchParams */}
          <Suspense fallback={null}>
            <div style={{ paddingBottom: 16 }}>
              <SparringFilters />
            </div>
          </Suspense>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
        {profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>
              No players found
            </p>
            <p style={{ color: '#555', fontSize: 14, margin: '6px 0 24px' }}>
              Be the first to add your profile
            </p>
            <Link
              href="/sparring/create"
              style={{
                background: '#39FF14', color: '#000', fontWeight: 800,
                fontSize: 14, padding: '11px 22px', borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Add my profile
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {profiles.map((p: any) => {
              const lvl = LEVEL_STYLE[p.level] ?? LEVEL_STYLE.beginner
              const days = new Set((p.availability ?? []).map((a: any) => a.day))
              return (
                <Link key={p.id} href={`/sparring/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#111', border: '1px solid #222', borderRadius: 10,
                    overflow: 'hidden', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#39FF14')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}
                  >
                    {/* Photo */}
                    <div style={{ height: 160, background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 48, color: '#333',
                        }}>
                          🎾
                        </div>
                      )}
                      {/* Level badge overlay */}
                      <span style={{
                        position: 'absolute', top: 10, right: 10,
                        background: lvl.bg, color: lvl.color,
                        fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                        textTransform: 'capitalize',
                      }}>
                        {p.level}
                      </span>
                    </div>

                    <div style={{ padding: '12px 14px 14px' }}>
                      {/* Name + location */}
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>
                        {p.name}
                      </p>
                      <p style={{ color: '#555', fontSize: 12, margin: '0 0 10px' }}>
                        {p.city}, {p.country}
                      </p>

                      {/* Surface badges */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {(p.surface ?? []).map((s: string) => (
                          <span key={s} style={{
                            background: '#1e1e1e', border: '1px solid #2e2e2e',
                            color: '#aaa', fontSize: 11, fontWeight: 600,
                            padding: '2px 7px', borderRadius: 4,
                          }}>
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Availability dots */}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {Object.entries(DAY_DOT).map(([d, label]) => (
                          <span key={d} style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: days.has(d) ? '#39FF14' : '#1a1a1a',
                            color: days.has(d) ? '#000' : '#444',
                            fontSize: 9, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
