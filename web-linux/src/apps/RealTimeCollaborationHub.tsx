import { useState, useRef, useEffect, useCallback } from 'react'

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line'

interface Whiteboard {
  id: string
  name: string
  dataUrl: string
  createdAt: number
  updatedAt: number
}

interface Stroke {
  tool: Tool
  color: string
  size: number
  points: { x: number; y: number }[]
  previewPoints?: { x: number; y: number }[]
}

const STORAGE_KEY = 'rt-collab-whiteboards'
const MAX_STROKES = 500

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b', '#1e293b', '#ffffff',
]

const loadWhiteboards = (): Whiteboard[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveWhiteboards = (list: Whiteboard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch { /* noop */ }
}

const RealTimeCollaborationHub: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)
  const isDrawingRef = useRef(false)

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#3b82f6')
  const [brushSize, setBrushSize] = useState(4)
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>(loadWhiteboards())
  const [showGallery, setShowGallery] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [, forceRender] = useState(0)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    ctx.save()
    ctx.scale(zoom, zoom)

    const strokes = strokesRef.current
    const allStrokes = currentStrokeRef.current
      ? [...strokes, currentStrokeRef.current]
      : strokes

    for (const stroke of allStrokes) {
      drawStroke(ctx, stroke)
    }

    ctx.restore()
  }, [zoom])

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.previewPoints || stroke.points
    if (pts.length === 0) return

    ctx.save()
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.tool === 'eraser' ? stroke.size * 2.5 : stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y)
      }
      if (pts.length === 1) {
        ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1)
      }
      ctx.stroke()
    } else if (stroke.tool === 'rectangle' && pts.length >= 2) {
      const x = Math.min(pts[0].x, pts[pts.length - 1].x)
      const y = Math.min(pts[0].y, pts[pts.length - 1].y)
      const w = Math.abs(pts[pts.length - 1].x - pts[0].x)
      const h = Math.abs(pts[pts.length - 1].y - pts[0].y)
      ctx.strokeRect(x, y, w, h)
    } else if (stroke.tool === 'circle' && pts.length >= 2) {
      const dx = pts[pts.length - 1].x - pts[0].x
      const dy = pts[pts.length - 1].y - pts[0].y
      const r = Math.sqrt(dx * dx + dy * dy)
      ctx.beginPath()
      ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2)
      ctx.stroke()
    } else if (stroke.tool === 'line' && pts.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      ctx.stroke()
    }
    ctx.restore()
  }

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    redraw()
  }, [redraw])

  useEffect(() => {
    resizeCanvas()
    const handler = () => resizeCanvas()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [resizeCanvas])

  useEffect(() => {
    redraw()
  }, [redraw, zoom])

  const getCanvasPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    }
  }

  const handleStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    isDrawingRef.current = true
    const pos = getCanvasPos(e)
    currentStrokeRef.current = {
      tool,
      color,
      size: brushSize,
      points: [pos],
      previewPoints: tool === 'pen' || tool === 'eraser' ? [pos] : undefined,
    }
  }

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    const stroke = currentStrokeRef.current
    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      stroke.points.push(pos)
      stroke.previewPoints = [...stroke.points]
    } else {
      if (stroke.points.length === 1) {
        stroke.points.push(pos)
      } else {
        stroke.points[1] = pos
      }
      stroke.previewPoints = [stroke.points[0], pos]
    }
    redraw()
  }

  const handleEnd = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const stroke = currentStrokeRef.current
    if (stroke) {
      if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
        stroke.previewPoints = undefined
      } else {
        stroke.previewPoints = undefined
      }
      if (strokesRef.current.length >= MAX_STROKES) {
        strokesRef.current.shift()
      }
      strokesRef.current.push(stroke)
      currentStrokeRef.current = null
      forceRender(n => n + 1)
    }
    redraw()
  }

  const redoStackRef = useRef<Stroke[]>([])

  const undo = useCallback(() => {
    const popped = strokesRef.current.pop()
    if (popped) {
      redoStackRef.current.push(popped)
      redraw()
      forceRender(n => n + 1)
    }
  }, [redraw])

  const redo = useCallback(() => {
    const popped = redoStackRef.current.pop()
    if (popped) {
      strokesRef.current.push(popped)
      redraw()
      forceRender(n => n + 1)
    }
  }, [redraw])

  const clearCanvas = useCallback(() => {
    strokesRef.current = []
    redoStackRef.current = []
    currentStrokeRef.current = null
    redraw()
    forceRender(n => n + 1)
  }, [redraw])

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const saveToGallery = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const name = prompt('输入白板名称:', `白板 ${new Date().toLocaleString()}`)
    if (!name) return
    const dataUrl = canvas.toDataURL('image/png')
    const now = Date.now()
    const newWb: Whiteboard = {
      id: now.toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim() || '未命名白板',
      dataUrl,
      createdAt: now,
      updatedAt: now,
    }
    const next = [newWb, ...whiteboards].slice(0, 30)
    setWhiteboards(next)
    saveWhiteboards(next)
  }, [whiteboards])

  const loadFromGallery = useCallback((wb: Whiteboard) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      ctx.save()
      ctx.scale(zoom, zoom)
      ctx.drawImage(img, 0, 0, canvas.width / zoom, canvas.height / zoom)
      ctx.restore()
      strokesRef.current = []
      redoStackRef.current = []
      forceRender(n => n + 1)
    }
    img.src = wb.dataUrl
    setShowGallery(false)
  }, [zoom])

  const deleteFromGallery = useCallback((id: string) => {
    const next = whiteboards.filter(w => w.id !== id)
    setWhiteboards(next)
    saveWhiteboards(next)
  }, [whiteboards])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('mousedown', handleStart)
    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseup', handleEnd)
    canvas.addEventListener('mouseleave', handleEnd)
    canvas.addEventListener('touchstart', handleStart, { passive: false })
    canvas.addEventListener('touchmove', handleMove, { passive: false })
    canvas.addEventListener('touchend', handleEnd)
    return () => {
      canvas.removeEventListener('mousedown', handleStart)
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseup', handleEnd)
      canvas.removeEventListener('mouseleave', handleEnd)
      canvas.removeEventListener('touchstart', handleStart)
      canvas.removeEventListener('touchmove', handleMove)
      canvas.removeEventListener('touchend', handleEnd)
    }
  }, [tool, color, brushSize, zoom])

  const styles: Record<string, React.CSSProperties> = {
    container: {
      height: '100%',
      background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif',
      color: '#e2e8f0',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: 'rgba(15,15,25,0.7)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexWrap: 'wrap',
    },
    toolGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      paddingRight: 12,
      borderRight: '1px solid rgba(255,255,255,0.08)',
    },
    toolGroupLast: {
      borderRight: 'none',
    },
    toolBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      color: '#cbd5e1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      transition: 'all 0.15s',
    },
    toolBtnActive: {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderColor: 'transparent',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
    },
    colorWrap: {
      display: 'flex',
      gap: 3,
      flexWrap: 'wrap',
      maxWidth: 220,
    },
    colorDot: {
      width: 24,
      height: 24,
      borderRadius: 6,
      border: '2px solid transparent',
      cursor: 'pointer',
      transition: 'transform 0.15s',
    },
    colorDotActive: {
      borderColor: '#fff',
      transform: 'scale(1.15)',
    },
    sliderRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      color: '#94a3b8',
    },
    slider: {
      width: 100,
      accentColor: '#6366f1',
    },
    actionBtn: {
      padding: '8px 14px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      color: '#cbd5e1',
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
    },
    actionBtnDanger: {
      borderColor: 'rgba(239,68,68,0.3)',
      color: '#fca5a5',
      background: 'rgba(239,68,68,0.08)',
    },
    actionBtnPrimary: {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderColor: 'transparent',
      color: '#fff',
    },
    spacer: {
      flex: 1,
    },
    canvasArea: {
      flex: 1,
      display: 'flex',
      padding: 16,
      gap: 16,
      overflow: 'hidden',
      minHeight: 0,
    },
    canvasWrap: {
      flex: 1,
      position: 'relative',
      background: '#ffffff',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    },
    canvas: {
      display: 'block',
      cursor: tool === 'eraser' ? 'cell' : 'crosshair',
      touchAction: 'none',
    },
    sidePanel: {
      width: 240,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflowY: 'auto',
    },
    sideCard: {
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 14,
    },
    sideTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 10,
    },
    galleryItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: 8,
      borderRadius: 8,
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.04)',
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    galleryThumb: {
      width: '100%',
      height: 80,
      borderRadius: 6,
      objectFit: 'cover',
      background: '#fff',
    },
    galleryName: {
      fontSize: 12,
      color: '#e2e8f0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    galleryMeta: {
      fontSize: 10,
      color: '#64748b',
      display: 'flex',
      justifyContent: 'space-between',
    },
    emptyGallery: {
      fontSize: 12,
      color: '#64748b',
      textAlign: 'center',
      padding: '20px 10px',
    },
    zoomControls: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 8px',
      borderRadius: 8,
      background: 'rgba(0,0,0,0.3)',
      fontSize: 12,
      color: '#cbd5e1',
    },
  }

  const toolIcon = (t: Tool): string => {
    switch (t) {
      case 'pen': return '✏️'
      case 'eraser': return '🧹'
      case 'rectangle': return '▭'
      case 'circle': return '◯'
      case 'line': return '／'
    }
  }

  const toolLabel = (t: Tool): string => {
    const map: Record<Tool, string> = {
      pen: '画笔',
      eraser: '橡皮擦',
      rectangle: '矩形',
      circle: '圆形',
      line: '直线',
    }
    return map[t]
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolGroup}>
          {(['pen', 'eraser', 'rectangle', 'circle', 'line'] as Tool[]).map(t => (
            <button
              key={t}
              style={{
                ...styles.toolBtn,
                ...(tool === t ? styles.toolBtnActive : {}),
              }}
              onClick={() => setTool(t)}
              title={toolLabel(t)}
            >
              {toolIcon(t)}
            </button>
          ))}
        </div>

        <div style={styles.toolGroup}>
          <div style={styles.sliderRow}>
            <span>粗细</span>
            <input
              style={styles.slider}
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <span>{brushSize}</span>
          </div>
        </div>

        <div style={styles.toolGroup}>
          <div style={styles.colorWrap}>
            {COLORS.map(c => (
              <button
                key={c}
                style={{
                  ...styles.colorDot,
                  backgroundColor: c,
                  ...(color === c ? styles.colorDotActive : {}),
                }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>

        <div style={{ ...styles.toolGroup, ...styles.toolGroupLast }}>
          <button style={styles.actionBtn} onClick={undo} title="撤销">
            ↶ 撤销
          </button>
          <button style={styles.actionBtn} onClick={redo} title="重做">
            ↷ 重做
          </button>
          <button style={{ ...styles.actionBtn, ...styles.actionBtnDanger }} onClick={clearCanvas}>
            🗑 清空
          </button>
        </div>

        <div style={styles.spacer} />

        <div style={styles.toolGroup}>
          <button style={styles.actionBtn} onClick={() => setShowGallery(s => !s)}>
            📁 白板库 ({whiteboards.length})
          </button>
          <button style={styles.actionBtn} onClick={saveToGallery}>
            💾 保存
          </button>
          <button style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }} onClick={exportPNG}>
            📥 导出PNG
          </button>
        </div>
      </div>

      <div style={styles.canvasArea}>
        <div style={styles.canvasWrap} ref={containerRef}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              ...styles.zoomControls,
            }}
          >
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 4px',
              }}
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              −
            </button>
            <span style={{ minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 4px',
              }}
              onClick={() => setZoom(z => Math.min(3, z + 0.1))}
            >
              +
            </button>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                padding: '0 4px',
              }}
              onClick={() => setZoom(1)}
            >
              重置
            </button>
          </div>
        </div>

        {showGallery && (
          <div style={styles.sidePanel}>
            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>📁 白板库</div>
              {whiteboards.length === 0 ? (
                <div style={styles.emptyGallery}>
                  暂无保存的白板，点击「保存」按钮可将当前画板存入本地
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {whiteboards.map(wb => (
                    <div key={wb.id} style={styles.galleryItem}>
                      <img
                        src={wb.dataUrl}
                        alt={wb.name}
                        style={styles.galleryThumb}
                        onClick={() => loadFromGallery(wb)}
                      />
                      <div style={{ padding: '0 4px' }}>
                        <div style={styles.galleryName}>{wb.name}</div>
                        <div style={styles.galleryMeta}>
                          <span>{new Date(wb.updatedAt).toLocaleDateString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFromGallery(wb.id)
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RealTimeCollaborationHub