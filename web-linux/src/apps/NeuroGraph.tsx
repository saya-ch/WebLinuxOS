import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Search, Plus, Trash2, Star, Hash, Link2, Network, ChevronLeft,
  FileText, Edit3, Eye, X, Sparkles,
  Clock, BookOpen, ArrowRight, Shuffle, Download, Upload,
} from 'lucide-react'

/**
 * NeuroGraph 神经笔记
 * --------------------------------------------------------------
 *  双向链接 + 知识图谱可视化的本地笔记应用。
 *
 *  设计目标：
 *  1. 以 [[双向链接]] 模式串联离散笔记，复用 Roam / Obsidian 的核心工作流
 *  2. 力导向画布展示知识图谱，节点即笔记，连线即链接
 *  3. 反向链接面板、标签、全文搜索、每日回顾四件套齐备
 *  4. 100% 本地存储，无网络依赖，导入导出 JSON
 *
 *  关键交互：
 *  - 输入 `[[` 弹出笔记选择器（自动补全已有标题或一键新建）
 *  - 图谱节点支持拖拽、悬停高亮关联、单击定位笔记
 *  - 命令面板（Ctrl/Cmd+K）即时跳转
 *
 *  视觉：暗色 OLED 友好 + 琥珀色主调 + 翡翠色高亮，Fraunces 标题
 */

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  links: string[]   // 显式 [[title]] 目标
  backlinks: string[] // 反向链接（派生）
  createdAt: number
  updatedAt: number
  starred?: boolean
}

const STORAGE_KEY = 'weblinux-neurograph-v1'

const SAMPLE_NOTES: Note[] = [
  {
    id: 'n-welcome',
    title: '欢迎使用 NeuroGraph',
    content:
      '# 欢迎来到 NeuroGraph\n\n这是一个**双向链接**笔记应用——你的每条笔记都可以通过 `[[另一条笔记]]` 互相串联。\n\n## 试一试\n\n1. 在编辑区输入 `[[知识图谱]]`，会自动建立链接\n2. 切到「图谱」视图看节点关系\n3. 用 `Ctrl/⌘+K` 打开命令面板快速跳转\n4. 点击右上角 ⭐ 收藏重要笔记\n\n## 相关条目\n\n- [[知识图谱]]\n- [[Markdown 速查]]\n- [[每日回顾]]\n\n> "我们通过链接思考，而非通过集合思考。" —— 维基的遗产',
    tags: ['入门', '指南'],
    links: ['知识图谱', 'Markdown 速查', '每日回顾'],
    backlinks: [],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000,
    starred: true,
  },
  {
    id: 'n-graph',
    title: '知识图谱',
    content:
      '# 知识图谱\n\n知识图谱（Knowledge Graph）是一种**语义网络**——节点表示实体，边表示关系。\n\n在 NeuroGraph 中：\n- **节点** = 一条笔记\n- **边** = 笔记之间的 `[[链接]]`\n\n## 实践建议\n\n- 短笔记 + 大量链接 > 长篇孤立笔记\n- 每天 5 分钟回顾 [[每日回顾]] 中的随机条目\n- 用 [[标签]] 体系作为第二维度索引\n\n参见 [[Zettelkasten 卡片盒]] 工作流。',
    tags: ['方法论'],
    links: ['每日回顾', '标签', 'Zettelkasten 卡片盒'],
    backlinks: [],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 'n-markdown',
    title: 'Markdown 速查',
    content:
      '# Markdown 速查\n\n| 语法 | 效果 |\n|---|---|\n| `**粗体**` | **粗体** |\n| `*斜体*` | *斜体* |\n| `` `code` `` | `code` |\n| `# H1` `# H2` | 标题 |\n| `> 引用` | 引用块 |\n| `- 列表` | 无序列表 |\n| `1. 列表` | 有序列表 |\n\n## 代码块\n\n```ts\nconst hello = (name: string) => console.log(`Hi ${name}`)\nhello("NeuroGraph")\n```\n\n配合 [[知识图谱]] 中的双向链接，形成完整工作流。',
    tags: ['参考'],
    links: ['知识图谱'],
    backlinks: [],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'n-daily',
    title: '每日回顾',
    content:
      '# 每日回顾 (Daily Review)\n\n每天 5 分钟，从笔记库中**随机抽取 3 条**旧笔记重读，强化记忆。\n\n## 流程\n\n1. 打开「随机漫步」按钮（编辑器右上）\n2. 给 1 条笔记写一段 50 字以内的复盘\n3. 把它链接到今天的 [[日志]]\n\n## 原理\n\n- **主动回忆** 比被动重读更有效\n- 间隔重复对抗遗忘曲线\n- 与 [[Zettelkasten 卡片盒]] 兼容',
    tags: ['习惯', '方法论'],
    links: ['日志', 'Zettelkasten 卡片盒'],
    backlinks: [],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: 'n-zettel',
    title: 'Zettelkasten 卡片盒',
    content:
      '# Zettelkasten 卡片盒\n\n德国社会学家 Niklas Luhmann 用这套方法写出 70+ 本书。\n\n## 卡片类型\n\n- **闪念卡 (Fleeting)**：随手记录\n- **文献卡 (Literature)**：摘录与评论\n- **永久卡 (Permanent)**：原子化、自洽、可链接\n\n## 规则\n\n1. 一卡一概念\n2. 用自己的话重写\n3. 强制链接至少 1 条已有笔记\n\n延伸阅读：[[知识图谱]] / [[每日回顾]]',
    tags: ['方法论'],
    links: ['知识图谱', '每日回顾'],
    backlinks: [],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'n-tags',
    title: '标签',
    content:
      '# 标签体系\n\n## 建议\n\n- **小写、中文混用**：避免 `#Tag` 与 `#tag` 重复\n- **不超过 7 个一级标签**：认知负担\n- **层级用 `/`**：例如 `#方法论/Zettelkasten`\n\n## 在 NeuroGraph 中\n\n编辑器左下角输入 `#tag` 即可打标签。\n\n配合 [[知识图谱]]，标签让图谱更易切片。',
    tags: ['方法论', '参考'],
    links: ['知识图谱'],
    backlinks: [],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'n-journal',
    title: '日志',
    content:
      '# 日志\n\n每日 1 条日志是 [[每日回顾]] 的落点。\n\n模板：\n\n```\n## YYYY-MM-DD\n\n**今天最重要**\n- \n\n**学到**\n- \n\n**明日**\n- \n```\n\n回链到任何相关笔记，例如 [[Zettelkasten 卡片盒]] 的灵感。',
    tags: ['习惯'],
    links: ['每日回顾', 'Zettelkasten 卡片盒'],
    backlinks: [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000 * 2,
  },
]

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_NOTES
    const arr = JSON.parse(raw) as Note[]
    if (!Array.isArray(arr) || arr.length === 0) return SAMPLE_NOTES
    return arr
  } catch {
    return SAMPLE_NOTES
  }
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    /* noop */
  }
}

