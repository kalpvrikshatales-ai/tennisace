import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Tennis Community · TennisAce',
  description: 'TennisAce is building local tennis communities city by city. Find hitting partners, coaches, and organizers near you.',
  openGraph: {
    title: 'Tennis Community · TennisAce',
    description: 'Building local tennis communities — Barcelona first, then the world.',
  },
}

const CITIES = [
  {
    city:        'Barcelona',
    country:     'Spain',
    flag:        '🇪🇸',
    slug:        'Barcelona',
    tagline:     'Launching first in Europe',
    description: 'Barcelona is our first city launch. Join the founding members shaping the local scene before it opens.',
    featured:    true,
    status:      'Founding members open',
    statusColor: 'var(--accent)',
  },
  {
    city:        'Dubai',
    country:     'UAE',
    flag:        '🇦🇪',
    slug:        'Dubai',
    tagline:     'Coming to the Middle East',
    description: 'Dubai is next. Get your founding badge early and help build the community before the full launch.',
    featured:    false,
    status:      'Early sign-ups',
    statusColor: '#f59e0b',
  },
]

export default function CommunityPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .city-card:hover { border-color: color-mix(in srgb, var(--accent) 40%, transparent) !important; transform: translateY(-4px); }
        .city-card { transition: all 0.2s ease; }
      `}</style>

      {/* Hero */}
      <div style={{ padding: '56px 24px 40px', textAlign: 'center', animation: 'fade-up 0.5s ease' }}>
        <div style={{
          display: 'inline-block', background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 20,
          padding: '4px 16px', fontSize: 11, fontWeight: 800,
          color: 'var(--accent)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20,
        }}>
          City by City
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 14px', letterSpacing: -1, lineHeight: 1.1 }}>
          Building tennis<br />communities
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, margin: '0 auto', maxWidth: 400, lineHeight: 1.6 }}>
          We're launching city by city. Founding members get a permanent badge
          and help shape the community from day one.
        </p>
      </div>

      {/* City cards */}
      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '0 20px 80px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {CITIES.map((c, i) => (
          <Link key={c.slug} href={`/community/${c.slug}`} style={{ textDecoration: 'none' }}>
            <div
              className="city-card"
              style={{
                background: c.featured ? 'color-mix(in srgb, var(--accent) 5%, transparent)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${c.featured ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '28px 24px',
                animation: `fade-up 0.5s ease ${0.1 + i * 0.1}s both`,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Featured glow */}
              {c.featured && (
                <div style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 140, height: 140, borderRadius: '50%',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Status pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${c.statusColor}18`,
                border: `1px solid ${c.statusColor}40`,
                borderRadius: 20, padding: '3px 10px',
                fontSize: 10, fontWeight: 800, color: c.statusColor,
                letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 20,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: c.statusColor, flexShrink: 0,
                  animation: c.featured ? 'none' : undefined,
                }} />
                {c.status}
              </div>

              {/* Flag + city */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                <div>
                  <p style={{ color: 'var(--text)', fontSize: 26, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.5, lineHeight: 1 }}>
                    {c.city}
                  </p>
                  <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0, fontWeight: 600 }}>
                    {c.country}
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <p style={{ color: c.featured ? 'var(--accent)' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px' }}>
                {c.tagline}
              </p>

              {/* Description */}
              <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                {c.description}
              </p>

              {/* CTA */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: c.featured ? 'var(--accent)' : 'var(--text-2)',
                }}>
                  View community →
                </span>
                {c.featured && (
                  <div style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 40,
                    clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                    background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                  }}>
                    <span style={{ fontSize: 7, fontWeight: 800 }}>FM</span>
                    <span style={{ fontSize: 9, fontWeight: 900 }}>#1</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ textAlign: 'center', padding: '0 24px 60px', animation: 'fade-up 0.5s ease 0.4s both' }}>
        <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '0 0 16px' }}>
          Want your city? Let us know.
        </p>
        <Link href="/sparring/create"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent)', color: '#000', fontWeight: 900,
            fontSize: 14, padding: '13px 28px', borderRadius: 10, textDecoration: 'none',
            boxShadow: '0 0 24px color-mix(in srgb, var(--accent) 25%, transparent)',
          }}>
          Join the founding members →
        </Link>
      </div>
    </div>
  )
}
