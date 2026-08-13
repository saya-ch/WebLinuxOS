import { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  TrendingUp, TrendingDown, RefreshCw, Globe, Bitcoin,
  BarChart3, Activity, Star, StarOff,
  ArrowUpRight, ArrowDownRight, Search, Settings,
  DollarSign, Flame, Eye, EyeOff,
  X, Zap
} from 'lucide-react'

// ==================== 类型定义 ====================
interface ExchangeRate {
  code: string
  name: string
  rate: number
  change: number
  time: number
}

interface CryptoAsset {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

interface StockIndex {
  code: string
  name: string
  region: string
  value: number
  change: number
  changePct: number
}

interface Commodity {
  code: string
  name: string
  price: number
  change: number
  unit: string
}

interface EconomicIndicator {
  country: string
  flag: string
  gdp: number
  inflation: number
  unemployment: number
  interestRate: number
}

interface HeatmapCell {
  label: string
  value: number
  change: number
  color: string
}

// ==================== 常量 ====================
const FIAT_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
]

const CRYPTO_LIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
  { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'Polygon' },
]

const STOCK_INDICES: StockIndex[] = [
  { code: 'SPX', name: 'S&P 500', region: '美国', value: 5842.13, change: 31.42, changePct: 0.54 },
  { code: 'DJI', name: '道琼斯', region: '美国', value: 42305.8, change: -85.3, changePct: -0.2 },
  { code: 'IXIC', name: '纳斯达克', region: '美国', value: 18490.47, change: 125.3, changePct: 0.68 },
  { code: 'HSI', name: '恒生指数', region: '香港', value: 19847.2, change: 215.6, changePct: 1.1 },
  { code: 'SSE', name: '上证指数', region: '中国', value: 3372.05, change: -18.2, changePct: -0.54 },
  { code: 'SZSE', name: '深证成指', region: '中国', value: 10438.3, change: 62.1, changePct: 0.6 },
  { code: 'FTSE', name: '富时100', region: '英国', value: 8215.6, change: 24.8, changePct: 0.3 },
  { code: 'DAX', name: '德国DAX', region: '德国', value: 19657.3, change: -45.2, changePct: -0.23 },
  { code: 'N225', name: '日经225', region: '日本', value: 38465.8, change: 187.5, changePct: 0.49 },
  { code: 'KOSPI', name: '韩国综合', region: '韩国', value: 2687.44, change: -8.3, changePct: -0.31 },
]

const COMMODITIES: Commodity[] = [
  { code: 'GOLD', name: '黄金', price: 2658.5, change: 12.3, unit: 'USD/oz' },
  { code: 'SILVER', name: '白银', price: 31.24, change: -0.42, unit: 'USD/oz' },
  { code: 'OIL', name: '原油(WTI)', price: 71.38, change: 0.85, unit: 'USD/bbl' },
  { code: 'BRENT', name: '布伦特原油', price: 74.92, change: 1.12, unit: 'USD/bbl' },
  { code: 'NATGAS', name: '天然气', price: 2.43, change: -0.08, unit: 'USD/MMBtu' },
  { code: 'COPPER', name: '铜', price: 462.8, change: 3.5, unit: 'USD/lb' },
  { code: 'WHEAT', name: '小麦', price: 568.3, change: -2.1, unit: 'USc/bu' },
  { code: 'CORN', name: '玉米', price: 412.5, change: 1.8, unit: 'USc/bu' },
]

const ECONOMIC_INDICATORS: EconomicIndicator[] = [
  { country: '美国', flag: '🇺🇸', gdp: 2.8, inflation: 2.5, unemployment: 4.1, interestRate: 5.25 },
  { country: '中国', flag: '🇨🇳', gdp: 4.8, inflation: 0.4, unemployment: 5.1, interestRate: 3.45 },
  { country: '欧元区', flag: '🇪🇺', gdp: 0.8, inflation: 2.6, unemployment: 6.5, interestRate: 4.25 },
  { country: '日本', flag: '🇯🇵', gdp: 1.0, inflation: 2.8, unemployment: 2.6, interestRate: 0.25 },
  { country: '英国', flag: '🇬🇧', gdp: 0.3, inflation: 2.3, unemployment: 4.3, interestRate: 5.0 },
  { country: '印度', flag: '🇮🇳', gdp: 6.8, inflation: 5.1, unemployment: 7.9, interestRate: 6.5 },
  { country: '巴西', flag: '🇧🇷', gdp: 2.1, inflation: 4.2, unemployment: 7.8, interestRate: 10.75 },
  { country: '俄罗斯', flag: '🇷🇺', gdp: 3.2, inflation: 8.6, unemployment: 2.6, interestRate: 16.0 },
]

