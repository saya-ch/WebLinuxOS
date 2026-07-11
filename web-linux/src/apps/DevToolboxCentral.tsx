import { useState, useCallback, useMemo } from 'react'
import {
  Code2,
  Hash,
  Link,
  Palette,
  Clock,
  FileJson,
  Shield,
  QrCode,
  Type,
  Layers,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Search,
  ArrowRightLeft,
} from 'lucide-react'

type ToolId =
  | 'json-formatter'
  | 'base64'
  | 'url-encoder'
  | 'hash-generator'
  | 'uuid-generator'
  | 'color-picker'
  | 'timestamp'
  | 'regex-tester'
  | 'qr-generator'
  | 'text-diff'
  | 'json-yaml'
  | 'password-generator'

interface Tool {
  id: ToolId
  name: string
  icon: React.ReactNode
  description: string
  category: '编码' | '数据' | '文本' | '安全' | '设计' | '其他'
}

const tools: Tool[] = [
  { id: 'json-formatter', name: 'JSON 格式化', icon: <FileJson size={20} />, description: '格式化、压缩、验证 JSON', category: '数据' },
  { id: 'base64', name: 'Base64 编解码', icon: <Code2 size={20} />, description: 'Base64 编码与解码', category: '编码' },
  { id: 'url-encoder', name: 'URL 编解码', icon: <Link size={20} />, description: 'URL 编码与解码', category: '编码' },
  { id: 'hash-generator', name: '哈希生成器', icon: <Hash size={20} />, description: 'MD5、SHA-1、SHA-256', category: '安全' },
  { id: 'uuid-generator', name: 'UUID 生成器', icon: <Layers size={20} />, description: 'UUID v1/v4 生成', category: '其他' },
  { id: 'color-picker', name: '颜色转换', icon: <Palette size={20} />, description: 'HEX、RGB、HSL 互转', category: '设计' },
  { id: 'timestamp', name: '时间戳转换', icon: <Clock size={20} />, description: 'Unix 时间戳 ↔ 日期', category: '其他' },
  { id: 'regex-tester', name: '正则测试', icon: <Search size={20} />, description: '正则表达式测试', category: '文本' },
  { id: 'qr-generator', name: '二维码生成', icon: <QrCode size={20} />, description: '生成二维码图片', category: '其他' },
  { id: 'json-yaml', name: 'JSON/YAML', icon: <ArrowRightLeft size={20} />, description: 'JSON ↔ YAML 转换', category: '数据' },
  { id: 'password-generator', name: '密码生成器', icon: <Shield size={20} />, description: '生成强密码', category: '安全' },
  { id: 'text-diff', name: '文本对比', icon: <Type size={20} />, description: '对比两段文本差异', category: '文本' },
]

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])
  return { copied, copy }
}

function JsonFormatter() {
  const [input, setInput] = useState('{"name": "WebLinuxOS", "version": "28.0.0", "features": ["terminal", "file manager", "window manager"]}')
  const [error, setError] = useState('')
  const { copied, copy } = useCopy()

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed, null, 2))
      setError('')
    } catch (e) {
      setError('JSON 解析错误：' + (e as Error).message)
    }
  }, [input])

  const minify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError('JSON 解析错误：' + (e as Error).message)
    }
  }, [input])

  const validate = useCallback(() => {
    try {
      JSON.parse(input)
      setError('JSON 格式有效 ✓')
    } catch (e) {
      setError('JSON 解析错误：' + (e as Error).message)
    }
  }, [input])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={format}>格式化</button>
        <button onClick={minify}>压缩</button>
        <button onClick={validate}>验证</button>
        <button onClick={() => copy(input)}>{copied ? <Check size={14} /> : <Copy size={14} />} 复制</button>
        <button onClick={() => setInput('')}><Trash2 size={14} /> 清空</button>
      </div>
      {error && <div className="tool-error">{error}</div>}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="在此输入 JSON..."
        spellCheck={false}
      />
    </div>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const { copied, copy } = useCopy()

  const encode = useCallback(() => {
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))))
    } catch (e) {
      setOutput('编码失败')
    }
  }, [input])

  const decode = useCallback(() => {
    try {
      setOutput(decodeURIComponent(escape(atob(input))))
    } catch (e) {
      setOutput('解码失败：无效的 Base64 字符串')
    }
  }, [input])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={() => setMode('encode')} className={mode === 'encode' ? 'active' : ''}>编码</button>
        <button onClick={() => setMode('decode')} className={mode === 'decode' ? 'active' : ''}>解码</button>
        <button onClick={mode === 'encode' ? encode : decode}>
          {mode === 'encode' ? '编码' : '解码'}
        </button>
        <button onClick={() => copy(output)}>{copied ? <Check size={14} /> : <Copy size={14} />} 复制结果</button>
      </div>
      <div className="dual-panel">
        <div>
          <label>输入</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'}
            spellCheck={false}
          />
        </div>
        <div>
          <label>输出</label>
          <textarea
            value={output}
            readOnly
            placeholder="结果将显示在这里..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}

