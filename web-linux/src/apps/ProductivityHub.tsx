import { useState, useEffect, useMemo, useCallback } from 'react'

type Priority = 'low' | 'medium' | 'high'
type TaskStatus = 'todo' | 'doing' | 'done'

interface Task {
  id: string
  title: string
  category: string
  priority: Priority
  status: TaskStatus
  createdAt: number
  completedAt?: number
  estimatedMinutes?: number
  trackedSeconds: number
  runningTimerStartedAt?: number
}

interface DailyGoal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  date: string
}

interface QuickNote {
  id: string
  content: string
  color: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'weblinux-productivity-hub-v1'

interface Store {
  tasks: Task[]
  goals: DailyGoal[]
  notes: QuickNote[]
  categories: string[]
}

const DEFAULT_CATEGORIES = ['工作', '学习', '生活', '健康', '副业']
const NOTE_COLORS = ['#7C6CF0', '#4ECCA3', '#F5C542', '#E94560', '#3A9BDC', '#FF6B9D']

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { tasks: [], goals: [], notes: [], categories: DEFAULT_CATEGORIES }
    const parsed = JSON.parse(raw) as Store
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : DEFAULT_CATEGORIES,
    }
  } catch {
    return { tasks: [], goals: [], notes: [], categories: DEFAULT_CATEGORIES }
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  low: 'border-emerald-500/40 text-emerald-300',
  medium: 'border-amber-500/40 text-amber-300',
  high: 'border-rose-500/40 text-rose-300',
}

const PRIORITY_LABEL: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

type Tab = 'tasks' | 'goals' | 'notes' | 'stats'

