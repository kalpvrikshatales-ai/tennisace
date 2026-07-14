import type { Metadata } from 'next'
import Link from 'next/link'
import CountdownTimer from './CountdownTimer'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'US Open 2026 | TennisAce — Draw, Schedule & Scores',
  description:
    'Complete guide to US Open 2026. Dates, draw, player previews, key match schedule, road-to-US-Open form, and live scores on TennisAce.',
  openGraph: {
    title: 'US Open 2026 — TennisAce',
    description: 'Live scores, draw, and player previews for US Open 2026. Aug 25 – Sep 7, Flushing, NY.',
    url: 'https://tennisace.live/tournament/us-open-2026',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: 'US Open 2026',
  startDate: '2026-08-25',
  endDate: '2026-09-07',
  location: {
    '@type': 'Place',
    name: 'USTA Billie Jean King National Tennis Center',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Flushing Meadows-Corona Park',
      addressLocality: 'Queens',
      addressRegion: 'NY',
      postalCode: '11368',
      addressCountry: 'US',
    },
  },
  sport: 'Tennis',
  url: 'https://tennisace.live/tournament/us-open-2026',
}

const PLAYERS = [
  { name: 'Jannik Sinner',    flag: '🇮🇹', rank: 1,  note: 'Defending champion',          seeded: true  },
  { name: 'Carlos Alcaraz',   flag: '🇪🇸', rank: 2,  note: '2022 champion, crowd favourite', seeded: true },
  { name: 'Alexander Zverev', flag: '🇩🇪', rank: 3,  note: '2020 finalist, hardcourt specialist', seeded: true },
  { name: 'Novak Djokovic',   flag: '🇷🇸', rank: 5,  note: '3× US Open champion',          seeded: true  },
  { name: 'Aryna Sabalenka',  flag: '🇧🇾', rank: 1,  note: 'Defending women\'s champion',  seeded: true, women: true },
  { name: 'Coco Gauff',       flag: '🇺🇸', rank: 2,  note: '2023 champion, home favourite', seeded: true, women: true },
]

const KEY_DATES = [
  { date: 'Aug 19', label: 'Qualifying begins' },
  { date: 'Aug 25', label: 'Main draw starts', highlight: true },
  { date: 'Aug 30', label: 'Round of 16' },
  { date: 'Sep 3',  label: 'Women\'s QF' },
  { date: 'Sep 4',  label: 'Men\'s QF' },
  { date: 'Sep 6',  label: 'Women\'s SF' },
  { date: 'Sep 5',  label: 'Men\'s SF' },
  { date: 'Sep 6',  label: 'Women\'s Final' },
  { date: 'Sep 7',  label: 'Men\'s Final', highlight: true },
]

const WARMUP = [
  {
    name:    'National Bank Open (Montreal)',
    dates:   'Aug 1 – 13',
    surface: 'Hard',
    tier:    'Masters 1000',
    note:    'Sinner won 2024. First hardcourt test of the swing.',
  },
  {
    name:    'Western & Southern Open (Cincinnati)',
    dates:   'Aug 12 – 24',
    surface: 'Hard',
    tier:    'Masters 1000',
    note:    'Final tune-up before Flushing. Identical Deco Turf surface.',
  },
]

const STATS = [
  { label: 'Prize Money',  value: '$75M+',       sub: 'Estimated 2026 purse' },
  { label: 'Players',      value: '256',          sub: 'Main draw (men + women)' },
  { label: 'Courts',       value: '22',           sub: 'Including Arthur Ashe Stadium' },
  { label: 'Capacity',     value: '23,771',       sub: 'Arthur Ashe — largest in the world' },
]

