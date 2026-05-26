import { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2, Edit2, Clock } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'inprogress' | 'done'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  createdAt: string
}

interface Column {
  id: 'todo' | 'inprogress' | 'done'
  title: string
  color: string
}

const columns: Column[] = [
  { id: 'todo', title: '待办事项', color: '#ef4444' },
  { id: 'inprogress', title: '进行中', color: '#f59e0b' },
  { id: 'done', title: '已完成', color: '#10b981' },
]

const initialTasks: Task[] = [
  {
    id: '1',
    title: '学习 React 19',
    description: '探索 React 19 的新特性',
    status: 'todo',
    priority: 'high',
    tags: ['学习', 'React'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '优化 WebLinuxOS',
    description: '提升应用性能',
    status: 'inprogress',
    priority: 'high',
    tags: ['开发', '优化'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: '设计新图标',
    description: '创建新的应用图标',
    status: 'done',
    priority: 'medium',
    tags: ['设计', 'UI'],
    createdAt: new Date().toISOString(),
  },
]

const priorityColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'tags'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dropZone, setDropZone] = useState<string | null>(null)

  const addTask = useCallback(() => {
    if (!newTask.title.trim()) return
    
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      createdAt: new Date().toISOString(),
    }
    
    setTasks(prev => [...prev, task])
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      tags: [],
    })
    setShowModal(false)
  }, [newTask])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const addTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && !newTask.tags.includes(tag)) {
      setNewTask(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }, [tagInput, newTask.tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }))
  }, [])

  const moveTask = useCallback((taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => {
    updateTask(taskId, { status: newStatus })
    setDraggedTask(null)
    setDropZone(null)
  }, [updateTask])

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropZone(columnId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropZone(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (draggedTask) {
      moveTask(draggedTask, columnId as 'todo' | 'inprogress' | 'done')
    }
  }, [draggedTask, moveTask])

  const tasksByColumn = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = tasks.filter(t => t.status === col.id)
      return acc
    }, {} as Record<string, Task[]>)
  }, [tasks])

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasksByColumn.todo?.length || 0,
      inprogress: tasksByColumn.inprogress?.length || 0,
      done: tasksByColumn.done?.length || 0,
    }
  }, [tasks, tasksByColumn])

  return (
    <div className="app-container app-taskboard" style={{ 
      background: '#1a1a2e', 
      padding: 16, 
      height: '100%', 
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 头部 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 24 }}>📋 任务看板</h2>
          <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: 13 }}>
            管理你的日常任务和项目进度
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Plus size={18} />
          新建任务
        </button>
      </div>

      {/* 统计卡片 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 12, 
        marginBottom: 20,
      }}>
        {[
          { label: '总任务', value: stats.total, color: '#6366f1', icon: '📊' },
          { label: '待办', value: stats.todo, color: '#ef4444', icon: '📝' },
          { label: '进行中', value: stats.inprogress, color: '#f59e0b', icon: '🚀' },
          { label: '已完成', value: stats.done, color: '#10b981', icon: '✅' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
            border: `1px solid ${stat.color}30`,
            borderRadius: 16,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 看板列 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 16, 
        flex: 1,
        minHeight: 0,
      }}>
        {columns.map(col => (
          <div
            key={col.id}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              border: dropZone === col.id ? `2px dashed ${col.color}` : '2px solid transparent',
              transition: 'border 0.2s, background 0.2s',
            }}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  background: col.color,
                }} />
                <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>{col.title}</h3>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#aaa',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 12,
                }}>
                  {tasksByColumn[col.id]?.length || 0}
                </span>
              </div>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingRight: 4,
            }}>
              {tasksByColumn[col.id]?.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 14,
                    cursor: 'grab',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    opacity: draggedTask === task.id ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (draggedTask !== task.id) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        color: '#fff', 
                        margin: '0 0 8px 0', 
                        fontSize: 14,
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        opacity: task.status === 'done' ? 0.7 : 1,
                      }}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p style={{ 
                          color: '#aaa', 
                          margin: '0 0 10px 0', 
                          fontSize: 12,
                          lineHeight: 1.4,
                        }}>
                          {task.description}
                        </p>
                      )}
                      
                      {task.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {task.tags.map((tag, i) => (
                            <span key={i} style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              color: '#a5b4fc',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: `${priorityColors[task.priority]}20`,
                          color: priorityColors[task.priority],
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          {priorityLabels[task.priority]}优先级
                        </span>
                        
                        <span style={{
                          color: '#666',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <Clock size={12} />
                          {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        onClick={() => {
                          setEditingTask(task)
                          setNewTask({
                            title: task.title,
                            description: task.description,
                            status: task.status,
                            priority: task.priority,
                            tags: [...task.tags],
                          })
                          setShowModal(true)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 6,
                          transition: 'background 0.2s, color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                          e.currentTarget.style.color = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none'
                          e.currentTarget.style.color = '#888'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 6,
                          transition: 'background 0.2s, color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none'
                          e.currentTarget.style.color = '#888'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 新建/编辑任务弹窗 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ 
              color: '#fff', 
              margin: '0 0 20px 0', 
              fontSize: 20,
            }}>
              {editingTask ? '✏️ 编辑任务' : '➕ 新建任务'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  任务标题 *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入任务标题..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  任务描述
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入任务描述..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 6 }}>
                    状态
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="todo">待办</option>
                    <option value="inprogress">进行中</option>
                    <option value="done">已完成</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 6 }}>
                    优先级
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  标签
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {newTask.tags.map((tag, i) => (
                    <span key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                    }}>
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#a5b4fc',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="添加标签，按 Enter 确认..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={addTag}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(99, 102, 241, 0.3)',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    添加
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#aaa',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (editingTask) {
                      updateTask(editingTask.id, newTask)
                      setEditingTask(null)
                    } else {
                      addTask()
                    }
                    setShowModal(false)
                  }}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingTask ? '保存更改' : '创建任务'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
