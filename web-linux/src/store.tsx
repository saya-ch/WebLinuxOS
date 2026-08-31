import { create } from 'zustand'
import type { AppDefinition, WindowState, DesktopIcon, FileNode } from './types'
import {
  findNodeById,
  findParentNode,
  findNodeByPath,
  getNodePath,
  resolvePath,
  traverseTree,
  copyNodeWithNewParent,
  removeFromTree,
  updateInTree,
  validateFileName,
  generateFileId,
  countNodes,
  searchFiles,
  sortNodes,
  invalidateCache,
} from './store/fileUtils'
import {
  STORAGE_KEYS,
  loadFromStorage,
  debouncedSaveToStorage,
  saveToStorage,
  clearAllStorage
} from './store/storageUtils'
import {
  defaultDesktopIcons,
  defaultFiles,
  defaultPinnedApps,
  defaultTotalDesktops
} from './store/defaults'

// 加载初始数据
function safeLoadArray<T>(key: string, defaultValue: T[]): T[] {
  const raw = loadFromStorage<unknown>(key, defaultValue)
  if (Array.isArray(raw)) return raw as T[]
  return defaultValue
}

const initialTheme: 'dark' | 'light' | 'auto' = (() => {
  const raw = loadFromStorage<string>(STORAGE_KEYS.THEME, 'auto')
  if (raw === 'light' || raw === 'dark' || raw === 'auto') return raw
  return 'auto'
})()

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const resolveTheme = (t: 'dark' | 'light' | 'auto'): 'dark' | 'light' => {
  if (t === 'auto') return getSystemTheme()
  return t
}

export const accentPresets = [
  { id: 'indigo', name: '靛蓝', color: '#7c6cf0', colorLight: '#5b4cd8' },
  { id: 'emerald', name: '翠绿', color: '#10b981', colorLight: '#059669' },
  { id: 'rose', name: '玫瑰', color: '#f43f5e', colorLight: '#e11d48' },
  { id: 'amber', name: '琥珀', color: '#f59e0b', colorLight: '#d97706' },
  { id: 'sky', name: '天蓝', color: '#0ea5e9', colorLight: '#0284c7' },
  { id: 'violet', name: '紫罗兰', color: '#8b5cf6', colorLight: '#7c3aed' },
  { id: 'cyan', name: '青', color: '#06b6d4', colorLight: '#0891b2' },
  { id: 'pink', name: '粉桃', color: '#ec4899', colorLight: '#db2777' },
] as const

export type AccentId = typeof accentPresets[number]['id']
const initialAccent: AccentId = (() => {
  const raw = loadFromStorage<string>(STORAGE_KEYS.ACCENT, 'indigo')
  return (accentPresets.some(p => p.id === raw) ? raw : 'indigo') as AccentId
})()
const initialWallpaper: string = loadFromStorage(STORAGE_KEYS.WALLPAPER, '')
const initialLiveWallpaper: string = loadFromStorage(STORAGE_KEYS.LIVE_WALLPAPER, 'particles')
const initialLiveWallpaperEnabled: boolean = Boolean(
  loadFromStorage<boolean>(STORAGE_KEYS.LIVE_WALLPAPER_ENABLED, false)
)
const initialCurrentDesktop = Math.max(
  1,
  Math.min(9, Number(loadFromStorage<number>(STORAGE_KEYS.CURRENT_DESKTOP, 1)) || 1)
)
const initialTotalDesktops = Math.max(
  1,
  Math.min(9, Number(loadFromStorage<number>(STORAGE_KEYS.TOTAL_DESKTOPS, 4)) || 4)
)
const initialFiles: FileNode[] = safeLoadArray<FileNode>(STORAGE_KEYS.FILES, defaultFiles)
const initialDesktopIcons: DesktopIcon[] = safeLoadArray<DesktopIcon>(
  STORAGE_KEYS.DESKTOP_ICONS,
  defaultDesktopIcons
)
const initialFavorites: string[] = safeLoadArray<string>(STORAGE_KEYS.FAVORITES, [])
const initialPinnedApps: string[] = safeLoadArray<string>(STORAGE_KEYS.PINNED_APPS, [
  'terminal',
  'files',
  'browser',
  'settings',
])
const initialRecentFiles: FileNode[] = safeLoadArray<FileNode>(STORAGE_KEYS.RECENT_FILES, [])

interface FileOperation {
  type: 'add' | 'delete' | 'update' | 'rename' | 'move' | 'copy'
  fileId: string
  previousState?: FileNode
  newState?: FileNode
  parentId?: string
  fileName?: string
}

// 使用 types.ts 中统一的 Notification 类型定义，避免重复声明
import type { Notification } from './types'

interface SystemStats {
  cpuUsage: number
  memoryUsage: number
  storageUsage: number
  networkUsage: number
  processes: number
  uptime: number
}

interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
}

interface Store {
  windows: WindowState[]
  apps: AppDefinition[]
  desktopIcons: DesktopIcon[]
  files: FileNode[]
  nextZIndex: number
  theme: 'dark' | 'light' | 'auto'
  resolvedTheme: 'dark' | 'light'
  accentColor: AccentId
  accentPresets: typeof accentPresets
  wallpaper: string
  liveWallpaper: string
  liveWallpaperEnabled: boolean
  launcherOpen: boolean
  contextMenu: { x: number; y: number; visible: boolean }
  fileOperationHistory: FileOperation[]
  historyIndex: number
  currentDesktop: number
  totalDesktops: number
  windowsPerDesktop: Record<number, string[]>
  notifications: Notification[]
  notificationCenterOpen: boolean
  searchQuery: string
  recentFiles: FileNode[]
  favorites: string[]
  pinnedApps: string[]
  windowSnapshots: Record<string, string>
  systemStats: SystemStats
  quickActions: QuickAction[]
  quickActionCenterOpen: boolean
  systemStatus: 'online' | 'offline' | 'warning'

