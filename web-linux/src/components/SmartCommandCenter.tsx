import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'
import {
  Search, Terminal, Calculator, Globe, Clock, Zap, Command,
  Sparkles, FileText, ArrowRight, X
} from 'lucide-react'

interface SmartCommandCenterProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  type: 'app' | 'action' | 'calc' | 'web' | 'command'
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

const SmartCommandCenter = memo(function SmartCommandCenter({ isOpen, onClose }: SmartCommandCenterProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)

  const quickActions = useMemo(() => [
    { id: 'terminal', title: '打开终端', subtitle: 'Ctrl+T', icon: <Terminal size={18} />, action: () => openApp('terminal') },
    { id: 'files', title: '文件管理器', subtitle: 'Ctrl+E', icon: <FileText size={18} />, action: () => openApp('files') },
    { id: 'calculator', title: '计算器', subtitle: 'Ctrl+Shift+C', icon: <Calculator size={18} />, action: () => openApp('calculator') },
    { id: 'browser', title: '浏览器', subtitle: 'Ctrl+B', icon: <Globe size={18} />, action: () => openApp('browser') },
    { id: 'weather', title: '天气', subtitle: '查看天气信息', icon: <Sparkles size={18} />, action: () => openApp('weather') },
    { id: 'clock', title: '时钟', subtitle: '查看时间和闹钟', icon: <Clock size={18} />, action: () => openApp('clock') },
  ], [openApp])

  const calcExpression = useCallback((expr: string): string | null => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%\s^]/g, '')
      if (!sanitized.trim()) return null
      
      let expression = sanitized.replace(/\^/g, '**')
      
      const evaluateFn = new Function('"use strict"; return (' + expression + ')')
      const result = evaluateFn()
      
      if (typeof result !== 'number' || !isFinite(result)) return null
      
      if (Number.isInteger(result)) return result.toString()
      return result.toFixed(6).replace(/\.?0+$/, '')
    } catch {
      return null
    }
  }, [])

  const searchResults = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase()
    
    if (!q) {
      return quickActions.map(a => ({
        id: a.id,
        type: 'action' as const,
        title: a.title,
        subtitle: a.subtitle,
        icon: a.icon,
        action: a.action,
      }))
    }

    if (/^[0-9+\-*/().%\s^]+$/.test(q)) {
      const result = calcExpression(q)
      if (result !== null) {
        return [{
          id: 'calc-result',
          type: 'calc' as const,
          title: `= ${result}`,
          subtitle: '按 Enter 复制结果',
          icon: <Calculator size={18} />,
          action: () => {
            navigator.clipboard?.writeText(result)
            onClose()
          },
        }]
      }
    }

    const appResults: SearchResult[] = apps
      .filter(app => 
        app.name.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.category?.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(app => ({
        id: app.id,
        type: 'app' as const,
        title: app.name,
        subtitle: app.category || '应用',
        icon: app.icon || <Zap size={18} />,
        action: () => {
          openApp(app.id)
          onClose()
        },
      }))

    const commandResults: SearchResult[] = []
    
    if (q.startsWith('>')) {
      commandResults.push({
        id: 'cmd-terminal',
        type: 'command' as const,
        title: `在终端中运行: ${q.slice(1)}`,
        subtitle: '打开终端并执行命令',
        icon: <Terminal size={18} />,
        action: () => {
          openApp('terminal')
          onClose()
        },
      })
    }

    if (q.startsWith('?') || q.startsWith('/')) {
      commandResults.push({
        id: 'search-web',
        type: 'web' as const,
        title: `搜索: ${q.slice(1)}`,
        subtitle: '在浏览器中搜索',
        icon: <Globe size={18} />,
        action: () => {
          openApp('browser')
          onClose()
        },
      })
    }

    const webResults: SearchResult[] = []
    if (q.length > 2 && !q.startsWith('>') && !q.startsWith('?') && !q.startsWith('/')) {
      webResults.push({
        id: 'web-search',
        type: 'web' as const,
        title: `在网络中搜索 "${q}"`,
        subtitle: '使用默认搜索引擎',
        icon: <Globe size={18} />,
        action: () => {
          openApp('browser')
          onClose()
        },
      })
    }

    return [...appResults, ...commandResults, ...webResults]
  }, [query, apps, quickActions, calcExpression, openApp, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = searchResults[selectedIndex]
      if (result) {
        result.action()
      }
    }
  }, [searchResults, selectedIndex, onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (searchResults.length > 0 && resultsRef.current) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, searchResults.length])

  if (!isOpen) return null

  const getModeLabel = (): string => {
    if (query.startsWith('>')) return '命令'
    if (query.startsWith('?') || query.startsWith('/')) return '搜索'
    if (/^[0-9+\-*/().%\s^]+$/.test(query) && query.length > 1) return '计算'
    return '应用'
  }

  return (
    <div 
      className="smart-command-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '15vh',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        className="smart-command-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'rgba(18, 18, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(155, 138, 240, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(155, 138, 240, 0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Command size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索应用、计算、命令..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 500,
          }}>
            {getModeLabel()}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <X size={18} />
          </button>
        </div>

        <div 
          ref={resultsRef}
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {searchResults.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}>
              <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div>没有找到结果</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                尝试输入应用名称或数学表达式
              </div>
            </div>
          ) : (
            searchResults.map((result, index) => (
              <div
                key={result.id}
                data-index={index}
                onClick={result.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: index === selectedIndex 
                    ? 'rgba(155, 138, 240, 0.18)' 
                    : 'transparent',
                  marginBottom: '2px',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: result.type === 'calc' 
                    ? 'rgba(16, 185, 129, 0.15)'
                    : result.type === 'web'
                    ? 'rgba(64, 169, 255, 0.15)'
                    : result.type === 'command'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(155, 138, 240, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: result.type === 'calc'
                    ? '#10b981'
                    : result.type === 'web'
                    ? '#40a9ff'
                    : result.type === 'command'
                    ? '#f59e0b'
                    : '#9b8af0',
                  flexShrink: 0,
                }}>
                  {result.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '2px',
                  }}>
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {result.subtitle}
                    </div>
                  )}
                </div>
                {index === selectedIndex && (
                  <ArrowRight size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>↑↓</kbd> 导航</span>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>Enter</kbd> 执行</span>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>Esc</kbd> 关闭</span>
          </div>
          <span style={{ opacity: 0.7 }}>
            {searchResults.length} 个结果
          </span>
        </div>
      </div>
    </div>
  )
})

export default SmartCommandCenter
