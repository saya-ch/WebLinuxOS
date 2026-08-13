import { useState, useEffect, useRef, useCallback } from 'react'

type Mode = 'work' | 'shortBreak' | 'longBreak'

interface Stats {
  todayCompleted: number
  todayDate: string
  totalFocusSeconds: number
  totalCompleted: number
}

interface Durations {
  work: number
  shortBreak: number
  longBreak: number
}

const STORAGE_KEY = 'weblinux-pomodoro-timer-stats'
const DURATIONS_KEY = 'weblinux-pomodoro-timer-durations'

const DEFAULT_DURATIONS: Durations = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { todayCompleted: 0, todayDate: new Date().toISOString().slice(0, 10), totalFocusSeconds: 0, totalCompleted: 0 }
    const parsed = JSON.parse(raw) as Stats
    const today = new Date().toISOString().slice(0, 10)
    if (parsed.todayDate !== today) {
      return { todayCompleted: 0, todayDate: today, totalFocusSeconds: parsed.totalFocusSeconds || 0, totalCompleted: parsed.totalCompleted || 0 }
    }
    return {
      todayCompleted: parsed.todayCompleted || 0,
      todayDate: today,
      totalFocusSeconds: parsed.totalFocusSeconds || 0,
      totalCompleted: parsed.totalCompleted || 0,
    }
  } catch {
    return { todayCompleted: 0, todayDate: new Date().toISOString().slice(0, 10), totalFocusSeconds: 0, totalCompleted: 0 }
  }
}

function saveStats(stats: Stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {}
}

function loadDurations(): Durations {
  try {
    const raw = localStorage.getItem(DURATIONS_KEY)
    if (!raw) return { ...DEFAULT_DURATIONS }
    const parsed = JSON.parse(raw)
    return {
      work: Math.max(60, (parsed.work || 25) * 60),
      shortBreak: Math.max(60, (parsed.shortBreak || 5) * 60),
      longBreak: Math.max(60, (parsed.longBreak || 15) * 60),
    }
  } catch {
    return { ...DEFAULT_DURATIONS }
  }
}

function saveDurations(d: Durations) {
  try {
    localStorage.setItem(DURATIONS_KEY, JSON.stringify({
      work: Math.round(d.work / 60),
      shortBreak: Math.round(d.shortBreak / 60),
      longBreak: Math.round(d.longBreak / 60),
    }))
  } catch {}
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  return `${m}分钟`
}

function getModeLabel(mode: Mode): string {
  switch (mode) {
    case 'work': return '专注'
    case 'shortBreak': return '短休息'
    case 'longBreak': return '长休息'
  }
}

function getModeColor(mode: Mode): string {
  switch (mode) {
    case 'work': return 'var(--pt-work, #e74c3c)'
    case 'shortBreak': return 'var(--pt-short, #27ae60)'
    case 'longBreak': return 'var(--pt-long, #2980b9)'
  }
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
      osc.start(start)
      osc.stop(start + duration)
    }
    const now = ctx.currentTime
    playTone(880, now, 0.15)
    playTone(1100, now + 0.2, 0.15)
    playTone(880, now + 0.4, 0.2)
    setTimeout(() => ctx.close(), 2000)
  } catch {}
}

function sendNotification(title: string, body: string) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' })
      }
    })
  }
}

