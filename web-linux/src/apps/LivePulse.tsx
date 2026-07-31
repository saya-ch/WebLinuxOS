import { useState, useEffect, useCallback, memo } from 'react'
import {
  TrendingUp, TrendingDown,
  RefreshCw, Clock, Globe, Laugh, Lightbulb, Newspaper,
  Search, DollarSign, Coins, ArrowRightLeft, ChevronDown,
  Sparkles, Share2, Copy, Check, Info
} from 'lucide-react'
import { copyToClipboard, safeFetch, generateUUID } from '../utils/common'

/* ============ 类型定义 ============ */
type TabKey = 'fx' | 'news' | 'jokes' | 'facts'

interface FxRate {
  rate: number
  timestamp: number
  base: string
  target: string
}

interface NewsItem {
  id: string
  title: string
  url: string
  summary?: string
  source: string
  publishedAt: string
  imageUrl?: string
}

interface JokeItem {
  id: string
  setup: string
  punchline?: string
  type: 'single' | 'twopart'
  content?: string
  category: string
  lang: string
}

interface FactItem {
  id: string
  text: string
  source?: string
  category?: string
}

/* ============ 常量配置 ============ */
const FX_BASES = ['USD', 'EUR', 'CNY', 'GBP', 'JPY', 'HKD', 'KRW', 'SGD', 'AUD', 'CAD', 'CHF', 'INR']
const FX_TARGETS = FX_BASES

const CACHE_FX = new Map<string, { data: FxRate; expires: number }>()
const FX_TTL = 5 * 60 * 1000 // 5分钟

const CATEGORIES: Record<TabKey, { name: string; icon: typeof Globe; hint: string }> = {
  fx:     { name: '实时汇率', icon: Coins,       hint: 'Frankfurter API 免费公开数据' },
  news:   { name: '全球速览', icon: Newspaper,   hint: 'Hacker News / Spaceflight 公开源' },
  jokes:  { name: '开怀一刻', icon: Laugh,       hint: 'JokeAPI 合规公开内容' },
  facts:  { name: '奇趣百科', icon: Lightbulb,   hint: 'uselessfacts / public API' },
}

/* ============ 工具：安全日期格式化 ============ */
function formatTime(t: number | string): string {
  const d = new Date(t)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatDateTime(t: string | number): string {
  const d = new Date(t)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  return `${Math.floor(diff / 86400_000)} 天前`
}

function fmt(n: number, digits = 4): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n < 0.001) return n.toExponential(3)
  return n.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '')
}

/* ============ 组件：复制按钮 ============ */
const CopyBtn: React.FC<{ text: string; label?: string }> = ({ text, label = '复制' }) => {
  const [ok, setOk] = useState(false)
  const handle = async () => {
    const res = await copyToClipboard(text)
    setOk(res)
    setTimeout(() => setOk(false), 1400)
  }
  return (
    <button
      onClick={handle}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 8, border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)', color: 'var(--text-secondary)',
        fontSize: 11, cursor: 'pointer',
      }}
    >
      {ok ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
      <span>{ok ? '已复制' : label}</span>
    </button>
  )
}

/* ============ 模块1：汇率查询（Frankfurter） ============ */
async function fetchFxRate(base: string, target: string): Promise<FxRate> {
  const key = `${base}->${target}`
  const cached = CACHE_FX.get(key)
  if (cached && cached.expires > Date.now()) return cached.data

  const json = await safeFetch<{ rates: Record<string, number>; base: string; date: string }>(
    `https://api.frankfurter.app/latest?from=${base}&to=${target}`,
    { timeoutMs: 12000, retries: 2 }
  )
  const rate = Number(json.rates?.[target]) || NaN
  if (!Number.isFinite(rate)) throw new Error('汇率数据无效')
  const result: FxRate = {
    rate, base, target,
    timestamp: Date.now(),
  }
  CACHE_FX.set(key, { data: result, expires: Date.now() + FX_TTL })
  return result
}

