import { useState, useEffect, useCallback, useRef } from 'react'

export default function FocusMode() {
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25分钟
  const [isRunning, setIsRunning] = useState(false)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean }[]>([])
  const [newTask, setNewTask] = useState('')
  const [ambientSound, setAmbientSound] = useState<string | null>(null)
  const [soundVolume, setSoundVolume] = useState(50)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const config = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  }

  const ambientSounds = [
    { name: 'Rain', id: 'rain', icon: '🌧️' },
    { name: 'Forest', id: 'forest', icon: '🌲' },
    { name: 'Café', id: 'cafe', icon: '☕' },
    { name: 'Wave', id: 'wave', icon: '🌊' },
    { name: 'White Noise', id: 'whitenoise', icon: '📻' },
    { name: 'None', id: null, icon: '🔇' }
  ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const startTimer = useCallback(() => {
    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRunning(false)
    } else {
      setIsRunning(true)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }, [isRunning])

  const handleTimerComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    
    if (mode === 'pomodoro') {
      const newCycles = cyclesCompleted + 1
      setCyclesCompleted(newCycles)
      if (newCycles % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(config.longBreak)
      } else {
        setMode('shortBreak')
        setTimeLeft(config.shortBreak)
      }
    } else {
      setMode('pomodoro')
      setTimeLeft(config.pomodoro)
    }
    
    // 播放完成提示音
    if (audioRef.current) {
      audioRef.current.play()
    }
  }, [mode, cyclesCompleted])

  const switchMode = useCallback((newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setMode(newMode)
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(config[newMode])
  }, [])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(config[mode])
  }, [mode])

  const addTask = useCallback(() => {
    if (newTask.trim()) {
      setTasks(prev => [...prev, {
        id: Date.now(),
        text: newTask.trim(),
        completed: false
      }])
      setNewTask('')
    }
  }, [newTask])

  const toggleTask = useCallback((id: number) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }, [])

  const deleteTask = useCallback((id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const getModeColor = () => {
    switch (mode) {
      case 'pomodoro': return '#ef4444'
      case 'shortBreak': return '#10b981'
      case 'longBreak': return '#3b82f6'
    }
  }

  const getModeName = () => {
    switch (mode) {
      case 'pomodoro': return '专注时间'
      case 'shortBreak': return '短休息'
      case 'longBreak': return '长休息'
    }
  }

  const progress = ((config[mode] - timeLeft) / config[mode]) * 100

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      color: '#fff',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🎯 专注模式</h2>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '13px',
          color: '#888'
        }}>
          已完成: {cyclesCompleted} 个番茄钟
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* 左侧：计时器 */}
        <div style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* 模式选择 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '40px',
            background: 'rgba(255,255,255,0.05)',
            padding: '6px',
            borderRadius: '12px'
          }}>
            {[
              { id: 'pomodoro', label: '专注', icon: '🍅' },
              { id: 'shortBreak', label: '短休息', icon: '☕' },
              { id: 'longBreak', label: '长休息', icon: '😌' }
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => switchMode(id as any)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: mode === id ? getModeColor() : 'transparent',
                  color: mode === id ? '#fff' : '#888',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* 计时器显示 */}
          <div style={{
            position: 'relative',
            width: '280px',
            height: '280px',
            marginBottom: '40px'
          }}>
            <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke={getModeColor()}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: '56px',
                fontWeight: 300,
                letterSpacing: '2px',
                fontFamily: 'monospace'
              }}>
                {formatTime(timeLeft)}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#888',
                marginTop: '8px'
              }}>
                {getModeName()}
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px'
          }}>
            <button
              onClick={startTimer}
              style={{
                padding: '14px 48px',
                border: 'none',
                borderRadius: '50px',
                background: getModeColor(),
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 4px 20px ${getModeColor()}50`
              }}
            >
              {isRunning ? '⏸️ 暂停' : '▶️ 开始'}
            </button>
            <button
              onClick={resetTimer}
              style={{
                padding: '14px 24px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '50px',
                background: 'transparent',
                color: '#888',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔄 重置
            </button>
          </div>

          {/* 环境声音 */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            padding: '20px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#888',
              marginBottom: '12px',
              fontWeight: 500
            }}>
              🎵 环境音效
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}>
              {ambientSounds.map(sound => (
                <button
                  key={sound.id || 'none'}
                  onClick={() => setAmbientSound(sound.id)}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: ambientSound === sound.id ? getModeColor() : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  {sound.icon} {sound.name}
                </button>
              ))}
            </div>
            {ambientSound && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '12px', color: '#888' }}>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: '4px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    appearance: 'none'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#888' }}>{soundVolume}%</span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：任务列表 */}
        <div style={{
          width: '360px',
          background: 'rgba(255,255,255,0.03)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600 }}>
            📝 今日任务
          </h3>
          
          {/* 添加任务 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="添加任务..."
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={addTask}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                background: getModeColor(),
                color: '#fff',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              +
            </button>
          </div>

          {/* 任务列表 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {tasks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px 20px',
                fontSize: '14px'
              }}>
                暂无任务，添加一些任务开始吧！
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `2px solid ${task.completed ? getModeColor() : '#666'}`,
                      background: task.completed ? getModeColor() : 'transparent',
                      color: task.completed ? '#fff' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {task.completed && '✓'}
                  </button>
                  <span style={{
                    flex: 1,
                    fontSize: '14px',
                    color: task.completed ? '#666' : '#fff',
                    textDecoration: task.completed ? 'line-through' : 'none'
                  }}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      background: 'transparent',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
