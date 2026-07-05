'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getFlag } from '@/lib/flags'
import { toSlug } from '@/lib/playerSlug'

type RankEntry = {
  place: string
  player: string
  country?: string
  points?: string
  player_key?: number
}

export default function PlayersIndexClient({
  atpRankings,
  wtaRankings,
}: {
  atpRankings: RankEntry[]
  wtaRankings: RankEntry[]
}) {
  const [tour, setTour] = useState<'ATP' | 'WTA'>('ATP')
  const [search, setSearch] = useState('')

  const rankings = tour === 'ATP' ? atpRankings : wtaRankings
  const filtered = search
    ? rankings.filter(r => r.player.toLowerCase().includes(search.toLowerCase()))
    : rankings

  return (
    <>
      <div className="flex gap-2 mb-5">
        {(['ATP', 'WTA'] as const).map(t => (
          <button key={t} onClick={() => setTour(t)}
            className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
              tour === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {t}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search player..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl text-[13px] border border-gray-200 bg-white outline-none focus:border-[#00C875]"
        />
      </div>

      <div className="space-y-1.5">
        {filtered.map((r, i) => (
          <Link key={i} href={`/players/${toSlug(r.player)}`} className="block">
            <div className="card flex items-center gap-3 px-4 py-3 cursor-pointer card-glow">
              <div className="w-9 flex-shrink-0 text-center">
                <span className={`text-[14px] font-black tabular-nums ${
                  parseInt(r.place) <= 3 ? 'text-[#00C875]' :
                  parseInt(r.place) <= 10 ? 'text-gray-700' : 'text-gray-400'
                }`}>#{r.place}</span>
              </div>
              {r.country && (
                <span className="text-base flex-shrink-0">{getFlag(r.country)}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-gray-900 truncate">{r.player}</p>
                {r.country && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{r.country}</p>
                )}
              </div>
              {r.points && (
                <p className="text-[14px] font-bold text-gray-700 tabular-nums flex-shrink-0">
                  {parseInt(r.points).toLocaleString()}
                  <span className="text-[10px] text-gray-400 ml-0.5">pts</span>
                </p>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 text-sm">No players found</p>
        </div>
      )}
    </>
  )
}
