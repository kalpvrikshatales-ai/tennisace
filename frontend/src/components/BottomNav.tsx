'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

const HomeIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: active ? 'var(--accent)' : 'currentColor' }}>
    <path d="M3 11l9-8 9 8" opacity={active ? 1 : 0.35} />
    <path d="M5 10v10h14V10" opacity={active ? 0.8 : 0.25} />
  </svg>
)
const SparringIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ stroke: active ? 'var(--accent)' : 'currentColor' }}>
    <circle cx="12" cy="12" r="8" opacity={active ? 1 : 0.35} />
    <path d="M6.5 6.5 C9 9 15 9 17.5 6.5" opacity={active ? 0.8 : 0.25} />
    <path d="M6.5 17.5 C9 15 15 15 17.5 17.5" opacity={active ? 0.8 : 0.25} />
    <path d="M4 12 h16" opacity={active ? 0.8 : 0.25} />
  </svg>
)
const PlayIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: active ? 'var(--accent)' : 'currentColor' }}>
    <circle cx="12" cy="12" r="9" opacity={active ? 1 : 0.35} />
    <path d="M10 8.5v7l6-3.5z" fill={active ? 'var(--accent)' : 'currentColor'} opacity={active ? 1 : 0.35} stroke="none" />
  </svg>
)
const CommunityIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: active ? 'var(--accent)' : 'currentColor' }}>
    <circle cx="9" cy="8" r="3" opacity={active ? 1 : 0.35} />
    <path d="M2 21v-1a6 6 0 0112 0v1" opacity={active ? 0.8 : 0.25} />
    <path d="M16 11a3 3 0 100-6" opacity={active ? 0.6 : 0.2} />
    <path d="M14 21v-1a6 6 0 00-2.5-4.87" opacity={active ? 0.6 : 0.2} />
  </svg>
)

export default function BottomNav() {
  const pathname = usePathname()
  const { user, profile } = useAuth()

  // /sparring has its own contextual bottom bar (Discover/My Profile/Requests) —
  // don't stack a second fixed bottom nav on top of it.
  if (pathname === '/sparring' || pathname.startsWith('/sparring/')) return null

  const isHome     = pathname === '/'
  const isSparring = false
  const isPlay     = pathname === '/play'
  const isCommunity= pathname === '/community' || pathname.startsWith('/community/')
  const isProfile  = pathname === '/profile' || pathname === '/auth/login'

  const items = [
    { href: '/',          label: 'Home',      active: isHome,      icon: HomeIcon },
    { href: '/sparring',  label: 'Partners',  active: isSparring,  icon: SparringIcon },
    { href: '/play',      label: 'Play',      active: isPlay,      icon: PlayIcon },
    { href: '/community', label: 'Community', active: isCommunity, icon: CommunityIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bottom-nav safe-bottom md:hidden"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="flex items-stretch justify-around px-1 pt-2 pb-2">
        {items.map(({ href, label, active, icon }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] relative transition-all active:scale-95">
            {active && (
              <span className="absolute inset-x-2 inset-y-0 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }} />
            )}
            <div className="relative z-10">{icon(active)}</div>
            <span className="text-[11px] font-bold z-10" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </Link>
        ))}

        {/* Profile / Sign in */}
        <Link href={user ? '/profile' : '/auth/login'}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] relative transition-all active:scale-95">
          {isProfile && (
            <span className="absolute inset-x-2 inset-y-0 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }} />
          )}
          <div className="relative z-10">
            {user && (profile?.full_name || user.user_metadata?.avatar_url) ? (
              user.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url} alt="" width={24} height={24}
                  className="w-6 h-6 rounded-full object-cover border-2"
                  style={{ borderColor: isProfile ? 'var(--accent)' : 'transparent' }} />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: isProfile ? 'var(--accent)' : 'var(--surface-2)', color: isProfile ? '#000' : 'var(--text-muted)' }}>
                  {(profile?.full_name || '?').slice(0, 2).toUpperCase()}
                </div>
              )
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                style={{ color: isProfile ? 'var(--accent)' : 'currentColor' }}>
                <circle cx="12" cy="8" r="4" opacity={isProfile ? 1 : 0.35} />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" opacity={isProfile ? 1 : 0.35} />
              </svg>
            )}
          </div>
          <span className="text-[11px] font-bold z-10" style={{ color: isProfile ? 'var(--accent)' : 'var(--text-muted)' }}>
            {user ? 'Profile' : 'Sign in'}
          </span>
        </Link>
      </div>
    </nav>
  )
}
