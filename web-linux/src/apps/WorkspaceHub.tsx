import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Home,
  Terminal,
  FolderOpen,
  Code2,
  Calculator,
  Calendar,
  Cloud,
  Globe,
  Pencil,
  Palette,
  Zap,
  ListTodo,
  Music,
  Image,
  ChevronRight,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Sun,
  Sparkles,
  Coffee,
  BookOpen,
  Lightbulb,
  Layers,
  Search,
  Droplets,
  Wind,
  Plus,
  X,
  ArrowUpRight,
  MessageSquare,
  Shield,
  Download,
} from 'lucide-react'
import { useStore } from '../store'

interface WidgetData {
  time: string
  date: string
  systemStats: {
    cpu: number
    memory: number
    storage: number
    networkDown: number
    networkUp: number
  }
  quote: {
    text: string
    author: string
  }
  weather: {
    temperature: number
    weatherCode: number
    isDay: boolean
    humidity: number
    windSpeed: number
    city: string
  } | null
}

interface QuickNote {
  id: string
  content: string
  color: string
  createdAt: number
}

const quickApps = [
  { id: 'terminal', name: '终端', icon: Terminal, color: '#10b981', description: '命令行工具' },
  { id: 'files', name: '文件管理器', icon: FolderOpen, color: '#3b82f6', description: '浏览文件' },
  { id: 'code-editor', name: '代码编辑器', icon: Code2, color: '#8b5cf6', description: '编写代码' },
  { id: 'calculator', name: '计算器', icon: Calculator, color: '#f59e0b', description: '快速计算' },
  { id: 'calendar', name: '日历', icon: Calendar, color: '#ef4444', description: '日程管理' },
  { id: 'weather', name: '天气', icon: Cloud, color: '#06b6d4', description: '天气预报' },
  { id: 'notes', name: '笔记', icon: Pencil, color: '#ec4899', description: '记录想法' },
  { id: 'browser', name: '浏览器', icon: Globe, color: '#6366f1', description: '网页浏览' },
]

const productivityApps = [
  { id: 'todo-list', name: '待办事项', icon: ListTodo, color: '#14b8a6', desc: '管理任务' },
  { id: 'pomodoro', name: '番茄钟', icon: Coffee, color: '#f97316', desc: '专注工作' },
  { id: 'markdown-editor', name: 'Markdown', icon: BookOpen, color: '#22c55e', desc: '文档编辑' },
  { id: 'kanban-board', name: '看板', icon: Layers, color: '#a855f7', desc: '项目管理' },
]

const devTools = [
  { id: 'json-formatter', name: 'JSON 格式化', icon: Code2, color: '#06b6d4', desc: '美化JSON' },
  { id: 'base64-tools', name: 'Base64 工具', icon: Zap, color: '#eab308', desc: '编解码' },
  { id: 'regex-tester', name: '正则测试', icon: Search, color: '#f43f5e', desc: '调试正则' },
  { id: 'rest-client', name: 'REST 客户端', icon: Globe, color: '#8b5cf6', desc: 'API测试' },
]

const creativeTools = [
  { id: 'paint', name: '画图', icon: Palette, color: '#ec4899', desc: '创意绘画' },
  { id: 'color-picker', name: '取色器', icon: Palette, color: '#14b8a6', desc: '颜色选择' },
  { id: 'image-viewer', name: '图片查看', icon: Image, color: '#f97316', desc: '浏览图片' },
  { id: 'music-player', name: '音乐', icon: Music, color: '#8b5cf6', desc: '播放音乐' },
]

const systemApps = [
  { id: 'system-monitor', name: '系统监视器', icon: Activity, color: '#06b6d4', desc: '性能监控' },
  { id: 'settings', name: '系统设置', icon: Shield, color: '#6366f1', desc: '偏好设置' },
  { id: 'package-manager', name: '软件中心', icon: Download, color: '#10b981', desc: '应用管理' },
  { id: 'file-manager', name: '文件管理器', icon: FolderOpen, color: '#f59e0b', desc: '文件管理' },
]

