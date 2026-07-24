import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Terminal, Folder, Globe, Calculator, Clock, CloudRain,
  Code, FileText, Palette, Wrench, Search, Settings,
  Zap, BarChart3, Activity, Shield, Music, Image,
  Hash, ArrowUpRight, Sparkles, Layers, Cpu, Database,
  Wifi, Star, Bookmark, Target, TrendingUp, Users,
  Play, Pause, RefreshCw, Monitor,
} from 'lucide-react'
import { useStore } from '../store'

const CATEGORIES = [
  { id: 'essentials', name: '常用工具', icon: <Zap size={18} /> },
  { id: 'productivity', name: '生产力', icon: <Target size={18} /> },
  { id: 'development', name: '开发工具', icon: <Code size={18} /> },
  { id: 'system', name: '系统监控', icon: <Activity size={18} /> },
  { id: 'media', name: '媒体娱乐', icon: <Music size={18} /> },
  { id: 'internet', name: '网络服务', icon: <Globe size={18} /> },
]

const QUICK_TOOLS = [
  { id: 'terminal', name: '终端', icon: <Terminal size={20} />, appId: 'terminal', color: 'from-green-500 to-emerald-600' },
  { id: 'files', name: '文件', icon: <Folder size={20} />, appId: 'files', color: 'from-blue-500 to-cyan-600' },
  { id: 'browser', name: '浏览器', icon: <Globe size={20} />, appId: 'browser', color: 'from-purple-500 to-violet-600' },
  { id: 'calculator', name: '计算器', icon: <Calculator size={20} />, appId: 'calculator', color: 'from-orange-500 to-amber-600' },
  { id: 'text-editor', name: '文本', icon: <FileText size={20} />, appId: 'text-editor', color: 'from-pink-500 to-rose-600' },
  { id: 'code-editor', name: '代码', icon: <Code size={20} />, appId: 'code-editor', color: 'from-indigo-500 to-blue-600' },
  { id: 'weather', name: '天气', icon: <CloudRain size={20} />, appId: 'weather', color: 'from-sky-500 to-blue-600' },
  { id: 'settings', name: '设置', icon: <Settings size={20} />, appId: 'settings', color: 'from-gray-500 to-slate-600' },
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

function formatDate(): string {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekday = weekdays[now.getDay()]
  return `${month}月${day}日 ${weekday}`
}

function getSystemStats() {
  const memory = (performance as any).memory
    ? Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100)
    : Math.round(Math.random() * 30 + 20)
  const cpu = Math.round(Math.random() * 20 + 10)
  const network = navigator.onLine ? 100 : 0
  const storage = Math.round((Math.random() * 30 + 15))

  return { memory, cpu, network, storage }
}

const MOTIVATIONAL_QUOTES = [
  '每一行代码都是通往未来的阶梯',
  '今天的努力，是明天的底气',
  '保持好奇心，世界因你而不同',
  '专注当下，未来可期',
  '代码改变世界，你改变代码',
  '每一次调试，都是成长的机会',
  '简单的事情重复做，重复的事情用心做',
  '优秀是一种习惯，不是一次行动',
]