  registerApp: (app: AppDefinition) => void
  registerApps: (apps: AppDefinition[]) => void
  openApp: (appId: string) => void
  closeWindow: (id: string) => void
  clearWindows: () => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  toggleLauncher: () => void
  closeLauncher: () => void
  showContextMenu: (x: number, y: number) => void
  hideContextMenu: () => void
  setTheme: (theme: 'dark' | 'light' | 'auto') => void
  setAccentColor: (accent: AccentId) => void
  applyAccentToDOM: (accent: AccentId, theme: 'dark' | 'light') => void
  setWallpaper: (wallpaper: string) => void
  setLiveWallpaper: (wallpaper: string) => void
  toggleLiveWallpaper: () => void
  addWindow: (app: AppDefinition) => WindowState
  deleteFile: (id: string) => void
  addFile: (parentId: string, name: string, type: 'file' | 'folder') => void
  updateFileContent: (id: string, content: string) => void
  renameFile: (id: string, name: string) => void
  restoreWindow: (id: string) => void
  openFileWith: (fileId: string, appId: string) => void
  copyFile: (sourceId: string, targetParentId: string) => void
  moveFile: (sourceId: string, targetParentId: string) => void
  undoFileOperation: () => void
  redoFileOperation: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  switchDesktop: (desktopNumber: number) => void
  addDesktop: () => void
  removeDesktop: (desktopNumber: number) => void
  moveWindowToDesktop: (windowId: string, desktopNumber: number) => void
  moveWindowToNextDesktop: () => void
  moveWindowToPrevDesktop: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  toggleNotificationCenter: () => void
  closeNotificationCenter: () => void
  setSearchQuery: (query: string) => void
  addRecentFile: (file: FileNode) => void
  toggleFavorite: (fileId: string) => void
  togglePinnedApp: (appId: string) => void
  clearRecentFiles: () => void
  clearFavorites: () => void
  updateDesktopIconPosition: (id: string, x: number, y: number) => void
  resetToDefaults: () => void
  setWindowSnapshot: (windowId: string, snapshot: string) => void
  removeWindowSnapshot: (windowId: string) => void
  updateSystemStats: (stats: Partial<SystemStats>) => void
  toggleQuickActionCenter: () => void
  closeQuickActionCenter: () => void
  setSystemStatus: (status: 'online' | 'offline' | 'warning') => void
  refreshSystemStats: () => void
  tileWindow: (id: string, direction: 'left' | 'right' | 'top' | 'bottom') => void
  tileWindowsGrid: (windowIds: string[]) => void
  snapWindow: (id: string, snap: 'left-half' | 'right-half' | 'top-half' | 'bottom-half' | 'quadrant-tl' | 'quadrant-tr' | 'quadrant-bl' | 'quadrant-br') => void
  maximizeAllWindows: () => void
  minimizeAllWindows: () => void
  saveWorkspace: () => void
}

let windowIdCounter = 0

// 文件操作历史最大长度限制，防止无限增长导致内存膨胀
const MAX_FILE_OPERATION_HISTORY = 100

// 通知定时器管理：防止内存泄漏
const notificationTimers = new Map<string, ReturnType<typeof setTimeout>>()

// 初始化 windowsPerDesktop
function initWindowsPerDesktop(total: number): Record<number, string[]> {
  const result: Record<number, string[]> = {}
  for (let i = 1; i <= total; i++) {
    result[i] = []
  }
  return result
}

// 修剪文件操作历史，超过上限时丢弃最旧条目（同时调整 historyIndex 偏移）
function trimHistory(history: FileOperation[], historyIndex: number): {
  history: FileOperation[]
  historyIndex: number
} {
  if (history.length <= MAX_FILE_OPERATION_HISTORY) {
    return { history, historyIndex }
  }
  // 丢弃最旧的 (length - MAX) 条
  const dropCount = history.length - MAX_FILE_OPERATION_HISTORY
  return {
    history: history.slice(dropCount),
    historyIndex: Math.max(-1, historyIndex - dropCount),
  }
}

// 使用闭包封装的统计时间戳，避免模块级变量在多实例场景下的竞态条件
let statsPerfTime = 0
const getAndUpdateStatsPerfTime = () => {
  const current = performance.now()
  const delta = current - statsPerfTime
  statsPerfTime = current
  return { current, delta }
}

// localStorage 大小缓存，避免每 5 秒遍历全量 key
let cachedLocalStorageSize = 0
let localStorageSizeCacheTime = 0

// requestAnimationFrame 帧率追踪，用于 CPU 估算
let rafFrameCount = 0
let rafLastCheck = performance.now()
let cachedFps = 60

// DOM 节点数缓存，避免每5秒遍历整个 DOM 树
let cachedDomNodeCount = 0
let domNodeCountCacheTime = 0
const DOM_NODE_CACHE_INTERVAL = 60000 // 60秒缓存（避免频繁遍历 DOM 树）

// 清理所有通知定时器的工具函数，用于 store 重置时释放资源
const clearAllNotificationTimers = () => {
  notificationTimers.forEach(timer => clearTimeout(timer))
  notificationTimers.clear()
}

// 文件操作类型中文映射，用于 undo/redo 通知
const FILE_OP_TYPE_LABELS: Record<string, string> = {
  add: '添加文件',
  delete: '删除文件',
  rename: '重命名文件',
  move: '移动文件',
  copy: '复制文件',
  update: '更新文件内容',
}

