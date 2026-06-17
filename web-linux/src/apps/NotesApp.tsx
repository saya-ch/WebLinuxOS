import { useState, useCallback, useEffect, memo } from 'react'

interface Note {
  id: string
  title: string
  content: string
  category: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

interface Category {
  id: string
  name: string
  color: string
}

const defaultCategories: Category[] = [
  { id: 'all', name: '全部', color: '#667eea' },
  { id: 'work', name: '工作', color: '#f5576c' },
  { id: 'personal', name: '个人', color: '#4ec9b0' },
  { id: 'study', name: '学习', color: '#dcdcaa' },
  { id: 'ideas', name: '想法', color: '#c586c0' },
]

const NotesApp = memo(function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('weblinux-notes')
    if (saved) {
      try {
        return JSON.parse(saved).map((n: Note) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }))
      } catch {
        return []
      }
    }
    return [
      {
        id: 'welcome',
        title: '欢迎使用笔记应用',
        content: '这是一个功能完整的笔记应用，支持：\n\n- 多分类管理\n- 标签系统\n- 搜索功能\n- Markdown格式\n- 本地存储\n\n开始创建你的第一条笔记吧！',
        category: 'personal',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['入门', '指南'],
      },
    ]
  })
  
  const [categories] = useState<Category[]>(defaultCategories)
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('personal')
  const [editTags, setEditTags] = useState('')
  const [showNewNote, setShowNewNote] = useState(false)
  
  // 保存到localStorage
  useEffect(() => {
    localStorage.setItem('weblinux-notes', JSON.stringify(notes))
  }, [notes])
  
  const filteredNotes = useCallback(() => {
    let result = notes
    
    if (activeCategory !== 'all') {
      result = result.filter(n => n.category === activeCategory)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags.some(t => t.toLowerCase().includes(query))
      )
    }
    
    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }, [notes, activeCategory, searchQuery])
  
  const createNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: editTitle || '新笔记',
      content: editContent,
      category: editCategory,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
    }
    setNotes(prev => [...prev, newNote])
    setSelectedNote(newNote)
    setShowNewNote(false)
    setIsEditing(false)
    setEditTitle('')
    setEditContent('')
    setEditTags('')
  }, [editTitle, editContent, editCategory, editTags])
  
  const updateNote = useCallback(() => {
    if (!selectedNote) return
    setNotes(prev => prev.map(n => {
      if (n.id === selectedNote.id) {
        return {
          ...n,
          title: editTitle,
          content: editContent,
          category: editCategory,
          updatedAt: new Date(),
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        }
      }
      return n
    }))
    setIsEditing(false)
  }, [selectedNote, editTitle, editContent, editCategory, editTags])
  
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedNote?.id === id) {
      setSelectedNote(null)
      setIsEditing(false)
    }
  }, [selectedNote])
  
  const startEdit = useCallback((note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditCategory(note.category)
    setEditTags(note.tags.join(', '))
    setIsEditing(true)
  }, [])
  
  const getCategoryColor = useCallback((categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.color || '#667eea'
  }, [categories])
  
  const renderMarkdown = useCallback((text: string) => {
    // 简单的Markdown渲染
    return text
      .split('\n')
      .map((line, i) => {
        // 标题
        if (line.startsWith('# ')) {
          return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{line.slice(2)}</h2>
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{line.slice(3)}</h3>
        }
        if (line.startsWith('### ')) {
          return <h4 key={i} style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{line.slice(4)}</h4>
        }
        
        // 列表
        if (line.startsWith('- ')) {
          return <li key={i} style={{ marginLeft: 20 }}>{line.slice(2)}</li>
        }
        
        // 粗体
        const boldMatch = line.match(/\*\*(.*?)\*\*/g)
        if (boldMatch) {
          let result = line
          boldMatch.forEach(match => {
            result = result.replace(match, `<strong>${match.slice(2, -2)}</strong>`)
          })
          return <p key={i} dangerouslySetInnerHTML={{ __html: result }} />
        }
        
        // 普通文本
        if (line.trim()) {
          return <p key={i}>{line}</p>
        }
        
        return <br key={i} />
      })
  }, [])
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 280,
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Search */}
        <div style={{ padding: 16 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索笔记..."
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
        
        {/* Categories */}
        <div style={{ padding: '8px 16px' }}>
          <div style={{
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            fontWeight: 600,
          }}>
            分类
          </div>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: activeCategory === cat.id ? cat.color : 'transparent',
                border: 'none',
                borderRadius: 6,
                color: activeCategory === cat.id ? '#fff' : '#333',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: activeCategory === cat.id ? '#fff' : cat.color,
              }} />
              <span>{cat.name}</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 12,
                opacity: 0.7,
              }}>
                {cat.id === 'all' ? notes.length : notes.filter(n => n.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>
        
        {/* New Note Button */}
        <div style={{ padding: 16 }}>
          <button
            onClick={() => {
              setShowNewNote(true)
              setSelectedNote(null)
              setIsEditing(true)
              setEditTitle('')
              setEditContent('')
              setEditCategory(activeCategory === 'all' ? 'personal' : activeCategory)
              setEditTags('')
            }}
            style={{
              width: '100%',
              padding: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + 新建笔记
          </button>
        </div>
        
        {/* Notes List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 16px',
        }}>
          <div style={{
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            fontWeight: 600,
          }}>
            笔记列表 ({filteredNotes().length})
          </div>
          {filteredNotes().map(note => (
            <div
              key={note.id}
              onClick={() => {
                setSelectedNote(note)
                setIsEditing(false)
                setShowNewNote(false)
              }}
              style={{
                padding: 12,
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 8,
                background: selectedNote?.id === note.id ? '#f0f4f8' : '#fff',
                border: selectedNote?.id === note.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {note.title}
              </div>
              <div style={{
                fontSize: 12,
                color: '#666',
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {note.content.slice(0, 50)}...
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: getCategoryColor(note.category),
                  color: '#fff',
                }}>
                  {categories.find(c => c.id === note.category)?.name}
                </span>
                <span style={{
                  fontSize: 10,
                  color: '#999',
                }}>
                  {note.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {isEditing ? (
          /* Edit Mode */
          <div style={{
            flex: 1,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="笔记标题"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 18,
                fontWeight: 600,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                marginBottom: 16,
                outline: 'none',
              }}
            />
            
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
            }}>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={{
                  padding: 8,
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="标签 (逗号分隔)"
                style={{
                  flex: 1,
                  padding: 8,
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="笔记内容 (支持Markdown格式)"
              style={{
                flex: 1,
                width: '100%',
                padding: 16,
                fontSize: 14,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6,
              }}
            />
            
            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 16,
            }}>
              <button
                onClick={showNewNote ? createNote : updateNote}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showNewNote ? '创建' : '保存'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setShowNewNote(false)
                }}
                style={{
                  padding: '12px 24px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: 8,
                  color: '#333',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : selectedNote ? (
          /* View Mode */
          <div style={{
            flex: 1,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <h1 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#333',
              }}>
                {selectedNote.title}
              </h1>
              <div style={{
                display: 'flex',
                gap: 8,
              }}>
                <button
                  onClick={() => startEdit(selectedNote)}
                  style={{
                    padding: '8px 16px',
                    background: '#667eea',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#f5576c',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}>
              <span style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 4,
                background: getCategoryColor(selectedNote.category),
                color: '#fff',
              }}>
                {categories.find(c => c.id === selectedNote.category)?.name}
              </span>
              {selectedNote.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: '#e0e0e0',
                  color: '#666',
                }}>
                  #{tag}
                </span>
              ))}
              <span style={{
                fontSize: 12,
                color: '#999',
                marginLeft: 'auto',
              }}>
                更新于 {selectedNote.updatedAt.toLocaleString()}
              </span>
            </div>
            
            <div style={{
              flex: 1,
              padding: 20,
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              overflow: 'auto',
              fontSize: 14,
              lineHeight: 1.8,
            }}>
              {renderMarkdown(selectedNote.content)}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 16,
            }}>
              📝
            </div>
            <div style={{
              fontSize: 18,
              color: '#666',
              marginBottom: 8,
            }}>
              选择或创建一条笔记
            </div>
            <div style={{
              fontSize: 14,
              color: '#999',
            }}>
              点击左侧列表或点击"新建笔记"开始
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default NotesApp