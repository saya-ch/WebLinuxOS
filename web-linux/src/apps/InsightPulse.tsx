import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Search, RefreshCw, TrendingUp, BookOpen, Globe,
  Sparkles, Clock, Sun, Activity, Copy, Star, StarOff, ExternalLink
} from 'lucide-react'

interface NewsItem { id: string; title: string; url: string; source: string; time: string }
interface TechTrend { repo: string; stars: string; description: string; lang: string; url: string }
interface DailyWisdom { text: string; author?: string }
interface CountryFact { name: string; capital: string; population: string; region: string; flag: string }
interface CachedData<T> { data: T; timestamp: number }

const CACHE_TTL = 10 * 60 * 1000 // 10分钟
const STORAGE_KEY = 'insightpulse-cache-v1'
const FAV_KEY = 'insightpulse-favs-v1'

type TabKey = 'overview' | 'news' | 'trends' | 'wisdom' | 'world'

function loadCache(): Partial<Record<string, CachedData<unknown>>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCache(cache: Partial<Record<string, CachedData<unknown>>>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)) } catch {}
}

function getCached<T>(key: string): T | null {
  const cache = loadCache()
  const entry = cache[key] as CachedData<T> | undefined
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data
  return null
}

function setCached<T>(key: string, data: T) {
  const cache = loadCache()
  cache[key] = { data, timestamp: Date.now() }
  saveCache(cache)
}

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveFavs(favs: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)) } catch {}
}

async function safeFetch<T>(url: string, key: string, parser: (r: Response) => Promise<T>): Promise<T> {
  const cached = getCached<T>(key)
  if (cached) return cached
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await parser(res)
  setCached(key, data)
  return data
}

async function fetchHN(): Promise<NewsItem[]> {
  const ids: number[] = await safeFetch(
    'https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=15&orderBy="$key"',
    'hn-ids',
    r => r.json()
  )
  const picked = ids.slice(0, 12)
  const items = await Promise.all(picked.map(async id => {
    try {
      const it = await safeFetch<any>(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        `hn-${id}`,
        r => r.json()
      )
      const hours = Math.max(1, Math.floor((Date.now() / 1000 - (it.time ?? 0)) / 3600))
      return {
        id: String(id),
        title: it.title ?? '(无标题)',
        url: it.url ?? `https://news.ycombinator.com/item?id=${id}`,
        source: 'Hacker News',
        time: hours > 24 ? `${Math.floor(hours / 24)}d ago` : `${hours}h ago`
      }
    } catch { return null }
  }))
  return items.filter(Boolean) as NewsItem[]
}

async function fetchGHTrending(): Promise<TechTrend[]> {
  try {
    const res = await fetch('https://api.github.com/search/repositories?q=stars:>100&sort=stars&order=desc&per_page=12')
    if (!res.ok) throw new Error('GH fail')
    const j = await res.json()
    return (j.items ?? []).slice(0, 10).map((it: any) => ({
      repo: it.full_name,
      stars: it.stargazers_count >= 1000 ? `${(it.stargazers_count / 1000).toFixed(1)}k` : String(it.stargazers_count),
      description: (it.description ?? '').slice(0, 120),
      lang: it.language ?? 'Misc',
      url: it.html_url
    }))
  } catch {
    // 静态降级（GitHub限流时）
    const fallback: TechTrend[] = [
      { repo: 'facebook/react', stars: '225k', description: 'The library for web and native user interfaces', lang: 'JavaScript', url: 'https://github.com/facebook/react' },
      { repo: 'microsoft/vscode', stars: '160k', description: 'Visual Studio Code', lang: 'TypeScript', url: 'https://github.com/microsoft/vscode' },
      { repo: 'vercel/next.js', stars: '125k', description: 'The React Framework for the Web', lang: 'JavaScript', url: 'https://github.com/vercel/next.js' },
      { repo: 'sindresorhus/awesome', stars: '310k', description: 'Awesome lists about all kinds of interesting topics', lang: 'Markdown', url: 'https://github.com/sindresorhus/awesome' },
      { repo: 'torvalds/linux', stars: '175k', description: 'Linux kernel source tree', lang: 'C', url: 'https://github.com/torvalds/linux' },
      { repo: 'microsoft/TypeScript', stars: '100k', description: 'TypeScript is a superset of JavaScript', lang: 'TypeScript', url: 'https://github.com/microsoft/TypeScript' },
    ]
    setCached('gh-trending', fallback)
    return fallback
  }
}

