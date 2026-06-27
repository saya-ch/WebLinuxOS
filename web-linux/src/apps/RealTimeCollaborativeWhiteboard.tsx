import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { DownloadIcon, TrashIcon, GridIcon, PaletteIcon } from '../icons'
import { Share2, Users, Eraser, Square, Circle, Type, Undo2, Redo2, ZoomIn, ZoomOut, Pencil } from 'lucide-react'

interface DrawingAction {
  id: string
  type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'image' | 'line'
  x: number
  y: number
  width?: number
  height?: number
  color: string
  size: number
  text?: string
  points?: { x: number; y: number }[]
  timestamp: number
  userId: string
}

interface Collaborator {
  id: string
  name: string
  color: string
  cursorX: number
  cursorY: number
  isActive: boolean
}

const COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd',
  '#ff9ff3', '#54a0ff', '#00d2d3', '#ff9f43', '#ee5a24',
  '#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#ffffff'
]

const TOOLS = [
  { id: 'pen', icon: <Pencil size={18} />, name: '画笔' },
  { id: 'eraser', icon: <Eraser size={18} />, name: '橡皮擦' },
  { id: 'rectangle', icon: <Square size={18} />, name: '矩形' },
  { id: 'circle', icon: <Circle size={18} />, name: '圆形' },
  { id: 'line', icon: <div style={{ width: 18, height: 2, background: 'currentColor' }} />, name: '线条' },
  { id: 'text', icon: <Type size={18} />, name: '文本' },
  { id: 'image', icon: <img src="data:image/svg+xml,%3Csvg viewBox='0 0 24 24' width='18' height='18' stroke='currentColor' strokeWidth='2' fill='none'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E" alt="image" />, name: '图片' },
]

const SIZES = [2, 4, 8, 12, 16, 24, 32]

