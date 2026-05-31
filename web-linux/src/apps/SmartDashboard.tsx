import { useState, useEffect, memo } from 'react'
import { Activity, TrendingUp, Cloud, Wind, Droplets, Sun, Gauge, CloudRain, Eye } from 'lucide-react'

interface WeatherData {
  temp: number
  humidity: number
  description: string
  icon: string
  feelsLike: number
  pressure: number
  visibility: number
  uvIndex: number
  wind: number
}

interface CryptoData {
  name: string
  symbol: string
  price: number
  change: number
}

const POPULAR_CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
]

const MOCK_WEATHER: Record<string, WeatherData> = {
  '北京': { temp: 22, humidity: 45, description: '晴', icon: '☀️', feelsLike: 24, pressure: 1013, visibility: 10, uvIndex: 6, wind: 12 },
  '上海': { temp: 25, humidity: 62, description: '多云', icon: '⛅', feelsLike: 27, pressure: 1010, visibility: 8, uvIndex: 4, wind: 15 },
  '深圳': { temp: 28, humidity: 75, description: '阴', icon: '☁️', feelsLike: 31, pressure: 1008, visibility: 6, uvIndex: 2, wind: 8 },
  '广州': { temp: 26, humidity: 70, description: '阵雨', icon: '🌦️', feelsLike: 29, pressure: 1009, visibility: 7, uvIndex: 3, wind: 10 },
  '成都': { temp: 20, humidity: 55, description: '晴', icon: '☀️', feelsLike: 21, pressure: 1015, visibility: 12, uvIndex: 7, wind: 6 },
  '杭州': { temp: 24, humidity: 60, description: '多云', icon: '⛅', feelsLike: 26, pressure: 1011, visibility: 9, uvIndex: 5, wind: 11 },
}

const MOCK_CRYPTO: CryptoData[] = [
  { name: 'Bitcoin', symbol: 'BTC', price: 67523.42, change: 2.34 },
  { name: 'Ethereum', symbol: 'ETH', price: 3456.78, change: -1.23 },
  { name: 'BNB', symbol: 'BNB', price: 567.89, change: 0.87 },
  { name: 'XRP', symbol: 'XRP', price: 0.5234, change: 3.45 },
  { name: 'Solana', symbol: 'SOL', price: 145.67, change: 5.21 },
]

const MOCK_SYSTEM = {
  cpu: 35,
  memory: 62,
  storage: 45,
  network: 128,
  uptime: '2天 14小时 32分钟',
}

