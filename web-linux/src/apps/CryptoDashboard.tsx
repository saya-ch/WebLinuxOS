// @ts-nocheck
import { useState, useEffect, useCallback, memo } from 'react'
import {
  TrendingUpIcon, TrendingDownIcon, RefreshCwIcon,
  StarIcon, SearchIcon, ActivityIcon, DollarSignIcon,
  BarChart3Icon, GlobeIcon, ZapIcon, BitcoinIcon,
  HistoryIcon, EyeIcon, SparklesIcon, DownloadIcon
} from '../icons'

interface CryptoData {
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
  last_updated: string
  price_change_7d_percentage?: number
  price_change_30d_percentage?: number
  price_change_1y_percentage?: number
  ath?: number
  ath_date?: string
  atl?: number
  atl_date?: string
  supply?: number
  max_supply?: number
}

interface PriceHistory {
  prices: Array<[number, number]>
  market_caps: Array<[number, number]>
  total_volumes: Array<[number, number]>
}

const POPULAR_COINS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple',
  'cardano', 'dogecoin', 'polkadot', 'chainlink', 'tron',
  'litecoin', 'uniswap', 'stellar', 'monero', 'polygon-ecosystem-token'
]

const TIME_RANGES = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
]

const FAVORITES_KEY = 'crypto-dashboard-favorites'

