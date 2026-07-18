import type { MetadataRoute } from 'next'
import type { Match } from '@/types'
import { matchToSlug } from '@/lib/matchSlug'
import { toSlug } from '@/lib/playerSlug'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: 'https://tennisace.live',
    lastModified: new Date(),
    changeFrequency: 'always',
    priority: 1.0,
  },
  {
    url: 'https://tennisace.live/rankings',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/players',
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/news',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/tournament/us-open-2026',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: 'https://tennisace.live/sparring',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/play',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: 'https://tennisace.live/community',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/community/Barcelona',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: 'https://tennisace.live/community/Mumbai',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let matchEntries: MetadataRoute.Sitemap = []
  let playerEntries: MetadataRoute.Sitemap = []

  try {
    const res = await fetch(`${BACKEND}/matches/live`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      const matches: Match[] = data.matches ?? []
      matchEntries = matches
        .filter(m => m.match_id && m.player1 && m.player2)
        .map(m => ({
          url: `https://tennisace.live/match/${matchToSlug(m)}`,
          lastModified: new Date(),
          changeFrequency: 'always' as const,
          priority: 0.9,
        }))
    }
  } catch {
    // Backend unavailable — static routes still returned below
  }

  try {
    const res = await fetch(`${BACKEND}/players/rankings?type=ATP&limit=50`, {
      next: { revalidate: 86400 },
    })
    if (res.ok) {
      const data = await res.json()
      playerEntries = (data.rankings ?? [])
        .filter((r: any) => r.player && r.player_key)
        .map((r: any) => ({
          url: `https://tennisace.live/players/${toSlug(r.player)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
    }
  } catch {}

  return [...STATIC_ROUTES, ...matchEntries, ...playerEntries]
}