const STORAGE_KEYS = {
  favorites: 'weblinux-geo-favorites',
  refreshInterval: 'weblinux-geo-refresh',
  hideValues: 'weblinux-geo-hide',
  baseCurrency: 'weblinux-geo-base',
}

// ==================== 工具函数 ====================
function formatNumber(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPrice(n: number): string {
  if (!isFinite(n)) return '—'
  if (n < 1) return n.toFixed(4)
  if (n < 100) return n.toFixed(2)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPct(n: number): string {
  if (!isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

function changeColor(change: number): string {
  return change >= 0 ? '#22d3ee' : '#f472b6'
}

function heatColor(change: number): string {
  if (change >= 2) return 'rgba(34,211,238,0.85)'
  if (change >= 1) return 'rgba(34,211,238,0.65)'
  if (change >= 0) return 'rgba(34,211,238,0.25)'
  if (change >= -1) return 'rgba(244,114,182,0.25)'
  if (change >= -2) return 'rgba(244,114,182,0.65)'
  return 'rgba(244,114,182,0.85)'
}

// ==================== 组件 ====================
const GlobalEconomicDashboard = memo(function GlobalEconomicDashboard() {
  const [baseCurrency, setBaseCurrency] = useState(
    () => localStorage.getItem(STORAGE_KEYS.baseCurrency) || 'USD'
  )
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '["bitcoin","ethereum"]') } catch { return ['bitcoin', 'ethereum'] }
  })
  const [hideValues, setHideValues] = useState(
    () => localStorage.getItem(STORAGE_KEYS.hideValues) === '1'
  )
  const [refreshInterval, setRefreshInterval] = useState(
    () => parseInt(localStorage.getItem(STORAGE_KEYS.refreshInterval) || '60', 10)
  )

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([])
  const [stockIndices, setStockIndices] = useState<StockIndex[]>(STOCK_INDICES)
  const [commodityData, setCommodityData] = useState<Commodity[]>(COMMODITIES)
  const [econIndicators] = useState<EconomicIndicator[]>(ECONOMIC_INDICATORS)

  const [exLoading, setExLoading] = useState(false)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'exchange' | 'crypto' | 'stocks' | 'commodities' | 'heatmap' | 'indicators'>('exchange')
  const [showSettings, setShowSettings] = useState(false)

  const refreshTimerRef = useRef<number | null>(null)

  // ========== 数据获取：汇率 ==========
  const fetchExchangeRates = useCallback(async () => {
    setExLoading(true)
    setError('')
    try {
      const targets = FIAT_CURRENCIES.filter(c => c.code !== baseCurrency).map(c => c.code).join(',')
      const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${targets}`)
      if (!res.ok) throw new Error(`汇率 API 错误 ${res.status}`)
      const data = await res.json()
      const today = data.date ? new Date(data.date) : new Date()
      const rates: ExchangeRate[] = FIAT_CURRENCIES
        .filter(c => c.code !== baseCurrency)
        .map(c => {
          const rate = data.rates?.[c.code] ?? 0
          return {
            code: c.code,
            name: c.name,
            rate,
            change: 0,
            time: today.getTime(),
          }
        })
      setExchangeRates(prev => {
        if (prev.length === 0) return rates
        return rates.map(r => {
          const old = prev.find(p => p.code === r.code)
          const change = old ? ((r.rate - old.rate) / old.rate) * 100 : 0
          return { ...r, change }
        })
      })
    } catch (e: any) {
      setError('汇率获取失败: ' + (e.message || '未知错误'))
    } finally {
      setExLoading(false)
      setLastUpdate(new Date())
    }
  }, [baseCurrency])

  // ========== 数据获取：加密货币 ==========
  const fetchCrypto = useCallback(async () => {
    setCryptoLoading(true)
    setError('')
    try {
      const ids = CRYPTO_LIST.map(c => c.id).join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      )
      if (!res.ok) throw new Error(`加密货币 API 错误 ${res.status}`)
      const data = await res.json()
      const mapped: CryptoAsset[] = CRYPTO_LIST.map(c => {
        const raw = data[c.id] || {}
        return {
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          price: raw.usd ?? 0,
          change24h: raw.usd_24h_change ?? 0,
          marketCap: raw.usd_market_cap ?? 0,
          volume24h: raw.usd_24h_vol ?? 0,
        }
      }).filter(c => c.price > 0)
      setCryptoAssets(mapped)
    } catch (e: any) {
      setError('加密货币数据获取失败: ' + (e.message || '未知错误'))
    } finally {
      setCryptoLoading(false)
    }
  }, [])

  // ========== 模拟股票指数更新 ==========
  const simulateMarketUpdate = useCallback(() => {
    setStockIndices(prev => prev.map(idx => {
      const volatility = 0.01
      const drift = (Math.random() - 0.5) * 2
      const changePct = idx.changePct + drift * volatility * 100
      const change = (idx.value * changePct) / 100
      return { ...idx, changePct, change, value: idx.value + change }
    }))
    setCommodityData(prev => prev.map(c => {
      const volatility = 0.005
      const changePct = (Math.random() - 0.5) * 2
      const change = c.price * changePct * volatility
      return { ...c, change, price: c.price + change }
    }))
  }, [])

  // ========== 全量刷新 ==========
  const refreshAll = useCallback(() => {
    fetchExchangeRates()
    fetchCrypto()
    simulateMarketUpdate()
  }, [fetchExchangeRates, fetchCrypto, simulateMarketUpdate])

  // ========== 初始化 & 定时刷新 ==========
  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    refreshTimerRef.current = window.setInterval(refreshAll, refreshInterval * 1000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [refreshAll, refreshInterval])

  // ========== 本地存储持久化 ==========
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.refreshInterval, String(refreshInterval)) }, [refreshInterval])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.hideValues, hideValues ? '1' : '0') }, [hideValues])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.baseCurrency, baseCurrency) }, [baseCurrency])

  // ========== 操作函数 ==========
  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  const filteredRates = exchangeRates.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
  )
  const filteredCrypto = cryptoAssets.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  // ========== 热力图数据 ==========
  const heatmapData: HeatmapCell[] = [
    ...cryptoAssets.map(c => ({
      label: c.symbol,
      value: c.price,
      change: c.change24h,
      color: heatColor(c.change24h),
    })),
    ...stockIndices.map(s => ({
      label: s.code,
      value: s.value,
      change: s.changePct,
      color: heatColor(s.changePct),
    })),
    ...commodityData.map(c => ({
      label: c.code,
      value: c.price,
      change: (c.change / c.price) * 100,
      color: heatColor((c.change / c.price) * 100),
    })),
  ]

  // ========== 统计数据 ==========
  const totalMarketCap = cryptoAssets.reduce((sum, c) => sum + c.marketCap, 0)
  const gainers = cryptoAssets.filter(c => c.change24h > 0).length
  const losers = cryptoAssets.filter(c => c.change24h < 0).length
  const avgChange = cryptoAssets.length > 0
    ? cryptoAssets.reduce((sum, c) => sum + c.change24h, 0) / cryptoAssets.length
    : 0

  // ========== 样式 ==========
  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 40%, #0d1b2a 100%)',
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
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
    statCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: 16,
      transition: 'all 0.2s',
    },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: 700 },
    tabBar: {
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: 4,
      overflowX: 'auto',
      flexWrap: 'nowrap',
    },
    tab: {
      flex: 1,
      minWidth: 100,
      padding: '10px 12px',
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
      color: 'rgba(255,255,255,0.5)',
      whiteSpace: 'nowrap',
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
    card: {
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    gridExchange: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 10,
    },
    gridCrypto: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 12,
    },
    gridStocks: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 10,
    },
    gridCommodities: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 10,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      gap: 12,
    },
    rowLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    rowName: { fontSize: 14, fontWeight: 600 },
    rowSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    rowPrice: { fontSize: 16, fontWeight: 700 },
    rowChange: { fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 },
    heatmapGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: 8,
    },
    heatCell: {
      padding: '16px 12px',
      borderRadius: 12,
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'transform 0.2s',
      cursor: 'default',
    },
    heatLabel: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
    heatValue: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
    heatChange: { fontSize: 11, fontWeight: 600 },
    indicatorGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 12,
    },
    indicatorCard: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: 18,
    },
    indicatorHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      paddingBottom: 10,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    indicatorFlag: { fontSize: 24 },
    indicatorName: { fontSize: 16, fontWeight: 700 },
    indicatorRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      fontSize: 13,
    },
    indicatorLabel: { color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 6 },
    indicatorValue: { fontWeight: 600 },
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
      maxWidth: 480,
      width: '100%',
    },
    settingsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    settingsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    select: {
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      fontSize: 13,
      outline: 'none',
      cursor: 'pointer',
    },
    loading: {
      textAlign: 'center',
      padding: 40,
      color: 'rgba(255,255,255,0.5)',
    },
    errorBanner: {
      padding: '10px 14px',
      borderRadius: 10,
      background: 'rgba(244,63,94,0.12)',
      border: '1px solid rgba(244,63,94,0.3)',
      color: '#fca5a5',
      fontSize: 13,
      marginBottom: 16,
    },
    badge: {
      padding: '3px 8px',
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  }

  // ========== 渲染函数 ==========
  const renderExchangeRates = () => (
    <div>
      <div style={styles.searchBar}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            style={{ ...styles.searchInput, paddingLeft: 36 }}
            placeholder="搜索货币..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>基准:</span>
          <select
            style={styles.select}
            value={baseCurrency}
            onChange={e => setBaseCurrency(e.target.value)}
          >
            {FIAT_CURRENCIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: '#1a1740' }}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      {exLoading && exchangeRates.length === 0 ? (
        <div style={styles.loading}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          正在加载汇率数据...
        </div>
      ) : (
        <div style={styles.gridExchange}>
          {filteredRates.map(r => {
            const currency = FIAT_CURRENCIES.find(c => c.code === r.code)
            const isUp = r.change >= 0
            return (
              <div key={r.code} style={styles.row}>
                <div style={styles.rowLeft}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                  }}>
                    {r.code.slice(0, 3)}
                  </div>
                  <div>
                    <div style={styles.rowName}>{currency?.name || r.name}</div>
                    <div style={styles.rowSub}>{r.code}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.rowPrice}>
                    {hideValues ? '***' : r.rate.toFixed(4)}
                  </div>
                  <div style={{ ...styles.rowChange, color: changeColor(r.change) }}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {formatPct(r.change)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderCrypto = () => (
    <div>
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
      </div>
      {cryptoLoading && cryptoAssets.length === 0 ? (
        <div style={styles.loading}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          正在加载加密货币数据...
        </div>
      ) : (
        <div style={styles.gridCrypto}>
          {filteredCrypto.map(c => {
            const isUp = c.change24h >= 0
            const isFav = favorites.includes(c.id)
            return (
              <div key={c.id} style={{ ...styles.row, flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={styles.rowLeft}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f7931a, #627eea)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11, color: '#fff',
                    }}>
                      {c.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div style={styles.rowName}>{c.name}</div>
                      <div style={styles.rowSub}>{c.symbol}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isFav ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}
                  >
                    {isFav ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                  <div style={styles.rowPrice}>${hideValues ? '***' : formatPrice(c.price)}</div>
                  <div style={{ ...styles.rowChange, color: changeColor(c.change24h) }}>
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {formatPct(c.change24h)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  <span>市值 ${formatNumber(c.marketCap)}</span>
                  <span>量 ${formatNumber(c.volume24h)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderStocks = () => (
    <div style={styles.gridStocks}>
      {stockIndices.map(idx => {
        const isUp = idx.changePct >= 0
        return (
          <div key={idx.code} style={styles.row}>
            <div style={styles.rowLeft}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: isUp
                  ? 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.05))'
                  : 'linear-gradient(135deg, rgba(244,114,182,0.25), rgba(244,114,182,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isUp ? <TrendingUp size={18} color="#22d3ee" /> : <TrendingDown size={18} color="#f472b6" />}
              </div>
              <div>
                <div style={styles.rowName}>{idx.name}</div>
                <div style={styles.rowSub}>{idx.region} · {idx.code}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.rowPrice}>{hideValues ? '***' : idx.value.toFixed(2)}</div>
              <div style={{ ...styles.rowChange, color: changeColor(idx.changePct) }}>
                {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {formatPct(idx.changePct)} ({idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)})
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderCommodities = () => (
    <div style={styles.gridCommodities}>
      {commodityData.map(c => {
        const pct = (c.change / c.price) * 100
        const isUp = pct >= 0
        return (
          <div key={c.code} style={styles.row}>
            <div style={styles.rowLeft}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Flame size={16} color="#fbbf24" />
              </div>
              <div>
                <div style={styles.rowName}>{c.name}</div>
                <div style={styles.rowSub}>{c.unit}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.rowPrice}>{hideValues ? '***' : formatPrice(c.price)}</div>
              <div style={{ ...styles.rowChange, color: changeColor(pct) }}>
                {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {formatPct(pct)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderHeatmap = () => (
    <div>
      <div style={{ ...styles.card, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} /> 市场热力图 - 颜色反映涨跌幅度
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(34,211,238,0.85)' }} /> 涨 {'> 2%'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(34,211,238,0.65)' }} /> 涨 {'> 1%'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(34,211,238,0.25)' }} /> 涨 0-1%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(244,114,182,0.25)' }} /> 跌 0-1%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(244,114,182,0.65)' }} /> 跌 {'> 1%'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(244,114,182,0.85)' }} /> 跌 {'> 2%'}
          </span>
        </div>
      </div>
      <div style={styles.heatmapGrid}>
        {heatmapData.map((cell, i) => (
          <div
            key={`${cell.label}-${i}`}
            style={{ ...styles.heatCell, background: cell.color }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={styles.heatLabel}>{cell.label}</div>
            <div style={styles.heatValue}>${hideValues ? '***' : formatNumber(cell.value)}</div>
            <div style={{ ...styles.heatChange, color: cell.change >= 0 ? '#fff' : '#fff', opacity: 0.9 }}>
              {formatPct(cell.change)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderIndicators = () => (
    <div style={styles.indicatorGrid}>
      {econIndicators.map(ind => (
        <div key={ind.country} style={styles.indicatorCard}>
          <div style={styles.indicatorHeader}>
            <span style={styles.indicatorFlag}>{ind.flag}</span>
            <span style={styles.indicatorName}>{ind.country}</span>
          </div>
          <div style={styles.indicatorRow}>
            <span style={styles.indicatorLabel}><TrendingUp size={13} /> GDP 增速</span>
            <span style={{ ...styles.indicatorValue, color: ind.gdp >= 3 ? '#22d3ee' : ind.gdp >= 1 ? '#a78bfa' : '#f472b6' }}>
              {ind.gdp.toFixed(1)}%
            </span>
          </div>
          <div style={styles.indicatorRow}>
            <span style={styles.indicatorLabel}><BarChart3 size={13} /> 通胀率</span>
            <span style={{ ...styles.indicatorValue, color: ind.inflation <= 3 ? '#22d3ee' : ind.inflation <= 6 ? '#fbbf24' : '#f472b6' }}>
              {ind.inflation.toFixed(1)}%
            </span>
          </div>
          <div style={styles.indicatorRow}>
            <span style={styles.indicatorLabel}><Activity size={13} /> 失业率</span>
            <span style={{ ...styles.indicatorValue, color: ind.unemployment <= 4 ? '#22d3ee' : ind.unemployment <= 7 ? '#fbbf24' : '#f472b6' }}>
              {ind.unemployment.toFixed(1)}%
            </span>
          </div>
          <div style={styles.indicatorRow}>
            <span style={styles.indicatorLabel}><DollarSign size={13} /> 利率</span>
            <span style={styles.indicatorValue}>{ind.interestRate.toFixed(2)}%</span>
          </div>
        </div>
      ))}
    </div>
  )

  const tabs = [
    { key: 'exchange' as const, label: '汇率', icon: <Globe size={14} /> },
    { key: 'crypto' as const, label: '加密货币', icon: <Bitcoin size={14} /> },
    { key: 'stocks' as const, label: '股指', icon: <TrendingUp size={14} /> },
    { key: 'commodities' as const, label: '大宗商品', icon: <Flame size={14} /> },
    { key: 'heatmap' as const, label: '热力图', icon: <Zap size={14} /> },
    { key: 'indicators' as const, label: '经济指标', icon: <BarChart3 size={14} /> },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <span style={{ fontSize: 28 }}>🌍</span>
            <span>全球经济仪表板</span>
          </div>
          <div style={styles.subtitle}>
            实时汇率 · 加密货币 · 股指 · 大宗商品 · 经济指标
            {lastUpdate && ` · 更新于 ${lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={styles.refreshBtn} onClick={refreshAll} disabled={exLoading || cryptoLoading}>
            <RefreshCw size={14} style={{ animation: (exLoading || cryptoLoading) ? 'spin 0.8s linear infinite' : 'none' }} />
            刷新
          </button>
          <button style={styles.refreshBtn} onClick={() => setHideValues(!hideValues)}>
            {hideValues ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideValues ? '显示' : '隐藏'}
          </button>
          <button style={styles.refreshBtn} onClick={() => setShowSettings(true)}>
            <Settings size={14} /> 设置
          </button>
        </div>
      </div>

      <div style={styles.statCards}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><Bitcoin size={14} /> 加密货币总市值</div>
          <div style={styles.statValue}>
            {hideValues ? '***' : `$${formatNumber(totalMarketCap)}`}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><TrendingUp size={14} /> 市场平均涨跌</div>
          <div style={{ ...styles.statValue, color: changeColor(avgChange) }}>
            {hideValues ? '***' : formatPct(avgChange)}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><ArrowUpRight size={14} /> 上涨币种</div>
          <div style={{ ...styles.statValue, color: '#22d3ee' }}>{gainers}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}><ArrowDownRight size={14} /> 下跌币种</div>
          <div style={{ ...styles.statValue, color: '#f472b6' }}>{losers}</div>
        </div>
      </div>

      <div style={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {activeTab === 'exchange' && renderExchangeRates()}
      {activeTab === 'crypto' && renderCrypto()}
      {activeTab === 'stocks' && renderStocks()}
      {activeTab === 'commodities' && renderCommodities()}
      {activeTab === 'heatmap' && renderHeatmap()}
      {activeTab === 'indicators' && renderIndicators()}

      {showSettings && (
        <div style={styles.modal} onClick={() => setShowSettings(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} /> 仪表板设置
              </h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.settingsRow}>
              <span style={styles.settingsLabel}><Globe size={14} style={{ display: 'inline', marginRight: 6 }} /> 基准货币</span>
              <select
                style={styles.select}
                value={baseCurrency}
                onChange={e => setBaseCurrency(e.target.value)}
              >
                {FIAT_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: '#1a1740' }}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.settingsRow}>
              <span style={styles.settingsLabel}><RefreshCw size={14} style={{ display: 'inline', marginRight: 6 }} /> 自动刷新间隔</span>
              <select
                style={styles.select}
                value={refreshInterval}
                onChange={e => setRefreshInterval(parseInt(e.target.value, 10))}
              >
                {[30, 60, 120, 300, 600].map(v => (
                  <option key={v} value={v} style={{ background: '#1a1740' }}>
                    {v < 60 ? `${v} 秒` : `${v / 60} 分钟`}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.settingsRow}>
              <span style={styles.settingsLabel}><Eye size={14} style={{ display: 'inline', marginRight: 6 }} /> 隐藏敏感数值</span>
              <button
                style={{
                  ...styles.select,
                  cursor: 'pointer',
                  background: hideValues ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)',
                }}
                onClick={() => setHideValues(!hideValues)}
              >
                {hideValues ? '已隐藏' : '已显示'}
              </button>
            </div>
            <div style={{ ...styles.settingsRow, borderBottom: 'none' }}>
              <span style={styles.settingsLabel}><Star size={14} style={{ display: 'inline', marginRight: 6 }} /> 自选列表</span>
              <span style={styles.settingsLabel}>{favorites.length} 个币种</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default GlobalEconomicDashboard