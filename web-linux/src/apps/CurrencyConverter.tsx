import { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  ArrowRightLeft,
  Star,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search,
  Clock,
  BarChart3,
  Zap,
  Heart,
  AlertCircle,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface CurrencyInfo {
  code: string
  name: string
  flag: string
}

interface RateHistory {
  date: string
  rate: number
}

interface RateComparison {
  code: string
  name: string
  flag: string
  rate: number
  change: number
}

// ==================== 常量 ====================
const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
  { code: 'AUD', name: '澳元', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞郎', flag: '🇨🇭' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
  { code: 'HKD', name: '港币', flag: '🇭🇰' },
  { code: 'TWD', name: '新台币', flag: '🇹🇼' },
  { code: 'THB', name: '泰铢', flag: '🇹🇭' },
  { code: 'INR', name: '印度卢比', flag: '🇮🇳' },
  { code: 'NZD', name: '新西兰元', flag: '🇳🇿' },
  { code: 'MXN', name: '墨西哥比索', flag: '🇲🇽' },
  { code: 'SEK', name: '瑞典克朗', flag: '🇸🇪' },
  { code: 'NOK', name: '挪威克朗', flag: '🇳🇴' },
  { code: 'DKK', name: '丹麦克朗', flag: '🇩🇰' },
  { code: 'PLN', name: '波兰兹罗提', flag: '🇵🇱' },
  { code: 'ZAR', name: '南非兰特', flag: '🇿🇦' },
  { code: 'BRL', name: '巴西雷亚尔', flag: '🇧🇷' },
  { code: 'RUB', name: '俄罗斯卢布', flag: '🇷🇺' },
  { code: 'MYR', name: '马来西亚林吉特', flag: '🇲🇾' },
  { code: 'PHP', name: '菲律宾比索', flag: '🇵🇭' },
  { code: 'IDR', name: '印尼盾', flag: '🇮🇩' },
  { code: 'VND', name: '越南盾', flag: '🇻🇳' },
  { code: 'TRY', name: '土耳其里拉', flag: '🇹🇷' },
  { code: 'AED', name: '阿联酋迪拉姆', flag: '🇦🇪' },
  { code: 'SAR', name: '沙特里亚尔', flag: '🇸🇦' },
  { code: 'HUF', name: '匈牙利福林', flag: '🇭🇺' },
  { code: 'CZK', name: '捷克克朗', flag: '🇨🇿' },
]

const STORAGE_KEY_FAVS = 'weblinux-currency-favorites'
const REFRESH_INTERVAL = 5 * 60 * 1000 // 5分钟
const API_BASE = 'https://api.frankfurter.app'

// ==================== 样式对象 ====================
const styles = {
  container: {
    height: '100%',
    overflowY: 'auto',
    padding: 16,
    background: '#0d1117',
    color: '#c9d1d9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 13,
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    marginBottom: 16,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
    border: '1px solid #21262d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #1f6feb, #58a6ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  } as React.CSSProperties,
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#f0f6fc',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    fontSize: 11,
    color: '#8b949e',
    marginTop: 2,
  } as React.CSSProperties,
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 20,
    background: 'rgba(35, 134, 54, 0.15)',
    border: '1px solid rgba(46, 160, 67, 0.3)',
    fontSize: 11,
    color: '#3fb950',
  } as React.CSSProperties,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#3fb950',
  } as React.CSSProperties,
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    background: '#161b22',
    border: '1px solid #21262d',
  } as React.CSSProperties,
  inputGroup: {
    display: 'flex',
    gap: 8,
  } as React.CSSProperties,
  select: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #30363d',
    background: '#0d1117',
    color: '#c9d1d9',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 28,
  } as React.CSSProperties,
  amountInput: {
    width: 160,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #30363d',
    background: '#0d1117',
    color: '#f0f6fc',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
    textAlign: 'right' as const,
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  swapBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 20,
    border: '1px solid #30363d',
    background: '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s',
    margin: '4px auto',
    width: 'fit-content',
  } as React.CSSProperties,
  resultValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#58a6ff',
    fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
    lineHeight: 1.2,
  } as React.CSSProperties,
  rateInfo: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  quickBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: '"SF Mono", Consolas, monospace',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  quickBtnActive: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #1f6feb',
    background: 'rgba(31, 111, 235, 0.15)',
    color: '#58a6ff',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: '"SF Mono", Consolas, monospace',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  favBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #30363d',
    background: 'transparent',
    color: '#8b949e',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    padding: 0,
  } as React.CSSProperties,
  favBtnActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #d29922',
    background: 'rgba(210, 153, 34, 0.15)',
    color: '#d29922',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    padding: 0,
  } as React.CSSProperties,
  searchBox: {
    padding: '8px 12px',
    paddingLeft: 34,
    borderRadius: 8,
    border: '1px solid #30363d',
    background: '#0d1117',
    color: '#c9d1d9',
    fontSize: 12,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  searchContainer: {
    position: 'relative' as const,
    marginBottom: 10,
  } as React.CSSProperties,
  searchIcon: {
    position: 'absolute' as const,
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#484f58',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 12,
  } as React.CSSProperties,
  th: {
    padding: '8px 10px',
    textAlign: 'left' as const,
    color: '#8b949e',
    fontWeight: 500,
    borderBottom: '1px solid #21262d',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #21262d',
    fontFamily: '"SF Mono", Consolas, monospace',
  } as React.CSSProperties,
  changePositive: {
    color: '#3fb950',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  } as React.CSSProperties,
  changeNegative: {
    color: '#f85149',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#8b949e',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  } as React.CSSProperties,
  tag: {
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.3px',
  } as React.CSSProperties,
  refreshBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s',
  } as React.CSSProperties,
}

