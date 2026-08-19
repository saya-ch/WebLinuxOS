import { useEffect, useMemo, useRef, useState } from 'react'

/* =========================================================
   MindSync Pro · 效率中心
   - 五大模块：番茄钟 · 任务看板 · 习惯追踪 · 每日反思 · 效率统计
   - 全部数据持久化到 localStorage
   - 设计风格：温暖极简 · 柔和有机 · 呼吸感动效
   ========================================================= */

type TabKey = 'pomodoro' | 'tasks' | 'habits' | 'reflection' | 'stats'

interface Task {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'mid' | 'high'
  tags: string[]
  estimatePomodoros: number
  completedPomodoros: number
  createdAt: number
  doneAt?: number
}

interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  streak: number
  bestStreak: number
  completedDates: string[] // YYYY-MM-DD
  createdAt: number
}

interface Reflection {
  date: string // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5
  todayWin: string
  tomorrowFocus: string
  gratitude: string
  lessonLearned: string
  updatedAt: number
}

interface PomodoroSession {
  id: string
  startedAt: number
  durationMin: number
  type: 'focus' | 'break' | 'longBreak'
  completed: boolean
  taskId?: string
  date: string
}

const STORAGE = {
  TASKS: 'mindsync:tasks',
  HABITS: 'mindsync:habits',
  REFLECTIONS: 'mindsync:reflections',
  SESSIONS: 'mindsync:sessions',
}

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const load = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {}
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

const pad = (n: number) => String(n).padStart(2, '0')

