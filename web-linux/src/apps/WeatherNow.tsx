import { useState, useEffect, useCallback } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Search, MapPin, RefreshCw, Navigation } from 'lucide-react'

interface WeatherData {
  temperature: number
  temperatureMax: number
  temperatureMin: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
  isDay: boolean
  precipitation: number
  forecast: ForecastDay[]
}

interface ForecastDay {
  date: string
  temperatureMax: number
  temperatureMin: number
  weatherCode: number
  description: string
}

interface Location {
  name: string
  latitude: number
  longitude: number
  country?: string
}

const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: '晴朗', icon: 'sun' },
  1: { description: '基本晴朗', icon: 'sun' },
  2: { description: '局部多云', icon: 'cloud' },
  3: { description: '阴天', icon: 'cloud' },
  45: { description: '有雾', icon: 'cloud' },
  48: { description: '雾凇', icon: 'cloud' },
  51: { description: '小毛毛雨', icon: 'rain' },
  53: { description: '毛毛雨', icon: 'rain' },
  55: { description: '大毛毛雨', icon: 'rain' },
  61: { description: '小雨', icon: 'rain' },
  63: { description: '中雨', icon: 'rain' },
  65: { description: '大雨', icon: 'rain' },
  71: { description: '小雪', icon: 'snow' },
  73: { description: '中雪', icon: 'snow' },
  75: { description: '大雪', icon: 'snow' },
  77: { description: '雪粒', icon: 'snow' },
  80: { description: '小阵雨', icon: 'rain' },
  81: { description: '阵雨', icon: 'rain' },
  82: { description: '大阵雨', icon: 'rain' },
  85: { description: '小阵雪', icon: 'snow' },
  86: { description: '大阵雪', icon: 'snow' },
  95: { description: '雷暴', icon: 'thunder' },
  96: { description: '雷暴伴小冰雹', icon: 'thunder' },
  99: { description: '雷暴伴大冰雹', icon: 'thunder' },
}

const SEARCH_CITIES = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '南京',
  '重庆', '西安', '天津', '苏州', '郑州', '长沙', '沈阳', '青岛',
  'Tokyo', 'London', 'New York', 'Paris', 'Sydney', 'Berlin', 'Moscow', 'Dubai',
]

const WeatherIcon = ({ type, size = 48 }: { type: string; size?: number }) => {
  const iconProps = { size, strokeWidth: 1.5 }
  switch (type) {
    case 'sun': return <Sun {...iconProps} style={{ color: '#fbbf24' }} />
    case 'cloud': return <Cloud {...iconProps} style={{ color: '#94a3b8' }} />
    case 'rain': return <CloudRain {...iconProps} style={{ color: '#60a5fa' }} />
    case 'snow': return <CloudSnow {...iconProps} style={{ color: '#e0f2fe' }} />
    case 'thunder': return <CloudLightning {...iconProps} style={{ color: '#a78bfa' }} />
    default: return <Sun {...iconProps} style={{ color: '#fbbf24' }} />
  }
}

