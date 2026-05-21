import { useState, useMemo, memo } from 'react'
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

const StartMenu = memo(function StartMenu() {
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
      const pinyinMap: Record<string, string> = {
        '终端': 'zd', '文件管理器': 'wjgl', '文本编辑器': 'wbbj', '浏览器': 'llq',
        '计算器': 'jsq', '日历': 'rl', '时钟': 'sj', '天气': 'tq',
        '系统监视器': 'xtjcq', '设置': 'sz', '记事本': 'jsb',
        '图片查看器': 'tpckq', '音乐播放器': 'yybfq', '视频播放器': 'spbfq',
        '代码编辑器': 'dmbj', '待办事项': 'dbsx', '关于系统': 'gyxt',
        '帮助': 'bz', '画图': 'ht', '截图工具': 'jtgj',
      }
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (pinyinMap[a.name] && pinyinMap[a.name].includes(q)) ||
          (q.length >= 2 && pinyinMap[a.name] && pinyinMap[a.name].startsWith(q.slice(0, 2)))
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
})

export default StartMenu