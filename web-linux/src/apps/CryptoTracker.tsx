import { useState, useEffect, useMemo, useRef } from 'react'

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

type SortKey = 'marketCap' | 'price' | 'change24h' | 'volume24h' | 'name'
type SortDir = 'asc' | 'desc'

const CRYPTO_API = 'https://api.coingecko.com/api/v3'
const CACHE_KEY = 'crypto-tracker-cache'
const CACHE_TTL = 2 * 60 * 1000
const PORTFOLIO_KEY = 'crypto-tracker-portfolio'
const REFRESH_INTERVAL = 30 * 1000
const RETRY_INTERVAL = 60 * 1000

const POPULAR_CRYPTO = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'tron', name: 'TRON', symbol: 'TRX' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
  { id: 'monero', name: 'Monero', symbol: 'XMR' },
  { id: 'eos', name: 'EOS', symbol: 'EOS' },
  { id: 'the-graph', name: 'The Graph', symbol: 'GRT' },
  { id: 'aave', name: 'Aave', symbol: 'AAVE' },
]

const MOCK_CRYPTO: Crypto[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67523.42, change24h: 2.34, marketCap: 1328000000000, volume24h: 28900000000 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: -1.23, marketCap: 416000000000, volume24h: 15200000000 },
  { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', price: 567.89, change24h: 0.87, marketCap: 85000000000, volume24h: 1800000000 },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 0.5234, change24h: 3.45, marketCap: 28500000000, volume24h: 1200000000 },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.4567, change24h: -0.56, marketCap: 16000000000, volume24h: 450000000 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 172.34, change24h: 4.12, marketCap: 78000000000, volume24h: 3200000000 },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 6.89, change24h: -2.15, marketCap: 9800000000, volume24h: 280000000 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.1456, change24h: 5.67, marketCap: 21000000000, volume24h: 980000000 },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', price: 34.56, change24h: 1.89, marketCap: 13200000000, volume24h: 420000000 },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 14.23, change24h: -0.78, marketCap: 8500000000, volume24h: 260000000 },
  { id: 'tron', name: 'TRON', symbol: 'TRX', price: 0.1234, change24h: 2.12, marketCap: 10800000000, volume24h: 380000000 },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', price: 78.45, change24h: -1.45, marketCap: 5800000000, volume24h: 340000000 },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', price: 0.1123, change24h: 3.78, marketCap: 3200000000, volume24h: 110000000 },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', price: 8.67, change24h: -2.89, marketCap: 3400000000, volume24h: 98000000 },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', price: 7.89, change24h: 4.56, marketCap: 4700000000, volume24h: 180000000 },
  { id: 'monero', name: 'Monero', symbol: 'XMR', price: 156.78, change24h: 1.23, marketCap: 2800000000, volume24h: 95000000 },
  { id: 'eos', name: 'EOS', symbol: 'EOS', price: 0.7823, change24h: -3.12, marketCap: 920000000, volume24h: 68000000 },
  { id: 'the-graph', name: 'The Graph', symbol: 'GRT', price: 0.1789, change24h: 6.34, marketCap: 1600000000, volume24h: 82000000 },
  { id: 'aave', name: 'Aave', symbol: 'AAVE', price: 98.56, change24h: -0.34, marketCap: 1400000000, volume24h: 58000000 },
]

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toFixed(4)}`
}

function generateChartPoints(currentPrice: number, change24h: number, points: number = 16): { points: number[]; min: number; max: number } {
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
    const noise = (rand() - 0.5) * 0.02
    const wave = Math.sin(t * Math.PI * 3) * (Math.abs(ratio) * 0.15)
    const price = linearPrice * (1 + noise + wave)
    pricePoints.push(price)
  }
  pricePoints[pricePoints.length - 1] = currentPrice
  const min = Math.min(...pricePoints)
  const max = Math.max(...pricePoints)
  return { points: pricePoints, min, max }
}

function MiniChart({ currentPrice, change24h, width = 80, height = 28 }: { currentPrice: number; change24h: number; width?: number; height?: number }) {
  const { points, min, max } = useMemo(() => generateChartPoints(currentPrice, change24h), [currentPrice, change24h])
  const range = max - min || 1
  const color = change24h >= 0 ? '#4ade80' : '#f87171'
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((p - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const areaCoords = `0,${height} ${coords} ${width},${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polygon points={areaCoords} fill={color} opacity={0.12} />
      <polyline points={coords} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export default function CryptoTracker() {
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [portfolio, setPortfolio] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(PORTFOLIO_KEY) : null
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [showAddCrypto, setShowAddCrypto] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [fromCryptoId, setFromCryptoId] = useState('bitcoin')
  const [toCryptoId, setToCryptoId] = useState('ethereum')
  const [convertAmount, setConvertAmount] = useState<string>('1')

  const fetchFailedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
    } catch {
      // ignore
    }
  }, [portfolio])

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

  const scheduleNextFetch = (failed: boolean) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    const delay = failed ? RETRY_INTERVAL : REFRESH_INTERVAL
    timerRef.current = window.setTimeout(() => {
      fetchCryptoData()
    }, delay)
  }

  const fetchCryptoData = async () => {
    try {
      setLoading(true)
      setError(null)
      const cached = getCachedData()
      const now = Date.now()
      if (cached && now - cached.timestamp < CACHE_TTL) {
        setCryptos(cached.data)
        setLastUpdated(new Date(cached.timestamp))
        setLoading(false)
        fetchFailedRef.current = false
        scheduleNextFetch(false)
        return
      }

      const ids = POPULAR_CRYPTO.map(c => c.id).join(',')
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
      scheduleNextFetch(false)
    } catch (err) {
      console.warn('Crypto fetch failed, using fallback:', err)
      setError('获取加密货币数据失败，使用缓存/模拟数据')
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
      scheduleNextFetch(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCryptoData()
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const filteredSortedCryptos = useMemo(() => {
    const filtered = cryptos.filter(crypto =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const sorted = [...filtered].sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      switch (sortKey) {
        case 'price': va = a.price; vb = b.price; break
        case 'change24h': va = a.change24h; vb = b.change24h; break
        case 'volume24h': va = a.volume24h; vb = b.volume24h; break
        case 'name': va = a.name; vb = b.name; break
        default: va = a.marketCap; vb = b.marketCap; break
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return sorted
  }, [cryptos, searchQuery, sortKey, sortDir])

  const gainers = useMemo(() => [...cryptos].sort((a, b) => b.change24h - a.change24h).slice(0, 3), [cryptos])
  const losers = useMemo(() => [...cryptos].sort((a, b) => a.change24h - b.change24h).slice(0, 3), [cryptos])

  const portfolioValue = Object.entries(portfolio).reduce((total, [id, amount]) => {
    const crypto = cryptos.find(c => c.id === id)
    return total + (crypto ? crypto.price * amount : 0)
  }, 0)

  const addToPortfolio = (crypto: Crypto, amount: number) => {
    setPortfolio(prev => ({
      ...prev,
      [crypto.id]: (prev[crypto.id] || 0) + amount
    }))
    setShowAddCrypto(false)
  }

  const removeFromPortfolio = (id: string) => {
    setPortfolio(prev => {
      const newPortfolio = { ...prev }
      delete newPortfolio[id]
      return newPortfolio
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const fromCrypto = cryptos.find(c => c.id === fromCryptoId) || cryptos[0]
  const toCrypto = cryptos.find(c => c.id === toCryptoId) || cryptos[1]
  const convertNum = parseFloat(convertAmount) || 0
  const convertedUSD = fromCrypto ? convertNum * fromCrypto.price : 0
  const convertedTarget = fromCrypto && toCrypto && toCrypto.price > 0 ? (convertNum * fromCrypto.price) / toCrypto.price : 0

  const headerBtn = (label: string, key: SortKey, align: string = 'right') => (
    <button
      onClick={() => toggleSort(key)}
      style={{
        background: 'none',
        border: 'none',
        color: sortKey === key ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 6px',
        textAlign: align as any,
        width: '100%',
      }}
    >
      {label}{sortIndicator(key)}
    </button>
  )

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--window-bg)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--window-border)', background: 'var(--titlebar-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px' }}>🪙 加密货币追踪器</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '12px' }}>
              {lastUpdated ? `最后更新: ${formatDate(lastUpdated)}` : '加载中...'}
            </p>
          </div>
          <button
            onClick={fetchCryptoData}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔄 刷新
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索加密货币..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--window-border)',
            background: '#2a2a3e',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Portfolio Summary */}
      {Object.keys(portfolio).length > 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--accent-bg)', borderBottom: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>💼 投资组合价值</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700' }}>{formatCurrency(portfolioValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* Gainers / Losers */}
        {!loading && cryptos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(74,222,128,0.02))', borderRadius: '12px', padding: '14px', border: '1px solid var(--window-border)' }}>
              <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>📈 涨幅前 3</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gainers.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{c.symbol}</span>
                    <span style={{ color: '#4ade80', fontWeight: '600' }}>+{c.change24h.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.02))', borderRadius: '12px', padding: '14px', border: '1px solid var(--window-border)' }}>
              <div style={{ color: '#f87171', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>📉 跌幅前 3</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {losers.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{c.symbol}</span>
                    <span style={{ color: '#f87171', fontWeight: '600' }}>{c.change24h.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Section */}
        {Object.keys(portfolio).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '14px' }}>📊 我的持仓</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(portfolio).map(([id, amount]) => {
                const crypto = cryptos.find(c => c.id === id)
                if (!crypto) return null
                const value = crypto.price * amount
                return (
                  <div
                    key={id}
                    style={{
                      background: '#2a2a3e',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--window-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {crypto.image && (
                        <img src={crypto.image} alt={crypto.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      )}
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}>{crypto.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{amount} {crypto.symbol}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(value)}</div>
                        <div style={{
                          color: crypto.change24h >= 0 ? '#4ade80' : '#f87171',
                          fontSize: '12px'
                        }}>
                          {crypto.change24h >= 0 ? '↑' : '↓'} {Math.abs(crypto.change24h).toFixed(2)}%
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromPortfolio(id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'rgba(248, 113, 113, 0.2)',
                          color: '#f87171',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Market Data */}
        <div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '14px' }}>🌍 市场行情 ({filteredSortedCryptos.length})</h3>

          {loading && cryptos.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>🪙</div>
              <div>加载中...</div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', color: '#f87171', fontSize: '12px', marginBottom: '10px' }}>
                  {error}（使用缓存数据，60秒后重试）
                </div>
              )}

              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 0.7fr 0.5fr',
                gap: '8px',
                padding: '8px 10px',
                borderBottom: '1px solid var(--window-border)',
                marginBottom: '4px',
              }}>
                <div>{headerBtn('名称', 'name', 'left')}</div>
                <div style={{ textAlign: 'right' }}>{headerBtn('价格', 'price', 'right')}</div>
                <div style={{ textAlign: 'right' }}>{headerBtn('24h%', 'change24h', 'right')}</div>
                <div style={{ textAlign: 'right' }}>{headerBtn('市值', 'marketCap', 'right')}</div>
                <div style={{ textAlign: 'right' }}>{headerBtn('交易量', 'volume24h', 'right')}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', padding: '4px' }}>走势</div>
                <div></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredSortedCryptos.map(crypto => (
                  <div
                    key={crypto.id}
                    onClick={() => setSelectedCrypto(crypto)}
                    style={{
                      background: '#2a2a3e',
                      borderRadius: '10px',
                      padding: '10px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      border: '1px solid var(--window-border)',
                      display: 'grid',
                      gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 0.7fr 0.5fr',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3a3a4e'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#2a2a3e'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {crypto.image && (
                        <img src={crypto.image} alt={crypto.name} style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crypto.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{crypto.symbol}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>{formatCurrency(crypto.price)}</div>
                    <div style={{ textAlign: 'right', color: crypto.change24h >= 0 ? '#4ade80' : '#f87171', fontSize: '12px', fontWeight: '600' }}>
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '11px' }}>{formatCurrency(crypto.marketCap)}</div>
                    <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '11px' }}>{formatCurrency(crypto.volume24h)}</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MiniChart currentPrice={crypto.price} change24h={crypto.change24h} width={70} height={24} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCrypto(crypto)
                          setShowAddCrypto(true)
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--accent)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        + 添加
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Crypto Detail Modal */}
      {selectedCrypto && !showAddCrypto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setSelectedCrypto(null)}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--window-border)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedCrypto.image && (
                    <img src={selectedCrypto.image} alt={selectedCrypto.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                  )}
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px' }}>{selectedCrypto.name}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{selectedCrypto.symbol}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCrypto(null)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#3a3a4e',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {formatCurrency(selectedCrypto.price)}
                </div>
                <div style={{
                  color: selectedCrypto.change24h >= 0 ? '#4ade80' : '#f87171',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {selectedCrypto.change24h >= 0 ? '↑' : '↓'} {Math.abs(selectedCrypto.change24h).toFixed(2)}% (24h)
                </div>
              </div>

              {/* Mini Chart */}
              <div style={{ background: '#2a2a3e', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--window-border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px' }}>📊 价格走势（模拟）</div>
                <MiniChart currentPrice={selectedCrypto.price} change24h={selectedCrypto.change24h} width={440} height={100} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#2a2a3e', padding: '14px', borderRadius: '10px', border: '1px solid var(--window-border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>市值</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(selectedCrypto.marketCap)}</div>
                </div>
                <div style={{ background: '#2a2a3e', padding: '14px', borderRadius: '10px', border: '1px solid var(--window-border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>24h交易量</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(selectedCrypto.volume24h)}</div>
                </div>
              </div>

              {/* Converter */}
              {cryptos.length >= 2 && (
                <div style={{ background: '#2a2a3e', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--window-border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>🔄 币种转换器</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        placeholder="数量"
                        step="0.0001"
                        min="0"
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--window-border)',
                          background: '#1e1e2e',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <select
                        value={fromCryptoId}
                        onChange={(e) => setFromCryptoId(e.target.value)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--window-border)',
                          background: '#1e1e2e',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                          maxWidth: '110px'
                        }}
                      >
                        {cryptos.map(c => (
                          <option key={c.id} value={c.id}>{c.symbol}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>=</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--window-border)',
                        background: '#1e1e2e',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {convertedTarget.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                      </div>
                      <select
                        value={toCryptoId}
                        onChange={(e) => setToCryptoId(e.target.value)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--window-border)',
                          background: '#1e1e2e',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                          maxWidth: '110px'
                        }}
                      >
                        {cryptos.map(c => (
                          <option key={c.id} value={c.id}>{c.symbol}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', paddingTop: '4px' }}>
                      ≈ {formatCurrency(convertedUSD)} USD
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAddCrypto(true)
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                添加到投资组合
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Portfolio Modal */}
      {selectedCrypto && showAddCrypto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px',
        }} onClick={() => setShowAddCrypto(false)}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--window-border)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0' }}>添加到投资组合</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                  数量
                </label>
                <input
                  type="number"
                  id="cryptoAmount"
                  placeholder="0.00"
                  step="0.0001"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--window-border)',
                    background: '#2a2a3e',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowAddCrypto(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--window-border)',
                    background: '#2a2a3e',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('cryptoAmount') as HTMLInputElement
                    const amount = parseFloat(input.value)
                    if (amount > 0 && selectedCrypto) {
                      addToPortfolio(selectedCrypto, amount)
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
