'use client'

import Link from 'next/link'
import { getCountryFlag } from '@/lib/countryFlags'
import { getPlayerCountry } from '@/lib/playerCountries'
import CardVoting from './CardVoting'
import type { Match } from '@/types'
import { shareScoreImage } from '@/lib/shareImage'

interface Props { match: Match; hideMeta?: boolean }

const SURFACE_COLOR: Record<string, string> = {
  Grass: '#22C55E',
  Clay:  '#F97316',
  Hard:  '#3B82F6',
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

export default function MatchCard({ match, hideMeta }: Props) {
  const isLive     = match.status === 'In Progress' || match.status === 'live' || match.status === '1'
                     || (match.status || '').startsWith('Set')
  const isFinished = match.status === 'Finished' || match.status === 'After Penalties'
  const sets       = match.score ? match.score.split(',').map(s => s.trim()) : []
  const serving1   = match.serve === match.player1 || match.serve === 'First Player' || match.serve === '1'
  const serving2   = match.serve === match.player2 || match.serve === 'Second Player' || match.serve === '2'
  const gp         = match.game_score ? match.game_score.split('-') : []
  const surface    = (match as any).surface as string | undefined
  const surfColor  = SURFACE_COLOR[surface || 'Hard'] || SURFACE_COLOR.Hard
  const roundLabel = ROUND_SHORT[(match as any).round] || (match as any).round || ''
  const timeLabel  = (match as any).time || (match as any).date || ''

  // Structured sets
  const setsData: {p1: string, p2: string}[] = (match as any).sets?.length
    ? (match as any).sets
    : sets.map(s => { const [a, b] = s.split('-'); return { p1: a || '0', p2: b || '0' } })

  const gameP1 = (match as any).game_p1 ?? gp[0] ?? ''
  const gameP2 = (match as any).game_p2 ?? gp[1] ?? ''

  const setWinner = setsData.map(s => {
    const n1 = parseInt(s.p1), n2 = parseInt(s.p2)
    return n1 > n2 ? 1 : n2 > n1 ? 2 : 0
  })
  const p1SetsWon = setWinner.filter(w => w === 1).length
  const p2SetsWon = setWinner.filter(w => w === 2).length

  const players = [
    { name: match.player1, img: match.player1_img, serving: serving1, key: match.player1_key, playerIdx: 1, setsWon: p1SetsWon, gameScore: gameP1 },
    { name: match.player2, img: match.player2_img, serving: serving2, key: match.player2_key, playerIdx: 2, setsWon: p2SetsWon, gameScore: gameP2 },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Link href={`/matches/${match.match_id}`} className="block px-3.5 pt-3 pb-2.5 cursor-pointer hover:bg-gray-50 transition-colors">

        {/* Header row — hidden when tournament header is rendered above */}
        {!hideMeta && (
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: surfColor }} />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide truncate">
                {match.tournament}
              </span>
              {roundLabel && (
                <span className="text-[10px] font-semibold text-gray-300">· {roundLabel}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C875] uppercase tracking-widest">
                  <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                  {match.status?.startsWith('Set') ? match.status : 'Live'}
                </span>
              ) : isFinished ? (
                <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">Final</span>
              ) : (
                <span className="text-[11px] text-gray-400">{timeLabel}</span>
              )}
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); shareMatch(match) }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* When hideMeta: show only round + status inline */}
        {hideMeta && (
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">{roundLabel}</span>
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C875] uppercase tracking-widest">
                  <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                  {match.status?.startsWith('Set') ? match.status : 'Live'}
                </span>
              ) : isFinished ? (
                <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">Final</span>
              ) : (
                <span className="text-[11px] text-gray-400">{timeLabel}</span>
              )}
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); shareMatch(match) }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Player rows */}
        <div className="space-y-1">
          {players.map((p, rowIdx) => {
            const country   = (match as any)[`player${p.playerIdx}_country`] || getPlayerCountry(p.name)
            const isWinning = p.setsWon > (rowIdx === 0 ? p2SetsWon : p1SetsWon)

            return (
              <div key={rowIdx} className="flex items-center gap-2">
                {/* Avatar with flag badge */}
                <div className="relative flex-shrink-0 w-7 h-7">
                  {p.img ? (
                    <img src={p.img} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-100"
                      onError={e => e.currentTarget.style.display = 'none'} />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400">{p.name[0]}</span>
                    </div>
                  )}
                  {country && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none">{getCountryFlag(country)}</span>
                  )}
                </div>

                {/* Name */}
                <Link
                  href={p.key ? `/players/${p.key}` : '#'}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 flex items-center gap-1.5 min-w-0 hover:text-[#00C875] transition-colors"
                >
                  <span className={`text-[15px] truncate ${
                    isWinning
                      ? 'font-black text-gray-900'
                      : isFinished
                      ? 'font-medium text-gray-400'
                      : 'font-semibold text-gray-800'
                  }`}>
                    {p.name}
                  </span>
                  {p.serving && isLive && (
                    <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 inline-block" />
                  )}
                </Link>

                {/* Score columns */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Current game score — live only */}
                  {isLive && (
                    <span className={`text-[14px] font-black tabular-nums w-7 text-right ${
                      p.serving ? 'text-[#00C875]' : 'text-gray-300'
                    }`}>
                      {p.gameScore || '0'}
                    </span>
                  )}
                  {/* Per-set scores */}
                  {setsData.map((s, si) => {
                    const myGames  = p.playerIdx === 1 ? parseInt(s.p1) : parseInt(s.p2)
                    const iWonSet  = setWinner[si] === p.playerIdx
                    const setDone  = si < setsData.length - 1 || isFinished

                    return (
                      <span key={si} className={`text-[17px] tabular-nums w-5 text-right ${
                        iWonSet   ? 'font-black text-gray-900'
                        : setDone ? 'font-medium text-gray-300'
                        : 'font-black text-[#c8e14a]'
                      }`}>
                        {myGames}
                      </span>
                    )
                  })}
                  {setsData.length === 0 && isLive && (
                    <span className="text-[15px] text-gray-200 tabular-nums w-5 text-right">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Column headers */}
        {(setsData.length > 0 || isLive) && (
          <div className="flex items-center gap-2 justify-end mt-0.5">
            {isLive && <span className="text-[9px] text-gray-300 uppercase w-7 text-right">Pts</span>}
            {setsData.map((_, si) => (
              <span key={si} className="text-[9px] text-gray-300 uppercase w-5 text-right">S{si + 1}</span>
            ))}
          </div>
        )}
      </Link>

      {/* Voting — outside Link */}
      <div className="px-3.5 pb-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Who wins?</p>
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
