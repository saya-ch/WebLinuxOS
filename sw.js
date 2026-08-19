const CACHE_NAME = 'weblinuxos-v77'
const BASE_PATH = new URL(self.registration.scope || '/WebLinuxOS/').pathname

const CACHE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'favicon.svg',
  BASE_PATH + 'icons.svg',
  BASE_PATH + '404.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS)
    }).then(() => {
      self.skipWaiting()
    }).catch(() => {
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

  // Skip caching for API calls and external resources
  const url = new URL(request.url)
  const isExternal = !url.origin.startsWith(self.location.origin)
  if (isExternal) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          }).catch(() => {})
        }
        return networkResponse
      }).catch(() => {
        if (cachedResponse) {
          return cachedResponse
        }

        if (request.url.match(/\.(js|css|svg|png|jpg|jpeg|gif|webp|json|woff2?)$/)) {
          return new Response(null, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          })
        }

        if (request.mode === 'navigate') {
          return caches.match(BASE_PATH + 'index.html')
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