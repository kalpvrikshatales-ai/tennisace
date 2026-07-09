'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import SparringShell from '../SparringShell'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const LEVELS     = ['beginner', 'intermediate', 'advanced', 'competitive']
const SURFACES   = ['Hard', 'Clay', 'Grass', 'Indoor']
const PLAY_TYPES = [
  { value: 'rally',      label: '🎯 Rally only' },
  { value: 'match_play', label: '🏆 Match play' },
  { value: 'drills',     label: '🔄 Drills' },
  { value: 'both',       label: '⚡ Both rally & matches' },
]
const DAYS  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const TIMES = ['morning', 'afternoon', 'evening'] as const
const COACHING_LEVELS = ['Beginners', 'Intermediate', 'Advanced', 'All levels']
const COACHING_FEES   = ['Free', 'Paid']

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳' },
  { code: '+1',  flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+61', flag: '🇦🇺' },
  { code: '+971',flag: '🇦🇪' },
  { code: '+65', flag: '🇸🇬' },
]

type AvailKey = `${typeof DAYS[number]}-${typeof TIMES[number]}`

const pill = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
  border: active ? 'none' : '1px solid var(--sr-border)',
  background: active ? 'var(--sr-accent)' : 'var(--sr-card)',
  color: active ? 'var(--sr-on-acc)' : 'var(--sr-muted)',
  cursor: 'pointer',
})

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--sr-input)', border: '1px solid var(--sr-border)', borderRadius: 8,
  color: 'var(--sr-text)', padding: '0 14px', fontSize: 14, outline: 'none',
  height: 48,
}

