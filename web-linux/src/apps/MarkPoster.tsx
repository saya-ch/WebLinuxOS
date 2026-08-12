import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store'
import { marked } from 'marked'
import {
  FileText, Eye, Download, Copy, Check,
  Palette, Tag, User, Image, Type,
  Sparkles, Monitor,
  Plus, X,
} from 'lucide-react'

type TemplateKey = 'minimal' | 'techBlue' | 'darkPurple' | 'natureGreen' | 'warmOrange' | 'cyberpunk'

interface PosterTemplate {
  name: string
  bg: string
  textColor: string
  titleColor: string
  accentColor: string
  fontFamily: string
  borderColor: string
  overlay: string
  glassBg: string
  chipBg: string
  shadow: string
}

const TEMPLATES: Record<TemplateKey, PosterTemplate> = {
  minimal: {
    name: '简约白',
    bg: '#ffffff',
    textColor: '#333333',
    titleColor: '#1a1a1a',
    accentColor: '#666666',
    fontFamily: "'Noto Serif SC', Georgia, serif",
    borderColor: 'rgba(0,0,0,0.08)',
    overlay: 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)',
    glassBg: 'rgba(255,255,255,0.7)',
    chipBg: 'rgba(0,0,0,0.05)',
    shadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  techBlue: {
    name: '科技蓝',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)',
    textColor: '#e0f2fe',
    titleColor: '#38bdf8',
    accentColor: '#0ea5e9',
    fontFamily: "'JetBrains Mono', 'Sora', sans-serif",
    borderColor: 'rgba(56,189,248,0.3)',
    overlay: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(0,0,0,0) 100%)',
    glassBg: 'rgba(15,23,42,0.5)',
    chipBg: 'rgba(56,189,248,0.15)',
    shadow: '0 8px 40px rgba(14,165,233,0.25)',
  },
  darkPurple: {
    name: '暗调紫',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
    textColor: '#ede9fe',
    titleColor: '#c4b5fd',
    accentColor: '#a78bfa',
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
    borderColor: 'rgba(167,139,250,0.3)',
    overlay: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(0,0,0,0) 100%)',
    glassBg: 'rgba(30,27,75,0.5)',
    chipBg: 'rgba(167,139,250,0.15)',
    shadow: '0 8px 40px rgba(139,92,246,0.3)',
  },
  natureGreen: {
    name: '自然绿',
    bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    textColor: '#d1fae5',
    titleColor: '#6ee7b7',
    accentColor: '#10b981',
    fontFamily: "'Outfit', 'Noto Sans SC', sans-serif",
    borderColor: 'rgba(110,231,183,0.3)',
    overlay: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0) 100%)',
    glassBg: 'rgba(6,78,59,0.5)',
    chipBg: 'rgba(16,185,129,0.15)',
    shadow: '0 8px 40px rgba(16,185,129,0.25)',
  },
  warmOrange: {
    name: '温暖橙',
    bg: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)',
    textColor: '#ffedd5',
    titleColor: '#fdba74',
    accentColor: '#f97316',
    fontFamily: "'Fraunces', 'Noto Serif SC', serif",
    borderColor: 'rgba(253,186,116,0.3)',
    overlay: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(0,0,0,0) 100%)',
    glassBg: 'rgba(124,45,18,0.5)',
    chipBg: 'rgba(249,115,22,0.15)',
    shadow: '0 8px 40px rgba(249,115,22,0.25)',
  },
  cyberpunk: {
    name: '赛博朋克',
    bg: 'linear-gradient(135deg, #0f0014 0%, #1a0033 30%, #001a33 70%, #000d1a 100%)',
    textColor: '#f0f0ff',
    titleColor: '#ff00ff',
    accentColor: '#00ffff',
    fontFamily: "'JetBrains Mono', 'Sora', monospace",
    borderColor: 'rgba(255,0,255,0.4)',
    overlay: 'linear-gradient(135deg, rgba(255,0,255,0.1) 0%, rgba(0,255,255,0.08) 50%, rgba(0,0,0,0) 100%)',
    glassBg: 'rgba(15,0,20,0.5)',
    chipBg: 'rgba(255,0,255,0.15)',
    shadow: '0 8px 40px rgba(255,0,255,0.3), 0 0 60px rgba(0,255,255,0.15)',
  },
}

