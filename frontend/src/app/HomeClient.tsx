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
import { useSidebar } from '@/components/SidebarContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
type Tab = 'matches' | 'rankings' | 'news' | 'tournament'
type MatchFilter = 'live' | 'next' | 'completed' | 'all'

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

interface HomeClientProps {
  initialLive: Match[]
  initialFixtures: any[]
  initialResults: any[]
}

export default function HomeClient({ initialLive, initialFixtures, initialResults }: HomeClientProps) {
  const { homeTab: tab, setHomeTab: setTab, matchFilter, setMatchFilter, openDrawer } = useSidebar()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOn, setNotifOn] = useState(false)

  // Matches tab data — seeded from server-rendered initial props
  const [liveMatches, setLiveMatches] = useState<Match[]>(() => {
    const v = validateMatches(initialLive)
    return v.data ? sortByPriority(v.data) : []
  })
  const [fixtures, setFixtures] = useState<any[]>(initialFixtures)
  const [results, setResults] = useState<any[]>(() => {
    const v = validateMatches(initialResults)
    return v.data ?? []
  })

  // Skip loading skeleton when server already provided data
  const [loadingLive, setLoadingLive] = useState(initialLive.length === 0)
  const [loadingFixtures, setLoadingFixtures] = useState(initialFixtures.length === 0)
  const [loadingResults, setLoadingResults] = useState(initialResults.length === 0)

  // True once the first client-side fetchAllMatches() completes (or SSR gave us data).
  // Empty state is only shown after hasFetched — prevents flash of "no matches" on mobile pull-to-refresh.
  const [hasFetched, setHasFetched] = useState(
    initialLive.length > 0 || initialFixtures.length > 0 || initialResults.length > 0
  )

  // Other tabs
  const [news, setNews] = useState<any[]>([])
  const [loadingNews, setLoadingNews] = useState(false)

  // ── Fetch all matches data simultaneously ─────────────────
  const fetchAllMatches = useCallback(async () => {
    await Promise.allSettled([
      getLiveMatches().then(data => {
        const m = data.matches ?? []
        const valid = validateMatches(m)
        setLiveMatches(valid.data ? sortByPriority(valid.data) : [])
        setLoadingLive(false)
      }).catch(() => setLoadingLive(false)),

      getFixtures(7).then(data => {
        setFixtures(data.fixtures ?? [])
        setLoadingFixtures(false)
      }).catch(() => setLoadingFixtures(false)),

      getResults(7).then(data => {
        const r = data.results ?? []
        const valid = validateMatches(r)
        setResults(valid.data ?? [])
        setLoadingResults(false)
      }).catch(() => setLoadingResults(false)),
    ])
    setHasFetched(true)
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
    { key: 'tournament', label: 'US Open', icon: '🏆' },
  ]

  return (
    <div className="min-h-screen">
      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          {/* Left: Hamburger (mobile only) */}
          <button
            onClick={openDrawer}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {/* Spacer on desktop where hamburger was */}
          <div className="hidden md:block w-9" />

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

        {/* Mobile-only tab pills — quick tab switch below the main header bar */}
        <div className="md:hidden flex overflow-x-auto scrollbar-hide gap-2 px-4 pb-2 border-t border-gray-100 pt-2">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                tab === key ? 'bg-[#00C875] text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {key === 'matches' && liveMatches.length > 0 && (
                <span className="text-[9px] bg-white/30 rounded-full px-1 font-black">{liveMatches.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-5 pb-10">

        {/* ═══ MATCHES TAB — graceful degradation while scores rebuild for US Open ══ */}
        {tab === 'matches' && (
          <div className="space-y-4">
            {/* Scores paused card */}
            <div className="card overflow-hidden" style={{ background: '#0d1b2e', border: '1px solid #1a3050' }}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#39FF14' }}>Live Scores</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#39FF14', opacity: 0.4 }} />
                </div>
                <p className="text-white text-[22px] font-black leading-tight mb-2">
                  Live scores are taking a break.
                </p>
                <p className="text-[15px] mb-6" style={{ color: '#8ba3c0' }}>
                  We're rebuilding the data feed for the US Open. Back August 25.
                </p>
                <Link href="/tournament/us-open-2026"
                  className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-2.5 rounded-full"
                  style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39FF14' }}>
                  US Open hub — Aug 25 →
                </Link>
              </div>
            </div>

            {/* Join community card */}
            <div className="card overflow-hidden" style={{ background: '#080f1a', border: '1px solid #1a2535' }}>
              <div className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#39FF14' }}>
                  While we rebuild
                </p>
                <p className="text-white text-[18px] font-black mb-1">
                  Join the tennis community.
                </p>
                <p className="text-[13px] mb-5" style={{ color: '#8ba3c0' }}>
                  Find hitting partners near you. Get your founding member badge before the US Open.
                </p>

                <div className="flex flex-col gap-3">
                  <Link href="/sparring/create"
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-[14px]"
                    style={{ background: '#39FF14', color: '#000' }}>
                    <span>Create your player profile</span>
                    <span>→</span>
                  </Link>
                  <Link href="/sparring"
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-[13px]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                    <span>Browse players near you</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* US Open teaser */}
            <Link href="/tournament/us-open-2026" className="block">
              <div className="card p-5 cursor-pointer hover:border-yellow-200/20 transition-all"
                style={{ background: '#0d1b2e', border: '1px solid #1a3050' }}>
                <p className="text-[10px] font-black text-center uppercase tracking-widest mb-3" style={{ color: '#39FF14' }}>
                  Grand Slam · Hard Court · New York
                </p>
                <p className="text-white text-[20px] font-black text-center mb-1">US Open 2026</p>
                <p className="text-center text-[13px] mb-4" style={{ color: '#8ba3c0' }}>Aug 25 – Sep 7 · USTA Billie Jean King NTC</p>
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 rounded-full"
                    style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39FF14' }}>
                    View Tournament Hub →
                  </span>
                </div>
              </div>
            </Link>
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

        {/* ═══ US OPEN TAB ══════════════════════════════════ */}
        {tab === 'tournament' && (
          <div className="text-center py-8">
            <Link href="/tournament/us-open-2026">
              <div className="card p-8 cursor-pointer hover:border-yellow-200 transition-all"
                style={{ background: '#0d1b2e', border: '1px solid #1a3050' }}>
                <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: '#39FF14' }}>Grand Slam · Hard Court</p>
                <p className="text-[22px] font-black text-white mb-1">US Open 2026</p>
                <p className="text-[14px] mb-4" style={{ color: '#8ba3c0' }}>Aug 25 – Sep 7 · USTA Billie Jean King NTC · NY</p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-full"
                  style={{ background: '#39FF14', color: '#000' }}>
                  View Tournament Hub →
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
              <Link href="/sparring">
                <div className="card p-4 text-left hover:border-gray-300 transition-all cursor-pointer">
                  <p className="text-[15px] font-black text-gray-900">🤝 Find a Partner</p>
                  <p className="text-[12px] text-gray-400 mt-1">Find local sparring partners</p>
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

        <p style={{ fontSize: 12, paddingTop: 8, textAlign: 'center', color: '#9CA3AF' }}>
          <a href="https://instagram.com/tennisacelive" target="_blank" rel="noopener noreferrer">
            Follow live match analysis → @tennisacelive on Instagram
          </a>
        </p>
      </main>


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
