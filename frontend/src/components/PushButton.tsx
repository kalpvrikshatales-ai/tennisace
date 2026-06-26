'use client'

import { useState, useEffect } from 'react'
import { registerPush, isPushSupported, getPushPermission } from '@/lib/push'

export default function PushButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'on' | 'unsupported'>('idle')

  useEffect(() => {
    if (!isPushSupported()) { setState('unsupported'); return }
    const perm = getPushPermission()
    if (perm === 'granted') setState('on')
  }, [])

  if (state === 'unsupported') return null

  const enable = async () => {
    setState('loading')
    const ok = await registerPush()
    setState(ok ? 'on' : 'idle')
  }

  return (
    <button
      onClick={enable}
      disabled={state === 'loading' || state === 'on'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        state === 'on'
          ? 'bg-[#00C875]/15 text-[#00C875] border border-[#00C875]/30'
          : 'bg-gray-50 text-gray-500 hover:text-white hover:bg-gray-100 border border-transparent'
      }`}
      title={state === 'on' ? 'Notifications on' : 'Enable match notifications'}
    >
      {state === 'loading' ? (
        <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          {state === 'on' && <circle cx="19" cy="5" r="4" fill="#00C875" stroke="none" />}
        </svg>
      )}
      {state === 'on' ? 'Notifying' : 'Notify me'}
    </button>
  )
}
