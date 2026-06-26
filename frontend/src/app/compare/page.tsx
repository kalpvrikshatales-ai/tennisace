'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRankings, getPlayer, getH2H } from '@/lib/api'
import { getFlag } from '@/lib/flags'

interface RankingEntry { place: string; player: string; player_key: number; country: string; points: string; league: string }

const surfaceEmoji: Record<string, string> = { hard: '🔵', clay: '🏺', grass: '🌿' }

function StatBar({ label, v1, v2 }: { label: string; v1: number; v2: number }) {
  const total = v1 + v2 || 1
  const pct1 = Math.round((v1 / total) * 100)
  const pct2 = 100 - pct1
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] text-gray-900/40 mb-1">
        <span className="font-bold text-gray-900">{v1}</span>
        <span className="uppercase tracking-wider">{label}</span>
        <span className="font-bold text-gray-900">{v2}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-[#00C875] rounded-full transition-all" style={{ width: `${pct1}%` }} />
        <div className="bg-white/20 rounded-full transition-all" style={{ width: `${pct2}%` }} />
      </div>
    </div>
  )
}

export default function ComparePage() {
  const router = useRouter()
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [p1Key, setP1Key] = useState<number | null>(null)
  const [p2Key, setP2Key] = useState<number | null>(null)
  const [p1, setP1] = useState<any>(null)
  const [p2, setP2] = useState<any>(null)
  const [h2h, setH2h] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([getRankings('ATP'), getRankings('WTA')]).then(([a, w]) => {
      setRankings([...(a.rankings ?? []), ...(w.rankings ?? [])])
    })
  }, [])

  useEffect(() => {
    if (!p1Key || !p2Key) return
    setLoading(true)
    Promise.all([getPlayer(String(p1Key)), getPlayer(String(p2Key)), getH2H(String(p1Key), String(p2Key))])
      .then(([pl1, pl2, h]) => { setP1(pl1); setP2(pl2); setH2h(h.H2H ?? []) })
      .finally(() => setLoading(false))
  }, [p1Key, p2Key])

  const getStat = (player: any, key: string, season = '2026') => {
    const s = (player?.stats ?? []).find((x: any) => x.season === season && x.type === 'singles')
    return parseInt(s?.[key] ?? '0') || 0
  }

  const p1wins = h2h.filter(m => m.event_winner === 'First Player').length
  const p2wins = h2h.filter(m => m.event_winner === 'Second Player').length

  const PlayerCard = ({ player, side }: { player: any; side: 'left' | 'right' }) => {
    if (!player) return (
      <div className="flex-1 glass rounded-2xl p-4 flex items-center justify-center min-h-[140px]">
        <p className="text-gray-900/30 text-sm text-center">Select<br/>player</p>
      </div>
    )
    const stats = (player.stats ?? []).find((s: any) => s.season === '2026' && s.type === 'singles')
    return (
      <div className={`flex-1 glass rounded-2xl p-4 ${side === 'right' ? 'text-right' : ''}`}>
        {player.player_logo && (
          <img src={player.player_logo} alt="" className={`w-16 h-16 rounded-full object-cover border-2 border-[#00C875]/30 mb-2 ${side === 'right' ? 'ml-auto' : ''}`} onError={e => e.currentTarget.style.display='none'} />
        )}
        <p className="text-base font-black text-gray-900 leading-tight">{player.player_full_name}</p>
        <p className="text-[11px] text-gray-900/40 mt-0.5">{getFlag(player.player_country)} {player.player_country}</p>
        {stats && (
          <div className={`mt-2 flex gap-3 ${side === 'right' ? 'justify-end' : ''}`}>
            <span className="text-[#00C875] text-sm font-bold">#{stats.rank}</span>
            <span className="text-gray-900/40 text-sm">{stats.matches_won}W {stats.matches_lost}L</span>
            {stats.titles !== '0' && <span className="text-amber-400 text-sm">🏆{stats.titles}</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900/40 hover:text-gray-900 text-sm">← Back</button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-bold">Tennis<span className="text-[#00C875]">Ace</span></h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-4">Player vs Player</p>

        {/* Player selectors */}
        <div className="flex gap-3 mb-5">
          {/* P1 */}
          <div className="flex-1">
            <select
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-transparent border-0 outline-none appearance-none cursor-pointer"
              value={p1Key ?? ''}
              onChange={e => setP1Key(Number(e.target.value) || null)}
            >
              <option value="" className="bg-gray-50">Select player 1</option>
              {rankings.map(r => (
                <option key={r.player_key} value={r.player_key} className="bg-gray-50">
                  #{r.place} {r.player}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center w-8">
            <span className="text-[#00C875] font-black text-lg">vs</span>
          </div>
          {/* P2 */}
          <div className="flex-1">
            <select
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-transparent border-0 outline-none appearance-none cursor-pointer"
              value={p2Key ?? ''}
              onChange={e => setP2Key(Number(e.target.value) || null)}
            >
              <option value="" className="bg-gray-50">Select player 2</option>
              {rankings.filter(r => r.player_key !== p1Key).map(r => (
                <option key={r.player_key} value={r.player_key} className="bg-gray-50">
                  #{r.place} {r.player}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Player cards */}
        <div className="flex gap-3 mb-5">
          <PlayerCard player={p1} side="left" />
          <PlayerCard player={p2} side="right" />
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-900/30 text-sm">Loading comparison...</div>
        )}

        {p1 && p2 && !loading && (
          <>
            {/* H2H record */}
            {h2h.length > 0 && (
              <div className="glass rounded-2xl p-5 mb-4">
                <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-4">Head to Head — {h2h.length} meetings</p>
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-black text-[#00C875]">{p1wins}</p>
                    <p className="text-[11px] text-gray-900/40 mt-1">{p1?.player_full_name?.split(' ').pop()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900/20">–</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-black text-gray-900/60">{p2wins}</p>
                    <p className="text-[11px] text-gray-900/40 mt-1">{p2?.player_full_name?.split(' ').pop()}</p>
                  </div>
                </div>
                <StatBar label="H2H wins" v1={p1wins} v2={p2wins} />

                {/* Recent H2H */}
                <div className="space-y-2 mt-3">
                  {h2h.slice(0, 3).map((m: any, i: number) => {
                    const p1won = m.event_winner === 'First Player'
                    return (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-200 last:border-0">
                        <span className={p1won ? 'text-gray-900 font-semibold' : 'text-gray-900/40'}>{m.event_first_player}</span>
                        <span className="text-gray-900/30 text-[10px]">{m.tournament_name} {m.tournament_season}</span>
                        <span className={!p1won ? 'text-gray-900 font-semibold' : 'text-gray-900/40'}>{m.event_second_player}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 2026 Stats comparison */}
            <div className="glass rounded-2xl p-5 mb-4">
              <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-4">2026 Season Comparison</p>
              <StatBar label="Wins" v1={getStat(p1, 'matches_won')} v2={getStat(p2, 'matches_won')} />
              <StatBar label="Hard court wins" v1={getStat(p1, 'hard_won')} v2={getStat(p2, 'hard_won')} />
              <StatBar label="Clay wins" v1={getStat(p1, 'clay_won')} v2={getStat(p2, 'clay_won')} />
              <StatBar label="Grass wins" v1={getStat(p1, 'grass_won')} v2={getStat(p2, 'grass_won')} />
              <StatBar label="Titles" v1={getStat(p1, 'titles')} v2={getStat(p2, 'titles')} />
            </div>
          </>
        )}

        {!p1Key && !p2Key && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">⚔️</p>
            <p className="text-gray-900/50 text-sm">Pick two players to compare their stats, H2H record, and surface performance.</p>
          </div>
        )}
      </main>
    </div>
  )
}
