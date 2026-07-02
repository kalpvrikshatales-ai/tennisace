'use client'

import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      onComplete()
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,200,117,0.25)]">
          <img src="/logo.png" alt="TennisAce" className="w-full h-full object-cover" />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Tennis<span className="text-[#00C875]">Ace</span>
          </h1>
          <p className="mt-1 text-[11px] text-gray-500 tracking-widest uppercase">
            Feel every match. Live.
          </p>
        </div>

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
