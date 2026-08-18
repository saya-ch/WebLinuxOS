import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  folder: string
  createdAt: string
  updatedAt: string
  starred: boolean
  pinned: boolean
  deletedAt?: string
  template?: string
}

interface Folder {
  id: string
  name: string
  icon: string
}

interface Template {
  id: string
  name: string
  icon: string
  content: string
}

type ViewMode = 'edit' | 'preview' | 'graph'

// ─── Constants ───────────────────────────────────────────────────────────────

const ST_NOTES = 'snp-notes-v2'
const ST_FOLDERS = 'snp-folders-v2'
const ST_TRASH = 'snp-trash-v2'

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'work', name: '工作', icon: '💼' },
  { id: 'personal', name: '个人', icon: '👤' },
  { id: 'ideas', name: '创意', icon: '💡' },
  { id: 'learning', name: '学习', icon: '📚' },
  { id: 'journal', name: '日记', icon: '📓' },
]

const TEMPLATES: Template[] = [
  { id: 'meeting', name: '会议笔记', icon: '🤝', content: `# 会议笔记\n\n**日期：** \n**参与者：** \n**主题：** \n\n## 议程\n1. \n2. \n3. \n\n## 决议\n- \n\n## 后续行动\n- [ ] \n- [ ] ` },
  { id: 'daily', name: '每日日志', icon: '📅', content: `# 每日日志\n\n**日期：** ${new Date().toLocaleDateString('zh-CN')}\n\n## 今日目标\n- [ ] \n\n## 笔记\n\n\n## 今日感悟\n\n\n## 明日计划\n- ` },
  { id: 'code', name: '代码片段', icon: '💻', content: `# 代码片段\n\n**语言：** \n**用途：** \n\n\`\`\`\n// 在此输入代码\n\`\`\`\n\n## 说明\n\n\n## 相关链接\n- ` },
  { id: 'project', name: '项目计划', icon: '📊', content: `# 项目计划\n\n**项目名称：** \n**开始日期：** \n**目标日期：** \n\n## 目标\n1. \n\n## 阶段\n### 第一阶段\n- [ ] \n\n### 第二阶段\n- [ ] \n\n## 风险\n- \n\n## 备注\n` },
  { id: 'reading', name: '阅读笔记', icon: '📖', content: `# 阅读笔记\n\n**书名：** \n**作者：** \n**页数：** \n\n## 摘要\n\n\n## 关键观点\n1. \n2. \n3. \n\n## 个人思考\n\n\n## 引用\n> ` },
]

// ─── Markdown Renderer ──────────────────────────────────────────────────────

function renderMarkdown(text: string, _onWikiLink?: (name: string) => void): string {
  if (!text) return ''
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:8px;padding:12px 16px;overflow-x:auto;margin:12px 0;font-size:13px;"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(16,185,129,0.1);padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#10b981;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;margin:20px 0 10px;color:#10b981;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:24px 0 12px;color:#e0e0e0;">$1</h1>')
    // Bold & Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Checkboxes
    .replace(/^- \[x\] (.+)$/gm, '<div style="margin:4px 0;">☑ $1</div>')
    .replace(/^- \[ \] (.+)$/gm, '<div style="margin:4px 0;">☐ $1</div>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<div style="margin:2px 0;padding-left:16px;">• $1</div>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #10b981;padding-left:12px;margin:8px 0;color:#8892b0;">$1</blockquote>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#6366f1;text-decoration:underline;">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />')
    // Wiki links [[NoteName]]
    .replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
      return `<span class="wiki-link" data-name="${name}" style="color:#6366f1;cursor:pointer;background:rgba(99,102,241,0.1);padding:1px 6px;border-radius:4px;text-decoration:none;">${name}</span>`
    })
    // Paragraphs (newlines)
    .replace(/\n\n/g, '</p><p style="margin:8px 0;">')
    .replace(/\n/g, '<br/>')

  return `<div style="line-height:1.7;font-size:14px;"><p style="margin:8px 0;">${html}</p></div>`
}

