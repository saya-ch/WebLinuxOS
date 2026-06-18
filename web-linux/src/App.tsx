import { useEffect, memo, useCallback, useState, useRef, useMemo } from 'react'
import { useStore } from './store'
import { appRegistry } from './apps'
import Desktop from './components/desktop/Desktop'
import WindowManager from './components/desktop/WindowManager'
import Taskbar from './components/desktop/Taskbar'
import StartMenu from './components/desktop/StartMenu'
import ErrorBoundary from './components/ErrorBoundary'
import GlobalSearch from './apps/GlobalSearch'
import CommandPalette from './components/CommandPalette'

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
  'calculator': { config: { mod: true, key: 'a' }, appId: 'calculator' },
  'text-editor': { config: { mod: true, shift: true, key: 't' }, appId: 'text-editor' },
  'paint': { config: { mod: true, key: 'p' }, appId: 'paint' },
  'image-viewer': { config: { mod: true, key: 'i' }, appId: 'image-viewer' },
  'help': { config: { mod: true, key: 'h' }, appId: 'help' },
  'notes': { config: { mod: true, shift: true, key: 'n' }, appId: 'notes' },
  'calendar': { config: { mod: true, shift: true, key: 'c' }, appId: 'calendar' },
  'music-player': { config: { mod: true, shift: true, key: 'm' }, appId: 'music-player' },
  'code-editor': { config: { mod: true, key: 'g' }, appId: 'code-editor' },
  'system-monitor': { config: { mod: true, key: 'd' }, appId: 'system-monitor' },
  'weather': { config: { mod: true, shift: true, key: 'w' }, appId: 'weather' },
  'camera': { config: { mod: true, shift: true, key: 'a' }, appId: 'camera' },
  'password-manager': { config: { mod: true, shift: true, key: 'l' }, appId: 'password-manager' },
  'app-1': { config: { mod: true, key: '1' }, appId: 'terminal' },
  'app-2': { config: { mod: true, key: '2' }, appId: 'files' },
  'app-3': { config: { mod: true, key: '3' }, appId: 'browser' },
  'app-4': { config: { mod: true, key: '4' }, appId: 'settings' },
  'app-5': { config: { mod: true, key: '5' }, appId: 'calculator' },
  'app-6': { config: { mod: true, key: '6' }, appId: 'text-editor' },
  'app-7': { config: { mod: true, key: '7' }, appId: 'music-player' },
  'app-8': { config: { mod: true, key: '8' }, appId: 'system-monitor' },
  'app-9': { config: { mod: true, key: '9' }, appId: 'weather' },
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
  'global-search': { config: { mod: true, key: 'k' }, action: 'global-search' },
  'command-palette': { config: { mod: true, key: 'p' }, action: 'command-palette' },
  'lock-screen': { config: { mod: true, key: 'l' }, action: 'lock-screen' },
  'notification-center': { config: { mod: true, key: 'n' }, action: 'notification-center' },
}

const App = memo(function App() {
  const registerApp = useStore((s) => s.registerApp)
  const openApp = useStore((s) => s.openApp)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const focusWindow = useStore((s) => s.focusWindow)
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const theme = useStore((s) => s.theme)
  const windows = useStore((s) => s.windows)
  const launcherOpen = useStore((s) => s.launcherOpen)

  const [searchOpen, setSearchOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const registeredRef = useRef(false)
  const setSearchOpenRef = useRef(setSearchOpen)
  const setCommandPaletteOpenRef = useRef(setCommandPaletteOpen)

  useEffect(() => {
    setSearchOpenRef.current = setSearchOpen
    setCommandPaletteOpenRef.current = setCommandPaletteOpen
  }, [setSearchOpen, setCommandPaletteOpen])

  useEffect(() => {
    if (!registeredRef.current) {
      appRegistry.forEach((app) => registerApp(app))
      registeredRef.current = true
    }
  }, [registerApp])

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  const getFocusedWindow = useCallback(() => {
    return windows.find((w) => w.focused)
  }, [windows])

  const cycleWindows = useCallback((reverse = false) => {
    if (windows.length <= 1) return
    const sortedWindows = [...windows].sort((a, b) => b.zIndex - a.zIndex)
    const currentIndex = sortedWindows.findIndex((w) => w.focused)
    const direction = reverse ? -1 : 1
    const nextIndex = (currentIndex + direction + sortedWindows.length) % sortedWindows.length
    focusWindow(sortedWindows[nextIndex].id)
  }, [windows, focusWindow])

  const handleSystemShortcut = useCallback((action: string) => {
    const focusedWindow = getFocusedWindow()
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
        if (focusedWindow) maximizeWindow(focusedWindow.id)
        break
      case 'screenshot':
        openApp('screenshot')
        break
      case 'close-window':
        if (focusedWindow) closeWindow(focusedWindow.id)
        break
      case 'minimize-window':
        if (focusedWindow) minimizeWindow(focusedWindow.id)
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
    }
  }, [getFocusedWindow, toggleLauncher, cycleWindows, maximizeWindow, minimizeWindow, closeWindow, openApp])

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

      if (isMod && key === 'k') {
        e.preventDefault()
        setSearchOpenRef.current(true)
        return
      }

      if (isMod && key === 'p') {
        e.preventDefault()
        setCommandPaletteOpenRef.current(true)
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
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) {
          const store = useStore.getState()
          const sameAppWindows = store.windows.filter(w => w.appId === focusedWindow.appId)
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
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) {
          const store = useStore.getState()
          const sameAppWindows = store.windows.filter(w => w.appId === focusedWindow.appId)
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
    [launcherOpen, toggleLauncher, handleSystemShortcut, openApp, getFocusedWindow, focusWindow, cycleWindows, systemShortcutsArray, appShortcutsArray, matchesShortcut]
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
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </ErrorBoundary>
  )
})

export default App
