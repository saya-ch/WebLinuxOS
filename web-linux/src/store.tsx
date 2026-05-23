import { create } from 'zustand'
import type { AppDefinition, WindowState, DesktopIcon, FileNode } from './types'
import {
  FolderIcon, TerminalIcon, FileTextIcon, BrowserIcon, CalculatorIcon,
  CalendarIcon, SettingsIcon, ActivityIcon, CodeIcon
} from './icons'

// 文件树操作辅助函数
function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function findParentNode(nodes: FileNode[], childId: string): FileNode | null {
  for (const node of nodes) {
    if (node.children) {
      if (node.children.some(c => c.id === childId)) {
        return node
      }
      const found = findParentNode(node.children, childId)
      if (found) return found
    }
  }
  return null
}

function findNodeByPath(files: FileNode[], path: string): FileNode | null {
  if (path === '/' || path === '') return files[0]
  const parts = path.replace(/^\//, '').split('/')
  let current: FileNode | null = files[0]
  for (const part of parts) {
    if (!part || !current?.children) continue
    current = current.children.find((c) => c.name === part) || null
    if (!current) return null
  }
  return current
}

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target
  const parts = (cwd + '/' + target).split('/').filter(Boolean)
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '..') {
      resolved.pop()
    } else if (part !== '.') {
      resolved.push(part)
    }
  }
  return '/' + resolved.join('/')
}

function traverseTree(nodes: FileNode[], callback: (node: FileNode, parent?: FileNode) => FileNode | undefined): FileNode[] {
  return nodes.map(node => {
    const result = callback(node)
    if (result !== undefined) return result
    if (node.children) {
      return { ...node, children: traverseTree(node.children, callback) }
    }
    return node
  }).filter((node): node is FileNode => node !== null)
}

function findInTree(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

function removeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node => {
      if (node.children) {
        return { ...node, children: removeFromTree(node.children, id) }
      }
      return node
    })
}



function updateInTree(nodes: FileNode[], id: string, updater: (node: FileNode) => FileNode): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) return updater(node)
    if (node.children) {
      return { ...node, children: updateInTree(node.children, id, updater) }
    }
    return node
  })
}

export function validateFileName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '文件名不能为空' }
  }
  if (name.length > 255) {
    return { valid: false, error: '文件名过长（最大255字符）' }
  }
  const invalidChars = /[<>:"|?*]/
  if (invalidChars.test(name)) {
    return { valid: false, error: '文件名包含非法字符' }
  }
  if (name === '.' || name === '..') {
    return { valid: false, error: '不能使用此文件名' }
  }
  return { valid: true }
}

const defaultIcons: DesktopIcon[] = [
  { id: 'icon-files', appId: 'files', name: '文件管理器', icon: <FolderIcon />, x: 20, y: 20 },
  { id: 'icon-terminal', appId: 'terminal', name: '终端', icon: <TerminalIcon />, x: 20, y: 120 },
  { id: 'icon-editor', appId: 'text-editor', name: '文本编辑器', icon: <FileTextIcon />, x: 20, y: 220 },
  { id: 'icon-browser', appId: 'browser', name: '浏览器', icon: <BrowserIcon />, x: 20, y: 320 },
  { id: 'icon-code', appId: 'code-editor', name: '代码编辑器', icon: <CodeIcon />, x: 20, y: 420 },
  { id: 'icon-calc', appId: 'calculator', name: '计算器', icon: <CalculatorIcon />, x: 140, y: 20 },
  { id: 'icon-calendar', appId: 'calendar', name: '日历', icon: <CalendarIcon />, x: 140, y: 120 },
  { id: 'icon-settings', appId: 'settings', name: '设置', icon: <SettingsIcon />, x: 140, y: 220 },
  { id: 'icon-monitor', appId: 'system-monitor', name: '系统监视器', icon: <ActivityIcon />, x: 140, y: 320 },
]

const initialTheme: 'dark' | 'light' = (localStorage.getItem('weblinux-theme') as 'dark' | 'light') || 'dark'
const initialWallpaper: string = localStorage.getItem('weblinux-wallpaper') || ''
const initialCurrentDesktop = Number(localStorage.getItem('weblinux-current-desktop')) || 1
const initialTotalDesktops = 4

