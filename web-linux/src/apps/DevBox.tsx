import { useState, useEffect, useCallback } from 'react'

type ToolCategory = 'encode' | 'format' | 'generate' | 'convert' | 'analyze'

interface Tool {
  id: string
  name: string
  icon: string
  category: ToolCategory
  description: string
}

const TOOLS: Tool[] = [
  { id: 'base64', name: 'Base64 编解码', icon: '🔐', category: 'encode', description: '编码/解码 Base64 字符串' },
  { id: 'url', name: 'URL 编解码', icon: '🔗', category: 'encode', description: 'URL encode/decode' },
  { id: 'json', name: 'JSON 格式化', icon: '📋', category: 'format', description: '格式化/压缩/校验 JSON' },
  { id: 'hash', name: '哈希生成', icon: '#️⃣', category: 'generate', description: 'MD5/SHA 哈希计算' },
  { id: 'uuid', name: 'UUID 生成', icon: '🆔', category: 'generate', description: '生成 UUID v4' },
  { id: 'password', name: '密码生成', icon: '🔑', category: 'generate', description: '强密码生成器' },
  { id: 'timestamp', name: '时间戳转换', icon: '⏰', category: 'convert', description: 'Unix 时间戳互转' },
  { id: 'color', name: '颜色转换', icon: '🎨', category: 'convert', description: 'HEX/RGB/HSL 互转' },
  { id: 'regex', name: '正则测试', icon: '🔍', category: 'analyze', description: '实时正则匹配测试' },
  { id: 'jwt', name: 'JWT 解析', icon: '🪪', category: 'analyze', description: 'JWT Token 解码' },
  { id: 'user-agent', name: 'UA 解析', icon: '🌐', category: 'analyze', description: 'User Agent 解析' },
  { id: 'cron', name: 'Cron 表达式', icon: '📅', category: 'generate', description: 'Cron 表达式生成与解释' },
]

const CATEGORIES: { id: ToolCategory | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: '全部', icon: '📦' },
  { id: 'encode', name: '编解码', icon: '🔐' },
  { id: 'format', name: '格式化', icon: '📋' },
  { id: 'generate', name: '生成器', icon: '🎲' },
  { id: 'convert', name: '转换器', icon: '🔄' },
  { id: 'analyze', name: '分析器', icon: '🔍' },
]

function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const process = useCallback(() => {
    setError('')
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch {
      setError('无效的 Base64 字符串')
      setOutput('')
    }
  }, [input, mode])

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <h3>Base64 编解码</h3>
        <div className="mode-switch">
          <button onClick={() => setMode('encode')} className={mode === 'encode' ? 'active' : ''}>编码</button>
          <button onClick={() => setMode('decode')} className={mode === 'decode' ? 'active' : ''}>解码</button>
        </div>
      </div>
      <textarea
        placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onInput={process}
        rows={5}
      />
      {error && <div className="error-msg">{error}</div>}
      <textarea
        placeholder="结果..."
        value={output}
        readOnly
        rows={5}
      />
      <div className="tool-actions">
        <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>📋 复制</button>
        <button onClick={() => { setInput(''); setOutput(''); setError('') }}>🗑️ 清空</button>
      </div>
    </div>
  )
}

function URLTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = useCallback(() => {
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input))
    } catch {
      setOutput('解码失败')
    }
  }, [input, mode])

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <h3>URL 编解码</h3>
        <div className="mode-switch">
          <button onClick={() => setMode('encode')} className={mode === 'encode' ? 'active' : ''}>编码</button>
          <button onClick={() => setMode('decode')} className={mode === 'decode' ? 'active' : ''}>解码</button>
        </div>
      </div>
      <textarea placeholder="输入文本或 URL..." value={input} onChange={(e) => setInput(e.target.value)} onInput={process} rows={5} />
      <textarea placeholder="结果..." value={output} readOnly rows={5} />
      <div className="tool-actions">
        <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>📋 复制</button>
        <button onClick={() => { setInput(''); setOutput('') }}>🗑️ 清空</button>
      </div>
    </div>
  )
}

function JSONTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'format' | 'minify' | 'validate'>('format')
  const [error, setError] = useState('')

  const process = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      const parsed = JSON.parse(input)
      if (mode === 'format') setOutput(JSON.stringify(parsed, null, 2))
      else if (mode === 'minify') setOutput(JSON.stringify(parsed))
      else setOutput('✓ 有效的 JSON')
    } catch (e) {
      setError('无效的 JSON: ' + (e as Error).message)
      setOutput('')
    }
  }, [input, mode])

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <h3>JSON 工具箱</h3>
        <div className="mode-switch">
          <button onClick={() => setMode('format')} className={mode === 'format' ? 'active' : ''}>格式化</button>
          <button onClick={() => setMode('minify')} className={mode === 'minify' ? 'active' : ''}>压缩</button>
          <button onClick={() => setMode('validate')} className={mode === 'validate' ? 'active' : ''}>验证</button>
        </div>
      </div>
      <textarea placeholder="输入 JSON..." value={input} onChange={(e) => setInput(e.target.value)} onInput={process} rows={6} />
      {error && <div className="error-msg">{error}</div>}
      <textarea placeholder="结果..." value={output} readOnly rows={6} />
      <div className="tool-actions">
        <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>📋 复制</button>
        <button onClick={() => { setInput(''); setOutput(''); setError('') }}>🗑️ 清空</button>
        <button onClick={() => {
          try {
            const parsed = JSON.parse(input)
            setInput(JSON.stringify(parsed, null, 2))
          } catch { /* ignore */ }
        }}>⚡ 美化输入</button>
      </div>
    </div>
  )
}

