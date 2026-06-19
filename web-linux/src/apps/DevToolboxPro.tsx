import { useState, useMemo, useRef, useEffect } from 'react'

type TabKey = 'base64' | 'url' | 'json' | 'regex' | 'uuid' | 'timestamp' | 'color'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'base64', label: 'Base64', icon: '🔐' },
  { key: 'url', label: 'URL', icon: '🔗' },
  { key: 'json', label: 'JSON', icon: '📋' },
  { key: 'regex', label: '正则', icon: '🎯' },
  { key: 'uuid', label: 'UUID/密码', icon: '🆔' },
  { key: 'timestamp', label: '时间戳', icon: '⏰' },
  { key: 'color', label: '颜色', icon: '🎨' },
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

export default DevToolboxPro
