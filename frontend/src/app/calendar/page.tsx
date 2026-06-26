'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Tour = 'ALL' | 'ATP' | 'WTA' | 'GS'
type Surface = 'ALL' | 'Hard' | 'Clay' | 'Grass'

interface Tournament {
  name: string
  start: string
  end: string
  surface: Surface | string
  category: string
  country: string
  flag: string
  prize?: string
  tour: 'ATP' | 'WTA' | 'GS'
}

const CALENDAR_2026: Tournament[] = [
  // Grand Slams
  { name: 'Australian Open', start: '2026-01-12', end: '2026-01-26', surface: 'Hard', category: 'Grand Slam', country: 'Australia', flag: '🇦🇺', prize: '$86M', tour: 'GS' },
  { name: 'Roland Garros', start: '2026-05-25', end: '2026-06-08', surface: 'Clay', category: 'Grand Slam', country: 'France', flag: '🇫🇷', prize: '$53M', tour: 'GS' },
  { name: 'Wimbledon', start: '2026-06-29', end: '2026-07-13', surface: 'Grass', category: 'Grand Slam', country: 'UK', flag: '🇬🇧', prize: '$50M', tour: 'GS' },
  { name: 'US Open', start: '2026-08-24', end: '2026-09-07', surface: 'Hard', category: 'Grand Slam', country: 'USA', flag: '🇺🇸', prize: '$75M', tour: 'GS' },

  // ATP Masters 1000
  { name: 'Indian Wells Masters', start: '2026-03-05', end: '2026-03-16', surface: 'Hard', category: 'ATP Masters 1000', country: 'USA', flag: '🇺🇸', prize: '$9M', tour: 'ATP' },
  { name: 'Miami Open', start: '2026-03-20', end: '2026-04-01', surface: 'Hard', category: 'ATP Masters 1000', country: 'USA', flag: '🇺🇸', prize: '$9M', tour: 'ATP' },
  { name: 'Monte Carlo Masters', start: '2026-04-07', end: '2026-04-13', surface: 'Clay', category: 'ATP Masters 1000', country: 'Monaco', flag: '🇲🇨', prize: '$6M', tour: 'ATP' },
  { name: 'Madrid Open', start: '2026-04-25', end: '2026-05-04', surface: 'Clay', category: 'ATP Masters 1000', country: 'Spain', flag: '🇪🇸', prize: '$8M', tour: 'ATP' },
  { name: 'Internazionali BNL d\'Italia', start: '2026-05-11', end: '2026-05-18', surface: 'Clay', category: 'ATP Masters 1000', country: 'Italy', flag: '🇮🇹', prize: '$8M', tour: 'ATP' },
  { name: 'Canadian Open', start: '2026-07-27', end: '2026-08-02', surface: 'Hard', category: 'ATP Masters 1000', country: 'Canada', flag: '🇨🇦', prize: '$7M', tour: 'ATP' },
  { name: 'Cincinnati Open', start: '2026-08-10', end: '2026-08-17', surface: 'Hard', category: 'ATP Masters 1000', country: 'USA', flag: '🇺🇸', prize: '$7M', tour: 'ATP' },
  { name: 'Shanghai Masters', start: '2026-10-05', end: '2026-10-12', surface: 'Hard', category: 'ATP Masters 1000', country: 'China', flag: '🇨🇳', prize: '$12M', tour: 'ATP' },
  { name: 'Paris Masters', start: '2026-10-26', end: '2026-11-02', surface: 'Hard', category: 'ATP Masters 1000', country: 'France', flag: '🇫🇷', prize: '$7M', tour: 'ATP' },

  // ATP 500
  { name: 'Rotterdam Open', start: '2026-02-09', end: '2026-02-15', surface: 'Hard', category: 'ATP 500', country: 'Netherlands', flag: '🇳🇱', prize: '$2M', tour: 'ATP' },
  { name: 'Dubai Tennis Championships', start: '2026-02-23', end: '2026-03-01', surface: 'Hard', category: 'ATP 500', country: 'UAE', flag: '🇦🇪', prize: '$3M', tour: 'ATP' },
  { name: 'Barcelona Open', start: '2026-04-20', end: '2026-04-26', surface: 'Clay', category: 'ATP 500', country: 'Spain', flag: '🇪🇸', prize: '$3M', tour: 'ATP' },
  { name: 'Queen\'s Club Championships', start: '2026-06-15', end: '2026-06-21', surface: 'Grass', category: 'ATP 500', country: 'UK', flag: '🇬🇧', prize: '$3M', tour: 'ATP' },
  { name: 'Halle Open', start: '2026-06-15', end: '2026-06-21', surface: 'Grass', category: 'ATP 500', country: 'Germany', flag: '🇩🇪', prize: '$2M', tour: 'ATP' },
  { name: 'Nitto ATP Finals', start: '2026-11-09', end: '2026-11-16', surface: 'Hard', category: 'ATP Finals', country: 'Italy', flag: '🇮🇹', prize: '$15M', tour: 'ATP' },

  // WTA 1000
  { name: 'BNP Paribas Open (WTA)', start: '2026-03-05', end: '2026-03-16', surface: 'Hard', category: 'WTA 1000', country: 'USA', flag: '🇺🇸', prize: '$9M', tour: 'WTA' },
  { name: 'Miami Open (WTA)', start: '2026-03-20', end: '2026-04-01', surface: 'Hard', category: 'WTA 1000', country: 'USA', flag: '🇺🇸', prize: '$9M', tour: 'WTA' },
  { name: 'Madrid Open (WTA)', start: '2026-04-25', end: '2026-05-04', surface: 'Clay', category: 'WTA 1000', country: 'Spain', flag: '🇪🇸', prize: '$8M', tour: 'WTA' },
  { name: 'Internazionali BNL d\'Italia (WTA)', start: '2026-05-11', end: '2026-05-17', surface: 'Clay', category: 'WTA 1000', country: 'Italy', flag: '🇮🇹', prize: '$4M', tour: 'WTA' },
  { name: 'Canadian Open (WTA)', start: '2026-08-03', end: '2026-08-09', surface: 'Hard', category: 'WTA 1000', country: 'Canada', flag: '🇨🇦', prize: '$3M', tour: 'WTA' },
  { name: 'Cincinnati Open (WTA)', start: '2026-08-10', end: '2026-08-16', surface: 'Hard', category: 'WTA 1000', country: 'USA', flag: '🇺🇸', prize: '$3M', tour: 'WTA' },
  { name: 'China Open', start: '2026-09-28', end: '2026-10-05', surface: 'Hard', category: 'WTA 1000', country: 'China', flag: '🇨🇳', prize: '$9M', tour: 'WTA' },
  { name: 'WTA Finals', start: '2026-11-02', end: '2026-11-09', surface: 'Hard', category: 'WTA Finals', country: 'Saudi Arabia', flag: '🇸🇦', prize: '$15M', tour: 'WTA' },
]

