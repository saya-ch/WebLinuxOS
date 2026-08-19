// UtilityStack — 公共 API 工具集
// 集成多个免费公开 API（无需认证）：ip-api / Quote / LoremFlickr / Punk(beer) / ChuckNorris
import { useState, useEffect, useCallback, memo } from 'react'
import {
  CoffeeIcon, SparklesIcon,
  RefreshCwIcon, CopyIcon, DownloadIcon
} from '../icons'

// Quote 图标（内联 SVG）
const QuoteIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 3-1 5-4 5z"/><path d="M14 21c3 0 7-1 7-8V5h-7v8h4c0 3-1 5-4 5z"/>
  </svg>
)

const TAB_CONFIG = [
  { id: 'ip',       name: 'IP 归属地',     icon: '📍', accent: '#3b82f6' },
  { id: 'quote',    name: '每日箴言',     icon: '💬', accent: '#8b5cf6' },
  { id: 'lorem',    name: '图片灵感',     icon: '🖼', accent: '#ec4899' },
  { id: 'beer',     name: '啤酒推荐',     icon: '🍺', accent: '#f59e0b' },
  { id: 'joke',     name: '冷知识笑话',   icon: '🎭', accent: '#10b981' },
] as const

type TabId = typeof TAB_CONFIG[number]['id']

const UtilityStack = memo(function UtilityStack() {
  const [tab, setTab] = useState<TabId>('ip')

  return (
    <div style={styles.root}>
      <div style={styles.sidebar}>
        <div style={styles.logoRow}>
          <SparklesIcon size={18} />
          <span style={styles.logoText}>Utility Stack</span>
        </div>
        <div style={styles.logoSub}>公共 API 工具集</div>
        <div style={styles.tabList}>
          {TAB_CONFIG.map((c) => (
            <button
              key={c.id}
              onClick={() => setTab(c.id)}
              style={{
                ...styles.tabBtn,
                background: tab === c.id ? c.accent : 'transparent',
                color: tab === c.id ? '#fff' : '#cbd5e1',
                borderLeft: tab === c.id ? `3px solid ${c.accent}` : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ marginLeft: 10 }}>{c.name}</span>
            </button>
          ))}
        </div>
        <div style={styles.sidebarFooter}>
          <div style={{ fontSize: 11, color: '#64748b' }}>所有 API 均为公开免费</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>数据实时获取 · 无账号要求</div>
        </div>
      </div>
      <div style={styles.main}>
        {tab === 'ip' && <IPLookup />}
        {tab === 'quote' && <QuoteGenerator />}
        {tab === 'lorem' && <LoremFlickr />}
        {tab === 'beer' && <BeerExplorer />}
        {tab === 'joke' && <JokeGenerator />}
      </div>
    </div>
  )
})

// ========== 通用 Hook ==========
function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetcher()
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { reload() }, [reload])
  return { data, loading, error, reload }
}

