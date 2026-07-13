import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, Globe, TrendingUp, DollarSign, Newspaper,
  Sun, Wind, Thermometer, Droplets, Eye,
  Clock, AlertCircle, CheckCircle, Wifi, WifiOff,
  ChevronRight, Sparkles, Activity, Zap, BarChart3
} from 'lucide-react'

type TabId = 'weather' | 'crypto' | 'news' | 'exchange' | 'network'

interface WeatherData {
  city: string
  temperature: number
  apparentTemp: number
  humidity: number
  windSpeed: number
  windDir: number
  pressure: number
  weatherCode: number
  visibility: number
  uvIndex: number
  isDay: boolean
  hourly: Array<{ time: string; temp: number; code: number }>
  daily: Array<{ date: string; max: number; min: number; code: number }>
}

interface CryptoData {
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

interface NewsItem {
  id: number
  title: string
  url: string
  by: string
  score: number
  time: number
  descendants: number
}

interface ExchangeRate {
  base: string
  date: string
  rates: Record<string, number>
}

interface NetworkInfo {
  isOnline: boolean
  downlink: number
  effectiveType: string
  rtt: number
  saveData: boolean
}

const WEATHER_CODES: Record<number, { icon: string; desc: string }> = {
  0: { icon: '☀️', desc: '晴朗' },
  1: { icon: '🌤️', desc: '大部晴朗' },
  2: { icon: '⛅', desc: '多云' },
  3: { icon: '☁️', desc: '阴天' },
  45: { icon: '🌫️', desc: '雾' },
  48: { icon: '🌫️', desc: '冻雾' },
  51: { icon: '🌦️', desc: '小毛毛雨' },
  53: { icon: '🌦️', desc: '毛毛雨' },
  55: { icon: '🌧️', desc: '大毛毛雨' },
  61: { icon: '🌦️', desc: '小雨' },
  63: { icon: '🌧️', desc: '中雨' },
  65: { icon: '🌧️', desc: '大雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '❄️', desc: '中雪' },
  75: { icon: '❄️', desc: '大雪' },
  80: { icon: '🌦️', desc: '阵雨' },
  81: { icon: '🌧️', desc: '强阵雨' },
  82: { icon: '⛈️', desc: '暴雨' },
  95: { icon: '⛈️', desc: '雷暴' },
  96: { icon: '⛈️', desc: '雷暴伴冰雹' },
  99: { icon: '⛈️', desc: '强雷暴' },
}

const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
]

const CRYPTO_IDS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple']

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}秒前`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
  return `${Math.floor(seconds / 86400)}天前`
}

function getWindDirection(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return dirs[Math.round(deg / 45) % 8]
}

export default function LiveDataHub() {
  const [activeTab, setActiveTab] = useState<TabId>('weather')
  const [loading, setLoading] = useState<Record<TabId, boolean>>({
    weather: false, crypto: false, news: false, exchange: false, network: false
  })
  const [error, setError] = useState<Record<TabId, string | null>>({
    weather: null, crypto: null, news: null, exchange: null, network: null
  })
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [selectedCity, setSelectedCity] = useState(CITIES[1])
  const [crypto, setCrypto] = useState<CryptoData[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [exchange, setExchange] = useState<ExchangeRate | null>(null)
  const [network, setNetwork] = useState<NetworkInfo | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Record<TabId, Date | null>>({
    weather: null, crypto: null, news: null, exchange: null, network: null
  })
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [targetCurrency, setTargetCurrency] = useState('CNY')
  const [amount, setAmount] = useState('1')
  const cacheRef = useRef<Record<string, { data: unknown; time: number }>>({})

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
    setLoading(prev => ({ ...prev, weather: true }))
    setError(prev => ({ ...prev, weather: null }))
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code,visibility,uv_index,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`
      const data: any = await fetchWithCache(`weather-${selectedCity.name}`, url, 10 * 60 * 1000)
      
      setWeather({
        city: selectedCity.name,
        temperature: data.current.temperature_2m,
        apparentTemp: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        windDir: data.current.wind_direction_10m,
        pressure: data.current.surface_pressure,
        weatherCode: data.current.weather_code,
        visibility: data.current.visibility / 1000,
        uvIndex: data.current.uv_index,
        isDay: data.current.is_day === 1,
        hourly: data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
          time: t,
          temp: data.hourly.temperature_2m[i],
          code: data.hourly.weather_code[i],
        })),
        daily: data.daily.time.map((d: string, i: number) => ({
          date: d,
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          code: data.daily.weather_code[i],
        })),
      })
      setLastUpdate(prev => ({ ...prev, weather: new Date() }))
    } catch (e: any) {
      setError(prev => ({ ...prev, weather: e.message || '获取天气数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, weather: false }))
    }
  }, [selectedCity, fetchWithCache])

  const fetchCrypto = useCallback(async () => {
    setLoading(prev => ({ ...prev, crypto: true }))
    setError(prev => ({ ...prev, crypto: null }))
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
      const data: any[] = await fetchWithCache('crypto', url, 60 * 1000)
      setCrypto(data.map((c: any) => ({
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        change24h: c.price_change_percentage_24h || 0,
        marketCap: c.market_cap,
        volume24h: c.total_volume,
      })))
      setLastUpdate(prev => ({ ...prev, crypto: new Date() }))
    } catch (e: any) {
      setError(prev => ({ ...prev, crypto: e.message || '获取加密货币数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, crypto: false }))
    }
  }, [fetchWithCache])

  const fetchNews = useCallback(async () => {
    setLoading(prev => ({ ...prev, news: true }))
    setError(prev => ({ ...prev, news: null }))
    try {
      const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json'
      const storyIds: number[] = await fetchWithCache('hn-top', topStoriesUrl, 5 * 60 * 1000)
      
      const stories = await Promise.all(
        storyIds.slice(0, 15).map(async id => {
          const url = `https://hacker-news.firebaseio.com/v0/item/${id}.json`
          return fetchWithCache<NewsItem>(`hn-item-${id}`, url, 10 * 60 * 1000)
        })
      )
      setNews(stories.filter(s => s && s.title))
      setLastUpdate(prev => ({ ...prev, news: new Date() }))
    } catch (e: any) {
      setError(prev => ({ ...prev, news: e.message || '获取新闻数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, news: false }))
    }
  }, [fetchWithCache])

  const fetchExchange = useCallback(async () => {
    setLoading(prev => ({ ...prev, exchange: true }))
    setError(prev => ({ ...prev, exchange: null }))
    try {
      const url = `https://api.frankfurter.app/latest?from=${baseCurrency}`
      const data: any = await fetchWithCache(`exchange-${baseCurrency}`, url, 30 * 60 * 1000)
      setExchange({
        base: data.base,
        date: data.date,
        rates: data.rates,
      })
      setLastUpdate(prev => ({ ...prev, exchange: new Date() }))
    } catch (e: any) {
      setError(prev => ({ ...prev, exchange: e.message || '获取汇率数据失败' }))
    } finally {
      setLoading(prev => ({ ...prev, exchange: false }))
    }
  }, [baseCurrency, fetchWithCache])

  const updateNetwork = useCallback(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      setNetwork({
        isOnline: navigator.onLine,
        downlink: conn?.downlink || 0,
        effectiveType: conn?.effectiveType || 'unknown',
        rtt: conn?.rtt || 0,
        saveData: conn?.saveData || false,
      })
    } else {
      setNetwork({
        isOnline: navigator.onLine,
        downlink: 0,
        effectiveType: 'unknown',
        rtt: 0,
        saveData: false,
      })
    }
    setLastUpdate(prev => ({ ...prev, network: new Date() }))
  }, [])

  useEffect(() => {
    fetchWeather()
    fetchCrypto()
    fetchNews()
    fetchExchange()
    updateNetwork()

    const weatherInterval = setInterval(fetchWeather, 5 * 60 * 1000)
    const cryptoInterval = setInterval(fetchCrypto, 60 * 1000)
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000)
    const exchangeInterval = setInterval(fetchExchange, 30 * 60 * 1000)

    const onlineHandler = () => updateNetwork()
    const offlineHandler = () => updateNetwork()
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)

    return () => {
      clearInterval(weatherInterval)
      clearInterval(cryptoInterval)
      clearInterval(newsInterval)
      clearInterval(exchangeInterval)
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  }, [fetchWeather, fetchCrypto, fetchNews, fetchExchange, updateNetwork])

  const tabs: { id: TabId; name: string; icon: React.ReactNode }[] = [
    { id: 'weather', name: '天气', icon: <Sun size={16} /> },
    { id: 'crypto', name: '加密货币', icon: <Zap size={16} /> },
    { id: 'news', name: '科技新闻', icon: <Newspaper size={16} /> },
    { id: 'exchange', name: '汇率换算', icon: <DollarSign size={16} /> },
    { id: 'network', name: '网络状态', icon: <Activity size={16} /> },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>实时数据中心</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <Clock size={12} />
          <span>自动刷新</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--window-border)',
        background: 'rgba(0,0,0,0.2)',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.name}
            {loading[tab.id] && <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />}
            {error[tab.id] && <AlertCircle size={12} style={{ color: 'var(--error)' }} />}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'weather' && (
          <WeatherPanel
            weather={weather}
            loading={loading.weather}
            error={error.weather}
            cities={CITIES}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            onRefresh={fetchWeather}
            lastUpdate={lastUpdate.weather}
          />
        )}

        {activeTab === 'crypto' && (
          <CryptoPanel
            data={crypto}
            loading={loading.crypto}
            error={error.crypto}
            onRefresh={fetchCrypto}
            lastUpdate={lastUpdate.crypto}
          />
        )}

        {activeTab === 'news' && (
          <NewsPanel
            news={news}
            loading={loading.news}
            error={error.news}
            onRefresh={fetchNews}
            lastUpdate={lastUpdate.news}
          />
        )}

        {activeTab === 'exchange' && (
          <ExchangePanel
            data={exchange}
            loading={loading.exchange}
            error={error.exchange}
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            amount={amount}
            onBaseChange={setBaseCurrency}
            onTargetChange={setTargetCurrency}
            onAmountChange={setAmount}
            onRefresh={fetchExchange}
            lastUpdate={lastUpdate.exchange}
          />
        )}

        {activeTab === 'network' && (
          <NetworkPanel
            data={network}
            onRefresh={updateNetwork}
            lastUpdate={lastUpdate.network}
          />
        )}
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

function WeatherPanel({ weather, loading, error, cities, selectedCity, onCityChange, onRefresh, lastUpdate }: {
  weather: WeatherData | null
  loading: boolean
  error: string | null
  cities: typeof CITIES
  selectedCity: typeof CITIES[0]
  onCityChange: (city: typeof CITIES[0]) => void
  onRefresh: () => void
  lastUpdate: Date | null
}) {
  const weatherInfo = weather ? WEATHER_CODES[weather.weatherCode] || WEATHER_CODES[0] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {cities.map(city => (
            <button
              key={city.name}
              onClick={() => onCityChange(city)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: selectedCity.name === city.name ? 'var(--accent-bg)' : 'transparent',
                color: selectedCity.name === city.name ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          刷新
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--error-bg)',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {weather && weatherInfo && (
        <>
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.15) 0%, rgba(0, 214, 193, 0.1) 100%)',
            border: '1px solid var(--window-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Globe size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 500 }}>{weather.city}</span>
                </div>
                <div style={{ fontSize: '56px', fontWeight: 300, lineHeight: 1 }}>
                  {weather.temperature.toFixed(0)}°
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  体感 {weather.apparentTemp.toFixed(0)}° · {weatherInfo.desc}
                </div>
              </div>
              <div style={{ fontSize: '64px' }}>{weatherInfo.icon}</div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            <MetricCard icon={<Droplets size={18} />} label="湿度" value={`${weather.humidity}%`} />
            <MetricCard icon={<Wind size={18} />} label="风速" value={`${weather.windSpeed} km/h`} sub={getWindDirection(weather.windDir)} />
            <MetricCard icon={<Thermometer size={18} />} label="气压" value={`${weather.pressure.toFixed(0)} hPa`} />
            <MetricCard icon={<Eye size={18} />} label="能见度" value={`${weather.visibility.toFixed(0)} km`} />
            <MetricCard icon={<Sun size={18} />} label="紫外线" value={weather.uvIndex.toFixed(1)} sub={weather.uvIndex > 7 ? '很强' : weather.uvIndex > 4 ? '中等' : '较弱'} />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px', color: 'var(--text-secondary)' }}>
              24小时预报
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}>
              {weather.hourly.filter((_, i) => i % 2 === 0).map((h, i) => {
                const hourCode = WEATHER_CODES[h.code] || WEATHER_CODES[0]
                const time = new Date(h.time).getHours()
                return (
                  <div key={i} style={{
                    flex: '0 0 auto',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    textAlign: 'center',
                    minWidth: '60px',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {time}:00
                    </div>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{hourCode.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{h.temp.toFixed(0)}°</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px', color: 'var(--text-secondary)' }}>
              7天预报
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {weather.daily.map((d, i) => {
                const dayCode = WEATHER_CODES[d.code] || WEATHER_CODES[0]
                const date = new Date(d.date)
                const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: i === 0 ? 'var(--accent-subtle)' : 'transparent',
                  }}>
                    <div style={{ width: '40px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {dayName}
                    </div>
                    <div style={{ fontSize: '20px', width: '32px', textAlign: 'center' }}>
                      {dayCode.icon}
                    </div>
                    <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {dayCode.desc}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{d.max.toFixed(0)}°</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{d.min.toFixed(0)}°</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {!weather && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          暂无天气数据
        </div>
      )}

      {lastUpdate && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          上次更新: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{
      padding: '14px',
      borderRadius: '10px',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function CryptoPanel({ data, loading, error, onRefresh, lastUpdate }: {
  data: CryptoData[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  lastUpdate: Date | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>加密货币行情</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          刷新
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--error-bg)',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((coin, i) => (
          <div key={coin.symbol} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${i === 0 ? '#f7931a' : i === 1 ? '#627eea' : i === 2 ? '#9945ff' : i === 3 ? '#0033ad' : '#23292f'}, ${i === 0 ? '#ffaa4a' : i === 1 ? '#92a9ff' : i === 2 ? '#b17aff' : i === 3 ? '#3468df' : '#4b5563'})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: 'white',
            }}>
              {coin.symbol[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{coin.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{coin.symbol}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>
                ${coin.price >= 1 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(6)}
              </div>
              <div style={{
                fontSize: '12px',
                color: coin.change24h >= 0 ? 'var(--success)' : 'var(--error)',
                fontWeight: 500,
              }}>
                {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginTop: '8px',
        }}>
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>总市值</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              ${formatNumber(data.reduce((sum, c) => sum + c.marketCap, 0))}
            </div>
          </div>
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>24h交易量</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              ${formatNumber(data.reduce((sum, c) => sum + c.volume24h, 0))}
            </div>
          </div>
        </div>
      )}

      {!data.length && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          暂无行情数据
        </div>
      )}

      {lastUpdate && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          上次更新: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

function NewsPanel({ news, loading, error, onRefresh, lastUpdate }: {
  news: NewsItem[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  lastUpdate: Date | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Hacker News 热榜</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          刷新
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--error-bg)',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {news.map((item, i) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: '28px',
              flexShrink: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              paddingTop: '2px',
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                lineHeight: 1.4,
                marginBottom: '4px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.title}
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}>
                <span>by {item.by}</span>
                <span>▲ {item.score}</span>
                <span>💬 {item.descendants || 0}</span>
                <span>{timeAgo(item.time)}</span>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '4px' }} />
          </a>
        ))}
      </div>

      {!news.length && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          暂无新闻数据
        </div>
      )}

      {lastUpdate && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          上次更新: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

function ExchangePanel({ data, loading, error, baseCurrency, targetCurrency, amount, onBaseChange, onTargetChange, onAmountChange, onRefresh, lastUpdate }: {
  data: ExchangeRate | null
  loading: boolean
  error: string | null
  baseCurrency: string
  targetCurrency: string
  amount: string
  onBaseChange: (v: string) => void
  onTargetChange: (v: string) => void
  onAmountChange: (v: string) => void
  onRefresh: () => void
  lastUpdate: Date | null
}) {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'NZD']
  
  const rate = data?.rates?.[targetCurrency]
  const result = rate ? (parseFloat(amount) || 0) * rate : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>汇率换算</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          刷新
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--error-bg)',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{
        padding: '20px',
        borderRadius: '12px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            金额
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              从
            </label>
            <select
              value={baseCurrency}
              onChange={(e) => onBaseChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ paddingTop: '20px', color: 'var(--text-secondary)' }}>
            ⇄
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              到
            </label>
            <select
              value={targetCurrency}
              onChange={(e) => onTargetChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {rate && (
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--window-border)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              兑换结果
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {targetCurrency}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              1 {baseCurrency} = {rate.toFixed(4)} {targetCurrency}
            </div>
          </div>
        )}
      </div>

      {data && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px', color: 'var(--text-secondary)' }}>
            主要货币对 (基准: {baseCurrency})
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
          }}>
            {currencies.filter(c => c !== baseCurrency && data.rates[c]).slice(0, 8).map(c => (
              <div key={c} style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  {baseCurrency}/{c}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {data.rates[c].toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastUpdate && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          汇率日期: {data?.date || '-'} · 上次更新: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

function NetworkPanel({ data, onRefresh, lastUpdate }: {
  data: NetworkInfo | null
  onRefresh: () => void
  lastUpdate: Date | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>网络状态</span>
        </div>
        <button
          onClick={onRefresh}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} />
          刷新
        </button>
      </div>

      {data && (
        <>
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            background: data.isOnline
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 214, 193, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid var(--window-border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
              {data.isOnline ? '🌐' : '🚫'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
              {data.isOnline ? '网络已连接' : '网络已断开'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {data.isOnline ? '您当前处于在线状态' : '请检查您的网络连接'}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wifi size={18} style={{ color: data.isOnline ? 'var(--success)' : 'var(--error)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>连接状态</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {data.isOnline ? (
                  <><CheckCircle size={16} style={{ color: 'var(--success)' }} /><span>在线</span></>
                ) : (
                  <><WifiOff size={16} style={{ color: 'var(--error)' }} /><span>离线</span></>
                )}
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>下行速度</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>
                {data.downlink ? `${data.downlink} Mbps` : 'N/A'}
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Activity size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>网络类型</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, textTransform: 'uppercase' }}>
                {data.effectiveType}
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>往返延迟</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>
                {data.rtt ? `${data.rtt} ms` : 'N/A'}
              </div>
            </div>
          </div>

          <div style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>
              网络信息详情
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>在线状态</span>
                <span>{data.isOnline ? '在线' : '离线'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>有效网络类型</span>
                <span style={{ textTransform: 'uppercase' }}>{data.effectiveType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>下行带宽</span>
                <span>{data.downlink ? `${data.downlink} Mbps` : '未知'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>往返时间</span>
                <span>{data.rtt ? `${data.rtt} ms` : '未知'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>数据节省模式</span>
                <span>{data.saveData ? '已开启' : '未开启'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {lastUpdate && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          上次检测: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
