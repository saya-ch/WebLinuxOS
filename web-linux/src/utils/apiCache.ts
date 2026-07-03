interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
}

const MEMORY_CACHE = new Map<string, CacheEntry>()
const STORAGE_KEY_PREFIX = 'weblinux_cache_'
const DEFAULT_TTL = 5 * 60 * 1000

function getStorageKey(key: string): string {
  return STORAGE_KEY_PREFIX + key
}

function loadFromStorage(key: string): CacheEntry | null {
  try {
    const stored = localStorage.getItem(getStorageKey(key))
    if (!stored) return null
    return JSON.parse(stored) as CacheEntry
  } catch {
    return null
  }
}

function saveToStorage(key: string, entry: CacheEntry): void {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(entry))
  } catch {
    // ignore
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(getStorageKey(key))
  } catch {
    // ignore
  }
}

function clearStorage(): void {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // ignore
  }
}

export function getCache<T = unknown>(key: string): T | null {
  const memoryEntry = MEMORY_CACHE.get(key)
  if (memoryEntry) {
    if (Date.now() - memoryEntry.timestamp > memoryEntry.ttl) {
      MEMORY_CACHE.delete(key)
      removeFromStorage(key)
      return null
    }
    return memoryEntry.data as T
  }

  const storageEntry = loadFromStorage(key)
  if (storageEntry) {
    if (Date.now() - storageEntry.timestamp > storageEntry.ttl) {
      removeFromStorage(key)
      return null
    }
    MEMORY_CACHE.set(key, storageEntry)
    return storageEntry.data as T
  }

  return null
}

export function setCache<T = unknown>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    ttl,
  }
  MEMORY_CACHE.set(key, entry)
  saveToStorage(key, entry)
}

export function clearCache(key?: string): void {
  if (key) {
    MEMORY_CACHE.delete(key)
    removeFromStorage(key)
  } else {
    MEMORY_CACHE.clear()
    clearStorage()
  }
}

export function getCacheStats(): { count: number; size: number } {
  let size = 0
  MEMORY_CACHE.forEach(entry => {
    size += JSON.stringify(entry).length
  })
  return { count: MEMORY_CACHE.size, size }
}

export async function fetchWithCache<T = unknown>(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`
  
  const cached = getCache<T>(cacheKey)
  if (cached) return cached
  
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data = await response.json() as T
  setCache(cacheKey, data, ttl)
  
  return data
}

export async function fetchWithTimeout<T = unknown>(
  url: string,
  options?: RequestInit,
  timeout: number = 10000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json() as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试', { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchWithRetry<T = unknown>(
  url: string,
  options?: RequestInit,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout<T>(url, options)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误')
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError || new Error('请求失败')
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
  return num.toFixed(decimals)
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
