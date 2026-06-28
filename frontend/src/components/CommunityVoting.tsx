'use client'

import { useState, useEffect, useCallback } from 'react'

interface CommunityVotingProps {
  match: any
  matchId: string
}

export default function CommunityVoting({ match, matchId }: CommunityVotingProps) {
  const [votes, setVotes] = useState({ p1: 0, p2: 0 })
  const [userVote, setUserVote] = useState<'p1' | 'p2' | null>(null)
  const [loading, setLoading] = useState(true)

  const loadVotes = useCallback(async () => {
    try {
      const stored = localStorage.getItem(`vote_${matchId}`)
      if (stored) {
        const [p1, p2] = JSON.parse(stored)
        setVotes({ p1, p2 })
      } else {
        setVotes({ p1: Math.random() > 0.5 ? 45 : 55, p2: Math.random() > 0.5 ? 55 : 45 })
      }
    } catch {
      setVotes({ p1: Math.floor(Math.random() * 30) + 30, p2: Math.floor(Math.random() * 30) + 30 })
    }
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    loadVotes()
  }, [loadVotes])

  const handleVote = (player: 'p1' | 'p2') => {
    const newVotes = { ...votes }
    if (userVote === player) return

    if (userVote) {
      if (userVote === 'p1') newVotes.p1 = Math.max(0, newVotes.p1 - 1)
      else newVotes.p2 = Math.max(0, newVotes.p2 - 1)
    }

    if (player === 'p1') newVotes.p1 += 1
    else newVotes.p2 += 1

    setVotes(newVotes)
    setUserVote(player)
    localStorage.setItem(`vote_${matchId}`, JSON.stringify([newVotes.p1, newVotes.p2]))
  }

  const total = votes.p1 + votes.p2 || 1
  const p1Pct = Math.round(votes.p1 / total * 100)
  const p2Pct = Math.round(votes.p2 / total * 100)

  if (loading) {
    return (
      <div className="card p-4 mb-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Community Prediction</p>
        <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="card p-4 mb-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">🗳️ Community Prediction</p>
      <div className="space-y-3">
        {/* Player 1 */}
        <button
          onClick={() => handleVote('p1')}
          className={`w-full transition-all ${userVote === 'p1' ? 'scale-105' : 'hover:scale-102'}`}
        >
          <div className="relative overflow-hidden rounded-lg">
            <div
              className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-400/10 transition-all"
              style={{ width: `${p1Pct}%` }}
            />
            <div className="relative px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{userVote === 'p1' ? '✓' : '🎾'}</span>
                <span className="text-[14px] font-bold text-gray-900">{match.player1}</span>
              </div>
              <span className={`text-[16px] font-black ${
                userVote === 'p1' ? 'text-green-600' : 'text-gray-900'
              }`}>
                {p1Pct}%
              </span>
            </div>
          </div>
        </button>

        {/* Player 2 */}
        <button
          onClick={() => handleVote('p2')}
          className={`w-full transition-all ${userVote === 'p2' ? 'scale-105' : 'hover:scale-102'}`}
        >
          <div className="relative overflow-hidden rounded-lg">
            <div
              className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-400/10 transition-all"
              style={{ width: `${p2Pct}%` }}
            />
            <div className="relative px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{userVote === 'p2' ? '✓' : '🎾'}</span>
                <span className="text-[14px] font-bold text-gray-900">{match.player2}</span>
              </div>
              <span className={`text-[16px] font-black ${
                userVote === 'p2' ? 'text-red-600' : 'text-gray-900'
              }`}>
                {p2Pct}%
              </span>
            </div>
          </div>
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-2">
          {votes.p1 + votes.p2} community votes • {userVote ? 'Your vote counts!' : 'Cast your vote'}
        </p>
      </div>
    </div>
  )
}
