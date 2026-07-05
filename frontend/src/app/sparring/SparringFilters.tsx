'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'competitive']
const SURFACES = ['Hard', 'Clay', 'Grass', 'Indoor']
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const TIMES = ['morning', 'afternoon', 'evening']

export default function SparringFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const push = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  const toggle = useCallback((key: string, value: string) => {
    const cur = params.get(key)
    push(key, cur === value ? null : value)
  }, [params, push])

  const city    = params.get('city') ?? ''
  const level   = params.get('level') ?? ''
  const surface = params.get('surface') ?? ''
  const day     = params.get('day') ?? ''
  const time    = params.get('time') ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* City search */}
      <input
        type="text"
        placeholder="Search by city…"
        defaultValue={city}
        onChange={e => {
          const v = e.target.value.trim()
          push('city', v || null)
        }}
        style={{
          background: '#111', border: '1px solid #222', borderRadius: 6,
          color: '#fff', padding: '10px 14px', fontSize: 14, outline: 'none',
          width: '100%', boxSizing: 'border-box',
        }}
      />

      {/* Level pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <button
            key={l}
            onClick={() => toggle('level', l)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              border: level === l ? 'none' : '1px solid #333',
              background: level === l ? '#39FF14' : '#111',
              color: level === l ? '#000' : '#aaa',
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Surface pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SURFACES.map(s => (
          <button
            key={s}
            onClick={() => toggle('surface', s)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              border: surface === s ? 'none' : '1px solid #333',
              background: surface === s ? '#39FF14' : '#111',
              color: surface === s ? '#000' : '#aaa',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Day + time row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DAYS.map(d => (
          <button
            key={d}
            onClick={() => toggle('day', d)}
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              border: day === d ? 'none' : '1px solid #333',
              background: day === d ? '#39FF14' : '#111',
              color: day === d ? '#000' : '#aaa',
              cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {d}
          </button>
        ))}
        <div style={{ width: 1, background: '#222', margin: '0 4px' }} />
        {TIMES.map(t => (
          <button
            key={t}
            onClick={() => toggle('time', t)}
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              border: time === t ? 'none' : '1px solid #333',
              background: time === t ? '#39FF14' : '#111',
              color: time === t ? '#000' : '#aaa',
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Clear all */}
      {(city || level || surface || day || time) && (
        <button
          onClick={() => router.push(pathname)}
          style={{
            alignSelf: 'flex-start', background: 'transparent', border: 'none',
            color: '#555', fontSize: 12, cursor: 'pointer', padding: 0,
          }}
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  )
}
