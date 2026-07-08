import { useState, useEffect, useCallback, useRef, memo } from 'react'
import '../styles/worldpulse.css'
import {
  Activity, Bitcoin, Cloud, Compass, DollarSign, Globe2, RefreshCw,
  Satellite, TrendingUp, Wind, Droplets, Sunrise, Sun, Moon,
} from 'lucide-react'

/* ============================================================
   WorldPulse — 实时全球情报仪表盘
   所有数据来源均为免费、无需 API Key、支持 CORS 的公开接口：
   - 加密货币：CoinGecko (api.coingecko.com)
   - 天气：Open-Meteo (api.open-meteo.com)
   - 国际空间站位置：Open Notify (api.wheretheiss.at)
   - 汇率：open.er-api.com
   - Hacker News 热榜：hacker-news.firebaseio.com
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

// ---------- 配置 ----------
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin']

const CRYPTO_META: Record<string, { color: string; letter: string }> = {
  bitcoin: { color: '#f7931a', letter: '₿' },
  ethereum: { color: '#627eea', letter: 'Ξ' },
  solana: { color: '#9945ff', letter: '◎' },
  binancecoin: { color: '#f3ba2f', letter: 'B' },
}

const WEATHER_CITIES: WeatherCity[] = [
  { name: '上海', lat: 31.23, lon: 121.47, timezone: 'Asia/Shanghai' },
  { name: '东京', lat: 35.68, lon: 139.69, timezone: 'Asia/Tokyo' },
  { name: '纽约', lat: 40.71, lon: -74.01, timezone: 'America/New_York' },
  { name: '伦敦', lat: 51.51, lon: -0.13, timezone: 'Europe/London' },
  { name: '巴黎', lat: 48.85, lon: 2.35, timezone: 'Europe/Paris' },
  { name: '悉尼', lat: -33.87, lon: 151.21, timezone: 'Australia/Sydney' },
]

const FEATURED_CITY_INDEX = 0 // 突出显示上海

const RATE_BASE = 'USD'
const RATE_TARGETS = ['CNY', 'EUR', 'JPY', 'GBP', 'HKD']

const WORLD_CLOCKS = [
  { city: '上海', tz: 'Asia/Shanghai' },
  { city: '东京', tz: 'Asia/Tokyo' },
  { city: '伦敦', tz: 'Europe/London' },
  { city: '纽约', tz: 'America/New_York' },
  { city: '旧金山', tz: 'America/Los_Angeles' },
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

// WMO 天气码 -> 中文描述
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

// 经纬度 -> 地图坐标 (等距圆柱投影)
const lonToX = (lon: number, width: number): number => ((lon + 180) / 360) * width
const latToY = (lat: number, height: number): number => ((90 - lat) / 180) * height

// 带超时的 fetch
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
// 使用等距圆柱投影，宽度 360 经度 -> 0..360, 高度 180 纬度
const MAP_W = 360
const MAP_H = 180
// 极简化的陆地轮廓（仅用于视觉参考，非精确地理）
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
      {/* 简化的大陆轮廓 */}
      <g>
        {/* 北美 */}
        <path d="M30,45 Q40,35 60,38 Q80,40 95,55 Q100,70 85,85 Q70,90 55,82 Q40,75 35,60 Z" />
        {/* 南美 */}
        <path d="M75,95 Q82,100 85,115 Q82,135 75,150 Q68,155 65,140 Q68,115 72,98 Z" />
        {/* 欧洲 */}
        <path d="M160,45 Q175,40 185,48 Q188,55 180,62 Q170,60 162,55 Z" />
        {/* 非洲 */}
        <path d="M165,70 Q180,68 188,80 Q190,100 182,120 Q175,130 168,120 Q162,100 163,85 Z" />
        {/* 亚洲 */}
        <path d="M185,40 Q220,35 260,42 Q290,50 300,65 Q295,78 270,80 Q230,75 200,70 Q188,60 185,50 Z" />
        {/* 东南亚 */}
        <path d="M260,85 Q275,82 285,90 Q288,98 278,100 Q268,98 262,92 Z" />
        {/* 澳洲 */}
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
}