export const useStore = create<Store>((set, get) => ({
  windows: [],
  apps: [],
  desktopIcons: initialDesktopIcons,
  files: initialFiles,
  nextZIndex: 100,
  theme: initialTheme,
  resolvedTheme: resolveTheme(initialTheme),
  accentColor: initialAccent,
  accentPresets,
  wallpaper: initialWallpaper,
  liveWallpaper: initialLiveWallpaper,
  liveWallpaperEnabled: initialLiveWallpaperEnabled,
  launcherOpen: false, // 恢复正常初始值
  contextMenu: { x: 0, y: 0, visible: false },
  fileOperationHistory: [],
  historyIndex: -1,
  currentDesktop: initialCurrentDesktop,
  totalDesktops: initialTotalDesktops,
  windowsPerDesktop: initWindowsPerDesktop(initialTotalDesktops),
  notifications: [],
  notificationCenterOpen: false,
  searchQuery: '',
  recentFiles: initialRecentFiles,
  favorites: initialFavorites,
  pinnedApps: initialPinnedApps,
  windowSnapshots: {},
  systemStats: {
    cpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 0,
    networkUsage: 0,
    processes: 0,
    uptime: 0,
  },
  quickActions: [],
  quickActionCenterOpen: false,
  systemStatus: navigator.onLine ? 'online' : 'offline',

  updateSystemStats: (stats) =>
    set((s) => ({
      systemStats: { ...s.systemStats, ...stats },
    })),

  toggleQuickActionCenter: () =>
    set((s) => ({ quickActionCenterOpen: !s.quickActionCenterOpen })),

  closeQuickActionCenter: () => set({ quickActionCenterOpen: false }),

  setSystemStatus: (status) => set({ systemStatus: status }),

  refreshSystemStats: () => {
    const { current: now, delta } = getAndUpdateStatsPerfTime()
    const uptime = Math.floor(Date.now() / 1000)

    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }

    // ── 内存使用率 ──
    let memoryUsage: number
    try {
      if (perf.memory) {
        const { usedJSHeapSize, totalJSHeapSize } = perf.memory
        memoryUsage = totalJSHeapSize > 0
          ? Math.min(100, Math.round((usedJSHeapSize / totalJSHeapSize) * 100))
          : 0
      } else {
        const navEntry = performance.getEntriesByType('navigation')[0] as
          | { transferSize?: number; encodedBodySize?: number; decodedBodySize?: number }
          | undefined
        if (navEntry) {
          const size = navEntry.transferSize || navEntry.encodedBodySize || navEntry.decodedBodySize || 0
          memoryUsage = Math.min(100, Math.round(size / (1024 * 1024)))
        } else {
          memoryUsage = 30
        }
      }
    } catch {
      memoryUsage = 25
    }

    // ── CPU 使用率：结合 requestAnimationFrame 帧率 + delta 时间漂移 + 内存压力 ──
    let cpuUsage: number
    try {
      // 通过 requestAnimationFrame 测量帧率
      let fps = cachedFps
      const rafNow = performance.now()
      if (rafNow - rafLastCheck >= 1000) {
        // 1 秒内统计的帧数 ≈ 帧率
        if (rafFrameCount > 0) {
          fps = Math.min(60, rafFrameCount)
          cachedFps = fps
        }
        rafFrameCount = 0
        rafLastCheck = rafNow
      }
      rafFrameCount++

      const expectedDelta = 5000

      if (delta === 0 || delta > 60000) {
        // 首次或长时间未调用，用帧率估算
        cpuUsage = Math.round(Math.min(100, Math.max(0, ((60 - fps) / 60) * 80 + 5)))
      } else {
        // 1) 定时器漂移：实际间隔 vs 期望间隔
        const deltaRatio = delta > 0 ? expectedDelta / delta : 1
        const timerDrift = deltaRatio > 1 ? Math.min(1, (deltaRatio - 1) * 2) : 0

        // 2) 帧率下降贡献：帧率越低，说明系统越忙
        const fpsDrop = Math.max(0, (60 - fps) / 60) // 0~1
        const fpsImpact = fpsDrop * 0.6

        // 3) 内存压力
        const memoryPressure = memoryUsage > 85 ? 0.2 : memoryUsage > 70 ? 0.1 : 0

        cpuUsage = Math.round(Math.min(100, Math.max(0,
          (timerDrift * 0.3 + fpsImpact + memoryPressure) * 100
        )))
      }
    } catch {
      cpuUsage = Math.round(10 + Math.random() * 15)
    }

    // ── 存储使用率（localStorage 缓存）──
    let localStorageSize = cachedLocalStorageSize
    if (Date.now() - localStorageSizeCacheTime > 30000) {
      try {
        let total = 0
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            const value = localStorage.getItem(key)
            if (value) {
              total += key.length + value.length
            }
          }
        }
        localStorageSize = total
        cachedLocalStorageSize = total
        localStorageSizeCacheTime = Date.now()
      } catch {
        localStorageSize = 0
      }
    }
    const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024
    const storageUsage = localStorageSize > 0
      ? Math.min(100, Math.round((localStorageSize / STORAGE_LIMIT_BYTES) * 100))
      : 0

    // ── 网络使用率：结合资源传输量 + navigator.connection 实际带宽 ──
    let networkUsage: number
    try {
      // 获取网络连接信息
      const conn = navigator as Navigator & {
        connection?: {
          effectiveType?: string
          downlink?: number
          rtt?: number
          saveData?: boolean
        }
      }
      const connectionInfo = conn.connection
      const downlink = connectionInfo?.downlink ?? 0  // 实际下行带宽 (Mbps)
      const effectiveType = connectionInfo?.effectiveType ?? ''
      const rtt = connectionInfo?.rtt ?? 0

      // 统计近期资源传输
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      let totalBytes = 0
      let activeCount = 0
      if (resources.length > 0) {
        const recentResources = resources.slice(-50)
        for (const r of recentResources) {
          const transfer = (r as unknown as { transferSize?: number; encodedBodySize?: number }).transferSize
            || (r as unknown as { encodedBodySize?: number }).encodedBodySize
            || 0
          totalBytes += transfer
          if (r.startTime > now - 5000) activeCount++
        }
      }

      // 基于资源传输的负载分数 (0~50)
      const resourceLoad = resources.length > 0
        ? Math.min(50, Math.round((totalBytes / (1024 * 10)) + activeCount * 2))
        : 0

      // 基于连接质量的网络拥塞分数：带宽越低/延迟越高，网络越拥塞 (0~50)
      let congestionScore = 25 // 默认值
      if (connectionInfo) {
        // downlink: Mbps, rtt: ms, 有效范围约 0~100Mbps, rtt 0~3000ms
        const downlinkScore = downlink <= 0 ? 50
          : downlink < 0.5 ? 45
          : downlink < 1 ? 35
          : downlink < 5 ? 25
          : downlink < 10 ? 15
          : 8
        const rttScore = rtt <= 0 ? 10
          : rtt < 50 ? 10
          : rtt < 100 ? 20
          : rtt < 200 ? 30
          : 40
        congestionScore = Math.round(downlinkScore * 0.6 + rttScore * 0.4)
      } else if (effectiveType) {
        // fallback 到 effectiveType
        congestionScore = effectiveType === '4g' ? 15
          : effectiveType === '3g' ? 30
          : effectiveType === '2g' ? 45
          : 35
      }

      networkUsage = Math.min(100, Math.max(0, Math.round(resourceLoad + congestionScore)))
    } catch {
      networkUsage = Math.round(20 + Math.random() * 20)
    }

    // ── 进程数模拟：基于基础系统进程 + 窗口数 + 内存压力 ──
    let processes: number
    try {
      const openWindows = get().windows.length

      // DOM 节点数使用缓存，避免每5秒遍历整个 DOM 树（性能关键）
      if (Date.now() - domNodeCountCacheTime > DOM_NODE_CACHE_INTERVAL) {
        try {
          cachedDomNodeCount = document.querySelectorAll('*').length
          domNodeCountCacheTime = Date.now()
        } catch {
          // 忽略
        }
      }

      // 基础系统进程（模拟操作系统后台服务）
      const baseProcesses = 28
      // 每个窗口对应 3~5 个进程（渲染进程 + 扩展进程等）
      const windowProcesses = openWindows * 4
      // DOM 复杂度贡献（每 500 个节点约 1 个进程，上限 15）
      const domProcesses = Math.round(Math.min(15, cachedDomNodeCount / 500))
      // 内存压力贡献：内存使用率越高，模拟的进程越多
      const memoryPressure = memoryUsage > 80 ? 5 : memoryUsage > 60 ? 2 : 0

      processes = Math.max(1, Math.min(128, baseProcesses + windowProcesses + domProcesses + memoryPressure))
    } catch {
      processes = Math.round(30 + Math.random() * 10)
    }

    set({
      systemStats: {
        cpuUsage,
        memoryUsage,
        storageUsage,
        networkUsage,
        processes,
        uptime,
      },
    })
  },

  tileWindow: (id, direction) => {
    const screenW = window.innerWidth
    const screenH = window.innerHeight - 40
    const halfW = Math.floor(screenW / 2)
    const halfH = Math.floor(screenH / 2)
    let x = 0, y = 0, width = halfW, height = screenH

    switch (direction) {
      case 'left':
        x = 0; y = 0; width = halfW; height = screenH; break
      case 'right':
        x = halfW; y = 0; width = halfW; height = screenH; break
      case 'top':
        x = 0; y = 0; width = screenW; height = halfH; break
      case 'bottom':
        x = 0; y = halfH; width = screenW; height = halfH; break
    }

    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, x, y, width, height, maximized: false, minimized: false, focused: true, zIndex: s.nextZIndex + 1 }
          : { ...w, focused: false }
      ),
      nextZIndex: s.nextZIndex + 1,
    }))
  },

  snapWindow: (id, snap) => {
    const screenW = window.innerWidth
    const screenH = window.innerHeight - 40
    const halfW = Math.floor(screenW / 2)
    const halfH = Math.floor(screenH / 2)
    let x = 0, y = 0, width = screenW, height = screenH

    switch (snap) {
      case 'left-half': x = 0; y = 0; width = halfW; height = screenH; break
      case 'right-half': x = halfW; y = 0; width = halfW; height = screenH; break
      case 'top-half': x = 0; y = 0; width = screenW; height = halfH; break
      case 'bottom-half': x = 0; y = halfH; width = screenW; height = halfH; break
      case 'quadrant-tl': x = 0; y = 0; width = halfW; height = halfH; break
      case 'quadrant-tr': x = halfW; y = 0; width = halfW; height = halfH; break
      case 'quadrant-bl': x = 0; y = halfH; width = halfW; height = halfH; break
      case 'quadrant-br': x = halfW; y = halfH; width = halfW; height = halfH; break
    }

    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, x, y, width, height, maximized: false, minimized: false, focused: true, zIndex: s.nextZIndex + 1 }
          : { ...w, focused: false }
      ),
      nextZIndex: s.nextZIndex + 1,
    }))
  },

  tileWindowsGrid: (windowIds) => {
    const count = windowIds.length
    if (count === 0) return
    const screenW = window.innerWidth
    const screenH = window.innerHeight - 40

    let cols = Math.ceil(Math.sqrt(count))
    let rows = Math.ceil(count / cols)
    if (count <= 2) { cols = count; rows = 1 }
    else if (count <= 4) { cols = 2; rows = Math.ceil(count / 2) }
    else if (count <= 6) { cols = 3; rows = 2 }
    else if (count <= 9) { cols = 3; rows = 3 }

    const cellW = Math.floor(screenW / cols)
    const cellH = Math.floor(screenH / rows)

    set((s) => {
      const newWindows = s.windows.map((w) => {
        const idx = windowIds.indexOf(w.id)
        if (idx === -1) return w
        const col = idx % cols
        const row = Math.floor(idx / cols)
        return {
          ...w,
          x: col * cellW,
          y: row * cellH,
          width: cellW,
          height: cellH,
          maximized: false,
          minimized: false,
          focused: false,
        }
      })
      const maxZ = Math.max(...newWindows.map(w => w.zIndex), s.nextZIndex)
      return { windows: newWindows, nextZIndex: maxZ + 1 }
    })
  },

  maximizeAllWindows: () => {
    set((s) => ({
      windows: s.windows.map((w) => ({
        ...w,
        maximized: true,
        minimized: false,
      })),
    }))
  },

  minimizeAllWindows: () => {
    set((s) => ({
      windows: s.windows.map((w) => ({
        ...w,
        minimized: true,
        maximized: false,
      })),
    }))
  },

  saveWorkspace: () => {
    const state = get()
    const workspaceData = state.windows.map((w) => ({
      id: w.id,
      appId: w.appId,
      title: w.title,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
      maximized: w.maximized,
      minimized: w.minimized,
      zIndex: w.zIndex,
    }))
    try {
      const MAX_SAVED_WORKSPACES = 10
      const savedWorkspaces = loadFromStorage<typeof workspaceData[]>('weblinux_saved_workspaces', [])
      savedWorkspaces.push({ timestamp: Date.now(), windows: workspaceData } as never)
      // 限制保存的工作区数量，防止 localStorage 空间膨胀
      const trimmed = savedWorkspaces.length > MAX_SAVED_WORKSPACES
        ? savedWorkspaces.slice(savedWorkspaces.length - MAX_SAVED_WORKSPACES)
        : savedWorkspaces
      saveToStorage('weblinux_saved_workspaces', trimmed)
    } catch {
      // 静默处理存储错误
    }
  },

  // 添加一条通知消息：对同一消息标题做去重限制，避免短时间内刷屏
  // 改进：使用定时器管理器防止内存泄漏
  addNotification: (notification) => {
    try {
      const state = get()
      const now = Date.now()
      // 去重：2 秒内相同 title + message 的通知不重复添加
      const duplicate = state.notifications.find(
        (n) =>
          n.title === notification.title &&
          n.message === notification.message &&
          n.timestamp &&
          (now - new Date(n.timestamp).getTime()) < 2000
      )
      if (duplicate) {
        return
      }
      const id = `notif-${now}-${Math.random().toString(36).slice(2, 8)}`
      set((s) => ({
        notifications: [
          ...s.notifications,
          { ...notification, id, timestamp: new Date() },
        ],
      }))

      // 清理旧定时器（如果存在）
      if (notificationTimers.has(id)) {
        clearTimeout(notificationTimers.get(id)!)
        notificationTimers.delete(id)
      }

      // 设置新定时器并存储ID
      const timerId = setTimeout(() => {
        get().removeNotification(id)
        notificationTimers.delete(id)
      }, notification.duration ?? 5000)
      notificationTimers.set(id, timerId)
    } catch (err) {
      console.warn('[store] 添加通知时出现异常：', err)
    }
  },

  removeNotification: (id) => {
    // 清理对应的定时器
    if (notificationTimers.has(id)) {
      clearTimeout(notificationTimers.get(id)!)
      notificationTimers.delete(id)
    }
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id)
    }))
  },

  toggleNotificationCenter: () => {
    set((s) => ({ notificationCenterOpen: !s.notificationCenterOpen }))
  },

  closeNotificationCenter: () => {
    set({ notificationCenterOpen: false })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  addRecentFile: (file: FileNode) => {
    set((s) => {
      const newRecentFiles = [
        file,
        ...s.recentFiles.filter(f => f.id !== file.id)
      ].slice(0, 10)
      saveToStorage(STORAGE_KEYS.RECENT_FILES, newRecentFiles)
      return { recentFiles: newRecentFiles }
    })
  },

  toggleFavorite: (fileId: string) => {
    set((s) => {
      const newFavorites = s.favorites.includes(fileId)
        ? s.favorites.filter(id => id !== fileId)
        : [...s.favorites, fileId]
      saveToStorage(STORAGE_KEYS.FAVORITES, newFavorites)
      return { favorites: newFavorites }
    })
  },

  togglePinnedApp: (appId: string) => {
    set((s) => {
      const newPinnedApps = s.pinnedApps.includes(appId)
        ? s.pinnedApps.filter(id => id !== appId)
        : [...s.pinnedApps, appId]
      saveToStorage(STORAGE_KEYS.PINNED_APPS, newPinnedApps)
      return { pinnedApps: newPinnedApps }
    })
  },

  clearRecentFiles: () => {
    set({ recentFiles: [] })
    saveToStorage(STORAGE_KEYS.RECENT_FILES, [])
  },

  clearFavorites: () => {
    set({ favorites: [] })
    saveToStorage(STORAGE_KEYS.FAVORITES, [])
  },

  updateDesktopIconPosition: (id: string, x: number, y: number) => {
    set((s) => {
      const newIcons = s.desktopIcons.map(icon => 
        icon.id === id ? { ...icon, x, y } : icon
      )
      saveToStorage(STORAGE_KEYS.DESKTOP_ICONS, newIcons)
      return { desktopIcons: newIcons }
    })
  },

  // 重置到默认状态：清空本地存储并恢复默认值，操作前会发通知警告
  resetToDefaults: () => {
    try {
      get().addNotification({
        title: '系统重置',
        message: '正在将系统恢复为默认配置，所有本地数据将被清空…',
        type: 'warning',
        duration: 5000,
      })

      invalidateCache()
      clearAllStorage()
      clearAllNotificationTimers()
      set({
        files: defaultFiles,
        desktopIcons: defaultDesktopIcons,
        theme: 'auto',
        resolvedTheme: resolveTheme('auto'),
        accentColor: 'indigo',
        wallpaper: '',
        liveWallpaper: 'particles',
        liveWallpaperEnabled: false,
        currentDesktop: 1,
        totalDesktops: defaultTotalDesktops,
        windowsPerDesktop: initWindowsPerDesktop(defaultTotalDesktops),
        favorites: [],
        pinnedApps: defaultPinnedApps,
      })

      // 重置成功后再发一条成功提示
      setTimeout(() => {
        get().addNotification({
          title: '重置完成',
          message: '系统已恢复至默认配置。',
          type: 'success',
          duration: 4000,
        })
      }, 300)
    } catch (err) {
      console.warn('[store] resetToDefaults 异常：', err)
    }
  },

  registerApp: (app) => set((s) => ({ apps: [...s.apps.filter((a) => a.id !== app.id), app] })),

  // 批量注册：一次性写入多个应用，避免 350+ 个应用逐个调用 registerApp 时的 O(n²) 性能问题
  registerApps: (apps) =>
    set((s) => {
      if (!Array.isArray(apps) || apps.length === 0) return {}
      const validApps = apps.filter((a): a is NonNullable<typeof a> => !!a && !!a.id)
      if (validApps.length === 0) return {}
      const incomingIds = new Set(validApps.map((a) => a.id))
      const kept = s.apps.filter((a) => a && a.id && !incomingIds.has(a.id))
      return { apps: [...kept, ...validApps] }
    }),

  addWindow: (app) => {
    const state = get()
    const existing = state.windows.filter((w) => w.appId === app.id)
    if (!app.multiple && existing.length > 0) {
      const win = existing[0]
      set((s) => {
        const winDesktop = Object.entries(s.windowsPerDesktop).find(([, ids]) => ids.includes(win.id))?.[0] || String(s.currentDesktop)
        const winDesktopNum = Number(winDesktop)
        if (winDesktopNum !== s.currentDesktop) {
          return {
            currentDesktop: winDesktopNum,
            windows: s.windows.map((w) =>
              w.id === win.id ? { ...w, minimized: false, focused: true, zIndex: s.nextZIndex + 1 } : { ...w, focused: false }
            ),
            nextZIndex: s.nextZIndex + 1,
          }
        }
        return {
          windows: s.windows.map((w) =>
            w.id === win.id ? { ...w, minimized: false, focused: true, zIndex: s.nextZIndex + 1 } : { ...w, focused: false }
          ),
          nextZIndex: s.nextZIndex + 1,
        }
      })
      return win
    }
    const id = `window-${++windowIdCounter}`
    const offset = (state.windows.filter((w) => w.appId === app.id).length % 8) * 30
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight - 40
    const x = Math.max(0, Math.min(100 + offset, screenWidth - app.defaultWidth))
    const y = Math.max(0, Math.min(60 + offset, screenHeight - app.defaultHeight))
    const newWindow: WindowState = {
      id,
      appId: app.id,
      title: app.name,
      x,
      y,
      width: app.defaultWidth,
      height: app.defaultHeight,
      minWidth: app.minWidth,
      minHeight: app.minHeight,
      minimized: false,
      maximized: false,
      focused: true,
      zIndex: state.nextZIndex + 1,
      resizable: app.resizable,
    }
    set((s) => ({
      windows: [...s.windows.map((w) => ({ ...w, focused: false })), newWindow],
      nextZIndex: s.nextZIndex + 1,
      windowsPerDesktop: {
        ...s.windowsPerDesktop,
        [s.currentDesktop]: [...(s.windowsPerDesktop[s.currentDesktop] || []), id]
      }
    }))
    return newWindow
  },

  openApp: (appId) => {
    const state = get()
    const app = state.apps.find((a) => a.id === appId)
    if (!app) {
      console.warn(`[openApp] 未找到 id 为 "${appId}" 的应用，已忽略操作`)
      return
    }
    if (!app.multiple) {
      const existing = state.windows.find((w) => w.appId === appId)
      if (existing) {
        get().focusWindow(existing.id)
        if (existing.minimized) {
          set((s) => ({
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, minimized: false } : w
            )
          }))
        }
        const winDesktop = Object.entries(state.windowsPerDesktop)
          .find(([, ids]) => ids.includes(existing.id))?.[0]
        if (winDesktop && Number(winDesktop) !== state.currentDesktop) {
          get().switchDesktop(Number(winDesktop))
        }
        return
      }
    }
    state.addWindow(app)
  },

  closeWindow: (id) => set((s) => {
    const newWindowsPerDesktop = { ...s.windowsPerDesktop }
    Object.keys(newWindowsPerDesktop).forEach((d) => {
      newWindowsPerDesktop[Number(d)] = newWindowsPerDesktop[Number(d)].filter((wid) => wid !== id)
    })
    // 清理窗口快照以释放内存
    const newSnapshots = { ...s.windowSnapshots }
    delete newSnapshots[id]
    return {
      windows: s.windows.filter((w) => w.id !== id),
      windowsPerDesktop: newWindowsPerDesktop,
      windowSnapshots: newSnapshots,
    }
  }),

  clearWindows: () => set(() => {
    return {
      windows: [],
      windowsPerDesktop: initWindowsPerDesktop(get().totalDesktops),
      // 同时清空窗口快照缓存，避免内存泄漏
      windowSnapshots: {}
    }
  }),

  switchDesktop: (desktopNumber) => set((s) => {
    saveToStorage(STORAGE_KEYS.CURRENT_DESKTOP, String(desktopNumber))
    const needsInit =
      !s.windowsPerDesktop[desktopNumber] ||
      !Array.isArray(s.windowsPerDesktop[desktopNumber])
    if (needsInit) {
      return {
        currentDesktop: desktopNumber,
        windowsPerDesktop: {
          ...s.windowsPerDesktop,
          [desktopNumber]: []
        }
      }
    }
    return { currentDesktop: desktopNumber }
  }),

  addDesktop: () => set((s) => {
    const newDesktopNum = s.totalDesktops + 1
    const newTotal = newDesktopNum
    saveToStorage(STORAGE_KEYS.TOTAL_DESKTOPS, String(newTotal))
    return {
      totalDesktops: newTotal,
      windowsPerDesktop: { ...s.windowsPerDesktop, [newTotal]: [] }
    }
  }),

  removeDesktop: (desktopNumber) => set((s) => {
    if (s.totalDesktops <= 1) return s
    const newWindowsPerDesktop = { ...s.windowsPerDesktop }
    const movingWindows = newWindowsPerDesktop[desktopNumber] || []
    delete newWindowsPerDesktop[desktopNumber]
    
    const remainingDesktops = Object.keys(newWindowsPerDesktop).map(Number).sort((a, b) => a - b)
    const targetDesktop = remainingDesktops[0] || 1
    
    newWindowsPerDesktop[targetDesktop] = [
      ...(newWindowsPerDesktop[targetDesktop] || []),
      ...movingWindows
    ]
    
    let newCurrentDesktop = s.currentDesktop
    if (s.currentDesktop === desktopNumber) {
      newCurrentDesktop = targetDesktop
      saveToStorage(STORAGE_KEYS.CURRENT_DESKTOP, String(newCurrentDesktop))
    }
    
    const newTotal = s.totalDesktops - 1
    saveToStorage(STORAGE_KEYS.TOTAL_DESKTOPS, String(newTotal))
    return {
      totalDesktops: newTotal,
      windowsPerDesktop: newWindowsPerDesktop,
      currentDesktop: newCurrentDesktop
    }
  }),

  moveWindowToDesktop: (windowId, desktopNumber) => set((s) => {
    const newWindowsPerDesktop = { ...s.windowsPerDesktop }
    Object.keys(newWindowsPerDesktop).forEach((d) => {
      newWindowsPerDesktop[Number(d)] = newWindowsPerDesktop[Number(d)].filter((wid) => wid !== windowId)
    })
    if (!newWindowsPerDesktop[desktopNumber]) {
      newWindowsPerDesktop[desktopNumber] = []
    }
    newWindowsPerDesktop[desktopNumber].push(windowId)
    return { windowsPerDesktop: newWindowsPerDesktop }
  }),

  moveWindowToNextDesktop: () => set((s) => {
    const focusedWin = s.windows.find(w => w.focused)
    if (!focusedWin) return s
    const nextDesktop = (s.currentDesktop % s.totalDesktops) + 1
    const newWindowsPerDesktop = { ...s.windowsPerDesktop }
    Object.keys(newWindowsPerDesktop).forEach((d) => {
      newWindowsPerDesktop[Number(d)] = newWindowsPerDesktop[Number(d)].filter((wid) => wid !== focusedWin.id)
    })
    if (!newWindowsPerDesktop[nextDesktop]) {
      newWindowsPerDesktop[nextDesktop] = []
    }
    newWindowsPerDesktop[nextDesktop].push(focusedWin.id)
    return {
      windowsPerDesktop: newWindowsPerDesktop,
      currentDesktop: nextDesktop
    }
  }),

  moveWindowToPrevDesktop: () => set((s) => {
    const focusedWin = s.windows.find(w => w.focused)
    if (!focusedWin) return s
    const prevDesktop = ((s.currentDesktop - 2 + s.totalDesktops) % s.totalDesktops) + 1
    const newWindowsPerDesktop = { ...s.windowsPerDesktop }
    Object.keys(newWindowsPerDesktop).forEach((d) => {
      newWindowsPerDesktop[Number(d)] = newWindowsPerDesktop[Number(d)].filter((wid) => wid !== focusedWin.id)
    })
    if (!newWindowsPerDesktop[prevDesktop]) {
      newWindowsPerDesktop[prevDesktop] = []
    }
    newWindowsPerDesktop[prevDesktop].push(focusedWin.id)
    return {
      windowsPerDesktop: newWindowsPerDesktop,
      currentDesktop: prevDesktop
    }
  }),

  minimizeWindow: (id) =>
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id && !w.minimized)
      const topWindow = remaining.sort((a, b) => b.zIndex - a.zIndex)[0]
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, minimized: true, focused: false } :
          topWindow && w.id === topWindow.id ? { ...w, focused: true } :
          { ...w, focused: false }
        ),
      }
    }),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? {
          ...w,
          maximized: !w.maximized,
          prevX: w.maximized ? w.prevX ?? w.x : w.x,
          prevY: w.maximized ? w.prevY ?? w.y : w.y,
          prevWidth: w.maximized ? w.prevWidth ?? w.width : w.width,
          prevHeight: w.maximized ? w.prevHeight ?? w.height : w.height,
          x: w.maximized ? (w.prevX ?? w.x) : 0,
          y: w.maximized ? (w.prevY ?? w.y) : 0,
          width: w.maximized ? (w.prevWidth ?? w.width) : window.innerWidth,
          height: w.maximized ? (w.prevHeight ?? w.height) : window.innerHeight - 40,
        } : w
      ),
    })),

  focusWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id === id) {
          if (!w.focused) return { ...w, focused: true, zIndex: s.nextZIndex + 1 }
          return { ...w, zIndex: s.nextZIndex + 1 }
        }
        if (w.focused) return { ...w, focused: false }
        return w
      }),
      nextZIndex: s.nextZIndex + 1,
    })),

  updateWindowPosition: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  updateWindowSize: (id, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, width: Math.max(w.minWidth, width), height: Math.max(w.minHeight, height) }
          : w
      ),
    })),

  toggleLauncher: () => set((s) => ({ launcherOpen: !s.launcherOpen })),
  closeLauncher: () => set({ launcherOpen: false }),
  showContextMenu: (x, y) => set({ contextMenu: { x, y, visible: true } }),
  hideContextMenu: () => set({ contextMenu: { x: 0, y: 0, visible: false } }),
  setTheme: (theme) => {
    saveToStorage(STORAGE_KEYS.THEME, theme)
    const resolved = resolveTheme(theme)
    const { accentColor } = get()
    set({ theme, resolvedTheme: resolved })
    // 立即将新主题和强调色应用到DOM
    get().applyAccentToDOM(accentColor, resolved)
  },
  setAccentColor: (accent) => {
    saveToStorage(STORAGE_KEYS.ACCENT, accent)
    const { resolvedTheme } = get()
    set({ accentColor: accent })
    get().applyAccentToDOM(accent, resolvedTheme)
  },
  applyAccentToDOM: (accent, theme) => {
    if (typeof document === 'undefined') return
    const preset = accentPresets.find(p => p.id === accent) || accentPresets[0]
    const root = document.documentElement
    const activeColor = theme === 'light' ? preset.colorLight : preset.color
    root.style.setProperty('--accent', activeColor)
    root.style.setProperty('--color-primary', activeColor)
    // 渐变与光晕
    const gradient = `linear-gradient(135deg, ${activeColor} 0%, ${preset.color} 100%)`
    root.style.setProperty('--accent-gradient', gradient)
    root.style.setProperty('--accent-gradient-bicolor', gradient)
    root.style.setProperty('--accent-bg', `${activeColor}20`)
    root.style.setProperty('--accent-subtle', `${activeColor}10`)
    root.style.setProperty('--accent-glow', `0 0 25px ${activeColor}66`)
    root.style.setProperty('--accent-glow-color', `${activeColor}66`)
    root.style.setProperty('--gradient-primary', gradient)
  },
  setWallpaper: (wallpaper) => {
    saveToStorage(STORAGE_KEYS.WALLPAPER, wallpaper)
    set({ wallpaper })
  },
  setLiveWallpaper: (liveWallpaper) => {
    saveToStorage(STORAGE_KEYS.LIVE_WALLPAPER, liveWallpaper)
    set({ liveWallpaper })
  },
  toggleLiveWallpaper: () => {
    const newState = !get().liveWallpaperEnabled
    saveToStorage(STORAGE_KEYS.LIVE_WALLPAPER_ENABLED, newState)
    set({ liveWallpaperEnabled: newState })
  },

  // 文件操作：删除节点
  deleteFile: (id) =>
    set((s) => {
      const deletedNode = findNodeById(s.files, id)
      const parent = findParentNode(s.files, id)

      if (!deletedNode || !parent) {
        return s
      }

      const newFiles = removeFromTree(s.files, id)
      // 记录操作历史（用于 undo/redo）
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        {
          type: 'delete' as const,
          fileId: id,
          previousState: deletedNode,
          parentId: parent.id,
        },
      ]

      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      // 异步发送操作成功通知
      setTimeout(() => {
        get().addNotification({
          title: '已删除',
          message: `文件/文件夹 "${deletedNode.name}" 已被删除`,
          type: 'info',
          duration: 3000,
        })
      }, 0)
      return {
        files: newFiles,
        ...trimHistory(newHistory, newHistory.length - 1),
      }
    }),

  // 文件操作：新增节点（文件或文件夹）
  addFile: (parentId, name, type) =>
    set((s) => {
      const validation = validateFileName(name)
      if (!validation.valid) return s
      const parent = findNodeById(s.files, parentId)
      if (!parent || parent.type !== 'folder') return s
      if (parent.children?.some((c) => c.name === name)) return s
      const id = generateFileId()
      const now = new Date().toISOString()
      const newNode: FileNode = {
        id,
        name: name.trim(),
        type,
        parentId,
        content: type === 'file' ? '' : undefined,
        children: type === 'folder' ? [] : undefined,
        createdAt: now,
        modifiedAt: now,
      }
      const newFiles = traverseTree(s.files, (node) => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newNode] }
        }
        return undefined
      })
      // 记录操作历史（用于 undo/redo）
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'add' as const, fileId: id, newState: newNode, parentId },
      ]

      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      setTimeout(() => {
        get().addNotification({
          title: '已创建',
          message: `已${type === 'folder' ? '新建文件夹' : '新建文件'} "${newNode.name}"`,
          type: 'success',
          duration: 3000,
        })
      }, 0)
      return {
        files: newFiles,
        ...trimHistory(newHistory, newHistory.length - 1),
      }
    }),

  // 文件操作：更新文件内容（同时刷新 modifiedAt）
  updateFileContent: (id, content) =>
    set((s) => {
      const node = findNodeById(s.files, id)
      if (!node) return s

      // 记录操作历史（用于 undo/redo）
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        {
          type: 'update' as const,
          fileId: id,
          previousState: { ...node },
          newState: { ...node, content, modifiedAt: new Date().toISOString() },
        },
      ]

      const newFiles = updateInTree(s.files, id, (n) => ({
        ...n,
        content,
        modifiedAt: new Date().toISOString(),
      }))
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 500)
      return {
        files: newFiles,
        ...trimHistory(newHistory, newHistory.length - 1),
      }
    }),

  // 文件操作：重命名
  renameFile: (id, name) =>
    set((s) => {
      const node = findNodeById(s.files, id)
      if (!node) return s

      const previousName = node.name
      // 记录操作历史（用于 undo/redo）
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        {
          type: 'rename' as const,
          fileId: id,
          previousState: { ...node, name: previousName },
          newState: { ...node, name, modifiedAt: new Date().toISOString() },
        },
      ]

      const newFiles = updateInTree(s.files, id, (n) => ({
        ...n,
        name,
        modifiedAt: new Date().toISOString(),
      }))
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      setTimeout(() => {
        get().addNotification({
          title: '已重命名',
          message: `"${previousName}" → "${name}"`,
          type: 'info',
          duration: 3000,
        })
      }, 0)
      return {
        files: newFiles,
        ...trimHistory(newHistory, newHistory.length - 1),
      }
    }),

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: false, focused: true, zIndex: s.nextZIndex + 1 } : { ...w, focused: false }
      ),
      nextZIndex: s.nextZIndex + 1,
    })),

  openFileWith: (fileId, appId) => {
    const state = get()
    const app = state.apps.find((a) => a.id === appId)
    if (app) {
      const win = state.addWindow(app)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-file', { detail: { fileId, appId, windowId: win.id } }))
      }, 100)
    }
  },

  // 文件操作：复制节点到目标文件夹
  copyFile: (sourceId, targetParentId) => {
    const state = get()
    const sourceNode = findNodeById(state.files, sourceId)
    const targetParent = findNodeById(state.files, targetParentId)

    if (!sourceNode || !targetParent || targetParent.type !== 'folder') {
      return
    }

    const newNode = copyNodeWithNewParent(sourceNode, targetParentId)

    set((s) => {
      const newFiles = traverseTree(s.files, (node) => {
        if (node.id === targetParentId && node.children !== undefined) {
          return { ...node, children: [...node.children, newNode] }
        }
        return undefined
      })
      // 记录操作历史（用于 undo/redo）
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'copy' as const, fileId: newNode.id, newState: newNode, parentId: targetParentId },
      ]

      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      setTimeout(() => {
        get().addNotification({
          title: '已复制',
          message: `"${sourceNode.name}" 已复制到目标位置`,
          type: 'success',
          duration: 3000,
        })
      }, 0)
      return {
        files: newFiles,
        ...trimHistory(newHistory, newHistory.length - 1),
      }
    })
  },

  // 文件操作：移动节点到目标文件夹
  moveFile: (sourceId, targetParentId) => {
    const state = get()
    const sourceNode = findNodeById(state.files, sourceId)
    const targetParent = findNodeById(state.files, targetParentId)

    if (!sourceNode || !targetParent || targetParent.type !== 'folder') {
      return
    }

    if (sourceNode.parentId === targetParentId) {
      return
    }

    const previousState = { ...sourceNode }
    const nodeWithNewParent = {
      ...sourceNode,
      parentId: targetParentId,
      modifiedAt: new Date().toISOString(),
    } as FileNode

    set((s) => {
      const filtered = removeFromTree(s.files, sourceId)
      const withNode = traverseTree(filtered, (node) => {
        if (node.id === targetParentId && node.children !== undefined) {
          return { ...node, children: [...node.children, nodeWithNewParent] }
        }
        return undefined
      })
      // 记录操作历史（用于 undo/redo）
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'move' as const, fileId: sourceId, previousState, newState: nodeWithNewParent },
      ]

      debouncedSaveToStorage(STORAGE_KEYS.FILES, withNode, 300)
      setTimeout(() => {
        get().addNotification({
          title: '已移动',
          message: `"${sourceNode.name}" 已移动到新位置`,
          type: 'info',
          duration: 3000,
        })
      }, 0)
      return { files: withNode, ...trimHistory(newHistory, newHistory.length - 1) }
    })
  },

  // 文件操作：撤销上一步（undo）
  undoFileOperation: () => {
    const state = get()
    if (state.historyIndex < 0) return

    const operation = state.fileOperationHistory[state.historyIndex]
    if (!operation) return

    switch (operation.type) {
      case 'add':
        set((s) => {
          const newFiles = removeFromTree(s.files, operation.fileId)
          saveToStorage(STORAGE_KEYS.FILES, newFiles)
          return { files: newFiles, historyIndex: state.historyIndex - 1 }
        })
        break
      case 'delete':
        if (operation.previousState && operation.parentId) {
          set((s) => {
            const restored = traverseTree(s.files, (node) => {
              if (node.id === operation.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.previousState!] }
              }
              return undefined
            })
            saveToStorage(STORAGE_KEYS.FILES, restored)
            return { files: restored, historyIndex: state.historyIndex - 1 }
          })
        }
        break
      case 'rename':
        if (operation.previousState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.previousState!)
            saveToStorage(STORAGE_KEYS.FILES, updated)
            return { files: updated, historyIndex: state.historyIndex - 1 }
          })
        }
        break
      case 'update':
        if (operation.previousState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.previousState!)
            saveToStorage(STORAGE_KEYS.FILES, updated)
            return { files: updated, historyIndex: state.historyIndex - 1 }
          })
        }
        break
      case 'move':
        if (operation.previousState) {
          set((s) => {
            const filtered = removeFromTree(s.files, operation.fileId)
            const withNode = traverseTree(filtered, (node) => {
              if (node.id === operation.previousState!.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.previousState!] }
              }
              return undefined
            })
            saveToStorage(STORAGE_KEYS.FILES, withNode)
            return { files: withNode, historyIndex: state.historyIndex - 1 }
          })
        }
        break
      case 'copy':
        if (operation.fileId) {
          set((s) => {
            const newFiles = removeFromTree(s.files, operation.fileId)
            saveToStorage(STORAGE_KEYS.FILES, newFiles)
            return { files: newFiles, historyIndex: state.historyIndex - 1 }
          })
        }
        break
    }

    // 反馈通知
    setTimeout(() => {
      get().addNotification({
        title: '已撤销',
        message: `撤销操作：${FILE_OP_TYPE_LABELS[operation.type] || operation.type}`,
        type: 'info',
        duration: 2500,
      })
    }, 0)
  },

  // 文件操作：重做上一步（redo）
  redoFileOperation: () => {
    const state = get()
    if (state.historyIndex >= state.fileOperationHistory.length - 1) return

    const operation = state.fileOperationHistory[state.historyIndex + 1]
    if (!operation) return

    switch (operation.type) {
      case 'add':
        if (operation.newState && operation.parentId) {
          set((s) => {
            const newFiles = traverseTree(s.files, (node) => {
              if (node.id === operation.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.newState!] }
              }
              return undefined
            })
            saveToStorage(STORAGE_KEYS.FILES, newFiles)
            return {
              files: newFiles,
              historyIndex: state.historyIndex + 1,
            }
          })
        }
        break
      case 'delete':
        set((s) => {
          const newFiles = removeFromTree(s.files, operation.fileId)
          saveToStorage(STORAGE_KEYS.FILES, newFiles)
          return { files: newFiles, historyIndex: state.historyIndex + 1 }
        })
        break
      case 'rename':
        if (operation.newState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.newState!)
            saveToStorage(STORAGE_KEYS.FILES, updated)
            return {
              files: updated,
              historyIndex: state.historyIndex + 1,
            }
          })
        }
        break
      case 'update':
        if (operation.newState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.newState!)
            saveToStorage(STORAGE_KEYS.FILES, updated)
            return {
              files: updated,
              historyIndex: state.historyIndex + 1,
            }
          })
        }
        break
      case 'move':
        if (operation.newState && operation.previousState) {
          set((s) => {
            const filtered = removeFromTree(s.files, operation.fileId)
            const withNode = traverseTree(filtered, (node) => {
              if (node.id === operation.newState!.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.newState!] }
              }
              return undefined
            })
            saveToStorage(STORAGE_KEYS.FILES, withNode)
            return { files: withNode, historyIndex: state.historyIndex + 1 }
          })
        }
        break
      case 'copy':
        if (operation.newState && operation.parentId) {
          set((s) => {
            const newFiles = traverseTree(s.files, (node) => {
              if (node.id === operation.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.newState!] }
              }
              return undefined
            })
            saveToStorage(STORAGE_KEYS.FILES, newFiles)
            return {
              files: newFiles,
              historyIndex: state.historyIndex + 1,
            }
          })
        }
        break
    }

    setTimeout(() => {
      get().addNotification({
        title: '已重做',
        message: `重做操作：${FILE_OP_TYPE_LABELS[operation.type] || operation.type}`,
        type: 'info',
        duration: 2500,
      })
    }, 0)
  },

  canUndo: () => {
    const state = get()
    return state.historyIndex >= 0
  },

  canRedo: () => {
    const state = get()
    return state.historyIndex < state.fileOperationHistory.length - 1
  },

  setWindowSnapshot: (windowId: string, snapshot: string) =>
    set((s) => {
      const newSnapshots = { ...s.windowSnapshots, [windowId]: snapshot }
      // 限制快照数量上限为 20，超出时删除最早的条目
      const MAX_SNAPSHOTS = 20
      const keys = Object.keys(newSnapshots)
      if (keys.length > MAX_SNAPSHOTS) {
        const toRemove = keys.slice(0, keys.length - MAX_SNAPSHOTS)
        toRemove.forEach(k => delete newSnapshots[k])
      }
      return { windowSnapshots: newSnapshots }
    }),

  removeWindowSnapshot: (windowId: string) =>
    set((s) => {
      const newSnapshots = { ...s.windowSnapshots }
      delete newSnapshots[windowId]
      return { windowSnapshots: newSnapshots }
    }),
}))

export {
  findNodeById,
  findParentNode,
  findNodeByPath,
  getNodePath,
  resolvePath,
  validateFileName,
  generateFileId,
  countNodes,
  searchFiles,
  sortNodes,
}
