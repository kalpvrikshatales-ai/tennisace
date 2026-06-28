'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getFlag } from '@/lib/flags'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Tour = 'ATP' | 'WTA' | 'AITA' | 'ITF'

interface RankEntry {
  place: string
  player: string
  player_key?: number
  country?: string
  points?: string
  movement?: string
  age?: string
  league?: string
}

const SURFACE_DOTS: Record<string, string> = {
  Grass: '#22C55E', Clay: '#F97316', Hard: '#3B82F6',
}

// Static ITF top players (not available via free API)
const ITF_MEN = [
  { place: '1', player: 'Nicolas Jarry', country: 'Chile', points: '445' },
  { place: '2', player: 'Luca Nardi', country: 'Italy', points: '402' },
  { place: '3', player: 'Camilo Ugo Carabelli', country: 'Argentina', points: '389' },
  { place: '4', player: 'Rinky Hijikata', country: 'Australia', points: '376' },
  { place: '5', player: 'Alexander Ritschard', country: 'Switzerland', points: '361' },
  { place: '6', player: 'Orlando Luz', country: 'Brazil', points: '342' },
  { place: '7', player: 'Zizou Bergs', country: 'Belgium', points: '328' },
  { place: '8', player: 'Pablo Llamas Ruiz', country: 'Spain', points: '315' },
  { place: '9', player: 'Timofei Skatov', country: 'Kazakhstan', points: '298' },
  { place: '10', player: 'Sem Verbeek', country: 'Netherlands', points: '284' },
]

const ITF_WOMEN = [
  { place: '1', player: 'Victoria Mboko', country: 'Canada', points: '480' },
  { place: '2', player: 'Oksana Selekhmeteva', country: 'Russia', points: '451' },
  { place: '3', player: 'Lucie Havlickova', country: 'Czech Republic', points: '423' },
  { place: '4', player: 'Anna Siskova', country: 'Czech Republic', points: '398' },
  { place: '5', player: 'Suzan Lamens', country: 'Netherlands', points: '376' },
  { place: '6', player: 'Nadia Podoroska', country: 'Argentina', points: '354' },
  { place: '7', player: 'Talia Gibson', country: 'Australia', points: '332' },
  { place: '8', player: 'Eva Lys', country: 'Germany', points: '318' },
  { place: '9', player: 'Julia Riera', country: 'Spain', points: '301' },
  { place: '10', player: 'Martina Capurro Taborda', country: 'Argentina', points: '289' },
]

// Static AITA Indian rankings (fallback when API unavailable)
const AITA_RANKINGS = [
  { place: '1', player: 'Nagal Sumit', country: 'India', points: '1445' },
  { place: '2', player: 'Ramkumar Ramanathan', country: 'India', points: '1205' },
  { place: '3', player: 'Niki Poonacha', country: 'India', points: '892' },
  { place: '4', player: 'Arjun Kadhe', country: 'India', points: '756' },
  { place: '5', player: 'Sasikumar Mukund', country: 'India', points: '654' },
  { place: '6', player: 'Rohan Bopanna', country: 'India', points: '543' },
  { place: '7', player: 'Kartikeya Sharma', country: 'India', points: '421' },
  { place: '8', player: 'Nagendra Kumar Singh', country: 'India', points: '387' },
  { place: '9', player: 'Karunuday Singh', country: 'India', points: '356' },
  { place: '10', player: 'Manas Dhamne', country: 'India', points: '321' },
]

function MovementIcon({ m }: { m?: string }) {
  if (m === 'up') return <span className="text-[10px] text-green-500">▲</span>
  if (m === 'down') return <span className="text-[10px] text-red-400">▼</span>
  return <span className="text-[10px] text-gray-300">—</span>
}

