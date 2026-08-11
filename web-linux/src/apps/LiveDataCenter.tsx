import { useState, useEffect, useCallback, memo } from 'react'
import {
  Cloud, CloudRain, CloudSun, CloudFog, CloudLightning, CloudSnow,
  TrendingUp, TrendingDown, RefreshCw, Clock, Globe, Newspaper,
  BarChart3, Zap, DollarSign, AlertCircle,
  Thermometer, Wind, Droplets, ArrowUpRight, ArrowDownRight,
  MapPin, Coins, Activity,
} from 'lucide-react'
import { safeFetch } from '../utils/common'

type WeatherCode = { code: number; desc: string; icon: typeof Cloud }

const WEATHER_CODES: WeatherCode[] = [
  { code: 113, desc: '晴', icon: CloudSun },
  { code: 116, desc: '局部多云', icon: Cloud },
  { code: 119, desc: '多云', icon: Cloud },
  { code: 122, desc: '阴天', icon: Cloud },
  { code: 143, desc: '薄雾', icon: CloudFog },
  { code: 176, desc: '局部小雨', icon: CloudRain },
  { code: 179, desc: '局部小雪', icon: CloudSnow },
  { code: 182, desc: '局部雨夹雪', icon: CloudSnow },
  { code: 185, desc: '局部冻雨', icon: CloudRain },
  { code: 200, desc: '局部雷阵雨', icon: CloudLightning },
  { code: 227, desc: '吹雪', icon: CloudSnow },
  { code: 230, desc: '暴风雪', icon: CloudSnow },
  { code: 248, desc: '雾', icon: CloudFog },
  { code: 260, desc: '冻雾', icon: CloudFog },
  { code: 263, desc: '毛毛雨', icon: CloudRain },
  { code: 266, desc: '小雨', icon: CloudRain },
  { code: 281, desc: '冻毛毛雨', icon: CloudRain },
  { code: 284, desc: '大冻雨', icon: CloudRain },
  { code: 293, desc: '局部小雨', icon: CloudRain },
  { code: 296, desc: '小雨', icon: CloudRain },
  { code: 299, desc: '中雨', icon: CloudRain },
  { code: 302, desc: '大雨', icon: CloudRain },
  { code: 305, desc: '间歇性大雨', icon: CloudRain },
  { code: 308, desc: '暴雨', icon: CloudRain },
  { code: 311, desc: '冻雨', icon: CloudRain },
  { code: 314, desc: '中到大冻雨', icon: CloudRain },
  { code: 317, desc: '雨夹雪', icon: CloudSnow },
  { code: 320, desc: '中到大雨夹雪', icon: CloudSnow },
  { code: 323, desc: '局部小雪', icon: CloudSnow },
  { code: 326, desc: '小雪', icon: CloudSnow },
  { code: 329, desc: '中雪', icon: CloudSnow },
  { code: 332, desc: '中到大雪', icon: CloudSnow },
  { code: 335, desc: '大雪', icon: CloudSnow },
  { code: 338, desc: '暴雪', icon: CloudSnow },
  { code: 350, desc: '冰丸', icon: CloudRain },
  { code: 353, desc: '阵雨', icon: CloudRain },
  { code: 356, desc: '中到大阵雨', icon: CloudRain },
  { code: 359, desc: '暴雨', icon: CloudRain },
  { code: 362, desc: '小雨夹雪', icon: CloudSnow },
  { code: 365, desc: '中到大雨夹雪', icon: CloudSnow },
  { code: 368, desc: '局部小雪', icon: CloudSnow },
  { code: 371, desc: '中到大雪', icon: CloudSnow },
  { code: 374, desc: '小冰丸', icon: CloudRain },
  { code: 377, desc: '中到大冰丸', icon: CloudRain },
  { code: 386, desc: '局部雷阵雨', icon: CloudLightning },
  { code: 389, desc: '中到大雷阵雨', icon: CloudLightning },
  { code: 392, desc: '局部雷暴雪', icon: CloudLightning },
  { code: 395, desc: '中到大雷暴雪', icon: CloudLightning },
]

function getWeatherInfo(code: number): WeatherCode {
  return WEATHER_CODES.find(w => w.code === code) || { code, desc: '未知', icon: Cloud }
}

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
]

