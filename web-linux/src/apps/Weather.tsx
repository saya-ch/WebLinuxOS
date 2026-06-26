import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../store'
import { Droplets, Gauge, Wind, Compass, Thermometer } from 'lucide-react'

// ==================== 类型定义 ====================
interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  relativeHumidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  weatherCode: number
}

interface DailyForecast {
  date: string
  temperatureMax: number
  temperatureMin: number
  weatherCode: number
}

interface CityInfo {
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
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

// 根据天气代码返回不同 emoji（图标）
function getWeatherIcon(code: number, isNight = false): string {
  if (isNight) {
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

// 根据风向角度返回方向文字
function getWindDirectionText(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const idx = Math.round(((deg % 360) / 45)) % 8
  return dirs[idx]
}

// 格式化日期（MM-DD 周X）
function formatDate(dateStr: string, index: number): string {
  if (index === 0) return '今天'
  if (index === 1) return '明天'
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]}`
}

// ==================== SVG Sparkline 温度趋势 ====================
function TemperatureSparkline({ highs, lows }: { highs: number[]; lows: number[] }) {
  const width = 600
  const height = 120
  const padding = 20
  if (highs.length === 0) return null

  const allVals = [...highs, ...lows]
  const min = Math.min(...allVals) - 2
  const max = Math.max(...allVals) + 2
  const range = max - min || 1

  const stepX = (width - padding * 2) / (highs.length - 1)

  const buildPath = (values: number[]) => values.map((v, i) => {
    const x = padding + i * stepX
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  const highPath = buildPath(highs)
  const lowPath = buildPath(lows)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* 背景网格线 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={padding}
          x2={width - padding}
          y1={padding + ((height - padding * 2) / 4) * i}
          y2={padding + ((height - padding * 2) / 4) * i}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {/* 最高温线 */}
      <path d={highPath} fill="none" stroke="#ff7a59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* 最低温线 */}
      <path d={lowPath} fill="none" stroke="#5ac8fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* 最高温节点 */}
      {highs.map((v, i) => {
        const x = padding + i * stepX
        const y = height - padding - ((v - min) / range) * (height - padding * 2)
        return (
          <g key={`h-${i}`}>
            <circle cx={x} cy={y} r="4" fill="#ff7a59" />
            <text x={x} y={y - 8} fill="#ff7a59" fontSize="11" textAnchor="middle" fontWeight="600">
              {Math.round(v)}°
            </text>
          </g>
        )
      })}
      {/* 最低温节点 */}
      {lows.map((v, i) => {
        const x = padding + i * stepX
        const y = height - padding - ((v - min) / range) * (height - padding * 2)
        return (
          <circle key={`l-${i}`} cx={x} cy={y} r="3" fill="#5ac8fa" />
        )
      })}
    </svg>
  )
}

// ==================== 主组件 ====================
const Weather = memo(function Weather() {
  const [cities, setCities] = useState<CityInfo[]>(DEFAULT_CITIES)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<DailyForecast[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CityInfo[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const addNotification = useStore((s) => s.addNotification)

  // 从 localStorage 载入默认城市
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved: { name: string; country: string; latitude: number; longitude: number } = JSON.parse(raw)
        // 在当前 cities 中查找是否存在同名城市
        const idx = cities.findIndex(
          (c) => Math.abs(c.latitude - saved.latitude) < 0.1 && Math.abs(c.longitude - saved.longitude) < 0.1
        )
        if (idx >= 0) {
          setSelectedIndex(idx)
        } else {
          // 将保存的城市添加到列表
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

  // 保存默认城市到 localStorage
  const saveDefaultCity = useCallback((city: CityInfo) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name: city.name, country: city.country, latitude: city.latitude, longitude: city.longitude })
      )
    } catch {
      // 忽略
    }
  }, [])

  // 获取真实天气数据（Open-Meteo）
  const fetchWeather = useCallback(async (city: CityInfo) => {
    setLoading(true)
    setError(null)
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
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
      }

      const daily: DailyForecast[] = (data.daily?.time ?? []).map((d: string, i: number) => ({
        date: d,
        temperatureMax: data.daily?.temperature_2m_max?.[i] ?? 0,
        temperatureMin: data.daily?.temperature_2m_min?.[i] ?? 0,
        weatherCode: data.daily?.weather_code?.[i] ?? 0,
      }))

      setCurrent(cur)
      setForecast(daily)
      setLastUpdated(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`天气数据获取失败：${msg}`)
      addNotification({ title: '天气', message: '天气数据获取失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  // 选中城市改变时获取天气
  useEffect(() => {
    const city = cities[selectedIndex]
    if (city) {
      fetchWeather(city)
      saveDefaultCity(city)
    }
  }, [selectedIndex, cities, fetchWeather, saveDefaultCity])

  // 搜索城市
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setError(null)
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=zh`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const results: CityInfo[] = (data.results ?? []).map((r: { name: string; country: string; admin1?: string; latitude: number; longitude: number }) => ({
        name: r.name,
        country: r.country || '',
        admin1: r.admin1,
        latitude: r.latitude,
        longitude: r.longitude,
      }))
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

  const selectCity = useCallback((city: CityInfo, fromSearch = false) => {
    const existingIdx = cities.findIndex(
      (c) => Math.abs(c.latitude - city.latitude) < 0.01 && Math.abs(c.longitude - city.longitude) < 0.01
    )
    if (existingIdx >= 0) {
      setSelectedIndex(existingIdx)
    } else {
      // 把新城市插入到前面
      setCities((prev) => [city, ...prev])
      setSelectedIndex(0)
    }
    if (fromSearch) {
      setShowSearch(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }, [cities])

  // 温度趋势高低温
  const highs = forecast.map((f) => f.temperatureMax)
  const lows = forecast.map((f) => f.temperatureMin)

  const currentCity = cities[selectedIndex]

  return (
    <div className="app-shell" style={{ height: '100%', overflowY: 'auto', padding: 16, background: 'linear-gradient(135deg, #1e1e3c 0%, #2a2a4a 100%)', color: '#fff' }}>
      {/* 顶部：搜索和城市切换 */}
      <div className="app-card" style={{ padding: 16, marginBottom: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            className="app-input"
            type="text"
            placeholder="🔍 搜索城市（如 Paris / 巴黎 / 东京）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none', fontSize: 13 }}
          />
          <button className="app-button" onClick={handleSearch} disabled={searching} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(124, 108, 240, 0.3)', color: '#fff', border: '1px solid rgba(124, 108, 240, 0.5)', cursor: 'pointer', fontSize: 13 }}>
            {searching ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 搜索结果 */}
        {showSearch && searchResults.length > 0 && (
          <div style={{ marginBottom: 12, padding: 8, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>搜索结果：</div>
            {searchResults.map((city, i) => (
              <button
                key={`sr-${i}`}
                onClick={() => selectCity(city, true)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', marginBottom: 4, borderRadius: 6, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontWeight: 600 }}>{city.name}</span>
                {city.admin1 && <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>{city.admin1}</span>}
                <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>{city.country}</span>
              </button>
            ))}
          </div>
        )}

        {/* 多城市切换 chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cities.map((city, i) => (
            <button
              key={`${city.name}-${i}`}
              onClick={() => setSelectedIndex(i)}
              className="chip"
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid ' + (i === selectedIndex ? 'rgba(124, 108, 240, 0.8)' : 'rgba(255,255,255,0.15)'),
                background: i === selectedIndex ? 'rgba(124, 108, 240, 0.25)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: i === selectedIndex ? 600 : 400,
              }}
            >
              {city.name}
              {city.admin1 ? ` · ${city.admin1}` : city.country ? ` · ${city.country}` : ''}
            </button>
          ))}
          <button
            onClick={() => fetchWeather(currentCity)}
            disabled={loading}
            className="app-button"
            style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: loading ? 'wait' : 'pointer', fontSize: 12 }}
          >
            {loading ? '加载中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && !loading && (
        <div className="app-card" style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* 当前天气概览 */}
      {current && currentCity && (
        <div className="app-card" style={{ padding: 24, marginBottom: 16, borderRadius: 16, background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)', border: '1px solid rgba(124, 108, 240, 0.3)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>📍 {currentCity.name}{currentCity.country ? `, ${currentCity.country}` : ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 72, lineHeight: 1 }}>{getWeatherIcon(current.weatherCode)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1 }}>{Math.round(current.temperature)}°C</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
                {getWeatherDescription(current.weatherCode)} · 体感 {Math.round(current.apparentTemperature)}°C
              </div>
              {lastUpdated && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                  更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>

          {/* 详细指标卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
            {[
              { label: '湿度', value: `${current.relativeHumidity}%`, icon: <Droplets size={14} /> },
              { label: '气压', value: `${Math.round(current.pressure)} hPa`, icon: <Gauge size={14} /> },
              { label: '风速', value: `${Math.round(current.windSpeed)} km/h`, icon: <Wind size={14} /> },
              { label: '风向', value: `${Math.round(current.windDirection)}° ${getWindDirectionText(current.windDirection)}`, icon: <Compass size={14} /> },
              { label: '体感温度', value: `${Math.round(current.apparentTemperature)}°C`, icon: <Thermometer size={14} /> },
              { label: '当前温度', value: `${Math.round(current.temperature)}°C`, icon: <Thermometer size={14} /> },
            ].map((item) => (
              <div key={item.label} className="app-card" style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 温度趋势 Sparkline */}
      {forecast.length > 0 && (
        <div className="app-card" style={{ padding: 16, marginBottom: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📈 未来 7 天温度趋势</div>
          <TemperatureSparkline highs={highs} lows={lows} />
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 2, background: '#ff7a59', display: 'inline-block' }} />
              最高温
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 2, background: '#5ac8fa', display: 'inline-block' }} />
              最低温
            </span>
          </div>
        </div>
      )}

      {/* 7 天预报 */}
      {forecast.length > 0 && (
        <div className="app-card" style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📅 未来 7 天预报</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {forecast.map((day, i) => (
              <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ width: 90, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{formatDate(day.date, i)}</div>
                <div style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{getWeatherIcon(day.weatherCode)}</div>
                <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{getWeatherDescription(day.weatherCode)}</div>
                <div style={{ fontSize: 13, color: '#5ac8fa', minWidth: 40, textAlign: 'right' }}>{Math.round(day.temperatureMin)}°</div>
                <div style={{ width: 40, height: 2, background: 'linear-gradient(to right, #5ac8fa, #ff7a59)', borderRadius: 2 }} />
                <div style={{ fontSize: 13, color: '#ff7a59', minWidth: 40, textAlign: 'right' }}>{Math.round(day.temperatureMax)}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading 空态 */}
      {loading && !current && (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.5)' }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⛅</div>
          <div>正在加载天气数据...</div>
        </div>
      )}
    </div>
  )
})

export default Weather
