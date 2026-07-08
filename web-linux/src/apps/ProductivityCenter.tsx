import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Play, Pause, RotateCcw, Plus, Trash2, Check,
  Clock, CheckSquare, Target, Flame, Coffee, Zap,
  Settings, BarChart3, Award
} from 'lucide-react'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

interface HabitItem {
  id: string
  name: string
  icon: string
  streak: number
  completedToday: boolean
  history: boolean[]
}

const defaultTodos: TodoItem[] = [
  { id: '1', text: '完成项目文档', completed: false, createdAt: Date.now() - 86400000 },
  { id: '2', text: '代码审查', completed: true, createdAt: Date.now() - 172800000 },
  { id: '3', text: '学习新技术', completed: false, createdAt: Date.now() - 3600000 },
]

const defaultHabits: HabitItem[] = [
  { id: '1', name: '早起', icon: '🌅', streak: 7, completedToday: true, history: [true, true, true, true, true, true, true] },
  { id: '2', name: '运动', icon: '🏃', streak: 5, completedToday: false, history: [true, true, true, true, true, false, false] },
  { id: '3', name: '阅读', icon: '📚', streak: 12, completedToday: true, history: [true, true, true, true, true, true, true] },
  { id: '4', name: '冥想', icon: '🧘', streak: 3, completedToday: false, history: [true, true, true, false, false, false, false] },
]

const POMODORO_MODES = {
  work: { duration: 25 * 60, label: '专注时间', color: '#ff6b6b', icon: <Zap size={20} /> },
  shortBreak: { duration: 5 * 60, label: '短休息', color: '#1dd1a1', icon: <Coffee size={20} /> },
  longBreak: { duration: 15 * 60, label: '长休息', color: '#54a0ff', icon: <Flame size={20} /> },
}

type PomodoroMode = keyof typeof POMODORO_MODES
type TabType = 'pomodoro' | 'todos' | 'habits' | 'stats'

