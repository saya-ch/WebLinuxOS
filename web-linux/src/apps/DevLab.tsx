import { useState, useCallback, useMemo } from 'react'
import {
  Code, Palette, Hash, Globe, Lock,
  Clock, Calculator, FileJson, QrCode,
  ChevronRight, Copy, Check, RefreshCw,
  Sparkles, Zap, Settings, Layers
} from 'lucide-react'

type ToolId =
  | 'json-formatter'
  | 'base64'
  | 'hash'
  | 'uuid'
  | 'password'
  | 'color-picker'
  | 'qr-code'
  | 'timestamp'
  | 'url-encode'
  | 'json-yaml'
  | 'regex-tester'
  | 'unit-converter'

interface Tool {
  id: ToolId
  name: string
  description: string
  icon: React.ReactNode
  category: string
}

const TOOLS: Tool[] = [
  { id: 'json-formatter', name: 'JSON 格式化', description: '格式化、压缩、验证 JSON 数据', icon: <FileJson size={20} />, category: '数据处理' },
  { id: 'base64', name: 'Base64 编解码', description: 'Base64 编码和解码工具', icon: <Hash size={20} />, category: '编码转换' },
  { id: 'hash', name: '哈希生成', description: 'MD5、SHA-1、SHA-256 等哈希算法', icon: <Lock size={20} />, category: '安全工具' },
  { id: 'uuid', name: 'UUID 生成器', description: '生成 UUID v1/v4/v7', icon: <Globe size={20} />, category: '开发工具' },
  { id: 'password', name: '密码生成器', description: '生成安全的随机密码', icon: <Lock size={20} />, category: '安全工具' },
  { id: 'color-picker', name: '颜色工具', description: '颜色选择器和格式转换', icon: <Palette size={20} />, category: '设计工具' },
  { id: 'qr-code', name: '二维码生成', description: '生成自定义二维码', icon: <QrCode size={20} />, category: '实用工具' },
  { id: 'timestamp', name: '时间戳转换', description: 'Unix 时间戳与日期互转', icon: <Clock size={20} />, category: '开发工具' },
  { id: 'url-encode', name: 'URL 编解码', description: 'URL 编码和解码工具', icon: <Globe size={20} />, category: '编码转换' },
  { id: 'json-yaml', name: 'JSON/YAML 转换', description: 'JSON 与 YAML 格式互转', icon: <Layers size={20} />, category: '数据处理' },
  { id: 'regex-tester', name: '正则测试器', description: '实时测试正则表达式', icon: <Code size={20} />, category: '开发工具' },
  { id: 'unit-converter', name: '单位转换器', description: '各种单位的换算工具', icon: <Calculator size={20} />, category: '实用工具' },
]

function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)
  
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])
  
  return { copied, copy }
}

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard()
  
  return (
    <button
      onClick={() => copy(text)}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--accent-bg)'
        e.currentTarget.style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--glass-bg)'
        e.currentTarget.style.borderColor = 'var(--glass-border)'
      }}
    >
      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

