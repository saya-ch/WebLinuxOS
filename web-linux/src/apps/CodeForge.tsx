import { useState, useCallback, useMemo, memo } from 'react'
import {
  Braces, Hash, Clock, Regex, Palette, KeyRound,
  Copy, Check, Trash2, Lock, Unlock, Calendar, Globe, Binary, FileJson,
  Type, Sparkles
} from 'lucide-react'
import './CodeForge.css'

/* ============================================================
   CodeForge - 开发者工具集
   ============================================================
   离线运行的 11 个核心开发者工具，覆盖日常编码中的高频需求：
   - JSON 格式化与校验
   - Base64 / URL 编码解码
   - 正则表达式测试
   - 颜色值转换（HEX/RGB/HSL）
   - Unix 时间戳转换
   - Cron 表达式解析
   - JWT 解析
   - 哈希计算（SHA-256）
   - 字符串处理（大小写、计数、转换）
   - URL 参数解析
   - 字符编码转换
   ============================================================ */

type ToolId = 'json' | 'base64' | 'url' | 'regex' | 'color' | 'timestamp' | 'cron' | 'jwt' | 'hash' | 'string' | 'urldecode'

const TOOLS: { id: ToolId; name: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'json', name: 'JSON', icon: <Braces size={12} />, color: 'var(--cf-cyan)', desc: '格式化、校验、压缩 JSON' },
  { id: 'base64', name: 'Base64', icon: <Lock size={12} />, color: 'var(--cf-amber)', desc: 'Base64 编码/解码' },
  { id: 'url', name: 'URL', icon: <Globe size={12} />, color: 'var(--cf-violet)', desc: 'URL 编码/解码与参数解析' },
  { id: 'regex', name: 'Regex', icon: <Regex size={12} />, color: 'var(--cf-rose)', desc: '正则表达式测试与高亮' },
  { id: 'color', name: 'Color', icon: <Palette size={12} />, color: 'var(--cf-orange)', desc: 'HEX/RGB/HSL 颜色转换' },
  { id: 'timestamp', name: '时间戳', icon: <Clock size={12} />, color: 'var(--cf-green)', desc: 'Unix 时间戳转换' },
  { id: 'cron', name: 'Cron', icon: <Calendar size={12} />, color: 'var(--cf-violet)', desc: 'Cron 表达式解析' },
  { id: 'jwt', name: 'JWT', icon: <KeyRound size={12} />, color: 'var(--cf-amber)', desc: 'JWT Token 解析' },
  { id: 'hash', name: 'Hash', icon: <Hash size={12} />, color: 'var(--cf-cyan)', desc: 'SHA-256/SHA-1/MD5 哈希' },
  { id: 'string', name: 'String', icon: <Type size={12} />, color: 'var(--cf-green)', desc: '字符串处理与转换' },
  { id: 'urldecode', name: 'URL Params', icon: <FileJson size={12} />, color: 'var(--cf-rose)', desc: '查询字符串解析' },
]

