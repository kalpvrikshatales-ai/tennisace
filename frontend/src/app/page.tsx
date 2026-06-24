'use client'

import { useState, useEffect, useCallback } from 'react'
import MatchCard from '@/components/MatchCard'
import TournamentCard from '@/components/TournamentCard'
import { getLiveMatches, getTournaments } from '@/lib/api'
import type { Match, Tournament } from '@/types'

type Tab = 'live' | 'tournaments'

export default function Home() {
  const [tab, setTab] = useState<Tab>('live')
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await getLiveMatches()
      setMatches(data.matches ?? [])
      setLastUpdated(new Date())
    } catch {
      // keep stale data on error
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  const fetchTournaments = useCallback(async () => {
    try {
      const data = await getTournaments()
      setTournaments(data.tournaments ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingTournaments(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
    fetchTournaments()
    const interval = setInterval(fetchMatches, 30_000)
    return () => clearInterval(interval)
  }, [fetchMatches, fetchTournaments])

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="min-h-screen bg-[#0B1F3A]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0B1F3A]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Tennis<span className="text-[#00C875]">Ace</span>
            </h1>
            <p className="text-[11px] text-white/30 mt-0.5">Feel every match. Live.</p>
          </div>
          {lastUpdated && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875]" />
                <span className="text-[11px] font-medium text-[#00C875] uppercase tracking-wider">Live</span>
              </div>
              <span className="text-[10px] text-white/25 mt-0.5 block">
                {formatTime(lastUpdated)}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-0">
          {(['live', 'tournaments'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 pt-1 px-4 text-sm font-semibold transition-colors duration-150 border-b-2 ${
                tab === t
                  ? 'border-[#00C875] text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'live' ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      tab === 'live' ? 'bg-[#00C875] live-dot' : 'bg-white/20'
                    }`}
                  />
                  Live Scores
                  {matches.length > 0 && (
                    <span className="ml-1 text-[10px] bg-[#00C875]/20 text-[#00C875] rounded-full px-1.5 py-0.5 font-bold">
                      {matches.length}
                    </span>
                  )}
                </span>
              ) : (
                'Tournaments'
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'live' && (
          <section>
            {loadingMatches ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#0F2A4A] border border-white/[0.06] h-28 animate-pulse"
                  />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl mb-4">🎾</span>
                <p className="text-white/50 text-sm">No live matches right now.</p>
                <p className="text-white/25 text-xs mt-1">Scores refresh every 30 seconds.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <MatchCard key={m.match_id} match={m} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'tournaments' && (
          <section>
            {loadingTournaments ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#0F2A4A] border border-white/[0.06] h-16 animate-pulse"
                  />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl mb-4">🏆</span>
                <p className="text-white/50 text-sm">No tournaments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 pb-8 mt-8 text-center">
        <p className="text-[11px] text-white/20">tennisace.live · Feel every match. Live.</p>
      </footer>
    </div>
  )
}
