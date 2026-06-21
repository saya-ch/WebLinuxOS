import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'

// ============================================================
// KnowledgeGarden - 个人知识花园
// 双向链接、标签、全文搜索、关系图谱、Markdown 编辑
// 所有数据通过 localStorage 持久化，支持导入/导出 JSON
// ============================================================

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  links: string[] // 显式 [[id]] 解析后的目标 ID 列表
  backlinks: string[] // 指向本文的 ID 列表（计算）
  createdAt: number
  updatedAt: number
}

interface GardenState {
  notes: Record<string, Note>
  recentlyOpened: string[]
}

const STORAGE_KEY = 'weblinux-knowledge-garden-v1'

// ---- 持久化 ----
const loadState = (): GardenState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedGarden()
    const parsed = JSON.parse(raw)
    if (!parsed.notes) return seedGarden()
    return parsed as GardenState
  } catch {
    return seedGarden()
  }
}

const saveState = (state: GardenState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 容量溢出时静默失败
  }
}

// ---- 内置示例 ----
const seedGarden = (): GardenState => {
  const welcomeId = 'welcome'
  const linuxId = 'linux'
  const desktopId = 'desktop-env'
  const terminalId = 'terminal'
  const pyodideId = 'pyodide'

  const now = Date.now()
  const notes: Record<string, Note> = {
    [welcomeId]: {
      id: welcomeId,
      title: '欢迎来到知识花园',
      tags: ['指南', '入门'],
      content:
        '# 欢迎来到知识花园\n\n这是一个 **个人 Wiki**，受 Obsidian / Roam Research 启发。\n\n## 你可以做什么\n\n- 用 `[[双向链接]]` 串联笔记\n- 用 `#标签` 给笔记打标签\n- 在右栏查看反向链接和关系图\n- 使用顶部搜索框进行全文检索\n- 导入 / 导出 JSON 备份\n\n## 试一试\n\n点击任意一条笔记，或在左侧列表新建一条。试试使用 `[[Linux]]` `[[桌面环境]]` 创建链接。\n\n---\n\n> 提示：双击笔记标题可以重命名，拖拽可移动节点。',
      links: [linuxId, desktopId, terminalId],
      backlinks: [],
      createdAt: now,
      updatedAt: now,
    },
    [linuxId]: {
      id: linuxId,
      title: 'Linux',
      tags: ['操作系统', '内核'],
      content:
        '# Linux\n\nLinux 是一套**自由与开源**的类 Unix 操作系统内核，由 Linus Torvalds 于 1991 年首次发布。\n\n## 特点\n\n- 单内核架构 (Monolithic kernel)\n- POSIX 兼容\n- 强大的命令行工具链\n- 几乎所有发行版都附带 [[终端]]\n\n## 在本项目中的体现\n\nWebLinuxOS 模拟了 Linux 桌面环境 [[桌面环境]]，提供了完整的工作流。',
      links: [terminalId, desktopId],
      backlinks: [welcomeId],
      createdAt: now,
      updatedAt: now,
    },
    [desktopId]: {
      id: desktopId,
      title: '桌面环境',
      tags: ['GUI', '窗口管理'],
      content:
        '# 桌面环境\n\n桌面环境（Desktop Environment, DE）提供图形化用户界面。常见的有 GNOME、KDE、XFCE 等。\n\n## 核心组件\n\n1. 窗口管理器\n2. 面板 / 任务栏\n3. 文件管理器\n4. [[终端]] 模拟器\n\nWebLinuxOS 在浏览器中重新实现了这些组件。',
      links: [terminalId],
      backlinks: [welcomeId, linuxId],
      createdAt: now,
      updatedAt: now,
    },
    [terminalId]: {
      id: terminalId,
      title: '终端',
      tags: ['命令行', 'Shell'],
      content:
        '# 终端\n\n终端（Terminal）是与计算机进行文本交互的程序。\n\n## WebLinuxOS 的终端\n\n本项目内置的 Terminal 支持 200+ 模拟命令，包括 `ls` `cd` `cat` `python` `git` `weather` 等。\n\n也可以通过 [[Pyodide]] 运行真实的 Python 代码。',
      links: [pyodideId],
      backlinks: [welcomeId, linuxId, desktopId],
      createdAt: now,
      updatedAt: now,
    },
    [pyodideId]: {
      id: pyodideId,
      title: 'Pyodide',
      tags: ['Python', 'WebAssembly'],
      content:
        '# Pyodide\n\nPyodide 是把 CPython 解释器编译到 WebAssembly 上的项目，让 Python 可以在浏览器中运行。\n\n## 用法\n\n```python\nimport numpy as np\nprint(np.arange(10).sum())\n```\n\n本项目在 [[终端]] 中集成了 Pyodide。',
      links: [terminalId],
      backlinks: [terminalId],
      createdAt: now,
      updatedAt: now,
    },
  }
  return { notes, recentlyOpened: [welcomeId] }
}