const PomodoroTimer: React.FC = () => {
  const [durations, setDurations] = useState<Durations>(() => loadDurations())
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(durations.work)
  const [isRunning, setIsRunning] = useState(false)
  const [completedWork, setCompletedWork] = useState(0)
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [miniMode, setMiniMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const timerRef = useRef<number | null>(null)

  const totalTime = durations[mode]
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
  }, [])

  const switchToMode = useCallback((newMode: Mode) => {
    stopTimer()
    setMode(newMode)
    setTimeLeft(durations[newMode])
  }, [durations, stopTimer])

  const advanceSession = useCallback(() => {
    stopTimer()
    if (mode === 'work') {
      const newCount = completedWork + 1
      setCompletedWork(newCount)
      const updated: Stats = {
        ...stats,
        todayCompleted: stats.todayCompleted + 1,
        totalCompleted: stats.totalCompleted + 1,
        totalFocusSeconds: stats.totalFocusSeconds + durations.work,
      }
      setStats(updated)
      saveStats(updated)

      sendNotification('🍅 专注完成！', '是时候休息一下了')
      playBeep()

      if (newCount > 0 && newCount % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(durations.longBreak)
      } else {
        setMode('shortBreak')
        setTimeLeft(durations.shortBreak)
      }
    } else {
      sendNotification('休息结束', '准备开始下一个专注会话')
      playBeep()
      setMode('work')
      setTimeLeft(durations.work)
    }
  }, [mode, completedWork, stats, durations, stopTimer])

  const startTimer = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          advanceSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [isRunning, advanceSession])

  const pauseTimer = useCallback(() => {
    stopTimer()
  }, [stopTimer])

  const resetTimer = useCallback(() => {
    stopTimer()
    setTimeLeft(durations[mode])
  }, [stopTimer, durations, mode])

  const skipToNext = useCallback(() => {
    advanceSession()
  }, [advanceSession])

  const switchMode = useCallback((newMode: Mode) => {
    switchToMode(newMode)
  }, [switchToMode])

  const updateDurations = useCallback((newDurations: Partial<Durations>) => {
    setDurations(prev => {
      const updated = { ...prev, ...newDurations }
      saveDurations(updated)
      return updated
    })
  }, [])

  const resetStats = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    const fresh: Stats = { todayCompleted: 0, todayDate: today, totalFocusSeconds: 0, totalCompleted: 0 }
    setStats(fresh)
    saveStats(fresh)
    setCompletedWork(0)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference * (1 - progress)
  const accentColor = getModeColor(mode)

  return (
    <div
      className="pomodoro-timer-root"
      style={{
        '--pt-work': '#e74c3c',
        '--pt-short': '#27ae60',
        '--pt-long': '#2980b9',
        '--pt-bg': 'var(--bg-primary, #0f0f1a)',
        '--pt-card': 'var(--bg-secondary, #1a1a2e)',
        '--pt-border': 'var(--border-color, rgba(255,255,255,0.1))',
        '--pt-text': 'var(--text-primary, #f0f0ff)',
        '--pt-text-dim': 'var(--text-secondary, #9090c0)',
        '--pt-accent': 'var(--accent, #9b8af0)',
      } as React.CSSProperties}
    >
      <div className="pt-header">
        <div className="pt-title">🍅 番茄钟</div>
        <button
          className="pt-icon-btn"
          onClick={() => setMiniMode(m => !m)}
          title={miniMode ? '展开' : '迷你模式'}
        >
          {miniMode ? '⛶' : '⛳'}
        </button>
      </div>

      {!miniMode && (
        <div className="pt-mode-tabs">
          {(['work', 'shortBreak', 'longBreak'] as Mode[]).map(m => (
            <button
              key={m}
              className={`pt-tab ${mode === m ? 'active' : ''}`}
              style={mode === m ? { '--tab-color': getModeColor(m) } as React.CSSProperties : undefined}
              onClick={() => switchMode(m)}
            >
              {getModeLabel(m)}
            </button>
          ))}
        </div>
      )}

      <div className="pt-circle-wrap">
        <svg
          className="pt-circle"
          viewBox="0 0 200 200"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="var(--pt-border)"
            strokeWidth="10"
          />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={accentColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="pt-progress-ring"
          />
        </svg>
        <div className="pt-circle-center">
          <div className="pt-time">{formatTime(timeLeft)}</div>
          <div className="pt-mode-name" style={{ color: accentColor }}>
            {getModeLabel(mode)}
          </div>
        </div>
      </div>

      <div className="pt-controls">
        {!isRunning ? (
          <button className="pt-btn pt-btn-primary" onClick={startTimer}>
            ▶ 开始
          </button>
        ) : (
          <button className="pt-btn pt-btn-danger" onClick={pauseTimer}>
            ⏸ 暂停
          </button>
        )}
        <button className="pt-btn pt-btn-secondary" onClick={resetTimer}>
          ↻ 重置
        </button>
        <button className="pt-btn pt-btn-secondary" onClick={skipToNext}>
          ⏭ 跳过
        </button>
      </div>

      {!miniMode && (
        <div className="pt-stats">
          <div className="pt-stat">
            <div className="pt-stat-value">{stats.todayCompleted}</div>
            <div className="pt-stat-label">今日完成</div>
          </div>
          <div className="pt-stat">
            <div className="pt-stat-value">{formatDuration(stats.totalFocusSeconds)}</div>
            <div className="pt-stat-label">累计专注</div>
          </div>
          <div className="pt-stat">
            <div className="pt-stat-value">{completedWork % 4}/4</div>
            <div className="pt-stat-label">本轮进度</div>
          </div>
        </div>
      )}

      {!miniMode && (
        <div className="pt-footer">
          <button
            className="pt-link-btn"
            onClick={() => setShowSettings(s => !s)}
          >
            {showSettings ? '收起设置' : '⚙ 设置'}
          </button>
          <button
            className="pt-link-btn"
            onClick={resetStats}
          >
            清空统计
          </button>
        </div>
      )}

      {showSettings && !miniMode && (
        <div className="pt-settings">
          <div className="pt-setting-row">
            <label>专注时长（分钟）</label>
            <input
              type="number"
              min={1}
              max={120}
              value={Math.round(durations.work / 60)}
              onChange={e => updateDurations({ work: Math.max(60, (Number(e.target.value) || 25) * 60) })}
            />
          </div>
          <div className="pt-setting-row">
            <label>短休息（分钟）</label>
            <input
              type="number"
              min={1}
              max={60}
              value={Math.round(durations.shortBreak / 60)}
              onChange={e => updateDurations({ shortBreak: Math.max(60, (Number(e.target.value) || 5) * 60) })}
            />
          </div>
          <div className="pt-setting-row">
            <label>长休息（分钟）</label>
            <input
              type="number"
              min={1}
              max={60}
              value={Math.round(durations.longBreak / 60)}
              onChange={e => updateDurations({ longBreak: Math.max(60, (Number(e.target.value) || 15) * 60) })}
            />
          </div>
          <div className="pt-setting-row">
            <button
              className="pt-btn pt-btn-secondary"
              style={{ width: '100%' }}
              onClick={() => {
                setDurations({ ...DEFAULT_DURATIONS })
                saveDurations({ ...DEFAULT_DURATIONS })
              }}
            >
              恢复默认
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pomodoro-timer-root {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 12px;
          background: var(--pt-bg);
          color: var(--pt-text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: auto;
        }

        .pt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pt-title {
          font-size: 18px;
          font-weight: 700;
        }

        .pt-icon-btn {
          background: transparent;
          border: 1px solid var(--pt-border);
          color: var(--pt-text-dim);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pt-icon-btn:hover {
          color: var(--pt-text);
          background: var(--pt-card);
        }

        .pt-mode-tabs {
          display: flex;
          gap: 4px;
          background: var(--pt-card);
          border-radius: 10px;
          padding: 4px;
        }

        .pt-tab {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--pt-text-dim);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .pt-tab:hover {
          color: var(--pt-text);
        }

        .pt-tab.active {
          background: var(--tab-color, var(--pt-accent));
          color: #fff;
        }

        .pt-circle-wrap {
          position: relative;
          width: 220px;
          height: 220px;
          margin: 8px auto;
        }

        .pt-circle {
          width: 100%;
          height: 100%;
        }

        .pt-progress-ring {
          transition: stroke-dashoffset 0.5s ease;
        }

        .pt-circle-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .pt-time {
          font-size: 42px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: 1px;
        }

        .pt-mode-name {
          font-size: 14px;
          margin-top: 4px;
          font-weight: 500;
        }

        .pt-controls {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .pt-btn {
          padding: 10px 18px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
        }

        .pt-btn-primary {
          background: var(--pt-accent);
        }

        .pt-btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .pt-btn-danger {
          background: #e74c3c;
        }

        .pt-btn-danger:hover {
          filter: brightness(1.1);
        }

        .pt-btn-secondary {
          background: var(--pt-card);
          color: var(--pt-text);
          border: 1px solid var(--pt-border);
        }

        .pt-btn-secondary:hover {
          background: var(--pt-border);
        }

        .pt-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .pt-stat {
          background: var(--pt-card);
          border-radius: 10px;
          padding: 12px 8px;
          text-align: center;
        }

        .pt-stat-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--pt-accent);
        }

        .pt-stat-label {
          font-size: 12px;
          color: var(--pt-text-dim);
          margin-top: 2px;
        }

        .pt-footer {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: auto;
        }

        .pt-link-btn {
          background: transparent;
          border: none;
          color: var(--pt-text-dim);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .pt-link-btn:hover {
          color: var(--pt-text);
          background: var(--pt-card);
        }

        .pt-settings {
          background: var(--pt-card);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pt-setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .pt-setting-row label {
          font-size: 13px;
          color: var(--pt-text-dim);
        }

        .pt-setting-row input {
          width: 80px;
          padding: 6px 10px;
          background: var(--pt-bg);
          border: 1px solid var(--pt-border);
          border-radius: 6px;
          color: var(--pt-text);
          font-size: 14px;
          text-align: center;
        }

        .pt-setting-row input:focus {
          outline: none;
          border-color: var(--pt-accent);
        }
      `}</style>
    </div>
  )
}

export default PomodoroTimer