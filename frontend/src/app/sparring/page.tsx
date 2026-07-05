import type { Metadata } from 'next'
import SparringDiscover from './SparringDiscover'

export const metadata: Metadata = {
  title: 'Find a Hitting Partner | TennisAce Sparring',
  description: 'Find a tennis hitting partner near you. Browse players by city, level, surface, and availability.',
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

async function fetchProfiles(params: Record<string, string>): Promise<any[]> {
  const qs = new URLSearchParams()
  if (params.city)    qs.set('city',    params.city)
  if (params.level)   qs.set('level',   params.level)
  if (params.surface) qs.set('surface', params.surface)
  if (params.day)     qs.set('day',     params.day)
  if (params.time)    qs.set('time',    params.time)

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch(`${BACKEND}/sparring/profiles?${qs}`, {
        signal: controller.signal,
        next: { revalidate: 60 },
      })
      clearTimeout(timer)
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data.profiles) ? data.profiles : []
    } finally {
      clearTimeout(timer)
    }
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

  return <SparringDiscover initialProfiles={profiles} />
}
