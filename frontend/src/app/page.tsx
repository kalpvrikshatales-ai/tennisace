import HomeClient from './HomeClient'
import type { Match } from '@/types'

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
  live: Match[]
  fixtures: any[]
  results: any[]
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
    <HomeClient
      initialLive={live}
      initialFixtures={fixtures}
      initialResults={results}
    />
  )
}
