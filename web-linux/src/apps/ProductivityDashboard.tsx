import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Play, Pause, RotateCcw, Coffee, Brain, Plus, Trash2,
  CloudRain, Sun, Zap, Target,
  Flame, Calendar, Quote, X,
  Wind, Droplets, Thermometer, Gauge, Activity,
  CheckCircle, Circle, Sparkles, BarChart3, Timer
} from 'lucide-react'

interface Task {
  id: string
  text: string
  done: boolean
  createdAt: number
  completedAt?: number
  duration?: number
}

interface PomodoroSession {
  id: string
  type: 'focus' | 'break'
  startedAt: number
  duration: number
  completed: boolean
}

interface DayStat {
  date: string
  focusMinutes: number
  tasksCompleted: number
}

const STORAGE_TASKS = 'weblinux-productivity-tasks'
const STORAGE_SESSIONS = 'weblinux-productivity-sessions'
const STORAGE_STATS = 'weblinux-productivity-stats'
const STORAGE_CITY = 'weblinux-productivity-city'

const DEFAULT_FOCUS = 25 * 60
const DEFAULT_BREAK = 5 * 60

const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
  { name: '香港', lat: 22.3193, lon: 114.1694 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.006 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadJSON<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : defaultVal
  } catch { return defaultVal }
}

