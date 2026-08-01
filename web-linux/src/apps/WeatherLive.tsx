import { useState, useEffect, useCallback } from 'react'

// ==================== 类型定义 ====================
interface WttrCurrentCondition {
  temp_C: string
  temp_F: string
  FeelsLikeC: string
  FeelsLikeF: string
  humidity: string
  weatherDesc: Array<{ value: string }>
  windspeedKmph: string
  windspeedMiles: string
  winddir16Point: string
  winddirDegree: string
  pressure: string
  visibility: string
  uvIndex: string
  cloudcover: string
  precipMM: string
  localObsDateTime: string
}

interface WttrHourly {
  time: string
  tempC: string
  tempF: string
  weatherDesc: Array<{ value: string }>
  windspeedKmph: string
  humidity: string
  chanceofrain: string
}

interface WttrDay {
  date: string
  maxtempC: string
  maxtempF: string
  mintempC: string
  mintempF: string
  avgTempC: string
  avgTempF: string
  totalSnow_cm: string
  sunHour: string
  uvIndex: string
  hourly: WttrHourly[]
}

interface WttrNearestArea {
  areaName: Array<{ value: string }>
  country: Array<{ value: string }>
  region: Array<{ value: string }>
  latitude: string
  longitude: string
}

interface WttrResponse {
  current_condition: WttrCurrentCondition[]
  weather: WttrDay[]
  nearest_area: WttrNearestArea[]
}

interface WeatherData {
  city: string
  country: string
  region: string
  current: {
    tempC: number
    tempF: number
    feelsLikeC: number
    feelsLikeF: number
    humidity: number
    description: string
    windSpeedKmph: number
    windDir: string
    pressure: number
    visibility: number
    uvIndex: number
    cloudCover: number
  }
  forecast: Array<{
    date: string
    maxTempC: number
    maxTempF: number
    minTempC: number
    minTempF: number
    avgTempC: number
    uvIndex: number
    sunHour: number
    hourly: Array<{
      time: string
      tempC: number
      description: string
      humidity: number
      windSpeedKmph: number
      chanceOfRain: number
    }>
  }>
}

// ==================== 天气图标映射 ====================
const weatherEmojiMap: [RegExp, string][] = [
  [/thunder|雷|闪电/i, '⛈'],
  [/snow|雪|blizzard/i, '❄️'],
  [/rain|雨|drizzle|shower|泼/i, '🌧'],
  [/fog|雾|mist|haze|霾|smoke/i, '🌫'],
  [/cloud|阴|overcast/i, '☁️'],
  [/partly.*cloud|多云|局部云/i, '⛅'],
  [/clear|sunny|晴|fair/i, '☀️'],
]

function getWeatherEmoji(desc: string): string {
  for (const [regex, emoji] of weatherEmojiMap) {
    if (regex.test(desc)) return emoji
  }
  return '🌤'
}

// ==================== 风向翻译 ====================
const windDirMap: Record<string, string> = {
  N: '北', NNE: '北东北', NE: '东北', ENE: '东东北',
  E: '东', ESE: '东东南', SE: '东南', SSE: '南东南',
  S: '南', SSW: '南西南', SW: '西南', WSW: '西西南',
  W: '西', WNW: '西西北', NW: '西北', NNW: '北西北',
}

// ==================== 工具函数 ====================
const HISTORY_KEY = 'weatherlive_search_history'
const MAX_HISTORY = 8

function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addSearchHistory(city: string) {
  const history = getSearchHistory().filter(h => h.toLowerCase() !== city.toLowerCase())
  history.unshift(city)
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch { /* ignore */ }
}