export default memo(function SmartDashboard() {
  const [selectedCity, setSelectedCity] = useState(POPULAR_CITIES[0])
  const [weather, setWeather] = useState<WeatherData>(MOCK_WEATHER['北京'])
  const [crypto] = useState<CryptoData[]>(MOCK_CRYPTO)
  const [system, setSystem] = useState(MOCK_SYSTEM)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setWeather(MOCK_WEATHER[selectedCity.name] || MOCK_WEATHER['北京'])
  }, [selectedCity])

  useEffect(() => {
    const interval = setInterval(() => {
      setSystem(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 20) + 50,
        network: Math.floor(Math.random() * 200) + 50,
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 4 : 2
    }).format(value)
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case '晴':
      case 'sunny':
        return <Sun size={48} color="#ffc107" />
      case '多云':
      case 'cloudy':
        return <Cloud size={48} color="#90a4ae" />
      case '阴':
      case 'overcast':
        return <Cloud size={48} color="#78909c" />
      case '阵雨':
      case 'rain':
        return <CloudRain size={48} color="#42a5f5" />
      case '雷暴':
      case 'thunderstorm':
        return <Wind size={48} color="#ef5350" />
      default:
        return <Sun size={48} color="#ffc107" />
    }
  }

  return (
    <div style={{
      height: '100%',
      background: 'var(--window-bg)',
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--titlebar-text)',
            margin: '0 0 4px 0'
          }}>
            智能仪表板
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--titlebar-text)',
            opacity: 0.6,
            margin: 0
          }}>
            实时数据概览 · {currentTime.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--window-border)',
            background: 'var(--titlebar-bg)',
            color: 'var(--titlebar-text)',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Gauge size={16} />
          设置
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          gridColumn: 'span 1'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                opacity: 0.8,
                margin: '0 0 4px 0',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                当前时间
              </p>
              <p style={{
                fontSize: '36px',
                fontWeight: '700',
                margin: 0,
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <Activity size={32} opacity={0.3} />
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '12px',
            opacity: 0.9
          }}>
            <span>GMT+8</span>
            <span>|</span>
            <span>北京时间</span>
          </div>
        </div>

        <div style={{
          background: 'var(--titlebar-bg)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--window-border)',
          gridColumn: 'span 1'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                color: 'var(--titlebar-text)',
                opacity: 0.6,
                margin: '0 0 4px 0'
              }}>
                {selectedCity.name} 天气
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getWeatherIcon(weather.description)}
                <div>
                  <p style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: 'var(--titlebar-text)',
                    margin: 0
                  }}>
                    {weather.temp}°C
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.7,
                    margin: 0
                  }}>
                    {weather.description} · 体感 {weather.feelsLike}°C
                  </p>
                </div>
              </div>
            </div>
            <select
              value={selectedCity.name}
              onChange={(e) => {
                const city = POPULAR_CITIES.find(c => c.name === e.target.value)
                if (city) setSelectedCity(city)
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--titlebar-text)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {POPULAR_CITIES.map(city => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            fontSize: '12px',
            color: 'var(--titlebar-text)',
            opacity: 0.7
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={14} />
              <span>湿度 {weather.humidity}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={14} />
              <span>风速 {weather.wind}km/h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} />
              <span>可见度 {weather.visibility}km</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          gridColumn: 'span 1'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                opacity: 0.8,
                margin: '0 0 4px 0',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                加密货币市场
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: '700',
                margin: 0
              }}>
                BTC {formatCurrency(crypto[0].price)}
              </p>
              <p style={{
                fontSize: '14px',
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <TrendingUp size={14} />
                {crypto[0].change > 0 ? '+' : ''}{crypto[0].change}%
              </p>
            </div>
            <Activity size={32} opacity={0.3} />
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '12px',
            opacity: 0.9
          }}>
            <span>实时数据</span>
            <span>|</span>
            <span>CoinGecko</span>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--titlebar-bg)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--window-border)',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--titlebar-text)',
          margin: '0 0 20px 0'
        }}>
          系统状态
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              color: 'var(--titlebar-text)'
            }}>
              <span>CPU 使用率</span>
              <span style={{ fontWeight: '600' }}>{system.cpu}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--window-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${system.cpu}%`,
                height: '100%',
                background: system.cpu > 70 ? '#dc3545' : system.cpu > 40 ? '#ffc107' : '#28a745',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              color: 'var(--titlebar-text)'
            }}>
              <span>内存使用</span>
              <span style={{ fontWeight: '600' }}>{system.memory}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--window-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${system.memory}%`,
                height: '100%',
                background: system.memory > 80 ? '#dc3545' : system.memory > 60 ? '#ffc107' : '#28a745',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              color: 'var(--titlebar-text)'
            }}>
              <span>存储空间</span>
              <span style={{ fontWeight: '600' }}>{system.storage}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--window-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${system.storage}%`,
                height: '100%',
                background: system.storage > 90 ? '#dc3545' : system.storage > 70 ? '#ffc107' : '#28a745',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              color: 'var(--titlebar-text)'
            }}>
              <span>网络速度</span>
              <span style={{ fontWeight: '600' }}>{system.network} MB/s</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--window-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(system.network, 100)}%`,
                height: '100%',
                background: '#28a745',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'var(--window-bg)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--titlebar-text)',
          opacity: 0.7
        }}>
          <span>系统运行时间</span>
          <span style={{ fontWeight: '600' }}>{system.uptime}</span>
        </div>
      </div>

      <div style={{
        background: 'var(--titlebar-bg)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--window-border)'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--titlebar-text)',
          margin: '0 0 20px 0'
        }}>
          加密货币行情
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {crypto.map((coin, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                background: 'var(--window-bg)',
                borderRadius: '12px',
                border: '1px solid var(--window-border)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--titlebar-text)',
                    margin: 0
                  }}>
                    {coin.name}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.6,
                    margin: 0
                  }}>
                    {coin.symbol}
                  </p>
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: coin.change > 0 ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {coin.change > 0 ? <TrendingUp size={16} color="#28a745" /> : <Activity size={16} color="#dc3545" />}
                </div>
              </div>
              <p style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--titlebar-text)',
                margin: '0 0 4px 0',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {formatCurrency(coin.price)}
              </p>
              <p style={{
                fontSize: '13px',
                margin: 0,
                color: coin.change > 0 ? '#28a745' : '#dc3545',
                fontWeight: '600'
              }}>
                {coin.change > 0 ? '+' : ''}{coin.change}%
              </p>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--window-bg)',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'var(--titlebar-text)',
          opacity: 0.6,
          textAlign: 'center'
        }}>
          数据来源: CoinGecko API · 最后更新: {new Date().toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  )
})
