import { useState, useRef, useEffect, useCallback } from 'react'

type Tool = 'select' | 'arrow' | 'rect' | 'text'

interface Annotation {
  type: Tool
  x1: number
  y1: number
  x2: number
  y2: number
  text?: string
  color: string
}

export default function Screenshot() {
  const [mode, setMode] = useState<'idle' | 'selecting' | 'captured'>('idle')
  const [tool, setTool] = useState<Tool>('select')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null)
  const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null)
  const [selectEnd, setSelectEnd] = useState<{ x: number; y: number } | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [annotationColor, setAnnotationColor] = useState('#f38ba8')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const drawSampleContent = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1e1e2e')
    grad.addColorStop(0.5, '#313244')
    grad.addColorStop(1, '#1e1e2e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#181825'
    ctx.fillRect(20, 20, w - 40, 40)
    ctx.fillStyle = '#cdd6f4'
    ctx.font = '16px sans-serif'
    ctx.fillText('🌐 Web Linux Desktop', 30, 47)
    ctx.fillStyle = '#45475a'
    ctx.fillRect(20, 70, w - 40, 1)

    ctx.fillStyle = '#181825'
    const cardW = (w - 60) / 3
    for (let i = 0; i < 3; i++) {
      const cx = 20 + i * (cardW + 10)
      ctx.fillStyle = '#181825'
      ctx.beginPath()
      ctx.roundRect(cx, 85, cardW, 120, 8)
      ctx.fill()
      ctx.fillStyle = ['#f38ba8', '#89b4fa', '#a6e3a1'][i]
      ctx.fillRect(cx + 10, 95, cardW - 20, 50)
      ctx.fillStyle = '#cdd6f4'
      ctx.font = '12px sans-serif'
      ctx.fillText(['系统监控', '文件管理', '终端'][i], cx + 10, 165)
      ctx.fillStyle = '#6c7086'
      ctx.font = '10px sans-serif'
      ctx.fillText(['CPU: 45% | MEM: 62%', '文件数: 1,234', 'bash ~ $'][i], cx + 10, 185)
    }

    ctx.fillStyle = '#181825'
    ctx.beginPath()
    ctx.roundRect(20, 220, w - 40, h - 260, 8)
    ctx.fill()

    const barGrad = ctx.createLinearGradient(30, 0, w - 30, 0)
    barGrad.addColorStop(0, '#f38ba8')
    barGrad.addColorStop(0.3, '#89b4fa')
    barGrad.addColorStop(0.6, '#a6e3a1')
    barGrad.addColorStop(1, '#f9e2af')
    ctx.fillStyle = barGrad
    ctx.fillRect(30, 240, w - 60, 20)

    ctx.fillStyle = '#45475a'
    ctx.font = '11px sans-serif'
    for (let i = 0; i < 5; i++) {
      const y = 280 + i * 30
      ctx.fillRect(30, y, w - 60, 1)
      ctx.fillStyle = '#cdd6f4'
      ctx.fillText(`数据行 ${i + 1}: 示例内容 ${'█'.repeat(Math.floor(Math.random() * 20 + 5))}`, 30, y - 8)
      ctx.fillStyle = '#45475a'
    }

    ctx.fillStyle = '#181825'
    ctx.fillRect(0, h - 30, w, 30)
    ctx.fillStyle = '#6c7086'
    ctx.font = '11px sans-serif'
    ctx.fillText('📋 任务栏  |  📁 文件  🌐 浏览器  📧 邮件  ⚙️ 设置', 10, h - 10)
  }, [])

  useEffect(() => {
    drawSampleContent()
  }, [drawSampleContent])

  const captureFull = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setCapturedImage(canvas.toDataURL('image/png'))
    setMode('captured')
    setAnnotations([])
    setCurrentAnnotation(null)
  }

  const startSelect = () => {
    setMode('selecting')
    setSelectStart(null)
    setSelectEnd(null)
    setSelecting(false)
  }

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (mode === 'selecting') {
      setSelectStart({ x, y })
      setSelectEnd({ x, y })
      setSelecting(true)
      return
    }

    if (mode === 'captured' && (tool === 'arrow' || tool === 'rect')) {
      setIsDrawing(true)
      setCurrentAnnotation({ type: tool, x1: x, y1: y, x2: x, y2: y, color: annotationColor })
    }

    if (mode === 'captured' && tool === 'text') {
      setTextPos({ x, y })
      setTextInput('')
    }
  }

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (selecting && mode === 'selecting') {
      setSelectEnd({ x, y })
      return
    }

    if (isDrawing && currentAnnotation) {
      setCurrentAnnotation({ ...currentAnnotation, x2: x, y2: y })
    }
  }

  const handleContainerMouseUp = () => {
    if (selecting && selectStart && selectEnd && mode === 'selecting') {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const sx = Math.min(selectStart.x, selectEnd.x) * dpr
      const sy = Math.min(selectStart.y, selectEnd.y) * dpr
      const sw = Math.abs(selectEnd.x - selectStart.x) * dpr
      const sh = Math.abs(selectEnd.y - selectStart.y) * dpr

      if (sw > 10 && sh > 10) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = sw
        tempCanvas.height = sh
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
          setCapturedImage(tempCanvas.toDataURL('image/png'))
          setMode('captured')
          setAnnotations([])
        }
      }
      setSelecting(false)
      return
    }

    if (isDrawing && currentAnnotation) {
      setAnnotations(prev => [...prev, currentAnnotation])
      setCurrentAnnotation(null)
      setIsDrawing(false)
    }
  }

  const addTextAnnotation = () => {
    if (!textPos || !textInput.trim()) return
    setAnnotations(prev => [...prev, {
      type: 'text',
      x1: textPos.x, y1: textPos.y,
      x2: textPos.x, y2: textPos.y,
      text: textInput,
      color: annotationColor,
    }])
    setTextPos(null)
    setTextInput('')
  }

  const saveScreenshot = () => {
    if (!capturedImage) return
    const a = document.createElement('a')
    a.href = capturedImage
    a.download = `screenshot_${Date.now()}.png`
    a.click()
  }

  const saveWithAnnotations = () => {
    const canvas = canvasRef.current
    if (!canvas || !capturedImage) return

    const tempCanvas = document.createElement('canvas')
    const img = new Image()
    img.onload = () => {
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      const ctx = tempCanvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      const scaleX = img.width / (containerRef.current?.getBoundingClientRect().width || 1)
      const scaleY = img.height / (containerRef.current?.getBoundingClientRect().height || 1)

      annotations.forEach(a => {
        ctx.strokeStyle = a.color
        ctx.fillStyle = a.color
        ctx.lineWidth = 3

        if (a.type === 'rect') {
          ctx.strokeRect(a.x1 * scaleX, a.y1 * scaleY, (a.x2 - a.x1) * scaleX, (a.y2 - a.y1) * scaleY)
        } else if (a.type === 'arrow') {
          const sx = a.x1 * scaleX, sy = a.y1 * scaleY
          const ex = a.x2 * scaleX, ey = a.y2 * scaleY
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(ex, ey)
          ctx.stroke()
          const angle = Math.atan2(ey - sy, ex - sx)
          const headLen = 15
          ctx.beginPath()
          ctx.moveTo(ex, ey)
          ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6))
          ctx.moveTo(ex, ey)
          ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6))
          ctx.stroke()
        } else if (a.type === 'text' && a.text) {
          ctx.font = '16px sans-serif'
          ctx.fillText(a.text, a.x1 * scaleX, a.y1 * scaleY)
        }
      })

      const link = document.createElement('a')
      link.href = tempCanvas.toDataURL('image/png')
      link.download = `screenshot_annotated_${Date.now()}.png`
      link.click()
    }
    img.src = capturedImage
  }

  const resetCapture = () => {
    setMode('idle')
    setCapturedImage(null)
    setAnnotations([])
    setCurrentAnnotation(null)
    setSelectStart(null)
    setSelectEnd(null)
    drawSampleContent()
  }

  const renderAnnotations = () => {
    const allAnnotations = currentAnnotation ? [...annotations, currentAnnotation] : annotations
    return allAnnotations.map((a, i) => {
      if (a.type === 'rect') {
        return (
          <div key={i} style={{
            position: 'absolute',
            left: Math.min(a.x1, a.x2), top: Math.min(a.y1, a.y2),
            width: Math.abs(a.x2 - a.x1), height: Math.abs(a.y2 - a.y1),
            border: `2px solid ${a.color}`, pointerEvents: 'none',
          }} />
        )
      }
      if (a.type === 'arrow') {
        const dx = a.x2 - a.x1
        const dy = a.y2 - a.y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * 180 / Math.PI
        return (
          <div key={i} style={{
            position: 'absolute', left: a.x1, top: a.y1 - 1,
            width: len, height: 2, background: a.color,
            transformOrigin: '0 50%', transform: `rotate(${angle}deg)`,
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', right: -6, top: -5,
              width: 0, height: 0,
              borderLeft: `10px solid ${a.color}`,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
            }} />
          </div>
        )
      }
      if (a.type === 'text' && a.text) {
        return (
          <div key={i} style={{
            position: 'absolute', left: a.x1, top: a.y1 - 14,
            color: a.color, fontSize: 14, fontWeight: 600,
            pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>
            {a.text}
          </div>
        )
      }
      return null
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '8px 12px', background: '#181825', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {mode === 'idle' && (
          <>
            <button onClick={captureFull} style={ssBtn}>📸 全屏截图</button>
            <button onClick={startSelect} style={ssBtn}>✂️ 区域截图</button>
          </>
        )}
        {mode === 'selecting' && (
          <>
            <span style={{ fontSize: 12, color: '#f9e2af' }}>🖱️ 拖拽选择截图区域</span>
            <button onClick={resetCapture} style={ssBtn}>取消</button>
          </>
        )}
        {mode === 'captured' && (
          <>
            <span style={{ fontSize: 12, color: '#a6e3a1' }}>✅ 已截取</span>
            <div style={{ width: 1, height: 18, background: '#45475a' }} />
            {([
              { key: 'select' as Tool, label: '🖱️ 选择' },
              { key: 'arrow' as Tool, label: '➡️ 箭头' },
              { key: 'rect' as Tool, label: '⬜ 矩形' },
              { key: 'text' as Tool, label: '📝 文字' },
            ]).map(t => (
              <button key={t.key} onClick={() => setTool(t.key)}
                style={{ ...ssBtn, background: tool === t.key ? '#313244' : 'transparent', border: tool === t.key ? '1px solid #89b4fa' : '1px solid #45475a' }}>
                {t.label}
              </button>
            ))}
            <div style={{ width: 1, height: 18, background: '#45475a' }} />
            <input type="color" value={annotationColor} onChange={(e) => setAnnotationColor(e.target.value)}
              style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }} />
            <div style={{ width: 1, height: 18, background: '#45475a' }} />
            <button onClick={saveWithAnnotations} style={{ ...ssBtn, background: '#89b4fa', color: '#1e1e2e', fontWeight: 600 }}>💾 保存标注</button>
            <button onClick={saveScreenshot} style={ssBtn}>💾 保存原图</button>
            <button onClick={() => { setAnnotations([]); setCurrentAnnotation(null) }} style={ssBtn}>🗑️ 清除标注</button>
            <button onClick={resetCapture} style={ssBtn}>↩ 重新截图</button>
          </>
        )}
      </div>

      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: mode === 'selecting' ? 'crosshair' : mode === 'captured' && tool !== 'select' ? 'crosshair' : 'default' }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
      >
        {mode === 'captured' && capturedImage ? (
          <img src={capturedImage} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} alt="screenshot" />
        ) : (
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        )}

        {mode === 'selecting' && selectStart && selectEnd && (
          <div style={{
            position: 'absolute',
            left: Math.min(selectStart.x, selectEnd.x),
            top: Math.min(selectStart.y, selectEnd.y),
            width: Math.abs(selectEnd.x - selectStart.x),
            height: Math.abs(selectEnd.y - selectStart.y),
            border: '2px dashed #89b4fa',
            background: 'rgba(137, 180, 250, 0.1)',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', top: -20, left: 0, fontSize: 10, color: '#89b4fa',
              background: '#181825', padding: '2px 6px', borderRadius: 3,
            }}>
              {Math.abs(Math.round(selectEnd.x - selectStart.x))} × {Math.abs(Math.round(selectEnd.y - selectStart.y))}
            </div>
          </div>
        )}

        {mode === 'captured' && renderAnnotations()}

        {mode === 'captured' && textPos && (
          <div style={{ position: 'absolute', left: textPos.x, top: textPos.y - 16, zIndex: 10 }}>
            <input
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTextAnnotation(); if (e.key === 'Escape') setTextPos(null) }}
              onBlur={() => { if (textInput.trim()) addTextAnnotation(); else setTextPos(null) }}
              style={{
                padding: '2px 6px', background: '#181825', border: '1px solid #89b4fa',
                color: annotationColor, fontSize: 14, outline: 'none', borderRadius: 3, minWidth: 100,
              }}
            />
          </div>
        )}

        {mode === 'idle' && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>截图工具</div>
            <div style={{ fontSize: 13, color: '#6c7086' }}>点击上方按钮进行全屏截图或区域截图</div>
          </div>
        )}
      </div>
    </div>
  )
}

const ssBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 4, border: '1px solid #45475a',
  background: 'transparent', color: '#cdd6f4', cursor: 'pointer', fontSize: 12
}
