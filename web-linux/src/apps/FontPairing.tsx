import { useState, useMemo } from 'react'
import { Type, Copy, Check, RefreshCw, Eye, Edit, Sparkles, Code2 } from 'lucide-react'

interface FontPair {
  id: number
  title: string
  body: string
  titleWeight: string
  bodyWeight: string
  category: string
  description: string
  useCases: string[]
}

const fontPairings: FontPair[] = [
  { id: 1, title: 'Playfair Display', body: 'Source Sans Pro', titleWeight: '700', bodyWeight: '400', category: '优雅', description: '古典衬线体与现代无衬线的完美结合，适合高端品牌与杂志排版。', useCases: ['杂志', '品牌', '婚礼', '时尚'] },
  { id: 2, title: 'Lobster', body: 'Open Sans', titleWeight: '400', bodyWeight: '400', category: '创意', description: '手写风格标题搭配清晰正文，适合餐厅、咖啡店和创意工作室。', useCases: ['餐厅', '咖啡', '创意', '艺术'] },
  { id: 3, title: 'Montserrat', body: 'Roboto', titleWeight: '700', bodyWeight: '400', category: '现代', description: '几何风格的现代组合，干净利落，适合科技和商业网站。', useCases: ['科技', 'SaaS', '金融', '商务'] },
  { id: 4, title: 'Oswald', body: 'Lato', titleWeight: '700', bodyWeight: '400', category: '醒目', description: '窄体大写标题搭配圆润正文，极具视觉冲击力。', useCases: ['海报', '标题党', '运动', '音乐'] },
  { id: 5, title: 'Raleway', body: 'Source Sans Pro', titleWeight: '600', bodyWeight: '300', category: '优雅', description: '优雅的细体标题与中性正文搭配，适合时尚和设计领域。', useCases: ['时尚', '设计', '作品集', '艺术'] },
  { id: 6, title: 'Pacifico', body: 'Quicksand', titleWeight: '400', bodyWeight: '400', category: '有趣', description: '活泼手写体搭配圆润无衬线，富有个性与亲和力。', useCases: ['儿童', '玩具', '糖果', '社交'] },
  { id: 7, title: 'Roboto Slab', body: 'Roboto', titleWeight: '700', bodyWeight: '400', category: '专业', description: '机械感衬线标题与经典无衬线正文，专业且稳重。', useCases: ['新闻', '法律', '学术', '企业'] },
  { id: 8, title: 'Bebas Neue', body: 'PT Sans', titleWeight: '400', bodyWeight: '400', category: '大胆', description: '工业风标题搭配友好正文，粗犷与细腻的碰撞。', useCases: ['工业', '建筑', '运动', '极限'] },
  { id: 9, title: 'Dancing Script', body: 'Montserrat', titleWeight: '700', bodyWeight: '400', category: '浪漫', description: '流畅草书搭配现代几何无衬线，优雅而不失活力。', useCases: ['婚礼', '邀请函', '精品', '浪漫'] },
  { id: 10, title: 'Merriweather', body: 'Open Sans', titleWeight: '900', bodyWeight: '400', category: '阅读', description: '专为屏幕阅读优化的组合，正文舒适，标题有力。', useCases: ['博客', '文章', '新闻', '出版'] },
  { id: 11, title: 'Abril Fatface', body: 'Lato', titleWeight: '400', bodyWeight: '300', category: '编辑', description: '具有19世纪杂志风格的装饰性标题，搭配简洁正文。', useCases: ['杂志', '文化', '编辑', '艺术'] },
  { id: 12, title: 'Poppins', body: 'Inter', titleWeight: '600', bodyWeight: '400', category: '科技', description: '现代几何字体组合，圆润友好，适合数字产品。', useCases: ['App', 'SaaS', '工具', '创新'] },
  { id: 13, title: 'Playfair Display', body: 'Merriweather', titleWeight: '600', bodyWeight: '400', category: '经典', description: '双衬线组合，经典优雅，适合长篇阅读和文学作品。', useCases: ['文学', '博客', '出版', '文化'] },
  { id: 14, title: 'Fira Code', body: 'JetBrains Mono', titleWeight: '500', bodyWeight: '400', category: '编程', description: '专为开发者设计的等宽字体，清晰易读。', useCases: ['代码', '技术文档', '开发者', '终端'] },
  { id: 15, title: 'Work Sans', body: 'DM Sans', titleWeight: '700', bodyWeight: '400', category: '极简', description: '干净利落的现代无衬线组合，极简主义的选择。', useCases: ['极简', '作品集', '品牌', '设计'] },
]