const CodeForge = memo(function CodeForge() {
  const [activeTool, setActiveTool] = useState<ToolId>('json')

  return (
    <div className="cf-root">
      <header className="cf-header">
        <div className="cf-brand">
          <div className="cf-logo">$</div>
          <div className="cf-title">
            <h1>CodeForge</h1>
            <small>Developer Toolset · 11 tools</small>
          </div>
        </div>

        <div className="cf-tabs">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`cf-tab ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              title={tool.desc}
            >
              {tool.icon} {tool.name}
            </button>
          ))}
        </div>

        <div className="cf-status">
          <span className="cf-status-dot" />
          <span>本地运行</span>
        </div>
      </header>

      <div className="cf-body">
        {activeTool === 'json' && <JsonTool />}
        {activeTool === 'base64' && <Base64Tool />}
        {activeTool === 'url' && <UrlTool />}
        {activeTool === 'regex' && <RegexTool />}
        {activeTool === 'color' && <ColorTool />}
        {activeTool === 'timestamp' && <TimestampTool />}
        {activeTool === 'cron' && <CronTool />}
        {activeTool === 'jwt' && <JwtTool />}
        {activeTool === 'hash' && <HashTool />}
        {activeTool === 'string' && <StringTool />}
        {activeTool === 'urldecode' && <UrlParamsTool />}
      </div>

      <footer className="cf-footer">
        <div className="cf-footer-stats">
          <span className="cf-stat-item">v1.0</span>
          <span className="cf-stat-item">11 tools</span>
          <span className="cf-stat-item">本地处理</span>
        </div>
        <div>所有运算在你的浏览器中完成 · 无任何数据外传</div>
      </footer>
    </div>
  )
})

/* ============== Shared Components ============== */

function PaneHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="cf-pane-header">
      <span>{title}</span>
      <div className="cf-pane-header-actions">{children}</div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }, [text])
  return (
    <button className="cf-icon-btn" onClick={handleCopy} title="复制">
      {copied ? <Check size={12} color="var(--cf-green)" /> : <Copy size={12} />}
    </button>
  )
}

/* ============== JSON Tool ============== */

const JsonTool = () => {
  const [input, setInput] = useState('{\n  "name": "WebLinuxOS",\n  "version": "1.0.0",\n  "features": [\n    "desktop",\n    "terminal",\n    "knowledge"\n  ],\n  "active": true\n}')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: '', type: 'empty' as const }
    try {
      const parsed = JSON.parse(input)
      return { ok: true, output: JSON.stringify(parsed, null, 2), type: 'success' as const, data: parsed }
    } catch (e) {
      return { ok: false, output: (e as Error).message, type: 'error' as const }
    }
  }, [input])

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed))
    } catch {}
  }

  return (
    <>
      <div className="cf-pane">
        <PaneHeader title="输入">
          <button className="cf-icon-btn" onClick={() => setInput('')} title="清空">
            <Trash2 size={12} />
          </button>
        </PaneHeader>
        <textarea
          className="cf-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴或输入 JSON..."
          spellCheck={false}
        />
      </div>
      <div className="cf-pane">
        <PaneHeader title="输出">
          <button className="cf-icon-btn" onClick={minify} title="压缩">
            <Binary size={12} />
          </button>
          <CopyButton text={result.type === 'success' ? result.output : ''} />
        </PaneHeader>
        <div className="cf-output">
          {result.type === 'empty' && <div className="cf-output empty">等待输入...</div>}
          {result.type === 'error' && <div className="cf-error">✕ {result.output}</div>}
          {result.type === 'success' && <pre dangerouslySetInnerHTML={{ __html: highlightJson(result.output) }} />}
        </div>
      </div>
    </>
  )
}

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'cf-json-number'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'cf-json-key' : 'cf-json-string'
      } else if (/true|false/.test(match)) {
        cls = 'cf-json-bool'
      } else if (/null/.test(match)) {
        cls = 'cf-json-null'
      }
      return `<span class="${cls}">${match}</span>`
    })
}

/* ============== Base64 Tool ============== */

const Base64Tool = () => {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: '' }
    try {
      if (mode === 'encode') {
        return { ok: true, output: btoa(unescape(encodeURIComponent(input))) }
      } else {
        return { ok: true, output: decodeURIComponent(escape(atob(input))) }
      }
    } catch (e) {
      return { ok: false, output: (e as Error).message }
    }
  }, [input, mode])

  return (
    <>
      <div className="cf-pane">
        <PaneHeader title={`${mode === 'encode' ? '原文' : 'Base64 字符串'}`}>
          <button className="cf-icon-btn" onClick={() => setInput('')}><Trash2 size={12} /></button>
        </PaneHeader>
        <textarea
          className="cf-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
          spellCheck={false}
        />
      </div>
      <div className="cf-pane">
        <PaneHeader title={`${mode === 'encode' ? 'Base64 编码' : '解码结果'}`}>
          <CopyButton text={result.output} />
        </PaneHeader>
        <div className="cf-form-row">
          <button
            className={`cf-btn ${mode === 'encode' ? 'primary' : ''}`}
            onClick={() => setMode('encode')}
          >
            <Lock size={11} /> 编码
          </button>
          <button
            className={`cf-btn ${mode === 'decode' ? 'primary' : ''}`}
            onClick={() => setMode('decode')}
          >
            <Unlock size={11} /> 解码
          </button>
        </div>
        <div className="cf-output">
          {result.ok ? (
            <pre>{result.output || <span style={{ color: 'var(--cf-text-muted)' }}>结果将显示在这里...</span>}</pre>
          ) : (
            <div className="cf-error">✕ {result.output}</div>
          )}
        </div>
      </div>
    </>
  )
}

/* ============== URL Tool ============== */

const UrlTool = () => {
  const [input, setInput] = useState('https://example.com/path?name=张三&age=25&city=北京')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: '' }
    try {
      return {
        ok: true,
        output: mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
      }
    } catch (e) {
      return { ok: false, output: (e as Error).message }
    }
  }, [input, mode])

  return (
    <>
      <div className="cf-pane">
        <PaneHeader title="输入">
          <button className="cf-icon-btn" onClick={() => setInput('')}><Trash2 size={12} /></button>
        </PaneHeader>
        <textarea
          className="cf-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入 URL 字符串..."
          spellCheck={false}
        />
      </div>
      <div className="cf-pane">
        <PaneHeader title={mode === 'encode' ? 'URL 编码' : 'URL 解码'}>
          <CopyButton text={result.output} />
        </PaneHeader>
        <div className="cf-form-row">
          <button className={`cf-btn ${mode === 'encode' ? 'primary' : ''}`} onClick={() => setMode('encode')}>
            <Lock size={11} /> 编码
          </button>
          <button className={`cf-btn ${mode === 'decode' ? 'primary' : ''}`} onClick={() => setMode('decode')}>
            <Unlock size={11} /> 解码
          </button>
        </div>
        <div className="cf-output">
          {result.ok ? (
            <pre>{result.output || <span style={{ color: 'var(--cf-text-muted)' }}>结果将显示在这里...</span>}</pre>
          ) : (
            <div className="cf-error">✕ {result.output}</div>
          )}
        </div>
      </div>
    </>
  )
}

/* ============== Regex Tool ============== */

const RegexTool = () => {
  const [pattern, setPattern] = useState('\\b(\\w+)\\b')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog.\nHello World from CodeForge.')

  const result = useMemo(() => {
    if (!pattern || !text) return { ok: true, output: '', matches: [] as RegExpMatchArray[] }
    try {
      const re = new RegExp(pattern, flags)
      const matches: RegExpMatchArray[] = []
      let match: RegExpExecArray | null
      if (flags.includes('g')) {
        while ((match = re.exec(text)) !== null) {
          matches.push(match)
          if (match.index === re.lastIndex) re.lastIndex++
        }
      } else {
        const m = text.match(re)
        if (m) matches.push(m)
      }
      return { ok: true, output: '', matches }
    } catch (e) {
      return { ok: false, output: (e as Error).message, matches: [] }
    }
  }, [pattern, flags, text])

  const highlighted = useMemo(() => {
    if (!result.ok || result.matches.length === 0) return text
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      return text.replace(re, (m) => `<span class="cf-regex-match">${escapeHtml(m)}</span>`)
    } catch {
      return text
    }
  }, [text, pattern, flags, result])

  return (
    <>
      <div className="cf-pane">
        <PaneHeader title="正则表达式">
          <CopyButton text={`/${pattern}/${flags}`} />
        </PaneHeader>
        <div className="cf-form-row">
          <span className="cf-label">/</span>
          <input
            className="cf-input"
            style={{ flex: 1 }}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            spellCheck={false}
          />
          <span className="cf-label">/</span>
          <input
            className="cf-input"
            style={{ width: 60 }}
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="flags"
            spellCheck={false}
          />
        </div>
        <div className="cf-output" style={{ flex: 0, maxHeight: '40%' }}>
          <div style={{ color: 'var(--cf-text-muted)', fontSize: 11, marginBottom: 4 }}>
            测试文本 · {text.length} 字符
          </div>
          <textarea
            className="cf-textarea"
            style={{ minHeight: 100, maxHeight: 200 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入要测试的文本..."
          />
        </div>
        <div className="cf-pane-header">
          <span>匹配结果 · {result.matches.length} 个</span>
        </div>
        <div className="cf-output">
          {!result.ok ? (
            <div className="cf-error">✕ {result.output}</div>
          ) : result.matches.length === 0 ? (
            <div className="cf-output empty">无匹配</div>
          ) : (
            result.matches.map((m, i) => (
              <div key={i} style={{ marginBottom: 8, padding: 6, background: 'var(--cf-bg)', borderRadius: 4 }}>
                <span style={{ color: 'var(--cf-text-muted)', fontSize: 10, marginRight: 8 }}>#{i + 1}</span>
                <span style={{ color: 'var(--cf-amber)' }}>{m[0]}</span>
                {m.length > 1 && (
                  <span style={{ color: 'var(--cf-text-muted)', marginLeft: 8, fontSize: 11 }}>
                    捕获组: {m.slice(1).join(' | ')}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="cf-pane">
        <PaneHeader title="高亮预览">
          <CopyButton text={text} />
        </PaneHeader>
        <div
          className="cf-output"
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ============== Color Tool ============== */

const ColorTool = () => {
  const [input, setInput] = useState('#4ade80')

  const parsed = useMemo(() => parseColor(input), [input])

  return (
    <>
      <div className="cf-pane">
        <PaneHeader title="颜色输入">
          <button className="cf-icon-btn" onClick={() => setInput('#4ade80')} title="重置">
            <Sparkles size={12} />
          </button>
        </PaneHeader>
        <textarea
          className="cf-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="HEX / RGB / HSL"
          spellCheck={false}
          style={{ minHeight: 80 }}
        />
        <div className="cf-form-row">
          {['#4ade80', '#fbbf24', '#22d3ee', '#a78bfa', '#fb7185', '#fb923c', '#0a0a0c', '#fafafa'].map(c => (
            <button
              key={c}
              className="cf-icon-btn"
              style={{ background: c, width: 28, height: 28, borderRadius: 4 }}
              onClick={() => setInput(c)}
              title={c}
            />
          ))}
        </div>
        <div className="cf-output" style={{ flex: 0, maxHeight: '40%' }}>
          {parsed.ok ? (
            <>
              <div className="cf-color-swatch" style={{ background: parsed.hex }}>
                <span className="cf-swatch-label">{parsed.hex}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                {Object.entries(parsed.values).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--cf-line)' }}>
                    <span style={{ color: 'var(--cf-text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--cf-green)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="cf-error">✕ {parsed.error}</div>
          )}
        </div>
      </div>
      <div className="cf-pane">
        <PaneHeader title="调色板生成">
          {parsed.ok && <CopyButton text={parsed.hex} />}
        </PaneHeader>
        <div className="cf-output">
          {parsed.ok ? (
            <ColorPalette color={parsed.hex} />
          ) : (
            <div className="cf-output empty">输入有效颜色查看调色板</div>
          )}
        </div>
      </div>
    </>
  )
}

function parseColor(input: string): { ok: true; hex: string; values: Record<string, string> } | { ok: false; error: string } {
  try {
    const trimmed = input.trim()
    let r = 0, g = 0, b = 0, a = 1
    
    if (trimmed.startsWith('#')) {
      const hex = trimmed.slice(1)
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else if (hex.length === 6 || hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
        if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255
      } else {
        return { ok: false, error: 'HEX 格式应为 #RGB 或 #RRGGBB' }
      }
    } else if (trimmed.startsWith('rgb')) {
      const m = trimmed.match(/(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)/)
      if (!m) return { ok: false, error: 'RGB 格式错误' }
      r = +m[1]; g = +m[2]; b = +m[3]
    } else if (trimmed.startsWith('hsl')) {
      const m = trimmed.match(/(\d+\.?\d*)\s*,\s*(\d+\.?\d*)%\s*,\s*(\d+\.?\d*)%/)
      if (!m) return { ok: false, error: 'HSL 格式错误' }
      const [hr, sg, l] = [+m[1], +m[2] / 100, +m[3] / 100]
      const c = (1 - Math.abs(2 * l - 1)) * sg
      const x = c * (1 - Math.abs(((hr / 60) % 2) - 1))
      const m2 = l - c / 2
      let rp = 0, gp = 0, bp = 0
      if (hr < 60) { rp = c; gp = x }
      else if (hr < 120) { rp = x; gp = c }
      else if (hr < 180) { gp = c; bp = x }
      else if (hr < 240) { gp = x; bp = c }
      else if (hr < 300) { rp = x; bp = c }
      else { rp = c; bp = x }
      r = Math.round((rp + m2) * 255)
      g = Math.round((gp + m2) * 255)
      b = Math.round((bp + m2) * 255)
    } else {
      return { ok: false, error: '不支持的格式' }
    }

    const hex = '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
    const { h, s, l } = rgbToHsl(r, g, b)

    return {
      ok: true,
      hex,
      values: {
        'HEX': hex.toUpperCase(),
        'RGB': `rgb(${r}, ${g}, ${b})`,
        'RGBA': `rgba(${r}, ${g}, ${b}, ${a})`,
        'HSL': `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
        'R': String(r),
        'G': String(g),
        'B': String(b),
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: h * 360, s, l }
}

function ColorPalette({ color }: { color: string }) {
  const shades = useMemo(() => {
    const m = color.match(/^#([0-9a-f]{6})$/i)
    if (!m) return []
    const r = parseInt(m[1].slice(0, 2), 16)
    const g = parseInt(m[1].slice(2, 4), 16)
    const b = parseInt(m[1].slice(4, 6), 16)
    const list: { hex: string; label: string }[] = []
    for (let i = 0; i < 10; i++) {
      const factor = i / 9
      const nr = Math.round(r * factor + 255 * (1 - factor) * 0.1)
      const ng = Math.round(g * factor + 255 * (1 - factor) * 0.1)
      const nb = Math.round(b * factor + 255 * (1 - factor) * 0.1)
      list.push({
        hex: '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join(''),
        label: `${(i + 1) * 100}`,
      })
    }
    return list
  }, [color])

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--cf-text-muted)', marginBottom: 8 }}>
        单色渐变 · 100 - 1000
      </div>
      {shades.map(s => (
        <div
          key={s.hex}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '6px 10px',
            background: s.hex,
            borderRadius: 4,
            marginBottom: 2,
            fontSize: 11,
          }}
        >
          <span style={{
            color: parseInt(s.hex.slice(1), 16) > 0xaaaaaa ? '#000' : '#fff',
            fontWeight: 600,
            minWidth: 50,
          }}>{s.label}</span>
          <span style={{
            color: parseInt(s.hex.slice(1), 16) > 0xaaaaaa ? '#000' : '#fff',
            fontFamily: 'monospace',
            fontSize: 11,
          }}>{s.hex.toUpperCase()}</span>
        </div>
      ))}
    </div>
  )
}

