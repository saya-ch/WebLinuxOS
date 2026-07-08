import { useState, useMemo, useRef, useEffect } from 'react'

type TabKey = 'base64' | 'url' | 'json' | 'regex' | 'uuid' | 'timestamp' | 'color' | 'hash' | 'jwt' | 'html' | 'lorem'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'base64', label: 'Base64', icon: '🔐' },
  { key: 'url', label: 'URL', icon: '🔗' },
  { key: 'json', label: 'JSON', icon: '📋' },
  { key: 'regex', label: '正则', icon: '🎯' },
  { key: 'uuid', label: 'UUID/密码', icon: '🆔' },
  { key: 'timestamp', label: '时间戳', icon: '⏰' },
  { key: 'color', label: '颜色', icon: '🎨' },
  { key: 'hash', label: '哈希', icon: '🔒' },
  { key: 'jwt', label: 'JWT', icon: '🎫' },
  { key: 'html', label: 'HTML实体', icon: '📄' },
  { key: 'lorem', label: '占位文本', icon: '📝' },
]

function unicodeToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    return ''
  }
}

function base64ToUnicode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return '⚠️ 无效的 Base64 字符串'
  }
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return (crypto as Crypto).randomUUID()
    } catch {
      // fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generatePassword(length: number, opts: {
  upper: boolean
  lower: boolean
  number: boolean
  special: boolean
}): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const number = '0123456789'
  const special = '!@#$%^&*()-_=+[]{};:,.<>?/|~'
  let pool = ''
  if (opts.upper) pool += upper
  if (opts.lower) pool += lower
  if (opts.number) pool += number
  if (opts.special) pool += special
  if (!pool) return ''
  let result = ''
  const arr = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    ;(crypto as Crypto).getRandomValues(arr)
    for (let i = 0; i < length; i++) {
      result += pool[arr[i] % pool.length]
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += pool[Math.floor(Math.random() * pool.length)]
    }
  }
  return result
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case R: h = (G - B) / d + (G < B ? 6 : 0); break
      case G: h = (B - R) / d + 2; break
      case B: h = (R - G) / d + 4; break
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const S = s / 100, L = l / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const hh = ((h % 360) + 360) % 360 / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hh < 1) { r1 = c; g1 = x; b1 = 0 }
  else if (hh < 2) { r1 = x; g1 = c; b1 = 0 }
  else if (hh < 3) { r1 = 0; g1 = c; b1 = x }
  else if (hh < 4) { r1 = 0; g1 = x; b1 = c }
  else if (hh < 5) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  const m = L - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

const DevToolboxPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('base64')

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)', overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 16px',
              background: activeTab === t.key ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === t.key ? 'var(--accent)' : 'var(--text-primary)',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {activeTab === 'base64' && <Base64Tool />}
        {activeTab === 'url' && <UrlTool />}
        {activeTab === 'json' && <JsonTool />}
        {activeTab === 'regex' && <RegexTool />}
        {activeTab === 'uuid' && <UuidPasswordTool />}
        {activeTab === 'timestamp' && <TimestampTool />}
        {activeTab === 'color' && <ColorTool />}
        {activeTab === 'hash' && <HashTool />}
        {activeTab === 'jwt' && <JwtTool />}
        {activeTab === 'html' && <HtmlEntityTool />}
        {activeTab === 'lorem' && <LoremIpsumTool />}
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }
  return (
    <button onClick={onClick} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
      {copied ? '✓ 已复制' : '📋 复制'}
    </button>
  )
}

