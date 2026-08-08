import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  Search, Copy, Check, ExternalLink, RefreshCw,
  Globe, Cloud, DollarSign, Newspaper, Zap,
  TrendingUp, Star, Users,
  ChevronRight, Download, History,
  Code, Hash, Link2, QrCode
} from 'lucide-react'

type TabType = 'weather' | 'exchange' | 'news' | 'github' | 'qr' | 'translate' | 'hash' | 'url'

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
  location: string
}

interface ExchangeRate {
  code: string
  name: string
  rate: number
  change: number
}

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  urlToImage?: string
}

interface GitHubTrending {
  name: string
  description: string
  stars: number
  forks: number
  language: string
  url: string
}

const TABS: { id: TabType; label: string; icon: typeof Globe }[] = [
  { id: 'weather', label: '天气', icon: Cloud },
  { id: 'exchange', label: '汇率', icon: DollarSign },
  { id: 'news', label: '新闻', icon: Newspaper },
  { id: 'github', label: 'GitHub热', icon: Code },
  { id: 'qr', label: '二维码', icon: QrCode },
  { id: 'translate', label: '翻译', icon: Globe },
  { id: 'hash', label: '哈希', icon: Hash },
  { id: 'url', label: '短链', icon: Link2 },
]

const PopularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'KRW']

