import { useState } from 'react'
import { useStore } from '../store'

interface Note {
  id: string
  title: string
  content: string
  updatedAt: string
}

export default function Notes() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: '会议记录', content: '项目周会纪要：\n1. 完成前端重构\n2. API 接口联调\n3. 部署测试环境', updatedAt: '2025-01-15' },
    { id: '2', title: '学习笔记', content: 'React 核心概念：\n- 组件化开发\n- 状态管理（useState, useReducer）\n- 副作用处理（useEffect）\n- 性能优化（useMemo, useCallback）', updatedAt: '2025-01-14' },
    { id: '3', title: '购物清单', content: '1. 牛奶\n2. 面包\n3. 鸡蛋\n4. 水果（苹果、香蕉）\n5. 蔬菜（菠菜、西兰花）', updatedAt: '2025-01-13' },
    { id: '4', title: '灵感记录', content: '一个有趣的创业想法：\n基于 AI 的智能日程管理工具，能够自动学习用户习惯，优化时间分配。', updatedAt: '2025-01-12' },
  ])
  const [activeId, setActiveId] = useState<string | null>(notes.length > 0 ? notes[0].id : null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState('')

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const sidebarBg = isDark ? '#16213e' : '#e8e8e8'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const selectedBg = isDark ? '#0f3460' : '#c8e6c9'
  const editorBg = isDark ? '#0d1b2a' : '#fff'

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const active = notes.find((n) => n.id === activeId)

  const selectNote = (note: Note) => {
    setActiveId(note.id)
    setEditingTitle(note.title)
    setEditingContent(note.content)
  }

  const createNote = () => {
    const newNote: Note = {
      id: `n${Date.now()}`,
      title: '新建笔记',
      content: '',
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setNotes([newNote, ...notes])
    setActiveId(newNote.id)
    setEditingTitle(newNote.title)
    setEditingContent(newNote.content)
  }

  const saveNote = () => {
    if (!activeId) return
    const date = new Date().toISOString().split('T')[0]
    setNotes(notes.map((n) =>
      n.id === activeId ? { ...n, title: editingTitle || '无标题', content: editingContent, updatedAt: date } : n
    ))
  }

  const deleteNote = () => {
    if (!activeId) return
    const newNotes = notes.filter((n) => n.id !== activeId)
    setNotes(newNotes)
    if (newNotes.length > 0) {
      selectNote(newNotes[0])
    } else {
      setActiveId(null)
      setEditingTitle('')
      setEditingContent('')
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 220, background: sidebarBg, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 10 }}>
          <input
            type="text" placeholder="搜索笔记..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <button onClick={createNote} style={{
          margin: '0 10px 8px', padding: '6px 12px', borderRadius: 6, border: 'none',
          background: isDark ? '#0f3460' : '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 12,
        }}>+ 新建笔记</button>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((n) => (
            <div key={n.id} onClick={() => selectNote(n)} style={{
              padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${borderColor}`,
              background: activeId === n.id ? selectedBg : 'transparent',
              borderLeft: activeId === n.id ? `3px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : '3px solid transparent',
            }}>
              <div style={{ fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.content ? n.content.split('\n')[0].substring(0, 40) : '空笔记'}
              </div>
              <div style={{ fontSize: 10, color: isDark ? '#6b7280' : '#aaa', marginTop: 2 }}>{n.updatedAt}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {active ? (
          <>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: 8, background: sidebarBg }}>
              <input
                type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onBlur={saveNote}
                placeholder="笔记标题"
                style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 14, fontWeight: 600, outline: 'none' }}
              />
              <button onClick={saveNote} style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: isDark ? '#0f3460' : '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 12 }}>保存</button>
              <button onClick={deleteNote} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${isDark ? '#e53935' : '#d32f2f'}`, background: 'transparent', color: isDark ? '#e53935' : '#d32f2f', cursor: 'pointer', fontSize: 12 }}>删除</button>
            </div>
            <textarea
              value={editingContent} onChange={(e) => setEditingContent(e.target.value)} onBlur={saveNote}
              placeholder="开始写笔记..."
              style={{
                flex: 1, padding: 16, border: 'none', background: editorBg, color: textColor,
                fontSize: 13, lineHeight: 1.8, resize: 'none', outline: 'none', fontFamily: 'system-ui, sans-serif',
              }}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#9ca3af' : '#999', fontSize: 14 }}>
            点击「新建笔记」开始记录
          </div>
        )}
      </div>
    </div>
  )
}