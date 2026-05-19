import { create } from 'zustand'
import type { AppDefinition, WindowState, DesktopIcon, FileNode } from './types'

const defaultIcons: DesktopIcon[] = [
  { id: 'icon-files', appId: 'files', name: '文件管理器', icon: '📁', x: 20, y: 20 },
  { id: 'icon-terminal', appId: 'terminal', name: '终端', icon: '💻', x: 20, y: 120 },
  { id: 'icon-editor', appId: 'text-editor', name: '文本编辑器', icon: '📝', x: 20, y: 220 },
  { id: 'icon-browser', appId: 'browser', name: '浏览器', icon: '🌐', x: 20, y: 320 },
  { id: 'icon-code', appId: 'code-editor', name: '代码编辑器', icon: '⚡', x: 20, y: 420 },
  { id: 'icon-calc', appId: 'calculator', name: '计算器', icon: '🔢', x: 140, y: 20 },
  { id: 'icon-calendar', appId: 'calendar', name: '日历', icon: '📅', x: 140, y: 120 },
  { id: 'icon-settings', appId: 'settings', name: '设置', icon: '⚙️', x: 140, y: 220 },
  { id: 'icon-monitor', appId: 'system-monitor', name: '系统监视器', icon: '📊', x: 140, y: 320 },
]

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
}

let windowIdCounter = 0

export const useStore = create<Store>((set, get) => ({
  windows: [],
  apps: [],
  desktopIcons: defaultIcons,
  files: initialFiles,
  nextZIndex: 0,
  theme: 'dark',
  wallpaper: '',
  launcherOpen: false,
  contextMenu: { x: 0, y: 0, visible: false },

  registerApp: (app) => set((s) => ({ apps: [...s.apps.filter((a) => a.id !== app.id), app] })),

  addWindow: (app) => {
    const state = get()
    const existing = state.windows.filter((w) => w.appId === app.id)
    if (!app.multiple && existing.length > 0) {
      const win = existing[0]
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === win.id ? { ...w, minimized: false, focused: true, zIndex: s.nextZIndex + 1 } : { ...w, focused: false }
        ),
        nextZIndex: s.nextZIndex + 1,
      }))
      return win
    }
    const id = `window-${++windowIdCounter}`
    const offset = (state.windows.filter((w) => w.appId === app.id).length % 8) * 30
    const newWindow: WindowState = {
      id,
      appId: app.id,
      title: app.name,
      x: 100 + offset,
      y: 60 + offset,
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
    }))
    return newWindow
  },

  openApp: (appId) => {
    const state = get()
    const app = state.apps.find((a) => a.id === appId)
    if (app) state.addWindow(app)
  },

  closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w
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
  setTheme: (theme) => set({ theme }),
  setWallpaper: (wallpaper) => set({ wallpaper }),

  deleteFile: (id) =>
    set((s) => {
      const removeFromTree = (nodes: FileNode[]): FileNode[] =>
        nodes.filter((n) => n.id !== id).map((n) => (n.children ? { ...n, children: removeFromTree(n.children) } : n))
      return { files: removeFromTree(s.files) }
    }),

  addFile: (parentId, name, type) =>
    set((s) => {
      const id = `file-${Date.now()}`
      const newNode: FileNode = { id, name, type, parentId, content: type === 'file' ? '' : undefined, children: type === 'folder' ? [] : undefined }
      const addToTree = (nodes: FileNode[]): FileNode[] =>
        nodes.map((n) => (n.id === parentId && n.children ? { ...n, children: [...n.children, newNode] } : n.children ? { ...n, children: addToTree(n.children) } : n))
      return { files: addToTree(s.files) }
    }),

  updateFileContent: (id, content) =>
    set((s) => {
      const updateTree = (nodes: FileNode[]): FileNode[] =>
        nodes.map((n) => (n.id === id ? { ...n, content } : n.children ? { ...n, children: updateTree(n.children) } : n))
      return { files: updateTree(s.files) }
    }),
}))