const initialFiles: FileNode[] = [
  { id: 'root', name: '/', type: 'folder', parentId: null, children: [
    { id: 'home', name: 'home', type: 'folder', parentId: 'root', children: [
      { id: 'user', name: 'user', type: 'folder', parentId: 'home', children: [
        { id: 'desktop', name: '桌面', type: 'folder', parentId: 'user', children: [] },
        { id: 'documents', name: '文档', type: 'folder', parentId: 'user', children: [
          { id: 'readme', name: 'README.txt', type: 'file', parentId: 'documents', content: '欢迎使用 Web Linux 系统!\n\n这是一个基于 Web 的 Linux 桌面环境。\n\n特性:\n- 50+ 功能齐全的应用程序\n- 完整的窗口管理系统\n- 文件系统\n- 终端仿真器\n\n祝你使用愉快!' },
          { id: 'notes', name: '笔记.txt', type: 'file', parentId: 'documents', content: '今天的待办事项:\n1. 完成项目开发\n2. 测试所有应用程序\n3. 优化性能' },
        ] },
        { id: 'downloads', name: '下载', type: 'folder', parentId: 'user', children: [] },
        { id: 'pictures', name: '图片', type: 'folder', parentId: 'user', children: [] },
        { id: 'music', name: '音乐', type: 'folder', parentId: 'user', children: [] },
        { id: 'videos', name: '视频', type: 'folder', parentId: 'user', children: [] },
      ] },
    ] },
    { id: 'etc', name: 'etc', type: 'folder', parentId: 'root', children: [
      { id: 'hostname', name: 'hostname', type: 'file', parentId: 'etc', content: 'web-linux' },
      { id: 'hosts', name: 'hosts', type: 'file', parentId: 'etc', content: '127.0.0.1 localhost\n::1 localhost' },
    ] },
    { id: 'tmp', name: 'tmp', type: 'folder', parentId: 'root', children: [] },
    { id: 'var', name: 'var', type: 'folder', parentId: 'root', children: [
      { id: 'log', name: 'log', type: 'folder', parentId: 'var', children: [
        { id: 'syslog', name: 'syslog', type: 'file', parentId: 'log', content: '系统日志:\n[INFO] 系统启动完成\n[INFO] 所有服务已就绪\n[INFO] 桌面环境已加载' },
      ] },
    ] },
  ] },
]

interface FileOperation {
  type: 'add' | 'delete' | 'update' | 'rename' | 'move' | 'copy'
  fileId: string
  previousState?: FileNode
  newState?: FileNode
  parentId?: string
  fileName?: string
}

interface Store {
  windows: WindowState[]
  apps: AppDefinition[]
  desktopIcons: DesktopIcon[]
  files: FileNode[]
  nextZIndex: number
  theme: 'dark' | 'light'
  wallpaper: string
  launcherOpen: boolean
  contextMenu: { x: number; y: number; visible: boolean }
  fileOperationHistory: FileOperation[]
  historyIndex: number
  currentDesktop: number
  totalDesktops: number
  windowsPerDesktop: Record<number, string[]>

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
}

let windowIdCounter = 0

