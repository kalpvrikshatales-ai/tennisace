'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function BarItem({ href, label, icon, active }: {
  href: string; label: string; icon: string; active: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: '6px 4px 4px',
        textDecoration: 'none',
        color: active ? 'var(--sr-accent)' : 'var(--sr-muted)',
        borderTop: active ? '2px solid var(--sr-accent)' : '2px solid transparent',
        transition: 'color 0.15s',
        minHeight: 44,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.2 }}>{label}</span>
    </Link>
  )
}

export default function SparringBottomBar() {
  const pathname = usePathname()
  const [ownId, setOwnId] = useState<string | null>(null)

  useEffect(() => {
    setOwnId(localStorage.getItem('sparring_profile_id'))
  }, [])

  const profileHref = ownId ? `/sparring/${ownId}` : '/sparring/create'

  const isDiscover  = pathname === '/sparring'
  const isRequests  = pathname.startsWith('/sparring/my-requests')
  const isProfile   = !isDiscover && !isRequests &&
                      !pathname.startsWith('/sparring/login') &&
                      pathname.startsWith('/sparring')

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--sr-card)',
        borderTop: '1px solid var(--sr-border)',
        display: 'flex', alignItems: 'flex-start',
        zIndex: 60,
      }}
    >
      <BarItem href="/sparring"         label="Discover"    icon="🎾" active={isDiscover} />
      <BarItem href={profileHref}       label="My Profile"  icon="👤" active={isProfile}  />
      <BarItem href="/sparring/my-requests" label="Requests" icon="📬" active={isRequests} />
    </div>
  )
}
