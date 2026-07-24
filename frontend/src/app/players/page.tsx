import type { Metadata } from 'next'
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase-server'
import { toSlug } from '@/lib/playerSlug'
import PlayersIndexClient from './PlayersIndexClient'

export const revalidate = 86400

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

export const metadata: Metadata = {
  title: 'ATP & WTA Tennis Player Profiles | TennisAce',
  description: 'Browse ATP and WTA tennis player profiles. Career stats, rankings, surface records and match history for top professional players.',
  alternates: { canonical: 'https://tennisace.live/players' },
}

async function fetchRankings(type: 'ATP' | 'WTA') {
  try {
    const res = await fetch(`${BACKEND}/players/rankings?type=${type}&limit=100`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.rankings ?? []
  } catch {
    return []
  }
}

export default async function PlayersPage() {
  const [atpRankings, wtaRankings] = await Promise.all([
    fetchRankings('ATP'),
    fetchRankings('WTA'),
  ])

  // Seed slug ↔ player_key mappings + rankings data so profile pages can resolve without scanning rankings
  if (supabaseServer) {
    const now = new Date().toISOString()
    const mappings = [
      ...atpRankings.filter((r: any) => r.player_key && r.player),
      ...wtaRankings.filter((r: any) => r.player_key && r.player),
    ].map((r: any) => ({
      player_key: String(r.player_key),
      slug: toSlug(r.player),
      name: r.player,
      data: r,
      cached_at: now,
    }))

    if (mappings.length > 0) {
      try {
        await supabaseServer
          .from('players_cache')
          .upsert(mappings, { onConflict: 'player_key', ignoreDuplicates: false })
      } catch {}
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/rankings"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <img src="/logo.png" alt="TennisAce" className="h-7 w-7 rounded-xl object-cover flex-shrink-0" />
          <span className="text-[15px] font-black text-gray-900">Players</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-nav md:pb-8 pt-2">
        <PlayersIndexClient atpRankings={atpRankings} wtaRankings={wtaRankings} />
      </main>
    </div>
  )
}
