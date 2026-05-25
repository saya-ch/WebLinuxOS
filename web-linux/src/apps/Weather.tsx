import { useState, useEffect, useMemo } from 'react'

interface CurrentWeather {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
}

interface DailyForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  sunrise: string
  sunset: string
}

interface GeocodingResult {
  name: string
  country: string
  latitude: number
  longitude: number
}

const weatherIcons: Record<number, { icon: string; desc: string }> = {
  0: { icon: '☀️', desc: '晴' },
  1: { icon: '🌤️', desc: '大部晴朗' },
  2: { icon: '⛅', desc: '局部多云' },
  3: { icon: '☁️', desc: '阴' },
  45: { icon: '🌫️', desc: '雾' },
  48: { icon: '🌫️', desc: '雾凇' },
  51: { icon: '🌦️', desc: '小毛毛雨' },
  53: { icon: '🌦️', desc: '中毛毛雨' },
  55: { icon: '🌧️', desc: '大毛毛雨' },
  61: { icon: '🌧️', desc: '小雨' },
  63: { icon: '🌧️', desc: '中雨' },
  65: { icon: '🌧️', desc: '大雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '🌨️', desc: '中雪' },
  75: { icon: '❄️', desc: '大雪' },
  77: { icon: '🌨️', desc: '雪粒' },
  80: { icon: '🌦️', desc: '阵雨' },
  81: { icon: '🌧️', desc: '中阵雨' },
  82: { icon: '⛈️', desc: '大阵雨' },
  85: { icon: '🌨️', desc: '阵雪' },
  86: { icon: '❄️', desc: '大阵雪' },
  95: { icon: '⛈️', desc: '雷暴' },
  96: { icon: '⛈️', desc: '雷暴+冰雹' },
  99: { icon: '⛈️', desc: '雷暴+大冰雹' },
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function Weather() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [cityName, setCityName] = useState('北京')
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<DailyForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const weatherInfo = useMemo(() => {
    if (!currentWeather) return null
    const info = weatherIcons[currentWeather.weatherCode] || { icon: '🌤️', desc: '未知' }
    return { ...info, ...currentWeather }
  }, [currentWeather])

  const fetchWeather = async (lat: number, lon: number, city: string) => {
    setLoading(true)
    setError(null)
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&timezone=auto`),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`)
      ])

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error('获取天气数据失败')
      }

      const weatherData = await weatherRes.json()
      const forecastData = await forecastRes.json()

      setCurrentWeather({
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        weatherCode: weatherData.current.weather_code,
        isDay: weatherData.current.is_day === 1
      })

      setForecast(
        forecastData.daily.time.map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(forecastData.daily.temperature_2m_max[i]),
          minTemp: Math.round(forecastData.daily.temperature_2m_min[i]),
          weatherCode: forecastData.daily.weather_code[i],
          sunrise: formatTime(forecastData.daily.sunrise[i]),
          sunset: formatTime(forecastData.daily.sunset[i])
        }))
      )

      setCityName(city)
      setShowSearch(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(39.9042, 116.4074, '北京')
  }, [])

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`
      )
      const data = await res.json()
      setSearchResults(
        (data.results || []).map((r: any) => ({
          name: r.name,
          country: r.country || '',
          latitude: r.latitude,
          longitude: r.longitude
        }))
      )
    } catch {
      setSearchResults([])
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchCities(searchQuery)
    }
  }

  const selectCity = (city: GeocodingResult) => {
    fetchWeather(city.latitude, city.longitude, `${city.name}, ${city.country}`)
    setSearchQuery('')
    setSearchResults([])
  }

  const getDayName = (dateStr: string, index: number) => {
    if (index === 0) return '今天'
    if (index === 1) return '明天'
    const date = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  return (
    <div className="app-container app-weather" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', padding: 20, overflow: 'auto' }}>
      {showSearch && (
        <div style={{ marginBottom: 16 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchCities(e.target.value)
              }}
              placeholder="搜索城市..."
              autoFocus
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 14
              }}
            />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </form>
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden' }}>
              {searchResults.map((city, i) => (
                <button
                  key={i}
                  onClick={() => selectCity(city)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  📍 {city.name}, {city.country}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!showSearch && (
        <button
          onClick={() => setShowSearch(true)}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          🔍 搜索城市...
        </button>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32 }}>⏳</div>
          <div style={{ marginTop: 8, color: '#aaa' }}>加载天气数据...</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ marginTop: 8, color: '#f66' }}>{error}</div>
          <button
            onClick={() => fetchWeather(39.9042, 116.4074, '北京')}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#4fc3f7',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && weatherInfo && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{cityName}</div>
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
              {currentTime.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64 }}>{weatherInfo.icon}</div>
            <div style={{ fontSize: 56, fontWeight: 200, lineHeight: 1 }}>{Math.round(weatherInfo.temperature)}°C</div>
            <div style={{ fontSize: 18, color: '#ccc', marginTop: 4 }}>{weatherInfo.desc}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            <div className="app-weather-detail" style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#888' }}>湿度</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{weatherInfo.humidity}%</div>
            </div>
            <div className="app-weather-detail" style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#888' }}>风速</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{weatherInfo.windSpeed} km/h</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#ccc' }}>5天预报</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {forecast.map((day, i) => {
                const info = weatherIcons[day.weatherCode] || { icon: '🌤️', desc: '未知' }
                return (
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
                    <span style={{ width: 50, fontWeight: 500 }}>{getDayName(day.date, i)}</span>
                    <span style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{info.icon}</span>
                    <span style={{ color: '#ccc', width: 60, textAlign: 'center', fontSize: 13 }}>{info.desc}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      <span style={{ color: '#aaa' }}>{day.minTemp}°</span>
                      {' '}
                      <span>{day.maxTemp}°</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {forecast[0] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 13 }}>
              <div>
                <div style={{ color: '#888' }}>日出</div>
                <div>{forecast[0].sunrise}</div>
              </div>
              <div>
                <div style={{ color: '#888' }}>日落</div>
                <div>{forecast[0].sunset}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