function FxPanel() {
  const [base, setBase] = useState('USD')
  const [target, setTarget] = useState('CNY')
  const [amount, setAmount] = useState<number>(1)
  const [rate, setRate] = useState<FxRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [swap, setSwap] = useState(0)

  const load = useCallback(async () => {
    if (base === target) {
      setRate({ rate: 1, base, target, timestamp: Date.now() })
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await fetchFxRate(base, target)
      setRate(r)
    } catch (e) {
      setError('获取汇率失败，请稍后重试 · ' + ((e as Error).message || 'Network error'))
    } finally {
      setLoading(false)
    }
  }, [base, target])

  useEffect(() => { load() }, [load, swap])

  const result = rate ? amount * rate.rate : 0
  const inverse = rate ? 1 / rate.rate : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 转换栏 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            源货币
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--glass-bg)', borderRadius: 12,
            border: '1px solid var(--glass-border)', overflow: 'hidden',
          }}>
            <input
              type="number" value={amount} min={0}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              style={{
                width: 100, flex: 1, background: 'transparent', border: 'none',
                padding: '10px 12px', color: 'var(--text-primary)',
                fontSize: 16, fontWeight: 600, outline: 'none',
              }}
            />
            <SelectCurrency value={base} list={FX_BASES} onChange={setBase} />
          </div>
        </div>

        <button
          onClick={() => {
            const a = base; setBase(target); setTarget(a); setSwap(s => s + 1)
          }}
          title="翻转货币对"
          style={{
            width: 40, height: 40, borderRadius: 999,
            background: 'var(--accent-gradient)',
            color: 'white', border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            boxShadow: 'var(--accent-glow)',
          }}
        >
          <ArrowRightLeft size={16} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            目标货币
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-bg)', borderRadius: 12,
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            overflow: 'hidden',
          }}>
            <div style={{
              flex: 1, padding: '10px 12px', fontSize: 16, fontWeight: 700,
              color: 'var(--accent-strong)', fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
            }}>
              {loading ? '·····' : fmt(result, 4)}
            </div>
            <SelectCurrency value={target} list={FX_TARGETS} onChange={setTarget} />
          </div>
        </div>
      </div>

      {/* 汇率牌价卡 */}
      <div style={{
        padding: 14, borderRadius: 14,
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent) 0%, color-mix(in srgb, var(--accent-secondary) 10%, transparent) 100%)',
        border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            当前汇率 · 更新于 {rate ? formatTime(rate.timestamp) : '--:--'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>
            {loading ? (
              <span className="anim-shimmer">加载中...</span>
            ) : (
              <>
                1 <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{base}</span>
                <span style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>=</span>
                <span className="text-gradient">{fmt(rate?.rate || 0, 4)}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}> {target}</span>
              </>
            )}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>反向汇率</div>
          <div style={{ fontSize: 15, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {loading ? '······' : `1 ${target} ≈ ${fmt(inverse, 6)} ${base}`}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={load}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 999,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)', color: 'var(--text-primary)',
                fontSize: 11, cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
              刷新
            </button>
            <CopyBtn text={`1 ${base} = ${fmt(rate?.rate || 0, 4)} ${target}`} />
          </div>
        </div>
        {error && (
          <div style={{
            gridColumn: '1 / -1', padding: '8px 12px', borderRadius: 8,
            background: 'var(--error-bg)', color: 'var(--error)',
            fontSize: 12,
          }}>
            <Info size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }} />
            {error}
          </div>
        )}
      </div>

      {/* 常用牌价 */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
          常用货币对 · 以 {base} 为基准
        </div>
        <QuickRatesList baseCode={base} />
      </div>
    </div>
  )
}

function QuickRatesList({ baseCode }: { baseCode: string }) {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const targets = FX_TARGETS.filter(t => t !== baseCode).slice(0, 8).join(',')
    safeFetch<{ rates: Record<string, number> }>(
      `https://api.frankfurter.app/latest?from=${baseCode}&to=${targets}`,
      { timeoutMs: 10000, retries: 1 }
    ).then(json => {
      if (alive) {
        setRates(json.rates || {})
        setError(null)
      }
    }).catch(e => {
      if (alive) setError((e as Error).message)
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [baseCode])

  if (error) {
    return <div style={{ fontSize: 12, color: 'var(--error)' }}>加载失败：{error}</div>
  }
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="anim-shimmer" style={{ height: 52, borderRadius: 10, background: 'var(--glass-bg)' }} />
        ))}
      </div>
    )
  }
  const entries = Object.entries(rates).slice(0, 8)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {entries.map(([t, r]) => (
        <div key={t} style={{
          padding: 10, borderRadius: 10,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          transition: 'all 0.2s ease', cursor: 'default',
        }} className="widget-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t}</span>
            <span style={{ fontSize: 10, color: r >= 1 ? 'var(--success)' : 'var(--warning)' }}>
              {r >= 1 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {fmt(r, 3)}
          </div>
        </div>
      ))}
    </div>
  )
}

