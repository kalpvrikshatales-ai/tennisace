'use client'

import { useState, useEffect, useCallback } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import SearchModal from '@/components/SearchModal'
import MatchCard from '@/components/MatchCard'
import MatchCardSkeleton from '@/components/MatchCardSkeleton'
import RankingsList from '@/components/RankingsList'
import ResultCard from '@/components/ResultCard'
import ResultCardSkeleton from '@/components/ResultCardSkeleton'
import NewsCard from '@/components/NewsCard'
import ProfilePanel from '@/components/ProfilePanel'
import { getLiveMatches, getResults, getFixtures } from '@/lib/api-reliable'
import { sortByPriority } from '@/lib/matchPriority'
import { validateMatches } from '@/lib/dataValidator'
import { monitor } from '@/lib/integrityMonitor'
import { supabase } from '@/lib/supabase'
import type { Match } from '@/types'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
type Tab = 'matches' | 'rankings' | 'news' | 'wimbledon'

const SURFACE_DOT: Record<string, string> = {
  Grass: '#22C55E', Clay: '#F97316', Hard: '#9CA3AF',
}

const ROUND_DISPLAY: Record<string, string> = {
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF', F: 'FINAL', Final: 'FINAL',
  'Quarter-Finals': 'QF', 'Quarter-Final': 'QF',
  'Semi-Finals': 'SF', 'Semi-Final': 'SF',
  '1/2-finals': 'SF', '1/4-finals': 'QF', '1/8-finals': 'R4',
  '1/16-finals': 'R3', '1/32-finals': 'R2', '1/64-finals': 'R1',
  'Round of 16': 'R16', 'Round of 32': 'R32', 'Round of 64': 'R64', 'Round of 128': 'R128',
}

function getSurface(tournament: string, item?: any): string {
  const s = item?.surface
  if (s && SURFACE_DOT[s]) return s
  const t = tournament.toLowerCase()
  if (t.includes('wimbledon') || t.includes('queens') || t.includes('halle') || t.includes('grass')) return 'Grass'
  if (t.includes('roland') || t.includes('french') || t.includes('clay') || t.includes('monte') ||
      t.includes('madrid') || t.includes('rome') || t.includes('barcelona') || t.includes('hamburg')) return 'Clay'
  return 'Hard'
}

function groupByTournament<T extends { tournament?: string }>(items: T[]): { tournament: string; surface: string; round: string; items: T[] }[] {
  const groups: { tournament: string; surface: string; round: string; items: T[] }[] = []
  const idx = new Map<string, number>()
  for (const item of items) {
    const key = item.tournament || 'Other'
    if (idx.has(key)) {
      groups[idx.get(key)!].items.push(item)
    } else {
      idx.set(key, groups.length)
      const rawRound = (item as any).round || ''
      const roundPart = rawRound.split(' - ').pop() || rawRound
      groups.push({ tournament: key, surface: getSurface(key, item), round: roundPart, items: [item] })
    }
  }
  return groups
}

function TournamentHeader({ tournament, surface, round }: { tournament: string; surface: string; round?: string }) {
  const dot = SURFACE_DOT[surface] || '#9CA3AF'
  const isWimbledon = tournament.toLowerCase().includes('wimbledon')
  const roundDisplay = round ? (ROUND_DISPLAY[round] || round) : ''
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-black">
      <div className="w-[3px] h-4 rounded-full bg-[#00C875] flex-shrink-0" />
      {isWimbledon && <span className="text-[11px] font-black text-[#00C875] flex-shrink-0">W</span>}
      <span className="text-[11px] font-black text-white uppercase tracking-widest flex-1 truncate">
        {tournament}
      </span>
      {roundDisplay && (
        <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">{roundDisplay}</span>
      )}
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
    </div>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
      {active && <circle cx="19" cy="5" r="3.5" fill="#00C875" stroke="none" />}
    </svg>
  )
}

