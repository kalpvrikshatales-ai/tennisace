'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function AuthHeader() {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  const firstName = (profile?.full_name ?? user?.email ?? '').split(/[\s@]/)[0]
  const avatarUrl = user?.user_metadata?.avatar_url
  const initials = ((profile?.full_name ?? user?.email) || 'U')
    .slice(0, 2)
    .toUpperCase()

  if (!user) {
    return (
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <Link href="/auth/login"
          className="text-[13px] font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm transition-colors">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="hidden md:block fixed top-4 right-4 z-50">
      <Link href="/profile"
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1.5 pr-3 py-1.5 shadow-sm hover:border-gray-300 transition-colors">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#00C875] flex items-center justify-center text-[11px] font-black text-black flex-shrink-0">
            {initials}
          </div>
        )}
        <span className="text-[13px] font-bold text-gray-900 max-w-[120px] truncate">{firstName}</span>
      </Link>
    </div>
  )
}
