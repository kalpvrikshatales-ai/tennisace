'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MatchCard from '@/components/MatchCard'
import type { Match, Tournament } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const surfaceMeta: Record<string, { color: string; emoji: string }> = {
  Grass:  { color: '#4ade80', emoji: '🌿' },
  Clay:   { color: '#fb923c', emoji: '🏺' },
  Hard:   { color: '#60a5fa', emoji: '🔵' },
  Carpet: { color: '#c084fc', emoji: '🟣' },
}

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch(`${API}/tournaments/`),
        fetch(`${API}/matches/live`),
      ])
      const tData = await tRes.json()
      const mData = await mRes.json()

      const found = (tData.tournaments ?? []).find(
        (t: Tournament) => t.id === id
      )
      setTournament(found ?? null)

      const allMatches: Match[] = mData.matches ?? []
      const filtered = found
        ? allMatches.filter(
            (m) =>
              m.tournament
                ?.toLowerCase()
                .includes(found.name.toLowerCase()) ||
              found.name.toLowerCase().includes(m.tournament?.toLowerCase() ?? '')
          )
        : []
      setMatches(filtered)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const surface = tournament ? (surfaceMeta[tournament.surface] ?? { color: '#ffffff40', emoji: '🎾' }) : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-900/40 hover:text-gray-900 transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-bold tracking-tight">
            Tennis<span className="text-[#00C875]">Ace</span>
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 rounded-xl glass animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl glass animate-pulse" />
            ))}
          </div>
        ) : !tournament ? (
          <div className="text-center py-20">
            <p className="text-gray-900/50">Tournament not found.</p>
          </div>
        ) : (
          <>
            {/* Tournament hero */}
            <div className="rounded-xl glass border border-gray-200 p-5 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{surface?.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{tournament.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-900/40 text-sm">{tournament.country}</span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ color: surface?.color, backgroundColor: `${surface?.color}18` }}
                    >
                      {tournament.surface}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live matches */}
            <div className="mb-3 flex items-center gap-2">
              <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
              <span className="text-[11px] font-semibold text-[#00C875] uppercase tracking-widest">Live Matches</span>
            </div>

            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-4">🎾</span>
                <p className="text-gray-900/50 text-sm">No live matches right now.</p>
                <p className="text-gray-900/25 text-xs mt-1">Scores refresh every 30 seconds.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <MatchCard key={m.match_id} match={m} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
