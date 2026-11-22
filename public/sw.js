// Fastop service worker: makes the app installable and keeps it usable offline.
// Registered as /sw.js?dev=1 from the Vite dev server, where it only passes requests through
// so it never serves stale dev modules.
const DEV = new URL(self.location).searchParams.has('dev')
const CACHE = 'fastop-v2'
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.svg']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  if (!DEV) event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (DEV || req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // map tiles, fonts: leave to the browser
  if (url.pathname.startsWith('/api/')) return // account data must always be fresh, never cached

  // Pages: try the network first so updates show up, fall back to the cached app shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Scripts, styles, images: serve from cache when we have them, refresh in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
