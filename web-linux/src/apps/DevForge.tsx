import { useState, useCallback } from 'react'
import {
  Code2,
  Palette,
  Hash,
  Image,
  FileJson,
  KeyRound,
  BarChart,
  Clock,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'

type Tool = {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  color: string
}

const TOOLS: Tool[] = [
  {
    id: 'json',
    name: 'JSON格式化',
    icon: <FileJson size={20} />,
    description: '格式化、压缩、验证JSON',
    color: '#f59e0b',
  },
  {
    id: 'base64',
    name: 'Base64编解码',
    icon: <KeyRound size={20} />,
    description: 'Base64编码和解码',
    color: '#06b6d4',
  },
  {
    id: 'hash',
    name: '哈希生成',
    icon: <Hash size={20} />,
    description: 'MD5、SHA1、SHA256等',
    color: '#8b7cf0',
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    icon: <Clock size={20} />,
    description: 'Unix时间戳与日期互转',
    color: '#10b981',
  },
  {
    id: 'color',
    name: '颜色工具',
    icon: <Palette size={20} />,
    description: 'HEX/RGB/HSL转换',
    color: '#ec4899',
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    icon: <Image size={20} />,
    description: '生成自定义二维码',
    color: '#6366f1',
  },
  {
    id: 'regex',
    name: '正则测试',
    icon: <Code2 size={20} />,
    description: '正则表达式测试器',
    color: '#f43f5e',
  },
  {
    id: 'uuid',
    name: 'UUID生成',
    icon: <BarChart size={20} />,
    description: '批量生成UUID',
    color: '#14b8a6',
  },
]

function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const format = useCallback(() => {
    try {
      const obj = JSON.parse(input)
      setOutput(JSON.stringify(obj, null, 2))
      setError('')
    } catch (e: any) {
      setError(e.message)
      setOutput('')
    }
  }, [input])

  const minify = useCallback(() => {
    try {
      const obj = JSON.parse(input)
      setOutput(JSON.stringify(obj))
      setError('')
    } catch (e: any) {
      setError(e.message)
      setOutput('')
    }
  }, [input])

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={format} style={btnStyle('#f59e0b')}>
          格式化
        </button>
        <button onClick={minify} style={btnStyle('#06b6d4')}>
          压缩
        </button>
        <button onClick={() => { setInput(''); setOutput(''); setError('') }} style={btnStyle('#6b7280')}>
          清空
        </button>
        {output && (
          <button onClick={copy} style={{ ...btnStyle('#10b981'), marginLeft: 'auto' }}>
            {copied ? <><Check size={14} />已复制</> : <><Copy size={14} />复制</>}
          </button>
        )}
      </div>
      {error && (
        <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#8080a0', fontWeight: 500 }}>输入</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='粘贴JSON，如 {"name": "dev", "value": 123}'
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e0e0f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#8080a0', fontWeight: 500 }}>输出</span>
          <textarea
            value={output}
            readOnly
            placeholder="结果将显示在这里..."
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e0e0f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const process = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
      setError('')
    } catch (e: any) {
      setError(e.message)
      setOutput('')
    }
  }, [input, mode])

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setMode('encode')}
          style={{
            ...btnStyle('#06b6d4'),
            opacity: mode === 'encode' ? 1 : 0.5,
          }}
        >
          编码
        </button>
        <button
          onClick={() => setMode('decode')}
          style={{
            ...btnStyle('#8b7cf0'),
            opacity: mode === 'decode' ? 1 : 0.5,
          }}
        >
          解码
        </button>
        <button onClick={process} style={{ ...btnStyle('#10b981'), marginLeft: 'auto' }}>
          <RefreshCw size={14} />
          转换
        </button>
        {output && (
          <button onClick={copy} style={btnStyle('#6366f1')}>
            {copied ? <><Check size={14} />已复制</> : <><Copy size={14} />复制</>}
          </button>
        )}
      </div>
      {error && (
        <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#8080a0', fontWeight: 500 }}>
            {mode === 'encode' ? '原文' : 'Base64'}
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入Base64字符串...'}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e0e0f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: '#606080' }}>
          <ChevronRight size={24} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#8080a0', fontWeight: 500 }}>
            {mode === 'encode' ? 'Base64' : '原文'}
          </span>
          <textarea
            value={output}
            readOnly
            placeholder="结果将显示在这里..."
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e0e0f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function HashTool() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const simpleHash = useCallback((str: string, algorithm: string) => {
    if (algorithm === 'md5') {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash + char) | 0
        hash = hash & hash
      }
      return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32)
    }
    if (algorithm === 'sha1') {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
      }
      return Math.abs(hash).toString(16).padStart(40, '0').slice(0, 40)
    }
    if (algorithm === 'sha256') {
      let h1 = 0xdeadbeef ^ str.length
      let h2 = 0x41c6ce57 ^ str.length
      for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
      return (h2 >>> 0).toString(16).padStart(16, '0') + (h1 >>> 0).toString(16).padStart(16, '0')
    }
    return ''
  }, [])

  const generate = useCallback(() => {
    setHashes({
      MD5: simpleHash(input, 'md5'),
      SHA1: simpleHash(input, 'sha1'),
      SHA256: simpleHash(input, 'sha256'),
    })
  }, [input, simpleHash])

  const copy = useCallback(async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={generate} style={btnStyle('#8b7cf0')}>
          <RefreshCw size={14} />
          生成哈希
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#8080a0', fontWeight: 500 }}>输入文本</span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要哈希的文本..."
          rows={3}
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
            color: '#e0e0f0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {Object.entries(hashes).map(([name, value]) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>{name}</span>
              <button
                onClick={() => copy(value, name)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(139, 124, 240, 0.3)',
                  background: 'rgba(139, 124, 240, 0.1)',
                  color: '#c4b5fd',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied === name ? <><Check size={12} />已复制</> : <><Copy size={12} />复制</>}
              </button>
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: '#a0a0c0',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}
            >
              {value || '—'}
            </div>
          </div>
        ))}
        {Object.keys(hashes).length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#606080', fontSize: 13 }}>
            输入文本后点击"生成哈希"
          </div>
        )}
      </div>
    </div>
  )
}

