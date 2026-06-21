import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'
import { findNodeById } from '../store/fileUtils'

interface SearchResult {
  type: 'file' | 'app' | 'command'
  id: string
  name: string
  path?: string
  icon?: React.ReactNode
  description?: string
  score: number
  action?: () => void
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

const GlobalSearch = memo(function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const files = useStore((s) => s.files)
  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)
  const setTheme = useStore((s) => s.setTheme)
  const theme = useStore((s) => s.theme)
  const addNotification = useStore((s) => s.addNotification)

  const results = useMemo(() => {
    if (!query.trim()) return []

    const searchResults: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    apps.forEach((app) => {
      if (app.name.toLowerCase().includes(lowerQuery)) {
        const score = app.name.toLowerCase().startsWith(lowerQuery) ? 20 : 10
        searchResults.push({
          type: 'app',
          id: app.id,
          name: app.name,
          icon: app.icon,
          description: '打开应用程序',
          score,
          action: () => openApp(app.id),
        })
      }
    })

    const searchFiles = (nodes: FileNode[], path: string = '') => {
      nodes.forEach((node) => {
        if (node.name.toLowerCase().includes(lowerQuery)) {
          const nodePath = path === '' ? node.name : path + '/' + node.name
          const score = node.name.toLowerCase().startsWith(lowerQuery) ? 15 : 5
          searchResults.push({
            type: 'file',
            id: node.id,
            name: node.name,
            path: nodePath,
            score,
          })
        }
        if (node.children) {
          searchFiles(node.children, path === '' ? node.name : path + '/' + node.name)
        }
      })
    }
    searchFiles(files)

    if (lowerQuery === 'theme' || lowerQuery.includes('主题')) {
      searchResults.push({
        type: 'command',
        id: 'toggle-theme',
        name: theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题',
        description: '切换系统主题',
        icon: <span>🎨</span>,
        score: 25,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      })
    }

    if (lowerQuery.includes('clear') || lowerQuery.includes('清除')) {
      searchResults.push({
        type: 'command',
        id: 'clear-notifications',
        name: '清除所有通知',
        description: '清除通知中心的所有通知',
        icon: <span>🗑️</span>,
        score: 18,
        action: () => addNotification({ title: '通知已清除', message: '所有通知已被清除', type: 'success' }),
      })
    }

    // 安全的简易表达式计算器：仅允许数字、空格、+ - * / ( ) . 百分号
    if (/^[\d+\-*/().%\s×÷]+$/.test(query) && /[+\-*/%]/.test(query)) {
      try {
        const safeExpression = query
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/\s+/g, '')
        const result = Function('"use strict"; return (' + safeExpression + ')')()
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          searchResults.push({
            type: 'command',
            id: 'calculation',
            name: `${query} = ${result}`,
            description: '计算结果',
            icon: <span>🧮</span>,
            score: 30,
            action: () =>
              addNotification({
                title: '计算结果',
                message: `${query} = ${result}`,
                type: 'info',
              }),
          })
        }
      } catch {
        // 忽略计算错误
      }
    }

    return searchResults.sort((a, b) => b.score - a.score).slice(0, 15)
  }, [query, apps, files, openApp, setTheme, theme, addNotification])

  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.action) {
      result.action()
    } else if (result.type === 'app') {
      openApp(result.id)
    } else if (result.type === 'file') {
      const node = findNodeById(files, result.id)
      if (node) {
        addNotification({ title: '文件', message: `打开文件: ${node.name}`, type: 'info' })
      }
    }
    onClose()
  }, [openApp, files, addNotification, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleResultClick(results[selectedIndex])
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selectedIndex, handleResultClick, onClose],
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const groupedResults = useMemo(() => {
    const groups: { type: string; label: string; items: SearchResult[] }[] = [
      { type: 'command', label: '命令', items: [] },
      { type: 'app', label: '应用', items: [] },
      { type: 'file', label: '文件', items: [] },
    ]
    
    results.forEach((result) => {
      const group = groups.find((g) => g.type === result.type)
      if (group) {
        group.items.push(result)
      }
    })
    
    return groups.filter((g) => g.items.length > 0)
  }, [results])

  return (
    <div
      style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '650px',
        maxWidth: '90vw',
        background: 'var(--panel-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 24px 72px rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        overflow: 'hidden',
        animation: 'slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onKeyDown={handleKeyDown}
      onClick={onClose}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '24px' }}>🔍</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索应用、文件、命令... 输入计算式可直接计算"
            autoFocus
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ marginRight: '16px' }}>↑↓ 导航</span>
          <span style={{ marginRight: '16px' }}>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>

      <div
        style={{
          maxHeight: '450px',
          overflowY: 'auto',
          padding: '8px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {results.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '14px' }}>{query ? '未找到匹配结果' : '开始输入以搜索应用、文件或命令'}</div>
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>尝试输入应用名称、文件名或计算式</div>
          </div>
        ) : (
          groupedResults.map((group) => (
            <div key={group.type}>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {group.label} ({group.items.length})
              </div>
              {group.items.map((result) => {
                const globalIndex = results.indexOf(result)
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '4px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedIndex === globalIndex ? 'var(--accent)' : 'transparent',
                      color: selectedIndex === globalIndex ? '#fff' : 'var(--text-primary)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: selectedIndex === globalIndex ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: selectedIndex === globalIndex ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                        fontSize: '18px',
                      }}
                    >
                      {result.type === 'app' ? result.icon : result.type === 'file' ? '📄' : result.icon || '⚙️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {result.name}
                      </div>
                      {result.path && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: selectedIndex === globalIndex ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {result.path}
                        </div>
                      )}
                      {result.description && !result.path && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: selectedIndex === globalIndex ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                            marginTop: '2px',
                          }}
                        >
                          {result.description}
                        </div>
                      )}
                    </div>
                    {selectedIndex === globalIndex && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.6)',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                        }}
                      >
                        Enter
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}
      >
        <div>
          找到 {results.length} 个结果
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span className="flex items-center gap-1">
            <span style={{ fontSize: '10px', padding: '2px 4px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>Ctrl+K</span> 打开搜索
          </span>
          <span className="flex items-center gap-1">
            <span style={{ fontSize: '10px', padding: '2px 4px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>Ctrl+P</span> 命令面板
          </span>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
})

export default GlobalSearch
