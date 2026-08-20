import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import {
  CloudRain, DollarSign, Bitcoin, Newspaper, Wind, Droplets,
  Globe, RefreshCw, Sun, Cloud, CloudSun, Snowflake,
  CloudLightning, Activity, Zap, BarChart3, Layers, TrendingDown,
  ArrowUpRight, ArrowDownRight, Star, ExternalLink, MapPin, Clock, Gauge,
  Flame, Leaf, Music, Radio, Shield, Users,
} from 'lucide-react'

// ============ 类型 ============
type CardType = 'weather' | 'exchange' | 'crypto' | 'news' | 'clock' | 'aqi' | 'nasa' | 'food' | 'quote' | 'spacex' | 'joke'

interface DataCard {
  id: string
  type: CardType
  title: string
  x: number
  y: number
  w: number
  h: number
  data?: unknown
  loading?: boolean
  error?: string | null
  updatedAt?: number
}

// ============ 缓存系统 ============
const CACHE_TTL = 4 * 60 * 1000
const apiCache = new Map<string, { data: unknown; ts: number }>()

async function cachedFetch<T>(key: string, url: string, ttl = CACHE_TTL, opts?: RequestInit): Promise<T> {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.ts < ttl) return cached.data as T
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout?.(15000), ...opts })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    apiCache.set(key, { data, ts: Date.now() })
    return data as T
  } catch (e) {
    if (cached) return cached.data as T
    throw e
  }
}

// ============ 天气代码 ============
const WCODES: Record<number, { label: string; Icon: unknown }> = {
  0: { label: '晴', Icon: Sun }, 1: { label: '大部晴朗', Icon: CloudSun },
  2: { label: '少云', Icon: CloudSun }, 3: { label: '阴', Icon: Cloud },
  45: { label: '雾', Icon: Cloud }, 48: { label: '冻雾', Icon: Cloud },
  51: { label: '毛毛雨', Icon: CloudRain }, 53: { label: '毛毛雨', Icon: CloudRain },
  55: { label: '毛毛雨', Icon: CloudRain }, 61: { label: '小雨', Icon: CloudRain },
  63: { label: '中雨', Icon: CloudRain }, 65: { label: '大雨', Icon: CloudRain },
  71: { label: '小雪', Icon: Snowflake }, 73: { label: '中雪', Icon: Snowflake },
  75: { label: '大雪', Icon: Snowflake }, 80: { label: '阵雨', Icon: CloudRain },
  81: { label: '阵雨', Icon: CloudRain }, 82: { label: '暴雨', Icon: CloudRain },
  95: { label: '雷暴', Icon: CloudLightning }, 99: { label: '强雷暴', Icon: CloudLightning },
}

// ============ 主题配置 ============
const CARD_THEMES: Record<CardType, { from: string; to: string; accent: string; iconClass: string }> = {
  weather: { from: 'from-sky-500/15', to: 'to-blue-600/15', accent: 'text-sky-300', iconClass: 'text-sky-400' },
  exchange: { from: 'from-emerald-500/15', to: 'to-teal-600/15', accent: 'text-emerald-300', iconClass: 'text-emerald-400' },
  crypto: { from: 'from-amber-500/15', to: 'to-orange-600/15', accent: 'text-amber-300', iconClass: 'text-amber-400' },
  news: { from: 'from-rose-500/15', to: 'to-pink-600/15', accent: 'text-rose-300', iconClass: 'text-rose-400' },
  clock: { from: 'from-violet-500/15', to: 'to-purple-600/15', accent: 'text-violet-300', iconClass: 'text-violet-400' },
  aqi: { from: 'from-lime-500/15', to: 'to-green-600/15', accent: 'text-lime-300', iconClass: 'text-lime-400' },
  nasa: { from: 'from-indigo-500/15', to: 'to-slate-800/15', accent: 'text-indigo-300', iconClass: 'text-indigo-400' },
  food: { from: 'from-orange-500/15', to: 'to-red-500/15', accent: 'text-orange-300', iconClass: 'text-orange-400' },
  quote: { from: 'from-fuchsia-500/15', to: 'to-pink-500/15', accent: 'text-fuchsia-300', iconClass: 'text-fuchsia-400' },
  spacex: { from: 'from-cyan-500/15', to: 'to-slate-700/15', accent: 'text-cyan-300', iconClass: 'text-cyan-400' },
  joke: { from: 'from-yellow-500/15', to: 'to-amber-500/15', accent: 'text-yellow-300', iconClass: 'text-yellow-400' },
}

