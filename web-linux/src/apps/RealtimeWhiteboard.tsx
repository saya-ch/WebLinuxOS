import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '../store'
import {
  Pencil, Eraser, Square, Circle, ArrowRight, Type,
  Undo2, Redo2, Trash2, Download, Palette, Minus,
  Users, Cloud, Wifi, WifiOff
} from 'lucide-react'

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'text'

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  tool: Tool
  color: string
  lineWidth: number
  points: Point[]
  startPoint?: Point
  endPoint?: Point
  text?: string
  fontSize?: number
  userId: string
  timestamp: number
}

const STORAGE_KEY = 'weblinux-realtime-whiteboard-strokes'
const CHANNEL_NAME = 'weblinux-realtime-whiteboard'

const COLORS = [
  '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
  '#0ea5e9', '#14b8a6', '#a855f7', '#f59e0b', '#64748b',
]

const LINE_WIDTHS = [2, 4, 6, 10, 16, 24]

const TOOL_BUTTONS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'pen', icon: <Pencil size={16} />, label: '画笔' },
  { id: 'eraser', icon: <Eraser size={16} />, label: '橡皮擦' },
  { id: 'rectangle', icon: <Square size={16} />, label: '矩形' },
  { id: 'circle', icon: <Circle size={16} />, label: '圆形' },
  { id: 'arrow', icon: <ArrowRight size={16} />, label: '箭头' },
  { id: 'text', icon: <Type size={16} />, label: '文字' },
]

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const genUserId = () => `u-${Math.random().toString(36).slice(2, 8)}`

const G = {
  app: 'relative h-full w-full overflow-hidden text-slate-100',
  bg: 'bg-[#0b0f1a]',
  gradient: 'bg-gradient-to-br from-[#0b0f1a] via-[#111833] to-[#1a1040]',
  glass: 'backdrop-blur-xl bg-white/[0.06] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
  glassSoft: 'backdrop-blur-lg bg-white/[0.04] border border-white/10',
  btn: 'flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs transition-all duration-150 border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.97]',
  btnActive: 'bg-gradient-to-br from-indigo-500/80 to-purple-500/80 border-indigo-300/40 text-white shadow-[0_0_18px_rgba(139,92,246,0.35)]',
  btnDisabled: 'opacity-40 cursor-not-allowed hover:bg-white/[0.04] hover:border-white/10',
  danger: 'flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs transition-all duration-150 border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
  accentText: 'bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent',
}