function Base64Tool() {
  const [text, setText] = useState('Hello WebLinuxOS 你好世界')
  const [fileDrag, setFileDrag] = useState(false)
  const encoded = useMemo(() => unicodeToBase64(text), [text])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Start = reader.result.indexOf(',')
        if (base64Start > -1) {
          setText(reader.result.slice(base64Start + 1))
        } else {
          setText(reader.result)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Base64 编解码</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip">文本 ↔ Base64</span>
          <span className="chip">支持中文/Unicode</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>原文</label>
          <textarea
            className="app-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入文本..."
            style={{
              flex: 1,
              minHeight: 180,
              padding: 10,
              resize: 'vertical',
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setFileDrag(true) }}
            onDragLeave={() => setFileDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setFileDrag(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            style={{
              padding: 16,
              textAlign: 'center',
              border: `2px dashed ${fileDrag ? 'var(--accent)' : 'var(--window-border)'}`,
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              background: fileDrag ? 'var(--accent-bg)' : 'transparent',
            }}
          >
            📁 拖拽文件到此处以编码文件内容
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {text.length} 字符
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
              <CopyButton value={text} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Base64 编码结果</label>
          <textarea
            className="app-textarea"
            value={encoded}
            onChange={(e) => {
              const decoded = base64ToUnicode(e.target.value)
              setText(decoded)
            }}
            placeholder="或在此粘贴 Base64 以解码..."
            style={{
              flex: 1,
              minHeight: 180,
              padding: 10,
              resize: 'vertical',
              fontFamily: 'monospace',
              fontSize: 13,
              background: '#1a1a2e',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {encoded.length} 字符
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const decoded = base64ToUnicode(encoded)
                  setText(decoded)
                }}
                className="app-button"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                🔄 解码回左侧
              </button>
              <CopyButton value={encoded} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UrlTool() {
  const [text, setText] = useState('https://example.com/测试?q=你好&value=测试 值')
  const encoded = useMemo(() => {
    try { return encodeURIComponent(text) } catch { return '' }
  }, [text])
  const decoded = useMemo(() => {
    try { return decodeURIComponent(text) } catch { return '⚠️ 解码失败' }
  }, [text])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>URL 编解码</h3>
        <span className="chip">encodeURIComponent / decodeURIComponent</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>输入文本 / URL</label>
        <textarea
          className="app-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入文本或 URL..."
          style={{
            minHeight: 100,
            padding: 10,
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text.length} 字符</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
            <CopyButton value={text} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>编码结果</label>
          <div
            style={{
              padding: 12,
              background: '#1a1a2e',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 13,
              minHeight: 100,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--window-border)',
            }}
          >
            {encoded}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{encoded.length} 字符</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setText(encoded)} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
                ← 用此继续
              </button>
              <CopyButton value={encoded} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>解码结果</label>
          <div
            style={{
              padding: 12,
              background: '#1a1a2e',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 13,
              minHeight: 100,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--window-border)',
            }}
          >
            {decoded}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{decoded.length} 字符</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setText(decoded)} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
                ← 用此继续
              </button>
              <CopyButton value={decoded} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JsonTool() {
  const [text, setText] = useState('{\n  "name": "WebLinuxOS",\n  "version": "1.0",\n  "features": ["terminal", "filemanager", "apps"],\n  "active": true\n}')

  const { isValid, error, errorPos } = useMemo(() => {
    try {
      JSON.parse(text)
      return { isValid: true, error: '', errorPos: null as { line: number; col: number } | null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'JSON 解析错误'
      const match = /position (\d+)/i.exec(msg)
      let pos: { line: number; col: number } | null = null
      if (match) {
        const idx = parseInt(match[1], 10)
        const before = text.slice(0, idx)
        const line = (before.match(/\n/g) || []).length + 1
        const lastNewline = before.lastIndexOf('\n')
        const col = idx - (lastNewline < 0 ? 0 : lastNewline)
        pos = { line, col }
      }
      return { isValid: false, error: msg, errorPos: pos }
    }
  }, [text])

  const prettified = useMemo(() => {
    try {
      const obj = JSON.parse(text)
      return JSON.stringify(obj, null, 2)
    } catch {
      return ''
    }
  }, [text])

  const minified = useMemo(() => {
    try {
      const obj = JSON.parse(text)
      return JSON.stringify(obj)
    } catch {
      return ''
    }
  }, [text])

  const lines = useMemo(() => prettified.split('\n'), [prettified])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>JSON 格式化 / 压缩 / 校验</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isValid ? (
            <span className="chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>✓ 合法 JSON</span>
          ) : (
            <span className="chip" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>✗ 格式错误</span>
          )}
          <button onClick={() => setText(prettified)} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
            美化
          </button>
          <button onClick={() => setText(minified)} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
            压缩
          </button>
          <CopyButton value={text} />
        </div>
      </div>

      {!isValid && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            fontSize: 12,
            color: '#ef4444',
          }}
        >
          <strong>错误：</strong>{error}
          {errorPos && <span>（第 {errorPos.line} 行，第 {errorPos.col} 列）</span>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>输入 JSON</label>
          <textarea
            className="app-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入 JSON..."
            style={{
              flex: 1,
              minHeight: 250,
              padding: 10,
              resize: 'vertical',
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            格式化预览（{lines.length} 行）
          </label>
          <div
            style={{
              flex: 1,
              minHeight: 250,
              overflow: 'auto',
              padding: 10,
              background: '#1a1a2e',
              borderRadius: 8,
              border: '1px solid var(--window-border)',
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'flex' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 40,
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    paddingRight: 12,
                    userSelect: 'none',
                    opacity: 0.6,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--text-primary)', whiteSpace: 'pre' }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState<{ g: boolean; i: boolean; m: boolean; s: boolean }>({ g: true, i: false, m: false, s: false })
  const [testText, setTestText] = useState('示例文本：\nhello@example.com 是一个邮箱。\n另一个是 TEST@FOO.BAR。\n还有一些普通文本需要忽略。')

  const { regex, error, matches } = useMemo(() => {
    try {
      const flagStr = (flags.g ? 'g' : '') + (flags.i ? 'i' : '') + (flags.m ? 'm' : '') + (flags.s ? 's' : '')
      const re = new RegExp(pattern, flagStr)
      const results: { match: string; index: number; groups?: string[] }[] = []
      if (flags.g) {
        let m: RegExpExecArray | null
        let guard = 0
        while ((m = re.exec(testText)) !== null && guard < 1000) {
          results.push({ match: m[0], index: m.index, groups: m.slice(1) })
          if (m[0].length === 0) re.lastIndex++
          guard++
        }
      } else {
        const m = re.exec(testText)
        if (m) results.push({ match: m[0], index: m.index, groups: m.slice(1) })
      }
      return { regex: re, error: '', matches: results }
    } catch (e) {
      return { regex: null, error: e instanceof Error ? e.message : '正则表达式错误', matches: [] }
    }
  }, [pattern, flags, testText])

  const highlightedText = useMemo(() => {
    if (!regex || matches.length === 0) return testText
    const pieces: React.ReactNode[] = []
    let last = 0
    const sorted = [...matches].sort((a, b) => a.index - b.index)
    sorted.forEach((m, i) => {
      if (m.index > last) pieces.push(<span key={`t${i}`}>{testText.slice(last, m.index)}</span>)
      pieces.push(
        <mark
          key={`m${i}`}
          style={{
            background: 'rgba(139, 124, 240, 0.35)',
            color: 'var(--text-primary)',
            padding: '0 2px',
            borderRadius: 3,
            borderBottom: '2px solid var(--accent)',
          }}
        >
          {m.match}
        </mark>,
      )
      last = m.index + m.match.length
    })
    if (last < testText.length) pieces.push(<span key="tail">{testText.slice(last)}</span>)
    return pieces
  }, [regex, matches, testText])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>正则表达式测试</h3>
        <span className="chip">共 {matches.length} 个匹配</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>正则表达式</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>/</span>
          <input
            className="app-input"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式..."
            style={{ flex: 1, minWidth: 200, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }}
          />
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>/</span>
          {(['g', 'i', 'm', 's'] as const).map((f) => (
            <label
              key={f}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                background: flags[f] ? 'var(--accent-bg)' : 'transparent',
                border: `1px solid ${flags[f] ? 'var(--accent)' : 'var(--window-border)'}`,
                color: flags[f] ? 'var(--accent)' : 'var(--text-primary)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={flags[f]}
                onChange={() => setFlags((prev) => ({ ...prev, [f]: !prev[f] }))}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'monospace' }}>{f}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {f === 'g' ? '全局' : f === 'i' ? '忽略大小写' : f === 'm' ? '多行' : '单行'}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, fontSize: 12, color: '#ef4444' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>测试文本</label>
          <textarea
            className="app-textarea"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="输入测试文本..."
            style={{ flex: 1, minHeight: 200, padding: 10, fontSize: 13, fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>高亮预览</label>
          <div
            style={{
              flex: 1,
              minHeight: 200,
              padding: 12,
              background: '#1a1a2e',
              borderRadius: 8,
              border: '1px solid var(--window-border)',
              fontSize: 13,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflow: 'auto',
              lineHeight: 1.6,
            }}
          >
            {highlightedText}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>匹配列表</label>
        <div
          style={{
            maxHeight: 180,
            overflow: 'auto',
            background: '#1a1a2e',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          {matches.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>无匹配</div>
          ) : (
            matches.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderBottom: i < matches.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span style={{ color: 'var(--accent)' }}>#{i + 1}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)', wordBreak: 'break-all' }}>"{m.match}"</span>
                <span style={{ color: 'var(--text-secondary)' }}>index: {m.index}</span>
                {m.groups && m.groups.length > 0 && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    组: [{m.groups.map((g, gi) => <span key={gi}>"{g}"</span>)}]
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function UuidPasswordTool() {
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, () => generateUUID()))
  const [uuidCount, setUuidCount] = useState(5)
  const [pwdLen, setPwdLen] = useState(16)
  const [pwdOpts, setPwdOpts] = useState({ upper: true, lower: true, number: true, special: true })
  const [password, setPassword] = useState<string>(() => generatePassword(16, { upper: true, lower: true, number: true, special: true }))

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>UUID v4 生成器</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>数量</label>
            <input
              type="number"
              min={1}
              max={50}
              value={uuidCount}
              onChange={(e) => setUuidCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="app-input"
              style={{ width: 60, padding: '4px 8px', fontSize: 12 }}
            />
            <button
              onClick={() => setUuids(Array.from({ length: uuidCount }, () => generateUUID()))}
              className="app-button-primary"
              style={{ padding: '6px 14px', fontSize: 12, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'var(--accent)', color: '#fff' }}
            >
              🔄 重新生成
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 200,
            overflow: 'auto',
            background: '#1a1a2e',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
            padding: 8,
          }}
        >
          {uuids.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                fontFamily: 'monospace',
                fontSize: 12,
                borderRadius: 4,
                background: 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,124,240,0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: 'var(--text-secondary)', width: 30 }}>#{i + 1}</span>
              <span style={{ flex: 1, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{u}</span>
              <CopyButton value={u} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>随机密码生成器</h3>
          <button
            onClick={() => setPassword(generatePassword(pwdLen, pwdOpts))}
            className="app-button-primary"
            style={{ padding: '6px 14px', fontSize: 12, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'var(--accent)', color: '#fff' }}
          >
            🔄 重新生成
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            长度
            <input
              type="number"
              min={4}
              max={128}
              value={pwdLen}
              onChange={(e) => setPwdLen(Math.max(4, Math.min(128, parseInt(e.target.value) || 4)))}
              className="app-input"
              style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
            />
          </label>
          {(['upper', 'lower', 'number', 'special'] as const).map((k) => (
            <label
              key={k}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                background: pwdOpts[k] ? 'var(--accent-bg)' : 'transparent',
                border: `1px solid ${pwdOpts[k] ? 'var(--accent)' : 'var(--window-border)'}`,
                color: pwdOpts[k] ? 'var(--accent)' : 'var(--text-primary)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={pwdOpts[k]}
                onChange={() => setPwdOpts((prev) => ({ ...prev, [k]: !prev[k] }))}
                style={{ cursor: 'pointer' }}
              />
              {k === 'upper' ? '大写字母 (A-Z)' : k === 'lower' ? '小写字母 (a-z)' : k === 'number' ? '数字 (0-9)' : '特殊字符 (!@#...)'}
            </label>
          ))}
        </div>

        <div
          style={{
            padding: 20,
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: 18,
            letterSpacing: 2,
            background: '#1a1a2e',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
            wordBreak: 'break-all',
            color: 'var(--text-primary)',
          }}
        >
          {password || '请至少选择一个字符类型'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>长度: {password.length} 字符</span>
          <CopyButton value={password} />
        </div>
      </div>
    </div>
  )
}

function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  const [inputTs, setInputTs] = useState<string>(String(Math.floor(Date.now() / 1000)))
  const [inputDate, setInputDate] = useState<string>('')
  const [unit, setUnit] = useState<'s' | 'ms'>('s')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const d = new Date(now)
    const pad = (n: number) => String(n).padStart(2, '0')
    setInputDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const parsedFromTs = useMemo(() => {
    const n = parseFloat(inputTs)
    if (isNaN(n)) return null
    const ms = unit === 's' ? n * 1000 : n
    return new Date(ms)
  }, [inputTs, unit])

  const parsedFromDate = useMemo(() => {
    if (!inputDate) return null
    const d = new Date(inputDate.replace(' ', 'T'))
    if (isNaN(d.getTime())) return null
    return d
  }, [inputDate])

  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  const fmtUTC = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  }

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>时间戳转换</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip">{new Date(now).toLocaleTimeString()}</span>
          <span className="chip">Unix (s): {Math.floor(now / 1000)}</span>
          <span className="chip">Unix (ms): {now}</span>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
          <strong style={{ fontSize: 13 }}>时间戳 → 日期</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={inputTs}
              onChange={(e) => setInputTs(e.target.value)}
              className="app-input"
              placeholder="输入时间戳"
              style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 's' | 'ms')}
              className="app-input"
              style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}
            >
              <option value="s">秒</option>
              <option value="ms">毫秒</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setInputTs(String(Math.floor(Date.now() / 1000)))} className="app-button" style={{ padding: '6px 12px', fontSize: 12 }}>
              使用当前秒
            </button>
            <button onClick={() => setInputTs(String(Date.now()))} className="app-button" style={{ padding: '6px 12px', fontSize: 12 }}>
              使用当前毫秒
            </button>
          </div>
          {parsedFromTs && !isNaN(parsedFromTs.getTime()) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, padding: 10, background: 'rgba(139,124,240,0.08)', borderRadius: 6 }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>本地：</span>{fmt(parsedFromTs)}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>UTC：</span>{fmtUTC(parsedFromTs)}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>ISO：</span>{parsedFromTs.toISOString()}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#ef4444' }}>无效时间戳</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
          <strong style={{ fontSize: 13 }}>日期 → 时间戳</strong>
          <input
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            className="app-input"
            placeholder="YYYY-MM-DD HH:mm:ss"
            style={{ padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                const d = new Date()
                const pad = (n: number) => String(n).padStart(2, '0')
                setInputDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
              }}
              className="app-button"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              使用当前时间
            </button>
            <CopyButton value={inputDate} />
          </div>
          {parsedFromDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, padding: 10, background: 'rgba(16,185,129,0.08)', borderRadius: 6 }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Unix (s):</span> <span style={{ fontFamily: 'monospace' }}>{Math.floor(parsedFromDate.getTime() / 1000)}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Unix (ms):</span> <span style={{ fontFamily: 'monospace' }}>{parsedFromDate.getTime()}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>ISO：</span>{parsedFromDate.toISOString()}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#ef4444' }}>无效日期格式</div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 16,
          background: 'linear-gradient(135deg, rgba(139,124,240,0.1), rgba(0,212,193,0.05))',
          borderRadius: 8,
          border: '1px solid var(--window-border)',
          fontSize: 12,
          lineHeight: 1.8,
        }}
      >
        <strong style={{ fontSize: 13 }}>💡 提示：</strong>
        <br />
        • 在 "时间戳 → 日期" 输入 Unix 时间戳（秒或毫秒）以查看人类可读的日期
        <br />
        • 在 "日期 → 时间戳" 按格式 YYYY-MM-DD HH:mm:ss 输入日期（本地时区）
      </div>
    </div>
  )
}

function ColorTool() {
  const [hex, setHex] = useState('#7c6cf0')
  const rgb = useMemo(() => hexToRgb(hex), [hex])
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 }), [rgb])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const palette = useMemo(() => {
    if (!rgb) return [] as string[]
    const base = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const result: string[] = []
    for (let i = 0; i < 10; i++) {
      const l = 90 - i * 9
      const { r, g, b } = hslToRgb(base.h, base.s, l)
      result.push(rgbToHex(r, g, b))
    }
    return result
  }, [rgb])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>颜色格式转换</h3>
        <input
          type="color"
          value={rgb ? hex : '#000000'}
          onChange={(e) => setHex(e.target.value)}
          ref={fileInputRef as unknown as React.RefObject<HTMLInputElement>}
          style={{ width: 50, height: 32, cursor: 'pointer', border: 'none', borderRadius: 6, padding: 0, background: 'transparent' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14 }}>
        <div
          style={{
            height: 200,
            background: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '#000',
            borderRadius: 12,
            border: '2px solid var(--window-border)',
            boxShadow: `0 0 40px ${rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)` : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: rgb && (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 128 ? '#000' : '#fff',
            fontFamily: 'monospace',
          }}
        >
          预览
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>HEX</label>
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="app-input"
              style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }}
            />
            <CopyButton value={hex} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>RGB</label>
            <input
              value={rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '无效'}
              readOnly
              className="app-input"
              style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }}
            />
            <CopyButton value={rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ''} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>HSL</label>
            <input
              value={rgb ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '无效'}
              readOnly
              className="app-input"
              style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }}
            />
            <CopyButton value={rgb ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : ''} />
          </div>

          {rgb && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 10, background: '#1a1a2e', borderRadius: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>R: {rgb.r}</label>
                <input type="range" min={0} max={255} value={rgb.r} onChange={(e) => {
                  const r = parseInt(e.target.value)
                  setHex(rgbToHex(r, rgb.g, rgb.b))
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>G: {rgb.g}</label>
                <input type="range" min={0} max={255} value={rgb.g} onChange={(e) => {
                  const g = parseInt(e.target.value)
                  setHex(rgbToHex(rgb.r, g, rgb.b))
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>B: {rgb.b}</label>
                <input type="range" min={0} max={255} value={rgb.b} onChange={(e) => {
                  const b = parseInt(e.target.value)
                  setHex(rgbToHex(rgb.r, rgb.g, b))
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>调色板（点击复制）</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, height: 60 }}>
          {palette.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                navigator.clipboard?.writeText(c).catch(() => {})
              }}
              title={c}
              style={{
                background: c,
                border: '2px solid transparent',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 10,
                color: 'transparent',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>常用色</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map((c) => (
            <button
              key={c}
              onClick={() => setHex(c)}
              title={c}
              style={{
                aspectRatio: '1',
                background: c,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

async function computeHash(text: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest(algorithm, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return '不支持'
  }
}

function simpleMD5(string: string): string {
  function rotateLeft(n: number, s: number): number { return (n << s) | (n >>> (32 - s)) }
  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }
  function F(x: number, y: number, z: number): number { return (x & y) | ((~x) & z) }
  function G(x: number, y: number, z: number): number { return (x & z) | (y & (~z)) }
  function H(x: number, y: number, z: number): number { return x ^ y ^ z }
  function I(x: number, y: number, z: number): number { return y ^ (x | (~z)) }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function convertToWordArray(str: string): number[] {
    const wordCount = (((str.length + 8) - ((str.length + 8) % 64)) / 64 + 1) * 16
    const wordArray: number[] = new Array(wordCount - 1).fill(0)
    let bytePos = 0, byteCount = 0
    while (byteCount < str.length) {
      const wordArrayPos = (byteCount - (byteCount % 4)) / 4
      bytePos = (byteCount % 4) * 8
      wordArray[wordArrayPos] = (wordArray[wordArrayPos] | (str.charCodeAt(byteCount) << bytePos))
      byteCount++
    }
    const wordArrayPos = (byteCount - (byteCount % 4)) / 4
    bytePos = (byteCount % 4) * 8
    wordArray[wordArrayPos] = wordArray[wordArrayPos] | (0x80 << bytePos)
    wordArray[wordCount - 2] = str.length << 3
    wordArray[wordCount - 1] = str.length >>> 29
    return wordArray
  }
  function wordToHex(lvalue: number): string {
    let result = ''
    for (let i = 0; i <= 3; i++) {
      result += ((lvalue >> (i * 8 + 4)) & 0x0F).toString(16) + ((lvalue >> (i * 8)) & 0x0F).toString(16)
    }
    return result
  }
  const x = convertToWordArray(string)
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d
    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB)
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE)
    a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A)
    c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF)
    c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821)
    a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA)
    a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D)
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED)
    a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A)
    a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C)
    a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60)
    b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6)
    d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA)
    c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085)
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5)
    c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8)
    b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665)
    a = II(a, b, c, d, x[k + 0], 6, 0xF4292244)
    d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97)
    c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7)
    b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3)
    d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92)
    c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F)
    d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0)
    c = II(c, d, a, b, x[k + 6], 15, 0xA3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1)
    a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82)
    d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235)
    c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB)
    b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391)
    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}

