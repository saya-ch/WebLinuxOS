import { useState, useRef, useEffect, useCallback } from 'react'

// ===================== Types =====================

type ToolType = 'pen' | 'eraser' | 'line' | 'rect' | 'circle'

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  tool: ToolType
  points: Point[]
  color: string
  size: number
  userId: string
}

interface RemoteCursor {
  userId: string
  userName: string
  userColor: string
  x: number
  y: number
}

type MessageType =
  | { type: 'stroke'; stroke: Stroke }
  | { type: 'cursor'; userId: string; userName: string; userColor: string; x: number; y: number }
  | { type: 'join'; userId: string; userName: string; userColor: string }
  | { type: 'leave'; userId: string }
  | { type: 'clear'; userId: string }
  | { type: 'undo'; userId: string; strokeId: string }
  | { type: 'sync-request'; userId: string }
  | { type: 'sync-response'; strokes: Stroke[]; toUserId: string }

// ===================== Constants =====================

const CHANNEL_NAME = 'weblinux-collab-board'
const MAX_UNDO = 20
const CURSOR_TIMEOUT = 5000
const HEARTBEAT_INTERVAL = 2000

const PRESET_COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd',
  '#ff9ff3', '#54a0ff', '#00d2d3', '#ff9f43', '#ee5a24',
  '#2d3436', '#ffffff', '#636e72', '#dfe6e9', '#e94560',
  '#0f3460', '#4ecca3', '#7b68ee', '#fc5c65', '#26de81',
]

