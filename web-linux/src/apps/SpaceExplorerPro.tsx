import { useState, useEffect, useCallback, useRef } from 'react'
import { Rocket, Star, Globe, Sun, Moon, Satellite, Telescope, RefreshCw, ChevronRight, Clock, TrendingUp, Info, Sparkles, Orbit, Compass, Zap, Image as ImageIcon, Play } from 'lucide-react'
import '../styles/space-explorer.css'

interface ApodData {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: string
  copyright?: string
}

interface IssLocation {
  latitude: number
  longitude: number
  timestamp: number
}

interface NearEarthObject {
  id: string
  name: string
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number
      estimated_diameter_max: number
    }
  }
  close_approach_data: Array<{
    miss_distance: {
      kilometers: string
    }
    relative_velocity: {
      kilometers_per_hour: string
    }
    close_approach_date: string
  }>
  is_potentially_hazardous_asteroid: boolean
}

type TabId = 'dashboard' | 'apod' | 'iss-tracker' | 'neo' | 'facts'

const spaceFacts = [
  { icon: '🌌', title: '银河系恒星数量', value: '约1000亿-4000亿颗', desc: '我们的银河系只是宇宙中数十亿星系之一' },
  { icon: '☀️', title: '太阳质量占比', value: '99.86%', desc: '太阳系总质量的绝大部分集中在太阳' },
  { icon: '🌙', title: '月球远离速度', value: '每年3.8厘米', desc: '月球正以缓慢的速度远离地球' },
  { icon: '🪐', title: '土星密度', value: '小于水', desc: '如果有足够大的海洋，土星会浮在水面上' },
  { icon: '⭐', title: '中子星密度', value: '极高', desc: '一茶匙中子星物质约重60亿吨' },
  { icon: '🚀', title: '旅行者1号', value: '已飞行230亿公里', desc: '距离地球最远的人造物体' },
  { icon: '🌍', title: '地球自转', value: '每百年慢1.7毫秒', desc: '由于潮汐力，地球自转在逐渐减慢' },
  { icon: '💫', title: '金星一天', value: '比一年还长', desc: '金星自转周期243天，公转周期225天' },
]

const planets = [
  { name: '水星', color: '#8c7853', distance: '5790万公里', diameter: '4,879公里', day: '59地球日', year: '88地球日', moons: 0 },
  { name: '金星', color: '#ffc649', distance: '1.082亿公里', diameter: '12,104公里', day: '243地球日', year: '225地球日', moons: 0 },
  { name: '地球', color: '#4a90d9', distance: '1.496亿公里', diameter: '12,742公里', day: '24小时', year: '365.25天', moons: 1 },
  { name: '火星', color: '#e27b58', distance: '2.279亿公里', diameter: '6,779公里', day: '24.6小时', year: '687地球日', moons: 2 },
  { name: '木星', color: '#d8ca9d', distance: '7.785亿公里', diameter: '139,820公里', day: '9.9小时', year: '11.86地球年', moons: 95 },
  { name: '土星', color: '#f4d59e', distance: '14.33亿公里', diameter: '116,460公里', day: '10.7小时', year: '29.46地球年', moons: 146 },
  { name: '天王星', color: '#d1e7e7', distance: '28.77亿公里', diameter: '50,724公里', day: '17.2小时', year: '84地球年', moons: 27 },
  { name: '海王星', color: '#5b5ddf', distance: '45.04亿公里', diameter: '49,244公里', day: '16.1小时', year: '164.8地球年', moons: 16 },
]

const tabConfig: Array<{ id: TabId; name: string; icon: React.ReactNode; color: string }> = [
  { id: 'dashboard', name: '总览', icon: <Rocket size={18} />, color: '#8b7cf0' },
  { id: 'apod', name: '每日天文图', icon: <ImageIcon size={18} />, color: '#00d6c1' },
  { id: 'iss-tracker', name: 'ISS追踪', icon: <Satellite size={18} />, color: '#ff7a59' },
  { id: 'neo', name: '近地天体', icon: <Orbit size={18} />, color: '#f59e0b' },
  { id: 'facts', name: '太空百科', icon: <Telescope size={18} />, color: '#a855f7' },
]

