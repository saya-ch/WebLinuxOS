import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'

// ---------- 类型 ----------
interface PresetCategory {
  name: string
  icon: string
  color: string
  items: PresetItem[]
}

interface PresetItem {
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  description: string
  params?: { key: string; label: string; default: string; placeholder?: string }[]
}

interface HistoryItem {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  status: number
  duration: number
  size: number
  timestamp: number
}

interface ResponseState {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  parsed: unknown
  duration: number
  size: number
  isJson: boolean
}

// ---------- 预设 API ----------
const CITIES: { name: string; lat: string; lon: string }[] = [
  { name: '北京', lat: '39.9042', lon: '116.4074' },
  { name: '上海', lat: '31.2304', lon: '121.4737' },
  { name: '深圳', lat: '22.5431', lon: '114.0579' },
  { name: '广州', lat: '23.1291', lon: '113.2644' },
  { name: '成都', lat: '30.5728', lon: '104.0668' },
  { name: '东京', lat: '35.6762', lon: '139.6503' },
  { name: '纽约', lat: '40.7128', lon: '-74.0060' },
  { name: '伦敦', lat: '51.5074', lon: '-0.1278' },
  { name: '巴黎', lat: '48.8566', lon: '2.3522' },
  { name: '悉尼', lat: '-33.8688', lon: '151.2093' },
]

const COUNTRIES = [
  { code: 'CN', name: '中国' },
  { code: 'US', name: '美国' },
  { code: 'JP', name: '日本' },
  { code: 'GB', name: '英国' },
  { code: 'DE', name: '德国' },
  { code: 'FR', name: '法国' },
  { code: 'KR', name: '韩国' },
  { code: 'IN', name: '印度' },
]

const METHODS = ['GET', 'POST', 'PUT', 'DELETE']

const PRESETS: PresetCategory[] = [
  {
    name: '天气',
    icon: '🌤',
    color: '#5dade2',
    items: [
      {
        name: 'Open-Meteo 天气',
        method: 'GET',
        url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m&timezone=Asia%2FShanghai&forecast_days=1',
        headers: {},
        body: '',
        description: '获取指定城市当前与小时天气',
        params: [{ key: 'city', label: '城市', default: '北京', placeholder: '选择城市' }],
      },
    ],
  },
  {
    name: '新闻',
    icon: '📰',
    color: '#f39c12',
    items: [
      {
        name: 'Hacker News 热门',
        method: 'GET',
        url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10',
        headers: {},
        body: '',
        description: 'Hacker News 首页热门文章',
      },
    ],
  },
  {
    name: '太空',
    icon: '🚀',
    color: '#9b59b6',
    items: [
      {
        name: 'Spaceflight News',
        method: 'GET',
        url: 'https://api.spaceflightnewsapi.net/v4/articles/?limit=10',
        headers: {},
        body: '',
        description: '太空飞行新闻最新',
      },
    ],
  },
  {
    name: 'GitHub',
    icon: '🐙',
    color: '#e74c3c',
    items: [
      {
        name: 'GitHub 用户信息',
        method: 'GET',
        url: 'https://api.github.com/users/octocat',
        headers: {},
        body: '',
        description: '获取 GitHub 用户公开资料',
        params: [{ key: 'username', label: '用户名', default: 'octocat', placeholder: '如 octocat' }],
      },
      {
        name: 'GitHub 仓库搜索',
        method: 'GET',
        url: 'https://api.github.com/search/repositories?q=react&sort=stars&order=desc&per_page=10',
        headers: {},
        body: '',
        description: '按关键字搜索 GitHub 仓库',
        params: [{ key: 'q', label: '关键字', default: 'react', placeholder: '如 react' }],
      },
    ],
  },
  {
    name: '加密货币',
    icon: '₿',
    color: '#f1c40f',
    items: [
      {
        name: 'CoinGecko 币价',
        method: 'GET',
        url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple,cardano&order=market_cap_desc&per_page=10&page=1&sparkline=false',
        headers: {},
        body: '',
        description: '主流加密货币价格 (USD)',
      },
    ],
  },
  {
    name: 'IP 工具',
    icon: '🌐',
    color: '#16a085',
    items: [
      {
        name: 'ipapi.co 查询 IP',
        method: 'GET',
        url: 'https://ipapi.co/json/',
        headers: {},
        body: '',
        description: '查询当前 IP 及地理位置',
      },
    ],
  },
  {
    name: '数学/工具',
    icon: '🧮',
    color: '#8e44ad',
    items: [
      {
        name: '随机数 API',
        method: 'GET',
        url: 'https://www.random.org/integers/?num=10&min=1&max=100&col=1&base=10&format=plain&rnd=new',
        headers: {},
        body: '',
        description: '生成 10 个 1-100 随机数 (纯文本)',
      },
      {
        name: '公共假日',
        method: 'GET',
        url: 'https://date.nager.at/api/v3/PublicHolidays/2025/CN',
        headers: {},
        body: '',
        description: '指定国家/年份的公共假日',
        params: [
          { key: 'year', label: '年份', default: '2025', placeholder: '如 2025' },
          { key: 'country', label: '国家代码', default: 'CN', placeholder: '如 CN / US' },
        ],
      },
    ],
  },
  {
    name: '自定义',
    icon: '🛠',
    color: '#34495e',
    items: [
      {
        name: '自定义请求',
        method: 'GET',
        url: 'https://api.github.com/users/octocat',
        headers: {},
        body: '',
        description: '手动输入任意 URL 与方法',
      },
    ],
  },
]

