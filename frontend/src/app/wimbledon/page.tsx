'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getFlag } from '@/lib/flags'
import { getLiveMatches, getFixtures, getPlayer } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Constants ────────────────────────────────────────────────────────────────

const W_START = new Date('2026-06-29T10:00:00Z')
const W_END   = new Date('2026-07-13T18:00:00Z')
const NOW = () => new Date()

const GREEN  = '#22C55E'
const PURPLE = '#7C3AED'
const GRASS_BG = '#F0FDF4'

// Top 8 seeds — bracket positions
const SEEDS = [
  { key: 2072, name: 'Jannik Sinner',        short: 'Sinner',      country: 'Italy',     seed: 1, quarter: 'Q1' },
  { key: 2382, name: 'Carlos Alcaraz',        short: 'Alcaraz',     country: 'Spain',     seed: 2, quarter: 'Q4' },
  { key: 1980, name: 'Alexander Zverev',      short: 'Zverev',      country: 'Germany',   seed: 3, quarter: 'Q3' },
  { key: 2073, name: 'Felix Auger-Aliassime', short: 'FAA',         country: 'Canada',    seed: 4, quarter: 'Q2' },
  { key: 2973, name: 'Ben Shelton',           short: 'Shelton',     country: 'USA',       seed: 5, quarter: 'Q2' },
  { key: 1106, name: 'Alex De Minaur',        short: 'De Minaur',   country: 'Australia', seed: 6, quarter: 'Q3' },
  { key: 2832, name: 'Taylor Fritz',          short: 'Fritz',       country: 'USA',       seed: 7, quarter: 'Q1' },
  { key: 1905, name: 'Novak Djokovic',        short: 'Djokovic',    country: 'Serbia',    seed: 8, quarter: 'Q4' },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ color, background: bg }}>
      {label}
    </span>
  )
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
      style={{ color: GREEN }}>
      <span className="live-dot inline-block w-2 h-2 rounded-full" style={{ background: GREEN }} />
      Live
    </span>
  )
}

function Countdown() {
  const [t, setT] = useState({ d: 2, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = W_START.getTime() - NOW().getTime()
      if (diff <= 0) return
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const Unit = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl px-4 py-3 min-w-[60px] text-center border"
        style={{ background: GRASS_BG, borderColor: `${GREEN}30` }}>
        <span className="text-3xl font-black tabular-nums" style={{ color: GREEN }}>
          {String(v).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-1.5">{l}</span>
    </div>
  )

  return (
    <div className="flex gap-3 justify-center items-end">
      <Unit v={t.d} l="days" />
      <span className="text-2xl font-black pb-7" style={{ color: `${GREEN}50` }}>:</span>
      <Unit v={t.h} l="hrs" />
      <span className="text-2xl font-black pb-7" style={{ color: `${GREEN}50` }}>:</span>
      <Unit v={t.m} l="min" />
      <span className="text-2xl font-black pb-7" style={{ color: `${GREEN}50` }}>:</span>
      <Unit v={t.s} l="sec" />
    </div>
  )
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[18px] font-black text-gray-900 tracking-tight">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold transition-colors"
          style={{ color: GREEN }}>
          {action} →
        </button>
      )}
    </div>
  )
}

