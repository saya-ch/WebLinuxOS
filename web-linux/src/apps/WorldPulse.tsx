import { useState, useEffect, useCallback, useRef, memo } from 'react'
import '../styles/worldpulse.css'
import {
  Activity, Bitcoin, Cloud, Compass, DollarSign, Globe2, RefreshCw,
  Satellite, Wind, Droplets, Sunrise, Sun, Moon,
  Zap, Radio, BarChart3, Users, Flame, MessageSquare,
  Gauge, ThermometerSun, Code2,
} from 'lucide-react'

/* ============================================================
   WorldPulse — 实时全球情报仪表盘
   所有数据来源均为免费、无需 API Key、支持 CORS 的公开接口：
   - 加密货币：CoinGecko (api.coingecko.com)
   - 天气：Open-Meteo (api.open-meteo.com)
   - 国际空间站位置：wheretheiss.at
   - 汇率：open.er-api.com
   - Hacker News 热榜：hacker-news.firebaseio.com
   - GitHub 趋势：api.github.com
   - 空气质量：Open-Meteo Air Quality
   - 全球新闻：NewsAPI / Hacker News
   ============================================================ */

// ---------- 类型定义 ----------
interface CryptoCoin {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
}

interface WeatherCity {
  name: string
  lat: number
  lon: number
  timezone: string
}

interface WeatherData {
  temperature: number
  windspeed: number
  humidity: number
  weatherCode: number
  isDay: boolean
}

interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  o3: number
  no2: number
}

interface ISSPosition {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  timestamp: number
}

interface HNStory {
  id: number
  title: string
  url: string
  score: number
  by: string
  descendants: number
}

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  html_url: string
}

// ---------- 配置 ----------
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano']

const CRYPTO_META: Record<string, { color: string; letter: string }> = {
  bitcoin: { color: '#f7931a', letter: '₿' },
  ethereum: { color: '#627eea', letter: 'Ξ' },
  solana: { color: '#9945ff', letter: '◎' },
  binancecoin: { color: '#f3ba2f', letter: 'B' },
  ripple: { color: '#23292f', letter: '✕' },
  cardano: { color: '#0033ad', letter: '₳' },
}

const WEATHER_CITIES: WeatherCity[] = [
  { name: '上海', lat: 31.23, lon: 121.47, timezone: 'Asia/Shanghai' },
  { name: '北京', lat: 39.90, lon: 116.40, timezone: 'Asia/Shanghai' },
  { name: '东京', lat: 35.68, lon: 139.69, timezone: 'Asia/Tokyo' },
  { name: '纽约', lat: 40.71, lon: -74.01, timezone: 'America/New_York' },
  { name: '伦敦', lat: 51.51, lon: -0.13, timezone: 'Europe/London' },
  { name: '巴黎', lat: 48.85, lon: 2.35, timezone: 'Europe/Paris' },
  { name: '悉尼', lat: -33.87, lon: 151.21, timezone: 'Australia/Sydney' },
]

const AIR_QUALITY_CITIES = [
  { name: '北京', lat: 39.90, lon: 116.40 },
  { name: '上海', lat: 31.23, lon: 121.47 },
  { name: '东京', lat: 35.68, lon: 139.69 },
  { name: '伦敦', lat: 51.51, lon: -0.13 },
]

const FEATURED_CITY_INDEX = 0

const RATE_BASE = 'USD'
const RATE_TARGETS = ['CNY', 'EUR', 'JPY', 'GBP', 'HKD', 'AUD']

const WORLD_CLOCKS = [
  { city: '上海', tz: 'Asia/Shanghai' },
  { city: '东京', tz: 'Asia/Tokyo' },
  { city: '伦敦', tz: 'Europe/London' },
  { city: '纽约', tz: 'America/New_York' },
  { city: '旧金山', tz: 'America/Los_Angeles' },
  { city: '巴黎', tz: 'Europe/Paris' },
  { city: '悉尼', tz: 'Australia/Sydney' },
  { city: '迪拜', tz: 'Asia/Dubai' },
]

