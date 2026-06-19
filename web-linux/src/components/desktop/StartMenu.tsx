import { useState, useMemo, memo } from 'react'
import { useStore } from '../../store'

interface CategoryDef {
  id: string
  name: string
  icon: string
}

const categories: CategoryDef[] = [
  { id: 'pinned', name: '已固定', icon: '📌' },
  { id: 'all', name: '全部应用', icon: '📋' },
  { id: 'system', name: '系统', icon: '⚙️' },
  { id: 'office', name: '办公', icon: '📄' },
  { id: 'internet', name: '互联网', icon: '🌐' },
  { id: 'multimedia', name: '多媒体', icon: '🎵' },
  { id: 'utilities', name: '工具', icon: '🔧' },
  { id: 'development', name: '开发', icon: '💻' },
  { id: 'games', name: '游戏', icon: '🎮' },
]

const StartMenu = memo(function StartMenu() {
  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)
  const closeLauncher = useStore((s) => s.closeLauncher)
  const launcherOpen = useStore((s) => s.launcherOpen)
  const pinnedApps = useStore((s) => s.pinnedApps)
  const togglePinnedApp = useStore((s) => s.togglePinnedApp)

  const [activeCategory, setActiveCategory] = useState('pinned')
  const [search, setSearch] = useState('')
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)

  const pinnedAppObjects = useMemo(
    () =>
      pinnedApps
        .map((appId) => apps.find((a) => a.id === appId))
        .filter((a): a is (typeof apps)[number] => Boolean(a)),
    [apps, pinnedApps],
  )

  const filteredApps = useMemo(() => {
    let list: (typeof apps)
    if (search) {
      list = apps
    } else if (activeCategory === 'pinned') {
      list = pinnedAppObjects
    } else if (activeCategory === 'all') {
      list = apps
    } else {
      list = apps.filter((a) => a.category === activeCategory)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (typeof a.component === 'string' && a.component.toLowerCase().includes(q)),
      )
    }
    return list
  }, [apps, activeCategory, search, pinnedAppObjects])

  const handleAppClick = (appId: string) => {
    openApp(appId)
    closeLauncher()
  }

  if (!launcherOpen) return null

  return (
    <>
      <div className="launcher-overlay" onClick={closeLauncher} />
      <div className="launcher" onClick={(e) => e.stopPropagation()}>
        <div className="launcher-sidebar">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`launcher-category ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id)
                setSearch('')
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <div
            style={{
              borderTop: '1px solid var(--window-border)',
              paddingTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div
              className="launcher-category"
              onClick={() => {
                openApp('system-info')
                closeLauncher()
              }}
            >
              <span>ℹ️</span>
              <span>系统信息</span>
            </div>
            <div
              className="launcher-category"
              onClick={() => {
                openApp('settings')
                closeLauncher()
              }}
            >
              <span>⚙️</span>
              <span>设置</span>
            </div>
            <div
              className="launcher-category"
              onClick={() => {
                openApp('about')
                closeLauncher()
              }}
            >
              <span>📖</span>
              <span>关于</span>
            </div>
          </div>
        </div>

        <div className="launcher-content">
          <div
            style={{
              position: 'relative',
              marginBottom: '12px',
            }}
          >
            <input
              className="launcher-search"
              type="text"
              placeholder="搜索应用..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ paddingLeft: '32px' }}
            />
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            {search && (
              <span
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                ✖
              </span>
            )}
          </div>

          {activeCategory === 'pinned' && !search && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>📌 快速启动（{pinnedAppObjects.length}）</span>
              {pinnedAppObjects.length === 0 && (
                <span style={{ fontSize: '10px' }}>点击应用旁的图标可固定</span>
              )}
            </div>
          )}

          <div className="launcher-app-list">
            {filteredApps.map((app) => {
              const isPinned = pinnedApps.includes(app.id)
              return (
                <div
                  key={app.id}
                  className="launcher-app-item"
                  onClick={() => handleAppClick(app.id)}
                  onMouseEnter={() => setHoveredApp(app.id)}
                  onMouseLeave={() => setHoveredApp(null)}
                  style={{
                    position: 'relative',
                    transform: hoveredApp === app.id ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <span
                    className="launcher-app-item-icon"
                    style={{
                      textShadow: hoveredApp === app.id ? '0 0 12px var(--accent)' : 'none',
                      transition: 'text-shadow 0.2s ease',
                    }}
                  >
                    {app.icon}
                  </span>
                  <span className="launcher-app-item-name">{app.name}</span>

                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePinnedApp(app.id)
                    }}
                    title={isPinned ? '取消固定' : '固定到任务栏'}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      fontSize: '10px',
                      opacity: hoveredApp === app.id ? 1 : 0.4,
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease',
                      padding: '2px 4px',
                      borderRadius: '4px',
                    }}
                  >
                    {isPinned ? '📌' : '📍'}
                  </span>
                </div>
              )
            })}

            {filteredApps.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: '40px 20px',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '32px' }}>🔍</span>
                <span>
                  {activeCategory === 'pinned' ? '暂无固定应用' : '未找到匹配的应用'}
                </span>
                {search && (
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    请尝试其他关键词
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--window-border)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span>共 {apps.length} 个应用</span>
            <span>
              <kbd style={{
                padding: '2px 6px',
                background: 'var(--window-bg)',
                border: '1px solid var(--window-border)',
                borderRadius: '4px',
                fontSize: '10px',
              }}>
                Enter
              </kbd>{' '}
              打开 ·{' '}
              <kbd style={{
                padding: '2px 6px',
                background: 'var(--window-bg)',
                border: '1px solid var(--window-border)',
                borderRadius: '4px',
                fontSize: '10px',
              }}>
                Esc
              </kbd>{' '}
              关闭
            </span>
          </div>
        </div>
      </div>
    </>
  )
})

export default StartMenu
