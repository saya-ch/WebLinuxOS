import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { DownloadIcon, TrashIcon, UsersIcon, ShareIcon, TypeIcon, SquareIcon } from '../icons'

// 自定义图标组件
const PencilIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
const EraserIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
const CircleIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/></svg>
const UndoIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
const RedoIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
const ZoomInIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
const ZoomOutIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>
const HandIcon = ({ size = 18 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>

interface DrawAction {
  type: 'pen' | 'eraser' | 'rect' | 'circle' | 'text' | 'line'
  points?: { x: number; y: number }[]
  color?: string
  size?: number
  text?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

interface WhiteboardState {
  actions: DrawAction[]
  currentAction: DrawAction | null
  tool: 'pen' | 'eraser' | 'rect' | 'circle' | 'text' | 'line' | 'hand'
  color: string
  size: number
  zoom: number
  panX: number
  panY: number
}

const COLORS = [
  '#ffffff', '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff',
  '#ff8844', '#88ff44', '#44ff88', '#8844ff', '#4488ff',
  '#1a1a2e', '#16213e', '#0f3460', '#7c6cf0', '#00d6c1'
]

const RealTimeCollaborativeWhiteboard = memo(function RealTimeCollaborativeWhiteboard() {
  const [state, setState] = useState<WhiteboardState>({
    actions: [],
    currentAction: null,
    tool: 'pen',
    color: '#7c6cf0',
    size: 3,
    zoom: 1,
    panX: 0,
    panY: 0
  })
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<DrawAction[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showTextTool, setShowTextTool] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [textInput, setTextInput] = useState('')
  const [showUsers, setShowUsers] = useState(false)
  const [collaborators] = useState([
    { id: 1, name: '用户A', color: '#ff4444', active: true },
    { id: 2, name: '用户B', color: '#44ff44', active: false },
    { id: 3, name: '用户C', color: '#4444ff', active: true },
  ])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  
  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctxRef.current = ctx
    
    // 设置画布大小
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    
    // 设置背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(124, 108, 240, 0.1)'
    ctx.lineWidth = 1
    const gridSize = 20
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }, [])
  
  // 重绘所有操作
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    // 清空并重绘背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(124, 108, 240, 0.1)'
    ctx.lineWidth = 1
    const gridSize = 20
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    // 应用缩放和平移
    ctx.save()
    ctx.translate(state.panX, state.panY)
    ctx.scale(state.zoom, state.zoom)
    
    // 绘制所有已保存的操作
    state.actions.forEach(action => {
      drawAction(ctx, action)
    })
    
    // 绘制当前操作
    if (state.currentAction) {
      drawAction(ctx, state.currentAction)
    }
    
    ctx.restore()
  }, [state.actions, state.currentAction, state.zoom, state.panX, state.panY])
  
  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.color || '#7c6cf0'
    ctx.fillStyle = action.color || '#7c6cf0'
    ctx.lineWidth = action.size || 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    switch (action.type) {
      case 'pen':
        if (action.points && action.points.length > 0) {
          ctx.beginPath()
          ctx.moveTo(action.points[0].x, action.points[0].y)
          action.points.forEach(point => {
            ctx.lineTo(point.x, point.y)
          })
          ctx.stroke()
        }
        break
      
      case 'eraser':
        if (action.points && action.points.length > 0) {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.beginPath()
          ctx.moveTo(action.points[0].x, action.points[0].y)
          action.points.forEach(point => {
            ctx.lineTo(point.x, point.y)
          })
          ctx.stroke()
          ctx.globalCompositeOperation = 'source-over'
        }
        break
      
      case 'rect':
        if (action.x !== undefined && action.y !== undefined && action.width && action.height) {
          ctx.strokeRect(action.x, action.y, action.width, action.height)
        }
        break
      
      case 'circle':
        if (action.x !== undefined && action.y !== undefined && action.width) {
          ctx.beginPath()
          ctx.arc(action.x, action.y, action.width / 2, 0, Math.PI * 2)
          ctx.stroke()
        }
        break
      
      case 'line':
        if (action.points && action.points.length >= 2) {
          ctx.beginPath()
          ctx.moveTo(action.points[0].x, action.points[0].y)
          ctx.lineTo(action.points[1].x, action.points[1].y)
          ctx.stroke()
        }
        break
      
      case 'text':
        if (action.text && action.x !== undefined && action.y !== undefined) {
          ctx.font = `${action.size || 16}px sans-serif`
          ctx.fillText(action.text, action.x, action.y)
        }
        break
    }
  }
  
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])
  
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - state.panX) / state.zoom,
      y: (e.clientY - rect.top - state.panY) / state.zoom
    }
  }
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e)
    
    if (state.tool === 'text') {
      setTextPosition(coords)
      setShowTextTool(true)
      return
    }
    
    if (state.tool === 'hand') {
      setIsDrawing(true)
      return
    }
    
    setIsDrawing(true)
    
    let newAction: DrawAction = {
      type: state.tool,
      color: state.color,
      size: state.size
    }
    
    if (state.tool === 'pen' || state.tool === 'eraser') {
      newAction.points = [coords]
    } else if (state.tool === 'line') {
      newAction.points = [coords]
    } else if (state.tool === 'rect' || state.tool === 'circle') {
      newAction.x = coords.x
      newAction.y = coords.y
      newAction.width = 0
      newAction.height = 0
    }
    
    setState(prev => ({ ...prev, currentAction: newAction }))
  }
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const coords = getCanvasCoords(e)
    
    if (state.tool === 'hand') {
      setState(prev => ({
        ...prev,
        panX: prev.panX + e.movementX,
        panY: prev.panY + e.movementY
      }))
      return
    }
    
    setState(prev => {
      if (!prev.currentAction) return prev
      
      const updated = { ...prev.currentAction }
      
      if (updated.type === 'pen' || updated.type === 'eraser') {
        updated.points = [...(updated.points || []), coords]
      } else if (updated.type === 'line') {
        updated.points = [updated.points?.[0] || coords, coords]
      } else if (updated.type === 'rect') {
        updated.width = coords.x - (updated.x || 0)
        updated.height = coords.y - (updated.y || 0)
      } else if (updated.type === 'circle') {
        updated.width = Math.abs(coords.x - (updated.x || 0)) * 2
      }
      
      return { ...prev, currentAction: updated }
    })
  }
  
  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    if (state.tool === 'hand') return
    
    setState(prev => {
      if (!prev.currentAction) return prev
      
      const newActions = [...prev.actions, prev.currentAction]
      
      // 保存到历史
      setHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), prev.actions])
      setHistoryIndex(prevIndex => prevIndex + 1)
      
      return {
        ...prev,
        actions: newActions,
        currentAction: null
      }
    })
  }
  
  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setShowTextTool(false)
      return
    }
    
    const newAction: DrawAction = {
      type: 'text',
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      color: state.color,
      size: state.size * 5
    }
    
    setState(prev => {
      const newActions = [...prev.actions, newAction]
      setHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), prev.actions])
      setHistoryIndex(prevIndex => prevIndex + 1)
      return { ...prev, actions: newActions }
    })
    
    setTextInput('')
    setShowTextTool(false)
  }
  
  const undo = () => {
    if (historyIndex < 0) return
    setState(prev => ({
      ...prev,
      actions: history[historyIndex] || []
    }))
    setHistoryIndex(prev => prev - 1)
  }
  
  const redo = () => {
    if (historyIndex >= history.length - 1) return
    setHistoryIndex(prev => prev + 1)
    setState(prev => ({
      ...prev,
      actions: history[historyIndex + 1] || []
    }))
  }
  
  const clearCanvas = () => {
    if (window.confirm('确定要清空画布吗？此操作不可撤销。')) {
      setHistory(prev => [...prev, state.actions])
      setHistoryIndex(prev => prev + 1)
      setState(prev => ({ ...prev, actions: [] }))
    }
  }
  
  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  
  const zoomIn = () => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }))
  }
  
  const zoomOut = () => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.2) }))
  }
  
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--titlebar-bg)',
        borderBottom: '1px solid var(--window-border)',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* 工具选择 */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--taskbar-button-bg)', padding: '4px', borderRadius: '8px' }}>
          {[
            { id: 'pen', icon: <PencilIcon size={18} />, title: '画笔' },
            { id: 'eraser', icon: <EraserIcon size={18} />, title: '橡皮擦' },
            { id: 'rect', icon: <SquareIcon size={18} />, title: '矩形' },
            { id: 'circle', icon: <CircleIcon size={18} />, title: '圆形' },
            { id: 'line', icon: <div style={{ width: 18, height: 2, background: 'currentColor' }} />, title: '直线' },
            { id: 'text', icon: <TypeIcon size={18} />, title: '文字' },
            { id: 'hand', icon: <HandIcon size={18} />, title: '移动' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setState(prev => ({ ...prev, tool: tool.id as any }))}
              title={tool.title}
              style={{
                background: state.tool === tool.id ? 'var(--accent-bg)' : 'transparent',
                border: 'none',
                color: state.tool === tool.id ? 'var(--accent)' : 'var(--text-primary)',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
            >
              {tool.icon}
            </button>
          ))}
        </div>
        
        {/* 分隔线 */}
        <div style={{ width: 1, height: 24, background: 'var(--window-border)' }} />
        
        {/* 颜色选择 */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {COLORS.slice(0, 8).map(color => (
            <button
              key={color}
              onClick={() => setState(prev => ({ ...prev, color }))}
              style={{
                width: 20,
                height: 20,
                background: color,
                border: state.color === color ? '2px solid white' : '1px solid var(--window-border)',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                transform: state.color === color ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          ))}
        </div>
        
        {/* 分隔线 */}
        <div style={{ width: 1, height: 24, background: 'var(--window-border)' }} />
        
        {/* 大小选择 */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>大小:</span>
          {[1, 3, 5, 10, 20].map(size => (
            <button
              key={size}
              onClick={() => setState(prev => ({ ...prev, size }))}
              style={{
                width: 24 + size * 2,
                height: 24 + size * 2,
                background: state.size === size ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                transform: state.size === size ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          ))}
        </div>
        
        <div style={{ flex: 1 }} />
        
        {/* 缩放控制 */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={zoomOut}
            style={{
              background: 'var(--taskbar-button-bg)',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <ZoomOutIcon size={18} />
          </button>
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(state.zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            style={{
              background: 'var(--taskbar-button-bg)',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <ZoomInIcon size={18} />
          </button>
        </div>
        
        {/* 分隔线 */}
        <div style={{ width: 1, height: 24, background: 'var(--window-border)' }} />
        
        {/* 撤销/重做 */}
        <button
          onClick={undo}
          disabled={historyIndex < 0}
          style={{
            background: 'transparent',
            border: 'none',
            color: historyIndex < 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
            padding: '6px',
            borderRadius: '6px',
            cursor: historyIndex < 0 ? 'not-allowed' : 'pointer',
            opacity: historyIndex < 0 ? 0.5 : 1
          }}
        >
          <UndoIcon size={18} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          style={{
            background: 'transparent',
            border: 'none',
            color: historyIndex >= history.length - 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
            padding: '6px',
            borderRadius: '6px',
            cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
            opacity: historyIndex >= history.length - 1 ? 0.5 : 1
          }}
        >
          <RedoIcon size={18} />
        </button>
        
        {/* 分隔线 */}
        <div style={{ width: 1, height: 24, background: 'var(--window-border)' }} />
        
        {/* 协作用户 */}
        <button
          onClick={() => setShowUsers(!showUsers)}
          style={{
            background: showUsers ? 'var(--accent-bg)' : 'var(--taskbar-button-bg)',
            border: 'none',
            color: 'var(--text-primary)',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <UsersIcon size={18} />
          <span style={{ fontSize: '13px' }}>{collaborators.length}</span>
        </button>
        
        {/* 清空 */}
        <button
          onClick={clearCanvas}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-error)',
            padding: '6px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <TrashIcon size={18} />
        </button>
        
        {/* 导出 */}
        <button
          onClick={exportImage}
          style={{
            background: 'var(--accent-gradient)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500
          }}
        >
          <DownloadIcon size={16} />
          导出
        </button>
      </div>
      
      {/* 主内容区 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: '100%',
            height: '100%',
            cursor: state.tool === 'hand' ? 'grab' : state.tool === 'text' ? 'text' : 'crosshair'
          }}
        />
        
        {/* 文字输入框 */}
        {showTextTool && (
          <div
            style={{
              position: 'absolute',
              left: textPosition.x * state.zoom + state.panX,
              top: textPosition.y * state.zoom + state.panY,
              zIndex: 100
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit()
                if (e.key === 'Escape') setShowTextTool(false)
              }}
              autoFocus
              placeholder="输入文字..."
              style={{
                background: 'var(--titlebar-bg)',
                border: '2px solid var(--accent)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                minWidth: '150px'
              }}
            />
          </div>
        )}
        
        {/* 协作用户面板 */}
        {showUsers && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'var(--titlebar-bg)',
            border: '1px solid var(--window-border)',
            borderRadius: '12px',
            padding: '12px',
            minWidth: '200px',
            boxShadow: 'var(--shadow-strong)'
          }}>
            <div style={{ 
              fontWeight: 500, 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <UsersIcon size={18} />
              在线协作者
            </div>
            {collaborators.map(user => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: user.active ? 'var(--accent-bg)' : 'transparent',
                  marginBottom: '4px'
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: user.color
                }} />
                <span style={{ fontSize: '13px' }}>{user.name}</span>
                {user.active && (
                  <span style={{ 
                    fontSize: '11px', 
                    color: 'var(--color-success)',
                    marginLeft: 'auto'
                  }}>
                    活跃
                  </span>
                )}
              </div>
            ))}
            <button
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'var(--accent-bg)',
                border: 'none',
                color: 'var(--accent)',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              <ShareIcon size={16} style={{ marginRight: '6px' }} />
              邀请协作
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default RealTimeCollaborativeWhiteboard