'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getH2H } from '@/lib/api'
import PointByPoint from '@/components/PointByPoint'
import MatchAnalytics from '@/components/MatchAnalytics'
import CommunityVoting from '@/components/CommunityVoting'
import type { Match } from '@/types'

const SURFACE_STYLE: Record<string, { color: string; label: string }> = {
  Grass: { color: '#22C55E', label: '🌿 Grass' },
  Clay:  { color: '#F97316', label: '🏺 Clay' },
  Hard:  { color: '#3B82F6', label: '🔵 Hard' },
}

function StatBar({ label, v1, v2, pct1, pct2 }: { label: string; v1: string; v2: string; pct1?: number; pct2?: number }) {
  const p1 = pct1 ?? (parseFloat(v1) || 0)
  const p2 = pct2 ?? (parseFloat(v2) || 0)
  const total = p1 + p2 || 1
  const pctLeft = Math.round(p1 / total * 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[12px] font-bold mb-1.5">
        <span className="text-gray-900">{v1}</span>
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-gray-900">{v2}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="rounded-l-full transition-all" style={{ width: `${pctLeft}%`, background: '#00C875' }} />
        <div className="rounded-r-full bg-gray-200 flex-1" />
      </div>
    </div>
  )
}

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
    || (match?.status || '').startsWith('Set')
  const scores = match?.score ? match.score.split(',').map((s: string) => s.trim()) : []
  const serving1 = match?.serve === 'First Player' || match?.serve === '1'
  const serving2 = match?.serve === 'Second Player' || match?.serve === '2'
  const surface  = match?.surface as string | undefined
  const surfStyle = SURFACE_STYLE[surface || 'Hard'] || SURFACE_STYLE.Hard

  // Parse stats from statistics[]
  const stats: any[] = match?.statistics || []
  const getStat = (playerKey: number, name: string) =>
    stats.find(s => s.player_key === playerKey && s.stat_name === name && s.stat_period === 'match')?.stat_value

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <img src="/logo.png" alt="TennisAce" className="h-6 w-auto" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl glass animate-pulse" />)}
          </div>
        ) : !match ? (
          <div className="text-center py-20">
            <p className="text-gray-900/50">Match not found or has ended.</p>
            <button onClick={() => router.back()} className="mt-4 text-[#00C875] text-sm">← Go back</button>
          </div>
        ) : (
          <>
            {/* Match hero */}
            <div className="rounded-2xl card overflow-hidden mb-5">
              {/* Surface colour stripe */}
              <div className="h-1 w-full" style={{ background: surfStyle.color }} />
              <div className="p-5">
              {/* Tournament + surface + round */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[14px] font-black text-gray-900">{match.tournament}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {surface && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${surfStyle.color}20`, color: surfStyle.color }}>
                        {surfStyle.label}
                      </span>
                    )}
                    {match.round && (
                      <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {match.round}
                      </span>
                    )}
                  </div>
                </div>
                {isLive ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#00C875] uppercase tracking-widest">
                    <span className="live-dot w-2 h-2 rounded-full bg-[#00C875] inline-block" />
                    {(match.status || '').startsWith('Set') ? match.status : 'Live'}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-semibold">
                    {match.date || 'Completed'}
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
                    <div className="cursor-pointer">
                      <Link href={match.player1_key ? `/players/${match.player1_key}` : '#'} className="block">
                        <p className={`text-lg font-bold hover:text-[#00C875] transition-colors ${serving1 ? 'text-gray-900' : 'text-gray-900/80'}`}>
                          {serving1 && '🎾 '}{match.player1}
                        </p>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLive && match.game_score && (
                      <span className={`text-base font-bold px-2 py-1 rounded ${serving1 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-gray-900/30'}`}>
                        {match.game_score.split('-')[0]}
                      </span>
                    )}
                    <div className="flex gap-3">
                      {scores.map((s: string, i: number) => {
                        const [p1, p2] = s.split('-').map(Number)
                        return <span key={i} className={`text-2xl font-bold tabular-nums ${p1 > p2 ? 'text-gray-900' : 'text-gray-900/30'}`}>{p1}</span>
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
                    <div className="cursor-pointer">
                      <Link href={match.player2_key ? `/players/${match.player2_key}` : '#'} className="block">
                        <p className={`text-lg font-bold hover:text-[#00C875] transition-colors ${serving2 ? 'text-gray-900' : 'text-gray-900/80'}`}>
                          {serving2 && '🎾 '}{match.player2}
                        </p>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLive && match.game_score && (
                      <span className={`text-base font-bold px-2 py-1 rounded ${serving2 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-gray-900/30'}`}>
                        {match.game_score.split('-')[1]}
                      </span>
                    )}
                    <div className="flex gap-3">
                      {scores.map((s: string, i: number) => {
                        const [p1, p2] = s.split('-').map(Number)
                        return <span key={i} className={`text-2xl font-bold tabular-nums ${p2 > p1 ? 'text-gray-900' : 'text-gray-900/30'}`}>{p2}</span>
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Set labels */}
              {scores.length > 0 && (
                <div className="flex justify-end gap-3 mt-3 pr-0">
                  {scores.map((_: any, i: number) => (
                    <span key={i} className="text-[10px] text-gray-400 w-8 text-center tabular-nums">S{i + 1}</span>
                  ))}
                </div>
              )}
              </div>{/* end padding div */}
            </div>

            {/* H2H */}
            {h2h.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-3">
                  Head to Head — last {Math.min(h2h.length, 5)} meetings
                </p>
                <div className="space-y-2">
                  {h2h.slice(0, 5).map((m: any, i: number) => {
                    const p1won = m.event_winner === 'First Player'
                    return (
                      <div key={i} className="rounded-xl glass border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-gray-900/30">{m.tournament_name} {m.tournament_season}</span>
                          <span className="text-[10px] text-gray-900/20">{m.event_date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${p1won ? 'text-gray-900' : 'text-gray-900/40'}`}>
                            {m.event_first_player} {p1won && '✓'}
                          </span>
                          <div className="flex gap-2">
                            {(m.scores ?? []).map((s: any, j: number) => (
                              <span key={j} className="text-xs text-gray-900/50 tabular-nums">
                                {s.score_first}-{s.score_second}
                              </span>
                            ))}
                          </div>
                          <span className={`text-sm font-semibold ${!p1won ? 'text-gray-900' : 'text-gray-900/40'}`}>
                            {!p1won && '✓ '}{m.event_second_player}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Community Voting */}
            <CommunityVoting match={match} matchId={id} />

            {/* Match Analytics */}
            {stats.length > 0 && match.player1_key && match.player2_key && (
              <MatchAnalytics match={match} stats={stats} pbp={pbp} />
            )}

            {/* Legacy Match Stats */}
            {stats.length > 0 && match.player1_key && match.player2_key && (
              <div className="mb-5">
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-3 font-bold">Detailed Stats</p>
                <div className="card p-4">
                  {[
                    { name: '1st Serve Won', key: '1st serve points won' },
                    { name: '2nd Serve Won', key: '2nd serve points won' },
                  ].map(stat => {
                    const v1 = getStat(match.player1_key, stat.key)
                    const v2 = getStat(match.player2_key, stat.key)
                    if (!v1 && !v2) return null
                    return <StatBar key={stat.key} label={stat.name} v1={v1 || '0'} v2={v2 || '0'} />
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