function extractWikiLinks(text: string): string[] {
  const re = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) links.push(m[1])
  return links
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const c = {
  bg: '#0f0f1a',
  bg2: '#1a1a2e',
  bg3: '#16213e',
  card: 'rgba(26, 26, 46, 0.8)',
  border: 'rgba(255,255,255,0.08)',
  text: '#e0e0e0',
  text2: '#8892b0',
  emerald: '#10b981',
  indigo: '#6366f1',
  gradient: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
  gradient2: 'linear-gradient(135deg, #10b98122 0%, #6366f122 100%)',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SmartNotesPro() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { const s = localStorage.getItem(ST_NOTES); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [folders, setFolders] = useState<Folder[]>(() => {
    try { const s = localStorage.getItem(ST_FOLDERS); return s ? JSON.parse(s) : DEFAULT_FOLDERS } catch { return DEFAULT_FOLDERS }
  })
  const [trash, setTrash] = useState<Note[]>(() => {
    try { const s = localStorage.getItem(ST_TRASH); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('edit')
  const [newTag, setNewTag] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const graphRef = useRef<HTMLCanvasElement>(null)

  // Persist
  useEffect(() => {
    const t = setTimeout(() => { localStorage.setItem(ST_NOTES, JSON.stringify(notes)) }, 300)
    return () => clearTimeout(t)
  }, [notes])
  useEffect(() => { localStorage.setItem(ST_FOLDERS, JSON.stringify(folders)) }, [folders])
  useEffect(() => { localStorage.setItem(ST_TRASH, JSON.stringify(trash)) }, [trash])

  // Keep activeNote in sync
  useEffect(() => {
    if (activeNote) {
      const fresh = notes.find(n => n.id === activeNote.id)
      if (fresh && (fresh.title !== activeNote.title || fresh.content !== activeNote.content || fresh.tags !== activeNote.tags)) {
        setActiveNote(fresh)
      }
    }
  }, [notes, activeNote])

  // CRUD
  const createNote = useCallback((template?: Template) => {
    const n: Note = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: template ? template.name : '新笔记',
      content: template ? template.content : '',
      tags: [],
      folder: activeFolder === 'all' ? 'personal' : activeFolder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      pinned: false,
      template: template?.id,
    }
    setNotes(prev => [n, ...prev])
    setActiveNote(n)
    setViewMode('edit')
  }, [activeFolder])

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
  }, [])

  const softDelete = useCallback((id: string) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    setTrash(prev => [...prev, { ...note, deletedAt: new Date().toISOString() }])
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeNote?.id === id) setActiveNote(null)
  }, [notes, activeNote])

  const restoreNote = useCallback((id: string) => {
    const note = trash.find(n => n.id === id)
    if (!note) return
    const { deletedAt, ...rest } = note
    setNotes(prev => [rest, ...prev])
    setTrash(prev => prev.filter(n => n.id !== id))
  }, [trash])

  const permanentDelete = useCallback((id: string) => {
    setTrash(prev => prev.filter(n => n.id !== id))
  }, [])

  // Tags
  const addTag = useCallback(() => {
    if (!newTag.trim() || !activeNote) return
    const tag = newTag.trim().toLowerCase()
    if (!activeNote.tags.includes(tag)) updateNote(activeNote.id, { tags: [...activeNote.tags, tag] })
    setNewTag('')
  }, [newTag, activeNote, updateNote])

  const removeTag = useCallback((tag: string) => {
    if (!activeNote) return
    updateNote(activeNote.id, { tags: activeNote.tags.filter(t => t !== tag) })
  }, [activeNote, updateNote])

  // Wiki navigation
  const navigateToNote = useCallback((name: string) => {
    const found = notes.find(n => n.title.toLowerCase() === name.toLowerCase() && !n.deletedAt)
    if (found) setActiveNote(found)
  }, [notes])

  // Export
  const exportAsMarkdown = useCallback((note: Note) => {
    const md = `# ${note.title}\n\n${note.tags.length ? '标签: ' + note.tags.map(t => '#' + t).join(' ') + '\n\n' : ''}${note.content}`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${note.title}.md`; a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportAllAsJSON = useCallback(() => {
    const data = JSON.stringify(notes.filter(n => !n.deletedAt), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'smart-notes-export.json'; a.click()
    URL.revokeObjectURL(url)
  }, [notes])

  const exportAllAsMarkdown = useCallback(() => {
    const md = notes.filter(n => !n.deletedAt).map(n => `---\n\n# ${n.title}\n\n${n.content}\n`).join('\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'all-notes.md'; a.click()
    URL.revokeObjectURL(url)
  }, [notes])

  // Filtered notes
  const activeNotes = useMemo(() => {
    return notes.filter(n => !n.deletedAt)
  }, [notes])

  const filteredNotes = useMemo(() => {
    let result = activeNotes
    if (activeFolder !== 'all') result = result.filter(n => n.folder === activeFolder)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.includes(q))
      )
    }
    // Sort: pinned first, then by updatedAt
    return result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [activeNotes, activeFolder, searchQuery])

  // Tag cloud
  const tagCloud = useMemo(() => {
    const counts: Record<string, number> = {}
    activeNotes.forEach(n => n.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20)
  }, [activeNotes])

  // Backlinks
  const backlinks = useMemo(() => {
    if (!activeNote) return []
    return activeNotes.filter(n => n.id !== activeNote.id && extractWikiLinks(n.content).some(l => l.toLowerCase() === activeNote.title.toLowerCase()))
  }, [activeNote, activeNotes])

  // Outgoing wiki links
  const outgoingLinks = useMemo(() => {
    if (!activeNote) return []
    const names = extractWikiLinks(activeNote.content)
    return names.map(name => ({ name, note: activeNotes.find(n => n.title.toLowerCase() === name.toLowerCase()) }))
  }, [activeNote, activeNotes])

  // Word count
  const wordCount = useMemo(() => {
    if (!activeNote) return { chars: 0, words: 0 }
    const text = activeNote.content
    const chars = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    return { chars, words }
  }, [activeNote])

  // Recent notes
  const recentNotes = useMemo(() => {
    return [...activeNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8)
  }, [activeNotes])

  // Note graph
  useEffect(() => {
    if (!showGraph || !graphRef.current) return
    const canvas = graphRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    ctx.clearRect(0, 0, w, h)

    // Build graph
    const nodeMap = new Map<string, { x: number; y: number; title: string; id: string }>()
    const graphNotes = activeNotes.slice(0, 50)
    const cx = w / 2
    const cy = h / 2
    const radius = Math.min(w, h) * 0.35

    graphNotes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / graphNotes.length - Math.PI / 2
      nodeMap.set(n.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        title: n.title,
        id: n.id,
      })
    })

    // Draw edges
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
    ctx.lineWidth = 1
    graphNotes.forEach(n => {
      const links = extractWikiLinks(n.content)
      links.forEach(linkName => {
        const target = graphNotes.find(gn => gn.title.toLowerCase() === linkName.toLowerCase())
        if (target && nodeMap.has(n.id) && nodeMap.has(target.id)) {
          const from = nodeMap.get(n.id)!
          const to = nodeMap.get(target.id)!
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
        }
      })
    })

    // Draw nodes
    nodeMap.forEach((node, id) => {
      const isActive = id === activeNote?.id
      const isPinned = graphNotes.find(n => n.id === id)?.pinned
      const isStarred = graphNotes.find(n => n.id === id)?.starred

      // Glow
      if (isActive) {
        ctx.shadowColor = '#10b981'
        ctx.shadowBlur = 12
      }

      ctx.fillStyle = isActive ? '#10b981' : isStarred ? '#6366f1' : isPinned ? '#f59e0b' : 'rgba(99,102,241,0.6)'
      ctx.beginPath()
      ctx.arc(node.x, node.y, isActive ? 8 : 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      // Label
      ctx.fillStyle = isActive ? '#e0e0e0' : '#8892b0'
      ctx.font = `${isActive ? '12' : '10'}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(node.title.slice(0, 16), node.x, node.y + (isActive ? 18 : 14))
    })
  }, [showGraph, activeNotes, activeNote])

  // Wiki link click handler
  useEffect(() => {
    if (viewMode !== 'preview') return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('wiki-link')) {
        const name = target.getAttribute('data-name')
        if (name) navigateToNote(name)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [viewMode, navigateToNote])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', background: c.bg, color: c.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: 260, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', background: c.bg2, flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: 16, borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>智能笔记</div>
              <div style={{ fontSize: 11, color: c.text2 }}>{activeNotes.length} 条笔记</div>
            </div>
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: c.bg, borderRadius: 6, padding: '6px 10px' }}>
            <span style={{ color: c.text2, fontSize: 13 }}>🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索笔记..." style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text, flex: 1, fontSize: 13 }} />
            {searchQuery && <span onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', color: c.text2, fontSize: 12 }}>✕</span>}
          </div>
        </div>

        {/* Folders */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 11, color: c.text2, marginBottom: 6, fontWeight: 600 }}>文件夹</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {folders.map(f => (
              <button key={f.id} onClick={() => setActiveFolder(f.id)} style={{ padding: '3px 8px', borderRadius: 10, border: 'none', background: activeFolder === f.id ? c.gradient2 : 'transparent', color: activeFolder === f.id ? c.emerald : c.text2, cursor: 'pointer', fontSize: 11, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>{f.icon}</span><span>{f.name}</span>
              </button>
            ))}
            <button onClick={() => setShowNewFolder(true)} style={{ padding: '3px 6px', borderRadius: 10, border: 'none', background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 11 }}>＋</button>
          </div>
        </div>

        {/* Tag Cloud */}
        {tagCloud.length > 0 && (
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 11, color: c.text2, marginBottom: 6, fontWeight: 600 }}>标签</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {tagCloud.map(([tag, count]) => (
                <button key={tag} onClick={() => setSearchQuery(tag)} style={{ padding: '2px 7px', borderRadius: 10, border: 'none', background: 'rgba(99,102,241,0.1)', color: c.indigo, cursor: 'pointer', fontSize: Math.min(10 + count, 14), transition: 'all 0.15s' }}>
                  #{tag}<sup style={{ fontSize: 9, marginLeft: 2 }}>{count}</sup>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Note */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => createNote()} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: c.gradient, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>＋ 新笔记</button>
            <button onClick={() => setShowTemplates(true)} style={{ padding: '8px 10px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 12 }}>📋</button>
          </div>
        </div>

        {/* Note List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 10px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: c.text2, fontSize: 13 }}>
              {activeNotes.length === 0 ? '还没有笔记' : '没有匹配的笔记'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} onClick={() => { setActiveNote(note); setViewMode('edit') }} style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 3, cursor: 'pointer', background: activeNote?.id === note.id ? c.gradient2 : 'transparent', border: `1px solid ${activeNote?.id === note.id ? 'rgba(16,185,129,0.2)' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  {note.pinned && <span style={{ fontSize: 10, color: '#f59e0b' }}>📌</span>}
                  {note.starred && <span style={{ fontSize: 10, color: c.indigo }}>★</span>}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: activeNote?.id === note.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: activeNote?.id === note.id ? c.emerald : c.text }}>{note.title}</span>
                </div>
                <div style={{ fontSize: 11, color: c.text2, display: 'flex', gap: 6 }}>
                  <span>{new Date(note.updatedAt).toLocaleDateString('zh-CN')}</span>
                  {note.tags.length > 0 && <span style={{ opacity: 0.6 }}>#{note.tags[0]}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: 8, borderTop: `1px solid ${c.border}`, display: 'flex', gap: 4 }}>
          <button onClick={() => setShowGraph(true)} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 11 }}>🕸 图谱</button>
          <button onClick={() => setShowTrash(true)} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 11 }}>🗑 回收</button>
          <button onClick={() => setShowExport(true)} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 11 }}>📦 导出</button>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 8, background: c.bg2, flexWrap: 'wrap' }}>
              <select value={activeNote.folder} onChange={e => updateNote(activeNote.id, { folder: e.target.value })} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 12, cursor: 'pointer' }}>
                {folders.filter(f => f.id !== 'all').map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
              </select>
              <button onClick={() => updateNote(activeNote.id, { pinned: !activeNote.pinned })} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: activeNote.pinned ? '#f59e0b' : 'transparent', color: activeNote.pinned ? '#000' : c.text2, cursor: 'pointer', fontSize: 12 }}>{activeNote.pinned ? '📌 已置顶' : '📌 置顶'}</button>
              <button onClick={() => updateNote(activeNote.id, { starred: !activeNote.starred })} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: activeNote.starred ? c.indigo : 'transparent', color: activeNote.starred ? '#fff' : c.text2, cursor: 'pointer', fontSize: 12 }}>{activeNote.starred ? '★ 已收藏' : '☆ 收藏'}</button>
              <div style={{ width: 1, height: 20, background: c.border }} />
              <button onClick={() => setViewMode('edit')} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: viewMode === 'edit' ? c.emerald : 'transparent', color: viewMode === 'edit' ? '#000' : c.text2, cursor: 'pointer', fontSize: 12 }}>✏ 编辑</button>
              <button onClick={() => setViewMode('preview')} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: viewMode === 'preview' ? c.emerald : 'transparent', color: viewMode === 'preview' ? '#000' : c.text2, cursor: 'pointer', fontSize: 12 }}>👁 预览</button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: c.text2 }}>{wordCount.words} 词 · {wordCount.chars} 字</span>
              <button onClick={() => exportAsMarkdown(activeNote)} style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 11 }}>⬇ 导出</button>
              <button onClick={() => softDelete(activeNote.id)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>🗑</button>
            </div>

            {/* Tags bar */}
            <div style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${c.border}` }}>
              <span style={{ fontSize: 11, color: c.text2 }}>🏷</span>
              {activeNote.tags.map(tag => (
                <span key={tag} onClick={() => removeTag(tag)} style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: c.indigo, fontSize: 11, cursor: 'pointer' }}>#{tag} ✕</span>
              ))}
              <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="添加标签..." style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 11, width: 80, outline: 'none' }} />
              {newTag && <button onClick={addTag} style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: c.emerald, color: '#000', cursor: 'pointer', fontSize: 10 }}>＋</button>}
            </div>

            {/* Editor / Preview */}
            <div style={{ flex: 1, overflow: 'auto', padding: viewMode === 'edit' ? 0 : 16 }}>
              {viewMode === 'edit' ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 20px' }}>
                  <input value={activeNote.title} onChange={e => updateNote(activeNote.id, { title: e.target.value })} placeholder="笔记标题..." style={{ fontSize: 22, fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: c.text, marginBottom: 12, width: '100%' }} />
                  <textarea value={activeNote.content} onChange={e => updateNote(activeNote.id, { content: e.target.value })} placeholder="开始写点什么...&#10;&#10;支持 Markdown 语法：&#10;# 标题  **粗体**  *斜体*  `代码`&#10;- 列表  [链接](url)  [[维基链接]]&#10;```代码块```" style={{ flex: 1, resize: 'none', border: `1px solid ${c.border}`, borderRadius: 8, padding: 14, background: c.bg, color: c.text, fontSize: 14, lineHeight: 1.7, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ) : (
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: c.text }}>{activeNote.title}</h1>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(activeNote.content) }} />
                  {/* Outgoing Wiki Links */}
                  {outgoingLinks.length > 0 && (
                    <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: 'rgba(99,102,241,0.05)', border: `1px solid rgba(99,102,241,0.15)` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.indigo, marginBottom: 8 }}>🔗 出站链接</div>
                      {outgoingLinks.map((l, i) => (
                        <div key={i} onClick={() => l.note && navigateToNote(l.note.title)} style={{ padding: '4px 0', cursor: l.note ? 'pointer' : 'default', color: l.note ? c.indigo : c.text2, fontSize: 13 }}>
                          {l.note ? '→ ' : '○ '}{l.name}{l.note ? '' : ' (未创建)'}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Backlinks */}
                  {backlinks.length > 0 && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: `1px solid rgba(16,185,129,0.15)` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.emerald, marginBottom: 8 }}>↩ 反向链接</div>
                      {backlinks.map(bl => (
                        <div key={bl.id} onClick={() => { setActiveNote(bl); setViewMode('preview') }} style={{ padding: '4px 0', cursor: 'pointer', color: c.emerald, fontSize: 13 }}>
                          ← {bl.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 48 }}>📝</div>
            <div style={{ fontSize: 18, color: c.text2 }}>选择或创建一条笔记</div>
            <div style={{ fontSize: 13, color: c.text2, maxWidth: 280, textAlign: 'center', lineHeight: 1.5 }}>
              支持 Markdown、[[维基链接]]、标签、图谱、模板与导出
            </div>
            {/* Recent Notes */}
            {recentNotes.length > 0 && (
              <div style={{ marginTop: 24, width: 280 }}>
                <div style={{ fontSize: 12, color: c.text2, marginBottom: 8, fontWeight: 600 }}>最近编辑</div>
                {recentNotes.map(n => (
                  <div key={n.id} onClick={() => { setActiveNote(n); setViewMode('edit') }} style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 13, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: c.text2 }}>{new Date(n.updatedAt).toLocaleDateString('zh-CN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Templates Modal ── */}
      {showTemplates && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowTemplates(false)}>
          <div style={{ width: 400, borderRadius: 12, background: c.bg2, border: `1px solid ${c.border}`, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>选择模板</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { createNote(t); setShowTemplates(false) }} style={{ padding: '12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setShowTemplates(false)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 13 }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Graph Modal ── */}
      {showGraph && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowGraph(false)}>
          <div style={{ width: '80%', height: '80%', borderRadius: 12, background: c.bg2, border: `1px solid ${c.border}`, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🕸 笔记关系图谱</h3>
              <button onClick={() => setShowGraph(false)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 12 }}>关闭</button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <canvas ref={graphRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: c.text2, display: 'flex', gap: 12 }}>
              <span>🟢 当前笔记</span>
              <span>🟣 收藏笔记</span>
              <span>🟡 置顶笔记</span>
              <span>🔵 普通笔记</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Trash Modal ── */}
      {showTrash && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowTrash(false)}>
          <div style={{ width: 440, maxHeight: '80%', borderRadius: 12, background: c.bg2, border: `1px solid ${c.border}`, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑 回收站 ({trash.length})</h3>
              <button onClick={() => setShowTrash(false)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 12 }}>关闭</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {trash.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: c.text2 }}>回收站为空</div>
              ) : (
                trash.map(n => (
                  <div key={n.id} style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: c.text2 }}>删除于 {n.deletedAt ? new Date(n.deletedAt).toLocaleString('zh-CN') : ''}</div>
                    </div>
                    <button onClick={() => restoreNote(n.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: c.emerald, color: '#000', cursor: 'pointer', fontSize: 11 }}>恢复</button>
                    <button onClick={() => permanentDelete(n.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>永久删除</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExport && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowExport(false)}>
          <div style={{ width: 360, borderRadius: 12, background: c.bg2, border: `1px solid ${c.border}`, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📦 导出笔记</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => { if (activeNote) exportAsMarkdown(activeNote); setShowExport(false) }} disabled={!activeNote} style={{ padding: '12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: 'pointer', textAlign: 'left', opacity: activeNote ? 1 : 0.5 }}>
                <div style={{ fontWeight: 500 }}>📄 导出当前笔记为 Markdown</div>
                <div style={{ fontSize: 11, color: c.text2, marginTop: 2 }}>将当前笔记导出为 .md 文件</div>
              </button>
              <button onClick={() => { exportAllAsMarkdown(); setShowExport(false) }} style={{ padding: '12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 500 }}>📄 导出全部为 Markdown</div>
                <div style={{ fontSize: 11, color: c.text2, marginTop: 2 }}>合并所有笔记为一个 .md 文件</div>
              </button>
              <button onClick={() => { exportAllAsJSON(); setShowExport(false) }} style={{ padding: '12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 500 }}>📋 导出全部为 JSON</div>
                <div style={{ fontSize: 11, color: c.text2, marginTop: 2 }}>完整数据导出，可再导入</div>
              </button>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setShowExport(false)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 13 }}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Folder Modal ── */}
      {showNewFolder && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowNewFolder(false)}>
          <div style={{ width: 320, borderRadius: 12, background: c.bg2, border: `1px solid ${c.border}`, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>新建文件夹</h3>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="文件夹名称" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNewFolder(false)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', fontSize: 13 }}>取消</button>
              <button onClick={() => {
                if (newFolderName.trim()) {
                  setFolders(prev => [...prev, { id: 'f-' + Date.now(), name: newFolderName.trim(), icon: '📁' }])
                  setNewFolderName('')
                  setShowNewFolder(false)
                }
              }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: c.gradient, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
