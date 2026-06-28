'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { getUser } from '@/lib/supabase'

const SignInModal = lazy(() => import('./SignInModal'))

interface CardVotingProps {
  matchId: string
  player1: string
  player2: string
}

interface VoteState {
  p1: number
  p2: number
  userVote: 1 | 2 | null
  ts: number // when last synced
}

const STORE_KEY = (id: string) => `v2_vote_${id}`

function loadStored(matchId: string): VoteState | null {
  try {
    const raw = localStorage.getItem(STORE_KEY(matchId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveStored(matchId: string, state: VoteState) {
  try { localStorage.setItem(STORE_KEY(matchId), JSON.stringify(state)) } catch {}
}

function getBrowserId(): string {
  try {
    let bid = localStorage.getItem('_bid')
    if (!bid) {
      bid = 'u_' + Math.random().toString(36).slice(2, 11)
      localStorage.setItem('_bid', bid)
    }
    return bid
  } catch { return 'anon' }
}

export default function CardVoting({ matchId, player1, player2 }: CardVotingProps) {
  // Load stored state instantly — no loading flicker
  const stored = typeof window !== 'undefined' ? loadStored(matchId) : null
  const [votes, setVotes] = useState({ p1: stored?.p1 ?? 0, p2: stored?.p2 ?? 0 })
  const [userVote, setUserVote] = useState<1 | 2 | null>(stored?.userVote ?? null)
  const [showSignIn, setShowSignIn] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    getUser().then(u => setIsLoggedIn(!!u))
  }, [])

  // Sync fresh counts from API in background (doesn't block UI)
  useEffect(() => {
    const browserId = getBrowserId()
    fetch(`/api/votes/match/${matchId}?browser_id=${browserId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const fresh = {
          p1: data.player1_votes || 0,
          p2: data.player2_votes || 0,
          userVote: (data.user_vote as 1 | 2 | null) ?? userVote,
          ts: Date.now(),
        }
        setVotes({ p1: fresh.p1, p2: fresh.p2 })
        if (fresh.userVote) setUserVote(fresh.userVote)
        saveStored(matchId, fresh)
      })
      .catch(() => {}) // silently keep localStorage state
  }, [matchId])

  const handleVote = (e: React.MouseEvent | React.PointerEvent, vote: 1 | 2) => {
    e.preventDefault()
    e.stopPropagation()
    if (userVote === vote) return // already voted this

    const prev = { ...votes, userVote }

    // Instant optimistic update
    const next = { ...votes }
    if (userVote === 1) next.p1 = Math.max(0, next.p1 - 1)
    if (userVote === 2) next.p2 = Math.max(0, next.p2 - 1)
    if (vote === 1) next.p1 += 1
    else next.p2 += 1

    setVotes(next)
    setUserVote(vote)
    saveStored(matchId, { ...next, userVote: vote, ts: Date.now() })

    // Show sign-in nudge after very first vote, only once, only if not logged in
    const hasSeenNudge = localStorage.getItem('_seen_signin_nudge')
    if (!isLoggedIn && !hasSeenNudge) {
      setTimeout(() => setShowSignIn(true), 600)
      localStorage.setItem('_seen_signin_nudge', '1')
    }

    // Persist to backend — best effort
    fetch('/api/votes/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, browser_id: getBrowserId(), vote }),
    }).catch(() => {
      // Network failed — revert to pre-click state but keep localStorage
      // (so next reload shows what user voted, not 0)
      setVotes({ p1: prev.p1, p2: prev.p2 })
      setUserVote(prev.userVote)
      saveStored(matchId, { p1: prev.p1, p2: prev.p2, userVote: prev.userVote, ts: Date.now() })
    })
  }

  const total = votes.p1 + votes.p2 || 1
  const p1Pct = Math.round(votes.p1 / total * 100)
  const p2Pct = Math.round(votes.p2 / total * 100)
  const hasVotes = votes.p1 + votes.p2 > 0

  return (
    <div className="space-y-1.5">
      <button
        onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
        onClick={e => handleVote(e, 1)}
        className={`w-full text-left transition-all ${userVote === 1 ? 'ring-2 ring-green-500 rounded-lg' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg h-8 flex items-center px-3 bg-gray-50">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/25 to-green-400/10 rounded-lg transition-all duration-500"
            style={{ width: `${hasVotes ? p1Pct : 50}%` }}
          />
          <div className="relative flex items-center justify-between w-full text-[12px]">
            <span className="font-bold text-gray-900 truncate">{player1}</span>
            <span className={`font-black flex-shrink-0 ml-2 ${userVote === 1 ? 'text-green-600' : 'text-gray-500'}`}>
              {hasVotes ? `${p1Pct}%` : '—'}
            </span>
          </div>
        </div>
      </button>

      <button
        onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
        onClick={e => handleVote(e, 2)}
        className={`w-full text-left transition-all ${userVote === 2 ? 'ring-2 ring-red-400 rounded-lg' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg h-8 flex items-center px-3 bg-gray-50">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500/25 to-red-400/10 rounded-lg transition-all duration-500"
            style={{ width: `${hasVotes ? p2Pct : 50}%` }}
          />
          <div className="relative flex items-center justify-between w-full text-[12px]">
            <span className="font-bold text-gray-900 truncate">{player2}</span>
            <span className={`font-black flex-shrink-0 ml-2 ${userVote === 2 ? 'text-red-500' : 'text-gray-500'}`}>
              {hasVotes ? `${p2Pct}%` : '—'}
            </span>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between px-0.5">
        {hasVotes ? (
          <p className="text-[10px] text-gray-400">
            {votes.p1 + votes.p2} vote{votes.p1 + votes.p2 !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-[10px] text-gray-400">Be the first to vote</p>
        )}
        {userVote && (
          <p className="text-[10px] font-bold text-green-500">✓ voted</p>
        )}
      </div>

      {/* Optional sign-in nudge — shown once after first vote */}
      {showSignIn && (
        <Suspense fallback={null}>
          <SignInModal onClose={() => setShowSignIn(false)} />
        </Suspense>
      )}
    </div>
  )
}
