import React, { useRef, useEffect, useCallback, useState } from 'react'
import {
  Pencil, Square, Circle, Minus, ArrowRight, Type,
  Trash2, Undo2, Redo2, Download, Sparkles,
} from 'lucide-react'
import type { ToolType, DrawAction, Point } from './types'
import { PRESET_COLORS } from './types'
import { buildStyles } from './styles'

function EraserSvg({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  )
}

const tools: { type: ToolType; icon: React.FC<{ size?: number }>; label: string }[] = [
  { type: 'pen', icon: Pencil, label: '画笔' },
  { type: 'highlighter', icon: Sparkles, label: '荧光笔' },
  { type: 'eraser', icon: EraserSvg, label: '橡皮' },
  { type: 'rectangle', icon: Square, label: '矩形' },
  { type: 'circle', icon: Circle, label: '圆形' },
  { type: 'line', icon: Minus, label: '直线' },
  { type: 'arrow', icon: ArrowRight, label: '箭头' },
  { type: 'text', icon: Type, label: '文字' },
]

interface WhiteboardProps {
  isDark: boolean
  bgColor: string
  actions: DrawAction[]
  undoStack: DrawAction[]
  tool: ToolType
  color: string
  brushSize: number
  userId: string
  userName: string
  remoteCursors: Record<string, { x: number; y: number; name: string; color: string }>
  onActionsChange: React.Dispatch<React.SetStateAction<DrawAction[]>>
  onUndoStackChange: React.Dispatch<React.SetStateAction<DrawAction[]>>
  onToolChange: (t: ToolType) => void
  onColorChange: (c: string) => void
  onBrushSizeChange: (s: number) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onBroadcastDraw: (action: DrawAction) => void
  onBroadcastCursor: (pos: Point) => void
  genId: () => string
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  isDark, bgColor, actions, undoStack, tool, color, brushSize,
  userId, userName, remoteCursors,
  onActionsChange, onUndoStackChange: _onUndoStackChange, onToolChange, onColorChange,
  onBrushSizeChange, onUndo, onRedo, onClear,
  onBroadcastDraw, onBroadcastCursor, genId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const startPointRef = useRef<Point | null>(null)
  const lastPointRef = useRef<Point | null>(null)
  const snapshotRef = useRef<ImageData | null>(null)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 })

  const styles = buildStyles(isDark, bgColor, tool)

  const drawAction = useCallback((ctx: CanvasRenderingContext2D, a: DrawAction) => {
    const pts = a.points
    if (pts.length === 0) return

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (a.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = a.size * 3
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      if (pts.length === 1) { ctx.lineTo(pts[0].x + 0.5, pts[0].y + 0.5) }
      ctx.stroke()
    } else if (a.tool === 'pen' || a.tool === 'highlighter') {
      if (a.tool === 'highlighter') {
        ctx.globalAlpha = 0.35
        ctx.strokeStyle = a.color
        ctx.lineWidth = a.size * 2.5
      } else {
        ctx.strokeStyle = a.color
        ctx.lineWidth = a.size
      }
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      if (pts.length === 1) { ctx.lineTo(pts[0].x + 0.5, pts[0].y + 0.5) }
      ctx.stroke()
    } else if (a.tool === 'rectangle' && pts.length >= 2) {
      const x = Math.min(pts[0].x, pts[pts.length - 1].x)
      const y = Math.min(pts[0].y, pts[pts.length - 1].y)
      const w = Math.abs(pts[pts.length - 1].x - pts[0].x)
      const h = Math.abs(pts[pts.length - 1].y - pts[0].y)
      ctx.strokeStyle = a.color
      ctx.lineWidth = a.size
      ctx.strokeRect(x, y, w, h)
    } else if (a.tool === 'circle' && pts.length >= 2) {
      const dx = pts[pts.length - 1].x - pts[0].x
      const dy = pts[pts.length - 1].y - pts[0].y
      const r = Math.sqrt(dx * dx + dy * dy)
      ctx.strokeStyle = a.color
      ctx.lineWidth = a.size
      ctx.beginPath()
      ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2)
      ctx.stroke()
    } else if (a.tool === 'line' && pts.length >= 2) {
      ctx.strokeStyle = a.color
      ctx.lineWidth = a.size
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      ctx.stroke()
    } else if (a.tool === 'arrow' && pts.length >= 2) {
      ctx.strokeStyle = a.color
      ctx.lineWidth = a.size
      const s = pts[0], e = pts[pts.length - 1]
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(e.x, e.y)
      ctx.stroke()
      const angle = Math.atan2(e.y - s.y, e.x - s.x)
      const ah = a.size * 4
      ctx.beginPath()
      ctx.moveTo(e.x, e.y)
      ctx.lineTo(e.x - ah * Math.cos(angle - Math.PI / 6), e.y - ah * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(e.x, e.y)
      ctx.lineTo(e.x - ah * Math.cos(angle + Math.PI / 6), e.y - ah * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    } else if (a.tool === 'text' && a.text) {
      ctx.fillStyle = a.color
      ctx.font = `${a.size * 4}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillText(a.text, pts[0].x, pts[0].y)
    }
    ctx.restore()
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
    ctx.lineWidth = 1
    const gs = 24
    for (let x = 0; x <= canvas.width; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }
    for (const a of actions) drawAction(ctx, a)
  }, [actions, bgColor, isDark, drawAction])

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
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    resizeCanvas()
    const h = () => resizeCanvas()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [resizeCanvas])

  useEffect(() => { redrawCanvas() }, [redrawCanvas])

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? (e.touches[0]?.clientX || 0) : e.clientX
    const clientY = 'touches' in e ? (e.touches[0]?.clientY || 0) : e.clientY
    const dpr = window.devicePixelRatio || 1
    return {
      x: (clientX - rect.left) * scaleX / dpr,
      y: (clientY - rect.top) * scaleY / dpr,
    }
  }

  const handleExportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `collab-whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'text') {
      const pos = getCanvasPos(e)
      setTextPosition(pos)
      setShowTextDialog(true)
      return
    }
    const pos = getCanvasPos(e)
    drawingRef.current = true
    startPointRef.current = pos
    lastPointRef.current = pos

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      const action: DrawAction = {
        id: genId(), tool, color, size: brushSize,
        points: [pos], userId, userName,
      }
      onActionsChange(prev => [...prev, action])
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e)
    onBroadcastCursor(pos)

    if (!drawingRef.current) return

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      onActionsChange(prev => {
        const next = [...prev]
        if (next.length > 0) {
          const last = { ...next[next.length - 1] }
          last.points = [...last.points, pos]
          next[next.length - 1] = last
        }
        return next
      })
      lastPointRef.current = pos
    } else {
      const canvas = canvasRef.current
      if (canvas && snapshotRef.current) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.putImageData(snapshotRef.current, 0, 0)
          const tempAction: DrawAction = {
            id: 'temp', tool, color, size: brushSize,
            points: [startPointRef.current!, pos], userId, userName,
          }
          drawAction(ctx, tempAction)
        }
      }
    }
  }

  const handlePointerUp = (_e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return
    drawingRef.current = false

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      onActionsChange(prev => {
        if (prev.length === 0) return prev
        const action = prev[prev.length - 1]
        onBroadcastDraw(action)
        return prev
      })
    } else if (startPointRef.current) {
      const endPos = lastPointRef.current || startPointRef.current
      const action: DrawAction = {
        id: genId(), tool, color, size: brushSize,
        points: [startPointRef.current, endPos], userId, userName,
      }
      onActionsChange(prev => [...prev, action])
      onBroadcastDraw(action)
    }
    startPointRef.current = null
    lastPointRef.current = null
    snapshotRef.current = null
  }

  const handleTextSubmit = () => {
    if (!textInput.trim()) { setShowTextDialog(false); return }
    const action: DrawAction = {
      id: genId(), tool: 'text', color, size: brushSize,
      points: [textPosition], text: textInput, userId, userName,
    }
    onActionsChange(prev => [...prev, action])
    onBroadcastDraw(action)
    setTextInput('')
    setShowTextDialog(false)
  }

  return (
    <>
      <div style={{ ...styles.glass, ...styles.toolBar, marginBottom: 12 }}>
        {tools.map(t => (
          <button
            key={t.type}
            style={{ ...styles.toolBtn, ...(tool === t.type ? styles.toolActive : {}) }}
            onClick={() => onToolChange(t.type)}
            title={t.label}
          >
            <t.icon size={18} />
          </button>
        ))}
        <div style={{ width: 1, height: 28, background: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.15)', margin: '0 4px' }} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(c => (
            <div
              key={c}
              style={{ ...styles.colorSwatch, background: c, ...(color === c ? styles.colorActive : {}) }}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
        <div style={{ width: 1, height: 28, background: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.15)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>{brushSize}px</span>
          <input
            type="range" min={1} max={30} value={brushSize}
            onChange={e => onBrushSizeChange(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ ...styles.toolBtn, opacity: actions.length === 0 ? 0.4 : 1 }} onClick={onUndo} title="撤销 (Ctrl+Z)">
          <Undo2 size={18} />
        </button>
        <button style={{ ...styles.toolBtn, opacity: undoStack.length === 0 ? 0.4 : 1 }} onClick={onRedo} title="重做">
          <Redo2 size={18} />
        </button>
        <button style={styles.toolBtn} onClick={onClear} title="清空画布">
          <Trash2 size={18} />
        </button>
        <button style={styles.toolBtn} onClick={handleExportPNG} title="导出PNG">
          <Download size={18} />
        </button>
      </div>

      <div ref={containerRef} style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        <div style={styles.cursorOverlay}>
          {Object.entries(remoteCursors).map(([id, c]) => (
            <div key={id} style={{ ...styles.remoteCursor, left: c.x, top: c.y }}>
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                <path d="M1 1L7 20L9.5 12L15 10.5L1 1Z" fill={c.color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <div style={{ ...styles.cursorLabel, background: c.color }}>{c.name}</div>
            </div>
          ))}
        </div>
        {showTextDialog && (
          <div style={{ position: 'absolute', left: textPosition.x, top: textPosition.y, zIndex: 50 }}>
            <input
              autoFocus
              style={{
                padding: '4px 8px', border: `2px solid ${color}`, borderRadius: 6,
                background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)',
                color, fontSize: brushSize * 4, fontWeight: 500, outline: 'none',
                minWidth: 200, fontFamily: 'inherit',
              }}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setShowTextDialog(false) }}
              onBlur={handleTextSubmit}
              placeholder="输入文字..."
            />
          </div>
        )}
      </div>
    </>
  )
}