const DEV_QUOTES = [
  { text: '简单是可靠的先决条件。', author: 'Edsger W. Dijkstra' },
  { text: '任何傻瓜都能写出计算机能理解的代码。优秀的程序员能写出人类能理解的代码。', author: 'Martin Fowler' },
  { text: '先让它工作，再让它正确，最后让它快速。', author: 'Kent Beck' },
  { text: '代码本身是最好的文档。', author: 'Steve McConnell' },
  { text: '过早的优化是万恶之源。', author: 'Donald Knuth' },
  { text: '没有什么比一个临时的解决方案更持久。', author: '《计算机程序设计艺术》' },
  { text: '调试一段代码比编写它要难一倍。所以如果你尽全力写了它，根据定义，你不够聪明去调试它。', author: 'Brian Kernighan' },
  { text: '最好的错误信息是那些根本不会出现的错误。', author: 'Thomas Fuchs' },
  { text: '程序必须为人而写，只是顺便给机器执行。', author: 'Harold Abelson' },
  { text: '抽象不是为了消除细节，而是为了创造可以安全忽略细节的层次。', author: 'Edsger W. Dijkstra' },
  { text: '今天的好代码胜过明天的完美架构。', author: '匿名' },
  { text: '如果初始化很难，那说明设计有问题。', author: 'Rich Hickey' },
  { text: '经验是你得到你想要的东西之后获得的东西。', author: 'Oscar Wilde' },
  { text: '任何足够先进的技术都与魔法无异。', author: 'Arthur C. Clarke' },
  { text: '软件就像建筑——如果太大，就很难保持连贯。', author: 'Joel Spolsky' },
]

const FUN_FACTS = [
  '蜂蜜永远不会变质，考古学家发现了3000年前的蜂蜜仍可食用。',
  '章鱼有三颗心脏，蓝色的血液，以及九个大脑。',
  '香蕉在植物学上被归类为浆果，而草莓不是。',
  '人类DNA有50%与香蕉相同。',
  '地球上的树木数量比银河系中的恒星还多。',
  '火烈鸟天生是灰色的，它们从食物中获取粉色。',
  '奶牛有最好的朋友，分开时会感到压力。',
  '企鹅向对方求婚时会送一颗鹅卵石。',
  '世界上最古老的树大约有5000年历史。',
  '蜗牛可以睡三年。',
]

// ---------- 工具函数 ----------
const fmtPrice = (n: number): string => {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

const fmtPct = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

const fmtNum = (n: number, digits = 2): string =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits })

const fmtCompact = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

const weatherCodeText = (code: number): string => {
  const map: Record<number, string> = {
    0: '晴', 1: '少云', 2: '多云', 3: '阴',
    45: '雾', 48: '冻雾',
    51: '小雨', 53: '小雨', 55: '中雨',
    56: '冻雨', 57: '冻雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '冻雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    77: '雪粒',
    80: '阵雨', 81: '阵雨', 82: '暴雨',
    85: '阵雪', 86: '阵雪',
    95: '雷暴', 96: '雷暴', 99: '雷暴',
  }
  return map[code] ?? '—'
}

const aqiLevel = (aqi: number): { label: string; color: string } => {
  if (aqi <= 50) return { label: '优', color: '#10b981' }
  if (aqi <= 100) return { label: '良', color: '#84cc16' }
  if (aqi <= 150) return { label: '轻度污染', color: '#f59e0b' }
  if (aqi <= 200) return { label: '中度污染', color: '#ef4444' }
  if (aqi <= 300) return { label: '重度污染', color: '#8b5cf6' }
  return { label: '严重污染', color: '#7f1d1d' }
}

