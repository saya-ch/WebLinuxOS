import { useState, useEffect, useCallback } from 'react'
import {
  Wind, Droplets, Thermometer,
  Cpu, HardDrive, Wifi,
  Plus, X, Check, ChevronRight,
  FileText, Terminal, Code, Calculator, Image,
  Globe, Activity, Zap
} from 'lucide-react'

interface WeatherData {
  city: string
  temperature: number
  apparentTemp: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
}

interface QuickNote {
  id: string
  content: string
  timestamp: number
  color: string
}

const weatherEmojis: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

const weatherDescriptions: Record<number, string> = {
  0: '晴朗', 1: '晴间多云', 2: '局部多云', 3: '阴天',
  45: '雾', 48: '雾凇', 51: '毛毛雨', 53: '毛毛雨', 55: '密集毛毛雨',
  56: '冻毛毛雨', 57: '冻毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  66: '冻雨', 67: '冻雨', 71: '小雪', 73: '中雪', 75: '大雪',
  77: '雪粒', 80: '阵雨', 81: '中阵雨', 82: '强阵雨',
  85: '阵雪', 86: '强阵雪', 95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
}

const noteColors = [
  'bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100',
]

const quickApps = [
  { id: 'terminal', name: '终端', icon: <Terminal size={20} /> },
  { id: 'files', name: '文件', icon: <FileText size={20} /> },
  { id: 'code-editor', name: '代码', icon: <Code size={20} /> },
  { id: 'calculator', name: '计算器', icon: <Calculator size={20} /> },
  { id: 'image-viewer', name: '图片', icon: <Image size={20} /> },
  { id: 'browser', name: '浏览器', icon: <Globe size={20} /> },
]

export default function SmartOverview() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 78,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('smart-overview-notes')
    if (saved) {
      try {
        setQuickNotes(JSON.parse(saved))
      } catch {
        setQuickNotes([])
      }
    }
  }, [])

  const saveNotes = useCallback((notes: QuickNote[]) => {
    setQuickNotes(notes)
    localStorage.setItem('smart-overview-notes', JSON.stringify(notes))
  }, [])

  const addNote = useCallback(() => {
    if (!newNote.trim()) return
    const note: QuickNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      timestamp: Date.now(),
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
    }
    saveNotes([note, ...quickNotes])
    setNewNote('')
    setShowNoteInput(false)
  }, [newNote, quickNotes, saveNotes])

  const deleteNote = useCallback((id: string) => {
    saveNotes(quickNotes.filter(n => n.id !== id))
  }, [quickNotes, saveNotes])

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto',
          { mode: 'cors' }
        )
        if (response.ok) {
          const data = await response.json()
          const current = data.current
          setWeather({
            city: '北京',
            temperature: current.temperature_2m,
            apparentTemp: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            weatherCode: current.weather_code,
            description: weatherDescriptions[current.weather_code] || '未知',
          })
        }
      } catch {
        // 静默失败
      }
    }
    fetchWeather()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 30) + 30,
        memory: Math.floor(Math.random() * 20) + 50,
        disk: 38,
        network: Math.floor(Math.random() * 40) + 50,
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '24px',
      background: 'var(--window-bg)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'var(--text-primary)',
            }}>智能概览</h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}>{formatDate(currentTime)}</p>
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 200,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--color-primary)',
            lineHeight: 1,
          }}>
            {formatTime(currentTime)}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                  {weather?.city || '加载中...'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {weather?.description || '获取天气中...'}
                </div>
              </div>
              <div style={{ fontSize: '48px' }}>
                {weather ? (weatherEmojis[weather.weatherCode] || '🌤️') : '⏳'}
              </div>
            </div>
            <div style={{ fontSize: '48px', fontWeight: 300, marginBottom: '12px' }}>
              {weather ? `${weather.temperature}°C` : '--'}
            </div>
            {weather && (
              <div style={{
                display: 'flex',
                gap: '16px',
                fontSize: '12px',
                opacity: 0.9,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Thermometer size={14} /> 体感 {weather.apparentTemp}°C
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={14} /> {weather.humidity}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={14} /> {weather.windSpeed} km/h
                </span>
              </div>
            )}
          </div>

          <div style={{
            background: 'var(--sidebar-bg, var(--window-bg))',
            border: '1px solid var(--window-border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Activity size={18} style={{ color: 'var(--color-primary)' }} />
              系统状态
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'CPU', value: systemStats.cpu, icon: <Cpu size={16} />, color: '#60a5fa' },
                { label: '内存', value: systemStats.memory, icon: <Zap size={16} />, color: '#4ade80' },
                { label: '存储', value: systemStats.disk, icon: <HardDrive size={16} />, color: '#fbbf24' },
                { label: '网络', value: systemStats.network, icon: <Wifi size={16} />, color: '#c084fc' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                      {stat.label}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}>{stat.value}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'var(--input-bg)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${stat.value}%`,
                        background: stat.color,
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--sidebar-bg, var(--window-bg))',
            border: '1px solid var(--window-border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                快捷便签
              </h3>
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} /> 新建
              </button>
            </div>

            {showNoteInput && (
              <div style={{ marginBottom: '12px' }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="输入便签内容..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    height: '60px',
                    marginBottom: '8px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      addNote()
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={addNote}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    添加
                  </button>
                  <button
                    onClick={() => { setShowNoteInput(false); setNewNote('') }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--window-border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}>
              {quickNotes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                }}>
                  暂无便签，点击上方按钮添加
                </div>
              ) : (
                quickNotes.slice(0, 5).map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      position: 'relative',
                      border: '1px solid var(--window-border)',
                    }}
                  >
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        padding: '2px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                    >
                      <X size={14} />
                    </button>
                    {note.content}
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      marginTop: '6px',
                    }}>
                      {new Date(note.timestamp).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--sidebar-bg, var(--window-bg))',
          border: '1px solid var(--window-border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Zap size={18} style={{ color: 'var(--color-primary)' }} />
            快速启动
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '12px',
          }}>
            {quickApps.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  const event = new CustomEvent('open-app', { detail: app.id })
                  window.dispatchEvent(event)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--window-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}>
                  {app.icon}
                </div>
                <span style={{ fontSize: '12px' }}>{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            background: 'var(--sidebar-bg, var(--window-bg))',
            border: '1px solid var(--window-border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}>快捷提示</h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight size={14} style={{ color: 'var(--color-primary)' }} />
                按 Ctrl+空格 打开命令面板
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight size={14} style={{ color: 'var(--color-primary)' }} />
                右键桌面打开上下文菜单
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight size={14} style={{ color: 'var(--color-primary)' }} />
                拖动窗口标题栏移动窗口
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight size={14} style={{ color: 'var(--color-primary)' }} />
                双击标题栏最大化/还原
              </li>
            </ul>
          </div>

          <div style={{
            background: 'var(--sidebar-bg, var(--window-bg))',
            border: '1px solid var(--window-border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}>今日待办</h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
            }}>
              {[
                { text: '探索 WebLinuxOS 功能', done: true },
                { text: '尝试终端命令', done: false },
                { text: '自定义桌面壁纸', done: false },
                { text: '使用开发者工具箱', done: false },
              ].map((task, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: task.done ? 'var(--color-primary)' : 'var(--window-border)',
                    background: task.done ? 'var(--color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    {task.done && <Check size={10} />}
                  </div>
                  {task.text}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--sidebar-bg, var(--window-bg))',
            border: '1px solid var(--window-border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}>关于系统</h4>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>系统版本</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>v12.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>应用数量</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>200+</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>内核</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>WebKernel</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>桌面环境</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>WebDE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
