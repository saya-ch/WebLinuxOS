import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Search, Plus, Trash2, Tag, Star } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  starred: boolean
  createdAt: number
  updatedAt: number
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-notes')
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

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-notes', JSON.stringify(notes))
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }, [notes])

  const filteredNotes = notes.filter(note => {
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
      id: Date.now().toString(),
      title: '新笔记',
      content: '',
      tags: [],
      starred: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setEditTags('')
    setIsEditing(true)
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
      n.id === id ? { ...n, starred: !n.starred } : n
    ))
  }

  const saveNote = () => {
    if (!selectedNote) return
    
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
    
    setNotes(prev => prev.map(n => 
      n.id === selectedNote.id 
        ? { ...n, title: editTitle, content: editContent, tags, updatedAt: Date.now() }
        : n
    ))
    
    setSelectedNote(prev => prev ? {
      ...prev,
      title: editTitle,
      content: editContent,
      tags,
      updatedAt: Date.now()
    } : null)
    
    setIsEditing(false)
  }

  const openNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags.join(', '))
    setIsEditing(false)
  }

  return (
    <div className="app-container app-notes" style={{ display: 'flex', height: '100%', padding: 0 }}>
      <div style={{ 
        width: '280px', 
        borderRight: '1px solid var(--border-color, #333)', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--bg-secondary, #252525)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color, #333)' }}>
          <button
            onClick={createNewNote}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#4c6ef5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <Plus size={16} /> 新建笔记
          </button>
        </div>
        
        <div style={{ padding: '12px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid var(--border-color, #444)',
              borderRadius: '6px',
              background: 'var(--bg-input, #1e1e1e)',
              color: 'var(--text-color, #e0e0e0)',
              fontSize: '13px',
            }}
          />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sortedNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary, #888)' }}>
                {searchQuery ? '没有找到匹配的笔记' : '还没有笔记'}
              </div>
            </div>
          ) : (
            sortedNotes.map(note => (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                style={{
                  padding: '12px',
                  marginBottom: '4px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedNote?.id === note.id ? 'var(--accent-bg, rgba(76, 110, 245, 0.1))' : 'transparent',
                  border: selectedNote?.id === note.id ? '1px solid var(--accent, #4c6ef5)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: 'var(--text-color, #e0e0e0)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {note.title}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(note.id) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  >
                    {note.starred ? '⭐' : '☆'}
                  </button>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary, #888)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '6px'
                }}>
                  {note.content || '无内容'}
                </div>
                {note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {note.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: 'var(--accent-bg, rgba(76, 110, 245, 0.1))',
                          borderRadius: '4px',
                          color: 'var(--accent, #4c6ef5)',
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
        
        <div style={{ 
          padding: '12px', 
          borderTop: '1px solid var(--border-color, #333)',
          fontSize: '12px',
          color: 'var(--text-secondary, #888)',
          textAlign: 'center'
        }}>
          {notes.length} 篇笔记
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedNote ? (
          <>
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-color, #333)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary, #252525)'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color, #e0e0e0)' }}>
                {isEditing ? '编辑笔记' : '查看笔记'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--border-color, #444)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-color, #e0e0e0)',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={saveNote}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#4c6ef5',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      保存
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#4c6ef5',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #dc2626',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                  <input
                    type="text"
                    placeholder="笔记标题"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid var(--border-color, #444)',
                      borderRadius: '8px',
                      background: 'var(--bg-input, #1e1e1e)',
                      color: 'var(--text-color, #e0e0e0)',
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                  />
                  <textarea
                    placeholder="笔记内容..."
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: '1px solid var(--border-color, #444)',
                      borderRadius: '8px',
                      background: 'var(--bg-input, #1e1e1e)',
                      color: 'var(--text-color, #e0e0e0)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      resize: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={14} style={{ opacity: 0.6 }} />
                    <input
                      type="text"
                      placeholder="标签（用逗号分隔）"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid var(--border-color, #444)',
                        borderRadius: '6px',
                        background: 'var(--bg-input, #1e1e1e)',
                        color: 'var(--text-color, #e0e0e0)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    marginBottom: '16px',
                    color: 'var(--text-color, #e0e0e0)'
                  }}>
                    {selectedNote.title}
                  </h1>
                  {selectedNote.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      {selectedNote.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            background: 'var(--accent-bg, rgba(76, 110, 245, 0.1))',
                            borderRadius: '12px',
                            color: 'var(--accent, #4c6ef5)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-secondary, #888)',
                    marginBottom: '20px'
                  }}>
                    最后更新: {new Date(selectedNote.updatedAt).toLocaleString('zh-CN')}
                  </div>
                  <div style={{ 
                    lineHeight: 1.8, 
                    color: 'var(--text-color, #e0e0e0)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedNote.content || '无内容'}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--text-secondary, #888)'
          }}>
            <div style={{ fontSize: '64px' }}>📝</div>
            <div style={{ fontSize: '16px' }}>选择一个笔记或创建新笔记</div>
          </div>
        )}
      </div>
    </div>
  )
}
