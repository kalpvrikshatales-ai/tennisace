'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useSidebar, HomeTab } from './SidebarContext'
import { signInWithGoogle } from '@/lib/supabase'
import ThemeToggle from './ThemeToggle'


type NavItem = {
  icon:    string
  label:   string
  href?:   string            // hard link (navigates to a route)
  tab?:    HomeTab           // sets home-page tab (stays on /)
  filter?: 'live'            // also sets matchFilter
}

const NAV: NavItem[] = [
  { icon:'🏠', label:'Home',           href:'/'          },
  { icon:'🎾', label:'Matches',        tab:'matches'     },
  { icon:'📡', label:'Live',           tab:'matches', filter:'live' },
  { icon:'🏆', label:'Rankings',       href:'/rankings'  },
  { icon:'📰', label:'News',           tab:'news'        },
  { icon:'🏆', label:'US Open',         href:'/tournament/us-open-2026' },
  { icon:'🤝', label:'Find a Partner', href:'/sparring'  },
  { icon:'🎾', label:'Play',           href:'/play'      },
  { icon:'🏘️', label:'Community',      href:'/community' },
]

// ─── Single nav item ──────────────────────────────────────────────────────────
function NavRow({
  item, active, onClick,
}: {
  item: NavItem; active: boolean; onClick: () => void
}) {
  const base: React.CSSProperties = {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 16px', borderRadius:6,
    cursor:'pointer', width:'100%',
    background: active ? '#1a1a1a' : 'transparent',
    border:'none', textAlign:'left',
    borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
    color: active ? '#fff' : '#888',
    fontSize:14, fontWeight:600,
    transition:'color 0.12s, background 0.12s',
  } as React.CSSProperties

  const inner = (
    <span style={{ display:'flex', alignItems:'center', gap:10, pointerEvents:'none' }}>
      <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{item.icon}</span>
      <span style={{ flex:1 }}>{item.label}</span>
    </span>
  )

  if (item.href) {
    return (
      <Link href={item.href} onClick={onClick}
        style={{ ...base, textDecoration:'none' }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color='#fff' }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color='#888' }}>
        {inner}
      </Link>
    )
  }

  return (
    <button onClick={onClick} style={base}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color='#fff' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color='#888' }}>
      {inner}
    </button>
  )
}

