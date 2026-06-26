'use client'

import { useState } from 'react'

interface Point {
  number_point: string
  score: string
  break_point?: string | null
  set_point?: string | null
  match_point?: string | null
}

interface Game {
  set_number: string
  number_game: string
  player_served: string
  serve_winner: string
  score: string
  points: Point[]
}

interface Props {
  pbp: Game[]
  player1: string
  player2: string
}

const pointEmoji = (p: Point) => {
  if (p.match_point) return { icon: '🏆', color: 'text-amber-400', label: 'Match Point' }
  if (p.set_point)   return { icon: '⚡', color: 'text-purple-400', label: 'Set Point' }
  if (p.break_point) return { icon: '💥', color: 'text-red-400',    label: 'Break Point' }
  return null
}

function GameRow({ set_number, number_game, player_served, serve_winner, score, points, player1, player2, defaultOpen }: Game & { player1: string; player2: string; defaultOpen?: boolean }) {
  const game = { set_number, number_game, player_served, serve_winner, score, points }
  const [open, setOpen] = useState(defaultOpen ?? false)
  const p1won = serve_winner === 'First Player'
  const p2won = serve_winner === 'Second Player'
  const p1served = player_served === 'First Player'
  const p2served = !p1served
  const breakHappened = (p1won && !p1served) || (p2won && !p2served)

  return (
    <div className="rounded-xl border border-white/[0.04] overflow-hidden mb-2">
      {/* Game header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 glass hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 font-mono w-6">{number_game}</span>
          <div className="flex items-center gap-1.5">
            {p1served && <span className="text-[10px] text-white/40">🎾</span>}
            <span className={`text-xs font-semibold ${p1won ? 'text-white' : 'text-white/40'}`}>
              {player1.split(' ').pop()}
            </span>
          </div>
          <span className="text-white/20 text-xs">–</span>
          <div className="flex items-center gap-1.5">
            {p2served && <span className="text-[10px] text-white/40">🎾</span>}
            <span className={`text-xs font-semibold ${p2won ? 'text-white' : 'text-white/40'}`}>
              {player2.split(' ').pop()}
            </span>
          </div>
          {breakHappened && (
            <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Break</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white/50 tabular-nums">{score}</span>
          <span className="text-white/25 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Points breakdown */}
      {open && (
        <div className="px-4 pb-3 pt-1 space-y-1.5 bg-black/20">
          {points.map((pt, i) => {
            const special = pointEmoji(pt)
            const isWinner = pt.score === 'Game' || pt.score === 'Tiebreak'
            return (
              <div key={i} className={`flex items-center justify-between py-1 px-2 rounded-lg ${isWinner ? 'bg-[#00C875]/10' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/20 font-mono w-4 text-right">{pt.number_point}</span>
                  {special ? (
                    <span className={`text-[9px] font-bold ${special.color} bg-current/10 px-1.5 py-0.5 rounded uppercase tracking-wider`}
                      style={{ backgroundColor: `currentColor`, color: special.color.includes('red') ? '#f87171' : special.color.includes('purple') ? '#c084fc' : '#fbbf24' }}>
                      {special.label}
                    </span>
                  ) : (
                    <span className="w-20" />
                  )}
                </div>
                <span className={`text-xs font-bold tabular-nums font-mono ${isWinner ? 'text-[#00C875]' : 'text-white/60'}`}>
                  {pt.score}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PointByPoint({ pbp, player1, player2 }: Props) {
  const [activeSet, setActiveSet] = useState<string>('all')

  if (!pbp || pbp.length === 0) return null

  const sets = Array.from(new Set(pbp.map(g => g.set_number)))
  const filtered = activeSet === 'all' ? pbp : pbp.filter(g => g.set_number === activeSet)

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-white/30 uppercase tracking-widest">Point by Point</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveSet('all')}
            className={`text-[10px] px-2 py-1 rounded-full font-semibold transition-colors ${activeSet === 'all' ? 'bg-[#00C875]/20 text-[#00C875]' : 'text-white/30 hover:text-white/60'}`}
          >
            All
          </button>
          {sets.map(s => (
            <button
              key={s}
              onClick={() => setActiveSet(s)}
              className={`text-[10px] px-2 py-1 rounded-full font-semibold transition-colors ${activeSet === s ? 'bg-[#00C875]/20 text-[#00C875]' : 'text-white/30 hover:text-white/60'}`}
            >
              S{s.replace('Set ', '')}
            </button>
          ))}
        </div>
      </div>

      <div>
        {filtered.map((game, i) => (
          <GameRow
            key={`${game.set_number}-${game.number_game}`}
            {...game}
            player1={player1}
            player2={player2}
            defaultOpen={i === filtered.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
