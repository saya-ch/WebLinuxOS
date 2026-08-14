import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Copy, Share, Trash2, Plus, Search, Star, Download, Upload, Code2, FileJson, Trash, Check, X, Users, Clock, Tag, Hash, Eye, EyeOff } from 'lucide-react'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
  owner: string
  shared: boolean
}

interface CollabEvent {
  type: 'snippet-created' | 'snippet-updated' | 'snippet-deleted' | 'cursor-move'
  snippetId: string
  data?: unknown
  timestamp: number
  sender: string
}

const STORAGE_KEY = 'weblinux-collab-snippets'
const CHANNEL_NAME = 'weblinux-snippet-sync'
const SESSION_KEY = 'weblinux-snippet-session'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'html', 'css', 'sql', 'bash', 'json', 'yaml', 'markdown'
]

const LANGUAGE_ICONS: Record<string, string> = {
  javascript: 'JS', typescript: 'TS', python: 'PY', java: 'JV', cpp: 'C++',
  csharp: 'C#', go: 'GO', rust: 'RS', php: 'PHP', ruby: 'RB',
  html: 'HTML', css: 'CSS', sql: 'SQL', bash: 'SH', json: 'JSON', yaml: 'YML', markdown: 'MD'
}

const SAMPLE_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'shared'>[] = [
  {
    title: '防抖函数',
    language: 'javascript',
    code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}`,
    description: '通用防抖函数，支持任意延迟时间',
    tags: ['工具函数', '性能优化'],
    favorite: true
  },
  {
    title: '快速排序',
    language: 'python',
    code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
    description: '经典快速排序算法实现',
    tags: ['算法', '排序'],
    favorite: false
  },
  {
    title: 'React Hook 模板',
    language: 'typescript',
    code: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
    description: 'LocalStorage 持久化 Hook',
    tags: ['React', 'Hook'],
    favorite: true
  }
]

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function saveSnippets(snippets: Snippet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
}

function generateId(): string {
  return 'sn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
}

function getCurrentSession(): string {
  let session = sessionStorage.getItem(SESSION_KEY)
  if (!session) {
    session = 'user_' + Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem(SESSION_KEY, session)
  }
  return session
}

function SnippetShare() {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const existing = loadSnippets()
    if (existing.length === 0) {
      const now = Date.now()
      const owner = getCurrentSession()
      return SAMPLE_SNIPPETS.map(s => ({
        ...s,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        owner,
        shared: true
      }))
    }
    return existing
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState<string>('all')
  const [showFavorites, setShowFavorites] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Partial<Snippet> | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [activeCollaborators, setActiveCollaborators] = useState<Set<string>>(new Set())
  const [showCode, setShowCode] = useState(true)

  const channelRef = useRef<BroadcastChannel | null>(null)
  const currentUser = useMemo(() => getCurrentSession(), [])

  useEffect(() => {
    saveSnippets(snippets)
  }, [snippets])

  useEffect(() => {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channelRef.current = channel

      channel.onmessage = (event: MessageEvent<CollabEvent>) => {
        const { type, data, sender } = event.data
        if (sender === currentUser) return

        setActiveCollaborators(prev => {
          const next = new Set(prev)
          next.add(sender)
          return next
        })

        if (type === 'snippet-created' && data) {
          setSnippets(prev => {
            const exists = prev.some(s => s.id === (data as Snippet).id)
            return exists ? prev : [...prev, data as Snippet]
          })
        } else if (type === 'snippet-updated' && data) {
          setSnippets(prev => prev.map(s =>
            s.id === (data as Snippet).id ? { ...data as Snippet, owner: s.owner } : s
          ))
        } else if (type === 'snippet-deleted') {
          setSnippets(prev => prev.filter(s => s.id !== (event.data as { snippetId: string }).snippetId))
        }
      }

      const pingInterval = setInterval(() => {
        channel.postMessage({
          type: 'cursor-move',
          snippetId: 'ping',
          timestamp: Date.now(),
          sender: currentUser
        } as CollabEvent)
      }, 30000)

      return () => {
        clearInterval(pingInterval)
        channel.close()
      }
    } catch {
      console.warn('BroadcastChannel 不可用，协作功能受限')
    }
  }, [currentUser])

  const broadcastEvent = useCallback((event: Omit<CollabEvent, 'timestamp' | 'sender'>) => {
    try {
      channelRef.current?.postMessage({
        ...event,
        timestamp: Date.now(),
        sender: currentUser
      })
    } catch { /* ignore */ }
  }, [currentUser])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const matchesSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))

      const matchesLang = filterLang === 'all' || s.language === filterLang
      const matchesFav = !showFavorites || s.favorite
      return matchesSearch && matchesLang && matchesFav
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [snippets, search, filterLang, showFavorites])

  const selectedSnippet = useMemo(() =>
    snippets.find(s => s.id === selectedId) || null,
    [snippets, selectedId]
  )

  const handleCreateNew = useCallback(() => {
    setEditingSnippet({
      title: '新代码片段',
      language: 'javascript',
      code: '',
      description: '',
      tags: []
    })
    setIsEditing(true)
    setSelectedId(null)
  }, [])

  const handleEdit = useCallback((snippet: Snippet) => {
    setEditingSnippet({ ...snippet })
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!editingSnippet || !editingSnippet.title) return
    const now = Date.now()
    const owner = currentUser

    if (editingSnippet.id) {
      const updated: Snippet = {
        ...(editingSnippet as Snippet),
        updatedAt: now
      }
      setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
      broadcastEvent({ type: 'snippet-updated', snippetId: updated.id, data: updated })
      setSelectedId(updated.id)
    } else {
      const newSnippet: Snippet = {
        id: generateId(),
        title: editingSnippet.title,
        language: editingSnippet.language || 'javascript',
        code: editingSnippet.code || '',
        description: editingSnippet.description || '',
        tags: editingSnippet.tags || [],
        favorite: false,
        createdAt: now,
        updatedAt: now,
        owner,
        shared: true
      }
      setSnippets(prev => [newSnippet, ...prev])
      broadcastEvent({ type: 'snippet-created', snippetId: newSnippet.id, data: newSnippet })
      setSelectedId(newSnippet.id)
    }
    setIsEditing(false)
    setEditingSnippet(null)
  }, [editingSnippet, currentUser, broadcastEvent])

  const handleDelete = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    broadcastEvent({ type: 'snippet-deleted', snippetId: id })
    if (selectedId === id) {
      setSelectedId(null)
    }
  }, [selectedId, broadcastEvent])

  const handleToggleFavorite = useCallback((id: string) => {
    setSnippets(prev => prev.map(s =>
      s.id === id ? { ...s, favorite: !s.favorite } : s
    ))
  }, [])

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.querySelector('.copy-feedback')
      if (btn) {
        btn.textContent = '已复制'
        setTimeout(() => { btn.textContent = '复制' }, 1500)
      }
    })
  }, [])

  const handleShare = useCallback((snippet: Snippet) => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({
      id: snippet.id,
      title: snippet.title,
      language: snippet.language,
      code: snippet,
      description: snippet.description,
      tags: snippet.tags
    }))))
    const url = `${window.location.origin}${window.location.pathname}#snippet=${encoded}`
    navigator.clipboard.writeText(url)
    setShareUrl(url)
    setTimeout(() => setShareUrl(null), 3000)
  }, [])

  const handleExport = useCallback(() => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snippets-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snippets])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string)
        if (Array.isArray(imported)) {
          const now = Date.now()
          const newSnippets: Snippet[] = imported.map(s => ({
            ...s,
            id: s.id || generateId(),
            createdAt: s.createdAt || now,
            updatedAt: now,
            owner: currentUser,
            shared: true
          }))
          setSnippets(prev => {
            const existingIds = new Set(prev.map(s => s.id))
            const merged = [...prev, ...newSnippets.filter(s => !existingIds.has(s.id))]
            return merged
          })
        }
      } catch (err) {
        console.error('导入失败:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [currentUser])

  const handleClearAll = useCallback(() => {
    if (confirm('确定要清空所有代码片段吗？此操作不可撤销。')) {
      setSnippets([])
      setSelectedId(null)
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e0e0e8',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'rgba(20, 20, 40, 0.9)',
        borderBottom: '1px solid rgba(124, 108, 240, 0.2)',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={20} style={{ color: '#7c6cf0' }} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>实时协作代码片段</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginLeft: 'auto',
          padding: '4px 10px',
          borderRadius: '12px',
          background: activeCollaborators.size > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 108, 240, 0.1)',
          fontSize: '12px',
          color: activeCollaborators.size > 0 ? '#10b981' : '#7c6cf0'
        }}>
          <Users size={14} />
          <span>{activeCollaborators.size} 位协作者在线</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleCreateNew} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }}>
            <Plus size={14} /> 新建
          </button>

          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(124, 108, 240, 0.2)',
            border: '1px solid rgba(124, 108, 240, 0.3)',
            color: '#e0e0e8',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <Download size={14} /> 导出
          </button>

          <label style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(124, 108, 240, 0.2)',
            border: '1px solid rgba(124, 108, 240, 0.3)',
            color: '#e0e0e8',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <Upload size={14} /> 导入
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>

          <button onClick={handleClearAll} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <Trash size={14} /> 清空
          </button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '10px 16px',
        background: 'rgba(15, 15, 26, 0.6)',
        borderBottom: '1px solid rgba(124, 108, 240, 0.1)',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: '1',
          minWidth: '200px',
          position: 'relative'
        }}>
          <Search size={14} style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280'
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索代码片段、标签或描述..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '8px',
              background: 'rgba(30, 30, 50, 0.8)',
              border: '1px solid rgba(124, 108, 240, 0.2)',
              color: '#e0e0e8',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(30, 30, 50, 0.8)',
            border: '1px solid rgba(124, 108, 240, 0.2)',
            color: '#e0e0e8',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <option value="all">所有语言</option>
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFavorites(!showFavorites)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: showFavorites ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 30, 50, 0.8)',
            border: `1px solid ${showFavorites ? 'rgba(245, 158, 11, 0.4)' : 'rgba(124, 108, 240, 0.2)'}`,
            color: showFavorites ? '#f59e0b' : '#e0e0e8',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Star size={14} /> {showFavorites ? '仅收藏' : '收藏'}
        </button>
      </div>

      {/* 主体内容 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 侧边栏列表 */}
        <div style={{
          width: '300px',
          overflow: 'auto',
          borderRight: '1px solid rgba(124, 108, 240, 0.15)',
          background: 'rgba(15, 15, 26, 0.4)'
        }}>
          {filteredSnippets.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <Code2 size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                {search ? '未找到匹配的代码片段' : '还没有代码片段'}
              </div>
              <div style={{ fontSize: '12px' }}>
                点击「新建」创建第一个代码片段
              </div>
            </div>
          ) : (
            filteredSnippets.map(snippet => (
              <div
                key={snippet.id}
                onClick={() => setSelectedId(snippet.id)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selectedId === snippet.id ? 'rgba(124, 108, 240, 0.2)' : 'transparent',
                  borderLeft: selectedId === snippet.id ? '3px solid #7c6cf0' : '3px solid transparent',
                  borderBottom: '1px solid rgba(124, 108, 240, 0.1)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== snippet.id) {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(124, 108, 240, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== snippet.id) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(124, 108, 240, 0.2)',
                    color: '#a78bfa',
                    fontWeight: 600
                  }}>
                    {LANGUAGE_ICONS[snippet.language] || snippet.language.toUpperCase()}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#e0e0e8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {snippet.title}
                  </span>
                  {snippet.favorite && (
                    <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  )}
                </div>
                {snippet.description && (
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '4px'
                  }}>
                    {snippet.description}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  fontSize: '10px',
                  color: '#4b5563'
                }}>
                  <span>{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                  {snippet.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{
                      padding: '1px 4px',
                      background: 'rgba(124, 108, 240, 0.1)',
                      borderRadius: '3px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 详情视图 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {selectedSnippet ? (
            <div>
              {/* 头部操作 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  color: '#e0e0e8',
                  flex: 1
                }}>
                  {selectedSnippet.title}
                </h2>
                <button onClick={() => handleToggleFavorite(selectedSnippet.id)} style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(124, 108, 240, 0.15)',
                  border: 'none',
                  color: selectedSnippet.favorite ? '#f59e0b' : '#9ca3af',
                  cursor: 'pointer'
                }}>
                  <Star size={16} style={{ fill: selectedSnippet.favorite ? '#f59e0b' : 'none' }} />
                </button>
                <button onClick={() => setShowCode(!showCode)} style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(124, 108, 240, 0.15)',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}>
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => handleCopyCode(selectedSnippet.code)} style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(124, 108, 240, 0.15)',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Copy size={14} />
                  <span className="copy-feedback">复制</span>
                </button>
                <button onClick={() => handleShare(selectedSnippet)} style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: 'none',
                  color: '#10b981',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Share size={14} /> 分享
                </button>
                <button onClick={() => handleEdit(selectedSnippet)} style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(124, 108, 240, 0.15)',
                  border: 'none',
                  color: '#7c6cf0',
                  cursor: 'pointer'
                }}>
                  编辑
                </button>
                <button onClick={() => handleDelete(selectedSnippet.id)} style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer'
                }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* 元数据 */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(124, 108, 240, 0.15)'
                }}>
                  <Hash size={12} /> {selectedSnippet.language.toUpperCase()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  更新于 {new Date(selectedSnippet.updatedAt).toLocaleString()}
                </span>
                {selectedSnippet.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(124, 108, 240, 0.1)',
                    color: '#a78bfa',
                    fontSize: '11px'
                  }}>
                    <Tag size={10} style={{ display: 'inline', marginRight: '3px' }} /> {tag}
                  </span>
                ))}
              </div>

              {/* 描述 */}
              {selectedSnippet.description && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(124, 108, 240, 0.08)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  {selectedSnippet.description}
                </div>
              )}

              {/* 代码块 */}
              {showCode && (
                <div style={{
                  background: 'rgba(10, 10, 20, 0.9)',
                  borderRadius: '10px',
                  border: '1px solid rgba(124, 108, 240, 0.3)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(30, 30, 50, 0.8)',
                    borderBottom: '1px solid rgba(124, 108, 240, 0.2)'
                  }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      snippet.{selectedSnippet.language}
                    </span>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    overflow: 'auto',
                    maxHeight: '500px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#e0e0e8'
                  }}>
                    <code>{selectedSnippet.code}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280'
            }}>
              <FileJson size={60} style={{ opacity: 0.3, marginBottom: '20px' }} />
              <h3 style={{ color: '#9ca3af', margin: '0 0 8px' }}>选择或创建代码片段</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>
                从左侧列表选择一个片段查看详情，或点击「新建」创建
              </p>
              <button onClick={handleCreateNew} style={{
                marginTop: '20px',
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}>
                <Plus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                创建新片段
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 分享链接提示 */}
      {shareUrl && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: 'rgba(16, 185, 129, 0.95)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000
        }}>
          分享链接已复制到剪贴板
        </div>
      )}

      {/* 编辑对话框 */}
      {isEditing && editingSnippet && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            background: '#1a1a2e',
            borderRadius: '12px',
            border: '1px solid rgba(124, 108, 240, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(124, 108, 240, 0.2)'
            }}>
              <h3 style={{ margin: 0, color: '#e0e0e8' }}>
                {editingSnippet.id ? '编辑代码片段' : '创建新代码片段'}
              </h3>
              <button onClick={() => { setIsEditing(false); setEditingSnippet(null) }} style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer'
              }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  标题
                </label>
                <input
                  value={editingSnippet.title || ''}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(30, 30, 50, 0.8)',
                    border: '1px solid rgba(124, 108, 240, 0.3)',
                    color: '#e0e0e8',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    语言
                  </label>
                  <select
                    value={editingSnippet.language || 'javascript'}
                    onChange={(e) => setEditingSnippet({ ...editingSnippet, language: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(30, 30, 50, 0.8)',
                      border: '1px solid rgba(124, 108, 240, 0.3)',
                      color: '#e0e0e8',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{LANGUAGE_ICONS[lang] || lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  描述（可选）
                </label>
                <textarea
                  value={editingSnippet.description || ''}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, description: e.target.value })}
                  placeholder="简要描述这个代码片段的用途..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(30, 30, 50, 0.8)',
                    border: '1px solid rgba(124, 108, 240, 0.3)',
                    color: '#e0e0e8',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  标签（用逗号分隔）
                </label>
                <input
                  value={(editingSnippet.tags || []).join(', ')}
                  onChange={(e) => setEditingSnippet({
                    ...editingSnippet,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="标签1, 标签2, 标签3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(30, 30, 50, 0.8)',
                    border: '1px solid rgba(124, 108, 240, 0.3)',
                    color: '#e0e0e8',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  代码
                </label>
                <textarea
                  value={editingSnippet.code || ''}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, code: e.target.value })}
                  placeholder="在此粘贴或编写代码..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(10, 10, 20, 0.9)',
                    border: '1px solid rgba(124, 108, 240, 0.3)',
                    color: '#e0e0e8',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '200px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                  spellCheck={false}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 20px',
              borderTop: '1px solid rgba(124, 108, 240, 0.2)'
            }}>
              <button onClick={() => { setIsEditing(false); setEditingSnippet(null) }} style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                取消
              </button>
              <button onClick={handleSave} style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}>
                <Check size={16} style={{ display: 'inline', marginRight: '4px' }} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SnippetShare