// ---------- 工具函数 ----------
const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

const safeJsonParse = (s: string): { parsed: unknown; isJson: boolean } => {
  const t = s.trim()
  if (!t) return { parsed: null, isJson: false }
  if (t[0] !== '{' && t[0] !== '[') return { parsed: null, isJson: false }
  try {
    return { parsed: JSON.parse(t), isJson: true }
  } catch {
    return { parsed: null, isJson: false }
  }
}

const statusColor = (status: number): string => {
  if (status === 0) return '#e74c3c'
  if (status < 200) return '#9b59b6'
  if (status < 300) return '#27ae60'
  if (status < 400) return '#3498db'
  if (status < 500) return '#f39c12'
  return '#e74c3c'
}

// ---------- 通用样式 ----------
const STYLES = {
  container: {
    width: '100%',
    height: '100%',
    background: 'rgba(14, 14, 24, 0.95)',
    color: '#e8e8f0',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as React.CSSProperties,
  panel: {
    background: 'rgba(22, 22, 38, 0.75)',
    border: '1px solid rgba(139, 124, 240, 0.15)',
    borderRadius: '10px',
    overflow: 'hidden',
  } as React.CSSProperties,
  input: {
    background: 'rgba(10, 10, 20, 0.6)',
    border: '1px solid rgba(139, 124, 240, 0.25)',
    borderRadius: '6px',
    color: '#e8e8f0',
    padding: '8px 10px',
    fontSize: '12.5px',
    outline: 'none',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  inputFocus: {
    borderColor: 'rgba(139, 124, 240, 0.6)',
  },
  button: {
    background: 'linear-gradient(135deg, #8b7cf0 0%, #5d4ed8 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.15s',
    boxShadow: '0 2px 8px rgba(139, 124, 240, 0.25)',
  } as React.CSSProperties,
  buttonGhost: {
    background: 'rgba(139, 124, 240, 0.1)',
    color: '#c9c4ff',
    border: '1px solid rgba(139, 124, 240, 0.3)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  } as React.CSSProperties,
  code: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '12px',
    lineHeight: 1.5,
  } as React.CSSProperties,
  scroll: {
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgba(139,124,240,0.3) transparent',
  },
}

// ---------- JSON Tree 组件 ----------
interface JsonNodeProps {
  data: unknown
  name?: string
  depth: number
  isLast: boolean
  expandedMap: Record<string, boolean>
  toggle: (k: string) => void
  path: string
}

function JsonNode({ data, name, depth, expandedMap, toggle, path }: JsonNodeProps) {
  const isExpandable = data !== null && typeof data === 'object'
  const entries: [string, unknown][] | null = isExpandable
    ? Array.isArray(data)
      ? (data as unknown[]).map((v, i) => [`${i}`, v] as [string, unknown])
      : Object.entries(data as Record<string, unknown>)
    : null
  const isExpanded = expandedMap[path] !== false // 默认展开
  const indent = { paddingLeft: `${depth * 16}px` }

  const valueColor = (v: unknown): string => {
    if (v === null) return '#9ca3af'
    const t = typeof v
    if (t === 'number') return '#5dade2'
    if (t === 'boolean') return '#f39c12'
    if (t === 'string') return '#7ed957'
    return '#e8e8f0'
  }

  const renderPrimitive = (v: unknown) => {
    const col = valueColor(v)
    if (typeof v === 'string') {
      return <span style={{ color: col }}>"{v.length > 300 ? v.slice(0, 300) + '…' : v}"</span>
    }
    if (v === null) return <span style={{ color: col }}>null</span>
    return <span style={{ color: col }}>{String(v)}</span>
  }

  return (
    <div style={{ ...STYLES.code }}>
      <div
        style={{
          ...indent,
          padding: '2px 0',
          cursor: isExpandable ? 'pointer' : 'default',
          borderRadius: '3px',
          userSelect: 'none',
        }}
        onClick={() => isExpandable && toggle(path)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,124,240,0.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {isExpandable && (
          <span style={{ color: '#8b7cf0', marginRight: '4px', display: 'inline-block', width: '10px' }}>
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
        {!isExpandable && <span style={{ display: 'inline-block', width: '10px' }} />}
        {name !== undefined && (
          <>
            <span style={{ color: '#e67e9b' }}>"{name}"</span>
            <span style={{ color: '#9ca3af' }}>: </span>
          </>
        )}
        {isExpandable ? (
          <>
            <span style={{ color: '#9ca3af' }}>{Array.isArray(data) ? '[' : '{'}</span>
            {isExpanded ? null : (
              <span style={{ color: '#6b7280', marginLeft: '4px' }}>
                {entries && entries.length > 0
                  ? `${entries.length} ${Array.isArray(data) ? 'items' : 'keys'}`
                  : 'empty'}
              </span>
            )}
          </>
        ) : (
          renderPrimitive(data)
        )}
      </div>
      {isExpandable && isExpanded && entries && (
        <>
          {entries.map(([k, v], i) => (
            <JsonNode
              key={`${path}-${k}-${i}`}
              data={v}
              name={k}
              depth={depth + 1}
              isLast={i === entries.length - 1}
              expandedMap={expandedMap}
              toggle={toggle}
              path={`${path}.${k}`}
            />
          ))}
          <div style={{ ...indent, color: '#9ca3af', padding: '2px 0' }}>
            <span style={{ paddingLeft: `${16}px` }}>{Array.isArray(data) ? ']' : '}'}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- 可视化组件：柱状图 & 折线图 ----------
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) {
    return <EmptyViz text="无可用于柱状图的数据" />
  }
  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const range = max - min || 1
  const W = 100
  const H = 100
  const barW = Math.max(4, Math.min(20, (W - 10) / data.length - 2))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '260px' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7cf0" />
          <stop offset="100%" stopColor="#5d4ed8" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = ((d.value - min) / range) * (H - 20)
        const x = 5 + i * (barW + 2)
        const y = H - 5 - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill="url(#barGrad)" rx="1" opacity="0.9">
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={y - 1}
              fontSize="3"
              fill="#c9c4ff"
              textAnchor="middle"
            >
              {d.value > 999 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed?.(0) ?? d.value}
            </text>
          </g>
        )
      })}
      <line x1="0" y1={H - 5} x2={W} y2={H - 5} stroke="rgba(139,124,240,0.2)" strokeWidth="0.3" />
    </svg>
  )
}

function LineChart({ points, label }: { points: { x: string; y: number }[]; label?: string }) {
  if (!points.length) {
    return <EmptyViz text="无可用于折线图的数据" />
  }
  const W = 100
  const H = 100
  const max = Math.max(...points.map(p => p.y))
  const min = Math.min(...points.map(p => p.y))
  const range = max - min || 1
  const stepX = points.length > 1 ? (W - 10) / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    x: 5 + i * stepX,
    y: H - 10 - ((p.y - min) / range) * (H - 20),
    label: p.x,
    raw: p.y,
  }))
  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${H - 5} L ${coords[0].x} ${H - 5} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '260px' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7cf0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8b7cf0" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} stroke="#8b7cf0" strokeWidth="0.6" fill="none" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="0.8" fill="#c9c4ff">
          <title>{`${c.label}: ${c.raw}`}</title>
        </circle>
      ))}
      <text x="5" y="6" fontSize="3" fill="#c9c4ff">
        {label ?? '数值'}: {max.toFixed(1)} ~ {min.toFixed(1)}
      </text>
      <line x1="0" y1={H - 5} x2={W} y2={H - 5} stroke="rgba(139,124,240,0.2)" strokeWidth="0.3" />
    </svg>
  )
}