export default memo(function OnlineToolkitPro() {
  const [activeTab, setActiveTab] = useState<TabType>('weather')
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case 'weather':
        return <WeatherPanel copyToClipboard={copyToClipboard} copied={copied} />
      case 'exchange':
        return <ExchangePanel copyToClipboard={copyToClipboard} copied={copied} />
      case 'news':
        return <NewsPanel copyToClipboard={copyToClipboard} copied={copied} />
      case 'github':
        return <GitHubPanel copyToClipboard={copyToClipboard} copied={copied} />
      case 'qr':
        return <QRPanel />
      case 'translate':
        return <TranslatePanel copyToClipboard={copyToClipboard} copied={copied} />
      case 'hash':
        return <HashPanel copyToClipboard={copyToClipboard} copied={copied} />
      case 'url':
        return <URLPanel copyToClipboard={copyToClipboard} copied={copied} />
      default:
        return null
    }
  }

  return (
    <div className="online-toolkit-pro">
      <div className="otp-header">
        <div className="otp-header-left">
          <Zap size={24} className="otp-logo" />
          <div>
            <h2>在线工具箱 Pro</h2>
            <p className="otp-subtitle">集成真实公共API的实用工具集</p>
          </div>
        </div>
        <div className="otp-header-right">
          <span className="otp-version">v67.0</span>
        </div>
      </div>

      <div className="otp-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`otp-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="otp-content">
        {renderTab()}
      </div>

      <style>{`
        .online-toolkit-pro {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
          color: #e0e0e0;
          overflow: hidden;
        }
        .otp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .otp-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .otp-logo {
          color: #00d4ff;
          filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
        }
        .otp-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          background: linear-gradient(90deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .otp-subtitle {
          margin: 2px 0 0;
          font-size: 12px;
          color: #888;
        }
        .otp-version {
          font-size: 12px;
          color: #666;
          padding: 4px 8px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 4px;
        }
        .otp-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          overflow-x: auto;
        }
        .otp-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #888;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .otp-tab:hover {
          background: rgba(255,255,255,0.05);
          color: #ccc;
        }
        .otp-tab.active {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(124, 58, 237, 0.2));
          border-color: rgba(0, 212, 255, 0.3);
          color: #00d4ff;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
        }
        .otp-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .otp-content::-webkit-scrollbar {
          width: 8px;
        }
        .otp-content::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .otp-content::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 4px;
        }
        .otp-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </div>
  )
})

/* ============ Weather Panel ============ */
function WeatherPanel({ copyToClipboard, copied }: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [city, setCity] = useState('Shanghai')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const fetchWeather = useCallback(async (cityName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(cityName)}?format=j1`)
      if (!response.ok) throw new Error('City not found')
      const data = await response.json()
      const current = data.current_condition[0]
      const weatherData: WeatherData = {
        temp: parseInt(current.temp_C),
        feelsLike: parseInt(current.FeelsLikeC),
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
        description: current.lang_zh?.[0]?.value || current.weatherDesc[0].value,
        icon: current.weatherDesc[0].value.toLowerCase().includes('sun') ? '☀️' : 
              current.weatherDesc[0].value.toLowerCase().includes('rain') ? '🌧️' :
              current.weatherDesc[0].value.toLowerCase().includes('cloud') ? '☁️' : '⛅',
        location: data.nearest_area[0].areaName[0].value,
      }
      setWeather(weatherData)
      setHistory(prev => [cityName, ...prev.filter(c => c !== cityName)].slice(0, 5))
    } catch (err) {
      setError('无法获取天气数据，请检查城市名称')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWeather(city)
  }, [])

  return (
    <div className="weather-panel">
      <div className="panel-section">
        <h3><Cloud size={18} /> 天气查询</h3>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWeather(city)}
            placeholder="输入城市名称（英文或中文）"
          />
          <button onClick={() => fetchWeather(city)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
        {history.length > 0 && (
          <div className="history-chips">
            <span>历史:</span>
            {history.map((c, i) => (
              <button key={i} onClick={() => { setCity(c); fetchWeather(c) }} className="chip">{c}</button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {weather && (
        <div className="weather-card">
          <div className="weather-main">
            <span className="weather-icon">{weather.icon}</span>
            <div>
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-desc">{weather.description}</div>
            </div>
          </div>
          <div className="weather-details">
            <div className="detail-item">
              <span>体感温度</span>
              <strong>{weather.feelsLike}°C</strong>
            </div>
            <div className="detail-item">
              <span>湿度</span>
              <strong>{weather.humidity}%</strong>
            </div>
            <div className="detail-item">
              <span>风速</span>
              <strong>{weather.windSpeed} km/h</strong>
            </div>
            <div className="detail-item">
              <span>位置</span>
              <strong>{weather.location}</strong>
            </div>
          </div>
          <button className="copy-btn" onClick={() => copyToClipboard(`${weather.location}: ${weather.temp}°C, ${weather.description}`, 'weather')}>
            {copied === 'weather' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'weather' ? '已复制' : '复制信息'}
          </button>
        </div>
      )}

      <style>{`
        .weather-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .search-box { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 8px 16px; }
        .search-box input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 14px; }
        .search-box input::placeholder { color: #666; }
        .search-box button { background: rgba(0, 212, 255, 0.2); border: none; color: #00d4ff; border-radius: 6px; padding: 6px; cursor: pointer; display: flex; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .history-chips { display: flex; align-items: center; gap: 8px; margin-top: 12px; flex-wrap: wrap; font-size: 12px; color: #888; }
        .chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px 12px; color: #ccc; cursor: pointer; }
        .chip:hover { background: rgba(0, 212, 255, 0.1); border-color: rgba(0, 212, 255, 0.3); }
        .error-msg { background: rgba(255, 50, 50, 0.2); color: #ff6b6b; padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255, 50, 50, 0.3); }
        .weather-card { background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(124, 58, 237, 0.1)); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 16px; padding: 24px; }
        .weather-main { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .weather-icon { font-size: 64px; }
        .weather-temp { font-size: 48px; font-weight: 700; background: linear-gradient(90deg, #00d4ff, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .weather-desc { font-size: 16px; color: #ccc; }
        .weather-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .detail-item { display: flex; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px; }
        .detail-item span { color: #888; font-size: 13px; }
        .detail-item strong { color: #fff; font-weight: 600; }
        .copy-btn { display: flex; align-items: center; gap: 6px; margin-top: 16px; background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .copy-btn:hover { background: rgba(0, 212, 255, 0.25); }
      `}</style>
    </div>
  )
}

/* ============ Exchange Panel ============ */
function ExchangePanel({ copyToClipboard, copied }: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('100')

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`)
      const data = await response.json()
      if (data.result === 'success') {
        const currencies = PopularCurrencies.filter(c => c !== baseCurrency)
        const newRates: ExchangeRate[] = currencies.map(code => ({
          code,
          name: getCurrencyName(code),
          rate: data.rates[code] || 0,
          change: 0,
        }))
        setRates(newRates)
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err)
    }
    setLoading(false)
  }, [baseCurrency])

  useEffect(() => {
    fetchRates()
  }, [baseCurrency])

  const getCurrencyName = (code: string): string => {
    const names: Record<string, string> = {
      USD: '美元', EUR: '欧元', GBP: '英镑', JPY: '日元', AUD: '澳元',
      CAD: '加元', CHF: '瑞郎', HKD: '港币', SGD: '新元', KRW: '韩元',
      CNY: '人民币', NZD: '纽元', INR: '卢比',
    }
    return names[code] || code
  }

  const convertAmount = (rate: number) => {
    const n = parseFloat(amount) || 0
    return (n * rate).toFixed(2)
  }

  return (
    <div className="exchange-panel">
      <div className="panel-section">
        <h3><DollarSign size={18} /> 实时汇率</h3>
        <div className="exchange-controls">
          <div className="amount-input">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="amount-field"
            />
            <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
              {PopularCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchRates} disabled={loading} className="refresh-btn">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      <div className="rates-list">
        {rates.map(rate => (
          <div key={rate.code} className="rate-row">
            <div className="rate-info">
              <span className="rate-code">{rate.code}</span>
              <span className="rate-name">{rate.name}</span>
            </div>
            <div className="rate-values">
              <span className="rate-amount">{convertAmount(rate.rate)}</span>
              <span className="rate-rate">1 {baseCurrency} = {rate.rate.toFixed(4)} {rate.code}</span>
            </div>
            <button
              className="copy-mini"
              onClick={() => copyToClipboard(convertAmount(rate.rate), `rate-${rate.code}`)}
            >
              {copied === `rate-${rate.code}` ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .exchange-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .exchange-controls { display: flex; gap: 12px; align-items: center; }
        .amount-input { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 12px; }
        .amount-field { width: 100px; background: transparent; border: none; color: white; outline: none; font-size: 16px; font-weight: 600; }
        .amount-field::-webkit-outer-spin-button, .amount-field::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .amount-input select { background: transparent; border: none; color: #00d4ff; outline: none; font-size: 14px; cursor: pointer; }
        .refresh-btn { display: flex; align-items: center; gap: 6px; background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .refresh-btn:hover { background: rgba(0, 212, 255, 0.25); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rates-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .rate-row { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px; transition: all 0.2s; }
        .rate-row:hover { background: rgba(0, 212, 255, 0.05); border-color: rgba(0, 212, 255, 0.2); }
        .rate-info { display: flex; align-items: center; gap: 10px; }
        .rate-code { font-weight: 700; color: #00d4ff; font-size: 16px; }
        .rate-name { color: #888; font-size: 13px; }
        .rate-values { text-align: right; }
        .rate-amount { display: block; font-size: 18px; font-weight: 600; color: white; }
        .rate-rate { display: block; font-size: 11px; color: #666; margin-top: 2px; }
        .copy-mini { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 6px; padding: 6px; cursor: pointer; display: flex; }
        .copy-mini:hover { color: #00d4ff; border-color: rgba(0, 212, 255, 0.3); }
      `}</style>
    </div>
  )
}

/* ============ News Panel ============ */
function NewsPanel({ copyToClipboard }: { copyToClipboard: (text: string, id: string) => void; copied: string | null; _loading?: boolean }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [, setLoading] = useState(false)
  const [category, setCategory] = useState('technology')

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=demo`)
      const data = await response.json()
      if (data.articles) {
        setNews(data.articles.slice(0, 12).map((article: NewsItem) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt,
          urlToImage: article.urlToImage,
        })))
      }
    } catch (err) {
      setNews(getMockNews(category))
    }
    setLoading(false)
  }, [category])

  useEffect(() => {
    fetchNews()
  }, [category])

  const getMockNews = (cat: string): NewsItem[] => {
    const mockData: Record<string, NewsItem[]> = {
      technology: [
        { title: 'AI Revolution: New Models Reshape Industries', description: 'Latest breakthroughs in artificial intelligence are transforming how businesses operate.', url: '#', source: 'Tech Daily', publishedAt: new Date().toISOString() },
        { title: 'Quantum Computing Breakthrough', description: 'Researchers achieve new milestone in quantum error correction.', url: '#', source: 'Science Today', publishedAt: new Date().toISOString() },
        { title: 'Open Source Movement Thrives', description: 'Community-driven development continues to innovate across the tech landscape.', url: '#', source: 'Dev Weekly', publishedAt: new Date().toISOString() },
      ],
      business: [
        { title: 'Global Markets Rally', description: 'Stock markets worldwide respond positively to economic indicators.', url: '#', source: 'Business News', publishedAt: new Date().toISOString() },
        { title: 'Startup Ecosystem Booms', description: 'Venture capital funding reaches new heights in emerging markets.', url: '#', source: 'Startup Hub', publishedAt: new Date().toISOString() },
      ],
      science: [
        { title: 'Space Exploration Milestone', description: 'New telescope discoveries reveal distant galaxy clusters.', url: '#', source: 'Space Today', publishedAt: new Date().toISOString() },
        { title: 'Climate Research Advances', description: 'Scientists develop new models for predicting climate patterns.', url: '#', source: 'Climate Watch', publishedAt: new Date().toISOString() },
      ],
    }
    return mockData[cat] || mockData.technology
  }

  const categories = ['technology', 'business', 'science', 'health', 'sports']

  return (
    <div className="news-panel">
      <div className="panel-section">
        <h3><Newspaper size={18} /> 新闻中心</h3>
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="news-grid">
        {news.map((item, i) => (
          <div key={i} className="news-card">
            <div className="news-source">{item.source}</div>
            <h4 className="news-title">{item.title}</h4>
            <p className="news-desc">{item.description}</p>
            <div className="news-footer">
              <span className="news-time">{new Date(item.publishedAt).toLocaleString('zh-CN')}</span>
              <div className="news-actions">
                <button onClick={() => copyToClipboard(`${item.title}\n${item.description}`, `news-${i}`)}>
                  <Copy size={14} />
                </button>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .news-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .category-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .cat-tab { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 6px 14px; color: #888; cursor: pointer; font-size: 12px; text-transform: capitalize; }
        .cat-tab:hover { color: #ccc; }
        .cat-tab.active { background: rgba(0, 212, 255, 0.15); border-color: rgba(0, 212, 255, 0.3); color: #00d4ff; }
        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .news-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; transition: all 0.2s; cursor: pointer; }
        .news-card:hover { background: rgba(0, 212, 255, 0.05); border-color: rgba(0, 212, 255, 0.2); transform: translateY(-2px); }
        .news-source { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .news-title { font-size: 15px; font-weight: 600; margin: 8px 0; color: white; line-height: 1.4; }
        .news-desc { font-size: 13px; color: #888; margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .news-footer { display: flex; justify-content: space-between; align-items: center; }
        .news-time { font-size: 11px; color: #666; }
        .news-actions { display: flex; gap: 8px; }
        .news-actions button, .news-actions a { background: transparent; border: none; color: #888; cursor: pointer; display: flex; padding: 4px; border-radius: 4px; }
        .news-actions button:hover, .news-actions a:hover { color: #00d4ff; background: rgba(0, 212, 255, 0.1); }
      `}</style>
    </div>
  )
}

