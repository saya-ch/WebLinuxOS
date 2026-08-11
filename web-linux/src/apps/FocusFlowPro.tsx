import { useState, useEffect, useRef, useCallback } from 'react'

type Mode = 'work' | 'break'

interface Task {
  id: string
  text: string
  done: boolean
  createdAt: number
}

interface Stats {
  completedPomodoros: number
  totalFocusSeconds: number
  completedBreaks: number
  todayPomodoros: number
  todayDate: string
}

const STORAGE_KEY = 'focus-flow-pro-data'
const TASKS_KEY = 'focus-flow-pro-tasks'
const STATS_KEY = 'focus-flow-pro-stats'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

function loadTimerState(): { mode: Mode; timeLeft: number; isRunning: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { mode: 'work', timeLeft: WORK_SECONDS, isRunning: false }
    const parsed = JSON.parse(raw)
    return {
      mode: parsed.mode || 'work',
      timeLeft: typeof parsed.timeLeft === 'number' ? parsed.timeLeft : WORK_SECONDS,
      isRunning: false,
    }
  } catch {
    return { mode: 'work', timeLeft: WORK_SECONDS, isRunning: false }
  }
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) {
      const today = new Date().toISOString().slice(0, 10)
      return {
        completedPomodoros: 0,
        totalFocusSeconds: 0,
        completedBreaks: 0,
        todayPomodoros: 0,
        todayDate: today,
      }
    }
    const parsed = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    if (parsed.todayDate !== today) {
      return {
        ...parsed,
        todayPomodoros: 0,
        todayDate: today,
      }
    }
    return parsed
  } catch {
    const today = new Date().toISOString().slice(0, 10)
    return {
      completedPomodoros: 0,
      totalFocusSeconds: 0,
      completedBreaks: 0,
      todayPomodoros: 0,
      todayDate: today,
    }
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const FocusFlowPro: React.FC = () => {
  const initial = useRef(loadTimerState())
  const [mode, setMode] = useState<Mode>(initial.current.mode)
  const [timeLeft, setTimeLeft] = useState(initial.current.timeLeft)
  const [isRunning, setIsRunning] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(loadTasks())
  const [stats, setStats] = useState<Stats>(loadStats())
  const [inputValue, setInputValue] = useState('')
  const [completedCycles, setCompletedCycles] = useState(0)

  const totalSeconds = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const timerRef = useRef<number | null>(null)

  const persistTimer = useCallback((m: Mode, t: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: m, timeLeft: t }))
    } catch { /* noop */ }
  }, [])

  const saveTasks = useCallback((list: Task[]) => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(list))
    } catch { /* noop */ }
  }, [])

  const saveStats = useCallback((s: Stats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s))
    } catch { /* noop */ }
  }, [])

  const switchMode = useCallback((nextMode: Mode) => {
    const nextTime = nextMode === 'work' ? WORK_SECONDS : BREAK_SECONDS
    setMode(nextMode)
    setTimeLeft(nextTime)
    persistTimer(nextMode, nextTime)
  }, [persistTimer])

  const completeCurrentSession = useCallback(() => {
    if (mode === 'work') {
      const newStats: Stats = {
        ...stats,
        completedPomodoros: stats.completedPomodoros + 1,
        totalFocusSeconds: stats.totalFocusSeconds + WORK_SECONDS,
        todayPomodoros: stats.todayPomodoros + 1,
      }
      setStats(newStats)
      saveStats(newStats)
      const nextCycles = completedCycles + 1
      setCompletedCycles(nextCycles)
      switchMode('break')
    } else {
      const newStats: Stats = {
        ...stats,
        completedBreaks: stats.completedBreaks + 1,
      }
      setStats(newStats)
      saveStats(newStats)
      switchMode('work')
    }
    setIsRunning(false)
  }, [mode, stats, completedCycles, saveStats, switchMode])

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        completeCurrentSession()
        return 0
      }
      return prev - 1
    })
  }, [completeCurrentSession])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(true)
    timerRef.current = window.setInterval(tick, 1000)
  }, [tick])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    setTimeLeft(totalSeconds)
    persistTimer(mode, totalSeconds)
  }, [mode, totalSeconds, persistTimer])

  const skipToNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    switchMode(mode === 'work' ? 'break' : 'work')
  }, [mode, switchMode])

  const toggleTimer = useCallback(() => {
    if (isRunning) pauseTimer()
    else startTimer()
  }, [isRunning, startTimer, pauseTimer])

  const addTask = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    const newTask: Task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      text,
      done: false,
      createdAt: Date.now(),
    }
    const next = [newTask, ...tasks]
    setTasks(next)
    saveTasks(next)
    setInputValue('')
  }, [inputValue, tasks, saveTasks])

  const toggleTask = useCallback((id: string) => {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(next)
    saveTasks(next)
  }, [tasks, saveTasks])

  const removeTask = useCallback((id: string) => {
    const next = tasks.filter(t => t.id !== id)
    setTasks(next)
    saveTasks(next)
  }, [tasks, saveTasks])

  const clearCompleted = useCallback(() => {
    const next = tasks.filter(t => !t.done)
    setTasks(next)
    saveTasks(next)
  }, [tasks, saveTasks])

  const resetAllStats = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    const fresh: Stats = {
      completedPomodoros: 0,
      totalFocusSeconds: 0,
      completedBreaks: 0,
      todayPomodoros: 0,
      todayDate: today,
    }
    setStats(fresh)
    saveStats(fresh)
    setCompletedCycles(0)
  }, [saveStats])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        toggleTimer()
      } else if (e.key === 'r' || e.key === 'R') {
        resetTimer()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleTimer, resetTimer])

  useEffect(() => {
    persistTimer(mode, timeLeft)
  }, [mode, timeLeft, persistTimer])

  const accentColor = mode === 'work' ? '#ef4444' : '#22c55e'
  const accentGlow = mode === 'work'
    ? '0 0 40px rgba(239, 68, 68, 0.35)'
    : '0 0 40px rgba(34, 197, 94, 0.35)'

  const styles: Record<string, React.CSSProperties> = {
    container: {
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", "PingFang SC", system-ui, sans-serif',
      color: '#e2e8f0',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 24px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    titleWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: 12,
      color: '#64748b',
    },
    modeSwitch: {
      display: 'flex',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    modeBtn: {
      padding: '7px 16px',
      borderRadius: 8,
      border: 'none',
      background: 'transparent',
      color: '#94a3b8',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.25s',
    },
    modeBtnActive: {
      background: mode === 'work'
        ? 'linear-gradient(135deg, #ef4444, #f97316)'
        : 'linear-gradient(135deg, #22c55e, #14b8a6)',
      color: '#fff',
      boxShadow: mode === 'work'
        ? '0 4px 15px rgba(239,68,68,0.3)'
        : '0 4px 15px rgba(34,197,94,0.3)',
    },
    main: {
      flex: 1,
      display: 'flex',
      gap: 20,
      padding: '20px 24px',
      overflow: 'hidden',
      minHeight: 0,
    },
    leftCol: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    ringWrap: {
      position: 'relative',
      width: 280,
      height: 280,
    },
    ringBg: {
      fill: 'none',
      stroke: 'rgba(255,255,255,0.06)',
      strokeWidth: 6,
    },
    ringFg: {
      fill: 'none',
      stroke: accentColor,
      strokeWidth: 6,
      strokeLinecap: 'round',
      transition: 'stroke-dashoffset 1s linear',
      filter: `drop-shadow(${accentGlow})`,
    },
    ringCenter: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeText: {
      fontSize: 64,
      fontWeight: 200,
      letterSpacing: '-0.04em',
      color: '#fff',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1,
    },
    modeLabel: {
      marginTop: 8,
      fontSize: 14,
      color: mode === 'work' ? '#fca5a5' : '#86efac',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      fontWeight: 600,
    },
    cycleInfo: {
      marginTop: 6,
      fontSize: 12,
      color: '#64748b',
    },
    controls: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    },
    btn: {
      padding: '12px 24px',
      borderRadius: 12,
      border: 'none',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    btnPrimary: {
      background: mode === 'work'
        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
        : 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: '#fff',
      boxShadow: mode === 'work'
        ? '0 8px 25px rgba(239,68,68,0.3)'
        : '0 8px 25px rgba(34,197,94,0.3)',
      minWidth: 120,
      justifyContent: 'center',
    },
    btnSecondary: {
      background: 'rgba(255,255,255,0.06)',
      color: '#cbd5e1',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    btnGhost: {
      background: 'transparent',
      color: '#94a3b8',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    shortcuts: {
      display: 'flex',
      gap: 16,
      fontSize: 11,
      color: '#475569',
      marginTop: 4,
    },
    keyHint: {
      padding: '3px 8px',
      borderRadius: 5,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#64748b',
    },
    rightCol: {
      width: 320,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: 0,
    },
    panel: {
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    },
    panelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    panelTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: '#e2e8f0',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    addRow: {
      display: 'flex',
      gap: 8,
    },
    input: {
      flex: 1,
      padding: '10px 14px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(0,0,0,0.2)',
      color: '#e2e8f0',
      fontSize: 13,
      outline: 'none',
    },
    inputFocus: {
      borderColor: accentColor,
    },
    addBtn: {
      padding: '10px 14px',
      borderRadius: 10,
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
    },
    taskList: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minHeight: 0,
      maxHeight: 240,
    },
    taskItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 8,
      transition: 'background 0.15s',
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      border: '2px solid rgba(255,255,255,0.15)',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      padding: 0,
      transition: 'all 0.15s',
    },
    checkboxChecked: {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderColor: 'transparent',
    },
    taskText: {
      flex: 1,
      fontSize: 13,
      color: '#cbd5e1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    taskTextDone: {
      textDecoration: 'line-through',
      color: '#475569',
    },
    taskRemove: {
      background: 'transparent',
      border: 'none',
      color: '#475569',
      cursor: 'pointer',
      padding: 4,
      borderRadius: 4,
      fontSize: 14,
      lineHeight: 1,
    },
    emptyState: {
      padding: '16px 8px',
      textAlign: 'center',
      fontSize: 12,
      color: '#475569',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
    },
    statCard: {
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 10,
      padding: '12px 14px',
      border: '1px solid rgba(255,255,255,0.04)',
    },
    statValue: {
      fontSize: 22,
      fontWeight: 700,
      color: '#fff',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1.2,
    },
    statLabel: {
      fontSize: 11,
      color: '#64748b',
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    footerActions: {
      display: 'flex',
      gap: 8,
      marginTop: 4,
    },
    footerBtn: {
      flex: 1,
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
      color: '#94a3b8',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
  }

  const circumference = 2 * Math.PI * 130
  const dashoffset = circumference * (1 - progress / 100)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={{ fontSize: 28 }}>🎯</div>
          <div>
            <div style={styles.title}>FocusFlow Pro</div>
            <div style={styles.subtitle}>番茄钟专注计时器</div>
          </div>
        </div>
        <div style={styles.modeSwitch}>
          <button
            style={{
              ...styles.modeBtn,
              ...(mode === 'work' ? styles.modeBtnActive : {}),
            }}
            onClick={() => { if (!isRunning) switchMode('work') }}
          >
            专注 25 分钟
          </button>
          <button
            style={{
              ...styles.modeBtn,
              ...(mode === 'break' ? styles.modeBtnActive : {}),
            }}
            onClick={() => { if (!isRunning) switchMode('break') }}
          >
            休息 5 分钟
          </button>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.leftCol}>
          <div style={styles.ringWrap}>
            <svg width={280} height={280} viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={140}
                cy={140}
                r={130}
                style={styles.ringBg}
              />
              <circle
                cx={140}
                cy={140}
                r={130}
                style={{
                  ...styles.ringFg,
                  strokeDasharray: circumference,
                  strokeDashoffset: dashoffset,
                }}
              />
            </svg>
            <div style={styles.ringCenter}>
              <div style={styles.timeText}>{formatTime(timeLeft)}</div>
              <div style={styles.modeLabel}>
                {mode === 'work' ? '专注中' : '休息中'}
              </div>
              <div style={styles.cycleInfo}>
                已完成 {completedCycles} 个循环
              </div>
            </div>
          </div>

          <div style={styles.controls}>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={resetTimer}
            >
              ↺ 重置
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={toggleTimer}
            >
              {isRunning ? '⏸ 暂停' : '▶ 开始'}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
              onClick={skipToNext}
            >
              ⏭ 跳过
            </button>
          </div>

          <div style={styles.shortcuts}>
            <span>
              <span style={styles.keyHint}>Space</span> 开始/暂停
            </span>
            <span>
              <span style={styles.keyHint}>R</span> 重置
            </span>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>📋 任务列表</div>
              {tasks.filter(t => !t.done).length > 0 && (
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {tasks.filter(t => !t.done).length} 待办
                </span>
              )}
            </div>
            <div style={styles.addRow}>
              <input
                style={styles.input}
                placeholder="添加新任务..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask() }}
              />
              <button style={styles.addBtn} onClick={addTask}>
                添加
              </button>
            </div>
            <div style={styles.taskList}>
              {tasks.length === 0 ? (
                <div style={styles.emptyState}>
                  暂无任务，添加一个开始专注吧
                </div>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    style={styles.taskItem}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <button
                      style={{
                        ...styles.checkbox,
                        ...(task.done ? styles.checkboxChecked : {}),
                      }}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.done && (
                        <span style={{ color: '#fff', fontSize: 11 }}>✓</span>
                      )}
                    </button>
                    <span
                      style={{
                        ...styles.taskText,
                        ...(task.done ? styles.taskTextDone : {}),
                      }}
                    >
                      {task.text}
                    </span>
                    <button
                      style={styles.taskRemove}
                      onClick={() => removeTask(task.id)}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = '#475569'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            {tasks.some(t => t.done) && (
              <div style={styles.footerActions}>
                <button style={styles.footerBtn} onClick={clearCompleted}>
                  清除已完成 ({tasks.filter(t => t.done).length})
                </button>
              </div>
            )}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>📊 统计</div>
              <button
                style={{ ...styles.footerBtn, padding: '4px 10px', fontSize: 11 }}
                onClick={resetAllStats}
              >
                重置
              </button>
            </div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#fca5a5' }}>
                  {stats.completedPomodoros}
                </div>
                <div style={styles.statLabel}>总完成番茄</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#86efac' }}>
                  {stats.completedBreaks}
                </div>
                <div style={styles.statLabel}>完成休息</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#93c5fd' }}>
                  {formatDuration(stats.totalFocusSeconds)}
                </div>
                <div style={styles.statLabel}>总专注时间</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#fcd34d' }}>
                  {stats.todayPomodoros}
                </div>
                <div style={styles.statLabel}>今日番茄</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FocusFlowPro