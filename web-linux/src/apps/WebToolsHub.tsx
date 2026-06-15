import { useState, memo, useEffect } from 'react'

interface Tool {
  id: string
  name: string
  icon: string
  category: string
}

const tools: Tool[] = [
  { id: 'color-picker', name: '颜色选择器', icon: '🎨', category: '设计' },
  { id: 'gradient-generator', name: '渐变生成器', icon: '🌈', category: '设计' },
  { id: 'image-info', name: '图片信息', icon: '🖼️', category: '媒体' },
  { id: 'screen-info', name: '屏幕信息', icon: '🖥️', category: '系统' },
  { id: 'browser-info', name: '浏览器信息', icon: '🌐', category: '系统' },
  { id: 'network-speed', name: '网络测速', icon: '⚡', category: '网络' },
  { id: 'ip-info', name: 'IP信息', icon: '📍', category: '网络' },
  { id: 'timestamp', name: '时间戳转换', icon: '⏰', category: '时间' },
  { id: 'world-clock', name: '世界时钟', icon: '🌍', category: '时间' },
  { id: 'lorem-ipsum', name: '文本生成', icon: '📝', category: '文本' },
  { id: 'word-counter', name: '字数统计', icon: '📊', category: '文本' },
  { id: 'uuid-generator', name: 'UUID生成', icon: '🔑', category: '开发' },
  { id: 'hash-generator', name: 'Hash生成', icon: '🔒', category: '开发' },
  { id: 'jwt-decoder', name: 'JWT解码', icon: '🔓', category: '开发' },
  { id: 'mime-types', name: 'MIME类型', icon: '📋', category: '开发' },
  { id: 'http-status', name: 'HTTP状态码', icon: '📡', category: '开发' },
]

const categories = ['全部', '设计', '媒体', '系统', '网络', '时间', '文本', '开发']

// 颜色选择器组件
function ColorPickerTool() {
  const [color, setColor] = useState('#6366f1')
  const [format, setFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex')
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }
  
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
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
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }
  
  const rgb = hexToRgb(color)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  
  const getColorString = () => {
    switch (format) {
      case 'rgb': return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      case 'hsl': return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
      default: return color
    }
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 100, height: 100, cursor: 'pointer', borderRadius: 8 }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['hex', 'rgb', 'hsl'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: format === f ? '#6366f1' : '#374151',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      
      <div style={{
        padding: 16,
        background: '#1f2937',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 14
      }}>
        <div style={{ marginBottom: 8 }}>
          <strong>颜色值:</strong> {getColorString()}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>HEX:</strong> {color}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>RGB:</strong> {rgb.r}, {rgb.g}, {rgb.b}
        </div>
        <div>
          <strong>HSL:</strong> {hsl.h}°, {hsl.s}%, {hsl.l}%
        </div>
      </div>
      
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'].map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: c,
              border: color === c ? '2px solid #fff' : 'none',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </div>
  )
}

// 渐变生成器
function GradientGeneratorTool() {
  const [colors, setColors] = useState(['#6366f1', '#ec4899'])
  const [angle, setAngle] = useState(135)
  const [type, setType] = useState<'linear' | 'radial'>('linear')
  
  const gradientCSS = type === 'linear' 
    ? `linear-gradient(${angle}deg, ${colors.join(', ')})`
    : `radial-gradient(circle, ${colors.join(', ')})`
  
  const addColor = () => {
    if (colors.length < 5) {
      const newColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
      setColors([...colors, newColor])
    }
  }
  
  const removeColor = (index: number) => {
    if (colors.length > 2) {
      setColors(colors.filter((_, i) => i !== index))
    }
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        height: 200,
        borderRadius: 12,
        background: gradientCSS,
        marginBottom: 20
      }} />
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>类型:</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['linear', 'radial'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: type === t ? '#6366f1' : '#374151',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {t === 'linear' ? '线性' : '径向'}
            </button>
          ))}
        </div>
      </div>
      
      {type === 'linear' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14 }}>角度: {angle}°</div>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>颜色:</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {colors.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="color"
                value={c}
                onChange={(e) => {
                  const newColors = [...colors]
                  newColors[i] = e.target.value
                  setColors(newColors)
                }}
                style={{ width: 40, height: 40, cursor: 'pointer', borderRadius: 6 }}
              />
              {colors.length > 2 && (
                <button
                  onClick={() => removeColor(i)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {colors.length < 5 && (
            <button
              onClick={addColor}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#374151',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              + 添加
            </button>
          )}
        </div>
      </div>
      
      <div style={{
        padding: 16,
        background: '#1f2937',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        overflow: 'auto'
      }}>
        <strong>CSS:</strong> background: {gradientCSS};
      </div>
    </div>
  )
}

// 屏幕信息
function ScreenInfoTool() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        padding: 16,
        background: '#1f2937',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13
      }}>
        <div style={{ marginBottom: 12 }}>
          <strong>屏幕尺寸:</strong> {screen.width} × {screen.height} px
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>可用尺寸:</strong> {screen.availWidth} × {screen.availHeight} px
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>颜色深度:</strong> {screen.colorDepth} bit
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>像素深度:</strong> {screen.pixelDepth} bit
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>设备像素比:</strong> {window.devicePixelRatio}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>窗口尺寸:</strong> {window.innerWidth} × {window.innerHeight} px
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>文档尺寸:</strong> {document.documentElement.scrollWidth} × {document.documentElement.scrollHeight} px
        </div>
        <div>
          <strong>屏幕方向:</strong> {screen.width > screen.height ? '横向' : '纵向'}
        </div>
      </div>
    </div>
  )
}

