import { useState, useEffect } from 'react'

const CreativeToolkit = () => {
  const [activeTool, setActiveTool] = useState('palette')
  const [color1, setColor1] = useState('#667eea')
  const [color2, setColor2] = useState('#764ba2')
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')
  const [gradientAngle, setGradientAngle] = useState(135)
  const [asciiInput, setAsciiInput] = useState('Hello!')
  const [asciiArt, setAsciiArt] = useState('')
  const [uuidCount, setUuidCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])
  const [base64Input, setBase64Input] = useState('')
  const [base64Output, setBase64Output] = useState('')
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')
  const [timestampInput, setTimestampInput] = useState('')
  const [timestampOutput, setTimestampOutput] = useState('')

  const generateGradientCSS = () => {
    if (gradientType === 'linear') {
      return `linear-gradient(${gradientAngle}deg, ${color1}, ${color2})`
    } else {
      return `radial-gradient(circle, ${color1}, ${color2})`
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setNotification('已复制到剪贴板！')
  }

  const [notification, setNotification] = useState('')
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const generateAscii = () => {
    const chars = '@%#*+=-:. '
    let result = ''
    const input = asciiInput.toUpperCase()
    
    for (let i = 0; i < 3; i++) {
      let line = ''
      for (let j = 0; j < input.length; j++) {
        const charIndex = Math.floor(Math.random() * chars.length)
        line += chars[charIndex]
      }
      result += line + '\n'
    }
    
    result += '\n'
    result += '  ' + input + '\n'
    result += '\n'
    
    for (let i = 0; i < 3; i++) {
      let line = ''
      for (let j = 0; j < input.length; j++) {
        const charIndex = Math.floor(Math.random() * chars.length)
        line += chars[charIndex]
      }
      result += line + '\n'
    }
    
    setAsciiArt(result)
  }

  const generateUUIDs = () => {
    const newUuids: string[] = []
    for (let i = 0; i < uuidCount; i++) {
      newUuids.push(generateUUID())
    }
    setUuids(newUuids)
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const handleBase64 = () => {
    try {
      if (base64Mode === 'encode') {
        setBase64Output(btoa(unescape(encodeURIComponent(base64Input))))
      } else {
        setBase64Output(decodeURIComponent(escape(atob(base64Input))))
      }
    } catch (e) {
      setBase64Output('错误：无效的输入')
    }
  }

  const getCurrentTimestamp = () => {
    const now = Date.now()
    const date = new Date(now)
    setTimestampInput(String(now))
    setTimestampOutput(`
时间戳 (毫秒): ${now}
时间戳 (秒): ${Math.floor(now / 1000)}
ISO 8601: ${date.toISOString()}
本地时间: ${date.toLocaleString('zh-CN')}
UTC 时间: ${date.toUTCString()}
日期: ${date.toLocaleDateString('zh-CN')}
时间: ${date.toLocaleTimeString('zh-CN')}
    `.trim())
  }

  const convertTimestamp = () => {
    try {
      let timestamp = parseInt(timestampInput)
      if (timestamp < 1000000000000) {
        timestamp *= 1000
      }
      const date = new Date(timestamp)
      setTimestampOutput(`
时间戳 (毫秒): ${timestamp}
时间戳 (秒): ${Math.floor(timestamp / 1000)}
ISO 8601: ${date.toISOString()}
本地时间: ${date.toLocaleString('zh-CN')}
UTC 时间: ${date.toUTCString()}
日期: ${date.toLocaleDateString('zh-CN')}
时间: ${date.toLocaleTimeString('zh-CN')}
      `.trim())
    } catch (e) {
      setTimestampOutput('错误：无效的时间戳')
    }
  }

  useEffect(() => {
    generateAscii()
    generateUUIDs()
  }, [])

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)', background: 'var(--secondary-bg)' }}>
        {[
          { id: 'palette', name: '调色板', icon: '🎨' },
          { id: 'ascii', name: 'ASCII 艺术', icon: '🔤' },
          { id: 'uuid', name: 'UUID 生成', icon: '🔑' },
          { id: 'base64', name: 'Base64', icon: '📦' },
          { id: 'timestamp', name: '时间戳', icon: '⏰' },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTool === tool.id ? 'var(--accent)' : 'transparent',
              color: activeTool === tool.id ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTool === tool.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {tool.icon} {tool.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {activeTool === 'palette' && (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>渐变色生成器</h3>
            
            <div 
              style={{ 
                height: 150, 
                borderRadius: 12, 
                marginBottom: 20,
                background: generateGradientCSS(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              onClick={() => copyToClipboard(generateGradientCSS())}
            >
              <span style={{ color: '#fff', fontSize: 14, opacity: 0.9 }}>点击复制 CSS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>颜色 1</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={color1} 
                    onChange={(e) => setColor1(e.target.value)}
                    style={{ width: 50, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={color1} 
                    onChange={(e) => setColor1(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--window-border)', borderRadius: 6, background: 'var(--secondary-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>颜色 2</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={color2} 
                    onChange={(e) => setColor2(e.target.value)}
                    style={{ width: 50, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={color2} 
                    onChange={(e) => setColor2(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--window-border)', borderRadius: 6, background: 'var(--secondary-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>渐变类型</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setGradientType('linear')}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid ' + (gradientType === 'linear' ? 'var(--accent)' : 'var(--window-border)'),
                    background: gradientType === 'linear' ? 'var(--accent)' : 'var(--secondary-bg)',
                    color: gradientType === 'linear' ? '#fff' : 'var(--text-primary)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  线性渐变
                </button>
                <button
                  onClick={() => setGradientType('radial')}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid ' + (gradientType === 'radial' ? 'var(--accent)' : 'var(--window-border)'),
                    background: gradientType === 'radial' ? 'var(--accent)' : 'var(--secondary-bg)',
                    color: gradientType === 'radial' ? '#fff' : 'var(--text-primary)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  径向渐变
                </button>
              </div>
            </div>

            {gradientType === 'linear' && (
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  角度: {gradientAngle}°
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={gradientAngle} 
                  onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>CSS 代码</label>
              <div style={{ 
                background: 'var(--secondary-bg)', 
                padding: 16, 
                borderRadius: 8, 
                fontFamily: 'monospace', 
                fontSize: 13,
                border: '1px solid var(--window-border)',
                wordBreak: 'break-all',
              }}>
                {generateGradientCSS()}
              </div>
            </div>
          </div>
        )}

        {activeTool === 'ascii' && (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>ASCII 艺术生成器</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>输入文本</label>
              <input 
                type="text" 
                value={asciiInput} 
                onChange={(e) => setAsciiInput(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--window-border)', borderRadius: 8, background: 'var(--secondary-bg)', color: 'var(--text-primary)', fontSize: 14 }}
                onKeyDown={(e) => e.key === 'Enter' && generateAscii()}
              />
            </div>
            <button 
              onClick={generateAscii}
              style={{ 
                padding: '10px 20px', 
                background: 'var(--accent)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              生成 ASCII 艺术
            </button>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>输出</label>
                <button 
                  onClick={() => copyToClipboard(asciiArt)}
                  style={{ 
                    padding: '6px 12px', 
                    background: 'var(--secondary-bg)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--window-border)', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  复制
                </button>
              </div>
              <pre style={{ 
                background: 'var(--secondary-bg)', 
                padding: 16, 
                borderRadius: 8, 
                fontFamily: 'monospace', 
                fontSize: 14,
                border: '1px solid var(--window-border)',
                whiteSpace: 'pre',
                overflow: 'auto',
                maxHeight: 300,
              }}>
                {asciiArt}
              </pre>
            </div>
          </div>
        )}

        {activeTool === 'uuid' && (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>UUID 生成器</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>生成数量:</label>
              <input 
                type="number" 
                min="1" 
                max="50" 
                value={uuidCount} 
                onChange={(e) => setUuidCount(parseInt(e.target.value) || 1)}
                style={{ width: 80, padding: '8px 12px', border: '1px solid var(--window-border)', borderRadius: 6, background: 'var(--secondary-bg)', color: 'var(--text-primary)', fontSize: 13 }}
              />
              <button 
                onClick={generateUUIDs}
                style={{ 
                  padding: '8px 16px', 
                  background: 'var(--accent)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                生成
              </button>
            </div>
            <div style={{ 
              background: 'var(--secondary-bg)', 
              padding: 16, 
              borderRadius: 8, 
              border: '1px solid var(--window-border)',
            }}>
              {uuids.map((uuid, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 0',
                  borderBottom: i < uuids.length - 1 ? '1px solid var(--window-border)' : 'none',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{uuid}</span>
                  <button 
                    onClick={() => copyToClipboard(uuid)}
                    style={{ 
                      padding: '4px 10px', 
                      background: 'transparent', 
                      color: 'var(--text-secondary)', 
                      border: '1px solid var(--window-border)', 
                      borderRadius: 4, 
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    复制
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTool === 'base64' && (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Base64 编解码器</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setBase64Mode('encode')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid ' + (base64Mode === 'encode' ? 'var(--accent)' : 'var(--window-border)'),
                  background: base64Mode === 'encode' ? 'var(--accent)' : 'var(--secondary-bg)',
                  color: base64Mode === 'encode' ? '#fff' : 'var(--text-primary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                编码
              </button>
              <button
                onClick={() => setBase64Mode('decode')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid ' + (base64Mode === 'decode' ? 'var(--accent)' : 'var(--window-border)'),
                  background: base64Mode === 'decode' ? 'var(--accent)' : 'var(--secondary-bg)',
                  color: base64Mode === 'decode' ? '#fff' : 'var(--text-primary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                解码
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                {base64Mode === 'encode' ? '输入文本' : '输入 Base64'}
              </label>
              <textarea 
                value={base64Input} 
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder={base64Mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'}
                style={{ 
                  width: '100%', 
                  minHeight: 100,
                  padding: '10px 14px', 
                  border: '1px solid var(--window-border)', 
                  borderRadius: 8, 
                  background: 'var(--secondary-bg)', 
                  color: 'var(--text-primary)', 
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>
            <button 
              onClick={handleBase64}
              style={{ 
                padding: '10px 20px', 
                background: 'var(--accent)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {base64Mode === 'encode' ? '编码' : '解码'}
            </button>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {base64Mode === 'encode' ? 'Base64 结果' : '文本结果'}
                </label>
                <button 
                  onClick={() => copyToClipboard(base64Output)}
                  style={{ 
                    padding: '6px 12px', 
                    background: 'var(--secondary-bg)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--window-border)', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  复制
                </button>
              </div>
              <pre style={{ 
                background: 'var(--secondary-bg)', 
                padding: 16, 
                borderRadius: 8, 
                fontFamily: 'monospace', 
                fontSize: 13,
                border: '1px solid var(--window-border)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 200,
                overflow: 'auto',
              }}>
                {base64Output}
              </pre>
            </div>
          </div>
        )}

        {activeTool === 'timestamp' && (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>时间戳转换器</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button 
                onClick={getCurrentTimestamp}
                style={{ 
                  padding: '10px 20px', 
                  background: 'var(--accent)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                获取当前时间
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>时间戳（毫秒或秒）</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="text" 
                  value={timestampInput} 
                  onChange={(e) => setTimestampInput(e.target.value)}
                  placeholder="输入时间戳..."
                  style={{ 
                    flex: 1, 
                    padding: '10px 14px', 
                    border: '1px solid var(--window-border)', 
                    borderRadius: 8, 
                    background: 'var(--secondary-bg)', 
                    color: 'var(--text-primary)', 
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
                <button 
                  onClick={convertTimestamp}
                  style={{ 
                    padding: '10px 20px', 
                    background: 'var(--secondary-bg)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--window-border)', 
                    borderRadius: 8, 
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  转换
                </button>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>转换结果</label>
                <button 
                  onClick={() => copyToClipboard(timestampOutput)}
                  style={{ 
                    padding: '6px 12px', 
                    background: 'var(--secondary-bg)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--window-border)', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  复制
                </button>
              </div>
              <pre style={{ 
                background: 'var(--secondary-bg)', 
                padding: 16, 
                borderRadius: 8, 
                fontFamily: 'monospace', 
                fontSize: 13,
                border: '1px solid var(--window-border)',
                whiteSpace: 'pre',
                overflow: 'auto',
                maxHeight: 300,
              }}>
                {timestampOutput}
              </pre>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 14,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          {notification}
        </div>
      )}
    </div>
  )
}

export default CreativeToolkit