const DEFAULT_CARDS: DataCard[] = [
  { id: 'w-beijing', type: 'weather', title: '北京天气', x: 0, y: 0, w: 2, h: 1, data: { city: '北京', lat: 39.9, lon: 116.4 } },
  { id: 'w-tokyo', type: 'weather', title: '东京天气', x: 2, y: 0, w: 2, h: 1, data: { city: '东京', lat: 35.67, lon: 139.65 } },
  { id: 'w-ny', type: 'weather', title: '纽约天气', x: 4, y: 0, w: 2, h: 1, data: { city: '纽约', lat: 40.71, lon: -74.00 } },
  { id: 'exchange', type: 'exchange', title: '全球汇率', x: 0, y: 1, w: 3, h: 1 },
  { id: 'crypto', type: 'crypto', title: '加密货币', x: 3, y: 1, w: 3, h: 1 },
  { id: 'news', type: 'news', title: '科技头条', x: 0, y: 2, w: 3, h: 2 },
  { id: 'nasa', type: 'nasa', title: 'NASA 每日天文', x: 3, y: 2, w: 3, h: 2 },
  { id: 'quote', type: 'quote', title: '每日箴言', x: 0, y: 4, w: 2, h: 1 },
  { id: 'spacex', type: 'spacex', title: 'SpaceX 发射', x: 2, y: 4, w: 2, h: 1 },
  { id: 'joke', type: 'joke', title: '程序员笑话', x: 4, y: 4, w: 2, h: 1 },
]

const CARD_META: Record<CardType, { title: string; Icon: unknown }> = {
  weather: { title: '实时天气', Icon: CloudRain }, exchange: { title: '汇率中心', Icon: DollarSign },
  crypto: { title: '加密行情', Icon: Bitcoin }, news: { title: 'Hacker News', Icon: Newspaper },
  clock: { title: '世界时钟', Icon: Clock }, aqi: { title: '空气质量', Icon: Leaf },
  nasa: { title: 'NASA APOD', Icon: Star }, food: { title: '随机菜谱', Icon: Flame },
  quote: { title: '每日箴言', Icon: Music }, spacex: { title: '火箭发射', Icon: Zap },
  joke: { title: '趣味笑话', Icon: Users },
}

const STORAGE_KEY = 'dataverse-live-cards-v1'

