import { useState, useCallback, useEffect, memo } from 'react'
import { TrendingUpIcon, TrendingDownIcon, PlusIcon, TrashIcon, RefreshCwIcon, WalletIcon, PieChartIcon } from '../icons'

interface Holding {
  id: string
  coinId: string
  symbol: string
  name: string
  amount: number
  purchasePrice: number
  icon?: string
}

interface CoinData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  image: string
}

const POPULAR_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polygon-ecosystem-token', symbol: 'MATIC', name: 'Polygon' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
]

async function fetchCoinData(coinIds: string[]): Promise<CoinData[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`
    )
    if (!response.ok) throw new Error('API请求失败')
    return await response.json()
  } catch (error) {
    console.error('获取币价失败:', error)
    return []
  }
}

const CryptoPortfolioTracker = memo(function CryptoPortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [coinData, setCoinData] = useState<Record<string, CoinData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState(POPULAR_COINS[0])
  const [amount, setAmount] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // 加载本地保存
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crypto-holdings')
      if (saved) {
        setHoldings(JSON.parse(saved))
      }
    } catch {}
  }, [])

  // 保存持仓
  useEffect(() => {
    localStorage.setItem('crypto-holdings', JSON.stringify(holdings))
  }, [holdings])

  // 获取币价数据
  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) return
    setIsLoading(true)
    try {
      const coinIds = [...new Set(holdings.map((h) => h.coinId))]
      const data = await fetchCoinData(coinIds)
      const priceMap: Record<string, CoinData> = {}
      data.forEach((coin) => {
        priceMap[coin.id] = coin
      })
      setCoinData(priceMap)
    } catch (e) {
      console.error('获取价格失败:', e)
    } finally {
      setIsLoading(false)
    }
  }, [holdings])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // 添加持仓
  const handleAddHolding = useCallback(() => {
    const amountNum = parseFloat(amount)
    const priceNum = parseFloat(purchasePrice)
    if (isNaN(amountNum) || isNaN(priceNum) || amountNum <= 0 || priceNum <= 0) {
      alert('请输入有效的数量和价格')
      return
    }

    const newHolding: Holding = {
      id: Date.now().toString(),
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      amount: amountNum,
      purchasePrice: priceNum,
    }
    setHoldings((prev) => [...prev, newHolding])
    setAmount('')
    setPurchasePrice('')
    setShowAddModal(false)
  }, [selectedCoin, amount, purchasePrice])

  // 删除持仓
  const handleDeleteHolding = useCallback((id: string) => {
    if (confirm('确定要删除这个持仓吗？')) {
      setHoldings((prev) => prev.filter((h) => h.id !== id))
    }
  }, [])

  // 计算统计数据
  const stats = holdings.map((h) => {
    const coin = coinData[h.coinId]
    const currentPrice = coin?.current_price || h.purchasePrice
    const value = h.amount * currentPrice
    const cost = h.amount * h.purchasePrice
    const pnl = value - cost
    const pnlPercentage = cost > 0 ? (pnl / cost) * 100 : 0
    const change24h = coin?.price_change_percentage_24h || 0
    const valueChange24h = (value * change24h) / (100 + change24h)

    return { ...h, currentPrice, value, cost, pnl, pnlPercentage, change24h, valueChange24h, coin }
  })

  const totalValue = stats.reduce((sum, s) => sum + s.value, 0)
  const totalCost = stats.reduce((sum, s) => sum + s.cost, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPercentage = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const totalChange24h = stats.reduce((sum, s) => sum + s.valueChange24h, 0)

  // 按币种分组的资产配置
  const allocation = stats.map((s) => ({
    ...s,
    percentage: totalValue > 0 ? (s.value / totalValue) * 100 : 0,
  }))

  const filteredCoins = POPULAR_COINS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${price.toFixed(4)}`
  }

  const formatAmount = (amount: number, symbol: string) => {
    if (amount >= 1) return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
    return `${amount.toFixed(6)} ${symbol}`
  }

  return (
    <div style={{
      padding: 24,
      height: '100%',
      overflow: 'auto',
      background: '#0a0a0f',
      color: '#fff',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WalletIcon style={{ width: 32, height: 32, color: '#fbbf24' }} />
            <div>
              <h1 style={{ fontSize: 24, margin: 0 }}>投资组合追踪</h1>
              <p style={{ color: '#6b7280', fontSize: 14 }}>实时加密货币投资组合管理</p>
            </div>
          </div>
          <button
            onClick={fetchPrices}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCwIcon style={{ width: 16, height: 16, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? '更新中...' : '刷新价格'}
          </button>
        </div>

        {/* 总览卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            padding: 24,
            borderRadius: 16,
            border: '1px solid rgba(251,191,36,0.3)',
          }}>
            <div style={{ color: '#fbbf24', fontSize: 13, marginBottom: 8 }}>总资产</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div style={{
            background: totalPnl >= 0 ? 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 100%)',
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${totalPnl >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{ color: totalPnl >= 0 ? '#10b981' : '#ef4444', fontSize: 13, marginBottom: 8 }}>总盈亏</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 14, color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnlPercentage >= 0 ? '+' : ''}{totalPnlPercentage.toFixed(2)}%
            </div>
          </div>

          <div style={{
            background: totalChange24h >= 0 ? 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 100%)',
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${totalChange24h >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{ color: totalChange24h >= 0 ? '#10b981' : '#ef4444', fontSize: 13, marginBottom: 8 }}>24小时变动</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: totalChange24h >= 0 ? '#10b981' : '#ef4444' }}>
              {totalChange24h >= 0 ? '+' : ''}${totalChange24h.toFixed(2)}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            padding: 24,
            borderRadius: 16,
            border: '1px solid rgba(59,130,246,0.3)',
          }}>
            <div style={{ color: '#3b82f6', fontSize: 13, marginBottom: 8 }}>持仓成本</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{holdings.length} 个持仓</div>
          </div>
        </div>

        {/* 持仓列表和资产配置 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* 持仓列表 */}
          <div style={{
            background: '#111827',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #1f2937',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>持仓列表</h2>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '10px 16px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <PlusIcon style={{ width: 16, height: 16 }} />
                添加持仓
              </button>
            </div>

            {stats.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280',
              }}>
                <WalletIcon style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.5 }} />
                <p>还没有任何持仓，点击上方按钮开始管理你的投资组合</p>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151' }}>
                      <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 12 }}>币种</th>
                      <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 12 }}>持有量</th>
                      <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 12 }}>现价</th>
                      <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 12 }}>市值</th>
                      <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 12 }}>盈亏</th>
                      <th style={{ padding: 12 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {s.coin?.image ? (
                              <img src={s.coin.image} alt={s.symbol} style={{ width: 24, height: 24 }} />
                            ) : (
                              <div style={{ width: 24, height: 24, background: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                                {s.symbol.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>{s.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{formatAmount(s.amount, s.symbol)}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{formatPrice(s.currentPrice)}</td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>${s.value.toFixed(2)}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, color: s.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                            {s.pnl >= 0 ? <TrendingUpIcon style={{ width: 14, height: 14 }} /> : <TrendingDownIcon style={{ width: 14, height: 14 }} />}
                            <span>{s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}</span>
                            <span style={{ fontSize: 12 }}>({s.pnlPercentage >= 0 ? '+' : ''}{s.pnlPercentage.toFixed(2)}%)</span>
                          </div>
                        </td>
                        <td style={{ padding: 12 }}>
                          <button
                            onClick={() => handleDeleteHolding(s.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                          >
                            <TrashIcon style={{ width: 16, height: 16 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 资产配置 */}
          <div style={{
            background: '#111827',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #1f2937',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <PieChartIcon style={{ width: 20, height: 20, color: '#fbbf24' }} />
              <h2 style={{ fontSize: 18, margin: 0 }}>资产配置</h2>
            </div>

            {allocation.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                添加持仓后查看配置比例
              </div>
            ) : (
              <div>
                {allocation.map((item, idx) => (
                  <div key={item.id} style={{ marginBottom: 16 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}>
                      <span>{item.symbol}</span>
                      <span style={{ color: '#6b7280' }}>{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div style={{
                      height: 8,
                      background: '#374151',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        background: `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      ${item.value.toFixed(2)} · {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 添加持仓弹窗 */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: '#111827',
              borderRadius: 16,
              padding: 32,
              width: 400,
              border: '1px solid #374151',
            }}>
              <h2 style={{ margin: '0 0 24px' }}>添加持仓</h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#6b7280' }}>选择币种</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索币种..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    color: '#fff',
                    marginBottom: 8,
                  }}
                />
                <div style={{
                  maxHeight: 150,
                  overflow: 'auto',
                  background: '#0f172a',
                  borderRadius: 8,
                }}>
                  {filteredCoins.map((coin) => (
                    <div
                      key={coin.id}
                      onClick={() => setSelectedCoin(coin)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        background: selectedCoin.id === coin.id ? '#3b82f6' : 'transparent',
                        borderBottom: '1px solid #1f2937',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{coin.name}</span>
                      <span style={{ color: '#6b7280' }}>{coin.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#6b7280' }}>持有数量</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#6b7280' }}>买入单价 (USD)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#374151',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleAddHolding}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default CryptoPortfolioTracker
