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
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    const parsed = JSON.parse(stored)
    return parsed as T
  } catch (e) {
    console.warn(`Failed to load from localStorage for key "${key}":`, e)
    return defaultValue
  }
}

export function debouncedSaveToStorage(key: string, value: unknown, delay: number = 500) {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (e) {
      console.warn(`Failed to save to localStorage for key "${key}":`, e)
    }
    saveTimeout = null
  }, delay)
}

export function saveToStorage(key: string, value: unknown) {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (e) {
    console.warn(`Failed to save to localStorage for key "${key}":`, e)
  }
}

export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
}
