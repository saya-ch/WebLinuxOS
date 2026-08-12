import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

interface Crypto {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  image?: string
}

interface CoinGeckoResponse {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h?: number
  market_cap: number
  total_volume: number
  image?: string
}

interface Transaction {
  id: string
  type: 'buy' | 'sell'
  cryptoId: string
  cryptoSymbol: string
  amount: number
  price: number
  total: number
  timestamp: number
}

interface Holding {
  cryptoId: string
  symbol: string
  amount: number
  avgCost: number
}

interface PricePoint {
  price: number
  timestamp: number
}

const CRYPTO_API = 'https://api.coingecko.com/api/v3'
const CACHE_KEY = 'crypto-simulator-cache'
const CACHE_TTL = 2 * 60 * 1000
const PORTFOLIO_KEY = 'crypto-simulator-portfolio'
const TRANSACTIONS_KEY = 'crypto-simulator-transactions'
const BALANCE_KEY = 'crypto-simulator-balance'
const CHART_KEY = 'crypto-simulator-chart'
const REFRESH_INTERVAL = 45 * 1000
const STARTING_BALANCE = 100000

const SUPPORTED_CRYPTOS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
  { id: 'tron', name: 'TRON', symbol: 'TRX' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
  { id: 'monero', name: 'Monero', symbol: 'XMR' },
]

