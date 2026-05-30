import { useState, useEffect, useCallback, memo } from 'react'

interface CryptoData {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  image: string
}

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface WeatherPoint {
  time: string
  temp: number
}

const CRYPTO_IDS = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot']
const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' }
]

const RealTimeDashboard = memo(function RealTimeDashboard() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [weatherHistory, setWeatherHistory] = useState<WeatherPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const generateRandomStock = (base: { symbol: string; name: string }): StockData => ({
    ...base,
    price: Math.random() * 500 + 100,
    change: (Math.random() - 0.5) * 20,
    changePercent: (Math.random() - 0.5) * 10
  })

  const [stockData, setStockData] = useState<StockData[]>(
    STOCKS.map(generateRandomStock)
  )

  const fetchCryptoData = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
      )
      if (response.ok) {
        const data = await response.json()
        setCryptoData(data)
      }
    } catch (err) {
      console.error('Failed to fetch crypto data:', err)
    }
  }, [])

  const updateStocks = useCallback(() => {
    setStockData(prev =>
      prev.map(stock => {
        const change = (Math.random() - 0.5) * 5
        return {
          ...stock,
          price: Math.max(1, stock.price + change),
          change: change,
          changePercent: (change / stock.price) * 100
        }
      })
    )
  }, [])

  const updateWeatherHistory = useCallback(() => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const temp = 15 + Math.random() * 15

    setWeatherHistory(prev => {
      const updated = [...prev, { time: timeStr, temp }]
      return updated.slice(-20)
    })
  }, [])

  useEffect(() => {
    const init = async () => {
      await fetchCryptoData()
      updateWeatherHistory()
      setLoading(false)
    }
    init()

    const cryptoInterval = setInterval(fetchCryptoData, 60000)
    const stockInterval = setInterval(updateStocks, 3000)
    const weatherInterval = setInterval(updateWeatherHistory, 5000)
    const updateInterval = setInterval(() => setLastUpdate(new Date()), 1000)

    return () => {
      clearInterval(cryptoInterval)
      clearInterval(stockInterval)
      clearInterval(weatherInterval)
      clearInterval(updateInterval)
    }
  }, [fetchCryptoData, updateStocks, updateWeatherHistory])

  const renderTempGraph = () => {
    const maxTemp = Math.max(...weatherHistory.map(w => w.temp))
    const minTemp = Math.min(...weatherHistory.map(w => w.temp))
    const range = maxTemp - minTemp || 1

    return (
      <div style={{
        height: '100px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
        padding: '8px 0'
      }}>
        {weatherHistory.map((point, index) => {
          const height = ((point.temp - minTemp) / range) * 80 + 20
          return (
            <div
              key={index}
              style={{
                flex: 1,
                background: 'linear-gradient(to top, #8b5cf6, #06b6d4)',
                borderRadius: '4px 4px 0 0',
                height: `${height}%`,
                minHeight: '20px',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            />
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0c8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div>正在加载实时数据...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px',
      background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚀 实时数据仪表板
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#a0a0c8', fontSize: '14px' }}>
            实时追踪加密货币、股票和天气数据
          </p>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#a0a0c8',
          textAlign: 'right'
        }}>
          <div>最后更新</div>
          <div style={{ color: '#06b6d4', fontWeight: '600' }}>
            {lastUpdate.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#8b5cf6',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            <span>💰</span>
            <span>加密货币</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cryptoData.length > 0 ? cryptoData.map((crypto) => (
              <div
                key={crypto.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={crypto.image}
                    alt={crypto.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '14px' }}>
                      {crypto.name}
                    </div>
                    <div style={{ color: '#a0a0c8', fontSize: '12px' }}>
                      {crypto.symbol.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '14px' }}>
                    ${crypto.current_price.toLocaleString()}
                  </div>
                  <div style={{
                    color: crypto.price_change_percentage_24h >= 0 ? '#10b981' : '#f87171',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {crypto.price_change_percentage_24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ color: '#a0a0c8', textAlign: 'center', padding: '20px' }}>
                数据加载中...
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#06b6d4',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            <span>📈</span>
            <span>模拟股票</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stockData.map((stock) => (
              <div
                key={stock.symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '14px' }}>
                    {stock.symbol}
                  </div>
                  <div style={{ color: '#a0a0c8', fontSize: '12px' }}>
                    {stock.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#e8e8f4', fontWeight: '600', fontSize: '14px' }}>
                    ${stock.price.toFixed(2)}
                  </div>
                  <div style={{
                    color: stock.changePercent >= 0 ? '#10b981' : '#f87171',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {stock.changePercent >= 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          color: '#10b981',
          fontWeight: '600',
          fontSize: '16px'
        }}>
          <span>🌡️</span>
          <span>模拟温度趋势</span>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          {weatherHistory.length > 0 ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#a0a0c8' }}>
                  {weatherHistory[0].time}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  {weatherHistory[weatherHistory.length - 1].temp.toFixed(1)}°C
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0c8' }}>
                  {weatherHistory[weatherHistory.length - 1].time}
                </div>
              </div>
              {renderTempGraph()}
            </>
          ) : (
            <div style={{ color: '#a0a0c8', textAlign: 'center', padding: '20px' }}>
              正在收集数据...
            </div>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#a0a0c8',
        fontSize: '12px'
      }}>
        <span>💡</span> 数据实时更新中 | 加密货币来自 CoinGecko API | 股票为模拟数据
      </div>
    </div>
  )
})

export default RealTimeDashboard
