import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import {
  Feather, Plus, Search, X, Save, Trash2, Clock,
  ArrowRight, Check, Hash,
} from 'lucide-react'
import { useStore } from '../store'

/**
 * QuickNoteOverlay — 全局快速笔记覆盖层
 *
 * 设计目标：解决"灵感稍纵即逝"的痛点。无论当前在哪个应用中，
 * 按下 Alt+N 即可弹出一个零摩擦的速记面板，
 * 输入即自动保存（localStorage），并可一键导出到虚拟文件系统
 * 的「文档」目录，真正融入 WebLinuxOS 的工作流。
 *
 * 美学方向：编辑式速记本——暖琥珀点缀 + 深色玻璃面板，
 * 衬线展示字 + 等宽元数据，营造"翻开一本趁手笔记本"的专注感。
 */

interface QuickNote {
  id: string
  body: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'weblinux-quicknote-v1'
const MAX_NOTES = 200

interface QuickNoteOverlayProps {
  isOpen: boolean
  onClose: () => void
}

function loadNotes(): QuickNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((n): n is QuickNote =>
        n && typeof n.id === 'string' && typeof n.body === 'string' &&
        typeof n.createdAt === 'number' && typeof n.updatedAt === 'number')
      .slice(0, MAX_NOTES)
  } catch {
    return []
  }
}

function saveNotes(notes: QuickNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, MAX_NOTES)))
  } catch {
    // 存储满或被禁用时静默忽略
  }
}

