import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Music, Volume2, VolumeX, Timer, Clock, TrendingUp, Award, Zap } from 'lucide-react'

type Mode = 'focus' | 'short' | 'long'

interface SessionRecord {
  id: string
  mode: Mode
  duration: number
  completed: boolean
  timestamp: number
}

interface Stats {
  totalSessions: number
  completedSessions: number
  totalMinutes: number
  todaySessions: number
  todayMinutes: number
  streak: number
}

const MODE_CONFIG: Record<Mode, { label: string; duration: number; icon: typeof Brain; color: string }> = {
  focus: { label: '深度专注', duration: 25 * 60, icon: Brain, color: '#3b82f6' },
  short: { label: '短休息', duration: 5 * 60, icon: Coffee, color: '#22c55e' },
  long: { label: '长休息', duration: 15 * 60, icon: Music, color: '#f59e0b' },
}

const STORAGE_KEY = 'focusflow-data'

function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: SessionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function calculateStats(sessions: SessionRecord[]): Stats {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  
  const focusSessions = sessions.filter(s => s.mode === 'focus')
  const completedFocus = focusSessions.filter(s => s.completed)
  const todaySessions = focusSessions.filter(s => s.timestamp >= todayStart)
  const todayCompleted = todaySessions.filter(s => s.completed)
  
  let streak = 0
  const daysBack = [...new Set(focusSessions.filter(s => s.completed).map(s => {
    const d = new Date(s.timestamp)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))].sort().reverse()
  
  for (let i = 0; i < daysBack.length; i++) {
    const date = new Date(daysBack[i])
    const expectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    if (date.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }
  
  return {
    totalSessions: focusSessions.length,
    completedSessions: completedFocus.length,
    totalMinutes: Math.round(completedFocus.reduce((sum, s) => sum + s.duration, 0) / 60),
    todaySessions: todaySessions.length,
    todayMinutes: Math.round(todayCompleted.reduce((sum, s) => sum + s.duration, 0) / 60),
    streak,
  }
}

export default function FocusFlow() {
  const [mode, setMode] = useState<Mode>('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.focus.duration)
  const [sessions, setSessions] = useState<SessionRecord[]>(() => loadSessions())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [stats] = useState<Stats>(() => calculateStats(loadSessions()))
  
  const intervalRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    setTimeLeft(MODE_CONFIG[mode].duration)
    setIsRunning(false)
  }, [mode])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSessionComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const playSound = useCallback((type: 'complete' | 'tick') => {
    if (!soundEnabled) return
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      if (type === 'complete') {
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime)
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
      }
    } catch {}
  }, [soundEnabled])

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false)
    playSound('complete')
    
    const newSession: SessionRecord = {
      id: Date.now().toString(),
      mode,
      duration: MODE_CONFIG[mode].duration,
      completed: true,
      timestamp: Date.now(),
    }
    
    const updatedSessions = [...sessions, newSession]
    setSessions(updatedSessions)
    saveSessions(updatedSessions)
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FocusFlow 完成！', {
        body: `${MODE_CONFIG[mode].label}时间已到`,
      })
    }
  }, [mode, sessions, playSound])

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(MODE_CONFIG[mode].duration)
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(MODE_CONFIG[mode].duration)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = 1 - (timeLeft / MODE_CONFIG[mode].duration)
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference * (1 - progress)

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const recentSessions = sessions
    .filter(s => s.mode === 'focus')
    .slice(-10)
    .reverse()

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      padding: 24,
      overflow: 'auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          FocusFlow 专注流
        </h1>
        <p style={{ opacity: 0.6, fontSize: 14, marginTop: 4 }}>
          深度工作，高效休息
        </p>
      </div>

      {/* Mode Selector */}
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        {(Object.keys(MODE_CONFIG) as Mode[]).map(m => {
          const cfg = MODE_CONFIG[m]
          const Icon = cfg.icon
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 24,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
                background: mode === m ? cfg.color : 'rgba(255,255,255,0.1)',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.7)',
              }}
            >
              <Icon size={16} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Timer Circle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        <div style={{ position: 'relative', width: 280, height: 280 }}>
          <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke={MODE_CONFIG[mode].color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 56, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ opacity: 0.6, fontSize: 14, marginTop: 8 }}>
              {isRunning ? '进行中...' : timeLeft === 0 ? '完成！' : '准备开始'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        <button
          onClick={toggleTimer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 32px',
            borderRadius: 32,
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 600,
            transition: 'all 0.2s',
            background: MODE_CONFIG[mode].color,
            color: '#fff',
            boxShadow: `0 4px 20px ${MODE_CONFIG[mode].color}40`,
          }}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? '暂停' : '开始'}
        </button>
        <button
          onClick={resetTimer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 24px',
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            background: 'transparent',
            color: '#fff',
          }}
        >
          <RotateCcw size={18} />
          重置
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            background: 'transparent',
            color: '#fff',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: '今日完成', value: stats.todaySessions, icon: Timer },
          { label: '今日时长', value: `${stats.todayMinutes}m`, icon: Clock },
          { label: '总完成数', value: stats.completedSessions, icon: Award },
          { label: '连续天数', value: `${stats.streak}天`, icon: Zap },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Icon size={20} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
            <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} />
          最近记录
        </h3>
        {recentSessions.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5, padding: 20 }}>
            还没有完成的专注会话
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSessions.map(session => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: session.completed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <span>{new Date(session.timestamp).toLocaleString('zh-CN')}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  background: session.completed ? '#22c55e' : '#ef4444',
                }}>
                  {session.completed ? '完成' : '中断'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
