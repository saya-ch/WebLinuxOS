// @ts-nocheck
import { useState, useEffect, useCallback, memo } from 'react'
import {
  GlobeIcon, ClockIcon, MapPinIcon, RefreshCwIcon,
  SunIcon, MoonIcon, ThermometerIcon, WindIcon,
  CloudRainIcon, EyeIcon, StarIcon, SearchIcon,
  CalendarIcon, PlaneIcon, LanguagesIcon, BitcoinIcon,
} from '../icons'

/* =================== 全球旅行助手应用 =================== */

const CITIES = [
  { id: 'beijing', name: '北京', country: '中国', timezone: 'Asia/Shanghai', lat: 39.9042, lon: 116.4074 },
  { id: 'shanghai', name: '上海', country: '中国', timezone: 'Asia/Shanghai', lat: 31.2304, lon: 121.4737 },
  { id: 'guangzhou', name: '广州', country: '中国', timezone: 'Asia/Shanghai', lat: 23.1291, lon: 113.2644 },
  { id: 'chengdu', name: '成都', country: '中国', timezone: 'Asia/Shanghai', lat: 30.5728, lon: 104.0668 },
  { id: 'hongkong', name: '香港', country: '中国', timezone: 'Asia/Hong_Kong', lat: 22.3193, lon: 114.1694 },
  { id: 'tokyo', name: '东京', country: '日本', timezone: 'Asia/Tokyo', lat: 35.6762, lon: 139.6503 },
  { id: 'seoul', name: '首尔', country: '韩国', timezone: 'Asia/Seoul', lat: 37.5665, lon: 126.978 },
  { id: 'singapore', name: '新加坡', country: '新加坡', timezone: 'Asia/Singapore', lat: 1.3521, lon: 103.8198 },
  { id: 'bangkok', name: '曼谷', country: '泰国', timezone: 'Asia/Bangkok', lat: 13.7563, lon: 100.5018 },
  { id: 'newyork', name: '纽约', country: '美国', timezone: 'America/New_York', lat: 40.7128, lon: -74.006 },
  { id: 'london', name: '伦敦', country: '英国', timezone: 'Europe/London', lat: 51.5074, lon: -0.1278 },
  { id: 'paris', name: '巴黎', country: '法国', timezone: 'Europe/Paris', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: '柏林', country: '德国', timezone: 'Europe/Berlin', lat: 52.52, lon: 13.405 },
  { id: 'sydney', name: '悉尼', country: '澳大利亚', timezone: 'Australia/Sydney', lat: -33.8688, lon: 151.2093 },
  { id: 'dubai', name: '迪拜', country: '阿联酋', timezone: 'Asia/Dubai', lat: 25.2048, lon: 55.2708 },
  { id: 'toronto', name: '多伦多', country: '加拿大', timezone: 'America/Toronto', lat: 43.6532, lon: -79.3832 },
]

const CURRENCY_PAIRS = [
  { from: 'CNY', to: 'USD', label: '人民币 → 美元' },
  { from: 'CNY', to: 'EUR', label: '人民币 → 欧元' },
  { from: 'CNY', to: 'JPY', label: '人民币 → 日元' },
  { from: 'CNY', to: 'GBP', label: '人民币 → 英镑' },
  { from: 'USD', to: 'CNY', label: '美元 → 人民币' },
  { from: 'EUR', to: 'CNY', label: '欧元 → 人民币' },
  { from: 'JPY', to: 'CNY', label: '日元 → 人民币' },
  { from: 'KRW', to: 'CNY', label: '韩元 → 人民币' },
]

const TIMEZONE_OFFSETS: Record<string, string> = {
  'Asia/Shanghai': 'UTC+8', 'Asia/Hong_Kong': 'UTC+8', 'Asia/Tokyo': 'UTC+9',
  'Asia/Seoul': 'UTC+9', 'Asia/Singapore': 'UTC+8', 'Asia/Bangkok': 'UTC+7',
  'Asia/Dubai': 'UTC+4', 'America/New_York': 'UTC-5', 'America/Toronto': 'UTC-5',
  'Europe/London': 'UTC+0', 'Europe/Paris': 'UTC+1', 'Europe/Berlin': 'UTC+1',
  'Australia/Sydney': 'UTC+10',
}

interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  isDay: boolean
}

interface CurrencyRate {
  rate: number
  updated: string
}

