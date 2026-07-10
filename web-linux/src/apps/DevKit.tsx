import { useState, useCallback, useMemo, useEffect } from 'react'
import '../styles/devkit.css'
import {
  Code, Hash, Link, Palette, FileText, Terminal,
  Copy, Check, RefreshCw, ChevronDown, ChevronRight,
  Sparkles, Gauge, Calculator, Binary,
} from 'lucide-react'

type ToolId = 'json' | 'base64' | 'url' | 'hash' | 'uuid' | 'regex' | 'color' | 'markdown' | 'timestamp'

interface Tool {
  id: ToolId
  name: string
  icon: React.ReactNode
  description: string
}

const TOOLS: Tool[] = [
  { id: 'json', name: 'JSON 格式化', icon: <Code size={16} />, description: '格式化、压缩、验证 JSON' },
  { id: 'base64', name: 'Base64 编解码', icon: <Binary size={16} />, description: 'Base64 编码与解码' },
  { id: 'url', name: 'URL 编解码', icon: <Link size={16} />, description: 'URL 编码与解码' },
  { id: 'hash', name: '哈希生成', icon: <Hash size={16} />, description: 'MD5 / SHA 系列哈希' },
  { id: 'uuid', name: 'UUID 生成', icon: <Sparkles size={16} />, description: '生成 UUID v4' },
  { id: 'regex', name: '正则测试', icon: <Gauge size={16} />, description: '正则表达式在线测试' },
  { id: 'color', name: '颜色转换', icon: <Palette size={16} />, description: 'HEX / RGB / HSL 转换' },
  { id: 'markdown', name: 'Markdown 预览', icon: <FileText size={16} />, description: '实时 Markdown 渲染' },
  { id: 'timestamp', name: '时间戳转换', icon: <Terminal size={16} />, description: 'Unix 时间戳转换' },
]

