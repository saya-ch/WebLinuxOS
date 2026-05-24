import { useState, useEffect } from 'react'
import { useStore } from '../store'

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done'

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  dueDate: string | null
  createdAt: Date
  completedAt: Date | null
}

interface Column {
  id: TaskStatus
  title: string
  color: string
  icon: string
}

const columns: Column[] = [
  { id: 'todo', title: '待办', color: '#6c5ce7', icon: '📝' },
  { id: 'inprogress', title: '进行中', color: '#f39c12', icon: '🚀' },
  { id: 'review', title: '审核', color: '#3498db', icon: '🔍' },
  { id: 'done', title: '完成', color: '#27ae60', icon: '✅' },
]

const priorityColors = {
  low: '#95a5a6',
  medium: '#3498db',
  high: '#f39c12',
  urgent: '#e74c3c',
}

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const sampleTasks: Task[] = [
  {
    id: '1',
    title: '设计新功能 UI',
    description: '为新的统计面板设计用户界面',
    status: 'todo',
    priority: 'high',
    tags: ['设计', 'UI'],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(),
    completedAt: null,
  },
  {
    id: '2',
    title: '编写代码文档',
    description: '完善项目的 README 和 API 文档',
    status: 'inprogress',
    priority: 'medium',
    tags: ['文档'],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(),
    completedAt: null,
  },
  {
    id: '3',
    title: '修复登录 Bug',
    description: '用户在特定情况下无法登录的问题',
    status: 'review',
    priority: 'urgent',
    tags: ['Bug', '高优先级'],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(),
    completedAt: null,
  },
  {
    id: '4',
    title: '完成开发环境配置',
    description: '配置项目的开发和测试环境',
    status: 'done',
    priority: 'low',
    tags: ['环境'],
    dueDate: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(),
  },
]

