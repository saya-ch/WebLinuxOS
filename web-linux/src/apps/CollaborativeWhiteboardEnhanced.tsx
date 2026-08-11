import React, { useState, useRef, useEffect, useCallback } from 'react'

type ToolType = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'highlighter'

interface DrawAction {
  id: string
  type: string
  color: string
  size: number
  points: { x: number; y: number }[]
  text?: string
}

interface CollaborativeWhiteboardEnhancedProps {
  onClose?: () => void
}

const CollaborativeWhiteboardEnhanced: React.FC<CollaborativeWhiteboardEnhancedProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#667eea')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  const [actions, setActions] = useState<DrawAction[]>([])
  const [undoStack, setUndoStack] = useState<DrawAction[]>([])
  const [roomId, setRoomId] = useState('')
  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [userName] = useState(() => `User_${Math.random().toString(36).substring(2, 8)}`)
  const [textInput, setTextInput] = useState('')
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)

  const PRESET_COLORS = [
    '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#667eea', '#ffffff', '#6b7280'
  ]

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return

    const resizeCanvas = () => {
      const container = containerRef.current
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // 连接到房间
  const joinRoom = useCallback((roomName: string) => {
    if (broadcastRef.current) {
      broadcastRef.current.close()
    }

    const channel = new BroadcastChannel(`whiteboard-room-${roomName}`)
    broadcastRef.current = channel

    channel.postMessage({
      type: 'join',
      user: userName,
      timestamp: Date.now()
    })

    channel.onmessage = (event) => {
      const data = event.data
      
      switch (data.type) {
        case 'join':
          setParticipants(prev => {
            if (prev.includes(data.user)) return prev
            return [...prev, data.user]
          })
          // 发送当前状态给新加入的用户
          channel.postMessage({
            type: 'sync-state',
            actions,
            user: userName
          })
          break
        case 'sync-state':
          if (data.user !== userName && Array.isArray(data.actions)) {
            setActions(data.actions)
            setTimeout(() => redrawCanvas(), 50)
          }
          break
        case 'draw':
          if (data.user !== userName) {
            setActions(prev => [...prev, data.action])
            setTimeout(() => redrawCanvas(), 10)
          }
          break
        case 'clear':
          if (data.user !== userName) {
            setActions([])
            setUndoStack([])
            setTimeout(() => redrawCanvas(), 10)
          }
          break
        case 'leave':
          setParticipants(prev => prev.filter(p => p !== data.user))
          break
      }
    }

    setRoomId(roomName)
    setConnected(true)
  }, [userName, actions])

  const leaveRoom = useCallback(() => {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'leave',
        user: userName
      })
      broadcastRef.current.close()
      broadcastRef.current = null
    }
    setConnected(false)
    setRoomId('')
    setParticipants([])
  }, [userName])

  // 重绘画布
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制网格背景
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5
    const gridSize = 20
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

    // 绘制所有已完成的操作
    actions.forEach(action => {
      drawAction(ctx, action)
    })

    // 绘制当前正在绘制的路径
    if (isDrawing && currentPoints.length > 0) {
      drawAction(ctx, {
        id: 'current',
        type: tool,
        color,
        size: brushSize,
        points: currentPoints,
        text: textInput
      })
    }
  }, [actions, currentPoints, isDrawing, tool, color, brushSize, textInput])

  // 绘制单个操作
  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.color
    ctx.fillStyle = action.color
    ctx.lineWidth = action.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (action.type) {
      case 'pen':
      case 'highlighter':
      case 'eraser':
        if (action.type === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
        } else if (action.type === 'highlighter') {
          ctx.globalAlpha = 0.3
        } else {
          ctx.globalAlpha = 1
        }
        
        if (action.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(action.points[0].x, action.points[0].y)
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y)
          }
          ctx.stroke()
        } else if (action.points.length === 1) {
          ctx.beginPath()
          ctx.arc(action.points[0].x, action.points[0].y, action.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        break

      case 'rectangle':
        if (action.points.length >= 2) {
          const start = action.points[0]
          const end = action.points[action.points.length - 1]
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
        }
        break

      case 'circle':
        if (action.points.length >= 2) {
          const start = action.points[0]
          const end = action.points[action.points.length - 1]
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
          ctx.beginPath()
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
        break

      case 'line':
      case 'arrow':
        if (action.points.length >= 2) {
          const start = action.points[0]
          const end = action.points[action.points.length - 1]
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()

          if (action.type === 'arrow') {
            const angle = Math.atan2(end.y - start.y, end.x - start.x)
            const arrowSize = 10
            ctx.beginPath()
            ctx.moveTo(end.x, end.y)
            ctx.lineTo(end.x - arrowSize * Math.cos(angle - Math.PI / 6), 
                      end.y - arrowSize * Math.sin(angle - Math.PI / 6))
            ctx.lineTo(end.x - arrowSize * Math.cos(angle + Math.PI / 6), 
                      end.y - arrowSize * Math.sin(angle + Math.PI / 6))
            ctx.closePath()
            ctx.fill()
          }
        }
        break

      case 'text':
        if (action.points.length > 0 && action.text) {
          ctx.font = `${action.size * 5}px sans-serif`
          ctx.fillText(action.text, action.points[0].x, action.points[0].y)
        }
        break
    }
  }

  // 鼠标事件
  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    
    if (tool === 'text') {
      setTextPosition(pos)
      setShowTextDialog(true)
      return
    }

    setIsDrawing(true)
    setCurrentPoints([pos])
    startPointRef.current = pos
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return
    const pos = getMousePos(e)
    setCurrentPoints(prev => [...prev, pos])
  }

  const handleMouseUp = () => {
    if (!isDrawing || currentPoints.length === 0) {
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }

    const action: DrawAction = {
      id: Date.now().toString(),
      type: tool,
      color,
      size: brushSize,
      points: currentPoints,
      text: textInput
    }

    setActions(prev => [...prev, action])
    
    // 广播到其他用户
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'draw',
        action,
        user: userName
      })
    }

    setIsDrawing(false)
    setCurrentPoints([])
    setTextInput('')
  }

  // 撤销
  const undo = () => {
    if (actions.length === 0) return
    const lastAction = actions[actions.length - 1]
    setActions(prev => prev.slice(0, -1))
    setUndoStack(prev => [...prev, lastAction])
    setTimeout(() => redrawCanvas(), 10)
  }

  // 重做
  const redo = () => {
    if (undoStack.length === 0) return
    const lastUndo = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setActions(prev => [...prev, lastUndo])
    setTimeout(() => redrawCanvas(), 10)
  }

  // 清空画布
  const clearCanvas = () => {
    setActions([])
    setUndoStack([])
    setCurrentPoints([])
    
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'clear',
        user: userName
      })
    }
    
    setTimeout(() => redrawCanvas(), 10)
  }

  // 导出为图片
  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    link.download = `whiteboard-${new Date().getTime()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  // 添加文本
  const addText = () => {
    if (!textInput.trim()) {
      setShowTextDialog(false)
      return
    }

    const action: DrawAction = {
      id: Date.now().toString(),
      type: 'text',
      color,
      size: brushSize,
      points: [textPosition],
      text: textInput
    }

    setActions(prev => [...prev, action])
    
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'draw',
        action,
        user: userName
      })
    }

    setShowTextDialog(false)
    setTextInput('')
  }

  // 自动重绘
  useEffect(() => {
    if (!isDrawing) {
      redrawCanvas()
    }
  }, [actions, redrawCanvas, isDrawing])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb'
    }}>
      {/* 工具栏 */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* 协作控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!connected ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="房间ID"
                defaultValue={`room-${Math.random().toString(36).substring(2, 8)}`}
                id="room-input"
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  width: '150px'
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('room-input') as HTMLInputElement
                  if (input.value.trim()) {
                    joinRoom(input.value.trim())
                  }
                }}
                style={{
                  padding: '6px 14px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                加入房间
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '4px 10px',
                background: '#d1fae5',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#065f46'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  background: '#10b981', 
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                已连接: {roomId}
              </div>
              {participants.length > 0 && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  👥 {participants.length + 1} 人在线
                </span>
              )}
              <button
                onClick={leaveRoom}
                style={{
                  padding: '4px 10px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                离开
              </button>
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

        {/* 工具选择 */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'pen', icon: '✏️', name: '画笔' },
            { id: 'highlighter', icon: '🖍️', name: '荧光笔' },
            { id: 'eraser', icon: '🧽', name: '橡皮' },
            { id: 'rectangle', icon: '⬛', name: '矩形' },
            { id: 'circle', icon: '⭕', name: '圆形' },
            { id: 'line', icon: '📏', name: '直线' },
            { id: 'arrow', icon: '➡️', name: '箭头' },
            { id: 'text', icon: '📝', name: '文字' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as ToolType)}
              title={t.name}
              style={{
                width: '36px',
                height: '36px',
                background: tool === t.id ? '#e0e7ff' : 'transparent',
                border: tool === t.id ? '2px solid #667eea' : '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

        {/* 颜色选择 */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>颜色:</span>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '24px',
                height: '24px',
                background: c,
                border: color === c ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '50%',
                cursor: 'pointer',
                padding: 0
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '2px'
            }}
          />
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

        {/* 笔触大小 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>大小:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '24px' }}>{brushSize}</span>
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={undo}
            disabled={actions.length === 0}
            style={{
              padding: '6px 12px',
              background: actions.length === 0 ? '#f3f4f6' : '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: actions.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ↶ 撤销
          </button>
          <button
            onClick={redo}
            disabled={undoStack.length === 0}
            style={{
              padding: '6px 12px',
              background: undoStack.length === 0 ? '#f3f4f6' : '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ↷ 重做
          </button>
          <button
            onClick={clearCanvas}
            style={{
              padding: '6px 12px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#991b1b'
            }}
          >
            🗑️ 清空
          </button>
          <button
            onClick={exportImage}
            style={{
              padding: '6px 12px',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#166534'
            }}
          >
            💾 导出
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          position: 'relative',
          overflow: 'hidden',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />

        {/* 文本输入对话框 */}
        {showTextDialog && (
          <div
            style={{
              position: 'absolute',
              left: textPosition.x,
              top: textPosition.y - 40,
              background: 'white',
              padding: '8px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              zIndex: 10
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addText()}
              autoFocus
              placeholder="输入文字..."
              style={{
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
                marginBottom: '6px'
              }}
            />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowTextDialog(false); setTextInput('') }}
                style={{
                  padding: '4px 10px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                取消
              </button>
              <button
                onClick={addText}
                style={{
                  padding: '4px 10px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                添加
              </button>
            </div>
          </div>
        )}

        {/* 帮助提示 */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#6b7280',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div>💡 提示:</div>
          <div>• 加入相同房间ID可实时协作</div>
          <div>• 使用"文字"工具点击画布添加文本</div>
          <div>• 支持撤销/重做/清空/导出</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default CollaborativeWhiteboardEnhanced
