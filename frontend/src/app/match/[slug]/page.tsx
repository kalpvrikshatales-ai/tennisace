import Link from 'next/link'
import type { Metadata } from 'next'
import type { Match } from '@/types'
import { parseMatchSlug } from '@/lib/matchSlug'
import ShareButton from './ShareButton'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

// ─── helpers ────────────────────────────────────────────────────────────────

function displayName(slugPart: string): string {
  return slugPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function slugifyLastName(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function matchesSlug(match: Match, p1Slug: string, p2Slug: string): boolean {
  const m1 = slugifyLastName(match.player1)
  const m2 = slugifyLastName(match.player2)
  return (m1 === p1Slug && m2 === p2Slug) || (m1 === p2Slug && m2 === p1Slug)
}

function didWin(match: any, playerKey: number): boolean {
  const isP1 = parseInt(match.player1_key) === playerKey
  const winner: string = match.winner ?? ''
  return (winner === 'First Player' && isP1) || (winner === 'Second Player' && !isP1)
}

// ─── fetch: live matches (15 s + 1 retry) ───────────────────────────────────

async function tryLive(slug: string): Promise<Match | null> {
  const { p1Slug, p2Slug } = parseMatchSlug(slug)

  async function attempt(): Promise<Match | null> {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), 15_000)
    try {
      const res = await fetch(`${BACKEND}/matches/live`, {
        signal: ctrl.signal,
        next: { revalidate: 30 },
      })
      clearTimeout(id)
      if (!res.ok) return null
      const data = await res.json()
      const matches: Match[] = data.matches ?? []
      return matches.find(m => matchesSlug(m, p1Slug, p2Slug)) ?? null
    } catch {
      clearTimeout(id)
      return null
    }
  }

  const first = await attempt()
  if (first) return first
  await new Promise<void>(r => setTimeout(r, 2000))
  return attempt()
}

// ─── fetch: upcoming fixtures (10 s, no retry) ──────────────────────────────

async function tryFixtures(slug: string): Promise<Match | null> {
  const { p1Slug, p2Slug } = parseMatchSlug(slug)
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(`${BACKEND}/feed/fixtures?days=7&limit=100`, {
      signal: ctrl.signal,
      next: { revalidate: 60 },
    })
    clearTimeout(id)
    if (!res.ok) return null
    const data = await res.json()
    const fixtures: Match[] = data.fixtures ?? []
    return fixtures.find(m => matchesSlug(m, p1Slug, p2Slug)) ?? null
  } catch {
    clearTimeout(id)
    return null
  }
}

// ─── fetch: H2H ─────────────────────────────────────────────────────────────

interface H2HData { p1Wins: number; p2Wins: number; total: number }

async function fetchH2H(p1Key: number, p2Key: number): Promise<H2HData | null> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 8_000)
  try {
    const res = await fetch(`${BACKEND}/players/${p1Key}/h2h/${p2Key}`, {
      signal: ctrl.signal,
      next: { revalidate: 3600 },
    })
    clearTimeout(id)
    if (!res.ok) return null
    const raw = await res.json()
    if (!raw || typeof raw !== 'object') return null

    // Try direct win count fields (multiple naming conventions)
    let p1Wins =
      parseInt(raw.player_one_wins ?? raw.FirstPlayerWins ?? raw.first_player_wins ?? '') || 0
    let p2Wins =
      parseInt(raw.player_two_wins ?? raw.SecondPlayerWins ?? raw.second_player_wins ?? '') || 0

    // Fallback: count from events array
    if (p1Wins + p2Wins === 0) {
      const events: any[] = raw.events ?? raw.meets ?? raw.matches ?? []
      for (const e of events) {
        const winner = e.event_winner ?? e.winner ?? ''
        const fp = parseInt(e.first_player_key ?? e.player1_key ?? '')
        const isP1Match = fp === p1Key
        if ((winner === 'First Player' && isP1Match) || (winner === 'Second Player' && !isP1Match)) p1Wins++
        else p2Wins++
      }
    }

    const total = p1Wins + p2Wins
    return total > 0 ? { p1Wins, p2Wins, total } : null
  } catch {
    clearTimeout(id)
    return null
  }
}

// ─── fetch: player form + surface stats ─────────────────────────────────────

interface PlayerPreview {
  streak: string[]      // e.g. ["W","L","W","W","L"]
  winPct: number        // overall last-10 %
  surfaceWins: number
  surfaceLosses: number
}

