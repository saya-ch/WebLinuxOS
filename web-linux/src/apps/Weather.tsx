import { useState, useEffect, useMemo, memo } from 'react'
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Droplets, Wind, Eye, Thermometer, Sunrise, Sunset,
  Search, MapPin, AlertCircle
} from 'lucide-react'

interface CurrentWeather {
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  isDay: boolean
  uvIndex?: number
  precipitation?: number
  pressure?: number
  visibility?: number
}

interface HourlyForecast {
  time: string
  temperature: number
  weatherCode: number
  precipitation: number
}

interface DailyForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  sunrise: string
  sunset: string
  uvIndexMax: number
  precipitationSum: number
  windSpeedMax: number
}

interface GeocodingResult {
  name: string
  country: string
  latitude: number
  longitude: number
}

interface GeocodingResponse {
  results?: GeocodingResult[]
}

const weatherIcons: Record<number, { icon: typeof Sun; desc: string }> = {
  0: { icon: Sun, desc: '晴' },
  1: { icon: Sun, desc: '大部晴朗' },
  2: { icon: Cloud, desc: '局部多云' },
  3: { icon: Cloud, desc: '阴' },
  45: { icon: CloudFog, desc: '雾' },
  48: { icon: CloudFog, desc: '雾凇' },
  51: { icon: Droplets, desc: '小毛毛雨' },
  53: { icon: Droplets, desc: '中毛毛雨' },
  55: { icon: CloudRain, desc: '大毛毛雨' },
  61: { icon: CloudRain, desc: '小雨' },
  63: { icon: CloudRain, desc: '中雨' },
  65: { icon: CloudRain, desc: '大雨' },
  71: { icon: CloudSnow, desc: '小雪' },
  73: { icon: CloudSnow, desc: '中雪' },
  75: { icon: CloudSnow, desc: '大雪' },
  77: { icon: CloudSnow, desc: '雪粒' },
  80: { icon: CloudRain, desc: '阵雨' },
  81: { icon: CloudRain, desc: '中阵雨' },
  82: { icon: CloudLightning, desc: '大阵雨' },
  85: { icon: CloudSnow, desc: '阵雪' },
  86: { icon: CloudSnow, desc: '大阵雪' },
  95: { icon: CloudLightning, desc: '雷暴' },
  96: { icon: CloudLightning, desc: '雷暴+冰雹' },
  99: { icon: CloudLightning, desc: '雷暴+大冰雹' },
}

const uvIndexLevels = [
  { max: 2, label: '低', color: '#4ade80' },
  { max: 5, label: '中等', color: '#facc15' },
  { max: 7, label: '高', color: '#f97316' },
  { max: 10, label: '很高', color: '#ef4444' },
  { max: 100, label: '极高', color: '#8b5cf6' },
]

const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatHour = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', hour12: false })
}

const getWindDirection = (degrees: number): string => {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

const getUvLevel = (uv: number): { label: string; color: string } => {
  return uvIndexLevels.find(level => uv <= level.max) || uvIndexLevels[uvIndexLevels.length - 1]
}

const getBackgroundGradient = (weatherCode: number, isDay: boolean): string => {
  if (!isDay) {
    return 'linear-gradient(180deg, #0c0c1e 0%, #1a1a3e 50%, #2d1b4e 100%)'
  }
  if (weatherCode <= 2) {
    return 'linear-gradient(180deg, #1e88e5 0%, #64b5f6 50%, #bbdefb 100%)'
  }
  if (weatherCode <= 48) {
    return 'linear-gradient(180deg, #546e7a 0%, #78909c 50%, #b0bec5 100%)'
  }
  if (weatherCode <= 65) {
    return 'linear-gradient(180deg, #37474f 0%, #546e7a 50%, #78909c 100%)'
  }
  if (weatherCode <= 86) {
    return 'linear-gradient(180deg, #455a64 0%, #607d8b 50%, #90a4ae 100%)'
  }
  return 'linear-gradient(180deg, #263238 0%, #455a64 50%, #607d8b 100%)'
}

const WeatherIcon = memo(({ code, size = 24, className = '' }: { code: number; size?: number; className?: string }) => {
  const info = weatherIcons[code] || { icon: Sun, desc: '未知' }
  const Icon = info.icon
  return <Icon size={size} className={className} />
})

const HourlyForecastCard = memo(({ hour }: { hour: HourlyForecast }) => {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        textAlign: 'center',
        minWidth: 74,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        scrollSnapAlign: 'start',
        transition: 'transform 0.2s ease',
      }}
    >
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', marginBottom: 8, fontWeight: 500 }}>{formatHour(hour.time)}</div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
        <WeatherIcon code={hour.weatherCode} size={30} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>{hour.temperature}°</div>
      {hour.precipitation > 0 && (
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.58)', marginTop: 3 }}>{hour.precipitation}%</div>
      )}
    </div>
  )
})

