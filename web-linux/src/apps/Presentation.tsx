import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'

interface Slide {
  id: string
  template: 'title' | 'content' | 'two-column' | 'image' | 'data' | 'quote' | 'end' | 'blank'
  background: string
  title: string
  content: string
  fontSize: number
  fontColor: string
  textAlign: 'left' | 'center' | 'right'
}

const GRADIENTS = [
  'linear-gradient(135deg, #1e1e2e, #313244)',
  'linear-gradient(135deg, #1e1e2e, #45475a)',
  'linear-gradient(135deg, #11111b, #1e1e2e)',
  'linear-gradient(135deg, #1e1e2e, #585b70)',
  'linear-gradient(135deg, #313244, #45475a)',
  'linear-gradient(135deg, #1e1e2e, #89b4fa)',
  'linear-gradient(135deg, #1e1e2e, #a6e3a1)',
  'linear-gradient(135deg, #1e1e2e, #f9e2af)',
  'linear-gradient(135deg, #1e1e2e, #f38ba8)',
  'linear-gradient(135deg, #1e1e2e, #cba6f7)',
  'linear-gradient(135deg, #1e1e2e, #fab387)',
  'linear-gradient(135deg, #1e1e2e, #94e2d5)',
]

const TEMPLATES: Slide['template'][] = ['title', 'content', 'two-column', 'image', 'data', 'quote', 'end', 'blank']

const TEMPLATE_LABELS: Record<Slide['template'], string> = {
  title: '标题',
  content: '内容',
  'two-column': '双栏',
  image: '图片',
  data: '数据',
  quote: '引用',
  end: '结尾',
  blank: '空白',
}

const INITIAL_SLIDE: Slide = {
  id: 's1',
  template: 'title',
  background: 'linear-gradient(135deg, #1e1e2e, #313244)',
  title: '演示文稿',
  content: '副标题',
  fontSize: 24,
  fontColor: '#cdd6f4',
  textAlign: 'center',
}

function renderSlideContent(slide: Slide, scale: number) {
  const base: CSSProperties = {
    fontSize: slide.fontSize * scale,
    color: slide.fontColor,
    textAlign: slide.textAlign,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
  }

  switch (slide.template) {
    case 'title':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: slide.textAlign === 'center' ? 'center' : slide.textAlign === 'right' ? 'flex-end' : 'flex-start', justifyContent: 'center', height: '100%', padding: 40 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 1.8 * scale, fontWeight: 700, marginBottom: 16 * scale }}>{slide.title}</div>
          <div style={{ ...base, fontSize: slide.fontSize * 0.8 * scale, opacity: 0.8 }}>{slide.content}</div>
        </div>
      )
    case 'content':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 40 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 1.4 * scale, fontWeight: 700, marginBottom: 20 * scale }}>{slide.title}</div>
          <div style={base}>{slide.content}</div>
        </div>
      )
    case 'two-column': {
      const parts = slide.content.split('|')
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 40 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 1.4 * scale, fontWeight: 700, marginBottom: 20 * scale }}>{slide.title}</div>
          <div style={{ display: 'flex', gap: 30 * scale, flex: 1 }}>
            <div style={{ ...base, flex: 1 }}>{parts[0] || ''}</div>
            <div style={{ ...base, flex: 1 }}>{parts[1] || ''}</div>
          </div>
        </div>
      )
    }
    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 40 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 1.4 * scale, fontWeight: 700, marginBottom: 20 * scale }}>{slide.title}</div>
          <div style={{ flex: 1, background: '#313244', borderRadius: 8 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #45475a' }}>
            <span style={{ ...base, opacity: 0.5, fontSize: slide.fontSize * scale }}>📷 图片区域</span>
          </div>
        </div>
      )
    case 'data':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 40 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 1.4 * scale, fontWeight: 700, marginBottom: 20 * scale }}>{slide.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 * scale }}>
            {slide.content.split('\n').map((line, i) => (
              <div key={i} style={{ background: 'rgba(137,180,250,0.1)', borderRadius: 6 * scale, padding: 12 * scale, textAlign: 'center' }}>
                <div style={{ ...base, fontSize: slide.fontSize * 1.2 * scale, fontWeight: 700, color: '#89b4fa' }}>{line}</div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'quote':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 60 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 1.6 * scale, fontStyle: 'italic', borderLeft: `4px solid #89b4fa`, paddingLeft: 20 * scale, maxWidth: '80%' }}>{slide.content}</div>
          {slide.title && <div style={{ ...base, marginTop: 20 * scale, opacity: 0.7, fontSize: slide.fontSize * 0.8 * scale }}>— {slide.title}</div>}
        </div>
      )
    case 'end':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 * scale }}>
          <div style={{ ...base, fontSize: slide.fontSize * 2 * scale, fontWeight: 700, color: '#89b4fa' }}>{slide.title}</div>
          <div style={{ ...base, marginTop: 16 * scale, opacity: 0.7 }}>{slide.content}</div>
        </div>
      )
    case 'blank':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 40 * scale }}>
          <div style={base}>{slide.content}</div>
        </div>
      )
  }
}

