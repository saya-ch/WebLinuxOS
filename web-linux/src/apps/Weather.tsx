import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { useStore } from '../store'
import {
  Droplets,
  Gauge,
  Wind,
  Compass,
  Thermometer,
  Sunrise,
  Sunset,
  Sun,
  Eye,
  CloudRain,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  SunMedium,
  Cloud,
  CloudSun,
  CloudMoon,
  Snowflake,
  CloudLightning,
  Navigation,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  relativeHumidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  weatherCode: number
  visibility: number
  uvIndex: number
  isDay: boolean
}

interface HourlyForecast {
  time: string
  temperature: number
  weatherCode: number
  windSpeed: number
  precipitation: number
  precipitationProbability: number
  isDay: boolean
}

interface DailyForecast {
  date: string
  temperatureMax: number
  temperatureMin: number
  weatherCode: number
  sunrise: string
  sunset: string
  uvIndexMax: number
  precipitationSum: number
  precipitationProbabilityMax: number
  windSpeedMax: number
}

interface CityInfo {
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

interface CachedData {
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  timestamp: number
}

// ==================== 常量 ====================
const DEFAULT_CITIES: CityInfo[] = [
  { name: '北京', country: '中国', admin1: '北京市', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', country: '中国', admin1: '上海市', latitude: 31.2304, longitude: 121.4737 },
  { name: '深圳', country: '中国', admin1: '广东省', latitude: 22.5431, longitude: 114.0579 },
  { name: '东京', country: '日本', latitude: 35.6762, longitude: 139.6503 },
  { name: '纽约', country: '美国', admin1: '纽约州', latitude: 40.7128, longitude: -74.0060 },
  { name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278 },
]

const STORAGE_KEY = 'weblinux-weather-city'
const UNIT_KEY = 'weblinux-weather-unit'
const CACHE_TTL = 10 * 60 * 1000 // 10 分钟缓存

// ==================== 缓存 ====================
const weatherCache = new Map<string, CachedData>()

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}}`
}

function getCache(lat: number, lon: number): CachedData | null {
  const key = getCacheKey(lat, lon)
  const cached = weatherCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached
  }
  weatherCache.delete(key)
  return null
}

function setCache(lat: number, lon: number, data: Omit<CachedData, 'timestamp'>): void {
  const key = getCacheKey(lat, lon)
  weatherCache.set(key, { ...data, timestamp: Date.now() })
}

// ==================== 温度单位 ====================
type TempUnit = 'C' | 'F'

function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === 'F') return celsius * 1.8 + 32
  return celsius
}

function formatTemp(celsius: number, unit: TempUnit): string {
  const val = convertTemp(celsius, unit)
  return `${Math.round(val)}°${unit}`
}

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

function getWeatherLucideIcon(code: number, isDay = true) {
  if (code === 0) return isDay ? Sun : Moon
  if (code <= 2) return isDay ? CloudSun : CloudMoon
  if (code === 3) return Cloud
  if (code <= 48) return Cloud
  if (code <= 67) return CloudRain
  if (code <= 77) return Snowflake
  if (code <= 82) return CloudRain
  if (code <= 86) return Snowflake
  if (code <= 99) return CloudLightning
  return Cloud
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

function getWindDirectionText(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const idx = Math.round(((deg % 360) / 45)) % 8
  return dirs[idx]
}

function formatDate(dateStr: string, index: number): string {
  if (index === 0) return '今天'
  if (index === 1) return '明天'
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]}`
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatHour(timeStr: string): string {
  const date = new Date(timeStr)
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

function getUVLevel(uv: number): string {
  if (uv <= 2) return '低'
  if (uv <= 5) return '中等'
  if (uv <= 7) return '高'
  if (uv <= 10) return '很高'
  return '极高'
}

function getUVColor(uv: number): string {
  if (uv <= 2) return '#10b981'
  if (uv <= 5) return '#f59e0b'
  if (uv <= 7) return '#f97316'
  if (uv <= 10) return '#ef4444'
  return '#8b5cf6'
}

// ==================== 温度趋势 Sparkline ====================
function TemperatureSparkline({ highs, lows, unit }: { highs: number[]; lows: number[]; unit: TempUnit }) {
  const width = 600
  const height = 120
  const padding = 24
  if (highs.length === 0) return null

  const allVals = [...highs.map((v) => convertTemp(v, unit)), ...lows.map((v) => convertTemp(v, unit))]
  const min = Math.min(...allVals) - 2
  const max = Math.max(...allVals) + 2
  const range = max - min || 1

  const stepX = (width - padding * 2) / (highs.length - 1)

  const convertedHighs = highs.map((v) => convertTemp(v, unit))
  const convertedLows = lows.map((v) => convertTemp(v, unit))

  const buildPath = (values: number[]) =>
    values.map((v, i) => {
      const x = padding + i * stepX
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')

  const buildAreaPath = (highValues: number[], lowValues: number[]) => {
    const highPath = highValues.map((v, i) => {
      const x = padding + i * stepX
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    const lowPath = [...lowValues].reverse().map((v, i) => {
      const x = padding + (lowValues.length - 1 - i) * stepX
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `L ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    return [...highPath, ...lowPath, 'Z'].join(' ')
  }

  const highPath = buildPath(convertedHighs)
  const lowPath = buildPath(convertedLows)
  const areaPath = buildAreaPath(convertedHighs, convertedLows)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={padding}
          x2={width - padding}
          y1={padding + ((height - padding * 2) / 4) * i}
          y2={padding + ((height - padding * 2) / 4) * i}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}
      <path d={areaPath} fill="url(#tempGradient)" />
      <path d={highPath} fill="none" stroke="#ff7a59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={lowPath} fill="none" stroke="#5ac8fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {convertedHighs.map((v, i) => {
        const x = padding + i * stepX
        const y = height - padding - ((v - min) / range) * (height - padding * 2)
        return (
          <g key={`h-${i}`}>
            <circle cx={x} cy={y} r="4" fill="#ff7a59" />
            <text x={x} y={y - 10} fill="#ff7a59" fontSize="11" textAnchor="middle" fontWeight="600">
              {Math.round(v)}°
            </text>
          </g>
        )
      })}
      {convertedLows.map((v, i) => {
        const x = padding + i * stepX
        const y = height - padding - ((v - min) / range) * (height - padding * 2)
        return <circle key={`l-${i}`} cx={x} cy={y} r="3" fill="#5ac8fa" />
      })}
    </svg>
  )
}

// ==================== 小时预报组件 ====================
function HourlyForecastList({ hourly, unit }: { hourly: HourlyForecast[]; unit: TempUnit }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const currentHour = now.getHours()

  const displayHours = hourly.filter((h) => {
    const hourDate = new Date(h.time)
    return hourDate.getHours() >= currentHour || hourDate > now
  }).slice(0, 24)

  if (displayHours.length === 0) return null

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '4px 2px 12px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--scrollbar-thumb) transparent',
      }}
    >
      {displayHours.map((hour, i) => {
        const hourDate = new Date(hour.time)
        const isNow = hourDate.getHours() === currentHour && i === 0
        const WeatherIcon = getWeatherLucideIcon(hour.weatherCode, hour.isDay)

        return (
          <div
            key={hour.time}
            style={{
              flex: '0 0 auto',
              width: 64,
              padding: '12px 8px',
              borderRadius: 12,
              background: isNow
                ? 'linear-gradient(180deg, var(--accent-bg) 0%, transparent 100%)'
                : 'var(--glass-bg)',
              border: `1px solid ${isNow ? 'var(--accent)' : 'var(--glass-border)'}`,
              textAlign: 'center',
              transition: 'all 0.2s ease',
              animation: `fadeSlideUp 0.4s ease-out ${i * 0.03}s both`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: isNow ? 'var(--accent)' : 'var(--text-secondary)',
                marginBottom: 8,
                fontWeight: isNow ? 600 : 400,
              }}
            >
              {isNow ? '现在' : formatHour(hour.time)}
            </div>
            <div
              style={{
                fontSize: 20,
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <WeatherIcon size={20} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {formatTemp(hour.temperature, unit)}
            </div>
            {hour.precipitationProbability > 0 && (
              <div style={{ fontSize: 10, color: '#5ac8fa', fontWeight: 500 }}>
                {Math.round(hour.precipitationProbability)}%
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ==================== 信息卡片组件 ====================
function InfoCard({
  icon,
  label,
  value,
  subValue,
  accentColor,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  accentColor?: string
  delay?: number
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `fadeSlideUp 0.4s ease-out ${delay}s both`,
      }}
      className="hover-lift"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          color: accentColor || 'var(--text-secondary)',
        }}
      >
        {icon}
        <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
      {subValue && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{subValue}</div>}
    </div>
  )
}

// ==================== 主组件 ====================
const Weather = memo(function Weather() {
  const [cities, setCities] = useState<CityInfo[]>(DEFAULT_CITIES)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<DailyForecast[]>([])
  const [hourly, setHourly] = useState<HourlyForecast[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CityInfo[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [unit, setUnit] = useState<TempUnit>(() => {
    try {
      const saved = localStorage.getItem(UNIT_KEY)
      if (saved === 'F') return 'F'
    } catch {}
    return 'C'
  })

  const [geoLoading, setGeoLoading] = useState(false)

  const addNotification = useStore((s) => s.addNotification)

  // 切换温度单位
  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next = prev === 'C' ? 'F' : 'C'
      try { localStorage.setItem(UNIT_KEY, next) } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved: { name: string; country: string; latitude: number; longitude: number } = JSON.parse(raw)
        const idx = cities.findIndex(
          (c) => Math.abs(c.latitude - saved.latitude) < 0.1 && Math.abs(c.longitude - saved.longitude) < 0.1
        )
        if (idx >= 0) {
          setSelectedIndex(idx)
        } else {
          const newCity: CityInfo = {
            name: saved.name,
            country: saved.country,
            latitude: saved.latitude,
            longitude: saved.longitude,
          }
          setCities((prev) => [newCity, ...prev])
          setSelectedIndex(0)
        }
      }
    } catch {
      // 忽略存储错误
    }
  }, [])

  const saveDefaultCity = useCallback((city: CityInfo) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name: city.name,
          country: city.country,
          latitude: city.latitude,
          longitude: city.longitude,
        })
      )
    } catch {
      // 忽略
    }
  }, [])

  const fetchWeather = useCallback(
    async (city: CityInfo, forceRefresh = false) => {
      // 检查缓存
      if (!forceRefresh) {
        const cached = getCache(city.latitude, city.longitude)
        if (cached) {
          setCurrent(cached.current)
          setHourly(cached.hourly)
          setForecast(cached.daily)
          setLastUpdated(new Date(cached.timestamp))
          return
        }
      }

      setLoading(true)
      setError(null)
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl,weather_code,visibility,uv_index,is_day` +
          `&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation,precipitation_probability,is_day` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
          `&timezone=auto&forecast_days=7`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        const cur: CurrentWeather = {
          temperature: data.current?.temperature_2m ?? 0,
          apparentTemperature: data.current?.apparent_temperature ?? 0,
          relativeHumidity: data.current?.relative_humidity_2m ?? 0,
          windSpeed: data.current?.wind_speed_10m ?? 0,
          windDirection: data.current?.wind_direction_10m ?? 0,
          pressure: data.current?.pressure_msl ?? 0,
          weatherCode: data.current?.weather_code ?? 0,
          visibility: (data.current?.visibility ?? 0) / 1000,
          uvIndex: data.current?.uv_index ?? 0,
          isDay: data.current?.is_day === 1,
        }

        const hourlyData: HourlyForecast[] = (data.hourly?.time ?? []).map((d: string, i: number) => ({
          time: d,
          temperature: data.hourly?.temperature_2m?.[i] ?? 0,
          weatherCode: data.hourly?.weather_code?.[i] ?? 0,
          windSpeed: data.hourly?.wind_speed_10m?.[i] ?? 0,
          precipitation: data.hourly?.precipitation?.[i] ?? 0,
          precipitationProbability: data.hourly?.precipitation_probability?.[i] ?? 0,
          isDay: data.hourly?.is_day?.[i] === 1,
        }))

        const daily: DailyForecast[] = (data.daily?.time ?? []).map((d: string, i: number) => ({
          date: d,
          temperatureMax: data.daily?.temperature_2m_max?.[i] ?? 0,
          temperatureMin: data.daily?.temperature_2m_min?.[i] ?? 0,
          weatherCode: data.daily?.weather_code?.[i] ?? 0,
          sunrise: data.daily?.sunrise?.[i] ?? '',
          sunset: data.daily?.sunset?.[i] ?? '',
          uvIndexMax: data.daily?.uv_index_max?.[i] ?? 0,
          precipitationSum: data.daily?.precipitation_sum?.[i] ?? 0,
          precipitationProbabilityMax: data.daily?.precipitation_probability_max?.[i] ?? 0,
          windSpeedMax: data.daily?.wind_speed_10m_max?.[i] ?? 0,
        }))

        setCurrent(cur)
        setHourly(hourlyData)
        setForecast(daily)
        setLastUpdated(new Date())

        // 写入缓存
        setCache(city.latitude, city.longitude, { current: cur, hourly: hourlyData, daily })
      } catch (err) {
        const msg = err instanceof Error ? err.message : '请求失败'
        setError(`天气数据获取失败：${msg}`)
        addNotification({ title: '天气', message: '天气数据获取失败', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [addNotification]
  )

  useEffect(() => {
    const city = cities[selectedIndex]
    if (city) {
      fetchWeather(city)
      saveDefaultCity(city)
    }
  }, [selectedIndex, cities, fetchWeather, saveDefaultCity])

  // 防抖搜索 - 自动完成
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=zh`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const results: CityInfo[] = (data.results ?? []).map(
          (r: { name: string; country: string; admin1?: string; latitude: number; longitude: number }) => ({
            name: r.name,
            country: r.country || '',
            admin1: r.admin1,
            latitude: r.latitude,
            longitude: r.longitude,
          })
        )
        setSearchResults(results)
      } catch {
        // 静默失败，自动完成不显示错误
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setError(null)
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=zh`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const results: CityInfo[] = (data.results ?? []).map(
        (r: { name: string; country: string; admin1?: string; latitude: number; longitude: number }) => ({
          name: r.name,
          country: r.country || '',
          admin1: r.admin1,
          latitude: r.latitude,
          longitude: r.longitude,
        })
      )
      setSearchResults(results)
      if (results.length === 0) {
        setError('未找到匹配的城市')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`搜索失败：${msg}`)
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  // 地理定位
  const handleGeolocate = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理定位功能')
      return
    }
    setGeoLoading(true)
    setError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        })
      })
      const { latitude, longitude } = pos.coords

      // 反向地理编码 - 用 Open-Meteo geocoding 的 reverse 模式
      // Open-Meteo 没有 reverse geocoding，所以我们用 forecast API 中的 timezone 来推断，
      // 或者直接添加坐标作为城市
      let cityName = '当前位置'
      let countryName = ''
      let adminName = ''

      // 尝试用 geocoding 搜索附近的已知城市来获取名称
      try {
        // 使用一个粗略的方式：获取天气数据中的 timezone 推断位置
        const tzUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
        const tzRes = await fetch(tzUrl)
        if (tzRes.ok) {
          const tzData = await tzRes.json()
          const timezone = tzData.timezone || ''
          // 从时区提取城市名 (如 "Asia/Shanghai" -> "Shanghai")
          const parts = timezone.split('/')
          if (parts.length >= 2) {
            cityName = parts[parts.length - 1].replace(/_/g, ' ')
          }
        }
      } catch {
        // 无法获取名称，使用默认
      }

      const geoCity: CityInfo = {
        name: cityName,
        country: countryName,
        admin1: adminName || undefined,
        latitude,
        longitude,
      }

      selectCity(geoCity)
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === 1) setError('定位权限被拒绝，请在浏览器设置中允许定位')
        else if (err.code === 2) setError('无法获取位置信息')
        else if (err.code === 3) setError('定位请求超时')
        else setError('定位失败')
      } else {
        setError('定位失败')
      }
    } finally {
      setGeoLoading(false)
    }
  }, [])

  const selectCity = useCallback(
    (city: CityInfo, fromSearch = false) => {
      const existingIdx = cities.findIndex(
        (c) => Math.abs(c.latitude - city.latitude) < 0.01 && Math.abs(c.longitude - city.longitude) < 0.01
      )
      if (existingIdx >= 0) {
        setSelectedIndex(existingIdx)
      } else {
        setCities((prev) => [city, ...prev])
        setSelectedIndex(0)
      }
      if (fromSearch) {
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
      }
    },
    [cities]
  )

  const removeCity = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation()
      if (cities.length <= 1) return
      setCities((prev) => prev.filter((_, i) => i !== index))
      if (index === selectedIndex) {
        setSelectedIndex(0)
      } else if (index < selectedIndex) {
        setSelectedIndex((prev) => prev - 1)
      }
    },
    [cities, selectedIndex]
  )

  const highs = forecast.map((f) => f.temperatureMax)
  const lows = forecast.map((f) => f.temperatureMin)
  const currentCity = cities[selectedIndex]
  const todayForecast = forecast[0]

  // 缓存是否在有效期内
  const cacheInfo = currentCity ? getCache(currentCity.latitude, currentCity.longitude) : null
  const isCacheValid = cacheInfo !== null

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 20,
        background:
          'linear-gradient(180deg, var(--window-bg) 0%, var(--desktop-bg) 100%)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes weatherIconFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.02);
          }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .weather-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .weather-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .weather-scroll::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 3px;
        }
        .weather-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
        }
        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.25s ease,
                      border-color 0.25s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .city-chip {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .city-chip:hover {
          transform: translateY(-1px);
        }
        .search-result-item {
          transition: all 0.15s ease;
        }
        .search-result-item:hover {
          background: var(--accent-bg);
          transform: translateX(4px);
        }
        .temp-number {
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* 搜索和城市切换区域 */}
      <div
        style={{
          marginBottom: 20,
          animation: 'fadeSlideUp 0.4s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索城市（自动完成）..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              onBlur={() => {
                // 延迟关闭，以允许点击搜索结果
                setTimeout(() => setShowSearch(false), 200)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              className="app-input"
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 13,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
              }}
            />
            {searching && searchQuery.trim() && (
              <RefreshCw
                size={14}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="app-button"
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
              color: '#fff',
              border: 'none',
              cursor: searching ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={14} />
            搜索
          </button>
          <button
            onClick={handleGeolocate}
            disabled={geoLoading}
            className="app-button"
            title="使用当前位置"
            style={{
              padding: '10px',
              borderRadius: 12,
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: geoLoading ? 'wait' : 'pointer',
              fontSize: 13,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {geoLoading ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Navigation size={14} />
            )}
          </button>
        </div>

        {/* 搜索结果（自动完成） */}
        {showSearch && searchResults.length > 0 && (
          <div
            style={{
              marginBottom: 12,
              padding: 8,
              borderRadius: 12,
              background: 'var(--window-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-medium)',
              animation: 'fadeSlideUp 0.25s ease-out',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                padding: '0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500,
              }}
            >
              搜索结果
            </div>
            {searchResults.map((city, i) => (
              <button
                key={`sr-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectCity(city, true)
                }}
                className="search-result-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  marginBottom: 2,
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{city.name}</span>
                  {city.admin1 && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 6, fontSize: 12 }}>
                      {city.admin1}
                    </span>
                  )}
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 6, fontSize: 12 }}>
                    {city.country}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 城市切换 chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {cities.map((city, i) => (
            <div
              key={`${city.name}-${i}`}
              className="city-chip"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                border:
                  i === selectedIndex
                    ? '1px solid var(--accent)'
                    : '1px solid var(--glass-border)',
                background:
                  i === selectedIndex
                    ? 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(155, 138, 240, 0.1) 100%)'
                    : 'var(--glass-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: i === selectedIndex ? 600 : 400,
                backdropFilter: 'blur(10px)',
              }}
              onClick={() => setSelectedIndex(i)}
            >
              {i === selectedIndex && (
                <MapPin size={12} style={{ color: 'var(--accent)' }} />
              )}
              <span>
                {city.name}
                {city.admin1 ? ` · ${city.admin1}` : city.country ? ` · ${city.country}` : ''}
              </span>
              {cities.length > 1 && (
                <button
                  onClick={(e) => removeCity(i, e)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    lineHeight: 1,
                    padding: 0,
                    opacity: i === selectedIndex ? 1 : 0,
                    transition: 'opacity 0.2s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.color = 'var(--error)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = i === selectedIndex ? '1' : '0'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => fetchWeather(currentCity, true)}
            disabled={loading}
            className="app-button city-chip"
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backdropFilter: 'blur(10px)',
            }}
          >
            <RefreshCw
              size={12}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
            {loading ? '刷新中' : '刷新'}
          </button>
          {/* 温度单位切换 */}
          <button
            onClick={toggleUnit}
            className="app-button city-chip"
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backdropFilter: 'blur(10px)',
              fontWeight: 500,
            }}
          >
            <Thermometer size={12} />
            °{unit === 'C' ? 'C' : 'F'} / °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && !loading && (
        <div
          style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 12,
            background: 'var(--error-bg)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeSlideUp 0.3s ease-out',
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* 加载中覆盖层（已有数据时刷新） */}
      {loading && current && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, var(--accent), #a29bfe)',
            zIndex: 10,
            animation: 'gradientShift 2s ease infinite',
            backgroundSize: '200% 200%',
          }}
        />
      )}

      {/* 当前天气概览 */}
      {current && currentCity && (
        <div
          style={{
            position: 'relative',
            padding: 28,
            marginBottom: 20,
            borderRadius: 20,
            background:
              'linear-gradient(135deg, rgba(155, 138, 240, 0.15) 0%, rgba(79, 70, 229, 0.08) 100%)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            animation: 'fadeSlideUp 0.5s ease-out 0.1s both',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
              opacity: 0.1,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #00d6c1 0%, transparent 70%)',
              opacity: 0.08,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MapPin size={14} style={{ color: 'var(--accent)' }} />
            {currentCity.name}
            {currentCity.country ? `, ${currentCity.country}` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
            <div
              style={{
                fontSize: 80,
                lineHeight: 1,
                animation: 'weatherIconFloat 4s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.2))',
              }}
            >
              {getWeatherIcon(current.weatherCode, current.isDay)}
            </div>
            <div style={{ flex: 1 }}>
              <div
                className="temp-number"
                style={{
                  fontSize: 56,
                  fontWeight: 200,
                  lineHeight: 1.1,
                  letterSpacing: '-2px',
                }}
              >
                {formatTemp(current.temperature, unit)}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                }}
              >
                {getWeatherDescription(current.weatherCode)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                体感温度 {formatTemp(current.apparentTemperature, unit)}
              </div>
              {lastUpdated && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: 0.7,
                  }}
                >
                  <Clock size={11} />
                  更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  {isCacheValid && !loading && (
                    <span style={{ marginLeft: 4, color: 'var(--accent)', opacity: 0.7 }}>
                      (缓存)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 小时预报 */}
      {hourly.length > 0 && (
        <div
          style={{
            padding: 18,
            marginBottom: 20,
            borderRadius: 16,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeSlideUp 0.4s ease-out 0.15s both',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-primary)',
            }}
          >
            <Clock size={16} style={{ color: 'var(--accent)' }} />
            24小时预报
          </div>
          <HourlyForecastList hourly={hourly} unit={unit} />
        </div>
      )}

      {/* 详细信息卡片网格 */}
      {current && todayForecast && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <InfoCard
            icon={<Droplets size={18} />}
            label="湿度"
            value={`${current.relativeHumidity}%`}
            subValue={current.relativeHumidity > 70 ? '较潮湿' : current.relativeHumidity < 30 ? '干燥' : '舒适'}
            delay={0.2}
          />
          <InfoCard
            icon={<Wind size={18} />}
            label="风速"
            value={`${Math.round(current.windSpeed)} km/h`}
            subValue={`${getWindDirectionText(current.windDirection)}风`}
            delay={0.23}
          />
          <InfoCard
            icon={<Gauge size={18} />}
            label="气压"
            value={`${Math.round(current.pressure)} hPa`}
            delay={0.26}
          />
          <InfoCard
            icon={<Eye size={18} />}
            label="能见度"
            value={`${current.visibility.toFixed(1)} km`}
            subValue={current.visibility >= 10 ? '优' : current.visibility >= 5 ? '良好' : '一般'}
            delay={0.29}
          />
          <InfoCard
            icon={<SunMedium size={18} style={{ color: getUVColor(current.uvIndex) }} />}
            label="紫外线"
            value={`${current.uvIndex.toFixed(1)}`}
            subValue={getUVLevel(current.uvIndex)}
            accentColor={getUVColor(current.uvIndex)}
            delay={0.32}
          />
          <InfoCard
            icon={<Compass size={18} />}
            label="风向"
            value={getWindDirectionText(current.windDirection)}
            subValue={`${Math.round(current.windDirection)}°`}
            delay={0.35}
          />
        </div>
      )}

      {/* 日出日落卡片 */}
      {todayForecast && todayForecast.sunrise && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
            animation: 'fadeSlideUp 0.4s ease-out 0.3s both',
          }}
        >
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
            className="hover-lift"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                color: '#f59e0b',
              }}
            >
              <Sunrise size={20} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>日出</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatTime(todayForecast.sunrise)}
            </div>
          </div>
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
            className="hover-lift"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                color: '#8b5cf6',
              }}
            >
              <Sunset size={20} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>日落</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatTime(todayForecast.sunset)}
            </div>
          </div>
        </div>
      )}

      {/* 温度趋势 */}
      {forecast.length > 0 && (
        <div
          style={{
            padding: 18,
            marginBottom: 20,
            borderRadius: 16,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeSlideUp 0.4s ease-out 0.35s both',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-primary)',
            }}
          >
            <Thermometer size={16} style={{ color: 'var(--accent)' }} />
            未来 7 天温度趋势
          </div>
          <TemperatureSparkline highs={highs} lows={lows} unit={unit} />
          <div
            style={{
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              marginTop: 12,
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 2,
                  background: '#ff7a59',
                  display: 'inline-block',
                  borderRadius: 1,
                }}
              />
              最高温
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 2,
                  background: '#5ac8fa',
                  display: 'inline-block',
                  borderRadius: 1,
                }}
              />
              最低温
            </span>
          </div>
        </div>
      )}

      {/* 7 天预报列表 */}
      {forecast.length > 0 && (
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeSlideUp 0.4s ease-out 0.4s both',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-primary)',
            }}
          >
            <CloudSun size={16} style={{ color: 'var(--accent)' }} />
            未来 7 天预报
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {forecast.map((day, i) => {
              const WeatherIcon = getWeatherLucideIcon(day.weatherCode, true)
              return (
                <div
                  key={day.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'transparent',
                    transition: 'background 0.15s ease',
                    animation: `fadeSlideUp 0.3s ease-out ${0.4 + i * 0.05}s both`,
                  }}
                  className="hover-lift"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      fontSize: 12,
                      color: i === 0 ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: i === 0 ? 600 : 500,
                      flexShrink: 0,
                    }}
                  >
                    {formatDate(day.date, i)}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      width: 32,
                      textAlign: 'center',
                      flexShrink: 0,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <WeatherIcon size={22} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      minWidth: 0,
                    }}
                  >
                    {getWeatherDescription(day.weatherCode)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#5ac8fa',
                      minWidth: 36,
                      textAlign: 'right',
                      fontWeight: 500,
                    }}
                  >
                    {formatTemp(day.temperatureMin, unit)}
                  </div>
                  <div
                    style={{
                      width: '30%',
                      maxWidth: 100,
                      height: 4,
                      background: 'linear-gradient(to right, #5ac8fa, #ff7a59)',
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: '#ff7a59',
                      minWidth: 36,
                      textAlign: 'right',
                      fontWeight: 600,
                    }}
                  >
                    {formatTemp(day.temperatureMax, unit)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading 空态 */}
      {loading && !current && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{
              fontSize: 56,
              marginBottom: 16,
              animation: 'spin 2s linear infinite',
              opacity: 0.6,
            }}
          >
            ⛅
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>正在加载天气数据...</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>请稍候</div>
        </div>
      )}

      {/* 空态 - 无数据且无加载 */}
      {!loading && !current && !error && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-secondary)',
            animation: 'fadeSlideUp 0.4s ease-out',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>🌤️</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>选择一个城市查看天气</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>在上方搜索框中搜索城市，或点击定位按钮</div>
        </div>
      )}
    </div>
  )
})

export default Weather
