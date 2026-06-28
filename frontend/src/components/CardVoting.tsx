'use client'

import { useState, useEffect, useCallback } from 'react'

interface CardVotingProps {
  matchId: string
  player1: string
  player2: string
}

export default function CardVoting({ matchId, player1, player2 }: CardVotingProps) {
  const [votes, setVotes] = useState({ p1: 0, p2: 0, total: 0 })
  const [userVote, setUserVote] = useState<1 | 2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [browserId, setBrowserId] = useState<string>('')

  // Generate stable browser ID
  useEffect(() => {
    let bid = localStorage.getItem('_bid')
    if (!bid) {
      bid = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('_bid', bid)
    }
    setBrowserId(bid)
  }, [])

  // Load votes from API
  const loadVotes = useCallback(async () => {
    if (!browserId) return
    try {
      const response = await fetch(`/api/votes/match/${matchId}?browser_id=${browserId}`)
      if (response.ok) {
        const data = await response.json()
        setVotes({
          p1: data.player1_votes || 0,
          p2: data.player2_votes || 0,
          total: data.total_votes || 0
        })
        setUserVote(data.user_vote || null)
      } else {
        setVotes({ p1: 0, p2: 0, total: 0 })
      }
    } catch (e) {
      console.error('Failed to load votes:', e)
      setVotes({ p1: 0, p2: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }, [matchId, browserId])

  useEffect(() => {
    loadVotes()
  }, [loadVotes])

  const handleVote = async (e: React.MouseEvent<HTMLButtonElement>, vote: 1 | 2) => {
    e.preventDefault()
    e.stopPropagation()

    if (userVote === vote) return

    try {
      const response = await fetch('/api/votes/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, browser_id: browserId, vote })
      })

      if (response.ok) {
        const newVotes = { ...votes }
        if (userVote) {
          if (userVote === 1) newVotes.p1 = Math.max(0, newVotes.p1 - 1)
          else newVotes.p2 = Math.max(0, newVotes.p2 - 1)
        }
        if (vote === 1) newVotes.p1 += 1
        else newVotes.p2 += 1
        newVotes.total = newVotes.p1 + newVotes.p2

        setVotes(newVotes)
        setUserVote(vote)
      }
    } catch (e) {
      console.error('Vote failed:', e)
    }
  }

  if (loading) return <div className="h-6 bg-gray-100 rounded animate-pulse" />

  const total = votes.total || 1
  const p1Pct = Math.round(votes.p1 / total * 100)
  const p2Pct = Math.round(votes.p2 / total * 100)

  return (
    <div className="mt-3 space-y-1.5">
      {/* Player 1 Vote Button */}
      <button
        onClick={(e) => {e.preventDefault(); e.stopPropagation(); handleVote(e, 1)}}
        className={`w-full text-left transition-all ${userVote === 1 ? 'ring-2 ring-green-500' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg h-6 flex items-center px-2 bg-gray-50">
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-400/10 transition-all"
            style={{ width: `${p1Pct}%` }}
          />
          <div className="relative flex items-center justify-between w-full gap-1 text-[11px]">
            <span className="font-bold text-gray-900 truncate">{player1}</span>
            <span className="font-black text-gray-900 flex-shrink-0">{p1Pct}%</span>
          </div>
        </div>
      </button>

      {/* Player 2 Vote Button */}
      <button
        onClick={(e) => {e.preventDefault(); e.stopPropagation(); handleVote(e, 2)}}
        className={`w-full text-left transition-all ${userVote === 2 ? 'ring-2 ring-red-500' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg h-6 flex items-center px-2 bg-gray-50">
          <div
            className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-400/10 transition-all"
            style={{ width: `${p2Pct}%` }}
          />
          <div className="relative flex items-center justify-between w-full gap-1 text-[11px]">
            <span className="font-bold text-gray-900 truncate">{player2}</span>
            <span className="font-black text-gray-900 flex-shrink-0">{p2Pct}%</span>
          </div>
        </div>
      </button>

      {/* Total Votes */}
      {votes.total > 0 && (
        <p className="text-[9px] text-gray-400 text-center px-2">{votes.total} vote{votes.total !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
