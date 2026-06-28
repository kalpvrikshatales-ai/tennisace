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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-[#00C875] opacity-5 -top-20 -left-20 blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full bg-[#00C875] opacity-5 -bottom-20 -right-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Animated logo */}
        <div className="animate-bounce">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00C875] to-[#00a860] flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🎾</span>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="mt-6 text-3xl font-black text-white tracking-tight">
          TennisAce
        </h1>
        <p className="mt-2 text-sm text-gray-400 tracking-widest uppercase font-semibold">
          Professional Tennis Insights
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