function DevKit() {
  const [activeTool, setActiveTool] = useState<ToolId>('json')
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('复制失败', e)
    }
  }, [])

  const currentTool = useMemo(() => TOOLS.find((t) => t.id === activeTool), [activeTool])

  return (
    <div className="dk-root">
      <div className="dk-sidebar">
        <div className="dk-sidebar-header">
          <div className="dk-logo">
            <Sparkles size={18} />
            <span>DevKit</span>
          </div>
          <div className="dk-logo-sub">开发者工具箱</div>
        </div>
        <div className="dk-tool-list">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`dk-tool-item ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="dk-tool-icon">{tool.icon}</span>
              <div className="dk-tool-info">
                <div className="dk-tool-name">{tool.name}</div>
                <div className="dk-tool-desc">{tool.description}</div>
              </div>
              {activeTool === tool.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="dk-main">
        <div className="dk-main-header">
          <div>
            <div className="dk-tool-title">
              {currentTool?.icon}
              <span>{currentTool?.name}</span>
            </div>
            <div className="dk-tool-description">{currentTool?.description}</div>
          </div>
        </div>
        <div className="dk-tool-content">
          {activeTool === 'json' && <JSONTool copy={copyToClipboard} copied={copied} />}
          {activeTool === 'base64' && <Base64Tool copy={copyToClipboard} copied={copied} />}
          {activeTool === 'url' && <URLTool copy={copyToClipboard} copied={copied} />}
          {activeTool === 'hash' && <HashTool copy={copyToClipboard} copied={copied} />}
          {activeTool === 'uuid' && <UUIDTool copy={copyToClipboard} copied={copied} />}
          {activeTool === 'regex' && <RegexTool />}
          {activeTool === 'color' && <ColorTool copy={copyToClipboard} copied={copied} />}
          {activeTool === 'markdown' && <MarkdownTool />}
          {activeTool === 'timestamp' && <TimestampTool copy={copyToClipboard} copied={copied} />}
        </div>
      </div>
    </div>
  )
}

interface ToolProps {
  copy: (text: string) => void
  copied: boolean
}

function JSONTool({ copy, copied }: ToolProps) {
  const [input, setInput] = useState('{"name": "WebLinuxOS", "version": "1.0.0", "features": ["桌面环境", "窗口管理", "应用生态"]}')
  const [error, setError] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'format' | 'minify' | 'validate'>('format')

  const process = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setError('')
      if (mode === 'format') {
        setOutput(JSON.stringify(parsed, null, 2))
      } else if (mode === 'minify') {
        setOutput(JSON.stringify(parsed))
      } else {
        setOutput('✓ JSON 格式有效\n\n键值数量: ' + Object.keys(parsed).length)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析错误')
      setOutput('')
    }
  }, [input, mode])

  return (
    <div className="dk-tool-panel">
      <div className="dk-toolbar">
        <div className="dk-btn-group">
          {['format', 'minify', 'validate'].map((m) => (
            <button
              key={m}
              className={`dk-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m as typeof mode)}
            >
              {m === 'format' ? '格式化' : m === 'minify' ? '压缩' : '验证'}
            </button>
          ))}
        </div>
        <button className="dk-btn dk-btn-primary" onClick={process}>
          <RefreshCw size={12} />
          处理
        </button>
      </div>
      <div className="dk-panels">
        <div className="dk-panel">
          <div className="dk-panel-label">输入</div>
          <textarea
            className="dk-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此输入 JSON..."
            spellCheck={false}
          />
        </div>
        <div className="dk-panel">
          <div className="dk-panel-label">
            输出
            <button className="dk-copy-btn" onClick={() => copy(output)} disabled={!output}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          {error ? (
            <div className="dk-error">{error}</div>
          ) : (
            <textarea
              className="dk-textarea dk-textarea-readonly"
              value={output}
              readOnly
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Base64Tool({ copy, copied }: ToolProps) {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const process = useCallback(() => {
    try {
      setError('')
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch (e) {
      setError('解码失败：无效的 Base64 字符串')
      setOutput('')
    }
  }, [input, mode])

  return (
    <div className="dk-tool-panel">
      <div className="dk-toolbar">
        <div className="dk-btn-group">
          <button className={`dk-btn ${mode === 'encode' ? 'active' : ''}`} onClick={() => setMode('encode')}>
            编码
          </button>
          <button className={`dk-btn ${mode === 'decode' ? 'active' : ''}`} onClick={() => setMode('decode')}>
            解码
          </button>
        </div>
        <button className="dk-btn dk-btn-primary" onClick={process}>
          {mode === 'encode' ? '编码' : '解码'}
        </button>
      </div>
      <div className="dk-panels">
        <div className="dk-panel">
          <div className="dk-panel-label">{mode === 'encode' ? '原文' : 'Base64'}</div>
          <textarea
            className="dk-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'}
            spellCheck={false}
          />
        </div>
        <div className="dk-panel">
          <div className="dk-panel-label">
            {mode === 'encode' ? 'Base64 结果' : '解码结果'}
            <button className="dk-copy-btn" onClick={() => copy(output)} disabled={!output}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          {error ? (
            <div className="dk-error">{error}</div>
          ) : (
            <textarea
              className="dk-textarea dk-textarea-readonly"
              value={output}
              readOnly
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function URLTool({ copy, copied }: ToolProps) {
  const [input, setInput] = useState('https://example.com/path?q=hello world&lang=中文')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = useCallback(() => {
    if (mode === 'encode') {
      setOutput(encodeURIComponent(input))
    } else {
      try {
        setOutput(decodeURIComponent(input))
      } catch {
        setOutput('解码失败')
      }
    }
  }, [input, mode])

  return (
    <div className="dk-tool-panel">
      <div className="dk-toolbar">
        <div className="dk-btn-group">
          <button className={`dk-btn ${mode === 'encode' ? 'active' : ''}`} onClick={() => setMode('encode')}>
            编码
          </button>
          <button className={`dk-btn ${mode === 'decode' ? 'active' : ''}`} onClick={() => setMode('decode')}>
            解码
          </button>
        </div>
        <button className="dk-btn dk-btn-primary" onClick={process}>
          {mode === 'encode' ? '编码' : '解码'}
        </button>
      </div>
      <div className="dk-panels">
        <div className="dk-panel">
          <div className="dk-panel-label">{mode === 'encode' ? '原文' : '编码后'}</div>
          <textarea
            className="dk-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 URL 或文本..."
            spellCheck={false}
          />
        </div>
        <div className="dk-panel">
          <div className="dk-panel-label">
            结果
            <button className="dk-copy-btn" onClick={() => copy(output)} disabled={!output}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <textarea
            className="dk-textarea dk-textarea-readonly"
            value={output}
            readOnly
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}

function HashTool({ copy, copied }: ToolProps) {
  const [input, setInput] = useState('Hello, World!')
  const [hashes, setHashes] = useState<Record<string, string>>({})

  const simpleHash = useCallback((str: string, _algo: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }, [])

  const generateHashes = useCallback(() => {
    const h: Record<string, string> = {}
    h['MD5 (模拟)'] = simpleHash(input + 'md5', 'md5') + simpleHash(input + 'salt', 'md5')
    h['SHA-1 (模拟)'] = simpleHash(input + 'sha1', 'sha1') + simpleHash(input + 'salt2', 'sha1')
    h['SHA-256 (模拟)'] = simpleHash(input + 'sha256a', 'sha256') + simpleHash(input + 'sha256b', 'sha256') + simpleHash(input + 'sha256c', 'sha256') + simpleHash(input + 'sha256d', 'sha256')
    h['CRC32'] = simpleHash(input, 'crc32')
    setHashes(h)
  }, [input, simpleHash])

  return (
    <div className="dk-tool-panel">
      <div className="dk-toolbar">
        <button className="dk-btn dk-btn-primary" onClick={generateHashes}>
          <Calculator size={12} />
          生成哈希
        </button>
      </div>
      <div className="dk-panels">
        <div className="dk-panel">
          <div className="dk-panel-label">输入</div>
          <textarea
            className="dk-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要哈希的文本..."
            spellCheck={false}
          />
        </div>
        <div className="dk-panel">
          <div className="dk-panel-label">哈希结果</div>
          <div className="dk-hash-list">
            {Object.entries(hashes).map(([name, value]) => (
              <div key={name} className="dk-hash-item">
                <div className="dk-hash-name">{name}</div>
                <div className="dk-hash-value">
                  <code>{value}</code>
                  <button className="dk-copy-btn" onClick={() => copy(value)}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
            {Object.keys(hashes).length === 0 && (
              <div className="dk-empty">点击"生成哈希"按钮开始</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UUIDTool({ copy, copied }: ToolProps) {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)

  const generateUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }, [])

  const generate = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => generateUUID())
    setUuids(newUuids)
  }, [count, generateUUID])

  return (
    <div className="dk-tool-panel">
      <div className="dk-toolbar">
        <div className="dk-count-input">
          <span>数量：</span>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        </div>
        <button className="dk-btn dk-btn-primary" onClick={generate}>
          <Sparkles size={12} />
          生成 UUID
        </button>
      </div>
      <div className="dk-uuid-list">
        {uuids.map((uuid, i) => (
          <div key={i} className="dk-uuid-item">
            <span className="dk-uuid-index">{i + 1}</span>
            <code className="dk-uuid-value">{uuid}</code>
            <button className="dk-copy-btn" onClick={() => copy(uuid)}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        ))}
        {uuids.length === 0 && <div className="dk-empty">点击"生成 UUID"按钮开始</div>}
      </div>
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('联系我们：support@example.com 或 sales@company.org\n更多信息请访问官网。')
  const [matches, setMatches] = useState<RegExpMatchArray[]>([])
  const [error, setError] = useState('')

  const testRegex = useCallback(() => {
    try {
      const regex = new RegExp(pattern, flags)
      const allMatches: RegExpMatchArray[] = []
      let match
      if (flags.includes('g')) {
        while ((match = regex.exec(testText)) !== null) {
          allMatches.push(match)
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        const m = testText.match(regex)
        if (m) allMatches.push(m)
      }
      setMatches(allMatches)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '正则表达式错误')
      setMatches([])
    }
  }, [pattern, flags, testText])

  const highlightedText = useMemo(() => {
    if (!pattern || error) return testText
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      return testText.split(regex).map((part, i, arr) => (
        <span key={i}>
          {part}
          {i < arr.length - 1 && (
            <mark className="dk-regex-match">
              {testText.match(regex)?.[i % (matches.length || 1)] || ''}
            </mark>
          )}
        </span>
      ))
    } catch {
      return testText
    }
  }, [testText, pattern, flags, error, matches.length])

  return (
    <div className="dk-tool-panel">
      <div className="dk-toolbar">
        <div className="dk-regex-input">
          <span className="dk-regex-delimiter">/</span>
          <input
            type="text"
            className="dk-regex-pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="正则表达式"
            spellCheck={false}
          />
          <span className="dk-regex-delimiter">/</span>
          <input
            type="text"
            className="dk-regex-flags"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="gim"
            spellCheck={false}
          />
        </div>
        <button className="dk-btn dk-btn-primary" onClick={testRegex}>
          测试
        </button>
      </div>
      <div className="dk-panels">
        <div className="dk-panel">
          <div className="dk-panel-label">测试文本</div>
          <textarea
            className="dk-textarea"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="输入要测试的文本..."
            spellCheck={false}
          />
        </div>
        <div className="dk-panel">
          <div className="dk-panel-label">
            结果
            <span className="dk-match-count">{matches.length} 个匹配</span>
          </div>
          {error ? (
            <div className="dk-error">{error}</div>
          ) : (
            <div className="dk-regex-result">
              <div className="dk-regex-highlight">{highlightedText}</div>
              {matches.length > 0 && (
                <div className="dk-match-list">
                  {matches.slice(0, 20).map((m, i) => (
                    <div key={i} className="dk-match-item">
                      <span className="dk-match-index">{i + 1}</span>
                      <code>{m[0]}</code>
                      <span className="dk-match-pos">位置: {m.index}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorTool({ copy, copied }: ToolProps) {
  const [color, setColor] = useState('#6366f1')

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

  return (
    <div className="dk-tool-panel">
      <div className="dk-color-picker-section">
        <div className="dk-color-preview" style={{ background: color }} />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="dk-color-input"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="dk-color-hex"
          spellCheck={false}
        />
      </div>
      <div className="dk-color-values">
        <div className="dk-color-format">
          <div className="dk-color-format-label">HEX</div>
          <div className="dk-color-format-value">
            <code>{color.toUpperCase()}</code>
            <button className="dk-copy-btn" onClick={() => copy(color.toUpperCase())}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div className="dk-color-format">
          <div className="dk-color-format-label">RGB</div>
          <div className="dk-color-format-value">
            <code>rgb({rgb.r}, {rgb.g}, {rgb.b})</code>
            <button className="dk-copy-btn" onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div className="dk-color-format">
          <div className="dk-color-format-label">HSL</div>
          <div className="dk-color-format-value">
            <code>hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</code>
            <button className="dk-copy-btn" onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkdownTool() {
  const [markdown, setMarkdown] = useState('# 欢迎使用 WebLinuxOS\n\n这是一个**功能强大**的 *Web 操作系统*。\n\n## 特性\n\n- 🖥️ 完整的桌面环境\n- 🪟 窗口管理系统\n- 📱 响应式设计\n- 🔧 200+ 应用程序\n\n## 代码示例\n\n```javascript\nconsole.log("Hello, WebLinuxOS!");\n```\n\n> 简洁不代表简单')

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br>')
    return html
  }

  return (
    <div className="dk-tool-panel dk-markdown-panel">
      <div className="dk-panel">
        <div className="dk-panel-label">Markdown 编辑</div>
        <textarea
          className="dk-textarea"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="输入 Markdown..."
          spellCheck={false}
        />
      </div>
      <div className="dk-panel">
        <div className="dk-panel-label">预览</div>
        <div className="dk-markdown-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
      </div>
    </div>
  )
}

function TimestampTool({ copy, copied }: ToolProps) {
  const [now, setNow] = useState(Date.now())
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000))
  const [inputMode, setInputMode] = useState<'ts' | 'date'>('ts')

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const tsToDate = (ts: number) => {
    try {
      const d = new Date(ts * 1000)
      return d.toLocaleString('zh-CN', { hour12: false })
    } catch {
      return '无效时间戳'
    }
  }

  const dateToTs = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return Math.floor(d.getTime() / 1000)
    } catch {
      return 0
    }
  }

  const unixNow = Math.floor(now / 1000)
  const msNow = now

  return (
    <div className="dk-tool-panel">
      <div className="dk-timestamp-now">
        <div className="dk-ts-card">
          <div className="dk-ts-label">Unix 时间戳 (秒)</div>
          <div className="dk-ts-value">
            <code>{unixNow}</code>
            <button className="dk-copy-btn" onClick={() => copy(String(unixNow))}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div className="dk-ts-card">
          <div className="dk-ts-label">Unix 时间戳 (毫秒)</div>
          <div className="dk-ts-value">
            <code>{msNow}</code>
            <button className="dk-copy-btn" onClick={() => copy(String(msNow))}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div className="dk-ts-card">
          <div className="dk-ts-label">当前时间</div>
          <div className="dk-ts-value">
            <code>{new Date(now).toLocaleString('zh-CN', { hour12: false })}</code>
          </div>
        </div>
      </div>
      <div className="dk-panels">
        <div className="dk-panel">
          <div className="dk-panel-label">
            <div className="dk-btn-group">
              <button
                className={`dk-btn dk-btn-sm ${inputMode === 'ts' ? 'active' : ''}`}
                onClick={() => setInputMode('ts')}
              >
                时间戳 → 日期
              </button>
              <button
                className={`dk-btn dk-btn-sm ${inputMode === 'date' ? 'active' : ''}`}
                onClick={() => setInputMode('date')}
              >
                日期 → 时间戳
              </button>
            </div>
          </div>
          {inputMode === 'ts' ? (
            <input
              type="number"
              className="dk-input"
              value={timestamp}
              onChange={(e) => setTimestamp(parseInt(e.target.value) || 0)}
              placeholder="输入 Unix 时间戳（秒）"
            />
          ) : (
            <input
              type="datetime-local"
              className="dk-input"
              defaultValue={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setTimestamp(dateToTs(e.target.value))}
            />
          )}
        </div>
        <div className="dk-panel">
          <div className="dk-panel-label">转换结果</div>
          <div className="dk-ts-result">
            <div className="dk-ts-result-item">
              <span>日期时间：</span>
              <code>{tsToDate(timestamp)}</code>
            </div>
            <div className="dk-ts-result-item">
              <span>ISO 格式：</span>
              <code>{new Date(timestamp * 1000).toISOString()}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DevKit
