export const STORAGE_KEYS = {
  FILES: 'weblinux-files',
  THEME: 'weblinux-theme',
  WALLPAPER: 'weblinux-wallpaper',
  LIVE_WALLPAPER: 'weblinux-live-wallpaper',
  LIVE_WALLPAPER_ENABLED: 'weblinux-live-wallpaper-enabled',
  CURRENT_DESKTOP: 'weblinux-current-desktop',
  TOTAL_DESKTOPS: 'weblinux-total-desktops',
  DESKTOP_ICONS: 'weblinux-desktop-icons',
  FAVORITES: 'weblinux-favorites',
  PINNED_APPS: 'weblinux-pinned-apps',
  RECENT_FILES: 'weblinux-recent-files',
  CMD_HISTORY: 'weblinux-cmd-history',
  ALIASES: 'weblinux-aliases',
  SETTINGS: 'weblinux-settings',
  APP_STATE: 'weblinux-app-state',
} as const

const STORAGE_SIZE_LIMIT = 4_500_000

const saveTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

let storageAvailable = true
try {
  const testKey = '__weblinux_test__'
  localStorage.setItem(testKey, '1')
  localStorage.removeItem(testKey)
} catch {
  storageAvailable = false
  console.warn('localStorage 不可用，将使用内存存储。')
}

const memoryStore: Record<string, string> = {}

function safeGetItem(key: string): string | null {
  if (!storageAvailable) {
    return memoryStore[key] ?? null
  }
  try {
    return localStorage.getItem(key)
  } catch {
    return memoryStore[key] ?? null
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    console.warn(`无法保存到 localStorage [${key}]：`, (e as Error).message)
    memoryStore[key] = value
    return false
  }
}

function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    delete memoryStore[key]
  }
}

function estimateSize(str: string): number {
  try {
    return new Blob([str]).size
  } catch {
    return str.length * 2
  }
}

export function isStorageAvailable(): boolean {
  return storageAvailable
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = safeGetItem(key)
    if (!stored) return defaultValue
    const parsed = JSON.parse(stored)
    return parsed as T
  } catch (e) {
    console.warn(`Failed to load from localStorage for key "${key}":`, e)
    return defaultValue
  }
}

export function debouncedSaveToStorage(key: string, value: unknown, delay: number = 500) {
  const existingTimeout = saveTimeouts.get(key)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  const timeout = setTimeout(() => {
    try {
      const serialized = JSON.stringify(value)
      const size = estimateSize(serialized)
      if (size > STORAGE_SIZE_LIMIT) {
        console.warn(
          `[storage] 数据过大 (${Math.round(size / 1024)}KB)，无法保存到 localStorage [${key}]。`
        )
        const truncated = JSON.stringify({ ...(value as Record<string, unknown>), _truncated: true })
        safeSetItem(key, truncated)
      } else {
        safeSetItem(key, serialized)
      }
    } catch (e) {
      console.warn(`Failed to save to localStorage for key "${key}":`, e)
    }
    saveTimeouts.delete(key)
  }, delay)
  saveTimeouts.set(key, timeout)
}

export function saveToStorage(key: string, value: unknown) {
  try {
    const serialized = JSON.stringify(value)
    const size = estimateSize(serialized)
    if (size > STORAGE_SIZE_LIMIT) {
      console.warn(
        `[storage] 数据过大 (${Math.round(size / 1024)}KB)，无法保存到 localStorage [${key}]。`
      )
      return false
    }
    safeSetItem(key, serialized)
    return true
  } catch (e) {
    console.warn(`Failed to save to localStorage for key "${key}":`, e)
    return false
  }
}

export function removeFromStorage(key: string) {
  safeRemoveItem(key)
}

export function exportStorageData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const key of Object.values(STORAGE_KEYS)) {
    const value = loadFromStorage(key, null)
    if (value !== null && value !== undefined) {
      data[key] = value
    }
  }
  return data
}

export function importStorageData(data: Record<string, unknown>): boolean {
  try {
    for (const [key, value] of Object.entries(data)) {
      saveToStorage(key, value)
    }
    return true
  } catch {
    return false
  }
}

export function getStorageUsage(): { used: number; keys: number } {
  let used = 0
  let keys = 0
  if (storageAvailable) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('weblinux-')) {
        const val = localStorage.getItem(key) || ''
        used += estimateSize(val)
        keys++
      }
    }
  }
  return { used, keys }
}

export function clearAllStorage() {
  saveTimeouts.forEach((t) => clearTimeout(t))
  saveTimeouts.clear()
  Object.values(STORAGE_KEYS).forEach((key) => safeRemoveItem(key))
}

export function flushPendingSaves() {
  saveTimeouts.forEach((t) => {
    try { t } catch { /* noop */ }
  })
}