function EmptyViz({ text }: { text: string }) {
  return (
    <div
      style={{
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '12px',
        border: '1px dashed rgba(139,124,240,0.2)',
        borderRadius: '8px',
        background: 'rgba(10,10,20,0.4)',
      }}
    >
      {text}
    </div>
  )
}

// ---------- 尝试从响应中提取可视化数据 ----------
interface VizData {
  kind: 'bar' | 'line' | 'none'
  bars?: { label: string; value: number }[]
  line?: { points: { x: string; y: number }[]; label?: string }
  title?: string
}

function extractViz(data: unknown, url: string): VizData {
  if (data === null || data === undefined) return { kind: 'none' }

  // 天气：open-meteo 的 hourly.temperature_2m
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    if (obj.hourly && typeof obj.hourly === 'object') {
      const h = obj.hourly as Record<string, unknown>
      const temps = h.temperature_2m as unknown[]
      const times = h.time as unknown[]
      if (Array.isArray(temps) && temps.every(t => typeof t === 'number')) {
        const pts = (times && Array.isArray(times)
          ? times.map((t, i) => ({
              x: String(t).slice(11, 16),
              y: Number(temps[i] ?? 0),
            }))
          : temps.map((t, i) => ({ x: String(i), y: Number(t) }))
        ).slice(0, 48)
        return { kind: 'line', line: { points: pts, label: '温度 °C' }, title: '小时温度' }
      }
    }

    // CoinGecko 市场数组：name -> current_price
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0] as Record<string, unknown> | undefined
      if (first && first.name && typeof first.current_price === 'number') {
        const bars = data.slice(0, 12).map(d => {
          const dd = d as Record<string, unknown>
          return { label: String(dd.name ?? '?'), value: Number(dd.current_price ?? 0) }
        })
        return { kind: 'bar', bars, title: '当前价格 (USD)' }
      }
      // GitHub search: items 数组 → stars
      if (first && first.stargazers_count !== undefined) {
        const bars = data.slice(0, 12).map(d => {
          const dd = d as Record<string, unknown>
          return { label: String(dd.name ?? '?'), value: Number(dd.stargazers_count ?? 0) }
        })
        return { kind: 'bar', bars, title: 'Star 数' }
      }
    }

    // GitHub 用户：followers/following/public_repos 等
    if (typeof obj.followers === 'number' && obj.login) {
      const bars = [
        { label: 'followers', value: Number(obj.followers) },
        { label: 'following', value: Number(obj.following) },
        { label: 'public_repos', value: Number(obj.public_repos) },
        { label: 'public_gists', value: Number(obj.public_gists) },
      ]
      return { kind: 'bar', bars, title: `${obj.login} 数据` }
    }

    // HN algolia
    const hits = (data as any).hits
    if (Array.isArray(hits) && hits.length > 0 && hits[0].points !== undefined) {
      const bars = hits.slice(0, 10).map((h: any) => ({
        label: (h.title as string).slice(0, 12),
        value: Number(h.points ?? 0),
      }))
      return { kind: 'bar', bars, title: 'Hacker News 文章得分' }
    }

    // spaceflight news articles → 每篇 summary length?
    const articles = (data as any).results ?? (data as any).articles
    if (Array.isArray(articles) && articles.length > 0 && articles[0].title) {
      const bars = articles.slice(0, 8).map((a: any, i: number) => ({
        label: `#${i + 1}`,
        value: (a.summary ?? a.title ?? '').length,
      }))
      return { kind: 'bar', bars, title: '文章长度' }
    }

    // 公共假日：月份统计
    if (Array.isArray(data) && data.length > 0 && (data[0] as any).date) {
      const count: Record<string, number> = {}
      data.forEach((d: any) => {
        const m = String(d.date).slice(5, 7)
        count[m] = (count[m] ?? 0) + 1
      })
      const bars = Object.entries(count)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ label: `${k}月`, value: v }))
      return { kind: 'bar', bars, title: '每月假日数' }
    }

    // 通用：找第一个数字数组
    if (Array.isArray(data) && data.length > 0 && data.every(x => typeof x === 'number')) {
      const bars = data.slice(0, 30).map((n, i) => ({ label: String(i + 1), value: Number(n) }))
      return { kind: 'bar', bars, title: '数值分布' }
    }
  }

  // URL 模式回退
  if (url.includes('random.org')) {
    return { kind: 'none' }
  }

  return { kind: 'none' }
}

