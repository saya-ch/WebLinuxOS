import { useState, useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store'
import {
  Pencil, Eraser, Palette, Undo2, Redo2, Trash2, Download,
  Sparkles, Lightbulb, Circle, Square, Minus, Type,
  Layers, Copy, Wand2, Plus,
  ZoomIn, ZoomOut, Grid3X3, EyeOff,
  Hash
} from 'lucide-react'

type Tool = 'pencil' | 'eraser' | 'line' | 'rect' | 'circle' | 'move' | 'text'
type PromptCategory = '肖像' | '风景' | '抽象' | '赛博朋克' | '水彩' | '像素' | '3D渲染' | '中国风'

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  size: number
  tool: Tool
  text?: string
  x?: number
  y?: number
}

interface IdeaCard {
  id: string
  text: string
  color: string
  x: number
  y: number
}

const PROMPT_STYLES: Record<PromptCategory, { adjectives: string[]; mediums: string[]; artists: string[]; lighting: string[] }> = {
  肖像: {
    adjectives: ['优雅的', '神秘的', '坚毅的', '梦幻的', '温柔的', '充满力量的', '复古的', '极简的'],
    mediums: ['油画', '素描', '数字艺术', '摄影', '水彩画', '彩色铅笔'],
    artists: ['Alphonse Mucha', 'John Singer Sargent', 'Greg Rutkowski', 'Wlop'],
    lighting: ['柔和侧光', '黄金时刻光线', '电影级打光', '伦勃朗光', '霓虹背光'],
  },
  风景: {
    adjectives: ['壮丽的', '朦胧的', '翠绿的', '金色的', '童话般的', '末日的', '宁静的', '史诗级的'],
    mediums: ['风光摄影', '概念艺术', '油画', '水墨画', 'Minecraft风格', '3D渲染'],
    artists: ['Ansel Adams', 'Bob Ross', 'Studio Ghibli', 'Craig Mullins'],
    lighting: ['黎明微光', '夕阳余晖', '暴风雨前的光线', '极光', '雾气弥漫的光'],
  },
  抽象: {
    adjectives: ['流动的', '几何的', '有机的', '破碎的', '高对比的', '和谐的', '混沌的', '冥想般的'],
    mediums: ['丙烯泼墨', '数字生成艺术', '混合媒介', '流体艺术', 'Glitch art'],
    artists: ['Jackson Pollock', 'Wassily Kandinsky', 'Refik Anadol', 'teamLab'],
    lighting: ['自发光', '投影光', '多色光污染', '暗室聚光'],
  },
  赛博朋克: {
    adjectives: ['霓虹闪烁的', '雨天的', '高科技低生活的', '全息投影的', '反乌托邦的', '未来东京的'],
    mediums: ['概念设计', '3D渲染', '动漫风格', '数字插画'],
    artists: ['Syd Mead', 'Moebius', 'Josan Gonzalez', 'Makoto Shinkai'],
    lighting: ['霓虹灯', '全息光', '下雨反光', '电子屏幕发光', '赛博朋克夜景'],
  },
  水彩: {
    adjectives: ['柔和晕染的', '透明的', '诗意的', '薄涂的', '清新的', '印象派的'],
    mediums: ['纸上水彩', '水彩插画', '水墨淡彩', '白描设色'],
    artists: ['Joseph Zbukvic', '黄永玉', '吴冠中', 'Alvaro Castagnet'],
    lighting: ['窗外柔光', '阴天散射光', '水彩纸纹理光'],
  },
  像素: {
    adjectives: ['复古的', '16-bit的', '芯片音乐感的', '点阵感的', '怀旧的', '极简像素的'],
    mediums: ['像素艺术', 'Game Boy调色板', 'SNES风格', 'DOS游戏'],
    artists: ['Paul Robertson', 'Pixel Jeff', 'Gustavo Viselner'],
    lighting: ['CRT辉光', 'LCD点阵', '暗室屏幕光'],
  },
  '3D渲染': {
    adjectives: ['超写实的', '等距视角的', '低多边形的', '有体积感的', '电影质感的'],
    mediums: ['Octane渲染', 'Blender Cycles', 'Marmoset渲染', 'Unreal Engine 5'],
    artists: ['Beeple', 'Simon Stålenhag', 'Ian Hubert', 'Rutger van de Steeg'],
    lighting: ['全局光照', '体积光', 'HDRI环境光', '三点打光', '工作室柔光箱'],
  },
  中国风: {
    adjectives: ['水墨淋漓的', '工笔细腻的', '留白意境的', '唐宋古韵的', '仙气飘渺的', '青绿山水的'],
    mediums: ['宣纸水墨', '绢本工笔', '青绿山水', '界画', '浮世绘融合'],
    artists: ['范宽', '倪瓒', '张大千', '宋徽宗', '林曦'],
    lighting: ['宣纸漫射光', '绢本透光', '古画装裱感', '薄雾晨光'],
  },
}

