import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { marked } from 'marked'
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Maximize,
  Minimize,
  FileText,
  Palette,
  RotateCcw,
  Layers,
  Copy,
  Check,
} from 'lucide-react'

/* ============================================================
   SlideForge — Markdown → 幻灯片演示工具
   ============================================================
   • 分栏布局：左侧 Markdown 编辑器 / 右侧幻灯片预览
   • 以 `---` 作为幻灯片分隔符
   • 三种内置主题：minimal / dark / gradient
   • 支持键盘左右箭头、按钮导航、全屏演示模式
   • 导出为独立 HTML 文件
   • 完全自包含，TypeScript，默认导出
   ============================================================ */

/* ---------- types ---------- */

type ThemeId = 'minimal' | 'dark' | 'gradient'

interface SlideTheme {
  label: string
  /** slide background applied as inline style */
  slideBg: string
  /** slide text colour */
  slideText: string
  /** accent / strong colour */
  accent: string
  /** code-block background */
  codeBg: string
  /** blockquote border colour */
  quoteBorder: string
  /** navigation bar background */
  navBg: string
  /** top-bar / header bg (editor chrome) */
  headerBg: string
  /** editor textarea colour */
  editorText: string
  /** link colour */
  linkColor: string
}

/* ---------- themes ---------- */

const THEMES: Record<ThemeId, SlideTheme> = {
  minimal: {
    label: '极简',
    slideBg: '#fafafa',
    slideText: '#1a1a2e',
    accent: '#2563eb',
    codeBg: '#f1f5f9',
    quoteBorder: '#94a3b8',
    navBg: '#f1f5f9ee',
    headerBg: '#f8fafc',
    editorText: '#1e293b',
    linkColor: '#2563eb',
  },
  dark: {
    label: '深邃',
    slideBg: 'linear-gradient(145deg, #0f172a, #1e293b)',
    slideText: '#e2e8f0',
    accent: '#38bdf8',
    codeBg: '#0d1117',
    quoteBorder: '#38bdf8',
    navBg: 'rgba(15,23,42,0.92)',
    headerBg: '#0f172a',
    editorText: '#cbd5e1',
    linkColor: '#38bdf8',
  },
  gradient: {
    label: '渐变',
    slideBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    slideText: '#ffffff',
    accent: '#fde68a',
    codeBg: 'rgba(0,0,0,0.35)',
    quoteBorder: '#fde68a',
    navBg: 'rgba(88,80,140,0.88)',
    headerBg: '#1e1b4b',
    editorText: '#e0e7ff',
    linkColor: '#fde68a',
  },
}

/* ---------- defaults ---------- */

const DEFAULT_MARKDOWN = `# SlideForge

## 用 Markdown 构建精美幻灯片

---

## ✨ 核心功能

- **实时预览** — 左侧编写，右侧即刻渲染
- **多主题切换** — 极简 / 深邃 / 渐变 三种风格
- **全屏演示** — 一键进入演示模式
- **导出 HTML** — 生成可独立运行的演示文件

---

## 🛠️ Markdown 支持

\`\`\`js
const greeting = 'Hello, SlideForge!'
console.log(greeting)
\`\`\`

支持 *斜体*、**粗体**、~~删除线~~、\`行内代码\`

---

## 📋 列表与引用

1. 第一步：编写 Markdown
2. 第二步：选择主题
3. 第三步：全屏演示或导出

> 💡 提示：使用 \`---\` 分隔幻灯片

---

## 🖼️ 图片与表格

| 功能 | 状态 |
|------|------|
| Markdown 解析 | ✅ |
| 主题切换 | ✅ |
| 键盘导航 | ✅ |
| 导出 HTML | ✅ |

---

## 🚀 快速开始

\`\`\`bash
# 在编辑区输入 Markdown
# 用 --- 分隔每张幻灯片
# 点击"演示"进入全屏
\`\`\`

---

## 🙏 感谢使用

### SlideForge

> *Make slides from Markdown.*
`

/* ---------- markdown setup ---------- */

marked.use({ gfm: true, breaks: true })

