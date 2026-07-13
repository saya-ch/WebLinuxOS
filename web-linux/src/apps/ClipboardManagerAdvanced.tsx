import { useState, useEffect, useRef } from 'react'
import { 
  Clipboard, Search, Trash2, Copy, Star, Clock, 
  Code, FileText, Image, Link, Type, Check, 
  X, Plus, Filter, Tag, Archive
} from 'lucide-react'

interface ClipboardItem {
  id: string
  content: string
  type: 'text' | 'code' | 'link' | 'image' | 'file'
  starred: boolean
  archived: boolean
  tags: string[]
  timestamp: number
  preview: string
}

const typeIcons = {
  text: Type,
  code: Code,
  link: Link,
  image: Image,
  file: FileText,
}

const typeColors = {
  text: '#8b7cf0',
  code: '#00d084',
  link: '#3498db',
  image: '#f39c12',
  file: '#e74c3c',
}

const typeLabels = {
  text: '文本',
  code: '代码',
  link: '链接',
  image: '图片',
  file: '文件',
}

export default function ClipboardManager() {
  const [items, setItems] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-clipboard-manager')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showTagInput, setShowTagInput] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const detectType = (text: string): ClipboardItem['type'] => {
    if (/^https?:\/\//.test(text)) return 'link'
    if (/^(import|export|function|const|let|var|class|interface|type)\s/m.test(text) ||
        /[{}\[\]();]/.test(text)) return 'code'
    if (/^data:image\//.test(text)) return 'image'
    return 'text'
  }

  const generatePreview = (content: string): string => {
    const preview = content.slice(0, 100)
    return preview.length < content.length ? preview + '...' : preview
  }

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-clipboard-manager', JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save clipboard:', error)
    }
  }, [items])

  useEffect(() => {
    monitorRef.current = setInterval(async () => {
      try {
        const text = await navigator.clipboard.readText()
        if (text && text.length > 0 && text.length < 50000) {
          const type = detectType(text)
          const preview = generatePreview(text)
          
          setItems(prev => {
            if (prev.some(item => item.content === text)) {
              return prev
            }
            
            const newItem: ClipboardItem = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              content: text,
              type,
              starred: false,
              archived: false,
              tags: [],
              timestamp: Date.now(),
              preview,
            }
            
            return [newItem, ...prev].slice(0, 100)
          })
        }
      } catch {
        // 忽略剪贴板访问错误
      }
    }, 2000)

    return () => {
      if (monitorRef.current) {
        clearInterval(monitorRef.current)
      }
    }
  }, [])

  const filteredItems = items.filter(item => {
    if (showArchived && !item.archived) return false
    if (!showArchived && item.archived) return false
    if (selectedType !== 'all' && item.type !== selectedType) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  const copyToClipboard = async (item: ClipboardItem) => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleStar = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, starred: !item.starred } : item
    ))
  }

  const toggleArchive = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, archived: !item.archived } : item
    ))
  }

  const addTag = (id: string) => {
    if (!newTag.trim()) return
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, tags: [...item.tags, newTag.trim()] } : item
    ))
    setNewTag('')
    setShowTagInput(null)
  }

  const removeTag = (itemId: string, tag: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, tags: item.tags.filter(t => t !== tag) } : item
    ))
  }

  const clearAll = () => {
    if (confirm('确定要清空所有剪贴板记录吗？')) {
      setItems([])
    }
  }

  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  return (
    <div className="app-container" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      background: 'var(--bg-primary, #1a1a28)'
    }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--border-color, #333)', 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'var(--bg-secondary, #252525)'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              opacity: 0.5,
              color: 'var(--text-primary)'
            }} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索剪贴板..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              background: 'var(--bg-primary, #1a1a28)',
              border: '1px solid var(--border-color, #333)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'text', 'code', 'link', 'image'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '6px 12px',
                background: selectedType === type ? type === 'all' ? 'var(--accent)' : typeColors[type as keyof typeof typeColors] : 'transparent',
                color: selectedType === type ? 'white' : 'var(--text-primary)',
                border: `1px solid ${selectedType === type ? 'transparent' : 'var(--border-color, #333)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              {type !== 'all' && (
                <>
                  {type === 'all' ? <Filter size={14} /> : null}
                  {(() => {
                    const Icon = typeIcons[type as keyof typeof typeIcons]
                    return <Icon size={14} />
                  })()}
                </>
              )}
              {type === 'all' ? '全部' : typeLabels[type as keyof typeof typeLabels]}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowArchived(!showArchived)}
          style={{
            padding: '6px 12px',
            background: showArchived ? 'var(--warning)' : 'transparent',
            color: showArchived ? 'black' : 'var(--text-primary)',
            border: '1px solid var(--border-color, #333)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Archive size={14} />
          {showArchived ? '显示全部' : '显示归档'}
        </button>
        
        <button
          onClick={clearAll}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            color: 'var(--error)',
            border: '1px solid var(--error)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Trash2 size={14} />
          清空
        </button>
      </div>
      
      <div 
        ref={listRef}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {filteredItems.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            <Clipboard size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>暂无剪贴板记录</p>
            <p style={{ fontSize: '13px', opacity: 0.7 }}>复制内容后会自动添加到列表中</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const Icon = typeIcons[item.type]
            const color = typeColors[item.type]
            
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-secondary, #252525)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--border-color, #333)',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  marginBottom: item.tags.length > 0 ? '12px' : 0
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color={color} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: `${color}20`,
                        color: color,
                        fontWeight: '600',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}>
                        {typeLabels[item.type]}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={11} />
                        {formatTime(item.timestamp)}
                      </span>
                      {item.starred && (
                        <Star size={12} fill="var(--warning)" color="var(--warning)" />
                      )}
                    </div>
                    
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-primary)',
                      fontFamily: item.type === 'code' ? "'JetBrains Mono', monospace" : "'Plus Jakarta Sans', sans-serif",
                      lineHeight: '1.6',
                      margin: 0,
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: item.type === 'code' ? 8 : 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.content}
                    </p>
                  </div>
                </div>
                
                {item.tags.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--accent-bg)',
                          color: 'var(--accent)',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Tag size={10} />
                        {tag}
                        <button
                          onClick={() => removeTag(item.id, tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '6px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color, #333)'
                }}>
                  <button
                    onClick={() => copyToClipboard(item)}
                    style={{
                      padding: '6px 12px',
                      background: copiedId === item.id ? 'var(--success)' : 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === item.id ? '已复制' : '复制'}
                  </button>
                  
                  <button
                    onClick={() => toggleStar(item.id)}
                    style={{
                      padding: '6px 12px',
                      background: item.starred ? 'var(--warning)' : 'transparent',
                      color: item.starred ? 'black' : 'var(--text-primary)',
                      border: '1px solid var(--border-color, #333)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Star size={14} fill={item.starred ? 'currentColor' : 'none'} />
                    收藏
                  </button>
                  
                  <button
                    onClick={() => toggleArchive(item.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color, #333)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Archive size={14} />
                    {item.archived ? '取消归档' : '归档'}
                  </button>
                  
                  {showTagInput === item.id ? (
                    <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag(item.id)}
                        placeholder="输入标签..."
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          background: 'var(--bg-primary, #1a1a28)',
                          border: '1px solid var(--accent)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => addTag(item.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setShowTagInput(null)
                          setNewTag('')
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color, #333)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTagInput(item.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color, #333)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: 'auto',
                      }}
                    >
                      <Plus size={14} />
                      标签
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--error)',
                      border: '1px solid var(--error)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid var(--border-color, #333)', 
        background: 'var(--bg-secondary, #252525)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <span>共 {items.length} 条记录</span>
        <span>自动监控剪贴板中...</span>
      </div>
    </div>
  )
}
