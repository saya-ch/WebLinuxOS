import { useState, useRef, useEffect, useMemo } from 'react'
import { Download, RefreshCw, Copy, Image as ImageIcon, Type, Palette, Trash2, Sparkles, Heart, Layers } from 'lucide-react'

interface MemeTemplate {
  id: string
  name: string
  url: string
  textAreas: { x: number; y: number; width: number; height: number; align: CanvasTextAlign; baseline: CanvasTextBaseline }[]
}

interface CanvasText {
  content: string
  fontSize: number
  color: string
  strokeColor: string
  fontFamily: string
  uppercase: boolean
}

const PRESET_TEMPLATES: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    url: 'https://i.imgflip.com/30b1gx.jpg',
    textAreas: [
      { x: 570, y: 120, width: 550, height: 240, align: 'center', baseline: 'middle' },
      { x: 570, y: 370, width: 550, height: 240, align: 'center', baseline: 'middle' }
    ]
  },
  {
    id: 'distracted',
    name: 'Distracted Boyfriend',
    url: 'https://i.imgflip.com/1ur9b0.jpg',
    textAreas: [
      { x: 220, y: 140, width: 200, height: 90, align: 'center', baseline: 'bottom' },
      { x: 610, y: 175, width: 170, height: 80, align: 'center', baseline: 'bottom' },
      { x: 850, y: 135, width: 230, height: 90, align: 'center', baseline: 'bottom' }
    ]
  },
  {
    id: 'twobuttons',
    name: 'Two Buttons',
    url: 'https://i.imgflip.com/1g8my4.jpg',
    textAreas: [
      { x: 300, y: 225, width: 260, height: 120, align: 'center', baseline: 'middle' },
      { x: 760, y: 400, width: 260, height: 120, align: 'center', baseline: 'middle' },
      { x: 140, y: 70, width: 200, height: 80, align: 'center', baseline: 'middle' }
    ]
  },
  {
    id: 'change_my_mind',
    name: 'Change My Mind',
    url: 'https://i.imgflip.com/24y43o.jpg',
    textAreas: [
      { x: 500, y: 105, width: 540, height: 110, align: 'center', baseline: 'middle' }
    ]
  },
  {
    id: 'woman_yelling',
    name: 'Woman Yelling at Cat',
    url: 'https://i.imgflip.com/345v97.jpg',
    textAreas: [
      { x: 240, y: 110, width: 420, height: 200, align: 'center', baseline: 'middle' },
      { x: 770, y: 175, width: 400, height: 180, align: 'center', baseline: 'middle' }
    ]
  },
  {
    id: 'is_this_a_pigeon',
    name: 'Is This a Pigeon?',
    url: 'https://i.imgflip.com/1o00in.jpg',
    textAreas: [
      { x: 570, y: 85, width: 560, height: 100, align: 'center', baseline: 'middle' },
      { x: 180, y: 360, width: 300, height: 120, align: 'center', baseline: 'middle' },
      { x: 440, y: 440, width: 320, height: 80, align: 'center', baseline: 'middle' }
    ]
  },
  {
    id: 'expanding_brain',
    name: 'Expanding Brain',
    url: 'https://i.imgflip.com/1jwhww.jpg',
    textAreas: [
      { x: 230, y: 60, width: 340, height: 120, align: 'center', baseline: 'middle' },
      { x: 230, y: 290, width: 340, height: 120, align: 'center', baseline: 'middle' },
      { x: 230, y: 520, width: 340, height: 120, align: 'center', baseline: 'middle' },
      { x: 230, y: 750, width: 340, height: 120, align: 'center', baseline: 'middle' }
    ]
  },
  {
    id: 'american_chopper',
    name: 'American Chopper',
    url: 'https://i.imgflip.com/28j0le.jpg',
    textAreas: [
      { x: 640, y: 40, width: 360, height: 180, align: 'center', baseline: 'top' },
      { x: 640, y: 260, width: 360, height: 180, align: 'center', baseline: 'top' },
      { x: 640, y: 470, width: 360, height: 180, align: 'center', baseline: 'top' },
      { x: 640, y: 690, width: 360, height: 180, align: 'center', baseline: 'top' }
    ]
  }
]

