'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible,  setVisible]  = useState(true)
  const [entered,  setEntered]  = useState(false)
  const [fading,   setFading]   = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setEntered(true),  60)
    const t2 = setTimeout(() => setFading(true),  1400)
    const t3 = setTimeout(() => { setVisible(false); onComplete() }, 1820)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#0a0f1a',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.42s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Real court photo, dimmed so the logo stays crisp */}
      <Image
        src="/photos/splash-court.jpg"
        alt=""
        fill
        priority
        style={{ objectFit: 'cover', opacity: entered ? 0.4 : 0.15, transition: 'opacity 0.8s ease' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,15,26,0.55) 0%, rgba(10,15,26,0.85) 100%)',
      }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo — spring entrance, green ring, object-contain so full circle shows */}
        <div style={{
          transform: entered ? 'scale(1)' : 'scale(0.68)',
          opacity: entered ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
        }}>
          <div style={{
            width: 112, height: 112, borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(141,214,48,0.22)',
          }}>
            <Image
              src="/logo.png"
              alt="TennisAce"
              width={112}
              height={112}
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Wordmark — fades in slightly after logo */}
        <div style={{
          marginTop: 18, textAlign: 'center',
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.5s ease 0.2s',
        }}>
          <p style={{
            margin: 0, fontSize: 19, fontWeight: 900,
            letterSpacing: '-0.5px', color: '#fff',
          }}>
            TENNIS<span style={{ color: '#8fd630' }}>ACE.</span>
          </p>
          <p style={{
            margin: '5px 0 0', fontSize: 10,
            letterSpacing: '2.5px', color: '#4a6fa5',
            textTransform: 'uppercase',
          }}>
            Find your tennis partner
          </p>
        </div>

        {/* Thin sweep progress bar */}
        <div style={{
          width: 80, height: 2,
          background: '#1e3a5f', borderRadius: 1,
          marginTop: 26, overflow: 'hidden',
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.3s ease 0.3s',
        }}>
          <div style={{
            height: '100%',
            background: '#00C875',
            borderRadius: 1,
            width: entered ? '100%' : '0%',
            transition: 'width 1.25s linear 0.35s',
          }} />
        </div>

      </div>
    </div>
  )
}
