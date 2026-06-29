import { useState, useEffect, useCallback, memo } from 'react'

interface WeatherData {
  temp: number
  desc: string
  humidity: number
  windSpeed: number
  city: string
}

interface CryptoData {
  symbol: string
  name: string
  price: number
  change24h: number
}

const SmartDashboard = memo(function SmartDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [crypto, setCrypto] = useState<CryptoData[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    storage: 0,
    network: 0
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const statsInterval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 40) + 20,
        memory: Math.floor(Math.random() * 30) + 40,
        storage: 65,
        network: Math.floor(Math.random() * 100) + 50
      })
    }, 2000)
    return () => clearInterval(statsInterval)
  }, [])

  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Shanghai'
      )
      if (response.ok) {
        const data = await response.json()
        const weatherCodes: Record<number, string> = {
          0: '晴朗', 1: '晴间多云', 2: '多云', 3: '阴天',
          45: '雾', 48: '雾凇', 51: '毛毛雨', 53: '小雨', 55: '中雨',
          61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪',
          75: '大雪', 80: '阵雨', 81: '强阵雨', 82: '暴雨',
          95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴'
        }
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          desc: weatherCodes[data.current.weather_code] || '未知',
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          city: '北京'
        })
      }
    } catch {
      setWeather({
        temp: 22,
        desc: '晴间多云',
        humidity: 45,
        windSpeed: 12,
        city: '北京'
      })
    }
  }, [])

  const fetchCrypto = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true'
      )
      if (response.ok) {
        const data = await response.json()
        const coinMap: Record<string, { symbol: string; name: string }> = {
          bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
          ethereum: { symbol: 'ETH', name: 'Ethereum' },
          solana: { symbol: 'SOL', name: 'Solana' },
          binancecoin: { symbol: 'BNB', name: 'BNB' },
          ripple: { symbol: 'XRP', name: 'Ripple' }
        }
        const result: CryptoData[] = Object.entries(coinMap).map(([id, info]) => ({
          symbol: info.symbol,
          name: info.name,
          price: data[id]?.usd || 0,
          change24h: data[id]?.usd_24h_change || 0
        }))
        setCrypto(result)
      }
    } catch {
      setCrypto([
        { symbol: 'BTC', name: 'Bitcoin', price: 67523.50, change24h: 2.35 },
        { symbol: 'ETH', name: 'Ethereum', price: 3421.80, change24h: 1.82 },
        { symbol: 'SOL', name: 'Solana', price: 178.45, change24h: 5.62 },
        { symbol: 'BNB', name: 'BNB', price: 612.30, change24h: -0.85 },
        { symbol: 'XRP', name: 'Ripple', price: 0.6235, change24h: 1.24 }
      ])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchWeather(), fetchCrypto()])
  }, [fetchWeather, fetchCrypto])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getWeatherIcon = (desc: string) => {
    if (desc.includes('晴')) return '☀️'
    if (desc.includes('多云') || desc.includes('阴')) return '⛅'
    if (desc.includes('雨')) return '🌧️'
    if (desc.includes('雪')) return '❄️'
    if (desc.includes('雾')) return '🌫️'
    if (desc.includes('雷')) return '⛈️'
    return '🌤️'
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #16213e 100%)',
      padding: '24px',
      overflowY: 'auto',
      color: '#e0e0e8'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 300,
          fontFamily: '"JetBrains Mono", monospace',
          color: '#ffffff',
          letterSpacing: '2px'
        }}>
          {formatTime(currentTime)}
        </div>
        <div style={{ fontSize: '16px', color: '#a0a0c8', marginTop: '4px' }}>
          {formatDate(currentTime)}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '13px', color: '#8b7cf0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            天气
          </div>
          {weather && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '48px' }}>{getWeatherIcon(weather.desc)}</span>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 300, color: '#fff' }}>{weather.temp}°C</div>
                  <div style={{ fontSize: '14px', color: '#a0a0c8' }}>{weather.desc} · {weather.city}</div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontSize: '13px',
                color: '#a0a0c8'
              }}>
                <span>湿度 {weather.humidity}%</span>
                <span>风速 {weather.windSpeed} km/h</span>
              </div>
            </>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '13px', color: '#00d4aa', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            系统状态
          </div>
          <div>
            {[
              { label: 'CPU', value: systemStats.cpu, color: '#8b7cf0' },
              { label: '内存', value: systemStats.memory, color: '#00d4aa' },
              { label: '存储', value: systemStats.storage, color: '#f5a623' },
              { label: '网络', value: systemStats.network, color: '#e94560' }
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#a0a0c8' }}>{item.label}</span>
                  <span style={{ color: '#fff' }}>{item.value}%</span>
                </div>
                <div style={{
                  height: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${item.value}%`,
                    height: '100%',
                    background: item.color,
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '13px', color: '#f5a623', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          加密货币行情
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {crypto.map((coin) => (
            <div key={coin.symbol} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{coin.symbol}</span>
                <span style={{
                  fontSize: '12px',
                  color: coin.change24h >= 0 ? '#00d4aa' : '#e94560',
                  fontWeight: 500
                }}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: '#a0a0c8', marginTop: '2px' }}>{coin.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {[
          { icon: '📁', label: '文件管理器', count: '128 文件' },
          { icon: '📝', label: '便签', count: '5 条' },
          { icon: '✅', label: '待办', count: '3 项' },
          { icon: '💾', label: '存储空间', count: '35% 已用' }
        ].map((item, index) => (
          <div key={index} style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{ fontWeight: 500, color: '#fff' }}>{item.label}</div>
            <div style={{ fontSize: '12px', color: '#a0a0c8', marginTop: '2px' }}>{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
})

export default SmartDashboard
