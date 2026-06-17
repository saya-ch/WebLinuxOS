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
  airQuality?: AirQuality
  sunInfo?: SunInfo
}

interface AirQuality {
  aqi: number
  category: string
  pm25: number
  pm10: number
  o3: number
  no2: number
}

interface SunInfo {
  sunrise: string
  sunset: string
  dayLength: string
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
  { name: '广州', country: '中国', lat: 23.1291, lon: 113.2644 },
  { name: '成都', country: '中国', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', country: '中国', lat: 30.2741, lon: 120.1551 },
  { name: '武汉', country: '中国', lat: 30.5928, lon: 114.3055 },
  { name: '西安', country: '中国', lat: 34.3416, lon: 108.9398 },
  { name: '东京', country: '日本', lat: 35.6762, lon: 139.6503 },
  { name: '首尔', country: '韩国', lat: 37.5665, lon: 126.9780 },
  { name: '新加坡', country: '新加坡', lat: 1.3521, lon: 103.8198 },
  { name: '曼谷', country: '泰国', lat: 13.7563, lon: 100.5018 },
  { name: '纽约', country: '美国', lat: 40.7128, lon: -74.0060 },
  { name: '洛杉矶', country: '美国', lat: 34.0522, lon: -118.2437 },
  { name: '旧金山', country: '美国', lat: 37.7749, lon: -122.4194 },
  { name: '伦敦', country: '英国', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', country: '法国', lat: 48.8566, lon: 2.3522 },
  { name: '柏林', country: '德国', lat: 52.5200, lon: 13.4050 },
  { name: '悉尼', country: '澳大利亚', lat: -33.8688, lon: 151.2093 },
  { name: '迪拜', country: '阿联酋', lat: 25.2048, lon: 55.2708 },
  { name: '孟买', country: '印度', lat: 19.0760, lon: 72.8777 },
]

const FALLBACK_WEATHER: WeatherData = {
  temperature: 22,
  humidity: 65,
  weather: 'partly-cloudy',
  windSpeed: 12,
  uvIndex: 5,
  feelsLike: 24,
  pressure: 1013,
  visibility: 10,
  forecast: [
    { day: '今天', date: '', high: 26, low: 18, condition: 'partly-cloudy', icon: '⛅', precipitation: 10 },
    { day: '明天', date: '', high: 28, low: 20, condition: 'sunny', icon: '☀️', precipitation: 5 },
    { day: '周三', date: '', high: 25, low: 19, condition: 'rain', icon: '🌧️', precipitation: 70 },
    { day: '周四', date: '', high: 23, low: 17, condition: 'cloudy', icon: '☁️', precipitation: 30 },
    { day: '周五', date: '', high: 27, low: 20, condition: 'sunny', icon: '☀️', precipitation: 0 },
    { day: '周六', date: '', high: 29, low: 21, condition: 'clear', icon: '☀️', precipitation: 0 },
    { day: '周日', date: '', high: 28, low: 20, condition: 'partly-cloudy', icon: '⛅', precipitation: 15 },
  ],
  hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temp: 20 + Math.sin(i / 24 * Math.PI) * 8,
    icon: i >= 6 && i <= 18 ? '☀️' : '🌙',
    precipitation: Math.floor(Math.random() * 30),
  })),
  alerts: [],
  airQuality: { aqi: 58, category: '良', pm25: 32, pm10: 48, o3: 62, no2: 25 },
  sunInfo: { sunrise: '06:12', sunset: '19:45', dayLength: '13小时33分钟' },
}

