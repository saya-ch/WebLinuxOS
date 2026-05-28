import { useState, useEffect, useCallback, memo } from 'react'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
}

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
]

// 模拟API响应，实际生产中会使用真实的API
const mockStockData = (symbol: string): StockData => {
  const basePrice = Math.random() * 400 + 50
  const change = (Math.random() - 0.5) * 10
  const changePercent = (change / basePrice) * 100
  return {
    symbol,
    name: popularStocks.find(s => s.symbol === symbol)?.name || symbol,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    high: parseFloat((basePrice + Math.random() * 10).toFixed(2)),
    low: parseFloat((basePrice - Math.random() * 10).toFixed(2)),
    volume: Math.floor(Math.random() * 100000000),
  }
}

const StockTracker = memo(function StockTracker() {
  const [watchlist, setWatchlist] = useState<StockData[]>([])
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000)

  // 初始化热门股票
  const loadInitialStocks = useCallback(() => {
    setLoading(true)
    const initialStocks = popularStocks.map(stock => mockStockData(stock.symbol))
    setWatchlist(initialStocks)
    if (initialStocks.length > 0) {
      setSelectedStock(initialStocks[0])
    }
    setLoading(false)
  }, [])

  // 添加股票到观察列表
  const addStock = useCallback((symbol: string) => {
    const normalizedSymbol = symbol.toUpperCase().trim()
    if (!normalizedSymbol) return
    if (watchlist.find(s => s.symbol === normalizedSymbol)) return
    
    const newStock = mockStockData(normalizedSymbol)
    setWatchlist(prev => [...prev, newStock])
    setSearchQuery('')
  }, [watchlist])

  // 移除股票
  const removeStock = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(s => s.symbol !== symbol))
    if (selectedStock?.symbol === symbol) {
      setSelectedStock(watchlist[0] || null)
    }
  }, [selectedStock, watchlist])

  // 刷新数据
  const refreshData = useCallback(() => {
    setLoading(true)
    const updatedStocks = watchlist.map(stock => {
      const updated = mockStockData(stock.symbol)
      if (selectedStock?.symbol === stock.symbol) {
        setSelectedStock(updated)
      }
      return updated
    })
    setWatchlist(updatedStocks)
    setLoading(false)
  }, [watchlist, selectedStock])

  // 格式化成交量
  const formatVolume = (vol: number): string => {
    if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + 'B'
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M'
    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K'
    return vol.toString()
  }

  // 初始化
  useEffect(() => {
    loadInitialStocks()
  }, [loadInitialStocks])

  // 定时刷新
  useEffect(() => {
    const interval = setInterval(refreshData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshData, refreshInterval])

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#e8e8f4',
      overflow: 'hidden'
    }}>
      {/* 顶部栏 */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📈</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>股票市场追踪器</h2>
            <span style={{ fontSize: '12px', color: '#a0a0c8' }}>实时股市数据</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e8e8f4',
              fontSize: '12px'
            }}
          >
            <option value={10000}>10秒刷新</option>
            <option value={30000}>30秒刷新</option>
            <option value={60000}>1分钟刷新</option>
          </select>
          <button 
            onClick={refreshData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#e8e8f4',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '⏳ 刷新中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧 - 观察列表 */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {/* 搜索和添加 */}
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="搜索股票代码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStock(searchQuery)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e8e8f4',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => addStock(searchQuery)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                添加
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0c8', marginBottom: '8px' }}>热门股票：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {popularStocks.map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => addStock(stock.symbol)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    background: watchlist.some(s => s.symbol === stock.symbol) 
                      ? 'rgba(139, 92, 246, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                  border: watchlist.some(s => s.symbol === stock.symbol) 
                    ? '1px solid rgba(139, 92, 246, 0.5)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e8f4',
                  cursor: watchlist.some(s => s.symbol === stock.symbol) ? 'not-allowed' : 'pointer'
                }}
                disabled={watchlist.some(s => s.symbol === stock.symbol)}
                >
                  {stock.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* 股票列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loading && watchlist.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0c8' }}>
                加载中...
              </div>
            )}
            {watchlist.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0c8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                <div>观察列表为空</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>添加股票开始追踪</div>
              </div>
            )}
            {watchlist.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  background: selectedStock?.symbol === stock.symbol 
                    ? 'rgba(139, 92, 246, 0.2)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: selectedStock?.symbol === stock.symbol 
                    ? '1px solid rgba(139, 92, 246, 0.4)' 
                    : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '11px', color: '#a0a0c8' }}>{stock.name}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeStock(stock.symbol)
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>${stock.price.toFixed(2)}</div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: stock.change >= 0 ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {stock.change >= 0 ? '↑' : '↓'} {Math.abs(stock.change).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧 - 详细信息 */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {!selectedStock ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#a0a0c8'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📈</div>
              <h3 style={{ margin: 0, color: '#e8e8f4' }}>选择一只股票查看详情</h3>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>从左侧列表选择股票或添加新股票</p>
            </div>
          ) : (
            <div>
              {/* 股票标题 */}
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.1)', 
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#e8e8f4' }}>{selectedStock.symbol}</div>
                    <div style={{ fontSize: '14px', color: '#a0a0c8', marginTop: '4px' }}>{selectedStock.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '36px', fontWeight: '700' }}>
                      ${selectedStock.price.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: selectedStock.change >= 0 ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      marginTop: '4px'
                    }}>
                      {selectedStock.change >= 0 ? '↑' : '↓'} {Math.abs(selectedStock.change).toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* 统计数据卡片 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ fontSize: '12px', color: '#a0a0c8', marginBottom: '8px' }}>最高价</div>
                  <div style={{ fontSize: '22px', fontWeight: '600' }}>${selectedStock.high.toFixed(2)}</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ fontSize: '12px', color: '#a0a0c8', marginBottom: '8px' }}>最低价</div>
                  <div style={{ fontSize: '22px', fontWeight: '600' }}>${selectedStock.low.toFixed(2)}</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ fontSize: '12px', color: '#a0a0c8', marginBottom: '8px' }}>成交量</div>
                  <div style={{ fontSize: '22px', fontWeight: '600' }}>{formatVolume(selectedStock.volume)}</div>
                </div>
              </div>

              {/* 模拟图表区域 */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>价格走势图</div>
                <div style={{ 
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  {/* 模拟图表线 */}
                  <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0,70 L10,65 L20,60 L30,65 L40,50 L50,55 L60,45 L70,50 L80,40 L90,45 L100,35" 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2"
                    />
                    <path 
                      d="M0,70 L10,65 L20,60 L30,65 L40,50 L50,55 L60,45 L70,50 L80,40 L90,45 L100,35 L100,100 L0,100 Z" 
                      fill="url(#chartGradient)"
                    />
                  </svg>
                  <div style={{ color: '#a0a0c8', fontSize: '14px', zIndex: 1 }}>
                    模拟图表 - 实时更新中...
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  💹 模拟买入
                </button>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  📉 模拟卖出
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        fontSize: '12px',
        color: '#a0a0c8',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>📊 数据最后更新: {new Date().toLocaleTimeString()}</span>
        <span>💡 这是模拟数据 - 仅用于演示</span>
      </div>
    </div>
  )
})

export default StockTracker
