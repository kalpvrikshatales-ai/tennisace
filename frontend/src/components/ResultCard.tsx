import Link from 'next/link'
import { getCountryFlag } from '@/lib/countryFlags'
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

interface Props { result: Result }

const ROUND_SHORT: Record<string, string> = {
  'Round of 128': 'R1', 'Round of 64': 'R2', 'Round of 32': 'R3', 'Round of 16': 'R4',
  'Quarter-Finals': 'QF', 'Semi-Finals': 'SF', 'Final': 'F',
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF',
}

function parseSetScore(raw: string): { p1: number; p2: number } {
  // handles "6-2", "7.7-6.1" (tiebreak notation from API)
  const parts = raw.trim().split('-')
  return {
    p1: Math.floor(parseFloat(parts[0] || '0')),
    p2: Math.floor(parseFloat(parts[1] || '0')),
  }
}

export default function ResultCard({ result }: Props) {
  const p1won = result.winner === 'First Player'

  // Parse score string → per-set columns
  const rawSets = result.score ? result.score.split(',').map(s => s.trim()).filter(Boolean) : []
  const setsData = rawSets.map(parseSetScore)

  // Which player won each set
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
      <div className="bg-white rounded-xl border border-gray-100 px-3.5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">

        {/* Header: tournament · round | date */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide truncate">
              {result.tournament}
            </span>
            {roundLabel && (
              <span className="text-[10px] font-semibold text-gray-300">· {roundLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">Final</span>
            <span className="text-[10px] text-gray-300">{result.date}</span>
          </div>
        </div>

        {/* Player rows with set columns */}
        <div className="space-y-1">
          {players.map((p, rowIdx) => {
            const country    = getPlayerCountry(p.name)
            const isWinner   = (rowIdx === 0 && p1won) || (rowIdx === 1 && !p1won)
            const p1SetsWon  = setWinner.filter(w => w === 1).length
            const p2SetsWon  = setWinner.filter(w => w === 2).length
            const setsWon    = rowIdx === 0 ? p1SetsWon : p2SetsWon

            return (
              <div key={rowIdx} className="flex items-center gap-2">
                {/* Avatar */}
                {p.img ? (
                  <img src={p.img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0"
                    onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400">{p.name[0]}</span>
                  </div>
                )}

                {/* Name */}
                <span className={`flex-1 flex items-center gap-1.5 min-w-0 text-[15px] truncate ${
                  isWinner ? 'font-black text-gray-900' : 'font-medium text-gray-400'
                }`}>
                  {country && <span className="text-[13px]">{getCountryFlag(country)}</span>}
                  {p.name}
                </span>

                {/* Per-set scores */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {setsData.map((s, si) => {
                    const myGames = p.playerIdx === 1 ? s.p1 : s.p2
                    const iWonSet = setWinner[si] === p.playerIdx
                    return (
                      <span key={si} className={`text-[17px] tabular-nums w-5 text-right ${
                        iWonSet ? 'font-black text-gray-900' : 'font-medium text-gray-300'
                      }`}>
                        {myGames}
                      </span>
                    )
                  })}
                  {setsData.length === 0 && (
                    <span className="text-[14px] text-gray-200 w-5 text-right">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Set column headers */}
        {setsData.length > 0 && (
          <div className="flex items-center gap-2 justify-end mt-0.5">
            {setsData.map((_, si) => (
              <span key={si} className="text-[9px] text-gray-300 uppercase w-5 text-right">S{si + 1}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
