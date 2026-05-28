import { useState, useCallback, useEffect, useMemo } from 'react'

type ToolTab = 'weather' | 'currency' | 'crypto' | 'news' | 'ip' | 'joke' | 'dog' | 'cat'

interface WeatherData {
  current: { temperature: number; humidity: number; weathercode: number; windspeed: number }
  hourly: { time: string[]; temperature: number[]; weathercode: number[] }
  daily: { time: string[]; weathercode: number[]; temperatureMax: number[]; temperatureMin: number[] }
}

interface CryptoData {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
}

interface IPLocation {
  ip: string
  city: string
  region: string
  country: string
  timezone: string
  org: string
}

const weatherIcons: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌧️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '❄️', 80: '🌦️', 81: '🌦️',
  82: '🌦️', 85: '🌨️', 86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
}

const weatherDescriptions: Record<number, string> = {
  0: '晴朗', 1: '基本晴朗', 2: '多云', 3: '阴天', 45: '雾', 48: '雾凇',
  51: '小毛毛雨', 53: '中毛毛雨', 55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒', 80: '小阵雨', 81: '中阵雨',
  82: '大阵雨', 85: '小阵雪', 86: '大阵雪', 95: '雷暴', 96: '雷暴伴小冰雹', 99: '雷暴伴大冰雹'
}

const CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
  { code: 'INR', name: '印度卢比', symbol: '₹', flag: '🇮🇳' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$', flag: '🇲🇽' },
  { code: 'TWD', name: '新台币', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'ZAR', name: '南非兰特', symbol: 'R', flag: '🇿🇦' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$', flag: '🇧🇷' },
  { code: 'DKK', name: '丹麦克朗', symbol: 'kr', flag: '🇩🇰' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr', flag: '🇳🇴' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$', flag: '🇳🇿' },
]

const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
  { name: '武汉', lat: 30.5928, lon: 114.3055 },
  { name: '西安', lat: 34.3416, lon: 108.9398 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
]

const CRYPTO_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 'cardano', 'dogecoin', 'polkadot']

