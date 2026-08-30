import { useEffect, memo, useCallback, useState, useRef, useMemo, lazy, Suspense } from 'react'
import { useStore } from './store'
import { appRegistry } from './apps'
import Desktop from './components/desktop/Desktop'
import WindowManager from './components/desktop/WindowManager'
import Taskbar from './components/desktop/Taskbar'
import StartMenu from './components/desktop/StartMenu'
import ErrorBoundary from './components/ErrorBoundary'
import QuickActionCenter from './components/QuickActionCenter'
const GlobalSearch = lazy(() => import('./apps/GlobalSearch'))
import CommandPalette from './components/CommandPalette'
import ShortcutPanel from './components/ShortcutPanel'
import SmartCommandCenter from './components/SmartCommandCenter'
import QuickNoteOverlay from './components/QuickNoteOverlay'
import { getSyncService } from './services/syncService'
import { preloadFilesTree } from './store/storageUtils'
import './styles/cyberpunk-theme.css'
import './styles/quantum-theme.css'

interface ShortcutConfig {
  mod?: boolean
  shift?: boolean
  alt?: boolean
  key: string | string[]
}

const appShortcuts: Record<string, { config: ShortcutConfig; appId: string }> = {
  'smart-search': { config: { mod: true, shift: true, key: 'k' }, appId: 'smart-search' },
  'terminal': { config: { mod: true, key: 't' }, appId: 'terminal' },
  'files': { config: { mod: true, key: 'e' }, appId: 'files' },
  'browser': { config: { mod: true, key: 'b' }, appId: 'browser' },
  'settings': { config: { mod: true, key: ',' }, appId: 'settings' },
  'calculator': { config: { mod: true, shift: true, key: 'c' }, appId: 'calculator' },
  'text-editor': { config: { mod: true, shift: true, key: 'e' }, appId: 'text-editor' },
  'paint': { config: { mod: true, shift: true, key: 'p' }, appId: 'paint' },
  'image-viewer': { config: { mod: true, key: 'i' }, appId: 'image-viewer' },
  'help': { config: { mod: true, key: 'h' }, appId: 'help' },
  'notes': { config: { mod: true, alt: true, key: 'n' }, appId: 'notes' },
  'calendar': { config: { mod: true, shift: true, key: 'd' }, appId: 'calendar' },
  'music-player': { config: { mod: true, shift: true, key: 'm' }, appId: 'music-player' },
  'code-editor': { config: { mod: true, key: 'g' }, appId: 'code-editor' },
  'system-monitor': { config: { mod: true, key: 's' }, appId: 'system-monitor' },
  'weather': { config: { mod: true, shift: true, key: 'w' }, appId: 'weather' },
  'camera': { config: { mod: true, alt: true, key: 'i' }, appId: 'camera' },
  'password-manager': { config: { mod: true, shift: true, key: 'o' }, appId: 'password-manager' },
  'app-1': { config: { mod: true, key: '1' }, appId: 'terminal' },
  'app-2': { config: { mod: true, key: '2' }, appId: 'files' },
  'app-3': { config: { mod: true, key: '3' }, appId: 'browser' },
  'app-4': { config: { mod: true, key: '4' }, appId: 'settings' },
  'app-5': { config: { mod: true, key: '5' }, appId: 'calculator' },
  'app-6': { config: { mod: true, key: '6' }, appId: 'text-editor' },
  'app-7': { config: { mod: true, key: '7' }, appId: 'music-player' },
  'app-8': { config: { mod: true, key: '8' }, appId: 'system-monitor' },
  'app-9': { config: { mod: true, key: '9' }, appId: 'weather' },
  'studio-suite': { config: { mod: true, shift: true, key: 'u' }, appId: 'studio-suite' },
}

