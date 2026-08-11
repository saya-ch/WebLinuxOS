import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  X,
  Plus,
  BarChart3,
  Sparkles,
  LineChart,
  Activity,
  StarOff,
  Database,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react'
import { useStore } from '../store'

interface StockData {
  symbol: string
  name: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
  date: string
  time: string
  prevClose: number
}

interface WatchlistItem {
  symbol: string
  name: string
  type: 'stock' | 'index' | 'crypto'
}

interface MarketIndex {
  symbol: string
  name: string
  stooqSymbol: string
  region: string
}

const STOOQ_BASE = 'https://stooq.com/q/l/'
const FIELD_SET = 'sd2t2ohlcv'

const POPULAR_STOCKS: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock' },
  { symbol: 'BTC-USD', name: 'Bitcoin / USD', type: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum / USD', type: 'crypto' },
  { symbol: '000001.SS', name: '上证指数', type: 'index' },
  { symbol: '^HSI', name: '恒生指数', type: 'index' },
]

const MARKET_INDICES: MarketIndex[] = [
  { symbol: '^GSPC', name: 'S&P 500', stooqSymbol: '^spx.us', region: '美国' },
  { symbol: '^IXIC', name: 'NASDAQ', stooqSymbol: '^ndq.us', region: '美国' },
  { symbol: '^DJI', name: 'Dow Jones', stooqSymbol: '^dji.us', region: '美国' },
  { symbol: '000001.SS', name: '上证指数', stooqSymbol: '000001.ss', region: '中国' },
  { symbol: '^HSI', name: '恒生指数', stooqSymbol: '^hsi.hk', region: '香港' },
  { symbol: '^N225', name: '日经225', stooqSymbol: '^n225.jp', region: '日本' },
  { symbol: '^FTSE', name: '富时100', stooqSymbol: '^ftse.uk', region: '英国' },
  { symbol: '^DAX', name: '德国DAX', stooqSymbol: '^dax.de', region: '德国' },
]

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { symbol: 'BTC-USD', name: 'Bitcoin / USD', type: 'crypto' },
  { symbol: '000001.SS', name: '上证指数', type: 'index' },
]

const WATCHLIST_KEY = 'weblinux-stock-dashboard-watchlist'
const HISTORY_KEY = 'weblinux-stock-dashboard-history'

const getStooqSymbol = (item: WatchlistItem): string => {
  const { symbol, type } = item
  if (type === 'crypto') {
    return symbol.toLowerCase().replace('-', '') + '.pln'
  }
  if (type === 'index') {
    const idx = MARKET_INDICES.find(i => i.symbol === symbol)
    return idx ? idx.stooqSymbol : symbol.toLowerCase()
  }
  return symbol.toLowerCase() + '.us'
}

const parseStooqCSV = (text: string): Record<string, string> | null => {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return null
  const headers = lines[0].split(',').map(h => h.trim())
  const values = lines[1].split(',')
  const row: Record<string, string> = {}
  headers.forEach((h, i) => { row[h] = (values[i] || '').trim() })
  return row
}

const generateMockHistory = (basePrice: number, days: number = 30): number[] => {
  const history: number[] = []
  let price = basePrice * (0.92 + Math.random() * 0.06)
  const seed = Math.round(basePrice * 100) % 100000
  for (let i = days - 1; i >= 0; i--) {
    const rand = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1
    const change = (Math.abs(rand) - 0.5) * basePrice * 0.04
    price = Math.max(1, price + change)
    history.push(parseFloat(price.toFixed(2)))
  }
  return history
}

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

const MiniChart: React.FC<{
  data: number[]
  color: string
  width?: number
  height?: number
}> = ({ data, color, width = 80, height = 28 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pad = 2

    const points = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2)
      const y = height - pad - ((v - min) / range) * (height - pad * 2)
      return { x, y }
    })

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    const last = points[points.length - 1]
    ctx.beginPath()
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }, [data, color, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
}

