import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TennisAce — Find tennis players and coaches near you'
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
        {/* Grid lines for court feel — two separate single-gradient layers, each with an explicit
            direction. Satori's CSS parser requires a direction/angle as the first arg — omitting
            it (defaulting to "to bottom" like real CSS) crashes the parser. */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to bottom, rgba(0,200,117,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(90deg, rgba(0,200,117,0.04) 1px, transparent 1px)',
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
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textAlign: 'center' }}>
          Find tennis players &amp; coaches near you
        </div>

        {/* Connect card */}
        <div style={{
          marginTop: 48, background: 'rgba(255,255,255,0.05)',
          borderRadius: 16, padding: '28px 40px',
          border: '1px solid rgba(0,200,117,0.3)',
          display: 'flex', alignItems: 'center', gap: 24, minWidth: 480,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(0,200,117,0.15)', border: '2px solid #00C875',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>🎾</div>
            <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>You</span>
          </div>
          <div style={{ fontSize: 28, color: '#00C875' }}>🤝</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>🎾</div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700 }}>A player near you</span>
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
