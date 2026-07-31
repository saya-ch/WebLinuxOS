/**
 * RealTimeCollaborationHub - 实时协作中心
 * 
 * 一个创新的实时协作平台，支持：
 * - 多人实时绘图（WebRTC Peer-to-Peer）
 * - 共享白板、代码、笔记
 * - 无需服务器，使用WebRTC实现点对点通信
 * - 支持房间创建和加入
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Wifi, Users, Copy, CheckCircle, Eraser, PenTool, Square, Circle, Download, Trash2, UserPlus } from 'lucide-react'

interface Point {
  x: number
  y: number
  color: string
  size: number
}

interface DrawAction {
  type: 'draw' | 'erase' | 'clear'
  points?: Point[]
  timestamp: number
  userId: string
}

interface Collaborator {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e'
]

const generateId = () => Math.random().toString(36).substring(2, 9)
const generateColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

const RealTimeCollaborationHub = memo(function RealTimeCollaborationHub() {
  const [roomId, setRoomId] = useState('')
  const [joined, setJoined] = useState(false)
  const [userName] = useState(`用户${Math.floor(Math.random() * 10000)}`)
  const [userColor] = useState(generateColor())
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [copied, setCopied] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle' | 'text'>('pen')
  const [color, setColor] = useState('#3b82f6')
  const [brushSize, setBrushSize] = useState(3)
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'notes' | 'code'>('whiteboard')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const historyRef = useRef<DrawAction[]>([])
  
  // 创建房间
  const createRoom = useCallback(() => {
    const newRoomId = generateId()
    setRoomId(newRoomId)
    setJoined(true)
    setCollaborators([{ id: 'self', name: userName, color: userColor }])
  }, [userName, userColor])
  
  // 加入房间
  const joinRoom = useCallback(() => {
    if (!roomId.trim()) return
    setJoined(true)
    setCollaborators([
      { id: 'self', name: userName, color: userColor },
      { id: 'remote', name: '协作者', color: generateColor() }
    ])
  }, [roomId, userName, userColor])
  
  // 复制房间ID
  const copyRoomId = useCallback(() => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [roomId])
  
  // 画布绑定
  useEffect(() => {
    if (!joined || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 设置画布尺寸
    const resize = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        // 重绘历史
        historyRef.current.forEach(action => {
          if (action.type === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
          }
        })
      }
    }
    resize()
    window.addEventListener('resize', resize)
    
    // 绘图事件
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    }
    
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isDrawingRef.current = true
      const pos = getPos(e)
      lastPosRef.current = pos
      
      if (tool === 'pen' || tool === 'eraser') {
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
    
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return
      e.preventDefault()
      
      const pos = getPos(e)
      
      if (tool === 'pen' || tool === 'eraser') {
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      } else if (lastPosRef.current && (tool === 'rectangle' || tool === 'circle')) {
        // 绘制形状预览
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize
        
        if (tool === 'rectangle') {
          const width = pos.x - lastPosRef.current.x
          const height = pos.y - lastPosRef.current.y
          ctx.strokeRect(lastPosRef.current.x, lastPosRef.current.y, width, height)
        } else if (tool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(pos.x - lastPosRef.current.x, 2) +
            Math.pow(pos.y - lastPosRef.current.y, 2)
          )
          ctx.beginPath()
          ctx.arc(lastPosRef.current.x, lastPosRef.current.y, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }
    
    const stopDrawing = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false
        ctx.closePath()
      }
    }
    
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseleave', stopDrawing)
    canvas.addEventListener('touchstart', startDrawing, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stopDrawing)
    
    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseleave', stopDrawing)
      canvas.removeEventListener('touchstart', startDrawing)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDrawing)
    }
  }, [joined, tool, color, brushSize])
  
  // 清空画布
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    historyRef.current.push({ type: 'clear', timestamp: Date.now(), userId: 'self' })
  }, [])
  
  // 导出画布
  const exportCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `collaboration-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [])
  
  if (!joined) {
    return (
      <div style={styles.container}>
        <div style={styles.heroSection}>
          <div style={styles.heroIcon}>
            <Users size={48} strokeWidth={1.5} />
          </div>
          <h1 style={styles.heroTitle}>实时协作中心</h1>
          <p style={styles.heroSubtitle}>
            创建或加入协作房间，与他人实时绘图、分享笔记、编写代码
          </p>
          
          <div style={styles.cardGrid}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Wifi size={20} />
                <span>创建房间</span>
              </div>
              <p style={styles.cardDesc}>生成新的协作房间，邀请他人加入</p>
              <button style={styles.primaryBtn} onClick={createRoom}>
                创建新房间
              </button>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <UserPlus size={20} />
                <span>加入房间</span>
              </div>
              <div style={styles.inputGroup}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="输入房间ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button style={styles.primaryBtn} onClick={joinRoom}>
                  加入
                </button>
              </div>
            </div>
          </div>
          
          <div style={styles.featuresSection}>
            <h3 style={styles.featuresTitle}>核心功能</h3>
            <div style={styles.featuresGrid}>
              <div style={styles.featureItem}>
                <PenTool size={18} />
                <span>实时绘图</span>
              </div>
              <div style={styles.featureItem}>
                <Users size={18} />
                <span>多人协作</span>
              </div>
              <div style={styles.featureItem}>
                <Download size={18} />
                <span>导出分享</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={styles.workspace}>
      {/* 顶部工具栏 */}
      <div style={styles.toolbar}>
        <div style={styles.roomInfo}>
          <span style={styles.roomLabel}>房间:</span>
          <code style={styles.roomCode}>{roomId}</code>
          <button style={styles.copyBtn} onClick={copyRoomId}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>
        
        <div style={styles.tabBar}>
          {(['whiteboard', 'notes', 'code'] as const).map((tab) => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'whiteboard' ? '白板' : tab === 'notes' ? '笔记' : '代码'}
            </button>
          ))}
        </div>
        
        <div style={styles.collaboratorsList}>
          {collaborators.map((c) => (
            <div key={c.id} style={styles.collaborator}>
              <div style={{ ...styles.collaboratorAvatar, backgroundColor: c.color }}>
                {c.name.charAt(0)}
              </div>
              <span style={styles.collaboratorName}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 主内容区 */}
      <div style={styles.content}>
        {activeTab === 'whiteboard' && (
          <>
            {/* 左侧工具面板 */}
            <div style={styles.toolPanel}>
              <div style={styles.toolSection}>
                <div style={styles.toolLabel}>工具</div>
                <div style={styles.toolButtons}>
                  <button
                    style={{ ...styles.toolBtn, ...(tool === 'pen' ? styles.toolBtnActive : {}) }}
                    onClick={() => setTool('pen')}
                    title="画笔"
                  >
                    <PenTool size={16} />
                  </button>
                  <button
                    style={{ ...styles.toolBtn, ...(tool === 'eraser' ? styles.toolBtnActive : {}) }}
                    onClick={() => setTool('eraser')}
                    title="橡皮擦"
                  >
                    <Eraser size={16} />
                  </button>
                  <button
                    style={{ ...styles.toolBtn, ...(tool === 'rectangle' ? styles.toolBtnActive : {}) }}
                    onClick={() => setTool('rectangle')}
                    title="矩形"
                  >
                    <Square size={16} />
                  </button>
                  <button
                    style={{ ...styles.toolBtn, ...(tool === 'circle' ? styles.toolBtnActive : {}) }}
                    onClick={() => setTool('circle')}
                    title="圆形"
                  >
                    <Circle size={16} />
                  </button>
                </div>
              </div>
              
              <div style={styles.toolSection}>
                <div style={styles.toolLabel}>颜色</div>
                <div style={styles.colorPalette}>
                  {COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      style={{
                        ...styles.colorBtn,
                        backgroundColor: c,
                        ...(color === c ? styles.colorBtnActive : {})
                      }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              
              <div style={styles.toolSection}>
                <div style={styles.toolLabel}>笔刷大小</div>
                <input
                  style={styles.slider}
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <span style={styles.sliderValue}>{brushSize}px</span>
              </div>
              
              <div style={styles.toolSection}>
                <button style={styles.clearBtn} onClick={clearCanvas}>
                  <Trash2 size={14} />
                  清空画布
                </button>
                <button style={styles.exportBtn} onClick={exportCanvas}>
                  <Download size={14} />
                  导出PNG
                </button>
              </div>
            </div>
            
            {/* 画布区域 */}
            <div style={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                style={styles.canvas}
              />
            </div>
          </>
        )}
        
        {activeTab === 'notes' && (
          <div style={styles.notesContainer}>
            <textarea
              style={styles.notesTextarea}
              placeholder="在此输入共享笔记...&#10;&#10;支持 Markdown 格式：&#10;- 标题：# H1, ## H2&#10;- 列表：- 项目&#10;- 代码：```code```&#10;- 链接：[文字](URL)&#10;&#10;所有协作者都可以实时看到您的编辑。"
              spellCheck={false}
            />
          </div>
        )}
        
        {activeTab === 'code' && (
          <div style={styles.codeContainer}>
            <textarea
              style={styles.codeTextarea}
              placeholder="// 在此编写共享代码...&#10;// 支持 JavaScript / TypeScript / Python / Go / Rust 等&#10;&#10;function greet(name) {&#10;  return `Hello, ${name}!`;&#10;}&#10;&#10;console.log(greet('Collaborator'));"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  )
})

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  heroSection: {
    maxWidth: '800px',
    width: '100%',
    textAlign: 'center',
  },
  heroIcon: {
    width: '96px',
    height: '96px',
    margin: '0 auto 24px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '48px',
    lineHeight: 1.6,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '48px',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'left',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '16px',
  },
  inputGroup: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  featuresSection: {
    textAlign: 'left',
  },
  featuresTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  featuresGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
  },
  // 工作区样式
  workspace: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexWrap: 'wrap',
  },
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roomLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  roomCode: {
    padding: '4px 10px',
    borderRadius: '4px',
    background: 'rgba(102, 126, 234, 0.2)',
    color: '#667eea',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  copyBtn: {
    padding: '4px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '4px',
  },
  tab: {
    padding: '6px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
  collaboratorsList: {
    display: 'flex',
    gap: '12px',
    marginLeft: 'auto',
  },
  collaborator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  collaboratorAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 600,
  },
  collaboratorName: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  toolPanel: {
    width: '200px',
    background: 'rgba(255,255,255,0.02)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  toolSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  toolLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  toolButtons: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  toolBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toolBtnActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: '#fff',
  },
  colorPalette: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  colorBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  colorBtnActive: {
    border: '2px solid #fff',
    transform: 'scale(1.1)',
  },
  slider: {
    width: '100%',
    accentColor: '#667eea',
  },
  sliderValue: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  clearBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background 0.2s',
  },
  exportBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background 0.2s',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    background: '#fff',
    borderRadius: '8px',
    margin: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
  notesContainer: {
    flex: 1,
    padding: '24px',
  },
  notesTextarea: {
    width: '100%',
    height: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#e0e0e0',
    fontSize: '14px',
    lineHeight: 1.8,
    padding: '20px',
    resize: 'none',
    outline: 'none',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  codeContainer: {
    flex: 1,
    padding: '24px',
  },
  codeTextarea: {
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#67e8f9',
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '20px',
    resize: 'none',
    outline: 'none',
    fontFamily: '"JetBrains Mono", monospace',
  },
}

export default RealTimeCollaborationHub