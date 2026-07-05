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

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

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
    setSaving(true); setSaveError(''); setSaved(false)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        country: country || null,
      })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setSaveError(e.message ?? 'Failed to save')
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
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #1a1a1a', borderTopColor: '#00C875',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const displayName = fullName || user.email?.split('@')[0] || 'You'
  const initials = displayName.slice(0, 2).toUpperCase()
  const avatarUrl = user.user_metadata?.avatar_url

  const field = (label: string, value: string, set: (v: string) => void, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>{label}</p>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => set(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#111', border: '1px solid #222', borderRadius: 8,
          color: '#fff', padding: '12px 14px', fontSize: 14, outline: 'none',
        }}
      />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #111', padding: '16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#555', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← Home</Link>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: -0.3 }}>My Profile</span>
          <div style={{ width: 50 }} />
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px' }}>

        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{
              width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
              margin: '0 auto', display: 'block', border: '3px solid #1a1a1a',
            }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
              background: '#00C875', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 900, color: '#000',
            }}>
              {initials}
            </div>
          )}
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '12px 0 2px', letterSpacing: -0.3 }}>
            {displayName}
          </p>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>{user.email}</p>
        </div>

        {/* Edit form */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#444', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
            Profile info
          </p>
          {field('Full name', fullName, setFullName, 'text', 'Your full name')}
          {field('Phone', phone, setPhone, 'tel', '+91 98765 43210')}
          {field('City', city, setCity, 'text', 'Mumbai')}

          <div style={{ marginBottom: 14 }}>
            <p style={{ color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>Country</p>
            <select value={country} onChange={e => setCountry(e.target.value)} style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111', border: '1px solid #222', borderRadius: 8,
              color: country ? '#fff' : '#555', padding: '12px 14px', fontSize: 14, outline: 'none',
            }}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {saveError && (
            <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{saveError}</p>
          )}

          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '14px', borderRadius: 8,
            border: saved ? '1px solid #1a3a1a' : 'none',
            background: saved ? '#0a1a0a' : '#00C875',
            color: saved ? '#00C875' : '#000',
            fontWeight: 800, fontSize: 15,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>

        {/* Sparring profile */}
        {sparringProfile && (
          <div style={{
            background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 10,
            padding: '16px', marginBottom: 24,
          }}>
            <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Sparring profile
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{sparringProfile.name}</p>
                <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
                  {sparringProfile.city}{sparringProfile.country ? `, ${sparringProfile.country}` : ''} · {sparringProfile.level}
                </p>
              </div>
              <Link href={`/sparring/${sparringProfile.id}`} style={{
                background: '#39FF14', color: '#000', fontWeight: 800, fontSize: 12,
                padding: '8px 14px', borderRadius: 6, textDecoration: 'none',
              }}>
                View →
              </Link>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '14px', borderRadius: 8, border: '1px solid #2a1a1a',
          background: '#110a0a', color: '#ef4444', fontWeight: 800, fontSize: 15, cursor: 'pointer',
        }}>
          Sign out
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