const previewSamples = [
  '设计不仅仅是外观和感觉，设计是如何工作的。',
  'The details are not the details. They make the design.',
  '简单是复杂的最终形式。',
  '好的设计是让人感到显而易见，伟大的设计是让人感到不可或缺。',
]

export default function FontPairing() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previewText, setPreviewText] = useState(previewSamples[0])
  const [titleSize, setTitleSize] = useState(36)
  const [bodySize, setBodySize] = useState(16)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [customText, setCustomText] = useState(false)

  const filteredPairings = useMemo(() => {
    if (activeCategory === '全部') return fontPairings
    return fontPairings.filter(p => p.category === activeCategory)
  }, [activeCategory])

  const currentPairing = filteredPairings[currentIndex] || fontPairings[0]

  const randomize = () => {
    setCurrentIndex(Math.floor(Math.random() * filteredPairings.length))
  }

  const nextPairing = () => {
    setCurrentIndex((currentIndex + 1) % filteredPairings.length)
  }

  const getImportCode = (pair: FontPair) => {
    const titleName = pair.title.replace(/\s+/g, '+')
    const bodyName = pair.body.replace(/\s+/g, '+')
    return `<link href="https://fonts.googleapis.com/css2?family=${titleName}:wght@${pair.titleWeight}&family=${bodyName}:wght@${pair.bodyWeight}&display=swap" rel="stylesheet">`
  }

  const getCssCode = (pair: FontPair) => {
    return `/* 标题字体 */
h1, h2, h3 {
  font-family: '${pair.title}', sans-serif;
  font-weight: ${pair.titleWeight};
}

/* 正文字体 */
body, p, span {
  font-family: '${pair.body}', sans-serif;
  font-weight: ${pair.bodyWeight};
}`
  }

  const copyCode = async (code: string, id: number) => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const loadGoogleFonts = (pair: FontPair) => {
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${pair.title.replace(/\s+/g, '+')}:wght@${pair.titleWeight}&family=${pair.body.replace(/\s+/g, '+')}:wght@${pair.bodyWeight}&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }

  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  if (!loadedFonts.has(String(currentPairing.id))) {
    loadGoogleFonts(currentPairing)
    setLoadedFonts(new Set([...loadedFonts, String(currentPairing.id)]))
  }

  const categoriesList = Array.from(new Set(fontPairings.map(p => p.category)))

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#e0e0f0',
      overflow: 'auto',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .fp-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .fp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        .fp-fade-in { animation: fpFadeIn 0.5s ease-out; }
        @keyframes fpFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fp-btn { transition: all 0.25s ease; }
        .fp-btn:hover { transform: translateY(-1px); }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
          }}>
            <Type size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>字体配对</div>
            <div style={{ fontSize: 12, color: '#8888aa' }}>Google Fonts 精选搭配 · 实时预览</div>
          </div>
          <button onClick={randomize} className="fp-btn" style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
          }}>
            <RefreshCw size={14} /> 随机配对
          </button>
        </div>

        {/* 分类筛选 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setCurrentIndex(0) }}
              className="fp-btn"
              style={{
                padding: '6px 14px', borderRadius: 10, border: activeCategory === cat ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                background: activeCategory === cat ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat ? '#c5bfff' : '#aaaacc', cursor: 'pointer',
                fontSize: 12, fontWeight: activeCategory === cat ? 600 : 400,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 主预览区 */}
        <div key={currentPairing.id} className="fp-fade-in fp-card" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: 32, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} style={{ color: '#facc15' }} />
              <span style={{ fontSize: 14, color: '#facc15', fontWeight: 600 }}>{currentPairing.category}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="fp-btn" style={navBtn}>← 上一个</button>
              <button onClick={nextPairing} className="fp-btn" style={navBtn}>下一个 →</button>
            </div>
          </div>

          {/* 字体信息 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: '#8888aa', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Type size={12} /> 标题字体 ({currentPairing.titleWeight})
              </div>
              <div style={{ fontSize: 18, fontWeight: currentPairing.titleWeight, fontFamily: `'${currentPairing.title}', sans-serif`, color: '#f0f0ff' }}>
                {currentPairing.title}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: '#8888aa', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={12} /> 正文字体 ({currentPairing.bodyWeight})
              </div>
              <div style={{ fontSize: 18, fontWeight: currentPairing.bodyWeight, fontFamily: `'${currentPairing.body}', sans-serif`, color: '#f0f0ff' }}>
                {currentPairing.body}
              </div>
            </div>
          </div>

          {/* 预览文本 */}
          <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: titleSize, fontFamily: `'${currentPairing.title}', sans-serif`, fontWeight: currentPairing.titleWeight, color: '#f0f0ff', lineHeight: 1.3 }}>
                {previewText}
              </div>
            </div>
            <div style={{ fontSize: bodySize, fontFamily: `'${currentPairing.body}', sans-serif`, fontWeight: currentPairing.bodyWeight, color: '#c0c0d0', lineHeight: 1.8 }}>
              {currentPairing.description}
            </div>
          </div>

          {/* 控件 */}
          <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
              <Eye size={14} style={{ color: '#8888aa' }} />
              <input
                value={previewText}
                onChange={(e) => { setPreviewText(e.target.value); setCustomText(true) }}
                placeholder="输入预览文本..."
                style={{
                  flex: 1, padding: '8px 12px',
                  background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)', color: '#e0e0f0',
                  fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
              {!customText && (
                <button onClick={() => { const idx = Math.floor(Math.random() * previewSamples.length); setPreviewText(previewSamples[idx]) }} style={refreshBtn}>
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#8888aa' }}>标题</span>
              <input type="range" min={20} max={64} value={titleSize} onChange={(e) => setTitleSize(+e.target.value)} style={{ accentColor: '#a29bfe' }} />
              <span style={{ fontSize: 12, color: '#aaaacc', width: 32 }}>{titleSize}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#8888aa' }}>正文</span>
              <input type="range" min={12} max={24} value={bodySize} onChange={(e) => setBodySize(+e.target.value)} style={{ accentColor: '#a29bfe' }} />
              <span style={{ fontSize: 12, color: '#aaaacc', width: 32 }}>{bodySize}px</span>
            </div>
          </div>

          {/* 应用场景 */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#6666aa' }}>适用场景：</span>
            {currentPairing.useCases.map(uc => (
              <span key={uc} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 10,
                background: 'rgba(102,126,234,0.15)', color: '#c5bfff',
                border: '1px solid rgba(102,126,234,0.3)',
              }}>{uc}</span>
            ))}
          </div>
        </div>

        {/* 代码片段 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* HTML 引入 */}
          <div className="fp-card" style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={16} style={{ color: '#a29bfe' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>HTML 引入</span>
              </div>
              <button onClick={() => copyCode(getImportCode(currentPairing), currentPairing.id * 10)} className="fp-btn" style={copyBtn}>
                {copiedId === currentPairing.id * 10 ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
              </button>
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 14,
              fontSize: 11, color: '#c0c0d0', fontFamily: 'monospace',
              overflow: 'auto', maxHeight: 140, lineHeight: 1.6, margin: 0,
            }}>{getImportCode(currentPairing)}</pre>
          </div>

          {/* CSS 样式 */}
          <div className="fp-card" style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={16} style={{ color: '#a29bfe' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>CSS 样式</span>
              </div>
              <button onClick={() => copyCode(getCssCode(currentPairing), currentPairing.id * 10 + 1)} className="fp-btn" style={copyBtn}>
                {copiedId === currentPairing.id * 10 + 1 ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
              </button>
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 14,
              fontSize: 11, color: '#c0c0d0', fontFamily: 'monospace',
              overflow: 'auto', maxHeight: 140, lineHeight: 1.6, margin: 0,
            }}>{getCssCode(currentPairing)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  padding: '6px 12px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  color: '#aaaacc', cursor: 'pointer', fontSize: 12,
  fontFamily: 'inherit', whiteSpace: 'nowrap',
  display: 'flex', alignItems: 'center', gap: 4,
}

const copyBtn: React.CSSProperties = {
  padding: '4px 8px', background: 'rgba(255,255,255,0.08)',
  border: 'none', borderRadius: 6, color: '#aaaacc',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
}

const refreshBtn: React.CSSProperties = {
  padding: '6px', background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  color: '#aaaacc', cursor: 'pointer', display: 'flex', alignItems: 'center',
}

