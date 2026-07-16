import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * 番茄工作法 (Pomodoro Studio)
 *
 * 功能：
 *  - 经典 25/5 番茄循环
 *  - 自定义时长、循环数量
 *  - 任务清单（每个任务关联若干番茄）
 *  - 历史统计（完成的番茄数、总专注时长、连续天数）
 *  - 通知 API 集成（支持时发送桌面通知）
 *  - 完整状态持久化（localStorage）
 */

interface Task {
  id: string
  name: string
  estimate: number
  completed: number
  createdAt: number
}

interface SessionRecord {
  date: string
  count: number
  duration: number
}

interface PersistedState {
  tasks: Task[]
  history: SessionRecord[]
  todayCount: number
  todayDate: string
  totalFocusMinutes: number
  streak: number
  lastActiveDate: string
}

const STORAGE_KEY = 'weblinux-pomodoro-state'

const defaultState: PersistedState = {
  tasks: [],
  history: [],
  todayCount: 0,
  todayDate: new Date().toISOString().slice(0, 10),
  totalFocusMinutes: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().slice(0, 10),
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultState, ...parsed }
    }
  } catch {
    // ignore
  }
  return defaultState
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(d1: string, d2: string) {
  const t1 = new Date(d1 + 'T00:00:00').getTime()
  const t2 = new Date(d2 + 'T00:00:00').getTime()
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24))
}

type Phase = 'idle' | 'focus' | 'break' | 'longbreak'

