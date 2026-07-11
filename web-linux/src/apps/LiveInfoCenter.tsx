import { useState, useEffect, useCallback } from 'react'
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  Newspaper,
  TrendingUp,
  RefreshCw,
  Clock,
  Globe,
  Activity,
  Zap,
  ExternalLink,
  Sparkles,
  Gauge,
} from 'lucide-react'

interface WeatherData {
  temperature: number
  apparentTemperature: number
  relativeHumidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
  city: string
}

interface NewsItem {
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number
  descendants?: number
}

interface CryptoItem {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  image: string
  market_cap: number
}

const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
]

function getWeatherIcon(code: number, isDay: boolean) {
  if (code === 0) return isDay ? <Sun size={32} /> : <Cloud size={32} />
  if (code <= 3) return isDay ? <CloudSun size={32} /> : <Cloud size={32} />
  if (code <= 48) return <Cloud size={32} />
  if (code <= 67) return <CloudRain size={32} />
  if (code <= 86) return <Snowflake size={32} />
  return <CloudRain size={32} />
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: '晴朗', 1: '大部晴朗', 2: '多云', 3: '阴天',
    45: '有雾', 48: '雾凇', 51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    56: '冻毛毛雨', 57: '强冻毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '强冻雨', 71: '小雪', 73: '中雪', 75: '大雪',
    77: '雪粒', 80: '小阵雨', 81: '阵雨', 82: '强阵雨',
    85: '小阵雪', 86: '强阵雪', 95: '雷暴', 96: '雷暴伴小冰雹', 99: '雷暴伴大冰雹',
  }
  return descriptions[code] || '未知'
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

