import { useState, useRef, useEffect, useCallback } from 'react'
import { Ruler, Crosshair, Grid3x3, Search, Pipette, Trash2, Minus, Plus } from 'lucide-react'

type Tool = 'ruler' | 'distance' | 'angle' | 'grid' | 'magnifier' | 'colorpicker'
type Unit = 'px' | 'cm' | 'mm'

interface GuideLine {
  id: number
  type: 'h' | 'v'
  pos: number
}

interface Point {
  x: number
  y: number
}

const DPI = 96

function pxToUnit(px: number, unit: Unit): string {
  if (unit === 'px') return `${px.toFixed(1)} px`
  if (unit === 'cm') return `${(px / DPI * 2.54).toFixed(2)} cm`
  return `${(px / DPI * 25.4).toFixed(1)} mm`
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function angle(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const dot = ba.x * bc.x + ba.y * bc.y
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2)
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2)
  if (magBA === 0 || magBC === 0) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)))
  return Math.acos(cosAngle) * (180 / Math.PI)
}

function hexFromRGB(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default function ScreenRuler() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [tool, setTool] = useState<Tool>('ruler')
  const [unit, setUnit] = useState<Unit>('px')
  const [zoom, setZoom] = useState(1)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [gridSpacing, setGridSpacing] = useState(50)
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [pinnedColor, setPinnedColor] = useState<string | null>(null)
  const [colorHistory, setColorHistory] = useState<string[]>([])

  // Measurement points
  const [measurePoints, setMeasurePoints] = useState<Point[]>([])
  const [anglePoints, setAnglePoints] = useState<Point[]>([])

  // Guide lines
  const [guides, setGuides] = useState<GuideLine[]>([])
  const [draggingGuide, setDraggingGuide] = useState<number | null>(null)
  const [nextGuideId, setNextGuideId] = useState(0)

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    setMousePos({ x, y })

    if (draggingGuide !== null) {
      setGuides((prev) =>
        prev.map((g) =>
          g.id === draggingGuide
            ? { ...g, pos: g.type === 'h' ? y : x }
            : g
        )
      )
    }
  }, [zoom, draggingGuide])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Check if clicking near a guide line
    for (const g of guides) {
      const gPos = g.type === 'h' ? y : x
      if (Math.abs(g.pos - gPos) < 5) {
        setDraggingGuide(g.id)
        return
      }
    }

    if (tool === 'distance') {
      if (measurePoints.length >= 2) {
        setMeasurePoints([{ x, y }])
      } else {
        setMeasurePoints((prev) => [...prev, { x, y }])
      }
    } else if (tool === 'angle') {
      if (anglePoints.length >= 3) {
        setAnglePoints([{ x, y }])
      } else {
        setAnglePoints((prev) => [...prev, { x, y }])
      }
    } else if (tool === 'colorpicker') {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
        const hex = hexFromRGB(pixel[0], pixel[1], pixel[2])
        setPinnedColor(hex)
        setColorHistory((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 20))
      }
    }
  }, [zoom, tool, measurePoints, anglePoints, guides])

  const handleMouseUp = useCallback(() => {
    setDraggingGuide(null)
  }, [])

  // Double-click to add guide line
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Add vertical guide on double click near left/right edges, horizontal near top/bottom
    const id = nextGuideId
    setNextGuideId((prev) => prev + 1)
    if (x < canvasSize.w / 2) {
      setGuides((prev) => [...prev, { id, type: 'v', pos: x }])
    } else {
      setGuides((prev) => [...prev, { id, type: 'h', pos: y }])
    }
  }, [zoom, nextGuideId, canvasSize])

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvasSize.w
    const h = canvasSize.h

    canvas.width = w
    canvas.height = h

    ctx.save()
    ctx.scale(zoom, zoom)

    // Clear
    ctx.fillStyle = '#1a1b26'
    ctx.fillRect(0, 0, w, h)

    // Checkerboard background
    const checkSize = 10
    for (let y = 0; y < h; y += checkSize) {
      for (let x = 0; x < w; x += checkSize) {
        const isLight = ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2) === 0
        ctx.fillStyle = isLight ? '#1f2030' : '#1a1b26'
        ctx.fillRect(x, y, checkSize, checkSize)
      }
    }

    // Grid overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(137, 180, 250, 0.15)'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= w; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y <= h; y += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }

    // --- Horizontal ruler (top) ---
    const rulerH = 24
    ctx.fillStyle = '#24283b'
    ctx.fillRect(0, 0, w, rulerH)
    ctx.strokeStyle = '#414868'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, rulerH)
    ctx.lineTo(w, rulerH)
    ctx.stroke()

    ctx.fillStyle = '#a6adc8'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'

    const step = zoom >= 2 ? 10 : zoom >= 1 ? 25 : 50
    for (let x = 0; x <= w; x += step) {
      const tickH = x % (step * 4) === 0 ? 12 : x % (step * 2) === 0 ? 8 : 4
      ctx.strokeStyle = '#7f849c'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(x, rulerH)
      ctx.lineTo(x, rulerH - tickH)
      ctx.stroke()

      if (x % (step * 4) === 0) {
        ctx.fillStyle = '#a6adc8'
        ctx.fillText(String(Math.round(x)), x, rulerH - 14)
      }
    }

    // --- Vertical ruler (left) ---
    const rulerW = 24
    ctx.fillStyle = '#24283b'
    ctx.fillRect(0, 0, rulerW, h)
    ctx.strokeStyle = '#414868'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(rulerW, 0)
    ctx.lineTo(rulerW, h)
    ctx.stroke()

    ctx.save()
    for (let y = 0; y <= h; y += step) {
      const tickW = y % (step * 4) === 0 ? 12 : y % (step * 2) === 0 ? 8 : 4
      ctx.strokeStyle = '#7f849c'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(rulerW, y)
      ctx.lineTo(rulerW - tickW, y)
      ctx.stroke()

      if (y % (step * 4) === 0) {
        ctx.save()
        ctx.translate(rulerW - 14, y)
        ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = '#a6adc8'
        ctx.textAlign = 'center'
        ctx.fillText(String(Math.round(y)), 0, 3)
        ctx.restore()
      }
    }
    ctx.restore()

    // Corner square
    ctx.fillStyle = '#313244'
    ctx.fillRect(0, 0, rulerW, rulerH)
    ctx.strokeStyle = '#414868'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, rulerW, rulerH)

    // --- Guide lines ---
    for (const g of guides) {
      ctx.save()
      ctx.strokeStyle = g.type === 'h' ? '#f38ba8' : '#a6e3a1'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 3])
      ctx.beginPath()
      if (g.type === 'h') {
        ctx.moveTo(0, g.pos)
        ctx.lineTo(w, g.pos)
      } else {
        ctx.moveTo(g.pos, 0)
        ctx.lineTo(g.pos, h)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // --- Distance measurement lines ---
    if (measurePoints.length > 0) {
      ctx.fillStyle = '#f9e2af'
      for (const p of measurePoints) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#f9e2af'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (measurePoints.length === 2) {
        const [a, b] = measurePoints
        ctx.strokeStyle = '#f9e2af'
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()

        // Horizontal / vertical projections
        ctx.strokeStyle = 'rgba(249, 226, 175, 0.4)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, a.y)
        ctx.moveTo(b.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.setLineDash([])

        const dx = Math.abs(b.x - a.x)
        const dy = Math.abs(b.y - a.y)
        const d = dist(a, b)
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2

        ctx.font = '11px monospace'
        ctx.textAlign = 'center'

        // Horizontal distance
        if (dx > 10) {
          ctx.fillStyle = 'rgba(249, 226, 175, 0.9)'
          ctx.fillText(`dx: ${pxToUnit(dx, unit)}`, midX, a.y - 8)
        }
        // Vertical distance
        if (dy > 10) {
          ctx.fillStyle = 'rgba(249, 226, 175, 0.9)'
          ctx.fillText(`dy: ${pxToUnit(dy, unit)}`, b.x + 10, midY)
        }
        // Diagonal distance
        ctx.fillStyle = '#f9e2af'
        ctx.font = 'bold 12px monospace'
        ctx.fillText(`d: ${pxToUnit(d, unit)}`, midX, midY - 8)
      }
    }

    // --- Angle measurement ---
    if (anglePoints.length > 0) {
      ctx.fillStyle = '#cba6f7'
      const labels = ['A', 'B', 'C']
      for (let i = 0; i < anglePoints.length; i++) {
        const p = anglePoints[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(labels[i], p.x, p.y - 10)
      }

      // Draw lines between points
      ctx.strokeStyle = 'rgba(203, 166, 247, 0.6)'
      ctx.lineWidth = 1
      ctx.setLineDash([])
      if (anglePoints.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(anglePoints[0].x, anglePoints[0].y)
        ctx.lineTo(anglePoints[1].x, anglePoints[1].y)
        ctx.stroke()
      }
      if (anglePoints.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(anglePoints[1].x, anglePoints[1].y)
        ctx.lineTo(anglePoints[2].x, anglePoints[2].y)
        ctx.stroke()

        // Draw angle arc at vertex
        const a = anglePoints[0]
        const b = anglePoints[1]
        const c = anglePoints[2]
        const ang = angle(a, b, c)

        const startAngle = Math.atan2(a.y - b.y, a.x - b.x)
        const endAngle = Math.atan2(c.y - b.y, c.x - b.x)
        const radius = Math.min(30, dist(b, a) / 2, dist(b, c) / 2)

        ctx.strokeStyle = '#cba6f7'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(b.x, b.y, radius, startAngle, endAngle)
        ctx.stroke()

        // Angle label
        const midAngle = (startAngle + endAngle) / 2
        ctx.fillStyle = '#cba6f7'
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${ang.toFixed(1)}°`,
          b.x + Math.cos(midAngle) * (radius + 16),
          b.y + Math.sin(midAngle) * (radius + 16)
        )
      }
    }

    // --- Crosshair for current tool ---
    if (tool !== 'colorpicker' || showMagnifier) {
      ctx.save()
      ctx.strokeStyle = 'rgba(137, 180, 250, 0.5)'
      ctx.lineWidth = 0.5
      ctx.setLineDash([4, 4])
      // Horizontal line
      ctx.beginPath()
      ctx.moveTo(rulerW, mousePos.y)
      ctx.lineTo(w, mousePos.y)
      ctx.stroke()
      // Vertical line
      ctx.beginPath()
      ctx.moveTo(mousePos.x, rulerH)
      ctx.lineTo(mousePos.x, h)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // --- Magnifier ---
    if (showMagnifier && mousePos.x > 0 && mousePos.y > 0) {
      const magSize = 120
      const magZoom = 8
      const srcSize = Math.floor(magSize / magZoom)
      const mx = w - magSize - 16
      const my = h - magSize - 16

      // Background
      ctx.fillStyle = 'rgba(30, 30, 46, 0.92)'
      ctx.strokeStyle = '#414868'
      ctx.lineWidth = 2
      const rr = 8
      ctx.beginPath()
      ctx.roundRect(mx - 4, my - 4, magSize + 8, magSize + 8, rr)
      ctx.fill()
      ctx.stroke()

      // Clip and draw magnified region
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(mx, my, magSize, magSize, rr - 2)
      ctx.clip()

      const sx = Math.max(0, Math.floor(mousePos.x - srcSize / 2))
      const sy = Math.max(0, Math.floor(mousePos.y - srcSize / 2))

      for (let py = 0; py < srcSize; py++) {
        for (let px = 0; px < srcSize; px++) {
          const cx = sx + px
          const cy = sy + py
          if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
            const pixel = ctx.getImageData(cx, cy, 1, 1).data
            ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
            ctx.fillRect(mx + px * magZoom, my + py * magZoom, magZoom, magZoom)
          }
        }
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(137, 180, 250, 0.2)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= srcSize; i++) {
        ctx.beginPath()
        ctx.moveTo(mx + i * magZoom, my)
        ctx.lineTo(mx + i * magZoom, my + magSize)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(mx, my + i * magZoom)
        ctx.lineTo(mx + magSize, my + i * magZoom)
        ctx.stroke()
      }

      // Center crosshair
      ctx.strokeStyle = '#f38ba8'
      ctx.lineWidth = 1
      const centerPx = mx + (srcSize / 2) * magZoom
      const centerPy = my + (srcSize / 2) * magZoom
      ctx.beginPath()
      ctx.moveTo(centerPx - 6, centerPy)
      ctx.lineTo(centerPx + 6, centerPy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(centerPx, centerPy - 6)
      ctx.lineTo(centerPx, centerPy + 6)
      ctx.stroke()

      ctx.restore()

      // Color info below magnifier
      const pixel = ctx.getImageData(Math.floor(mousePos.x), Math.floor(mousePos.y), 1, 1).data
      const hex = hexFromRGB(pixel[0], pixel[1], pixel[2])
      ctx.fillStyle = '#cdd6f4'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(hex.toUpperCase(), mx + magSize / 2, my + magSize + 16)
      ctx.fillText(`rgb(${pixel[0]},${pixel[1]},${pixel[2]})`, mx + magSize / 2, my + magSize + 28)
    }

    // --- Color picker info ---
    if (tool === 'colorpicker' && mousePos.x > 0 && mousePos.y > 0) {
      const pixel = ctx.getImageData(Math.floor(mousePos.x), Math.floor(mousePos.y), 1, 1).data
      const hex = hexFromRGB(pixel[0], pixel[1], pixel[2])

      const infoW = 160
      const infoH = 56
      const infoX = w - infoW - 16
      const infoY = rulerH + 16

      ctx.fillStyle = 'rgba(30, 30, 46, 0.92)'
      ctx.strokeStyle = '#414868'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(infoX, infoY, infoW, infoH, 6)
      ctx.fill()
      ctx.stroke()

      // Color swatch
      ctx.fillStyle = hex
      ctx.beginPath()
      ctx.roundRect(infoX + 8, infoY + 8, 28, 28, 4)
      ctx.fill()

      ctx.fillStyle = '#cdd6f4'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(hex.toUpperCase(), infoX + 44, infoY + 20)
      ctx.font = '10px monospace'
      ctx.fillStyle = '#a6adc8'
      ctx.fillText(`rgb(${pixel[0]},${pixel[1]},${pixel[2]})`, infoX + 44, infoY + 36)
      ctx.fillText('点击拾取', infoX + 44, infoY + 50)
    }

    ctx.restore()
  }, [canvasSize, zoom, mousePos, showGrid, gridSpacing, showMagnifier, tool, measurePoints, anglePoints, guides, unit])

  const clearAll = () => {
    setMeasurePoints([])
    setAnglePoints([])
    setGuides([])
    setPinnedColor(null)
  }

  const removeGuide = (id: number) => {
    setGuides((prev) => prev.filter((g) => g.id !== id))
  }

  // Distance info
  const distInfo = measurePoints.length === 2
    ? {
        dx: Math.abs(measurePoints[1].x - measurePoints[0].x),
        dy: Math.abs(measurePoints[1].y - measurePoints[0].y),
        d: dist(measurePoints[0], measurePoints[1]),
      }
    : null

  // Angle info
  const angleVal = anglePoints.length === 3
    ? angle(anglePoints[0], anglePoints[1], anglePoints[2])
    : null

  const toolButtons: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'ruler', icon: <Ruler size={15} />, label: '标尺' },
    { id: 'distance', icon: <Crosshair size={15} />, label: '测距' },
    { id: 'angle', icon: <Crosshair size={15} />, label: '角度' },
    { id: 'grid', icon: <Grid3x3 size={15} />, label: '网格' },
    { id: 'magnifier', icon: <Search size={15} />, label: '放大镜' },
    { id: 'colorpicker', icon: <Pipette size={15} />, label: '取色' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #313244',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
        background: '#181825',
      }}>
        {/* Tool buttons */}
        <div style={{ display: 'flex', gap: '2px', background: '#11111b', borderRadius: '6px', padding: '2px' }}>
          {toolButtons.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                border: 'none',
                borderRadius: '4px',
                background: tool === t.id ? '#313244' : 'transparent',
                color: tool === t.id ? '#89b4fa' : '#a6adc8',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: tool === t.id ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: '#313244', margin: '0 4px' }} />

        {/* Unit selector */}
        <div style={{ display: 'flex', gap: '2px', background: '#11111b', borderRadius: '6px', padding: '2px' }}>
          {(['px', 'cm', 'mm'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                padding: '3px 8px',
                border: 'none',
                borderRadius: '4px',
                background: unit === u ? '#313244' : 'transparent',
                color: unit === u ? '#89b4fa' : '#a6adc8',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: unit === u ? 600 : 400,
              }}
            >
              {u}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: '#313244', margin: '0 4px' }} />

        {/* Zoom */}
        <button
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          style={{ display: 'flex', alignItems: 'center', padding: '3px', border: 'none', borderRadius: '4px', background: '#313244', color: '#a6adc8', cursor: 'pointer' }}
        >
          <Minus size={14} />
        </button>
        <span style={{ fontSize: '11px', color: '#a6adc8', minWidth: '36px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          style={{ display: 'flex', alignItems: 'center', padding: '3px', border: 'none', borderRadius: '4px', background: '#313244', color: '#a6adc8', cursor: 'pointer' }}
        >
          <Plus size={14} />
        </button>

        <div style={{ width: 1, height: 20, background: '#313244', margin: '0 4px' }} />

        {/* Toggle options */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a6adc8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} style={{ accentColor: '#89b4fa' }} />
          网格
        </label>
        {showGrid && (
          <input
            type="number"
            value={gridSpacing}
            onChange={(e) => setGridSpacing(Math.max(5, Number(e.target.value)))}
            style={{ width: 50, padding: '2px 4px', background: '#11111b', border: '1px solid #313244', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px' }}
          />
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a6adc8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showMagnifier} onChange={(e) => setShowMagnifier(e.target.checked)} style={{ accentColor: '#89b4fa' }} />
          放大镜
        </label>

        <div style={{ flex: 1 }} />

        {/* Clear */}
        <button
          onClick={clearAll}
          title="清除所有"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            border: 'none',
            borderRadius: '4px',
            background: '#45475a',
            color: '#f38ba8',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          <Trash2 size={13} />
          清除
        </button>
      </div>

      {/* Info bar */}
      <div style={{
        padding: '4px 12px',
        borderBottom: '1px solid #313244',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '11px',
        color: '#a6adc8',
        background: '#181825',
        minHeight: '24px',
      }}>
        <span>
          坐标: {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
        </span>
        {distInfo && (
          <>
            <span style={{ color: '#f9e2af' }}>
              dx: {pxToUnit(distInfo.dx, unit)}
            </span>
            <span style={{ color: '#f9e2af' }}>
              dy: {pxToUnit(distInfo.dy, unit)}
            </span>
            <span style={{ color: '#f9e2af', fontWeight: 600 }}>
              距离: {pxToUnit(distInfo.d, unit)}
            </span>
          </>
        )}
        {angleVal !== null && (
          <span style={{ color: '#cba6f7', fontWeight: 600 }}>
            角度: {angleVal.toFixed(1)}°
          </span>
        )}
        {tool === 'distance' && measurePoints.length < 2 && (
          <span style={{ color: '#f9e2af' }}>
            点击第 {measurePoints.length + 1} 个点 ({2 - measurePoints.length} 剩余)
          </span>
        )}
        {tool === 'angle' && anglePoints.length < 3 && (
          <span style={{ color: '#cba6f7' }}>
            点击第 {anglePoints.length + 1} 个点 ({3 - anglePoints.length} 剩余)
          </span>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', cursor: tool === 'distance' || tool === 'angle' || tool === 'colorpicker' ? 'crosshair' : 'default' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            imageRendering: zoom > 1 ? 'pixelated' : 'auto',
          }}
        />
      </div>

      {/* Bottom status bar */}
      <div style={{
        padding: '4px 12px',
        borderTop: '1px solid #313244',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '10px',
        color: '#585b70',
        background: '#181825',
      }}>
        <span>双击添加辅助线</span>
        <span>拖拽移动辅助线</span>
        <span>工具: {toolButtons.find((t) => t.id === tool)?.label}</span>
        <span>单位: {unit}</span>
        <span>缩放: {Math.round(zoom * 100)}%</span>
        <div style={{ flex: 1 }} />
        <span>辅助线: {guides.length}</span>
        {guides.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {guides.map((g) => (
              <button
                key={g.id}
                onClick={() => removeGuide(g.id)}
                style={{
                  padding: '1px 4px',
                  border: 'none',
                  borderRadius: '3px',
                  background: g.type === 'h' ? 'rgba(243, 139, 168, 0.2)' : 'rgba(166, 227, 161, 0.2)',
                  color: g.type === 'h' ? '#f38ba8' : '#a6e3a1',
                  cursor: 'pointer',
                  fontSize: '9px',
                }}
              >
                {g.type === 'h' ? 'H' : 'V'} {Math.round(g.pos)}
              </button>
            ))}
          </div>
        )}
        {pinnedColor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: pinnedColor, border: '1px solid #45475a' }} />
            <span style={{ color: '#cdd6f4' }}>{pinnedColor.toUpperCase()}</span>
          </div>
        )}
        {colorHistory.length > 0 && (
          <div style={{ display: 'flex', gap: '2px' }}>
            {colorHistory.slice(0, 8).map((c, i) => (
              <div
                key={`${c}-${i}`}
                style={{ width: 10, height: 10, borderRadius: 2, background: c, border: '1px solid #45475a', cursor: 'pointer' }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
