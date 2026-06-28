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

export default function ResultCard({ result }: Props) {
  // p1won/p2won: who won this match
  const p1won = result.winner === 'First Player'
  const p2won = result.winner === 'Second Player'

  // winner/loser are resolved once and used consistently
  const winner = p1won ? result.player1 : result.player2
  const loser  = p1won ? result.player2 : result.player1
  const winnerImg = p1won ? result.player1_img : result.player2_img
  const loserImg  = p1won ? result.player2_img : result.player1_img
  const winnerCountry = getPlayerCountry(winner)
  const loserCountry  = getPlayerCountry(loser)

  const p1Country = getPlayerCountry(result.player1)
  const p2Country = getPlayerCountry(result.player2)

  return (
    <Link href={`/matches/${result.match_id}`}>
      <div className="rounded-xl border border-gray-200 glass p-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
        {/* Tournament + Round + Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider truncate">
            {result.tournament}
          </span>
          {result.round && (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
              {result.round.split(' - ').pop()}
            </span>
          )}
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-auto">{result.date}</span>
        </div>

        {/* Winner "def." Loser + Full Score */}
        <div className="space-y-2.5">
          {/* Winner row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {winnerImg && (
                <img
                  src={winnerImg}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0"
                  onError={e => (e.currentTarget.style.display='none')}
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[14px] font-black text-gray-900 truncate">
                  {winnerCountry && <span className="mr-1">{getCountryFlag(winnerCountry)}</span>}
                  {winner}
                </span>
              </div>
            </div>
            <span className="text-[12px] font-bold text-gray-900 flex-shrink-0">def.</span>
          </div>

          {/* Loser row — always the other player */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {loserImg && (
                <img
                  src={loserImg}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0"
                  onError={e => (e.currentTarget.style.display='none')}
                />
              )}
              <span className="text-[14px] font-semibold text-gray-500 truncate">
                {loserCountry && <span className="mr-1">{getCountryFlag(loserCountry)}</span>}
                {loser}
              </span>
            </div>
          </div>

          {/* Full Score */}
          <div className="bg-gray-50 rounded-lg p-3 mt-3">
            <p className="text-[11px] text-gray-400 font-semibold mb-2">FINAL SCORE</p>
            <p className="text-[13px] font-bold text-gray-900 font-mono tracking-tight">
              {result.score || '—'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
