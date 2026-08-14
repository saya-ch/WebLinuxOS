import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { marked } from 'marked'
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Eye,
  Code,
  Download,
  Copy,
  Check,
  Palette,
  RotateCcw,
  Maximize,
  Minimize,
  FileText,
  Type,
} from 'lucide-react'

const DEFAULT_MARKDOWN = `# WebLinuxOS

## 浏览器中的完整 Linux 桌面

---

## ✨ 核心功能

- 🖥️ 120+ 创新应用
- 📁 完整文件系统
- 💻 终端模拟器
- 🎨 虚拟桌面环境
- 🔧 开发者工具集

---

## 🛠️ 开发工具

\`\`\`javascript
const hello = () => {
  console.log('Hello, WebLinuxOS!');
};
hello();
\`\`\`

- 代码编辑器
- API 测试工具
- Git 集成
- 正则表达式测试

---

## 🎨 创新应用

1. **Link Analyzer** - URL深度分析
2. **JSON/YAML** - 格式转换
3. **Regex Pro** - 正则测试
4. **API Load** - 负载测试
5. **Slides** - Markdown幻灯片

---

## 🚀 开始使用

\`\`\`bash
# 克隆项目
git clone https://github.com/saya-ch/WebLinuxOS
cd WebLinuxOS

# 安装依赖
npm install

# 启动开发
npm run dev
\`\`\`

---

## 📜 开源协议

本项目基于 MIT 协议开源

欢迎贡献代码！

---

## 🙏 感谢观看

### https://github.com/saya-ch/WebLinuxOS

> 让 Linux 在浏览器中自由运行
`

const THEMES: Record<
  string,
  { name: string; bg: string; text: string; accent: string; code: string; card: string }
> = {
  dark: {
    name: '深邃暗夜',
    bg: 'from-slate-950 via-gray-900 to-slate-900',
    text: 'text-gray-100',
    accent: 'text-cyan-400',
    code: 'bg-black/40 border-cyan-500/20',
    card: 'bg-white/[0.03] border-white/10',
  },
  ocean: {
    name: '海洋深蓝',
    bg: 'from-blue-950 via-indigo-950 to-slate-900',
    text: 'text-blue-50',
    accent: 'text-blue-300',
    code: 'bg-black/40 border-blue-500/20',
    card: 'bg-white/[0.03] border-blue-400/20',
  },
  sunset: {
    name: '温暖日落',
    bg: 'from-orange-950 via-red-950 to-slate-900',
    text: 'text-orange-50',
    accent: 'text-orange-300',
    code: 'bg-black/40 border-orange-500/20',
    card: 'bg-white/[0.03] border-orange-400/20',
  },
  forest: {
    name: '翠绿森林',
    bg: 'from-emerald-950 via-green-950 to-slate-900',
    text: 'text-emerald-50',
    accent: 'text-emerald-300',
    code: 'bg-black/40 border-emerald-500/20',
    card: 'bg-white/[0.03] border-emerald-400/20',
  },
  violet: {
    name: '神秘紫罗兰',
    bg: 'from-purple-950 via-violet-950 to-slate-900',
    text: 'text-purple-50',
    accent: 'text-purple-300',
    code: 'bg-black/40 border-purple-500/20',
    card: 'bg-white/[0.03] border-purple-400/20',
  },
  light: {
    name: '明亮白昼',
    bg: 'from-slate-100 via-gray-50 to-slate-200',
    text: 'text-gray-800',
    accent: 'text-blue-600',
    code: 'bg-white border-gray-300',
    card: 'bg-white border-gray-200 shadow-lg',
  },
}

const TRANSITIONS = ['fade', 'slide', 'slide-left', 'zoom', 'none'] as const

type Transition = (typeof TRANSITIONS)[number]

marked.setOptions({
  breaks: true,
  gfm: true,
})

