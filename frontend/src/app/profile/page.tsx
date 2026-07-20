'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import BackButton from '@/components/BackButton'

const COUNTRIES = [
  'India', 'USA', 'UK', 'Australia', 'UAE', 'Singapore',
  'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Japan',
  'Brazil', 'South Africa', 'New Zealand', 'Other',
]
const LEVELS   = ['Beginner', 'Intermediate', 'Advanced', 'Competitive']
const SURFACES = ['Hard', 'Clay', 'Grass', 'Indoor']
const HANDS    = ['Right', 'Left']
const BACKS    = ['One-handed', 'Two-handed']
const STYLES   = ['Baseline', 'Serve & Volley', 'All-Court', 'Defensive']

type Tab = 'overview' | 'edit'

const TENNIS_FIELDS = [
  { key: 'country',          icon: '🌍', label: 'Country'        },
  { key: 'city',             icon: '📍', label: 'City'           },
  { key: 'tennis_level',     icon: '📶', label: 'Tennis Level'   },
  { key: 'favorite_surface', icon: '🎾', label: 'Fav Surface'    },
  { key: 'dominant_hand',    icon: '✋', label: 'Dominant Hand'  },
  { key: 'backhand',         icon: '🔁', label: 'Backhand'       },
  { key: 'play_style',       icon: '⚡', label: 'Play Style'     },
  { key: 'phone',            icon: '📱', label: 'Phone'          },
  { key: 'years_playing',    icon: '📅', label: 'Years Playing'  },
] as const

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  const [tab, setTab] = useState<Tab>('overview')

  const [fullName,      setFullName]      = useState('')
  const [phone,         setPhone]         = useState('')
  const [city,          setCity]          = useState('')
  const [country,       setCountry]       = useState('')
  const [level,         setLevel]         = useState('')
  const [surface,       setSurface]       = useState('')
  const [hand,          setHand]          = useState('')
  const [backhand,      setBackhand]      = useState('')
  const [playStyle,     setPlayStyle]     = useState('')
  const [yearsPlaying,  setYearsPlaying]  = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [saveErr,       setSaveErr]       = useState('')

  const [sparringProfile, setSparringProfile] = useState<any>(null)
  const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!profile) return
    const p = profile as any
    setFullName(p.full_name ?? '')
    setPhone(p.phone ?? '')
    setCity(p.city ?? '')
    setCountry(p.country ?? '')
    setLevel(p.tennis_level ?? '')
    setSurface(p.favorite_surface ?? '')
    setHand(p.dominant_hand ?? '')
    setBackhand(p.backhand ?? '')
    setPlayStyle(p.play_style ?? '')
    setYearsPlaying(p.years_playing ?? '')
  }, [profile])

  useEffect(() => {
    if (!user?.email) return
    fetch(`${BACKEND}/sparring/profiles/by-email?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.id && setSparringProfile(d))
      .catch(() => {})
  }, [user, BACKEND])

  async function save() {
    if (!user || !supabase) return
    setSaving(true); setSaveErr(''); setSaved(false)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, email: user.email,
        full_name:        fullName.trim() || null,
        phone:            phone.trim() || null,
        city:             city.trim() || null,
        country:          country || null,
        tennis_level:     level || null,
        favorite_surface: surface || null,
        dominant_hand:    hand || null,
        backhand:         backhand || null,
        play_style:       playStyle || null,
        years_playing:    yearsPlaying.trim() || null,
      })
      if (error) throw error
      setSaved(true)
      setTimeout(() => { setSaved(false); setTab('overview') }, 1000)
    } catch (e: any) { setSaveErr(e.message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #1a1a1a', borderTopColor: '#00C875', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const p           = profile as any
  const displayName = p?.full_name || user.email?.split('@')[0] || 'You'
  const handle      = '@' + (user.email?.split('@')[0] ?? 'you')
  const avatarUrl   = user.user_metadata?.avatar_url
  const initials    = displayName.slice(0, 2).toUpperCase()

  const profileData: Record<string, string> = {
    country:          p?.country        ?? '',
    city:             p?.city           ?? '',
    tennis_level:     p?.tennis_level   ?? level,
    favorite_surface: p?.favorite_surface ?? surface,
    dominant_hand:    p?.dominant_hand  ?? hand,
    backhand:         p?.backhand       ?? backhand,
    play_style:       p?.play_style     ?? playStyle,
    phone:            p?.phone          ?? '',
    years_playing:    p?.years_playing  ?? '',
  }

  const sel = (label: string, value: string, set: (v: string) => void, opts: string[]) => (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>{label}</p>
      <select value={value} onChange={e => set(e.target.value)} style={{
        width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, color: value ? 'var(--text)' : 'var(--text-2)', padding: '12px 14px', fontSize: 14, outline: 'none',
      }}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  const inp = (label: string, value: string, set: (v: string) => void, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>{label}</p>
      <input type={type} value={value} placeholder={placeholder} onChange={e => set(e.target.value)} style={{
        width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, color: 'var(--text)', padding: '12px 14px', fontSize: 14, outline: 'none',
      }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 16px 0' }}>
        <BackButton />
      </div>

      {/* ── Cover ── */}
      <div style={{ height: 200, background: 'linear-gradient(135deg,#0d1f0d 0%,#091209 50%,#0a0a14 100%)', position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice">
          <rect x="60" y="20" width="480" height="160" fill="none" stroke="#00C875" strokeWidth="2"/>
          <line x1="300" y1="20" x2="300" y2="180" stroke="#00C875" strokeWidth="1.5"/>
          <line x1="60" y1="100" x2="540" y2="100" stroke="#00C875" strokeWidth="1"/>
          <rect x="165" y="20" width="270" height="80" fill="none" stroke="#00C875" strokeWidth="1"/>
          <rect x="165" y="100" width="270" height="80" fill="none" stroke="#00C875" strokeWidth="1"/>
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, var(--bg))' }} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Avatar row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -48, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg)', display: 'block' }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid var(--bg)', background: '#00C875', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, color: '#000' }}>
                {initials}
              </div>
            )}
          </div>
          {/* Action buttons top-right of avatar row */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <button onClick={() => setTab(tab === 'edit' ? 'overview' : 'edit')} style={{
              padding: '9px 18px', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer',
              background: tab === 'edit' ? '#00C875' : '#00C875',
              border: 'none', color: '#000',
            }}>
              {tab === 'edit' ? '← Back' : 'Edit Profile'}
            </button>
            <button onClick={async () => { await signOut(); router.push('/') }} style={{
              padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)',
            }}>
              Sign out
            </button>
          </div>
        </div>

        {/* ── Name / handle ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.4 }}>{displayName}</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '0 0 4px', fontWeight: 600 }}>{handle}</p>
          {(p?.city || p?.country) && (
            <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>📍 {[p.city, p.country].filter(Boolean).join(', ')}</p>
          )}
        </div>

        {/* ── Tabs ── */}
        {tab === 'overview' && (
          <>
            {/* ── Tennis Profile cards ── */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 800, margin: '0 0 14px', letterSpacing: -0.2 }}>Tennis Profile</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {TENNIS_FIELDS.map(({ key, icon, label }) => {
                  const val = profileData[key]
                  return (
                    <button key={key} onClick={() => setTab('edit')} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
                      padding: '14px 12px', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <span style={{ color: 'var(--text-2)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</span>
                      <span style={{ color: val ? 'var(--text)' : 'var(--text-2)', fontSize: 12, fontWeight: val ? 700 : 500 }}>
                        {val || '+ Add'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Sparring ── */}
            <div>
              <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 800, margin: '0 0 14px', letterSpacing: -0.2 }}>Sparring</p>
              {sparringProfile ? (
                <div style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 15, margin: '0 0 3px' }}>{sparringProfile.name}</p>
                    <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0 }}>{sparringProfile.level} · {sparringProfile.city}</p>
                  </div>
                  <Link href={`/sparring/${sparringProfile.id}`} style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: 12, padding: '8px 14px', borderRadius: 6, textDecoration: 'none' }}>
                    View →
                  </Link>
                </div>
              ) : (
                <Link href="/sparring/create" style={{ display: 'block', border: '1px dashed #1a3a1a', borderRadius: 10, padding: '20px', textDecoration: 'none', textAlign: 'center' }}>
                  <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 14, margin: '0 0 4px' }}>Find a hitting partner</p>
                  <p style={{ color: '#444', fontSize: 12, margin: 0 }}>Create your sparring profile →</p>
                </Link>
              )}
            </div>
          </>
        )}

        {/* ── Edit form ── */}
        {tab === 'edit' && (
          <div>
            <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 20px' }}>Personal info</p>
            {inp('Full name',     fullName,    setFullName,    'text', 'Your full name')}
            {inp('Phone',         phone,       setPhone,       'tel',  '+91 98765 43210')}
            {inp('City',          city,        setCity,        'text', 'Dubai')}
            {sel('Country',       country,     setCountry,     COUNTRIES)}

            <p style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '24px 0 20px' }}>Tennis profile</p>
            {sel('Tennis level',     level,      setLevel,      LEVELS)}
            {sel('Favourite surface',surface,    setSurface,    SURFACES)}
            {sel('Dominant hand',    hand,       setHand,       HANDS)}
            {sel('Backhand',         backhand,   setBackhand,   BACKS)}
            {sel('Play style',       playStyle,  setPlayStyle,  STYLES)}
            {inp('Years playing',    yearsPlaying, setYearsPlaying, 'text', 'e.g. 5')}

            {saveErr && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{saveErr}</p>}
            <button onClick={save} disabled={saving} style={{
              width: '100%', padding: '14px', borderRadius: 8,
              background: saved ? '#0a1a0a' : '#00C875',
              color: saved ? '#00C875' : '#000',
              fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
              border: saved ? '1px solid #1a3a1a' : 'none',
              transition: 'all 0.2s',
            }}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
