'use client'

import { useState, useEffect, useCallback } from 'react'
import MatchCard from '@/components/MatchCard'
import TournamentCard from '@/components/TournamentCard'
import RankingsList from '@/components/RankingsList'
import ResultCard from '@/components/ResultCard'
import SearchBar from '@/components/SearchBar'
import BottomNav from '@/components/BottomNav'
import WimbledonBanner from '@/components/WimbledonBanner'
import PushButton from '@/components/PushButton'
import LiveTicker from '@/components/LiveTicker'
import NewsCard from '@/components/NewsCard'
import ThemeToggle from '@/components/ThemeToggle'
import { getLiveMatches, getTournaments, getResults, getFixtures } from '@/lib/api'
import { getFavourites } from '@/lib/favourites'
import type { Match, Tournament } from '@/types'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
type Tab = 'live' | 'results' | 'upcoming' | 'tournaments' | 'rankings' | 'news'

export default function Home() {
  const [tab, setTab] = useState<Tab>('live')
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [results, setResults] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [favourites, setFavourites] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [loadingResults, setLoadingResults] = useState(true)
  const [loadingFixtures, setLoadingFixtures] = useState(true)
  const [loadingNews, setLoadingNews] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await getLiveMatches()
      setMatches(data.matches ?? [])
      setLastUpdated(new Date())
    } catch { }
    finally { setLoadingMatches(false) }
  }, [])

  const fetchTournaments = useCallback(async () => {
    try {
      const data = await getTournaments()
      setTournaments(data.tournaments ?? [])
    } catch { }
    finally { setLoadingTournaments(false) }
  }, [])

  const fetchResults = useCallback(async () => {
    try {
      const data = await getResults(7)
      setResults(data.results ?? [])
    } catch { }
    finally { setLoadingResults(false) }
  }, [])

  const fetchFixtures = useCallback(async () => {
    try {
      const data = await getFixtures(3)
      setFixtures(data.fixtures ?? [])
    } catch { }
    finally { setLoadingFixtures(false) }
  }, [])

  const fetchNews = useCallback(async () => {
    try {
      const data = await fetch(`${API}/feed/news`).then(r => r.json())
      setNews(data.articles ?? [])
    } catch { }
    finally { setLoadingNews(false) }
  }, [])

  useEffect(() => {
    fetchMatches()
    fetchTournaments()
    fetchResults()
    fetchFixtures()
    fetchNews()
    setFavourites(getFavourites())
    const interval = setInterval(fetchMatches, 30_000)
    return () => clearInterval(interval)
  }, [fetchMatches, fetchTournaments, fetchResults, fetchFixtures, fetchNews])

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // Simplified: 4 main tabs only
  const tabs: { key: Tab; label: string }[] = [
    { key: 'live',     label: 'Live' },
    { key: 'results',  label: 'Results' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'news',     label: 'News' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TennisAce" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <PushButton />
            <SearchBar />
            {lastUpdated && (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="live-dot inline-block w-2 h-2 rounded-full bg-[#00C875]" />
                <span className="text-[11px] font-bold text-[#00C875] uppercase tracking-wider hidden sm:block">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Live ticker */}
        <LiveTicker />

        {/* Desktop nav — clean, minimal */}
        <div className="max-w-3xl mx-auto px-3 hidden md:flex overflow-x-auto scrollbar-hide items-center gap-1 border-t border-gray-100">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-2.5 pt-2 px-4 text-[15px] font-semibold transition-all duration-150 border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                tab === key
                  ? 'border-[#00C875] text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {key === 'live' && (
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${tab === 'live' ? 'bg-[#00C875] live-dot' : 'bg-gray-300'}`} />
              )}
              {label}
              {key === 'live' && matches.length > 0 && (
                <span className="text-[10px] bg-[#00C875]/15 text-[#009A58] rounded-full px-2 py-0.5 font-bold tabular-nums">
                  {matches.length}
                </span>
              )}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-0.5">
            <Link href="/wimbledon" className="pb-2.5 pt-2 px-3 text-[13px] font-semibold text-[#22C55E] hover:text-green-600 border-b-2 border-transparent whitespace-nowrap transition-colors">
              🌿 Wimbledon
            </Link>
            <Link href="/calendar" className="pb-2.5 pt-2 px-3 text-[13px] font-medium text-gray-400 hover:text-gray-600 border-b-2 border-transparent whitespace-nowrap transition-colors">
              Calendar
            </Link>
            <Link href="/compare" className="pb-2.5 pt-2 px-3 text-[13px] font-medium text-gray-400 hover:text-gray-600 border-b-2 border-transparent whitespace-nowrap transition-colors">
              Compare
            </Link>
          </div>
        </div>
      </header>

      {/* Content — add bottom padding on mobile for the nav bar */}
      <main className="max-w-3xl mx-auto px-5 py-6 pb-nav md:pb-6">

        {/* LIVE */}
        {tab === 'live' && (
          <section>
            <WimbledonBanner />
            {loadingMatches ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="rounded-xl glass border border-gray-200 h-28 animate-pulse" />)}
              </div>
            ) : matches.length === 0 ? (
              <div className="py-8">
                <p className="headline text-gray-900 mb-1">No matches live right now</p>
                <p className="text-gray-400 text-sm mb-8">Scores refresh every 30 seconds · Matches play 10am–10pm local time</p>
                <p className="label mb-4">Grand Slams 2026</p>
                <div className="space-y-2">
                  {[
                    { name: 'Wimbledon',       dates: 'Jun 30 – Jul 13', logo: '/gs-wimbledon.png', surface: 'Grass', color: '#22C55E' },
                    { name: 'US Open',         dates: 'Aug 25 – Sep 7',  logo: '/gs-uso.png',      surface: 'Hard',  color: '#3B82F6' },
                    { name: 'Australian Open', dates: 'Jan 12 – Jan 26', logo: '/gs-ao.svg',       surface: 'Hard',  color: '#3B82F6' },
                    { name: 'Roland Garros',   dates: 'May 25 – Jun 8',  logo: '/gs-rg.png',       surface: 'Clay',  color: '#F97316' },
                  ].map(t => (
                    <div key={t.name} className="card flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                          <img src={t.logo} alt={t.name} className="w-8 h-8 object-contain"
                            onError={e => { e.currentTarget.style.display='none' }} />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{t.name}</p>
                          <span className="text-[11px] font-semibold" style={{ color: t.color }}>{t.surface}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 font-medium">{t.dates}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => <MatchCard key={m.match_id} match={m} />)}
              </div>
            )}
          </section>
        )}

        {/* RESULTS */}
        {tab === 'results' && (
          <section>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-4">Last 7 days · ATP & WTA</p>
            {loadingResults ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl glass border border-gray-200 h-24 animate-pulse" />)}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl">📋</span>
                <p className="text-gray-400 text-sm mt-4">No recent results found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r) => <ResultCard key={r.match_id} result={r} />)}
              </div>
            )}
          </section>
        )}

        {/* TOURNAMENTS */}
        {tab === 'tournaments' && (
          <section>
            {loadingTournaments ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="rounded-xl glass border border-gray-200 h-16 animate-pulse" />)}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl">🏆</span>
                <p className="text-gray-400 text-sm mt-4">No tournaments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
              </div>
            )}
          </section>
        )}

        {/* UPCOMING / SCHEDULE */}
        {tab === 'upcoming' && (
          <section>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-4">Next 3 days · ATP & WTA</p>
            {loadingFixtures ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl glass animate-pulse" />)}
              </div>
            ) : fixtures.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl">📅</span>
                <p className="text-gray-400 text-sm mt-4">No upcoming matches found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fixtures.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 glass p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-400 uppercase tracking-wider truncate">{f.tournament} · {f.type?.replace(' Singles','')}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{f.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {f.player1_img && <img src={f.player1_img} alt="" className="w-6 h-6 rounded-full object-cover bg-white/10" onError={e=>e.currentTarget.style.display='none'} />}
                        <Link href={f.player1_key ? `/players/${f.player1_key}` : '#'}>
                          <span className="text-sm font-semibold text-gray-900 hover:text-[#00C875] transition-colors">{f.player1}</span>
                        </Link>
                      </div>
                      <span className="text-[#00C875] font-bold text-xs mx-3">vs</span>
                      <div className="flex items-center gap-2">
                        {f.player2_img && <img src={f.player2_img} alt="" className="w-6 h-6 rounded-full object-cover bg-white/10" onError={e=>e.currentTarget.style.display='none'} />}
                        <Link href={f.player2_key ? `/players/${f.player2_key}` : '#'}>
                          <span className="text-sm font-semibold text-gray-900 hover:text-[#00C875] transition-colors">{f.player2}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* NEWS */}
        {tab === 'news' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">Latest Tennis News</p>
              <span className="text-[10px] text-gray-300">BBC Sport</span>
            </div>
            {loadingNews ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl">📰</span>
                <p className="text-gray-400 text-sm mt-4">No news available right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {news.map((a, i) => <NewsCard key={i} article={a} index={i} />)}
              </div>
            )}
          </section>
        )}

        {/* RANKINGS */}
        {tab === 'rankings' && (
          <>
            {favourites.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] text-amber-400/70 uppercase tracking-widest mb-3">★ My Favourites</p>
                <div className="space-y-2">
                  {favourites.map(f => (
                    <Link key={f.key} href={`/players/${f.key}`}>
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl glass border border-amber-400/10 hover:border-amber-400/25 transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                          <p className="text-[11px] text-gray-400">{f.country}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#00C875] font-bold">{f.league}</span>
                          <span className="text-amber-400">★</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="h-px bg-gray-50 my-5" />
              </div>
            )}
            <RankingsList />
          </>
        )}

      </main>

      <footer className="max-w-2xl mx-auto px-4 pb-8 mt-8 text-center hidden md:block">
        <p className="text-[11px] text-gray-300">tennisace.live · Feel every match. Live.</p>
      </footer>

      {/* Bottom nav — mobile only */}
      <BottomNav tab={tab} setTab={setTab} liveCount={matches.length} />
    </div>
  )
}