async function safeFetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { Accept: 'application/json', ...(opts?.headers || {}) } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ========== 1. IP 归属地查询 ==========
interface IPInfo {
  ip: string
  country: string
  region: string
  city: string
  org: string
  isp: string
  timezone: string
  lat: number
  lon: number
  timezone_gmt: string
}
function IPLookup() {
  const { data, loading, error, reload } = useFetch<IPInfo>(
    () => safeFetchJSON('https://ipapi.co/json/'),
    []
  )
  const [customIp, setCustomIp] = useState('')
  const [customData, setCustomData] = useState<IPInfo | null>(null)
  const [customLoading, setCustomLoading] = useState(false)

  const queryCustom = async () => {
    const ip = customIp.trim()
    if (!ip) return
    setCustomLoading(true)
    try {
      const res = await safeFetchJSON<IPInfo>(`https://ipapi.co/${encodeURIComponent(ip)}/json/`)
      setCustomData(res)
    } catch { setCustomData(null) }
    finally { setCustomLoading(false) }
  }

  return (
    <div style={styles.panel}>
      <PanelHeader title="IP 归属地查询" subtitle="ipapi.co · 实时查询" accent="#3b82f6" onReload={reload} loading={loading} />
      {error && <ErrorBox msg={error} />}
      {data && <IPCard info={data} self />}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>查询其他 IP</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={customIp} onChange={(e) => setCustomIp(e.target.value)} placeholder="输入 IP 或域名（如 8.8.8.8）" style={styles.input} />
          <button onClick={queryCustom} disabled={customLoading} style={{ ...styles.primaryBtn, minWidth: 90 }}>
            {customLoading ? '查询中...' : '查询'}
          </button>
        </div>
        {customData && <IPCard info={customData} />}
      </div>
      {data && (
        <div style={styles.mapLink}>
          <a href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}#map=12/${data.lat}/${data.lon}`} target="_blank" rel="noreferrer" style={styles.link}>
            在 OpenStreetMap 查看位置 →
          </a>
        </div>
      )}
    </div>
  )
}
function IPCard({ info, self }: { info: IPInfo; self?: boolean }) {
  const rows: [string, string][] = [
    [self ? '当前 IP' : 'IP', info.ip],
    ['国家', `${info.country}`],
    ['地区', `${info.region}`],
    ['城市', `${info.city}`],
    ['ISP', info.isp],
    ['组织', info.org],
    ['时区', `${info.timezone} (${info.timezone_gmt})`],
    ['坐标', `${info.lat.toFixed(3)}, ${info.lon.toFixed(3)}`],
  ]
  return (
    <div style={styles.card}>
      {self && <div style={{ ...styles.badge, background: '#3b82f6' }}>当前设备</div>}
      {rows.map(([k, v]) => (
        <div key={k} style={styles.row}>
          <span style={styles.rowLabel}>{k}</span>
          <span style={styles.rowValue}>{v}</span>
        </div>
      ))}
    </div>
  )
}

// ========== 2. 每日箴言 ==========
interface Quote { id: number; content: string; author: string }
function QuoteGenerator() {
  const { data, loading, reload } = useFetch<Quote>(
    () => safeFetchJSON('https://api.adviceslip.com/advice').then((r: any) => ({
      id: r.slip.id, content: r.slip.advice, author: '佚名'
    })),
    []
  )
  const [fav, setFav] = useState<Quote[]>(() => {
    try { return JSON.parse(localStorage.getItem('us-fav-quotes') || '[]') } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('us-fav-quotes', JSON.stringify(fav)) }, [fav])

  return (
    <div style={styles.panel}>
      <PanelHeader title="每日箴言" subtitle="Advice Slip API · 建议与箴言" accent="#8b5cf6" onReload={reload} loading={loading} />
      {data && (
        <div style={{ ...styles.quoteCard, borderColor: '#8b5cf6' }}>
          <QuoteIcon size={28} />
          <p style={styles.quoteText}>"{data.content}"</p>
          <div style={styles.quoteAuth}>— {data.author}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={styles.secondaryBtn} onClick={() => navigator.clipboard?.writeText(data.content)}>
              <CopyIcon size={14} /> 复制
            </button>
            <button style={{ ...styles.secondaryBtn, background: '#8b5cf6' }} onClick={() => setFav((f) => [...f, data])}>
              ⭐ 收藏
            </button>
          </div>
        </div>
      )}
      {fav.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>我的收藏 ({fav.length})</div>
          <div style={styles.favList}>
            {fav.map((q, i) => (
              <div key={i} style={styles.favItem}>"{q.content}"</div>
            ))}
          </div>
          <button style={styles.dangerBtn} onClick={() => setFav([])}>清空收藏</button>
        </div>
      )}
    </div>
  )
}

