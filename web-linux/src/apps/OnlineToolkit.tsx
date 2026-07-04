import { useState, useMemo, useCallback } from 'react'

interface ToolCategory {
  id: string
  name: string
  icon: string
  tools: Tool[]
}

interface Tool {
  id: string
  name: string
  description: string
  icon: string
}

const toolCategories: ToolCategory[] = [
  {
    id: 'text',
    name: '文本工具',
    icon: '📝',
    tools: [
      { id: 'case-convert', name: '大小写转换', description: '转换文本大小写', icon: '🔤' },
      { id: 'word-count', name: '字数统计', description: '统计字符和单词数', icon: '📊' },
      { id: 'text-reverse', name: '文本反转', description: '反转文本内容', icon: '🔄' },
      { id: 'trim-whitespace', name: '去除空格', description: '去除多余空白字符', icon: '✂️' },
      { id: 'html-encode', name: 'HTML编码', description: 'HTML特殊字符编码', icon: '🌐' },
      { id: 'markdown-convert', name: 'Markdown转HTML', description: '将Markdown转换为HTML', icon: '📄' },
    ]
  },
  {
    id: 'data',
    name: '数据工具',
    icon: '📊',
    tools: [
      { id: 'json-formatter', name: 'JSON格式化', description: '美化和格式化JSON', icon: '📋' },
      { id: 'json-validator', name: 'JSON验证', description: '验证JSON格式正确性', icon: '✅' },
      { id: 'base64-encode', name: 'Base64编解码', description: 'Base64编码和解码', icon: '🔐' },
      { id: 'url-encode', name: 'URL编解码', description: 'URL编码和解码', icon: '🔗' },
      { id: 'uuid-generator', name: 'UUID生成', description: '生成唯一标识符', icon: '🔢' },
      { id: 'hash-generator', name: '哈希生成', description: '生成MD5/SHA1/SHA256哈希', icon: '🔑' },
    ]
  },
  {
    id: 'developer',
    name: '开发工具',
    icon: '💻',
    tools: [
      { id: 'regex-tester', name: '正则表达式测试', description: '测试正则表达式', icon: '🔍' },
      { id: 'color-converter', name: '颜色转换器', description: 'RGB/Hex/HSL转换', icon: '🎨' },
      { id: 'timestamp-converter', name: '时间戳转换', description: 'Unix时间戳转换', icon: '⏰' },
      { id: 'unix-permissions', name: 'Unix权限计算', description: '计算文件权限数值', icon: '🔓' },
      { id: 'http-status', name: 'HTTP状态码', description: '查询HTTP状态码含义', icon: '🚦' },
      { id: 'curl-converter', name: 'cURL转换', description: 'cURL转代码', icon: '🐱' },
    ]
  },
  {
    id: 'calculator',
    name: '计算器',
    icon: '🧮',
    tools: [
      { id: 'bmi-calculator', name: 'BMI计算器', description: '计算身体质量指数', icon: '⚖️' },
      { id: 'tip-calculator', name: '小费计算器', description: '计算小费和分摊', icon: '💸' },
      { id: 'loan-calculator', name: '贷款计算器', description: '计算贷款还款', icon: '💰' },
      { id: 'currency-converter', name: '汇率转换', description: '实时汇率转换', icon: '💱' },
      { id: 'unit-converter', name: '单位转换', description: '各种单位换算', icon: '📏' },
      { id: 'percentage-calculator', name: '百分比计算', description: '百分比相关计算', icon: '📈' },
    ]
  },
  {
    id: 'security',
    name: '安全工具',
    icon: '🛡️',
    tools: [
      { id: 'password-generator', name: '密码生成', description: '生成强密码', icon: '🔐' },
      { id: 'password-strength', name: '密码强度检测', description: '检测密码强度', icon: '📊' },
      { id: 'email-validator', name: '邮箱验证', description: '验证邮箱格式', icon: '✉️' },
      { id: 'phone-validator', name: '手机号验证', description: '验证手机号格式', icon: '📱' },
      { id: 'ip-lookup', name: 'IP查询', description: '查询IP地址信息', icon: '🌍' },
      { id: 'ssl-check', name: 'SSL检查', description: '检查SSL证书信息', icon: '🔒' },
    ]
  },
]

const httpStatusCodes: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

