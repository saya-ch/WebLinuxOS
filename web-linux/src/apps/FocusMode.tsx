import { useState, useEffect } from 'react'

export default function FocusMode() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work')

  useEffect(() => {
    let interval: number | null = null
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      alert('时间到！')
    }
    return () => {
      if (interval) {
        window.clearInterval(interval)
      }
    }
  }, [isRunning, timeLeft])

  const setTime = (minutes: number, newMode: 'work' | 'short' | 'long') => {
    setMode(newMode)
    setTimeLeft(minutes * 60)
    setIsRunning(false)
  }

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return '#f38ba8'
      case 'short':
        return '#a6e3a1'
      case 'long':
        return '#74c7ec'
    }
  }

  const getModeName = () => {
    switch (mode) {
      case 'work':
        return '专注'
      case 'short':
        return '短休息'
      case 'long':
        return '长休息'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>🎯 专注模式</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>使用番茄工作法提高效率</p>
      </div>

      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setTime(25, 'work')} style={{ padding: '10px 20px', background: mode === 'work' ? '#f38ba8' : '#313244', border: 'none', borderRadius: '10px', color: mode === 'work' ? '#1e1e2e' : '#cdd6f4', cursor: 'pointer', fontWeight: 600 }}>
            专注 25m
          </button>
          <button onClick={() => setTime(5, 'short')} style={{ padding: '10px 20px', background: mode === 'short' ? '#a6e3a1' : '#313244', border: 'none', borderRadius: '10px', color: mode === 'short' ? '#1e1e2e' : '#cdd6f4', cursor: 'pointer', fontWeight: 600 }}>
            休息 5m
          </button>
          <button onClick={() => setTime(15, 'long')} style={{ padding: '10px 20px', background: mode === 'long' ? '#74c7ec' : '#313244', border: 'none', borderRadius: '10px', color: mode === 'long' ? '#1e1e2e' : '#cdd6f4', cursor: 'pointer', fontWeight: 600 }}>
            长休 15m
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#a6adc8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>{getModeName()}</div>
          <div style={{ fontSize: '80px', fontWeight: 700, color: getModeColor(), fontFamily: 'monospace' }}>{formatTime()}</div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ padding: '16px 48px', background: isRunning ? '#f9e2af' : 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '14px', color: '#1e1e2e', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}>
            {isRunning ? '⏸️ 暂停' : '▶️ 开始'}
          </button>
          <button onClick={() => { setIsRunning(false); setTimeLeft(25 * 60) }} style={{ padding: '16px 32px', background: '#313244', border: 'none', borderRadius: '14px', color: '#cdd6f4', cursor: 'pointer', fontSize: '16px' }}>
            🔄 重置
          </button>
        </div>

        <div style={{ background: '#313244', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#a6adc8' }}>💡 提示</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
            <li>专注时保持环境安静</li>
            <li>避免检查手机和社交媒体</li>
            <li>休息时起身活动一下</li>
            <li>保持规律的工作节奏</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
