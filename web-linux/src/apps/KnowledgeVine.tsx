import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import {
  Search, Plus, Trash2, BookOpen, Network,
  LayoutGrid, Link2, FileText,
  Save, ArrowLeft
} from 'lucide-react'
import './KnowledgeVine.css'

/* ============================================================
   Knowledge Vine - 第二大脑 / 知识藤蔓
   ============================================================
   - 卡片盒笔记法(Zettelkasten): 每张卡片是一个独立概念
   - 双向链接: 用 [[卡片名]] 创建笔记之间的网络
   - 知识图谱: 力导向布局可视化所有笔记之间的关联
   - 全文搜索: 即时搜索所有卡片
   - 标签系统: 多维度分类与检索
   - 类别管理: 主题/项目/资源/灵感
   - 全部本地存储, 隐私安全
   ============================================================ */

interface Note {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  links: string[]
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

const STORAGE_KEY = 'knowledge-vine-v1'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: '全部笔记', color: '#4ade80', icon: '◉' },
  { id: 'concept', name: '概念', color: '#4ade80', icon: '◐' },
  { id: 'project', name: '项目', color: '#fbbf24', icon: '◆' },
  { id: 'resource', name: '资源', color: '#67e8f9', icon: '◇' },
  { id: 'insight', name: '灵感', color: '#c4b5fd', icon: '✦' },
  { id: 'question', name: '问题', color: '#f87171', icon: '?' },
]

const SEED_NOTES: Note[] = [
  {
    id: 'n-welcome',
    title: '欢迎来到知识藤蔓',
    content: `# 欢迎来到知识藤蔓

这是你的第二大脑。

## 核心理念

> "信息是噪音，知识是连接。" — David Perrell

## 如何使用

- **创建笔记**：点击右上角的新建按钮
- **双向链接**：用 [[笔记名]] 引用其他笔记，系统会自动建立关联
- **标签**：使用 #标签 为笔记添加多维度分类
- **图谱视图**：点击图谱按钮可视化你的知识网络

## 提示

试试创建一张笔记，比如"费曼学习法"，然后用 [[费曼学习法]] 引用它。`,
    category: 'concept',
    tags: ['入门', '方法论'],
    links: [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    pinned: true,
  },
  {
    id: 'n-feynman',
    title: '费曼学习法',
    content: `# 费曼学习法

诺贝尔奖得主理查德·费曼提出的学习框架，核心是"以教促学"。

## 四步法则

1. **选择概念**：选择要学习的概念，写在纸上
2. **假装教授**：向一个完全不懂的人讲解这个概念
3. **识别盲点**：卡住的地方就是知识漏洞
4. **简化语言**：用最简单的话重新组织

## 应用场景

- 学习新技术栈
- 准备技术分享
- 整理复杂的系统设计

## 相关

- [[刻意练习]]`,
    category: 'concept',
    tags: ['学习', '方法论'],
    links: ['n-deliberate'],
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'n-deliberate',
    title: '刻意练习',
    content: `# 刻意练习

安德斯·艾利克森提出的训练理论。

## 核心原则

- 专注：100% 投入的训练
- 反馈：实时纠正偏差
- 突破：持续挑战舒适区边缘
- 重复：高频次的刻意训练

## 与费曼学习法的结合

- 用 [[费曼学习法]] 检验理解
- 在反馈循环中不断调整
- 通过教学巩固薄弱环节`,
    category: 'concept',
    tags: ['学习', '训练'],
    links: ['n-feynman'],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: 'n-zettel',
    title: '卡片盒笔记法',
    content: `# 卡片盒笔记法 (Zettelkasten)

德国社会学家 Niklas Luhmann 实践的笔记方法。

## 核心思想

每张卡片只记录一个独立的概念，通过编号与链接建立网络。

## 卡片类型

- **闪念卡 (Fleeting)**：随时记录的想法
- **文献卡 (Literature)**：阅读时摘录
- **永久卡 (Permanent)**：经过思考的概念
- **项目卡 (Project)**：与具体项目相关

## 工具

- Obsidian
- Roam Research
- Logseq
- 本知识藤蔓 :)`,
    category: 'concept',
    tags: ['笔记', '方法论', 'PKM'],
    links: [],
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 600000,
  },
]

function detectLinks(content: string, allNotes: Note[]): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) || []
  const linked = new Set<string>()
  for (const m of matches) {
    const title = m.slice(2, -2).trim()
    const target = allNotes.find(n => n.title === title)
    if (target) linked.add(target.id)
  }
  return Array.from(linked)
}