const ProductivityDashboard = memo(function ProductivityDashboard() {
  const [clock, setClock] = useState(new Date())
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus')
  const [pomodoroTime, setPomodoroTime] = useState(DEFAULT_FOCUS)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(() => loadJSON(STORAGE_TASKS, []))
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => loadJSON(STORAGE_SESSIONS, []))
  const [stats, setStats] = useState<DayStat[]>(() => loadJSON(STORAGE_STATS, []))
  const [newTask, setNewTask] = useState('')
  const [city, setCity] = useState(() => localStorage.getItem(STORAGE_CITY) || '北京')
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [quote, setQuote] = useState<{ text: string; author: string }>({ text: '', author: '' })
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [showCityPicker, setShowCityPicker] = useState(false)

  const pomodoroIntervalRef = useRef<number | null>(null)
  const sessionStartRef = useRef<number>(0)

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem(STORAGE_STATS, JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    localStorage.setItem(STORAGE_CITY, city)
  }, [city])

  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            setPomodoroRunning(false)
            handlePomodoroComplete()
            return pomodoroMode === 'focus' ? DEFAULT_BREAK : DEFAULT_FOCUS
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current)
        pomodoroIntervalRef.current = null
      }
    }
  }, [pomodoroRunning, pomodoroMode])

  const handlePomodoroComplete = () => {
    const elapsed = pomodoroMode === 'focus' ? DEFAULT_FOCUS : DEFAULT_BREAK
    const session: PomodoroSession = {
      id: `session-${Date.now()}`,
      type: pomodoroMode,
      startedAt: sessionStartRef.current,
      duration: elapsed,
      completed: true,
    }
    setSessions(prev => [session, ...prev].slice(0, 100))

    if (pomodoroMode === 'focus') {
      const today = todayKey()
      setStats(prev => {
        const existing = prev.find(s => s.date === today)
        if (existing) {
          return prev.map(s => s.date === today ? { ...s, focusMinutes: s.focusMinutes + Math.round(elapsed / 60) } : s)
        }
        return [...prev, { date: today, focusMinutes: Math.round(elapsed / 60), tasksCompleted: 0 }].slice(-30)
      })
    }

    setPomodoroMode(pomodoroMode === 'focus' ? 'break' : 'focus')
    setPomodoroTime(pomodoroMode === 'focus' ? DEFAULT_BREAK : DEFAULT_FOCUS)

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('生产力仪表盘', {
          body: pomodoroMode === 'focus' ? '专注完成，休息一下！' : '休息结束，开始专注吧！',
        })
      }
    } catch {}
  }

  const togglePomodoro = () => {
    if (!pomodoroRunning) {
      sessionStartRef.current = Date.now()
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
    setPomodoroRunning(!pomodoroRunning)
  }

  const resetPomodoro = () => {
    setPomodoroRunning(false)
    setPomodoroTime(pomodoroMode === 'focus' ? DEFAULT_FOCUS : DEFAULT_BREAK)
  }

  const switchMode = (mode: 'focus' | 'break') => {
    setPomodoroRunning(false)
    setPomodoroMode(mode)
    setPomodoroTime(mode === 'focus' ? DEFAULT_FOCUS : DEFAULT_BREAK)
  }

  const addTask = () => {
    if (!newTask.trim()) return
    const task: Task = {
      id: `task-${Date.now()}`,
      text: newTask.trim(),
      done: false,
      createdAt: Date.now(),
    }
    setTasks(prev => [task, ...prev])
    setNewTask('')
  }

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const now = Date.now()
        const wasDone = t.done
        if (!wasDone) {
          const today = todayKey()
          setStats(ps => {
            const existing = ps.find(s => s.date === today)
            if (existing) {
              return ps.map(s => s.date === today ? { ...s, tasksCompleted: s.tasksCompleted + 1 } : s)
            }
            return [...ps, { date: today, focusMinutes: 0, tasksCompleted: 1 }].slice(-30)
          })
        }
        return { ...t, done: !wasDone, completedAt: wasDone ? undefined : now }
      }
      return t
    }))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const clearDoneTasks = () => {
    setTasks(prev => prev.filter(t => !t.done))
  }

  const fetchWeather = useCallback(async (cityName: string) => {
    const loc = CITIES.find(c => c.name === cityName)
    if (!loc) return
    setWeatherLoading(true)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
      )
      if (!res.ok) throw new Error('天气API错误')
      const data = await res.json()
      setWeather(data)
    } catch {
      setWeather(null)
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true)
    try {
      const res = await fetch('https://api.zbztb.space/zen?raw=1')
      if (!res.ok) throw new Error('名言API错误')
      const data = await res.json()
      setQuote({ text: data.q || data.quote || '保持专注，持续前行。', author: data.a || data.author || 'Unknown' })
    } catch {
      try {
        const backupRes = await fetch('https://zenquotes.io/api/random')
        if (backupRes.ok) {
          const data = await backupRes.json()
          if (Array.isArray(data) && data.length > 0) {
            setQuote({ text: data[0].q || '保持专注，持续前行。', author: data[0].a || 'Unknown' })
          } else {
            setQuote({ text: '保持专注，持续前行。', author: 'Unknown' })
          }
        } else {
          setQuote({ text: '保持专注，持续前行。', author: 'Unknown' })
        }
      } catch {
        setQuote({ text: '保持专注，持续前行。', author: 'Unknown' })
      }
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather(city)
    fetchQuote()
  }, [city, fetchWeather, fetchQuote])

  const totalFocusToday = (() => {
    const today = todayKey()
    const todayStat = stats.find(s => s.date === today)
    return todayStat?.focusMinutes || 0
  })()

  const tasksCompletedToday = (() => {
    const today = todayKey()
    const todayStat = stats.find(s => s.date === today)
    return todayStat?.tasksCompleted || 0
  })()

  const totalFocusMinutes = stats.reduce((sum, s) => sum + s.focusMinutes, 0)
  const completedTasks = tasks.filter(t => t.done).length
  const pendingTasks = tasks.filter(t => !t.done).length

  const streakDays = (() => {
    if (stats.length === 0) return 0
    let count = 0
    const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date))
    for (const s of sorted) {
      if (s.focusMinutes >= 25 || s.tasksCompleted >= 1) count++
      else break
    }
    return count
  })()

  const last7Days = (() => {
    const days: { date: string; focus: number; tasks: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const stat = stats.find(s => s.date === key)
      days.push({ date: key.slice(5), focus: stat?.focusMinutes || 0, tasks: stat?.tasksCompleted || 0 })
    }
    return days
  })()

  const weatherCode = weather?.current?.weather_code
  const weatherDesc = (() => {
    if (weatherCode === undefined) return ''
    const codes: Record<number, string> = {
      0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴',
      45: '雾', 48: '冻雾', 51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
      61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
      80: '阵雨', 81: '中阵雨', 82: '强阵雨', 95: '雷暴', 96: '冰雹雷暴', 99: '强冰雹雷暴',
    }
    return codes[weatherCode] || ''
  })()

  const filteredCities = citySearch
    ? CITIES.filter(c => c.name.includes(citySearch))
    : CITIES

  const pomodoroProgress = (() => {
    const total = pomodoroMode === 'focus' ? DEFAULT_FOCUS : DEFAULT_BREAK
    return ((total - pomodoroTime) / total) * 100
  })()

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff', padding: 20, overflowY: 'auto', fontFamily: 'inherit',
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    title: {
      fontSize: 24, fontWeight: 700,
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #f472b6)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      display: 'flex', alignItems: 'center', gap: 10,
    },
    subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
    glass: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20,
    },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 14 },
    clockSection: { textAlign: 'center', padding: 10 },
    clockTime: {
      fontSize: 42, fontWeight: 800, letterSpacing: '0.05em',
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      fontVariantNumeric: 'tabular-nums',
    },
    clockDate: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
    pomodoroCard: { textAlign: 'center', padding: 20 },
    pomodoroDisplay: {
      fontSize: 52, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
      margin: '12px 0',
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    modeSwitch: { display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 },
    modeBtn: { padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: 'rgba(255,255,255,0.55)' },
    modeActive: { background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))', color: '#fff' },
    pomodoroProgress: {
      width: '100%', maxWidth: 280, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', margin: '0 auto 16px', overflow: 'hidden',
    },
    pomodoroProgressFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s ease', background: 'linear-gradient(90deg, #22d3ee, #a78bfa)' },
    pomodoroActions: { display: 'flex', gap: 10, justifyContent: 'center' },
    pomodoroBtn: {
      padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
      fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
    },
    btnStart: { background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', color: '#0f0c29' },
    btnPause: { background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#fff' },
    btnReset: {
      padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
    },
    statCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
    statCard: {
      padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
    },
    statIcon: { margin: '0 auto 6px', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statNum: { fontSize: 22, fontWeight: 700 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    taskInput: { display: 'flex', gap: 8, marginBottom: 12 },
    input: {
      flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, outline: 'none',
    },
    addBtn: {
      padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', color: '#0f0c29',
      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
    },
    taskList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' },
    taskItem: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    },
    taskText: { flex: 1, fontSize: 13 },
    taskDone: { textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' },
    taskCount: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 },
    weatherCard: { padding: 16 },
    weatherMain: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
    weatherTemp: { fontSize: 36, fontWeight: 700 },
    weatherInfo: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 },
    weatherItem: { display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)' },
    cityPicker: { position: 'relative' },
    cityList: {
      position: 'absolute', top: '100%', left: 0, right: 0,
      background: 'linear-gradient(135deg, #1a1740, #2d2766)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
      marginTop: 4, padding: 6, maxHeight: 200, overflowY: 'auto', zIndex: 10,
    },
    cityItem: {
      padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
      transition: 'background 0.15s',
    },
    quoteCard: { padding: 16, textAlign: 'center' },
    quoteText: { fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
    quoteAuthor: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    streakSection: { marginTop: 16 },
    streakHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    streakBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(244,63,94,0.2))',
      color: '#fb923c',
    },
    weekChart: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, padding: '0 4px' },
    weekBar: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 },
    weekBarFill: {
      width: 20, borderRadius: 4, transition: 'height 0.3s',
    },
    weekLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
    emptyState: { textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.35)', fontSize: 13 },
    streakDays: { display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3 },
    streakDay: { aspectRatio: 1, borderRadius: 3 },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <Sparkles size={26} />
            生产力仪表盘
          </div>
          <div style={styles.subtitle}>专注计时 · 任务追踪 · 每日统计 · 打卡可视化</div>
        </div>
        <div style={styles.clockSection}>
          <div style={styles.clockTime}>
            {clock.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={styles.clockDate}>
            {clock.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
      </div>

      <div style={styles.grid3}>
        <div style={styles.glass}>
          <div style={styles.sectionTitle}>
            <Target size={16} style={{ color: '#22d3ee' }} />
            Pomodoro 计时器
          </div>
          <div style={styles.modeSwitch}>
            <button
              style={{ ...styles.modeBtn, ...(pomodoroMode === 'focus' ? styles.modeActive : {}) }}
              onClick={() => switchMode('focus')}
            >
              <Brain size={13} /> 专注
            </button>
            <button
              style={{ ...styles.modeBtn, ...(pomodoroMode === 'break' ? styles.modeActive : {}) }}
              onClick={() => switchMode('break')}
            >
              <Coffee size={13} /> 休息
            </button>
          </div>
          <div style={styles.pomodoroDisplay}>{formatTime(pomodoroTime)}</div>
          <div style={styles.pomodoroProgress}>
            <div style={{ ...styles.pomodoroProgressFill, width: `${pomodoroProgress}%` }} />
          </div>
          <div style={styles.pomodoroActions}>
            {!pomodoroRunning ? (
              <button style={{ ...styles.pomodoroBtn, ...styles.btnStart }} onClick={togglePomodoro}>
                <Play size={16} /> 开始
              </button>
            ) : (
              <button style={{ ...styles.pomodoroBtn, ...styles.btnPause }} onClick={togglePomodoro}>
                <Pause size={16} /> 暂停
              </button>
            )}
            <button style={styles.btnReset} onClick={resetPomodoro}>
              <RotateCcw size={14} /> 重置
            </button>
          </div>
        </div>

        <div style={styles.glass}>
          <div style={styles.sectionTitle}>
            <CheckCircle size={16} style={{ color: '#a78bfa' }} />
            任务清单
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              {pendingTasks} 待办 / {completedTasks} 完成
            </span>
          </div>
          <div style={styles.taskInput}>
            <input
              style={styles.input}
              placeholder="添加新任务..."
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <button style={styles.addBtn} onClick={addTask}>
              <Plus size={14} />
            </button>
          </div>
          <div style={styles.taskList}>
            {tasks.length === 0 ? (
              <div style={styles.emptyState}>
                <Circle size={20} style={{ margin: '0 auto 8px', color: 'rgba(255,255,255,0.15)' }} />
                还没有任务，开始添加吧
              </div>
            ) : (
              tasks.slice(0, 20).map(task => (
                <div key={task.id} style={styles.taskItem}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: task.done ? '#22d3ee' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {task.done ? <CheckCircle size={18} /> : <Circle size={18} />}
                  </button>
                  <span style={{ ...styles.taskText, ...(task.done ? styles.taskDone : {}) }}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          {completedTasks > 0 && (
            <button
              onClick={clearDoneTasks}
              style={{ ...styles.btnReset, marginTop: 10, width: '100%', justifyContent: 'center' }}
            >
              <Trash2 size={12} /> 清除已完成 ({completedTasks})
            </button>
          )}
        </div>

        <div style={styles.glass}>
          <div style={styles.sectionTitle}>
            <Zap size={16} style={{ color: '#fbbf24' }} />
            每日统计
          </div>
          <div style={styles.statCards}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'rgba(34,211,238,0.15)' }}>
                <Timer size={16} style={{ color: '#22d3ee' }} />
              </div>
              <div style={{ ...styles.statNum, color: '#22d3ee' }}>{totalFocusToday}</div>
              <div style={styles.statLabel}>今日专注(分钟)</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'rgba(167,139,250,0.15)' }}>
                <CheckCircle size={16} style={{ color: '#a78bfa' }} />
              </div>
              <div style={{ ...styles.statNum, color: '#a78bfa' }}>{tasksCompletedToday}</div>
              <div style={styles.statLabel}>今日完成</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'rgba(251,191,36,0.15)' }}>
                <Flame size={16} style={{ color: '#fbbf24' }} />
              </div>
              <div style={{ ...styles.statNum, color: '#fbbf24' }}>{streakDays}</div>
              <div style={styles.statLabel}>连续打卡(天)</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'rgba(244,114,182,0.15)' }}>
                <BarChart3 size={16} style={{ color: '#f472b6' }} />
              </div>
              <div style={{ ...styles.statNum, color: '#f472b6' }}>{totalFocusMinutes}</div>
              <div style={styles.statLabel}>累计专注(分)</div>
            </div>
          </div>

          <div style={styles.streakSection}>
            <div style={styles.streakHeader}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} /> 近7天趋势
              </div>
              <div style={styles.streakBadge}>
                <Flame size={12} /> 连续 {streakDays} 天
              </div>
            </div>
            <div style={styles.weekChart}>
              {last7Days.map((d, i) => {
                const maxFocus = Math.max(...last7Days.map(x => x.focus), 60)
                const heightPct = (d.focus / maxFocus) * 100
                const color = d.focus > 0 ? 'linear-gradient(180deg, #22d3ee, #a78bfa)' : 'rgba(255,255,255,0.1)'
                return (
                  <div key={i} style={styles.weekBar}>
                    <div
                      style={{
                        ...styles.weekBarFill,
                        height: `${Math.max(heightPct, 3)}%`,
                        background: color,
                      }}
                      title={`${d.date}: ${d.focus}分钟, ${d.tasks}个任务`}
                    />
                    <span style={styles.weekLabel}>{d.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.grid2, marginTop: 16 }}>
        <div style={styles.glass}>
          <div style={styles.sectionTitle}>
            <CloudRain size={16} style={{ color: '#60a5fa' }} />
            天气
          </div>
          <div style={styles.weatherCard}>
            <div style={styles.weatherMain}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: weatherCode !== undefined ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {weatherCode !== undefined && weatherCode < 3 ? <Sun size={28} style={{ color: '#fbbf24' }} /> :
                 weatherCode !== undefined && weatherCode < 50 ? <CloudRain size={28} style={{ color: '#60a5fa' }} /> :
                 weatherCode !== undefined && weatherCode < 70 ? <Droplets size={28} style={{ color: '#60a5fa' }} /> :
                 <CloudRain size={28} style={{ color: '#a78bfa' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.weatherTemp}>
                  {weather?.current?.temperature_2m !== undefined ? `${Math.round(weather.current.temperature_2m)}°` : '--'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  {weatherDesc || (weatherLoading ? '加载中...' : '获取天气数据失败')}
                </div>
              </div>
            </div>
            <div style={styles.weatherInfo}>
              <div style={styles.weatherItem}>
                <Droplets size={13} />
                湿度 {weather?.current?.relative_humidity_2m ?? '--'}%
              </div>
              <div style={styles.weatherItem}>
                <Wind size={13} />
                风速 {weather?.current?.wind_speed_10m ?? '--'} km/h
              </div>
              {weather?.daily?.temperature_2m_max && (
                <div style={styles.weatherItem}>
                  <Thermometer size={13} />
                  最高 {Math.round(weather.daily.temperature_2m_max[0])}°
                </div>
              )}
              {weather?.daily?.temperature_2m_min && (
                <div style={styles.weatherItem}>
                  <Gauge size={13} />
                  最低 {Math.round(weather.daily.temperature_2m_min[0])}°
                </div>
              )}
            </div>
            <div style={{ ...styles.cityPicker, marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  style={{ ...styles.input, padding: '8px 12px', fontSize: 12 }}
                  placeholder="搜索城市..."
                  value={citySearch || city}
                  onChange={e => { setCitySearch(e.target.value); setShowCityPicker(true) }}
                  onFocus={() => setShowCityPicker(true)}
                  onBlur={() => setTimeout(() => { setShowCityPicker(false); setCitySearch('') }, 200)}
                />
              </div>
              {showCityPicker && (
                <div style={styles.cityList}>
                  {filteredCities.map(c => (
                    <div
                      key={c.name}
                      style={{
                        ...styles.cityItem,
                        background: city === c.name ? 'rgba(34,211,238,0.15)' : 'transparent',
                      }}
                      onMouseDown={() => { setCity(c.name); setCitySearch(''); setShowCityPicker(false) }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.glass}>
          <div style={styles.sectionTitle}>
            <Quote size={16} style={{ color: '#a78bfa' }} />
            每日名言
          </div>
          <div style={styles.quoteCard}>
            {quoteLoading ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>加载中...</div>
            ) : (
              <>
                <div style={styles.quoteText}>"{quote.text}"</div>
                <div style={styles.quoteAuthor}>— {quote.author}</div>
                <button
                  style={{ ...styles.btnReset, marginTop: 14 }}
                  onClick={fetchQuote}
                >
                  <Sparkles size={14} /> 换一条
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={styles.sectionTitle}>
              <Activity size={16} style={{ color: '#22d3ee' }} />
              专注热力图
            </div>
            <div style={styles.streakDays}>
              {Array.from({ length: 30 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (29 - i))
                const key = d.toISOString().slice(0, 10)
                const stat = stats.find(s => s.date === key)
                const minutes = stat?.focusMinutes || 0
                const intensity = Math.min(minutes / 60, 1)
                let bg = 'rgba(255,255,255,0.05)'
                if (intensity > 0 && intensity <= 0.25) bg = 'rgba(34,211,238,0.2)'
                else if (intensity <= 0.5) bg = 'rgba(34,211,238,0.4)'
                else if (intensity <= 0.75) bg = 'rgba(167,139,250,0.6)'
                else if (intensity <= 1) bg = 'rgba(167,139,250,0.9)'
                return (
                  <div
                    key={key}
                    style={{ ...styles.streakDay, background: bg }}
                    title={`${key}: ${minutes}分钟专注`}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              <span>少</span>
              <span style={{ width: 10, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
              <span style={{ width: 10, height: 10, background: 'rgba(34,211,238,0.2)', borderRadius: 2 }} />
              <span style={{ width: 10, height: 10, background: 'rgba(34,211,238,0.4)', borderRadius: 2 }} />
              <span style={{ width: 10, height: 10, background: 'rgba(167,139,250,0.6)', borderRadius: 2 }} />
              <span style={{ width: 10, height: 10, background: 'rgba(167,139,250,0.9)', borderRadius: 2 }} />
              <span>多</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default ProductivityDashboard