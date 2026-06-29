import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useStore } from '../store'
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Coffee,
  Brain,
  Heart,
  Sparkles,
  Timer,
  Hourglass
} from 'lucide-react'

// ==================== 类型定义 ====================
interface TimeTask {
  id: string
  title: string
  category: 'work' | 'study' | 'exercise' | 'creative' | 'rest'
  estimatedMinutes: number
  actualMinutes: number
  completed: boolean
  startTime?: Date
  endTime?: Date
  priority: 'high' | 'medium' | 'low'
}

interface PomodoroSession {
  id: string
  type: 'focus' | 'short_break' | 'long_break'
  duration: number // seconds
  remaining: number
  startTime: Date
  completed: boolean
}

interface DayStats {
  date: string
  focusTime: number // minutes
  tasksCompleted: number
  productivityScore: number // 0-100
  topCategories: string[]
}

interface ScheduleEvent {
  id: string
  title: string
  time: string
  category: string
  color: string
  reminder: boolean
}

// ==================== 常量 ====================
const CATEGORY_CONFIG = {
  work: { color: '#6366f1', icon: Brain, gradient: 'from-indigo-500/20 to-indigo-600/20' },
  study: { color: '#8b5cf6', icon: Sparkles, gradient: 'from-violet-500/20 to-violet-600/20' },
  exercise: { color: '#ef4444', icon: Heart, gradient: 'from-red-500/20 to-red-600/20' },
  creative: { color: '#f59e0b', icon: Zap, gradient: 'from-amber-500/20 to-amber-600/20' },
  rest: { color: '#10b981', icon: Coffee, gradient: 'from-emerald-500/20 to-emerald-600/20' },
}

const POMODORO_CONFIG = {
  focus: { duration: 25 * 60, label: '专注时间', color: '#6366f1' },
  short_break: { duration: 5 * 60, label: '短休息', color: '#10b981' },
  long_break: { duration: 15 * 60, label: '长休息', color: '#f59e0b' },
}

const STORAGE_KEY = 'weblinux-time-management'

