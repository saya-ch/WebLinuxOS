import { useState, useEffect, useCallback, memo } from 'react'

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  condition: string
  city: string
  forecast: Array<{ date: string; temp: number; condition: string }>
}

interface CryptoData {
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
}

interface NewsItem {
  title: string
  url: string
  source: string
  time: string
}

interface ExchangeRate {
  currency: string
  rate: number
  change: number
}

const RealTimeDataDashboard = memo(function RealTimeDataDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [crypto, setCrypto] = useState<CryptoData[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedCity, setSelectedCity] = useState('Beijing')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const cities = ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Tokyo', 'New York', 'London', 'Paris']

  // Fetch weather data from Open-Meteo API
  const fetchWeather = useCallback(async () => {
    try {
      const cityCoords: Record<string, { lat: number; lon: number }> = {
        'Beijing': { lat: 39.9042, lon: 116.4074 },
        'Shanghai': { lat: 31.2304, lon: 121.4737 },
        'Shenzhen': { lat: 22.5431, lon: 114.0579 },
        'Guangzhou': { lat: 23.1291, lon: 113.2644 },
        'Tokyo': { lat: 35.6762, lon: 139.6503 },
        'New York': { lat: 40.7128, lon: -74.0060 },
        'London': { lat: 51.5074, lon: -0.1278 },
        'Paris': { lat: 48.8566, lon: 2.3522 }
      }
      
      const coords = cityCoords[selectedCity] || cityCoords['Beijing']
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,weather_code&timezone=auto&forecast_days=7`
      )
      
      if (!response.ok) throw new Error('Weather API failed')
      const data = await response.json()
      
      const weatherConditions: Record<number, string> = {
        0: '晴朗', 1: '晴朗', 2: '多云', 3: '阴天',
        45: '雾', 48: '雾', 51: '小雨', 53: '小雨', 55: '中雨',
        61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '阵雨', 82: '暴雨', 95: '雷暴'
      }
      
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        condition: weatherConditions[data.current.weather_code] || '未知',
        city: selectedCity,
        forecast: data.daily.time.slice(0, 7).map((date: string, i: number) => ({
          date: new Date(date).toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' }),
          temp: Math.round(data.daily.temperature_2m_max[i]),
          condition: weatherConditions[data.daily.weather_code[i]] || '未知'
        }))
      })
    } catch (error) {
      console.error('Weather fetch error:', error)
      setErrors(prev => [...prev, '天气数据获取失败'])
    }
  }, [selectedCity])

  // Fetch crypto data (simulated for demo)
  const fetchCrypto = useCallback(async () => {
    try {
      // Simulated crypto data since most APIs require authentication
      const cryptoData: CryptoData[] = [
        { name: 'Bitcoin', symbol: 'BTC', price: 67234.56, change24h: 2.34, marketCap: 1.32e12 },
        { name: 'Ethereum', symbol: 'ETH', price: 3521.78, change24h: -1.23, marketCap: 423e9 },
        { name: 'Solana', symbol: 'SOL', price: 178.45, change24h: 5.67, marketCap: 78e9 },
        { name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: 3.21, marketCap: 15e9 },
        { name: 'Polkadot', symbol: 'DOT', price: 7.23, change24h: -0.89, marketCap: 9e9 }
      ]
      setCrypto(cryptoData)
    } catch (error) {
      console.error('Crypto fetch error:', error)
      setErrors(prev => [...prev, '加密货币数据获取失败'])
    }
  }, [])

  // Fetch news from Hacker News Algolia API
  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch('https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=10')
      if (!response.ok) throw new Error('News API failed')
      const data = await response.json()
      
      setNews(data.hits.map((hit: any) => ({
        title: hit.title || 'Untitled',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: hit.domain || 'Hacker News',
        time: new Date(hit.created_at).toLocaleDateString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })))
    } catch (error) {
      console.error('News fetch error:', error)
      setErrors(prev => [...prev, '新闻数据获取失败'])
    }
  }, [])

  // Fetch exchange rates from Frankfurter API
  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=CNY,EUR,GBP,JPY,KRW,AUD')
      if (!response.ok) throw new Error('Exchange rate API failed')
      const data = await response.json()
      
      const currencyNames: Record<string, string> = {
        CNY: '人民币',
        EUR: '欧元',
        GBP: '英镑',
        JPY: '日元',
        KRW: '韩元',
        AUD: '澳元'
      }
      
      setRates(Object.entries(data.rates).map(([currency, rate]) => ({
        currency: currencyNames[currency] || currency,
        rate: rate as number,
        change: Math.random() * 2 - 1 // Simulated change for demo
      })))
    } catch (error) {
      console.error('Rates fetch error:', error)
      setErrors(prev => [...prev, '汇率数据获取失败'])
    }
  }, [])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setErrors([])
    
    await Promise.all([
      fetchWeather(),
      fetchCrypto(),
      fetchNews(),
      fetchRates()
    ])
    
    setLastUpdate(new Date())
    setLoading(false)
  }, [fetchWeather, fetchCrypto, fetchNews, fetchRates])

  // Initial fetch
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchAllData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAllData])

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  return (
    <div className="app-shell" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(26, 26, 46, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📊</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>实时数据仪表板</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="app-select"
            style={{ minWidth: '100px' }}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <button
            className="app-button"
            onClick={fetchAllData}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} 刷新
          </button>
          <button
            className={`app-button ${autoRefresh ? 'app-button-primary' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '✓ 自动' : '手动'}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(22, 22, 38, 0.3)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {loading ? '⏳ 正在更新数据...' : `✓ 最后更新: ${lastUpdate.toLocaleTimeString('zh-CN')}`}
        </span>
        {errors.length > 0 && (
          <span style={{ color: '#ff6b6b' }}>
            ⚠ {errors.length} 个错误
          </span>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        <div className="grid grid-2" style={{ gap: '16px' }}>
          {/* Weather Card */}
          <div className="app-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>🌤️</span>
              <span style={{ fontWeight: 600 }}>天气 - {selectedCity}</span>
            </div>
            {weather ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {weather.temperature}°C
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{weather.condition}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      湿度: {weather.humidity}% | 风速: {weather.windSpeed}km/h
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', overflow: 'auto' }}>
                  {weather.forecast.map((day, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(139, 124, 240, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minWidth: '80px'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{day.date}</div>
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>{day.temp}°</div>
                      <div style={{ fontSize: '12px' }}>{day.condition}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                {loading ? '加载中...' : '无数据'}
              </div>
            )}
          </div>

          {/* Exchange Rates Card */}
          <div className="app-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>💱</span>
              <span style={{ fontWeight: 600 }}>汇率 (USD)</span>
            </div>
            {rates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rates.map(rate => (
                  <div
                    key={rate.currency}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{rate.currency}</span>
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>{rate.rate.toFixed(4)}</span>
                    <span style={{
                      fontSize: '12px',
                      color: rate.change >= 0 ? '#4caf50' : '#f44336'
                    }}>
                      {rate.change >= 0 ? '↑' : '↓'} {Math.abs(rate.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                {loading ? '加载中...' : '无数据'}
              </div>
            )}
          </div>

          {/* Crypto Card */}
          <div className="app-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>₿</span>
              <span style={{ fontWeight: 600 }}>加密货币</span>
            </div>
            {crypto.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {crypto.map(coin => (
                  <div
                    key={coin.symbol}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>{coin.symbol}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{coin.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>${formatNumber(coin.price)}</span>
                      <span style={{
                        fontSize: '12px',
                        marginLeft: '8px',
                        color: coin.change24h >= 0 ? '#4caf50' : '#f44336'
                      }}>
                        {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                {loading ? '加载中...' : '无数据'}
              </div>
            )}
          </div>

          {/* News Card */}
          <div className="app-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>📰</span>
              <span style={{ fontWeight: 600 }}>技术新闻</span>
            </div>
            {news.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 124, 240, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.source} · {item.time}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                {loading ? '加载中...' : '无数据'}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'rgba(26, 26, 46, 0.4)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {weather?.temperature || '--'}°C
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>当前温度</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-secondary)' }}>
              {rates.find(r => r.currency === '人民币')?.rate.toFixed(2) || '--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>USD/CNY</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>
              {crypto.find(c => c.symbol === 'BTC')?.price.toFixed(0) || '--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>BTC价格</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff9800' }}>
              {news.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>新闻条数</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          数据来源: Open-Meteo | Frankfurter | Hacker News
        </span>
        <span>
          自动刷新: 每60秒 | 下次刷新: {autoRefresh ? `${Math.floor(60 - (Date.now() - lastUpdate.getTime()) / 1000)}秒` : '已关闭'}
        </span>
      </div>
    </div>
  )
})

export default RealTimeDataDashboard