export default function MarkdownToSlides() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [theme, setTheme] = useState('dark')
  const [transition, setTransition] = useState<Transition>('fade')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showEditor, setShowEditor] = useState(true)
  const [copied, setCopied] = useState(false)
  const [autoPlayInterval, setAutoPlayInterval] = useState(5)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const slides = useMemo(() => {
    const parts = markdown.split(/^---\s*$/m)
    return parts.map((p) => p.trim()).filter((p) => p.length > 0)
  }, [markdown])

  const renderedSlides = useMemo(() => {
    return slides.map((slide) => {
      const html = marked.parse(slide) as string
      return html
        .replace(
          /<pre><code[^>]*>/g,
          '<pre class="rounded-xl p-4 overflow-x-auto text-sm leading-relaxed"><code>'
        )
        .replace(/<\/code><\/pre>/g, '</code></pre>')
    })
  }, [slides])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }, [])

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide(Math.max(0, Math.min(idx, slides.length - 1)))
  }, [slides.length])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= slides.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, autoPlayInterval * 1000)
    return () => clearInterval(timer)
  }, [isPlaying, slides.length, autoPlayInterval])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'ArrowRight' || e.key === ' ') nextSlide()
        if (e.key === 'ArrowLeft') prevSlide()
        if (e.key === 'Escape') setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, nextSlide, prevSlide])

  const generateFullHTML = useCallback(() => {
    const slidesHtml = renderedSlides
      .map(
        (html, i) =>
          `<section class="slide" data-slide="${i}" ${i === 0 ? 'style="display:block"' : 'style="display:none"'}>${html}</section>`
      )
      .join('\n')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WebLinuxOS Slides</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #f1f5f9;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.slides-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}
.slide {
  width: 100%;
  height: 100vh;
  padding: 60px 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: fadeIn 0.5s ease-out;
  overflow-y: auto;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide h1 { font-size: 3.5em; font-weight: 800; margin-bottom: 0.5em; }
.slide h2 { font-size: 2.5em; font-weight: 700; margin-bottom: 0.5em; }
.slide h3 { font-size: 1.8em; font-weight: 600; margin-bottom: 0.5em; }
.slide p { font-size: 1.2em; line-height: 1.8; margin-bottom: 0.8em; }
.slide ul, .slide ol { font-size: 1.2em; line-height: 2; margin-left: 1.5em; margin-bottom: 1em; }
.slide li { margin-bottom: 0.3em; }
.slide code {
  background: rgba(0,0,0,0.4);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.9em;
}
.slide pre {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 12px;
  padding: 24px;
  overflow-x: auto;
  margin: 1em 0;
}
.slide pre code {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.6;
}
.slide blockquote {
  border-left: 4px solid #06b6d4;
  padding-left: 1.5em;
  margin: 1em 0;
  color: #94a3b8;
  font-style: italic;
}
.slide a { color: #22d3ee; text-decoration: none; }
.slide a:hover { text-decoration: underline; }
.slide strong { color: #22d3ee; }
.slide img { max-width: 100%; border-radius: 12px; margin: 1em 0; }
.slide table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 1em;
}
.slide th, .slide td {
  border: 1px solid rgba(255,255,255,0.1);
  padding: 12px;
  text-align: left;
}
.slide th { background: rgba(255,255,255,0.05); }
.slide hr {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin: 2em 0;
}
.controls {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  padding: 12px 24px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.1);
}
.controls button {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
}
.controls button:hover { background: rgba(255,255,255,0.2); }
.controls .counter {
  font-size: 14px;
  color: #94a3b8;
  min-width: 60px;
  text-align: center;
}
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #06b6d4, #3b82f6);
  transition: width 0.3s ease;
}
</style>
</head>
<body>
<div class="progress-bar" id="progressBar"></div>
<div class="slides-container">
${slidesHtml}
</div>
<div class="controls">
  <button onclick="prev()" aria-label="Previous">◀</button>
  <span class="counter" id="counter">1 / ${slides.length}</span>
  <button onclick="next()" aria-label="Next">▶</button>
</div>
<script>
let current = 0;
const slides = document.querySelectorAll('.slide');
const counter = document.getElementById('counter');
const progressBar = document.getElementById('progressBar');
function show(n) {
  slides[current].style.display = 'none';
  current = (n + slides.length) % slides.length;
  slides[current].style.display = 'flex';
  counter.textContent = (current + 1) + ' / ${slides.length}';
  progressBar.style.width = ((current + 1) / slides.length * 100) + '%';
}
function next() { show(current + 1); }
function prev() { show(current - 1); }
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') next();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'Escape') document.exitFullscreen?.();
});
</script>
</body>
</html>`
  }, [renderedSlides, slides.length])

  const downloadHTML = useCallback(() => {
    const html = generateFullHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'slides.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [generateFullHTML])

  const copyHTML = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateFullHTML())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [generateFullHTML])

  const slideTransform = useMemo(() => {
    switch (transition) {
      case 'fade':
        return 'animate-fadeIn'
      case 'slide':
        return 'animate-slideIn'
      case 'slide-left':
        return 'animate-slideInLeft'
      case 'zoom':
        return 'animate-zoomIn'
      default:
        return ''
    }
  }, [transition])

  const currentTheme = THEMES[theme]

  if (isFullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 bg-gradient-to-br ${currentTheme.bg} ${currentTheme.text} flex flex-col`}
      >
        <div className="flex-1 flex items-center justify-center p-12 overflow-hidden">
          <div
            key={currentSlide}
            className={`max-w-5xl w-full ${slideTransform}`}
            style={{ animationDuration: '0.5s' }}
          >
            <div
              className={`p-12 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl ${currentTheme.card}`}
            >
              <div
                className={`prose prose-invert max-w-none ${currentTheme.accent}`}
                dangerouslySetInnerHTML={{ __html: renderedSlides[currentSlide] || '' }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center gap-6 p-4">
          <button
            onClick={prevSlide}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl">
            <span className="text-sm font-mono">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="w-32 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={nextSlide}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <Minimize className="w-4 h-4" />
        </button>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
          .animate-slideIn { animation: slideIn 0.5s ease-out; }
          .animate-slideInLeft { animation: slideInLeft 0.5s ease-out; }
          .animate-zoomIn { animation: zoomIn 0.5s ease-out; }
          .prose h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5em; line-height: 1.1; }
          .prose h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5em; line-height: 1.2; }
          .prose h3 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5em; }
          .prose p { font-size: 1.05rem; line-height: 1.8; margin-bottom: 0.8em; opacity: 0.9; }
          .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; line-height: 2; }
          .prose li { margin-bottom: 0.4em; }
          .prose pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; overflow-x: auto; margin: 1em 0; }
          .prose code { font-family: 'SF Mono', Consolas, monospace; font-size: 0.9em; }
          .prose pre code { background: transparent; padding: 0; }
          .prose blockquote { border-left: 4px solid currentColor; padding-left: 1.5em; margin: 1em 0; opacity: 0.8; font-style: italic; }
          .prose a { color: currentColor; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.3); }
          .prose strong { color: currentColor; font-weight: 700; }
          .prose img { max-width: 100%; border-radius: 12px; margin: 1em 0; }
          .prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 2em 0; }
          .prose table { width: 100%; border-collapse: collapse; margin: 1em 0; }
          .prose th, .prose td { border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; text-align: left; }
          .prose th { background: rgba(255,255,255,0.05); }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-gray-100 overflow-hidden">
      <div className="shrink-0 px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                Markdown 幻灯片
              </h1>
              <p className="text-xs text-gray-400">Markdown编辑 · 幻灯片预览 · 一键导出</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                showEditor
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              编辑器
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" />
              全屏
            </button>
            <button
              onClick={downloadHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              导出HTML
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-gray-400">主题:</span>
          </div>
          <div className="flex items-center gap-1">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  theme === key ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                }`}
                style={{
                  background:
                    key === 'light'
                      ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
                      : key === 'ocean'
                      ? 'linear-gradient(135deg, #1e3a5f, #1e1b4b)'
                      : key === 'sunset'
                      ? 'linear-gradient(135deg, #7c2d12, #431407)'
                      : key === 'forest'
                      ? 'linear-gradient(135deg, #064e3b, #022c22)'
                      : key === 'violet'
                      ? 'linear-gradient(135deg, #4c1d95, #2e1065)'
                      : 'linear-gradient(135deg, #0f172a, #1e293b)',
                }}
                title={t.name}
              />
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <Type className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">过渡:</span>
          </div>
          <div className="flex items-center gap-1">
            {TRANSITIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTransition(t)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  transition === t
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                {t === 'fade' ? '淡入' : t === 'slide' ? '右滑' : t === 'slide-left' ? '左滑' : t === 'zoom' ? '缩放' : '无'}
              </button>
            ))}
          </div>

          <button
            onClick={isPlaying ? () => setIsPlaying(false) : () => setIsPlaying(true)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-pink-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            title={isPlaying ? '停止自动播放' : '自动播放'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-gray-500">自动播放间隔:</span>
          <input
            type="range"
            min={2}
            max={15}
            value={autoPlayInterval}
            onChange={(e) => setAutoPlayInterval(parseInt(e.target.value))}
            className="w-24 accent-pink-500"
          />
          <span className="text-[10px] text-gray-400 w-12">{autoPlayInterval}秒</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {showEditor && (
          <div className="flex flex-col rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-medium text-gray-300">Markdown 编辑器</span>
              </div>
              <span className="text-xs text-gray-500">
                {markdown.length} 字符 · {slides.length} 张幻灯片
              </span>
            </div>
            <textarea
              ref={editorRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="使用 --- 分隔幻灯片..."
              className="flex-1 px-4 py-3 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none font-mono leading-relaxed"
              spellCheck={false}
            />
            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2">
              <button
                onClick={() => setMarkdown(DEFAULT_MARKDOWN)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                重置示例
              </button>
              <div className="flex-1" />
              <span className="text-[10px] text-gray-600">使用 --- 分隔幻灯片</span>
            </div>
          </div>
        )}

        <div className="flex flex-col rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">幻灯片预览</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyHTML}
                className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                title="复制HTML"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={downloadHTML}
                className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                title="下载HTML"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
              {slides.length > 0 ? (
                <div
                  key={`${currentSlide}-${transition}`}
                  className={`w-full max-w-3xl ${slideTransform}`}
                  style={{
                    animationDuration: '0.5s',
                    maxHeight: '100%',
                    overflowY: 'auto',
                  }}
                >
                  <div
                    className={`p-8 rounded-2xl bg-white/[0.02] border border-white/10 ${currentTheme.text}`}
                  >
                    <div
                      className={`prose prose-invert max-w-none ${currentTheme.accent}`}
                      dangerouslySetInnerHTML={{ __html: renderedSlides[currentSlide] || '' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">添加内容开始创建幻灯片</div>
              )}
            </div>

            <div className="shrink-0 px-4 py-3 border-t border-white/5">
              <div className="flex items-center gap-4">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                      style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    {currentSlide + 1} / {slides.length}
                  </span>
                </div>

                <button
                  onClick={nextSlide}
                  disabled={currentSlide >= slides.length - 1}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`w-8 h-1.5 rounded-full transition-all shrink-0 ${
                      i === currentSlide
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={`幻灯片 ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideIn { animation: slideIn 0.5s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.5s ease-out; }
        .animate-zoomIn { animation: zoomIn 0.5s ease-out; }
        .prose h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5em; line-height: 1.2; }
        .prose h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5em; line-height: 1.3; }
        .prose h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5em; }
        .prose p { font-size: 0.95rem; line-height: 1.8; margin-bottom: 0.8em; opacity: 0.9; }
        .prose ul, .prose ol { margin-left: 1.3em; margin-bottom: 1em; line-height: 1.9; font-size: 0.95rem; }
        .prose li { margin-bottom: 0.3em; }
        .prose pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px; overflow-x: auto; margin: 1em 0; }
        .prose code { font-family: 'SF Mono', Consolas, monospace; font-size: 0.85em; }
        .prose pre code { background: transparent; padding: 0; }
        .prose blockquote { border-left: 3px solid currentColor; padding-left: 1em; margin: 1em 0; opacity: 0.8; font-style: italic; }
        .prose a { color: currentColor; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.3); }
        .prose strong { color: currentColor; font-weight: 700; }
        .prose img { max-width: 100%; border-radius: 10px; margin: 1em 0; }
        .prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 1.5em 0; }
        .prose table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }
        .prose th, .prose td { border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; text-align: left; }
        .prose th { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  )
}