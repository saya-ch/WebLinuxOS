import { useState, useCallback, useRef, memo } from 'react'
import {
  Copy, Download, Image, Palette, Type, Monitor,
  Camera, RotateCcw, Check,
  Code2, Sparkles, Grid3X3,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface Theme {
  id: string
  name: string
  background: string
  textColor: string
  borderColor: string
  lineNumberColor: string
  gutterColor: string
  accentColor: string
}

interface Language {
  id: string
  name: string
  keywords: string[]
  lineComment: string
}

// ==================== 主题 ====================
const THEMES: Theme[] = [
  { id: 'dracula', name: 'Dracula', background: '#282a36', textColor: '#f8f8f2', borderColor: '#44475a', lineNumberColor: '#6272a4', gutterColor: '#44475a', accentColor: '#bd93f9' },
  { id: 'monokai', name: 'Monokai', background: '#272822', textColor: '#f8f8f2', borderColor: '#3e3d32', lineNumberColor: '#75715e', gutterColor: '#3e3d32', accentColor: '#a6e22e' },
  { id: 'solarized-dark', name: 'Solarized Dark', background: '#002b36', textColor: '#93a1a1', borderColor: '#073642', lineNumberColor: '#586e75', gutterColor: '#073642', accentColor: '#268bd2' },
  { id: 'nord', name: 'Nord', background: '#2e3440', textColor: '#d8dee9', borderColor: '#3b4252', lineNumberColor: '#4c566a', gutterColor: '#3b4252', accentColor: '#88c0d0' },
  { id: 'github-light', name: 'GitHub Light', background: '#ffffff', textColor: '#24292f', borderColor: '#d0d7de', lineNumberColor: '#8c959f', gutterColor: '#f6f8fa', accentColor: '#0969da' },
  { id: 'one-dark', name: 'One Dark', background: '#282c34', textColor: '#abb2bf', borderColor: '#3e4451', lineNumberColor: '#5c6370', gutterColor: '#3e4451', accentColor: '#61afef' },
  { id: 'synthwave', name: 'Synthwave', background: '#241b2f', textColor: '#f8f8f2', borderColor: '#3d2b4f', lineNumberColor: '#6c5ce7', gutterColor: '#3d2b4f', accentColor: '#ff79c6' },
  { id: 'oceanic', name: 'Oceanic', background: '#0d1b2a', textColor: '#e0e1dd', borderColor: '#1b263b', lineNumberColor: '#778da9', gutterColor: '#1b263b', accentColor: '#e0aaff' },
]

// ==================== 语言定义 ====================
const LANGUAGES: Language[] = [
  { id: 'javascript', name: 'JavaScript', lineComment: '//', keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'class', 'new', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'in', 'of', 'default', 'true', 'false', 'null', 'undefined', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'Date', 'Error'] },
  { id: 'typescript', name: 'TypeScript', lineComment: '//', keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'class', 'new', 'async', 'await', 'try', 'catch', 'throw', 'interface', 'type', 'enum', 'public', 'private', 'protected', 'readonly', 'implements', 'extends', 'abstract', 'as', 'true', 'false', 'null', 'undefined', 'void', 'never', 'string', 'number', 'boolean', 'any'] },
  { id: 'python', name: 'Python', lineComment: '#', keywords: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'global', 'nonlocal', 'pass', 'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'self'] },
  { id: 'html', name: 'HTML', lineComment: '<!--', keywords: ['<!DOCTYPE', '<html', '<head', '<body', '<div', '<span', '<p', '<a', '<img', '<ul', '<li', '<table', '<form', '<input', '<button', '<script', '<style', '<meta', '<link', '<title'] },
  { id: 'css', name: 'CSS', lineComment: '/*', keywords: ['color', 'background', 'font-size', 'margin', 'padding', 'border', 'width', 'height', 'display', 'flex', 'grid', 'position', 'top', 'left', 'right', 'bottom', 'transform', 'transition', 'animation', 'box-shadow', 'border-radius'] },
  { id: 'bash', name: 'Bash', lineComment: '#', keywords: ['echo', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'export', 'local'] },
  { id: 'json', name: 'JSON', lineComment: '//', keywords: ['true', 'false', 'null'] },
  { id: 'sql', name: 'SQL', lineComment: '--', keywords: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN', 'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'VIEW', 'DATABASE'] },
  { id: 'rust', name: 'Rust', lineComment: '//', keywords: ['fn', 'let', 'mut', 'pub', 'mod', 'use', 'struct', 'enum', 'impl', 'trait', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'as', 'in', 'where', 'move', 'ref', 'Box', 'Option', 'Some', 'None', 'Result', 'Ok', 'Err'] },
  { id: 'go', name: 'Go', lineComment: '//', keywords: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'select', 'range', 'defer', 'return', 'if', 'else', 'for', 'switch', 'case', 'default', 'nil', 'true', 'false'] },
]