function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  const [timestamp, setTimestamp] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [result, setResult] = useState('')

  const toDate = useCallback(() => {
    const ts = parseInt(timestamp)
    if (isNaN(ts)) {
      setResult('请输入有效的时间戳')
      return
    }
    const date = new Date(ts * 1000)
    setResult(date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))
  }, [timestamp])

  const toTimestamp = useCallback(() => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      setResult('请输入有效的日期')
      return
    }
    setResult(Math.floor(date.getTime() / 1000).toString())
  }, [dateStr])

  const updateNow = useCallback(() => {
    setNow(Date.now())
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>当前时间</span>
          <button onClick={updateNow} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', cursor: 'pointer', fontSize: 11 }}>
            <RefreshCw size={12} /> 刷新
          </button>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
          {Math.floor(now / 1000)}
        </div>
        <div style={{ fontSize: 13, color: '#8080a0' }}>
          {new Date(now).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#8080a0', marginBottom: 6, fontWeight: 500 }}>时间戳 → 日期</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="Unix时间戳"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: '#e0e0f0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button onClick={toDate} style={btnStyle('#10b981')}>转换</button>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#8080a0', marginBottom: 6, fontWeight: 500 }}>日期 → 时间戳</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e0e0f0',
              fontSize: 13,
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
          <button onClick={toTimestamp} style={btnStyle('#06b6d4')}>转换</button>
        </div>
      </div>

      {result && (
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(139, 124, 240, 0.1)', border: '1px solid rgba(139, 124, 240, 0.3)' }}>
          <div style={{ fontSize: 12, color: '#8080a0', marginBottom: 6 }}>结果</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, color: '#c4b5fd', wordBreak: 'break-all' }}>{result}</div>
        </div>
      )}
    </div>
  )
}

