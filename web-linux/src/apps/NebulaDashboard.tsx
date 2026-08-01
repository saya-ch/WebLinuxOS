import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  ThermometerSun,
  Sunrise,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Rocket,
  Clock,
  Calendar,
  RefreshCw,
  Globe2,
  Bitcoin,
  Quote,
  AlertCircle,
  Image,
  ChevronRight,
  Zap,
  Activity,
  BarChart3,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

/* ──────────────────────────── 类型定义 ──────────────────────────── */
interface ApodData {
  title: string
  date: string
  explanation: string
  url: string
  hdurl?: string
  media_type: string
  copyright?: string
}

interface CoinData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
}

interface WeatherCurrent {
  temp: number
  feels_like: number
  humidity: number
  wind_speed_10m: number
  weather_code: number
  pressure_msl: number
  visibility?: number
}

interface WeatherDaily {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  weather_code: number[]
  sunrise: string[]
  sunset: string[]
}

interface QuoteData {
  content: string
  author: string
  tags: string[]
}

/* ──────────────────────────── 辅助函数 ──────────────────────────── */
function weatherCodeToIcon(code: number, isDay: boolean = true) {
  if (code === 0) return isDay ? <Sun size={28} /> : <Clock size={28} />
  if (code <= 3) return <Cloud size={28} />
  if (code <= 48) return <Cloud size={28} />
  if (code <= 57) return <CloudRain size={28} />
  if (code <= 67) return <CloudRain size={28} />
  if (code <= 86) return <CloudSnow size={28} />
  return <CloudRain size={28} />
}

function weatherCodeToText(code: number): string {
  const map: Record<number, string> = {
    0: '晴朗', 1: '大部晴朗', 2: '局部多云', 3: '阴天',
    45: '有雾', 48: '雾凇', 51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    56: '冻毛毛雨', 57: '强冻毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '强冻雨', 71: '小雪', 73: '中雪', 75: '大雪',
    77: '雪粒', 80: '小阵雨', 81: '阵雨', 82: '强阵雨',
    85: '小阵雪', 86: '强阵雪', 95: '雷暴', 96: '雷暴伴小冰雹', 99: '雷暴伴大冰雹',
  }
  return map[code] || '未知天气'
}

