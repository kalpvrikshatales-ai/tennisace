import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Session refresh via @supabase/ssr disabled — client-side supabase-js handles auth.
// Middleware kept as a no-op so we can re-enable it later without removing the file.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
