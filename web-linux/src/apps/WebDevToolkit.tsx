import { useState, useCallback, memo } from 'react'

interface Tool {
  id: string
  name: string
  icon: string
  description: string
}

const tools: Tool[] = [
  { id: 'json', name: 'JSON格式化', icon: '📋', description: '格式化和验证JSON数据' },
  { id: 'base64', name: 'Base64编码', icon: '🔐', description: 'Base64编码/解码工具' },
  { id: 'hash', name: '哈希计算', icon: '🔒', description: '计算文本哈希值' },
  { id: 'url', name: 'URL编码', icon: '🔗', description: 'URL编码/解码工具' },
  { id: 'regex', name: '正则测试', icon: '🔍', description: '测试正则表达式' },
  { id: 'uuid', name: 'UUID生成', icon: '🆔', description: '生成UUID标识符' },
  { id: 'color', name: '颜色转换', icon: '🎨', description: '颜色格式转换工具' },
  { id: 'timestamp', name: '时间戳转换', icon: '⏰', description: '时间戳与日期转换' },
  { id: 'diff', name: '文本对比', icon: '📝', description: '对比两段文本差异' },
  { id: 'markdown', name: 'Markdown预览', icon: '📄', description: '预览Markdown内容' },
]

const JSONFormatter = memo(function JSONFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError('')
    } catch (e) {
      setError('JSON格式错误: ' + (e as Error).message)
      setOutput('')
    }
  }, [input])
  
  const handleMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError('JSON格式错误: ' + (e as Error).message)
      setOutput('')
    }
  }, [input])
  
  return (
    <div className="app-tool-panel">
      <h3>JSON格式化工具</h3>
      <div className="app-tool-row">
        <textarea
          className="app-tool-input"
          placeholder="输入JSON数据..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <div className="app-tool-actions">
        <button className="app-tool-btn" onClick={handleFormat}>格式化</button>
        <button className="app-tool-btn" onClick={handleMinify}>压缩</button>
        <button className="app-tool-btn" onClick={() => { setInput(''); setOutput(''); setError('') }}>清空</button>
      </div>
      {error && <div className="app-tool-error">{error}</div>}
      <div className="app-tool-row">
        <textarea
          className="app-tool-output"
          placeholder="输出结果..."
          value={output}
          readOnly
        />
      </div>
    </div>
  )
})

const Base64Tool = memo(function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  
  const handleConvert = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(input))
      } else {
        setOutput(atob(input))
      }
    } catch (e) {
      setOutput('转换错误: ' + (e as Error).message)
    }
  }, [input, mode])
  
  return (
    <div className="app-tool-panel">
      <h3>Base64编码/解码</h3>
      <div className="app-tool-row">
        <textarea
          className="app-tool-input"
          placeholder="输入文本..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <div className="app-tool-actions">
        <button 
          className={`app-tool-btn ${mode === 'encode' ? 'active' : ''}`}
          onClick={() => setMode('encode')}
        >
          编码
        </button>
        <button 
          className={`app-tool-btn ${mode === 'decode' ? 'active' : ''}`}
          onClick={() => setMode('decode')}
        >
          解码
        </button>
        <button className="app-tool-btn" onClick={handleConvert}>转换</button>
      </div>
      <div className="app-tool-row">
        <textarea
          className="app-tool-output"
          placeholder="输出结果..."
          value={output}
          readOnly
        />
      </div>
    </div>
  )
})

const HashTool = memo(function HashTool() {
  const [input, setInput] = useState('')
  const [outputs, setOutputs] = useState<Record<string, string>>({})
  
  const handleCalculate = useCallback(async () => {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    
    const sha256 = await crypto.subtle.digest('SHA-256', data)
    const sha1 = await crypto.subtle.digest('SHA-1', data)
    
    const toHex = (buffer: ArrayBuffer) => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }
    
    setOutputs({
      'SHA-256': toHex(sha256),
      'SHA-1': toHex(sha1),
      '长度': input.length.toString(),
      '字节数': data.length.toString()
    })
  }, [input])
  
  return (
    <div className="app-tool-panel">
      <h3>哈希计算工具</h3>
      <div className="app-tool-row">
        <textarea
          className="app-tool-input"
          placeholder="输入文本..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <div className="app-tool-actions">
        <button className="app-tool-btn" onClick={handleCalculate}>计算哈希</button>
        <button className="app-tool-btn" onClick={() => { setInput(''); setOutputs({}) }}>清空</button>
      </div>
      <div className="app-tool-results">
        {Object.entries(outputs).map(([key, value]) => (
          <div key={key} className="app-tool-result-item">
            <span className="app-tool-result-label">{key}:</span>
            <span className="app-tool-result-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

const URLTool = memo(function URLTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  
  const handleConvert = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input))
      } else {
        setOutput(decodeURIComponent(input))
      }
    } catch (e) {
      setOutput('转换错误: ' + (e as Error).message)
    }
  }, [input, mode])
  
  return (
    <div className="app-tool-panel">
      <h3>URL编码/解码</h3>
      <div className="app-tool-row">
        <textarea
          className="app-tool-input"
          placeholder="输入URL或文本..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <div className="app-tool-actions">
        <button 
          className={`app-tool-btn ${mode === 'encode' ? 'active' : ''}`}
          onClick={() => setMode('encode')}
        >
          编码
        </button>
        <button 
          className={`app-tool-btn ${mode === 'decode' ? 'active' : ''}`}
          onClick={() => setMode('decode')}
        >
          解码
        </button>
        <button className="app-tool-btn" onClick={handleConvert}>转换</button>
      </div>
      <div className="app-tool-row">
        <textarea
          className="app-tool-output"
          placeholder="输出结果..."
          value={output}
          readOnly
        />
      </div>
    </div>
  )
})

