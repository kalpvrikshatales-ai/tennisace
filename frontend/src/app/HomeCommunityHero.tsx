import Link from 'next/link'
import Image from 'next/image'
import { IconRing, PrimaryButton, SecondaryButton } from '@/components/CardKit'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

type Member = {
  id:               string
  name:             string
  photo_url?:       string
  founding_number?: number
  profile_type?:    string
}

type CityProgress = {
  city:             string
  country:          string
  player_count:     number
  coach_count:      number
  player_target:    number
  coach_target:     number
  next_number:      number
  founding_members: Member[]
}

async function fetchCity(city: string): Promise<CityProgress | null> {
  try {
    const res = await fetch(`${BACKEND}/sparring/city-progress/${city}`, {
      next: { revalidate: 120 },
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function fetchTotalCount(): Promise<number> {
  try {
    const res = await fetch(`${BACKEND}/sparring/members/count`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return 0
    const d = await res.json()
    return d.count ?? 0
  } catch { return 0 }
}

function CityCard({ data, flag, slug, accentColor, photo, photoPosition, featured }: {
  data:          CityProgress | null
  flag:          string
  slug:          string
  accentColor:   string
  photo:         string
  photoPosition?: string
  featured?:     boolean
}) {
  const total     = data ? data.player_count + data.coach_count : 0
  const target    = data?.player_target ?? 500
  const pct       = total > 0 ? Math.min((total / target) * 100, 100) : 0
  const nextMs    = total < 50 ? 50 : total < 200 ? 200 : 500
  const spotsLeft = Math.max(0, nextMs - total)
  const msLabel   = nextMs === 50 ? 'Early Access' : nextMs === 200 ? 'Community Launch' : 'Full Launch'
  const city      = data?.city ?? slug
  const isEmpty   = total === 0

  return (
    <div className="city-hero-card" style={{
      border:       '1.5px solid color-mix(in srgb, var(--accent) 22%, transparent)',
      borderRadius: 20,
      padding:      '28px 24px 24px',
      minHeight:    200,
      display:      'flex',
      flexDirection:'column',
      position:     'relative',
      overflow:     'hidden',
    }}>
      {/* Real court photo background */}
      <Image src={photo} alt="" fill style={{ objectFit: 'cover', objectPosition: photoPosition ?? 'center' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(13,20,30,0.82) 0%, rgba(13,20,30,0.5) 35%, rgba(13,20,30,0.55) 65%, rgba(13,20,30,0.9) 100%)',
      }} />

      {/* Radial glow top-right */}
      <div style={{
        position:   'absolute', top: -40, right: -40,
        width:      160, height: 160, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Milestone pill */}
      <div style={{
        display:       'inline-flex', alignItems: 'center', gap: 5,
        background:    `${accentColor}18`,
        border:        `1px solid ${accentColor}40`,
        borderRadius:  20, padding: '4px 11px',
        fontSize:      10, fontWeight: 800, color: accentColor,
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 20,
        alignSelf:     'flex-start',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
        {msLabel} — {spotsLeft} to go
      </div>

      {/* Flag + city name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{flag}</span>
        <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1, lineHeight: 1 }}>{city}</p>
      </div>

      {/* Member count — neon green, big */}
      <p style={{
        color:      isEmpty ? 'rgba(255,255,255,0.35)' : accentColor,
        fontSize:   isEmpty ? 14 : 20,
        fontWeight: 800,
        margin:     '0 0 18px',
        lineHeight: 1.2,
      }}>
        {isEmpty
          ? `Be the first tennis player in ${city} on TennisAce. Start something.`
          : `${total} founding member${total !== 1 ? 's' : ''}`}
      </p>

      {/* Progress bar */}
      {!isEmpty && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>
              {data?.player_count ?? 0} players
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {target} target
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height:     '100%',
              width:      `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${featured ? '#00C875' : '#d97706'})`,
              borderRadius: 3,
              minWidth:   pct > 0 ? 8 : 0,
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Full-width CTA */}
      <PrimaryButton href={`/community/${slug}`} fullWidth style={{ fontSize: 14, padding: '14px' }}>
        Join as Founding Member →
      </PrimaryButton>

      {/* Free forever note */}
      <p style={{
        color:         'rgba(255,255,255,0.28)',
        fontSize:      11,
        fontWeight:    700,
        textAlign:     'center',
        margin:        '10px 0 0',
        letterSpacing: 0.2,
      }}>
        Founding Member · Always Free · Limited spots
      </p>
      </div>
    </div>
  )
}

const HOW_IT_WORKS = [
  { step: 1, icon: '🎾', title: 'Create your profile',  desc: 'Player or Coach — takes 3 minutes' },
  { step: 2, icon: '🌍', title: 'Join your city',        desc: 'Become a founding member of Barcelona or Dubai' },
  { step: 3, icon: '🤝', title: 'Connect & play',        desc: 'Find partners, book coaches, post play requests' },
]

const VALUE_PROPS = [
  {
    icon:  '🤝',
    title: 'Find a hitting partner',
    desc:  'Browse players in your city, filter by level, surface, and availability.',
  },
  {
    icon:  '🏫',
    title: 'Connect with coaches',
    desc:  'Find certified coaches and book your first session.',
  },
  {
    icon:  '🎾',
    title: 'Build your tennis identity',
    desc:  'Earn your founding badge, post play requests, and track your game.',
  },
]

export default async function HomeCommunityHero() {
  const [barcelona, dubai, totalMembers] = await Promise.all([
    fetchCity('Barcelona'),
    fetchCity('Dubai'),
    fetchTotalCount(),
  ])

  const allMembers = [
    ...(barcelona?.founding_members?.slice(0, 3) ?? []),
    ...(dubai?.founding_members?.slice(0, 3) ?? []),
  ].slice(0, 6)

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', position: 'relative' }}>
      {/* Ambient clay-court texture behind the whole page — fixed so it stays put while scrolling */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Image src="/photos/splash-court.jpg" alt="" fill style={{ objectFit: 'cover', opacity: 0.14 }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes hero-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        @keyframes hero-fade  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .hero-dot { animation: hero-pulse 2.2s ease-in-out infinite; }
        .city-hero-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; cursor: pointer; }
        .city-hero-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px color-mix(in srgb, var(--accent) 10%, transparent); }
        .vp-card { transition: border-color 0.18s ease; }
        .vp-card:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .cta-outline:hover { background: color-mix(in srgb, var(--accent) 8%, transparent) !important; }
        .proof-link:hover { background: color-mix(in srgb, var(--accent) 12%, transparent) !important; }
        .member-av { transition: transform 0.14s ease; }
        .member-av:hover { transform: scale(1.1); }
        .hw-card { transition: border-color 0.18s ease, transform 0.18s ease; }
        .hw-card:hover { border-color: color-mix(in srgb, var(--accent) 18%, transparent) !important; transform: translateY(-2px); }
        .hero-content { animation: hero-fade 0.6s ease 0.1s both; }
        .hero-cities  { animation: hero-fade 0.6s ease 0.2s both; }
        @media (max-width: 600px) {
          .hero-h1     { font-size: 36px !important; letter-spacing: -1px !important; }
          .hero-ctas   { flex-direction: column !important; align-items: stretch !important; }
          .hero-ctas a { width: 100% !important; justify-content: center !important; }
          .city-grid   { grid-template-columns: 1fr !important; }
          .city-hero-card { min-height: 180px !important; }
          .vp-grid     { grid-template-columns: 1fr !important; }
          .hw-grid     { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{
        backgroundColor: '#0d1b2e',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px),
          radial-gradient(ellipse 100% 55% at 50% 0%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 72%)
        `,
        backgroundSize: '80px 80px, 80px 80px, 100% 100%',
        padding:        'clamp(60px, 9vw, 100px) 24px clamp(72px, 9vw, 100px)',
        textAlign:      'center',
      }}>
        <div className="hero-content" style={{ maxWidth: 620, margin: '0 auto' }}>

          {/* Live badge */}
          <div style={{
            display:      'inline-flex', alignItems: 'center', gap: 8,
            background:   'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
            borderRadius: 100, padding: '7px 16px', marginBottom: 32,
          }}>
            <span className="hero-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)', flexShrink: 0, display: 'inline-block',
            }} />
            <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 800, letterSpacing: 0.4 }}>
              Now building in Barcelona &amp; Dubai
            </span>
          </div>

          {/* H1 */}
          <h1 className="hero-h1" style={{
            color:        '#fff',
            fontSize:     'clamp(42px, 7.5vw, 70px)',
            fontWeight:   900,
            letterSpacing:-1.8,
            lineHeight:   1.03,
            margin:       '0 0 22px',
          }}>
            Tennis is better<br />together.
          </h1>

          {/* Subheadline */}
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 500,
            lineHeight: 1.65, margin: '0 auto 40px', maxWidth: 450,
          }}>
            Find players. Find coaches. Build your tennis community — in your city.
          </p>

          {/* CTAs */}
          <div className="hero-ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <PrimaryButton href="/community/Barcelona">🇪🇸 Join Barcelona</PrimaryButton>
            <SecondaryButton href="/community/Dubai">🇦🇪 Join Dubai</SecondaryButton>
          </div>

          {/* Proof micro-copy */}
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, fontWeight: 600, margin: 0, letterSpacing: 0.1 }}>
            🎾 {totalMembers} founding member{totalMembers !== 1 ? 's' : ''} · Barcelona &amp; Dubai · Founding Members Free
          </p>
        </div>
      </section>

      {/* ━━━ FIND A PARTNER CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'rgba(8,15,26,0.88)', padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <IconRing icon="🤝" size={48} />
          </div>
          <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', margin: '0 0 10px' }}>
            Your next match is waiting
          </p>
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, letterSpacing: -0.6, margin: '0 0 12px', lineHeight: 1.15 }}>
            Create your profile, find your partner.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 420 }}>
            Set your level, surface, and city — then browse real players ready to hit near you.
          </p>
          <div className="hero-ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton href="/sparring/create">Create Your Profile →</PrimaryButton>
            <SecondaryButton href="/sparring">Browse Players</SecondaryButton>
          </div>
        </div>
      </section>

      {/* ━━━ CITY CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'rgba(8,15,26,0.88)', padding: '0 20px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="city-grid" style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap:                 20,
            transform:           'translateY(-36px)',
          }}>
            <CityCard
              data={barcelona} flag="🇪🇸" slug="Barcelona"
              accentColor="var(--accent)"
              photo="/photos/barcelona-court.jpg"
              photoPosition="78% 78%"
              featured
            />
            <CityCard
              data={dubai} flag="🇦🇪" slug="Dubai"
              accentColor="var(--accent)"
              photo="/photos/dubai-court.jpg"
              photoPosition="center 60%"
            />
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED PHOTO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'rgba(8,15,26,0.88)', padding: '0 20px 52px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', borderRadius: 20, overflow: 'hidden', minHeight: 320 }}>
          <Image
            src="/photos/hero-players.jpg"
            alt="Two players in a rally on a golden-hour clay court"
            width={1600} height={914}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(0deg, rgba(8,15,26,0.85) 0%, transparent 55%)',
            padding: '48px 28px 22px',
          }}>
            <p style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>
              Real courts. Real players. Real games.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0, fontWeight: 600 }}>
              No fake stats, no bots — just tennis players finding each other.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'rgba(8,15,26,0.88)', padding: '0 20px 52px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{
            color: 'rgba(255,255,255,0.22)', fontSize: 11, fontWeight: 800,
            letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', margin: '0 0 24px',
          }}>
            How it works
          </p>
          <div className="hw-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
          }}>
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className="hw-card" style={{
                background:   '#0d1b2e',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding:      '24px 18px',
                position:     'relative',
              }}>
                <span style={{
                  position:   'absolute', top: 16, right: 16,
                  color:      'color-mix(in srgb, var(--accent) 18%, transparent)', fontSize: 28, fontWeight: 900, lineHeight: 1,
                }}>
                  {s.step}
                </span>
                <div style={{ marginBottom: 14 }}><IconRing icon={s.icon} size={44} /></div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, margin: '0 0 7px', letterSpacing: -0.2 }}>
                  {s.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ VALUE PROPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'rgba(8,15,26,0.88)', padding: '0 20px 52px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{
            color: 'rgba(255,255,255,0.22)', fontSize: 11, fontWeight: 800,
            letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', margin: '0 0 24px',
          }}>
            What you get
          </p>
          <div className="vp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {VALUE_PROPS.map(vp => (
              <div key={vp.title} className="vp-card" style={{
                background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '22px 18px',
              }}>
                <div style={{ marginBottom: 14 }}><IconRing icon={vp.icon} size={40} /></div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, margin: '0 0 7px', letterSpacing: -0.2 }}>{vp.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{vp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SOCIAL PROOF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'rgba(8,15,26,0.88)', padding: '0 20px 60px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            background:   '#0d1b2e', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, padding: '32px 24px', textAlign: 'center',
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 800,
              letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 22px',
            }}>
              🇪🇸 Barcelona vs 🇦🇪 Dubai — which city builds first?
            </p>

            {allMembers.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                {allMembers.map((m, i) => {
                  const init = (m.name ?? '?')[0].toUpperCase()
                  return (
                    <Link key={m.id} href={`/sparring/${m.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        className="member-av"
                        title={m.name}
                        style={{
                          width: 50, height: 50, borderRadius: '50%',
                          backgroundImage: m.photo_url ? `url(${m.photo_url})` : undefined,
                          backgroundSize:  'cover', backgroundPosition: 'center',
                          background:      m.photo_url ? undefined : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                          border:          '2px solid #0d1b2e',
                          outline:         '1.5px solid color-mix(in srgb, var(--accent) 22%, transparent)',
                          display:         'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize:        17, fontWeight: 900, color: 'var(--accent)',
                          overflow:        'hidden',
                          marginLeft:      i > 0 ? -12 : 0,
                          position:        'relative',
                          zIndex:          allMembers.length - i,
                        }}
                      >
                        {!m.photo_url && init}
                      </div>
                    </Link>
                  )
                })}
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)', border: '2px solid #0d1b2e',
                  outline: '1.5px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)',
                  marginLeft: -12, zIndex: 0, position: 'relative',
                }}>+more</div>
              </div>
            )}

            <Link href="/sparring/create" className="proof-link" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background:     'color-mix(in srgb, var(--accent) 9%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              color:          'var(--accent)', fontWeight: 800, fontSize: 14,
              padding:        '12px 26px', borderRadius: 10, textDecoration: 'none',
            }}>
              Be next →
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
