'use client'

import Link from 'next/link'
import { getCountryFlag } from '@/lib/countryFlags'
import { getPlayerCountry } from '@/lib/playerCountries'
import CardVoting from './CardVoting'
import type { Match } from '@/types'
import { shareScoreImage } from '@/lib/shareImage'

interface Props { match: Match }

const SURFACE_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Grass: { bg: 'bg-green-50',  text: 'text-green-700', dot: '#22C55E', label: '🌿 Grass' },
  Clay:  { bg: 'bg-orange-50', text: 'text-orange-600', dot: '#F97316', label: '🏺 Clay' },
  Hard:  { bg: 'bg-blue-50',   text: 'text-blue-600',  dot: '#3B82F6', label: '🔵 Hard' },
}

const ROUND_SHORT: Record<string, string> = {
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF', Final: 'F',
}

async function shareMatch(match: Match) {
  try {
    await shareScoreImage({
      player1: match.player1, player2: match.player2,
      score: match.score ?? '', tournament: match.tournament,
      status: match.status, gameScore: match.game_score ?? undefined,
    })
  } catch {
    const text = `🎾 ${match.player1} vs ${match.player2} — ${match.score ?? 'Live'} | tennisace.live`
    if (navigator.share) await navigator.share({ title: 'TennisAce', text, url: 'https://tennisace.live' })
    else await navigator.clipboard.writeText(text)
  }
}

