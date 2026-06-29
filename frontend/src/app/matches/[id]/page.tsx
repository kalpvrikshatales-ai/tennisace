'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getH2H } from '@/lib/api'
import PointByPoint from '@/components/PointByPoint'
import type { Match } from '@/types'

const SURFACE_STYLE: Record<string, { color: string; label: string }> = {
  Grass: { color: '#22C55E', label: '🌿 Grass' },
  Clay:  { color: '#F97316', label: '🏺 Clay' },
  Hard:  { color: '#3B82F6', label: '🔵 Hard' },
}

// Circle chart for simple count stats like Aces
function StatCircle({ label, val1, val2 }: { label: string; val1: string; val2: string }) {
  const n1 = parseInt(val1) || 0
  const n2 = parseInt(val2) || 0
  const total = n1 + n2 || 1
  const pct1 = Math.round(n1 / total * 100)
  const r = 38, circ = 2 * Math.PI * r
  const dash1 = (pct1 / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none" stroke="#00C875" strokeWidth="8"
            strokeDasharray={`${dash1} ${circ - dash1}`}
            strokeDashoffset={circ / 4} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] font-black text-gray-900">{val1} <span className="text-gray-400 font-normal text-[11px]">vs</span> {val2}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// Single row in stats table
function StatRow({ label, v1, v2, highlight }: { label: string; v1: string; v2: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center py-2.5 border-b border-gray-50 last:border-0 ${highlight ? 'bg-green-50/50 -mx-4 px-4 rounded-lg' : ''}`}>
      <span className={`flex-1 text-right text-[13px] font-bold ${highlight ? 'text-[#00C875]' : 'text-gray-900'}`}>{v1}</span>
      <span className="w-40 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-2">{label}</span>
      <span className={`flex-1 text-left text-[13px] font-bold ${highlight ? 'text-gray-500' : 'text-gray-900'}`}>{v2}</span>
    </div>
  )
}

function StatBar({ label, won1, total1, won2, total2 }: { label: string; won1: number; total1: number; won2: number; total2: number }) {
  const p1Pct = total1 > 0 ? Math.round(won1 / total1 * 100) : 0
  const p2Pct = total2 > 0 ? Math.round(won2 / total2 * 100) : 0
  const combinedTotal = (total1 + total2) || 1
  const barWidth1 = Math.round(won1 / combinedTotal * 100)
  const barWidth2 = Math.round(won2 / combinedTotal * 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[12px] font-bold mb-1.5">
        <span className="text-gray-900">{won1}/{total1} ({p1Pct}%)</span>
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-gray-900">{won2}/{total2} ({p2Pct}%)</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="rounded-l-full transition-all" style={{ width: `${barWidth1}%`, background: '#00C875' }} />
        <div className="rounded-r-full transition-all bg-gray-200" style={{ width: `${barWidth2}%` }} />
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
    stats.find(s => s.player_key === playerKey && s.stat_name === name && s.stat_period === 'match')
  const getStatValue = (playerKey: number, name: string) => getStat(playerKey, name)?.stat_value
  const getStatWon = (playerKey: number, name: string) => getStat(playerKey, name)?.stat_won || 0
  const getStatTotal = (playerKey: number, name: string) => getStat(playerKey, name)?.stat_total || 0

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
            <p className="text-3xl mb-3">🎾</p>
            <p className="font-bold text-gray-900 text-[15px]">Match data unavailable</p>
            <p className="text-gray-400 text-sm mt-1">This match may be too old or not yet indexed.</p>
            <button onClick={() => router.back()} className="mt-4 text-[#00C875] text-sm font-semibold">← Go back</button>
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

            {/* Statistics — ScoreGO style */}
            {stats.length > 0 && match.player1_key && match.player2_key && (() => {
              const k1 = match.player1_key
              const k2 = match.player2_key

              const sv = (key: number, name: string) =>
                stats.find(s => s.player_key === key && s.stat_name === name)?.stat_value ?? '—'
              const sw = (key: number, name: string) =>
                parseInt(stats.find(s => s.player_key === key && s.stat_name === name)?.stat_won || '0')
              const st = (key: number, name: string) =>
                parseInt(stats.find(s => s.player_key === key && s.stat_name === name)?.stat_total || '0')

              // Format "won/total (pct%)" or just the value
              const fmt = (key: number, name: string) => {
                const won = sw(key, name), total = st(key, name)
                const val = sv(key, name)
                if (total > 0) return `${won}/${total} (${Math.round(won/total*100)}%)`
                return val
              }

              const aces1 = sv(k1, 'Aces'), aces2 = sv(k2, 'Aces')
              const df1 = sv(k1, 'Double Faults'), df2 = sv(k2, 'Double Faults')

              const tableRows = [
                { label: 'Aces',                v1: aces1,                             v2: aces2 },
                { label: 'Double Faults',        v1: df1,                               v2: df2 },
                { label: '1st Serve %',          v1: sv(k1, '1st serve percentage'),    v2: sv(k2, '1st serve percentage') },
                { label: '1st Serve Won',         v1: fmt(k1, '1st serve points won'),   v2: fmt(k2, '1st serve points won') },
                { label: '2nd Serve Won',         v1: fmt(k1, '2nd serve points won'),   v2: fmt(k2, '2nd serve points won') },
                { label: 'Break Points Won',      v1: fmt(k1, 'Break Points Converted'), v2: fmt(k2, 'Break Points Converted'), highlight: true },
                { label: 'Break Points Saved',    v1: fmt(k1, 'Break Points Saved'),     v2: fmt(k2, 'Break Points Saved') },
                { label: 'Winners',               v1: sv(k1, 'Winners'),                 v2: sv(k2, 'Winners') },
                { label: 'Unforced Errors',       v1: sv(k1, 'Unforced errors'),         v2: sv(k2, 'Unforced errors') },
                { label: 'Net Points Won',        v1: fmt(k1, 'Net points won'),         v2: fmt(k2, 'Net points won') },
                { label: 'Service Pts Won',       v1: fmt(k1, 'Service Points Won'),     v2: fmt(k2, 'Service Points Won') },
                { label: 'Return Pts Won',        v1: fmt(k1, 'Return Points Won'),      v2: fmt(k2, 'Return Points Won') },
                { label: 'Total Points Won',      v1: fmt(k1, 'Total Points Won'),       v2: fmt(k2, 'Total Points Won') },
              ].filter(r => r.v1 !== '—' || r.v2 !== '—')

              return (
                <div className="mb-5">
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-4 font-bold">Statistics</p>

                  {/* Circle charts for simple counts */}
                  {aces1 !== '—' && (
                    <div className="card p-4 mb-4">
                      <div className="flex justify-around">
                        <StatCircle label="Aces" val1={aces1} val2={aces2} />
                        {df1 !== '—' && <StatCircle label="Double Faults" val1={df1} val2={df2} />}
                      </div>
                      <div className="flex justify-center gap-6 mt-2">
                        <span className="text-[11px] font-bold text-gray-700">{match.player1.split(' ').pop()}</span>
                        <span className="text-[11px] text-gray-300">vs</span>
                        <span className="text-[11px] font-bold text-gray-700">{match.player2.split(' ').pop()}</span>
                      </div>
                    </div>
                  )}

                  {/* Full stats table */}
                  {tableRows.length > 0 && (
                    <div className="card px-4 py-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2 pb-1 text-center">All Statistics</p>
                      <div className="flex items-center pb-2 border-b border-gray-100">
                        <span className="flex-1 text-right text-[11px] font-black text-gray-900">{match.player1.split(' ').pop()}</span>
                        <span className="w-40" />
                        <span className="flex-1 text-left text-[11px] font-black text-gray-900">{match.player2.split(' ').pop()}</span>
                      </div>
                      {tableRows.map(r => (
                        <StatRow key={r.label} label={r.label} v1={r.v1} v2={r.v2} highlight={r.highlight} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Point by Point */}
            <PointByPoint pbp={pbp} player1={match.player1} player2={match.player2} />
          </>
        )}
      </main>
    </div>
  )
}