const PomodoroStudio = () => {
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [cycleCount, setCycleCount] = useState(4)
  const [state, setState] = useState<PersistedState>(loadState)
  const [phase, setPhase] = useState<Phase>('idle')
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskEstimate, setNewTaskEstimate] = useState(1)
  const [completedCycles, setCompletedCycles] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  // 计算当前连续天数
  useEffect(() => {
    const today = getTodayStr()
    if (state.lastActiveDate === today) return
    const diff = daysBetween(state.lastActiveDate, today)
    if (diff === 1) {
      // 连续
      // 保留 streak 不变，等今天完成第一个番茄再加
    } else if (diff > 1) {
      // 中断
      setState(s => ({ ...s, streak: 0, lastActiveDate: today }))
    } else if (diff < 0) {
      // 时钟回拨
      setState(s => ({ ...s, lastActiveDate: today }))
    }
  }, [state.lastActiveDate])

  const playBeep = useCallback((frequency: number, duration: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // ignore
    }
  }, [])

  const notify = useCallback((title: string, body: string) => {
    playBeep(880, 0.3)
    setTimeout(() => playBeep(660, 0.3), 200)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') new Notification(title, { body })
        })
      }
    }
  }, [playBeep])

  const completePhase = useCallback(() => {
    setState(s => {
      const today = getTodayStr()
      const newHistory = [...s.history]
      const idx = newHistory.findIndex(h => h.date === today)
      const isFocusComplete = phase === 'focus'

      if (isFocusComplete) {
        const newCycles = completedCycles + 1
        setCompletedCycles(newCycles)

        if (idx >= 0) {
          newHistory[idx] = { date: today, count: newHistory[idx].count + 1, duration: newHistory[idx].duration + focusDuration }
        } else {
          newHistory.push({ date: today, count: 1, duration: focusDuration })
        }

        const newStreak = s.lastActiveDate === today ? s.streak : s.streak + 1
        notify('专注完成', `已完成 ${focusDuration} 分钟专注时间，休息一下吧`)

        if (currentTask) {
          // 增加任务的完成番茄数
          const newTasks = s.tasks.map(t =>
            t.id === currentTask ? { ...t, completed: t.completed + 1 } : t
          )
          return {
            ...s,
            tasks: newTasks,
            history: newHistory,
            todayCount: s.todayDate === today ? s.todayCount + 1 : 1,
            todayDate: today,
            totalFocusMinutes: s.totalFocusMinutes + focusDuration,
            streak: newStreak,
            lastActiveDate: today,
          }
        }

        return {
          ...s,
          history: newHistory,
          todayCount: s.todayDate === today ? s.todayCount + 1 : 1,
          todayDate: today,
          totalFocusMinutes: s.totalFocusMinutes + focusDuration,
          streak: newStreak,
          lastActiveDate: today,
        }
      } else {
        notify('休息结束', '准备好开始下一轮专注了吗？')
        if (phase === 'longbreak') {
          setCompletedCycles(0)
        }
        return s
      }
    })

    // 切换到下一阶段
    if (phase === 'focus') {
      const isLongBreak = (completedCycles + 1) % cycleCount === 0
      if (isLongBreak) {
        setPhase('longbreak')
        setTimeLeft(longBreakDuration * 60)
      } else {
        setPhase('break')
        setTimeLeft(breakDuration * 60)
      }
    } else {
      setPhase('focus')
      setTimeLeft(focusDuration * 60)
    }
  }, [phase, completedCycles, cycleCount, focusDuration, breakDuration, longBreakDuration, currentTask, notify])

  // 倒计时
  useEffect(() => {
    if (phase === 'idle' || timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeLeft === 0 && phase !== 'idle') {
        completePhase()
      }
      return
    }
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase, timeLeft, completePhase])

  const start = () => {
    setPhase('focus')
    setTimeLeft(focusDuration * 60)
  }

  const pause = () => {
    setPhase('idle')
  }

  const reset = () => {
    setPhase('idle')
    setTimeLeft(0)
    setCompletedCycles(0)
  }

  const addTask = () => {
    if (!newTaskName.trim()) return
    const task: Task = {
      id: String(Date.now()),
      name: newTaskName.trim(),
      estimate: Math.max(1, newTaskEstimate),
      completed: 0,
      createdAt: Date.now(),
    }
    setState(s => ({ ...s, tasks: [...s.tasks, task] }))
    setNewTaskName('')
    setNewTaskEstimate(1)
  }

  const removeTask = (id: string) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }))
    if (currentTask === id) setCurrentTask(null)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // 7 天历史
  const last7Days = useMemo(() => {
    const days: Array<{ date: string; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const record = state.history.find(h => h.date === dateStr)
      days.push({ date: dateStr.slice(5), count: record?.count || 0 })
    }
    return days
  }, [state.history])

  const maxCount = Math.max(1, ...last7Days.map(d => d.count))

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['focus', 'break', 'longbreak'] as Phase[]).map(p => (
            <div
              key={p}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                borderRadius: 12,
                background: phase === p ? 'var(--accent, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                color: phase === p ? '#fff' : 'var(--text-secondary, #888)',
                fontWeight: phase === p ? 600 : 400,
              }}
            >
              {p === 'focus' ? '专注' : p === 'break' ? '短休息' : '长休息'}
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 96,
          fontWeight: 200,
          fontFamily: 'monospace',
          color: phase === 'focus' ? 'var(--accent, #8b5cf6)' : phase === 'idle' ? 'var(--text-secondary, #888)' : '#10b981',
          letterSpacing: -2,
          lineHeight: 1,
        }}>
          {phase === 'idle' ? formatTime(focusDuration * 60) : formatTime(timeLeft)}
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-secondary, #888)', marginTop: 8 }}>
          周期 {Math.min(completedCycles + 1, cycleCount)} / {cycleCount}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {phase === 'idle' ? (
            <button
              onClick={start}
              style={{
                padding: '12px 32px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent, #8b5cf6)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >开始专注</button>
          ) : (
            <>
              <button
                onClick={pause}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >暂停</button>
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >重置</button>
            </>
          )}
        </div>

        <div style={{ marginTop: 32, width: '100%', maxWidth: 480 }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-secondary, #888)', marginBottom: 12, fontWeight: 500 }}>最近 7 天</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {last7Days.map((d) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary, #888)' }}>{d.count}</div>
                <div style={{
                  width: '100%',
                  height: `${(d.count / maxCount) * 60}px`,
                  minHeight: 2,
                  background: d.count > 0 ? 'var(--accent, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                }} />
                <div style={{ fontSize: 10, color: 'var(--text-secondary, #888)' }}>{d.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        borderLeft: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>统计</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Stat label="今日完成" value={state.todayCount} unit="个" />
            <Stat label="累计专注" value={state.totalFocusMinutes} unit="分" />
            <Stat label="连续天数" value={state.streak} unit="天" />
            <Stat label="总任务" value={state.tasks.length} unit="个" />
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>设置</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NumberSetting label="专注时长" value={focusDuration} onChange={setFocusDuration} min={1} max={90} unit="分" />
            <NumberSetting label="短休息" value={breakDuration} onChange={setBreakDuration} min={1} max={30} unit="分" />
            <NumberSetting label="长休息" value={longBreakDuration} onChange={setLongBreakDuration} min={5} max={60} unit="分" />
            <NumberSetting label="长休息周期" value={cycleCount} onChange={setCycleCount} min={2} max={10} unit="轮" />
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>任务清单</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="任务名"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              style={{
                padding: '6px 8px',
                border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                background: 'rgba(0,0,0,0.2)',
                color: 'inherit',
                borderRadius: 4,
                fontSize: 12,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="number"
                min={1}
                max={20}
                value={newTaskEstimate}
                onChange={(e) => setNewTaskEstimate(Number(e.target.value) || 1)}
                style={{
                  width: 60,
                  padding: '6px 8px',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'inherit',
                  borderRadius: 4,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                onClick={addTask}
                style={{
                  flex: 1,
                  padding: '6px',
                  border: 'none',
                  background: 'var(--accent, #8b5cf6)',
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >添加</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {state.tasks.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 12 }}>
                暂无任务
              </div>
            )}
            {state.tasks.map(t => (
              <div
                key={t.id}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: currentTask === t.id ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</span>
                  <button
                    onClick={() => removeTask(t.id)}
                    style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}
                  >×</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', marginBottom: 6 }}>
                  {t.completed} / {t.estimate} 个番茄
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (t.completed / t.estimate) * 100)}%`,
                    height: '100%',
                    background: 'var(--accent, #8b5cf6)',
                  }} />
                </div>
                {currentTask !== t.id ? (
                  <button
                    onClick={() => setCurrentTask(t.id)}
                    style={{
                      marginTop: 6,
                      width: '100%',
                      padding: 4,
                      border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                      background: 'transparent',
                      color: 'inherit',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >选择此任务</button>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--accent, #8b5cf6)', textAlign: 'center' }}>● 进行中</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const Stat = ({ label, value, unit }: { label: string; value: number; unit: string }) => (
  <div style={{
    padding: 8,
    borderRadius: 6,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-secondary, #888)' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
      {value} <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>{unit}</span>
    </div>
  </div>
)

const NumberSetting = ({ label, value, onChange, min, max, unit }: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  unit: string
}) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: 'var(--text-secondary, #888)' }}>{label}</span>
      <span style={{ fontFamily: 'monospace' }}>{value} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
)

export default PomodoroStudio