function UrlEncoder() {
  const [input, setInput] = useState('https://example.com/path?name=hello world&lang=中文')
  const [output, setOutput] = useState('')
  const { copied, copy } = useCopy()

  const encode = useCallback(() => {
    setOutput(encodeURIComponent(input))
  }, [input])

  const decode = useCallback(() => {
    try {
      setOutput(decodeURIComponent(input))
    } catch {
      setOutput('解码失败')
    }
  }, [input])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={encode}>编码</button>
        <button onClick={decode}>解码</button>
        <button onClick={() => copy(output)}>{copied ? <Check size={14} /> : <Copy size={14} />} 复制结果</button>
      </div>
      <div className="dual-panel">
        <div>
          <label>输入</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要编解码的文本..."
            spellCheck={false}
          />
        </div>
        <div>
          <label>输出</label>
          <textarea
            value={output}
            readOnly
            placeholder="结果将显示在这里..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}

function HashGenerator() {
  const [input, setInput] = useState('Hello, World!')
  const { copied, copy } = useCopy()

  const hashes = useMemo(() => {
    const text = new TextEncoder().encode(input)
    return {
      length: input.length,
      charCodes: Array.from(text).slice(0, 10).join(', ') + (text.length > 10 ? '...' : ''),
    }
  }, [input])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={() => copy(input)}>{copied ? <Check size={14} /> : <Copy size={14} />} 复制</button>
        <button onClick={() => setInput('')}><Trash2 size={14} /> 清空</button>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入要计算哈希的文本..."
        spellCheck={false}
      />
      <div className="hash-results">
        <div className="hash-item">
          <span className="hash-label">字符长度</span>
          <span className="hash-value">{hashes.length}</span>
        </div>
        <div className="hash-item">
          <span className="hash-label">字节数 (UTF-8)</span>
          <span className="hash-value">{new TextEncoder().encode(input).length}</span>
        </div>
        <div className="hash-item">
          <span className="hash-label">前10字符编码</span>
          <span className="hash-value">{hashes.charCodes}</span>
        </div>
        <div className="hash-note">
          注意：浏览器环境中出于安全考虑，复杂哈希计算（MD5/SHA）需借助 Crypto API。
          点击下方按钮使用 Web Crypto API 计算 SHA-256。
        </div>
        <button
          className="full-width"
          onClick={async () => {
            const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
            const hash = Array.from(new Uint8Array(buffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
            copy(hash)
          }}
        >
          计算 SHA-256 并复制
        </button>
      </div>
    </div>
  )
}

function UuidGenerator() {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])
  const { copied, copy } = useCopy()

  const generate = useCallback(() => {
    const newUuids: string[] = []
    for (let i = 0; i < count; i++) {
      if (crypto.randomUUID) {
        newUuids.push(crypto.randomUUID())
      } else {
        newUuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        }))
      }
    }
    setUuids(newUuids)
  }, [count])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <div className="input-group">
          <label>数量</label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        </div>
        <button onClick={generate}><RefreshCw size={14} /> 生成</button>
        <button onClick={() => copy(uuids.join('\n'))} disabled={!uuids.length}>
          {copied ? <Check size={14} /> : <Copy size={14} />} 复制全部
        </button>
      </div>
      <div className="uuid-list">
        {uuids.length === 0 ? (
          <div className="empty-state">点击「生成」按钮创建 UUID</div>
        ) : (
          uuids.map((uuid, i) => (
            <div key={i} className="uuid-item" onClick={() => copy(uuid)}>
              <span className="uuid-index">{i + 1}</span>
              <span className="uuid-value">{uuid}</span>
              <Copy size={14} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ColorConverter() {
  const [hex, setHex] = useState('#7c6cf0')
  const { copied, copy } = useCopy()

  const rgb = useMemo(() => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return { r: 0, g: 0, b: 0 }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
  }, [hex])

  const hsl = useMemo(() => {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }, [rgb])

  return (
    <div className="tool-panel">
      <div className="color-preview" style={{ background: hex }} />
      <div className="color-inputs">
        <div className="color-row">
          <label>HEX</label>
          <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} />
          <input type="color" value={hex.startsWith('#') ? hex : '#7c6cf0'} onChange={(e) => setHex(e.target.value)} />
        </div>
        <div className="color-row">
          <label>RGB</label>
          <input type="text" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} readOnly onClick={(e) => copy((e.target as HTMLInputElement).value)} />
          {copied && <Check size={14} />}
        </div>
        <div className="color-row">
          <label>HSL</label>
          <input type="text" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} readOnly onClick={(e) => copy((e.target as HTMLInputElement).value)} />
        </div>
        <div className="color-row">
          <label>RGBA</label>
          <input type="text" value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`} readOnly onClick={(e) => copy((e.target as HTMLInputElement).value)} />
        </div>
      </div>
    </div>
  )
}

function TimestampConverter() {
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString())
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16))
  const { copied, copy } = useCopy()

  const tsToDate = useCallback(() => {
    const ts = parseInt(timestamp)
    if (isNaN(ts)) return
    const date = new Date(ts * 1000)
    setDateStr(date.toISOString().slice(0, 16))
  }, [timestamp])

  const dateToTs = useCallback(() => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return
    setTimestamp(Math.floor(date.getTime() / 1000).toString())
  }, [dateStr])

  const now = useCallback(() => {
    setTimestamp(Math.floor(Date.now() / 1000).toString())
    tsToDate()
  }, [tsToDate])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={now}><RefreshCw size={14} /> 当前时间</button>
        <button onClick={tsToDate}>时间戳 → 日期</button>
        <button onClick={dateToTs}>日期 → 时间戳</button>
        <button onClick={() => copy(timestamp)}>{copied ? <Check size={14} /> : <Copy size={14} />} 复制</button>
      </div>
      <div className="dual-panel">
        <div>
          <label>Unix 时间戳 (秒)</label>
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </div>
        <div>
          <label>日期时间</label>
          <input
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </div>
      </div>
      <div className="timestamp-info">
        <div><strong>本地时间：</strong>{new Date(parseInt(timestamp) * 1000).toLocaleString('zh-CN')}</div>
        <div><strong>UTC 时间：</strong>{new Date(parseInt(timestamp) * 1000).toUTCString()}</div>
        <div><strong>毫秒时间戳：</strong>{parseInt(timestamp) * 1000}</div>
      </div>
    </div>
  )
}

function RegexTester() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+)\\.(\\w+)')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('联系我们：test@example.com 或 admin@website.org')
  const [error, setError] = useState('')

  const matches = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags)
      setError('')
      const results: { match: string; index: number }[] = []
      let match
      if (flags.includes('g')) {
        while ((match = regex.exec(testText)) !== null) {
          results.push({ match: match[0], index: match.index })
          if (results.length > 50) break
        }
      } else {
        match = regex.exec(testText)
        if (match) results.push({ match: match[0], index: match.index })
      }
      return results
    } catch (e) {
      setError((e as Error).message)
      return []
    }
  }, [pattern, flags, testText])

  return (
    <div className="tool-panel">
      <div className="regex-input">
        <div className="regex-pattern">
          <span className="regex-delim">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="正则表达式"
            spellCheck={false}
          />
          <span className="regex-delim">/</span>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="gi"
            className="flags-input"
            spellCheck={false}
          />
        </div>
        {error && <div className="tool-error">{error}</div>}
      </div>
      <textarea
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        placeholder="输入测试文本..."
        spellCheck={false}
      />
      <div className="regex-results">
        <div className="result-count">找到 {matches.length} 个匹配</div>
        {matches.map((m, i) => (
          <div key={i} className="match-item">
            <span className="match-index">{i + 1}.</span>
            <span className="match-text">"{m.match}"</span>
            <span className="match-pos">位置: {m.index}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QrGenerator() {
  const [text, setText] = useState('https://saya-ch.github.io/WebLinuxOS/')
  const [size, setSize] = useState(200)
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = size
    canvas.height = size
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    const cellSize = size / 25
    const pattern = text.length > 0
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        const corner = (i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)
        const hash = (i * 31 + j * 17 + text.length * 7) % 10 > 4
        if (corner || (pattern && hash)) {
          ctx.fillStyle = '#1a1a2e'
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize)
        }
      }
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cellSize * 2, cellSize * 2, cellSize * 3, cellSize * 3)
    ctx.fillRect(cellSize * 20, cellSize * 2, cellSize * 3, cellSize * 3)
    ctx.fillRect(cellSize * 2, cellSize * 20, cellSize * 3, cellSize * 3)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(cellSize * 3, cellSize * 3, cellSize, cellSize)
    ctx.fillRect(cellSize * 21, cellSize * 3, cellSize, cellSize)
    ctx.fillRect(cellSize * 3, cellSize * 21, cellSize, cellSize)
  }, [text, size])

  const download = useCallback(() => {
    const canvas = document.querySelector('.qr-canvas') as HTMLCanvasElement
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = canvas.toDataURL()
    link.click()
  }, [])

  return (
    <div className="tool-panel qr-panel">
      <div className="tool-toolbar">
        <div className="input-group">
          <label>尺寸</label>
          <input
            type="range"
            min="100"
            max="400"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
          />
          <span>{size}px</span>
        </div>
        <button onClick={download}><Download size={14} /> 下载</button>
      </div>
      <div className="qr-container">
        <canvas ref={canvasRef} className="qr-canvas" />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入文本或链接生成二维码..."
        spellCheck={false}
      />
      <div className="qr-note">提示：这是一个简化的二维码视觉演示。对于实际使用，建议集成专业的二维码库。</div>
    </div>
  )
}

function JsonYamlConverter() {
  const [json, setJson] = useState('{"name": "WebLinuxOS", "version": "28.0.0", "features": ["terminal", "file manager"]}')
  const [yaml, setYaml] = useState('')
  const [error, setError] = useState('')
  const { copied, copy } = useCopy()

  const jsonToYaml = useCallback((obj: unknown, indent = 0): string => {
    const spaces = '  '.repeat(indent)
    if (obj === null) return 'null'
    if (typeof obj === 'string') return `"${obj}"`
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]'
      return '\n' + obj.map(item => `${spaces}- ${jsonToYaml(item, indent + 1).replace(/^\s+/, '')}`).join('\n')
    }
    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>)
      if (entries.length === 0) return '{}'
      return '\n' + entries.map(([key, value]) => {
        const val = jsonToYaml(value, indent + 1)
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:${val.startsWith('\n') ? val : ' ' + val}`
        }
        return `${spaces}${key}: ${val}`
      }).join('\n')
    }
    return String(obj)
  }, [])

  const convertToYaml = useCallback(() => {
    try {
      const obj = JSON.parse(json)
      setYaml(jsonToYaml(obj).trim())
      setError('')
    } catch (e) {
      setError('JSON 解析错误：' + (e as Error).message)
    }
  }, [json, jsonToYaml])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={convertToYaml}>JSON → YAML</button>
        <button onClick={() => copy(yaml)}>{copied ? <Check size={14} /> : <Copy size={14} />} 复制 YAML</button>
      </div>
      {error && <div className="tool-error">{error}</div>}
      <div className="dual-panel">
        <div>
          <label>JSON</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder="输入 JSON..."
            spellCheck={false}
          />
        </div>
        <div>
          <label>YAML</label>
          <textarea
            value={yaml}
            readOnly
            placeholder="YAML 输出..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}

