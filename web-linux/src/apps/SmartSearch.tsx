import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useStore } from '../store'
import { SearchIcon, CalculatorIcon, TerminalIcon, FileIcon, FolderIcon, AppIcon } from '../icons'

interface SearchResult {
  id: string
  type: 'app' | 'file' | 'command' | 'web' | 'calculation'
  title: string
  description?: string
  icon?: React.ReactNode
  action: () => void
  relevance: number
}

const QuickActions = memo(function QuickActions() {
  const openApp = useStore((s) => s.openApp)
  const files = useStore((s) => s.files)

  const [input, setInput] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const apps = useStore((s) => s.apps)

  const performCalculation = useCallback((expr: string): string | null => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%^\s]/g, '')
      if (!sanitized.trim()) return null

      const result = Function('"use strict"; return (' + sanitized + ')')()
      if (typeof result === 'number' && isFinite(result)) {
        return Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, '')
      }
      return null
    } catch {
      return null
    }
  }, [])

  const searchFiles = useCallback((query: string): SearchResult[] => {
    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    const searchNode = (node: any) => {
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: node.id,
          type: node.type === 'folder' ? 'file' : 'file',
          title: node.name,
          description: node.type === 'folder' ? '文件夹' : '文件',
          icon: node.type === 'folder' ? <FolderIcon /> : <FileIcon />,
          action: () => {
            if (node.type === 'folder') {
              openApp('files')
            }
          },
          relevance: node.name.toLowerCase() === lowerQuery ? 2 : 1
        })
      }
      if (node.children) {
        node.children.forEach(searchNode)
      }
    }

    files.forEach(searchNode)
    return results.slice(0, 5)
  }, [files, openApp])

  const searchApps = useCallback((query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase()
    return apps
      .filter(app => app.name.toLowerCase().includes(lowerQuery) || app.id.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map(app => ({
        id: app.id,
        type: 'app' as const,
        title: app.name,
        description: '应用程序',
        icon: <AppIcon />,
        action: () => openApp(app.id),
        relevance: app.name.toLowerCase().startsWith(lowerQuery) ? 2 : 1
      }))
  }, [apps, openApp])

  const searchCommands = useCallback((query: string): SearchResult[] => {
    const commands = [
      { name: 'ls', desc: '列出目录内容' },
      { name: 'cd', desc: '切换目录' },
      { name: 'pwd', desc: '显示当前目录' },
      { name: 'mkdir', desc: '创建目录' },
      { name: 'touch', desc: '创建文件' },
      { name: 'cat', desc: '查看文件内容' },
      { name: 'rm', desc: '删除文件' },
      { name: 'cp', desc: '复制文件' },
      { name: 'mv', desc: '移动文件' },
      { name: 'clear', desc: '清屏' },
      { name: 'help', desc: '显示帮助' },
      { name: 'weather', desc: '查看天气' },
      { name: 'calc', desc: '计算器' },
      { name: 'neofetch', desc: '系统信息' },
      { name: 'date', desc: '显示日期时间' }
    ]

    const lowerQuery = query.toLowerCase()
    return commands
      .filter(cmd => cmd.name.includes(lowerQuery))
      .slice(0, 5)
      .map(cmd => ({
        id: cmd.name,
        type: 'command' as const,
        title: cmd.name,
        description: cmd.desc,
        icon: <TerminalIcon />,
        action: () => openApp('terminal'),
        relevance: cmd.name.startsWith(lowerQuery) ? 2 : 1
      }))
  }, [openApp])

  const webSearch = useCallback((query: string): SearchResult => ({
    id: 'web-search',
    type: 'web' as const,
    title: `搜索 "${query}"`,
    description: '在网络上搜索',
    icon: <SearchIcon />,
    action: () => {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
    },
    relevance: 1
  }), [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!input.trim()) {
      const quickApps = apps.slice(0, 8).map(app => ({
        id: app.id,
        type: 'app' as const,
        title: app.name,
        description: '应用程序',
        icon: <AppIcon />,
        action: () => openApp(app.id),
        relevance: 1
      }))
      setResults(quickApps)
      return
    }

    const calculation = performCalculation(input)
    const fileResults = searchFiles(input)
    const appResults = searchApps(input)
    const commandResults = searchCommands(input)

    let allResults: SearchResult[] = [
      ...appResults,
      ...fileResults,
      ...commandResults,
      ...fileResults
    ]

    if (calculation) {
      allResults.unshift({
        id: 'calc-result',
        type: 'calculation',
        title: `= ${calculation}`,
        description: `计算结果: ${input} = ${calculation}`,
        icon: <CalculatorIcon />,
        action: () => {},
        relevance: 3
      })
    }

    if (input.includes(' ') && !calculation) {
      allResults.push(webSearch(input))
    }

    allResults.sort((a, b) => b.relevance - a.relevance)
    setResults(allResults.slice(0, 10))
    setSelectedIndex(0)
  }, [input, apps, openApp, performCalculation, searchApps, searchCommands, searchFiles, webSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        results[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInput('')
    }
  }, [results, selectedIndex])

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selected = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'calculation':
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            =
          </div>
        )
      case 'web':
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <SearchIcon />
          </div>
        )
      default:
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6'
          }}>
            {result.icon}
          </div>
        )
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      app: '应用',
      file: '文件',
      command: '命令',
      web: '搜索',
      calculation: '计算'
    }
    return labels[type] || type
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '640px',
      background: 'rgba(18, 18, 28, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)',
      overflow: 'hidden',
      zIndex: 99999,
      animation: 'slideDown 0.2s ease-out'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <SearchIcon style={{ color: '#8b5cf6', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索应用、文件、命令，或输入数学表达式..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e8e8f4',
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          />
          {input && (
            <button
              onClick={() => setInput('')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#a0a0c8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ESC
            </button>
          )}
        </div>
      </div>

      <div
        ref={resultsRef}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px'
        }}
      >
        {results.length === 0 && input && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#a0a0c8'
          }}>
            <SearchIcon style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px' }}>未找到结果</div>
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={result.id}
            onClick={() => result.action()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedIndex === index ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: selectedIndex === index ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              transition: 'all 0.15s ease',
              marginBottom: '4px'
            }}
          >
            {getResultIcon(result)}
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#e8e8f4',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '2px'
              }}>
                {result.title}
              </div>
              {result.description && (
                <div style={{
                  color: '#a0a0c8',
                  fontSize: '12px'
                }}>
                  {result.description}
                </div>
              )}
            </div>
            <div style={{
              padding: '4px 8px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#8b5cf6',
              fontWeight: 500
            }}>
              {getTypeLabel(result.type)}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: '#a0a0c8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <kbd style={{
            padding: '2px 6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            fontSize: '11px'
          }}>↑↓</kbd>
          <span>选择</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <kbd style={{
            padding: '2px 6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            fontSize: '11px'
          }}>Enter</kbd>
          <span>打开</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <kbd style={{
            padding: '2px 6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            fontSize: '11px'
          }}>Esc</kbd>
          <span>关闭</span>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
})

export default QuickActions
