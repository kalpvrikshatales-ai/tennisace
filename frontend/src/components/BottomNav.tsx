'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = 'live' | 'results' | 'upcoming' | 'tournaments' | 'rankings' | 'news'

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
  liveCount: number
}

// Icon components
const LiveIcon = (active: boolean) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" fill={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.35} />
    <circle cx="12" cy="12" r="9" stroke={active ? '#00C875' : 'currentColor'} strokeWidth="1.5" opacity={active ? 0.35 : 0.15} />
  </svg>
)
const ResultsIcon = (active: boolean) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 11l3 3L22 4" opacity={active ? 1 : 0.35} stroke={active ? '#00C875' : 'currentColor'} />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" opacity={active ? 0.6 : 0.2} />
  </svg>
)
const RankingsIcon = (active: boolean) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M18 20V10M12 20V4M6 20v-6" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.35} />
  </svg>
)
const LoungesIcon = (active: boolean) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={active ? '#8B5CF6' : 'currentColor'} opacity={active ? 1 : 0.35} />
  </svg>
)
const NewsIcon = (active: boolean) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a4 4 0 01-4-4V6" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.35} />
    <path d="M10 9h6M10 13h6M10 17h4" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 0.7 : 0.25} />
  </svg>
)
const SparringIcon = (active: boolean) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" stroke={active ? '#39FF14' : 'currentColor'} opacity={active ? 1 : 0.35} />
    <path d="M6.5 6.5 C9 9 15 9 17.5 6.5" stroke={active ? '#39FF14' : 'currentColor'} opacity={active ? 0.8 : 0.25} />
    <path d="M6.5 17.5 C9 15 15 15 17.5 17.5" stroke={active ? '#39FF14' : 'currentColor'} opacity={active ? 0.8 : 0.25} />
    <path d="M4 12 h16" stroke={active ? '#39FF14' : 'currentColor'} opacity={active ? 0.8 : 0.25} />
  </svg>
)

export default function BottomNav({ tab, setTab, liveCount }: Props) {
  const pathname = usePathname()
  const isLounges  = pathname === '/lounges'
  const isSparring = pathname === '/sparring' || pathname.startsWith('/sparring/')

  const tabItems = [
    { key: 'live' as Tab, label: 'Live', icon: LiveIcon },
    { key: 'results' as Tab, label: 'Results', icon: ResultsIcon },
    { key: 'rankings' as Tab, label: 'Rankings', icon: RankingsIcon },
    { key: 'news' as Tab, label: 'News', icon: NewsIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bottom-nav safe-bottom md:hidden">
      <div className="flex items-stretch justify-around px-1 pt-2 pb-2">
        {tabItems.map(({ key, label, icon }) => {
          const active = !isLounges && tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] relative transition-all active:scale-95"
            >
              {/* Active pill background */}
              {active && (
                <span className="absolute inset-x-2 inset-y-0 rounded-2xl bg-[#00C875]/10" />
              )}
              <div className="relative z-10">
                {icon(active)}
                {key === 'live' && liveCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[8px] bg-[#00C875] text-white font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {liveCount > 9 ? '9+' : liveCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-bold z-10 ${active ? 'text-[#00C875]' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          )
        })}

        {/* Sparring */}
        <Link href="/sparring"
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] relative transition-all active:scale-95">
          {isSparring && (
            <span className="absolute inset-x-2 inset-y-0 rounded-2xl bg-[#39FF14]/10" />
          )}
          <div className="relative z-10">{SparringIcon(isSparring)}</div>
          <span className={`text-[11px] font-bold z-10 ${isSparring ? 'text-[#39FF14]' : 'text-gray-400'}`}>
            Sparring
          </span>
        </Link>

        {/* Lounges */}
        <Link href="/lounges"
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] relative transition-all active:scale-95">
          {isLounges && (
            <span className="absolute inset-x-2 inset-y-0 rounded-2xl bg-purple-500/10" />
          )}
          <div className="relative z-10">{LoungesIcon(isLounges)}</div>
          <span className={`text-[11px] font-bold z-10 ${isLounges ? 'text-purple-500' : 'text-gray-400'}`}>
            Lounges
          </span>
        </Link>
      </div>
    </nav>
  )
}