function SectionHeader({ title, count, sub }: { title: string; count?: number; sub?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{title}</p>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] bg-[#00C875]/15 text-[#00C875] rounded-full px-1.5 py-0.5 font-bold tabular-nums">{count}</span>
        )}
      </div>
      {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
    </div>
  )
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('matches')
  const [matchFilter, setMatchFilter] = useState<'live' | 'next' | 'completed' | 'all'>('live')
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOn, setNotifOn] = useState(false)

  // Matches tab data
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loadingLive, setLoadingLive] = useState(true)
  const [loadingFixtures, setLoadingFixtures] = useState(true)
  const [loadingResults, setLoadingResults] = useState(true)

  // Other tabs
  const [news, setNews] = useState<any[]>([])
  const [loadingNews, setLoadingNews] = useState(false)

  // ── Fetch all matches data simultaneously ─────────────────
  const fetchAllMatches = useCallback(async () => {
    // Live matches
    getLiveMatches().then(data => {
      const m = data.matches ?? []
      const valid = validateMatches(m)
      setLiveMatches(valid.data ? sortByPriority(valid.data) : [])
      setLoadingLive(false)
    }).catch(() => setLoadingLive(false))

    // Upcoming fixtures
    getFixtures(7).then(data => {
      setFixtures(data.fixtures ?? [])
      setLoadingFixtures(false)
    }).catch(() => setLoadingFixtures(false))

    // Recent results
    getResults(7).then(data => {
      const r = data.results ?? []
      const valid = validateMatches(r)
      setResults(valid.data ?? [])
      setLoadingResults(false)
    }).catch(() => setLoadingResults(false))
  }, [])

  // Handle OAuth redirect landing on root page — Supabase puts #access_token in hash
  // when Site URL is set to root. Clean the URL after session is established.
  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return
    const hash = window.location.hash
    if (!hash.includes('access_token')) return
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Remove the token hash from URL without a page reload
        window.history.replaceState(null, '', window.location.pathname)
      }
    })
  }, [])

  useEffect(() => {
    fetchAllMatches()
    const interval = setInterval(() => {
      // Only refresh live every 30s
      getLiveMatches().then(data => {
        const m = data.matches ?? []
        const valid = validateMatches(m)
        setLiveMatches(valid.data ? sortByPriority(valid.data) : [])
      }).catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchAllMatches])

  useEffect(() => {
    if (tab === 'news' && news.length === 0) {
      setLoadingNews(true)
      fetch(`${API}/feed/news`)
        .then(r => r.json())
        .then(d => setNews(d.articles ?? []))
        .catch(() => {})
        .finally(() => setLoadingNews(false))
    }
  }, [tab])

  // ── Tab config ────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'matches',  label: 'Matches',  icon: '🎾' },
    { key: 'rankings', label: 'Rankings', icon: '📊' },
    { key: 'news',     label: 'News',     icon: '📰' },
    { key: 'wimbledon',label: 'Wimbledon',icon: '🌿' },
  ]

  return (
    <div className="min-h-screen">
      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          {/* Left: Profile icon */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </button>

          {/* Center: Logo + name */}
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="TennisAce" className="h-7 w-7 rounded-xl object-cover flex-shrink-0" />
            <span className="text-[18px] font-black tracking-tight text-gray-900">
              Tennis<span className="text-[#00C875]">Ace</span>
            </span>
          </Link>

          {/* Right: Search + Theme + Bell */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <ThemeToggle />
            <button
              onClick={() => setNotifOn(v => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ${notifOn ? 'text-[#00C875]' : 'text-gray-400'}`}
            >
              <BellIcon active={notifOn} />
            </button>
          </div>
        </div>

        {/* Tab nav */}
        {/* Desktop tab row only — mobile uses bottom nav */}
        <div className="max-w-3xl mx-auto hidden md:flex overflow-x-auto scrollbar-hide border-t border-gray-100">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 text-[13px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                tab === key
                  ? 'border-[#00C875] text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {key === 'matches' && liveMatches.length > 0 && (
                <span className="text-[9px] bg-[#00C875] text-white rounded-full px-1.5 py-0.5 font-black">
                  {liveMatches.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-5 pb-24 md:pb-8">

        {/* ═══ MATCHES TAB ═══════════════════════════════════ */}
        {tab === 'matches' && (
          <div className="space-y-8">
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-4">
              {([
                { key: 'live',      label: liveMatches.length > 0 ? `Live ${liveMatches.length}` : 'Live' },
                { key: 'next',      label: 'Next' },
                { key: 'completed', label: 'Completed' },
                { key: 'all',       label: 'All' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMatchFilter(key)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                    matchFilter === key
                      ? 'bg-[#00C875] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* LIVE NOW */}
            {matchFilter === 'live' && <section>
              <SectionHeader
                title="Live Now"
                count={liveMatches.length}
                sub={liveMatches.length > 0 ? 'Updates every 30s' : undefined}
              />
              {loadingLive ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <MatchCardSkeleton key={i} />)}
                </div>
              ) : liveMatches.length === 0 ? (
                <div className="card p-5 text-center">
                  <p className="text-2xl mb-2">📡</p>
                  <p className="font-bold text-gray-900 text-[15px]">No matches live right now</p>
                  <p className="text-gray-400 text-[13px] mt-1">Matches typically play 10am–10pm local time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupByTournament(liveMatches).map(group => (
                    <div key={group.tournament} className="space-y-1">
                      <TournamentHeader tournament={group.tournament} surface={group.surface} round={group.round} />
                      {group.items.map(m => <MatchCard key={m.match_id} match={m} hideMeta />)}
                    </div>
                  ))}
                </div>
              )}
            </section>}

            {/* UPCOMING */}
            {matchFilter === 'next' && <section>
              <SectionHeader title="Upcoming" count={fixtures.length} sub="Next 7 days" />
              {loadingFixtures ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <MatchCardSkeleton key={i} />)}</div>
              ) : fixtures.length === 0 ? (
                <div className="card p-5 text-center"><p className="text-gray-400 text-[13px]">No scheduled matches found</p></div>
              ) : (
                <div className="space-y-3">
                  {groupByTournament(sortByPriority(fixtures)).map(group => (
                    <div key={group.tournament} className="space-y-1">
                      <TournamentHeader tournament={group.tournament} surface={group.surface} round={group.round} />
                      {group.items.map(f => <MatchCard key={f.match_id} match={f} hideMeta forceUpcoming />)}
                    </div>
                  ))}
                </div>
              )}
            </section>}

            {/* COMPLETED */}
            {matchFilter === 'completed' && <section>
              <SectionHeader title="Completed" count={results.length} sub="Last 7 days" />
              {loadingResults ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <ResultCardSkeleton key={i} />)}</div>
              ) : results.length === 0 ? (
                <div className="card p-5 text-center"><p className="text-gray-400 text-[13px]">No recent results</p></div>
              ) : (
                <div className="space-y-3">
                  {groupByTournament(results).map(group => (
                    <div key={group.tournament} className="space-y-1">
                      <TournamentHeader tournament={group.tournament} surface={group.surface} round={group.round} />
                      {group.items.map(r => <ResultCard key={r.match_id} result={r} hideMeta />)}
                    </div>
                  ))}
                </div>
              )}
            </section>}

            {/* ALL */}
            {matchFilter === 'all' && <section className="space-y-6">
              {/* Live */}
              {(loadingLive || liveMatches.length > 0) && (
                <div>
                  <SectionHeader title="Live Now" count={liveMatches.length} sub={liveMatches.length > 0 ? 'Updates every 30s' : undefined} />
                  {loadingLive ? (
                    <div className="space-y-3">{[...Array(2)].map((_, i) => <MatchCardSkeleton key={i} />)}</div>
                  ) : (
                    <div className="space-y-3">
                      {groupByTournament(liveMatches).map(group => (
                        <div key={group.tournament} className="space-y-1">
                          <TournamentHeader tournament={group.tournament} surface={group.surface} round={group.round} />
                          {group.items.map(m => <MatchCard key={m.match_id} match={m} hideMeta />)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming */}
              <div>
                <SectionHeader title="Upcoming" count={fixtures.length} sub="Next 7 days" />
                {loadingFixtures ? (
                  <div className="space-y-2">{[...Array(3)].map((_, i) => <MatchCardSkeleton key={i} />)}</div>
                ) : fixtures.length === 0 ? (
                  <div className="card p-4 text-center"><p className="text-gray-400 text-[13px]">No scheduled matches</p></div>
                ) : (
                  <div className="space-y-3">
                    {groupByTournament(sortByPriority(fixtures)).map(group => (
                      <div key={group.tournament} className="space-y-1">
                        <TournamentHeader tournament={group.tournament} surface={group.surface} round={group.round} />
                        {group.items.map(f => <MatchCard key={f.match_id} match={f} hideMeta forceUpcoming />)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed */}
              <div>
                <SectionHeader title="Completed" count={results.length} sub="Last 7 days" />
                {loadingResults ? (
                  <div className="space-y-2">{[...Array(3)].map((_, i) => <ResultCardSkeleton key={i} />)}</div>
                ) : results.length === 0 ? (
                  <div className="card p-4 text-center"><p className="text-gray-400 text-[13px]">No recent results</p></div>
                ) : (
                  <div className="space-y-3">
                    {groupByTournament(results).map(group => (
                      <div key={group.tournament} className="space-y-1">
                        <TournamentHeader tournament={group.tournament} surface={group.surface} round={group.round} />
                        {group.items.map(r => <ResultCard key={r.match_id} result={r} hideMeta />)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>}
          </div>
        )}

        {/* ═══ RANKINGS TAB ══════════════════════════════════ */}
        {tab === 'rankings' && (
          <div>
            <div className="mb-4 card p-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-black text-gray-900">Full Rankings</p>
                <p className="text-[11px] text-gray-400">ATP · WTA · AITA · ITF</p>
              </div>
              <Link href="/rankings" className="text-[13px] font-bold text-[#00C875]">View all →</Link>
            </div>
            <RankingsList />
          </div>
        )}

        {/* ═══ NEWS TAB ══════════════════════════════════════ */}
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
                <button
                  onClick={() => {
                    setLoadingNews(true)
                    fetch(`${API}/feed/news`).then(r => r.json())
                      .then(d => setNews(d.articles ?? []))
                      .catch(() => {})
                      .finally(() => setLoadingNews(false))
                  }}
                  className="mt-3 text-[#00C875] text-sm font-semibold"
                >
                  Retry →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {news.map((a, i) => <NewsCard key={i} article={a} index={i} />)}
              </div>
            )}
          </section>
        )}

        {/* ═══ WIMBLEDON TAB ════════════════════════════════ */}
        {tab === 'wimbledon' && (
          <div className="text-center py-8">
            <Link href="/wimbledon">
              <div className="card p-8 cursor-pointer hover:border-green-200 transition-all">
                <img src="/gs-wimbledon.png" alt="Wimbledon" className="h-20 w-auto mx-auto mb-4 object-contain" />
                <p className="text-[20px] font-black text-gray-900 mb-1">Wimbledon 2026</p>
                <p className="text-gray-400 text-[14px] mb-4">Jun 30 – Jul 13 · Grass · SW19 London</p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#22C55E] bg-green-50 px-4 py-2 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
                  View Draw & Scores →
                </span>
              </div>
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/compare">
                <div className="card p-4 text-left hover:border-gray-300 transition-all cursor-pointer">
                  <p className="text-[15px] font-black text-gray-900">⚔️ Compare</p>
                  <p className="text-[12px] text-gray-400 mt-1">Head-to-head player stats</p>
                </div>
              </Link>
              <Link href="/rankings">
                <div className="card p-4 text-left hover:border-gray-300 transition-all cursor-pointer">
                  <p className="text-[15px] font-black text-gray-900">📊 Rankings</p>
                  <p className="text-[12px] text-gray-400 mt-1">ATP · WTA · World rankings</p>
                </div>
              </Link>
              <Link href="/lounges">
                <div className="card p-4 text-left hover:border-gray-300 transition-all cursor-pointer">
                  <p className="text-[15px] font-black text-gray-900">💬 Lounges</p>
                  <p className="text-[12px] text-gray-400 mt-1">Community discussions</p>
                </div>
              </Link>
              <Link href="/calendar">
                <div className="card p-4 text-left hover:border-gray-300 transition-all cursor-pointer">
                  <p className="text-[15px] font-black text-gray-900">📅 Calendar</p>
                  <p className="text-[12px] text-gray-400 mt-1">Full tournament schedule</p>
                </div>
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────── */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 safe-bottom md:hidden">
        <div className="flex items-stretch justify-around px-1 pt-2 pb-2">
          {tabs.map(({ key, label, icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] relative transition-all active:scale-95"
              >
                {active && (
                  <span className="absolute inset-x-2 inset-y-0 rounded-2xl bg-[#00C875]/10" />
                )}
                <span className="relative z-10 text-[22px] leading-none">{icon}</span>
                {key === 'matches' && liveMatches.length > 0 && (
                  <span className="absolute top-1 right-3 text-[8px] bg-[#00C875] text-white font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {liveMatches.length > 9 ? '9+' : liveMatches.length}
                  </span>
                )}
                <span className={`text-[10px] font-bold z-10 ${active ? 'text-[#00C875]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── PROFILE PANEL ─────────────────────────────────── */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* ── SEARCH ────────────────────────────────────────── */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={{ matches: liveMatches, fixtures, results }}
      />
    </div>
  )
}
