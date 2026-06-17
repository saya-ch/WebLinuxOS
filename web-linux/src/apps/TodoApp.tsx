import { useState, useCallback, useEffect, memo } from 'react'

interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  category: string
  dueDate?: Date
  createdAt: Date
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
]

const TodoApp = memo(function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('weblinux-todos')
    if (saved) {
      try {
        return JSON.parse(saved).map((t: Todo) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        }))
      } catch {
        return []
      }
    }
    return [
      {
        id: 'welcome-1',
        text: '欢迎使用待办事项应用',
        completed: false,
        priority: 'medium',
        category: 'personal',
        createdAt: new Date(),
      },
      {
        id: 'welcome-2',
        text: '点击左侧分类筛选任务',
        completed: false,
        priority: 'low',
        category: 'personal',
        createdAt: new Date(),
      },
      {
        id: 'welcome-3',
        text: '试试添加新任务',
        completed: true,
        priority: 'high',
        category: 'work',
        createdAt: new Date(),
      },
    ]
  })
  
  const [categories] = useState<Category[]>(defaultCategories)
  const [activeCategory, setActiveCategory] = useState('all')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [inputText, setInputText] = useState('')
  const [inputPriority, setInputPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [inputCategory, setInputCategory] = useState('personal')
  const [inputDueDate, setInputDueDate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 })
  
  // 保存到localStorage
  useEffect(() => {
    localStorage.setItem('weblinux-todos', JSON.stringify(todos))
    setStats({
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
    })
  }, [todos])
  
  const filteredTodos = useCallback(() => {
    let result = todos
    
    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory)
    }
    
    if (filter === 'active') {
      result = result.filter(t => !t.completed)
    } else if (filter === 'completed') {
      result = result.filter(t => t.completed)
    }
    
    if (searchQuery) {
      result = result.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    
    // 按优先级和日期排序
    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [todos, activeCategory, filter, searchQuery])
  
  const addTodo = useCallback(() => {
    if (!inputText.trim()) return
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: inputText.trim(),
      completed: false,
      priority: inputPriority,
      category: inputCategory,
      dueDate: inputDueDate ? new Date(inputDueDate) : undefined,
      createdAt: new Date(),
    }
    
    setTodos(prev => [...prev, newTodo])
    setInputText('')
    setInputDueDate('')
  }, [inputText, inputPriority, inputCategory, inputDueDate])
  
  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed }
      }
      return t
    }))
  }, [])
  
  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])
  
  const startEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }, [])
  
  const saveEdit = useCallback(() => {
    if (!editingId || !editText.trim()) return
    
    setTodos(prev => prev.map(t => {
      if (t.id === editingId) {
        return { ...t, text: editText.trim() }
      }
      return t
    }))
    setEditingId(null)
    setEditText('')
  }, [editingId, editText])
  
  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])
  
  const getPriorityColor = useCallback((priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#f5576c'
      case 'medium': return '#667eea'
      case 'low': return '#4ec9b0'
    }
  }, [])
  
  const getCategoryColor = useCallback((categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.color || '#667eea'
  }, [categories])
  
  const formatDate = useCallback((date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return `已过期 ${Math.abs(days)} 天`
    if (days === 0) return '今天'
    if (days === 1) return '明天'
    if (days <= 7) return `${days} 天后`
    return date.toLocaleDateString()
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
        width: 260,
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Stats */}
        <div style={{
          padding: 20,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
          }}>
            待办事项
          </div>
          <div style={{
            display: 'flex',
            gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.pending}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>待完成</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.completed}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>已完成</div>
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <div style={{ padding: 16 }}>
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
                {cat.id === 'all' ? todos.length : todos.filter(t => t.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>
        
        {/* Filters */}
        <div style={{ padding: 16 }}>
          <div style={{
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            fontWeight: 600,
          }}>
            状态筛选
          </div>
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: filter === f ? '#f0f4f8' : 'transparent',
                border: 'none',
                borderRadius: 6,
                color: '#333',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              {f === 'all' ? '全部' : f === 'active' ? '待完成' : '已完成'}
            </button>
          ))}
        </div>
        
        {/* Clear Completed */}
        {stats.completed > 0 && (
          <div style={{ padding: 16 }}>
            <button
              onClick={clearCompleted}
              style={{
                width: '100%',
                padding: 10,
                background: '#f5576c',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              清除已完成 ({stats.completed})
            </button>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务..."
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
        
        {/* Add Todo */}
        <div style={{
          padding: 16,
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodo()
              }}
              placeholder="添加新任务..."
              style={{
                flex: 1,
                padding: 12,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <select
              value={inputPriority}
              onChange={(e) => setInputPriority(e.target.value as 'low' | 'medium' | 'high')}
              style={{
                padding: 10,
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
            <select
              value={inputCategory}
              onChange={(e) => setInputCategory(e.target.value)}
              style={{
                padding: 10,
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
              type="date"
              value={inputDueDate}
              onChange={(e) => setInputDueDate(e.target.value)}
              style={{
                padding: 10,
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <button
              onClick={addTodo}
              disabled={!inputText.trim()}
              style={{
                padding: '12px 20px',
                background: inputText.trim() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e0e0e0',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              添加
            </button>
          </div>
        </div>
        
        {/* Todo List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}>
          {filteredTodos().length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#666',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16 }}>暂无任务</div>
              <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
                添加新任务开始管理你的待办事项
              </div>
            </div>
          ) : (
            filteredTodos().map(todo => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  background: '#fff',
                  borderRadius: 8,
                  marginBottom: 8,
                  border: todo.completed ? '1px solid #e0e0e0' : `2px solid ${getPriorityColor(todo.priority)}`,
                  opacity: todo.completed ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: `2px solid ${getPriorityColor(todo.priority)}`,
                    background: todo.completed ? getPriorityColor(todo.priority) : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {todo.completed && (
                    <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
                  )}
                </button>
                
                {/* Content */}
                <div style={{ flex: 1 }}>
                  {editingId === todo.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={saveEdit}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #667eea',
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: 14,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? '#666' : '#333',
                    }}>
                      {todo.text}
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}>
                    <span style={{
                      fontSize: 12,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: getCategoryColor(todo.category),
                      color: '#fff',
                    }}>
                      {categories.find(c => c.id === todo.category)?.name}
                    </span>
                    <span style={{
                      fontSize: 12,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: getPriorityColor(todo.priority),
                      color: '#fff',
                    }}>
                      {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                    </span>
                    {todo.dueDate && (
                      <span style={{
                        fontSize: 12,
                        color: todo.dueDate.getTime() < new Date().getTime() && !todo.completed 
                          ? '#f5576c' 
                          : '#666',
                      }}>
                        📅 {formatDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                }}>
                  {!todo.completed && (
                    <button
                      onClick={() => startEdit(todo)}
                      style={{
                        padding: 6,
                        background: 'transparent',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    style={{
                      padding: 6,
                      background: 'transparent',
                      border: 'none',
                      color: '#f5576c',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: 12,
          background: '#fff',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
          fontSize: 12,
          color: '#666',
        }}>
          {stats.pending > 0 && (
            <span>还有 {stats.pending} 个任务待完成</span>
          )}
          {stats.pending === 0 && stats.total > 0 && (
            <span style={{ color: '#4ec9b0' }}>🎉 所有任务已完成！</span>
          )}
        </div>
      </div>
    </div>
  )
})

export default TodoApp