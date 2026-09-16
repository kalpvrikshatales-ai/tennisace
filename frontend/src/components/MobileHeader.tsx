'use client'

import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import { useSidebar } from './SidebarContext'

export default function MobileHeader() {
  const { openDrawer } = useSidebar()

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
          <Image src="/logo.png" alt="TennisAce" width={32} height={32} priority className="h-8 w-8 rounded-full object-contain flex-shrink-0" />
          <span className="text-[18px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Tennis<span style={{ color: 'var(--accent)' }}>Ace</span>
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
