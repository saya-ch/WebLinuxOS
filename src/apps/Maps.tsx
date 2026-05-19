import { useState } from 'react'
import { useStore } from '../store'

interface Marker {
  id: string
  name: string
  x: number
  y: number
  label: string
}

const markers: Marker[] = [
  { id: 'beijing', name: '北京', x: 65, y: 32, label: '首都' },
  { id: 'shanghai', name: '上海', x: 73, y: 48, label: '金融中心' },
  { id: 'guangzhou', name: '广州', x: 60, y: 62, label: '贸易中心' },
  { id: 'shenzhen', name: '深圳', x: 62, y: 64, label: '科技之都' },
  { id: 'chengdu', name: '成都', x: 45, y: 52, label: '天府之国' },
  { id: 'hangzhou', name: '杭州', x: 70, y: 46, label: '人间天堂' },
  { id: 'wuhan', name: '武汉', x: 60, y: 50, label: '九省通衢' },
  { id: 'xian', name: '西安', x: 48, y: 42, label: '古都' },
]

export default function Maps() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [zoom, setZoom] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [layer, setLayer] = useState<'standard' | 'satellite' | 'terrain'>('standard')
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null)

  const bg = isDark ? '#1a1a2e' : '#f0f0f0'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'

  const filtered = searchQuery.trim()
    ? markers.filter((m) => m.name.includes(searchQuery) || m.label.includes(searchQuery))
    : markers

  const layerColors: Record<string, string> = {
    standard: isDark ? '#16213e' : '#e8f4f8',
    satellite: isDark ? '#1a2a1a' : '#d4e8d4',
    terrain: isDark ? '#2a1a1a' : '#f0e8d8',
  }

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 3))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5))

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${borderColor}`, background: isDark ? '#16213e' : '#e8e8e8' }}>
        <input
          type="text" placeholder="搜索地点..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 12, outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 2 }}>
          {(['standard', 'satellite', 'terrain'] as const).map((l) => (
            <button key={l} onClick={() => setLayer(l)} style={{
              padding: '5px 10px', borderRadius: 4, border: layer === l ? `2px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : `1px solid ${borderColor}`,
              background: layer === l ? (isDark ? '#0f3460' : '#bbdefb') : inputBg, color: textColor, cursor: 'pointer', fontSize: 11,
            }}>
              {l === 'standard' ? '标准' : l === 'satellite' ? '卫星' : '地形'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={handleZoomOut} style={{ width: 30, height: 30, borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
          <button onClick={handleZoomIn} style={{ width: 30, height: 30, borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: layerColors[layer] }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          transform: `scale(${zoom})`, transformOrigin: 'top left',
          width: `${100 / zoom}%`, height: `${100 / zoom}%`,
        }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            <line x1="20%" y1="0" x2="20%" y2="100%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
            <line x1="40%" y1="0" x2="40%" y2="100%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
            <line x1="60%" y1="0" x2="60%" y2="100%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
            <line x1="80%" y1="0" x2="80%" y2="100%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
            <line x1="0" y1="25%" x2="100%" y2="25%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
            <line x1="0" y1="75%" x2="100%" y2="75%" stroke={isDark ? '#2a2a4a' : '#ccc'} strokeWidth="0.5" />
          </svg>

          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            <path d="M 15 70 Q 20 60, 25 55 Q 35 45, 45 40 Q 55 35, 65 32 L 65 35 Q 70 38, 75 42 Q 80 48, 85 52 L 83 55 Q 75 60, 70 65 Q 65 70, 60 75 Q 55 78, 50 80 L 45 78 Q 35 70, 25 68 Q 18 68, 15 70 Z"
              fill={isDark ? 'rgba(15,52,96,0.4)' : 'rgba(187,222,251,0.6)'} stroke={isDark ? '#2a2a4a' : '#90caf9'} strokeWidth="1" />
            {filtered.map((m) => (
              <g key={m.id} onClick={() => setSelectedMarker(m)} style={{ cursor: 'pointer' }}>
                <circle cx={`${m.x}%`} cy={`${m.y}%`} r="4" fill={isDark ? '#4fc3f7' : '#e53935'} stroke="#fff" strokeWidth="1.5" />
                <text x={`${m.x}%`} y={`${m.y - 4}%`} textAnchor="middle" fill={textColor} fontSize="10" fontWeight="600">
                  {m.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {selectedMarker && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, right: 16, background: isDark ? '#0f3460' : '#fff',
            borderRadius: 8, padding: 12, border: `1px solid ${borderColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedMarker.name}</div>
                <div style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#888', marginTop: 2 }}>{selectedMarker.label}</div>
              </div>
              <button onClick={() => setSelectedMarker(null)} style={{
                background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ fontSize: 11, color: isDark ? '#6b7280' : '#aaa', marginTop: 4 }}>
              坐标: {selectedMarker.x}°E, {selectedMarker.y}°N | 模拟位置
            </div>
          </div>
        )}
      </div>
    </div>
  )
}