async function fetchCryptoData(ids: string): Promise<CryptoData[]> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h%2C7d%2C30d%2C1y`
  )
  if (!response.ok) throw new Error('API请求失败')
  return response.json()
}

async function fetchPriceHistory(id: string, days: string): Promise<PriceHistory> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
  )
  if (!response.ok) throw new Error('历史数据请求失败')
  return response.json()
}

const CryptoDashboard = memo(function CryptoDashboard() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [filteredData, setFilteredData] = useState<CryptoData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change_24h' | 'market_cap'>('rank')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedCoin, setSelectedCoin] = useState<CryptoData | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null)
  const [timeRange, setTimeRange] = useState('7')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY)
    if (saved) {
      try { setFavorites(JSON.parse(saved)) } catch {}
    }
  }, [])

  const saveFavorites = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchCryptoData(POPULAR_COINS.join(','))
      setCryptoData(data)
      setFilteredData(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
      // Fallback data for demo
      setCryptoData(getFallbackData())
      setFilteredData(getFallbackData())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 120000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    let result = cryptoData
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.symbol.toLowerCase().includes(term)
      )
    }

    if (showFavoritesOnly) {
      result = result.filter(c => favorites.includes(c.id))
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price': return b.current_price - a.current_price
        case 'change_24h': return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
        case 'market_cap': return b.market_cap - a.market_cap
        default: return a.market_cap_rank - b.market_cap_rank
      }
    })

    setFilteredData(result)
  }, [cryptoData, searchTerm, sortBy, showFavoritesOnly, favorites])

  const handleSelectCoin = useCallback(async (coin: CryptoData) => {
    setSelectedCoin(coin)
    setPriceHistory(null)
    try {
      const history = await fetchPriceHistory(coin.id, timeRange)
      setPriceHistory(history)
    } catch {
      setPriceHistory(null)
    }
  }, [timeRange])

  const handleTimeRangeChange = useCallback(async (range: string) => {
    setTimeRange(range)
    if (selectedCoin) {
      try {
        const history = await fetchPriceHistory(selectedCoin.id, range)
        setPriceHistory(history)
      } catch {}
    }
  }, [selectedCoin])

  const handleToggleFavorite = useCallback((coinId: string) => {
    const newFavorites = favorites.includes(coinId)
      ? favorites.filter(id => id !== coinId)
      : [...favorites, coinId]
    saveFavorites(newFavorites)
  }, [favorites, saveFavorites])

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(decimals)}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    return `$${price.toFixed(6)}`
  }

  const getPriceColor = (change: number | undefined) => {
    if (!change) return 'rgba(255,255,255,0.5)'
    return change >= 0 ? '#10b981' : '#ef4444'
  }

  const renderSparkline = (prices: number[]) => {
    if (prices.length < 2) return null
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const width = 120
    const height = 36
    const points = prices.map((price, i) => {
      const x = (i / (prices.length - 1)) * width
      const y = height - ((price - min) / range) * height
      return `${x},${y}`
    }).join(' ')

    const isUp = prices[prices.length - 1] >= prices[0]
    const color = isUp ? '#10b981' : '#ef4444'

    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  const renderPriceChart = () => {
    if (!priceHistory || !selectedCoin) return null
    const prices = priceHistory.prices
    if (prices.length < 2) return null

    const priceValues = prices.map(p => p[1])
    const min = Math.min(...priceValues)
    const max = Math.max(...priceValues)
    const range = max - min || 1
    const width = 600
    const height = 200
    const padding = 20

    const points = prices.map(([timestamp, price]) => {
      const x = padding + ((timestamp - prices[0][0]) / (prices[prices.length - 1][0] - prices[0][0])) * (width - 2 * padding)
      const y = height - padding - ((price - min) / range) * (height - 2 * padding)
      return [x, y]
    })

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
    const areaPath = `${linePath} L${points[points.length - 1][0]},${height - padding} L${points[0][0]},${height - padding} Z`

    const isUp = priceValues[priceValues.length - 1] >= priceValues[0]
    const color = isUp ? '#10b981' : '#ef4444'
    const fillColor = isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i * (height - 2 * padding)) / 4}
            x2={width - padding}
            y2={padding + (i * (height - 2 * padding)) / 4}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill={fillColor} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1][0]}
            cy={points[points.length - 1][1]}
            r="4"
            fill={color}
          />
        )}
      </svg>
    )
  }

  const marketStats = {
    totalCoins: cryptoData.length,
    avgChange: cryptoData.length > 0 
      ? cryptoData.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / cryptoData.length 
      : 0,
    gainers: cryptoData.filter(c => (c.price_change_percentage_24h || 0) > 0).length,
    losers: cryptoData.filter(c => (c.price_change_percentage_24h || 0) < 0).length,
  }

  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify(cryptoData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crypto-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [cryptoData])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <BitcoinIcon size={24} color="#f7931a" />
          <span>实时加密货币仪表盘</span>
          <span style={styles.versionBadge}>Live</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={fetchData} disabled={isLoading}>
            <RefreshCwIcon size={16} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            {lastUpdate && `更新: ${lastUpdate.toLocaleTimeString()}`}
          </button>
          <button style={styles.iconBtn} onClick={handleExportData} title="导出数据">
            <DownloadIcon size={16} />
          </button>
        </div>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <ActivityIcon size={20} color="#3b82f6" />
          <div>
            <strong>{marketStats.totalCoins}</strong>
            <span>监控币种</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <TrendingUpIcon size={20} color="#10b981" />
          <div>
            <strong style={{ color: '#10b981' }}>{marketStats.gainers}</strong>
            <span>上涨</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <TrendingDownIcon size={20} color="#ef4444" />
          <div>
            <strong style={{ color: '#ef4444' }}>{marketStats.losers}</strong>
            <span>下跌</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <BarChart3Icon size={20} color="#8b74f0" />
          <div>
            <strong style={{ color: getPriceColor(marketStats.avgChange) }}>
              {marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
            </strong>
            <span>平均涨跌</span>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <SearchIcon size={16} />
              <input
                type="text"
                placeholder="搜索币种名称或代码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button 
              style={{
                ...styles.favBtn,
                ...(showFavoritesOnly ? styles.favBtnActive : {}),
              }}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <StarIcon size={14} color={showFavoritesOnly ? '#fbbf24' : 'rgba(255,255,255,0.5)'} />
              收藏 ({favorites.length})
            </button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={styles.sortSelect}>
              <option value="rank">市值排名</option>
              <option value="price">价格</option>
              <option value="change_24h">24h涨跌</option>
              <option value="market_cap">市值</option>
            </select>
          </div>

          <div style={styles.coinList}>
            {isLoading && (
              <div style={styles.loading}>
                <RefreshCwIcon size={24} style={{ animation: 'spin 1s linear infinite' }} />
                加载数据中...
              </div>
            )}
            {!isLoading && error && (
              <div style={styles.error}>
                <ZapIcon size={16} />
                {error}
                <span style={styles.fallbackNote}>(显示备用数据)</span>
              </div>
            )}
            {!isLoading && filteredData.length === 0 && (
              <div style={styles.empty}>未找到匹配的币种</div>
            )}
            {!isLoading && filteredData.map(coin => {
              const priceChange = coin.price_change_percentage_24h || 0
              const isFav = favorites.includes(coin.id)
              return (
                <div
                  key={coin.id}
                  style={{
                    ...styles.coinCard,
                    ...(selectedCoin?.id === coin.id ? styles.coinCardSelected : {}),
                  }}
                  onClick={() => handleSelectCoin(coin)}
                >
                  <div style={styles.coinRank}>#{coin.market_cap_rank}</div>
                  <img src={coin.image} alt={coin.name} style={styles.coinImage} />
                  <div style={styles.coinInfo}>
                    <div style={styles.coinName}>{coin.name}</div>
                    <div style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</div>
                  </div>
                  <div style={styles.coinSparkline}>
                    {renderSparkline(coin.price_change_7d_percentage ? 
                      [coin.current_price * (1 - coin.price_change_7d_percentage / 100), coin.current_price] : 
                      [coin.current_price])}
                  </div>
                  <div style={styles.coinPriceInfo}>
                    <div style={styles.coinPrice}>{formatPrice(coin.current_price)}</div>
                    <div style={{ ...styles.coinChange, color: getPriceColor(priceChange) }}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>
                  </div>
                  <button
                    style={styles.favIconBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(coin.id)
                    }}
                  >
                    <StarIcon size={16} color={isFav ? '#fbbf24' : 'rgba(255,255,255,0.3)'} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div style={styles.rightPanel}>
          {selectedCoin ? (
            <>
              <div style={styles.coinDetailHeader}>
                <div style={styles.coinDetailMain}>
                  <img src={selectedCoin.image} alt={selectedCoin.name} style={styles.coinLargeImage} />
                  <div>
                    <h2>{selectedCoin.name}</h2>
                    <span style={styles.coinDetailSymbol}>{selectedCoin.symbol.toUpperCase()}/USD</span>
                  </div>
                </div>
                <div style={styles.coinDetailPrice}>
                  <div style={styles.largePrice}>{formatPrice(selectedCoin.current_price)}</div>
                  <div style={{ ...styles.largeChange, color: getPriceColor(selectedCoin.price_change_percentage_24h) }}>
                    {selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} 
                    {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
                  </div>
                </div>
              </div>

              <div style={styles.timeRangeSelector}>
                {TIME_RANGES.map(range => (
                  <button
                    key={range.value}
                    style={{
                      ...styles.timeRangeBtn,
                      ...(timeRange === range.value ? styles.timeRangeBtnActive : {}),
                    }}
                    onClick={() => handleTimeRangeChange(range.value)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <div style={styles.chartContainer}>
                {priceHistory ? renderPriceChart() : (
                  <div style={styles.chartLoading}>
                    <RefreshCwIcon size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    加载走势图...
                  </div>
                )}
              </div>

              <div style={styles.detailStats}>
                <div style={styles.detailStat}>
                  <span>24h 最高</span>
                  <strong>{formatPrice(selectedCoin.high_24h)}</strong>
                </div>
                <div style={styles.detailStat}>
                  <span>24h 最低</span>
                  <strong>{formatPrice(selectedCoin.low_24h)}</strong>
                </div>
                <div style={styles.detailStat}>
                  <span>市值</span>
                  <strong>{formatNumber(selectedCoin.market_cap)}</strong>
                </div>
                <div style={styles.detailStat}>
                  <span>24h 成交量</span>
                  <strong>{formatNumber(selectedCoin.total_volume)}</strong>
                </div>
                {selectedCoin.price_change_7d_percentage !== undefined && (
                  <div style={styles.detailStat}>
                    <span>7天涨跌</span>
                    <strong style={{ color: getPriceColor(selectedCoin.price_change_7d_percentage) }}>
                      {selectedCoin.price_change_7d_percentage >= 0 ? '+' : ''}
                      {selectedCoin.price_change_7d_percentage.toFixed(2)}%
                    </strong>
                  </div>
                )}
                {selectedCoin.price_change_30d_percentage !== undefined && (
                  <div style={styles.detailStat}>
                    <span>30天涨跌</span>
                    <strong style={{ color: getPriceColor(selectedCoin.price_change_30d_percentage) }}>
                      {selectedCoin.price_change_30d_percentage >= 0 ? '+' : ''}
                      {selectedCoin.price_change_30d_percentage.toFixed(2)}%
                    </strong>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.noSelection}>
              <EyeIcon size={48} color="rgba(247,147,26,0.3)" />
              <h3>选择一个币种查看详情</h3>
              <p>点击左侧列表中的币种，可以查看详细的价格走势和市场数据</p>
              <div style={styles.featureList}>
                <div style={styles.feature}>
                  <GlobeIcon size={16} /> 实时价格数据 (CoinGecko API)
                </div>
                <div style={styles.feature}>
                  <HistoryIcon size={16} /> 多时间周期走势图
                </div>
                <div style={styles.feature}>
                  <StarIcon size={16} /> 自选收藏管理
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

function getFallbackData(): CryptoData[] {
  return POPULAR_COINS.map((id, idx) => {
    const basePrice = [67000, 3500, 600, 150, 0.5, 0.45, 0.15, 7, 14, 120, 80, 6, 0.12, 160, 0.8][idx] || 1
    const change = (Math.random() - 0.5) * 10
    return {
      id,
      symbol: id.substring(0, 3),
      name: id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' '),
      current_price: basePrice,
      price_change_percentage_24h: change,
      market_cap: basePrice * 1000000000,
      market_cap_rank: idx + 1,
      total_volume: basePrice * 10000000,
      high_24h: basePrice * 1.05,
      low_24h: basePrice * 0.95,
      image: '',
      last_updated: new Date().toISOString(),
    }
  })
}

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f1624 100%)',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(247,147,26,0.2)',
    background: 'rgba(0,0,0,0.3)',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 17,
    fontWeight: 700,
  },
  versionBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #f7931a, #e8850d)',
    color: 'white',
    fontWeight: 700,
    animation: 'pulse 2s infinite',
  },
  headerActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontSize: 12,
  },
  statsBar: {
    display: 'flex',
    gap: 16,
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.15)',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    '& div': {
      display: 'flex',
      flexDirection: 'column',
      '& strong': { fontSize: 18 },
      '& span': { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    },
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  leftPanel: {
    width: 420,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  controls: {
    display: 'flex',
    gap: 8,
    padding: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    padding: '8px 12px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
  },
  favBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  favBtnActive: {
    background: 'rgba(247,147,26,0.15)',
    borderColor: 'rgba(247,147,26,0.3)',
    color: '#fbbf24',
  },
  sortSelect: {
    padding: '8px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e0e0e0',
    fontSize: 12,
    cursor: 'pointer',
    outline: 'none',
  },
  coinList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  coinCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px',
    marginBottom: 4,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: 'rgba(255,255,255,0.05)',
      borderColor: 'rgba(255,255,255,0.1)',
    },
  },
  coinCardSelected: {
    background: 'rgba(247,147,26,0.1)',
    borderColor: 'rgba(247,147,26,0.3)',
  },
  coinRank: {
    width: 32,
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
  },
  coinImage: {
    width: 32,
    height: 32,
    borderRadius: '50%',
  },
  coinInfo: {
    flex: 1,
    '& .coinName': { fontSize: 13, fontWeight: 600 },
    '& .coinSymbol': { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  },
  coinSparkline: {
    width: 120,
  },
  coinPriceInfo: {
    textAlign: 'right',
    '& .coinPrice': { fontSize: 14, fontWeight: 600 },
    '& .coinChange': { fontSize: 12, fontWeight: 500 },
  },
  favIconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    margin: 8,
    borderRadius: 8,
    background: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    fontSize: 13,
  },
  fallbackNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  coinDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  coinDetailMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    '& img': {
      width: 48,
      height: 48,
      borderRadius: '50%',
    },
    '& h2': { margin: 0, fontSize: 24 },
  },
  coinDetailSymbol: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  coinDetailPrice: {
    textAlign: 'right',
  },
  largePrice: {
    fontSize: 32,
    fontWeight: 700,
    color: '#fff',
  },
  largeChange: {
    fontSize: 16,
    fontWeight: 600,
  },
  timeRangeSelector: {
    display: 'flex',
    gap: 4,
    padding: '12px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  timeRangeBtn: {
    padding: '6px 16px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  timeRangeBtnActive: {
    background: 'rgba(247,147,26,0.2)',
    color: '#f7931a',
  },
  chartContainer: {
    padding: 24,
    minHeight: 240,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  detailStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    padding: 24,
  },
  detailStat: {
    padding: '12px 16px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    '& span': { fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block' },
    '& strong': { fontSize: 16, color: '#fff' },
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
    textAlign: 'center',
    '& h3': { margin: 0, color: 'rgba(255,255,255,0.7)' },
    '& p': { color: 'rgba(255,255,255,0.5)', maxWidth: 300 },
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
};

export default CryptoDashboard
