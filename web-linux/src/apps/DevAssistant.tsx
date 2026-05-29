import { useState, useCallback, memo } from 'react'

const DevAssistant = memo(function DevAssistant() {
  const [activeTab, setActiveTab] = useState('generator')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const generateLoremIpsum = useCallback(() => {
    const paragraphs = ['Lorem ipsum dolor sit amet, consectetur adipiscing elit.', 
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.']
    setOutput(paragraphs.join('\n\n'))
  }, [])

  const generateUUID = useCallback(() => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    setOutput(uuid)
  }, [])

  const base64Encode = useCallback(() => {
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))))
    } catch (e) {
      setOutput('编码失败')
    }
  }, [input])

  const base64Decode = useCallback(() => {
    try {
      setOutput(decodeURIComponent(escape(atob(input))))
    } catch (e) {
      setOutput('解码失败')
    }
  }, [input])

  const formatJSON = useCallback(() => {
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, 2))
    } catch (e) {
      setOutput('JSON 格式错误')
    }
  }, [input])

  const minifyJSON = useCallback(() => {
    try {
      setOutput(JSON.stringify(JSON.parse(input)))
    } catch (e) {
      setOutput('JSON 格式错误')
    }
  }, [input])

  const calculateHash = useCallback(() => {
    let hash = 0
    if (input.length === 0) {
      setOutput('0')
      return
    }
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    setOutput(hash.toString())
  }, [input])

  const copyOutput = useCallback(() => {
    navigator.clipboard.writeText(output).then(() => {})
  }, [output])

  const clearAll = useCallback(() => {
    setInput('')
    setOutput('')
  }, [])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%)',
      color: '#e8e8f4'
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(139, 92, 246, 0.05)'
      }}>
        {[
          { id: 'generator', name: '生成器', icon: '⚡' },
          { id: 'converter', name: '转换器', icon: '🔄' },
          { id: 'json', name: 'JSON', icon: '📄' },
          { id: 'hash', name: '哈希', icon: '🔐' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              border: 'none',
              color: activeTab === tab.id ? '#e8e8f4' : '#a0a0c8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent'
            }}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {activeTab === 'generator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: '#e8e8f4' }}>⚡ 文本生成器</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={generateLoremIpsum}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                📝 生成 Lorem Ipsum
              </button>
              <button
                onClick={generateUUID}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🎲 生成 UUID
              </button>
              <button
                onClick={() => setOutput(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🎨 随机颜色
              </button>
            </div>
          </div>
        )}

        {activeTab === 'converter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: '#e8e8f4' }}>🔄 编码转换器</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入要转换的文本..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e8e8f4',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={base64Encode}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Base64 编码
              </button>
              <button
                onClick={base64Decode}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Base64 解码
              </button>
              <button
                onClick={() => setOutput(encodeURIComponent(input))}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                URL 编码
              </button>
              <button
                onClick={() => setOutput(decodeURIComponent(input))}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                URL 解码
              </button>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: '#e8e8f4' }}>📄 JSON 工具</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='输入 JSON 数据...'
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e8e8f4',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={formatJSON}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                格式化
              </button>
              <button
                onClick={minifyJSON}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                压缩
              </button>
            </div>
          </div>
        )}

        {activeTab === 'hash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: '#e8e8f4' }}>🔐 哈希工具</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='输入要计算哈希的文本...'
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e8e8f4',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={calculateHash}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                计算简单哈希
              </button>
            </div>
          </div>
        )}

        {output && (
          <div style={{ marginTop: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#a0a0c8' }}>输出结果</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyOutput}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '6px',
                    color: '#e8e8f4',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  📋 复制
                </button>
                <button
                  onClick={clearAll}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    color: '#e8e8f4',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  清空
                </button>
              </div>
            </div>
            <pre style={{
              flex: 1,
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              overflow: 'auto',
              margin: 0,
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#a0a0c8',
              whiteSpace: 'pre-wrap'
            }}>
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
})

export default DevAssistant
