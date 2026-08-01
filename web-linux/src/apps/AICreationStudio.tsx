import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles, Image, Type, Palette, Download, Copy,
  RefreshCw, Loader2, Wand,
  Grid3x3, Zap, PenTool, Eraser, Undo2, Redo2
} from 'lucide-react'

type Tab = 'image' | 'text' | 'palette' | 'layout'

const ART_STYLES = [
  { id: 'realistic', name: '写实摄影', prompt: 'photorealistic, high detail, 8k' },
  { id: 'cyberpunk', name: '赛博朋克', prompt: 'cyberpunk style, neon lights, futuristic, moody' },
  { id: 'watercolor', name: '水彩画', prompt: 'watercolor painting, soft edges, artistic' },
  { id: 'anime', name: '动漫风格', prompt: 'anime style, vibrant colors, detailed illustration' },
  { id: 'oil', name: '油画', prompt: 'oil painting, classical, textured brushstrokes' },
  { id: 'pixel', name: '像素艺术', prompt: 'pixel art, 16-bit style, retro game aesthetic' },
  { id: 'minimalist', name: '极简主义', prompt: 'minimalist design, clean lines, negative space' },
  { id: 'fantasy', name: '奇幻风格', prompt: 'fantasy art, magical, ethereal, dramatic lighting' }
]

const MODELS = ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo']
const RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4']

const TEXT_TEMPLATES = [
  { type: '标题', template: '震撼的{主题}：{副标题}的革命', example: 'AI创作：数字艺术的新纪元' },
  { type: '描述', template: '探索{领域}的无限可能，{描述}，让{目标受众}能够{行动}。', example: '探索人工智能的无限可能，让创作者能够释放想象力。' },
  { type: '口号', template: '用{产品}，{动词}未来', example: '用AI，创造未来' },
  { type: '邮件', template: '您好！关于{主题}，我们想与您分享{内容}。期待您的反馈。', example: '您好！关于合作意向，我们想与您分享最新方案。期待您的反馈。' },
  { type: '社交媒体', template: '{emoji} {要点1} {emoji}\n\n{要点2}\n\n#{标签}', example: '✨ 新功能上线 ✨\n\nAI创作工作室正式发布！\n\n#AI #创作 #创新' }
]

const COLOR_PALETTES = [
  { name: '赛博霓虹', colors: ['#0f0f23', '#1a1a3e', '#ff006e', '#8338ec', '#3a86ff'] },
  { name: '自然大地', colors: ['#2d5a27', '#5a8c4a', '#a8c590', '#d4a76a', '#8b6f47'] },
  { name: '海洋深蓝', colors: ['#0a192f', '#112240', '#233554', '#5eead4', '#ccd6f6'] },
  { name: '日落橙红', colors: ['#2d1b3d', '#6a1b9a', '#c2185b', '#ff6f00', '#ffc107'] },
  { name: '森林翠绿', colors: ['#0d1b2a', '#1b263b', '#2d6a4f', '#52b788', '#b7e4c7'] },
  { name: '樱花粉调', colors: ['#faf0f5', '#ffd6e0', '#ffb3c6', '#ff8fab', '#c9184a'] }
]

