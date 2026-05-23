import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'

interface SearchResult {
  type: 'file' | 'app'
  id: string
  name: string
  path?: string
  icon?: React.ReactNode
  description?: string
  score: number
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

  const results = useMemo(() => {
    if (!query.trim()) return []

    const searchResults: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    apps.forEach((app) => {
      if (app.name.toLowerCase().includes(lowerQuery)) {
        const score = app.name.toLowerCase().startsWith(lowerQuery) ? 2 : 1
        searchResults.push({
          type: 'app',
          id: app.id,
          name: app.name,
          icon: app.icon,
          score,
        })
      }
    })

    const searchFiles = (nodes: any[], path: string = '') => {
      nodes.forEach((node) => {
        if (node.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'file',
            id: node.id,
            name: node.name,
            path: path + '/' + node.name,
            score: node.name.toLowerCase().startsWith(lowerQuery) ? 2 : 1,
          })
        }
        if (node.children) {
          searchFiles(node.children, path + '/' + node.name)
        }
      })
    }
    searchFiles(files)

    return searchResults.sort((a, b) => b.score - a.score).slice(0, 10)
  }, [query, apps, files])

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
        const result = results[selectedIndex]
        if (result.type === 'app') {
          openApp(result.id)
        }
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selectedIndex, openApp, onClose],
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

  return (
    <div
      style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxWidth: '90vw',
        background: 'var(--panel-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        overflow: 'hidden',
        animation: 'slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onKeyDown={handleKeyDown}
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
            placeholder="搜索应用程序、文件..."
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
          按 ↑↓ 选择，Enter 打开，Esc 关闭
        </div>
      </div>

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {results.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div>{query ? '未找到匹配结果' : '开始输入以搜索'}</div>
          </div>
        ) : (
          results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => {
                if (result.type === 'app') {
                  openApp(result.id)
                }
                onClose()
              }}
              style={{
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedIndex === index ? 'var(--accent)' : 'transparent',
                color: selectedIndex === index ? '#fff' : 'var(--text-primary)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: selectedIndex === index ? '2px solid var(--accent)' : '2px solid transparent',
                transform: selectedIndex === index ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div style={{ fontSize: '24px' }}>
                {result.type === 'app' ? result.icon : '📄'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{result.name}</div>
                {result.path && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: selectedIndex === index ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    {result.path}
                  </div>
                )}
                {result.type === 'app' && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: selectedIndex === index ? 'rgba(255,255,255,0.5)' : 'var(--text-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    应用程序
                  </div>
                )}
              </div>
              {selectedIndex === index && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Enter ↵
                </div>
              )}
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
        <div>
          <span style={{ marginRight: '16px' }}>↑↓ 导航</span>
          <span>Enter 选择</span>
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
