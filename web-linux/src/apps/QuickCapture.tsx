import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Search, Plus, Tag, Trash2, Copy, Star, Clock, X, Filter, Download, Upload, Link2, Code, Type, Hash, Edit3, CheckSquare, Square, Layers } from 'lucide-react'

/**
 * QuickCapture 捕手 — 一站式碎片信息收集工作台
 *
 * 设计目标：解决日常"看到好东西来不及整理"的痛点。
 * 用户可以快速捕获文本片段、代码块、URL 链接、想法草稿，
 * 并通过分类、标签、置顶、搜索、Markdown 渲染等功能组织它们。
 *
 * 核心特性：
 *  - 五种类型：文本 / 代码 / 链接 / 待办 / 引用
 *  - 智能识别粘贴内容的类型（自动检测链接/代码）
 *  - 标签系统（多标签筛选、添加、删除）
 *  - 置顶、收藏、归档
 *  - 全文搜索（高亮匹配）
 *  - 导入/导出 JSON 备份
 *  - 全程本地持久化（localStorage）
 *  - 键盘快捷键（Ctrl/Cmd+N 新建、Ctrl/Cmd+K 搜索、Ctrl/Cmd+D 删除选中）
 */

type CaptureType = 'text' | 'code' | 'link' | 'todo' | 'quote'

interface CaptureItem {
  id: string
  type: CaptureType
  content: string
  title?: string
  tags: string[]
  pinned: boolean
  starred: boolean
  done?: boolean
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'weblinux-quickcapture-v1'

const TYPE_META: Record<CaptureType, { label: string; color: string; icon: typeof Plus }> = {
  text: { label: '文本', color: '#7c3aed', icon: Type },
  code: { label: '代码', color: '#0ea5e9', icon: Code },
  link: { label: '链接', color: '#10b981', icon: Link2 },
  todo: { label: '待办', color: '#f59e0b', icon: CheckSquare },
  quote: { label: '引用', color: '#ec4899', icon: Hash },
}

const detectType = (raw: string): CaptureType => {
  const trimmed = raw.trim()
  if (!trimmed) return 'text'
  if (/^https?:\/\/\S+$/i.test(trimmed)) return 'link'
  if (/^(function|const|let|var|class|import|export|if|for|while|return|def|public|private|interface|type)\b/m.test(trimmed) && trimmed.length > 20) return 'code'
  if (/[{};]/.test(trimmed) && /\n/.test(trimmed)) return 'code'
  if (/^>\s/.test(trimmed)) return 'quote'
  return 'text'
}

const loadItems = (): CaptureItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedItems()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedItems()
    return parsed as CaptureItem[]
  } catch {
    return seedItems()
  }
}

const seedItems = (): CaptureItem[] => {
  const now = Date.now()
  return [
    {
      id: 'seed-1',
      type: 'link',
      title: 'WebLinuxOS 项目主页',
      content: 'https://github.com/saya-ch/WebLinuxOS',
      tags: ['项目', 'GitHub'],
      pinned: true,
      starred: true,
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'seed-2',
      type: 'code',
      title: 'Debounce 函数',
      content: 'function debounce(fn, wait) {\n  let timer = null\n  return function(...args) {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn.apply(this, args), wait)\n  }\n}',
      tags: ['JavaScript', '工具函数'],
      pinned: false,
      starred: true,
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
    },
    {
      id: 'seed-3',
      type: 'todo',
      title: '今日待办',
      content: '完成 WebLinuxOS v44 改进工作\n- 修复版本号不一致问题\n- 添加 QuickCapture 应用\n- 优化 README',
      tags: ['任务'],
      pinned: false,
      starred: false,
      done: false,
      createdAt: now - 7200000,
      updatedAt: now - 7200000,
    },
  ]
}

const saveItems = (items: CaptureItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* localStorage 不可用时静默失败 */
  }
}

const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const renderHighlighted = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ background: 'rgba(124, 58, 237, 0.4)', color: 'inherit', padding: '0 2px', borderRadius: 2 }}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

interface ItemCardProps {
  item: CaptureItem
  selected: boolean
  onSelect: () => void
  onUpdate: (patch: Partial<CaptureItem>) => void
  searchQuery: string
}

