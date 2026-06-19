/**
 * 统一的 localStorage 存储 key 集合。
 * - FILES：文件树
 * - THEME：主题（light / dark）
 * - WALLPAPER：背景配置
 * - LIVE_WALLPAPER：动态壁纸标识
 * - LIVE_WALLPAPER_ENABLED：是否启用动态壁纸
 * - CURRENT_DESKTOP / TOTAL_DESKTOPS：桌面切换状态
 * - DESKTOP_ICONS：桌面图标位置
 * - FAVORITES / PINNED_APPS：收藏项与 pinned 程序
 * - RECENT_FILES：最近打开的文件
 * - CMD_HISTORY / ALIASES：终端相关
 * - SETTINGS / APP_STATE：通用设置与应用状态
 */
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

// localStorage 通常单条键值对约 5MB，超出时会报错
const STORAGE_SIZE_LIMIT = 4_500_000

// 节流写入：每个 key 只保存一次待处理写入，超时时统一执行
interface PendingWrite {
  timeout: ReturnType<typeof setTimeout>
  key: string
  value: unknown
}

const pendingWrites: Map<string, PendingWrite> = new Map()

// 是否启用 localStorage；不可用时回退到内存存储
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

/**
 * 从 localStorage（或内存存储回退）读取原始字符串
 *
 * @param key  存储键
 * @returns    原始字符串或 null
 */
function safeGetItem(key: string): string | null {
  try {
    if (!storageAvailable) {
      return memoryStore[key] ?? null
    }
    return localStorage.getItem(key)
  } catch (err) {
    console.warn(`[storage] safeGetItem("${key}") 异常：`, (err as Error).message)
    try {
      return memoryStore[key] ?? null
    } catch {
      return null
    }
  }
}

/**
 * 写入原始字符串到 localStorage（失败时回退到内存存储）
 *
 * @param key    存储键
 * @param value  字符串值
 * @returns      是否成功写入
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    if (!storageAvailable) {
      memoryStore[key] = value
      return true
    }
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    console.warn(`无法保存到 localStorage [${key}]：`, (err as Error).message)
    try {
      memoryStore[key] = value
    } catch {
      /* noop */
    }
    return false
  }
}

/**
 * 移除某一个 key（同步写入 localStorage 或内存存储）
 *
 * @param key  存储键
 */
function safeRemoveItem(key: string): void {
  try {
    if (storageAvailable) {
      localStorage.removeItem(key)
    }
    delete memoryStore[key]
  } catch (err) {
    console.warn(`[storage] safeRemoveItem("${key}") 异常：`, (err as Error).message)
  }
}

/**
 * 估算字符串占用字节大小（近似）
 *
 * @param str  字符串
 * @returns    预估字节数
 */
function estimateSize(str: string): number {
  try {
    return new Blob([str]).size
  } catch {
    // 某些环境可能不可用 Blob，退化为 length*2（UTF-16 粗估）
    return str.length * 2
  }
}

/**
 * 查询浏览器端存储是否可用
 */
export function isStorageAvailable(): boolean {
  return storageAvailable
}

/**
 * 读取并 JSON 反序列化某个 key 的值
 *
 * @param key           存储键
 * @param defaultValue  默认值（读取失败或不存在时返回）
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = safeGetItem(key)
    if (!stored) return defaultValue
    const parsed = JSON.parse(stored)
    return parsed as T
  } catch (err) {
    console.warn(
      `Failed to load from localStorage for key "${key}":`,
      (err as Error).message
    )
    return defaultValue
  }
}

/**
 * 节流保存：在指定时间内重复写入时以最后一次为准；超过大小限制时进行提示并回退。
 *
 * @param key    存储键
 * @param value  任意 JSON 可序列化的值
 * @param delay  节流毫秒数
 */
export function debouncedSaveToStorage(key: string, value: unknown, delay: number = 500): void {
  try {
    const existing = pendingWrites.get(key)
    if (existing) {
      clearTimeout(existing.timeout)
    }
    const timeout = setTimeout(() => {
      try {
        const serialized = JSON.stringify(value)
        const size = estimateSize(serialized)
        if (size > STORAGE_SIZE_LIMIT) {
          console.warn(
            `[storage] 数据过大 (${Math.round(size / 1024)}KB)，无法保存到 localStorage [${key}]。`
          )
          // 截断到一个结构最小的占位对象以避免彻底失败
          const truncated = JSON.stringify({ ...(value as Record<string, unknown>), _truncated: true })
          safeSetItem(key, truncated)
        } else {
          safeSetItem(key, serialized)
        }
      } catch (err) {
        console.warn(
          `Failed to save to localStorage for key "${key}":`,
          (err as Error).message
        )
      } finally {
        pendingWrites.delete(key)
      }
    }, delay)
    pendingWrites.set(key, { timeout, key, value })
  } catch (err) {
    console.warn(`[storage] debouncedSaveToStorage("${key}") 异常：`, (err as Error).message)
  }
}