const CUSTOM_TEMPLATES_KEY = 'weblinux_memegen_custom_templates_v1'
const FAVORITES_KEY = 'weblinux_memegen_favorites_v1'
const RECENT_KEY = 'weblinux_memegen_recent_v1'

export default function MemeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(PRESET_TEMPLATES[0])
  const [texts, setTexts] = useState<CanvasText[]>(PRESET_TEMPLATES[0].textAreas.map(() => ({
    content: '',
    fontSize: 32,
    color: '#ffffff',
    strokeColor: '#000000',
    fontFamily: 'Impact, "Noto Sans SC", sans-serif',
    uppercase: true
  })))
  const [customTemplates, setCustomTemplates] = useState<MemeTemplate[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [showTemplates, setShowTemplates] = useState(true)
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'favorites'>('preset')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载持久化数据
  useEffect(() => {
    try {
      const c = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
      if (c) setCustomTemplates(JSON.parse(c))
      const f = localStorage.getItem(FAVORITES_KEY)
      if (f) setFavorites(JSON.parse(f))
      const r = localStorage.getItem(RECENT_KEY)
      if (r) setRecent(JSON.parse(r))
    } catch {}
  }, [])

  // 加载图片
  useEffect(() => {
    setLoading(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { setBgImage(img); setLoading(false) }
    img.onerror = () => {
      // CORS回退：尝试通过no-cors方式或使用占位图
      const fallback = new Image()
      fallback.crossOrigin = 'anonymous'
      fallback.onload = () => { setBgImage(fallback); setLoading(false) }
      fallback.onerror = () => {
        // 创建占位图
        const w = 600, h = 500
        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = w; tmpCanvas.height = h
        const ctx = tmpCanvas.getContext('2d')!
        const grad = ctx.createLinearGradient(0, 0, w, h)
        grad.addColorStop(0, '#7c3aed'); grad.addColorStop(1, '#38bdf8')
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = 'bold 32px system-ui, sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('📷 选择图片或上传', w / 2, h / 2 - 20)
        ctx.font = '18px system-ui, sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText('点击「上传自定义」选择本地图片', w / 2, h / 2 + 20)
        const fallback2 = new Image()
        fallback2.onload = () => { setBgImage(fallback2); setLoading(false) }
        fallback2.src = tmpCanvas.toDataURL()
      }
      // 使用Unsplash占位图（CORS兼容）
      fallback.src = 'https://picsum.photos/seed/meme' + selectedTemplate.id + '/600/500'
    }
    img.src = selectedTemplate.url
  }, [selectedTemplate])  // 当切换模板时重置texts数量
  useEffect(() => {
    setTexts(prev => {
      const newTexts = selectedTemplate.textAreas.map((_, i) => prev[i] ?? {
        content: '',
        fontSize: 32,
        color: '#ffffff',
        strokeColor: '#000000',
        fontFamily: 'Impact, "Noto Sans SC", sans-serif',
        uppercase: true
      })
      return newTexts
    })
    // 添加到最近使用
    setRecent(prev => {
      const filtered = prev.filter(id => id !== selectedTemplate.id)
      const updated = [selectedTemplate.id, ...filtered].slice(0, 10)
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [selectedTemplate])

  // 渲染画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !bgImage) return
    canvas.width = bgImage.naturalWidth
    canvas.height = bgImage.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)

    selectedTemplate.textAreas.forEach((area, i) => {
      const text = texts[i]
      if (!text || !text.content.trim()) return

      const x = (area.x / 1000) * canvas.width
      const y = (area.y / 900) * canvas.height
      const w = (area.width / 1000) * canvas.width
      const _h = (area.height / 900) * canvas.height
      void _h
      const scale = canvas.width / 1000
      const fontSizePx = text.fontSize * scale

      ctx.font = `bold ${fontSizePx}px ${text.fontFamily}`
      ctx.textAlign = area.align
      ctx.textBaseline = area.baseline
      ctx.fillStyle = text.color
      ctx.strokeStyle = text.strokeColor
      ctx.lineWidth = Math.max(2, strokeWidth * scale)
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2

      const displayText = text.uppercase ? text.content.toUpperCase() : text.content

      // 自动换行
      const words = displayText.split(' ')
      const lines: string[] = []
      let current = ''
      for (const word of words) {
        const test = current ? current + ' ' + word : word
        if (ctx.measureText(test).width > w && current) {
          lines.push(current)
          current = word
        } else {
          current = test
        }
      }
      if (current) lines.push(current)

      // 中文换行处理
      const finalLines: string[] = []
      for (const line of lines) {
        if (ctx.measureText(line).width <= w) {
          finalLines.push(line)
        } else {
          let buf = ''
          for (const ch of line) {
            if (ctx.measureText(buf + ch).width > w && buf) {
              finalLines.push(buf); buf = ch
            } else {
              buf += ch
            }
          }
          if (buf) finalLines.push(buf)
        }
      }

      const lineHeight = fontSizePx * 1.2
      const totalHeight = finalLines.length * lineHeight
      let startY = y
      if (area.baseline === 'middle') {
        startY = y - totalHeight / 2 + lineHeight / 2
      } else if (area.baseline === 'bottom') {
        startY = y - totalHeight + lineHeight
      }

      finalLines.forEach((line, idx) => {
        const drawY = startY + idx * lineHeight
        // 根据align计算x
        let drawX = x
        if (area.align === 'left') drawX = x
        else if (area.align === 'right') drawX = x + w
        else drawX = x + w / 2
        ctx.strokeText(line, drawX, drawY)
        ctx.fillText(line, drawX, drawY)
      })
    })
  }, [bgImage, texts, selectedTemplate, strokeWidth])

  const updateText = (idx: number, patch: Partial<CanvasText>) => {
    setTexts(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t))
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `meme-${selectedTemplate.id}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleCopy = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('blob null')), 'image/png')
      })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      alert('✅ 表情包已复制到剪贴板，可直接粘贴到微信/飞书等')
    } catch {
      alert('❌ 浏览器不支持图片剪贴板，请使用下载按钮')
    }
  }

  const toggleFavorite = () => {
    setFavorites(prev => {
      const updated = prev.includes(selectedTemplate.id)
        ? prev.filter(id => id !== selectedTemplate.id)
        : [...prev, selectedTemplate.id]
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const handleUploadCustom = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const id = 'custom-' + Date.now()
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 20) || '自定义图片'
      // 获取图片尺寸
      const tmpImg = new Image()
      tmpImg.onload = () => {
        const _w = tmpImg.naturalWidth, _h = tmpImg.naturalHeight
        void _w; void _h
        const newTemplate: MemeTemplate = {
          id, name,
          url: dataUrl,
          // 默认两个文字区域：顶部+底部
          textAreas: [
            { x: 50, y: 30, width: 900, height: 120, align: 'center', baseline: 'top' },
            { x: 50, y: 750, width: 900, height: 120, align: 'center', baseline: 'bottom' }
          ]
        }
        setCustomTemplates(prev => {
          const updated = [newTemplate, ...prev].slice(0, 50)
          try { localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated)) } catch {}
          return updated
        })
        setSelectedTemplate(newTemplate)
        setActiveTab('custom')
        alert('✅ 图片已导入，可直接在文字区域输入内容')
      }
      tmpImg.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const deleteCustom = (id: string) => {
    setCustomTemplates(prev => {
      const updated = prev.filter(t => t.id !== id)
      try { localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const displayTemplates = useMemo(() => {
    if (activeTab === 'custom') return customTemplates
    if (activeTab === 'favorites') {
      const favSet = new Set(favorites)
      return [...PRESET_TEMPLATES, ...customTemplates].filter(t => favSet.has(t.id))
    }
    return PRESET_TEMPLATES
  }, [activeTab, favorites, customTemplates])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', color: 'inherit' }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        background: 'var(--panel-bg, rgba(255,255,255,0.02))', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}>
          <Sparkles size={18} style={{ color: '#f472b6' }} />
          <span style={{ fontWeight: 600 }}>MemeGenerator · 表情包工坊</span>
        </div>
        <button onClick={() => setShowTemplates(s => !s)} style={btnStyle()}>
          <Layers size={14} /> {showTemplates ? '收起模板' : '展开模板'}
        </button>
        <label style={{ ...btnStyle(), cursor: 'pointer' }}>
          <ImageIcon size={14} /> 上传自定义
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleUploadCustom(e.target.files[0])} />
        </label>
        <button onClick={toggleFavorite} style={btnStyle(favorites.includes(selectedTemplate.id) ? '#f43f5e' : undefined)}>
          <Heart size={14} fill={favorites.includes(selectedTemplate.id) ? 'currentColor' : 'none'} /> 收藏
        </button>
        <button onClick={handleCopy} style={btnStyle('#0ea5e9')}>
          <Copy size={14} /> 复制图片
        </button>
        <button onClick={handleDownload} style={btnStyle('#10b981')}>
          <Download size={14} /> 下载PNG
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧模板选择 */}
        {showTemplates && (
          <div style={{
            width: 280, borderRight: '1px solid var(--border, rgba(255,255,255,0.08))',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: 'var(--sidebar-bg, rgba(0,0,0,0.2))'
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
              {(['preset', 'custom', 'favorites'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '10px 6px', fontSize: 12,
                  background: activeTab === tab ? 'var(--accent, #7c3aed)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'inherit',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  {tab === 'preset' ? '模板库' : tab === 'custom' ? '我的上传' : '收藏夹'}
                  <span style={{
                    marginLeft: 4, opacity: 0.7, fontSize: 11,
                    background: 'rgba(127,127,127,0.25)', padding: '1px 5px', borderRadius: 8
                  }}>
                    {tab === 'preset' ? PRESET_TEMPLATES.length : tab === 'custom' ? customTemplates.length : favorites.length}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayTemplates.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13 }}>
                  {activeTab === 'favorites' ? '还没有收藏的模板\n先点击「收藏」按钮吧' : '还没有上传的图片\n点击「上传自定义」开始'}
                </div>
              )}
              {displayTemplates.map(tpl => {
                const isSelected = selectedTemplate.id === tpl.id
                return (
                  <div key={tpl.id} onClick={() => setSelectedTemplate(tpl)}
                    style={{
                      position: 'relative', borderRadius: 8, overflow: 'hidden',
                      border: isSelected ? '2px solid var(--accent, #7c3aed)' : '2px solid transparent',
                      cursor: 'pointer', transition: 'transform 0.15s',
                      background: 'rgba(255,255,255,0.03)'
                    }}>
                    <img src={tpl.url} alt={tpl.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/'+tpl.id+'/300/200' }}
                      style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0,
                      padding: '6px 8px', fontSize: 11, fontWeight: 500,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'
                    }}>{tpl.name}</div>
                    {activeTab === 'custom' && (
                      <button onClick={(e) => { e.stopPropagation(); deleteCustom(tpl.id) }}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 24, height: 24, borderRadius: 6,
                          background: 'rgba(220,38,38,0.85)', color: 'white',
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}><Trash2 size={12} /></button>
                    )}
                  </div>
                )
              })}
            </div>
            {recent.length > 0 && (
              <div style={{
                borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
                padding: '8px 10px', fontSize: 11, opacity: 0.7
              }}>
                <div style={{ marginBottom: 4, fontWeight: 600 }}>🕐 最近使用</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {recent.slice(0, 6).map(id => {
                    const t = [...PRESET_TEMPLATES, ...customTemplates].find(x => x.id === id)
                    if (!t) return null
                    return (
                      <button key={id} onClick={() => setSelectedTemplate(t)}
                        style={{
                          padding: '2px 8px', fontSize: 10, borderRadius: 4,
                          border: '1px solid var(--border, rgba(255,255,255,0.1))',
                          background: 'transparent', color: 'inherit', cursor: 'pointer'
                        }}>{t.name.slice(0, 10)}</button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 中间画布预览 */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'repeating-conic-gradient(rgba(127,127,127,0.06) 0% 25%, transparent 0% 50%) 50% / 20px 20px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', opacity: 0.7 }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: 10, fontSize: 13 }}>加载模板图片中...</div>
            </div>
          ) : (
            <canvas ref={canvasRef} style={{
              maxWidth: '100%', maxHeight: '100%',
              borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
            }} />
          )}
        </div>

        {/* 右侧文字编辑 */}
        <div style={{
          width: 340, borderLeft: '1px solid var(--border, rgba(255,255,255,0.08))',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* 全局样式控制 */}
          <div style={{
            padding: 12, borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'var(--panel-bg, rgba(255,255,255,0.02))'
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={14} /> 全局样式
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                描边粗细
                <input type="range" min={1} max={10} value={strokeWidth}
                  onChange={e => setStrokeWidth(+e.target.value)}
                  style={{ width: '100%' }} />
                <span style={{ opacity: 0.6, fontSize: 10 }}>{strokeWidth}px</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                字体
                <select value={texts[0]?.fontFamily || 'Impact'}
                  onChange={e => setTexts(prev => prev.map(t => ({ ...t, fontFamily: e.target.value })))}
                  style={selectStyle()}>
                  <option value='Impact, "Noto Sans SC", sans-serif'>Impact (经典)</option>
                  <option value='"Noto Sans SC", system-ui, sans-serif'>Noto Sans SC (中文)</option>
                  <option value='"Microsoft YaHei", sans-serif'>微软雅黑</option>
                  <option value='Arial Black, sans-serif'>Arial Black</option>
                  <option value='"Comic Sans MS", cursive'>Comic Sans</option>
                  <option value='Georgia, serif'>Georgia</option>
                </select>
              </label>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Type size={14} /> 文字区域 ({selectedTemplate.textAreas.length}个)
            </div>
            {selectedTemplate.textAreas.map((_area, i) => (
              <div key={i} style={{
                marginBottom: 14, padding: 12, borderRadius: 8,
                background: 'rgba(127,127,127,0.06)',
                border: '1px solid var(--border, rgba(255,255,255,0.06))'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8, fontSize: 12, fontWeight: 500
                }}>
                  <span>区域 #{i + 1}</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={texts[i]?.uppercase ?? true}
                      onChange={e => updateText(i, { uppercase: e.target.checked })} />
                    大写
                  </label>
                </div>
                <textarea
                  value={texts[i]?.content || ''}
                  onChange={e => updateText(i, { content: e.target.value })}
                  placeholder={`在这里输入文字...`}
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13,
                    resize: 'vertical', minHeight: 48,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border, rgba(255,255,255,0.1))',
                    color: 'inherit', fontFamily: 'inherit'
                  }}
                />
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
                    字号 {texts[i]?.fontSize || 32}px
                    <input type="range" min={12} max={80} value={texts[i]?.fontSize || 32}
                      onChange={e => updateText(i, { fontSize: +e.target.value })} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    填充
                    <input type="color" value={texts[i]?.color || '#ffffff'}
                      onChange={e => updateText(i, { color: e.target.value })}
                      style={{ width: 28, height: 24, border: 'none', borderRadius: 4, background: 'none', padding: 0 }} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, gridColumn: '1 / -1' }}>
                    描边
                    <input type="color" value={texts[i]?.strokeColor || '#000000'}
                      onChange={e => updateText(i, { strokeColor: e.target.value })}
                      style={{ width: 28, height: 24, border: 'none', borderRadius: 4, background: 'none', padding: 0 }} />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <div style={{
            padding: 10, fontSize: 11, opacity: 0.7, borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'rgba(0,0,0,0.2)', lineHeight: 1.6
          }}>
            💡 小贴士：复制图片功能支持直接粘贴到飞书/微信/钉钉/邮件等聊天框；支持中英文自动换行；所有生成均在本地完成，不会上传数据。
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { filter: brightness(1.15); }
        button:active { transform: translateY(1px); }
      `}</style>
    </div>
  )
}

function btnStyle(bg?: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
    background: bg ?? 'var(--button-bg, rgba(127,127,127,0.14))',
    color: 'inherit', border: '1px solid var(--border, rgba(255,255,255,0.08))',
    cursor: 'pointer', transition: 'all 0.15s'
  }
}

function selectStyle(): React.CSSProperties {
  return {
    padding: '5px 8px', fontSize: 11, borderRadius: 4,
    background: 'rgba(0,0,0,0.3)', color: 'inherit',
    border: '1px solid var(--border, rgba(255,255,255,0.1))',
    fontFamily: 'inherit'
  }
}