const FX_PAIRS = [
  { from: 'USD', to: 'CNY', label: '美元/人民币' },
  { from: 'EUR', to: 'USD', label: '欧元/美元' },
  { from: 'GBP', to: 'USD', label: '英镑/美元' },
  { from: 'JPY', to: 'USD', label: '日元/美元' },
  { from: 'USD', to: 'HKD', label: '美元/港币' },
  { from: 'AUD', to: 'USD', label: '澳元/美元' },
  { from: 'USD', to: 'KRW', label: '美元/韩元' },
  { from: 'USD', to: 'INR', label: '美元/卢比' },
]

const WORLD_CLOCKS = [
  { city: '北京', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { city: '东京', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { city: '伦敦', timezone: 'Europe/London', flag: '🇬🇧' },
  { city: '纽约', timezone: 'America/New_York', flag: '🇺🇸' },
  { city: '巴黎', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { city: '悉尼', timezone: 'Australia/Sydney', flag: '🇦🇺' },
]

const STOCK_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', country: '美国' },
  { symbol: '^DJI', name: '道琼斯', country: '美国' },
  { symbol: '^IXIC', name: '纳斯达克', country: '美国' },
  { symbol: '^HSI', name: '恒生指数', country: '香港' },
  { symbol: '^N225', name: '日经225', country: '日本' },
  { symbol: '^FTSE', name: '富时100', country: '英国' },
]

function fmtPrice(n: number): string {
  if (n >= 1000) return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n >= 1) return '$' + n.toFixed(2)
  if (n >= 0.01) return '$' + n.toFixed(4)
  return '$' + n.toFixed(6)
}

function formatLocalTime(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return '--:--:--'
  }
}

function formatLocalDate(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }).format(date)
  } catch {
    return '--'
  }
}