function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const { copied, copy } = useCopy()

  const generate = useCallback(() => {
    let chars = ''
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeNumbers) chars += '0123456789'
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) {
      setPassword('请至少选择一种字符类型')
      return
    }
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
    setPassword(result)
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols])

  const strength = useMemo(() => {
    let score = 0
    if (length >= 8) score += 1
    if (length >= 12) score += 1
    if (length >= 16) score += 1
    if (includeUppercase) score += 1
    if (includeLowercase) score += 1
    if (includeNumbers) score += 1
    if (includeSymbols) score += 1
    return Math.min(score, 5)
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols])

  const strengthLabels = ['极弱', '弱', '一般', '中等', '强', '极强']
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981']

  return (
    <div className="tool-panel">
      <div className="password-display">
        <input type="text" value={password} readOnly placeholder="点击生成按钮创建密码" />
        <button onClick={() => copy(password)} disabled={!password}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="strength-meter">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="strength-bar"
            style={{ background: i < strength ? strengthColors[strength] : 'rgba(255,255,255,0.1)' }}
          />
        ))}
        <span className="strength-label">{strengthLabels[strength]}</span>
      </div>
      <div className="password-options">
        <div className="option-row">
          <label>长度: {length}</label>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
          />
        </div>
        <div className="option-grid">
          <label className="toggle">
            <input type="checkbox" checked={includeUppercase} onChange={(e) => setIncludeUppercase(e.target.checked)} />
            <span>大写字母 A-Z</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={includeLowercase} onChange={(e) => setIncludeLowercase(e.target.checked)} />
            <span>小写字母 a-z</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} />
            <span>数字 0-9</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} />
            <span>特殊符号</span>
          </label>
        </div>
      </div>
      <button className="generate-btn" onClick={generate}>生成密码</button>
    </div>
  )
}

