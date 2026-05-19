import { useState, useMemo } from 'react'
import { useStore } from '../../store'

interface CategoryDef {
  id: string
  name: string
  icon: string
}

const categories: CategoryDef[] = [
  { id: 'favorites', name: '收藏夹', icon: '⭐' },
  { id: 'system', name: '系统', icon: '⚙️' },
  { id: 'office', name: '办公', icon: '📋' },
  { id: 'internet', name: '互联网', icon: '🌐' },
  { id: 'multimedia', name: '多媒体', icon: '🎵' },
  { id: 'utilities', name: '工具', icon: '🔧' },
  { id: 'development', name: '开发', icon: '⚡' },
  { id: 'games', name: '游戏', icon: '🎮' },
]

const favoriteAppIds = ['terminal', 'files', 'browser', 'code-editor', 'settings', 'calculator', 'notepad']

export default function StartMenu() {
  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)
  const closeLauncher = useStore((s) => s.closeLauncher)
  const launcherOpen = useStore((s) => s.launcherOpen)

  const [activeCategory, setActiveCategory] = useState('favorites')
  const [search, setSearch] = useState('')

  const filteredApps = useMemo(() => {
    let list = search
      ? apps
      : activeCategory === 'favorites'
        ? apps.filter((a) => favoriteAppIds.includes(a.id))
        : apps.filter((a) => a.category === activeCategory)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q),
      )
    }
    return list
  }, [apps, activeCategory, search])

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
        </div>
        <div className="launcher-content">
          <input
            className="launcher-search"
            type="text"
            placeholder="搜索应用..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="launcher-app-list">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="launcher-app-item"
                onClick={() => handleAppClick(app.id)}
              >
                <span className="launcher-app-item-icon">{app.icon}</span>
                <span className="launcher-app-item-name">{app.name}</span>
              </div>
            ))}
            {filteredApps.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: 20,
                  fontSize: 13,
                }}
              >
                未找到应用
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}