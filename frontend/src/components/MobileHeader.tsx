'use client'

import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { useSidebar } from './SidebarContext'
import type { HomeTab } from './SidebarContext'

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
      {active && <circle cx="19" cy="5" r="3.5" fill="#00C875" stroke="none" />}
    </svg>
  )
}

// Rankings hidden on mobile — users find it via the sidebar
const MOBILE_TABS: { key: HomeTab; label: string; icon: string }[] = [
  { key: 'matches',    label: 'Matches', icon: '🎾' },
  { key: 'news',       label: 'News',    icon: '📰' },
  { key: 'tournament', label: 'US Open', icon: '🏆' },
]

export default function MobileHeader() {
  const { homeTab, setHomeTab, openDrawer, searchOpen, setSearchOpen, notifOn, setNotifOn } = useSidebar()
  const activeTab = homeTab === 'home' ? 'matches' : homeTab

  return (
    <header
      className="md:hidden sticky top-0 z-40"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
        {/* Hamburger */}
        <button
          onClick={openDrawer}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex-1 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="TennisAce" className="h-7 w-7 rounded-xl object-cover flex-shrink-0" />
          <span className="text-[18px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Tennis<span style={{ color: '#00C875' }}>Ace</span>
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <ThemeToggle />
          <button
            onClick={() => setNotifOn(!notifOn)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ color: notifOn ? '#00C875' : 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <BellIcon active={notifOn} />
          </button>
        </div>
      </div>

      {/* Tab pills — Rankings hidden on mobile */}
      <div
        className="flex overflow-x-auto scrollbar-hide gap-2 px-4 pb-2 pt-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {MOBILE_TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setHomeTab(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
              activeTab === key
                ? 'bg-[#00C875] text-white'
                : 'text-gray-500'
            }`}
            style={activeTab !== key ? { background: 'var(--surface-2)' } : {}}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
