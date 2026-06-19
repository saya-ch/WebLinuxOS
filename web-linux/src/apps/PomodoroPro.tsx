import { useState, useEffect, useRef, useMemo } from 'react'

type Mode = 'focus' | 'short' | 'long'

interface ModeConfig {
  key: Mode
  label: string
  icon: string
  defaultDuration: number
  color: string
  accent: string
}

const MODES: ModeConfig[] = [
  { key: 'focus', label: '专注', icon: '🎯', defaultDuration: 25, color: '#ef4444', accent: 'rgba(239,68,68,0.15)' },
  { key: 'short', label: '短休息', icon: '☕', defaultDuration: 5, color: '#10b981', accent: 'rgba(16,185,129,0.15)' },
  { key: 'long', label: '长休息', icon: '🌙', defaultDuration: 15, color: '#3b82f6', accent: 'rgba(59,130,246,0.15)' },
]

interface Stats {
  totalPomodoros: number
  totalFocusMinutes: number
  todayPomodoros: number
  todayFocusMinutes: number
  lastDate: string
}

const STORAGE_KEY = 'weblinux-pomodoro-stats'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Stats
      const today = todayStr()
      if (parsed.lastDate !== today) {
        return { ...parsed, todayPomodoros: 0, todayFocusMinutes: 0, lastDate: today }
      }
      return parsed
    }
  } catch {
    // ignore
  }
  return { totalPomodoros: 0, totalFocusMinutes: 0, todayPomodoros: 0, todayFocusMinutes: 0, lastDate: todayStr() }
}

function playBeep() {
  try {
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const playTone = (freq: number, start: number, duration: number, vol = 0.15) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration + 0.05)
    }
    playTone(880, 0, 0.18)
    playTone(660, 0.2, 0.18)
    playTone(880, 0.4, 0.22)
    setTimeout(() => ctx.close().catch(() => {}), 1500)
  } catch {
    // ignore
  }
}

function sendNotification(title: string, body: string) {
  try {
    const evt = new CustomEvent('weblinux-notification', { detail: { title, body } })
    window.dispatchEvent(evt)
  } catch {
    // ignore
  }
}

function formatTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PomodoroPro: React.FC = () => {
  const [durations, setDurations] = useState<Record<Mode, number>>(() => ({
    focus: MODES[0].defaultDuration,
    short: MODES[1].defaultDuration,
    long: MODES[2].defaultDuration,
  }))
  const [mode, setMode] = useState<Mode>('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(durations.focus * 60)
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [editMode, setEditMode] = useState(false)
  const tickRef = useRef<number | null>(null)
  const endedAtRef = useRef<number>(0)

  const currentConfig = useMemo(() => MODES.find((m) => m.key === mode)!, [mode])
  const totalSeconds = durations[mode] * 60
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    if (!isRunning) return
    endedAtRef.current = Date.now() + secondsLeft * 1000
    tickRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((endedAtRef.current - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        if (tickRef.current !== null) clearInterval(tickRef.current)
        tickRef.current = null
        setIsRunning(false)
        playBeep()
        if (mode === 'focus') {
          const mins = durations.focus
          const today = todayStr()
          setStats((prev) => {
            const resetToday = prev.lastDate !== today
            return {
              totalPomodoros: prev.totalPomodoros + 1,
              totalFocusMinutes: prev.totalFocusMinutes + mins,
              todayPomodoros: (resetToday ? 0 : prev.todayPomodoros) + 1,
              todayFocusMinutes: (resetToday ? 0 : prev.todayFocusMinutes) + mins,
              lastDate: today,
            }
          })
          sendNotification('🍅 番茄完成！', `已专注 ${mins} 分钟，休息一下吧。`)
        } else {
          sendNotification('⏰ 休息结束', '是时候回到专注状态了！')
        }
      }
    }, 250)
    return () => {
      if (tickRef.current !== null) clearInterval(tickRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning])

  const toggleStart = () => {
    if (!isRunning && secondsLeft === 0) {
      setSecondsLeft(totalSeconds)
    }
    setIsRunning((p) => !p)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setSecondsLeft(totalSeconds)
  }

  const switchMode = (m: Mode) => {
    setIsRunning(false)
    setMode(m)
    setSecondsLeft(durations[m] * 60)
  }

  const circleSize = 260
  const stroke = 14
  const radius = (circleSize - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="app-shell" style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>🍅 番茄钟 Pro</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>专注 · 休息 · 保持节奏</p>
        </div>

        <div style={{ display: 'flex', gap: 8, background: '#1a1a2e', padding: 4, borderRadius: 12, border: '1px solid var(--window-border)' }}>
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontFamily: 'inherit',
                border: 'none',
                borderRadius: 8,
                background: mode === m.key ? m.color : 'transparent',
                color: mode === m.key ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: mode === m.key ? 600 : 400,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: circleSize, height: circleSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={circleSize} height={circleSize} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="pomo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={currentConfig.color} stopOpacity="1" />
                <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <circle cx={circleSize / 2} cy={circleSize / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke="url(#pomo-gradient)"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: 2 }}>
              {formatTime(secondsLeft)}
            </span>
            <span style={{ fontSize: 13, color: currentConfig.color, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>
              {currentConfig.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {(progress * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={toggleStart}
            style={{
              padding: '12px 28px',
              fontSize: 15,
              fontFamily: 'inherit',
              background: currentConfig.color,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: `0 6px 20px ${currentConfig.color}55`,
              transition: 'transform 0.15s',
              letterSpacing: 1,
              minWidth: 140,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isRunning ? '⏸ 暂停' : secondsLeft === totalSeconds || secondsLeft === 0 ? '▶ 开始' : '▶ 继续'}
          </button>
          <button
            onClick={resetTimer}
            style={{
              padding: '12px 22px',
              fontSize: 14,
              fontFamily: 'inherit',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            ↺ 重置
          </button>
          <button
            onClick={() => setEditMode((p) => !p)}
            style={{
              padding: '12px 18px',
              fontSize: 14,
              fontFamily: 'inherit',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            ⚙
          </button>
        </div>

        {editMode && (
          <div style={{ width: '100%', padding: 16, background: '#1a1a2e', borderRadius: 12, border: '1px solid var(--window-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>自定义时长（分钟）</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {MODES.map((m) => (
                <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.icon} {m.label}</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={durations[m.key]}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(180, parseInt(e.target.value) || 1))
                      setDurations((p) => ({ ...p, [m.key]: v }))
                      if (mode === m.key && !isRunning) setSecondsLeft(v * 60)
                    }}
                    className="app-input"
                    style={{ padding: '8px 10px', fontSize: 13, fontFamily: 'monospace', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
          <div style={{ padding: 14, background: currentConfig.accent, border: `1px solid ${currentConfig.color}33`, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 4 }}>今日番茄</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: currentConfig.color, fontFamily: 'monospace' }}>{stats.todayPomodoros}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{stats.todayFocusMinutes} 分钟专注</div>
          </div>
          <div style={{ padding: 14, background: '#1a1a2e', border: '1px solid var(--window-border)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 4 }}>累计</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{stats.totalPomodoros}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{stats.totalFocusMinutes} 分钟专注</div>
          </div>
        </div>

        <button
          onClick={() => {
            if (!confirm('确定要清空所有统计数据吗？')) return
            const fresh: Stats = { totalPomodoros: 0, totalFocusMinutes: 0, todayPomodoros: 0, todayFocusMinutes: 0, lastDate: todayStr() }
            setStats(fresh)
          }}
          style={{
            fontSize: 12,
            padding: '6px 12px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--window-border)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginTop: 4,
          }}
        >
          清空统计
        </button>
      </div>
    </div>
  )
}

export default PomodoroPro
