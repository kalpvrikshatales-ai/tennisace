'use client'

import { useEffect } from 'react'

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Register SW
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Check for updates every 60 seconds
      setInterval(() => reg.update(), 60_000)
    }).catch(() => {})

    // When SW sends SW_UPDATED message → reload to get new version
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'SW_UPDATED') {
        window.location.reload()
      }
    })

    // When a new SW takes control (controller changes) → reload
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  return null
}
