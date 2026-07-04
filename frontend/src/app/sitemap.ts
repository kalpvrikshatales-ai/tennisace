import type { MetadataRoute } from 'next'
import type { Match } from '@/types'
import { matchToSlug } from '@/lib/matchSlug'

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
    url: 'https://tennisace.live/news',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/wimbledon',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let matchEntries: MetadataRoute.Sitemap = []

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

  return [...STATIC_ROUTES, ...matchEntries]
}
