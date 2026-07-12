import { useState, useEffect, useCallback } from 'react'

/**
 * LiveDashboard - 实时数据仪表板
 * 接入合规公开 API 展示实时数据：
 * - 加密货币价格 (CoinGecko API - 免费、无需 API Key)
 * - Hacker News 热门 (HN API - 免费)
 * - 天气信息 (Open-Meteo API - 免费、无需 API Key)
 * - 系统状态 (浏览器 Performance API)
 */

interface CryptoData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
}

interface HNStory {
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number
  descendants: number
}

interface WeatherData {
  temperature: number
  windspeed: number
  weathercode: number
  is_day: number
  time: string
}

const WEATHER_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: '晴朗', icon: '☀️' }, 1: { desc: '晴', icon: '🌤️' },
  2: { desc: '多云', icon: '⛅' }, 3: { desc: '阴', icon: '☁️' },
  45: { desc: '雾', icon: '🌫️' }, 48: { desc: '冻雾', icon: '🌫️' },
  51: { desc: '小雨', icon: '🌦️' }, 53: { desc: '小雨', icon: '🌦️' },
  55: { desc: '中雨', icon: '🌧️' }, 61: { desc: '小雨', icon: '🌧️' },
  63: { desc: '中雨', icon: '🌧️' }, 65: { desc: '大雨', icon: '🌧️' },
  71: { desc: '小雪', icon: '🌨️' }, 73: { desc: '中雪', icon: '❄️' },
  75: { desc: '大雪', icon: '❄️' }, 77: { desc: '冰粒', icon: '🌨️' },
  80: { desc: '阵雨', icon: '🌦️' }, 81: { desc: '阵雨', icon: '🌧️' },
  82: { desc: '暴雨', icon: '⛈️' }, 85: { desc: '阵雪', icon: '🌨️' },
  86: { desc: '阵雪', icon: '❄️' }, 95: { desc: '雷暴', icon: '⛈️' },
  96: { desc: '雷暴', icon: '⛈️' }, 99: { desc: '雷暴', icon: '⛈️' },
}

// ========================= 样式 =========================
const baseStyle: React.CSSProperties = {
  background: '#0a0e14',
  color: '#c8d3f5',
  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  height: '100%',
  overflow: 'auto',
  padding: '20px',
}

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
  border: '1px solid #1e2632',
  borderRadius: '12px',
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
}

const cardTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: '#5c677d',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const liveDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#7ee787',
  display: 'inline-block',
  animation: 'pulse 2s infinite',
}

const cryptoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '12px',
  marginTop: '8px',
}

const cryptoItemStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid #1e2632',
  borderRadius: '8px',
  padding: '10px 12px',
  transition: 'border-color 0.15s',
}

const newsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: '320px',
  overflow: 'auto',
}

const newsItemStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '6px',
  borderLeft: '3px solid #7cd6cf',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background 0.15s',
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 1) return `$${price.toFixed(2)}`
  return `$${price.toFixed(4)}`
}

function formatNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toString()
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

// ========================= 子组件 =========================

