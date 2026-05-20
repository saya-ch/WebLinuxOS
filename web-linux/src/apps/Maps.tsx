import { useState, useRef, useEffect, useCallback } from 'react'

interface City {
  name: string
  nameZh: string
  lat: number
  lng: number
  pop: string
  country: string
  desc: string
}

const cities: City[] = [
  { name: 'Beijing', nameZh: '北京', lat: 39.9, lng: 116.4, pop: '2171万', country: '中国', desc: '中国首都，政治文化中心' },
  { name: 'Shanghai', nameZh: '上海', lat: 31.2, lng: 121.5, pop: '2489万', country: '中国', desc: '中国最大城市，国际金融中心' },
  { name: 'Tokyo', nameZh: '东京', lat: 35.7, lng: 139.7, pop: '1396万', country: '日本', desc: '日本首都，全球最大都市圈' },
  { name: 'New York', nameZh: '纽约', lat: 40.7, lng: -74.0, pop: '841万', country: '美国', desc: '美国最大城市，全球金融中心' },
  { name: 'London', nameZh: '伦敦', lat: 51.5, lng: -0.1, pop: '898万', country: '英国', desc: '英国首都，世界文化之都' },
  { name: 'Paris', nameZh: '巴黎', lat: 48.9, lng: 2.3, pop: '215万', country: '法国', desc: '法国首都，浪漫之都' },
  { name: 'Sydney', nameZh: '悉尼', lat: -33.9, lng: 151.2, pop: '531万', country: '澳大利亚', desc: '澳大利亚最大城市' },
  { name: 'Moscow', nameZh: '莫斯科', lat: 55.8, lng: 37.6, pop: '1267万', country: '俄罗斯', desc: '俄罗斯首都，欧洲最大城市' },
  { name: 'Dubai', nameZh: '迪拜', lat: 25.2, lng: 55.3, pop: '331万', country: '阿联酋', desc: '中东商业和旅游中心' },
  { name: 'Mumbai', nameZh: '孟买', lat: 19.1, lng: 72.9, pop: '2067万', country: '印度', desc: '印度金融首都' },
  { name: 'São Paulo', nameZh: '圣保罗', lat: -23.5, lng: -46.6, pop: '1221万', country: '巴西', desc: '南美洲最大城市' },
  { name: 'Cairo', nameZh: '开罗', lat: 30.0, lng: 31.2, pop: '1003万', country: '埃及', desc: '非洲最大城市，古埃及文明中心' },
  { name: 'Singapore', nameZh: '新加坡', lat: 1.3, lng: 103.8, pop: '564万', country: '新加坡', desc: '亚洲四小龙之一，花园城市' },
  { name: 'Seoul', nameZh: '首尔', lat: 37.6, lng: 127.0, pop: '977万', country: '韩国', desc: '韩国首都，韩流文化中心' },
  { name: 'Berlin', nameZh: '柏林', lat: 52.5, lng: 13.4, pop: '376万', country: '德国', desc: '德国首都，欧洲政治中心' },
  { name: 'Los Angeles', nameZh: '洛杉矶', lat: 34.1, lng: -118.2, pop: '397万', country: '美国', desc: '好莱坞所在地，娱乐之都' },
  { name: 'Toronto', nameZh: '多伦多', lat: 43.7, lng: -79.4, pop: '293万', country: '加拿大', desc: '加拿大最大城市' },
  { name: 'Bangkok', nameZh: '曼谷', lat: 13.8, lng: 100.5, pop: '1057万', country: '泰国', desc: '泰国首都，东南亚旅游胜地' },
  { name: 'Istanbul', nameZh: '伊斯坦布尔', lat: 41.0, lng: 29.0, pop: '1546万', country: '土耳其', desc: '横跨欧亚大陆的历史名城' },
  { name: 'Mexico City', nameZh: '墨西哥城', lat: 19.4, lng: -99.1, pop: '913万', country: '墨西哥', desc: '北美洲最大西语城市' },
]

