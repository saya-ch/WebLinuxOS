import { useState, useEffect } from 'react'
import { Copy, Trash2, Plus, Search, Clock, Star, Tag } from 'lucide-react'

interface ClipboardItem {
  id: string
  content: string
  preview: string
  timestamp: number
  starred: boolean
  tags: string[]
}

export default function ClipboardManager() {
  const [items, setItems] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-clipboard')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-clipboard', JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save clipboard items:', error)
    }
  }, [items])

  useEffect(() => {
    const handlePaste = async () => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText()
          if (text && text.trim()) {
            const newItem: ClipboardItem = {
              id: Date.now().toString(),
              content: text,
              preview: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
              timestamp: Date.now(),
              starred: false,
              tags: []
            }
            setItems(prev => [newItem, ...prev.filter(i => i.content !== text)])
          }
        } catch (error) {
          console.error('Failed to read clipboard:', error)
        }
      }
    }

    const interval = setInterval(handlePaste, 2000)
    return () => clearInterval(interval)
  }, [])

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase()
    return (
      item.content.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return b.timestamp - a.timestamp
  })

  const copyToClipboard = async (content: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(content)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const toggleStar = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, starred: !item.starred } : item
    ))
  }

  const addManualItem = () => {
    if (!newContent.trim()) return
    
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: newContent,
      preview: newContent.slice(0, 100) + (newContent.length > 100 ? '...' : ''),
      timestamp: Date.now(),
      starred: false,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    }
    
    setItems(prev => [newItem, ...prev])
    setNewContent('')
    setNewTags('')
    setShowAddModal(false)
  }

  const clearAll = () => {
    if (confirm('确定要清空所有剪贴板记录吗？')) {
      setItems([])
    }
  }

  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <div className="app-container app-clipboard-manager" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--border-color, #333)',
        background: 'var(--bg-secondary, #252525)'
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#4c6ef5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center',
            }}
          >
            <Plus size={16} /> 添加
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="搜索剪贴板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid var(--border-color, #444)',
              borderRadius: '6px',
              background: 'var(--bg-input, #1e1e1e)',
              color: 'var(--text-color, #e0e0e0)',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {sortedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary, #888)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>
              {searchQuery ? '没有找到匹配的记录' : '剪贴板为空'}
            </div>
          </div>
        ) : (
          sortedItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
              style={{
                padding: '14px',
                marginBottom: '8px',
                borderRadius: '10px',
                background: selectedId === item.id ? 'var(--accent-bg, rgba(76, 110, 245, 0.1))' : 'var(--bg-secondary, #252525)',
                border: selectedId === item.id ? '1px solid var(--accent, #4c6ef5)' : '1px solid var(--border-color, #333)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-color, #e0e0e0)', lineHeight: 1.5 }}>
                  {item.preview}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  >
                    {item.starred ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item.content); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary, #888)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {formatTime(item.timestamp)}
                </span>
                {item.tags.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} />
                    {item.tags.join(', ')}
                  </span>
                )}
              </div>
              {selectedId === item.id && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'var(--bg-input, #1e1e1e)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--text-color, #e0e0e0)',
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {item.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div 
          className="app-modal-overlay"
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary, #2a2a2a)',
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-color, #e0e0e0)' }}>添加剪贴板记录</h3>
            <textarea
              placeholder="输入内容..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{
                padding: '12px',
                border: '1px solid var(--border-color, #444)',
                borderRadius: '8px',
                background: 'var(--bg-input, #1e1e1e)',
                color: 'var(--text-color, #e0e0e0)',
                fontSize: '14px',
                lineHeight: 1.6,
                resize: 'vertical',
                minHeight: '150px',
                fontFamily: 'inherit',
              }}
            />
            <input
              type="text"
              placeholder="标签（用逗号分隔）"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color, #444)',
                borderRadius: '6px',
                background: 'var(--bg-input, #1e1e1e)',
                color: 'var(--text-color, #e0e0e0)',
                fontSize: '13px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-color, #444)',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--text-color, #e0e0e0)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                取消
              </button>
              <button
                onClick={addManualItem}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#4c6ef5',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        padding: '12px', 
        borderTop: '1px solid var(--border-color, #333)',
        fontSize: '12px',
        color: 'var(--text-secondary, #888)',
        textAlign: 'center'
      }}>
        {items.length} 条记录 {items.filter(i => i.starred).length > 0 && `(${items.filter(i => i.starred).length} 收藏)`}
      </div>
    </div>
  )
}
