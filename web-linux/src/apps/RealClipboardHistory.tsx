import { useState, useEffect, useCallback } from 'react'
import { Clipboard, Copy, Trash2, Clock, Search, Filter, AlertCircle, Check, X } from 'lucide-react'

interface ClipboardEntry {
  id: string
  content: string
  type: 'text' | 'image' | 'url'
  timestamp: Date
  source?: string
  starred: boolean
}

export default function RealClipboardHistory() {
  const [entries, setEntries] = useState<ClipboardEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'text' | 'url'>('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt')

  // 加载历史数据
  useEffect(() => {
    const saved = localStorage.getItem('weblinux-clipboard-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setEntries(parsed.map((e: ClipboardEntry) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        })))
      } catch (error) {
        console.error('Failed to load clipboard history:', error)
      }
    }

    // 检查剪贴板权限
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'clipboard-read' as any })
        .then(status => {
          setPermissionStatus(status.state)
        })
        .catch(() => {
          setPermissionStatus('unsupported')
        })
    } else {
      setPermissionStatus('unsupported')
    }
  }, [])

  // 保存历史数据
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('weblinux-clipboard-history', JSON.stringify(entries))
    }
  }, [entries])

  // 请求剪贴板权限
  const requestPermission = async () => {
    try {
      const permission = await (navigator as any).permissions.query({ name: 'clipboard-read' })
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const result = await (navigator as any).clipboard.readText()
        setPermissionStatus('granted')
        return true
      }
      return false
    } catch (error) {
      console.error('Clipboard permission error:', error)
      return false
    }
  }

  // 添加到剪贴板历史
  const addToHistory = useCallback(async (text: string) => {
    if (!text.trim()) return

    const type: 'text' | 'url' = text.startsWith('http://') || text.startsWith('https://') ? 'url' : 'text'

    const newEntry: ClipboardEntry = {
      id: Date.now().toString(),
      content: text,
      type,
      timestamp: new Date(),
      starred: false
    }

    setEntries(prev => {
      const filtered = prev.filter(e => e.content !== text)
      return [newEntry, ...filtered].slice(0, 100) // 限制最多100条
    })

    // 复制到系统剪贴板
    try {
      await navigator.clipboard.writeText(text)
      setCopied(newEntry.id)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [])

  // 手动添加
  const handleManualAdd = () => {
    const text = prompt('输入要保存的文本内容:')
    if (text) {
      addToHistory(text)
    }
  }

  // 从剪贴板粘贴
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        addToHistory(text)
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      alert('无法读取剪贴板，请手动添加')
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (entry: ClipboardEntry) => {
    try {
      await navigator.clipboard.writeText(entry.content)
      setCopied(entry.id)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 删除条目
  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // 切换星标
  const toggleStar = (id: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, starred: !e.starred } : e
    ))
  }

  // 清空所有
  const clearAll = () => {
    if (confirm('确定要清空所有剪贴板历史吗？')) {
      setEntries([])
      localStorage.removeItem('weblinux-clipboard-history')
    }
  }

  // 过滤和搜索
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || entry.type === filterType
    return matchesSearch && matchesFilter
  })

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--window-bg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clipboard size={24} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>剪贴板历史</h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePasteFromClipboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              <Clipboard size={14} />
              从剪贴板粘贴
            </button>

            <button
              onClick={handleManualAdd}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              手动添加
            </button>

            <button
              onClick={clearAll}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              清空全部
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="text"
              placeholder="搜索剪贴板内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: 'var(--window-bg)',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'text', 'url'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '8px 16px',
                  background: filterType === type ? 'var(--accent-bg)' : 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {type === 'all' ? '全部' : type === 'text' ? '文本' : '链接'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {filteredEntries.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            color: 'var(--text-secondary)'
          }}>
            <Clipboard size={48} style={{ opacity: 0.5 }} />
            <p style={{ fontSize: '14px', margin: 0 }}>暂无剪贴板历史</p>
            <p style={{ fontSize: '12px', margin: 0 }}>从剪贴板粘贴或手动添加内容开始使用</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '16px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: entry.type === 'url' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: entry.type === 'url' ? '#3b82f6' : '#10b981',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {entry.type === 'url' ? '链接' : '文本'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleStar(entry.id)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: entry.starred ? '#f59e0b' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                      title={entry.starred ? '取消收藏' : '收藏'}
                    >
                      {entry.starred ? '★' : '☆'}
                    </button>

                    <button
                      onClick={() => copyToClipboard(entry)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: copied === entry.id ? 'var(--accent)' : 'transparent',
                        color: copied === entry.id ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--window-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {copied === entry.id ? <Check size={12} /> : <Copy size={12} />}
                      {copied === entry.id ? '已复制' : '复制'}
                    </button>

                    <button
                      onClick={() => deleteEntry(entry.id)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  fontFamily: entry.type === 'url' ? 'monospace' : 'inherit',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '120px',
                  overflow: 'hidden'
                }}>
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--window-border)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>共 {entries.length} 条记录，显示 {filteredEntries.length} 条</span>
        <span>数据保存在本地浏览器</span>
      </div>
    </div>
  )
}