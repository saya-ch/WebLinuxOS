import { useState, useCallback, memo, useEffect } from 'react'

interface AQIData {
  location: string
  aqi: number
  category: string
  color: string
  healthAdvice: string
  pm25: number
  pm10: number
  o3: number
  no2: number
  so2: number
  co: number
}

const AQI_CATEGORIES = [
  { range: [0, 50], category: '优', color: '#00e400', advice: '空气质量令人满意，基本无空气污染，各类人群可正常活动。' },
  { range: [51, 100], category: '良', color: '#ffff00', advice: '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响，建议极少数异常敏感人群减少户外活动。' },
  { range: [101, 150], category: '轻度污染', color: '#ff7e00', advice: '易感人群症状有轻度加剧，健康人群出现刺激症状。建议儿童、老年人及心脏病、呼吸系统疾病患者减少长时间、高强度的户外锻炼。' },
  { range: [151, 200], category: '中度污染', color: '#ff0000', advice: '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响，建议疾病患者避免长时间、高强度的户外锻炼，一般人群适量减少户外运动。' },
  { range: [201, 300], category: '重度污染', color: '#99004c', advice: '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状，建议儿童、老年人和病人留在室内，避免体力消耗，一般人群避免户外活动。' },
  { range: [301, 500], category: '严重污染', color: '#7e0023', advice: '健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病，建议儿童、老年人和病人留在室内，避免体力消耗，一般人群避免户外活动。' },
]

function getAQICategory(aqi: number): typeof AQI_CATEGORIES[0] {
  for (const cat of AQI_CATEGORIES) {
    if (aqi >= cat.range[0] && aqi <= cat.range[1]) return cat
  }
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
}

const POLLUTANTS = [
  { key: 'pm25', name: 'PM2.5', unit: 'μg/m³', desc: '细颗粒物，可深入肺泡' },
  { key: 'pm10', name: 'PM10', unit: 'μg/m³', desc: '可吸入颗粒物' },
  { key: 'o3', name: 'O₃', unit: 'μg/m³', desc: '臭氧' },
  { key: 'no2', name: 'NO₂', unit: 'μg/m³', desc: '二氧化氮' },
  { key: 'so2', name: 'SO₂', unit: 'μg/m³', desc: '二氧化硫' },
  { key: 'co', name: 'CO', unit: 'mg/m³', desc: '一氧化碳' },
]

const MAJOR_CITIES = [
  { name: '北京', coords: [39.9042, 116.4074] },
  { name: '上海', coords: [31.2304, 121.4737] },
  { name: '广州', coords: [23.1291, 113.2644] },
  { name: '深圳', coords: [22.5431, 114.0579] },
  { name: '杭州', coords: [30.2741, 120.1551] },
  { name: '成都', coords: [30.5728, 104.0668] },
  { name: '武汉', coords: [30.5928, 114.3055] },
  { name: '西安', coords: [34.3416, 108.9398] },
  { name: '南京', coords: [32.0603, 118.7969] },
  { name: '重庆', coords: [29.4316, 106.9123] },
  { name: '天津', coords: [39.3434, 117.3616] },
  { name: '苏州', coords: [31.2989, 120.5853] },
]