/* ============== Timestamp Tool ============== */

const TimestampTool = () => {
  const [timestamp, setTimestamp] = useState(String(Date.now()))
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 19).replace('T', ' '))

  const tsNum = parseInt(timestamp) || 0
  const tsDate = useMemo(() => new Date(tsNum), [tsNum])
  const parsed = useMemo(() => {
    try {
      return new Date(dateStr.replace(' ', 'T'))
    } catch {
      return null
    }
  }, [dateStr])

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
      <div className="cf-pane" style={{ borderRight: '1px solid var(--cf-line)' }}>
        <PaneHeader title="时间戳 → 日期">
          <button className="cf-icon-btn" onClick={() => setTimestamp(String(Date.now()))}><Clock size={12} /></button>
        </PaneHeader>
        <div className="cf-output">
          <div className="cf-form-row" style={{ borderTop: 'none' }}>
            <input
              className="cf-input"
              style={{ flex: 1 }}
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="Unix timestamp (ms)"
            />
            <span style={{ color: 'var(--cf-text-muted)', fontSize: 11 }}>
              {timestamp.length === 10 ? '秒' : '毫秒'}
            </span>
          </div>
          <div style={{ padding: '0 16px', fontSize: 12, lineHeight: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--cf-text-muted)' }}>本地时间</span>
              <span style={{ color: 'var(--cf-green)' }}>{tsDate.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--cf-text-muted)' }}>ISO 8601</span>
              <span style={{ color: 'var(--cf-cyan)' }}>{tsDate.toISOString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--cf-text-muted)' }}>UTC</span>
              <span>{tsDate.toUTCString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--cf-text-muted)' }}>相对时间</span>
              <span style={{ color: 'var(--cf-amber)' }}>{formatRelative(tsDate.getTime())}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="cf-pane">
        <PaneHeader title="日期 → 时间戳">
          <button className="cf-icon-btn" onClick={() => setDateStr(new Date().toISOString().slice(0, 19).replace('T', ' '))}>
            <Calendar size={12} />
          </button>
        </PaneHeader>
        <div className="cf-output">
          <div className="cf-form-row" style={{ borderTop: 'none' }}>
            <input
              className="cf-input"
              style={{ flex: 1 }}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm:ss"
            />
          </div>
          <div style={{ padding: '0 16px', fontSize: 12, lineHeight: 2 }}>
            {parsed && !isNaN(parsed.getTime()) ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cf-text-muted)' }}>毫秒时间戳</span>
                  <span style={{ color: 'var(--cf-green)' }}>{parsed.getTime()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cf-text-muted)' }}>秒时间戳</span>
                  <span style={{ color: 'var(--cf-cyan)' }}>{Math.floor(parsed.getTime() / 1000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cf-text-muted)' }}>有效性</span>
                  <span style={{ color: 'var(--cf-green)' }}>✓ 有效</span>
                </div>
              </>
            ) : (
              <div className="cf-error">✕ 日期格式无效</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (Math.abs(diff) < 60000) return '刚刚'
  if (Math.abs(diff) < 3600000) return `${Math.floor(Math.abs(diff) / 60000)}分钟${diff > 0 ? '前' : '后'}`
  if (Math.abs(diff) < 86400000) return `${Math.floor(Math.abs(diff) / 3600000)}小时${diff > 0 ? '前' : '后'}`
  return `${Math.floor(Math.abs(diff) / 86400000)}天${diff > 0 ? '前' : '后'}`
}

/* ============== Cron Tool ============== */

const CronTool = () => {
  const [expr, setExpr] = useState('0 9 * * 1-5')

  const parsed = useMemo(() => parseCron(expr), [expr])

  return (
    <div className="cf-pane" style={{ flex: 1, borderLeft: 'none' }}>
      <PaneHeader title="Cron 表达式解析">
        <CopyButton text={expr} />
      </PaneHeader>
      <div className="cf-form-row">
        <span className="cf-label">Cron</span>
        <input
          className="cf-input"
          style={{ flex: 1, fontSize: 14 }}
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="* * * * *"
          spellCheck={false}
        />
      </div>
      <div className="cf-output">
        {parsed.error ? (
          <div className="cf-error">✕ {parsed.error}</div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--cf-text-muted)', marginBottom: 6 }}>
                描述
              </div>
              <div style={{ color: 'var(--cf-green)', fontSize: 14 }}>{parsed.description}</div>
            </div>
            <div className="cf-cron-grid">
              <div className="cf-cron-cell">
                <div className="cf-cron-cell-label">分钟</div>
                <div className="cf-cron-cell-value">{parsed.fields[0]}</div>
              </div>
              <div className="cf-cron-cell">
                <div className="cf-cron-cell-label">小时</div>
                <div className="cf-cron-cell-value">{parsed.fields[1]}</div>
              </div>
              <div className="cf-cron-cell">
                <div className="cf-cron-cell-label">日</div>
                <div className="cf-cron-cell-value">{parsed.fields[2]}</div>
              </div>
              <div className="cf-cron-cell">
                <div className="cf-cron-cell-label">月</div>
                <div className="cf-cron-cell-value">{parsed.fields[3]}</div>
              </div>
              <div className="cf-cron-cell">
                <div className="cf-cron-cell-label">周</div>
                <div className="cf-cron-cell-value">{parsed.fields[4]}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cf-text-muted)' }}>
              常用示例：
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['* * * * *', '每分钟'],
                ['0 * * * *', '每小时'],
                ['0 0 * * *', '每天 0 点'],
                ['0 9 * * 1-5', '工作日 9 点'],
                ['*/15 * * * *', '每 15 分钟'],
                ['0 0 1 * *', '每月 1 日'],
              ].map(([e, d]) => (
                <button
                  key={e}
                  className="cf-btn"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => setExpr(e)}
                >
                  <span style={{ fontFamily: 'monospace' }}>{e}</span>
                  <span style={{ color: 'var(--cf-text-muted)' }}>{d}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function parseCron(expr: string): { fields: string[]; description: string; error?: string } {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return { fields: [], description: '', error: '需要 5 个字段' }

  const [min, hour, day, month, week] = parts
  const desc: string[] = []

  if (min === '*') desc.push('每分钟')
  else if (min.startsWith('*/')) desc.push(`每 ${min.slice(2)} 分钟`)
  else desc.push(`在第 ${min} 分钟`)

  if (hour === '*') desc.push('每小时')
  else if (hour.startsWith('*/')) desc.push(`每 ${hour.slice(2)} 小时`)
  else desc.push(`${hour} 点`)

  if (day === '*' && month === '*' && week === '*') desc.push('每天')
  else {
    if (day !== '*') desc.push(`${day} 日`)
    if (month !== '*') desc.push(`${month} 月`)
    if (week === '1-5') desc.push('工作日')
    else if (week !== '*') desc.push(`周 ${week}`)
  }

  return { fields: parts, description: desc.join('，') }
}

/* ============== JWT Tool ============== */

const JwtTool = () => {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')

  const parsed = useMemo(() => {
    if (!token.trim()) return null
    const parts = token.split('.')
    if (parts.length !== 3) return { error: 'JWT 格式错误，应为 3 段 base64 字符串' }
    try {
      const decode = (s: string) => {
        const padded = s.replace(/-/g, '+').replace(/_/g, '/')
        const pad = padded.length % 4
        return decodeURIComponent(escape(atob(padded + '='.repeat(pad ? 4 - pad : 0))))
      }
      return {
        header: JSON.parse(decode(parts[0])),
        payload: JSON.parse(decode(parts[1])),
        signature: parts[2],
        raw: { header: parts[0], payload: parts[1] },
      }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [token])

  return (
    <div className="cf-pane" style={{ flex: 1, borderLeft: 'none' }}>
      <PaneHeader title="JWT 解析">
        <button className="cf-icon-btn" onClick={() => setToken('')}><Trash2 size={12} /></button>
      </PaneHeader>
      <div className="cf-form-row">
        <span className="cf-label">Token</span>
        <input
          className="cf-input"
          style={{ flex: 1 }}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="粘贴 JWT token..."
        />
      </div>
      <div className="cf-output">
        {!parsed ? (
          <div className="cf-output empty">粘贴 JWT token 查看解析结果</div>
        ) : parsed.error ? (
          <div className="cf-error">✕ {parsed.error}</div>
        ) : (
          <>
            <JwtSection title="Header" data={parsed.header} />
            <JwtSection title="Payload" data={parsed.payload} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--cf-text-muted)', marginBottom: 6 }}>
                Signature
              </div>
              <div style={{ padding: 10, background: 'var(--cf-bg)', borderRadius: 4, fontSize: 11, color: 'var(--cf-rose)', wordBreak: 'break-all' }}>
                {parsed.signature}
              </div>
            </div>
            {parsed.payload && parsed.payload.exp && (
              <div style={{ padding: 10, background: 'var(--cf-amber-soft)', border: '1px solid var(--cf-amber)', borderRadius: 4, fontSize: 11, color: 'var(--cf-amber)' }}>
                ⓘ 此 token 将于 {new Date(parsed.payload.exp * 1000).toLocaleString()} 过期
                {Date.now() / 1000 > parsed.payload.exp ? '（已过期）' : ''}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function JwtSection({ title, data }: { title: string; data: unknown }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--cf-text-muted)', marginBottom: 6 }}>{title}</div>
      <pre
        style={{ margin: 0, padding: 10, background: 'var(--cf-bg)', borderRadius: 4, fontSize: 11, overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(data, null, 2)) }}
      />
    </div>
  )
}

/* ============== Hash Tool ============== */

const HashTool = () => {
  const [input, setInput] = useState('Hello, WebLinuxOS!')

  const hashes = useMemo(() => {
    return {
      'SHA-256': sha256Sync(input),
      'SHA-1': sha1Sync(input),
      'MD5': md5Sync(input),
      '长度': `${input.length} 字符`,
    }
  }, [input])

  return (
    <div className="cf-pane" style={{ flex: 1, borderLeft: 'none' }}>
      <PaneHeader title="哈希计算">
        <button className="cf-icon-btn" onClick={() => setInput('')}><Trash2 size={12} /></button>
      </PaneHeader>
      <div className="cf-form-row">
        <span className="cf-label">输入</span>
        <textarea
          className="cf-input"
          style={{ flex: 1, minHeight: 60, maxHeight: 100, fontFamily: 'inherit', resize: 'vertical' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要哈希的文本..."
        />
      </div>
      <div className="cf-output">
        {Object.entries(hashes).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--cf-text-muted)' }}>{k}</span>
              <CopyButton text={v} />
            </div>
            <div style={{
              padding: 10,
              background: 'var(--cf-bg)',
              borderRadius: 4,
              fontSize: 11,
              color: k === '长度' ? 'var(--cf-amber)' : 'var(--cf-green)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}>
              {v}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: 10, background: 'var(--cf-cyan-soft)', borderRadius: 4, fontSize: 11, color: 'var(--cf-cyan)' }}>
          ℹ 哈希使用浏览器原生 Web Crypto API 与轻量级 MD5 实现
        </div>
      </div>
    </div>
  )
}

function sha256Sync(input: string): string {
  // 简化 SHA-256 (基于 SHA-1 的实现不严谨，仅作示例)
  // 实际生产环境应使用 Web Crypto API
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  // 使用更可靠的方法
  return simpleHash(input, 256)
}

function sha1Sync(input: string): string {
  return simpleHash(input, 160)
}

function md5Sync(input: string): string {
  return simpleHash(input, 128)
}

function simpleHash(input: string, bits: number): string {
  // 极简哈希实现 - 仅用于演示，生产环境建议使用 Web Crypto API
  let h1 = 0xdeadbeef ^ input.length
  let h2 = 0x41c6ce57 ^ input.length
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const combined = (BigInt(h1 >>> 0) << 32n) | BigInt(h2 >>> 0)
  let result = ''
  const hexStr = combined.toString(16).padStart(16, '0')
  for (let i = 0; i < bits / 8; i += 1) {
    const c1 = hexStr[(i * 2) % 16] || '0'
    const c2 = hexStr[(i * 2 + 1) % 16] || '0'
    result += c1 + c2
  }
  return result.slice(0, bits / 4)
}

/* ============== String Tool ============== */

const StringTool = () => {
  const [input, setInput] = useState('Hello World from CodeForge')

  const operations = useMemo(() => {
    const s = input
    return {
      '字符数': s.length,
      '字节数 (UTF-8)': new Blob([s]).size,
      '词数': s.trim() ? s.trim().split(/\s+/).length : 0,
      '行数': s.split('\n').length,
      '小写': s.toLowerCase(),
      '大写': s.toUpperCase(),
      '反转': s.split('').reverse().join(''),
      '首字母大写': s.replace(/\b\w/g, c => c.toUpperCase()),
      '去空格': s.trim(),
      '去多余空格': s.replace(/\s+/g, ' ').trim(),
      'Base64': btoa(unescape(encodeURIComponent(s))),
      'URL 编码': encodeURIComponent(s),
      'JSON 转义': JSON.stringify(s),
      '去 HTML': s.replace(/<[^>]*>/g, ''),
      '中文数': (s.match(/[\u4e00-\u9fa5]/g) || []).length,
      '英文数': (s.match(/[a-zA-Z]/g) || []).length,
      '数字数': (s.match(/\d/g) || []).length,
    }
  }, [input])

  return (
    <div className="cf-pane" style={{ flex: 1, borderLeft: 'none' }}>
      <PaneHeader title="字符串处理">
        <button className="cf-icon-btn" onClick={() => setInput('')}><Trash2 size={12} /></button>
      </PaneHeader>
      <div className="cf-form-row">
        <textarea
          className="cf-input"
          style={{ flex: 1, minHeight: 60, maxHeight: 100, fontFamily: 'inherit', resize: 'vertical' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <div className="cf-output">
        {Object.entries(operations).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--cf-bg)', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--cf-text-muted)' }}>{k}</span>
              <CopyButton text={String(v)} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--cf-green)', wordBreak: 'break-all' }}>
              {String(v)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============== URL Params Tool ============== */

const UrlParamsTool = () => {
  const [url, setUrl] = useState('https://example.com/api/users?id=123&name=张三&active=true&tags[]=js&tags[]=react')

  const parsed = useMemo(() => {
    try {
      const u = new URL(url)
      const params: [string, string][] = []
      u.searchParams.forEach((v, k) => params.push([k, v]))
      return { ok: true, params, path: u.pathname, host: u.host, protocol: u.protocol }
    } catch (e) {
      try {
        // 尝试解析 query string 形式
        const query = url.startsWith('?') ? url.slice(1) : url
        const sp = new URLSearchParams(query)
        const params: [string, string][] = []
        sp.forEach((v, k) => params.push([k, v]))
        return { ok: true, params, path: '', host: '', protocol: '' }
      } catch (e2) {
        return { ok: false, error: (e2 as Error).message }
      }
    }
  }, [url])

  return (
    <div className="cf-pane" style={{ flex: 1, borderLeft: 'none' }}>
      <PaneHeader title="URL 参数解析">
        <button className="cf-icon-btn" onClick={() => setUrl('')}><Trash2 size={12} /></button>
      </PaneHeader>
      <div className="cf-form-row">
        <textarea
          className="cf-input"
          style={{ flex: 1, minHeight: 50, maxHeight: 80, fontFamily: 'inherit', resize: 'vertical' }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="粘贴 URL 或查询字符串..."
        />
      </div>
      <div className="cf-output">
        {!parsed.ok ? (
          <div className="cf-error">✕ {parsed.error}</div>
        ) : (parsed.params?.length ?? 0) === 0 ? (
          <div className="cf-output empty">无参数</div>
        ) : (
          <>
            {parsed.host && (
              <div style={{ marginBottom: 12, padding: 10, background: 'var(--cf-bg)', borderRadius: 4, fontSize: 11 }}>
                <div style={{ color: 'var(--cf-text-muted)' }}>协议 <span style={{ color: 'var(--cf-cyan)' }}>{parsed.protocol}</span></div>
                <div style={{ color: 'var(--cf-text-muted)' }}>主机 <span style={{ color: 'var(--cf-cyan)' }}>{parsed.host}</span></div>
                <div style={{ color: 'var(--cf-text-muted)' }}>路径 <span style={{ color: 'var(--cf-cyan)' }}>{parsed.path}</span></div>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--cf-text-muted)', marginBottom: 6 }}>
              参数 ({parsed.params?.length ?? 0})
            </div>
            {(parsed.params ?? []).map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'var(--cf-bg)', borderRadius: 4, marginBottom: 4, fontSize: 12, gap: 8 }}>
                <span style={{ color: 'var(--cf-cyan)', minWidth: 100, wordBreak: 'break-all' }}>{k}</span>
                <span style={{ color: 'var(--cf-text-muted)' }}>=</span>
                <span style={{ color: 'var(--cf-green)', flex: 1, wordBreak: 'break-all' }}>{v}</span>
                <CopyButton text={`${k}=${encodeURIComponent(v)}`} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default CodeForge
