import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText, Plus, Search, Trash2, CheckCircle2,
  Circle, Star, Tag, Clock,
  LayoutGrid, List, Filter, X
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  isPinned: boolean
  isTodo: boolean
  isCompleted: boolean
  createdAt: number
  updatedAt: number
  color?: string
}

const COLORS = [
  { name: 'Default', color: '#1e1e2e' },
  { name: 'Red', color: '#4c1f23' },
  { name: 'Orange', color: '#4d3126' },
  { name: 'Yellow', color: '#4d4126' },
  { name: 'Green', color: '#1f4d35' },
  { name: 'Blue', color: '#1f3d5c' },
  { name: 'Purple', color: '#3d2b5c' },
  { name: 'Pink', color: '#4d2b4c' },
]

const DEFAULT_NOTES: Note[] = [
  {
    id: '1',
    title: '欢迎使用 SmartNotes！',
    content: '这是一个功能强大的笔记和待办事项管理应用。您可以创建笔记、添加待办事项、设置标签和颜色。',
    tags: ['欢迎', '使用说明'],
    isPinned: true,
    isTodo: false,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: '#1f3d5c',
  },
  {
    id: '2',
    title: '完成 Web Linux OS 改进',
    content: '- 优化用户界面\n- 添加创新功能\n- 测试所有应用',
    tags: ['工作', '重要'],
    isPinned: true,
    isTodo: true,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: '#1f4d35',
  },
  {
    id: '3',
    title: '学习笔记',
    content: 'React 19 新特性：\n1. 自动批处理\n2. 服务器组件\n3. 新的钩子',
    tags: ['学习', 'React'],
    isPinned: false,
    isTodo: false,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: '#4d3126',
  },
]

const STORAGE_KEY = 'smart-notes-data'

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    //
  }
  return DEFAULT_NOTES
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    //
  }
}

interface NoteEditorProps {
  note: Note
  onClose: () => void
  updateNote: (id: string, updates: Partial<Note>) => void
}

