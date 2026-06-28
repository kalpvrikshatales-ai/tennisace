import Link from 'next/link'

interface Result {
  match_id: string
  player1: string
  player2: string
  player1_key?: number
  player2_key?: number
  player1_img?: string
  player2_img?: string
  score: string
  winner?: string
  tournament: string
  round?: string
  type?: string
  date: string
}

interface Props { result: Result }

export default function ResultCard({ result }: Props) {
  const p1won = result.winner === 'First Player'
  const p2won = result.winner === 'Second Player'

  return (
    <Link href={`/matches/${result.match_id}`}>
      <div className="rounded-xl border border-gray-200 glass p-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 truncate">
          {result.tournament}
          {result.round ? ` · ${result.round.split(' - ').pop()}` : ''}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{result.date}</span>
      </div>

      {/* Players */}
      <div className="space-y-2">
        {/* Player 1 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {result.player1_img && (
              <img src={result.player1_img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0" onError={e => (e.currentTarget.style.display='none')} />
            )}
            <Link href={result.player1_key ? `/players/${result.player1_key}` : '#'}>
              <span className={`text-sm font-semibold truncate hover:text-[#00C875] transition-colors ${p1won ? 'text-white' : 'text-gray-500'}`}>
                {result.player1}
                {p1won && <span className="ml-1.5 text-[10px] text-[#00C875]">✓</span>}
              </span>
            </Link>
          </div>
          <span className={`text-xs tabular-nums font-bold flex-shrink-0 ${p1won ? 'text-white' : 'text-gray-400'}`}>
            {result.score.split(',')[0]?.split('-')[0]?.trim()}
          </span>
        </div>

        {/* Player 2 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {result.player2_img && (
              <img src={result.player2_img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0" onError={e => (e.currentTarget.style.display='none')} />
            )}
            <Link href={result.player2_key ? `/players/${result.player2_key}` : '#'}>
              <span className={`text-sm font-semibold truncate hover:text-[#00C875] transition-colors ${p2won ? 'text-white' : 'text-gray-500'}`}>
                {result.player2}
                {p2won && <span className="ml-1.5 text-[10px] text-[#00C875]">✓</span>}
              </span>
            </Link>
          </div>
          <span className={`text-xs tabular-nums font-bold flex-shrink-0 ${p2won ? 'text-white' : 'text-gray-400'}`}>
            {result.score.split(',')[0]?.split('-')[1]?.trim()}
          </span>
        </div>
      </div>
      </div>
    </Link>
  )
}
