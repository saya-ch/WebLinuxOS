import { useState, useEffect, memo } from 'react'
import { Search, Plus, Trash2, Tag, Star, Clock, FileText, Archive, Download, Upload } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  starred: boolean
  createdAt: number
  updatedAt: number
  color: string
  archived: boolean
}

const NOTE_COLORS = [
  { name: '默认', value: 'transparent' },
  { name: '黄色', value: 'rgba(255, 193, 7, 0.2)' },
  { name: '绿色', value: 'rgba(40, 167, 69, 0.2)' },
  { name: '蓝色', value: 'rgba(0, 123, 255, 0.2)' },
  { name: '粉色', value: 'rgba(232, 62, 140, 0.2)' },
  { name: '紫色', value: 'rgba(108, 117, 125, 0.2)' },
]

export default memo(function Notes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-smartnotes-v2')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editColor, setEditColor] = useState('transparent')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-smartnotes-v2', JSON.stringify(notes))
    } catch (error) {
      console.warn('保存笔记失败:', error)
    }
  }, [notes])

  const visibleNotes = notes.filter(note => showArchived ? note.archived : !note.archived)

  const filteredNotes = visibleNotes.filter(note => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return b.updatedAt - a.updatedAt
  })

  const createNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '新笔记',
      content: '',
      tags: [],
      starred: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: 'transparent',
      archived: false
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setEditTags('')
    setEditColor('transparent')
    setIsEditing(true)
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags.join(', '))
    setEditColor(note.color)
    setIsEditing(false)
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedNote?.id === id) {
      setSelectedNote(null)
      setIsEditing(false)
    }
  }

  const toggleStar = (id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, starred: !n.starred, updatedAt: Date.now() } : n
    ))
  }

  const toggleArchive = (id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, archived: !n.archived, updatedAt: Date.now() } : n
    ))
  }

  const saveNote = () => {
    if (!selectedNote) return

    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)

    setNotes(prev => prev.map(n =>
      n.id === selectedNote.id
        ? {
            ...n,
            title: editTitle || '无标题',
            content: editContent,
            tags,
            color: editColor,
            updatedAt: Date.now()
          }
        : n
    ))

    setSelectedNote(prev => prev ? {
      ...prev,
      title: editTitle || '无标题',
      content: editContent,
      tags,
      color: editColor,
      updatedAt: Date.now()
    } : null)
    setIsEditing(false)
  }

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weblinux-notes-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          setNotes(prev => [...imported.map((n: Note) => ({
            ...n,
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          })), ...prev])
        }
      } catch {
        console.warn('导入笔记失败')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'var(--window-bg)',
      fontSize: '14px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: selectedNote ? '280px' : '100%',
        borderRight: selectedNote ? '1px solid var(--window-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              flex: 1,
              position: 'relative'
            }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.5
              }} />
              <input
                type="text"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--window-border)',
                  background: 'var(--titlebar-bg)',
                  color: 'var(--titlebar-text)',
                  outline: 'none',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={createNewNote}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              新建笔记
            </button>
            <button
              onClick={exportNotes}
              title="导出笔记"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--titlebar-bg)',
                color: 'var(--titlebar-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={16} />
            </button>
            <label style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--window-border)',
              background: 'var(--titlebar-bg)',
              color: 'var(--titlebar-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={16} />
              <input
                type="file"
                accept=".json"
                onChange={importNotes}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setShowArchived(false)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: !showArchived ? 'var(--accent)' : 'transparent',
                color: !showArchived ? 'white' : 'var(--titlebar-text)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              <FileText size={14} style={{ marginRight: '4px' }} />
              {notes.filter(n => !n.archived).length} 笔记
            </button>
            <button
              onClick={() => setShowArchived(true)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: showArchived ? 'var(--accent)' : 'transparent',
                color: showArchived ? 'white' : 'var(--titlebar-text)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              <Archive size={14} style={{ marginRight: '4px' }} />
              {notes.filter(n => n.archived).length} 归档
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px'
        }}>
          {sortedNotes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--titlebar-text)',
              opacity: 0.5
            }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p>暂无笔记</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                点击上方按钮创建第一个笔记
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '8px'
            }}>
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: selectedNote?.id === note.id
                      ? '2px solid var(--accent)'
                      : '1px solid var(--window-border)',
                    background: note.color || 'var(--titlebar-bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--titlebar-text)',
                      margin: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {note.title || '无标题'}
                    </h3>
                    {note.starred && <Star size={14} fill="currentColor" color="#ffc107" />}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.7,
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.4'
                  }}>
                    {note.content || '无内容'}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.5
                  }}>
                    <Clock size={12} />
                    {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
                  </div>
                  {note.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      marginTop: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {note.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--accent)',
                            color: 'white',
                            fontSize: '10px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedNote && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: selectedNote.color || 'var(--window-bg)'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--window-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onFocus={() => setIsEditing(true)}
              placeholder="笔记标题..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--titlebar-bg)',
                color: 'var(--titlebar-text)',
                fontSize: '16px',
                fontWeight: '600',
                outline: 'none'
              }}
            />
            <button
              onClick={() => toggleStar(selectedNote.id)}
              title="收藏"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: selectedNote.starred ? '#ffc107' : 'var(--titlebar-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Star size={16} fill={selectedNote.starred ? 'white' : 'none'} color={selectedNote.starred ? 'white' : 'currentColor'} />
            </button>
            <button
              onClick={() => toggleArchive(selectedNote.id)}
              title={selectedNote.archived ? "取消归档" : "归档"}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--titlebar-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Archive size={16} />
            </button>
            <button
              onClick={() => deleteNote(selectedNote.id)}
              title="删除"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #dc3545',
                background: 'var(--titlebar-bg)',
                color: '#dc3545',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={saveNote}
              disabled={!isEditing}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isEditing ? 'var(--accent)' : 'var(--titlebar-bg)',
                color: isEditing ? 'white' : 'var(--titlebar-text)',
                cursor: isEditing ? 'pointer' : 'not-allowed',
                opacity: isEditing ? 1 : 0.5,
                transition: 'all 0.2s',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              保存
            </button>
          </div>

          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--window-border)'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <Tag size={14} style={{ opacity: 0.7 }} />
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                onFocus={() => setIsEditing(true)}
                placeholder="标签（用逗号分隔）..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--window-border)',
                  background: 'var(--titlebar-bg)',
                  color: 'var(--titlebar-text)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>颜色:</span>
              {NOTE_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => {
                    setEditColor(color.value)
                    setIsEditing(true)
                  }}
                  title={color.name}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: editColor === color.value ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                    background: color.value === 'transparent' ? 'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #ff6b6b 100%)' : color.value,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onFocus={() => setIsEditing(true)}
              placeholder="开始写笔记..."
              style={{
                width: '100%',
                height: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--titlebar-bg)',
                color: 'var(--titlebar-text)',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--window-border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--titlebar-text)',
            opacity: 0.5
          }}>
            <span>创建于: {new Date(selectedNote.createdAt).toLocaleString('zh-CN')}</span>
            <span>更新于: {new Date(selectedNote.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      )}

      {!selectedNote && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--titlebar-text)',
          opacity: 0.3
        }}>
          <div style={{ textAlign: 'center' }}>
            <FileText size={64} style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px' }}>选择一个笔记或创建新笔记</p>
          </div>
        </div>
      )}
    </div>
  )
})