// ==================== SVG 历史汇率图表 ====================
const HistoryChart = memo(function HistoryChart({
  data,
  color = '#58a6ff',
  label,
}: {
  data: RateHistory[]
  color?: string
  label: string
}) {
  const width = 600
  const height = 180
  const padTop = 24
  const padBottom = 32
  const padLeft = 50
  const padRight = 16

  if (data.length === 0) return null

  const values = data.map((d) => d.rate)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 0.001

  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  const points = values.map((v, i) => ({
    x: padLeft + (i / Math.max(1, values.length - 1)) * chartW,
    y: padTop + chartH - ((v - min) / range) * chartH,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = pathD + ` L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`

  // Y轴刻度（5条）
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = min + (range / 4) * i
    const y = padTop + chartH - (i / 4) * chartH
    return { v, y }
  })

  // X轴标签（首、中、尾）
  const xLabels = data.length > 2
    ? [
        { text: data[0].date, x: padLeft },
        { text: data[Math.floor(data.length / 2)].date, x: padLeft + chartW / 2 },
        { text: data[data.length - 1].date, x: padLeft + chartW },
      ]
    : data.map((d, i) => ({ text: d.date, x: padLeft + (i / Math.max(1, data.length - 1)) * chartW }))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 网格线 */}
      {yTicks.map((tick, i) => (
        <g key={`yt-${i}`}>
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={tick.y}
            y2={tick.y}
            stroke="#21262d"
            strokeWidth="1"
          />
          <text x={padLeft - 6} y={tick.y + 3} fill="#484f58" fontSize="9" textAnchor="end" fontFamily="monospace">
            {tick.v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* X轴标签 */}
      {xLabels.map((lbl, i) => (
        <text
          key={`xl-${i}`}
          x={lbl.x}
          y={height - 6}
          fill="#484f58"
          fontSize="9"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {lbl.text}
        </text>
      ))}

      {/* 填充区域 */}
      <path d={areaD} fill="url(#chartGrad)" />

      {/* 折线 */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* 数据点 */}
      {points.map((p, i) => (
        <circle
          key={`dp-${i}`}
          cx={p.x}
          cy={p.y}
          r={i === 0 || i === points.length - 1 ? 3.5 : 0}
          fill={color}
          stroke="#0d1117"
          strokeWidth="1.5"
        />
      ))}

      {/* 标签 */}
      <text x={padLeft} y={padTop - 8} fill={color} fontSize="10" fontWeight="600" fontFamily="monospace">
        {label} — 最低 {min.toFixed(4)} · 最高 {max.toFixed(4)}
      </text>
    </svg>
  )
})

// ==================== 货币选择下拉 ====================
const CurrencyDropdown = memo(function CurrencyDropdown({
  value,
  onChange,
  currencies,
  searchQuery,
  onSearchChange,
  label,
}: {
  value: string
  onChange: (code: string) => void
  currencies: CurrencyInfo[]
  searchQuery: string
  onSearchChange: (q: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const selected = currencies.find((c) => c.code === value)
  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...styles.select,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
        }}
      >
        <span style={{ fontSize: 18 }}>{selected?.flag}</span>
        <span style={{ fontWeight: 600, color: '#f0f6fc' }}>{value}</span>
        <span style={{ color: '#8b949e', fontSize: 11, flex: 1, textAlign: 'left' }}>{selected?.name}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 8,
            maxHeight: 260,
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={styles.searchContainer}>
            <div style={styles.searchIcon}>
              <Search size={14} />
            </div>
            <input
              ref={inputRef}
              style={{ ...styles.searchBox, marginTop: 8 }}
              placeholder="搜索货币..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                onChange(c.code)
                setOpen(false)
                onSearchChange('')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: c.code === value ? 'rgba(31, 111, 235, 0.1)' : 'transparent',
                color: c.code === value ? '#58a6ff' : '#c9d1d9',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (c.code !== value) e.currentTarget.style.background = '#21262d'
              }}
              onMouseLeave={(e) => {
                if (c.code !== value) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: 16 }}>{c.flag}</span>
              <span style={{ fontWeight: 600, width: 36 }}>{c.code}</span>
              <span style={{ color: '#8b949e', fontSize: 12 }}>{c.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: '#484f58', fontSize: 12 }}>未找到匹配的货币</div>
          )}
        </div>
      )}
    </div>
  )
})

