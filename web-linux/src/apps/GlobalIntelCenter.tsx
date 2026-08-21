import { useState, useEffect, useCallback } from 'react'

interface WeatherData {
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  city: string
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
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number
}

interface CurrencyData {
  code: string
  name: string
  rate: number
}

interface WorldClock {
  city: string
  timezone: string
  time: string
  offset: string
}

type TabType = 'weather' | 'crypto' | 'news' | 'currency' | 'clock'

const CITIES = [
  { name: '北京', lat: 39.9, lon: 116.4 },
  { name: '上海', lat: 31.23, lon: 121.47 },
  { name: '纽约', lat: 40.71, lon: -74.0 },
  { name: '伦敦', lat: 51.5, lon: -0.13 },
  { name: '东京', lat: 35.69, lon: 139.69 },
  { name: '巴黎', lat: 48.85, lon: 2.35 },
]

const CRYPTOS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple']

const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'KRW', 'INR', 'BRL']

const TIMEZONES = [
  { city: '北京', tz: 'Asia/Shanghai' },
  { city: '东京', tz: 'Asia/Tokyo' },
  { city: '伦敦', tz: 'Europe/London' },
  { city: '纽约', tz: 'America/New_York' },
  { city: '洛杉矶', tz: 'America/Los_Angeles' },
  { city: '悉尼', tz: 'Australia/Sydney' },
]

