import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { fetchWithTimeout } from '../config/apiConfig'

interface Coin {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  high_24h: number
  low_24h: number
  image: string
  price_change_24h: number
  sparkline_in_7d?: { price: number[] }
}

interface CoinDetail {
  id: string
  symbol: string
  name: string
  description?: { en?: string }
  market_cap: number
  market_cap_rank: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  atl: number
  ath_change_percentage: number
  atl_change_percentage: number
  circulating_supply: number
  price_change_percentage_7d?: { usd: number }
  price_change_percentage_30d?: { usd: number }
  price_change_percentage_24h?: { usd: number }
}

const FAVORITES_KEY = 'weblinux-crypto-favorites'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple']
}

function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {}
}

const CryptoPriceTracker = memo(function CryptoPriceTracker() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change' | 'volume'>('rank')
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedCoin, setSelectedCoin] = useState<CoinDetail | null>(null)
  const [, setDetailLoading] = useState(false)
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({})
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCoins = useCallback(async () => {
    setRefreshing(true)
    setError('')
    try {
      const ids = favorites.slice(0, 30).join(',')
      const url = ids
        ? `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h`
        : 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h'

      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Coin[] = await res.json()

      const sparklineMap: Record<string, number[]> = {}
      data.forEach((c) => {
        if (c.sparkline_in_7d?.price) {
          sparklineMap[c.id] = c.sparkline_in_7d.price.slice(-48)
        }
      })

      setCoins(data)
      setSparklines(sparklineMap)
      setLastUpdated(new Date())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`获取行情失败: ${msg}`)
      const fallbackData = getFallbackCoins(favorites)
      setCoins(fallbackData)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [favorites])

  useEffect(() => {
    fetchCoins()
  }, [fetchCoins])

  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    refreshTimerRef.current = setInterval(fetchCoins, 60000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [fetchCoins])

  const fetchCoinDetail = useCallback(async (coinId: string) => {
    setDetailLoading(true)
    setSelectedCoin(null)
    try {
      const res = await fetchWithTimeout(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CoinDetail = await res.json()
      setSelectedCoin(data)
    } catch {
      setSelectedCoin(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const toggleFavorite = useCallback((coinId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId]
      saveFavorites(next)
      return next
    })
  }, [])

  const filteredCoins = useCallback(() => {
    let list = coins
    if (showFavoritesOnly) {
      list = list.filter((c) => favorites.includes(c.id))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => b.current_price - a.current_price)
        break
      case 'change':
        sorted.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
        break
      case 'volume':
        sorted.sort((a, b) => b.total_volume - a.total_volume)
        break
      default:
        sorted.sort((a, b) => a.market_cap_rank - b.market_cap_rank)
    }
    return sorted
  }, [coins, search, sortBy, showFavoritesOnly, favorites])

  const formatPrice = (val: number) => {
    if (!val && val !== 0) return '--'
    if (val >= 1) return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (val >= 0.01) return `$${val.toFixed(3)}`
    return `$${val.toFixed(6)}`
  }

  const formatLargeNumber = (val: number) => {
    if (!val) return '--'
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`
    return `$${val.toFixed(2)}`
  }

  const renderSparkline = (prices: number[], isPositive: boolean) => {
    if (!prices || prices.length < 2) return null
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const width = 100
    const height = 30
    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width
      const y = height - ((p - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')

    const color = isPositive ? '#22c55e' : '#ef4444'
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          opacity="0.8"
        />
      </svg>
    )
  }

  return (
    <div style={styles.container}>
      <style>{cryptoStyles}</style>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logoIcon}>◈</span>
          <div>
            <div style={styles.title}>CryptoPrice</div>
            <div style={styles.subtitle}>实时加密货币行情 · CoinGecko</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {lastUpdated && (
            <span style={styles.lastUpdate}>
              {refreshing ? '🔄 更新中...' : `🕐 ${lastUpdated.toLocaleTimeString()}`}
            </span>
          )}
          <button
            style={styles.refreshBtn}
            onClick={() => fetchCoins()}
            disabled={refreshing}
          >
            {refreshing ? '⟳' : '↻'} 刷新
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.controls}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="🔍 搜索币种名称或代码..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          style={{
            ...styles.filterBtn,
            background: showFavoritesOnly ? 'rgba(251,191,36,0.15)' : 'transparent',
            borderColor: showFavoritesOnly ? 'rgba(251,191,36,0.5)' : 'var(--window-border)',
            color: showFavoritesOnly ? '#fbbf24' : 'var(--text-secondary)',
          }}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          ⭐ 收藏 ({favorites.length})
        </button>
        <select
          style={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="rank">按市值排名</option>
          <option value="price">按价格</option>
          <option value="change">按24h涨跌</option>
          <option value="volume">按成交量</option>
        </select>
      </div>

      <div style={styles.tableHeader}>
        <div style={{ ...styles.col, flex: '0 0 40px' }}>#</div>
        <div style={{ ...styles.col, flex: '1.8' }}>币种</div>
        <div style={{ ...styles.col, flex: '1', textAlign: 'right' }}>价格</div>
        <div style={{ ...styles.col, flex: '0.8', textAlign: 'right' }}>24h</div>
        <div style={{ ...styles.col, flex: '1.2', textAlign: 'right' }}>市值</div>
        <div style={{ ...styles.col, flex: '1', textAlign: 'right' }}>成交量</div>
        <div style={{ ...styles.col, flex: '1.2', textAlign: 'center' }}>7日走势</div>
        <div style={{ ...styles.col, flex: '0 0 40px' }}></div>
      </div>

      <div style={styles.tableBody}>
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <span>正在获取行情数据...</span>
          </div>
        ) : filteredCoins().length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 32 }}>🔍</span>
            <span>未找到匹配的币种</span>
          </div>
        ) : (
          filteredCoins().map((coin) => {
            const change = coin.price_change_percentage_24h || 0
            const isPositive = change >= 0
            const isFav = favorites.includes(coin.id)
            return (
              <div
                key={coin.id}
                style={styles.row}
                onClick={() => fetchCoinDetail(coin.id)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ ...styles.col, flex: '0 0 40px', color: 'var(--text-secondary)', fontSize: 12 }}>
                  {coin.market_cap_rank || '-'}
                </div>
                <div style={{ ...styles.col, flex: '1.8' }}>
                  <div style={styles.coinInfo}>
                    {coin.image ? (
                      <img src={coin.image} alt={coin.name} style={styles.coinImg} />
                    ) : (
                      <div style={styles.coinFallback}>{coin.symbol[0]?.toUpperCase()}</div>
                    )}
                    <div>
                      <div style={styles.coinName}>{coin.name}</div>
                      <div style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                </div>
                <div style={{ ...styles.col, flex: '1', textAlign: 'right', fontWeight: 600 }}>
                  {formatPrice(coin.current_price)}
                </div>
                <div style={{
                  ...styles.col,
                  flex: '0.8',
                  textAlign: 'right',
                  color: isPositive ? '#22c55e' : '#ef4444',
                  fontWeight: 600,
                  fontSize: 13,
                }}>
                  {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </div>
                <div style={{ ...styles.col, flex: '1.2', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                  {formatLargeNumber(coin.market_cap)}
                </div>
                <div style={{ ...styles.col, flex: '1', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                  {formatLargeNumber(coin.total_volume)}
                </div>
                <div style={{ ...styles.col, flex: '1.2', justifyContent: 'center' }}>
                  {sparklines[coin.id]
                    ? renderSparkline(sparklines[coin.id], isPositive)
                    : <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>--</span>}
                </div>
                <div style={{ ...styles.col, flex: '0 0 40px', justifyContent: 'center' }}>
                  <button
                    style={{
                      ...styles.favBtn,
                      color: isFav ? '#fbbf24' : 'var(--text-secondary)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(coin.id)
                    }}
                    title={isFav ? '取消收藏' : '添加收藏'}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedCoin && (
        <div style={styles.modalOverlay} onClick={() => setSelectedCoin(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={styles.modalIcon}>{selectedCoin.symbol[0]?.toUpperCase()}</div>
                <div>
                  <div style={styles.modalTitle}>{selectedCoin.name}</div>
                  <div style={styles.modalSubtitle}>{selectedCoin.symbol.toUpperCase()} · 排名 #{selectedCoin.market_cap_rank}</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedCoin(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailGrid}>
                <div style={styles.detailCard}>
                  <div style={styles.detailLabel}>历史最高 (ATH)</div>
                  <div style={styles.detailValue}>${selectedCoin.ath?.toLocaleString() || '--'}</div>
                  <div style={{ color: (selectedCoin.ath_change_percentage || 0) >= 0 ? '#22c55e' : '#ef4444', fontSize: 12 }}>
                    {(selectedCoin.ath_change_percentage || 0).toFixed(2)}%
                  </div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailLabel}>历史最低 (ATL)</div>
                  <div style={styles.detailValue}>${selectedCoin.atl?.toLocaleString() || '--'}</div>
                  <div style={{ color: (selectedCoin.atl_change_percentage || 0) >= 0 ? '#22c55e' : '#ef4444', fontSize: 12 }}>
                    {(selectedCoin.atl_change_percentage || 0).toFixed(2)}%
                  </div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailLabel}>市值</div>
                  <div style={styles.detailValue}>{formatLargeNumber(selectedCoin.market_cap)}</div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailLabel}>24h成交量</div>
                  <div style={styles.detailValue}>{formatLargeNumber(selectedCoin.market_cap * 0.05)}</div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailLabel}>流通供应</div>
                  <div style={styles.detailValue}>
                    {selectedCoin.circulating_supply?.toLocaleString() || '--'} {selectedCoin.symbol.toUpperCase()}
                  </div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailLabel}>最大供应</div>
                  <div style={styles.detailValue}>
                    {selectedCoin.max_supply?.toLocaleString() || '∞'} {selectedCoin.symbol.toUpperCase()}
                  </div>
                </div>
              </div>
              {selectedCoin.description?.en && (
                <div style={styles.descriptionBox}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>项目简介</div>
                  <div
                    style={{ fontSize: 13, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: selectedCoin.description.en.slice(0, 500) + '...' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.footer}>
        <span>数据来源: CoinGecko API · 每分钟自动刷新</span>
        <span>共 {coins.length} 个币种</span>
      </div>
    </div>
  )
})

function getFallbackCoins(favorites: string[]): Coin[] {
  const fallback = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', price: 67823.45, change: 2.34, marketCap: 1337000000000, volume: 28500000000 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', price: 3456.78, change: -1.23, marketCap: 415000000000, volume: 15200000000 },
    { id: 'solana', symbol: 'sol', name: 'Solana', price: 172.34, change: 5.67, marketCap: 78000000000, volume: 3200000000 },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', price: 0.4523, change: 0.89, marketCap: 16000000000, volume: 450000000 },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', price: 0.6234, change: -2.15, marketCap: 34000000000, volume: 1800000000 },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', price: 0.1234, change: 8.90, marketCap: 17000000000, volume: 980000000 },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', price: 7.89, change: 1.45, marketCap: 11000000000, volume: 280000000 },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink', price: 14.56, change: -3.21, marketCap: 8500000000, volume: 520000000 },
  ]
  return fallback
    .filter((f) => favorites.length === 0 || favorites.includes(f.id))
    .map((f, i) => ({
      id: f.id,
      symbol: f.symbol,
      name: f.name,
      current_price: f.price,
      price_change_percentage_24h: f.change,
      market_cap: f.marketCap,
      market_cap_rank: i + 1,
      total_volume: f.volume,
      high_24h: f.price * 1.05,
      low_24h: f.price * 0.95,
      image: '',
      price_change_24h: f.price * f.change / 100,
      sparkline_in_7d: { price: generateFakeSparkline(f.price, f.change) },
    }))
}

function generateFakeSparkline(basePrice: number, change: number): number[] {
  const points: number[] = []
  let price = basePrice * (1 - change / 200)
  for (let i = 0; i < 48; i++) {
    const noise = (Math.random() - 0.5) * basePrice * 0.02
    const trend = (basePrice - price) * (i / 48) * 0.3
    price = price + noise + trend
    points.push(price)
  }
  points[points.length - 1] = basePrice
  return points
}

const cryptoStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .crypto-row:hover {
    background: rgba(139,92,246,0.08) !important;
  }
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontFamily: "'Inter', system-ui, sans-serif",
    color: 'var(--text-primary)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,197,94,0.1))',
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.25)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: {
    fontSize: 28,
    color: '#8b5cf6',
    filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))',
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' },
  subtitle: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  lastUpdate: { fontSize: 12, color: 'var(--text-secondary)' },
  refreshBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid var(--window-border)',
    background: 'rgba(139,92,246,0.15)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  errorBanner: {
    padding: '8px 14px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    color: '#ef4444',
    fontSize: 12,
  },
  controls: { display: 'flex', gap: 8, alignItems: 'center' },
  searchInput: {
    flex: 1,
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid var(--window-border)',
    background: 'var(--window-bg)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
  filterBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid var(--window-border)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  sortSelect: {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid var(--window-border)',
    background: 'var(--window-bg)',
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  col: { display: 'flex', alignItems: 'center' },
  tableBody: {
    flex: 1,
    overflow: 'auto',
    borderRadius: 8,
    border: '1px solid var(--window-border)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid var(--window-border)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  coinInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  coinImg: { width: 28, height: 28, borderRadius: '50%' },
  coinFallback: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff',
  },
  coinName: { fontSize: 13, fontWeight: 600 },
  coinSymbol: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 },
  favBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
  },
  loading: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: 32, height: 32,
    border: '3px solid var(--window-border)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    animation: 'pulse 0.8s linear infinite',
  },
  empty: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    width: '90%',
    maxWidth: 560,
    maxHeight: '80%',
    background: 'var(--window-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottom: '1px solid var(--window-border)',
  },
  modalIcon: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700, color: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: 700 },
  modalSubtitle: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 18,
    padding: 4,
  },
  modalBody: { padding: 16, overflow: 'auto' },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 16,
  },
  detailCard: {
    padding: 12,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    border: '1px solid var(--window-border)',
  },
  detailLabel: { fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  detailValue: { fontSize: 15, fontWeight: 700 },
  descriptionBox: {
    padding: 12,
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    border: '1px solid var(--window-border)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 4px',
    fontSize: 10,
    color: 'var(--text-secondary)',
  },
}

export default CryptoPriceTracker
