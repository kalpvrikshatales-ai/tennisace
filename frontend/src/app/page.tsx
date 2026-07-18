import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import HomeCommunityHero from './HomeCommunityHero'
import type { Match } from '@/types'

export const metadata: Metadata = {
  title: 'TennisAce — Find Tennis Players & Coaches Near You',
  description: 'TennisAce — Find tennis players and coaches near you. Join the founding community in Barcelona and Mumbai.',
  openGraph: {
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find tennis players and coaches near you. Join the founding community in Barcelona and Mumbai.',
    url: 'https://tennisace.live',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find tennis players and coaches near you. Join the founding community in Barcelona and Mumbai.',
  },
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

async function fetchWithTimeout(url: string, ms = 10_000): Promise<Response | null> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 30 } })
    clearTimeout(id)
    return res
  } catch {
    clearTimeout(id)
    return null
  }
}

async function getInitialMatches(): Promise<{
  live:     Match[]
  fixtures: any[]
  results:  any[]
}> {
  const [liveRes, fixturesRes, resultsRes] = await Promise.allSettled([
    fetchWithTimeout(`${BACKEND}/matches/live`),
    fetchWithTimeout(`${BACKEND}/feed/fixtures?days=7&limit=50`),
    fetchWithTimeout(`${BACKEND}/feed/results?days=7&limit=50`),
  ])

  const live: Match[] =
    liveRes.status === 'fulfilled' && liveRes.value?.ok
      ? ((await liveRes.value.json()).matches ?? [])
      : []

  const fixtures: any[] =
    fixturesRes.status === 'fulfilled' && fixturesRes.value?.ok
      ? ((await fixturesRes.value.json()).fixtures ?? [])
      : []

  const results: any[] =
    resultsRes.status === 'fulfilled' && resultsRes.value?.ok
      ? ((await resultsRes.value.json()).results ?? [])
      : []

  return { live, fixtures, results }
}

export default async function Home() {
  const { live, fixtures, results } = await getInitialMatches()

  return (
    <>
      {/* ── Community hero — the primary story ── */}
      <HomeCommunityHero />

      {/* ── Divider: scores section label ── */}
      <div style={{ background: '#080f1a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px 0' }}>
          <p style={{
            color:         'rgba(255,255,255,0.28)',
            fontSize:      11,
            fontWeight:    800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            margin:        0,
          }}>
            Live Scores — US Open starts Aug 25
          </p>
        </div>
      </div>

      {/* ── Existing scores / rankings / news tabs ── */}
      <HomeClient
        initialLive={live}
        initialFixtures={fixtures}
        initialResults={results}
      />
    </>
  )
}
