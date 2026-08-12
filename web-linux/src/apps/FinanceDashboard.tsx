import { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  TrendingUp, RefreshCw, Plus, Trash2,
  Bitcoin, PieChart, Activity, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight,
  PiggyBank, Wallet, LineChart, Search,
  Star, StarOff, X, Globe
} from 'lucide-react'

interface Coin {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
  sparkline: number[]
}

interface PortfolioItem {
  id: string
  coinId: string
  symbol: string
  name: string
  amount: number
  avgBuyPrice: number
  addedAt: number
}

interface ExchangeRate {
  from: string
  to: string
  rate: number
  time: number
}

const STORAGE_PORTFOLIO = 'weblinux-finance-portfolio'
const STORAGE_WATCHLIST = 'weblinux-finance-watchlist'
const STORAGE_EXCHANGE = 'weblinux-finance-exchange'
const STORAGE_HIDE = 'weblinux-finance-hide-values'

const POPULAR_COINS = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  { id: 'solana', symbol: 'sol', name: 'Solana' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
  { id: 'tron', symbol: 'trx', name: 'TRON' },
  { id: 'polygon-ecosystem-token', symbol: 'pol', name: 'Polygon' },
]

const FIAT_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
]

function formatNumber(n: number, decimals = 2): string {
  if (n === 0) return '0.00'
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPrice(n: number): string {
  if (n < 1) return n.toFixed(4)
  if (n < 100) return n.toFixed(2)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function PortfolioChart({ data, width, height }: { data: number[]; width: number; height: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 4
  const stepX = (width - padding * 2) / (data.length - 1)

  const points = data.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + (height - padding * 2) * (1 - (v - min) / range),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = pathD + ` L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`

  const lastVal = data[data.length - 1]
  const firstVal = data[0]
  const isUp = lastVal >= firstVal
  const strokeColor = isUp ? '#22d3ee' : '#f472b6'
  const fillGradientId = 'portfolio-grad-' + (isUp ? 'up' : 'down')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={strokeColor} />
    </svg>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 32 }} />
  const width = 80
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height * (1 - (v - min) / range),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const FinanceDashboard = memo(function FinanceDashboard() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'markets' | 'portfolio' | 'exchange'>('markets')
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_WATCHLIST) || '["bitcoin","ethereum","solana"]') } catch { return ['bitcoin', 'ethereum', 'solana'] }
  })
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_PORTFOLIO) || '[]') } catch { return [] }
  })
  const [hideValues, setHideValues] = useState(() => localStorage.getItem(STORAGE_HIDE) === '1')

  const [exRates, setExRates] = useState<ExchangeRate[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_EXCHANGE) || '[]') } catch { return [] }
  })
  const [exLoading, setExLoading] = useState(false)
  const [exFrom, setExFrom] = useState('USD')
  const [exTo, setExTo] = useState('CNY')
  const [exAmount, setExAmount] = useState('1')
  const [exResult, setExResult] = useState<number | null>(null)

  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)
  const [priceHistory, setPriceHistory] = useState<{ t: number; p: number }[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [addCoinId, setAddCoinId] = useState('bitcoin')
  const [addAmount, setAddAmount] = useState('')
  const [addPrice, setAddPrice] = useState('')

  const refreshTimerRef = useRef<number | null>(null)

  const fetchCoins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h'
      )
      if (!res.ok) throw new Error(`API错误 ${res.status}`)
      const data = await res.json()
      const mapped: Coin[] = data.map((c: any) => ({
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        current_price: c.current_price,
        price_change_percentage_24h: c.price_change_percentage_24h ?? 0,
        market_cap: c.market_cap ?? 0,
        total_volume: c.total_volume ?? 0,
        image: c.image,
        sparkline: c.sparkline_in_7d?.price ?? [],
      }))
      setCoins(mapped)
    } catch (e: any) {
      setError(e.message || '数据加载失败')
      setCoins([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPriceHistory = useCallback(async (coinId: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`)
      if (!res.ok) throw new Error('获取历史数据失败')
      const data = await res.json()
      const prices: { t: number; p: number }[] = (data.prices || []).map(([t, p]: [number, number]) => ({ t, p }))
      setPriceHistory(prices)
    } catch {
      setPriceHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const fetchExchangeRate = useCallback(async () => {
    setExLoading(true)
    setExResult(null)
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${exFrom}&to=${exTo}`)
      if (!res.ok) throw new Error('汇率API错误')
      const data = await res.json()
      if (data.rates && data.rates[exTo]) {
        const rate = data.rates[exTo]
        setExResult(rate * parseFloat(exAmount || '0'))
        const newRate: ExchangeRate = { from: exFrom, to: exTo, rate, time: Date.now() }
        setExRates(prev => {
          const filtered = prev.filter(r => !(r.from === exFrom && r.to === exTo))
          const next = [newRate, ...filtered].slice(0, 8)
          localStorage.setItem(STORAGE_EXCHANGE, JSON.stringify(next))
          return next
        })
      }
    } catch (e: any) {
      setError('汇率获取失败: ' + e.message)
    } finally {
      setExLoading(false)
    }
  }, [exFrom, exTo, exAmount])

  useEffect(() => {
    fetchCoins()
    refreshTimerRef.current = window.setInterval(() => fetchCoins(), 60000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [fetchCoins])

  useEffect(() => {
    localStorage.setItem(STORAGE_PORTFOLIO, JSON.stringify(portfolio))
  }, [portfolio])

  useEffect(() => {
    localStorage.setItem(STORAGE_WATCHLIST, JSON.stringify(watchlist))
  }, [watchlist])

  useEffect(() => {
    localStorage.setItem(STORAGE_HIDE, hideValues ? '1' : '0')
  }, [hideValues])

  const filteredCoins = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const watchlistCoins = coins.filter(c => watchlist.includes(c.id))
  const displayCoins = watchlist.length > 0 && !search ? watchlistCoins : filteredCoins

  const totalPortfolioValue = portfolio.reduce((sum, item) => {
    const coin = coins.find(c => c.id === item.coinId)
    return sum + (coin ? coin.current_price * item.amount : 0)
  }, 0)

  const totalCostValue = portfolio.reduce((sum, item) => sum + item.avgBuyPrice * item.amount, 0)
  const totalProfit = totalPortfolioValue - totalCostValue
  const totalProfitPct = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0

  const portfolioHistory = (() => {
    const values: number[] = []
    portfolio.forEach(item => {
      const coin = coins.find(c => c.id === item.coinId)
      if (coin && coin.sparkline && coin.sparkline.length > 0) {
        coin.sparkline.forEach((p, i) => {
          values[i] = (values[i] || 0) + p * item.amount
        })
      }
    })
    return values.filter(v => v > 0)
  })()

  const handleSelectCoin = (coin: Coin) => {
    setSelectedCoin(coin)
    fetchPriceHistory(coin.id)
  }

  const toggleWatch = (coinId: string) => {
    setWatchlist(prev =>
      prev.includes(coinId) ? prev.filter(id => id !== coinId) : [...prev, coinId]
    )
  }

  const handleAddPortfolio = () => {
    const coin = coins.find(c => c.id === addCoinId) || POPULAR_COINS.find(c => c.id === addCoinId)
    if (!coin || !addAmount) return
    const item: PortfolioItem = {
      id: `${coin.id}-${Date.now()}`,
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount: parseFloat(addAmount),
      avgBuyPrice: parseFloat(addPrice) || 0,
      addedAt: Date.now(),
    }
    setPortfolio(prev => [...prev, item])
    setAddAmount('')
    setAddPrice('')
    setShowAddPortfolio(false)
  }

  const removePortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(p => p.id !== id))
  }

  const renderPriceChart = () => {
    if (priceHistory.length < 2) {
      return (
        <div style={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 13,
        }}>
          {historyLoading ? '加载中...' : '暂无历史数据'}
        </div>
      )
    }

    const width = 640
    const height = 180
    const padding = 20
    const prices = priceHistory.map(d => d.p)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const points = priceHistory.map((d, i) => {
      const x = padding + (i / (priceHistory.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (d.p - min) / range) * (height - padding * 2)
      return { x, y, t: d.t, p: d.p }
    })

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const areaD = pathD + ` L${width - padding},${height - padding} L${padding},${height - padding} Z`

    const firstPrice = priceHistory[0].p
    const lastPrice = priceHistory[priceHistory.length - 1].p
    const changePct = ((lastPrice - firstPrice) / firstPrice) * 100
    const isUp = changePct >= 0
    const strokeColor = isUp ? '#22d3ee' : '#f472b6'

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>7日走势</span>
          <span style={{ color: strokeColor, fontWeight: 600 }}>
            {isUp ? <ArrowUpRight size={14} style={{ display: 'inline' }} /> : <ArrowDownRight size={14} style={{ display: 'inline' }} />}
            {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
          </span>
        </div>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#chart-grad)" />
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding + pct * (height - padding * 2)
            const val = max - pct * range
            return (
              <g key={i}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={width - padding} y={y - 3} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">
                  ${formatPrice(val)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      padding: 20,
      overflowY: 'auto',
      fontFamily: 'inherit',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #f472b6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
    glass: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    statCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      padding: 16,
    },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: 700 },
    tabBar: {
      display: 'flex',
      gap: 6,
      marginBottom: 16,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      padding: '10px 16px',
      borderRadius: 9,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      transition: 'all 0.2s',
      background: 'transparent',
      color: 'rgba(255,255,255,0.55)',
    },
    tabActive: {
      background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(34,211,238,0.15)',
    },
    searchBar: {
      display: 'flex',
      gap: 10,
      marginBottom: 16,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      minWidth: 200,
      padding: '10px 14px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: '#fff',
      fontSize: 13,
      outline: 'none',
    },
    coinGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 12,
    },
    coinCard: {
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: 14,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    coinHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    coinImg: { width: 32, height: 32, borderRadius: '50%' },
    coinName: { fontSize: 15, fontWeight: 600 },
    coinSymbol: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
    coinPrice: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
    coinChange: { fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 },
    coinMeta: { display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
    refreshBtn: {
      padding: '8px 16px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    actionRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    btn: {
      padding: '8px 14px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
      border: 'none',
      color: '#0f0c29',
    },
    modal: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20,
    },
    modalContent: {
      background: 'linear-gradient(135deg, #1a1740, #2d2766)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 18,
      padding: 24,
      maxWidth: 520,
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    formGroup: { marginBottom: 14 },
    label: { fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 },
    input: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      fontSize: 14,
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      fontSize: 14,
      outline: 'none',
      cursor: 'pointer',
    },
    portfolioItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 8,
    },
    exchangeRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    swapBtn: {
      padding: '10px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      cursor: 'pointer',
    },
    rateDisplay: {
      marginTop: 16,
      padding: 16,
      borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(167,139,250,0.12))',
      border: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'center',
    },
  }

  const coinSelectOptions = coins.length > 0
    ? coins.map(c => ({ id: c.id, symbol: c.symbol, name: c.name }))
    : POPULAR_COINS

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <span style={{ fontSize: 28 }}>💎</span>
            <span>个人财务仪表盘</span>
          </div>
          <div style={styles.subtitle}>实时行情 · 投资组合 · 汇率查询 · 玻璃拟态设计</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={styles.refreshBtn} onClick={fetchCoins} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            刷新
          </button>
          <button style={styles.refreshBtn} onClick={() => setHideValues(!hideValues)}>
            {hideValues ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideValues ? '显示' : '隐藏'}
          </button>
        </div>
      </div>

      <div style={styles.statCards}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><Wallet size={14} /> 投资组合总值</div>
          <div style={styles.statValue}>
            {hideValues ? '***' : `$${formatNumber(totalPortfolioValue)}`}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><TrendingUp size={14} /> 总盈亏</div>
          <div style={{ ...styles.statValue, color: totalProfit >= 0 ? '#22d3ee' : '#f472b6' }}>
            {hideValues ? '***' : `${totalProfit >= 0 ? '+' : ''}$${formatNumber(totalProfit)} (${totalProfitPct >= 0 ? '+' : ''}${totalProfitPct.toFixed(2)}%)`}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><PiggyBank size={14} /> 总成本</div>
          <div style={styles.statValue}>
            {hideValues ? '***' : `$${formatNumber(totalCostValue)}`}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><PieChart size={14} /> 持仓数量</div>
          <div style={styles.statValue}>{portfolio.length}</div>
        </div>
      </div>

      <div style={styles.tabBar}>
        {[
          { key: 'markets' as const, label: '实时行情', icon: <Bitcoin size={14} /> },
          { key: 'portfolio' as const, label: '投资组合', icon: <Wallet size={14} /> },
          { key: 'exchange' as const, label: '汇率查询', icon: <Globe size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(244,63,94,0.12)',
          border: '1px solid rgba(244,63,94,0.3)',
          color: '#f472b6',
          fontSize: 13,
          marginBottom: 16,
        }}>{error}</div>
      )}

      {activeTab === 'markets' && (
        <>
          <div style={styles.searchBar}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                style={{ ...styles.searchInput, paddingLeft: 36 }}
                placeholder="搜索加密货币..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {watchlist.length > 0 && !search && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
                  自选 {watchlist.length} 个币种
                </span>
              )}
            </div>
          </div>

          {loading && coins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              正在加载行情数据...
            </div>
          ) : (
            <div style={styles.coinGrid}>
              {displayCoins.map(coin => {
                const change = coin.price_change_percentage_24h || 0
                const isUp = change >= 0
                const inWatch = watchlist.includes(coin.id)
                return (
                  <div
                    key={coin.id}
                    style={styles.coinCard}
                    onClick={() => handleSelectCoin(coin)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    <div style={styles.coinHeader}>
                      <img src={coin.image} alt={coin.name} style={styles.coinImg} onError={e => (e.currentTarget.style.opacity = '0.5')} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={styles.coinName}>{coin.name}</span>
                          <button
                            onClick={e => { e.stopPropagation(); toggleWatch(coin.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: inWatch ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}
                          >
                            {inWatch ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                          </button>
                        </div>
                        <div style={styles.coinSymbol}>{coin.symbol}</div>
                      </div>
                      <Sparkline data={coin.sparkline} color={isUp ? '#22d3ee' : '#f472b6'} />
                    </div>
                    <div style={styles.coinPrice}>${hideValues ? '***' : formatPrice(coin.current_price)}</div>
                    <div style={{ ...styles.coinChange, color: isUp ? '#22d3ee' : '#f472b6' }}>
                      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                      <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>24h</span>
                    </div>
                    <div style={styles.coinMeta}>
                      <span>市值 ${formatNumber(coin.market_cap)}</span>
                      <span>量 ${formatNumber(coin.total_volume)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'portfolio' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13 }}>
                持仓总值: <strong style={{ color: '#22d3ee' }}>${hideValues ? '***' : formatNumber(totalPortfolioValue)}</strong>
              </div>
              <div style={{ fontSize: 13 }}>
                盈亏: <strong style={{ color: totalProfit >= 0 ? '#22d3ee' : '#f472b6' }}>
                  {hideValues ? '***' : `${totalProfit >= 0 ? '+' : ''}$${formatNumber(totalProfit)}`}
                </strong>
              </div>
            </div>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowAddPortfolio(true)}>
              <Plus size={14} /> 添加持仓
            </button>
          </div>

          {portfolio.length > 0 && portfolioHistory.length > 0 && (
            <div style={styles.glass}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                <LineChart size={14} style={{ display: 'inline', marginRight: 6 }} />
                投资组合7日走势
              </div>
              <PortfolioChart data={portfolioHistory} width={640} height={140} />
            </div>
          )}

          {portfolio.length === 0 ? (
            <div style={{ ...styles.glass, textAlign: 'center', padding: '40px 20px' }}>
              <Wallet size={32} style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.3)' }} />
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>还没有持仓，点击上方按钮开始追踪你的投资</div>
            </div>
          ) : (
            <div>
              {portfolio.map(item => {
                const coin = coins.find(c => c.id === item.coinId)
                const currentPrice = coin?.current_price || 0
                const value = currentPrice * item.amount
                const profit = (currentPrice - item.avgBuyPrice) * item.amount
                const profitPct = item.avgBuyPrice > 0 ? ((currentPrice - item.avgBuyPrice) / item.avgBuyPrice) * 100 : 0
                const isUp = profit >= 0
                return (
                  <div key={item.id} style={styles.portfolioItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {coin?.image && <img src={coin.image} style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                          {item.amount} {item.symbol.toUpperCase()} @ ${hideValues ? '***' : formatPrice(item.avgBuyPrice)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>${hideValues ? '***' : formatNumber(value)}</div>
                        <div style={{ fontSize: 12, color: isUp ? '#22d3ee' : '#f472b6' }}>
                          {hideValues ? '***' : `${isUp ? '+' : ''}$${formatNumber(profit)} (${isUp ? '+' : ''}${profitPct.toFixed(2)}%)`}
                        </div>
                      </div>
                      <button
                        onClick={() => removePortfolio(item.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'exchange' && (
        <div style={styles.glass}>
          <div style={styles.exchangeRow}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={styles.label}>从</label>
              <select style={styles.select} value={exFrom} onChange={e => setExFrom(e.target.value)}>
                {FIAT_CURRENCIES.map(c => <option key={c.code} value={c.code} style={{ background: '#1a1740' }}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <button style={styles.swapBtn} onClick={() => { setExFrom(exTo); setExTo(exFrom) }}>⇄</button>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={styles.label}>到</label>
              <select style={styles.select} value={exTo} onChange={e => setExTo(e.target.value)}>
                {FIAT_CURRENCIES.map(c => <option key={c.code} value={c.code} style={{ background: '#1a1740' }}>{c.code} - {c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={styles.label}>金额</label>
            <input
              style={styles.input}
              type="number"
              value={exAmount}
              onChange={e => setExAmount(e.target.value)}
              placeholder="输入金额"
            />
          </div>
          <div style={styles.actionRow}>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={fetchExchangeRate} disabled={exLoading}>
              <RefreshCw size={14} style={{ animation: exLoading ? 'spin 0.8s linear infinite' : 'none' }} />
              {exLoading ? '查询中...' : '查询汇率'}
            </button>
          </div>
          {exResult !== null && (
            <div style={styles.rateDisplay}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                {exAmount} {exFrom} =
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatNumber(exResult)} {exTo}
              </div>
            </div>
          )}
          {exRates.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
                最近查询
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {exRates.map((r, i) => (
                  <div key={i} style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                  }}>
                    1 {r.from} = {r.rate.toFixed(4)} {r.to}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCoin && (
        <div style={styles.modal} onClick={() => setSelectedCoin(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={selectedCoin.image} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedCoin.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{selectedCoin.symbol}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCoin(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
              ${formatPrice(selectedCoin.current_price)}
            </div>
            <div style={{
              fontSize: 14,
              color: (selectedCoin.price_change_percentage_24h || 0) >= 0 ? '#22d3ee' : '#f472b6',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {(selectedCoin.price_change_percentage_24h || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {(selectedCoin.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
              {(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
            </div>

            {renderPriceChart()}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
              marginTop: 16,
            }}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}><PieChart size={12} /> 市值</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>${formatNumber(selectedCoin.market_cap)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}><Activity size={12} /> 24h成交量</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>${formatNumber(selectedCoin.total_volume)}</div>
              </div>
            </div>

            <div style={styles.actionRow}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={() => {
                  setAddCoinId(selectedCoin.id)
                  setShowAddPortfolio(true)
                  setSelectedCoin(null)
                }}
              >
                <Plus size={14} /> 加入持仓
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  toggleWatch(selectedCoin.id)
                }}
              >
                {watchlist.includes(selectedCoin.id) ? <StarOff size={14} /> : <Star size={14} />}
                {watchlist.includes(selectedCoin.id) ? '取消自选' : '加入自选'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPortfolio && (
        <div style={styles.modal} onClick={() => setShowAddPortfolio(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                <Wallet size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                添加持仓
              </h3>
              <button onClick={() => setShowAddPortfolio(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>选择币种</label>
              <select style={styles.select} value={addCoinId} onChange={e => setAddCoinId(e.target.value)}>
                {coinSelectOptions.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1a1740' }}>
                    {c.name} ({c.symbol.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>持有数量</label>
              <input
                style={styles.input}
                type="number"
                placeholder="例如: 0.5"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>买入均价 (USD)</label>
              <input
                style={styles.input}
                type="number"
                placeholder="例如: 30000"
                value={addPrice}
                onChange={e => setAddPrice(e.target.value)}
              />
            </div>
            <div style={styles.actionRow}>
              <button style={{ ...styles.btn, ...styles.btnPrimary, flex: 1, justifyContent: 'center' }} onClick={handleAddPortfolio}>
                <Plus size={14} /> 添加
              </button>
              <button style={{ ...styles.btn, flex: 1, justifyContent: 'center' }} onClick={() => setShowAddPortfolio(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default FinanceDashboard