const systemShortcuts: Record<string, { config: ShortcutConfig; action: string }> = {
  'launcher': { config: { mod: true, shift: true, key: 'l' }, action: 'launcher' },
  'cycle-windows': { config: { mod: true, alt: true, key: 'Tab' }, action: 'cycle-windows' },
  'cycle-windows-reverse': { config: { mod: true, alt: true, shift: true, key: 'Tab' }, action: 'cycle-windows-reverse' },
  'maximize-f11': { config: { key: 'F11' }, action: 'maximize-f11' },
  'screenshot': { config: { key: 'PrintScreen' }, action: 'screenshot' },
  'close-window': { config: { mod: true, key: 'q' }, action: 'close-window' },
  'minimize-window': { config: { mod: true, key: 'm' }, action: 'minimize-window' },
  'new-terminal': { config: { mod: true, shift: true, key: 'n' }, action: 'new-terminal' },
  // 以下三个快捷键（global-search / command-palette / smart-command-center）
  // 已在 handleKeyDown 中提前直接处理，不再放入 systemShortcuts，避免重复触发或死代码
  'lock-screen': { config: { mod: true, key: 'l' }, action: 'lock-screen' },
  'notification-center': { config: { mod: true, key: 'n' }, action: 'notification-center' },
  'shortcuts': { config: { mod: true, shift: true, key: '?' }, action: 'shortcuts' },
  'quick-action-center': { config: { mod: true, key: 'a' }, action: 'quick-action-center' },
}

