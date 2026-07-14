import { useState, useEffect, useCallback } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, RefreshCw, Search } from 'lucide-react'

interface WeatherData {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number
  }
  clouds: {
    all: number
  }
  visibility: number
  sys: {
    sunrise: number
    sunset: number
    country: string
  }
  coord: {
    lat: number
    lon: number
  }
}

const weatherIcons: Record<string, React.ReactNode> = {
  'Clear': <Sun size={48} style={{ color: '#fbbf24' }} />,
  'Clouds': <Cloud size={48} style={{ color: '#94a3b8' }} />,
  'Rain': <CloudRain size={48} style={{ color: '#60a5fa' }} />,
  'Drizzle': <CloudRain size={48} style={{ color: '#93c5fd' }} />,
  'Thunderstorm': <CloudRain size={48} style={{ color: '#a855f7' }} />,
  'Snow': <CloudSnow size={48} style={{ color: '#e0f2fe' }} />,
  'Mist': <Cloud size={48} style={{ color: '#9ca3af' }} />,
  'Smoke': <Cloud size={48} style={{ color: '#6b7280' }} />,
  'Haze': <Cloud size={48} style={{ color: '#a3a3a3' }} />,
  'Dust': <Cloud size={48} style={{ color: '#ca8a04' }} />,
  'Fog': <Cloud size={48} style={{ color: '#9ca3af' }} />,
  'Sand': <Cloud size={48} style={{ color: '#d97706' }} />,
  'Ash': <Cloud size={48} style={{ color: '#78716c' }} />,
  'Squalls': <Wind size={48} style={{ color: '#60a5fa' }} />,
  'Tornado': <Wind size={48} style={{ color: '#dc2626' }} />,
}

const WeatherApp = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [city, setCity] = useState('Beijing')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async (location: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=7453d2a457f3845e3a21c8584c3a3c67&units=metric`,
      )
      if (!response.ok) {
        throw new Error('城市未找到')
      }
      const data = await response.json()
      setWeather(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取天气失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather(city)
  }, [city, fetchWeather])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (city.trim()) {
      fetchWeather(city.trim())
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
        <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>正在获取天气...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 20 }}>
        <span style={{ fontSize: 48 }}>🌍</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 16 }}>{error}</span>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="输入城市名..."
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Search size={14} />
            搜索
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24 }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="输入城市名..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--window-border)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#6b5cf6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Search size={16} />
          搜索
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MapPin size={18} style={{ color: 'var(--accent)' }} />
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
            {weather!.name}, {weather!.sys.country}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>{weatherIcons[weather!.weather[0].main] || <Cloud size={48} />}</div>
          <div>
            <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--text-primary)' }}>
              {Math.round(weather!.main.temp)}°C
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {weather!.weather[0].description}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Thermometer size={18} style={{ color: '#f97316' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>体感温度</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
            {Math.round(weather!.main.feels_like)}°C
          </div>
        </div>

        <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Droplets size={18} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>湿度</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
            {weather!.main.humidity}%
          </div>
        </div>

        <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Wind size={18} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>风速</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
            {weather!.wind.speed} m/s
          </div>
        </div>

        <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Cloud size={18} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>云量</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
            {weather!.clouds.all}%
          </div>
        </div>

        <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sun size={18} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>日出</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatTime(weather!.sys.sunrise)}
          </div>
        </div>

        <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sun size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>日落</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatTime(weather!.sys.sunset)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 12, background: 'rgba(139, 124, 240, 0.1)', borderRadius: 8, border: '1px solid rgba(139, 124, 240, 0.3)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
          数据来源: OpenWeatherMap API | 坐标: {weather!.coord.lat.toFixed(2)}, {weather!.coord.lon.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

export default WeatherApp