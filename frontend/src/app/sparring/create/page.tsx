'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+971',flag: '🇦🇪', label: 'AE' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
]

type AvailKey = `${typeof DAYS[number]}-${typeof TIMES[number]}`
type Step = 'form' | 'otp' | 'creating'

const pill = (active: boolean) => ({
  padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700,
  border: active ? 'none' : '1px solid #333',
  background: active ? '#39FF14' : '#111',
  color: active ? '#000' : '#aaa',
  cursor: 'pointer',
})

const inputStyle = {
  width: '100%', boxSizing: 'border-box' as const,
  background: '#111', border: '1px solid #333', borderRadius: 6,
  color: '#fff', padding: '11px 14px', fontSize: 14, outline: 'none',
}

const labelEl = (text: string) => (
  <p style={{ color: '#aaa', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
    {text}
  </p>
)

export default function CreateSparringPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // Form fields
  const [name,      setName]      = useState('')
  const [city,      setCity]      = useState('')
  const [country,   setCountry]   = useState('')
  const [bio,       setBio]       = useState('')
  const [level,     setLevel]     = useState('')
  const [surfaces,  setSurfaces]  = useState<string[]>([])
  const [playType,  setPlayType]  = useState('')
  const [avail,     setAvail]     = useState<Set<AvailKey>>(new Set())
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Phone
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')

  // OTP flow
  const [step,               setStep]               = useState<Step>('form')
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [otp,                setOtp]                = useState('')
  const [otpError,           setOtpError]           = useState('')
  const [verifying,          setVerifying]          = useState(false)

  // General state
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

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
    if (!name.trim())     return 'Name is required'
    if (!city.trim())     return 'City is required'
    if (!country.trim())  return 'Country is required'
    if (!level)           return 'Select a level'
    if (!playType)        return 'Select a play type'
    if (surfaces.length === 0) return 'Select at least one surface'
    if (!phoneNumber.trim())   return 'Phone number is required'
    return null
  }

  async function sendOtp() {
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setSaving(true)

    try {
      const fullPhone = `${countryCode}${phoneNumber.trim()}`
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier)
      setConfirmationResult(result)
      setStep('otp')
    } catch (e: any) {
      setError(e.message ?? 'Failed to send OTP. Check your number and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadPhoto(file: File): Promise<string> {
    if (!supabase) throw new Error('Storage not configured')
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('sparring-photos').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('sparring-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function createProfile() {
    setStep('creating')
    try {
      let photo_url: string | undefined
      if (photoFile) {
        setUploading(true)
        photo_url = await uploadPhoto(photoFile)
        setUploading(false)
      }

      const availability = Array.from(avail).map(key => {
        const [day, time] = key.split('-')
        return { day, time }
      })

      const res = await fetch(`${BACKEND}/sparring/profiles`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), city: city.trim(), country: country.trim(),
          bio: bio.trim() || undefined, level, surface: surfaces,
          play_type: playType, photo_url,
          phone:          `${countryCode}${phoneNumber.trim()}`,
          phone_verified: true,
          availability,
        }),
      })

      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Failed to create profile') }
      const profile = await res.json()
      router.push(`/sparring/${profile.id}`)
    } catch (e: any) {
      setError(e.message)
      setStep('otp')
      setUploading(false)
    }
  }

  async function verifyOtp() {
    if (!otp.trim() || otp.length < 6) { setOtpError('Enter the 6-digit code'); return }
    setVerifying(true); setOtpError('')
    try {
      await confirmationResult.confirm(otp)
      await createProfile()
    } catch {
      setOtpError('Incorrect code. Try again.')
    } finally {
      setVerifying(false)
    }
  }

  // ── OTP screen ────────────────────────────────────────────────────────────
  if (step === 'otp' || step === 'creating') {
    const fullPhone = `${countryCode}${phoneNumber}`
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
          {step === 'creating' ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>
                Creating your profile…
              </p>
              <p style={{ color: '#555', fontSize: 14 }}>
                {uploading ? 'Uploading photo…' : 'Almost done'}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>
                Verify your number
              </p>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 28px' }}>
                We sent a code to {fullPhone}
              </p>

              {/* 6-digit OTP input */}
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                style={{
                  ...inputStyle,
                  textAlign: 'center', fontSize: 28, fontWeight: 900,
                  letterSpacing: 10, marginBottom: 12,
                }}
              />

              {otpError && (
                <p style={{ color: '#e87070', fontSize: 13, margin: '0 0 12px' }}>{otpError}</p>
              )}

              <button
                onClick={verifyOtp}
                disabled={verifying}
                style={{
                  width: '100%', background: verifying ? '#333' : '#39FF14',
                  border: 'none', borderRadius: 8, color: verifying ? '#666' : '#000',
                  fontWeight: 900, fontSize: 16, padding: '16px', cursor: verifying ? 'not-allowed' : 'pointer',
                  marginBottom: 12,
                }}
              >
                {verifying ? 'Verifying…' : 'Verify & Create Profile'}
              </button>

              <button
                onClick={() => { setStep('form'); setOtp(''); setOtpError('') }}
                style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' }}
              >
                ← Back
              </button>
            </>
          )}
        </div>
        <div id="recaptcha-container" />
      </div>
    )
  }

  // ── Form screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 80 }}>
      <div id="recaptcha-container" />
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>
            Add your profile
          </h1>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
            Let other players find you for a hit
          </p>
        </div>

        {/* Photo upload */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 100, height: 100, borderRadius: '50%',
              background: '#111', border: '2px dashed #333',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer',
            }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#444', fontSize: 13 }}>+ Photo</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          <p style={{ color: '#555', fontSize: 11, margin: '6px 0 0' }}>Optional</p>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          {labelEl('Name *')}
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        </div>

        {/* City + Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            {labelEl('City *')}
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={inputStyle} />
          </div>
          <div>
            {labelEl('Country *')}
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. India" style={inputStyle} />
          </div>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 18 }}>
          {labelEl('Phone number * (for contact reveal)')}
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              style={{
                background: '#111', border: '1px solid #333', borderRadius: 6,
                color: '#fff', padding: '11px 10px', fontSize: 14, outline: 'none',
                flexShrink: 0,
              }}
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Phone number"
              inputMode="tel"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <p style={{ color: '#444', fontSize: 11, margin: '6px 0 0' }}>
            Hidden from public. Only shared when a request is accepted.
          </p>
        </div>

        {/* Level */}
        <div style={{ marginBottom: 18 }}>
          {labelEl('Level *')}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{ ...pill(level === l), textTransform: 'capitalize' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Surface */}
        <div style={{ marginBottom: 18 }}>
          {labelEl('Surfaces *')}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SURFACES.map(s => (
              <button key={s} onClick={() => toggleSurface(s)} style={pill(surfaces.includes(s))}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Play type */}
        <div style={{ marginBottom: 18 }}>
          {labelEl('Play type *')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLAY_TYPES.map(pt => (
              <button key={pt.value} onClick={() => setPlayType(pt.value)}
                style={{ ...pill(playType === pt.value), textAlign: 'left', padding: '10px 14px' }}>
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          {labelEl('Bio')}
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            placeholder="Tell others about your game, preferred times, anything useful…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Availability */}
        <div style={{ marginBottom: 28 }}>
          {labelEl('Availability')}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              <div />
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', color: '#555', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                  {d}
                </div>
              ))}
            </div>
            {TIMES.map(t => (
              <div key={t} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                <div style={{ color: '#555', fontSize: 10, fontWeight: 600, textTransform: 'capitalize', paddingTop: 9 }}>
                  {t}
                </div>
                {DAYS.map(d => {
                  const key: AvailKey = `${d}-${t}`
                  const on = avail.has(key)
                  return (
                    <button key={d} onClick={() => toggleAvail(d, t)} style={{
                      height: 32, borderRadius: 4, border: 'none', cursor: 'pointer',
                      background: on ? '#39FF14' : '#1a1a1a',
                    }} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ color: '#e87070', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <button
          onClick={sendOtp}
          disabled={saving}
          style={{
            width: '100%', background: saving ? '#333' : '#39FF14', border: 'none', borderRadius: 8,
            color: saving ? '#666' : '#000', fontWeight: 900, fontSize: 16, padding: '16px',
            cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: -0.3,
          }}
        >
          {saving ? 'Sending verification code…' : 'Verify & Create Profile'}
        </button>
      </div>
    </div>
  )
}
