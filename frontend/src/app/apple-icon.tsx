import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', background: '#0B1F3A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00C875 0%, #00a862 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(0,200,117,0.4)',
        }}>
          <div style={{
            width: 60, height: 4, background: 'rgba(255,255,255,0.6)',
            borderRadius: 2, transform: 'rotate(-20deg)',
            display: 'flex',
          }} />
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: 'white',
          letterSpacing: -1, marginTop: 10, display: 'flex',
        }}>
          Tennis<span style={{ color: '#00C875' }}>Ace</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
