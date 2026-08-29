import { useState, useEffect, useRef, useCallback } from 'react'

interface HistoryRecord {
  id: number
  totalSeconds: number
  finishedAt: string
}

const PRESETS = [
  { label: '1分钟', seconds: 60 },
  { label: '5分钟', seconds: 300 },
  { label: '10分钟', seconds: 600 },
  { label: '15分钟', seconds: 900 },
  { label: '25分钟', seconds: 1500 },
  { label: '30分钟', seconds: 1800 },
]

const MAX_HISTORY = 10
const STORAGE_KEY = 'countdown_timer_history'
const RADIUS = 90
const STROKE_WIDTH = 8
const CIRCLE_LENGTH = 2 * Math.PI * RADIUS

function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(records: HistoryRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // 忽略存储错误
  }
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatShortTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}时`)
  if (m > 0) parts.push(`${m}分`)
  if (s > 0 || parts.length === 0) parts.push(`${s}秒`)
  return parts.join('')
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export default function CountdownTimer() {
  const [hours, setHours] = useState('00')
  const [minutes, setMinutes] = useState('05')
  const [seconds, setSeconds] = useState('00')
  const [totalTime, setTotalTime] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory)
  const [blinkOn, setBlinkOn] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const blinkRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (blinkRef.current) {
      clearInterval(blinkRef.current)
      blinkRef.current = null
    }
  }, [])

  // 倒计时到0后闪烁效果
  useEffect(() => {
    if (status === 'finished') {
      blinkRef.current = window.setInterval(() => {
        setBlinkOn((prev) => !prev)
      }, 500)
    } else {
      setBlinkOn(false)
    }
    return () => {
      if (blinkRef.current) {
        clearInterval(blinkRef.current)
        blinkRef.current = null
      }
    }
  }, [status])

  // 倒计时逻辑
  useEffect(() => {
    if (status === 'running' && remaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            // 倒计时结束
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setStatus('finished')
            // 发送系统通知
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('倒计时结束', {
                body: '设定的倒计时时间已到！',
              })
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, remaining > 0])

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const parseInput = (val: string): number => {
    const n = parseInt(val, 10)
    return isNaN(n) ? 0 : Math.max(0, Math.min(59, n))
  }

  const getTotalFromInputs = (): number => {
    return parseInput(hours) * 3600 + parseInput(minutes) * 60 + parseInput(seconds)
  }

  const handleStart = useCallback(() => {
    const total = getTotalFromInputs()
    if (total <= 0) return
    setTotalTime(total)
    setRemaining(total)
    setStatus('running')
  }, [hours, minutes, seconds])

  const handlePause = useCallback(() => {
    if (status === 'running') {
      clearTimers()
      setStatus('paused')
    } else if (status === 'paused') {
      setStatus('running')
    }
  }, [status, clearTimers])

  const handleReset = useCallback(() => {
    clearTimers()
    setRemaining(0)
    setTotalTime(0)
    setStatus('idle')
  }, [clearTimers])

  const handlePreset = useCallback((presetSeconds: number) => {
    clearTimers()
    const h = Math.floor(presetSeconds / 3600)
    const m = Math.floor((presetSeconds % 3600) / 60)
    const s = presetSeconds % 60
    setHours(h.toString().padStart(2, '0'))
    setMinutes(m.toString().padStart(2, '0'))
    setSeconds(s.toString().padStart(2, '0'))
    setTotalTime(presetSeconds)
    setRemaining(presetSeconds)
    setStatus('idle')
  }, [clearTimers])

  // 当倒计时结束时保存记录
  useEffect(() => {
    if (status === 'finished' && totalTime > 0) {
      const record: HistoryRecord = {
        id: Date.now(),
        totalSeconds: totalTime,
        finishedAt: new Date().toLocaleString('zh-CN'),
      }
      setHistory((prev) => {
        const next = [record, ...prev].slice(0, MAX_HISTORY)
        saveHistory(next)
        return next
      })
    }
  }, [status, totalTime])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const progress = totalTime > 0 ? remaining / totalTime : 1
  const dashOffset = CIRCLE_LENGTH * (1 - progress)

  const isFinished = status === 'finished'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'
  const isActive = isRunning || isPaused

  const inputStyle: React.CSSProperties = {
    width: 56,
    height: 48,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 700,
    border: '2px solid var(--color-primary, #4a9eff)',
    borderRadius: 10,
    background: 'var(--window-bg, #1e1e2e)',
    color: 'var(--text-primary, #e0e0e0)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const separatorStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--color-primary, #4a9eff)',
    lineHeight: '48px',
    userSelect: 'none',
  }

  return (
    <div
      style={{
        background: 'var(--window-bg, #1a1a2e)',
        color: 'var(--text-primary, #e0e0e0)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        gap: 20,
        overflowY: 'auto',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        .cd-input:focus {
          border-color: var(--accent, #6c5ce7) !important;
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.25);
        }
        .cd-input:hover {
          border-color: var(--accent, #6c5ce7);
        }
        .cd-preset-btn {
          padding: 6px 14px;
          border: 1.5px solid var(--color-primary, #4a9eff);
          border-radius: 8px;
          background: transparent;
          color: var(--color-primary, #4a9eff);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cd-preset-btn:hover {
          background: var(--color-primary, #4a9eff);
          color: #fff;
        }
        .cd-action-btn {
          padding: 10px 28px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cd-action-btn:active {
          transform: scale(0.96);
        }
        .cd-start {
          background: var(--accent, #6c5ce7);
          color: #fff;
        }
        .cd-start:hover {
          background: #5a4bd1;
        }
        .cd-start:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .cd-pause {
          background: #e17055;
          color: #fff;
        }
        .cd-pause:hover {
          background: #d35843;
        }
        .cd-reset {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary, #e0e0e0);
        }
        .cd-reset:hover {
          background: rgba(255,255,255,0.18);
        }
        .cd-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          font-size: 13px;
        }
        .cd-history-item:hover {
          background: rgba(255,255,255,0.08);
        }
        .cd-blink {
          animation: cd-blink-anim 0.5s step-start infinite;
        }
        @keyframes cd-blink-anim {
          0% { opacity: 1; }
          50% { opacity: 0.15; }
        }
      `}</style>

      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--accent, #6c5ce7)',
          letterSpacing: 1,
        }}
      >
        ⏱ 倒计时器
      </h2>

      {/* 圆形进度条 + 倒计时显示 */}
      <div
        style={{
          position: 'relative',
          width: 220,
          height: 220,
          flexShrink: 0,
        }}
      >
        <svg
          width={220}
          height={220}
          viewBox="0 0 220 220"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* 背景圆环 */}
          <circle
            cx={110}
            cy={110}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* 进度圆环 */}
          <circle
            cx={110}
            cy={110}
            r={RADIUS}
            fill="none"
            stroke={
              isFinished
                ? blinkOn
                  ? '#e17055'
                  : 'transparent'
                : isRunning
                  ? 'var(--accent, #6c5ce7)'
                  : isPaused
                    ? '#fdcb6e'
                    : 'var(--color-primary, #4a9eff)'
            }
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCLE_LENGTH}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
            }}
          />
        </svg>
        {/* 中心时间文本 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className={isFinished ? 'cd-blink' : ''}
            style={{
              fontSize: 38,
              fontWeight: 800,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              letterSpacing: 2,
              color: isFinished
                ? blinkOn
                  ? '#e17055'
                  : 'var(--text-primary, #e0e0e0)'
                : isPaused
                  ? '#fdcb6e'
                  : 'var(--text-primary, #e0e0e0)',
              transition: 'color 0.3s',
            }}
          >
            {isActive || isFinished
              ? formatTime(remaining)
              : formatTime(getTotalFromInputs())}
          </div>
          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {isFinished
              ? '时间到！'
              : isRunning
                ? '计时中...'
                : isPaused
                  ? '已暂停'
                  : '就绪'}
          </div>
        </div>
      </div>

      {/* 时间输入 */}
      {!isActive && !isFinished && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <input
            className="cd-input"
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => {
              const v = Math.min(23, Math.max(0, parseInt(e.target.value) || 0))
              setHours(v.toString().padStart(2, '0'))
            }}
            style={inputStyle}
          />
          <span style={separatorStyle}>:</span>
          <input
            className="cd-input"
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => {
              const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
              setMinutes(v.toString().padStart(2, '0'))
            }}
            style={inputStyle}
          />
          <span style={separatorStyle}>:</span>
          <input
            className="cd-input"
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => {
              const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
              setSeconds(v.toString().padStart(2, '0'))
            }}
            style={inputStyle}
          />
        </div>
      )}

      {/* 预设按钮 */}
      {!isActive && !isFinished && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            maxWidth: 380,
          }}
        >
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              className="cd-preset-btn"
              onClick={() => handlePreset(p.seconds)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: 12 }}>
        {(isIdle || isFinished) && (
          <button
            className="cd-action-btn cd-start"
            onClick={handleStart}
            disabled={getTotalFromInputs() <= 0}
          >
            ▶ 开始
          </button>
        )}
        {isRunning && (
          <>
            <button className="cd-action-btn cd-pause" onClick={handlePause}>
              ⏸ 暂停
            </button>
            <button className="cd-action-btn cd-reset" onClick={handleReset}>
              ↺ 重置
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button className="cd-action-btn cd-start" onClick={handlePause}>
              ▶ 继续
            </button>
            <button className="cd-action-btn cd-reset" onClick={handleReset}>
              ↺ 重置
            </button>
          </>
        )}
        {isFinished && (
          <>
            <button className="cd-action-btn cd-start" onClick={handleStart}>
              ▶ 再来一次
            </button>
            <button className="cd-action-btn cd-reset" onClick={handleReset}>
              ↺ 重置
            </button>
          </>
        )}
      </div>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              历史记录
            </span>
            <button
              onClick={clearHistory}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              清空
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map((record) => (
              <div key={record.id} className="cd-history-item">
                <span style={{ color: 'var(--accent, #6c5ce7)', fontWeight: 600 }}>
                  {formatShortTime(record.totalSeconds)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  {record.finishedAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