export default function Presentation() {
  const [slides, setSlides] = useState<Slide[]>([INITIAL_SLIDE])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [presentMode, setPresentMode] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)

  const currentSlide = slides[currentIndex]

  const updateSlide = useCallback((updates: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === currentIndex ? { ...s, ...updates } : s))
  }, [currentIndex])

  const addSlide = () => {
    const newSlide: Slide = {
      id: `s${Date.now()}`,
      template: 'content',
      background: GRADIENTS[0],
      title: '新幻灯片',
      content: '',
      fontSize: 18,
      fontColor: '#cdd6f4',
      textAlign: 'left',
    }
    setSlides(prev => [...prev, newSlide])
    setCurrentIndex(slides.length)
  }

  const duplicateSlide = () => {
    const dup: Slide = { ...currentSlide, id: `s${Date.now()}` }
    setSlides(prev => {
      const next = [...prev]
      next.splice(currentIndex + 1, 0, dup)
      return next
    })
    setCurrentIndex(currentIndex + 1)
  }

  const deleteSlide = () => {
    if (slides.length <= 1) return
    setSlides(prev => prev.filter((_, i) => i !== currentIndex))
    setCurrentIndex(Math.max(0, currentIndex - 1))
  }

  const moveSlide = (direction: -1 | 1) => {
    const target = currentIndex + direction
    if (target < 0 || target >= slides.length) return
    setSlides(prev => {
      const next = [...prev]
      const temp = next[currentIndex]
      next[currentIndex] = next[target]
      next[target] = temp
      return next
    })
    setCurrentIndex(target)
  }

  const exportTxt = () => {
    const text = slides.map((s, i) =>
      `--- 幻灯片 ${i + 1} (${TEMPLATE_LABELS[s.template]}) ---\n标题: ${s.title}\n内容: ${s.content}`
    ).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'presentation.txt'
    a.click()
  }

  const startPresentation = () => {
    setPresentIndex(currentIndex)
    setPresentMode(true)
  }

  const handlePresentKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      setPresentIndex(prev => Math.min(prev + 1, slides.length - 1))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPresentIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setPresentMode(false)
    }
  }, [slides.length])

  useEffect(() => {
    if (!presentMode) return
    window.addEventListener('keydown', handlePresentKey)
    return () => window.removeEventListener('keydown', handlePresentKey)
  }, [presentMode, handlePresentKey])

  if (presentMode) {
    const ps = slides[presentIndex]
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#11111b', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ps.background }}>
          <div style={{ width: '90%', maxWidth: 1000, aspectRatio: '16/9', position: 'relative' }}>
            {renderSlideContent(ps, 1)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 20px', background: '#181825' }}>
          <button onClick={() => setPresentIndex(Math.max(0, presentIndex - 1))} disabled={presentIndex === 0} style={presBtn}>◀ 上一页</button>
          <span style={{ color: '#6c7086', fontSize: 13 }}>{presentIndex + 1} / {slides.length}</span>
          <button onClick={() => setPresentIndex(Math.min(slides.length - 1, presentIndex + 1))} disabled={presentIndex === slides.length - 1} style={presBtn}>下一页 ▶</button>
          <button onClick={() => setPresentMode(false)} style={{ ...presBtn, background: '#f38ba8', color: '#1e1e2e' }}>退出演示</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'sans-serif' }}>
      <div style={{ width: 160, background: '#181825', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #313244', color: '#a6adc8' }}>幻灯片</div>
        <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setCurrentIndex(i)}
              style={{
                padding: 4, cursor: 'pointer', borderRadius: 4, marginBottom: 6,
                border: i === currentIndex ? '2px solid #89b4fa' : '2px solid transparent',
                background: i === currentIndex ? 'rgba(137,180,250,0.1)' : 'transparent',
              }}
            >
              <div style={{ fontSize: 10, color: '#6c7086', marginBottom: 2, paddingLeft: 2 }}>{i + 1}. {TEMPLATE_LABELS[s.template]}</div>
              <div style={{ height: 56, background: s.background, borderRadius: 3, overflow: 'hidden', position: 'relative', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 4, fontSize: 6, color: s.fontColor, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: 7, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.content.slice(0, 30)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 6, borderTop: '1px solid #313244', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={addSlide} style={smBtn}>+ 新建</button>
          <button onClick={duplicateSlide} style={smBtn}>复制</button>
          <button onClick={deleteSlide} style={{ ...smBtn, color: '#f38ba8' }}>删除</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#181825', borderBottom: '1px solid #313244', flexWrap: 'wrap' }}>
          <button onClick={startPresentation} style={{ ...tbBtn, background: '#89b4fa', color: '#1e1e2e', fontWeight: 600 }}>▶ 演示</button>
          <div style={{ width: 1, height: 18, background: '#313244' }} />
          <select value={currentSlide.template} onChange={(e) => updateSlide({ template: e.target.value as Slide['template'] })} style={selectStyle}>
            {TEMPLATES.map(t => <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}
          </select>
          <select value={currentSlide.background} onChange={(e) => updateSlide({ background: e.target.value })} style={selectStyle}>
            {GRADIENTS.map((g, i) => <option key={i} value={g}>渐变 {i + 1}</option>)}
          </select>
          <div style={{ width: 1, height: 18, background: '#313244' }} />
          <label style={{ fontSize: 11, color: '#6c7086' }}>字号</label>
          <select value={currentSlide.fontSize} onChange={(e) => updateSlide({ fontSize: Number(e.target.value) })} style={selectStyle}>
            {Array.from({ length: 25 }, (_, i) => i + 12).map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
          <label style={{ fontSize: 11, color: '#6c7086' }}>颜色</label>
          <input type="color" value={currentSlide.fontColor} onChange={(e) => updateSlide({ fontColor: e.target.value })} style={{ width: 24, height: 20, border: '1px solid #313244', borderRadius: 3, background: 'transparent', cursor: 'pointer', padding: 0 }} />
          <button onClick={() => updateSlide({ textAlign: 'left' })} style={{ ...tbBtn, background: currentSlide.textAlign === 'left' ? '#45475a' : 'transparent' }}>左</button>
          <button onClick={() => updateSlide({ textAlign: 'center' })} style={{ ...tbBtn, background: currentSlide.textAlign === 'center' ? '#45475a' : 'transparent' }}>中</button>
          <button onClick={() => updateSlide({ textAlign: 'right' })} style={{ ...tbBtn, background: currentSlide.textAlign === 'right' ? '#45475a' : 'transparent' }}>右</button>
          <div style={{ width: 1, height: 18, background: '#313244' }} />
          <button onClick={() => moveSlide(-1)} disabled={currentIndex === 0} style={tbBtn}>↑ 上移</button>
          <button onClick={() => moveSlide(1)} disabled={currentIndex === slides.length - 1} style={tbBtn}>↓ 下移</button>
          <div style={{ flex: 1 }} />
          <button onClick={exportTxt} style={tbBtn}>导出</button>
          <span style={{ fontSize: 11, color: '#6c7086' }}>{currentIndex + 1}/{slides.length}</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden', background: '#11111b' }}>
          <div style={{ width: '100%', maxWidth: 720, aspectRatio: '16/9', background: currentSlide.background, borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
            {renderSlideContent(currentSlide, 0.7)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: '#181825', borderTop: '1px solid #313244' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              value={currentSlide.title}
              onChange={(e) => updateSlide({ title: e.target.value })}
              placeholder="标题"
              style={{ padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 4, color: '#cdd6f4', fontSize: 13, outline: 'none' }}
            />
            <textarea
              value={currentSlide.content}
              onChange={(e) => updateSlide({ content: e.target.value })}
              placeholder="内容（双栏模板用 | 分隔两栏）"
              style={{ padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 4, color: '#cdd6f4', fontSize: 13, outline: 'none', resize: 'none', height: 60, lineHeight: 1.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const tbBtn: CSSProperties = { background: 'transparent', border: '1px solid #313244', color: '#cdd6f4', cursor: 'pointer', padding: '3px 8px', borderRadius: 3, fontSize: 12 }
const smBtn: CSSProperties = { background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', cursor: 'pointer', padding: '3px 8px', borderRadius: 3, fontSize: 11 }
const presBtn: CSSProperties = { background: 'rgba(137,180,250,0.15)', border: '1px solid rgba(137,180,250,0.3)', color: '#89b4fa', cursor: 'pointer', padding: '6px 16px', borderRadius: 4, fontSize: 13 }
const selectStyle: CSSProperties = { background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', borderRadius: 3, fontSize: 11, padding: '2px 4px', outline: 'none', cursor: 'pointer' }
