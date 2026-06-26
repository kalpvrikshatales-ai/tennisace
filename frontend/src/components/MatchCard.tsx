'use client'

import Link from 'next/link'
import type { Match } from '@/types'
import { shareScoreImage } from '@/lib/shareImage'

interface Props { match: Match }

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
    else { await navigator.clipboard.writeText(text) }
  }
}

export default function MatchCard({ match }: Props) {
  const isLive = match.status === 'In Progress' || match.status === 'live' || match.status === '1'
  const sets = match.score ? match.score.split(',').map(s => s.trim()) : []
  const serving1 = match.serve === match.player1 || match.serve === 'First Player' || match.serve === '1'
  const serving2 = match.serve === match.player2 || match.serve === 'Second Player' || match.serve === '2'
  const gp = match.game_score ? match.game_score.split('-') : []

  const ScoreCol = ({ idx }: { idx: number }) => (
    <div className="flex flex-col gap-2.5 text-right ml-3">
      {sets.map((s, i) => {
        const parts = s.split('-')
        const mine = parts[idx] ?? ''
        const theirs = parts[1 - idx] ?? '0'
        const winning = parseInt(mine) > parseInt(theirs)
        return (
          <span key={i} className={`text-xl font-black tabular-nums leading-none ${winning ? 'text-gray-900' : 'text-gray-300'}`}>
            {mine}
          </span>
        )
      })}
    </div>
  )

  return (
    <Link href={`/matches/${match.match_id}`} className="block">
      <div className="card p-4 cursor-pointer card-glow">
        {/* Header: tournament + round + live */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="label truncate">{match.tournament}</span>
            {match.round && <span className="text-[10px] text-gray-300">· {match.round.split(' - ').pop()}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLive && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#00C875] uppercase tracking-widest">
                <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                Live
              </span>
            )}
            <button
              onClick={e => { e.preventDefault(); shareMatch(match) }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="flex items-stretch gap-2">
          <div className="flex-1 space-y-2.5">
            {/* Player 1 */}
            <div className="flex items-center gap-2.5">
              {match.player1_img && (
                <img src={match.player1_img} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                  onError={e => e.currentTarget.style.display='none'} />
              )}
              {serving1 && <span className="text-[11px] flex-shrink-0">🎾</span>}
              <span className={`text-[16px] font-bold leading-tight truncate ${serving1 ? 'text-gray-900' : 'text-gray-500'}`}>
                {match.player1}
              </span>
              {isLive && gp[0] && (
                <span className={`ml-auto text-[13px] font-black px-2 py-0.5 rounded-md flex-shrink-0 ${
                  serving1 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-gray-300'
                }`}>{gp[0]}</span>
              )}
            </div>
            {/* Player 2 */}
            <div className="flex items-center gap-2.5">
              {match.player2_img && (
                <img src={match.player2_img} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                  onError={e => e.currentTarget.style.display='none'} />
              )}
              {serving2 && <span className="text-[11px] flex-shrink-0">🎾</span>}
              <span className={`text-[16px] font-bold leading-tight truncate ${serving2 ? 'text-gray-900' : 'text-gray-500'}`}>
                {match.player2}
              </span>
              {isLive && gp[1] && (
                <span className={`ml-auto text-[13px] font-black px-2 py-0.5 rounded-md flex-shrink-0 ${
                  serving2 ? 'text-[#00C875] bg-[#00C875]/10' : 'text-gray-300'
                }`}>{gp[1]}</span>
              )}
            </div>
          </div>

          {/* Set scores */}
          {sets.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              <ScoreCol idx={0} />
              <ScoreCol idx={1} />
            </div>
          )}
        </div>

        {/* Status footer */}
        {!isLive && match.status && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="label">{match.status}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