function SelectCurrency({ value, list, onChange }: { value: string; list: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '10px 12px', background: 'transparent',
          color: 'var(--text-primary)', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-mono)',
          letterSpacing: 0.5,
        }}
      >
        <DollarSign size={12} />
        {value}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: '0.2s' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            maxHeight: 220, overflowY: 'auto', width: 140, zIndex: 51,
            background: 'var(--context-menu-bg)', borderRadius: 10,
            border: '1px solid var(--launcher-border)',
            boxShadow: 'var(--shadow-medium)', padding: 4,
          }}>
            {list.map(code => (
              <button key={code}
                onClick={() => { onChange(code); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', borderRadius: 6,
                  background: code === value ? 'var(--accent-bg)' : 'transparent',
                  color: code === value ? 'var(--accent-strong)' : 'var(--text-primary)',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                  fontWeight: code === value ? 700 : 500,
                  fontFamily: 'var(--font-mono)',
                }}>
                {code}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ============ 模块2：新闻速览（HN + Spaceflight） ============ */
async function fetchHNStories(): Promise<NewsItem[]> {
  const ids = await safeFetch<number[]>(
    'https://hacker-news.firebaseio.com/v0/topstories.json',
    { timeoutMs: 10000, retries: 2 }
  )
  const selected = ids.slice(0, 8)
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
      source: 'Hacker News',
      summary: `${i!.score || 0} points · by ${i!.by || 'anon'}`,
      publishedAt: new Date(i!.time * 1000).toISOString(),
    }))
}

async function fetchSpaceNews(): Promise<NewsItem[]> {
  try {
    const json = await safeFetch<{
      results: Array<{ id: number; title: string; url: string; image_url?: string; summary?: string; published_at: string; news_site: string }>
    }>('https://api.spaceflightnewsapi.net/v4/articles/?limit=8&_limit=8', { timeoutMs: 10000, retries: 1 })
    return (json.results || []).map(a => ({
      id: String(a.id),
      title: a.title,
      url: a.url,
      summary: a.summary || '',
      imageUrl: a.image_url,
      source: a.news_site || 'Spaceflight',
      publishedAt: a.published_at,
    }))
  } catch { return [] }
}

function NewsPanel() {
  const [tab, setTab] = useState<'hn' | 'space'>('hn')
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<number>(0)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = tab === 'hn' ? await fetchHNStories() : await fetchSpaceNews()
      setItems(data)
      setLastSync(Date.now())
    } catch (e) {
      setError('加载失败，请稍后重试')
    } finally { setLoading(false) }
  }, [tab])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          {([['hn', 'Hacker News'], ['space', '航天科技']] as const).map(([k, n]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{
                padding: '6px 14px', borderRadius: 999,
                background: tab === k ? 'var(--accent-gradient)' : 'transparent',
                color: tab === k ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontSize: 12,
                fontWeight: tab === k ? 700 : 500,
                boxShadow: tab === k ? 'var(--accent-glow)' : 'none',
              }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            <Clock size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
            更新 {lastSync ? formatTime(lastSync) : '--:--'}
          </span>
          <button
            onClick={load} disabled={loading}
            title="刷新"
            style={{
              width: 30, height: 30, borderRadius: 999,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', cursor: loading ? 'wait' : 'pointer',
              display: 'grid', placeItems: 'center',
            }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          </button>
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--error)', padding: 8, background: 'var(--error-bg)', borderRadius: 8 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="anim-shimmer" style={{ height: 68, borderRadius: 10, background: 'var(--glass-bg)' }} />
          ))
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 13 }}>
            暂无数据
          </div>
        ) : (
          items.map((n, i) => (
            <a key={n.id} href={n.url} target="_blank" rel="noreferrer noopener"
              style={{
                display: 'block', padding: 12, borderRadius: 12,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'inherit', textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 35%, transparent)'
                e.currentTarget.style.boxShadow = 'var(--accent-glow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)',
                  background: i < 3 ? 'var(--accent-gradient)' : 'var(--accent-bg)',
                  color: i < 3 ? 'white' : 'var(--accent-strong)',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                    color: 'var(--text-primary)', marginBottom: 4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999,
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent-strong)', fontWeight: 600,
                    }}>{n.source}</span>
                    <span>{formatDateTime(n.publishedAt)}</span>
                    {n.summary && <span>· {n.summary}</span>}
                  </div>
                </div>
                <Share2 size={12} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 6 }} />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}