function CryptoCard() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchCrypto = useCallback(async () => {
    try {
      const resp = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,dogecoin,polkadot,chainlink,avalanche-2&order=market_cap_desc&per_page=8&page=1&sparkline=false&price_change_percentage=24h'
      )
      if (!resp.ok) throw new Error('API 请求失败')
      const data: CryptoData[] = await resp.json()
      setCryptos(data)
      setError('')
      setLastUpdate(new Date())
    } catch (e) {
      setError(`获取失败: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrypto()
    const timer = setInterval(fetchCrypto, 60000) // 每分钟刷新
    return () => clearInterval(timer)
  }, [fetchCrypto])

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>
        <span style={liveDotStyle} /> 加密货币实时价格
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#5c677d' }}>
          {lastUpdate ? `更新于 ${lastUpdate.toLocaleTimeString('zh-CN')}` : ''}
        </span>
      </div>
      {loading && <div style={{ color: '#5c677d', fontSize: '13px' }}>加载中...</div>}
      {error && <div style={{ color: '#ff7b72', fontSize: '12px' }}>{error}</div>}
      <div style={cryptoGridStyle}>
        {cryptos.map((c) => {
          const change = c.price_change_percentage_24h ?? 0
          const positive = change >= 0
          return (
            <div key={c.id} style={cryptoItemStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#e6e6e6' }}>{c.symbol.toUpperCase()}</span>
                <span style={{ fontSize: '10px', color: '#5c677d' }}>{c.name}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#7cd6cf' }}>{formatPrice(c.current_price)}</div>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: positive ? '#7ee787' : '#ff7b72',
                marginTop: '2px',
              }}>
                {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </div>
              <div style={{ fontSize: '10px', color: '#5c677d', marginTop: '4px' }}>
                市值: ${formatNum(c.market_cap)} | 量: ${formatNum(c.total_volume)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NewsCard() {
  const [stories, setStories] = useState<HNStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNews = useCallback(async () => {
    try {
      const resp = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      if (!resp.ok) throw new Error('API 请求失败')
      const ids: number[] = await resp.json()
      const topIds = ids.slice(0, 10)
      const storiesData = await Promise.all(
        topIds.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
        )
      )
      setStories(storiesData.filter(s => s && s.title))
      setError('')
    } catch (e) {
      setError(`获取失败: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    const timer = setInterval(fetchNews, 300000) // 每5分钟刷新
    return () => clearInterval(timer)
  }, [fetchNews])

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>
        <span style={liveDotStyle} /> Hacker News 热门
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#5c677d' }}>Top 10</span>
      </div>
      {loading && <div style={{ color: '#5c677d', fontSize: '13px' }}>加载中...</div>}
      {error && <div style={{ color: '#ff7b72', fontSize: '12px' }}>{error}</div>}
      <div style={newsListStyle}>
        {stories.map((s, i) => (
          <div
            key={s.id}
            style={newsItemStyle}
            onClick={() => window.open(s.url || `https://news.ycombinator.com/item?id=${s.id}`, '_blank')}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 214, 207, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: '#7cd6cf', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#e6e6e6', lineHeight: 1.4 }}>{s.title}</div>
                <div style={{ color: '#5c677d', fontSize: '10px', marginTop: '3px' }}>
                  {s.score} points | by {s.by} | {timeAgo(s.time)} | {s.descendants || 0} comments
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [city, setCity] = useState('Beijing')
  const [error, setError] = useState('')

  const cities: Record<string, { lat: number; lon: number; name: string }> = {
    'Beijing': { lat: 39.9042, lon: 116.4074, name: '北京' },
    'Shanghai': { lat: 31.2304, lon: 121.4737, name: '上海' },
    'Guangzhou': { lat: 23.1291, lon: 113.2644, name: '广州' },
    'Shenzhen': { lat: 22.5431, lon: 114.0579, name: '深圳' },
    'Tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
    'New York': { lat: 40.7128, lon: -74.0060, name: '纽约' },
    'London': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
  }

  const fetchWeather = useCallback(async (cityName: string) => {
    const c = cities[cityName] || cities['Beijing']
    try {
      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day`
      )
      if (!resp.ok) throw new Error('API 请求失败')
      const data = await resp.json()
      setWeather(data.current)
      setError('')
    } catch (e) {
      setError(`获取失败: ${(e as Error).message}`)
    }
  }, [])

  useEffect(() => {
    fetchWeather(city)
    const timer = setInterval(() => fetchWeather(city), 600000) // 每10分钟刷新
    return () => clearInterval(timer)
  }, [city, fetchWeather])

  const w = weather ? WEATHER_CODES[weather.weathercode] || { desc: '未知', icon: '❓' } : null

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>
        <span style={liveDotStyle} /> 天气信息
        <select
          style={{
            marginLeft: 'auto',
            background: '#0d1117',
            border: '1px solid #1e2632',
            borderRadius: '4px',
            padding: '2px 6px',
            color: '#c8d3f5',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {Object.entries(cities).map(([key, val]) => (
            <option key={key} value={key}>{val.name}</option>
          ))}
        </select>
      </div>
      {error && <div style={{ color: '#ff7b72', fontSize: '12px' }}>{error}</div>}
      {weather && w && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '48px' }}>{w.icon}</div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#7cd6cf' }}>
              {Math.round(weather.temperature)}°C
            </div>
            <div style={{ color: '#e6e6e6', fontSize: '14px' }}>{w.desc}</div>
            <div style={{ color: '#5c677d', fontSize: '11px', marginTop: '4px' }}>
              {cities[city]?.name} | {weather.is_day ? '白天' : '夜间'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SystemCard() {
  const [stats, setStats] = useState({
    memory: 0,
    cores: 0,
    online: navigator.onLine,
    connection: '',
    fps: 0,
  })

  useEffect(() => {
    const updateStats = () => {
      const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } }
      setStats({
        memory: nav.deviceMemory || 0,
        cores: navigator.hardwareConcurrency || 0,
        online: navigator.onLine,
        connection: nav.connection?.effectiveType || 'unknown',
        fps: 0,
      })
    }
    updateStats()

    // FPS 监控
    let frames = 0
    let lastTime = performance.now()
    let rafId: number
    const measureFPS = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setStats(s => ({ ...s, fps: Math.round((frames * 1000) / (now - lastTime)) }))
        frames = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(measureFPS)
    }
    rafId = requestAnimationFrame(measureFPS)

    const onlineHandler = () => updateStats()
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', onlineHandler)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', onlineHandler)
    }
  }, [])

  const metrics = [
    { label: 'CPU 核心', value: stats.cores ? `${stats.cores} 核` : 'N/A', color: '#7cd6cf' },
    { label: '设备内存', value: stats.memory ? `${stats.memory} GB` : 'N/A', color: '#7ee787' },
    { label: '网络状态', value: stats.online ? '在线' : '离线', color: stats.online ? '#7ee787' : '#ff7b72' },
    { label: '连接类型', value: stats.connection.toUpperCase(), color: '#c792ea' },
    { label: '渲染 FPS', value: `${stats.fps}`, color: stats.fps >= 50 ? '#7ee787' : stats.fps >= 30 ? '#ffab70' : '#ff7b72' },
    { label: '屏幕分辨率', value: `${window.screen.width}×${window.screen.height}`, color: '#ffab70' },
  ]

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>
        <span style={liveDotStyle} /> 系统状态
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: '#5c677d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: m.color, marginTop: '4px' }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClockCard() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '36px', fontWeight: 700, color: '#7cd6cf', fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>
          {time.toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
        <div style={{ fontSize: '12px', color: '#5c677d', marginTop: '4px' }}>
          {time.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '11px', color: '#5c677d' }}>Unix 时间戳</div>
        <div style={{ fontSize: '14px', color: '#7ee787', fontFamily: "'JetBrains Mono', monospace" }}>
          {Math.floor(time.getTime() / 1000)}
        </div>
      </div>
    </div>
  )
}

// ========================= 主组件 =========================

export default function LiveDashboard() {
  return (
    <div style={baseStyle}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2632; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a3548; }
      `}</style>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#e6e6e6', margin: 0 }}>
          Live Dashboard
        </h1>
        <p style={{ fontSize: '12px', color: '#5c677d', margin: '4px 0 0 0' }}>
          实时数据聚合仪表板 - 接入 CoinGecko、Hacker News、Open-Meteo 等合规公开 API
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ClockCard />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <WeatherCard />
          <SystemCard />
        </div>
        <CryptoCard />
        <NewsCard />
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#5c677d' }}>
        数据来源：CoinGecko API | Hacker News API | Open-Meteo API | 浏览器 Performance API
      </div>
    </div>
  )
}
