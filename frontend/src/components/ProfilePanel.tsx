'use client'

import { useState, useEffect } from 'react'
import { getUser, signInWithGoogle, signOut } from '@/lib/supabase'

const TOP_PLAYERS = [
  { key: 2072, name: 'J. Sinner',    country: '🇮🇹', rank: 1 },
  { key: 2382, name: 'C. Alcaraz',   country: '🇪🇸', rank: 2 },
  { key: 1980, name: 'A. Zverev',    country: '🇩🇪', rank: 3 },
  { key: 2073, name: 'F. Auger-Aliassime', country: '🇨🇦', rank: 4 },
  { key: 2973, name: 'B. Shelton',   country: '🇺🇸', rank: 5 },
  { key: 1106, name: 'A. De Minaur', country: '🇦🇺', rank: 6 },
  { key: 2832, name: 'T. Fritz',     country: '🇺🇸', rank: 7 },
  { key: 1905, name: 'N. Djokovic',  country: '🇷🇸', rank: 8 },
  // WTA
  { key: 3233, name: 'I. Swiatek',   country: '🇵🇱', rank: 1 },
  { key: 3047, name: 'A. Sabalenka', country: '🇧🇾', rank: 2 },
  { key: 3178, name: 'E. Rybakina',  country: '🇰🇿', rank: 3 },
  { key: 3282, name: 'C. Gauff',     country: '🇺🇸', rank: 4 },
  { key: 3260, name: 'J. Paolini',   country: '🇮🇹', rank: 5 },
  { key: 3166, name: 'M. Keys',      country: '🇺🇸', rank: 6 },
]

const FAV_KEY = '_ta_fav_players'
const NOTIF_KEY = '_ta_notif_prefs'

function loadFavs(): number[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] }
}
function saveFavs(favs: number[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)) } catch {}
}
function loadNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{"favorites":true,"grandslams":true}') }
  catch { return { favorites: true, grandslams: true } }
}
function saveNotifPrefs(prefs: object) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs)) } catch {}
}

interface Props { open: boolean; onClose: () => void }

export default function ProfilePanel({ open, onClose }: Props) {
  const [user, setUser] = useState<any>(null)
  const [favs, setFavs] = useState<number[]>([])
  const [notifPrefs, setNotifPrefs] = useState({ favorites: true, grandslams: true })
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    getUser().then(u => setUser(u))
    setFavs(loadFavs())
    setNotifPrefs(loadNotifPrefs())
  }, [open])

  const toggleFav = (key: number) => {
    const next = favs.includes(key) ? favs.filter(f => f !== key) : [...favs, key]
    setFavs(next)
    saveFavs(next)
  }

  const toggleNotif = (k: 'favorites' | 'grandslams') => {
    const next = { ...notifPrefs, [k]: !notifPrefs[k] }
    setNotifPrefs(next)
    saveNotifPrefs(next)
  }

  const handleSignIn = async () => {
    setSigningIn(true)
    await signInWithGoogle(window.location.pathname)
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] bg-white z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-xl object-cover flex-shrink-0" />
            <span className="font-black text-[16px]">Tennis<span className="text-[#00C875]">Ace</span></span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* User section */}
        <div className="p-5 border-b border-gray-100">
          {user ? (
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#00C875]/20 flex items-center justify-center">
                  <span className="text-[#00C875] font-black text-lg">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{user.user_metadata?.full_name || 'Player'}</p>
                <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={handleSignOut} className="ml-auto text-[11px] text-gray-400 hover:text-gray-600">
                Sign out
              </button>
            </div>
          ) : (
            <div>
              <p className="font-bold text-gray-900 mb-1">Sign in to unlock</p>
              <p className="text-[13px] text-gray-400 mb-4">Vote history · Favourite players · Match alerts</p>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold text-[14px] text-gray-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {signingIn ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>
          )}
        </div>

        {/* Favourite players */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            ⭐ Favourite Players
          </p>
          <p className="text-[12px] text-gray-400 mb-3">Tap to follow — get notified when they play</p>
          <div className="space-y-1.5">
            {TOP_PLAYERS.map(p => {
              const isFav = favs.includes(p.key)
              return (
                <button
                  key={p.key}
                  onClick={() => toggleFav(p.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                    isFav ? 'bg-[#00C875]/10 border border-[#00C875]/30' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className="text-[16px]">{p.country}</span>
                  <span className={`flex-1 text-[14px] font-semibold ${isFav ? 'text-[#00C875]' : 'text-gray-700'}`}>
                    {p.name}
                  </span>
                  <span className="text-[11px] text-gray-400">#{p.rank}</span>
                  {isFav && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#00C875">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notification prefs */}
        <div className="p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            🔔 Notifications
          </p>
          {[
            { key: 'favorites' as const, label: 'Favourite player matches', sub: 'When they step on court' },
            { key: 'grandslams' as const, label: 'Grand Slam matches', sub: 'Wimbledon, US Open, Slams' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gray-900">{label}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
              <button
                onClick={() => toggleNotif(key)}
                className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${
                  notifPrefs[key] ? 'bg-[#00C875]' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                  notifPrefs[key] ? 'left-5' : 'left-0.5'
                }`} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-4">
            {favs.length === 0
              ? 'Select favourite players above to get match alerts'
              : `Following ${favs.length} player${favs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    </>
  )
}