const fmtDuration = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`

/* ========= 颜色与主题（温暖极简） ========= */
const theme = {
  bg: 'linear-gradient(135deg, #fdfaf5 0%, #f7efe3 50%, #f2e6d3 100%)',
  cardBg: 'rgba(255, 252, 246, 0.72)',
  cardBorder: '1px solid rgba(180, 140, 90, 0.15)',
  shadow: '0 6px 28px rgba(120, 80, 40, 0.08)',
  text: '#3b3024',
  subtext: '#8a775f',
  accent: '#c87d4a',
  accentSoft: '#e9b98a',
  success: '#6ea57a',
  warning: '#d9a441',
  danger: '#c06a5a',
  calm: '#6a8fa5',
}

const habitColors = [
  '#c87d4a', '#6ea57a', '#6a8fa5', '#b07088',
  '#d9a441', '#8a75c0', '#5b9d94', '#c06a5a',
]
const habitEmojis = ['📚', '💧', '🏃', '🧘', '✍️', '🌱', '💤', '🎯', '🥗', '🎨']

/* ========= 子组件：番茄钟 ========= */
function PomodoroPanel({
  sessions, setSessions, tasks,
}: {
  sessions: PomodoroSession[]
  setSessions: (s: PomodoroSession[]) => void
  tasks: Task[]
}) {
  const [mode, setMode] = useState<'focus' | 'break' | 'longBreak'>('focus')
  const [running, setRunning] = useState(false)
  const [autoStart, setAutoStart] = useState(() => load('mindsync:autostart', false))
  const [settings, setSettings] = useState(() => load('mindsync:settings', {
    focus: 25, short: 5, long: 15, every: 4,
  }))
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [soundOn, setSoundOn] = useState(true)

  const durations = useMemo(() => ({
    focus: settings.focus * 60,
    break: settings.short * 60,
    longBreak: settings.long * 60,
  }), [settings])

  const [remaining, setRemaining] = useState(durations.focus)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const intervalRef = useRef<number | null>(null)

  // persist settings & autostart
  useEffect(() => { save('mindsync:settings', settings) }, [settings])
  useEffect(() => { save('mindsync:autostart', autoStart) }, [autoStart])

  // mode change -> reset timer
  useEffect(() => {
    setRemaining(durations[mode])
  }, [mode, durations])

  // Audio feedback
  const playTone = (kind: 'start' | 'end') => {
    if (!soundOn) return
    try {
      const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      const ctx = new AC()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      const freqs = kind === 'start' ? [523, 659] : [784, 659, 523]
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'; o.frequency.value = f
        g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.15)
        g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + i * 0.15 + 0.03)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.35)
        o.start(ctx.currentTime + i * 0.15)
        o.stop(ctx.currentTime + i * 0.15 + 0.38)
      })
      osc.stop(ctx.currentTime + 0.01)
      setTimeout(() => ctx.close(), 1200)
    } catch {}
  }

  // 开始一个新 session 记录
  const startSessionRecord = (t: PomodoroSession['type']) => {
    const s: PomodoroSession = {
      id: uid(),
      startedAt: Date.now(),
      durationMin: t === 'focus' ? settings.focus : t === 'break' ? settings.short : settings.long,
      type: t,
      completed: false,
      taskId: selectedTaskId || undefined,
      date: todayStr(),
    }
    const next = [s, ...sessions].slice(0, 500)
    setSessions(next)
  }

  // 结束一个 session
  const finalizeSession = () => {
    const today = todayStr()
    const copy = [...sessions]
    if (copy.length && !copy[0].completed && copy[0].startedAt) {
      copy[0] = { ...copy[0], completed: true, date: today }
      setSessions(copy)
    }
    if (mode === 'focus' && selectedTaskId) {
      // increment task completed pomodoros
      const t = tasks.find(x => x.id === selectedTaskId)
      if (t) {
        // we mutate via parent: since tasks is parent state, dispatch CustomEvent
        const ev = new CustomEvent('mindsync:task-inc-pomo', { detail: { taskId: selectedTaskId } })
        window.dispatchEvent(ev)
      }
    }
  }

  // tick interval
  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            // finished
            playTone('end')
            finalizeSession()
            if (mode === 'focus') {
              setPomodoroCount(c => c + 1)
              const nextCount = pomodoroCount + 1
              const isLong = nextCount % settings.every === 0
              const nextMode: PomodoroSession['type'] = isLong ? 'longBreak' : 'break'
              if (autoStart) {
                setTimeout(() => {
                  setMode(nextMode)
                  startSessionRecord(nextMode)
                  setRunning(true)
                  playTone('start')
                }, 600)
              } else {
                setMode(nextMode)
                setRunning(false)
              }
            } else {
              // break done -> next focus
              if (autoStart) {
                setTimeout(() => {
                  setMode('focus')
                  startSessionRecord('focus')
                  setRunning(true)
                  playTone('start')
                }, 600)
              } else {
                setMode('focus')
                setRunning(false)
              }
            }
            return durations[mode === 'focus' ? 'break' : 'focus']
          }
          return r - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, durations, autoStart, settings.every, pomodoroCount])

  const total = durations[mode]
  const progress = 1 - remaining / total

  const start = () => {
    if (!running) {
      setRunning(true)
      playTone('start')
      startSessionRecord(mode)
    }
  }
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setRemaining(durations[mode])
  }
  const skip = () => {
    setRunning(false)
    setRemaining(0)
    setTimeout(() => setRemaining(durations[mode] === remaining ? durations[mode] : remaining), 0)
    // 手动切换模式
    if (mode === 'focus') {
      setMode((pomodoroCount + 1) % settings.every === 0 ? 'longBreak' : 'break')
    } else {
      setMode('focus')
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 24px', gap: 24,
    }}>
      {/* Mode tabs */}
      <div style={{
        display: 'inline-flex', padding: 4, borderRadius: 999,
        background: 'rgba(255,255,255,0.5)', border: theme.cardBorder,
        boxShadow: theme.shadow, backdropFilter: 'blur(8px)',
      }}>
        {([
          { k: 'focus', label: '专注' },
          { k: 'break', label: '短休' },
          { k: 'longBreak', label: '长休' },
        ] as { k: typeof mode; label: string }[]).map(item => (
          <button key={item.k}
            onClick={() => { if (!running) setMode(item.k) }}
            disabled={running}
            style={{
              padding: '8px 22px', borderRadius: 999,
              border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
              background: mode === item.k
                ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentSoft} 100%)`
                : 'transparent',
              color: mode === item.k ? 'white' : theme.subtext,
              transition: 'all .2s ease',
              opacity: running ? 0.6 : 1,
            }}>
            {item.label}
          </button>
        ))}
      </div>

      {/* Progress ring + timer */}
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <svg viewBox="0 0 280 280" width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={theme.accent} />
              <stop offset="100%" stopColor={theme.accentSoft} />
            </linearGradient>
          </defs>
          <circle cx="140" cy="140" r="124" fill="none"
            stroke="rgba(200, 125, 74, 0.1)" strokeWidth="10" />
          <circle cx="140" cy="140" r="124" fill="none"
            stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 124}
            strokeDashoffset={(1 - progress) * 2 * Math.PI * 124}
            style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,.61,.36,1)' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 56, fontWeight: 200, letterSpacing: 2, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
            {fmtDuration(remaining)}
          </div>
          <div style={{ fontSize: 12, color: theme.subtext, textTransform: 'uppercase', letterSpacing: 3, marginTop: 8 }}>
            {mode === 'focus' ? 'Focus Session' : mode === 'break' ? 'Short Break' : 'Long Break'}
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: theme.accent, fontWeight: 600 }}>
            今日完成 {sessions.filter(s => s.date === todayStr() && s.type === 'focus' && s.completed).length} 个番茄
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={reset} style={iconBtn('#eee5d5', theme.text)} title="重置">↺</button>
        <button
          onClick={running ? pause : start}
          style={{
            padding: '14px 44px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
            background: running
              ? 'linear-gradient(135deg, #d9a441 0%, #e9b98a 100%)'
              : `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentSoft} 100%)`,
            color: 'white', boxShadow: `0 10px 30px ${theme.accent}44`,
            transition: 'transform .15s ease, box-shadow .2s ease',
          }}>
          {running ? '⏸  暂停' : '▶  开始'}
        </button>
        <button onClick={skip} style={iconBtn('#eee5d5', theme.text)} title="跳过">⏭</button>
      </div>

      {/* Associate task */}
      <div style={{
        width: '100%', maxWidth: 420, padding: '14px 18px',
        background: theme.cardBg, border: theme.cardBorder,
        borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
      }}>
        <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 8, letterSpacing: 1 }}>
          关联任务（可选）
        </div>
        <select value={selectedTaskId}
          onChange={e => setSelectedTaskId(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 10,
            border: '1px solid rgba(180, 140, 90, 0.2)', background: 'white',
            color: theme.text, fontSize: 13, outline: 'none',
          }}>
          <option value="">— 无关联任务 —</option>
          {tasks.filter(t => t.status !== 'done').map(t => (
            <option key={t.id} value={t.id}>
              [{t.priority === 'high' ? '高' : t.priority === 'mid' ? '中' : '低'}] {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Settings */}
      <div style={{
        width: '100%', maxWidth: 420, padding: '16px 18px',
        background: theme.cardBg, border: theme.cardBorder,
        borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
      }}>
        <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 12, letterSpacing: 1 }}>
          时间设置（分钟）· 声音 · 自动开始
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { k: 'focus', label: '专注', min: 1, max: 90 },
            { k: 'short', label: '短休', min: 1, max: 30 },
            { k: 'long', label: '长休', min: 5, max: 60 },
            { k: 'every', label: '长休周期', min: 2, max: 10 },
          ].map(row => (
            <label key={row.k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: theme.subtext }}>{row.label}</span>
              <input type="number" min={row.min} max={row.max}
                value={settings[row.k as keyof typeof settings]}
                onChange={e => {
                  const v = Math.max(row.min, Math.min(row.max, parseInt(e.target.value) || row.min))
                  setSettings({ ...settings, [row.k]: v })
                }}
                style={{
                  padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(180,140,90,0.2)',
                  fontSize: 13, background: 'white', color: theme.text, outline: 'none',
                  textAlign: 'center',
                }} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12, color: theme.subtext, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoStart} onChange={e => setAutoStart(e.target.checked)} />
            自动开始下一阶段
          </label>
          <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12, color: theme.subtext, cursor: 'pointer' }}>
            <input type="checkbox" checked={soundOn} onChange={e => setSoundOn(e.target.checked)} />
            提示音
          </label>
          <div style={{ fontSize: 12, color: theme.accentSoft }}>
            已完成 {pomodoroCount} 轮 · 即将
            {pomodoroCount % settings.every === settings.every - 1 ? '长休' : '短休'}
          </div>
        </div>
      </div>
    </div>
  )
}