function getCachedWeather(cityKey: string): WeatherData | null {
  try {
    const raw = localStorage.getItem(`weather-cache-${cityKey}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const age = Date.now() - parsed.timestamp
    if (age < 10 * 60 * 1000) { // 10 分钟缓存
      return parsed.data
    }
    return null
  } catch {
    return null
  }
}

function setCachedWeather(cityKey: string, data: WeatherData) {
  try {
    localStorage.setItem(`weather-cache-${cityKey}`, JSON.stringify({
      timestamp: Date.now(),
      data
    }))
  } catch {
    // ignore storage errors
  }
}

function generateSmartAdvice(weather: WeatherData): string[] {
  const advice: string[] = []
  const temp = weather.temperature
  const condition = weather.weather

  // 温度建议
  if (temp >= 30) advice.push('🔥 天气炎热，建议穿轻便衣物并多喝水')
  else if (temp >= 25) advice.push('☀️ 温暖舒适，适合户外活动')
  else if (temp >= 15) advice.push('👕 气温适中，建议穿薄外套或长袖')
  else if (temp >= 5) advice.push('🧥 天气较冷，建议穿厚外套保暖')
  else advice.push('❄️ 寒冷天气，请注意保暖和防风')

  // 天气条件建议
  if (condition.includes('rain') || condition.includes('storm')) advice.push('☔ 记得带伞，注意防雨')
  if (condition.includes('snow')) advice.push('⛄ 下雪天气，请注意防滑保暖')
  if (condition.includes('fog')) advice.push('🌫️ 有雾，能见度较低，请小心')
  if (condition === 'clear' || condition === 'sunny') advice.push('🕶️ 阳光充足，可考虑戴墨镜')

  // 风力
  if (weather.windSpeed >= 30) advice.push('💨 风力较大，请避免高空作业')

  // UV
  if (weather.uvIndex >= 8) advice.push('🌞 紫外线强，外出请做好防晒')
  else if (weather.uvIndex >= 6) advice.push('🌞 紫外线中等，注意防晒')

  // 空气质量
  if (weather.airQuality) {
    if (weather.airQuality.aqi >= 150) advice.push('🏭 空气质量较差，敏感人群减少户外活动')
    else if (weather.airQuality.aqi >= 100) advice.push('🏭 空气质量一般，可考虑佩戴口罩')
  }

  return advice.slice(0, 4)
}

interface SearchResult {
  name: string
  country: string
  admin1?: string
  lat: number
  lon: number
}

const Weather = memo(function Weather() {
  const [selectedCity, setSelectedCity] = useState(popularCities[0])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showCityList, setShowCityList] = useState(false)
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [useGeoLocation, setUseGeoLocation] = useState(false)
  const [geoStatus, setGeoStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [favoriteCities, setFavoriteCities] = useState<SearchResult[]>(() => {
    try {
      const raw = localStorage.getItem('weblinux-weather-favorites')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const fetchWeather = useCallback(async (city: { name: string; country: string; lat: number; lon: number }) => {
    setLoading(true)
    setErrorMsg(null)

    // 先尝试使用缓存
    const cacheKey = `${city.lat.toFixed(2)}-${city.lon.toFixed(2)}`
    const cached = getCachedWeather(cacheKey)
    if (cached) {
      setWeather(cached)
      setLoading(false)
      setLastUpdated(new Date())
    }

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`
      const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`

      const [weatherResponse, airQualityResponse] = await Promise.allSettled([
        fetch(weatherUrl, { cache: 'force-cache', headers: { 'Accept': 'application/json' } }),
        fetch(airQualityUrl, { cache: 'force-cache', headers: { 'Accept': 'application/json' } }),
      ])

      if (weatherResponse.status === 'rejected') {
        throw new Error('无法连接到天气服务')
      }
      if (!weatherResponse.value.ok) {
        throw new Error(`天气服务返回 HTTP ${weatherResponse.value.status}`)
      }

      const data = await weatherResponse.value.json()

      const weatherCodeMap: Record<number, string> = {
        0: 'clear', 1: 'sunny', 2: 'partly-cloudy', 3: 'cloudy',
        45: 'fog', 48: 'fog',
        51: 'light-rain', 53: 'light-rain', 55: 'light-rain',
        56: 'light-rain', 57: 'light-rain',
        61: 'rain', 63: 'rain', 65: 'rain', 66: 'rain', 67: 'rain',
        71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
        80: 'rain', 81: 'rain', 82: 'heavy-rain',
        85: 'snow', 86: 'snow',
        95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
      }
      const getConditionFromCode = (code: number): string => weatherCodeMap[code] || 'cloudy'

      const getDayName = (dateStr: string, index: number): string => {
        if (index === 0) return '今天'
        if (index === 1) return '明天'
        const day = new Date(dateStr).getDay()
        return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day]
      }

      const aqiCategory = (aqi: number): string => {
        if (aqi <= 50) return '优'
        if (aqi <= 100) return '良'
        if (aqi <= 150) return '轻度污染'
        if (aqi <= 200) return '中度污染'
        if (aqi <= 300) return '重度污染'
        return '严重污染'
      }

      let airQualityData: AirQuality = {
        aqi: 50, category: '优', pm25: 18, pm10: 30, o3: 45, no2: 15,
      }
      if (airQualityResponse.status === 'fulfilled' && airQualityResponse.value.ok) {
        try {
          const aq = await airQualityResponse.value.json()
          const aqiVal = Math.round(aq.current?.european_aqi || 50)
          airQualityData = {
            aqi: aqiVal,
            category: aqiCategory(aqiVal),
            pm25: Math.round(aq.current?.pm2_5 || 20),
            pm10: Math.round(aq.current?.pm10 || 30),
            o3: Math.round(aq.current?.ozone || 40),
            no2: Math.round(aq.current?.nitrogen_dioxide || 20),
          }
        } catch {
          // use fallback
        }
      }

      const sunrise = new Date(data.daily.sunrise[0])
      const sunset = new Date(data.daily.sunset[0])
      const diffMs = sunset.getTime() - sunrise.getTime()
      const dayHours = Math.floor(diffMs / (1000 * 60 * 60))
      const dayMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        weather: getConditionFromCode(data.current.weather_code),
        windSpeed: Math.round(data.current.wind_speed_10m),
        uvIndex: (data.daily.uv_index_max?.[0] ?? 0),
        feelsLike: Math.round(data.current.apparent_temperature),
        pressure: Math.round(data.current.surface_pressure ?? 1013),
        visibility: 10,
        forecast: data.daily.time.slice(0, 7).map((date: string, i: number) => ({
          day: getDayName(date, i),
          date: date,
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          condition: getConditionFromCode(data.daily.weather_code[i]),
          icon: weatherConditions[getConditionFromCode(data.daily.weather_code[i])]?.icon || '🌤️',
          precipitation: data.daily.precipitation_probability_max?.[i] || 0,
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
        sunInfo: {
          sunrise: sunrise.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          sunset: sunset.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          dayLength: `${dayHours}小时${dayMinutes}分钟`,
        },
        airQuality: airQualityData,
      }

      setWeather(weatherData)
      setCachedWeather(cacheKey, weatherData)
      setLastUpdated(new Date())
      setErrorMsg(null)
    } catch (err) {
      console.error('Weather fetch error:', err)
      const message = err instanceof Error ? err.message : '未知错误'
      setErrorMsg(`天气服务暂时不可用（${message}），已显示缓存或模拟数据`)
      // 使用 ref 检查当前是否有天气数据，避免闭包陷阱
      setWeather((current) => current || FALLBACK_WEATHER)
      if (!lastUpdated) setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [lastUpdated])

  useEffect(() => {
    fetchWeather(selectedCity)
    const interval = setInterval(() => fetchWeather(selectedCity), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedCity, fetchWeather])

  const searchCity = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=zh&format=json`
      const response = await fetch(url, { cache: 'force-cache' })
      if (!response.ok) throw new Error('搜索失败')
      const data = await response.json()
      const results: SearchResult[] = (data.results || []).map((r: any) => ({
        name: r.name,
        country: r.country || '',
        admin1: r.admin1,
        lat: r.latitude,
        lon: r.longitude,
      }))
      setSearchResults(results)
    } catch (err) {
      console.error('City search error:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchCity(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchCity])

  const toggleFavorite = (city: SearchResult) => {
    const key = `${city.lat.toFixed(2)}-${city.lon.toFixed(2)}`
    const exists = favoriteCities.find(c => `${c.lat.toFixed(2)}-${c.lon.toFixed(2)}` === key)
    let next: SearchResult[]
    if (exists) {
      next = favoriteCities.filter(c => `${c.lat.toFixed(2)}-${c.lon.toFixed(2)}` !== key)
    } else {
      next = [...favoriteCities, city]
    }
    setFavoriteCities(next)
    try {
      localStorage.setItem('weblinux-weather-favorites', JSON.stringify(next))
    } catch { /* ignore */ }
  }

  const isFavorite = (city: SearchResult) => {
    const key = `${city.lat.toFixed(2)}-${city.lon.toFixed(2)}`
    return favoriteCities.some(c => `${c.lat.toFixed(2)}-${c.lon.toFixed(2)}` === key)
  }

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

  const handleGeoLocation = () => {
    setGeoStatus('正在获取位置...')
    setUseGeoLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCity = {
            name: '当前位置',
            country: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`,
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
          setSelectedCity(newCity)
          setGeoStatus('位置获取成功')
          setTimeout(() => setGeoStatus(''), 2000)
        },
        (error) => {
          setGeoStatus('无法获取位置: ' + error.message)
          setTimeout(() => setGeoStatus(''), 3000)
        },
        { timeout: 10000 }
      )
    } else {
      setGeoStatus('浏览器不支持地理定位')
      setTimeout(() => setGeoStatus(''), 3000)
    }
  }

  const smartAdvice = weather ? generateSmartAdvice(weather) : []

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
        {geoStatus && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '8px 16px',
            marginBottom: 16,
            color: '#fff',
            fontSize: 13,
            textAlign: 'center'
          }}>
            {geoStatus}
          </div>
        )}
        {errorMsg && (
          <div style={{
            background: 'rgba(255,152,0,0.3)',
            borderRadius: 8,
            padding: '8px 16px',
            marginBottom: 16,
            color: '#fff',
            fontSize: 13,
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
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
                title="选择城市"
              >
                📍 {selectedCity.name}
              </button>
              <button
                onClick={handleGeoLocation}
                style={{
                  background: useGeoLocation ? 'rgba(76,175,80,0.5)' : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'background 0.2s'
                }}
                title="使用我的位置"
              >
                🎯 定位
              </button>
              <button
                onClick={() => fetchWeather(selectedCity)}
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: loading ? 'wait' : 'pointer',
                  fontSize: 16,
                  opacity: loading ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
                title="刷新"
              >
                🔄 刷新
              </button>
              {showCityList && (
                <div style={{
                  position: 'absolute',
                  top: 70,
                  left: 24,
                  right: 24,
                  background: 'rgba(30, 60, 114, 0.98)',
                  borderRadius: 16,
                  padding: 12,
                  maxHeight: 420,
                  overflow: 'auto',
                  zIndex: 1000,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="🔍 搜索全球城市（如 Tokyo / 巴黎 / Shanghai）"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.2)',
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {searching && (
                    <div style={{ color: '#fff', fontSize: 13, padding: '8px 12px', opacity: 0.7 }}>
                      正在搜索...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 8px 8px 8px', fontWeight: 600 }}>
                        🔎 搜索结果
                      </div>
                      {searchResults.map((city, i) => (
                        <div
                          key={`s-${i}-${city.name}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setSelectedCity({ name: city.name, country: city.admin1 ? `${city.admin1}, ${city.country}` : city.country, lat: city.lat, lon: city.lon })
                            setShowCityList(false)
                            setSearchQuery('')
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{city.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                              {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(city)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 16,
                              padding: '4px 8px',
                              color: isFavorite(city) ? '#ffeb3b' : 'rgba(255,255,255,0.4)'
                            }}
                          >
                            {isFavorite(city) ? '★' : '☆'}
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {favoriteCities.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '12px 8px 8px 8px', fontWeight: 600 }}>
                        ⭐ 我的收藏
                      </div>
                      {favoriteCities.map((city, i) => (
                        <div
                          key={`f-${i}-${city.name}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setSelectedCity({ name: city.name, country: city.admin1 ? `${city.admin1}, ${city.country}` : city.country, lat: city.lat, lon: city.lon })
                            setShowCityList(false)
                            setSearchQuery('')
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{city.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                              {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(city)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 16,
                              padding: '4px 8px',
                              color: '#ffeb3b'
                            }}
                          >
                            ★
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '12px 8px 8px 8px', fontWeight: 600 }}>
                    🌍 热门城市
                  </div>
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
                        background: 'transparent',
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
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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

            {weather.sunInfo && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 24
              }}>
                {[
                  { icon: '🌅', label: '日出', value: weather.sunInfo.sunrise },
                  { icon: '🌇', label: '日落', value: weather.sunInfo.sunset },
                  { icon: '⏱️', label: '日照时长', value: weather.sunInfo.dayLength },
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
            )}

            {weather.airQuality && (
              <div style={{
                marginBottom: 24,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 20,
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
                  🏙️ 空气质量
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16
                }}>
                  <div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>{weather.airQuality.aqi}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{weather.airQuality.category}</div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 12,
                    flex: 1,
                    marginLeft: 24
                  }}>
                    {[
                      { label: 'PM2.5', value: weather.airQuality.pm25 },
                      { label: 'PM10', value: weather.airQuality.pm10 },
                      { label: 'O3', value: weather.airQuality.o3 },
                      { label: 'NO2', value: weather.airQuality.no2 },
                    ].map((item) => (
                      <div key={item.label} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{item.value} μg/m³</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

            {smartAdvice.length > 0 && (
              <div style={{
                marginTop: 24,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
                  💡 智能建议
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {smartAdvice.map((advice, idx) => (
                    <div key={idx} style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      padding: '6px 0'
                    }}>
                      {advice}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
