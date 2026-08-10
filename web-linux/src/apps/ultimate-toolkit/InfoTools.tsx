import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../store'
import {
  BookOpen, Quote as QuoteIcon, Laugh, TrendingUp, Sparkles,
  ExternalLink, Search, RefreshCw, Copy,
} from './Shared'
import { type ToolProps, ToolHeader, SearchBar, primaryBtnStyle, ghostBtnStyle } from './Shared'

export function WikiTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [article, setArticle] = useState<any>(null)

  const search = useCallback(async (target?: string) => {
    const q = (target ?? query).trim()
    if (!q) {
      addNotification({ title: '请输入搜索词', message: '', type: 'warning' })
      return
    }
    setLoading(true)
    setArticle(null)
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('未找到相关条目')
      const data = await res.json()
      setArticle(data)
      onAddHistory('wiki', q, data.title || q)
    } catch (err: any) {
      addNotification({ title: '搜索失败', message: err.message || '请尝试其他关键词', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [query, onAddHistory, addNotification])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<BookOpen size={20} style={{ color: '#fbbf24' }} />} title="百科搜索" subtitle="Wikipedia API · 知识百科查询" />
      <SearchBar value={query} onChange={setQuery} onSearch={() => search()} placeholder="搜索 Wikipedia 条目（英文效果最佳）" loading={loading} />

      {article && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {article.thumbnail?.source && (
                <img src={article.thumbnail.source} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10 }} />
              )}
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{article.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{article.description || ''}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 16 }}
              dangerouslySetInnerHTML={{ __html: article.extract_html || article.extract || '' }}
            />
            {article.content_urls?.desktop?.page && (
              <a href={article.content_urls.desktop.page} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={14} /> 查看完整条目
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function QuoteTool({ onAddHistory, onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [quote, setQuote] = useState<{ q: string; a: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    setQuote(null)
    try {
      const res = await fetch('https://zenquotes.io/api/random')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const result = { q: data[0].q, a: data[0].a }
        setQuote(result)
        onAddHistory('quote', '随机名言', result.q)
      }
    } catch (err: any) {
      addNotification({ title: '获取失败', message: err.message || '请稍后重试', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [onAddHistory, addNotification])

  useEffect(() => { fetchQuote() }, [])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<QuoteIcon size={20} style={{ color: '#fb923c' }} />} title="每日名言" subtitle="ZenQuotes API · 激励人心的语句" />

      <div style={{
        marginTop: 20,
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(251, 191, 36, 0.1))',
        border: '1px solid rgba(251, 146, 60, 0.3)',
        borderRadius: 20, padding: '40px 32px', textAlign: 'center',
        minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      }}>
        {loading ? (
          <RefreshCw size={24} className="ut-spin" style={{ color: 'var(--accent)' }} />
        ) : quote ? (
          <>
            <QuoteIcon size={32} style={{ color: 'var(--accent)', opacity: 0.5 }} />
            <blockquote style={{ fontSize: 18, lineHeight: 1.7, fontStyle: 'italic', maxWidth: 500, margin: 0 }}>
              "{quote.q}"
            </blockquote>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>— {quote.a}</div>
          </>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>点击下方按钮获取名言</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchQuote} style={primaryBtnStyle}>
            <RefreshCw size={16} /> 换一条
          </button>
          {quote && (
            <button onClick={() => onCopy(`"${quote.q}" — ${quote.a}`, '名言已复制')} style={ghostBtnStyle}>
              <Copy size={14} /> 复制
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function JokeTool({ onAddHistory, onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [joke, setJoke] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchJoke = useCallback(async () => {
    setLoading(true)
    setJoke(null)
    try {
      const res = await fetch('https://v2.jokeapi.dev/joke/Programming?safe-mode')
      const data = await res.json()
      setJoke(data)
      const content = data.setup ? `${data.setup}\n\n${data.delivery}` : data.joke
      onAddHistory('joke', '编程笑话', content)
    } catch (err: any) {
      addNotification({ title: '获取失败', message: err.message || '请稍后重试', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [onAddHistory, addNotification])

  useEffect(() => { fetchJoke() }, [])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<Laugh size={20} style={{ color: '#22d3ee' }} />} title="编程笑话" subtitle="JokeAPI · 程序员的日常" />

      <div style={{
        marginTop: 20,
        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(167, 139, 250, 0.1))',
        border: '1px solid var(--window-border)',
        borderRadius: 20, padding: 32, minHeight: 240,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      }}>
        {loading ? (
          <RefreshCw size={24} className="ut-spin" style={{ color: 'var(--accent)' }} />
        ) : joke ? (
          <>
            <Laugh size={32} style={{ color: 'var(--accent)', opacity: 0.6 }} />
            {joke.type === 'twopart' ? (
              <div style={{ textAlign: 'center', maxWidth: 500 }}>
                <div style={{ fontSize: 16, marginBottom: 16, lineHeight: 1.6 }}>{joke.setup}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)', lineHeight: 1.6 }}>{joke.delivery}</div>
              </div>
            ) : (
              <div style={{ fontSize: 16, textAlign: 'center', maxWidth: 500, lineHeight: 1.6 }}>{joke.joke}</div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>点击获取笑话</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchJoke} style={primaryBtnStyle}>
            <RefreshCw size={16} /> 换一个
          </button>
          {joke && (
            <button onClick={() => {
              const text = joke.type === 'twopart' ? `${joke.setup}\n\n${joke.delivery}` : joke.joke
              onCopy(text, '笑话已复制')
            }} style={ghostBtnStyle}>
              <Copy size={14} /> 复制
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const coinNames: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', binancecoin: 'BNB', solana: 'SOL',
  ripple: 'XRP', cardano: 'ADA', dogecoin: 'DOGE', polkadot: 'DOT',
  chainlink: 'LINK', polygon: 'MATIC',
}

export function CryptoTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [loading, setLoading] = useState(false)
  const [prices, setPrices] = useState<any>(null)
  const [ids, setIds] = useState('bitcoin,ethereum,binancecoin,solana,ripple')

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setPrices(null)
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}` +
        `&vs_currencies=usd,cny&include_24hr_change=true`
      )
      if (!res.ok) throw new Error('API请求失败')
      const data = await res.json()
      setPrices(data)
      onAddHistory('crypto', ids, '加密货币行情')
    } catch (err: any) {
      addNotification({ title: '获取失败', message: err.message || '请稍后重试', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [ids, onAddHistory, addNotification])

  useEffect(() => { fetchPrices() }, [])

  const coinList = ids.split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<TrendingUp size={20} style={{ color: '#f87171' }} />} title="加密货币行情" subtitle="CoinGecko API · 实时加密货币价格" />

      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
        borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', gap: 8,
      }}>
        <input value={ids} onChange={(e) => setIds(e.target.value)} placeholder="输入CoinGecko ID，用逗号分隔"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--window-border)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', flex: 1 }}
        />
        <button onClick={fetchPrices} disabled={loading} style={{
          padding: '0 16px', borderRadius: 10, background: loading ? 'var(--glass-bg)' : 'var(--accent)',
          border: 'none', color: loading ? 'var(--text-secondary)' : 'white',
          cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {loading ? <RefreshCw size={16} className="ut-spin" /> : <Search size={16} />}
        </button>
      </div>

      {prices && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {coinList.map((id) => {
            const coin = prices[id]
            if (!coin) return null
            const change = coin.usd_24h_change
            return (
              <div key={id} style={{
                background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.08), rgba(167, 139, 250, 0.08))',
                border: '1px solid var(--window-border)', borderRadius: 12, padding: 16,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                  {coinNames[id] || id}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  ${coin.usd?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  ¥{coin.cny?.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                </div>
                {change !== undefined && (
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: change >= 0 ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <TrendingUp size={12} style={{ transform: change < 0 ? 'rotate(180deg)' : 'none' }} />
                    {change >= 0 ? '+' : ''}{change?.toFixed(2)}% (24h)
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ghLanguages = ['', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'ruby', 'php']

export function GitHubTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [lang, setLang] = useState('')
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<any[]>([])

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    setRepos([])
    try {
      const url = `https://api.github.com/search/repositories?q=${lang ? `language:${lang} ` : ''}stars:>100&sort=updated&order=desc&per_page=12`
      const res = await fetch(url)
      if (!res.ok) throw new Error('GitHub API 请求失败')
      const data = await res.json()
      setRepos(data.items || [])
      onAddHistory('github', lang || 'all', `${data.items?.length || 0} repos`)
    } catch (err: any) {
      addNotification({ title: '获取失败', message: err.message || '请稍后重试', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [lang, onAddHistory, addNotification])

  useEffect(() => { fetchTrending() }, [])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<Sparkles size={20} style={{ color: '#818cf8' }} />} title="GitHub 热门" subtitle="GitHub API · 近期热门仓库" />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {ghLanguages.map((l) => (
          <button key={l || 'all'} onClick={() => { setLang(l); setRepos([]) }} style={{
            padding: '6px 12px', borderRadius: 8,
            background: lang === l ? 'var(--accent-bg)' : 'transparent',
            border: lang === l ? '1px solid var(--accent)' : '1px solid var(--window-border)',
            color: lang === l ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 12,
          }}>
            {l === '' ? '全部' : l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="ut-spin" style={{ margin: '0 auto' }} />
            <div style={{ marginTop: 8 }}>加载中...</div>
          </div>
        ) : repos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>暂无仓库</div>
        ) : (
          repos.map((repo) => (
            <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
              style={{
                padding: 14, background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
                borderRadius: 10, color: 'inherit', textDecoration: 'none', display: 'block',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--window-border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <img src={repo.owner.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{repo.full_name}</span>
              </div>
              {repo.description && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                  {repo.description.length > 100 ? repo.description.slice(0, 100) + '...' : repo.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
                {repo.language && <span>● {repo.language}</span>}
                <span>★ {repo.stargazers_count.toLocaleString()}</span>
                <span>⑂ {repo.forks_count.toLocaleString()}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}