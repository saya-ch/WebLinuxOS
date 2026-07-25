/**
 * InfoPulse 信息脉搏中心
 * 
 * 创新功能：实时信息聚合与智能推送
 * - 多源新闻聚合（HackerNews, GitHub Trending, 技术动态）
 * - 天气与空气质量实时监控
 * - 加密货币市场动态
 * - 全球时区时钟
 * - 系统健康度评分
 * - 个性化信息卡片布局
 * 
 * 设计风格：赛博朋克/玻璃拟态融合
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Activity, Globe, Cloud, TrendingUp, Clock, Cpu, 
  Zap, RefreshCw, Settings, Maximize2, Minimize2,
  ChevronRight, ExternalLink, AlertTriangle, CheckCircle
} from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  timestamp: number
  category: 'tech' | 'science' | 'world'
}

interface WeatherData {
  temp: number
  humidity: number
  condition: string
  location: string
  airQuality: number
}

interface CryptoData {
  symbol: string
  name: string
  price: number
  change24h: number
}

interface SystemHealth {
  score: number
  cpu: number
  memory: number
  storage: number
  network: 'excellent' | 'good' | 'fair' | 'poor'
}

interface CardConfig {
  id: string
  type: 'news' | 'weather' | 'crypto' | 'clocks' | 'system' | 'trending'
  title: string
  enabled: boolean
  order: number
  size: 'small' | 'medium' | 'large'
}

const CARD_CONFIGS: CardConfig[] = [
  { id: 'system', type: 'system', title: '系统健康度', enabled: true, order: 0, size: 'medium' },
  { id: 'news', type: 'news', title: '技术动态', enabled: true, order: 1, size: 'large' },
  { id: 'weather', type: 'weather', title: '天气状况', enabled: true, order: 2, size: 'medium' },
  { id: 'crypto', type: 'crypto', title: '加密货币', enabled: false, order: 3, size: 'small' },
  { id: 'clocks', type: 'clocks', title: '世界时钟', enabled: true, order: 4, size: 'small' },
  { id: 'trending', type: 'trending', title: 'GitHub 热门', enabled: true, order: 5, size: 'medium' },
]

// 模拟数据生成器（实际部署可接入真实API）
const generateMockData = {
  news: (): NewsItem[] => [
    { id: '1', title: 'TypeScript 6.0 发布：新特性一览', source: 'GitHub Blog', url: '#', timestamp: Date.now() - 3600000, category: 'tech' },
    { id: '2', title: 'React 20 性能优化最佳实践', source: 'React Blog', url: '#', timestamp: Date.now() - 7200000, category: 'tech' },
    { id: '3', title: 'Vite 9.0 带来革命性构建速度', source: 'Vite Blog', url: '#', timestamp: Date.now() - 10800000, category: 'tech' },
    { id: '4', title: 'WebGPU 正式成为 W3C 标准', source: 'W3C', url: '#', timestamp: Date.now() - 14400000, category: 'tech' },
    { id: '5', title: 'AI 编程助手效率提升 40%', source: 'Research', url: '#', timestamp: Date.now() - 18000000, category: 'tech' },
  ],
  
  weather: (): WeatherData => ({
    temp: 22 + Math.floor(Math.random() * 10),
    humidity: 45 + Math.floor(Math.random() * 30),
    condition: ['晴朗', '多云', '阴天', '小雨'][Math.floor(Math.random() * 4)],
    location: '北京',
    airQuality: 35 + Math.floor(Math.random() * 100),
  }),
  
  crypto: (): CryptoData[] => [
    { symbol: 'BTC', name: 'Bitcoin', price: 67000 + Math.random() * 2000, change24h: (Math.random() - 0.5) * 10 },
    { symbol: 'ETH', name: 'Ethereum', price: 3400 + Math.random() * 200, change24h: (Math.random() - 0.5) * 10 },
    { symbol: 'SOL', name: 'Solana', price: 145 + Math.random() * 20, change24h: (Math.random() - 0.5) * 15 },
  ],
  
  systemHealth: (): SystemHealth => ({
    score: 75 + Math.floor(Math.random() * 20),
    cpu: 20 + Math.floor(Math.random() * 40),
    memory: 40 + Math.floor(Math.random() * 30),
    storage: 55 + Math.floor(Math.random() * 25),
    network: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)] as SystemHealth['network'],
  }),
}

// 系统健康度卡片
function SystemHealthCard({ data }: { data: SystemHealth }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 70) return '#3b82f6'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }
  
  const getNetworkIcon = (status: SystemHealth['network']) => {
    switch (status) {
      case 'excellent': return <CheckCircle size={14} />
      case 'good': return <CheckCircle size={14} />
      case 'fair': return <AlertTriangle size={14} />
      case 'poor': return <AlertTriangle size={14} />
    }
  }
  
  return (
    <div className="info-card info-card-system">
      <div className="info-card-header">
        <Cpu size={16} />
        <span>系统健康度</span>
      </div>
      <div className="info-card-content">
        <div className="health-score-ring">
          <svg viewBox="0 0 100 100" className="health-ring-svg">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--card-border)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="40" fill="none" 
              stroke={getScoreColor(data.score)} 
              strokeWidth="8"
              strokeDasharray={`${data.score * 2.51} 251`}
              strokeDashoffset="62.83"
              strokeLinecap="round"
              className="health-ring-progress"
            />
          </svg>
          <div className="health-score-value" style={{ color: getScoreColor(data.score) }}>
            {data.score}
          </div>
        </div>
        <div className="health-metrics">
          <div className="health-metric">
            <div className="metric-label">CPU</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: `${data.cpu}%` }} />
            </div>
            <div className="metric-value">{data.cpu}%</div>
          </div>
          <div className="health-metric">
            <div className="metric-label">内存</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: `${data.memory}%` }} />
            </div>
            <div className="metric-value">{data.memory}%</div>
          </div>
          <div className="health-metric">
            <div className="metric-label">存储</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: `${data.storage}%` }} />
            </div>
            <div className="metric-value">{data.storage}%</div>
          </div>
          <div className="health-metric health-metric-network">
            <div className="metric-label">网络</div>
            <div className={`network-status network-${data.network}`}>
              {getNetworkIcon(data.network)}
              <span>{data.network === 'excellent' ? '优秀' : data.network === 'good' ? '良好' : data.network === 'fair' ? '一般' : '较差'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 新闻卡片
function NewsCard({ news }: { news: NewsItem[] }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className={`info-card info-card-news ${expanded ? 'expanded' : ''}`}>
      <div className="info-card-header">
        <Globe size={16} />
        <span>技术动态</span>
        <button className="card-expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
      <div className="info-card-content">
        <div className="news-list">
          {news.map((item, index) => (
            <div key={item.id} className="news-item" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="news-item-category">{item.category.toUpperCase()}</div>
              <div className="news-item-content">
                <a href={item.url} className="news-item-title" target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                <div className="news-item-meta">
                  <span className="news-source">{item.source}</span>
                  <span className="news-time">{Math.floor((Date.now() - item.timestamp) / 3600000)}小时前</span>
                </div>
              </div>
              <ChevronRight size={14} className="news-item-arrow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 天气卡片
function WeatherCard({ data }: { data: WeatherData }) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981'
    if (aqi <= 100) return '#f59e0b'
    if (aqi <= 150) return '#f97316'
    return '#ef4444'
  }
  
  return (
    <div className="info-card info-card-weather">
      <div className="info-card-header">
        <Cloud size={16} />
        <span>天气状况</span>
      </div>
      <div className="info-card-content">
        <div className="weather-main">
          <div className="weather-temp">{data.temp}°</div>
          <div className="weather-condition">{data.condition}</div>
          <div className="weather-location">{data.location}</div>
        </div>
        <div className="weather-details">
          <div className="weather-detail-item">
            <span className="detail-label">湿度</span>
            <span className="detail-value">{data.humidity}%</span>
          </div>
          <div className="weather-detail-item">
            <span className="detail-label">AQI</span>
            <span className="detail-value" style={{ color: getAQIColor(data.airQuality) }}>
              {data.airQuality}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 世界时钟卡片
function WorldClocksCard() {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  const zones = [
    { city: '北京', offset: 8, code: 'CST' },
    { city: '东京', offset: 9, code: 'JST' },
    { city: '伦敦', offset: 0, code: 'GMT' },
    { city: '纽约', offset: -5, code: 'EST' },
    { city: '洛杉矶', offset: -8, code: 'PST' },
    { city: '悉尼', offset: 11, code: 'AEDT' },
  ]
  
  return (
    <div className="info-card info-card-clocks">
      <div className="info-card-header">
        <Clock size={16} />
        <span>世界时钟</span>
      </div>
      <div className="info-card-content">
        <div className="world-clocks">
          {zones.map((zone) => {
            const hour = (time.getUTCHours() + zone.offset + 24) % 24
            const minute = time.getMinutes()
            const second = time.getSeconds()
            return (
              <div key={zone.code} className="world-clock-item">
                <div className="world-clock-city">{zone.city}</div>
                <div className="world-clock-time">
                  {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                  <span className="world-clock-seconds">:{second.toString().padStart(2, '0')}</span>
                </div>
                <div className="world-clock-code">{zone.code}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 加密货币卡片
function CryptoCard({ data }: { data: CryptoData[] }) {
  return (
    <div className="info-card info-card-crypto">
      <div className="info-card-header">
        <TrendingUp size={16} />
        <span>加密货币</span>
      </div>
      <div className="info-card-content">
        <div className="crypto-list">
          {data.map((coin) => (
            <div key={coin.symbol} className="crypto-item">
              <div className="crypto-symbol">{coin.symbol}</div>
              <div className="crypto-name">{coin.name}</div>
              <div className="crypto-price">
                ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`crypto-change ${coin.change24h >= 0 ? 'positive' : 'negative'}`}>
                {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// GitHub热门卡片
function GitHubTrendingCard() {
  const repos = [
    { name: 'microsoft/typescript', stars: '98.2k', lang: 'TypeScript', desc: 'TypeScript is a superset of JavaScript' },
    { name: 'vercel/next.js', stars: '125k', lang: 'JavaScript', desc: 'The React Framework for Production' },
    { name: 'facebook/react', stars: '226k', lang: 'JavaScript', desc: 'A JavaScript library for building UIs' },
  ]
  
  return (
    <div className="info-card info-card-trending">
      <div className="info-card-header">
        <Activity size={16} />
        <span>GitHub 热门</span>
      </div>
      <div className="info-card-content">
        <div className="trending-list">
          {repos.map((repo, i) => (
            <div key={repo.name} className="trending-item">
              <div className="trending-rank">#{i + 1}</div>
              <div className="trending-info">
                <a href={`https://github.com/${repo.name}`} className="trending-name" target="_blank" rel="noopener noreferrer">
                  {repo.name}
                  <ExternalLink size={10} />
                </a>
                <div className="trending-desc">{repo.desc}</div>
                <div className="trending-meta">
                  <span className="trending-lang">{repo.lang}</span>
                  <span className="trending-stars">★ {repo.stars}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InfoPulseCenter() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [crypto, setCrypto] = useState<CryptoData[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const cardConfigs = CARD_CONFIGS
  
  const refreshData = useCallback(() => {
    setLoading(true)
    
    // 模拟数据加载
    setTimeout(() => {
      setNews(generateMockData.news())
      setWeather(generateMockData.weather())
      setCrypto(generateMockData.crypto())
      setSystemHealth(generateMockData.systemHealth())
      setLoading(false)
      setLastUpdate(new Date())
    }, 500)
  }, [])
  
  useEffect(() => {
    refreshData()
  }, [refreshData])
  
  useEffect(() => {
    const timer = setInterval(refreshData, 60000) // 每分钟刷新
    return () => clearInterval(timer)
  }, [refreshData])
  
  const enabledCards = useMemo(() => {
    return cardConfigs
      .filter(c => c.enabled)
      .sort((a, b) => a.order - b.order)
  }, [cardConfigs])
  
  const renderCard = (config: CardConfig) => {
    switch (config.type) {
      case 'system':
        return systemHealth && <SystemHealthCard data={systemHealth} />
      case 'news':
        return <NewsCard news={news} />
      case 'weather':
        return weather && <WeatherCard data={weather} />
      case 'crypto':
        return <CryptoCard data={crypto} />
      case 'clocks':
        return <WorldClocksCard />
      case 'trending':
        return <GitHubTrendingCard />
      default:
        return null
    }
  }
  
  return (
    <div className="info-pulse-center">
      <div className="info-pulse-header">
        <div className="header-title">
          <Zap size={20} className="header-icon" />
          <h1>InfoPulse 信息脉搏</h1>
        </div>
        <div className="header-actions">
          <div className="last-update">
            <Clock size={12} />
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
          <button 
            className={`refresh-btn ${loading ? 'loading' : ''}`} 
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw size={14} />
            <span>刷新</span>
          </button>
          <button className="settings-btn">
            <Settings size={14} />
          </button>
        </div>
      </div>
      
      <div className="info-pulse-grid">
        {enabledCards.map((config) => (
          <div key={config.id} className={`card-wrapper card-${config.size}`}>
            {renderCard(config)}
          </div>
        ))}
      </div>
      
      <style>{`
        .info-pulse-center {
          height: 100%;
          background: var(--app-bg);
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .info-pulse-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--window-border);
          background: var(--card-bg);
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .header-title h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, var(--accent) 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .header-icon {
          color: var(--accent);
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .last-update {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .refresh-btn, .settings-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--window-border);
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .refresh-btn:hover, .settings-btn:hover {
          border-color: var(--accent);
          background: var(--accent-bg);
        }
        
        .refresh-btn.loading svg {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .info-pulse-grid {
          flex: 1;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(200px, auto);
          gap: 16px;
          overflow-y: auto;
        }
        
        .card-wrapper {
          min-width: 0;
        }
        
        .card-small {
          grid-column: span 1;
        }
        
        .card-medium {
          grid-column: span 1;
        }
        
        .card-large {
          grid-column: span 2;
        }
        
        .info-card {
          height: 100%;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        
        .info-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
        }
        
        .info-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--card-border);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .info-card-header svg {
          color: var(--accent);
        }
        
        .card-expand-btn {
          margin-left: auto;
          padding: 4px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .card-expand-btn:hover {
          background: var(--window-border);
          color: var(--text-primary);
        }
        
        .info-card-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }
        
        /* System Health Card */
        .health-score-ring {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 20px;
        }
        
        .health-ring-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        
        .health-ring-progress {
          transition: stroke-dasharray 0.5s ease;
        }
        
        .health-score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 32px;
          font-weight: 700;
        }
        
        .health-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .health-metric {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .metric-label {
          width: 40px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .metric-bar {
          flex: 1;
          height: 6px;
          background: var(--window-border);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .metric-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent) 0%, #06b6d4 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .metric-value {
          width: 36px;
          font-size: 11px;
          text-align: right;
          font-weight: 500;
        }
        
        .network-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .network-excellent { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .network-good { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .network-fair { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .network-poor { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        /* News Card */
        .news-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .news-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: var(--window-bg);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          animation: fadeInUp 0.3s ease backwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .news-item:hover {
          background: var(--card-bg);
          transform: translateX(4px);
        }
        
        .news-item-category {
          font-size: 9px;
          font-weight: 600;
          color: var(--accent);
          padding: 2px 6px;
          background: var(--accent-bg);
          border-radius: 4px;
        }
        
        .news-item-content {
          flex: 1;
          min-width: 0;
        }
        
        .news-item-title {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
          text-decoration: none;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        
        .news-item-title:hover {
          color: var(--accent);
        }
        
        .news-item-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .news-item-arrow {
          color: var(--text-secondary);
          transition: transform 0.2s;
        }
        
        .news-item:hover .news-item-arrow {
          transform: translateX(4px);
          color: var(--accent);
        }
        
        /* Weather Card */
        .weather-main {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .weather-temp {
          font-size: 48px;
          font-weight: 300;
          line-height: 1;
        }
        
        .weather-condition {
          font-size: 16px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        
        .weather-location {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        
        .weather-details {
          display: flex;
          justify-content: space-around;
          padding-top: 16px;
          border-top: 1px solid var(--card-border);
        }
        
        .weather-detail-item {
          text-align: center;
        }
        
        .detail-label {
          display: block;
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .detail-value {
          display: block;
          font-size: 18px;
          font-weight: 500;
          margin-top: 4px;
        }
        
        /* World Clocks Card */
        .world-clocks {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .world-clock-item {
          text-align: center;
          padding: 8px;
          background: var(--window-bg);
          border-radius: 6px;
        }
        
        .world-clock-city {
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .world-clock-time {
          font-size: 16px;
          font-weight: 500;
          margin: 4px 0;
          font-variant-numeric: tabular-nums;
        }
        
        .world-clock-seconds {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .world-clock-code {
          font-size: 10px;
          color: var(--accent);
        }
        
        /* Crypto Card */
        .crypto-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .crypto-item {
          display: grid;
          grid-template-columns: 50px 1fr auto auto;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: var(--window-bg);
          border-radius: 6px;
        }
        
        .crypto-symbol {
          font-weight: 600;
          color: var(--accent);
        }
        
        .crypto-name {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .crypto-price {
          font-weight: 500;
        }
        
        .crypto-change {
          font-size: 12px;
          font-weight: 500;
        }
        
        .crypto-change.positive { color: #10b981; }
        .crypto-change.negative { color: #ef4444; }
        
        /* Trending Card */
        .trending-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .trending-item {
          display: flex;
          gap: 12px;
          padding: 8px;
          background: var(--window-bg);
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .trending-item:hover {
          background: var(--card-bg);
        }
        
        .trending-rank {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-bg);
          color: var(--accent);
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .trending-info {
          flex: 1;
          min-width: 0;
        }
        
        .trending-name {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--accent);
          text-decoration: none;
        }
        
        .trending-name:hover {
          text-decoration: underline;
        }
        
        .trending-desc {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .trending-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
        }
        
        .trending-lang {
          color: var(--text-secondary);
        }
        
        .trending-stars {
          color: #f59e0b;
        }
      `}</style>
    </div>
  )
}