export default function ProductivityCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('pomodoro')
  
  const [timeLeft, setTimeLeft] = useState(POMODORO_MODES.work.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('work')
  const [completedPomodoros, setCompletedPomodoros] = useState(4)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [todos, setTodos] = useState<TodoItem[]>(defaultTodos)
  const [newTodoText, setNewTodoText] = useState('')

  const [habits, setHabits] = useState<HabitItem[]>(defaultHabits)
  const [newHabitName, setNewHabitName] = useState('')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((POMODORO_MODES[pomodoroMode].duration - timeLeft) / POMODORO_MODES[pomodoroMode].duration) * 100

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      if (pomodoroMode === 'work') {
        setCompletedPomodoros(prev => prev + 1)
        const nextMode: PomodoroMode = (completedPomodoros + 1) % 4 === 0 ? 'longBreak' : 'shortBreak'
        setPomodoroMode(nextMode)
        setTimeLeft(POMODORO_MODES[nextMode].duration)
      } else {
        setPomodoroMode('work')
        setTimeLeft(POMODORO_MODES.work.duration)
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft, pomodoroMode, completedPomodoros])

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(POMODORO_MODES[pomodoroMode].duration)
  }, [pomodoroMode])

  const switchMode = useCallback((mode: PomodoroMode) => {
    setIsRunning(false)
    setPomodoroMode(mode)
    setTimeLeft(POMODORO_MODES[mode].duration)
  }, [])

  const addTodo = useCallback(() => {
    if (newTodoText.trim()) {
      setTodos(prev => [{
        id: Date.now().toString(),
        text: newTodoText.trim(),
        completed: false,
        createdAt: Date.now()
      }, ...prev])
      setNewTodoText('')
    }
  }, [newTodoText])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const newCompleted = !h.completedToday
        return {
          ...h,
          completedToday: newCompleted,
          streak: newCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
          history: [newCompleted, ...h.history.slice(0, 6)]
        }
      }
      return h
    }))
  }, [])

  const addHabit = useCallback(() => {
    if (newHabitName.trim()) {
      const icons = ['✨', '🎯', '💪', '🌟', '🔥', '💡', '🎨', '🎵']
      setHabits(prev => [...prev, {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        icon: icons[Math.floor(Math.random() * icons.length)],
        streak: 0,
        completedToday: false,
        history: [false, false, false, false, false, false, false]
      }])
      setNewHabitName('')
    }
  }, [newHabitName])

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
  }, [])

  const tabs = [
    { id: 'pomodoro' as TabType, label: '番茄钟', icon: <Clock size={16} /> },
    { id: 'todos' as TabType, label: '待办事项', icon: <CheckSquare size={16} /> },
    { id: 'habits' as TabType, label: '习惯追踪', icon: <Target size={16} /> },
    { id: 'stats' as TabType, label: '统计', icon: <BarChart3 size={16} /> },
  ]

  const completedTodos = todos.filter(t => t.completed).length
  const totalTodos = todos.length
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>生产力中心</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>专注 · 高效 · 成长</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 10 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 8,
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'pomodoro' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.keys(POMODORO_MODES) as PomodoroMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 20,
                    background: pomodoroMode === mode ? POMODORO_MODES[mode].color : 'var(--bg-secondary)',
                    color: pomodoroMode === mode ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  {POMODORO_MODES[mode].icon}
                  {POMODORO_MODES[mode].label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx={110}
                  cy={110}
                  r={100}
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth={12}
                />
                <circle
                  cx={110}
                  cy={110}
                  r={100}
                  fill="none"
                  stroke={POMODORO_MODES[pomodoroMode].color}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(timeLeft)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {POMODORO_MODES[pomodoroMode].label}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={resetTimer}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={toggleTimer}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  border: 'none',
                  background: POMODORO_MODES[pomodoroMode].color,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 20px ${POMODORO_MODES[pomodoroMode].color}40`,
                  transition: 'all 0.2s',
                }}
              >
                {isRunning ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 4 }} />}
              </button>
              <button
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Settings size={20} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: 12,
            }}>
              <Flame size={18} style={{ color: '#ff6b6b' }} />
              <span style={{ fontSize: 14 }}>今日已完成</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#ff6b6b' }}>{completedPomodoros}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>个番茄</span>
            </div>
          </div>
        )}

        {activeTab === 'todos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="添加新任务..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={addTodo}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 10,
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Plus size={18} />
                添加
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                完成进度
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {completedTodos}/{totalTodos} ({completionRate}%)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todos.map(todo => (
                <div
                  key={todo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s',
                  }}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${todo.completed ? '#1dd1a1' : 'var(--border)'}`,
                      background: todo.completed ? '#1dd1a1' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {todo.completed && <Check size={14} style={{ color: 'white' }} />}
                  </button>
                  <span style={{
                    flex: 1,
                    fontSize: 14,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  }}>
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    style={{
                      padding: 6,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      borderRadius: 6,
                      opacity: 0.6,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {todos.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: 'var(--text-secondary)',
              }}>
                <CheckSquare size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div>暂无待办事项</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>添加你的第一个任务吧</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'habits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                placeholder="添加新习惯..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={addHabit}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 10,
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Plus size={18} />
                添加
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {habits.map(habit => (
                <div
                  key={habit.id}
                  style={{
                    padding: '14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {habit.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{habit.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={12} style={{ color: '#ff6b6b' }} />
                        连续 {habit.streak} 天
                      </div>
                    </div>
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        borderRadius: 8,
                        background: habit.completedToday ? '#1dd1a1' : 'var(--bg-tertiary)',
                        color: habit.completedToday ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {habit.completedToday ? <Check size={14} /> : <Plus size={14} />}
                      {habit.completedToday ? '已完成' : '打卡'}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={{
                        padding: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        borderRadius: 6,
                        opacity: 0.6,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {habit.history.map((done, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          background: done ? '#1dd1a1' : 'var(--bg-tertiary)',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                  }}>
                    <span>7天前</span>
                    <span>今天</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 12,
                color: 'white',
              }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>今日番茄</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{completedPomodoros}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>专注 {completedPomodoros * 25} 分钟</div>
              </div>
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: 12,
                color: 'white',
              }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>任务完成率</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{completionRate}%</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{completedTodos}/{totalTodos} 项</div>
              </div>
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: 12,
                color: 'white',
              }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>习惯总数</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{habits.length}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  今日完成 {habits.filter(h => h.completedToday).length} 个
                </div>
              </div>
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                borderRadius: 12,
                color: 'white',
              }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>最长连续</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {Math.max(...habits.map(h => h.streak), 0)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>天</div>
              </div>
            </div>

            <div style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} style={{ color: '#feca57' }} />
                今日成就
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🌅', name: '早起之星', desc: '连续7天早起', unlocked: habits.find(h => h.name === '早起')?.streak! >= 7 },
                  { icon: '🍅', name: '番茄达人', desc: '今日完成4个番茄', unlocked: completedPomodoros >= 4 },
                  { icon: '✅', name: '任务终结者', desc: '完成所有待办', unlocked: totalTodos > 0 && completionRate === 100 },
                  { icon: '💪', name: '习惯大师', desc: '完成所有今日习惯', unlocked: habits.every(h => h.completedToday) && habits.length > 0 },
                ].map((achievement, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: achievement.unlocked ? 'var(--bg-tertiary)' : 'transparent',
                    borderRadius: 8,
                    opacity: achievement.unlocked ? 1 : 0.4,
                  }}>
                    <span style={{ fontSize: 24 }}>{achievement.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{achievement.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{achievement.desc}</div>
                    </div>
                    {achievement.unlocked && <Check size={18} style={{ color: '#1dd1a1' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
