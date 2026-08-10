import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  X,
  Plus,
  Database,
  Sparkles,
  BarChart3,
  Layers,
  Zap,
  Building2,
  Cpu,
  ShoppingCart,
  Landmark,
  Activity,
  Globe,
  StarOff,
  LineChart,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useStore } from '../store'

type DataSource = 'real' | 'mock'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  volume: number
  source: DataSource
  history?: { date: string; close: number }[]
}

interface WatchlistItem {
  symbol: string
  name: string
  sector: string
}

interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

const SECTOR_MAP: Record<string, string> = {
  AAPL: '科技', GOOGL: '科技', MSFT: '科技', NVDA: '科技', META: '科技',
  AVGO: '科技', ORCL: '科技', CRM: '科技', ADBE: '科技', INTC: '科技', AMD: '科技',
  AMZN: '消费', TSLA: '消费', HD: '消费', NKE: '消费', MCD: '消费',
  SBUX: '消费', TGT: '消费', LOW: '消费', PG: '消费', KO: '消费', PEP: '消费',
  JPM: '金融', V: '金融', BAC: '金融', GS: '金融', MS: '金融',
  WFC: '金融', C: '金融', BLK: '金融', SCHW: '金融',
  XOM: '能源', CVX: '能源', COP: '能源', SLB: '能源',
  JNJ: '医疗', PFE: '医疗', UNH: '医疗', LLY: '医疗', MRK: '医疗',
  BA: '工业', CAT: '工业', GE: '工业', HON: '工业', UPS: '工业',
  DIS: '通信', NFLX: '通信', T: '通信', VZ: '通信', CMCSA: '通信',
  WMT: '消费', COST: '消费',
}

const SECTOR_COLORS: Record<string, string> = {
  '科技': '#3b82f6',
  '金融': '#10b981',
  '消费': '#f59e0b',
  '能源': '#ef4444',
  '医疗': '#8b5cf6',
  '工业': '#6b7280',
  '通信': '#ec4899',
}

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  '科技': <Cpu size={14} />,
  '金融': <Landmark size={14} />,
  '消费': <ShoppingCart size={14} />,
  '能源': <Zap size={14} />,
  '医疗': <Activity size={14} />,
  '工业': <Building2 size={14} />,
  '通信': <Globe size={14} />,
}

const BASE_PRICES: Record<string, number> = {
  AAPL: 192.5, GOOGL: 141.8, MSFT: 378.9, AMZN: 178.25, TSLA: 248.5,
  NVDA: 875.3, META: 505.75, AVGO: 1320.0, ORCL: 142.5, CRM: 268.9,
  ADBE: 478.0, INTC: 45.8, AMD: 156.9, JPM: 195.4, V: 279.6,
  BAC: 38.5, GS: 458.0, MS: 95.2, WFC: 52.8, C: 62.4, BLK: 920.0,
  SCHW: 72.5, HD: 382.0, NKE: 95.8, MCD: 258.0, SBUX: 95.5,
  TGT: 178.0, LOW: 412.0, PG: 168.5, KO: 62.4, PEP: 168.0,
  XOM: 115.5, CVX: 155.0, COP: 128.5, SLB: 52.8,
  JNJ: 152.8, PFE: 28.5, UNH: 558.0, LLY: 780.0, MRK: 125.5,
  BA: 215.4, CAT: 342.0, GE: 158.5, HON: 212.0, UPS: 138.0,
  DIS: 112.3, NFLX: 628.9, T: 19.5, VZ: 42.8, CMCSA: 38.5,
  WMT: 165.8, COST: 712.0,
}

const POPULAR_STOCKS: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: '科技' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: '科技' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: '科技' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: '消费' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: '消费' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: '科技' },
  { symbol: 'META', name: 'Meta Platforms', sector: '科技' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: '金融' },
  { symbol: 'V', name: 'Visa Inc.', sector: '金融' },
  { symbol: 'BAC', name: 'Bank of America', sector: '金融' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: '金融' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: '消费' },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: '通信' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: '通信' },
  { symbol: 'BA', name: 'Boeing Co.', sector: '工业' },
  { symbol: 'INTC', name: 'Intel Corp.', sector: '科技' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: '科技' },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: '能源' },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: '能源' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: '医疗' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: '医疗' },
  { symbol: 'KO', name: 'Coca-Cola Co.', sector: '消费' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: '消费' },
  { symbol: 'T', name: 'AT&T Inc.', sector: '通信' },
  { symbol: 'SBUX', name: 'Starbucks Corp.', sector: '消费' },
  { symbol: 'NKE', name: 'Nike Inc.', sector: '消费' },
]

