'use client'

import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1300)
    const doneTimer = setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 1700)

    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#0a0f1a',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* New logo */}
        <div className="w-28 h-28 rounded-full overflow-hidden shadow-[0_0_60px_rgba(0,200,117,0.2)]">
          <img src="/logo.png" alt="TennisAce" className="w-full h-full object-cover" />
        </div>

        {/* Tagline */}
        <p className="text-[11px] text-gray-500 tracking-widest uppercase">
          Feel every match. Live.
        </p>

        {/* Loading dots */}
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
