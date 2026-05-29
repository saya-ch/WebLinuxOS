import { useState, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'
import { marked } from 'marked'

interface Note {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: number
  updatedAt: number
  isPinned: boolean
}

interface Category {
  name: string
  color: string
}

const defaultCategories: Category[] = [
  { name: '工作', color: '#3498db' },
  { name: '个人', color: '#e74c3c' },
  { name: '项目', color: '#2ecc71' },
  { name: '学习', color: '#9b59b6' },
  { name: '想法', color: '#f39c12' },
]

const SmartNotes = memo(function SmartNotes() {
  const addNotification = useStore((s) => s.addNotification)

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('weblinux-smart-notes')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return [
      {
        id: '1',
        title: '欢迎使用智能笔记',
        content: '# 欢迎使用 WebLinuxOS 智能笔记\n\n这是一个功能强大的笔记应用，支持：\n\n- **Markdown 编辑** - 实时预览\n- **分类管理** - 组织笔记\n- **标签系统** - 快速检索\n- **搜索功能** - 快速找到笔记\n- **导出功能** - 导出为 Markdown\n\n开始创建你的笔记吧！',
        category: '个人',
        tags: ['欢迎', '使用指南'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: true,
      },
    ]
  })

  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTags, setEditTags] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const saveNotes = useCallback((newNotes: Note[]) => {
    setNotes(newNotes)
    localStorage.setItem('weblinux-smart-notes', JSON.stringify(newNotes))
  }, [])

  const currentNote = useMemo(() => {
    return notes.find(n => n.id === selectedNote) || null
  }, [notes, selectedNote])

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = searchQuery === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === null || note.category === selectedCategory
      return matchesSearch && matchesCategory
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.updatedAt - a.updatedAt
    })
  }, [notes, searchQuery, selectedCategory])

  const createNewNote = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '新笔记',
      content: '',
      category: defaultCategories[0].name,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    }
    const newNotes = [newNote, ...notes]
    saveNotes(newNotes)
    setSelectedNote(newNote.id)
    setIsEditing(true)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setEditCategory(newNote.category)
    setEditTags('')
    setShowPreview(false)
    addNotification({ title: '创建成功', message: '新笔记已创建', type: 'success' })
  }, [notes, saveNotes, addNotification])

  const startEditing = useCallback(() => {
    if (!currentNote) return
    setIsEditing(true)
    setEditTitle(currentNote.title)
    setEditContent(currentNote.content)
    setEditCategory(currentNote.category)
    setEditTags(currentNote.tags.join(', '))
  }, [currentNote])

  const saveEdit = useCallback(() => {
    if (!selectedNote) return
    const updatedNotes = notes.map(note => {
      if (note.id === selectedNote) {
        return {
          ...note,
          title: editTitle || '无标题',
          content: editContent,
          category: editCategory,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          updatedAt: Date.now(),
        }
      }
      return note
    })
    saveNotes(updatedNotes)
    setIsEditing(false)
    addNotification({ title: '保存成功', message: '笔记已保存', type: 'success' })
  }, [selectedNote, notes, editTitle, editContent, editCategory, editTags, saveNotes, addNotification])

  const deleteNote = useCallback((id: string) => {
    const noteToDelete = notes.find(n => n.id === id)
    if (!noteToDelete) return

    if (confirm(`确定要删除笔记 "${noteToDelete.title}" 吗？`)) {
      const newNotes = notes.filter(n => n.id !== id)
      saveNotes(newNotes)
      if (selectedNote === id) {
        setSelectedNote(null)
      }
      setIsEditing(false)
      addNotification({ title: '删除成功', message: '笔记已删除', type: 'info' })
    }
  }, [notes, selectedNote, saveNotes, addNotification])

  const togglePin = useCallback((id: string) => {
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        return { ...note, isPinned: !note.isPinned }
      }
      return note
    })
    saveNotes(updatedNotes)
  }, [notes, saveNotes])

  const exportNote = useCallback((note: Note) => {
    const blob = new Blob([note.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotification({ title: '导出成功', message: '笔记已导出为 Markdown 文件', type: 'success' })
  }, [addNotification])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    addNotification({ title: '已复制', message: '内容已复制到剪贴板', type: 'info' })
  }, [addNotification])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [notes])

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--window-bg)' }}>
      <div style={{
        width: '280px',
        borderRight: '1px solid var(--window-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px', borderBottom: '1px solid var(--window-border)' }}>
          <button
            onClick={createNewNote}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            + 新建笔记
          </button>
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>

        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--window-border)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '4px 8px',
              marginRight: '6px',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: selectedCategory === null ? 'var(--accent)' : 'var(--window-border)',
              background: selectedCategory === null ? 'var(--accent-bg)' : 'transparent',
              color: selectedCategory === null ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            全部
          </button>
          {defaultCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              style={{
                padding: '4px 8px',
                marginRight: '6px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: selectedCategory === cat.name ? cat.color : 'var(--window-border)',
                background: selectedCategory === cat.name ? `${cat.color}20` : 'transparent',
                color: selectedCategory === cat.name ? cat.color : 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', fontSize: '13px' }}>
              没有找到笔记
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note.id)
                  setIsEditing(false)
                  setShowPreview(false)
                }}
                style={{
                  padding: '10px',
                  marginBottom: '6px',
                  borderRadius: '6px',
                  background: selectedNote === note.id ? 'var(--accent-bg)' : 'transparent',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedNote === note.id ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {note.isPinned && <span style={{ fontSize: '10px' }}>📌</span>}
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
                  {note.content.slice(0, 60)}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: defaultCategories.find(c => c.name === note.category)?.color || '#666',
                    color: '#fff',
                  }}>
                    {note.category}
                  </span>
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'var(--window-border)', color: 'var(--text-secondary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {allTags.length > 0 && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--window-border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px' }}>所有标签</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {allTags.map(tag => (
                <span
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: searchQuery === tag ? 'var(--accent)' : 'var(--window-border)',
                    color: searchQuery === tag ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentNote ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-bg)',
                      color: 'var(--text-primary)',
                      width: '100%',
                    }}
                  />
                ) : (
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{currentNote.title}</h2>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button onClick={saveEdit} style={primaryButtonStyle}>保存</button>
                    <button onClick={() => setIsEditing(false)} style={secondaryButtonStyle}>取消</button>
                  </>
                ) : (
                  <>
                    <button onClick={startEditing} style={primaryButtonStyle}>编辑</button>
                    <button onClick={() => setShowPreview(!showPreview)} style={secondaryButtonStyle}>
                      {showPreview ? '编辑' : '预览'}
                    </button>
                    <button onClick={() => togglePin(currentNote.id)} style={secondaryButtonStyle}>
                      {currentNote.isPinned ? '📌' : '📍'}
                    </button>
                    <button onClick={() => exportNote(currentNote)} style={secondaryButtonStyle}>导出</button>
                    <button onClick={() => copyToClipboard(currentNote.content)} style={secondaryButtonStyle}>复制</button>
                    <button onClick={() => deleteNote(currentNote.id)} style={dangerButtonStyle}>删除</button>
                  </>
                )}
              </div>
            </div>

            {isEditing && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--window-border)', display: 'flex', gap: '12px' }}>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  {defaultCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="标签 (用逗号分隔)"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="使用 Markdown 编写笔记..."
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '14px',
                    resize: 'none',
                    lineHeight: 1.6,
                  }}
                />
              ) : showPreview ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '6px',
                    background: 'var(--titlebar-bg)',
                    lineHeight: 1.6,
                  }}
                  dangerouslySetInnerHTML={{ __html: marked(currentNote.content) as string }}
                />
              ) : (
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                }}>
                  {currentNote.content}
                </pre>
              )}
            </div>

            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--window-border)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>创建于: {new Date(currentNote.createdAt).toLocaleDateString('zh-CN')}</span>
              <span>更新于: {new Date(currentNote.updatedAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '64px' }}>📝</div>
            <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>选择或创建一个笔记开始</div>
            <button onClick={createNewNote} style={primaryButtonStyle}>创建新笔记</button>
          </div>
        )}
      </div>
    </div>
  )
})

const primaryButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '13px',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--window-border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '13px',
}

const dangerButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--error)',
  background: 'transparent',
  color: 'var(--error)',
  cursor: 'pointer',
  fontSize: '13px',
}

export default SmartNotes