const UUIDGenerator = memo(function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  
  const generateUUID = useCallback(() => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    return uuid
  }, [])
  
  const handleGenerate = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => generateUUID())
    setUuids(newUuids)
  }, [count, generateUUID])
  
  return (
    <div className="app-tool-panel">
      <h3>UUID生成器</h3>
      <div className="app-tool-row">
        <label>生成数量: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          className="app-tool-number-input"
        />
      </div>
      <div className="app-tool-actions">
        <button className="app-tool-btn" onClick={handleGenerate}>生成UUID</button>
        <button className="app-tool-btn" onClick={() => setUuids([])}>清空</button>
        <button 
          className="app-tool-btn"
          onClick={() => {
            navigator.clipboard.writeText(uuids.join('\n'))
          }}
          disabled={uuids.length === 0}
        >
          复制全部
        </button>
      </div>
      <div className="app-tool-results">
        {uuids.map((uuid, index) => (
          <div key={index} className="app-tool-result-item">
            <span className="app-tool-result-value">{uuid}</span>
            <button 
              className="app-tool-copy-btn"
              onClick={() => navigator.clipboard.writeText(uuid)}
            >
              复制
            </button>
          </div>
        ))}
      </div>
    </div>
  )
})

const ColorConverter = memo(function ColorConverter() {
  const [color, setColor] = useState('#ff6347')
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
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
  
  const rgb = hexToRgb(color)
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null
  
  return (
    <div className="app-tool-panel">
      <h3>颜色转换工具</h3>
      <div className="app-tool-row">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="app-tool-color-input"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="app-tool-text-input"
          placeholder="#RRGGBB"
        />
      </div>
      <div className="app-tool-color-preview" style={{ backgroundColor: color }}></div>
      <div className="app-tool-results">
        <div className="app-tool-result-item">
          <span className="app-tool-result-label">HEX:</span>
          <span className="app-tool-result-value">{color}</span>
        </div>
        {rgb && (
          <div className="app-tool-result-item">
            <span className="app-tool-result-label">RGB:</span>
            <span className="app-tool-result-value">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
          </div>
        )}
        {hsl && (
          <div className="app-tool-result-item">
            <span className="app-tool-result-label">HSL:</span>
            <span className="app-tool-result-value">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
          </div>
        )}
      </div>
    </div>
  )
})

const TimestampConverter = memo(function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('')
  const [date, setDate] = useState('')
  
  const handleTimestampToDate = useCallback(() => {
    const ts = parseInt(timestamp)
    if (!isNaN(ts)) {
      const d = new Date(ts * 1000)
      setDate(d.toLocaleString('zh-CN'))
    }
  }, [timestamp])
  
  const handleDateToTimestamp = useCallback(() => {
    const d = new Date(date)
    if (!isNaN(d.getTime())) {
      setTimestamp(Math.floor(d.getTime() / 1000).toString())
    }
  }, [date])
  
  const handleNow = useCallback(() => {
    const now = Math.floor(Date.now() / 1000)
    setTimestamp(now.toString())
    setDate(new Date().toLocaleString('zh-CN'))
  }, [])
  
  return (
    <div className="app-tool-panel">
      <h3>时间戳转换工具</h3>
      <div className="app-tool-row">
        <label>时间戳 (秒): </label>
        <input
          type="text"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          className="app-tool-text-input"
          placeholder="输入时间戳"
        />
        <button className="app-tool-btn" onClick={handleTimestampToDate}>转换</button>
      </div>
      <div className="app-tool-row">
        <label>日期时间: </label>
        <input
          type="text"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="app-tool-text-input"
          placeholder="输入日期时间"
        />
        <button className="app-tool-btn" onClick={handleDateToTimestamp}>转换</button>
      </div>
      <div className="app-tool-actions">
        <button className="app-tool-btn" onClick={handleNow}>获取当前时间</button>
      </div>
    </div>
  )
})

export default function WebDevToolkit() {
  const [activeTool, setActiveTool] = useState<string>('json')
  
  const renderTool = () => {
    switch (activeTool) {
      case 'json': return <JSONFormatter />
      case 'base64': return <Base64Tool />
      case 'hash': return <HashTool />
      case 'url': return <URLTool />
      case 'uuid': return <UUIDGenerator />
      case 'color': return <ColorConverter />
      case 'timestamp': return <TimestampConverter />
      default: return <JSONFormatter />
    }
  }
  
  return (
    <div className="app-container app-web-dev-toolkit">
      <div className="app-toolkit-sidebar">
        <div className="app-toolkit-sidebar-header">
          <h2>开发工具箱</h2>
        </div>
        <div className="app-toolkit-tools-list">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`app-toolkit-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="app-toolkit-tool-icon">{tool.icon}</span>
              <span className="app-toolkit-tool-name">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="app-toolkit-content">
        {renderTool()}
      </div>
    </div>
  )
}