import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', background: '#000000',
      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: '2.5px solid #00C875', display: 'flex', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: '2px', background: '#00C875', transform: 'translateY(-50%) rotate(-20deg)',
        }} />
      </div>
    </div>,
    { ...size }
  )
}
