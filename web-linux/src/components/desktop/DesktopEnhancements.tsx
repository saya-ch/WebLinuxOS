import { useState, useEffect } from 'react'
import { 
  Zap, 
  Sparkles, 
  Clock, 
  Wifi, 
  Battery, 
  Settings,
  Palette,
  Activity,
  Terminal,
  Search,
  Grid,
  List
} from 'lucide-react'

/**
 * 桌面环境增强组件 v28.0
 * 提供快速访问工具栏、系统状态监控、智能布局等功能
 */

// 快速访问工具栏
export function QuickAccessToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const quickApps = [
    { id: 'terminal', name: '终端', icon: Terminal },
    { id: 'intelligent-code-assistant', name: '智能代码助手', icon: Sparkles },
    { id: 'settings', name: '设置', icon: Settings },
    { id: 'file-manager', name: '文件管理器', icon: Grid },
    { id: 'text-editor', name: '文本编辑器', icon: List },
  ]

  return (
    <div className="quick-access-toolbar" style={{
      position: 'fixed',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.3s ease'
    }}>
      {quickApps.map(app => (
        <button
          key={app.id}
          onClick={() => {
            // 在实际应用中触发打开应用
            console.log(`打开应用: ${app.id}`)
          }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'rgba(0,0,0,0.4)'
          }}
          title={app.name}
        >
          <app.icon size={24} />
        </button>
      ))}
      
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          background: 'rgba(233,69,96,0.8)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <Zap size={24} />
      </button>
    </div>
  )
}

// 系统状态监控面板
export function SystemStatusPanel() {
  const [systemInfo, setSystemInfo] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    networkSpeed: 0,
    batteryLevel: 100,
    isOnline: true,
    currentTime: new Date().toLocaleTimeString(),
  })

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setSystemInfo(prev => ({
        ...prev,
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        networkSpeed: Math.random() * 100,
        currentTime: new Date().toLocaleTimeString(),
        isOnline: navigator.onLine,
      }))
    }, 2000)

    return () => clearInterval(updateInterval)
  }, [])

  return (
    <div className="system-status-panel" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px',
      borderRadius: '12px',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      zIndex: 999,
      minWidth: '200px',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s',
    }}>
      {/* 时间显示 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Clock size={20} style={{ marginRight: '8px' }} />
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
          {systemInfo.currentTime}
        </span>
      </div>

      {/* 系统状态指标 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* CPU使用率 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} />
          <span style={{ fontSize: '12px' }}>CPU</span>
          <div style={{
            flex: 1,
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${systemInfo.cpuUsage}%`,
              background: systemInfo.cpuUsage > 80 ? '#e94560' : '#4ade80',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>
            {Math.round(systemInfo.cpuUsage)}%
          </span>
        </div>

        {/* 内存使用率 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} />
          <span style={{ fontSize: '12px' }}>内存</span>
          <div style={{
            flex: 1,
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${systemInfo.memoryUsage}%`,
              background: systemInfo.memoryUsage > 80 ? '#e94560' : '#a5f3fc',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>
            {Math.round(systemInfo.memoryUsage)}%
          </span>
        </div>

        {/* 网络状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wifi size={16} color={systemInfo.isOnline ? '#4ade80' : '#e94560'} />
          <span style={{ fontSize: '12px' }}>
            {systemInfo.isOnline ? '在线' : '离线'}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: 'auto' }}>
            {Math.round(systemInfo.networkSpeed)} Mbps
          </span>
        </div>

        {/* 电池状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Battery size={16} />
          <span style={{ fontSize: '12px' }}>电池</span>
          <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: 'auto' }}>
            {systemInfo.batteryLevel}%
          </span>
        </div>
      </div>
    </div>
  )
}

// 智能桌面布局选择器
export function LayoutSelector({ onLayoutChange }: { onLayoutChange: (layout: string) => void }) {
  const [selectedLayout, setSelectedLayout] = useState('grid')
  
  const layouts = [
    { id: 'grid', name: '网格视图', icon: Grid },
    { id: 'list', name: '列表视图', icon: List },
    { id: 'compact', name: '紧凑视图', icon: Palette },
  ]

  return (
    <div className="layout-selector" style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '12px',
      padding: '8px 16px',
      borderRadius: '20px',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(10px)',
      zIndex: 999,
    }}>
      {layouts.map(layout => (
        <button
          key={layout.id}
          onClick={() => {
            setSelectedLayout(layout.id)
            onLayoutChange(layout.id)
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: selectedLayout === layout.id ? 'rgba(233,69,96,0.8)' : 'transparent',
            color: selectedLayout === layout.id ? '#fff' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            fontSize: '12px',
          }}
          onMouseEnter={(e) => {
            if (selectedLayout !== layout.id) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedLayout !== layout.id) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <layout.icon size={14} />
          {layout.name}
        </button>
      ))}
    </div>
  )
}

// 全局搜索栏
export function GlobalSearchBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const searchResults = searchQuery.trim()
    ? [
        '终端',
        '智能代码助手',
        '文件管理器',
        '文本编辑器',
        '系统设置',
        '计算器',
        '音乐播放器',
      ].filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  if (!isSearchOpen) return null

  return (
    <div className="global-search-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px',
      zIndex: 10000,
    }}>
      <div className="global-search-container" style={{
        width: '600px',
        maxWidth: '90%',
        borderRadius: '16px',
        background: 'rgba(26,26,46,0.95)',
        border: '1px solid rgba(233,69,96,0.3)',
        padding: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: searchResults.length > 0 ? '16px' : '0',
        }}>
          <Search size={24} color="#e94560" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索应用、文件、命令..."
            autoFocus
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(233,69,96,0.3)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
            }}
          />
          <kbd style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: '12px',
          }}>
            ESC
          </kbd>
        </div>

        {searchResults.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log(`打开: ${result}`)
                  setIsSearchOpen(false)
                  setSearchQuery('')
                }}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(233,69,96,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
              >
                <Sparkles size={16} color="#e94560" />
                {result}
              </button>
            ))}
          </div>
        )}

        {searchQuery.trim() && searchResults.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            color: 'rgba(255,255,255,0.6)',
          }}>
            没有找到匹配的结果
          </div>
        )}
      </div>
    </div>
  )
}

// 桌面小部件容器
export function DesktopWidgets() {
  return (
    <>
      <SystemStatusPanel />
      <QuickAccessToolbar />
      <GlobalSearchBar />
    </>
  )
}

export default DesktopWidgets