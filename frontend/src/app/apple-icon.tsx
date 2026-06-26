import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 40,
      }}>
        <div style={{
          fontSize: 52, fontWeight: 900, fontFamily: 'sans-serif',
          letterSpacing: -2, display: 'flex',
        }}>
          <span style={{ color: '#0F172A' }}>Tennis</span>
          <span style={{ color: '#00C875' }}>Ace</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
