import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LayoutDashboard, Terminal, FileText, Settings, Search,
  Zap, Clock, FolderGit2, Code2, Globe, Cpu,
  Play, Star, Plus, X,
  Palette, Music, Camera
} from 'lucide-react'

interface Widget {
  id: string
  name: string
  icon: React.ReactNode
  appId: string
  category: string
  color: string
}

interface WorkspaceLayout {
  id: string
  name: string
  widgets: string[]
}

const allWidgets: Widget[] = [
  { id: 'terminal', name: '终端', icon: <Terminal size={18} />, appId: 'terminal', category: '开发', color: '#3b82f6' },
  { id: 'code-editor', name: '代码编辑器', icon: <Code2 size={18} />, appId: 'code-editor', category: '开发', color: '#8b5cf6' },
  { id: 'files', name: '文件管理器', icon: <FolderGit2 size={18} />, appId: 'files', category: '系统', color: '#10b981' },
  { id: 'browser', name: '浏览器', icon: <Globe size={18} />, appId: 'browser', category: '网络', color: '#06b6d4' },
  { id: 'calculator', name: '计算器', icon: <Cpu size={18} />, appId: 'calculator', category: '工具', color: '#f59e0b' },
  { id: 'text-editor', name: '文本编辑器', icon: <FileText size={18} />, appId: 'text-editor', category: '办公', color: '#ef4444' },
  { id: 'system-monitor', name: '系统监控', icon: <LayoutDashboard size={18} />, appId: 'system-monitor', category: '系统', color: '#6366f1' },
  { id: 'settings', name: '设置', icon: <Settings size={18} />, appId: 'settings', category: '系统', color: '#64748b' },
  { id: 'weather', name: '天气', icon: <Globe size={18} />, appId: 'weather', category: '网络', color: '#0ea5e9' },
  { id: 'notes', name: '笔记', icon: <FileText size={18} />, appId: 'notes', category: '办公', color: '#84cc16' },
  { id: 'paint', name: '画图', icon: <Palette size={18} />, appId: 'paint', category: '图形', color: '#ec4899' },
  { id: 'music-player', name: '音乐播放器', icon: <Music size={18} />, appId: 'music-player', category: '多媒体', color: '#f43f5e' },
  { id: 'camera', name: '摄像头', icon: <Camera size={18} />, appId: 'camera', category: '多媒体', color: '#a855f7' },
  { id: 'code-runner', name: '代码运行器', icon: <Play size={18} />, appId: 'code-runner', category: '开发', color: '#22c55e' },
  { id: 'git-assistant', name: 'Git助手', icon: <FolderGit2 size={18} />, appId: 'git-assistant', category: '开发', color: '#f97316' },
  { id: 'api-lab', name: 'API实验室', icon: <Zap size={18} />, appId: 'api-lab', category: '开发', color: '#eab308' },
]

const defaultLayouts: WorkspaceLayout[] = [
  { id: 'dev', name: '开发工作台', widgets: ['terminal', 'code-editor', 'files', 'browser', 'api-lab', 'git-assistant'] },
  { id: 'design', name: '设计工作台', widgets: ['paint', 'camera', 'file-manager', 'notes', 'color-tools'] },
  { id: 'study', name: '学习工作台', widgets: ['code-editor', 'notes', 'browser', 'calculator'] },
  { id: 'work', name: '办公工作台', widgets: ['text-editor', 'notes', 'calendar', 'file-manager'] },
]

