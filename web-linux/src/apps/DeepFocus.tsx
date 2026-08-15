import { useState, useEffect, useRef, useCallback } from 'react'

type SessionType = 'focus' | 'short-break' | 'long-break'
type AppState = 'idle' | 'running' | 'paused' | 'completed'

interface Settings {
  focusDuration: number
  shortBreak: number
  longBreak: number
  longBreakInterval: number
  autoStart: boolean
  soundEnabled: boolean
  notificationsEnabled: boolean
}

interface Session {
  id: string
  type: SessionType
  startDate: Date
  endDate: Date
  completed: boolean
  taskId?: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  estimatedPomodoros: number
  actualPomodoros: number
  createdAt: Date
}

const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStart: false,
  soundEnabled: true,
  notificationsEnabled: true,
}

export default function DeepFocus() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('deepfocus_settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch { return DEFAULT_SETTINGS }
  })

  const [sessionType, setSessionType] = useState<SessionType>('focus')
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
  const [state, setState] = useState<AppState>('idle')
  const [completedCycles, setCompletedCycles] = useState(() => {
    try { return parseInt(localStorage.getItem('deepfocus_cycles') || '0') } catch { return 0 }
  })
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('deepfocus_tasks')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('deepfocus_sessions')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    try { localStorage.setItem('deepfocus_settings', JSON.stringify(settings)) } catch {}
  }, [settings])

  useEffect(() => {
    try { localStorage.setItem('deepfocus_tasks', JSON.stringify(tasks)) } catch {}
  }, [tasks])

  useEffect(() => {
    try { localStorage.setItem('deepfocus_sessions', JSON.stringify(sessions.slice(-50))) } catch {}
  }, [sessions])

  useEffect(() => {
    try { localStorage.setItem('deepfocus_cycles', String(completedCycles)) } catch {}
  }, [completedCycles])

  const playSound = useCallback((frequency: number, duration: number) => {
    if (!settings.soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [settings.soundEnabled])

  const notify = useCallback((msg: string) => {
    if (!settings.notificationsEnabled) return
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('DeepFocus', { body: msg })
      }
    } catch {}
  }, [settings.notificationsEnabled])

  const getDuration = useCallback((type: SessionType) => {
    switch (type) {
      case 'focus': return settings.focusDuration * 60
      case 'short-break': return settings.shortBreak * 60
      case 'long-break': return settings.longBreak * 60
    }
  }, [settings])

  const startSession = useCallback((type?: SessionType) => {
    const targetType = type || sessionType
    setSessionType(targetType)
    setTimeLeft(getDuration(targetType))
    setState('running')

    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } catch {}
  }, [sessionType, getDuration])

  const pauseSession = useCallback(() => {
    setState('paused')
  }, [])

  const resumeSession = useCallback(() => {
    setState('running')
  }, [])

  const resetSession = useCallback(() => {
    setState('idle')
    setTimeLeft(getDuration(sessionType))
  }, [sessionType, getDuration])

  const skipSession = useCallback(() => {
    handleComplete(true)
  }, [])

  const handleComplete = useCallback((skipped: boolean) => {
    const session: Session = {
      id: Date.now().toString(),
      type: sessionType,
      startDate: new Date(Date.now() - (getDuration(sessionType) - timeLeft) * 1000),
      endDate: new Date(),
      completed: !skipped,
      taskId: currentTaskId || undefined,
    }

    setSessions(prev => [...prev, session])

    if (sessionType === 'focus' && !skipped) {
      const newCycles = completedCycles + 1
      setCompletedCycles(newCycles)

      if (currentTaskId) {
        setTasks(prev => prev.map(t =>
          t.id === currentTaskId
            ? { ...t, actualPomodoros: t.actualPomodoros + 1 }
            : t
        ))
      }

      const isLongBreak = newCycles % settings.longBreakInterval === 0
      const nextType: SessionType = isLongBreak ? 'long-break' : 'short-break'

      playSound(880, 0.3)
      setTimeout(() => playSound(660, 0.3), 300)
      notify(`专注完成！开始${isLongBreak ? '长' : '短'}休息`)

      if (settings.autoStart) {
        setSessionType(nextType)
        setTimeLeft(getDuration(nextType))
        setState('running')
      } else {
        setSessionType(nextType)
        setTimeLeft(getDuration(nextType))
        setState('idle')
      }
    } else if ((sessionType === 'short-break' || sessionType === 'long-break') && !skipped) {
      playSound(523, 0.3)
      setTimeout(() => playSound(784, 0.3), 300)
      notify('休息结束，开始新的专注')

      if (settings.autoStart) {
        setSessionType('focus')
        setTimeLeft(getDuration('focus'))
        setState('running')
      } else {
        setSessionType('focus')
        setTimeLeft(getDuration('focus'))
        setState('idle')
      }
    }
  }, [sessionType, completedCycles, currentTaskId, settings, getDuration, timeLeft, playSound, notify])

  useEffect(() => {
    if (state !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state, handleComplete])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const totalDuration = getDuration(sessionType)
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0
  const circumference = 2 * Math.PI * 130

  const getGradient = () => {
    switch (sessionType) {
      case 'focus': return 'conic-gradient(#ef4444 0%, #f97316 100%)'
      case 'short-break': return 'conic-gradient(#22c55e 0%, #10b981 100%)'
      case 'long-break': return 'conic-gradient(#3b82f6 0%, #8b5cf6 100%)'
    }
  }
  void getGradient

  const getAccent = () => {
    switch (sessionType) {
      case 'focus': return '#ef4444'
      case 'short-break': return '#22c55e'
      case 'long-break': return '#3b82f6'
    }
  }

  const getLabel = () => {
    switch (sessionType) {
      case 'focus': return '专注中'
      case 'short-break': return '短休息'
      case 'long-break': return '长休息'
    }
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      estimatedPomodoros: 1,
      actualPomodoros: 0,
      createdAt: new Date(),
    }
    setTasks(prev => [...prev, task])
    setNewTaskTitle('')
  }

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (currentTaskId === id) setCurrentTaskId(null)
  }

  const updateTaskEstimate = (id: string, delta: number) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, estimatedPomodoros: Math.max(1, t.estimatedPomodoros + delta) } : t
    ))
  }

  const todaySessions = sessions.filter(s => {
    const d = new Date(s.endDate)
    const today = new Date()
    return d.toDateString() === today.toDateString() && s.type === 'focus'
  })

  const todayMinutes = todaySessions.length * settings.focusDuration

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white', fontFamily: "'Noto Sans SC', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🎯</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>DeepFocus</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>深度专注计时器</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
          <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 15 }}>
            今日 <strong style={{ color: getAccent() }}>{todayMinutes}</strong> 分钟
          </div>
          <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 15 }}>
            循环 <strong style={{ color: getAccent() }}>{completedCycles}</strong>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            color: 'white', padding: '6px 12px', borderRadius: 15, cursor: 'pointer',
          }}>⚙️</button>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 24px',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['focus', 'short-break', 'long-break'] as SessionType[]).map(t => (
            <button key={t} onClick={() => { if (state === 'idle') setSessionType(t) }} style={{
              padding: '8px 20px', fontSize: 13,
              background: sessionType === t ? getAccent() : 'rgba(255,255,255,0.08)',
              color: 'white', border: 'none', borderRadius: 20,
              cursor: state === 'idle' ? 'pointer' : 'default',
              transition: 'all 0.3s',
            }}>
              {t === 'focus' ? '🍅 专注' : t === 'short-break' ? '☕ 短休' : '🌴 长休'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 300, height: 300 }}>
          <svg width={300} height={300} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={150} cy={150} r={130}
              fill="none" stroke="rgba(255,255,255,0.1)"
              strokeWidth={8}
            />
            <circle cx={150} cy={150} r={130}
              fill="none" stroke={getAccent()}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s, stroke 0.3s' }}
            />
          </svg>

          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 64, fontWeight: 200, fontFamily: 'monospace' }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: 16, opacity: 0.6, marginTop: 4 }}>
              {getLabel()}
            </div>
            {state === 'running' && (
              <div style={{ fontSize: 12, opacity: 0.4, marginTop: 8 }}>
                {currentTaskId ? `任务进行中` : '保持专注'}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
          {state === 'idle' && (
            <button onClick={() => startSession()} style={{
              padding: '14px 48px', fontSize: 16,
              background: getAccent(), color: 'white',
              border: 'none', borderRadius: 30, cursor: 'pointer',
              boxShadow: `0 4px 20px ${getAccent()}40`,
              transition: 'all 0.3s',
            }}>
              开始 {getLabel()}
            </button>
          )}
          {state === 'running' && (
            <>
              <button onClick={pauseSession} style={{
                padding: '14px 36px', fontSize: 15,
                background: 'rgba(255,255,255,0.1)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30,
                cursor: 'pointer', transition: 'all 0.3s',
              }}>⏸ 暂停</button>
              <button onClick={skipSession} style={{
                padding: '14px 36px', fontSize: 15,
                background: 'rgba(255,255,255,0.1)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30,
                cursor: 'pointer', transition: 'all 0.3s',
              }}>⏭ 跳过</button>
            </>
          )}
          {state === 'paused' && (
            <>
              <button onClick={resumeSession} style={{
                padding: '14px 36px', fontSize: 15,
                background: getAccent(), color: 'white',
                border: 'none', borderRadius: 30, cursor: 'pointer',
              }}>▶ 继续</button>
              <button onClick={resetSession} style={{
                padding: '14px 36px', fontSize: 15,
                background: 'rgba(255,255,255,0.1)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30,
                cursor: 'pointer',
              }}>🔄 重置</button>
            </>
          )}
        </div>
      </div>

      <div style={{
        padding: '0 24px 24px',
        maxHeight: 200, overflow: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>📋 任务列表</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="添加任务..."
              style={{
                padding: '6px 12px', fontSize: 13,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 15, color: 'white', outline: 'none',
                width: 180,
              }}
            />
            <button onClick={addTask} style={{
              padding: '6px 12px', fontSize: 13,
              background: getAccent(), color: 'white',
              border: 'none', borderRadius: 15, cursor: 'pointer',
            }}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.4, textAlign: 'center', padding: 20 }}>
              暂无任务，添加一个开始专注吧
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id}
                onClick={() => setCurrentTaskId(task.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: currentTaskId === task.id ? `${getAccent()}20` : 'rgba(255,255,255,0.04)',
                  border: currentTaskId === task.id ? `1px solid ${getAccent()}40` : '1px solid transparent',
                  borderRadius: 12, cursor: 'pointer',
                  animation: 'slide-up 0.3s ease',
                }}>
                <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }} style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: task.completed ? getAccent() : 'transparent',
                  border: `2px solid ${task.completed ? getAccent() : 'rgba(255,255,255,0.3)'}`,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: 'white',
                }}>
                  {task.completed ? '✓' : ''}
                </button>
                <span style={{
                  flex: 1, fontSize: 13,
                  opacity: task.completed ? 0.4 : 1,
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}>
                  {task.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); updateTaskEstimate(task.id, -1) }} style={{
                    width: 20, height: 20, background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', fontSize: 12,
                  }}>-</button>
                  <span style={{ fontSize: 12, opacity: 0.6, minWidth: 40, textAlign: 'center' }}>
                    {task.actualPomodoros}/{task.estimatedPomodoros} 🍅
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); updateTaskEstimate(task.id, 1) }} style={{
                    width: 20, height: 20, background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', fontSize: 12,
                  }}>+</button>
                  <button onClick={(e) => { e.stopPropagation(); removeTask(task.id) }} style={{
                    width: 20, height: 20, background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer', fontSize: 14, marginLeft: 4,
                  }}>×</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showSettings && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }} onClick={() => setShowSettings(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a1a2e', borderRadius: 20,
            padding: 24, width: 380,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>设置</h3>

            {([
              ['focusDuration', '专注时长（分钟）', 1, 90],
              ['shortBreak', '短休息时长（分钟）', 1, 30],
              ['longBreak', '长休息时长（分钟）', 1, 60],
              ['longBreakInterval', '长休息间隔', 2, 10],
            ] as const).map(([key, label, min, max]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 6 }}>{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={min} max={max}
                    value={settings[key]}
                    onChange={e => setSettings(s => ({ ...s, [key]: parseInt(e.target.value) }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 14, minWidth: 40, textAlign: 'right' }}>
                    {settings[key]}
                  </span>
                </div>
              </div>
            ))}

            {([
              ['autoStart', '自动开始下一轮'],
              ['soundEnabled', '提示音'],
              ['notificationsEnabled', '桌面通知'],
            ] as const).map(([key, label]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12,
              }}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <button onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))} style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: settings[key] ? getAccent() : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.3s',
                }}>
                  <div style={{
                    position: 'absolute', top: 2,
                    left: settings[key] ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'white', transition: 'left 0.3s',
                  }} />
                </button>
              </div>
            ))}

            <button onClick={() => setShowSettings(false)} style={{
              width: '100%', padding: '12px',
              background: getAccent(), color: 'white',
              border: 'none', borderRadius: 12,
              cursor: 'pointer', fontSize: 14, marginTop: 8,
            }}>
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