const iconBtn = (bg: string, color: string): React.CSSProperties => ({
  width: 42, height: 42, borderRadius: '50%',
  border: 'none', cursor: 'pointer', fontSize: 16,
  background: bg, color,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  transition: 'transform .15s ease',
})

/* ========= 子组件：任务看板 ========= */
function TasksPanel({
  tasks, setTasks,
}: {
  tasks: Task[]
  setTasks: (t: Task[]) => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('mid')
  const [newTags, setNewTags] = useState('')
  const [newEstimate, setNewEstimate] = useState(2)
  const [filter, setFilter] = useState<string>('all')

  // 监听番茄钟完成事件，增加 completedPomodoros
  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ taskId: string }>
      const id = ce.detail?.taskId
      if (!id) return
      setTasks(tasks.map(t => t.id === id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t))
    }
    window.addEventListener('mindsync:task-inc-pomo', h)
    return () => window.removeEventListener('mindsync:task-inc-pomo', h)
  }, [tasks, setTasks])

  const addTask = () => {
    const t = newTitle.trim()
    if (!t) return
    const task: Task = {
      id: uid(),
      title: t,
      status: 'todo',
      priority: newPriority,
      tags: newTags.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean),
      estimatePomodoros: newEstimate,
      completedPomodoros: 0,
      createdAt: Date.now(),
    }
    setTasks([task, ...tasks])
    setNewTitle(''); setNewTags('')
  }

  const updateStatus = (id: string, status: Task['status']) => {
    setTasks(tasks.map(t => t.id === id ? {
      ...t, status, doneAt: status === 'done' ? Date.now() : undefined,
    } : t))
  }
  const removeTask = (id: string) => setTasks(tasks.filter(t => t.id !== id))

  const cols: { key: Task['status']; title: string; hint: string }[] = [
    { key: 'todo', title: '待办', hint: '将要做' },
    { key: 'doing', title: '进行中', hint: '正专注' },
    { key: 'done', title: '已完成', hint: '太棒了' },
  ]

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'today') {
      const today = todayStr()
      const cd = new Date(t.createdAt).toISOString().slice(0, 10)
      const dd = t.doneAt ? new Date(t.doneAt).toISOString().slice(0, 10) : null
      return cd === today || dd === today
    }
    return t.priority === filter
  })

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Add form */}
      <div style={{
        padding: 16, background: theme.cardBg, border: theme.cardBorder,
        borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 110px auto', gap: 10, alignItems: 'end' }}>
          <input type="text"
            placeholder="添加一个新任务...  (Enter 提交)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask() }}
            style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13,
              border: '1px solid rgba(180,140,90,0.2)', background: 'white',
              color: theme.text, outline: 'none',
            }} />
          <select value={newPriority} onChange={e => setNewPriority(e.target.value as Task['priority'])}
            style={smallInput()}>
            <option value="low">🟢 低优</option>
            <option value="mid">🟡 中优</option>
            <option value="high">🔴 高优</option>
          </select>
          <input type="number" min={0} max={20} value={newEstimate}
            onChange={e => setNewEstimate(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
            style={{ ...smallInput(), textAlign: 'center' }}
            title="预估番茄数" />
          <input type="text" placeholder="标签(逗号分隔)" value={newTags}
            onChange={e => setNewTags(e.target.value)}
            style={smallInput()} />
          <button onClick={addTask}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'white',
              background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentSoft} 100%)`,
            }}>添加</button>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['all', '全部'], ['today', '今日'], ['high', '高优'],
            ['mid', '中优'], ['low', '低优'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                padding: '4px 14px', fontSize: 12, borderRadius: 999,
                border: 'none', cursor: 'pointer',
                background: filter === k ? theme.accent : 'rgba(200,125,74,0.1)',
                color: filter === k ? 'white' : theme.subtext,
                transition: 'all .15s ease',
              }}>{l}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: theme.subtext, alignSelf: 'center' }}>
            共 {filtered.length} 项 · 进行中 {filtered.filter(t => t.status === 'doing').length} · 已完成 {filtered.filter(t => t.status === 'done').length}
          </div>
        </div>
      </div>

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, minHeight: 420 }}>
        {cols.map(col => {
          const items = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key}
              style={{
                background: `linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 100%)`,
                border: theme.cardBorder,
                borderRadius: 18, padding: 14,
                boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{col.title}</div>
                  <div style={{ fontSize: 11, color: theme.subtext }}>{col.hint} · {items.length}</div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: col.key === 'todo' ? theme.warning
                    : col.key === 'doing' ? theme.accent : theme.success,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {items.map(t => (
                  <div key={t.id}
                    style={{
                      padding: 12, borderRadius: 12, background: 'white',
                      border: '1px solid rgba(180,140,90,0.12)',
                      boxShadow: '0 2px 8px rgba(120,80,40,0.04)',
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                    <div style={{ fontSize: 13, color: theme.text, fontWeight: 500, lineHeight: 1.4 }}>
                      {t.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <span style={tagStyle(t.priority === 'high' ? '#f5e2dc' : t.priority === 'mid' ? '#f7ecd2' : '#d7e6da',
                        t.priority === 'high' ? theme.danger : t.priority === 'mid' ? theme.warning : theme.success)}>
                        {t.priority === 'high' ? '高优' : t.priority === 'mid' ? '中优' : '低优'}
                      </span>
                      <span style={tagStyle('#eee5d5', theme.accent)}>
                        🍅 {t.completedPomodoros}/{t.estimatePomodoros}
                      </span>
                      {t.tags.map(tag => (
                        <span key={tag} style={tagStyle('rgba(120,80,40,0.07)', theme.subtext)}>#{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {cols.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={() => updateStatus(t.id, c.key)}
                          style={{
                            padding: '3px 10px', fontSize: 11, borderRadius: 6,
                            border: '1px solid rgba(180,140,90,0.15)', background: 'transparent',
                            color: theme.subtext, cursor: 'pointer',
                          }}>→ {c.title}</button>
                      ))}
                      <button onClick={() => removeTask(t.id)}
                        style={{
                          marginLeft: 'auto', padding: '3px 8px', fontSize: 11, borderRadius: 6,
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          color: theme.danger,
                        }} title="删除">删除</button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{
                    padding: 28, textAlign: 'center', fontSize: 12, color: theme.subtext,
                    border: '1px dashed rgba(180,140,90,0.2)', borderRadius: 12,
                    fontStyle: 'italic', opacity: 0.7,
                  }}>
                    {col.key === 'todo' ? '没有待办任务，添加一个试试吧～' : col.key === 'doing' ? '专注时任务会出现在这里' : '完成的任务会在这里庆祝 🎉'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const smallInput = (): React.CSSProperties => ({
  padding: '8px 10px', borderRadius: 10, fontSize: 12,
  border: '1px solid rgba(180,140,90,0.2)', background: 'white',
  color: theme.text, outline: 'none',
})

const tagStyle = (bg: string, color: string): React.CSSProperties => ({
  padding: '2px 8px', borderRadius: 999,
  fontSize: 11, background: bg, color, fontWeight: 500,
  display: 'inline-block',
})

/* ========= 子组件：习惯追踪 ========= */
function HabitsPanel({
  habits, setHabits,
}: {
  habits: Habit[]
  setHabits: (h: Habit[]) => void
}) {
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState(habitEmojis[0])
  const today = todayStr()

  const addHabit = () => {
    const n = newName.trim()
    if (!n) return
    const h: Habit = {
      id: uid(), name: n, emoji: newEmoji,
      color: habitColors[habits.length % habitColors.length],
      streak: 0, bestStreak: 0,
      completedDates: [], createdAt: Date.now(),
    }
    setHabits([...habits, h])
    setNewName('')
  }

  const isDone = (h: Habit, d: string) => h.completedDates.includes(d)

  const toggleHabit = (id: string, date: string) => {
    setHabits(habits.map(h => {
      if (h.id !== id) return h
      let completedDates: string[]
      let streak = h.streak
      let bestStreak = h.bestStreak
      if (h.completedDates.includes(date)) {
        completedDates = h.completedDates.filter(x => x !== date)
        // simplified: recompute streak from scratch
      } else {
        completedDates = [...h.completedDates, date].sort()
      }
      // recompute streak (consecutive days up to today)
      const set = new Set(completedDates)
      let s = 0
      let cur = today
      while (set.has(cur)) {
        s++
        const d = new Date(cur)
        d.setDate(d.getDate() - 1)
        cur = d.toISOString().slice(0, 10)
      }
      streak = s
      bestStreak = Math.max(streak, h.bestStreak)
      return { ...h, completedDates, streak, bestStreak }
    }))
  }

  const removeHabit = (id: string) => setHabits(habits.filter(h => h.id !== id))

  // last 21 days
  const last21 = useMemo(() => {
    const arr: string[] = []
    const d = new Date()
    for (let i = 20; i >= 0; i--) {
      const x = new Date(d)
      x.setDate(x.getDate() - i)
      arr.push(x.toISOString().slice(0, 10))
    }
    return arr
  }, [])

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* add */}
      <div style={{
        padding: 16, background: theme.cardBg, border: theme.cardBorder,
        borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
          style={{ ...smallInput(), padding: '10px 12px', fontSize: 18, width: 56, textAlign: 'center' }}>
          {habitEmojis.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="text" placeholder="培养一个新习惯... 比如：每天阅读30分钟"
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addHabit() }}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            border: '1px solid rgba(180,140,90,0.2)', background: 'white',
            color: theme.text, outline: 'none',
          }} />
        <button onClick={addHabit}
          style={{
            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: 'white',
            background: `linear-gradient(135deg, ${theme.success} 0%, #8fc19a 100%)`,
          }}>+ 新增</button>
      </div>

      {/* list */}
      {habits.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', borderRadius: 16,
          background: theme.cardBg, border: '1px dashed rgba(180,140,90,0.25)',
          color: theme.subtext,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 15, marginBottom: 6, color: theme.text }}>还没有习惯</div>
          <div style={{ fontSize: 12 }}>坚持21天，见证自己的蜕变</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '180px repeat(21, 1fr) 120px',
            gap: 6, padding: '10px 14px', fontSize: 10,
            color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.8,
            borderBottom: '1px solid rgba(180,140,90,0.12)',
          }}>
            <div>习惯</div>
            {last21.map(d => {
              const day = new Date(d).getDate()
              const wk = new Date(d).getDay()
              return <div key={d} style={{ textAlign: 'center', opacity: (wk === 0 || wk === 6) ? 0.6 : 1 }}>
                {day}
              </div>
            })}
            <div style={{ textAlign: 'right' }}>连胜 / 最佳</div>
          </div>

          {habits.map(h => (
            <div key={h.id}
              style={{
                display: 'grid', gridTemplateColumns: '180px repeat(21, 1fr) 120px',
                gap: 6, alignItems: 'center',
                padding: '10px 14px', background: 'white',
                borderRadius: 12, border: '1px solid rgba(180,140,90,0.12)',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: theme.text, fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: theme.subtext }}>
                    已坚持 {h.completedDates.length} 天
                  </div>
                </div>
                <button onClick={() => removeHabit(h.id)}
                  style={{
                    border: 'none', background: 'transparent',
                    color: theme.subtext, cursor: 'pointer', fontSize: 14,
                    opacity: 0.4, padding: 4,
                  }} title="删除习惯">×</button>
              </div>
              {last21.map(d => {
                const done = isDone(h, d)
                const isToday = d === today
                return (
                  <button key={d} onClick={() => toggleHabit(h.id, d)}
                    title={`${d} · ${done ? '已完成，点击取消' : '点击标记完成'}`}
                    style={{
                      width: '100%', aspectRatio: '1',
                      borderRadius: isToday ? 8 : 6,
                      border: isToday ? `2px solid ${h.color}` : 'none',
                      background: done ? h.color : 'rgba(180,140,90,0.08)',
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                      boxShadow: done && isToday ? `0 0 0 3px ${h.color}33` : 'none',
                    }}>
                    {done && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                  </button>
                )
              })}
              <div style={{ textAlign: 'right', fontSize: 12 }}>
                <span style={{ color: h.color, fontWeight: 700 }}>🔥 {h.streak}</span>
                <span style={{ color: theme.subtext, marginLeft: 6 }}>/ {h.bestStreak}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ========= 子组件：每日反思 ========= */
function ReflectionPanel({
  reflections, setReflections,
}: {
  reflections: Reflection[]
  setReflections: (r: Reflection[]) => void
}) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const existing = reflections.find(r => r.date === selectedDate)
  const [mood, setMood] = useState<Reflection['mood']>(existing?.mood ?? 3)
  const [todayWin, setTodayWin] = useState(existing?.todayWin ?? '')
  const [tomorrowFocus, setTomorrowFocus] = useState(existing?.tomorrowFocus ?? '')
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '')
  const [lesson, setLesson] = useState(existing?.lessonLearned ?? '')

  useEffect(() => {
    const e = reflections.find(r => r.date === selectedDate)
    setMood(e?.mood ?? 3)
    setTodayWin(e?.todayWin ?? '')
    setTomorrowFocus(e?.tomorrowFocus ?? '')
    setGratitude(e?.gratitude ?? '')
    setLesson(e?.lessonLearned ?? '')
  }, [selectedDate, reflections])

  const saveReflection = () => {
    const body: Reflection = {
      date: selectedDate, mood, todayWin,
      tomorrowFocus, gratitude, lessonLearned: lesson,
      updatedAt: Date.now(),
    }
    const others = reflections.filter(r => r.date !== selectedDate)
    const hasAny = mood !== 3 || todayWin || tomorrowFocus || gratitude || lesson
    const next = hasAny ? [body, ...others] : others
    setReflections(next.sort((a, b) => b.date.localeCompare(a.date)))
    // toast via custom event - simple fade note
    const el = document.createElement('div')
    el.textContent = '✓ 反思已保存'
    Object.assign(el.style, {
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      padding: '8px 18px', borderRadius: 999, background: 'rgba(110,165,122,0.95)',
      color: 'white', fontSize: 12, fontWeight: 600, zIndex: 99999,
      boxShadow: '0 6px 18px rgba(0,0,0,0.15)', transition: 'opacity .3s',
    })
    document.body.appendChild(el)
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 320) }, 1400)
  }

  const promptLabel = (
    label: string, hint: string, icon: string,
    val: string, set: (v: string) => void,
    rows = 3,
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{label}</span>
        <span style={{ fontSize: 11, color: theme.subtext }}>{hint}</span>
      </div>
      <textarea rows={rows} value={val} onChange={e => set(e.target.value)}
        onBlur={saveReflection}
        style={{
          padding: 12, borderRadius: 12, fontSize: 13, lineHeight: 1.6,
          border: '1px solid rgba(180,140,90,0.18)', background: 'white',
          color: theme.text, outline: 'none', resize: 'vertical',
          fontFamily: 'inherit',
        }} />
    </div>
  )

  const recentDates = useMemo(() => {
    const arr: string[] = []
    const d = new Date(today)
    for (let i = 0; i < 7; i++) {
      const x = new Date(d)
      x.setDate(x.getDate() - i)
      arr.push(x.toISOString().slice(0, 10))
    }
    return arr
  }, [today])

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* history */}
        <div style={{
          width: 220, flexShrink: 0, padding: 16,
          background: theme.cardBg, border: theme.cardBorder,
          borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
        }}>
          <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 10, letterSpacing: 1 }}>
            最近七天
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentDates.map(d => {
              const r = reflections.find(x => x.date === d)
              const dt = new Date(d)
              const label = d === today ? '今天' : d === recentDates[1] ? '昨天' : `${dt.getMonth() + 1}月${dt.getDate()}日`
              const wk = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
              return (
                <button key={d} onClick={() => setSelectedDate(d)}
                  style={{
                    textAlign: 'left', padding: '8px 10px', borderRadius: 10,
                    border: selectedDate === d ? `1.5px solid ${theme.accent}` : '1px solid transparent',
                    background: selectedDate === d ? 'rgba(200,125,74,0.1)' : 'transparent',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: 12, color: theme.text,
                  }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{label} <span style={{ color: theme.subtext, fontSize: 10 }}>周{wk}</span></div>
                  </div>
                  <div>
                    {r ? '😀😐😟😔🥳'.split('').slice((r.mood - 1), r.mood)[0] : <span style={{ color: theme.subtext, opacity: 0.3 }}>○</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mood */}
          <div style={{
            padding: 16, background: theme.cardBg, border: theme.cardBorder,
            borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 10 }}>
              今天的心情如何？
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => {
                const emojis = ['😔', '😟', '😐', '🙂', '🥳']
                const labels = ['糟糕', '不太好', '一般', '不错', '超棒']
                const selected = mood === n
                return (
                  <button key={n} onClick={() => { setMood(n as 1 | 2 | 3 | 4 | 5); saveReflection() }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 4, padding: '10px 16px', borderRadius: 14,
                      border: selected ? `2px solid ${theme.accent}` : '2px solid transparent',
                      background: selected ? 'rgba(200,125,74,0.1)' : 'transparent',
                      cursor: 'pointer', transition: 'all .15s ease',
                      transform: selected ? 'scale(1.08)' : 'none',
                    }}>
                    <span style={{ fontSize: 32 }}>{emojis[n - 1]}</span>
                    <span style={{ fontSize: 11, color: selected ? theme.accent : theme.subtext, fontWeight: selected ? 600 : 400 }}>
                      {labels[n - 1]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {promptLabel('今日小成就', '哪怕只是起床和喝水', '🏆', todayWin, setTodayWin)}
          {promptLabel('明天的焦点', '一件事就好', '🎯', tomorrowFocus, setTomorrowFocus)}
          {promptLabel('感恩之事', '具体到一个人或一件小事', '💖', gratitude, setGratitude)}
          {promptLabel('学到的教训', '失败和成功都是财富', '📖', lesson, setLesson, 3)}
        </div>
      </div>
    </div>
  )
}

/* ========= 子组件：效率统计 ========= */
function StatsPanel({
  sessions, tasks, habits, reflections,
}: {
  sessions: PomodoroSession[]
  tasks: Task[]
  habits: Habit[]
  reflections: Reflection[]
}) {
  const today = todayStr()
  const days7 = new Date()
  days7.setDate(days7.getDate() - 6)
  const days7Str = days7.toISOString().slice(0, 10)

  const todayFocusSessions = sessions.filter(s => s.date === today && s.type === 'focus' && s.completed)
  const todayFocusMin = todayFocusSessions.reduce((s, x) => s + x.durationMin, 0)
  const todayTasksDone = tasks.filter(t => t.doneAt && new Date(t.doneAt).toISOString().slice(0, 10) === today).length

  // last 7 days per-date stats
  const last7 = useMemo(() => {
    const arr: { date: string; minutes: number; done: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      const min = sessions.filter(s => s.date === ds && s.type === 'focus' && s.completed)
        .reduce((a, b) => a + b.durationMin, 0)
      const done = tasks.filter(t => t.doneAt && new Date(t.doneAt).toISOString().slice(0, 10) === ds).length
      arr.push({ date: ds, minutes: min, done })
    }
    return arr
  }, [sessions, tasks])
  const maxMin = Math.max(30, ...last7.map(x => x.minutes))

  const last7DaysLabel = last7.map(x => {
    const d = new Date(x.date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  const totalFocusMin = sessions.filter(s => s.type === 'focus' && s.completed)
    .reduce((a, b) => a + b.durationMin, 0)
  const totalTasksDone = tasks.filter(t => t.status === 'done').length
  const avgHabitCompletion = habits.length > 0
    ? Math.round(habits.reduce((s, h) => {
        const last7Set = new Set(last7.map(x => x.date))
        const did = h.completedDates.filter(d => last7Set.has(d)).length
        return s + did / 7
      }, 0) / habits.length * 100)
    : 0

  const reflectionCount = reflections.filter(r => r.date >= days7Str).length

  const statCard = (label: string, value: string, hint: string, accent: string, icon: string) => (
    <div style={{
      padding: 18, background: 'white', borderRadius: 16,
      border: `1px solid ${accent}22`, boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: 4,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -12, top: -12, width: 72, height: 72, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
      }} />
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 300, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{label}</div>
      <div style={{ fontSize: 11, color: theme.subtext }}>{hint}</div>
    </div>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {statCard('今日专注', `${todayFocusMin} 分钟`, `共 ${todayFocusSessions.length} 个番茄`, theme.accent, '⏳')}
        {statCard('今日完成', `${todayTasksDone} 项`, '任务看板已完成', theme.success, '✅')}
        {statCard('累计专注', `${Math.floor(totalFocusMin / 60)}h ${totalFocusMin % 60}m`, `${sessions.filter(s => s.type === 'focus' && s.completed).length} 个番茄`, theme.calm, '📈')}
        {statCard('任务总数', `${totalTasksDone} 完成`, `共 ${tasks.length} 项任务`, theme.warning, '📋')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {statCard('习惯坚持率', `${avgHabitCompletion}%`, '近 7 天平均每日完成度', theme.success, '🌿')}
        {statCard('习惯总数', `${habits.length} 项`, `最佳连胜 ${Math.max(0, ...habits.map(h => h.bestStreak))} 天`, theme.warning, '🔥')}
        {statCard('反思日记', `${reflectionCount} 篇`, '近 7 天坚持记录', '#b07088', '📔')}
      </div>

      {/* Focus minutes chart */}
      <div style={{
        padding: 20, background: theme.cardBg, border: theme.cardBorder,
        borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>近 7 天专注时长</div>
            <div style={{ fontSize: 11, color: theme.subtext }}>分钟 · 越高的柱子代表越投入的学习/工作</div>
          </div>
          <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600 }}>
            周合计 {last7.reduce((s, x) => s + x.minutes, 0)} 分钟
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14, height: 180, alignItems: 'end' }}>
          {last7.map((d, i) => {
            const h = (d.minutes / maxMin) * 100
            const isToday = d.date === today
            return (
              <div key={d.date} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8, height: '100%',
              }}>
                <div style={{
                  fontSize: 10, color: d.minutes > 0 ? theme.accent : theme.subtext,
                  fontWeight: d.minutes > 0 ? 600 : 400,
                }}>{d.minutes}m</div>
                <div style={{
                  flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end',
                }}>
                  <div style={{
                    width: '100%', borderRadius: 8,
                    background: isToday
                      ? `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 100%)`
                      : `linear-gradient(180deg, rgba(200,125,74,0.35) 0%, rgba(200,125,74,0.65) 100%)`,
                    height: `${h}%`, minHeight: d.minutes > 0 ? 6 : 2,
                    boxShadow: isToday ? `0 4px 12px ${theme.accent}55` : 'none',
                    transition: 'height .4s cubic-bezier(.22,.61,.36,1)',
                  }} />
                </div>
                <div style={{
                  fontSize: 10, color: isToday ? theme.accent : theme.subtext,
                  fontWeight: isToday ? 700 : 400,
                }}>{last7DaysLabel[i]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tasks done chart */}
      <div style={{
        padding: 20, background: theme.cardBg, border: theme.cardBorder,
        borderRadius: 16, boxShadow: theme.shadow, backdropFilter: 'blur(6px)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 12 }}>
          近 7 天任务完成数
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14, height: 100, alignItems: 'end' }}>
          {last7.map((d, i) => {
            const maxD = Math.max(1, ...last7.map(x => x.done))
            const h = (d.done / maxD) * 100
            return (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                <div style={{
                  fontSize: 10, color: d.done > 0 ? theme.success : theme.subtext, fontWeight: 600,
                }}>{d.done || '—'}</div>
                <div style={{
                  flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end',
                }}>
                  <div style={{
                    width: '100%', borderRadius: 6, minHeight: 3,
                    background: `linear-gradient(180deg, ${theme.success}99 0%, ${theme.success} 100%)`,
                    height: `${h}%`,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: theme.subtext }}>{last7DaysLabel[i]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 建议 */}
      <div style={{
        padding: 18, borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(200,125,74,0.1) 0%, rgba(110,165,122,0.08) 100%)',
        border: '1px solid rgba(180,140,90,0.15)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 8 }}>
          💡 MindSync 的小建议
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: theme.subtext, lineHeight: 1.9 }}>
          {todayFocusMin < 25 && <li>今天还没有完成一个番茄钟，现在就开始第一个「25 分钟专注」吧！</li>}
          {todayTasksDone === 0 && <li>小步前进：在「任务看板」选一件今天必须完成的事，哪怕它只需要 5 分钟。</li>}
          {habits.length === 0 && <li>添加 3 个对你最重要的习惯，然后每天只打卡它们——少即是多。</li>}
          {reflectionCount === 0 && <li>在「每日反思」写下今天发生的一件好事——写作让思考更清晰。</li>}
          {avgHabitCompletion < 40 && habits.length > 0 && <li>近 7 天习惯坚持率偏低：尝试降低目标，从 10% 完成度开始。</li>}
          {todayFocusMin >= 100 && <li>🎉 今日专注超过 100 分钟，记得给自己一个奖励，休息同样重要。</li>}
          {totalFocusMin >= 600 && <li>🏆 累计专注超过 10 小时，你比 90% 的人都更有纪律性。</li>}
          {(todayFocusMin >= 25 && todayTasksDone >= 3 && habits.every(h => isDoneToday(h, today)) && reflections.some(r => r.date === today)) && (
            <li>✨ 今天是完美的一天：专注 + 完成任务 + 打卡习惯 + 反思日记。好好休息！</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function isDoneToday(h: Habit, today: string) {
  return h.completedDates.includes(today)
}

/* ========= 主组件 MindSyncPro ========= */
export default function MindSyncPro() {
  const [tab, setTab] = useState<TabKey>('pomodoro')

  const [tasks, setTasks] = useState<Task[]>(() => load(STORAGE.TASKS, [] as Task[]))
  const [habits, setHabits] = useState<Habit[]>(() => load(STORAGE.HABITS, [] as Habit[]))
  const [reflections, setReflections] = useState<Reflection[]>(() => load(STORAGE.REFLECTIONS, [] as Reflection[]))
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => load(STORAGE.SESSIONS, [] as PomodoroSession[]))

  useEffect(() => { save(STORAGE.TASKS, tasks) }, [tasks])
  useEffect(() => { save(STORAGE.HABITS, habits) }, [habits])
  useEffect(() => { save(STORAGE.REFLECTIONS, reflections) }, [reflections])
  useEffect(() => { save(STORAGE.SESSIONS, sessions) }, [sessions])

  const tabs: { k: TabKey; label: string; icon: string; desc: string }[] = [
    { k: 'pomodoro', label: '番茄钟', icon: '⏳', desc: '25分钟深度专注' },
    { k: 'tasks', label: '任务看板', icon: '📋', desc: '拖放式三栏任务管理' },
    { k: 'habits', label: '习惯追踪', icon: '🌿', desc: '21天坚持可视化' },
    { k: 'reflection', label: '每日反思', icon: '📔', desc: '情绪·成就·感恩' },
    { k: 'stats', label: '效率统计', icon: '📈', desc: '数据驱动成长' },
  ]

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 600,
      background: theme.bg,
      color: theme.text,
      fontFamily: "'Noto Sans SC', 'JetBrains Mono', system-ui, -apple-system, sans-serif",
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* 装饰光斑 */}
      <div style={{
        position: 'absolute', top: -80, left: -80,
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,125,74,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, right: -60,
        width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(110,165,122,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        padding: '20px 28px 12px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(180,140,90,0.12)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentSoft} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: `0 6px 20px ${theme.accent}55`,
            color: 'white',
          }}>🧠</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3, color: theme.text }}>
              MindSync Pro
            </div>
            <div style={{ fontSize: 11, color: theme.subtext, letterSpacing: 1 }}>
              FOCUS · TRACK · REFLECT · GROW
            </div>
          </div>
        </div>
        <div style={{
          fontSize: 12, color: theme.subtext,
          display: 'flex', gap: 16, alignItems: 'center',
        }}>
          <span>
            <span style={{ color: theme.accent, fontWeight: 700 }}>
              {sessions.filter(s => s.date === todayStr() && s.type === 'focus' && s.completed).length}
            </span> 🍅 今日
          </span>
          <span>·</span>
          <span>
            <span style={{ color: theme.success, fontWeight: 700 }}>
              {tasks.filter(t => t.status === 'done').length}
            </span> ✅ 总完成
          </span>
          <span>·</span>
          <span>
            <span style={{ color: theme.warning, fontWeight: 700 }}>
              {habits.filter(h => h.completedDates.includes(todayStr())).length}/{habits.length}
            </span> 🌱 今日习惯
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 24px 0',
        borderBottom: '1px solid rgba(180,140,90,0.08)',
        position: 'relative', zIndex: 1,
      }}>
        {tabs.map(t => {
          const active = tab === t.k
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                padding: '10px 18px 14px',
                border: 'none', background: 'transparent',
                cursor: 'pointer', position: 'relative',
                display: 'flex', alignItems: 'center', gap: 8,
                color: active ? theme.accent : theme.subtext,
                transition: 'color .15s ease',
                fontSize: 13, fontWeight: active ? 700 : 500,
              }}>
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div>{t.label}</div>
                <div style={{
                  fontSize: 9, letterSpacing: 0.4,
                  color: active ? theme.accent : theme.subtext,
                  opacity: 0.7, fontWeight: 400,
                }}>{t.desc}</div>
              </div>
              {active && (
                <div style={{
                  position: 'absolute', left: 18, right: 18, bottom: 0,
                  height: 3, borderRadius: 2,
                  background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accentSoft} 100%)`,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Content — 所有面板常驻挂载，避免切换时丢失未保存表单状态 */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: tab === 'pomodoro' ? 'block' : 'none' }}>
          <PomodoroPanel sessions={sessions} setSessions={setSessions} tasks={tasks} />
        </div>
        <div style={{ display: tab === 'tasks' ? 'block' : 'none' }}>
          <TasksPanel tasks={tasks} setTasks={setTasks} />
        </div>
        <div style={{ display: tab === 'habits' ? 'block' : 'none' }}>
          <HabitsPanel habits={habits} setHabits={setHabits} />
        </div>
        <div style={{ display: tab === 'reflection' ? 'block' : 'none' }}>
          <ReflectionPanel reflections={reflections} setReflections={setReflections} />
        </div>
        <div style={{ display: tab === 'stats' ? 'block' : 'none' }}>
          <StatsPanel
            sessions={sessions} tasks={tasks}
            habits={habits} reflections={reflections}
          />
        </div>
      </div>
    </div>
  )
}
