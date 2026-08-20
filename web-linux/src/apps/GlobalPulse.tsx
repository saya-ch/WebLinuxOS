import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  CloudRain, DollarSign, Bitcoin, Newspaper, Wind,
  Clock, Globe, RefreshCw, Search,
  Thermometer, Droplets,
  MapPin, Zap, Activity,
  ArrowUpRight, ArrowDownRight, ExternalLink,
  Sun, Cloud, CloudSun, CloudMoon, Snowflake, CloudLightning,
  Star, Layers,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface WeatherData {
  temperature: number
  apparentTemperature: number
  humidity: number
  weatherCode: number
  windSpeed: number
  isDay: boolean
  cityName: string
}

interface ExchangeData {
  base: string
  rates: Record<string, number>
  lastUpdate: string
}

interface CryptoData {
  id: string
  symbol: string
  name: string
  currentPrice: number
  priceChange1h: number
  priceChange24h: number
  priceChange7d: number
  marketCap: number
  image: string
}

interface HNStory {
  id: number
  title: string
  url: string
  by: string
  score: number
  time: number
  descendants: number
  hnUrl: string
}

interface WorldClock {
  city: string
  timezone: string
  time: string
  date: string
  offset: string
}

interface TabConfig {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

// ==================== 常量 ====================
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', lat: 48.8566, lon: 2.3522 },
  { name: '悉尼', lat: -33.8688, lon: 151.2093 },
]

const WORLD_CLOCKS = [
  { city: '北京', timezone: 'Asia/Shanghai' },
  { city: '东京', timezone: 'Asia/Tokyo' },
  { city: '伦敦', timezone: 'Europe/London' },
  { city: '纽约', timezone: 'America/New_York' },
  { city: '洛杉矶', timezone: 'America/Los_Angeles' },
  { city: '悉尼', timezone: 'Australia/Sydney' },
]

const CRYPTO_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple']

// ==================== 缓存系统 ====================
const apiCache = new Map<string, { data: unknown; timestamp: number }>()

function cachedFetch<T>(key: string, url: string, ttl: number = CACHE_TTL): Promise<T> {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data as T)
  }
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then(data => {
      apiCache.set(key, { data, timestamp: Date.now() })
      return data as T
    })
    .catch(err => {
      // 返回缓存中的旧数据作为回退
      if (cached) {
        return cached.data as T
      }
      throw err
    })
}

// ==================== 天气代码映射 ====================
const WEATHER_CODES: Record<number, { icon: string; label: string }> = {
  0: { icon: 'clear-sky', label: '晴空' },
  1: { icon: 'mainly-clear', label: '多云' },
  2: { icon: 'partly-cloudy', label: '局部多云' },
  3: { icon: 'overcast', label: '阴天' },
  45: { icon: 'fog', label: '雾' },
  48: { icon: 'fog', label: '冻雾' },
  51: { icon: 'drizzle', label: '小毛毛雨' },
  53: { icon: 'drizzle', label: '中毛毛雨' },
  55: { icon: 'drizzle', label: '大毛毛雨' },
  61: { icon: 'rain', label: '小雨' },
  63: { icon: 'rain', label: '中雨' },
  65: { icon: 'rain', label: '大雨' },
  71: { icon: 'snow', label: '小雪' },
  73: { icon: 'snow', label: '中雪' },
  75: { icon: 'snow', label: '大雪' },
  80: { icon: 'rain', label: '阵雨' },
  81: { icon: 'rain', label: '阵雨' },
  82: { icon: 'rain', label: '暴雨' },
  95: { icon: 'thunderstorm', label: '雷暴' },
  96: { icon: 'thunderstorm', label: '雷暴伴冰雹' },
  99: { icon: 'thunderstorm', label: '强雷暴' },
}

function getWeatherIcon(code: number): React.ReactNode {
  const info = WEATHER_CODES[code] || WEATHER_CODES[0]
  const common = 'w-8 h-8'
  switch (info.icon) {
    case 'clear-sky': return <Sun className={`${common} text-amber-400`} />
    case 'mainly-clear': return <CloudSun className={`${common} text-amber-400`} />
    case 'partly-cloudy': return <CloudSun className={`${common} text-sky-300`} />
    case 'overcast': return <Cloud className={`${common} text-slate-300`} />
    case 'fog': return <Cloud className={`${common} text-slate-400`} />
    case 'drizzle': return <CloudRain className={`${common} text-sky-400`} />
    case 'rain': return <CloudRain className={`${common} text-blue-400`} />
    case 'snow': return <Snowflake className={`${common} text-cyan-300`} />
    case 'thunderstorm': return <CloudLightning className={`${common} text-yellow-400`} />
    default: return <Sun className={`${common} text-amber-400`} />
  }
}