// ==================== 主组件 ====================
export default function TimeManagementMaster() {
  const theme = useStore((s) => s.theme)
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'tasks' | 'schedule' | 'stats'>('pomodoro')
  
  // 番茄钟状态
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [autoStartBreak, setAutoStartBreak] = useState(true)
  
  // 任务状态
  const [tasks, setTasks] = useState<TimeTask[]>([])
  const [newTask, setNewTask] = useState({ title: '', category: 'work', minutes: 25, priority: 'medium' })
  
  // 日程状态
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([])
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  
  // 统计数据
  const [weekStats, setWeekStats] = useState<DayStats[]>([])
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 加载存储数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.tasks) setTasks(data.tasks)
        if (data.schedule) setSchedule(data.schedule)
        if (data.pomodoroCount) setPomodoroCount(data.pomodoroCount)
      } catch (e) {
        console.error('Failed to load saved data')
      }
    }
    
    // 生成本周统计（模拟数据）
    generateWeekStats()
  }, [])

  // 保存数据
  useEffect(() => {
    const data = { tasks, schedule, pomodoroCount }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [tasks, schedule, pomodoroCount])

  // 番茄钟计时器
  useEffect(() => {
    if (pomodoroSession && pomodoroSession.remaining > 0 && !pomodoroSession.completed) {
      timerRef.current = setTimeout(() => {
        setPomodoroSession(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null)
      }, 1000)
    } else if (pomodoroSession && pomodoroSession.remaining === 0) {
      handleSessionComplete()
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pomodoroSession])

  const generateWeekStats = () => {
    const stats: DayStats[] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      stats.push({
        date: date.toISOString().split('T')[0],
        focusTime: Math.floor(Math.random() * 180) + 60,
        tasksCompleted: Math.floor(Math.random() * 12) + 2,
        productivityScore: Math.floor(Math.random() * 40) + 60,
        topCategories: ['work', 'study', 'creative'].slice(0, Math.floor(Math.random() * 3) + 1)
      })
    }
    
    setWeekStats(stats)
  }

  const startPomodoro = (type: 'focus' | 'short_break' | 'long_break') => {
    setPomodoroSession({
      id: Date.now().toString(),
      type,
      duration: POMODORO_CONFIG[type].duration,
      remaining: POMODORO_CONFIG[type].duration,
      startTime: new Date(),
      completed: false,
    })
  }

  const pausePomodoro = () => {
    if (pomodoroSession && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setPomodoroSession(prev => prev ? { ...prev, completed: true } : null)
    }
  }

  const resetPomodoro = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPomodoroSession(null)
  }

  const handleSessionComplete = useCallback(() => {
    if (pomodoroSession?.type === 'focus') {
      setPomodoroCount(prev => prev + 1)
      
      // 自动启动休息
      if (autoStartBreak) {
        const breakType = pomodoroCount % 4 === 3 ? 'long_break' : 'short_break'
        setTimeout(() => startPomodoro(breakType), 1000)
      }
    } else if (pomodoroSession?.type === 'short_break' || pomodoroSession?.type === 'long_break') {
      // 自动启动下一个专注时间
      if (autoStartBreak) {
        setTimeout(() => startPomodoro('focus'), 1000)
      }
    }
    
    if (timerRef.current) clearTimeout(timerRef.current)
    setPomodoroSession(prev => prev ? { ...prev, completed: true } : null)
    
    // 播放通知音效（使用 Web Audio API）
    playNotificationSound()
  }, [pomodoroSession, pomodoroCount, autoStartBreak])

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.log('Audio not supported')
    }
  }

  const addTask = () => {
    if (!newTask.title.trim()) return
    
    const task: TimeTask = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      category: newTask.category as TimeTask['category'],
      estimatedMinutes: newTask.minutes,
      actualMinutes: 0,
      completed: false,
      priority: newTask.priority as TimeTask['priority'],
    }
    
    setTasks(prev => [...prev, task])
    setNewTask({ title: '', category: 'work', minutes: 25, priority: 'medium' })
  }

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: true, endTime: new Date() } : task
    ))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  const startTaskTimer = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, startTime: new Date() } : task
    ))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 计算专注时间可视化（时间河流概念）
  const focusTimeData = useMemo(() => {
    return weekStats.map(stat => ({
      date: stat.date,
      hours: stat.focusTime / 60,
      score: stat.productivityScore,
    }))
  }, [weekStats])

  return (
    <div className="time-management-master" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.05) 0%, transparent 70%)
        `,
        zIndex: 0,
      }} />
      
      {/* 头部导航 */}
      <div style={{
        padding: '20px 24px 0',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}>
            <Hourglass size={24} color="white" />
          </div>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              letterSpacing: '-0.5px',
            }}>
              时间管理大师
            </h1>
            <p style={{
              fontSize: '13px',
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              marginTop: '2px',
            }}>
              精准掌控每一分钟 · 提升生产力
            </p>
          </div>
        </div>
        
        {/* 标签栏 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {(['pomodoro', 'tasks', 'schedule', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: activeTab === tab 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
                color: activeTab === tab ? 'white' : theme === 'dark' ? '#94a3b8' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              {tab === 'pomodoro' && <Timer size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
              {tab === 'tasks' && <Target size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
              {tab === 'schedule' && <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
              {tab === 'stats' && <TrendingUp size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
              {tab === 'pomodoro' ? '番茄钟' : tab === 'tasks' ? '任务追踪' : tab === 'schedule' ? '日程安排' : '统计分析'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        padding: '16px 24px',
        overflow: 'auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 番茄钟视图 */}
        {activeTab === 'pomodoro' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            height: '100%',
          }}>
            {/* 左侧：主计时器 */}
            <div style={{
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* 背景渐变动画 */}
              {pomodoroSession && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at center, ${POMODORO_CONFIG[pomodoroSession.type].color}33 0%, transparent 70%)`,
                  opacity: 0.6,
                  animation: 'pulse 3s ease-in-out infinite',
                }} />
              )}
              
              {/* 计时器圆环 */}
              <div style={{
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}>
                {/* 进度环 */}
                {pomodoroSession && (
                  <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 240 240">
                    <circle
                      cx="120"
                      cy="120"
                      r="110"
                      fill="none"
                      stroke={POMODORO_CONFIG[pomodoroSession.type].color}
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 110 * (pomodoroSession.remaining / pomodoroSession.duration)} ${2 * Math.PI * 110}`}
                      strokeLinecap="round"
                      transform="rotate(-90 120 120)"
                      style={{
                        transition: 'stroke-dasharray 1s linear',
                      }}
                    />
                  </svg>
                )}
                
                {/* 时间显示 */}
                <div style={{
                  textAlign: 'center',
                  zIndex: 1,
                }}>
                  <div style={{
                    fontSize: '56px',
                    fontWeight: 800,
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    letterSpacing: '-2px',
                    marginBottom: '8px',
                    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                  }}>
                    {pomodoroSession ? formatTime(pomodoroSession.remaining) : '25:00'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    fontWeight: 600,
                  }}>
                    {pomodoroSession ? POMODORO_CONFIG[pomodoroSession.type].label : '准备开始'}
                  </div>
                </div>
              </div>
              
              {/* 控制按钮 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {!pomodoroSession || pomodoroSession.completed ? (
                  <button
                    onClick={() => startPomodoro('focus')}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <PlayCircle size={32} color="white" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pausePomodoro}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      <PauseCircle size={32} color="white" />
                    </button>
                    <button
                      onClick={resetPomodoro}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <RotateCcw size={24} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* 右侧：统计和设置 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* 今日统计 */}
              <div style={{
                background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <BarChart3 size={16} />
                  今日统计
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: '#6366f1',
                      marginBottom: '4px',
                    }}>
                      {pomodoroCount}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    }}>
                      完成的番茄钟
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: '#f59e0b',
                      marginBottom: '4px',
                    }}>
                      {pomodoroCount * 25}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    }}>
                      总专注分钟
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 快速启动 */}
              <div style={{
                background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                  marginBottom: '12px',
                }}>
                  快速启动
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                }}>
                  {(['focus', 'short_break', 'long_break'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => startPomodoro(type)}
                      disabled={Boolean(pomodoroSession && !pomodoroSession.completed)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        background: `${POMODORO_CONFIG[type].color}20`,
                        color: POMODORO_CONFIG[type].color,
                        border: `1px solid ${POMODORO_CONFIG[type].color}40`,
                        cursor: pomodoroSession && !pomodoroSession.completed ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        opacity: pomodoroSession && !pomodoroSession.completed ? 0.5 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {POMODORO_CONFIG[type].label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 设置 */}
              <div style={{
                background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
                borderRadius: '16px',
                padding: '20px',
                flex: 1,
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Settings size={16} />
                  自动设置
                </h3>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0',
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: theme === 'dark' ? '#e2e8f0' : '#475569',
                  }}>
                    自动启动休息时间
                  </span>
                  <div style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: autoStartBreak 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: autoStartBreak ? '22px' : '2px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }} />
                  </div>
                  <input
                    type="checkbox"
                    checked={autoStartBreak}
                    onChange={(e) => setAutoStartBreak(Boolean(e.target.checked))}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
        
        {/* 任务追踪视图 */}
        {activeTab === 'tasks' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 350px',
            gap: '16px',
            height: '100%',
          }}>
            {/* 左侧：任务列表 */}
            <div style={{
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
              borderRadius: '16px',
              padding: '20px',
              overflow: 'auto',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} />
                  任务列表 ({tasks.length})
                </span>
              </h3>
              
              {tasks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                }}>
                  <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px' }}>暂无任务，添加一个开始吧</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tasks.map(task => {
                    const CategoryIcon = CATEGORY_CONFIG[task.category].icon
                    return (
                      <div
                        key={task.id}
                        style={{
                          background: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          opacity: task.completed ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: `linear-gradient(135deg, ${CATEGORY_CONFIG[task.category].gradient})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: CATEGORY_CONFIG[task.category].color,
                        }}>
                          <CategoryIcon size={20} />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                            marginBottom: '4px',
                          }}>
                            {task.title}
                          </h4>
                          <div style={{
                            fontSize: '12px',
                            color: theme === 'dark' ? '#94a3b8' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <span>预计 {task.estimatedMinutes} 分钟</span>
                            {task.priority === 'high' && (
                              <span style={{
                                color: '#ef4444',
                                fontWeight: 600,
                              }}>
                                高优先级
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!task.completed && (
                            <>
                              <button
                                onClick={() => startTaskTimer(task.id)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: '#6366f120',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#6366f1',
                                }}
                              >
                                <PlayCircle size={16} />
                              </button>
                              <button
                                onClick={() => completeTask(task.id)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: '#10b98120',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#10b981',
                                }}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#ef444420',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* 右侧：添加任务 */}
            <div style={{
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
              borderRadius: '16px',
              padding: '20px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Plus size={18} />
                添加新任务
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="任务标题..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${theme === 'dark' ? '#475569' : '#cbd5e1'}`,
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  任务类别
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(Object.keys(CATEGORY_CONFIG) as TimeTask['category'][]).map(cat => {
                    const Icon = CATEGORY_CONFIG[cat].icon
                    return (
                      <button
                        key={cat}
                        onClick={() => setNewTask({ ...newTask, category: cat })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '10px',
                          background: newTask.category === cat 
                            ? `${CATEGORY_CONFIG[cat].color}20`
                            : theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                          border: `1px solid ${newTask.category === cat ? CATEGORY_CONFIG[cat].color : 'transparent'}`,
                          color: newTask.category === cat ? CATEGORY_CONFIG[cat].color : theme === 'dark' ? '#94a3b8' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <Icon size={14} />
                        {cat === 'work' ? '工作' : cat === 'study' ? '学习' : cat === 'exercise' ? '运动' : cat === 'creative' ? '创意' : '休息'}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  预计时间（分钟）
                </label>
                <input
                  type="number"
                  value={newTask.minutes}
                  onChange={(e) => setNewTask({ ...newTask, minutes: parseInt(e.target.value) || 25 })}
                  min={1}
                  max={180}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${theme === 'dark' ? '#475569' : '#cbd5e1'}`,
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  优先级
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['high', 'medium', 'low'] as const).map(priority => (
                    <button
                      key={priority}
                      onClick={() => setNewTask({ ...newTask, priority })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: newTask.priority === priority 
                          ? priority === 'high' ? '#ef444420' : priority === 'medium' ? '#f59e0b20' : '#10b98120'
                          : theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                        border: newTask.priority === priority 
                          ? `1px solid ${priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981'}`
                          : '1px solid transparent',
                        color: newTask.priority === priority 
                          ? priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981'
                          : theme === 'dark' ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={addTask}
                disabled={!newTask.title.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: newTask.title.trim() 
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                  color: newTask.title.trim() ? 'white' : theme === 'dark' ? '#64748b' : '#94a3b8',
                  border: 'none',
                  cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: newTask.title.trim() ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <Plus size={18} />
                添加任务
              </button>
            </div>
          </div>
        )}
        
        {/* 统计分析视图 */}
        {activeTab === 'stats' && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* 周统计概览 */}
            <div style={{
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <TrendingUp size={18} />
                本周专注时间趋势
              </h3>
              
              {/* 时间河流可视化 */}
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                padding: '0 20px',
              }}>
                {focusTimeData.map((data, i) => (
                  <div key={i} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      width: '100%',
                      height: `${data.hours * 30}%`,
                      minHeight: '20px',
                      background: `linear-gradient(to top, #6366f1 0%, #8b5cf6 100%)`,
                      borderRadius: '8px 8px 0 0',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'white',
                      }}>
                        {data.hours.toFixed(1)}h
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: theme === 'dark' ? '#94a3b8' : '#64748b',
                      textAlign: 'center',
                    }}>
                      {new Date(data.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 详细统计卡片 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}>
              {[
                { label: '总专注时间', value: `${weekStats.reduce((a, b) => a + b.focusTime, 0)}分钟`, color: '#6366f1' },
                { label: '完成任务', value: weekStats.reduce((a, b) => a + b.tasksCompleted, 0), color: '#10b981' },
                { label: '平均效率', value: `${Math.round(weekStats.reduce((a, b) => a + b.productivityScore, 0) / weekStats.length)}%`, color: '#f59e0b' },
                { label: '番茄钟总数', value: pomodoroCount, color: '#8b5cf6' },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(to right, ${stat.color} 0%, ${stat.color}66 100%)`,
                  }} />
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: stat.color,
                    marginBottom: '8px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 日程安排视图 */}
        {activeTab === 'schedule' && (
          <div style={{
            height: '100%',
            background: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Calendar size={18} />
                今日日程
              </h3>
              <button
                onClick={() => setShowAddSchedule(!showAddSchedule)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                }}
              >
                <Plus size={16} />
                添加日程
              </button>
            </div>
            
            {/* 时间轴 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((time, i) => (
                <div key={time} style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: '60px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    textAlign: 'right',
                  }}>
                    {time}
                  </div>
                  <div style={{
                    flex: 1,
                    minHeight: '40px',
                    borderLeft: `2px solid ${theme === 'dark' ? '#334155' : '#cbd5e1'}`,
                    paddingLeft: '12px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {/* 示例日程项 */}
                    {i === 1 && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Brain size={16} color="#6366f1" />
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                          }}>
                            项目开发
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        }}>
                          10:00 - 11:30
                        </span>
                      </div>
                    )}
                    {i === 3 && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Coffee size={16} color="#f59e0b" />
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                          }}>
                            午餐休息
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        }}>
                          12:00 - 13:00
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* CSS动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .time-management-master * {
          animation: fadeIn 0.5s ease;
        }
        
        .time-management-master button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }
        
        .time-management-master input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </div>
  )
}