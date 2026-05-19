import { useState, useEffect } from 'react'

interface ForecastDay {
  day: string
  high: number
  low: number
  icon: string
  desc: string
}

const weatherData = {
  city: '北京',
  temp: 22,
  condition: '晴',
  icon: '☀️',
  humidity: 45,
  windSpeed: '12 km/h',
  windDir: '西北风',
  visibility: '10 km',
  pressure: '1013 hPa',
  uvIndex: '中等',
  sunrise: '05:48',
  sunset: '18:42',
  feelsLike: 24,
}

const forecast: ForecastDay[] = [
  { day: '周一', high: 23, low: 15, icon: '☀️', desc: '晴' },
  { day: '周二', high: 25, low: 16, icon: '⛅', desc: '多云' },
  { day: '周三', high: 21, low: 14, icon: '🌧️', desc: '小雨' },
  { day: '周四', high: 19, low: 12, icon: '🌧️', desc: '中雨' },
  { day: '周五', high: 22, low: 15, icon: '⛅', desc: '多云转晴' },
]

export default function Weather() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app-container app-weather" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', padding: 20, overflow: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 600 }}>{weatherData.city}</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
          {currentTime.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 64 }}>{weatherData.icon}</div>
        <div style={{ fontSize: 56, fontWeight: 200, lineHeight: 1 }}>{weatherData.temp}°C</div>
        <div style={{ fontSize: 18, color: '#ccc', marginTop: 4 }}>{weatherData.condition}</div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>
          体感温度 {weatherData.feelsLike}°C
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="app-weather-detail" style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#888' }}>湿度</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{weatherData.humidity}%</div>
        </div>
        <div className="app-weather-detail" style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#888' }}>风速</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{weatherData.windSpeed}</div>
        </div>
        <div className="app-weather-detail" style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#888' }}>能见度</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{weatherData.visibility}</div>
        </div>
        <div className="app-weather-detail" style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#888' }}>气压</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{weatherData.pressure}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#ccc' }}>5天预报</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {forecast.map((day, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 8,
              }}
            >
              <span style={{ width: 50, fontWeight: 500 }}>{day.day}</span>
              <span style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{day.icon}</span>
              <span style={{ color: '#ccc', width: 60, textAlign: 'center', fontSize: 13 }}>{day.desc}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                <span style={{ color: '#aaa' }}>{day.low}°</span>
                {' '}
                <span>{day.high}°</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 13 }}>
        <div>
          <div style={{ color: '#888' }}>日出</div>
          <div>{weatherData.sunrise}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>日落</div>
          <div>{weatherData.sunset}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>紫外线</div>
          <div>{weatherData.uvIndex}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>风向</div>
          <div>{weatherData.windDir}</div>
        </div>
      </div>
    </div>
  )
}