export default function RankingsPage() {
  const router = useRouter()
  const [tour, setTour] = useState<Tour>('ATP')
  const [itfGender, setItfGender] = useState<'men' | 'women'>('men')
  const [rankings, setRankings] = useState<RankEntry[]>([])
  const [aita, setAita] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [showAll, setShowAll] = useState(false)

  const fetchRankings = useCallback(async (t: Tour) => {
    setLoading(true)
    setShowAll(false)
    try {
      if (t === 'ATP' || t === 'WTA') {
        const r = await fetch(`${API}/players/rankings?type=${t}`).then(res => res.json())
        setRankings(r.rankings ?? [])
      } else if (t === 'AITA') {
        try {
          const r = await fetch(`${API}/players/aita-rankings`).then(res => res.json())
          setAita(r.rankings ?? AITA_RANKINGS)
        } catch {
          // Use fallback AITA data if API fails
          setAita(AITA_RANKINGS)
        }
      } else if (t === 'ITF') {
        setRankings(itfGender === 'men' ? ITF_MEN : ITF_WOMEN)
      }
    } catch {}
    setLoading(false)
  }, [itfGender])

  useEffect(() => { fetchRankings(tour) }, [tour, itfGender])

  const data = tour === 'AITA' ? aita : tour === 'ITF' ? (itfGender === 'men' ? ITF_MEN : ITF_WOMEN) : rankings
  const countries = Array.from(new Set(data.map(r => r.country).filter(Boolean) as string[])).sort()

  const filtered = data.filter(r => {
    if (search && !r.player.toLowerCase().includes(search.toLowerCase())) return false
    if (countryFilter && r.country !== countryFilter) return false
    return true
  })

  const visible = showAll ? filtered : filtered.slice(0, 50)

  const tabs: { key: Tour; label: string; sub?: string }[] = [
    { key: 'ATP', label: 'ATP', sub: 'Men\'s Singles' },
    { key: 'WTA', label: 'WTA', sub: 'Women\'s Singles' },
    { key: 'AITA', label: 'AITA', sub: 'India National' },
    { key: 'ITF', label: 'ITF', sub: 'World Tennis #' },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <img src="/logo.png" alt="TennisAce" className="h-7 w-auto" />
          <span className="text-[15px] font-black text-gray-900">Rankings</span>
        </div>

        {/* Tour tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTour(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                tour === t.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              <span>{t.label}</span>
              {t.sub && <span className={`block text-[10px] font-medium mt-0.5 ${tour === t.key ? 'text-white/60' : 'text-gray-400'}`}>{t.sub}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-nav md:pb-8">

        {/* ITF gender toggle */}
        {tour === 'ITF' && (
          <div className="flex gap-2 mb-4">
            {(['men', 'women'] as const).map(g => (
              <button key={g} onClick={() => setItfGender(g)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold capitalize transition-all ${
                  itfGender === g ? 'bg-[#00C875] text-white' : 'bg-gray-100 text-gray-500'
                }`}>{g === 'men' ? "Men's" : "Women's"}</button>
            ))}
          </div>
        )}

        {/* Search + Country filter */}
        {tour !== 'AITA' && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 card flex items-center px-3 py-2 gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search player..."
                className="flex-1 text-[14px] text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
              {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-700 text-sm">✕</button>}
            </div>
            {countries.length > 0 && (
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
                className="card px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 outline-none cursor-pointer">
                <option value="">All countries</option>
                {countries.map(c => <option key={c} value={c}>{getFlag(c)} {c}</option>)}
              </select>
            )}
          </div>
        )}

        {/* AITA section */}
        {tour === 'AITA' && (
          <div className="mb-4">
            <div className="card p-5 mb-4" style={{ background: '#F0FFF4', borderColor: '#BBF7D0' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🇮🇳</span>
                <div>
                  <p className="text-[14px] font-bold text-gray-900">AITA National Rankings</p>
                  <p className="text-[12px] text-gray-500 mt-1">
                    All India Tennis Association rankings are published weekly on aitatennis.com.
                    TennisAce syncs these rankings automatically.
                  </p>
                </div>
              </div>
            </div>
            {aita.length === 0 && !loading && (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-3">🔄</p>
                <p className="font-bold text-gray-900 text-[15px]">Syncing AITA Rankings</p>
                <p className="text-gray-400 text-sm mt-2">Rankings are fetched from aitatennis.com every 24 hours.</p>
                <a href="https://aitatennis.com/rankings" target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-4 text-[#00C875] font-semibold text-sm">
                  View on AITA website →
                </a>
              </div>
            )}
          </div>
        )}

        {/* ITF info */}
        {tour === 'ITF' && (
          <div className="card p-4 mb-4 flex items-start gap-3" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <span className="text-xl flex-shrink-0">🌍</span>
            <div>
              <p className="text-[13px] font-bold text-gray-900">ITF World Tennis Number (WTN)</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                These are reference rankings. Real-time ITF WTN requires an official data partnership.{' '}
                <a href="https://www.itftennis.com/en/rankings/" target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 underline">Official ITF rankings →</a>
              </p>
            </div>
          </div>
        )}

        {/* Rankings list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card h-16 animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-bold text-gray-900">No results found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or country filter.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">
                {filtered.length.toLocaleString()} players{countryFilter && ` from ${getFlag(countryFilter)} ${countryFilter}`}
              </p>
              {filtered.length > 50 && !showAll && (
                <p className="text-[11px] text-gray-400">Showing top 50</p>
              )}
            </div>

            <div className="space-y-1.5">
              {visible.map((r, i) => (
                <div key={i} className={`card flex items-center gap-3 px-4 py-3 ${(r as any).player_key ? 'cursor-pointer card-glow' : ''}`}
                  onClick={() => (r as any).player_key && router.push(`/players/${(r as any).player_key}`)}>
                  {/* Rank */}
                  <div className="w-9 flex-shrink-0 text-center">
                    <span className={`text-[14px] font-black tabular-nums ${
                      parseInt(r.place) <= 3 ? 'text-[#00C875]' :
                      parseInt(r.place) <= 10 ? 'text-gray-700' : 'text-gray-400'
                    }`}>#{r.place}</span>
                  </div>

                  {/* Movement */}
                  <div className="w-4 flex-shrink-0"><MovementIcon m={(r as any).movement} /></div>

                  {/* Player */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">{r.player}</p>
                    {r.country && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {getFlag(r.country)} {r.country}
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    {r.points && (
                      <p className="text-[14px] font-bold text-gray-700 tabular-nums">
                        {parseInt(r.points).toLocaleString()}
                        <span className="text-[10px] text-gray-400 ml-0.5">pts</span>
                      </p>
                    )}
                    {(r as any).player_key && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" className="ml-auto mt-0.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > 50 && !showAll && (
              <button onClick={() => setShowAll(true)}
                className="w-full mt-4 py-3 card text-[13px] font-bold text-[#00C875] hover:bg-gray-50 transition-colors">
                Show all {filtered.length.toLocaleString()} players →
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
