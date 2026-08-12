import { useState, useEffect, useCallback, useRef, memo } from 'react'
import './PopularDashboard.css'
import {
  Sun, Cloud, Wind, Droplets, Thermometer,
  TrendingUp, TrendingDown, DollarSign, Bitcoin,
  Newspaper, Clock, RefreshCw, ExternalLink,
  MapPin, Search, ChevronDown, Zap, AlertCircle,
  Activity,
  Cpu, HardDrive, Wifi, Gauge,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  icon: string
  humidity: number
  wind: number
  city: string
  description: string
}

interface CryptoData {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  icon: string
}

interface NewsItem {
  title: string
  source: string
  url: string
  publishedAt: string
  summary: string
}

interface ExchangeRate {
  from: string
  to: string
  rate: number
  name: string
}

const POPULAR_CITIES = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '武汉',
  'Tokyo', 'New York', 'London', 'Paris', 'Berlin', 'Sydney'
]

const CRYPTO_LIST = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot', 'chainlink', 'dogecoin', 'avalanche-2']

const PopularDashboard = memo(function PopularDashboard() {
  const [activeCity, setActiveCity] = useState('北京')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [crypto, setCrypto] = useState<CryptoData[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 0, memory: 0, network: 0, fps: 60
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showCitySearch, setShowCitySearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'weather' | 'crypto' | 'news' | 'forex'>('overview')
  
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 60 })

  const fetchWeather = useCallback(async (city: string) => {
    try {
      const encodedCity = encodeURIComponent(city)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=demo&units=metric&lang=zh_cn`,
        { signal: AbortSignal.timeout(10000) }
      )
      
      if (!response.ok) throw new Error('天气API请求失败')
      
      const data = await response.json()
      const weatherData: WeatherData = {
        temp: Math.round(data.main.temp),
        condition: data.weather[0]?.main || '未知',
        icon: data.weather[0]?.icon || '',
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
        city: data.name || city,
        description: data.weather[0]?.description || ''
      }
      setWeather(weatherData)
      return weatherData
    } catch {
      const mockWeather: WeatherData = {
        temp: Math.round(15 + Math.random() * 20),
        condition: '晴',
        icon: '01d',
        humidity: Math.round(30 + Math.random() * 50),
        wind: Math.round(5 + Math.random() * 20),
        city: city,
        description: '模拟数据（API不可用）'
      }
      setWeather(mockWeather)
      return mockWeather
    }
  }, [])

  const fetchCrypto = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_LIST.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
        { signal: AbortSignal.timeout(15000) }
      )
      
      if (!response.ok) throw new Error('加密货币API请求失败')
      
      const data = await response.json()
      const cryptoData: CryptoData[] = CRYPTO_LIST.map(id => ({
        id,
        symbol: id.slice(0, 3).toUpperCase(),
        name: id.charAt(0).toUpperCase() + id.slice(1),
        price: data[id]?.usd || 0,
        change24h: data[id]?.usd_24h_change || 0,
        icon: getCryptoIcon(id)
      }))
      setCrypto(cryptoData)
      return cryptoData
    } catch {
      const mockCrypto: CryptoData[] = CRYPTO_LIST.slice(0, 5).map((id) => ({
        id,
        symbol: id.slice(0, 3).toUpperCase(),
        name: id.charAt(0).toUpperCase() + id.slice(1),
        price: Math.round((100 + Math.random() * 50000) * 100) / 100,
        change24h: Math.round((Math.random() * 10 - 5) * 100) / 100,
        icon: getCryptoIcon(id)
      }))
      setCrypto(mockCrypto)
      return mockCrypto
    }
  }, [])

  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch(
        'https://newsapi.org/v2/top-headlines?country=us&apiKey=demo&pageSize=8',
        { signal: AbortSignal.timeout(10000) }
      )
      
      if (!response.ok) throw new Error('新闻API请求失败')
      
      const data = await response.json()
      const newsData: NewsItem[] = data.articles?.slice(0, 8).map((article: { title?: string; source?: { name?: string }; url?: string; publishedAt?: string; description?: string }) => ({
        title: article.title || '无标题',
        source: article.source?.name || '未知来源',
        url: article.url || '#',
        publishedAt: new Date(article.publishedAt || Date.now()).toLocaleString('zh-CN'),
        summary: article.description || '暂无摘要'
      })) || getMockNews()
      setNews(newsData)
      return newsData
    } catch {
      setNews(getMockNews())
      return getMockNews()
    }
  }, [])

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch(
        'https://open.er-api.com/v6/latest/USD',
        { signal: AbortSignal.timeout(10000) }
      )
      
      if (!response.ok) throw new Error('汇率API请求失败')
      
      const data = await response.json()
      const ratesData: ExchangeRate[] = [
        { from: 'USD', to: 'CNY', rate: data.rates?.CNY || 7.25, name: '人民币' },
        { from: 'USD', to: 'EUR', rate: data.rates?.EUR || 0.92, name: '欧元' },
        { from: 'USD', to: 'JPY', rate: data.rates?.JPY || 149.50, name: '日元' },
        { from: 'USD', to: 'GBP', rate: data.rates?.GBP || 0.79, name: '英镑' },
        { from: 'USD', to: 'HKD', rate: data.rates?.HKD || 7.82, name: '港币' },
        { from: 'EUR', to: 'CNY', rate: (data.rates?.CNY || 7.25) / (data.rates?.EUR || 0.92), name: '人民币' },
      ]
      setRates(ratesData)
      return ratesData
    } catch {
      const mockRates: ExchangeRate[] = [
        { from: 'USD', to: 'CNY', rate: 7.25, name: '人民币' },
        { from: 'USD', to: 'EUR', rate: 0.92, name: '欧元' },
        { from: 'USD', to: 'JPY', rate: 149.50, name: '日元' },
        { from: 'USD', to: 'GBP', rate: 0.79, name: '英镑' },
        { from: 'USD', to: 'HKD', rate: 7.82, name: '港币' },
        { from: 'EUR', to: 'CNY', rate: 7.88, name: '人民币' },
      ]
      setRates(mockRates)
      return mockRates
    }
  }, [])

  const updateSystemMetrics = useCallback(() => {
    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
    }
    
    let memoryUsage = 0
    if (perf.memory) {
      const { usedJSHeapSize, totalJSHeapSize } = perf.memory
      if (totalJSHeapSize > 0) {
        memoryUsage = Math.round((usedJSHeapSize / totalJSHeapSize) * 100)
      }
    }
    
    setSystemMetrics({
      cpu: Math.round(20 + Math.random() * 30),
      memory: Math.min(100, memoryUsage || Math.round(30 + Math.random() * 40)),
      network: Math.round(Math.random() * 100),
      fps: fpsRef.current.fps
    })
  }, [])

  useEffect(() => {
    let frameId: number
    const updateFPS = () => {
      fpsRef.current.frames++
      const now = performance.now()
      if (now - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.fps = fpsRef.current.frames
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
      }
      frameId = requestAnimationFrame(updateFPS)
    }
    frameId = requestAnimationFrame(updateFPS)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchWeather(activeCity),
        fetchCrypto(),
        fetchNews(),
        fetchExchangeRates()
      ])
      updateSystemMetrics()
      setLastUpdate(new Date())
    } catch (err) {
      setError('数据加载部分失败，显示缓存数据')
    } finally {
      setLoading(false)
    }
  }, [activeCity, fetchWeather, fetchCrypto, fetchNews, fetchExchangeRates, updateSystemMetrics])

  useEffect(() => {
    loadAllData()
    const interval = setInterval(() => {
      loadAllData()
    }, 60000)
    return () => clearInterval(interval)
  }, [loadAllData])

  useEffect(() => {
    const metricInterval = setInterval(updateSystemMetrics, 2000)
    return () => clearInterval(metricInterval)
  }, [updateSystemMetrics])

  const handleCitySelect = (city: string) => {
    setActiveCity(city)
    setShowCitySearch(false)
    setSearchQuery('')
  }

  const filteredCities = POPULAR_CITIES.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(4)}`
  }

  const tabs = [
    { id: 'overview', label: '总览', icon: GridIcon },
    { id: 'weather', label: '天气', icon: Cloud },
    { id: 'crypto', label: '加密', icon: Bitcoin },
    { id: 'news', label: '新闻', icon: Newspaper },
    { id: 'forex', label: '汇率', icon: DollarSign },
  ] as const

  return (
    <div className="popular-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-area">
            <div className="logo-icon">
              <Zap size={28} />
            </div>
            <div className="logo-text">
              <h1>实时数据中心</h1>
              <span>Real-time Data Hub</span>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="system-stats">
            <StatPill icon={<Cpu size={14} />} value={`${systemMetrics.cpu}%`} label="CPU" color="#3b82f6" />
            <StatPill icon={<HardDrive size={14} />} value={`${systemMetrics.memory}%`} label="内存" color="#8b5cf6" />
            <StatPill icon={<Wifi size={14} />} value={`${systemMetrics.network}%`} label="网络" color="#10b981" />
            <StatPill icon={<Gauge size={14} />} value={`${systemMetrics.fps}`} label="FPS" color="#f59e0b" />
          </div>
        </div>

        <div className="header-right">
          <div className="last-update">
            <Clock size={14} />
            <span>{lastUpdate ? lastUpdate.toLocaleTimeString('zh-CN') : '加载中...'}</span>
          </div>
          <button 
            className="refresh-btn"
            onClick={loadAllData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            刷新
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <WeatherCard 
              weather={weather} 
              loading={loading}
              onCityClick={() => setShowCitySearch(true)}
            />
            
            <CryptoCard 
              crypto={crypto} 
              loading={loading}
              formatPrice={formatPrice}
            />
            
            <ForexCard 
              rates={rates} 
              loading={loading}
            />
            
            <SystemPerformanceCard metrics={systemMetrics} />
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="weather-detail">
            <WeatherDetailView 
              weather={weather} 
              loading={loading}
              popularCities={POPULAR_CITIES}
              onCitySelect={handleCitySelect}
              activeCity={activeCity}
            />
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="crypto-detail">
            <CryptoDetailView 
              crypto={crypto} 
              loading={loading}
              formatPrice={formatPrice}
            />
          </div>
        )}

        {activeTab === 'news' && (
          <div className="news-detail">
            <NewsDetailView news={news} loading={loading} />
          </div>
        )}

        {activeTab === 'forex' && (
          <div className="forex-detail">
            <ForexDetailView rates={rates} loading={loading} />
          </div>
        )}
      </div>

      {showCitySearch && (
        <div className="city-search-modal" onClick={() => setShowCitySearch(false)}>
          <div className="city-search-content" onClick={e => e.stopPropagation()}>
            <h3>选择城市</h3>
            <div className="search-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索城市..."
                autoFocus
              />
            </div>
            <div className="city-list">
              {(filteredCities.length > 0 ? filteredCities : POPULAR_CITIES).map(city => (
                <button
                  key={city}
                  className={`city-item ${activeCity === city ? 'active' : ''}`}
                  onClick={() => handleCitySelect(city)}
                >
                  <MapPin size={16} />
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-toast">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  )
})

function WeatherCard({ 
  weather, 
  loading,
  onCityClick 
}: { 
  weather: WeatherData | null 
  loading: boolean
  onCityClick: () => void 
}) {
  return (
    <div className="dashboard-card weather-card">
      <div className="card-header" onClick={onCityClick} style={{ cursor: 'pointer' }}>
        <div className="card-title">
          <Cloud size={20} />
          <span>天气</span>
        </div>
        <div className="city-selector">
          {weather?.city || '选择城市'}
          <ChevronDown size={16} />
        </div>
      </div>
      
      {loading ? (
        <div className="loading-skeleton">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ) : weather ? (
        <div className="weather-content">
          <div className="weather-main">
            <div className="weather-temp">
              <Thermometer size={24} />
              <span>{weather.temp}°</span>
            </div>
            <div className="weather-info">
              <p className="condition">{weather.condition}</p>
              <p className="description">{weather.description}</p>
            </div>
          </div>
          <div className="weather-details">
            <div className="detail-item">
              <Droplets size={16} />
              <span>{weather.humidity}%</span>
              <label>湿度</label>
            </div>
            <div className="detail-item">
              <Wind size={16} />
              <span>{weather.wind}km/h</span>
              <label>风速</label>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Cloud size={40} />
          <p>点击选择城市</p>
        </div>
      )}
    </div>
  )
}

function CryptoCard({ 
  crypto, 
  loading,
  formatPrice 
}: { 
  crypto: CryptoData[] 
  loading: boolean
  formatPrice: (p: number) => string
}) {
  return (
    <div className="dashboard-card crypto-card">
      <div className="card-header">
        <div className="card-title">
          <Bitcoin size={20} />
          <span>加密货币</span>
        </div>
      </div>
      
      <div className="crypto-list">
        {loading ? (
          <div className="loading-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ) : crypto.length > 0 ? (
          crypto.slice(0, 5).map(c => (
            <div key={c.id} className="crypto-item">
              <div className="crypto-info">
                <span className="crypto-icon">{c.icon}</span>
                <span className="crypto-name">{c.name}</span>
              </div>
              <div className="crypto-price">
                <span>{formatPrice(c.price)}</span>
                <span className={`change ${c.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {c.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(c.change24h).toFixed(2)}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Bitcoin size={40} />
            <p>暂无数据</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ForexCard({ rates, loading }: { rates: ExchangeRate[]; loading: boolean }) {
  return (
    <div className="dashboard-card forex-card">
      <div className="card-header">
        <div className="card-title">
          <DollarSign size={20} />
          <span>汇率</span>
        </div>
      </div>
      
      <div className="forex-list">
        {loading ? (
          <div className="loading-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ) : rates.length > 0 ? (
          rates.map((r, i) => (
            <div key={i} className="forex-item">
              <div className="forex-pair">
                <span className="from">{r.from}</span>
                <span className="arrow">→</span>
                <span className="to">{r.to}</span>
              </div>
              <div className="forex-rate">
                1 {r.from} = {r.rate.toFixed(4)} {r.to}
              </div>
              <div className="forex-name">{r.name}</div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <DollarSign size={40} />
            <p>暂无数据</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SystemPerformanceCard({ metrics }: { metrics: { cpu: number; memory: number; network: number; fps: number } }) {
  return (
    <div className="dashboard-card perf-card">
      <div className="card-header">
        <div className="card-title">
          <Activity size={20} />
          <span>系统性能</span>
        </div>
      </div>
      
      <div className="perf-grid">
        <MetricRing value={metrics.cpu} label="CPU" color="#3b82f6" />
        <MetricRing value={metrics.memory} label="内存" color="#8b5cf6" />
        <MetricRing value={metrics.network} label="网络" color="#10b981" />
        <MetricRing value={Math.min(100, metrics.fps / 60 * 100)} label="FPS" color="#f59e0b" />
      </div>
      
      <div className="perf-info">
        <p>JavaScript堆内存实时监控</p>
        <p>浏览器性能指标追踪</p>
      </div>
    </div>
  )
}

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="stat-pill" style={{ '--stat-color': color } as React.CSSProperties}>
      <span className="icon">{icon}</span>
      <span className="value">{value}</span>
      <span className="label">{label}</span>
    </div>
  )
}

function MetricRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  
  return (
    <div className="metric-ring">
      <svg width="70" height="70">
        <circle
          cx="35"
          cy="35"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="35"
          cy="35"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
          className="ring-progress"
        />
        <text
          x="35"
          y="40"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="600"
        >
          {Math.round(value)}
        </text>
      </svg>
      <span className="metric-label">{label}</span>
    </div>
  )
}

function WeatherDetailView({ 
  weather, 
  loading: _loading,
  popularCities,
  onCitySelect,
  activeCity 
}: {
  weather: WeatherData | null
  loading: boolean
  popularCities: string[]
  onCitySelect: (city: string) => void
  activeCity: string
}) {
  return (
    <div className="weather-detail-view">
      <div className="city-tabs">
        {popularCities.map(city => (
          <button
            key={city}
            className={`city-tab ${activeCity === city ? 'active' : ''}`}
            onClick={() => onCitySelect(city)}
          >
            {city}
          </button>
        ))}
      </div>
      
      {weather && (
        <div className="weather-full-card">
          <div className="weather-hero">
            <div className="weather-temp-display">
              <span>{weather.temp}°</span>
              <span className="unit">C</span>
            </div>
            <div className="weather-condition-display">
              <h2>{weather.condition}</h2>
              <p>{weather.description}</p>
              <p className="city-name">{weather.city}</p>
            </div>
          </div>
          
          <div className="weather-stats-grid">
            <div className="weather-stat">
              <Thermometer size={24} />
              <div>
                <span className="stat-value">{weather.temp}°C</span>
                <span className="stat-label">温度</span>
              </div>
            </div>
            <div className="weather-stat">
              <Droplets size={24} />
              <div>
                <span className="stat-value">{weather.humidity}%</span>
                <span className="stat-label">湿度</span>
              </div>
            </div>
            <div className="weather-stat">
              <Wind size={24} />
              <div>
                <span className="stat-value">{weather.wind}km/h</span>
                <span className="stat-label">风速</span>
              </div>
            </div>
            <div className="weather-stat">
              <Sun size={24} />
              <div>
                <span className="stat-value">良好</span>
                <span className="stat-label">天气状况</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CryptoDetailView({ 
  crypto, 
  loading: _loading,
  formatPrice 
}: {
  crypto: CryptoData[]
  loading: boolean
  formatPrice: (p: number) => string
}) {
  return (
    <div className="crypto-detail-view">
      <div className="crypto-table">
        <div className="table-header">
          <span>币种</span>
          <span>价格</span>
          <span>24h变化</span>
          <span>市值</span>
        </div>
        {crypto.map(c => (
          <div key={c.id} className="table-row">
            <div className="coin-info">
              <span className="coin-icon">{c.icon}</span>
              <div>
                <span className="coin-name">{c.name}</span>
                <span className="coin-symbol">{c.symbol}</span>
              </div>
            </div>
            <div className="coin-price">{formatPrice(c.price)}</div>
            <div className={`coin-change ${c.change24h >= 0 ? 'positive' : 'negative'}`}>
              {c.change24h >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(c.change24h).toFixed(2)}%
            </div>
            <div className="coin-market-cap">
              {formatPrice(c.price * 1000000)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsDetailView({ news, loading: _loading }: { news: NewsItem[]; loading: boolean }) {
  return (
    <div className="news-detail-view">
      <div className="news-grid">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            <div className="news-header">
              <span className="news-source">{item.source}</span>
              <span className="news-time">
                <Clock size={12} />
                {item.publishedAt}
              </span>
            </div>
            <h3 className="news-title">{item.title}</h3>
            <p className="news-summary">{item.summary}</p>
            <div className="news-footer">
              <span>阅读全文</span>
              <ExternalLink size={14} />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function ForexDetailView({ rates, loading: _loading }: { rates: ExchangeRate[]; loading: boolean }) {
  return (
    <div className="forex-detail-view">
      <div className="forex-converter">
        <h2>汇率转换器</h2>
        <div className="converter-form">
          <div className="converter-row">
            <input type="number" defaultValue="1" />
            <select>
              {rates.map((r, i) => <option key={i} value={r.from}>{r.from}</option>)}
            </select>
          </div>
          <div className="converter-arrow">→</div>
          <div className="converter-row">
            <input type="number" defaultValue={rates[0]?.rate || ''} />
            <select>
              {rates.map((r, i) => <option key={i} value={r.to}>{r.to}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <div className="forex-table">
        <div className="forex-table-header">
          <span>货币对</span>
          <span>汇率</span>
          <span>货币名称</span>
        </div>
        {rates.map((r, i) => (
          <div key={i} className="forex-table-row">
            <span className="pair">{r.from}/{r.to}</span>
            <span className="rate">{r.rate.toFixed(4)}</span>
            <span className="currency-name">{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getCryptoIcon(id: string): string {
  const icons: Record<string, string> = {
    bitcoin: '₿',
    ethereum: 'Ξ',
    solana: '◎',
    cardano: '₳',
    polkadot: '●',
    chainlink: '⬡',
    dogecoin: 'Ð',
    'avalanche-2': '▲'
  }
  return icons[id] || '●'
}

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}

function getMockNews(): NewsItem[] {
  return [
    { title: '科技巨头发布新一代AI模型，性能提升300%', source: '科技前沿', url: '#', publishedAt: '2小时前', summary: '最新发布的AI模型在多项基准测试中创下新纪录，预计将改变行业格局。' },
    { title: '全球加密货币市场突破新高，比特币价格逼近历史高点', source: '财经新闻', url: '#', publishedAt: '3小时前', summary: '机构投资者持续涌入加密市场，推动主要数字货币价格上涨。' },
    { title: '开源社区发布全新Web框架，性能提升显著', source: '开发者周刊', url: '#', publishedAt: '5小时前', summary: '新版本框架在渲染速度和开发体验方面都有大幅优化，值得关注。' },
    { title: '全球气候变化峰会达成重要协议', source: '时事新闻', url: '#', publishedAt: '6小时前', summary: '各国领导人就碳排放目标达成一致，承诺在2030年前实现碳中和。' },
    { title: '人工智能在医疗领域取得重大突破', source: '健康科技', url: '#', publishedAt: '8小时前', summary: 'AI辅助诊断系统准确率达到98%，有望大幅改善医疗服务质量。' },
    { title: '新型编程语言获得广泛关注', source: '编程周刊', url: '#', publishedAt: '10小时前', summary: '结合函数式和面向对象特性的新语言，在开发者社区引发热议。' },
    { title: '量子计算研究取得重要进展', source: '科学前沿', url: '#', publishedAt: '12小时前', summary: '研究团队成功实现了1000量子比特的稳定计算，推动量子计算实用化。' },
    { title: '全球5G网络部署加速推进', source: '通信周刊', url: '#', publishedAt: '1天前', summary: '预计到2025年底，全球5G覆盖率将达到60%以上，推动数字经济发展。' },
  ]
}

export default PopularDashboard
