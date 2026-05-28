import { useState, useRef, useCallback, useEffect } from 'react'

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text'
type Color = string

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  tool: Tool
  color: Color
  lineWidth: number
  points: Point[]
  startPoint?: Point
  endPoint?: Point
  text?: string
  timestamp: number
}

const colors = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#374151', '#1f2937', '#111827'
]

const lineWidths = [2, 4, 6, 8, 12, 16, 20]

export default function CollaborativeWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Partial<Stroke> | null>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState<Color>('#ffffff')
  const [lineWidth, setLineWidth] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [history, setHistory] = useState<Stroke[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [users] = useState([
    { id: 'me', name: '你', color: '#8b7cf0', active: true },
    { id: 'user1', name: '用户1', color: '#06b6d4', active: false },
    { id: 'user2', name: '用户2', color: '#22c55e', active: false }
  ])
  
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    return ctx
  }, [])
  
  const drawStroke = useCallback((stroke: Stroke, ctx: CanvasRenderingContext2D) => {
    ctx.save()
    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    switch (stroke.tool) {
      case 'pen':
        if (stroke.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        }
        break
        
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = stroke.lineWidth * 3
        if (stroke.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        }
        break
        
      case 'rectangle':
        if (stroke.startPoint && stroke.endPoint) {
          const x = Math.min(stroke.startPoint.x, stroke.endPoint.x)
          const y = Math.min(stroke.startPoint.y, stroke.endPoint.y)
          const width = Math.abs(stroke.endPoint.x - stroke.startPoint.x)
          const height = Math.abs(stroke.endPoint.y - stroke.startPoint.y)
          ctx.strokeRect(x, y, width, height)
        }
        break
        
      case 'circle':
        if (stroke.startPoint && stroke.endPoint) {
          const radiusX = Math.abs(stroke.endPoint.x - stroke.startPoint.x) / 2
          const radiusY = Math.abs(stroke.endPoint.y - stroke.startPoint.y) / 2
          const centerX = (stroke.startPoint.x + stroke.endPoint.x) / 2
          const centerY = (stroke.startPoint.y + stroke.endPoint.y) / 2
          
          ctx.beginPath()
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        break
        
      case 'line':
        if (stroke.startPoint && stroke.endPoint) {
          ctx.beginPath()
          ctx.moveTo(stroke.startPoint.x, stroke.startPoint.y)
          ctx.lineTo(stroke.endPoint.x, stroke.endPoint.y)
          ctx.stroke()
        }
        break
        
      case 'text':
        if (stroke.text && stroke.startPoint) {
          ctx.font = `${stroke.lineWidth + 12}px system-ui, sans-serif`
          ctx.fillText(stroke.text, stroke.startPoint.x, stroke.startPoint.y)
        }
        break
    }
    
    ctx.restore()
  }, [])
  
  const redrawCanvas = useCallback(() => {
    const ctx = getCanvasContext()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    strokes.forEach(stroke => drawStroke(stroke, ctx))
    
    if (currentStroke && (currentStroke as Stroke).points?.length) {
      drawStroke(currentStroke as Stroke, ctx)
    }
  }, [strokes, currentStroke, getCanvasContext, drawStroke])
  
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])
  
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [])
  
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const point = getPoint(e)
    
    if (tool === 'text') {
      setTextPosition(point)
      setShowTextInput(true)
      return
    }
    
    setIsDrawing(true)
    
    const stroke: Partial<Stroke> = {
      id: Date.now().toString(),
      tool,
      color,
      lineWidth,
      points: [point],
      startPoint: point,
      endPoint: point,
      timestamp: Date.now()
    }
    
    setCurrentStroke(stroke)
  }, [tool, color, lineWidth, getPoint])
  
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return
    e.preventDefault()
    
    const point = getPoint(e)
    
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentStroke(prev => prev ? {
        ...prev,
        points: [...(prev.points || []), point]
      } : null)
    } else {
      setCurrentStroke(prev => prev ? {
        ...prev,
        endPoint: point
      } : null)
    }
  }, [isDrawing, currentStroke, tool, getPoint])
  
  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return
    
    const newHistory = history.slice(0, historyIndex + 1)
    const newStrokes = [...strokes, currentStroke as Stroke]
    
    setStrokes(newStrokes)
    setHistory([...newHistory, newStrokes])
    setHistoryIndex(newHistory.length)
    setCanUndo(true)
    setCanRedo(false)
    setIsDrawing(false)
    setCurrentStroke(null)
  }, [isDrawing, currentStroke, strokes, history, historyIndex])
  
  const handleAddText = useCallback(() => {
    if (!textInput.trim()) {
      setShowTextInput(false)
      return
    }
    
    const stroke: Stroke = {
      id: Date.now().toString(),
      tool: 'text',
      color,
      lineWidth,
      points: [],
      startPoint: textPosition,
      endPoint: textPosition,
      text: textInput,
      timestamp: Date.now()
    }
    
    const newHistory = history.slice(0, historyIndex + 1)
    const newStrokes = [...strokes, stroke]
    
    setStrokes(newStrokes)
    setHistory([...newHistory, newStrokes])
    setHistoryIndex(newHistory.length)
    setCanUndo(true)
    setCanRedo(false)
    setShowTextInput(false)
    setTextInput('')
  }, [textInput, color, lineWidth, textPosition, strokes, history, historyIndex])
  
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    setStrokes(history[newIndex] || [])
    setCanUndo(newIndex > 0)
    setCanRedo(true)
  }, [history, historyIndex])
  
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    
    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)
    setStrokes(history[newIndex])
    setCanUndo(true)
    setCanRedo(newIndex < history.length - 1)
  }, [history, historyIndex])
  
  const handleClear = useCallback(() => {
    if (strokes.length === 0) return
    
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, []])
    setHistoryIndex(newHistory.length)
    setStrokes([])
    setCanUndo(true)
    setCanRedo(false)
  }, [strokes, history, historyIndex])
  
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = canvas.toDataURL()
    link.click()
  }, [])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])
  
  return (
    <div className="app-container" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a2e'
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎨</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
              协作白板
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#888' }}>
              {users.filter(u => u.active).length} 位用户在线
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: canUndo ? '#fff' : '#555',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
            title="撤销 (Ctrl+Z)"
          >
            ↶ 撤销
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: canRedo ? '#fff' : '#555',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
            title="重做 (Ctrl+Shift+Z)"
          >
            ↷ 重做
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,100,100,0.1)',
              color: '#ff6b6b',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🗑️ 清空
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(139,124,240,0.2)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            💾 下载
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: '70px',
          background: 'rgba(0,0,0,0.2)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginBottom: '16px'
          }}>
            {[
              { id: 'pen', icon: '✏️', label: '画笔' },
              { id: 'eraser', icon: '🧹', label: '橡皮擦' },
              { id: 'rectangle', icon: '⬜', label: '矩形' },
              { id: 'circle', icon: '⭕', label: '圆形' },
              { id: 'line', icon: '📏', label: '线条' },
              { id: 'text', icon: '📝', label: '文字' }
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id as Tool)}
                title={label}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: tool === id 
                    ? '2px solid #8b7cf0' 
                    : '2px solid transparent',
                  background: tool === id 
                    ? 'rgba(139,124,240,0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icon}
              </button>
            ))}
          </div>
          
          <div style={{
            padding: '10px 8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '16px',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              颜色
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px'
            }}>
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: color === c 
                      ? '2px solid #fff' 
                      : '1px solid rgba(255,255,255,0.2)',
                    background: c,
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: color === c ? '0 0 10px rgba(139,124,240,0.5)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div style={{
            padding: '10px 8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '16px'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              粗细
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lineWidths.map(w => (
                <button
                  key={w}
                  onClick={() => setLineWidth(w)}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: lineWidth === w 
                      ? '2px solid #8b7cf0' 
                      : 'none',
                    background: lineWidth === w 
                      ? 'rgba(139,124,240,0.2)' 
                      : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: w,
                    borderRadius: '999px',
                    background: color
                  }} />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
        }}>
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            style={{
              cursor: tool === 'pen' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'crosshair',
              background: '#0f0f1a',
              display: 'block',
              width: '100%',
              height: '100%'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {showTextInput && (
            <div style={{
              position: 'absolute',
              left: textPosition.x,
              top: textPosition.y - 20,
              background: '#2a2a3e',
              border: '2px solid #8b7cf0',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}>
              <input
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddText()
                  } else if (e.key === 'Escape') {
                    setShowTextInput(false)
                    setTextInput('')
                  }
                }}
                placeholder="输入文字..."
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  minWidth: '150px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={handleAddText}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#8b7cf0',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false)
                    setTextInput('')
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#aaa',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div style={{
          width: '180px',
          background: 'rgba(0,0,0,0.2)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          padding: '12px',
          overflowY: 'auto'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '12px',
            color: '#888',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            在线用户
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {users.map(user => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: user.active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  opacity: user.active ? 1 : 0.5
                }}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: user.color,
                  boxShadow: user.active ? `0 0 8px ${user.color}` : 'none'
                }} />
                <span style={{
                  fontSize: '13px',
                  color: '#ccc'
                }}>
                  {user.name}
                </span>
                {user.id === 'me' && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(139,124,240,0.2)',
                    color: '#8b7cf0',
                    marginLeft: 'auto'
                  }}>
                    你
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '12px',
            color: '#888',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            历史记录
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {strokes.slice().reverse().slice(0, 15).map((stroke) => (
              <div
                key={stroke.id}
                style={{
                  fontSize: '11px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#777',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: stroke.color,
                  flexShrink: 0
                }} />
                <span style={{ flex: 1 }}>
                  {stroke.tool === 'pen' && '画笔'}
                  {stroke.tool === 'eraser' && '橡皮擦'}
                  {stroke.tool === 'rectangle' && '矩形'}
                  {stroke.tool === 'circle' && '圆形'}
                  {stroke.tool === 'line' && '线条'}
                  {stroke.tool === 'text' && `文字: ${stroke.text}`}
                </span>
              </div>
            ))}
            
            {strokes.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px 10px',
                color: '#555',
                fontSize: '12px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  📋
                </div>
                开始绘制你的想法
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
