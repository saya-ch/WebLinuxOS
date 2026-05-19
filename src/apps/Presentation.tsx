import { useState } from 'react'

interface Slide {
  id: string
  title: string
  content: string
  bgColor: string
}

const TEMPLATE_SLIDES: Slide[] = [
  { id: 's1', title: '欢迎使用演示文稿', content: '点击左侧幻灯片进行编辑\n\n在此添加您的精彩内容', bgColor: '#1a1a2e' },
  { id: 's2', title: '项目介绍', content: '• 项目背景\n• 核心功能\n• 技术架构\n• 未来规划', bgColor: '#16213e' },
  { id: 's3', title: '核心功能', content: '1. 功能一：详细描述\n2. 功能二：详细描述\n3. 功能三：详细描述\n4. 功能四：详细描述', bgColor: '#0f3460' },
  { id: 's4', title: '技术架构', content: '前端: React + TypeScript\n状态管理: Zustand\n样式: CSS + 内联样式\n构建工具: Vite', bgColor: '#533483' },
  { id: 's5', title: '谢谢观看', content: '感谢您的关注！\n\n有任何问题欢迎交流\n\n📧 contact@example.com', bgColor: '#1a1a2e' },
]

export default function Presentation() {
  const [slides, setSlides] = useState<Slide[]>(TEMPLATE_SLIDES)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const [addTextMode, setAddTextMode] = useState(false)
  const [shapeTool, setShapeTool] = useState<'rect' | 'circle' | 'line' | null>(null)
  const [shapes, setShapes] = useState<{ id: string; type: 'rect' | 'circle' | 'line'; x: number; y: number; w: number; h: number; color: string }[]>([])

  const slide = slides[currentSlide]

  const updateSlide = (field: 'title' | 'content', value: string) => {
    setSlides((prev) => prev.map((s, i) => i === currentSlide ? { ...s, [field]: value } : s))
  }

  const addSlide = () => {
    const newSlide: Slide = { id: `s${Date.now()}`, title: '新幻灯片', content: '在此添加内容...', bgColor: '#16213e' }
    setSlides((prev) => [...prev, newSlide])
    setCurrentSlide(slides.length)
  }

  const deleteSlide = () => {
    if (slides.length <= 1) return
    setSlides((prev) => prev.filter((_, i) => i !== currentSlide))
    setCurrentSlide(Math.max(0, currentSlide - 1))
  }

  const addShape = (type: 'rect' | 'circle' | 'line') => {
    const id = `shape-${Date.now()}`
    setShapes((prev) => [...prev, { id, type, x: 50, y: 50, w: type === 'line' ? 200 : 100, h: type === 'line' ? 2 : 80, color: '#e94560' }])
  }

  if (presentMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: slide.bgColor, color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 30, color: '#e94560' }}>{slide.title}</h1>
          <div style={{ fontSize: 18, lineHeight: 2, whiteSpace: 'pre-wrap', maxWidth: 700, color: '#ddd' }}>{slide.content}</div>
          {shapes.map((s) => (
            <div key={s.id} style={{
              position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
              width: `${s.w}px`, height: `${s.h}px`,
              background: s.type === 'circle' ? s.color : s.type === 'rect' ? s.color : 'transparent',
              borderRadius: s.type === 'circle' ? '50%' : 0,
              borderTop: s.type === 'line' ? `2px solid ${s.color}` : 'none'
            }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} style={presBtn} disabled={currentSlide === 0}>◀ 上一页</button>
          <span style={{ color: '#aaa', fontSize: 13 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} style={presBtn} disabled={currentSlide === slides.length - 1}>下一页 ▶</button>
          <button onClick={() => setPresentMode(false)} style={{ ...presBtn, background: '#e94560' }}>退出演示</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={{ width: 180, background: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #333' }}>幻灯片</div>
        <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              style={{
                padding: '8px 10px', cursor: 'pointer', borderRadius: 4, marginBottom: 4,
                background: i === currentSlide ? '#094771' : 'transparent',
                border: i === currentSlide ? '1px solid #007acc' : '1px solid transparent',
                fontSize: 12
              }}
              onClick={() => setCurrentSlide(i)}
            >
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {i + 1}. {s.title}
              </div>
              <div style={{ height: 50, background: s.bgColor, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                {s.content.slice(0, 30)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 8, borderTop: '1px solid #333', display: 'flex', gap: 4 }}>
          <button onClick={addSlide} style={slideBtn}>+ 新建</button>
          <button onClick={deleteSlide} style={{ ...slideBtn, background: '#c0392b', flex: 0 }}>🗑</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#2d2d2d', borderBottom: '1px solid #444' }}>
          <button onClick={() => setPresentMode(true)} style={{ ...slideBtn, background: '#007acc' }}>▶ 演示</button>
          <div style={{ width: 1, height: 20, background: '#555', margin: '0 4px' }} />
          <button onClick={() => setAddTextMode(!addTextMode)} style={{ ...slideBtn, background: addTextMode ? '#007acc' : 'transparent' }}>📝 文本</button>
          <button onClick={() => { addShape('rect'); setShapeTool('rect') }} style={{ ...slideBtn, background: shapeTool === 'rect' ? '#007acc' : 'transparent' }}>⬛ 矩形</button>
          <button onClick={() => { addShape('circle'); setShapeTool('circle') }} style={{ ...slideBtn, background: shapeTool === 'circle' ? '#007acc' : 'transparent' }}>⭕ 圆形</button>
          <button onClick={() => { addShape('line'); setShapeTool('line') }} style={{ ...slideBtn, background: shapeTool === 'line' ? '#007acc' : 'transparent' }}>📏 线条</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>{currentSlide + 1}/{slides.length}</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden' }}>
          <div style={{
            width: '100%', maxWidth: 720, aspectRatio: '16/9', background: slide.bgColor,
            borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 40, overflow: 'hidden'
          }}>
            {editingTitle ? (
              <input
                value={slide.title}
                onChange={(e) => updateSlide('title', e.target.value)}
                onBlur={() => setEditingTitle(false)}
                autoFocus
                style={{
                  fontSize: 28, fontWeight: 700, background: 'rgba(255,255,255,0.1)', border: '1px solid #555',
                  color: '#fff', padding: '4px 12px', textAlign: 'center', borderRadius: 4, outline: 'none', marginBottom: 20, width: '80%'
                }}
              />
            ) : (
              <h2
                style={{ fontSize: 28, fontWeight: 700, color: '#e94560', marginBottom: 20, cursor: 'pointer', textAlign: 'center' }}
                onClick={() => setEditingTitle(true)}
              >
                {slide.title}
              </h2>
            )}

            {editingContent ? (
              <textarea
                value={slide.content}
                onChange={(e) => updateSlide('content', e.target.value)}
                onBlur={() => setEditingContent(false)}
                autoFocus
                style={{
                  width: '80%', height: 200, background: 'rgba(255,255,255,0.1)', border: '1px solid #555',
                  color: '#ddd', padding: 12, fontSize: 16, borderRadius: 4, outline: 'none', resize: 'none', lineHeight: 1.8
                }}
              />
            ) : (
              <div
                style={{ fontSize: 16, lineHeight: 2, whiteSpace: 'pre-wrap', color: '#ddd', cursor: 'pointer', textAlign: 'center', maxWidth: '80%' }}
                onClick={() => setEditingContent(true)}
              >
                {slide.content}
              </div>
            )}

            {shapes.map((s) => (
              <div key={s.id} style={{
                position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                width: `${s.w}px`, height: `${s.h}px`,
                background: s.type === 'circle' ? s.color : s.type === 'rect' ? s.color : 'transparent',
                borderRadius: s.type === 'circle' ? '50%' : 0,
                borderTop: s.type === 'line' ? `2px solid ${s.color}` : 'none',
                cursor: 'pointer'
              }} />
            ))}

            <div style={{ position: 'absolute', bottom: 12, color: '#555', fontSize: 10 }}>
              点击标题或内容区域编辑 | 使用上方工具栏添加形状
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', background: '#007acc', color: '#fff', fontSize: 11 }}>
          <span>幻灯片 {currentSlide + 1}/{slides.length}</span>
          <span>点击 ▶ 演示 进入全屏演示模式</span>
        </div>
      </div>
    </div>
  )
}

const slideBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #555', color: '#ccc', cursor: 'pointer',
  padding: '4px 10px', borderRadius: 3, fontSize: 12
}

const presBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
  cursor: 'pointer', padding: '6px 16px', borderRadius: 4, fontSize: 13
}