function extractTags(content: string): string[] {
  const matches = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9_\-]+/g) || []
  return matches.map(m => m.slice(1))
}

type ViewMode = 'grid' | 'graph'

const KnowledgeVine = memo(function KnowledgeVine() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.notes) && data.notes.length > 0) {
          setNotes(data.notes)
        } else {
          setNotes(SEED_NOTES)
        }
      } else {
        setNotes(SEED_NOTES)
      }
    } catch {
      setNotes(SEED_NOTES)
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }))
      } catch {
        // ignore quota
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [notes])

  const notesWithLinks = useMemo(() => {
    return notes.map(n => ({
      ...n,
      links: detectLinks(n.content, notes),
      tags: Array.from(new Set([...n.tags, ...extractTags(n.content)])),
    }))
  }, [notes])

  const filteredNotes = useMemo(() => {
    let result = notesWithLinks
    if (activeCategory !== 'all') {
      result = result.filter(n => n.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return [...result].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.updatedAt - a.updatedAt
    })
  }, [notesWithLinks, activeCategory, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notesWithLinks.length }
    for (const cat of DEFAULT_CATEGORIES) {
      if (cat.id === 'all') continue
      counts[cat.id] = notesWithLinks.filter(n => n.category === cat.id).length
    }
    return counts
  }, [notesWithLinks])

  const editingNote = useMemo(() => {
    if (!editingId) return null
    return notesWithLinks.find(n => n.id === editingId)
  }, [editingId, notesWithLinks])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notesWithLinks.forEach(n => n.tags.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [notesWithLinks])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const createNote = useCallback((category = 'concept') => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: '新笔记',
      content: '',
      category,
      tags: [],
      links: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes(prev => [newNote, ...prev])
    setEditingId(newNote.id)
  }, [])

  const deleteNote = useCallback((id: string) => {
    if (!confirm('确定删除这张笔记？')) return
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editingId === id) setEditingId(null)
    showToast('已删除', 'error')
  }, [editingId, showToast])

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
  }, [])

  const navigateToNote = useCallback((title: string) => {
    const target = notesWithLinks.find(n => n.title === title)
    if (target) {
      setEditingId(target.id)
    } else {
      showToast(`未找到笔记: ${title}`, 'error')
    }
  }, [notesWithLinks, showToast])

  const exportData = useCallback(() => {
    const data = JSON.stringify({ notes, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-vine-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出', 'success')
  }, [notes, showToast])

  if (editingNote) {
    return (
      <div className="kv-root">
        <div className="kv-editor">
          <div className="kv-editor-header">
            <button className="kv-btn" onClick={() => setEditingId(null)}>
              <ArrowLeft size={12} /> 返回
            </button>
            <input
              className="kv-editor-title"
              value={editingNote.title}
              onChange={(e) => updateNote(editingNote.id, { title: e.target.value })}
              placeholder="笔记标题..."
            />
            <button className="kv-icon-btn" onClick={() => deleteNote(editingNote.id)} title="删除">
              <Trash2 size={14} color="#f87171" />
            </button>
          </div>

          <div className="kv-editor-body">
            <div className="kv-editor-content">
              <textarea
                className="kv-editor-textarea"
                value={editingNote.content}
                onChange={(e) => updateNote(editingNote.id, { content: e.target.value })}
                placeholder={`开始书写你的想法...

使用 [[笔记名]] 创建双向链接
使用 #标签 添加多维度分类`}
              />
            </div>

            <aside className="kv-editor-aside">
              <div className="kv-aside-section">
                <h4>分类</h4>
                <select
                  className="kv-btn"
                  style={{ width: '100%' }}
                  value={editingNote.category}
                  onChange={(e) => updateNote(editingNote.id, { category: e.target.value })}
                >
                  {DEFAULT_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="kv-aside-section">
                <h4>反向链接 ({editingNote.links.length})</h4>
                {editingNote.links.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--kv-text-muted)' }}>暂无关联</div>
                ) : (
                  <div className="kv-link-list">
                    {editingNote.links.map(id => {
                      const linked = notesWithLinks.find(n => n.id === id)
                      if (!linked) return null
                      return (
                        <div key={id} className="kv-link-item" onClick={() => navigateToNote(linked.title)}>
                          <Link2 size={12} />
                          <span>{linked.title}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="kv-aside-section">
                <h4>提到的笔记</h4>
                {(() => {
                  const mentions = editingNote.content.match(/\[\[([^\]]+)\]\]/g) || []
                  const unique = Array.from(new Set(mentions.map(m => m.slice(2, -2).trim())))
                  if (unique.length === 0) {
                    return <div style={{ fontSize: 12, color: 'var(--kv-text-muted)' }}>用 [[笔记名]] 引用</div>
                  }
                  return (
                    <div className="kv-link-list">
                      {unique.map((title, i) => {
                        const exists = notesWithLinks.find(n => n.title === title)
                        return (
                          <div
                            key={i}
                            className="kv-link-item"
                            style={{ opacity: exists ? 1 : 0.6 }}
                            onClick={() => exists && navigateToNote(title)}
                          >
                            <FileText size={12} />
                            <span>{title}</span>
                            {!exists && <span style={{ color: 'var(--kv-rose)', marginLeft: 4, fontSize: 10 }}>未找到</span>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {editingNote.tags.length > 0 && (
                <div className="kv-aside-section">
                  <h4>标签</h4>
                  <div className="kv-related">
                    {editingNote.tags.map(tag => (
                      <span key={tag} className="kv-related-tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="kv-aside-section">
                <h4>统计</h4>
                <div style={{ fontSize: 12, color: 'var(--kv-text-dim)', lineHeight: 1.7 }}>
                  <div>字数：{editingNote.content.length}</div>
                  <div>创建：{new Date(editingNote.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="kv-root">
      <header className="kv-header">
        <div className="kv-brand">
          <div className="kv-logo">
            <BookOpen size={20} color="#0d0f0a" strokeWidth={2.5} />
          </div>
          <div className="kv-title">
            <h1>Knowledge Vine</h1>
            <small>第二大脑 · 知识藤蔓</small>
          </div>
        </div>

        <div className="kv-search">
          <Search size={14} />
          <input
            placeholder="搜索笔记、标签、内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="kv-header-actions">
          <button className="kv-icon-btn" onClick={exportData} title="导出数据">
            <Save size={14} />
          </button>
          <button className="kv-btn primary" onClick={() => createNote(activeCategory === 'all' ? 'concept' : activeCategory)}>
            <Plus size={12} /> 新笔记
          </button>
        </div>
      </header>

      <div className="kv-body">
        <aside className="kv-sidebar">
          <div className="kv-section">
            <h3 className="kv-section-title">分类</h3>
            <div className="kv-cat-list">
              {DEFAULT_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className={`kv-cat ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="kv-cat-dot" style={{ background: cat.color }} />
                  <span style={{ flex: 1 }}>{cat.name}</span>
                  <span className="kv-cat-count">{categoryCounts[cat.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="kv-section">
              <h3 className="kv-section-title">标签云</h3>
              <div className="kv-related">
                {allTags.slice(0, 30).map(tag => (
                  <span
                    key={tag}
                    className="kv-related-tag"
                    onClick={() => setSearchQuery(tag)}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="kv-section" style={{ flex: 1 }}>
            <h3 className="kv-section-title">统计</h3>
            <div style={{ fontSize: 12, color: 'var(--kv-text-dim)', lineHeight: 1.8 }}>
              <div>📚 总笔记：{notesWithLinks.length}</div>
              <div>🔗 双向链接：{notesWithLinks.reduce((sum, n) => sum + n.links.length, 0)}</div>
              <div>🏷️ 标签数：{allTags.length}</div>
            </div>
          </div>
        </aside>

        <main className="kv-main">
          <div className="kv-toolbar">
            <div className="kv-toolbar-left">
              <span>{filteredNotes.length} 张笔记</span>
            </div>

            <div className="kv-view-toggle">
              <button
                className={`kv-view-btn ${view === 'grid' ? 'active' : ''}`}
                onClick={() => setView('grid')}
              >
                <LayoutGrid size={12} /> 卡片
              </button>
              <button
                className={`kv-view-btn ${view === 'graph' ? 'active' : ''}`}
                onClick={() => setView('graph')}
              >
                <Network size={12} /> 图谱
              </button>
            </div>
          </div>

          {view === 'graph' ? (
            <GraphView notes={notesWithLinks} onSelect={setEditingId} />
          ) : filteredNotes.length === 0 ? (
            <div className="kv-empty">
              <BookOpen size={48} color="var(--kv-text-muted)" />
              <h2>这里还很安静</h2>
              <p>
                {searchQuery ? '没有找到匹配的笔记，试试其他关键词' : '创建你的第一张笔记，开始构建知识网络'}
              </p>
              <button className="kv-btn primary" onClick={() => createNote()}>
                <Plus size={12} /> 创建笔记
              </button>
              {!searchQuery && (
                <div className="kv-empty-stats">
                  <div>
                    <div className="kv-empty-stat-num">{notesWithLinks.length}</div>
                    <div className="kv-empty-stat-label">已有笔记</div>
                  </div>
                  <div>
                    <div className="kv-empty-stat-num">{allTags.length}</div>
                    <div className="kv-empty-stat-label">不同标签</div>
                  </div>
                  <div>
                    <div className="kv-empty-stat-num">{notesWithLinks.reduce((s, n) => s + n.links.length, 0)}</div>
                    <div className="kv-empty-stat-label">建立的连接</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="kv-grid">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="kv-card"
                  onClick={() => setEditingId(note.id)}
                >
                  <div className="kv-card-title">{note.title}</div>
                  <div className="kv-card-content">{stripMarkdown(note.content).slice(0, 200)}</div>
                  <div className="kv-card-footer">
                    <span className="kv-card-tag" style={{
                      color: DEFAULT_CATEGORIES.find(c => c.id === note.category)?.color,
                    }}>
                      {DEFAULT_CATEGORIES.find(c => c.id === note.category)?.name || '未分类'}
                    </span>
                    {note.links.length > 0 && (
                      <span className="kv-card-tag kv-card-link">
                        <Link2 size={9} /> {note.links.length}
                      </span>
                    )}
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="kv-card-tag">#{tag}</span>
                    ))}
                    <span style={{ marginLeft: 'auto' }}>{formatRelative(note.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className={`kv-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  )
})

function GraphView({ notes, onSelect }: { notes: Note[]; onSelect: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map())
  const draggedRef = useRef<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize positions for new notes only
    const existingIds = new Set(Array.from(positionsRef.current.keys()))
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3
    notes.forEach((n, i) => {
      if (!existingIds.has(n.id)) {
        const angle = (i / Math.max(notes.length, 1)) * Math.PI * 2
        positionsRef.current.set(n.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        })
      }
    })
    // Remove deleted
    const currentIds = new Set(notes.map(n => n.id))
    for (const id of Array.from(positionsRef.current.keys())) {
      if (!currentIds.has(id)) positionsRef.current.delete(id)
    }

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      ctx.fillStyle = 'rgba(13, 15, 10, 0.95)'
      ctx.fillRect(0, 0, w, h)

      const positions = positionsRef.current

      // Repulsion between nodes
      for (let i = 0; i < notes.length; i++) {
        const a = notes[i]
        const pa = positions.get(a.id)
        if (!pa) continue
        for (let j = i + 1; j < notes.length; j++) {
          const b = notes[j]
          const pb = positions.get(b.id)
          if (!pb) continue
          const dx = pb.x - pa.x
          const dy = pb.y - pa.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 8000 / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          pa.vx += fx
          pa.vy += fy
          pb.vx -= fx
          pb.vy -= fy
        }
      }

      // Center attraction
      for (const [, p] of positions) {
        const dx = w / 2 - p.x
        const dy = h / 2 - p.y
        p.vx += dx * 0.001
        p.vy += dy * 0.001
      }

      // Apply
      for (const [id, p] of positions) {
        if (id === draggedRef.current) continue
        p.vx *= 0.85
        p.vy *= 0.85
        p.x += p.vx
        p.y += p.vy
        p.x = Math.max(50, Math.min(w - 50, p.x))
        p.y = Math.max(50, Math.min(h - 50, p.y))
      }

      // Draw links
      for (const n of notes) {
        const pa = positions.get(n.id)
        if (!pa) continue
        for (const linkedId of n.links) {
          const pb = positions.get(linkedId)
          if (!pb) continue
          const isHovered = hovered === n.id || hovered === linkedId
          ctx.strokeStyle = isHovered ? 'rgba(74, 222, 128, 0.6)' : 'rgba(74, 222, 128, 0.15)'
          ctx.lineWidth = isHovered ? 2 : 1
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.stroke()
        }
      }

      // Draw nodes
      for (const n of notes) {
        const p = positions.get(n.id)
        if (!p) continue
        const cat = DEFAULT_CATEGORIES.find(c => c.id === n.category)
        const color = cat?.color || '#4ade80'
        const isHovered = hovered === n.id
        const radius = isHovered ? 10 : 7

        if (isHovered) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30)
          grad.addColorStop(0, color + '40')
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, 30, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = isHovered ? '#f0ebd8' : 'rgba(240, 235, 216, 0.7)'
        ctx.font = `${isHovered ? '13' : '11'}px 'Geist', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const title = n.title.length > 18 ? n.title.slice(0, 16) + '..' : n.title
        ctx.fillText(title, p.x, p.y + radius + 4)
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [notes, hovered])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const [id, p] of positionsRef.current) {
      const dx = p.x - mx
      const dy = p.y - my
      if (dx * dx + dy * dy < 100) {
        draggedRef.current = id
        dragOffsetRef.current = { x: dx, y: dy }
        break
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    if (draggedRef.current) {
      const p = positionsRef.current.get(draggedRef.current)
      if (p) {
        p.x = mx + dragOffsetRef.current.x
        p.y = my + dragOffsetRef.current.y
      }
    } else {
      let found: string | null = null
      for (const [id, p] of positionsRef.current) {
        const dx = p.x - mx
        const dy = p.y - my
        if (dx * dx + dy * dy < 100) {
          found = id
          break
        }
      }
      setHovered(found)
    }
  }

  const handleMouseUp = () => {
    if (draggedRef.current) {
      draggedRef.current = null
    } else if (hovered) {
      onSelect(hovered)
    }
  }

  return (
    <div className="kv-graph" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { draggedRef.current = null; setHovered(null) }}
        style={{ cursor: hovered ? 'pointer' : 'grab' }}
      />
      <div className="kv-graph-hint">
        <strong>知识图谱</strong>
        节点颜色 = 分类<br />
        连线 = 双向链接<br />
        拖动节点 · 点击打开
      </div>
    </div>
  )
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}天前`
  return new Date(ts).toLocaleDateString()
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/#([\u4e00-\u9fa5a-zA-Z0-9_\-]+)/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s+/gm, '')
}

export default KnowledgeVine
