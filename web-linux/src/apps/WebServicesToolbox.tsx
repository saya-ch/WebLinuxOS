import { useState, useEffect } from 'react'
import { Globe, Clock, Sun, Cloud, Thermometer, Wind, Droplets } from 'lucide-react'

interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  loc: string
  org: string
  postal: string
  timezone: string
}

interface WeatherData {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  current: {
    temp_c: number
    temp_f: number
    condition: {
      text: string
      icon: string
    }
    wind_kph: number
    wind_mph: number
    humidity: number
    feelslike_c: number
    uv: number
  }
}

export default function WebServicesToolbox() {
  const [activeTab, setActiveTab] = useState<'ip' | 'weather' | 'time' | 'crypto'>('ip')
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherCity, setWeatherCity] = useState('Beijing')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchIPInfo()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchIPInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        setIpInfo(data)
      }
    } catch {
      setIpInfo({
        ip: '192.168.1.1',
        city: 'Beijing',
        region: 'Beijing',
        country: 'China',
        loc: '39.9042,116.4074',
        org: 'AS4134 Chinanet',
        postal: '100000',
        timezone: 'Asia/Shanghai'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWeather = async (city: string) => {
    setLoading(true)
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${encodeURIComponent(city)}&aqi=no`)
      if (response.ok) {
        const data = await response.json()
        setWeather(data)
      }
    } catch {
      setWeather({
        location: {
          name: city,
          region: '',
          country: 'Unknown',
          lat: 39.9042,
          lon: 116.4074,
          tz_id: 'Asia/Shanghai',
          localtime: new Date().toISOString()
        },
        current: {
          temp_c: 25,
          temp_f: 77,
          condition: {
            text: 'Sunny',
            icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
          },
          wind_kph: 10,
          wind_mph: 6,
          humidity: 60,
          feelslike_c: 27,
          uv: 5
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'ip' as const, label: 'IP 信息', icon: Globe },
    { id: 'weather' as const, label: '天气预报', icon: Cloud },
    { id: 'time' as const, label: '世界时间', icon: Clock },
  ]

  return (
    <div className="app-container" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 20,
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={28} />
          <h1 style={{ margin: 0, fontSize: 22 }}>Web 服务工具箱</h1>
        </div>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: 13 }}>集成实用在线服务</p>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--window-header)',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'ip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--window-bg)',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Globe size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>当前 IP 信息</h3>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>加载中...</div>
                </div>
              ) : ipInfo ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>IP 地址</div>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>{ipInfo.ip}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>城市</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ipInfo.city}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>地区</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ipInfo.region}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>国家</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ipInfo.country}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>坐标</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ipInfo.loc}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>时区</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ipInfo.timezone}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--window-header)', borderRadius: 8, gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>ISP 组织</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ipInfo.org}</div>
                  </div>
                </div>
              ) : null}
              <button
                onClick={fetchIPInfo}
                disabled={loading}
                style={{
                  marginTop: 16,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                刷新 IP 信息
              </button>
            </div>
          </div>
        )}

        {activeTab === 'weather' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              display: 'flex',
              gap: 12,
            }}>
              <input
                type="text"
                value={weatherCity}
                onChange={(e) => setWeatherCity(e.target.value)}
                placeholder="输入城市名称..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                }}
              />
              <button
                onClick={() => fetchWeather(weatherCity)}
                disabled={loading || !weatherCity}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: loading || !weatherCity ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                查询
              </button>
            </div>

            {loading ? (
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 12,
                padding: 60,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>加载中...</div>
              </div>
            ) : weather ? (
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{weather.location.name}</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                      {weather.location.region}, {weather.location.country}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>
                      更新时间: {weather.location.localtime}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <img
                      src={weather.current.condition.icon.startsWith('//') ? `https:${weather.current.condition.icon}` : weather.current.condition.icon}
                      alt={weather.current.condition.text}
                      style={{ width: 80, height: 80 }}
                    />
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{weather.current.condition.text}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <div style={{ fontSize: 72, fontWeight: 300 }}>{weather.current.temp_c}°</div>
                  <div style={{ fontSize: 24, color: 'var(--text-secondary)' }}>C</div>
                  <div style={{ marginLeft: 20, fontSize: 16, color: 'var(--text-secondary)' }}>
                    体感温度: {weather.current.feelslike_c}°C
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div style={{ padding: 16, background: 'var(--window-header)', borderRadius: 10, textAlign: 'center' }}>
                    <Wind size={24} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.current.wind_kph} km/h</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>风速</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--window-header)', borderRadius: 10, textAlign: 'center' }}>
                    <Droplets size={24} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.current.humidity}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>湿度</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--window-header)', borderRadius: 10, textAlign: 'center' }}>
                    <Thermometer size={24} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.current.uv}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>UV 指数</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--window-header)', borderRadius: 10, textAlign: 'center' }}>
                    <Sun size={24} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.current.temp_f}°F</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>华氏度</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'time' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--window-bg)',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid var(--window-border)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 64, fontWeight: 300, fontFamily: 'monospace', marginBottom: 8 }}>
                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
              <div style={{ fontSize: 20, color: 'var(--text-secondary)' }}>
                {currentTime.toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Clock size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>北京 (UTC+8)</h3>
                </div>
                <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'monospace' }}>
                  {new Date().toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })}
                </div>
              </div>
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Clock size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>纽约 (UTC-5)</h3>
                </div>
                <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'monospace' }}>
                  {new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' })}
                </div>
              </div>
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Clock size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>伦敦 (UTC+0)</h3>
                </div>
                <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'monospace' }}>
                  {new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Europe/London' })}
                </div>
              </div>
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Clock size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>东京 (UTC+9)</h3>
                </div>
                <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'monospace' }}>
                  {new Date().toLocaleTimeString('ja-JP', { hour12: false, timeZone: 'Asia/Tokyo' })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}