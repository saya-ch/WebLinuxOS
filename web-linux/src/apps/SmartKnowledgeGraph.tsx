/**
 * SmartKnowledgeGraph - 智能知识图谱
 * 
 * 一个创新的知识管理工具，支持：
 * - 笔记双向链接 [[链接]]
 * - 知识图谱可视化
 * - 自动反向链接追踪
 * - 标签系统
 * - 全文搜索
 * - 导入导出
 */

import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react'
import { Search, Plus, Link2, Download, Upload, Trash2, Edit3, Network, FileText, ChevronRight } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  backlinks: string[]
}

interface GraphNode {
  id: string
  title: string
  x: number
  y: number
  connections: string[]
}

const STORAGE_KEY = 'weblinux-knowledge-graph'

const extractLinks = (content: string): string[] => {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1])
  }
  return links
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const SmartKnowledgeGraph = memo(function SmartKnowledgeGraph() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'notes' | 'graph'>('notes')
  
  const graphCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // 加载笔记
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setNotes(parsed)
        }
      }
    } catch {
      // 忽略解析错误
    }
  }, [])
  
  // 保存笔记
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    }
  }, [notes])
  
  // 创建笔记
  const createNote = useCallback(() => {
    const newNote: Note = {
      id: generateId(),
      title: '新笔记',
      content: '# 新笔记\n\n使用 [[双向链接]] 连接其他笔记\n\n添加 #标签 进行分类',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      backlinks: []
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setIsEditing(true)
  }, [])
  
  // 更新笔记
  const updateNote = useCallback(() => {
    if (!selectedNote) return
    
    const tags = editContent.match(/#[\w\u4e00-\u9fa5]+/g)?.map(t => t.slice(1)) || []
    
    setNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === selectedNote.id) {
          return {
            ...note,
            title: editTitle,
            content: editContent,
            tags,
            updatedAt: Date.now()
          }
        }
        return note
      })
      
      // 更新反向链接
      return updated.map(note => {
        const backlinks = updated.filter(n => {
          if (n.id === note.id) return false
          const nLinks = extractLinks(n.content)
          return nLinks.includes(note.title)
        }).map(n => n.id)
        return { ...note, backlinks }
      })
    })
    
    setIsEditing(false)
    setSelectedNote(prev => prev ? {
      ...prev,
      title: editTitle,
      content: editContent,
      updatedAt: Date.now()
    } : null)
  }, [selectedNote, editTitle, editContent])
  
  // 删除笔记
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id))
    if (selectedNote?.id === id) {
      setSelectedNote(null)
      setIsEditing(false)
    }
  }, [selectedNote])
  
  // 过滤笔记
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [notes, searchQuery])
  
  // 绘制知识图谱
  useEffect(() => {
    if (activeTab !== 'graph' || !graphCanvasRef.current) return
    
    const canvas = graphCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const container = canvas.parentElement
    if (!container) return
    
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    
    // 构建图谱节点
    const nodes: GraphNode[] = notes.map((note, i) => {
      const angle = (2 * Math.PI * i) / notes.length
      const radius = Math.min(canvas.width, canvas.height) * 0.35
      return {
        id: note.id,
        title: note.title,
        x: canvas.width / 2 + radius * Math.cos(angle),
        y: canvas.height / 2 + radius * Math.sin(angle),
        connections: extractLinks(note.content)
          .map(link => notes.find(n => n.title === link)?.id)
          .filter(Boolean) as string[]
      }
    })
    
    // 清空画布
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制连接线
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)'
    ctx.lineWidth = 1
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId)
        if (target) {
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })
    })
    
    // 绘制节点
    nodes.forEach(node => {
      // 节点圆圈
      ctx.beginPath()
      ctx.arc(node.x, node.y, 20, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(102, 126, 234, 0.8)'
      ctx.fill()
      
      // 节点标题
      ctx.fillStyle = '#fff'
      ctx.font = '12px "Plus Jakarta Sans"'
      ctx.textAlign = 'center'
      ctx.fillText(node.title.slice(0, 10), node.x, node.y + 35)
    })
  }, [activeTab, notes])
  
  // 导出笔记
  const exportNotes = useCallback(() => {
    const data = JSON.stringify(notes, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `knowledge-graph-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [notes])
  
  // 导入笔记
  const importNotes = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          setNotes(prev => [...prev, ...imported])
        }
      } catch {
        alert('导入失败：无效的JSON格式')
      }
    }
    reader.readAsText(file)
  }, [])
  
  return (
    <div style={styles.container}>
      {/* 侧边栏 */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <Network size={24} />
          </div>
          <h2 style={styles.sidebarTitle}>知识图谱</h2>
        </div>
        
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'notes' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('notes')}
          >
            <FileText size={14} />
            笔记
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'graph' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('graph')}
          >
            <Network size={14} />
            图谱
          </button>
        </div>
        
        <div style={styles.actionBar}>
          <button style={styles.actionBtn} onClick={createNote}>
            <Plus size={14} />
            新建
          </button>
          <button style={styles.actionBtn} onClick={exportNotes}>
            <Download size={14} />
          </button>
          <label style={styles.actionBtn}>
            <Upload size={14} />
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={importNotes}
            />
          </label>
        </div>
        
        <div style={styles.notesList}>
          {filteredNotes.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={32} strokeWidth={1} />
              <p>暂无笔记</p>
              <button style={styles.emptyBtn} onClick={createNote}>创建第一条笔记</button>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                style={{
                  ...styles.noteItem,
                  ...(selectedNote?.id === note.id ? styles.noteItemActive : {})
                }}
                onClick={() => {
                  setSelectedNote(note)
                  setIsEditing(false)
                }}
              >
                <div style={styles.noteTitle}>{note.title}</div>
                <div style={styles.noteMeta}>
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={styles.tag}>#{tag}</span>
                  ))}
                  <span style={styles.backlinkCount}>
                    <Link2 size={10} />
                    {note.backlinks.length}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 主内容区 */}
      <div style={styles.mainContent}>
        {activeTab === 'graph' ? (
          <div style={styles.graphContainer}>
            <canvas ref={graphCanvasRef} style={styles.graphCanvas} />
            <div style={styles.graphOverlay}>
              <div style={styles.graphHint}>
                知识图谱可视化 · {notes.length} 个节点 · {notes.reduce((sum, n) => sum + n.backlinks.length, 0)} 条连接
              </div>
            </div>
          </div>
        ) : selectedNote ? (
          isEditing ? (
            <div style={styles.editor}>
              <input
                style={styles.titleInput}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="笔记标题"
              />
              <textarea
                style={styles.contentInput}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="使用 [[双向链接]] 连接其他笔记&#10;&#10;添加 #标签 进行分类"
                spellCheck={false}
              />
              <div style={styles.editorActions}>
                <button style={styles.saveBtn} onClick={updateNote}>
                  保存
                </button>
                <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.viewer}>
              <div style={styles.viewerHeader}>
                <h1 style={styles.viewerTitle}>{selectedNote.title}</h1>
                <div style={styles.viewerActions}>
                  <button style={styles.iconBtn} onClick={() => {
                    setEditTitle(selectedNote.title)
                    setEditContent(selectedNote.content)
                    setIsEditing(true)
                  }}>
                    <Edit3 size={16} />
                  </button>
                  <button style={styles.iconBtn} onClick={() => deleteNote(selectedNote.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {selectedNote.tags.length > 0 && (
                <div style={styles.viewerTags}>
                  {selectedNote.tags.map(tag => (
                    <span key={tag} style={styles.viewerTag}>#{tag}</span>
                  ))}
                </div>
              )}
              
              <div style={styles.viewerContent}>
                {selectedNote.content.split('\n').map((line, i) => {
                  // 处理链接
                  const parts = line.split(/(\[\[[^\]]+\]\])/g)
                  return (
                    <p key={i}>
                      {parts.map((part, j) => {
                        if (part.startsWith('[[') && part.endsWith(']]')) {
                          const linkText = part.slice(2, -2)
                          return (
                            <span
                              key={j}
                              style={styles.link}
                              onClick={() => {
                                const linked = notes.find(n => n.title === linkText)
                                if (linked) setSelectedNote(linked)
                              }}
                            >
                              {linkText}
                            </span>
                          )
                        }
                        return part
                      })}
                    </p>
                  )
                })}
              </div>
              
              {selectedNote.backlinks.length > 0 && (
                <div style={styles.backlinksSection}>
                  <h3 style={styles.backlinksTitle}>
                    <Link2 size={14} />
                    反向链接 ({selectedNote.backlinks.length})
                  </h3>
                  <div style={styles.backlinksList}>
                    {selectedNote.backlinks.map(id => {
                      const note = notes.find(n => n.id === id)
                      if (!note) return null
                      return (
                        <div
                          key={id}
                          style={styles.backlinkItem}
                          onClick={() => setSelectedNote(note)}
                        >
                          <ChevronRight size={12} />
                          {note.title}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>
              <Network size={48} strokeWidth={1} />
            </div>
            <h2 style={styles.welcomeTitle}>智能知识图谱</h2>
            <p style={styles.welcomeDesc}>
              使用双向链接 [[链接]] 连接笔记，构建你的知识网络
            </p>
            <button style={styles.welcomeBtn} onClick={createNote}>
              <Plus size={16} />
              创建第一条笔记
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    background: '#0a0a0f',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  sidebar: {
    width: '280px',
    background: 'rgba(255,255,255,0.02)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  searchBox: {
    padding: '12px 20px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '32px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    padding: '8px 20px',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(102, 126, 234, 0.2)',
    color: '#667eea',
  },
  actionBar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 20px',
  },
  actionBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  notesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.3)',
  },
  emptyBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    background: 'transparent',
    color: '#667eea',
    fontSize: '12px',
    cursor: 'pointer',
  },
  noteItem: {
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginBottom: '4px',
  },
  noteItemActive: {
    background: 'rgba(102, 126, 234, 0.2)',
  },
  noteTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '6px',
  },
  noteMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: '11px',
    color: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.1)',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  backlinkCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  graphContainer: {
    flex: 1,
    position: 'relative',
  },
  graphCanvas: {
    width: '100%',
    height: '100%',
  },
  graphOverlay: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
  },
  graphHint: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    background: 'rgba(0,0,0,0.5)',
    padding: '6px 12px',
    borderRadius: '4px',
  },
  editor: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    gap: '16px',
  },
  titleInput: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '24px',
    fontWeight: 700,
    outline: 'none',
  },
  contentInput: {
    flex: 1,
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#e0e0e0',
    fontSize: '14px',
    lineHeight: 1.8,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
  },
  editorActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  saveBtn: {
    padding: '10px 24px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 24px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  viewer: {
    flex: 1,
    padding: '40px 60px',
    overflowY: 'auto',
  },
  viewerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  viewerTitle: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  viewerActions: {
    display: 'flex',
    gap: '8px',
  },
  iconBtn: {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
  },
  viewerTags: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  viewerTag: {
    fontSize: '13px',
    color: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.1)',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  viewerContent: {
    fontSize: '15px',
    lineHeight: 1.8,
    color: '#e0e0e0',
  },
  link: {
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  backlinksSection: {
    marginTop: '40px',
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  backlinksTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 12px 0',
  },
  backlinksList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  backlinkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '6px',
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  welcome: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px',
  },
  welcomeIcon: {
    width: '96px',
    height: '96px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    marginBottom: '24px',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '12px',
  },
  welcomeDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '24px',
    maxWidth: '400px',
    lineHeight: 1.6,
  },
  welcomeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export default SmartKnowledgeGraph