export default function ProductivityHub() {
  const initial = useMemo(() => loadStore(), [])
  const [tasks, setTasks] = useState<Task[]>(initial.tasks)
  const [goals, setGoals] = useState<DailyGoal[]>(initial.goals)
  const [notes, setNotes] = useState<QuickNote[]>(initial.notes)
  const [categories, setCategories] = useState<string[]>(initial.categories)
  const [tab, setTab] = useState<Tab>('tasks')

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState(initial.categories[0] || '工作')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium')
  const [newTaskEstimate, setNewTaskEstimate] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [taskFilter, setTaskFilter] = useState<'all' | TaskStatus>('all')
  const [taskSearch, setTaskSearch] = useState('')

  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalUnit, setNewGoalUnit] = useState('次')

  const [noteDraft, setNoteDraft] = useState('')
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0])

  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setTasks(prev => {
      const now = Date.now()
      return prev.map(t => {
        if (t.status === 'doing' && t.runningTimerStartedAt) {
          const elapsed = Math.max(0, Math.floor((now - t.runningTimerStartedAt) / 1000))
          return { ...t, trackedSeconds: t.trackedSeconds + elapsed, runningTimerStartedAt: now }
        }
        return t
      })
    })
  }, [tick])

  useEffect(() => {
    saveStore({ tasks, goals, notes, categories })
  }, [tasks, goals, notes, categories])

  const today = todayKey()
  const todaysGoals = useMemo(() => goals.filter(g => g.date === today), [goals, today])
  const otherDaysGoals = useMemo(() => goals.filter(g => g.date !== today), [goals, today])

  const addTask = useCallback(() => {
    const title = newTaskTitle.trim()
    if (!title) return
    const task: Task = {
      id: newId(),
      title,
      category: newTaskCategory,
      priority: newTaskPriority,
      status: 'todo',
      createdAt: Date.now(),
      estimatedMinutes: newTaskEstimate ? Math.max(1, parseInt(newTaskEstimate) || 0) : undefined,
      trackedSeconds: 0,
    }
    setTasks(prev => [task, ...prev])
    setNewTaskTitle('')
    setNewTaskEstimate('')
  }, [newTaskTitle, newTaskCategory, newTaskPriority, newTaskEstimate])

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const updated: Task = { ...t, status }
      if (status === 'doing') {
        if (t.status !== 'doing') {
          updated.runningTimerStartedAt = Date.now()
        }
      } else {
        if (t.status === 'doing' && t.runningTimerStartedAt) {
          const elapsed = Math.max(0, Math.floor((Date.now() - t.runningTimerStartedAt) / 1000))
          updated.trackedSeconds = t.trackedSeconds + elapsed
        }
        updated.runningTimerStartedAt = undefined
      }
      if (status === 'done' && !t.completedAt) {
        updated.completedAt = Date.now()
      } else if (status !== 'done') {
        updated.completedAt = undefined
      }
      return updated
    }))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const addCategory = () => {
    const name = newCategoryName.trim()
    if (!name || categories.includes(name)) return
    setCategories(prev => [...prev, name])
    setNewCategoryName('')
  }

  const addGoal = () => {
    const title = newGoalTitle.trim()
    const target = parseInt(newGoalTarget)
    if (!title || !target || target < 1) return
    const goal: DailyGoal = {
      id: newId(),
      title,
      target,
      current: 0,
      unit: newGoalUnit.trim() || '次',
      date: today,
    }
    setGoals(prev => [goal, ...prev])
    setNewGoalTitle('')
    setNewGoalTarget('')
    setNewGoalUnit('次')
  }

  const updateGoal = (id: string, delta: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current: Math.max(0, g.current + delta) } : g))
  }

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const addNote = () => {
    const content = noteDraft.trim()
    if (!content) return
    const note: QuickNote = {
      id: newId(),
      content,
      color: noteColor,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes(prev => [note, ...prev])
    setNoteDraft('')
  }

  const togglePinNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  }

  const updateNote = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content, updatedAt: Date.now() } : n))
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }, [notes])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (taskFilter !== 'all' && t.status !== taskFilter) return false
      if (taskSearch && !t.title.toLowerCase().includes(taskSearch.toLowerCase())) return false
      return true
    })
  }, [tasks, taskFilter, taskSearch])

  const stats = useMemo(() => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 3600 * 1000
    const oneWeekAgo = now - 7 * 24 * 3600 * 1000
    const completedToday = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt >= oneDayAgo).length
    const completedWeek = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt >= oneWeekAgo).length
    const totalTrackedSeconds = tasks.reduce((sum, t) => sum + t.trackedSeconds, 0)
    const activeTasks = tasks.filter(t => t.status === 'doing').length
    const todoTasks = tasks.filter(t => t.status === 'todo').length
    const byCategory: Record<string, number> = {}
    for (const t of tasks) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1
    }
    const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0 }
    for (const t of tasks) byPriority[t.priority]++
    return {
      completedToday,
      completedWeek,
      totalTrackedSeconds,
      activeTasks,
      todoTasks,
      totalTasks: tasks.length,
      byCategory,
      byPriority,
    }
  }, [tasks, tick])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const exportData = () => {
    const data = { tasks, goals, notes, categories, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productivity-hub-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold">生产力中心</h1>
          <p className="text-xs text-slate-400 mt-0.5">任务 · 目标 · 笔记 · 数据统计</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
          >
            导出数据
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-700/60 px-6">
        {(['tasks', 'goals', 'notes', 'stats'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t === 'tasks' && '任务'}
            {t === 'goals' && '目标'}
            {t === 'notes' && '便签'}
            {t === 'stats' && '统计'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === 'tasks' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="grid grid-cols-12 gap-2">
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask() }}
                  placeholder="新任务标题..."
                  className="col-span-5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm focus:outline-none focus:border-blue-500"
                />
                <select
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value)}
                  className="col-span-2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as Priority)}
                  className="col-span-2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                >
                  <option value="low">低优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="high">高优先级</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={newTaskEstimate}
                  onChange={e => setNewTaskEstimate(e.target.value)}
                  placeholder="预估(分)"
                  className="col-span-2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                />
                <button
                  onClick={addTask}
                  className="col-span-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
                >
                  添加
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span>添加分类:</span>
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCategory() }}
                  placeholder="新分类名"
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs w-32"
                />
                <button
                  onClick={addCategory}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
                placeholder="搜索任务..."
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm flex-1 min-w-[200px]"
              />
              {(['all', 'todo', 'doing', 'done'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTaskFilter(s)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    taskFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s === 'all' ? '全部' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">暂无任务</div>
              ) : (
                filteredTasks.map(t => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 p-3 bg-slate-800/40 border rounded-lg hover:border-slate-600 transition-colors ${
                      t.status === 'done' ? 'border-slate-700/30 opacity-60' : 'border-slate-700/60'
                    }`}
                  >
                    <select
                      value={t.status}
                      onChange={e => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                      className={`px-2 py-1 bg-slate-900 border rounded text-xs ${PRIORITY_COLOR[t.priority]}`}
                    >
                      <option value="todo">待办</option>
                      <option value="doing">进行中</option>
                      <option value="done">已完成</option>
                    </select>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="px-1.5 py-0.5 bg-slate-700/60 rounded">{t.category}</span>
                        <span className={PRIORITY_COLOR[t.priority].split(' ')[1]}>
                          {PRIORITY_LABEL[t.priority]}优先级
                        </span>
                        {t.estimatedMinutes && <span>预估 {t.estimatedMinutes} 分</span>}
                        {t.trackedSeconds > 0 && (
                          <span className="text-blue-300">已用时 {formatDuration(t.trackedSeconds)}</span>
                        )}
                        {t.status === 'doing' && (
                          <span className="text-amber-300 animate-pulse">计时中</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors text-sm px-2"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'goals' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="grid grid-cols-12 gap-2">
                <input
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addGoal() }}
                  placeholder="今日目标 (例: 锻炼 30 分钟)"
                  className="col-span-6 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  value={newGoalTarget}
                  onChange={e => setNewGoalTarget(e.target.value)}
                  placeholder="目标数值"
                  className="col-span-2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                />
                <input
                  value={newGoalUnit}
                  onChange={e => setNewGoalUnit(e.target.value)}
                  placeholder="单位"
                  className="col-span-2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                />
                <button
                  onClick={addGoal}
                  className="col-span-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">今日目标</h3>
              {todaysGoals.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">还没有今日目标</div>
              ) : (
                <div className="space-y-2">
                  {todaysGoals.map(g => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100))
                    return (
                      <div key={g.id} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-slate-200">{g.title}</div>
                          <div className="text-xs text-slate-400">{g.current} / {g.target} {g.unit}</div>
                        </div>
                        <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateGoal(g.id, -1)}
                            disabled={g.current <= 0}
                            className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs rounded"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => updateGoal(g.id, 1)}
                            className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-xs rounded"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => updateGoal(g.id, 5)}
                            className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-xs rounded"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => deleteGoal(g.id)}
                            className="ml-auto text-slate-500 hover:text-rose-400 text-xs px-2"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {otherDaysGoals.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">历史目标</h3>
                <div className="space-y-1">
                  {otherDaysGoals.slice(0, 8).map(g => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100))
                    return (
                      <div key={g.id} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded text-xs">
                        <span className="text-slate-500">{g.date}</span>
                        <span className="flex-1 text-slate-300">{g.title}</span>
                        <span className="text-slate-400">{g.current}/{g.target}</span>
                        <span className="text-slate-500 w-10 text-right">{pct}%</span>
                        <button
                          onClick={() => deleteGoal(g.id)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <textarea
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                placeholder="快速记下想法..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1.5">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNoteColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        noteColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={addNote}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
                >
                  保存
                </button>
              </div>
            </div>

            {sortedNotes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">还没有便签</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedNotes.map(n => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg border border-slate-700/40 relative group"
                    style={{ backgroundColor: `${n.color}1A` }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: n.color }}
                      />
                      <textarea
                        value={n.content}
                        onChange={e => updateNote(n.id, e.target.value)}
                        rows={Math.max(2, n.content.split('\n').length)}
                        className="flex-1 bg-transparent text-sm text-slate-200 resize-none focus:outline-none placeholder-slate-500"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => togglePinNote(n.id)}
                          className={`px-1.5 ${n.pinned ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
                          title="置顶"
                        >
                          {n.pinned ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => deleteNote(n.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="总任务数" value={stats.totalTasks} color="from-blue-500 to-cyan-500" />
              <StatCard label="今日完成" value={stats.completedToday} color="from-emerald-500 to-teal-500" />
              <StatCard label="本周完成" value={stats.completedWeek} color="from-violet-500 to-purple-500" />
              <StatCard label="总专注时间" value={formatDuration(stats.totalTrackedSeconds)} color="from-amber-500 to-orange-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">任务状态分布</h3>
                <div className="space-y-2">
                  <BarRow label="待办" value={stats.todoTasks} max={stats.totalTasks || 1} color="bg-slate-500" />
                  <BarRow label="进行中" value={stats.activeTasks} max={stats.totalTasks || 1} color="bg-amber-500" />
                  <BarRow label="已完成" value={stats.totalTasks - stats.todoTasks - stats.activeTasks} max={stats.totalTasks || 1} color="bg-emerald-500" />
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">优先级分布</h3>
                <div className="space-y-2">
                  <BarRow label="高优先级" value={stats.byPriority.high} max={stats.totalTasks || 1} color="bg-rose-500" />
                  <BarRow label="中优先级" value={stats.byPriority.medium} max={stats.totalTasks || 1} color="bg-amber-500" />
                  <BarRow label="低优先级" value={stats.byPriority.low} max={stats.totalTasks || 1} color="bg-emerald-500" />
                </div>
              </div>
            </div>

            {Object.keys(stats.byCategory).length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">按分类统计</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <BarRow key={cat} label={cat} value={count} max={stats.totalTasks || 1} color="bg-blue-500" />
                    ))}
                </div>
              </div>
            )}

            {stats.totalTasks === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">添加任务后查看统计</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`p-4 rounded-lg bg-gradient-to-br ${color} text-white shadow-lg`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
