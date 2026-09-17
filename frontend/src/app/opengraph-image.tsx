import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TennisAce — Find tennis players and coaches near you'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const ACCENT = '#39FF14'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f1a',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Real court photo backdrop, dimmed */}
        <img
          src="https://tennisace.live/photos/hero-players.jpg"
          width={1200}
          height={630}
          style={{ position: 'absolute', inset: 0, width: 1200, height: 630, objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          background: 'linear-gradient(180deg, rgba(10,15,26,0.55) 0%, rgba(10,15,26,0.92) 100%)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
          }}>🎾</div>
          <span style={{ fontSize: 54, fontWeight: 900, color: 'white', letterSpacing: -2 }}>
            Tennis<span style={{ color: ACCENT }}>Ace</span>
          </span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', display: 'flex', fontSize: 44, fontWeight: 900, color: 'white', letterSpacing: -1, marginBottom: 14 }}>
          Tennis is better <span style={{ color: ACCENT, marginLeft: 14 }}>together.</span>
        </div>

        {/* Tagline */}
        <div style={{ position: 'relative', display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, textAlign: 'center' }}>
          Wherever you play — find players, find coaches, find your city
        </div>

        {/* Chip row */}
        <div style={{ position: 'relative', display: 'flex', gap: 14, marginTop: 32 }}>
          {['🌍 ANY CITY', '🤝 REAL PLAYERS', '🆓 FREE FOREVER'].map(label => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 30, padding: '10px 22px', color: 'rgba(255,255,255,0.8)',
              fontSize: 17, fontWeight: 700, letterSpacing: 0.5,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: 'relative', display: 'flex', marginTop: 36, fontSize: 18, color: 'rgba(255,255,255,0.35)', letterSpacing: 3 }}>
          tennisace.live
        </div>
      </div>
    ),
    { ...size }
  )
}