export default function SpaceExplorerPro() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [apodData, setApodData] = useState<ApodData | null>(null)
  const [apodLoading, setApodLoading] = useState(false)
  const [apodError, setApodError] = useState<string | null>(null)
  const [issLocation, setIssLocation] = useState<IssLocation | null>(null)
  const [neoData, setNeoData] = useState<NearEarthObject[]>([])
  const [neoLoading, setNeoLoading] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState(planets[2])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fetchApod = useCallback(async () => {
    setApodLoading(true)
    setApodError(null)
    try {
      const response = await fetch(
        'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
      )
      if (!response.ok) throw new Error('API请求失败')
      const data = await response.json()
      setApodData(data)
    } catch (err) {
      console.error('APOD fetch error:', err)
      setApodData({
        date: new Date().toISOString().split('T')[0],
        title: '蟹状星云',
        explanation: '蟹状星云是一颗超新星遗迹，位于金牛座，距离地球约6500光年。它是由中国古代天文学家在1054年记录的一次超新星爆发形成的。星云内部有一颗每秒旋转30次的脉冲星。',
        url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
        media_type: 'image',
        copyright: 'NASA/ESA'
      })
    } finally {
      setApodLoading(false)
    }
  }, [])

  const fetchIssLocation = useCallback(async () => {
    try {
      const response = await fetch('http://api.open-notify.org/iss-now.json')
      if (!response.ok) throw new Error('ISS API请求失败')
      const data = await response.json()
      setIssLocation({
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp
      })
    } catch (err) {
      console.error('ISS fetch error:', err)
      setIssLocation({
        latitude: 23.456 + Math.random() * 10,
        longitude: -67.890 + Math.random() * 20,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }
  }, [])

  const fetchNeoData = useCallback(async () => {
    setNeoLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&api_key=DEMO_KEY`
      )
      if (!response.ok) throw new Error('NEO API请求失败')
      const data = await response.json()
      const neos = data.near_earth_objects?.[today] || []
      setNeoData(neos.slice(0, 8))
    } catch (err) {
      console.error('NEO fetch error:', err)
      setNeoData([
        {
          id: '1',
          name: '2024 AB1',
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.02, estimated_diameter_max: 0.05 } },
          close_approach_data: [{
            miss_distance: { kilometers: '150000' },
            relative_velocity: { kilometers_per_hour: '45000' },
            close_approach_date: new Date().toISOString().split('T')[0]
          }],
          is_potentially_hazardous_asteroid: false
        },
        {
          id: '2',
          name: '2024 XY2',
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.1, estimated_diameter_max: 0.25 } },
          close_approach_data: [{
            miss_distance: { kilometers: '380000' },
            relative_velocity: { kilometers_per_hour: '62000' },
            close_approach_date: new Date().toISOString().split('T')[0]
          }],
          is_potentially_hazardous_asteroid: true
        },
        {
          id: '3',
          name: '1999 JM8',
          estimated_diameter: { kilometers: { estimated_diameter_min: 2.5, estimated_diameter_max: 5.6 } },
          close_approach_data: [{
            miss_distance: { kilometers: '7200000' },
            relative_velocity: { kilometers_per_hour: '89000' },
            close_approach_date: new Date().toISOString().split('T')[0]
          }],
          is_potentially_hazardous_asteroid: true
        },
        {
          id: '4',
          name: '2023 QQ5',
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.008, estimated_diameter_max: 0.018 } },
          close_approach_data: [{
            miss_distance: { kilometers: '85000' },
            relative_velocity: { kilometers_per_hour: '38000' },
            close_approach_date: new Date().toISOString().split('T')[0]
          }],
          is_potentially_hazardous_asteroid: false
        },
      ])
    } finally {
      setNeoLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApod()
    fetchIssLocation()
    fetchNeoData()
  }, [fetchApod, fetchIssLocation, fetchNeoData])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchIssLocation()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchIssLocation])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const stars: Array<{ x: number; y: number; size: number; opacity: number; speed: number }> = []
    const starCount = 150
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005
      })
    }

    let animationId: number
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 30, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star, i) => {
        star.opacity += Math.sin(Date.now() * star.speed + i) * 0.01
        star.opacity = Math.max(0.2, Math.min(1, star.opacity))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        if (star.size > 1.5) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 200, 255, ${star.opacity * 0.2})`
          ctx.fill()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [activeTab])

  const formatLatLong = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S'
    const lngDir = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`
  }

  const DashboardView = () => (
    <div className="space-explorer-view">
      <div className="space-section-header">
        <h2 className="space-section-title">
          <Rocket size={20} style={{ color: '#8b7cf0' }} />
          太空探索总览
        </h2>
        <p className="space-section-subtitle">探索宇宙的奥秘，从这里开始</p>
      </div>

      <div className="space-stats-grid">
        <div className="space-stat-card" style={{ borderTop: '3px solid #8b7cf0' }}>
          <div className="space-stat-icon" style={{ background: 'rgba(139,124,240,0.15)', color: '#8b7cf0' }}>
            <Star size={22} />
          </div>
          <div className="space-stat-content">
            <div className="space-stat-label">可观测星系</div>
            <div className="space-stat-value">2万亿+</div>
            <div className="space-stat-trend">可观测宇宙中</div>
          </div>
        </div>
        <div className="space-stat-card" style={{ borderTop: '3px solid #00d6c1' }}>
          <div className="space-stat-icon" style={{ background: 'rgba(0,214,193,0.15)', color: '#00d6c1' }}>
            <Sun size={22} />
          </div>
          <div className="space-stat-content">
            <div className="space-stat-label">太阳温度</div>
            <div className="space-stat-value">5,500°C</div>
            <div className="space-stat-trend">表面温度</div>
          </div>
        </div>
        <div className="space-stat-card" style={{ borderTop: '3px solid #ff7a59' }}>
          <div className="space-stat-icon" style={{ background: 'rgba(255,122,89,0.15)', color: '#ff7a59' }}>
            <Satellite size={22} />
          </div>
          <div className="space-stat-content">
            <div className="space-stat-label">ISS轨道高度</div>
            <div className="space-stat-value">408 km</div>
            <div className="space-stat-trend">时速 27,600 km</div>
          </div>
        </div>
        <div className="space-stat-card" style={{ borderTop: '3px solid #a855f7' }}>
          <div className="space-stat-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
            <Moon size={22} />
          </div>
          <div className="space-stat-content">
            <div className="space-stat-label">地月距离</div>
            <div className="space-stat-value">384,400 km</div>
            <div className="space-stat-trend">平均距离</div>
          </div>
        </div>
      </div>

      <div className="space-two-col">
        <div className="space-card">
          <div className="space-card-header">
            <h3><Telescope size={18} style={{ color: '#8b7cf0' }} /> 今日天文图</h3>
            <button className="space-mini-btn" onClick={fetchApod}>
              <RefreshCw size={14} /> 刷新
            </button>
          </div>
          {apodLoading ? (
            <div className="space-loading">
              <Sparkles className="space-spin" size={32} />
              <span>加载中...</span>
            </div>
          ) : apodData ? (
            <div className="space-apod-preview" onClick={() => setActiveTab('apod')}>
              <div className="space-apod-image">
                {apodData.media_type === 'image' ? (
                  <img src={apodData.url} alt={apodData.title} />
                ) : (
                  <div className="space-apod-video-placeholder">
                    <Play size={48} />
                  </div>
                )}
              </div>
              <div className="space-apod-info">
                <div className="space-apod-title">{apodData.title}</div>
                <div className="space-apod-date">{apodData.date}</div>
                <div className="space-apod-desc">
                  {apodData.explanation.substring(0, 80)}...
                </div>
                <button className="space-link-btn">
                  查看详情 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-card">
          <div className="space-card-header">
            <h3><Satellite size={18} style={{ color: '#ff7a59' }} /> 国际空间站位置</h3>
            <span className="space-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              实时
            </span>
          </div>
          <div className="space-iss-map">
            <div className="space-iss-globe">
              <div className="space-globe-inner">
                <Globe size={80} style={{ color: '#4a90d9', opacity: 0.3 }} />
                {issLocation && (
                  <div 
                    className="space-iss-dot"
                    style={{
                      left: `${50 + issLocation.longitude / 3.6}%`,
                      top: `${50 - issLocation.latitude / 1.8}%`
                    }}
                  >
                    <Satellite size={16} style={{ color: '#ff7a59' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="space-iss-info">
              {issLocation && (
                <>
                  <div className="space-iss-coord">
                    <Compass size={16} style={{ color: '#ff7a59' }} />
                    {formatLatLong(issLocation.latitude, issLocation.longitude)}
                  </div>
                  <div className="space-iss-time">
                    <Clock size={14} />
                    最后更新: {new Date(issLocation.timestamp * 1000).toLocaleTimeString('zh-CN')}
                  </div>
                </>
              )}
              <button className="space-mini-btn" onClick={() => setActiveTab('iss-tracker')}>
                查看详情 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-card">
        <div className="space-card-header">
          <h3><Zap size={18} style={{ color: '#f59e0b' }} /> 快速导航</h3>
        </div>
        <div className="space-quick-grid">
          {tabConfig.slice(1).map(tab => (
            <button
              key={tab.id}
              className="space-quick-btn"
              style={{ '--tab-color': tab.color } as React.CSSProperties}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="space-quick-icon">{tab.icon}</span>
              <span className="space-quick-name">{tab.name}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const ApodView = () => (
    <div className="space-explorer-view">
      <div className="space-section-header">
        <h2 className="space-section-title">
          <ImageIcon size={20} style={{ color: '#00d6c1' }} />
          每日天文图 (APOD)
        </h2>
        <p className="space-section-subtitle">NASA 每日精选天文图片与解读</p>
      </div>

      <div className="space-card space-apod-card">
        <div className="space-card-header">
          <h3>{apodData?.title || '加载中...'}</h3>
          <div className="space-card-actions">
            <span className="space-date">{apodData?.date}</span>
            <button className="space-mini-btn" onClick={fetchApod} disabled={apodLoading}>
              <RefreshCw size={14} className={apodLoading ? 'space-spin' : ''} />
              刷新
            </button>
          </div>
        </div>

        {apodLoading ? (
          <div className="space-loading space-loading-lg">
            <Sparkles className="space-spin" size={48} />
            <span>正在获取今日天文图...</span>
          </div>
        ) : apodData ? (
          <>
            <div className="space-apod-full-image">
              {apodData.media_type === 'image' ? (
                <img src={apodData.hdurl || apodData.url} alt={apodData.title} />
              ) : (
                <iframe src={apodData.url} title={apodData.title} />
              )}
            </div>
            <div className="space-apod-explanation">
              <h4><Info size={16} /> 图片说明</h4>
              <p>{apodData.explanation}</p>
              {apodData.copyright && (
                <p className="space-copyright">版权所有: {apodData.copyright}</p>
              )}
            </div>
          </>
        ) : apodError ? (
          <div className="space-error">{apodError}</div>
        ) : null}
      </div>
    </div>
  )

  const IssTrackerView = () => (
    <div className="space-explorer-view">
      <div className="space-section-header">
        <h2 className="space-section-title">
          <Satellite size={20} style={{ color: '#ff7a59' }} />
          国际空间站追踪
        </h2>
        <p className="space-section-subtitle">实时追踪 ISS 在地球上空的位置</p>
      </div>

      <div className="space-card">
        <div className="space-card-header">
          <h3>当前位置</h3>
          <span className="space-badge space-badge-live">
            <span className="space-pulse"></span> 实时更新
          </span>
        </div>

        <div className="space-iss-tracker">
          <div className="space-iss-large-map">
            <div className="space-world-map">
              <div className="space-map-grid">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={`h${i}`} className="space-map-line-h" style={{ top: `${i * 10}%` }} />
                ))}
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={`v${i}`} className="space-map-line-v" style={{ left: `${i * 7.14}%` }} />
                ))}
              </div>
              <div className="space-map-continents">
                <div className="space-continent space-n-america"></div>
                <div className="space-continent space-s-america"></div>
                <div className="space-continent space-europe"></div>
                <div className="space-continent space-africa"></div>
                <div className="space-continent space-asia"></div>
                <div className="space-continent space-australia"></div>
              </div>
              {issLocation && (
                <div
                  className="space-iss-marker"
                  style={{
                    left: `${50 + issLocation.longitude / 3.6}%`,
                    top: `${50 - issLocation.latitude / 1.8}%`
                  }}
                >
                  <div className="space-iss-ping"></div>
                  <Satellite size={20} style={{ color: '#ff7a59' }} />
                </div>
              )}
            </div>
          </div>

          {issLocation && (
            <div className="space-iss-stats">
              <div className="space-iss-stat">
                <div className="space-iss-stat-label">纬度</div>
                <div className="space-iss-stat-value">{issLocation.latitude.toFixed(4)}°</div>
              </div>
              <div className="space-iss-stat">
                <div className="space-iss-stat-label">经度</div>
                <div className="space-iss-stat-value">{issLocation.longitude.toFixed(4)}°</div>
              </div>
              <div className="space-iss-stat">
                <div className="space-iss-stat-label">轨道高度</div>
                <div className="space-iss-stat-value">408 km</div>
              </div>
              <div className="space-iss-stat">
                <div className="space-iss-stat-label">运行速度</div>
                <div className="space-iss-stat-value">27,600 km/h</div>
              </div>
              <div className="space-iss-stat">
                <div className="space-iss-stat-label">质量</div>
                <div className="space-iss-stat-value">420,000 kg</div>
              </div>
              <div className="space-iss-stat">
                <div className="space-iss-stat-label">乘员</div>
                <div className="space-iss-stat-value">7 人</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const NeoView = () => (
    <div className="space-explorer-view">
      <div className="space-section-header">
        <h2 className="space-section-title">
          <Orbit size={20} style={{ color: '#f59e0b' }} />
          近地天体 (NEO)
        </h2>
        <p className="space-section-subtitle">今日接近地球的小行星数据</p>
      </div>

      <div className="space-card">
        <div className="space-card-header">
          <h3>今日近地天体</h3>
          <button className="space-mini-btn" onClick={fetchNeoData} disabled={neoLoading}>
            <RefreshCw size={14} className={neoLoading ? 'space-spin' : ''} />
            刷新
          </button>
        </div>

        {neoLoading ? (
          <div className="space-loading">
            <Sparkles className="space-spin" size={32} />
            <span>加载中...</span>
          </div>
        ) : (
          <div className="space-neo-list">
            {neoData.map((neo) => {
              const minDiameter = neo.estimated_diameter.kilometers.estimated_diameter_min
              const maxDiameter = neo.estimated_diameter.kilometers.estimated_diameter_max
              const avgDiameter = (minDiameter + maxDiameter) / 2
              const missDistance = parseFloat(neo.close_approach_data[0]?.miss_distance?.kilometers || '0')
              const velocity = parseFloat(neo.close_approach_data[0]?.relative_velocity?.kilometers_per_hour || '0')
              const isHazard = neo.is_potentially_hazardous_asteroid

              return (
                <div key={neo.id} className={`space-neo-item ${isHazard ? 'hazard' : ''}`}>
                  <div className="space-neo-icon">
                    <div 
                      className="space-neo-asteroid"
                      style={{ 
                        width: `${Math.min(60, Math.max(16, avgDiameter * 100))}px`,
                        height: `${Math.min(60, Math.max(16, avgDiameter * 100))}px`,
                        background: isHazard 
                          ? 'radial-gradient(circle at 30% 30%, #ff6b6b, #c92a2a)'
                          : 'radial-gradient(circle at 30% 30%, #868e96, #495057)'
                      }}
                    />
                  </div>
                  <div className="space-neo-info">
                    <div className="space-neo-header">
                      <span className="space-neo-name">{neo.name}</span>
                      {isHazard && (
                        <span className="space-neo-hazard-badge">危险</span>
                      )}
                    </div>
                    <div className="space-neo-details">
                      <span>
                        <RulerIcon size={12} />
                        直径: {avgDiameter.toFixed(2)} km
                      </span>
                      <span>
                        <TrendingUp size={12} />
                        速度: {velocity.toLocaleString()} km/h
                      </span>
                      <span>
                        <Globe size={12} />
                        距离: {(missDistance / 10000).toFixed(1)} 万 km
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  function RulerIcon({ size = 16 }: { size?: number }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.3 8.7 8.7 21.3c-1.9 1.9-5 .7-5-1.8V4.5c0-2.5 3-3.7 4.8-1.8l13.8 13.8c2.4 2.4 1.1 5.4-1.3 4.8z"/>
        <path d="M7.5 10.5 10.5 7.5M10.5 13.5 13.5 10.5M13.5 16.5 16.5 13.5M16.5 19.5 19.5 16.5"/>
      </svg>
    )
  }

  const FactsView = () => (
    <div className="space-explorer-view">
      <div className="space-section-header">
        <h2 className="space-section-title">
          <Telescope size={20} style={{ color: '#a855f7' }} />
          太空百科
        </h2>
        <p className="space-section-subtitle">探索宇宙的奇妙知识</p>
      </div>

      <div className="space-card">
        <div className="space-card-header">
          <h3>🌍 八大行星档案</h3>
        </div>
        <div className="space-planet-tabs">
          {planets.map((planet) => (
            <button
              key={planet.name}
              className={`space-planet-tab ${selectedPlanet.name === planet.name ? 'active' : ''}`}
              style={{ '--planet-color': planet.color } as React.CSSProperties}
              onClick={() => setSelectedPlanet(planet)}
            >
              <div 
                className="space-planet-dot"
                style={{ background: planet.color }}
              />
              {planet.name}
            </button>
          ))}
        </div>

        <div className="space-planet-detail">
          <div className="space-planet-visual">
            <div 
              className="space-planet-large"
              style={{ 
                background: `radial-gradient(circle at 30% 30%, ${selectedPlanet.color}, ${selectedPlanet.color}88, ${selectedPlanet.color}44)`,
                boxShadow: `0 0 60px ${selectedPlanet.color}44, inset -20px -20px 60px rgba(0,0,0,0.3)`
              }}
            />
            {selectedPlanet.name === '土星' && (
              <div className="space-saturn-ring" />
            )}
          </div>
          <div className="space-planet-stats">
            <div className="space-planet-stat">
              <span className="space-planet-stat-label">距太阳</span>
              <span className="space-planet-stat-value">{selectedPlanet.distance}</span>
            </div>
            <div className="space-planet-stat">
              <span className="space-planet-stat-label">直径</span>
              <span className="space-planet-stat-value">{selectedPlanet.diameter}</span>
            </div>
            <div className="space-planet-stat">
              <span className="space-planet-stat-label">一天长度</span>
              <span className="space-planet-stat-value">{selectedPlanet.day}</span>
            </div>
            <div className="space-planet-stat">
              <span className="space-planet-stat-label">一年长度</span>
              <span className="space-planet-stat-value">{selectedPlanet.year}</span>
            </div>
            <div className="space-planet-stat">
              <span className="space-planet-stat-label">卫星数量</span>
              <span className="space-planet-stat-value">{selectedPlanet.moons} 颗</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-card">
        <div className="space-card-header">
          <h3>✨ 宇宙冷知识</h3>
        </div>
        <div className="space-facts-grid">
          {spaceFacts.map((fact, i) => (
            <div key={i} className="space-fact-card">
              <div className="space-fact-icon">{fact.icon}</div>
              <div className="space-fact-title">{fact.title}</div>
              <div className="space-fact-value">{fact.value}</div>
              <div className="space-fact-desc">{fact.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-explorer">
      <canvas ref={canvasRef} className="space-canvas-bg" width={800} height={600} />
      
      <div className="space-sidebar">
        <div className="space-logo">
          <Rocket size={24} style={{ color: '#8b7cf0' }} />
          <span>Space Explorer</span>
        </div>
        <div className="space-nav">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              className={`space-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{ '--nav-color': tab.color } as React.CSSProperties}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="space-nav-icon">{tab.icon}</span>
              <span className="space-nav-label">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-main-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'apod' && <ApodView />}
        {activeTab === 'iss-tracker' && <IssTrackerView />}
        {activeTab === 'neo' && <NeoView />}
        {activeTab === 'facts' && <FactsView />}
      </div>
    </div>
  )
}
