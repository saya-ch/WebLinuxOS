import { useEffect } from 'react'
import { 
  WindowManager, 
  Taskbar, 
  initializeFileSystem,
  useStore,
  registerApp
} from '@weblinuxos/core'
import { registerApps, apps } from '@weblinuxos/apps'
import { ToastProvider } from '@weblinuxos/ui'

function App() {
  const initApp = useStore(state => state.initApp)

  useEffect(() => {
    // Initialize file system
    initializeFileSystem()
    
    // Register apps
    registerApps()
    
    // Initialize app
    initApp()
  }, [initApp])

  return (
    <ToastProvider>
      <div className="w-screen h-screen bg-[#1e1e1e] overflow-hidden flex flex-col">
        {/* Desktop Area */}
        <div className="flex-1 relative overflow-hidden">
          <WindowManager appRenderers={apps} />
        </div>
        
        {/* Taskbar */}
        <Taskbar />
      </div>
    </ToastProvider>
  )
}

export default App
