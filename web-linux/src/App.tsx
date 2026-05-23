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
  'smart-search': { config: { mod: true, shift: true, key: 's' }, appId: 'smart-search' },
  'terminal-n': { config: { mod: true, key: 'n' }, appId: 'terminal' },
  'files-e': { config: { mod: true, key: 'e' }, appId: 'files' },
  'browser-b': { config: { mod: true, key: 'b' }, appId: 'browser' },
  'settings-comma': { config: { mod: true, key: ',' }, appId: 'settings' },
  'calculator-a': { config: { mod: true, key: 'a' }, appId: 'calculator' },
  'text-editor-t': { config: { mod: true, key: 't' }, appId: 'text-editor' },
  'paint-p': { config: { mod: true, key: 'p' }, appId: 'paint' },
  'image-viewer-i': { config: { mod: true, key: 'i' }, appId: 'image-viewer' },
  'help-h': { config: { mod: true, key: 'h' }, appId: 'help' },
  'terminal-shift-t': { config: { mod: true, shift: true, key: 't' }, appId: 'terminal' },
  'files-shift-f': { config: { mod: true, shift: true, key: 'f' }, appId: 'files' },
  'notes-shift-n': { config: { mod: true, shift: true, key: 'n' }, appId: 'notes' },
  'calendar-c': { config: { mod: true, key: 'c' }, appId: 'calendar' },
  'music-m': { config: { mod: true, key: 'm' }, appId: 'music-player' },
  'code-k': { config: { mod: true, key: 'k' }, appId: 'code-editor' },
  'system-monitor-d': { config: { mod: true, key: 'd' }, appId: 'system-monitor' },
  'app-1': { config: { mod: true, key: '1' }, appId: 'terminal' },
  'app-2': { config: { mod: true, key: '2' }, appId: 'files' },
  'app-3': { config: { mod: true, key: '3' }, appId: 'browser' },
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

      // 桌面切换快捷键
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

      // 移动窗口到上一个桌面并跟随
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        const { moveWindowToPrevDesktop } = useStore.getState()
        moveWindowToPrevDesktop()
        return
      }

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

      for (const { config, action } of Object.values(systemShortcuts)) {
        if (matchesShortcut(config, isMod, isShift, isAlt, key)) {
          e.preventDefault()
          handleSystemShortcut(action)
          return
        }
      }

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
