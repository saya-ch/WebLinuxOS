import { Suspense, lazy } from 'react'
import { useStore } from '../../store'
import Window from './Window'

const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType<Record<string, never>>>> = {}

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
            {name} - 开发中
          </div>
        ),
      })),
    )
  }
  return componentCache[name]
}

export default function WindowManager() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)

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
}