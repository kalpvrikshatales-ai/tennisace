'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const WIMBLEDON_START = new Date('2026-06-29T10:00:00Z') // Monday 29 June 2026

function getTimeLeft() {
  const now = new Date()
  const diff = WIMBLEDON_START.getTime() - now.getTime()
  if (diff <= 0) return null
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export default function WimbledonBanner() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(t)
  }, [])

  // Don't show banner after Wimbledon starts or more than 30 days before
  if (!timeLeft || timeLeft.days > 30) return null

  const Unit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black text-white tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-white/60 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )

  const Divider = () => (
    <span className="text-xl font-bold text-[#00C875]/60 pb-3">:</span>
  )

  return (
    <Link href="/wimbledon">
    <div className="mb-5 rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-95 transition-opacity"
      style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 60%, #15803D 100%)' }}>
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 14px)' }}
      />

      <div className="relative px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div>
              <p className="text-sm font-black text-white tracking-tight">Wimbledon 2026</p>
              <p className="text-[10px] text-white/70">The Championships · All England Club</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {timeLeft.days === 0 ? 'Tomorrow!' : `${timeLeft.days}d away`}
          </span>
        </div>

        {/* Countdown */}
        <div className="flex items-end justify-center gap-3 py-1">
          <Unit value={timeLeft.days} label="days" />
          <Divider />
          <Unit value={timeLeft.hours} label="hrs" />
          <Divider />
          <Unit value={timeLeft.minutes} label="min" />
          <Divider />
          <Unit value={timeLeft.seconds} label="sec" />
        </div>

        {/* Bottom line */}
        <p className="text-center text-[10px] text-white/60 mt-3">
          Jun 30 – Jul 13 · Grass · SW19 London
        </p>
      </div>
    </div>
    </Link>
  )
}