const TOOL_LIST: { id: ToolType; label: string; icon: string }[] = [
  { id: 'pen', label: 'Pen', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', icon: '🧹' },
  { id: 'line', label: 'Line', icon: '📏' },
  { id: 'rect', label: 'Rect', icon: '⬜' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
]

// ===================== Helpers =====================

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function randomName(): string {
  return `User-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

function randomUserColor(): string {
  const palette = ['#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#5f27cd', '#ff9ff3', '#54a0ff', '#00d2d3']
  return palette[Math.floor(Math.random() * palette.length)]
}

// ===================== Drawing Engine =====================

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.color
  }

  ctx.lineWidth = stroke.size

  const pts = stroke.points
  if (pts.length === 0) {
    ctx.restore()
    return
  }

  switch (stroke.tool) {
    case 'pen':
    case 'eraser': {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      if (pts.length === 1) {
        ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1)
      } else {
        for (let i = 1; i < pts.length; i++) {
          // Smooth quadratic bezier
          if (i < pts.length - 1) {
            const mx = (pts[i].x + pts[i + 1].x) / 2
            const my = (pts[i].y + pts[i + 1].y) / 2
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
          } else {
            ctx.lineTo(pts[i].x, pts[i].y)
          }
        }
      }
      ctx.stroke()
      break
    }
    case 'line': {
      if (pts.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
        ctx.stroke()
      }
      break
    }
    case 'rect': {
      if (pts.length >= 2) {
        const x = Math.min(pts[0].x, pts[pts.length - 1].x)
        const y = Math.min(pts[0].y, pts[pts.length - 1].y)
        const w = Math.abs(pts[pts.length - 1].x - pts[0].x)
        const h = Math.abs(pts[pts.length - 1].y - pts[0].y)
        ctx.strokeRect(x, y, w, h)
      }
      break
    }
    case 'circle': {
      if (pts.length >= 2) {
        const cx = (pts[0].x + pts[pts.length - 1].x) / 2
        const cy = (pts[0].y + pts[pts.length - 1].y) / 2
        const rx = Math.abs(pts[pts.length - 1].x - pts[0].x) / 2
        const ry = Math.abs(pts[pts.length - 1].y - pts[0].y) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, 2 * Math.PI)
        ctx.stroke()
      }
      break
    }
  }

  ctx.restore()
}

function redrawAll(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, strokes: Stroke[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const s of strokes) {
    renderStroke(ctx, s)
  }
}

// ===================== Component =====================

export default function LiveCollabBoard() {
  // --- Canvas refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // --- User identity (stable per instance) ---
  const userIdRef = useRef(genId())
  const userNameRef = useRef(randomName())
  const userColorRef = useRef(randomUserColor())

  // --- Tool state ---
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#ff6b6b')
  const [brushSize, setBrushSize] = useState(4)

  // --- Drawing state ---
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const strokesRef = useRef<Stroke[]>([])
  const undoStackRef = useRef<string[]>([]) // stroke IDs for undo

  // --- Collaboration ---
  const channelRef = useRef<BroadcastChannel | null>(null)
  const [peers, setPeers] = useState<Map<string, { name: string; color: string; lastSeen: number }>>(new Map())
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([])
  const remoteCursorsRef = useRef<Map<string, RemoteCursor>>(new Map())

  // --- Derived ---
  const userCount = peers.size + 1

  // Keep strokesRef in sync
  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])

  // ===================== BroadcastChannel Setup =====================

  useEffect(() => {
    let channel: BroadcastChannel
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
    } catch {
      // BroadcastChannel not supported
      return
    }
    channelRef.current = channel

    const myId = userIdRef.current

    // Announce join
    channel.postMessage({
      type: 'join',
      userId: myId,
      userName: userNameRef.current,
      userColor: userColorRef.current,
    } as MessageType)

    // Request sync from existing peers
    channel.postMessage({ type: 'sync-request', userId: myId } as MessageType)

    // Message handler
    channel.onmessage = (e: MessageEvent<MessageType>) => {
      const msg = e.data
      if (!msg || !msg.type) return

      switch (msg.type) {
        case 'stroke': {
          if (msg.stroke.userId !== myId) {
            setStrokes(prev => {
              const next = [...prev, msg.stroke]
              strokesRef.current = next
              return next
            })
          }
          break
        }
        case 'cursor': {
          if (msg.userId !== myId) {
            remoteCursorsRef.current.set(msg.userId, {
              userId: msg.userId,
              userName: msg.userName,
              userColor: msg.userColor,
              x: msg.x,
              y: msg.y,
            })
            setRemoteCursors(Array.from(remoteCursorsRef.current.values()))
          }
          break
        }
        case 'join': {
          if (msg.userId !== myId) {
            setPeers(prev => {
              const next = new Map(prev)
              next.set(msg.userId, { name: msg.userName, color: msg.userColor, lastSeen: Date.now() })
              return next
            })
          }
          break
        }
        case 'leave': {
          setPeers(prev => {
            const next = new Map(prev)
            next.delete(msg.userId)
            return next
          })
          remoteCursorsRef.current.delete(msg.userId)
          setRemoteCursors(Array.from(remoteCursorsRef.current.values()))
          break
        }
        case 'clear': {
          if (msg.userId !== myId) {
            setStrokes([])
            strokesRef.current = []
            undoStackRef.current = []
          }
          break
        }
        case 'undo': {
          if (msg.userId !== myId) {
            setStrokes(prev => {
              const next = prev.filter(s => s.id !== msg.strokeId)
              strokesRef.current = next
              return next
            })
          }
          break
        }
        case 'sync-request': {
          if (msg.userId !== myId) {
            channel.postMessage({
              type: 'sync-response',
              strokes: strokesRef.current,
              toUserId: msg.userId,
            } as MessageType)
          }
          break
        }
        case 'sync-response': {
          if (msg.toUserId === myId && msg.strokes.length > 0) {
            setStrokes(msg.strokes)
            strokesRef.current = msg.strokes
          }
          break
        }
      }
    }

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(() => {
      channel.postMessage({
        type: 'join',
        userId: myId,
        userName: userNameRef.current,
        userColor: userColorRef.current,
      } as MessageType)
    }, HEARTBEAT_INTERVAL)

    // Cleanup stale peers
    const staleCheck = setInterval(() => {
      setPeers(prev => {
        const now = Date.now()
        const next = new Map(prev)
        let changed = false
        for (const [id, info] of next) {
          if (now - info.lastSeen > CURSOR_TIMEOUT * 2) {
            next.delete(id)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, CURSOR_TIMEOUT)

    // Stale cursor cleanup
    const cursorClean = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [id, cur] of remoteCursorsRef.current) {
        const peer = peers.get(id)
        if (!peer || now - peer.lastSeen > CURSOR_TIMEOUT) {
          remoteCursorsRef.current.delete(id)
          changed = true
        }
      }
      if (changed) {
        setRemoteCursors(Array.from(remoteCursorsRef.current.values()))
      }
    }, CURSOR_TIMEOUT)

    return () => {
      channel.postMessage({ type: 'leave', userId: myId } as MessageType)
      clearInterval(heartbeat)
      clearInterval(staleCheck)
      clearInterval(cursorClean)
      channel.close()
      channelRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===================== Canvas Resize =====================

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) redrawAll(ctx, canvas, strokesRef.current)
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  // ===================== Redraw on strokes change =====================

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    redrawAll(ctx, canvas, strokes)
  }, [strokes])

  // ===================== Drawing Handlers =====================

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e)
    isDrawingRef.current = true
    const stroke: Stroke = {
      id: genId(),
      tool,
      points: [pt],
      color: tool === 'eraser' ? '#000000' : color,
      size: tool === 'eraser' ? brushSize * 3 : brushSize,
      userId: userIdRef.current,
    }
    currentStrokeRef.current = stroke

    // Draw initial point
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) renderStroke(ctx, stroke)
  }, [tool, color, brushSize, getCanvasPoint])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e)

    // Broadcast cursor
    const ch = channelRef.current
    if (ch) {
      ch.postMessage({
        type: 'cursor',
        userId: userIdRef.current,
        userName: userNameRef.current,
        userColor: userColorRef.current,
        x: pt.x,
        y: pt.y,
      } as MessageType)
    }

    if (!isDrawingRef.current || !currentStrokeRef.current) return

    const stroke = currentStrokeRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    // For shape tools (line, rect, circle), keep only start + current point
    if (stroke.tool === 'line' || stroke.tool === 'rect' || stroke.tool === 'circle') {
      stroke.points = [stroke.points[0], pt]
      // Redraw everything + preview
      redrawAll(ctx, canvas, strokesRef.current)
      renderStroke(ctx, stroke)
    } else {
      // Freehand / eraser: append point and draw incrementally
      stroke.points.push(pt)
      renderStroke(ctx, {
        ...stroke,
        points: stroke.points.slice(-2),
      })
    }
  }, [getCanvasPoint])

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    isDrawingRef.current = false

    const stroke = currentStrokeRef.current
    currentStrokeRef.current = null

    // Commit stroke
    setStrokes(prev => {
      const next = [...prev, stroke]
      strokesRef.current = next
      return next
    })

    // Track for undo
    undoStackRef.current.push(stroke.id)
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift()
    }

    // Broadcast
    const ch = channelRef.current
    if (ch) {
      ch.postMessage({ type: 'stroke', stroke } as MessageType)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isDrawingRef.current) {
      handleMouseUp()
    }
  }, [handleMouseUp])

  // ===================== Actions =====================

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    const lastId = undoStackRef.current.pop()!

    setStrokes(prev => {
      const next = prev.filter(s => s.id !== lastId)
      strokesRef.current = next
      return next
    })

    const ch = channelRef.current
    if (ch) {
      ch.postMessage({ type: 'undo', userId: userIdRef.current, strokeId: lastId } as MessageType)
    }
  }, [])

  const handleClear = useCallback(() => {
    setStrokes([])
    strokesRef.current = []
    undoStackRef.current = []

    const ch = channelRef.current
    if (ch) {
      ch.postMessage({ type: 'clear', userId: userIdRef.current } as MessageType)
    }
  }, [])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create export canvas with white background
    const expCanvas = document.createElement('canvas')
    expCanvas.width = canvas.width
    expCanvas.height = canvas.height
    const expCtx = expCanvas.getContext('2d')!
    expCtx.fillStyle = '#ffffff'
    expCtx.fillRect(0, 0, expCanvas.width, expCanvas.height)
    expCtx.drawImage(canvas, 0, 0)

    const link = document.createElement('a')
    link.download = `collab-board-${Date.now()}.png`
    link.href = expCanvas.toDataURL('image/png')
    link.click()
  }, [])

  // ===================== Styles =====================

  const S = {
    bg: 'var(--window-bg, #1e1e1e)',
    surface: 'var(--surface, #2d2d2d)',
    border: 'var(--border, #444)',
    text: 'var(--text-primary, #d4d4d4)',
    textDim: 'var(--text-secondary, #888)',
    accent: 'var(--accent, #007acc)',
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: S.surface,
    borderBottom: `1px solid ${S.border}`,
    flexWrap: 'wrap',
    minHeight: 44,
    zIndex: 10,
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? S.accent : 'transparent',
    border: `1px solid ${active ? S.accent : 'transparent'}`,
    color: active ? '#fff' : S.text,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'background 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  })

  const separatorStyle: React.CSSProperties = {
    width: 1,
    height: 24,
    background: S.border,
    margin: '0 2px',
  }

  // ===================== Render =====================

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: S.bg, color: S.text, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Tools */}
        {TOOL_LIST.map(t => (
          <button
            key={t.id}
            style={btnStyle(tool === t.id)}
            onClick={() => setTool(t.id)}
            title={t.label}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 12 }}>{t.label}</span>
          </button>
        ))}

        <div style={separatorStyle} />

        {/* Color Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: `2px solid ${S.border}`,
              background: color,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            title="Custom color"
          >
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 200 }}>
            {PRESET_COLORS.slice(0, 10).map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 2,
                  border: color === c ? `2px solid #fff` : `1px solid ${S.border}`,
                  background: c,
                  cursor: 'pointer',
                  padding: 0,
                }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div style={separatorStyle} />

        {/* Brush Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: S.textDim }}>Size</span>
          <input
            type="range"
            min={1}
            max={30}
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            style={{ width: 80, accentColor: S.accent }}
          />
          <span style={{ fontSize: 11, color: S.textDim, minWidth: 24 }}>{brushSize}px</span>
        </div>

        <div style={separatorStyle} />

        {/* Actions */}
        <button style={btnStyle(false)} onClick={handleUndo} title="Undo">
          <span style={{ fontSize: 16 }}>↩️</span>
          <span style={{ fontSize: 12 }}>Undo</span>
        </button>
        <button style={btnStyle(false)} onClick={handleClear} title="Clear all">
          <span style={{ fontSize: 16 }}>🗑️</span>
          <span style={{ fontSize: 12 }}>Clear</span>
        </button>
        <button style={btnStyle(false)} onClick={handleExport} title="Export PNG">
          <span style={{ fontSize: 16 }}>💾</span>
          <span style={{ fontSize: 12 }}>Export</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* User Presence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 14 }}>👥</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{userCount}</span>
          <span style={{ fontSize: 11, color: S.textDim }}>online</span>
          {/* Show own color dot */}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: userColorRef.current, border: '1px solid rgba(255,255,255,0.3)' }} title={userNameRef.current} />
          {/* Show peer dots */}
          {Array.from(peers.entries()).slice(0, 8).map(([id, info]) => (
            <div
              key={id}
              style={{ width: 10, height: 10, borderRadius: '50%', background: info.color, border: '1px solid rgba(255,255,255,0.3)' }}
              title={info.name}
            />
          ))}
          {peers.size > 8 && <span style={{ fontSize: 10, color: S.textDim }}>+{peers.size - 8}</span>}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: '#1a1a2e',
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'crosshair',
          }}
        />

        {/* Remote Cursors */}
        {remoteCursors.map(rc => (
          <div
            key={rc.userId}
            style={{
              position: 'absolute',
              left: rc.x,
              top: rc.y,
              pointerEvents: 'none',
              zIndex: 20,
              transition: 'left 0.08s linear, top 0.08s linear',
            }}
          >
            {/* Cursor arrow */}
            <svg width="16" height="16" viewBox="0 0 16 16" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
              <path d="M0 0 L0 12 L3.5 8.5 L7 15 L9 14 L5.5 7.5 L10 7.5 Z" fill={rc.userColor} stroke="#fff" strokeWidth="0.5" />
            </svg>
            {/* Name tag */}
            <div
              style={{
                position: 'absolute',
                left: 14,
                top: 14,
                background: rc.userColor,
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                maxWidth: 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {rc.userName}
            </div>
          </div>
        ))}

        {/* Status bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 10px',
            background: 'rgba(0,0,0,0.5)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            pointerEvents: 'none',
          }}
        >
          <span>{userNameRef.current} ({userIdRef.current.slice(0, 8)})</span>
          <span>{strokes.length} strokes · {tool} · {brushSize}px</span>
          <span>BroadcastChannel sync</span>
        </div>
      </div>
    </div>
  )
}