export default function SmartWorkspace() {
  const [layouts, setLayouts] = useState<WorkspaceLayout[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-workspace-layouts')
      if (saved) return JSON.parse(saved)
    } catch {}
    return defaultLayouts
  })
  
  const [activeLayoutId, setActiveLayoutId] = useState(() => {
    try {
      const saved = localStorage.getItem('weblinux-workspace-active')
      if (saved) return saved
    } catch {}
    return 'dev'
  })
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-workspace-favorites')
      if (saved) return JSON.parse(saved)
    } catch {}
    return ['terminal', 'code-editor', 'files']
  })
  
  const [clockTime, setClockTime] = useState(new Date())
  const [quickSearch, setQuickSearch] = useState('')
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)
  const [pickerCategory, setPickerCategory] = useState<string>('全部')

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-workspace-layouts', JSON.stringify(layouts))
    } catch {}
  }, [layouts])

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-workspace-active', activeLayoutId)
    } catch {}
  }, [activeLayoutId])

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-workspace-favorites', JSON.stringify(favorites))
    } catch {}
  }, [favorites])

  const activeLayout = useMemo(
    () => layouts.find((l) => l.id === activeLayoutId) || layouts[0],
    [layouts, activeLayoutId]
  )

  const openApp = useCallback((appId: string) => {
    const event = new CustomEvent('weblinux-launch-app', { detail: { appId } })
    window.dispatchEvent(event)
  }, [])

  const getTimeString = () => {
    const h = clockTime.getHours().toString().padStart(2, '0')
    const m = clockTime.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const getDateString = () => {
    return clockTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }, [])

  const getWidgetById = (id: string) => allWidgets.find((w) => w.id === id)

  const addWidgetToLayout = useCallback((widgetId: string) => {
    setLayouts((prev) =>
      prev.map((layout) => {
        if (layout.id === activeLayoutId && !layout.widgets.includes(widgetId)) {
          return { ...layout, widgets: [...layout.widgets, widgetId] }
        }
        return layout
      })
    )
    setShowWidgetPicker(false)
  }, [activeLayoutId])

  const removeWidgetFromLayout = useCallback((widgetId: string) => {
    setLayouts((prev) =>
      prev.map((layout) => {
        if (layout.id === activeLayoutId) {
          return { ...layout, widgets: layout.widgets.filter((w) => w !== widgetId) }
        }
        return layout
      })
    )
  }, [activeLayoutId])

  const createNewLayout = () => {
    const newId = `custom-${Date.now()}`
    const newLayout: WorkspaceLayout = {
      id: newId,
      name: `自定义工作台 ${layouts.length + 1}`,
      widgets: []
    }
    setLayouts([...layouts, newLayout])
    setActiveLayoutId(newId)
  }

  const allCategories = ['全部', ...Array.from(new Set(allWidgets.map((w) => w.category)))]
  
  const filteredWidgets = useMemo(() => {
    let result = allWidgets
    if (pickerCategory !== '全部') {
      result = result.filter((w) => w.category === pickerCategory)
    }
    if (quickSearch) {
      result = result.filter(
        (w) => w.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
               w.category.toLowerCase().includes(quickSearch.toLowerCase())
      )
    }
    return result
  }, [pickerCategory, quickSearch])

  const favoriteWidgets = useMemo(
    () => favorites.map((id) => getWidgetById(id)).filter(Boolean) as Widget[],
    [favorites]
  )

  if (!activeLayout) return null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e0e0e8', fontFamily: "'Noto Sans SC', system-ui, sans-serif"
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px', background: 'rgba(124, 58, 237, 0.2)',
            borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.3)'
          }}>
            <LayoutDashboard size={18} style={{ color: '#a78bfa' }} />
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#c4b5fd' }}>SmartWorkspace</span>
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setActiveLayoutId(layout.id)}
                style={{
                  padding: '6px 14px',
                  background: layout.id === activeLayoutId ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  border: layout.id === activeLayoutId ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: layout.id === activeLayoutId ? '#60a5fa' : '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: layout.id === activeLayoutId ? 500 : 400
                }}
              >
                {layout.name}
              </button>
            ))}
            <button
              onClick={createNewLayout}
              style={{
                padding: '6px 10px', background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '6px',
                color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Plus size={14} /> 新建
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <Clock size={14} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{getTimeString()}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{getDateString()}</span>
          </div>
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="搜索应用..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#e2e8f0', fontSize: '13px', width: '120px'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧收藏栏 */}
        <div style={{
          width: '200px', padding: '16px 12px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.1)', overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#64748b', marginBottom: '12px', paddingLeft: '4px'
          }}>
            <Star size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            收藏
          </div>
          
          {favoriteWidgets.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#475569', padding: '8px 4px' }}>
              点击应用卡片上的星标添加收藏
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {favoriteWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => openApp(widget.appId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', background: 'transparent',
                    border: '1px solid transparent', borderRadius: '6px',
                    color: '#cbd5e1', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <span style={{ color: widget.color }}>{widget.icon}</span>
                  <span>{widget.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 主内容区 */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
                {activeLayout.name}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                {activeLayout.widgets.length} 个应用已添加
              </p>
            </div>
            <button
              onClick={() => setShowWidgetPicker(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                border: 'none', borderRadius: '8px',
                color: 'white', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
              }}
            >
              <Plus size={16} /> 添加应用
            </button>
          </div>

          {activeLayout.widgets.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 20px',
              border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px',
              color: '#64748b'
            }}>
              <Zap size={48} style={{ marginBottom: '16px', color: '#475569' }} />
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>此工作台还没有应用</p>
              <p style={{ fontSize: '13px', marginBottom: '20px' }}>点击"添加应用"按钮开始自定义</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              {activeLayout.widgets.map((widgetId) => {
                const widget = getWidgetById(widgetId)
                if (!widget) return null
                const isFav = favorites.includes(widgetId)
                
                return (
                  <div
                    key={widgetId}
                    style={{
                      position: 'relative',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden'
                    }}
                    onClick={() => openApp(widget.appId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(widgetId)
                      }}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: isFav ? '#fbbf24' : '#475569',
                        padding: '4px', borderRadius: '4px'
                      }}
                    >
                      <Star size={14} fill={isFav ? '#fbbf24' : 'none'} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeWidgetFromLayout(widgetId)
                      }}
                      style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#475569', padding: '4px', borderRadius: '4px',
                        opacity: 0, transition: 'opacity 0.2s'
                      }}
                      className="widget-remove-btn"
                    >
                      <X size={14} />
                    </button>
                    
                    <div style={{
                      width: '48px', height: '48px',
                      background: `linear-gradient(135deg, ${widget.color}33, ${widget.color}11)`,
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '12px',
                      color: widget.color
                    }}>
                      {widget.icon}
                    </div>
                    
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0', marginBottom: '4px' }}>
                      {widget.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {widget.category}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 添加应用弹出框 */}
      {showWidgetPicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(8px)'
        }} onClick={() => setShowWidgetPicker(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '600px', maxHeight: '500px',
              background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f1f5f9' }}>添加应用到 {activeLayout.name}</h3>
              <button
                onClick={() => setShowWidgetPicker(false)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#64748b', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '16px 20px' }}>
              <input
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="搜索应用..."
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#e2e8f0', fontSize: '14px',
                  outline: 'none', marginBottom: '12px',
                  boxSizing: 'border-box'
                }}
              />
              
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPickerCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      background: pickerCategory === cat ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                      border: pickerCategory === cat ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: pickerCategory === cat ? '#60a5fa' : '#94a3b8',
                      fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div style={{
                maxHeight: '280px', overflowY: 'auto',
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px'
              }}>
                {filteredWidgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => addWidgetToLayout(widget.id)}
                    disabled={activeLayout.widgets.includes(widget.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px',
                      background: activeLayout.widgets.includes(widget.id) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: activeLayout.widgets.includes(widget.id) ? '#475569' : '#e2e8f0',
                      fontSize: '13px', cursor: activeLayout.widgets.includes(widget.id) ? 'not-allowed' : 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ color: activeLayout.widgets.includes(widget.id) ? '#475569' : widget.color }}>
                      {widget.icon}
                    </span>
                    <span style={{ flex: 1 }}>{widget.name}</span>
                    {activeLayout.widgets.includes(widget.id) && (
                      <span style={{ fontSize: '11px', color: '#475569' }}>已添加</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .widget-remove-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        div[style*=":hover"]:hover .widget-remove-btn {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
