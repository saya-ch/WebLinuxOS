// @ts-nocheck
import { useState, useEffect, useCallback, memo } from 'react'
import {
  CloudRainIcon, ThermometerIcon, WindIcon, SunIcon,
  DropletIcon, EyeIcon, SearchIcon, MapPinIcon,
  RefreshCwIcon, StarIcon, HistoryIcon, ActivityIcon,
  CloudIcon, ZapIcon, GlobeIcon, BarChart3Icon,
  CalendarIcon, ClockIcon, SparklesIcon, AlertTriangleIcon
} from '../icons'

interface WeatherData {
  temperature: number
  temperatureMax: number
  temperatureMin: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  weatherDescription: string
  visibility: number
  pressure: number
  cloudCover: number
  uvIndex?: number
  precipitation: number
  isDay: number
}

interface ForecastDay {
  date: string
  temperatureMax: number
  temperatureMin: number
  weatherCode: number
  precipitation: number
  dayOfWeek: string
}

interface HourlyData {
  time: string
  temperature: number
  weatherCode: number
  precipitation: number
}

interface AirQualityData {
  aqi: number
  aqiLevel: string
  pm25: number
  pm10: number
  o3: number
  no2: number
  so2: number
  co: number
  dominantPollutant: string
}

interface City {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  isFavorite: boolean
}

const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: '晴朗', icon: '☀️' },
  1: { description: '大部分晴朗', icon: '🌤️' },
  2: { description: '局部多云', icon: '⛅' },
  3: { description: '阴天', icon: '☁️' },
  45: { description: '有雾', icon: '🌫️' },
  48: { description: '雾凇', icon: '🌫️' },
  51: { description: '小毛毛雨', icon: '🌦️' },
  53: { description: '毛毛雨', icon: '🌦️' },
  55: { description: '大毛毛雨', icon: '🌧️' },
  61: { description: '小雨', icon: '🌧️' },
  63: { description: '中雨', icon: '🌧️' },
  65: { description: '大雨', icon: '🌧️' },
  71: { description: '小雪', icon: '🌨️' },
  73: { description: '中雪', icon: '🌨️' },
  75: { description: '大雪', icon: '❄️' },
  80: { description: '阵雨', icon: '🌦️' },
  81: { description: '较大阵雨', icon: '🌧️' },
  82: { description: '强阵雨', icon: '⛈️' },
  95: { description: '雷暴', icon: '⛈️' },
  96: { description: '雷暴伴小冰雹', icon: '⛈️' },
  99: { description: '雷暴伴大冰雹', icon: '⛈️' },
}

const POPULAR_CITIES: City[] = [
  { id: 'beijing', name: '北京', country: '中国', latitude: 39.9042, longitude: 116.4074, isFavorite: true },
  { id: 'shanghai', name: '上海', country: '中国', latitude: 31.2304, longitude: 121.4737, isFavorite: true },
  { id: 'guangzhou', name: '广州', country: '中国', latitude: 23.1291, longitude: 113.2644, isFavorite: false },
  { id: 'shenzhen', name: '深圳', country: '中国', latitude: 22.5431, longitude: 114.0579, isFavorite: false },
  { id: 'chengdu', name: '成都', country: '中国', latitude: 30.5728, longitude: 104.0668, isFavorite: false },
  { id: 'hangzhou', name: '杭州', country: '中国', latitude: 30.2741, longitude: 120.1551, isFavorite: false },
  { id: 'hongkong', name: '香港', country: '中国', latitude: 22.3193, longitude: 114.1694, isFavorite: true },
  { id: 'tokyo', name: '东京', country: '日本', latitude: 35.6762, longitude: 139.6503, isFavorite: false },
  { id: 'london', name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278, isFavorite: false },
  { id: 'newyork', name: '纽约', country: '美国', latitude: 40.7128, longitude: -74.0060, isFavorite: false },
  { id: 'paris', name: '巴黎', country: '法国', latitude: 48.8566, longitude: 2.3522, isFavorite: false },
  { id: 'sydney', name: '悉尼', country: '澳大利亚', latitude: -33.8688, longitude: 151.2093, isFavorite: false },
]

