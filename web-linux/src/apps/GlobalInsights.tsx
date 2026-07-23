import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Globe, RefreshCw, Newspaper, TrendingUp,
  Clock, MapPin, Search, ExternalLink,
  AlertCircle, Heart, BarChart3,
  Loader2, Hash, Quote, Users
} from 'lucide-react'

interface WorldNewsArticle {
  title: string
  description: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: { name: string }
  author?: string
  content?: string
}

interface CountryInfo {
  cca2: string
  name: { common: string; official: string }
  capital?: string[]
  region: string
  subregion?: string
  population: number
  area: number
  languages?: Record<string, string>
  currencies?: Record<string, { name: string; symbol?: string }>
  flag: string
  timezones: string[]
  latlng: [number, number]
  borders?: string[]
}

interface QuoteData {
  content: string
  author: string
  tags: string[]
}

interface JokeData {
  setup: string
  punchline: string
  category?: string
  type?: string
}

interface UserInfo {
  uuid: string
  title: string
  firstname: string
  lastname: string
  email: string
  phone: string
  picture: {
    large: string
    medium: string
    thumbnail: string
  }
  location: {
    city: string
    country: string
  }
}

type DataSource = 'news' | 'countries' | 'quote' | 'joke' | 'user' | 'space' | 'currency' | 'github'

const SOURCES: Array<{ id: DataSource; label: string; icon: typeof Globe; desc: string; color: string }> = [
  { id: 'news', label: '世界新闻', icon: Newspaper, desc: '来自 50+ 国家/地区的实时头条', color: '#3b82f6' },
  { id: 'countries', label: '国家百科', icon: MapPin, desc: '全球 250+ 国家/地区详细信息', color: '#10b981' },
  { id: 'quote', label: '每日箴言', icon: Quote, desc: '精选名言语录，可一键复制', color: '#f59e0b' },
  { id: 'joke', label: '趣味冷知识', icon: Heart, desc: '轻松一刻的编程/常识笑话', color: '#ec4899' },
  { id: 'user', label: '虚拟用户', icon: Users, desc: '随机生成测试用户数据', color: '#8b5cf6' },
  { id: 'space', label: '今日太空', icon: Globe, desc: 'NASA 每日天文图与简介', color: '#06b6d4' },
  { id: 'currency', label: '汇率换算', icon: TrendingUp, desc: '主要货币实时汇率', color: '#22c55e' },
  { id: 'github', label: 'GitHub 趋势', icon: Hash, desc: '当前热门开源项目', color: '#f43f5e' }
]

const CACHE_KEY = 'weblinux-global-insights'
const CACHE_TTL = 1000 * 60 * 10 // 10 分钟

