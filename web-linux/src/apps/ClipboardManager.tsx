import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../store'

interface ClipboardItem {
  id: string
  content: string
  type: 'text' | 'image' | 'link'
  timestamp: Date
  preview: string
}

const ClipboardManager = memo(function ClipboardManager() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const addNotification = useStore((s) => (s as any).addNotification)

  useEffect(() => {
    const stored = localStorage.getItem('clipboard-history')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setClipboardHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      } catch (e) {
        console.error('Failed to parse clipboard history')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('clipboard-history', JSON.stringify(clipboardHistory))
  }, [clipboardHistory])

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      addNotification?.({
        title: '已复制到剪贴板',
        message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        type: 'success',
        duration: 2000,
      })
    })
  }, [addNotification])

  const deleteItem = useCallback((id: string) => {
    setClipboardHistory((prev) => prev.filter((item) => item.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const clearAll = useCallback(() => {
    setClipboardHistory([])
    setSelectedId(null)
  }, [])

  const detectType = (content: string): 'text' | 'image' | 'link' => {
    if (content.match(/^https?:\/\//)) return 'link'
    if (content.match(/^data:image\//)) return 'image'
    return 'text'
  }

  const getPreview = (content: string, type: 'text' | 'image' | 'link'): string => {
    if (type === 'image') return '[图片]'
    if (type === 'link') return new URL(content).hostname
    return content.substring(0, 100) + (content.length > 100 ? '...' : '')
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  const filteredHistory = clipboardHistory.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedItem = clipboardHistory.find((item) => item.id === selectedId)

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '320px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder="🔍 搜索剪贴板历史..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredHistory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <div>暂无剪贴板记录</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                复制内容后将自动记录
              </div>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  padding: '10px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background:
                    selectedId === item.id
                      ? 'var(--accent)'
                      : 'var(--bg-primary)',
                  color:
                    selectedId === item.id
                      ? '#fff'
                      : 'var(--text-primary)',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: selectedId === item.id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  {item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼️' : '📝'} {formatTime(item.timestamp)}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.preview}
                </div>
              </div>
            ))
          )}
        </div>
        {clipboardHistory.length > 0 && (
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={clearAll}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                background: 'rgba(231, 76, 60, 0.1)',
                color: '#e74c3c',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)'
              }}
            >
              🗑️ 清空全部
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {selectedItem ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  {selectedItem.type === 'link' ? '🔗 链接' : selectedItem.type === 'image' ? '🖼️ 图片' : '📝 文本'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {formatTime(selectedItem.timestamp)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copyToClipboard(selectedItem.content)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  📋 复制
                </button>
                <button
                  onClick={() => deleteItem(selectedItem.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    background: 'transparent',
                    color: '#e74c3c',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {selectedItem.content}
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👈</div>
            <div style={{ fontSize: '16px' }}>选择一条记录查看详情</div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ClipboardManager