export default function USOpenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ minHeight: '100vh', background: '#070c14', color: '#fff' }}>

        {/* ── NAV BACK ─────────────────────────────────────────── */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #0f1a2e' }}>
          <Link href="/" style={{ color: '#5a7a9a', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← TennisAce
          </Link>
        </div>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(160deg, #0d1b2e 0%, #091522 60%, #050d18 100%)', borderBottom: '1px solid #0f1a2e', padding: '48px 24px 40px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {/* Badge row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ background: '#39FF14', color: '#000', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1 }}>
                Grand Slam
              </span>
              <span style={{ background: '#132236', color: '#8ba3c0', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                Hard Court · Deco Turf
              </span>
              <span style={{ background: '#132236', color: '#8ba3c0', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                Flushing, New York
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 8px', letterSpacing: -1 }}>
              US Open <span style={{ color: '#39FF14' }}>2026</span>
            </h1>
            <p style={{ color: '#8ba3c0', fontSize: 16, margin: '0 0 28px', fontWeight: 500 }}>
              Aug 25 – Sep 7, 2026 &nbsp;·&nbsp; USTA Billie Jean King National Tennis Center
            </p>

            {/* Countdown */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ color: '#5a7a9a', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Starts in
              </p>
              <CountdownTimer />
            </div>

            {/* Prize pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#132236', border: '1px solid #1a3050', borderRadius: 12, padding: '12px 20px' }}>
              <span style={{ color: '#39FF14', fontSize: 20 }}>🏆</span>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#fff' }}>$75,000,000+</p>
                <p style={{ margin: 0, fontSize: 11, color: '#5a7a9a', fontWeight: 600 }}>Total prize money</p>
              </div>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          <section style={{ padding: '36px 0 28px', borderBottom: '1px solid #0f1a2e' }}>
            <p style={{ color: '#8ba3c0', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              The US Open is the fourth and final Grand Slam of the tennis calendar, played on hard courts
              at the USTA Billie Jean King National Tennis Center in Flushing, Queens. Known for its electric
              night-session atmosphere, deafening crowd energy, and the fastest hard courts in the Slam circuit,
              the US Open crowns the last major champions of the season. In 2026, all eyes are on Jannik Sinner
              as he bids to defend his title, with Carlos Alcaraz, Novak Djokovic, and Alexander Zverev
              among the fiercest challengers. On the women's side, Aryna Sabalenka returns as defending champion
              with Coco Gauff carrying home-crowd hopes.
            </p>
          </section>

          {/* ── PLAYERS TO WATCH ─────────────────────────────────── */}
          <section style={{ padding: '32px 0', borderBottom: '1px solid #0f1a2e' }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#39FF14', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 20px' }}>
              Players to Watch
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {PLAYERS.map(p => (
                <div key={p.name} style={{ background: '#132236', border: '1px solid #1a3050', borderRadius: 12, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{p.flag}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#39FF14', fontWeight: 700 }}>
                        {p.women ? 'WTA' : 'ATP'} #{p.rank}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#5a7a9a', lineHeight: 1.4 }}>{p.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── KEY DATES ────────────────────────────────────────── */}
          <section style={{ padding: '32px 0', borderBottom: '1px solid #0f1a2e' }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#39FF14', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 20px' }}>
              Key Dates
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {KEY_DATES.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                  {/* Timeline line + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0, paddingTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.highlight ? '#39FF14' : '#1a3050', border: d.highlight ? '2px solid #39FF14' : '2px solid #2a4060', flexShrink: 0 }} />
                    {i < KEY_DATES.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#0f1a2e', minHeight: 24 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ paddingLeft: 14, paddingBottom: i < KEY_DATES.length - 1 ? 16 : 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#5a7a9a', display: 'block', marginBottom: 2 }}>{d.date}</span>
                    <span style={{ fontSize: 14, fontWeight: d.highlight ? 800 : 600, color: d.highlight ? '#fff' : '#8ba3c0' }}>{d.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ROAD TO US OPEN ──────────────────────────────────── */}
          <section style={{ padding: '32px 0', borderBottom: '1px solid #0f1a2e' }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#39FF14', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 20px' }}>
              Road to US Open
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {WARMUP.map(t => (
                <div key={t.name} style={{ background: '#132236', border: '1px solid #1a3050', borderRadius: 12, padding: '18px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <span style={{ background: '#0d1b2e', color: '#39FF14', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100 }}>{t.tier}</span>
                    <span style={{ background: '#0d1b2e', color: '#5a7a9a', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{t.surface}</span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#fff' }}>{t.name}</p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#39FF14', fontWeight: 700 }}>{t.dates}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#5a7a9a', lineHeight: 1.5 }}>{t.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── STATS GRID ───────────────────────────────────────── */}
          <section style={{ padding: '32px 0', borderBottom: '1px solid #0f1a2e' }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#39FF14', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 20px' }}>
              Tournament Facts
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background: '#132236', border: '1px solid #1a3050', borderRadius: 12, padding: '18px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.value}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#8ba3c0' }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#5a7a9a' }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── BOTTOM CTA ───────────────────────────────────────── */}
          <section style={{ padding: '36px 0 48px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/"
              style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#39FF14', color: '#000', fontWeight: 900, fontSize: 14, padding: '14px 20px', borderRadius: 10, textDecoration: 'none' }}>
              🎾 Live Scores
            </Link>
            <Link href="/sparring"
              style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#132236', border: '1px solid #1a3050', color: '#fff', fontWeight: 800, fontSize: 14, padding: '14px 20px', borderRadius: 10, textDecoration: 'none' }}>
              🤝 Find a Partner
            </Link>
          </section>

        </div>
      </div>
    </>
  )
}