const quotes = [
  { text: '代码是写给人看的，只是顺便让机器执行。', author: 'Donald Knuth' },
  { text: '简单是可靠的先决条件。', author: 'Edsger W. Dijkstra' },
  { text: '先让它工作，再让它正确，最后让它快。', author: 'Kent Beck' },
  { text: '好的代码是最好的文档。', author: 'Steve McConnell' },
  { text: '编程不是关于你知道什么，而是关于你能解决什么问题。', author: 'Chris Pine' },
  { text: '任何傻瓜都能写出计算机能理解的代码，好的程序员写出人类能理解的代码。', author: 'Martin Fowler' },
  { text: '软件工程最重要的单一要素是纪律。', author: 'Bjarne Stroustrup' },
  { text: '过早的优化是万恶之源。', author: 'Donald Knuth' },
  { text: ' Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { text: '程序是写给人读的，只是顺便能在机器上运行。', author: 'Harold Abelson' },
]

const noteColors = [
  '#fef3c7',
  '#dbeafe',
  '#dcfce7',
  '#fce7f3',
  '#e9d5ff',
  '#fed7aa',
]

function getWeatherEmoji(code: number, isDay: boolean): string {
  if (!isDay) {
    if (code === 0) return '🌙'
    if (code <= 2) return '🌤️'
    if (code === 3) return '☁️'
  }
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '❄️'
  if (code <= 99) return '⛈️'
  return '☁️'
}

function getWeatherText(code: number): string {
  if (code === 0) return '晴朗'
  if (code <= 2) return '局部多云'
  if (code === 3) return '阴天'
  if (code <= 48) return '有雾'
  if (code <= 57) return '毛毛雨'
  if (code <= 67) return '小雨'
  if (code <= 77) return '雪'
  if (code <= 82) return '阵雨'
  if (code <= 86) return '阵雪'
  if (code <= 99) return '雷暴'
  return '未知'
}

export default function WorkspaceHub() {
  const openApp = useStore((s) => s.openApp)
  const [activeTab, setActiveTab] = useState<'home' | 'work' | 'dev' | 'create' | 'system'>('home')
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [data, setData] = useState<WidgetData>({
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    systemStats: {
      cpu: 0,
      memory: 0,
      storage: 0,
      networkDown: 0,
      networkUp: 0,
    },
    quote: quotes[0],
    weather: null,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('workspace-hub-notes')
      if (saved) {
        setNotes(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('workspace-hub-notes', JSON.stringify(notes))
    } catch {
      // ignore
    }
  }, [notes])

  const fetchWeather = useCallback(async () => {
    try {
      const lat = 39.9042
      const lon = 116.4074
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Weather API error')
      
      const result = await response.json()
      const current = result.current
      
      setData(prev => ({
        ...prev,
        weather: {
          temperature: Math.round(current.temperature_2m),
          weatherCode: current.weather_code,
          isDay: current.is_day === 1,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          city: '北京',
        },
      }))
    } catch {
      // Fallback to mock data
      setData(prev => ({
        ...prev,
        weather: {
          temperature: 23,
          weatherCode: 0,
          isDay: true,
          humidity: 45,
          windSpeed: 12,
          city: '北京',
        },
      }))
    }
  }, [])

  useEffect(() => {
    fetchWeather()
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(weatherInterval)
  }, [fetchWeather])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setData(prev => {
        const cpuDelta = (Math.random() - 0.5) * 15
        const memDelta = (Math.random() - 0.5) * 8
        const newCpu = Math.min(95, Math.max(5, prev.systemStats.cpu + cpuDelta))
        const newMem = Math.min(90, Math.max(25, prev.systemStats.memory + memDelta))
        
        return {
          ...prev,
          time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          systemStats: {
            ...prev.systemStats,
            cpu: newCpu,
            memory: newMem,
            networkDown: Math.random() * 50 + 10,
            networkUp: Math.random() * 20 + 5,
          },
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const quoteIndex = Math.floor(Math.random() * quotes.length)
    setData(prev => ({ ...prev, quote: quotes[quoteIndex] }))

    try {
      const storageUsed = JSON.stringify(localStorage).length / 1024 / 1024
      const storageLimit = 5
      const storagePercent = Math.min(100, (storageUsed / storageLimit) * 100)
      setData(prev => ({
        ...prev,
        systemStats: { ...prev.systemStats, storage: storagePercent },
      }))
    } catch {
      // ignore
    }
  }, [])

  const addNote = useCallback(() => {
    const newNote: QuickNote = {
      id: Date.now().toString(),
      content: '',
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
      createdAt: Date.now(),
    }
    setNotes(prev => [newNote, ...prev])
  }, [])

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, content } : note
    ))
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id))
  }, [])

  const hour = new Date().getHours()
  const isMorning = hour >= 5 && hour < 12
  const isAfternoon = hour >= 12 && hour < 18
  const greeting = isMorning ? '早上好' : isAfternoon ? '下午好' : '晚上好'

  const grid4Style = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  } as const

  const grid2Style = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  } as const

  const cardBaseStyle = {
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
  } as const

  const appCardBaseStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }

  const listCardBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    textAlign: 'left' as const,
    width: '100%',
  }

  const StatBar = ({ label, value, icon: Icon, color, gradient }: { 
    label: string; value: number; icon: any; color: string; gradient: string 
  }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={14} style={{ color }} />
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{label}</span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>{value.toFixed(0)}%</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: '9999px',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            width: `${value}%`,
            background: gradient,
          }}
        />
      </div>
    </div>
  )

  const AppCard = ({ app, onClick }: { app: any; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={appCardBaseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
        e.currentTarget.style.boxShadow = `0 12px 40px ${app.color}20`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${app.color}25, ${app.color}45)`,
          boxShadow: `0 4px 20px ${app.color}25`,
          transition: 'transform 0.3s ease',
        }}
      >
        <app.icon size={26} style={{ color: app.color }} />
      </div>
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#e5e7eb', marginTop: '4px' }}>{app.name}</span>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>{app.description || app.desc}</span>
    </button>
  )

  const ListCard = ({ app, onClick }: { app: any; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={listCardBaseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.transform = 'scale(1.015)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${app.color}20, ${app.color}40)`,
        }}
      >
        <app.icon size={22} style={{ color: app.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#e5e7eb' }}>
          {app.name}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{app.desc || app.description}</div>
      </div>
      <ChevronRight size={18} style={{ color: '#4b5563', flexShrink: 0 }} />
    </button>
  )

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={grid4Style}>
              {quickApps.map(app => (
                <AppCard key={app.id} app={app} onClick={() => openApp(app.id)} />
              ))}
            </div>

            <div style={grid2Style}>
              <div style={{
                ...cardBaseStyle,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Lightbulb size={18} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>每日灵感</span>
                </div>
                <p style={{ color: '#e5e7eb', fontSize: '15px', lineHeight: 1.7, margin: '0 0 12px 0', fontStyle: 'italic' }}>
                  "{data.quote.text}"
                </p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>— {data.quote.author}</p>
              </div>

              <div style={{
                ...cardBaseStyle,
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(20, 184, 166, 0.1))',
                border: '1px solid rgba(6, 182, 212, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} style={{ color: '#06b6d4' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>系统状态</span>
                  </div>
                  <button
                    onClick={() => openApp('system-monitor')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    详情 <ArrowUpRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <StatBar 
                    label="CPU" 
                    value={data.systemStats.cpu} 
                    icon={Cpu} 
                    color="#06b6d4"
                    gradient={data.systemStats.cpu > 80 
                      ? 'linear-gradient(90deg, #ef4444, #f97316)' 
                      : 'linear-gradient(90deg, #06b6d4, #22c55e)'}
                  />
                  <StatBar 
                    label="内存" 
                    value={data.systemStats.memory} 
                    icon={HardDrive} 
                    color="#8b5cf6"
                    gradient="linear-gradient(90deg, #8b5cf6, #ec4899)"
                  />
                  <StatBar 
                    label="存储" 
                    value={data.systemStats.storage} 
                    icon={HardDrive} 
                    color="#f59e0b"
                    gradient="linear-gradient(90deg, #f59e0b, #f97316)"
                  />
                </div>
              </div>
            </div>

            {data.weather && (
              <div style={{
                ...cardBaseStyle,
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                cursor: 'pointer',
              }}
                onClick={() => openApp('weather')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '56px', lineHeight: 1 }}>
                      {getWeatherEmoji(data.weather.weatherCode, data.weather.isDay)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '42px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                          {data.weather.temperature}°
                        </span>
                        <span style={{ fontSize: '16px', color: '#9ca3af' }}>{getWeatherText(data.weather.weatherCode)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Droplets size={14} style={{ color: '#60a5fa' }} />
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{data.weather.humidity}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wind size={14} style={{ color: '#34d399' }} />
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{data.weather.windSpeed} km/h</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sun size={14} style={{ color: '#fbbf24' }} />
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{data.weather.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>实时天气</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>查看详情</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              ...cardBaseStyle,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>快捷便签</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>({notes.length})</span>
                </div>
                <button
                  onClick={addNote}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                  }}
                >
                  <Plus size={14} /> 新建
                </button>
              </div>
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                  <Lightbulb size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>还没有便签，点击上方按钮创建一个</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {notes.slice(0, 6).map(note => (
                    <div
                      key={note.id}
                      style={{
                        width: 'calc(33.33% - 8px)',
                        minWidth: '140px',
                        padding: '12px',
                        borderRadius: '10px',
                        background: note.color + '20',
                        border: `1px solid ${note.color}40`,
                        position: 'relative',
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'rgba(0,0,0,0.2)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                      >
                        <X size={12} />
                      </button>
                      <textarea
                        value={note.content}
                        onChange={(e) => updateNote(note.id, e.target.value)}
                        placeholder="写点什么..."
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          border: 'none',
                          background: 'transparent',
                          color: '#e5e7eb',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          resize: 'vertical',
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'work':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={grid2Style}>
              {productivityApps.map(app => (
                <ListCard key={app.id} app={app} onClick={() => openApp(app.id)} />
              ))}
            </div>
          </div>
        )

      case 'dev':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={grid2Style}>
              {devTools.map(app => (
                <ListCard key={app.id} app={app} onClick={() => openApp(app.id)} />
              ))}
            </div>
          </div>
        )

      case 'create':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={grid2Style}>
              {creativeTools.map(app => (
                <ListCard key={app.id} app={app} onClick={() => openApp(app.id)} />
              ))}
            </div>
          </div>
        )

      case 'system':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={grid2Style}>
              {systemApps.map(app => (
                <ListCard key={app.id} app={app} onClick={() => openApp(app.id)} />
              ))}
            </div>
          </div>
        )
    }
  }, [activeTab, data, notes, openApp, addNote, updateNote, deleteNote])

  const tabs = [
    { id: 'home' as const, name: '首页', icon: Home },
    { id: 'work' as const, name: '工作', icon: Briefcase },
    { id: 'dev' as const, name: '开发', icon: Code2 },
    { id: 'create' as const, name: '创作', icon: Sparkles },
    { id: 'system' as const, name: '系统', icon: Cpu },
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f28 50%, #0a0a1a 100%)',
      color: '#fff',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '28px 36px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)',
          opacity: 0.6,
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                background: 'linear-gradient(135deg, #fff 0%, #a78bfa 40%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {greeting}
              </h1>
              <Sparkles size={18} style={{ color: '#fbbf24' }} />
            </div>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
              {data.date} · {data.time}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '10px 18px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wifi size={15} style={{ color: '#22c55e' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>网络</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={10} style={{ color: '#60a5fa' }} />
                  <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 500 }}>{data.systemStats.networkDown.toFixed(0)} MB/s</span>
                </div>
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Battery size={15} style={{ color: '#22c55e' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>状态</span>
                <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 500 }}>运行良好</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(6, 182, 212, 0.25))'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#6b7280',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#d1d5db'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6b7280'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <tab.icon size={15} />
              {tab.name}
              {activeTab === tab.id && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '2px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: '20px 36px 32px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          animation: 'fadeIn 0.4s ease',
        }}>
          {tabContent}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  )
}

function Briefcase({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