async function fetchWisdom(): Promise<DailyWisdom[]> {
  try {
    const res = await fetch('https://zenquotes.io/api/quotes/5')
    if (!res.ok) throw new Error('quote fail')
    const arr = await res.json()
    return arr.map((q: any) => ({ text: q.q, author: q.a }))
  } catch {
    const fallback: DailyWisdom[] = [
      { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
      { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
      { text: 'Premature optimization is the root of all evil.', author: 'Donald Knuth' },
      { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
      { text: 'Code is read more often than it is written.', author: 'Guido van Rossum' },
    ]
    setCached('wisdom', fallback)
    return fallback
  }
}

async function fetchRandomCountries(): Promise<CountryFact[]> {
  const cached = getCached<CountryFact[]>('countries')
  if (cached) return cached
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,population,region,flags,cca3')
  if (!res.ok) throw new Error('country fail')
  const all = await res.json()
  const shuffled = all.sort(() => 0.5 - Math.random()).slice(0, 8).map((c: any) => ({
    name: c.name.common,
    capital: (c.capital?.[0] ?? '—'),
    population: (c.population >= 1e9 ? `${(c.population / 1e9).toFixed(2)}B` : c.population >= 1e6 ? `${(c.population / 1e6).toFixed(1)}M` : String(c.population)),
    region: c.region ?? '—',
    flag: c.flags?.svg ?? c.flags?.png ?? ''
  }))
  setCached('countries', shuffled)
  return shuffled
}

export default function InsightPulse() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [news, setNews] = useState<NewsItem[]>([])
  const [trends, setTrends] = useState<TechTrend[]>([])
  const [wisdoms, setWisdoms] = useState<DailyWisdom[]>([])
  const [countries, setCountries] = useState<CountryFact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [favs, setFavs] = useState<string[]>(() => loadFavs())
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleFav = useCallback((id: string) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      saveFavs(next)
      return next
    })
  }, [])

  const copyText = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  const loadAll = useCallback(async (force = false) => {
    setLoading(!force)
    setRefreshing(force)
    setError(null)
    if (force) localStorage.removeItem(STORAGE_KEY)
    try {
      const [n, t, w, c] = await Promise.all([fetchHN(), fetchGHTrending(), fetchWisdom(), fetchRandomCountries()])
      setNews(n); setTrends(t); setWisdoms(w); setCountries(c)
      setLastUpdate(new Date())
    } catch (e: any) {
      setError(e.message ?? '加载失败')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const filteredNews = useMemo(
    () => news.filter(n => !query || n.title.toLowerCase().includes(query.toLowerCase()) || n.source.toLowerCase().includes(query.toLowerCase())),
    [news, query]
  )
  const filteredTrends = useMemo(
    () => trends.filter(t => !query || t.repo.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase())),
    [trends, query]
  )
  const filteredCountries = useMemo(
    () => countries.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.capital.toLowerCase().includes(query.toLowerCase()) || c.region.toLowerCase().includes(query.toLowerCase())),
    [countries, query]
  )

  const topNews = filteredNews.slice(0, 3)
  const topTrends = filteredTrends.slice(0, 3)
  const topWisdom = wisdoms[0]
  const favCount = favs.length

  const langColor = (lang: string) => {
    const map: Record<string, string> = {
      TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3776ab',
      Go: '#00add8', Rust: '#dea584', C: '#555555', 'C++': '#f34b7d',
      Markdown: '#083fa1', Java: '#b07219', Misc: '#888'
    }
    return map[lang] ?? map.Misc
  }

  return (
    <div className="ip-root">
      <header className="ip-header">
        <div className="ip-brand">
          <div className="ip-brand-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>InsightPulse · AI 洞察仪表盘</h1>
            <p>
              {lastUpdate
                ? `最近同步 · ${lastUpdate.toLocaleTimeString('zh-CN')} · ${favCount} 收藏`
                : '聚合公开 API · 缓存 10 分钟'}
            </p>
          </div>
        </div>
        <div className="ip-header-actions">
          <div className="ip-search">
            <Search size={14} />
            <input
              placeholder="搜索新闻 / 仓库 / 国家…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button
            className={`ip-btn ip-btn-ghost ${refreshing ? 'ip-spin' : ''}`}
            onClick={() => loadAll(true)}
            title="强制刷新"
          >
            <RefreshCw size={15} />
            <span>刷新</span>
          </button>
        </div>
      </header>

      <nav className="ip-tabs">
        {(
          [
            ['overview', '总览', Activity],
            ['news', '科技新闻', Globe],
            ['trends', 'GitHub 热门', TrendingUp],
            ['wisdom', '每日箴言', BookOpen],
            ['world', '世界快照', Sun],
          ] as [TabKey, string, typeof Activity][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            className={`ip-tab ${tab === key ? 'ip-tab-active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {error && <div className="ip-err">部分数据加载失败：{error} · 已自动降级为缓存/静态数据</div>}

      <div className="ip-body">
        {loading && (
          <div className="ip-loading">
            <div className="ip-loader" />
            <span>正在聚合全球洞察…</span>
          </div>
        )}

        {!loading && tab === 'overview' && (
          <div className="ip-overview">
            <section className="ip-card ip-card-feature">
              <div className="ip-card-head">
                <Clock size={14} />
                <h3>箴言时刻</h3>
                <div className="ip-card-actions">
                  {topWisdom && (
                    <button className="ip-icon-btn" onClick={() => copyText('wisdom', `${topWisdom.text} —— ${topWisdom.author ?? 'Unknown'}`)} title="复制">
                      {copiedId === 'wisdom' ? '已复制' : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>
              {topWisdom ? (
                <blockquote className="ip-quote">
                  <p>{topWisdom.text}</p>
                  <footer>—— {topWisdom.author ?? 'Unknown'}</footer>
                </blockquote>
              ) : <p className="ip-muted">暂无箴言</p>}
            </section>

            <section className="ip-card">
              <div className="ip-card-head">
                <Globe size={14} />
                <h3>头条新闻 Top 3</h3>
              </div>
              <ul className="ip-list">
                {topNews.map((n, i) => (
                  <li key={n.id} className="ip-list-item">
                    <span className={`ip-rank ${i < 3 ? 'ip-rank-top' : ''}`}>{i + 1}</span>
                    <a className="ip-link" href={n.url} target="_blank" rel="noreferrer">
                      <span className="ip-title">{n.title}</span>
                      <span className="ip-meta"><span>{n.source}</span><span>{n.time}</span></span>
                    </a>
                    <button
                      className="ip-icon-btn"
                      onClick={() => toggleFav(`n-${n.id}`)}
                      title={favs.includes(`n-${n.id}`) ? '取消收藏' : '收藏'}
                    >
                      {favs.includes(`n-${n.id}`) ? <Star size={13} fill="#f59e0b" color="#f59e0b" /> : <StarOff size={13} />}
                    </button>
                  </li>
                ))}
                {topNews.length === 0 && <li className="ip-muted">暂无匹配</li>}
              </ul>
            </section>

            <section className="ip-card">
              <div className="ip-card-head">
                <TrendingUp size={14} />
                <h3>GitHub 明星仓库 Top 3</h3>
              </div>
              <ul className="ip-list">
                {topTrends.map((t, i) => (
                  <li key={t.repo} className="ip-list-item">
                    <span className={`ip-rank ${i < 3 ? 'ip-rank-top' : ''}`}>{i + 1}</span>
                    <a className="ip-link" href={t.url} target="_blank" rel="noreferrer">
                      <div className="ip-repo">
                        <span className="ip-repo-name">{t.repo}</span>
                        <span className="ip-stars">★ {t.stars}</span>
                      </div>
                      <p className="ip-desc">{t.description || '(无描述)'}</p>
                      <span className="ip-lang" style={{ background: langColor(t.lang) }}>{t.lang}</span>
                    </a>
                    <button
                      className="ip-icon-btn"
                      onClick={() => toggleFav(`t-${t.repo}`)}
                    >
                      {favs.includes(`t-${t.repo}`) ? <Star size={13} fill="#f59e0b" color="#f59e0b" /> : <StarOff size={13} />}
                    </button>
                  </li>
                ))}
                {topTrends.length === 0 && <li className="ip-muted">暂无匹配</li>}
              </ul>
            </section>

            <section className="ip-card">
              <div className="ip-card-head">
                <Sun size={14} />
                <h3>世界卡片 · 随机 4 国</h3>
              </div>
              <div className="ip-countries-grid">
                {countries.slice(0, 4).map(c => (
                  <div key={c.name} className="ip-country-card">
                    {c.flag && <img src={c.flag} alt={c.name} loading="lazy" />}
                    <div className="ip-country-info">
                      <div className="ip-country-name">{c.name}</div>
                      <div className="ip-country-meta">🗺 {c.region} · 🏛 {c.capital}</div>
                      <div className="ip-country-meta">👥 {c.population}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!loading && tab === 'news' && (
          <section className="ip-card ip-card-full">
            <div className="ip-card-head"><Globe size={14} /><h3>科技新闻 · Hacker News Top 15</h3></div>
            <ul className="ip-list">
              {filteredNews.map((n, i) => (
                <li key={n.id} className="ip-list-item">
                  <span className={`ip-rank ${i < 3 ? 'ip-rank-top' : ''}`}>{i + 1}</span>
                  <a className="ip-link" href={n.url} target="_blank" rel="noreferrer">
                    <div className="ip-row">
                      <span className="ip-title">{n.title}</span>
                      <a className="ip-link-inline" href={n.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <span className="ip-meta"><span>{n.source}</span><span>{n.time}</span></span>
                  </a>
                  <button className="ip-icon-btn" onClick={() => toggleFav(`n-${n.id}`)}>
                    {favs.includes(`n-${n.id}`) ? <Star size={13} fill="#f59e0b" color="#f59e0b" /> : <StarOff size={13} />}
                  </button>
                </li>
              ))}
              {filteredNews.length === 0 && <li className="ip-muted">暂无匹配结果</li>}
            </ul>
          </section>
        )}

        {!loading && tab === 'trends' && (
          <section className="ip-card ip-card-full">
            <div className="ip-card-head"><TrendingUp size={14} /><h3>GitHub 热门仓库</h3></div>
            <ul className="ip-list">
              {filteredTrends.map((t, i) => (
                <li key={t.repo} className="ip-list-item">
                  <span className={`ip-rank ${i < 3 ? 'ip-rank-top' : ''}`}>{i + 1}</span>
                  <a className="ip-link" href={t.url} target="_blank" rel="noreferrer">
                    <div className="ip-repo">
                      <span className="ip-repo-name">{t.repo}</span>
                      <div className="ip-repo-meta">
                        <span className="ip-lang" style={{ background: langColor(t.lang) }}>{t.lang}</span>
                        <span className="ip-stars">★ {t.stars}</span>
                      </div>
                    </div>
                    <p className="ip-desc">{t.description || '(无描述)'}</p>
                  </a>
                  <button className="ip-icon-btn" onClick={() => toggleFav(`t-${t.repo}`)}>
                    {favs.includes(`t-${t.repo}`) ? <Star size={13} fill="#f59e0b" color="#f59e0b" /> : <StarOff size={13} />}
                  </button>
                </li>
              ))}
              {filteredTrends.length === 0 && <li className="ip-muted">暂无匹配结果</li>}
            </ul>
          </section>
        )}

        {!loading && tab === 'wisdom' && (
          <div className="ip-wisdoms">
            {wisdoms.map((w, i) => (
              <blockquote key={i} className="ip-quote ip-quote-card">
                <p>{w.text}</p>
                <footer className="ip-row">
                  <span>—— {w.author ?? 'Unknown'}</span>
                  <button className="ip-icon-btn" onClick={() => copyText(`w-${i}`, `${w.text} —— ${w.author ?? 'Unknown'}`)}>
                    {copiedId === `w-${i}` ? '已复制' : <Copy size={13} />}
                  </button>
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        {!loading && tab === 'world' && (
          <section className="ip-card ip-card-full">
            <div className="ip-card-head"><Sun size={14} /><h3>世界快照 · 随机国家卡片</h3></div>
            <div className="ip-countries-grid ip-countries-grid-full">
              {filteredCountries.map(c => (
                <div key={c.name} className="ip-country-card">
                  {c.flag && <img src={c.flag} alt={c.name} loading="lazy" />}
                  <div className="ip-country-info">
                    <div className="ip-country-name">{c.name}</div>
                    <div className="ip-country-meta">🗺 {c.region}</div>
                    <div className="ip-country-meta">🏛 首都: {c.capital}</div>
                    <div className="ip-country-meta">👥 人口: {c.population}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .ip-root {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          background:
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(124,108,240,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 80% 100%, rgba(0,214,193,0.10) 0%, transparent 55%),
            var(--color-surface);
          color: var(--text-primary);
          font-family: inherit;
        }
        .ip-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 18px 22px;
          border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.02);
        }
        .ip-brand { display: flex; align-items: center; gap: 12px; }
        .ip-brand-logo {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 8px 20px rgba(124,108,240,0.35);
        }
        .ip-brand h1 {
          font-size: 17px; font-weight: 700; margin: 0;
          letter-spacing: -0.02em;
        }
        .ip-brand p { margin: 2px 0 0; font-size: 12px; color: var(--text-secondary); }
        .ip-header-actions { display: flex; gap: 10px; align-items: center; }
        .ip-search {
          display: flex; align-items: center; gap: 8px;
          background: var(--glass-bg);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 7px 12px;
          color: var(--text-secondary);
          min-width: 260px;
        }
        .ip-search input {
          border: none; background: transparent; outline: none;
          color: var(--text-primary); font-size: 13px; width: 100%;
        }
        .ip-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 10px;
          font-size: 12px; font-weight: 500;
          border: 1px solid var(--color-border);
          background: var(--glass-bg);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .ip-btn:hover { background: var(--accent-subtle); border-color: var(--accent); }
        .ip-btn-ghost { background: transparent; }
        .ip-spin svg { animation: ipspin 0.8s linear infinite; }
        @keyframes ipspin { to { transform: rotate(360deg); } }

        .ip-tabs {
          display: flex; gap: 4px;
          padding: 8px 14px;
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
        }
        .ip-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px;
          font-size: 12.5px; font-weight: 500;
          background: transparent; color: var(--text-secondary);
          border: 1px solid transparent; cursor: pointer;
          white-space: nowrap;
          transition: var(--transition-smooth);
        }
        .ip-tab:hover { color: var(--text-primary); background: var(--glass-bg); }
        .ip-tab-active {
          color: var(--text-primary);
          background: var(--accent-subtle);
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent-glow-color);
        }

        .ip-body { flex: 1; overflow: auto; padding: 20px 22px; }
        .ip-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; padding: 80px 0;
          color: var(--text-secondary); font-size: 13px;
        }
        .ip-loader {
          width: 22px; height: 22px;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: ipspin 0.8s linear infinite;
        }
        .ip-err {
          margin: 0 22px 16px; padding: 10px 14px;
          background: var(--error-bg); color: var(--error);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px; font-size: 12.5px;
        }

        .ip-overview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        @media (max-width: 860px) { .ip-overview { grid-template-columns: 1fr; } }
        .ip-card {
          background: var(--glass-bg);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 18px;
          backdrop-filter: blur(8px);
          transition: var(--transition-smooth);
        }
        .ip-card:hover { border-color: rgba(124,108,240,0.25); }
        .ip-card-full { margin-bottom: 18px; }
        .ip-card-feature { grid-column: span 2; background: linear-gradient(135deg, rgba(124,108,240,0.08) 0%, rgba(0,214,193,0.06) 100%); }
        @media (max-width: 860px) { .ip-card-feature { grid-column: span 1; } }

        .ip-card-head {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 14px; color: var(--text-secondary);
        }
        .ip-card-head h3 {
          margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .ip-card-actions { margin-left: auto; display: flex; gap: 6px; }

        .ip-icon-btn {
          background: transparent; border: none; cursor: pointer;
          padding: 5px; border-radius: 6px;
          color: var(--text-secondary);
          display: inline-flex; align-items: center;
          transition: var(--transition-smooth);
          font-size: 11px;
        }
        .ip-icon-btn:hover { background: var(--glass-bg); color: var(--text-primary); }

        .ip-quote {
          margin: 0; padding: 20px 24px;
          background: rgba(255,255,255,0.03);
          border-left: 3px solid var(--color-primary);
          border-radius: 0 12px 12px 0;
          position: relative;
        }
        .ip-quote::before {
          content: '"; position: absolute; top: 8px; left: 14px;
          font-size: 60px; color: rgba(124,108,240,0.15);
          font-family: Georgia, serif; line-height: 1;
        }
        .ip-quote p {
          font-size: 17px; font-weight: 500; line-height: 1.7;
          margin: 0 0 10px; letter-spacing: -0.01em;
        }
        .ip-quote footer { font-size: 12.5px; color: var(--text-secondary); }
        .ip-quote-card { margin-bottom: 14px; }

        .ip-list { list-style: none; margin: 0; padding: 0; }
        .ip-list-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px dashed var(--color-border);
        }
        .ip-list-item:last-child { border-bottom: none; }
        .ip-rank {
          min-width: 24px; height: 24px; border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11.5px; font-weight: 700;
          background: var(--glass-bg); color: var(--text-secondary);
          margin-top: 2px;
        }
        .ip-rank-top {
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: #fff;
        }
        .ip-link {
          flex: 1; text-decoration: none; color: inherit;
          min-width: 0; cursor: pointer;
        }
        .ip-row {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .ip-title {
          display: block; font-size: 13.5px; font-weight: 500;
          line-height: 1.5;
          overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }
        .ip-link:hover .ip-title { color: var(--accent); }
        .ip-meta {
          display: flex; gap: 12px; margin-top: 4px;
          font-size: 11.5px; color: var(--text-secondary);
        }
        .ip-link-inline {
          color: var(--text-secondary);
          display: inline-flex; align-items: center;
          text-decoration: none; padding: 2px;
        }
        .ip-link-inline:hover { color: var(--accent); }

        .ip-repo {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 4px;
        }
        .ip-repo-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
        .ip-repo-meta { display: flex; align-items: center; gap: 8px; }
        .ip-lang {
          display: inline-block; padding: 2px 8px;
          font-size: 10.5px; font-weight: 600;
          color: #fff; border-radius: 999px;
          letter-spacing: 0.02em;
        }
        .ip-stars {
          font-size: 12px; font-weight: 600; color: #f59e0b;
          font-variant-numeric: tabular-nums;
        }
        .ip-desc {
          margin: 6px 0 0; font-size: 12.5px;
          color: var(--text-secondary); line-height: 1.55;
          overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }
        .ip-muted { color: var(--text-secondary); font-size: 12.5px; }

        .ip-countries-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
        }
        .ip-countries-grid-full {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
        .ip-country-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--color-border);
          border-radius: 12px; padding: 12px;
          display: flex; gap: 12px; align-items: flex-start;
          transition: var(--transition-smooth);
        }
        .ip-country-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        .ip-country-card img {
          width: 48px; height: 34px;
          object-fit: cover; border-radius: 4px;
          box-shadow: var(--shadow-sm);
        }
        .ip-country-info { flex: 1; min-width: 0; }
        .ip-country-name {
          font-size: 13.5px; font-weight: 600; margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .ip-country-meta {
          font-size: 11.5px; color: var(--text-secondary);
          line-height: 1.7;
        }
      `}</style>
    </div>
  )
}