export default function RealTimeCollaborativeWhiteboard() {
  const theme = useStore((s) => s.theme)
  const [tool, setTool] = useState<string>('pen')
  const [color, setColor] = useState('#ff6b6b')
  const [size, setSize] = useState(4)
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [actions, setActions] = useState<DrawingAction[]>([])
  const [undoStack, setUndoStack] = useState<DrawingAction[]>([])
  const [collaborators] = useState<Collaborator[]>([
    { id: 'user-1', name: '你', color: '#ff6b6b', cursorX: 0, cursorY: 0, isActive: true },
    { id: 'user-2', name: '协作者 A', color: '#48dbfb', cursorX: 150, cursorY: 200, isActive: true },
    { id: 'user-3', name: '协作者 B', color: '#1dd1a1', cursorX: 300, cursorY: 100, isActive: false },
  ])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState<string>('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userId = 'user-1'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = theme === 'dark' ? '#1a1a2e' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = theme === 'dark' ? '#2a2a3e' : '#e0e0e0'
      ctx.lineWidth = 1
      const gridSize = 20 * zoom
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw all actions
    actions.forEach(action => {
      ctx.save()
      ctx.strokeStyle = action.color
      ctx.fillStyle = action.color
      ctx.lineWidth = action.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      switch (action.type) {
        case 'pen':
          if (action.points && action.points.length > 0) {
            ctx.beginPath()
            ctx.moveTo(action.points[0].x * zoom, action.points[0].y * zoom)
            action.points.forEach(point => {
              ctx.lineTo(point.x * zoom, point.y * zoom)
            })
            ctx.stroke()
          }
          break
        case 'eraser':
          if (action.points && action.points.length > 0) {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.moveTo(action.points[0].x * zoom, action.points[0].y * zoom)
            action.points.forEach(point => {
              ctx.lineTo(point.x * zoom, point.y * zoom)
            })
            ctx.stroke()
          }
          break
        case 'rectangle':
          ctx.strokeRect(action.x * zoom, action.y * zoom, (action.width || 100) * zoom, (action.height || 100) * zoom)
          break
        case 'circle':
          ctx.beginPath()
          const radius = Math.max(1, (action.size || 50) * zoom)
          ctx.arc(action.x * zoom, action.y * zoom, radius, 0, Math.PI * 2)
          ctx.stroke()
          break
        case 'line':
          if (action.points && action.points.length >= 2) {
            ctx.beginPath()
            ctx.moveTo(action.points[0].x * zoom, action.points[0].y * zoom)
            ctx.lineTo(action.points[1].x * zoom, action.points[1].y * zoom)
            ctx.stroke()
          }
          break
        case 'text':
          if (action.text) {
            ctx.font = `${action.size * zoom}px Arial`
            ctx.fillText(action.text, action.x * zoom, action.y * zoom)
          }
          break
      }
      ctx.restore()
    })

    // Draw current drawing preview
    if (isDrawing && currentPoints.length > 0) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (tool === 'pen' || tool === 'eraser') {
        if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.moveTo(currentPoints[0].x * zoom, currentPoints[0].y * zoom)
        currentPoints.forEach(point => {
          ctx.lineTo(point.x * zoom, point.y * zoom)
        })
        ctx.stroke()
      } else if (tool === 'line' && currentPoints.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(currentPoints[0].x * zoom, currentPoints[0].y * zoom)
        ctx.lineTo(currentPoints[1].x * zoom, currentPoints[1].y * zoom)
        ctx.stroke()
      }
      ctx.restore()
    }

    // Draw shape preview
    if (startPos && tool === 'rectangle') {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = size
      const currentX = currentPoints[currentPoints.length - 1]?.x || startPos.x
      const currentY = currentPoints[currentPoints.length - 1]?.y || startPos.y
      ctx.strokeRect(startPos.x * zoom, startPos.y * zoom, (currentX - startPos.x) * zoom, (currentY - startPos.y) * zoom)
      ctx.restore()
    }

    if (startPos && tool === 'circle') {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = size
      const currentX = currentPoints[currentPoints.length - 1]?.x || startPos.x
      const currentY = currentPoints[currentPoints.length - 1]?.y || startPos.y
      const radius = Math.max(1, Math.sqrt(Math.pow(currentX - startPos.x, 2) + Math.pow(currentY - startPos.y, 2)) * zoom)
      ctx.beginPath()
      ctx.arc(startPos.x * zoom, startPos.y * zoom, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    // Draw collaborator cursors
    collaborators.filter(c => c.isActive && c.id !== userId).forEach(collab => {
      ctx.save()
      ctx.fillStyle = collab.color
      ctx.beginPath()
      ctx.moveTo(collab.cursorX * zoom, collab.cursorY * zoom)
      ctx.lineTo(collab.cursorX * zoom + 10, collab.cursorY * zoom + 10)
      ctx.lineTo(collab.cursorX * zoom + 5, collab.cursorY * zoom + 15)
      ctx.closePath()
      ctx.fill()
      ctx.font = '12px Arial'
      ctx.fillText(collab.name, collab.cursorX * zoom + 10, collab.cursorY * zoom - 5)
      ctx.restore()
    })
  }, [actions, currentPoints, isDrawing, startPos, tool, color, size, showGrid, zoom, theme, collaborators])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    setIsDrawing(true)
    setStartPos({ x, y })
    setCurrentPoints([{ x, y }])

    if (tool === 'text') {
      setTextPosition({ x, y })
      setShowTextInput(true)
      setIsDrawing(false)
    }
  }, [tool, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (tool === 'pen' || tool === 'eraser' || tool === 'line') {
      setCurrentPoints(prev => [...prev, { x, y }])
    } else {
      setCurrentPoints([{ x, y }])
    }
  }, [isDrawing, tool, zoom])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return

    const newAction: DrawingAction = {
      id: `action-${Date.now()}`,
      type: tool as any,
      x: startPos?.x || 0,
      y: startPos?.y || 0,
      color,
      size,
      timestamp: Date.now(),
      userId,
      points: currentPoints,
    }

    if (tool === 'rectangle') {
      const endX = currentPoints[currentPoints.length - 1]?.x || startPos?.x || 0
      const endY = currentPoints[currentPoints.length - 1]?.y || startPos?.y || 0
      newAction.width = endX - (startPos?.x || 0)
      newAction.height = endY - (startPos?.y || 0)
    }

    if (tool === 'circle') {
      const endX = currentPoints[currentPoints.length - 1]?.x || startPos?.x || 0
      const endY = currentPoints[currentPoints.length - 1]?.y || startPos?.y || 0
      newAction.size = Math.sqrt(Math.pow(endX - (startPos?.x || 0), 2) + Math.pow(endY - (startPos?.y || 0), 2))
    }

    setActions(prev => [...prev, newAction])
    setIsDrawing(false)
    setCurrentPoints([])
    setStartPos(null)
  }, [isDrawing, tool, color, size, startPos, currentPoints, userId])

  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textPosition) return

    const newAction: DrawingAction = {
      id: `action-${Date.now()}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      color,
      size,
      text: textInput,
      timestamp: Date.now(),
      userId,
    }

    setActions(prev => [...prev, newAction])
    setTextInput('')
    setShowTextInput(false)
    setTextPosition(null)
  }, [textInput, textPosition, color, size, userId])

  const handleUndo = useCallback(() => {
    if (actions.length === 0) return
    const lastAction = actions[actions.length - 1]
    setUndoStack(prev => [...prev, lastAction])
    setActions(prev => prev.slice(0, -1))
  }, [actions])

  const handleRedo = useCallback(() => {
    if (undoStack.length === 0) return
    const action = undoStack[undoStack.length - 1]
    setActions(prev => [...prev, action])
    setUndoStack(prev => prev.slice(0, -1))
  }, [undoStack])

  const handleClear = useCallback(() => {
    setActions([])
    setUndoStack([])
  }, [])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const handleShare = useCallback(() => {
    // Simulate sharing - in a real app this would create a shareable link
    const shareData = {
      actions,
      timestamp: Date.now(),
    }
    const shareCode = JSON.stringify(shareData)
    navigator.clipboard?.writeText(shareCode)
    useStore.getState().addNotification({
      title: '分享成功',
      message: '白板数据已复制到剪贴板',
      type: 'success',
      duration: 3000,
    })
  }, [actions])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }, [])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'dark' ? '#0a0a18' : '#f5f5f5',
      color: theme === 'dark' ? '#e0e0e0' : '#333',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px',
        background: theme === 'dark' ? '#1a1a2e' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? '#2a2a3e' : '#e0e0e0'}`,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.name}
              style={{
                padding: '8px',
                background: tool === t.id
                  ? (theme === 'dark' ? '#3a3a4e' : '#e0e0e0')
                  : (theme === 'dark' ? '#2a2a3e' : '#ffffff'),
                border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <PaletteIcon size={16} />
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '24px',
                height: '24px',
                background: c,
                border: color === c ? `2px solid ${theme === 'dark' ? '#fff' : '#333'}` : '1px solid transparent',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* Sizes */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme === 'dark' ? '#8a8a9e' : '#666' }}>大小:</span>
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              style={{
                width: '28px',
                height: '28px',
                background: size === s
                  ? (theme === 'dark' ? '#3a3a4e' : '#e0e0e0')
                  : (theme === 'dark' ? '#2a2a3e' : '#ffffff'),
                border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
              }}
            >
              <div style={{ width: s, height: s, background: color, borderRadius: '50%' }} />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button
            onClick={handleUndo}
            disabled={actions.length === 0}
            title="撤销"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: actions.length === 0 ? 'not-allowed' : 'pointer',
              opacity: actions.length === 0 ? 0.5 : 1,
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={handleRedo}
            disabled={undoStack.length === 0}
            title="重做"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
              opacity: undoStack.length === 0 ? 0.5 : 1,
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <Redo2 size={18} />
          </button>
          <button
            onClick={handleClear}
            title="清空"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <TrashIcon size={18} />
          </button>
        </div>

        {/* View controls */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? '隐藏网格' : '显示网格'}
            style={{
              padding: '8px',
              background: showGrid
                ? (theme === 'dark' ? '#3a3a4e' : '#e0e0e0')
                : (theme === 'dark' ? '#2a2a3e' : '#ffffff'),
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="缩小"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer',
              opacity: zoom <= 0.5 ? 0.5 : 1,
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <ZoomOut size={18} />
          </button>
          <span style={{ fontSize: '12px', color: theme === 'dark' ? '#8a8a9e' : '#666' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            title="放大"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
              opacity: zoom >= 3 ? 0.5 : 1,
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Export */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleDownload}
            title="下载"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <DownloadIcon size={18} />
          </button>
          <button
            onClick={handleShare}
            title="分享"
            style={{
              padding: '8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Collaborators bar */}
      <div style={{
        padding: '8px 12px',
        background: theme === 'dark' ? '#1a1a2e' : '#fafafa',
        borderBottom: `1px solid ${theme === 'dark' ? '#2a2a3e' : '#e0e0e0'}`,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <Users size={16} />
        <span style={{ fontSize: '12px', color: theme === 'dark' ? '#8a8a9e' : '#666' }}>
          协作者:
        </span>
        {collaborators.map(collab => (
          <div
            key={collab.id}
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              padding: '4px 8px',
              background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
              borderRadius: '4px',
              opacity: collab.isActive ? 1 : 0.5,
            }}
          >
            <div style={{
              width: '12px',
              height: '12px',
              background: collab.color,
              borderRadius: '50%',
            }} />
            <span style={{ fontSize: '12px' }}>{collab.name}</span>
          </div>
        ))}
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            border: `2px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
            borderRadius: '8px',
            cursor: tool === 'text' ? 'text' : 'crosshair',
            background: theme === 'dark' ? '#1a1a2e' : '#ffffff',
          }}
        />
      </div>

      {/* Text input modal */}
      {showTextInput && (
        <div style={{
          position: 'absolute',
          left: textPosition?.x ? textPosition.x * zoom + 50 : 100,
          top: textPosition?.y ? textPosition.y * zoom + 50 : 100,
          background: theme === 'dark' ? '#2a2a3e' : '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="输入文本..."
            autoFocus
            style={{
              padding: '8px',
              width: '200px',
              background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
              border: `1px solid ${theme === 'dark' ? '#3a3a4e' : '#d0d0d0'}`,
              borderRadius: '4px',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleTextSubmit}
              style={{
                padding: '6px 12px',
                background: color,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              确定
            </button>
            <button
              onClick={() => {
                setShowTextInput(false)
                setTextInput('')
                setTextPosition(null)
              }}
              style={{
                padding: '6px 12px',
                background: theme === 'dark' ? '#3a3a4e' : '#e0e0e0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div style={{
        padding: '8px 12px',
        background: theme === 'dark' ? '#1a1a2e' : '#fafafa',
        borderTop: `1px solid ${theme === 'dark' ? '#2a2a3e' : '#e0e0e0'}`,
        display: 'flex',
        gap: '12px',
        fontSize: '12px',
        color: theme === 'dark' ? '#8a8a9e' : '#666',
      }}>
        <span>工具: {TOOLS.find(t => t.id === tool)?.name}</span>
        <span>颜色: {color}</span>
        <span>大小: {size}px</span>
        <span>操作数: {actions.length}</span>
        <span>缩放: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}