function CardShell({
  title, icon: Icon, children, lastSync, onRefresh, loading, accentColor = 'var(--accent)',
}: {
  title: string
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>
  children: React.ReactNode
  lastSync?: number
  onRefresh?: () => void
  loading?: boolean
  accentColor?: string
}) {
  return (
    <div style={{
      borderRadius: 18,
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-soft)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = 'var(--shadow-medium)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = ''
      e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
    }}
    >
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--glass-border)',
        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 8%, transparent) 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            display: 'grid', placeItems: 'center',
            color: accentColor,
          }}>
            <Icon size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
            {lastSync !== undefined && (
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                <Clock size={9} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
                更新 {lastSync ? new Date(lastSync).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </div>
            )}
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            title="刷新"
            style={{
              width: 30, height: 30, borderRadius: 999,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', cursor: loading ? 'wait' : 'pointer',
              display: 'grid', placeItems: 'center',
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          </button>
        )}
      </div>
      <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function SkeletonBlock({ height = 200 }: { height?: number }) {
  return (
    <div
      className="anim-shimmer"
      style={{ height, borderRadius: 12, background: 'var(--glass-bg)' }}
    />
  )
}

/* ============ 模块1：天气 ============ */
interface WeatherData {
  areaName: string
  region: string
  country: string
  tempC: number
  tempMaxC: number
  tempMinC: number
  humidity: number
  windSpeedKmph: number
  weatherCode: number
  uvIndex: number
  feelsLikeC: number
  lastUpdated: number
}

async function fetchWeather(): Promise<WeatherData> {
  const json = await safeFetch<{
    nearest_area: Array<{
      areaName: Array<{ value: string }>
      region: Array<{ value: string }>
      country: Array<{ value: string }>
    }>
    current_condition: Array<{
      temp_C: string
      temp_MaxC: string
      temp_MinC: string
      humidity: string
      windsKmph: string
      weatherCode: number
      uvIndex: string
      FeelsLikeC: string
      localObsDateTime: string
    }>
  }>('https://wttr.in/?format=j1', { timeoutMs: 10000, retries: 2 })

  const area = json.nearest_area?.[0]
  const cur = json.current_condition?.[0]
  if (!area || !cur) throw new Error('天气数据格式异常')

  return {
    areaName: area.areaName?.[0]?.value || '未知',
    region: area.region?.[0]?.value || '',
    country: area.country?.[0]?.value || '',
    tempC: Number(cur.temp_C) || 0,
    tempMaxC: Number(cur.temp_MaxC) || 0,
    tempMinC: Number(cur.temp_MinC) || 0,
    humidity: Number(cur.humidity) || 0,
    windSpeedKmph: Number(cur.windsKmph) || 0,
    weatherCode: cur.weatherCode || 0,
    uvIndex: Number(cur.uvIndex) || 0,
    feelsLikeC: Number(cur.FeelsLikeC) || 0,
    lastUpdated: Date.now(),
  }
}

function WeatherPanel() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const d = await fetchWeather()
      setData(d)
    } catch (e) {
      setError((e as Error).message || '获取天气数据失败')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  if (error) {
    return (
      <CardShell title="全球天气" icon={Cloud} onRefresh={load} loading={loading}>
        <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      </CardShell>
    )
  }

  const info = data ? getWeatherInfo(data.weatherCode) : null
  const WIcon = info?.icon || Cloud

  return (
    <CardShell title="全球天气" icon={Cloud} lastSync={data?.lastUpdated} onRefresh={load} loading={loading} accentColor="#f59e0b">
      {loading && !data ? (
        <SkeletonBlock height={180} />
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={12} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {data.areaName}
              {data.region && data.region !== data.areaName && `, ${data.region}`}
              {data.country && `, ${data.country}`}
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', borderRadius: 14,
            background: 'linear-gradient(135deg, color-mix(in srgb, #f59e0b 12%, transparent) 0%, color-mix(in srgb, #f97316 8%, transparent) 100%)',
            border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'color-mix(in srgb, #f59e0b 20%, transparent)',
                display: 'grid', placeItems: 'center',
              }}>
                <WIcon size={32} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div style={{
                  fontSize: 42, fontWeight: 800, lineHeight: 1,
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {data.tempC}°
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {info?.desc || '未知'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>最高/最低</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                <ArrowUpRight size={12} style={{ color: 'var(--warning)', display: 'inline', verticalAlign: '-2px' }} />
                {data.tempMaxC}°
                {' / '}
                <ArrowDownRight size={12} style={{ color: 'var(--accent)', display: 'inline', verticalAlign: '-2px' }} />
                {data.tempMinC}°
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <WeatherStat icon={Thermometer} label="体感" value={`${data.feelsLikeC}°`} />
            <WeatherStat icon={Droplets} label="湿度" value={`${data.humidity}%`} />
            <WeatherStat icon={Wind} label="风速" value={`${data.windSpeedKmph}km/h`} />
          </div>
        </div>
      ) : null}
    </CardShell>
  )
}

function WeatherStat({ icon: Icon, label, value }: { icon: typeof Thermometer; label: string; value: string }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10,
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <Icon size={14} style={{ color: 'var(--accent)' }} />
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}

/* ============ 模块2：加密货币 ============ */
interface CoinData {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  lastUpdated: number
}

type CryptoPriceResponse = Record<string, {
  usd: number
  usd_24h_change?: number
  usd_market_cap?: number
}>

async function fetchCrypto(): Promise<CoinData[]> {
  const ids = COINS.map(c => c.id).join(',')
  const json = await safeFetch<CryptoPriceResponse>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
    { timeoutMs: 15000, retries: 2 }
  )

  return COINS.map(c => {
    const d = json[c.id]
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: d?.usd ?? 0,
      change24h: d?.usd_24h_change ?? 0,
      marketCap: d?.usd_market_cap ?? 0,
      lastUpdated: Date.now(),
    }
  })
}

