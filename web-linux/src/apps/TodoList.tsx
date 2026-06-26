import { useState, useEffect } from 'react'
import { useStore } from '../store'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
  priority?: 'low' | 'medium' | 'high'
}

const STORAGE_KEY = 'weblinux-todos'

export default function TodoList() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return [
      { id: '1', text: '完成项目开发文档', completed: true, createdAt: '2025-01-15' },
      { id: '2', text: '修复登录页面的样式问题', completed: false, createdAt: '2025-01-15' },
      { id: '3', text: '编写单元测试用例', completed: false, createdAt: '2025-01-14' },
      { id: '4', text: '代码审查与合并', completed: false, createdAt: '2025-01-14' },
      { id: '5', text: '更新依赖包版本', completed: true, createdAt: '2025-01-13' },
      { id: '6', text: '准备下周 demo 演示', completed: false, createdAt: '2025-01-13' },
    ]
  })
  const [inputText, setInputText] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  
  
  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch {}
  }, [todos])

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const cardBg = isDark ? '#16213e' : '#fff'

  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length

  const addTodo = () => {
    if (!inputText.trim()) return
    const newTodo: Todo = {
      id: `t${Date.now()}`,
      text: inputText.trim(),
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setTodos([newTodo, ...todos])
    setInputText('')
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter((t) => !t.completed))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTodo()
  }

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', textAlign: 'center', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>待办事项</div>
        <div style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#888' }}>{dateStr}</div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <input
          type="text" placeholder="添加新任务..." value={inputText}
          onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, outline: 'none' }}
        />
        <button onClick={addTodo} style={{
          padding: '8px 20px', borderRadius: 8, border: 'none', background: isDark ? '#0f3460' : '#1976d2',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
        }}>添加</button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '0 16px 8px' }}>
        {([
          { key: 'all', label: `全部 (${todos.length})` },
          { key: 'active', label: `进行中 (${activeCount})` },
          { key: 'completed', label: `已完成 (${completedCount})` },
        ] as const).map((f) => (
          <span key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '4px 12px', borderRadius: 14, cursor: 'pointer', fontSize: 12,
            background: filter === f.key ? (isDark ? '#0f3460' : '#1976d2') : (isDark ? '#1a3a5c' : '#e8e8e8'),
            color: filter === f.key ? '#fff' : textColor,
          }}>{f.label}</span>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: isDark ? '#9ca3af' : '#999' }}>
            {filter === 'completed' ? '还没有已完成的任务' : filter === 'active' ? '所有任务已完成！' : '没有任务'}
          </div>
        ) : (
          filtered.map((todo) => (
            <div key={todo.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4,
              background: cardBg, borderRadius: 8, border: `1px solid ${borderColor}`,
            }}>
              <div
                onClick={() => toggleTodo(todo.id)}
                style={{
                  width: 20, height: 20, borderRadius: '50%', border: `2px solid ${todo.completed ? (isDark ? '#4fc3f7' : '#4caf50') : borderColor}`,
                  background: todo.completed ? (isDark ? '#4fc3f7' : '#4caf50') : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 12, color: '#fff', transition: 'all 0.2s',
                }}
              >
                {todo.completed && '✓'}
              </div>
              <span style={{
                flex: 1, fontSize: 13,
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? (isDark ? '#6b7280' : '#aaa') : textColor,
              }}>{todo.text}</span>
              <span style={{ fontSize: 10, color: isDark ? '#6b7280' : '#bbb', whiteSpace: 'nowrap' }}>{todo.createdAt}</span>
              <button onClick={() => deleteTodo(todo.id)} style={{
                padding: '2px 8px', borderRadius: 4, border: 'none', background: 'transparent',
                color: isDark ? '#9ca3af' : '#999', cursor: 'pointer', fontSize: 16, lineHeight: 1,
              }}>×</button>
            </div>
          ))
        )}
      </div>

      {completedCount > 0 && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${borderColor}`, textAlign: 'right' }}>
          <button onClick={clearCompleted} style={{
            padding: '5px 14px', borderRadius: 6, border: 'none', background: isDark ? '#2a1a1a' : '#ffebee',
            color: isDark ? '#e53935' : '#d32f2f', cursor: 'pointer', fontSize: 12,
          }}>清空已完成 ({completedCount})</button>
        </div>
      )}
    </div>
  )
}