'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button onClick={() => router.back()} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      color: '#7a9cc4', fontSize: '13px', fontWeight: 500,
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '8px 0', marginBottom: '16px'
    }}>
      ← Back
    </button>
  )
}