function WeatherCard({ city, lat, lon }: { city: string; lat: number; lon: number }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`
      )
      if (!response.ok) throw new Error('天气数据获取失败')
      const data = await response.json()
      setWeather({
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        relativeHumidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
        city,
      })
    } catch (e) {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [city, lat, lon])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  return (
    <div className="info-card weather-card">
      <div className="card-header">
        <div className="card-title">
          <Cloud size={18} />
          <span>{city}</span>
        </div>
        <button className="refresh-btn" onClick={fetchWeather} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
        </button>
      </div>
      {loading ? (
        <div className="card-loading">加载中...</div>
      ) : error ? (
        <div className="card-error">{error}</div>
      ) : weather && (
        <div className="weather-content">
          <div className="weather-main">
            <div className="weather-icon">{getWeatherIcon(weather.weatherCode, weather.isDay)}</div>
            <div className="weather-temp">
              <span className="temp-value">{Math.round(weather.temperature)}</span>
              <span className="temp-unit">°C</span>
            </div>
          </div>
          <div className="weather-desc">{getWeatherDescription(weather.weatherCode)}</div>
          <div className="weather-details">
            <div className="weather-detail">
              <Thermometer size={14} />
              <span>体感 {Math.round(weather.apparentTemperature)}°</span>
            </div>
            <div className="weather-detail">
              <Droplets size={14} />
              <span>湿度 {weather.relativeHumidity}%</span>
            </div>
            <div className="weather-detail">
              <Wind size={14} />
              <span>风速 {weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HackerNewsCard() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState<'top' | 'new' | 'best'>('top')

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = type === 'top' ? 'topstories' : type === 'new' ? 'newstories' : 'beststories'
      const idsRes = await fetch(`https://hacker-news.firebaseio.com/v0/${endpoint}.json`)
      const ids: number[] = await idsRes.json()
      const topIds = ids.slice(0, 10)
      const items = await Promise.all(
        topIds.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
        )
      )
      setNews(items.filter(Boolean))
    } catch (e) {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return (
    <div className="info-card news-card">
      <div className="card-header">
        <div className="card-title">
          <Newspaper size={18} />
          <span>Hacker News</span>
        </div>
        <div className="card-tabs">
          {(['top', 'new', 'best'] as const).map(t => (
            <button
              key={t}
              className={type === t ? 'active' : ''}
              onClick={() => setType(t)}
            >
              {t === 'top' ? '热门' : t === 'new' ? '最新' : '最佳'}
            </button>
          ))}
          <button className="refresh-btn" onClick={fetchNews} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="card-loading">加载中...</div>
      ) : error ? (
        <div className="card-error">{error}</div>
      ) : (
        <div className="news-list">
          {news.map((item, index) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <span className="news-rank">{index + 1}</span>
              <div className="news-content">
                <div className="news-title">{item.title}</div>
                <div className="news-meta">
                  <span>▲ {item.score}</span>
                  <span>by {item.by}</span>
                  <span>{formatTimeAgo(item.time)}</span>
                  {item.descendants !== undefined && <span>💬 {item.descendants}</span>}
                </div>
              </div>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function CryptoCard() {
  const [cryptos, setCryptos] = useState<CryptoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCrypto = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
      )
      if (!response.ok) throw new Error('加密货币数据获取失败')
      const data = await response.json()
      setCryptos(data)
    } catch (e) {
      setError('加载失败 (CoinGecko API 可能受限流)')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrypto()
  }, [fetchCrypto])

  return (
    <div className="info-card crypto-card">
      <div className="card-header">
        <div className="card-title">
          <TrendingUp size={18} />
          <span>加密货币行情</span>
        </div>
        <button className="refresh-btn" onClick={fetchCrypto} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
        </button>
      </div>
      {loading ? (
        <div className="card-loading">加载中...</div>
      ) : error ? (
        <div className="card-error">{error}</div>
      ) : (
        <div className="crypto-list">
          {cryptos.map((coin) => (
            <div key={coin.id} className="crypto-item">
              <div className="crypto-info">
                <img src={coin.image} alt={coin.name} className="crypto-icon" />
                <div>
                  <div className="crypto-name">{coin.name}</div>
                  <div className="crypto-symbol">{coin.symbol.toUpperCase()}</div>
                </div>
              </div>
              <div className="crypto-price">
                <div className="price-value">
                  {coin.current_price < 0.01
                    ? `$${coin.current_price.toFixed(6)}`
                    : coin.current_price < 1
                    ? `$${coin.current_price.toFixed(4)}`
                    : `$${coin.current_price.toLocaleString()}`}
                </div>
                <div className={`price-change ${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                  {coin.price_change_percentage_24h?.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SystemStatsCard() {
  const [stats, setStats] = useState({
    cpu: 0,
    memory: 0,
    uptime: 0,
    tabs: 0,
  })

  useEffect(() => {
    const updateStats = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory
        const used = mem.usedJSHeapSize / mem.totalJSHeapSize * 100
        setStats(s => ({ ...s, memory: Math.round(used * 10) / 10 }))
      }
      setStats(s => ({
        ...s,
        cpu: Math.round((30 + Math.random() * 20) * 10) / 10,
        uptime: Math.floor(performance.now() / 1000),
      }))
    }
    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="info-card stats-card">
      <div className="card-header">
        <div className="card-title">
          <Activity size={18} />
          <span>系统状态</span>
        </div>
        <div className="status-dot online" />
      </div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon cpu"><Zap size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.cpu}%</div>
            <div className="stat-label">CPU 模拟</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon memory"><Gauge size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.memory}%</div>
            <div className="stat-label">内存使用</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon uptime"><Clock size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{formatUptime(stats.uptime)}</div>
            <div className="stat-label">运行时间</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon globe"><Globe size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">在线</div>
            <div className="stat-label">网络状态</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LiveInfoCenter() {
  const [selectedCityIndex, setSelectedCityIndex] = useState(0)
  const currentCity = CITIES[selectedCityIndex]

  return (
    <div className="live-info-center">
      <div className="info-center-header">
        <div className="info-center-title">
          <Sparkles size={24} />
          <div>
            <h1>实时信息中心</h1>
            <p>整合天气、新闻、加密货币等实时数据</p>
          </div>
        </div>
        <div className="city-selector">
          {CITIES.map((city, index) => (
            <button
              key={city.name}
              className={selectedCityIndex === index ? 'active' : ''}
              onClick={() => setSelectedCityIndex(index)}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <div className="info-center-content">
        <div className="left-column">
          <WeatherCard city={currentCity.name} lat={currentCity.lat} lon={currentCity.lon} />
          <SystemStatsCard />
        </div>
        <div className="right-column">
          <HackerNewsCard />
        </div>
        <div className="bottom-row">
          <CryptoCard />
        </div>
      </div>

      <style>{`
        .live-info-center {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 20px;
          background: linear-gradient(135deg, #0a0a1a 0%, #0d0d25 50%, #0f0f2a 100%);
          color: #e0e0e8;
          font-family: inherit;
          overflow: hidden;
        }
        .info-center-header {
          flex-shrink: 0;
          margin-bottom: 20px;
        }
        .info-center-title {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .info-center-title h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .info-center-title p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: 2px 0 0 0;
        }
        .info-center-title svg {
          color: #a78bfa;
        }
        .city-selector {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .city-selector button {
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .city-selector button:hover {
          background: rgba(124, 108, 240, 0.15);
          border-color: rgba(124, 108, 240, 0.4);
          color: #a78bfa;
        }
        .city-selector button.active {
          background: rgba(124, 108, 240, 0.2);
          border-color: rgba(124, 108, 240, 0.6);
          color: #a78bfa;
        }
        .info-center-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr auto;
          gap: 16px;
          overflow: hidden;
        }
        .left-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
        }
        .right-column {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .bottom-row {
          grid-column: 1 / -1;
          overflow: hidden;
        }
        .info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
        }
        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
        .card-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .card-tabs button {
          padding: 4px 10px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .card-tabs button:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        .card-tabs button.active {
          color: #a78bfa;
          background: rgba(124, 108, 240, 0.15);
        }
        .refresh-btn {
          padding: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .refresh-btn:hover {
          background: rgba(124, 108, 240, 0.15);
          border-color: rgba(124, 108, 240, 0.4);
          color: #a78bfa;
        }
        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .refresh-btn .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .card-loading {
          padding: 30px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }
        .card-error {
          padding: 20px;
          text-align: center;
          color: #f87171;
          font-size: 13px;
        }
        .weather-card {
          flex: 1;
          min-height: 0;
        }
        .weather-content {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .weather-main {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }
        .weather-icon {
          color: #fbbf24;
        }
        .weather-temp {
          display: flex;
          align-items: flex-start;
        }
        .temp-value {
          font-size: 48px;
          font-weight: 300;
          line-height: 1;
          color: #fff;
        }
        .temp-unit {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 6px;
        }
        .weather-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
        }
        .weather-details {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: auto;
        }
        .weather-detail {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }
        .weather-detail svg {
          color: #67e8f9;
          flex-shrink: 0;
        }
        .news-card {
          flex: 1;
          min-height: 0;
        }
        .news-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .news-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: background 0.2s;
          margin-bottom: 2px;
        }
        .news-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .news-rank {
          width: 20px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }
        .news-content {
          flex: 1;
          min-width: 0;
        }
        .news-title {
          font-size: 13px;
          color: #fff;
          line-height: 1.4;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }
        .news-item svg {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 2px;
        }
        .crypto-card {
          max-height: 320px;
        }
        .crypto-list {
          overflow-y: auto;
          padding: 8px;
        }
        .crypto-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .crypto-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .crypto-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .crypto-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
        .crypto-name {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }
        .crypto-symbol {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }
        .crypto-price {
          text-align: right;
        }
        .price-value {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
        }
        .price-change {
          font-size: 11px;
          font-weight: 500;
        }
        .price-change.up {
          color: #34d399;
        }
        .price-change.down {
          color: #f87171;
        }
        .stats-card {
          flex-shrink: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 14px;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        .stat-icon.cpu {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }
        .stat-icon.memory {
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
        }
        .stat-icon.uptime {
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
        }
        .stat-icon.globe {
          background: rgba(167, 139, 250, 0.15);
          color: #a78bfa;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.online {
          background: #34d399;
          box-shadow: 0 0 8px rgba(52, 211, 153, 0.5);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