export default function SmartWorkbench() {
  const openApp = useStore((s) => s.openApp)
  const theme = useStore((s) => s.theme)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState(getSystemStats())
  const [activeCategory, setActiveCategory] = useState('essentials')
  const [searchQuery, setSearchQuery] = useState('')
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length))
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [isFocusRunning, setIsFocusRunning] = useState(false)
  const [focusSessions, setFocusSessions] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setStats(getSystemStats()), 3000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isFocusRunning) return
    const timer = setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev === 0) {
          if (focusMinutes === 0) {
            setIsFocusRunning(false)
            setFocusSessions((s) => s + 1)
            return 0
          }
          setFocusMinutes((m) => m - 1)
          return 59
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isFocusRunning, focusMinutes])

  const timeStr = useMemo(() => {
    const h = currentTime.getHours().toString().padStart(2, '0')
    const m = currentTime.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }, [currentTime])

  const handleOpenApp = useCallback((appId: string) => {
    openApp(appId)
  }, [openApp])

  const toggleFocusTimer = useCallback(() => {
    if (!isFocusRunning && focusMinutes === 0 && focusSeconds === 0) {
      setFocusMinutes(25)
    }
    setIsFocusRunning((prev) => !prev)
  }, [isFocusRunning, focusMinutes, focusSeconds])

  const resetFocusTimer = useCallback(() => {
    setIsFocusRunning(false)
    setFocusMinutes(25)
    setFocusSeconds(0)
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      background: theme === 'light'
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
        : 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0d0d1a 100%)',
      padding: '24px',
      color: theme === 'light' ? '#0f172a' : '#f1f5f9',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              opacity: 0.6,
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Sparkles size={16} style={{ opacity: 0.8 }} />
              <span>{getGreeting()}，欢迎回来</span>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '6px',
              background: theme === 'light'
                ? 'linear-gradient(135deg, #1e293b 0%, #475569 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              智能工作台
            </h1>
            <p style={{ fontSize: '13px', opacity: 0.5 }}>
              {formatDate()} · {MOTIVATIONAL_QUOTES[quoteIndex]}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 200,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {timeStr}
            </div>
            <div style={{
              fontSize: '12px',
              opacity: 0.5,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '6px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: navigator.onLine ? '#10b981' : '#ef4444',
                boxShadow: navigator.onLine ? '0 0 8px #10b981' : 'none',
              }} />
              <span>{navigator.onLine ? '已连接' : '离线'}</span>
            </div>
          </div>
        </div>

        <div style={{
          position: 'relative',
          marginBottom: '24px',
        }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.4,
          }} />
          <input
            type="text"
            placeholder="搜索应用、命令、文件… (按 Ctrl+K 全局搜索)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px 14px 52px',
              fontSize: '14px',
              borderRadius: '14px',
              border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              background: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.04)',
              color: 'inherit',
              outline: 'none',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme === 'light' ? 'rgba(124, 108, 240, 0.5)' : 'rgba(155, 138, 240, 0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 108, 240, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}>
          {QUICK_TOOLS.map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => handleOpenApp(tool.appId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '20px 12px',
                borderRadius: '16px',
                border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                background: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.03)',
                color: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                animation: `toolAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${tool.color.includes('from') ? '' : '#7c6cf0'} )`,
                backgroundImage: tool.color.startsWith('from')
                  ? `linear-gradient(135deg, ${tool.color.replace('from-', '').replace(' to-', ', ')})`
                  : tool.color,
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {tool.icon}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{tool.name}</span>
            </button>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
        }}>
          <div style={{
            padding: '20px',
            borderRadius: '18px',
            border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
            background: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <BarChart3 size={18} style={{ opacity: 0.7 }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>系统状态</h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              {[
                { label: 'CPU 使用率', value: stats.cpu, icon: <Cpu size={16} />, color: '#7c6cf0', unit: '%' },
                { label: '内存占用', value: stats.memory, icon: <Database size={16} />, color: '#00d6c1', unit: '%' },
                { label: '网络状态', value: stats.network, icon: <Wifi size={16} />, color: '#10b981', unit: '%' },
                { label: '存储空间', value: stats.storage, icon: <Layers size={16} />, color: '#f59e0b', unit: '%' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      opacity: 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{ color: item.color }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {item.value}<span style={{ fontSize: '12px', opacity: 0.5 }}>{item.unit}</span>
                    </span>
                  </div>
                  <div style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${item.value}%`,
                      height: '100%',
                      borderRadius: '2px',
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: '20px',
            borderRadius: '18px',
            border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
            background: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <Target size={18} style={{ opacity: 0.7 }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>专注计时器</h3>
            </div>

            <div style={{
              fontSize: '42px',
              fontWeight: 200,
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              background: theme === 'light'
                ? 'linear-gradient(135deg, #7c6cf0 0%, #00d6c1 100%)'
                : 'linear-gradient(135deg, #9b8af0 0%, #00d6c1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {focusMinutes.toString().padStart(2, '0')}:{focusSeconds.toString().padStart(2, '0')}
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <button
                onClick={toggleFocusTimer}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isFocusRunning
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                  color: isFocusRunning ? '#ef4444' : '#10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                {isFocusRunning ? <Pause size={14} /> : <Play size={14} />}
                {isFocusRunning ? '暂停' : '开始'}
              </button>
              <button
                onClick={resetFocusTimer}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div style={{
              fontSize: '11px',
              textAlign: 'center',
              opacity: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}>
              <Star size={12} style={{ opacity: 0.6 }} />
              今日已完成 {focusSessions} 个专注时段
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
          }}>
            <TrendingUp size={18} style={{ opacity: 0.7 }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>快捷分类</h3>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${activeCategory === cat.id
                    ? 'transparent'
                    : theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
                    }`,
                  background: activeCategory === cat.id
                    ? 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)'
                    : theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.03)',
                  color: activeCategory === cat.id ? 'white' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
          }}>
            {getCategoryApps(activeCategory).map((app, index) => (
              <button
                key={app.id}
                onClick={() => handleOpenApp(app.appId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                  background: theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.02)',
                  color: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  animation: `appAppear 0.3s ease ${index * 0.03}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.background = theme === 'light' ? 'rgba(124, 108, 240, 0.08)' : 'rgba(155, 138, 240, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.background = theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                  opacity: 0.9,
                }}>
                  {app.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{app.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.description}
                  </div>
                </div>
                <ArrowUpRight size={14} style={{ opacity: 0.3 }} />
              </button>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes toolAppear {
            from { opacity: 0; transform: translateY(16px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes appAppear {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  )
}

function getCategoryApps(category: string): { id: string; name: string; icon: React.ReactNode; description: string; appId: string }[] {
  const all = {
    essentials: [
      { id: 'terminal', name: '终端', icon: <Terminal size={16} />, description: '命令行工具，80+ 命令', appId: 'terminal' },
      { id: 'files', name: '文件管理器', icon: <Folder size={16} />, description: '浏览和管理文件', appId: 'files' },
      { id: 'notepad', name: '记事本', icon: <FileText size={16} />, description: '快速记录文本', appId: 'notepad' },
      { id: 'calculator', name: '计算器', icon: <Calculator size={16} />, description: '科学计算工具', appId: 'calculator' },
      { id: 'clock', name: '时钟', icon: <Clock size={16} />, description: '世界时钟与闹钟', appId: 'clock' },
      { id: 'weather', name: '天气', icon: <CloudRain size={16} />, description: '实时天气预报', appId: 'weather' },
    ],
    productivity: [
      { id: 'notes', name: '笔记', icon: <FileText size={16} />, description: '富文本笔记应用', appId: 'notes' },
      { id: 'todo', name: '待办事项', icon: <Hash size={16} />, description: '任务管理工具', appId: 'todo' },
      { id: 'calendar', name: '日历', icon: <Clock size={16} />, description: '日程安排管理', appId: 'calendar' },
      { id: 'pomodoro', name: '番茄钟', icon: <Target size={16} />, description: '专注工作计时', appId: 'pomodoro' },
      { id: 'markdown', name: 'Markdown', icon: <FileText size={16} />, description: 'Markdown 编辑器', appId: 'markdown-editor' },
      { id: 'kanban', name: '看板', icon: <BarChart3 size={16} />, description: '项目管理看板', appId: 'kanban' },
    ],
    development: [
      { id: 'code', name: '代码编辑器', icon: <Code size={16} />, description: 'Monaco 代码编辑器', appId: 'code-editor' },
      { id: 'dev-lab', name: '开发实验室', icon: <Wrench size={16} />, description: '12+ 开发工具集成', appId: 'dev-lab' },
      { id: 'api-tester', name: 'API 测试', icon: <Globe size={16} />, description: 'REST API 测试工具', appId: 'api-tester' },
      { id: 'json-formatter', name: 'JSON 工具', icon: <Code size={16} />, description: 'JSON 格式化与校验', appId: 'json-formatter' },
      { id: 'code-runner', name: '代码运行器', icon: <Play size={16} />, description: '多语言代码执行', appId: 'code-runner' },
      { id: 'regex', name: '正则测试', icon: <Search size={16} />, description: '正则表达式测试器', appId: 'regex-tester' },
    ],
    system: [
      { id: 'system-monitor', name: '系统监控', icon: <Activity size={16} />, description: '实时系统指标监控', appId: 'system-monitor' },
      { id: 'real-system-monitor', name: '实时监控 Pro', icon: <Cpu size={16} />, description: '真实浏览器 API 数据', appId: 'real-system-monitor' },
      { id: 'settings', name: '系统设置', icon: <Settings size={16} />, description: '个性化与系统配置', appId: 'settings' },
      { id: 'task-manager', name: '任务管理器', icon: <BarChart3 size={16} />, description: '进程与资源管理', appId: 'task-manager' },
      { id: 'about', name: '系统信息', icon: <Monitor size={16} />, description: '系统版本与详情', appId: 'about' },
      { id: 'system-diagnostics', name: '系统诊断', icon: <Shield size={16} />, description: '健康检查与优化', appId: 'system-diagnostics-pro' },
    ],
    media: [
      { id: 'music-player', name: '音乐播放器', icon: <Music size={16} />, description: '本地音乐播放', appId: 'music-player' },
      { id: 'image-viewer', name: '图片查看', icon: <Image size={16} />, description: '图片浏览工具', appId: 'image-viewer' },
      { id: 'paint', name: '画图', icon: <Palette size={16} />, description: '简单绘图工具', appId: 'paint' },
      { id: 'audio-viz', name: '音频可视化', icon: <BarChart3 size={16} />, description: '实时音频可视化', appId: 'audio-viz' },
      { id: 'screenshot', name: '截图', icon: <Monitor size={16} />, description: '屏幕截图工具', appId: 'screenshot' },
      { id: 'games', name: '游戏', icon: <Zap size={16} />, description: '多款休闲小游戏', appId: 'game-2048' },
    ],
    internet: [
      { id: 'browser', name: '网页浏览器', icon: <Globe size={16} />, description: '内置网页浏览器', appId: 'browser' },
      { id: 'book-finder', name: '书海检索', icon: <Bookmark size={16} />, description: 'Open Library 图书搜索', appId: 'book-finder' },
      { id: 'global-insights', name: '全球洞察', icon: <Users size={16} />, description: '全球信息聚合器', appId: 'global-insights' },
      { id: 'network-toolkit', name: '网络工具箱', icon: <Wifi size={16} />, description: 'IP/DNS/端口扫描', appId: 'network-toolkit-pro' },
      { id: 'wikipedia', name: '维基百科', icon: <Search size={16} />, description: '维基百科搜索', appId: 'wikipedia-explorer' },
      { id: 'news', name: '新闻阅读器', icon: <FileText size={16} />, description: '新闻聚合阅读', appId: 'news-reader' },
    ],
  }
  return all[category as keyof typeof all] || all.essentials
}
