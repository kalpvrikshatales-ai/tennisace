import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TennisAce — Feel every match. Live.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          background: '#000000',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid lines for court feel */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,200,117,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,117,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#00C875', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>🎾</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: 'white', letterSpacing: -2 }}>
              Tennis<span style={{ color: '#00C875' }}>Ace</span>
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' }}>
          Feel every match. Live.
        </div>

        {/* Mock match card */}
        <div style={{
          marginTop: 48, background: 'rgba(255,255,255,0.05)',
          borderRadius: 16, padding: '24px 40px',
          border: '1px solid rgba(0,200,117,0.3)',
          display: 'flex', flexDirection: 'column', gap: 12, minWidth: 480,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 }}>Wimbledon · QF</span>
            <span style={{ fontSize: 12, color: '#00C875', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>● LIVE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: 22, fontWeight: 700 }}>
            <span>🎾 Djokovic</span>
            <span style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: '#00C875', fontSize: 14, background: 'rgba(0,200,117,0.15)', padding: '2px 10px', borderRadius: 6, alignSelf: 'center' }}>40</span>
              <span>6</span><span>3</span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: 22, fontWeight: 700 }}>
            <span>Alcaraz</span>
            <span style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '2px 10px', alignSelf: 'center' }}>15</span>
              <span>4</span><span>2</span>
            </span>
          </div>
        </div>

        {/* URL */}
        <div style={{ marginTop: 40, fontSize: 18, color: 'rgba(255,255,255,0.25)', letterSpacing: 3 }}>
          tennisace.live
        </div>
      </div>
    ),
    { ...size }
  )
}