function makeId(): string {
  return `qn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function relTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} 天前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function preview(body: string): string {
  const line = body.split('\n').find((l) => l.trim()) || ''
  return line.trim() || '空白笔记'
}

const QuickNoteOverlay: React.FC<QuickNoteOverlayProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<QuickNote[]>(loadNotes)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [savedToVfs, setSavedToVfs] = useState<string | null>(null)
  const [autoSaved, setAutoSaved] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addFile = useStore((s) => s.addFile)
  const files = useStore((s) => s.files)
  const addNotification = useStore((s) => s.addNotification)
  const openApp = useStore((s) => s.openApp)

  // 首次打开时确保有一条可编辑笔记
  useEffect(() => {
    if (!isOpen) return
    if (notes.length === 0) {
      const n: QuickNote = { id: makeId(), body: '', createdAt: Date.now(), updatedAt: Date.now() }
      setNotes([n])
      setActiveId(n.id)
      setDraft('')
    } else if (!activeId || !notes.some((n) => n.id === activeId)) {
      setActiveId(notes[0].id)
      setDraft(notes[0].body)
    }
    // 聚焦编辑区
    const t = setTimeout(() => textareaRef.current?.focus(), 60)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // 防抖自动保存
  const scheduleSave = useCallback((id: string, body: string) => {
    setAutoSaved(false)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === id ? { ...n, body, updatedAt: Date.now() } : n
        )
        saveNotes(next)
        return next
      })
      setAutoSaved(true)
    }, 400)
  }, [])

  const handleDraftChange = useCallback((value: string) => {
    setDraft(value)
    if (activeId) scheduleSave(activeId, value)
  }, [activeId, scheduleSave])

  const handleNewNote = useCallback(() => {
    // 先落盘当前草稿
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const created: QuickNote = { id: makeId(), body: '', createdAt: Date.now(), updatedAt: Date.now() }
    setNotes((prev) => {
      const persisted = activeId
        ? prev.map((n) => (n.id === activeId ? { ...n, body: draft, updatedAt: Date.now() } : n))
        : prev
      const merged = [created, ...persisted].slice(0, MAX_NOTES)
      saveNotes(merged)
      return merged
    })
    setActiveId(created.id)
    setDraft('')
    setAutoSaved(true)
    setTimeout(() => textareaRef.current?.focus(), 30)
  }, [activeId, draft])

  const handleSelect = useCallback((id: string) => {
    // 落盘当前草稿
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (activeId) {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === activeId ? { ...n, body: draft, updatedAt: Date.now() } : n))
        saveNotes(next)
        return next
      })
    }
    const target = notes.find((n) => n.id === id)
    setActiveId(id)
    setDraft(target?.body ?? '')
    setAutoSaved(true)
    setTimeout(() => textareaRef.current?.focus(), 30)
  }, [activeId, draft, notes])

  const handleDelete = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      saveNotes(next)
      if (id === activeId) {
        if (next.length > 0) {
          setActiveId(next[0].id)
          setDraft(next[0].body)
        } else {
          const fresh: QuickNote = { id: makeId(), body: '', createdAt: Date.now(), updatedAt: Date.now() }
          setActiveId(fresh.id)
          setDraft('')
          return [fresh]
        }
      }
      return next
    })
  }, [activeId])

  // 保存到虚拟文件系统（文档目录）
  const handleSaveToVfs = useCallback(() => {
    if (!draft.trim() || !activeId) return
    const documentsNode = files.find((f) => f.id === 'documents')
    if (!documentsNode || documentsNode.type !== 'folder') return

    const firstLine = preview(draft).slice(0, 40).replace(/[\\/:*?"<>|]/g, '_').trim() || 'quick-note'
    const baseName = `速记-${firstLine}`
    // 避免重名
    const existing = new Set((documentsNode.children || []).map((c) => c.name))
    let name = `${baseName}.txt`
    let i = 2
    while (existing.has(name)) {
      name = `${baseName}-${i}.txt`
      i++
    }
    addFile('documents', name, 'file')
    // addFile 是异步写入 store，读取最新状态拿新文件 id
    setTimeout(() => {
      const latest = useStore.getState().files
      const doc = latest.find((f) => f.id === 'documents')
      const created = doc?.children?.find((c) => c.name === name)
      if (created) {
        useStore.getState().updateFileContent(created.id, draft)
      }
    }, 0)
    setSavedToVfs(name)
    addNotification({
      title: '已保存到文档',
      message: `${name} 已写入 /home/user/文档`,
      type: 'success',
      duration: 3000,
    })
    setTimeout(() => setSavedToVfs(null), 2500)
  }, [draft, activeId, files, addFile, addNotification])

  const handleOpenInEditor = useCallback(() => {
    if (!draft.trim() || !activeId) return
    handleSaveToVfs()
    setTimeout(() => openApp('text-editor'), 300)
  }, [draft, activeId, handleSaveToVfs, openApp])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? notes.filter((n) => n.body.toLowerCase().includes(q)) : notes
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, query])

  const wordCount = useMemo(() => {
    const text = draft.trim()
    if (!text) return 0
    // 中英混合：英文按词、中文按字
    const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const en = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/\b[\w-]+\b/g) || []).length
    return cjk + en
  }, [draft])

  if (!isOpen) return null

  return (
    <div
      className="quicknote-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8, 6, 12, 0.55)',
        backdropFilter: 'blur(8px) saturate(120%)',
        WebkitBackdropFilter: 'blur(8px) saturate(120%)',
        animation: 'qn-fade 180ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(880px, 94vw)',
          height: 'min(560px, 86vh)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(28, 24, 34, 0.96) 0%, rgba(20, 17, 24, 0.98) 100%)',
          border: '1px solid rgba(245, 197, 76, 0.18)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 60px -30px rgba(245, 197, 76, 0.25)',
          animation: 'qn-pop 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        }}
      >
        {/* 顶部栏 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(90deg, rgba(245,197,76,0.06), transparent 60%)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, #f5c54c, #e08a3c)',
            color: '#1a1208', boxShadow: '0 4px 14px -4px rgba(245,197,76,0.6)',
          }}>
            <Feather size={16} strokeWidth={2.2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{
              fontFamily: '"Georgia", "Songti SC", serif',
              fontSize: 17, fontWeight: 600, color: '#f3ece0',
              letterSpacing: '0.2px',
            }}>速记</span>
            <span style={{
              fontSize: 10.5, color: 'rgba(245,197,76,0.7)',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              {autoSaved ? '已自动保存' : '保存中…'} · {notes.length} 条
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* 搜索 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 10px', borderRadius: 9,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Search size={13} color="rgba(255,255,255,0.4)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索笔记…"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#e8e0d4', fontSize: 12.5, width: 130,
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            onClick={handleNewNote}
            title="新建笔记 (Ctrl+N)"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
              background: 'rgba(245,197,76,0.14)',
              border: '1px solid rgba(245,197,76,0.25)',
              color: '#f5c54c', fontSize: 12, fontWeight: 500,
              transition: 'all 140ms ease',
            }}
          >
            <Plus size={14} /> 新建
          </button>

          <button
            onClick={onClose}
            title="关闭 (Esc)"
            style={{
              width: 30, height: 30, borderRadius: 9, cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              transition: 'all 140ms ease',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* 主体：列表 + 编辑器 */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* 笔记列表 */}
          <div style={{
            width: 220, flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.18)',
          }}>
            {filtered.length === 0 && (
              <div style={{
                padding: '24px 16px', textAlign: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 12,
                fontFamily: '"Georgia", serif', fontStyle: 'italic',
              }}>
                {query ? '没有匹配的笔记' : '尚无笔记，开始书写吧'}
              </div>
            )}
            {filtered.map((n) => {
              const isActive = n.id === activeId
              return (
                <div
                  key={n.id}
                  onClick={() => handleSelect(n.id)}
                  style={{
                    padding: '11px 14px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    borderLeft: isActive ? '2px solid #f5c54c' : '2px solid transparent',
                    background: isActive ? 'rgba(245,197,76,0.08)' : 'transparent',
                    transition: 'background 120ms ease',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    fontSize: 12.5, color: isActive ? '#f3ece0' : 'rgba(232,224,212,0.8)',
                    fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 4,
                    fontFamily: '"Georgia", "Songti SC", serif',
                  }}>
                    {preview(n.body)}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 10, color: 'rgba(255,255,255,0.35)',
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    <Clock size={10} />
                    {relTime(n.updatedAt)}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                    title="删除"
                    style={{
                      position: 'absolute', right: 8, top: 10,
                      width: 20, height: 20, borderRadius: 6,
                      display: 'grid', placeItems: 'center', cursor: 'pointer',
                      background: 'rgba(255,80,80,0.12)', border: 'none',
                      color: 'rgba(255,120,120,0.7)', opacity: 0,
                      transition: 'opacity 140ms ease',
                    }}
                    className="qn-del-btn"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* 编辑器 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleSaveToVfs()
                }
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
                  e.preventDefault()
                  handleNewNote()
                }
              }}
              placeholder={'按下 Alt+N 随时唤起这里……\n写下转瞬即逝的想法，自动保存，永不丢失。\n完成后按 Ctrl+Enter 一键存入「文档」。'}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                padding: '20px 24px',
                background: 'transparent',
                color: '#ede4d3',
                fontFamily: '"Georgia", "Songti SC", "Noto Serif SC", serif',
                fontSize: 15.5, lineHeight: 1.75, letterSpacing: '0.1px',
                caretColor: '#f5c54c',
              }}
            />
            {/* 底部状态条 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '9px 18px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.25)',
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: 'rgba(255,255,255,0.4)',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                <Hash size={11} /> {wordCount} 字
              </span>
              <span style={{
                fontSize: 11, color: 'rgba(255,255,255,0.3)',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                {draft.length} 字符
              </span>
              <div style={{ flex: 1 }} />
              {savedToVfs && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11.5, color: '#7bd88f',
                  fontFamily: '"JetBrains Mono", monospace',
                  animation: 'qn-fade 200ms ease',
                }}>
                  <Check size={12} /> 已存为 {savedToVfs}
                </span>
              )}
              <button
                onClick={handleSaveToVfs}
                disabled={!draft.trim()}
                title="保存到虚拟文件系统 /home/user/文档 (Ctrl+Enter)"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 8, cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  background: draft.trim() ? 'linear-gradient(135deg, rgba(245,197,76,0.9), rgba(224,138,60,0.9))' : 'rgba(255,255,255,0.04)',
                  border: 'none',
                  color: draft.trim() ? '#1a1208' : 'rgba(255,255,255,0.3)',
                  fontSize: 12, fontWeight: 600,
                  transition: 'all 140ms ease',
                  opacity: draft.trim() ? 1 : 0.6,
                }}
              >
                <Save size={13} /> 存入文档
              </button>
              <button
                onClick={handleOpenInEditor}
                disabled={!draft.trim()}
                title="保存并用文本编辑器打开"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 11px', borderRadius: 8, cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: draft.trim() ? 'rgba(232,224,212,0.85)' : 'rgba(255,255,255,0.3)',
                  fontSize: 12, fontWeight: 500,
                  transition: 'all 140ms ease',
                }}
              >
                在编辑器打开 <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 悬停删除按钮的样式（通过全局 style 注入） */}
      <style>{`
        .quicknote-overlay .qn-del-btn { opacity: 0; }
        .quicknote-overlay div:hover > .qn-del-btn { opacity: 1; }
        .quicknote-overlay textarea::placeholder {
          color: rgba(255,255,255,0.25);
          font-family: Georgia, serif;
        }
        @keyframes qn-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qn-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default QuickNoteOverlay
