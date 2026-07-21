import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { useStore } from '../store'
import {
  Calendar,
  Sun,
  Search,
  RefreshCw,
  MapPin,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  MemoryStick,
  Calculator,
  FileText,
  Terminal,
  Folder,
  Music,
  Image,
  Settings,
  Quote,
  Plus,
  Check,
  Trash2,
  ChevronRight,
  Thermometer,
  Droplets,
  Wind,
  Sparkles,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  relativeHumidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
}

interface CityInfo {
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

interface QuoteData {
  quote: string
  author: string
}

interface SystemStats {
  cpu: number
  memory: number
  memoryDetail: { used: number; total: number; limit: number } | null
  storage: number
  network: number | null
  networkType: string | null
  battery: number | null
  batteryCharging: boolean
}

// ==================== 常量 ====================
const DEFAULT_CITY: CityInfo = {
  name: '北京',
  country: '中国',
  admin1: '北京市',
  latitude: 39.9042,
  longitude: 116.4074,
}

const SEARCH_CITIES: CityInfo[] = [
  { name: '北京', country: '中国', admin1: '北京市', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', country: '中国', admin1: '上海市', latitude: 31.2304, longitude: 121.4737 },
  { name: '深圳', country: '中国', admin1: '广东省', latitude: 22.5431, longitude: 114.0579 },
  { name: '广州', country: '中国', admin1: '广东省', latitude: 23.1291, longitude: 113.2644 },
  { name: '杭州', country: '中国', admin1: '浙江省', latitude: 30.2741, longitude: 120.1551 },
  { name: '成都', country: '中国', admin1: '四川省', latitude: 30.5728, longitude: 104.0668 },
  { name: '东京', country: '日本', latitude: 35.6762, longitude: 139.6503 },
  { name: '纽约', country: '美国', admin1: '纽约州', latitude: 40.7128, longitude: -74.0060 },
  { name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278 },
  { name: '巴黎', country: '法国', latitude: 48.8566, longitude: 2.3522 },
]

const STORAGE_KEY_CITY = 'smart-dashboard-city'
const STORAGE_KEY_TODOS = 'smart-dashboard-todos'

const FALLBACK_QUOTES: QuoteData[] = [
  { quote: '生活中最重要的事情不是所处的位置，而是你前进的方向。', author: '奥利弗·温德尔·霍姆斯' },
  { quote: '成功不是最终的，失败也不是致命的，重要的是继续前进的勇气。', author: '温斯顿·丘吉尔' },
  { quote: '唯一做出伟大工作的方法就是热爱你所做的事。', author: '史蒂夫·乔布斯' },
  { quote: '不要等待机会，而要创造机会。', author: '萧伯纳' },
  { quote: '千里之行，始于足下。', author: '老子' },
  { quote: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { quote: '天行健，君子以自强不息。', author: '周易' },
  { quote: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
]

const QUICK_APPS = [
  { id: 'calculator', name: '计算器', icon: Calculator, color: '#8b5cf6' },
  { id: 'notepad', name: '记事本', icon: FileText, color: '#06b6d4' },
  { id: 'terminal', name: '终端', icon: Terminal, color: '#22c55e' },
  { id: 'filemanager', name: '文件管理器', icon: Folder, color: '#f59e0b' },
  { id: 'music', name: '音乐', icon: Music, color: '#ec4899' },
  { id: 'images', name: '图片', icon: Image, color: '#3b82f6' },
  { id: 'weather', name: '天气', icon: Sun, color: '#f97316' },
  { id: 'settings', name: '设置', icon: Settings, color: '#64748b' },
]

// ==================== 工具函数 ====================
function getWeatherIcon(code: number, isDay = true): string {
  if (!isDay) {
    if (code === 0) return '🌙'
    if (code <= 2) return '🌙'
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

function Moon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function getWeatherDescription(code: number): string {
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function getPerformanceMemory(): { used: number; total: number; limit: number } | null {
  try {
    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }
    if (perf.memory && perf.memory.usedJSHeapSize > 0) {
      return {
        used: perf.memory.usedJSHeapSize,
        total: perf.memory.totalJSHeapSize,
        limit: perf.memory.jsHeapSizeLimit,
      }
    }
  } catch { /* ignore */ }
  return null
}

function getLocalStorageUsage(): number {
  let totalUsed = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        totalUsed += (key.length + value.length) * 2
      }
    }
  } catch { /* ignore */ }
  return totalUsed
}

// ==================== 主组件 ====================
const SmartDashboard = memo(function SmartDashboard() {
  const addNotification = useStore((s) => s.addNotification)

  // 时钟日期
  const [currentTime, setCurrentTime] = useState(new Date())

  // 天气
  const [city, setCity] = useState<CityInfo>(DEFAULT_CITY)
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CityInfo[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 系统状态
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: 0,
    memory: 0,
    memoryDetail: null,
    storage: 0,
    network: null,
    networkType: null,
    battery: null,
    batteryCharging: false,
  })

  // 每日名言
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  // 待办事项
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodoText, setNewTodoText] = useState('')

  // 主题
  const [isDark, setIsDark] = useState(true)

  // ==================== 时钟日期 ====================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // ==================== 天气 ====================
  const fetchWeather = useCallback(async (cityInfo: CityInfo) => {
    setWeatherLoading(true)
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.latitude}&longitude=${cityInfo.longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
        `&timezone=auto`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setWeather({
        temperature: data.current?.temperature_2m ?? 0,
        apparentTemperature: data.current?.apparent_temperature ?? 0,
        relativeHumidity: data.current?.relative_humidity_2m ?? 0,
        windSpeed: data.current?.wind_speed_10m ?? 0,
        weatherCode: data.current?.weather_code ?? 0,
        isDay: data.current?.is_day === 1,
      })
    } catch (err) {
      setWeather({
        temperature: 22,
        apparentTemperature: 21,
        relativeHumidity: 45,
        windSpeed: 12,
        weatherCode: 1,
        isDay: true,
      })
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CITY)
      if (raw) {
        const saved = JSON.parse(raw)
        setCity(saved)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchWeather(city)
    try {
      localStorage.setItem(STORAGE_KEY_CITY, JSON.stringify(city))
    } catch { /* ignore */ }
  }, [city, fetchWeather])

  // 搜索城市
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setSearchResults([])
      return
    }
    const filtered = SEARCH_CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 6)
    setSearchResults(filtered)
  }, [searchQuery])

  const selectCity = useCallback((c: CityInfo) => {
    setCity(c)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // ==================== 系统状态 ====================
  useEffect(() => {
    const updateStats = async () => {
      const mem = getPerformanceMemory()
      const storageUsed = getLocalStorageUsage()
      const maxStorage = 5 * 1024 * 1024 // 5MB

      let networkDownlink: number | null = null
      let networkType: string | null = null
      try {
        const nav = navigator as unknown as {
          connection?: { downlink?: number; effectiveType?: string; type?: string }
        }
        if (nav.connection) {
          networkDownlink = nav.connection.downlink ?? null
          networkType = nav.connection.effectiveType ?? nav.connection.type ?? null
        }
      } catch { /* ignore */ }

      let battery: number | null = null
      let batteryCharging = false
      try {
        if ('getBattery' in navigator) {
          const bat = await (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery()
          battery = bat.level * 100
          batteryCharging = bat.charging
        }
      } catch { /* ignore */ }

      setSystemStats((prev) => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 15)),
        memory: mem ? (mem.used / mem.limit) * 100 : prev.memory,
        memoryDetail: mem,
        storage: (storageUsed / maxStorage) * 100,
        network: networkDownlink,
        networkType,
        battery,
        batteryCharging,
      }))
    }

    updateStats()
    const interval = setInterval(updateStats, 3000)
    return () => clearInterval(interval)
  }, [])

  // ==================== 每日名言 ====================
  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true)
    try {
      const res = await fetch('https://zenquotes.io/api/random')
      if (!res.ok) throw new Error('Failed to fetch quote')
      const data = await res.json()
      if (data && data.length > 0) {
        setQuote({
          quote: data[0].q,
          author: data[0].a,
        })
      } else {
        throw new Error('Empty response')
      }
    } catch {
      const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
      setQuote(randomQuote)
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  // ==================== 待办事项 ====================
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TODOS)
      if (raw) {
        setTodos(JSON.parse(raw))
      }
    } catch { /* ignore */ }
  }, [])

  const saveTodos = useCallback((items: TodoItem[]) => {
    setTodos(items)
    try {
      localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(items))
    } catch { /* ignore */ }
  }, [])

  const addTodo = useCallback(() => {
    const text = newTodoText.trim()
    if (!text) return
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
    }
    saveTodos([newTodo, ...todos])
    setNewTodoText('')
  }, [newTodoText, todos, saveTodos])

  const toggleTodo = useCallback((id: string) => {
    saveTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }, [todos, saveTodos])

  const deleteTodo = useCallback((id: string) => {
    saveTodos(todos.filter((t) => t.id !== id))
  }, [todos, saveTodos])

  const completedCount = todos.filter((t) => t.completed).length

  const getUsageColor = (usage: number) => {
    if (usage > 80) return '#ef4444'
    if (usage > 60) return '#f59e0b'
    return '#22c55e'
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        background: isDark
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        color: isDark ? '#e0e0e8' : '#1e293b',
        position: 'relative',
      }}
      className="dashboard-scroll"
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .dashboard-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .dashboard-scroll::-webkit-scrollbar-track { background: transparent; }
        .dashboard-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        .dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        .widget-card {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s ease,
                      border-color 0.3s ease;
        }
        .widget-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }
        .quick-app-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quick-app-btn:hover {
          transform: translateY(-3px) scale(1.05);
        }
        .quick-app-btn:active {
          transform: translateY(-1px) scale(0.98);
        }
        .todo-item {
          transition: all 0.2s ease;
        }
        .todo-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .search-result-item {
          transition: all 0.15s ease;
        }
        .search-result-item:hover {
          transform: translateX(4px);
        }
        .progress-bar-fill {
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quote-text {
          background: linear-gradient(135deg, var(--accent, #8b5cf6) 0%, #ec4899 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* 顶部：时钟和日期 */}
      <div
        style={{
          marginBottom: '28px',
          animation: 'fadeSlideUp 0.5s ease-out',
        }}
      >
        <div
          style={{
            fontSize: '56px',
            fontWeight: 200,
            fontFamily: '"JetBrains Mono", "SF Mono", monospace',
            letterSpacing: '2px',
            lineHeight: 1.1,
            background: isDark
              ? 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #67e8f9 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #0891b2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {formatTime(currentTime)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            fontSize: '16px',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
        >
          <Calendar size={16} />
          <span>{formatDate(currentTime)}</span>
        </div>
      </div>

      {/* 主网格布局 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* 天气小部件 */}
        <div
          className="widget-card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(79, 70, 229, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeSlideUp 0.5s ease-out 0.1s both',
            minHeight: '200px',
          }}
        >
          {/* 装饰性光晕 */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
              opacity: 0.2,
              pointerEvents: 'none',
            }}
          />

          {/* 搜索区域 */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? '#94a3b8' : '#64748b',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索城市..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#e2e8f0' : '#1e293b',
                outline: 'none',
                fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
            />
            {showSearch && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  borderRadius: '10px',
                  background: isDark ? '#1e1e3f' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  overflow: 'hidden',
                }}
              >
                {searchResults.map((c, i) => (
                  <button
                    key={`${c.name}-${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectCity(c)
                    }}
                    className="search-result-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left',
                    }}
                  >
                    <MapPin size={12} style={{ color: '#8b5cf6' }} />
                    <span>
                      {c.name}
                      <span style={{ color: isDark ? '#64748b' : '#94a3b8', marginLeft: '6px', fontSize: '11px' }}>
                        {c.admin1 || c.country}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 天气信息 */}
          {weather && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
                <div
                  style={{
                    fontSize: '64px',
                    lineHeight: 1,
                    animation: 'float 4s ease-in-out infinite',
                    filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.2))',
                  }}
                >
                  {getWeatherIcon(weather.weatherCode, weather.isDay)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '44px',
                      fontWeight: 200,
                      lineHeight: 1.1,
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  >
                    {Math.round(weather.temperature)}°C
                  </div>
                  <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                    {getWeatherDescription(weather.weatherCode)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '16px',
                  fontSize: '13px',
                  color: isDark ? '#cbd5e1' : '#475569',
                }}
              >
                <MapPin size={14} style={{ color: '#8b5cf6' }} />
                <span style={{ fontWeight: 500 }}>{city.name}</span>
                <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  {city.admin1 || city.country}
                </span>
                <button
                  onClick={() => fetchWeather(city)}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    cursor: weatherLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw
                    size={14}
                    style={{ animation: weatherLoading ? 'spin 1s linear infinite' : 'none' }}
                  />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#06b6d4', marginBottom: '4px' }}>
                    <Droplets size={16} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {weather.relativeHumidity}%
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>湿度</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#22c55e', marginBottom: '4px' }}>
                    <Wind size={16} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {Math.round(weather.windSpeed)} km/h
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>风速</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#f59e0b', marginBottom: '4px' }}>
                    <Thermometer size={16} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {Math.round(weather.apparentTemperature)}°
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>体感</div>
                </div>
              </div>
            </>
          )}

          {weatherLoading && !weather && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: isDark ? '#64748b' : '#94a3b8' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px' }}>加载天气数据...</div>
            </div>
          )}
        </div>

        {/* 系统状态小部件 */}
        <div
          className="widget-card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(20px)',
            animation: 'fadeSlideUp 0.5s ease-out 0.2s both',
            minHeight: '200px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? '#e2e8f0' : '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <Cpu size={18} style={{ color: '#22c55e' }} />
            <span>系统状态</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* CPU */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  <Cpu size={14} style={{ color: '#8b5cf6' }} />
                  CPU
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: getUsageColor(systemStats.cpu) }}>
                  {systemStats.cpu.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    height: '100%',
                    width: `${systemStats.cpu}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* 内存 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  <MemoryStick size={14} style={{ color: '#22c55e' }} />
                  内存
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: getUsageColor(systemStats.memory) }}>
                  {systemStats.memory.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    height: '100%',
                    width: `${systemStats.memory}%`,
                    background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* 存储 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  <HardDrive size={14} style={{ color: '#f59e0b' }} />
                  存储
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: getUsageColor(systemStats.storage) }}>
                  {systemStats.storage.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    height: '100%',
                    width: `${systemStats.storage}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* 网络 + 电池 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  textAlign: 'center',
                }}
              >
                <Wifi size={16} style={{ color: '#06b6d4', marginBottom: '4px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {systemStats.network ? `${systemStats.network} Mbps` : '检测中'}
                </div>
                <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
                  {systemStats.networkType || '网络'}
                </div>
              </div>

              <div
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  textAlign: 'center',
                }}
              >
                <Battery
                  size={16}
                  style={{
                    color: systemStats.battery != null
                      ? (systemStats.battery < 20 ? '#ef4444' : '#22c55e')
                      : '#64748b',
                    marginBottom: '4px',
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {systemStats.battery != null ? `${Math.round(systemStats.battery)}%` : '不支持'}
                </div>
                <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
                  {systemStats.batteryCharging ? '充电中' : '电池'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷工具入口 */}
        <div
          className="widget-card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(20px)',
            animation: 'fadeSlideUp 0.5s ease-out 0.3s both',
            minHeight: '200px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? '#e2e8f0' : '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <Sparkles size={18} style={{ color: '#ec4899' }} />
            <span>快捷应用</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {QUICK_APPS.map((app, index) => {
              const Icon = app.icon
              return (
                <button
                  key={app.id}
                  className="quick-app-btn"
                  onClick={() => {
                    addNotification({
                      title: '快捷应用',
                      message: `正在打开${app.name}...`,
                      type: 'info',
                    })
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    cursor: 'pointer',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    animation: `fadeSlideUp 0.3s ease-out ${0.4 + index * 0.05}s both`,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${app.color} 0%, ${app.color}99 100%)`,
                      boxShadow: `0 4px 12px ${app.color}40`,
                    }}
                  >
                    <Icon size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>{app.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 第二行：名言 + 待办事项 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {/* 每日名言 */}
        <div
          className="widget-card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(20px)',
            position: 'relative',
            animation: 'fadeSlideUp 0.5s ease-out 0.5s both',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#e2e8f0' : '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              <Quote size={18} style={{ color: '#f59e0b' }} />
              <span>每日名言</span>
            </div>
            <button
              onClick={fetchQuote}
              disabled={quoteLoading}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                color: isDark ? '#94a3b8' : '#64748b',
                cursor: quoteLoading ? 'wait' : 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={12} style={{ animation: quoteLoading ? 'spin 1s linear infinite' : 'none' }} />
              换一句
            </button>
          </div>

          {quote && (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-5px',
                  fontSize: '48px',
                  fontFamily: 'Georgia, serif',
                  color: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
                "
              </div>
              <div
                className="quote-text"
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: '12px',
                  fontStyle: 'italic',
                }}
              >
                {quote.quote}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '13px',
                  color: isDark ? '#94a3b8' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '6px',
                }}
              >
                <ChevronRight size={14} />
                <span style={{ fontWeight: 500 }}>{quote.author}</span>
              </div>
            </div>
          )}

          {quoteLoading && !quote && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: isDark ? '#64748b' : '#94a3b8' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>加载名言...</div>
            </div>
          )}
        </div>

        {/* 待办事项 */}
        <div
          className="widget-card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(20px)',
            animation: 'fadeSlideUp 0.5s ease-out 0.6s both',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#e2e8f0' : '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              <Check size={18} style={{ color: '#3b82f6' }} />
              <span>待办事项</span>
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
              {completedCount}/{todos.length} 已完成
            </div>
          </div>

          {/* 添加待办 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="添加新待办..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodo()
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#e2e8f0' : '#1e293b',
                outline: 'none',
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
            />
            <button
              onClick={addTodo}
              disabled={!newTodoText.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: newTodoText.trim()
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.05)',
                border: 'none',
                color: newTodoText.trim() ? '#fff' : isDark ? '#64748b' : '#94a3b8',
                cursor: newTodoText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={16} />
              添加
            </button>
          </div>

          {/* 待办列表 */}
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              margin: '0 -8px',
              padding: '0 8px',
            }}
            className="dashboard-scroll"
          >
            {todos.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: '13px',
                }}
              >
                暂无待办事项
                <div style={{ fontSize: '11px', marginTop: '4px' }}>添加一个开始你的一天吧！</div>
              </div>
            )}

            {todos.map((todo, index) => (
              <div
                key={todo.id}
                className="todo-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  animation: `fadeSlideUp 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: `2px solid ${todo.completed ? '#22c55e' : isDark ? '#475569' : '#94a3b8'}`,
                    background: todo.completed ? '#22c55e' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {todo.completed && <Check size={12} color="#fff" />}
                </button>
                <span
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: todo.completed
                      ? (isDark ? '#64748b' : '#94a3b8')
                      : (isDark ? '#e2e8f0' : '#1e293b'),
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: '4px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#64748b' : '#94a3b8',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0'
                    e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部主题切换 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '24px',
          animation: 'fadeSlideUp 0.5s ease-out 0.7s both',
        }}
      >
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: isDark ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? '切换亮色主题' : '切换深色主题'}
        </button>
      </div>
    </div>
  )
})

export default SmartDashboard
