import { useState } from 'react'

export default function Magnifier() {
  const [zoom, setZoom] = useState(8)
  const [showGrid, setShowGrid] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const pixelArt = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 1, 2, 1, 1, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 3, 3, 1, 1, 0],
    [0, 1, 4, 4, 4, 4, 1, 0],
    [0, 0, 1, 4, 4, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ]

  const colors = ['#1e1e2e', '#313244', '#89b4fa', '#a6e3a1', '#f9e2af']

  const cellSize = Math.max(2, zoom)

  const px = Math.floor(mousePos.x / cellSize)
  const py = Math.floor(mousePos.y / cellSize)
  const pixelX = Math.min(pixelArt[0].length - 1, Math.max(0, px))
  const pixelY = Math.min(pixelArt.length - 1, Math.max(0, py))
  const hoveredColor = colors[pixelArt[pixelY]?.[pixelX] ?? 0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>缩放: {zoom}x</span>
        <input
          type="range"
          min="1"
          max="20"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, maxWidth: '200px', accentColor: '#89b4fa' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a6adc8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          显示网格
        </label>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
        <div
          onMouseMove={handleMouseMove}
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: '8px',
            border: '2px solid #45475a', background: '#11111b',
          }}
        >
          <div style={{ padding: '12px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${pixelArt[0].length}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${pixelArt.length}, ${cellSize}px)`,
              gap: showGrid && zoom >= 4 ? '1px' : '0px',
            }}>
              {pixelArt.flat().map((colorIdx, i) => (
                <div
                  key={i}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    background: colors[colorIdx],
                    borderRadius: zoom >= 8 ? '1px' : '0px',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: '8px', right: '8px',
            background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '4px 10px',
            fontSize: '10px', color: '#a6adc8',
          }}>
            {pixelArt[0].length * cellSize + (showGrid && zoom >= 4 ? pixelArt[0].length - 1 : 0)}×{pixelArt.length * cellSize + (showGrid && zoom >= 4 ? pixelArt.length - 1 : 0)}px
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: '#a6adc8' }}>悬停像素:</span>
          <span>{`(${pixelX}, ${pixelY})`}</span>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: hoveredColor, border: '1px solid #45475a' }} />
          <span>{hoveredColor}</span>
        </div>
      </div>
    </div>
  )
}