// ---- 工具：双向链接解析 ----
const WIKI_LINK_RE = /\[\[([^\]\n]+?)\]\]/g

const resolveWikiLinks = (
  text: string,
  noteIdToTitle: Map<string, string>,
  titleToId: Map<string, string>
): string[] => {
  const ids = new Set<string>()
  let m: RegExpExecArray | null
  WIKI_LINK_RE.lastIndex = 0
  while ((m = WIKI_LINK_RE.exec(text)) !== null) {
    const target = m[1].trim()
    const direct = titleToId.get(target.toLowerCase())
    if (direct) {
      ids.add(direct)
    } else {
      // 尝试按 ID 查找
      for (const [id, title] of noteIdToTitle) {
        if (title.toLowerCase() === target.toLowerCase()) {
          ids.add(id)
        }
      }
    }
  }
  return Array.from(ids)
}

// ---- 工具：Markdown 极简渲染 ----
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderMarkdown = (
  text: string,
  onOpenLink: (target: string) => void,
  knownTitles: Set<string>
): string => {
  // 转义
  let s = escapeHtml(text)
  // [[wiki]] 链接 - 必须先做（其他规则可能影响它）
  s = s.replace(/\[\[([^\]\n]+?)\]\]/g, (_full, p1) => {
    const target = String(p1).trim()
    const exists = knownTitles.has(target.toLowerCase())
    const cls = exists ? 'kg-link' : 'kg-link kg-link-missing'
    return `<a href="#" class="${cls}" data-link="${escapeHtml(target)}">${escapeHtml(target)}</a>`
  })
  // 标题
  s = s.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
  s = s.replace(/^##### (.*)$/gm, '<h5>$1</h5>')
  s = s.replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  s = s.replace(/^### (.*)$/gm, '<h3>$1</h3>')
  s = s.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  s = s.replace(/^# (.*)$/gm, '<h1>$1</h1>')
  // 分隔线
  s = s.replace(/^---+$/gm, '<hr/>')
  // 引用
  s = s.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
  // 粗体 / 斜体
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  // 行内代码
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  // 代码块
  s = s.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code}</code></pre>`)
  // 无序列表
  s = s.replace(/^- (.*)$/gm, '<li>$1</li>')
  s = s.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  // 段落 / 换行
  s = s
    .split(/\n{2,}/)
    .map((p) => {
      if (/^\s*<(h\d|ul|ol|pre|blockquote|hr)/.test(p)) return p
      if (!p.trim()) return ''
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
  // 抑制未使用的 onOpenLink 警告
  void onOpenLink
  return s
}

// ============================================================
// 主组件
// ============================================================
const KnowledgeGarden = () => {
  const [state, setState] = useState<GardenState>(() => loadState())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const init = loadState()
    return init.recentlyOpened[0] || Object.keys(init.notes)[0] || null
  })
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showGraph, setShowGraph] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // 持久化
  useEffect(() => {
    saveState(state)
  }, [state])

  // 派生索引
  const indexes = useMemo(() => {
    const titleToId = new Map<string, string>()
    const idToTitle = new Map<string, string>()
    for (const n of Object.values(state.notes)) {
      titleToId.set(n.title.toLowerCase(), n.id)
      idToTitle.set(n.id, n.title)
    }
    return { titleToId, idToTitle }
  }, [state.notes])

  // 计算 backlinks
  useEffect(() => {
    setState((prev) => {
      const incoming = new Map<string, Set<string>>()
      for (const n of Object.values(prev.notes)) {
        for (const target of n.links) {
          if (!incoming.has(target)) incoming.set(target, new Set())
          incoming.get(target)!.add(n.id)
        }
      }
      let changed = false
      const next: Record<string, Note> = {}
      for (const [id, n] of Object.entries(prev.notes)) {
        const back = Array.from(incoming.get(id) || [])
        const sortedBack = back.slice().sort()
        if (
          sortedBack.length !== n.backlinks.length ||
          sortedBack.some((b, i) => b !== n.backlinks[i])
        ) {
          next[id] = { ...n, backlinks: sortedBack }
          changed = true
        } else {
          next[id] = n
        }
      }
      return changed ? { ...prev, notes: next } : prev
    })
  }, [state.notes])

  const activeNote = activeId ? state.notes[activeId] : null

  // 全部标签
  const allTags = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of Object.values(state.notes)) {
      for (const t of n.tags) m.set(t, (m.get(t) || 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [state.notes])

  // 过滤后的笔记
  const visibleNotes = useMemo(() => {
    const q = search.trim().toLowerCase()
    return Object.values(state.notes)
      .filter((n) => {
        if (tagFilter && !n.tags.includes(tagFilter)) return false
        if (!q) return true
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.notes, search, tagFilter])

  // 打开笔记
  const openNote = useCallback((id: string) => {
    setActiveId(id)
    setEditing(false)
    setState((prev) => {
      const recent = [id, ...prev.recentlyOpened.filter((x) => x !== id)].slice(0, 8)
      return { ...prev, recentlyOpened: recent }
    })
  }, [])

  // 按标题打开
  const openByTitle = useCallback(
    (title: string) => {
      const id = indexes.titleToId.get(title.toLowerCase())
      if (id) {
        openNote(id)
        return true
      }
      // 自动创建
      createNote(title)
      return true
    },
    [indexes]
  )

  // 创建笔记
  const createNote = useCallback(
    (title?: string) => {
      const id = (title || '新笔记').toLowerCase().replace(/\s+/g, '-').slice(0, 60) + '-' + Date.now().toString(36)
      const note: Note = {
        id,
        title: title || '新笔记',
        content: `# ${title || '新笔记'}\n\n`,
        tags: [],
        links: [],
        backlinks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setState((prev) => ({ ...prev, notes: { ...prev.notes, [id]: note }, recentlyOpened: [id, ...prev.recentlyOpened] }))
      setActiveId(id)
      setEditing(true)
      setEditTitle(note.title)
      setEditContent(note.content)
      setEditTags('')
    },
    []
  )

  // 删除
  const deleteNote = useCallback(
    (id: string) => {
      if (!confirm('确定要删除这条笔记吗？此操作不可撤销。')) return
      setState((prev) => {
        const next = { ...prev.notes }
        delete next[id]
        return {
          ...prev,
          notes: next,
          recentlyOpened: prev.recentlyOpened.filter((x) => x !== id),
        }
      })
      if (activeId === id) {
        const remain = Object.keys(state.notes).filter((k) => k !== id)
        setActiveId(remain[0] || null)
      }
    },
    [activeId, state.notes]
  )

  // 进入编辑
  const startEdit = useCallback(() => {
    if (!activeNote) return
    setEditTitle(activeNote.title)
    setEditContent(activeNote.content)
    setEditTags(activeNote.tags.join(', '))
    setEditing(true)
  }, [activeNote])

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (!activeNote) return
    const tags = editTags
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const titleToId = new Map<string, string>()
    for (const n of Object.values(state.notes)) {
      if (n.id !== activeNote.id) titleToId.set(n.title.toLowerCase(), n.id)
    }
    const idToTitle = new Map<string, string>()
    for (const n of Object.values(state.notes)) idToTitle.set(n.id, n.title)

    const links = resolveWikiLinks(editContent, idToTitle, titleToId)

    setState((prev) => {
      const next = { ...prev.notes }
      next[activeNote.id] = {
        ...activeNote,
        title: editTitle.trim() || activeNote.title,
        content: editContent,
        tags,
        links,
        updatedAt: Date.now(),
      }
      // 同步更新 title 索引（通过 setState 后再次进入会重建索引）
      return { ...prev, notes: next }
    })
    setEditing(false)
  }, [activeNote, editTitle, editContent, editTags, state.notes])

  // 处理点击 [[link]]
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.dataset.link) {
        e.preventDefault()
        openByTitle(target.dataset.link)
      }
    },
    [openByTitle]
  )

  // 导入 / 导出
  const handleExport = useCallback(() => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-garden-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (parsed && typeof parsed === 'object' && parsed.notes) {
          setState(parsed)
          setActiveId(Object.keys(parsed.notes)[0] || null)
        } else {
          alert('无效的备份文件')
        }
      } catch {
        alert('解析失败：不是有效的 JSON')
      }
    }
    reader.readAsText(file)
  }, [])

  // 渲染的标题集合（用于在渲染时标识链接有效性）
  const knownTitles = useMemo(() => {
    const s = new Set<string>()
    for (const n of Object.values(state.notes)) s.add(n.title.toLowerCase())
    return s
  }, [state.notes])

  const renderedContent = useMemo(() => {
    if (!activeNote) return ''
    return renderMarkdown(activeNote.content, openByTitle, knownTitles)
  }, [activeNote, openByTitle, knownTitles])

  return (
    <div
      className="app-container kg-container"
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 280px',
        height: '100%',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
        color: '#e0e0e8',
        fontSize: 14,
      }}
    >
      {/* ===== 左侧栏：笔记列表 ===== */}
      <aside
        style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#e0e0e8',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => createNote()}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '8px',
              background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + 新建笔记
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {visibleNotes.length === 0 ? (
            <div style={{ color: '#888', padding: 16, fontSize: 12, textAlign: 'center' }}>
              {search ? '没有匹配的笔记' : '还没有笔记'}
            </div>
          ) : (
            visibleNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => openNote(n.id)}
                style={{
                  padding: '8px 10px',
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: n.id === activeId ? 'rgba(139,124,240,0.25)' : 'transparent',
                  border: n.id === activeId ? '1px solid rgba(139,124,240,0.4)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: '#fff' }}>
                  {n.title || '（无标题）'}
                </div>
                <div style={{ fontSize: 11, color: '#888', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {n.tags.slice(0, 3).map((t) => (
                    <span key={t} style={{ background: 'rgba(139,124,240,0.2)', padding: '0 6px', borderRadius: 3 }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            type="file"
            accept="application/json"
            id="kg-import"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: '#ccc',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              导出
            </button>
            <button
              onClick={() => document.getElementById('kg-import')?.click()}
              style={{
                flex: 1,
                padding: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: '#ccc',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              导入
            </button>
          </div>
        </div>
      </aside>

      {/* ===== 中间：编辑器 / 阅读视图 ===== */}
      <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="标题"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
                outline: 'none',
              }}
            />
          ) : activeNote ? (
            <h1 style={{ margin: 0, fontSize: 22, color: '#fff', flex: 1 }}>{activeNote.title}</h1>
          ) : (
            <h1 style={{ margin: 0, fontSize: 18, color: '#888' }}>未选择笔记</h1>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {activeNote && !editing && (
              <>
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  style={toolbarBtn}
                >
                  {showGraph ? '隐藏图谱' : '关系图谱'}
                </button>
                <button onClick={startEdit} style={toolbarBtnPrimary}>
                  编辑
                </button>
                <button onClick={() => deleteNote(activeNote.id)} style={{ ...toolbarBtn, color: '#f87171' }}>
                  删除
                </button>
              </>
            )}
            {editing && (
              <>
                <button onClick={() => setEditing(false)} style={toolbarBtn}>
                  取消
                </button>
                <button onClick={saveEdit} style={toolbarBtnPrimary}>
                  保存
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
          {!activeNote ? (
            <div style={{ color: '#666', textAlign: 'center', marginTop: 80 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
              选择一条笔记或创建新的开始记录
            </div>
          ) : editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="标签（用 , 分隔）"
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#e0e0e8',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  minHeight: 380,
                  padding: 12,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#e0e0e8',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: 11, color: '#888' }}>
                支持 Markdown 语法，使用 <code style={codeChip}>[[标题]]</code> 创建双向链接
              </div>
            </div>
          ) : (
            <>
              <div
                ref={contentRef}
                onClick={handleContentClick}
                className="kg-content"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
                style={{ lineHeight: 1.75, fontSize: 15 }}
              />
              {activeNote.tags.length > 0 && (
                <div style={{ marginTop: 24, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {activeNote.tags.map((t) => (
                    <span
                      key={t}
                      onClick={() => setTagFilter(t)}
                      style={{
                        cursor: 'pointer',
                        background: 'rgba(139,124,240,0.15)',
                        border: '1px solid rgba(139,124,240,0.3)',
                        color: '#a29bfe',
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 20, fontSize: 11, color: '#666' }}>
                创建于 {new Date(activeNote.createdAt).toLocaleString()} · 最近更新 {new Date(activeNote.updatedAt).toLocaleString()}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===== 右侧栏：反向链接 / 标签 / 图谱 ===== */}
      <aside
        style={{
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            标签
          </div>
          {allTags.length === 0 ? (
            <div style={{ color: '#666', fontSize: 12 }}>暂无标签</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allTags.map(([t, count]) => (
                <span
                  key={t}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                  style={{
                    cursor: 'pointer',
                    background: tagFilter === t ? 'rgba(139,124,240,0.4)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: tagFilter === t ? '#fff' : '#ccc',
                    padding: '3px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                >
                  #{t} <span style={{ opacity: 0.6 }}>{count}</span>
                </span>
              ))}
            </div>
          )}
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              style={{
                marginTop: 6,
                background: 'transparent',
                border: 'none',
                color: '#8b7cf0',
                fontSize: 11,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              清除筛选
            </button>
          )}
        </div>

        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            反向链接 ({activeNote?.backlinks.length || 0})
          </div>
          {!activeNote || activeNote.backlinks.length === 0 ? (
            <div style={{ color: '#666', fontSize: 12 }}>
              {activeNote ? '还没有其他笔记指向这里' : ''}
            </div>
          ) : (
            activeNote.backlinks.map((id) => {
              const n = state.notes[id]
              if (!n) return null
              return (
                <div
                  key={id}
                  onClick={() => openNote(id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#a29bfe',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,124,240,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {n.title}
                </div>
              )
            })
          )}
        </div>

        <div style={{ padding: 12, flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            出链 ({activeNote?.links.length || 0})
          </div>
          {!activeNote || activeNote.links.length === 0 ? (
            <div style={{ color: '#666', fontSize: 12 }}>{activeNote ? '使用 [[标题]] 创建链接' : ''}</div>
          ) : (
            activeNote.links.map((id) => {
              const n = state.notes[id]
              if (!n) return null
              return (
                <div
                  key={id}
                  onClick={() => openNote(id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#a29bfe',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,124,240,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {n.title}
                </div>
              )
            })
          )}
        </div>

        {showGraph && activeNote && (
          <div style={{ height: 220, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <MiniGraph notes={state.notes} activeId={activeNote.id} onSelect={openNote} />
          </div>
        )}
      </aside>

      <style>{`
        .kg-content h1, .kg-content h2, .kg-content h3 { color: #fff; margin: 0.8em 0 0.4em; font-weight: 700; }
        .kg-content h1 { font-size: 1.8em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; }
        .kg-content h2 { font-size: 1.4em; }
        .kg-content h3 { font-size: 1.2em; color: #c4b5fd; }
        .kg-content p { margin: 0.6em 0; }
        .kg-content code { background: rgba(139,124,240,0.15); padding: 0.1em 0.3em; border-radius: 3px; color: #c4b5fd; font-size: 0.9em; }
        .kg-content pre { background: rgba(0,0,0,0.4); padding: 12px; border-radius: 6px; overflow-x: auto; }
        .kg-content pre code { background: transparent; padding: 0; color: #e0e0e8; }
        .kg-content blockquote { border-left: 3px solid #8b7cf0; padding-left: 12px; color: #a0a0c8; margin: 0.8em 0; }
        .kg-content ul { padding-left: 1.4em; }
        .kg-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.2em 0; }
        .kg-content a.kg-link { color: #a29bfe; text-decoration: none; border-bottom: 1px dashed #8b7cf0; }
        .kg-content a.kg-link:hover { background: rgba(139,124,240,0.2); }
        .kg-content a.kg-link-missing { color: #f87171; border-bottom-color: #f87171; }
      `}</style>
    </div>
  )
}

const toolbarBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: '#ccc',
  fontSize: 12,
  cursor: 'pointer',
}
const toolbarBtnPrimary: React.CSSProperties = {
  ...toolbarBtn,
  background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)',
  border: '1px solid transparent',
  color: '#fff',
  fontWeight: 600,
}
const codeChip: React.CSSProperties = {
  background: 'rgba(139,124,240,0.2)',
  padding: '0 4px',
  borderRadius: 3,
  fontSize: 11,
  color: '#c4b5fd',
}

// ============================================================
// MiniGraph - 简易力导向图（基于 Canvas）
// ============================================================
interface MiniGraphProps {
  notes: Record<string, Note>
  activeId: string
  onSelect: (id: string) => void
}

const MiniGraph = memo(({ notes, activeId, onSelect }: MiniGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    nodes: { id: string; x: number; y: number; vx: number; vy: number }[]
    edges: { a: string; b: string }[]
    dragging: string | null
    dragOffset: { dx: number; dy: number }
    raf: number
  } | null>(null)

  // 初始化 / 重置
  useEffect(() => {
    const list = Object.values(notes)
    const w = canvasRef.current?.parentElement?.clientWidth || 280
    const h = 220
    if (!stateRef.current) {
      stateRef.current = {
        nodes: list.map((n, i) => ({
          id: n.id,
          x: w / 2 + Math.cos((i / list.length) * Math.PI * 2) * 60,
          y: h / 2 + Math.sin((i / list.length) * Math.PI * 2) * 50,
          vx: 0,
          vy: 0,
        })),
        edges: [],
        dragging: null,
        dragOffset: { dx: 0, dy: 0 },
        raf: 0,
      }
    } else {
      // 保留已有节点位置，新增的随机分布
      const existing = new Map(stateRef.current.nodes.map((n) => [n.id, n]))
      stateRef.current.nodes = list.map((n, i) => {
        const e = existing.get(n.id)
        if (e) return e
        return {
          id: n.id,
          x: w / 2 + Math.cos((i / list.length) * Math.PI * 2) * 60,
          y: h / 2 + Math.sin((i / list.length) * Math.PI * 2) * 50,
          vx: 0,
          vy: 0,
        }
      })
    }
    // 重建边
    const edges: { a: string; b: string }[] = []
    for (const n of list) for (const l of n.links) if (notes[l]) edges.push({ a: n.id, b: l })
    stateRef.current.edges = edges
  }, [notes])

  // 模拟循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = stateRef.current
      if (!s) return
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      // 物理：排斥 + 中心吸引
      for (let i = 0; i < s.nodes.length; i++) {
        const a = s.nodes[i]
        for (let j = i + 1; j < s.nodes.length; j++) {
          const b = s.nodes[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.max(10, Math.sqrt(dx * dx + dy * dy))
          const f = 1500 / (d * d)
          const fx = (dx / d) * f
          const fy = (dy / d) * f
          a.vx -= fx * dt
          a.vy -= fy * dt
          b.vx += fx * dt
          b.vy += fy * dt
        }
        // 中心吸引
        a.vx += (w / 2 - a.x) * 0.3 * dt
        a.vy += (h / 2 - a.y) * 0.3 * dt
        a.vx *= 0.85
        a.vy *= 0.85
      }
      // 边的弹簧
      for (const e of s.edges) {
        const a = s.nodes.find((n) => n.id === e.a)
        const b = s.nodes.find((n) => n.id === e.b)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.max(20, Math.sqrt(dx * dx + dy * dy))
        const target = 90
        const f = (d - target) * 0.5
        const fx = (dx / d) * f * dt
        const fy = (dy / d) * f * dt
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
      // 应用速度
      for (const n of s.nodes) {
        if (s.dragging === n.id) continue
        n.x += n.vx
        n.y += n.vy
        n.x = Math.max(10, Math.min(w - 10, n.x))
        n.y = Math.max(10, Math.min(h - 10, n.y))
      }
      // 绘制
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)
      // 边
      ctx.strokeStyle = 'rgba(139,124,240,0.4)'
      ctx.lineWidth = 1
      for (const e of s.edges) {
        const a = s.nodes.find((n) => n.id === e.a)
        const b = s.nodes.find((n) => n.id === e.b)
        if (!a || !b) continue
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      // 节点
      for (const n of s.nodes) {
        const isActive = n.id === activeId
        ctx.beginPath()
        ctx.arc(n.x, n.y, isActive ? 6 : 4, 0, Math.PI * 2)
        ctx.fillStyle = isActive ? '#a29bfe' : 'rgba(255,255,255,0.6)'
        ctx.fill()
        if (isActive) {
          ctx.strokeStyle = 'rgba(162,155,254,0.5)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
      ctx.restore()
      s.raf = requestAnimationFrame(loop)
    }
    const stateOnMount = stateRef.current
    if (stateOnMount) {
      stateOnMount.raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(stateRef.current?.raf || 0)
      window.removeEventListener('resize', resize)
    }
  }, [activeId])

  // 交互
  const onDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const s = stateRef.current
    if (!s) return
    const hit = s.nodes.find((n) => Math.hypot(n.x - x, n.y - y) < 8)
    if (hit) {
      s.dragging = hit.id
      s.dragOffset = { dx: hit.x - x, dy: hit.y - y }
    }
  }
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current
    if (!s || !s.dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const n = s.nodes.find((nn) => nn.id === s.dragging)
    if (n) {
      n.x = e.clientX - rect.left + s.dragOffset.dx
      n.y = e.clientY - rect.top + s.dragOffset.dy
    }
  }
  const onUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current
    if (!s) return
    if (s.dragging) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const moved = s.nodes.find((n) => n.id === s.dragging)
      if (moved && Math.hypot(moved.x - x, moved.y - y) < 3) {
        onSelect(s.dragging)
      }
      s.dragging = null
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ padding: 8, fontSize: 11, color: '#888' }}>关系图谱（可拖拽）</div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'calc(100% - 30px)', display: 'block', cursor: 'grab' }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      />
    </div>
  )
})

export default memo(KnowledgeGarden)