function MatchRow({ match, isLive }: { match: any; isLive: boolean }) {
  const scores = match.score ? match.score.split(',').map((s: string) => s.trim()) : []
  const s1 = match.serve === 'First Player' || match.serve === '1'
  const s2 = match.serve === 'Second Player' || match.serve === '2'

  return (
    <Link href={`/matches/${match.match_id}`}>
      <div className="card p-4 cursor-pointer hover:border-green-200 transition-all card-glow">
        {/* Round label */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {match.round?.split(' - ').pop() || match.tournament || 'Wimbledon'}
          </span>
          {isLive ? <LiveBadge /> : (
            <span className="text-[11px] text-gray-400">
              {match.date || 'Today'} {match.time && `· ${match.time}`}
            </span>
          )}
        </div>

        {/* Players + Scores */}
        <div className="space-y-2.5">
          {[
            { name: match.player1, serving: s1, img: match.player1_img },
            { name: match.player2, serving: s2, img: match.player2_img },
          ].map((p, i) => {
            const setScores = scores.map((s: string) => {
              const parts = s.split('-')
              return i === 0 ? parts[0] : parts[1]
            })
            const leading = scores.some((s: string) => {
              const [a, b] = s.split('-').map(Number)
              return i === 0 ? a > b : b > a
            })
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {p.img && (
                    <img src={p.img} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0"
                      onError={e => e.currentTarget.style.display = 'none'} />
                  )}
                  {p.serving && <span className="text-[10px] flex-shrink-0">🎾</span>}
                  <span className={`text-[15px] font-bold truncate ${leading && isLive ? 'text-gray-900' : 'text-gray-600'}`}>
                    {p.name}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-2">
                  {setScores.map((s: string, j: number) => (
                    <span key={j} className={`text-[17px] font-black tabular-nums w-6 text-center
                      ${(parseInt(s) > parseInt(scores[j]?.split('-')[1 - i] ?? '0')) ? 'text-gray-900' : 'text-gray-300'}`}>
                      {s}
                    </span>
                  ))}
                  {isLive && match.game_score && (
                    <span className={`text-[13px] font-bold ml-1 px-1.5 py-0.5 rounded
                      ${p.serving ? 'text-green-600 bg-green-50' : 'text-gray-300'}`}>
                      {match.game_score.split('-')[i]}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Link>
  )
}

function UpcomingRow({ match }: { match: any }) {
  const time = match.time || match.date
  const round = match.round?.split(' - ').pop() || 'R1'

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{round}</span>
          <p className="text-[14px] font-bold text-gray-900 truncate">{match.player1}</p>
          <p className="text-[14px] font-semibold text-gray-500 truncate">vs {match.player2}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[13px] font-bold" style={{ color: GREEN }}>{time || 'TBD'}</span>
          {match.date && <p className="text-[11px] text-gray-400 mt-0.5">{match.date}</p>}
        </div>
      </div>
    </div>
  )
}

function BracketQuarter({ label, top, bottom }: { label: string; top: typeof SEEDS[0]; bottom: typeof SEEDS[0] }) {
  return (
    <div className="card p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      {[top, bottom].map(s => (
        <Link key={s.key} href={`/players/${s.key}`}>
          <div className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer">
            <span className="text-[11px] font-black w-5 text-center" style={{ color: GREEN }}>{s.seed}</span>
            <span className="text-[14px] font-bold text-gray-900">{getFlag(s.country)} {s.short}</span>
          </div>
        </Link>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">Seeds placed in {label} · QF TBD after R3</p>
      </div>
    </div>
  )
}

function SeedCard({ s }: { s: typeof SEEDS[0] }) {
  const [data, setData] = useState<any>(null)
  useEffect(() => { getPlayer(String(s.key)).then(setData).catch(() => {}) }, [s.key])

  const grass = (data?.stats ?? [])
    .filter((x: any) => x.type === 'singles' && (x.grass_won || x.grass_lost))
    .sort((a: any, b: any) => parseInt(b.season) - parseInt(a.season))
    .slice(0, 1)[0]

  const w = parseInt(grass?.grass_won || '0')
  const l = parseInt(grass?.grass_lost || '0')
  const pct = w + l > 0 ? Math.round(w / (w + l) * 100) : null

  return (
    <Link href={`/players/${s.key}`}>
      <div className="card p-4 cursor-pointer card-glow flex items-center gap-3">
        {data?.player_logo && (
          <img src={data.player_logo} alt="" className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
            style={{ borderColor: `${GREEN}30` }}
            onError={e => e.currentTarget.style.display = 'none'} />
        )}
        {!data?.player_logo && (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
            <span className="text-lg font-black" style={{ color: GREEN }}>{s.seed}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-black" style={{ color: GREEN }}>#{s.seed}</span>
            <span className="text-[14px] font-bold text-gray-900 truncate">{s.short}</span>
          </div>
          <p className="text-[11px] text-gray-400">{getFlag(s.country)} {s.country}</p>
          {pct !== null && (
            <div className="mt-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GREEN }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: pct >= 70 ? GREEN : '#6B7280' }}>
                  {pct}% grass
                </span>
              </div>
            </div>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </Link>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WimbledonHub() {
  const router = useRouter()
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [draw, setDraw] = useState<Record<string, any[]>>({})
  const [drawGender, setDrawGender] = useState<'men' | 'women'>('men')
  const [drawRound, setDrawRound] = useState('R1')
  const [loadingDraw, setLoadingDraw] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeGender, setActiveGender] = useState<'All' | 'Men' | 'Women'>('All')
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  const isLive   = NOW() >= W_START && NOW() <= W_END
  const isFuture = NOW() < W_START

  const fetchData = useCallback(async () => {
    try {
      const [live, fix] = await Promise.all([
        getLiveMatches(),
        getFixtures(7),
      ])
      const wLive = (live.matches ?? []).filter((m: any) =>
        (m.tournament || '').toLowerCase().includes('wimbledon') ||
        (m.type || '').toLowerCase().includes('grand slam')
      )
      const wFix = (fix.fixtures ?? []).filter((f: any) =>
        (f.tournament || '').toLowerCase().includes('wimbledon') ||
        (f.round || '').toLowerCase().includes('wimbledon')
      )
      setLiveMatches(wLive)
      setUpcoming(wFix)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30_000); return () => clearInterval(t) }, [fetchData])

  const fetchDraw = useCallback(async (gender: string) => {
    setLoadingDraw(true)
    try {
      const d = await fetch(`${API}/feed/wimbledon?gender=${gender}`).then(r => r.json())
      setDraw(d.rounds ?? {})
      // default to first available round
      const rounds = Object.keys(d.rounds ?? {})
      if (rounds.length > 0 && !d.rounds[drawRound]) setDrawRound(rounds[0])
    } catch {}
    finally { setLoadingDraw(false) }
  }, [drawRound])

  useEffect(() => { fetchDraw(drawGender) }, [drawGender])

  const filterGender = (matches: any[]) => {
    if (activeGender === 'All') return matches
    if (activeGender === 'Men') return matches.filter((m: any) =>
      !(m.type || '').toLowerCase().includes('women') && !(m.round || '').toLowerCase().includes('women'))
    return matches.filter((m: any) =>
      (m.type || '').toLowerCase().includes('women') || (m.round || '').toLowerCase().includes('women'))
  }

  const visibleUpcoming = filterGender(upcoming).slice(0, showAllUpcoming ? 20 : 6)

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <img src="/logo.png" alt="TennisAce" className="h-7 w-auto" />
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <img src="/gs-wimbledon.png" alt="Wimbledon" className="h-6 w-auto object-contain" />
            <span className="text-[15px] font-black text-gray-900">Wimbledon 2026</span>
          </div>
          {isLive && <LiveBadge />}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-nav md:pb-8">

        {/* ═══ HERO ════════════════════════════════════════════════════════════ */}
        <section className="pt-2 pb-6">

          {/* ── Premium hero card with grass court texture ── */}
          <div className="relative rounded-3xl overflow-hidden mb-5"
            style={{
              background: 'linear-gradient(160deg, #0D3D1C 0%, #155C2C 45%, #0A2E14 100%)',
            }}>

            {/* Grass mow stripes — CSS-only, zero cost */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 12px, transparent 12px, transparent 24px)',
            }} />

            {/* Subtle vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.25) 100%)' }} />

            {/* Purple / gold top accent band */}
            <div className="h-1 w-full" style={{
              background: 'linear-gradient(90deg, #6B21A8 0%, #7C3AED 30%, #22C55E 70%, #15803D 100%)'
            }} />

            {/* Content */}
            <div className="relative px-5 pt-6 pb-7">

              {/* Logo + headline */}
              <div className="flex items-center gap-3 mb-5">
                <img src="/gs-wimbledon.png" alt="Wimbledon"
                  className="h-14 w-14 object-contain flex-shrink-0 drop-shadow-lg" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-0.5"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>
                    The Championships
                  </p>
                  <h1 className="text-[32px] font-black text-white leading-none tracking-tight">
                    Wimbledon
                  </h1>
                  <p className="text-[32px] font-black leading-none tracking-tight"
                    style={{ color: GREEN }}>
                    2026
                  </p>
                </div>
                {isLive && (
                  <div className="ml-auto">
                    <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.2)', color: GREEN, border: '1px solid rgba(34,197,94,0.3)' }}>
                      <span className="live-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: GREEN }} />
                      Live
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Surface', value: 'Grass', icon: '🌿' },
                  { label: 'Prize Fund', value: '£50M', icon: '🏆' },
                  { label: 'Location', value: 'SW19', icon: '📍' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <span className="text-lg block mb-0.5">{s.icon}</span>
                    <p className="text-[15px] font-black text-white">{s.value}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Dates bar */}
              <div className="rounded-2xl px-4 py-3 flex items-center justify-between mb-5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>Tournament Dates</p>
                  <p className="text-[15px] font-black text-white">Jun 30 – Jul 13, 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>First Serve</p>
                  <p className="text-[15px] font-black text-white">11:00 BST</p>
                </div>
              </div>

              {/* Countdown (future) */}
              {isFuture && (
                <div>
                  <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Countdown to first serve
                  </p>
                  <Countdown />
                </div>
              )}

              {/* Live status */}
              {isLive && (
                <div className="rounded-2xl p-3.5 text-center"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-[14px] font-black" style={{ color: GREEN }}>
                    🎾 The Championships are LIVE
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Scroll down for live scores and today's order of play
                  </p>
                </div>
              )}
            </div>

            {/* Bottom purple/green bar */}
            <div className="h-0.5" style={{
              background: 'linear-gradient(90deg, #6B21A8, #22C55E, #15803D)'
            }} />
          </div>
        </section>

        {/* Gender filter — appears throughout */}
        <div className="flex gap-2 mb-5">
          {(['All', 'Men', 'Women'] as const).map(g => (
            <button key={g} onClick={() => setActiveGender(g)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                activeGender === g
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={activeGender === g ? { background: GREEN } : {}}>
              {g}
            </button>
          ))}
        </div>

        {/* ═══ LIVE MATCHES ════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <SectionHeader title="🔴 Live Matches" />
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-pulse bg-gray-100" />)}
            </div>
          ) : filterGender(liveMatches).length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-3xl mb-3">🌿</p>
              <p className="font-bold text-gray-900 text-[15px]">
                {isFuture ? 'Matches start June 30' : 'No matches live right now'}
              </p>
              <p className="text-gray-400 text-[13px] mt-1">
                {isFuture
                  ? 'First serve at 11:00 BST on Centre Court'
                  : 'Check the schedule below for upcoming matches'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filterGender(liveMatches).map(m => <MatchRow key={m.match_id} match={m} isLive />)}
            </div>
          )}
        </section>

        {/* ═══ UPCOMING SCHEDULE ═══════════════════════════════════════════════ */}
        <section className="mb-8">
          <SectionHeader
            title="📅 Schedule"
            action={!showAllUpcoming && upcoming.length > 6 ? `See all ${upcoming.length}` : undefined}
            onAction={() => setShowAllUpcoming(true)}
          />
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-gray-100" />)}
            </div>
          ) : visibleUpcoming.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-gray-400 text-[13px]">No upcoming matches found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleUpcoming.map((m, i) => <UpcomingRow key={i} match={m} />)}
              {!showAllUpcoming && filterGender(upcoming).length > 6 && (
                <button onClick={() => setShowAllUpcoming(true)}
                  className="w-full py-3 text-[13px] font-bold rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600 transition-all">
                  Show {filterGender(upcoming).length - 6} more matches
                </button>
              )}
            </div>
          )}
        </section>

        {/* ═══ FULL DRAW ═══════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <SectionHeader title="🏆 Official Draw" />

          {/* Gender + Round selectors */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {(['men', 'women'] as const).map(g => (
              <button key={g} onClick={() => { setDrawGender(g); setDrawRound('R1') }}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold capitalize transition-all ${
                  drawGender === g ? 'text-white' : 'bg-gray-100 text-gray-500'
                }`}
                style={drawGender === g ? { background: GREEN } : {}}>
                {g === 'men' ? "Men's" : "Women's"}
              </button>
            ))}
          </div>

          {/* Round tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {['R1','R2','R3','R4','QF','SF','F'].map(rnd => {
              const hasData = !!draw[rnd]?.length
              return (
                <button key={rnd} onClick={() => hasData && setDrawRound(rnd)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex-shrink-0 transition-all ${
                    drawRound === rnd
                      ? 'text-white shadow-sm'
                      : hasData
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-default'
                  }`}
                  style={drawRound === rnd ? { background: GREEN } : {}}>
                  {rnd === 'R1' ? 'Round 1' : rnd === 'R2' ? 'Round 2' : rnd === 'R3' ? 'Round 3' :
                   rnd === 'R4' ? 'Round 4' : rnd === 'QF' ? 'Quarter-Final' :
                   rnd === 'SF' ? 'Semi-Final' : 'Final'}
                  {hasData && <span className="ml-1.5 text-[10px] opacity-60">({draw[rnd].length})</span>}
                </button>
              )
            })}
          </div>

          {/* Match list */}
          {loadingDraw ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse bg-gray-100" />)}
            </div>
          ) : !draw[drawRound]?.length ? (
            <div className="card p-6 text-center">
              <p className="text-2xl mb-2">⏳</p>
              <p className="font-bold text-gray-900 text-[14px]">
                {drawRound === 'R1' ? 'Draw loading...' : 'Matches TBD'}
              </p>
              <p className="text-gray-400 text-[12px] mt-1">
                {drawRound === 'R1'
                  ? 'Full draw available from June 29'
                  : `${drawRound} matchups decided after previous round`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {draw[drawRound].map((m: any, i: number) => {
                const p1won = m.winner === 'First Player'
                const p2won = m.winner === 'Second Player'
                const done = m.status === 'Finished'
                return (
                  <Link key={m.match_id || i} href={done ? `/matches/${m.match_id}` : '#'}>
                    <div className={`card px-4 py-3 flex items-center gap-3 cursor-pointer transition-all ${done ? 'card-glow' : ''}`}>
                      {/* Player 1 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {m.player1_img && (
                            <img src={m.player1_img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0"
                              onError={e => e.currentTarget.style.display='none'} />
                          )}
                          <span className={`text-[14px] font-bold truncate ${p1won ? 'text-gray-900' : done ? 'text-gray-400' : 'text-gray-900'}`}>
                            {p1won && <span className="text-[#22C55E] mr-1">✓</span>}{m.player1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.player2_img && (
                            <img src={m.player2_img} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0"
                              onError={e => e.currentTarget.style.display='none'} />
                          )}
                          <span className={`text-[14px] font-bold truncate ${p2won ? 'text-gray-900' : done ? 'text-gray-400' : 'text-gray-700'}`}>
                            {p2won && <span className="text-[#22C55E] mr-1">✓</span>}{m.player2}
                          </span>
                        </div>
                      </div>

                      {/* Score / Status */}
                      <div className="text-right flex-shrink-0">
                        {done && m.score ? (
                          <span className="text-[13px] font-bold text-gray-900 tabular-nums">{m.score}</span>
                        ) : (
                          <div>
                            <p className="text-[12px] font-bold" style={{ color: GREEN }}>{m.time || 'TBD'}</p>
                            <p className="text-[10px] text-gray-400">{m.date || 'Jun 29'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ═══ TOP PLAYERS ══════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <SectionHeader title="⭐ Top Seeds" />
          <div className="space-y-2.5">
            {SEEDS.map(s => <SeedCard key={s.key} s={s} />)}
          </div>
        </section>

        {/* ═══ LOUNGE CTA ══════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <Link href="/lounges">
            <div className="card p-5 flex items-center gap-4 cursor-pointer hover:border-purple-200 transition-all"
              style={{ background: '#FAFAFF' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: '#EDE9FE' }}>
                💬
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-black text-gray-900">Wimbledon Lounge</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Chat live with tennis fans · Share predictions</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </Link>
        </section>

        {/* Green bottom bar */}
        <div className="h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${GREEN}, #15803D)` }} />
      </main>
    </div>
  )
}