// ==================== 主组件 ====================
export default memo(function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('CNY')
  const [toCurrency, setToCurrency] = useState('USD')
  const [amount, setAmount] = useState('100')
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [rateHistory, setRateHistory] = useState<RateHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVS)
      return raw ? JSON.parse(raw) : ['USD-CNY', 'EUR-CNY', 'CNY-JPY']
    } catch {
      return ['USD-CNY', 'EUR-CNY', 'CNY-JPY']
    }
  })

  const [comparisons, setComparisons] = useState<RateComparison[]>([])

  const [searchFrom, setSearchFrom] = useState('')
  const [searchTo, setSearchTo] = useState('')

  const [refreshing, setRefreshing] = useState(false)
  const [swapSpinning, setSwapSpinning] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ==================== 获取当前汇率 ====================
  const fetchRate = useCallback(async (from: string, to: string, silent = false) => {
    if (from === to) {
      setRate(1)
      setLastUpdated(new Date())
      return
    }
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/latest?from=${from}&to=${to}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const v = data.rates?.[to]
      if (typeof v !== 'number') throw new Error('汇率数据异常')
      setRate(v)
      setLastUpdated(new Date())
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : '获取汇率失败')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // ==================== 获取历史汇率 ====================
  const fetchHistory = useCallback(async (from: string, to: string) => {
    if (from === to) {
      const now = new Date()
      const history = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - (29 - i))
        return { date: `${d.getMonth() + 1}/${d.getDate()}`, rate: 1 }
      })
      setRateHistory(history)
      return
    }
    setHistoryLoading(true)
    try {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - 30)
      const fmt = (d: Date) => d.toISOString().slice(0, 10)
      const res = await fetch(`${API_BASE}/${fmt(start)}..${fmt(now)}?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('历史数据获取失败')
      const data = await res.json()
      const raw: Record<string, number> = data.rates ?? {}
      const history = Object.keys(raw)
        .sort()
        .map((date) => ({
          date: new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          rate: raw[date],
        }))
      setRateHistory(history)
    } catch {
      setRateHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // ==================== 获取对比汇率 ====================
  const fetchComparisons = useCallback(async (base: string) => {
    try {
      const targetCodes = CURRENCIES.filter((c) => c.code !== base)
        .slice(0, 12)
        .map((c) => c.code)
      const targets = targetCodes.join(',')
      const res = await fetch(`${API_BASE}/latest?from=${base}&to=${targets}`)
      if (!res.ok) return
      const data = await res.json()
      const rates: Record<string, number> = data.rates ?? {}
      const prevRes = await fetch(
        `${API_BASE}/${(() => {
          const d = new Date()
          d.setDate(d.getDate() - 1)
          return d.toISOString().slice(0, 10)
        })()}?from=${base}&to=${targets}`
      )
      let prevRates: Record<string, number> = {}
      if (prevRes.ok) {
        const prevData = await prevRes.json()
        prevRates = prevData.rates ?? {}
      }
      const result: RateComparison[] = targetCodes
        .map((code) => {
          const info = CURRENCIES.find((c) => c.code === code)
          const current = rates[code]
          const prev = prevRates[code]
          if (current === undefined || !info) return null
          return {
            code,
            name: info.name,
            flag: info.flag,
            rate: current,
            change: prev ? ((current - prev) / prev) * 100 : 0,
          }
        })
        .filter(Boolean) as RateComparison[]
      result.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      setComparisons(result)
    } catch {
      // 静默
    }
  }, [])

  // ==================== 初始化 & 自动刷新 ====================
  useEffect(() => {
    fetchRate(fromCurrency, toCurrency)
    fetchHistory(fromCurrency, toCurrency)
    fetchComparisons(fromCurrency)
  }, [fromCurrency, toCurrency, fetchRate, fetchHistory, fetchComparisons])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchRate(fromCurrency, toCurrency, true)
      fetchComparisons(fromCurrency)
    }, REFRESH_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fromCurrency, toCurrency, fetchRate, fetchComparisons])

  // ==================== 操作函数 ====================
  const swap = useCallback(() => {
    setSwapSpinning(true)
    setTimeout(() => setSwapSpinning(false), 400)
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }, [fromCurrency, toCurrency])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchRate(fromCurrency, toCurrency)
    fetchHistory(fromCurrency, toCurrency)
    fetchComparisons(fromCurrency)
    setTimeout(() => setRefreshing(false), 600)
  }, [fromCurrency, toCurrency, fetchRate, fetchHistory, fetchComparisons])

  const toggleFavorite = useCallback(() => {
    const key = `${fromCurrency}-${toCurrency}`
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(next))
      return next
    })
  }, [fromCurrency, toCurrency])

  const isFavorite = favorites.includes(`${fromCurrency}-${toCurrency}`)

  // 计算结果
  const result = parseFloat(amount)
  const converted = isFinite(result) && rate !== null ? result * rate : null

  // 最近收藏
  const recentFavorites = favorites.slice(-6)

  // ==================== 渲染 ====================
  return (
    <div style={styles.container}>
      {/* ===== 顶部标题栏 ===== */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <div style={styles.headerIcon}>💱</div>
          <div>
            <div style={styles.title}>汇率转换器</div>
            <div style={styles.subtitle}>
              {lastUpdated
                ? `最后更新 ${lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
                : '加载中...'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            style={styles.refreshBtn}
            onClick={handleRefresh}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#58a6ff')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#30363d')}
          >
            <RefreshCw size={13} style={{ transition: 'transform 0.4s', transform: refreshing ? 'rotate(360deg)' : 'none' }} />
            刷新
          </button>
          <div style={styles.statusBadge}>
            <div style={styles.statusDot} />
            实时
          </div>
        </div>
      </div>

      {/* ===== 错误提示 ===== */}
      {error && (
        <div
          style={{
            ...styles.card,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderColor: 'rgba(248, 81, 73, 0.4)',
            background: 'rgba(248, 81, 73, 0.08)',
            color: '#f85149',
          }}
        >
          <AlertCircle size={14} />
          <span style={{ fontSize: 12 }}>{error}</span>
        </div>
      )}

      {/* ===== 转换输入区 ===== */}
      <div style={styles.card}>
        <div style={styles.grid2}>
          <CurrencyDropdown
            value={fromCurrency}
            onChange={setFromCurrency}
            currencies={CURRENCIES}
            searchQuery={searchFrom}
            onSearchChange={setSearchFrom}
            label="源货币"
          />
          <CurrencyDropdown
            value={toCurrency}
            onChange={setToCurrency}
            currencies={CURRENCIES}
            searchQuery={searchTo}
            onSearchChange={setSearchTo}
            label="目标货币"
          />
        </div>

        {/* 金额输入 */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              金额
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                ...styles.amountInput,
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1f6feb')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#30363d')}
            />
          </div>
          <button
            style={{
              ...styles.swapBtn,
              marginTop: 16,
              transform: swapSpinning ? 'rotate(180deg)' : 'none',
              transition: 'all 0.3s',
            }}
            onClick={swap}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#30363d'
              e.currentTarget.style.borderColor = '#58a6ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#21262d'
              e.currentTarget.style.borderColor = '#30363d'
            }}
          >
            <ArrowRightLeft size={15} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              结果
            </div>
            <div
              style={{
                ...styles.amountInput,
                width: '100%',
                boxSizing: 'border-box',
                color: '#58a6ff',
                background: 'rgba(31, 111, 235, 0.06)',
                borderColor: 'rgba(31, 111, 235, 0.2)',
                minHeight: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {loading && !converted ? (
                <span style={{ fontSize: 13, color: '#484f58', fontFamily: 'inherit' }}>计算中...</span>
              ) : (
                <span>{converted !== null ? converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* 快速金额 */}
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[1, 10, 100, 1000, 10000, 100000].map((v) => (
            <button
              key={v}
              style={amount === String(v) ? styles.quickBtnActive : styles.quickBtn}
              onClick={() => setAmount(String(v))}
              onMouseEnter={(e) => {
                if (amount !== String(v)) e.currentTarget.style.borderColor = '#484f58'
              }}
              onMouseLeave={(e) => {
                if (amount !== String(v)) e.currentTarget.style.borderColor = '#30363d'
              }}
            >
              {v >= 1000 ? `${v / 1000}K` : v}
            </button>
          ))}
        </div>

        {/* 汇率详情 & 收藏按钮 */}
        <div style={{ ...styles.rateInfo, marginTop: 12, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {rate !== null && (
              <>
                <span style={{ color: '#c9d1d9' }}>
                  1 {fromCurrency} = <strong style={{ color: '#f0f6fc' }}>{rate.toFixed(4)}</strong> {toCurrency}
                </span>
                {rate > 0 && (
                  <span style={{ color: '#484f58' }}>|</span>
                )}
                {rate > 0 && (
                  <span style={{ color: '#c9d1d9' }}>
                    1 {toCurrency} = <strong style={{ color: '#f0f6fc' }}>{(1 / rate).toFixed(4)}</strong> {fromCurrency}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            style={isFavorite ? styles.favBtnActive : styles.favBtn}
            onClick={toggleFavorite}
            title={isFavorite ? '取消收藏' : '添加收藏'}
          >
            <Star size={14} fill={isFavorite ? '#d29922' : 'none'} />
          </button>
        </div>
      </div>

      {/* ===== 历史汇率走势图 ===== */}
      <div style={styles.card}>
        <div style={{ ...styles.sectionTitle, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={14} />
            近 30 天走势 — {fromCurrency} → {toCurrency}
          </div>
          {historyLoading && (
            <div style={{ fontSize: 11, color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> 加载中
            </div>
          )}
        </div>
        {rateHistory.length > 0 ? (
          <HistoryChart data={rateHistory} color="#58a6ff" label={`${fromCurrency}/${toCurrency}`} />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: 30,
              color: '#484f58',
              fontSize: 12,
            }}
          >
            {historyLoading ? '正在加载历史数据...' : '暂无历史数据'}
          </div>
        )}
      </div>

      {/* ===== 收藏货币对 ===== */}
      {recentFavorites.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <Heart size={14} />
            收藏的货币对
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recentFavorites.map((fav) => {
              const [f, t] = fav.split('-')
              const fi = CURRENCIES.find((c) => c.code === f)
              const ti = CURRENCIES.find((c) => c.code === t)
              return (
                <button
                  key={fav}
                  onClick={() => {
                    setFromCurrency(f)
                    setToCurrency(t)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: fromCurrency === f && toCurrency === t ? 'rgba(31, 111, 235, 0.1)' : '#0d1117',
                    color: fromCurrency === f && toCurrency === t ? '#58a6ff' : '#c9d1d9',
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#58a6ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#30363d')}
                >
                  <span>{fi?.flag}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{f}</span>
                  <ArrowRightLeft size={10} style={{ color: '#484f58' }} />
                  <span>{ti?.flag}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== 汇率对比表 ===== */}
      {comparisons.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <TrendingUp size={14} />
            基于 {fromCurrency} 的汇率对比
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>货币</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>汇率</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>日变化</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {comparisons.slice(0, 10).map((item) => (
                  <tr
                    key={item.code}
                    style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(31, 111, 235, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setToCurrency(item.code)}
                  >
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{item.flag}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f0f6fc', fontSize: 12 }}>{item.code}</div>
                          <div style={{ color: '#484f58', fontSize: 10, fontFamily: 'inherit' }}>{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#f0f6fc', fontWeight: 600 }}>
                      {item.rate.toFixed(4)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={item.change >= 0 ? styles.changePositive : styles.changeNegative}>
                        {item.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {item.change >= 0 ? '+' : ''}
                        {item.change.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', width: 30 }}>
                      <ArrowRightLeft size={12} style={{ color: '#484f58' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 底部信息 ===== */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px 0',
          color: '#484f58',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={11} />
          每 5 分钟自动刷新
        </div>
        <span>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          数据来源 Frankfurter API
        </div>
      </div>

      {/* ===== CSS 动画 ===== */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.5;
        }
        input:focus {
          border-color: #1f6feb !important;
          box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.15);
        }
        button:hover {
          opacity: 0.9;
        }
        table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
})