function readCache<T>(source: DataSource): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}:${source}`)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data as T
  } catch {
    return null
  }
}

function writeCache<T>(source: DataSource, data: T) {
  try {
    localStorage.setItem(`${CACHE_KEY}:${source}`, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    /* localStorage 可能已满 */
  }
}

export default function GlobalInsights() {
  const [source, setSource] = useState<DataSource>('news')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [news, setNews] = useState<WorldNewsArticle[]>([])
  const [countries, setCountries] = useState<CountryInfo[]>([])
  const [countryDetail, setCountryDetail] = useState<CountryInfo | null>(null)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [joke, setJoke] = useState<JokeData | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [space, setSpace] = useState<{ title: string; explanation: string; url: string; media_type: string } | null>(null)
  const [currency, setCurrency] = useState<{ base: string; rates: Record<string, number> } | null>(null)
  const [github, setGithub] = useState<Array<{ full_name: string; description: string; stargazers_count: number; language: string; html_url: string; owner: { avatar_url: string } }>>([])

  const fetchData = useCallback(async (s: DataSource) => {
    setError(null)
    setLoading(true)
    try {
      if (s === 'news') {
        const cached = readCache<WorldNewsArticle[]>('news')
        if (cached) { setNews(cached); setLastUpdated(new Date()); setLoading(false); return }
        // 兜底：使用一些公开新闻 API
        const res = await fetch('https://saurav.tech/NewsAPI/top-headlines/category/general/us.json')
        if (!res.ok) throw new Error('新闻接口暂不可用')
        const data = await res.json()
        const articles: WorldNewsArticle[] = (data.articles || []).slice(0, 20).map((a: Record<string, unknown>) => ({
          title: String(a.title || ''),
          description: String(a.description || ''),
          url: String(a.url || ''),
          urlToImage: (a.urlToImage as string) || undefined,
          publishedAt: String(a.publishedAt || ''),
          source: { name: String((a.source as Record<string, string>)?.name || '未知') },
          author: (a.author as string) || undefined
        }))
        setNews(articles)
        writeCache('news', articles)
      } else if (s === 'countries') {
        const cached = readCache<CountryInfo[]>('countries')
        if (cached) { setCountries(cached); setLastUpdated(new Date()); setLoading(false); return }
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,population,area,languages,currencies,flag,timezones,latlng,borders,cca2')
        if (!res.ok) throw new Error('国家数据接口暂不可用')
        const data = await res.json()
        const list: CountryInfo[] = data
          .filter((c: Record<string, unknown>) => c.name && (c.name as Record<string, string>).common)
          .map((c: Record<string, unknown>) => ({
            cca2: String(c.cca2 || ''),
            name: c.name as CountryInfo['name'],
            capital: c.capital as string[] | undefined,
            region: String(c.region || ''),
            subregion: c.subregion as string | undefined,
            population: Number(c.population || 0),
            area: Number(c.area || 0),
            languages: c.languages as Record<string, string> | undefined,
            currencies: c.currencies as Record<string, { name: string; symbol?: string }> | undefined,
            flag: String(c.flag || ''),
            timezones: (c.timezones as string[]) || [],
            latlng: ((c.latlng as number[]) || [0, 0]) as [number, number],
            borders: c.borders as string[] | undefined
          }))
          .sort((a: CountryInfo, b: CountryInfo) => b.population - a.population)
          .slice(0, 60)
        setCountries(list)
        writeCache('countries', list)
      } else if (s === 'quote') {
        const res = await fetch('https://api.quotable.io/random')
        if (!res.ok) throw new Error('语录接口暂不可用')
        const data = await res.json()
        const q: QuoteData = {
          content: data.content,
          author: data.author,
          tags: data.tags || []
        }
        setQuote(q)
      } else if (s === 'joke') {
        const res = await fetch('https://official-joke-api.appspot.com/random_joke')
        if (!res.ok) throw new Error('笑话接口暂不可用')
        const data = await res.json()
        setJoke({ setup: data.setup, punchline: data.punchline, type: data.type })
      } else if (s === 'user') {
        const res = await fetch('https://randomuser.me/api/')
        if (!res.ok) throw new Error('用户生成接口暂不可用')
        const data = await res.json()
        const u = data.results[0]
        const info: UserInfo = {
          uuid: u.login.uuid,
          title: u.name.title,
          firstname: u.name.first,
          lastname: u.name.last,
          email: u.email,
          phone: u.phone,
          picture: u.picture,
          location: { city: u.location.city, country: u.location.country }
        }
        setUser(info)
      } else if (s === 'space') {
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
        if (!res.ok) throw new Error('NASA API 暂不可用')
        const data = await res.json()
        setSpace({
          title: data.title,
          explanation: data.explanation,
          url: data.url,
          media_type: data.media_type
        })
      } else if (s === 'currency') {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (!res.ok) throw new Error('汇率接口暂不可用')
        const data = await res.json()
        setCurrency({ base: data.base_code, rates: data.rates })
      } else if (s === 'github') {
        const res = await fetch('https://api.gitterapp.com/repositories')
        if (!res.ok) throw new Error('GitHub 趋势接口暂不可用')
        const data = await res.json()
        setGithub(data.slice(0, 12))
      }
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(source)
  }, [source, fetchData])

  const filteredNews = useMemo(() => {
    if (!searchQuery) return news
    const q = searchQuery.toLowerCase()
    return news.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.source.name.toLowerCase().includes(q)
    )
  }, [news, searchQuery])

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries
    const q = searchQuery.toLowerCase()
    return countries.filter(c =>
      c.name.common.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      (c.capital?.[0] || '').toLowerCase().includes(q)
    )
  }, [countries, searchQuery])

  const formatTimeAgo = (iso: string) => {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return `${Math.floor(diff / 60000)} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return `${Math.floor(hours / 24)} 天前`
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--window-bg)', color: 'var(--text-primary)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Subtle radial background */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(124,108,240,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
            position: 'relative'
          }}>
            <Globe size={20} color="#fff" />
            {loading && (
              <span style={{
                position: 'absolute', top: -2, right: -2, width: 10, height: 10,
                borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 8px #22c55e', animation: 'pulse 1s ease-in-out infinite'
              }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>Global Insights 全球洞察</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                fontSize: 10, fontWeight: 500
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} className={loading ? '' : 'pulse-dot'} />
                {loading ? '正在同步' : '实时连接'}
              </span>
              <span style={{ opacity: 0.7 }}>· 数据来自全球权威公开 API</span>
              {lastUpdated && <span style={{ marginLeft: 4, opacity: 0.6 }}>· 更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          </div>
          <button
            onClick={() => fetchData(source)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px',
              background: 'var(--accent, #7c6cf0)',
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.5 : 1, fontSize: 12, fontWeight: 500,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {loading ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
            刷新
          </button>
        </div>

        {/* Source Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {SOURCES.map(s => {
            const Icon = s.icon
            const active = source === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className="source-tab"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  background: active
                    ? `linear-gradient(135deg, ${s.color}30, ${s.color}15)`
                    : 'transparent',
                  color: active ? s.color : 'var(--text-secondary)',
                  border: `1px solid ${active ? s.color + '60' : 'var(--window-border, rgba(255,255,255,0.12))'}`,
                  borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  boxShadow: active ? `0 2px 8px ${s.color}20` : 'none',
                  position: 'relative', overflow: 'hidden'
                }}
                title={s.desc}
              >
                <Icon size={12} />
                {s.label}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                    background: s.color, borderRadius: '2px 2px 0 0'
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        {(source === 'news' || source === 'countries') && (
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={source === 'news' ? '搜索新闻标题、来源、描述…' : '搜索国家、首都、地区…'}
              style={{
                width: '100%', padding: '8px 12px 8px 32px',
                background: 'var(--input-bg, rgba(255,255,255,0.04))',
                border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: 12
              }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 size={20} className="spin" />
            <span>正在从全球 API 拉取数据…</span>
          </div>
        )}

        {error && !loading && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: 200, gap: 12, color: 'var(--text-secondary)'
          }}>
            <AlertCircle size={32} style={{ opacity: 0.5 }} />
            <p style={{ fontSize: 13, margin: 0 }}>{error}</p>
            <p style={{ fontSize: 11, margin: 0, opacity: 0.7 }}>请检查网络连接或稍后重试</p>
          </div>
        )}

        {!loading && !error && source === 'news' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, position: 'relative', zIndex: 1 }}>
            {filteredNews.map((n, idx) => (
              <a
                key={idx}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card"
                style={{
                  display: 'flex', flexDirection: 'column',
                  padding: 14, borderRadius: 10,
                  background: 'var(--card-bg, rgba(255,255,255,0.02))',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  color: 'var(--text-primary)', textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,108,240,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--window-border, rgba(255,255,255,0.08))'
                }}
              >
                {n.urlToImage && (
                  <div style={{
                    height: 120, marginBottom: 10, borderRadius: 6,
                    backgroundImage: `url(${n.urlToImage})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.3) 100%)'
                    }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 8px', background: 'var(--accent-bg, rgba(124,108,240,0.15))',
                    color: 'var(--accent, #a78bfa)', borderRadius: 4, fontSize: 10, fontWeight: 500
                  }}>{n.source.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={9} /> {formatTimeAgo(n.publishedAt)}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 13, lineHeight: 1.4, fontWeight: 600 }}>{n.title}</h3>
                {n.description && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.description}
                  </p>
                )}
                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--accent, #a78bfa)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <ExternalLink size={9} /> 阅读全文
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && !error && source === 'countries' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {filteredCountries.map(c => (
              <div
                key={c.cca2}
                onClick={() => setCountryDetail(c)}
                style={{
                  padding: 14, borderRadius: 10,
                  background: 'var(--card-bg, rgba(255,255,255,0.02))',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent, rgba(124,108,240,0.4))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--window-border, rgba(255,255,255,0.08))'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{c.flag}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{c.name.common}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-secondary)' }}>
                      {c.region} {c.subregion ? `· ${c.subregion}` : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>首都</div>
                    <div style={{ fontWeight: 500 }}>{c.capital?.[0] || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>人口</div>
                    <div style={{ fontWeight: 500 }}>{(c.population / 1_000_000).toFixed(2)}M</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && source === 'quote' && quote && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, padding: 40, textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
            borderRadius: 16
          }}>
            <Quote size={48} style={{ color: '#f59e0b', opacity: 0.4, marginBottom: 24 }} />
            <p style={{
              fontSize: 24, lineHeight: 1.6, fontWeight: 400, fontStyle: 'italic',
              maxWidth: 700, margin: 0, color: 'var(--text-primary)'
            }}>"{quote.content}"</p>
            <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>— {quote.author}</p>
            {quote.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {quote.tags.map(t => (
                  <span key={t} style={{
                    padding: '2px 10px', background: 'var(--accent-bg, rgba(124,108,240,0.15))',
                    color: 'var(--accent, #a78bfa)', borderRadius: 12, fontSize: 11
                  }}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && source === 'joke' && joke && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, padding: 40, textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            borderRadius: 16
          }}>
            <Heart size={48} style={{ color: '#ec4899', opacity: 0.4, marginBottom: 24 }} />
            <p style={{ fontSize: 20, lineHeight: 1.6, maxWidth: 600, margin: 0 }}>{joke.setup}</p>
            <p style={{ fontSize: 22, fontWeight: 600, marginTop: 20, color: '#ec4899' }}>{joke.punchline}</p>
          </div>
        )}

        {!loading && !error && source === 'user' && user && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, padding: 40, textAlign: 'center'
          }}>
            <img
              src={user.picture.large}
              alt={user.firstname}
              style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
            />
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{user.title} {user.firstname} {user.lastname}</h2>
            <p style={{ margin: '8px 0 24px', color: 'var(--text-secondary)' }}>{user.location.city}, {user.location.country}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 500 }}>
              <div style={{ padding: 12, background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>邮箱</div>
                <div style={{ fontSize: 12, marginTop: 4, fontFamily: 'var(--font-mono, monospace)' }}>{user.email}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>电话</div>
                <div style={{ fontSize: 12, marginTop: 4, fontFamily: 'var(--font-mono, monospace)' }}>{user.phone}</div>
              </div>
            </div>
            <p style={{ marginTop: 20, fontSize: 10, color: 'var(--text-secondary)' }}>UUID: {user.uuid}</p>
          </div>
        )}

        {!loading && !error && source === 'space' && space && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>{space.title}</h2>
            {space.media_type === 'image' && (
              <img
                src={space.url}
                alt={space.title}
                style={{ width: '100%', borderRadius: 12, marginBottom: 16 }}
              />
            )}
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)' }}>{space.explanation}</p>
            <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
              数据来源: NASA Astronomy Picture of the Day (APOD)
            </p>
          </div>
        )}

        {!loading && !error && source === 'currency' && currency && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              基准货币: {currency.base} · 1 {currency.base} = ...
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {Object.entries(currency.rates)
                .filter(([code]) => ['CNY', 'EUR', 'GBP', 'JPY', 'HKD', 'KRW', 'AUD', 'CAD', 'CHF', 'SGD', 'INR', 'RUB', 'BRL', 'MXN'].includes(code))
                .map(([code, rate]) => (
                <div key={code} style={{
                  padding: 14, background: 'var(--card-bg, rgba(255,255,255,0.02))',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  borderRadius: 8
                }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{code}</div>
                  <div style={{ fontSize: 16, marginTop: 4, color: 'var(--accent, #a78bfa)' }}>
                    {Number(rate).toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && source === 'github' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {github.map((r, idx) => (
              <a
                key={idx}
                href={r.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, background: 'var(--card-bg, rgba(255,255,255,0.02))',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)'
                }}
              >
                <img src={r.owner.avatar_url} alt={r.full_name} style={{ width: 36, height: 36, borderRadius: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.description || '暂无描述'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 12 }}>
                  <BarChart3 size={12} /> {r.stargazers_count.toLocaleString()}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Country Detail Modal */}
      {countryDetail && (
        <div
          onClick={() => setCountryDetail(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--window-bg, #1a1a1a)',
              border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
              borderRadius: 16, padding: 24, maxWidth: 560, width: '100%',
              maxHeight: '80vh', overflow: 'auto',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.25s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 56, lineHeight: 1 }}>{countryDetail.flag}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{countryDetail.name.common}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {countryDetail.name.official}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px', background: 'var(--accent-bg, rgba(124,108,240,0.15))',
                    color: 'var(--accent, #a78bfa)', borderRadius: 12, fontSize: 11, fontWeight: 500
                  }}>{countryDetail.region}</span>
                  {countryDetail.subregion && (
                    <span style={{
                      padding: '3px 10px', background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981', borderRadius: 12, fontSize: 11, fontWeight: 500
                    }}>{countryDetail.subregion}</span>
                  )}
                  <span style={{
                    padding: '3px 10px', background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b', borderRadius: 12, fontSize: 11, fontWeight: 500
                  }}>{countryDetail.cca2}</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
              padding: 16, background: 'var(--card-bg, rgba(255,255,255,0.03))',
              borderRadius: 10, marginBottom: 16
            }}>
              <DetailRow label="首都" value={countryDetail.capital?.[0] || '—'} />
              <DetailRow label="人口" value={`${(countryDetail.population / 1_000_000).toFixed(2)}M`} />
              <DetailRow label="面积" value={`${countryDetail.area.toLocaleString()} km²`} />
              <DetailRow label="坐标" value={`${countryDetail.latlng[0].toFixed(2)}, ${countryDetail.latlng[1].toFixed(2)}`} />
              <DetailRow
                label="语言"
                value={countryDetail.languages ? Object.values(countryDetail.languages).slice(0, 2).join(', ') : '—'}
              />
              <DetailRow
                label="货币"
                value={countryDetail.currencies
                  ? Object.values(countryDetail.currencies).map(c => `${c.name}${c.symbol ? ` (${c.symbol})` : ''}`).join(', ')
                  : '—'
                }
              />
            </div>

            {countryDetail.timezones.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>时区</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {countryDetail.timezones.slice(0, 4).map(tz => (
                    <span key={tz} style={{
                      padding: '3px 10px', background: 'var(--card-bg, rgba(255,255,255,0.04))',
                      border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                      borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono, monospace)'
                    }}>{tz}</span>
                  ))}
                </div>
              </div>
            )}

            {countryDetail.borders && countryDetail.borders.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                  邻国 ({countryDetail.borders.length})
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {countryDetail.borders.map(b => (
                    <span key={b} style={{
                      padding: '3px 10px', background: 'rgba(59, 130, 246, 0.12)',
                      color: '#3b82f6', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono, monospace)'
                    }}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setCountryDetail(null)}
              style={{
                marginTop: 20, width: '100%', padding: '10px 16px',
                background: 'var(--accent, #7c6cf0)', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 500
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        .news-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .news-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.2); }
        .source-tab { transition: all 0.15s ease; }
        .source-tab:hover { transform: translateY(-1px); }
        .shimmer-bar {
          background: linear-gradient(90deg, transparent, rgba(124,108,240,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  )
}
