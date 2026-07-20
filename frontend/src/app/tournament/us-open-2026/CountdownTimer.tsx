'use client'

import { useState, useEffect } from 'react'

const TARGET = new Date('2026-08-25T11:00:00-04:00') // US Open first day, 11am ET

export default function CountdownTimer() {
  const [diff, setDiff] = useState<number | null>(null)

  useEffect(() => {
    function update() {
      setDiff(Math.max(0, TARGET.getTime() - Date.now()))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (diff === null) return null
  if (diff === 0) return (
    <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 13 }}>🎾 Tournament is live!</span>
  )

  const days    = Math.floor(diff / 86_400_000)
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)

  const unit = (v: number, label: string) => (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {String(v).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {unit(days, 'days')}
      <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 20, paddingTop: 2 }}>:</div>
      {unit(hours, 'hrs')}
      <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 20, paddingTop: 2 }}>:</div>
      {unit(minutes, 'min')}
      <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 20, paddingTop: 2 }}>:</div>
      {unit(seconds, 'sec')}
    </div>
  )
}
