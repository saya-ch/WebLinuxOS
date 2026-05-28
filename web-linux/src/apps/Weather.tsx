import { useState, useEffect, memo, useCallback } from 'react'

interface WeatherData {
  current: {
    temperature: number
    humidity: number
    weathercode: number
    windspeed: number
  }
  hourly: {
    time: string[]
    temperature: number[]
    weathercode: number[]
    humidity: number[]
  }
  daily: {
    time: string[]
    weathercode: number[]
    temperatureMax: number[]
    temperatureMin: number[]
  }
}

const weatherIcons: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌧️',
  53: '🌧️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '🌨️',
  77: '❄️',
  80: '🌦️',
  81: '🌦️',
  82: '🌦️',
  85: '🌨️',
  86: '🌨️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️'
}

const weatherDescriptions: Record<number, string> = {
  0: '晴朗',
  1: '基本晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '中毛毛雨',
  55: '大毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '中阵雨',
  82: '大阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴小冰雹',
  99: '雷暴伴大冰雹'
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#4CAF50'
  if (aqi <= 100) return '#FFEB3B'
  if (aqi <= 150) return '#FF9800'
  if (aqi <= 200) return '#F44336'
  if (aqi <= 300) return '#9C27B0'
  return '#7B1FA2'
}

function getAQIDescription(aqi: number): string {
  if (aqi <= 50) return '优'
  if (aqi <= 100) return '良'
  if (aqi <= 150) return '轻度污染'
  if (aqi <= 200) return '中度污染'
  if (aqi <= 300) return '重度污染'
  return '严重污染'
}

const EnhancedWeather = memo(function EnhancedWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState({ lat: 39.9042, lon: 116.4074, city: '北京' })
  const [aqi, setAqi] = useState<number | null>(null)
  const [aqiLoading, setAqiLoading] = useState(false)

  const fetchWeather = useCallback(async (lat: number, lon: number, cityName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_100&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      )
      if (!response.ok) throw new Error('获取天气数据失败')
      const data = await response.json()
      setWeather({ current: data.current, hourly: data.hourly, daily: data.daily } as WeatherData)
      setLocation({ lat, lon, city: cityName })
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAQI = useCallback(async (lat: number, lon: number) => {
    setAqiLoading(true)
    try {
      const response = await fetch(
        `https://air-quality-api.com/api/v1/nearest_city?lat=${lat}&lon=${lon}`
      )
      if (response.ok) {
        const data = await response.json()
        setAqi(data.data?.current?.pollution?.aqius || null)
      }
    } catch {
      setAqi(null)
    } finally {
      setAqiLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather(location.lat, location.lon, location.city)
    fetchAQI(location.lat, location.lon)
  }, [location.lat, location.lon, location.city, fetchWeather, fetchAQI])

  const changeLocation = useCallback((city: string, lat: number, lon: number) => {
    fetchWeather(lat, lon, city)
    fetchAQI(lat, lon)
  }, [fetchWeather, fetchAQI])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#a0a0c8' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div>正在获取天气数据...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div>{error}</div>
        <button
          onClick={() => fetchWeather(location.lat, location.lon, location.city)}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '8px',
            color: '#e8e8f4',
            cursor: 'pointer'
          }}
        >
          重试
        </button>
      </div>
    )
  }

  if (!weather) return null

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(180deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 35, 0.9) 100%)'
    }}>
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        borderRadius: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              color: '#a0a0c8',
              marginBottom: '4px'
            }}>
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#e8e8f4',
              marginBottom: '4px'
            }}>
              {location.city}
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #e8e8f4, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {Math.round(weather.current.temperature)}°
            </div>
          </div>
          <div style={{ fontSize: '72px', textAlign: 'center' }}>
            {weatherIcons[weather.current.weathercode] || '🌤️'}
          </div>
        </div>

        <div style={{
          fontSize: '20px',
          color: '#e8e8f4',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {weatherDescriptions[weather.current.weathercode] || '未知天气'}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💧</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#e8e8f4' }}>
              {weather.current.humidity}%
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0c8' }}>湿度</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💨</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#e8e8f4' }}>
              {Math.round(weather.current.windspeed)} km/h
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0c8' }}>风速</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌡️</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#e8e8f4' }}>
              {weather.daily.temperatureMin[0]}° / {weather.daily.temperatureMax[0]}°
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0c8' }}>最高/最低</div>
          </div>
        </div>

        {aqi !== null && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>🌿</div>
              <div>
                <div style={{ fontSize: '14px', color: '#a0a0c8' }}>空气质量指数 (AQI)</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#e8e8f4' }}>
                  {aqi}
                </div>
              </div>
            </div>
            <div style={{
              padding: '8px 16px',
              background: getAQIColor(aqi),
              borderRadius: '20px',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {getAQIDescription(aqi)}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#e8e8f4',
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          未来24小时
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {weather.hourly.time.slice(0, 24).map((time, index) => {
            const hour = new Date(time).getHours()
            const displayHour = hour === 0 ? '00:00' : `${hour}:00`
            return (
              <div
                key={time}
                style={{
                  minWidth: '60px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 8px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  flexShrink: 0
                }}
              >
                <div style={{ fontSize: '11px', color: '#a0a0c8', marginBottom: '8px' }}>
                  {index === 0 ? '现在' : displayHour}
                </div>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {weatherIcons[weather.hourly.weathercode[index]] || '🌤️'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#e8e8f4' }}>
                  {Math.round(weather.hourly.temperature[index])}°
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#e8e8f4',
          marginBottom: '12px'
        }}>
          热门城市
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { name: '北京', lat: 39.9042, lon: 116.4074 },
            { name: '上海', lat: 31.2304, lon: 121.4737 },
            { name: '广州', lat: 23.1291, lon: 113.2644 },
            { name: '深圳', lat: 22.5431, lon: 114.0579 },
            { name: '成都', lat: 30.5728, lon: 104.0668 },
            { name: '杭州', lat: 30.2741, lon: 120.1551 },
            { name: '武汉', lat: 30.5928, lon: 114.3055 },
            { name: '西安', lat: 34.3416, lon: 108.9398 }
          ].map(city => (
            <button
              key={city.name}
              onClick={() => changeLocation(city.name, city.lat, city.lon)}
              style={{
                padding: '8px 16px',
                background: location.city === city.name ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${location.city === city.name ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '20px',
                color: location.city === city.name ? '#e8e8f4' : '#a0a0c8',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#e8e8f4',
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          未来7天预报
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {weather.daily.time.map((date, index) => {
            const dayName = index === 0 ? '今天' : index === 1 ? '明天' : new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })
            return (
              <div
                key={date}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontSize: '14px', color: '#e8e8f4', minWidth: '50px' }}>
                  {dayName}
                </div>
                <div style={{ fontSize: '24px' }}>
                  {weatherIcons[weather.daily.weathercode[index]] || '🌤️'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#a0a0c8',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  {weatherDescriptions[weather.daily.weathercode[index]] || '未知'}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#e8e8f4', fontWeight: '600' }}>
                    {Math.round(weather.daily.temperatureMax[index])}°
                  </span>
                  <span style={{ color: '#a0a0c8' }}>/</span>
                  <span style={{ color: '#a0a0c8' }}>
                    {Math.round(weather.daily.temperatureMin[index])}°
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#a0a0c8',
        textAlign: 'center'
      }}>
        数据来源: Open-Meteo API | 更新时间: {new Date().toLocaleTimeString('zh-CN')}
      </div>
    </div>
  )
})

export default EnhancedWeather
