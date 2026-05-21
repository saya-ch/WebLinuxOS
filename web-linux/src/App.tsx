import { useEffect } from 'react'
import { useStore } from './store'
import { appRegistry } from './apps'
import Desktop from './components/desktop/Desktop'
import WindowManager from './components/desktop/WindowManager'
import Taskbar from './components/desktop/Taskbar'
import StartMenu from './components/desktop/StartMenu'

export default function App() {
  const registerApp = useStore((s) => s.registerApp)
  const openApp = useStore((s) => s.openApp)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const launcherOpen = useStore((s) => s.launcherOpen)
  const windows = useStore((s) => s.windows)
  const closeWindow = useStore((s) => s.closeWindow)
  const focusWindow = useStore((s) => s.focusWindow)

  useEffect(() => {
    appRegistry.forEach((app) => registerApp(app))
  }, [registerApp])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey
      const isAlt = e.altKey

      if (isMod && isShift && e.key === 'l') {
        e.preventDefault()
        toggleLauncher()
        return
      }

      if (launcherOpen) {
        if (e.key === 'Escape') {
          toggleLauncher()
          return
        }
        return
      }

      if (isMod && e.key === 'n') {
        e.preventDefault()
        openApp('terminal')
        return
      }

      if (isMod && e.key === 'e') {
        e.preventDefault()
        openApp('files')
        return
      }

      if (isMod && e.key === 'b') {
        e.preventDefault()
        openApp('browser')
        return
      }

      if (isMod && e.key === ',') {
        e.preventDefault()
        openApp('settings')
        return
      }

      if (isMod && e.key === 'w') {
        e.preventDefault()
        const lastFocusedWindow = windows.filter(w => w.focused)[0]
        if (lastFocusedWindow) {
          closeWindow(lastFocusedWindow.id)
        }
        return
      }

      if (isMod && isAlt && e.key === 'Tab') {
        e.preventDefault()
        const sortedWindows = [...windows].sort((a, b) => b.zIndex - a.zIndex)
        if (sortedWindows.length > 1) {
          const currentIndex = sortedWindows.findIndex(w => w.focused)
          const nextIndex = (currentIndex + 1) % sortedWindows.length
          focusWindow(sortedWindows[nextIndex].id)
        }
        return
      }

      if (isMod && e.key === '1') {
        e.preventDefault()
        openApp('terminal')
        return
      }

      if (isMod && e.key === '2') {
        e.preventDefault()
        openApp('files')
        return
      }

      if (isMod && e.key === '3') {
        e.preventDefault()
        openApp('browser')
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openApp, toggleLauncher, launcherOpen, windows, closeWindow, focusWindow])

  return (
    <>
      <Desktop />
      <WindowManager />
      <StartMenu />
      <Taskbar />
    </>
  )
}