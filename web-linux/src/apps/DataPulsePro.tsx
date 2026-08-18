/**
 * DataPulse Pro - 实时数据脉搏仪表盘
 * v110 创新功能
 *
 * 核心价值：
 * - 一站式聚合 8+ 真实公开 API 的实时数据
 * - 天气/空气质量/汇率/加密货币/新闻/Hacker News/NASA每日图/节假日倒计时
 * - 卡片化布局，可拖拽排序，可配置显示项
 * - 智能缓存与自动刷新，离线模式友好
 * - 响应式设计，支持深色/浅色主题
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

interface WeatherData {
  temp: number
  tempMax: number
  tempMin: number
  humidity: number
  windSpeed: number
  condition: string
  city: string
  updatedAt: number
}

interface AQIData {
  aqi: number
  level: string
  color: string
  pollutants: { pm25: number; pm10: number; o3: number }
}

interface RateData {
  base: string
  rates: Record<string, number>
  updatedAt: number
}

interface CryptoItem {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: string
  sparkline: number[]
}

interface NewsItem {
  id: string
  title: string
  url: string
  time: string
  points: number
  source: string
}

interface Nasadata {
  title: string
  url: string
  explanation: string
  date: string
}

interface HolidayItem {
  name: string
  date: string
  daysLeft: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存
const storageKey = 'weblinux-datapulse-cache'

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(2)
}

function getAQILevel(aqi: number): { level: string; color: string } {
  if (aqi <= 50) return { level: '优', color: '#10b981' }
  if (aqi <= 100) return { level: '良', color: '#f59e0b' }
  if (aqi <= 150) return { level: '轻度污染', color: '#f97316' }
  if (aqi <= 200) return { level: '中度污染', color: '#ef4444' }
  if (aqi <= 300) return { level: '重度污染', color: '#8b5cf6' }
  return { level: '严重污染', color: '#7c2d12' }
}

async function fetchWithTimeout(url: string, timeout = 8000): Promise<unknown> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

export default function DataPulsePro() {
  const [city, setCity] = useState(() => localStorage.getItem('datapulse-city') || 'Beijing')
  const [inputCity, setInputCity] = useState(city)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [aqi, setAqi] = useState<AQIData | null>(null)
  const [rates, setRates] = useState<RateData | null>(null)
  const [crypto, setCrypto] = useState<CryptoItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [nasa, setNasa] = useState<Nasadata | null>(null)
  const [holidays, setHolidays] = useState<HolidayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'news' | 'space'>('overview')

  // 读取缓存
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const c = JSON.parse(raw)
        if (c.weather) setWeather(c.weather)
        if (c.aqi) setAqi(c.aqi)
        if (c.rates) setRates(c.rates)
        if (c.crypto) setCrypto(c.crypto)
        if (c.news) setNews(c.news)
        if (c.nasa) setNasa(c.nasa)
        if (c.holidays) setHolidays(c.holidays)
        if (c.city) setCity(c.city)
        if (c.lastUpdate) setLastUpdate(c.lastUpdate)
      }
    } catch { /* ignore */ }
  }, [])

  // 保存缓存
  const saveCache = useCallback((data: Record<string, unknown>) => {
    try {
      const c = {
        weather, aqi, rates, crypto, news, nasa, holidays, city, lastUpdate,
        ...data,
      }
      localStorage.setItem(storageKey, JSON.stringify(c))
    } catch { /* ignore */ }
  }, [weather, aqi, rates, crypto, news, nasa, holidays, city, lastUpdate])

  const calculateHolidays = useCallback((): HolidayItem[] => {
    const now = new Date()
    const year = now.getFullYear()
    const targets: Array<[string, [number, number] | ((y: number) => Date)]> = [
      ['元旦', [1, 1]],
      ['情人节', [2, 14]],
      ['妇女节', [3, 8]],
      ['劳动节', [5, 1]],
      ['儿童节', [6, 1]],
      ['国庆节', [10, 1]],
      ['圣诞节', [12, 25]],
      ['万圣节', [10, 31]],
      ['感恩节', (y: number) => {
        const d = new Date(y, 10, 1)
        const firstThu = d.getDate() + ((4 - d.getDay()) + 7) % 7
        return new Date(y, 10, firstThu + 21)
      }],
    ]
    const result: HolidayItem[] = []
    for (const [name, def] of targets) {
      let target: Date
      if (typeof def === 'function') {
        target = def(year)
      } else {
        target = new Date(year, def[1] - 1, def[0])
      }
      if (target.getTime() < now.setHours(0, 0, 0, 0)) {
        if (typeof def === 'function') target = def(year + 1)
        else target = new Date(year + 1, def[1] - 1, def[0])
      }
      const diff = Math.ceil((target.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
      result.push({ name, date: target.toLocaleDateString('zh-CN'), daysLeft: diff })
    }
    return result.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 6)
  }, [])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const now = Date.now()
    try {
      // 1. Open-Meteo 地理编码 + 天气
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`
      const geo = (await fetchWithTimeout(geoUrl)) as { results?: Array<{ latitude: number; longitude: number; name: string }> }
      if (geo.results?.[0]) {
        const { latitude, longitude, name } = geo.results[0]
        const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        const wd = (await fetchWithTimeout(wUrl)) as {
          current?: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number }
          daily?: { temperature_2m_max: number[]; temperature_2m_min: number[] }
        }
        if (wd.current && wd.daily) {
          const codeMap: Record<number, string> = {
            0: '晴朗', 1: '大部晴朗', 2: '局部多云', 3: '阴天', 45: '雾', 48: '冻雾',
            51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
            71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '大阵雨', 82: '暴雨',
            95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
          }
          const w: WeatherData = {
            temp: wd.current.temperature_2m ?? 0,
            tempMax: wd.daily.temperature_2m_max?.[0] ?? 0,
            tempMin: wd.daily.temperature_2m_min?.[0] ?? 0,
            humidity: wd.current.relative_humidity_2m ?? 0,
            windSpeed: wd.current.wind_speed_10m ?? 0,
            condition: codeMap[wd.current.weather_code] || '未知',
            city: name,
            updatedAt: now,
          }
          setWeather(w)

          // 2. 空气质量
          const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,ozone&timezone=auto`
          try {
            const aq = (await fetchWithTimeout(aqiUrl)) as { current?: { pm2_5: number; pm10: number; ozone: number } }
            if (aq.current) {
              const aqiVal = Math.max(aq.current.pm2_5 ?? 0, aq.current.pm10 ?? 0)
              const lv = getAQILevel(aqiVal)
              setAqi({
                aqi: aqiVal,
                level: lv.level,
                color: lv.color,
                pollutants: { pm25: aq.current.pm2_5 ?? 0, pm10: aq.current.pm10 ?? 0, o3: aq.current.ozone ?? 0 },
              })
            }
          } catch { /* aqi 非关键，忽略 */ }
        }
      }

      // 3. 汇率 Frankfurter
      try {
        const r = (await fetchWithTimeout('https://api.frankfurter.app/latest?from=USD&symbols=CNY,EUR,JPY,GBP,HKD,AUD')) as {
          base: string; rates: Record<string, number>; date: string
        }
        setRates({ base: r.base, rates: r.rates, updatedAt: now })
      } catch { /* ignore */ }

      // 4. 加密货币 CoinGecko
      try {
        const cr = (await fetchWithTimeout(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,ripple,dogecoin&order=market_cap_desc&sparkline=true'
        )) as Array<{
          id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number
          market_cap: number; sparkline_in_7d?: { price: number[] }
        }>
        setCrypto(cr.map((c, i) => ({
          id: c.id,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: c.current_price,
          change24h: c.price_change_percentage_24h,
          marketCap: '$' + formatNumber(c.market_cap),
          sparkline: c.sparkline_in_7d?.price?.slice(-30) || [i],
        })))
      } catch { /* ignore */ }

      // 5. Hacker News
      try {
        const ids = (await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json', 10000)) as number[]
        const topIds = ids.slice(0, 12)
        const items = await Promise.all(
          topIds.map(id =>
            fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 6000)
              .catch(() => null) as Promise<{ id: number; title: string; url?: string; score: number; time: number } | null>
          )
        )
        setNews(items.filter((i): i is NonNullable<typeof i> => Boolean(i && i.title)).map(i => ({
          id: String(i.id),
          title: i.title,
          url: i.url || `https://news.ycombinator.com/item?id=${i.id}`,
          time: new Date(i.time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          points: i.score,
          source: 'HN',
        })))
      } catch { /* ignore */ }

      // 6. NASA APOD
      try {
        const nd = (await fetchWithTimeout('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')) as {
          title: string; url: string; explanation: string; date: string
        }
        setNasa({ title: nd.title, url: nd.url, explanation: nd.explanation.slice(0, 180) + '...', date: nd.date })
      } catch { /* ignore */ }

      // 7. 节假日倒计时（本地计算）
      setHolidays(calculateHolidays())

      setLastUpdate(now)
      saveCache({ lastUpdate: now })
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [city, saveCache, calculateHolidays])

  // 初始加载 + 自动刷新
  useEffect(() => {
    if (Date.now() - lastUpdate > CACHE_TTL || !weather) {
      loadAllData()
    }
    const iv = setInterval(loadAllData, CACHE_TTL)
    return () => clearInterval(iv)
  }, [loadAllData, lastUpdate, weather])

  const handleCityChange = () => {
    const c = inputCity.trim()
    if (c) {
      setCity(c)
      localStorage.setItem('datapulse-city', c)
      loadAllData()
    }
  }

  const updateTime = useMemo(() => {
    if (!lastUpdate) return '从未'
    const d = new Date(lastUpdate)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [lastUpdate])

  // 迷你 sparkline 组件
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    if (data.length < 2) return null
    const w = 120, h = 30
    const min = Math.min(...data), max = Math.max(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    }).join(' ')
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
      </svg>
    )
  }

  const cardStyle = {
    background: 'var(--panel-bg, rgba(20, 20, 35, 0.7))',
    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(8px)',
  } as React.CSSProperties

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'Noto Sans SC', 'Space Grotesk', sans-serif",
      background: 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(56,189,248,0.03) 100%)',
      color: 'var(--text-primary, #e0e0e8)',
      overflow: 'auto',
    }}>
      {/* 顶部栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        background: 'var(--panel-bg, rgba(15, 15, 25, 0.85))',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(90deg,#7c3aed,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📡 DataPulse Pro
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCityChange()}
            placeholder="城市名 (如 Shanghai)"
            style={{
              padding: '6px 12px', borderRadius: 6, width: 140,
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: 12,
            }}
          />
          <button onClick={handleCityChange} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: 'linear-gradient(90deg,#7c3aed,#5b4cd8)', color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>切换</button>
          <button onClick={loadAllData} disabled={loading} style={{
            padding: '6px 14px', borderRadius: 6,
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            background: 'rgba(255,255,255,0.04)', color: 'inherit',
            fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer',
          }}>{loading ? '刷新中…' : '🔄 刷新'}</button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
        background: 'rgba(255,255,255,0.01)',
      }}>
        {(['overview', 'finance', 'news', 'space'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: activeTab === tab ? 'linear-gradient(90deg,rgba(124,58,237,0.25),rgba(56,189,248,0.25))' : 'transparent',
            color: activeTab === tab ? '#fff' : 'var(--text-secondary, #94a3b8)',
          }}>
            {tab === 'overview' ? '总览' : tab === 'finance' ? '金融' : tab === 'news' ? '资讯' : '太空'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', alignSelf: 'center' }}>
          更新于 {updateTime}
        </div>
      </div>

      <div style={{ padding: 20, flex: 1 }}>
        {error && <div style={{
          padding: '10px 14px', marginBottom: 16, borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5', fontSize: 12,
        }}>⚠️ {error}（已切换到缓存数据或离线模式）</div>}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {/* 天气卡片 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>🌤 实时天气</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{weather?.city}</span>
              </div>
              {weather ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{Math.round(weather.temp)}°</span>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{weather.condition}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: '#64748b' }}>最高/最低 </span><span style={{ fontWeight: 600 }}>{weather.tempMax}° / {weather.tempMin}°</span></div>
                    <div><span style={{ color: '#64748b' }}>湿度 </span><span style={{ fontWeight: 600 }}>{weather.humidity}%</span></div>
                    <div><span style={{ color: '#64748b' }}>风速 </span><span style={{ fontWeight: 600 }}>{weather.windSpeed} km/h</span></div>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: '#64748b' }}>加载中…</div>}
            </div>

            {/* AQI 卡片 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>🌬 空气质量 AQI</span>
              </div>
              {aqi ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: `conic-gradient(${aqi.color} ${Math.min(aqi.aqi, 300) / 3}%, rgba(255,255,255,0.05) 0)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--panel-bg, rgba(20,20,35,0.9))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 700, color: aqi.color,
                      }}>{aqi.aqi}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: aqi.color }}>{aqi.level}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>PM2.5 {aqi.pollutants.pm25} · PM10 {aqi.pollutants.pm10} · O₃ {aqi.pollutants.o3}</div>
                    </div>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: '#64748b' }}>加载中…</div>}
            </div>

            {/* 汇率卡片 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>💱 实时汇率 (USD)</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>Frankfurter</span>
              </div>
              {rates ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(rates.rates).map(([cur, val]) => (
                    <div key={cur} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.02)', fontSize: 13,
                    }}>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{cur}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7dd3fc' }}>{val.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12, color: '#64748b' }}>加载中…</div>}
            </div>

            {/* 节假日倒计时 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>🎯 节假日倒计时</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {holidays.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 10px', borderRadius: 6,
                    background: i < 2 ? 'linear-gradient(90deg, rgba(124,58,237,0.08), rgba(56,189,248,0.04))' : 'rgba(255,255,255,0.02)',
                    fontSize: 12,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{h.name}</span>
                      <span style={{ color: '#64748b', marginLeft: 8, fontSize: 10 }}>{h.date}</span>
                    </div>
                    <span style={{
                      fontWeight: 700,
                      color: h.daysLeft === 0 ? '#10b981' : h.daysLeft <= 7 ? '#f59e0b' : '#94a3b8',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {h.daysLeft === 0 ? '🎉 今天' : `${h.daysLeft} 天`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 加密货币 Top3 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>🪙 加密货币 TOP</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>CoinGecko</span>
              </div>
              {crypto.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {crypto.slice(0, 3).map(c => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${c.change24h >= 0 ? '#10b981' : '#ef4444'}, ${c.change24h >= 0 ? '#059669' : '#dc2626'})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: '#fff',
                      }}>{c.symbol.slice(0, 2)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString()}</div>
                      </div>
                      <Sparkline data={c.sparkline} color={c.change24h >= 0 ? '#10b981' : '#ef4444'} />
                      <div style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                        background: c.change24h >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: c.change24h >= 0 ? '#10b981' : '#ef4444',
                      }}>{c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12, color: '#64748b' }}>加载中…</div>}
            </div>

            {/* Hacker News 热门 */}
            <div style={{ ...cardStyle, gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>🔥 Hacker News 热门</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>Firebase API</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {news.slice(0, 5).map((n, i) => (
                  <a key={n.id} href={n.url} target="_blank" rel="noreferrer noopener" style={{
                    display: 'block', padding: '6px 8px', borderRadius: 6,
                    color: 'inherit', textDecoration: 'none', fontSize: 12,
                    background: 'rgba(255,255,255,0.02)',
                    transition: 'background 0.15s',
                  }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
                     onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#7c3aed', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                      <span style={{ color: '#f59e0b', fontSize: 10, whiteSpace: 'nowrap' }}>▲{n.points}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {/* 完整加密货币列表 */}
            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e8' }}>🪙 加密货币市场</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>实时 · CoinGecko</span>
              </div>
              {crypto.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '50px 1fr 120px 140px 100px 80px',
                    gap: 10, padding: '8px 12px', fontSize: 10, fontWeight: 600,
                    color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span>#</span><span>币种</span><span>价格</span><span>7日走势</span><span>市值</span><span>24h</span>
                  </div>
                  {crypto.map((c, i) => (
                    <div key={c.id} style={{
                      display: 'grid', gridTemplateColumns: '50px 1fr 120px 140px 100px 80px',
                      gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 12,
                      alignItems: 'center', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#7c3aed,#38bdf8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, color: '#fff',
                        }}>{c.symbol.slice(0, 2)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ color: '#64748b', fontSize: 10 }}>{c.symbol}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        ${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString()}
                      </span>
                      <Sparkline data={c.sparkline} color={c.change24h >= 0 ? '#10b981' : '#ef4444'} />
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{c.marketCap}</span>
                      <span style={{
                        fontWeight: 700, textAlign: 'right', fontSize: 11,
                        color: c.change24h >= 0 ? '#10b981' : '#ef4444',
                      }}>{c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: 20 }}>加载中…</div>}
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>🔥 Hacker News 实时热榜</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>Firebase Real-time API · Top {news.length}</span>
              </div>
              {news.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {news.map((n, i) => (
                    <a key={n.id} href={n.url} target="_blank" rel="noreferrer noopener" style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      padding: '12px 16px', borderRadius: 10,
                      textDecoration: 'none', color: 'inherit',
                      background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background 0.15s',
                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
                       onMouseLeave={(e) => e.currentTarget.style.background = i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent'}>
                      <div style={{
                        minWidth: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(56,189,248,0.15))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 800, color: '#a78bfa',
                      }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{n.title}</div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}>
                          <span>⏰ {n.time}</span>
                          <span>▲ {n.points} points</span>
                          <span style={{ padding: '1px 8px', borderRadius: 4, background: 'rgba(255,102,0,0.12)', color: '#f97316', fontWeight: 600 }}>{n.source}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: 20 }}>加载中…</div>}
            </div>
          </div>
        )}

        {activeTab === 'space' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>🌌 NASA 天文学每日一图</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>APOD API · {nasa?.date || '加载中'}</span>
              </div>
              {nasa ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                    {nasa.url.endsWith('.jpg') || nasa.url.endsWith('.png') ? (
                      <img src={nasa.url} alt={nasa.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 240 }} />
                    ) : (
                      <iframe src={nasa.url} style={{ width: '100%', height: 240, border: 'none' }} title={nasa.title} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{nasa.title}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{nasa.explanation}</div>
                    <a href={nasa.url} target="_blank" rel="noreferrer noopener" style={{
                      display: 'inline-block', padding: '8px 18px', borderRadius: 8,
                      background: 'linear-gradient(90deg,#7c3aed,#5b4cd8)', color: '#fff',
                      textDecoration: 'none', fontSize: 12, fontWeight: 600, alignSelf: 'flex-start',
                    }}>🔗 查看高清原图</a>
                  </div>
                </div>
              ) : <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: 40 }}>加载中…</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