const continentOutlines: Array<Array<[number, number]>> = [
  [[-130,50],[-125,55],[-120,60],[-110,65],[-100,70],[-85,72],[-75,68],[-60,55],[-65,45],[-70,42],[-75,35],[-80,30],[-85,25],[-90,20],[-95,18],[-100,20],[-105,22],[-110,30],[-115,33],[-120,38],[-125,45],[-130,50]],
  [[-80,10],[-75,5],[-70,-5],[-65,-15],[-60,-25],[-55,-35],[-60,-45],[-65,-50],[-70,-45],[-75,-35],[-75,-20],[-78,-5],[-80,5],[-80,10]],
  [[-10,35],[0,38],[5,43],[0,48],[-5,48],[5,52],[10,55],[15,55],[20,55],[25,58],[30,60],[35,58],[40,55],[30,45],[25,38],[20,35],[10,37],[5,37],[0,36],[-10,35]],
  [[-15,15],[-15,30],[-5,35],[10,35],[15,30],[30,30],[35,25],[40,15],[50,12],[45,0],[40,-10],[35,-25],[30,-35],[25,-30],[20,-20],[15,-10],[10,0],[5,5],[0,5],[-5,5],[-10,10],[-15,15]],
  [[30,35],[35,40],[40,45],[50,50],[60,55],[70,60],[80,65],[90,60],[100,55],[110,50],[120,45],[130,40],[140,42],[145,45],[140,50],[130,55],[120,55],[110,50],[100,45],[90,40],[80,35],[70,30],[60,25],[50,25],[40,30],[30,35]],
  [[115,-15],[120,-12],[130,-12],[140,-15],[150,-20],[150,-28],[145,-35],[140,-38],[130,-35],[120,-30],[115,-25],[115,-15]],
]

function latLngToXY(lat: number, lng: number, w: number, h: number, scale: number, offsetX: number, offsetY: number) {
  const x = (lng + 180) / 360 * w * scale + offsetX
  const y = (90 - lat) / 180 * h * scale + offsetY
  return { x, y }
}

