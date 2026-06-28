// This file is required for Sentry to work in Next.js 14+
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    await import('../sentry.server.config')
  } else {
    // Client-side initialization
    await import('../sentry.client.config')
  }
}