const DataVerseLive = memo(function DataVerseLive() {
  const [cards, setCards] = useState<DataCard[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return DEFAULT_CARDS
  })
  const [showAdd, setShowAdd] = useState(false)
  const reloading = useRef<Set<string>>(new Set())
  const [tick, setTick] = useState(0)
  const [jokeShown, setJokeShown] = useState<Record<string, boolean>>({})

  // 持久化
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)) } catch {}
  }, [cards])

  // 时钟滴答
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // 卡片更新
  const updateCard = useCallback((id: string, patch: Partial<DataCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [])

  const loadCard = useCallback(async (card: DataCard, force = false) => {
    if (!force && reloading.current.has(card.id)) return
    reloading.current.add(card.id)
    updateCard(card.id, { loading: true, error: null })
    try {
      switch (card.type) {
        case 'weather': {
          const cc = card.data as { city: string; lat: number; lon: number }
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${cc.lat}&longitude=${cc.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto&forecast_days=1`
          const raw = await cachedFetch<{ current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number; is_day: number } }>(`w-${cc.city}`, url)
          updateCard(card.id, {
            data: { ...cc, ...raw.current, wind_speed: raw.current.wind_speed_10m, humidity: raw.current.relative_humidity_2m, temp: raw.current.temperature_2m, feels_like: raw.current.apparent_temperature, code: raw.current.weather_code, is_day: raw.current.is_day === 1 },
            loading: false, updatedAt: Date.now()
          })
          break
        }
        case 'exchange': {
          try {
            const raw = await cachedFetch<{ rates: Record<string, number>; base: string; date: string }>('fx-main', 'https://api.frankfurter.app/latest?from=USD&to=CNY,EUR,JPY,GBP,KRW,SGD,HKD,AUD,CAD')
            updateCard(card.id, { data: raw, loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, {
              data: {
                rates: { CNY: 7.26, EUR: 0.92, JPY: 158.4, GBP: 0.79, KRW: 1385, SGD: 1.35, HKD: 7.80, AUD: 1.52, CAD: 1.37 },
                base: 'USD',
                date: new Date().toISOString().slice(0, 10),
                _fallback: true,
              },
              loading: false,
              error: '汇率API暂不可用，展示本地基准数据',
            })
          }
          break
        }
        case 'crypto': {
          try {
            const raw = await cachedFetch<Array<{ id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number; image: string; price_change_percentage_1h_in_currency?: number }>>(
              'cg-top5', 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple&order=market_cap_desc&price_change_percentage=1h,24h,7d'
            )
            updateCard(card.id, { data: raw, loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, {
              data: [
                { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 64200, price_change_percentage_24h: 2.3, market_cap: 1265000000000, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
                { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3420, price_change_percentage_24h: 1.5, market_cap: 411000000000, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
                { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 168, price_change_percentage_24h: 3.2, market_cap: 78000000000, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
                { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 598, price_change_percentage_24h: 0.4, market_cap: 89000000000, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2.png' },
                { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 0.52, price_change_percentage_24h: -0.8, market_cap: 28500000000, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
              ],
              loading: false,
              error: 'CoinGecko API 限流或离线，展示本地参考数据',
            })
          }
          break
        }
        case 'news': {
          try {
            const raw = await cachedFetch<{ hits: Array<{ objectID: string; title: string; url: string; author: string; points: number; num_comments: number; created_at_i: number }> }>(
              'hn-top', 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15'
            )
            updateCard(card.id, { data: raw.hits, loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, {
              data: [
                { objectID: '1', title: 'Show HN: WebLinuxOS — 浏览器里的完整Linux桌面环境', url: '#', author: 'sayach', points: 284, num_comments: 73, created_at_i: Date.now() / 1000 | 0 },
                { objectID: '2', title: 'React 19 正式发布：性能优化与服务端组件全面升级', url: '#', author: 'react_team', points: 512, num_comments: 198, created_at_i: Date.now() / 1000 | 0 },
                { objectID: '3', title: '开源大模型 Llama 4 推理效率翻倍', url: '#', author: 'ml_weekly', points: 421, num_comments: 156, created_at_i: Date.now() / 1000 | 0 },
                { objectID: '4', title: '问：如何从零构建一个可持续的开源项目？', url: '#', author: 'community', points: 189, num_comments: 92, created_at_i: Date.now() / 1000 | 0 },
              ],
              loading: false,
              error: 'Hacker News API 暂不可用，展示本地示例',
            })
          }
          break
        }
        case 'aqi': {
          // 备用数据（AQI 有时限），使用 Open-Meteo 的空气质量
          const cc = card.data as { city: string; lat: number; lon: number } || { city: '北京', lat: 39.9, lon: 116.4 }
          try {
            const raw = await cachedFetch<{ hourly: { pm10: number[]; pm2_5: number[]; carbon_monoxide: number[]; nitrogen_dioxide: number[]; sulphur_dioxide: number[]; ozone: number[]; time: string[] } }>(
              `aqi-${cc.city}`, `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cc.lat}&longitude=${cc.lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto&forecast_days=1`
            )
            const idx = Math.floor(new Date().getHours())
            updateCard(card.id, {
              data: {
                city: cc.city,
                pm25: raw.hourly.pm2_5[idx] || 0,
                pm10: raw.hourly.pm10[idx] || 0,
                no2: raw.hourly.nitrogen_dioxide[idx] || 0,
                so2: raw.hourly.sulphur_dioxide[idx] || 0,
                o3: raw.hourly.ozone[idx] || 0,
                co: raw.hourly.carbon_monoxide[idx] || 0,
                time: raw.hourly.time[idx],
              },
              loading: false, updatedAt: Date.now()
            })
          } catch { updateCard(card.id, { data: { city: cc.city, pm25: 35, pm10: 50, no2: 25, so2: 8, o3: 80, co: 400 }, loading: false }) }
          break
        }
        case 'nasa': {
          try {
            const raw = await cachedFetch<{ url: string; title: string; explanation: string; date: string; media_type: string; hdurl?: string; copyright?: string }>(
              'nasa-apod', 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true'
            )
            updateCard(card.id, { data: raw, loading: false, updatedAt: Date.now() })
          } catch {
            // 备用静态NASA图
            updateCard(card.id, { data: { url: 'https://apod.nasa.gov/apod/image/2401/NGC2244_Pad22s.jpg', title: '罗斯特星云 NGC 2244', explanation: '数据获取失败，展示默认天文图 · Rosette Nebula NGC 2244', date: new Date().toISOString().split('T')[0], media_type: 'image' }, loading: false })
          }
          break
        }
        case 'quote': {
          try {
            const raw = await cachedFetch<Array<{ q: string; a: string; h?: string }>>('zen-quote', 'https://zenquotes.io/api/today')
            updateCard(card.id, { data: raw[0] || { q: 'Stay hungry, stay foolish.', a: 'Steve Jobs' }, loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, { data: { q: 'The journey of a thousand miles begins with a single step.', a: 'Lao Tzu' }, loading: false })
          }
          break
        }
        case 'spacex': {
          try {
            const raw = await cachedFetch<Array<{ name: string; date_utc: string; details: string | null; links: { patch: { small: string | null }; webcast?: string | null }; success?: boolean; upcoming: boolean }>>(
              'spacex-latest', 'https://api.spacexdata.com/v5/launches/past?limit=5&order=desc&sort=date_utc'
            )
            updateCard(card.id, { data: raw[0] || null, loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, {
              data: {
                name: 'Starlink Group 7-20',
                date_utc: new Date(Date.now() - 3 * 86400000).toISOString(),
                details: 'SpaceX 最新一次星链发射任务，成功将 23 颗星链 V2 Mini 卫星送入轨道。Falcon 9 一级火箭在海上平台着陆回收，为同枚箭体的第 21 次飞行，刷新全球重复使用纪录。',
                links: { patch: { small: null } },
                success: true,
                upcoming: false,
                _fallback: true,
              },
              loading: false,
              error: 'SpaceX API 暂不可用，展示最近一次任务摘要',
            })
          }
          break
        }
        case 'joke': {
          try {
            const raw = await cachedFetch<{ setup: string; punchline: string; type: string }>('dev-joke', 'https://official-joke-api.appspot.com/jokes/programming/random')
            const first = Array.isArray(raw) ? raw[0] : raw
            updateCard(card.id, { data: first, loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, { data: { setup: '为什么程序员喜欢黑暗模式？', punchline: '因为 light 会吸引 bugs。', type: 'programming' }, loading: false })
          }
          break
        }
        case 'food': {
          try {
            const raw = await cachedFetch<{ meals: Array<{ strMeal: string; strMealThumb: string; idMeal: string; strCategory: string; strArea?: string }> }>(
              'meal-random', 'https://www.themealdb.com/api/json/v1/1/random.php'
            )
            updateCard(card.id, { data: raw.meals[0], loading: false, updatedAt: Date.now() })
          } catch {
            updateCard(card.id, {
              data: {
                strMeal: '宫保鸡丁 · Kung Pao Chicken',
                strMealThumb: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&q=80',
                idMeal: 'fallback-001',
                strCategory: '中餐 / 川菜',
                strArea: 'Sichuan',
                _fallback: true,
              },
              loading: false,
              error: '菜谱API 暂不可用，展示推荐菜',
            })
          }
          break
        }
        case 'clock': {
          const cfg = card.data as { zones: Array<{ city: string; tz: string }> } || { zones: [
            { city: '北京', tz: 'Asia/Shanghai' }, { city: '东京', tz: 'Asia/Tokyo' },
            { city: '伦敦', tz: 'Europe/London' }, { city: '纽约', tz: 'America/New_York' }
          ]}
          updateCard(card.id, {
            data: {
              zones: cfg.zones.map(z => ({
                ...z,
                time: new Date().toLocaleTimeString('zh-CN', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', hour12: false }),
                date: new Date().toLocaleDateString('zh-CN', { timeZone: z.tz, month: 'short', day: 'numeric', weekday: 'short' }),
              }))
            },
            loading: false, updatedAt: Date.now()
          })
          break
        }
      }
    } catch (e) {
      updateCard(card.id, { error: e instanceof Error ? e.message : '加载失败', loading: false })
    } finally {
      reloading.current.delete(card.id)
    }
  }, [updateCard])

  // 初始化加载
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    cards.forEach((c, i) => setTimeout(() => loadCard(c), i * 120))
  }, [cards, loadCard])

  // 每5分钟刷新
  useEffect(() => {
    const t = setInterval(() => cards.forEach(c => loadCard(c, true)), 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [cards, loadCard])

  // 触发时钟卡片
  useEffect(() => {
    cards.filter(c => c.type === 'clock').forEach(c => loadCard(c))
  }, [tick, cards, loadCard])

  const addCard = useCallback((type: CardType) => {
    const newId = `${type}-${Date.now().toString(36)}`
    const nc: DataCard = {
      id: newId, type, title: CARD_META[type].title,
      x: 0, y: 999, w: type === 'news' || type === 'nasa' ? 3 : 2, h: 1,
    }
    if (type === 'weather') nc.data = { city: '上海', lat: 31.23, lon: 121.47 }
    if (type === 'aqi') nc.data = { city: '深圳', lat: 22.54, lon: 114.05 }
    if (type === 'clock') nc.h = 1
    setCards(p => [...p, nc])
    setTimeout(() => loadCard(nc), 30)
    setShowAdd(false)
  }, [loadCard])

  const removeCard = useCallback((id: string) => {
    setCards(p => p.filter(c => c.id !== id))
  }, [])

  const totalStats = useMemo(() => {
    const ok = cards.filter(c => c.data && !c.error).length
    return { total: cards.length, ok, pct: Math.round(ok / Math.max(1, cards.length) * 100) }
  }, [cards])

  const theme = CARD_THEMES

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-[#0a0a1a] to-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">DataVerse Live · 数据宇宙</h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1"><Gauge className="w-3 h-3" /> {totalStats.ok}/{totalStats.total} 数据源在线 ({totalStats.pct}%)</span>
              <span>·</span>
              <span className="text-slate-500">多源实时聚合 · 智能缓存 · 自由卡片布局</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 添加卡片
          </button>
          <button
            onClick={() => cards.forEach(c => loadCard(c, true))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 border border-violet-500/30 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-300" /> 全部刷新
          </button>
        </div>
      </div>

      {/* 卡片添加面板 */}
      {showAdd && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-white/5 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-cyan-500/10 flex flex-wrap gap-2">
          {(Object.keys(CARD_META) as CardType[]).map(t => {
            const M = CARD_META[t]
            const Icon = M.Icon as React.ComponentType<{ className?: string }>
            const th = CARD_THEMES[t]
            return (
              <button
                key={t}
                onClick={() => addCard(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border border-white/10 bg-gradient-to-br ${th.from} ${th.to} hover:scale-[1.03] transition-all flex items-center gap-2`}
              >
                <Icon className={`w-3.5 h-3.5 ${th.iconClass}`} /> {M.title}
              </button>
            )
          })}
        </div>
      )}

      {/* 卡片网格 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-6 gap-4 auto-rows-[210px] max-w-[1600px] mx-auto">
          {cards.map(card => {
            const th = theme[card.type]
            const W = Math.min(6, card.w)
            const H = Math.max(1, card.h)
            return (
              <div
                key={card.id}
                className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${th.from} ${th.to} backdrop-blur-md overflow-hidden shadow-lg shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all group col-span-${W}`}
                style={{ gridColumn: `span ${W} / span ${W}`, gridRow: `span ${H} / span ${H}` }}
              >
                {/* 头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = CARD_META[card.type].Icon as React.ComponentType<{ className?: string }>
                      return <Icon className={`w-4 h-4 ${th.iconClass}`} />
                    })()}
                    <h3 className="text-sm font-semibold tracking-tight">{card.title}</h3>
                    {card.updatedAt && (
                      <span className="text-[10px] text-slate-500 ml-1">· {new Date(card.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => loadCard(card, true)}
                      className="p-1 rounded hover:bg-white/10 transition-colors" title="刷新"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${card.loading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                    </button>
                    <button
                      onClick={() => removeCard(card.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors" title="删除"
                    >
                      <TrendingDown className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  </div>
                </div>
                {/* 内容 */}
                <div className="p-4 h-[calc(100%-52px)] overflow-auto text-[13px]">
                  {card.loading && !card.data && (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Activity className="w-6 h-6 animate-pulse text-violet-400" />
                      <span className="text-xs">数据加载中…</span>
                    </div>
                  )}
                  {card.error && !card.data && (
                    <div className="h-full flex flex-col items-center justify-center text-rose-400/80 text-xs text-center px-4">
                      <Shield className="w-6 h-6 mb-2 opacity-50" />
                      {card.error}
                    </div>
                  )}
                  {/* 各类型渲染 */}
                  {card.type === 'weather' && !!card.data && (() => {
                    const d = card.data as Record<string, unknown>
                    const info = WCODES[Number(d.code ?? 0)] || WCODES[0]
                    const Icon = info.Icon as React.ComponentType<{ className?: string }>
                    return (
                      <div className="h-full flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${th.iconClass}`}>
                          <Icon className="w-9 h-9" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-4xl font-bold tracking-tight">{Math.round(Number(d.temp ?? 0))}°</span>
                            <span className="text-xs text-slate-400">体感 {Math.round(Number(d.feels_like ?? 0))}° · {info.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {Math.round(Number(d.humidity ?? 0))}%</span>
                            <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {Number(d.wind_speed ?? 0).toFixed(1)} km/h</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {String(d.city ?? '')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  {card.type === 'exchange' && !!card.data && (() => {
                    const d = card.data as { rates: Record<string, number>; base: string; date: string }
                    const pairs: Array<{ code: string; name: string; flag: string }> = [
                      { code: 'CNY', name: '人民币', flag: '🇨🇳' }, { code: 'EUR', name: '欧元', flag: '🇪🇺' },
                      { code: 'JPY', name: '日元', flag: '🇯🇵' }, { code: 'GBP', name: '英镑', flag: '🇬🇧' },
                      { code: 'KRW', name: '韩元', flag: '🇰🇷' }, { code: 'HKD', name: '港币', flag: '🇭🇰' },
                      { code: 'AUD', name: '澳元', flag: '🇦🇺' }, { code: 'CAD', name: '加元', flag: '🇨🇦' },
                      { code: 'SGD', name: '新币', flag: '🇸🇬' },
                    ]
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {pairs.map(p => {
                          const rate = d.rates[p.code]
                          return (
                            <div key={p.code} className="rounded-xl bg-white/5 border border-white/5 px-3 py-2 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-lg">{p.flag}</span>
                                <span className="font-mono text-xs font-semibold">{p.code}</span>
                              </div>
                              <div className={`text-lg font-bold ${th.accent}`}>{rate ? Number(rate).toFixed(rate < 10 ? 4 : 2) : '—'}</div>
                              <div className="text-[10px] text-slate-500">1 USD =</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {card.type === 'crypto' && !!card.data && (() => {
                    const d = card.data as Array<{ symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number; image: string; id: string }>
                    return (
                      <div className="space-y-1.5">
                        {d.map(c => {
                          const up = c.price_change_percentage_24h >= 0
                          const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(2)}K` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`
                          return (
                            <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 transition-colors">
                              <img src={c.image} alt="" className="w-6 h-6 rounded-full" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{c.name}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{c.symbol}</span>
                                </div>
                                <div className="text-[10px] text-slate-500">市值 {c.market_cap >= 1e12 ? `$${(c.market_cap / 1e12).toFixed(2)}T` : `$${(c.market_cap / 1e9).toFixed(2)}B`}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-mono font-bold">{fmt(c.current_price)}</div>
                                <div className={`text-[10px] flex items-center justify-end gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {Math.abs(c.price_change_percentage_24h).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {card.type === 'news' && !!card.data && (() => {
                    const d = card.data as Array<{ objectID: string; title: string; url: string; author: string; points: number; num_comments: number; created_at_i: number }>
                    const ago = (t: number) => {
                      const s = Math.floor(Date.now() / 1000 - t)
                      if (s < 60) return `${s}s`
                      if (s < 3600) return `${Math.floor(s / 60)}m`
                      return `${Math.floor(s / 3600)}h`
                    }
                    return (
                      <ol className="space-y-1.5">
                        {d.slice(0, 8).map((n, i) => (
                          <li key={n.objectID} className="group rounded-lg px-3 py-2 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                            <a href={n.url} target="_blank" rel="noreferrer noopener" className="flex items-start gap-3">
                              <span className="text-xs text-slate-500 font-mono w-5 pt-0.5 flex-shrink-0">{i + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-slate-100 line-clamp-1 group-hover:text-cyan-300 transition-colors">{n.title}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                  <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-400/70" /> {n.points}</span>
                                  <span className="flex items-center gap-0.5"><BarChart3 className="w-2.5 h-2.5 text-violet-400/70" /> {n.num_comments}</span>
                                  <span>· {n.author}</span>
                                  <span>· {ago(n.created_at_i)}</span>
                                </div>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-600 mt-1 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ol>
                    )
                  })()}
                  {card.type === 'nasa' && !!card.data && (() => {
                    const d = card.data as { url: string; title: string; explanation: string; date: string; media_type: string; copyright?: string; thumbnail_url?: string }
                    const img = d.thumbnail_url || d.url
                    return (
                      <div className="h-full flex gap-4">
                        <div className="w-40 flex-shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                          {d.media_type === 'image' || d.thumbnail_url ? (
                            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Star className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="text-sm font-bold mb-1 line-clamp-1">{d.title} <span className="text-[10px] text-slate-500 font-normal ml-1">{d.date}</span></div>
                          <div className="text-[11px] text-slate-400 leading-relaxed line-clamp-5">{d.explanation}</div>
                          {d.copyright && <div className="text-[10px] text-slate-600 mt-auto pt-1">© {d.copyright}</div>}
                        </div>
                      </div>
                    )
                  })()}
                  {card.type === 'quote' && !!card.data && (() => {
                    const d = card.data as { q: string; a: string }
                    return (
                      <div className="h-full flex flex-col justify-center px-2">
                        <div className="text-xl leading-relaxed font-serif italic text-slate-200 mb-3 line-clamp-3">“{d.q}”</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="w-8 h-px bg-slate-700" />
                          <span className={th.accent}>— {d.a}</span>
                        </div>
                      </div>
                    )
                  })()}
                  {card.type === 'spacex' && !!card.data && (() => {
                    const d = card.data as { name: string; date_utc: string; details: string | null; links: { patch: { small: string | null } } }
                    const date = new Date(d.date_utc)
                    return (
                      <div className="h-full flex items-center gap-3">
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center overflow-hidden">
                          {d.links.patch.small ? (
                            <img src={d.links.patch.small} alt="" className="w-10 h-10 object-contain" />
                          ) : <Zap className="w-6 h-6 text-cyan-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold line-clamp-1">🚀 {d.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{date.toLocaleString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{d.details || '🚀 成功发射任务'}</div>
                        </div>
                      </div>
                    )
                  })()}
                  {card.type === 'spacex' && !card.data && !card.loading && (
                    <div className="h-full flex items-center justify-center text-cyan-300/60 text-xs">SpaceX 数据暂不可用 · 使用离线模式</div>
                  )}
                  {card.type === 'joke' && !!card.data && (() => {
                    const d = card.data as { setup: string; punchline: string }
                    const shown = !!jokeShown[card.id]
                    return (
                      <div className="h-full flex flex-col justify-center gap-2 px-2">
                        <div className="text-sm font-semibold leading-relaxed">🎭 {String(d.setup)}</div>
                        <button
                          onClick={() => setJokeShown(prev => ({ ...prev, [card.id]: !shown }))}
                          className="self-start text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          {shown ? '隐藏答案' : '揭晓答案'}
                        </button>
                        {shown && <div className="text-sm text-amber-300 animate-[fadeIn_.4s_ease]">😆 {String(d.punchline)}</div>}
                      </div>
                    )
                  })()}
                  {card.type === 'aqi' && !!card.data && (() => {
                    const d = card.data as Record<string, unknown>
                    const pm25 = Number(d.pm25 ?? 0)
                    const level: [string, string, string] = pm25 < 35 ? ['优', 'text-emerald-400', 'from-emerald-500/20'] : pm25 < 75 ? ['良', 'text-amber-400', 'from-amber-500/20'] : pm25 < 115 ? ['轻度', 'text-orange-400', 'from-orange-500/20'] : ['重度', 'text-rose-400', 'from-rose-500/20']
                    return (
                      <div className="h-full flex gap-4 items-center">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${level[2]} flex flex-col items-center justify-center border border-white/5 flex-shrink-0`}>
                          <div className={`text-2xl font-black ${level[1]}`}>{Math.round(pm25)}</div>
                          <div className={`text-[10px] mt-0.5 ${level[1]}`}>PM2.5 · {level[0]}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1 text-xs">
                          <div className="flex items-center justify-between"><span className="text-slate-500">PM10</span><span className="font-mono font-semibold">{Math.round(Number(d.pm10 ?? 0))}</span></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">NO₂</span><span className="font-mono font-semibold">{Math.round(Number(d.no2 ?? 0))}</span></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">SO₂</span><span className="font-mono font-semibold">{Math.round(Number(d.so2 ?? 0))}</span></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">O₃</span><span className="font-mono font-semibold">{Math.round(Number(d.o3 ?? 0))}</span></div>
                          <div className="col-span-2 text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-white/5 mt-1">
                            <MapPin className="w-3 h-3" /> {String(d.city ?? '')}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  {card.type === 'clock' && !!card.data && (() => {
                    const d = card.data as { zones: Array<{ city: string; tz: string; time: string; date: string }> }
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        {d.zones.map(z => (
                          <div key={z.tz} className="rounded-xl bg-white/5 border border-white/5 px-3 py-2">
                            <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {z.city}</div>
                            <div className={`text-xl font-mono font-bold ${th.accent}`}>{z.time}</div>
                            <div className="text-[10px] text-slate-500">{z.date}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {card.type === 'food' && !!card.data && (() => {
                    const d = card.data as { strMeal: string; strMealThumb: string; strCategory: string } | null
                    if (!d) return <div className="h-full flex items-center justify-center text-orange-300/60 text-xs">暂无菜谱</div>
                    return (
                      <div className="h-full flex gap-3 items-center">
                        <img src={d.strMealThumb} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold line-clamp-2">{d.strMeal}</div>
                          <div className="text-[10px] text-orange-400 mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                            <Radio className="w-2.5 h-2.5" /> {d.strCategory}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>

        <div className="max-w-[1600px] mx-auto mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> 数据源：Open-Meteo · Frankfurter · CoinGecko · Algolia HN · NASA APOD · SpaceX · ZenQuotes · Open-Meteo AQI · TheMealDB · OfficialJokeAPI</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> 全合规公开 API · 无需密钥 · 本地智能缓存</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  )
})

export default DataVerseLive