function Label({ text }: { text: string }) {
  return (
    <p style={{ color: 'var(--sr-muted)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {text}
    </p>
  )
}

export default function CreateSparringPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const [role, setRole] = useState<'player' | 'coach' | ''>('')

  const [name,          setName]          = useState('')
  const [city,          setCity]          = useState('')
  const [country,       setCountry]       = useState('')
  const [bio,           setBio]           = useState('')
  const [favPlayers,    setFavPlayers]    = useState('')
  const [level,         setLevel]         = useState('')
  const [surfaces,      setSurfaces]      = useState<string[]>([])
  const [playType,      setPlayType]      = useState('')
  const [coachingLevel, setCoachingLevel] = useState('')
  const [coachingFee,   setCoachingFee]   = useState('')
  const [avail,         setAvail]         = useState<Set<AvailKey>>(new Set())
  const [photoFile,     setPhotoFile]     = useState<File | null>(null)
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null)

  const [email,       setEmail]       = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [emailVerified, setEmailVerified] = useState(false)
  const [otpSent,       setOtpSent]       = useState(false)
  const [otp,           setOtp]           = useState('')
  const [sending,       setSending]       = useState(false)
  const [verifying,     setVerifying]     = useState(false)
  const [emailError,    setEmailError]    = useState('')
  const [otpError,      setOtpError]      = useState('')

  const [creating,      setCreating]      = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [error,         setError]         = useState('')
  const [banner,        setBanner]        = useState('')
  const [alreadyExists, setAlreadyExists] = useState(false)
  const [celebrating,   setCelebrating]   = useState<{ name: string; profileId: string } | null>(null)

  useEffect(() => {
    const p    = new URLSearchParams(window.location.search)
    const from = p.get('from')
    if (from === 'request')  setBanner('You need a profile to send a request.')
    if (from === 'requests') setBanner('You need a profile to view your requests.')
    if (from === 'login')    setBanner('No profile found for that email.')
  }, [])

  useEffect(() => {
    if (!user) return
    if (user.email) setEmail(user.email)
    const authName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    if (authName && !name) setName(authName)
    setEmailVerified(true)
  }, [user])

  function handleEmailChange(val: string) {
    setEmail(val)
    if (emailVerified || otpSent) {
      setEmailVerified(false); setOtpSent(false); setOtp(''); setEmailError(''); setOtpError('')
    }
  }

  function toggleSurface(s: string) {
    setSurfaces(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function toggleAvail(d: typeof DAYS[number], t: typeof TIMES[number]) {
    const key: AvailKey = `${d}-${t}`
    setAvail(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function validate(): string | null {
    if (!role)                 return 'Select whether you are a Player or Coach'
    if (!name.trim())          return 'Name is required'
    if (!city.trim())          return 'City is required'
    if (!country.trim())       return 'Country is required'
    if (!level)                return 'Select a level'
    if (role === 'player' && !playType) return 'Select a play type'
    if (surfaces.length === 0) return 'Select at least one surface'
    return null
  }

  async function sendOtp() {
    setEmailError('')
    if (!email.trim() || !email.includes('@')) { setEmailError('Enter a valid email address'); return }
    setSending(true)
    try {
      const res  = await fetch('/api/sparring/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase() }) })
      const data = await res.json()
      if (!res.ok) { setEmailError(data.error ?? 'Failed to send code'); return }
      setOtpSent(true)
    } catch { setEmailError('Network error. Try again.') }
    finally { setSending(false) }
  }

  async function verifyOtp() {
    setOtpError('')
    if (otp.length < 6) { setOtpError('Enter the 6-digit code'); return }
    setVerifying(true)
    try {
      const res  = await fetch('/api/sparring/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), otp }) })
      const data = await res.json()
      if (data.verified) { setEmailVerified(true); setOtpError('') }
      else { setOtpError(data.error ?? 'Invalid code. Try again.') }
    } catch { setOtpError('Network error.') }
    finally { setVerifying(false) }
  }

  async function uploadPhoto(file: File): Promise<string> {
    if (!supabase) throw new Error('Storage not configured')
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('sparring-photos').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    return supabase.storage.from('sparring-photos').getPublicUrl(path).data.publicUrl
  }

  async function submit() {
    const err = validate()
    if (err) { setError(err); return }
    if (!emailVerified) { setError('Verify your email first.'); return }
    setError(''); setCreating(true)
    try {
      let photo_url: string | undefined
      if (photoFile) { setUploading(true); photo_url = await uploadPhoto(photoFile); setUploading(false) }

      const availability = Array.from(avail).map(key => {
        const [day, time] = key.split('-'); return { day, time }
      })

      const res = await fetch(`${BACKEND}/sparring/profiles`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), city: city.trim(), country: country.trim(),
          bio: bio.trim() || undefined,
          favorite_players: favPlayers.trim() || undefined,
          role,
          level, surface: surfaces,
          play_type: playType || 'both',
          coaching_level: role === 'coach' ? coachingLevel || undefined : undefined,
          coaching_fee:   role === 'coach' ? coachingFee   || undefined : undefined,
          photo_url,
          email: email.trim().toLowerCase(), email_verified: true,
          phone: phoneNumber.trim() ? `${countryCode}${phoneNumber.trim()}` : undefined,
          availability,
        }),
      })
      if (res.status === 409) { setAlreadyExists(true); return }
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Failed to create profile') }
      const profile = await res.json()
      localStorage.setItem('sparring_profile_id', profile.id)
      localStorage.setItem('sparring_email', email.trim().toLowerCase())
      setCelebrating({ name: name.trim(), profileId: profile.id })
      setTimeout(() => router.push(`/sparring/${profile.id}`), 2500)
    } catch (e: any) { setError(e.message); setUploading(false) }
    finally { setCreating(false) }
  }

  if (celebrating) {
    return (
      <SparringShell>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <style>{`
            @keyframes sr-bounce { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-18px) } }
            @keyframes sr-bar    { from { width: 0% } to { width: 100% } }
          `}</style>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 64, animation: 'sr-bounce 0.9s ease-in-out infinite', display: 'inline-block', marginBottom: 24 }}>🎾</div>
            <h1 style={{ color: 'var(--sr-text)', fontSize: 28, fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.5 }}>
              Welcome to TennisAce, {celebrating.name}! 🎾
            </h1>
            <p style={{ color: 'var(--sr-muted)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
              Your profile is live. Start finding hitting partners near you.
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'var(--sr-border)' }}>
            <div style={{ height: '100%', background: 'var(--sr-accent)', borderRadius: 2, animation: 'sr-bar 2.5s linear forwards' }} />
          </div>
        </div>
      </SparringShell>
    )
  }

  if (creating) {
    return (
      <SparringShell>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>Creating your profile…</p>
            <p style={{ color: 'var(--sr-muted)', fontSize: 14 }}>{uploading ? 'Uploading photo…' : 'Almost done'}</p>
          </div>
        </div>
      </SparringShell>
    )
  }

  return (
    <SparringShell>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 0' }}>

        {banner && (
          <div style={{ background: 'rgba(180,150,40,0.1)', border: '1px solid rgba(180,150,40,0.3)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <p style={{ color: '#d4b84a', fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>👋 {banner}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Link href="/sparring/login"
                style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8, background: 'var(--sr-card)', border: '1px solid var(--sr-border)', color: 'var(--sr-text)', fontWeight: 700, fontSize: 13, textDecoration: 'none', minHeight: 44, lineHeight: '24px' }}>
                Sign in to existing profile
              </Link>
              <span style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8, background: 'var(--sr-accent)', color: 'var(--sr-on-acc)', fontWeight: 800, fontSize: 13, lineHeight: '24px' }}>
                Create new profile ↓
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: 'var(--sr-text)', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>Add your profile</h1>
          <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: 0 }}>Let other players and coaches find you</p>
        </div>

        {/* Role */}
        <div style={{ marginBottom: 24 }}>
          <Label text="I am a *" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['player', 'coach'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{
                  padding: '16px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: role === r ? 'none' : '1px solid var(--sr-border)',
                  background: role === r ? 'var(--sr-accent)' : 'var(--sr-card)',
                  color: role === r ? 'var(--sr-on-acc)' : 'var(--sr-muted)',
                  fontWeight: 900, fontSize: 16, letterSpacing: -0.3, minHeight: 60,
                }}>
                {r === 'player' ? '🎾 Player' : '🎓 Coach'}
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div onClick={() => fileRef.current?.click()}
            style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--sr-card)', border: '2px dashed var(--sr-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
            {photoPreview
              ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'var(--sr-muted)', fontSize: 13 }}>+ Photo</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          <p style={{ color: 'var(--sr-muted)', fontSize: 11, margin: '6px 0 0' }}>Optional</p>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <Label text="Name *" />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        </div>

        {/* City + Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <Label text="City *" />
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={inputStyle} />
          </div>
          <div>
            <Label text="Country *" />
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. India" style={inputStyle} />
          </div>
        </div>

        {/* Email + OTP */}
        <div style={{ marginBottom: 18 }}>
          <Label text="Email * (used to access your requests)" />
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sr-success)', border: '1px solid var(--sr-succ-t)', borderRadius: 8, padding: '11px 14px' }}>
              <span style={{ color: 'var(--sr-succ-t)', fontSize: 14, fontWeight: 800 }}>✓</span>
              <span style={{ color: 'var(--sr-muted)', fontSize: 13 }}>{email}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--sr-succ-t)', fontSize: 11, fontWeight: 700 }}>via account</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={email} onChange={e => handleEmailChange(e.target.value)} placeholder="you@example.com" type="email" disabled={emailVerified}
                  style={{ ...inputStyle, flex: 1, color: emailVerified ? 'var(--sr-muted)' : 'var(--sr-text)' }} />
                {emailVerified ? (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--sr-success)', border: '1px solid var(--sr-succ-t)', borderRadius: 8, color: 'var(--sr-succ-t)', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    ✓ Verified
                  </div>
                ) : (
                  <button onClick={sendOtp} disabled={sending || !email.includes('@')}
                    style={{ padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', height: 48,
                      background: sending || !email.includes('@') ? 'var(--sr-card)' : 'var(--sr-accent)',
                      color: sending || !email.includes('@') ? 'var(--sr-muted)' : 'var(--sr-on-acc)' }}>
                    {sending ? '…' : otpSent ? 'Resend' : 'Send Code'}
                  </button>
                )}
              </div>
              {emailError && <p style={{ color: 'var(--sr-dang-t)', fontSize: 12, margin: '0 0 8px' }}>{emailError}</p>}
              {otpSent && !emailVerified && (
                <div style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 10, padding: 16 }}>
                  <p style={{ color: 'var(--sr-muted)', fontSize: 12, margin: '0 0 10px' }}>Check your inbox — 6-digit code sent to {email}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" inputMode="numeric" maxLength={6}
                      style={{ ...inputStyle, flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 900, letterSpacing: 8 }} />
                    <button onClick={verifyOtp} disabled={verifying || otp.length < 6}
                      style={{ padding: '0 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, height: 48,
                        background: verifying || otp.length < 6 ? 'var(--sr-card)' : 'var(--sr-accent)',
                        color: verifying || otp.length < 6 ? 'var(--sr-muted)' : 'var(--sr-on-acc)' }}>
                      {verifying ? '…' : 'Verify'}
                    </button>
                  </div>
                  {otpError && <p style={{ color: 'var(--sr-dang-t)', fontSize: 12, margin: '8px 0 0' }}>{otpError}</p>}
                </div>
              )}
            </>
          )}
          <p style={{ color: 'var(--sr-muted)', fontSize: 11, margin: '6px 0 0' }}>Used to log in to My Requests. Never shown publicly.</p>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 18 }}>
          <Label text="Phone (shared only when a request is accepted)" />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
              style={{ background: 'var(--sr-input)', border: '1px solid var(--sr-border)', borderRadius: 8, color: 'var(--sr-text)', padding: '0 10px', fontSize: 14, outline: 'none', flexShrink: 0, height: 48 }}>
              {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="Optional" inputMode="tel" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <p style={{ color: 'var(--sr-muted)', fontSize: 11, margin: '6px 0 0' }}>Hidden from public. Revealed only when both parties accept.</p>
        </div>

        {/* Level */}
        <div style={{ marginBottom: 18 }}>
          <Label text="Level *" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{ ...pill(level === l), textTransform: 'capitalize' }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Surface */}
        <div style={{ marginBottom: 18 }}>
          <Label text="Surfaces *" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SURFACES.map(s => <button key={s} onClick={() => toggleSurface(s)} style={pill(surfaces.includes(s))}>{s}</button>)}
          </div>
        </div>

        {/* Play type */}
        {role === 'player' && (
          <div style={{ marginBottom: 18 }}>
            <Label text="Play type *" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLAY_TYPES.map(pt => (
                <button key={pt.value} onClick={() => setPlayType(pt.value)}
                  style={{ ...pill(playType === pt.value), textAlign: 'left', padding: '10px 14px' }}>
                  {pt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coach fields */}
        {role === 'coach' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <Label text="I train" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COACHING_LEVELS.map(l => (
                  <button key={l} onClick={() => setCoachingLevel(l)} style={pill(coachingLevel === l)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <Label text="Sessions" />
              <div style={{ display: 'flex', gap: 8 }}>
                {COACHING_FEES.map(f => (
                  <button key={f} onClick={() => setCoachingFee(f)} style={pill(coachingFee === f)}>{f}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Fav players */}
        <div style={{ marginBottom: 18 }}>
          <Label text="Favourite players (who do you watch?)" />
          <input value={favPlayers} onChange={e => setFavPlayers(e.target.value)}
            placeholder="e.g. Federer, Nadal, Djokovic" style={inputStyle} />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <Label text="Bio" />
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            placeholder={role === 'coach' ? 'Your coaching background, style, what you offer…' : 'Tell others about your game, preferred times, anything useful…'}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, height: 'auto', paddingTop: 12, paddingBottom: 12 }} />
        </div>

        {/* Availability */}
        <div style={{ marginBottom: 28 }}>
          <Label text="Availability" />
          <div style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 10, padding: 14, overflowX: 'auto' }}>
            <div style={{ minWidth: 320 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                <div />
                {['mon','tue','wed','thu','fri','sat','sun'].map(d => (
                  <div key={d} style={{ textAlign: 'center', color: 'var(--sr-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{d}</div>
                ))}
              </div>
              {TIMES.map(t => (
                <div key={t} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                  <div style={{ color: 'var(--sr-muted)', fontSize: 10, fontWeight: 600, textTransform: 'capitalize', paddingTop: 9 }}>{t}</div>
                  {DAYS.map(d => {
                    const key: AvailKey = `${d}-${t}`
                    return <button key={d} onClick={() => toggleAvail(d, t)}
                      style={{ height: 32, borderRadius: 4, border: 'none', cursor: 'pointer', background: avail.has(key) ? 'var(--sr-accent)' : 'var(--sr-input)' }} />
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {alreadyExists && (
          <div style={{ background: 'var(--sr-success)', border: '1px solid var(--sr-succ-t)', borderRadius: 12, padding: '18px 16px', marginBottom: 16 }}>
            <p style={{ color: 'var(--sr-succ-t)', fontWeight: 800, fontSize: 15, margin: '0 0 6px' }}>You already have a profile</p>
            <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: '0 0 16px' }}>Sign in to access your requests and profile.</p>
            <button onClick={() => router.push('/sparring/login')}
              style={{ background: 'var(--sr-accent)', border: 'none', borderRadius: 8, color: 'var(--sr-on-acc)', fontWeight: 900, fontSize: 14, padding: '11px 20px', cursor: 'pointer' }}>
              Sign in →
            </button>
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--sr-danger)', border: '1px solid var(--sr-dang-t)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ color: 'var(--sr-dang-t)', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Sticky submit */}
      {!alreadyExists && (
        <div className="sr-cta" style={{ padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', maxWidth: 540, margin: '0 auto' }}>
          <button onClick={submit} disabled={!emailVerified || creating}
            style={{
              width: '100%', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 16, padding: '16px', letterSpacing: -0.3,
              background: emailVerified && !creating ? 'var(--sr-accent)' : 'var(--sr-card)',
              color: emailVerified && !creating ? 'var(--sr-on-acc)' : 'var(--sr-muted)',
              cursor: emailVerified && !creating ? 'pointer' : 'not-allowed',
            }}>
            {creating ? 'Creating profile…' : emailVerified ? `Create ${role === 'coach' ? 'Coach' : 'Player'} Profile` : 'Verify your email first'}
          </button>
        </div>
      )}
    </SparringShell>
  )
}
