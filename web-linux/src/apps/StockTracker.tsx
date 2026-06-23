import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../store'

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
}

interface WatchlistItem {
  symbol: string
  name: string
}

// 股票追踪应用 - 实时股票价格和投资组合追踪
const StockTracker = memo(function StockTracker() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('weblinux-stock-watchlist')
    return saved ? JSON.parse(saved) : [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corp.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
    ]
  })
  const [stockData, setStockData] = useState<Record<string, StockData>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WatchlistItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const addNotification = useStore(s => s.addNotification)

  // 保存watchlist到localStorage
  useEffect(() => {
    localStorage.setItem('weblinux-stock-watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // 模拟获取股票数据（使用模拟数据，因为真实API需要密钥）
  const fetchStockData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 使用模拟数据，模拟真实股票价格波动
      const mockData: Record<string, StockData> = {}
      
      const basePrices: Record<string, number> = {
        'AAPL': 178.50,
        'GOOGL': 141.80,
        'MSFT': 378.90,
        'AMZN': 178.25,
        'TSLA': 248.50,
        'META': 505.75,
        'NVDA': 875.30,
        'JPM': 195.40,
        'V': 279.60,
        'WMT': 165.80,
        'DIS': 112.30,
        'NFLX': 628.90,
        'BA': 215.40,
        'INTC': 45.80,
        'AMD': 156.90,
      }
      
      for (const item of watchlist) {
        const basePrice = basePrices[item.symbol] || 100 + Math.random() * 200
        const change = (Math.random() - 0.5) * 10
        const changePercent = (change / basePrice) * 100
        
        mockData[item.symbol] = {
          symbol: item.symbol,
          name: item.name,
          price: basePrice + change,
          change: change,
          changePercent: changePercent,
          high: basePrice + Math.random() * 5,
          low: basePrice - Math.random() * 5,
          open: basePrice + (Math.random() - 0.5) * 3,
          volume: Math.floor(Math.random() * 50000000 + 1000000)
        }
      }
      
      setStockData(mockData)
      setLastUpdated(new Date())
    } catch (err) {
      setError('获取股票数据失败')
      addNotification({
        title: '股票数据',
        message: '获取股票数据失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [watchlist, addNotification])

  // 初始加载和定时刷新
  useEffect(() => {
    fetchStockData()
    const interval = setInterval(fetchStockData, 30000) // 30秒刷新一次
    return () => clearInterval(interval)
  }, [fetchStockData])

  // 搜索股票
  const searchStock = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    // 模拟搜索结果
    const popularStocks: WatchlistItem[] = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
      { symbol: 'V', name: 'Visa Inc.' },
      { symbol: 'WMT', name: 'Walmart Inc.' },
      { symbol: 'DIS', name: 'The Walt Disney Company' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'BA', name: 'Boeing Co.' },
      { symbol: 'INTC', name: 'Intel Corporation' },
      { symbol: 'AMD', name: 'Advanced Micro Devices' },
      { symbol: 'BABA', name: 'Alibaba Group' },
      { symbol: 'TSM', name: 'Taiwan Semiconductor' },
      { symbol: 'PFE', name: 'Pfizer Inc.' },
      { symbol: 'KO', name: 'Coca-Cola Co.' },
      { symbol: 'PEP', name: 'PepsiCo Inc.' },
    ]
    
    const results = popularStocks.filter(s => 
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(results.slice(0, 5))
  }, [searchQuery])

  // 添加到watchlist
  const addToWatchlist = useCallback((item: WatchlistItem) => {
    if (!watchlist.find(w => w.symbol === item.symbol)) {
      setWatchlist(prev => [...prev, item])
      addNotification({
        title: '股票追踪',
        message: `${item.symbol} 已添加到关注列表`,
        type: 'success'
      })
    }
    setSearchQuery('')
    setSearchResults([])
  }, [watchlist, addNotification])

  // 从watchlist移除
  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol))
    addNotification({
      title: '股票追踪',
      message: `${symbol} 已从关注列表移除`,
      type: 'info'
    })
  }, [addNotification])

  // 格式化数字
  const formatPrice = (price: number) => price.toFixed(2)
  const formatChange = (change: number) => change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)
  const formatPercent = (percent: number) => percent > 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
  // 保留用于未来扩展
  const _formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }
  void _formatVolume

  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }

  return (
    <div style={containerStyle}>
      {/* 顶部搜索栏 */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 16,
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="搜索股票代码或名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchStock() }}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            fontSize: 14
          }}
        />
        <button
          onClick={searchStock}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          搜索
        </button>
        <button
          onClick={fetchStockData}
          disabled={loading}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: 14
          }}
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div style={{
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>搜索结果:</div>
          {searchResults.map((result) => (
            <div
              key={result.symbol}
              onClick={() => addToWatchlist(result)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
                background: watchlist.find(w => w.symbol === result.symbol) 
                  ? 'var(--accent-bg)' 
                  : 'transparent'
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{result.symbol}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>{result.name}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {watchlist.find(w => w.symbol === result.symbol) ? '已添加' : '点击添加'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5'
        }}>
          {error}
        </div>
      )}

      {/* 更新时间 */}
      {lastUpdated && (
        <div style={{ 
          fontSize: 12, 
          color: 'var(--text-muted)', 
          marginBottom: 12,
          textAlign: 'right'
        }}>
          最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
        </div>
      )}

      {/* 股票列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {watchlist.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 48, 
            color: 'var(--text-muted)' 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
            <div>关注列表为空</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>搜索并添加股票开始追踪</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {watchlist.map((item) => {
              const data = stockData[item.symbol]
              const isPositive = data?.change >= 0
              
              return (
                <div
                  key={item.symbol}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{item.symbol}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.name}</div>
                  </div>
                  
                  {data && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: 18 }}>
                        ${formatPrice(data.price)}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: isPositive ? '#22c55e' : '#ef4444',
                        fontWeight: 500
                      }}>
                        {formatChange(data.change)} ({formatPercent(data.changePercent)})
                      </div>
                    </div>
                  )}
                  
                  {!data && loading && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>加载中...</div>
                  )}
                  
                  <button
                    onClick={() => removeFromWatchlist(item.symbol)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    移除
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {watchlist.length > 0 && Object.keys(stockData).length > 0 && (
        <div style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>上涨</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#22c55e' }}>
              {Object.values(stockData).filter(d => d.change >= 0).length}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>下跌</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>
              {Object.values(stockData).filter(d => d.change < 0).length}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>关注数</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {watchlist.length}
            </div>
          </div>
        </div>
      )}

      {/* 提示 */}
      <div style={{ 
        marginTop: 12, 
        fontSize: 11, 
        color: 'var(--text-muted)', 
        textAlign: 'center' 
      }}>
        数据每30秒自动刷新 | 当前为模拟数据
      </div>
    </div>
  )
})

export default StockTracker