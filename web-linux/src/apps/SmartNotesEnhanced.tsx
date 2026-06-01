import { useState, useEffect, useMemo, memo } from 'react'
import { marked } from 'marked'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  color: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
}

const COLORS = [
  { name: '默认', value: '#667eea' },
  { name: '红色', value: '#fc8181' },
  { name: '橙色', value: '#f6ad55' },
  { name: '绿色', value: '#68d391' },
  { name: '蓝色', value: '#63b3ed' },
  { name: '紫色', value: '#b794f4' },
  { name: '粉色', value: '#f687b3' },
  { name: '灰色', value: '#a0aec0' }
]

const SmartNotes = memo(function SmartNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('weblinux-smart-notes')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editColor, setEditColor] = useState(COLORS[0].value)
  const [newTag, setNewTag] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      if (note.archived !== showArchived) return false
      if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !note.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (activeTag && !note.tags.includes(activeTag)) return false
      return true
    }).sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
      return b.updatedAt - a.updatedAt
    })
  }, [notes, searchQuery, activeTag, showArchived])

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes)
    localStorage.setItem('weblinux-smart-notes', JSON.stringify(newNotes))
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '新笔记',
      content: '',
      tags: [],
      color: COLORS[0].value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      archived: false
    }
    saveNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setIsEditing(true)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setEditTags([])
    setEditColor(COLORS[0].value)
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags([...note.tags])
    setEditColor(note.color)
  }

  const startEditing = () => {
    if (selectedNote) {
      setIsEditing(true)
    }
  }

  const saveEdit = () => {
    if (!selectedNote) return

    const updatedNote: Note = {
      ...selectedNote,
      title: editTitle || '无标题',
      content: editContent,
      tags: editTags,
      color: editColor,
      updatedAt: Date.now()
    }

    const newNotes = notes.map(n => n.id === selectedNote.id ? updatedNote : n)
    saveNotes(newNotes)
    setSelectedNote(updatedNote)
    setIsEditing(false)
  }

  const deleteNote = (id: string) => {
    const newNotes = notes.filter(n => n.id !== id)
    saveNotes(newNotes)
    if (selectedNote?.id === id) {
      setSelectedNote(null)
      setIsEditing(false)
    }
  }

  const togglePin = (id: string) => {
    const newNotes = notes.map(n => {
      if (n.id === id) {
        return { ...n, pinned: !n.pinned, updatedAt: Date.now() }
      }
      return n
    })
    saveNotes(newNotes)
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, pinned: !selectedNote.pinned })
    }
  }

  const toggleArchive = (id: string) => {
    const newNotes = notes.map(n => {
      if (n.id === id) {
        return { ...n, archived: !n.archived, updatedAt: Date.now() }
      }
      return n
    })
    saveNotes(newNotes)
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, archived: !selectedNote.archived })
    }
  }

  const addTag = () => {
    if (newTag && !editTags.includes(newTag)) {
      setEditTags([...editTags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag))
  }

  const exportNotes = () => {
    const data = JSON.stringify(notes, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart-notes-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          const newNotes = [...notes, ...imported.map((n: any) => ({
            ...n,
            id: Date.now().toString() + Math.random(),
            createdAt: n.createdAt || Date.now(),
            updatedAt: Date.now()
          }))]
          saveNotes(newNotes)
        }
      } catch (err) {
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div style={{ height: '100%', display: 'flex', background: '#f7fafc' }}>
      <div style={{
        width: 320,
        borderRight: '1px solid #e2e8f0',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              onClick={createNewNote}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#667eea',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + 新建笔记
            </button>
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: showArchived ? '#edf2f7' : '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {showArchived ? '📁' : '📤'}
            </button>
          </div>
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {allTags.length > 0 && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTag(null)}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                border: 'none',
                background: !activeTag ? '#667eea' : '#edf2f7',
                color: !activeTag ? '#fff' : '#4a5568',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: 'none',
                  background: tag === activeTag ? '#667eea' : '#edf2f7',
                  color: tag === activeTag ? '#fff' : '#4a5568',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <p>暂无笔记</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                  background: selectedNote?.id === note.id ? '#edf2f7' : '#fff',
                  border: '1px solid',
                  borderColor: selectedNote?.id === note.id ? '#667eea' : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: `4px solid ${note.color}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#2d3748' }}>
                    {note.pinned && '📌 '}{note.title}
                  </h3>
                  <span style={{ fontSize: 11, color: '#a0aec0' }}>{formatDate(note.updatedAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#718096', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.content.substring(0, 80)}
                </p>
                {note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {note.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: `${note.color}20`,
                          color: note.color,
                          fontSize: 11
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedNote ? (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={isEditing ? saveEdit : startEditing}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#667eea',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isEditing ? '保存' : '编辑'}
                </button>
                {isEditing && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      background: showPreview ? '#edf2f7' : '#fff',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {showPreview ? '编辑' : '预览'}
                  </button>
                )}
                <button
                  onClick={() => togglePin(selectedNote.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: selectedNote.pinned ? '#edf2f7' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  📌
                </button>
                <button
                  onClick={() => toggleArchive(selectedNote.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {selectedNote.archived ? '📥' : '📤'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={exportNotes}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  导出
                </button>
                <label
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  导入
                  <input
                    type="file"
                    accept=".json"
                    onChange={importNotes}
                    style={{ display: 'none' }}
                  />
                </label>
                <button
                  onClick={() => {
                    if (confirm('确定要删除这篇笔记吗？')) {
                      deleteNote(selectedNote.id)
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#fc8181',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  删除
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
              {isEditing ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>标题</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 16,
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>颜色</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {COLORS.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setEditColor(color.value)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: editColor === color.value ? '3px solid #2d3748' : 'none',
                            background: color.value,
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>标签</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        placeholder="输入标签名后按回车"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          fontSize: 13,
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={addTag}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#667eea',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        添加
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {editTags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 12,
                            background: `${editColor}20`,
                            color: editColor,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: editColor,
                              cursor: 'pointer',
                              fontSize: 16,
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                      内容 {showPreview && '(预览模式)'}
                    </label>
                    {showPreview ? (
                      <div
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          background: '#fff',
                          minHeight: 300,
                          lineHeight: 1.6
                        }}
                        dangerouslySetInnerHTML={{ __html: marked(editContent) as string }}
                      />
                    ) : (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="支持 Markdown 格式..."
                        rows={15}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: 14,
                          fontFamily: 'Monaco, Consolas, monospace',
                          resize: 'vertical',
                          outline: 'none',
                          lineHeight: 1.6
                        }}
                      />
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#2d3748' }}>
                    {selectedNote.title}
                  </h1>
                  <div style={{ marginBottom: 16 }}>
                    {selectedNote.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          background: `${selectedNote.color}20`,
                          color: selectedNote.color,
                          fontSize: 12,
                          marginRight: 8
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 24 }}>
                    创建于: {new Date(selectedNote.createdAt).toLocaleString('zh-CN')} |
                    更新于: {new Date(selectedNote.updatedAt).toLocaleString('zh-CN')}
                  </div>
                  <div
                    style={{
                      padding: 16,
                      background: '#fff',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      lineHeight: 1.8,
                      color: '#2d3748'
                    }}
                    dangerouslySetInnerHTML={{ __html: marked(selectedNote.content) as string }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
              <p style={{ fontSize: 18 }}>选择一个笔记或创建新笔记</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default SmartNotes
