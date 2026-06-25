import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', background: '#0B1F3A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 4,
    }}>
      {/* Tennis ball */}
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'linear-gradient(135deg, #00C875 0%, #00a862 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', boxShadow: '0 4px 24px rgba(0,200,117,0.4)',
      }}>
        {/* Court lines on ball */}
        <div style={{
          position: 'absolute', top: '50%', left: '10%', right: '10%',
          height: 3, background: 'rgba(255,255,255,0.6)',
          borderRadius: 2, transform: 'translateY(-50%) rotate(-15deg)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '15%', right: '15%',
          height: 2, background: 'rgba(255,255,255,0.35)',
          borderRadius: 2, transform: 'rotate(15deg)',
        }} />
        <div style={{
          position: 'absolute', top: '65%', left: '15%', right: '15%',
          height: 2, background: 'rgba(255,255,255,0.35)',
          borderRadius: 2, transform: 'rotate(-15deg)',
        }} />
      </div>
      {/* Wordmark */}
      <div style={{
        fontSize: 24, fontWeight: 800, color: 'white',
        letterSpacing: -1, marginTop: 8,
      }}>
        Tennis<span style={{ color: '#00C875' }}>Ace</span>
      </div>
    </div>,
    { ...size }
  )
}