const ItemCard = memo(function ItemCard({ item, selected, onSelect, onUpdate, searchQuery }: ItemCardProps) {
  const meta = TYPE_META[item.type]
  const Icon = meta.icon
  const isUrl = item.type === 'link' && /^https?:\/\//i.test(item.content.trim())

  return (
    <div
      onClick={onSelect}
      className={`qc-item-card ${selected ? 'qc-item-selected' : ''}`}
      style={{
        background: selected ? 'rgba(124, 58, 237, 0.12)' : 'var(--color-surface)',
        border: `1px solid ${selected ? meta.color : 'var(--window-border, rgba(255,255,255,0.08))'}`,
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 999,
            background: `${meta.color}22`,
            color: meta.color,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Icon size={11} />
          {meta.label}
        </span>
        {item.pinned && <span title="已置顶" style={{ fontSize: 11, color: '#f59e0b' }}>★</span>}
        {item.starred && <span title="已收藏" style={{ fontSize: 11, color: '#ec4899' }}>♥</span>}
        {item.type === 'todo' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ done: !item.done })
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: item.done ? meta.color : 'var(--text-secondary)',
              display: 'inline-flex',
            }}
            title={item.done ? '已完成 - 取消' : '标记为已完成'}
          >
            {item.done ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>
          {formatDate(item.updatedAt)}
        </span>
      </div>
      {item.title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: item.type === 'todo' && item.done ? 'line-through' : 'none',
            opacity: item.type === 'todo' && item.done ? 0.6 : 1,
          }}
        >
          {renderHighlighted(item.title, searchQuery)}
        </div>
      )}
      <div
        style={{
          color: 'var(--text-secondary)',
          maxHeight: 64,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          whiteSpace: item.type === 'code' ? 'pre-wrap' : 'normal',
          fontFamily: item.type === 'code' ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
          background: item.type === 'code' ? 'rgba(0,0,0,0.2)' : 'transparent',
          padding: item.type === 'code' ? 8 : 0,
          borderRadius: item.type === 'code' ? 4 : 0,
          fontSize: item.type === 'code' ? 11 : 12,
          textDecoration: item.type === 'todo' && item.done ? 'line-through' : 'none',
          opacity: item.type === 'todo' && item.done ? 0.6 : 1,
        }}
      >
        {isUrl ? (
          <a
            href={item.content.trim()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: meta.color, textDecoration: 'none' }}
          >
            {renderHighlighted(item.content, searchQuery)}
          </a>
        ) : (
          renderHighlighted(item.content, searchQuery)
        )}
      </div>
      {item.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {item.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 3,
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#7dd3fc',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

export default function QuickCapture() {
  const [items, setItems] = useState<CaptureItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'pinned' | 'todo' | CaptureType>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CaptureItem | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initial = loadItems()
    setItems(initial)
    if (initial.length > 0 && !selectedId) {
      setSelectedId(initial[0].id)
    }
  }, [])

  useEffect(() => {
    if (items.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveItems(items)
    }
  }, [items])

  // 收集所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach((item) => item.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [items])

  // 过滤后的项目列表
  const filteredItems = useMemo(() => {
    let result = items
    if (activeFilter === 'starred') {
      result = result.filter((i) => i.starred)
    } else if (activeFilter === 'pinned') {
      result = result.filter((i) => i.pinned)
    } else if (activeFilter === 'todo') {
      result = result.filter((i) => i.type === 'todo' && !i.done)
    } else if (activeFilter !== 'all') {
      result = result.filter((i) => i.type === activeFilter)
    }
    if (activeTag) {
      result = result.filter((i) => i.tags.includes(activeTag))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.content.toLowerCase().includes(q) ||
          i.title?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    // 排序：置顶 > 收藏 > 更新时间倒序
    return [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }, [items, activeFilter, activeTag, searchQuery])

  // 统计信息
  const stats = useMemo(() => {
    const total = items.length
    const todos = items.filter((i) => i.type === 'todo')
    const todoDone = todos.filter((i) => i.done).length
    const codes = items.filter((i) => i.type === 'code').length
    const links = items.filter((i) => i.type === 'link').length
    return { total, todoTotal: todos.length, todoDone, codes, links }
  }, [items])

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId])

  const handleCreate = useCallback(
    (type: CaptureType = 'text') => {
      const newItem: CaptureItem = {
        id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        content: '',
        tags: [],
        pinned: false,
        starred: false,
        done: type === 'todo' ? false : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setItems((prev) => [newItem, ...prev])
      setSelectedId(newItem.id)
      setEditingItem(newItem)
      setEditorOpen(true)
    },
    [],
  )

  const handlePasteCreate = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        handleCreate('text')
        return
      }
      const detected = detectType(text)
      const newItem: CaptureItem = {
        id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: detected,
        content: text,
        tags: [],
        pinned: false,
        starred: false,
        done: detected === 'todo' ? false : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setItems((prev) => [newItem, ...prev])
      setSelectedId(newItem.id)
    } catch {
      // 剪贴板权限被拒，回退到普通新建
      handleCreate('text')
    }
  }, [handleCreate])

  const handleUpdate = useCallback(
    (id: string, patch: Partial<CaptureItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item)),
      )
    },
    [],
  )

  const handleDelete = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id))
      if (selectedId === id) {
        setSelectedId(null)
      }
    },
    [selectedId],
  )

  const handleExport = useCallback(() => {
    const data = JSON.stringify(items, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quickcapture-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [items])

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target?.result || '[]'))
        if (Array.isArray(data)) {
          const imported = (data as CaptureItem[]).filter(
            (i) => i && typeof i.id === 'string' && typeof i.content === 'string',
          )
          setItems((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const newItems = imported.filter((i) => !existingIds.has(i.id))
            return [...newItems, ...prev]
          })
        }
      } catch (err) {
        console.error('QuickCapture 导入失败：', err)
      }
    }
    reader.readAsText(file)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return
      if (e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        handleCreate('text')
      } else if (e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        const input = document.getElementById('qc-search') as HTMLInputElement | null
        input?.focus()
      } else if (e.key === 'd' && selectedId) {
        e.preventDefault()
        handleDelete(selectedId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCreate, handleDelete, selectedId])

  const filters: { key: typeof activeFilter; label: string; icon?: typeof Plus }[] = [
    { key: 'all', label: '全部' },
    { key: 'starred', label: '收藏', icon: Star },
    { key: 'pinned', label: '置顶' },
    { key: 'todo', label: '待办', icon: CheckSquare },
    { key: 'text', label: '文本', icon: Type },
    { key: 'code', label: '代码', icon: Code },
    { key: 'link', label: '链接', icon: Link2 },
    { key: 'quote', label: '引用', icon: Hash },
  ]

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--window-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            borderRadius: 6,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            id="qc-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索内容 / 标题 / 标签  (Ctrl+K)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              padding: '2px 0',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          onClick={handlePasteCreate}
          style={{
            padding: '6px 12px',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 6,
            color: '#c4b5fd',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="从剪贴板粘贴并自动识别类型"
        >
          <Layers size={13} />粘贴捕获
        </button>
        <button
          onClick={() => handleCreate('text')}
          style={{
            padding: '6px 12px',
            background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%))',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
          }}
          title="新建条目 (Ctrl+N)"
        >
          <Plus size={13} />新建
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="导出为 JSON"
        >
          <Download size={12} />
        </button>
        <button
          onClick={() => importInputRef.current?.click()}
          style={{
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="从 JSON 导入"
        >
          <Upload size={12} />
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* 过滤器与统计 */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <Filter size={12} />
        {filters.map((f) => {
          const active = activeFilter === f.key
          const Icon = f.icon
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '3px 10px',
                background: active ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                border: `1px solid ${active ? '#7c3aed' : 'var(--window-border, rgba(255,255,255,0.08))'}`,
                borderRadius: 999,
                color: active ? '#c4b5fd' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              {Icon && <Icon size={11} />}
              {f.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11 }}>
          共 {stats.total} 条 · 待办 {stats.todoDone}/{stats.todoTotal} · 代码 {stats.codes} · 链接 {stats.links}
        </span>
      </div>

      {/* 标签筛选栏 */}
      {allTags.length > 0 && (
        <div
          style={{
            padding: '6px 14px',
            borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <Tag size={11} />
          <button
            onClick={() => setActiveTag(null)}
            style={{
              padding: '2px 8px',
              background: !activeTag ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: `1px solid ${!activeTag ? '#38bdf8' : 'transparent'}`,
              borderRadius: 3,
              color: !activeTag ? '#7dd3fc' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            全部标签
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                padding: '2px 8px',
                background: activeTag === tag ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: `1px solid ${activeTag === tag ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)'}`,
                borderRadius: 3,
                color: activeTag === tag ? '#7dd3fc' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 8,
            alignContent: 'start',
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                padding: 60,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Layers size={36} style={{ opacity: 0.4 }} />
              <div>
                {searchQuery || activeFilter !== 'all' || activeTag
                  ? '没有匹配的条目。试试调整筛选条件？'
                  : '还没有任何条目。点击右上角"新建"或"粘贴捕获"开始收集。'}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
                onUpdate={(patch) => handleUpdate(item.id, patch)}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>

        {/* 右侧详情面板 */}
        {selectedItem && !editorOpen && (
          <div
            style={{
              width: 360,
              borderLeft: '1px solid var(--window-border, rgba(255,255,255,0.08))',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: `${TYPE_META[selectedItem.type].color}22`,
                  color: TYPE_META[selectedItem.type].color,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {(() => {
                  const Icon = TYPE_META[selectedItem.type].icon
                  return <Icon size={11} />
                })()}
                {TYPE_META[selectedItem.type].label}
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => {
                  setEditingItem(selectedItem)
                  setEditorOpen(true)
                }}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="编辑"
              >
                <Edit3 size={11} />编辑
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(selectedItem.content)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="复制内容"
              >
                <Copy size={11} />
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要删除这条条目吗？')) {
                    handleDelete(selectedItem.id)
                  }
                }}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 4,
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="删除"
              >
                <Trash2 size={11} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              {selectedItem.title && (
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedItem.title}
                </h3>
              )}
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.05))',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontFamily: selectedItem.type === 'code' ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 320,
                  overflowY: 'auto',
                }}
              >
                {selectedItem.content || <em style={{ opacity: 0.5 }}>（空内容）</em>}
              </pre>
              {selectedItem.tags.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#7dd3fc',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid var(--window-border, rgba(255,255,255,0.05))',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} />
                  创建于 {new Date(selectedItem.createdAt).toLocaleString('zh-CN')}
                </span>
                {selectedItem.updatedAt !== selectedItem.createdAt && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    更新于 {new Date(selectedItem.updatedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 编辑器 */}
        {editorOpen && editingItem && (
          <Editor
            item={editingItem}
            allTags={allTags}
            onSave={(patch) => {
              handleUpdate(editingItem.id, patch)
              setEditorOpen(false)
              setEditingItem(null)
            }}
            onCancel={() => {
              if (!editingItem.content && !editingItem.title) {
                handleDelete(editingItem.id)
              }
              setEditorOpen(false)
              setEditingItem(null)
            }}
            onDelete={() => {
              handleDelete(editingItem.id)
              setEditorOpen(false)
              setEditingItem(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

interface EditorProps {
  item: CaptureItem
  allTags: string[]
  onSave: (patch: Partial<CaptureItem>) => void
  onCancel: () => void
  onDelete: () => void
}

const Editor = memo(function Editor({ item, allTags, onSave, onCancel, onDelete }: EditorProps) {
  const [type, setType] = useState<CaptureType>(item.type)
  const [content, setContent] = useState(item.content)
  const [title, setTitle] = useState(item.title || '')
  const [tagsInput, setTagsInput] = useState(item.tags.join(', '))
  const [pinned, setPinned] = useState(item.pinned)
  const [starred, setStarred] = useState(item.starred)
  const [done, setDone] = useState(item.done || false)

  const handleSave = () => {
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({
      type,
      content,
      title: title.trim() || undefined,
      tags,
      pinned,
      starred,
      done: type === 'todo' ? done : undefined,
    })
  }

  return (
    <div
      style={{
        width: 460,
        borderLeft: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>编辑条目</h3>
        <div style={{ flex: 1 }} />
        <button
          onClick={onCancel}
          style={{
            padding: '4px 10px',
            background: 'transparent',
            border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          style={{
            padding: '4px 12px',
            background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%))',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: content.trim() ? 'pointer' : 'not-allowed',
            fontSize: 12,
            fontWeight: 600,
            opacity: content.trim() ? 1 : 0.5,
          }}
        >
          保存
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            类型
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(TYPE_META) as CaptureType[]).map((t) => {
              const meta = TYPE_META[t]
              const Icon = meta.icon
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: '4px 10px',
                    background: type === t ? `${meta.color}33` : 'transparent',
                    border: `1px solid ${type === t ? meta.color : 'var(--window-border, rgba(255,255,255,0.08))'}`,
                    borderRadius: 4,
                    color: type === t ? meta.color : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 11,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Icon size={11} />{meta.label}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            标题（可选）
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这条内容起个标题"
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
              borderRadius: 4,
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            内容 {type === 'code' && <span style={{ opacity: 0.7 }}>（支持多行代码）</span>}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="粘贴或输入内容..."
            autoFocus
            style={{
              width: '100%',
              minHeight: 160,
              padding: 8,
              background: type === 'code' ? 'rgba(0,0,0,0.3)' : 'var(--window-bg)',
              border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
              borderRadius: 4,
              color: 'var(--text-primary)',
              fontSize: type === 'code' ? 12 : 13,
              fontFamily: type === 'code' ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            标签（用逗号分隔）
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例如：项目, JavaScript, 待整理"
            list="qc-tag-suggestions"
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
              borderRadius: 4,
              color: 'var(--text-primary)',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <datalist id="qc-tag-suggestions">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            置顶
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} />
            收藏
          </label>
          {type === 'todo' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
              已完成
            </label>
          )}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--window-border, rgba(255,255,255,0.05))' }}>
          <button
            onClick={() => {
              if (confirm('确定要删除这条条目吗？')) onDelete()
            }}
            style={{
              padding: '5px 10px',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 4,
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Trash2 size={11} />删除条目
          </button>
        </div>
      </div>
    </div>
  )
})
