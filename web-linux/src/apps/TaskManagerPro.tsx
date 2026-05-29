import React, { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  category: string
  createdAt: Date
  completedAt: Date | null
}

const TaskManagerPro: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('weblinux-tasks')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : null
        }))
      } catch {
        return []
      }
    }
    return [
      {
        id: '1',
        title: '欢迎使用任务管理器',
        description: '这是一个功能完整的任务管理应用。点击下方按钮添加新任务！',
        completed: false,
        priority: 'medium',
        dueDate: null,
        category: '工作',
        createdAt: new Date(),
        completedAt: null
      }
    ]
  })
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt' | 'completedAt'>>({
    title: '',
    description: '',
    completed: false,
    priority: 'medium',
    dueDate: null,
    category: '工作'
  })

  useEffect(() => {
    localStorage.setItem('weblinux-tasks', JSON.stringify(tasks))
  }, [tasks])

  const categories = ['工作', '学习', '生活', '健康', '其他']
  const priorityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336'
  }

  const addTask = () => {
    if (!newTask.title.trim()) return
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date(),
      completedAt: null
    }
    setTasks([task, ...tasks])
    setNewTask({
      title: '',
      description: '',
      completed: false,
      priority: 'medium',
      dueDate: null,
      category: '工作'
    })
    setShowAddModal(false)
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : null
        }
      }
      return task
    }))
  }

  const deleteTask = (id: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      setTasks(tasks.filter(task => task.id !== id))
    }
  }

  const startEdit = (task: Task) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      dueDate: task.dueDate,
      category: task.category
    })
    setShowAddModal(true)
  }

  const saveEdit = () => {
    if (!editingTask || !newTask.title.trim()) return
    setTasks(tasks.map(task => {
      if (task.id === editingTask.id) {
        return {
          ...task,
          ...newTask
        }
      }
      return task
    }))
    setEditingTask(null)
    setNewTask({
      title: '',
      description: '',
      completed: false,
      priority: 'medium',
      dueDate: null,
      category: '工作'
    })
    setShowAddModal(false)
  }

  const clearCompleted = () => {
    if (window.confirm('确定要清除所有已完成的任务吗？')) {
      setTasks(tasks.filter(task => !task.completed))
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16162d 100%)',
      color: '#fff'
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'rgba(139, 124, 240, 0.1)',
        borderBottom: '1px solid rgba(139, 124, 240, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>📋 任务管理器</h1>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #8b7cf0 0%, #7c6ed6 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px'
          }}>
            + 添加任务
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '全部', value: 'all', count: stats.total },
            { label: '进行中', value: 'active', count: stats.active },
            { label: '已完成', value: 'completed', count: stats.completed }
          ].map(({ label, value, count }) => (
            <button key={value} onClick={() => setFilter(value as any)} style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === value ? '2px solid #8b7cf0' : '2px solid rgba(255,255,255,0.1)',
              background: filter === value ? 'rgba(139, 124, 240, 0.2)' : 'transparent',
              color: filter === value ? '#8b7cf0' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === value ? 600 : 400
            }}>
              {label} <span style={{ marginLeft: '6px', opacity: 0.8 }}>({count})</span>
            </button>
          ))}

          {stats.completed > 0 && (
            <button onClick={clearCompleted} style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: 'rgba(244, 67, 54, 0.1)',
              color: '#f44336',
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              清除已完成
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>待办</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.active}</div>
          </div>
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(244, 67, 54, 0.1)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>高优先级</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f44336' }}>{stats.highPriority}</div>
          </div>
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(76, 175, 80, 0.1)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>完成率</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px'
      }}>
        {filteredTasks.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.6
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>暂无任务</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>点击上方按钮添加你的第一个任务</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.map(task => (
              <div key={task.id} style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s ease',
                opacity: task.completed ? 0.6 : 1
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <button onClick={() => toggleTask(task.id)} style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${task.completed ? '#4caf50' : 'rgba(255,255,255,0.3)'}`,
                    background: task.completed ? '#4caf50' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {task.completed && '✓'}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 500,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        flex: 1
                      }}>
                        {task.title}
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: `${priorityColors[task.priority]}20`,
                        color: priorityColors[task.priority]
                      }}>
                        {task.priority === 'low' ? '低' : task.priority === 'medium' ? '中' : '高'}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        background: 'rgba(139, 124, 240, 0.15)',
                        color: '#8b7cf0'
                      }}>
                        {task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '13px',
                        opacity: 0.8,
                        lineHeight: '1.5'
                      }}>
                        {task.description}
                      </p>
                    )}

                    {task.dueDate && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        📅 {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => startEdit(task)} style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(139, 124, 240, 0.15)',
                      color: '#8b7cf0',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      编辑
                    </button>
                    <button onClick={() => deleteTask(task.id)} style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(244, 67, 54, 0.15)',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid rgba(139, 124, 240, 0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {editingTask ? '编辑任务' : '添加新任务'}
              </h2>
              <button onClick={() => {
                setShowAddModal(false)
                setEditingTask(null)
                setNewTask({
                  title: '',
                  description: '',
                  completed: false,
                  priority: 'medium',
                  dueDate: null,
                  category: '工作'
                })
              }} style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '18px'
              }}>
                ×
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  任务标题 *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="输入任务标题..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  描述
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="添加任务描述..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    优先级
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    分类
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  截止日期 (可选)
                </label>
                <input
                  type="date"
                  value={newTask.dueDate || ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value || null })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button onClick={() => {
                setShowAddModal(false)
                setEditingTask(null)
              }} style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                取消
              </button>
              <button onClick={editingTask ? saveEdit : addTask} disabled={!newTask.title.trim()} style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #8b7cf0 0%, #7c6ed6 100%)',
                color: '#fff',
                cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500,
                opacity: newTask.title.trim() ? 1 : 0.5
              }}>
                {editingTask ? '保存修改' : '添加任务'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagerPro
