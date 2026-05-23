import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'

interface SearchResult {
  id: string
  type: 'app' | 'file' | 'command' | 'setting'
  title: string
  subtitle?: string
  icon: string
  priority: number
  action: () => void
}

const SmartSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { openApp, files } = useStore(s => ({
    openApp: s.openApp,
    files: s.files
  }))

  const searchApps = useCallback((q: string): SearchResult[] => {
    if (!q) return []
    const lowerQ = q.toLowerCase()
    return appRegistry
      .filter(app => 
        app.name.toLowerCase().includes(lowerQ) || 
        app.id.toLowerCase().includes(lowerQ) ||
        app.category.toLowerCase().includes(lowerQ)
      )
      .map(app => ({
        id: `app-${app.id}`,
        type: 'app' as const,
        title: app.name,
        subtitle: app.category,
        icon: '📱',
        priority: 100,
        action: () => openApp(app.id)
      }))
  }, [openApp])

  const searchFiles = useCallback((q: string): SearchResult[] => {
    if (!q) return []
    const lowerQ = q.toLowerCase()
    const results: SearchResult[] = []
    
    const traverse = (nodes: typeof files, path: string = '') => {
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(lowerQ)) {
          results.push({
            id: `file-${node.id}`,
            type: 'file' as const,
            title: node.name,
            subtitle: path || '/',
            icon: node.type === 'folder' ? '📁' : '📄',
            priority: 80,
            action: () => openApp('files')
          })
        }
        if (node.children) {
          traverse(node.children, `${path}/${node.name}`)
        }
      }
    }
    
    traverse(files)
    return results.slice(0, 10)
  }, [files, openApp])

  const searchCommands = useCallback((q: string): SearchResult[] => {
    if (!q) return []
    const lowerQ = q.toLowerCase()
    const commands = [
      { name: '打开终端', cmd: 'terminal', icon: '💻' },
      { name: '打开文件管理器', cmd: 'files', icon: '📁' },
      { name: '打开设置', cmd: 'settings', icon: '⚙️' },
      { name: '打开计算器', cmd: 'calculator', icon: '🧮' },
      { name: '打开浏览器', cmd: 'browser', icon: '🌐' },
      { name: '打开代码编辑器', cmd: 'code-editor', icon: '💻' },
      { name: '打开AI助手', cmd: 'ai-helper', icon: '🤖' },
      { name: '打开音乐播放器', cmd: 'music-player', icon: '🎵' },
      { name: '打开图片查看器', cmd: 'image-viewer', icon: '🖼️' },
      { name: '打开日历', cmd: 'calendar', icon: '📅' },
      { name: '打开系统监视器', cmd: 'system-monitor', icon: '📊' },
      { name: '打开剪贴板管理器', cmd: 'clipboard-manager', icon: '📋' },
    ]
    
    return commands
      .filter(c => c.name.toLowerCase().includes(lowerQ) || c.cmd.includes(lowerQ))
      .map(c => ({
        id: `cmd-${c.cmd}`,
        type: 'command' as const,
        title: c.name,
        subtitle: '快捷命令',
        icon: c.icon,
        priority: 90,
        action: () => openApp(c.cmd)
      }))
  }, [openApp])

  const searchSettings = useCallback((q: string): SearchResult[] => {
    if (!q) return []
    const lowerQ = q.toLowerCase()
    const settings = [
      { name: '切换主题', icon: '🎨', action: () => useStore.getState().setTheme(useStore.getState().theme === 'dark' ? 'light' : 'dark') },
      { name: '清空剪贴板', icon: '📋', action: () => localStorage.removeItem('clipboard-history') },
      { name: '查看系统信息', icon: 'ℹ️', action: () => openApp('about') },
    ]
    
    return settings
      .filter(s => s.name.toLowerCase().includes(lowerQ))
      .map(s => ({
        id: `setting-${s.name}`,
        type: 'setting' as const,
        title: s.name,
        subtitle: '系统设置',
        icon: s.icon,
        priority: 70,
        action: s.action
      }))
  }, [openApp])

  const performSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    const appResults = searchApps(trimmed)
    const cmdResults = searchCommands(trimmed)
    const fileResults = searchFiles(trimmed)
    const settingResults = searchSettings(trimmed)

    const allResults = [...appResults, ...cmdResults, ...fileResults, ...settingResults]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20)

    setResults(allResults)
    setSelectedIndex(0)
  }, [searchApps, searchCommands, searchFiles, searchSettings])

  useEffect(() => {
    performSearch(query)
  }, [query, performSearch])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      results[selectedIndex].action()
    } else if (e.key === 'Escape') {
      setQuery('')
      setResults([])
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'app': return 'var(--accent)'
      case 'file': return '#22c55e'
      case 'command': return '#eab308'
      case 'setting': return '#a855f7'
      default: return 'var(--text-secondary)'
    }
  }

  return (
    <div 
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🔍</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>智慧搜索</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>搜索应用、文件、命令和设置</div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="输入关键词搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {results.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 16px',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>开始输入以搜索</div>
            <div style={{ fontSize: '12px' }}>支持搜索应用、文件、命令和设置</div>
          </div>
        ) : (
          results.map((result, index) => (
            <div
              key={result.id}
              onClick={result.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: index === selectedIndex ? 'var(--accent)' : 'transparent',
                color: index === selectedIndex ? '#fff' : 'var(--text-primary)',
                transition: 'background 0.15s',
                marginBottom: '4px',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{ fontSize: '24px' }}>{result.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{result.title}</div>
                {result.subtitle && (
                  <div style={{ fontSize: '12px', color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                    {result.subtitle}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: index === selectedIndex ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                color: index === selectedIndex ? '#fff' : getTypeColor(result.type),
              }}>
                {result.type === 'app' ? '应用' : 
                 result.type === 'file' ? '文件' : 
                 result.type === 'command' ? '命令' : '设置'}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'var(--text-secondary)',
      }}>
        <div>
          <span style={{ padding: '2px 6px', background: 'var(--border)', borderRadius: '3px', marginRight: '4px' }}>↑↓</span>
          选择
        </div>
        <div>
          <span style={{ padding: '2px 6px', background: 'var(--border)', borderRadius: '3px', marginRight: '4px' }}>Enter</span>
          打开
        </div>
        <div>
          <span style={{ padding: '2px 6px', background: 'var(--border)', borderRadius: '3px', marginRight: '4px' }}>Esc</span>
          清空
        </div>
      </div>
    </div>
  )
}

export default SmartSearch
