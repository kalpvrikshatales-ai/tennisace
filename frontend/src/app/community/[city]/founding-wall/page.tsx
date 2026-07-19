import type { Metadata } from 'next'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

export const revalidate = 120

async function getCityData(city: string) {
  try {
    const res = await fetch(`${BACKEND}/sparring/city-progress/${encodeURIComponent(city)}`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const city = decodeURIComponent(params.city)
  return {
    title: `${city} Founding Wall · TennisAce`,
    description: `Every founding member who helped build ${city}'s tennis community from day one.`,
  }
}

function fmtJoinDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

export default async function FoundingWallPage({ params }: { params: { city: string } }) {
  const city = decodeURIComponent(params.city)
  const data = await getCityData(city)

  const members: any[] = data?.founding_members ?? []
  const nextNumber = data?.next_number ?? (members.length + 1)
  const total = data ? (data.player_count + data.coach_count) : members.length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fm-card:hover { border-color: rgba(57,255,20,0.35) !important; transform: translateY(-2px); }
        .fm-card { transition: all 0.18s ease; }
      `}</style>

      {/* ── Back nav ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <Link href={`/community/${encodeURIComponent(city)}`}
          style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← {city} Community
        </Link>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: '40px 20px 32px', textAlign: 'center', animation: 'fade-up 0.5s ease' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)',
          borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 800,
          color: '#39FF14', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
        }}>
          {total} Founding Member{total !== 1 ? 's' : ''}
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 10px', letterSpacing: -1, lineHeight: 1.1 }}>
          {city} Founding Wall
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, margin: '0 auto', maxWidth: 440, lineHeight: 1.6 }}>
          The people who started it all. They joined before anyone else, when {city}'s tennis community was just an idea.
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 80px' }}>

        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, margin: '0 0 16px' }}>🎾</p>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>
              No founding members yet
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>
              Be the first founding member of {city}.
            </p>
            <Link href="/sparring/create"
              style={{ background: '#39FF14', color: '#000', fontWeight: 900, fontSize: 14, padding: '13px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>
              Join as Founding Member #1 →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Member grid ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 14,
              marginBottom: 40,
            }}>
              {members.map((m: any, i: number) => {
                const init = (m.name ?? '?')[0].toUpperCase()
                const typeLabel = m.profile_type === 'coach' ? 'Coach' : 'Player'
                const joinDate = fmtJoinDate(m.created_at || '')
                return (
                  <Link
                    key={m.id}
                    href={`/sparring/${m.id}`}
                    className="fm-card"
                    style={{
                      textDecoration: 'none',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '20px 14px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      animation: `fade-up 0.4s ease ${Math.min(i * 0.03, 0.5)}s both`,
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: m.photo_url ? `url(${m.photo_url}) center/cover no-repeat` : 'rgba(57,255,20,0.15)',
                        border: '2px solid rgba(57,255,20,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, fontWeight: 900, color: '#39FF14',
                        overflow: 'hidden',
                      }}>
                        {!m.photo_url && init}
                      </div>
                      {/* Founding badge */}
                      {m.founding_number && (
                        <div style={{
                          position: 'absolute', bottom: -4, right: -4,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 32,
                          clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                          background: 'rgba(57,255,20,0.15)',
                          color: '#39FF14',
                        }}>
                          <span style={{ fontSize: 5, fontWeight: 800 }}>FM</span>
                          <span style={{ fontSize: 8, fontWeight: 900 }}>#{m.founding_number}</span>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 14, margin: 0, lineHeight: 1.2 }}>
                      {m.name}
                    </p>

                    {/* Type badge */}
                    <span style={{
                      padding: '2px 8px', borderRadius: 20,
                      background: m.profile_type === 'coach' ? 'rgba(96,165,250,0.1)' : 'rgba(57,255,20,0.08)',
                      border: `1px solid ${m.profile_type === 'coach' ? 'rgba(96,165,250,0.3)' : 'rgba(57,255,20,0.2)'}`,
                      color: m.profile_type === 'coach' ? '#60a5fa' : '#39FF14',
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      {typeLabel}
                    </span>

                    {/* Join date */}
                    {joinDate && (
                      <p style={{ color: 'var(--text-2)', fontSize: 10, margin: 0 }}>
                        Joined {joinDate}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* ── Join CTA ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(57,255,20,0.1) 0%, rgba(0,200,117,0.05) 100%)',
              border: '1.5px solid rgba(57,255,20,0.3)',
              borderRadius: 16, padding: '28px 24px', textAlign: 'center',
            }}>
              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 56, marginBottom: 14,
                clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                background: 'rgba(57,255,20,0.12)', color: '#39FF14',
              }}>
                <span style={{ fontSize: 8, fontWeight: 800 }}>FM</span>
                <span style={{ fontSize: 12, fontWeight: 900 }}>#{nextNumber}</span>
              </div>
              <p style={{ color: 'var(--text)', fontSize: 18, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.3 }}>
                Your name could be next
              </p>
              <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
                Founding Member #{nextNumber} of {city}. Your badge stays forever.
              </p>
              <Link href="/sparring/create"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#39FF14', color: '#000', fontWeight: 900, fontSize: 14,
                  padding: '13px 26px', borderRadius: 10, textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(57,255,20,0.3)',
                }}>
                Join as Founding Member #{nextNumber} →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
