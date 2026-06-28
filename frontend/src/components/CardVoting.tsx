'use client'

import { useState, useEffect } from 'react'

interface CardVotingProps {
  matchId: string
  player1: string
  player2: string
}

export default function CardVoting({ matchId, player1, player2 }: CardVotingProps) {
  const [votes, setVotes] = useState({ p1: 0, p2: 0 })
  const [userVote, setUserVote] = useState<1 | 2 | null>(null)
  const [loading, setLoading] = useState(true)

  const getBrowserId = () => {
    if (typeof window === 'undefined') return ''
    let bid = localStorage.getItem('_bid')
    if (!bid) {
      bid = 'u_' + Math.random().toString(36).slice(2, 11)
      localStorage.setItem('_bid', bid)
    }
    return bid
  }

  useEffect(() => {
    const browserId = getBrowserId()

    // Show cached vote instantly — no waiting for API
    const cached = localStorage.getItem(`vote_${matchId}`)
    if (cached) setUserVote(Number(cached) as 1 | 2)

    // Load real counts from API
    fetch(`/api/votes/match/${matchId}?browser_id=${browserId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setVotes({ p1: data.player1_votes || 0, p2: data.player2_votes || 0 })
          if (data.user_vote) setUserVote(data.user_vote)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [matchId])

  const handleVote = (e: React.MouseEvent | React.PointerEvent, vote: 1 | 2) => {
    e.preventDefault()
    e.stopPropagation()
    if (userVote === vote) return

    const prev = { ...votes }
    const prevVote = userVote
    const updated = { ...votes }

    // Optimistic update — show result immediately
    if (userVote === 1) updated.p1 = Math.max(0, updated.p1 - 1)
    if (userVote === 2) updated.p2 = Math.max(0, updated.p2 - 1)
    if (vote === 1) updated.p1 += 1
    else updated.p2 += 1

    setVotes(updated)
    setUserVote(vote)
    localStorage.setItem(`vote_${matchId}`, String(vote))

    // Sync to backend (best effort)
    fetch('/api/votes/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, browser_id: getBrowserId(), vote }),
    }).catch(() => {
      // Revert on network error
      setVotes(prev)
      setUserVote(prevVote)
      localStorage.removeItem(`vote_${matchId}`)
    })
  }

  if (loading) return <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />

  const total = votes.p1 + votes.p2 || 1
  const p1Pct = Math.round(votes.p1 / total * 100)
  const p2Pct = Math.round(votes.p2 / total * 100)

  return (
    <div className="space-y-1.5">
      <button
        onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
        onClick={e => handleVote(e, 1)}
        className={`w-full text-left ${userVote === 1 ? 'ring-2 ring-green-500 rounded-lg' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg h-7 flex items-center px-2.5 bg-gray-50">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-400/10 transition-all duration-300"
            style={{ width: `${p1Pct}%` }} />
          <div className="relative flex items-center justify-between w-full text-[11px]">
            <span className="font-bold text-gray-900 truncate">{player1}</span>
            <span className="font-black text-gray-700 flex-shrink-0 ml-1">{p1Pct}%</span>
          </div>
        </div>
      </button>

      <button
        onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
        onClick={e => handleVote(e, 2)}
        className={`w-full text-left ${userVote === 2 ? 'ring-2 ring-red-400 rounded-lg' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg h-7 flex items-center px-2.5 bg-gray-50">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-400/10 transition-all duration-300"
            style={{ width: `${p2Pct}%` }} />
          <div className="relative flex items-center justify-between w-full text-[11px]">
            <span className="font-bold text-gray-900 truncate">{player2}</span>
            <span className="font-black text-gray-700 flex-shrink-0 ml-1">{p2Pct}%</span>
          </div>
        </div>
      </button>

      {(votes.p1 + votes.p2) > 0 && (
        <p className="text-[9px] text-gray-400 text-center">
          {votes.p1 + votes.p2} vote{votes.p1 + votes.p2 !== 1 ? 's' : ''}
          {userVote && <span className="ml-1 text-green-500">· your vote counted</span>}
        </p>
      )}
    </div>
  )
}
