'use client'

import type { Match } from '@/types'

interface Props {
  match: Match
}

const surfaceColors: Record<string, string> = {
  grass: '#4ade80',
  clay: '#fb923c',
  hard: '#60a5fa',
  carpet: '#c084fc',
}

export default function MatchCard({ match }: Props) {
  const isLive = match.status === 'In Progress' || match.status === 'live'
  const scores = match.score ? match.score.split(',').map(s => s.trim()) : []

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0F2A4A] hover:border-[#00C875]/30 transition-colors duration-200 p-4">
      {/* Tournament header */}
      {match.tournament && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            {match.tournament}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#00C875] uppercase tracking-widest">
              <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
              Live
            </span>
          )}
        </div>
      )}

      {/* Players & Score */}
      <div className="space-y-2">
        {/* Player 1 */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white leading-tight truncate max-w-[180px]">
            {match.player1}
          </span>
          <div className="flex gap-2 flex-shrink-0">
            {scores.map((s, i) => {
              const parts = s.split('-')
              const p1 = parts[0] ?? ''
              return (
                <span
                  key={i}
                  className={`text-sm font-bold tabular-nums w-6 text-center ${
                    parseInt(p1) > parseInt(parts[1] ?? '0')
                      ? 'text-white'
                      : 'text-white/40'
                  }`}
                >
                  {p1}
                </span>
              )
            })}
          </div>
        </div>

        {/* Player 2 */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white leading-tight truncate max-w-[180px]">
            {match.player2}
          </span>
          <div className="flex gap-2 flex-shrink-0">
            {scores.map((s, i) => {
              const parts = s.split('-')
              const p2 = parts[1] ?? ''
              return (
                <span
                  key={i}
                  className={`text-sm font-bold tabular-nums w-6 text-center ${
                    parseInt(p2) > parseInt(parts[0] ?? '0')
                      ? 'text-white'
                      : 'text-white/40'
                  }`}
                >
                  {p2}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status bar */}
      {!isLive && match.status && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/30 uppercase tracking-wider">{match.status}</span>
        </div>
      )}
    </div>
  )
}
