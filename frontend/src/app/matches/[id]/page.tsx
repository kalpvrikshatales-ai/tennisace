'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getH2H, getMatchDetail } from '@/lib/api-reliable'
import PointByPoint from '@/components/PointByPoint'

const SURFACE_COLOR: Record<string, string> = {
  Grass: '#22C55E', Clay: '#F97316', Hard: '#9CA3AF',
}

const ROUND_DISPLAY: Record<string, string> = {
  'Final': 'Final', 'Semi-Finals': 'Semi-Final', 'Semi-Final': 'Semi-Final',
  'Quarter-Finals': 'QF', 'Quarter-Final': 'QF',
  'Round of 16': 'R16', 'Round of 32': 'R32', 'Round of 64': 'R64', 'Round of 128': 'R128',
  '1/2-finals': 'Semi-Final', '1/4-finals': 'QF', '1/8-finals': 'R16',
  '1/16-finals': 'R32', '1/32-finals': 'R64', '1/64-finals': 'R128',
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', QF: 'QF', SF: 'SF', F: 'Final',
}

function shortRound(raw: string): string {
  if (!raw) return ''
  const parts = raw.split(' - ')
  return ROUND_DISPLAY[parts[0]] ?? ROUND_DISPLAY[parts[parts.length - 1]] ?? parts[parts.length - 1]
}

function formatDate(raw: string): string {
  if (!raw) return ''
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch { return raw }
}