function NoteEditor({ note, onClose, updateNote }: NoteEditorProps) {
  const [localNote, setLocalNote] = useState(note)
  const [newTag, setNewTag] = useState('')

  const addTag = useCallback(() => {
    if (newTag && !localNote.tags.includes(newTag)) {
      setLocalNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
        updatedAt: Date.now(),
      }))
      setNewTag('')
    }
  }, [newTag, localNote.tags])

  const removeTag = useCallback((tag: string) => {
    setLocalNote(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
      updatedAt: Date.now(),
    }))
  }, [])

  const save = useCallback(() => {
    updateNote(note.id, localNote)
    onClose()
  }, [note.id, localNote, updateNote, onClose])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      zIndex: 1000,
    }} onClick={(e) => {
      if (e.target === e.currentTarget) save()
    }}>
      <div style={{
        width: '100%',
        maxWidth: 700,
        background: 'var(--window-bg)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--window-border)',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {note.isTodo ? '编辑待办事项' : '编辑笔记'}
          </h2>
          <button
            onClick={save}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            保存
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            value={localNote.title}
            onChange={(e) => setLocalNote(prev => ({ ...prev, title: e.target.value }))}
            placeholder="标题"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              fontWeight: 600,
              background: 'var(--input-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
          />

          <textarea
            value={localNote.content}
            onChange={(e) => setLocalNote(prev => ({ ...prev, content: e.target.value }))}
            placeholder="输入内容..."
            style={{
              width: '100%',
              minHeight: 200,
              padding: '12px 16px',
              fontSize: 14,
              background: 'var(--input-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 10,
              color: 'var(--text-primary)',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {localNote.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {tag}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag() }}
                placeholder="添加标签..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              />
              <button
                onClick={addTag}
                style={{
                  padding: '10px 16px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--window-border)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                添加
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>颜色：</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button
                  key={c.color}
                  onClick={() => setLocalNote(prev => ({ ...prev, color: c.color }))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c.color,
                    border: localNote.color === c.color ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localNote.isTodo}
                onChange={(e) => setLocalNote(prev => ({ ...prev, isTodo: e.target.checked }))}
              />
              <span style={{ fontSize: 13 }}>待办事项</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localNote.isPinned}
                onChange={(e) => setLocalNote(prev => ({ ...prev, isPinned: e.target.checked }))}
              />
              <span style={{ fontSize: 13 }}>置顶</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SmartNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesSearch = 
          searchQuery === '' || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesTag = selectedTag === null || note.tags.includes(selectedTag)
        
        return matchesSearch && matchesTag
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return b.updatedAt - a.updatedAt
      })
  }, [notes, searchQuery, selectedTag])

  const createNote = useCallback((isTodo = false) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: isTodo ? '新待办事项' : '新笔记',
      content: '',
      tags: [],
      isPinned: false,
      isTodo,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes([newNote, ...notes])
    setEditingNote(newNote)
    setIsCreateModalOpen(false)
  }, [notes])

  const deleteNote = useCallback((id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      setNotes(notes.filter(note => note.id !== id))
      if (editingNote?.id === id) {
        setEditingNote(null)
      }
    }
  }, [notes, editingNote])

  const togglePin = useCallback((id: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned, updatedAt: Date.now() } : note
    ))
  }, [notes])

  const toggleComplete = useCallback((id: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isCompleted: !note.isCompleted, updatedAt: Date.now() } : note
    ))
  }, [notes])

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
    ))
  }, [notes])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} />
            SmartNotes
          </h1>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                padding: 10,
                background: 'var(--input-bg)',
                border: 'none',
                borderRadius: 10,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '10px 18px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Plus size={18} />
              新建
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            flex: 1,
            position: 'relative',
          }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记、标签或内容..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                background: 'var(--input-bg)',
                border: '1px solid var(--window-border)',
                borderRadius: 12,
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                padding: '8px 14px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 20,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Tag size={14} />
              {selectedTag}
              <X size={14} />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Filter size={14} />
              标签：
            </span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                style={{
                  padding: '6px 12px',
                  background: selectedTag === tag ? 'var(--accent)' : 'var(--input-bg)',
                  color: selectedTag === tag ? '#fff' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Tag size={12} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 20,
      }}>
        {filteredNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-secondary)',
          }}>
            <FileText size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
            <div style={{ fontSize: 18, marginBottom: 8 }}>没有找到笔记</div>
            <div style={{ fontSize: 14 }}>尝试调整搜索条件或创建一个新笔记</div>
          </div>
        ) : (
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'none',
            flexDirection: viewMode === 'list' ? 'column' : 'row',
            gap: 16,
          }}>
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setEditingNote(note)}
                style={{
                  background: note.color || 'var(--input-bg)',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid var(--window-border)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  opacity: note.isCompleted ? 0.6 : 1,
                  textDecoration: note.isCompleted ? 'line-through' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {note.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {note.isPinned && <Star size={16} fill="#facc15" color="#facc15" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {note.content && (
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: viewMode === 'grid' ? 3 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5,
                  }}>
                    {note.content}
                  </p>
                )}

                {note.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {note.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Clock size={12} />
                    {formatDate(note.updatedAt)}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {note.isTodo && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleComplete(note.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: note.isCompleted ? '#4ade80' : 'var(--text-secondary)',
                        }}
                      >
                        {note.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: note.isPinned ? '#facc15' : 'var(--text-secondary)',
                      }}
                    >
                      <Star size={18} fill={note.isPinned ? '#facc15' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000,
        }} onClick={() => setIsCreateModalOpen(false)}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>创建新内容</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => createNote(false)}
                style={{
                  flex: 1,
                  padding: '20px 24px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <FileText size={32} />
                <span style={{ fontWeight: 600 }}>笔记</span>
              </button>
              <button
                onClick={() => createNote(true)}
                style={{
                  flex: 1,
                  padding: '20px 24px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <CheckCircle2 size={32} />
                <span style={{ fontWeight: 600 }}>待办事项</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {editingNote && <NoteEditor note={editingNote} onClose={() => setEditingNote(null)} updateNote={updateNote} />}
    </div>
  )
}
