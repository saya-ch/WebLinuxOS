import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  MapPin,
  Search,
  Star,
  Navigation,
  CloudSun,
  CloudMoon,
  Snowflake,
  CloudLightning,
  Thermometer,
  RefreshCw,
  X,
  Sunrise,
  Sunset,
  CloudFog,
  Umbrella,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface GeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
  timezone?: string
  country_code?: string
  population?: number
}

interface CurrentWeather {
  temperature_2m: number
  apparent_temperature: number
  relative_humidity_2m: number
  wind_speed_1m: number
  weather_code: number
  is_day: number
  precipitation: number
  time: string
}

interface HourlyWeather {
  time: string[]
  temperature_2m: number[]
  weather_code: number[]
}

interface DailyWeather {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  weather_code: number[]
  precipitation_sum: number[]
  sunrise: string[]
  sunset: string[]
}

interface WeatherResponse {
  current: CurrentWeather
  hourly: HourlyWeather
  daily: DailyWeather
}

interface FavoriteCity {
  name: string
  country: string
  latitude: number
  longitude: number
}

interface SearchState {
  query: string
  results: GeoResult[]
  loading: boolean
  showDropdown: boolean
}

// ==================== 常量 ====================
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'

const POPULAR_CITIES: FavoriteCity[] = [
  { name: '北京', country: '中国', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', country: '中国', latitude: 31.2304, longitude: 121.4737 },
  { name: '深圳', country: '中国', latitude: 22.5431, longitude: 114.0579 },
  { name: '广州', country: '中国', latitude: 23.1291, longitude: 113.2644 },
  { name: '东京', country: '日本', latitude: 35.6762, longitude: 139.6503 },
  { name: '纽约', country: '美国', latitude: 40.7128, longitude: -74.006 },
  { name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278 },
  { name: '巴黎', country: '法国', latitude: 48.8566, longitude: 2.3522 },
]

const FAV_KEY = 'weatherlive_favorites_v1'
const UNIT_KEY = 'weatherlive_unit_v1'

// ==================== 天气代码映射 ====================
const WEATHER_CODE_MAP: Record<number, { desc: string; icon: string }> = {
  0: { desc: '晴朗', icon: 'sun' },
  1: { desc: '基本晴朗', icon: 'cloud-sun' },
  2: { desc: '局部多云', icon: 'cloud-sun' },
  3: { desc: '阴天', icon: 'cloud' },
  45: { desc: '有雾', icon: 'cloud-fog' },
  48: { desc: '冻雾', icon: 'cloud-fog' },
  51: { desc: '小毛毛雨', icon: 'cloud-rain' },
  53: { desc: '中毛毛雨', icon: 'cloud-rain' },
  55: { desc: '大毛毛雨', icon: 'cloud-rain' },
  56: { desc: '冻毛毛雨', icon: 'cloud-rain' },
  57: { desc: '强冻毛毛雨', icon: 'cloud-rain' },
  61: { desc: '小雨', icon: 'cloud-rain' },
  63: { desc: '中雨', icon: 'cloud-rain' },
  65: { desc: '大雨', icon: 'cloud-rain' },
  66: { desc: '冻雨', icon: 'cloud-rain' },
  67: { desc: '强冻雨', icon: 'cloud-rain' },
  71: { desc: '小雪', icon: 'snowflake' },
  73: { desc: '中雪', icon: 'snowflake' },
  75: { desc: '大雪', icon: 'snowflake' },
  77: { desc: '雪粒', icon: 'snowflake' },
  80: { desc: '小阵雨', icon: 'cloud-rain' },
  81: { desc: '中阵雨', icon: 'cloud-rain' },
  82: { desc: '强阵雨', icon: 'cloud-rain' },
  85: { desc: '小阵雪', icon: 'snowflake' },
  86: { desc: '强阵雪', icon: 'snowflake' },
  95: { desc: '雷暴', icon: 'cloud-lightning' },
  96: { desc: '雷暴伴冰雹', icon: 'cloud-lightning' },
  99: { desc: '强雷暴伴冰雹', icon: 'cloud-lightning' },
}

function getWeatherInfo(code: number) {
  return WEATHER_CODE_MAP[code] || { desc: '未知', icon: 'cloud' }
}

function getWeatherIcon(iconName: string, isDay: boolean): React.FC<React.SVGProps<SVGSVGElement>> {
  switch (iconName) {
    case 'sun': return Sun
    case 'cloud-sun': return isDay ? CloudSun : CloudMoon
    case 'cloud': return Cloud
    case 'cloud-fog': return CloudFog
    case 'cloud-rain': return CloudRain
    case 'snowflake': return Snowflake
    case 'cloud-lightning': return CloudLightning
    default: return Cloud
  }
}

// ==================== 背景渐变 ====================
function getBackgroundGradient(code: number, isDay: boolean): string {
  const w = getWeatherInfo(code).icon
  if (!isDay) {
    if (w === 'sun' || w === 'cloud-sun') return 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
    if (w === 'cloud') return 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    if (w === 'cloud-rain' || w === 'cloud-lightning') return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    if (w === 'snowflake') return 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)'
    return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
  }
  switch (w) {
    case 'sun':
      return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)'
    case 'cloud-sun':
      return 'linear-gradient(135deg, #60a5fa 0%, #93c5fd 50%, #e0f2fe 100%)'
    case 'cloud':
      return 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%)'
    case 'cloud-fog':
      return 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)'
    case 'cloud-rain':
      return 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)'
    case 'snowflake':
      return 'linear-gradient(135deg, #bae6fd 0%, #e0f2fe 50%, #f0f9ff 100%)'
    case 'cloud-lightning':
      return 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)'
    default:
      return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
  }
}