async function fetchPlayerPreview(
  playerKey: number,
  surface: string,
): Promise<PlayerPreview | null> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(`${BACKEND}/players/${playerKey}`, {
      signal: ctrl.signal,
      next: { revalidate: 3600 },
    })
    clearTimeout(id)
    if (!res.ok) return null
    const data = await res.json()

    const form = data.form
    const streak: string[] = form?.streak?.slice(0, 5) ?? []
    const winPct: number = form?.win_pct ?? 0

    // Surface stats from recent_matches
    const recent: any[] = data.recent_matches ?? []
    const surfMatches = recent.filter(
      m => (m.surface ?? '').toLowerCase() === (surface ?? '').toLowerCase(),
    )
    let surfaceWins = 0
    let surfaceLosses = 0
    for (const m of surfMatches) {
      if (didWin(m, playerKey)) surfaceWins++
      else surfaceLosses++
    }

    return { streak, winPct, surfaceWins, surfaceLosses }
  } catch {
    clearTimeout(id)
    return null
  }
}

// ─── generateMetadata ────────────────────────────────────────────────────────

async function checkIsInLiveFeed(slug: string): Promise<boolean> {
  const { p1Slug, p2Slug } = parseMatchSlug(slug)
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 5_000)
  try {
    const res = await fetch(`${BACKEND}/matches/live`, {
      signal: ctrl.signal,
      next: { revalidate: 30 },
    })
    clearTimeout(id)
    if (!res.ok) return false
    const data = await res.json()
    const matches: Match[] = data.matches ?? []
    return matches.some(m => matchesSlug(m, p1Slug, p2Slug))
  } catch {
    clearTimeout(id)
    return false
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const { p1Slug, p2Slug, tournamentSlug, year } = parseMatchSlug(params.slug)
  const p1Name = displayName(p1Slug)
  const p2Name = displayName(p2Slug)
  const tournamentName = displayName(tournamentSlug)

  const inLiveFeed = await checkIsInLiveFeed(params.slug)
  const isUpcoming = !inLiveFeed

  const title = isUpcoming
    ? `${p1Name} vs ${p2Name} Preview — ${tournamentName} ${year} | TennisAce`
    : `${p1Name} vs ${p2Name} — ${tournamentName} ${year} | TennisAce`

  const description = isUpcoming
    ? `${p1Name} vs ${p2Name} preview — ${tournamentName} ${year}. Head-to-head record, recent form, and match analysis on TennisAce.`
    : `Live score and match details: ${p1Name} vs ${p2Name} at ${tournamentName} ${year}. Real-time tennis scores on TennisAce.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tennisace.live/match/${params.slug}`,
      type: 'website',
      siteName: 'TennisAce',
    },
    twitter: { card: 'summary', title, description },
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function WLBubble({ letter }: { letter: string }) {
  return (
    <span
      className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black flex-shrink-0 ${
        letter === 'W' ? 'bg-[#00C875] text-black' : 'bg-gray-200 text-gray-500'
      }`}
    >
      {letter}
    </span>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function MatchPage({ params }: { params: { slug: string } }) {
  const { p1Slug, p2Slug, tournamentSlug, year } = parseMatchSlug(params.slug)
  const p1Name = displayName(p1Slug)
  const p2Name = displayName(p2Slug)
  const tournamentName = displayName(tournamentSlug)

  // 1. Try live feed first
  let match = await tryLive(params.slug)
  let isUpcoming = false

  // 2. Fall back to upcoming fixtures
  if (!match) {
    match = await tryFixtures(params.slug)
    if (match) isUpcoming = true
  }

  // 3. Loading state — backend cold or match not found anywhere
  if (!match) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-600">{tournamentName} {year}</span>
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-1">{p1Name} vs {p2Name}</h1>
        <p className="text-sm text-gray-500 mb-6">{tournamentName} {year}</p>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-700 font-semibold mb-1">Match data loading</p>
          <p className="text-sm text-gray-400">Refresh in a few seconds</p>
        </div>
        <div className="mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← All matches
          </Link>
        </div>
      </div>
    )
  }

  const isLive =
    !isUpcoming && (
      match.status === 'In Progress' || match.status === 'live' || match.status === '1' ||
      (match.status || '').startsWith('Set')
    )
  const isFinished =
    !isUpcoming && (match.status === 'Finished' || match.status === 'After Penalties')

  const rawDate = (match as any).date as string | undefined
  const rawTime = (match as any).time as string | undefined
  const surface = (match as any).surface as string | undefined
  const round = (match as any).round as string | undefined

  // ── preview data (upcoming only) ──────────────────────────────────────────
  const p1Key: number | undefined = match.player1_key
  const p2Key: number | undefined = match.player2_key

  let h2h: H2HData | null = null
  let p1Preview: PlayerPreview | null = null
  let p2Preview: PlayerPreview | null = null

  if (isUpcoming && p1Key && p2Key) {
    ;[h2h, p1Preview, p2Preview] = await Promise.all([
      fetchH2H(p1Key, p2Key),
      fetchPlayerPreview(p1Key, surface ?? ''),
      fetchPlayerPreview(p2Key, surface ?? ''),
    ])
  }

  // ── score/set data (live/finished only) ───────────────────────────────────
  const setsRaw: { p1: string; p2: string }[] = (match as any).sets?.length
    ? (match as any).sets
    : match.score
    ? match.score.split(',').map((s: string) => {
        const [a, b] = s.trim().split('-')
        return { p1: a || '0', p2: b || '0' }
      })
    : []

  const setWinner = setsRaw.map(s => {
    const n1 = parseInt(s.p1), n2 = parseInt(s.p2)
    return n1 > n2 ? 1 : n2 > n1 ? 2 : 0
  })
  const p1SetsWon = setWinner.filter(w => w === 1).length
  const p2SetsWon = setWinner.filter(w => w === 2).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.player1} vs ${match.player2}`,
    startDate: rawDate || rawTime,
    eventStatus: isFinished
      ? 'https://schema.org/EventCompleted'
      : 'https://schema.org/EventScheduled',
    location: { '@type': 'Place', name: match.tournament },
    competitor: [
      { '@type': 'SportsTeam', name: match.player1 },
      { '@type': 'SportsTeam', name: match.player2 },
    ],
  }

  const players = [
    {
      name: match.player1, img: match.player1_img, key: match.player1_key,
      setsWon: p1SetsWon, idx: 1, gameScore: (match as any).game_p1 ?? '',
    },
    {
      name: match.player2, img: match.player2_img, key: match.player2_key,
      setsWon: p2SetsWon, idx: 2, gameScore: (match as any).game_p2 ?? '',
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{match.tournament}</span>
        </div>

        {/* Status + share row */}
        <div className="flex items-center gap-2 mb-4">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-black text-[#00C875] bg-black px-2 py-1 rounded tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C875]" />
              LIVE
            </span>
          ) : isFinished ? (
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">
              FINAL
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">
              {rawDate ? `${rawDate}${rawTime ? ` · ${rawTime}` : ''}` : 'Upcoming'}
            </span>
          )}
          {surface && (
            <span className="text-xs text-gray-400 font-medium">{surface}</span>
          )}
          <div className="ml-auto">
            <ShareButton />
          </div>
        </div>

        {/* Score card (live / finished) */}
        {!isUpcoming && (
          <div
            className={`bg-white rounded-xl border overflow-hidden mb-6 ${
              isLive
                ? 'border-[#00C875]/40 shadow-[0_0_0_1px_rgba(0,200,117,0.15)]'
                : 'border-gray-200'
            }`}
          >
            {isLive && <div className="h-[2px] w-full bg-[#00C875]" />}
            <div className="p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                {match.tournament}{round ? ` · ${round}` : ''}
              </p>
              <div className="space-y-1">
                {players.map((p, rowIdx) => {
                  const opponent = players[rowIdx === 0 ? 1 : 0]
                  const isWinning = p.setsWon > opponent.setsWon
                  return (
                    <div key={rowIdx} className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 flex-shrink-0">
                        {p.img ? (
                          <img src={p.img} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-400">{p.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {p.key ? (
                          <Link href={`/players/${p.key}`} className="hover:underline">
                            <span className={`text-base truncate block ${isWinning ? 'font-black text-gray-900' : isFinished ? 'font-medium text-gray-400' : 'font-semibold text-gray-800'}`}>
                              {p.name}
                            </span>
                          </Link>
                        ) : (
                          <span className={`text-base truncate block ${isWinning ? 'font-black text-gray-900' : isFinished ? 'font-medium text-gray-400' : 'font-semibold text-gray-800'}`}>
                            {p.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isLive && (
                          <span className="text-sm font-black tabular-nums text-gray-500 min-w-[24px] text-center">
                            {p.gameScore || '0'}
                          </span>
                        )}
                        {setsRaw.map((s, si) => {
                          const myGames = p.idx === 1 ? parseInt(s.p1) : parseInt(s.p2)
                          const iWonSet = setWinner[si] === p.idx
                          return (
                            <span key={si} className={`text-xl tabular-nums min-w-[24px] text-right ${iWonSet ? 'font-black text-gray-900' : 'font-medium text-gray-300'}`}>
                              {myGames}
                            </span>
                          )
                        })}
                        {setsRaw.length === 0 && (
                          <span className="text-xl text-gray-200 tabular-nums">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {setsRaw.length > 0 && (
                <div className="flex items-center gap-2 justify-end mt-1">
                  {isLive && <span className="text-[9px] text-gray-400 uppercase min-w-[24px] text-center">Pts</span>}
                  {setsRaw.map((_, si) => (
                    <span key={si} className="text-[9px] text-gray-400 uppercase min-w-[24px] text-right">S{si + 1}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview section (upcoming only) */}
        {isUpcoming && (
          <div className="space-y-3 mb-6">

            {/* Match header */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                {match.tournament}{round ? ` · ${round}` : ''}
              </p>
              <div className="flex items-center justify-between gap-4">
                {/* P1 */}
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  {match.player1_img ? (
                    <img src={match.player1_img} alt="" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-base font-black text-gray-400">{match.player1[0]}</span>
                    </div>
                  )}
                  {match.player1_key ? (
                    <Link href={`/players/${match.player1_key}`} className="hover:underline text-center">
                      <span className="text-sm font-black text-gray-900 truncate">{match.player1}</span>
                    </Link>
                  ) : (
                    <span className="text-sm font-black text-gray-900 text-center truncate">{match.player1}</span>
                  )}
                </div>

                {/* VS */}
                <div className="flex-shrink-0 text-center">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">vs</span>
                </div>

                {/* P2 */}
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  {match.player2_img ? (
                    <img src={match.player2_img} alt="" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-base font-black text-gray-400">{match.player2[0]}</span>
                    </div>
                  )}
                  {match.player2_key ? (
                    <Link href={`/players/${match.player2_key}`} className="hover:underline text-center">
                      <span className="text-sm font-black text-gray-900 truncate">{match.player2}</span>
                    </Link>
                  ) : (
                    <span className="text-sm font-black text-gray-900 text-center truncate">{match.player2}</span>
                  )}
                </div>
              </div>
            </div>

            {/* H2H record */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Head to Head</p>
              {h2h ? (
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-3xl font-black text-gray-900">{h2h.p1Wins}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{match.player1.split(' ').pop()}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">{h2h.total} meetings</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-3xl font-black text-gray-900">{h2h.p2Wins}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{match.player2.split(' ').pop()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-3xl font-black text-gray-300">—</p>
                    <p className="text-xs text-gray-300 mt-0.5 truncate">{match.player1.split(' ').pop()}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-bold text-gray-200 uppercase tracking-widest">no data</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-3xl font-black text-gray-300">—</p>
                    <p className="text-xs text-gray-300 mt-0.5 truncate">{match.player2.split(' ').pop()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent form + surface stats — two columns */}
            <div className="grid grid-cols-2 gap-3">

              {/* P1 column */}
              <div className="space-y-3">
                {/* Form */}
                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Recent Form</p>
                  {p1Preview && p1Preview.streak.length > 0 ? (
                    <>
                      <div className="flex gap-1 flex-wrap mb-1.5">
                        {p1Preview.streak.map((l, i) => <WLBubble key={i} letter={l} />)}
                      </div>
                      <p className="text-[11px] text-gray-400">{p1Preview.winPct}% win rate</p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-gray-200">—</p>
                  )}
                </div>

                {/* Surface */}
                {surface && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                      {surface} Record
                    </p>
                    {p1Preview && (p1Preview.surfaceWins + p1Preview.surfaceLosses) > 0 ? (
                      <>
                        <p className="text-xl font-black text-gray-900">
                          {p1Preview.surfaceWins}W {p1Preview.surfaceLosses}L
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {Math.round(p1Preview.surfaceWins / (p1Preview.surfaceWins + p1Preview.surfaceLosses) * 100)}%
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-black text-gray-200">—</p>
                    )}
                  </div>
                )}
              </div>

              {/* P2 column */}
              <div className="space-y-3">
                {/* Form */}
                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Recent Form</p>
                  {p2Preview && p2Preview.streak.length > 0 ? (
                    <>
                      <div className="flex gap-1 flex-wrap mb-1.5">
                        {p2Preview.streak.map((l, i) => <WLBubble key={i} letter={l} />)}
                      </div>
                      <p className="text-[11px] text-gray-400">{p2Preview.winPct}% win rate</p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-gray-200">—</p>
                  )}
                </div>

                {/* Surface */}
                {surface && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                      {surface} Record
                    </p>
                    {p2Preview && (p2Preview.surfaceWins + p2Preview.surfaceLosses) > 0 ? (
                      <>
                        <p className="text-xl font-black text-gray-900">
                          {p2Preview.surfaceWins}W {p2Preview.surfaceLosses}L
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {Math.round(p2Preview.surfaceWins / (p2Preview.surfaceWins + p2Preview.surfaceLosses) * 100)}%
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-black text-gray-200">—</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← All matches
        </Link>
      </div>
    </>
  )
}