export default function WeatherNow() {
  const [location, setLocation] = useState<Location>({ name: '北京', latitude: 39.9042, longitude: 116.4074 })
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [unit, setUnit] = useState<'C' | 'F'>('C')
  const [favorites, setFavorites] = useState<Location[]>([])

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,temperature_2m_max,temperature_2m_min,relative_humidity_2m,wind_speed_10m,weather_code,is_day,precipitation` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
        `&timezone=auto&forecast_days=7`
      )
      if (!response.ok) throw new Error('Weather API request failed')
      const data = await response.json()

      const current = data.current
      const daily = data.daily

      const currentCode = current.weather_code
      const weatherInfo = WEATHER_CODES[currentCode] || WEATHER_CODES[0]

      const forecast: ForecastDay[] = daily.time.map((date: string, i: number) => ({
        date,
        temperatureMax: daily.temperature_2m_max[i],
        temperatureMin: daily.temperature_2m_min[i],
        weatherCode: daily.weather_code[i],
        description: (WEATHER_CODES[daily.weather_code[i]] || WEATHER_CODES[0]).description,
      }))

      setWeather({
        temperature: current.temperature_2m,
        temperatureMax: current.temperature_2m_max,
        temperatureMin: current.temperature_2m_min,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: currentCode,
        description: weatherInfo.description,
        isDay: current.is_day === 1,
        precipitation: current.precipitation,
        forecast,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }, [])

  const geocodeCity = useCallback(async (cityName: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`
      )
      if (!response.ok) throw new Error('Geocoding request failed')
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const newLocation: Location = {
          name: result.name,
          latitude: result.latitude,
          longitude: result.longitude,
          country: result.country,
        }
        setLocation(newLocation)
        fetchWeather(result.latitude, result.longitude)
      } else {
        setError('City not found')
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to geocode')
      setLoading(false)
    }
  }, [fetchWeather])

  const searchCity = async () => {
    if (!searchQuery.trim()) return
    await geocodeCity(searchQuery.trim())
    setSearchQuery('')
    setShowSearch(false)
  }

  const toggleFavorite = () => {
    const isFav = favorites.some(f => f.name === location.name)
    if (isFav) {
      setFavorites(favorites.filter(f => f.name !== location.name))
    } else {
      setFavorites([...favorites, location])
    }
  }

  const convertTemp = (celsius: number) => {
    return unit === 'C' ? celsius : Math.round(celsius * 9 / 5 + 32)
  }

  useEffect(() => {
    fetchWeather(location.latitude, location.longitude)
  }, [location, fetchWeather])

  const currentWeatherInfo = weather ? (WEATHER_CODES[weather.weatherCode] || WEATHER_CODES[0]) : null
  const bgGradient = weather?.isDay 
    ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)' 
    : 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)'

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: weather ? bgGradient : '#1e293b',
      color: '#fff',
      transition: 'background 0.5s ease',
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cloud size={24} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>天气实时预报</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            °{unit}
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={14} /> 搜索
          </button>
          <button
            onClick={() => toggleFavorite()}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: favorites.some(f => f.name === location.name) ? '#fbbf24' : '#fff',
              cursor: 'pointer',
            }}
          >
            {favorites.some(f => f.name === location.name) ? '★' : '☆'}
          </button>
          <button
            onClick={() => fetchWeather(location.latitude, location.longitude)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div style={{
          padding: 16,
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCity()}
              placeholder="输入城市名称..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={searchCity}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              搜索
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginRight: 8 }}>热门城市:</span>
            {SEARCH_CITIES.slice(0, 12).map(city => (
              <button
                key={city}
                onClick={() => geocodeCity(city)}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Weather Display */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {error && (
          <div style={{
            padding: 16,
            background: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            marginBottom: 20,
          }}>
            <p style={{ margin: 0, color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        {weather && !error ? (
          <>
            {/* Location Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MapPin size={20} />
                <span style={{ fontSize: 24, fontWeight: 600 }}>{location.name}</span>
                {location.country && (
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{location.country}</span>
                )}
              </div>
            </div>

            {/* Current Weather */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 32,
            }}>
              {currentWeatherInfo && (
                <WeatherIcon type={currentWeatherInfo.icon} size={80} />
              )}
              <div style={{
                fontSize: 72,
                fontWeight: 200,
                lineHeight: 1,
                marginTop: 12,
              }}>
                {convertTemp(Math.round(weather.temperature))}°
              </div>
              <div style={{ fontSize: 18, marginTop: 8 }}>{weather.description}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                最高 {convertTemp(Math.round(weather.temperatureMax))}° / 最低 {convertTemp(Math.round(weather.temperatureMin))}°
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 32,
            }}>
              <StatCard icon={<Droplets size={20} />} label="湿度" value={`${weather.humidity}%`} />
              <StatCard icon={<Wind size={20} />} label="风速" value={`${weather.windSpeed} km/h`} />
              <StatCard icon={<CloudRain size={20} />} label="降水量" value={`${weather.precipitation} mm`} />
              <StatCard icon={weather.isDay ? <Sun size={20} /> : <Cloud size={20} />} label="时段" value={weather.isDay ? '白天' : '夜晚'} />
            </div>

            {/* 7-Day Forecast */}
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 20,
              backdropFilter: 'blur(10px)',
            }}>
              <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16 }}>7日天气预报</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {weather.forecast.map((day, i) => {
                  const dayDate = new Date(day.date)
                  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayDate.getDay()]
                  const displayDate = i === 0 ? '今天' : `${weekday} ${dayDate.getMonth() + 1}/${dayDate.getDate()}`
                  const dayInfo = WEATHER_CODES[day.weatherCode] || WEATHER_CODES[0]
                  return (
                    <div
                      key={day.date}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '8px 12px',
                        background: i === 0 ? 'rgba(255,255,255,0.2)' : 'transparent',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ width: 80 }}>{displayDate}</div>
                      <WeatherIcon type={dayInfo.icon} size={28} />
                      <div style={{ flex: 1, fontSize: 14 }}>{day.description}</div>
                      <div style={{ fontSize: 14 }}>
                        <span style={{ color: '#fbbf24' }}>{convertTemp(Math.round(day.temperatureMax))}°</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', margin: '0 6px' }}>/</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{convertTemp(Math.round(day.temperatureMin))}°</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16 }}>收藏城市</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {favorites.map(fav => (
                    <button
                      key={fav.name}
                      onClick={() => {
                        setLocation(fav)
                        fetchWeather(fav.latitude, fav.longitude)
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 20,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Navigation size={14} />
                      {fav.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}>
            <RefreshCw size={40} className="animate-spin" style={{ opacity: 0.5 }} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        数据来源: Open-Meteo API
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: 16,
      background: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
        {icon}
        <span style={{ fontSize: 12 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  )
}