// ─── Core sidebar panel ───────────────────────────────────────────────────────
function SidebarPanel({ onClose }: { onClose?: () => void }) {
  const pathname              = usePathname()
  const router                = useRouter()
  const { user, profile, signOut } = useAuth()
  const { homeTab, setHomeTab, setMatchFilter, closeDrawer } = useSidebar()

  const avatarUrl  = user?.user_metadata?.avatar_url
  const firstName  = (profile?.full_name ?? user?.email ?? '').split(/[\s@]/)[0]
  const initials   = ((profile?.full_name ?? user?.email) || 'U').slice(0,2).toUpperCase()

  function isActive(item: NavItem): boolean {
    if (item.href === '/')           return pathname === '/' && homeTab === 'home'
    if (item.href === '/community') return pathname === '/community' || pathname.startsWith('/community/')
    if (item.href === '/play')      return pathname === '/play'
    if (item.href === '/sparring') return pathname === '/sparring' || pathname.startsWith('/sparring/')
    if (item.href === '/rankings') return pathname === '/rankings' || pathname.startsWith('/rankings')
    if (item.href === '/tournament/us-open-2026') return pathname.startsWith('/tournament')
    if (item.tab) {
      if (pathname !== '/') return false
      if (item.filter === 'live') return false
      return homeTab === item.tab
    }
    return false
  }

  function handleNav(item: NavItem) {
    if (item.href === '/') {
      setHomeTab('home')
      router.push('/')
    } else if (item.tab) {
      setHomeTab(item.tab)
      if (item.filter === 'live') setMatchFilter('live')
      if (pathname !== '/') router.push('/')
    }
    closeDrawer()
    onClose?.()
  }

  async function handleSignOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sparring_profile_id')
      localStorage.removeItem('sparring_email')
    }
    await signOut()
    closeDrawer()
    router.push('/')
  }

  return (
    <div style={{
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      background:'#070c14', borderRight:'1px solid #0f1a2e', overflowY:'auto',
    }}>
      {/* Mobile-only founding member banner */}
      {onClose && (
        <div style={{
          background:'color-mix(in srgb, var(--accent) 7%, transparent)', borderBottom:'1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
          padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
        }}>
          <span style={{ color:'var(--accent)', fontSize:11, fontWeight:800, letterSpacing:0.4 }}>
            🎾 Founding members worldwide
          </span>
          <Link href="/community" onClick={closeDrawer}
            style={{ color:'var(--accent)', fontSize:11, fontWeight:700, textDecoration:'none' }}>
            Join →
          </Link>
        </div>
      )}
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid #1a1a1a', flexShrink:0 }}>
        <Link href="/" onClick={() => { setHomeTab('home'); closeDrawer() }}
          style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <img src="/logo.png" alt="" style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
          <span style={{ fontSize:16, fontWeight:900, color:'#fff', letterSpacing:-0.5 }}>
            Tennis<span style={{ color:'#00C875' }}>Ace</span>
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav style={{ padding:'10px 8px', flex:1 }}>
        {NAV.map(item => (
          <NavRow key={item.label} item={item} active={isActive(item)} onClick={() => handleNav(item)} />
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height:1, background:'#1a1a1a', margin:'0 8px', flexShrink:0 }} />

      {/* Legal footer */}
      <div style={{ padding:'10px 16px', flexShrink:0, display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
        <Link href="/privacy" onClick={closeDrawer} style={{ color:'#444', fontSize:11, textDecoration:'none' }} onMouseEnter={e => (e.currentTarget.style.color='var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color='#444')}>Privacy</Link>
        <span style={{ color:'#333', fontSize:11 }}>·</span>
        <Link href="/terms" onClick={closeDrawer} style={{ color:'#444', fontSize:11, textDecoration:'none' }} onMouseEnter={e => (e.currentTarget.style.color='var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color='#444')}>Terms</Link>
        <span style={{ color:'#333', fontSize:11 }}>·</span>
        <Link href="/cookies" onClick={closeDrawer} style={{ color:'#444', fontSize:11, textDecoration:'none' }} onMouseEnter={e => (e.currentTarget.style.color='var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color='#444')}>Cookies</Link>
        <span style={{ color:'#2a2a2a', fontSize:11, width:'100%', marginTop:2 }}>© 2026 TennisAce</span>
      </div>

      {/* Divider */}
      <div style={{ height:1, background:'#1a1a1a', margin:'0 8px', flexShrink:0 }} />

      {/* Theme toggle row */}
      <div style={{ padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ color:'#555', fontSize:12, fontWeight:600 }}>Theme</span>
        <ThemeToggle variant="dark" />
      </div>

      {/* Divider */}
      <div style={{ height:1, background:'#1a1a1a', margin:'0 8px', flexShrink:0 }} />

      {/* Auth section */}
      {user ? (
        <div style={{ padding:'12px 8px', flexShrink:0 }}>
          <Link href="/profile" onClick={closeDrawer}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, textDecoration:'none', background:'#111', border:'1px solid #1e1e1e', marginBottom:8 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
            ) : (
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#00C875', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#000', flexShrink:0 }}>
                {initials}
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{firstName}</p>
              <p style={{ color:'#555', fontSize:11, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</p>
            </div>
          </Link>
          <button onClick={handleSignOut}
            style={{ width:'100%', background:'none', border:'1px solid #2a2a2a', borderRadius:8, color:'#666', fontSize:13, fontWeight:600, padding:'9px', cursor:'pointer' }}>
            Sign out
          </button>
        </div>
      ) : (
        <div style={{ padding:'14px 12px', flexShrink:0 }}>
          {/* Sign in panel */}
          <div style={{ background:'#111', border:'1px solid #1e1e1e', borderRadius:10, padding:'14px 14px 12px', marginBottom:8 }}>
            <p style={{ color:'#fff', fontSize:13, fontWeight:800, margin:'0 0 3px', letterSpacing:-0.2 }}>Sign in to unlock</p>
            <p style={{ color:'#555', fontSize:11, margin:'0 0 12px', lineHeight:1.4 }}>Vote history · Match alerts · Community</p>
            <button
              onClick={() => signInWithGoogle(typeof window !== 'undefined' ? window.location.pathname : '/')}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#fff', border:'none', borderRadius:8, color:'#000', fontSize:13, fontWeight:700, padding:'9px 12px', cursor:'pointer', marginBottom:14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Community section */}
            <p style={{ color:'#444', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.7, margin:'0 0 10px' }}>
              🌍 Building tennis communities
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
              <div style={{ background:'#0d1b2e', border:'1px solid color-mix(in srgb, var(--accent) 15%, transparent)', borderRadius:8, padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>🇪🇸 Barcelona</span>
                <span style={{ color:'var(--accent)', fontSize:11, fontWeight:700 }}>0 / 500</span>
              </div>
              <div style={{ background:'#0d1b2e', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>🇦🇪 Dubai</span>
                <span style={{ color:'#f59e0b', fontSize:11, fontWeight:700 }}>0 / 300</span>
              </div>
            </div>
            <p style={{ color:'rgba(255,255,255,0.28)', fontSize:10, fontWeight:700, textAlign:'center', margin:'0 0 10px', letterSpacing:0.2 }}>
              Founding Members are free. Always.
            </p>
            <Link href="/community" onClick={closeDrawer}
              style={{ display:'block', textAlign:'center', background:'color-mix(in srgb, var(--accent) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--accent) 25%, transparent)', color:'var(--accent)', fontWeight:800, fontSize:12, padding:'8px', borderRadius:8, textDecoration:'none' }}>
              Join the community →
            </Link>
          </div>

          <Link href="/auth/login" onClick={closeDrawer}
            style={{ display:'block', textAlign:'center', background:'var(--accent)', color:'#000', fontWeight:800, fontSize:13, padding:'10px', borderRadius:8, textDecoration:'none' }}>
            Sign in
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Exported sidebar (desktop fixed + mobile drawer) ────────────────────────
export default function Sidebar() {
  const { drawerOpen, closeDrawer } = useSidebar()

  return (
    <>
      {/* Desktop: permanent fixed sidebar */}
      <div className="hidden md:block" style={{
        position:'fixed', top:0, left:0, bottom:0, width:220, zIndex:40,
      }}>
        <SidebarPanel />
      </div>

      {/* Mobile: drawer overlay */}
      {/* Backdrop */}
      <div
        className="md:hidden"
        onClick={closeDrawer}
        style={{
          position:'fixed', inset:0, zIndex:49,
          background:'rgba(0,0,0,0.7)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition:'opacity 0.22s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        className="md:hidden"
        style={{
          position:'fixed', top:0, left:0, bottom:0, width:280, zIndex:50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition:'transform 0.22s ease',
        }}
      >
        {/* Close button */}
        <button
          onClick={closeDrawer}
          style={{ position:'absolute', top:14, right:12, zIndex:1, background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', lineHeight:1 }}
        >
          ×
        </button>
        <SidebarPanel onClose={closeDrawer} />
      </div>
    </>
  )
}