const AirQualityMonitor = memo(function AirQualityMonitor() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState(MAJOR_CITIES[0])
  const [aqiData, setAqiData] = useState<AQIData | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<{ city: string; aqi: number; time: string }[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('weblinux-aqi-history')
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const fetchAQI = useCallback(async (city: typeof MAJOR_CITIES[0]) => {
    setLoading(true)
    setError(null)
    try {
      const [lat, lon] = city.coords
      const response = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide`
      )
      if (!response.ok) throw new Error('获取数据失败')
      const data = await response.json()
      
      const current = data.current
      const aqi = current.us_aqi ?? 0
      const category = getAQICategory(aqi)
      
      const newData: AQIData = {
        location: city.name,
        aqi,
        category: category.category,
        color: category.color,
        healthAdvice: category.advice,
        pm25: current.pm2_5 ?? 0,
        pm10: current.pm10 ?? 0,
        o3: current.ozone ?? 0,
        no2: current.nitrogen_dioxide ?? 0,
        so2: current.sulphur_dioxide ?? 0,
        co: current.carbon_monoxide ?? 0,
      }
      
      setAqiData(newData)
      
      const newHistory = [
        { city: city.name, aqi, time: new Date().toLocaleTimeString() },
        ...history.filter(h => h.city !== city.name)
      ].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem('weblinux-aqi-history', JSON.stringify(newHistory))
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [history])

  useEffect(() => {
    fetchAQI(selectedCity)
  }, [])

  const handleCityChange = (city: typeof MAJOR_CITIES[0]) => {
    setSelectedCity(city)
    fetchAQI(city)
  }

  const getGaugeRotation = (aqi: number) => {
    const maxAQI = 500
    const percentage = Math.min(aqi / maxAQI, 1)
    return -135 + (percentage * 270)
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🌬️</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>空气质量监测</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              实时数据来源: Open-Meteo
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedCity.name}
            onChange={(e) => {
              const city = MAJOR_CITIES.find(c => c.name === e.target.value)
              if (city) handleCityChange(city)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {MAJOR_CITIES.map(city => (
              <option key={city.name} value={city.name} style={{ background: '#1a1a2e' }}>
                {city.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchAQI(selectedCity)}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? 'rgba(255,255,255,0.2)' : '#6c5ce7',
              color: '#fff',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {error && (
          <div style={{
            padding: '16px',
            background: 'rgba(255,77,95,0.2)',
            border: '1px solid rgba(255,77,95,0.4)',
            borderRadius: '12px',
            color: '#ff4d5f',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {aqiData && (
          <>
            {/* AQI Gauge */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'relative',
                width: '200px',
                height: '120px',
                marginBottom: '16px'
              }}>
                <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
                  {/* Background arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Colored segments */}
                  {AQI_CATEGORIES.map((cat, i) => {
                    const startPercent = cat.range[0] / 500
                    const endPercent = cat.range[1] / 500
                    const startAngle = -135 + startPercent * 270
                    const endAngle = -135 + endPercent * 270
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    const x1 = 100 + 80 * Math.cos(startRad)
                    const y1 = 100 + 80 * Math.sin(startRad)
                    const x2 = 100 + 80 * Math.cos(endRad)
                    const y2 = 100 + 80 * Math.sin(endRad)
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2}`}
                        fill="none"
                        stroke={cat.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    )
                  })}
                  {/* Needle */}
                  <g transform={`rotate(${getGaugeRotation(aqiData.aqi)}, 100, 100)`}>
                    <line
                      x1="100" y1="100" x2="100" y2="35"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="100" cy="100" r="8" fill="#fff" />
                  </g>
                </svg>
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: aqiData.color,
                    textShadow: `0 0 20px ${aqiData.color}`
                  }}>
                    {aqiData.aqi}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    AQI
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{
                  padding: '4px 12px',
                  background: aqiData.color,
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: aqiData.aqi > 200 ? '#fff' : '#000'
                }}>
                  {aqiData.category}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                  {aqiData.location}
                </span>
              </div>
              <p style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: 0
              }}>
                {aqiData.healthAdvice}
              </p>
            </div>

            {/* Pollutants Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {POLLUTANTS.map(p => {
                const value = aqiData[p.key as keyof AQIData] as number
                return (
                  <div key={p.key} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px', color: '#fff' }}>
                      {value.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      {p.unit}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      {p.desc}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* History */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>查询历史</h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6c5ce7',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showHistory ? '收起' : '展开'}
                </button>
              </div>
              {showHistory && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '8px'
                }}>
                  {history.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', gridColumn: '1/-1', textAlign: 'center' }}>
                      暂无历史记录
                    </p>
                  ) : (
                    history.map((h, i) => (
                      <div key={i} style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{h.city}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: getAQICategory(h.aqi).color }}>
                          {h.aqi}
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{h.time}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {!aqiData && !error && !loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</span>
            <p style={{ fontSize: '16px' }}>选择城市查看空气质量</p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#6c5ce7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
    </div>
  )
})

export default AirQualityMonitor
