'use client'

import type { Match } from '@/types'

interface Props {
  match: Match
}

export default function MatchCard({ match }: Props) {
  const isLive = match.status === 'In Progress' || match.status === 'live' || match.status === '1'
  const scores = match.score ? match.score.split(',').map(s => s.trim()) : []
  const serving1 = match.serve === match.player1 || match.serve === 'First Player' || match.serve === '1'
  const serving2 = match.serve === match.player2 || match.serve === 'Second Player' || match.serve === '2'

  // Parse game score: "40-15" → ["40", "15"]
  const gameParts = match.game_score ? match.game_score.split('-') : []
  const gameP1 = gameParts[0]?.trim()
  const gameP2 = gameParts[1]?.trim()

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0F2A4A] hover:border-[#00C875]/30 transition-colors duration-200 p-4">
      {/* Tournament + round + live badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {match.tournament && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40 truncate">
              {match.tournament}
            </span>
          )}
          {match.round && (
            <span className="text-[10px] text-white/25 uppercase tracking-wider flex-shrink-0">
              · {match.round}
            </span>
          )}
        </div>
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#00C875] uppercase tracking-widest flex-shrink-0">
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
            Live
          </span>
        )}
      </div>

      {/* Players & Score */}
      <div className="space-y-2">
        {/* Player 1 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {serving1 && <span className="text-[10px] flex-shrink-0">🎾</span>}
            <span className={`text-sm font-semibold leading-tight truncate ${serving1 ? 'text-white' : 'text-white/80'}`}>
              {match.player1}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Game score for player 1 */}
            {isLive && gameP1 && (
              <span className={`text-xs font-bold tabular-nums w-7 text-center rounded px-1 py-0.5 ${
                serving1 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-white/50'
              }`}>
                {gameP1}
              </span>
            )}
            {/* Set scores */}
            <div className="flex gap-2">
              {scores.map((s, i) => {
                const parts = s.split('-')
                const p1 = parts[0] ?? ''
                const p2 = parts[1] ?? '0'
                return (
                  <span
                    key={i}
                    className={`text-sm font-bold tabular-nums w-6 text-center ${
                      parseInt(p1) > parseInt(p2) ? 'text-white' : 'text-white/40'
                    }`}
                  >
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
            {serving2 && <span className="text-[10px] flex-shrink-0">🎾</span>}
            <span className={`text-sm font-semibold leading-tight truncate ${serving2 ? 'text-white' : 'text-white/80'}`}>
              {match.player2}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Game score for player 2 */}
            {isLive && gameP2 && (
              <span className={`text-xs font-bold tabular-nums w-7 text-center rounded px-1 py-0.5 ${
                serving2 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-white/50'
              }`}>
                {gameP2}
              </span>
            )}
            {/* Set scores */}
            <div className="flex gap-2">
              {scores.map((s, i) => {
                const parts = s.split('-')
                const p1 = parts[0] ?? '0'
                const p2 = parts[1] ?? ''
                return (
                  <span
                    key={i}
                    className={`text-sm font-bold tabular-nums w-6 text-center ${
                      parseInt(p2) > parseInt(p1) ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    {p2}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status footer for non-live matches */}
      {!isLive && match.status && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/30 uppercase tracking-wider">{match.status}</span>
        </div>
      )}
    </div>
  )
}