const surfaceColor: Record<string, { bg: string; text: string; emoji: string }> = {
  Hard:  { bg: 'bg-blue-500/15',   text: 'text-blue-400',   emoji: '🔵' },
  Clay:  { bg: 'bg-orange-500/15', text: 'text-orange-400', emoji: '🏺' },
  Grass: { bg: 'bg-green-500/15',  text: 'text-green-400',  emoji: '🌿' },
}

const categoryColor: Record<string, string> = {
  'Grand Slam':       'text-amber-400 bg-amber-400/15',
  'ATP Masters 1000': 'text-purple-400 bg-purple-400/15',
  'WTA 1000':         'text-pink-400 bg-pink-400/15',
  'ATP 500':          'text-blue-400 bg-blue-400/15',
  'ATP Finals':       'text-amber-300 bg-amber-300/15',
  'WTA Finals':       'text-amber-300 bg-amber-300/15',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function isUpcoming(t: Tournament) {
  return new Date(t.end) >= new Date()
}

function isLive(t: Tournament) {
  const now = new Date()
  return new Date(t.start) <= now && now <= new Date(t.end)
}

function formatDate(start: string, end: string) {
  const s = new Date(start), e = new Date(end)
  const sm = MONTHS[s.getMonth()], em = MONTHS[e.getMonth()]
  if (sm === em) return `${sm} ${s.getDate()}–${e.getDate()}`
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}`
}

export default function CalendarPage() {
  const router = useRouter()
  const [tour, setTour] = useState<Tour>('ALL')
  const [surface, setSurface] = useState<Surface>('ALL')
  const [showPast, setShowPast] = useState(false)

  const filtered = CALENDAR_2026
    .filter(t => tour === 'ALL' || (tour === 'GS' ? t.tour === 'GS' : t.tour === tour))
    .filter(t => surface === 'ALL' || t.surface === surface)
    .filter(t => showPast || isUpcoming(t))
    .sort((a, b) => a.start.localeCompare(b.start))

  // Group by month
  const byMonth: Record<string, Tournament[]> = {}
  filtered.forEach(t => {
    const month = MONTHS[new Date(t.start).getMonth()] + ' 2026'
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(t)
  })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900/40 hover:text-gray-900 text-sm">← Back</button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-bold">Tennis<span className="text-[#00C875]">Ace</span></h1>
          <span className="text-gray-900/30 text-sm ml-auto">2026 Calendar</span>
        </div>

        {/* Filters */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          {(['ALL','GS','ATP','WTA'] as Tour[]).map(t => (
            <button key={t} onClick={() => setTour(t)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${tour === t ? 'bg-[#00C875] text-[#0B1F3A]' : 'bg-white/[0.06] text-gray-900/50 hover:text-gray-900'}`}>
              {t === 'GS' ? '🏆 Grand Slams' : t === 'ALL' ? 'All' : t}
            </button>
          ))}
          {(['Hard','Clay','Grass'] as Surface[]).map(s => (
            <button key={s} onClick={() => setSurface(surface === s ? 'ALL' : s)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${surface === s ? 'bg-[#00C875] text-[#0B1F3A]' : 'bg-white/[0.06] text-gray-900/50 hover:text-gray-900'}`}>
              {surfaceColor[s]?.emoji} {s}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-nav md:pb-6">
        {Object.entries(byMonth).map(([month, tournaments]) => (
          <div key={month} className="mb-6">
            <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-3 sticky top-[108px] bg-white">{month}</p>
            <div className="space-y-2">
              {tournaments.map((t, i) => {
                const live = isLive(t)
                const upcoming = isUpcoming(t)
                const surf = surfaceColor[t.surface] ?? { bg: 'bg-white/5', text: 'text-gray-900/40', emoji: '🎾' }
                const catColor = categoryColor[t.category] ?? 'text-gray-900/40 bg-white/5'

                return (
                  <div key={i} className={`glass rounded-xl p-4 border transition-all ${live ? 'border-[#00C875]/30' : 'border-gray-200'} ${!upcoming ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {live && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C875] uppercase tracking-widest">
                              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00C875] inline-block" /> Live
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColor}`}>{t.category}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{t.flag} {t.name}</p>
                        <p className="text-[11px] text-gray-900/40 mt-1">{t.country}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-gray-900/50 font-medium">{formatDate(t.start, t.end)}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${surf.bg} ${surf.text}`}>
                          {surf.emoji} {t.surface}
                        </span>
                        {t.prize && <p className="text-[10px] text-[#00C875]/70 mt-1 font-semibold">{t.prize}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowPast(p => !p)}
          className="w-full py-3 text-gray-900/30 text-sm hover:text-gray-900/60 transition-colors"
        >
          {showPast ? '▲ Hide past tournaments' : '▼ Show past tournaments'}
        </button>
      </main>
    </div>
  )
}
