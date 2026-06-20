import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface DrawingElement {
  id: string
  type: 'line' | 'rect' | 'circle' | 'text' | 'freehand' | 'select' | 'eraser'
  x: number
  y: number
  width?: number
  height?: number
  color: string
  strokeWidth: number
  points?: Array<{ x: number; y: number }>
  text?: string
  fontSize?: number
}

interface Tool {
  id: string
  name: string
  icon: string
  type: 'line' | 'rect' | 'circle' | 'text' | 'freehand' | 'eraser' | 'select'
}

const tools: Tool[] = [
  { id: 'freehand', name: '自由绘制', icon: '✏️', type: 'freehand' },
  { id: 'line', name: '直线', icon: '📏', type: 'line' },
  { id: 'rect', name: '矩形', icon: '⬜', type: 'rect' },
  { id: 'circle', name: '圆形', icon: '⭕', type: 'circle' },
  { id: 'text', name: '文字', icon: '📝', type: 'text' },
  { id: 'eraser', name: '橡皮擦', icon: '🧹', type: 'eraser' },
  { id: 'select', name: '选择', icon: '👆', type: 'select' }
]

const colors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#7c6cf0', '#00d6c1', '#ff9f43', '#ee5a24', '#0abde3']

const CollaborativeWhiteboard = memo(function CollaborativeWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool>(tools[0])
  const [selectedColor, setSelectedColor] = useState('#7c6cf0')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [fontSize, setFontSize] = useState(16)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([])
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [history, setHistory] = useState<DrawingElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(1)
  const [pan] = useState({ x: 0, y: 0 })
  const [gridVisible, setGridVisible] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [canvasSize] = useState({ width: 800, height: 600 })

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = darkMode ? '#1a1a2e' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    if (gridVisible) {
      ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
      ctx.lineWidth = 1
      const gridSize = 20 * zoom
      for (let x = pan.x % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = pan.y % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw elements
    elements.forEach(element => {
      ctx.strokeStyle = element.color
      ctx.fillStyle = element.color
      ctx.lineWidth = element.strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const isSelected = element.id === selectedElement
      if (isSelected) {
        ctx.shadowColor = '#7c6cf0'
        ctx.shadowBlur = 10
      } else {
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      }

      switch (element.type) {
        case 'freehand':
          if (element.points && element.points.length > 1) {
            ctx.beginPath()
            ctx.moveTo(element.points[0].x * zoom + pan.x, element.points[0].y * zoom + pan.y)
            element.points.forEach(point => {
              ctx.lineTo(point.x * zoom + pan.x, point.y * zoom + pan.y)
            })
            ctx.stroke()
          }
          break
        case 'line':
          ctx.beginPath()
          ctx.moveTo(element.x * zoom + pan.x, element.y * zoom + pan.y)
          ctx.lineTo((element.x + (element.width || 0)) * zoom + pan.x, (element.y + (element.height || 0)) * zoom + pan.y)
          ctx.stroke()
          break
        case 'rect':
          ctx.strokeRect(
            element.x * zoom + pan.x,
            element.y * zoom + pan.y,
            (element.width || 0) * zoom,
            (element.height || 0) * zoom
          )
          break
        case 'circle':
          const radius = Math.sqrt((element.width || 0) ** 2 + (element.height || 0) ** 2) / 2 * zoom
          ctx.beginPath()
          ctx.arc(
            (element.x + (element.width || 0) / 2) * zoom + pan.x,
            (element.y + (element.height || 0) / 2) * zoom + pan.y,
            radius,
            0,
            Math.PI * 2
          )
          ctx.stroke()
          break
        case 'text':
          ctx.font = `${(element.fontSize || 16) * zoom}px sans-serif`
          ctx.fillText(element.text || '', element.x * zoom + pan.x, element.y * zoom + pan.y)
          break
      }
    })

    // Draw current freehand path
    if (isDrawing && selectedTool.type === 'freehand' && currentPoints.length > 1) {
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = strokeWidth
      ctx.beginPath()
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y)
      currentPoints.forEach(point => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }
  }, [elements, selectedElement, currentPoints, isDrawing, selectedTool, selectedColor, strokeWidth, zoom, pan, gridVisible, darkMode])

  // Redraw on changes
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    if (selectedTool.type === 'text') {
      setTextPosition({ x, y })
      setShowTextInput(true)
      return
    }

    if (selectedTool.type === 'select') {
      // Find clicked element
      const clicked = elements.find(el => {
        if (el.type === 'freehand' && el.points) {
          return el.points.some(p => Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10)
        }
        return x >= el.x && x <= el.x + (el.width || 0) && y >= el.y && y <= el.y + (el.height || 0)
      })
      setSelectedElement(clicked?.id || null)
      return
    }

    if (selectedTool.type === 'eraser') {
      // Find and delete clicked element
      const clickedIndex = elements.findIndex(el => {
        if (el.type === 'freehand' && el.points) {
          return el.points.some(p => Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10)
        }
        return x >= el.x && x <= el.x + (el.width || 0) && y >= el.y && y <= el.y + (el.height || 0)
      })
      if (clickedIndex !== -1) {
        saveToHistory()
        setElements(prev => prev.filter((_, i) => i !== clickedIndex))
      }
      return
    }

    setIsDrawing(true)
    setStartPos({ x, y })
    if (selectedTool.type === 'freehand') {
      setCurrentPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }])
    }
  }, [selectedTool, elements, zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    if (selectedTool.type === 'freehand') {
      setCurrentPoints(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }])
    }
  }, [isDrawing, selectedTool])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const endX = (e.clientX - rect.left - pan.x) / zoom
    const endY = (e.clientY - rect.top - pan.y) / zoom

    saveToHistory()

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: selectedTool.type,
      x: startPos.x,
      y: startPos.y,
      width: endX - startPos.x,
      height: endY - startPos.y,
      color: selectedColor,
      strokeWidth,
      points: selectedTool.type === 'freehand' ? currentPoints.map(p => ({ x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom })) : undefined
    }

    setElements(prev => [...prev, newElement])
    setIsDrawing(false)
    setStartPos(null)
    setCurrentPoints([])
  }, [isDrawing, startPos, selectedTool, selectedColor, strokeWidth, currentPoints, zoom, pan])

  // History management
  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), elements])
    setHistoryIndex(prev => prev + 1)
  }, [elements, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setElements(history[historyIndex - 1] || [])
    } else if (historyIndex === 0) {
      setHistoryIndex(-1)
      setElements([])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setElements(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Text input
  const handleTextSubmit = useCallback(() => {
    if (!textPosition || !textInput.trim()) return
    saveToHistory()
    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      color: selectedColor,
      strokeWidth: 1,
      text: textInput,
      fontSize
    }
    setElements(prev => [...prev, newElement])
    setShowTextInput(false)
    setTextInput('')
    setTextPosition(null)
  }, [textPosition, textInput, selectedColor, fontSize, saveToHistory])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    saveToHistory()
    setElements([])
    setSelectedElement(null)
  }, [saveToHistory])

  // Export
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `whiteboard_${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          undo()
        } else if (e.key === 'y') {
          e.preventDefault()
          redo()
        } else if (e.key === 's') {
          e.preventDefault()
          exportCanvas()
        }
      }
      if (e.key === 'Delete' && selectedElement) {
        saveToHistory()
        setElements(prev => prev.filter(el => el.id !== selectedElement))
        setSelectedElement(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, exportCanvas, selectedElement, saveToHistory])

  return (
    <div className="app-shell" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(26, 26, 46, 0.4)',
        flexWrap: 'wrap'
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`app-button ${selectedTool.id === tool.id ? 'app-button-primary' : ''}`}
              onClick={() => setSelectedTool(tool)}
              title={tool.name}
              style={{ padding: '6px 10px' }}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <span className="app-toolbar-separator" />

        {/* Colors */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {colors.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: selectedColor === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                background: color,
                cursor: 'pointer'
              }}
              title={color}
            />
          ))}
        </div>

        <span className="app-toolbar-separator" />

        {/* Stroke Width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>粗细:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{ width: '80px' }}
          />
          <span style={{ fontSize: '12px' }}>{strokeWidth}px</span>
        </div>

        {/* Font Size */}
        {selectedTool.type === 'text' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>字号:</span>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="app-input"
              style={{ width: '60px' }}
            />
          </div>
        )}

        <span className="app-toolbar-separator" />

        {/* Actions */}
        <button className="app-button" onClick={undo} disabled={historyIndex < 0} title="撤销 (Ctrl+Z)">
          ↩️
        </button>
        <button className="app-button" onClick={redo} disabled={historyIndex >= history.length - 1} title="重做 (Ctrl+Y)">
          ↪️
        </button>
        <button className="app-button" onClick={clearCanvas} title="清空画布">
          🗑️
        </button>
        <button className="app-button app-button-primary" onClick={exportCanvas} title="导出 (Ctrl+S)">
          💾
        </button>

        <span className="app-toolbar-separator" />

        {/* View Options */}
        <button
          className={`app-button ${gridVisible ? 'app-button-primary' : ''}`}
          onClick={() => setGridVisible(!gridVisible)}
          title="显示网格"
        >
          📐
        </button>
        <button
          className={`app-button ${darkMode ? 'app-button-primary' : ''}`}
          onClick={() => setDarkMode(!darkMode)}
          title="暗色模式"
        >
          🌙
        </button>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="app-button" onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}>
            🔍-
          </button>
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="app-button" onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}>
            🔍+
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: darkMode ? '#0a0a14' : '#f0f0f0',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: selectedTool.type === 'text' ? 'text' :
                     selectedTool.type === 'eraser' ? 'crosshair' :
                     selectedTool.type === 'select' ? 'pointer' : 'crosshair',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
          }}
        />

        {/* Text Input Dialog */}
        {showTextInput && textPosition && (
          <div style={{
            position: 'absolute',
            left: textPosition.x * zoom + pan.x + 50,
            top: textPosition.y * zoom + pan.y + 50,
            background: 'var(--window-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 100
          }}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit()
                if (e.key === 'Escape') setShowTextInput(false)
              }}
              className="app-input"
              placeholder="输入文字..."
              autoFocus
              style={{ width: '200px', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="app-button app-button-primary" onClick={handleTextSubmit}>
                确定
              </button>
              <button className="app-button" onClick={() => setShowTextInput(false)}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          工具: {selectedTool.name} | 颜色: {selectedColor} | 粗细: {strokeWidth}px
        </span>
        <span>
          元素: {elements.length} | 历史: {historyIndex + 1}/{history.length} | 缩放: {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  )
})

export default CollaborativeWhiteboard