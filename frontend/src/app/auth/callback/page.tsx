'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const returnTo = searchParams.get('returnTo') || '/'

    if (!supabase) {
      router.replace(returnTo)
      return
    }

    // Exchange the OAuth code for a session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace(returnTo)
      }
    })

    // Fallback — redirect after 3 seconds regardless
    const t = setTimeout(() => router.replace(returnTo), 3000)
    return () => clearTimeout(t)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[15px] font-semibold text-gray-700">Signing you in...</p>
        <p className="text-[12px] text-gray-400 mt-1">Taking you back to where you were</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  )
}
