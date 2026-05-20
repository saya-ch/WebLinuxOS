import { useState, useRef, useEffect, useCallback } from 'react'

interface ImageData {
  name: string
  width: number
  height: number
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

const images: ImageData[] = [
  {
    name: '几何图案', width: 640, height: 480,
    draw(ctx, w, h) {
      const grad1 = ctx.createLinearGradient(0, 0, w, h)
      grad1.addColorStop(0, '#e94560')
      grad1.addColorStop(1, '#0f3460')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, w, h)
      const grad2 = ctx.createLinearGradient(0, h, w, 0)
      grad2.addColorStop(0, '#4ecca3')
      grad2.addColorStop(1, '#f5c542')
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2)
      ctx.fillStyle = grad2
      ctx.globalAlpha = 0.8
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(Math.PI / 4)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 3
      ctx.strokeRect(-100, -100, 200, 200)
      ctx.restore()
      ctx.beginPath()
      ctx.moveTo(w / 2, h / 2 - 140)
      ctx.lineTo(w / 2 + 120, h / 2 + 80)
      ctx.lineTo(w / 2 - 120, h / 2 + 80)
      ctx.closePath()
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  },
  {
    name: '渐变色块', width: 640, height: 480,
    draw(ctx, w, h) {
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#667eea')
      grad.addColorStop(1, '#764ba2')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      const circles = [
        { x: 0.15, y: 0.2, r: 0.12, a: 0.15 },
        { x: 0.75, y: 0.2, r: 0.16, a: 0.1 },
        { x: 0.45, y: 0.55, r: 0.2, a: 0.12 },
        { x: 0.2, y: 0.75, r: 0.1, a: 0.08 },
        { x: 0.8, y: 0.7, r: 0.13, a: 0.1 },
      ]
      circles.forEach(c => {
        ctx.beginPath()
        ctx.arc(w * c.x, h * c.y, Math.min(w, h) * c.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${c.a})`
        ctx.fill()
      })
    }
  },
  {
    name: '星空夜景', width: 640, height: 480,
    draw(ctx, w, h) {
      ctx.fillStyle = '#0a0a2e'
      ctx.fillRect(0, 0, w, h)
      ctx.beginPath()
      ctx.arc(w * 0.75, h * 0.2, 35, 0, Math.PI * 2)
      ctx.fillStyle = '#f5c542'
      ctx.globalAlpha = 0.9
      ctx.fill()
      ctx.beginPath()
      ctx.arc(w * 0.75, h * 0.2, 50, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(245,197,66,0.15)'
      ctx.globalAlpha = 1
      ctx.fill()
      for (let i = 0; i < 80; i++) {
        const sx = Math.random() * w
        const sy = Math.random() * h * 0.65
        const sr = Math.random() * 2 + 0.5
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`
        ctx.fill()
      }
      ctx.fillStyle = '#0f0f3a'
      ctx.globalAlpha = 0.8
      ctx.fillRect(0, h * 0.65, w, h * 0.35)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#0a0a2e'
      ctx.beginPath()
      ctx.moveTo(0, h * 0.65)
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, h * 0.65 - Math.random() * 40 - 10)
      }
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fill()
    }
  },
  {
    name: '波浪线条', width: 640, height: 480,
    draw(ctx, w, h) {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, w, h)
      const waves = [
        { color: '#e94560', offset: 0, amp: 80 },
        { color: '#f5c542', offset: 30, amp: 70 },
        { color: '#4ecca3', offset: -20, amp: 90 },
        { color: '#7b68ee', offset: 50, amp: 60 },
        { color: '#ff6b6b', offset: -40, amp: 75 },
      ]
      waves.forEach(wave => {
        ctx.beginPath()
        ctx.moveTo(0, h / 2 + wave.offset)
        for (let x = 0; x <= w; x += 2) {
          const y = h / 2 + wave.offset + Math.sin(x * 0.01 + wave.offset * 0.1) * wave.amp
          ctx.lineTo(x, y)
        }
        ctx.strokeStyle = wave.color
        ctx.lineWidth = 4
        ctx.globalAlpha = 0.7
        ctx.stroke()
        ctx.globalAlpha = 1
      })
    }
  },
  {
    name: '抽象艺术', width: 640, height: 480,
    draw(ctx, w, h) {
      ctx.fillStyle = '#2d2d2d'
      ctx.fillRect(0, 0, w, h)
      const shapes = [
        { x: 0.12, y: 0.15, w: 0.18, h: 0.22, color: '#e94560', rot: 0 },
        { x: 0.3, y: 0.08, w: 0.14, h: 0.35, color: '#4ecca3', rot: 0 },
        { x: 0.5, y: 0.2, w: 0.16, h: 0.16, color: '#f5c542', rot: 0.26 },
        { x: 0.18, y: 0.5, w: 0.12, h: 0.12, color: '#7b68ee', rot: 0 },
        { x: 0.42, y: 0.55, w: 0.1, h: 0.1, color: '#48dbfb', rot: 0 },
        { x: 0.55, y: 0.48, w: 0.13, h: 0.13, color: '#ff6b6b', rot: 0.5 },
      ]
      shapes.forEach(s => {
        ctx.save()
        ctx.translate(w * s.x + w * s.w / 2, h * s.y + h * s.h / 2)
        ctx.rotate(s.rot)
        ctx.fillStyle = s.color
        ctx.globalAlpha = 0.6
        ctx.fillRect(-w * s.w / 2, -h * s.h / 2, w * s.w, h * s.h)
        ctx.restore()
      })
      ctx.globalAlpha = 0.15
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, h * 0.4); ctx.lineTo(w, h * 0.4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke()
      ctx.globalAlpha = 1
    }
  },
  {
    name: '棋盘格', width: 640, height: 480,
    draw(ctx, w, h) {
      const cols = 16
      const rows = 12
      const cw = w / cols
      const ch = h / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#333333' : '#e94560'
          ctx.globalAlpha = (r + c) % 2 === 0 ? 0.9 : 0.7
          ctx.fillRect(c * cw, r * ch, cw, ch)
        }
      }
      ctx.globalAlpha = 1
    }
  },
]

