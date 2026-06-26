'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getH2H } from '@/lib/api'
import PointByPoint from '@/components/PointByPoint'
import type { Match } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<any>(null)
  const [h2h, setH2h] = useState<any[]>([])
  const [pbp, setPbp] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMatch = useCallback(async () => {
    try {
      const data = await fetch(`${API}/matches/${id}`).then(r => r.json())
      if (data && data.player1) {
        setMatch(data)
        setPbp(data.point_by_point ?? [])
        if (data.player1_key && data.player2_key) {
          const hData = await getH2H(data.player1_key, data.player2_key)
          setH2h(hData.H2H ?? [])
        }
      }
    } catch {}
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    fetchMatch()
    const interval = setInterval(fetchMatch, 30_000)
    return () => clearInterval(interval)
  }, [fetchMatch])

  const isLive = match?.status === 'In Progress' || match?.status === '1'
  const scores = match?.score ? match.score.split(',').map((s: string) => s.trim()) : []
  const serving1 = match?.serve === 'First Player' || match?.serve === '1'
  const serving2 = match?.serve === 'Second Player' || match?.serve === '2'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-[#0B1F3A]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/40 hover:text-white text-sm">← Back</button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-bold">Tennis<span className="text-[#00C875]">Ace</span></h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl glass animate-pulse" />)}
          </div>
        ) : !match ? (
          <div className="text-center py-20">
            <p className="text-white/50">Match not found or has ended.</p>
            <button onClick={() => router.back()} className="mt-4 text-[#00C875] text-sm">← Go back</button>
          </div>
        ) : (
          <>
            {/* Match hero */}
            <div className="rounded-xl glass border border-[#00C875]/20 p-6 mb-5">
              {/* Tournament */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] text-white/40 uppercase tracking-wider">{match.tournament}{match.round ? ` · ${match.round}` : ''}</span>
                {isLive && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#00C875] uppercase tracking-widest">
                    <span className="live-dot w-2 h-2 rounded-full bg-[#00C875] inline-block" /> Live
                  </span>
                )}
              </div>

              {/* Players */}
              <div className="space-y-4">
                {/* Player 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {match.player1_img && (
                      <img src={match.player1_img} alt="" className="w-10 h-10 rounded-full object-cover bg-white/10" onError={e => e.currentTarget.style.display='none'} />
                    )}
                    <div>
                      <Link href={match.player1_key ? `/players/${match.player1_key}` : '#'}>
                        <p className={`text-lg font-bold hover:text-[#00C875] transition-colors ${serving1 ? 'text-white' : 'text-white/80'}`}>
                          {serving1 && '🎾 '}{match.player1}
                        </p>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLive && match.game_score && (
                      <span className={`text-base font-bold px-2 py-1 rounded ${serving1 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-white/30'}`}>
                        {match.game_score.split('-')[0]}
                      </span>
                    )}
                    <div className="flex gap-3">
                      {scores.map((s: string, i: number) => {
                        const [p1, p2] = s.split('-').map(Number)
                        return <span key={i} className={`text-2xl font-bold tabular-nums ${p1 > p2 ? 'text-white' : 'text-white/30'}`}>{p1}</span>
                      })}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Player 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {match.player2_img && (
                      <img src={match.player2_img} alt="" className="w-10 h-10 rounded-full object-cover bg-white/10" onError={e => e.currentTarget.style.display='none'} />
                    )}
                    <div>
                      <Link href={match.player2_key ? `/players/${match.player2_key}` : '#'}>
                        <p className={`text-lg font-bold hover:text-[#00C875] transition-colors ${serving2 ? 'text-white' : 'text-white/80'}`}>
                          {serving2 && '🎾 '}{match.player2}
                        </p>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLive && match.game_score && (
                      <span className={`text-base font-bold px-2 py-1 rounded ${serving2 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-white/30'}`}>
                        {match.game_score.split('-')[1]}
                      </span>
                    )}
                    <div className="flex gap-3">
                      {scores.map((s: string, i: number) => {
                        const [p1, p2] = s.split('-').map(Number)
                        return <span key={i} className={`text-2xl font-bold tabular-nums ${p2 > p1 ? 'text-white' : 'text-white/30'}`}>{p2}</span>
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Set labels */}
              {scores.length > 0 && (
                <div className="flex justify-end gap-3 mt-3 pr-0">
                  {scores.map((_: any, i: number) => (
                    <span key={i} className="text-[10px] text-white/25 w-8 text-center tabular-nums">S{i + 1}</span>
                  ))}
                </div>
              )}
            </div>

            {/* H2H */}
            {h2h.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">
                  Head to Head — last {Math.min(h2h.length, 5)} meetings
                </p>
                <div className="space-y-2">
                  {h2h.slice(0, 5).map((m: any, i: number) => {
                    const p1won = m.event_winner === 'First Player'
                    return (
                      <div key={i} className="rounded-xl glass border border-white/[0.04] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-white/30">{m.tournament_name} {m.tournament_season}</span>
                          <span className="text-[10px] text-white/20">{m.event_date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${p1won ? 'text-white' : 'text-white/40'}`}>
                            {m.event_first_player} {p1won && '✓'}
                          </span>
                          <div className="flex gap-2">
                            {(m.scores ?? []).map((s: any, j: number) => (
                              <span key={j} className="text-xs text-white/50 tabular-nums">
                                {s.score_first}-{s.score_second}
                              </span>
                            ))}
                          </div>
                          <span className={`text-sm font-semibold ${!p1won ? 'text-white' : 'text-white/40'}`}>
                            {!p1won && '✓ '}{m.event_second_player}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Point by Point */}
            <PointByPoint pbp={pbp} player1={match.player1} player2={match.player2} />
          </>
        )}
      </main>
    </div>
  )
}