/* =================== 天气代码映射 =================== */
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: '晴朗', icon: '☀️' },
  1: { label: '主要晴朗', icon: '🌤️' },
  2: { label: '多云', icon: '⛅' },
  3: { label: '阴天', icon: '☁️' },
  45: { label: '雾', icon: '🌫️' },
  48: { label: '雾凇', icon: '🌫️' },
  51: { label: '小毛毛雨', icon: '🌦️' },
  53: { label: '毛毛雨', icon: '🌦️' },
  55: { label: '大毛毛雨', icon: '🌧️' },
  61: { label: '小雨', icon: '🌧️' },
  63: { label: '中雨', icon: '🌧️' },
  65: { label: '大雨', icon: '🌧️' },
  71: { label: '小雪', icon: '🌨️' },
  73: { label: '中雪', icon: '🌨️' },
  75: { label: '大雪', icon: '🌨️' },
  80: { label: '阵雨', icon: '🌦️' },
  81: { label: '阵雨', icon: '🌧️' },
  82: { label: '暴雨', icon: '⛈️' },
  95: { label: '雷暴', icon: '⛈️' },
  96: { label: '雷暴伴冰雹', icon: '⛈️' },
}

const getWeatherInfo = (code: number) => WEATHER_CODES[code] || { label: '未知', icon: '❓' }

