import { Suspense, lazy, useEffect, memo } from 'react'
import { useStore } from '../../store'
import Window from './Window'

const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType<Record<string, never>>>> = {}

const commonComponents = [
  'Terminal', 'FileManager', 'TextEditor', 'Calculator', 'Settings',
  'SystemMonitor', 'WebBrowser', 'CodeEditor', 'Notepad'
]

function loadComponent(name: string) {
  if (!componentCache[name]) {
    componentCache[name] = lazy(() =>
      import(`../../apps/${name}.tsx`).catch(() => ({
        default: () => (
          <div
            style={{
              padding: 40,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {name} - 加载失败，请重试
          </div>
        ),
      })),
    )
  }
  return componentCache[name]
}

function preloadComponents() {
  commonComponents.forEach(name => {
    import(`../../apps/${name}.tsx`).catch(() => {})
  })
}

const WindowManager = memo(function WindowManager() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)

  useEffect(() => {
    const timer = setTimeout(preloadComponents, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {windows.map((win) => {
        const app = apps.find((a) => a.id === win.appId)
        if (!app) return null
        const Component = loadComponent(app.component)
        return (
          <Window key={win.id} window={win}>
            <Suspense
              fallback={
                <div
                  style={{
                    padding: 40,
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    fontSize: 14,
                  }}
                >
                  加载中...
                </div>
              }
            >
              <Component />
            </Suspense>
          </Window>
        )
      })}
    </>
  )
})

export default WindowManager