// ==================== 预设代码片段 ====================
const PRESETS: Record<string, { lang: string; code: string; title: string }[]> = {
  javascript: [
    { title: '防抖函数', lang: 'javascript', code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}` },
    { title: '深拷贝', lang: 'javascript', code: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) cloned[key] = deepClone(obj[key]);
  }
  return cloned;
}` },
    { title: 'Pipeline 模式', lang: 'javascript', code: `const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
const add = n => x => x + n;
const multiply = n => x => x * n;
const result = pipe(add(2), multiply(3)(10); // 36` },
  ],
  python: [
    { title: '斐波那契生成器', lang: 'python', code: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

list(fibonacci(10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]` },
    { title: '装饰器模式', lang: 'python', code: `import time
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f'{func.__name__} took {time.time() - start:.2f}s')
        return result
    return wrapper` },
  ],
  typescript: [
    { title: '泛型工具类型', lang: 'typescript', code: `type Partial<T> = { [P in keyof T]?: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) 
  extends (k: infer I) => void ? I : never;` },
  ],
}

// ==================== 辅助函数 ====================
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function highlightSyntax(code: string, lang: Language, theme: Theme): string {
  const lines = code.split('\n')
  return lines.map((line, lineIdx) => {
    let highlighted = escapeHtml(line)
    
    // 处理字符串
    highlighted = highlighted.replace(/(".*?"|'.*?'|`.*?`)/g, `<span style="color:#f1fa8c">$1</span>`)
    
    // 处理数字
    highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, `<span style="color:#bd93f9">$1</span>`)
    
    // 处理注释
    const commentIdx = line.indexOf(lang.lineComment)
    if (commentIdx >= 0) {
      highlighted = highlighted.substring(0, commentIdx) + 
        `<span style="color:${theme.lineNumberColor}">${escapeHtml(line.substring(commentIdx))}</span>`
    }
    
    // 处理关键字
    for (const keyword of lang.keywords) {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
      highlighted = highlighted.replace(regex, `<span style="color:#ff79c6;font-weight:600">$1</span>`)
    }
    
    // 处理函数调用
    highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, 
      `<span style="color:#50fa7b">$1</span>(`)
    
    return `<div class="code-line" data-line="${lineIdx + 1}">${highlighted || '&nbsp;'}</div>`
  }).join('')
}

// ==================== 主组件 ====================
const CodeSnapPro = memo(function CodeSnapPro() {
  const [code, setCode] = useState(PRESETS.javascript[0].code)
  const [language, setLanguage] = useState<Language>(LANGUAGES[0])
  const [theme, setTheme] = useState<Theme>(THEMES[0])
  const [title, setTitle] = useState('my-awesome-code')
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showTitleBar, setShowTitleBar] = useState(true)
  const [padding, setPadding] = useState(32)
  const [fontSize, setFontSize] = useState(14)
  const [borderRadius, setBorderRadius] = useState(12)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const highlightedCode = useCallback(() => {
    return highlightSyntax(code, language, theme)
  }, [code, language, theme])

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [code])

  const handleExportPNG = useCallback(async () => {
    if (!cardRef.current) return
    setExporting(true)

    try {
      const rect = cardRef.current.getBoundingClientRect()
      const scale = 2
      const canvas = canvasRef.current
      if (!canvas) return
      
      canvas.width = rect.width * scale
      canvas.height = rect.height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 绘制背景
      ctx.fillStyle = theme.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制圆角
      const r = borderRadius * scale
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, canvas.width, canvas.height, r)
      } else {
        ctx.rect(0, 0, canvas.width, canvas.height)
      }
      ctx.clip()

      // 直接使用 canvas 绘制代码
      const fs = fontSize * scale
      const pad = padding * scale
      const lh = fs * 1.6
      const lineNumW = showLineNumbers ? String(code.split('\n').length).length * fs + fs : 0
      
      ctx.font = `${fs}px 'JetBrains Mono', 'Fira Code', monospace`
      ctx.textBaseline = 'top'

      let y = pad

      // 标题栏
      if (showTitleBar) {
        const btnY = y + fs * 0.2
        ;['#ff5f56', '#ffbd2e', '#ff9f2e'].forEach((c, i) => {
          ctx.beginPath()
          ctx.arc(pad + fs * 0.4 + i * fs * 1.3, btnY, fs * 0.35, 0, Math.PI * 2)
          ctx.fillStyle = c
          ctx.fill()
        })
        ctx.fillStyle = theme.lineNumberColor
        ctx.font = `${fs * 0.75}px monospace`
        const ext = language.id === 'javascript' ? 'js' : language.id === 'typescript' ? 'ts' : language.id === 'python' ? 'py' : language.id
        ctx.fillText(`${title || 'untitled'}.${ext}`, pad + fs * 5, btnY)
        
        y += fs * 2
        ctx.strokeStyle = theme.borderColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pad, y)
        ctx.lineTo(canvas.width - pad, y)
        ctx.stroke()
        y += fs * 1.2
      }

      // 代码行
      const lines = code.split('\n')
      lines.forEach((line, idx) => {
        if (showLineNumbers) {
          ctx.fillStyle = theme.lineNumberColor
          ctx.font = `${fs}px monospace`
          ctx.textAlign = 'right'
          ctx.fillText(String(idx + 1), pad + lineNumW, y)
          ctx.textAlign = 'left'
        }

        ctx.fillStyle = theme.textColor
        ctx.font = `${fs}px monospace`
        ctx.fillText(line || ' ', pad + lineNumW + fs, y)
        y += lh
      })

      // 下载
      const link = document.createElement('a')
      link.download = `${title || 'code-snap'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setExporting(false)
    }
  }, [code, language, theme, title, borderRadius, fontSize, padding, showLineNumbers, showTitleBar])

  const handleCopyHTML = useCallback(async () => {
    if (!cardRef.current) return
    try {
      await navigator.clipboard.writeText(cardRef.current.outerHTML)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])

  const loadPreset = useCallback((preset: { lang: string; code: string; title: string }) => {
    const lang = LANGUAGES.find(l => l.id === preset.lang)
    if (lang) setLanguage(lang)
    setCode(preset.code)
    setTitle(preset.title)
  }, [])

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold">CodeSnap Pro · 代码快照</h1>
            <p className="text-xs text-white/50">将代码转换为精美图片</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制代码'}
          </button>
          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs font-medium transition-all disabled:opacity-50"
          >
            {exporting ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {exporting ? '导出中' : '导出 PNG'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧设置面板 */}
        <div className="w-60 flex-shrink-0 border-r border-white/5 p-4 overflow-y-auto space-y-5">
          {/* 语言选择 */}
          <div>
            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5 mb-2">
              <Code2 className="w-3 h-3" /> 语言
            </label>
            <select
              value={language.id}
              onChange={(e) => {
                const lang = LANGUAGES.find(l => l.id === e.target.value)
                if (lang) setLanguage(lang)
              }}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-400/50"
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-800">{l.name}</option>
              ))}
            </select>
          </div>

          {/* 主题选择 */}
          <div>
            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5 mb-2">
              <Palette className="w-3 h-3" /> 主题
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    theme.id === t.id
                      ? 'border-purple-400 bg-purple-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className="w-full h-6 rounded mb-1.5"
                    style={{ background: t.background }}
                  />
                  <div className="text-xs font-medium truncate">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 标题 */}
          <div>
            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5 mb-2">
              <Type className="w-3 h-3" /> 文件名
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-400/50"
              placeholder="my-code"
            />
          </div>

          {/* 外观设置 */}
          <div>
            <label className="text-xs font-medium text-white/60 flex items-center gap-1.5 mb-2">
              <Monitor className="w-3 h-3" /> 外观
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">显示行号</span>
                <button
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className={`w-10 h-5 rounded-full transition-all ${showLineNumbers ? 'bg-purple-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showLineNumbers ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">显示标题栏</span>
                <button
                  onClick={() => setShowTitleBar(!showTitleBar)}
                  className={`w-10 h-5 rounded-full transition-all ${showTitleBar ? 'bg-purple-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showTitleBar ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 尺寸控制 */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-2 flex items-center justify-between">
              <span>内边距: {padding}px</span>
            </label>
            <input
              type="range"
              min="16"
              max="64"
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-white/60 mb-2 flex items-center justify-between">
              <span>字号: {fontSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="20"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-white/60 mb-2 flex items-center justify-between">
              <span>圆角: {borderRadius}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="24"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* 预设代码 */}
          {PRESETS[language.id] && (
            <div>
              <label className="text-xs font-medium text-white/60 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3" /> 预设片段
              </label>
              <div className="space-y-1">
                {PRESETS[language.id].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-xs transition-all"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 中间代码编辑器 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
            <Grid3X3 className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">代码编辑器</span>
            <div className="flex-1" />
            <span className="text-xs text-white/30">{code.split('\n').length} 行 · {code.length} 字符</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full p-4 bg-transparent text-sm text-white/90 resize-none focus:outline-none font-mono leading-relaxed"
            spellCheck={false}
            placeholder="在此输入或粘贴代码..."
            style={{ tabSize: 2 }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                const target = e.target as HTMLTextAreaElement
                const start = target.selectionStart
                const end = target.selectionEnd
                setCode(code.substring(0, start) + '  ' + code.substring(end))
                requestAnimationFrame(() => {
                  target.selectionStart = target.selectionEnd = start + 2
                })
              }
            }}
          />
        </div>

        {/* 右侧预览 */}
        <div className="flex-1 flex flex-col overflow-hidden border-l border-white/5">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
            <Image className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">实时预览</span>
          </div>
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
            <div
              ref={cardRef}
              className="code-snap-card shadow-2xl"
              style={{
                background: theme.background,
                borderRadius: `${borderRadius}px`,
                padding: `${padding}px`,
                minWidth: '320px',
                maxWidth: '100%',
                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
              }}
            >
              {showTitleBar && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: theme.borderColor }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ff9f2e' }} />
                  </div>
                  <span className="text-xs font-mono ml-2" style={{ color: theme.lineNumberColor }}>
                    {title}.{language.id === 'javascript' ? 'js' : language.id === 'typescript' ? 'ts' : language.id === 'python' ? 'py' : language.id}
                  </span>
                </div>
              )}
              <div className="flex" style={{ fontSize: `${fontSize}px`, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                {showLineNumbers && (
                  <div className="mr-4 text-right select-none" style={{ color: theme.lineNumberColor, minWidth: '2em' }}>
                    {code.split('\n').map((_, idx) => (
                      <div key={idx}>{idx + 1}</div>
                    ))}
                  </div>
                )}
                <div className="flex-1 overflow-hidden" style={{ color: theme.textColor }}>
                  <div dangerouslySetInnerHTML={{ __html: highlightedCode() }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-white/40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            CodeSnap Pro v1.0
          </span>
          <span>支持 {LANGUAGES.length} 种语言</span>
          <span>{THEMES.length} 种主题</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHTML}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60"
          >
            复制 HTML
          </button>
        </div>
      </div>
    </div>
  )
})

export default CodeSnapPro