const SUBJECTS = [
  '一只在樱花树下打盹的猫',
  '漂浮在云海之上的岛屿',
  '废弃的未来城市地铁站',
  '穿着宇航服的小孩在花园里',
  '雨夜的九龙城寨',
  '玻璃穹顶下的古老图书馆',
  '赛博茶馆里的老者',
  '被常春藤吞没的摩天大楼',
  '鲸鱼跃出极光下的海面',
  '沙漠中巨大的机械雕像',
  '一位在窗边写信的少女',
  '水晶洞穴中的萤火虫',
  '蒸汽朋克风格的空中飞艇',
  '古镇清晨的石板路',
  '量子计算机的核心芯片',
]

const COLOR_PALETTES: string[][] = [
  ['#1e293b', '#334155', '#64748b', '#e2e8f0', '#f87171', '#fbbf24'],
  ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#78350f'],
  ['#ecfeff', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#155e75'],
  ['#fdf4ff', '#fae8ff', '#f0abfc', '#e879f9', '#c026d3', '#86198f'],
  ['#052e16', '#14532d', '#166534', '#16a34a', '#4ade80', '#bbf7d0'],
  ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#fafafa', '#ef4444'],
]

function uid() { return Math.random().toString(36).slice(2, 9) }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export default function IdeaBoard() {
  const addNotification = useStore(s => s.addNotification)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState('#a78bfa')
  const [brushSize, setBrushSize] = useState(4)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [drawing, setDrawing] = useState(false)

  const [ideas, setIdeas] = useState<IdeaCard[]>([
    { id: uid(), text: '双击卡片编辑，拖动移动位置', color: COLOR_PALETTES[2][3], x: 60, y: 50 },
    { id: uid(), text: '点「AI灵感」获取随机提示词', color: COLOR_PALETTES[4][3], x: 280, y: 110 },
    { id: uid(), text: '把想法画出来，附在旁边', color: COLOR_PALETTES[1][4], x: 500, y: 60 },
  ])
  const [draggingIdea, setDraggingIdea] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)

  // Prompt generator state
  const [category, setCategory] = useState<PromptCategory>('赛博朋克')
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')

  // Redraw
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = canvasWrapRef.current
    if (!canvas || !wrap) return
    const W = wrap.clientWidth, H = wrap.clientHeight
    canvas.width = W * devicePixelRatio
    canvas.height = H * devicePixelRatio
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.clearRect(0, 0, W, H)

    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      const step = 24
      for (let x = 0; x <= W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y <= H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes
    for (const s of allStrokes) {
      ctx.strokeStyle = s.tool === 'eraser' ? 'rgba(255,0,0,0)' : s.color
      ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.lineWidth = s.size

      if (s.tool === 'text' && s.text && s.x !== undefined && s.y !== undefined) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.font = `${s.size * 4}px 'Noto Sans SC', system-ui, sans-serif`
        ctx.fillStyle = s.color
        ctx.fillText(s.text, s.x, s.y)
        continue
      }

      if (s.tool === 'pencil' || s.tool === 'eraser') {
        if (s.points.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(s.points[0].x, s.points[0].y)
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y)
        }
        ctx.stroke()
      } else if (s.tool === 'line' && s.points.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(s.points[0].x, s.points[0].y)
        ctx.lineTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y)
        ctx.stroke()
      } else if (s.tool === 'rect' && s.points.length >= 2) {
        const a = s.points[0], b = s.points[s.points.length - 1]
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
      } else if (s.tool === 'circle' && s.points.length >= 2) {
        const a = s.points[0], b = s.points[s.points.length - 1]
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2
        const rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [strokes, currentStroke, showGrid])

  useEffect(() => { redraw() }, [redraw])
  useEffect(() => {
    const onResize = () => redraw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [redraw])

  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent) => {
    if (tool === 'text') {
      const pos = getCanvasPos(e)
      const text = window.prompt('输入文字:', '文字')
      if (text) {
        const s: Stroke = {
          points: [], color, size: brushSize, tool: 'text',
          text, x: pos.x, y: pos.y,
        }
        setStrokes(prev => [...prev, s])
        setRedoStack([])
      }
      return
    }
    const pos = getCanvasPos(e)
    setDrawing(true)
    setCurrentStroke({
      tool, color, size: brushSize,
      points: [pos],
    })
  }

  const moveDraw = (e: React.MouseEvent) => {
    if (!drawing || !currentStroke) return
    const pos = getCanvasPos(e)
    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, pos] })
    } else {
      setCurrentStroke({ ...currentStroke, points: [currentStroke.points[0], pos] })
    }
  }

  const endDraw = () => {
    if (!drawing || !currentStroke) return
    setDrawing(false)
    setStrokes(prev => [...prev, currentStroke])
    setCurrentStroke(null)
    setRedoStack([])
  }

  const undo = () => {
    if (!strokes.length) return
    const last = strokes[strokes.length - 1]
    setStrokes(prev => prev.slice(0, -1))
    setRedoStack(prev => [...prev, last])
  }
  const redo = () => {
    if (!redoStack.length) return
    const last = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    setStrokes(prev => [...prev, last])
  }
  const clearCanvas = () => {
    if (!strokes.length) return
    if (!confirm('确定清空画板？')) return
    setStrokes([])
    setRedoStack([])
  }

  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `idea-board-${Date.now()}.png`
    a.click()
    addNotification({ title: '已导出', message: 'PNG 图片已下载', type: 'success', duration: 1600 })
  }

  // Idea cards
  const addIdea = () => {
    const card: IdeaCard = {
      id: uid(),
      text: generatedPrompt || '新的灵感卡片',
      color: pick(pick(COLOR_PALETTES.map(p => p.filter((_, i) => i >= 3 && i <= 5)))),
      x: 60 + Math.random() * 180,
      y: 40 + Math.random() * 120,
    }
    setIdeas(prev => [...prev, card])
  }
  const deleteIdea = (id: string) => setIdeas(prev => prev.filter(i => i.id !== id))
  const ideaStart = (e: React.MouseEvent, id: string) => {
    const card = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const wrap = canvasWrapRef.current?.getBoundingClientRect()
    if (!wrap) return
    setDraggingIdea({
      id,
      dx: e.clientX - card.left,
      dy: e.clientY - card.top,
    })
  }
  const ideaMove = (e: React.MouseEvent) => {
    if (!draggingIdea) return
    const wrap = canvasWrapRef.current?.getBoundingClientRect()
    if (!wrap) return
    const x = e.clientX - wrap.left - draggingIdea.dx
    const y = e.clientY - wrap.top - draggingIdea.dy
    setIdeas(prev => prev.map(i => i.id === draggingIdea.id ? { ...i, x: Math.max(0, x), y: Math.max(0, y) } : i))
  }
  const ideaEnd = () => setDraggingIdea(null)

  // Prompt generator
  const generatePrompt = () => {
    const style = PROMPT_STYLES[category]
    const subject = pick(SUBJECTS)
    const adj1 = pick(style.adjectives)
    const adj2 = pick(style.adjectives.filter(a => a !== adj1))
    const medium = pick(style.mediums)
    const artist = pick(style.artists)
    const light = pick(style.lighting)
    const p = `${adj1}${adj2}的${subject}，以${medium}呈现，参考${artist}的风格，${light}，细节丰富，高画质，8K分辨率`
    setGeneratedPrompt(p)
    addNotification({ title: '✨ 灵感生成', message: category + '提示词已就绪', type: 'info', duration: 1500 })
  }
  const copyPrompt = async () => {
    if (!generatedPrompt) return
    try {
      await navigator.clipboard.writeText(generatedPrompt)
      addNotification({ title: '已复制', message: '提示词已复制到剪贴板', type: 'success', duration: 1500 })
    } catch {}
  }

  const tools: { id: Tool; label: string; Icon: typeof Pencil }[] = [
    { id: 'pencil', label: '画笔', Icon: Pencil },
    { id: 'eraser', label: '橡皮', Icon: Eraser },
    { id: 'line', label: '直线', Icon: Minus },
    { id: 'rect', label: '矩形', Icon: Square },
    { id: 'circle', label: '圆形', Icon: Circle },
    { id: 'text', label: '文字', Icon: Type },
  ]

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', color: 'var(--text-primary)' }}
      onMouseMove={ideaMove}
      onMouseUp={ideaEnd}
      onMouseLeave={ideaEnd}
    >
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)',
      }}>
        <div style={{ display: 'inline-flex', padding: 3, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--window-border)', gap: 2 }}>
          {tools.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              style={{
                ...tbBtn,
                background: tool === id ? 'var(--accent)' : 'transparent',
                color: tool === id ? '#fff' : 'var(--text-primary)',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--window-border)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--window-border)', background: 'rgba(255,255,255,0.03)' }}>
          <Palette size={14} style={{ opacity: .7 }} />
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{ width: 24, height: 22, border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}
          />
          {COLOR_PALETTES.map((pal, i) => (
            <div key={i} style={{ display: 'flex' }} onClick={() => setColor(pal[3])} title="调色板">
              {pal.slice(-3).map((c, j) => (
                <div key={j} style={{ width: 11, height: 18, background: c, borderRadius: j === 0 ? 4 : 0, borderTopRightRadius: j === 2 ? 4 : 0, borderBottomRightRadius: j === 2 ? 4 : 0, cursor: 'pointer' }} />
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--window-border)', background: 'rgba(255,255,255,0.03)' }}>
          <Hash size={13} style={{ opacity: .6 }} />
          <input
            type="range" min={1} max={40} value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            style={{ width: 90 }}
          />
          <span style={{ fontSize: 11, minWidth: 20, textAlign: 'right', color: 'var(--text-secondary)' }}>{brushSize}</span>
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--window-border)' }} />

        <button style={tbBtn} onClick={undo} title="撤销 (Ctrl+Z)"><Undo2 size={15} /></button>
        <button style={tbBtn} onClick={redo} title="重做 (Ctrl+Y)"><Redo2 size={15} /></button>
        <button style={tbBtn} onClick={clearCanvas} title="清空"><Trash2 size={15} /></button>
        <button style={tbBtn} onClick={() => setShowGrid(g => !g)} title="网格">{showGrid ? <Grid3X3 size={15} /> : <EyeOff size={15} />}</button>
        <button style={tbBtn} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={15} /></button>
        <span style={{ fontSize: 11, minWidth: 34, textAlign: 'center', color: 'var(--text-secondary)' }}>{Math.round(zoom * 100)}%</span>
        <button style={tbBtn} onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={15} /></button>
        <button style={{ ...tbBtn, background: 'var(--accent)', color: '#fff' }} onClick={exportPNG} title="导出PNG"><Download size={15} /></button>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button style={tbBtn} onClick={() => setIdeas([])} title="清空卡片"><Layers size={15} /></button>
          <button style={{ ...tbBtn, background: 'linear-gradient(135deg,#f472b6,#a78bfa)', color: '#fff' }} onClick={addIdea} title="粘贴为卡片">
            <Lightbulb size={15} />
            <span style={{ fontSize: 12, marginLeft: 4 }}>灵感卡片</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: Prompt panel */}
        <div style={{
          width: 300, borderRight: '1px solid var(--window-border)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(139,92,246,0.04) 100%)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={16} style={{ color: '#f472b6' }} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>AI 灵感生成器</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
              选择风格，生成高质量的 AI 图像提示词
            </div>
            <div style={{ fontSize: 11, marginBottom: 6, color: 'var(--text-secondary)' }}>艺术风格</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {(Object.keys(PROMPT_STYLES) as PromptCategory[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    fontSize: 11, padding: '5px 10px', borderRadius: 999,
                    border: '1px solid ' + (category === c ? 'var(--accent)' : 'var(--window-border)'),
                    background: category === c ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'rgba(255,255,255,0.03)',
                    color: category === c ? 'var(--accent)' : 'var(--text-primary)',
                    cursor: 'pointer', fontWeight: 500,
                  }}
                >{c}</button>
              ))}
            </div>

            <button
              onClick={generatePrompt}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9, border: 0,
                background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fbbf24 100%)',
                color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 20px rgba(167,139,250,0.3)',
              }}
            >
              <Wand2 size={15} />
              生成提示词
            </button>
          </div>

          {generatedPrompt && (
            <div style={{ margin: '0 14px', padding: '12px', borderRadius: 10, border: '1px solid var(--window-border)', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-primary)', marginBottom: 10 }}>
                {generatedPrompt}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={copyPrompt} style={{ ...pillBtn, flex: 1, background: 'var(--accent)', color: '#fff' }}>
                  <Copy size={12} /> 复制
                </button>
                <button onClick={addIdea} style={{ ...pillBtn, flex: 1 }}>
                  <Plus size={12} /> 生成卡片
                </button>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--window-border)', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 11, marginBottom: 4 }}>使用提示</div>
            · 双击卡片可编辑文字<br />
            · 右键卡片可删除<br />
            · 画笔支持自由绘画<br />
            · 导出 PNG 会包含所有卡片
          </div>
        </div>

        {/* Canvas area */}
        <div ref={canvasWrapRef} style={{
          flex: 1, position: 'relative', overflow: 'auto',
          background: 'radial-gradient(ellipse at 20% 10%, rgba(139,92,246,0.10) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(244,114,182,0.10) 0%, transparent 50%), #0a0a12',
        }}>
          <canvas
            ref={canvasRef}
            style={{
              cursor: tool === 'eraser' ? 'cell' : tool === 'move' ? 'grab' : 'crosshair',
              display: 'block', transform: `scale(${zoom})`, transformOrigin: 'top left',
            }}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
          />

          {/* Idea Cards */}
          {ideas.map(card => (
            <div
              key={card.id}
              onMouseDown={e => ideaStart(e, card.id)}
              onDoubleClick={() => setEditingId(card.id)}
              onContextMenu={e => { e.preventDefault(); deleteIdea(card.id) }}
              style={{
                position: 'absolute',
                left: card.x, top: card.y,
                minWidth: 170, maxWidth: 260,
                padding: '12px 14px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${card.color}25 0%, ${card.color}12 100%)`,
                border: `1px solid ${card.color}66`,
                boxShadow: `0 8px 30px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03) inset`,
                color: 'var(--text-primary)',
                cursor: draggingIdea?.id === card.id ? 'grabbing' : 'grab',
                backdropFilter: 'blur(8px)',
                userSelect: 'none',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              {editingId === card.id ? (
                <textarea
                  autoFocus
                  defaultValue={card.text}
                  onBlur={e => {
                    setIdeas(prev => prev.map(i => i.id === card.id ? { ...i, text: e.target.value } : i))
                    setEditingId(null)
                  }}
                  onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                  style={{
                    width: '100%', minHeight: 60,
                    background: 'rgba(0,0,0,0.2)', border: `1px solid ${card.color}88`,
                    borderRadius: 6, padding: 6,
                    color: 'inherit', fontSize: 12, lineHeight: 1.6,
                    resize: 'vertical', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>{card.text}</div>
              )}
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 6, height: 6, borderRadius: '50%',
                background: card.color, boxShadow: `0 0 8px ${card.color}`,
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const tbBtn: React.CSSProperties = {
  width: 32, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: 0, cursor: 'pointer',
  background: 'transparent', color: 'var(--text-primary)',
  transition: 'all .15s',
}

const pillBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  padding: '6px 10px', borderRadius: 7, border: '1px solid var(--window-border)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)',
  fontSize: 11, cursor: 'pointer', fontWeight: 500,
}
