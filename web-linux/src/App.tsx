import { useEffect } from 'react'
import { useStore } from './store'
import { appRegistry } from './apps'
import Desktop from './components/desktop/Desktop'
import WindowManager from './components/desktop/WindowManager'
import Taskbar from './components/desktop/Taskbar'
import StartMenu from './components/desktop/StartMenu'

export default function App() {
  const registerApp = useStore((s) => s.registerApp)

  useEffect(() => {
    appRegistry.forEach((app) => registerApp(app))
  }, [registerApp])

  return (
    <>
      <Desktop />
      <WindowManager />
      <StartMenu />
      <Taskbar />
    </>
  )
}