function HashTool() {
  const [text, setText] = useState('Hello, WebLinuxOS!')
  const [md5, setMd5] = useState('')
  const [sha1, setSha1] = useState('')
  const [sha256, setSha256] = useState('')
  const [sha512, setSha512] = useState('')
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    const compute = async () => {
      setComputing(true)
      setMd5(simpleMD5(text))
      setSha1(await computeHash(text, 'SHA-1'))
      setSha256(await computeHash(text, 'SHA-256'))
      setSha512(await computeHash(text, 'SHA-512'))
      setComputing(false)
    }
    compute()
  }, [text])

  const hashItems = [
    { name: 'MD5', value: md5, bits: 128 },
    { name: 'SHA-1', value: sha1, bits: 160 },
    { name: 'SHA-256', value: sha256, bits: 256 },
    { name: 'SHA-512', value: sha512, bits: 512 },
  ]

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>哈希生成器</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip">MD5 / SHA-1</span>
          <span className="chip">SHA-256 / SHA-512</span>
        </div>
      </div>

      <textarea
        className="app-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入要计算哈希的文本..."
        style={{
          padding: 10,
          minHeight: 120,
          fontFamily: 'monospace',
          fontSize: 13,
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {text.length} 字符 {computing && ' · 计算中...'}
        </span>
        <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hashItems.map((item) => (
          <div key={item.name} style={{
            padding: 12,
            borderRadius: 8,
            background: 'var(--window-bg-secondary)',
            border: '1px solid var(--window-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.bits} bit</span>
                <CopyButton value={item.value} />
              </div>
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 12,
              wordBreak: 'break-all',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              userSelect: 'all',
            }}>
              {item.value || '计算中...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface JWTPayload {
  header: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  signature: string
  valid: boolean
  error?: string
}

function decodeJWT(token: string): JWTPayload {
  const result: JWTPayload = {
    header: null,
    payload: null,
    signature: '',
    valid: false,
  }

  if (!token || !token.includes('.')) {
    result.error = '无效的 JWT 格式'
    return result
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    result.error = 'JWT 应包含 3 个部分'
    return result
  }

  try {
    const decodeBase64Url = (str: string): string => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) base64 += '='
      return decodeURIComponent(escape(atob(base64)))
    }

    result.header = JSON.parse(decodeBase64Url(parts[0]))
    result.payload = JSON.parse(decodeBase64Url(parts[1]))
    result.signature = parts[2]
    result.valid = true
  } catch (err) {
    result.error = err instanceof Error ? err.message : '解码失败'
  }

  return result
}

function JwtTool() {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
  const decoded = useMemo(() => decodeJWT(token), [token])

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>JWT 解码器</h3>
        <span className="chip">Header.Payload.Signature</span>
      </div>

      <textarea
        className="app-textarea"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="粘贴 JWT token..."
        style={{
          padding: 10,
          minHeight: 100,
          fontFamily: 'monospace',
          fontSize: 12,
          resize: 'vertical',
        }}
      />

      {decoded.error && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: 'rgba(220, 53, 69, 0.1)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          color: '#dc3545',
          fontSize: 13,
        }}>
          ⚠️ {decoded.error}
        </div>
      )}

      {decoded.valid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'auto' }}>
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'var(--window-bg-secondary)',
            border: '1px solid var(--window-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Header (头部)</span>
              <CopyButton value={JSON.stringify(decoded.header, null, 2)} />
            </div>
            <pre style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'var(--window-bg-secondary)',
            border: '1px solid var(--window-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Payload (载荷)</span>
              <CopyButton value={JSON.stringify(decoded.payload, null, 2)} />
            </div>
            <pre style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
            {decoded.payload && typeof decoded.payload === 'object' && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--window-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {decoded.payload.iat !== undefined && (
                  <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>签发时间:</span>
                    <span>{formatDate(decoded.payload.iat as number)}</span>
                  </div>
                )}
                {decoded.payload.exp !== undefined && (
                  <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>过期时间:</span>
                    <span style={{ color: Number(decoded.payload.exp) * 1000 < Date.now() ? '#dc3545' : 'inherit' }}>
                      {formatDate(decoded.payload.exp as number)}
                      {Number(decoded.payload.exp) * 1000 < Date.now() ? ' (已过期)' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'var(--window-bg-secondary)',
            border: '1px solid var(--window-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Signature (签名)</span>
              <CopyButton value={decoded.signature} />
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
            }}>
              {decoded.signature}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function htmlEncode(str: string): string {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

function htmlDecode(str: string): string {
  const doc = new DOMParser().parseFromString(str, 'text/html')
  return doc.documentElement.textContent || ''
}

function HtmlEntityTool() {
  const [text, setText] = useState('<div class="container">\n  <h1>Hello, "World"!</h1>\n  <p>This & that</p>\n</div>')
  const encoded = useMemo(() => htmlEncode(text), [text])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>HTML 实体编解码</h3>
        <span className="chip">&amp; &lt; &gt; &quot;</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>原文</label>
          <textarea
            className="app-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入 HTML 文本..."
            style={{
              flex: 1,
              minHeight: 200,
              padding: 10,
              fontFamily: 'monospace',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text.length} 字符</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
              <CopyButton value={text} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>HTML 实体编码</label>
          <textarea
            className="app-textarea"
            value={encoded}
            onChange={(e) => setText(htmlDecode(e.target.value))}
            placeholder="或在此粘贴编码文本以解码..."
            style={{
              flex: 1,
              minHeight: 200,
              padding: 10,
              fontFamily: 'monospace',
              fontSize: 13,
              resize: 'vertical',
              background: '#1a1a2e',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{encoded.length} 字符</span>
            <CopyButton value={encoded} />
          </div>
        </div>
      </div>
    </div>
  )
}

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  'sed', 'ut', 'perspiciatis', 'unde', 'omnis', 'iste', 'natus', 'error',
  'sit', 'voluptatem', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem',
  'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis',
  'beatae', 'vitae', 'dicta', 'sunt', 'explicabo', 'nemo', 'enim', 'ipsam',
  'quia', 'voluptas', 'aspernatur', 'aut', 'odit', 'aut', 'fugit', 'sed',
  'quia', 'consequuntur', 'magni', 'dolores', 'eos', 'qui', 'ratione',
  'voluptatem', 'sequi', 'nesciunt', 'neque', 'porro', 'quisquam', 'est',
  'qui', 'dolorem', 'ipsum', 'quia', 'dolor', 'sit', 'amet', 'consectetur',
  'adipisci', 'velit', 'sed', 'quia', 'non', 'numquam', 'eius', 'modi',
  'tempora', 'incidunt', 'ut', 'labore', 'et', 'dolore', 'magnam', 'aliquam',
  'quaerat', 'voluptatem', 'ut', 'enim', 'ad', 'minima', 'veniam',
]

function generateLorem(type: 'words' | 'sentences' | 'paragraphs', count: number): string {
  const rand = (n: number) => Math.floor(Math.random() * n)
  const pickWord = (): string => LOREM_WORDS[rand(LOREM_WORDS.length)]

  const generateSentence = (): string => {
    const wordCount = 5 + rand(15)
    const words: string[] = []
    for (let i = 0; i < wordCount; i++) {
      words.push(pickWord())
    }
    const sentence = words.join(' ')
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
  }

  const generateParagraph = (): string => {
    const sentenceCount = 3 + rand(6)
    const sentences: string[] = []
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence())
    }
    return sentences.join(' ')
  }

  if (type === 'words') {
    const words: string[] = []
    for (let i = 0; i < count; i++) {
      words.push(pickWord())
    }
    return words.join(' ')
  }

  if (type === 'sentences') {
    const sentences: string[] = []
    for (let i = 0; i < count; i++) {
      sentences.push(generateSentence())
    }
    return sentences.join(' ')
  }

  const paragraphs: string[] = []
  for (let i = 0; i < count; i++) {
    paragraphs.push(generateParagraph())
  }
  return paragraphs.join('\n\n')
}

function LoremIpsumTool() {
  const [type, setType] = useState<'words' | 'sentences' | 'paragraphs'>('paragraphs')
  const [count, setCount] = useState(3)
  const [text, setText] = useState('')

  useEffect(() => {
    setText(generateLorem(type, count))
  }, [type, count])

  const regenerate = () => {
    setText(generateLorem(type, count))
  }

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Lorem Ipsum 占位文本</h3>
        <span className="chip">随机生成</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['words', 'sentences', 'paragraphs'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="app-button"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                background: type === t ? 'var(--accent)' : 'transparent',
                color: type === t ? '#fff' : 'var(--text-primary)',
                border: `1px solid ${type === t ? 'var(--accent)' : 'var(--window-border)'}`,
              }}
            >
              {t === 'words' ? '单词' : t === 'sentences' ? '句子' : '段落'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>数量:</span>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            min={1}
            max={100}
            style={{
              width: 60,
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
          />
        </div>
        <button onClick={regenerate} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
          🔄 重新生成
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <textarea
          className="app-textarea"
          value={text}
          readOnly
          style={{
            width: '100%',
            height: '100%',
            minHeight: 200,
            padding: 12,
            fontSize: 13,
            lineHeight: 1.7,
            resize: 'none',
            cursor: 'text',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {text.split(/\s+/).filter(Boolean).length} 词 · {text.length} 字符
        </span>
        <CopyButton value={text} />
      </div>
    </div>
  )
}

export default DevToolboxPro
