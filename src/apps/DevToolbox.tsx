import { useState, useCallback } from 'react'

type ToolType = 'base64' | 'json' | 'url' | 'uuid' | 'timestamp' | 'regex' | 'color' | 'hash'

interface Tool {
  id: ToolType
  name: string
  icon: string
}

const TOOLS: Tool[] = [
  { id: 'base64', name: 'Base64', icon: '🔤' },
  { id: 'json', name: 'JSON', icon: '📋' },
  { id: 'url', name: 'URL', icon: '🔗' },
  { id: 'uuid', name: 'UUID', icon: '🔑' },
  { id: 'timestamp', name: '时间戳', icon: '⏰' },
  { id: 'regex', name: '正则', icon: '🔍' },
  { id: 'color', name: '颜色', icon: '🎨' },
  { id: 'hash', name: 'Hash', icon: '🔐' },
]

export default function DevToolbox() {
  const [activeTool, setActiveTool] = useState<ToolType>('base64')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Base64 工具
  const handleBase64 = useCallback((action: 'encode' | 'decode') => {
    setError(null)
    try {
      if (action === 'encode') {
        setOutput(btoa(input))
      } else {
        setOutput(atob(input))
      }
    } catch (err) {
      setError('转换失败: 输入格式不正确')
      setOutput('')
    }
  }, [input])

  // JSON 工具
  const handleJSON = useCallback((action: 'format' | 'minify' | 'validate') => {
    setError(null)
    try {
      const parsed = JSON.parse(input)
      if (action === 'format') {
        setOutput(JSON.stringify(parsed, null, 2))
      } else if (action === 'minify') {
        setOutput(JSON.stringify(parsed))
      } else {
        setOutput('JSON 格式有效 ✓')
      }
    } catch (err) {
      setError('JSON 解析失败: ' + (err instanceof Error ? err.message : '格式不正确'))
      setOutput('')
    }
  }, [input])

  // URL 工具
  const handleURL = useCallback((action: 'encode' | 'decode') => {
    setError(null)
    try {
      if (action === 'encode') {
        setOutput(encodeURIComponent(input))
      } else {
        setOutput(decodeURIComponent(input))
      }
    } catch (err) {
      setError('URL 转换失败')
      setOutput('')
    }
  }, [input])

  // UUID 生成
  const generateUUID = useCallback(() => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    setOutput(uuid)
    setError(null)
  }, [])

  // 时间戳工具
  const handleTimestamp = useCallback((action: 'to-date' | 'to-timestamp' | 'now') => {
    setError(null)
    try {
      if (action === 'now') {
        setOutput(Date.now().toString())
      } else if (action === 'to-date') {
        const ts = parseInt(input)
        if (isNaN(ts)) {
          setError('请输入有效的时间戳数字')
          return
        }
        const date = new Date(ts)
        setOutput(date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }))
      } else if (action === 'to-timestamp') {
        const date = new Date(input)
        if (isNaN(date.getTime())) {
          setError('请输入有效的日期格式')
          return
        }
        setOutput(date.getTime().toString())
      }
    } catch (err) {
      setError('转换失败')
    }
  }, [input])

  // 正则测试
  const handleRegex = useCallback(() => {
    setError(null)
    try {
      const parts = input.split('\n')
      if (parts.length < 2) {
        setError('请输入正则表达式和测试文本（用换行分隔）')
        return
      }
      const pattern = parts[0]
      const text = parts.slice(1).join('\n')
      const regex = new RegExp(pattern, 'g')
      const matches = text.match(regex) || []
      if (matches.length === 0) {
        setOutput('无匹配结果')
      } else {
        setOutput(`匹配到 ${matches.length} 个结果:\n${matches.map(m => `"${m}"`).join('\n')}`)
      }
    } catch (err) {
      setError('正则表达式无效: ' + (err instanceof Error ? err.message : ''))
    }
  }, [input])

  // 颜色转换
  const handleColor = useCallback((action: 'hex-to-rgb' | 'rgb-to-hex') => {
    setError(null)
    try {
      if (action === 'hex-to-rgb') {
        const hex = input.replace('#', '')
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
          setError('请输入有效的HEX颜色 (如 #FF0000)')
          return
        }
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        setOutput(`RGB(${r}, ${g}, ${b})`)
      } else {
        const match = input.match(/rgb\?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
        if (!match) {
          setError('请输入有效的RGB颜色 (如 RGB(255, 0, 0))')
          return
        }
        const r = parseInt(match[1]).toString(16).padStart(2, '0')
        const g = parseInt(match[2]).toString(16).padStart(2, '0')
        const b = parseInt(match[3]).toString(16).padStart(2, '0')
        setOutput(`#${r}${g}${b}`)
      }
    } catch (err) {
      setError('颜色转换失败')
    }
  }, [input])

  // 简单Hash (非加密用途)
  const handleHash = useCallback(() => {
    setError(null)
    // 简单的字符串hash (用于非加密场景)
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    setOutput(`简单Hash: ${hash.toString(16)}\n长度: ${input.length} 字符\n字节数: ${new Blob([input]).size} bytes`)
  }, [input])

  const handleAction = (action: string) => {
    switch (activeTool) {
      case 'base64':
        handleBase64(action as 'encode' | 'decode')
        break
      case 'json':
        handleJSON(action as 'format' | 'minify' | 'validate')
        break
      case 'url':
        handleURL(action as 'encode' | 'decode')
        break
      case 'uuid':
        generateUUID()
        break
      case 'timestamp':
        handleTimestamp(action as 'to-date' | 'to-timestamp' | 'now')
        break
      case 'regex':
        handleRegex()
        break
      case 'color':
        handleColor(action as 'hex-to-rgb' | 'rgb-to-hex')
        break
      case 'hash':
        handleHash()
        break
    }
  }

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output)
    }
  }

  const clearAll = () => {
    setInput('')
    setOutput('')
    setError(null)
  }

  const getToolActions = (): { label: string; action: string }[] => {
    switch (activeTool) {
      case 'base64':
        return [{ label: '编码', action: 'encode' }, { label: '解码', action: 'decode' }]
      case 'json':
        return [{ label: '格式化', action: 'format' }, { label: '压缩', action: 'minify' }, { label: '验证', action: 'validate' }]
      case 'url':
        return [{ label: '编码', action: 'encode' }, { label: '解码', action: 'decode' }]
      case 'uuid':
        return [{ label: '生成', action: 'generate' }]
      case 'timestamp':
        return [{ label: '转日期', action: 'to-date' }, { label: '转时间戳', action: 'to-timestamp' }, { label: '当前时间', action: 'now' }]
      case 'regex':
        return [{ label: '测试', action: 'test' }]
      case 'color':
        return [{ label: 'HEX→RGB', action: 'hex-to-rgb' }, { label: 'RGB→HEX', action: 'rgb-to-hex' }]
      case 'hash':
        return [{ label: '计算', action: 'calculate' }]
      default:
        return []
    }
  }

  return (
    <div className="app-container" style={{ 
      background: 'var(--window-bg)', 
      padding: 16, 
      overflow: 'auto',
      height: '100%'
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          🔧 开发者工具箱
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          常用编码转换工具
        </div>
      </div>

      {/* 工具选择 */}
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id)
              clearAll()
            }}
            style={{
              padding: '8px 12px',
              background: activeTool === tool.id ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 6,
              color: activeTool === tool.id ? '#fff' : 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {tool.icon} {tool.name}
          </button>
        ))}
      </div>

      {/* 输入区域 */}
      {activeTool !== 'uuid' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
            输入
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeTool === 'regex' 
                ? '输入正则表达式（第一行）\n然后输入测试文本（第二行开始）'
                : '请输入内容...'
            }
            style={{
              width: '100%',
              minHeight: 100,
              padding: '10px 12px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {getToolActions().map(btn => (
          <button
            key={btn.action}
            onClick={() => handleAction(btn.action)}
            style={{
              padding: '10px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            {btn.label}
          </button>
        ))}
        <button
          onClick={clearAll}
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--window-border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          清除
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{ 
          padding: '10px 12px',
          background: 'rgba(244,71,71,0.1)',
          borderRadius: 8,
          color: '#f44747',
          fontSize: 13,
          marginBottom: 12
        }}>
          {error}
        </div>
      )}

      {/* 输出区域 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
          输出
        </label>
        <textarea
          value={output}
          readOnly
          style={{
            width: '100%',
            minHeight: 100,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--window-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'monospace',
          }}
        />
        {output && (
          <button
            onClick={copyOutput}
            style={{
              marginTop: 8,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--window-border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            📋 复制结果
          </button>
        )}
      </div>

      {/* 工具说明 */}
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: 8, 
        padding: 12,
        fontSize: 12,
        color: 'var(--text-secondary)'
      }}>
        {activeTool === 'base64' && 'Base64 编码/解码工具，用于文本与Base64格式转换'}
        {activeTool === 'json' && 'JSON 格式化/压缩/验证工具'}
        {activeTool === 'url' && 'URL 编码/解码工具，处理URL特殊字符'}
        {activeTool === 'uuid' && 'UUID 生成器，生成唯一标识符'}
        {activeTool === 'timestamp' && '时间戳转换工具，支持时间戳与日期格式转换'}
        {activeTool === 'regex' && '正则表达式测试工具，第一行输入正则，后续输入测试文本'}
        {activeTool === 'color' && '颜色转换工具，支持HEX与RGB格式互转'}
        {activeTool === 'hash' && '简单Hash计算（非加密用途）'}
      </div>
    </div>
  )
}