// 抽取 [[Title]] 链接
const LINK_RE = /\[\[([^\]\n]+?)\]\]/g
const TAG_RE = /(?<![\w/])#([\p{L}\p{N}_/-]+)/gu

function extractLinks(content: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  LINK_RE.lastIndex = 0
  while ((m = LINK_RE.exec(content)) !== null) {
    const t = m[1].trim()
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

function extractTags(content: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  TAG_RE.lastIndex = 0
  while ((m = TAG_RE.exec(content)) !== null) {
    const t = m[1].trim()
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}秒前`
  if (s < 3600) return `${Math.floor(s / 60)}分钟前`
  if (s < 86400) return `${Math.floor(s / 3600)}小时前`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}天前`
  if (s < 86400 * 365) return `${Math.floor(s / 86400 / 30)}个月前`
  return `${Math.floor(s / 86400 / 365)}年前`
}

// 极简 Markdown 渲染（粗体/斜体/代码/标题/列表/链接/代码块）
function renderMarkdown(input: string, notes: Note[]): string {
  let html = input
    // 转义
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // 代码块
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="ng-pre"><code>${code}</code></pre>`)
  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, '<code class="ng-code">$1</code>')
  // 标题
  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
  // 双向链接 [[Title]]
  html = html.replace(/\[\[([^\]\n]+?)\]\]/g, (_, title) => {
    const t = title.trim()
    const exists = notes.some((n) => n.title === t)
    return `<a class="ng-wikilink ${exists ? 'ng-wikilink-exists' : 'ng-wikilink-new'}" data-wikilink="${t.replace(/"/g, '&quot;')}">${t}</a>`
  })
  // 标签
  html = html.replace(/(?<![\w/])#([\p{L}\p{N}_/-]+)/gu, '<span class="ng-tag">#$1</span>')
  // 引用
  html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
  // 粗体 斜体
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  // 表格 (简化版)
  html = html.replace(/((?:\|.*\n)+)/g, (block) => {
    const rows = block.trim().split('\n')
    if (rows.length < 2) return block
    const isSep = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(rows[1])
    if (!isSep) return block
    const head = rows[0].split('|').map((c) => c.trim()).filter(Boolean)
    const body = rows.slice(2).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean))
    return (
      '<table class="ng-table"><thead><tr>' +
      head.map((h) => `<th>${h}</th>`).join('') +
      '</tr></thead><tbody>' +
      body.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') +
      '</tbody></table>'
    )
  })
  // 列表
  html = html.replace(/(^|\n)((?:- .*(?:\n|$))+)/g, (_, pre, block) => {
    const items = block.trim().split('\n').map((l: string) => `<li>${l.replace(/^- /, '')}</li>`).join('')
    return `${pre}<ul>${items}</ul>`
  })
  html = html.replace(/(^|\n)((?:\d+\. .*(?:\n|$))+)/g, (_, pre, block) => {
    const items = block.trim().split('\n').map((l: string) => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')
    return `${pre}<ol>${items}</ol>`
  })
  // 段落
  html = html.split(/\n{2,}/).map((p) => {
    if (/^<(h\d|ul|ol|pre|blockquote|table)/.test(p.trim())) return p
    if (!p.trim()) return ''
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`
  }).join('\n')
  return html
}

// ─────────────────────────────────────────────────────────────────────────────
// 知识图谱（力导向）
// ─────────────────────────────────────────────────────────────────────────────
interface GraphNode {
  id: string
  title: string
  x: number
  y: number
  vx: number
  vy: number
  degree: number
  pinned?: boolean
  hovered?: boolean
}

interface GraphEdge {
  from: string
  to: string
}

function buildGraph(notes: Note[]): { nodes: GraphNode[]; edges: GraphEdge[]; adj: Record<string, string[]> } {
  const titleToId = new Map<string, string>()
  notes.forEach((n) => titleToId.set(n.title, n.id))
  const edges: GraphEdge[] = []
  const adj: Record<string, string[]> = {}
  notes.forEach((n) => {
    adj[n.id] = adj[n.id] || []
  })
  notes.forEach((n) => {
    n.links.forEach((t) => {
      const targetId = titleToId.get(t)
      if (targetId && targetId !== n.id) {
        edges.push({ from: n.id, to: targetId })
        adj[n.id].push(targetId)
        adj[targetId] = adj[targetId] || []
        adj[targetId].push(n.id)
      }
    })
  })
  // 反向链接（[[B]] 出现在 A 中 → B 反向链接到 A）也建立双向连接
  notes.forEach((n) => {
    n.backlinks.forEach((t) => {
      const targetId = titleToId.get(t)
      if (targetId && targetId !== n.id) {
        edges.push({ from: targetId, to: n.id })
        adj[n.id].push(targetId)
        adj[targetId] = adj[targetId] || []
        adj[targetId].push(n.id)
      }
    })
  })
  const seen = new Set<string>()
  const uniqEdges = edges.filter((e) => {
    const k = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const degree: Record<string, number> = {}
  uniqEdges.forEach((e) => {
    degree[e.from] = (degree[e.from] || 0) + 1
    degree[e.to] = (degree[e.to] || 0) + 1
  })
  const nodes: GraphNode[] = notes.map((n, i) => ({
    id: n.id,
    title: n.title,
    x: 360 + Math.cos((i / notes.length) * Math.PI * 2) * 180,
    y: 260 + Math.sin((i / notes.length) * Math.PI * 2) * 160,
    vx: 0,
    vy: 0,
    degree: degree[n.id] || 0,
  }))
  return { nodes, edges: uniqEdges, adj }
}

function stepForceLayout(nodes: GraphNode[], edges: GraphEdge[], iters: number) {
  const REPULSE = 4500
  const SPRING = 0.04
  const SPRING_LEN = 110
  const DAMP = 0.82
  const CENTER_PULL = 0.005
  for (let step = 0; step < iters; step++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      if (a.pinned) continue
      a.vx += (360 - a.x) * CENTER_PULL
      a.vy += (260 - a.y) * CENTER_PULL
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d2 = dx * dx + dy * dy + 0.01
        if (d2 > 90000) continue
        const f = REPULSE / d2
        a.vx += (dx / Math.sqrt(d2)) * f
        a.vy += (dy / Math.sqrt(d2)) * f
      }
    }
    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.from)
      const b = nodes.find((n) => n.id === e.to)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01
      const f = (d - SPRING_LEN) * SPRING
      const fx = (dx / d) * f
      const fy = (dy / d) * f
      if (!a.pinned) { a.vx += fx; a.vy += fy }
      if (!b.pinned) { b.vx -= fx; b.vy -= fy }
    }
    for (const n of nodes) {
      if (n.pinned) continue
      n.vx *= DAMP
      n.vy *= DAMP
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(40, Math.min(680, n.x))
      n.y = Math.max(40, Math.min(500, n.y))
    }
  }
}

function NoteList({
  notes, activeId, onSelect, onCreate, onDelete, onToggleStar, query, onQuery,
}: {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onToggleStar: (id: string) => void
  query: string
  onQuery: (q: string) => void
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notes
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [notes, query])
  return (
    <div className="ng-list">
      <div className="ng-list-header">
        <button className="ng-btn-primary" onClick={onCreate}>
          <Plus size={14} /> 新建笔记
        </button>
      </div>
      <div className="ng-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜索标题 / 内容 / 标签…"
        />
      </div>
      <div className="ng-list-scroll">
        {filtered.length === 0 && (
          <div className="ng-empty">
            <FileText size={28} />
            <div>没有匹配的笔记</div>
          </div>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`ng-list-item ${activeId === n.id ? 'ng-list-item-active' : ''}`}
            onClick={() => onSelect(n.id)}
          >
            <div className="ng-list-item-title">
              <span className="ng-list-item-text">{n.title}</span>
              <button
                className={`ng-icon-btn ${n.starred ? 'ng-star-on' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleStar(n.id) }}
                title={n.starred ? '取消收藏' : '收藏'}
              >
                <Star size={12} fill={n.starred ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="ng-list-item-meta">
              <span><Clock size={10} /> {timeAgo(n.updatedAt)}</span>
              {n.tags.length > 0 && (
                <span className="ng-list-item-tags">
                  {n.tags.slice(0, 2).map((t) => <span key={t} className="ng-mini-tag">#{t}</span>)}
                  {n.tags.length > 2 && <span className="ng-mini-tag">+{n.tags.length - 2}</span>}
                </span>
              )}
            </div>
            <button
              className="ng-icon-btn ng-list-item-del"
              onClick={(e) => { e.stopPropagation(); if (confirm(`删除笔记「${n.title}」？`)) onDelete(n.id) }}
              title="删除笔记"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function GraphView({
  notes, activeId, onSelect,
}: {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const [dragging, setDragging] = useState<string | null>(null)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { nodes, edges, adj } = useMemo(() => buildGraph(notes), [notes])

  useEffect(() => {
    stepForceLayout(nodes, edges, 220)
    setTick((t) => t + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.length, notes.map((n) => n.id + n.links.join()).join('|')])

  const isHighlighted = useCallback((id: string) => {
    if (!hoverId && !activeId) return false
    const focus = hoverId || activeId
    if (!focus) return false
    if (id === focus) return true
    return (adj[focus] || []).includes(id)
  }, [hoverId, activeId, adj])

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const n = nodes.find((x) => x.id === id)
    if (!n) return
    setDragging(id)
    const node = e.currentTarget as SVGElement
    const pt = node.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - pt.left, y: e.clientY - pt.top }
    n.pinned = true
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const n = nodes.find((x) => x.id === dragging)
    if (!n) return
    n.x = e.clientX - rect.left - dragOffset.current.x
    n.y = e.clientY - rect.top - dragOffset.current.y
    setTick((t) => t + 1)
  }

  const handleMouseUp = () => {
    if (dragging) {
      const n = nodes.find((x) => x.id === dragging)
      if (n) n.pinned = false
      setDragging(null)
    }
  }

  return (
    <div
      className="ng-graph"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg viewBox="0 0 720 540" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="ng-node-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="ng-node-active" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        {/* 边 */}
        <g className="ng-edges">
          {edges.map((e, i) => {
            const a = nodes.find((n) => n.id === e.from)
            const b = nodes.find((n) => n.id === e.to)
            if (!a || !b) return null
            const hl = isHighlighted(e.from) && isHighlighted(e.to)
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={hl ? '#fbbf24' : '#3f3f5a'}
                strokeWidth={hl ? 1.6 : 0.8}
                strokeOpacity={hoverId || activeId ? (hl ? 0.95 : 0.15) : 0.55}
              />
            )
          })}
        </g>
        {/* 节点 */}
        <g className="ng-nodes">
          {nodes.map((n) => {
            const r = 8 + Math.min(12, n.degree * 2.5)
            const isActive = n.id === activeId
            const hl = isHighlighted(n.id)
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, n.id)}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId((h) => (h === n.id ? null : h))}
                onClick={() => onSelect(n.id)}
              >
                <circle
                  r={r + 4}
                  fill="none"
                  stroke={hl ? '#fbbf24' : 'transparent'}
                  strokeWidth={1.5}
                  opacity={hl ? 0.6 : 0}
                />
                <circle
                  r={r}
                  fill={isActive ? 'url(#ng-node-active)' : 'url(#ng-node-grad)'}
                  stroke="#1a1a2e"
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  y={r + 14}
                  fontSize={11}
                  fill={hl ? '#fde68a' : '#cbd5e1'}
                  style={{ pointerEvents: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {n.title.length > 14 ? n.title.slice(0, 13) + '…' : n.title}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="ng-graph-legend">
        <span><span className="ng-dot ng-dot-active" /> 当前</span>
        <span><span className="ng-dot" /> 普通</span>
        <span><span className="ng-dot ng-dot-star" /> 收藏</span>
        <span className="ng-hint">拖拽节点 · 单击定位</span>
      </div>
    </div>
  )
}

function LinkPicker({
  open, candidates, position, onPick, onCreateNew, onClose,
}: {
  open: boolean
  candidates: Note[]
  position: { x: number; y: number } | null
  onPick: (title: string) => void
  onCreateNew: (title: string) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState('')
  useEffect(() => { if (open) setFilter('') }, [open])
  if (!open || !position) return null
  const filtered = candidates.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase())).slice(0, 8)
  return (
    <div className="ng-picker" style={{ left: position.x, top: position.y }}>
      <div className="ng-picker-head">
        <input
          autoFocus
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜索笔记或新建…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (filtered[0]) onPick(filtered[0].title)
              else if (filter.trim()) onCreateNew(filter.trim())
              onClose()
            } else if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
        <button className="ng-icon-btn" onClick={onClose}><X size={12} /></button>
      </div>
      <div className="ng-picker-list">
        {filtered.map((c) => (
          <button key={c.id} className="ng-picker-item" onClick={() => { onPick(c.title); onClose() }}>
            <FileText size={12} />
            <span>{c.title}</span>
            <span className="ng-picker-meta">{c.tags[0] ? `#${c.tags[0]}` : '笔记'}</span>
          </button>
        ))}
        {filter.trim() && !candidates.some((c) => c.title === filter.trim()) && (
          <button className="ng-picker-item ng-picker-new" onClick={() => { onCreateNew(filter.trim()); onClose() }}>
            <Plus size={12} />
            <span>新建「{filter.trim()}」</span>
            <span className="ng-picker-meta">新笔记</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function NeuroGraph() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [activeId, setActiveId] = useState<string | null>(() => notes[0]?.id || null)
  const [mode, setMode] = useState<'edit' | 'preview' | 'graph'>('edit')
  const [query, setQuery] = useState('')
  const [picker, setPicker] = useState<{ open: boolean; x: number; y: number; prefix: string }>({ open: false, x: 0, y: 0, prefix: '' })
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // 重建链接 / 反向链接 / 标签
  const processed = useMemo(() => {
    const titleToId = new Map<string, string>()
    notes.forEach((n) => titleToId.set(n.title, n.id))
    const result: Note[] = notes.map((n) => ({
      ...n,
      links: extractLinks(n.content),
      tags: extractTags(n.content),
    }))
    // 反向链接
    const backlinkMap: Record<string, Set<string>> = {}
    result.forEach((n) => {
      n.links.forEach((t) => {
        const target = titleToId.get(t)
        if (target && target !== n.id) {
          backlinkMap[target] = backlinkMap[target] || new Set()
          backlinkMap[target].add(n.title)
        }
      })
    })
    return result.map((n) => ({ ...n, backlinks: Array.from(backlinkMap[n.id] || new Set()) }))
  }, [notes])

  useEffect(() => { saveNotes(notes) }, [notes])

  const active = useMemo(() => processed.find((n) => n.id === activeId) || null, [processed, activeId])

  const updateActive = useCallback((patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n)))
  }, [activeId])

  const createNote = useCallback((title?: string) => {
    const t = title || `未命名笔记 ${notes.length + 1}`
    if (processed.some((n) => n.title === t)) {
      const exist = processed.find((n) => n.title === t)
      if (exist) setActiveId(exist.id)
      return
    }
    const newNote: Note = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: t,
      content: `# ${t}\n\n开始书写…\n\n相关：[[]]`,
      tags: [],
      links: [],
      backlinks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveId(newNote.id)
  }, [notes.length, processed])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      if (id === activeId) setActiveId(next[0]?.id || null)
      return next
    })
  }, [activeId])

  const toggleStar = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n)))
  }, [])

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(processed, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neurograph-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [processed])

  const importJSON = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const arr = JSON.parse(String(reader.result)) as Note[]
          if (Array.isArray(arr) && arr.every((n) => n.title && typeof n.content === 'string')) {
            setNotes(arr)
            setActiveId(arr[0]?.id || null)
          } else {
            alert('文件格式不正确')
          }
        } catch {
          alert('JSON 解析失败')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const randomWalk = useCallback(() => {
    if (processed.length === 0) return
    const pick = processed[Math.floor(Math.random() * processed.length)]
    setActiveId(pick.id)
  }, [processed])

  // 编辑器：检测 [[ 输入，弹出链接选择器
  const handleEditorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    updateActive({ content: value })
    const ta = e.target
    const pos = ta.selectionStart
    const before = value.slice(0, pos)
    const m = before.match(/\[\[([^\]\n]*)$/)
    if (m) {
      const prefix = m[1]
      // 计算屏幕坐标
      const coords = getCaretCoordinates(ta, pos)
      const rect = ta.getBoundingClientRect()
      const parentRect = ta.closest('.ng-editor')?.getBoundingClientRect() || rect
      setPicker({
        open: true,
        prefix,
        x: rect.left - parentRect.left + coords.left,
        y: rect.top - parentRect.top + coords.top + 18,
      })
    } else {
      setPicker((p) => (p.open ? { ...p, open: false } : p))
    }
  }, [updateActive])

  // 链接选择器：插入
  const insertLink = useCallback((title: string) => {
    const ta = editorRef.current
    if (!ta || !active) return
    const value = ta.value
    const pos = ta.selectionStart
    const before = value.slice(0, pos)
    const after = value.slice(pos)
    const m = before.match(/\[\[([^\]\n]*)$/)
    if (!m) return
    const newBefore = before.slice(0, m.index) + `[[${title}]]`
    const newValue = newBefore + after
    updateActive({ content: newValue })
    requestAnimationFrame(() => {
      ta.focus()
      const newPos = newBefore.length
      ta.setSelectionRange(newPos, newPos)
    })
  }, [active, updateActive])

  const createAndLink = useCallback((title: string) => {
    createNote(title)
    requestAnimationFrame(() => {
      insertLink(title)
    })
  }, [createNote, insertLink])

  // 命令面板
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        if (isInput) {
          e.preventDefault()
          setPaletteOpen(true)
        } else {
          e.preventDefault()
          setPaletteOpen(true)
        }
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 预览点击双向链接 → 跳转
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const link = t.closest('.ng-wikilink') as HTMLElement | null
      if (link) {
        e.preventDefault()
        const title = link.dataset.wikilink || ''
        if (!title) return
        const target = processed.find((n) => n.title === title)
        if (target) setActiveId(target.id)
        else createNote(title)
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [processed, createNote])

  const paletteMatches = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    const list = q
      ? processed.filter((n) => n.title.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)))
      : processed
    return list.slice(0, 10)
  }, [paletteQuery, processed])

  return (
    <div className={`ng-root ${sidebarOpen ? '' : 'ng-sidebar-closed'}`}>
      <aside className="ng-sidebar">
        <div className="ng-sidebar-head">
          <div className="ng-brand">
            <Network size={16} />
            <span>NeuroGraph</span>
            <span className="ng-brand-sub">神经笔记</span>
          </div>
          <button className="ng-icon-btn" onClick={() => setSidebarOpen((v) => !v)} title="折叠侧边栏">
            <ChevronLeft size={14} />
          </button>
        </div>
        <NoteList
          notes={processed}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={() => createNote()}
          onDelete={deleteNote}
          onToggleStar={toggleStar}
          query={query}
          onQuery={setQuery}
        />
        <div className="ng-sidebar-foot">
          <button className="ng-btn-ghost" onClick={exportJSON} title="导出 JSON">
            <Download size={12} /> 导出
          </button>
          <button className="ng-btn-ghost" onClick={importJSON} title="导入 JSON">
            <Upload size={12} /> 导入
          </button>
        </div>
      </aside>

      <main className="ng-main">
        <header className="ng-toolbar">
          <div className="ng-toolbar-left">
            {!sidebarOpen && (
              <button className="ng-icon-btn" onClick={() => setSidebarOpen(true)} title="展开侧边栏">
                <BookOpen size={14} />
              </button>
            )}
            <div className="ng-mode-tabs">
              <button
                className={mode === 'edit' ? 'ng-tab ng-tab-active' : 'ng-tab'}
                onClick={() => setMode('edit')}
              >
                <Edit3 size={12} /> 编辑
              </button>
              <button
                className={mode === 'preview' ? 'ng-tab ng-tab-active' : 'ng-tab'}
                onClick={() => setMode('preview')}
              >
                <Eye size={12} /> 预览
              </button>
              <button
                className={mode === 'graph' ? 'ng-tab ng-tab-active' : 'ng-tab'}
                onClick={() => setMode('graph')}
              >
                <Network size={12} /> 图谱
              </button>
            </div>
          </div>
          <div className="ng-toolbar-right">
            <button className="ng-btn-ghost" onClick={randomWalk} title="随机漫步">
              <Shuffle size={12} /> 随机
            </button>
            <button className="ng-btn-ghost" onClick={() => setPaletteOpen(true)} title="命令面板 (Ctrl/⌘+K)">
              <Search size={12} /> 搜索 <span className="ng-kbd">⌘K</span>
            </button>
            <button
              className={`ng-icon-btn ${active?.starred ? 'ng-star-on' : ''}`}
              onClick={() => active && toggleStar(active.id)}
              title="收藏"
            >
              <Star size={14} fill={active?.starred ? 'currentColor' : 'none'} />
            </button>
          </div>
        </header>

        {active ? (
          <div className="ng-workspace">
            {mode !== 'graph' && (
              <div className="ng-title-row">
                <input
                  className="ng-title-input"
                  value={active.title}
                  onChange={(e) => updateActive({ title: e.target.value })}
                  placeholder="笔记标题…"
                />
                <span className="ng-meta">
                  <Clock size={11} /> 更新于 {timeAgo(active.updatedAt)}
                </span>
              </div>
            )}

            {mode === 'edit' && (
              <div className="ng-editor-wrap">
                <div className="ng-editor">
                  <textarea
                    ref={editorRef}
                    value={active.content}
                    onChange={handleEditorChange}
                    placeholder="开始书写…使用 [[ 链接到其他笔记"
                    spellCheck={false}
                  />
                  <LinkPicker
                    open={picker.open}
                    candidates={processed}
                    position={{ x: picker.x, y: picker.y }}
                    onPick={insertLink}
                    onCreateNew={createAndLink}
                    onClose={() => setPicker((p) => ({ ...p, open: false }))}
                  />
                </div>
                <div className="ng-editor-foot">
                  <span>字数 {active.content.length} · 字符 {active.content.replace(/\s/g, '').length}</span>
                  <span>输入 <code>[[</code> 弹出链接选择器</span>
                </div>
              </div>
            )}

            {mode === 'preview' && (
              <div className="ng-preview" ref={previewRef} dangerouslySetInnerHTML={{ __html: renderMarkdown(active.content, processed) }} />
            )}

            {mode === 'graph' && (
              <GraphView notes={processed} activeId={activeId} onSelect={setActiveId} />
            )}

            {mode !== 'graph' && (
              <aside className="ng-backlinks">
                <div className="ng-backlinks-head">
                  <Link2 size={12} /> 反向链接
                </div>
                {active.backlinks.length === 0 ? (
                  <div className="ng-backlinks-empty">尚无其他笔记链接到此条目</div>
                ) : (
                  <div className="ng-backlinks-list">
                    {active.backlinks.map((t) => {
                      const target = processed.find((n) => n.title === t)
                      if (!target) return null
                      return (
                        <button key={target.id} className="ng-backlink" onClick={() => setActiveId(target.id)}>
                          <ArrowRight size={11} />
                          <span>{target.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="ng-backlinks-head">
                  <Hash size={12} /> 标签
                </div>
                {active.tags.length === 0 ? (
                  <div className="ng-backlinks-empty">在正文中用 <code>#tag</code> 打标签</div>
                ) : (
                  <div className="ng-tags-row">
                    {active.tags.map((t) => (
                      <span key={t} className="ng-tag-chip">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="ng-backlinks-head">
                  <Sparkles size={12} /> 出链
                </div>
                {active.links.length === 0 ? (
                  <div className="ng-backlinks-empty">在正文中用 <code>[[标题]]</code> 创建链接</div>
                ) : (
                  <div className="ng-backlinks-list">
                    {active.links.map((t) => (
                      <button
                        key={t}
                        className="ng-backlink"
                        onClick={() => {
                          const target = processed.find((n) => n.title === t)
                          if (target) setActiveId(target.id)
                          else createNote(t)
                        }}
                      >
                        <FileText size={11} />
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                )}
              </aside>
            )}
          </div>
        ) : (
          <div className="ng-empty ng-empty-large">
            <Network size={48} strokeWidth={1.2} />
            <h3>选择或创建一条笔记开始</h3>
            <button className="ng-btn-primary" onClick={() => createNote()}>
              <Plus size={14} /> 新建第一条笔记
            </button>
          </div>
        )}
      </main>

      {paletteOpen && (
        <div className="ng-palette-mask" onClick={() => setPaletteOpen(false)}>
          <div className="ng-palette" onClick={(e) => e.stopPropagation()}>
            <div className="ng-palette-head">
              <Search size={14} />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="跳转到笔记 / 标签…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && paletteMatches[0]) {
                    setActiveId(paletteMatches[0].id)
                    setPaletteOpen(false)
                    setPaletteQuery('')
                  }
                }}
              />
              <span className="ng-kbd">ESC</span>
            </div>
            <div className="ng-palette-body">
              {paletteMatches.length === 0 ? (
                <div className="ng-palette-empty">没有匹配的笔记</div>
              ) : (
                paletteMatches.map((n, i) => (
                  <button
                    key={n.id}
                    className={`ng-palette-item ${i === 0 ? 'ng-palette-item-first' : ''}`}
                    onClick={() => { setActiveId(n.id); setPaletteOpen(false); setPaletteQuery('') }}
                  >
                    <FileText size={14} />
                    <div className="ng-palette-item-main">
                      <div className="ng-palette-item-title">{n.title}</div>
                      <div className="ng-palette-item-meta">
                        {n.tags.slice(0, 3).map((t) => <span key={t}>#{t}</span>)}
                        {n.backlinks.length > 0 && <span>↩ {n.backlinks.length}</span>}
                      </div>
                    </div>
                    {n.starred && <Star size={12} fill="currentColor" className="ng-star-on" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{STYLES}</style>
    </div>
  )
}

// 简易光标坐标（基于 textarea 镜像 div）
function getCaretCoordinates(textarea: HTMLTextAreaElement, position: number) {
  const div = document.createElement('div')
  const style = getComputedStyle(textarea)
  const props = [
    'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust',
    'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration',
    'letterSpacing', 'wordSpacing', 'whiteSpace', 'wordBreak', 'wordWrap',
  ] as const
  const cs = window.getComputedStyle(textarea)
  props.forEach((p) => { (div.style as unknown as Record<string, string>)[p] = cs.getPropertyValue(p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)) })
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  const before = textarea.value.substring(0, position)
  const span = document.createElement('span')
  span.textContent = ''
  div.textContent = before
  div.appendChild(span)
  document.body.appendChild(div)
  const coords = { left: span.offsetLeft, top: span.offsetTop - textarea.scrollTop }
  document.body.removeChild(div)
  // 防止 lint 警告
  void style
  return coords
}

const STYLES = `
.ng-root {
  display: flex;
  height: 100%;
  background: linear-gradient(180deg, #0a0a0f 0%, #0d0d18 100%);
  color: #e2e8f0;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;
  font-size: 14px;
  overflow: hidden;
  position: relative;
}
.ng-root * { box-sizing: border-box; }
.ng-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: rgba(15, 15, 25, 0.6);
  border-right: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.ng-root.ng-sidebar-closed .ng-sidebar { width: 0; overflow: hidden; }
.ng-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ng-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Fraunces', 'Plus Jakarta Sans', serif;
  font-weight: 700;
  font-size: 16px;
  color: #fde68a;
  letter-spacing: -0.01em;
}
.ng-brand-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
}
.ng-list { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.ng-list-header { padding: 12px 14px 8px; }
.ng-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 8px; cursor: pointer;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #1a1a2e; border: none; font-weight: 600; font-size: 12px;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  transition: all 0.2s;
}
.ng-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4); }
.ng-btn-ghost {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 9px; border-radius: 6px; cursor: pointer;
  background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.08);
  font-size: 11px; font-family: inherit; font-weight: 500;
  transition: all 0.2s;
}
.ng-btn-ghost:hover { color: #fbbf24; border-color: rgba(251, 191, 36, 0.4); }
.ng-search {
  display: flex; align-items: center; gap: 6px;
  margin: 0 14px 8px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 7px;
  color: #64748b;
}
.ng-search input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #e2e8f0; font-size: 12px; font-family: inherit;
}
.ng-search input::placeholder { color: #475569; }
.ng-list-scroll { flex: 1; overflow-y: auto; padding: 0 8px 12px; }
.ng-list-scroll::-webkit-scrollbar { width: 6px; }
.ng-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.ng-list-item {
  position: relative;
  padding: 10px 10px 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.ng-list-item:hover { background: rgba(255,255,255,0.03); }
.ng-list-item-active {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%);
  border-color: rgba(251, 191, 36, 0.3);
}
.ng-list-item-title {
  display: flex; align-items: center; gap: 6px; justify-content: space-between;
}
.ng-list-item-text {
  font-weight: 600; font-size: 13px; color: #f1f5f9;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}
.ng-list-item-meta {
  display: flex; align-items: center; gap: 8px;
  margin-top: 4px; font-size: 10px; color: #64748b;
  font-family: 'JetBrains Mono', monospace;
}
.ng-list-item-meta span { display: inline-flex; align-items: center; gap: 3px; }
.ng-list-item-tags { display: inline-flex; gap: 4px; }
.ng-mini-tag {
  padding: 1px 5px; background: rgba(139, 92, 246, 0.12); color: #c4b5fd;
  border-radius: 3px; font-size: 9px;
}
.ng-list-item-del { position: absolute; right: 8px; top: 8px; opacity: 0; }
.ng-list-item:hover .ng-list-item-del { opacity: 1; }
.ng-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: #64748b; padding: 4px; border-radius: 4px;
  transition: all 0.15s;
}
.ng-icon-btn:hover { color: #fbbf24; background: rgba(255,255,255,0.05); }
.ng-star-on { color: #fbbf24; }
.ng-sidebar-foot {
  display: flex; gap: 6px; padding: 10px 14px; border-top: 1px solid rgba(255,255,255,0.04);
}
.ng-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.ng-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(10, 10, 18, 0.4);
  backdrop-filter: blur(8px);
}
.ng-toolbar-left, .ng-toolbar-right { display: flex; align-items: center; gap: 6px; }
.ng-mode-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); padding: 3px; border-radius: 8px; }
.ng-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border: none; background: transparent;
  color: #94a3b8; font-size: 12px; cursor: pointer; border-radius: 6px;
  font-family: inherit; font-weight: 500; transition: all 0.15s;
}
.ng-tab:hover { color: #cbd5e1; }
.ng-tab-active {
  background: rgba(251, 191, 36, 0.15);
  color: #fde68a;
  box-shadow: 0 1px 0 rgba(255,255,255,0.05);
}
.ng-kbd {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  padding: 1px 5px; background: rgba(255,255,255,0.06); color: #94a3b8;
  border-radius: 3px; margin-left: 4px;
}
.ng-workspace { flex: 1; display: grid; grid-template-columns: 1fr 240px; gap: 0; min-height: 0; overflow: hidden; }
.ng-root:not(.ng-sidebar-closed) .ng-workspace { grid-template-columns: 1fr 240px; }
.ng-workspace > .ng-graph { grid-column: 1 / -1; }
.ng-title-row {
  display: flex; align-items: baseline; gap: 12px;
  padding: 20px 28px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ng-title-input {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: 'Fraunces', 'Noto Serif SC', serif;
  font-size: 28px; font-weight: 700; color: #fde68a;
  letter-spacing: -0.01em;
}
.ng-title-input::placeholder { color: #475569; }
.ng-meta {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}
.ng-editor-wrap {
  display: flex; flex-direction: column;
  flex: 1; min-height: 0;
}
.ng-editor {
  flex: 1; position: relative; min-height: 0;
  padding: 16px 28px;
}
.ng-editor textarea {
  width: 100%; height: 100%;
  background: transparent; border: none; outline: none; resize: none;
  color: #e2e8f0; font-size: 14.5px; line-height: 1.75;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.ng-editor-foot {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 28px; font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', monospace;
  border-top: 1px solid rgba(255,255,255,0.04);
}
.ng-editor-foot code {
  background: rgba(251, 191, 36, 0.1); color: #fde68a;
  padding: 1px 5px; border-radius: 3px; font-size: 10px;
}
.ng-preview {
  flex: 1; overflow-y: auto;
  padding: 24px 32px;
  line-height: 1.8; color: #e2e8f0;
  font-size: 14.5px;
}
.ng-preview h1 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: #fde68a; margin: 8px 0 16px; letter-spacing: -0.01em; }
.ng-preview h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: #fde68a; margin: 24px 0 12px; }
.ng-preview h3 { font-size: 18px; font-weight: 600; color: #fcd34d; margin: 20px 0 10px; }
.ng-preview h4 { font-size: 15px; font-weight: 600; color: #fde68a; margin: 16px 0 8px; }
.ng-preview p { margin: 10px 0; }
.ng-preview ul, .ng-preview ol { margin: 10px 0; padding-left: 24px; }
.ng-preview li { margin: 4px 0; }
.ng-preview blockquote {
  border-left: 3px solid #fbbf24;
  padding: 6px 14px;
  margin: 12px 0;
  background: rgba(251, 191, 36, 0.04);
  color: #cbd5e1;
  font-style: italic;
  border-radius: 0 6px 6px 0;
}
.ng-preview code.ng-code {
  background: rgba(255,255,255,0.06);
  color: #fcd34d;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}
.ng-preview pre.ng-pre {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  font-size: 13px;
}
.ng-preview pre.ng-pre code {
  font-family: 'JetBrains Mono', monospace;
  color: #e2e8f0;
  line-height: 1.6;
}
.ng-preview .ng-wikilink {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid rgba(16, 185, 129, 0.2);
  cursor: pointer;
  transition: all 0.15s;
}
.ng-preview .ng-wikilink:hover {
  background: rgba(16, 185, 129, 0.22);
  color: #a7f3d0;
  border-color: rgba(16, 185, 129, 0.4);
}
.ng-preview .ng-wikilink-new {
  background: rgba(139, 92, 246, 0.1);
  color: #c4b5fd;
  border-color: rgba(139, 92, 246, 0.2);
  border-style: dashed;
}
.ng-preview .ng-tag {
  display: inline-block;
  padding: 1px 6px;
  background: rgba(139, 92, 246, 0.1);
  color: #c4b5fd;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', monospace;
}
.ng-preview table.ng-table {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
  font-size: 13px;
}
.ng-preview table.ng-table th, .ng-preview table.ng-table td {
  border: 1px solid rgba(255,255,255,0.08);
  padding: 6px 10px;
  text-align: left;
}
.ng-preview table.ng-table th {
  background: rgba(255,255,255,0.04);
  color: #fde68a;
  font-weight: 600;
}
.ng-preview strong { color: #fde68a; font-weight: 700; }
.ng-preview em { color: #c4b5fd; }
.ng-backlinks {
  border-left: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  padding: 16px 18px;
  overflow-y: auto;
  font-size: 12px;
}
.ng-backlinks-head {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: #94a3b8; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin: 12px 0 8px;
}
.ng-backlinks-head:first-child { margin-top: 0; }
.ng-backlinks-empty { color: #475569; font-size: 11px; padding: 4px 0 8px; }
.ng-backlinks-empty code {
  background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px; color: #cbd5e1;
}
.ng-backlinks-list { display: flex; flex-direction: column; gap: 4px; }
.ng-backlink {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px; border-radius: 5px; cursor: pointer;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  color: #cbd5e1; font-size: 11.5px; text-align: left;
  font-family: inherit; transition: all 0.15s;
}
.ng-backlink:hover { background: rgba(251, 191, 36, 0.1); color: #fde68a; border-color: rgba(251, 191, 36, 0.2); }
.ng-tags-row { display: flex; flex-wrap: wrap; gap: 4px; }
.ng-tag-chip {
  padding: 2px 8px; background: rgba(139, 92, 246, 0.1); color: #c4b5fd;
  border-radius: 4px; font-size: 10.5px; font-family: 'JetBrains Mono', monospace;
}
.ng-picker {
  position: absolute;
  z-index: 100;
  min-width: 260px;
  max-width: 320px;
  background: rgba(20, 20, 30, 0.98);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  backdrop-filter: blur(12px);
  overflow: hidden;
  animation: ngFadeIn 0.15s ease-out;
}
@keyframes ngFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.ng-picker-head { display: flex; align-items: center; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.ng-picker-head input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #e2e8f0; font-size: 12px; padding: 4px; font-family: inherit;
}
.ng-picker-list { max-height: 240px; overflow-y: auto; padding: 4px; }
.ng-picker-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 6px 10px; border: none; background: transparent; cursor: pointer;
  color: #cbd5e1; font-size: 12px; border-radius: 5px;
  font-family: inherit; text-align: left;
  transition: background 0.1s;
}
.ng-picker-item:hover { background: rgba(251, 191, 36, 0.1); color: #fde68a; }
.ng-picker-item span:first-of-type { flex: 1; }
.ng-picker-meta { color: #64748b; font-size: 10px; }
.ng-picker-new { color: #c4b5fd; }
.ng-graph {
  flex: 1; min-height: 0; position: relative;
  background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
}
.ng-edges { transition: all 0.3s; }
.ng-graph-legend {
  position: absolute; bottom: 12px; left: 12px;
  display: flex; align-items: center; gap: 14px;
  padding: 8px 14px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  font-size: 11px; color: #94a3b8;
  backdrop-filter: blur(8px);
}
.ng-graph-legend span { display: inline-flex; align-items: center; gap: 4px; }
.ng-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #d97706);
}
.ng-dot-active { background: linear-gradient(135deg, #34d399, #059669); }
.ng-dot-star { background: linear-gradient(135deg, #f472b6, #ec4899); }
.ng-hint { color: #475569; }
.ng-empty { padding: 32px 16px; text-align: center; color: #64748b; font-size: 12px; }
.ng-empty-large { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 20px; }
.ng-empty-large h3 { color: #cbd5e1; font-size: 16px; font-weight: 500; }
.ng-palette-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 12vh;
  animation: ngFadeIn 0.15s ease-out;
}
.ng-palette {
  width: 560px; max-width: 90%;
  background: rgba(15, 15, 25, 0.98);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  overflow: hidden;
}
.ng-palette-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  color: #64748b;
}
.ng-palette-head input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #fde68a; font-size: 16px; font-family: inherit;
}
.ng-palette-head input::placeholder { color: #475569; }
.ng-palette-body { max-height: 50vh; overflow-y: auto; padding: 6px; }
.ng-palette-empty { padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
.ng-palette-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 12px; border: none; background: transparent; cursor: pointer;
  color: #cbd5e1; font-size: 13px; border-radius: 6px;
  font-family: inherit; text-align: left;
  transition: background 0.1s;
}
.ng-palette-item:hover, .ng-palette-item-first { background: rgba(251, 191, 36, 0.08); }
.ng-palette-item-main { flex: 1; min-width: 0; }
.ng-palette-item-title { font-weight: 500; color: #f1f5f9; }
.ng-palette-item-meta {
  font-size: 10.5px; color: #64748b; font-family: 'JetBrains Mono', monospace;
  display: flex; gap: 8px; margin-top: 2px;
}
`
