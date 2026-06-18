import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'

interface SystemStatus {
  cpuUsage: number
  memoryUsage: number
  storageUsage: number
  windowCount: number
  uptime: number
  networkStatus: 'online' | 'offline'
  lastActivity: Date
}

interface QuickAction {
  id: string
  name: string
  icon: string
  category: 'system' | 'tools' | 'ai' | 'media' | 'office'
  action: () => void
  description: string
}

interface SmartSuggestion {
  id: string
  message: string
  type: 'tip' | 'warning' | 'recommendation'
  priority: 'low' | 'medium' | 'high'
  action?: () => void
}

const SystemAssistant = memo(function SystemAssistant() {
  const theme = useStore((s) => s.theme)
  const openApp = useStore((s) => s.openApp)
  const windows = useStore((s) => s.windows)
  const files = useStore((s) => s.files)
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 0,
    windowCount: 0,
    uptime: 0,
    networkStatus: 'online',
    lastActivity: new Date()
  })
  
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'suggestions' | 'favorites'>('overview')
  const [favoriteApps, setFavoriteApps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-favorite-apps')
      return saved ? JSON.parse(saved) : ['terminal', 'files', 'code-editor', 'weather', 'notes']
    } catch {
      return ['terminal', 'files', 'code-editor', 'weather', 'notes']
    }
  })
  
  const [recentActions, setRecentActions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-recent-actions')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  
  // 更新系统状态
  useEffect(() => {
    const updateStatus = () => {
      const now = Date.now()
      const memoryUsage = Math.round((performance as any).memory?.usedJSHeapSize / (performance as any).memory?.totalJSHeapSize * 100) || Math.random() * 30 + 20
      
      setSystemStatus({
        cpuUsage: Math.round(Math.random() * 20 + 10),
        memoryUsage: Math.min(100, Math.round(memoryUsage)),
        storageUsage: Math.round(Math.random() * 40 + 30),
        windowCount: windows.length,
        uptime: Math.floor((now - (window as any).__weblinuxStartTime || now) / 1000),
        networkStatus: navigator.onLine ? 'online' : 'offline',
        lastActivity: new Date()
      })
    }
    
    updateStatus()
    const interval = setInterval(updateStatus, 5000)
    return () => clearInterval(interval)
  }, [windows.length])
  
  // 快捷操作
  const quickActions: QuickAction[] = useMemo(() => [
    { id: 'terminal', name: '打开终端', icon: '💻', category: 'system', action: () => openApp('terminal'), description: '执行命令和脚本' },
    { id: 'files', name: '文件管理', icon: '📁', category: 'system', action: () => openApp('files'), description: '浏览和管理文件' },
    { id: 'code-editor', name: '代码编辑', icon: '📝', category: 'tools', action: () => openApp('code-editor'), description: '编写和编辑代码' },
    { id: 'code-runner', name: '运行代码', icon: '▶️', category: 'tools', action: () => openApp('code-runner'), description: '在线执行代码' },
    { id: 'weather', name: '查看天气', icon: '🌤️', category: 'tools', action: () => openApp('weather'), description: '获取实时天气信息' },
    { id: 'notes', name: '快速笔记', icon: '📝', category: 'office', action: () => openApp('notes'), description: '记录想法和笔记' },
    { id: 'calculator', name: '计算器', icon: '🔢', category: 'tools', action: () => openApp('calculator'), description: '进行数学计算' },
    { id: 'pomodoro', name: '番茄钟', icon: '⏰', category: 'office', action: () => openApp('pomodoro'), description: '专注工作计时' },
    { id: 'ai-assistant', name: 'AI助手', icon: '🤖', category: 'ai', action: () => openApp('ai-helper'), description: '智能对话助手' },
    { id: 'music-player', name: '音乐播放', icon: '🎵', category: 'media', action: () => openApp('music-player'), description: '播放音乐' },
    { id: 'calendar', name: '日历', icon: '📅', category: 'office', action: () => openApp('calendar'), description: '查看日程安排' },
    { id: 'settings', name: '系统设置', icon: '⚙️', category: 'system', action: () => openApp('settings'), description: '配置系统选项' },
    { id: 'screenshot', name: '截图', icon: '📸', category: 'tools', action: () => openApp('screenshot'), description: '捕获屏幕内容' },
    { id: 'password-generator', name: '密码生成', icon: '🔐', category: 'tools', action: () => openApp('password-generator'), description: '生成安全密码' },
    { id: 'qr-generator', name: '二维码', icon: '📱', category: 'tools', action: () => openApp('qr-generator'), description: '生成二维码' },
    { id: 'online-api-hub', name: 'API工具', icon: '🌐', category: 'tools', action: () => openApp('online-api-hub'), description: '访问在线API' },
    { id: 'wikipedia-reader', name: '维基百科', icon: '📚', category: 'tools', action: () => openApp('wikipedia-reader'), description: '搜索百科知识' },
    { id: 'hacker-news-reader', name: 'HN阅读', icon: '📰', category: 'tools', action: () => openApp('hacker-news-reader'), description: '阅读技术新闻' },
    { id: 'space-explorer', name: '宇宙探索', icon: '🚀', category: 'tools', action: () => openApp('space-explorer'), description: 'NASA太空数据' },
    { id: 'system-monitor', name: '系统监控', icon: '📊', category: 'system', action: () => openApp('system-monitor'), description: '监控系统状态' },
  ], [openApp])
  
  // 智能建议生成
  const smartSuggestions: SmartSuggestion[] = useMemo(() => {
    const suggestions: SmartSuggestion[] = []
    
    // 基于窗口数量
    if (windows.length > 8) {
      suggestions.push({
        id: 'too-many-windows',
        message: '您打开了较多窗口，建议关闭不常用的窗口以释放内存',
        type: 'warning',
        priority: 'medium',
        action: () => openApp('task-manager')
      })
    }
    
    // 基于内存使用
    if (systemStatus.memoryUsage > 70) {
      suggestions.push({
        id: 'high-memory',
        message: '内存使用率较高，建议清理缓存或关闭部分应用',
        type: 'warning',
        priority: 'high',
        action: () => openApp('system-monitor')
      })
    }
    
    // 基于时间
    const hour = new Date().getHours()
    if (hour >= 9 && hour < 12) {
      suggestions.push({
        id: 'morning-tip',
        message: '上午适合处理复杂任务，建议使用番茄钟保持专注',
        type: 'tip',
        priority: 'low',
        action: () => openApp('pomodoro')
      })
    } else if (hour >= 14 && hour < 17) {
      suggestions.push({
        id: 'afternoon-tip',
        message: '下午适合创意工作，可以尝试使用白板进行头脑风暴',
        type: 'tip',
        priority: 'low',
        action: () => openApp('whiteboard')
      })
    } else if (hour >= 22 || hour < 6) {
      suggestions.push({
        id: 'night-tip',
        message: '夜间工作请注意休息，建议使用专注模式减少干扰',
        type: 'tip',
        priority: 'medium',
        action: () => openApp('focus-mode')
      })
    }
    
    // 基于文件数量
    if (files.length > 50) {
      suggestions.push({
        id: 'many-files',
        message: '文件数量较多，建议整理文件结构或删除不需要的文件',
        type: 'recommendation',
        priority: 'low',
        action: () => openApp('files')
      })
    }
    
    // 基于网络状态
    if (systemStatus.networkStatus === 'offline') {
      suggestions.push({
        id: 'offline-warning',
        message: '网络连接已断开，部分在线功能可能无法使用',
        type: 'warning',
        priority: 'high'
      })
    }
    
    // 推荐使用AI功能
    if (!windows.some(w => w.appId.includes('ai'))) {
      suggestions.push({
        id: 'ai-recommendation',
        message: '尝试使用AI助手获取智能建议和代码帮助',
        type: 'recommendation',
        priority: 'low',
        action: () => openApp('ai-helper')
      })
    }
    
    // 推荐查看天气
    if (!windows.some(w => w.appId === 'weather')) {
      suggestions.push({
        id: 'weather-recommendation',
        message: '查看当前天气，合理安排出行计划',
        type: 'recommendation',
        priority: 'low',
        action: () => openApp('weather')
      })
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [windows, files, systemStatus, openApp])
  
  // 执行快捷操作
  const executeAction = useCallback((action: QuickAction) => {
    action.action()
    setRecentActions(prev => {
      const newActions = [action.id, ...prev.filter(id => id !== action.id)].slice(0, 10)
      localStorage.setItem('weblinux-recent-actions', JSON.stringify(newActions))
      return newActions
    })
  }, [])
  
  // 添加/移除收藏
  const toggleFavorite = useCallback((appId: string) => {
    setFavoriteApps(prev => {
      const newFavorites = prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
      localStorage.setItem('weblinux-favorite-apps', JSON.stringify(newFavorites))
      return newFavorites
    })
  }, [])
  
  // 格式化时间
  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
  }
  
  // 状态颜色
  const getStatusColor = (value: number): string => {
    if (value < 50) return '#10b981'
    if (value < 75) return '#f59e0b'
    return '#ef4444'
  }
  
  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'dark' ? '#0d0d1a' : '#f5f5f5',
      color: theme === 'dark' ? '#e0e0e0' : '#333',
      overflow: 'hidden'
    },
    header: {
      padding: '16px 20px',
      borderBottom: `1px solid ${theme === 'dark' ? '#2a2a4a' : '#ddd'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      margin: 0
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      padding: '8px 16px',
      borderBottom: `1px solid ${theme === 'dark' ? '#2a2a4a' : '#ddd'}`,
      background: theme === 'dark' ? '#1a1a2e' : '#fff'
    },
    tab: (active: boolean) => ({
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      background: active ? '#6366f1' : 'transparent',
      color: active ? '#fff' : (theme === 'dark' ? '#ccc' : '#666'),
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s'
    }),
    content: {
      flex: 1,
      padding: '16px',
      overflow: 'auto'
    },
    statusGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '20px'
    },
    statusCard: {
      padding: '16px',
      borderRadius: '12px',
      background: theme === 'dark' ? '#1a1a2e' : '#fff',
      border: `1px solid ${theme === 'dark' ? '#2a2a4a' : '#ddd'}`,
      textAlign: 'center'
    },
    statusIcon: {
      fontSize: '24px',
      marginBottom: '8px'
    },
    statusValue: {
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '4px'
    },
    statusLabel: {
      fontSize: '12px',
      color: '#888'
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px'
    },
    actionButton: (isFavorite: boolean) => ({
      padding: '16px',
      borderRadius: '12px',
      background: isFavorite ? (theme === 'dark' ? '#2a2a4a' : '#e8e8ff') : (theme === 'dark' ? '#1a1a2e' : '#fff'),
      border: `1px solid ${theme === 'dark' ? '#2a2a4a' : '#ddd'}`,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s',
      position: 'relative'
    }),
    suggestionCard: (type: string) => ({
      padding: '16px',
      borderRadius: '12px',
      background: type === 'warning' ? (theme === 'dark' ? '#2a1a1a' : '#fff5f5') : (theme === 'dark' ? '#1a2a1a' : '#f5fff5'),
      border: `1px solid ${type === 'warning' ? '#ef4444' : '#10b981'}`,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }),
    categoryBadge: (category: string) => ({
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      background: category === 'system' ? '#3b82f6' : category === 'tools' ? '#8b5cf6' : category === 'ai' ? '#ec4899' : category === 'media' ? '#f59e0b' : '#10b981',
      color: '#fff',
      marginBottom: '8px'
    })
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 系统助手</h2>
        <div style={{ fontSize: '12px', color: '#888' }}>
          运行时间: {formatUptime(systemStatus.uptime)}
        </div>
      </div>
      
      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
          📊 概览
        </button>
        <button style={styles.tab(activeTab === 'actions')} onClick={() => setActiveTab('actions')}>
          ⚡ 快捷操作
        </button>
        <button style={styles.tab(activeTab === 'suggestions')} onClick={() => setActiveTab('suggestions')}>
          💡 智能建议
        </button>
        <button style={styles.tab(activeTab === 'favorites')} onClick={() => setActiveTab('favorites')}>
          ⭐ 收藏
        </button>
      </div>
      
      <div style={styles.content}>
        {activeTab === 'overview' && (
          <>
            <div style={styles.statusGrid}>
              <div style={styles.statusCard}>
                <div style={styles.statusIcon}>💻</div>
                <div style={{ ...styles.statusValue, color: getStatusColor(systemStatus.cpuUsage) }}>
                  {systemStatus.cpuUsage}%
                </div>
                <div style={styles.statusLabel}>CPU使用</div>
              </div>
              <div style={styles.statusCard}>
                <div style={styles.statusIcon}>🧠</div>
                <div style={{ ...styles.statusValue, color: getStatusColor(systemStatus.memoryUsage) }}>
                  {systemStatus.memoryUsage}%
                </div>
                <div style={styles.statusLabel}>内存使用</div>
              </div>
              <div style={styles.statusCard}>
                <div style={styles.statusIcon}>💾</div>
                <div style={{ ...styles.statusValue, color: getStatusColor(systemStatus.storageUsage) }}>
                  {systemStatus.storageUsage}%
                </div>
                <div style={styles.statusLabel}>存储使用</div>
              </div>
              <div style={styles.statusCard}>
                <div style={styles.statusIcon}>🪟</div>
                <div style={styles.statusValue}>{systemStatus.windowCount}</div>
                <div style={styles.statusLabel}>打开窗口</div>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                🕐 最近操作
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {recentActions.length === 0 ? (
                  <div style={{ color: '#888', fontSize: '13px' }}>暂无最近操作记录</div>
                ) : (
                  recentActions.map(actionId => {
                    const action = quickActions.find(a => a.id === actionId)
                    if (!action) return null
                    return (
                      <button
                        key={actionId}
                        onClick={() => executeAction(action)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: theme === 'dark' ? '#2a2a4a' : '#e8e8e8',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{action.icon}</span>
                        <span>{action.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                🌐 网络状态
              </h3>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: systemStatus.networkStatus === 'online' ? (theme === 'dark' ? '#1a2a1a' : '#f5fff5') : (theme === 'dark' ? '#2a1a1a' : '#fff5f5'),
                border: `1px solid ${systemStatus.networkStatus === 'online' ? '#10b981' : '#ef4444'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>
                  {systemStatus.networkStatus === 'online' ? '✅' : '❌'}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {systemStatus.networkStatus === 'online' ? '网络已连接' : '网络已断开'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {systemStatus.networkStatus === 'online' ? '所有在线功能可用' : '部分功能可能受限'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'actions' && (
          <>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#888' }}>
              点击快速启动应用，右键添加到收藏
            </div>
            <div style={styles.actionGrid}>
              {quickActions.map(action => (
                <div
                  key={action.id}
                  style={styles.actionButton(favoriteApps.includes(action.id))}
                  onClick={() => executeAction(action)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    toggleFavorite(action.id)
                  }}
                >
                  <div style={styles.categoryBadge(action.category)}>{action.category}</div>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{action.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{action.name}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{action.description}</div>
                  {favoriteApps.includes(action.id) && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      fontSize: '12px',
                      color: '#f59e0b'
                    }}>⭐</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        
        {activeTab === 'suggestions' && (
          <>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#888' }}>
              基于当前系统状态和使用习惯的智能建议
            </div>
            {smartSuggestions.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#888'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                <div>系统运行良好，暂无特别建议</div>
              </div>
            ) : (
              smartSuggestions.map(suggestion => (
                <div key={suggestion.id} style={styles.suggestionCard(suggestion.type)}>
                  <div style={{ fontSize: '24px' }}>
                    {suggestion.type === 'warning' ? '⚠️' : suggestion.type === 'tip' ? '💡' : '📝'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{suggestion.message}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {suggestion.type === 'warning' ? '警告' : suggestion.type === 'tip' ? '提示' : '建议'}
                    </div>
                  </div>
                  {suggestion.action && (
                    <button
                      onClick={suggestion.action}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: suggestion.type === 'warning' ? '#ef4444' : '#6366f1',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      处理
                    </button>
                  )}
                </div>
              ))
            )}
          </>
        )}
        
        {activeTab === 'favorites' && (
          <>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#888' }}>
              您收藏的常用应用（右键移除）
            </div>
            {favoriteApps.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#888'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                <div>暂无收藏应用</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>在快捷操作页面右键添加收藏</div>
              </div>
            ) : (
              <div style={styles.actionGrid}>
                {favoriteApps.map(appId => {
                  const action = quickActions.find(a => a.id === appId)
                  if (!action) return null
                  return (
                    <div
                      key={appId}
                      style={styles.actionButton(true)}
                      onClick={() => executeAction(action)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        toggleFavorite(appId)
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{action.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{action.name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{action.description}</div>
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '12px',
                        color: '#f59e0b'
                      }}>⭐</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export default SystemAssistant