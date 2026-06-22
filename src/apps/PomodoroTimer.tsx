import { useState, useEffect, useRef, useCallback } from 'react'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const MODE_CONFIG = {
  work: { duration: 25 * 60, label: '专注', color: '#e74c3c', icon: '🎯' },
  shortBreak: { duration: 5 * 60, label: '短休息', color: '#27ae60', icon: '☕' },
  longBreak: { duration: 15 * 60, label: '长休息', color: '#3498db', icon: '🌴' },
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [totalFocusTime, setTotalFocusTime] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((MODE_CONFIG[mode].duration - timeLeft) / MODE_CONFIG[mode].duration) * 100

  const playSound = useCallback(() => {
    // Create audio context for notification
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.2)
      
      // Play second beep
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.connect(gain2)
        gain2.connect(audioCtx.destination)
        osc2.frequency.value = 1000
        osc2.type = 'sine'
        gain2.gain.value = 0.3
        osc2.start()
        osc2.stop(audioCtx.currentTime + 0.2)
      }, 250)
    } catch (e) {
      console.log('Audio not available')
    }
  }, [])

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode)
    setTimeLeft(MODE_CONFIG[newMode].duration)
    setIsRunning(false)
  }, [])

  const completeSession = useCallback(() => {
    playSound()
    setIsRunning(false)
    
    if (mode === 'work') {
      setSessions(prev => prev + 1)
      setTotalFocusTime(prev => prev + MODE_CONFIG.work.duration)
      
      // After 4 work sessions, take a long break
      const newSessions = sessions + 1
      if (newSessions % 4 === 0) {
        switchMode('longBreak')
      } else {
        switchMode('shortBreak')
      }
    } else {
      switchMode('work')
    }
  }, [mode, sessions, playSound, switchMode])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      completeSession()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, completeSession])

  const toggleTimer = () => {
    setIsRunning(prev => !prev)
  }

  const resetTimer = () => {
    setTimeLeft(MODE_CONFIG[mode].duration)
    setIsRunning(false)
  }

  const skipSession = () => {
    completeSession()
  }

  return (
    <div className="app-container" style={{ 
      background: `linear-gradient(135deg, #1a1a2e 0%, ${MODE_CONFIG[mode].color}20 50%, #1a1a2e 100%)`,
      color: '#fff', 
      padding: 20, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      height: '100%'
    }}>
      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: '8px 16px',
              background: mode === m ? MODE_CONFIG[m].color : '#2d2d2d',
              border: 'none',
              borderRadius: 20,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {MODE_CONFIG[m].icon} {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div style={{ 
        position: 'relative',
        width: 200,
        height: 200,
        marginBottom: 24,
      }}>
        {/* Progress ring */}
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#333"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={MODE_CONFIG[mode].color}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        
        {/* Time text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, fontWeight: 200, fontFamily: 'monospace' }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>
            {MODE_CONFIG[mode].icon} {MODE_CONFIG[mode].label}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={toggleTimer}
          style={{
            width: 60,
            height: 60,
            background: isRunning ? '#e74c3c' : '#27ae60',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            fontSize: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
        <button
          onClick={resetTimer}
          style={{
            width: 50,
            height: 50,
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: '50%',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          ↺
        </button>
        <button
          onClick={skipSession}
          style={{
            width: 50,
            height: 50,
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: '50%',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          ⏭
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        marginBottom: 16,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{sessions}</div>
          <div style={{ fontSize: 12, color: '#888' }}>完成次数</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {Math.floor(totalFocusTime / 60)}分
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>专注时长</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {sessions % 4 === 0 && sessions > 0 ? 4 : sessions % 4}/4
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>当前周期</div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ 
        padding: 12, 
        background: '#2d2d2d', 
        borderRadius: 8, 
        fontSize: 12, 
        color: '#888',
        textAlign: 'center',
      }}>
        {mode === 'work' 
          ? '专注工作，避免分心。每完成4个番茄钟后休息15分钟。'
          : '休息时间！站起来活动一下，喝杯水，放松眼睛。'
        }
      </div>
    </div>
  )
}