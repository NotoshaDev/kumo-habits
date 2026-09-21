// Kumo Habits — Service Worker (PWA Offline Engine)
const CACHE_NAME = 'kumo-habits-v1'

const STATIC_PRECACHE = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
]

// 1. Install Phase — precache essential assets resiliently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        for (const url of STATIC_PRECACHE) {
          try {
            await cache.add(url)
          } catch {
            // Ignore single fetch failure during install
          }
        }
      })
      .then(() => self.skipWaiting()),
  )
})

// 2. Activate Phase — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// 3. Fetch Phase — smart network & cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never cache API routes or Supabase backend requests
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase.co') ||
    request.method !== 'GET'
  ) {
    return
  }

  // Static Assets (_next/static, fonts, icons): Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      }),
    )
    return
  }

  // HTML / Page Navigation: Network First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached
            return caches.match('/dashboard')
          })
        }),
    )
    return
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  )
})

// 4. Notification Click — Focus or open Kumo Habits dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      }),
  )
})

// 5. Push Event — Handle incoming web push messages
self.addEventListener('push', (event) => {
  let payload = {
    title: '☁️ Kumo Habits',
    body: '¡Es momento de cuidar tus hábitos de hoy!',
  }

  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload.body = event.data.text()
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'kumo-daily-reminder',
    renotify: true,
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/dashboard' },
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

