import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import {
  FolderIcon,
  SearchIcon,
  TagIcon,
  TrashIcon,
  PlusIcon,
  DownloadIcon,
  StarIcon,
  CopyIcon,
  EyeIcon,
} from '../icons'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  starred: boolean
  category: string
}

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📁' },
  { id: 'work', name: '工作', icon: '💼' },
  { id: 'personal', name: '个人', icon: '👤' },
  { id: 'ideas', name: '创意', icon: '💡' },
  { id: 'learning', name: '学习', icon: '📚' },
  { id: 'todos', name: '待办', icon: '✅' },
]

const STORAGE_KEY = 'weblinux-smart-notes-pro'

export default function SmartNotesPro() {
  const theme = useStore((s) => s.theme)
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showPreview, setShowPreview] = useState(false)
  const [newTag, setNewTag] = useState('')

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [notes])

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: '新笔记',
      content: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      category: 'personal',
    }
    setNotes(prev => [newNote, ...prev])
    setActiveNote(newNote)
  }, [])

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    )
    if (activeNote?.id === id) {
      setActiveNote(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [activeNote])

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id))
    if (activeNote?.id === id) {
      setActiveNote(null)
    }
  }, [activeNote])

  const addTag = useCallback(() => {
    if (!newTag.trim() || !activeNote) return
    const tag = newTag.trim().toLowerCase()
    if (!activeNote.tags.includes(tag)) {
      updateNote(activeNote.id, { tags: [...activeNote.tags, tag] })
    }
    setNewTag('')
  }, [newTag, activeNote, updateNote])

  const removeTag = useCallback((tag: string) => {
    if (!activeNote) return
    updateNote(activeNote.id, { tags: activeNote.tags.filter(t => t !== tag) })
  }, [activeNote, updateNote])

  const exportNote = useCallback((note: Note) => {
    const content = `# ${note.title}\n\n标签: ${note.tags.join(', ') || '无'}\n分类: ${CATEGORIES.find(c => c.id === note.category)?.name || '未分类'}\n创建时间: ${new Date(note.createdAt).toLocaleString('zh-CN')}\n更新时间: ${new Date(note.updatedAt).toLocaleString('zh-CN')}\n\n---\n\n${note.content}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const copyNoteContent = useCallback((note: Note) => {
    navigator.clipboard.writeText(note.content)
  }, [])

  // 过滤笔记
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.includes(searchQuery.toLowerCase()))

    const matchesCategory = activeCategory === 'all' || note.category === activeCategory

    return matchesSearch && matchesCategory
  })

  const styles = {
    container: {
      display: 'flex',
      height: '100%',
      background: theme === 'dark' ? '#1a1a2e' : '#f8f9fa',
      color: theme === 'dark' ? '#e0e0e0' : '#212529',
    },
    sidebar: {
      width: '280px',
      borderRight: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
      display: 'flex',
      flexDirection: 'column' as const,
      background: theme === 'dark' ? '#16213e' : '#ffffff',
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
    },
    editor: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '20px',
    },
  }

  return (
    <div style={styles.container}>
      {/* 左侧边栏 */}
      <div style={styles.sidebar}>
        {/* 搜索栏 */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}` }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f1f3f5',
            borderRadius: '8px',
            padding: '8px 12px',
          }}>
            <SearchIcon />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'inherit',
                flex: 1,
              }}
            />
          </div>
        </div>

        {/* 分类 */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}` }}>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#8892b0' : '#6c757d', marginBottom: '8px' }}>
            分类
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeCategory === cat.id
                    ? '#4a90e2'
                    : theme === 'dark' ? '#2d2d44' : '#e9ecef',
                  color: activeCategory === cat.id ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 新建按钮 */}
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={createNote}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 500,
              transition: 'transform 0.2s',
            }}
          >
            <PlusIcon /> 新建笔记
          </button>
        </div>

        {/* 笔记列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: theme === 'dark' ? '#8892b0' : '#6c757d' }}>
              {notes.length === 0 ? '还没有笔记\n点击上方按钮创建' : '没有匹配的笔记'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setActiveNote(note)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  background: activeNote?.id === note.id
                    ? theme === 'dark' ? '#2d2d44' : '#e3f2fd'
                    : 'transparent',
                  border: `1px solid ${activeNote?.id === note.id ? '#4a90e2' : 'transparent'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {note.starred && <StarIcon size={14} style={{ color: '#f50057' }} />}
                  <div style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#8892b0' : '#6c757d' }}>
                  {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
                </div>
                {note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: theme === 'dark' ? '#2d2d44' : '#e9ecef',
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 统计 */}
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
          fontSize: '12px',
          color: theme === 'dark' ? '#8892b0' : '#6c757d',
        }}>
          共 {notes.length} 条笔记
        </div>
      </div>

      {/* 右侧编辑区 */}
      <div style={styles.mainContent}>
        {activeNote ? (
          <>
            {/* 工具栏 */}
            <div style={{
              padding: '12px 20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              {/* 分类选择 */}
              <select
                value={activeNote.category}
                onChange={(e) => updateNote(activeNote.id, { category: e.target.value })}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>

              {/* 星标 */}
              <button
                onClick={() => updateNote(activeNote.id, { starred: !activeNote.starred })}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  background: activeNote.starred ? '#f50057' : theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: activeNote.starred ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <StarIcon size={14} />
              </button>

              {/* 标签 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TagIcon size={14} />
                <input
                  type="text"
                  placeholder="添加标签..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                    background: theme === 'dark' ? '#1a1a2e' : '#fff',
                    color: 'inherit',
                    width: '100px',
                  }}
                />
              </div>

              {/* 预览切换 */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  background: showPreview ? '#4a90e2' : theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: showPreview ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <EyeIcon size={14} /> {showPreview ? '编辑' : '预览'}
              </button>

              {/* 复制 */}
              <button
                onClick={() => copyNoteContent(activeNote)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CopyIcon size={14} />
              </button>

              {/* 导出 */}
              <button
                onClick={() => exportNote(activeNote)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <DownloadIcon size={14} />
              </button>

              {/* 删除 */}
              <button
                onClick={() => {
                  if (confirm('确定要删除这条笔记吗?')) {
                    deleteNote(activeNote.id)
                  }
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  background: '#f50057',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TrashIcon size={14} />
              </button>
            </div>

            {/* 标签显示 */}
            {activeNote.tags.length > 0 && (
              <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {activeNote.tags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: theme === 'dark' ? '#2d2d44' : '#e9ecef',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    #{tag} ×
                  </span>
                ))}
              </div>
            )}

            {/* 编辑器 */}
            <div style={styles.editor}>
              {/* 标题 */}
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                placeholder="笔记标题..."
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  marginBottom: '16px',
                  color: 'inherit',
                  width: '100%',
                }}
              />

              {/* 内容编辑器 */}
              {!showPreview ? (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                  placeholder="开始写点什么..."
                  style={{
                    flex: 1,
                    resize: 'none',
                    border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    background: theme === 'dark' ? '#1a1a2e' : '#fff',
                    color: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '16px',
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#2d2d44' : '#dee2e6'}`,
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                }}>
                  {activeNote.content || '暂无内容'}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme === 'dark' ? '#8892b0' : '#6c757d',
          }}>
            <FolderIcon size={64} />
            <div style={{ marginTop: '16px', fontSize: '18px' }}>选择或创建一个笔记</div>
            <div style={{ marginTop: '8px', fontSize: '14px' }}>
              支持Markdown格式、标签分类、星标收藏、导出功能
            </div>
          </div>
        )}
      </div>
    </div>
  )
}