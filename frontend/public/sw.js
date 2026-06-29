const CACHE_VERSION = 'ta-v4'
const CACHE_NAME = `tennisace-${CACHE_VERSION}`

// Assets to cache on install
const PRECACHE = ['/']

// ── INSTALL: cache shell, skip waiting immediately ──────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting() // activate new SW immediately without waiting
})

// ── ACTIVATE: delete old caches, take control of all clients ─
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('tennisace-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => clients.claim()) // take control immediately
  )

  // Tell all open tabs a new version is ready → they will reload
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }))
  })
})

// ── FETCH: network-first for HTML, cache-first for assets ────
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== location.origin) return

  // HTML pages: always go to network to get latest
  // (this ensures the PWA always loads fresh JS/CSS on reload)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  // For everything else: cache-first with network fallback
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
        }
        return response
      })
    })
  )
})

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'TennisAce'
  const options = {
    body: data.body ?? 'Live scores updated',
    icon: '/apple-icon',
    badge: '/apple-icon',
    tag: data.tag ?? 'tennisace',
    renotify: true,
    data: { url: data.url ?? '/' },
    actions: [{ action: 'open', title: 'View Scores' }],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
