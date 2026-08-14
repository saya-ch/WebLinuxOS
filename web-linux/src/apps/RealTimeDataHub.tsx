import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, Settings, Star, Sun, Cloud, Zap,
  DollarSign, Newspaper, Quote, Clock, AlertCircle,
  Globe, ChevronDown
} from 'lucide-react'

interface WeatherData {
  temperature: number
  weatherCode: number
  description: string
  city: string
}

interface CryptoData {
  name: string
  symbol: string
  price: number
  change24h: number
}

interface ExchangeData {
  rates: Record<string, number>
  date: string
}

interface NewsItem {
  id: number
  title: string
  url: string
  by: string
  score: number
  time: number
}

interface QuoteData {
  text: string
  author: string
}

interface DataCardState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdate: Date | null
}

const WEATHER_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: '晴朗', icon: '☀️' },
  1: { desc: '大部晴朗', icon: '🌤️' },
  2: { desc: '多云', icon: '⛅' },
  3: { desc: '阴天', icon: '☁️' },
  45: { desc: '雾', icon: '🌫️' },
  48: { desc: '冻雾', icon: '🌫️' },
  51: { desc: '小毛毛雨', icon: '🌦️' },
  53: { desc: '毛毛雨', icon: '🌦️' },
  55: { desc: '大毛毛雨', icon: '🌧️' },
  61: { desc: '小雨', icon: '🌦️' },
  63: { desc: '中雨', icon: '🌧️' },
  65: { desc: '大雨', icon: '🌧️' },
  71: { desc: '小雪', icon: '🌨️' },
  73: { desc: '中雪', icon: '❄️' },
  75: { desc: '大雪', icon: '❄️' },
  80: { desc: '阵雨', icon: '🌦️' },
  81: { desc: '强阵雨', icon: '🌧️' },
  82: { desc: '暴雨', icon: '⛈️' },
  95: { desc: '雷暴', icon: '⛈️' },
  96: { desc: '雷暴伴冰雹', icon: '⛈️' },
  99: { desc: '强雷暴', icon: '⛈️' },
}

const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
]

const CRYPTO_IDS = 'bitcoin,ethereum,solana'

