import { useState, useEffect, useMemo } from 'react'

interface Note {
  id: string
  title: string
  content: string
  color: string
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

const COLORS = [
  { id: 'yellow', bg: 'rgba(255, 235, 59, 0.15)', border: 'rgba(255, 235, 59, 0.4)', text: '#fff59d' },
  { id: 'green', bg: 'rgba(129, 199, 132, 0.15)', border: 'rgba(129, 199, 132, 0.4)', text: '#a5d6a7' },
  { id: 'blue', bg: 'rgba(100, 181, 246, 0.15)', border: 'rgba(100, 181, 246, 0.4)', text: '#90caf9' },
  { id: 'purple', bg: 'rgba(206, 147, 216, 0.15)', border: 'rgba(206, 147, 216, 0.4)', text: '#e1bee7' },
  { id: 'red', bg: 'rgba(239, 154, 154, 0.15)', border: 'rgba(239, 154, 154, 0.4)', text: '#ef9a9a' },
  { id: 'orange', bg: 'rgba(255, 202, 40, 0.15)', border: 'rgba(255, 202, 40, 0.4)', text: '#ffe082' },
]

function QuickNotesPro() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editColor, setEditColor] = useState(COLORS[0].id)
  const [editTags, setEditTags] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const saved = localStorage.getItem('quick-notes-pro')
    if (saved) {
      setNotes(JSON.parse(saved))
    } else {
      const defaultNotes: Note[] = [
        {
          id: '1',
          title: '欢迎使用便签专业版',
          content: '这是一个功能强大的便签应用，支持标签、置顶、搜索等功能。\n\n功能亮点：\n- 6种颜色主题\n- 标签系统\n- 置顶功能\n- 快速搜索\n- 数据导出',
          color: 'blue',
          tags: ['欢迎', '教程'],
          pinned: true,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
        },
        {
          id: '2',
          title: '今日待办',
          content: '- 完成项目报告\n- 回复邮件\n- 准备会议资料\n- 更新文档',
          color: 'yellow',
          tags: ['待办'],
          pinned: false,
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now() - 3600000,
        },
        {
          id: '3',
          title: '项目灵感',
          content: '考虑添加一个AI辅助功能，让用户可以通过自然语言创建和组织便签。',
          color: 'purple',
          tags: ['灵感', 'AI'],
          pinned: false,
          createdAt: Date.now() - 7200000,
          updatedAt: Date.now() - 7200000,
        },
      ]
      setNotes(defaultNotes)
      localStorage.setItem('quick-notes-pro', JSON.stringify(defaultNotes))
    }
  }, [])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    let result = notes

    if (filterTag) {
      result = result.filter(note => note.tags.includes(filterTag))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return result.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
      return b.updatedAt - a.updatedAt
    })
  }, [notes, searchQuery, filterTag])

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes)
    localStorage.setItem('quick-notes-pro', JSON.stringify(newNotes))
  }

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '新便签',
      content: '',
      color: COLORS[0].id,
      tags: [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setIsEditing(true)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setEditColor(newNote.color)
    setEditTags('')
  }

  const updateNote = () => {
    if (!selectedNote) return
    const updated: Note = {
      ...selectedNote,
      title: editTitle || '无标题',
      content: editContent,
      color: editColor,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      updatedAt: Date.now(),
    }
    saveNotes(notes.map(n => n.id === updated.id ? updated : n))
    setSelectedNote(updated)
    setIsEditing(false)
  }

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id))
    if (selectedNote?.id === id) {
      setSelectedNote(null)
      setIsEditing(false)
    }
  }

  const togglePin = (note: Note) => {
    saveNotes(notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n))
  }

  const exportNotes = () => {
    const data = JSON.stringify(notes, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quick-notes-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string)
        if (Array.isArray(imported)) {
          saveNotes([...imported, ...notes])
        }
      } catch {
        alert('无效的JSON文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const getColorStyle = (colorId: string) => {
    return COLORS.find(c => c.id === colorId) || COLORS[0]
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return d.toLocaleDateString('zh-CN')
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--window-bg)' }}>
      <div style={{
        width: selectedNote && viewMode === 'list' ? '320px' : selectedNote ? '280px' : '100%',
        borderRight: selectedNote ? '1px solid var(--window-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
      }}>
        <div style={{ padding: '12px', borderBottom: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="搜索便签..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={createNote}
              style={{
                padding: '8px 16px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + 新建
            </button>
          </div>

          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <button
                onClick={() => setFilterTag(null)}
                style={{
                  padding: '4px 10px',
                  background: filterTag === null ? 'var(--accent)' : 'transparent',
                  border: '1px solid var(--window-border)',
                  borderRadius: '12px',
                  color: filterTag === null ? '#fff' : 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  style={{
                    padding: '4px 10px',
                    background: filterTag === tag ? 'var(--accent)' : 'transparent',
                    border: '1px solid var(--window-border)',
                    borderRadius: '12px',
                    color: filterTag === tag ? '#fff' : 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                flex: 1,
                padding: '6px',
                background: viewMode === 'grid' ? 'var(--accent-bg)' : 'transparent',
                border: '1px solid var(--window-border)',
                borderRadius: '4px',
                color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              网格
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                flex: 1,
                padding: '6px',
                background: viewMode === 'list' ? 'var(--accent-bg)' : 'transparent',
                border: '1px solid var(--window-border)',
                borderRadius: '4px',
                color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              列表
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📝</div>
              <div style={{ fontSize: '14px' }}>暂无便签</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>点击"新建"创建第一个便签</div>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {filteredNotes.map(note => {
                const color = getColorStyle(note.color)
                return (
                  <div
                    key={note.id}
                    onClick={() => { setSelectedNote(note); setIsEditing(false) }}
                    style={{
                      padding: '12px',
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {note.pinned && (
                      <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '12px' }}>📌</div>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: 600, color: color.text, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {note.content}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredNotes.map(note => {
                const color = getColorStyle(note.color)
                return (
                  <div
                    key={note.id}
                    onClick={() => { setSelectedNote(note); setIsEditing(false) }}
                    style={{
                      padding: '12px',
                      background: selectedNote?.id === note.id ? 'var(--accent-bg)' : color.bg,
                      border: `1px solid ${color.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color.text, flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: color.text }}>{note.title}</span>
                        {note.pinned && <span>📌</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.content.substring(0, 60)}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '12px', borderTop: '1px solid var(--window-border)', display: 'flex', gap: '8px' }}>
          <button
            onClick={exportNotes}
            style={{
              flex: 1,
              padding: '8px',
              background: 'transparent',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            导出
          </button>
          <label style={{ flex: 1 }}>
            <input
              type="file"
              accept=".json"
              onChange={importNotes}
              style={{ display: 'none' }}
            />
            <span style={{
              display: 'block',
              padding: '8px',
              background: 'transparent',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              textAlign: 'center',
              cursor: 'pointer',
            }}>
              导入
            </span>
          </label>
        </div>
      </div>

      {selectedNote && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--window-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSelectedNote(null)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid var(--window-border)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ← 返回
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isEditing ? '编辑中' : '查看中'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => togglePin(selectedNote)}
                style={{
                  padding: '6px 12px',
                  background: selectedNote.pinned ? 'var(--accent-bg)' : 'transparent',
                  border: '1px solid var(--window-border)',
                  borderRadius: '6px',
                  color: selectedNote.pinned ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {selectedNote.pinned ? '📌 已置顶' : '📌 置顶'}
              </button>
              {isEditing ? (
                <button
                  onClick={updateNote}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  保存
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setEditTitle(selectedNote.title)
                    setEditContent(selectedNote.content)
                    setEditColor(selectedNote.color)
                    setEditTags(selectedNote.tags.join(', '))
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  编辑
                </button>
              )}
              <button
                onClick={() => deleteNote(selectedNote.id)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 77, 95, 0.4)',
                  borderRadius: '6px',
                  color: '#ff4d5f',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                删除
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="标题"
                  style={{
                    padding: '12px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="内容..."
                  style={{
                    flex: 1,
                    minHeight: '200px',
                    padding: '12px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>颜色</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setEditColor(c.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: c.bg,
                          border: `2px solid ${editColor === c.id ? c.text : 'transparent'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  placeholder="标签 (用逗号分隔)"
                  style={{
                    padding: '12px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            ) : (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: getColorStyle(selectedNote.color).text, margin: 0 }}>
                    {selectedNote.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {selectedNote.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--accent-bg)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: 'var(--accent)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: 1.8,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedNote.content}
                </div>
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--window-border)', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>创建: {new Date(selectedNote.createdAt).toLocaleString('zh-CN')}</span>
                  <span>更新: {new Date(selectedNote.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickNotesPro
