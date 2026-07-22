import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Droplets,
  Wind,
  Gauge,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Zap,
  AlertCircle,
  Loader2,
  GripVertical,
  Settings,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface SystemMetrics {
  cpu: number
  memoryUsed: number
  memoryTotal: number
  storageUsed: number
  storageTotal: number
  uptime: string
  uptimeSeconds: number
}

interface WeatherData {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  pressure: number
  weatherCode: number
  isDay: boolean
  hourly: { time: string; temp: number }[]
}

interface NewsItem {
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number
}

interface CryptoPrice {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
}

interface WorldClock {
  id: string
  city: string
  timezone: string
  offset: number
}

interface WidgetConfig {
  id: string
  title: string
  visible: boolean
  order: number
}

// ==================== 常量配置 ====================
const INITIAL_WIDGETS: WidgetConfig[] = [
  { id: 'clock', title: '时钟与系统', visible: true, order: 0 },
  { id: 'weather', title: '天气', visible: true, order: 1 },
  { id: 'system', title: '系统监控', visible: true, order: 2 },
  { id: 'crypto', title: '加密货币', visible: true, order: 3 },
  { id: 'news', title: '新闻资讯', visible: true, order: 4 },
  { id: 'worldclock', title: '全球时钟', visible: true, order: 5 },
  { id: 'charts', title: '性能图表', visible: true, order: 6 },
]

const WORLD_CLOCKS: WorldClock[] = [
  { id: 'beijing', city: '北京', timezone: 'Asia/Shanghai', offset: 8 },
  { id: 'tokyo', city: '东京', timezone: 'Asia/Tokyo', offset: 9 },
  { id: 'newyork', city: '纽约', timezone: 'America/New_York', offset: -5 },
  { id: 'london', city: '伦敦', timezone: 'Europe/London', offset: 0 },
  { id: 'paris', city: '巴黎', timezone: 'Europe/Paris', offset: 1 },
  { id: 'sydney', city: '悉尼', timezone: 'Australia/Sydney', offset: 10 },
]

const DEFAULT_LAT = 39.9042
const DEFAULT_LON = 116.4074

// ==================== 工具函数 ====================
function getWeatherIcon(code: number, isDay: boolean) {
  if (!isDay) {
    if (code === 0) return <Moon className="w-10 h-10" />
    if (code <= 2) return <Moon className="w-10 h-10" />
    if (code === 3) return <Cloud className="w-10 h-10" />
  }
  if (code === 0) return <Sun className="w-10 h-10 text-yellow-400" />
  if (code <= 2) return <Sun className="w-10 h-10 text-yellow-400" />
  if (code === 3) return <Cloud className="w-10 h-10" />
  if (code <= 48) return <CloudFog className="w-10 h-10" />
  if (code <= 57) return <CloudRain className="w-10 h-10" />
  if (code <= 67) return <CloudRain className="w-10 h-10" />
  if (code <= 77) return <CloudSnow className="w-10 h-10" />
  if (code <= 82) return <CloudRain className="w-10 h-10" />
  if (code <= 86) return <CloudSnow className="w-10 h-10" />
  if (code <= 99) return <CloudLightning className="w-10 h-10" />
  return <Cloud className="w-10 h-10" />
}

function getWeatherDesc(code: number): string {
  if (code === 0) return '晴朗'
  if (code <= 2) return '多云'
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
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (d > 0) return `${d}天 ${h}时 ${m}分 ${s}秒`
  if (h > 0) return `${h}时 ${m}分 ${s}秒`
  return `${m}分 ${s}秒`
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

// ==================== 模拟时钟组件 ====================
function AnalogClock({ size = 120 }: { size?: number }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours()

  const secondAngle = seconds * 6
  const minuteAngle = minutes * 6 + seconds * 0.1
  const hourAngle = (hours % 12) * 30 + minutes * 0.5

  const center = size / 2
  const radius = size / 2 - 8

  const hourMarkers = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180)
      const inner = radius - 12
      const outer = radius - 4
      return {
        x1: center + inner * Math.cos(angle),
        y1: center + inner * Math.sin(angle),
        x2: center + outer * Math.cos(angle),
        y2: center + outer * Math.sin(angle),
      }
    })
  }, [center, radius])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="clockGrad" cx="50%" cy="30%">
        <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
        <stop offset="100%" stopColor="rgba(6, 182, 212, 0.1)" />
        </radialGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} fill="url(#clockGrad)" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="2" />
      {hourMarkers.map((m, i) => (
        <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="rgba(148, 163, 184, 0.6)" strokeWidth="2" strokeLinecap="round" />
      ))}
      <line
        x1={center}
        y1={center}
        x2={center + (radius * 0.5) * Math.cos((hourAngle - 90) * (Math.PI / 180))}
        y2={center + (radius * 0.5) * Math.sin((hourAngle - 90) * (Math.PI / 180))}
        stroke="#a78bfa"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1={center}
        y1={center}
        x2={center + (radius * 0.7) * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
        y2={center + (radius * 0.7) * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={center}
        y1={center}
        x2={center + (radius * 0.8) * Math.cos((secondAngle - 90) * (Math.PI / 180))}
        y2={center + (radius * 0.8) * Math.sin((secondAngle - 90) * (Math.PI / 180))}
        stroke="#f472b6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={center} cy={center} r="4" fill="#a78bfa" />
    </svg>
  )
}

// ==================== CPU 折线图 ====================
function LineChart({ data, color, label, width = 280, height = 100 }: {
  data: number[]
  color: string
  label: string
  width?: number
  height?: number
}) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - 20) + 10
    const y = height - 10 - ((val - min) / range * (height - 20))
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `10,${height - 10} ${points} ${width - 10},${height - 10}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((ratio, i) => (
        <line
          key={i}
          x1="10"
          y1={10 + ratio * (height - 20)}
          x2={width - 10}
          y2={10 + ratio * (height - 20)}
          stroke="rgba(148, 163, 184, 0.1)"
          strokeDasharray="3,3"
        />
      ))}
      <polygon points={areaPoints} fill={`url(#grad-${label})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length > 0 && (
        <circle
          cx={((data.length - 1) / (data.length - 1)) * (width - 20) + 10}
          cy={height - 10 - ((data[data.length - 1] - min) / range * (height - 20))}
          r="4"
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
    </svg>
  )
}

