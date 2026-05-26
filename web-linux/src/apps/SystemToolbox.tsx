import { useState, useCallback, memo } from 'react'

const TOOLS = [
  { id: 'uuid', name: 'UUID生成器', icon: '🔑', category: '开发工具' },
  { id: 'hash', name: 'Hash计算器', icon: '🔐', category: '开发工具' },
  { id: 'jwt', name: 'JWT解码器', icon: '🎫', category: '开发工具' },
  { id: 'cron', name: 'Cron表达式', icon: '⏰', category: '开发工具' },
  { id: 'color', name: '颜色转换', icon: '🎨', category: '开发工具' },
  { id: 'time', name: '时间戳转换', icon: '🕐', category: '开发工具' },
  { id: 'base64', name: 'Base64工具', icon: '📝', category: '开发工具' },
  { id: 'url', name: 'URL编码/解码', icon: '🔗', category: '开发工具' },
  { id: 'qr', name: '二维码生成', icon: '📱', category: '实用工具' },
  { id: 'barcode', name: '条形码生成', icon: '📊', category: '实用工具' },
  { id: 'password', name: '密码生成器', icon: '🔒', category: '实用工具' },
  { id: 'random', name: '随机数生成', icon: '🎲', category: '实用工具' },
]

export default memo(function SystemToolbox() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [options] = useState<Record<string, any>>({})

  const generateUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }, [])

  const computeHash = useCallback((text: string, algorithm: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    return crypto.subtle.digest(algorithm, data).then((hash) => {
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    })
  }, [])

  const decodeJWT = useCallback((token: string) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return { error: '无效的JWT格式' }
      
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      return { header, payload }
    } catch {
      return { error: '解码失败' }
    }
  }, [])

  const parseCron = useCallback((expression: string) => {
    const parts = expression.trim().split(/\s+/)
    if (parts.length < 5) return { error: '无效的Cron表达式' }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    return {
      minute: minute === '*' ? '每分钟' : `在第 ${minute} 分钟`,
      hour: hour === '*' ? '每小时' : `在 ${hour} 点`,
      dayOfMonth: dayOfMonth === '*' ? '每天' : `在每月第 ${dayOfMonth} 天`,
      month: month === '*' ? '每月' : `在第 ${month} 月`,
      dayOfWeek: dayOfWeek === '*' ? '每天' : `在星期 ${dayOfWeek}`,
    }
  }, [])

  const convertColor = useCallback((color: string, format: string) => {
    const hex = color.replace('#', '')
    if (format === 'rgb') {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgb(${r}, ${g}, ${b})`
    } else if (format === 'hsl') {
      const r = parseInt(hex.substring(0, 2), 16) / 255
      const g = parseInt(hex.substring(2, 4), 16) / 255
      const b = parseInt(hex.substring(4, 6), 16) / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    }
    return color
  }, [])

  const convertTimestamp = useCallback((timestamp: number | string) => {
    const num = parseInt(String(timestamp))
    const date = new Date(num > 9999999999 ? num : num * 1000)
    return {
      date: date.toLocaleString('zh-CN'),
      unix: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
      iso: date.toISOString(),
    }
  }, [])

  const encodeBase64 = useCallback((text: string, decode: boolean) => {
    if (decode) {
      try {
        return atob(text)
      } catch {
        return '解码失败'
      }
    }
    return btoa(text)
  }, [])

  const encodeURL = useCallback((text: string, decode: boolean) => {
    if (decode) {
      try {
        return decodeURIComponent(text)
      } catch {
        return '解码失败'
      }
    }
    return encodeURIComponent(text)
  }, [])

  const generateQR = useCallback((text: string) => {
    const size = options.size || 200
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
  }, [options])

  const generatePassword = useCallback((length: number, options: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean }) => {
    let chars = ''
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (options.numbers) chars += '0123456789'
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }, [])

  const generateRandom = useCallback((min: number, max: number, count: number) => {
    const numbers = []
    for (let i = 0; i < count; i++) {
      numbers.push(Math.floor(Math.random() * (max - min + 1)) + min)
    }
    return numbers.join(', ')
  }, [])

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setOutput('请输入内容')
      return
    }

    switch (selectedTool) {
      case 'uuid':
        setOutput(generateUUID())
        break
      case 'hash':
        computeHash(input, options.algorithm || 'SHA-256').then(setOutput)
        break
      case 'jwt':
        setOutput(JSON.stringify(decodeJWT(input), null, 2))
        break
      case 'cron':
        setOutput(JSON.stringify(parseCron(input), null, 2))
        break
      case 'color':
        setOutput(convertColor(input, options.format || 'rgb'))
        break
      case 'time':
        setOutput(JSON.stringify(convertTimestamp(input), null, 2))
        break
      case 'base64':
        setOutput(encodeBase64(input, options.decode || false))
        break
      case 'url':
        setOutput(encodeURL(input, options.decode || false))
        break
      case 'qr':
        setOutput(generateQR(input))
        break
      case 'password':
        setOutput(generatePassword(options.length || 16, options))
        break
      case 'random':
        setOutput(generateRandom(options.min || 1, options.max || 100, options.count || 1))
        break
      default:
        setOutput('请选择一个工具')
    }
  }, [input, selectedTool, options, generateUUID, computeHash, decodeJWT, parseCron, convertColor, convertTimestamp, encodeBase64, encodeURL, generateQR, generatePassword, generateRandom])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', padding: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            style={{
              padding: '12px',
              background: selectedTool === tool.id ? 'var(--accent-color)' : 'var(--button-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              color: 'var(--text-color)',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '24px' }}>{tool.icon}</span>
            <span>{tool.name}</span>
          </button>
        ))}
      </div>

      {selectedTool && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入内容..."
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--input-bg)',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '14px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
            />
            <button
              onClick={handleProcess}
              style={{
                padding: '10px 24px',
                background: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              执行
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: '12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            color: 'var(--text-color)',
            fontFamily: 'monospace',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
          }}>
            {output || '输出结果将显示在这里'}
          </div>
        </div>
      )}
    </div>
  )
})
