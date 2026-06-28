'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</h1>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Page error
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Something went wrong on this page. We've been notified.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#22C55E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Try again
          </button>
          <Link href="/">
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#e5e7eb',
              color: '#111827',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}>
              Back home
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