function HashTool() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})

  const generate = useCallback(async () => {
    if (!input) { setResults({}); return }
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashes: Record<string, string> = {}
    try {
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data)
      hashes['SHA-256'] = Array.from(new Uint8Array(sha256Buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch { hashes['SHA-256'] = '错误' }
    try {
      const sha384Buffer = await crypto.subtle.digest('SHA-384', data)
      hashes['SHA-384'] = Array.from(new Uint8Array(sha384Buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch { hashes['SHA-384'] = '错误' }
    try {
      const sha512Buffer = await crypto.subtle.digest('SHA-512', data)
      hashes['SHA-512'] = Array.from(new Uint8Array(sha512Buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch { hashes['SHA-512'] = '错误' }
    setResults(hashes)
  }, [input])

  useEffect(() => { generate() }, [input, generate])

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>哈希生成器</h3></div>
      <textarea placeholder="输入文本..." value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      <div className="hash-results">
        {Object.entries(results).map(([algo, hash]) => (
          <div key={algo} className="hash-item">
            <span className="hash-label">{algo}</span>
            <code className="hash-value">{hash}</code>
            <button onClick={() => navigator.clipboard.writeText(hash)}>📋</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function UUIDTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)

  const generate = useCallback(() => {
    const newUuids: string[] = []
    for (let i = 0; i < count; i++) {
      newUuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      }))
    }
    setUuids(newUuids)
  }, [count])

  useEffect(() => { generate() }, [generate])

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <h3>UUID 生成器</h3>
        <div className="tool-controls">
          <label>数量:
            <input type="number" min="1" max="100" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 5)} />
          </label>
          <button onClick={generate}>🔄 重新生成</button>
        </div>
      </div>
      <div className="uuid-list">
        {uuids.map((uuid, i) => (
          <div key={i} className="uuid-item">
            <code>{uuid}</code>
            <button onClick={() => navigator.clipboard.writeText(uuid)}>📋</button>
          </div>
        ))}
      </div>
      <button className="batch-copy" onClick={() => navigator.clipboard.writeText(uuids.join('\n'))}>
        📋 批量复制全部
      </button>
    </div>
  )
}

function PasswordTool() {
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: true })
  const [password, setPassword] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const generate = useCallback(() => {
    const chars = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }
    let pool = ''
    if (options.upper) pool += chars.upper
    if (options.lower) pool += chars.lower
    if (options.numbers) pool += chars.numbers
    if (options.symbols) pool += chars.symbols
    if (!pool) { setPassword('请至少选择一种字符类型'); return }
    let pwd = ''
    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    for (let i = 0; i < length; i++) {
      pwd += pool[arr[i] % pool.length]
    }
    setPassword(pwd)
    setHistory(prev => [pwd, ...prev].slice(0, 10))
  }, [length, options])

  useEffect(() => { generate() }, [generate])

  const getStrength = (pwd: string): { label: string; color: string } => {
    if (!pwd) return { label: '-', color: '#666' }
    let score = 0
    if (pwd.length >= 12) score++
    if (pwd.length >= 16) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    const levels = [
      { label: '极弱', color: '#ef4444' },
      { label: '弱', color: '#f97316' },
      { label: '一般', color: '#eab308' },
      { label: '强', color: '#22c55e' },
      { label: '很强', color: '#10b981' },
      { label: '极强', color: '#059669' },
    ]
    return levels[Math.min(score, levels.length - 1)]
  }

  const strength = getStrength(password)

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>密码生成器</h3></div>
      <div className="password-controls">
        <div className="control-row">
          <label>长度: {length}</label>
          <input type="range" min="4" max="64" value={length} onChange={(e) => setLength(parseInt(e.target.value))} />
        </div>
        <div className="control-row checkbox-row">
          <label><input type="checkbox" checked={options.upper} onChange={(e) => setOptions({...options, upper: e.target.checked})} /> 大写字母</label>
          <label><input type="checkbox" checked={options.lower} onChange={(e) => setOptions({...options, lower: e.target.checked})} /> 小写字母</label>
          <label><input type="checkbox" checked={options.numbers} onChange={(e) => setOptions({...options, numbers: e.target.checked})} /> 数字</label>
          <label><input type="checkbox" checked={options.symbols} onChange={(e) => setOptions({...options, symbols: e.target.checked})} /> 符号</label>
        </div>
      </div>
      <div className="password-display">
        <code>{password}</code>
        <span className="strength-badge" style={{background: strength.color}}>{strength.label}</span>
      </div>
      <div className="tool-actions">
        <button onClick={generate}>🔄 生成新密码</button>
        <button onClick={() => navigator.clipboard.writeText(password)} disabled={!password}>📋 复制</button>
      </div>
      {history.length > 0 && (
        <div className="password-history">
          <h4>历史记录</h4>
          {history.map((p, i) => (
            <div key={i} className="history-item" onClick={() => navigator.clipboard.writeText(p)}>
              <code>{p}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TimestampTool() {
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)))
  const [dt, setDt] = useState(new Date().toISOString().slice(0, 19))

  useEffect(() => {
    const interval = setInterval(() => {
      setTs(String(Math.floor(Date.now() / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fromTs = () => {
    const d = new Date(parseInt(ts) * 1000)
    setDt(d.toISOString().slice(0, 19))
  }

  const fromDt = () => {
    const d = new Date(dt)
    setTs(String(Math.floor(d.getTime() / 1000)))
  }

  const now = () => {
    const d = new Date()
    setTs(String(Math.floor(d.getTime() / 1000)))
    setDt(d.toISOString().slice(0, 19))
  }

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>时间戳转换</h3></div>
      <div className="timestamp-grid">
        <div className="ts-item">
          <label>Unix 时间戳</label>
          <input type="number" value={ts} onChange={(e) => setTs(e.target.value)} onBlur={fromTs} />
        </div>
        <div className="ts-item">
          <label>日期时间 (UTC)</label>
          <input type="datetime-local" step="1" value={dt} onChange={(e) => setDt(e.target.value)} onBlur={fromDt} />
        </div>
      </div>
      <div className="timestamp-info">
        <div>毫秒时间戳: <code>{parseInt(ts) * 1000}</code></div>
        <div>ISO 格式: <code>{new Date(parseInt(ts) * 1000).toISOString()}</code></div>
        <div>本地时间: <code>{new Date(parseInt(ts) * 1000).toLocaleString('zh-CN')}</code></div>
      </div>
      <div className="tool-actions">
        <button onClick={now}>⏱️ 当前时间</button>
        <button onClick={() => navigator.clipboard.writeText(ts)}>📋 复制时间戳</button>
      </div>
    </div>
  )
}

function ColorTool() {
  const [hex, setHex] = useState('#7c6cf0')

  const hexToRgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
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
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>颜色转换器</h3></div>
      <div className="color-tool">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="color-picker" />
        <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} className="hex-input" />
      </div>
      <div className="color-info">
        <div>HEX: <code>{hex.toUpperCase()}</code></div>
        <div>RGB: <code>rgb({rgb.r}, {rgb.g}, {rgb.b})</code></div>
        <div>HSL: <code>hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</code></div>
      </div>
      <div className="color-preview" style={{background: hex}}>预览</div>
      <div className="tool-actions">
        <button onClick={() => navigator.clipboard.writeText(hex.toUpperCase())}>📋 HEX</button>
        <button onClick={() => navigator.clipboard.writeText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>📋 RGB</button>
        <button onClick={() => navigator.clipboard.writeText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>📋 HSL</button>
      </div>
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('Hello World! Email: test@example.com Phone: 123-456-7890')
  const [matches, setMatches] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    setMatches([])
    if (!pattern || !testText) return
    try {
      const regex = new RegExp(pattern, flags)
      const found: string[] = []
      let match
      if (flags.includes('g')) {
        while ((match = regex.exec(testText)) !== null) {
          found.push(match[0])
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        match = regex.exec(testText)
        if (match) found.push(match[0])
      }
      setMatches(found)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [pattern, flags, testText])

  const presets = [
    { name: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
    { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=-]*)?' },
    { name: '手机号', pattern: '1[3-9]\\d{9}' },
    { name: '日期', pattern: '\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}' },
    { name: 'IP地址', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
  ]

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>正则测试器</h3></div>
      <div className="regex-controls">
        <input type="text" placeholder="正则表达式" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <input type="text" placeholder="flags" value={flags} onChange={(e) => setFlags(e.target.value)} className="flags-input" />
      </div>
      <textarea placeholder="测试文本..." value={testText} onChange={(e) => setTestText(e.target.value)} rows={4} />
      {error && <div className="error-msg">{error}</div>}
      <div className="presets">
        <span>预设:</span>
        {presets.map(p => (
          <button key={p.name} onClick={() => { setPattern(p.pattern); setFlags('g') }}>{p.name}</button>
        ))}
      </div>
      <div className="matches">
        <h4>匹配结果 ({matches.length}):</h4>
        <div className="match-list">
          {matches.map((m, i) => <span key={i} className="match-item">{m}</span>)}
          {matches.length === 0 && <span className="no-match">无匹配</span>}
        </div>
      </div>
    </div>
  )
}

function JWTTool() {
  const [token, setToken] = useState('')
  const [decoded, setDecoded] = useState<{ header?: any; payload?: any; error?: string }>({})

  const decode = useCallback(() => {
    if (!token.trim()) { setDecoded({}); return }
    try {
      const parts = token.split('.')
      if (parts.length !== 3) { setDecoded({ error: '无效的 JWT 格式' }); return }
      const decodePart = (s: string) => {
        try {
          const padded = s + '='.repeat((4 - s.length % 4) % 4)
          return JSON.parse(decodeURIComponent(escape(atob(padded))))
        } catch { return null }
      }
      setDecoded({
        header: decodePart(parts[0]),
        payload: decodePart(parts[1]),
      })
    } catch (e) {
      setDecoded({ error: (e as Error).message })
    }
  }, [token])

  useEffect(() => { decode() }, [token, decode])

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>JWT 解析器</h3></div>
      <textarea placeholder="粘贴 JWT Token..." value={token} onChange={(e) => setToken(e.target.value)} onBlur={decode} rows={4} />
      {decoded.error && <div className="error-msg">{decoded.error}</div>}
      {decoded.header && (
        <div className="jwt-output">
          <div className="jwt-section">
            <h4>Header</h4>
            <pre>{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>
          <div className="jwt-section">
            <h4>Payload</h4>
            <pre>{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function UATool() {
  const [ua, setUa] = useState(navigator.userAgent)
  const [parsed, setParsed] = useState<Record<string, string>>({})

  const analyze = useCallback(() => {
    const result: Record<string, string> = {}
    if (/Windows NT 10/.test(ua)) result['操作系统'] = 'Windows 10/11'
    else if (/Windows NT 6\.3/.test(ua)) result['操作系统'] = 'Windows 8.1'
    else if (/Windows NT 6\.1/.test(ua)) result['操作系统'] = 'Windows 7'
    else if (/Mac OS X ([\d_]+)/.test(ua)) result['操作系统'] = 'macOS ' + (RegExp.$1.replace(/_/g, '.'))
    else if (/Android ([\d.]+)/.test(ua)) result['操作系统'] = 'Android ' + RegExp.$1
    else if (/iPhone OS ([\d_]+)/.test(ua)) result['操作系统'] = 'iOS ' + RegExp.$1.replace(/_/g, '.')
    else if (/Linux/.test(ua)) result['操作系统'] = 'Linux'
    else result['操作系统'] = '未知'

    if (/Chrome\/([\d.]+)/.test(ua)) result['浏览器'] = 'Chrome ' + RegExp.$1
    else if (/Firefox\/([\d.]+)/.test(ua)) result['浏览器'] = 'Firefox ' + RegExp.$1
    else if (/Safari\/([\d.]+)/.test(ua)) result['浏览器'] = 'Safari ' + RegExp.$1
    else if (/Edg\/([\d.]+)/.test(ua)) result['浏览器'] = 'Edge ' + RegExp.$1

    if (/Mobile/.test(ua)) result['设备类型'] = '移动设备'
    else if (/Tablet/.test(ua)) result['设备类型'] = '平板设备'
    else result['设备类型'] = '桌面设备'

    setParsed(result)
  }, [ua])

  useEffect(() => { analyze() }, [ua, analyze])

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>User Agent 解析</h3></div>
      <textarea placeholder="User Agent 字符串..." value={ua} onChange={(e) => setUa(e.target.value)} rows={3} />
      <div className="ua-result">
        {Object.entries(parsed).map(([k, v]) => (
          <div key={k} className="ua-item">
            <span className="ua-key">{k}</span>
            <span className="ua-value">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CronTool() {
  const [expression, setExpression] = useState('* * * * *')
  const [description, setDescription] = useState('')
  const [nextRuns, setNextRuns] = useState<Date[]>([])

  const parse = useCallback(() => {
    const parts = expression.trim().split(/\s+/)
    if (parts.length !== 5) { setDescription('Cron 表达式应由 5 个字段组成: 分 时 日 月 周'); setNextRuns([]); return }
    const [min, hour, day, month, weekday] = parts
    const descParts: string[] = []
    if (min === '*') descParts.push('每分钟')
    else descParts.push(`${min} 分`)
    if (hour === '*') descParts.push('每小时')
    else descParts.push(`${hour} 时`)
    if (day === '*') descParts.push('每天')
    else descParts.push(`${day} 日`)
    if (month === '*') descParts.push('每月')
    else descParts.push(`${month} 月`)
    if (weekday === '*') descParts.push('每周每天')
    else descParts.push(`周${weekday}`)
    setDescription(descParts.join(' '))
    
    const runs: Date[] = []
    const now = new Date()
    for (let i = 0; i < 50 && runs.length < 5; i++) {
      const d = new Date(now.getTime() + i * 60000)
      const m = d.getMinutes()
      const h = d.getHours()
      const da = d.getDate()
      const mo = d.getMonth() + 1
      const wd = d.getDay()
      const match = (field: string, val: number, max: number) => {
        if (field === '*') return true
        const f = parseInt(field)
        if (isNaN(f)) return true
        if (f < 0 || f >= max) return false
        return f === val
      }
      if (match(min, m, 60) && match(hour, h, 24) && match(day, da, 32) && match(month, mo, 13) && match(weekday, wd, 7)) {
        runs.push(d)
      }
    }
    setNextRuns(runs)
  }, [expression])

  useEffect(() => { parse() }, [expression, parse])

  const presets = [
    { name: '每分钟', expr: '* * * * *' },
    { name: '每5分钟', expr: '*/5 * * * *' },
    { name: '每小时', expr: '0 * * * *' },
    { name: '每天0点', expr: '0 0 * * *' },
    { name: '每周一早9', expr: '0 9 * * 1' },
  ]

  return (
    <div className="tool-panel">
      <div className="tool-header"><h3>Cron 表达式</h3></div>
      <div className="cron-input-row">
        <input type="text" value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="* * * * *" />
        <button onClick={parse}>解析</button>
      </div>
      <div className="presets">
        <span>预设:</span>
        {presets.map(p => (
          <button key={p.name} onClick={() => setExpression(p.expr)}>{p.name}</button>
        ))}
      </div>
      <div className="cron-desc">{description}</div>
      {nextRuns.length > 0 && (
        <div className="cron-next">
          <h4>接下来 5 次执行:</h4>
          {nextRuns.map((d, i) => (
            <div key={i}>{d.toLocaleString('zh-CN')}</div>
          ))}
        </div>
      )}
      <div className="cron-help">
        <h4>字段说明:</h4>
        <div>分 (0-59) | 时 (0-23) | 日 (1-31) | 月 (1-12) | 周 (0-6, 0=周日)</div>
      </div>
    </div>
  )
}

const TOOL_COMPONENTS: Record<string, React.FC> = {
  'base64': Base64Tool,
  'url': URLTool,
  'json': JSONTool,
  'hash': HashTool,
  'uuid': UUIDTool,
  'password': PasswordTool,
  'timestamp': TimestampTool,
  'color': ColorTool,
  'regex': RegexTool,
  'jwt': JWTTool,
  'user-agent': UATool,
  'cron': CronTool,
}

export default function DevBox() {
  const [activeTool, setActiveTool] = useState('base64')
  const [category, setCategory] = useState<ToolCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const filteredTools = TOOLS.filter(t => {
    const matchCat = category === 'all' || t.category === category
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const ActiveComponent = TOOL_COMPONENTS[activeTool] || Base64Tool
  const activeToolInfo = TOOLS.find(t => t.id === activeTool)

  return (
    <div className="devbox-app">
      <style>{`
        .devbox-app {
          display: flex;
          height: 100%;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #f0f0ff;
          font-family: 'Inter', -apple-system, sans-serif;
          overflow: hidden;
        }
        .devbox-sidebar {
          width: 260px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .devbox-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .devbox-header h1 {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .devbox-header p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 4px;
        }
        .devbox-search {
          padding: 12px 16px;
        }
        .devbox-search input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .devbox-search input:focus {
          border-color: #7c6cf0;
        }
        .devbox-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 16px 12px;
        }
        .devbox-categories button {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .devbox-categories button:hover {
          background: rgba(124, 108, 240, 0.2);
          color: #fff;
        }
        .devbox-categories button.active {
          background: #7c6cf0;
          border-color: #7c6cf0;
          color: #fff;
        }
        .devbox-tool-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .devbox-tool-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 4px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s;
        }
        .devbox-tool-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .devbox-tool-item.active {
          background: rgba(124, 108, 240, 0.2);
          color: #fff;
        }
        .devbox-tool-icon {
          font-size: 20px;
          width: 32px;
          text-align: center;
        }
        .devbox-tool-info {
          flex: 1;
          min-width: 0;
        }
        .devbox-tool-name {
          font-size: 13px;
          font-weight: 500;
        }
        .devbox-tool-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .devbox-main {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
        }
        .devbox-tool-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .devbox-tool-header h2 {
          font-size: 24px;
          font-weight: 600;
        }
        .devbox-tool-header .icon {
          font-size: 32px;
        }
        .tool-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }
        .tool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .tool-header h3 {
          font-size: 18px;
          font-weight: 600;
        }
        .mode-switch {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }
        .mode-switch button {
          padding: 6px 16px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-switch button.active {
          background: #7c6cf0;
          color: #fff;
        }
        .tool-panel textarea {
          width: 100%;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }
        .tool-panel textarea:focus {
          border-color: #7c6cf0;
        }
        .tool-panel textarea + textarea {
          margin-top: 12px;
        }
        .tool-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .tool-actions button {
          padding: 8px 16px;
          background: rgba(124, 108, 240, 0.2);
          border: 1px solid rgba(124, 108, 240, 0.5);
          border-radius: 8px;
          color: #f0f0ff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tool-actions button:hover {
          background: rgba(124, 108, 240, 0.4);
        }
        .tool-actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .error-msg {
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 13px;
          margin: 12px 0;
        }
        .hash-results {
          margin-top: 16px;
        }
        .hash-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .hash-label {
          font-weight: 600;
          font-size: 12px;
          min-width: 70px;
        }
        .hash-value {
          flex: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          word-break: break-all;
        }
        .hash-item button {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }
        .uuid-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }
        .uuid-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }
        .uuid-item code {
          flex: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .uuid-item button {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }
        .batch-copy {
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          background: rgba(124, 108, 240, 0.2);
          border: 1px solid rgba(124, 108, 240, 0.5);
          border-radius: 8px;
          color: #f0f0ff;
          cursor: pointer;
        }
        .password-controls {
          margin-top: 16px;
        }
        .control-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .control-row input[type="number"] {
          width: 80px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #f0f0ff;
        }
        .control-row input[type="range"] {
          flex: 1;
          max-width: 200px;
        }
        .checkbox-row {
          flex-wrap: wrap;
          gap: 16px;
        }
        .checkbox-row label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .password-display {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          margin-top: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
        }
        .password-display code {
          flex: 1;
          word-break: break-all;
        }
        .strength-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }
        .password-history {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .password-history h4 {
          font-size: 13px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.6);
        }
        .history-item {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          margin-bottom: 4px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .timestamp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 16px;
        }
        .ts-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ts-item label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .ts-item input {
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-family: 'JetBrains Mono', monospace;
        }
        .timestamp-info {
          margin-top: 16px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 13px;
        }
        .timestamp-info div {
          margin-bottom: 6px;
        }
        .timestamp-info code {
          font-family: 'JetBrains Mono', monospace;
          color: #a5b4fc;
        }
        .color-tool {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 16px 0;
        }
        .color-picker {
          width: 60px;
          height: 60px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          background: transparent;
        }
        .hex-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
        }
        .color-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .color-info div {
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 12px;
        }
        .color-info code {
          font-family: 'JetBrains Mono', monospace;
          color: #a5b4fc;
        }
        .color-preview {
          height: 80px;
          margin-top: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        .regex-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .regex-controls input {
          flex: 1;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-family: 'JetBrains Mono', monospace;
        }
        .flags-input {
          width: 80px;
          text-align: center;
        }
        .presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 12px 0;
          align-items: center;
        }
        .presets span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .presets button {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          cursor: pointer;
        }
        .presets button:hover {
          background: rgba(124, 108, 240, 0.2);
          color: #fff;
        }
        .matches {
          margin-top: 16px;
        }
        .matches h4 {
          font-size: 13px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.6);
        }
        .match-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .match-item {
          padding: 4px 10px;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.5);
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .no-match {
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }
        .jwt-output {
          margin-top: 16px;
        }
        .jwt-section {
          margin-bottom: 12px;
        }
        .jwt-section h4 {
          font-size: 13px;
          margin-bottom: 6px;
          color: rgba(255, 255, 255, 0.6);
        }
        .jwt-section pre {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          overflow-x: auto;
        }
        .ua-result {
          margin-top: 16px;
        }
        .ua-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .ua-key {
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }
        .ua-value {
          color: #a5b4fc;
          font-weight: 500;
        }
        .cron-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .cron-input-row input {
          flex: 1;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
        }
        .cron-input-row button {
          padding: 0 20px;
          background: #7c6cf0;
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }
        .cron-desc {
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 14px;
          margin: 12px 0;
        }
        .cron-next {
          margin-top: 16px;
        }
        .cron-next h4 {
          font-size: 13px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.6);
        }
        .cron-next div {
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .cron-help {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cron-help h4 {
          font-size: 13px;
          margin-bottom: 6px;
          color: rgba(255, 255, 255, 0.6);
        }
        .cron-help div {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
      
      <aside className="devbox-sidebar">
        <div className="devbox-header">
          <h1>🧰 DevBox</h1>
          <p>开发者实用工具箱</p>
        </div>
        <div className="devbox-search">
          <input 
            type="text" 
            placeholder="🔍 搜索工具..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="devbox-categories">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              className={category === cat.id ? 'active' : ''}
              onClick={() => setCategory(cat.id as ToolCategory | 'all')}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
        <div className="devbox-tool-list">
          {filteredTools.map(tool => (
            <button
              key={tool.id}
              className={`devbox-tool-item ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="devbox-tool-icon">{tool.icon}</span>
              <div className="devbox-tool-info">
                <div className="devbox-tool-name">{tool.name}</div>
                <div className="devbox-tool-desc">{tool.description}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>
      
      <main className="devbox-main">
        <div className="devbox-tool-header">
          <span className="icon">{activeToolInfo?.icon}</span>
          <div>
            <h2>{activeToolInfo?.name}</h2>
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>{activeToolInfo?.description}</p>
          </div>
        </div>
        <ActiveComponent />
      </main>
    </div>
  )
}
