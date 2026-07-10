import { useState } from 'react'

type Direction = 'json-to-yaml' | 'yaml-to-json'

export default function JSONYAMLConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [direction, setDirection] = useState<Direction>('json-to-yaml')
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  // 简单的JSON/YAML转换函数，不依赖外部库
  const jsonToYaml = (json: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent)
    let result = ''

    if (json === null) {
      return 'null'
    }

    if (typeof json === 'boolean') {
      return json ? 'true' : 'false'
    }

    if (typeof json === 'number') {
      return json.toString()
    }

    if (typeof json === 'string') {
      // 检查是否需要引号
      if (json.includes('\n') || json.includes(':') || json.includes('#') || 
          json.includes('"') || json.includes("'") || json.trim() === '' ||
          ['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(json.toLowerCase())) {
        return JSON.stringify(json)
      }
      return json
    }

    if (Array.isArray(json)) {
      if (json.length === 0) return '[]'
      result = json.map(item => {
        const itemStr = jsonToYaml(item, indent + 1)
        if (typeof item === 'object' && item !== null) {
          return `${spaces}- ${itemStr}`
        }
        return `${spaces}- ${itemStr}`
      }).join('\n')
      return result
    }

    if (typeof json === 'object') {
      const keys = Object.keys(json)
      if (keys.length === 0) return '{}'
      result = keys.map(key => {
        const value = json[key]
        const keyStr = key.includes(':') || key.includes('#') || key.includes(' ') || key.trim() === '' 
          ? JSON.stringify(key) 
          : key
        const valueStr = jsonToYaml(value, indent + 1)
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            if (value.length === 0) {
              return `${spaces}${keyStr}: []`
            }
            return `${spaces}${keyStr}:\n${valueStr}`
          } else {
            if (Object.keys(value).length === 0) {
              return `${spaces}${keyStr}: {}`
            }
            return `${spaces}${keyStr}:\n${valueStr}`
          }
        }
        return `${spaces}${keyStr}: ${valueStr}`
      }).join('\n')
      return result
    }

    return ''
  }

  // 简单的YAML到JSON解析器（基础功能）
  const yamlToJson = (yaml: string): any => {
    const lines = yaml.trim().split('\n')
    if (lines.length === 0) return {}

    // 先尝试直接用JSON.parse（因为YAML是JSON的超集）
    try {
      return JSON.parse(yaml)
    } catch {}

    // 简单的YAML解析（处理基本情况）
    const parseValue = (value: string): any => {
      value = value.trim()
      if (value === 'true') return true
      if (value === 'false') return false
      if (value === 'null') return null
      if (value === '[]') return []
      if (value === '{}') return {}
      
      // 数字
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return parseFloat(value)
      }
      
      // 字符串
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        try {
          return JSON.parse(value)
        } catch {
          return value.slice(1, -1)
        }
      }
      
      return value
    }

    // 简单的对象构建
    const result: any = {}
    let currentObject: any = result
    let currentIndent = 0
    const objectStack: { indent: number; obj: any; key: string }[] = []

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue

      const indent = line.search(/\S/)
      const content = line.trim()

      // 处理数组项
      if (content.startsWith('- ')) {
        // 这种简单解析器主要处理基本对象，暂不处理复杂数组
        continue
      }

      // 处理键值对
      const colonIndex = content.indexOf(':')
      if (colonIndex !== -1) {
        const key = content.slice(0, colonIndex).trim()
        const value = content.slice(colonIndex + 1).trim()

        // 处理缩进和嵌套
        if (indent < currentIndent) {
          // 返回上一级
          while (objectStack.length > 0 && objectStack[objectStack.length - 1].indent >= indent) {
            const popped = objectStack.pop()
            if (popped) {
              currentObject = objectStack.length > 0 ? objectStack[objectStack.length - 1].obj : result
            }
          }
        }

        if (value === '' || value === '{}' || value === '[]') {
          // 嵌套对象开始
          const newObj = value === '[]' ? [] : {}
          currentObject[key] = newObj
          objectStack.push({ indent, obj: currentObject, key })
          currentObject = newObj
          currentIndent = indent
        } else {
          // 简单值
          currentObject[key] = parseValue(value)
        }
      }
    }

    return result
  }

  const convert = () => {
    setError('')
    setCopySuccess(false)

    if (!input.trim()) {
      setOutput('')
      return
    }

    try {
      if (direction === 'json-to-yaml') {
        const parsed = JSON.parse(input)
        const yaml = jsonToYaml(parsed)
        setOutput(yaml)
      } else {
        const json = yamlToJson(input)
        setOutput(JSON.stringify(json, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败，请检查输入格式')
      setOutput('')
    }
  }

  const copyOutput = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setError('复制失败')
    }
  }

  const swap = () => {
    const temp = input
    setInput(output)
    setOutput(temp)
    setDirection(direction === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml')
    setError('')
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError('')
    setCopySuccess(false)
  }

  const loadExample = () => {
    if (direction === 'json-to-yaml') {
      setInput(JSON.stringify({
        name: 'WebLinuxOS',
        version: '1.0.0',
        features: ['desktop', 'terminal', 'filemanager'],
        config: {
          theme: 'dark',
          fontSize: 14
        }
      }, null, 2))
    } else {
      setInput(`name: WebLinuxOS
version: 1.0.0
features:
  - desktop
  - terminal
  - filemanager
config:
  theme: dark
  fontSize: 14`)
    }
    setError('')
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
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '22px' }}>🔄 JSON/YAML 转换器</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            在JSON和YAML格式之间相互转换
          </p>
        </div>
      </div>

      {/* Direction Selection */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        background: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => { setDirection('json-to-yaml'); setOutput(''); setError('') }}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: direction === 'json-to-yaml' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          JSON → YAML
        </button>
        <button
          onClick={() => { setDirection('yaml-to-json'); setOutput(''); setError('') }}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: direction === 'yaml-to-json' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          YAML → JSON
        </button>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={convert}
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
          转换
        </button>
        <button
          onClick={copyOutput}
          disabled={!output}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: copySuccess ? '#4ade80' : '#e2e8f0',
            cursor: output ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            transition: 'all 0.2s',
            opacity: output ? 1 : 0.5
          }}
        >
          {copySuccess ? '✓ 已复制' : '复制结果'}
        </button>
        <button
          onClick={swap}
          disabled={!output}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            cursor: output ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            transition: 'all 0.2s',
            opacity: output ? 1 : 0.5
          }}
        >
          交换内容
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
          onClick={clear}
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

      {/* Panels */}
      <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0, flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>
            {direction === 'json-to-yaml' ? '输入JSON' : '输入YAML'}
          </h3>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'json-to-yaml' ? '输入JSON字符串...' : '输入YAML字符串...'}
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
              outline: 'none',
              minHeight: '150px'
            }}
          />
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>
            {direction === 'json-to-yaml' ? 'YAML输出' : 'JSON输出'}
          </h3>
          <textarea
            value={output}
            readOnly
            placeholder={direction === 'json-to-yaml' ? '转换后的YAML将显示在这里...' : '转换后的JSON将显示在这里...'}
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
              outline: 'none',
              minHeight: '150px'
            }}
          />
        </div>
      </div>
    </div>
  )
}
