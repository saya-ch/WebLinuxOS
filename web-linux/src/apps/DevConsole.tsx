import { useState, useCallback, useMemo, useEffect } from 'react'

/**
 * DevConsole - 开发者工具控制台
 * 集成 JSON 格式化、Base64、URL 编码、哈希生成、UUID、JWT 解码、正则测试、颜色转换、时间戳转换等
 * 所有计算在浏览器本地完成，无需网络请求，保证隐私和速度
 */

type ToolId =
  | 'json' | 'base64' | 'url' | 'hash' | 'uuid'
  | 'jwt' | 'regex' | 'color' | 'timestamp' | 'diff'

interface Tool {
  id: ToolId
  name: string
  description: string
  icon: string
}

const TOOLS: Tool[] = [
  { id: 'json', name: 'JSON 格式化', description: '格式化、压缩、验证 JSON', icon: '{ }' },
  { id: 'base64', name: 'Base64', description: 'Base64 编码 / 解码', icon: 'B64' },
  { id: 'url', name: 'URL 编码', description: 'URL 编码 / 解码', icon: '%' },
  { id: 'hash', name: '哈希生成', description: 'SHA-1 / SHA-256 / SHA-512', icon: '#' },
  { id: 'uuid', name: 'UUID 生成', description: '生成 v4 UUID', icon: 'ID' },
  { id: 'jwt', name: 'JWT 解码', description: '解码 JWT Token', icon: 'JWT' },
  { id: 'regex', name: '正则测试', description: '测试正则表达式匹配', icon: '.*' },
  { id: 'color', name: '颜色转换', description: 'HEX / RGB / HSL 转换', icon: '◆' },
  { id: 'timestamp', name: '时间戳', description: 'Unix 时间戳转换', icon: '⏱' },
  { id: 'diff', name: '文本对比', description: '逐行对比两段文本', icon: '≠' },
]

// ========================= 样式 =========================
const styles = {
  container: {
    display: 'flex',
    height: '100%',
    background: '#0a0e14',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    color: '#c8d3f5',
    fontSize: '13px',
  } as React.CSSProperties,
  sidebar: {
    width: '220px',
    minWidth: '220px',
    background: '#0d1117',
    borderRight: '1px solid #1e2632',
    overflowY: 'auto' as const,
    padding: '8px 0',
  },
  sidebarHeader: {
    padding: '12px 16px 8px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
    color: '#5c677d',
  },
  toolItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderLeft: '2px solid transparent',
  } as React.CSSProperties,
  toolItemActive: {
    background: 'rgba(124, 214, 207, 0.08)',
    borderLeftColor: '#7cd6cf',
    color: '#7cd6cf',
  },
  toolIcon: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#151b25',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#7cd6cf',
    flexShrink: 0,
  } as React.CSSProperties,
  toolInfo: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  toolName: {
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
  toolDesc: {
    fontSize: '10px',
    color: '#5c677d',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '1px',
  } as React.CSSProperties,
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    padding: '10px 20px',
    borderBottom: '1px solid #1e2632',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#0d1117',
  } as React.CSSProperties,
  headerTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e6e6e6',
  } as React.CSSProperties,
  headerDesc: {
    fontSize: '11px',
    color: '#5c677d',
    marginTop: '2px',
  } as React.CSSProperties,
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '120px',
    background: '#0d1117',
    border: '1px solid #1e2632',
    borderRadius: '8px',
    padding: '12px',
    color: '#c8d3f5',
    fontFamily: "inherit",
    fontSize: '13px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid #1e2632',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#c8d3f5',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
  } as React.CSSProperties,
  button: {
    padding: '6px 14px',
    background: '#1a2332',
    border: '1px solid #2a3548',
    borderRadius: '6px',
    color: '#c8d3f5',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  buttonPrimary: {
    background: '#1a5c54',
    borderColor: '#2a8a7e',
    color: '#7cd6cf',
  } as React.CSSProperties,
  output: {
    background: '#0d1117',
    border: '1px solid #1e2632',
    borderRadius: '8px',
    padding: '12px',
    minHeight: '60px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontSize: '13px',
    lineHeight: '1.6',
  } as React.CSSProperties,
  label: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#5c677d',
    marginBottom: '6px',
    display: 'block',
  } as React.CSSProperties,
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  } as React.CSSProperties,
  badgeSuccess: { background: 'rgba(126, 231, 135, 0.15)', color: '#7ee787', border: '1px solid rgba(126, 231, 135, 0.3)' },
  badgeError: { background: 'rgba(255, 123, 114, 0.15)', color: '#ff7b72', border: '1px solid rgba(255, 123, 114, 0.3)' },
  badgeInfo: { background: 'rgba(124, 214, 207, 0.15)', color: '#7cd6cf', border: '1px solid rgba(124, 214, 207, 0.3)' },
  select: {
    background: '#0d1117',
    border: '1px solid #1e2632',
    borderRadius: '6px',
    padding: '6px 10px',
    color: '#c8d3f5',
    fontSize: '12px',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
}