// 浏览器信息
function BrowserInfoTool() {
  const ua = navigator.userAgent
  
  const getBrowser = () => {
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    if (ua.includes('Opera')) return 'Opera'
    return 'Unknown'
  }
  
  const getOS = () => {
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'MacOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS'
    return 'Unknown'
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        padding: 16,
        background: '#1f2937',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13
      }}>
        <div style={{ marginBottom: 12 }}>
          <strong>浏览器:</strong> {getBrowser()}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>操作系统:</strong> {getOS()}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>语言:</strong> {navigator.language}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>平台:</strong> {navigator.platform}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Cookie启用:</strong> {navigator.cookieEnabled ? '是' : '否'}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>在线状态:</strong> {navigator.onLine ? '在线' : '离线'}
        </div>
        <div style={{ marginBottom: 12, wordBreak: 'break-all' }}>
          <strong>User Agent:</strong>
          <div style={{ marginTop: 4, fontSize: 11, color: '#9ca3af' }}>{ua}</div>
        </div>
      </div>
    </div>
  )
}

// 网络测速
function NetworkSpeedTool() {
  const [speed, setSpeed] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  
  const testSpeed = async () => {
    setTesting(true)
    setSpeed(null)
    
    const startTime = performance.now()
    try {
      // 使用一个公开的图片进行测速
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-store'
      })
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 简单估算延迟
      setSpeed(Math.round(duration))
    } catch {
      setSpeed(null)
    }
    setTesting(false)
  }
  
  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={testSpeed}
        disabled={testing}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: testing ? '#374151' : '#6366f1',
          color: '#fff',
          cursor: testing ? 'not-allowed' : 'pointer',
          fontSize: 14
        }}
      >
        {testing ? '测试中...' : '开始测速'}
      </button>
      
      {speed !== null && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: '#1f2937',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: speed < 100 ? '#22c55e' : speed < 500 ? '#eab308' : '#ef4444' }}>
            {speed} ms
          </div>
          <div style={{ marginTop: 8, color: '#9ca3af' }}>
            网络延迟
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
            {speed < 100 ? '网络状态良好' : speed < 500 ? '网络状态一般' : '网络状态较差'}
          </div>
        </div>
      )}
    </div>
  )
}

