import { Suspense, lazy, useEffect, memo, useMemo } from 'react'
import { useStore } from '../../store'
import Window from './Window'
import ErrorBoundary from '../ErrorBoundary'
import type { WindowState, AppDefinition } from '../../types'

interface WindowComponent {
  win: WindowState
  Component: React.LazyExoticComponent<React.ComponentType>
  app: AppDefinition
}

const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType>> = {}

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
  if (typeof window === 'undefined') return
  
  const criticalComponents = [
    'Terminal', 'FileManager', 'Calculator', 'Settings',
    'Notepad', 'Calendar', 'About'
  ]
  
  const loadNext = (index: number) => {
    if (index >= criticalComponents.length) return
    loadComponent(criticalComponents[index])
    if (index < criticalComponents.length - 1) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => loadNext(index + 1))
      } else {
        setTimeout(() => loadNext(index + 1), 150)
      }
    }
  }
  loadNext(0)
}

const LoadingFallback = memo(function LoadingFallback() {
  return (
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
        gap: 16,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid var(--window-border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span>加载中...</span>
    </div>
  )
})

const WindowManager = memo(function WindowManager() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const windowsPerDesktop = useStore((s) => s.windowsPerDesktop)

  useEffect(() => {
    preloadComponents()
  }, [])

  const memoizedWindows = useMemo(() => {
    const currentDesktopWindows = windowsPerDesktop[currentDesktop] || []
    return windows
      .filter((win) => currentDesktopWindows.includes(win.id))
      .map((win) => {
        const app = apps.find((a) => a.id === win.appId)
        if (!app) return null
        const Component = loadComponent(app.component)
        return { win, Component, app }
      }).filter(Boolean) as WindowComponent[]
  }, [windows, apps, currentDesktop, windowsPerDesktop])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.style.setProperty('overflow', 'hidden')
      } else {
        document.body.style.removeProperty('overflow')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <>
      {memoizedWindows.map(({ win, Component, app }) => (
        <Window key={win.id} window={win}>
          <ErrorBoundary appName={app.name}>
            <Suspense fallback={<LoadingFallback />}>
              <Component />
            </Suspense>
          </ErrorBoundary>
        </Window>
      ))}
    </>
  )
})

export default WindowManager