export default function ImageViewer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageColors, setImageColors] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentImage = images[currentIndex]

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = currentImage.width
    canvas.height = currentImage.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    currentImage.draw(ctx, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const colorSet = new Set<string>()
    for (let i = 0; i < imageData.data.length; i += 16) {
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      colorSet.add(`${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`)
    }
    setImageColors(colorSet.size)
  }, [currentImage])

  useEffect(() => {
    renderImage()
    setScale(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }, [currentIndex, renderImage])

  const handlePrev = () => setCurrentIndex(p => (p > 0 ? p - 1 : images.length - 1))
  const handleNext = () => setCurrentIndex(p => (p < images.length - 1 ? p + 1 : 0))
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 5))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.25))
  const rotateLeft = () => setRotation(r => r - 90)
  const rotateRight = () => setRotation(r => r + 90)
  const resetView = () => { setScale(1); setRotation(0); setOffset({ x: 0, y: 0 }) }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
        <button onClick={handlePrev} style={imgBtn}>◀ 上一张</button>
        <button onClick={handleNext} style={imgBtn}>下一张 ▶</button>
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 4px' }} />
        <button onClick={zoomOut} style={imgBtn}>🔍−</button>
        <span style={{ fontSize: 12, color: '#aaa', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} style={imgBtn}>🔍+</button>
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 4px' }} />
        <button onClick={rotateLeft} style={imgBtn}>↺ 左转</button>
        <button onClick={rotateRight} style={imgBtn}>↻ 右转</button>
        <button onClick={resetView} style={imgBtn}>⟳ 重置</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#aaa' }}>{currentIndex + 1} / {images.length}</span>
      </div>

      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s',
        }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', maxWidth: '80vw', maxHeight: '60vh' }}
          />
        </div>
      </div>

      <div style={{ background: '#252526', borderTop: '1px solid #333', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888' }}>
        <span style={{ fontWeight: 600, color: '#ccc' }}>{currentImage.name}</span>
        <span>尺寸: {currentImage.width}×{currentImage.height}</span>
        <span>颜色数: ~{imageColors}</span>
        <span>缩放: {Math.round(scale * 100)}%</span>
        <span>旋转: {rotation}°</span>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ background: '#252526', borderTop: '1px solid #333', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 6, padding: '0 8px 8px', overflow: 'auto' }}>
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0, width: 64, height: 48, cursor: 'pointer', borderRadius: 4, overflow: 'hidden',
                border: i === currentIndex ? '2px solid #007acc' : '2px solid transparent',
                opacity: i === currentIndex ? 1 : 0.6, position: 'relative',
              }}
              onClick={() => setCurrentIndex(i)}
            >
              <canvas
                width={64}
                height={48}
                ref={el => {
                  if (!el) return
                  const ctx = el.getContext('2d')
                  if (!ctx) return
                  const scaleX = 64 / img.width
                  const scaleY = 48 / img.height
                  ctx.save()
                  ctx.scale(scaleX, scaleY)
                  img.draw(ctx, img.width, img.height)
                  ctx.restore()
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const imgBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer',
  padding: '4px 10px', borderRadius: 3, fontSize: 12
}
