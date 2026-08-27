import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { marked } from 'marked'
import {
  Plus, Trash2, FolderOpen, Download, Search,
  ChevronRight, ChevronDown, FileText, Copy, Sun, Moon,
  Hash, Type, Clock, Star
} from 'lucide-react'

/**
 * MarkdownNotebook - 智能笔记本
 * 多文档管理 + 分屏 Markdown 编辑/预览 + 实时统计 + HTML 导出
 * 本地持久化存储，支持文件夹分类和收藏
 */

interface Note {
  id: string
  name: string
  content: string
  folder: string
  starred: boolean
  createdAt: string
  updatedAt: string
}

interface Folder {
  id: string
  name: string
  expanded: boolean
}

const STORAGE_KEY = 'markdown-notebook-data'
const FOLDERS_KEY = 'markdown-notebook-folders'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

const MarkdownNotebook = memo(function MarkdownNotebook() {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'default', name: '默认', expanded: true },
    { id: 'work', name: '工作', expanded: true },
    { id: 'personal', name: '个人', expanded: true },
  ])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewMode, setPreviewMode] = useState<'split' | 'preview' | 'edit'>('split')
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId])

  // 加载数据
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY)
      const savedFolders = localStorage.getItem(FOLDERS_KEY)
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes)
        setNotes(parsed)
        if (parsed.length > 0) setActiveNoteId(parsed[0].id)
      }
      if (savedFolders) setFolders(JSON.parse(savedFolders))
    } catch { /* ignore */ }
  }, [])

  // 保存数据
  const saveData = useCallback((newNotes: Note[], newFolders?: Folder[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes))
      if (newFolders) localStorage.setItem(FOLDERS_KEY, JSON.stringify(newFolders))
    } catch { /* ignore */ }
  }, [])

  // 创建新笔记
  const createNote = useCallback((folderId = 'default') => {
    const note: Note = {
      id: `note-${Date.now()}`,
      name: `新笔记 ${notes.length + 1}`,
      content: '',
      folder: folderId,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const newNotes = [note, ...notes]
    setNotes(newNotes)
    setActiveNoteId(note.id)
    saveData(newNotes)
  }, [notes, saveData])

  // 删除笔记
  const deleteNote = useCallback((id: string) => {
    const newNotes = notes.filter(n => n.id !== id)
    setNotes(newNotes)
    if (activeNoteId === id) {
      setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null)
    }
    saveData(newNotes)
  }, [notes, activeNoteId, saveData])

  // 更新笔记内容
  const updateNoteContent = useCallback((content: string) => {
    if (!activeNoteId) return
    const newNotes = notes.map(n =>
      n.id === activeNoteId
        ? { ...n, content, updatedAt: new Date().toISOString() }
        : n
    )
    setNotes(newNotes)
    // 防抖保存
    setTimeout(() => saveData(newNotes), 500)
  }, [activeNoteId, notes, saveData])

  // 重命名笔记
  const renameNote = useCallback((id: string, name: string) => {
    const newNotes = notes.map(n =>
      n.id === id ? { ...n, name, updatedAt: new Date().toISOString() } : n
    )
    setNotes(newNotes)
    saveData(newNotes)
  }, [notes, saveData])

  // 切换收藏
  const toggleStar = useCallback((id: string) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, starred: !n.starred } : n)
    setNotes(newNotes)
    saveData(newNotes)
  }, [notes, saveData])

  // 创建文件夹
  const createFolder = useCallback(() => {
    if (!newFolderName.trim()) return
    const folder: Folder = { id: `folder-${Date.now()}`, name: newFolderName.trim(), expanded: true }
    const newFolders = [...folders, folder]
    setFolders(newFolders)
    setNewFolderName('')
    setShowNewFolder(false)
    saveData(notes, newFolders)
  }, [newFolderName, folders, notes, saveData])

  // 导出 HTML
  const exportHTML = useCallback(() => {
    if (!activeNote) return
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeNote.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
    h1, h2, h3 { color: #1a1a2e; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f8f8f8; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #7c3aed; padding-left: 16px; margin-left: 0; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f4; }
    img { max-width: 100%; }
    a { color: #7c3aed; }
    hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  </style>
</head>
<body>
  ${marked.parse(activeNote.content) as string}
  <footer style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:12px;">
    Exported from MarkdownNotebook · ${new Date().toLocaleDateString('zh-CN')}
  </footer>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.name}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeNote])

  // 复制 Markdown
  const copyMarkdown = useCallback(() => {
    if (activeNote) {
      navigator.clipboard.writeText(activeNote.content).catch(() => {})
    }
  }, [activeNote])

  // 复制 HTML
  const copyHTML = useCallback(() => {
    if (activeNote) {
      navigator.clipboard.writeText(marked.parse(activeNote.content) as string).catch(() => {})
    }
  }, [activeNote])

  // 渲染 Markdown
  const renderedContent = useMemo(() => {
    if (!activeNote) return ''
    try {
      return marked.parse(activeNote.content || '') as string
    } catch {
      return '<p style="color:red">Markdown 解析错误</p>'
    }
  }, [activeNote])

  // 统计信息
  const stats = useMemo(() => {
    if (!activeNote) return { chars: 0, words: 0, lines: 0 }
    const content = activeNote.content || ''
    return {
      chars: content.length,
      words: content.trim() ? content.trim().split(/\s+/).length : 0,
      lines: content.split('\n').length,
    }
  }, [activeNote])

  // 筛选笔记
  const filteredNotes = useMemo(() => {
    let result = notes
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [notes, searchQuery])

  // 按文件夹分组
  const notesByFolder = useMemo(() => {
    const map = new Map<string, Note[]>()
    folders.forEach(f => map.set(f.id, []))
    filteredNotes.forEach(n => {
      const arr = map.get(n.folder) || map.get('default') || []
      arr.push(n)
      map.set(n.folder, arr)
    })
    return map
  }, [filteredNotes, folders])

  const theme = darkMode
    ? { bg: '#0f0f23', sidebar: '#0a0a1a', text: '#e2e8f0', muted: '#94a3b8', border: 'rgba(255,255,255,0.06)', input: '#1a1a3e', accent: '#7c3aed' }
    : { bg: '#ffffff', sidebar: '#f8f9fa', text: '#1e293b', muted: '#64748b', border: '#e2e8f0', input: '#f1f5f9', accent: '#7c3aed' }

  return (
    <div style={{
      height: '100%', display: 'flex', background: theme.bg, color: theme.text,
      fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif", overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0,
        background: theme.sidebar, borderRight: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column', transition: 'all 0.3s',
        overflow: 'hidden'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>笔记</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => createNote()} style={{
              background: theme.accent, border: 'none', color: '#fff', width: 28, height: 28,
              borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={14} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', color: theme.muted,
              width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: theme.input,
            borderRadius: 8, padding: '6px 10px', border: `1px solid ${theme.border}`
          }}>
            <Search size={14} color={theme.muted} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索笔记..."
              style={{
                flex: 1, background: 'none', border: 'none', color: theme.text,
                fontSize: 12, outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Folder tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {folders.map(folder => (
            <div key={folder.id}>
              <div
                onClick={() => {
                  const newFolders = folders.map(f => f.id === folder.id ? { ...f, expanded: !f.expanded } : f)
                  setFolders(newFolders)
                  saveData(notes, newFolders)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                  borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: theme.muted
                }}
              >
                {folder.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <FolderOpen size={14} />
                {folder.name}
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>
                  {notesByFolder.get(folder.id)?.length || 0}
                </span>
              </div>
              {folder.expanded && notesByFolder.get(folder.id)?.map(note => (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 32px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 12,
                    background: activeNoteId === note.id ? `${theme.accent}15` : 'transparent',
                    color: activeNoteId === note.id ? theme.accent : theme.text,
                    borderLeft: activeNoteId === note.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                  }}
                >
                  <FileText size={13} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.name}
                  </span>
                  {note.starred && <Star size={11} fill="#fbbf24" color="#fbbf24" />}
                </div>
              ))}
            </div>
          ))}

          {/* New folder */}
          {showNewFolder ? (
            <div style={{ padding: '4px 8px 4px 20px', display: 'flex', gap: 4 }}>
              <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createFolder()}
                placeholder="文件夹名称"
                autoFocus
                style={{
                  flex: 1, background: theme.input, border: `1px solid ${theme.border}`,
                  borderRadius: 4, padding: '4px 8px', fontSize: 12, color: theme.text,
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button onClick={createFolder} style={{
                background: theme.accent, border: 'none', color: '#fff', padding: '4px 8px',
                borderRadius: 4, fontSize: 11, cursor: 'pointer'
              }}>
                添加
              </button>
            </div>
          ) : (
            <button onClick={() => setShowNewFolder(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 20px',
              background: 'none', border: 'none', color: theme.muted, fontSize: 12,
              cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit'
            }}>
              <Plus size={12} /> 新建文件夹
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding: '8px 16px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: theme.sidebar
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', color: theme.muted,
              width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FolderOpen size={15} />
            </button>
            {activeNote && (
              <input
                value={activeNote.name}
                onChange={e => renameNote(activeNote.id, e.target.value)}
                style={{
                  background: 'none', border: 'none', color: theme.text, fontSize: 14,
                  fontWeight: 600, outline: 'none', fontFamily: 'inherit', width: 200
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeNote && (
              <>
                <button onClick={() => toggleStar(activeNote.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: activeNote.starred ? '#fbbf24' : theme.muted
                }}>
                  <Star size={15} fill={activeNote.starred ? '#fbbf24' : 'none'} />
                </button>
                <button onClick={copyMarkdown} title="复制 Markdown" style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: theme.muted,
                  width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Copy size={14} />
                </button>
                <button onClick={copyHTML} title="复制 HTML" style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: theme.muted,
                  width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700
                }}>
                  {'</>'}
                </button>
                <button onClick={exportHTML} title="导出 HTML" style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: theme.muted,
                  width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Download size={14} />
                </button>
                <button onClick={() => deleteNote(activeNote.id)} title="删除" style={{
                  background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444',
                  width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <div style={{ display: 'flex', background: theme.input, borderRadius: 6, border: `1px solid ${theme.border}` }}>
              {(['edit', 'split', 'preview'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  style={{
                    background: previewMode === mode ? theme.accent : 'transparent',
                    color: previewMode === mode ? '#fff' : theme.muted,
                    border: 'none', padding: '4px 10px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', borderRadius: 5,
                    fontFamily: 'inherit'
                  }}
                >
                  {mode === 'edit' ? '编辑' : mode === 'split' ? '分屏' : '预览'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor + Preview */}
        {activeNote ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Editor */}
            {(previewMode === 'edit' || previewMode === 'split') && (
              <div style={{
                flex: previewMode === 'split' ? 1 : 'auto',
                width: previewMode === 'edit' ? '100%' : undefined,
                display: 'flex', flexDirection: 'column'
              }}>
                <textarea
                  ref={editorRef}
                  value={activeNote.content}
                  onChange={e => updateNoteContent(e.target.value)}
                  placeholder="开始编写 Markdown..."
                  style={{
                    flex: 1, background: 'transparent', border: 'none', color: theme.text,
                    padding: '20px 24px', fontSize: 14, lineHeight: 1.8,
                    resize: 'none', outline: 'none', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    tabSize: 2
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const start = e.currentTarget.selectionStart
                      const end = e.currentTarget.selectionEnd
                      const newContent = activeNote.content.substring(0, start) + '  ' + activeNote.content.substring(end)
                      updateNoteContent(newContent)
                      setTimeout(() => {
                        if (editorRef.current) {
                          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2
                        }
                      }, 0)
                    }
                  }}
                />
              </div>
            )}
            {/* Divider */}
            {previewMode === 'split' && (
              <div style={{ width: 1, background: theme.border }} />
            )}
            {/* Preview */}
            {(previewMode === 'preview' || previewMode === 'split') && (
              <div style={{
                flex: previewMode === 'split' ? 1 : 'auto',
                width: previewMode === 'preview' ? '100%' : undefined,
                padding: '20px 24px', overflowY: 'auto',
                fontSize: 14, lineHeight: 1.8
              }}>
                <div
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                  style={{
                    maxWidth: 720,
                    color: theme.text,
                  }}
                />
                <style>{`
                  .markdown-preview h1 { font-size: 2em; font-weight: 800; margin: 0.8em 0 0.4em; border-bottom: 2px solid ${theme.border}; padding-bottom: 0.3em; }
                  .markdown-preview h2 { font-size: 1.5em; font-weight: 700; margin: 0.8em 0 0.4em; }
                  .markdown-preview h3 { font-size: 1.25em; font-weight: 600; margin: 0.6em 0 0.3em; }
                  .markdown-preview p { margin: 0.6em 0; }
                  .markdown-preview ul, .markdown-preview ol { padding-left: 1.5em; margin: 0.5em 0; }
                  .markdown-preview li { margin: 0.2em 0; }
                  .markdown-preview code { background: ${theme.input}; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: 'JetBrains Mono', monospace; }
                  .markdown-preview pre { background: ${theme.input}; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 0.8em 0; }
                  .markdown-preview pre code { background: none; padding: 0; }
                  .markdown-preview blockquote { border-left: 4px solid ${theme.accent}; padding-left: 16px; margin: 0.8em 0; color: ${theme.muted}; }
                  .markdown-preview table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
                  .markdown-preview th, .markdown-preview td { border: 1px solid ${theme.border}; padding: 8px 12px; text-align: left; }
                  .markdown-preview th { background: ${theme.input}; font-weight: 600; }
                  .markdown-preview hr { border: none; border-top: 1px solid ${theme.border}; margin: 1.5em 0; }
                  .markdown-preview a { color: ${theme.accent}; text-decoration: none; }
                  .markdown-preview a:hover { text-decoration: underline; }
                  .markdown-preview img { max-width: 100%; border-radius: 8px; }
                `}</style>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📝</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>选择或创建一个笔记</div>
              <button onClick={() => createNote()} style={{
                background: theme.accent, border: 'none', color: '#fff', padding: '10px 20px',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
                <Plus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                创建第一个笔记
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        {activeNote && (
          <div style={{
            padding: '4px 16px', borderTop: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: theme.muted, background: theme.sidebar
          }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span><Type size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{stats.chars} 字符</span>
              <span><Hash size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{stats.words} 词</span>
              <span><FileText size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{stats.lines} 行</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span><Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />编辑于 {new Date(activeNote.updatedAt).toLocaleTimeString('zh-CN')}</span>
              <span>Markdown</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default MarkdownNotebook
