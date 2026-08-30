import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { useStore } from '../../store'
import { PinIcon, PinOffIcon, SearchIcon, ListTodoIcon, FileTextIcon, GlobeIcon, MusicIcon, WrenchIcon, CodeIcon, SettingsIcon, InfoIcon, BookIcon, GamepadIcon, StarIcon, StarOffIcon, ClockIcon, GridIcon } from '../../icons'

interface CategoryDef {
  id: string
  name: string
  icon: React.ReactNode
}

const categories: CategoryDef[] = [
  { id: 'pinned', name: '已固定', icon: <PinIcon size={16} /> },
  { id: 'favorites', name: '收藏', icon: <StarIcon size={16} /> },
  { id: 'all', name: '全部应用', icon: <ListTodoIcon size={16} /> },
  { id: 'system', name: '系统', icon: <SettingsIcon size={16} /> },
  { id: 'office', name: '办公', icon: <FileTextIcon size={16} /> },
  { id: 'internet', name: '互联网', icon: <GlobeIcon size={16} /> },
  { id: 'multimedia', name: '多媒体', icon: <MusicIcon size={16} /> },
  { id: 'utilities', name: '工具', icon: <WrenchIcon size={16} /> },
  { id: 'development', name: '开发', icon: <CodeIcon size={16} /> },
  { id: 'games', name: '游戏', icon: <GamepadIcon size={16} /> },
]

// 本地存储键
const SEARCH_HISTORY_KEY = 'weblinux-start-search-history'
const APP_USAGE_KEY = 'weblinux-app-usage-count'
const FAVORITE_APPS_KEY = 'weblinux-favorite-apps'
const MAX_SEARCH_HISTORY = 6

function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_SEARCH_HISTORY)
    }
  } catch { /* 忽略 */ }
  return []
}

function saveSearchHistory(history: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)))
  } catch { /* 忽略 */ }
}

function loadAppUsage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(APP_USAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch { /* 忽略 */ }
  return {}
}

function saveAppUsage(usage: Record<string, number>) {
  try {
    localStorage.setItem(APP_USAGE_KEY, JSON.stringify(usage))
  } catch { /* 忽略 */ }
}

function loadFavoriteApps(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_APPS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* 忽略 */ }
  return []
}

function saveFavoriteApps(favorites: string[]) {
  try {
    localStorage.setItem(FAVORITE_APPS_KEY, JSON.stringify(favorites))
  } catch { /* 忽略 */ }
}

