import { useEffect, memo, useCallback, useState } from 'react'
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

  useEffect(() => {
    appRegistry.forEach((app) => registerApp(app))
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
    const toggleNotificationCenter = useStore.getState().toggleNotificationCenter
    const addNotification = useStore.getState().addNotification
    
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
        setSearchOpen(true)
        break
      case 'command-palette':
        setCommandPaletteOpen(true)
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

  const matchesShortcut = (config: ShortcutConfig, isMod: boolean, isShift: boolean, isAlt: boolean, key: string): boolean => {
    if (config.mod !== undefined && config.mod !== isMod) return false
    if (config.shift !== undefined && config.shift !== isShift) return false
    if (config.alt !== undefined && config.alt !== isAlt) return false
    
    const shortcutKey = Array.isArray(config.key) ? config.key : [config.key]
    return shortcutKey.some(k => k.toLowerCase() === key)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey
      const isAlt = e.altKey
      const key = e.key.toLowerCase()

      if (launcherOpen) {
        if (e.key === 'Escape') {
          e.preventDefault()
          toggleLauncher()
        }
        return
      }

      if (isMod && key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      
      if (isMod && key === 'p') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // Focus trap check - don't process shortcuts when typing in input fields
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('contenteditable') === 'true')) {
        if (e.key === 'Escape') {
          (activeElement as HTMLElement).blur()
        }
        return
      }

      // Desktop switching shortcuts
      if (e.ctrlKey && e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const desktopNum = parseInt(e.key)
        const total = useStore.getState().totalDesktops
        if (desktopNum <= total) {
          useStore.getState().switchDesktop(desktopNum)
        }
        return
      }

      // 切换到上一个/下一个桌面
      if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        const { currentDesktop, totalDesktops, switchDesktop } = useStore.getState()
        const newDesktop = currentDesktop === 1 ? totalDesktops : currentDesktop - 1
        switchDesktop(newDesktop)
        return
      }

      if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        const { currentDesktop, totalDesktops, switchDesktop } = useStore.getState()
        const newDesktop = currentDesktop === totalDesktops ? 1 : currentDesktop + 1
        switchDesktop(newDesktop)
        return
      }

      // 移动当前窗口到其他桌面
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const desktopNum = parseInt(e.key)
        const { windows, totalDesktops, moveWindowToDesktop } = useStore.getState()
        const focusedWindow = windows.find(w => w.focused)
        if (focusedWindow && desktopNum <= totalDesktops) {
          moveWindowToDesktop(focusedWindow.id, desktopNum)
        }
        return
      }

      // 移动窗口到下一个桌面并跟随
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        const { moveWindowToNextDesktop } = useStore.getState()
        moveWindowToNextDesktop()
        return
      }

      // Move window to previous desktop and follow
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        const { moveWindowToPrevDesktop } = useStore.getState()
        moveWindowToPrevDesktop()
        return
      }

      // Switch to same app window (Ctrl+Shift+ArrowUp/Down)
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault()
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) {
          const windows = useStore.getState().windows
          const otherWindow = windows.find(w => !w.focused && w.appId === focusedWindow.appId)
          if (otherWindow) focusWindow(otherWindow.id)
        }
        return
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault()
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) {
          const windows = useStore.getState().windows
          const otherWindow = windows.find(w => !w.focused && w.appId === focusedWindow.appId)
          if (otherWindow) focusWindow(otherWindow.id)
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
      for (const { config, action } of Object.values(systemShortcuts)) {
        if (matchesShortcut(config, isMod, isShift, isAlt, key)) {
          e.preventDefault()
          handleSystemShortcut(action)
          return
        }
      }

      // Process app launch shortcuts
      if (isMod) {
        for (const { config, appId } of Object.values(appShortcuts)) {
          if (matchesShortcut(config, isMod, isShift, isAlt, key)) {
            e.preventDefault()
            openApp(appId)
            return
          }
        }
      }
    },
    [launcherOpen, toggleLauncher, handleSystemShortcut, openApp, getFocusedWindow, focusWindow, cycleWindows]
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