export default function Maps() {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [measuring, setMeasuring] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<Array<{ x: number; y: number; lat: number; lng: number }>>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(30, 60, 100, 0.3)'
    ctx.lineWidth = 0.5
    for (let lng = -180; lng <= 180; lng += 30) {
      const p = latLngToXY(0, lng, w, h, scale, offset.x, offset.y)
      ctx.beginPath()
      ctx.moveTo(p.x, 0)
      ctx.lineTo(p.x, h)
      ctx.stroke()
    }
    for (let lat = -90; lat <= 90; lat += 30) {
      const p = latLngToXY(lat, 0, w, h, scale, offset.x, offset.y)
      ctx.beginPath()
      ctx.moveTo(0, p.y)
      ctx.lineTo(w, p.y)
      ctx.stroke()
    }

    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 1
    continentOutlines.forEach(outline => {
      ctx.beginPath()
      outline.forEach((point, i) => {
        const p = latLngToXY(point[1], point[0], w, h, scale, offset.x, offset.y)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(30, 60, 100, 0.4)'
      ctx.fill()
      ctx.stroke()
    })

    cities.forEach(city => {
      const p = latLngToXY(city.lat, city.lng, w, h, scale, offset.x, offset.y)
      if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) return

      const isSelected = selectedCity?.name === city.name
      ctx.beginPath()
      ctx.arc(p.x, p.y, isSelected ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = isSelected ? '#f38ba8' : '#89b4fa'
      ctx.fill()

      if (isSelected) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(243, 139, 168, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (scale >= 0.8) {
        ctx.fillStyle = '#cdd6f4'
        ctx.font = `${Math.max(10, 11 * scale)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(city.nameZh, p.x, p.y - 10)
      }
    })

    if (measurePoints.length >= 2) {
      ctx.beginPath()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#f9e2af'
      ctx.lineWidth = 2
      measurePoints.forEach((p, i) => {
        const pos = latLngToXY(p.lat, p.lng, w, h, scale, offset.x, offset.y)
        if (i === 0) ctx.moveTo(pos.x, pos.y)
        else ctx.lineTo(pos.x, pos.y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      measurePoints.forEach(p => {
        const pos = latLngToXY(p.lat, p.lng, w, h, scale, offset.x, offset.y)
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#f9e2af'
        ctx.fill()
      })
    }
  }, [scale, offset, selectedCity, measurePoints])

  useEffect(() => {
    drawMap()
  }, [drawMap])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => Math.max(0.5, Math.min(5, s + delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging) return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    if (measuring) {
      const lng = (clickX - offset.x) / (rect.width * scale) * 360 - 180
      const lat = 90 - (clickY - offset.y) / (rect.height * scale) * 180
      setMeasurePoints(prev => [...prev, { x: clickX, y: clickY, lat, lng }])
      return
    }

    let closest: City | null = null
    let minDist = 20
    cities.forEach(city => {
      const p = latLngToXY(city.lat, city.lng, rect.width, rect.height, scale, offset.x, offset.y)
      const dist = Math.sqrt((p.x - clickX) ** 2 + (p.y - clickY) ** 2)
      if (dist < minDist) {
        minDist = dist
        closest = city
      }
    })
    setSelectedCity(closest)
  }

  const calcDistance = () => {
    if (measurePoints.length < 2) return null
    const p1 = measurePoints[measurePoints.length - 2]
    const p2 = measurePoints[measurePoints.length - 1]
    const R = 6371
    const dLat = (p2.lat - p1.lat) * Math.PI / 180
    const dLng = (p2.lng - p1.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  const filteredCities = searchQuery
    ? cities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.nameZh.includes(searchQuery))
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a1628', color: '#cdd6f4', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '8px 12px', background: '#111827', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text" placeholder="搜索城市..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #1e3a5f', background: '#0a1628', color: '#cdd6f4', fontSize: 12, width: 160, outline: 'none' }}
          />
          {filteredCities.length > 0 && searchQuery && (
            <div style={{
              position: 'absolute', top: 32, left: 0, zIndex: 10, background: '#111827',
              border: '1px solid #1e3a5f', borderRadius: 4, width: 200, maxHeight: 200, overflow: 'auto',
            }}>
              {filteredCities.map(c => (
                <div key={c.name} onClick={() => { setSelectedCity(c); setSearchQuery(''); setOffset({ x: 0, y: 0 }); setScale(1.5) }}
                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #1e3a5f' }}>
                  {c.nameZh} ({c.name})
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setScale(s => Math.min(5, s + 0.2))} style={mapBtn}>🔍+</button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={mapBtn}>🔍−</button>
        <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} style={mapBtn}>⟳ 重置</button>
        <div style={{ width: 1, height: 18, background: '#1e3a5f' }} />
        <button onClick={() => { setMeasuring(!measuring); setMeasurePoints([]) }}
          style={{ ...mapBtn, background: measuring ? '#f9e2af33' : 'transparent', color: measuring ? '#f9e2af' : '#cdd6f4', border: measuring ? '1px solid #f9e2af' : '1px solid #1e3a5f' }}>
          📏 测距
        </button>
        {measuring && measurePoints.length > 0 && (
          <button onClick={() => setMeasurePoints([])} style={mapBtn}>清除</button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#6c7086' }}>缩放: {(scale * 100).toFixed(0)}%</span>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <div
          ref={containerRef}
          style={{ flex: 1, cursor: isDragging ? 'grabbing' : measuring ? 'crosshair' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {selectedCity && (
          <div style={{
            position: 'absolute', top: 12, right: 12, width: 220, background: '#111827',
            border: '1px solid #1e3a5f', borderRadius: 8, padding: 14, zIndex: 5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#89b4fa' }}>{selectedCity.nameZh}</span>
              <button onClick={() => setSelectedCity(null)} style={{ background: 'none', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 4 }}>{selectedCity.name}</div>
            <div style={{ fontSize: 12, marginBottom: 8 }}>{selectedCity.desc}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, color: '#6c7086' }}>
              <div>🌍 {selectedCity.country}</div>
              <div>👥 {selectedCity.pop}</div>
              <div>📍 {selectedCity.lat.toFixed(1)}°</div>
              <div>📍 {selectedCity.lng.toFixed(1)}°</div>
            </div>
          </div>
        )}

        {measuring && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12, background: '#111827',
            border: '1px solid #f9e2af', borderRadius: 6, padding: '8px 12px', zIndex: 5, fontSize: 12,
          }}>
            <div style={{ color: '#f9e2af', fontWeight: 600, marginBottom: 4 }}>📏 距离测量</div>
            <div style={{ color: '#a6adc8' }}>点击地图添加测量点</div>
            {measurePoints.length >= 2 && calcDistance() !== null && (
              <div style={{ color: '#a6e3a1', fontWeight: 600, marginTop: 4 }}>
                距离: {calcDistance()} km
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const mapBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 4, border: '1px solid #1e3a5f',
  background: 'transparent', color: '#cdd6f4', cursor: 'pointer', fontSize: 12
}