export const useStore = create<Store>((set, get) => ({
  windows: [],
  apps: [],
  desktopIcons: defaultIcons,
  files: initialFiles,
  nextZIndex: 0,
  theme: initialTheme,
  wallpaper: initialWallpaper,
  launcherOpen: false,
  contextMenu: { x: 0, y: 0, visible: false },
  fileOperationHistory: [],
  historyIndex: -1,
  currentDesktop: initialCurrentDesktop,
  totalDesktops: initialTotalDesktops,
  windowsPerDesktop: { 1: [], 2: [], 3: [], 4: [] },

  registerApp: (app) => set((s) => ({ apps: [...s.apps.filter((a) => a.id !== app.id), app] })),

  addWindow: (app) => {
    const state = get()
    const existing = state.windows.filter((w) => w.appId === app.id)
    if (!app.multiple && existing.length > 0) {
      const win = existing[0]
      set((s) => {
        const winDesktop = Object.entries(s.windowsPerDesktop).find(([_, ids]) => ids.includes(win.id))?.[0] || String(s.currentDesktop)
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

  switchDesktop: (desktopNumber) => set((_) => {
    localStorage.setItem('weblinux-current-desktop', String(desktopNumber))
    return { currentDesktop: desktopNumber }
  }),

  addDesktop: () => set((s) => {
    const newDesktopNum = s.totalDesktops + 1
    return {
      totalDesktops: newDesktopNum,
      windowsPerDesktop: { ...s.windowsPerDesktop, [newDesktopNum]: [] }
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
      localStorage.setItem('weblinux-current-desktop', String(newCurrentDesktop))
    }
    
    return {
      totalDesktops: s.totalDesktops - 1,
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
    localStorage.setItem('weblinux-theme', theme)
    set({ theme })
  },
  setWallpaper: (wallpaper) => {
    localStorage.setItem('weblinux-wallpaper', wallpaper)
    set({ wallpaper })
  },

  deleteFile: (id) =>
    set((s) => {
      const deletedNode = findInTree(s.files, id)
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
      
      return {
        files: newFiles,
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),

  addFile: (parentId, name, type) =>
    set((s) => {
      const id = `file-${Date.now()}`
      const newNode: FileNode = { 
        id, 
        name, 
        type, 
        parentId, 
        content: type === 'file' ? '' : undefined, 
        children: type === 'folder' ? [] : undefined 
      }
      const newFiles = traverseTree(s.files, (node) => {
        if (node.id === parentId && node.children) {
          return { ...node, children: [...node.children, newNode] }
        }
        return undefined
      })
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'add' as const, fileId: id, newState: newNode, parentId }
      ]
      return {
        files: newFiles,
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),

  updateFileContent: (id, content) =>
    set((s) => {
      const node = findInTree(s.files, id)
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
      
      return {
        files: updateInTree(s.files, id, (node) => ({ ...node, content })),
        fileOperationHistory: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),

  renameFile: (id, name) =>
    set((s) => {
      const node = findInTree(s.files, id)
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
      
      return {
        files: updateInTree(s.files, id, (node) => ({ ...node, name })),
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
    const sourceNode = findInTree(state.files, sourceId)
    const targetParent = findInTree(state.files, targetParentId)
    
    if (!sourceNode || !targetParent || targetParent.type !== 'folder') {
      return
    }
    
    const id = `file-${Date.now()}-copy`
    const newNode: FileNode = {
      id,
      name: sourceNode.name,
      type: sourceNode.type,
      parentId: targetParentId,
      content: sourceNode.content,
      children: sourceNode.children ? sourceNode.children.map(child => ({ ...child })) : undefined,
    }
    
    set((s) => {
      const newFiles = traverseTree(s.files, (node) => {
        if (node.id === targetParentId && node.children !== undefined) {
          return { ...node, children: [...node.children, newNode] }
        }
        return undefined
      })
      const newHistory = [
        ...s.fileOperationHistory.slice(0, s.historyIndex + 1),
        { type: 'copy' as const, fileId: id, newState: newNode, parentId: targetParentId }
      ]
      return { 
        files: newFiles, 
        fileOperationHistory: newHistory, 
        historyIndex: newHistory.length - 1 
      }
    })
  },

  moveFile: (sourceId, targetParentId) => {
    const state = get()
    const sourceNode = findInTree(state.files, sourceId)
    const targetParent = findInTree(state.files, targetParentId)
    
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
            return { files: restored, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
      case 'rename':
        if (operation.previousState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.previousState!)
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
            return { files: updated, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
      case 'update':
        if (operation.previousState) {
          set((s) => {
            const updated = updateInTree(s.files, operation.fileId, () => operation.previousState!)
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
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
            return { files: withNode, fileOperationHistory: newHistory, historyIndex: newHistory.length - 1 }
          })
        }
        break
      case 'copy':
        if (operation.fileId) {
          set((s) => {
            const newFiles = removeFromTree(s.files, operation.fileId)
            const newHistory = s.fileOperationHistory.slice(0, state.historyIndex)
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
          set((s) => ({
            files: traverseTree(s.files, (node) => {
              if (node.id === operation.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.newState!] }
              }
              return undefined
            }),
            historyIndex: state.historyIndex + 1
          }))
        }
        break
      case 'delete':
        set((s) => {
          const newFiles = removeFromTree(s.files, operation.fileId)
          return { files: newFiles, historyIndex: state.historyIndex + 1 }
        })
        break
      case 'rename':
        if (operation.newState) {
          set((s) => ({
            files: updateInTree(s.files, operation.fileId, () => operation.newState!),
            historyIndex: state.historyIndex + 1
          }))
        }
        break
      case 'update':
        if (operation.newState) {
          set((s) => ({
            files: updateInTree(s.files, operation.fileId, () => operation.newState!),
            historyIndex: state.historyIndex + 1
          }))
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
            return { files: withNode, historyIndex: state.historyIndex + 1 }
          })
        }
        break
      case 'copy':
        if (operation.newState && operation.parentId) {
          set((s) => ({
            files: traverseTree(s.files, (node) => {
              if (node.id === operation.parentId && node.children !== undefined) {
                return { ...node, children: [...node.children, operation.newState!] }
              }
              return undefined
            }),
            historyIndex: state.historyIndex + 1
          }))
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

export { findNodeById, findParentNode, findNodeByPath, resolvePath }