const DailyForecastRow = memo(({ day, index }: { day: DailyForecast; index: number }) => {
  const getDayName = (dateStr: string, idx: number) => {
    if (idx === 0) return '今天'
    if (idx === 1) return '明天'
    const date = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 18,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease',
      }}
    >
      <span style={{ width: 62, fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' }}>{getDayName(day.date, index)}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 100 }}>
        <WeatherIcon code={day.weatherCode} size={30} />
        <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12.5, width: 48 }}>{weatherIcons[day.weatherCode]?.desc}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {day.precipitationSum > 0 && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>{day.precipitationSum}mm</span>
        )}
        <span style={{ fontFamily: 'monospace', fontSize: 14.5, fontWeight: 500 }}>
          <span style={{ color: 'rgba(255,255,255,0.58)' }}>{day.minTemp}°</span>
          {' / '}
          <span style={{ fontWeight: 700 }}>{day.maxTemp}°</span>
        </span>
      </div>
    </div>
  )
})

export default function Weather() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [cityName, setCityName] = useState('北京')
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
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
    const info = weatherIcons[currentWeather.weatherCode] || { icon: Sun, desc: '未知' }
    return { ...info, ...currentWeather }
  }, [currentWeather])

  const fetchWeather = async (lat: number, lon: number, city: string) => {
    setLoading(true)
    setError(null)
    try {
      const [weatherRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day,surface_pressure,precipitation,visibility&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`),
      ])

      if (!weatherRes.ok) {
        throw new Error('获取天气数据失败')
      }

      const weatherData = await weatherRes.json()

      setCurrentWeather({
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        windDirection: weatherData.current.wind_direction_10m,
        weatherCode: weatherData.current.weather_code,
        isDay: weatherData.current.is_day === 1,
        pressure: weatherData.current.surface_pressure,
        precipitation: weatherData.current.precipitation,
        visibility: weatherData.current.visibility / 1000,
      })

      setHourlyForecast(
        weatherData.hourly.time.slice(0, 24).map((time: string, i: number) => ({
          time,
          temperature: Math.round(weatherData.hourly.temperature_2m[i]),
          weatherCode: weatherData.hourly.weather_code[i],
          precipitation: weatherData.hourly.precipitation_probability[i],
        }))
      )

      setForecast(
        weatherData.daily.time.map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(weatherData.daily.temperature_2m_max[i]),
          minTemp: Math.round(weatherData.daily.temperature_2m_min[i]),
          weatherCode: weatherData.daily.weather_code[i],
          sunrise: formatTime(weatherData.daily.sunrise[i]),
          sunset: formatTime(weatherData.daily.sunset[i]),
          uvIndexMax: weatherData.daily.uv_index_max[i],
          precipitationSum: weatherData.daily.precipitation_sum[i],
          windSpeedMax: weatherData.daily.wind_speed_10m_max[i],
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
      const data: GeocodingResponse = await res.json()
      setSearchResults(
        (data.results || []).map((r) => ({
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

  const backgroundGradient = useMemo(() => {
    if (!currentWeather) return 'linear-gradient(180deg, #1e88e5 0%, #64b5f6 100%)'
    return getBackgroundGradient(currentWeather.weatherCode, currentWeather.isDay)
  }, [currentWeather])

  return (
    <div
      className="app-container app-weather"
      style={{
        background: backgroundGradient,
        color: '#fff',
        padding: 0,
        overflow: 'auto',
        minHeight: '100%',
      }}
    >
      <div style={{ padding: 20 }}>
        {showSearch && (
          <div style={{ marginBottom: 20 }}>
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
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 15,
                  backdropFilter: 'blur(10px)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 16,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            </form>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.25)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                {searchResults.map((city, i) => (
                  <button
                    key={i}
                    onClick={() => selectCity(city)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: 'none',
                      background: 'transparent',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 15,
                      borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={16} />
                    {city.name}, {city.country}
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
              padding: '12px 16px',
              borderRadius: 16,
              border: 'none',
              background: 'rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              fontSize: 14,
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Search size={16} />
            搜索城市...
          </button>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20' }}>
            <div style={{ fontSize: 48, animation: 'spin 1s linear infinite' }}>
              <Sun size={48} />
            </div>
            <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>加载天气数据...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20' }}>
            <div style={{ fontSize: 48 }}>
              <AlertCircle size={48} />
            </div>
            <div style={{ marginTop: 12, color: '#ffcccb', fontSize: 15 }}>{error}</div>
            <button
              onClick={() => fetchWeather(39.9042, 116.4074, '北京')}
              style={{
                marginTop: 20,
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && weatherInfo && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{cityName}</div>
              <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.68)', marginTop: 5 }}>
                {currentTime.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32, padding: '32px 24px', background: 'rgba(255,255,255,0.08)', borderRadius: 28, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 96, marginBottom: 12 }}>
                <WeatherIcon code={weatherInfo.weatherCode} size={96} />
              </div>
              <div style={{ fontSize: 78, fontWeight: 200, lineHeight: 1, letterSpacing: '-3px', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{Math.round(weatherInfo.temperature)}°C</div>
              <div style={{ fontSize: 21, color: 'rgba(255,255,255,0.88)', marginTop: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{weatherInfo.desc}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
              <div style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'transform 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Droplets size={22} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>湿度</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{weatherInfo.humidity}%</div>
              </div>
              <div style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Wind size={22} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>风速</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{weatherInfo.windSpeed} km/h</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.58)', marginTop: 3 }}>{getWindDirection(weatherInfo.windDirection)}风</div>
              </div>
              <div style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Thermometer size={22} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>气压</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{Math.round(weatherInfo.pressure || 0)} hPa</div>
              </div>
              <div style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Eye size={22} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>能见度</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{weatherInfo.visibility?.toFixed(1) || '0'} km</div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>24小时预报</div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, scrollSnapType: 'x mandatory' }}>
                {hourlyForecast.map((hour, i) => (
                  <HourlyForecastCard key={i} hour={hour} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>7天预报</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {forecast.map((day, i) => (
                  <DailyForecastRow key={i} day={day} index={i} />
                ))}
              </div>
            </div>

            {forecast[0] && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(255,255,255,0.08)', borderRadius: 22, fontSize: 14, backdropFilter: 'blur(12px)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Sunrise size={26} style={{ marginBottom: 6, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                  <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12.5, fontWeight: 500 }}>日出</div>
                  <div style={{ fontWeight: 600, marginTop: 4, letterSpacing: '-0.02em' }}>{forecast[0].sunrise}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Sun size={26} style={{ marginBottom: 6, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                  <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12.5, fontWeight: 500 }}>紫外线</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: getUvLevel(forecast[0].uvIndexMax).color, letterSpacing: '-0.02em' }}>
                    {forecast[0].uvIndexMax.toFixed(1)} {getUvLevel(forecast[0].uvIndexMax).label}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Sunset size={26} style={{ marginBottom: 6, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                  <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12.5, fontWeight: 500 }}>日落</div>
                  <div style={{ fontWeight: 600, marginTop: 4, letterSpacing: '-0.02em' }}>{forecast[0].sunset}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