// ---------- 主组件 ----------
const APILab = memo(function APILab() {
  // 请求状态
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState(PRESETS[0].items[0].url)
  const [headersText, setHeadersText] = useState('{}')
  const [bodyText, setBodyText] = useState('')
  const [focusField, setFocusField] = useState<string | null>(null)

  // 响应状态
  const [response, setResponse] = useState<ResponseState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responseTab, setResponseTab] = useState<'json' | 'raw' | 'headers' | 'stats' | 'viz'>('viz')

  // 历史记录
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const s = localStorage.getItem('weblinux-apilab-history')
      return s ? JSON.parse(s) : []
    } catch {
      return []
    }
  })

  // UI 状态
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {}
    PRESETS.forEach(c => (o[c.name] = true))
    return o
  })
  const [jsonExpandMap, setJsonExpandMap] = useState<Record<string, boolean>>({})

  // 参数输入（用于 preset 动态参数）
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-apilab-history', JSON.stringify(history.slice(0, 20)))
    } catch {
      // ignore
    }
  }, [history])

  // 选择预设
  const selectPreset = useCallback((item: PresetItem) => {
    setMethod(item.method)
    setUrl(item.url)
    setHeadersText(JSON.stringify(item.headers || {}, null, 2))
    setBodyText(item.body || '')
    setError(null)
    setResponse(null)
    if (item.params && item.params.length) {
      const pv: Record<string, string> = {}
      item.params.forEach(p => (pv[p.key] = p.default))
      setParamValues(pv)
    } else {
      setParamValues({})
    }
  }, [])

  // 应用 city/year 等参数到 URL（简单替换方式）
  const applyParamToUrl = useCallback(
    (presetItem: PresetItem, vals: Record<string, string>) => {
      let u = presetItem.url
      if (presetItem.name === 'Open-Meteo 天气') {
        const c = CITIES.find(cc => cc.name === vals.city) ?? CITIES[0]
        u = u.replace(/latitude=[\d.\-]+/, `latitude=${c.lat}`).replace(
          /longitude=[\d.\-]+/,
          `longitude=${c.lon}`,
        )
      }
      if (presetItem.name === 'GitHub 用户信息') {
        const name = (vals.username || 'octocat').trim()
        u = u.replace(/\/users\/[^/?]+/, `/users/${encodeURIComponent(name)}`)
      }
      if (presetItem.name === 'GitHub 仓库搜索') {
        const q = (vals.q || 'react').trim()
        u = u.replace(/q=[^&]+/, `q=${encodeURIComponent(q)}`)
      }
      if (presetItem.name === '公共假日') {
        const y = (vals.year || '2025').trim()
        const c = (vals.country || 'CN').trim().toUpperCase()
        u = `https://date.nager.at/api/v3/PublicHolidays/${encodeURIComponent(y)}/${encodeURIComponent(c)}`
      }
      setUrl(u)
    },
    [],
  )

  const selectedPreset = useMemo(() => {
    for (const cat of PRESETS) {
      for (const it of cat.items) {
        if (it.url === url && it.name !== '自定义请求') return it
      }
    }
    return null
  }, [url])

  const activeParams = selectedPreset?.params ?? []

  // 发送请求
  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入有效的 URL')
      return
    }
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    let parsedHeaders: Record<string, string> = {}
    try {
      const obj = JSON.parse(headersText || '{}')
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        parsedHeaders = Object.fromEntries(
          Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
        ) as Record<string, string>
      }
    } catch {
      setError('Headers 必须是合法的 JSON 对象')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    const startTime = performance.now()

    try {
      const opts: RequestInit = {
        method,
        headers: parsedHeaders,
      }
      if (method !== 'GET' && method !== 'HEAD' && bodyText.trim()) {
        opts.body = bodyText
      }

      const res = await fetch(finalUrl, opts)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      const respHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => (respHeaders[k] = v))

      let bodyStr = ''
      try {
        bodyStr = await res.text()
      } catch {
        bodyStr = ''
      }

      const size = new Blob([bodyStr]).size
      const { parsed, isJson } = safeJsonParse(bodyStr)

      const respState: ResponseState = {
        status: res.status,
        statusText: res.statusText,
        headers: respHeaders,
        body: bodyStr,
        parsed,
        duration,
        size,
        isJson,
      }
      setResponse(respState)

      // history
      const h: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        method,
        url: finalUrl,
        headers: parsedHeaders,
        body: bodyText,
        status: res.status,
        duration,
        size,
        timestamp: Date.now(),
      }
      setHistory(prev => [h, ...prev].slice(0, 20))

      // 默认可视化 tab (如果 JSON 成功)
      if (isJson) setResponseTab('viz')
      else setResponseTab('raw')
    } catch (err) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      const msg = err instanceof Error ? err.message : String(err)
      let friendly = `请求失败 (${duration} ms)：${msg}`
      if (/Failed to fetch|NetworkError|fetch failed/i.test(msg)) {
        friendly = `⚠ 网络错误 / CORS 受限 (${duration} ms)\n\n浏览器无法连接该 API。常见原因：\n1. 跨域限制 (CORS)：目标服务器未允许 WebLinuxOS 访问\n2. 网络不可用或域名解析失败\n3. 目标 API 要求 HTTPS，但使用了 HTTP\n\n提示：可尝试使用支持 CORS 的公开 API，或在服务端代理请求。`
      }
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }, [method, url, headersText, bodyText])

  // 格式化 headers JSON
  const formatHeaders = () => {
    try {
      const obj = JSON.parse(headersText || '{}')
      setHeadersText(JSON.stringify(obj, null, 2))
    } catch {
      // ignore
    }
  }
  const formatBody = () => {
    try {
      const obj = JSON.parse(bodyText || '{}')
      setBodyText(JSON.stringify(obj, null, 2))
    } catch {
      // ignore
    }
  }

  const toggleJsonPath = (p: string) =>
    setJsonExpandMap(prev => ({ ...prev, [p]: prev[p] === false ? true : false }))

  const replayHistory = (h: HistoryItem) => {
    setMethod(h.method)
    setUrl(h.url)
    setHeadersText(JSON.stringify(h.headers || {}, null, 2))
    setBodyText(h.body || '')
    setError(null)
    setResponse(null)
  }

  const clearHistory = () => setHistory([])

  const vizData = useMemo(
    () => (response && response.isJson ? extractViz(response.parsed, url) : { kind: 'none' as const }),
    [response, url],
  )

  // 响应头排序
  const sortedHeaders = useMemo(() => {
    if (!response) return []
    return Object.entries(response.headers).sort((a, b) => a[0].localeCompare(b[0]))
  }, [response])

  const requestBoxRef = useRef<HTMLDivElement>(null)

  return (
    <div style={STYLES.container}>
      {/* 顶部标题栏 */}
      <div
        style={{
          padding: '10px 16px',
          background:
            'linear-gradient(90deg, rgba(139,124,240,0.15), rgba(93,78,216,0.05))',
          borderBottom: '1px solid rgba(139,124,240,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b7cf0, #5d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(139,124,240,0.3)',
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.3px' }}>
              APILab <span style={{ color: '#8b7cf0', fontWeight: 500 }}>· 公开 API 实验室</span>
            </div>
            <div style={{ fontSize: '11px', color: '#8b8ba3' }}>
              快速测试免费公开 API · 可视化结果 · 历史记录
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(s => !s)}
          style={{
            ...STYLES.buttonGhost,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          🕓 <span>历史 ({history.length})</span>
        </button>
      </div>

      {/* 主体三栏布局 */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, gap: '10px', padding: '10px' }}>
        {/* 左栏：预设 */}
        <div style={{ width: '240px', ...STYLES.panel, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div
            style={{
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#c9c4ff',
              letterSpacing: '1px',
              borderBottom: '1px solid rgba(139,124,240,0.15)',
              background: 'rgba(139,124,240,0.06)',
            }}
          >
            API 分类
          </div>
          <div style={{ flex: 1, ...STYLES.scroll }}>
            {PRESETS.map(cat => (
              <div key={cat.name} style={{ borderBottom: '1px solid rgba(139,124,240,0.08)' }}>
                <div
                  onClick={() =>
                    setExpandedCategories(prev => ({ ...prev, [cat.name]: !prev[cat.name] }))
                  }
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#d4d4e0',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                  <span style={{ flex: 1 }}>{cat.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>
                    {expandedCategories[cat.name] ? '▾' : '▸'}
                  </span>
                </div>
                {expandedCategories[cat.name] && (
                  <div style={{ paddingBottom: '4px' }}>
                    {cat.items.map(it => {
                      const selected = url === it.url
                      return (
                        <div
                          key={it.name}
                          onClick={() => selectPreset(it)}
                          style={{
                            padding: '6px 12px 6px 34px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: selected ? '#fff' : '#b8b8c8',
                            background: selected
                              ? 'linear-gradient(90deg, rgba(139,124,240,0.25), transparent)'
                              : 'transparent',
                            borderLeft: selected ? `2px solid ${cat.color}` : '2px solid transparent',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.background = 'rgba(139,124,240,0.08)'
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) e.currentTarget.style.background = 'transparent'
                          }}
                          title={it.description}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                color: cat.color,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                background: `${cat.color}22`,
                                letterSpacing: '0.5px',
                              }}
                            >
                              {it.method}
                            </span>
                            <span style={{ flex: 1 }}>{it.name}</span>
                          </div>
                          <div
                            style={{
                              fontSize: '10.5px',
                              color: '#6b7280',
                              marginTop: '3px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {it.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 中间+右：请求 + 响应 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: '10px' }}>
          {/* 请求参数区 */}
          <div ref={requestBoxRef} style={{ ...STYLES.panel, flexShrink: 0 }}>
            <div
              style={{
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(139,124,240,0.15)',
                background: 'rgba(139,124,240,0.06)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#c9c4ff', letterSpacing: '1px' }}>
                请求
              </span>
              {response && (
                <span
                  style={{
                    fontSize: '11px',
                    color: statusColor(response.status),
                    fontWeight: 600,
                  }}
                >
                  {response.status} {response.statusText} · {response.duration} ms ·{' '}
                  {formatBytes(response.size)}
                </span>
              )}
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 方法 + URL */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  style={{
                    ...STYLES.input,
                    width: '90px',
                    fontWeight: 700,
                    color: method === 'GET' ? '#27ae60' : method === 'POST' ? '#f39c12' : '#e74c3c',
                    cursor: 'pointer',
                  }}
                >
                  {METHODS.map(m => (
                    <option key={m} value={m} style={{ background: '#1a1a2e', color: '#fff' }}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onFocus={() => setFocusField('url')}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={e => e.key === 'Enter' && sendRequest()}
                  placeholder="https://api.example.com/endpoint"
                  style={{
                    ...STYLES.input,
                    flex: 1,
                    ...(focusField === 'url' ? STYLES.inputFocus : {}),
                  }}
                />
                <button
                  onClick={sendRequest}
                  disabled={loading}
                  style={{
                    ...STYLES.button,
                    minWidth: '100px',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading ? '⏳ 请求中…' : '🚀 发送请求'}
                </button>
              </div>

              {/* 参数区（动态） */}
              {activeParams.length > 0 && (
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(139,124,240,0.06)',
                    border: '1px solid rgba(139,124,240,0.15)',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                  }}
                >
                  {activeParams.map(p => {
                    const isCity = p.key === 'city'
                    const isCountry = p.key === 'country'
                    const currentVal = paramValues[p.key] ?? p.default
                    return (
                      <div key={p.key} style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ fontSize: '11px', color: '#8b8ba3', marginBottom: '4px' }}>
                          {p.label}
                        </div>
                        {isCity ? (
                          <select
                            value={currentVal}
                            onChange={e => {
                              const nv = { ...paramValues, [p.key]: e.target.value }
                              setParamValues(nv)
                              if (selectedPreset) applyParamToUrl(selectedPreset, nv)
                            }}
                            style={{ ...STYLES.input, width: '100%', cursor: 'pointer' }}
                          >
                            {CITIES.map(c => (
                              <option key={c.name} value={c.name} style={{ background: '#1a1a2e', color: '#fff' }}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : isCountry ? (
                          <select
                            value={currentVal}
                            onChange={e => {
                              const nv = { ...paramValues, [p.key]: e.target.value }
                              setParamValues(nv)
                              if (selectedPreset) applyParamToUrl(selectedPreset, nv)
                            }}
                            style={{ ...STYLES.input, width: '100%', cursor: 'pointer' }}
                          >
                            {COUNTRIES.map(c => (
                              <option key={c.code} value={c.code} style={{ background: '#1a1a2e', color: '#fff' }}>
                                {c.name} ({c.code})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={currentVal}
                            placeholder={p.placeholder}
                            onChange={e => {
                              const nv = { ...paramValues, [p.key]: e.target.value }
                              setParamValues(nv)
                              if (selectedPreset) applyParamToUrl(selectedPreset, nv)
                            }}
                            style={{ ...STYLES.input, width: '100%' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Headers & Body */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#8b8ba3', fontWeight: 600 }}>
                      Headers (JSON)
                    </span>
                    <button
                      onClick={formatHeaders}
                      style={{
                        ...STYLES.buttonGhost,
                        padding: '2px 8px',
                        fontSize: '10.5px',
                      }}
                    >
                      格式化
                    </button>
                  </div>
                  <textarea
                    value={headersText}
                    onChange={e => setHeadersText(e.target.value)}
                    onFocus={() => setFocusField('headers')}
                    onBlur={() => setFocusField(null)}
                    placeholder='{"Content-Type": "application/json"}'
                    spellCheck={false}
                    style={{
                      ...STYLES.input,
                      ...STYLES.code,
                      minHeight: '80px',
                      resize: 'vertical',
                      ...(focusField === 'headers' ? STYLES.inputFocus : {}),
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#8b8ba3', fontWeight: 600 }}>
                      Body (JSON / 文本)
                    </span>
                    <button
                      onClick={formatBody}
                      style={{
                        ...STYLES.buttonGhost,
                        padding: '2px 8px',
                        fontSize: '10.5px',
                      }}
                    >
                      格式化 JSON
                    </button>
                  </div>
                  <textarea
                    value={bodyText}
                    onChange={e => setBodyText(e.target.value)}
                    onFocus={() => setFocusField('body')}
                    onBlur={() => setFocusField(null)}
                    placeholder="GET 请求可留空；POST/PUT 可放 JSON body"
                    spellCheck={false}
                    style={{
                      ...STYLES.input,
                      ...STYLES.code,
                      minHeight: '80px',
                      resize: 'vertical',
                      ...(focusField === 'body' ? STYLES.inputFocus : {}),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 响应展示区 */}
          <div style={{ ...STYLES.panel, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(139,124,240,0.15)',
                background: 'rgba(10,10,20,0.4)',
                flexShrink: 0,
              }}
            >
              {(
                [
                  { k: 'viz', label: '📊 可视化' },
                  { k: 'json', label: '🧬 JSON 视图' },
                  { k: 'raw', label: '📄 原始文本' },
                  { k: 'headers', label: '📋 Headers' },
                  { k: 'stats', label: '⚡ 统计' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.k}
                  onClick={() => setResponseTab(tab.k)}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom:
                      responseTab === tab.k ? '2px solid #8b7cf0' : '2px solid transparent',
                    color: responseTab === tab.k ? '#fff' : '#8b8ba3',
                    fontSize: '12px',
                    fontWeight: responseTab === tab.k ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'hidden', ...STYLES.scroll }}>
              {/* 错误 */}
              {error && !response && (
                <div
                  style={{
                    margin: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    color: '#ffb3ab',
                    fontSize: '12.5px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {error}
                </div>
              )}

              {/* 加载中 */}
              {loading && (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: '#8b7cf0',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '3px solid rgba(139,124,240,0.2)',
                      borderTopColor: '#8b7cf0',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <div style={{ fontSize: '12px' }}>请求发送中…</div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg);} }`}</style>
                </div>
              )}

              {/* 初始状态 */}
              {!loading && !response && !error && (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: '#6b7280',
                  }}
                >
                  <div style={{ fontSize: '42px' }}>👋</div>
                  <div style={{ fontSize: '13px' }}>
                    从左侧选择一个 API，或直接输入 URL，然后点击 <b style={{ color: '#c9c4ff' }}>发送请求</b>
                  </div>
                  <div style={{ fontSize: '11px', color: '#5b5b6e' }}>
                    提示：某些 API 可能受 CORS 限制，浏览器无法直接访问。
                  </div>
                </div>
              )}

              {/* 可视化 */}
              {response && responseTab === 'viz' && (
                <div style={{ padding: '14px' }}>
                  {vizData.kind === 'bar' && vizData.bars && (
                    <>
                      <VizHeader title={vizData.title ?? '柱状图'} hint="使用响应中的数值字段" />
                      <BarChart data={vizData.bars} />
                      <VizTable data={vizData.bars} />
                    </>
                  )}
                  {vizData.kind === 'line' && vizData.line && (
                    <>
                      <VizHeader title={vizData.title ?? '折线图'} hint="使用响应中的时序数据" />
                      <LineChart points={vizData.line.points} label={vizData.line.label} />
                      <VizLineSummary points={vizData.line.points} />
                    </>
                  )}
                  {vizData.kind === 'none' && (
                    <div style={{ padding: '20px 0' }}>
                      <EmptyViz text="未能从响应中自动提取可可视化的数据。可切换到 JSON 视图查看完整内容。" />
                    </div>
                  )}
                </div>
              )}

              {/* JSON 视图 */}
              {response && responseTab === 'json' && (
                <div style={{ padding: '10px 14px' }}>
                  {response.isJson ? (
                    <>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#8b8ba3',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          {typeof response.parsed === 'object' && response.parsed !== null
                            ? Array.isArray(response.parsed)
                              ? `Array · ${response.parsed.length} items`
                              : `Object · ${Object.keys(response.parsed as object).length} keys`
                            : 'JSON'}
                        </span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(
                                JSON.stringify(response.parsed, null, 2),
                              )
                            }
                          }}
                          style={{ ...STYLES.buttonGhost, padding: '3px 10px', fontSize: '10.5px' }}
                        >
                          📋 复制 JSON
                        </button>
                      </div>
                      <div
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          background: 'rgba(5,5,12,0.5)',
                          border: '1px solid rgba(139,124,240,0.1)',
                          ...STYLES.code,
                        }}
                      >
                        <JsonNode
                          data={response.parsed}
                          depth={0}
                          isLast
                          expandedMap={jsonExpandMap}
                          toggle={toggleJsonPath}
                          path="root"
                        />
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: '14px',
                        background: 'rgba(243,156,18,0.08)',
                        border: '1px solid rgba(243,156,18,0.3)',
                        borderRadius: '8px',
                        color: '#ffd59e',
                        fontSize: '12px',
                      }}
                    >
                      ⚠ 响应不是合法 JSON。请切换到"原始文本"查看内容。
                    </div>
                  )}
                </div>
              )}

              {/* 原始文本 */}
              {response && responseTab === 'raw' && (
                <div style={{ padding: '12px 14px' }}>
                  <pre
                    style={{
                      margin: 0,
                      padding: '10px',
                      background: 'rgba(5,5,12,0.5)',
                      border: '1px solid rgba(139,124,240,0.1)',
                      borderRadius: '6px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#d4d4e0',
                      maxHeight: '100%',
                      ...STYLES.code,
                    }}
                  >
                    {response.body || '(空响应)'}
                  </pre>
                </div>
              )}

              {/* Headers */}
              {response && responseTab === 'headers' && (
                <div style={{ padding: '12px 14px' }}>
                  <KVList
                    entries={sortedHeaders}
                    emptyText="(无响应头)"
                    styleOverrides={{
                      container: { background: 'rgba(5,5,12,0.5)' },
                    }}
                  />
                </div>
              )}

              {/* 统计 */}
              {response && responseTab === 'stats' && (
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <StatCard label="状态码" value={`${response.status} ${response.statusText}`} color={statusColor(response.status)} />
                    <StatCard label="请求耗时" value={`${response.duration} ms`} color="#5dade2" />
                    <StatCard label="响应大小" value={formatBytes(response.size)} color="#f39c12" />
                    <StatCard label="内容类型" value={response.headers['content-type']?.split(';')[0] ?? '-'} color="#9b59b6" />
                    <StatCard label="请求方法" value={method} color="#27ae60" />
                    <StatCard label="JSON 格式" value={response.isJson ? '✓ 是' : '✗ 否'} color={response.isJson ? '#27ae60' : '#e74c3c'} />
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#8b8ba3', marginBottom: '6px' }}>请求 URL</div>
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(5,5,12,0.5)',
                        borderRadius: '6px',
                        border: '1px solid rgba(139,124,240,0.1)',
                        wordBreak: 'break-all',
                        ...STYLES.code,
                        fontSize: '11.5px',
                        color: '#c9c4ff',
                      }}
                    >
                      {url}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录抽屉 */}
      {showHistory && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5,5,12,0.7)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
          onClick={() => setShowHistory(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(460px, 90%)',
              height: '100%',
              background: 'rgba(14,14,24,0.98)',
              borderLeft: '1px solid rgba(139,124,240,0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(139,124,240,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '14px' }}>请求历史 (最近 20 条)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {history.length > 0 && (
                  <button onClick={clearHistory} style={{ ...STYLES.buttonGhost, fontSize: '11px' }}>
                    清空
                  </button>
                )}
                <button onClick={() => setShowHistory(false)} style={{ ...STYLES.buttonGhost, fontSize: '11px' }}>
                  关闭
                </button>
              </div>
            </div>
            <div style={{ flex: 1, ...STYLES.scroll }}>
              {history.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                  暂无历史记录
                </div>
              ) : (
                history.map(h => (
                  <div
                    key={h.id}
                    onClick={() => {
                      replayHistory(h)
                      setShowHistory(false)
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(139,124,240,0.1)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,124,240,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: h.method === 'GET' ? '#27ae60' : '#f39c12',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background:
                            h.method === 'GET' ? 'rgba(39,174,96,0.15)' : 'rgba(243,156,18,0.15)',
                        }}
                      >
                        {h.method}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: statusColor(h.status),
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: `${statusColor(h.status)}22`,
                        }}
                      >
                        {h.status}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '10.5px', color: '#8b8ba3' }}>
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#d4d4e0',
                        fontFamily: "'JetBrains Mono', monospace",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.url}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginTop: '3px' }}>
                      {h.duration} ms · {formatBytes(h.size)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// ---------- 小组件 ----------
function VizHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</div>
      {hint && <div style={{ fontSize: '11px', color: '#8b8ba3' }}>{hint}</div>}
    </div>
  )
}

function VizTable({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div
      style={{
        marginTop: '12px',
        background: 'rgba(5,5,12,0.5)',
        border: '1px solid rgba(139,124,240,0.1)',
        borderRadius: '8px',
        padding: '8px',
      }}
    >
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px' }}>
            <div
              style={{
                width: '110px',
                fontSize: '11.5px',
                color: '#c9c4ff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                ...STYLES.code,
              }}
            >
              {d.label}
            </div>
            <div style={{ flex: 1, height: '10px', background: 'rgba(139,124,240,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(pct, 2)}%`,
                  background: 'linear-gradient(90deg, #8b7cf0, #5d4ed8)',
                }}
              />
            </div>
            <div style={{ width: '80px', textAlign: 'right', fontSize: '11.5px', color: '#d4d4e0', ...STYLES.code }}>
              {typeof d.value === 'number' && d.value >= 1000
                ? d.value.toLocaleString()
                : typeof d.value === 'number'
                  ? d.value.toFixed(2)
                  : String(d.value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VizLineSummary({ points }: { points: { x: string; y: number }[] }) {
  if (!points.length) return null
  const values = points.map(p => p.y)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return (
    <div
      style={{
        marginTop: '12px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      <StatCard label="样本数" value={String(values.length)} color="#8b7cf0" />
      <StatCard label="最大" value={max.toFixed(1)} color="#27ae60" />
      <StatCard label="最小" value={min.toFixed(1)} color="#e74c3c" />
      <StatCard label="平均" value={avg.toFixed(1)} color="#5dade2" />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: '12px',
        background: 'rgba(5,5,12,0.5)',
        border: `1px solid ${color}33`,
        borderRadius: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: '10.5px', color: '#8b8ba3', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        style={{
          marginTop: '4px',
          fontSize: '15px',
          fontWeight: 700,
          color,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function KVList({
  entries,
  emptyText,
  styleOverrides,
}: {
  entries: [string, string][]
  emptyText?: string
  styleOverrides?: { container?: React.CSSProperties }
}) {
  if (!entries.length) {
    return <div style={{ color: '#6b7280', fontSize: '12px', padding: '12px' }}>{emptyText ?? '无数据'}</div>
  }
  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid rgba(139,124,240,0.1)',
        overflow: 'hidden',
        ...styleOverrides?.container,
      }}
    >
      {entries.map(([k, v], i) => (
        <div
          key={k + i}
          style={{
            display: 'flex',
            gap: '10px',
            padding: '8px 10px',
            borderBottom: i < entries.length - 1 ? '1px solid rgba(139,124,240,0.08)' : 'none',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              flex: '0 0 200px',
              color: '#e67e9b',
              ...STYLES.code,
              fontSize: '11.5px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {k}
          </div>
          <div style={{ flex: 1, color: '#c9c4ff', wordBreak: 'break-all', ...STYLES.code, fontSize: '11.5px' }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  )
}

export default APILab