export default function AICreationStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('image')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState(ART_STYLES[0])
  const [model, setModel] = useState(MODELS[0])
  const [ratio, setRatio] = useState(RATIOS[0])
  const [loading, setLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [history, setHistory] = useState<{ prompt: string; url: string; time: string }[]>([])
  
  const [textInput, setTextInput] = useState('')
  const [textOutput, setTextOutput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(TEXT_TEMPLATES[0])
  const [variables, setVariables] = useState<Record<string, string>>({})
  
  const [selectedPalette, setSelectedPalette] = useState(COLOR_PALETTES[0])
  const [paletteHistory, setPaletteHistory] = useState<string[][]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#8b5cf6')
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])

  const generateImage = useCallback(async () => {
    if (!prompt.trim()) {
      alert('请输入创作提示词')
      return
    }
    setLoading(true)
    const enhancedPrompt = `${prompt}, ${style.prompt}`
    const [width, height] = ratio.split(':').map(Number)
    const seed = Math.floor(Math.random() * 1000000)
    
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width * 256}&height=${height * 256}&model=${model}&seed=${seed}&nologo=true`
    
    setGeneratedImages(prev => [url, ...prev].slice(0, 12))
    setSelectedImage(url)
    setHistory(prev => [{ prompt: enhancedPrompt, url, time: new Date().toLocaleTimeString() }, ...prev])
    setLoading(false)
  }, [prompt, style, model, ratio])

  const generateText = useCallback(() => {
    if (!textInput.trim()) return
    
    let result = selectedTemplate.template
    const varMatches = result.match(/\{(\w+)\}/g) || []
    varMatches.forEach(match => {
      const key = match.slice(1, -1)
      result = result.replace(match, variables[key] || `[${key}]`)
    })
    setTextOutput(result)
  }, [textInput, selectedTemplate, variables])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  const downloadImage = useCallback((url: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-creation-${Date.now()}.png`
    a.click()
  }, [])

  const generatePalette = useCallback(() => {
    const baseHue = Math.random() * 360
    const newPalette = Array.from({ length: 5 }, (_, i) => {
      const hue = (baseHue + i * 60) % 360
      return `hsl(${hue}, 70%, ${30 + i * 10}%)`
    })
    setPaletteHistory(prev => [newPalette, ...prev].slice(0, 10))
    return newPalette
  }, [])

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [canvasSize])

  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack(prev => [...prev, imageData])
    setRedoStack([])
    
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushSize
    
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff'
    } else {
      ctx.strokeStyle = brushColor
    }
    
    ctx.beginPath()
    ctx.moveTo(lastPos.x, lastPos.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    
    setLastPos({ x, y })
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleUndo = () => {
    const canvas = canvasRef.current
    if (!canvas || undoStack.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setRedoStack(prev => [...prev, currentImage])
    
    const previousImage = undoStack[undoStack.length - 1]
    ctx.putImageData(previousImage, 0, 0)
    setUndoStack(prev => prev.slice(0, -1))
  }

  const handleRedo = () => {
    const canvas = canvasRef.current
    if (!canvas || redoStack.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack(prev => [...prev, currentImage])
    
    const nextImage = redoStack[redoStack.length - 1]
    ctx.putImageData(nextImage, 0, 0)
    setRedoStack(prev => prev.slice(0, -1))
  }

  const canvasTools = [
    { id: 'brush', name: '画笔', icon: <PenTool size={16} /> },
    { id: 'eraser', name: '橡皮擦', icon: <Eraser size={16} /> }
  ] as const

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sparkles size={24} style={{ color: '#8b5cf6' }} />
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>AI 创作工作室</h1>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '2px 8px', background: 'rgba(139,92,246,0.2)', borderRadius: 10 }}>v2.0</span>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {(['image', 'text', 'palette', 'layout'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab ? 'rgba(139,92,246,0.3)' : 'transparent',
                border: `1px solid ${activeTab === tab ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13
              }}
            >
              {tab === 'image' && <Image size={14} />}
              {tab === 'text' && <Type size={14} />}
              {tab === 'palette' && <Palette size={14} />}
              {tab === 'layout' && <Grid3x3 size={14} />}
              {tab === 'image' && 'AI生图'}
              {tab === 'text' && '文案生成'}
              {tab === 'palette' && '配色方案'}
              {tab === 'layout' && '画布绘制'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Controls */}
        <div style={{
          width: 320,
          padding: 20,
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          overflowY: 'auto'
        }}>
          {activeTab === 'image' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>创作提示词</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想创建的图像，例如：一个在星空下漫步的赛博朋克少女..."
                  style={{
                    width: '100%',
                    height: 100,
                    padding: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>艺术风格</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ART_STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s)}
                      style={{
                        padding: '6px 10px',
                        background: style.id === s.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${style.id === s.id ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>模型选择</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 13
                  }}
                >
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>画面比例</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {RATIOS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRatio(r)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: ratio === r ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${ratio === r ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateImage}
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> 生成中...</> : <><Wand size={18} /> 生成图像</>}
              </button>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                基于 Pollinations.ai 免费 API
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>选择文案模板</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {TEXT_TEMPLATES.map(t => (
                    <button
                      key={t.type}
                      onClick={() => setSelectedTemplate(t)}
                      style={{
                        padding: '10px 12px',
                        background: selectedTemplate.type === t.type ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${selectedTemplate.type === t.type ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 8,
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t.type}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{t.template}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>输入主题</label>
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="输入文案主题或关键信息..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>模板变量</label>
                {Object.keys(selectedTemplate.template.match(/\{(\w+)\}/g) || {}).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(selectedTemplate.template.match(/\{(\w+)\}/g) || []).map(match => {
                      const key = match.slice(1, -1)
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', width: 60 }}>{key}:</span>
                          <input
                            value={variables[key] || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder={`填写${key}`}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: 6,
                              color: '#fff',
                              fontSize: 12,
                              outline: 'none'
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>该模板无需变量</div>
                )}
              </div>

              <button
                onClick={generateText}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Zap size={16} /> 生成文案
              </button>
            </div>
          )}

          {activeTab === 'palette' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button
                onClick={() => {
                  const newPalette = generatePalette()
                  setPaletteHistory(prev => [newPalette, ...prev].slice(0, 10))
                }}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Palette size={18} /> 随机生成配色
              </button>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>预设配色方案</label>
                {COLOR_PALETTES.map(palette => (
                  <div
                    key={palette.name}
                    onClick={() => setSelectedPalette(palette)}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      background: selectedPalette.name === palette.name ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${selectedPalette.name === palette.name ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: 13, marginBottom: 8 }}>{palette.name}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {palette.colors.map((color, i) => (
                        <div
                          key={i}
                          style={{
                            width: 30,
                            height: 30,
                            background: color,
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {paletteHistory.length > 0 && (
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>历史配色</label>
                  {paletteHistory.map((palette, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPalette({ name: '历史 ' + (i + 1), colors: palette })}
                      style={{
                        display: 'flex',
                        gap: 4,
                        marginBottom: 6,
                        cursor: 'pointer'
                      }}
                    >
                      {palette.map((color, j) => (
                        <div
                          key={j}
                          style={{
                            flex: 1,
                            height: 20,
                            background: color,
                            borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'layout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>画布尺寸</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    value={canvasSize.width}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.5)', alignSelf: 'center' }}>×</span>
                  <input
                    type="number"
                    value={canvasSize.height}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>绘图工具</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {canvasTools.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: tool === t.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${tool === t.id ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 12
                      }}
                    >
                      {t.icon} {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>画笔大小: {brushSize}px</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'block' }}>画笔颜色</label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: undoStack.length === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <Undo2 size={14} /> 撤销
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: redoStack.length === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <Redo2 size={14} /> 重做
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div style={{ flex: 1, padding: 20, overflow: 'auto', background: 'rgba(0,0,0,0.2)' }}>
          {activeTab === 'image' && (
            <div>
              {selectedImage && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center'
                  }}>
                    <img
                      src={selectedImage}
                      alt="生成结果"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 400,
                        borderRadius: 8,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                      }}
                    />
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={() => downloadImage(selectedImage)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(139,92,246,0.3)',
                          border: '1px solid rgba(139,92,246,0.5)',
                          borderRadius: 6,
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Download size={14} /> 下载
                      </button>
                      <button
                        onClick={() => copyToClipboard(selectedImage)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Copy size={14} /> 复制链接
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {generatedImages.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>生成历史</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                    {generatedImages.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        style={{
                          aspectRatio: '1',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: 8,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: selectedImage === url ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <img src={url} alt={`生成 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>创作记录</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {history.slice(0, 10).map((h, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 10,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 6,
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.6)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedImage(h.url)}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt}</div>
                        <div style={{ marginTop: 4, fontSize: 11 }}>{h.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>生成结果</h3>
              {textOutput ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    padding: 20,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                    lineHeight: 1.6
                  }}>
                    {textOutput}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => copyToClipboard(textOutput)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(139,92,246,0.3)',
                        border: '1px solid rgba(139,92,246,0.5)',
                        borderRadius: 6,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Copy size={14} /> 复制
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 60,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  <Type size={48} style={{ margin: '0 auto 16px' }} />
                  <p>输入主题和变量，点击"生成文案"查看结果</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'palette' && (
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>当前配色方案</h3>
              <div style={{
                padding: 20,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12
              }}>
                <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 500 }}>{selectedPalette.name}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {selectedPalette.colors.map((color, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        aspectRatio: '1',
                        background: color,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedPalette.colors.map((color, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, background: color, borderRadius: 4 }} />
                      <code style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{color}</code>
                      <button
                        onClick={() => copyToClipboard(color)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: 4,
                          color: 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          fontSize: 11
                        }}
                      >
                        复制
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div>
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  maxWidth: '100%',
                  background: '#fff',
                  borderRadius: 12,
                  cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}
              />
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    const canvas = canvasRef.current
                    if (!canvas) return
                    const link = canvas.toDataURL('image/png')
                    const a = document.createElement('a')
                    a.href = link
                    a.download = `canvas-${Date.now()}.png`
                    a.click()
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(139,92,246,0.3)',
                    border: '1px solid rgba(139,92,246,0.5)',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Download size={14} /> 下载画布
                </button>
                <button
                  onClick={initCanvas}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <RefreshCw size={14} /> 清空画布
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
