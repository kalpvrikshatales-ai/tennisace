import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabase-server'
import { toSlug, isNumericKey } from '@/lib/playerSlug'
import PlayerPageClient from './PlayerPageClient'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

export const revalidate = 86400

export async function generateStaticParams() {
  try {
    const res = await fetch(`${BACKEND}/players/rankings?type=ATP&limit=50`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.rankings ?? [])
      .filter((r: any) => r.player)
      .map((r: any) => ({ slug: toSlug(r.player) }))
  } catch {
    return []
  }
}

async function fetchFromBackend(playerKey: string, slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND}/players/${playerKey}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()

    // Upstream data provider can be down/unavailable (e.g. billing gate) —
    // never let that poison the cache with a blank profile or the raw slug as name.
    const hasRealName = Boolean(data.player_full_name || data.player_name)
    if (data.profile_unavailable || !hasRealName) return null

    if (supabaseServer && slug) {
      try {
        await supabaseServer.from('players_cache').upsert(
          {
            player_key: playerKey,
            slug,
            name: data.player_full_name || data.player_name,
            data,
            cached_at: new Date().toISOString(),
          },
          { onConflict: 'player_key' }
        )
      } catch {}
    }
    return data
  } catch {
    return null
  }
}

async function seedSlug(playerKey: string, slug: string, name: string) {
  if (!supabaseServer) return
  try {
    await supabaseServer
      .from('players_cache')
      .upsert({ player_key: playerKey, slug, name }, { onConflict: 'player_key', ignoreDuplicates: true })
  } catch {}
}

async function resolveBySlug(slug: string): Promise<{ playerKey: string; player: any } | null> {
  // 1. Supabase cache hit with fresh data
  if (supabaseServer) {
    try {
      const { data: cached } = await supabaseServer
        .from('players_cache')
        .select('player_key, data, cached_at')
        .eq('slug', slug)
        .maybeSingle()

      if (cached?.player_key) {
        if (cached.data) {
          const ageMs = Date.now() - new Date(cached.cached_at).getTime()
          if (ageMs < 86_400_000) {
            return { playerKey: cached.player_key, player: cached.data }
          }
          // Stale — try to refresh; fall back to cached if backend unavailable
          const fresh = await fetchFromBackend(cached.player_key, slug)
          return { playerKey: cached.player_key, player: fresh ?? cached.data }
        }
        // Have key, no data — fetch now
        const player = await fetchFromBackend(cached.player_key, slug)
        if (player) return { playerKey: cached.player_key, player }
      }
    } catch {}
  }

  // 2. Scan rankings to resolve slug → player_key
  for (const type of ['ATP', 'WTA']) {
    try {
      const res = await fetch(`${BACKEND}/players/rankings?type=${type}&limit=200`, { cache: 'no-store' })
      if (!res.ok) continue
      const data = await res.json()
      const match = (data.rankings ?? []).find((r: any) => toSlug(r.player) === slug)
      if (match?.player_key) {
        const playerKey = String(match.player_key)
        await seedSlug(playerKey, slug, match.player)
        const player = await fetchFromBackend(playerKey, slug)
        if (player) return { playerKey, player }
      }
    } catch {}
  }

  return null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  const nameFromSlug = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  let name = nameFromSlug
  let rank: string | null = null
  let country: string | null = null

  if (supabaseServer) {
    try {
      const { data } = await supabaseServer
        .from('players_cache')
        .select('name, data')
        .eq('slug', slug)
        .maybeSingle()
      if (data?.name) name = data.name
      if (data?.data) {
        const p = data.data
        const singles = (p.stats || [])
          .filter((s: any) => s.type === 'singles')
          .sort((a: any, b: any) => parseInt(b.season) - parseInt(a.season))
        rank = p.current_rank || singles[0]?.rank || null
        country = p.player_country || null
      }
    } catch {}
  }

  const title = `${name} — Stats, Rankings & Profile | TennisAce`
  const parts = [`${name} career stats`]
  if (rank) parts.push(`currently ranked #${rank}`)
  if (country) parts.push(`representing ${country}`)
  parts.push('ATP/WTA rankings, surface records and match history on TennisAce.')
  const description = parts.join(', ')

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `https://tennisace.live/players/${slug}` },
  }
}

export default async function PlayerPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  // Redirect legacy numeric-key URLs to slug-based canonical URLs
  if (isNumericKey(slug)) {
    let foundSlug: string | null = null
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer
          .from('players_cache')
          .select('slug')
          .eq('player_key', slug)
          .maybeSingle()
        foundSlug = data?.slug || null
      } catch {}
    }
    if (!foundSlug) {
      const playerData = await fetchFromBackend(slug, '')
      if (!playerData) notFound()
      foundSlug = toSlug(playerData.player_full_name || playerData.player_name || slug)
      await seedSlug(slug, foundSlug, playerData.player_full_name || playerData.player_name)
    }
    redirect(`/players/${foundSlug}`)
  }

  const result = await resolveBySlug(slug)
  if (!result) notFound()

  const { player, playerKey } = result

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.player_full_name || player.player_name,
    nationality: player.player_country,
    description: `Professional tennis player${player.current_rank ? `, ranked #${player.current_rank} on the ATP/WTA tour` : ''}.`,
    url: `https://tennisace.live/players/${slug}`,
    ...(player.player_logo ? { image: player.player_logo } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlayerPageClient player={player} playerKey={Number(playerKey)} />
    </>
  )
}