export default function RealtimeWhiteboard() {
  const theme = useStore((s) => s.theme)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const presenceTimerRef = useRef<number | null>(null)

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState<string>('#ffffff')
  const [lineWidth, setLineWidth] = useState<number>(4)
  const [fontSize, setFontSize] = useState<number>(22)

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [history, setHistory] = useState<Stroke[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState<number>(0)

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)

  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos] = useState<Point>({ x: 0, y: 0 })

  const [connected, setConnected] = useState(false)
  const [peers, setPeers] = useState<{ id: string; lastSeen: number }[]>([])
  const userIdRef = useRef<string>(genUserId())

  const persistStrokes = useCallback((list: Stroke[]) => {
    try {
      const data = JSON.stringify(list)
      localStorage.setItem(STORAGE_KEY, data)
    } catch {
    }
  }, [])

  const restoreStrokes = useCallback((): Stroke[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Stroke[]
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      return []
    }
  }, [])

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, s: Stroke) => {
    ctx.save()
    ctx.strokeStyle = s.color
    ctx.fillStyle = s.color
    ctx.lineWidth = s.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (s.tool) {
      case 'pen': {
        if (s.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(s.points[0].x, s.points[0].y)
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].x, s.points[i].y)
          }
          ctx.stroke()
        } else if (s.points.length === 1) {
          ctx.beginPath()
          ctx.arc(s.points[0].x, s.points[0].y, s.lineWidth / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
      case 'eraser': {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = s.lineWidth * 2.5
        if (s.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(s.points[0].x, s.points[0].y)
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].x, s.points[i].y)
          }
          ctx.stroke()
        }
        break
      }
      case 'rectangle': {
        if (s.startPoint && s.endPoint) {
          const x = Math.min(s.startPoint.x, s.endPoint.x)
          const y = Math.min(s.startPoint.y, s.endPoint.y)
          const w = Math.abs(s.endPoint.x - s.startPoint.x)
          const h = Math.abs(s.endPoint.y - s.startPoint.y)
          ctx.strokeRect(x, y, w, h)
        }
        break
      }
      case 'circle': {
        if (s.startPoint && s.endPoint) {
          const cx = (s.startPoint.x + s.endPoint.x) / 2
          const cy = (s.startPoint.y + s.endPoint.y) / 2
          const rx = Math.abs(s.endPoint.x - s.startPoint.x) / 2
          const ry = Math.abs(s.endPoint.y - s.startPoint.y) / 2
          ctx.beginPath()
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        break
      }
      case 'arrow': {
        if (s.startPoint && s.endPoint) {
          const dx = s.endPoint.x - s.startPoint.x
          const dy = s.endPoint.y - s.startPoint.y
          const len = Math.hypot(dx, dy) || 1
          const ux = dx / len
          const uy = dy / len
          const head = Math.max(10, s.lineWidth * 3)
          ctx.beginPath()
          ctx.moveTo(s.startPoint.x, s.startPoint.y)
          ctx.lineTo(s.endPoint.x, s.endPoint.y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(s.endPoint.x, s.endPoint.y)
          ctx.lineTo(
            s.endPoint.x - ux * head - uy * head * 0.5,
            s.endPoint.y - uy * head + ux * head * 0.5
          )
          ctx.lineTo(
            s.endPoint.x - ux * head + uy * head * 0.5,
            s.endPoint.y - uy * head - ux * head * 0.5
          )
          ctx.closePath()
          ctx.fill()
        }
        break
      }
      case 'text': {
        if (s.text && s.startPoint) {
          const size = s.fontSize ?? 22
          ctx.font = `600 ${size}px "Inter", system-ui, -apple-system, "Segoe UI", sans-serif`
          ctx.textBaseline = 'top'
          ctx.fillText(s.text, s.startPoint.x, s.startPoint.y)
        }
        break
      }
    }
    ctx.restore()
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const bg = theme === 'dark' ? '#111833' : '#ffffff'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
    ctx.lineWidth = 1
    const grid = 24
    for (let x = 0; x < canvas.width; x += grid) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += grid) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    const list = strokes
    for (const s of list) drawStroke(ctx, s)
    if (currentStroke) drawStroke(ctx, currentStroke)
  }, [strokes, currentStroke, drawStroke, theme])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      redrawCanvas()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [redrawCanvas])

  useEffect(() => {
    const initial = restoreStrokes()
    if (initial.length > 0) {
      setStrokes(initial)
      setHistory([initial])
      setHistoryIndex(0)
    }
  }, [restoreStrokes])

  const pushHistory = useCallback((next: Stroke[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1)
      const updated = [...trimmed, next]
      if (updated.length > 100) updated.shift()
      return updated
    })
    setHistoryIndex((i) => Math.min(i + 1, 99))
  }, [historyIndex])

  const commitStroke = useCallback((s: Stroke) => {
    setStrokes((prev) => {
      const next = [...prev, s]
      pushHistory(next)
      persistStrokes(next)
      return next
    })
  }, [pushHistory, persistStrokes])

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (historyIndex <= 0) return prev
      const newIndex = historyIndex - 1
      const list = prev[newIndex] || []
      setHistoryIndex(newIndex)
      setStrokes(list)
      persistStrokes(list)
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'state', strokes: list, from: userIdRef.current })
      }
      return prev
    })
  }, [historyIndex, persistStrokes])

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (historyIndex >= prev.length - 1) return prev
      const newIndex = historyIndex + 1
      const list = prev[newIndex] || []
      setHistoryIndex(newIndex)
      setStrokes(list)
      persistStrokes(list)
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'state', strokes: list, from: userIdRef.current })
      }
      return prev
    })
  }, [historyIndex, persistStrokes])

  const handleClear = useCallback(() => {
    setStrokes([])
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1)
      const updated = [...trimmed, []]
      if (updated.length > 100) updated.shift()
      return updated
    })
    setHistoryIndex((i) => Math.min(i + 1, 99))
    persistStrokes([])
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'state', strokes: [], from: userIdRef.current })
    }
  }, [historyIndex, persistStrokes])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `realtime-whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    const p = getPoint(e)
    if (tool === 'text') {
      setTextPos(p)
      setTextInput('')
      setShowTextInput(true)
      return
    }
    setIsDrawing(true)
    const s: Stroke = {
      id: genId(),
      tool,
      color,
      lineWidth,
      points: [p],
      startPoint: p,
      endPoint: p,
      fontSize,
      userId: userIdRef.current,
      timestamp: Date.now(),
    }
    setCurrentStroke(s)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return
    const p = getPoint(e)
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentStroke((prev) => prev ? { ...prev, points: [...prev.points, p] } : null)
    } else {
      setCurrentStroke((prev) => prev ? { ...prev, endPoint: p } : null)
    }
  }

  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return
    setIsDrawing(false)
    const s = currentStroke
    setCurrentStroke(null)
    commitStroke(s)
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'stroke', stroke: s, from: userIdRef.current })
    }
  }

  const handleAddText = useCallback(() => {
    if (!textInput.trim()) {
      setShowTextInput(false)
      return
    }
    const s: Stroke = {
      id: genId(),
      tool: 'text',
      color,
      lineWidth,
      points: [],
      startPoint: textPos,
      endPoint: textPos,
      text: textInput,
      fontSize,
      userId: userIdRef.current,
      timestamp: Date.now(),
    }
    commitStroke(s)
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'stroke', stroke: s, from: userIdRef.current })
    }
    setShowTextInput(false)
    setTextInput('')
  }, [textInput, textPos, color, lineWidth, fontSize, commitStroke])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleRedo()
      } else if (e.key === 'Escape') {
        setShowTextInput(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = ch
    setConnected(true)

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data
      if (!data || data.from === userIdRef.current) return
      if (data.type === 'stroke' && data.stroke) {
        setStrokes((prev) => {
          const next = [...prev, data.stroke as Stroke]
          persistStrokes(next)
          return next
        })
      } else if (data.type === 'state' && Array.isArray(data.strokes)) {
        setStrokes(data.strokes as Stroke[])
        setHistory([data.strokes as Stroke[]])
        setHistoryIndex(0)
        persistStrokes(data.strokes as Stroke[])
      } else if (data.type === 'request-state') {
        ch.postMessage({ type: 'state', strokes, from: userIdRef.current })
      } else if (data.type === 'presence') {
        setPeers((prev) => {
          const without = prev.filter((p) => p.id !== data.from)
          return [...without, { id: data.from, lastSeen: Date.now() }]
        })
      }
    }

    ch.addEventListener('message', onMessage)
    ch.postMessage({ type: 'request-state', from: userIdRef.current })

    presenceTimerRef.current = window.setInterval(() => {
      ch.postMessage({ type: 'presence', from: userIdRef.current })
      setPeers((prev) => prev.filter((p) => Date.now() - p.lastSeen < 8000))
    }, 3000)

    const onOnline = () => setConnected(true)
    const onOffline = () => setConnected(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    ch.postMessage({ type: 'presence', from: userIdRef.current })

    return () => {
      if (presenceTimerRef.current) window.clearInterval(presenceTimerRef.current)
      ch.removeEventListener('message', onMessage)
      ch.close()
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      channelRef.current = null
      setConnected(false)
    }
  }, [persistStrokes, strokes])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  const onlinePeers = peers.filter((p) => Date.now() - p.lastSeen < 8000).length

  return (
    <div className={`${G.app} ${G.gradient}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(1000px 500px at 110% 110%, rgba(236,72,153,0.22), transparent 60%), radial-gradient(800px 400px at 50% 50%, rgba(14,165,233,0.12), transparent 60%)',
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col p-3 gap-3">
        {/* Header */}
        <div className={`${G.glass} rounded-2xl px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.5)]">
              <Pencil size={18} className="text-white" />
            </div>
            <div>
              <h1 className={`text-base font-semibold leading-tight ${G.accentText}`}>实时协作白板</h1>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  {connected ? (
                    <>
                      <Wifi size={11} className="text-emerald-400" />
                      <span>已连接</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={11} className="text-rose-400" />
                      <span>离线</span>
                    </>
                  )}
                </span>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-1">
                  <Users size={11} />
                  {onlinePeers + 1} 人在线
                </span>
                <span className="opacity-60">·</span>
                <span>本地ID: {userIdRef.current.slice(0, 10)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`${G.btn} ${!canUndo ? G.btnDisabled : ''}`}
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 size={14} /> 撤销
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`${G.btn} ${!canRedo ? G.btnDisabled : ''}`}
              title="重做 (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} /> 重做
            </button>
            <button onClick={handleClear} className={G.danger} title="清空画布">
              <Trash2 size={14} /> 清空
            </button>
            <button onClick={handleExport} className={G.btn} title="导出 PNG">
              <Download size={14} /> 导出
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex min-h-0 flex-1 gap-3">
          {/* Tool panel */}
          <div className={`${G.glass} rounded-2xl p-3 flex flex-col gap-3 w-[220px]`}>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">工具</div>
              <div className="grid grid-cols-3 gap-2">
                {TOOL_BUTTONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-150 ${
                      tool === t.id
                        ? `${G.btnActive}`
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-white'
                    }`}
                    title={t.label}
                  >
                    {t.icon}
                    <span className="text-[10px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-white/10" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  笔画粗细
                </div>
                <span className="text-[11px] text-slate-300">{lineWidth}px</span>
              </div>
              <div className="flex gap-1.5">
                {LINE_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center border transition ${
                      lineWidth === w
                        ? 'bg-indigo-500/30 border-indigo-400/50'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                    }`}
                    title={`${w}px`}
                  >
                    <span
                      className="rounded-full bg-slate-200"
                      style={{ width: Math.min(w, 18), height: Math.min(w, 18) }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {tool === 'text' && (
              <>
                <div className="h-px w-full bg-white/10" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400">字号</div>
                    <span className="text-[11px] text-slate-300">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={72}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
              </>
            )}

            <div className="h-px w-full bg-white/10" />

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Palette size={13} className="text-slate-400" />
                <div className="text-[11px] uppercase tracking-wider text-slate-400">颜色</div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 rounded-lg border transition ${
                      color === c
                        ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.25)] scale-105'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-10 rounded-md border border-white/10 bg-transparent cursor-pointer"
                  title="自定义颜色"
                />
                <span className="text-[11px] text-slate-400 font-mono">{color}</span>
              </div>
            </div>

            <div className="mt-auto">
              <div className={`${G.glassSoft} rounded-xl px-3 py-2 text-[11px] text-slate-400`}>
                <div className="flex items-center gap-1.5 mb-1 text-slate-300">
                  <Cloud size={12} /> 协作提示
                </div>
                打开多个标签页即可实时同步绘制内容，数据通过 localStorage 自动保存。
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className={`${G.glass} rounded-2xl flex-1 p-2 relative overflow-hidden`}>
            <div
              ref={containerRef}
              className="relative h-full w-full rounded-xl overflow-hidden"
              style={{
                backgroundImage:
                  theme === 'dark'
                    ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)'
                    : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
                backgroundSize: '18px 18px',
                backgroundColor: theme === 'dark' ? '#111833' : '#ffffff',
              }}
            >
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="block h-full w-full touch-none"
                style={{
                  cursor:
                    tool === 'eraser'
                      ? 'cell'
                      : tool === 'text'
                      ? 'text'
                      : 'crosshair',
                }}
              />

              {showTextInput && (
                <input
                  autoFocus
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddText()
                  }}
                  onBlur={handleAddText}
                  placeholder="输入文字后回车..."
                  className="absolute bg-transparent outline-none border-b border-dashed border-indigo-400/60 text-white placeholder:text-slate-500"
                  style={{
                    left: textPos.x,
                    top: textPos.y,
                    fontSize: `${fontSize}px`,
                    fontWeight: 600,
                    color,
                    minWidth: 140,
                    maxWidth: 360,
                  }}
                />
              )}

              <div className="absolute bottom-3 left-3 flex gap-2">
                <div className={`${G.glassSoft} rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5`}>
                  <span
                    className="inline-block rounded-full"
                    style={{ width: 10, height: 10, background: color }}
                  />
                  <span>{color}</span>
                </div>
                <div className={`${G.glassSoft} rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5`}>
                  <Minus size={12} />
                  <span>{lineWidth}px</span>
                </div>
                <div className={`${G.glassSoft} rounded-lg px-2.5 py-1 text-[11px] text-slate-300`}>
                  笔画: {strokes.length}
                </div>
              </div>

              <div className="absolute bottom-3 right-3">
                <div className={`${G.glassSoft} rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5`}>
                  {connected ? <Wifi size={12} className="text-emerald-400" /> : <WifiOff size={12} className="text-rose-400" />}
                  {connected ? '同步中' : '离线'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
