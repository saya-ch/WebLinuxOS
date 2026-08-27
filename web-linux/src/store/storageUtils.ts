import {
  saveFileTree,
  loadFileTree,
  clearFileTree,
  getStorageUsage as getIndexedDBUsage,
  isIndexedDBSupported,
} from './indexedDBStorage'

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
  ACCENT: 'weblinux-accent',
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

// 页面关闭前自动刷写待处理数据，避免丢失
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => flushPendingSaves())
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
  // 快速估算：UTF-16 编码下每个字符约 1-4 字节，取 length*2 作为合理近似
  // 避免每次调用创建 Blob 对象带来的 GC 压力
  return str.length * 2
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
    // 文件树数据优先从 IndexedDB 缓存读取
    if (key === STORAGE_KEYS.FILES) {
      if (filesTreeCacheLoaded && filesTreeCache !== undefined) {
        return filesTreeCache as T
      }
      // 缓存未加载时回退到 localStorage（同步兼容）
    }

    const stored = safeGetItem(key)
    if (!stored) return defaultValue
    try {
      const parsed = JSON.parse(stored)
      return parsed as T
    } catch {
      // 兼容历史数据：旧版本可能将纯字符串（如 'light'、'dark'）直接存入 localStorage，
      // 此时 JSON.parse 会失败，回退到将原始字符串作为值返回。
      // 这样既保证了与旧版本设置兼容，又能在新版本中以 JSON 格式正常存储。
      return stored as unknown as T
    }
  } catch (err) {
    console.warn(
      `Failed to load from localStorage for key "${key}":`,
      (err as Error).message
    )
    return defaultValue
  }
}

// 文件树内存缓存，用于同步读写 IndexedDB 数据
// IndexedDB 是异步 API，启动时通过 preloadFilesTree() 加载到此缓存
// loadFromStorage 读取 FILES key 时优先从缓存取值
let filesTreeCache: unknown = undefined
let filesTreeCacheLoaded = false

/**
 * 预加载文件树到内存缓存
 *
 * 应在应用启动时尽早调用。优先从 IndexedDB 加载，
 * 若 IndexedDB 中无数据则从 localStorage 迁移（向后兼容）。
 * 此函数为异步操作，但只需调用一次。
 */
export async function preloadFilesTree(): Promise<void> {
  try {
    if (isIndexedDBSupported()) {
      const data = await loadFileTree()
      if (data !== null) {
        filesTreeCache = data
        filesTreeCacheLoaded = true
        console.info('[storage] 从 IndexedDB 加载文件树成功')
        return
      }

      // IndexedDB 无数据，尝试从 localStorage 迁移（向后兼容）
      const localStorageData = safeGetItem(STORAGE_KEYS.FILES)
      if (localStorageData) {
        try {
          const parsed = JSON.parse(localStorageData)
          filesTreeCache = parsed
          // 异步迁移到 IndexedDB
          await saveFileTree(parsed)
          console.info('[storage] 已将文件树从 localStorage 迁移到 IndexedDB')
        } catch {
          // localStorage 数据无法解析，使用原始字符串
          filesTreeCache = localStorageData
          await saveFileTree(localStorageData)
          console.info('[storage] 已将文件树（原始字符串）从 localStorage 迁移到 IndexedDB')
        }
      } else {
        filesTreeCache = null
      }
      filesTreeCacheLoaded = true
    } else {
      // IndexedDB 不可用，从 localStorage 读取
      const localStorageData = safeGetItem(STORAGE_KEYS.FILES)
      if (localStorageData) {
        try {
          filesTreeCache = JSON.parse(localStorageData)
        } catch {
          filesTreeCache = localStorageData
        }
      } else {
        filesTreeCache = null
      }
      filesTreeCacheLoaded = true
    }
  } catch (err) {
    console.warn('[storage] preloadFilesTree 失败：', (err as Error).message)
    // 回退到 localStorage
    try {
      const localStorageData = safeGetItem(STORAGE_KEYS.FILES)
      if (localStorageData) {
        try {
          filesTreeCache = JSON.parse(localStorageData)
        } catch {
          filesTreeCache = localStorageData
        }
      } else {
        filesTreeCache = null
      }
    } catch {
      filesTreeCache = null
    }
    filesTreeCacheLoaded = true
  }
}

/**
 * 异步加载文件树（推荐用于需要最新数据的场景）
 *
 * 优先从 IndexedDB 读取，回退到 localStorage。
 * 比同步的 loadFromStorage(key, default) 更可靠。
 *
 * @param defaultValue  读取失败时的默认值
 */