function CryptoPanel() {
  const [coins, setCoins] = useState<CoinData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchCrypto()
      setCoins(data)
    } catch (e) {
      setError((e as Error).message || '获取加密货币数据失败')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 45000)
    return () => clearInterval(t)
  }, [load])

  if (error) {
    return (
      <CardShell title="加密货币" icon={Coins} onRefresh={load} loading={loading}>
        <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell title="加密货币" icon={Coins} lastSync={coins[0]?.lastUpdated} onRefresh={load} loading={loading} accentColor="#8b5cf6">
      {loading && coins.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} height={60} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {coins.map(c => {
            const up = c.change24h >= 0
            return (
              <div key={c.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 10,
                alignItems: 'center', padding: '8px 10px', borderRadius: 10,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{c.symbol}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{c.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {c.price > 0 ? fmtPrice(c.price) : '—'}
                  </div>
                  {c.marketCap > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      市值 ${(c.marketCap / 1e9).toFixed(2)}B
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '3px 8px', borderRadius: 999,
                  background: up ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--error) 15%, transparent)',
                  color: up ? 'var(--success)' : 'var(--error)',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {up ? '+' : ''}{c.change24h.toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardShell>
  )
}

/* ============ 模块3：实时汇率 ============ */
interface FxData {
  from: string
  to: string
  rate: number
  lastUpdated: number
}

async function fetchFxRates(): Promise<FxData[]> {
  const results = await Promise.all(
    FX_PAIRS.map(async (pair) => {
      try {
        const json = await safeFetch<{ rates: Record<string, number>; base: string }>(
          `https://api.frankfurter.app/latest?from=${pair.from}&to=${pair.to}`,
          { timeoutMs: 10000, retries: 2 }
        )
        return {
          from: pair.from,
          to: pair.to,
          rate: Number(json.rates?.[pair.to]) || 0,
          lastUpdated: Date.now(),
        }
      } catch {
        return { from: pair.from, to: pair.to, rate: 0, lastUpdated: Date.now() }
      }
    })
  )
  return results.filter(r => r.rate > 0)
}

function FxPanel() {
  const [rates, setRates] = useState<FxData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchFxRates()
      setRates(data)
    } catch (e) {
      setError((e as Error).message || '获取汇率数据失败')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  if (error) {
    return (
      <CardShell title="实时汇率" icon={DollarSign} onRefresh={load} loading={loading}>
        <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell title="实时汇率" icon={DollarSign} lastSync={rates[0]?.lastUpdated} onRefresh={load} loading={loading} accentColor="#0ea5e9">
      {loading && rates.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} height={50} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {rates.map(r => (
            <div key={`${r.from}-${r.to}`} style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              display: 'flex', flexDirection: 'column', gap: 4,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {r.from} → {r.to}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {r.rate.toFixed(4)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                1 {r.from} = {r.rate.toFixed(4)} {r.to}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  )
}

/* ============ 模块4：新闻 ============ */
interface NewsItem {
  id: string
  title: string
  url: string
  score: number
  by: string
  time: number
}

async function fetchNews(): Promise<NewsItem[]> {
  const ids = await safeFetch<number[]>(
    'https://hacker-news.firebaseio.com/v0/topstories.json',
    { timeoutMs: 10000, retries: 2 }
  )
  const selected = ids.slice(0, 10)
  const items = await Promise.all(
    selected.map(id =>
      safeFetch<{ id: number; title: string; url?: string; by?: string; time: number; score?: number }>(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        { timeoutMs: 8000 }
      ).catch(() => null)
    )
  )
  return items
    .filter(Boolean)
    .map(i => ({
      id: String(i!.id),
      title: i!.title,
      url: i!.url || `https://news.ycombinator.com/item?id=${i!.id}`,
      score: i!.score || 0,
      by: i!.by || 'anon',
      time: i!.time || 0,
    }))
}

function timeAgo(timestamp: number): string {
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

function NewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchNews()
      setItems(data)
    } catch (e) {
      setError((e as Error).message || '获取新闻数据失败')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  if (error) {
    return (
      <CardShell title="科技新闻" icon={Newspaper} onRefresh={load} loading={loading}>
        <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell title="科技新闻" icon={Newspaper} lastSync={items[0] ? Date.now() : undefined} onRefresh={load} loading={loading} accentColor="#ec4899">
      {loading && items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} height={48} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
          {items.map((item, i) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer noopener"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                color: 'inherit', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.borderColor = ''
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 800,
                background: i < 3 ? 'var(--accent-gradient)' : 'var(--accent-bg)',
                color: i < 3 ? 'white' : 'var(--accent-strong)',
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, lineHeight: 1.4,
                  color: 'var(--text-primary)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--text-secondary)', marginTop: 3,
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <span style={{
                    padding: '1px 6px', borderRadius: 999,
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-strong)', fontWeight: 600,
                  }}>
                    {item.score} points
                  </span>
                  <span>· {item.by}</span>
                  <span>· {timeAgo(item.time)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </CardShell>
  )
}

/* ============ 模块5：股票指数 ============ */
interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  lastUpdated: number
}

async function fetchStockData(): Promise<StockData[]> {
  const results = await Promise.all(
    STOCK_INDICES.map(async (idx) => {
      try {
        const json = await safeFetch<{
          chart: {
            result: Array<{
              meta: {
                regularMarketPrice: number
                chartPreviousClose: number
                regularMarketChangePercent?: number
              }
            }>
            error?: { description: string }
          }
        }>(
          `https://query1.finance.yahoo.com/v8/finance/chart/${idx.symbol}?range=1d&interval=1d`,
          { timeoutMs: 12000, retries: 1 }
        )
        const meta = json.chart?.result?.[0]?.meta
        if (!meta) throw new Error('数据格式异常')
        const price = meta.regularMarketPrice || 0
        const prevClose = meta.chartPreviousClose || price
        const change = price - prevClose
        const changePercent = meta.regularMarketChangePercent ?? (prevClose > 0 ? (change / prevClose) * 100 : 0)
        return {
          symbol: idx.symbol,
          name: idx.name,
          price,
          change,
          changePercent,
          lastUpdated: Date.now(),
        }
      } catch {
        return { symbol: idx.symbol, name: idx.name, price: 0, change: 0, changePercent: 0, lastUpdated: Date.now() }
      }
    })
  )
  return results.filter(r => r.price > 0)
}

function StockPanel() {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchStockData()
      setStocks(data)
    } catch (e) {
      setError((e as Error).message || '获取股票指数数据失败')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  if (error) {
    return (
      <CardShell title="股票指数" icon={BarChart3} onRefresh={load} loading={loading}>
        <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell title="股票指数" icon={BarChart3} lastSync={stocks[0]?.lastUpdated} onRefresh={load} loading={loading} accentColor="#10b981">
      {loading && stocks.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} height={55} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {stocks.map(s => {
            const up = s.change >= 0
            return (
              <div key={s.symbol} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    padding: '2px 6px', borderRadius: 999,
                    background: up ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--error) 15%, transparent)',
                    color: up ? 'var(--success)' : 'var(--error)',
                    fontSize: 10, fontWeight: 600,
                  }}>
                    {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {up ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: up ? 'var(--success)' : 'var(--error)',
                }}>
                  {s.price > 0 ? s.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {up ? '+' : ''}{s.change.toFixed(2)} 点
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardShell>
  )
}

/* ============ 模块6：世界时钟 ============ */
function WorldClockPanel() {
  const [now, setNow] = useState(new Date())
  const [showSeconds, setShowSeconds] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <CardShell title="世界时钟" icon={Globe} lastSync={now.getTime()} accentColor="#3b82f6" onRefresh={() => setNow(new Date())}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button
            onClick={() => setShowSeconds(s => !s)}
            style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
            }}
          >
            {showSeconds ? '隐藏秒' : '显示秒'}
          </button>
        </div>
        {WORLD_CLOCKS.map(c => {
          const time = formatLocalTime(now, c.timezone)
          const date = formatLocalDate(now, c.timezone)
          return (
            <div key={c.timezone} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10,
              alignItems: 'center', padding: '8px 12px', borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
            >
              <div style={{ fontSize: 22 }}>{c.flag}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{c.city}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{date}</div>
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: 'var(--accent-strong)', letterSpacing: 0.5,
              }}>
                {showSeconds ? time : time.replace(/:\d{2}$/, '')}
              </div>
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}

/* ============ 主组件 ============ */
const LiveDataCenter: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      color: 'var(--text-primary)', fontSize: 13,
    }}>
      <header style={{
        padding: '16px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6)',
            display: 'grid', placeItems: 'center',
            boxShadow: 'var(--accent-glow)',
            animation: 'spin 12s linear infinite',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--color-surface)',
              display: 'grid', placeItems: 'center',
            }}>
              <Zap size={18} style={{ color: 'var(--accent-strong)' }} />
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              LiveDataCenter · 实时数据中心
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              <span className="status-dot online" style={{ marginRight: 6 }} />
              接入 6 个公开 API · 天气/加密/汇率/新闻/股票/时钟 · 自动刷新
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            fontSize: 11, color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            <Activity size={11} /> {currentTime.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </header>

      <main style={{
        flex: 1, padding: 20, overflow: 'auto',
        background:
          'radial-gradient(1000px 400px at 90% -10%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 60%),' +
          'radial-gradient(800px 400px at -10% 110%, color-mix(in srgb, var(--accent-secondary) 6%, transparent) 0%, transparent 60%),' +
          'transparent',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}>
          <WeatherPanel />
          <CryptoPanel />
          <FxPanel />
          <NewsPanel />
          <StockPanel />
          <WorldClockPanel />
        </div>
      </main>
    </div>
  )
}

export default memo(LiveDataCenter)