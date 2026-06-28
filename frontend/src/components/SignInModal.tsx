'use client'

import { useEffect } from 'react'
import { signInWithGoogle } from '@/lib/supabase'

interface Props {
  onClose: () => void
}

export default function SignInModal({ onClose }: Props) {
  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSignIn = () => {
    signInWithGoogle(window.location.pathname + window.location.search)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-t-3xl p-6 max-w-lg mx-auto shadow-2xl">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎾</span>
          </div>

          <h2 className="text-[20px] font-black text-gray-900 text-center mb-2">
            Sync your vote
          </h2>
          <p className="text-gray-400 text-[14px] text-center mb-6 leading-relaxed">
            Sign in with Google to sync your votes across all devices and get notified when your favourite players are on court.
          </p>

          {/* Google sign-in */}
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all mb-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-[15px] font-bold text-gray-700">Continue with Google</span>
          </button>

          {/* Skip */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            No thanks, continue without signing in
          </button>
        </div>
      </div>
    </>
  )
}