/* ============ 模块3：笑话 ============ */
async function fetchJoke(): Promise<JokeItem> {
  const json = await safeFetch<{
    id: number; type: 'single' | 'twopart'; category: string; lang: string;
    joke?: string; setup?: string; delivery?: string
  }>('https://v2.jokeapi.dev/joke/Programming,Miscellaneous,Pun,Spooky,Christmas?blacklistFlags=nsfw,religious,racist,sexist,explicit&type=single,twopart&lang=en',
    { timeoutMs: 10000, retries: 2 }
  )
  return {
    id: String(json.id) || generateUUID(),
    type: json.type,
    category: json.category,
    lang: json.lang,
    setup: json.type === 'twopart' ? (json.setup || '') : (json.joke || ''),
    punchline: json.type === 'twopart' ? json.delivery : undefined,
    content: json.type === 'single' ? (json.joke || '') : undefined,
  }
}

function JokesPanel() {
  const [joke, setJoke] = useState<JokeItem | null>(null)
  const [showPunch, setShowPunch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<JokeItem[]>([])

  const load = useCallback(async () => {
    setLoading(true); setError(null); setShowPunch(false)
    try {
      const j = await fetchJoke()
      setJoke(j)
      setHistory(h => [j, ...h].slice(0, 5))
    } catch (e) {
      setError('加载笑话失败，请检查网络')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
            display: 'grid', placeItems: 'center', color: 'white',
            boxShadow: '0 6px 18px rgba(245,87,108,0.35)',
          }}>
            <Laugh size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>开怀一刻</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {joke?.category || '...'} · 来源 JokeAPI
            </div>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999,
            background: 'var(--accent-gradient)', color: 'white',
            border: 'none', cursor: loading ? 'wait' : 'pointer',
            fontSize: 12, fontWeight: 600,
            boxShadow: 'var(--accent-glow)',
          }}>
          <Sparkles size={12} />
          {loading ? '加载中...' : '换一个'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 12, background: 'var(--error-bg)', color: 'var(--error)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {joke && (
        <div style={{
          padding: 24, borderRadius: 20,
          background:
            'radial-gradient(ellipse at top left, color-mix(in srgb, #f5576c 18%, transparent) 0%, transparent 60%),' +
            'radial-gradient(ellipse at bottom right, color-mix(in srgb, #f093fb 15%, transparent) 0%, transparent 60%),' +
            'var(--glass-bg)',
          border: '1px solid color-mix(in srgb, #f5576c 25%, transparent)',
          boxShadow: 'var(--shadow-soft)',
          minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 12, right: 14, opacity: 0.1, fontSize: 120, lineHeight: 1, fontWeight: 900 }}>
            "
          </div>
          {joke.type === 'single' ? (
            <p style={{
              fontSize: 17, lineHeight: 1.7, fontWeight: 500,
              fontFamily: 'var(--font-serif)', letterSpacing: 0.2,
              position: 'relative', zIndex: 1,
            }}>
              {joke.setup}
            </p>
          ) : (
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{
                fontSize: 16, lineHeight: 1.6, fontWeight: 500,
                fontFamily: 'var(--font-serif)',
              }}>
                <span style={{ color: 'var(--accent-strong)', fontWeight: 700, marginRight: 8 }}>Q.</span>
                {joke.setup}
              </p>
              {showPunch ? (
                <p style={{
                  fontSize: 16, lineHeight: 1.6, fontWeight: 600,
                  padding: '12px 16px', borderRadius: 12,
                  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                  borderLeft: '3px solid var(--accent)',
                  animation: 'slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  fontFamily: 'var(--font-serif)',
                }}>
                  <span style={{ color: 'var(--accent-strong)', fontWeight: 700, marginRight: 8 }}>A.</span>
                  {joke.punchline}
                </p>
              ) : (
                <button onClick={() => setShowPunch(true)}
                  style={{
                    alignSelf: 'flex-start', padding: '10px 20px',
                    borderRadius: 999, fontSize: 13, fontWeight: 600,
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    color: 'var(--accent-strong)', cursor: 'pointer',
                  }}>
                  查看答案 ▼
                </button>
              )}
            </div>
          )}

          <div style={{
            marginTop: 20, display: 'flex', gap: 8,
            justifyContent: 'flex-end', position: 'relative', zIndex: 1,
          }}>
            <CopyBtn text={joke.type === 'single' ? (joke.setup || '') : `${joke.setup}\n${joke.punchline || ''}`} label="复制文本" />
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
            历史回顾 ({history.slice(1).length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(1, 4).map(h => (
              <div key={h.id} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                <span style={{
                  display: 'inline-block', padding: '1px 8px', marginRight: 8,
                  borderRadius: 999, fontSize: 10, fontWeight: 600,
                  background: 'color-mix(in srgb, #f5576c 18%, transparent)',
                  color: '#f5576c',
                }}>{h.category}</span>
                {h.setup}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ 模块4：冷知识 / 奇趣百科 ============ */
async function fetchFact(): Promise<FactItem> {
  try {
    const json = await safeFetch<{ id: string; text: string; source?: string; source_url?: string; language?: string; permalink?: string }>(
      'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en',
      { timeoutMs: 8000, retries: 1 }
    )
    return {
      id: json.id || generateUUID(),
      text: json.text || '',
      source: json.source || 'Useless Facts',
      category: 'General',
    }
  } catch {
    // 回退备用API
    const json = await safeFetch<{ slip: { id: number; advice: string } }>(
      'https://api.adviceslip.com/advice',
      { timeoutMs: 8000, retries: 2 }
    )
    return {
      id: String(json.slip.id),
      text: json.slip.advice,
      source: 'Advice Slip',
      category: 'Life Advice',
    }
  }
}

function FactsPanel() {
  const [fact, setFact] = useState<FactItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<FactItem[]>(() => {
    try {
      const raw = localStorage.getItem('weblinux-livepulse-facts')
      return raw ? JSON.parse(raw) as FactItem[] : []
    } catch { return [] }
  })

  const persist = (arr: FactItem[]) => {
    setSaved(arr)
    try { localStorage.setItem('weblinux-livepulse-facts', JSON.stringify(arr)) } catch { /* ignore */ }
  }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const f = await fetchFact()
      setFact(f)
    } catch (e) {
      setError('获取冷知识失败，请稍后重试')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const isSaved = fact ? saved.some(s => s.id === fact.id) : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            display: 'grid', placeItems: 'center', color: 'white',
            boxShadow: '0 6px 18px rgba(253,160,133,0.35)',
          }}>
            <Lightbulb size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>奇趣百科</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {fact?.category || '...'} · {fact?.source || 'UselessFacts'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={load} disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999,
              background: 'var(--accent-gradient)', color: 'white',
              border: 'none', cursor: loading ? 'wait' : 'pointer',
              fontSize: 12, fontWeight: 600,
              boxShadow: 'var(--accent-glow)',
            }}>
            <Sparkles size={12} />
            {loading ? '获取中...' : '再来一条'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 12, background: 'var(--error-bg)', color: 'var(--error)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {fact && (
        <div style={{
          padding: 28, borderRadius: 20,
          background:
            'radial-gradient(ellipse at top right, color-mix(in srgb, #f6d365 18%, transparent) 0%, transparent 60%),' +
            'radial-gradient(ellipse at bottom left, color-mix(in srgb, #fda085 15%, transparent) 0%, transparent 60%),' +
            'var(--glass-bg)',
          border: '1px solid color-mix(in srgb, #f6d365 30%, transparent)',
          minHeight: 180,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          animation: loading ? undefined : 'scaleIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          <Lightbulb size={80} style={{
            position: 'absolute', top: -20, right: -10,
            opacity: 0.07,
          }} />
          <p style={{
            fontSize: 18, lineHeight: 1.7, fontWeight: 500,
            fontFamily: 'var(--font-serif)', letterSpacing: 0.3,
            textAlign: 'center', position: 'relative', zIndex: 1,
          }}>
            <span style={{
              fontSize: 40, opacity: 0.25, fontWeight: 900,
              display: 'block', lineHeight: 0.4, marginLeft: -14,
              marginBottom: 12, textAlign: 'left',
              fontFamily: 'var(--font-display)', color: '#fda085',
            }}>"</span>
            {fact.text}
          </p>
        </div>
      )}

      {fact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {isSaved ? '✓ 已收藏' : '点击收藏保存到本地'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => {
                if (!fact) return
                if (isSaved) persist(saved.filter(s => s.id !== fact.id))
                else persist([fact, ...saved].slice(0, 30))
              }}
              style={{
                padding: '6px 12px', borderRadius: 999,
                background: isSaved ? 'var(--warning-bg)' : 'var(--glass-bg)',
                color: isSaved ? 'var(--warning)' : 'var(--text-secondary)',
                border: '1px solid var(--glass-border)',
                fontSize: 11, cursor: 'pointer', fontWeight: 600,
              }}>
              {isSaved ? '★ 已收藏' : '☆ 收藏'}
            </button>
            <CopyBtn text={fact?.text || ''} />
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
            <span>我的收藏 · {saved.length}</span>
            <button onClick={() => persist([])} style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              fontSize: 10, cursor: 'pointer', textDecoration: 'underline',
            }}>全部清除</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {saved.map(s => (
              <div key={s.id} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--warning)', marginBottom: 2 }}>★ {s.category || '收藏'}</div>
                {s.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ 主组件：LivePulse ============ */
const LivePulse: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('fx')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      color: 'var(--text-primary)', fontSize: 13,
    }}>
      {/* 标题栏 */}
      <header style={{
        padding: '16px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background:
              'conic-gradient(from 0deg, #7c6cf0, #22e1c9, #ff9f6b, #f5576c, #7c6cf0)',
            display: 'grid', placeItems: 'center',
            boxShadow: 'var(--accent-glow-strong)',
            animation: 'spin 12s linear infinite',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--color-surface)',
              display: 'grid', placeItems: 'center',
            }}>
              <Globe size={18} style={{ color: 'var(--accent-strong)' }} />
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              LivePulse · 实时信息中心
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              <span className="status-dot online" style={{ marginRight: 6 }} />
              接入 4 个合规公开 API · Frankfurter / Hacker News / JokeAPI / UselessFacts
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
          }}>
            <Search size={11} /> 精选数据面板
          </div>
        </div>
      </header>

      {/* Tab 切换 */}
      <nav style={{
        display: 'flex', padding: '12px 20px 0', gap: 4,
        borderBottom: '1px solid var(--glass-border)',
        overflowX: 'auto',
      }}>
        {(Object.entries(CATEGORIES) as [TabKey, typeof CATEGORIES[TabKey]][]).map(([k, meta]) => {
          const Icon = meta.icon
          const active = tab === k
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 16px',
                borderRadius: '10px 10px 0 0',
                background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                border: active
                  ? '1px solid var(--glass-border)'
                  : '1px solid transparent',
                borderBottom: 'none',
                color: active ? 'var(--accent-strong)' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: 12, cursor: 'pointer',
                position: 'relative', marginBottom: -1,
                transition: 'all 0.2s ease',
              }}>
              <Icon size={13} />
              {meta.name}
              {active && <span style={{
                position: 'absolute', bottom: 0, left: 12, right: 12, height: 2,
                borderRadius: '2px 2px 0 0',
                background: 'var(--accent-gradient)',
                boxShadow: '0 0 8px var(--accent)',
              }} />}
            </button>
          )
        })}
      </nav>

      {/* 内容区 */}
      <main style={{
        flex: 1, padding: 20, overflow: 'auto',
        background:
          'radial-gradient(1000px 400px at 90% -10%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 60%),' +
          'radial-gradient(800px 400px at -10% 110%, color-mix(in srgb, var(--accent-secondary) 6%, transparent) 0%, transparent 60%),' +
          'transparent',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--text-secondary)',
          marginBottom: 12, marginTop: -4,
          opacity: 0.7,
        }}>
          <Info size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
          {CATEGORIES[tab].hint} · 数据均来自公开合规 API，WebLinuxOS 不存储用户数据
        </div>
        {tab === 'fx' && <FxPanel />}
        {tab === 'news' && <NewsPanel />}
        {tab === 'jokes' && <JokesPanel />}
        {tab === 'facts' && <FactsPanel />}
      </main>
    </div>
  )
}

export default memo(LivePulse)