/**
 * 立即保存（同步）
 *
 * @param key    存储键
 * @param value  任意 JSON 可序列化的值
 * @returns      是否成功保存
 */
export function saveToStorage(key: string, value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value)
    const size = estimateSize(serialized)
    if (size > STORAGE_SIZE_LIMIT) {
      console.warn(
        `[storage] 数据过大 (${Math.round(size / 1024)}KB)，尝试保存到 localStorage [${key}] 可能失败。`
      )
    }
    return safeSetItem(key, serialized)
  } catch (err) {
    console.warn(`Failed to save to localStorage for key "${key}":`, (err as Error).message)
    try {
      // 极端情况下再次尝试以空对象形式兜底
      memoryStore[key] = JSON.stringify({})
    } catch {
      /* noop */
    }
    return false
  }
}

/**
 * 删除指定 key
 */
export function removeFromStorage(key: string): void {
  try {
    safeRemoveItem(key)
  } catch (err) {
    console.warn(`[storage] removeFromStorage("${key}") 异常：`, (err as Error).message)
  }
}

/**
 * 清除单个或多个指定 key；与 clearAllStorage 不同，它不会清空整库。
 *
 * @param keys  需要清除的 key 列表
 */
export function clearStorage(...keys: string[]): void {
  try {
    if (!keys || keys.length === 0) return
    keys.forEach((key) => safeRemoveItem(key))
  } catch (err) {
    console.warn('[storage] clearStorage 异常：', (err as Error).message)
  }
}

/**
 * 导出所有已知 STORAGE_KEYS 对应的数据（用于备份/调试）
 */
export function exportStorageData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  try {
    for (const key of Object.values(STORAGE_KEYS)) {
      const value = loadFromStorage(key, null)
      if (value !== null && value !== undefined) {
        data[key] = value
      }
    }
  } catch (err) {
    console.warn('[storage] exportStorageData 异常：', (err as Error).message)
  }
  return data
}

/**
 * 从备份对象恢复数据到存储
 */
export function importStorageData(data: Record<string, unknown>): boolean {
  try {
    for (const [key, value] of Object.entries(data)) {
      saveToStorage(key, value)
    }
    return true
  } catch (err) {
    console.warn('[storage] importStorageData 异常：', (err as Error).message)
    return false
  }
}

/**
 * 统计 weblinux 相关 key 的总字节与个数
 */
export function getStorageUsage(): { used: number; keys: number } {
  let used = 0
  let keys = 0
  try {
    if (storageAvailable && typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('weblinux-')) {
          const val = localStorage.getItem(key) || ''
          used += estimateSize(val)
          keys++
        }
      }
    }
  } catch (err) {
    console.warn('[storage] getStorageUsage 异常：', (err as Error).message)
  }
  return { used, keys }
}

/**
 * 清空所有 weblinux 相关的 key（同时包含待处理写入队列）
 */
export function clearAllStorage(): void {
  try {
    pendingWrites.forEach((p) => clearTimeout(p.timeout))
    pendingWrites.clear()
    Object.values(STORAGE_KEYS).forEach((key) => safeRemoveItem(key))
    Object.keys(memoryStore).forEach((key) => {
      if (key.startsWith('weblinux-')) {
        delete memoryStore[key]
      }
    })
  } catch (err) {
    console.warn('[storage] clearAllStorage 异常：', (err as Error).message)
  }
}

/**
 * 立即执行所有待处理的节流写入
 */
export function flushPendingSaves(): void {
  try {
    const pending = Array.from(pendingWrites.values())
    pendingWrites.clear()
    pending.forEach((p) => {
      try {
        clearTimeout(p.timeout)
        saveToStorage(p.key, p.value)
      } catch (err) {
        console.warn(`[storage] flushPendingSaves key=${p.key} 异常：`, (err as Error).message)
      }
    })
  } catch (err) {
    console.warn('[storage] flushPendingSaves 异常：', (err as Error).message)
  }
}

/**
 * 列出所有 weblinux 相关的存储 key
 */
export function listStorageKeys(): string[] {
  const keys: string[] = []
  try {
    if (storageAvailable && typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('weblinux-')) keys.push(k)
      }
    }
  } catch (err) {
    console.warn('[storage] listStorageKeys(localStorage) 异常：', (err as Error).message)
  }
  try {
    Object.keys(memoryStore).forEach((k) => {
      if (k.startsWith('weblinux-') && !keys.includes(k)) keys.push(k)
    })
  } catch (err) {
    console.warn('[storage] listStorageKeys(memory) 异常：', (err as Error).message)
  }
  return keys
}
