import { useState, useEffect, useCallback, memo, useRef } from 'react'

// ============ 类型定义 ============
interface WeatherData {
  temperature: number
  humidity: number
  weatherCode: number
  windSpeed: number
  description: string
  city: string
  updatedAt: number
}

interface HNItem {
  title: string
  url: string
  author: string
  points: number
  num_comments: number
  objectID: string
}

interface SystemInfo {
  browser: string
  os: string
  screen: string
  timezone: string
  language: string
  platform: string
  startTime: number
}

interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string
  description: string
  owner_login: string
}

interface CryptoPrice {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// ============ 常量配置 ============
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟
const AUTO_REFRESH_INTERVAL = 60 * 1000 // 60 秒自动刷新

const CACHE_KEYS = {
  weather: 'smarthub-weather-v1',
  hn: 'smarthub-hn-v1',
  github: 'smarthub-github-v1',
  crypto: 'smarthub-crypto-v1',
  quote: 'smarthub-quote-v1',
}

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto'
const HN_API = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5'
const GITHUB_API = 'https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=5'
const CRYPTO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'

const FALLBACK_QUOTES: { text: string; author: string }[] = [
  { text: '生活的秘诀不在于做你想做的事，而在于喜欢你必须做的事。', author: '萧伯纳' },
  { text: '伟大的事情都是由一系列小事汇聚而成的。', author: '梵高' },
  { text: '不要等待机会，而要创造机会。', author: '萧伯纳' },
  { text: '成功不是最终的，失败不是致命的，重要的是继续前进的勇气。', author: '丘吉尔' },
  { text: '在任何特定时刻，你都有能力说：这个故事不会这样结束。', author: '玛丽安娜·威廉姆森' },
  { text: '创新就是把一千件事情说不。', author: '史蒂夫·乔布斯' },
  { text: '生活的最大荣耀不在于永不跌倒，而在于每次跌倒后都能爬起来。', author: '孔子' },
  { text: '最好的准备就是今天就开始行动。', author: '佚名' },
  { text: '你的时间有限，不要浪费时间活在别人的生活里。', author: '史蒂夫·乔布斯' },
  { text: '未来属于那些相信梦想之美的人。', author: '埃莉诺·罗斯福' },
  { text: '如果你不出去走走，你就会以为这就是全世界。', author: '佚名' },
  { text: '困难是用来克服的，不是用来逃避的。', author: '佚名' },
]

const CRYPTO_META: Record<string, { name: string; symbol: string; color: string }> = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC', color: '#f7931a' },
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
  solana: { name: 'Solana', symbol: 'SOL', color: '#9945ff' },
}

// ============ 工具函数 ============
function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore
  }
}

function describeWeather(code: number): { text: string; iconType: string } {
  if (code === 0) return { text: '晴', iconType: 'sun' }
  if (code >= 1 && code <= 3) return { text: '多云', iconType: 'cloud-sun' }
  if (code >= 45 && code <= 48) return { text: '雾', iconType: 'cloud' }
  if (code >= 51 && code <= 57) return { text: '小雨', iconType: 'drizzle' }
  if (code >= 61 && code <= 67) return { text: '雨', iconType: 'rain' }
  if (code >= 71 && code <= 77) return { text: '雪', iconType: 'snow' }
  if (code >= 80 && code <= 82) return { text: '阵雨', iconType: 'rain' }
  if (code >= 95 && code <= 99) return { text: '雷阵雨', iconType: 'storm' }
  return { text: '未知', iconType: 'cloud' }
}

function detectBrowser(): string {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Unknown'
}