type SortMode = 'default' | 'frequency'

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
  const [searchHistory, setSearchHistory] = useState<string[]>(loadSearchHistory)
  const [appUsage, setAppUsage] = useState<Record<string, number>>(loadAppUsage)
  const [favoriteApps, setFavoriteApps] = useState<string[]>(loadFavoriteApps)
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [useGridLayout, setUseGridLayout] = useState(false)
  const [selectedAppIndex, setSelectedAppIndex] = useState(0)

  const pinnedAppObjects = useMemo(
    () =>
      pinnedApps
        .map((appId) => apps.find((a) => a.id === appId))
        .filter((a): a is (typeof apps)[number] => Boolean(a)),
    [apps, pinnedApps],
  )

  const favoriteAppObjects = useMemo(
    () =>
      favoriteApps
        .map((appId) => apps.find((a) => a.id === appId))
        .filter((a): a is (typeof apps)[number] => Boolean(a)),
    [apps, favoriteApps],
  )

  const filteredApps = useMemo(() => {
    let list: typeof apps
    if (search) {
      list = apps
    } else if (activeCategory === 'pinned') {
      list = pinnedAppObjects
    } else if (activeCategory === 'favorites') {
      list = favoriteAppObjects
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

    // 频率排序
    if (sortMode === 'frequency' && !search) {
      list = [...list].sort((a, b) => {
        const aUsage = appUsage[a.id] || 0
        const bUsage = appUsage[b.id] || 0
        if (bUsage !== aUsage) return bUsage - aUsage
        return a.name.localeCompare(b.name)
      })
    }

    return list
  }, [apps, activeCategory, search, pinnedAppObjects, favoriteAppObjects, sortMode, appUsage])

  // 当搜索结果或分类变化时，重置选中索引
  useEffect(() => {
    setSelectedAppIndex(0)
  }, [search, activeCategory, filteredApps.length])

  const handleAppClick = useCallback((appId: string) => {
    openApp(appId)
    closeLauncher()
    // 记录使用频率
    setAppUsage(prev => {
      const next = { ...prev, [appId]: (prev[appId] || 0) + 1 }
      saveAppUsage(next)
      return next
    })
    // 记录搜索历史
    if (search.trim()) {
      setSearchHistory(prev => {
        const next = [search.trim(), ...prev.filter(h => h !== search.trim())].slice(0, MAX_SEARCH_HISTORY)
        saveSearchHistory(next)
        return next
      })
    }
  }, [openApp, closeLauncher, search])

  const toggleFavorite = useCallback((appId: string) => {
    setFavoriteApps(prev => {
      const next = prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
      saveFavoriteApps(next)
      return next
    })
  }, [])

  const handleSearchHistoryClick = useCallback((term: string) => {
    setSearch(term)
  }, [])

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
    saveSearchHistory([])
  }, [])

  // 搜索框键盘导航：Enter打开首个结果，↑↓切换选中项
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const total = filteredApps.length
      if (total === 0) {
        if (e.key === 'Escape') {
          e.preventDefault()
          closeLauncher()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedAppIndex((prev) => (prev + 1) % total)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedAppIndex((prev) => (prev - 1 + total) % total)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const targetApp = filteredApps[selectedAppIndex] || filteredApps[0]
        if (targetApp) {
          handleAppClick(targetApp.id)
        }
      }
    },
    [filteredApps, selectedAppIndex, handleAppClick, closeLauncher],
  )

  // 获取最大使用次数，用于使用频率进度条
  const maxUsage = useMemo(() => {
    const values = Object.values(appUsage)
    return values.length > 0 ? Math.max(...values) : 1
  }, [appUsage])

  // 调试：强制始终渲染，验证组件渲染和CSS是否正确
  // 注意：launcherOpen现在用来控制可见性样式而不是条件渲染
  const visibleStyle: React.CSSProperties = launcherOpen
    ? { display: 'flex', opacity: 1, pointerEvents: 'auto' }
    : { display: 'none', opacity: 0, pointerEvents: 'none' }
  const overlayStyle: React.CSSProperties = launcherOpen
    ? { display: 'block' }
    : { display: 'none' }

  return (
    <>
      <div className="launcher-overlay" onClick={closeLauncher} style={overlayStyle} />
      <div className="launcher" onClick={(e) => e.stopPropagation()} style={visibleStyle}>
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
              <span><InfoIcon size={16} /></span>
              <span>系统信息</span>
            </div>
            <div
              className="launcher-category"
              onClick={() => {
                openApp('settings')
                closeLauncher()
              }}
            >
              <span><SettingsIcon size={16} /></span>
              <span>设置</span>
            </div>
            <div
              className="launcher-category"
              onClick={() => {
                openApp('about')
                closeLauncher()
              }}
            >
              <span><BookIcon size={16} /></span>
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
              onKeyDown={handleSearchKeyDown}
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
              <SearchIcon size={14} />
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
                X
              </span>
            )}
          </div>

          {/* 搜索历史 */}
          {!search && searchHistory.length > 0 && (activeCategory === 'all' || activeCategory === 'pinned') && (
            <div className="start-menu-search-history">
              <ClockIcon size={11} style={{ color: 'var(--text-secondary)', marginRight: 2 }} />
              {searchHistory.map((term) => (
                <span
                  key={term}
                  className="start-menu-search-history-item"
                  onClick={() => handleSearchHistoryClick(term)}
                >
                  {term}
                </span>
              ))}
              <span
                className="start-menu-search-history-item"
                onClick={clearSearchHistory}
                style={{ color: 'var(--error)', borderColor: 'var(--error-bg)' }}
              >
                清除
              </span>
            </div>
          )}

          {/* 分类标题和排序/布局控制 */}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PinIcon size={12} /> 快速启动（{pinnedAppObjects.length}）
              </span>
              {pinnedAppObjects.length === 0 && (
                <span style={{ fontSize: '10px' }}>点击应用旁的图标可固定</span>
              )}
            </div>
          )}

          {activeCategory === 'favorites' && !search && (
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <StarIcon size={12} /> 收藏应用（{favoriteAppObjects.length}）
              </span>
              {favoriteAppObjects.length === 0 && (
                <span style={{ fontSize: '10px' }}>点击应用的星标可收藏</span>
              )}
            </div>
          )}

          {/* 排序和布局切换 */}
          {(activeCategory === 'all' || search) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                padding: '0 4px',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`start-menu-sort-toggle ${sortMode === 'frequency' ? 'active' : ''}`}
                  onClick={() => setSortMode(prev => prev === 'frequency' ? 'default' : 'frequency')}
                >
                  <ClockIcon size={10} />
                  {sortMode === 'frequency' ? '频率排序' : '默认排序'}
                </button>
              </div>
              <button
                className="start-menu-sort-toggle"
                onClick={() => setUseGridLayout(prev => !prev)}
                title={useGridLayout ? '列表视图' : '网格视图'}
              >
                <GridIcon size={10} />
                {useGridLayout ? '网格' : '列表'}
              </button>
            </div>
          )}

          <div className={useGridLayout && (activeCategory === 'all' || search) ? 'start-menu-grid-layout launcher-app-list' : 'launcher-app-list'}>
            {filteredApps.map((app) => {
              const isPinned = pinnedApps.includes(app.id)
              const isFavorite = favoriteApps.includes(app.id)
              const usageCount = appUsage[app.id] || 0
              const usagePercent = maxUsage > 0 ? (usageCount / maxUsage) * 100 : 0
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
                  {app.isNew && (
                    <span
                      style={{
                        marginLeft: 6,
                        padding: '1px 6px',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        color: '#fff',
                        background: 'linear-gradient(135deg,#7c3aed,#38bdf8)',
                        borderRadius: 4,
                        lineHeight: 1.4,
                      }}
                      title={app.description || '新应用'}
                    >
                      NEW
                    </span>
                  )}

                  {/* 固定按钮（右上角） */}
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
                    {isPinned ? <PinIcon size={12} /> : <PinOffIcon size={12} />}
                  </span>

                  {/* 收藏按钮（右下角） */}
                  <span
                    className={`start-menu-favorite-btn ${isFavorite ? 'is-favorite' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(app.id)
                    }}
                    title={isFavorite ? '取消收藏' : '收藏此应用'}
                  >
                    {isFavorite ? <StarIcon size={12} /> : <StarOffIcon size={12} />}
                  </span>

                  {/* 使用频率进度条 */}
                  {sortMode === 'frequency' && usageCount > 0 && (
                    <div
                      className="start-menu-usage-bar"
                      style={{ width: `${Math.max(usagePercent, 8)}%` }}
                      title={`使用 ${usageCount} 次`}
                    />
                  )}
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
                <SearchIcon size={32} />
                <span>
                  {activeCategory === 'pinned'
                    ? '暂无固定应用'
                    : activeCategory === 'favorites'
                    ? '暂无收藏应用'
                    : '未找到匹配的应用'}
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