const lonToX = (lon: number, width: number): number => ((lon + 180) / 360) * width
const latToY = (lat: number, height: number): number => ((90 - lat) / 180) * height

async function fetchWithTimeout(url: string, timeout = 12000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ---------- 简化世界地图 SVG ----------
const MAP_W = 360
const MAP_H = 180
function SimplifiedWorldMap() {
  return (
    <svg
      className="wp-iss-world"
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="wp-iss-grid">
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line key={`lat${lat}`} x1={0} y1={latToY(lat, MAP_H)} x2={MAP_W} y2={latToY(lat, MAP_H)} />
        ))}
        {[-120, -60, 0, 60, 120].map((lon) => (
          <line key={`lon${lon}`} x1={lonToX(lon, MAP_W)} y1={0} x2={lonToX(lon, MAP_W)} y2={MAP_H} />
        ))}
      </g>
      <g>
        <path d="M30,45 Q40,35 60,38 Q80,40 95,55 Q100,70 85,85 Q70,90 55,82 Q40,75 35,60 Z" />
        <path d="M75,95 Q82,100 85,115 Q82,135 75,150 Q68,155 65,140 Q68,115 72,98 Z" />
        <path d="M160,45 Q175,40 185,48 Q188,55 180,62 Q170,60 162,55 Z" />
        <path d="M165,70 Q180,68 188,80 Q190,100 182,120 Q175,130 168,120 Q162,100 163,85 Z" />
        <path d="M185,40 Q220,35 260,42 Q290,50 300,65 Q295,78 270,80 Q230,75 200,70 Q188,60 185,50 Z" />
        <path d="M260,85 Q275,82 285,90 Q288,98 278,100 Q268,98 262,92 Z" />
        <path d="M285,110 Q305,108 318,118 Q320,128 308,132 Q290,130 283,120 Z" />
      </g>
    </svg>
  )
}

// ---------- 子组件：数据卡片 ----------
interface CardProps {
  title: string
  tag?: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const WPCard = memo(function WPCard({ title, tag, icon, children, className = '', onClick }: CardProps) {
  return (
    <div className={`wp-card ${className}`} onClick={onClick}>
      <div className="wp-card-head">
        <div className="wp-card-title">
          {icon}
          <span>{title}</span>
        </div>
        {tag && <span className="wp-card-tag">{tag}</span>}
      </div>
      {children}
    </div>
  )
})

const Skeleton = ({ count = 3 }: { count?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, justifyContent: 'center' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="wp-skel" style={{ width: `${70 + (i % 3) * 10}%` }} />
    ))}
  </div>
)

const ErrorState = ({ msg }: { msg: string }) => (
  <div className="wp-error-state">
    <span>⚠</span>
    <span>{msg}</span>
  </div>
)

