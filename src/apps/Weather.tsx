import { useState, useEffect, useCallback } from 'react'

interface WeatherData {
  city: string
  temp: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  windDir: string
  visibility: number
  pressure: number
  uvIndex: number
  sunrise: string
  sunset: string
  feelsLike: number
}

interface ForecastDay {
  date: string
  day: string
  high: number
  low: number
  icon: string
  desc: string
}

interface CitySuggestion {
  name: string
  lat: number
  lon: number
  country: string
  admin1?: string
}

const WMO_CODE_TO_ICON: Record<number, { icon: string; desc: string }> = {
  0: { icon: '☀️', desc: '晴' },
  1: { icon: '🌤️', desc: '晴间多云' },
  2: { icon: '⛅', desc: '多云' },
  3: { icon: '☁️', desc: '阴' },
  45: { icon: '🌫️', desc: '雾' },
  48: { icon: '🌫️', desc: '雾凇' },
  51: { icon: '🌧️', desc: '小雨' },
  53: { icon: '🌧️', desc: '中雨' },
  55: { icon: '🌧️', desc: '大雨' },
  56: { icon: '🌨️', desc: '冻雨' },
  57: { icon: '🌨️', desc: '冻雨' },
  61: { icon: '🌧️', desc: '小雨' },
  63: { icon: '🌧️', desc: '中雨' },
  65: { icon: '🌧️', desc: '大雨' },
  66: { icon: '🌨️', desc: '冻雨' },
  67: { icon: '🌨️', desc: '冻雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '🌨️', desc: '中雪' },
  75: { icon: '❄️', desc: '大雪' },
  77: { icon: '❄️', desc: '雪粒' },
  80: { icon: '🌦️', desc: '阵雨' },
  81: { icon: '🌦️', desc: '阵雨' },
  82: { icon: '⛈️', desc: '雷阵雨' },
  85: { icon: '🌨️', desc: '阵雪' },
  86: { icon: '❄️', desc: '阵雪' },
  95: { icon: '⛈️', desc: '雷暴' },
  96: { icon: '⛈️', desc: '雷暴伴小雨' },
  99: { icon: '⛈️', desc: '雷暴伴大雨' },
}

const getWindDirection = (deg: number): string => {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(deg / 45) % 8
  return directions[index] + '风'
}

const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('北京')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // 默认北京坐标
  const defaultLat = 39.9042
  const defaultLon = 116.4074

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchWeather = useCallback(async (lat: number, lon: number, cityName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`
      )
      if (!response.ok) throw new Error('网络请求失败')
      const data = await response.json()

      const current = data.current
      const daily = data.daily
      const wmo = WMO_CODE_TO_ICON[current.weather_code] || { icon: '🌡️', desc: '未知' }

      setWeather({
        city: cityName,
        temp: Math.round(current.temperature_2m),
        condition: wmo.desc,
        icon: wmo.icon,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDir: getWindDirection(current.wind_direction_10m),
        visibility: Math.round(current.visibility / 1000),
        pressure: Math.round(current.pressure_msl),
        uvIndex: Math.round(daily.uv_index_max[0]),
        sunrise: daily.sunrise[0].split('T')[1].slice(0, 5),
        sunset: daily.sunset[0].split('T')[1].slice(0, 5),
        feelsLike: Math.round(current.apparent_temperature),
      })

      const forecastData: ForecastDay[] = daily.time.slice(1, 6).map((date: string, i: number) => {
        const code = daily.weather_code[i + 1]
        const wmoData = WMO_CODE_TO_ICON[code] || { icon: '🌡️', desc: '未知' }
        return {
          date,
          day: getDayName(date),
          high: Math.round(daily.temperature_2m_max[i + 1]),
          low: Math.round(daily.temperature_2m_min[i + 1]),
          icon: wmoData.icon,
          desc: wmoData.desc,
        }
      })
      setForecast(forecastData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取天气数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`
      )
      if (!response.ok) return
      const data = await response.json()
      if (data.results) {
        setSuggestions(data.results.map((r: any) => ({
          name: r.name,
          lat: r.latitude,
          lon: r.longitude,
          country: r.country,
          admin1: r.admin1,
        })))
      } else {
        setSuggestions([])
      }
    } catch {
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    fetchWeather(defaultLat, defaultLon, '北京')
  }, [fetchWeather])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSuggestions(true)
    searchCities(value)
  }

  const handleSelectCity = (suggestion: CitySuggestion) => {
    const displayName = suggestion.admin1 
      ? `${suggestion.name}, ${suggestion.admin1}`
      : suggestion.name
    setCity(displayName)
    setSearchQuery('')
    setShowSuggestions(false)
    setSuggestions([])
    fetchWeather(suggestion.lat, suggestion.lon, suggestion.name)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelectCity(suggestions[0])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  if (loading && !weather) {
    return (
      <div className="app-container" style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 
        color: '#fff', 
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌡️</div>
          <div style={{ color: '#aaa' }}>正在获取天气数据...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container" style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 
        color: '#fff', 
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ color: '#f44747' }}>{error}</div>
          <button 
            onClick={() => fetchWeather(defaultLat, defaultLon, '北京')}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" style={{ 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 
      color: '#fff', 
      padding: 20, 
      overflow: 'auto',
      height: '100%'
    }}>
      {/* 搜索框 */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="搜索城市..."
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            outline: 'none',
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(30,30,50,0.95)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 10,
          }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => handleSelectCity(s)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
              >
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {s.admin1 ? `${s.admin1}, ` : ''}{s.country}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 当前城市和时间 */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 600 }}>{weather?.city || city}</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
          {currentTime.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 主天气信息 */}
      {weather && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64 }}>{weather.icon}</div>
            <div style={{ fontSize: 56, fontWeight: 200, lineHeight: 1 }}>{weather.temp}°C</div>
            <div style={{ fontSize: 18, color: '#ccc', marginTop: 4 }}>{weather.condition}</div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>
              体感温度 {weather.feelsLike}°C
            </div>
          </div>

          {/* 详细信息 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#888' }}>湿度</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{weather.humidity}%</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#888' }}>风速</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{weather.windSpeed} km/h</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#888' }}>能见度</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{weather.visibility} km</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#888' }}>气压</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{weather.pressure} hPa</div>
            </div>
          </div>

          {/* 5天预报 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#ccc' }}>5天预报</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {forecast.map((day, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ width: 50, fontWeight: 500 }}>{day.day}</span>
                  <span style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{day.icon}</span>
                  <span style={{ color: '#ccc', width: 60, textAlign: 'center', fontSize: 13 }}>{day.desc}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    <span style={{ color: '#aaa' }}>{day.low}°</span>
                    {' '}
                    <span>{day.high}°</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 日出日落等 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 13 }}>
            <div>
              <div style={{ color: '#888' }}>日出</div>
              <div>{weather.sunrise}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>日落</div>
              <div>{weather.sunset}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>紫外线</div>
              <div>{weather.uvIndex}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>风向</div>
              <div>{weather.windDir}</div>
            </div>
          </div>
        </>
      )}

      {/* 数据来源 */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#666' }}>
        数据来源: Open-Meteo.com
      </div>
    </div>
  )
}