import { useState, useEffect, useCallback } from 'react'
import { fetchDailyMegaDashboard, type WeatherData, type QuoteData, type AirQualityData, type HolidayInfo, type NewsArticle, type CryptoPrice } from '../services/apiService'
import {
  RefreshCw,
  Droplets,
  Wind,
  WindArrowDown,
  Sunset,
  Eye,
  Sparkles,
  Newspaper,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Clock,
  Sunrise,
  Activity,
  Leaf,
  Radio,
  ExternalLink,
  DollarSign,
  Globe
} from 'lucide-react'

export default function DailyDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [holidays, setHolidays] = useState<HolidayInfo[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [crypto, setCrypto] = useState<CryptoPrice[]>([])
  const [now, setNow] = useState(new Date())
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError(null)
      const data = await fetchDailyMegaDashboard()
      setWeather(data.weather)
      setQuote(data.quote)
      setAirQuality(data.airQuality)
      setHolidays(data.holidays || [])
      setNews(data.news || [])
      setCrypto(data.crypto || [])
    } catch (e) {
      setError('数据加载失败，请刷新重试')
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [loadAll])

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date(new Date().toDateString()))
    .slice(0, 5)

  const aqiColor = (aqi: number) => {
    if (aqi <= 50) return { text: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' }
    if (aqi <= 100) return { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
    if (aqi <= 150) return { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' }
    if (aqi <= 200) return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' }
    return { text: 'text-red-700', bg: 'bg-red-700/10', border: 'border-red-700/30' }
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-slate-300 text-lg">正在加载每日信息...</p>
        </div>
      </div>
    )
  }

  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                每日仪表盘
              </h1>
              <button
                onClick={() => loadAll(true)}
                className="ml-2 p-2 rounded-lg hover:bg-white/5 transition"
                title="刷新数据"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 hover:text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-2xl font-mono text-slate-200">{timeStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>{dateStr}</span>
              </div>
            </div>
          </div>
          {quote && (
            <div className="max-w-md p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
                <div>
                  <p className="text-amber-100 italic text-sm">"{quote.content}"</p>
                  <p className="text-amber-300/70 text-xs mt-2 text-right">— {quote.author}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => loadAll(true)} className="underline hover:text-red-200">重试</button>
          </div>
        )}

        {/* Top Row: Weather + AQI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weather Card */}
          {weather && (
            <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-cyan-500/20 border border-blue-500/20">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div className="flex items-start gap-4">
                  <div className="text-6xl leading-none">
                    {weather.forecast?.[0]?.icon || '☀️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                      <Globe className="w-3 h-3" />
                      <span>{weather.city}</span>
                    </div>
                    <div className="text-5xl font-bold text-white">
                      {weather.temperature}
                      <span className="text-2xl font-normal text-slate-300 ml-1">°C</span>
                    </div>
                    <div className="text-lg text-slate-200 mt-1">{weather.description}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      体感 {weather.feelsLike}°C
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sunrise className="w-4 h-4 text-orange-400" />
                    <span>日出 {weather.sunrise?.split('T')?.[1] || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sunset className="w-4 h-4 text-pink-400" />
                    <span>日落 {weather.sunset?.split('T')?.[1] || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Stat icon={<Droplets className="w-4 h-4" />} label="湿度" value={`${weather.humidity}%`} color="text-cyan-400" />
                <Stat icon={<Wind className="w-4 h-4" />} label="风速" value={`${weather.windSpeed}km/h`} color="text-teal-400" />
                <Stat icon={<WindArrowDown className="w-4 h-4" />} label="风向" value={weather.windDirection} color="text-emerald-400" />
                <Stat icon={<Eye className="w-4 h-4" />} label="能见度" value={`${weather.visibility || '-'}km`} color="text-indigo-400" />
              </div>

              {weather.forecast && weather.forecast.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">未来 5 天预报</div>
                  <div className="grid grid-cols-5 gap-2">
                    {weather.forecast.slice(0, 5).map((f, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 text-center">
                        <div className="text-xs text-slate-400 mb-1">
                          {f.date ? new Date(f.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '-'}
                        </div>
                        <div className="text-2xl my-1">{f.icon}</div>
                        <div className="text-xs text-slate-200">{f.minTemp}° / {f.maxTemp}°</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AQI Card */}
          {airQuality && (
            <div className={`p-6 rounded-2xl border ${aqiColor(airQuality.aqi).bg} ${aqiColor(airQuality.aqi).border}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Leaf className={`w-5 h-5 ${aqiColor(airQuality.aqi).text}`} />
                  <span className="text-slate-300 text-sm">空气质量</span>
                </div>
                <span className={`text-sm font-semibold ${aqiColor(airQuality.aqi).text}`}>
                  {airQuality.aqiLevel}
                </span>
              </div>
              <div className={`text-6xl font-bold mb-1 ${aqiColor(airQuality.aqi).text}`}>
                {airQuality.aqi}
              </div>
              <div className="text-sm text-slate-400 mb-5">AQI 指数</div>
              <div className="space-y-2 text-sm">
                <AqiRow label="PM2.5" value={`${airQuality.pm2_5} μg/m³`} />
                <AqiRow label="PM10" value={`${airQuality.pm10} μg/m³`} />
                <AqiRow label="NO₂" value={`${airQuality.nitrogenDioxide} μg/m³`} />
                <AqiRow label="SO₂" value={`${airQuality.sulphurDioxide} μg/m³`} />
                <AqiRow label="O₃" value={`${airQuality.ozone} μg/m³`} />
                <AqiRow label="CO" value={`${airQuality.carbonMonoxide} μg/m³`} />
              </div>
            </div>
          )}
        </div>

        {/* Middle Row: Holidays + Crypto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Upcoming Holidays */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold">近期节假日</h2>
            </div>
            {upcomingHolidays.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">暂无即将到来的节假日</p>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((h, i) => {
                  const diffDays = Math.ceil((new Date(h.date).getTime() - Date.now()) / 86400000)
                  return (
                    <div key={i} className="p-3 rounded-lg bg-white/5 flex items-center justify-between hover:bg-white/10 transition">
                      <div>
                        <div className="font-medium text-slate-100">{h.localName || h.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{h.date}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        diffDays === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {diffDays === 0 ? '今天' : `${diffDays} 天后`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Crypto Prices */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold">加密货币行情</h2>
              </div>
              <span className="text-xs text-slate-400">CoinGecko</span>
            </div>
            {crypto.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">数据加载中...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {crypto.map((c) => (
                  <div key={c.symbol} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.symbol}</div>
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        c.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {c.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white">
                        ${apiService.formatNumber(c.priceUsd, c.priceUsd < 1 ? 4 : 2)}
                      </span>
                      <span className="text-xs text-slate-400">≈ ¥{apiService.formatNumber(c.priceCny, c.priceCny < 1 ? 2 : 0)}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      市值 ${apiService.formatFileSize(c.marketCapUsd).replace('B', 'B USD').replace('T', 'T USD')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: News */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-indigo-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Hacker News 热门资讯</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Radio className="w-3 h-3" />
              <span>实时 Top 10</span>
            </div>
          </div>
          {news.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">资讯加载中...</p>
          ) : (
            <div className="space-y-2">
              {news.map((a, i) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                      i < 3 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-100 font-medium group-hover:text-cyan-300 transition line-clamp-1">
                        {a.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="text-slate-400">{a.source}</span>
                        <span>•</span>
                        <span>作者 {a.author}</span>
                        <span>•</span>
                        <span>{a.publishedAt}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 shrink-0 mt-1 transition" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 pb-8 text-center text-xs text-slate-500">
          <p>数据来源：Open-Meteo · Hacker News · CoinGecko · Date.Nager · Quotable</p>
          <p className="mt-1">所有数据均来自公开免费 API，仅供参考</p>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/5">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  )
}

function AqiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-300">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  )
}