function parseWttrResponse(data: WttrResponse): WeatherData {
  const cc = data.current_condition[0]
  const area = data.nearest_area[0]
  return {
    city: area.areaName[0].value,
    country: area.country[0].value,
    region: area.region[0].value,
    current: {
      tempC: Number(cc.temp_C),
      tempF: Number(cc.temp_F),
      feelsLikeC: Number(cc.FeelsLikeC),
      feelsLikeF: Number(cc.FeelsLikeF),
      humidity: Number(cc.humidity),
      description: cc.weatherDesc[0]?.value || '',
      windSpeedKmph: Number(cc.windspeedKmph),
      windDir: cc.winddir16Point,
      pressure: Number(cc.pressure),
      visibility: Number(cc.visibility),
      uvIndex: Number(cc.uvIndex),
      cloudCover: Number(cc.cloudcover),
    },
    forecast: data.weather.map(day => ({
      date: day.date,
      maxTempC: Number(day.maxtempC),
      maxTempF: Number(day.maxtempF),
      minTempC: Number(day.mintempC),
      minTempF: Number(day.mintempF),
      avgTempC: Number(day.avgTempC),
      uvIndex: Number(day.uvIndex),
      sunHour: Number(day.sunHour),
      hourly: (day.hourly || []).map(h => ({
        time: h.time,
        tempC: Number(h.tempC),
        description: h.weatherDesc[0]?.value || '',
        humidity: Number(h.humidity),
        windSpeedKmph: Number(h.windspeedKmph),
        chanceOfRain: Number(h.chanceofrain),
      })),
    })),
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${weekdays[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
}

function formatHourTime(timeStr: string): string {
  const h = parseInt(timeStr, 10) / 100
  return `${h.toString().padStart(2, '0')}:00`
}

// ==================== 样式常量 ====================
const COLORS = {
  bg: 'rgba(15, 23, 42, 0.92)',
  card: 'rgba(30, 41, 59, 0.65)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  accent: '#60a5fa',
  accentDim: 'rgba(96, 165, 250, 0.3)',
  text: '#f1f5f9',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  warm: '#fbbf24',
  danger: '#f87171',
  success: '#34d399',
  glass: 'rgba(255, 255, 255, 0.06)',
}

const baseCard: React.CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: 16,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
}

// ==================== 主组件 ====================
const WeatherLive = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [city, setCity] = useState('Beijing')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCelsius, setIsCelsius] = useState(true)
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // 获取天气数据
  const fetchWeather = useCallback(async (location: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      const data: WttrResponse = await res.json()
      if (!data.current_condition || data.current_condition.length === 0) {
        throw new Error('未找到该城市的天气数据')
      }
      const parsed = parseWttrResponse(data)
      setWeather(parsed)
      setCity(location)
      setLastUpdate(new Date())
      addSearchHistory(location)
      setSearchHistory(getSearchHistory())
    } catch (err: any) {
      setError(err.message || '获取天气数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 自动获取地理位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          fetchWeather(`${latitude},${longitude}`).finally(() => setGeoLoading(false))
        },
        () => {
          fetchWeather('Beijing').finally(() => setGeoLoading(false))
        },
        { timeout: 5000 }
      )
    } else {
      fetchWeather('Beijing').finally(() => setGeoLoading(false))
    }
  }, [fetchWeather])

  // 搜索
  const handleSearch = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    fetchWeather(trimmed)
    setInputValue('')
    setShowHistory(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleHistoryClick = (h: string) => {
    fetchWeather(h)
    setShowHistory(false)
  }

  const handleRefresh = () => {
    fetchWeather(city)
  }

  const temp = (c: number, f: number) => isCelsius ? c : f
  const tempUnit = isCelsius ? '°C' : '°F'

  // ==================== 渲染 ====================
  if (geoLoading && !weather) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100%', minHeight: 400, color: COLORS.textDim,
        flexDirection: 'column', gap: 12, background: COLORS.bg, borderRadius: 12,
      }}>
        <div style={{
          width: 36, height: 36, border: `3px solid ${COLORS.accentDim}`,
          borderTopColor: COLORS.accent, borderRadius: '50%',
          animation: 'wlive_spin 1s linear infinite',
        }} />
        <span>正在获取位置与天气数据...</span>
        <style>{`@keyframes wlive_spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      padding: 20, color: COLORS.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: COLORS.bg, minHeight: '100%', boxSizing: 'border-box', overflowY: 'auto',
    }}>
      {/* 顶部栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* 搜索框 */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12,
            backdropFilter: 'blur(12px)', overflow: 'hidden',
          }}>
            <span style={{ padding: '8px 0 8px 14px', color: COLORS.textMuted, fontSize: 16 }}>🔍</span>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowHistory(true)}
              placeholder="搜索城市 (中英文均可)..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: COLORS.text, padding: '10px 12px', fontSize: 14,
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: COLORS.accent, color: '#fff', border: 'none',
                padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              搜索
            </button>
          </div>
          {/* 搜索历史下拉 */}
          {showHistory && searchHistory.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              ...baseCard, marginTop: 4, padding: '6px 0', maxHeight: 240, overflowY: 'auto',
            }}>
              <div style={{ padding: '4px 14px 8px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, letterSpacing: 1 }}>
                搜索历史
              </div>
              {searchHistory.map((h, i) => (
                <div
                  key={i}
                  onClick={() => handleHistoryClick(h)}
                  onMouseEnter={e => (e.currentTarget.style.background = COLORS.glass)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  style={{
                    padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                    color: COLORS.text, transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span style={{ color: COLORS.textMuted }}>🕐</span> {h}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 温度切换 */}
        <button
          onClick={() => setIsCelsius(!isCelsius)}
          style={{
            ...baseCard, padding: '8px 16px', cursor: 'pointer', color: COLORS.text,
            fontSize: 13, fontWeight: 600, border: `1px solid ${COLORS.accentDim}`,
            background: isCelsius ? COLORS.accentDim : COLORS.card,
            transition: 'all 0.2s',
          }}
        >
          {isCelsius ? '°C' : '°F'}
        </button>

        {/* 刷新 */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            ...baseCard, padding: '8px 14px', cursor: loading ? 'wait' : 'pointer',
            color: COLORS.text, fontSize: 16, display: 'flex', alignItems: 'center',
            opacity: loading ? 0.5 : 1,
          }}
        >
          🔄
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          ...baseCard, padding: '14px 18px', marginBottom: 16, color: COLORS.danger,
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div style={{
          ...baseCard, padding: 40, textAlign: 'center', color: COLORS.textDim, marginBottom: 16,
        }}>
          <div style={{
            width: 32, height: 32, margin: '0 auto 12px',
            border: `3px solid ${COLORS.accentDim}`, borderTopColor: COLORS.accent,
            borderRadius: '50%', animation: 'wlive_spin 1s linear infinite',
          }} />
          获取天气数据中...
        </div>
      )}

      {/* 天气数据 */}
      {weather && !loading && (
        <>
          {/* 当前天气主卡片 */}
          <div style={{ ...baseCard, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: COLORS.textDim }}>📍</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{weather.city}</span>
                  <span style={{ fontSize: 13, color: COLORS.textMuted }}>{weather.region}, {weather.country}</span>
                </div>
                {lastUpdate && (
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>
                    更新于 {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
                    {temp(weather.current.tempC, weather.current.tempF)}
                  </span>
                  <span style={{ fontSize: 28, fontWeight: 300, color: COLORS.textDim }}>{tempUnit}</span>
                  <span style={{ fontSize: 48 }}>{getWeatherEmoji(weather.current.description)}</span>
                </div>
                <div style={{ fontSize: 16, color: COLORS.textDim, marginBottom: 4 }}>
                  {weather.current.description}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                  体感 {temp(weather.current.feelsLikeC, weather.current.feelsLikeF)}{tempUnit}
                </div>
              </div>
            </div>
          </div>

          {/* 详细数据网格 */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10, marginBottom: 16,
          }}>
            {[
              { icon: '💧', label: '湿度', value: `${weather.current.humidity}%` },
              { icon: '💨', label: '风速', value: `${weather.current.windSpeedKmph} km/h` },
              { icon: '🧭', label: '风向', value: windDirMap[weather.current.windDir] || weather.current.windDir },
              { icon: '📊', label: '气压', value: `${weather.current.pressure} hPa` },
              { icon: '👁', label: '能见度', value: `${weather.current.visibility} km` },
              { icon: '☀️', label: 'UV 指数', value: `${weather.current.uvIndex}` },
              { icon: '☁️', label: '云量', value: `${weather.current.cloudCover}%` },
            ].map(item => (
              <div key={item.label} style={{ ...baseCard, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 3天预报 */}
          <div style={{ ...baseCard, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📅 3天天气预报
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {weather.forecast.map((day, idx) => {
                // 取中午12点的天气描述
                const noonHour = day.hourly.find(h => h.time === '1200') || day.hourly[Math.floor(day.hourly.length / 2)]
                const desc = noonHour?.description || ''
                return (
                  <div key={idx} style={{
                    ...baseCard, padding: 16,
                    background: idx === 0 ? COLORS.accentDim : COLORS.card,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {idx === 0 ? '今天' : formatDate(day.date)}
                      </span>
                      <span style={{ fontSize: 28 }}>{getWeatherEmoji(desc)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 10 }}>{desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 28, fontWeight: 700 }}>
                        {temp(day.maxTempC, day.maxTempF)}
                      </span>
                      <span style={{ fontSize: 14, color: COLORS.textMuted }}>{tempUnit}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
                          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.warm})`,
                          width: `${Math.max(10, ((day.avgTempC - day.minTempC) / Math.max(1, day.maxTempC - day.minTempC)) * 100)}%`,
                        }} />
                      </div>
                      <span style={{ fontSize: 14, color: COLORS.textMuted }}>
                        {temp(day.minTempC, day.minTempF)}°
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: COLORS.textMuted }}>
                      <span>☀️ {day.sunHour}h 日照</span>
                      <span>☀ UV {day.uvIndex}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 今日逐时预报 */}
          {weather.forecast[0] && (
            <div style={{ ...baseCard, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⏰ 今日逐时预报
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {weather.forecast[0].hourly.map((h, idx) => (
                  <div key={idx} style={{
                    ...baseCard, padding: '10px 12px', minWidth: 80, textAlign: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{formatHourTime(h.time)}</div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{getWeatherEmoji(h.description)}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{temp(h.tempC, h.tempC * 9 / 5 + 32)}°</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>
                      💧{h.chanceOfRain}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 点击空白关闭历史下拉 */}
      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
        />
      )}

      {/* 全局动画 */}
      <style>{`@keyframes wlive_spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default WeatherLive