function detectOS(): string {
  const ua = navigator.userAgent
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Android/.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

// ============ SVG 图标组件 ============
const Icon = ({ name, size = 18, color = '#fff' }: { name: string; size?: number; color?: string }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'cloud-sun':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" />
          <path d="M12 6v1M17 8v1M5 13a4 4 0 0 1 0-8h1M10 18a4 4 0 0 0 8 0 2 2 0 0 0-4 0 2 2 0 0 1-4 0z" />
        </svg>
      )
    case 'cloud':
      return (
        <svg {...common}>
          <path d="M18 10a4 4 0 0 0-8 0 5 5 0 0 0-5 5 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 3 3 0 0 0-5-2" />
        </svg>
      )
    case 'rain':
      return (
        <svg {...common}>
          <path d="M18 10a4 4 0 0 0-8 0 5 5 0 0 0-5 5 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 3 3 0 0 0-5-2" />
          <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
        </svg>
      )
    case 'drizzle':
      return (
        <svg {...common}>
          <path d="M18 10a4 4 0 0 0-8 0 5 5 0 0 0-5 5 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 3 3 0 0 0-5-2" />
          <circle cx="9" cy="20" r="0.5" fill={color} />
          <circle cx="13" cy="21" r="0.5" fill={color} />
          <circle cx="17" cy="20" r="0.5" fill={color} />
        </svg>
      )
    case 'snow':
      return (
        <svg {...common}>
          <path d="M18 10a4 4 0 0 0-8 0 5 5 0 0 0-5 5 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 3 3 0 0 0-5-2" />
          <path d="M9 19v2M8 20h2M12 20v2M11 21h2M15 19v2M14 20h2" />
        </svg>
      )
    case 'storm':
      return (
        <svg {...common}>
          <path d="M18 10a4 4 0 0 0-8 0 5 5 0 0 0-5 5 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 3 3 0 0 0-5-2" />
          <path d="M13 16l-3 5h3l-1 3" />
        </svg>
      )
    case 'news':
      return (
        <svg {...common}>
          <path d="M4 4h12a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2H4z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M8 20h8M12 18v2" />
        </svg>
      )
    case 'github':
      return (
        <svg {...common}>
          <path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.5a3 3 0 0 0-.8-2.2c2.8-.3 5.8-1.4 5.8-6.3a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.3s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.3 5.4 2.6 5.4 2.6a4.5 4.5 0 0 0-.1 3.3A4.8 4.8 0 0 0 4 9.2c0 4.9 3 6 5.8 6.3a3 3 0 0 0-.8 2.1V22" />
        </svg>
      )
    case 'coin':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v12M9 9h4a2 2 0 0 1 0 4H9h4a2 2 0 0 1 0 4H9" />
        </svg>
      )
    case 'quote':
      return (
        <svg {...common}>
          <path d="M7 7h4v4a4 4 0 0 1-4 4H5v-4a4 4 0 0 1 4-4zM17 7h-4v4a4 4 0 0 0 4 4h2v-4a4 4 0 0 0-4-4z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
        </svg>
      )
    case 'humidity':
      return (
        <svg {...common}>
          <path d="M12 2s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z" />
        </svg>
      )
    case 'wind':
      return (
        <svg {...common}>
          <path d="M3 8h12a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h18" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 2l3 6.9 7.1.7-5.3 4.6 1.7 7L12 17l-6.5 3.2 1.7-7L1.9 9.6 9 8.9z" />
        </svg>
      )
    case 'fork':
      return (
        <svg {...common}>
          <circle cx="12" cy="18" r="2" />
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M6 8v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8M12 14v2" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'external':
      return (
        <svg {...common}>
          <path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
      )
    case 'arrow-up':
      return (
        <svg {...common}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      )
    case 'arrow-down':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 2L2 20h20L12 2zM12 9v5M12 17h.01" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}

// ============ 卡片容器样式 ============
const cardStyles = {
  base: (accent: string): React.CSSProperties => ({
    background: 'rgba(20, 20, 40, 0.6)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${accent}40`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 220,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
  }),
  hover: (accent: string): React.CSSProperties => ({
    boxShadow: `0 8px 30px ${accent}30`,
    borderColor: `${accent}80`,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  } as React.CSSProperties,
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  title: (_color: string): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 600,
    color: '#e8e8ff',
    margin: 0,
    letterSpacing: 0.3,
  }),
  iconWrap: (color: string): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    background: `${color}20`,
    border: `1px solid ${color}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  refreshBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: 12,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  } as React.CSSProperties,
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: 12,
  } as React.CSSProperties,
  error: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: '#ff7c7c',
    fontSize: 12,
    textAlign: 'center',
  } as React.CSSProperties,
}

// ============ 通用卡片壳 ============
interface CardProps {
  title: string
  icon: string
  accent: string
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  children: React.ReactNode
}

function CardShell({ title, icon, accent, isLoading, error, onRefresh, children }: CardProps) {
  const [hover, setHover] = useState(false)
  const base = cardStyles.base(accent)
  const hoverAddition = hover ? cardStyles.hover(accent) : {}
  return (
    <div
      style={{ ...base, ...hoverAddition }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={cardStyles.header}>
        <div style={cardStyles.titleRow}>
          <div style={cardStyles.iconWrap(accent)}>
            <Icon name={icon} size={16} color={accent} />
          </div>
          <h3 style={cardStyles.title(accent)}>{title}</h3>
        </div>
        <button
          onClick={onRefresh}
          style={{
            ...cardStyles.refreshBtn,
            transform: isLoading ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.6s ease',
          }}
          title="刷新"
          aria-label="刷新"
        >
          <Icon name="refresh" size={14} color="#aaa" />
        </button>
      </div>
      {isLoading && !error ? (
        <div style={cardStyles.loading}>加载中...</div>
      ) : error ? (
        <div style={cardStyles.error}>
          <Icon name="warning" size={20} color="#ff7c7c" />
          <span>{error}</span>
        </div>
      ) : (
        <div style={cardStyles.content}>{children}</div>
      )}
    </div>
  )
}

// ============ 天气卡片 ============
const WeatherCard = memo(function WeatherCard() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const accent = '#4ECCA3'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cached = getCache<WeatherData>(CACHE_KEYS.weather)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }
      const res = await fetch(WEATHER_API, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const cur = json.current
      const { text } = describeWeather(cur.weather_code)
      const weatherData: WeatherData = {
        temperature: Math.round(cur.temperature_2m * 10) / 10,
        humidity: cur.relative_humidity_2m,
        weatherCode: cur.weather_code,
        windSpeed: cur.wind_speed_10m,
        description: text,
        city: '北京',
        updatedAt: Date.now(),
      }
      setData(weatherData)
      setCache(CACHE_KEYS.weather, weatherData)
    } catch (e) {
      const fallback: WeatherData = {
        temperature: 22,
        humidity: 55,
        weatherCode: 1,
        windSpeed: 10,
        description: '多云',
        city: '北京 (本地数据)',
        updatedAt: Date.now(),
      }
      setData(fallback)
      setError('使用本地数据')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const iconType = data ? describeWeather(data.weatherCode).iconType : 'cloud'

  return (
    <CardShell title={`天气 · ${data?.city || ''}`} icon={iconType} accent={accent} isLoading={loading} error={error} onRefresh={fetchData}>
      {data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={iconType} size={40} color={accent} />
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.temperature}°
                </div>
                <div style={{ fontSize: 13, color: '#aab', marginTop: 4 }}>{data.description}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#bbc' }}>
              <Icon name="humidity" size={14} color={accent} />
              <span>湿度 </span>
              <span style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{data.humidity}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#bbc' }}>
              <Icon name="wind" size={14} color={accent} />
              <span>风速 </span>
              <span style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{data.windSpeed} km/h</span>
            </div>
          </div>
        </>
      )}
    </CardShell>
  )
})

// ============ Hacker News 卡片 ============
const HNCard = memo(function HNCard() {
  const [items, setItems] = useState<HNItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const accent = '#ff6b35'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cached = getCache<HNItem[]>(CACHE_KEYS.hn)
      if (cached) {
        setItems(cached)
        setLoading(false)
        return
      }
      const res = await fetch(HN_API, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const hits: HNItem[] = (json.hits || []).slice(0, 5).map((h: any) => ({
        title: h.title || '无标题',
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        author: h.author || 'unknown',
        points: typeof h.points === 'number' ? h.points : 0,
        num_comments: typeof h.num_comments === 'number' ? h.num_comments : 0,
        objectID: h.objectID,
      }))
      setItems(hits)
      setCache(CACHE_KEYS.hn, hits)
    } catch (e) {
      const fallback: HNItem[] = [
        { title: 'Show HN: WebLinuxOS - 浏览器中的完整 Linux 桌面', url: 'https://github.com', author: 'dev', points: 128, num_comments: 42, objectID: '1' },
        { title: 'The Rust programming language hits 1.0 milestone', url: 'https://rust-lang.org', author: 'rustacean', points: 89, num_comments: 31, objectID: '2' },
        { title: 'React 19 is released with new features', url: 'https://react.dev', author: 'react', points: 76, num_comments: 19, objectID: '3' },
        { title: 'TypeScript 5.5 released', url: 'https://typescriptlang.org', author: 'ts', points: 54, num_comments: 12, objectID: '4' },
        { title: 'AI 大模型的未来发展趋势', url: 'https://example.com', author: 'ai', points: 42, num_comments: 28, objectID: '5' },
      ]
      setItems(fallback)
      setError('使用本地数据')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <CardShell title="Hacker News" icon="news" accent={accent} isLoading={loading} error={error} onRefresh={fetchData}>
      {items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, idx) => (
            <li key={item.objectID}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                style={{
                  display: 'flex',
                  gap: 8,
                  textDecoration: 'none',
                  color: '#e8e8ff',
                  fontSize: 12.5,
                  lineHeight: 1.4,
                  padding: '4px 2px',
                  borderRadius: 4,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${accent}15`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ color: accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, minWidth: 20 }}>
                  {idx + 1}.
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {item.title}
                </span>
                <Icon name="external" size={10} color="#888" />
              </a>
              <div style={{ fontSize: 10.5, color: '#778', paddingLeft: 28, display: 'flex', gap: 10, marginTop: -2 }}>
                <span>▲ {item.points}</span>
                <span>· {item.author}</span>
                <span>· {item.num_comments} 评论</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  )
})

