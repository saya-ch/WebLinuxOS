import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Layout,
  Plus,
  Trash2,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Lightbulb,
  CalendarCheck,
  Timer
} from 'lucide-react'

// --- Types ---
interface Member {
  id: string
  name: string
  avatar: string
  role: string
  color: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'inprogress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  tags: string[]
  dueDate?: string
  createdAt: string
  completedAt?: string
}

interface Project {
  id: string
  title: string
  description: string
  color: string
  members: string[]
  tasks: Task[]
  createdAt: string
}

// --- Constants & Initial Data ---
const DEFAULT_MEMBERS: Member[] = [
  { id: 'm1', name: '张三', role: '项目经理', avatar: '👨‍💼', color: '#6366f1' },
  { id: 'm2', name: '李四', role: '前端开发', avatar: '👨‍💻', color: '#06b6d4' },
  { id: 'm3', name: '王五', role: '后端开发', avatar: '👩‍💻', color: '#8b5cf6' },
  { id: 'm4', name: '赵六', role: '设计师', avatar: '🎨', color: '#ec4899' },
]

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'WebLinux OS 开发',
    description: '构建一个功能完整的Web操作系统',
    color: '#6366f1',
    members: ['m1', 'm2', 'm3', 'm4'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      {
        id: 't1', title: '优化启动速度', description: '减少首屏加载时间',
        status: 'done', priority: 'high', assigneeId: 'm2',
        tags: ['性能', '前端'],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 't2', title: '设计新的 UI 主题', description: '创建现代化的暗色和亮色主题',
        status: 'inprogress', priority: 'medium', assigneeId: 'm4',
        tags: ['设计', 'UI'],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 't3', title: '实现云同步功能', description: '支持数据备份和恢复',
        status: 'todo', priority: 'high', assigneeId: 'm3',
        tags: ['后端', '云服务'],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 't4', title: '修复已知 BUG', description: '修复用户报告的问题',
        status: 'review', priority: 'urgent', assigneeId: 'm2',
        tags: ['Bug', '测试'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'p2',
    title: '个人学习计划',
    description: '学习新的技术栈',
    color: '#10b981',
    members: ['m1'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      {
        id: 't5', title: '学习 React 19', description: '深入了解新特性',
        status: 'inprogress', priority: 'high', assigneeId: 'm1',
        tags: ['学习', 'React'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 't6', title: '阅读 TypeScript 文档', description: '提升类型系统的使用',
        status: 'todo', priority: 'medium', assigneeId: 'm1',
        tags: ['学习', 'TypeScript'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
]

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const STATUS_LABELS: Record<string, string> = {
  todo: '待办',
  inprogress: '进行中',
  review: '审核中',
  done: '完成',
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#6b7280',
  inprogress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
}

// --- Helper Functions ---
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const getDaysLeft = (dueDateStr?: string) => {
  if (!dueDateStr) return null
  const today = new Date()
  const due = new Date(dueDateStr)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// --- Components ---
const Avatar = ({ name, avatar, color, size = 'md' }: { name: string; avatar: string; color?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-lg'
  }
  
  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white/10`}
      style={{ backgroundColor: color || '#6366f1' }}
      title={name}
    >
      {avatar}
    </div>
  )
}

const Tag = ({ children, color = 'bg-gray-600' }: { children: React.ReactNode; color?: string }) => (
  <span 
    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
    style={{ backgroundColor: color }}
  >
    {children}
  </span>
)

const TaskCard = ({ task, members, onUpdate, onDelete }: { 
  task: Task; 
  members: Member[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) => {
  const assignee = members.find(m => m.id === task.assigneeId)
  const daysLeft = task.dueDate ? getDaysLeft(task.dueDate) : null

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span 
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ 
            backgroundColor: `${PRIORITY_COLORS[task.priority]}20`, 
            color: PRIORITY_COLORS[task.priority] 
          }}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        <div className="flex gap-1">
          <button 
            onClick={() => onUpdate(task.id, { status: 'done' })}
            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-green-400"
            title="标记完成"
          >
            <CheckCircle2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-red-400"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h4 className="font-medium text-white mb-1 leading-tight">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.map((tag, i) => (
          <Tag key={i}>{tag}</Tag>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          {assignee && <Avatar name={assignee.name} avatar={assignee.avatar} color={assignee.color} size="sm" />}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${daysLeft && daysLeft < 0 ? 'text-red-400' : 'text-gray-500'}`}>
              <CalendarCheck size={12} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          创建于 {formatDate(task.createdAt)}
        </span>
      </div>
    </div>
  )
}

// --- Main Component ---
export default function SmartProjectHub() {
  // State
  const [activeView, setActiveView] = useState<'dashboard' | 'board' | 'timeline'>('dashboard')
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('weblinux-smart-projects')
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS
  })
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0],
  [projects, activeProjectId])

  const filteredTasks = useMemo(() => {
    if (!activeProject) return []
    let tasks = [...activeProject.tasks]
    if (searchTerm) {
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterStatus !== 'all') {
      tasks = tasks.filter(t => t.status === filterStatus)
    }
    return tasks
  }, [activeProject, searchTerm, filterStatus])

  const stats = useMemo(() => {
    if (!activeProject) return { total: 0, todo: 0, inprogress: 0, done: 0, urgent: 0 }
    return {
      total: activeProject.tasks.length,
      todo: activeProject.tasks.filter(t => t.status === 'todo').length,
      inprogress: activeProject.tasks.filter(t => t.status === 'inprogress' || t.status === 'review').length,
      done: activeProject.tasks.filter(t => t.status === 'done').length,
      urgent: activeProject.tasks.filter(t => t.priority === 'urgent').length,
    }
  }, [activeProject])

  // Effects
  useEffect(() => {
    localStorage.setItem('weblinux-smart-projects', JSON.stringify(projects))
  }, [projects])

  const addTask = useCallback((newTask: Omit<Task, 'id' | 'createdAt'>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p
      return {
        ...p,
        tasks: [
          ...p.tasks,
          {
            ...newTask,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          }
        ]
      }
    }))
  }, [activeProjectId])

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }
    }))
  }, [activeProjectId])

  const deleteTask = useCallback((taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p
      return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
    }))
  }, [activeProjectId])

  const addProject = (title: string, description: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title,
      description,
      color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
      members: ['m1'],
      tasks: [],
      createdAt: new Date().toISOString()
    }
    setProjects([newProject, ...projects])
    setActiveProjectId(newProject.id)
    setShowNewProject(false)
  }

  // Render Views
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="总任务" value={stats.total} icon={<Target size={18} />} color="#6366f1" />
        <StatCard label="待办" value={stats.todo} icon={<Clock size={18} />} color="#6b7280" />
        <StatCard label="进行中" value={stats.inprogress} icon={<Timer size={18} />} color="#3b82f6" />
        <StatCard label="已完成" value={stats.done} icon={<CheckCircle2 size={18} />} color="#10b981" />
        <StatCard label="紧急" value={stats.urgent} icon={<AlertCircle size={18} />} color="#ef4444" />
      </div>

      {/* Suggestions & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
            <Lightbulb className="text-yellow-400" size={20} />
            智能建议
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <div className="mt-1 w-2 h-2 rounded-full bg-green-400" />
              建议优先处理紧急任务
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 w-2 h-2 rounded-full bg-blue-400" />
              可以添加更多任务标签以便分类
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 w-2 h-2 rounded-full bg-purple-400" />
              完成率不错！继续保持
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
            <Clock size={20} />
            最新任务
          </h3>
          <div className="space-y-3">
            {[...activeProject.tasks].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).slice(0, 4).map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-sm truncate text-white">{task.title}</span>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${STATUS_COLORS[task.status]}20`, 
                    color: STATUS_COLORS[task.status] 
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Task List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">所有任务</h3>
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> 新建任务
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无任务</div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                members={DEFAULT_MEMBERS}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderBoard = () => {
    const columns: { id: string; title: string }[] = [
      { id: 'todo', title: '待办' },
      { id: 'inprogress', title: '进行中' },
      { id: 'review', title: '审核中' },
      { id: 'done', title: '完成' }
    ]

    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map(col => {
              const colTasks = activeProject.tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id} className="w-72 flex-shrink-0 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-3 border-b border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[col.id] }}
                        />
                        <h3 className="font-semibold text-sm text-white">{col.title}</h3>
                      </div>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white">{colTasks.length}</span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {colTasks.map(task => (
                      <div key={task.id} className="group">
                        <TaskCard 
                          task={task} 
                          members={DEFAULT_MEMBERS}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                        />
                        {/* Quick status changer */}
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {columns.map(c => (
                            <button
                              key={c.id}
                              onClick={() => updateTask(task.id, { status: c.id as 'todo' | 'inprogress' | 'review' | 'done' })}
                              className={`text-[10px] px-2 py-1 rounded-full ${task.status === c.id ? 'bg-white/20 text-white' : 'bg-transparent hover:bg-white/10 text-gray-400'}`}
                            >
                              {c.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <button
                      onClick={() => {
                        // Quick add task to this column
                        setShowNewTask(true)
                        // We could pre-set the status here with a prop
                      }}
                      className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Plus size={16} /> 添加任务
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderTimeline = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-xl font-bold text-white">项目时间线</h2>
      <div className="relative border-l-2 border-white/20 ml-4 space-y-8">
        {[...activeProject.tasks].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ).map(task => (
          <div key={task.id} className="relative pl-8">
            <div 
              className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-[#1a1a2e]"
              style={{ backgroundColor: STATUS_COLORS[task.status] }}
            />
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">{task.title}</h4>
                <span className="text-xs text-gray-500">{formatDate(task.createdAt)}</span>
              </div>
              {task.description && <p className="text-sm text-gray-400 mb-2">{task.description}</p>}
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${STATUS_COLORS[task.status]}20`, 
                    color: STATUS_COLORS[task.status] 
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </span>
                {task.assigneeId && (
                  <span className="text-xs text-gray-500">
                    负责人: {DEFAULT_MEMBERS.find(m => m.id === task.assigneeId)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e] text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#16213e]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectId(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    p.id === activeProjectId 
                      ? 'bg-white/10 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.title}
                </button>
              ))}
              <button
                onClick={() => setShowNewProject(true)}
                className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-dashed border-white/10 flex items-center gap-2"
              >
                <Plus size={16} /> 新项目
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 w-64"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
            >
              <option value="all">所有状态</option>
              <option value="todo">待办</option>
              <option value="inprogress">进行中</option>
              <option value="review">审核中</option>
              <option value="done">完成</option>
            </select>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 mt-4 border-b border-white/10">
          {[
            { id: 'dashboard', label: '仪表盘', icon: Layout },
            { id: 'board', label: '看板', icon: Target },
            { id: 'timeline', label: '时间线', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'board' | 'timeline')}
                className={`flex items-center gap-2 px-4 py-2.5 -mb-px text-sm font-medium transition-colors ${
                  activeView === tab.id
                    ? 'text-white border-b-2 border-blue-500 bg-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-6 overflow-y-auto">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'board' && renderBoard()}
        {activeView === 'timeline' && renderTimeline()}
      </div>

      {/* Modals */}
      {showNewProject && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">创建新项目</h3>
            <ProjectForm 
              onSubmit={addProject} 
              onCancel={() => setShowNewProject(false)} 
            />
          </div>
        </div>
      )}

      {showNewTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">添加新任务</h3>
            <TaskForm 
              members={DEFAULT_MEMBERS}
              onSubmit={(data) => {
                addTask(data)
                setShowNewTask(false)
              }}
              onCancel={() => setShowNewTask(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-components for forms
function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

function ProjectForm({ onSubmit, onCancel }: { onSubmit: (title: string, desc: string) => void, onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  
  return (
    <div className="space-y-4">
      <input
        autoFocus
        placeholder="项目名称"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
      />
      <textarea
        placeholder="项目描述"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 min-h-[100px]"
      />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white">取消</button>
        <button 
          onClick={() => title && onSubmit(title, desc)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          创建
        </button>
      </div>
    </div>
  )
}

interface TaskFormData {
  title: string
  description: string
  status: 'todo' | 'inprogress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  tags: string
  dueDate: string
}

interface TaskFormSubmitData {
  title: string
  description: string
  status: 'todo' | 'inprogress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  tags: string[]
  dueDate: string
}

function TaskForm({ 
  members, 
  onSubmit, 
  onCancel 
}: { 
  members: Member[], 
  onSubmit: (data: TaskFormSubmitData) => void, 
  onCancel: () => void 
}) {
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: members[0]?.id,
    tags: '',
    dueDate: ''
  })

  const handleSubmit = () => {
    if (!form.title) return
    onSubmit({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="space-y-4">
      <input
        autoFocus
        placeholder="任务标题"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
      />
      <textarea
        placeholder="任务描述"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 min-h-[80px]"
      />
      <div className="grid grid-cols-2 gap-4">
        <select 
          value={form.priority}
          onChange={e => setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
        >
          <option value="low">低优先级</option>
          <option value="medium">中优先级</option>
          <option value="high">高优先级</option>
          <option value="urgent">紧急</option>
        </select>
        <select 
          value={form.assigneeId}
          onChange={e => setForm({ ...form, assigneeId: e.target.value })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
        >
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name} - {m.role}</option>
          ))}
        </select>
      </div>
      <input
        type="date"
        value={form.dueDate}
        onChange={e => setForm({ ...form, dueDate: e.target.value })}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
      />
      <input
        placeholder="标签 (用逗号分隔)"
        value={form.tags}
        onChange={e => setForm({ ...form, tags: e.target.value })}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
      />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white">取消</button>
        <button 
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          添加
        </button>
      </div>
    </div>
  )
}