export default function RealTimeDataHub() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rtdh-theme')
    return (saved as 'light' | 'dark') || 'dark'
  })
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('rtdh-interval')
    return saved ? parseInt(saved, 10) : 60
  })
  const [selectedCity, setSelectedCity] = useState(() => {
    const saved = localStorage.getItem('rtdh-city')
    return CITIES.find(c => c.name === saved) || CITIES[0]
  })
  const [showSettings, setShowSettings] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('rtdh-favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [newsOffset, setNewsOffset] = useState(0)

  const [weatherState, setWeatherState] = useState<DataCardState<WeatherData>>({
    data: null, loading: false, error: null, lastUpdate: null
  })
  const [cryptoState, setCryptoState] = useState<DataCardState<CryptoData[]>>({
    data: null, loading: false, error: null, lastUpdate: null
  })
  const [exchangeState, setExchangeState] = useState<DataCardState<ExchangeData>>({
    data: null, loading: false, error: null, lastUpdate: null
  })
  const [newsState, setNewsState] = useState<DataCardState<NewsItem[]>>({
    data: null, loading: false, error: null, lastUpdate: null
  })
  const [quoteState, setQuoteState] = useState<DataCardState<QuoteData>>({
    data: null, loading: false, error: null, lastUpdate: null
  })

  const cacheRef = useRef<Record<string, { data: unknown; time: number }>>({})

  useEffect(() => {
    localStorage.setItem('rtdh-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('rtdh-interval', String(refreshInterval))
  }, [refreshInterval])

  useEffect(() => {
    localStorage.setItem('rtdh-city', selectedCity.name)
  }, [selectedCity])

  useEffect(() => {
    localStorage.setItem('rtdh-favorites', JSON.stringify(favorites))
  }, [favorites])

  const fetchWithCache = useCallback(async <T,>(
    key: string,
    url: string,
    ttl = 5 * 60 * 1000
  ): Promise<T> => {
    const cached = cacheRef.current[key]
    if (cached && Date.now() - cached.time < ttl) {
      return cached.data as T
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    cacheRef.current[key] = { data, time: Date.now() }
    return data as T
  }, [])

  const fetchWeather = useCallback(async () => {
    setWeatherState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,weather_code`
      const data: any = await fetchWithCache(`weather-${selectedCity.name}`, url, 10 * 60 * 1000)
      const code = data.current.weather_code
      const info = WEATHER_CODES[code] || { desc: '未知', icon: '❓' }
      setWeatherState({
        data: {
          temperature: data.current.temperature_2m,
          weatherCode: code,
          description: info.desc,
          city: selectedCity.name,
        },
        loading: false,
        error: null,
        lastUpdate: new Date(),
      })
    } catch (e: any) {
      setWeatherState(prev => ({ ...prev, loading: false, error: e.message || '获取天气失败' }))
    }
  }, [selectedCity, fetchWithCache])

  const fetchCrypto = useCallback(async () => {
    setCryptoState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS}&vs_currencies=usd&include_24hr_change=true`
      const data: any = await fetchWithCache('crypto', url, 60 * 1000)
      const mapped: CryptoData[] = Object.entries(data).map(([id, val]: [string, any]) => ({
        name: id.charAt(0).toUpperCase() + id.slice(1),
        symbol: id.slice(0, 3).toUpperCase(),
        price: val.usd,
        change24h: val.usd_24h_change || 0,
      }))
      setCryptoState({
        data: mapped,
        loading: false,
        error: null,
        lastUpdate: new Date(),
      })
    } catch (e: any) {
      setCryptoState(prev => ({ ...prev, loading: false, error: e.message || '获取加密货币数据失败' }))
    }
  }, [fetchWithCache])

  const fetchExchange = useCallback(async () => {
    setExchangeState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const url = 'https://api.frankfurter.app/latest?from=USD&to=CNY,EUR,JPY'
      const data: any = await fetchWithCache('exchange', url, 30 * 60 * 1000)
      setExchangeState({
        data: {
          rates: data.rates,
          date: data.date,
        },
        loading: false,
        error: null,
        lastUpdate: new Date(),
      })
    } catch (e: any) {
      setExchangeState(prev => ({ ...prev, loading: false, error: e.message || '获取汇率数据失败' }))
    }
  }, [fetchWithCache])

  const fetchNews = useCallback(async () => {
    setNewsState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const storyIds: number[] = await fetchWithCache('hn-top', 'https://hacker-news.firebaseio.com/v0/topstories.json', 5 * 60 * 1000)
      const start = newsOffset
      const stories = await Promise.all(
        storyIds.slice(start, start + 5).map(async id => {
          const item = await fetchWithCache<NewsItem>(`hn-item-${id}`, `https://hacker-news.firebaseio.com/v0/item/${id}.json`, 10 * 60 * 1000)
          return item
        })
      )
      const valid = stories.filter(s => s && s.title)
      setNewsState({
        data: valid,
        loading: false,
        error: null,
        lastUpdate: new Date(),
      })
    } catch (e: any) {
      setNewsState(prev => ({ ...prev, loading: false, error: e.message || '获取新闻数据失败' }))
    }
  }, [newsOffset, fetchWithCache])

  const fetchQuote = useCallback(async () => {
    setQuoteState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data: any[] = await fetchWithCache('zen-quote', 'https://api.zenquotes.io/api/random', 10 * 60 * 1000)
      setQuoteState({
        data: { text: data[0].q, author: data[0].a },
        loading: false,
        error: null,
        lastUpdate: new Date(),
      })
    } catch (e: any) {
      setQuoteState(prev => ({ ...prev, loading: false, error: e.message || '获取名言失败' }))
    }
  }, [fetchWithCache])

  const fetchAll = useCallback(() => {
    fetchWeather()
    fetchCrypto()
    fetchExchange()
    fetchNews()
    fetchQuote()
  }, [fetchWeather, fetchCrypto, fetchExchange, fetchNews, fetchQuote])

  useEffect(() => {
    fetchAll()
    const intervalId = setInterval(fetchAll, refreshInterval * 1000)
    return () => clearInterval(intervalId)
  }, [fetchAll, refreshInterval])

  const toggleFavorite = (key: string) => {
    setFavorites(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const isDark = theme === 'dark'

  const glassStyle: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
    borderRadius: '16px',
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: isDark
      ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
      : 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
    color: isDark ? '#e8e8f0' : '#1a1a2e',
    fontFamily: 'inherit',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    background: isDark ? 'rgba(15,12,41,0.6)' : 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  }

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 600,
  }

  const headerActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }

  const iconBtnStyle = (active?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    background: active
      ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
      : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'),
    color: isDark ? '#e8e8f0' : '#1a1a2e',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  const gridStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '18px',
    alignContent: 'start',
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Globe size={18} color="white" />
          </div>
          <span>实时数据聚合中心</span>
        </div>
        <div style={headerActionsStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            fontSize: '12px',
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          }}>
            <Clock size={12} />
            <span>{refreshInterval}s 自动刷新</span>
          </div>
          <button onClick={fetchAll} style={iconBtnStyle()} title="刷新所有">
            <RefreshCw size={16} style={{ animation: 'none' }} />
          </button>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={iconBtnStyle()} title="切换主题">
            {isDark ? <Sun size={16} /> : <Cloud size={16} />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} style={iconBtnStyle(showSettings)} title="设置">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          background: isDark ? 'rgba(15,12,41,0.4)' : 'rgba(255,255,255,0.3)',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>刷新间隔：</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                color: isDark ? '#e8e8f0' : '#1a1a2e',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value={15}>15 秒</option>
              <option value={30}>30 秒</option>
              <option value={60}>1 分钟</option>
              <option value={120}>2 分钟</option>
              <option value={300}>5 分钟</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>天气城市：</span>
            <select
              value={selectedCity.name}
              onChange={(e) => {
                const city = CITIES.find(c => c.name === e.target.value)
                if (city) setSelectedCity(city)
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                color: isDark ? '#e8e8f0' : '#1a1a2e',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>收藏：{favorites.length} 个</span>
          </div>
        </div>
      )}

      <div style={gridStyle}>
        <WeatherCard
          state={weatherState}
          isDark={isDark}
          glassStyle={glassStyle}
          favorites={favorites}
          onToggleFavorite={() => toggleFavorite('weather')}
          onRefresh={fetchWeather}
        />
        <CryptoCard
          state={cryptoState}
          isDark={isDark}
          glassStyle={glassStyle}
          favorites={favorites}
          onToggleFavorite={() => toggleFavorite('crypto')}
          onRefresh={fetchCrypto}
        />
        <ExchangeCard
          state={exchangeState}
          isDark={isDark}
          glassStyle={glassStyle}
          favorites={favorites}
          onToggleFavorite={() => toggleFavorite('exchange')}
          onRefresh={fetchExchange}
        />
        <NewsCard
          state={newsState}
          isDark={isDark}
          glassStyle={glassStyle}
          favorites={favorites}
          onToggleFavorite={() => toggleFavorite('news')}
          onRefresh={fetchNews}
          newsOffset={newsOffset}
          onNewsOffsetChange={setNewsOffset}
        />
        <QuoteCard
          state={quoteState}
          isDark={isDark}
          glassStyle={glassStyle}
          favorites={favorites}
          onToggleFavorite={() => toggleFavorite('quote')}
          onRefresh={fetchQuote}
        />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function CardHeader({
  icon, title, source, isDark, loading, onRefresh, isFav, onToggleFav
}: {
  icon: React.ReactNode
  title: string
  source: string
  isDark: boolean
  loading: boolean
  onRefresh: () => void
  isFav: boolean
  onToggleFav: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? '#a0a0c0' : '#555',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{title}</div>
          <div style={{
            fontSize: '11px',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
          }}>
            {source}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={onToggleFav} style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: isFav ? '#fbbf24' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
          transition: 'color 0.2s',
        }} title={isFav ? '取消收藏' : '收藏'}>
          {isFav ? <Star size={16} fill="#fbbf24" /> : <Star size={16} />}
        </button>
        <button onClick={onRefresh} disabled={loading} style={{
          background: 'transparent',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          padding: '4px',
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        }} title="刷新">
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
    </div>
  )
}

