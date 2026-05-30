import { useState, useEffect, useCallback, memo } from 'react'

interface WeatherData {
  temperature: number
  humidity: number
  weather: string
  windSpeed: number
  uvIndex: number
  feelsLike: number
  pressure: number
  visibility: number
  forecast: ForecastDay[]
  hourlyForecast: HourlyForecast[]
  alerts: WeatherAlert[]
}

interface ForecastDay {
  day: string
  date: string
  high: number
  low: number
  condition: string
  icon: string
  precipitation: number
}

interface HourlyForecast {
  time: string
  temp: number
  icon: string
  precipitation: number
}

interface WeatherAlert {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

const weatherConditions: Record<string, { icon: string; description: string }> = {
  'clear': { icon: '☀️', description: '晴朗' },
  'sunny': { icon: '🌤️', description: '晴' },
  'partly-cloudy': { icon: '⛅', description: '多云' },
  'cloudy': { icon: '☁️', description: '阴天' },
  'overcast': { icon: '🌥️', description: '阴' },
  'rain': { icon: '🌧️', description: '雨' },
  'light-rain': { icon: '🌦️', description: '小雨' },
  'heavy-rain': { icon: '⛈️', description: '大雨' },
  'thunderstorm': { icon: '⛈️', description: '雷暴' },
  'snow': { icon: '🌨️', description: '雪' },
  'fog': { icon: '🌫️', description: '雾' },
  'wind': { icon: '💨', description: '大风' },
}

const popularCities = [
  { name: '北京', country: '中国', lat: 39.9042, lon: 116.4074 },
  { name: '上海', country: '中国', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', country: '中国', lat: 22.5431, lon: 114.0579 },
  { name: '东京', country: '日本', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', country: '美国', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', country: '英国', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', country: '法国', lat: 48.8566, lon: 2.3522 },
  { name: '悉尼', country: '澳大利亚', lat: -33.8688, lon: 151.2093 },
]

const Weather = memo(function Weather() {
  const [selectedCity, setSelectedCity] = useState(popularCities[0])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const [showCityList, setShowCityList] = useState(false)
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchWeather = useCallback(async (city: typeof selectedCity) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`
      )
      
      if (!response.ok) throw new Error('Failed to fetch weather data')
      
      const data = await response.json()
      
      const getConditionFromCode = (code: number): string => {
        if (code === 0) return 'clear'
        if (code <= 3) return 'partly-cloudy'
        if (code <= 49) return 'fog'
        if (code <= 69) return 'rain'
        if (code <= 79) return 'snow'
        if (code <= 99) return 'thunderstorm'
        return 'cloudy'
      }

      const getDayName = (dateStr: string, index: number): string => {
        if (index === 0) return '今天'
        if (index === 1) return '明天'
        const date = new Date(dateStr)
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return days[date.getDay()]
      }

      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        weather: getConditionFromCode(data.current.weather_code),
        windSpeed: Math.round(data.current.wind_speed_10m),
        uvIndex: data.current.uv_index || 0,
        feelsLike: Math.round(data.current.apparent_temperature),
        pressure: 1013,
        visibility: 10,
        forecast: data.daily.time.slice(0, 7).map((date: string, i: number) => ({
          day: getDayName(date, i),
          date: date,
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          condition: getConditionFromCode(data.daily.weather_code[i]),
          icon: weatherConditions[getConditionFromCode(data.daily.weather_code[i])]?.icon || '🌤️',
          precipitation: data.daily.precipitation_probability_max[i] || 0,
        })),
        hourlyForecast: data.hourly.time.slice(0, 24).map((time: string, i: number) => {
          const date = new Date(time)
          return {
            time: date.getHours() + ':00',
            temp: Math.round(data.hourly.temperature_2m[i]),
            icon: weatherConditions[getConditionFromCode(data.hourly.weather_code[i])]?.icon || '🌤️',
            precipitation: data.hourly.precipitation_probability[i] || 0,
          }
        }),
        alerts: [],
      }

      setWeather(weatherData)
      setLastUpdated(new Date())
    } catch (err) {
      setError('无法获取天气数据')
      console.error('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather(selectedCity)
    const interval = setInterval(() => fetchWeather(selectedCity), 300000)
    return () => clearInterval(interval)
  }, [selectedCity, fetchWeather])

  const getWeatherInfo = () => {
    if (!weather) return null
    const info = weatherConditions[weather.weather]
    return info || { icon: '🌤️', description: '未知' }
  }

  const convertTemp = (temp: number): number => {
    if (unit === 'fahrenheit') {
      return Math.round(temp * 9/5 + 32)
    }
    return temp
  }

  if (loading && !weather) {
    return (
      <div style={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 18
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⛅</div>
          <div>加载天气数据...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      overflow: 'auto'
    }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <button
                onClick={() => setShowCityList(!showCityList)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 24,
                  fontWeight: 700
                }}
              >
                📍 {selectedCity.name}
              </button>
              {showCityList && (
                <div style={{
                  position: 'absolute',
                  top: 70,
                  left: 24,
                  background: 'rgba(30, 60, 114, 0.98)',
                  borderRadius: 12,
                  padding: 8,
                  minWidth: 250,
                  maxHeight: 300,
                  overflow: 'auto',
                  zIndex: 1000,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  {popularCities.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        setSelectedCity(city)
                        setShowCityList(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: selectedCity.name === city.name ? 'rgba(255,255,255,0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{city.name}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{city.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              {selectedCity.country}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setUnit('celsius')}
              style={{
                padding: '6px 12px',
                background: unit === 'celsius' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('fahrenheit')}
              style={{
                padding: '6px 12px',
                background: unit === 'fahrenheit' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              °F
            </button>
          </div>
        </div>

        {weather && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 96, marginBottom: 16 }}>
                {getWeatherInfo()?.icon}
              </div>
              <div style={{
                fontSize: 72,
                fontWeight: 200,
                color: '#fff',
                marginBottom: 8,
                textShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {convertTemp(weather.temperature)}°
              </div>
              <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                {getWeatherInfo()?.description}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                体感温度 {convertTemp(weather.feelsLike)}°
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24
            }}>
              {[
                { icon: '💧', label: '湿度', value: `${weather.humidity}%` },
                { icon: '💨', label: '风速', value: `${weather.windSpeed} km/h` },
                { icon: '☀️', label: '紫外线', value: weather.uvIndex.toFixed(1) },
                { icon: '🌡️', label: '气压', value: `${weather.pressure} hPa` },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
                Hourly Forecast
              </h3>
              <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 8
              }}>
                {weather.hourlyForecast.slice(0, 12).map((hour, i) => (
                  <div
                    key={i}
                    style={{
                      minWidth: 60,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: 12,
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                      {i === 0 ? '现在' : hour.time}
                    </div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{hour.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                      {convertTemp(hour.temp)}°
                    </div>
                    {hour.precipitation > 0 && (
                      <div style={{ fontSize: 10, color: '#60a5fa', marginTop: 4 }}>
                        {hour.precipitation}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
                7-Day Forecast
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weather.forecast.map((day, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: 12,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{ minWidth: 60, color: '#fff', fontWeight: 500 }}>{day.day}</div>
                    <div style={{ fontSize: 24 }}>{day.icon}</div>
                    <div style={{ minWidth: 60, color: '#fff', fontWeight: 600, textAlign: 'right' }}>
                      {convertTemp(day.high)}°
                    </div>
                    <div style={{ minWidth: 60, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                      {convertTemp(day.low)}°
                    </div>
                    {day.precipitation > 0 && (
                      <div style={{ minWidth: 40, color: '#60a5fa', fontSize: 12, textAlign: 'right' }}>
                        💧{day.precipitation}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {lastUpdated && (
              <div style={{
                marginTop: 24,
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                数据更新时间: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export default Weather
