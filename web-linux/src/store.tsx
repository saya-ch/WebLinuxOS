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

const initialTheme: 'dark' | 'light' = (() => {
  const raw = loadFromStorage<string>(STORAGE_KEYS.THEME, 'dark')
  return raw === 'light' ? 'light' : 'dark'
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

interface Notification {
  id: string
  title: string
  message: string
  icon?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  timestamp?: Date
}

interface Store {
  windows: WindowState[]
  apps: AppDefinition[]
  desktopIcons: DesktopIcon[]
  files: FileNode[]
  nextZIndex: number
  theme: 'dark' | 'light'
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

  registerApp: (app: AppDefinition) => void
  openApp: (appId: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  toggleLauncher: () => void
  closeLauncher: () => void
  showContextMenu: (x: number, y: number) => void
  hideContextMenu: () => void
  setTheme: (theme: 'dark' | 'light') => void
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
}

let windowIdCounter = 0

// 初始化 windowsPerDesktop
function initWindowsPerDesktop(total: number): Record<number, string[]> {
  const result: Record<number, string[]> = {}
  for (let i = 1; i <= total; i++) {
    result[i] = []
  }
  return result
}

export const useStore = create<Store>((set, get) => ({
  windows: [],
  apps: [],
  desktopIcons: initialDesktopIcons,
  files: initialFiles,
  nextZIndex: 0,
  theme: initialTheme,
  wallpaper: initialWallpaper,
  liveWallpaper: initialLiveWallpaper,
  liveWallpaperEnabled: initialLiveWallpaperEnabled,
  launcherOpen: false,
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

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random()}`
    set((s) => ({
      notifications: [
        ...s.notifications,
        { ...notification, id, timestamp: new Date() }
      ]
    }))
    setTimeout(() => {
      get().removeNotification(id)
    }, notification.duration || 5000)
  },

  removeNotification: (id) => {
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

  resetToDefaults: () => {
    clearAllStorage()
    set({
      files: defaultFiles,
      desktopIcons: defaultDesktopIcons,
      theme: 'dark',
      wallpaper: '',
      liveWallpaper: 'particles',
      liveWallpaperEnabled: false,
      currentDesktop: 1,
      totalDesktops: defaultTotalDesktops,
      windowsPerDesktop: initWindowsPerDesktop(defaultTotalDesktops),
      favorites: [],
      pinnedApps: defaultPinnedApps,
    })
  },

  registerApp: (app) => set((s) => ({ apps: [...s.apps.filter((a) => a.id !== app.id), app] })),

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
    if (app) state.addWindow(app)
  },

  closeWindow: (id) => set((s) => {
    const newWindowsPerDesktop = { ...s.windowsPerDesktop }
    Object.keys(newWindowsPerDesktop).forEach((d) => {
      newWindowsPerDesktop[Number(d)] = newWindowsPerDesktop[Number(d)].filter((wid) => wid !== id)
    })
    return {
      windows: s.windows.filter((w) => w.id !== id),
      windowsPerDesktop: newWindowsPerDesktop
    }
  }),

  switchDesktop: (desktopNumber) => set(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_DESKTOP, String(desktopNumber))
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
      windows: s.windows.map((w) => ({
        ...w,
        focused: w.id === id,
        zIndex: w.id === id ? s.nextZIndex + 1 : w.zIndex,
      })),
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
    set({ theme })
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

  deleteFile: (id) =>
    set((s) => {
      const deletedNode = findNodeById(s.files, id)
      const parent = findParentNode(s.files, id)
      
      if (!deletedNode || !parent) {
        return s
      }
      
      const newFiles = removeFromTree(s.files, id)
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { 
          type: 'delete' as const, 
          fileId: id, 
          previousState: deletedNode,
          parentId: parent.id
        }
      ]
      
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      return {
        files: newFiles,
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),

  addFile: (parentId, name, type) =>
    set((s) => {
      const validation = validateFileName(name)
      if (!validation.valid) return s
      const parent = findNodeById(s.files, parentId)
      if (!parent || parent.type !== 'folder') return s
      if (parent.children?.some((c) => c.name === name)) return s
      const id = generateFileId()
      const newNode: FileNode = {
        id,
        name: name.trim(),
        type,
        parentId,
        content: type === 'file' ? '' : undefined,
        children: type === 'folder' ? [] : undefined,
      }
      const newFiles = traverseTree(s.files, (node) => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newNode] }
        }
        return undefined
      })
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'add' as const, fileId: id, newState: newNode, parentId }
      ]
      
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      return {
        files: newFiles,
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),

  updateFileContent: (id, content) =>
    set((s) => {
      const node = findNodeById(s.files, id)
      if (!node) return s
      
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { 
          type: 'update' as const, 
          fileId: id, 
          previousState: { ...node },
          newState: { ...node, content }
        }
      ]
      
      const newFiles = updateInTree(s.files, id, (node) => ({ ...node, content }))
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 500)
      return {
        files: newFiles,
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),

  renameFile: (id, name) =>
    set((s) => {
      const node = findNodeById(s.files, id)
      if (!node) return s
      
      const previousName = node.name
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { 
          type: 'rename' as const, 
          fileId: id, 
          previousState: { ...node, name: previousName },
          newState: { ...node, name }
        }
      ]
      
      const newFiles = updateInTree(s.files, id, (node) => ({ ...node, name }))
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      return {
        files: newFiles,
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
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
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'copy' as const, fileId: newNode.id, newState: newNode, parentId: targetParentId }
      ]
      
      debouncedSaveToStorage(STORAGE_KEYS.FILES, newFiles, 300)
      return { 
        files: newFiles, 
        fileOperationHistory: newHistory, 
        historyIndex: newHistory.length - 1 
      }
    })
  },

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
    const nodeWithNewParent = { ...sourceNode, parentId: targetParentId } as FileNode
    
    set((s) => {
      const filtered = removeFromTree(s.files, sourceId)
      const withNode = traverseTree(filtered, (node) => {
        if (node.id === targetParentId && node.children !== undefined) {
          return { ...node, children: [...node.children, nodeWithNewParent] }
        }
        return undefined
      })
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'move' as const, fileId: sourceId, previousState, newState: nodeWithNewParent }
      ]
      
      debouncedSaveToStorage(STORAGE_KEYS.FILES, withNode, 300)
      return { files: withNode, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
    })
  },

  undoFileOperation: () => {
    const state = get()
    if (state.historyIndex < 0) return
    
    const operation = state.fileOperationHistory[state.historyIndex]
    if (!operation) return

    switch (operation.type) {
      case 'add':
        set((s) => {
          const newFiles = removeFromTree(s.files, operation.fileId)
          const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
          saveToStorage(STORAGE_KEYS.FILES, newFiles)
          return { files: newFiles, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
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
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
            saveToStorage(STORAGE_KEYS.FILES, restored)
            return { files: restored, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
      case 'rename':
        if (operation.previousState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.previousState!)
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
            saveToStorage(STORAGE_KEYS.FILES, updated)
            return { files: updated, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
      case 'update':
        if (operation.previousState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.previousState!)
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
            saveToStorage(STORAGE_KEYS.FILES, updated)
            return { files: updated, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
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
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
            saveToStorage(STORAGE_KEYS.FILES, withNode)
            return { files: withNode, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
      case 'copy':
        if (operation.fileId) {
          set((s) => {
            const newFiles = removeFromTree(s.files, operation.fileId)
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
            saveToStorage(STORAGE_KEYS.FILES, newFiles)
            return { files: newFiles, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
    }
  },

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
              historyIndex: state.historyIndex + 1
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
            const newFiles = updateInTree(s.files, operation.fileId, () => operation.newState!)
            saveToStorage(STORAGE_KEYS.FILES, newFiles)
            return {
              files: newFiles,
              historyIndex: state.historyIndex + 1
            }
          })
        }
        break
      case 'update':
        if (operation.newState) {
          set((s) => {
            const newFiles = updateInTree(s.files, operation.fileId, () => operation.newState!)
            saveToStorage(STORAGE_KEYS.FILES, newFiles)
            return {
              files: newFiles,
              historyIndex: state.historyIndex + 1
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
              historyIndex: state.historyIndex + 1
            }
          })
        }
        break
    }
  },

  canUndo: () => {
    const state = get()
    return state.historyIndex >= 0
  },

  canRedo: () => {
    const state = get()
    return state.historyIndex < state.fileOperationHistory.length - 1
  },
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