const App = memo(function App() {
  const registerApps = useStore((s) => s.registerApps)
  const openApp = useStore((s) => s.openApp)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const focusWindow = useStore((s) => s.focusWindow)
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const theme = useStore((s) => s.theme)
  const resolvedTheme = useStore((s) => s.resolvedTheme)
  const accentColor = useStore((s) => s.accentColor)
  const applyAccentToDOM = useStore((s) => s.applyAccentToDOM)
  const setTheme = useStore((s) => s.setTheme)
  const launcherOpen = useStore((s) => s.launcherOpen)
  const refreshSystemStats = useStore((s) => s.refreshSystemStats)
  const setSystemStatus = useStore((s) => s.setSystemStatus)
  const quickActionCenterOpen = useStore((s) => s.quickActionCenterOpen)
  const toggleQuickActionCenter = useStore((s) => s.toggleQuickActionCenter)
  const closeQuickActionCenter = useStore((s) => s.closeQuickActionCenter)

  const [searchOpen, setSearchOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutPanelOpen, setShortcutPanelOpen] = useState(false)
  const [smartCommandOpen, setSmartCommandOpen] = useState(false)
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const registeredRef = useRef(false)
  const setSearchOpenRef = useRef(setSearchOpen)
  const setCommandPaletteOpenRef = useRef(setCommandPaletteOpen)
  const setSmartCommandOpenRef = useRef(setSmartCommandOpen)
  const setQuickNoteOpenRef = useRef(setQuickNoteOpen)

  useEffect(() => {
    setSearchOpenRef.current = setSearchOpen
    setCommandPaletteOpenRef.current = setCommandPaletteOpen
    setSmartCommandOpenRef.current = setSmartCommandOpen
    setQuickNoteOpenRef.current = setQuickNoteOpen
  }, [setSearchOpen, setCommandPaletteOpen, setSmartCommandOpen, setQuickNoteOpen])

  useEffect(() => {
    if (!registeredRef.current) {
      // 批量注册，避免 350+ 个应用逐个调用 registerApp 触发的 O(n²) 性能问题
      registerApps(appRegistry)
      registeredRef.current = true
      // 初始化 IndexedDB 文件存储（从 localStorage 迁移旧数据）
      preloadFilesTree().catch(() => { /* 静默失败 */ })
    }
  }, [registerApps])

  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    // 应用强调色到DOM
    applyAccentToDOM(accentColor, resolvedTheme)
  }, [resolvedTheme, accentColor, applyAccentToDOM])

  // 监听系统主题变化（当用户选择auto时）
  useEffect(() => {
    if (theme !== 'auto') return
    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => {
      // 触发主题系统重新解析：通过一个微妙的setTheme调用让store重新计算resolvedTheme
      setTheme('auto')
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme, setTheme])

  useEffect(() => {
    refreshSystemStats()
    const interval = setInterval(refreshSystemStats, 5000)
    return () => clearInterval(interval)
  }, [refreshSystemStats])

  // === 跨标签页实时同步（v99 新特性）===
  useEffect(() => {
    const sync = getSyncService()
    if (!sync) return
    const unsubTheme = sync.subscribe<string>('theme-change', (msg) => {
      if (msg.tabId === sync.getTabId()) return
      const t = msg.payload
      if (t === 'light' || t === 'dark' || t === 'auto') {
        useStore.getState().setTheme(t)
      }
    })
    const unsubAccent = sync.subscribe<string>('accent-change', (msg) => {
      if (msg.tabId === sync.getTabId()) return
      const a = msg.payload
      useStore.getState().setAccentColor?.(a as never)
    })
    const unsubFile = sync.subscribe('file-change', () => {
      useStore.getState().refreshSystemStats?.()
    })
    const unsubPresence = sync.subscribe('presence', () => {
      // 通知栏可选择展示 peer 变化，这里暂不做 UI 打扰
    })
    return () => {
      unsubTheme()
      unsubAccent()
      unsubFile()
      unsubPresence()
    }
  }, [])

  // 主题/强调色变更时广播到其它标签页
  const lastThemeRef = useRef(theme)
  const lastAccentRef = useRef(accentColor)
  useEffect(() => {
    const sync = getSyncService()
    if (!sync) return
    if (lastThemeRef.current !== theme) {
      lastThemeRef.current = theme
      sync.broadcast('theme-change', theme)
    }
  }, [theme])
  useEffect(() => {
    const sync = getSyncService()
    if (!sync) return
    if (lastAccentRef.current !== accentColor) {
      lastAccentRef.current = accentColor
      sync.broadcast('accent-change', accentColor)
    }
  }, [accentColor])

  const handleLaunchAppRef = useRef<EventListener | null>(null)

  // searchApps 前缀索引：按 app 名称/id 建立 Map<prefix, appId[]>，仅在 apps 变化时重建
  const appsPrefixIndexRef = useRef<Map<string, string[]>>(new Map())
  const apps = useStore((s) => s.apps)
  useEffect(() => {
    const idx = new Map<string, string[]>()
    // 优化：只为每个 app 生成最短有区分度的前缀（至少3字符），而非每个字符位置都建索引
    // 这将索引条目从 O(n*L) 降低到 O(n * min(L, MAX_PREFIXES))
    const MAX_PREFIXES_PER_APP = 6
    for (const app of apps) {
      const lowerName = app.name.toLowerCase()
      const lowerId = app.id.toLowerCase()
      const nameLen = Math.min(lowerName.length, MAX_PREFIXES_PER_APP)
      const idLen = Math.min(lowerId.length, MAX_PREFIXES_PER_APP)
      for (let len = 3; len <= nameLen; len++) {
        const prefix = lowerName.slice(0, len)
        const list = idx.get(prefix)
        if (list) {
          list.push(app.id)
        } else {
          idx.set(prefix, [app.id])
        }
      }
      if (lowerId !== lowerName) {
        for (let len = 3; len <= idLen; len++) {
          const prefix = lowerId.slice(0, len)
          const list = idx.get(prefix)
          if (list) {
            list.push(app.id)
          } else {
            idx.set(prefix, [app.id])
          }
        }
      }
    }
    appsPrefixIndexRef.current = idx
  }, [apps])

  // === v58 全局 API 暴露（useEffect 中挂载，确保不在渲染阶段执行副作用）===
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as Window & {
        __weblinux_api_ready?: boolean
        WebLinuxOS?: {
          openApp: (appId: string) => void
          closeWindow: (windowId: string) => void
          focusWindow: (windowId: string) => void
          minimizeWindow: (windowId: string) => void
          maximizeWindow: (windowId: string) => void
          restoreWindow: (windowId: string) => void
          clearWindows: () => void
          toggleLauncher: () => void
          switchDesktop: (n: number) => void
          getApps: () => unknown
          getWindows: () => unknown
          getState: () => unknown
          listApps: () => Array<{ id: string; name: string; category: string }>
          searchApps: (query: string) => Array<{ id: string; name: string; category: string; description?: string }>
          getSystemStats: () => unknown
          refreshSystemStats: () => void
          addQuickNote: (content: string) => void
          addNotification: (n: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }) => void
          getNotifications: () => unknown
          version: string
          buildTime: string
        }
      }
      if (!win.__weblinux_api_ready) {
        Object.defineProperty(win, '__weblinux_api_ready', { value: true, writable: false, configurable: false })
        const st = useStore
        const globalApi = {
          openApp: (appId: string) => st.getState().openApp(appId),
          closeWindow: (windowId: string) => st.getState().closeWindow(windowId),
          focusWindow: (windowId: string) => st.getState().focusWindow(windowId),
          minimizeWindow: (windowId: string) => st.getState().minimizeWindow(windowId),
          maximizeWindow: (windowId: string) => st.getState().maximizeWindow(windowId),
          restoreWindow: (windowId: string) => st.getState().restoreWindow(windowId),
          clearWindows: () => st.getState().clearWindows(),
          toggleLauncher: () => st.getState().toggleLauncher(),
          switchDesktop: (n: number) => st.getState().switchDesktop(n),
          getApps: () => st.getState().apps,
          getWindows: () => st.getState().windows,
          addNotification: (n: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }) => st.getState().addNotification(n),
          getState: () => st.getState(),
          listApps: () => st.getState().apps.map(a => ({ id: a.id, name: a.name, category: a.category })),
          searchApps: (query: string) => {
            const q = query.toLowerCase()
            const allApps = st.getState().apps
            // 利用前缀索引快速缩小候选范围
            const prefixHits = appsPrefixIndexRef.current.get(q)
            let candidates = prefixHits
              ? allApps.filter((a) => prefixHits.includes(a.id))
              : allApps
            // 在候选集中做 substring 匹配
            return candidates
              .filter(
                (a) =>
                  a.name.toLowerCase().includes(q) ||
                  a.id.toLowerCase().includes(q) ||
                  (a.description || '').toLowerCase().includes(q),
              )
              .map((a) => ({ id: a.id, name: a.name, category: a.category, description: a.description }))
          },
          getSystemStats: () => st.getState().systemStats,
          refreshSystemStats: () => st.getState().refreshSystemStats(),
          addQuickNote: (content: string) => {
            const store = st.getState()
            const timestamp = Date.now()
            store.addFile('notes', `QuickNote-${timestamp}`, 'file')
            const updatedFiles = st.getState().files
            const notesNode = updatedFiles.find(n => n.id === 'notes')
            const lastChild = notesNode?.children?.slice(-1)[0]
            if (lastChild) {
              store.updateFileContent(lastChild.id, content)
            }
          },
          getNotifications: () => st.getState().notifications,
          version: __APP_VERSION__,
          buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '',
        }
        win.WebLinuxOS = globalApi
        window.dispatchEvent(new CustomEvent('weblinux-ready', { detail: globalApi }))

        handleLaunchAppRef.current = ((e: Event) => {
          const ce = e as CustomEvent<{ appId?: string; id?: string }>
          const appId = ce?.detail?.appId || ce?.detail?.id
          if (appId) st.getState().openApp(appId)
        }) as EventListener
        window.addEventListener('weblinux-launch-app', handleLaunchAppRef.current)
        window.addEventListener('weblinux-open-app', handleLaunchAppRef.current)
      }
    }

    return () => {
      if (handleLaunchAppRef.current) {
        window.removeEventListener('weblinux-launch-app', handleLaunchAppRef.current)
        window.removeEventListener('weblinux-open-app', handleLaunchAppRef.current)
      }
    }
  }, [])

  // 监听「速记」自定义事件：允许任务栏等任意组件唤起全局快速笔记覆盖层
  useEffect(() => {
    const openQuickNote = () => setQuickNoteOpen(true)
    window.addEventListener('weblinux-open-quicknote', openQuickNote)
    return () => window.removeEventListener('weblinux-open-quicknote', openQuickNote)
  }, [])

  useEffect(() => {
    const handleOnline = () => setSystemStatus('online')
    const handleOffline = () => setSystemStatus('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setSystemStatus])

  const cycleWindows = useCallback((reverse = false) => {
    const currentWindows = useStore.getState().windows
    if (currentWindows.length <= 1) return
    const sortedWindows = [...currentWindows].sort((a, b) => b.zIndex - a.zIndex)
    const currentIndex = sortedWindows.findIndex((w) => w.focused)
    const direction = reverse ? -1 : 1
    const nextIndex = (currentIndex + direction + sortedWindows.length) % sortedWindows.length
    focusWindow(sortedWindows[nextIndex].id)
  }, [focusWindow])

  const handleSystemShortcut = useCallback((action: string) => {
    const currentWindows = useStore.getState().windows
    const focusedWindowId = currentWindows.find((w) => w.focused)?.id
    const store = useStore.getState()
    const toggleNotificationCenter = store.toggleNotificationCenter
    const addNotification = store.addNotification
    
    switch (action) {
      case 'launcher':
        toggleLauncher()
        break
      case 'cycle-windows':
        cycleWindows()
        break
      case 'cycle-windows-reverse':
        cycleWindows(true)
        break
      case 'maximize-f11':
        if (focusedWindowId) maximizeWindow(focusedWindowId)
        break
      case 'screenshot':
        openApp('screenshot')
        break
      case 'close-window':
        if (focusedWindowId) closeWindow(focusedWindowId)
        break
      case 'minimize-window':
        if (focusedWindowId) minimizeWindow(focusedWindowId)
        break
      case 'new-terminal':
        openApp('terminal')
        break
      case 'global-search':
        setSearchOpenRef.current(true)
        break
      case 'command-palette':
        setCommandPaletteOpenRef.current(true)
        break
      case 'lock-screen':
        addNotification({
          title: '屏幕已锁定',
          message: '按任意键或点击解锁',
          type: 'info',
          duration: 3000
        })
        break
      case 'notification-center':
        toggleNotificationCenter()
        break
      case 'shortcuts':
        setShortcutPanelOpen(true)
        break
      case 'quick-action-center':
        toggleQuickActionCenter()
        break
    }
  }, [toggleLauncher, cycleWindows, maximizeWindow, minimizeWindow, closeWindow, openApp, toggleQuickActionCenter])

  const matchesShortcut = useCallback((config: ShortcutConfig, isMod: boolean, isShift: boolean, isAlt: boolean, key: string): boolean => {
    if (config.mod !== undefined && config.mod !== isMod) return false
    if (config.shift !== undefined && config.shift !== isShift) return false
    if (config.alt !== undefined && config.alt !== isAlt) return false
    
    const shortcutKey = Array.isArray(config.key) ? config.key : [config.key]
    return shortcutKey.some(k => k.toLowerCase() === key)
  }, [])

  const systemShortcutsArray = useMemo(() => Object.values(systemShortcuts), [])
  const appShortcutsArray = useMemo(() => Object.values(appShortcuts), [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey
      const isAlt = e.altKey
      const key = e.key.toLowerCase()
      const activeElement = document.activeElement

      if (launcherOpen) {
        if (e.key === 'Escape') {
          e.preventDefault()
          toggleLauncher()
        }
        return
      }

      // Prevent most global shortcuts when typing in text fields (but always allow Esc)
      const isTypingInField =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')

      if (isTypingInField) {
        // Allow only Escape (to blur) and combinations explicitly intended for text editing
        if (e.key === 'Escape') {
          ;(activeElement as HTMLElement).blur()
        }
        return
      }

      if (isMod && key === ' ') {
        e.preventDefault()
        setSmartCommandOpenRef.current(true)
        return
      }

      if (isMod && key === 'k') {
        e.preventDefault()
        setSearchOpenRef.current(true)
        return
      }

      if (isMod && key === '/') {
        e.preventDefault()
        setShortcutPanelOpen(true)
        return
      }

      // Command Palette: Ctrl/Cmd + Shift + P (Palette) — 避免浏览器打印对话框
      if (isMod && isShift && key === 'p') {
        e.preventDefault()
        e.stopPropagation()
        setCommandPaletteOpenRef.current(true)
        return
      }

      // Command Palette: Ctrl/Cmd + P
      if (isMod && key === 'p') {
        e.preventDefault()
        setCommandPaletteOpenRef.current(true)
        return
      }

      // 全局快速笔记覆盖层：Alt + N (N = Note 速记)
      if (e.altKey && !isMod && key === 'n') {
        e.preventDefault()
        setQuickNoteOpenRef.current(true)
        return
      }

      // Desktop switching shortcuts
      if (e.ctrlKey && e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const desktopNum = parseInt(e.key)
        const store = useStore.getState()
        const total = store.totalDesktops
        if (desktopNum <= total) {
          store.switchDesktop(desktopNum)
        }
        return
      }

      // 切换到上一个/下一个桌面
      if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        const store = useStore.getState()
        const newDesktop = store.currentDesktop === 1 ? store.totalDesktops : store.currentDesktop - 1
        store.switchDesktop(newDesktop)
        return
      }

      if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        const store = useStore.getState()
        const newDesktop = store.currentDesktop === store.totalDesktops ? 1 : store.currentDesktop + 1
        store.switchDesktop(newDesktop)
        return
      }

      // 移动当前窗口到其他桌面
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const desktopNum = parseInt(e.key)
        const store = useStore.getState()
        const focusedWindow = store.windows.find(w => w.focused)
        if (focusedWindow && desktopNum <= store.totalDesktops) {
          store.moveWindowToDesktop(focusedWindow.id, desktopNum)
        }
        return
      }

      // 移动窗口到下一个桌面并跟随
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        const store = useStore.getState()
        store.moveWindowToNextDesktop()
        return
      }

      // Move window to previous desktop and follow
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        const store = useStore.getState()
        store.moveWindowToPrevDesktop()
        return
      }

      // Switch to same app window (Ctrl+Shift+ArrowUp/Down)
      // 仅在同一个 appId 下存在多个窗口实例时才执行切换，避免无意义操作。
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault()
        const currentWindows = useStore.getState().windows
        const focusedWindow = currentWindows.find(w => w.focused)
        if (focusedWindow) {
          const sameAppWindows = currentWindows.filter(w => w.appId === focusedWindow.appId)
          if (sameAppWindows.length > 1) {
            const idx = sameAppWindows.findIndex(w => w.focused)
            const next = sameAppWindows[(idx - 1 + sameAppWindows.length) % sameAppWindows.length]
            focusWindow(next.id)
          }
        }
        return
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault()
        const currentWindows = useStore.getState().windows
        const focusedWindow = currentWindows.find(w => w.focused)
        if (focusedWindow) {
          const sameAppWindows = currentWindows.filter(w => w.appId === focusedWindow.appId)
          if (sameAppWindows.length > 1) {
            const idx = sameAppWindows.findIndex(w => w.focused)
            const next = sameAppWindows[(idx + 1) % sameAppWindows.length]
            focusWindow(next.id)
          }
        }
        return
      }

      // Alt+Tab window switching
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        cycleWindows(false)
        return
      }

      if (e.altKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        cycleWindows(true)
        return
      }

      // Process system shortcuts
      for (const { config, action } of systemShortcutsArray) {
        if (matchesShortcut(config, isMod, isShift, isAlt, key)) {
          e.preventDefault()
          handleSystemShortcut(action)
          return
        }
      }

      // Process app launch shortcuts
      if (isMod) {
        for (const { config, appId } of appShortcutsArray) {
          if (matchesShortcut(config, isMod, isShift, isAlt, key)) {
            e.preventDefault()
            openApp(appId)
            return
          }
        }
      }
    },
    [launcherOpen, toggleLauncher, handleSystemShortcut, openApp, focusWindow, cycleWindows, systemShortcutsArray, appShortcutsArray, matchesShortcut]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <ErrorBoundary>
      <Desktop />
      <WindowManager />
      <StartMenu />
      <Taskbar />
      <Suspense fallback={null}>
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </Suspense>
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <ShortcutPanel isOpen={shortcutPanelOpen} onClose={() => setShortcutPanelOpen(false)} />
      <SmartCommandCenter isOpen={smartCommandOpen} onClose={() => setSmartCommandOpen(false)} />
      <QuickNoteOverlay isOpen={quickNoteOpen} onClose={() => setQuickNoteOpen(false)} />
      <QuickActionCenter isOpen={quickActionCenterOpen} onClose={closeQuickActionCenter} />
    </ErrorBoundary>
  )
})

export default App
