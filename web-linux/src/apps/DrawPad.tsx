import { useState, useRef, useCallback, useEffect } from 'react'

// ========== 常量 ==========
const CANVAS_W = 960
const CANVAS_H = 600

const PRESET_COLORS = [
  '#000000', '#ffffff', '#e94560', '#f5c542', '#4ecca3', '#0f3460',
  '#7b68ee', '#ff6b6b', '#48dbfb', '#ff9ff3', '#fc5c65', '#fed330',
  '#26de81', '#2bcbba', '#45aaf2', '#4b7bec', '#a55eea', '#778ca3',
  '#2d3436', '#636e72', '#dfe6e9', '#b2bec3', '#d63031', '#e17055',
]

type ToolType = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'triangle' | 'text' | 'fill'

interface DrawAction {
  type: ToolType
  points: { x: number; y: number }[]
  color: string
  size: number
  text?: string
  fontSize?: number
}

// ========== 图层类型 ==========
interface Layer {
  id: string
  name: string
  visible: boolean
  actions: DrawAction[]
}

// ========== 样式常量 ==========
const S = {
  bg: 'var(--window-bg, #1e1e1e)',
  surface: '#2d2d2d',
  surfaceAlt: '#252526',
  border: '#444',
  text: 'var(--text-primary, #d4d4d4)',
  textDim: '#888',
  accent: 'var(--accent, #007acc)',
  accentHover: '#1a8ad4',
  danger: '#e94560',
  canvasBg: '#3a3a3a',
}

const btnBase: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  color: S.text,
  cursor: 'pointer',
  padding: '5px 8px',
  borderRadius: 4,
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  transition: 'background 0.15s',
  whiteSpace: 'nowrap' as const,
}