const MOCK_CRYPTO: Crypto[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67523.42, change24h: 2.34, marketCap: 1328000000000, volume24h: 28900000000 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: -1.23, marketCap: 416000000000, volume24h: 15200000000 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 172.34, change24h: 4.12, marketCap: 78000000000, volume24h: 3200000000 },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 0.5234, change24h: 3.45, marketCap: 28500000000, volume24h: 1200000000 },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.4567, change24h: -0.56, marketCap: 16000000000, volume24h: 450000000 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.1456, change24h: 5.67, marketCap: 21000000000, volume24h: 980000000 },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', price: 34.56, change24h: 1.89, marketCap: 13200000000, volume24h: 420000000 },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 6.89, change24h: -2.15, marketCap: 9800000000, volume24h: 280000000 },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 14.23, change24h: -0.78, marketCap: 8500000000, volume24h: 260000000 },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', price: 78.45, change24h: -1.45, marketCap: 5800000000, volume24h: 340000000 },
  { id: 'tron', name: 'TRON', symbol: 'TRX', price: 0.1234, change24h: 2.12, marketCap: 10800000000, volume24h: 380000000 },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', price: 0.1123, change24h: 3.78, marketCap: 3200000000, volume24h: 110000000 },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', price: 8.67, change24h: -2.89, marketCap: 3400000000, volume24h: 98000000 },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', price: 7.89, change24h: 4.56, marketCap: 4700000000, volume24h: 180000000 },
  { id: 'monero', name: 'Monero', symbol: 'XMR', price: 156.78, change24h: 1.23, marketCap: 2800000000, volume24h: 95000000 },
]

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toFixed(4)}`
}

function formatPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}

function formatAmount(value: number): string {
  if (value >= 1) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return value.toFixed(6)
}

function generateChartPoints(currentPrice: number, change24h: number, points: number = 24): number[] {
  const ratio = change24h / 100
  const startPrice = currentPrice / (1 + ratio)
  const pricePoints: number[] = []
  let seed = Math.abs(Math.round(currentPrice * 100)) % 100000
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    const linearPrice = startPrice + (currentPrice - startPrice) * t
    const noise = (rand() - 0.5) * 0.015
    const wave = Math.sin(t * Math.PI * 4) * (Math.abs(ratio) * 0.12)
    const price = linearPrice * (1 + noise + wave)
    pricePoints.push(price)
  }
  pricePoints[pricePoints.length - 1] = currentPrice
  return pricePoints
}

function PriceChart({
  points,
  transactions,
  width = 600,
  height = 200,
}: {
  points: number[]
  transactions: Transaction[]
  width?: number
  height?: number
}) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || max * 0.01 || 1
  const padX = 40
  const padY = 20
  const chartW = width - padX - 10
  const chartH = height - padY - 20

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * chartW
    const y = padY + chartH - ((p - min) / range) * chartH
    return { x, y, p }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(padY + chartH).toFixed(1)} L${coords[0].x.toFixed(1)},${(padY + chartH).toFixed(1)} Z`

  const color = points[points.length - 1] >= points[0] ? '#4ade80' : '#f87171'

  const yTicks = 4
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = min + (range * i) / yTicks
    const y = padY + chartH - ((val - min) / range) * chartH
    return { val, y }
  })

  const xTicks = 6
  const xLabels = Array.from({ length: xTicks + 1 }, (_, i) => {
    const idx = Math.round((i / xTicks) * (points.length - 1))
    return { idx, x: coords[idx].x }
  })

  const buyMarkers = transactions.filter((t) => t.type === 'buy')
  const sellMarkers = transactions.filter((t) => t.type === 'sell')

  const findPriceY = (price: number) => {
    const closestIdx = points.reduce((prev, _curr, idx) =>
      Math.abs(points[idx] - price) < Math.abs(points[prev] - price) ? idx : prev
    , 0)
    const c = coords[closestIdx]
    return { x: c.x, y: c.y }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padX} y1={g.y} x2={width - 10} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <text x={padX - 4} y={g.y + 3} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
            {formatPrice(g.val)}
          </text>
        </g>
      ))}
      {xLabels.map((g, i) => (
        <text key={i} x={g.x} y={height - 4} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="middle">
          {`${Math.round((i / xTicks) * 24)}h`}
        </text>
      ))}
      <path d={areaPath} fill={color} opacity={0.1} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {buyMarkers.map((t) => {
        const pos = findPriceY(t.price)
        return (
          <g key={`buy-${t.id}`}>
            <circle cx={pos.x} cy={pos.y} r={6} fill="#22c55e" stroke="#fff" strokeWidth={1.5} opacity={0.9} />
            <text x={pos.x} y={pos.y - 10} fill="#22c55e" fontSize="9" textAnchor="middle" fontWeight="600">B</text>
          </g>
        )
      })}
      {sellMarkers.map((t) => {
        const pos = findPriceY(t.price)
        return (
          <g key={`sell-${t.id}`}>
            <circle cx={pos.x} cy={pos.y} r={6} fill="#ef4444" stroke="#fff" strokeWidth={1.5} opacity={0.9} />
            <text x={pos.x} y={pos.y - 10} fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="600">S</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function CryptoSimulator() {
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string>('bitcoin')
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(BALANCE_KEY) : null
      return saved ? parseFloat(saved) : STARTING_BALANCE
    } catch {
      return STARTING_BALANCE
    }
  })
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(PORTFOLIO_KEY) : null
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(TRANSACTIONS_KEY) : null
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(CHART_KEY) : null
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy')
  const [tradeAmount, setTradeAmount] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'trade' | 'portfolio' | 'history'>('trade')
  const [chartRange, setChartRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchFailedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(BALANCE_KEY, JSON.stringify(balance))
    } catch {
      // ignore
    }
  }, [balance])

  useEffect(() => {
    try {
      window.localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings))
    } catch {
      // ignore
    }
  }, [holdings])

  useEffect(() => {
    try {
      window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
    } catch {
      // ignore
    }
  }, [transactions])

  useEffect(() => {
    try {
      window.localStorage.setItem(CHART_KEY, JSON.stringify(priceHistory))
    } catch {
      // ignore
    }
  }, [priceHistory])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const getCachedData = (): { data: Crypto[]; timestamp: number } | null => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.data)) return null
      return parsed
    } catch {
      return null
    }
  }

  const setCache = (data: Crypto[]) => {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch {
      // ignore
    }
  }

  const scheduleNextFetch = useCallback((failed: boolean) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    const delay = failed ? 120 * 1000 : REFRESH_INTERVAL
    timerRef.current = window.setTimeout(() => {
      fetchCryptoData()
    }, delay)
  }, [])

  const fetchCryptoData = useCallback(async () => {
    try {
      const cached = getCachedData()
      const now = Date.now()
      if (cached && now - cached.timestamp < CACHE_TTL) {
        setCryptos(cached.data)
        setLastUpdated(new Date(cached.timestamp))
        if (!fetchFailedRef.current) {
          scheduleNextFetch(false)
        }
        return
      }

      const ids = SUPPORTED_CRYPTOS.map((c) => c.id).join(',')
      const response = await fetch(
        `${CRYPTO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch crypto data')
      }

      const data = await response.json()

      const formatted: Crypto[] = (data as CoinGeckoResponse[]).map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        image: coin.image,
      }))

      const sorted = [...formatted].sort((a, b) => b.marketCap - a.marketCap)
      setCryptos(sorted)
      setCache(sorted)
      setLastUpdated(new Date())
      fetchFailedRef.current = false

      setPriceHistory((prev) => {
        const updated = { ...prev }
        const ts = Date.now()
        sorted.forEach((c) => {
          if (!updated[c.id]) {
            updated[c.id] = []
          }
          updated[c.id] = [...updated[c.id].slice(-287), { price: c.price, timestamp: ts }]
        })
        return updated
      })

      setLoading(false)
      scheduleNextFetch(false)
    } catch (err) {
      console.warn('Crypto fetch failed:', err)
      setError('获取实时行情失败，使用缓存数据')
      const cached = getCachedData()
      if (cached && cached.data.length > 0) {
        setCryptos(cached.data)
        setLastUpdated(new Date(cached.timestamp))
      } else {
        setCryptos(MOCK_CRYPTO)
        setLastUpdated(new Date())
        setCache(MOCK_CRYPTO)
      }
      fetchFailedRef.current = true
      setLoading(false)
      scheduleNextFetch(true)
    }
  }, [scheduleNextFetch])

  useEffect(() => {
    fetchCryptoData()
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [fetchCryptoData])

  const selectedCrypto = useMemo(
    () => cryptos.find((c) => c.id === selectedId) || cryptos[0],
    [cryptos, selectedId]
  )

  const filteredCryptos = useMemo(() => {
    const filtered = cryptos.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return filtered.sort((a, b) => b.marketCap - a.marketCap)
  }, [cryptos, searchQuery])

  const portfolioValue = useMemo(() => {
    return holdings.reduce((total, h) => {
      const crypto = cryptos.find((c) => c.id === h.cryptoId)
      return total + (crypto ? crypto.price * h.amount : 0)
    }, 0)
  }, [holdings, cryptos])

  const portfolioCost = useMemo(() => {
    return holdings.reduce((total, h) => total + h.amount * h.avgCost, 0)
  }, [holdings])

  const totalAssets = balance + portfolioValue
  const totalPnL = totalAssets - STARTING_BALANCE
  const totalPnLPct = (totalPnL / STARTING_BALANCE) * 100

  const selectedHolding = useMemo(
    () => holdings.find((h) => h.cryptoId === selectedId),
    [holdings, selectedId]
  )

  const selectedTransactions = useMemo(
    () => transactions.filter((t) => t.cryptoId === selectedId),
    [transactions, selectedId]
  )

  const generateSyntheticChart = useMemo(() => {
    if (!selectedCrypto) return []
    const points = 96
    return generateChartPoints(selectedCrypto.price, selectedCrypto.change24h, points)
  }, [selectedCrypto])

  const chartPoints = useMemo(() => {
    if (!selectedCrypto) return []
    const history = priceHistory[selectedCrypto.id] || []
    if (history.length >= 6) {
      return history.map((p) => p.price)
    }
    return generateSyntheticChart
  }, [priceHistory, selectedCrypto, generateSyntheticChart])

  const executeTrade = useCallback(() => {
    if (!selectedCrypto) return
    const amount = parseFloat(tradeAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('error', '请输入有效的交易数量')
      return
    }

    const price = selectedCrypto.price
    const total = amount * price
    const txId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    if (tradeMode === 'buy') {
      if (total > balance) {
        showToast('error', `余额不足，需要 ${formatCurrency(total)}，当前 ${formatCurrency(balance)}`)
        return
      }
      setBalance((prev) => prev - total)
      setHoldings((prev) => {
        const existing = prev.find((h) => h.cryptoId === selectedCrypto.id)
        if (existing) {
          const newAmount = existing.amount + amount
          const newAvgCost = (existing.amount * existing.avgCost + total) / newAmount
          return prev.map((h) =>
            h.cryptoId === selectedCrypto.id
              ? { ...h, amount: newAmount, avgCost: newAvgCost }
              : h
          )
        }
        return [
          ...prev,
          {
            cryptoId: selectedCrypto.id,
            symbol: selectedCrypto.symbol,
            amount,
            avgCost: price,
          },
        ]
      })
      setTransactions((prev) => [
        {
          id: txId,
          type: 'buy',
          cryptoId: selectedCrypto.id,
          cryptoSymbol: selectedCrypto.symbol,
          amount,
          price,
          total,
          timestamp: Date.now(),
        },
        ...prev,
      ])
      showToast('success', `买入成功：${amount} ${selectedCrypto.symbol} @ ${formatPrice(price)}`)
    } else {
      const holding = holdings.find((h) => h.cryptoId === selectedCrypto.id)
      if (!holding || holding.amount < amount) {
        showToast('error', `持仓不足，持有 ${holding ? formatAmount(holding.amount) : 0} ${selectedCrypto.symbol}`)
        return
      }
      setBalance((prev) => prev + total)
      setHoldings((prev) => {
        return prev
          .map((h) =>
            h.cryptoId === selectedCrypto.id ? { ...h, amount: h.amount - amount } : h
          )
          .filter((h) => h.amount > 0.000001)
      })
      setTransactions((prev) => [
        {
          id: txId,
          type: 'sell',
          cryptoId: selectedCrypto.id,
          cryptoSymbol: selectedCrypto.symbol,
          amount,
          price,
          total,
          timestamp: Date.now(),
        },
        ...prev,
      ])
      showToast('success', `卖出成功：${amount} ${selectedCrypto.symbol} @ ${formatPrice(price)}`)
    }
    setTradeAmount('')
  }, [selectedCrypto, tradeAmount, tradeMode, balance, holdings, showToast])

  const resetAccount = () => {
    if (typeof window === 'undefined') return
    if (!window.confirm('确定要重置账户吗？所有持仓、交易记录和余额将被清除。')) return
    setBalance(STARTING_BALANCE)
    setHoldings([])
    setTransactions([])
    setPriceHistory({})
    showToast('success', '账户已重置')
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const pnlColor = (value: number) => (value >= 0 ? 'var(--success)' : 'var(--error)')
  const pnlSign = (value: number) => (value >= 0 ? '+' : '')

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--window-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--window-border)',
          background: 'var(--titlebar-bg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📈</span>
            <div>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '18px' }}>加密货币交易模拟器</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '11px' }}>
                {lastUpdated ? `行情更新: ${formatDate(lastUpdated)}` : '加载行情...'} · 数据来源 CoinGecko
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchCryptoData}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-gradient)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-elevation-2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              🔄 刷新
            </button>
            <button
              onClick={resetAccount}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--color-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--error)'
                e.currentTarget.style.color = 'var(--error)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--window-border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              ↻ 重置
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--window-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>总资产</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>{formatCurrency(totalAssets)}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--window-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>可用余额</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>{formatCurrency(balance)}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--window-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>持仓价值</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>{formatCurrency(portfolioValue)}</div>
          </div>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid var(--window-border)',
              borderLeft: `3px solid ${pnlColor(totalPnL)}`,
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>总盈亏</div>
            <div style={{ color: pnlColor(totalPnL), fontSize: '18px', fontWeight: '700' }}>
              {pnlSign(totalPnL)}
              {formatCurrency(totalPnL)}
              <span style={{ fontSize: '12px', marginLeft: '4px' }}>({pnlSign(totalPnLPct)}
              {totalPnLPct.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['trade', 'portfolio', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab ? '600' : '400',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {tab === 'trade' ? '💹 交易' : tab === 'portfolio' ? '📊 持仓' : '📜 历史'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left: Crypto List */}
        <div
          style={{
            width: '220px',
            borderRight: '1px solid var(--window-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--window-border)' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索币种..."
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--window-border)'
              }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && cryptos.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>加载中...</div>
            ) : (
              filteredCryptos.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: selectedId === c.id ? 'var(--accent-bg)' : 'transparent',
                    borderLeft: selectedId === c.id ? '3px solid var(--accent)' : '3px solid transparent',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== c.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.name}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>{c.symbol}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatPrice(c.price)}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: c.change24h >= 0 ? 'var(--success)' : 'var(--error)', fontWeight: '600' }}>
                    {c.change24h >= 0 ? '+' : ''}
                    {c.change24h.toFixed(2)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--error-bg)',
                borderRadius: '8px',
                color: 'var(--error)',
                fontSize: '12px',
                marginBottom: '12px',
              }}
            >
              ⚠ {error}（60秒后自动重试）
            </div>
          )}

          {selectedCrypto && (
            <>
              {/* Price Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                {selectedCrypto.image && (
                  <img
                    src={selectedCrypto.image}
                    alt={selectedCrypto.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>{selectedCrypto.name}</h2>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{selectedCrypto.symbol}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatPrice(selectedCrypto.price)}
                    </span>
                    <span
                      style={{
                        color: selectedCrypto.change24h >= 0 ? 'var(--success)' : 'var(--error)',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {selectedCrypto.change24h >= 0 ? '↑' : '↓'} {Math.abs(selectedCrypto.change24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['24h', '7d', '30d'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--window-border)',
                        background: chartRange === r ? 'var(--accent-bg)' : 'transparent',
                        color: chartRange === r ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: chartRange === r ? '600' : '400',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid var(--window-border)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                  📊 价格走势 & 交易标记
                </div>
                <PriceChart
                  points={chartPoints.length >= 2 ? chartPoints : generateSyntheticChart}
                  transactions={selectedTransactions}
                  width={580}
                  height={180}
                />
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', marginRight: '4px' }} />
                    买入点
                  </span>
                  <span>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginRight: '4px' }} />
                    卖出点
                  </span>
                </div>
              </div>

              {activeTab === 'trade' && (
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>💹 交易 {selectedCrypto.symbol}</h3>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <button
                      onClick={() => setTradeMode('buy')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: tradeMode === 'buy' ? '#22c55e' : 'var(--window-bg)',
                        color: tradeMode === 'buy' ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      买入 / BUY
                    </button>
                    <button
                      onClick={() => setTradeMode('sell')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: tradeMode === 'sell' ? '#ef4444' : 'var(--window-bg)',
                        color: tradeMode === 'sell' ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      卖出 / SELL
                    </button>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                      数量 ({selectedCrypto.symbol})
                    </label>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.0001"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '18px',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = tradeMode === 'buy' ? '#22c55e' : '#ef4444'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--window-border)'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px',
                      marginBottom: '14px',
                    }}
                  >
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          if (tradeMode === 'buy') {
                            const maxAmt = (balance * pct) / selectedCrypto.price
                            setTradeAmount(maxAmt.toFixed(6))
                          } else {
                            const h = holdings.find((x) => x.cryptoId === selectedCrypto.id)
                            if (h) {
                              setTradeAmount((h.amount * pct).toFixed(6))
                            }
                          }
                        }}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid var(--window-border)',
                          background: 'var(--window-bg)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.color = 'var(--accent)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--window-border)'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                      >
                        {pct === 1 ? 'MAX' : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      background: 'var(--window-bg)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>预计总成本</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>
                      {formatCurrency((parseFloat(tradeAmount) || 0) * selectedCrypto.price)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    <span>实时价格: {formatPrice(selectedCrypto.price)}</span>
                    <span>· 可用余额: {formatCurrency(balance)}</span>
                    {selectedHolding && (
                      <span>
                        · 持仓: {formatAmount(selectedHolding.amount)} {selectedCrypto.symbol}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={executeTrade}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: tradeMode === 'buy' ? '#22c55e' : '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '700',
                      transition: 'all 0.2s ease',
                      boxShadow: `0 4px 20px ${tradeMode === 'buy' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {tradeMode === 'buy' ? '确认买入' : '确认卖出'} {selectedCrypto.symbol}
                  </button>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>📊 我的持仓</h3>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      成本: {formatCurrency(portfolioCost)} · 市值: {formatCurrency(portfolioValue)}
                    </span>
                  </div>
                  {holdings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>💼</div>
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>暂无持仓</div>
                      <div style={{ fontSize: '12px' }}>切换到"交易"标签开始买卖加密货币</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {holdings.map((h) => {
                        const crypto = cryptos.find((c) => c.id === h.cryptoId)
                        if (!crypto) return null
                        const value = crypto.price * h.amount
                        const costValue = h.avgCost * h.amount
                        const pnl = value - costValue
                        const pnlPct = costValue > 0 ? (pnl / costValue) * 100 : 0
                        const isSelected = selectedId === h.cryptoId
                        return (
                          <div
                            key={h.cryptoId}
                            onClick={() => setSelectedId(h.cryptoId)}
                            style={{
                              background: isSelected ? 'var(--accent-bg)' : 'var(--window-bg)',
                              borderRadius: '10px',
                              padding: '12px 14px',
                              cursor: 'pointer',
                              border: isSelected ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                              transition: 'all 0.2s ease',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr 1fr',
                              gap: '10px',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'var(--window-bg)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {crypto.image && (
                                <img
                                  src={crypto.image}
                                  alt={crypto.name}
                                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                                />
                              )}
                              <div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>
                                  {crypto.symbol}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                  {formatAmount(h.amount)} 枚
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>
                                {formatPrice(crypto.price)}
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                成本 {formatPrice(h.avgCost)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>
                                {formatCurrency(value)}
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                成本 {formatCurrency(costValue)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: pnlColor(pnl), fontWeight: '600', fontSize: '13px' }}>
                                {pnlSign(pnl)}
                                {formatCurrency(pnl)}
                              </div>
                              <div style={{ color: pnlColor(pnl), fontSize: '10px' }}>
                                {pnlSign(pnlPct)}
                                {pnlPct.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>📜 交易历史</h3>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      共 {transactions.length} 笔交易
                    </span>
                  </div>
                  {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                      <div style={{ fontSize: '14px' }}>暂无交易记录</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '500px', overflowY: 'auto' }}>
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          style={{
                            background: 'var(--window-bg)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 1fr 1fr',
                            gap: '10px',
                            alignItems: 'center',
                            borderLeft: `3px solid ${tx.type === 'buy' ? '#22c55e' : '#ef4444'}`,
                          }}
                        >
                          <div
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: tx.type === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                              color: tx.type === 'buy' ? '#22c55e' : '#ef4444',
                              fontSize: '10px',
                              fontWeight: '700',
                              textAlign: 'center',
                            }}
                          >
                            {tx.type === 'buy' ? '买入' : '卖出'}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' }}>
                              {formatAmount(tx.amount)} {tx.cryptoSymbol}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                              @ {formatPrice(tx.price)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' }}>
                              {formatCurrency(tx.total)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '10px' }}>
                            {formatTime(tx.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '10px',
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 9999,
            animation: 'toastIn 0.3s ease-out',
          }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}