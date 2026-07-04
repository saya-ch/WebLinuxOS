import { useState, useEffect, useCallback } from 'react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  pinned: boolean
}

const STORAGE_KEY = 'weblinux_smart_notes'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const notes = JSON.parse(raw)
      return notes.map((n: Note) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }))
    }
  } catch {
    // ignore
  }
  return [
    {
      id: '1',
      title: '欢迎使用智能笔记',
      content: `# 欢迎使用智能笔记

这是一个功能强大的笔记应用，支持：

- **Markdown 渲染** - 使用 Markdown 语法编写笔记
- **标签系统** - 为笔记添加标签进行分类
- **搜索功能** - 快速搜索笔记内容
- **置顶功能** - 将重要笔记置顶
- **数据持久化** - 自动保存到本地存储

## 使用方法

1. 点击右下角的 \"+\" 按钮创建新笔记
2. 在编辑器中输入内容
3. 使用标签输入框添加标签（用逗号分隔）
4. 点击搜索框搜索笔记

## 快捷键

- Ctrl + N: 新建笔记
- Ctrl + S: 保存笔记
- Ctrl + F: 搜索笔记
`,
      tags: ['欢迎', '指南'],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: true,
    },
  ]
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export default function SmartNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  useEffect(() => {
    setNotes(loadNotes())
  }, [])

  useEffect(() => {
    if (notes.length > 0) {
      saveNotes(notes)
    }
  }, [notes])

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !tagFilter || note.tags.includes(tagFilter)
    return matchesSearch && matchesTag
  })

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })

  const allTags = [...new Set(notes.flatMap((n) => n.tags))]

  const createNote = useCallback(() => {
    const now = new Date()
    const newNote: Note = {
      id: `note-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: '新建笔记',
      content: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      pinned: false,
    }
    setNotes((prev) => [newNote, ...prev])
    setSelectedNote(newNote)
  }, [])

  const updateNote = useCallback(
    (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      )
      setSelectedNote((prev) =>
        prev?.id === id ? { ...prev, ...updates, updatedAt: new Date() } : prev
      )
    },
    []
  )

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
    if (selectedNote?.id === id) {
      setSelectedNote(null)
    }
  }, [selectedNote])

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned, updatedAt: new Date() } : note
      )
    )
    setSelectedNote((prev) =>
      prev?.id === id ? { ...prev, pinned: !prev.pinned, updatedAt: new Date() } : prev
    )
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    html = html.replace(/^- (.*$)/gim, '<li>$1</li>')
    html = html.replace(/<\/li>\n<li>/g, '</li><li>')
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')

    html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')

    html = html.replace(/\n/g, '<br>')

    return html
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        createNote()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector(
          '[data-smart-notes-search]'
        ) as HTMLInputElement
        searchInput?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createNote])

  return (
    <div className="flex h-full bg-gray-900 text-white">
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">智能笔记</h2>
            <button
              onClick={createNote}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="新建笔记 (Ctrl+N)"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            data-smart-notes-search
          />
        </div>

        {allTags.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-700">
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    tagFilter === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`p-4 border-b border-gray-700 cursor-pointer transition-colors ${
                selectedNote?.id === note.id
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-800'
              } ${note.pinned ? 'bg-blue-900/20' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium truncate flex-1 pr-2">
                  {note.pinned && (
                    <span className="inline-block mr-1">📌</span>
                  )}
                  {note.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400 truncate mb-2">
                {note.content.replace(/[#*\-\n]/g, ' ').substring(0, 50)}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-gray-600 text-xs rounded">
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(note.updatedAt)}
                </span>
              </div>
            </div>
          ))}
          {sortedNotes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-3 opacity-50">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" />
              </svg>
              <p>暂无笔记</p>
              <p className="text-sm">点击右上角 + 创建新笔记</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(selectedNote.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedNote.pinned
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700'
                  }`}
                  title={selectedNote.pinned ? '取消置顶' : '置顶'}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={selectedNote.pinned ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) =>
                    updateNote(selectedNote.id, { title: e.target.value })
                  }
                  className="text-lg font-semibold bg-transparent border-none outline-none flex-1"
                  placeholder="笔记标题"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
                  title="删除笔记"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">标签:</span>
                <input
                  type="text"
                  value={selectedNote.tags.join(', ')}
                  onChange={(e) =>
                    updateNote(selectedNote.id, {
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter((t) => t),
                    })
                  }
                  className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  placeholder="添加标签（用逗号分隔）"
                />
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto">
                <textarea
                  value={selectedNote.content}
                  onChange={(e) =>
                    updateNote(selectedNote.id, { content: e.target.value })
                  }
                  className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="在这里输入笔记内容，支持 Markdown..."
                />
              </div>
              <div className="w-1/2 border-l border-gray-700 p-4 overflow-y-auto bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-3">预览</h4>
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) || '<p class="text-gray-500">暂无内容</p>' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto mb-4 opacity-30">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" />
                <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" />
              </svg>
              <p className="text-lg">选择一个笔记</p>
              <p className="text-sm">或点击左上角 + 创建新笔记</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