function ColorTool() {
  const [hex, setHex] = useState('#8b7cf0')
  const [rgb, setRgb] = useState({ r: 139, g: 124, b: 240 })
  const [hsl, setHsl] = useState({ h: 248, s: 80, l: 71 })
  const [copied, setCopied] = useState<string | null>(null)

  const hexToRgb = useCallback((hexStr: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexStr)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null
  }, [])

  const rgbToHex = useCallback((r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }, [])

  const rgbToHsl = useCallback((r: number, g: number, b: number) => {
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
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }, [])

  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    h /= 360; s /= 100; l /= 100
    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }, [])

  const updateFromHex = useCallback((newHex: string) => {
    setHex(newHex)
    const newRgb = hexToRgb(newHex)
    if (newRgb) {
      setRgb(newRgb)
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b))
    }
  }, [hexToRgb, rgbToHsl])

  const updateFromRgb = useCallback((newRgb: { r: number; g: number; b: number }) => {
    setRgb(newRgb)
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b))
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b))
  }, [rgbToHex, rgbToHsl])

  const updateFromHsl = useCallback((newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl)
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l)
    setRgb(newRgb)
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b))
  }, [hslToRgb, rgbToHex])

  const copy = useCallback(async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: hex,
            boxShadow: `0 8px 24px ${hex}40`,
            border: '2px solid rgba(255,255,255,0.1)',
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#8080a0', marginBottom: 6 }}>HEX</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="color"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: '#e0e0f0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button onClick={() => copy(hex, 'hex')} style={btnStyle('#ec4899')}>
              {copied === 'hex' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: '#ef4444' }}>R</span>
          <input
            type="range" min="0" max="255" value={rgb.r}
            onChange={(e) => updateFromRgb({ ...rgb, r: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#ef4444' }}
          />
          <input
            type="number" value={rgb.r}
            onChange={(e) => updateFromRgb({ ...rgb, r: parseInt(e.target.value) || 0 })}
            style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: '#22c55e' }}>G</span>
          <input
            type="range" min="0" max="255" value={rgb.g}
            onChange={(e) => updateFromRgb({ ...rgb, g: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#22c55e' }}
          />
          <input
            type="number" value={rgb.g}
            onChange={(e) => updateFromRgb({ ...rgb, g: parseInt(e.target.value) || 0 })}
            style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>B</span>
          <input
            type="range" min="0" max="255" value={rgb.b}
            onChange={(e) => updateFromRgb({ ...rgb, b: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#3b82f6' }}
          />
          <input
            type="number" value={rgb.b}
            onChange={(e) => updateFromRgb({ ...rgb, b: parseInt(e.target.value) || 0 })}
            style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: '#8b7cf0' }}>H</span>
          <input
            type="range" min="0" max="360" value={hsl.h}
            onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#8b7cf0' }}
          />
          <input
            type="number" value={hsl.h}
            onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value) || 0 })}
            style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: '#06b6d4' }}>S</span>
          <input
            type="range" min="0" max="100" value={hsl.s}
            onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#06b6d4' }}
          />
          <input
            type="number" value={hsl.s}
            onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value) || 0 })}
            style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>L</span>
          <input
            type="range" min="0" max="100" value={hsl.l}
            onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#f59e0b' }}
          />
          <input
            type="number" value={hsl.l}
            onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value) || 0 })}
            style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(139, 124, 240, 0.1)', border: '1px solid rgba(139, 124, 240, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#8080a0', marginBottom: 4 }}>HSL</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#c4b5fd' }}>
            hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
          </div>
        </div>
        <button onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')} style={btnStyle('#6366f1')}>
          {copied === 'hsl' ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

function UuidTool() {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  const generateUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }, [])

  const generate = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => generateUUID())
    setUuids(newUuids)
  }, [count, generateUUID])

  const copy = useCallback(async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const copyAll = useCallback(async () => {
    await navigator.clipboard.writeText(uuids.join('\n'))
    setCopied(-1)
    setTimeout(() => setCopied(null), 2000)
  }, [uuids])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#a0a0c0' }}>数量:</span>
        <input
          type="number" min="1" max="50" value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          style={{ width: 70, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e0e0f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}
        />
        <button onClick={generate} style={{ ...btnStyle('#14b8a6'), marginLeft: 'auto' }}>
          <RefreshCw size={14} />
          生成
        </button>
        {uuids.length > 0 && (
          <button onClick={copyAll} style={btnStyle('#8b7cf0')}>
            {copied === -1 ? <><Check size={14} />已复制全部</> : <><Copy size={14} />复制全部</>}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {uuids.map((uuid, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
            }}
          >
            <span style={{ color: '#606080', fontSize: 11, minWidth: 20 }}>{i + 1}</span>
            <span style={{ flex: 1, color: '#5eead4' }}>{uuid}</span>
            <button
              onClick={() => copy(uuid, i)}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(20, 184, 166, 0.3)',
                background: 'rgba(20, 184, 166, 0.1)',
                color: '#5eead4',
                cursor: 'pointer',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {copied === i ? <><Check size={12} />已复制</> : <><Copy size={12} />复制</>}
            </button>
          </div>
        ))}
        {uuids.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#606080', fontSize: 13 }}>
          点击"生成"按钮生成UUID
        </div>
        )}
      </div>
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${color}50`,
    background: `${color}15`,
    color: color,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  }
}

export default function DevForge() {
  const [activeTool, setActiveTool] = useState('json')

  const activeToolData = TOOLS.find(t => t.id === activeTool) || TOOLS[0]

  const renderTool = () => {
    switch (activeTool) {
      case 'json': return <JsonTool />
      case 'base64': return <Base64Tool />
      case 'hash': return <HashTool />
      case 'timestamp': return <TimestampTool />
      case 'color': return <ColorTool />
      case 'uuid': return <UuidTool />
      default: return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#606080' }}>
          选择左侧工具开始使用
        </div>
      )
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a14 100%)' }}>
      {/* Sidebar */}
      <div style={{
        width: 180,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 0.5, padding: '8px 4px', }}>
          开发工具
        </div>
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeTool === tool.id ? `${tool.color}15` : 'transparent',
              color: activeTool === tool.id ? tool.color : '#a0a0c0',
              cursor: 'pointer',
              fontSize: 13,
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
              borderLeft: activeTool === tool.id ? `3px solid ${tool.color}` : '3px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== tool.id) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== tool.id) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {tool.icon}
            <span style={{ fontWeight: 500 }}>{tool.name}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${activeToolData.color} 0%, ${activeToolData.color}88 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            {activeToolData.icon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f0f0ff' }}>{activeToolData.name}</div>
            <div style={{ fontSize: 12, color: '#8080a0' }}>{activeToolData.description}</div>
          </div>
        </div>

        {/* Tool content */}
        <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          {renderTool()}
        </div>
      </div>
    </div>
  )
}