// ========== 主组件 ==========
export default function DrawPad() {
  // 画布引用：背景层 + 绘制层
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)

  // 工具状态
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [fontSize, setFontSize] = useState(20)

  // 绘制状态
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempAction, setTempAction] = useState<DrawAction | null>(null)

  // 图层系统
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'bg', name: '背景层', visible: true, actions: [] },
    { id: 'draw', name: '绘制层', visible: true, actions: [] },
  ])
  const [activeLayerId, setActiveLayerId] = useState('draw')

  // 撤销/重做
  const [undoStack, setUndoStack] = useState<DrawAction[]>([])
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff')

  // 文字工具
  const [textMode, setTextMode] = useState<'idle' | 'placing' | 'editing'>('idle')
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)

  // 快照用于形状预览
  const snapshotRef = useRef<ImageData | null>(null)

  // ========== 初始化画布 ==========
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    const tempCanvas = tempCanvasRef.current
    if (!bgCanvas || !drawCanvas || !tempCanvas) return
    const bgCtx = bgCanvas.getContext('2d')
    const drawCtx = drawCanvas.getContext('2d')
    const tempCtx = tempCanvas.getContext('2d')
    if (!bgCtx || !drawCtx || !tempCtx) return

    bgCtx.fillStyle = canvasBgColor
    bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    tempCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  }, [])

  // ========== 获取画布坐标 ==========
  const getCoords = useCallback((e: React.MouseEvent) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  // ========== 绘制单个 Action ==========
  const drawAction = useCallback((ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.save()
    ctx.strokeStyle = action.type === 'eraser' ? '#ffffff' : action.color
    ctx.fillStyle = action.type === 'eraser' ? '#ffffff' : action.color
    ctx.lineWidth = action.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (action.type) {
      case 'pen':
      case 'eraser': {
        if (action.points.length === 0) break
        if (action.points.length === 1) {
          ctx.beginPath()
          ctx.arc(action.points[0].x, action.points[0].y, action.size / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        ctx.beginPath()
        ctx.moveTo(action.points[0].x, action.points[0].y)
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y)
        }
        ctx.stroke()
        break
      }
      case 'line': {
        if (action.points.length >= 2) {
          ctx.beginPath()
          ctx.moveTo(action.points[0].x, action.points[0].y)
          ctx.lineTo(action.points[1].x, action.points[1].y)
          ctx.stroke()
        }
        break
      }
      case 'rect': {
        if (action.points.length >= 2) {
          const [p1, p2] = action.points
          ctx.strokeRect(
            Math.min(p1.x, p2.x), Math.min(p1.y, p2.y),
            Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)
          )
        }
        break
      }
      case 'circle': {
        if (action.points.length >= 2) {
          const [p1, p2] = action.points
          const rx = Math.abs(p2.x - p1.x) / 2
          const ry = Math.abs(p2.y - p1.y) / 2
          const cx = Math.min(p1.x, p2.x) + rx
          const cy = Math.min(p1.y, p2.y) + ry
          ctx.beginPath()
          ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        break
      }
      case 'triangle': {
        if (action.points.length >= 2) {
          const [p1, p2] = action.points
          const topX = (p1.x + p2.x) / 2
          const topY = Math.min(p1.y, p2.y)
          const bottomY = Math.max(p1.y, p2.y)
          const leftX = Math.min(p1.x, p2.x)
          const rightX = Math.max(p1.x, p2.x)
          ctx.beginPath()
          ctx.moveTo(topX, topY)
          ctx.lineTo(rightX, bottomY)
          ctx.lineTo(leftX, bottomY)
          ctx.closePath()
          ctx.stroke()
        }
        break
      }
      case 'text': {
        if (action.text && action.points.length >= 1) {
          ctx.font = `${action.fontSize || 20}px sans-serif`
          ctx.textBaseline = 'top'
          ctx.fillText(action.text, action.points[0].x, action.points[0].y)
        }
        break
      }
      case 'fill': {
        ctx.fillStyle = action.color
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        break
      }
    }
    ctx.restore()
  }, [])

  // ========== 重绘绘制层 ==========
  const redrawDrawLayer = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    const drawLayer = layers.find(l => l.id === 'draw')
    if (drawLayer && drawLayer.visible) {
      for (const action of drawLayer.actions) {
        drawAction(ctx, action)
      }
    }
  }, [layers, drawAction])

  // ========== 保存快照（用于形状预览） ==========
  const saveSnapshot = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
  }, [])

  // ========== 鼠标事件 ==========
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = getCoords(e)

    // 填充工具
    if (tool === 'fill') {
      const action: DrawAction = { type: 'fill', points: [], color, size: 0 }
      setLayers(prev => prev.map(l =>
        l.id === activeLayerId
          ? { ...l, actions: [...l.actions, action] }
          : l
      ))
      setUndoStack([])
      // 更新背景色
      if (activeLayerId === 'bg') {
        setCanvasBgColor(color)
        const bgCanvas = bgCanvasRef.current
        if (bgCanvas) {
          const bgCtx = bgCanvas.getContext('2d')
          if (bgCtx) {
            bgCtx.fillStyle = color
            bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)
          }
        }
      } else {
        const canvas = drawCanvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) drawAction(ctx, action)
        }
      }
      return
    }

    // 文字工具
    if (tool === 'text') {
      setTextPos(point)
      setTextMode('editing')
      setTextInput('')
      setTimeout(() => textInputRef.current?.focus(), 50)
      return
    }

    setIsDrawing(true)
    saveSnapshot()

    const newAction: DrawAction = {
      type: tool === 'eraser' ? 'eraser' : tool,
      points: [point],
      color,
      size: tool === 'eraser' ? brushSize * 3 : brushSize,
      fontSize,
    }

    if (tool === 'pen' || tool === 'eraser') {
      setLayers(prev => prev.map(l =>
        l.id === activeLayerId
          ? { ...l, actions: [...l.actions, newAction] }
          : l
      ))
      setUndoStack([])
    } else {
      setTempAction(newAction)
    }
  }, [tool, color, brushSize, fontSize, activeLayerId, getCoords, saveSnapshot, drawAction])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return
    const point = getCoords(e)

    if (tool === 'pen' || tool === 'eraser') {
      const canvas = drawCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      setLayers(prev => prev.map(l => {
        if (l.id !== activeLayerId) return l
        const updated = [...l.actions]
        const last = updated[updated.length - 1]
        if (!last) return l
        const prevPoint = last.points[last.points.length - 1]
        updated[updated.length - 1] = { ...last, points: [...last.points, point] }

        // 即时绘制线段
        ctx.save()
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(prevPoint.x, prevPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
        ctx.restore()

        return { ...l, actions: updated }
      }))
    } else if (tempAction) {
      const updatedTemp = { ...tempAction, points: [tempAction.points[0], point] }
      setTempAction(updatedTemp)
      // 在临时画布上预览
      const tempCanvas = tempCanvasRef.current
      if (!tempCanvas) return
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      tempCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      drawAction(tempCtx, updatedTemp)
    }
  }, [isDrawing, tool, color, brushSize, tempAction, activeLayerId, getCoords, drawAction])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (tempAction && tempAction.points.length >= 2) {
      const finalAction = { ...tempAction, points: [...tempAction.points] }
      setLayers(prev => prev.map(l =>
        l.id === activeLayerId
          ? { ...l, actions: [...l.actions, finalAction] }
          : l
      ))
      setUndoStack([])

      // 在绘制层画上最终形状
      const canvas = drawCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) drawAction(ctx, finalAction)
      }
    }
    setTempAction(null)

    // 清除临时画布
    const tempCanvas = tempCanvasRef.current
    if (tempCanvas) {
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) tempCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    }
  }, [isDrawing, tempAction, activeLayerId, drawAction])

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) handleMouseUp()
  }, [isDrawing, handleMouseUp])

  // ========== 文字确认 ==========
  const confirmText = useCallback(() => {
    if (textPos && textInput.trim()) {
      const action: DrawAction = {
        type: 'text',
        points: [textPos],
        color,
        size: brushSize,
        text: textInput.trim(),
        fontSize,
      }
      setLayers(prev => prev.map(l =>
        l.id === activeLayerId
          ? { ...l, actions: [...l.actions, action] }
          : l
      ))
      setUndoStack([])
      // 绘制到画布
      const canvas = drawCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) drawAction(ctx, action)
      }
    }
    setTextMode('idle')
    setTextPos(null)
    setTextInput('')
  }, [textPos, textInput, color, brushSize, fontSize, activeLayerId, drawAction])

  // ========== 撤销/重做 ==========
  const handleUndo = useCallback(() => {
    const layer = layers.find(l => l.id === activeLayerId)
    if (!layer || layer.actions.length === 0) return
    const lastAction = layer.actions[layer.actions.length - 1]
    setUndoStack(prev => [...prev, lastAction])
    setLayers(prev => prev.map(l =>
      l.id === activeLayerId
        ? { ...l, actions: l.actions.slice(0, -1) }
        : l
    ))
  }, [layers, activeLayerId])

  const handleRedo = useCallback(() => {
    if (undoStack.length === 0) return
    const lastUndo = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setLayers(prev => prev.map(l =>
      l.id === activeLayerId
        ? { ...l, actions: [...l.actions, lastUndo] }
        : l
    ))
  }, [undoStack, activeLayerId])

  // 图层变更后重绘
  useEffect(() => {
    redrawDrawLayer()
  }, [layers, redrawDrawLayer])

  // ========== 清除画布 ==========
  const clearCanvas = useCallback(() => {
    setLayers(prev => prev.map(l => ({ ...l, actions: [] })))
    setUndoStack([])
    setCanvasBgColor('#ffffff')
    const bgCanvas = bgCanvasRef.current
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d')
      if (bgCtx) {
        bgCtx.fillStyle = '#ffffff'
        bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      }
    }
    const drawCanvas = drawCanvasRef.current
    if (drawCanvas) {
      const drawCtx = drawCanvas.getContext('2d')
      if (drawCtx) drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    }
  }, [])

  // ========== 导出图片 ==========
  const exportImage = useCallback(() => {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = CANVAS_W
    exportCanvas.height = CANVAS_H
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // 绘制背景层
    const bgCanvas = bgCanvasRef.current
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0)

    // 绘制各可见层
    for (const layer of layers) {
      if (!layer.visible || layer.id === 'bg') continue
      for (const action of layer.actions) {
        drawAction(ctx, action)
      }
    }

    const dataUrl = exportCanvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'drawpad-export.png'
    link.href = dataUrl
    link.click()
  }, [layers, drawAction])

  // ========== 图层可见性切换 ==========
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ))
  }, [])

  // ========== 键盘快捷键 ==========
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); handleUndo() }
        if (e.key === 'y') { e.preventDefault(); handleRedo() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  // ========== 工具列表 ==========
  const tools: { id: ToolType; label: string; icon: string }[] = [
    { id: 'pen', label: '画笔', icon: '✏️' },
    { id: 'eraser', label: '橡皮擦', icon: '🧹' },
    { id: 'line', label: '直线', icon: '📏' },
    { id: 'rect', label: '矩形', icon: '⬜' },
    { id: 'circle', label: '圆形', icon: '⭕' },
    { id: 'triangle', label: '三角形', icon: '🔺' },
    { id: 'text', label: '文字', icon: '🔤' },
    { id: 'fill', label: '填充', icon: '🎨' },
  ]

  const activeLayer = layers.find(l => l.id === activeLayerId)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: S.bg, color: S.text, fontFamily: 'system-ui, sans-serif',
      userSelect: 'none',
    }}>
      {/* ===== 顶部工具栏 ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px',
        background: S.surface, borderBottom: `1px solid ${S.border}`, flexWrap: 'wrap',
      }}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setTextMode('idle') }}
            style={{
              ...btnBase,
              background: tool === t.id ? S.accent : 'transparent',
              borderColor: tool === t.id ? S.accent : 'transparent',
              color: tool === t.id ? '#fff' : S.text,
            }}
            title={t.label}
          >
            <span>{t.icon}</span>
            <span style={{ fontSize: 11 }}>{t.label}</span>
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: '#555', margin: '0 4px' }} />

        {/* 画笔大小 */}
        <span style={{ fontSize: 11, color: S.textDim, marginRight: 4 }}>粗细</span>
        <input
          type="range" min={1} max={30} value={brushSize}
          onChange={e => setBrushSize(parseInt(e.target.value))}
          style={{ width: 60, accentColor: '#007acc', height: 3 }}
        />
        <span style={{ fontSize: 11, color: '#fff', minWidth: 28 }}>{brushSize}px</span>

        {/* 文字大小（仅文字工具时显示） */}
        {tool === 'text' && (
          <>
            <div style={{ width: 1, height: 24, background: '#555', margin: '0 4px' }} />
            <span style={{ fontSize: 11, color: S.textDim, marginRight: 4 }}>字号</span>
            <input
              type="range" min={10} max={72} value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value))}
              style={{ width: 50, accentColor: '#007acc', height: 3 }}
            />
            <span style={{ fontSize: 11, color: '#fff', minWidth: 28 }}>{fontSize}px</span>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* 操作按钮 */}
        <button onClick={handleUndo} style={btnBase} title="撤销 (Ctrl+Z)">↩ 撤销</button>
        <button onClick={handleRedo} style={btnBase} title="重做 (Ctrl+Y)">↪ 重做</button>
        <button onClick={clearCanvas} style={{ ...btnBase, color: S.danger }} title="清除画布">🗑 清除</button>
        <button onClick={exportImage} style={{ ...btnBase, background: '#007acc', color: '#fff', borderRadius: 4 }} title="导出PNG">💾 导出</button>
      </div>

      {/* ===== 主体区域 ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧面板：图层面板 */}
        <div style={{
          width: 140, background: S.surfaceAlt, borderRight: `1px solid ${S.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${S.border}`, color: S.textDim }}>
            图层
          </div>
          {layers.map(layer => (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              style={{
                padding: '8px 10px', cursor: 'pointer', fontSize: 12,
                background: activeLayerId === layer.id ? 'rgba(0,122,204,0.2)' : 'transparent',
                borderLeft: activeLayerId === layer.id ? '3px solid #007acc' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
            >
              <button
                onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id) }}
                style={{
                  background: 'none', border: 'none', color: layer.visible ? '#4ecca3' : '#555',
                  cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
                }}
                title={layer.visible ? '隐藏图层' : '显示图层'}
              >
                {layer.visible ? '👁' : '🚫'}
              </button>
              <span style={{ color: activeLayerId === layer.id ? '#fff' : S.textDim, flex: 1 }}>
                {layer.name}
              </span>
              <span style={{ fontSize: 10, color: '#555' }}>
                {layer.actions.length}
              </span>
            </div>
          ))}

          {/* 当前图层信息 */}
          <div style={{ marginTop: 'auto', padding: 10, borderTop: `1px solid ${S.border}`, fontSize: 10, color: '#666' }}>
            <div>当前: {activeLayer?.name}</div>
            <div>操作数: {activeLayer?.actions.length}</div>
            <div>撤销栈: {undoStack.length}</div>
          </div>
        </div>

        {/* 画布区域 */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: S.canvasBg, padding: 12, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
            {/* 背景层画布 */}
            <canvas
              ref={bgCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                display: 'block',
              }}
            />
            {/* 绘制层画布 */}
            <canvas
              ref={drawCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                display: 'block',
              }}
            />
            {/* 临时预览画布（形状拖拽预览） */}
            <canvas
              ref={tempCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                display: 'block', pointerEvents: 'none',
              }}
            />
            {/* 交互画布（捕获所有鼠标事件） */}
            <canvas
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                position: 'relative', display: 'block',
                width: '100%', height: 'auto',
                cursor: tool === 'text' ? 'text' : tool === 'fill' ? 'crosshair' : 'crosshair',
                maxWidth: '100%', maxHeight: '100%',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />

            {/* 文字输入框 */}
            {textMode === 'editing' && textPos && (
              <div style={{
                position: 'absolute',
                left: `${(textPos.x / CANVAS_W) * 100}%`,
                top: `${(textPos.y / CANVAS_H) * 100}%`,
                zIndex: 100,
              }}>
                <input
                  ref={textInputRef}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmText()
                    if (e.key === 'Escape') { setTextMode('idle'); setTextPos(null); setTextInput('') }
                  }}
                  onBlur={confirmText}
                  placeholder="输入文字..."
                  style={{
                    fontSize: Math.max(fontSize * 0.6, 12),
                    background: 'rgba(0,0,0,0.8)',
                    color: color,
                    border: `1px solid ${color}`,
                    borderRadius: 3,
                    padding: '3px 6px',
                    outline: 'none',
                    minWidth: 120,
                    fontFamily: 'sans-serif',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 底部颜色面板 ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3, padding: '6px 10px',
        background: S.surface, borderTop: `1px solid ${S.border}`, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: S.textDim, marginRight: 4 }}>颜色:</span>
        {PRESET_COLORS.map(c => (
          <div
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 20, height: 20, borderRadius: 3, cursor: 'pointer', background: c,
              border: color === c ? '2px solid #fff' : '1px solid #555',
              boxShadow: color === c ? '0 0 4px rgba(255,255,255,0.5)' : 'none',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.2)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
          />
        ))}
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 6px' }} />
        {/* 自定义颜色 */}
        <input
          type="color" value={color}
          onChange={e => setColor(e.target.value)}
          style={{
            width: 28, height: 24, border: '1px solid #555', borderRadius: 3,
            cursor: 'pointer', padding: 0, background: 'transparent',
          }}
          title="自定义颜色"
        />
        {/* 当前颜色预览 */}
        <div style={{
          width: 32, height: 24, borderRadius: 4, background: color,
          border: '1px solid #666', marginLeft: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}>
          {color.toUpperCase().slice(0, 7)}
        </div>

        <div style={{ flex: 1 }} />

        {/* 状态栏 */}
        <span style={{ fontSize: 10, color: S.textDim }}>
          工具: {tools.find(t => t.id === tool)?.label} | 图层: {activeLayer?.name}
        </span>
      </div>
    </div>
  )
}
