'use client'

type Tab = 'live' | 'results' | 'upcoming' | 'tournaments' | 'rankings'

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
  liveCount: number
}

const tabs: { key: Tab; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    key: 'live',
    label: 'Live',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.4} />
        <circle cx="12" cy="12" r="9" stroke={active ? '#00C875' : 'currentColor'} strokeWidth="1.5" opacity={active ? 0.4 : 0.2} />
      </svg>
    ),
  },
  {
    key: 'results',
    label: 'Results',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 11l3 3L22 4" opacity={active ? 1 : 0.4} stroke={active ? '#00C875' : 'currentColor'} />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" opacity={active ? 0.6 : 0.3} />
      </svg>
    ),
  },
  {
    key: 'upcoming',
    label: 'Schedule',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" opacity={active ? 0.6 : 0.3} stroke={active ? '#00C875' : 'currentColor'} />
        <path d="M16 2v4M8 2v4M3 10h18" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.4} />
      </svg>
    ),
  },
  {
    key: 'tournaments',
    label: 'Events',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.4} />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.4} />
        <path d="M4 22h16M6 9v7a6 6 0 0012 0V9H6z" opacity={active ? 0.6 : 0.3} stroke={active ? '#00C875' : 'currentColor'} />
        <path d="M12 16v-4M10 14h4" opacity={active ? 0.4 : 0.15} stroke={active ? '#00C875' : 'currentColor'} />
      </svg>
    ),
  },
  {
    key: 'rankings',
    label: 'Rankings',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke={active ? '#00C875' : 'currentColor'} opacity={active ? 1 : 0.4} />
      </svg>
    ),
  },
]

export default function BottomNav({ tab, setTab, liveCount }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bottom-nav safe-bottom md:hidden">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative flex-1 transition-all"
          >
            <div className="relative">
              {icon(tab === key)}
              {key === 'live' && liveCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] bg-[#00C875] text-[#0B1F3A] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {liveCount > 9 ? '9+' : liveCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${
              tab === key ? 'text-[#00C875]' : 'text-gray-900/35'
            }`}>
              {label}
            </span>
            {tab === key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#00C875]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