// ── Dual neon/gray stat bar ──────────────────────────────────────
function StatDualBar({
  label, v1, v2, w1 = 0, t1 = 0, w2 = 0, t2 = 0,
}: { label: string; v1: string; v2: string; w1?: number; t1?: number; w2?: number; t2?: number }) {
  if (v1 === '—' && v2 === '—') return null

  let pct1: number
  if (t1 > 0 || t2 > 0) {
    const total = (w1 + w2) || 1
    pct1 = Math.round(w1 / total * 100)
  } else {
    const n1 = parseFloat(v1) || 0
    const n2 = parseFloat(v2) || 0
    const sum = n1 + n2 || 1
    pct1 = Math.round(n1 / sum * 100)
  }

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[13px] font-black text-gray-900 tabular-nums w-20 text-left">{v1}</span>
        <span className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{label}</span>
        <span className="text-[13px] font-black text-gray-900 tabular-nums w-20 text-right">{v2}</span>
      </div>
      <div className="flex h-[3px] rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-l-full transition-all" style={{ width: `${pct1}%`, background: '#00C875' }} />
        <div className="h-full bg-gray-200 transition-all" style={{ width: `${100 - pct1}%` }} />
      </div>
    </div>
  )
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<any>(null)
  const [h2h, setH2h] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'stats' | 'h2h' | 'pbp'>('overview')

  const fetchMatch = useCallback(async () => {
    try {
      const data = await getMatchDetail(id)
      if (data?.player1) {
        setMatch(data)
        if (data.player1_key && data.player2_key) {
          const hData = await getH2H(data.player1_key.toString(), data.player2_key.toString())
          setH2h(hData.H2H ?? [])
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    fetchMatch()
    const iv = setInterval(fetchMatch, 30_000)
    return () => clearInterval(iv)
  }, [fetchMatch])

  if (loading) return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        </div>
      </header>
      <div className="h-48 bg-black" />
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {[48, 32, 24].map(h => (
          <div key={h} className={`h-${h === 48 ? 48 : h === 32 ? 32 : 24} rounded-xl animate-pulse bg-gray-100`} />
        ))}
      </div>
    </div>
  )

  if (!match) return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        </div>
      </header>
      <div className="text-center py-24 px-4">
        <p className="text-4xl mb-3">🎾</p>
        <p className="font-bold text-gray-900 text-[15px]">Match data unavailable</p>
        <p className="text-gray-400 text-sm mt-1">This match may be too old or not yet indexed.</p>
        <button onClick={() => router.back()} className="mt-5 text-[#00C875] text-sm font-semibold">← Go back</button>
      </div>
    </div>
  )

  // ── Derived state ─────────────────────────────────────────────
  const isLive = match.status === 'In Progress' || match.status === '1'
    || (match.status || '').startsWith('Set')
  const isFinished = match.status === 'Finished' || match.status === 'After Penalties'
  const serving1 = match.serve === 'First Player' || match.serve === '1'
  const serving2 = match.serve === 'Second Player' || match.serve === '2'
  const surface   = match.surface as string | undefined
  const surfColor = SURFACE_COLOR[surface || 'Hard'] || SURFACE_COLOR.Hard
  const scores: string[] = match.score ? match.score.split(',').map((s: string) => s.trim()) : []
  const stats: any[] = match.statistics || []
  const pbp: any[] = match.point_by_point || []
  const roundLabel = match.round ? shortRound(match.round) : ''
  const k1: number = match.player1_key
  const k2: number = match.player2_key

  // H2H summary
  let h2hWins1 = 0, h2hWins2 = 0
  for (const m of h2h) {
    if (m.event_winner === 'First Player') h2hWins1++; else h2hWins2++
  }

  // Stats helpers
  const sv  = (key: number, name: string) =>
    stats.find(s => s.player_key === key && s.stat_name === name)?.stat_value ?? '—'
  const sw  = (key: number, name: string) =>
    parseInt(stats.find(s => s.player_key === key && s.stat_name === name)?.stat_won  || '0')
  const st  = (key: number, name: string) =>
    parseInt(stats.find(s => s.player_key === key && s.stat_name === name)?.stat_total || '0')
  const fmt = (key: number, name: string) => {
    const w = sw(key, name), t = st(key, name)
    if (t > 0) return `${w}/${t}`
    return sv(key, name)
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'stats'    as const, label: 'Stats',   disabled: stats.length === 0 },
    { key: 'h2h'      as const, label: h2h.length > 0 ? `H2H (${h2h.length})` : 'H2H' },
    { key: 'pbp'      as const, label: 'P×P',     disabled: pbp.length === 0 },
  ]

  const players = [
    { name: match.player1, img: match.player1_img, pkey: match.player1_key, serving: serving1, idx: 1, gameScore: match.game_score?.split('-')[0] ?? '' },
    { name: match.player2, img: match.player2_img, pkey: match.player2_key, serving: serving2, idx: 2, gameScore: match.game_score?.split('-')[1] ?? '' },
  ]

  return (
    <div className="min-h-screen">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-700 truncate">
              {match.tournament}{roundLabel ? ` · ${roundLabel}` : ''}
            </p>
          </div>
          {isLive && (
            <span className="flex items-center gap-1.5 text-[11px] font-black text-[#00C875] flex-shrink-0 tracking-wide">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00C875] inline-block" />
              LIVE
            </span>
          )}
        </div>
      </header>

      {/* ── Hero (black) ──────────────────────────────────────── */}
      <div className="bg-black">
        {/* Top stripe — neon for live, surface color otherwise */}
        <div className="h-0.5 w-full" style={{ background: isLive ? '#00C875' : surfColor }} />

        <div className="max-w-2xl mx-auto px-5 pt-4 pb-5">

          {/* Tournament / round / surface / status row */}
          <div className="flex items-start justify-between mb-5 gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                {match.tournament}
              </span>
              {roundLabel && (
                <span className="text-[11px] text-white/25 font-semibold">· {roundLabel}</span>
              )}
              {surface && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${surfColor}22`, color: surfColor }}>
                  {surface}
                </span>
              )}
              {match.court && (
                <span className="text-[9px] text-white/25 font-semibold">{match.court}</span>
              )}
            </div>
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[11px] font-black tracking-wider flex-shrink-0"
                style={{ color: '#00C875' }}>
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00C875] inline-block" />
                {(match.status || '').startsWith('Set') ? match.status : 'LIVE'}
              </span>
            ) : isFinished ? (
              <span className="text-[11px] font-semibold text-white/30 flex-shrink-0">
                {formatDate(match.date)}
              </span>
            ) : match.date ? (
              <span className="text-[11px] font-semibold text-white/30 flex-shrink-0">
                {formatDate(match.date)}{match.time ? ` · ${match.time}` : ''}
              </span>
            ) : null}
          </div>

          {/* Player rows */}
          <div className="space-y-4">
            {players.map((p, rowIdx) => {
              const setData = scores.map(s => {
                const [a, b] = s.split('-').map(Number)
                return rowIdx === 0 ? { me: a, opp: b } : { me: b, opp: a }
              })
              const setsWon = setData.filter(s => s.me > s.opp).length
              const setsLost = setData.filter(s => s.opp > s.me).length
              const isWinning = isFinished
                ? setsWon > setsLost
                : setsWon >= setsLost

              return (
                <div key={rowIdx} className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-white/8 flex-shrink-0 ring-1 ring-white/10">
                    {p.img ? (
                      <img src={p.img} alt="" className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[14px] font-black text-white/30">{p.name[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <Link href={p.pkey ? `/players/${p.pkey}` : '#'}
                      className="block group">
                      <p className={`text-[18px] font-black leading-tight tracking-tight truncate transition-colors group-hover:text-[#00C875] ${
                        isFinished
                          ? isWinning ? 'text-white' : 'text-white/35'
                          : isWinning ? 'text-white' : 'text-white/70'
                      }`}>
                        {p.name}
                      </p>
                    </Link>
                    {p.serving && isLive && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C875] inline-block" />
                        <span className="text-[9px] text-[#00C875] font-bold uppercase tracking-wider">Serving</span>
                      </div>
                    )}
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Game score (live only) */}
                    {isLive && (
                      <span className={`text-[15px] font-black tabular-nums min-w-[32px] text-center rounded-lg px-2 py-1 ${
                        p.serving ? 'bg-white text-black' : 'text-white/30'
                      }`}>
                        {p.gameScore || '0'}
                      </span>
                    )}
                    {/* Set scores */}
                    <div className="flex items-center gap-3">
                      {setData.map((s, si) => (
                        <span key={si} className={`text-[26px] font-black tabular-nums w-7 text-right leading-none ${
                          s.me > s.opp
                            ? 'text-white'
                            : isFinished ? 'text-white/25' : 'text-white/50'
                        }`}>
                          {s.me}
                        </span>
                      ))}
                      {setData.length === 0 && (
                        <span className="text-[20px] text-white/15 w-7 text-right">–</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Column labels */}
          {(scores.length > 0 || isLive) && (
            <div className="flex items-center justify-end gap-3 mt-2">
              {isLive && (
                <span className="text-[8px] text-white/20 uppercase font-bold min-w-[32px] text-center">Pts</span>
              )}
              {scores.map((_, i) => (
                <span key={i} className="text-[8px] text-white/20 uppercase font-bold w-7 text-right">S{i + 1}</span>
              ))}
            </div>
          )}

          {/* Duration footer */}
          {(match.duration || match.time) && (
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/8">
              {match.duration && (
                <span className="text-[11px] text-white/30 font-semibold">⏱ {match.duration}</span>
              )}
              {isLive && match.time && (
                <span className="text-[11px] text-white/30 font-semibold">Started {match.time}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky tab bar ────────────────────────────────────── */}
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => !t.disabled && setTab(t.key)}
              disabled={t.disabled}
              className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-all ${
                tab === t.key
                  ? 'border-[#00C875] text-gray-900'
                  : t.disabled
                  ? 'border-transparent text-gray-200 cursor-default'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-nav">

        {/* ── OVERVIEW ─────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Player cards */}
            <div className="grid grid-cols-2 gap-3">
              {players.map(p => (
                <Link key={p.idx} href={p.pkey ? `/players/${p.pkey}` : '#'}>
                  <div className="card p-4 flex flex-col items-center text-center gap-2.5 card-glow cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {p.img ? (
                        <img src={p.img} alt="" className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-black text-gray-200">{p.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-gray-900 leading-tight">{p.name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#00C875]">View profile →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Match metadata */}
            <div className="card p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Match Info</p>
              {[
                { label: 'Tournament', value: match.tournament },
                { label: 'Round',      value: match.round },
                { label: 'Surface',    value: surface },
                { label: 'Court',      value: match.court },
                { label: 'Date',       value: match.date ? formatDate(match.date) : null },
                { label: 'Time',       value: match.time },
                { label: 'Duration',   value: match.duration },
                { label: 'Status',     value: isLive ? match.status : isFinished ? 'Completed' : 'Upcoming' },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-[13px] text-gray-400 font-medium">{r.label}</span>
                  <span className="text-[13px] font-bold text-gray-900">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STATS ────────────────────────────── */}
        {tab === 'stats' && (
          stats.length === 0 || !k1 || !k2 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-gray-500 text-sm">Stats not available for this match</p>
            </div>
          ) : (() => {
            const statRows = [
              { label: 'Aces',             v1: sv(k1,'Aces'),                          v2: sv(k2,'Aces'),                         w1: parseInt(sv(k1,'Aces'))||0,              t1: 0, w2: parseInt(sv(k2,'Aces'))||0,              t2: 0 },
              { label: 'Double Faults',    v1: sv(k1,'Double Faults'),                  v2: sv(k2,'Double Faults'),                w1: parseInt(sv(k1,'Double Faults'))||0,     t1: 0, w2: parseInt(sv(k2,'Double Faults'))||0,     t2: 0 },
              { label: '1st Serve %',      v1: sv(k1,'1st serve percentage'),           v2: sv(k2,'1st serve percentage'),         w1: 0, t1: 0, w2: 0, t2: 0 },
              { label: '1st Serve Won',    v1: fmt(k1,'1st serve points won'),          v2: fmt(k2,'1st serve points won'),        w1: sw(k1,'1st serve points won'),           t1: st(k1,'1st serve points won'),           w2: sw(k2,'1st serve points won'),           t2: st(k2,'1st serve points won')           },
              { label: '2nd Serve Won',    v1: fmt(k1,'2nd serve points won'),          v2: fmt(k2,'2nd serve points won'),        w1: sw(k1,'2nd serve points won'),           t1: st(k1,'2nd serve points won'),           w2: sw(k2,'2nd serve points won'),           t2: st(k2,'2nd serve points won')           },
              { label: 'Break Pts Won',    v1: fmt(k1,'Break Points Converted'),        v2: fmt(k2,'Break Points Converted'),      w1: sw(k1,'Break Points Converted'),         t1: st(k1,'Break Points Converted'),         w2: sw(k2,'Break Points Converted'),         t2: st(k2,'Break Points Converted')         },
              { label: 'Break Pts Saved',  v1: fmt(k1,'Break Points Saved'),            v2: fmt(k2,'Break Points Saved'),          w1: sw(k1,'Break Points Saved'),             t1: st(k1,'Break Points Saved'),             w2: sw(k2,'Break Points Saved'),             t2: st(k2,'Break Points Saved')             },
              { label: 'Winners',          v1: sv(k1,'Winners'),                        v2: sv(k2,'Winners'),                      w1: parseInt(sv(k1,'Winners'))||0,           t1: 0, w2: parseInt(sv(k2,'Winners'))||0,           t2: 0 },
              { label: 'Unforced Errors',  v1: sv(k1,'Unforced errors'),               v2: sv(k2,'Unforced errors'),              w1: parseInt(sv(k1,'Unforced errors'))||0,   t1: 0, w2: parseInt(sv(k2,'Unforced errors'))||0,   t2: 0 },
              { label: 'Net Points Won',   v1: fmt(k1,'Net points won'),               v2: fmt(k2,'Net points won'),              w1: sw(k1,'Net points won'),                 t1: st(k1,'Net points won'),                 w2: sw(k2,'Net points won'),                 t2: st(k2,'Net points won')                 },
              { label: 'Service Pts Won',  v1: fmt(k1,'Service Points Won'),           v2: fmt(k2,'Service Points Won'),          w1: sw(k1,'Service Points Won'),             t1: st(k1,'Service Points Won'),             w2: sw(k2,'Service Points Won'),             t2: st(k2,'Service Points Won')             },
              { label: 'Return Pts Won',   v1: fmt(k1,'Return Points Won'),             v2: fmt(k2,'Return Points Won'),           w1: sw(k1,'Return Points Won'),              t1: st(k1,'Return Points Won'),              w2: sw(k2,'Return Points Won'),              t2: st(k2,'Return Points Won')              },
              { label: 'Total Pts Won',    v1: fmt(k1,'Total Points Won'),             v2: fmt(k2,'Total Points Won'),            w1: sw(k1,'Total Points Won'),               t1: st(k1,'Total Points Won'),               w2: sw(k2,'Total Points Won'),               t2: st(k2,'Total Points Won')               },
            ].filter(r => r.v1 !== '—' || r.v2 !== '—')

            return (
              <div className="card px-4 pt-3 pb-1">
                {/* Player name header */}
                <div className="flex items-center mb-1 pb-3 border-b border-gray-100">
                  <span className="text-[12px] font-black text-gray-900 flex-1 text-left truncate">
                    {match.player1.split(' ').slice(-1)[0]}
                  </span>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-4">STAT</span>
                  <span className="text-[12px] font-black text-gray-900 flex-1 text-right truncate">
                    {match.player2.split(' ').slice(-1)[0]}
                  </span>
                </div>
                {statRows.map(r => <StatDualBar key={r.label} {...r} />)}
              </div>
            )
          })()
        )}

        {/* ── H2H ─────────────────────────────── */}
        {tab === 'h2h' && (
          h2h.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🎾</p>
              <p className="text-gray-500 text-sm">No head-to-head history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="card p-5">
                <div className="flex items-center justify-around mb-4">
                  <div className="text-center">
                    <p className="text-[40px] font-black text-gray-900 leading-none">{h2hWins1}</p>
                    <p className="text-[11px] text-gray-400 font-bold mt-1 truncate max-w-[90px]">
                      {match.player1.split(' ').slice(-1)[0]}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">H2H</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{h2h.length} meetings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[40px] font-black text-gray-900 leading-none">{h2hWins2}</p>
                    <p className="text-[11px] text-gray-400 font-bold mt-1 truncate max-w-[90px]">
                      {match.player2.split(' ').slice(-1)[0]}
                    </p>
                  </div>
                </div>
                {/* Win bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-l-full transition-all" style={{
                    width: `${Math.round(h2hWins1 / (h2h.length || 1) * 100)}%`,
                    background: '#00C875',
                  }} />
                  <div className="h-full bg-gray-200" style={{
                    width: `${Math.round(h2hWins2 / (h2h.length || 1) * 100)}%`,
                  }} />
                </div>
              </div>

              {/* Meetings list */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Past {h2h.length} Meetings
              </p>
              <div className="space-y-2">
                {h2h.map((m: any, i: number) => {
                  const p1won = m.event_winner === 'First Player'
                  return (
                    <div key={i} className="card px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-gray-400 font-semibold truncate">
                          {m.tournament_name}{m.tournament_season ? ` ${m.tournament_season}` : ''}
                        </span>
                        <span className="text-[10px] text-gray-300 flex-shrink-0 ml-2">{m.event_date}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-bold flex-1 min-w-0 ${p1won ? 'text-gray-900' : 'text-gray-400'}`}>
                          {m.event_first_player}
                          {p1won && <span className="ml-1 text-[#00C875] text-[11px]">✓</span>}
                        </span>
                        <div className="flex gap-2 flex-shrink-0 px-2">
                          {(m.scores ?? []).map((s: any, j: number) => (
                            <span key={j} className="text-[12px] font-bold text-gray-600 tabular-nums">
                              {s.score_first}–{s.score_second}
                            </span>
                          ))}
                        </div>
                        <span className={`text-[13px] font-bold flex-1 min-w-0 text-right ${!p1won ? 'text-gray-900' : 'text-gray-400'}`}>
                          {!p1won && <span className="mr-1 text-[#00C875] text-[11px]">✓</span>}
                          {m.event_second_player}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}

        {/* ── POINT BY POINT ───────────────────── */}
        {tab === 'pbp' && (
          pbp.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-gray-500 text-sm">Point-by-point data not available for this match</p>
            </div>
          ) : (
            <PointByPoint pbp={pbp} player1={match.player1} player2={match.player2} />
          )
        )}

      </main>
    </div>
  )
}
