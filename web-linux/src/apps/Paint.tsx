import { useState, useRef, useCallback, useEffect } from 'react'

const PRESET_COLORS = [
  '#000000', '#ffffff', '#e94560', '#f5c542', '#4ecca3', '#0f3460',
  '#7b68ee', '#ff6b6b', '#48dbfb', '#ff9ff3', '#fc5c65', '#fed330',
  '#26de81', '#2bcbba', '#45aaf2', '#4b7bec', '#a55eea', '#778ca3',
  '#2d3436', '#636e72', '#dfe6e9', '#b2bec3', '#d63031', '#e17055'
]

interface DrawAction {
  type: 'pen' | 'line' | 'rect' | 'circle' | 'erase' | 'fill'
  points: { x: number; y: number }[]
  color: string
  size: number
  startPoint?: { x: number; y: number }
}

export default function Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'pen' | 'erase' | 'line' | 'rect' | 'circle' | 'fill' | 'picker'>('pen')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [actions, setActions] = useState<DrawAction[]>([])
  const [undoStack, setUndoStack] = useState<DrawAction[]>([])
  const [tempAction, setTempAction] = useState<DrawAction | null>(null)
  const [, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [canvasImage, setCanvasImage] = useState<ImageData | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const drawAction = (c: CanvasRenderingContext2D, action: DrawAction) => {
    c.strokeStyle = action.type === 'erase' ? '#ffffff' : action.color
    c.fillStyle = action.color
    c.lineWidth = action.size
    c.lineCap = 'round'
    c.lineJoin = 'round'

    if (action.type === 'pen' || action.type === 'erase') {
      if (action.points.length < 2) {
        if (action.points.length === 1) {
          c.beginPath()
          c.arc(action.points[0].x, action.points[0].y, action.size / 2, 0, Math.PI * 2)
          c.fill()
        }
        return
      }
      c.beginPath()
      c.moveTo(action.points[0].x, action.points[0].y)
      for (let i = 1; i < action.points.length; i++) {
        c.lineTo(action.points[i].x, action.points[i].y)
      }
      c.stroke()
    } else if (action.type === 'line') {
      if (action.points.length >= 2) {
        c.beginPath()
        c.moveTo(action.points[0].x, action.points[0].y)
        c.lineTo(action.points[1].x, action.points[1].y)
        c.stroke()
      }
    } else if (action.type === 'rect') {
      if (action.points.length >= 2) {
        const [p1, p2] = action.points
        c.beginPath()
        c.rect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
        c.stroke()
      }
    } else if (action.type === 'circle') {
      if (action.points.length >= 2) {
        const [p1, p2] = action.points
        const rx = Math.abs(p2.x - p1.x)
        const ry = Math.abs(p2.y - p1.y)
        c.beginPath()
        c.ellipse(p1.x, p1.y, rx, ry, 0, 0, Math.PI * 2)
        c.stroke()
      }
    }
  }

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return
    setCanvasImage(c.getImageData(0, 0, canvas.width, canvas.height))
  }, [])

  const restoreCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvasImage) return
    const c = canvas.getContext('2d')
    if (!c) return
    c.putImageData(canvasImage, 0, 0)
  }, [canvasImage])

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, canvas.width, canvas.height)
    for (const action of actions) {
      drawAction(c, action)
    }
    saveCanvasState()
  }, [actions, saveCanvasState])

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasCoords(e)
    setIsDrawing(true)
    setStartPoint(point)

    if (tool === 'fill') {
      const canvas = canvasRef.current
      if (!canvas) return
      const c = canvas.getContext('2d')
      if (!c) return
      c.fillStyle = color
      c.fillRect(0, 0, canvas.width, canvas.height)
      saveCanvasState()
      return
    }

    if (tool === 'picker') {
      return
    }

    const newAction: DrawAction = { type: tool === 'erase' ? 'erase' : tool, points: [point], color, size: tool === 'erase' ? brushSize * 3 : brushSize }
    if (tool === 'pen' || tool === 'erase') {
      setActions((prev) => [...prev, newAction])
    } else {
      setTempAction(newAction)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return
    const point = getCanvasCoords(e)

    if (tool === 'pen' || tool === 'erase') {
      const canvas = canvasRef.current
      if (!canvas) return
      const c = canvas.getContext('2d')
      if (!c) return
      setActions((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        updated[updated.length - 1] = { ...last, points: [...last.points, point] }
        c.strokeStyle = tool === 'erase' ? '#ffffff' : color
        c.lineWidth = tool === 'erase' ? brushSize * 3 : brushSize
        c.lineCap = 'round'
        c.lineJoin = 'round'
        c.beginPath()
        c.moveTo(last.points[last.points.length - 1].x, last.points[last.points.length - 1].y)
        c.lineTo(point.x, point.y)
        c.stroke()
        return updated
      })
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      if (tempAction) {
        const updatedTemp = { ...tempAction, points: [tempAction.points[0], point] }
        setTempAction(updatedTemp)
        restoreCanvas()
        const canvas = canvasRef.current
        if (!canvas) return
        const c = canvas.getContext('2d')
        if (!c) return
        drawAction(c, updatedTemp)
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (tool === 'picker') {
      return
    }

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      const point = getCanvasCoords(e)
      if (tempAction) {
        const finalAction: DrawAction = { ...tempAction, points: [tempAction.points[0], point] }
        setActions((prev) => [...prev, finalAction])
        setTempAction(null)
      }
      setStartPoint(null)
    }

    if (tool === 'fill') {
      setActions((prev) => [...prev, { type: 'fill', points: [], color, size: 0 }])
    }

    setUndoStack([])
    saveCanvasState()
  }

  const handleUndo = () => {
    if (actions.length === 0) return
    const lastAction = actions[actions.length - 1]
    setUndoStack((prev) => [...prev, lastAction])
    setActions((prev) => prev.slice(0, -1))
  }

  const handleRedo = () => {
    if (undoStack.length === 0) return
    const lastUndo = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))
    setActions((prev) => [...prev, lastUndo])
  }

  useEffect(() => {
    redrawAll()
  }, [actions, redrawAll])

  const clearCanvas = () => {
    setActions([])
    setUndoStack([])
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'painting.png'
    link.href = dataUrl
    link.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#2d2d2d', borderBottom: '1px solid #444', flexWrap: 'wrap' }}>
        {([
          { id: 'pen', label: '✏️', title: '铅笔' },
          { id: 'erase', label: '🧹', title: '橡皮擦' },
          { id: 'line', label: '📏', title: '直线' },
          { id: 'rect', label: '⬛', title: '矩形' },
          { id: 'circle', label: '⭕', title: '圆形' },
          { id: 'fill', label: '🎨', title: '填充' },
          { id: 'picker', label: '💉', title: '取色器' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            style={{ ...paintBtn, background: tool === t.id ? '#007acc' : 'transparent', borderColor: tool === t.id ? '#007acc' : 'transparent' }}
            title={t.title}
          >
            {t.label}
          </button>
        ))}
        <div style={{ width: 1, height: 24, background: '#555', margin: '0 4px' }} />
        <span style={{ fontSize: 11, color: '#aaa', margin: '0 4px' }}>画笔大小</span>
        <input
          type="range"
          min={1}
          max={20}
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          style={{ width: 60, accentColor: '#007acc', height: 3 }}
        />
        <span style={{ fontSize: 11, color: '#fff', minWidth: 20 }}>{brushSize}px</span>
        <div style={{ flex: 1 }} />
        <button onClick={handleUndo} style={paintBtn} title="撤销">↩</button>
        <button onClick={handleRedo} style={paintBtn} title="重做">↪</button>
        <button onClick={clearCanvas} style={paintBtn} title="清除">🗑</button>
        <button onClick={saveImage} style={{ ...paintBtn, background: '#007acc' }} title="保存为图片">💾 保存</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 10px', background: '#252526', borderBottom: '1px solid #444', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#aaa', marginRight: 6 }}>颜色:</span>
        {PRESET_COLORS.map((c) => (
          <div
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 20, height: 20, borderRadius: 3, cursor: 'pointer', background: c,
              border: color === c ? '2px solid #fff' : '1px solid #555',
              boxShadow: color === c ? '0 0 4px rgba(255,255,255,0.5)' : 'none'
            }}
          />
        ))}
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 6px' }} />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 28, height: 24, border: '1px solid #555', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'transparent' }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3a3a3a', padding: 8, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{ maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', cursor: 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { if (isDrawing) handleMouseUp({} as React.MouseEvent) }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 10px', background: '#007acc', color: '#fff', fontSize: 11 }}>
        <span>工具: {tool} | 操作: {actions.length} | 撤销: {undoStack.length}</span>
        <span onClick={saveImage} style={{ cursor: 'pointer', textDecoration: 'underline' }}>点击底部保存按钮可保存为 PNG 图片</span>
      </div>
    </div>
  )
}

const paintBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid transparent', color: '#ccc', cursor: 'pointer',
  padding: '4px 8px', borderRadius: 3, fontSize: 14
}