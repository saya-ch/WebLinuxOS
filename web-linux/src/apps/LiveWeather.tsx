import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface CityCoord {
  name: string
  country: string
  lat: number
  lon: number
}

interface CurrentWeather {
  temperature: number
  windspeed: number
  winddirection: number
  weathercode: number
  is_day: number
}

interface HourlyData {
  time: string
  temperature_2m: number
  relativehumidity_2m: number
  windspeed_10m: number
  weathercode: number
}

// ==================== 城市数据 ====================
const CHINA_CITIES: CityCoord[] = [
  { name: '北京', country: '中国', lat: 39.9042, lon: 116.4074 },
  { name: '上海', country: '中国', lat: 31.2304, lon: 121.4737 },
  { name: '广州', country: '中国', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', country: '中国', lat: 22.5431, lon: 114.0579 },
  { name: '成都', country: '中国', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', country: '中国', lat: 30.2741, lon: 120.1551 },
  { name: '武汉', country: '中国', lat: 30.5928, lon: 114.3055 },
  { name: '西安', country: '中国', lat: 34.3416, lon: 108.9398 },
  { name: '南京', country: '中国', lat: 32.0603, lon: 118.7969 },
  { name: '重庆', country: '中国', lat: 29.4316, lon: 106.9123 },
  { name: '天津', country: '中国', lat: 39.3434, lon: 117.3616 },
  { name: '苏州', country: '中国', lat: 31.2990, lon: 120.5853 },
  { name: '长沙', country: '中国', lat: 28.2282, lon: 112.9388 },
  { name: '郑州', country: '中国', lat: 34.7466, lon: 113.6254 },
  { name: '哈尔滨', country: '中国', lat: 45.8038, lon: 126.5350 },
  { name: '昆明', country: '中国', lat: 25.0389, lon: 102.7183 },
  { name: '大连', country: '中国', lat: 38.9140, lon: 121.6147 },
  { name: '厦门', country: '中国', lat: 24.4798, lon: 118.0894 },
  { name: '青岛', country: '中国', lat: 36.0671, lon: 120.3826 },
  { name: '拉萨', country: '中国', lat: 29.6500, lon: 91.1000 },
]

const WORLD_CITIES: CityCoord[] = [
  { name: '东京', country: '日本', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', country: '美国', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', country: '英国', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', country: '法国', lat: 48.8566, lon: 2.3522 },
  { name: '悉尼', country: '澳大利亚', lat: -33.8688, lon: 151.2093 },
  { name: '首尔', country: '韩国', lat: 37.5665, lon: 126.9780 },
  { name: '新加坡', country: '新加坡', lat: 1.3521, lon: 103.8198 },
  { name: '莫斯科', country: '俄罗斯', lat: 55.7558, lon: 37.6173 },
  { name: '迪拜', country: '阿联酋', lat: 25.2048, lon: 55.2708 },
  { name: '曼谷', country: '泰国', lat: 13.7563, lon: 100.5018 },
  { name: '柏林', country: '德国', lat: 52.5200, lon: 13.4050 },
  { name: '罗马', country: '意大利', lat: 41.9028, lon: 12.4964 },
  { name: '多伦多', country: '加拿大', lat: 43.6532, lon: -79.3832 },
  { name: '旧金山', country: '美国', lat: 37.7749, lon: -122.4194 },
  { name: '洛杉矶', country: '美国', lat: 34.0522, lon: -118.2437 },
  { name: '开罗', country: '埃及', lat: 30.0444, lon: 31.2357 },
  { name: '圣保罗', country: '巴西', lat: -23.5505, lon: -46.6333 },
  { name: '孟买', country: '印度', lat: 19.0760, lon: 72.8777 },
  { name: '墨西哥城', country: '墨西哥', lat: 19.4326, lon: -99.1332 },
  { name: '雅加达', country: '印尼', lat: -6.2088, lon: 106.8456 },
]

const ALL_CITIES: CityCoord[] = [...CHINA_CITIES, ...WORLD_CITIES]

// ==================== 工具函数 ====================
function getWeatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code <= 2) return isDay ? '⛅' : '☁️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}

function getWeatherDesc(code: number): string {
  if (code === 0) return '晴朗'
  if (code <= 2) return '多云'
  if (code === 3) return '阴天'
  if (code <= 48) return '有雾'
  if (code <= 57) return '毛毛雨'
  if (code <= 67) return '下雨'
  if (code <= 77) return '下雪'
  if (code <= 82) return '阵雨'
  if (code <= 86) return '阵雪'
  if (code <= 99) return '雷暴'
  return '未知'
}

function getWindDir(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return dirs[Math.round(((deg % 360) / 45)) % 8]
}

function celsiusToFahrenheit(c: number): number {
  return c * 9 / 5 + 32
}

function formatTemp(c: number, unit: 'C' | 'F'): string {
  const val = unit === 'F' ? celsiusToFahrenheit(c) : c
  return `${Math.round(val)}°${unit}`
}

// ==================== SVG 温度趋势图组件 ====================
function TemperatureChart({ hourly, unit }: { hourly: HourlyData[]; unit: 'C' | 'F' }) {
  if (hourly.length === 0) return null

  const width = 700
  const height = 180
  const paddingX = 40
  const paddingY = 28

  const temps = hourly.map((h) => h.temperature_2m)
  const minTemp = Math.min(...temps) - 2
  const maxTemp = Math.max(...temps) + 2
  const range = maxTemp - minTemp || 1

  const stepX = (width - paddingX * 2) / (hourly.length - 1)

  const points = temps.map((t, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + ((maxTemp - t) / range) * (height - paddingY * 2),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x.toFixed(1)} ${height - paddingY} L ${points[0].x.toFixed(1)} ${height - paddingY} Z`

  // 湿度数据
  const humidities = hourly.map((h) => h.relativehumidity_2m)
  const humPoints = humidities.map((h, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + ((100 - h) / 100) * (height - paddingY * 2),
  }))
  const humLinePath = humPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  // X轴标签（每4小时）
  const xLabels = hourly.filter((_, i) => i % 4 === 0)

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', minWidth: 400 }}>
        <defs>
          <linearGradient id="tempAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff7a59" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff7a59" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* 网格线 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = paddingY + ((height - paddingY * 2) / 4) * i
          return <line key={i} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="var(--glass-border)" strokeWidth="1" />
        })}
        {/* 温度区域填充 */}
        <path d={areaPath} fill="url(#tempAreaGrad)" />
        {/* 温度折线 */}
        <path d={linePath} fill="none" stroke="#ff7a59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* 湿度折线 */}
        <path d={humLinePath} fill="none" stroke="#5ac8fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
        {/* 温度数据点 + 标注（每3小时一个） */}
        {points.filter((_, i) => i % 3 === 0).map((p, idx) => {
          const originalIdx = idx * 3
          return (
            <g key={`tp-${idx}`}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#ff7a59" stroke="var(--window-bg)" strokeWidth="1.5" />
              <text x={p.x} y={p.y - 8} fill="#ff7a59" fontSize="10" textAnchor="middle" fontWeight="600">
                {formatTemp(temps[originalIdx], unit)}
              </text>
            </g>
          )
        })}
        {/* X轴时间标签 */}
        {xLabels.map((h, i) => {
          const idx = i * 4
          if (idx >= points.length) return null
          const p = points[idx]
          const hour = new Date(h.time).getHours()
          return (
            <text key={`xl-${i}`} x={p.x} y={height - 6} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
              {String(hour).padStart(2, '0')}:00
            </text>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 2.5, background: '#ff7a59', display: 'inline-block', borderRadius: 1 }} />
          温度
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 1.5, background: '#5ac8fa', display: 'inline-block', borderRadius: 1, borderStyle: 'dashed' }} />
          湿度
        </span>
      </div>
    </div>
  )
}

// ==================== 主组件 ====================
export default function LiveWeather() {
  const addNotification = useStore((s) => s.addNotification)

  const [selectedCity, setSelectedCity] = useState<CityCoord>(ALL_CITIES[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCityList, setShowCityList] = useState(false)
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<'C' | 'F'>('C')

  // 加载保存的单位偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-weather-unit')
      if (saved === 'F') setUnit('F')
    } catch { /* 忽略 */ }
  }, [])

  // 保存单位偏好
  useEffect(() => {
    try {
      localStorage.setItem('weblinux-weather-unit', unit)
    } catch { /* 忽略 */ }
  }, [unit])

  // 加载保存的城市
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-liveweather-city')
      if (saved) {
        const parsed = JSON.parse(saved)
        const found = ALL_CITIES.find((c) => c.name === parsed.name && c.lat === parsed.lat)
        if (found) setSelectedCity(found)
      }
    } catch { /* 忽略 */ }
  }, [])

  // 保存当前城市
  useEffect(() => {
    try {
      localStorage.setItem('weblinux-liveweather-city', JSON.stringify(selectedCity))
    } catch { /* 忽略 */ }
  }, [selectedCity])

  // 获取天气数据
  const fetchWeather = useCallback(async (city: CityCoord) => {
    setLoading(true)
    setError(null)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode&timezone=Asia/Shanghai&forecast_days=2`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.current_weather) {
        setCurrentWeather(data.current_weather)
      }

      if (data.hourly) {
        const now = new Date()
        const currentHour = now.getHours()
        // 取从当前小时开始的24小时数据
        const startIndex = Math.max(0, currentHour)
        const hourly: HourlyData[] = []
        const times = data.hourly.time || []
        const temps = data.hourly.temperature_2m || []
        const hums = data.hourly.relativehumidity_2m || []
        const winds = data.hourly.windspeed_10m || []
        const codes = data.hourly.weathercode || []

        for (let i = startIndex; i < times.length && hourly.length < 24; i++) {
          hourly.push({
            time: times[i],
            temperature_2m: temps[i] ?? 0,
            relativehumidity_2m: hums[i] ?? 0,
            windspeed_10m: winds[i] ?? 0,
            weathercode: codes[i] ?? 0,
          })
        }
        setHourlyData(hourly)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`天气数据获取失败：${msg}`)
      addNotification({ title: '天气', message: '天气数据获取失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  // 城市变化时获取天气
  useEffect(() => {
    fetchWeather(selectedCity)
  }, [selectedCity, fetchWeather])

  // 过滤城市列表
  const filteredCities = searchQuery.trim()
    ? ALL_CITIES.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_CITIES

  // 当前湿度（从hourly取第一个）
  const currentHumidity = hourlyData.length > 0 ? hourlyData[0].relativehumidity_2m : null

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 16,
        background: 'linear-gradient(180deg, var(--window-bg) 0%, var(--desktop-bg) 100%)',
        color: 'var(--text-primary)',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes weatherFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      {/* 城市搜索与选择 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="app-input"
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowCityList(true) }}
              onFocus={() => setShowCityList(true)}
              placeholder="🔍 搜索城市..."
              aria-label="搜索城市"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <button
            className="app-button"
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            aria-label={`切换为${unit === 'C' ? '华氏' : '摄氏'}度`}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            °{unit === 'C' ? 'C' : 'F'} / °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>

        {/* 城市下拉列表 */}
        {showCityList && (
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              borderRadius: 10,
              background: 'var(--window-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-medium)',
              marginBottom: 8,
            }}
          >
            {/* 中国城市分组 */}
            <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-bg)' }}>
              🇨🇳 中国城市
            </div>
            {filteredCities.filter((c) => c.country === '中国').slice(0, 10).map((city) => (
              <button
                key={`cn-${city.name}`}
                onClick={() => { setSelectedCity(city); setShowCityList(false); setSearchQuery('') }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: selectedCity.name === city.name ? 'var(--accent-bg)' : 'transparent',
                  color: selectedCity.name === city.name ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                <span>{city.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{city.lat.toFixed(1)}°, {city.lon.toFixed(1)}°</span>
              </button>
            ))}
            {/* 世界城市分组 */}
            <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-bg)' }}>
              🌍 世界城市
            </div>
            {filteredCities.filter((c) => c.country !== '中国').slice(0, 10).map((city) => (
              <button
                key={`world-${city.name}-${city.country}`}
                onClick={() => { setSelectedCity(city); setShowCityList(false); setSearchQuery('') }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: selectedCity.name === city.name && selectedCity.country === city.country ? 'var(--accent-bg)' : 'transparent',
                  color: selectedCity.name === city.name && selectedCity.country === city.country ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                <span>{city.name} · {city.country}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{city.lat.toFixed(1)}°, {city.lon.toFixed(1)}°</span>
              </button>
            ))}
            {filteredCities.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                未找到匹配的城市
              </div>
            )}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: 12,
          marginBottom: 14,
          borderRadius: 10,
          background: 'var(--error-bg)',
          border: '1px solid var(--error)',
          color: 'var(--error)',
          fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>⛅</div>
          <div style={{ fontSize: 14 }}>正在获取天气数据...</div>
        </div>
      )}

      {/* 当前天气卡片 */}
      {currentWeather && !loading && (
        <div style={{
          padding: 24,
          marginBottom: 16,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(124,108,240,0.15) 0%, rgba(0,214,193,0.08) 100%)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 背景装饰 */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: '50%', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.08, pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            📍 {selectedCity.name}，{selectedCity.country}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              fontSize: 64,
              lineHeight: 1,
              animation: 'weatherFloat 4s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.2))',
            }}>
              {getWeatherEmoji(currentWeather.weathercode, currentWeather.is_day === 1)}
            </div>
            <div>
              <div style={{
                fontSize: 48,
                fontWeight: 200,
                lineHeight: 1.1,
                letterSpacing: '-2px',
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {formatTemp(currentWeather.temperature, unit)}
              </div>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
                {getWeatherDesc(currentWeather.weathercode)}
              </div>
            </div>
          </div>

          {/* 详细指标 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
            marginTop: 18,
          }}>
            {[
              { icon: '💨', label: '风速', value: `${Math.round(currentWeather.windspeed)} km/h`, sub: `${getWindDir(currentWeather.winddirection)}风` },
              { icon: '💧', label: '湿度', value: currentHumidity !== null ? `${currentHumidity}%` : '--', sub: currentHumidity !== null ? (currentHumidity > 70 ? '潮湿' : currentHumidity < 30 ? '干燥' : '舒适') : '' },
              { icon: '🧭', label: '风向', value: getWindDir(currentWeather.winddirection), sub: `${Math.round(currentWeather.winddirection)}°` },
              { icon: '🌡️', label: '天气代码', value: `WMO ${currentWeather.weathercode}`, sub: getWeatherDesc(currentWeather.weathercode) },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 24小时温度趋势图 */}
      {hourlyData.length > 0 && !loading && (
        <div style={{
          padding: 18,
          marginBottom: 16,
          borderRadius: 16,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📈 24小时温度与湿度趋势
          </div>
          <TemperatureChart hourly={hourlyData} unit={unit} />
        </div>
      )}

      {/* 24小时逐时预报列表 */}
      {hourlyData.length > 0 && !loading && (
        <div style={{
          padding: 18,
          borderRadius: 16,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🕐 逐时预报
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
            {hourlyData.map((hour, i) => {
              const date = new Date(hour.time)
              const isNow = i === 0
              return (
                <div
                  key={hour.time}
                  style={{
                    flex: '0 0 auto',
                    width: 60,
                    padding: '10px 6px',
                    borderRadius: 12,
                    background: isNow
                      ? 'linear-gradient(180deg, var(--accent-bg) 0%, transparent 100%)'
                      : 'var(--glass-bg)',
                    border: `1px solid ${isNow ? 'var(--accent)' : 'var(--glass-border)'}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: 10,
                    color: isNow ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isNow ? 600 : 400,
                    marginBottom: 6,
                  }}>
                    {isNow ? '现在' : `${String(date.getHours()).padStart(2, '0')}:00`}
                  </div>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>
                    {getWeatherEmoji(hour.weathercode, true)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {formatTemp(hour.temperature_2m, unit)}
                  </div>
                  <div style={{ fontSize: 10, color: '#5ac8fa' }}>
                    {hour.relativehumidity_2m}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!currentWeather && !loading && !error && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌤️</div>
          <div style={{ fontSize: 14 }}>选择城市获取天气数据</div>
        </div>
      )}
    </div>
  )
}