// IP信息
function IPInfoTool() {
  const [ipInfo, setIpInfo] = useState<{
    ip: string
    city?: string
    country?: string
    org?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchIP = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      setIpInfo({ ip: data.ip })
      
      // 尝试获取更多信息
      try {
        const infoResponse = await fetch(`https://ipapi.co/${data.ip}/json/`)
        const infoData = await infoResponse.json()
        setIpInfo({
          ip: data.ip,
          city: infoData.city,
          country: infoData.country_name,
          org: infoData.org
        })
      } catch {
        // 如果详细信息获取失败，只显示IP
      }
    } catch {
      setError('获取IP信息失败')
    }
    setLoading(false)
  }
  
  useEffect(() => {
    fetchIP()
  }, [])
  
  return (
    <div style={{ padding: 20 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32 }}>⏳</div>
          <div style={{ marginTop: 8 }}>获取中...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ marginTop: 8 }}>{error}</div>
          <button
            onClick={fetchIP}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      ) : ipInfo ? (
        <div style={{
          padding: 16,
          background: '#1f2937',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 13
        }}>
          <div style={{ marginBottom: 12 }}>
            <strong>IP地址:</strong> {ipInfo.ip}
          </div>
          {ipInfo.city && (
            <div style={{ marginBottom: 12 }}>
              <strong>城市:</strong> {ipInfo.city}
            </div>
          )}
          {ipInfo.country && (
            <div style={{ marginBottom: 12 }}>
              <strong>国家:</strong> {ipInfo.country}
            </div>
          )}
          {ipInfo.org && (
            <div>
              <strong>运营商:</strong> {ipInfo.org}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

// 时间戳转换
function TimestampTool() {
  const [timestamp, setTimestamp] = useState<string>(String(Math.floor(Date.now() / 1000)))
  const [date, setDate] = useState<string>(new Date().toISOString())
  
  const convertTimestamp = (ts: string) => {
    const num = parseInt(ts)
    if (!isNaN(num)) {
      const d = new Date(num * 1000)
      setDate(d.toLocaleString('zh-CN') + '\n' + d.toISOString())
    }
  }
  
  const convertDate = (d: string) => {
    const dateObj = new Date(d)
    if (!isNaN(dateObj.getTime())) {
      setTimestamp(String(Math.floor(dateObj.getTime() / 1000)))
    }
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>时间戳 (秒):</div>
        <input
          type="text"
          value={timestamp}
          onChange={(e) => {
            setTimestamp(e.target.value)
            convertTimestamp(e.target.value)
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#fff',
            fontFamily: 'monospace'
          }}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>日期时间:</div>
        <textarea
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            convertDate(e.target.value.split('\n')[0])
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#fff',
            fontFamily: 'monospace',
            minHeight: 80,
            resize: 'none'
          }}
        />
      </div>
      
      <button
        onClick={() => {
          const now = Math.floor(Date.now() / 1000)
          setTimestamp(String(now))
          convertTimestamp(String(now))
        }}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: '#6366f1',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        当前时间
      </button>
    </div>
  )
}

// 世界时钟
function WorldClockTool() {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  const cities = [
    { name: '北京', offset: 8, timezone: 'Asia/Shanghai' },
    { name: '东京', offset: 9, timezone: 'Asia/Tokyo' },
    { name: '纽约', offset: -5, timezone: 'America/New_York' },
    { name: '伦敦', offset: 0, timezone: 'Europe/London' },
    { name: '巴黎', offset: 1, timezone: 'Europe/Paris' },
    { name: '悉尼', offset: 11, timezone: 'Australia/Sydney' },
    { name: '莫斯科', offset: 3, timezone: 'Europe/Moscow' },
    { name: '迪拜', offset: 4, timezone: 'Asia/Dubai' },
  ]
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12
      }}>
        {cities.map(city => {
          const cityTime = new Date(time.getTime() + (city.offset - time.getTimezoneOffset() / -60) * 3600000)
          return (
            <div key={city.name} style={{
              padding: 16,
              background: '#1f2937',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>{city.name}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {cityTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                UTC{city.offset >= 0 ? '+' : ''}{city.offset}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 文本生成
function LoremIpsumTool() {
  const [paragraphs, setParagraphs] = useState(3)
  const [text, setText] = useState('')
  const [type, setType] = useState<'chinese' | 'english'>('chinese')
  
  const chineseTexts = [
    '这是一段示例文本，用于展示和测试排版效果。在实际使用中，您可以替换为任何需要的内容。',
    '文本的长度和内容可以根据需要进行调整。这里提供的是一段通用的占位文本，方便您进行各种测试。',
    '在设计和开发过程中，占位文本是非常有用的工具。它可以帮助您预览最终效果，而不需要真实内容。',
    '好的排版能够提升阅读体验，让内容更加易于理解。字体、行高、段落间距都是重要的排版要素。',
    '现代网页设计注重用户体验，清晰的内容层次和合理的间距布局是关键因素。',
  ]
  
  const englishTexts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
  ]
  
  const generate = () => {
    const source = type === 'chinese' ? chineseTexts : englishTexts
    const result = []
    for (let i = 0; i < paragraphs; i++) {
      result.push(source[i % source.length])
    }
    setText(result.join('\n\n'))
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 8, fontSize: 14 }}>段落数:</div>
          <input
            type="number"
            min={1}
            max={10}
            value={paragraphs}
            onChange={(e) => setParagraphs(Number(e.target.value))}
            style={{
              width: 80,
              padding: '8px',
              borderRadius: 6,
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#fff'
            }}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, fontSize: 14 }}>语言:</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'chinese' | 'english')}
            style={{
              padding: '8px',
              borderRadius: 6,
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#fff'
            }}
          >
            <option value="chinese">中文</option>
            <option value="english">英文</option>
          </select>
        </div>
        <button
          onClick={generate}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            cursor: 'pointer',
            marginTop: 22
          }}
        >
          生成
        </button>
      </div>
      
      {text && (
        <div style={{
          padding: 16,
          background: '#1f2937',
          borderRadius: 8,
          maxHeight: 300,
          overflow: 'auto'
        }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{text}</pre>
        </div>
      )}
    </div>
  )
}