/* sanitise output — strip <script>, event handlers, and javascript: URLs */
const sanitize = (html: string): string =>
  html
    .replace(/<script\b[^<]*(?:<\/script>)?/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\shref\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, ' href="#"')
    .replace(/\ssrc\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')

/* ---------- helpers ---------- */

function parseSlides(md: string): string[] {
  return md
    .split(/^---\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
}

function renderMarkdownToHtml(md: string): string {
  return sanitize(marked.parse(md) as string)
}

/* ---------- component ---------- */

export default function SlideForge() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [themeId, setThemeId] = useState<ThemeId>('dark')
  const [isPresenting, setIsPresenting] = useState(false)
  const [copied, setCopied] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const theme = THEMES[themeId]

  /* ---------- parsed slides ---------- */

  const slides = useMemo(() => parseSlides(markdown), [markdown])
  const renderedSlides = useMemo(() => slides.map(renderMarkdownToHtml), [slides])

  /* ---------- navigation ---------- */

  const goTo = useCallback(
    (idx: number) => setCurrentSlide(Math.max(0, Math.min(idx, slides.length - 1))),
    [slides.length],
  )
  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo])
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo])

  /* ---------- keyboard ---------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isPresenting) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'Escape') setIsPresenting(false)
      /* number keys 0-9 → jump to slide (1-indexed) */
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= 9 && n <= slides.length) goTo(n - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPresenting, next, prev, goTo, slides.length])

  /* ---------- fullscreen API ---------- */

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement
    const fn = el.requestFullscreen?.bind(el) ?? (el as any).webkitRequestFullscreen?.bind(el)
    fn?.()
    setIsPresenting(true)
  }, [])

  const exitFullscreen = useCallback(() => {
    const fn =
      document.exitFullscreen?.bind(document) ??
      (document as any).webkitExitFullscreen?.bind(document)
    fn?.()
    setIsPresenting(false)
  }, [])

  /* ---------- export ---------- */

  const generateExportHTML = useCallback(() => {
    const slideSections = renderedSlides
      .map(
        (html, i) =>
          `<section class="sf-slide" data-idx="${i}" ${i === 0 ? 'style="display:flex"' : 'style="display:none"'}>${html}</section>`,
      )
      .join('\n')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SlideForge Presentation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans SC',sans-serif;background:${theme.slideBg};color:${theme.slideText};min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
.sf-wrap{width:100vw;height:100vh;position:relative}
.sf-slide{width:100%;height:100vh;padding:64px 80px;display:none;flex-direction:column;justify-content:center;animation:sfFadeIn .45s ease;overflow-y:auto}
.sf-slide h1{font-size:3rem;font-weight:800;margin-bottom:.45em;line-height:1.15}
.sf-slide h2{font-size:2.2rem;font-weight:700;margin-bottom:.45em;line-height:1.2}
.sf-slide h3{font-size:1.5rem;font-weight:600;margin-bottom:.4em}
.sf-slide p{font-size:1.15rem;line-height:1.85;margin-bottom:.75em;opacity:.92}
.sf-slide ul,.sf-slide ol{font-size:1.15rem;line-height:2;margin-left:1.5em;margin-bottom:1em}
.sf-slide li{margin-bottom:.25em}
.sf-slide pre{background:${theme.codeBg};border:1px solid rgba(128,128,128,.18);border-radius:12px;padding:20px;overflow-x:auto;margin:1em 0}
.sf-slide code{font-family:'SF Mono',Consolas,monospace;font-size:.88em}
.sf-slide pre code{background:transparent;padding:0}
.sf-slide blockquote{border-left:4px solid ${theme.quoteBorder};padding-left:1.4em;margin:1em 0;font-style:italic;opacity:.85}
.sf-slide a{color:${theme.linkColor};text-decoration:none}
.sf-slide a:hover{text-decoration:underline}
.sf-slide strong{color:${theme.accent}}
.sf-slide img{max-width:100%;border-radius:12px;margin:1em 0}
.sf-slide table{width:100%;border-collapse:collapse;margin:1em 0;font-size:1em}
.sf-slide th,.sf-slide td{border:1px solid rgba(128,128,128,.18);padding:10px 14px;text-align:left}
.sf-slide th{background:rgba(128,128,128,.08);font-weight:600}
.sf-slide hr{border:none;border-top:1px solid rgba(128,128,128,.18);margin:2em 0}
@keyframes sfFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.sf-bar{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:18px;background:${theme.navBg};backdrop-filter:blur(16px);padding:10px 28px;border-radius:999px;border:1px solid rgba(255,255,255,.1)}
.sf-bar button{background:rgba(255,255,255,.1);border:none;color:inherit;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .2s}
.sf-bar button:hover{background:rgba(255,255,255,.22)}
.sf-counter{font-size:13px;opacity:.6;min-width:54px;text-align:center;font-variant-numeric:tabular-nums}
.sf-progress{position:fixed;top:0;left:0;height:3px;background:${theme.accent};transition:width .3s ease}
</style>
</head>
<body>
<div class="sf-progress" id="sfProgress"></div>
<div class="sf-wrap">${slideSections}</div>
<div class="sf-bar">
<button onclick="sfPrev()" aria-label="Prev">\u25C0</button>
<span class="sf-counter" id="sfCounter">1 / ${slides.length}</span>
<button onclick="sfNext()" aria-label="Next">\u25B6</button>
</div>
<script>
let cur=0;const ss=document.querySelectorAll('.sf-slide'),cnt=document.getElementById('sfCounter'),pg=document.getElementById('sfProgress');
function sfShow(n){ss[cur].style.display='none';cur=(n+ss.length)%ss.length;ss[cur].style.display='flex';cnt.textContent=(cur+1)+' / '+ss.length;pg.style.width=((cur+1)/ss.length*100)+'%'}
function sfNext(){sfShow(cur+1)}function sfPrev(){sfShow(cur-1)}
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();sfNext()}if(e.key==='ArrowLeft'){e.preventDefault();sfPrev()}if(e.key==='Escape')document.exitFullscreen?.()});
</script>
</body>
</html>`
  }, [renderedSlides, slides.length, theme])

  const downloadHTML = useCallback(() => {
    const html = generateExportHTML()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'slideforge-presentation.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [generateExportHTML])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateExportHTML())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard not available */
    }
  }, [generateExportHTML])

  /* ---------- percentage ---------- */

  const progress = slides.length > 0 ? ((currentSlide + 1) / slides.length) * 100 : 0

  /* ==========================================================
     RENDER — Fullscreen presentation mode
     ========================================================== */
  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: theme.slideBg, color: theme.slideText }}
      >
        {/* progress bar */}
        <div
          className="h-[3px] shrink-0"
          style={{
            width: `${progress}%`,
            background: theme.accent,
            transition: 'width .3s ease',
          }}
        />

        {/* slide body */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-16 overflow-hidden">
          <div key={currentSlide} className="sf-anim-slide max-w-5xl w-full">
            <div
              className="p-8 md:p-12 rounded-3xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="sf-prose max-w-none"
                style={{ color: theme.slideText, accentColor: theme.accent }}
                dangerouslySetInnerHTML={{ __html: renderedSlides[currentSlide] ?? '' }}
              />
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <div className="shrink-0 flex items-center justify-center gap-5 pb-5">
          <button
            onClick={prev}
            disabled={currentSlide === 0}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            aria-label="上一张"
          >
            <ChevronLeft size={22} />
          </button>
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-full"
            style={{
              background: theme.navBg,
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-sm font-mono tabular-nums opacity-60">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: theme.accent }}
              />
            </div>
          </div>
          <button
            onClick={next}
            disabled={currentSlide >= slides.length - 1}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            aria-label="下一张"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* exit button */}
        <button
          onClick={exitFullscreen}
          className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          title="退出演示"
          aria-label="退出演示"
        >
          <Minimize size={16} />
        </button>

        {/* inline keyframe styles for slide animation */}
        <style>{`
          @keyframes sfPresentIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
          .sf-anim-slide { animation: sfPresentIn .45s ease-out; }
          .sf-prose h1 { font-size: 2.8rem; font-weight: 800; margin-bottom: .5em; line-height: 1.12; }
          .sf-prose h2 { font-size: 2rem; font-weight: 700; margin-bottom: .5em; line-height: 1.2; }
          .sf-prose h3 { font-size: 1.4rem; font-weight: 600; margin-bottom: .45em; }
          .sf-prose p  { font-size: 1.1rem; line-height: 1.85; margin-bottom: .75em; opacity: .92; }
          .sf-prose ul, .sf-prose ol { margin-left: 1.5em; margin-bottom: 1em; line-height: 2; font-size: 1.05rem; }
          .sf-prose li { margin-bottom: .3em; }
          .sf-prose pre { background: ${theme.codeBg}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; overflow-x: auto; margin: 1em 0; }
          .sf-prose code { font-family: 'SF Mono', Consolas, monospace; font-size: .88em; }
          .sf-prose pre code { background: transparent; padding: 0; }
          .sf-prose blockquote { border-left: 4px solid ${theme.quoteBorder}; padding-left: 1.4em; margin: 1em 0; font-style: italic; opacity: .85; }
          .sf-prose a { color: ${theme.linkColor}; }
          .sf-prose strong { color: ${theme.accent}; }
          .sf-prose img { max-width: 100%; border-radius: 12px; margin: 1em 0; }
          .sf-prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 2em 0; }
          .sf-prose table { width: 100%; border-collapse: collapse; margin: 1em 0; }
          .sf-prose th, .sf-prose td { border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; text-align: left; }
          .sf-prose th { background: rgba(255,255,255,0.05); font-weight: 600; }
        `}</style>
      </div>
    )
  }

  /* ==========================================================
     RENDER — Main split-pane editor
     ========================================================== */
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: theme.slideBg, color: theme.slideText }}
    >
      {/* ---------- header ---------- */}
      <header
        className="shrink-0 px-5 py-3 flex items-center justify-between gap-4 border-b"
        style={{
          background: theme.headerBg,
          borderColor: 'rgba(128,128,128,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--accent-color, #6366f1), #a855f7)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
          >
            <Presentation size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: theme.accent }}>
              SlideForge
            </h1>
            <p className="text-[10px] opacity-50">Markdown → Slides · 实时预览</p>
          </div>
        </div>

        {/* theme switcher */}
        <div className="flex items-center gap-2">
          <Palette size={14} className="opacity-40" />
          {(Object.keys(THEMES) as ThemeId[]).map((id) => (
            <button
              key={id}
              onClick={() => setThemeId(id)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background:
                  themeId === id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: themeId === id ? `1px solid ${theme.accent}44` : '1px solid transparent',
                color: themeId === id ? theme.accent : 'inherit',
                opacity: themeId === id ? 1 : 0.55,
              }}
            >
              {THEMES[id].label}
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={enterFullscreen}
            className="sf-glass-btn"
            style={{ color: theme.slideText }}
            title="演示模式"
          >
            <Maximize size={14} />
            <span>演示</span>
          </button>
          <button
            onClick={copyToClipboard}
            className="sf-glass-btn"
            style={{ color: theme.slideText }}
            title="复制 HTML"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
          <button
            onClick={downloadHTML}
            className="sf-action-btn"
            title="导出 HTML"
          >
            <Download size={14} />
            <span>导出</span>
          </button>
        </div>
      </header>

      {/* ---------- split pane ---------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — editor */}
        <div
          className="flex flex-col w-1/2 min-w-0 border-r"
          style={{ borderColor: 'rgba(128,128,128,0.15)' }}
        >
          <div
            className="shrink-0 flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: 'rgba(128,128,128,0.12)', background: 'rgba(128,128,128,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <FileText size={13} className="opacity-40" />
              <span className="text-xs font-medium opacity-60">Markdown 编辑器</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] opacity-40">
              <span>{markdown.length} 字符</span>
              <span>{slides.length} 张幻灯片</span>
              <button
                onClick={() => {
                  setMarkdown(DEFAULT_MARKDOWN)
                  setCurrentSlide(0)
                }}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                title="重置为示例"
              >
                <RotateCcw size={10} />
                重置
              </button>
            </div>
          </div>
          <textarea
            ref={editorRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={"使用 --- 分隔每张幻灯片\n\n# 标题\n内容\n\n---\n\n# 下一张\n更多内容"}
            className="flex-1 w-full px-5 py-4 bg-transparent focus:outline-none resize-none font-mono text-sm leading-relaxed"
            style={{ color: theme.editorText, tabSize: 2 }}
            spellCheck={false}
          />
        </div>

        {/* RIGHT — preview */}
        <div className="flex flex-col w-1/2 min-w-0">
          <div
            className="shrink-0 flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: 'rgba(128,128,128,0.12)', background: 'rgba(128,128,128,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <Eye size={13} className="opacity-40" />
              <span className="text-xs font-medium opacity-60">幻灯片预览</span>
            </div>
            <span className="text-[10px] opacity-30 tabular-nums">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>

          {/* slide area */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            {slides.length > 0 ? (
              <div
                key={currentSlide}
                className="sf-anim-slide w-full max-w-2xl"
                style={{ maxHeight: '100%', overflowY: 'auto' }}
              >
                <div
                  className="p-6 md:p-8 rounded-2xl sf-glass-card"
                  style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div
                    className="sf-prose-sm max-w-none"
                    style={{ color: theme.slideText, accentColor: theme.accent }}
                    dangerouslySetInnerHTML={{ __html: renderedSlides[currentSlide] ?? '' }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center opacity-30 text-sm">
                <Layers size={40} className="mx-auto mb-3 opacity-40" />
                在左侧输入 Markdown 内容
                <br />
                用 <code className="opacity-60">---</code> 分隔幻灯片
              </div>
            )}
          </div>

          {/* bottom nav bar */}
          <div
            className="shrink-0 px-4 py-3 border-t"
            style={{ borderColor: 'rgba(128,128,128,0.12)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                disabled={currentSlide === 0}
                className="sf-nav-btn disabled:opacity-25"
                aria-label="上一张"
              >
                <ChevronLeft size={16} />
              </button>

              {/* progress bar + counter */}
              <div className="flex-1 flex items-center gap-2.5">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(128,128,128,0.15)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: theme.accent }}
                  />
                </div>
                <span className="text-[11px] font-mono tabular-nums opacity-50 min-w-[48px] text-right">
                  {currentSlide + 1}/{slides.length}
                </span>
              </div>

              <button
                onClick={next}
                disabled={currentSlide >= slides.length - 1}
                className="sf-nav-btn disabled:opacity-25"
                aria-label="下一张"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* slide dot indicators */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-0.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="shrink-0 rounded-full transition-all"
                  style={{
                    width: i === currentSlide ? 20 : 6,
                    height: 6,
                    background:
                      i === currentSlide
                        ? theme.accent
                        : 'rgba(128,128,128,0.2)',
                  }}
                  title={`幻灯片 ${i + 1}`}
                  aria-label={`跳转到第 ${i + 1} 张`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- global scoped styles ---------- */}
      <style>{`
        /* glass morphism button base */
        .sf-glass-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 500;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(8px); cursor: pointer; transition: all .2s;
        }
        .sf-glass-btn:hover { background: rgba(255,255,255,0.12); }
        .sf-action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
          background: linear-gradient(135deg, var(--accent-color, #6366f1), #a855f7);
          color: #fff; border: none; cursor: pointer; transition: opacity .2s;
        }
        .sf-action-btn:hover { opacity: .88; }
        .sf-nav-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06); transition: background .2s; color: inherit;
        }
        .sf-nav-btn:hover { background: rgba(255,255,255,0.14); }
        /* preview prose (small) */
        .sf-prose-sm h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: .45em; line-height: 1.2; }
        .sf-prose-sm h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: .45em; line-height: 1.3; }
        .sf-prose-sm h3 { font-size: 1.05rem; font-weight: 600; margin-bottom: .4em; }
        .sf-prose-sm p  { font-size: .88rem; line-height: 1.85; margin-bottom: .7em; opacity: .92; }
        .sf-prose-sm ul, .sf-prose-sm ol { margin-left: 1.3em; margin-bottom: .85em; line-height: 1.9; font-size: .88rem; }
        .sf-prose-sm li { margin-bottom: .25em; }
        .sf-prose-sm pre {
          background: ${theme.codeBg}; border: 1px solid rgba(128,128,128,0.18);
          border-radius: 10px; padding: 14px; overflow-x: auto; margin: .85em 0;
        }
        .sf-prose-sm code { font-family: 'SF Mono', Consolas, monospace; font-size: .82em; }
        .sf-prose-sm pre code { background: transparent; padding: 0; }
        .sf-prose-sm blockquote {
          border-left: 3px solid ${theme.quoteBorder}; padding-left: 1.2em;
          margin: .85em 0; font-style: italic; opacity: .82;
        }
        .sf-prose-sm a { color: ${theme.linkColor}; text-decoration: none; }
        .sf-prose-sm a:hover { text-decoration: underline; }
        .sf-prose-sm strong { color: ${theme.accent}; font-weight: 700; }
        .sf-prose-sm img { max-width: 100%; border-radius: 10px; margin: .85em 0; }
        .sf-prose-sm hr { border: none; border-top: 1px solid rgba(128,128,128,0.15); margin: 1.5em 0; }
        .sf-prose-sm table { width: 100%; border-collapse: collapse; margin: .85em 0; font-size: .82em; }
        .sf-prose-sm th, .sf-prose-sm td { border: 1px solid rgba(128,128,128,0.15); padding: 7px 11px; text-align: left; }
        .sf-prose-sm th { background: rgba(128,128,128,0.06); font-weight: 600; }
        /* slide animation */
        @keyframes sfSlideIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .sf-anim-slide { animation: sfSlideIn .4s ease-out; }
        /* glass card */
        .sf-glass-card { transition: box-shadow .3s; }
        .sf-glass-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  )
}
