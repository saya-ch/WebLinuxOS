const CACHE_NAME = 'weblinuxos-v135'
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

// 判断是否为静态资源（可安全使用缓存优先策略）
function isStaticAsset(url) {
  return /\.(js|css|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|ico)$/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') return
  if (request.url.startsWith('chrome-extension://') ||
      request.url.startsWith('moz-extension://')) return

  const url = new URL(request.url)
  const isExternal = !url.origin.startsWith(self.location.origin)
  if (isExternal) return

  // 导航请求：Network-First（确保用户获得最新版本）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
        }
        return response
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match(BASE_PATH + 'index.html')
        })
      })
    )
    return
  }

  // 静态资源：Cache-First（Vite 构建时文件名含 hash，天然版本控制）
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
          }
          return response
        }).catch(() => {
          return new Response(null, { status: 503, statusText: 'Offline' })
        })
      })
    )
    return
  }

  // 其他同源请求：Stale-While-Revalidate
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
        return cachedResponse || caches.match(BASE_PATH + 'index.html')
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
