import Link from 'next/link'
import { getPlayerCountry } from '@/lib/playerCountries'

interface Result {
  match_id: string
  player1: string
  player2: string
  player1_key?: number
  player2_key?: number
  player1_img?: string
  player2_img?: string
  player1_country?: string
  player2_country?: string
  score: string
  winner?: string
  tournament: string
  round?: string
  type?: string
  date: string
}

interface Props { result: Result; hideMeta?: boolean }

const ROUND_SHORT: Record<string, string> = {
  'Round of 128': 'R1', 'Round of 64': 'R2', 'Round of 32': 'R3', 'Round of 16': 'R4',
  'Quarter-Finals': 'QF', 'Quarter-Final': 'QF',
  'Semi-Finals': 'SF', 'Semi-Final': 'SF',
  'Final': 'FINAL', 'F': 'FINAL',
  '1/2-finals': 'SF', '1/4-finals': 'QF', '1/8-finals': 'R4',
  '1/16-finals': 'R3', '1/32-finals': 'R2', '1/64-finals': 'R1',
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF',
}

function parseSetScore(raw: string): { p1: number; p2: number } {
  const parts = raw.trim().split('-')
  return {
    p1: Math.floor(parseFloat(parts[0] || '0')),
    p2: Math.floor(parseFloat(parts[1] || '0')),
  }
}

export default function ResultCard({ result, hideMeta }: Props) {
  const p1won   = result.winner === 'First Player'
  const rawSets = result.score ? result.score.split(',').map(s => s.trim()).filter(Boolean) : []
  const setsData = rawSets.map(parseSetScore)
  const setWinner = setsData.map(s => s.p1 > s.p2 ? 1 : s.p2 > s.p1 ? 2 : 0)

  const players = [
    { name: result.player1, img: result.player1_img, playerIdx: 1 },
    { name: result.player2, img: result.player2_img, playerIdx: 2 },
  ]

  const roundLabel = (() => {
    const raw = (result.round || '').split(' - ').pop() || ''
    return ROUND_SHORT[raw] || raw
  })()

  return (
    <Link href={`/matches/${result.match_id}`}>
      <div className="bg-white rounded-xl border border-gray-100 px-3 pt-2 pb-1.5 cursor-pointer hover:border-gray-200 transition-all">

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {!hideMeta && (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">
                {result.tournament}
              </span>
            )}
            {roundLabel && (
              <span className="text-[11px] font-bold text-gray-500">{hideMeta ? roundLabel : `· ${roundLabel}`}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">FINAL</span>
            <span className="text-[11px] text-gray-500">{result.date}</span>
          </div>
        </div>

        {/* Player rows */}
        <div className="space-y-0.5">
          {players.map((p, rowIdx) => {
            const country  = (result as any)[`player${p.playerIdx}_country`] || getPlayerCountry(p.name)
            const isWinner = (rowIdx === 0 && p1won) || (rowIdx === 1 && !p1won)

            return (
              <div key={rowIdx} className="flex items-center gap-2">
                {/* Avatar */}
                <div className="flex-shrink-0 w-6 h-6">
                  {p.img ? (
                    <img src={p.img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100"
                      onError={e => (e.currentTarget.style.display = 'none')} />
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
                    isWinner ? 'font-black text-gray-900' : 'font-medium text-gray-400'
                  }`}>
                    {p.name}
                  </span>
                </div>

                {/* Set scores */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {setsData.map((s, si) => {
                    const myGames = p.playerIdx === 1 ? s.p1 : s.p2
                    const iWonSet = setWinner[si] === p.playerIdx
                    return (
                      <span key={si} className={`text-[15px] tabular-nums w-4 text-right ${
                        iWonSet ? 'font-black text-gray-900' : 'font-medium text-gray-300'
                      }`}>
                        {myGames}
                      </span>
                    )
                  })}
                  {setsData.length === 0 && (
                    <span className="text-[13px] text-gray-200 w-4 text-right">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Column labels */}
        {setsData.length > 0 && (
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            {setsData.map((_, si) => (
              <span key={si} className="text-[8px] text-gray-300 uppercase w-4 text-right">S{si + 1}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
