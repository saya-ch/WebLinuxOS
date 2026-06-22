import { useState, useCallback } from 'react'

export default function JSONFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indent, setIndent] = useState(2)

  const formatJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, indent)
      setOutput(formatted)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析错误')
      setOutput('')
    }
  }, [input, indent])

  const minifyJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析错误')
      setOutput('')
    }
  }, [input])

  const copyOutput = useCallback(() => {
    navigator.clipboard.writeText(output)
  }, [output])

  const clearAll = useCallback(() => {
    setInput('')
    setOutput('')
    setError(null)
  }, [])

  const loadSample = useCallback(() => {
    const sample = {
      name: 'WebLinuxOS',
      version: '1.0.0',
      description: '一个完全运行在浏览器中的Linux桌面环境',
      features: ['窗口管理', '虚拟文件系统', '终端仿真器', '200+应用程序'],
      author: {
        name: 'Saya Ch',
        email: 'saya@example.com'
      },
      repository: 'https://github.com/saya-ch/WebLinuxOS',
      license: 'MIT'
    }
    setInput(JSON.stringify(sample))
    setError(null)
  }, [])

  const validateJSON = useCallback(() => {
    try {
      JSON.parse(input)
      setError(null)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析错误')
      return false
    }
  }, [input])

  return (
    <div className="app-container" style={{ 
      background: '#1e1e1e', 
      color: '#fff', 
      padding: 16, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      gap: 12
    }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={formatJSON}
          style={{
            padding: '8px 16px',
            background: '#0078d4',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          格式化
        </button>
        <button
          onClick={minifyJSON}
          style={{
            padding: '8px 16px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          压缩
        </button>
        <button
          onClick={validateJSON}
          style={{
            padding: '8px 16px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          验证
        </button>
        <button
          onClick={copyOutput}
          disabled={!output}
          style={{
            padding: '8px 16px',
            background: output ? '#2d2d2d' : '#1a1a1a',
            border: '1px solid #444',
            borderRadius: 6,
            color: output ? '#fff' : '#666',
            fontSize: 13,
            cursor: output ? 'pointer' : 'not-allowed',
          }}
        >
          复制结果
        </button>
        <button
          onClick={loadSample}
          style={{
            padding: '8px 16px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          示例
        </button>
        <button
          onClick={clearAll}
          style={{
            padding: '8px 16px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          清空
        </button>
        <select
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          style={{
            padding: '6px 12px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
          }}
        >
          <option value={2}>缩进 2</option>
          <option value={4}>缩进 4</option>
          <option value={8}>缩进 8</option>
        </select>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '8px 12px',
          background: '#e74c3c20',
          border: '1px solid #e74c3c',
          borderRadius: 6,
          color: '#e74c3c',
          fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Input/Output panels */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* Input */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            padding: '8px 12px', 
            background: '#2d2d2d', 
            borderRadius: 6, 
            marginBottom: 6,
            fontSize: 12,
            color: '#888',
          }}>
            输入 JSON
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='粘贴 JSON 数据...'
            style={{
              flex: 1,
              padding: 12,
              background: '#252526',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#d4d4d4',
              fontSize: 13,
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none',
            }}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            padding: '8px 12px', 
            background: '#2d2d2d', 
            borderRadius: 6, 
            marginBottom: 6,
            fontSize: 12,
            color: '#888',
          }}>
            输出结果
          </div>
          <div
            style={{
              flex: 1,
              padding: 12,
              background: '#252526',
              border: '1px solid #444',
              borderRadius: 6,
              overflow: 'auto',
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {output ? (
              <pre style={{ margin: 0, color: '#d4d4d4' }}>
                {output}
              </pre>
            ) : (
              <span style={{ color: '#666' }}>点击"格式化"或"压缩"按钮处理 JSON</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        padding: '8px 12px',
        background: '#2d2d2d',
        borderRadius: 6,
        fontSize: 12,
        color: '#888',
      }}>
        <span>输入: {input.length} 字符</span>
        <span>输出: {output.length} 字符</span>
        {input && output && (
          <span style={{ color: '#27ae60' }}>
            压缩率: {Math.round((1 - output.length / input.length) * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}