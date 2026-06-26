'use client'

import Link from 'next/link'
import type { Match } from '@/types'
import { shareScoreImage } from '@/lib/shareImage'

interface Props {
  match: Match
}

async function shareMatch(match: Match) {
  try {
    await shareScoreImage({
      player1: match.player1,
      player2: match.player2,
      score: match.score ?? '',
      tournament: match.tournament,
      status: match.status,
      gameScore: match.game_score ?? undefined,
    })
  } catch {
    // Fallback to text share
    const text = `🎾 ${match.player1} vs ${match.player2} — ${match.score ?? 'Live'} | tennisace.live`
    if (navigator.share) await navigator.share({ title: 'TennisAce', text, url: 'https://tennisace.live' })
    else { await navigator.clipboard.writeText(text); alert('Copied!') }
  }
}

export default function MatchCard({ match }: Props) {
  const isLive = match.status === 'In Progress' || match.status === 'live' || match.status === '1'
  const scores = match.score ? match.score.split(',').map(s => s.trim()) : []
  const serving1 = match.serve === match.player1 || match.serve === 'First Player' || match.serve === '1'
  const serving2 = match.serve === match.player2 || match.serve === 'Second Player' || match.serve === '2'
  const gameParts = match.game_score ? match.game_score.split('-') : []
  const gameP1 = gameParts[0]?.trim()
  const gameP2 = gameParts[1]?.trim()

  return (
    <Link href={`/matches/${match.match_id}`} className="block">
    <div className="rounded-xl border border-gray-200 glass hover:border-[#00C875]/30 hover:bg-gray-100 transition-all duration-200 p-4 cursor-pointer card-glow">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {match.tournament && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 truncate">
              {match.tournament}
            </span>
          )}
          {match.round && (
            <span className="text-[10px] text-gray-400 uppercase tracking-wider flex-shrink-0">
              · {match.round}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#00C875] uppercase tracking-widest">
              <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
              Live
            </span>
          )}
          <button
            onClick={() => shareMatch(match)}
            className="text-gray-300 hover:text-gray-600 transition-colors text-sm p-1 -mr-1"
            title="Share this match"
          >
            ↗
          </button>
        </div>
      </div>

      {/* Players & Score */}
      <div className="space-y-2">
        {/* Player 1 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {match.player1_img && (
              <img src={match.player1_img} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0 border border-gray-200" onError={e => e.currentTarget.style.display='none'} />
            )}
            {serving1 && <span className="text-[10px] flex-shrink-0">🎾</span>}
            <span className={`text-sm font-semibold leading-tight truncate ${serving1 ? 'text-gray-900' : 'text-gray-700'}`}>
              {match.player1}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLive && gameP1 && (
              <span className={`text-xs font-bold tabular-nums w-7 text-center rounded px-1 py-0.5 ${
                serving1 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-gray-500'
              }`}>
                {gameP1}
              </span>
            )}
            <div className="flex gap-2">
              {scores.map((s, i) => {
                const parts = s.split('-')
                const p1 = parts[0] ?? ''
                const p2 = parts[1] ?? '0'
                return (
                  <span key={i} className={`text-sm font-bold tabular-nums w-6 text-center ${parseInt(p1) > parseInt(p2) ? 'text-gray-900' : 'text-gray-500'}`}>
                    {p1}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {match.player2_img && (
              <img src={match.player2_img} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0 border border-gray-200" onError={e => e.currentTarget.style.display='none'} />
            )}
            {serving2 && <span className="text-[10px] flex-shrink-0">🎾</span>}
            <span className={`text-sm font-semibold leading-tight truncate ${serving2 ? 'text-gray-900' : 'text-gray-700'}`}>
              {match.player2}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLive && gameP2 && (
              <span className={`text-xs font-bold tabular-nums w-7 text-center rounded px-1 py-0.5 ${
                serving2 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-gray-500'
              }`}>
                {gameP2}
              </span>
            )}
            <div className="flex gap-2">
              {scores.map((s, i) => {
                const parts = s.split('-')
                const p1 = parts[0] ?? '0'
                const p2 = parts[1] ?? ''
                return (
                  <span key={i} className={`text-sm font-bold tabular-nums w-6 text-center ${parseInt(p2) > parseInt(p1) ? 'text-gray-900' : 'text-gray-500'}`}>
                    {p2}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {!isLive && match.status && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">{match.status}</span>
        </div>
      )}
    </div>
    </Link>
  )
}