/* =================== 主应用组件 =================== */
const GlobalTravelAssistant = memo(function GlobalTravelAssistant() {
  const [activeTab, setActiveTab] = useState<'clock' | 'weather' | 'currency' | 'converter'>('clock')
  const [now, setNow] = useState(new Date())
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({})
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [currencyPair, setCurrencyPair] = useState(CURRENCY_PAIRS[0])
  const [currencyAmount, setCurrencyAmount] = useState('100')
  const [currencyRate, setCurrencyRate] = useState<CurrencyRate | null>(null)
  const [converterFrom, setConverterFrom] = useState('北京')
  const [converterTo, setConverterTo] = useState('纽约')
  const [converterDate, setConverterDate] = useState(new Date().toISOString().split('T')[0])
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('travel-favorites')
    return saved ? JSON.parse(saved) : ['beijing', 'tokyo', 'newyork']
  })
  const [searchQuery, setSearchQuery] = useState('')

  /* ========== 实时时钟更新 ========== */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  /* ========== 保存收藏 ========== */
  useEffect(() => {
    localStorage.setItem('travel-favorites', JSON.stringify(favorites))
  }, [favorites])

  /* ========== 获取天气数据 ========== */
  const fetchWeather = useCallback(async (city: typeof CITIES[0]) => {
    if (weatherData[city.id]) return
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
        `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,is_day`
      )
      if (!response.ok) throw new Error('Weather API failed')
      const data = await response.json()
      if (data.current) {
        setWeatherData(prev => ({
          ...prev,
          [city.id]: {
            temperature: data.current.temperature_2m,
            weatherCode: data.current.weather_code,
            windSpeed: data.current.wind_speed_10m,
            humidity: data.current.relative_humidity_2m,
            isDay: data.current.is_day,
          }
        }))
      }
    } catch (err) {
      console.error('Failed to fetch weather for', city.name)
    }
  }, [weatherData])

  /* ========== 初始化天气数据 ========== */
  useEffect(() => {
    const favoriteCities = CITIES.filter(c => favorites.includes(c.id))
    favoriteCities.forEach(city => fetchWeather(city))
  }, [favorites, fetchWeather])

  /* ========== 获取汇率数据 ========== */
  const fetchCurrencyRate = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${currencyPair.from}`
      )
      if (!response.ok) throw new Error('Currency API failed')
      const data = await response.json()
      if (data.result === 'success') {
        const rate = data.rates[currencyPair.to]
        if (rate) {
          setCurrencyRate({
            rate,
            updated: new Date(data.time_last_update_utc).toLocaleString('zh-CN'),
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch currency rate')
      // Fallback rates
      const fallbackRates: Record<string, number> = {
        'CNY_USD': 0.1389, 'CNY_EUR': 0.1285, 'CNY_JPY': 21.50, 'CNY_GBP': 0.1095,
        'USD_CNY': 7.1850, 'EUR_CNY': 7.7820, 'JPY_CNY': 0.0465, 'KRW_CNY': 0.0053,
      }
      const key = `${currencyPair.from}_${currencyPair.to}`
      const rate = fallbackRates[key] || 1
      setCurrencyRate({ rate, updated: '使用备用汇率' })
    } finally {
      setLoading(false)
    }
  }, [currencyPair])

  useEffect(() => {
    fetchCurrencyRate()
  }, [fetchCurrencyRate])

  /* ========== 工具函数 ========== */
  const getTimeInTimezone = (timezone: string) => {
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
    } catch {
      return '--:--:--'
    }
  }

  const getDateInTimezone = (timezone: string) => {
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      }).format(now)
    } catch {
      return '----/--/--'
    }
  }

  const getDayPeriodInTimezone = (timezone: string) => {
    try {
      const hour = new Date(parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      }).format(now))).getHours()
      return hour >= 6 && hour < 18 ? '白天' : '夜晚'
    } catch {
      return ''
    }
  }

  const toggleFavorite = (cityId: string) => {
    setFavorites(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    )
  }

  const filteredCities = CITIES.filter(city =>
    city.name.includes(searchQuery) ||
    city.country.includes(searchQuery)
  )

  const favoriteCities = CITIES.filter(c => favorites.includes(c.id))

  const convertedAmount = currencyRate
    ? (parseFloat(currencyAmount) * currencyRate.rate).toFixed(4)
    : '--'

  /* ========== 样式 ========== */
  const styles = {
    container: {
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff', padding: '16px', gap: '12px', overflow: 'hidden',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
      borderRadius: '12px', backdropFilter: 'blur(10px)',
    },
    title: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600 },
    tabs: { display: 'flex', gap: '8px', padding: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' },
    tab: (active: boolean) => ({
      flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '6px', fontSize: '14px', fontWeight: 500,
      background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s',
    }),
    content: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
    cityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
    cityCard: {
      background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px',
      backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s', cursor: 'pointer',
    },
    cityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    cityName: { fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' },
    cityCountry: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
    cityTime: { fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '1px' },
    cityDate: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' },
    weatherSection: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' },
    weatherTemp: { fontSize: '24px', fontWeight: 600 },
    weatherInfo: { fontSize: '12px', color: 'rgba(255,255,255,0.7)' },
    starButton: { background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '4px' },
    panel: { background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(10px)' },
    panelTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    input: {
      width: '100%', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px',
      outline: 'none', transition: 'border-color 0.2s',
    },
    select: {
      width: '100%', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px',
      cursor: 'pointer', outline: 'none',
    },
    button: (primary: boolean) => ({
      padding: '12px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer',
      fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', transition: 'all 0.2s',
      background: primary ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
      color: '#fff',
    }),
    resultDisplay: {
      padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px',
      textAlign: 'center', fontSize: '24px', fontWeight: 700, margin: '16px 0',
    },
    label: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' },
    row: { display: 'flex', gap: '12px', alignItems: 'flex-end' },
    column: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
    searchBox: { position: 'relative', marginBottom: '16px' },
    searchInput: {
      width: '100%', padding: '12px 16px 12px 44px', border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px',
      outline: 'none',
    },
    searchIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' },
    converterDisplay: {
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center',
      padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', marginBottom: '16px',
    },
    converterArrow: { fontSize: '24px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
    timeBlock: { textAlign: 'center' },
    timeCity: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' },
    timeValue: { fontSize: '32px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
    timeDate: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' },
    infoBadge: {
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
      borderRadius: '20px', background: 'rgba(255,255,255,0.1)', fontSize: '12px',
    },
    emptyState: { textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' },
    footer: {
      padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
    },
  }

  /* ========== 渲染时钟标签页 ========== */
  const renderClockTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={styles.searchBox}>
        <SearchIcon style={styles.searchIcon as any} size={18} />
        <input
          style={styles.searchInput}
          placeholder="搜索城市或国家..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {favorites.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StarIcon size={16} /> 收藏城市
          </div>
          <div style={styles.cityGrid}>
            {favoriteCities.map(city => {
              const weather = weatherData[city.id]
              const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null
              const isDay = getDayPeriodInTimezone(city.timezone) === '白天'
              return (
                <div key={city.id} style={styles.cityCard} onClick={() => setSelectedCity(city)}>
                  <div style={styles.cityHeader}>
                    <div>
                      <div style={styles.cityName}>
                        {isDay ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                        {city.name}
                      </div>
                      <div style={styles.cityCountry}>{city.country}</div>
                    </div>
                    <button
                      style={styles.starButton}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(city.id) }}
                      title="取消收藏"
                    >
                      <StarIcon size={18} />
                    </button>
                  </div>
                  <div style={styles.cityTime}>{getTimeInTimezone(city.timezone)}</div>
                  <div style={styles.cityDate}>{getDateInTimezone(city.timezone)}</div>
                  <div style={styles.weatherSection}>
                    {weather && (
                      <>
                        <span style={{ fontSize: '28px' }}>{weatherInfo?.icon}</span>
                        <div>
                          <div style={styles.weatherTemp}>{weather.temperature}°C</div>
                          <div style={styles.weatherInfo}>{weatherInfo?.label} · {TIMEZONE_OFFSETS[city.timezone]}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GlobeIcon size={16} /> 全部城市 ({filteredCities.length})
        </div>
        <div style={styles.cityGrid}>
          {filteredCities.map(city => {
            const isFav = favorites.includes(city.id)
            const weather = weatherData[city.id]
            const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null
            return (
              <div key={city.id} style={styles.cityCard}>
                <div style={styles.cityHeader}>
                  <div>
                    <div style={styles.cityName}>
                      <MapPinIcon size={14} /> {city.name}
                    </div>
                    <div style={styles.cityCountry}>{city.country} · {TIMEZONE_OFFSETS[city.timezone]}</div>
                  </div>
                  <button
                    style={{ ...styles.starButton, color: isFav ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}
                    onClick={() => toggleFavorite(city.id)}
                    title={isFav ? '取消收藏' : '添加收藏'}
                  >
                    <StarIcon size={18} />
                  </button>
                </div>
                <div style={styles.cityTime}>{getTimeInTimezone(city.timezone)}</div>
                <div style={styles.cityDate}>{getDateInTimezone(city.timezone)}</div>
                {weather && (
                  <div style={styles.weatherSection}>
                    <span style={{ fontSize: '24px' }}>{weatherInfo?.icon}</span>
                    <div style={{ fontSize: '14px' }}>
                      {weather.temperature}°C · {weatherInfo?.label}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ========== 渲染天气标签页 ========== */
  const renderWeatherTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={styles.panel}>
        <div style={styles.panelTitle}>
          <CloudRainIcon size={20} /> 天气详情
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <select style={styles.select} value={selectedCity.id} onChange={(e) => {
            const city = CITIES.find(c => c.id === e.target.value)
            if (city) {
              setSelectedCity(city)
              fetchWeather(city)
            }
          }}>
            {CITIES.map(c => <option key={c.id} value={c.id} style={{ background: '#302b63' }}>{c.name}, {c.country}</option>)}
          </select>
          <button style={styles.button(true)} onClick={() => fetchWeather(selectedCity)}>
            <RefreshCwIcon size={16} /> 刷新
          </button>
        </div>
        
        {weatherData[selectedCity.id] ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ fontSize: '72px' }}>{getWeatherInfo(weatherData[selectedCity.id].weatherCode).icon}</div>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700 }}>{weatherData[selectedCity.id].temperature}°C</div>
                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>
                  {getWeatherInfo(weatherData[selectedCity.id].weatherCode).label}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                <WindIcon size={20} />
                <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>{weatherData[selectedCity.id].windSpeed} km/h</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>风速</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                <EyeIcon size={20} />
                <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>{weatherData[selectedCity.id].humidity}%</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>湿度</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                {weatherData[selectedCity.id].isDay ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>{getTimeInTimezone(selectedCity.timezone)}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>当地时间</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <RefreshCwIcon size={32} style={{ margin: '0 auto 12px' }} />
            <div>正在加载天气数据...</div>
          </div>
        )}
      </div>
    </div>
  )

  /* ========== 渲染汇率标签页 ========== */
  const renderCurrencyTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={styles.panel}>
        <div style={styles.panelTitle}>
          <LanguagesIcon size={20} /> 实时汇率转换
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <select style={styles.select} value={`${currencyPair.from}_${currencyPair.to}`} onChange={(e) => {
            const pair = CURRENCY_PAIRS.find(p => `${p.from}_${p.to}` === e.target.value)
            if (pair) setCurrencyPair(pair)
          }}>
            {CURRENCY_PAIRS.map(p => <option key={`${p.from}_${p.to}`} value={`${p.from}_${p.to}`} style={{ background: '#302b63' }}>{p.label}</option>)}
          </select>
          
          <div style={styles.row}>
            <div style={styles.column}>
              <label style={styles.label}>{currencyPair.from} 金额</label>
              <input style={styles.input} type="number" value={currencyAmount} onChange={(e) => setCurrencyAmount(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px' }}>→</div>
            <div style={styles.column}>
              <label style={styles.label}>{currencyPair.to} 金额</label>
              <div style={{ ...styles.input, background: 'rgba(0,0,0,0.2)' }}>{convertedAmount}</div>
            </div>
          </div>
          
          {currencyRate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '14px' }}>1 {currencyPair.from} = {currencyRate.rate.toFixed(4)} {currencyPair.to}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>更新时间: {currencyRate.updated}</div>
              </div>
              <button style={styles.button(false)} onClick={fetchCurrencyRate} disabled={loading}>
                <RefreshCwIcon size={16} /> {loading ? '更新中...' : '刷新'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>
          <BitcoinIcon size={20} /> 流行货币对
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {['USD', 'EUR', 'JPY', 'GBP', 'KRW', 'HKD', 'AUD', 'CAD'].map(cur => (
            <div key={cur} style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center', fontSize: '14px' }}>
              {cur}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  /* ========== 渲染时区转换标签页 ========== */
  const renderConverterTab = () => {
    const fromCity = CITIES.find(c => c.name === converterFrom) || CITIES[0]
    const toCity = CITIES.find(c => c.name === converterTo) || CITIES[10]
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            <CalendarIcon size={20} /> 时区转换器
          </div>
          
          <div style={styles.converterDisplay}>
            <div style={styles.timeBlock}>
              <div style={styles.timeCity}>{fromCity.name}</div>
              <div style={styles.timeValue}>{getTimeInTimezone(fromCity.timezone)}</div>
              <div style={styles.timeDate}>{getDateInTimezone(fromCity.timezone)}</div>
              <div style={styles.infoBadge}>{TIMEZONE_OFFSETS[fromCity.timezone]}</div>
            </div>
            <div style={styles.converterArrow}>
              <PlaneIcon size={32} />
            </div>
            <div style={styles.timeBlock}>
              <div style={styles.timeCity}>{toCity.name}</div>
              <div style={styles.timeValue}>{getTimeInTimezone(toCity.timezone)}</div>
              <div style={styles.timeDate}>{getDateInTimezone(toCity.timezone)}</div>
              <div style={styles.infoBadge}>{TIMEZONE_OFFSETS[toCity.timezone]}</div>
            </div>
          </div>
          
          <div style={styles.row}>
            <div style={styles.column}>
              <label style={styles.label}>出发城市</label>
              <select style={styles.select} value={converterFrom} onChange={(e) => setConverterFrom(e.target.value)}>
                {CITIES.map(c => <option key={c.id} value={c.name} style={{ background: '#302b63' }}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.column}>
              <label style={styles.label}>目标城市</label>
              <select style={styles.select} value={converterTo} onChange={(e) => setConverterTo(e.target.value)}>
                {CITIES.map(c => <option key={c.id} value={c.name} style={{ background: '#302b63' }}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            <ClockIcon size={20} /> 全球时间对照
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {CITIES.slice(0, 8).map(city => (
              <div key={city.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{city.name}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{getTimeInTimezone(city.timezone)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ========== 主渲染 ========== */
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <GlobeIcon size={24} />
          <span>全球旅行助手</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={styles.infoBadge}>
            <ClockIcon size={14} /> {now.toLocaleTimeString('zh-CN')}
          </span>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'clock')} onClick={() => setActiveTab('clock')}>
          <ClockIcon size={16} /> 世界时钟
        </button>
        <button style={styles.tab(activeTab === 'weather')} onClick={() => setActiveTab('weather')}>
          <CloudRainIcon size={16} /> 天气查询
        </button>
        <button style={styles.tab(activeTab === 'currency')} onClick={() => setActiveTab('currency')}>
          <LanguagesIcon size={16} /> 汇率转换
        </button>
        <button style={styles.tab(activeTab === 'converter')} onClick={() => setActiveTab('converter')}>
          <PlaneIcon size={16} /> 时区转换
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'clock' && renderClockTab()}
        {activeTab === 'weather' && renderWeatherTab()}
        {activeTab === 'currency' && renderCurrencyTab()}
        {activeTab === 'converter' && renderConverterTab()}
      </div>

      <div style={styles.footer}>
        <span>数据来源: Open-Meteo / ExchangeRate-API</span>
        <span>全球 {CITIES.length} 个城市</span>
      </div>
    </div>
  )
})

export default GlobalTravelAssistant
