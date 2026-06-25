'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPlayer } from '@/lib/api'

const surfaceColor: Record<string, string> = {
  hard: '#60a5fa', clay: '#fb923c', grass: '#4ade80', carpet: '#c084fc',
}

interface StatRow {
  season: string
  type: string
  rank: string
  titles: string
  matches_won: string
  matches_lost: string
  hard_won?: string
  hard_lost?: string
  clay_won?: string
  clay_lost?: string
  grass_won?: string
  grass_lost?: string
}

export default function PlayerPage() {
  const { key } = useParams<{ key: string }>()
  const router = useRouter()
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statType, setStatType] = useState<'singles' | 'doubles'>('singles')

  useEffect(() => {
    getPlayer(key).then(setPlayer).catch(() => {}).finally(() => setLoading(false))
  }, [key])

  const stats: StatRow[] = (player?.stats ?? [])
    .filter((s: StatRow) => s.type === statType)
    .sort((a: StatRow, b: StatRow) => parseInt(b.season) - parseInt(a.season))
    .slice(0, 5)

  const currentSeason = stats[0]
  const totalWon = stats.reduce((acc: number, s: StatRow) => acc + parseInt(s.matches_won || '0'), 0)
  const totalLost = stats.reduce((acc: number, s: StatRow) => acc + parseInt(s.matches_lost || '0'), 0)
  const winPct = totalWon + totalLost > 0 ? Math.round(totalWon / (totalWon + totalLost) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0B1F3A]">
      <header className="sticky top-0 z-20 bg-[#0B1F3A]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors text-sm">
            ← Back
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-bold tracking-tight">Tennis<span className="text-[#00C875]">Ace</span></h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 rounded-xl bg-[#0F2A4A] animate-pulse" />
            <div className="h-48 rounded-xl bg-[#0F2A4A] animate-pulse" />
          </div>
        ) : !player || !player.player_key ? (
          <div className="text-center py-20">
            <p className="text-white/50">Player not found.</p>
          </div>
        ) : (
          <>
            {/* Profile hero */}
            <div className="rounded-xl bg-[#0F2A4A] border border-white/[0.06] p-5 mb-5 flex items-center gap-5">
              {player.player_logo && (
                <img
                  src={player.player_logo}
                  alt={player.player_full_name}
                  className="w-20 h-20 rounded-full object-cover bg-white/10 border-2 border-[#00C875]/30 flex-shrink-0"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white">{player.player_full_name}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-white/40 text-sm">{player.player_country}</span>
                  {player.player_bday && (
                    <span className="text-white/30 text-xs">
                      Born {player.player_bday}
                    </span>
                  )}
                </div>
                {currentSeason && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[#00C875] text-sm font-bold">#{currentSeason.rank}</span>
                    <span className="text-white/30 text-xs">ranking {currentSeason.season}</span>
                    {currentSeason.titles !== '0' && (
                      <span className="text-amber-400 text-xs font-semibold">🏆 {currentSeason.titles} title{parseInt(currentSeason.titles) !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Win rate summary */}
            {(totalWon + totalLost) > 0 && (
              <div className="rounded-xl bg-[#0F2A4A] border border-white/[0.06] p-4 mb-5">
                <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Career ({statType})</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#00C875] rounded-full" style={{ width: `${winPct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{winPct}%</span>
                </div>
                <div className="flex gap-6 mt-2">
                  <span className="text-xs text-white/50"><span className="text-white font-bold">{totalWon}</span> won</span>
                  <span className="text-xs text-white/50"><span className="text-white/40 font-bold">{totalLost}</span> lost</span>
                </div>
              </div>
            )}

            {/* Singles / Doubles toggle */}
            <div className="flex gap-2 mb-4">
              {(['singles', 'doubles'] as const).map(t => (
                <button key={t} onClick={() => setStatType(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    statType === t ? 'bg-[#00C875] text-[#0B1F3A]' : 'bg-white/[0.06] text-white/50 hover:text-white'
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Season stats table */}
            {stats.length > 0 && (
              <div className="rounded-xl bg-[#0F2A4A] border border-white/[0.06] overflow-hidden mb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Season', 'Rank', 'W', 'L', 'Titles', 'Hard', 'Clay', 'Grass'].map(h => (
                        <th key={h} className="py-2 px-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s, i) => (
                      <tr key={i} className="border-b border-white/[0.04] last:border-0">
                        <td className="py-2.5 px-3 text-white font-semibold">{s.season}</td>
                        <td className="py-2.5 px-3 text-white/60 text-right">#{s.rank}</td>
                        <td className="py-2.5 px-3 text-[#00C875] font-bold text-right">{s.matches_won}</td>
                        <td className="py-2.5 px-3 text-white/40 text-right">{s.matches_lost}</td>
                        <td className="py-2.5 px-3 text-amber-400 text-right">{s.titles !== '0' ? s.titles : '–'}</td>
                        <td className="py-2.5 px-3 text-white/50 text-right text-xs">{s.hard_won || 0}–{s.hard_lost || 0}</td>
                        <td className="py-2.5 px-3 text-white/50 text-right text-xs">{s.clay_won || 0}–{s.clay_lost || 0}</td>
                        <td className="py-2.5 px-3 text-white/50 text-right text-xs">{s.grass_won || 0}–{s.grass_lost || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