export async function loadFilesAsync<T>(defaultValue: T): Promise<T> {
  try {
    if (isIndexedDBSupported()) {
      const data = await loadFileTree<T>()
      if (data !== null) {
        filesTreeCache = data
        return data
      }
    }
  } catch (err) {
    console.warn('[storage] loadFilesAsync IndexedDB 读取失败：', (err as Error).message)
  }

  // 回退到 localStorage
  const stored = safeGetItem(STORAGE_KEYS.FILES)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      filesTreeCache = parsed
      return parsed as T
    } catch {
      filesTreeCache = stored
      return stored as unknown as T
    }
  }

  filesTreeCache = defaultValue
  return defaultValue
}

/**
 * 异步保存文件树（推荐用于大数据写入）
 *
 * 同时更新内存缓存和 IndexedDB，确保数据一致性。
 *
 * @param value  文件树数据
 */
export async function saveFilesAsync(value: unknown): Promise<void> {
  filesTreeCache = value
  try {
    if (isIndexedDBSupported()) {
      await saveFileTree(value)
    } else {
      // IndexedDB 不可用，回退到 localStorage
      safeSetItem(STORAGE_KEYS.FILES, JSON.stringify(value))
    }
  } catch (err) {
    console.warn('[storage] saveFilesAsync 失败，回退到 localStorage：', (err as Error).message)
    safeSetItem(STORAGE_KEYS.FILES, JSON.stringify(value))
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
        // 文件树数据使用 IndexedDB 存储
        if (key === STORAGE_KEYS.FILES) {
          filesTreeCache = value
          saveFileTree(value).catch((err) => {
            console.warn('[storage] IndexedDB saveFileTree 失败，回退到 localStorage：', (err as Error).message)
            safeSetItem(key, JSON.stringify(value))
          })
        } else {
          const serialized = JSON.stringify(value)
          const size = estimateSize(serialized)
          if (size > STORAGE_SIZE_LIMIT) {
            console.warn(
              `[storage] 数据过大 (${Math.round(size / 1024)}KB)，无法保存到 localStorage [${key}]，已写入最小占位对象。`
            )
            const placeholder = JSON.stringify({
              _truncated: true,
              _originalSize: size,
              _truncatedAt: new Date().toISOString(),
            })
            safeSetItem(key, placeholder)
          } else {
            safeSetItem(key, serialized)
          }
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
    // 文件树数据使用 IndexedDB 存储，突破 5MB 限制
    if (key === STORAGE_KEYS.FILES) {
      // 同步缓存，确保后续 loadFromStorage 能立即读到最新值
      filesTreeCache = value
      // 异步写入 IndexedDB
      saveFileTree(value).catch((err) => {
        console.warn('[storage] IndexedDB saveFileTree 失败，回退到 localStorage：', (err as Error).message)
        safeSetItem(key, JSON.stringify(value))
      })
      return true
    }

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
    keys.forEach((key) => {
      safeRemoveItem(key)
      // 文件树数据同时清除 IndexedDB
      if (key === STORAGE_KEYS.FILES) {
        filesTreeCache = undefined
        filesTreeCacheLoaded = false
        clearFileTree().catch((err) => {
          console.warn('[storage] clearFileTree 失败：', (err as Error).message)
        })
      }
    })
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
      // 文件树数据优先从 IndexedDB 缓存读取
      if (key === STORAGE_KEYS.FILES && filesTreeCacheLoaded && filesTreeCache !== undefined) {
        data[key] = filesTreeCache
        continue
      }
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
      if (key === STORAGE_KEYS.FILES) {
        // 文件树数据异步写入 IndexedDB
        filesTreeCache = value
        saveFileTree(value).catch((err) => {
          console.warn('[storage] importStorageData IndexedDB 写入失败，回退到 localStorage：', (err as Error).message)
          safeSetItem(key, JSON.stringify(value))
        })
      } else {
        saveToStorage(key, value)
      }
    }
    return true
  } catch (err) {
    console.warn('[storage] importStorageData 异常：', (err as Error).message)
    return false
  }
}

/**
 * 统计 weblinux 相关 key 的总字节与个数，并包含 IndexedDB 配额信息
 */
export async function getStorageUsage(): Promise<{
  used: number
  keys: number
  quota: number
  percent: number
}> {
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

  // 获取 IndexedDB 存储配额信息
  let quota = 0
  let percent = 0
  try {
    const idbUsage = await getIndexedDBUsage()
    // 如果 IndexedDB 有配额信息，合并使用量
    if (idbUsage.quota > 0) {
      quota = idbUsage.quota
      used += idbUsage.used
      percent = quota > 0 ? (used / quota) * 100 : 0
    }
  } catch (err) {
    console.warn('[storage] getStorageUsage IndexedDB 部分异常：', (err as Error).message)
  }

  return { used, keys, quota, percent }
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
    // 同时清除 IndexedDB 中的文件树数据
    filesTreeCache = undefined
    filesTreeCacheLoaded = false
    clearFileTree().catch((err) => {
      console.warn('[storage] clearAllStorage clearFileTree 失败：', (err as Error).message)
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
