'use client'

import Link from 'next/link'
import { getCountryFlag } from '@/lib/countryFlags'
import { getPlayerCountry } from '@/lib/playerCountries'
import CardVoting from './CardVoting'
import type { Match } from '@/types'
import { shareScoreImage } from '@/lib/shareImage'

interface Props { match: Match }

const SURFACE_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Grass: { bg: 'bg-green-50',  text: 'text-green-700', dot: '#22C55E', label: '🌿 Grass' },
  Clay:  { bg: 'bg-orange-50', text: 'text-orange-600', dot: '#F97316', label: '🏺 Clay' },
  Hard:  { bg: 'bg-blue-50',   text: 'text-blue-600',  dot: '#3B82F6', label: '🔵 Hard' },
}

const ROUND_SHORT: Record<string, string> = {
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF', Final: 'F',
}

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
    else await navigator.clipboard.writeText(text)
  }
}

export default function MatchCard({ match }: Props) {
  const isLive    = match.status === 'In Progress' || match.status === 'live' || match.status === '1'
                    || (match.status || '').startsWith('Set')
  const isFinished = match.status === 'Finished' || match.status === 'After Penalties'
  const sets   = match.score ? match.score.split(',').map(s => s.trim()) : []
  const serving1 = match.serve === match.player1 || match.serve === 'First Player' || match.serve === '1'
  const serving2 = match.serve === match.player2 || match.serve === 'Second Player' || match.serve === '2'
  const gp = match.game_score ? match.game_score.split('-') : []
  const surface = (match as any).surface as string | undefined
  const surfStyle = SURFACE_STYLE[surface || 'Hard'] || SURFACE_STYLE.Hard
  const roundLabel = ROUND_SHORT[(match as any).round] || (match as any).round

  return (
    <Link href={`/matches/${match.match_id}`} className="block">
      <div className="card cursor-pointer card-glow overflow-hidden">

        {/* Surface colour band — 3px top stripe */}
        <div className="h-[3px] w-full" style={{ background: surfStyle.dot }} />

        <div className="p-4">
          {/* Top row: tournament BOLD + surface + round + status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[13px] font-black text-gray-900 leading-tight truncate">
                {match.tournament}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {surface && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${surfStyle.bg} ${surfStyle.text}`}>
                    {surfStyle.label}
                  </span>
                )}
                {roundLabel && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {roundLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Status + share */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C875] uppercase tracking-widest">
                  <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                  {match.status?.startsWith('Set') ? match.status : 'Live'}
                </span>
              ) : isFinished ? (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Final
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">
                  {(match as any).time || (match as any).date || ''}
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

          {/* Players + scores */}
          <div className="space-y-2.5">
            {[
              { name: match.player1, img: match.player1_img, serving: serving1, key: match.player1_key, gi: gp[0], idx: 0 },
              { name: match.player2, img: match.player2_img, serving: serving2, key: match.player2_key, gi: gp[1], idx: 1 },
            ].map(p => {
              const playerCountry = getPlayerCountry(p.name)
              const scores = sets.map(s => {
                const parts = s.split('-')
                return p.idx === 0 ? parts[0] : parts[1]
              })
              const opp = sets.map(s => {
                const parts = s.split('-')
                return p.idx === 0 ? parts[1] : parts[0]
              })
              const leading = scores.some((s, i) => parseInt(s || '0') > parseInt(opp[i] || '0'))

              return (
                <div key={p.idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {p.img ? (
                      <img src={p.img} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                        onError={e => e.currentTarget.style.display = 'none'} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-gray-400">{p.name.slice(0,1)}</span>
                      </div>
                    )}
                    {p.serving && <span className="text-[10px] flex-shrink-0">🎾</span>}
                    <Link
                      href={p.key ? `/players/${p.key}` : '#'}
                      onClick={e => e.stopPropagation()}
                      className={`text-[15px] font-bold truncate hover:text-[#00C875] transition-colors ${
                        leading ? 'text-gray-900' : isFinished ? 'text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {playerCountry && <span className="mr-1">{getCountryFlag(playerCountry)}</span>}{p.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {isLive && p.gi && (
                      <span className={`text-[12px] font-black px-1.5 py-0.5 rounded ${
                        p.serving ? 'text-[#00C875] bg-green-50' : 'text-gray-300'
                      }`}>{p.gi}</span>
                    )}
                    <div className="flex gap-1.5">
                      {scores.map((s, j) => {
                        const won = parseInt(s || '0') > parseInt(opp[j] || '0')
                        return (
                          <span key={j} className={`text-[17px] font-black tabular-nums w-6 text-center ${
                            won ? 'text-gray-900' : 'text-gray-300'
                          }`}>{s}</span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Community Voting */}
          <div className="mt-4 pt-4 border-t border-gray-200" onClick={e => {e.stopPropagation(); e.preventDefault()}}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Who wins?</p>
            <CardVoting matchId={match.match_id} player1={match.player1} player2={match.player2} />
          </div>
        </div>
      </div>
    </Link>
  )
}