const StockRow: React.FC<{
  item: WatchlistItem
  data?: StockData
  history: number[]
  loading: boolean
  onRemove: (symbol: string) => void
}> = memo(({ item, data, history, loading, onRemove }) => {
  const isPositive = data ? data.change >= 0 : true
  const changeColor = isPositive ? '#22c55e' : '#ef4444'

  const typeIcon = item.type === 'index'
    ? <BarChart3 size={12} />
    : item.type === 'crypto'
    ? <Zap size={12} />
    : <Activity size={12} />

  const typeColor = item.type === 'index'
    ? '#f59e0b'
    : item.type === 'crypto'
    ? '#8b5cf6'
    : '#3b82f6'

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
              background: typeColor + '20',
              color: typeColor,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {typeIcon}
            {item.type === 'stock' ? '股票' : item.type === 'index' ? '指数' : '加密'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <MiniChart data={history} color={changeColor} width={70} height={24} />
      </div>

      <div style={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
        {data ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
              {data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 12, color: changeColor, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
            </div>
            {data.volume > 0 && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                Vol: {(data.volume / 1000000).toFixed(1)}M
              </div>
            )}
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

const IndexCard: React.FC<{
  idx: MarketIndex
  data?: StockData
  loading: boolean
}> = memo(({ idx, data, loading }) => {
  const isUp = data ? data.change >= 0 : true
  const color = isUp ? '#22c55e' : '#ef4444'

  return (
    <GlassCard style={{ padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <BarChart3 size={12} style={{ color }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {idx.name}
        </span>
      </div>
      {data ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 2 }}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? '+' : ''}{data.changePercent.toFixed(2)}%
          </div>
        </>
      ) : loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Loader2 size={10} className="animate-spin" />
          ...
        </div>
      ) : (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>--</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>--</div>
        </>
      )}
    </GlassCard>
  )
})

IndexCard.displayName = 'IndexCard'

const StockDashboard = memo(function StockDashboard() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_WATCHLIST
  })

  const [stockData, setStockData] = useState<Record<string, StockData>>({})
  const [historyData, setHistoryData] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return {}
  })
  const [indicesData, setIndicesData] = useState<Record<string, StockData>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WatchlistItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [customSymbol, setCustomSymbol] = useState('')
  const [customType, setCustomType] = useState<'stock' | 'index' | 'crypto'>('stock')
  const [isMockMode, setIsMockMode] = useState(false)
  const timerRef = useRef<number | null>(null)
  const fetchDataRef = useRef<() => Promise<void>>(async () => {})
  const addNotification = useStore(s => s.addNotification)

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist))
    } catch {}
  }, [watchlist])

  const fetchStockQuote = useCallback(async (item: WatchlistItem): Promise<StockData | null> => {
    try {
      const stooqSym = getStooqSymbol(item)
      const url = `${STOOQ_BASE}?s=${stooqSym}&f=${FIELD_SET}&h&e=csv`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const row = parseStooqCSV(text)
      if (!row || !row.Close) return null

      const price = parseFloat(row.Close)
      const open = parseFloat(row.Open || '0')
      const prevClose = parseFloat(row.Close)
      const change = price - open
      const changePercent = open > 0 ? (change / open) * 100 : 0

      return {
        symbol: item.symbol,
        name: item.name,
        price,
        open,
        high: parseFloat(row.High || price.toString()),
        low: parseFloat(row.Low || price.toString()),
        close: price,
        volume: parseInt(row.Volume || '0', 10) || 0,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        date: row.Date || '',
        time: row.Time || '',
        prevClose,
      }
    } catch {
      return null
    }
  }, [])

  const generateMockData = useCallback((item: WatchlistItem): StockData => {
    const prices: Record<string, number> = {
      AAPL: 192.5, GOOGL: 141.8, MSFT: 378.9, TSLA: 248.5, AMZN: 178.25,
      NVDA: 875.3, META: 505.75, AMD: 156.9, BTC: 67823, ETH: 3456,
    }
    const basePrice = prices[item.symbol] || prices[item.symbol.replace('-USD', '')] || 100 + Math.random() * 400
    const change = (Math.random() - 0.5) * basePrice * 0.04
    const price = basePrice + change
    const changePercent = (change / basePrice) * 100

    return {
      symbol: item.symbol,
      name: item.name,
      price: parseFloat(price.toFixed(2)),
      open: parseFloat(basePrice.toFixed(2)),
      high: parseFloat((price + Math.random() * 3).toFixed(2)),
      low: parseFloat((price - Math.random() * 3).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000 + 1000000),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
      prevClose: parseFloat(basePrice.toFixed(2)),
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      let anyReal = false
      const results: Record<string, StockData> = { ...stockData }
      const newHistory: Record<string, number[]> = { ...historyData }

      for (const item of watchlist) {
        const real = await fetchStockQuote(item)
        if (real) {
          results[item.symbol] = real
          anyReal = true
          if (!newHistory[item.symbol] || newHistory[item.symbol].length < 10) {
            newHistory[item.symbol] = generateMockHistory(real.price, 30)
          }
        } else {
          const mock = generateMockData(item)
          results[item.symbol] = mock
          if (!newHistory[item.symbol] || newHistory[item.symbol].length < 10) {
            newHistory[item.symbol] = generateMockHistory(mock.price, 30)
          }
        }
      }

      const idxResults: Record<string, StockData> = { ...indicesData }
      for (const idx of MARKET_INDICES) {
        const real = await fetchStockQuote({
          symbol: idx.symbol,
          name: idx.name,
          type: 'index',
        })
        if (real) {
          idxResults[idx.symbol] = real
          anyReal = true
        } else {
          const mock = generateMockData({ symbol: idx.symbol, name: idx.name, type: 'index' })
          if (!idxResults[idx.symbol]) {
            const refVal = idx.symbol === '^GSPC' ? 5234 :
              idx.symbol === '^IXIC' ? 16420 :
              idx.symbol === '^DJI' ? 39872 :
              idx.symbol === '000001.SS' ? 3150 :
              idx.symbol === '^HSI' ? 18500 :
              idx.symbol === '^N225' ? 39500 :
              idx.symbol === '^FTSE' ? 7950 :
              idx.symbol === '^DAX' ? 18200 : 5000
            idxResults[idx.symbol] = {
              ...mock,
              price: refVal + (Math.random() - 0.5) * refVal * 0.02,
              open: refVal,
              changePercent: (Math.random() - 0.5) * 2,
            }
          }
        }
      }

      setStockData(results)
      setIndicesData(idxResults)
      setHistoryData(newHistory)
      setLastUpdated(new Date())
      setIsMockMode(!anyReal)

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      } catch {}
    } catch (err) {
      console.warn('Stock fetch failed:', err)
      setIsMockMode(true)
    } finally {
      setLoading(false)
    }
  }, [watchlist, fetchStockQuote, generateMockData, stockData, historyData, indicesData])

  useEffect(() => {
    fetchDataRef.current = fetchAllData
  }, [fetchAllData])

  useEffect(() => {
    fetchAllData()
    timerRef.current = window.setInterval(() => {
      fetchDataRef.current()
    }, 30000)
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

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
        title: '股票仪表盘',
        message: `${item.symbol} 已添加到自选列表`,
        type: 'success',
      })
    }
    setSearchQuery('')
    setSearchResults([])
  }, [watchlist, addNotification])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol))
    addNotification({
      title: '股票仪表盘',
      message: `${symbol} 已从自选列表移除`,
      type: 'info',
    })
  }, [addNotification])

  const addCustomSymbol = useCallback(() => {
    const symbol = customSymbol.trim().toUpperCase()
    if (!symbol) return
    if (watchlist.find(w => w.symbol === symbol)) {
      addNotification({ title: '提示', message: `${symbol} 已在自选列表中`, type: 'warning' })
      return
    }
    const found = POPULAR_STOCKS.find(s => s.symbol === symbol)
    const newItem: WatchlistItem = {
      symbol,
      name: found?.name || symbol,
      type: found?.type || customType,
    }
    setWatchlist(prev => [...prev, newItem])
    setCustomSymbol('')
    setShowAddModal(false)
    addNotification({
      title: '股票仪表盘',
      message: `${symbol} 已添加到自选列表`,
      type: 'success',
    })
  }, [customSymbol, watchlist, customType, addNotification])

  const stats = useMemo(() => {
    const values = Object.values(stockData)
    if (values.length === 0) return { gainers: 0, losers: 0, total: 0, avgChange: 0 }
    const gainers = values.filter(v => v.change >= 0).length
    const losers = values.filter(v => v.change < 0).length
    const avgChange = values.reduce((sum, v) => sum + v.changePercent, 0) / values.length
    return { gainers, losers, total: values.length, avgChange }
  }, [stockData])

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
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>实时股票仪表盘</div>
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
            onClick={() => setShowAddModal(true)}
            style={{ ...glassButtonStyle, background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            <Plus size={14} />
            添加
          </button>
          <button
            onClick={() => fetchDataRef.current()}
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
          <Database size={14} style={{ color: isMockMode ? '#f59e0b' : '#22c55e' }} />
          <span style={{ color: 'var(--text-muted)' }}>
            数据源：
            <span style={{ color: isMockMode ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
              {isMockMode ? '模拟数据' : '实时数据 (Stooq)'}
            </span>
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 11 }}>
            监控: {watchlist.length} 只
          </span>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={14} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>市场指数概览</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {MARKET_INDICES.map(idx => (
            <IndexCard
              key={idx.symbol}
              idx={idx}
              data={indicesData[idx.symbol]}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {Object.keys(stockData).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flexShrink: 0 }}>
          <GlassCard style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>上涨</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{stats.gainers}</div>
          </GlassCard>
          <GlassCard style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>下跌</div>
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

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="搜索股票代码或名称... (如 AAPL, TSLA, BTC-USD)"
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
                    background: result.type === 'stock' ? 'rgba(59,130,246,0.15)' : result.type === 'index' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
                    color: result.type === 'stock' ? '#3b82f6' : result.type === 'index' ? '#f59e0b' : '#8b5cf6',
                    fontWeight: 600,
                  }}>
                    {result.type === 'stock' ? '股票' : result.type === 'index' ? '指数' : '加密'}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: isAdded ? '#22c55e' : 'var(--text-muted)' }}>
                  {isAdded ? '已添加' : '+ 添加'}
                </span>
              </div>
            )
          })}
        </GlassCard>
      )}

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
            <div>加载中...</div>
          </div>
        ) : watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <StarOff size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <div>自选列表为空</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>点击添加按钮开始追踪股票</div>
          </div>
        ) : (
          watchlist.map(item => (
            <StockRow
              key={item.symbol}
              item={item}
              data={stockData[item.symbol]}
              history={historyData[item.symbol] || []}
              loading={loading}
              onRemove={removeFromWatchlist}
            />
          ))
        )}
      </div>

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
          {isMockMode ? '每2分钟刷新（模拟模式）' : '数据每30秒自动刷新'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Database size={10} />
          Powered by Stooq
        </span>
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <GlassCard style={{ width: '100%', maxWidth: 440, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} style={{ color: '#22c55e' }} />
                添加自选
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
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
                选择类型
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {([
                  { key: 'stock', label: '股票', icon: <Activity size={12} />, color: '#3b82f6' },
                  { key: 'index', label: '指数', icon: <BarChart3 size={12} />, color: '#f59e0b' },
                  { key: 'crypto', label: '加密货币', icon: <Zap size={12} />, color: '#8b5cf6' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setCustomType(t.key)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: `1px solid ${customType === t.key ? t.color : 'rgba(255,255,255,0.1)'}`,
                      background: customType === t.key ? t.color + '20' : 'rgba(255,255,255,0.03)',
                      color: customType === t.key ? t.color : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: customType === t.key ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                输入代码
              </label>
              <input
                type="text"
                placeholder={customType === 'crypto' ? '例如：BTC-USD' : customType === 'index' ? '例如：000001.SS' : '例如：AAPL'}
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomSymbol() }}
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {POPULAR_STOCKS.filter(s => s.type === customType).slice(0, 8).map(s => (
                <button
                  key={s.symbol}
                  onClick={() => setCustomSymbol(s.symbol)}
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
                  {s.symbol}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowAddModal(false)}
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

export default StockDashboard