// 字数统计
function WordCounterTool() {
  const [text, setText] = useState('')
  
  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length,
  }
  
  return (
    <div style={{ padding: 20 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入文本进行统计..."
        style={{
          width: '100%',
          minHeight: 150,
          padding: 12,
          borderRadius: 8,
          border: '1px solid #374151',
          background: '#1f2937',
          color: '#fff',
          resize: 'vertical',
          marginBottom: 16
        }}
      />
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12
      }}>
        <div style={{ padding: 12, background: '#1f2937', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.characters}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>字符数</div>
        </div>
        <div style={{ padding: 12, background: '#1f2937', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.charactersNoSpaces}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>不含空格</div>
        </div>
        <div style={{ padding: 12, background: '#1f2937', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.words}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>单词数</div>
        </div>
        <div style={{ padding: 12, background: '#1f2937', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.lines}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>行数</div>
        </div>
        <div style={{ padding: 12, background: '#1f2937', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.paragraphs}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>段落数</div>
        </div>
      </div>
    </div>
  )
}

// UUID生成
function UUIDGeneratorTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  const generate = () => {
    const newUuids = Array.from({ length: count }, () => generateUUID())
    setUuids(newUuids)
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 8, fontSize: 14 }}>数量:</div>
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{
              width: 80,
              padding: '8px',
              borderRadius: 6,
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#fff'
            }}
          />
        </div>
        <button
          onClick={generate}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            cursor: 'pointer',
            marginTop: 22
          }}
        >
          生成
        </button>
      </div>
      
      {uuids.length > 0 && (
        <div style={{
          padding: 16,
          background: '#1f2937',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 13
        }}>
          {uuids.map((uuid, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              marginBottom: 8,
              background: '#111827',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{uuid}</span>
              <button
                onClick={() => navigator.clipboard.writeText(uuid)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#374151',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                复制
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Hash生成
function HashGeneratorTool() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<{ md5: string; sha256: string } | null>(null)
  
  // 简单的MD5实现（仅用于演示）
  const simpleHash = () => {
    // 使用Web Crypto API
    return '演示Hash（实际需要Web Crypto API）'
  }
  
  const generate = async () => {
    if (!input) return
    
    // 使用Web Crypto API生成SHA-256
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      // MD5需要额外实现，这里用简单替代
      const md5 = sha256.substring(0, 32) // 仅作为演示
      
      setHashes({ md5, sha256 })
    } catch {
      setHashes({
        md5: simpleHash(),
        sha256: simpleHash()
      })
    }
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>输入文本:</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要计算Hash的文本..."
          style={{
            width: '100%',
            minHeight: 100,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#fff',
            resize: 'vertical'
          }}
        />
      </div>
      
      <button
        onClick={generate}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: '#6366f1',
          color: '#fff',
          cursor: 'pointer',
          marginBottom: 16
        }}
      >
        计算Hash
      </button>
      
      {hashes && (
        <div style={{
          padding: 16,
          background: '#1f2937',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 12
        }}>
          <div style={{ marginBottom: 12 }}>
            <strong>SHA-256:</strong>
            <div style={{ marginTop: 4, wordBreak: 'break-all', color: '#22c55e' }}>{hashes.sha256}</div>
          </div>
          <div>
            <strong>MD5 (演示):</strong>
            <div style={{ marginTop: 4, wordBreak: 'break-all', color: '#eab308' }}>{hashes.md5}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// JWT解码
function JWTDecoderTool() {
  const [jwt, setJwt] = useState('')
  const [decoded, setDecoded] = useState<{ header: object; payload: object } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const decode = () => {
    setError(null)
    setDecoded(null)
    
    try {
      const parts = jwt.split('.')
      if (parts.length !== 3) {
        throw new Error('JWT格式错误，应包含3个部分')
      }
      
      const decodeBase64 = (str: string) => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        const json = atob(base64)
        return JSON.parse(json)
      }
      
      setDecoded({
        header: decodeBase64(parts[0]),
        payload: decodeBase64(parts[1])
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '解码失败')
    }
  }
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>JWT Token:</div>
        <textarea
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="输入JWT token..."
          style={{
            width: '100%',
            minHeight: 80,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#fff',
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: 12
          }}
        />
      </div>
      
      <button
        onClick={decode}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: '#6366f1',
          color: '#fff',
          cursor: 'pointer',
          marginBottom: 16
        }}
      >
        解码
      </button>
      
      {error && (
        <div style={{
          padding: 16,
          background: 'rgba(239,68,68,0.1)',
          borderRadius: 8,
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}
      
      {decoded && (
        <div style={{
          padding: 16,
          background: '#1f2937',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 12
        }}>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: '#22c55e' }}>Header:</strong>
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
          <div>
            <strong style={{ color: '#6366f1' }}>Payload:</strong>
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// MIME类型参考
function MimeTypesTool() {
  const [search, setSearch] = useState('')
  
  const mimeTypes = [
    { type: '.html', mime: 'text/html' },
    { type: '.css', mime: 'text/css' },
    { type: '.js', mime: 'application/javascript' },
    { type: '.json', mime: 'application/json' },
    { type: '.xml', mime: 'application/xml' },
    { type: '.pdf', mime: 'application/pdf' },
    { type: '.zip', mime: 'application/zip' },
    { type: '.tar', mime: 'application/x-tar' },
    { type: '.jpg', mime: 'image/jpeg' },
    { type: '.jpeg', mime: 'image/jpeg' },
    { type: '.png', mime: 'image/png' },
    { type: '.gif', mime: 'image/gif' },
    { type: '.svg', mime: 'image/svg+xml' },
    { type: '.webp', mime: 'image/webp' },
    { type: '.mp4', mime: 'video/mp4' },
    { type: '.webm', mime: 'video/webm' },
    { type: '.mp3', mime: 'audio/mpeg' },
    { type: '.wav', mime: 'audio/wav' },
    { type: '.ogg', mime: 'audio/ogg' },
    { type: '.txt', mime: 'text/plain' },
    { type: '.md', mime: 'text/markdown' },
    { type: '.csv', mime: 'text/csv' },
    { type: '.doc', mime: 'application/msword' },
    { type: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { type: '.xls', mime: 'application/vnd.ms-excel' },
    { type: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { type: '.ppt', mime: 'application/vnd.ms-powerpoint' },
    { type: '.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  ]
  
  const filtered = mimeTypes.filter(m => 
    m.type.includes(search) || m.mime.includes(search)
  )
  
  return (
    <div style={{ padding: 20 }}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索文件类型或MIME..."
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #374151',
          background: '#1f2937',
          color: '#fff',
          marginBottom: 16
        }}
      />
      
      <div style={{
        maxHeight: 400,
        overflow: 'auto',
        padding: 16,
        background: '#1f2937',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13
      }}>
        {filtered.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: 4,
            background: '#111827',
            borderRadius: 6
          }}>
            <span style={{ color: '#6366f1' }}>{m.type}</span>
            <span style={{ color: '#9ca3af' }}>{m.mime}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// HTTP状态码
function HttpStatusTool() {
  const [search, setSearch] = useState('')
  
  const statusCodes = [
    { code: 200, name: 'OK', desc: '请求成功' },
    { code: 201, name: 'Created', desc: '创建成功' },
    { code: 204, name: 'No Content', desc: '无内容' },
    { code: 301, name: 'Moved Permanently', desc: '永久重定向' },
    { code: 302, name: 'Found', desc: '临时重定向' },
    { code: 304, name: 'Not Modified', desc: '未修改' },
    { code: 400, name: 'Bad Request', desc: '请求错误' },
    { code: 401, name: 'Unauthorized', desc: '未授权' },
    { code: 403, name: 'Forbidden', desc: '禁止访问' },
    { code: 404, name: 'Not Found', desc: '未找到' },
    { code: 405, name: 'Method Not Allowed', desc: '方法不允许' },
    { code: 408, name: 'Request Timeout', desc: '请求超时' },
    { code: 409, name: 'Conflict', desc: '冲突' },
    { code: 410, name: 'Gone', desc: '已删除' },
    { code: 429, name: 'Too Many Requests', desc: '请求过多' },
    { code: 500, name: 'Internal Server Error', desc: '服务器内部错误' },
    { code: 501, name: 'Not Implemented', desc: '未实现' },
    { code: 502, name: 'Bad Gateway', desc: '网关错误' },
    { code: 503, name: 'Service Unavailable', desc: '服务不可用' },
    { code: 504, name: 'Gateway Timeout', desc: '网关超时' },
  ]
  
  const filtered = statusCodes.filter(s =>
    String(s.code).includes(search) || s.name.toLowerCase().includes(search.toLowerCase())
  )
  
  const getColor = (code: number) => {
    if (code >= 200 && code < 300) return '#22c55e'
    if (code >= 300 && code < 400) return '#eab308'
    if (code >= 400 && code < 500) return '#f97316'
    return '#ef4444'
  }
  
  return (
    <div style={{ padding: 20 }}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索状态码..."
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #374151',
          background: '#1f2937',
          color: '#fff',
          marginBottom: 16
        }}
      />
      
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {filtered.map((s, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            marginBottom: 8,
            background: '#1f2937',
            borderRadius: 8
          }}>
            <div style={{
              width: 60,
              textAlign: 'center',
              fontWeight: 'bold',
              color: getColor(s.code)
            }}>
              {s.code}
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const WebToolsHub = memo(function WebToolsHub() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('全部')
  
  const filteredTools = selectedCategory === '全部' 
    ? tools 
    : tools.filter(t => t.category === selectedCategory)
  
  const renderTool = () => {
    switch (selectedTool) {
      case 'color-picker': return <ColorPickerTool />
      case 'gradient-generator': return <GradientGeneratorTool />
      case 'screen-info': return <ScreenInfoTool />
      case 'browser-info': return <BrowserInfoTool />
      case 'network-speed': return <NetworkSpeedTool />
      case 'ip-info': return <IPInfoTool />
      case 'timestamp': return <TimestampTool />
      case 'world-clock': return <WorldClockTool />
      case 'lorem-ipsum': return <LoremIpsumTool />
      case 'word-counter': return <WordCounterTool />
      case 'uuid-generator': return <UUIDGeneratorTool />
      case 'hash-generator': return <HashGeneratorTool />
      case 'jwt-decoder': return <JWTDecoderTool />
      case 'mime-types': return <MimeTypesTool />
      case 'http-status': return <HttpStatusTool />
      default: return null
    }
  }
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#111827',
      color: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 分类导航 */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid #374151',
        overflowX: 'auto'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: selectedCategory === cat ? '#6366f1' : '#374151',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {/* 工具网格 */}
      <div style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
        maxHeight: selectedTool ? 150 : 'none',
        overflow: selectedTool ? 'auto' : 'visible'
      }}>
        {filteredTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            style={{
              padding: 16,
              borderRadius: 12,
              border: selectedTool === tool.id ? '2px solid #6366f1' : '1px solid #374151',
              background: selectedTool === tool.id ? '#1f2937' : '#1f2937',
              color: '#f3f4f6',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{tool.icon}</div>
            <div style={{ fontSize: 13 }}>{tool.name}</div>
          </button>
        ))}
      </div>
      
      {/* 工具内容 */}
      {selectedTool && (
        <div style={{
          flex: 1,
          borderTop: '1px solid #374151',
          overflow: 'auto'
        }}>
          {renderTool()}
        </div>
      )}
      
      {!selectedTool && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>🔧</div>
            <div style={{ marginTop: 12 }}>选择一个工具开始使用</div>
          </div>
        </div>
      )}
    </div>
  )
})

export default WebToolsHub