export default function GlobalIntelCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('weather')
  const [weather, setWeather] = useState<WeatherData[]>([])
  const [selectedCity, setSelectedCity] = useState(0)
  const [crypto, setCrypto] = useState<CryptoData[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [currencies, setCurrencies] = useState<CurrencyData[]>([])
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [error, setError] = useState<Record<string, string>>({})

  const fetchWeather = useCallback(async () => {
    setLoading(prev => ({ ...prev, weather: true }))
    setError(prev => ({ ...prev, weather: '' }))
    try {
      const results = await Promise.all(
        CITIES.map(async city => {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
          )
          if (!res.ok) throw new Error(`Failed for ${city.name}`)
          const data = await res.json()
          return {
            temperature: data.current.temperature_2m,
            description: getWeatherDescription(data.current.weather_code),
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            city: city.name,
          }
        })
      )
      setWeather(results)
    } catch (e) {
      setError(prev => ({ ...prev, weather: '获取天气数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, weather: false }))
    }
  }, [])

  const fetchCrypto = useCallback(async () => {
    setLoading(prev => ({ ...prev, crypto: true }))
    setError(prev => ({ ...prev, crypto: '' }))
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTOS.join(',')}&order=market_cap_desc&sparkline=false`
      )
      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      setCrypto(
        data.map((c: { id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; image: string }) => ({
          id: c.id,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: c.current_price,
          change24h: c.price_change_percentage_24h ?? 0,
          icon: c.image,
        }))
      )
    } catch (e) {
      setError(prev => ({ ...prev, crypto: '获取加密货币数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, crypto: false }))
    }
  }, [])

  const fetchNews = useCallback(async () => {
    setLoading(prev => ({ ...prev, news: true }))
    setError(prev => ({ ...prev, news: '' }))
    try {
      const res = await fetch(
        'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15'
      )
      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      setNews(
        data.hits.map((h: { objectID: string; title: string; url: string; points: number; author: string; created_at_i: number }) => ({
          id: h.objectID,
          title: h.title,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          score: h.points || 0,
          by: h.author,
          time: h.created_at_i,
        }))
      )
    } catch (e) {
      setError(prev => ({ ...prev, news: '获取新闻数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, news: false }))
    }
  }, [])

  const fetchCurrencies = useCallback(async () => {
    setLoading(prev => ({ ...prev, currency: true }))
    setError(prev => ({ ...prev, currency: '' }))
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,JPY,GBP,CNY,KRW,INR,BRL')
      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      const usdRates: Record<string, number> = {}
      CURRENCIES.forEach(cur => {
        if (cur === 'USD') {
          usdRates[cur] = 1
        } else if (data.rates[cur]) {
          usdRates[cur] = 1 / data.rates[cur]
        }
      })
      setCurrencies(
        CURRENCIES.map(code => ({
          code,
          name: getCurrencyName(code),
          rate: usdRates[code] || 0,
        }))
      )
    } catch (e) {
      setError(prev => ({ ...prev, currency: '获取汇率数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, currency: false }))
    }
  }, [])

  const updateWorldClocks = useCallback(() => {
    const now = new Date()
    setWorldClocks(
      TIMEZONES.map(({ city, tz }) => {
        const timeStr = new Intl.DateTimeFormat('zh-CN', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
        const offsetStr = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'shortOffset',
        }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || ''
        return { city, timezone: tz, time: timeStr, offset: offsetStr }
      })
    )
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchWeather(), fetchCrypto(), fetchNews(), fetchCurrencies()])
      updateWorldClocks()
      setLastUpdate(new Date().toLocaleString('zh-CN'))
    }
    fetchAll()
    const interval = setInterval(() => {
      fetchAll()
      updateWorldClocks()
      setLastUpdate(new Date().toLocaleString('zh-CN'))
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchWeather, fetchCrypto, fetchNews, fetchCurrencies, updateWorldClocks])

  useEffect(() => {
    const interval = setInterval(updateWorldClocks, 1000)
    return () => clearInterval(interval)
  }, [updateWorldClocks])

  const refresh = () => {
    fetchWeather()
    fetchCrypto()
    fetchNews()
    fetchCurrencies()
    updateWorldClocks()
    setLastUpdate(new Date().toLocaleString('zh-CN'))
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🌐</span>
          <div>
            <h1 style={styles.title}>全球实时情报中心</h1>
            <p style={styles.subtitle}>Global Intel Center · 多源API实时聚合</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.lastUpdate}>更新于 {lastUpdate}</span>
          <button onClick={refresh} style={styles.refreshBtn}>🔄 刷新</button>
        </div>
      </div>

      <div style={styles.tabBar}>
        {[
          { key: 'weather' as TabType, label: '🌤 天气', count: weather.length },
          { key: 'crypto' as TabType, label: '💰 加密', count: crypto.length },
          { key: 'news' as TabType, label: '📰 新闻', count: news.length },
          { key: 'currency' as TabType, label: '💱 汇率', count: currencies.length },
          { key: 'clock' as TabType, label: '🕐 时钟', count: worldClocks.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
            {loading[tab.key] && <span style={styles.loadingDot}>●</span>}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'weather' && (
          <WeatherPanel
            weather={weather}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            loading={!!loading.weather}
            error={error.weather}
          />
        )}
        {activeTab === 'crypto' && (
          <CryptoPanel crypto={crypto} loading={!!loading.crypto} error={error.crypto} />
        )}
        {activeTab === 'news' && (
          <NewsPanel news={news} loading={!!loading.news} error={error.news} />
        )}
        {activeTab === 'currency' && (
          <CurrencyPanel currencies={currencies} loading={!!loading.currency} error={error.currency} />
        )}
        {activeTab === 'clock' && (
          <ClockPanel clocks={worldClocks} />
        )}
      </div>

      <div style={styles.footer}>
        <span>数据来源：Open-Meteo · CoinGecko · Hacker News · Frankfurter</span>
      </div>
    </div>
  )
}

function WeatherPanel({ weather, selectedCity, setSelectedCity, loading, error }: {
  weather: WeatherData[]
  selectedCity: number
  setSelectedCity: (i: number) => void
  loading: boolean
  error: string
}) {
  const current = weather[selectedCity]
  if (loading && weather.length === 0) {
    return <div style={styles.loadingState}>加载天气数据中...</div>
  }
  if (error) {
    return <div style={styles.errorState}>❌ {error}</div>
  }
  if (!current) return null

  return (
    <div style={styles.panelGrid}>
      <div style={styles.mainCard}>
        <div style={styles.mainTemp}>
          <span style={styles.tempValue}>{Math.round(current.temperature)}</span>
          <span style={styles.tempUnit}>°C</span>
        </div>
        <div style={styles.mainDesc}>{getWeatherEmoji(current.description)} {current.description}</div>
        <div style={styles.mainCity}>{current.city}</div>
        <div style={styles.mainDetails}>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>💧</span>
            <span>湿度 {current.humidity}%</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>🌬</span>
            <span>风速 {Math.round(current.windSpeed)} KM/H</span>
          </div>
        </div>
      </div>
      <div style={styles.cityList}>
        <h3 style={styles.sectionTitle}>城市选择</h3>
        {weather.map((w, i) => (
          <button
            key={w.city}
            onClick={() => setSelectedCity(i)}
            style={{
              ...styles.cityItem,
              ...(i === selectedCity ? styles.cityItemActive : {}),
            }}
          >
            <span style={styles.cityName}>{w.city}</span>
            <span style={styles.cityTemp}>{Math.round(w.temperature)}°</span>
            <span style={styles.cityWeather}>{getWeatherEmoji(w.description)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CryptoPanel({ crypto, loading, error }: {
  crypto: CryptoData[]
  loading: boolean
  error: string
}) {
  if (loading && crypto.length === 0) {
    return <div style={styles.loadingState}>加载加密货币数据中...</div>
  }
  if (error) {
    return <div style={styles.errorState}>❌ {error}</div>
  }
  return (
    <div style={styles.cryptoGrid}>
      {crypto.map(c => (
        <div key={c.id} style={styles.cryptoCard}>
          <div style={styles.cryptoHeader}>
            <img src={c.icon} alt={c.name} style={styles.cryptoIcon} />
            <div>
              <div style={styles.cryptoName}>{c.name}</div>
              <div style={styles.cryptoSymbol}>{c.symbol}/USD</div>
            </div>
          </div>
          <div style={styles.cryptoPrice}>${c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{
            ...styles.cryptoChange,
            color: c.change24h >= 0 ? '#22c55e' : '#ef4444',
          }}>
            {c.change24h >= 0 ? '▲' : '▼'} {Math.abs(c.change24h).toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  )
}

function NewsPanel({ news, loading, error }: {
  news: NewsItem[]
  loading: boolean
  error: string
}) {
  if (loading && news.length === 0) {
    return <div style={styles.loadingState}>加载新闻数据中...</div>
  }
  if (error) {
    return <div style={styles.errorState}>❌ {error}</div>
  }
  return (
    <div style={styles.newsList}>
      {news.map(n => (
        <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" style={styles.newsItem}>
          <div style={styles.newsRank}>{news.indexOf(n) + 1}</div>
          <div style={styles.newsContent}>
            <div style={styles.newsTitle}>{n.title}</div>
            <div style={styles.newsMeta}>
              <span>🔥 {n.score} 分</span>
              <span>·</span>
              <span>@{n.by}</span>
              <span>·</span>
              <span>{timeAgo(n.time)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

function CurrencyPanel({ currencies, loading, error }: {
  currencies: CurrencyData[]
  loading: boolean
  error: string
}) {
  if (loading && currencies.length === 0) {
    return <div style={styles.loadingState}>加载汇率数据中...</div>
  }
  if (error) {
    return <div style={styles.errorState}>❌ {error}</div>
  }
  return (
    <div style={styles.currencyTable}>
      <div style={styles.currencyHeader}>
        <span style={styles.currencyCol}>货币</span>
        <span style={styles.currencyColName}>名称</span>
        <span style={styles.currencyColRate}>汇率 (1 USD =)</span>
        <span style={styles.currencyColInv}>反向汇率</span>
      </div>
      {currencies.map(c => (
        <div key={c.code} style={styles.currencyRow}>
          <span style={styles.currencyCol}><strong>{c.code}</strong></span>
          <span style={styles.currencyColName}>{c.name}</span>
          <span style={styles.currencyColRate}>{c.rate.toFixed(4)}</span>
          <span style={styles.currencyColInv}>{c.rate > 0 ? (1 / c.rate).toFixed(4) : '-'}</span>
        </div>
      ))}
    </div>
  )
}

function ClockPanel({ clocks }: { clocks: WorldClock[] }) {
  return (
    <div style={styles.clockGrid}>
      {clocks.map(c => (
        <div key={c.timezone} style={styles.clockCard}>
          <div style={styles.clockCity}>{c.city}</div>
          <div style={styles.clockTime}>{c.time}</div>
          <div style={styles.clockTz}>{c.offset}</div>
        </div>
      ))}
    </div>
  )
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: '晴朗', 1: '大部晴朗', 2: '多云', 3: '阴天',
    45: '雾', 48: '雾凇', 51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
    80: '阵雨', 81: '中阵雨', 82: '强阵雨', 95: '雷暴', 96: '冰雹雷暴',
  }
  return descriptions[code] || '未知'
}

function getWeatherEmoji(desc: string): string {
  if (desc.includes('晴')) return '☀️'
  if (desc.includes('雨')) return '🌧'
  if (desc.includes('雪')) return '❄️'
  if (desc.includes('雾')) return '🌫'
  if (desc.includes('雷')) return '⛈'
  if (desc.includes('云')) return '☁️'
  return '🌡'
}

function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    USD: '美元', EUR: '欧元', JPY: '日元', GBP: '英镑',
    CNY: '人民币', KRW: '韩元', INR: '卢比', BRL: '雷亚尔',
  }
  return names[code] || code
}

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
    color: '#e0e0e8',
    fontFamily: "'Noto Sans SC', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { fontSize: 32 },
  title: { margin: 0, fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { margin: 0, fontSize: 12, color: '#8b8b9e' },
  lastUpdate: { fontSize: 12, color: '#8b8b9e' },
  refreshBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 14 },
  tabBar: { display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  tab: { padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px 8px 0 0', color: '#8b8b9e', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' },
  tabActive: { background: 'rgba(102,126,234,0.2)', color: '#fff', borderBottom: '2px solid #667eea' },
  loadingDot: { color: '#fbbf24', fontSize: 8 },
  content: { flex: 1, padding: 24, overflowY: 'auto' },
  footer: { padding: '12px 24px', textAlign: 'center', fontSize: 11, color: '#5a5a72', borderTop: '1px solid rgba(255,255,255,0.1)' },
  loadingState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#8b8b9e', fontSize: 16 },
  errorState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#ef4444', fontSize: 16 },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 },
  mainCard: { background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2)), border: 1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 32, textAlign: 'center' },
  mainTemp: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4 },
  tempValue: { fontSize: 72, fontWeight: 200, lineHeight: 1 },
  tempUnit: { fontSize: 28, color: '#8b8b9e', marginTop: 8 },
  mainDesc: { fontSize: 24, color: '#c4c4d4', margin: '12px 0' },
  mainCity: { fontSize: 18, color: '#8b8b9e', marginBottom: 20 },
  mainDetails: { display: 'flex', justifyContent: 'center', gap: 32 },
  detailItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#c4c4d4' },
  detailIcon: { fontSize: 20 },
  cityList: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontSize: 14, color: '#8b8b9e', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  cityItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' },
  cityItemActive: { background: 'rgba(102,126,234,0.25)', borderColor: '#667eea' },
  cityName: { flex: 1, fontSize: 15 },
  cityTemp: { fontSize: 18, fontWeight: 600 },
  cityWeather: { fontSize: 20 },
  cryptoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  cryptoCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 },
  cryptoHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  cryptoIcon: { width: 32, height: 32 },
  cryptoName: { fontSize: 16, fontWeight: 600 },
  cryptoSymbol: { fontSize: 12, color: '#8b8b9e' },
  cryptoPrice: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  cryptoChange: { fontSize: 14, fontWeight: 600 },
  newsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  newsItem: { display: 'flex', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' },
  newsRank: { fontSize: 20, fontWeight: 700, color: '#667eea', minWidth: 32 },
  newsContent: { flex: 1 },
  newsTitle: { fontSize: 15, fontWeight: 500, marginBottom: 4 },
  newsMeta: { fontSize: 12, color: '#8b8b9e', display: 'flex', gap: 8 },
  currencyTable: { background: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' },
  currencyHeader: { display: 'grid', gridTemplateColumns: '80px 1fr 150px 150px', padding: '16px 20px', background: 'rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 600, color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: 1 },
  currencyRow: { display: 'grid', gridTemplateColumns: '80px 1fr 150px 150px', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 14 },
  currencyCol: { display: 'flex', alignItems: 'center' },
  currencyColName: { display: 'flex', alignItems: 'center', color: '#c4c4d4' },
  currencyColRate: { display: 'flex', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace' },
  currencyColInv: { display: 'flex', alignItems: 'center', color: '#8b8b9e', fontFamily: 'JetBrains Mono, monospace' },
  clockGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  clockCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, textAlign: 'center' },
  clockCity: { fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#c4c4d4' },
  clockTime: { fontSize: 36, fontWeight: 300, fontFamily: 'JetBrains Mono, monospace', color: '#667eea' },
  clockTz: { fontSize: 12, color: '#8b8b9e', marginTop: 8 },
}