export default function TaskDashboard() {
  const theme = useStore((s) => s.theme)
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('weblinux-tasks')
    if (saved) {
      try {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
        }))
      } catch {
        return sampleTasks
      }
    }
    return sampleTasks
  })
  
  const [showModal, setShowModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    tags: [],
    dueDate: '',
  })
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [statsView, setStatsView] = useState(false)

  // 保存到 LocalStorage
  useEffect(() => {
    localStorage.setItem('weblinux-tasks', JSON.stringify(tasks))
  }, [tasks])

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)))

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.some((tag) => task.tags.includes(tag))
    return matchesSearch && matchesTags
  })

  const addTask = () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      tags: newTask.tags,
      dueDate: newTask.dueDate || null,
      createdAt: new Date(),
      completedAt: null,
    }

    setTasks([...tasks, task])
    setNewTask({ title: '', description: '', priority: 'medium', tags: [], dueDate: '' })
    setShowModal(false)
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map((task) => 
      task.id === taskId ? { ...task, ...updates } : task
    ))
  }

  const deleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      setTasks(tasks.filter((t) => t.id !== taskId))
    }
  }

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'done' ? new Date() : null,
        }
      }
      return task
    }))
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== status) {
      moveTask(draggedTask.id, status)
    }
    setDraggedTask(null)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'light' ? '#f5f5f7' : '#1e1e2e',
      color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '16px',
        background: theme === 'light' ? '#ffffff' : '#252536',
        borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginRight: 'auto',
        }}>
          <span style={{ fontSize: '28px' }}>📊</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>协作任务看板</div>
            <div style={{ fontSize: '12px', color: theme === 'light' ? '#8e8e93' : '#9090a4' }}>
              管理项目进度，高效协作
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#f5f5f7' : '#1a1a2e',
              color: 'inherit',
              fontSize: '13px',
              outline: 'none',
              width: '200px',
            }}
          />
          <button
            onClick={() => setStatsView(!statsView)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#ffffff' : '#252536',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📈 {statsView ? '看板视图' : '统计视图'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ➕ 新建任务
          </button>
        </div>
      </div>

      {/* 标签过滤 */}
      {allTags.length > 0 && (
        <div style={{
          padding: '10px 16px',
          background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
          borderBottom: `1px solid ${theme === 'light' ? '#e5e5e5' : '#2a2a4e'}`,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: theme === 'light' ? '#8e8e93' : '#9090a4', marginRight: '8px' }}>
            🏷️ 标签:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                border: selectedTags.includes(tag) ? '2px solid #6c5ce7' : 'none',
                background: selectedTags.includes(tag) ? 'rgba(108, 92, 231, 0.15)' : (theme === 'light' ? '#e5e5e5' : '#3a3a5c'),
                color: selectedTags.includes(tag) ? '#6c5ce7' : 'inherit',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflow: 'auto',
      }}>
        {statsView ? (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}>
              {[
                { label: '总任务', value: stats.total, color: '#6c5ce7', icon: '📋' },
                { label: '待办', value: stats.todo, color: '#9b59b6', icon: '📝' },
                { label: '进行中', value: stats.inprogress, color: '#f39c12', icon: '🚀' },
                { label: '已完成', value: stats.done, color: '#27ae60', icon: '✅' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: theme === 'light' ? '#ffffff' : '#252536',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: stat.color,
                    marginBottom: '4px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: theme === 'light' ? '#666' : '#9090a4',
                    fontWeight: 600,
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {stats.urgent > 0 && (
              <div style={{
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid #e74c3c',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{ fontSize: '28px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#e74c3c' }}>紧急任务提醒</div>
                  <div style={{ fontSize: '13px', color: theme === 'light' ? '#666' : '#9090a4' }}>
                    您有 {stats.urgent} 个未完成的紧急任务需要关注
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: theme === 'light' ? '#ffffff' : '#252536',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>任务完成趋势</h3>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px',
                height: '200px',
                padding: '20px 0',
              }}>
                {['一', '二', '三', '四', '五', '六', '日'].map((day) => {
                  const height = 30 + Math.random() * 150
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '100%',
                        height: `${height}px`,
                        background: 'linear-gradient(180deg, #6c5ce7, #a29bfe)',
                        borderRadius: '8px 8px 0 0',
                      }} />
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: theme === 'light' ? '#666' : '#9090a4',
                      }}>
                        周{day}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '16px',
            height: '100%',
            minHeight: '500px',
          }}>
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id)
              return (
                <div
                  key={column.id}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: theme === 'light' ? '#ffffff' : '#252536',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div style={{
                    padding: '12px 16px',
                    background: `${column.color}15`,
                    borderBottom: `2px solid ${column.color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{column.icon}</span>
                      <span style={{ fontWeight: 700, color: column.color }}>{column.title}</span>
                    </div>
                    <span style={{
                      background: column.color,
                      color: '#fff',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {columnTasks.length}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    padding: '12px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}>
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        theme={theme}
                        onDragStart={handleDragStart}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                        onMove={moveTask}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建任务模态框 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
        }}>
          <div style={{
            background: theme === 'light' ? '#ffffff' : '#252536',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>
              ➕ 新建任务
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                任务标题
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
                  border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                  background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
                  color: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
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
                  border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                  background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
                  color: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  优先级
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                    background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  截止日期
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                    background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={addTask}
                disabled={!newTask.title.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newTask.title.trim() ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : '#999',
                  color: '#fff',
                  cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({
  task,
  theme,
  onDragStart,
  onUpdate,
  onDelete,
  onMove,
}: {
  task: Task
  theme: 'dark' | 'light'
  onDragStart: (e: React.DragEvent, task: Task) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onMove: (id: string, status: TaskStatus) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !task.tags.includes(tagInput.trim())) {
      onUpdate(task.id, { tags: [...task.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onUpdate(task.id, { tags: task.tags.filter((t) => t !== tagToRemove) })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
        borderRadius: '10px',
        padding: '14px',
        cursor: 'grab',
        border: `1px solid ${theme === 'light' ? '#e5e5e5' : '#2a2a4e'}`,
        transition: 'all 0.2s',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              background: `${priorityColors[task.priority]}20`,
              color: priorityColors[task.priority],
            }}>
              {priorityLabels[task.priority]}
            </span>
            {isOverdue && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(231, 76, 60, 0.2)',
                color: '#e74c3c',
              }}>
                ⏰ 已过期
              </span>
            )}
          </div>

          <div style={{
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '6px',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            opacity: task.status === 'done' ? 0.6 : 1,
          }}>
            {task.title}
          </div>

          {task.description && (
            <div style={{
              fontSize: '12px',
              color: theme === 'light' ? '#666' : '#9090a4',
              marginBottom: '10px',
              display: isExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {task.description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: theme === 'light' ? '#666' : '#9090a4',
              fontSize: '12px',
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#e74c3c',
              fontSize: '14px',
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {task.tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '8px',
        }}>
          {task.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => removeTag(tag)}
              style={{
                background: 'rgba(108, 92, 231, 0.15)',
                color: '#6c5ce7',
                padding: '3px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {task.dueDate && (
        <div style={{
          fontSize: '11px',
          color: theme === 'light' ? '#8e8e93' : '#9090a4',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          📅 {new Date(task.dueDate).toLocaleDateString('zh-CN')}
        </div>
      )}

      {isExpanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme === 'light' ? '#e5e5e5' : '#2a2a4e'}` }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {columns.map((col) => (
              col.id !== task.status && (
                <button
                  key={col.id}
                  onClick={() => onMove(task.id, col.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: `${col.color}20`,
                    color: col.color,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {col.icon} 移至{col.title}
                </button>
              )
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="添加标签..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                background: theme === 'light' ? '#fff' : '#252536',
                color: 'inherit',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              onClick={addTag}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#6c5ce7',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              添+
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
