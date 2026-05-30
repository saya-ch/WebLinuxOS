import { useState } from 'react'

type Mode = 'encode' | 'decode'

export default function Base64Tools() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const process = () => {
    setError('')
    setCopySuccess(false)
    
    if (!input.trim()) {
      setOutput('')
      return
    }

    try {
      if (mode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(input)))
        setOutput(encoded)
      } else {
        const decoded = decodeURIComponent(escape(atob(input)))
        setOutput(decoded)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请检查输入格式')
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
    setMode(mode === 'encode' ? 'decode' : 'encode')
    setError('')
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError('')
    setCopySuccess(false)
  }

  const loadExample = () => {
    if (mode === 'encode') {
      setInput('Hello, World! 你好，世界！')
    } else {
      setInput('SGVsbG8sIFdvcmxkISDlvKDlronjgII=')
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
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '22px' }}>🔐 Base64 编码/解码</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            支持文本和字符串的Base64编码与解码
          </p>
        </div>
      </div>

      {/* Mode Selection */}
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
          onClick={() => { setMode('encode'); setOutput(''); setError('') }}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: mode === 'encode' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          编码
        </button>
        <button
          onClick={() => { setMode('decode'); setOutput(''); setError('') }}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: mode === 'decode' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          解码
        </button>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={process}
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
          {mode === 'encode' ? '编码' : '解码'}
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
            {mode === 'encode' ? '输入文本' : '输入Base64字符串'}
          </h3>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的Base64字符串...'}
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
            {mode === 'encode' ? 'Base64编码结果' : '解码文本'}
          </h3>
          <textarea
            value={output}
            readOnly
            placeholder={mode === 'encode' ? '编码后的Base64字符串将显示在这里...' : '解码后的文本将显示在这里...'}
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