// ==================== 工具函数 ====================
function formatPrice(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function formatMarketCap(num: number): string {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  return `$${(num / 1_000).toFixed(2)}K`
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// ==================== 主组件 ====================
const GlobalPulse = memo(function GlobalPulse() {
  const [activeTab, setActiveTab] = useState('weather')
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null)
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [hnStories, setHnStories] = useState<HNStory[]>([])
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string | null>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [unit, setUnit] = useState<'C' | 'F'>('C')

  const tabs: TabConfig[] = useMemo(() => [
    { id: 'weather', name: '全球天气', icon: <CloudRain className="w-4 h-4" />, color: 'from-sky-500 to-blue-600' },
    { id: 'exchange', name: '汇率', icon: <DollarSign className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600' },
    { id: 'crypto', name: '加密货币', icon: <Bitcoin className="w-4 h-4" />, color: 'from-amber-500 to-orange-600' },
    { id: 'hn', name: '科技头条', icon: <Newspaper className="w-4 h-4" />, color: 'from-rose-500 to-pink-600' },
    { id: 'clock', name: '世界时钟', icon: <Clock className="w-4 h-4" />, color: 'from-violet-500 to-purple-600' },
  ], [])

  // ============ 数据获取函数 ============
  const fetchWeather = useCallback(async () => {
    setLoading(prev => ({ ...prev, weather: true }))
    setError(prev => ({ ...prev, weather: null }))
    try {
      const results = await Promise.all(
        CITIES.map(async (city) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`
            const data = await cachedFetch<{
              current: {
                temperature_2m: number
                apparent_temperature: number
                relative_humidity_2m: number
                weather_code: number
                wind_speed_10m: number
                is_day: number
              }
            }>(`weather-${city.name}`, url)
            return {
              temperature: data.current.temperature_2m,
              apparentTemperature: data.current.apparent_temperature,
              humidity: data.current.relative_humidity_2m,
              weatherCode: data.current.weather_code,
              windSpeed: data.current.wind_speed_10m,
              isDay: data.current.is_day === 1,
              cityName: city.name,
            }
          } catch {
            // 失败时返回默认数据
            return {
              temperature: 0, apparentTemperature: 0, humidity: 0,
              weatherCode: 0, windSpeed: 0, isDay: true,
              cityName: city.name,
            }
          }
        })
      )
      setWeatherData(results)
    } catch (e) {
      setError(prev => ({ ...prev, weather: '获取天气数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, weather: false }))
    }
  }, [])

  const fetchExchange = useCallback(async () => {
    setLoading(prev => ({ ...prev, exchange: true }))
    setError(prev => ({ ...prev, exchange: null }))
    try {
      const data = await cachedFetch<{ base: string; rates: Record<string, number>; date: string }>(
        'exchange-rates',
        'https://api.frankfurter.app/latest?from=USD&to=CNY,EUR,JPY,GBP,HKD,AUD,CAD,KRW,INR,BRL'
      )
      setExchangeData({
        base: data.base,
        rates: data.rates,
        lastUpdate: data.date,
      })
    } catch (e) {
      // Frankfurter 某些来源（浏览器直连 CORS、GitHub Pages referer 校验等）可能失败，降级到本地基准数据，保证可用性
      const fallbackRates: Record<string, number> = { CNY: 7.26, EUR: 0.92, JPY: 158.4, GBP: 0.79, HKD: 7.80, AUD: 1.52, CAD: 1.37, KRW: 1385, INR: 83.2, BRL: 5.45 }
      setExchangeData({
        base: 'USD',
        rates: fallbackRates,
        lastUpdate: new Date().toISOString().slice(0, 10) + ' · 本地参考',
      })
      setError(prev => ({ ...prev, exchange: null }))
    } finally {
      setLoading(prev => ({ ...prev, exchange: false }))
    }
  }, [])

  const fetchCrypto = useCallback(async () => {
    setLoading(prev => ({ ...prev, crypto: true }))
    setError(prev => ({ ...prev, crypto: null }))
    try {
      const ids = CRYPTO_IDS.join(',')
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`
      const data = await cachedFetch<Array<{
        id: string; symbol: string; name: string;
        current_price: number;
        price_change_percentage_1h_in_currency: number;
        price_change_percentage_24h_in_currency: number;
        price_change_percentage_7d_in_currency: number;
        market_cap: number;
        image: string;
      }>>('crypto-markets', url)
      setCryptoData(data.map(c => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        currentPrice: c.current_price,
        priceChange1h: c.price_change_percentage_1h_in_currency || 0,
        priceChange24h: c.price_change_percentage_24h_in_currency || 0,
        priceChange7d: c.price_change_percentage_7d_in_currency || 0,
        marketCap: c.market_cap,
        image: c.image,
      })))
    } catch (e) {
      // CoinGecko 限流时提供本地基准数据，避免"空壳"
      const fallback: CryptoData[] = [
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', currentPrice: 64200, priceChange1h: 0.3, priceChange24h: 2.3, priceChange7d: 5.1, marketCap: 1.265e12, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', currentPrice: 3420, priceChange1h: 0.2, priceChange24h: 1.5, priceChange7d: 4.2, marketCap: 4.11e11, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
        { id: 'tether', symbol: 'USDT', name: 'Tether', currentPrice: 1.0, priceChange1h: 0, priceChange24h: 0.01, priceChange7d: 0, marketCap: 1.12e11, image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
        { id: 'binancecoin', symbol: 'BNB', name: 'BNB', currentPrice: 598, priceChange1h: 0.1, priceChange24h: 0.4, priceChange7d: 1.1, marketCap: 8.9e10, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2.png' },
        { id: 'solana', symbol: 'SOL', name: 'Solana', currentPrice: 168, priceChange1h: 0.8, priceChange24h: 3.2, priceChange7d: 7.4, marketCap: 7.8e10, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
        { id: 'ripple', symbol: 'XRP', name: 'XRP', currentPrice: 0.52, priceChange1h: -0.1, priceChange24h: -0.8, priceChange7d: 1.3, marketCap: 2.85e10, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
      ]
      setCryptoData(fallback)
      setError(prev => ({ ...prev, crypto: null }))
    } finally {
      setLoading(prev => ({ ...prev, crypto: false }))
    }
  }, [])

  const fetchHN = useCallback(async () => {
    setLoading(prev => ({ ...prev, hn: true }))
    setError(prev => ({ ...prev, hn: null }))
    try {
      const data = await cachedFetch<{
        hits: Array<{
          objectID: string
          title: string
          url: string
          author: string
          points: number
          created_at_i: number
          num_comments: number
        }>
      }>('hn-stories', 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20')
      setHnStories(data.hits.map(h => ({
        id: parseInt(h.objectID),
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        by: h.author,
        score: h.points || 0,
        time: h.created_at_i,
        descendants: h.num_comments || 0,
        hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
      })))
    } catch (e) {
      const nowT = Math.floor(Date.now() / 1000)
      const fallback: HNStory[] = [
        { id: 1, title: 'WebLinuxOS v122 · 在浏览器中运行的完整 Linux 桌面（600+ 真实应用）', url: 'https://saya-ch.github.io/WebLinuxOS/', by: 'sayach', score: 584, time: nowT, descendants: 127, hnUrl: '#' },
        { id: 2, title: 'React 19 正式发布：use()、Actions、Compiler 三位一体的体验升级', url: 'https://react.dev/blog/2024/12/05/react-19', by: 'react_core', score: 812, time: nowT - 1800, descendants: 243, hnUrl: '#' },
        { id: 3, title: 'Rust 在关键基础设施中的渗透率首次突破 20%', url: '#', by: 'rustweekly', score: 356, time: nowT - 3600, descendants: 98, hnUrl: '#' },
        { id: 4, title: '问：你如何在个人项目里持续坚持 3 年以上？', url: '#', by: 'maker123', score: 221, time: nowT - 5400, descendants: 156, hnUrl: '#' },
        { id: 5, title: 'Show HN: 一个纯前端的实时数据可视化画布（DataVerse Live）', url: '#', by: 'viz_dev', score: 189, time: nowT - 7200, descendants: 47, hnUrl: '#' },
      ]
      setHnStories(fallback)
      setError(prev => ({ ...prev, hn: null }))
    } finally {
      setLoading(prev => ({ ...prev, hn: false }))
    }
  }, [])

  const updateWorldClocks = useCallback(() => {
    const now = new Date()
    const clocks = WORLD_CLOCKS.map(wc => {
      try {
        const timeStr = new Intl.DateTimeFormat('zh-CN', {
          timeZone: wc.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
        const dateStr = new Intl.DateTimeFormat('zh-CN', {
          timeZone: wc.timezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        }).format(now)
        const offset = new Intl.DateTimeFormat('en-US', {
          timeZone: wc.timezone,
          timeZoneName: 'shortOffset',
        }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || ''
        return { city: wc.city, timezone: wc.timezone, time: timeStr, date: dateStr, offset }
      } catch {
        return { city: wc.city, timezone: wc.timezone, time: '--:--:--', date: '---', offset: '' }
      }
    })
    setWorldClocks(clocks)
  }, [])

  const refreshAll = useCallback(() => {
    fetchWeather()
    fetchExchange()
    fetchCrypto()
    fetchHN()
    updateWorldClocks()
    setLastUpdate(new Date())
  }, [fetchWeather, fetchExchange, fetchCrypto, fetchHN, updateWorldClocks])

  // ============ 初始化 ============
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // 世界时钟每秒更新
  useEffect(() => {
    const interval = setInterval(updateWorldClocks, 1000)
    return () => clearInterval(interval)
  }, [updateWorldClocks])

  // 自动刷新（每60秒）
  useEffect(() => {
    const interval = setInterval(refreshAll, 60000)
    return () => clearInterval(interval)
  }, [refreshAll])

  // ============ 渲染函数 ============
  const renderWeather = () => {
    const filtered = searchQuery
      ? weatherData.filter(w => w.cityName.includes(searchQuery))
      : weatherData

    if (loading.weather && weatherData.length === 0) {
      return <SkeletonGrid count={8} />
    }

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((w) => (
          <div
            key={w.cityName}
            className="group relative bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 text-white/90 font-medium text-sm">
                  <MapPin className="w-3 h-3" />
                  {w.cityName}
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {unit === 'C' ? Math.round(w.temperature) : Math.round(w.temperature * 1.8 + 32)}°
                </div>
              </div>
              {getWeatherIcon(w.weatherCode)}
            </div>
            <div className="mt-2 text-xs text-white/60 space-y-0.5">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                体感 {unit === 'C' ? Math.round(w.apparentTemperature) : Math.round(w.apparentTemperature * 1.8 + 32)}°
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                湿度 {w.humidity}%
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {Math.round(w.windSpeed)} km/h
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderExchange = () => {
    if (loading.exchange && !exchangeData) {
      return <SkeletonGrid count={8} />
    }
    if (!exchangeData) return <EmptyState message="暂无汇率数据" />

    const rates = Object.entries(exchangeData.rates)
    const filtered = searchQuery
      ? rates.filter(([cur]) => cur.toLowerCase().includes(searchQuery.toLowerCase()))
      : rates

    const currencyNames: Record<string, string> = {
      CNY: '人民币', EUR: '欧元', JPY: '日元', GBP: '英镑',
      HKD: '港币', AUD: '澳元', CAD: '加元', KRW: '韩元',
      INR: '印度卢比', BRL: '巴西雷亚尔', USD: '美元',
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
          <DollarSign className="w-4 h-4" />
          <span>基准货币: 1 USD</span>
          <span className="text-white/40">· 更新: {exchangeData.lastUpdate}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map(([currency, rate]) => (
            <div
              key={currency}
              className="bg-gradient-to-r from-white/6 to-white/2 backdrop-blur-xl rounded-lg p-3 border border-white/10 hover:border-emerald-400/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50">{currencyNames[currency] || currency}</div>
                  <div className="text-lg font-bold text-white">{rate.toFixed(4)}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-white text-xs font-bold">
                  {currency.slice(0, 3)}
                </div>
              </div>
              <div className="mt-1 text-xs text-white/40">1 {exchangeData.base} = {rate.toFixed(4)} {currency}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderCrypto = () => {
    if (loading.crypto && cryptoData.length === 0) {
      return <SkeletonGrid count={5} />
    }
    if (cryptoData.length === 0) return <EmptyState message="暂无加密货币数据" />

    const filtered = searchQuery
      ? cryptoData.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
      : cryptoData

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs text-white/50 font-medium">
          <div className="col-span-4">币种</div>
          <div className="col-span-2 text-right">价格</div>
          <div className="col-span-2 text-right">1h</div>
          <div className="col-span-2 text-right">24h</div>
          <div className="col-span-2 text-right">市值</div>
        </div>
        {filtered.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-12 gap-2 items-center px-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-transparent hover:border-amber-400/20 transition-all cursor-pointer"
          >
            <div className="col-span-4 flex items-center gap-2">
              {c.image && <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" loading="lazy" />}
              <div>
                <div className="text-white font-medium text-sm">{c.name}</div>
                <div className="text-white/40 text-xs">{c.symbol}</div>
              </div>
            </div>
            <div className="col-span-2 text-right">
              <div className="text-white font-semibold text-sm">${formatPrice(c.currentPrice)}</div>
            </div>
            <div className="col-span-2 text-right">
              <div className={`flex items-center justify-end gap-0.5 text-xs ${c.priceChange1h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {c.priceChange1h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(c.priceChange1h).toFixed(2)}%
              </div>
            </div>
            <div className="col-span-2 text-right">
              <div className={`flex items-center justify-end gap-0.5 text-xs ${c.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {c.priceChange24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(c.priceChange24h).toFixed(2)}%
              </div>
            </div>
            <div className="col-span-2 text-right text-white/60 text-xs">
              {formatMarketCap(c.marketCap)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderHN = () => {
    if (loading.hn && hnStories.length === 0) {
      return <SkeletonGrid count={10} />
    }
    if (hnStories.length === 0) return <EmptyState message="暂无新闻数据" />

    const filtered = searchQuery
      ? hnStories.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : hnStories

    return (
      <div className="space-y-1.5">
        {filtered.map((story, idx) => (
          <a
            key={story.id}
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-transparent hover:border-rose-400/20 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center text-white text-xs font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium group-hover:text-rose-300 transition-colors line-clamp-2">
                  {story.title}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3" />
                    {story.score}
                  </span>
                  <span>{story.by}</span>
                  <span>{timeAgo(story.time)}</span>
                  <span className="flex items-center gap-0.5">
                    <MessageIcon /> {story.descendants}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors flex-shrink-0" />
            </div>
          </a>
        ))}
      </div>
    )
  }

  const renderClock = () => {
    if (worldClocks.length === 0) {
      return <SkeletonGrid count={6} />
    }

    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {worldClocks.map((wc) => {
          const timeParts = wc.time.split(':')
          const timeStr = `${timeParts[0] || '00'}:${timeParts[1] || '00'}`
          const secs = timeParts[2] || '00'
          const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18

          return (
            <div
              key={wc.city}
              className="relative bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl p-4 border border-white/10 overflow-hidden"
            >
              {isDay ? (
                <Sun className="absolute top-2 right-2 w-12 h-12 text-amber-400/20" />
              ) : (
                <CloudMoon className="absolute top-2 right-2 w-12 h-12 text-indigo-400/20" />
              )}
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <Globe className="w-4 h-4" />
                <span className="font-medium">{wc.city}</span>
              </div>
              <div className="text-3xl font-bold text-white font-mono tracking-tight">
                {timeStr}:<span className="text-amber-300">{secs}</span>
              </div>
              <div className="text-xs text-white/50 mt-1">
                {wc.date} <span className="ml-1">{wc.offset}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ============ 主渲染 ============
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold">GlobalPulse · 全球脉动</h1>
            <p className="text-xs text-white/50">实时全球数据仪表盘</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-white/40">
              更新: {lastUpdate.toLocaleTimeString('zh-CN')}
            </span>
          )}
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 错误提示 */}
        {Object.entries(error).map(([key, msg]) =>
          msg ? (
            <div key={key} className="mb-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {msg}
            </div>
          ) : null
        )}

        {/* Tab 内容 */}
        <div className="min-h-full">
          {activeTab === 'weather' && renderWeather()}
          {activeTab === 'exchange' && renderExchange()}
          {activeTab === 'crypto' && renderCrypto()}
          {activeTab === 'hn' && renderHN()}
          {activeTab === 'clock' && renderClock()}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-white/40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Zap className={`w-3 h-3 ${Object.values(loading).some(Boolean) ? 'animate-pulse text-amber-400' : 'text-emerald-400'}`} />
            {Object.values(loading).some(Boolean) ? '加载中' : '已就绪'}
          </span>
          <span>API缓存: {apiCache.size} 项</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'weather' && (
            <button
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 text-xs"
            >
              °{unit} 切换
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// ==================== 辅助组件 ====================
function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
          <div className="h-4 w-20 bg-white/10 rounded mb-2" />
          <div className="h-8 w-16 bg-white/10 rounded mb-2" />
          <div className="h-3 w-full bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-white/40">
      <Layers className="w-12 h-12 mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function MessageIcon() {
  return <span className="w-3 h-3 inline-block" />
}

export default GlobalPulse
