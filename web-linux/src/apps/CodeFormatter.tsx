import { useState } from 'react'

const LANGUAGES = [
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
]

export default function CodeFormatter() {
  const [inputCode, setInputCode] = useState('')
  const [outputCode, setOutputCode] = useState('')
  const [language, setLanguage] = useState('json')
  const [indentSize, setIndentSize] = useState(2)
  const [error, setError] = useState('')

  const formatCode = () => {
    setError('')
    try {
      let formatted = inputCode

      if (language === 'json') {
        const parsed = JSON.parse(formatted)
        formatted = JSON.stringify(parsed, null, indentSize)
      } else if (language === 'javascript' || language === 'typescript') {
        formatted = basicFormat(formatted, indentSize)
      } else if (language === 'html') {
        formatted = formatHTML(formatted, indentSize)
      } else if (language === 'css') {
        formatted = formatCSS(formatted, indentSize)
      }

      setOutputCode(formatted)
    } catch (err) {
      setError(err instanceof Error ? err.message : '格式化失败')
    }
  }

  const basicFormat = (code: string, indent: number) => {
    const lines = code.split('\n')
    let level = 0
    const result: string[] = []

    for (let line of lines) {
      line = line.trim()
      if (!line) {
        result.push('')
        continue
      }
      
      if (line.startsWith('}') || line.startsWith(']')) {
        level = Math.max(0, level - 1)
      }
      
      result.push(' '.repeat(level * indent) + line)
      
      if (line.endsWith('{') || line.endsWith('[')) {
        level++
      }
    }

    return result.join('\n')
  }

  const formatHTML = (code: string, indent: number) => {
    let result = ''
    let level = 0
    const tags = code.match(/<[^>]+>|[^<]+/g) || [code]
    
    for (let tag of tags) {
      tag = tag.trim()
      if (!tag) continue
      
      const isClosing = tag.startsWith('</')
      const isSelfClosing = tag.endsWith('/>') || tag.includes('<br') || tag.includes('<hr') || tag.includes('<img')
      
      if (isClosing) {
        level = Math.max(0, level - 1)
        result += '\n' + ' '.repeat(level * indent) + tag
      } else if (isSelfClosing) {
        result += '\n' + ' '.repeat(level * indent) + tag
      } else if (tag.startsWith('<')) {
        result += '\n' + ' '.repeat(level * indent) + tag
        if (!tag.startsWith('<!')) {
          level++
        }
      } else {
        if (tag.trim()) {
          result += '\n' + ' '.repeat(level * indent) + tag.trim()
        }
      }
    }
    
    return result.trim()
  }

  const formatCSS = (code: string, indent: number) => {
    let result = ''
    let level = 0
    const tokens = code.match(/[{}]|[^{}]+/g) || [code]
    
    for (let token of tokens) {
      token = token.trim()
      if (!token) continue
      
      if (token === '{') {
        result += ' {\n'
        level++
      } else if (token === '}') {
        level = Math.max(0, level - 1)
        result += '\n' + ' '.repeat(level * indent) + '}\n'
      } else {
        const parts = token.split(';').filter(p => p.trim())
        for (let part of parts) {
          part = part.trim()
          if (part) {
            if (level === 0) {
              result += part.trim()
            } else {
              result += '\n' + ' '.repeat(level * indent) + part.trim() + ';'
            }
          }
        }
      }
    }
    
    return result.trim()
  }

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputCode)
      alert('已复制到剪贴板')
    } catch (err) {
      setError('复制失败')
    }
  }

  const clearAll = () => {
    setInputCode('')
    setOutputCode('')
    setError('')
  }

  const loadExample = () => {
    if (language === 'json') {
      setInputCode('{"name":"WebLinuxOS","version":"1.0.0","features":["desktop","terminal","filemanager"]}')
    } else if (language === 'javascript') {
      setInputCode('function hello(){console.log("Hello World");}')
    } else if (language === 'html') {
      setInputCode('<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>')
    } else if (language === 'css') {
      setInputCode('body{font-family:Arial;margin:0;}.container{padding:20px;}')
    }
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '22px' }}>🎨 代码格式化</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            支持 JSON、HTML、CSS、JavaScript、TypeScript
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>语言：</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <label style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '10px' }}>缩进：</label>
          <select
            value={indentSize}
            onChange={(e) => setIndentSize(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
            <option value={8}>8 空格</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={formatCode}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}
        >
          格式化
        </button>
        <button
          onClick={copyOutput}
          disabled={!outputCode}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            cursor: outputCode ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            transition: 'all 0.2s',
            opacity: outputCode ? 1 : 0.5
          }}
        >
          复制结果
        </button>
        <button
          onClick={loadExample}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          加载示例
        </button>
        <button
          onClick={clearAll}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          清空
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#f87171',
          fontSize: '13px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Code Panels */}
      <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>
            输入代码
          </h3>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="在此粘贴或输入代码..."
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              fontFamily: '"Fira Code", "Monaco", "Ubuntu Mono", monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>
            格式化结果
          </h3>
          <textarea
            value={outputCode}
            readOnly
            placeholder="格式化后的代码将显示在这里..."
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#e2e8f0',
              fontFamily: '"Fira Code", "Monaco", "Ubuntu Mono", monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>
    </div>
  )
}