function formatCurrency(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(6)}`
}

const DEFAULT_CITY = { name: '北京', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' }

/* ──────────────────────────── 组件实现 ──────────────────────────── */
export default function NebulaDashboard() {
  const [now, setNow] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apod, setApod] = useState<ApodData | null>(null)
  const [coins, setCoins] = useState<CoinData[]>([])
  const [weather, setWeather] = useState<{ current: WeatherCurrent; daily: WeatherDaily } | null>(null)
  const [city, setCity] = useState(DEFAULT_CITY)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [citySearch, setCitySearch] = useState('')
  const [searchingCity, setSearchingCity] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // 时钟
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* ── NASA APOD ── */
  const fetchApod = useCallback(async () => {
    try {
      const url = `${API_CONFIG.nasa.baseUrl}/apod?api_key=${API_CONFIG.nasa.key}&thumbs=true`
      const res = await fetchWithTimeout(url, {}, 15000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setApod(d)
    } catch (e) {
      console.warn('APOD:', handleApiError(e, 'NASA APOD'))
    }
  }, [])

  /* ── 加密货币（CoinGecko 免费 API） ── */
  const fetchCoins = useCallback(async () => {
    try {
      const ids = 'bitcoin,ethereum,solana,cardano,ripple,dogecoin,polkadot,chainlink'
      const url = `${API_CONFIG.coinGecko.baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
      const res = await fetchWithTimeout(url, {}, 15000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setCoins(await res.json())
    } catch (e) {
      console.warn('Crypto:', handleApiError(e, 'CoinGecko'))
    }
  }, [])

  /* ── 天气（Open-Meteo 免费 API，无需 key） ── */
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`
      const res = await fetchWithTimeout(url, {}, 15000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setWeather({ current: d.current, daily: d.daily })
    } catch (e) {
      setError(handleApiError(e, '天气服务'))
    }
  }, [])

  /* ── 名言（Quotable 免费 API） ── */
  const fetchQuote = useCallback(async () => {
    try {
      const url = `${API_CONFIG.quotable.baseUrl}/quotes/random?tags=technology|inspirational|wisdom|famous-quotes`
      const res = await fetchWithTimeout(url, {}, 10000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arr = await res.json()
      if (Array.isArray(arr) && arr[0]) setQuote(arr[0])
    } catch (e) {
      // fallback 名言
      setQuote({
        content: '简单是最终的复杂。',
        author: '列奥纳多·达·芬奇',
        tags: ['wisdom'],
      })
    }
  }, [])

  /* ── 城市搜索（Open-Meteo Geocoding） ── */
  const searchCity = useCallback(async () => {
    const q = citySearch.trim()
    if (!q) return
    setSearchingCity(true)
    try {
      const url = `${API_CONFIG.openMeteoGeocoding.baseUrl}/search?name=${encodeURIComponent(q)}&count=5&language=zh&format=json`
      const res = await fetchWithTimeout(url, {}, 10000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      if (d.results && d.results.length > 0) {
        const r = d.results[0]
        const next = {
          name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
          lat: r.latitude,
          lon: r.longitude,
          tz: r.timezone || 'auto',
        }
        setCity(next)
        fetchWeather(next.lat, next.lon)
      } else {
        setError(`未找到城市：${q}`)
      }
    } catch (e) {
      setError(handleApiError(e, '城市搜索'))
    } finally {
      setSearchingCity(false)
      setCitySearch('')
    }
  }, [citySearch, fetchWeather])

  /* ── 初次加载 ── */
  const loadAll = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.allSettled([
      fetchApod(),
      fetchCoins(),
      fetchWeather(city.lat, city.lon),
      fetchQuote(),
    ]).then(() => {
      setLoading(false)
      setLastRefresh(new Date())
    })
  }, [fetchApod, fetchCoins, fetchWeather, fetchQuote, city.lat, city.lon])

  useEffect(() => { loadAll() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  // 加密货币 60s 自动刷新
  useEffect(() => {
    const id = setInterval(() => { fetchCoins() }, 60000)
    return () => clearInterval(id)
  }, [fetchCoins])

  const isDay = useMemo(() => {
    const h = now.getHours()
    return h >= 6 && h < 19
  }, [now])

  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  return (
    <div style={{
      height: '100%', width: '100%', overflow: 'auto',
      padding: 24,
      background: 'linear-gradient(160deg, #0a0a1a 0%, #12122e 40%, #1a1040 100%)',
      color: '#e8e8ff', fontFamily: 'inherit',
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(139,92,246,0.45)',
            }}>
              <Rocket size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Nebula 星云仪表盘
              </h1>
              <p style={{ fontSize: 12, color: '#8b8bbf', marginTop: 2 }}>
                聚合天文 · 加密 · 天气 · 新知 — 所有关键信息一屏掌握
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
              background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {timeStr}
            </div>
            <div style={{ fontSize: 12, color: '#8b8bbf' }}>{dateStr}</div>
          </div>
          <button onClick={loadAll} title="刷新数据" style={{
            width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'rgba(139,92,246,0.15)', color: '#c4b5fd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.28)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)' }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8b8bbf' }}>
          <Activity size={32} style={{ margin: '0 auto 12px', animation: 'spin 1.2s linear infinite' }} />
          <div>正在加载星云数据...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && (
        <div style={{
          display: 'grid', gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}>
          {/* ── 天气卡片 ── */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe2 size={18} style={{ color: '#00d6c1' }} />
                <span style={cardTitle}>实时天气 · {city.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchCity() }}
                  placeholder="搜索城市..."
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '6px 10px', color: '#e8e8ff',
                    fontSize: 12, outline: 'none', width: 140,
                  }}
                />
                <button onClick={searchCity} disabled={searchingCity} style={{
                  background: 'rgba(0,214,193,0.2)', color: '#00d6c1',
                  border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer',
                  fontSize: 12,
                }}>
                  {searchingCity ? '...' : '搜索'}
                </button>
              </div>
            </div>

            {weather && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 20,
                      background: isDay
                        ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                    }}>
                      {weatherCodeToIcon(weather.current.weather_code, isDay)}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {weather.current.temp.toFixed(0)}°
                      </div>
                      <div style={{ fontSize: 13, color: '#9a9acf', marginTop: 4 }}>
                        {weatherCodeToText(weather.current.weather_code)}
                        <span style={{ margin: '0 6px' }}>·</span>
                        体感 {weather.current.feels_like.toFixed(0)}°
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, minWidth: 220 }}>
                    <InfoRow icon={<Droplets size={14} style={{ color: '#38bdf8' }} />} label="湿度" value={`${weather.current.humidity}%`} />
                    <InfoRow icon={<Wind size={14} style={{ color: '#a78bfa' }} />} label="风速" value={`${weather.current.wind_speed_10m.toFixed(1)} km/h`} />
                    <InfoRow icon={<ThermometerSun size={14} style={{ color: '#fb7185' }} />} label="气压" value={`${weather.current.pressure_msl.toFixed(0)} hPa`} />
                    <InfoRow icon={<Sunrise size={14} style={{ color: '#f59e0b' }} />} label="日出/日落" value={`${weather.daily.sunrise[0].slice(11)} / ${weather.daily.sunset[0].slice(11)}`} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {weather.daily.time.map((d, i) => (
                    <div key={d} style={{
                      flex: '1 0 0', minWidth: 64, padding: '12px 8px',
                      background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                      textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ fontSize: 11, color: '#8b8bbf', marginBottom: 6 }}>
                        {new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 18, margin: '4px 0' }}>
                        {weatherCodeToIcon(weather.daily.weather_code[i], true)}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {weather.daily.temperature_2m_max[i].toFixed(0)}°
                      </div>
                      <div style={{ fontSize: 11, color: '#8b8bbf', fontVariantNumeric: 'tabular-nums' }}>
                        {weather.daily.temperature_2m_min[i].toFixed(0)}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 加密货币卡片 ── */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bitcoin size={18} style={{ color: '#f59e0b' }} />
                <span style={cardTitle}>加密市场 Top 8</span>
                {lastRefresh && (
                  <span style={{ fontSize: 11, color: '#6a6a9a' }}>
                    · {lastRefresh.toLocaleTimeString('zh-CN', { hour12: false })}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(16,185,129,0.12)', color: '#10b981',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Zap size={11} /> 实时
              </span>
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {coins.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: '#6a6a9a', fontSize: 13 }}>
                  暂无数据（可能触发 API 限流，稍后自动刷新）
                </div>
              )}
              {coins.map(c => {
                const up = c.price_change_percentage_24h >= 0
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  >
                    <img src={c.image} alt={c.name} style={{ width: 28, height: 28, borderRadius: 999 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                        <span style={{
                          fontSize: 10, textTransform: 'uppercase', color: '#8b8bbf',
                          background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4,
                        }}>
                          {c.symbol}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6a6a9a', marginTop: 2 }}>
                        市值 {formatCurrency(c.market_cap)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      }}>
                        {formatCurrency(c.current_price)}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: 3, fontSize: 12, marginTop: 2,
                        color: up ? '#10b981' : '#ef4444',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {up ? '+' : ''}{c.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── NASA 每日天文图 ── */}
          <div style={{ ...cardStyle, gridColumn: 'span 1' }}>
            <div style={cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} style={{ color: '#a855f7' }} />
                <span style={cardTitle}>NASA · 每日天文图</span>
              </div>
              {apod?.date && (
                <span style={{ fontSize: 11, color: '#6a6a9a' }}>
                  <Calendar size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {apod.date}
                </span>
              )}
            </div>
            {apod && (
              <div style={{ marginTop: 14 }}>
                {apod.media_type === 'image' ? (
                  <div style={{
                    width: '100%', height: 180, borderRadius: 12, overflow: 'hidden',
                    background: '#000', position: 'relative', marginBottom: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <img
                      src={apod.url}
                      alt={apod.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div style={{
                      position: 'absolute', inset: 'auto 0 0 0', padding: '8px 12px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      fontSize: 12, color: '#fff', fontWeight: 600,
                    }}>
                      {apod.title}
                      {apod.copyright && <span style={{ fontWeight: 400, color: '#ccc', fontSize: 11, marginLeft: 6 }}>© {apod.copyright}</span>}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%', height: 180, borderRadius: 12,
                    background: 'linear-gradient(135deg, #1a1040 0%, #312e81 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <Image size={36} style={{ margin: '0 auto 8px', color: '#a855f7' }} />
                      <div style={{ fontSize: 13 }}>视频内容 · 点击打开</div>
                    </div>
                  </div>
                )}
                <p style={{
                  fontSize: 12, color: '#9a9acf', lineHeight: 1.65,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {apod.explanation}
                </p>
              </div>
            )}
          </div>

          {/* ── 名言 & 系统状态 ── */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Quote size={18} style={{ color: '#fbbf24' }} />
                <span style={cardTitle}>今日箴言</span>
              </div>
              <button onClick={fetchQuote} title="换一条" style={{
                background: 'none', border: 'none', color: '#8b8bbf',
                cursor: 'pointer', padding: 4, borderRadius: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#c4b5fd' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8b8bbf' }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {quote && (
              <div style={{ marginTop: 16, padding: '16px 18px',
                background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,146,60,0.04) 100%)',
                borderRadius: 14, border: '1px solid rgba(251,191,36,0.15)',
                position: 'relative',
              }}>
                <Quote size={22} style={{
                  position: 'absolute', top: 8, left: 10, opacity: 0.12,
                }} />
                <p style={{
                  fontSize: 15, lineHeight: 1.7, fontWeight: 500,
                  paddingLeft: 8, marginBottom: 10, color: '#f5f5ff',
                }}>
                  {quote.content}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingLeft: 8,
                }}>
                  <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
                    — {quote.author}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {quote.tags?.slice(0, 2).map(t => (
                      <span key={t} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.06)', color: '#9a9acf',
                        textTransform: 'capitalize',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{
              marginTop: 18, padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              }}>
                <BarChart3 size={14} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>
                  系统状态
                </span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              }}>
                <MiniStat label="浏览器" value={navigator.userAgent.includes('Chrome') ? 'Chromium' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'WebKit'} />
                <MiniStat label="在线" value={navigator.onLine ? '✓ 已连接' : '✗ 离线'} valueColor={navigator.onLine ? '#10b981' : '#ef4444'} />
                <MiniStat label="屏幕" value={`${window.screen.width}×${window.screen.height}`} />
                <MiniStat label="语言" value={navigator.language} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部说明 */}
      <div style={{
        marginTop: 28, padding: '14px 18px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12, fontSize: 12, color: '#8b8bbf',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <AlertCircle size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ color: '#c4b5fd' }}>数据来源：</strong>
          所有数据均来自合规公开 API，实时获取无需密钥。
          <span style={{ margin: '0 6px' }}>|</span>
          天气 Open-Meteo
          <span style={{ margin: '0 6px' }}>|</span>
          加密 CoinGecko
          <span style={{ margin: '0 6px' }}>|</span>
          天文 NASA APOD
          <span style={{ margin: '0 6px' }}>|</span>
          名言 Quotable
          <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          完全本地运行，数据不经过任何第三方服务器
        </div>
      </div>

      {error && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20,
          padding: '10px 14px', background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5',
          borderRadius: 10, fontSize: 12, maxWidth: 320, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
        onClick={() => setError(null)}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────── 子组件 & 样式 ──────────────────────────── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#6a6a9a' }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      padding: '8px 10px', background: 'rgba(255,255,255,0.03)',
      borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontSize: 10, color: '#6a6a9a', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: valueColor || '#e8e8ff',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  background: 'rgba(18, 18, 38, 0.75)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
}

const cardHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  paddingBottom: 12,
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}

const cardTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#f5f5ff',
}
