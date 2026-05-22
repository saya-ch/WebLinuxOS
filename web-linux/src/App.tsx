import { useEffect, memo, useCallback } from 'react'
import { useStore } from './store'
import { appRegistry } from './apps'
import Desktop from './components/desktop/Desktop'
import WindowManager from './components/desktop/WindowManager'
import Taskbar from './components/desktop/Taskbar'
import StartMenu from './components/desktop/StartMenu'
import ErrorBoundary from './components/ErrorBoundary'

interface ShortcutKey {
  modifier?: 'mod' | 'modShift' | 'modAlt' | 'modAltShift'
  key: string | string[]
}

interface SystemShortcut {
  modifier?: string
  key: string
}

const appShortcuts: Record<string, ShortcutKey> = {
  'terminal': { modifier: 'mod', key: 'n' },
  'files': { modifier: 'mod', key: 'e' },
  'browser': { modifier: 'mod', key: 'b' },
  'settings': { modifier: 'mod', key: ',' },
  'calculator': { modifier: 'mod', key: 'a' },
  'text-editor': { modifier: 'mod', key: 't' },
  'paint': { modifier: 'mod', key: 'p' },
  'image-viewer': { modifier: 'mod', key: 'i' },
  'help': { modifier: 'mod', key: 'h' },
  'terminal-shift': { modifier: 'modShift', key: 't' },
  'files-shift': { modifier: 'modShift', key: 'f' },
  'settings-shift': { modifier: 'modShift', key: 's' },
  'notes-shift': { modifier: 'modShift', key: 'n' },
  'app-1': { modifier: 'mod', key: '1' },
  'app-2': { modifier: 'mod', key: '2' },
  'app-3': { modifier: 'mod', key: '3' },
}

const systemShortcuts: Record<string, SystemShortcut> = {
  'launcher': { modifier: 'modShift', key: 'l' },
  'close-window': { modifier: 'mod', key: 'w' },
  'cycle-windows': { modifier: 'modAlt', key: 'Tab' },
  'minimize-window': { modifier: 'mod', key: 'm' },
  'maximize-window': { modifier: 'modShift', key: 'm' },
  'maximize-f11': { key: 'F11' },
  'close-alt-f4': { modifier: 'modAlt', key: 'f4' },
  'screenshot': { key: 'PrintScreen' },
}

const App = memo(function App() {
  const registerApp = useStore((s) => s.registerApp)
  const openApp = useStore((s) => s.openApp)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const closeWindow = useStore((s) => s.closeWindow)
  const focusWindow = useStore((s) => s.focusWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const theme = useStore((s) => s.theme)
  const windows = useStore((s) => s.windows)
  const launcherOpen = useStore((s) => s.launcherOpen)

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

  const cycleWindows = useCallback(() => {
    if (windows.length <= 1) return
    const sortedWindows = [...windows].sort((a, b) => b.zIndex - a.zIndex)
    const currentIndex = sortedWindows.findIndex((w) => w.focused)
    const nextIndex = (currentIndex + 1) % sortedWindows.length
    focusWindow(sortedWindows[nextIndex].id)
  }, [windows, focusWindow])

  const handleSystemShortcut = useCallback((shortcut: string) => {
    const focusedWindow = getFocusedWindow()
    switch (shortcut) {
      case 'launcher':
        toggleLauncher()
        break
      case 'close-window':
        if (focusedWindow) closeWindow(focusedWindow.id)
        break
      case 'cycle-windows':
        cycleWindows()
        break
      case 'minimize-window':
        if (focusedWindow) minimizeWindow(focusedWindow.id)
        break
      case 'maximize-window':
      case 'maximize-f11':
        if (focusedWindow) maximizeWindow(focusedWindow.id)
        break
      case 'close-alt-f4':
        if (focusedWindow) closeWindow(focusedWindow.id)
        break
      case 'screenshot':
        openApp('screenshot')
        break
    }
  }, [getFocusedWindow, toggleLauncher, closeWindow, cycleWindows, minimizeWindow, maximizeWindow, openApp])

  const handleAppShortcut = useCallback((shortcutKey: string) => {
    const appMap: Record<string, string> = {
      'terminal': 'terminal',
      'terminal-shift': 'terminal',
      'files': 'files',
      'files-shift': 'files',
      'browser': 'browser',
      'settings': 'settings',
      'settings-shift': 'settings',
      'calculator': 'calculator',
      'text-editor': 'text-editor',
      'paint': 'paint',
      'image-viewer': 'image-viewer',
      'help': 'help',
      'notes-shift': 'notes',
      'app-1': 'terminal',
      'app-2': 'files',
      'app-3': 'browser',
    }
    const appId = appMap[shortcutKey]
    if (appId) openApp(appId)
  }, [openApp])

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

      for (const [shortcut, config] of Object.entries(systemShortcuts)) {
        const configMod = config.modifier?.includes('mod')
        const configShift = config.modifier?.includes('Shift') || config.modifier === 'modShift'
        const configAlt = config.modifier?.includes('Alt') || config.modifier === 'modAlt'
        
        if (configMod !== undefined) {
          if (isMod !== configMod) continue
          if (configShift !== isShift) continue
          if (configAlt !== isAlt) continue
        } else if (isMod || isShift || isAlt) {
          continue
        }
        
        if (Array.isArray(config.key) ? config.key.includes(key) : config.key.toLowerCase() === key) {
          e.preventDefault()
          handleSystemShortcut(shortcut)
          return
        }
      }

      if (isMod) {
        for (const [shortcutKey, config] of Object.entries(appShortcuts)) {
          const needShift = config.modifier === 'modShift' || config.modifier === 'modAltShift'
          if (needShift !== isShift) continue
          if (config.modifier === 'modAlt' && !isAlt) continue
          
          if (Array.isArray(config.key) ? config.key.includes(key) : config.key.toLowerCase() === key) {
            e.preventDefault()
            handleAppShortcut(shortcutKey)
            return
          }
        }
      }
    },
    [launcherOpen, toggleLauncher, handleSystemShortcut, handleAppShortcut]
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
    </ErrorBoundary>
  )
})

export default App
