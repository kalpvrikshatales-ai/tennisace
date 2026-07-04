import Link from 'next/link'
import type { Metadata } from 'next'
import type { Match } from '@/types'
import { parseMatchSlug } from '@/lib/matchSlug'
import ShareButton from './ShareButton'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

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

async function fetchMatchBySlug(slug: string): Promise<Match | null> {
  const { p1Slug, p2Slug } = parseMatchSlug(slug)

  async function attempt(): Promise<Match | null> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 15_000)
    try {
      const res = await fetch(`${BACKEND}/matches/live`, {
        signal: controller.signal,
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

  // Wait 2s then retry once — handles Render cold start
  await new Promise<void>(r => setTimeout(r, 2000))
  return attempt()
}

// Metadata works from slug alone — no backend call needed
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { p1Slug, p2Slug, tournamentSlug, year } = parseMatchSlug(params.slug)
  const p1Name = displayName(p1Slug)
  const p2Name = displayName(p2Slug)
  const tournamentName = displayName(tournamentSlug)

  const title = `${p1Name} vs ${p2Name} — ${tournamentName} ${year} | TennisAce`
  const description = `Live score and match details: ${p1Name} vs ${p2Name} at ${tournamentName} ${year}. Real-time tennis scores on TennisAce.`

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
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function MatchPage({ params }: { params: { slug: string } }) {
  const { p1Slug, p2Slug, tournamentSlug, year } = parseMatchSlug(params.slug)
  const p1Name = displayName(p1Slug)
  const p2Name = displayName(p2Slug)
  const tournamentName = displayName(tournamentSlug)

  const match = await fetchMatchBySlug(params.slug)

  // Backend cold or match not yet in live feed — render indexable loading state
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
    match.status === 'In Progress' || match.status === 'live' || match.status === '1' ||
    (match.status || '').startsWith('Set')
  const isFinished = match.status === 'Finished' || match.status === 'After Penalties'

  const rawDate = (match as any).date as string | undefined
  const rawTime = (match as any).time as string | undefined
  const surface = (match as any).surface as string | undefined
  const round = (match as any).round as string | undefined

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
      name: match.player1,
      img: match.player1_img,
      key: match.player1_key,
      setsWon: p1SetsWon,
      idx: 1,
      gameScore: (match as any).game_p1 ?? '',
    },
    {
      name: match.player2,
      img: match.player2_img,
      key: match.player2_key,
      setsWon: p2SetsWon,
      idx: 2,
      gameScore: (match as any).game_p2 ?? '',
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
              {rawDate ? `${rawDate}${rawTime ? ` · ${rawTime}` : ''}` : 'Scheduled'}
            </span>
          )}
          {surface && (
            <span className="text-xs text-gray-400 font-medium">{surface}</span>
          )}
          <div className="ml-auto">
            <ShareButton />
          </div>
        </div>

        {/* Match card */}
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
              {match.tournament}
              {round ? ` · ${round}` : ''}
            </p>

            <div className="space-y-1">
              {players.map((p, rowIdx) => {
                const opponent = players[rowIdx === 0 ? 1 : 0]
                const isWinning = p.setsWon > opponent.setsWon

                return (
                  <div key={rowIdx} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 flex-shrink-0">
                      {p.img ? (
                        <img
                          src={p.img}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-400">{p.name[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {p.key ? (
                        <Link href={`/players/${p.key}`} className="hover:underline">
                          <span
                            className={`text-base truncate block ${
                              isWinning
                                ? 'font-black text-gray-900'
                                : isFinished
                                ? 'font-medium text-gray-400'
                                : 'font-semibold text-gray-800'
                            }`}
                          >
                            {p.name}
                          </span>
                        </Link>
                      ) : (
                        <span
                          className={`text-base truncate block ${
                            isWinning
                              ? 'font-black text-gray-900'
                              : isFinished
                              ? 'font-medium text-gray-400'
                              : 'font-semibold text-gray-800'
                          }`}
                        >
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
                          <span
                            key={si}
                            className={`text-xl tabular-nums min-w-[24px] text-right ${
                              iWonSet ? 'font-black text-gray-900' : 'font-medium text-gray-300'
                            }`}
                          >
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
                {isLive && (
                  <span className="text-[9px] text-gray-400 uppercase min-w-[24px] text-center">
                    Pts
                  </span>
                )}
                {setsRaw.map((_, si) => (
                  <span key={si} className="text-[9px] text-gray-400 uppercase min-w-[24px] text-right">
                    S{si + 1}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← All matches
        </Link>
      </div>
    </>
  )
}
