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

function momentBadge(p: Point): { label: string; cls: string } | null {
  if (p.match_point) return { label: 'Match Pt', cls: 'bg-[#00C875] text-black' }
  if (p.set_point)   return { label: 'Set Pt',   cls: 'bg-[#00C875]/20 text-[#00C875]' }
  if (p.break_point) return { label: 'Break',    cls: 'bg-gray-100 text-gray-600' }
  return null
}

function GameRow({ set_number, number_game, player_served, serve_winner, score, points, player1, player2, defaultOpen }: Game & { player1: string; player2: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const p1won    = serve_winner === 'First Player'
  const p2won    = serve_winner === 'Second Player'
  const p1served = player_served === 'First Player'
  const p2served = !p1served
  const isBreak  = (p1won && !p1served) || (p2won && !p2served)
  const p1name   = player1.split(' ').slice(-1)[0]
  const p2name   = player2.split(' ').slice(-1)[0]

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-300 font-mono w-5 text-right">{number_game}</span>

          <div className="flex items-center gap-1">
            {p1served && <span className="w-1.5 h-1.5 rounded-full bg-[#00C875] inline-block flex-shrink-0" />}
            <span className={`text-[12px] font-bold ${p1won ? 'text-gray-900' : 'text-gray-400'}`}>
              {p1name}
            </span>
          </div>

          <span className="text-gray-200 text-[11px]">–</span>

          <div className="flex items-center gap-1">
            {p2served && <span className="w-1.5 h-1.5 rounded-full bg-[#00C875] inline-block flex-shrink-0" />}
            <span className={`text-[12px] font-bold ${p2won ? 'text-gray-900' : 'text-gray-400'}`}>
              {p2name}
            </span>
          </div>

          {isBreak && (
            <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Break
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-gray-600 tabular-nums font-mono">{score}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" className={`text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 3.5l3 3 3-3"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 space-y-0.5 bg-gray-50 border-t border-gray-100">
          {points.map((pt, i) => {
            const badge   = momentBadge(pt)
            const isGame  = pt.score === 'Game' || pt.score === 'Tiebreak'
            return (
              <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${isGame ? 'bg-[#00C875]/8' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-300 font-mono w-4 text-right">{pt.number_point}</span>
                  {badge ? (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${badge.cls}`}>
                      {badge.label}
                    </span>
                  ) : (
                    <span className="w-[52px]" />
                  )}
                </div>
                <span className={`text-[12px] font-bold tabular-nums font-mono ${isGame ? 'text-[#00C875]' : 'text-gray-500'}`}>
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

  const sets     = Array.from(new Set(pbp.map(g => g.set_number)))
  const filtered = activeSet === 'all' ? pbp : pbp.filter(g => g.set_number === activeSet)

  return (
    <div>
      {/* Set filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveSet('all')}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${
            activeSet === 'all'
              ? 'bg-[#00C875]/15 text-[#00C875]'
              : 'text-gray-400 hover:text-gray-700 bg-gray-100'
          }`}
        >
          All
        </button>
        {sets.map(s => (
          <button
            key={s}
            onClick={() => setActiveSet(s)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${
              activeSet === s
                ? 'bg-[#00C875]/15 text-[#00C875]'
                : 'text-gray-400 hover:text-gray-700 bg-gray-100'
            }`}
          >
            Set {s.replace('Set ', '')}
          </button>
        ))}
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
