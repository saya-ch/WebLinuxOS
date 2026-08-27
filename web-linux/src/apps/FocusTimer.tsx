import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store'

type Phase = 'work' | 'shortBreak' | 'longBreak'

interface HistoryItem {
  id: number
  phase: Phase
  label: string
  startedAt: string
  duration: number
}

const STORAGE_KEY = 'focus-timer-history'
const SETTINGS_KEY = 'focus-timer-settings'

const PHASE_LABELS: Record<Phase, string> = {
  work: '专注中',
  shortBreak: '短休息',
  longBreak: '长休息',
}

const PHASE_COLORS: Record<Phase, string> = {
  work: '#f97316',
  shortBreak: '#22c55e',
  longBreak: '#3b82f6',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items: HistoryItem[] = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    return items.filter((item) => item.startedAt.startsWith(today))
  } catch {
    return []
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    const existing: HistoryItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const today = new Date().toISOString().slice(0, 10)
    const nonToday = existing.filter((i) => !i.startedAt.startsWith(today))
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...nonToday, ...items]))
  } catch {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveSettings(s: { work: number; shortBreak: number; longBreak: number; autoStart: boolean }) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {}
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = ctx.currentTime
    // Three ascending tones
    const freqs = [523.25, 659.25, 783.99]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.2)
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.2 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.2)
      osc.stop(now + i * 0.2 + 0.4)
    })
  } catch {}
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '🍅' })
    } catch {}
  }
}

