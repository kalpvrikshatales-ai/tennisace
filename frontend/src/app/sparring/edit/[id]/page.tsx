'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SparringShell from '../../SparringShell'
import CityPicker from '@/components/CityPicker'
import BackButton from '@/components/BackButton'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
const BUCKET  = 'sparring-photos'

const LEVELS     = ['beginner', 'intermediate', 'advanced', 'competitive']
const SURFACES   = ['Hard', 'Clay', 'Grass', 'Indoor']
const PLAY_TYPES = [
  { value: 'rally',      label: '🎯 Rally only'           },
  { value: 'match_play', label: '🏆 Match play'           },
  { value: 'drills',     label: '🔄 Drills'               },
  { value: 'both',       label: '⚡ Both rally & matches' },
]
const COACHING_LEVELS = ['Beginners', 'Intermediate', 'Advanced', 'All levels']
const COACHING_FEES   = ['Free', 'Paid']
const HAND_OPTS   = ['Right', 'Left']
const BACK_OPTS   = ['One-handed', 'Two-handed']
const STYLE_OPTS  = ['Baseline', 'Serve & Volley', 'All-Court', 'Defensive']
const DAYS  = ['mon','tue','wed','thu','fri','sat','sun'] as const
const TIMES = ['morning','afternoon','evening'] as const
const DAY_LABEL: Record<string, string> = { mon:'M', tue:'T', wed:'W', thu:'T', fri:'F', sat:'S', sun:'S' }

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
  return <p style={{ color: 'var(--sr-muted)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</p>
}

function Section({ title }: { title: string }) {
  return (
    <div style={{ borderBottom: '1px solid var(--sr-border)', paddingBottom: 8, marginBottom: 20, marginTop: 28 }}>
      <p style={{ color: 'var(--sr-text)', fontSize: 15, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>{title}</p>
    </div>
  )
}

export default function EditSparringPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')

  const [role,          setRole]          = useState<'player'|'coach'|''>('')
  const [name,          setName]          = useState('')
  const [city,          setCity]          = useState('')
  const [country,       setCountry]       = useState('')
  const [bio,           setBio]           = useState('')
  const [favPlayers,    setFavPlayers]    = useState('')
  const [level,         setLevel]         = useState('')
  const [surfaces,      setSurfaces]      = useState<string[]>([])
  const [playType,      setPlayType]      = useState('')
  const [playStyle,     setPlayStyle]     = useState('')
  const [dominantHand,  setDominantHand]  = useState('')
  const [backhand,      setBackhand]      = useState('')
  const [yearsPlaying,  setYearsPlaying]  = useState('')
  const [coachingLevel, setCoachingLevel] = useState('')
  const [coachingFee,   setCoachingFee]   = useState('')
  const [avail,         setAvail]         = useState<Set<AvailKey>>(new Set())
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null)
  const [photoFile,     setPhotoFile]     = useState<File | null>(null)
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null)

  const load = useCallback(async () => {
    const ownId = localStorage.getItem('sparring_profile_id')
    if (ownId !== id) { router.replace(`/sparring/${id}`); return }

    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/sparring/profiles/${id}`)
      if (!res.ok) { router.replace('/sparring'); return }
      const p = await res.json()

      setRole(p.role ?? 'player')
      setName(p.name ?? '')
      setCity(p.city ?? '')
      setCountry(p.country ?? '')
      setBio(p.bio ?? '')
      setFavPlayers(p.favorite_players ?? '')
      setLevel(p.level ?? '')
      setSurfaces(p.surface ?? [])
      setPlayType(p.play_type ?? '')
      setPlayStyle(p.play_style ?? '')
      setDominantHand(p.dominant_hand ?? '')
      setBackhand(p.backhand ?? '')
      setYearsPlaying(p.years_playing != null ? String(p.years_playing) : '')
      setCoachingLevel(p.coaching_level ?? '')
      setCoachingFee(p.coaching_fee ?? '')
      setExistingPhoto(p.photo_url ?? null)
      setPhotoPreview(p.photo_url ?? null)

      const slots = new Set<AvailKey>()
      ;(p.availability ?? []).forEach((a: any) => slots.add(`${a.day}-${a.time}` as AvailKey))
      setAvail(slots)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

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

  async function uploadPhoto(file: File): Promise<string> {
    if (!supabase) throw new Error('Storage not configured')
    const ext      = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}.${ext}`
    const path     = `avatars/${id}/${filename}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  function validate(): string | null {
    if (!role)              return 'Select Player or Coach'
    if (!name.trim())       return 'Name is required'
    if (!city.trim())       return 'City is required'
    if (!country.trim())    return 'Country is required'
    if (!level)             return 'Select a level'
    if (surfaces.length === 0) return 'Select at least one surface'
    return null
  }

  async function save() {
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setSaving(true)

    try {
      let photo_url: string | undefined
      if (photoFile) {
        setUploading(true)
        photo_url = await uploadPhoto(photoFile)
        setUploading(false)
      }

      const availability = Array.from(avail).map(key => {
        const [day, time] = key.split('-'); return { day, time }
      })

      const body: Record<string, unknown> = {
        name: name.trim(), city: city.trim(), country: country.trim(), role,
        bio: bio.trim() || null,
        favorite_players: favPlayers.trim() || null,
        level, surface: surfaces,
        play_type:      playType      || null,
        play_style:     playStyle     || null,
        dominant_hand:  dominantHand  || null,
        backhand:       backhand      || null,
        years_playing:  yearsPlaying  ? parseInt(yearsPlaying) : null,
        coaching_level: role === 'coach' ? coachingLevel || null : null,
        coaching_fee:   role === 'coach' ? coachingFee   || null : null,
        availability,
      }
      if (photo_url) body.photo_url = photo_url

      const res = await fetch(`${BACKEND}/sparring/profiles/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Failed to save') }
      router.push(`/sparring/${id}`)
    } catch (e: any) {
      setError(e.message)
      setUploading(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SparringShell>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--sr-border)', borderTopColor: 'var(--sr-accent)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </SparringShell>
    )
  }

  if (saving) {
    return (
      <SparringShell>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <p style={{ color: 'var(--sr-text)', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>Saving your profile…</p>
            <p style={{ color: 'var(--sr-muted)', fontSize: 14 }}>{uploading ? 'Uploading photo…' : 'Almost done'}</p>
          </div>
        </div>
      </SparringShell>
    )
  }

  return (
    <SparringShell>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 0' }}>
        <BackButton />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ color: 'var(--sr-text)', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>Edit Profile</h1>
            <p style={{ color: 'var(--sr-muted)', fontSize: 13, margin: 0 }}>Changes are visible on your public profile</p>
          </div>
          <Link href={`/sparring/${id}`} style={{ color: 'var(--sr-muted)', fontSize: 13, textDecoration: 'none', fontWeight: 700 }}>Cancel</Link>
        </div>

        {/* Role */}
        <Section title="Role" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {(['player', 'coach'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: '16px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              border: role === r ? 'none' : '1px solid var(--sr-border)',
              background: role === r ? 'var(--sr-accent)' : 'var(--sr-card)',
              color: role === r ? 'var(--sr-on-acc)' : 'var(--sr-muted)',
              fontWeight: 900, fontSize: 16, letterSpacing: -0.3, minHeight: 56,
            }}>
              {r === 'player' ? '🎾 Player' : '🎓 Coach'}
            </button>
          ))}
        </div>

        {/* Photo */}
        <Section title="Photo" />
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={() => fileRef.current?.click()}
            style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sr-card)', border: '2px dashed var(--sr-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
            {photoPreview
              ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'var(--sr-muted)', fontSize: 24, fontWeight: 900 }}>{(name[0] ?? '?').toUpperCase()}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          <div>
            <button onClick={() => fileRef.current?.click()} style={{ background: 'var(--sr-card)', border: '1px solid var(--sr-border)', borderRadius: 8, color: 'var(--sr-text-2)', fontSize: 13, fontWeight: 700, padding: '8px 14px', cursor: 'pointer', marginRight: 8 }}>
              Change photo
            </button>
            {photoPreview && photoPreview !== existingPhoto && (
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(existingPhoto) }}
                style={{ background: 'none', border: 'none', color: 'var(--sr-muted)', fontSize: 12, cursor: 'pointer' }}>
                Undo
              </button>
            )}
            <p style={{ color: 'var(--sr-muted)', fontSize: 11, margin: '6px 0 0' }}>JPG, PNG — max 5MB</p>
          </div>
        </div>

        {/* Basic info */}
        <Section title="Basic info" />
        <div style={{ marginBottom: 18 }}>
          <Label text="Name *" />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <CityPicker
            label="City *"
            required
            value={city && country ? `${city}, ${country}` : undefined}
            onChange={({ city: c, country: co }) => { setCity(c); setCountry(co) }}
          />
          {country && (
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: '5px 0 0' }}>{country}</p>
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label text="Bio" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A few words about your game…" rows={3}
            style={{ ...inputStyle, resize: 'vertical', height: 'auto', paddingTop: 12, paddingBottom: 12 }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label text="Favourite players" />
          <input value={favPlayers} onChange={e => setFavPlayers(e.target.value)} placeholder="e.g. Federer, Djokovic" style={inputStyle} />
        </div>

        {/* Tennis profile */}
        <Section title="Tennis profile" />
        <div style={{ marginBottom: 18 }}>
          <Label text="Level *" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{ ...pill(level === l), textTransform: 'capitalize' }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <Label text="Surface(s) *" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SURFACES.map(s => (
              <button key={s} onClick={() => toggleSurface(s)} style={pill(surfaces.includes(s))}>{s}</button>
            ))}
          </div>
        </div>

        {role !== 'coach' && (
          <div style={{ marginBottom: 18 }}>
            <Label text="Play type" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLAY_TYPES.map(pt => (
                <button key={pt.value} onClick={() => setPlayType(pt.value)} style={{ ...pill(playType === pt.value), textAlign: 'left' }}>
                  {pt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <Label text="Dominant hand" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {HAND_OPTS.map(h => <button key={h} onClick={() => setDominantHand(h)} style={pill(dominantHand === h)}>{h}</button>)}
            </div>
          </div>
          <div>
            <Label text="Backhand" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {BACK_OPTS.map(b => <button key={b} onClick={() => setBackhand(b)} style={{ ...pill(backhand === b), fontSize: 12 }}>{b}</button>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <Label text="Play style" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STYLE_OPTS.map(s => <button key={s} onClick={() => setPlayStyle(s)} style={{ ...pill(playStyle === s), fontSize: 12 }}>{s}</button>)}
            </div>
          </div>
          <div>
            <Label text="Years playing" />
            <input type="number" min="0" max="50" value={yearsPlaying} onChange={e => setYearsPlaying(e.target.value)}
              placeholder="e.g. 5" style={inputStyle} />
          </div>
        </div>

        {role === 'coach' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <Label text="Who do you train?" />
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

        {/* Availability */}
        <Section title="Availability" />
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <div style={{ minWidth: 320 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
              <div />
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', color: 'var(--sr-muted)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                  {DAY_LABEL[d]}
                </div>
              ))}
            </div>
            {TIMES.map(t => (
              <div key={t} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                <div style={{ color: 'var(--sr-muted)', fontSize: 10, fontWeight: 700, textTransform: 'capitalize', paddingTop: 8 }}>{t}</div>
                {DAYS.map(d => {
                  const key: AvailKey = `${d}-${t}`
                  const on = avail.has(key)
                  return (
                    <button key={d} onClick={() => toggleAvail(d, t)} style={{
                      height: 34, borderRadius: 4, cursor: 'pointer',
                      background: on ? 'var(--sr-accent)' : 'var(--sr-input)',
                      border: `1px solid ${on ? 'var(--sr-accent)' : 'var(--sr-border)'}`,
                    }} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'var(--sr-danger)', border: '1px solid var(--sr-dang-t)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ color: 'var(--sr-dang-t)', fontSize: 14, fontWeight: 700, margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Sticky save */}
      <div className="sr-cta" style={{ padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', maxWidth: 540, margin: '0 auto' }}>
        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '16px', borderRadius: 10, border: 'none',
          background: 'var(--sr-accent)', color: 'var(--sr-on-acc)', fontWeight: 900, fontSize: 16,
          cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: -0.3,
          opacity: saving ? 0.6 : 1,
        }}>
          Save changes
        </button>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link href={`/sparring/${id}`} style={{ color: 'var(--sr-muted)', fontSize: 13, textDecoration: 'none' }}>
            Cancel — back to profile
          </Link>
        </div>
      </div>
    </SparringShell>
  )
}
