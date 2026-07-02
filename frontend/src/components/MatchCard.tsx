'use client'

import Link from 'next/link'
import { getPlayerCountry } from '@/lib/playerCountries'
import type { Match } from '@/types'
import { shareScoreImage } from '@/lib/shareImage'

interface Props { match: Match; hideMeta?: boolean }

const SURFACE_DOT: Record<string, string> = {
  Grass: '#22C55E', Clay: '#F97316', Hard: '#9CA3AF',
}

const ROUND_SHORT: Record<string, string> = {
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF', Final: 'F',
  'Quarter-Finals': 'QF', 'Quarter-Final': 'QF',
  'Semi-Finals': 'SF', 'Semi-Final': 'SF',
  '1/2-finals': 'SF', '1/4-finals': 'QF', '1/8-finals': 'R4',
  '1/16-finals': 'R3', '1/32-finals': 'R2', '1/64-finals': 'R1',
  'Round of 16': 'R4', 'Round of 32': 'R3', 'Round of 64': 'R2', 'Round of 128': 'R1',
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
  const surfDot    = SURFACE_DOT[surface || 'Hard'] || SURFACE_DOT.Hard
  // Handle formats: "R1 - 1st Round", "Quarter-Finals", "1/8-finals", etc.
  const rawRound   = (match as any).round || ''
  const roundParts = rawRound.split(' - ')
  const roundKey   = ROUND_SHORT[roundParts[0]] ? roundParts[0] : roundParts[roundParts.length - 1]
  const roundLabel = ROUND_SHORT[roundKey] || ROUND_SHORT[rawRound] || rawRound
  const timeLabel  = (match as any).time || (match as any).date || ''

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
    <Link
      href={`/matches/${match.match_id}`}
      className={`block bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${
        isLive
          ? 'border-[#00C875]/40 shadow-[0_0_0_1px_rgba(0,200,117,0.15)]'
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Neon left stripe for live */}
      {isLive && <div className="h-[2px] w-full bg-[#00C875]" />}

      <div className="px-3 pt-2 pb-1.5">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {!hideMeta && (
              <>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: surfDot }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">
                  {match.tournament}
                </span>
              </>
            )}
            {roundLabel && (
              <span className="text-[11px] font-bold text-gray-500">{hideMeta ? roundLabel : `· ${roundLabel}`}</span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isLive ? (
              <span className="flex items-center gap-1 text-[10px] font-black text-[#00C875] bg-black px-1.5 py-0.5 rounded tracking-wider">
                <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                LIVE
              </span>
            ) : isFinished ? (
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">FINAL</span>
            ) : (
              <span className="text-[11px] font-semibold text-gray-600">{timeLabel}</span>
            )}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); shareMatch(match) }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Player rows */}
        <div className="space-y-0.5">
          {players.map((p, rowIdx) => {
            const country   = (match as any)[`player${p.playerIdx}_country`] || getPlayerCountry(p.name)
            const isWinning = p.setsWon > (rowIdx === 0 ? p2SetsWon : p1SetsWon)

            return (
              <div key={rowIdx} className="flex items-center gap-2">
                {/* Avatar */}
                <div className="flex-shrink-0 w-6 h-6">
                  {p.img ? (
                    <img src={p.img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100"
                      onError={e => e.currentTarget.style.display = 'none'} />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-400">{p.name[0]}</span>
                    </div>
                  )}
                </div>

                {/* Country + Name */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  {country && (
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wide flex-shrink-0">{country}</span>
                  )}
                  <span className={`text-[13px] truncate ${
                    isWinning       ? 'font-black text-gray-900'
                    : isFinished    ? 'font-medium text-gray-400'
                    : 'font-semibold text-gray-800'
                  }`}>
                    {p.name}
                  </span>
                  {p.serving && isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C875] flex-shrink-0" />
                  )}
                </div>

                {/* Score columns */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isLive && (
                    <span className={`text-[12px] font-black tabular-nums text-center min-w-[22px] rounded px-1 py-px ${
                      p.serving ? 'bg-black text-[#00C875]' : 'text-gray-400 w-6'
                    }`}>
                      {p.gameScore || '0'}
                    </span>
                  )}
                  {setsData.map((s, si) => {
                    const myGames = p.playerIdx === 1 ? parseInt(s.p1) : parseInt(s.p2)
                    const iWonSet = setWinner[si] === p.playerIdx
                    const setDone = si < setsData.length - 1 || isFinished
                    return (
                      <span key={si} className={`text-[15px] tabular-nums w-4 text-right ${
                        iWonSet   ? 'font-black text-gray-900'
                        : setDone ? 'font-medium text-gray-300'
                        : 'font-black text-[#c8e14a]'
                      }`}>
                        {myGames}
                      </span>
                    )
                  })}
                  {setsData.length === 0 && isLive && (
                    <span className="text-[13px] text-gray-200 tabular-nums w-4 text-right">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Column label row */}
        {(setsData.length > 0 || isLive) && (
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            {isLive && <span className="text-[8px] text-gray-400 uppercase min-w-[22px] text-center">Pts</span>}
            {setsData.map((_, si) => (
              <span key={si} className="text-[8px] text-gray-400 uppercase w-4 text-right">S{si + 1}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