const WPCard = memo(function WPCard({ title, tag, icon, children, className = '' }: CardProps) {
  return (
    <div className={`wp-card ${className}`}>
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

  const [iss, setIss] = useState<ISSPosition | null>(null)
  const [issError, setIssError] = useState('')

  const [rates, setRates] = useState<Record<string, number>>({})
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState('')

  const [hnStories, setHnStories] = useState<HNStory[]>([])
  const [hnLoading, setHnLoading] = useState(true)
  const [hnError, setHnError] = useState('')

  const [quote] = useState(() => DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)])

  const [now, setNow] = useState(() => Date.now())
  const [lastRefresh, setLastRefresh] = useState(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)

  // 用于触发数据闪烁高亮
  const flashRef = useRef<HTMLDivElement>(null)

  // --- 加密货币 (CoinGecko, 每 60s) ---
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

  // --- 天气 (Open-Meteo, 每 5min) ---
  const loadWeather = useCallback(async () => {
    try {
      const lat = WEATHER_CITIES.map((c) => c.lat).join(',')
      const lon = WEATHER_CITIES.map((c) => c.lon).join(',')
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day`
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // Open-Meteo 对多坐标返回 current 数组（当传入多个坐标时）
      const list: WeatherData[] = WEATHER_CITIES.map((_, i) => {
        const cur =
          Array.isArray(data.current) ? data.current[i] : data.current
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

  // --- ISS 位置 (api.wheretheiss.at, 每 5s) ---
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

  // --- 汇率 (open.er-api.com, 每 30min) ---
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

  // --- Hacker News 热榜 (每 10min) ---
  const loadHN = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const ids: number[] = await res.json()
      const top = ids.slice(0, 6)
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

  const loadAll = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true)
      await Promise.allSettled([loadCrypto(), loadWeather(), loadISS(), loadRates(), loadHN()])
      setLastRefresh(Date.now())
      if (manual) {
        setRefreshing(false)
        if (flashRef.current) {
          flashRef.current.classList.remove('wp-flash')
          // 强制 reflow 重新触发动画
          void flashRef.current.offsetWidth
          flashRef.current.classList.add('wp-flash')
        }
      }
    },
    [loadCrypto, loadWeather, loadISS, loadRates, loadHN]
  )

  // 初始加载 + 定时刷新
  useEffect(() => {
    loadAll()
    const tickClock = setInterval(() => setNow(Date.now()), 1000)
    const tickISS = setInterval(loadISS, 5000)
    const tickCrypto = setInterval(loadCrypto, 60000)
    const tickWeather = setInterval(loadWeather, 300000)
    const tickRates = setInterval(loadRates, 1800000)
    const tickHN = setInterval(loadHN, 600000)
    return () => {
      clearInterval(tickClock)
      clearInterval(tickISS)
      clearInterval(tickCrypto)
      clearInterval(tickWeather)
      clearInterval(tickRates)
      clearInterval(tickHN)
    }
  }, [loadAll, loadCrypto, loadWeather, loadISS, loadRates, loadHN])

  // 计算整体状态
  const hasError = cryptoError && weatherError && issError && ratesError && hnError
  const utcTime = new Date(now).toUTCString().slice(17, 25) // HH:MM:SS GMT
  const sinceRefresh = Math.max(0, Math.floor((now - lastRefresh) / 1000))

  return (
    <div className="wp-root" ref={flashRef}>
      {/* 顶栏 */}
      <div className="wp-topbar">
        <div className="wp-brand">
          <div className="wp-brand-mark">
            <span className="wp-pulse-dot" />
          </div>
          <div>
            <div className="wp-brand-title">WorldPulse</div>
            <div className="wp-brand-sub">Live Global Intelligence</div>
          </div>
        </div>
        <div className="wp-topbar-right">
          <div className="wp-utc-clock">
            <span className="wp-utc-label">UTC</span>
            {utcTime}
          </div>
          <div className={`wp-status-pill ${hasError ? 'wp-error' : ''}`}>
            <span className="wp-live-dot" />
            {hasError ? '部分离线' : `LIVE · ${sinceRefresh}s`}
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

      {/* 主网格 */}
      <div className="wp-grid">
        {/* 加密货币 */}
        <WPCard
          title="加密货币市场"
          tag="COINGECKO · 24H"
          icon={<Bitcoin size={13} />}
          className="wp-span-4 wp-row-2"
        >
          {cryptoLoading ? (
            <Skeleton count={4} />
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
                      <div
                        className="wp-crypto-badge"
                        style={{ background: meta.color }}
                      >
                        {meta.letter}
                      </div>
                      <div>
                        <div className="wp-crypto-name">{coin.name}</div>
                        <div className="wp-crypto-symbol">
                          {coin.symbol.toUpperCase()} · USD
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

        {/* 天气 - 突出城市 */}
        <WPCard
          title="天气 · 全球城市"
          tag="OPEN-METEO"
          icon={<Cloud size={13} />}
          className="wp-span-5 wp-row-2"
        >
          {weatherLoading ? (
            <Skeleton count={4} />
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

        {/* ISS 实时位置 */}
        <WPCard
          title="国际空间站 实时位置"
          tag={`ALT ${iss ? fmtNum(iss.altitude, 1) + 'KM' : '—'}`}
          icon={<Satellite size={13} />}
          className="wp-span-3 wp-row-2"
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
                  className="wp-iss-marker-ring"
                  cx={lonToX(iss.longitude, MAP_W)}
                  cy={latToY(iss.latitude, MAP_H)}
                  r={3}
                />
                <circle
                  className="wp-iss-marker"
                  cx={lonToX(iss.longitude, MAP_W)}
                  cy={latToY(iss.latitude, MAP_H)}
                  r={2.2}
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
            </div>
          </div>
          {issError && !iss && <ErrorState msg={issError} />}
        </WPCard>

        {/* 汇率 */}
        <WPCard
          title={`汇率 · 1 ${RATE_BASE}`}
          tag="ER-API"
          icon={<DollarSign size={13} />}
          className="wp-span-4"
        >
          {ratesLoading ? (
            <Skeleton count={5} />
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

        {/* 世界时钟 */}
        <WPCard
          title="世界时钟"
          tag="LOCAL TIME"
          icon={<Compass size={13} />}
          className="wp-span-4"
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

        {/* Hacker News 热榜 */}
        <WPCard
          title="Hacker News 热榜"
          tag="TOP 6"
          icon={<TrendingUp size={13} />}
          className="wp-span-4"
        >
          {hnLoading ? (
            <Skeleton count={4} />
          ) : hnError ? (
            <ErrorState msg={hnError} />
          ) : (
            <div className="wp-hn-list">
              {hnStories.slice(0, 4).map((s, i) => (
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
                      {s.score} points · {s.descendants ?? 0} comments
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </WPCard>

        {/* 每日开发者语录 */}
        <WPCard
          title="每日开发者语录"
          tag="DAILY"
          icon={<Sunrise size={13} />}
          className="wp-span-8"
        >
          <div className="wp-quote">
            <div className="wp-quote-mark">"</div>
            <div className="wp-quote-text">{quote.text}</div>
            <div className="wp-quote-author">{quote.author}</div>
          </div>
        </WPCard>

        {/* 系统脉搏 */}
        <WPCard
          title="数据源状态"
          tag="HEALTH"
          icon={<Activity size={13} />}
          className="wp-span-4"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            {[
              { name: 'CoinGecko 加密货币', ok: !cryptoError && !cryptoLoading },
              { name: 'Open-Meteo 天气', ok: !weatherError && !weatherLoading },
              { name: 'Open Notify ISS', ok: !issError && !!iss },
              { name: 'ER-API 汇率', ok: !ratesError && !ratesLoading },
              { name: 'Hacker News', ok: !hnError && !hnLoading },
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
      </div>
    </div>
  )
}

const WorldPulse = memo(WorldPulseBase)
export default WorldPulse