// ---------- 主组件 ----------
function WorldPulseBase() {
  const [crypto, setCrypto] = useState<CryptoCoin[]>([])
  const [cryptoLoading, setCryptoLoading] = useState(true)
  const [cryptoError, setCryptoError] = useState('')

  const [weather, setWeather] = useState<WeatherData[]>([])
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState('')

  const [airQuality, setAirQuality] = useState<AirQualityData[]>([])
  const [airQualityLoading, setAirQualityLoading] = useState(true)
  const [airQualityError, setAirQualityError] = useState('')

  const [iss, setIss] = useState<ISSPosition | null>(null)
  const [issError, setIssError] = useState('')

  const [rates, setRates] = useState<Record<string, number>>({})
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState('')

  const [hnStories, setHnStories] = useState<HNStory[]>([])
  const [hnLoading, setHnLoading] = useState(true)
  const [hnError, setHnError] = useState('')

  const [githubTrending, setGithubTrending] = useState<GitHubRepo[]>([])
  const [githubLoading, setGithubLoading] = useState(true)
  const [githubError, setGithubError] = useState('')

  const [quote] = useState(() => DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)])
  const [funFact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])

  const [now, setNow] = useState(() => Date.now())
  const [lastRefresh, setLastRefresh] = useState(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)

  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'weather' | 'tech'>('all')

  const flashRef = useRef<HTMLDivElement>(null)

  const loadCrypto = useCallback(async () => {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(
        ','
      )}&order=market_cap_desc&price_change_percentage=24h`
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CryptoCoin[] = await res.json()
      setCrypto(data)
      setCryptoError('')
    } catch (e) {
      setCryptoError(e instanceof Error ? e.message : '获取失败')
    } finally {
      setCryptoLoading(false)
    }
  }, [])

  const loadWeather = useCallback(async () => {
    try {
      const lat = WEATHER_CITIES.map((c) => c.lat).join(',')
      const lon = WEATHER_CITIES.map((c) => c.lon).join(',')
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day`
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: WeatherData[] = WEATHER_CITIES.map((_, i) => {
        const cur = Array.isArray(data.current) ? data.current[i] : data.current
        return {
          temperature: cur?.temperature_2m ?? 0,
          windspeed: cur?.wind_speed_10m ?? 0,
          humidity: cur?.relative_humidity_2m ?? 0,
          weatherCode: cur?.weather_code ?? 0,
          isDay: cur?.is_day === 1,
        }
      })
      setWeather(list)
      setWeatherError('')
    } catch (e) {
      setWeatherError(e instanceof Error ? e.message : '获取失败')
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  const loadAirQuality = useCallback(async () => {
    try {
      const lat = AIR_QUALITY_CITIES.map((c) => c.lat).join(',')
      const lon = AIR_QUALITY_CITIES.map((c) => c.lon).join(',')
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,o3,no2`
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: AirQualityData[] = AIR_QUALITY_CITIES.map((_, i) => {
        const cur = Array.isArray(data.current) ? data.current[i] : data.current
        return {
          aqi: cur?.european_aqi ?? 0,
          pm25: cur?.pm2_5 ?? 0,
          pm10: cur?.pm10 ?? 0,
          o3: cur?.o3 ?? 0,
          no2: cur?.no2 ?? 0,
        }
      })
      setAirQuality(list)
      setAirQualityError('')
    } catch (e) {
      setAirQualityError(e instanceof Error ? e.message : '获取失败')
    } finally {
      setAirQualityLoading(false)
    }
  }, [])

  const loadISS = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('https://api.wheretheiss.at/v1/satellites/25544', 8000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setIss({
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        velocity: data.velocity,
        timestamp: data.timestamp,
      })
      setIssError('')
    } catch (e) {
      setIssError(e instanceof Error ? e.message : '获取失败')
    }
  }, [])

  const loadRates = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`https://open.er-api.com/v6/latest/${RATE_BASE}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const picked: Record<string, number> = {}
      RATE_TARGETS.forEach((t) => {
        if (data.rates?.[t]) picked[t] = data.rates[t]
      })
      setRates(picked)
      setRatesError('')
    } catch (e) {
      setRatesError(e instanceof Error ? e.message : '获取失败')
    } finally {
      setRatesLoading(false)
    }
  }, [])

  const loadHN = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const ids: number[] = await res.json()
      const top = ids.slice(0, 8)
      const stories = await Promise.all(
        top.map(async (id) => {
          const r = await fetchWithTimeout(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`
          )
          return r.json()
        })
      )
      setHnStories(stories.filter((s) => s && s.title))
      setHnError('')
    } catch (e) {
      setHnError(e instanceof Error ? e.message : '获取失败')
    } finally {
      setHnLoading(false)
    }
  }, [])

  const loadGitHubTrending = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(
        'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=6'
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGithubTrending(data.items || [])
      setGithubError('')
    } catch (e) {
      setGithubError(e instanceof Error ? e.message : '获取失败')
    } finally {
      setGithubLoading(false)
    }
  }, [])

  const loadAll = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true)
      await Promise.allSettled([
        loadCrypto(), 
        loadWeather(), 
        loadAirQuality(),
        loadISS(), 
        loadRates(), 
        loadHN(),
        loadGitHubTrending(),
      ])
      setLastRefresh(Date.now())
      if (manual) {
        setRefreshing(false)
        if (flashRef.current) {
          flashRef.current.classList.remove('wp-flash')
          void flashRef.current.offsetWidth
          flashRef.current.classList.add('wp-flash')
        }
      }
    },
    [loadCrypto, loadWeather, loadAirQuality, loadISS, loadRates, loadHN, loadGitHubTrending]
  )

  useEffect(() => {
    loadAll()
    const tickClock = setInterval(() => setNow(Date.now()), 1000)
    const tickISS = setInterval(loadISS, 5000)
    const tickCrypto = setInterval(loadCrypto, 60000)
    const tickWeather = setInterval(loadWeather, 300000)
    const tickAirQuality = setInterval(loadAirQuality, 600000)
    const tickRates = setInterval(loadRates, 1800000)
    const tickHN = setInterval(loadHN, 600000)
    const tickGitHub = setInterval(loadGitHubTrending, 1800000)
    return () => {
      clearInterval(tickClock)
      clearInterval(tickISS)
      clearInterval(tickCrypto)
      clearInterval(tickWeather)
      clearInterval(tickAirQuality)
      clearInterval(tickRates)
      clearInterval(tickHN)
      clearInterval(tickGitHub)
    }
  }, [loadAll, loadCrypto, loadWeather, loadAirQuality, loadISS, loadRates, loadHN, loadGitHubTrending])

  const hasError = cryptoError && weatherError && issError && ratesError && hnError
  const utcTime = new Date(now).toUTCString().slice(17, 25)
  const sinceRefresh = Math.max(0, Math.floor((now - lastRefresh) / 1000))

  const totalDataSources = 7
  const onlineSources = [
    !cryptoError && !cryptoLoading,
    !weatherError && !weatherLoading,
    !airQualityError && !airQualityLoading,
    !issError && !!iss,
    !ratesError && !ratesLoading,
    !hnError && !hnLoading,
    !githubError && !githubLoading,
  ].filter(Boolean).length

  return (
    <div className="wp-root" ref={flashRef}>
      <div className="wp-topbar">
        <div className="wp-brand">
          <div className="wp-brand-mark">
            <span className="wp-pulse-dot" />
          </div>
          <div>
            <div className="wp-brand-title">WorldPulse</div>
            <div className="wp-brand-sub">Live Global Intelligence Dashboard</div>
          </div>
        </div>
        <div className="wp-topbar-right">
          <div className="wp-utc-clock">
            <span className="wp-utc-label">UTC</span>
            {utcTime}
          </div>
          <div className={`wp-status-pill ${hasError ? 'wp-error' : ''}`}>
            <span className="wp-live-dot" />
            {onlineSources}/{totalDataSources} 在线 · {sinceRefresh}s
          </div>
          <button
            className={`wp-refresh-btn ${refreshing ? 'wp-spinning' : ''}`}
            onClick={() => loadAll(true)}
            aria-label="刷新所有数据"
          >
            <RefreshCw size={12} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <div className="wp-tabs">
        {[
          { id: 'all', label: '全部', icon: <BarChart3 size={12} /> },
          { id: 'crypto', label: '金融', icon: <Bitcoin size={12} /> },
          { id: 'weather', label: '环境', icon: <ThermometerSun size={12} /> },
          { id: 'tech', label: '科技', icon: <Zap size={12} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`wp-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="wp-grid">
        {(activeTab === 'all' || activeTab === 'crypto') && (
          <>
            <WPCard
              title="加密货币市场"
              tag="COINGECKO · 24H"
              icon={<Bitcoin size={13} />}
              className="wp-span-4 wp-row-2"
            >
              {cryptoLoading ? (
                <Skeleton count={6} />
              ) : cryptoError ? (
                <ErrorState msg={cryptoError} />
              ) : (
                <div className="wp-crypto-grid">
                  {crypto.map((coin) => {
                    const meta = CRYPTO_META[coin.id] ?? { color: '#8b7cf0', letter: '?' }
                    const up = coin.price_change_percentage_24h >= 0
                    return (
                      <div className="wp-crypto-row" key={coin.id}>
                        <div className="wp-crypto-left">
                          <div className="wp-crypto-badge" style={{ background: meta.color }}>
                            {meta.letter}
                          </div>
                          <div>
                            <div className="wp-crypto-name">{coin.name}</div>
                            <div className="wp-crypto-symbol">
                              {coin.symbol.toUpperCase()} · ${fmtCompact(coin.market_cap)} MC
                            </div>
                          </div>
                        </div>
                        <div className="wp-crypto-right">
                          <div className="wp-crypto-price">${fmtPrice(coin.current_price)}</div>
                          <div className={`wp-crypto-change ${up ? 'up' : 'down'}`}>
                            {up ? '▲' : '▼'} {fmtPct(coin.price_change_percentage_24h)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </WPCard>

            <WPCard
              title={`汇率 · 1 ${RATE_BASE}`}
              tag="ER-API · 实时"
              icon={<DollarSign size={13} />}
              className="wp-span-3"
            >
              {ratesLoading ? (
                <Skeleton count={6} />
              ) : ratesError ? (
                <ErrorState msg={ratesError} />
              ) : (
                <div>
                  {RATE_TARGETS.filter((t) => rates[t]).map((t) => (
                    <div className="wp-rate-row" key={t}>
                      <span className="wp-rate-pair">
                        <b>{RATE_BASE}</b> → {t}
                      </span>
                      <span className="wp-rate-val">{fmtNum(rates[t], 4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </WPCard>
          </>
        )}

        {(activeTab === 'all' || activeTab === 'weather') && (
          <>
            <WPCard
              title="天气 · 全球城市"
              tag="OPEN-METEO"
              icon={<Cloud size={13} />}
              className="wp-span-5 wp-row-2"
            >
              {weatherLoading ? (
                <Skeleton count={6} />
              ) : weatherError ? (
                <ErrorState msg={weatherError} />
              ) : weather.length === 0 ? (
                <ErrorState msg="无数据" />
              ) : (
                <>
                  <div className="wp-weather-city" style={{ marginBottom: 14 }}>
                    <div className="wp-weather-city-name">
                      {weather[FEATURED_CITY_INDEX].isDay ? <Sun size={15} /> : <Moon size={15} />}
                      {WEATHER_CITIES[FEATURED_CITY_INDEX].name}
                    </div>
                    <div className="wp-weather-city-temp">
                      {Math.round(weather[FEATURED_CITY_INDEX].temperature)}°C
                    </div>
                    <div className="wp-weather-city-meta">
                      <span>
                        <Wind size={10} style={{ verticalAlign: '-1px' }} />{' '}
                        {Math.round(weather[FEATURED_CITY_INDEX].windspeed)} km/h
                      </span>
                      <span>
                        <Droplets size={10} style={{ verticalAlign: '-1px' }} />{' '}
                        {weather[FEATURED_CITY_INDEX].humidity}%
                      </span>
                      <span>{weatherCodeText(weather[FEATURED_CITY_INDEX].weatherCode)}</span>
                    </div>
                  </div>
                  <div className="wp-weather-list">
                    {weather.slice(1).map((w, i) => (
                      <div className="wp-weather-item" key={i}>
                        <div className="wp-weather-item-city">
                          {w.isDay ? <Sun size={12} /> : <Moon size={12} />}
                          {WEATHER_CITIES[i + 1].name}
                        </div>
                        <div className="wp-weather-item-cond">
                          {weatherCodeText(w.weatherCode)}
                        </div>
                        <div className="wp-weather-item-temp">{Math.round(w.temperature)}°</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </WPCard>

            <WPCard
              title="空气质量监测"
              tag="AQI · 4城市"
              icon={<Gauge size={13} />}
              className="wp-span-3"
            >
              {airQualityLoading ? (
                <Skeleton count={4} />
              ) : airQualityError ? (
                <ErrorState msg={airQualityError} />
              ) : (
                <div className="wp-aqi-list">
                  {AIR_QUALITY_CITIES.map((city, i) => {
                    const aq = airQuality[i]
                    const level = aqiLevel(aq?.aqi || 0)
                    return (
                      <div className="wp-aqi-item" key={city.name}>
                        <div className="wp-aqi-city">
                          <div className="wp-aqi-dot" style={{ background: level.color }} />
                          {city.name}
                        </div>
                        <div className="wp-aqi-value" style={{ color: level.color }}>
                          {Math.round(aq?.aqi || 0)}
                          <span className="wp-aqi-label">{level.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </WPCard>
          </>
        )}

        {(activeTab === 'all' || activeTab === 'weather') && (
          <WPCard
            title="国际空间站 实时位置"
            tag={`ALT ${iss ? fmtNum(iss.altitude, 1) + 'KM' : '—'}`}
            icon={<Satellite size={13} />}
            className="wp-span-4 wp-row-2"
          >
            <div className="wp-iss-map">
              <SimplifiedWorldMap />
              {iss && !issError && (
                <svg
                  className="wp-iss-world"
                  viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <circle
                    className="wp-iss-marker-ring wp-iss-pulse"
                    cx={lonToX(iss.longitude, MAP_W)}
                    cy={latToY(iss.latitude, MAP_H)}
                    r={5}
                  />
                  <circle
                    className="wp-iss-marker"
                    cx={lonToX(iss.longitude, MAP_W)}
                    cy={latToY(iss.latitude, MAP_H)}
                    r={2.5}
                  />
                </svg>
              )}
              <div className="wp-iss-info">
                <span>
                  纬度 <b>{iss ? fmtNum(iss.latitude, 3) : '—'}</b>
                </span>
                <span>
                  经度 <b>{iss ? fmtNum(iss.longitude, 3) : '—'}</b>
                </span>
                <span>
                  速度 <b>{iss ? fmtNum(iss.velocity, 0) + ' km/h' : '—'}</b>
                </span>
                <span>
                  高度 <b>{iss ? fmtNum(iss.altitude, 1) + ' km' : '—'}</b>
                </span>
              </div>
            </div>
            {issError && !iss && <ErrorState msg={issError} />}
          </WPCard>
        )}

        {(activeTab === 'all' || activeTab === 'tech') && (
          <>
            <WPCard
              title="Hacker News 热榜"
              tag="TOP 6"
              icon={<Flame size={13} />}
              className="wp-span-4"
            >
              {hnLoading ? (
                <Skeleton count={4} />
              ) : hnError ? (
                <ErrorState msg={hnError} />
              ) : (
                <div className="wp-hn-list">
                  {hnStories.slice(0, 6).map((s, i) => (
                    <a
                      className="wp-hn-item"
                      key={s.id}
                      href={s.url || `https://news.ycombinator.com/item?id=${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="wp-hn-rank">{i + 1}</span>
                      <div className="wp-hn-body">
                        <div className="wp-hn-title">{s.title}</div>
                        <div className="wp-hn-meta">
                          <span style={{ color: '#f97316' }}>▲ {s.score}</span>
                          <span><MessageSquare size={10} style={{ verticalAlign: '-1px' }} /> {s.descendants ?? 0}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </WPCard>

            <WPCard
              title="GitHub 热门仓库"
              tag="TRENDING"
              icon={<Code2 size={13} />}
              className="wp-span-4"
            >
              {githubLoading ? (
                <Skeleton count={4} />
              ) : githubError ? (
                <ErrorState msg={githubError} />
              ) : (
                <div className="wp-github-list">
                  {githubTrending.slice(0, 6).map((repo) => (
                    <a
                      className="wp-github-item"
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="wp-github-name">
                        <Users size={11} style={{ verticalAlign: '-1px' }} />
                        {repo.full_name}
                      </div>
                      <div className="wp-github-desc">{repo.description?.slice(0, 60) || '无描述'}</div>
                      <div className="wp-github-meta">
                        {repo.language && <span className="wp-github-lang">{repo.language}</span>}
                        <span>★ {fmtCompact(repo.stargazers_count)}</span>
                        <span>⑂ {fmtCompact(repo.forks_count)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </WPCard>
          </>
        )}

        {(activeTab === 'all') && (
          <>
            <WPCard
              title="世界时钟"
              tag="LOCAL TIME"
              icon={<Compass size={13} />}
              className="wp-span-4 wp-row-2"
            >
              <div>
                {WORLD_CLOCKS.map((c) => {
                  const time = new Date(now).toLocaleTimeString('zh-CN', {
                    timeZone: c.tz,
                    hour12: false,
                  })
                  const date = new Date(now).toLocaleDateString('zh-CN', {
                    timeZone: c.tz,
                    month: '2-digit',
                    day: '2-digit',
                    weekday: 'short',
                  })
                  const hour = parseInt(time.slice(0, 2), 10)
                  const isDay = hour >= 6 && hour < 19
                  return (
                    <div className="wp-clock-row" key={c.tz}>
                      <div className="wp-clock-city">
                        <span className={`wp-clock-dot ${isDay ? 'day' : 'night'}`} />
                        <span>{c.city}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="wp-clock-time">{time}</div>
                        <div className="wp-clock-date">{date}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </WPCard>

            <WPCard
              title="每日开发者语录"
              tag="DAILY"
              icon={<Sunrise size={13} />}
              className="wp-span-6"
            >
              <div className="wp-quote">
                <div className="wp-quote-mark">"</div>
                <div className="wp-quote-text">{quote.text}</div>
                <div className="wp-quote-author">— {quote.author}</div>
              </div>
            </WPCard>

            <WPCard
              title="冷知识"
              tag="FUN FACT"
              icon={<Radio size={13} />}
              className="wp-span-4"
            >
              <div className="wp-funfact">
                <div className="wp-funfact-icon">💡</div>
                <div className="wp-funfact-text">{funFact}</div>
              </div>
            </WPCard>

            <WPCard
              title="数据源状态"
              tag="HEALTH MONITOR"
              icon={<Activity size={13} />}
              className="wp-span-4"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                {[
                  { name: 'CoinGecko 加密货币', ok: !cryptoError && !cryptoLoading },
                  { name: 'Open-Meteo 天气', ok: !weatherError && !weatherLoading },
                  { name: 'Open-Meteo 空气质量', ok: !airQualityError && !airQualityLoading },
                  { name: 'wheretheiss.at ISS', ok: !issError && !!iss },
                  { name: 'ER-API 汇率', ok: !ratesError && !ratesLoading },
                  { name: 'Hacker News', ok: !hnError && !hnLoading },
                  { name: 'GitHub API', ok: !githubError && !githubLoading },
                ].map((src) => (
                  <div
                    key={src.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span style={{ color: 'var(--wp-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe2 size={11} />
                      {src.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        fontWeight: 600,
                        color: src.ok ? 'var(--wp-up)' : 'var(--wp-down)',
                      }}
                    >
                      {src.ok ? '● ONLINE' : '● OFFLINE'}
                    </span>
                  </div>
                ))}
              </div>
            </WPCard>
          </>
        )}
      </div>
    </div>
  )
}

const WorldPulse = memo(WorldPulseBase)
export default WorldPulse