const DEFAULT_MARKDOWN = `# 探索未来科技趋势

## 副标题：前沿技术的无限可能

在这个信息爆炸的时代，科技以惊人的速度改变着我们的生活。从人工智能到量子计算，从生物科技到太空探索，每一个领域都在经历着前所未有的变革。

### 核心观点

- **人工智能** 正在重塑各行各业的工作方式
- **可持续发展** 成为全球关注的焦点
- **跨学科融合** 催生了无数创新机会

> 未来不是预测出来的，而是创造出来的。

---

*关键词：科技 · 创新 · 未来趋势*
`

export default function MarkPoster() {
  const addNotification = useStore(s => s.addNotification)

  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [title, setTitle] = useState('探索未来科技趋势')
  const [subtitle, setSubtitle] = useState('前沿技术的无限可能')
  const [summary, setSummary] = useState('在这个信息爆炸的时代，科技以惊人的速度改变着我们的生活。从人工智能到量子计算，从生物科技到太空探索，每一个领域都在经历着前所未有的变革。')
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState<string[]>(['科技', '创新', '未来趋势'])
  const [tagInput, setTagInput] = useState('')
  const [author, setAuthor] = useState('WebLinuxOS')
  const [authorAvatar, setAuthorAvatar] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('techBlue')
  const [copied, setCopied] = useState(false)

  const tpl = TEMPLATES[template]

  const renderedHTML = useMemo(() => {
    try {
      return marked.parse(markdown, { async: false }) as string
    } catch {
      return markdown
    }
  }, [markdown])

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
    }
    setTagInput('')
  }, [tagInput, tags])

  const removeTag = useCallback((idx: number) => {
    setTags(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const buildStandaloneHTML = useCallback(() => {
    const tagChips = tags.map(t =>
      `<span style="display:inline-block;padding:6px 14px;margin:4px;border-radius:20px;background:${tpl.chipBg};color:${tpl.accentColor};font-size:13px;font-weight:500;border:1px solid ${tpl.borderColor};backdrop-filter:blur(10px);">${t}</span>`
    ).join('')

    const avatarHtml = authorAvatar
      ? `<img src="${authorAvatar}" alt="${author}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid ${tpl.borderColor};" />`
      : `<div style="width:36px;height:36px;border-radius:50%;background:${tpl.chipBg};display:flex;align-items:center;justify-content:center;color:${tpl.accentColor};font-weight:600;font-size:14px;border:2px solid ${tpl.borderColor};">${author.charAt(0).toUpperCase()}</div>`

    const coverHtml = coverUrl
      ? `<div style="width:100%;height:220px;border-radius:16px;overflow:hidden;margin-bottom:24px;border:1px solid ${tpl.borderColor};box-shadow:0 8px 32px rgba(0,0,0,0.3);"><img src="${coverUrl}" alt="Cover" style="width:100%;height:100%;object-fit:cover;" /></div>`
      : ''

    const cyberpunkGlow = template === 'cyberpunk'
      ? `<style>
          @keyframes neonFlicker { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:0.8} }
          .cp-title{animation:neonFlicker 3s infinite;text-shadow:0 0 10px ${tpl.titleColor},0 0 20px ${tpl.titleColor},0 0 40px ${tpl.accentColor};}
          .cp-accent{text-shadow:0 0 5px ${tpl.accentColor},0 0 15px ${tpl.accentColor};}
        </style>`
      : ''

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} - MarkPoster</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap" rel="stylesheet" />
${cyberpunkGlow}
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:${tpl.fontFamily};color:${tpl.textColor};background:${tpl.bg};min-height:100vh;padding:40px 20px;-webkit-font-smoothing:antialiased;}
  .poster{max-width:720px;margin:0 auto;background:${tpl.glassBg};backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid ${tpl.borderColor};border-radius:24px;padding:48px 40px;box-shadow:${tpl.shadow};position:relative;overflow:hidden;}
  .poster::before{content:"";position:absolute;inset:0;background:${tpl.overlay};pointer-events:none;}
  .poster > *{position:relative;z-index:1;}
  .cover{margin-bottom:28px;}
  h1{font-size:2.4em;font-weight:700;color:${tpl.titleColor};line-height:1.2;margin-bottom:8px;letter-spacing:-0.02em;}
  .subtitle{font-size:1.2em;color:${tpl.accentColor};font-weight:500;margin-bottom:20px;opacity:0.9;}
  .summary{font-size:1.05em;line-height:1.8;color:${tpl.textColor};opacity:0.85;margin-bottom:28px;padding:16px 20px;background:${tpl.chipBg};border-radius:12px;border-left:3px solid ${tpl.accentColor};}
  .content{font-size:1em;line-height:1.8;margin-bottom:28px;}
  .content h2{font-size:1.5em;color:${tpl.titleColor};margin:1.2em 0 0.6em;font-weight:600;}
  .content h3{font-size:1.2em;color:${tpl.accentColor};margin:1em 0 0.4em;}
  .content p{margin:0.8em 0;line-height:1.8;}
  .content strong{color:${tpl.titleColor};font-weight:600;}
  .content blockquote{border-left:4px solid ${tpl.accentColor};padding:0.5em 1.2em;margin:1em 0;background:${tpl.chipBg};border-radius:0 10px 10px 0;color:${tpl.textColor};opacity:0.85;}
  .content ul,.content ol{padding-left:1.5em;margin:0.8em 0;}
  .content li{margin:0.3em 0;}
  .content code{font-family:'JetBrains Mono',monospace;padding:0.15em 0.4em;background:${tpl.chipBg};border-radius:4px;font-size:0.9em;}
  .content pre{background:rgba(0,0,0,0.3);padding:1em;border-radius:10px;overflow-x:auto;margin:1em 0;}
  .content pre code{background:transparent;padding:0;}
  .content hr{border:none;border-top:1px solid ${tpl.borderColor};margin:1.5em 0;}
  .tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;}
  .author{display:flex;align-items:center;gap:12px;padding-top:20px;border-top:1px solid ${tpl.borderColor};}
  .author-info{flex:1;}
  .author-name{font-weight:600;color:${tpl.titleColor};font-size:14px;}
  .author-meta{font-size:12px;color:${tpl.accentColor};opacity:0.7;}
  .mark{position:absolute;bottom:16px;right:20px;font-size:11px;color:${tpl.accentColor};opacity:0.5;}
</style>
</head>
<body>
<div class="poster">
  ${coverHtml}
  <h1${template === 'cyberpunk' ? ' class="cp-title"' : ''}>${title}</h1>
  ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
  ${summary ? `<div class="summary">${summary}</div>` : ''}
  <div class="content">${renderedHTML}</div>
  ${tags.length > 0 ? `<div class="tags">${tagChips}</div>` : ''}
  <div class="author">
    ${avatarHtml}
    <div class="author-info">
      <div class="author-name">${author}</div>
      <div class="author-meta">生成于 ${new Date().toLocaleDateString('zh-CN')} · WebLinuxOS MarkPoster</div>
    </div>
  </div>
  <div class="mark">MarkPoster · WebLinuxOS</div>
</div>
</body>
</html>`
  }, [tpl, title, subtitle, summary, coverUrl, tags, author, authorAvatar, renderedHTML, template])

  const copyHTML = useCallback(async () => {
    const html = buildStandaloneHTML()
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      addNotification({ title: '已复制', message: '海报 HTML 已写入剪贴板', type: 'success', duration: 1600 })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      addNotification({ title: '复制失败', message: '请尝试下载功能', type: 'error', duration: 2000 })
    }
  }, [buildStandaloneHTML, addNotification])

  const downloadHTML = useCallback(() => {
    const html = buildStandaloneHTML()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `markposter-${template}-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    addNotification({ title: '已下载', message: '海报 HTML 文件已导出', type: 'success', duration: 1600 })
  }, [buildStandaloneHTML, template, addNotification])

  const previewStyle = useMemo((): React.CSSProperties => ({
    background: tpl.bg,
    color: tpl.textColor,
    fontFamily: tpl.fontFamily,
    padding: '32px 28px',
    minHeight: '100%',
    borderRadius: 20,
    border: `1px solid ${tpl.borderColor}`,
    boxShadow: tpl.shadow,
    position: 'relative',
    overflow: 'hidden',
  }), [tpl])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--window-border)',
    background: 'var(--input-bg, rgba(255,255,255,0.04))',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const iconBtnStyle: React.CSSProperties = {
    width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, border: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)',
    cursor: 'pointer', transition: 'all 0.15s',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--window-bg)', color: 'var(--text-primary)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)',
      }}>
        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>MarkPoster · Markdown 海报生成器</span>
        <div style={{ flex: 1 }} />
        <button onClick={copyHTML} style={iconBtnStyle} title="复制 HTML">
          {copied ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
        </button>
        <button onClick={downloadHTML} style={{ ...iconBtnStyle, background: 'var(--accent)', color: '#fff' }} title="导出 HTML">
          <Download size={15} />
        </button>
      </div>

      {/* Template selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderBottom: '1px solid var(--window-border)',
        background: 'rgba(255,255,255,0.01)', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <Palette size={14} />
          <span>模板主题</span>
        </div>
        {(Object.keys(TEMPLATES) as TemplateKey[]).map(key => {
          const t = TEMPLATES[key]
          const active = template === key
          return (
            <button
              key={key}
              onClick={() => setTemplate(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${active ? t.borderColor : 'var(--window-border)'}`,
                background: active ? t.glassBg : 'rgba(255,255,255,0.02)',
                color: active ? t.titleColor : 'var(--text-primary)',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: active ? `0 0 12px ${t.borderColor}` : 'none',
              }}
            >
              <span style={{
                width: 12, height: 12, borderRadius: 6,
                background: t.accentColor,
                display: 'inline-block',
              }} />
              {t.name}
            </button>
          )
        })}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0 }}>
        {/* Left: Editor & Settings */}
        <div style={{
          width: '44%', display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--window-border)',
          minWidth: 0, overflow: 'auto',
        }}>
          {/* Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: 260 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', fontSize: 12,
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--window-border)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <FileText size={13} />
              <span>Markdown 编辑</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11 }}>{markdown.length} 字符</span>
            </div>
            <textarea
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, resize: 'none', border: 0, outline: 'none',
                padding: '16px 20px',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 13, lineHeight: 1.7,
                background: 'transparent', color: 'var(--text-primary)',
                minHeight: 180,
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--window-border)', margin: '0 14px' }} />

          {/* Poster Info Panel */}
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Type size={13} />
              <span>海报信息</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={labelStyle}>标题</div>
                <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="海报标题" />
              </div>
              <div>
                <div style={labelStyle}>副标题</div>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)} style={inputStyle} placeholder="副标题" />
              </div>
            </div>

            <div>
              <div style={labelStyle}>内容摘要</div>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }}
                placeholder="简短的内容摘要"
              />
            </div>

            <div>
              <div style={labelStyle}>
                <Image size={12} />
                <span>封面图 URL</span>
              </div>
              <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} style={inputStyle} placeholder="https://example.com/cover.jpg" />
            </div>

            <div>
              <div style={labelStyle}>
                <Tag size={12} />
                <span>标签</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                {tags.map((tag, idx) => (
                  <span key={idx} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 16,
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    fontSize: 12, fontWeight: 500,
                    border: '1px solid var(--window-border)',
                  }}>
                    {tag}
                    <button onClick={() => removeTag(idx)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  style={inputStyle}
                  placeholder="输入标签后按回车"
                />
                <button onClick={addTag} style={{
                  padding: '0 12px', borderRadius: 8, border: '1px solid var(--window-border)',
                  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={labelStyle}>
                  <User size={12} />
                  <span>作者名称</span>
                </div>
                <input value={author} onChange={e => setAuthor(e.target.value)} style={inputStyle} placeholder="作者名" />
              </div>
              <div>
                <div style={labelStyle}>作者头像 URL</div>
                <input value={authorAvatar} onChange={e => setAuthorAvatar(e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Poster Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', fontSize: 12,
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--window-border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <Eye size={13} />
            <span>海报预览 · {tpl.name}</span>
            <div style={{ flex: 1 }} />
            <Monitor size={13} />
          </div>
          <div style={{ padding: 20, flex: 1 }}>
            <div style={previewStyle}>
              <div style={{
                position: 'absolute', inset: 0,
                background: tpl.overlay, pointerEvents: 'none',
                borderRadius: 20,
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Cover */}
                {coverUrl && (
                  <div style={{
                    width: '100%', height: 200, borderRadius: 14,
                    overflow: 'hidden', marginBottom: 20,
                    border: `1px solid ${tpl.borderColor}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}>
                    <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Title */}
                <h1 style={{
                  fontSize: '1.8em', fontWeight: 700, color: tpl.titleColor,
                  lineHeight: 1.2, marginBottom: 6, letterSpacing: '-0.02em',
                  textShadow: template === 'cyberpunk' ? `0 0 10px ${tpl.titleColor},0 0 20px ${tpl.titleColor}` : 'none',
                }}>
                  {title}
                </h1>

                {/* Subtitle */}
                {subtitle && (
                  <div style={{
                    fontSize: '1em', color: tpl.accentColor,
                    fontWeight: 500, marginBottom: 16, opacity: 0.9,
                    textShadow: template === 'cyberpunk' ? `0 0 5px ${tpl.accentColor}` : 'none',
                  }}>
                    {subtitle}
                  </div>
                )}

                {/* Summary */}
                {summary && (
                  <div style={{
                    fontSize: '0.95em', lineHeight: 1.8,
                    color: tpl.textColor, opacity: 0.85,
                    marginBottom: 20, padding: '12px 16px',
                    background: tpl.chipBg, borderRadius: 10,
                    borderLeft: `3px solid ${tpl.accentColor}`,
                  }}>
                    {summary}
                  </div>
                )}

                {/* Content */}
                <div
                  style={{
                    fontSize: '0.92em', lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedHTML }}
                />

                {/* Tags */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                    {tags.map((tag, idx) => (
                      <span key={idx} style={{
                        display: 'inline-block', padding: '5px 12px',
                        borderRadius: 16, background: tpl.chipBg,
                        color: tpl.accentColor, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${tpl.borderColor}`,
                        backdropFilter: 'blur(10px)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Author */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: 16, borderTop: `1px solid ${tpl.borderColor}`,
                }}>
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={author} style={{
                      width: 34, height: 34, borderRadius: '50%',
                      objectFit: 'cover', border: `2px solid ${tpl.borderColor}`,
                    }} />
                  ) : (
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: tpl.chipBg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: tpl.accentColor, fontWeight: 600, fontSize: 13,
                      border: `2px solid ${tpl.borderColor}`,
                    }}>
                      {author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: tpl.titleColor, fontSize: 13 }}>{author}</div>
                    <div style={{ fontSize: 11, color: tpl.accentColor, opacity: 0.7 }}>
                      生成于 {new Date().toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: tpl.accentColor, opacity: 0.4 }}>
                    MarkPoster
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}