// ==================== 柱状图 ====================
function BarChart({ data, color, width = 280, height = 100 }: {
  data: { label: string; value: number }[]
  color: string
  width?: number
  height?: number
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barWidth = (width - 20) / data.length - 8

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((item, i) => {
        const barHeight = (item.value / max) * (height - 30)
        const x = 10 + i * ((width - 20) / data.length + 4)
        const y = height - 15 - barHeight
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="3"
              style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
            />
            <text
              x={x + barWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fill="rgba(148, 163, 184, 0.8)"
              fontSize="9"
            >
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ==================== 主组件 ====================
export default function PulseBoard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([])
  const [cryptoLoading, setCryptoLoading] = useState(true)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [memHistory, setMemHistory] = useState<number[]>([])
  const [netHistory, setNetHistory] = useState<number[]>([])
  const [widgets, setWidgets] = useState<WidgetConfig[]>(INITIAL_WIDGETS)
  const [showSettings, setShowSettings] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const startTimeRef = useRef(Date.now())

  // 时间更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 系统监控
  const updateSystemMetrics = useCallback(async () => {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
    const memoryUsed = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : Math.round(Math.random() * 200 + 300)
    const memoryTotal = memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : 2048

    let storageUsed = 0
    let storageTotal = 0
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        storageUsed = Math.round((estimate.usage || 0) / 1024 / 1024)
        storageTotal = Math.round((estimate.quota || 0) / 1024 / 1024)
      } catch {
        storageUsed = Math.round(Math.random() * 500 + 1000)
        storageTotal = 5000
      }
    } else {
      storageUsed = Math.round(Math.random() * 500 + 1000)
      storageTotal = 5000
    }

    const cpu = Math.round(Math.random() * 40 + 20)
    const uptimeSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)

    setSystemMetrics({
      cpu,
      memoryUsed,
      memoryTotal,
      storageUsed,
      storageTotal,
      uptime: formatUptime(uptimeSeconds),
      uptimeSeconds,
    })

    setCpuHistory(prev => [...prev.slice(-29), cpu])
    setMemHistory(prev => [...prev.slice(-29), memoryUsed])
    setNetHistory(prev => [...prev.slice(-29), Math.round(Math.random() * 80 + 20)])
  }, [])

  useEffect(() => {
    updateSystemMetrics()
    const interval = setInterval(updateSystemMetrics, 2000)
    return () => clearInterval(interval)
  }, [updateSystemMetrics])

  // 天气数据
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true)
    setWeatherError(null)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,pressure_msl,weather_code,is_day&hourly=temperature_2m&forecast_days=1&timezone=auto`
      )
      if (!res.ok) throw new Error('天气数据获取失败')
      const data = await res.json()

      const hourly = data.hourly?.time?.map((time: string, i: number) => ({
        time,
        temp: data.hourly.temperature_2m[i],
      })).slice(0, 24) || []

      setWeather({
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        pressure: data.current.pressure_msl,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
        hourly,
      })
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : '未知错误')
      setWeather({
        temperature: 22,
        apparentTemperature: 21,
        humidity: 60,
        windSpeed: 10,
        pressure: 1013,
        weatherCode: 0,
        isDay: true,
        hourly: Array.from({ length: 24 }, (_, i) => ({ time: `2024-01-01T${String(i).padStart(2, '0')}:00`, temp: 18 + Math.sin(i / 24 * Math.PI * 2) * 8 })),
      })
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeather])

  // Hacker News 数据
  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    try {
      const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      if (!res.ok) throw new Error('新闻获取失败')
      const ids: number[] = await res.json()
      const topIds = ids.slice(0, 10)

      const stories = await Promise.all(
        topIds.map(async id => {
          const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          return storyRes.json()
        })
      )
      setNews(stories.filter(s => s && s.title))
    } catch {
      setNews([
        { id: 1, title: 'WebLinuxOS - 基于 Web 的现代操作系统', url: '#', score: 342, by: 'developer', time: Date.now() / 1000 - 3600 },
        { id: 2, title: 'React 19 新特性全面解析', url: '#', score: 256, by: 'reactdev', time: Date.now() / 1000 - 7200 },
        { id: 3, title: 'TypeScript 5.0 性能提升详解', url: '#', score: 189, by: 'tsfan', time: Date.now() / 1000 - 10800 },
        { id: 4, title: '前端性能优化最佳实践指南', url: '#', score: 167, by: 'perfexpert', time: Date.now() / 1000 - 14400 },
        { id: 5, title: 'CSS Grid 布局高级技巧', url: '#', score: 145, by: 'cssmaster', time: Date.now() / 1000 - 18000 },
      ])
    } finally {
      setNewsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  // 加密货币价格
  const fetchCrypto = useCallback(async () => {
    setCryptoLoading(true)
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=usd&include_24hr_change=true'
      )
      if (!res.ok) throw new Error('加密货币数据获取失败')
      const data = await res.json()
      setCryptoPrices([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: data.bitcoin?.usd || 67000, change24h: data.bitcoin?.usd_24h_change || 2.5 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: data.ethereum?.usd || 3400, change24h: data.ethereum?.usd_24h_change || 1.8 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', price: data.solana?.usd || 145, change24h: data.solana?.usd_24h_change || -0.5 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: data.cardano?.usd || 0.45, change24h: data.cardano?.usd_24h_change || 3.2 },
      ])
    } catch {
      setCryptoPrices([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67234.56, change24h: 2.34 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: 1.56 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', price: 145.23, change24h: -0.78 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.456, change24h: 3.12 },
      ])
    } finally {
      setCryptoLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrypto()
    const interval = setInterval(fetchCrypto, 30 * 1000)
    return () => clearInterval(interval)
  }, [fetchCrypto])

  // 全球时钟时间
  const getWorldTime = useCallback((offset: number) => {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    return new Date(utc + offset * 3600000)
  }, [])

  // 拖拽排序
  const handleDragStart = (id: string) => {
    setDraggedWidget(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedWidget || draggedWidget === targetId) return
    setWidgets(prev => {
      const newWidgets = [...prev]
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget)
      const targetIndex = newWidgets.findIndex(w => w.id === targetId)
      const [removed] = newWidgets.splice(draggedIndex, 1)
      newWidgets.splice(targetIndex, 0, removed)
      return newWidgets.map((w, i) => ({ ...w, order: i }))
    })
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order)

  const memoryPercent = systemMetrics
    ? Math.round((systemMetrics.memoryUsed / systemMetrics.memoryTotal) * 100)
    : 0

  const storagePercent = systemMetrics
    ? Math.round((systemMetrics.storageUsed / systemMetrics.storageTotal) * 100)
    : 0

  const hourlyChartData = weather?.hourly.slice(0, 12).map((h, i) => ({
    label: `${i * 2}时`,
    value: h.temp,
  })) || []

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1033 50%, #0a1628 100%)',
      color: '#e2e8f0',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden',
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(15, 10, 30, 0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
          }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(90deg, #a78bfa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PulseBoard
            </div>
            <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.8)' }}>
              实时信息仪表盘
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              fetchWeather()
              fetchNews()
              fetchCrypto()
              updateSystemMetrics()
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#a78bfa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#a78bfa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(139, 92, 246, 0.05)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.8)', alignSelf: 'center' }}>显示小部件：</span>
          {widgets.map(w => (
            <button
              key={w.id}
              onClick={() => toggleWidget(w.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${w.visible ? 'rgba(139, 92, 246, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                background: w.visible ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                color: w.visible ? '#a78bfa' : 'rgba(148, 163, 184, 0.6)',
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
            >
              {w.title}
            </button>
          ))}
        </div>
      )}

      {/* 小部件网格 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        alignContent: 'start',
      }}>
        {visibleWidgets.map(widget => (
          <div
            key={widget.id}
            draggable={showSettings}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDragEnd={handleDragEnd}
            style={{
              background: 'rgba(30, 20, 50, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 16,
              padding: 16,
              position: 'relative',
              transition: 'all 0.3s ease',
              transform: draggedWidget === widget.id ? 'opacity: 0.5; scale: 0.98' : 'none',
              cursor: showSettings ? 'grab' : 'default',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            {showSettings && (
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: 'rgba(148, 163, 184, 0.6)',
                cursor: 'grab',
              }}>
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(148, 163, 184, 0.9)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {widget.title}
            </div>

            {/* 时钟与系统 */}
            {widget.id === 'clock' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <AnalogClock size={140} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, background: 'linear-gradient(90deg, #a78bfa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'SF Mono, Monaco, monospace' }}>
                    {formatTime(currentTime)}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(148, 163, 184, 0.8)', marginTop: 4 }}>
                    {formatDate(currentTime)}
                  </div>
                </div>
                {systemMetrics && (
                  <div style={{ width: '100%', paddingTop: 12, borderTop: '1px solid rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(148, 163, 184, 0.7)' }}>
                    <Clock className="w-4 h-4" />
                    <span>运行时间: {systemMetrics.uptime}</span>
                  </div>
                )}
              </div>
            )}

            {/* 天气 */}
            {widget.id === 'weather' && (
              <div>
                {weatherLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Loader2 className="w-6 h-6 text-purple-400" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : weatherError && !weather ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 13 }}>
                    <AlertCircle className="w-4 h-4" />
                    {weatherError}
                  </div>
                ) : weather && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{ color: '#fbbf24' }}>
                        {getWeatherIcon(weather.weatherCode, weather.isDay)}
                      </div>
                      <div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9' }}>
                          {Math.round(weather.temperature)}°C
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(148, 163, 184, 0.8)' }}>
                          {getWeatherDesc(weather.weatherCode)} · 体感 {Math.round(weather.apparentTemperature)}°
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148, 163, 184, 0.8)' }}>
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <span>{weather.humidity}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148, 163, 184, 0.8)' }}>
                        <Wind className="w-4 h-4 text-green-400" />
                        <span>{weather.windSpeed} km/h</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148, 163, 184, 0.8)' }}>
                        <Gauge className="w-4 h-4 text-purple-400" />
                        <span>{Math.round(weather.pressure)} hPa</span>
                      </div>
                    </div>
                    <div style={{ paddingTop: 12, borderTop: '1px solid rgba(139, 92, 246, 0.15)' }}>
                      <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.6)', marginBottom: 8 }}>24小时预报</div>
                      <BarChart data={hourlyChartData} color="#22d3ee" width={260} height={60} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 系统监控 */}
            {widget.id === 'system' && systemMetrics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148, 163, 184, 0.9)' }}>
                      <Cpu className="w-4 h-4 text-purple-400" />
                      CPU
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{systemMetrics.cpu}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${systemMetrics.cpu}%`,
                      background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148, 163, 184, 0.9)' }}>
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      内存
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                      {systemMetrics.memoryUsed} / {systemMetrics.memoryTotal} MB ({memoryPercent}%)
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${memoryPercent}%`,
                      background: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148, 163, 184, 0.9)' }}>
                      <Wifi className="w-4 h-4 text-green-400" />
                      存储
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                      {systemMetrics.storageUsed} / {systemMetrics.storageTotal} MB ({storagePercent}%)
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${storagePercent}%`,
                      background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* 加密货币 */}
            {widget.id === 'crypto' && (
              <div>
                {cryptoLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Loader2 className="w-6 h-6 text-purple-400" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cryptoPrices.map(coin => (
                      <div key={coin.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'rgba(139, 92, 246, 0.05)',
                        borderRadius: 10,
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${coin.symbol === 'BTC' ? '#f7931a' : coin.symbol === 'ETH' ? '#627eea' : coin.symbol === 'SOL' ? '#9945ff' : '#0033ad'}, ${coin.symbol === 'BTC' ? '#f7931a80' : coin.symbol === 'ETH' ? '#627eea80' : coin.symbol === 'SOL' ? '#9945ff80' : '#0033ad80'})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'white',
                          }}>
                            {coin.symbol.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{coin.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.6)' }}>{coin.symbol}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                            ${coin.price >= 1 ? formatNumber(coin.price) : coin.price.toFixed(4)}
                          </div>
                          <div style={{
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 2,
                            color: coin.change24h >= 0 ? '#4ade80' : '#f87171',
                          }}>
                            {coin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(coin.change24h).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 新闻资讯 */}
            {widget.id === 'news' && (
              <div>
                {newsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Loader2 className="w-6 h-6 text-purple-400" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {news.slice(0, 6).map((item, index) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '10px 12px',
                          background: 'rgba(139, 92, 246, 0.05)',
                          borderRadius: 8,
                          border: '1px solid rgba(139, 92, 246, 0.1)',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)'
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.1)'
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 6 }}>
                          <span style={{ color: 'rgba(148, 163, 184, 0.5)', marginRight: 8 }}>{index + 1}.</span>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(148, 163, 184, 0.6)' }}>
                          <span>▲ {item.score}</span>
                          <span>by {item.by}</span>
                          <span>{Math.floor((Date.now() / 1000 - item.time) / 3600)}h ago</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 全球时钟 */}
            {widget.id === 'worldclock' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {WORLD_CLOCKS.map(clock => {
                  const time = getWorldTime(clock.offset)
                  return (
                    <div key={clock.id} style={{
                      padding: 12,
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: 10,
                      border: '1px solid rgba(139, 92, 246, 0.1)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: time.getHours() >= 6 && time.getHours() < 18 ? '#fbbf24' : '#6366f1',
                        margin: '0 auto 8px',
                        boxShadow: `0 0 8px ${time.getHours() >= 6 && time.getHours() < 18 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(99, 102, 241, 0.6)'}`,
                      }} />
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', fontFamily: 'SF Mono, Monaco, monospace' }}>
                        {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.7)', marginTop: 4 }}>
                        {clock.city}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 性能图表 */}
            {widget.id === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap className="w-4 h-4 text-purple-400" />
                      CPU 使用率
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>
                      {systemMetrics?.cpu || 0}%
                    </span>
                  </div>
                  <LineChart data={cpuHistory} color="#a78bfa" label="cpu" width={260} height={70} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      内存使用
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#22d3ee' }}>
                      {systemMetrics?.memoryUsed || 0} MB
                    </span>
                  </div>
                  <LineChart data={memHistory} color="#22d3ee" label="mem" width={260} height={70} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Wifi className="w-4 h-4 text-green-400" />
                      网络活动
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>
                      {netHistory[netHistory.length - 1] || 0} Mbps
                    </span>
                  </div>
                  <LineChart data={netHistory} color="#4ade80" label="net" width={260} height={70} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  )
}
