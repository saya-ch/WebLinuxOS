import { useState, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'
import type { AppDefinition } from '../types'

type SearchResult = {
  type: 'app' | 'action' | 'history'
  id: string
  name: string
  icon?: string | React.ReactNode
  description?: string
  app?: AppDefinition
}

const systemActions: SearchResult[] = [
  { type: 'action', id: 'open-terminal', name: '打开终端', icon: '⌘', description: '快速打开终端应用' },
  { type: 'action', id: 'open-files', name: '打开文件管理器', icon: '📁', description: '打开文件管理器' },
  { type: 'action', id: 'take-screenshot', name: '截图', icon: '📸', description: '截图并保存' },
  { type: 'action', id: 'toggle-theme', name: '切换主题', icon: '🎨', description: '切换深色/浅色主题' },
  { type: 'action', id: 'lock-screen', name: '锁定屏幕', icon: '🔒', description: '锁定屏幕' },
]

export default function QuickLauncher() {
  const { openApp, setTheme, theme } = useStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('quick-launch-history')
    return saved ? JSON.parse(saved) : []
  })

  const searchResults = useMemo((): SearchResult[] => {
    const results: SearchResult[] = []
    const q = query.toLowerCase()

    if (!query) {
      if (showHistory) {
        return history.map((appId: string, idx: number): SearchResult => {
          const app = appRegistry.find((a: AppDefinition) => a.id === appId)
          return {
            type: 'history',
            id: `history-${idx}`,
            name: app?.name || appId,
            icon: app?.icon,
            description: '最近使用',
            app
          }
        })
      }
      return appRegistry.slice(0, 8).map((app: AppDefinition): SearchResult => ({
        type: 'app',
        id: app.id,
        name: app.name,
        icon: app.icon,
        description: app.category,
        app
      }))
    }

    // 搜索应用
    for (const app of appRegistry) {
      if (app.name.toLowerCase().includes(q) || 
          (app.category && app.category.toLowerCase().includes(q))) {
        results.push({
          type: 'app',
          id: app.id,
          name: app.name,
          icon: app.icon,
          description: app.category,
          app
        })
      }
    }

    // 搜索系统操作
    for (const action of systemActions) {
      if (action.name.toLowerCase().includes(q) ||
          action.description?.toLowerCase().includes(q)) {
        results.push(action)
      }
    }

    return results
  }, [query, showHistory, history])

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.type === 'app' && result.app) {
      openApp(result.app.id)
      // 添加到历史记录
      setHistory(prev => {
        const filtered = prev.filter(id => id !== result.app!.id)
        const newHistory = [result.app!.id, ...filtered].slice(0, 15)
        localStorage.setItem('quick-launch-history', JSON.stringify(newHistory))
        return newHistory
      })
    } else if (result.type === 'action') {
      switch (result.id) {
        case 'open-terminal':
          openApp('terminal')
          break
        case 'open-files':
          openApp('files')
          break
        case 'take-screenshot':
          openApp('screenshot')
          break
        case 'toggle-theme':
          setTheme(theme === 'dark' ? 'light' : 'dark')
          break
      }
    }
    setQuery('')
  }, [openApp, theme, setTheme])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % searchResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [searchResults, selectedIndex, handleSelect])

  return (
    <div className="app-container app-quick-launcher" style={{ 
      background: 'linear-gradient(135deg, rgba(30,30,40,0.98), rgba(20,20,30,0.98))',
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '28px' }}>🚀</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>快速启动器</h2>
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>搜索并快速启动应用</p>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="输入搜索，如 终端、计算器..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            padding: '14px 18px 14px 48px',
            fontSize: '16px',
            border: '2px solid rgba(100,100,255,0.3)',
            borderRadius: '12px',
            background: 'rgba(40,40,60,0.8)',
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
        <span style={{ 
          position: 'absolute', 
          left: '16px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          fontSize: '20px'
        }}>🔍</span>
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '4px'
        }}>
          <div style={{
            padding: '2px 8px',
            fontSize: '11px',
            background: 'rgba(100,100,150,0.4)',
            borderRadius: '4px',
            color: '#aaa'
          }}>⌘K</div>
          <div style={{
            padding: '2px 8px',
            fontSize: '11px',
            background: 'rgba(100,100,150,0.4)',
            borderRadius: '4px',
            color: '#aaa'
          }}>Enter</div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px',
        fontSize: '13px',
        color: '#888',
        marginBottom: '8px'
      }}>
        <button onClick={() => setShowHistory(!showHistory)} style={{
          background: showHistory ? 'rgba(100,100,200,0.2)' : 'transparent',
          border: '1px solid rgba(100,100,200,0.3)',
          color: showHistory ? '#aaf' : '#888',
          borderRadius: '20px',
          padding: '4px 12px',
          cursor: 'pointer'
        }}>
          📜 最近使用
        </button>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {searchResults.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#666' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤔</div>
            <p>没有找到匹配的结果</p>
          </div>
        ) : (
          searchResults.map((result: SearchResult, idx: number) => (
            <div
              key={result.id}
              onClick={() => handleSelect(result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: idx === selectedIndex ? 
                  'linear-gradient(90deg, rgba(100,100,255,0.25), rgba(100,150,255,0.15))' : 
                  'rgba(60,60,80,0.4)',
                border: idx === selectedIndex ? 
                  '1px solid rgba(120,120,255,0.5)' : '1px solid transparent',
                transition: 'all 0.15s'
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div style={{ 
                fontSize: '28px', 
                width: '40px', 
                textAlign: 'center'
              }}>
                {result.icon || '📄'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: '#fff' }}>{result.name}</div>
                {result.description && (
                  <div style={{ fontSize: '13px', color: '#888' }}>{result.description}</div>
                )}
              </div>
              {idx === selectedIndex && (
                <div style={{ fontSize: '12px', color: '#8af' }}>打开 →</div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderTop: '1px solid rgba(100,100,120,0.2)',
        fontSize: '13px',
        color: '#666'
      }}>
        <span>找到 {searchResults.length} 个结果</span>
        <span>↑↓ 导航 • Enter 打开</span>
      </div>
    </div>
  )
}