export default function OnlineToolkit() {
  const [activeTab, setActiveTab] = useState<ToolTab>('weather')
  const [loading, setLoading] = useState<Record<ToolTab, boolean>>({
    weather: false, currency: false, crypto: false, news: false, ip: false, joke: false, dog: false, cat: false
  })
  const [error, setError] = useState<Record<ToolTab, string | null>>({
    weather: null, currency: null, crypto: null, news: null, ip: null, joke: null, dog: null, cat: null
  })

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [selectedCity, setSelectedCity] = useState(CITIES[0])

  const [rates, setRates] = useState<Record<string, number>>({})
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [fromAmount, setFromAmount] = useState('100')

  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [news, setNews] = useState<NewsArticle[]>([])
  const [newsQuery, setNewsQuery] = useState('technology')

  const [ipData, setIpData] = useState<IPLocation | null>(null)

  const [joke, setJoke] = useState<{ setup: string; punchline: string } | null>(null)
  const [dogImage, setDogImage] = useState<string | null>(null)
  const [catImage, setCatImage] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    setLoading(prev => ({ ...prev, weather: true }))
    setError(prev => ({ ...prev, weather: null }))
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      )
      if (!response.ok) throw new Error('获取天气数据失败')
      const data = await response.json()
      setWeatherData({ current: data.current, hourly: data.hourly, daily: data.daily })
    } catch (err) {
      setError(prev => ({ ...prev, weather: err instanceof Error ? err.message : '未知错误' }))
    } finally {
      setLoading(prev => ({ ...prev, weather: false }))
    }
  }, [selectedCity])

  const fetchRates = useCallback(async () => {
    setLoading(prev => ({ ...prev, currency: true }))
    setError(prev => ({ ...prev, currency: null }))
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!response.ok) throw new Error('获取汇率失败')
      const data = await response.json()
      setRates(data.rates)
    } catch (err) {
      setError(prev => ({ ...prev, currency: err instanceof Error ? err.message : '未知错误' }))
    } finally {
      setLoading(prev => ({ ...prev, currency: false }))
    }
  }, [])

  const fetchCrypto = useCallback(async () => {
    setLoading(prev => ({ ...prev, crypto: true }))
    setError(prev => ({ ...prev, crypto: null }))
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + CRYPTO_IDS.join(','))
      if (!response.ok) throw new Error('获取加密货币数据失败')
      const data = await response.json()
      setCryptoData(data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume
      })))
      setLastUpdated(new Date())
    } catch (err) {
      setError(prev => ({ ...prev, crypto: err instanceof Error ? err.message : '未知错误' }))
    } finally {
      setLoading(prev => ({ ...prev, crypto: false }))
    }
  }, [])

  const fetchNews = useCallback(async () => {
    setLoading(prev => ({ ...prev, news: true }))
    setError(prev => ({ ...prev, news: null }))
    try {
      const mockNews: NewsArticle[] = [
        { title: 'AI技术突破：新模型效率提升300%', description: '最新研究显示新型人工智能架构在多个测试中表现出色', url: '#', source: 'Tech Daily', publishedAt: new Date().toISOString() },
        { title: 'WebAssembly 2.0 规范发布', description: '下一代Web技术标准带来显著的性能改进', url: '#', source: 'Web Dev', publishedAt: new Date().toISOString() },
        { title: '新能源革命：固态电池实现突破', description: '新型电池技术可使电动车续航增加两倍', url: '#', source: 'Energy News', publishedAt: new Date().toISOString() },
        { title: '量子计算取得重大进展', description: '科学家们实现了更稳定的量子比特', url: '#', source: 'Science Today', publishedAt: new Date().toISOString() },
        { title: '太空探索：火星样本返回计划启动', description: 'NASA宣布新的火星探索任务', url: '#', source: 'Space News', publishedAt: new Date().toISOString() },
      ]
      setNews(mockNews)
    } catch (err) {
      setError(prev => ({ ...prev, news: err instanceof Error ? err.message : '未知错误' }))
    } finally {
      setLoading(prev => ({ ...prev, news: false }))
    }
  }, [])

  const fetchIP = useCallback(async () => {
    setLoading(prev => ({ ...prev, ip: true }))
    setError(prev => ({ ...prev, ip: null }))
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) throw new Error('获取IP信息失败')
      const data = await response.json()
      setIpData({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        timezone: data.timezone,
        org: data.org
      })
    } catch (err) {
      setError(prev => ({ ...prev, ip: err instanceof Error ? err.message : '未知错误' }))
    } finally {
      setLoading(prev => ({ ...prev, ip: false }))
    }
  }, [])

  const fetchJoke = useCallback(async () => {
    setLoading(prev => ({ ...prev, joke: true }))
    setError(prev => ({ ...prev, joke: null }))
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke')
      if (!response.ok) throw new Error('获取笑话失败')
      const data = await response.json()
      setJoke({ setup: data.setup, punchline: data.punchline })
    } catch (err) {
      const fallbackJokes = [
        { setup: '为什么程序员喜欢深色主题？', punchline: '因为浅色会吸引bugs！' },
        { setup: '一个SQL查询走进酒吧，看到两张桌子，问道：我能JOIN你们吗？', punchline: '然后两张桌子都笑了。' },
        { setup: '编程中最难的两件事是什么？', punchline: '1. 命名变量 2. 缓存失效 3. 差一错误' },
        { setup: '为什么程序员不喜欢户外？', punchline: '因为有太多bugs，而且显示器不好用！' },
      ]
      setJoke(fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)])
    } finally {
      setLoading(prev => ({ ...prev, joke: false }))
    }
  }, [])

  const fetchDog = useCallback(async () => {
    setLoading(prev => ({ ...prev, dog: true }))
    setError(prev => ({ ...prev, dog: null }))
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random')
      if (!response.ok) throw new Error('获取狗狗图片失败')
      const data = await response.json()
      setDogImage(data.message)
    } catch (err) {
      setDogImage('https://images.dog.ceo/breeds/hound-afghan/n02088094_2064.jpg')
    } finally {
      setLoading(prev => ({ ...prev, dog: false }))
    }
  }, [])

  const fetchCat = useCallback(async () => {
    setLoading(prev => ({ ...prev, cat: true }))
    setError(prev => ({ ...prev, cat: null }))
    try {
      const response = await fetch('https://api.thecatapi.com/v1/images/search')
      if (!response.ok) throw new Error('获取猫咪图片失败')
      const data = await response.json()
      setCatImage(data[0].url)
    } catch (err) {
      setCatImage('https://cdn2.thecatapi.com/images/MTcwOTUwMw.jpg')
    } finally {
      setLoading(prev => ({ ...prev, cat: false }))
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'weather' && !weatherData) fetchWeather()
    if (activeTab === 'currency' && Object.keys(rates).length === 0) fetchRates()
    if (activeTab === 'crypto' && cryptoData.length === 0) fetchCrypto()
    if (activeTab === 'news' && news.length === 0) fetchNews()
    if (activeTab === 'ip' && !ipData) fetchIP()
    if (activeTab === 'joke' && !joke) fetchJoke()
    if (activeTab === 'dog' && !dogImage) fetchDog()
    if (activeTab === 'cat' && !catImage) fetchCat()
  }, [activeTab, weatherData, rates, cryptoData, news, ipData, joke, dogImage, catImage, fetchWeather, fetchRates, fetchCrypto, fetchNews, fetchIP, fetchJoke, fetchDog, fetchCat])

  const convertedAmount = useMemo(() => {
    if (!rates[fromCurrency] || !rates[toCurrency] || !fromAmount) return ''
    const amount = parseFloat(fromAmount)
    const usdAmount = amount / rates[fromCurrency]
    const result = usdAmount * rates[toCurrency]
    return result.toFixed(2)
  }, [fromAmount, fromCurrency, toCurrency, rates])

  const tabs: { id: ToolTab; label: string; icon: string }[] = [
    { id: 'weather', label: '天气', icon: '🌤️' },
    { id: 'currency', label: '汇率', icon: '💱' },
    { id: 'crypto', label: '加密货币', icon: '₿' },
    { id: 'news', label: '新闻', icon: '📰' },
    { id: 'ip', label: 'IP查询', icon: '🌐' },
    { id: 'joke', label: '笑话', icon: '😂' },
    { id: 'dog', label: '狗狗', icon: '🐕' },
    { id: 'cat', label: '猫咪', icon: '🐱' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'weather':
        return (
          <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#e8e8f4', margin: 0, fontSize: '20px' }}>🌤️ 天气预报</h3>
              <button
                onClick={fetchWeather}
                disabled={loading.weather}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading.weather ? 0.5 : 1,
                }}
              >
                🔄 刷新
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {CITIES.map(city => (
                <button
                  key={city.name}
                  onClick={() => { setSelectedCity(city); fetchWeather() }}
                  style={{
                    padding: '8px 16px',
                    background: selectedCity.name === city.name ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedCity.name === city.name ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    color: selectedCity.name === city.name ? '#e8e8f4' : '#a0a0c8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>
            {loading.weather ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '48px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : error.weather ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#f87171' }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <div>{error.weather}</div>
              </div>
            ) : weatherData ? (
              <>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '24px', color: '#e8e8f4', fontWeight: '600' }}>{selectedCity.name}</div>
                      <div style={{ fontSize: '56px', fontWeight: '700', background: 'linear-gradient(135deg, #e8e8f4, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {Math.round(weatherData.current.temperature)}°
                      </div>
                      <div style={{ fontSize: '18px', color: '#a0a0c8' }}>
                        {weatherDescriptions[weatherData.current.weathercode] || '未知'}
                      </div>
                    </div>
                    <div style={{ fontSize: '80px' }}>
                      {weatherIcons[weatherData.current.weathercode] || '🌤️'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>💧</div>
                      <div style={{ color: '#e8e8f4', fontWeight: '600' }}>{weatherData.current.humidity}%</div>
                      <div style={{ color: '#a0a0c8', fontSize: '12px' }}>湿度</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>💨</div>
                      <div style={{ color: '#e8e8f4', fontWeight: '600' }}>{Math.round(weatherData.current.windspeed)} km/h</div>
                      <div style={{ color: '#a0a0c8', fontSize: '12px' }}>风速</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌡️</div>
                      <div style={{ color: '#e8e8f4', fontWeight: '600' }}>
                        {weatherData.daily.temperatureMin[0]}° / {weatherData.daily.temperatureMax[0]}°
                      </div>
                      <div style={{ color: '#a0a0c8', fontSize: '12px' }}>高低温</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ color: '#e8e8f4', margin: '0 0 16px 0' }}>未来7天</h4>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {weatherData.daily.time.map((date, i) => {
                      const dayName = i === 0 ? '今天' : i === 1 ? '明天' : new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })
                      return (
                        <div key={date} style={{
                          minWidth: '100px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center'
                        }}>
                          <div style={{ color: '#e8e8f4', fontWeight: '600', marginBottom: '8px' }}>{dayName}</div>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{weatherIcons[weatherData.daily.weathercode[i]] || '🌤️'}</div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ color: '#e8e8f4', fontWeight: '600' }}>{Math.round(weatherData.daily.temperatureMax[i])}°</span>
                            <span style={{ color: '#a0a0c8' }}>{Math.round(weatherData.daily.temperatureMin[i])}°</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )

      case 'currency':
        return (
          <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#e8e8f4', margin: 0, fontSize: '20px' }}>💱 汇率转换</h3>
              <button
                onClick={fetchRates}
                disabled={loading.currency}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading.currency ? 0.5 : 1,
                }}
              >
                🔄 刷新
              </button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#a0a0c8', fontSize: '12px', display: 'block', marginBottom: '8px' }}>从</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</option>)}
                  </select>
                  <input
                    type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="0.00"
                    style={{ width: '150px', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', textAlign: 'right', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <button
                  onClick={() => { const t = fromCurrency; setFromCurrency(toCurrency); setToCurrency(t); setFromAmount(convertedAmount) }}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                >
                  ↺
                </button>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#a0a0c8', fontSize: '12px', display: 'block', marginBottom: '8px' }}>到</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</option>)}
                  </select>
                  <div style={{ width: '150px', padding: '14px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.5)', background: 'rgba(139,92,246,0.1)', color: '#fff', textAlign: 'right', fontWeight: '600' }}>
                    {convertedAmount || '0.00'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
              <h4 style={{ color: '#e8e8f4', margin: '0 0 16px 0' }}>常用汇率</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {CURRENCIES.slice(0, 8).filter(c => c.code !== fromCurrency).map(currency => (
                  <div key={currency.code} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '20px' }}>{currency.flag}</span>
                      <span style={{ color: '#e8e8f4', fontWeight: '600' }}>{currency.code}</span>
                    </div>
                    <div style={{ color: '#8b5cf6', fontSize: '14px' }}>
                      1 {fromCurrency} = {rates[currency.code] ? (rates[currency.code] / rates[fromCurrency]).toFixed(4) : '--'} {currency.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'crypto':
        return (
          <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#e8e8f4', margin: 0, fontSize: '20px' }}>₿ 加密货币</h3>
              <button
                onClick={fetchCrypto}
                disabled={loading.crypto}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading.crypto ? 0.5 : 1,
                }}
              >
                🔄 刷新
              </button>
            </div>
            {loading.crypto ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '48px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : error.crypto ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#f87171' }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <div>{error.crypto}</div>
              </div>
            ) : (
              <>
                {lastUpdated && (
                  <div style={{ color: '#a0a0c8', fontSize: '12px', marginBottom: '16px', textAlign: 'right' }}>
                    更新时间: {lastUpdated.toLocaleString('zh-CN')}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cryptoData.map(coin => (
                    <div key={coin.id} style={{
                      background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#fff'
                        }}>
                          {coin.symbol[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: '#e8e8f4', fontWeight: '600' }}>{coin.name}</div>
                          <div style={{ color: '#a0a0c8', fontSize: '12px' }}>{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#e8e8f4', fontWeight: '600' }}>${coin.price.toLocaleString()}</div>
                        <div style={{ color: coin.change24h >= 0 ? '#4ade80' : '#f87171', fontSize: '14px' }}>
                          {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )

      case 'news':
        return (
          <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#e8e8f4', margin: 0, fontSize: '20px' }}>📰 新闻资讯</h3>
              <button
                onClick={fetchNews}
                disabled={loading.news}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading.news ? 0.5 : 1,
                }}
              >
                🔄 刷新
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {['technology', 'science', 'business', 'health', 'entertainment'].map(q => (
                <button
                  key={q}
                  onClick={() => { setNewsQuery(q); fetchNews() }}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', border: newsQuery === q ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: newsQuery === q ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: newsQuery === q ? '#e8e8f4' : '#a0a0c8', cursor: 'pointer'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            {loading.news ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '48px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {news.map((article, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: '#e8e8f4', margin: '0 0 8px 0' }}>{article.title}</h4>
                    <p style={{ color: '#a0a0c8', margin: '0 0 12px 0', fontSize: '14px' }}>{article.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#8b5cf6' }}>
                      <span>来源: {article.source}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'ip':
        return (
          <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: '#e8e8f4', margin: 0, fontSize: '20px' }}>🌐 IP 信息查询</h3>
              <button
                onClick={fetchIP}
                disabled={loading.ip}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading.ip ? 0.5 : 1,
                }}
              >
                🔄 刷新
              </button>
            </div>
            {loading.ip ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '48px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : error.ip ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#f87171' }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <div>{error.ip}</div>
              </div>
            ) : ipData ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ color: '#a0a0c8', fontSize: '12px', marginBottom: '4px' }}>IP 地址</div>
                    <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '18px' }}>{ipData.ip}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ color: '#a0a0c8', fontSize: '12px', marginBottom: '4px' }}>城市</div>
                    <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '18px' }}>{ipData.city || '未知'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ color: '#a0a0c8', fontSize: '12px', marginBottom: '4px' }}>国家/地区</div>
                    <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '18px' }}>{ipData.country || '未知'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ color: '#a0a0c8', fontSize: '12px', marginBottom: '4px' }}>时区</div>
                    <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '18px' }}>{ipData.timezone || '未知'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', gridColumn: 'span 2' }}>
                    <div style={{ color: '#a0a0c8', fontSize: '12px', marginBottom: '4px' }}>ISP</div>
                    <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '16px' }}>{ipData.org || '未知'}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )

      case 'joke':
        return (
          <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ color: '#e8e8f4', margin: '0 0 24px 0', fontSize: '20px' }}>😂 程序员笑话</h3>
            {loading.joke ? (
              <div style={{ padding: '60px 24px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '64px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : joke ? (
              <>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
                  borderRadius: '20px',
                  padding: '40px 24px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '24px' }}>🤣</div>
                  <p style={{ color: '#e8e8f4', fontSize: '20px', margin: '0 0 24px 0', lineHeight: '1.6' }}>
                    {joke.setup}
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: '#8b5cf6',
                    fontSize: '22px',
                    fontWeight: '600'
                  }}>
                    {joke.punchline}
                  </div>
                </div>
                <button
                  onClick={fetchJoke}
                  style={{
                    padding: '14px 40px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  🔄 再来一个
                </button>
              </>
            ) : null}
          </div>
        )

      case 'dog':
        return (
          <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ color: '#e8e8f4', margin: '0 0 24px 0', fontSize: '20px' }}>🐕 随机狗狗</h3>
            {loading.dog ? (
              <div style={{ padding: '60px 24px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '64px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : dogImage ? (
              <>
                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', background: 'rgba(255,255,255,0.05)' }}>
                  <img src={dogImage} alt="Dog" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                </div>
                <button
                  onClick={fetchDog}
                  style={{
                    padding: '14px 40px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  🐕 换一只
                </button>
              </>
            ) : null}
          </div>
        )

      case 'cat':
        return (
          <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ color: '#e8e8f4', margin: '0 0 24px 0', fontSize: '20px' }}>🐱 随机猫咪</h3>
            {loading.cat ? (
              <div style={{ padding: '60px 24px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '64px' }}>⏳</div>
                <div style={{ marginTop: '16px' }}>加载中...</div>
              </div>
            ) : catImage ? (
              <>
                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', background: 'rgba(255,255,255,0.05)' }}>
                  <img src={catImage} alt="Cat" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                </div>
                <button
                  onClick={fetchCat}
                  style={{
                    padding: '14px 40px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  🐱 换一只
                </button>
              </>
            ) : null}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #12121a 0%, #0a0a10 100%)' }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        background: 'rgba(255,255,255,0.02)'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))' : 'transparent',
              color: activeTab === tab.id ? '#e8e8f4' : '#a0a0c8',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  )
}
