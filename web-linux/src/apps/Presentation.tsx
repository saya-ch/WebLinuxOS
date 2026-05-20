import { useState, useEffect, useCallback } from 'react'

interface Slide {
  id: string
  title: string
  content: string
  bgColor: string
  fontSize: number
  fontColor: string
  textAlign: 'left' | 'center' | 'right'
  layout: 'title' | 'content' | 'two-column' | 'image' | 'data' | 'quote' | 'end' | 'blank'
}

const GRADIENT_BACKGROUNDS = [
  { id: 'g1', label: '深蓝夜空', value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { id: 'g2', label: '紫红渐变', value: 'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)' },
  { id: 'g3', label: '深绿森林', value: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
  { id: 'g4', label: '暗红暮色', value: 'linear-gradient(135deg, #1a0a0a, #4a1a1a, #2a0a0a)' },
  { id: 'g5', label: '极光蓝绿', value: 'linear-gradient(135deg, #0b486b, #f56217)' },
  { id: 'g6', label: '星空紫', value: 'linear-gradient(135deg, #2b1055, #7597de)' },
  { id: 'g7', label: '暗橙日落', value: 'linear-gradient(135deg, #1a0a00, #4a2a00, #1a0a00)' },
  { id: 'g8', label: '深海蓝', value: 'linear-gradient(135deg, #000428, #004e92)' },
  { id: 'g9', label: '暗粉玫瑰', value: 'linear-gradient(135deg, #2b0a1a, #6a1a3a, #2b0a1a)' },
  { id: 'g10', label: '灰银工业', value: 'linear-gradient(135deg, #1a1a2e, #3a3a5e, #1a1a2e)' },
  { id: 'g11', label: '纯黑', value: '#0a0a0a' },
  { id: 'g12', label: '深蓝', value: '#1a1a2e' },
]

const TEMPLATE_SLIDES: Slide[] = [
  { id: 's1', title: '欢迎使用演示文稿', content: '点击左侧幻灯片进行编辑\n\n在此添加您的精彩内容', bgColor: 'linear-gradient(135deg, #2b1055, #7597de)', fontSize: 18, fontColor: '#cdd6f4', textAlign: 'center', layout: 'title' },
  { id: 's2', title: '项目介绍', content: '• 项目背景\n• 核心功能\n• 技术架构\n• 未来规划', bgColor: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', fontSize: 16, fontColor: '#cdd6f4', textAlign: 'left', layout: 'content' },
  { id: 's3', title: '核心功能', content: '左栏内容:\n1. 功能一\n2. 功能二\n3. 功能三\n\n右栏内容:\n1. 优势一\n2. 优势二\n3. 优势三', bgColor: 'linear-gradient(135deg, #000428, #004e92)', fontSize: 14, fontColor: '#cdd6f4', textAlign: 'left', layout: 'two-column' },
  { id: 's4', title: '产品展示', content: '🖼 在此展示产品截图或图片\n\n支持多种图片格式\n拖拽即可添加', bgColor: 'linear-gradient(135deg, #1a0a00, #4a2a00, #1a0a00)', fontSize: 16, fontColor: '#cdd6f4', textAlign: 'center', layout: 'image' },
  { id: 's5', title: '数据概览', content: '用户量: 1,000,000+\n月活跃: 500,000+\n日增长: 2.5%\n满意度: 98.5%', bgColor: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', fontSize: 16, fontColor: '#cdd6f4', textAlign: 'left', layout: 'data' },
  { id: 's6', title: '技术架构', content: '前端: React + TypeScript\n状态管理: Zustand\n样式: CSS + 内联样式\n构建工具: Vite', bgColor: 'linear-gradient(135deg, #1a1a2e, #3a3a5e, #1a1a2e)', fontSize: 16, fontColor: '#cdd6f4', textAlign: 'left', layout: 'content' },
  { id: 's7', title: '引用', content: '"创新不是一蹴而就的，\n而是日积月累的坚持。"\n\n—— 某位智者', bgColor: 'linear-gradient(135deg, #2b0a1a, #6a1a3a, #2b0a1a)', fontSize: 18, fontColor: '#f5c2e7', textAlign: 'center', layout: 'quote' },
  { id: 's8', title: '谢谢观看', content: '感谢您的关注！\n\n有任何问题欢迎交流\n\n📧 contact@example.com', bgColor: 'linear-gradient(135deg, #2b1055, #7597de)', fontSize: 18, fontColor: '#cdd6f4', textAlign: 'center', layout: 'end' },
]

const LAYOUT_LABELS: Record<Slide['layout'], string> = {
  title: '标题页',
  content: '内容页',
  'two-column': '双栏布局',
  image: '图片页',
  data: '数据页',
  quote: '引用页',
  end: '结尾页',
  blank: '空白页',
}

export default function Presentation() {
  const [slides, setSlides] = useState<Slide[]>(TEMPLATE_SLIDES)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const [addTextMode, setAddTextMode] = useState(false)
  const [shapeTool, setShapeTool] = useState<'rect' | 'circle' | 'line' | null>(null)
  const [shapes, setShapes] = useState<{ id: string; type: 'rect' | 'circle' | 'line'; x: number; y: number; w: number; h: number; color: string }[]>([])
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showFormatPanel, setShowFormatPanel] = useState(false)

  const slide = slides[currentSlide]

  const updateSlide = (field: keyof Slide, value: string | number) => {
    setSlides((prev) => prev.map((s, i) => i === currentSlide ? { ...s, [field]: value } : s))
  }

  const addSlide = (layout: Slide['layout'] = 'content') => {
    const newSlide: Slide = {
      id: `s${Date.now()}`,
      title: layout === 'title' ? '新标题页' : layout === 'end' ? '谢谢' : '新幻灯片',
      content: layout === 'quote' ? '"在此输入引用内容"\n\n—— 作者' : '在此添加内容...',
      bgColor: 'linear-gradient(135deg, #1a1a2e, #3a3a5e, #1a1a2e)',
      fontSize: 16,
      fontColor: '#cdd6f4',
      textAlign: 'left',
      layout,
    }
    setSlides((prev) => [...prev, newSlide])
    setCurrentSlide(slides.length)
  }

  const deleteSlide = () => {
    if (slides.length <= 1) return
    setSlides((prev) => prev.filter((_, i) => i !== currentSlide))
    setCurrentSlide(Math.max(0, currentSlide - 1))
  }

  const duplicateSlide = () => {
    const dup = { ...slides[currentSlide], id: `s${Date.now()}` }
    setSlides((prev) => [...prev.slice(0, currentSlide + 1), dup, ...prev.slice(currentSlide + 1)])
    setCurrentSlide(currentSlide + 1)
  }

  const moveSlide = (dir: -1 | 1) => {
    const target = currentSlide + dir
    if (target < 0 || target >= slides.length) return
    setSlides((prev) => {
      const arr = [...prev]
      ;[arr[currentSlide], arr[target]] = [arr[target], arr[currentSlide]]
      return arr
    })
    setCurrentSlide(target)
  }

  const addShape = (type: 'rect' | 'circle' | 'line') => {
    const id = `shape-${Date.now()}`
    setShapes((prev) => [...prev, { id, type, x: 50, y: 50, w: type === 'line' ? 200 : 100, h: type === 'line' ? 2 : 80, color: '#89b4fa' }])
  }

  const exportPresentation = () => {
    let text = '演示文稿导出\n' + '='.repeat(40) + '\n\n'
    slides.forEach((s, i) => {
      text += `--- 幻灯片 ${i + 1} (${LAYOUT_LABELS[s.layout]}) ---\n`
      text += `标题: ${s.title}\n`
      text += `内容:\n${s.content}\n\n`
    })
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'presentation.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePresentKeydown = useCallback((e: KeyboardEvent) => {
    if (!presentMode) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault()
      setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setCurrentSlide((prev) => Math.max(0, prev - 1))
    } else if (e.key === 'Escape') {
      setPresentMode(false)
    }
  }, [presentMode, slides.length])

  useEffect(() => {
    window.addEventListener('keydown', handlePresentKeydown)
    return () => window.removeEventListener('keydown', handlePresentKeydown)
  }, [handlePresentKeydown])

  const renderSlideContent = (s: Slide, isThumb: boolean = false) => {
    const fs = isThumb ? Math.max(6, s.fontSize * 0.4) : s.fontSize
    const titleFs = isThumb ? 10 : 28
    const bgStyle: React.CSSProperties = s.bgColor.includes('gradient')
      ? { background: s.bgColor }
      : { backgroundColor: s.bgColor }

    if (s.layout === 'two-column') {
      const lines = s.content.split('\n')
      const mid = Math.ceil(lines.length / 2)
      const left = lines.slice(0, mid).join('\n')
      const right = lines.slice(mid).join('\n')
      return (
        <div style={{ ...bgStyle, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isThumb ? 6 : 40, color: s.fontColor, textAlign: s.textAlign as 'left' | 'center' | 'right' }}>
          <h2 style={{ fontSize: titleFs, fontWeight: 700, color: '#89b4fa', marginBottom: isThumb ? 4 : 20, textAlign: 'center' }}>{s.title}</h2>
          <div style={{ display: 'flex', gap: isThumb ? 4 : 30, width: '100%', maxWidth: isThumb ? 200 : 700 }}>
            <div style={{ flex: 1, fontSize: fs, lineHeight: isThumb ? 1.2 : 1.8, whiteSpace: 'pre-wrap' }}>{left}</div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ flex: 1, fontSize: fs, lineHeight: isThumb ? 1.2 : 1.8, whiteSpace: 'pre-wrap' }}>{right}</div>
          </div>
        </div>
      )
    }

    if (s.layout === 'quote') {
      return (
        <div style={{ ...bgStyle, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isThumb ? 6 : 40, color: s.fontColor, textAlign: 'center' }}>
          <div style={{ fontSize: isThumb ? 16 : 40, color: '#89b4fa', marginBottom: isThumb ? 2 : 10 }}>"</div>
          <div style={{ fontSize: fs, lineHeight: isThumb ? 1.2 : 2, whiteSpace: 'pre-wrap', fontStyle: 'italic', maxWidth: isThumb ? 180 : 600 }}>{s.content}</div>
        </div>
      )
    }

    if (s.layout === 'data') {
      const lines = s.content.split('\n').filter((l) => l.trim())
      return (
        <div style={{ ...bgStyle, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isThumb ? 6 : 40, color: s.fontColor }}>
          <h2 style={{ fontSize: titleFs, fontWeight: 700, color: '#89b4fa', marginBottom: isThumb ? 4 : 20, textAlign: 'center' }}>{s.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(lines.length, 2)}, 1fr)`, gap: isThumb ? 3 : 12, width: '100%', maxWidth: isThumb ? 200 : 600 }}>
            {lines.map((line, idx) => {
              const parts = line.split(':')
              return (
                <div key={idx} style={{ background: 'rgba(137,180,250,0.1)', borderRadius: isThumb ? 2 : 8, padding: isThumb ? 3 : 16, textAlign: 'center' }}>
                  <div style={{ fontSize: isThumb ? 6 : 11, color: '#a6adc8' }}>{parts[0]}</div>
                  <div style={{ fontSize: isThumb ? 8 : 22, fontWeight: 700, color: '#89b4fa' }}>{parts[1]?.trim() || ''}</div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (s.layout === 'image') {
      return (
        <div style={{ ...bgStyle, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isThumb ? 6 : 40, color: s.fontColor, textAlign: s.textAlign as 'left' | 'center' | 'right' }}>
          <h2 style={{ fontSize: titleFs, fontWeight: 700, color: '#89b4fa', marginBottom: isThumb ? 4 : 20, textAlign: 'center' }}>{s.title}</h2>
          <div style={{ flex: 1, width: '100%', maxWidth: isThumb ? 180 : 500, background: 'rgba(137,180,250,0.08)', borderRadius: isThumb ? 2 : 8, border: isThumb ? '1px dashed rgba(137,180,250,0.3)' : '2px dashed rgba(137,180,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isThumb ? 7 : 14, color: '#6c7086' }}>
            🖼 图片区域
          </div>
          <div style={{ fontSize: fs * 0.8, lineHeight: isThumb ? 1.2 : 1.6, whiteSpace: 'pre-wrap', marginTop: isThumb ? 2 : 12, color: '#a6adc8' }}>{s.content.split('\n').slice(0, 2).join('\n')}</div>
        </div>
      )
    }

    if (s.layout === 'end') {
      return (
        <div style={{ ...bgStyle, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isThumb ? 6 : 40, color: s.fontColor, textAlign: 'center' }}>
          <h2 style={{ fontSize: isThumb ? 12 : 36, fontWeight: 700, color: '#89b4fa', marginBottom: isThumb ? 4 : 30 }}>{s.title}</h2>
          <div style={{ fontSize: fs, lineHeight: isThumb ? 1.2 : 2, whiteSpace: 'pre-wrap', maxWidth: isThumb ? 180 : 600 }}>{s.content}</div>
        </div>
      )
    }

    return (
      <div style={{ ...bgStyle, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isThumb ? 6 : 40, color: s.fontColor, textAlign: s.textAlign as 'left' | 'center' | 'right' }}>
        <h2 style={{ fontSize: titleFs, fontWeight: 700, color: '#89b4fa', marginBottom: isThumb ? 4 : 20, textAlign: 'center' }}>{s.title}</h2>
        <div style={{ fontSize: fs, lineHeight: isThumb ? 1.2 : 2, whiteSpace: 'pre-wrap', maxWidth: isThumb ? 180 : 700 }}>{s.content}</div>
      </div>
    )
  }

  if (presentMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#cdd6f4', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {renderSlideContent(slide)}
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
          <span style={{ color: '#a6adc8', fontSize: 13 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} style={presBtn} disabled={currentSlide === slides.length - 1}>下一页 ▶</button>
          <button onClick={() => setPresentMode(false)} style={{ ...presBtn, background: '#f38ba8', color: '#1e1e2e' }}>退出演示</button>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 11, color: '#585b70' }}>按 ← → 翻页 | ESC 退出</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'sans-serif' }}>
      <div style={{ width: 200, background: '#181825', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>幻灯片</span>
          <span style={{ fontSize: 11, color: '#6c7086' }}>{slides.length} 页</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              style={{
                marginBottom: 6, cursor: 'pointer', borderRadius: 4,
                border: i === currentSlide ? '2px solid #89b4fa' : '2px solid transparent',
                overflow: 'hidden',
              }}
              onClick={() => setCurrentSlide(i)}
            >
              <div style={{ height: 70, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                {renderSlideContent(s, true)}
              </div>
              <div style={{ padding: '3px 6px', fontSize: 10, color: '#a6adc8', background: '#181825', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {s.title}</span>
                <span style={{ color: '#585b70' }}>{LAYOUT_LABELS[s.layout]}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 8, borderTop: '1px solid #313244', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => addSlide('content')} style={slideBtn}>+ 新建</button>
          <button onClick={duplicateSlide} style={slideBtn}>📋 复制</button>
          <button onClick={() => moveSlide(-1)} style={slideBtn} disabled={currentSlide === 0}>↑</button>
          <button onClick={() => moveSlide(1)} style={slideBtn} disabled={currentSlide === slides.length - 1}>↓</button>
          <button onClick={deleteSlide} style={{ ...slideBtn, background: '#f38ba8', color: '#1e1e2e', flex: 0 }}>🗑</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#181825', borderBottom: '1px solid #313244', flexWrap: 'wrap' }}>
          <button onClick={() => setPresentMode(true)} style={{ ...slideBtn, background: '#89b4fa', color: '#1e1e2e', fontWeight: 600 }}>▶ 演示</button>
          <div style={{ width: 1, height: 20, background: '#45475a', margin: '0 4px' }} />
          <button onClick={() => setAddTextMode(!addTextMode)} style={{ ...slideBtn, background: addTextMode ? '#89b4fa' : 'transparent', color: addTextMode ? '#1e1e2e' : '#cdd6f4' }}>📝 文本</button>
          <button onClick={() => { addShape('rect'); setShapeTool('rect') }} style={{ ...slideBtn, background: shapeTool === 'rect' ? '#89b4fa' : 'transparent', color: shapeTool === 'rect' ? '#1e1e2e' : '#cdd6f4' }}>⬛ 矩形</button>
          <button onClick={() => { addShape('circle'); setShapeTool('circle') }} style={{ ...slideBtn, background: shapeTool === 'circle' ? '#89b4fa' : 'transparent', color: shapeTool === 'circle' ? '#1e1e2e' : '#cdd6f4' }}>⭕ 圆形</button>
          <button onClick={() => { addShape('line'); setShapeTool('line') }} style={{ ...slideBtn, background: shapeTool === 'line' ? '#89b4fa' : 'transparent', color: shapeTool === 'line' ? '#1e1e2e' : '#cdd6f4' }}>📏 线条</button>
          <div style={{ width: 1, height: 20, background: '#45475a', margin: '0 4px' }} />
          <button onClick={() => setShowBgPicker(!showBgPicker)} style={{ ...slideBtn, background: showBgPicker ? '#89b4fa' : 'transparent', color: showBgPicker ? '#1e1e2e' : '#cdd6f4' }}>🎨 背景</button>
          <button onClick={() => setShowFormatPanel(!showFormatPanel)} style={{ ...slideBtn, background: showFormatPanel ? '#89b4fa' : 'transparent', color: showFormatPanel ? '#1e1e2e' : '#cdd6f4' }}>🔤 格式</button>
          <div style={{ flex: 1 }} />
          <button onClick={exportPresentation} style={{ ...slideBtn, background: '#a6e3a1', color: '#1e1e2e' }}>💾 导出</button>
          <span style={{ fontSize: 11, color: '#6c7086', marginLeft: 8 }}>{currentSlide + 1}/{slides.length}</span>
        </div>

        {showBgPicker && (
          <div style={{ padding: '8px 12px', background: '#181825', borderBottom: '1px solid #313244', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GRADIENT_BACKGROUNDS.map((bg) => (
              <div
                key={bg.id}
                onClick={() => { updateSlide('bgColor', bg.value); setShowBgPicker(false) }}
                style={{
                  width: 44, height: 28, borderRadius: 4, cursor: 'pointer',
                  background: bg.value, border: slide.bgColor === bg.value ? '2px solid #89b4fa' : '2px solid #45475a',
                }}
                title={bg.label}
              />
            ))}
          </div>
        )}

        {showFormatPanel && (
          <div style={{ padding: '8px 12px', background: '#181825', borderBottom: '1px solid #313244', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#a6adc8' }}>字号</span>
              <select value={slide.fontSize} onChange={(e) => updateSlide('fontSize', Number(e.target.value))} style={{ background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', borderRadius: 4, padding: '2px 6px', fontSize: 12 }}>
                {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((s) => <option key={s} value={s}>{s}px</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#a6adc8' }}>颜色</span>
              <input type="color" value={slide.fontColor} onChange={(e) => updateSlide('fontColor', e.target.value)} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#a6adc8' }}>对齐</span>
              {(['left', 'center', 'right'] as const).map((a) => (
                <button key={a} onClick={() => updateSlide('textAlign', a)} style={{ ...slideBtn, background: slide.textAlign === a ? '#89b4fa' : 'transparent', color: slide.textAlign === a ? '#1e1e2e' : '#cdd6f4', padding: '2px 8px' }}>
                  {a === 'left' ? '◀' : a === 'center' ? '◆' : '▶'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#a6adc8' }}>布局</span>
              <select value={slide.layout} onChange={(e) => updateSlide('layout', e.target.value)} style={{ background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', borderRadius: 4, padding: '2px 6px', fontSize: 12 }}>
                {Object.entries(LAYOUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden' }}>
          <div style={{
            width: '100%', maxWidth: 720, aspectRatio: '16/9',
            borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              {renderSlideContent(slide)}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              {editingTitle ? (
                <input
                  value={slide.title}
                  onChange={(e) => updateSlide('title', e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  autoFocus
                  style={{
                    fontSize: 28, fontWeight: 700, background: 'rgba(0,0,0,0.4)', border: '1px solid #89b4fa',
                    color: '#cdd6f4', padding: '4px 12px', textAlign: 'center', borderRadius: 4, outline: 'none', marginBottom: 20, width: '80%', zIndex: 10
                  }}
                />
              ) : (
                <h2
                  style={{ fontSize: 28, fontWeight: 700, color: '#89b4fa', marginBottom: 20, cursor: 'pointer', textAlign: 'center', zIndex: 10, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
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
                    width: '80%', height: 200, background: 'rgba(0,0,0,0.4)', border: '1px solid #89b4fa',
                    color: '#cdd6f4', padding: 12, fontSize: slide.fontSize, borderRadius: 4, outline: 'none', resize: 'none', lineHeight: 1.8, zIndex: 10
                  }}
                />
              ) : (
                <div
                  style={{ fontSize: slide.fontSize, lineHeight: 2, whiteSpace: 'pre-wrap', color: slide.fontColor, cursor: 'pointer', textAlign: slide.textAlign, maxWidth: '80%', zIndex: 10, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
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
            </div>
            <div style={{ position: 'absolute', bottom: 12, color: '#585b70', fontSize: 10, textAlign: 'center', width: '100%' }}>
              点击标题或内容区域编辑
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', background: '#89b4fa', color: '#1e1e2e', fontSize: 11, fontWeight: 600 }}>
          <span>幻灯片 {currentSlide + 1}/{slides.length}</span>
          <span>点击 ▶ 演示 进入全屏演示模式</span>
        </div>
      </div>
    </div>
  )
}

const slideBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #45475a', color: '#cdd6f4', cursor: 'pointer',
  padding: '4px 10px', borderRadius: 3, fontSize: 12
}

const presBtn: React.CSSProperties = {
  background: 'rgba(137,180,250,0.15)', border: '1px solid rgba(137,180,250,0.3)', color: '#cdd6f4',
  cursor: 'pointer', padding: '6px 16px', borderRadius: 4, fontSize: 13
}