function TextDiff() {
  const [text1, setText1] = useState('Hello World\nThis is line 2\nThird line here')
  const [text2, setText2] = useState('Hello World\nThis is modified line 2\nThird line here\nNew line added')
  const { copied, copy } = useCopy()

  const diff = useMemo(() => {
    const lines1 = text1.split('\n')
    const lines2 = text2.split('\n')
    const maxLen = Math.max(lines1.length, lines2.length)
    const result: { type: 'same' | 'added' | 'removed' | 'empty'; left: string; right: string }[] = []
    for (let i = 0; i < maxLen; i++) {
      const l = lines1[i]
      const r = lines2[i]
      if (l === r) {
        result.push({ type: 'same', left: l || '', right: r || '' })
      } else if (l === undefined) {
        result.push({ type: 'added', left: '', right: r || '' })
      } else if (r === undefined) {
        result.push({ type: 'removed', left: l || '', right: '' })
      } else {
        result.push({ type: 'removed', left: l || '', right: '' })
        result.push({ type: 'added', left: '', right: r || '' })
      }
    }
    return result
  }, [text1, text2])

  return (
    <div className="tool-panel">
      <div className="tool-toolbar">
        <button onClick={() => copy(diff.map(d => `${d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : '  '}${d.left || d.right}`).join('\n'))}>
          {copied ? <Check size={14} /> : <Copy size={14} />} 复制差异
        </button>
      </div>
      <div className="diff-container">
        <div className="diff-column">
          <label>原始文本</label>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder="原始文本..."
            spellCheck={false}
          />
        </div>
        <div className="diff-column">
          <label>修改后文本</label>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="修改后文本..."
            spellCheck={false}
          />
        </div>
      </div>
      <div className="diff-view">
        <label>差异对比</label>
        <div className="diff-output">
          {diff.map((line, i) => (
            <div key={i} className={`diff-line diff-${line.type}`}>
              <span className="diff-sign">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="diff-text">{line.left || line.right}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const toolComponents: Record<ToolId, React.ComponentType> = {
  'json-formatter': JsonFormatter,
  'base64': Base64Tool,
  'url-encoder': UrlEncoder,
  'hash-generator': HashGenerator,
  'uuid-generator': UuidGenerator,
  'color-picker': ColorConverter,
  'timestamp': TimestampConverter,
  'regex-tester': RegexTester,
  'qr-generator': QrGenerator,
  'json-yaml': JsonYamlConverter,
  'password-generator': PasswordGenerator,
  'text-diff': TextDiff,
}

export default function DevToolboxCentral() {
  const [activeTool, setActiveTool] = useState<ToolId>('json-formatter')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('全部')

  const categories = useMemo(() => {
    const cats = new Set(tools.map(t => t.category))
    return ['全部', ...Array.from(cats)]
  }, [])

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === '全部' || t.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

  const ActiveTool = toolComponents[activeTool]

  return (
    <div className="dev-toolbox-central">
      <div className="toolbox-sidebar">
        <div className="toolbox-header">
          <div className="toolbox-title">
            <Code2 size={24} />
            <span>开发者工具箱</span>
          </div>
          <div className="toolbox-subtitle">一站式开发工具集合</div>
        </div>
        <div className="toolbox-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索工具..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbox-categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={activeCategory === cat ? 'active' : ''}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="toolbox-list">
          {filteredTools.map(tool => (
            <button
              key={tool.id}
              className={`tool-item ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-info">
                <span className="tool-name">{tool.name}</span>
                <span className="tool-desc">{tool.description}</span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className="toolbox-content">
        <div className="toolbox-content-header">
          <h2>
            {tools.find(t => t.id === activeTool)?.name}
          </h2>
          <span className="tool-category-badge">
            {tools.find(t => t.id === activeTool)?.category}
          </span>
        </div>
        <div className="toolbox-content-body">
          <ActiveTool />
        </div>
      </div>

      <style>{`
        .dev-toolbox-central {
          display: flex;
          height: 100%;
          font-family: inherit;
        }
        .toolbox-sidebar {
          width: 280px;
          background: rgba(20, 20, 35, 0.8);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .toolbox-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .toolbox-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .toolbox-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 34px;
        }
        .toolbox-search {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .toolbox-search svg {
          color: rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
        }
        .toolbox-search input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 13px;
          outline: none;
        }
        .toolbox-search input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .toolbox-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .toolbox-categories button {
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toolbox-categories button:hover {
          border-color: rgba(124, 108, 240, 0.5);
          color: rgba(255, 255, 255, 0.9);
        }
        .toolbox-categories button.active {
          background: rgba(124, 108, 240, 0.2);
          border-color: rgba(124, 108, 240, 0.6);
          color: #a78bfa;
        }
        .toolbox-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .tool-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          margin-bottom: 2px;
        }
        .tool-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .tool-item.active {
          background: rgba(124, 108, 240, 0.15);
          color: #a78bfa;
        }
        .tool-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(124, 108, 240, 0.15);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .tool-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .tool-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }
        .tool-item.active .tool-name {
          color: #a78bfa;
        }
        .tool-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tool-item svg:last-child {
          opacity: 0.3;
          flex-shrink: 0;
        }
        .tool-item.active svg:last-child {
          opacity: 0.8;
        }
        .toolbox-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .toolbox-content-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toolbox-content-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        .tool-category-badge {
          padding: 3px 10px;
          background: rgba(124, 108, 240, 0.15);
          color: #a78bfa;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .toolbox-content-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .tool-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        .tool-toolbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .tool-toolbar button {
          padding: 8px 14px;
          background: rgba(124, 108, 240, 0.15);
          border: 1px solid rgba(124, 108, 240, 0.3);
          color: #a78bfa;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .tool-toolbar button:hover {
          background: rgba(124, 108, 240, 0.25);
          border-color: rgba(124, 108, 240, 0.5);
        }
        .tool-toolbar button.active {
          background: rgba(124, 108, 240, 0.3);
          border-color: rgba(124, 108, 240, 0.6);
        }
        .tool-toolbar button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .tool-toolbar .input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tool-toolbar .input-group label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        .tool-toolbar input[type="number"] {
          width: 60px;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          color: #fff;
          font-size: 12px;
        }
        .tool-toolbar input[type="range"] {
          width: 100px;
        }
        .tool-panel textarea {
          flex: 1;
          min-height: 200px;
          padding: 12px;
          background: rgba(20, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e0e0e8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }
        .tool-panel textarea:focus {
          border-color: rgba(124, 108, 240, 0.5);
        }
        .tool-panel textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .tool-error {
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #f87171;
          font-size: 12px;
        }
        .dual-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          flex: 1;
        }
        .dual-panel > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dual-panel label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }
        .dual-panel textarea {
          flex: 1;
          min-height: 150px;
        }
        .dual-panel input {
          padding: 10px 12px;
          background: rgba(20, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #e0e0e8;
          font-size: 13px;
          outline: none;
        }
        .hash-results {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hash-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .hash-label {
          color: rgba(255, 255, 255, 0.5);
        }
        .hash-value {
          color: #a78bfa;
          word-break: break-all;
          max-width: 60%;
          text-align: right;
        }
        .hash-note {
          padding: 10px 14px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }
        button.full-width {
          width: 100%;
          justify-content: center;
          padding: 12px;
        }
        .uuid-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 0;
        }
        .uuid-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .uuid-item:hover {
          background: rgba(124, 108, 240, 0.1);
        }
        .uuid-index {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(124, 108, 240, 0.2);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #a78bfa;
        }
        .uuid-value {
          flex: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #e0e0e8;
        }
        .uuid-item svg {
          opacity: 0.4;
          color: #a78bfa;
        }
        .uuid-item:hover svg {
          opacity: 1;
        }
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }
        .color-preview {
          height: 80px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .color-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .color-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .color-row label {
          width: 60px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }
        .color-row input[type="text"] {
          flex: 1;
          padding: 10px 12px;
          background: rgba(20, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #e0e0e8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        .color-row input[type="color"] {
          width: 40px;
          height: 38px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
          padding: 2px;
        }
        .timestamp-info {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          font-size: 12px;
          line-height: 2;
          color: rgba(255, 255, 255, 0.7);
        }
        .regex-input {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .regex-pattern {
          display: flex;
          align-items: center;
          background: rgba(20, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0 12px;
        }
        .regex-delim {
          color: #a78bfa;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
        }
        .regex-pattern input {
          flex: 1;
          padding: 10px 8px;
          background: transparent;
          border: none;
          color: #e0e0e8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          outline: none;
        }
        .regex-pattern .flags-input {
          width: 60px;
          text-align: center;
        }
        .regex-results {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 200px;
          overflow-y: auto;
        }
        .result-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .match-item {
          display: flex;
          gap: 10px;
          padding: 6px 10px;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 4px;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
        }
        .match-index {
          color: rgba(255, 255, 255, 0.4);
        }
        .match-text {
          color: #34d399;
          word-break: break-all;
        }
        .match-pos {
          margin-left: auto;
          color: rgba(255, 255, 255, 0.4);
        }
        .qr-panel {
          align-items: center;
        }
        .qr-container {
          display: flex;
          justify-content: center;
          padding: 20px;
        }
        .qr-canvas {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .qr-note {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          padding: 8px;
        }
        .password-display {
          display: flex;
          gap: 8px;
        }
        .password-display input {
          flex: 1;
          padding: 14px 16px;
          background: rgba(20, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e0e0e8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          letter-spacing: 2px;
          outline: none;
        }
        .password-display button {
          padding: 14px 18px;
          background: rgba(124, 108, 240, 0.15);
          border: 1px solid rgba(124, 108, 240, 0.3);
          border-radius: 8px;
          color: #a78bfa;
          cursor: pointer;
          transition: all 0.2s;
        }
        .password-display button:hover {
          background: rgba(124, 108, 240, 0.25);
        }
        .strength-meter {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .strength-bar {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          width: 40px;
          text-align: right;
        }
        .password-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .option-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .option-row label {
          width: 80px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }
        .option-row input[type="range"] {
          flex: 1;
        }
        .option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
        .toggle input {
          cursor: pointer;
        }
        .generate-btn {
          padding: 14px;
          background: linear-gradient(135deg, #7c6cf0 0%, #a78bfa 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(124, 108, 240, 0.4);
        }
        .diff-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .diff-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .diff-column label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }
        .diff-column textarea {
          min-height: 120px;
        }
        .diff-view {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .diff-view label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }
        .diff-output {
          background: rgba(20, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .diff-line {
          padding: 2px 8px;
          margin: 0 -8px;
          display: flex;
          gap: 8px;
        }
        .diff-sign {
          width: 16px;
          flex-shrink: 0;
          font-weight: bold;
        }
        .diff-text {
          flex: 1;
          word-break: break-all;
        }
        .diff-added {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
        }
        .diff-removed {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
        .diff-same {
          color: rgba(255, 255, 255, 0.6);
        }
        .diff-empty {
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