const FocusTimer = () => {
  const theme = useStore((s) => s.theme)

  const saved = useMemo(() => loadSettings(), [])
  const [phase, setPhase] = useState<Phase>('work')
  const [workMinutes, setWorkMinutes] = useState(saved?.work ?? 25)
  const [shortBreakMinutes, setShortBreakMinutes] = useState(saved?.shortBreak ?? 5)
  const [longBreakMinutes, setLongBreakMinutes] = useState(saved?.longBreak ?? 15)
  const [autoStart, setAutoStart] = useState(saved?.autoStart ?? false)

  const totalTime = useMemo(() => {
    if (phase === 'work') return workMinutes * 60
    if (phase === 'shortBreak') return shortBreakMinutes * 60
    return longBreakMinutes * 60
  }, [phase, workMinutes, shortBreakMinutes, longBreakMinutes])

  const [timeRemaining, setTimeRemaining] = useState(totalTime)
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [taskLabel, setTaskLabel] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())
  const [showSettings, setShowSettings] = useState(false)
  const [showTaskList, setShowTaskList] = useState(false)
  const [inputLabel, setInputLabel] = useState('')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyIdRef = useRef<number>(Date.now())

  // Save settings when they change
  useEffect(() => {
    saveSettings({ work: workMinutes, shortBreak: shortBreakMinutes, longBreak: longBreakMinutes, autoStart })
  }, [workMinutes, shortBreakMinutes, longBreakMinutes, autoStart])

  // Save history when it changes
  useEffect(() => {
    saveHistory(history)
  }, [history])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, timeRemaining])

  // Handle timer completion
  useEffect(() => {
    if (timeRemaining !== 0 || !isRunning) return

    setIsRunning(false)
    playNotificationSound()

    const newHistoryItem: HistoryItem = {
      id: historyIdRef.current++,
      phase,
      label: taskLabel || (phase === 'work' ? '未标记任务' : '休息'),
      startedAt: new Date().toISOString(),
      duration: phase === 'work' ? workMinutes : phase === 'shortBreak' ? shortBreakMinutes : longBreakMinutes,
    }

    if (phase === 'work') {
      const newCompleted = completedPomodoros + 1
      setCompletedPomodoros(newCompleted)
      setHistory((prev) => [...prev, newHistoryItem])
      sendNotification('🍅 番茄完成！', `已完成第 ${newCompleted} 个番茄，休息一下吧`)

      if (newCompleted % 4 === 0) {
        setPhase('longBreak')
        setTimeRemaining(longBreakMinutes * 60)
      } else {
        setPhase('shortBreak')
        setTimeRemaining(shortBreakMinutes * 60)
      }
    } else {
      sendNotification('⏰ 休息结束', '开始新的专注时段吧！')
      setPhase('work')
      setTimeRemaining(workMinutes * 60)
    }

    if (autoStart) {
      // auto start will be picked up by the next effect cycle
      setTimeout(() => setIsRunning(true), 500)
    }
  }, [timeRemaining, isRunning, phase, completedPomodoros, taskLabel, workMinutes, shortBreakMinutes, longBreakMinutes, autoStart, history])

  const handleStart = useCallback(() => {
    requestNotificationPermission()
    setIsRunning(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(totalTime)
  }, [totalTime])

  const handleSkip = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(0)
    // Trigger completion logic manually
    const newHistoryItem: HistoryItem = {
      id: historyIdRef.current++,
      phase,
      label: taskLabel || (phase === 'work' ? '未标记任务' : '休息'),
      startedAt: new Date().toISOString(),
      duration: phase === 'work' ? workMinutes : phase === 'shortBreak' ? shortBreakMinutes : longBreakMinutes,
    }
    if (phase === 'work') {
      const newCompleted = completedPomodoros + 1
      setCompletedPomodoros(newCompleted)
      setHistory((prev) => [...prev, newHistoryItem])
      if (newCompleted % 4 === 0) {
        setPhase('longBreak')
        setTimeRemaining(longBreakMinutes * 60)
      } else {
        setPhase('shortBreak')
        setTimeRemaining(shortBreakMinutes * 60)
      }
    } else {
      setPhase('work')
      setTimeRemaining(workMinutes * 60)
    }
  }, [phase, taskLabel, completedPomodoros, workMinutes, shortBreakMinutes, longBreakMinutes])

  // SVG progress ring params
  const radius = 120
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const progress = (timeRemaining / totalTime) * circumference

  const accentColor = useMemo(() => PHASE_COLORS[phase], [phase])

  const totalFocusMinutes = useMemo(() => {
    return history
      .filter((h) => h.phase === 'work')
      .reduce((sum, h) => sum + h.duration, 0)
  }, [history])

  const todayPomodoroCount = useMemo(() => {
    return history.filter((h) => h.phase === 'work').length
  }, [history])

  const workHistory = useMemo(() => {
    return history.filter((h) => h.phase === 'work')
  }, [history])

  const isDark = theme === 'dark' || theme === 'auto'

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: isDark ? '#0f0f17' : '#f5f5f7',
    color: isDark ? '#e2e8f0' : '#1a1a2e',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    padding: '14px 20px',
    borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background: isDark ? '#0a0a12' : '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const btnBase: React.CSSProperties = {
    border: 'none',
    borderRadius: '12px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  }

  const inputStyle: React.CSSProperties = {
    background: isDark ? '#1e293b' : '#f1f5f9',
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    borderRadius: '10px',
    padding: '10px 16px',
    color: isDark ? '#e2e8f0' : '#1a1a2e',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>🍅 FocusTimer</div>
          <div style={{ fontSize: '12px', color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>专注番茄钟</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowTaskList(!showTaskList)}
            style={{
              ...btnBase,
              background: showTaskList ? accentColor : isDark ? '#1e293b' : '#e2e8f0',
              color: showTaskList ? '#fff' : isDark ? '#94a3b8' : '#64748b',
            }}
          >
            📋
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              ...btnBase,
              background: showSettings ? accentColor : isDark ? '#1e293b' : '#e2e8f0',
              color: showSettings ? '#fff' : isDark ? '#94a3b8' : '#64748b',
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Timer Area */}
        <div style={{
          flex: showTaskList ? '0 0 65%' : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          transition: 'flex 0.3s ease',
          overflow: 'auto',
        }}>
          {/* Phase Indicators */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {(['work', 'shortBreak', 'longBreak'] as Phase[]).map((p) => (
              <div
                key={p}
                onClick={() => {
                  if (!isRunning) {
                    setPhase(p)
                    const dur = p === 'work' ? workMinutes : p === 'shortBreak' ? shortBreakMinutes : longBreakMinutes
                    setTimeRemaining(dur * 60)
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isRunning ? 'default' : 'pointer',
                  background: phase === p ? PHASE_COLORS[p] : isDark ? '#1e293b' : '#e2e8f0',
                  color: phase === p ? '#fff' : isDark ? '#64748b' : '#94a3b8',
                  transition: 'all 0.2s ease',
                  opacity: isRunning && phase !== p ? 0.5 : 1,
                }}
              >
                {p === 'work' ? '🔴 专注' : p === 'shortBreak' ? '🟢 短休' : '🔵 长休'}
              </div>
            ))}
          </div>

          {/* SVG Progress Ring */}
          <div style={{ position: 'relative', width: 280, height: 280 }}>
            <svg width={280} height={280} viewBox="0 0 280 280">
              {/* Background glow */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Background ring */}
              <circle
                cx={140} cy={140} r={radius}
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <circle
                cx={140} cy={140} r={radius}
                fill="none"
                stroke={accentColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                transform="rotate(-90 140 140)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                filter="url(#glow)"
              />
              {/* Tick marks */}
              {Array.from({ length: 60 }, (_, i) => {
                const angle = (i * 6 - 90) * (Math.PI / 180)
                const isMajor = i % 5 === 0
                const innerR = isMajor ? 130 : 133
                const outerR = 136
                return (
                  <line
                    key={i}
                    x1={140 + innerR * Math.cos(angle)}
                    y1={140 + innerR * Math.sin(angle)}
                    x2={140 + outerR * Math.cos(angle)}
                    y2={140 + outerR * Math.sin(angle)}
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    strokeWidth={isMajor ? 2 : 1}
                  />
                )
              })}
            </svg>
            {/* Center content */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '56px',
                fontWeight: 200,
                fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                letterSpacing: '2px',
                color: isDark ? '#f1f5f9' : '#1a1a2e',
                lineHeight: 1,
              }}>
                {formatTime(timeRemaining)}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: accentColor,
                marginTop: 8,
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}>
                {PHASE_LABELS[phase]}
              </div>
              <div style={{
                fontSize: '12px',
                color: isDark ? '#64748b' : '#94a3b8',
                marginTop: 4,
              }}>
                {'🍅'.repeat(completedPomodoros % 4)} {completedPomodoros > 0 ? `#${completedPomodoros}` : ''}
              </div>
            </div>
          </div>

          {/* Task Label Display */}
          {taskLabel && (
            <div style={{
              marginTop: 16,
              padding: '6px 16px',
              borderRadius: '16px',
              background: isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)',
              color: accentColor,
              fontSize: '13px',
              fontWeight: 500,
            }}>
              📌 {taskLabel}
            </div>
          )}

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            {!isRunning ? (
              <button
                onClick={handleStart}
                style={{
                  ...btnBase,
                  background: accentColor,
                  color: '#fff',
                  padding: '12px 36px',
                  fontSize: '15px',
                  boxShadow: `0 4px 20px ${accentColor}44`,
                }}
              >
                ▶ 开始
              </button>
            ) : (
              <button
                onClick={handlePause}
                style={{
                  ...btnBase,
                  background: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#e2e8f0' : '#1a1a2e',
                  padding: '12px 36px',
                  fontSize: '15px',
                }}
              >
                ⏸ 暂停
              </button>
            )}
            <button
              onClick={handleReset}
              style={{
                ...btnBase,
                background: isDark ? '#1e293b' : '#f1f5f9',
                color: isDark ? '#94a3b8' : '#64748b',
                padding: '12px 20px',
                fontSize: '14px',
              }}
            >
              ↺ 重置
            </button>
            <button
              onClick={handleSkip}
              style={{
                ...btnBase,
                background: isDark ? '#1e293b' : '#f1f5f9',
                color: isDark ? '#94a3b8' : '#64748b',
                padding: '12px 20px',
                fontSize: '14px',
              }}
            >
              ⏭ 跳过
            </button>
          </div>

          {/* Tag Input */}
          <div style={{
            marginTop: 24,
            width: '100%',
            maxWidth: 360,
            display: 'flex',
            gap: 8,
          }}>
            <input
              type="text"
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputLabel.trim()) {
                  setTaskLabel(inputLabel.trim())
                  setInputLabel('')
                }
              }}
              placeholder="输入任务标签..."
              style={inputStyle}
            />
            <button
              onClick={() => {
                if (inputLabel.trim()) {
                  setTaskLabel(inputLabel.trim())
                  setInputLabel('')
                }
              }}
              style={{
                ...btnBase,
                background: accentColor,
                color: '#fff',
                padding: '10px 16px',
                whiteSpace: 'nowrap',
              }}
            >
              标记
            </button>
          </div>

          {/* Auto Start Toggle */}
          <label style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '13px',
            color: isDark ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            userSelect: 'none',
          }}>
            <div
              onClick={() => setAutoStart(!autoStart)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: autoStart ? accentColor : isDark ? '#334155' : '#cbd5e1',
                position: 'relative',
                transition: 'background 0.2s ease',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 2,
                left: autoStart ? 18 : 2,
                transition: 'left 0.2s ease',
              }} />
            </div>
            自动开始下一阶段
          </label>

          {/* Today Stats */}
          <div style={{
            marginTop: 28,
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
          }}>
            <div style={{
              textAlign: 'center',
              padding: '12px 20px',
              borderRadius: '12px',
              background: isDark ? '#1e293b' : '#f1f5f9',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: accentColor }}>{todayPomodoroCount}</div>
              <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>今日番茄</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '12px 20px',
              borderRadius: '12px',
              background: isDark ? '#1e293b' : '#f1f5f9',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: accentColor }}>
                {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>专注时长</div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{
              marginTop: 24,
              padding: 20,
              borderRadius: '16px',
              background: isDark ? '#1e293b' : '#f1f5f9',
              width: '100%',
              maxWidth: 360,
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 16 }}>⚙️ 时长设置</div>
              {[
                { label: '专注时长（分钟）', value: workMinutes, set: setWorkMinutes, min: 1, max: 120 },
                { label: '短休息（分钟）', value: shortBreakMinutes, set: setShortBreakMinutes, min: 1, max: 30 },
                { label: '长休息（分钟）', value: longBreakMinutes, set: setLongBreakMinutes, min: 1, max: 60 },
              ].map(({ label, value, set: setter, min, max }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: 6 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={value}
                      onChange={(e) => {
                        const v = parseInt(e.target.value)
                        setter(v)
                        // Reset timer if not running and on same phase
                        if (!isRunning) {
                          const p = label.includes('专注') ? 'work' : label.includes('短') ? 'shortBreak' : 'longBreak'
                          if (p === phase) setTimeRemaining(v * 60)
                        }
                      }}
                      style={{ flex: 1, accentColor }}
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isDark ? '#e2e8f0' : '#1a1a2e',
                      minWidth: 36,
                      textAlign: 'right',
                    }}>
                      {value}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task History Sidebar */}
        {showTaskList && (
          <div style={{
            flex: '0 0 35%',
            borderLeft: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            background: isDark ? '#0a0a12' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
              fontWeight: 700,
              fontSize: '14px',
            }}>
              📋 今日记录 ({workHistory.length})
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              {workHistory.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: isDark ? '#475569' : '#94a3b8',
                  fontSize: '13px',
                }}>
                  暂无记录<br />完成一个番茄后会出现在这里
                </div>
              ) : (
                [...workHistory].reverse().map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isDark ? '#1e293b' : '#f8fafc',
                      marginBottom: 6,
                      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>🍅 #{workHistory.length - idx}</span>
                      <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>
                        {item.duration}min
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: isDark ? '#475569' : '#94a3b8',
                      marginTop: 3,
                    }}>
                      {new Date(item.startedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FocusTimer