// ========================= 工具组件 =========================

function JSONTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const [indent, setIndent] = useState(2)

  const format = useCallback(() => {
    if (!input.trim()) { setOutput(''); setStatus('idle'); return }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setStatus('ok')
    } catch (e) {
      setOutput(`解析错误: ${(e as Error).message}`)
      setStatus('err')
    }
  }, [input, indent])

  const minify = useCallback(() => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setStatus('ok')
    } catch (e) {
      setOutput(`解析错误: ${(e as Error).message}`)
      setStatus('err')
    }
  }, [input])

  const escape = useCallback(() => {
    if (!input.trim()) return
    try {
      setOutput(JSON.stringify(input))
      setStatus('ok')
    } catch {
      setStatus('err')
    }
  }, [input])

  const copyOutput = useCallback(() => {
    if (output) navigator.clipboard?.writeText(output)
  }, [output])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <label style={styles.label}>&nbsp;缩进</label>
        <select style={styles.select} value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
          <option value={2}>2 空格</option>
          <option value={4}>4 空格</option>
          <option value={0}>压缩</option>
        </select>
        <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={format}>格式化</button>
        <button style={styles.button} onClick={minify}>压缩</button>
        <button style={styles.button} onClick={escape}>转义字符串</button>
        <button style={styles.button} onClick={copyOutput}>复制结果</button>
        {status === 'ok' && <span style={{ ...styles.badge, ...styles.badgeSuccess }}>有效 JSON</span>}
        {status === 'err' && <span style={{ ...styles.badge, ...styles.badgeError }}>无效 JSON</span>}
      </div>
      <div>
        <label style={styles.label}>输入</label>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"name": "WebLinuxOS", "version": "32.0", "features": ["terminal", "files", "browser"]}'
          spellCheck={false}
        />
      </div>
      <div>
        <label style={styles.label}>输出</label>
        <div style={{ ...styles.output, color: status === 'err' ? '#ff7b72' : '#7ee787' }}>{output || '点击"格式化"查看结果...'}</div>
      </div>
    </div>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!input) { setOutput(''); setError(''); return }
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <button style={mode === 'encode' ? { ...styles.button, ...styles.buttonPrimary } : styles.button} onClick={() => setMode('encode')}>编码</button>
        <button style={mode === 'decode' ? { ...styles.button, ...styles.buttonPrimary } : styles.button} onClick={() => setMode('decode')}>解码</button>
        <button style={styles.button} onClick={() => { setInput(''); setOutput('') }}>清空</button>
        <button style={styles.button} onClick={() => output && navigator.clipboard?.writeText(output)}>复制结果</button>
      </div>
      <div>
        <label style={styles.label}>{mode === 'encode' ? '明文' : 'Base64'}</label>
        <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? '输入要编码的文本' : '输入要解码的 Base64'} spellCheck={false} />
      </div>
      {error && <span style={{ ...styles.badge, ...styles.badgeError }}>{error}</span>}
      <div>
        <label style={styles.label}>{mode === 'encode' ? 'Base64' : '明文'}</label>
        <div style={{ ...styles.output, color: '#7cd6cf' }}>{output || '结果将自动显示...'}</div>
      </div>
    </div>
  )
}

function URLTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  useEffect(() => {
    if (!input) { setOutput(''); return }
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input))
    } catch {
      setOutput('解码错误')
    }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <button style={mode === 'encode' ? { ...styles.button, ...styles.buttonPrimary } : styles.button} onClick={() => setMode('encode')}>编码</button>
        <button style={mode === 'decode' ? { ...styles.button, ...styles.buttonPrimary } : styles.button} onClick={() => setMode('decode')}>解码</button>
        <button style={styles.button} onClick={() => output && navigator.clipboard?.writeText(output)}>复制</button>
      </div>
      <div>
        <label style={styles.label}>输入</label>
        <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.com/path?query=值" spellCheck={false} />
      </div>
      <div>
        <label style={styles.label}>输出</label>
        <div style={{ ...styles.output, color: '#7cd6cf' }}>{output || '结果...'}</div>
      </div>
    </div>
  )
}

function HashTool() {
  const [input, setInput] = useState('')
  const [algo, setAlgo] = useState<'SHA-1' | 'SHA-256' | 'SHA-512'>('SHA-256')
  const [hash, setHash] = useState('')

  const compute = useCallback(async () => {
    if (!input) { setHash(''); return }
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const digest = await crypto.subtle.digest(algo, data)
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
      setHash(hex)
    } catch {
      setHash('计算失败')
    }
  }, [input, algo])

  useEffect(() => { compute() }, [compute])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <label style={styles.label}>&nbsp;算法</label>
        <select style={styles.select} value={algo} onChange={(e) => setAlgo(e.target.value as 'SHA-1' | 'SHA-256' | 'SHA-512')}>
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-512">SHA-512</option>
        </select>
        <button style={styles.button} onClick={() => hash && navigator.clipboard?.writeText(hash)}>复制哈希</button>
        <span style={{ ...styles.badge, ...styles.badgeInfo }}>使用 Web Crypto API</span>
      </div>
      <div>
        <label style={styles.label}>输入文本</label>
        <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入要计算哈希的文本" spellCheck={false} />
      </div>
      <div>
        <label style={styles.label}>{algo} 哈希值</label>
        <div style={{ ...styles.output, color: '#7ee787', wordBreak: 'break-all' }}>{hash || '输入文本后自动计算...'}</div>
      </div>
    </div>
  )
}

function UUIDTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const [uppercase, setUppercase] = useState(false)

  const generate = useCallback(() => {
    const result: string[] = []
    for (let i = 0; i < count; i++) {
      if (crypto.randomUUID) {
        const id = crypto.randomUUID()
        result.push(uppercase ? id.toUpperCase() : id)
      } else {
        // 回退方案
        result.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return (uppercase ? v.toString(16).toUpperCase() : v.toString(16))
        }))
      }
    }
    setUuids(result)
  }, [count, uppercase])

  useEffect(() => { generate() }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <label style={styles.label}>&nbsp;数量</label>
        <input type="number" min={1} max={100} style={{ ...styles.input, width: '80px' }} value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} /> 大写
        </label>
        <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={generate}>生成</button>
        <button style={styles.button} onClick={() => uuids.length && navigator.clipboard?.writeText(uuids.join('\n'))}>复制全部</button>
      </div>
      <div>
        <label style={styles.label}>UUID v4</label>
        <div style={{ ...styles.output, maxHeight: '400px' }}>
          {uuids.length === 0 ? '点击"生成"按钮...' : uuids.map((id, i) => (
            <div key={i} style={{ padding: '4px 0', borderBottom: i < uuids.length - 1 ? '1px solid #1e2632' : 'none', color: '#7ee787', cursor: 'pointer' }}
              onClick={() => navigator.clipboard?.writeText(id)}>
              {id}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function JWTTool() {
  const [token, setToken] = useState('')
  const [decoded, setDecoded] = useState<{ header: unknown; payload: unknown; signature: string } | null>(null)
  const [error, setError] = useState('')

  const decode = useCallback(() => {
    if (!token.trim()) { setDecoded(null); setError(''); return }
    const parts = token.trim().split('.')
    if (parts.length !== 3) {
      setError('JWT 格式错误：需要三段 (header.payload.signature)')
      setDecoded(null)
      return
    }
    try {
      const decodeB64 = (s: string) => {
        const padded = s.replace(/-/g, '+').replace(/_/g, '/')
        const json = atob(padded)
        return JSON.parse(decodeURIComponent(escape(json)))
      }
      setDecoded({
        header: decodeB64(parts[0]),
        payload: decodeB64(parts[1]),
        signature: parts[2],
      })
      setError('')
    } catch (e) {
      setError(`解码失败: ${(e as Error).message}`)
      setDecoded(null)
    }
  }, [token])

  useEffect(() => { decode() }, [decode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <span style={{ ...styles.badge, ...styles.badgeInfo }}>本地解码，不会发送到服务器</span>
        <button style={styles.button} onClick={() => { setToken(''); setDecoded(null) }}>清空</button>
      </div>
      <div>
        <label style={styles.label}>JWT Token</label>
        <textarea style={{ ...styles.textarea, minHeight: '80px' }} value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" spellCheck={false} />
      </div>
      {error && <span style={{ ...styles.badge, ...styles.badgeError }}>{error}</span>}
      {decoded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label style={styles.label}>Header <span style={{ ...styles.badge, ...styles.badgeInfo }}>红色</span></label>
            <div style={{ ...styles.output, color: '#ff7b72' }}>{JSON.stringify(decoded.header, null, 2)}</div>
          </div>
          <div>
            <label style={styles.label}>Payload <span style={{ ...styles.badge, ...styles.badgeInfo }}>紫色</span></label>
            <div style={{ ...styles.output, color: '#c792ea' }}>{JSON.stringify(decoded.payload, null, 2)}</div>
          </div>
          <div>
            <label style={styles.label}>Signature</label>
            <div style={{ ...styles.output, color: '#5c677d', wordBreak: 'break-all' }}>{decoded.signature}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')
  const [matches, setMatches] = useState<{ match: string; index: number; groups: string[] }[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pattern || !text) { setMatches([]); setError(''); return }
    try {
      const regex = new RegExp(pattern, flags)
      const results: { match: string; index: number; groups: string[] }[] = []
      if (flags.includes('g')) {
        let m: RegExpExecArray | null
        let count = 0
        while ((m = regex.exec(text)) !== null && count < 1000) {
          results.push({ match: m[0], index: m.index, groups: m.slice(1) })
          if (m.index === regex.lastIndex) regex.lastIndex++
          count++
        }
      } else {
        const m = regex.exec(text)
        if (m) results.push({ match: m[0], index: m.index, groups: m.slice(1) })
      }
      setMatches(results)
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setMatches([])
    }
  }, [pattern, flags, text])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <span style={{ color: '#5c677d', fontSize: '16px' }}>/</span>
        <input style={{ ...styles.input, flex: 1, fontFamily: 'inherit' }} value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="正则表达式，例如 \d+" />
        <span style={{ color: '#5c677d', fontSize: '16px' }}>/</span>
        <input style={{ ...styles.input, width: '80px' }} value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="gim" />
      </div>
      {error && <span style={{ ...styles.badge, ...styles.badgeError }}>{error}</span>}
      <div>
        <label style={styles.label}>测试文本</label>
        <textarea style={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} placeholder="输入要匹配的文本" spellCheck={false} />
      </div>
      <div style={styles.row}>
        <span style={{ ...styles.badge, ...styles.badgeSuccess }}>{matches.length} 个匹配</span>
      </div>
      <div>
        <label style={styles.label}>匹配结果</label>
        <div style={{ ...styles.output, maxHeight: '200px' }}>
          {matches.length === 0 ? '无匹配' : matches.map((m, i) => (
            <div key={i} style={{ padding: '4px 0', borderBottom: i < matches.length - 1 ? '1px solid #1e2632' : 'none' }}>
              <span style={{ color: '#5c677d' }}>[{m.index}]</span>{' '}
              <span style={{ color: '#7ee787' }}>"{m.match}"</span>
              {m.groups.length > 0 && <span style={{ color: '#c792ea' }}> 捕获组: {m.groups.map(g => `"${g}"`).join(', ')}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ColorTool() {
  const [hex, setHex] = useState('#7cd6cf')

  const rgb = useMemo(() => {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!m) return null
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  }, [hex])

  const hsl = useMemo(() => {
    if (!rgb) return null
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
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
  }, [rgb])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.row}>
        <input type="color" value={hex.length === 7 ? hex : '#000000'} onChange={(e) => setHex(e.target.value)} style={{ width: '50px', height: '38px', border: '1px solid #1e2632', borderRadius: '6px', cursor: 'pointer', background: 'none' }} />
        <input style={{ ...styles.input, flex: 1 }} value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#7cd6cf" />
      </div>
      <div style={{ ...styles.output, display: 'flex', alignItems: 'center', gap: '16px', minHeight: '80px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: hex, border: '1px solid #1e2632', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div><span style={{ color: '#5c677d' }}>HEX: </span><span style={{ color: '#7cd6cf' }}>{hex}</span></div>
          {rgb && <div><span style={{ color: '#5c677d' }}>RGB: </span><span style={{ color: '#7ee787' }}>rgb({rgb.r}, {rgb.g}, {rgb.b})</span></div>}
          {hsl && <div><span style={{ color: '#5c677d' }}>HSL: </span><span style={{ color: '#c792ea' }}>hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span></div>}
          {rgb && <div><span style={{ color: '#5c677d' }}>RGB%: </span><span style={{ color: '#ffab70' }}>{Math.round(rgb.r/2.55)}%, {Math.round(rgb.g/2.55)}%, {Math.round(rgb.b/2.55)}%</span></div>}
        </div>
      </div>
      <div style={styles.row}>
        <button style={styles.button} onClick={() => navigator.clipboard?.writeText(hex)}>复制 HEX</button>
        {rgb && <button style={styles.button} onClick={() => navigator.clipboard?.writeText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>复制 RGB</button>}
        {hsl && <button style={styles.button} onClick={() => navigator.clipboard?.writeText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>复制 HSL</button>}
      </div>
    </div>
  )
}

function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  const [tsInput, setTsInput] = useState(String(Math.floor(Date.now() / 1000)))
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 19))

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const ts = useMemo(() => {
    const n = Number(tsInput)
    if (isNaN(n)) return null
    // 自动判断秒/毫秒
    const ms = n > 1e12 ? n : n * 1000
    const d = new Date(ms)
    if (isNaN(d.getTime())) return null
    return d
  }, [tsInput])

  const dateTs = useMemo(() => {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return null
    return Math.floor(d.getTime() / 1000)
  }, [dateInput])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ ...styles.output, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#5c677d', fontSize: '11px' }}>当前时间</div>
          <div style={{ color: '#7cd6cf', fontSize: '16px', fontWeight: 600 }}>{new Date(now).toLocaleString('zh-CN')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#5c677d', fontSize: '11px' }}>Unix 时间戳 (秒)</div>
          <div style={{ color: '#7ee787', fontSize: '16px', fontWeight: 600 }}>{Math.floor(now / 1000)}</div>
        </div>
      </div>

      <div>
        <label style={styles.label}>时间戳 → 日期</label>
        <div style={styles.row}>
          <input style={{ ...styles.input, flex: 1 }} value={tsInput} onChange={(e) => setTsInput(e.target.value)} placeholder="1700000000" />
          <button style={styles.button} onClick={() => setTsInput(String(Math.floor(Date.now() / 1000)))}>当前</button>
        </div>
        {ts && (
          <div style={{ ...styles.output, marginTop: '8px', color: '#7ee787' }}>
            <div>本地时间: {ts.toLocaleString('zh-CN')}</div>
            <div>UTC 时间: {ts.toUTCString()}</div>
            <div>ISO 格式: {ts.toISOString()}</div>
            <div>相对时间: {ts.getTime() > now ? `${Math.round((ts.getTime() - now) / 86400000)} 天后` : `${Math.round((now - ts.getTime()) / 86400000)} 天前`}</div>
          </div>
        )}
      </div>

      <div>
        <label style={styles.label}>日期 → 时间戳</label>
        <input type="datetime-local" style={{ ...styles.input, flex: 1 }} value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
        {dateTs !== null && (
          <div style={{ ...styles.output, marginTop: '8px', color: '#c792ea' }}>
            Unix 时间戳: {dateTs}
          </div>
        )}
      </div>
    </div>
  )
}

function DiffTool() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [diff, setDiff] = useState<{ type: 'same' | 'add' | 'del'; text: string }[]>([])

  const computeDiff = useCallback(() => {
    const lines1 = text1.split('\n')
    const lines2 = text2.split('\n')
    const result: { type: 'same' | 'add' | 'del'; text: string }[] = []
    const max = Math.max(lines1.length, lines2.length)
    for (let i = 0; i < max; i++) {
      const l1 = lines1[i] ?? ''
      const l2 = lines2[i] ?? ''
      if (l1 === l2) {
        result.push({ type: 'same', text: l1 })
      } else {
        if (l1) result.push({ type: 'del', text: l1 })
        if (l2) result.push({ type: 'add', text: l2 })
      }
    }
    setDiff(result)
  }, [text1, text2])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={styles.label}>原始文本</label>
          <textarea style={styles.textarea} value={text1} onChange={(e) => setText1(e.target.value)} placeholder="第一段文本" spellCheck={false} />
        </div>
        <div>
          <label style={styles.label}>修改后文本</label>
          <textarea style={styles.textarea} value={text2} onChange={(e) => setText2(e.target.value)} placeholder="第二段文本" spellCheck={false} />
        </div>
      </div>
      <button style={{ ...styles.button, ...styles.buttonPrimary, alignSelf: 'flex-start' }} onClick={computeDiff}>对比差异</button>
      <div>
        <label style={styles.label}>差异结果</label>
        <div style={{ ...styles.output, maxHeight: '300px' }}>
          {diff.length === 0 ? '点击"对比差异"查看结果...' : diff.map((line, i) => (
            <div key={i} style={{
              padding: '2px 8px',
              background: line.type === 'add' ? 'rgba(126, 231, 135, 0.1)' : line.type === 'del' ? 'rgba(255, 123, 114, 0.1)' : 'transparent',
              color: line.type === 'add' ? '#7ee787' : line.type === 'del' ? '#ff7b72' : '#5c677d',
              borderLeft: line.type === 'add' ? '3px solid #7ee787' : line.type === 'del' ? '3px solid #ff7b72' : '3px solid transparent',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              <span style={{ opacity: 0.6, marginRight: '8px' }}>{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
              {line.text || ' '}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ========================= 主组件 =========================

const TOOL_COMPONENTS: Record<ToolId, React.ComponentType> = {
  json: JSONTool,
  base64: Base64Tool,
  url: URLTool,
  hash: HashTool,
  uuid: UUIDTool,
  jwt: JWTTool,
  regex: RegexTool,
  color: ColorTool,
  timestamp: TimestampTool,
  diff: DiffTool,
}

export default function DevConsole() {
  const [activeTool, setActiveTool] = useState<ToolId>('json')
  const ActiveComponent = TOOL_COMPONENTS[activeTool]
  const activeToolInfo = TOOLS.find(t => t.id === activeTool)!

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>开发者工具</div>
        {TOOLS.map((tool) => (
          <div
            key={tool.id}
            style={{ ...styles.toolItem, ...(activeTool === tool.id ? styles.toolItemActive : {}) }}
            onClick={() => setActiveTool(tool.id)}
            onMouseEnter={(e) => { if (activeTool !== tool.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={(e) => { if (activeTool !== tool.id) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={styles.toolIcon}>{tool.icon}</div>
            <div style={styles.toolInfo}>
              <div style={styles.toolName}>{tool.name}</div>
              <div style={styles.toolDesc}>{tool.description}</div>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 16px', marginTop: '12px', borderTop: '1px solid #1e2632' }}>
          <div style={{ fontSize: '10px', color: '#5c677d', lineHeight: 1.6 }}>
            所有操作在浏览器本地完成，数据不会上传到任何服务器。
          </div>
        </div>
      </div>
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>{activeToolInfo.name}</div>
            <div style={styles.headerDesc}>{activeToolInfo.description}</div>
          </div>
        </div>
        <div style={styles.content}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
