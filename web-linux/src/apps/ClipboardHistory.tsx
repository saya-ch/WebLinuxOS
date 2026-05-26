import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { Clipboard, Star, Clock, Trash2, Copy, Search } from 'lucide-react'

interface ClipboardItem {
  id: string
  content: string
  timestamp: number
  type: 'text' | 'code' | 'url'
  starred: boolean
  preview: string
}

export default memo(function ClipboardHistory() {
  const [items, setItems] = useState<ClipboardItem[]>(() => {
    const saved = localStorage.getItem('weblinux-clipboard-history')
    return saved ? JSON.parse(saved) : []
  })
  const [filter, setFilter] = useState<'all' | 'starred' | 'text' | 'code' | 'url'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const lastClipboardRef = useRef<string>('')

  useEffect(() => {
    localStorage.setItem('weblinux-clipboard-history', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    const checkClipboard = setInterval(() => {
      navigator.clipboard.readText().then(text => {
        if (text && text !== lastClipboardRef.current && text.trim()) {
          lastClipboardRef.current = text
          
          const type: 'text' | 'code' | 'url' = 
            /^https?:\/\//.test(text) ? 'url' :
            /[{}\[\]();]/.test(text) ? 'code' : 'text'
          
          const newItem: ClipboardItem = {
            id: Date.now().toString(),
            content: text,
            timestamp: Date.now(),
            type,
            starred: false,
            preview: text.length > 100 ? text.substring(0, 100) + '...' : text,
          }
          
          setItems(prev => {
            const filtered = prev.filter(item => item.content !== text)
            return [newItem, ...filtered].slice(0, 50)
          })
        }
      }).catch(() => {})
    }, 1000)
    
    return () => clearInterval(checkClipboard)
  }, [])

  const toggleStar = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, starred: !item.starred } : item
    ))
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    lastClipboardRef.current = content
  }, [])

  const clearAll = useCallback(() => {
    setItems(prev => prev.filter(item => item.starred))
  }, [])

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return `${days} 天前`
  }

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true
    if (filter === 'starred') return item.starred
    return item.type === filter
  }).filter(item => 
    searchQuery === '' || item.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const typeIcon = (type: string) => {
    switch (type) {
      case 'url': return '🔗'
      case 'code': return '💻'
      default: return '📝'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)' 
            }} 
          />
          <input
            type="text"
            placeholder="搜索剪贴板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'var(--input-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              color: 'var(--text-color)',
              fontSize: '14px',
            }}
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            color: 'var(--text-color)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="all">全部</option>
          <option value="starred">已收藏</option>
          <option value="text">文本</option>
          <option value="code">代码</option>
          <option value="url">链接</option>
        </select>

        <button
          onClick={clearAll}
          style={{
            padding: '8px 16px',
            background: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
          }}
        >
          <Trash2 size={14} />
          清除
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {filteredItems.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
          }}>
            <Clipboard size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>暂无剪贴板记录</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              复制内容后将自动记录
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  background: 'var(--button-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-color)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--window-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={() => copyToClipboard(item.content)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{typeIcon(item.type)}</span>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <Clock size={12} />
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(item.id)
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: item.starred ? '#fbbf24' : 'var(--text-secondary)',
                        transition: 'color 0.2s',
                      }}
                    >
                      <Star size={16} fill={item.starred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteItem(item.id)
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(item.content)
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-color)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '80px',
                  overflow: 'hidden',
                  fontFamily: item.type === 'code' ? 'monospace' : 'inherit',
                }}>
                  {item.preview}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
