import { useState, useEffect, useRef, useCallback } from 'react'

function AnalogClock({ date }: { date: Date }) {
  const hours = date.getHours() % 12
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const hourAngle = (hours + minutes / 60) * 30
  const minuteAngle = (minutes + seconds / 60) * 6
  const secondAngle = seconds * 6

  return (
    <svg viewBox="0 0 200 200" style={{ width: 220, height: 220 }}>
      <circle cx="100" cy="100" r="95" fill="none" stroke="#555" strokeWidth="2" />
      <circle cx="100" cy="100" r="93" fill="none" stroke="#444" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const x1 = 100 + 85 * Math.sin(angle)
        const y1 = 100 - 85 * Math.cos(angle)
        const x2 = 100 + 75 * Math.sin(angle)
        const y2 = 100 - 75 * Math.cos(angle)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#aaa" strokeWidth={i % 3 === 0 ? 2.5 : 1} />
        )
      })}
      <line
        x1="100" y1="100"
        x2={100 + 50 * Math.sin((hourAngle * Math.PI) / 180)}
        y2={100 - 50 * Math.cos((hourAngle * Math.PI) / 180)}
        stroke="#fff" strokeWidth="4" strokeLinecap="round"
      />
      <line
        x1="100" y1="100"
        x2={100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)}
        y2={100 - 70 * Math.cos((minuteAngle * Math.PI) / 180)}
        stroke="#ccc" strokeWidth="3" strokeLinecap="round"
      />
      <line
        x1="100" y1="100"
        x2={100 + 80 * Math.sin((secondAngle * Math.PI) / 180)}
        y2={100 - 80 * Math.cos((secondAngle * Math.PI) / 180)}
        stroke="#ff4444" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="100" cy="100" r="4" fill="#ff4444" />
    </svg>
  )
}

export default function Clock() {
  const [date, setDate] = useState(new Date())
  const [tab, setTab] = useState<'clock' | 'stopwatch' | 'timer'>('clock')

  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [stopwatchLaps, setStopwatchLaps] = useState<number[]>([])

  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerInput, setTimerInput] = useState('')
  const [timerRunning, setTimerRunning] = useState(false)

  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (stopwatchRunning) {
      stopwatchRef.current = setInterval(() => {
        setStopwatchTime((t) => t + 10)
      }, 10)
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current)
      stopwatchRef.current = null
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current)
    }
  }, [stopwatchRunning])

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((t) => {
          if (t <= 1) {
            setTimerRunning(false)
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  const formatTime = useCallback((ms: number): string => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    const cs = Math.floor((ms % 1000) / 10)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }, [])

  const formatTimer = useCallback((s: number): string => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }, [])

  function handleStopwatchToggle() {
    setStopwatchRunning(!stopwatchRunning)
  }

  function handleStopwatchReset() {
    setStopwatchRunning(false)
    setStopwatchTime(0)
    setStopwatchLaps([])
  }

  function handleLap() {
    if (stopwatchRunning) {
      setStopwatchLaps((prev) => [...prev, stopwatchTime])
    }
  }

  function handleTimerStart() {
    const s = parseInt(timerInput) || 0
    if (s > 0) {
      setTimerSeconds(s)
      setTimerRunning(true)
      setTimerInput('')
    }
  }

  function handleTimerStop() {
    setTimerRunning(false)
  }

  function handleTimerReset() {
    setTimerRunning(false)
    setTimerSeconds(0)
    setTimerInput('')
  }

  const days = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="app-container app-clock" style={{ background: '#1e1e1e', color: '#fff', padding: 16, alignItems: 'center' }}>
      <div className="app-toolbar" style={{ justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <button className={`app-toolbar-btn${tab === 'clock' ? ' active' : ''}`} onClick={() => setTab('clock')}>时钟</button>
        <button className={`app-toolbar-btn${tab === 'stopwatch' ? ' active' : ''}`} onClick={() => setTab('stopwatch')}>秒表</button>
        <button className={`app-toolbar-btn${tab === 'timer' ? ' active' : ''}`} onClick={() => setTab('timer')}>计时器</button>
      </div>

      {tab === 'clock' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AnalogClock date={date} />
          <div style={{ fontSize: 36, fontWeight: 300, marginTop: 16, fontFamily: 'monospace' }}>
            {date.toLocaleTimeString('zh-CN', { hour12: false })}
          </div>
          <div style={{ fontSize: 16, color: '#888', marginTop: 4 }}>
            {date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日 星期{days[date.getDay()]}
          </div>
        </div>
      )}

      {tab === 'stopwatch' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 300, fontFamily: 'monospace', marginBottom: 16 }}>
            {formatTime(stopwatchTime)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="app-toolbar-btn" onClick={handleStopwatchToggle}>
              {stopwatchRunning ? '⏸ 停止' : '▶ 开始'}
            </button>
            <button className="app-toolbar-btn" onClick={handleLap} disabled={!stopwatchRunning}>
              🏁 计次
            </button>
            <button className="app-toolbar-btn" onClick={handleStopwatchReset}>
              🔄 重置
            </button>
          </div>
          {stopwatchLaps.length > 0 && (
            <div style={{ maxHeight: 120, overflowY: 'auto', width: '100%', textAlign: 'left', fontSize: 13, fontFamily: 'monospace' }}>
              {stopwatchLaps.map((lap, i) => (
                <div key={i} style={{ padding: '2px 8px', borderBottom: '1px solid #333' }}>
                  #{i + 1} {formatTime(lap)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'timer' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 300, fontFamily: 'monospace', marginBottom: 16 }}>
            {formatTimer(timerSeconds)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input
              type="number"
              value={timerInput}
              onChange={(e) => setTimerInput(e.target.value)}
              placeholder="秒数"
              className="app-input"
              style={{ width: 80, textAlign: 'center' }}
              min="1"
              disabled={timerRunning}
            />
            {!timerRunning ? (
              <button className="app-toolbar-btn" onClick={handleTimerStart}>▶ 开始</button>
            ) : (
              <button className="app-toolbar-btn" onClick={handleTimerStop}>⏸ 暂停</button>
            )}
            <button className="app-toolbar-btn" onClick={handleTimerReset}>🔄 重置</button>
          </div>
        </div>
      )}
    </div>
  )
}