// ============ 系统信息卡片 ============
const SystemCard = memo(function SystemCard() {
  const [info] = useState<SystemInfo>(() => ({
    browser: detectBrowser(),
    os: detectOS(),
    screen: `${window.screen.width} × ${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: (navigator as any).platform || 'Web',
    startTime: Date.now(),
  }))
  const [now, setNow] = useState(new Date())
  const [uptime, setUptime] = useState(0)
  const accent = '#7C6CF0'

  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date())
      setUptime(Math.floor((Date.now() - info.startTime) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [info.startTime])

  const refresh = useCallback(() => {
    setNow(new Date())
  }, [])

  const rows: { label: string; value: string }[] = [
    { label: '浏览器', value: info.browser },
    { label: '系统', value: info.os },
    { label: '分辨率', value: info.screen },
    { label: '时区', value: info.timezone },
    { label: '语言', value: info.language },
    { label: '运行时长', value: formatUptime(uptime) },
  ]

  return (
    <CardShell title="系统信息" icon="monitor" accent={accent} isLoading={false} error={null} onRefresh={refresh}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        <div style={cardStyles.iconWrap(accent)}>
          <Icon name="clock" size={18} color={accent} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
            {now.toLocaleTimeString('zh-CN', { hour12: false })}
          </div>
          <div style={{ fontSize: 11, color: '#99a' }}>{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 10 }}>
            <span style={{ color: '#889' }}>{row.label}</span>
            <span style={{ color: '#e8e8ff', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  )
})

// ============ GitHub 趋势卡片 ============
const GitHubCard = memo(function GitHubCard() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const accent = '#ffffff'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cached = getCache<GitHubRepo[]>(CACHE_KEYS.github)
      if (cached) {
        setRepos(cached)
        setLoading(false)
        return
      }
      const res = await fetch(GITHUB_API, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: GitHubRepo[] = (json.items || []).slice(0, 5).map((r: any) => ({
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        stargazers_count: r.stargazers_count || 0,
        forks_count: r.forks_count || 0,
        language: r.language || 'N/A',
        description: r.description || '',
        owner_login: r.owner?.login || '',
      }))
      setRepos(list)
      setCache(CACHE_KEYS.github, list)
    } catch (e) {
      const fallback: GitHubRepo[] = [
        { name: 'freeCodeCamp', full_name: 'freeCodeCamp/freeCodeCamp', html_url: '#', stargazers_count: 400000, forks_count: 38000, language: 'JavaScript', description: '免费学习编程', owner_login: 'freeCodeCamp' },
        { name: 'awesome', full_name: 'sindresorhus/awesome', html_url: '#', stargazers_count: 320000, forks_count: 28000, language: 'Markdown', description: '精选资源列表', owner_login: 'sindresorhus' },
        { name: 'vue', full_name: 'vuejs/vue', html_url: '#', stargazers_count: 210000, forks_count: 35000, language: 'TypeScript', description: '渐进式 JavaScript 框架', owner_login: 'vuejs' },
        { name: 'react', full_name: 'facebook/react', html_url: '#', stargazers_count: 225000, forks_count: 46000, language: 'JavaScript', description: '用于构建 UI 的库', owner_login: 'facebook' },
        { name: 'linux', full_name: 'torvalds/linux', html_url: '#', stargazers_count: 185000, forks_count: 54000, language: 'C', description: 'Linux 内核源码', owner_login: 'torvalds' },
      ]
      setRepos(fallback)
      setError('使用本地数据')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <CardShell title="GitHub 热门" icon="github" accent={accent} isLoading={loading} error={error} onRefresh={fetchData}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {repos.map((repo) => (
          <a
            key={repo.full_name}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit', padding: 4, borderRadius: 6, transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: '#e8e8ff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                {repo.full_name}
              </span>
              <Icon name="external" size={10} color="#888" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, fontSize: 10.5, color: '#99a', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#4ECCA3', display: 'inline-block' }} />
                {repo.language}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="star" size={10} color="#f5c542" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#f5c542' }}>{formatNumber(repo.stargazers_count)}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="fork" size={10} color="#888" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatNumber(repo.forks_count)}</span>
              </span>
            </div>
          </a>
        ))}
      </div>
    </CardShell>
  )
})

// ============ 加密货币卡片 ============
const CryptoCard = memo(function CryptoCard() {
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const accent = '#f5c542'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cached = getCache<CryptoPrice[]>(CACHE_KEYS.crypto)
      if (cached) {
        setPrices(cached)
        setLoading(false)
        return
      }
      const res = await fetch(CRYPTO_API, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: CryptoPrice[] = Object.keys(CRYPTO_META).map((id) => {
        const entry = json[id]
        const meta = CRYPTO_META[id]
        return {
          id,
          name: meta.name,
          symbol: meta.symbol,
          price: entry?.usd ?? 0,
          change24h: entry?.usd_24h_change ?? 0,
        }
      })
      setPrices(list)
      setCache(CACHE_KEYS.crypto, list)
    } catch (e) {
      const fallback: CryptoPrice[] = Object.keys(CRYPTO_META).map((id) => {
        const meta = CRYPTO_META[id]
        const basePrice = id === 'bitcoin' ? 67234.56 : id === 'ethereum' ? 3456.78 : 145.23
        return { id, name: meta.name, symbol: meta.symbol, price: basePrice, change24h: (Math.random() - 0.5) * 6 }
      })
      setPrices(fallback)
      setError('使用本地数据')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <CardShell title="加密货币" icon="coin" accent={accent} isLoading={loading} error={error} onRefresh={fetchData}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {prices.map((p) => {
          const color = CRYPTO_META[p.id].color
          const up = p.change24h >= 0
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.symbol[0]}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#e8e8ff', fontWeight: 600 }}>{p.symbol}</div>
                  <div style={{ fontSize: 10, color: '#778' }}>{p.name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                  ${p.price >= 1000 ? p.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : p.price.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: up ? '#4ECCA3' : '#ff6b6b', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', fontFamily: "'JetBrains Mono', monospace" }}>
                  <Icon name={up ? 'arrow-up' : 'arrow-down'} size={10} color={up ? '#4ECCA3' : '#ff6b6b'} />
                  {Math.abs(p.change24h).toFixed(2)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </CardShell>
  )
})

// ============ 金句卡片 ============
const QuoteCard = memo(function QuoteCard() {
  const [quote, setQuote] = useState<{ text: string; author: string }>({ text: '', author: '' })
  const accent = '#3A9BDC'
  const quoteKeyRef = useRef<string>('')

  const pickRandom = useCallback(() => {
    const idx = Math.floor(Math.random() * FALLBACK_QUOTES.length)
    return FALLBACK_QUOTES[idx]
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const cacheKey = `${CACHE_KEYS.quote}-${today}`
      const key = quoteKeyRef.current
      if (key === cacheKey && quote.text) return

      const cached = getCache<{ text: string; author: string; day: string }>(CACHE_KEYS.quote)
      if (cached && (cached as any).day === today) {
        setQuote(cached)
        quoteKeyRef.current = cacheKey
        return
      }
      const newQ = pickRandom()
      const entry = { ...newQ, day: today }
      setQuote(newQ)
      setCache(CACHE_KEYS.quote, entry)
      quoteKeyRef.current = cacheKey
    } catch {
      setQuote(pickRandom())
    }
  }, [quote, pickRandom])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const forceNew = useCallback(() => {
    const q = pickRandom()
    setQuote(q)
  }, [pickRandom])

  return (
    <CardShell title="每日金句" icon="quote" accent={accent} isLoading={!quote.text} error={null} onRefresh={forceNew}>
      {quote.text && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
          <div style={{ position: 'relative', paddingLeft: 14 }}>
            <span style={{ position: 'absolute', left: -4, top: -10, fontSize: 40, color: `${accent}40`, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</span>
            <div style={{ fontSize: 14, color: '#e8e8ff', lineHeight: 1.6, fontWeight: 400 }}>{quote.text}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11.5, color: accent, fontWeight: 500, fontStyle: 'italic' }}>
            — {quote.author}
          </div>
        </div>
      )}
    </CardShell>
  )
})

// ============ 主组件 ============
function SmartHub() {
  const [gridCols, setGridCols] = useState(3)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateCols = () => {
      const el = containerRef.current
      if (!el) return
      const w = el.clientWidth
      if (w < 500) setGridCols(1)
      else if (w < 760) setGridCols(2)
      else if (w < 1100) setGridCols(3)
      else setGridCols(3)
    }
    updateCols()
    const ro = new ResizeObserver(updateCols)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', updateCols)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateCols)
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        padding: 16,
        overflow: 'auto',
        background: 'linear-gradient(135deg, rgba(30,20,60,0.4) 0%, rgba(15,25,55,0.5) 50%, rgba(30,20,60,0.4) 100%)',
        color: '#e8e8ff',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #7C6CF0, #3A9BDC)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(124,108,240,0.4)' }}>
            <Icon name="globe" size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>Smart Hub · 智能聚合仪表盘</div>
            <div style={{ fontSize: 11, color: '#889', marginTop: 2 }}>天气 · 新闻 · 系统 · GitHub · 加密货币 · 金句 · 每 60 秒自动刷新</div>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 14,
        }}
      >
        <WeatherCard />
        <HNCard />
        <SystemCard />
        <GitHubCard />
        <CryptoCard />
        <QuoteCard />
      </div>
    </div>
  )
}

// ============ 自动刷新（不阻塞 UI，仅在后台更新缓存项） ============
const AutoRefresher = memo(function AutoRefresher() {
  useEffect(() => {
    const interval = setInterval(() => {
      Object.values(CACHE_KEYS).forEach((key) => {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Date.now() - parsed.timestamp >= CACHE_TTL) {
              localStorage.removeItem(key)
            }
          }
        } catch {
          // ignore
        }
      })
    }, AUTO_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])
  return null
})

function SmartHubWithRefresh() {
  return (
    <>
      <AutoRefresher />
      <SmartHub />
    </>
  )
}

export default memo(SmartHubWithRefresh)
