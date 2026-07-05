'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const COUNTRIES = [
  'India', 'USA', 'UK', 'Australia', 'UAE', 'Singapore',
  'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Japan',
  'Brazil', 'South Africa', 'New Zealand', 'Other',
]
const LEVELS   = ['Beginner', 'Intermediate', 'Advanced', 'Competitive']
const SURFACES = ['Hard', 'Clay', 'Grass', 'Indoor']
const HANDS    = ['Right', 'Left']
const BACKS    = ['One-handed', 'Two-handed']

type Tab = 'overview' | 'edit'

function InfoCard({ icon, label, value, empty }: { icon: string; label: string; value?: string | null; empty?: string }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
      padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
      </div>
      <span style={{ color: value ? '#fff' : '#333', fontSize: 13, fontWeight: value ? 700 : 500 }}>
        {value || (empty ?? '+ Add')}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  const [tab, setTab] = useState<Tab>('overview')

  // Edit form state
  const [fullName, setFullName]     = useState('')
  const [phone,    setPhone]        = useState('')
  const [city,     setCity]         = useState('')
  const [country,  setCountry]      = useState('')
  const [level,    setLevel]        = useState('')
  const [surface,  setSurface]      = useState('')
  const [hand,     setHand]         = useState('')
  const [backhand, setBackhand]     = useState('')
  const [saving,   setSaving]       = useState(false)
  const [saved,    setSaved]        = useState(false)
  const [saveErr,  setSaveErr]      = useState('')

  const [sparringProfile, setSparringProfile] = useState<any>(null)
  const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
    setCity(profile.city ?? '')
    setCountry(profile.country ?? '')
    setLevel((profile as any).tennis_level ?? '')
    setSurface((profile as any).favorite_surface ?? '')
    setHand((profile as any).dominant_hand ?? '')
    setBackhand((profile as any).backhand ?? '')
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
        id: user.id,
        email: user.email,
        full_name:        fullName.trim() || null,
        phone:            phone.trim() || null,
        city:             city.trim() || null,
        country:          country || null,
        tennis_level:     level || null,
        favorite_surface: surface || null,
        dominant_hand:    hand || null,
        backhand:         backhand || null,
      })
      if (error) throw error
      setSaved(true)
      setTimeout(() => { setSaved(false); setTab('overview') }, 1200)
    } catch (e: any) {
      setSaveErr(e.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #1a1a1a', borderTopColor: '#00C875', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'You'
  const handle      = '@' + (user.email?.split('@')[0] ?? 'you')
  const initials    = displayName.slice(0, 2).toUpperCase()
  const avatarUrl   = user.user_metadata?.avatar_url

  const select = (label: string, value: string, set: (v: string) => void, opts: string[]) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>{label}</p>
      <select value={value} onChange={e => set(e.target.value)} style={{
        width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #222',
        borderRadius: 8, color: value ? '#fff' : '#444', padding: '12px 14px', fontSize: 14, outline: 'none',
      }}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  const input = (label: string, value: string, set: (v: string) => void, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>{label}</p>
      <input type={type} value={value} placeholder={placeholder} onChange={e => set(e.target.value)} style={{
        width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #222',
        borderRadius: 8, color: '#fff', padding: '12px 14px', fontSize: 14, outline: 'none',
      }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 80 }}>

      {/* Cover banner */}
      <div style={{
        height: 180,
        background: 'linear-gradient(135deg, #0a1a0a 0%, #001a00 40%, #00140a 70%, #0a0a1a 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle tennis court lines */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.06 }} width="100%" height="100%" viewBox="0 0 400 180">
          <rect x="40" y="20" width="320" height="140" fill="none" stroke="#00C875" strokeWidth="1.5" />
          <line x1="200" y1="20" x2="200" y2="160" stroke="#00C875" strokeWidth="1" />
          <line x1="40" y1="90" x2="360" y2="90" stroke="#00C875" strokeWidth="1" />
          <rect x="120" y="20" width="160" height="70" fill="none" stroke="#00C875" strokeWidth="1" />
          <rect x="120" y="90" width="160" height="70" fill="none" stroke="#00C875" strokeWidth="1" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #000 100%)' }} />
      </div>

      {/* Avatar + name */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ position: 'relative', marginTop: -44, marginBottom: 16 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{
              width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
              border: '4px solid #000', display: 'block',
            }} />
          ) : (
            <div style={{
              width: 88, height: 88, borderRadius: '50%', border: '4px solid #000',
              background: '#00C875', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 900, color: '#000',
            }}>
              {initials}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.5 }}>
            {displayName}
          </h1>
          <p style={{ color: '#444', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{handle}</p>
          {(profile?.city || profile?.country) && (
            <p style={{ color: '#444', fontSize: 13, margin: 0 }}>
              📍 {[profile.city, profile.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button onClick={() => setTab(tab === 'edit' ? 'overview' : 'edit')} style={{
            flex: 1, padding: '10px', borderRadius: 8,
            border: tab === 'edit' ? 'none' : '1px solid #333',
            background: tab === 'edit' ? '#00C875' : 'transparent',
            color: tab === 'edit' ? '#000' : '#aaa',
            fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}>
            {tab === 'edit' ? '← Overview' : 'Edit Profile'}
          </button>
          <button onClick={handleSignOut} style={{
            padding: '10px 18px', borderRadius: 8, border: '1px solid #2a1a1a',
            background: 'transparent', color: '#666', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
            Sign out
          </button>
        </div>

        {/* Tab: Overview */}
        {tab === 'overview' && (
          <>
            {/* Tennis Profile card grid */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: '#555', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px' }}>
                Tennis Profile
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <InfoCard icon="🌍" label="Country"  value={profile?.country} />
                <InfoCard icon="📍" label="City"     value={profile?.city} />
                <InfoCard icon="📶" label="Level"    value={(profile as any)?.tennis_level} />
                <InfoCard icon="🎾" label="Surface"  value={(profile as any)?.favorite_surface} />
                <InfoCard icon="✋" label="Hand"     value={(profile as any)?.dominant_hand} />
                <InfoCard icon="🔁" label="Backhand" value={(profile as any)?.backhand} />
              </div>
              {!profile?.country && !(profile as any)?.tennis_level && (
                <button onClick={() => setTab('edit')} style={{
                  marginTop: 12, background: 'none', border: '1px dashed #333',
                  borderRadius: 8, color: '#555', fontSize: 13, fontWeight: 600,
                  padding: '10px', width: '100%', cursor: 'pointer',
                }}>
                  + Complete your tennis profile
                </button>
              )}
            </div>

            {/* Sparring profile */}
            {sparringProfile && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#555', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
                  Sparring
                </p>
                <div style={{
                  background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 10, padding: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 3px' }}>{sparringProfile.name}</p>
                    <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
                      {sparringProfile.level} · {sparringProfile.city}
                    </p>
                  </div>
                  <Link href={`/sparring/${sparringProfile.id}`} style={{
                    background: '#39FF14', color: '#000', fontWeight: 800,
                    fontSize: 12, padding: '8px 14px', borderRadius: 6, textDecoration: 'none',
                  }}>
                    View →
                  </Link>
                </div>
              </div>
            )}

            {!sparringProfile && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#555', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
                  Sparring
                </p>
                <Link href="/sparring/create" style={{
                  display: 'block', border: '1px dashed #1a3a1a', borderRadius: 10, padding: '16px',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  <p style={{ color: '#39FF14', fontWeight: 800, fontSize: 14, margin: '0 0 3px' }}>Find a hitting partner</p>
                  <p style={{ color: '#555', fontSize: 12, margin: 0 }}>Create your sparring profile →</p>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Tab: Edit */}
        {tab === 'edit' && (
          <div>
            <p style={{ color: '#444', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 18px' }}>
              Personal info
            </p>
            {input('Full name', fullName, setFullName, 'text', 'Your full name')}
            {input('Phone', phone, setPhone, 'tel', '+91 98765 43210')}
            {input('City', city, setCity, 'text', 'Mumbai')}
            {select('Country', country, setCountry, COUNTRIES)}

            <p style={{ color: '#444', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '24px 0 18px' }}>
              Tennis profile
            </p>
            {select('Your level', level, setLevel, LEVELS)}
            {select('Favourite surface', surface, setSurface, SURFACES)}
            {select('Dominant hand', hand, setHand, HANDS)}
            {select('Backhand', backhand, setBackhand, BACKS)}

            {saveErr && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{saveErr}</p>}

            <button onClick={save} disabled={saving} style={{
              width: '100%', padding: '14px', borderRadius: 8,
              background: saved ? '#0a1a0a' : '#00C875',
              color: saved ? '#00C875' : '#000',
              fontWeight: 800, fontSize: 15,
              cursor: saving ? 'not-allowed' : 'pointer',
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