// ========== 3. LoremFlickr 图片灵感 ==========
function LoremFlickr() {
  const [tags, setTags] = useState('mountain,nature')
  const [count, setCount] = useState(6)
  const [seed, setSeed] = useState(0)

  const images = Array.from({ length: count }, (_, i) => {
    return `https://loremflickr.com/480/320/${encodeURIComponent(tags)}?lock=${i + seed * 100}`
  })

  return (
    <div style={styles.panel}>
      <PanelHeader title="图片灵感" subtitle="LoremFlickr · 免费图片随机" accent="#ec4899" onReload={() => setSeed((s) => s + 1)} loading={false} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>标签：</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} style={{ ...styles.input, maxWidth: 260 }} placeholder="逗号分隔，如: cat,office,city" />
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>数量：</span>
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} style={styles.select}>
          {[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>点击图片下载</span>
      </div>
      <div style={styles.imageGrid}>
        {images.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noreferrer" style={styles.imageCard}>
            <img src={url} alt="" style={styles.img} loading="lazy" />
            <div style={styles.imageOverlay}><DownloadIcon size={14} /></div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ========== 4. Beer 推荐（Punk API） ==========
interface Beer { id: number; name: string; tagline: string; description: string; abv: number; ibu: number; image_url: string; food_pairing: string[] }
function BeerExplorer() {
  const [nonce, setNonce] = useState(0)
  const { data, loading, error } = useFetch<Beer[]>(
    () => safeFetchJSON(`https://api.punkapi.com/v2/beers/random`),
    [nonce]
  )
  const reload = () => setNonce((n) => n + 1)
  return (
    <div style={styles.panel}>
      <PanelHeader title="今日啤酒推荐" subtitle="Punk API · 真实啤酒数据" accent="#f59e0b" onReload={reload} loading={loading} />
      {error && <ErrorBox msg={error} />}
      <div style={styles.beerGrid}>
        {data?.map((b) => (
          <div key={b.id} style={styles.beerCard}>
            {b.image_url && <img src={b.image_url} alt={b.name} style={styles.beerImg} />}
            <div style={styles.beerInfo}>
              <div style={styles.beerName}>{b.name}</div>
              <div style={styles.beerTag}>{b.tagline}</div>
              <div style={styles.beerStats}>
                <span>🍺 {b.abv}%</span>
                <span>🌡 IBU {b.ibu}</span>
              </div>
              <p style={styles.beerDesc}>{b.description.slice(0, 180)}{b.description.length > 180 ? '...' : ''}</p>
              <div style={styles.pairing}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>推荐搭配：</span>
                {b.food_pairing.slice(0, 2).map((fp, i) => <span key={i} style={styles.pairTag}>{fp}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========== 5. Chuck Norris 冷知识 ==========
function JokeGenerator() {
  const { data, loading, reload } = useFetch<any>(
    () => safeFetchJSON('https://api.chucknorris.io/jokes/random'),
    []
  )
  return (
    <div style={styles.panel}>
      <PanelHeader title="冷知识笑话" subtitle="ChuckNorris.io · 无限随机" accent="#10b981" onReload={reload} loading={loading} />
      {data && (
        <div style={{ ...styles.jokeCard, borderColor: '#10b981' }}>
          <CoffeeIcon size={32} />
          <p style={styles.jokeText}>{data.value}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={styles.secondaryBtn} onClick={() => navigator.clipboard?.writeText(data.value)}>
              <CopyIcon size={14} /> 复制
            </button>
            <button style={{ ...styles.secondaryBtn, background: '#10b981' }} onClick={reload}>
              <RefreshCwIcon size={14} /> 再来一个
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 16 }}>
            🔗 <a href={data.url} target="_blank" rel="noreferrer" style={styles.link}>查看原始笑话</a>
          </div>
        </div>
      )}
    </div>
  )
}

// ========== 辅助组件 ==========
function PanelHeader({ title, subtitle, accent, onReload, loading }: { title: string; subtitle: string; accent: string; onReload: () => void; loading: boolean }) {
  return (
    <div style={styles.panelHeader}>
      <div>
        <div style={{ ...styles.panelTitle, color: accent }}>{title}</div>
        <div style={styles.panelSub}>{subtitle}</div>
      </div>
      <button onClick={onReload} disabled={loading} style={{ ...styles.refreshBtn, borderColor: accent, color: accent }}>
        <RefreshCwIcon size={14} /> {loading ? '加载中...' : '换一批'}
      </button>
    </div>
  )
}
function ErrorBox({ msg }: { msg: string }) {
  return <div style={styles.errorBox}>⚠️ {msg}</div>
}

// ========== 样式 ==========
const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', height: '100%',
    display: 'flex',
    background: 'linear-gradient(135deg, #0b0b1a 0%, #151530 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  sidebar: {
    width: 220,
    padding: 18,
    background: 'rgba(15, 15, 30, 0.8)',
    borderRight: '1px solid rgba(148,163,184,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 8, color: '#fff' },
  logoText: { fontSize: 16, fontWeight: 700 },
  logoSub: { fontSize: 10, color: '#64748b', marginTop: 2, marginBottom: 22 },
  tabList: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  tabBtn: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.1)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    background: 'transparent',
  },
  sidebarFooter: { paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.1)' },
  main: { flex: 1, padding: 22, overflow: 'auto' },
  panel: { maxWidth: 1000 },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  panelTitle: { fontSize: 20, fontWeight: 700 },
  panelSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  input: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.7)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
  },
  select: {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.7)',
    color: '#e2e8f0',
    fontSize: 13,
  },
  primaryBtn: {
    padding: '9px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 12px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'rgba(30,41,59,0.8)',
    color: '#e2e8f0',
    fontSize: 12,
    cursor: 'pointer',
  },
  dangerBtn: {
    marginTop: 12,
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #ef4444',
    background: 'transparent',
    color: '#ef4444',
    fontSize: 11,
    cursor: 'pointer',
  },
  errorBox: { padding: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, fontSize: 12, color: '#fca5a5' },
  card: {
    background: 'rgba(20, 20, 40, 0.55)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#fff', margin: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(148,163,184,0.06)' },
  rowLabel: { fontSize: 12, color: '#94a3b8' },
  rowValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500, textAlign: 'right' },
  mapLink: { marginTop: 14, textAlign: 'right' },
  link: { color: '#60a5fa', textDecoration: 'none', fontSize: 12 },
  quoteCard: {
    padding: 32,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(30,41,59,0.4) 100%)',
    border: '2px solid',
  },
  quoteText: { fontSize: 20, lineHeight: 1.6, margin: '18px 0', color: '#f1f5f9' },
  quoteAuth: { fontSize: 14, color: '#94a3b8' },
  favList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' },
  favItem: { padding: '10px 12px', background: 'rgba(30,41,59,0.6)', borderRadius: 8, fontSize: 13, color: '#cbd5e1', borderLeft: '3px solid #8b5cf6' },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  imageCard: { position: 'relative', borderRadius: 12, overflow: 'hidden', display: 'block', aspectRatio: '3/2', background: 'rgba(30,41,59,0.5)' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' },
  imageOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', color: '#fff', pointerEvents: 'none' },
  beerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  beerCard: {
    display: 'flex', gap: 12,
    padding: 16,
    background: 'rgba(20, 20, 40, 0.55)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 14,
  },
  beerImg: { width: 64, height: 'auto', objectFit: 'contain' },
  beerInfo: { flex: 1 },
  beerName: { fontSize: 15, fontWeight: 700, color: '#f1f5f9' },
  beerTag: { fontSize: 11, color: '#f59e0b', marginBottom: 4 },
  beerStats: { display: 'flex', gap: 14, fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  beerDesc: { fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 },
  pairing: { display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  pairTag: { fontSize: 10, padding: '3px 8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderRadius: 10 },
  jokeCard: {
    padding: 32,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(30,41,59,0.4) 100%)',
    border: '2px solid',
  },
  jokeText: { fontSize: 18, lineHeight: 1.6, margin: '18px 0', color: '#f1f5f9' },
}

export default UtilityStack
