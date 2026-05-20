import { useState, useRef, useEffect, useCallback } from 'react'

export default function Magnifier() {
  const [zoom, setZoom] = useState(4)
  const [shape, setShape] = useState<'circle' | 'square'>('circle')
  const [frozen, setFrozen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [colorInfo, setColorInfo] = useState({ r: 0, g: 0, b: 0, hex: '#000000' })

  const sourceCanvasRef = useRef<HTMLCanvasElement>(null)
  const lensCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const frozenImageData = useRef<ImageData | null>(null)

  const LENS_SIZE = 200

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')

  const drawSourceImage = useCallback(() => {
    const canvas = sourceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const grad1 = ctx.createLinearGradient(0, 0, w, h)
    grad1.addColorStop(0, '#1e1e2e')
    grad1.addColorStop(0.3, '#313244')
    grad1.addColorStop(0.6, '#45475a')
    grad1.addColorStop(1, '#585b70')
    ctx.fillStyle = grad1
    ctx.fillRect(0, 0, w, h)

    const grad2 = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, w * 0.4)
    grad2.addColorStop(0, '#f38ba8')
    grad2.addColorStop(0.5, '#fab387')
    grad2.addColorStop(1, 'transparent')
    ctx.fillStyle = grad2
    ctx.fillRect(0, 0, w, h)

    const grad3 = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, w * 0.35)
    grad3.addColorStop(0, '#89b4fa')
    grad3.addColorStop(0.5, '#74c7ec')
    grad3.addColorStop(1, 'transparent')
    ctx.fillStyle = grad3
    ctx.fillRect(0, 0, w, h)

    const grad4 = ctx.createRadialGradient(w * 0.5, h * 0.8, 0, w * 0.5, h * 0.8, w * 0.3)
    grad4.addColorStop(0, '#a6e3a1')
    grad4.addColorStop(0.5, '#94e2d5')
    grad4.addColorStop(1, 'transparent')
    ctx.fillStyle = grad4
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(205, 214, 244, 0.15)'
    ctx.lineWidth = 2
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.5, 30 + i * 40, 0, Math.PI * 2)
      ctx.stroke()
    }

    const shapes = [
      { x: w * 0.15, y: h * 0.2, size: 40, color: '#f9e2af', rotation: 0.3 },
      { x: w * 0.8, y: h * 0.15, size: 35, color: '#cba6f7', rotation: 0.8 },
      { x: w * 0.6, y: h * 0.35, size: 25, color: '#f38ba8', rotation: 1.2 },
      { x: w * 0.25, y: h * 0.7, size: 45, color: '#89b4fa', rotation: 0.5 },
      { x: w * 0.75, y: h * 0.75, size: 30, color: '#a6e3a1', rotation: 1.0 },
      { x: w * 0.5, y: h * 0.15, size: 20, color: '#fab387', rotation: 0.7 },
    ]
    shapes.forEach(s => {
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.rotation)
      ctx.fillStyle = s.color
      ctx.globalAlpha = 0.6
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size)
      ctx.restore()
    })

    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#f5c2e7'
    ctx.beginPath()
    ctx.moveTo(w * 0.4, h * 0.45)
    ctx.lineTo(w * 0.55, h * 0.45)
    ctx.lineTo(w * 0.55, h * 0.55)
    ctx.lineTo(w * 0.65, h * 0.55)
    ctx.lineTo(w * 0.5, h * 0.7)
    ctx.lineTo(w * 0.35, h * 0.55)
    ctx.lineTo(w * 0.4, h * 0.55)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.strokeStyle = 'rgba(205, 214, 244, 0.08)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    const textItems = [
      { text: 'Catppuccin', x: w * 0.5, y: h * 0.08, size: 24, color: '#cdd6f4' },
      { text: 'Mocha', x: w * 0.5, y: h * 0.14, size: 16, color: '#a6adc8' },
      { text: '#f38ba8', x: w * 0.15, y: h * 0.92, size: 12, color: '#f38ba8' },
      { text: '#89b4fa', x: w * 0.4, y: h * 0.92, size: 12, color: '#89b4fa' },
      { text: '#a6e3a1', x: w * 0.65, y: h * 0.92, size: 12, color: '#a6e3a1' },
      { text: '#f9e2af', x: w * 0.85, y: h * 0.92, size: 12, color: '#f9e2af' },
    ]
    textItems.forEach(t => {
      ctx.fillStyle = t.color
      ctx.font = `${t.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(t.text, t.x, t.y)
    })
  }, [])

  useEffect(() => {
    const canvas = sourceCanvasRef.current
    if (!canvas) return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    drawSourceImage()
  }, [drawSourceImage])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (frozen) return

    const container = containerRef.current
    const sourceCanvas = sourceCanvasRef.current
    if (!container || !sourceCanvas) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })

    const srcCtx = sourceCanvas.getContext('2d')
    if (!srcCtx) return

    const scaleX = sourceCanvas.width / rect.width
    const scaleY = sourceCanvas.height / rect.height
    const srcX = Math.floor(x * scaleX)
    const srcY = Math.floor(y * scaleY)

    const pixel = srcCtx.getImageData(srcX, srcY, 1, 1).data
    const r = pixel[0], g = pixel[1], b = pixel[2]
    setColorInfo({ r, g, b, hex: rgbToHex(r, g, b) })

    const lensCanvas = lensCanvasRef.current
    if (!lensCanvas) return
    const lensCtx = lensCanvas.getContext('2d')
    if (!lensCtx) return

    const lensSize = LENS_SIZE
    lensCanvas.width = lensSize
    lensCanvas.height = lensSize

    lensCtx.clearRect(0, 0, lensSize, lensSize)

    if (shape === 'circle') {
      lensCtx.beginPath()
      lensCtx.arc(lensSize / 2, lensSize / 2, lensSize / 2, 0, Math.PI * 2)
      lensCtx.clip()
    }

    const sampleRadius = lensSize / (2 * zoom)
    const sx = srcX - sampleRadius
    const sy = srcY - sampleRadius
    const sw = sampleRadius * 2
    const sh = sampleRadius * 2

    lensCtx.imageSmoothingEnabled = false
    lensCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, lensSize, lensSize)

    if (zoom >= 4) {
      const pixelSize = zoom
      lensCtx.strokeStyle = 'rgba(255,255,255,0.15)'
      lensCtx.lineWidth = 0.5
      for (let gx = 0; gx < lensSize; gx += pixelSize) {
        lensCtx.beginPath()
        lensCtx.moveTo(gx, 0)
        lensCtx.lineTo(gx, lensSize)
        lensCtx.stroke()
      }
      for (let gy = 0; gy < lensSize; gy += pixelSize) {
        lensCtx.beginPath()
        lensCtx.moveTo(0, gy)
        lensCtx.lineTo(lensSize, gy)
        lensCtx.stroke()
      }
    }

    lensCtx.strokeStyle = 'rgba(137, 180, 250, 0.5)'
    lensCtx.lineWidth = 1
    const centerX = lensSize / 2
    const centerY = lensSize / 2
    const crossSize = 8
    lensCtx.beginPath()
    lensCtx.moveTo(centerX - crossSize, centerY)
    lensCtx.lineTo(centerX + crossSize, centerY)
    lensCtx.moveTo(centerX, centerY - crossSize)
    lensCtx.lineTo(centerX, centerY + crossSize)
    lensCtx.stroke()
  }, [frozen, zoom, shape])

  const handleFreeze = () => {
    if (!frozen) {
      const sourceCanvas = sourceCanvasRef.current
      if (!sourceCanvas) return
      const ctx = sourceCanvas.getContext('2d')
      if (!ctx) return
      frozenImageData.current = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
    }
    setFrozen(!frozen)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>缩放: {zoom}x</span>
        <input
          type="range"
          min="2"
          max="10"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, maxWidth: '160px', accentColor: '#89b4fa' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShape('circle')}
            style={{
              padding: '4px 10px', border: shape === 'circle' ? '1px solid #89b4fa' : '1px solid #45475a',
              borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              background: shape === 'circle' ? '#313244' : 'transparent', color: '#cdd6f4',
            }}
          >
            ⭕ 圆形
          </button>
          <button
            onClick={() => setShape('square')}
            style={{
              padding: '4px 10px', border: shape === 'square' ? '1px solid #89b4fa' : '1px solid #45475a',
              borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              background: shape === 'square' ? '#313244' : 'transparent', color: '#cdd6f4',
            }}
          >
            ⬜ 方形
          </button>
        </div>
        <button
          onClick={handleFreeze}
          style={{
            padding: '4px 10px', border: frozen ? '1px solid #f38ba8' : '1px solid #45475a',
            borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
            background: frozen ? '#f38ba833' : 'transparent', color: frozen ? '#f38ba8' : '#cdd6f4',
          }}
        >
          {frozen ? '❄️ 已冻结' : '🔓 冻结'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          style={{ flex: 1, position: 'relative', cursor: frozen ? 'default' : 'crosshair' }}
        >
          <canvas
            ref={sourceCanvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {!frozen && (mousePos.x > 0 || mousePos.y > 0) && (
            <div style={{
              position: 'absolute',
              left: mousePos.x - LENS_SIZE / 2,
              top: mousePos.y - LENS_SIZE / 2,
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <canvas
                ref={lensCanvasRef}
                style={{
                  width: LENS_SIZE,
                  height: LENS_SIZE,
                  borderRadius: shape === 'circle' ? '50%' : '8px',
                  border: '2px solid #89b4fa',
                  boxShadow: '0 0 20px rgba(137, 180, 250, 0.3)',
                }}
              />
            </div>
          )}

          {frozen && frozenImageData.current && (
            <div style={{
              position: 'absolute',
              left: mousePos.x - LENS_SIZE / 2,
              top: mousePos.y - LENS_SIZE / 2,
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <canvas
                ref={lensCanvasRef}
                style={{
                  width: LENS_SIZE,
                  height: LENS_SIZE,
                  borderRadius: shape === 'circle' ? '50%' : '8px',
                  border: '2px solid #f38ba8',
                  boxShadow: '0 0 20px rgba(243, 139, 168, 0.3)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '8px 12px', borderTop: '1px solid #313244',
        display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px',
      }}>
        <span style={{ color: '#a6adc8' }}>位置:</span>
        <span>({Math.round(mousePos.x)}, {Math.round(mousePos.y)})</span>
        <div style={{ width: '1px', height: '14px', background: '#45475a' }} />
        <div style={{
          width: '18px', height: '18px', borderRadius: '3px',
          background: colorInfo.hex, border: '1px solid #45475a',
        }} />
        <span>HEX: <span style={{ color: '#89b4fa' }}>{colorInfo.hex}</span></span>
        <span>RGB: <span style={{ color: '#a6e3a1' }}>({colorInfo.r}, {colorInfo.g}, {colorInfo.b})</span></span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#6c7086', fontSize: '11px' }}>{zoom}x 放大</span>
      </div>
    </div>
  )
}