function CardFooter({ lastUpdate, isDark }: { lastUpdate: Date | null; isDark: boolean }) {
  return (
    <div style={{
      marginTop: '12px',
      paddingTop: '10px',
      borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '11px',
      color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)',
    }}>
      <span>{lastUpdate ? `更新于 ${lastUpdate.toLocaleTimeString()}` : '等待数据...'}</span>
    </div>
  )
}

function ErrorBadge({ error, isDark }: { error: string; isDark: boolean }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: '8px',
      background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
      color: isDark ? '#fca5a5' : '#dc2626',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <AlertCircle size={14} />
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '220px',
      }}>{error}</span>
    </div>
  )
}

function LoadingSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div style={{
      height: '140px',
      borderRadius: '10px',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
      fontSize: '13px',
    }}>
      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
      加载中...
    </div>
  )
}

function WeatherCard({
  state, isDark, glassStyle, favorites, onToggleFavorite, onRefresh
}: {
  state: DataCardState<WeatherData>
  isDark: boolean
  glassStyle: React.CSSProperties
  favorites: string[]
  onToggleFavorite: () => void
  onRefresh: () => void
}) {
  return (
    <div style={{ ...glassStyle, padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        icon={<Sun size={16} />}
        title="天气预报"
        source="Open-Meteo API"
        isDark={isDark}
        loading={state.loading}
        onRefresh={onRefresh}
        isFav={favorites.includes('weather')}
        onToggleFav={onToggleFavorite}
      />
      {state.error ? (
        <ErrorBadge error={state.error} isDark={isDark} />
      ) : state.loading && !state.data ? (
        <LoadingSkeleton isDark={isDark} />
      ) : state.data ? (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)'
            : 'linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.08) 100%)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: '4px' }}>
                {state.data.city}
              </div>
              <div style={{ fontSize: '42px', fontWeight: 300, lineHeight: 1 }}>
                {state.data.temperature.toFixed(0)}°
              </div>
              <div style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', marginTop: '6px' }}>
                {state.data.description}
              </div>
            </div>
            <div style={{ fontSize: '48px' }}>
              {WEATHER_CODES[state.data.weatherCode]?.icon || '❓'}
            </div>
          </div>
        </div>
      ) : null}
      <CardFooter lastUpdate={state.lastUpdate} isDark={isDark} />
    </div>
  )
}

function CryptoCard({
  state, isDark, glassStyle, favorites, onToggleFavorite, onRefresh
}: {
  state: DataCardState<CryptoData[]>
  isDark: boolean
  glassStyle: React.CSSProperties
  favorites: string[]
  onToggleFavorite: () => void
  onRefresh: () => void
}) {
  return (
    <div style={{ ...glassStyle, padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        icon={<Zap size={16} />}
        title="加密货币"
        source="CoinGecko API"
        isDark={isDark}
        loading={state.loading}
        onRefresh={onRefresh}
        isFav={favorites.includes('crypto')}
        onToggleFav={onToggleFavorite}
      />
      {state.error ? (
        <ErrorBadge error={state.error} isDark={isDark} />
      ) : state.loading && !state.data ? (
        <LoadingSkeleton isDark={isDark} />
      ) : state.data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {state.data.map(coin => (
            <div key={coin.symbol} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${
                  coin.symbol === 'BIT' ? '#f7931a' :
                  coin.symbol === 'ETH' ? '#627eea' :
                  coin.symbol === 'SOL' ? '#9945ff' : '#6b7280'
                }, ${
                  coin.symbol === 'BIT' ? '#ffaa4a' :
                  coin.symbol === 'ETH' ? '#92a9ff' :
                  coin.symbol === 'SOL' ? '#b17aff' : '#9ca3af'
                })`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: 'white',
              }}>
                {coin.symbol[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{coin.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  ${coin.price >= 1 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: coin.change24h >= 0
                    ? (isDark ? '#86efac' : '#16a34a')
                    : (isDark ? '#fca5a5' : '#dc2626'),
                  fontWeight: 500,
                }}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <CardFooter lastUpdate={state.lastUpdate} isDark={isDark} />
    </div>
  )
}

function ExchangeCard({
  state, isDark, glassStyle, favorites, onToggleFavorite, onRefresh
}: {
  state: DataCardState<ExchangeData>
  isDark: boolean
  glassStyle: React.CSSProperties
  favorites: string[]
  onToggleFavorite: () => void
  onRefresh: () => void
}) {
  const currencies = [
    { code: 'CNY', name: '人民币', symbol: '¥' },
    { code: 'EUR', name: '欧元', symbol: '€' },
    { code: 'JPY', name: '日元', symbol: '¥' },
  ]

  return (
    <div style={{ ...glassStyle, padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        icon={<DollarSign size={16} />}
        title="汇率转换"
        source="Frankfurter API"
        isDark={isDark}
        loading={state.loading}
        onRefresh={onRefresh}
        isFav={favorites.includes('exchange')}
        onToggleFav={onToggleFavorite}
      />
      {state.error ? (
        <ErrorBadge error={state.error} isDark={isDark} />
      ) : state.loading && !state.data ? (
        <LoadingSkeleton isDark={isDark} />
      ) : state.data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
            textAlign: 'center',
            marginBottom: '4px',
          }}>
            <div style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
              基准货币
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              1 USD =
            </div>
          </div>
          {currencies.map(c => {
            const rate = state.data?.rates[c.code]
            return (
              <div key={c.code} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.3)',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '22px',
                    borderRadius: '4px',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {c.code}
                  </div>
                  <span style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                    {c.name}
                  </span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  {rate ? rate.toFixed(4) : '-'}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
      <CardFooter lastUpdate={state.lastUpdate} isDark={isDark} />
    </div>
  )
}

function NewsCard({
  state, isDark, glassStyle, favorites, onToggleFavorite, onRefresh,
  newsOffset, onNewsOffsetChange
}: {
  state: DataCardState<NewsItem[]>
  isDark: boolean
  glassStyle: React.CSSProperties
  favorites: string[]
  onToggleFavorite: () => void
  onRefresh: () => void
  newsOffset: number
  onNewsOffsetChange: (offset: number) => void
}) {
  return (
    <div style={{ ...glassStyle, padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        icon={<Newspaper size={16} />}
        title="科技新闻"
        source="Hacker News API"
        isDark={isDark}
        loading={state.loading}
        onRefresh={onRefresh}
        isFav={favorites.includes('news')}
        onToggleFav={onToggleFavorite}
      />
      {state.error ? (
        <ErrorBadge error={state.error} isDark={isDark} />
      ) : state.loading && !state.data ? (
        <LoadingSkeleton isDark={isDark} />
      ) : state.data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {state.data.map((item, i) => (
            <a
              key={item.id}
              href={item.url || `https://news.ycombinator.com/item?id=${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
                border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)' }}
            >
              <div style={{
                fontSize: '13px',
                lineHeight: 1.4,
                marginBottom: '6px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {i + 1}. {item.title}
              </div>
              <div style={{
                display: 'flex',
                gap: '10px',
                fontSize: '11px',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
              }}>
                <span>▲ {item.score}</span>
                <span>by {item.by}</span>
                <span>{Math.floor(Date.now() / 1000 - item.time) < 3600
                  ? `${Math.floor((Date.now() / 1000 - item.time) / 60)}分钟前`
                  : `${Math.floor((Date.now() / 1000 - item.time) / 3600)}小时前`}</span>
              </div>
            </a>
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <button
              onClick={() => onNewsOffsetChange(newsOffset === 0 ? 5 : 0)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {newsOffset === 0 ? '加载更多' : '返回首页'}
              <ChevronDown size={12} style={{ transform: newsOffset === 0 ? 'none' : 'rotate(180deg)' }} />
            </button>
          </div>
        </div>
      ) : null}
      <CardFooter lastUpdate={state.lastUpdate} isDark={isDark} />
    </div>
  )
}

function QuoteCard({
  state, isDark, glassStyle, favorites, onToggleFavorite, onRefresh
}: {
  state: DataCardState<QuoteData>
  isDark: boolean
  glassStyle: React.CSSProperties
  favorites: string[]
  onToggleFavorite: () => void
  onRefresh: () => void
}) {
  return (
    <div style={{ ...glassStyle, padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        icon={<Quote size={16} />}
        title="每日励志"
        source="ZenQuotes API"
        isDark={isDark}
        loading={state.loading}
        onRefresh={onRefresh}
        isFav={favorites.includes('quote')}
        onToggleFav={onToggleFavorite}
      />
      {state.error ? (
        <ErrorBadge error={state.error} isDark={isDark} />
      ) : state.loading && !state.data ? (
        <LoadingSkeleton isDark={isDark} />
      ) : state.data ? (
        <div style={{
          padding: '20px 16px',
          borderRadius: '12px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.06) 100%)',
          border: isDark ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(245,158,11,0.15)',
          textAlign: 'center',
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '12px',
        }}>
          <div style={{
            fontSize: '32px',
            lineHeight: 1,
            color: isDark ? 'rgba(251,191,36,0.5)' : 'rgba(245,158,11,0.6)',
            fontFamily: 'Georgia, serif',
          }}>
            "
          </div>
          <div style={{
            fontSize: '15px',
            lineHeight: 1.6,
            fontStyle: 'italic',
            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
          }}>
            {state.data.text}
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: isDark ? 'rgba(251,191,36,0.9)' : 'rgba(180,83,9,0.9)',
          }}>
            — {state.data.author}
          </div>
        </div>
      ) : null}
      <CardFooter lastUpdate={state.lastUpdate} isDark={isDark} />
    </div>
  )
}