function JsonFormatter() {
  const [input, setInput] = useState('{\n  "name": "WebLinuxOS",\n  "version": "1.0.0",\n  "features": ["desktop", "terminal", "apps"]\n}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input, indent])

  const minify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input])

  const validate = useCallback(() => {
    try {
      JSON.parse(input)
      setError('')
      setOutput('✅ JSON 格式有效')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={format} style={buttonStyle}>格式化</button>
        <button onClick={minify} style={buttonStyle}>压缩</button>
        <button onClick={validate} style={buttonStyle}>验证</button>
        <select
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          style={{ ...buttonStyle, width: 'auto' }}
        >
          <option value={2}>2 空格</option>
          <option value={4}>4 空格</option>
          <option value={8}>Tab</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>输入</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 JSON..."
            style={textareaStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>输出</label>
            {output && !error && <CopyButton text={output} />}
          </div>
          <textarea value={output} readOnly style={textareaStyle} placeholder="结果将显示在这里..." />
        </div>
      </div>
      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '13px',
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch (e) {
      setOutput('错误: ' + (e as Error).message)
    }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setMode('encode')}
          style={{ ...buttonStyle, background: mode === 'encode' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'encode' ? 'var(--accent)' : 'var(--glass-border)' }}
        >
          编码
        </button>
        <button
          onClick={() => setMode('decode')}
          style={{ ...buttonStyle, background: mode === 'decode' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'decode' ? 'var(--accent)' : 'var(--glass-border)' }}
        >
          解码
        </button>
        <button onClick={process} style={{ ...buttonStyle, marginLeft: 'auto' }}>
          <RefreshCw size={14} />
          转换
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {mode === 'encode' ? '明文' : 'Base64'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
            style={textareaStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {mode === 'encode' ? 'Base64' : '明文'}
            </label>
            {output && <CopyButton text={output} />}
          </div>
          <textarea value={output} readOnly style={textareaStyle} placeholder="结果将显示在这里..." />
        </div>
      </div>
    </div>
  )
}

function HashGenerator() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [hashes, setHashes] = useState<Record<string, string>>({})

  const generateHashes = useCallback(async () => {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    
    const results: Record<string, string> = {}
    
    try {
      const sha1Buffer = await crypto.subtle.digest('SHA-1', data)
      results['SHA-1'] = bufferToHex(sha1Buffer)
    } catch {}
    
    try {
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data)
      results['SHA-256'] = bufferToHex(sha256Buffer)
    } catch {}
    
    try {
      const sha384Buffer = await crypto.subtle.digest('SHA-384', data)
      results['SHA-384'] = bufferToHex(sha384Buffer)
    } catch {}
    
    try {
      const sha512Buffer = await crypto.subtle.digest('SHA-512', data)
      results['SHA-512'] = bufferToHex(sha512Buffer)
    } catch {}
    
    results['MD5 (简易)'] = simpleMD5(input)
    
    setHashes(results)
  }, [input])

  function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  function simpleMD5(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).slice(0, 32)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={generateHashes} style={{ ...buttonStyle, marginLeft: 'auto' }}>
          <RefreshCw size={14} />
          生成哈希
        </button>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入要哈希的文本..."
        style={{ ...textareaStyle, height: '100px', flex: 'none' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.entries(hashes).map(([name, value]) => (
          <div key={name} style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
              <CopyButton text={value} />
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
              padding: '8px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '6px',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const [version, setVersion] = useState<'v4' | 'v1'>('v4')

  const generateUUIDs = useCallback(() => {
    const newUuids: string[] = []
    for (let i = 0; i < count; i++) {
      if (version === 'v4') {
        newUuids.push(crypto.randomUUID())
      } else {
        newUuids.push(generateUUIDv1())
      }
    }
    setUuids(newUuids)
  }, [count, version])

  function generateUUIDv1(): string {
    const timestamp = Date.now()
    const clockSeq = Math.random().toString(16).slice(2, 6)
    const node = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('')
    
    const timeLow = timestamp.toString(16).padStart(8, '0').slice(-8)
    const timeMid = (timestamp >> 32).toString(16).padStart(4, '0').slice(-4)
    const timeHiAndVersion = ((timestamp >> 48) & 0x0fff | 0x1000).toString(16)
    
    return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={version}
          onChange={(e) => setVersion(e.target.value as 'v4' | 'v1')}
          style={{ ...buttonStyle, width: 'auto' }}
        >
          <option value="v4">UUID v4 (随机)</option>
          <option value="v1">UUID v1 (时间戳)</option>
        </select>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
          style={{ ...buttonStyle, width: '80px' }}
        />
        <button onClick={generateUUIDs} style={{ ...buttonStyle, marginLeft: 'auto' }}>
          <RefreshCw size={14} />
          生成
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {uuids.map((uuid, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            <span style={{ color: 'var(--text-secondary)', minWidth: '24px' }}>{i + 1}.</span>
            <span style={{ flex: 1, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{uuid}</span>
            <CopyButton text={uuid} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })

  const generate = useCallback(() => {
    let chars = ''
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (options.numbers) chars += '0123456789'
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
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
  }, [length, options])

  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  const strengthLabel = ['极弱', '弱', '中等', '强', '很强', '极强']
  const strengthColor = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        borderRadius: '12px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '2px',
          color: 'var(--text-primary)',
          wordBreak: 'break-all',
          marginBottom: '12px',
          minHeight: '32px',
        }}>
          {password || '点击生成按钮'}
        </div>
        {password && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '6px',
              borderRadius: '3px',
              background: strength >= 1 ? strengthColor[Math.min(strength, 5)] : 'var(--window-border)',
            }} />
            <div style={{
              width: '40px',
              height: '6px',
              borderRadius: '3px',
              background: strength >= 2 ? strengthColor[Math.min(strength, 5)] : 'var(--window-border)',
            }} />
            <div style={{
              width: '40px',
              height: '6px',
              borderRadius: '3px',
              background: strength >= 3 ? strengthColor[Math.min(strength, 5)] : 'var(--window-border)',
            }} />
            <div style={{
              width: '40px',
              height: '6px',
              borderRadius: '3px',
              background: strength >= 5 ? strengthColor[Math.min(strength, 5)] : 'var(--window-border)',
            }} />
            <span style={{
              fontSize: '12px',
              color: strengthColor[Math.min(strength, 5)],
              marginLeft: '8px',
              alignSelf: 'center',
            }}>
              {strengthLabel[Math.min(strength, 5)]}
            </span>
          </div>
        )}
        <button onClick={generate} style={{
          ...buttonStyle,
          background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
          color: '#fff',
          border: 'none',
          padding: '10px 24px',
        }}>
          <Zap size={16} />
          生成密码
        </button>
      </div>

      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
          设置
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>长度: {length}</span>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(options).map(([key, value]) => (
            <label key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: value ? 'var(--accent-bg)' : 'transparent',
              border: `1px solid ${value ? 'var(--accent)' : 'var(--glass-border)'}`,
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}>
              <input
                type="checkbox"
                checked={value}
                onChange={() => setOptions(o => ({ ...o, [key]: !o[key as keyof typeof o] }))}
                style={{ accentColor: 'var(--accent)' }}
              />
              {key === 'uppercase' ? '大写字母' :
               key === 'lowercase' ? '小写字母' :
               key === 'numbers' ? '数字' : '特殊符号'}
            </label>
          ))}
        </div>
      </div>

      {password && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CopyButton text={password} />
        </div>
      )}
    </div>
  )
}

