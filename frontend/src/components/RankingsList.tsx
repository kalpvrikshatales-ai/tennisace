'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRankings } from '@/lib/api'
import FavButton from '@/components/FavButton'
import { getFavourites } from '@/lib/favourites'

interface RankingEntry {
  place: string
  player: string
  player_key: number
  league: string
  movement: string
  country: string
  points: string
}

const movementIcon = (m: string) => {
  if (m === 'up')   return <span className="text-[#00C875] text-[10px]">▲</span>
  if (m === 'down') return <span className="text-red-400 text-[10px]">▼</span>
  return <span className="text-white/20 text-[10px]">—</span>
}

export default function RankingsList() {
  const [type, setType] = useState<'ATP' | 'WTA'>('ATP')
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [favKeys, setFavKeys] = useState<number[]>([])

  useEffect(() => {
    setFavKeys(getFavourites().map(f => f.key))
    const handler = () => setFavKeys(getFavourites().map(f => f.key))
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    getRankings(type)
      .then(d => setRankings(d.rankings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type])

  return (
    <div>
      {/* ATP / WTA toggle */}
      <div className="flex gap-2 mb-4">
        {(['ATP', 'WTA'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              type === t
                ? 'bg-[#00C875] text-[#0B1F3A]'
                : 'bg-white/[0.06] text-white/50 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl glass animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {rankings.slice(0, 50).map((r) => (
            <Link key={r.player_key} href={`/players/${r.player_key}`}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass hover:bg-[#112547] hover:border-[#00C875]/20 border border-white/[0.04] transition-all cursor-pointer">
                {/* Rank */}
                <div className="w-8 flex-shrink-0 text-center">
                  <span className={`text-sm font-bold tabular-nums ${
                    parseInt(r.place) <= 3 ? 'text-[#00C875]' : 'text-white/50'
                  }`}>
                    {r.place}
                  </span>
                </div>

                {/* Movement */}
                <div className="w-4 flex-shrink-0 flex justify-center">
                  {movementIcon(r.movement)}
                </div>

                {/* Player name + country */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.player}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{r.country}</p>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold text-white/70 tabular-nums">
                    {parseInt(r.points).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-white/25">pts</p>
                </div>

                <FavButton
                  player={{ key: r.player_key, name: r.player, country: r.country, league: type }}
                  size="sm"
                />
                <span className="text-white/15 text-sm">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