const SEARCH_CITIES = [...POPULAR_CITIES]

const FAVORITES_KEY = 'weather-dashboard-favorites'

async function fetchWeatherData(lat: number, lon: number): Promise<any> {
  const current = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,visibility,surface_pressure,cloud_cover,is_day,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&hourly=temperature_2m,weather_code,precipitation&timezone=auto&forecast_days=7`
  )
  if (!current.ok) throw new Error('天气数据请求失败')
  return current.json()
}

async function fetchAirQualityData(lat: number, lon: number): Promise<any> {
  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`
  )
  if (!response.ok) throw new Error('空气质量数据请求失败')
  return response.json()
}

const WeatherDashboard = memo(function WeatherDashboard() {
  const [selectedCity, setSelectedCity] = useState<City>(POPULAR_CITIES[0])
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY)
    if (saved) {
      try { setFavorites(JSON.parse(saved)) } catch {}
    } else {
      setFavorites(POPULAR_CITIES.filter(c => c.isFavorite).map(c => c.id))
    }
  }, [])

  const saveFavorites = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
  }, [])

  const fetchData = useCallback(async (city: City) => {
    setIsLoading(true)
    setError('')
    try {
      const [weather, air] = await Promise.all([
        fetchWeatherData(city.latitude, city.longitude),
        fetchAirQualityData(city.latitude, city.longitude).catch(() => null),
      ])

      if (weather.current) {
        const w = weather.current
        const weatherInfo = WEATHER_CODES[w.weather_code] || { description: '未知', icon: '❓' }
        setWeatherData({
          temperature: w.temperature_2m,
          temperatureMax: weather.daily?.temperature_2m_max?.[0] || w.temperature_2m,
          temperatureMin: weather.daily?.temperature_2m_min?.[0] || w.temperature_2m,
          humidity: w.relative_humidity_2m,
          windSpeed: w.wind_speed_10m,
          windDirection: w.wind_direction_10m,
          weatherCode: w.weather_code,
          weatherDescription: weatherInfo.description,
          visibility: w.visibility,
          pressure: w.surface_pressure,
          cloudCover: w.cloud_cover,
          precipitation: w.precipitation,
          isDay: w.is_day,
        })

        if (weather.daily) {
          const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          const today = new Date()
          setForecast(weather.daily.time.map((dateStr: string, idx: number) => {
            const date = new Date(dateStr)
            const dayOffset = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return {
              date: dateStr,
              temperatureMax: weather.daily.temperature_2m_max[idx],
              temperatureMin: weather.daily.temperature_2m_min[idx],
              weatherCode: weather.daily.weather_code[idx],
              precipitation: weather.daily.precipitation_sum[idx],
              dayOfWeek: dayOffset === 0 ? '今天' : dayOffset === 1 ? '明天' : days[date.getDay()],
            }
          }))
        }

        if (weather.hourly) {
          setHourlyData(weather.hourly.time.slice(0, 24).map((time: string, idx: number) => ({
            time: new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit' }),
            temperature: weather.hourly.temperature_2m[idx],
            weatherCode: weather.hourly.weather_code[idx],
            precipitation: weather.hourly.precipitation[idx],
          })))
        }
      }

      if (air?.current) {
        const a = air.current
        const aqi = Math.max(a.pm2_5 * 3 + a.pm10 * 2 + a.no2 + a.o3 / 2, 0)
        let level = '优'
        if (aqi > 50) level = '良'
        if (aqi > 100) level = '轻度污染'
        if (aqi > 150) level = '中度污染'
        if (aqi > 200) level = '重度污染'
        if (aqi > 300) level = '严重污染'
        
        setAirQuality({
          aqi: Math.round(aqi),
          aqiLevel: level,
          pm25: a.pm2_5,
          pm10: a.pm10,
          o3: a.ozone,
          no2: a.nitrogen_dioxide,
          so2: a.sulphur_dioxide,
          co: a.carbon_monoxide,
          dominantPollutant: a.pm2_5 > a.pm10 ? 'PM2.5' : 'PM10',
        })
      }

      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取天气数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(selectedCity)
  }, [selectedCity, fetchData])

  const handleToggleFavorite = useCallback((cityId: string) => {
    const newFavorites = favorites.includes(cityId)
      ? favorites.filter(id => id !== cityId)
      : [...favorites, cityId]
    saveFavorites(newFavorites)
  }, [favorites, saveFavorites])

  const filteredCities = SEARCH_CITIES.filter(c => {
    if (showFavoritesOnly && !favorites.includes(c.id)) return false
    if (searchTerm && !c.name.includes(searchTerm) && !c.country.includes(searchTerm)) return false
    return true
  })

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981'
    if (aqi <= 100) return '#fbbf24'
    if (aqi <= 150) return '#f59e0b'
    if (aqi <= 200) return '#ef4444'
    return '#991b1b'
  }

  const getWindDirection = (deg: number) => {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
    const idx = Math.round(deg / 45) % 8
    return directions[idx]
  }

  const getWeatherBackground = () => {
    if (!weatherData) return 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
    const code = weatherData.weatherCode
    const isDay = weatherData.isDay === 1
    if (code === 0 || code === 1) {
      return isDay 
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : 'linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 100%)'
    }
    if (code >= 51 && code <= 65) {
      return 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)'
    }
    if (code >= 71 && code <= 75) {
      return 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)'
    }
    if (code >= 95) {
      return 'linear-gradient(135deg, #232526 0%, #414345 100%)'
    }
    return 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)'
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <CloudRainIcon size={24} color="#60a5fa" />
          <span>天气中心</span>
        </div>

        <div style={styles.searchContainer}>
          <SearchIcon size={14} />
          <input
            type="text"
            placeholder="搜索城市..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <button
          style={{
            ...styles.filterBtn,
            ...(showFavoritesOnly ? styles.filterBtnActive : {}),
          }}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <StarIcon size={14} color={showFavoritesOnly ? '#fbbf24' : 'rgba(255,255,255,0.5)'} />
          只看收藏
        </button>

        <div style={styles.cityList}>
          {filteredCities.map(city => {
            const isFav = favorites.includes(city.id)
            const isSelected = selectedCity.id === city.id
            return (
              <div
                key={city.id}
                style={{
                  ...styles.cityItem,
                  ...(isSelected ? styles.cityItemSelected : {}),
                }}
                onClick={() => setSelectedCity(city)}
              >
                <div style={styles.cityInfo}>
                  <MapPinIcon size={14} />
                  <span>{city.name}</span>
                  <span style={styles.cityCountry}>{city.country}</span>
                </div>
                <button
                  style={styles.favBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleFavorite(city.id)
                  }}
                >
                  <StarIcon size={14} color={isFav ? '#fbbf24' : 'rgba(255,255,255,0.3)'} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div style={styles.mainArea}>
        {isLoading ? (
          <div style={styles.loading}>
            <RefreshCwIcon size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <p>正在获取 {selectedCity.name} 的天气数据...</p>
          </div>
        ) : weatherData ? (
          <>
            <div style={{ ...styles.currentWeather, background: getWeatherBackground() }}>
              <div style={styles.currentWeatherInfo}>
                <div style={styles.location}>
                  <MapPinIcon size={18} />
                  {selectedCity.name}, {selectedCity.country}
                </div>
                <div style={styles.weatherMain}>
                  <span style={styles.weatherIcon}>
                    {WEATHER_CODES[weatherData.weatherCode]?.icon || '❓'}
                  </span>
                  <div style={styles.tempInfo}>
                    <span style={styles.temperature}>{Math.round(weatherData.temperature)}°</span>
                    <span style={styles.tempRange}>
                      <span style={{ color: '#ef4444' }}>↑{Math.round(weatherData.temperatureMax)}°</span>
                      <span style={{ color: '#3b82f6' }}>↓{Math.round(weatherData.temperatureMin)}°</span>
                    </span>
                  </div>
                </div>
                <div style={styles.weatherDesc}>{weatherData.weatherDescription}</div>
                <div style={styles.lastUpdate}>
                  <ClockIcon size={12} />
                  更新于 {lastUpdate?.toLocaleTimeString()}
                </div>
              </div>

              <div style={styles.weatherMetrics}>
                <div style={styles.metricItem}>
                  <ThermometerIcon size={18} />
                  <div>
                    <span>体感温度</span>
                    <strong>{Math.round(weatherData.temperature)}°C</strong>
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <DropletIcon size={18} />
                  <div>
                    <span>湿度</span>
                    <strong>{weatherData.humidity}%</strong>
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <WindIcon size={18} />
                  <div>
                    <span>风速</span>
                    <strong>{weatherData.windSpeed} km/h {getWindDirection(weatherData.windDirection)}</strong>
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <EyeIcon size={18} />
                  <div>
                    <span>能见度</span>
                    <strong>{(weatherData.visibility / 1000).toFixed(1)} km</strong>
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <CloudIcon size={18} />
                  <div>
                    <span>云量</span>
                    <strong>{weatherData.cloudCover}%</strong>
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <ActivityIcon size={18} />
                  <div>
                    <span>气压</span>
                    <strong>{Math.round(weatherData.pressure)} hPa</strong>
                  </div>
                </div>
              </div>
            </div>

            {airQuality && (
              <div style={styles.airQualitySection}>
                <div style={styles.sectionHeader}>
                  <GlobeIcon size={16} color={getAQIColor(airQuality.aqi)} />
                  <span>空气质量监测</span>
                </div>
                <div style={styles.aqiMain}>
                  <div style={{ ...styles.aqiCircle, borderColor: getAQIColor(airQuality.aqi) }}>
                    <span style={{ color: getAQIColor(airQuality.aqi) }}>{airQuality.aqi}</span>
                    <small>AQI</small>
                  </div>
                  <div style={styles.aqiInfo}>
                    <h3 style={{ color: getAQIColor(airQuality.aqi) }}>{airQuality.aqiLevel}</h3>
                    <p>主要污染物: {airQuality.dominantPollutant}</p>
                  </div>
                </div>
                <div style={styles.pollutantGrid}>
                  <div style={styles.pollutantItem}>
                    <span>PM2.5</span>
                    <strong>{airQuality.pm25.toFixed(1)}</strong>
                  </div>
                  <div style={styles.pollutantItem}>
                    <span>PM10</span>
                    <strong>{airQuality.pm10.toFixed(1)}</strong>
                  </div>
                  <div style={styles.pollutantItem}>
                    <span>臭氧 O₃</span>
                    <strong>{airQuality.o3.toFixed(1)}</strong>
                  </div>
                  <div style={styles.pollutantItem}>
                    <span>二氧化氮 NO₂</span>
                    <strong>{airQuality.no2.toFixed(1)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.forecastSection}>
              <div style={styles.sectionHeader}>
                <CalendarIcon size={16} color="#60a5fa" />
                <span>7日天气预报</span>
              </div>
              <div style={styles.forecastGrid}>
                {forecast.map((day, idx) => (
                  <div key={idx} style={styles.forecastDay}>
                    <span style={styles.dayLabel}>{day.dayOfWeek}</span>
                    <span style={styles.forecastIcon}>
                      {WEATHER_CODES[day.weatherCode]?.icon || '❓'}
                    </span>
                    <span style={{ ...styles.forecastTempMax, color: '#ef4444' }}>
                      {Math.round(day.temperatureMax)}°
                    </span>
                    <span style={{ ...styles.forecastTempMin, color: '#3b82f6' }}>
                      {Math.round(day.temperatureMin)}°
                    </span>
                    {day.precipitation > 0 && (
                      <span style={styles.precipitation}>
                        <DropletIcon size={10} /> {day.precipitation}mm
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {hourlyData.length > 0 && (
              <div style={styles.hourlySection}>
                <div style={styles.sectionHeader}>
                  <ClockIcon size={16} color="#60a5fa" />
                  <span>24小时温度趋势</span>
                </div>
                <div style={styles.hourlyChart}>
                  {(() => {
                    const temps = hourlyData.map(h => h.temperature)
                    const min = Math.min(...temps)
                    const max = Math.max(...temps)
                    const range = max - min || 1
                    return hourlyData.map((h, idx) => {
                      const height = ((h.temperature - min) / range) * 80 + 20
                      return (
                        <div key={idx} style={styles.hourlyBar}>
                          <div style={{ ...styles.bar, height: `${height}%` }}>
                            <span style={styles.barTemp}>{Math.round(h.temperature)}°</span>
                          </div>
                          {idx % 3 === 0 && <span style={styles.barTime}>{h.time}</span>}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={styles.errorState}>
            <AlertTriangleIcon size={48} color="#ef4444" />
            <h3>加载失败</h3>
            <p>{error}</p>
            <button style={styles.retryBtn} onClick={() => fetchData(selectedCity)}>
              <RefreshCwIcon size={14} />
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    height: '100%',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  sidebar: {
    width: 260,
    background: 'rgba(0,0,0,0.3)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 20px',
    fontSize: 18,
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    margin: 12,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 12px 12px',
    padding: '8px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontSize: 12,
  },
  filterBtnActive: {
    background: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.3)',
    color: '#fbbf24',
  },
  cityList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px 12px',
  },
  cityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 4,
    '&:hover': {
      background: 'rgba(255,255,255,0.05)',
    },
  },
  cityItemSelected: {
    background: 'rgba(96,165,250,0.15)',
    borderLeft: '3px solid #60a5fa',
  },
  cityInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  cityCountry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  favBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  mainArea: {
    flex: 1,
    overflowY: 'auto',
    padding: 24,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  currentWeather: {
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 280,
  },
  currentWeatherInfo: {
    position: 'relative',
    zIndex: 1,
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  weatherMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 72,
    lineHeight: 1,
  },
  tempInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  temperature: {
    fontSize: 64,
    fontWeight: 200,
    lineHeight: 1,
  },
  tempRange: {
    display: 'flex',
    gap: 16,
    fontSize: 14,
    marginTop: 8,
  },
  weatherDesc: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  lastUpdate: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  weatherMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
    marginTop: 24,
    padding: 20,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  metricItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    '& div': {
      display: 'flex',
      flexDirection: 'column',
      '& span': { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
      '& strong': { fontSize: 15, color: '#fff' },
    },
  },
  airQualitySection: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
  },
  aqiMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    marginBottom: 20,
  },
  aqiCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '& span': { fontSize: 28, fontWeight: 700 },
    '& small': { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  },
  aqiInfo: {
    '& h3': { margin: 0, fontSize: 20 },
    '& p': { margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  },
  pollutantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
  },
  pollutantItem: {
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    '& span': { fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block' },
    '& strong': { fontSize: 16, color: '#fff' },
  },
  forecastSection: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  forecastGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 12,
  },
  forecastDay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  forecastIcon: {
    fontSize: 28,
  },
  forecastTempMax: {
    fontSize: 14,
    fontWeight: 600,
  },
  forecastTempMin: {
    fontSize: 13,
  },
  precipitation: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: '#60a5fa',
  },
  hourlySection: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 24,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  hourlyChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 4,
    height: 120,
    padding: '0 4px',
  },
  hourlyBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: 20,
    background: 'linear-gradient(to top, #60a5fa, #3b82f6)',
    borderRadius: '4px 4px 0 0',
    position: 'relative',
    minHeight: 20,
  },
  barTemp: {
    position: 'absolute',
    top: -16,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  barTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
    '& h3': { margin: 0 },
    '& p': { color: 'rgba(255,255,255,0.6)' },
  },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    border: 'none',
    color: 'white',
    fontSize: 14,
    cursor: 'pointer',
  },
};

export default WeatherDashboard
