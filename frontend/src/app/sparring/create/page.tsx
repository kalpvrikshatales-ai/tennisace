'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

const LEVELS    = ['beginner', 'intermediate', 'advanced', 'competitive']
const SURFACES  = ['Hard', 'Clay', 'Grass', 'Indoor']
const PLAY_TYPES = [
  { value: 'rally',      label: '🎯 Rally only' },
  { value: 'match_play', label: '🏆 Match play' },
  { value: 'drills',     label: '🔄 Drills' },
  { value: 'both',       label: '⚡ Both rally & matches' },
]
const DAYS  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const TIMES = ['morning', 'afternoon', 'evening'] as const

type AvailKey = `${typeof DAYS[number]}-${typeof TIMES[number]}`

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

const label = (text: string) => (
  <p style={{ color: '#aaa', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
    {text}
  </p>
)

export default function CreateSparringPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

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
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  function toggleSurface(s: string) {
    setSurfaces(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function toggleAvail(d: typeof DAYS[number], t: typeof TIMES[number]) {
    const key: AvailKey = `${d}-${t}`
    setAvail(prev => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(file: File): Promise<string> {
    if (!supabase) throw new Error('Storage not configured')
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('sparring-photos').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('sparring-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function submit() {
    if (!name.trim() || !city.trim() || !country.trim() || !level || !playType) {
      setError('Please fill in all required fields.')
      return
    }
    if (surfaces.length === 0) {
      setError('Select at least one surface.')
      return
    }

    setSaving(true); setError('')

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          country: country.trim(),
          bio:  bio.trim() || undefined,
          level,
          surface: surfaces,
          play_type: playType,
          photo_url,
          availability,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail ?? 'Failed to create profile')
      }

      const profile = await res.json()
      router.push(`/sparring/${profile.id}`)
    } catch (e: any) {
      setError(e.message)
      setUploading(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px' }}>
        {/* Header */}
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
              overflow: 'hidden', cursor: 'pointer', position: 'relative',
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
          {label('Name *')}
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" style={inputStyle} />
        </div>

        {/* City + Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            {label('City *')}
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="e.g. London" style={inputStyle} />
          </div>
          <div>
            {label('Country *')}
            <input value={country} onChange={e => setCountry(e.target.value)}
              placeholder="e.g. UK" style={inputStyle} />
          </div>
        </div>

        {/* Level */}
        <div style={{ marginBottom: 18 }}>
          {label('Level *')}
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
          {label('Surfaces *')}
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
          {label('Play type *')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLAY_TYPES.map(pt => (
              <button key={pt.value} onClick={() => setPlayType(pt.value)} style={{
                ...pill(playType === pt.value),
                textAlign: 'left',
                padding: '10px 14px',
              }}>
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          {label('Bio')}
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell others about your game, preferred times, anything useful…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Availability */}
        <div style={{ marginBottom: 28 }}>
          {label('Availability')}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: 14 }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              <div />
              {DAYS.map(d => (
                <div key={d} style={{
                  textAlign: 'center', color: '#555', fontSize: 10,
                  fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {d}
                </div>
              ))}
            </div>
            {TIMES.map(t => (
              <div key={t} style={{
                display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4, marginBottom: 4,
              }}>
                <div style={{
                  color: '#555', fontSize: 10, fontWeight: 600,
                  textTransform: 'capitalize', paddingTop: 9,
                }}>
                  {t}
                </div>
                {DAYS.map(d => {
                  const key: AvailKey = `${d}-${t}`
                  const on = avail.has(key)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleAvail(d, t)}
                      style={{
                        height: 32, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: on ? '#39FF14' : '#1a1a1a',
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 6,
            padding: '10px 14px', marginBottom: 16,
          }}>
            <p style={{ color: '#e87070', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={saving}
          style={{
            width: '100%', background: saving ? '#333' : '#39FF14', border: 'none', borderRadius: 8,
            color: saving ? '#666' : '#000', fontWeight: 900, fontSize: 16, padding: '16px',
            cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: -0.3,
          }}
        >
          {uploading ? 'Uploading photo…' : saving ? 'Creating profile…' : 'Create Profile'}
        </button>
      </div>
    </div>
  )
}