/* ============ GitHub Panel ============ */
function GitHubPanel({ copyToClipboard }: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [repos, setRepos] = useState<GitHubTrending[]>([])
  const [, setLoading] = useState(false)
  const [language, setLanguage] = useState('javascript')

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://api.github.com/search/repositories?q=stars:>1000+language:${language}&sort=stars&order=desc&per_page=15`)
      const data = await response.json()
      if (data.items) {
        setRepos(data.items.map((item: { name: string; full_name: string; description: string; stargazers_count: number; forks_count: number; language: string; html_url: string }) => ({
          name: item.name,
          description: item.description || 'No description',
          stars: item.stargazers_count,
          forks: item.forks_count,
          language: item.language || 'Unknown',
          url: item.html_url,
        })))
      }
    } catch (err) {
      console.error('Failed to fetch GitHub repos:', err)
    }
    setLoading(false)
  }, [language])

  useEffect(() => {
    fetchTrending()
  }, [language])

  const languages = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'react']

  const getLangColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: '#f1e05a', typescript: '#3178c6', python: '#3572A5',
      rust: '#dea584', go: '#00ADD8', java: '#b07219', react: '#61dafb',
    }
    return colors[lang.toLowerCase()] || '#888'
  }

  return (
    <div className="github-panel">
      <div className="panel-section">
        <h3><TrendingUp size={18} /> GitHub 热门项目</h3>
        <div className="lang-tabs">
          {languages.map(lang => (
            <button
              key={lang}
              className={`lang-tab ${language === lang ? 'active' : ''}`}
              onClick={() => setLanguage(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="repos-list">
        {repos.map((repo, i) => (
          <div key={i} className="repo-card">
            <div className="repo-header">
              <h4 className="repo-name">{repo.name}</h4>
              <div className="repo-stats">
                <span className="stat-item"><Star size={12} /> {repo.stars.toLocaleString()}</span>
                <span className="stat-item"><Users size={12} /> {repo.forks.toLocaleString()}</span>
              </div>
            </div>
            <p className="repo-desc">{repo.description}</p>
            <div className="repo-footer">
              <div className="repo-language">
                <span className="lang-dot" style={{ backgroundColor: getLangColor(repo.language) }}></span>
                {repo.language}
              </div>
              <div className="repo-actions">
                <button onClick={() => copyToClipboard(repo.url, `repo-${i}`)}>
                  <Copy size={12} />
                </button>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="repo-link">
                  <ExternalLink size={12} /> 访问
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .github-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .lang-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .lang-tab { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 5px 12px; color: #888; cursor: pointer; font-size: 12px; text-transform: capitalize; }
        .lang-tab:hover { color: #ccc; }
        .lang-tab.active { background: rgba(0, 212, 255, 0.15); border-color: rgba(0, 212, 255, 0.3); color: #00d4ff; }
        .repos-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .repo-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; transition: all 0.2s; }
        .repo-card:hover { background: rgba(0, 212, 255, 0.05); border-color: rgba(0, 212, 255, 0.2); transform: translateY(-2px); }
        .repo-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .repo-name { font-size: 15px; font-weight: 600; margin: 0; color: #00d4ff; }
        .repo-stats { display: flex; gap: 12px; }
        .stat-item { display: flex; align-items: center; gap: 4px; color: #888; font-size: 12px; }
        .repo-desc { font-size: 13px; color: #aaa; margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .repo-footer { display: flex; justify-content: space-between; align-items: center; }
        .repo-language { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #888; }
        .lang-dot { width: 10px; height: 10px; border-radius: 50%; }
        .repo-actions { display: flex; gap: 8px; align-items: center; }
        .repo-actions button { background: transparent; border: none; color: #888; cursor: pointer; display: flex; padding: 4px; border-radius: 4px; }
        .repo-actions button:hover { color: #00d4ff; background: rgba(0, 212, 255, 0.1); }
        .repo-link { display: flex; align-items: center; gap: 4px; color: #00d4ff; font-size: 12px; text-decoration: none; }
        .repo-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

/* ============ QR Code Panel ============ */
function QRPanel() {
  const [text, setText] = useState('https://github.com/saya-ch/WebLinuxOS')
  const [qrSize, setQrSize] = useState(256)

  const qrUrl = useMemo(() => {
    const encoded = encodeURIComponent(text)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encoded}&bgcolor=ffffff&color=000000&margin=10`
  }, [text, qrSize])

  return (
    <div className="qr-panel">
      <div className="panel-section">
        <h3><QrCode size={18} /> 二维码生成器</h3>
        <div className="qr-input-area">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入文本或URL生成二维码..."
            rows={4}
          />
          <div className="qr-size-control">
            <span>尺寸:</span>
            <input type="range" min="128" max="512" step="64" value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} />
            <span>{qrSize}px</span>
          </div>
        </div>
      </div>

      <div className="qr-display">
        <div className="qr-container">
          <img src={qrUrl} alt="QR Code" className="qr-image" />
          <a href={qrUrl} download="qrcode.png" className="qr-download">
            <Download size={14} /> 下载二维码
          </a>
        </div>
      </div>

      <style>{`
        .qr-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .qr-input-area { display: flex; flex-direction: column; gap: 12px; }
        .qr-input-area textarea { width: 100%; min-height: 80px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; color: white; font-size: 14px; resize: vertical; outline: none; font-family: monospace; }
        .qr-input-area textarea:focus { border-color: rgba(0, 212, 255, 0.3); }
        .qr-size-control { display: flex; align-items: center; gap: 12px; color: #888; font-size: 13px; }
        .qr-size-control input[type="range"] { flex: 1; accent-color: #00d4ff; }
        .qr-display { display: flex; justify-content: center; padding: 24px; }
        .qr-container { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .qr-image { background: white; padding: 16px; border-radius: 12px; box-shadow: 0 0 40px rgba(0, 212, 255, 0.2); }
        .qr-download { display: flex; align-items: center; gap: 6px; background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; }
        .qr-download:hover { background: rgba(0, 212, 255, 0.25); }
      `}</style>
    </div>
  )
}

/* ============ Translate Panel ============ */
function TranslatePanel({ copyToClipboard, copied }: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [inputText, setInputText] = useState('Hello, World!')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('zh')
  const [translated, setTranslated] = useState('')
  const [loading, setLoading] = useState(false)

  const translate = useCallback(async () => {
    if (!inputText.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${sourceLang}|${targetLang}`)
      const data = await response.json()
      if (data.responseData) {
        setTranslated(data.responseData.translatedText)
      }
    } catch (err) {
      setTranslated('翻译服务暂时不可用')
    }
    setLoading(false)
  }, [inputText, sourceLang, targetLang])

  useEffect(() => {
    const timer = setTimeout(translate, 500)
    return () => clearTimeout(timer)
  }, [translate])

  const languages = [
    { code: 'en', name: '英语' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' },
  ]

  const getLangName = (code: string) => languages.find(l => l.code === code)?.name || code

  return (
    <div className="translate-panel">
      <div className="panel-section">
        <h3><Globe size={18} /> 实时翻译</h3>
        <div className="lang-selectors">
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {languages.map(l => <option key={l.code} value={l.code}>{getLangName(l.code)}</option>)}
          </select>
          <button onClick={() => { const s = sourceLang; setSourceLang(targetLang); setTargetLang(s); setInputText(translated); setTranslated(inputText) }}>
            <RefreshCw size={16} />
          </button>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {languages.map(l => <option key={l.code} value={l.code}>{getLangName(l.code)}</option>)}
          </select>
        </div>
      </div>

      <div className="translate-boxes">
        <div className="translate-box">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入要翻译的文本..."
            rows={4}
          />
          <span className="char-count">{inputText.length}</span>
        </div>
        <div className="translate-box output">
          <textarea
            value={translated}
            readOnly
            placeholder={loading ? '翻译中...' : '翻译结果将显示在这里'}
            rows={4}
          />
          <button
            className="copy-btn-sm"
            onClick={() => copyToClipboard(translated, 'translate')}
            disabled={!translated}
          >
            {copied === 'translate' ? '✓ 已复制' : '复制'}
          </button>
        </div>
      </div>

      <style>{`
        .translate-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .lang-selectors { display: flex; gap: 12px; align-items: center; }
        .lang-selectors select { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; color: white; outline: none; font-size: 14px; }
        .lang-selectors button { background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .lang-selectors button:hover { background: rgba(0, 212, 255, 0.25); }
        .translate-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .translate-box { position: relative; }
        .translate-box textarea { width: 100%; min-height: 120px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; color: white; font-size: 14px; resize: none; outline: none; }
        .translate-box textarea:focus { border-color: rgba(0, 212, 255, 0.3); }
        .translate-box.output textarea { background: rgba(0, 212, 255, 0.05); }
        .char-count { position: absolute; bottom: 8px; right: 12px; font-size: 11px; color: #666; }
        .copy-btn-sm { position: absolute; bottom: 8px; right: 12px; background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; }
        .copy-btn-sm:hover:not(:disabled) { background: rgba(0, 212, 255, 0.25); }
        .copy-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}

/* ============ Hash Panel ============ */
function HashPanel({ copyToClipboard, copied }: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [hashes, setHashes] = useState<Record<string, string>>({})

  const generateHashes = useCallback(async () => {
    if (!input) { setHashes({}); return }
    const encoder = new TextEncoder()
    const data = encoder.encode(input)

    try {
      const [md5, sha1, sha256, sha512] = await Promise.all([
        computeHash(data, 'MD5'),
        computeHash(data, 'SHA-1'),
        computeHash(data, 'SHA-256'),
        computeHash(data, 'SHA-512'),
      ])
      setHashes({ md5, sha1, sha256, sha512 })
    } catch (err) {
      setHashes({ error: 'Hash computation failed' })
    }
  }, [input])

  const computeHash = async (data: Uint8Array, algo: string): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest(algo, data.buffer as ArrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  useEffect(() => {
    generateHashes()
  }, [generateHashes])

  const hashTypes = [
    { key: 'md5', label: 'MD5', color: '#ff6b6b' },
    { key: 'sha1', label: 'SHA-1', color: '#ffa500' },
    { key: 'sha256', label: 'SHA-256', color: '#00d4ff' },
    { key: 'sha512', label: 'SHA-512', color: '#7c3aed' },
  ]

  return (
    <div className="hash-panel">
      <div className="panel-section">
        <h3><Hash size={18} /> 哈希生成器</h3>
        <div className="hash-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入文本生成哈希值..."
            rows={3}
          />
        </div>
      </div>

      <div className="hash-results">
        {hashTypes.map(({ key, label, color }) => (
          <div key={key} className="hash-result-row">
            <div className="hash-label" style={{ borderColor: color, color }}>{label}</div>
            <div className="hash-value">{hashes[key] || '...'}</div>
            <button
              className="copy-btn-hash"
              onClick={() => copyToClipboard(hashes[key] || '', `hash-${key}`)}
              disabled={!hashes[key]}
            >
              {copied === `hash-${key}` ? <span>✓</span> : <Copy size={12} />}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .hash-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .hash-input textarea { width: 100%; min-height: 80px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; color: white; font-size: 14px; resize: vertical; outline: none; font-family: monospace; }
        .hash-input textarea:focus { border-color: rgba(0, 212, 255, 0.3); }
        .hash-results { display: flex; flex-direction: column; gap: 12px; }
        .hash-result-row { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; }
        .hash-label { font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid; white-space: nowrap; }
        .hash-value { flex: 1; font-family: monospace; font-size: 12px; color: #ccc; word-break: break-all; }
        .copy-btn-hash { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 6px; padding: 6px; cursor: pointer; display: flex; }
        .copy-btn-hash:hover:not(:disabled) { color: #00d4ff; border-color: rgba(0, 212, 255, 0.3); }
        .copy-btn-hash:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>
    </div>
  )
}

/* ============ URL Shortener Panel ============ */
function URLPanel({ copyToClipboard, copied }: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [longUrl, setLongUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ long: string; short: string; time: string }[]>([])

  const shorten = useCallback(async () => {
    if (!longUrl.trim()) return
    setLoading(true)
    setShortUrl('')
    try {
      const response = await fetch(`https://api.is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`)
      if (response.ok) {
        const short = await response.text()
        setShortUrl(short.trim())
        setHistory(prev => [{ long: longUrl, short: short.trim(), time: new Date().toLocaleString('zh-CN') }, ...prev].slice(0, 10))
      } else {
        setShortUrl('缩短失败，请检查URL格式')
      }
    } catch (err) {
      setShortUrl('服务暂时不可用')
    }
    setLoading(false)
  }, [longUrl])

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="url-panel">
      <div className="panel-section">
        <h3><Link2 size={18} /> URL 短链生成</h3>
        <div className="url-input-area">
          <input
            type="url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="输入完整URL..."
            onKeyDown={(e) => e.key === 'Enter' && isValidUrl(longUrl) && shorten()}
          />
          <button
            onClick={shorten}
            disabled={loading || !isValidUrl(longUrl)}
          >
            {loading ? '处理中...' : '缩短'}
          </button>
        </div>
      </div>

      {shortUrl && (
        <div className="short-url-result">
          <div className="result-label">短链结果:</div>
          <div className="result-url">{shortUrl}</div>
          <div className="result-actions">
            <button onClick={() => copyToClipboard(shortUrl, 'short-url')}>
              {copied === 'short-url' ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 复制</>}
            </button>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> 访问
            </a>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h4><History size={14} /> 历史记录</h4>
          <div className="history-list">
            {history.map((item, i) => (
              <div key={i} className="history-item">
                <div className="history-urls">
                  <span className="long-url" title={item.long}>{item.long}</span>
                  <ChevronRight size={14} />
                  <span className="short-url">{item.short}</span>
                </div>
                <div className="history-meta">
                  <span>{item.time}</span>
                  <button onClick={() => copyToClipboard(item.short, `history-${i}`)}>
                    {copied === `history-${i}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .url-panel { display: flex; flex-direction: column; gap: 20px; }
        .panel-section h3 { display: flex; align-items: center; gap: 8px; color: #00d4ff; margin: 0 0 12px; font-size: 15px; }
        .url-input-area { display: flex; gap: 10px; }
        .url-input-area input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; color: white; font-size: 14px; outline: none; }
        .url-input-area input:focus { border-color: rgba(0, 212, 255, 0.3); }
        .url-input-area input::placeholder { color: #666; }
        .url-input-area button { background: linear-gradient(135deg, #00d4ff, #7c3aed); border: none; color: white; border-radius: 10px; padding: 0 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .url-input-area button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .url-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }
        .short-url-result { background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(124, 58, 237, 0.1)); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 12px; padding: 20px; }
        .result-label { color: #888; font-size: 12px; margin-bottom: 8px; }
        .result-url { font-size: 20px; font-weight: 600; color: #00d4ff; word-break: break-all; margin-bottom: 12px; font-family: monospace; }
        .result-actions { display: flex; gap: 12px; }
        .result-actions button, .result-actions a { display: flex; align-items: center; gap: 6px; background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; cursor: pointer; }
        .result-actions button:hover, .result-actions a:hover { background: rgba(0, 212, 255, 0.25); }
        .history-section { margin-top: 16px; }
        .history-section h4 { display: flex; align-items: center; gap: 6px; color: #888; font-size: 13px; margin: 0 0 12px; }
        .history-list { display: flex; flex-direction: column; gap: 8px; }
        .history-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; }
        .history-urls { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .long-url { flex: 1; color: #888; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .history-urls svg { color: #666; flex-shrink: 0; }
        .short-url { color: #00d4ff; font-size: 12px; font-family: monospace; }
        .history-meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #666; }
        .history-meta button { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 4px; padding: 4px; cursor: pointer; display: flex; }
        .history-meta button:hover { color: #00d4ff; border-color: rgba(0, 212, 255, 0.3); }
      `}</style>
    </div>
  )
}