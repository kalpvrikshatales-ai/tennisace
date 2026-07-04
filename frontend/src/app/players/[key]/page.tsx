'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFlag } from '@/lib/flags'
import { PlayStyleSection, StrengthsWeaknesses, FavoriteSurface, TitlesByService, RecentFormGraph } from '@/components/PlayerInsights'
import { getPlayer } from '@/lib/api-reliable'

const SURFACE_DOT: Record<string, string> = {
  Grass: '#22C55E', Clay: '#F97316', Hard: '#9CA3AF',
}

function StatBox({ label, value, sub }: { label: string; value: string | number | null | undefined; sub?: string }) {
  if (!value && value !== 0) return null
  return (
    <div className="card p-4 text-center">
      <p className="text-[22px] font-black text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-[#00C875] font-bold mb-0.5">{sub}</p>}
      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: string }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-[13px] text-gray-500 font-medium">{icon && <span className="mr-1.5">{icon}</span>}{label}</span>
      <span className="text-[13px] font-bold text-gray-900">{value}</span>
    </div>
  )
}

function SurfaceBar({ label, won, lost, color }: { label: string; won: number; lost: number; color: string }) {
  const total = won + lost
  const pct = total > 0 ? Math.round(won / total * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="font-bold" style={{ color: pct >= 60 ? color : '#6B7280' }}>{pct}% ({won}W {lost}L)</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function MatchRow({ m, playerKey }: { m: any; playerKey: number }) {
  const isPlayer1 = m.player1_key === playerKey
  const won = (m.winner === 'First Player' && isPlayer1) || (m.winner === 'Second Player' && !isPlayer1)
  const opp = isPlayer1 ? m.player2 : m.player1
  const oppKey = isPlayer1 ? m.player2_key : m.player1_key
  const oppImg = isPlayer1 ? m.player2_img : m.player1_img
  const surfDot = SURFACE_DOT[m.surface || 'Hard'] || '#9CA3AF'

  return (
    <Link href={`/matches/${m.match_id}`}>
      <div className="card px-4 py-3 flex items-center gap-3 cursor-pointer card-glow">
        {/* Result badge */}
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
          won ? 'bg-[#00C875]/15 text-[#00C875]' : 'bg-gray-100 text-gray-500'
        }`}>{won ? 'W' : 'L'}</span>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {oppImg && <img src={oppImg} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0"
            onError={e => e.currentTarget.style.display='none'} />}
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 truncate">vs {opp}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: surfDot }} />
              <span className="text-[10px] text-gray-400 truncate">{m.tournament} · {m.round}</span>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <p className="text-[12px] font-bold text-gray-700 tabular-nums">{m.score || '-'}</p>
          <p className="text-[10px] text-gray-400">{m.date}</p>
        </div>
      </div>
    </Link>
  )
}

function FormStreak({ form }: { form: any }) {
  if (!form?.streak?.length) return null
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Current Form</p>
        <span className="text-[12px] font-bold text-gray-700">
          {form.wins}W {form.losses}L
          <span className="text-[#00C875] ml-1.5">{form.win_pct}%</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {form.streak.map((r: string, i: number) => (
          <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${
            r === 'W' ? 'bg-[#00C875]/15 text-[#00C875]' : 'bg-gray-100 text-gray-500'
          }`}>{r}</span>
        ))}
        <span className="text-[10px] text-gray-400 ml-1">last {form.streak.length}</span>
      </div>
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: any }) {
  if (!prediction) return null
  const prob = prediction.win_probability
  const color = prob >= 60 ? '#00C875' : prob >= 45 ? '#F59E0B' : '#EF4444'
  const oppKey = prediction.opponent_key
  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Match Prediction</p>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          {oppKey ? (
            <Link href={`/players/${oppKey}`}>
              <p className="text-[14px] font-bold text-gray-900 hover:text-[#00C875] truncate">
                vs {prediction.opponent}
              </p>
            </Link>
          ) : (
            <p className="text-[14px] font-bold text-gray-900 truncate">vs {prediction.opponent}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{prediction.tournament}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{prediction.surface}</span>
            {prediction.date && <span className="text-[10px] text-gray-400">{prediction.date}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[30px] font-black leading-none" style={{ color }}>{prob}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">win probability</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
        <div className="h-full rounded-full" style={{ width: `${prob}%`, background: color }} />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-gray-500 flex-wrap">
        <span>Form: <span className="font-bold text-gray-700">{prediction.form_record}</span></span>
        {prediction.surface_record && (
          <span>Surface: <span className="font-bold text-gray-700">{prediction.surface_record}</span></span>
        )}
        <span className="ml-auto text-[10px] text-gray-400 capitalize">{prediction.confidence} confidence</span>
      </div>
    </div>
  )
}

export default function PlayerPage() {
  const { key } = useParams<{ key: string }>()
  const router = useRouter()
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'stats' | 'matches'>('matches')

  useEffect(() => {
    getPlayer(key)
      .then(d => { setPlayer(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [key])

  if (loading) return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse bg-gray-100" />)}
      </div>
    </div>
  )

  if (!player?.player_key) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🎾</p>
        <p className="text-gray-500">Player not found</p>
        <button onClick={() => router.back()} className="mt-4 text-[#00C875] font-semibold">← Go back</button>
      </div>
    </div>
  )

  // Parse stats
  const allStats = player.stats || []
  const singlesStats = allStats.filter((s: any) => s.type === 'singles')
    .sort((a: any, b: any) => parseInt(b.season) - parseInt(a.season))
  const currentYear = singlesStats[0]
  const careerTotals = singlesStats.reduce((acc: any, s: any) => ({
    won: acc.won + parseInt(s.matches_won || 0),
    lost: acc.lost + parseInt(s.matches_lost || 0),
    titles: acc.titles + parseInt(s.titles || 0),
    hw: acc.hw + parseInt(s.hard_won || 0), hl: acc.hl + parseInt(s.hard_lost || 0),
    cw: acc.cw + parseInt(s.clay_won || 0), cl: acc.cl + parseInt(s.clay_lost || 0),
    gw: acc.gw + parseInt(s.grass_won || 0), gl: acc.gl + parseInt(s.grass_lost || 0),
  }), { won: 0, lost: 0, titles: 0, hw: 0, hl: 0, cw: 0, cl: 0, gw: 0, gl: 0 })

  const careerWinPct = careerTotals.won + careerTotals.lost > 0
    ? Math.round(careerTotals.won / (careerTotals.won + careerTotals.lost) * 100) : 0

  // Prize money format
  const formatMoney = (usd: number) => {
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
    if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`
    return `$${usd}`
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'insights', label: 'Insights' },
    { key: 'stats',    label: 'Stats' },
    { key: 'matches',  label: 'Matches' },
  ] as const

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <span className="text-[15px] font-black text-gray-900 truncate">{player.player_full_name || player.player_name}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-nav md:pb-8">

        {/* ── Player hero ── */}
        <div className="flex items-start gap-4 mb-6 pt-2">
          {player.player_logo ? (
            <img src={player.player_logo} alt={player.player_full_name || player.player_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 flex-shrink-0"
              onError={e => e.currentTarget.style.display='none'} />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <span className="text-2xl font-black text-gray-400">
                {(player.player_full_name || player.player_name)?.slice(0, 1)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-black text-gray-900 leading-tight tracking-tight">
              {player.player_full_name || player.player_name}
            </h1>
            <p className="text-[14px] text-gray-500 mt-0.5">
              {getFlag(player.player_country)} {player.player_country}
              {player.age && ` · ${player.age} yrs`}
              {player.height_cm && ` · ${player.height_cm} cm`}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {(player.current_rank || currentYear?.rank) && (
                <span className="text-[13px] font-black text-[#00C875]">
                  #{player.current_rank || currentYear?.rank} ATP
                </span>
              )}
              {(player.atp_titles || careerTotals.titles > 0) && (
                <span className="text-[11px] font-bold text-gray-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                  {player.atp_titles || careerTotals.titles} titles
                </span>
              )}
              {player.career_high && (
                <span className="text-[11px] text-gray-400">Peak #{player.career_high}</span>
              )}
              {player.hand && (
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {player.hand === 'Left' ? '🤚' : '✋'} {player.hand}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick stats row ── */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatBox label="Rank" value={player.current_rank || currentYear?.rank} sub="ATP" />
          <StatBox label="Win%" value={`${careerWinPct}%`} />
          <StatBox label="Titles" value={player.atp_titles || careerTotals.titles} />
          <StatBox label="GS" value={player.grand_slams ?? '—'} />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 border-b border-gray-200 mb-5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`pb-2.5 pt-1 px-4 text-[14px] font-bold transition-all border-b-2 ${
                activeTab === t.key
                  ? 'border-[#00C875] text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Personal info */}
            <div className="card p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Personal</p>
              <InfoRow label="Born" value={player.player_bday} icon="🎂" />
              <InfoRow label="Age" value={player.age ? `${player.age} years old` : null} icon="📅" />
              <InfoRow label="Nationality" value={`${getFlag(player.player_country)} ${player.player_country}`} icon="🌍" />
              <InfoRow label="Height" value={player.height_cm ? `${player.height_cm} cm` : null} icon="📏" />
              <InfoRow label="Weight" value={player.weight_kg ? `${player.weight_kg} kg` : null} icon="⚖️" />
              <InfoRow label="Playing Hand" value={player.hand} icon="🎾" />
              <InfoRow label="Backhand" value={player.backhand} icon="🏸" />
              <InfoRow label="Turned Pro" value={player.turned_pro?.toString()} icon="📆" />
              <InfoRow label="Coach" value={player.coach} icon="👨‍🏫" />
            </div>

            {/* Career info */}
            <div className="card p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Career</p>
              <InfoRow label="Career High" value={player.career_high ? `#${player.career_high}` : null} icon="🏆" />
              <InfoRow label="Current Rank" value={player.current_rank || currentYear?.rank ? `#${player.current_rank || currentYear?.rank}` : null} icon="📊" />
              <InfoRow label="Grand Slams" value={player.grand_slams?.toString()} icon="🎖️" />
              <InfoRow label="ATP Titles" value={(player.atp_titles || careerTotals.titles)?.toString()} icon="🏅" />
              <InfoRow label="Prize Money" value={player.prize_money ? formatMoney(player.prize_money) : null} icon="💰" />
              <InfoRow label="Career W/L" value={`${careerTotals.won}W ${careerTotals.lost}L (${careerWinPct}%)`} icon="📈" />
            </div>

            {/* This year */}
            {currentYear && (
              <div className="card p-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {currentYear.season} Season
                </p>
                <InfoRow label="Rank" value={`#${currentYear.rank}`} icon="📊" />
                <InfoRow label="Record" value={`${currentYear.matches_won}W ${currentYear.matches_lost}L`} icon="📈" />
                <InfoRow label="Titles" value={currentYear.titles !== '0' ? currentYear.titles : null} icon="🏆" />
              </div>
            )}

            {/* Surface records */}
            <div className="card p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Surface Records (Career)</p>
              <div className="space-y-4">
                <SurfaceBar label="Hard" won={careerTotals.hw} lost={careerTotals.hl} color="#9CA3AF" />
                <SurfaceBar label="🏺 Clay" won={careerTotals.cw} lost={careerTotals.cl} color="#F97316" />
                <SurfaceBar label="🌿 Grass" won={careerTotals.gw} lost={careerTotals.gl} color="#22C55E" />
              </div>
            </div>
          </div>
        )}

        {/* ── Insights tab ── */}
        {activeTab === 'insights' && (
          <div className="space-y-5">
            <PlayStyleSection player={player} />
            <StrengthsWeaknesses player={player} />
            <FavoriteSurface player={player} />
            <TitlesByService player={player} />
            <RecentFormGraph player={player} />
          </div>
        )}

        {/* ── Stats tab ── */}
        {activeTab === 'stats' && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Season-by-Season Singles</p>
            {singlesStats.slice(0, 8).map((s: any) => (
              <div key={s.season} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] font-black text-gray-900">{s.season}</span>
                  <span className="text-[13px] font-bold text-[#00C875]">#{s.rank}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-[18px] font-black text-gray-900">{s.matches_won}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Wins</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-gray-900">{s.matches_lost}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Losses</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-[#00C875]">
                      {parseInt(s.matches_won||0) + parseInt(s.matches_lost||0) > 0
                        ? Math.round(parseInt(s.matches_won) / (parseInt(s.matches_won) + parseInt(s.matches_lost)) * 100) + '%'
                        : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase">Win%</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-[#F59E0B]">{s.titles}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Titles</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  {[
                    { label: 'Hard', w: parseInt(s.hard_won||0), l: parseInt(s.hard_lost||0), c: '#9CA3AF' },
                    { label: '🏺 Clay', w: parseInt(s.clay_won||0), l: parseInt(s.clay_lost||0), c: '#F97316' },
                    { label: '🌿 Grass', w: parseInt(s.grass_won||0), l: parseInt(s.grass_lost||0), c: '#22C55E' },
                  ].map(surf => (
                    <div key={surf.label} className="text-center">
                      <p className="text-[11px] font-bold text-gray-400">{surf.label}</p>
                      <p className="text-[13px] font-black" style={{ color: surf.c }}>
                        {surf.w}–{surf.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Matches tab ── */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {/* Form streak */}
            <FormStreak form={player.form} />

            {/* Prediction */}
            <PredictionCard prediction={player.prediction} />

            {/* Upcoming */}
            {player.upcoming_matches?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
                <div className="space-y-2">
                  {player.upcoming_matches.map((m: any, i: number) => {
                    const playerIsP1 = parseInt(key) === m.player1_key
                    const opp = playerIsP1 ? m.player2 : m.player1
                    const oppKey = playerIsP1 ? m.player2_key : m.player1_key
                    const oppImg = playerIsP1 ? m.player2_img : m.player1_img
                    return (
                      <Link key={i} href={`/matches/${m.match_id}`}>
                        <div className="card px-4 py-3 flex items-center gap-3 cursor-pointer card-glow">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 bg-gray-100 text-gray-400">VS</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {oppImg && (
                              <img src={oppImg} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0"
                                onError={e => e.currentTarget.style.display = 'none'} />
                            )}
                            <div className="min-w-0">
                              {oppKey ? (
                                <Link href={`/players/${oppKey}`} onClick={e => e.stopPropagation()}>
                                  <p className="text-[13px] font-bold text-gray-900 hover:text-[#00C875] truncate">{opp}</p>
                                </Link>
                              ) : (
                                <p className="text-[13px] font-bold text-gray-900 truncate">{opp}</p>
                              )}
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{m.tournament} · {m.round}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[12px] font-bold text-[#00C875]">{m.time || 'TBD'}</p>
                            <p className="text-[10px] text-gray-400">{m.date}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent results */}
            {player.recent_matches?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Results</p>
                <div className="space-y-2">
                  {player.recent_matches.map((m: any, i: number) => (
                    <MatchRow key={i} m={m} playerKey={parseInt(key)} />
                  ))}
                </div>
              </div>
            )}

            {!player.form?.streak?.length && !player.upcoming_matches?.length && !player.recent_matches?.length && (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-3">🎾</p>
                <p className="text-gray-500 text-sm">No recent matches found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
