const CACHE_NAME = 'weblinuxos-v50'
const CACHE_ASSETS = [
  '/WebLinuxOS/',
  '/WebLinuxOS/index.html',
  '/WebLinuxOS/manifest.json',
  '/WebLinuxOS/favicon.svg',
  '/WebLinuxOS/icons.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS)
    }).then(() => {
      self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name.startsWith('weblinuxos-')) {
            return caches.delete(name)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  if (request.url.startsWith('chrome-extension://') ||
      request.url.startsWith('moz-extension://')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone())
          }).catch(() => {})
        }
        return networkResponse
      }).catch(() => {
        if (cachedResponse) {
          return cachedResponse
        }

        if (request.url.match(/\.(js|css|svg|png|jpg|jpeg|gif|webp|json)$/)) {
          return new Response(null, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          })
        }

        if (request.mode === 'navigate') {
          return caches.match('/WebLinuxOS/index.html')
        }
      })

      return cachedResponse || networkFetch
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})