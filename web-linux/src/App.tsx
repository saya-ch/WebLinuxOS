import { useEffect, memo, useCallback } from 'react'
import { useStore } from './store'
import { appRegistry } from './apps'
import Desktop from './components/desktop/Desktop'
import WindowManager from './components/desktop/WindowManager'
import Taskbar from './components/desktop/Taskbar'
import StartMenu from './components/desktop/StartMenu'

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

      if (isMod && isShift && key === 'l') {
        e.preventDefault()
        toggleLauncher()
        return
      }

      if (isMod && e.key === 'w') {
        e.preventDefault()
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) closeWindow(focusedWindow.id)
        return
      }

      if (isMod && isAlt && e.key === 'Tab') {
        e.preventDefault()
        cycleWindows()
        return
      }

      if (isMod && e.key === 'm') {
        e.preventDefault()
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) minimizeWindow(focusedWindow.id)
        return
      }

      if ((isMod && isShift && e.key === 'm') || e.key === 'F11') {
        e.preventDefault()
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) maximizeWindow(focusedWindow.id)
        return
      }

      if (isMod && isAlt && key === 'f4') {
        e.preventDefault()
        const focusedWindow = getFocusedWindow()
        if (focusedWindow) closeWindow(focusedWindow.id)
        return
      }

      if (isMod) {
        if (isShift) {
          switch (key) {
            case 's':
              e.preventDefault()
              openApp('settings')
              return
            case 'f':
              e.preventDefault()
              openApp('files')
              return
            case 't':
              e.preventDefault()
              openApp('terminal')
              return
            case 'n':
              e.preventDefault()
              openApp('notes')
              return
          }
        } else {
          switch (key) {
            case 'n':
              e.preventDefault()
              openApp('terminal')
              return
            case 'e':
              e.preventDefault()
              openApp('files')
              return
            case 'b':
              e.preventDefault()
              openApp('browser')
              return
            case ',':
              e.preventDefault()
              openApp('settings')
              return
            case '1':
              e.preventDefault()
              openApp('terminal')
              return
            case '2':
              e.preventDefault()
              openApp('files')
              return
            case '3':
              e.preventDefault()
              openApp('browser')
              return
            case 'a':
              e.preventDefault()
              openApp('calculator')
              return
            case 't':
              e.preventDefault()
              openApp('text-editor')
              return
            case 'p':
              e.preventDefault()
              openApp('paint')
              return
            case 'i':
              e.preventDefault()
              openApp('image-viewer')
              return
            case 'h':
              e.preventDefault()
              openApp('help')
              return
          }
        }
      }

      if (e.key === 'PrintScreen') {
        e.preventDefault()
        openApp('screenshot')
        return
      }
    },
    [launcherOpen, toggleLauncher, getFocusedWindow, closeWindow, cycleWindows, minimizeWindow, maximizeWindow, openApp]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <Desktop />
      <WindowManager />
      <StartMenu />
      <Taskbar />
    </>
  )
})

export default App