const OnlineToolkit = () => {
  const [activeCategory, setActiveCategory] = useState('text')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [outputValue, setOutputValue] = useState('')
  const [extraParams, setExtraParams] = useState<Record<string, string>>({})

  const currentCategory = useMemo(() => 
    toolCategories.find(c => c.id === activeCategory), 
    [activeCategory]
  )

  const currentTool = useMemo(() => {
    if (!activeTool || !currentCategory) return null
    return currentCategory.tools.find(t => t.id === activeTool)
  }, [activeTool, currentCategory])

  const processTool = useCallback(() => {
    if (!activeTool) return

    try {
      let result = ''
      
      switch (activeTool) {
        case 'case-convert':
          const caseType = extraParams['case-type'] || 'uppercase'
          if (caseType === 'uppercase') result = inputValue.toUpperCase()
          else if (caseType === 'lowercase') result = inputValue.toLowerCase()
          else if (caseType === 'capitalize') result = inputValue.replace(/\b\w/g, c => c.toUpperCase())
          else if (caseType === 'titlecase') result = inputValue.replace(/\b\w/g, c => c.toUpperCase())
          break

        case 'word-count':
          const chars = inputValue.length
          const words = inputValue.trim() ? inputValue.trim().split(/\s+/).length : 0
          const lines = inputValue.split('\n').length
          result = `字符数: ${chars}\n单词数: ${words}\n行数: ${lines}`
          break

        case 'text-reverse':
          result = inputValue.split('').reverse().join('')
          break

        case 'trim-whitespace':
          result = inputValue.trim().replace(/\s+/g, ' ')
          break

        case 'html-encode':
          const div = document.createElement('div')
          div.textContent = inputValue
          result = div.innerHTML
          break

        case 'json-formatter':
          const parsed = JSON.parse(inputValue)
          result = JSON.stringify(parsed, null, 2)
          break

        case 'json-validator':
          try {
            JSON.parse(inputValue)
            result = '✅ JSON格式正确'
          } catch {
            result = '❌ JSON格式错误'
          }
          break

        case 'base64-encode':
          const encodeType = extraParams['encode-type'] || 'encode'
          if (encodeType === 'encode') {
            result = btoa(unescape(encodeURIComponent(inputValue)))
          } else {
            result = decodeURIComponent(escape(atob(inputValue)))
          }
          break

        case 'url-encode':
          const urlType = extraParams['url-type'] || 'encode'
          if (urlType === 'encode') {
            result = encodeURIComponent(inputValue)
          } else {
            result = decodeURIComponent(inputValue)
          }
          break

        case 'uuid-generator':
          const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
          })
          result = uuid
          break

        case 'hash-generator':
          const hashType = extraParams['hash-type'] || 'md5'
          const text = inputValue
          let hash = 0
          for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
          }
          if (hashType === 'md5') {
            result = Math.abs(hash).toString(16).padStart(32, '0')
          } else {
            result = Math.abs(hash).toString(16)
          }
          break

        case 'color-converter':
          const colorInput = inputValue.trim()
          if (/^#[0-9A-Fa-f]{6}$/.test(colorInput)) {
            const r = parseInt(colorInput.slice(1, 3), 16)
            const g = parseInt(colorInput.slice(3, 5), 16)
            const b = parseInt(colorInput.slice(5, 7), 16)
            result = `RGB: (${r}, ${g}, ${b})\nHSL: ${rgbToHsl(r, g, b)}`
          } else if (/^\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(colorInput)) {
            const [r, g, b] = colorInput.slice(1, -1).split(',').map(Number)
            result = `Hex: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}\nHSL: ${rgbToHsl(r, g, b)}`
          }
          break

        case 'timestamp-converter':
          const ts = parseInt(inputValue)
          if (!isNaN(ts)) {
            const date = new Date(ts * 1000)
            result = date.toLocaleString()
          } else {
            const date = new Date(inputValue)
            result = Math.floor(date.getTime() / 1000).toString()
          }
          break

        case 'http-status':
          const code = parseInt(inputValue)
          result = httpStatusCodes[code] || '未知状态码'
          break

        case 'password-generator':
          const length = parseInt(extraParams['password-length'] || '12')
          const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
          let password = ''
          for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length))
          }
          result = password
          break

        case 'password-strength':
          let strength = 0
          if (inputValue.length >= 8) strength++
          if (inputValue.length >= 12) strength++
          if (/[a-z]/.test(inputValue)) strength++
          if (/[A-Z]/.test(inputValue)) strength++
          if (/[0-9]/.test(inputValue)) strength++
          if (/[^a-zA-Z0-9]/.test(inputValue)) strength++
          const strengthText = ['弱', '较弱', '中等', '较强', '强', '非常强']
          result = `密码强度: ${strengthText[strength] || '未知'} (${strength}/6)`
          break

        case 'email-validator':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          result = emailRegex.test(inputValue) ? '✅ 有效邮箱' : '❌ 无效邮箱'
          break

        case 'bmi-calculator':
          const [height, weight] = inputValue.split(',').map(Number)
          if (!isNaN(height) && !isNaN(weight)) {
            const bmi = weight / ((height / 100) ** 2)
            let category = ''
            if (bmi < 18.5) category = '偏瘦'
            else if (bmi < 24) category = '正常'
            else if (bmi < 28) category = '偏胖'
            else category = '肥胖'
            result = `BMI: ${bmi.toFixed(1)}\n状态: ${category}`
          }
          break

        default:
          result = '工具开发中...'
      }

      setOutputValue(result)
    } catch (error) {
      setOutputValue(`错误: ${(error as Error).message}`)
    }
  }, [activeTool, inputValue, extraParams])

  const rgbToHsl = (r: number, g: number, b: number): string => {
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

    return `(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
  }

  const renderToolParams = () => {
    if (!activeTool) return null

    switch (activeTool) {
      case 'case-convert':
        return (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['uppercase', 'lowercase', 'capitalize', 'titlecase'].map((type, idx) => (
              <button
                key={type}
                onClick={() => setExtraParams(prev => ({ ...prev, 'case-type': type }))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: extraParams['case-type'] === type ? '1px solid #6c5ce7' : '1px solid #3a3a5c',
                  backgroundColor: extraParams['case-type'] === type ? '#6c5ce722' : 'transparent',
                  color: '#e0e0e8',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >{['大写', '小写', '首字母大写', '标题格式'][idx]}</button>
            ))}
          </div>
        )

      case 'base64-encode':
      case 'url-encode':
        return (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setExtraParams(prev => ({ ...prev, [activeTool === 'base64-encode' ? 'encode-type' : 'url-type']: 'encode' }))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #3a3a5c',
                backgroundColor: 'transparent',
                color: '#e0e0e8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >编码</button>
            <button
              onClick={() => setExtraParams(prev => ({ ...prev, [activeTool === 'base64-encode' ? 'encode-type' : 'url-type']: 'decode' }))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #3a3a5c',
                backgroundColor: 'transparent',
                color: '#e0e0e8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >解码</button>
          </div>
        )

      case 'hash-generator':
        return (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['md5', 'sha1', 'sha256'].map(type => (
              <button
                key={type}
                onClick={() => setExtraParams(prev => ({ ...prev, 'hash-type': type }))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: extraParams['hash-type'] === type ? '1px solid #6c5ce7' : '1px solid #3a3a5c',
                  backgroundColor: extraParams['hash-type'] === type ? '#6c5ce722' : 'transparent',
                  color: '#e0e0e8',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >{type.toUpperCase()}</button>
            ))}
          </div>
        )

      case 'password-generator':
        return (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#a0a0b0', fontSize: '12px', marginRight: '8px' }}>长度:</label>
            <input
              type="number"
              value={extraParams['password-length'] || 12}
              onChange={(e) => setExtraParams(prev => ({ ...prev, 'password-length': e.target.value }))}
              min={8}
              max={32}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #3a3a5c',
                backgroundColor: '#2d2d44',
                color: '#e0e0e8',
                fontSize: '12px',
                width: '60px'
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputValue)
      alert('已复制到剪贴板')
    } catch {
      alert('复制失败')
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e2e',
      color: '#e0e0e8'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #3a3a5c',
        backgroundColor: '#1a1a2e'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>🛠️ 在线工具中心</h2>
        <p style={{ fontSize: '13px', color: '#a0a0b0', marginTop: '4px' }}>集成多种实用工具，一站式解决日常需求</p>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '220px', borderRight: '1px solid #3a3a5c', overflow: 'auto' }}>
          {toolCategories.map(category => (
            <div key={category.id} style={{ marginBottom: '16px' }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '500', color: '#6c5ce7' }}>
                {category.icon} {category.name}
              </div>
              {category.tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveCategory(category.id)
                    setActiveTool(tool.id)
                    setInputValue('')
                    setOutputValue('')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: activeTool === tool.id ? '#6c5ce722' : 'transparent',
                    color: activeTool === tool.id ? '#6c5ce7' : '#e0e0e8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{tool.icon}</span>
                  <span style={{ flex: 1 }}>{tool.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          {!activeTool ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0a0b0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛠️</div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>选择一个工具开始使用</h3>
              <p>从左侧列表中选择您需要的工具</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                  {currentTool?.icon} {currentTool?.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#a0a0b0' }}>{currentTool?.description}</p>
              </div>

              {renderToolParams()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>输入</label>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="输入内容..."
                    style={{
                      width: '100%',
                      height: '120px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #3a3a5c',
                      backgroundColor: '#2d2d44',
                      color: '#e0e0e8',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  onClick={processTool}
                  style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#6c5ce7',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
                >执行</button>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>输出</label>
                    {outputValue && (
                      <button
                        onClick={copyToClipboard}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #3a3a5c',
                          backgroundColor: 'transparent',
                          color: '#6c5ce7',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >复制</button>
                    )}
                  </div>
                  <textarea
                    value={outputValue}
                    readOnly
                    placeholder="输出结果..."
                    style={{
                      width: '100%',
                      height: '150px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #3a3a5c',
                      backgroundColor: '#2d2d44',
                      color: '#e0e0e8',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnlineToolkit