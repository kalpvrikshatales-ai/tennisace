'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const LEVELS   = ['beginner', 'intermediate', 'advanced', 'competitive']
const SURFACES = ['Hard', 'Clay', 'Grass', 'Indoor']
const DAYS     = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const TIMES    = ['morning', 'afternoon', 'evening']

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
        border: `1px solid ${active ? 'transparent' : 'var(--sr-border)'}`,
        background: active ? 'var(--sr-accent)' : 'var(--sr-card)',
        color: active ? 'var(--sr-on-acc)' : 'var(--sr-muted)',
        cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36,
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

export default function SparringFilters() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

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
  const hasFilters = city || level || surface || day || time

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* City search */}
      <input
        type="text"
        placeholder="Search by city…"
        defaultValue={city}
        onChange={e => push('city', e.target.value.trim() || null)}
        style={{
          background: 'var(--sr-input)', border: '1px solid var(--sr-border)',
          borderRadius: 10, color: 'var(--sr-text)', padding: '0 14px',
          fontSize: 14, outline: 'none', width: '100%',
          height: 48, boxSizing: 'border-box',
        }}
      />

      {/* All filter pills in one horizontal scroll row */}
      <div className="sr-scroll">
        {LEVELS.map(l => (
          <Pill key={l} label={l} active={level === l} onClick={() => toggle('level', l)} />
        ))}
        <div style={{ width: 1, background: 'var(--sr-border)', flexShrink: 0, margin: '6px 4px' }} />
        {SURFACES.map(s => (
          <Pill key={s} label={s} active={surface === s} onClick={() => toggle('surface', s)} />
        ))}
        <div style={{ width: 1, background: 'var(--sr-border)', flexShrink: 0, margin: '6px 4px' }} />
        {DAYS.map(d => (
          <Pill key={d} label={d.toUpperCase()} active={day === d} onClick={() => toggle('day', d)} />
        ))}
        <div style={{ width: 1, background: 'var(--sr-border)', flexShrink: 0, margin: '6px 4px' }} />
        {TIMES.map(t => (
          <Pill key={t} label={t} active={time === t} onClick={() => toggle('time', t)} />
        ))}
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            style={{
              background: 'transparent', border: '1px solid var(--sr-border)',
              color: 'var(--sr-muted)', fontSize: 12, cursor: 'pointer',
              borderRadius: 20, padding: '6px 12px', whiteSpace: 'nowrap',
              minHeight: 36, flexShrink: 0,
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  )
}