function ColorTool() {
  const [color, setColor] = useState('#8b5cf6')
  const [history, setHistory] = useState<string[]>(['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'])

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
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
  }

  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  const generateShades = () => {
    const shades: { name: string; color: string }[] = []
    const lightnesses = [97, 95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5]
    lightnesses.forEach(l => {
      shades.push({
        name: `${l * 10}`,
        color: `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`,
      })
    })
    return shades
  }

  const addToHistory = (c: string) => {
    setHistory(prev => [c, ...prev.filter(h => h !== c)].slice(0, 10))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input
          type="color"
          value={color}
          onChange={(e) => { setColor(e.target.value); addToHistory(e.target.value) }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            border: '2px solid var(--glass-border)',
            cursor: 'pointer',
            background: 'none',
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={color}
              onChange={(e) => { setColor(e.target.value); addToHistory(e.target.value) }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            />
            <CopyButton text={color} />
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>RGB: {rgb.r}, {rgb.g}, {rgb.b}</span>
            <span>HSL: {hsl.h}°, {hsl.s}%, {hsl.l}%</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
          色阶
        </div>
        <div style={{ display: 'flex', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          {generateShades().map(shade => (
            <div
              key={shade.name}
              onClick={() => { setColor(shade.color); addToHistory(shade.color) }}
              style={{
                flex: 1,
                background: shade.color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px',
                fontSize: '10px',
                color: hsl.l > 50 ? '#000' : '#fff',
                fontWeight: 500,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scaleY(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scaleY(1)' }}
            >
              {shade.name}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
          历史记录
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {history.map((h, i) => (
            <div
              key={i}
              onClick={() => setColor(h)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: h,
                cursor: 'pointer',
                border: '2px solid var(--glass-border)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              title={h}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TimestampConverter() {
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString())
  const [dateStr, setDateStr] = useState('')
  const [mode, setMode] = useState<'ts-to-date' | 'date-to-ts'>('ts-to-date')

  const convertTsToDate = useCallback(() => {
    const ts = Number(timestamp)
    if (isNaN(ts)) {
      setDateStr('无效的时间戳')
      return
    }
    const date = new Date(ts * 1000)
    const formatted = date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short',
    })
    setDateStr(formatted)
  }, [timestamp])

  const convertDateToTs = useCallback(() => {
    if (!dateStr) {
      setTimestamp('')
      return
    }
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      setTimestamp('无效日期')
      return
    }
    setTimestamp(Math.floor(date.getTime() / 1000).toString())
  }, [dateStr])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setMode('ts-to-date')}
          style={{ ...buttonStyle, background: mode === 'ts-to-date' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'ts-to-date' ? 'var(--accent)' : 'var(--glass-border)' }}
        >
          时间戳 → 日期
        </button>
        <button
          onClick={() => setMode('date-to-ts')}
          style={{ ...buttonStyle, background: mode === 'date-to-ts' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'date-to-ts' ? 'var(--accent)' : 'var(--glass-border)' }}
        >
          日期 → 时间戳
        </button>
      </div>

      {mode === 'ts-to-date' ? (
        <>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Unix 时间戳 (秒)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                style={{ ...buttonStyle, flex: 1, fontFamily: 'monospace' }}
              />
              <button onClick={() => setTimestamp(Math.floor(Date.now() / 1000).toString())} style={buttonStyle}>
                现在
              </button>
              <button onClick={convertTsToDate} style={buttonStyle}>
                转换
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              日期时间
            </label>
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'var(--text-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {dateStr || '点击转换按钮'}
              {dateStr && <CopyButton text={dateStr} />}
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              日期时间 (YYYY-MM-DD HH:mm:ss)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="2024-01-01 12:00:00"
                style={{ ...buttonStyle, flex: 1 }}
              />
              <button onClick={() => setDateStr(new Date().toLocaleString('zh-CN').replace(/\//g, '-'))} style={buttonStyle}>
                现在
              </button>
              <button onClick={convertDateToTs} style={buttonStyle}>
                转换
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Unix 时间戳 (秒)
            </label>
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {timestamp}
              {timestamp && <CopyButton text={timestamp} />}
            </div>
          </div>
        </>
      )}

      <div style={{
        padding: '14px',
        borderRadius: '10px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
          快捷时间戳
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: '今天开始', ts: () => Math.floor(new Date().setHours(0, 0, 0, 0) / 1000) },
            { label: '今天结束', ts: () => Math.floor(new Date().setHours(23, 59, 59, 999) / 1000) },
            { label: '本周开始', ts: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return Math.floor(d.setHours(0, 0, 0, 0) / 1000) } },
            { label: '本月开始', ts: () => Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000) },
            { label: '本年开始', ts: () => Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000) },
            { label: '一小时后', ts: () => Math.floor((Date.now() + 3600000) / 1000) },
          ].map(({ label, ts }) => (
            <button
              key={label}
              onClick={() => { setTimestamp(ts().toString()); convertTsToDate() }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-bg)'
                e.currentTarget.style.borderColor = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
              }}
            >
              <div style={{ fontWeight: 500 }}>{label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {ts()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s ease',
}

const textareaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: '200px',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontFamily: 'monospace',
  fontSize: '13px',
  lineHeight: 1.6,
  resize: 'none',
  outline: 'none',
}

const toolComponents: Record<ToolId, React.FC> = {
  'json-formatter': JsonFormatter,
  'base64': Base64Tool,
  'hash': HashGenerator,
  'uuid': UuidGenerator,
  'password': PasswordGenerator,
  'color-picker': ColorTool,
  'qr-code': () => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>二维码生成器 - 开发中...</div>,
  'timestamp': TimestampConverter,
  'url-encode': () => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>URL 编解码 - 开发中...</div>,
  'json-yaml': () => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>JSON/YAML 转换 - 开发中...</div>,
  'regex-tester': () => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>正则测试器 - 开发中...</div>,
  'unit-converter': () => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>单位转换器 - 开发中...</div>,
}

export default function DevLab() {
  const [selectedTool, setSelectedTool] = useState<ToolId>('json-formatter')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = useMemo(() => {
    if (!searchQuery) return TOOLS
    const q = searchQuery.toLowerCase()
    return TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const categories = useMemo(() => {
    const cats = new Set(TOOLS.map(t => t.category))
    return Array.from(cats)
  }, [])

  const CurrentTool = toolComponents[selectedTool]
  const currentToolInfo = TOOLS.find(t => t.id === selectedTool)

  return (
    <div style={{ display: 'flex', height: '100%', color: 'var(--text-primary)' }}>
      <style>{`
        .devlab-scroll::-webkit-scrollbar { width: 6px; }
        .devlab-scroll::-webkit-scrollbar-track { background: transparent; }
        .devlab-scroll::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
      `}</style>

      {/* 侧边栏 */}
      <div style={{
        width: '260px',
        borderRight: '1px solid var(--window-border)',
        background: 'var(--glass-bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>DevLab</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>开发者工具箱</div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <Settings size={14} style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }} />
          </div>
        </div>

        <div className="devlab-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {categories.map(category => {
            const categoryTools = filteredTools.filter(t => t.category === category)
            if (categoryTools.length === 0) return null
            return (
              <div key={category} style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '8px 10px 4px',
                }}>
                  {category}
                </div>
                {categoryTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedTool === tool.id ? 'var(--accent-bg)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      transition: 'all 0.15s',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTool !== tool.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTool !== tool.id) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <span style={{
                      color: selectedTool === tool.id ? 'var(--accent)' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}>
                      {tool.icon}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tool.name}
                    </span>
                    <ChevronRight size={14} style={{
                      color: selectedTool === tool.id ? 'var(--accent)' : 'var(--text-secondary)',
                      opacity: selectedTool === tool.id ? 1 : 0,
                    }} />
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 头部 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--window-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            {currentToolInfo?.icon}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{currentToolInfo?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentToolInfo?.description}</div>
          </div>
        </div>

        {/* 工具内容 */}
        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }} className="devlab-scroll">
          <CurrentTool />
        </div>
      </div>
    </div>
  )
}