export default function MatchCard({ match }: Props) {
  const isLive    = match.status === 'In Progress' || match.status === 'live' || match.status === '1'
                    || (match.status || '').startsWith('Set')
  const isFinished = match.status === 'Finished' || match.status === 'After Penalties'
  const sets   = match.score ? match.score.split(',').map(s => s.trim()) : []
  const serving1 = match.serve === match.player1 || match.serve === 'First Player' || match.serve === '1'
  const serving2 = match.serve === match.player2 || match.serve === 'Second Player' || match.serve === '2'
  const gp = match.game_score ? match.game_score.split('-') : []
  const surface = (match as any).surface as string | undefined
  const surfStyle = SURFACE_STYLE[surface || 'Hard'] || SURFACE_STYLE.Hard
  const roundLabel = ROUND_SHORT[(match as any).round] || (match as any).round

  return (
    <div className="card card-glow overflow-hidden">
      {/* Surface colour band — 3px top stripe */}
      <div className="h-[3px] w-full" style={{ background: surfStyle.dot }} />

      <Link href={`/matches/${match.match_id}`} className="block">
        <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          {/* Top row: tournament BOLD + surface + round + status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[13px] font-black text-gray-900 leading-tight truncate">
                {match.tournament}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {surface && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${surfStyle.bg} ${surfStyle.text}`}>
                    {surfStyle.label}
                  </span>
                )}
                {roundLabel && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {roundLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Status + share */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C875] uppercase tracking-widest">
                  <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                  {match.status?.startsWith('Set') ? match.status : 'Live'}
                </span>
              ) : isFinished ? (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Final
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">
                  {(match as any).time || (match as any).date || ''}
                </span>
              )}
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); shareMatch(match) }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Players + scores — ScoreGO style columns */}
          {(() => {
            // Use structured sets from new backend field, fallback to parsing score string
            const setsData: {p1: string, p2: string}[] = (match as any).sets?.length
              ? (match as any).sets
              : sets.map(s => {
                  const [a, b] = s.split('-')
                  return { p1: a || '0', p2: b || '0' }
                })

            const gameP1 = (match as any).game_p1 ?? gp[0] ?? ''
            const gameP2 = (match as any).game_p2 ?? gp[1] ?? ''

            // Did each player win each set?
            const setWinner = setsData.map(s => {
              const p1n = parseInt(s.p1), p2n = parseInt(s.p2)
              if (p1n > p2n) return 1
              if (p2n > p1n) return 2
              return 0 // in progress / tied
            })

            const p1SetsWon = setWinner.filter(w => w === 1).length
            const p2SetsWon = setWinner.filter(w => w === 2).length

            return (
              <div className="space-y-1.5">
                {[
                  { name: match.player1, img: match.player1_img, serving: serving1, key: match.player1_key, playerIdx: 1, setsWon: p1SetsWon, gameScore: gameP1 },
                  { name: match.player2, img: match.player2_img, serving: serving2, key: match.player2_key, playerIdx: 2, setsWon: p2SetsWon, gameScore: gameP2 },
                ].map((p, rowIdx) => {
                  const country = getPlayerCountry(p.name)
                  const isWinning = p.setsWon > (rowIdx === 0 ? p2SetsWon : p1SetsWon)

                  return (
                    <div key={rowIdx} className="flex items-center gap-2">
                      {/* Avatar */}
                      {p.img ? (
                        <img src={p.img} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                          onError={e => e.currentTarget.style.display = 'none'} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                          <span className="text-[11px] font-bold text-gray-400">{p.name[0]}</span>
                        </div>
                      )}

                      {/* Name + serving dot */}
                      <Link
                        href={p.key ? `/players/${p.key}` : '#'}
                        onClick={e => e.stopPropagation()}
                        className={`flex-1 flex items-center gap-1.5 min-w-0 hover:text-[#00C875] transition-colors ${
                          isWinning ? 'text-gray-900' : isFinished ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {country && <span>{getCountryFlag(country)}</span>}
                        <span className={`text-[15px] truncate ${isWinning ? 'font-black' : 'font-semibold'}`}>
                          {p.name}
                        </span>
                        {/* Serving indicator — yellow dot like ScoreGO */}
                        {p.serving && isLive && (
                          <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 inline-block" />
                        )}
                      </Link>

                      {/* Score columns: [current game] [S1] [S2] [S3...] */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Current game score — only when live */}
                        {isLive && (
                          <span className={`text-[14px] font-black tabular-nums w-8 text-right ${
                            p.serving ? 'text-[#00C875]' : 'text-gray-400'
                          }`}>
                            {p.gameScore || '0'}
                          </span>
                        )}

                        {/* Per-set scores */}
                        {setsData.map((s, si) => {
                          const myGames = p.playerIdx === 1 ? parseInt(s.p1) : parseInt(s.p2)
                          const oppGames = p.playerIdx === 1 ? parseInt(s.p2) : parseInt(s.p1)
                          const iWonSet = setWinner[si] === p.playerIdx
                          // Last set might still be in progress
                          const setDone = si < setsData.length - 1 || isFinished

                          return (
                            <span key={si} className={`text-[17px] tabular-nums w-5 text-right ${
                              iWonSet ? 'font-black text-gray-900'
                              : setDone ? 'font-semibold text-gray-350'
                              : 'font-bold text-gray-700'
                            }`}>
                              {myGames}
                            </span>
                          )
                        })}

                        {/* Placeholder columns if no sets yet */}
                        {setsData.length === 0 && isLive && (
                          <span className="text-[15px] text-gray-300 tabular-nums w-5 text-right">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Set column headers — tiny labels */}
                {(setsData.length > 0 || isLive) && (
                  <div className="flex items-center gap-3 justify-end pt-0.5">
                    {isLive && <span className="text-[9px] text-gray-300 uppercase w-8 text-right">Pts</span>}
                    {setsData.map((_, si) => (
                      <span key={si} className="text-[9px] text-gray-300 uppercase w-5 text-right">S{si + 1}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </Link>

      {/* Bottom actions — voting + compare, outside Link so clicks don't navigate */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Who wins?</p>
          {(match as any).player1_key && (match as any).player2_key && (
            <Link
              href={`/compare?p1=${(match as any).player1_key}&p2=${(match as any).player2_key}`}
              onClick={e => e.stopPropagation()}
              className="text-[10px] font-bold text-[#00C875] hover:text-green-600 uppercase tracking-widest"
            >
              Compare →
            </Link>
          )}
        </div>
        <CardVoting matchId={match.match_id} player1={match.player1} player2={match.player2} />
      </div>
    </div>
  )
}
