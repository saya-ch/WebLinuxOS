import { Suspense, lazy, useEffect, memo } from 'react'
import { useStore } from '../../store'
import Window from './Window'
import ErrorBoundary from '../ErrorBoundary'

const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType<Record<string, never>>>> = {}

function loadComponent(name: string) {
  if (!componentCache[name]) {
    componentCache[name] = lazy(() =>
      import(`../../apps/${name}.tsx`).then(module => ({ default: module.default })).catch(() => ({
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
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>⚠️</span>
            <div>{name} - 应用加载失败</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              重新加载页面
            </button>
          </div>
        ),
      })),
    )
  }
  return componentCache[name]
}

function preloadComponents() {
  const commonComponents = [
    'Terminal', 'FileManager', 'TextEditor', 'Calculator', 'Settings',
    'SystemMonitor', 'WebBrowser', 'CodeEditor', 'Notepad', 'Calendar',
    'ImageViewer', 'MusicPlayer', 'Paint', 'Weather', 'Notes',
    'TodoList', 'Contacts', 'Email', 'Help', 'About',
    'Screenshot', 'ScreenRecorder', 'SoundRecorder', 'Camera'
  ]
  commonComponents.forEach(name => {
    loadComponent(name)
  })
}

const WindowManager = memo(function WindowManager() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)

  useEffect(() => {
    preloadComponents()
  }, [])

  return (
    <>
      {windows.map((win) => {
        const app = apps.find((a) => a.id === win.appId)
        if (!app) return null
        const Component = loadComponent(app.component)
        return (
          <Window key={win.id} window={win}>
            <ErrorBoundary>
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
            </ErrorBoundary>
          </Window>
        )
      })}
    </>
  )
})

export default WindowManager