const CACHE_KEY = 'weblinux-stock-data-cache'
const CACHE_TTL = 5 * 60 * 1000
const FALLBACK_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM']

const MARKET_INDICES: MarketIndex[] = [
  { symbol: '^DJI', name: '道琼斯工业指数', value: 39872, change: 0, changePercent: 0 },
  { symbol: '^GSPC', name: '标普500指数', value: 5234, change: 0, changePercent: 0 },
  { symbol: '^IXIC', name: '纳斯达克综合指数', value: 16420, change: 0, changePercent: 0 },
  { symbol: '^RUT', name: '罗素2000指数', value: 2045, change: 0, changePercent: 0 },
]

const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      ...style,
    }}
  >
    {children}
  </div>
)

const SparklineMini: React.FC<{ data?: { date: string; close: number }[]; color: string; width?: number; height?: number }> = ({
  data, color, width = 60, height = 22,
}) => {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle cx={width / 2} cy={height / 2} r={2} fill={color} opacity={0.5} />
      </svg>
    )
  }
  const closes = data.map(d => d.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width
    const y = height - ((c - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const StockRow: React.FC<{
  item: WatchlistItem
  data?: StockData
  loading: boolean
  onRemove: (symbol: string) => void
}> = memo(({ item, data, loading, onRemove }) => {
  const isPositive = data ? data.change >= 0 : true
  const changeColor = isPositive ? '#22c55e' : '#ef4444'
  const sectorColor = SECTOR_COLORS[item.sector] || '#6b7280'

  return (
    <GlassCard style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{item.symbol}</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: sectorColor + '20',
              color: sectorColor,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {SECTOR_ICONS[item.sector] || <Layers size={10} />}
            {item.sector}
          </span>
          {data?.source === 'real' && (
            <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 600 }}>
              LIVE
            </span>
          )}
          {data?.source === 'mock' && (
            <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(107,114,128,0.15)', color: '#9ca3af', fontWeight: 600 }}>
              SIM
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <SparklineMini
          data={data?.history}
          color={changeColor}
          width={55}
          height={22}
        />
      </div>

      <div style={{ textAlign: 'right', minWidth: 80, flexShrink: 0 }}>
        {data ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
              ${data.price.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: changeColor, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
            </div>
          </>
        ) : loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <Loader2 size={12} className="animate-spin" />
            加载中
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>--</div>
        )}
      </div>

      <button
        onClick={() => onRemove(item.symbol)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'rgba(239,68,68,0.1)',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.25)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)' }}
      >
        <X size={14} />
      </button>
    </GlassCard>
  )
})

StockRow.displayName = 'StockRow'

const StockTracker = memo(function StockTracker() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-stock-watchlist')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: '科技' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: '科技' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', sector: '科技' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: '消费' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: '消费' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: '科技' },
      { symbol: 'META', name: 'Meta Platforms', sector: '科技' },
    ]
  })

  const [stockData, setStockData] = useState<Record<string, StockData>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WatchlistItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeSector, setActiveSector] = useState<string>('全部')
  const [showCustomAdd, setShowCustomAdd] = useState(false)
  const [customSymbol, setCustomSymbol] = useState('')
  const [dataSources, setDataSources] = useState<Record<string, DataSource>>({})
  const [fetchFailed, setFetchFailed] = useState(false)
  const timerRef = useRef<number | null>(null)
  const fetchDataRef = useRef<() => Promise<void>>(async () => {})
  const addNotification = useStore(s => s.addNotification)

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-stock-watchlist', JSON.stringify(watchlist))
    } catch { /* ignore */ }
  }, [watchlist])

  const getCachedData = useCallback((): { data: Record<string, StockData>; timestamp: number } | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || !parsed.data) return null
      return parsed
    } catch {
      return null
    }
  }, [])

  const setCache = useCallback((data: Record<string, StockData>) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch { /* ignore */ }
  }, [])

  const generateMockHistory = useCallback((basePrice: number, days: number = 30): { date: string; close: number }[] => {
    const history: { date: string; close: number }[] = []
    let price = basePrice * (0.92 + Math.random() * 0.06)
    const seed = Math.round(basePrice * 100) % 100000
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const rand = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1
      const change = (Math.abs(rand) - 0.5) * basePrice * 0.04
      price = Math.max(1, price + change)
      history.push({ date: date.toISOString().slice(0, 10), close: parseFloat(price.toFixed(2)) })
    }
    return history
  }, [])

  const generateMockData = useCallback((items: WatchlistItem[]): Record<string, StockData> => {
    const mock: Record<string, StockData> = {}
    for (const item of items) {
      const basePrice = BASE_PRICES[item.symbol] || 100 + Math.random() * 400
      const preChange = (Math.random() - 0.5) * basePrice * 0.04
      const prePrice = basePrice + preChange
      const change = (Math.random() - 0.5) * 8
      const price = prePrice + change
      const changePercent = (change / prePrice) * 100

      mock[item.symbol] = {
        symbol: item.symbol,
        name: item.name,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        high: parseFloat((price + Math.random() * 3).toFixed(2)),
        low: parseFloat((price - Math.random() * 3).toFixed(2)),
        open: parseFloat(prePrice.toFixed(2)),
        volume: Math.floor(Math.random() * 50000000 + 1000000),
        source: 'mock',
        history: generateMockHistory(basePrice),
      }
    }
    return mock
  }, [generateMockHistory])

  const fetchStockData = useCallback(async () => {
    setLoading(true)

    try {
      const cached = getCachedData()
      const now = Date.now()
      if (cached && now - cached.timestamp < CACHE_TTL) {
        setStockData(cached.data)
        setLastUpdated(new Date(cached.timestamp))
        const sources: Record<string, DataSource> = {}
        Object.keys(cached.data).forEach(k => { sources[k] = cached.data[k].source })
        setDataSources(sources)
        setLoading(false)
        setFetchFailed(false)
        if (timerRef.current !== null) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => fetchDataRef.current(), 30000)
        return
      }

      const results: Record<string, StockData> = {}
      const sources: Record<string, DataSource> = {}
      const symbolsToFetch = watchlist.length > 0
        ? watchlist
        : FALLBACK_SYMBOLS.map(s => ({
            symbol: s,
            name: POPULAR_STOCKS.find(p => p.symbol === s)?.name || s,
            sector: POPULAR_STOCKS.find(p => p.symbol === s)?.sector || '科技',
          }))

      let apiSucceeded = false

      for (const item of symbolsToFetch) {
        try {
          const apiSymbol = item.symbol.toLowerCase()
          const url = `https://stooq.com/q/d/l/?s=${apiSymbol}.us&i=d`
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)

          const response = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)

          if (!response.ok) throw new Error(`HTTP ${response.status}`)

          const text = await response.text()
          const lines = text.trim().split('\n')

          if (lines.length >= 2) {
            const dataLines = lines.slice(1)
            const history: { date: string; close: number }[] = []
            for (const line of dataLines) {
              const parts = line.split(',')
              if (parts.length >= 3) {
                const close = parseFloat(parts[2])
                if (!isNaN(close)) {
                  history.push({ date: parts[0], close })
                }
              }
            }

            if (history.length >= 2) {
              const last = history[history.length - 1]
              const prev = history[history.length - 2]
              const change = last.close - prev.close
              const changePercent = (change / prev.close) * 100

              results[item.symbol] = {
                symbol: item.symbol,
                name: item.name,
                price: last.close,
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(2)),
                high: Math.max(...history.slice(-20).map(h => h.close)),
                low: Math.min(...history.slice(-20).map(h => h.close)),
                open: prev.close,
                volume: 0,
                source: 'real',
                history: history.slice(-30),
              }
              sources[item.symbol] = 'real'
              apiSucceeded = true
              continue
            }
          }
          throw new Error('No valid data')
        } catch {
          const basePrice = BASE_PRICES[item.symbol] || 100 + Math.random() * 400
          const change = (Math.random() - 0.5) * 8
          const price = basePrice + change
          const changePercent = (change / basePrice) * 10

          results[item.symbol] = {
            symbol: item.symbol,
            name: item.name,
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            high: parseFloat((price + Math.random() * 3).toFixed(2)),
            low: parseFloat((price - Math.random() * 3).toFixed(2)),
            open: basePrice,
            volume: Math.floor(Math.random() * 50000000 + 1000000),
            source: 'mock',
            history: generateMockHistory(basePrice),
          }
          sources[item.symbol] = 'mock'
        }
      }

      if (!apiSucceeded && watchlist.length > 0) {
        setFetchFailed(true)
      } else {
        setFetchFailed(false)
      }

      setStockData(results)
      setDataSources(sources)
      setCache(results)
      setLastUpdated(new Date())

      if (timerRef.current !== null) clearTimeout(timerRef.current)
      const nextDelay = apiSucceeded ? 30000 : 120000
      timerRef.current = window.setTimeout(() => fetchDataRef.current(), nextDelay)
    } catch (err) {
      console.warn('Stock data fetch failed:', err)
      const mockData = generateMockData(watchlist.length > 0 ? watchlist : FALLBACK_SYMBOLS.map(s => ({ symbol: s, name: s, sector: '科技' })))
      setStockData(mockData)
      const sources: Record<string, DataSource> = {}
      Object.keys(mockData).forEach(k => { sources[k] = 'mock' })
      setDataSources(sources)
      setLastUpdated(new Date())
      setFetchFailed(true)
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => fetchDataRef.current(), 120000)
    } finally {
      setLoading(false)
    }
  }, [watchlist, getCachedData, setCache, generateMockData, generateMockHistory])

  useEffect(() => {
    fetchDataRef.current = fetchStockData
  }, [fetchStockData])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      fetchStockData()
    }, 100)
    return () => {
      clearTimeout(timerId)
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [fetchStockData])

  const searchStock = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const query = searchQuery.toLowerCase()
    const results = POPULAR_STOCKS.filter(
      s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    )
    setSearchResults(results.slice(0, 8))
  }, [searchQuery])

  const addToWatchlist = useCallback((item: WatchlistItem) => {
    if (!watchlist.find(w => w.symbol === item.symbol)) {
      setWatchlist(prev => [...prev, item])
      addNotification({
        title: '股票追踪',
        message: `${item.symbol} 已添加到关注列表`,
        type: 'success',
      })
    }
    setSearchQuery('')
    setSearchResults([])
  }, [watchlist, addNotification])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol))
    addNotification({
      title: '股票追踪',
      message: `${symbol} 已从关注列表移除`,
      type: 'info',
    })
  }, [addNotification])

  const addCustomSymbol = useCallback(() => {
    const symbol = customSymbol.trim().toUpperCase()
    if (!symbol) return
    if (watchlist.find(w => w.symbol === symbol)) {
      addNotification({ title: '提示', message: `${symbol} 已在关注列表中`, type: 'warning' })
      return
    }
    const sector = SECTOR_MAP[symbol] || '其他'
    const newItem: WatchlistItem = {
      symbol,
      name: POPULAR_STOCKS.find(s => s.symbol === symbol)?.name || symbol,
      sector,
    }
    setWatchlist(prev => [...prev, newItem])
    setCustomSymbol('')
    setShowCustomAdd(false)
    addNotification({
      title: '股票追踪',
      message: `${symbol} 已添加到关注列表`,
      type: 'success',
    })
  }, [customSymbol, watchlist, addNotification])

  const sectors = useMemo(() => {
    const s = new Set<string>()
    watchlist.forEach(w => s.add(w.sector))
    return ['全部', ...Array.from(s)]
  }, [watchlist])

  const filteredWatchlist = useMemo(() => {
    if (activeSector === '全部') return watchlist
    return watchlist.filter(w => w.sector === activeSector)
  }, [watchlist, activeSector])

  const stats = useMemo(() => {
    const values = Object.values(stockData)
    if (values.length === 0) return { gainers: 0, losers: 0, total: 0, avgChange: 0, best: null as StockData | null, worst: null as StockData | null }
    const gainers = values.filter(v => v.change >= 0).length
    const losers = values.filter(v => v.change < 0).length
    const avgChange = values.reduce((sum, v) => sum + v.changePercent, 0) / values.length
    const best = values.reduce((a, b) => (a.changePercent > b.changePercent ? a : b))
    const worst = values.reduce((a, b) => (a.changePercent < b.changePercent ? a : b))
    return { gainers, losers, total: values.length, avgChange, best, worst }
  }, [stockData])

  const realCount = useMemo(() => Object.values(dataSources).filter(d => d === 'real').length, [dataSources])
  const mockCount = useMemo(() => Object.values(dataSources).filter(d => d === 'mock').length, [dataSources])

  const fmtTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [])

  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    gap: 12,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const glassButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
    color: '#60a5fa',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>
            <LineChart size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>股票追踪</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {lastUpdated && (
                <>
                  <RefreshCw size={10} />
                  {fmtTime(lastUpdated)}
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowCustomAdd(true)}
            style={{ ...glassButtonStyle, background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            <Plus size={14} />
            添加
          </button>
          <button
            onClick={fetchStockData}
            disabled={loading}
            style={{
              ...glassButtonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      {/* Data Source Badge */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <div style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
        }}>
          <Database size={14} style={{ color: fetchFailed ? '#f59e0b' : '#22c55e' }} />
          <span style={{ color: 'var(--text-muted)' }}>
            数据源：
            <span style={{ color: fetchFailed ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
              {fetchFailed ? '模拟数据' : '实时数据 (Stooq)'}
            </span>
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 11 }}>
            实时: {realCount} | 模拟: {mockCount}
          </span>
        </div>
      </div>

      {/* Market Overview */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={14} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>市场概览</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {MARKET_INDICES.map(idx => {
            const isUp = idx.change >= 0
            return (
              <GlassCard key={idx.symbol} style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <BarChart3 size={12} style={{ color: isUp ? '#22c55e' : '#ef4444' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{idx.name}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {idx.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      {Object.keys(stockData).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flexShrink: 0 }}>
          <GlassCard style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>📈 上涨</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{stats.gainers}</div>
          </GlassCard>
          <GlassCard style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>📉 下跌</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{stats.losers}</div>
          </GlassCard>
          <GlassCard style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>平均涨跌</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: stats.avgChange >= 0 ? '#22c55e' : '#ef4444' }}>
              {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
            </div>
          </GlassCard>
          <GlassCard style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>总数</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.total}</div>
          </GlassCard>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="搜索股票代码或名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchStock() }}
          style={inputStyle}
        />
        <button
          onClick={searchStock}
          style={{ ...glassButtonStyle, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <Search size={14} />
          搜索
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <GlassCard style={{ padding: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={11} /> 搜索结果
          </div>
          {searchResults.map((result) => {
            const isAdded = !!watchlist.find(w => w.symbol === result.symbol)
            return (
              <div
                key={result.symbol}
                onClick={() => !isAdded && addToWatchlist(result)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: isAdded ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                  background: isAdded ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isAdded) (e.currentTarget as HTMLDivElement).style.background = 'rgba(59,130,246,0.1)'
                }}
                onMouseLeave={(e) => {
                  if (!isAdded) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{result.symbol}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.name}</span>
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3,
                    background: (SECTOR_COLORS[result.sector] || '#6b7280') + '20',
                    color: SECTOR_COLORS[result.sector] || '#6b7280',
                    fontWeight: 600,
                  }}>{result.sector}</span>
                </div>
                <span style={{ fontSize: 11, color: isAdded ? '#22c55e' : 'var(--text-muted)' }}>
                  {isAdded ? '已添加' : '+ 添加'}
                </span>
              </div>
            )
          })}
        </GlassCard>
      )}

      {/* Sector Filter */}
      {sectors.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, overflowX: 'auto', paddingBottom: 4 }}>
          {sectors.map(s => {
            const isActive = activeSector === s
            const sectorColor = SECTOR_COLORS[s] || '#6b7280'
            return (
              <button
                key={s}
                onClick={() => setActiveSector(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: isActive ? `1px solid ${sectorColor}80` : '1px solid rgba(255,255,255,0.1)',
                  background: isActive ? sectorColor + '25' : 'rgba(255,255,255,0.03)',
                  color: isActive ? sectorColor : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {s !== '全部' && SECTOR_ICONS[s]}
                {s}
                {s !== '全部' && (
                  <span style={{ fontSize: 10, opacity: 0.6 }}>
                    {watchlist.filter(w => w.sector === s).length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Stock List */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
            <div>加载中...</div>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <StarOff size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <div>关注列表为空</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>点击添加按钮开始追踪股票</div>
          </div>
        ) : (
          filteredWatchlist.map(item => (
            <StockRow
              key={item.symbol}
              item={item}
              data={stockData[item.symbol]}
              loading={loading}
              onRemove={removeFromWatchlist}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0,
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={10} />
          {fetchFailed ? '数据每2分钟刷新（模拟模式）' : '数据每30秒自动刷新'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Database size={10} />
          Powered by Stooq
        </span>
      </div>

      {/* Custom Add Modal */}
      {showCustomAdd && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => setShowCustomAdd(false)}
        >
          <GlassCard
            style={{ width: '100%', maxWidth: 400, padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} style={{ color: '#22c55e' }} />
                自定义添加
              </h3>
              <button
                onClick={() => setShowCustomAdd(false)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                输入股票代码（如 AAPL、TSLA、NVDA）
              </label>
              <input
                type="text"
                placeholder="例如：AAPL"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomSymbol() }}
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {['AAPL', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN', 'JPM', 'XOM'].map(s => (
                <button
                  key={s}
                  onClick={() => setCustomSymbol(s)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowCustomAdd(false)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={addCustomSymbol}
                disabled={!customSymbol.trim()}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  background: customSymbol.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.05)',
                  border: 'none', color: '#fff',
                  cursor: customSymbol.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 600,
                  opacity: customSymbol.trim() ? 1 : 0.5,
                }}
              >
                添加
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
})

export default StockTracker