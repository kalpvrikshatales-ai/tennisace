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
      <span className="text-2xl font-black text-gray-900 tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )

  const Divider = () => (
    <span className="text-xl font-bold text-[#00C875]/60 pb-3">:</span>
  )

  return (
    <Link href="/wimbledon">
    <div className="mb-5 rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity">
      {/* Grass green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a1a] via-[#0d2b0d] to-[#0B1F3A] opacity-95" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,200,117,0.3) 0px, rgba(0,200,117,0.3) 1px, transparent 1px, transparent 12px)' }}
      />

      <div className="relative px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div>
              <p className="text-sm font-black text-gray-900 tracking-tight">Wimbledon 2026</p>
              <p className="text-[10px] text-gray-500">The Championships · All England Club</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[#00C875] bg-[#00C875]/15 px-2 py-1 rounded-full uppercase tracking-wider">
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
        <p className="text-center text-[10px] text-gray-400 mt-3">
          Jun 30 – Jul 13 · Grass · SW19 London
        </p>
      </div>
    </div>
    </Link>
  )
}
