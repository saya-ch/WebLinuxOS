import { useState, useEffect, useRef, useCallback } from 'react'

const TimerApp = () => {
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown')
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [inputMinutes, setInputMinutes] = useState('05')
  const [inputSeconds, setInputSeconds] = useState('00')
  const intervalRef = useRef<number | null>(null)

  // 倒计时模式
  const startCountdown = useCallback(() => {
    if (isRunning) return
    const totalSeconds = parseInt(inputMinutes) * 60 + parseInt(inputSeconds)
    if (totalSeconds <= 0) return
    setTime(totalSeconds)
    setIsRunning(true)
  }, [isRunning, inputMinutes, inputSeconds])

  // 秒表模式
  const toggleStopwatch = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      setIsRunning(true)
    }
  }, [isRunning])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTime(0)
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (mode === 'countdown') {
            if (prev <= 1) {
              setIsRunning(false)
              return 0
            }
            return prev - 1
          } else {
            return prev + 1
          }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, mode])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* 模式切换 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 4,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
        }}
      >
        {[
          { id: 'countdown', label: '⏱️ 倒计时' },
          { id: 'stopwatch', label: '⏲️ 秒表' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id as any)
              reset()
            }}
            style={{
              padding: '10px 20px',
              background: mode === m.id ? 'linear-gradient(145deg, #60a5fa, #3b82f6)' : 'transparent',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: mode === m.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 时间显示 */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          fontFamily: 'monospace',
          color: '#fff',
          letterSpacing: 4,
          textShadow: '0 4px 20px rgba(96, 165, 250, 0.4)',
        }}
      >
        {formatTime(time)}
      </div>

      {/* 倒计时输入 */}
      {mode === 'countdown' && !isRunning && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#9090a0', fontSize: 12, marginBottom: 4 }}>分</div>
            <input
              type="number"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(e.target.value.padStart(2, '0'))}
              style={{
                width: 80,
                padding: 12,
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
                background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                outline: 'none',
                fontFamily: 'monospace',
              }}
              min={0}
              max={59}
            />
          </div>
          <span style={{ fontSize: 28, color: '#9090a0', fontWeight: 700 }}>:</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#9090a0', fontSize: 12, marginBottom: 4 }}>秒</div>
            <input
              type="number"
              value={inputSeconds}
              onChange={(e) => setInputSeconds(e.target.value.padStart(2, '0'))}
              style={{
                width: 80,
                padding: 12,
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
                background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                outline: 'none',
                fontFamily: 'monospace',
              }}
              min={0}
              max={59}
            />
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: 12 }}>
        {mode === 'countdown' ? (
          <>
            <button
              onClick={startCountdown}
              disabled={isRunning}
              style={{
                padding: '14px 32px',
                background: isRunning
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(145deg, #4ade80, #22c55e)',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ▶️ 开始
            </button>
            <button
              onClick={reset}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🔄 重置
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleStopwatch}
              style={{
                padding: '14px 32px',
                background: isRunning
                  ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                  : 'linear-gradient(145deg, #4ade80, #22c55e)',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isRunning ? '⏸️ 暂停' : '▶️ 开始'}
            </button>
            <button
              onClick={reset}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🔄 重置
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default TimerApp