// ==================== 温度单位 ====================
type TempUnit = 'C' | 'F'

function convertTemp(celsius: number, unit: TempUnit): number {
  return unit === 'F' ? celsius * 1.8 + 32 : celsius
}

function formatTemp(celsius: number, unit: TempUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}°`
}

// ==================== 存储工具 ====================
function getFavorites(): FavoriteCity[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(list: FavoriteCity[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
}

function getSavedUnit(): TempUnit {
  try {
    const v = localStorage.getItem(UNIT_KEY)
    return v === 'F' ? 'F' : 'C'
  } catch {
    return 'C'
  }
}

// ==================== 组件 ====================
const WeatherLIVE = memo(() => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [cityInfo, setCityInfo] = useState<FavoriteCity | null>(null)
  const [search, setSearch] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    showDropdown: false,
  })
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<TempUnit>(getSavedUnit)
  const [favorites, setFavorites] = useState<FavoriteCity[]>(getFavorites)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly')

  const chartCanvasRef = useRef<HTMLCanvasElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // 保存单位设置
  useEffect(() => {
    try { localStorage.setItem(UNIT_KEY, unit) } catch { /* ignore */ }
  }, [unit])

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearch(s => ({ ...s, showDropdown: false }))
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 地理编码搜索（防抖）
  useEffect(() => {
    if (!search.query.trim()) {
      setSearch(s => ({ ...s, results: [], loading: false }))
      return
    }
    if (search.query.trim().length < 1) return

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      setSearch(s => ({ ...s, loading: true }))
      try {
        const url = `${GEOCODING_API}?name=${encodeURIComponent(search.query)}&count=5&language=zh`
        const res = await fetch(url)
        if (!res.ok) throw new Error('搜索失败')
        const data = await res.json()
        setSearch(s => ({
          ...s,
          results: data.results || [],
          loading: false,
          showDropdown: true,
        }))
      } catch {
        setSearch(s => ({ ...s, loading: false, results: [] }))
      }
    }, 350)

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [search.query])

  // 获取天气数据
  const fetchWeather = useCallback(async (lat: number, lon: number, info: FavoriteCity) => {
    setLoading(true)
    setError(null)
    try {
      const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_1m,relative_humidity_2m,apparent_temperature,precipitation&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`天气请求失败: ${res.status}`)
      const data: WeatherResponse = await res.json()
      setWeather(data)
      setCityInfo(info)
      setLastUpdate(new Date())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取天气数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [])

  // 自动定位
  useEffect(() => {
    const defaultCity: FavoriteCity = {
      name: '北京', country: '中国',
      latitude: 39.9042, longitude: 116.4074,
    }
    if (!navigator.geolocation) {
      fetchWeather(defaultCity.latitude, defaultCity.longitude, defaultCity)
        .finally(() => setGeoLoading(false))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const geoUrl = `${GEOCODING_API}?latitude=${latitude}&longitude=${longitude}&count=1&language=zh`
          const res = await fetch(geoUrl)
          if (!res.ok) throw new Error('定位查询失败')
          const data = await res.json()
          const result = data.results?.[0]
          if (result) {
            const info: FavoriteCity = {
              name: result.name,
              country: result.country || '',
              latitude: result.latitude,
              longitude: result.longitude,
            }
            await fetchWeather(latitude, longitude, info)
          } else {
            await fetchWeather(latitude, longitude, {
              ...defaultCity,
              latitude,
              longitude,
            })
          }
        } catch {
          fetchWeather(defaultCity.latitude, defaultCity.longitude, defaultCity)
        } finally {
          setGeoLoading(false)
        }
      },
      () => {
        fetchWeather(defaultCity.latitude, defaultCity.longitude, defaultCity)
          .finally(() => setGeoLoading(false))
      },
      { timeout: 8000 }
    )
  }, [fetchWeather])

  // 选择城市
  const selectCity = useCallback((geo: GeoResult) => {
    const info: FavoriteCity = {
      name: geo.name,
      country: geo.country || '',
      latitude: geo.latitude,
      longitude: geo.longitude,
    }
    setSearch(s => ({ ...s, query: '', results: [], showDropdown: false }))
    fetchWeather(geo.latitude, geo.longitude, info)
  }, [fetchWeather])

  // 选择热门/收藏城市
  const selectFavoriteCity = useCallback((c: FavoriteCity) => {
    setSearch(s => ({ ...s, query: '', results: [], showDropdown: false }))
    fetchWeather(c.latitude, c.longitude, c)
  }, [fetchWeather])

  // 切换收藏
  const toggleFavorite = useCallback(() => {
    if (!cityInfo) return
    setFavorites(prev => {
      const exists = prev.some(f =>
        f.latitude === cityInfo.latitude && f.longitude === cityInfo.longitude
      )
      let next: FavoriteCity[]
      if (exists) {
        next = prev.filter(f =>
          !(f.latitude === cityInfo.latitude && f.longitude === cityInfo.longitude)
        )
      } else {
        next = [cityInfo, ...prev].slice(0, 12)
      }
      saveFavorites(next)
      return next
    })
  }, [cityInfo])

  const isFavorite = cityInfo
    ? favorites.some(f =>
        f.latitude === cityInfo.latitude && f.longitude === cityInfo.longitude
      )
    : false

  // ============ Canvas 温度曲线 ============
  useEffect(() => {
    if (!weather || activeTab !== 'hourly') return
    const canvas = chartCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padLeft = 48
    const padRight = 16
    const padTop = 20
    const padBottom = 32
    const chartW = width - padLeft - padRight
    const chartH = height - padTop - padBottom

    // 获取未来24小时数据
    const now = new Date()
    const nowUtc = new Date(now.toISOString())
    const times = weather.hourly.time
    const temps = weather.hourly.temperature_2m

    const dataPoints: { x: number; y: number; temp: number; time: string }[] = []
    const targetCount = 24
    let startIdx = 0
    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i])
      if (t >= nowUtc) { startIdx = i; break }
      if (i === times.length - 1) startIdx = i
    }
    for (let i = startIdx; i < Math.min(startIdx + targetCount, times.length); i++) {
      dataPoints.push({
        x: 0, y: 0,
        temp: temps[i],
        time: times[i],
      })
    }
    if (dataPoints.length === 0) return

    const temps2 = dataPoints.map(d => d.temp)
    const minT = Math.min(...temps2)
    const maxT = Math.max(...temps2)
    const range = Math.max(1, maxT - minT)
    const pad = range * 0.25
    const yMin = minT - pad
    const yMax = maxT + pad
    const yRange = yMax - yMin

    dataPoints.forEach((d, i) => {
      d.x = padLeft + (i / (dataPoints.length - 1)) * chartW
      d.y = padTop + (1 - (d.temp - yMin) / yRange) * chartH
    })

    // 背景
    ctx.clearRect(0, 0, width, height)

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (i / 4) * chartH
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(width - padRight, y)
      ctx.stroke()

      // 温度标签
      const tempVal = yMax - (i / 4) * yRange
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(tempVal)}°`, padLeft - 6, y + 3)
    }

    // 填充区域（渐变）
    const bgGrad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH)
    const wCode = weather.current.weather_code
    const wInfo = getWeatherInfo(wCode)
    const wIcon = wInfo.icon

    let startColor = 'rgba(59,130,246,0.35)'
    let endColor = 'rgba(59,130,246,0.02)'
    if (wIcon === 'cloud-rain' || wIcon === 'cloud-lightning') {
      startColor = 'rgba(148,163,184,0.35)'
      endColor = 'rgba(148,163,184,0.02)'
    } else if (wIcon === 'snowflake') {
      startColor = 'rgba(186,230,253,0.5)'
      endColor = 'rgba(186,230,253,0.02)'
    } else if (wIcon === 'sun' || wIcon === 'cloud-sun') {
      startColor = 'rgba(251,191,36,0.35)'
      endColor = 'rgba(251,191,36,0.02)'
    }
    bgGrad.addColorStop(0, startColor)
    bgGrad.addColorStop(1, endColor)

    ctx.beginPath()
    ctx.moveTo(dataPoints[0].x, padTop + chartH)
    // 使用贝塞尔曲线平滑
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const p0 = dataPoints[Math.max(0, i - 1)]
      const p1 = dataPoints[i]
      const p2 = dataPoints[i + 1]
      const p3 = dataPoints[Math.min(dataPoints.length - 1, i + 2)]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
    ctx.lineTo(dataPoints[dataPoints.length - 1].x, padTop + chartH)
    ctx.closePath()
    ctx.fillStyle = bgGrad
    ctx.fill()

    // 曲线
    const lineGrad = ctx.createLinearGradient(padLeft, 0, padLeft + chartW, 0)
    if (wIcon === 'snowflake') {
      lineGrad.addColorStop(0, '#7dd3fc')
      lineGrad.addColorStop(1, '#e0f2fe')
    } else if (wIcon === 'cloud-rain' || wIcon === 'cloud-lightning') {
      lineGrad.addColorStop(0, '#94a3b8')
      lineGrad.addColorStop(1, '#cbd5e1')
    } else {
      lineGrad.addColorStop(0, '#60a5fa')
      lineGrad.addColorStop(1, '#fbbf24')
    }

    ctx.beginPath()
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const p0 = dataPoints[Math.max(0, i - 1)]
      const p1 = dataPoints[i]
      const p2 = dataPoints[i + 1]
      const p3 = dataPoints[Math.min(dataPoints.length - 1, i + 2)]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 2.5
    ctx.stroke()

    // 数据点
    dataPoints.forEach((d, i) => {
      if (i % 3 !== 0 && i !== dataPoints.length - 1) return
      ctx.beginPath()
      ctx.arc(d.x, d.y, i === 0 ? 4 : 3, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.9)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      // 温度标注
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      const label = unit === 'F'
        ? `${Math.round(d.temp * 1.8 + 32)}°`
        : `${Math.round(d.temp)}°`
      ctx.fillText(label, d.x, d.y - 10)
    })

    // X 轴时间标签
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    dataPoints.forEach((d, i) => {
      if (i % 4 !== 0) return
      const date = new Date(d.time)
      const h = date.getHours().toString().padStart(2, '0')
      ctx.fillText(`${h}:00`, d.x, height - 10)
    })
  }, [weather, unit, activeTab])

  // ============ 渲染 ============
  if (geoLoading && !weather) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100%', minHeight: 400, color: 'rgba(255,255,255,0.7)',
        flexDirection: 'column', gap: 16,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        borderRadius: 12,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: '#60a5fa',
          borderRadius: '50%',
          animation: 'wl_spin 1s linear infinite',
        }} />
        <span style={{ fontSize: 14 }}>正在获取位置与天气数据...</span>
        <style>{`@keyframes wl_spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!weather || !cityInfo) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100%', minHeight: 400,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 12,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>暂无数据</span>
      </div>
    )
  }

  const current = weather.current
  const isDay = current.is_day === 1
  const bgGradient = getBackgroundGradient(current.weather_code, isDay)
  const wInfo = getWeatherInfo(current.weather_code)
  const CurrentIcon = getWeatherIcon(wInfo.icon, isDay)

  const todayIdx = 0
  const todayDaily = {
    max: weather.daily.temperature_2m_max[todayIdx],
    min: weather.daily.temperature_2m_min[todayIdx],
    code: weather.daily.weather_code[todayIdx],
    precip: weather.daily.precipitation_sum[todayIdx],
    sunrise: weather.daily.sunrise[todayIdx],
    sunset: weather.daily.sunset[todayIdx],
  }

  const tempValue = unit === 'F'
    ? Math.round(current.temperature_2m * 1.8 + 32)
    : Math.round(current.temperature_2m)

  return (
    <div style={{
      padding: 20,
      minHeight: '100%',
      boxSizing: 'border-box',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: bgGradient,
      borderRadius: 12,
      transition: 'background 0.8s ease',
      overflowY: 'auto',
    }}>
      {/* 顶部搜索栏 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div ref={searchContainerRef} style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 14,
            padding: '4px 12px',
          }}>
            <Search size={16} color="rgba(255,255,255,0.7)" />
            <input
              type="text"
              value={search.query}
              onChange={e => setSearch(s => ({ ...s, query: e.target.value }))}
              onFocus={() => { if (search.query) setSearch(s => ({ ...s, showDropdown: true })) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.results.length > 0) {
                  selectCity(search.results[0])
                }
              }}
              placeholder="搜索全球城市..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', padding: '10px 10px', fontSize: 14,
                minWidth: 0,
              }}
            />
            {search.query && (
              <button
                onClick={() => setSearch(s => ({ ...s, query: '', results: [], showDropdown: false }))}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* 搜索下拉 */}
          {search.showDropdown && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              background: 'rgba(30,41,59,0.92)',
              backdropFilter: 'blur(20px)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              padding: '6px 0',
              maxHeight: 280,
              overflowY: 'auto',
            }}>
              {search.loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  搜索中...
                </div>
              ) : search.results.length === 0 && search.query.trim() ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  无匹配结果
                </div>
              ) : (
                search.results.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => selectCity(r)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background 0.15s',
                      fontSize: 13,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <MapPin size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{r.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.admin1 ? `${r.admin1}, ` : ''}{r.country}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 单位切换 */}
        <button
          onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 12,
            padding: '10px 16px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            minWidth: 54,
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          °{unit}
        </button>

        {/* 刷新 */}
        <button
          onClick={() => fetchWeather(cityInfo.latitude, cityInfo.longitude, cityInfo)}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 12,
            padding: '10px 12px',
            color: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.5 : 1,
            display: 'flex', alignItems: 'center',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} style={{ animation: loading ? 'wl_spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.2)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 16,
          color: '#fecaca',
          fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <X size={16} />
          {error}
        </div>
      )}

      {/* 主天气卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 22,
        padding: '24px',
        marginBottom: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <MapPin size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: 20, fontWeight: 700 }}>{cityInfo.name}</span>
              {cityInfo.country && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{cityInfo.country}</span>
              )}
              <button
                onClick={toggleFavorite}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isFavorite ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                  padding: 4, display: 'flex',
                }}
              >
                <Star size={16} fill={isFavorite ? '#fbbf24' : 'none'} />
              </button>
            </div>
            {lastUpdate && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>
                更新于 {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                {!isDay && ' · 夜间'}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 72, fontWeight: 200, lineHeight: 1, letterSpacing: -4 }}>
                  {tempValue}
                </span>
                <span style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.7)' }}>°{unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72 }}>
                <CurrentIcon width={64} height={64} strokeWidth={1.2} style={{ color: '#fff', opacity: 0.95 }} />
              </div>
            </div>
            <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.95)', marginTop: 4, fontWeight: 500 }}>
              {wInfo.desc}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              体感 {formatTemp(current.apparent_temperature, unit)}{unit === 'F' ? 'F' : 'C'}
              {' · '}
              最高 {formatTemp(todayDaily.max, unit)}
              {' / '}
              最低 {formatTemp(todayDaily.min, unit)}
            </div>
          </div>
        </div>
      </div>

      {/* 详细指标 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}>
        {[
          { icon: Thermometer, label: '体感温度', value: `${formatTemp(current.apparent_temperature, unit)}${unit}`, color: '#fb923c' },
          { icon: Droplets, label: '湿度', value: `${current.relative_humidity_2m}%`, color: '#38bdf8' },
          { icon: Wind, label: '风速', value: `${current.wind_speed_1m} km/h`, color: '#a3e635' },
          { icon: Umbrella, label: '降水量', value: `${current.precipitation} mm`, color: '#818cf8' },
          { icon: Sunrise, label: '日出', value: todayDaily.sunrise?.split('T')[1] || '--:--', color: '#fbbf24' },
          { icon: Sunset, label: '日落', value: todayDaily.sunset?.split('T')[1] || '--:--', color: '#f97316' },
        ].map(item => (
          <div
            key={item.label}
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16,
              padding: '14px 14px',
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <item.icon size={20} color={item.color} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 24小时温度曲线 */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 20,
        padding: '20px 20px 12px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Thermometer size={16} color="#fbbf24" />
            24小时温度趋势
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['hourly', 'daily'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'hourly' ? '温度曲线' : '7日概览'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 180 }}>
          {activeTab === 'hourly' ? (
            <canvas ref={chartCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          ) : (
            <div style={{
              display: 'flex', gap: 6, height: '100%', alignItems: 'center',
              overflowX: 'auto', paddingBottom: 4,
            }}>
              {weather.daily.time.map((dateStr, i) => {
                const d = new Date(dateStr)
                const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
                const dailyInfo = getWeatherInfo(weather.daily.weather_code[i])
                const DIcon = getWeatherIcon(dailyInfo.icon, true)
                const maxT = weather.daily.temperature_2m_max[i]
                const minT = weather.daily.temperature_2m_min[i]
                return (
                  <div
                    key={i}
                    style={{
                      minWidth: 78, flexShrink: 0,
                      background: i === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: i === 0 ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                      {i === 0 ? '今天' : dayName}
                    </div>
                    <DIcon width={26} height={26} style={{ color: '#fff', margin: '0 auto 6px', display: 'block' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                      {formatTemp(maxT, unit)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                      {formatTemp(minT, unit)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7天预报 */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Navigation size={16} color="#60a5fa" />
          7日天气预报
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {weather.daily.time.map((dateStr, i) => {
            const d = new Date(dateStr)
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            const dayName = weekdays[d.getDay()]
            const dailyInfo = getWeatherInfo(weather.daily.weather_code[i])
            const DIcon = getWeatherIcon(dailyInfo.icon, true)
            const maxT = weather.daily.temperature_2m_max[i]
            const minT = weather.daily.temperature_2m_min[i]
            const precip = weather.daily.precipitation_sum[i]
            const isToday = i === 0

            const allMax = weather.daily.temperature_2m_max
            const allMin = weather.daily.temperature_2m_min
            const gMax = Math.max(...allMax)
            const gMin = Math.min(...allMin)
            const gRange = Math.max(1, gMax - gMin)
            const leftPct = ((minT - gMin) / gRange) * 100
            const widthPct = Math.max(8, ((maxT - minT) / gRange) * 100)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: isToday ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                  borderRadius: 14,
                  border: isToday ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ width: 60, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{isToday ? '今天' : dayName}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                    {d.getMonth() + 1}/{d.getDate()}
                  </div>
                </div>
                <DIcon width={24} height={24} style={{ flexShrink: 0, color: '#fff' }} />
                <div style={{ width: 50, fontSize: 12, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                  {dailyInfo.desc}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {formatTemp(minT, unit)}
                  </span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', position: 'relative', minWidth: 40 }}>
                    <div style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: 0,
                      height: '100%',
                      width: `${widthPct}%`,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #60a5fa, #fbbf24)',
                      minWidth: 6,
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', width: 36, flexShrink: 0 }}>
                    {formatTemp(maxT, unit)}
                  </span>
                </div>
                <div style={{ width: 60, textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  {precip > 0 ? (
                    <>
                      <Droplets size={12} color="#7dd3fc" />
                      <span style={{ fontSize: 11, color: '#7dd3fc' }}>{precip}mm</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 热门城市 & 收藏 */}
      {(favorites.length > 0 || POPULAR_CITIES.length > 0) && (
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}>
          {favorites.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                收藏城市
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {favorites.map((f) => (
                  <button
                    key={`${f.latitude}-${f.longitude}`}
                    onClick={() => selectFavoriteCity(f)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(251,191,36,0.2)',
                      border: '1px solid rgba(251,191,36,0.35)',
                      borderRadius: 20,
                      padding: '8px 14px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.35)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.2)')}
                  >
                    <MapPin size={12} />
                    {f.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} color="#60a5fa" />
            热门城市
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {POPULAR_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => selectFavoriteCity(c)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 20,
                  padding: '8px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.22)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 加载中遮罩 */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, pointerEvents: 'none',
        }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'wl_spin 0.8s linear infinite',
          }} />
        </div>
      )}

      <style>{`@keyframes wl_spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

WeatherLIVE.displayName = 'WeatherLIVE'

export default WeatherLIVE