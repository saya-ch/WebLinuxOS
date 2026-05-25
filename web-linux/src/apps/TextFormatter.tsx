import { useState, useCallback } from 'react'

export default function TextFormatter() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [lineCount, setLineCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const updateStats = useCallback((text: string) => {
    setCharCount(text.length)
    setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length)
    setLineCount(text.split('\n').length)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInputText(text)
    updateStats(text)
  }, [updateStats])

  const toUpperCase = useCallback(() => {
    setOutputText(inputText.toUpperCase())
  }, [inputText])

  const toLowerCase = useCallback(() => {
    setOutputText(inputText.toLowerCase())
  }, [inputText])

  const toTitleCase = useCallback(() => {
    setOutputText(
      inputText.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      )
    )
  }, [inputText])

  const toSentenceCase = useCallback(() => {
    setOutputText(
      inputText.replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase())
    )
  }, [inputText])

  const reverseText = useCallback(() => {
    setOutputText(inputText.split('').reverse().join(''))
  }, [inputText])

  const removeExtraSpaces = useCallback(() => {
    setOutputText(inputText.replace(/\s+/g, ' ').trim())
  }, [inputText])

  const trimLines = useCallback(() => {
    setOutputText(inputText.split('\n').map(line => line.trim()).join('\n'))
  }, [inputText])

  const removeEmptyLines = useCallback(() => {
    setOutputText(inputText.split('\n').filter(line => line.trim() !== '').join('\n'))
  }, [inputText])

  const sortLinesAsc = useCallback(() => {
    setOutputText(inputText.split('\n').sort().join('\n'))
  }, [inputText])

  const sortLinesDesc = useCallback(() => {
    setOutputText(inputText.split('\n').sort().reverse().join('\n'))
  }, [inputText])

  const uniqueLines = useCallback(() => {
    const lines = inputText.split('\n')
    const unique = Array.from(new Set(lines))
    setOutputText(unique.join('\n'))
  }, [inputText])

  const countLines = useCallback(() => {
    const lines = inputText.split('\n')
    const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
    setOutputText(numbered)
  }, [inputText])

  const base64Encode = useCallback(() => {
    try {
      setOutputText(btoa(unescape(encodeURIComponent(inputText))))
    } catch {
      setOutputText('Error: Invalid input for Base64 encoding')
    }
  }, [inputText])

  const base64Decode = useCallback(() => {
    try {
      setOutputText(decodeURIComponent(escape(atob(inputText))))
    } catch {
      setOutputText('Error: Invalid Base64 string')
    }
  }, [inputText])

  const urlEncode = useCallback(() => {
    setOutputText(encodeURIComponent(inputText))
  }, [inputText])

  const urlDecode = useCallback(() => {
    try {
      setOutputText(decodeURIComponent(inputText))
    } catch {
      setOutputText('Error: Invalid URL encoded string')
    }
  }, [inputText])

  const copyOutput = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputText)
    } catch {
      console.error('Failed to copy')
    }
  }, [outputText])

  const clearAll = useCallback(() => {
    setInputText('')
    setOutputText('')
    updateStats('')
  }, [updateStats])

  const swapInputOutput = useCallback(() => {
    const temp = inputText
    setInputText(outputText)
    setOutputText(temp)
    updateStats(outputText)
  }, [inputText, outputText, updateStats])

  return (
    <div className="app-container" style={{ 
      background: 'var(--bg-color)', 
      padding: 16, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      color: 'var(--text-color)'
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'basic', label: '基础格式' },
          { id: 'lines', label: '行操作' },
          { id: 'encode', label: '编码解码' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent-color)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-color)',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>输入文本</span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              字符: {charCount} | 词: {wordCount} | 行: {lineCount}
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="在此输入或粘贴文本..."
            style={{
              flex: 1,
              minHeight: 200,
              padding: 12,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              background: 'var(--card-bg)',
              color: 'var(--text-color)',
              resize: 'none',
              fontFamily: 'monospace',
              fontSize: 13
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>输出结果</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={swapInputOutput}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: 11, 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--card-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  borderRadius: 4
                }}
              >
                交换
              </button>
              <button
                onClick={copyOutput}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: 11, 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--card-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  borderRadius: 4
                }}
              >
                复制
              </button>
              <button
                onClick={clearAll}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: 11, 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--card-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  borderRadius: 4
                }}
              >
                清空
              </button>
            </div>
          </div>
          <textarea
            value={outputText}
            readOnly
            placeholder="转换后的文本将显示在这里..."
            style={{
              flex: 1,
              minHeight: 200,
              padding: 12,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              background: 'var(--card-bg)',
              color: 'var(--text-color)',
              resize: 'none',
              fontFamily: 'monospace',
              fontSize: 13
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {activeTab === 'basic' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <button onClick={toUpperCase} style={buttonStyle}>转为大写</button>
            <button onClick={toLowerCase} style={buttonStyle}>转为小写</button>
            <button onClick={toTitleCase} style={buttonStyle}>标题格式</button>
            <button onClick={toSentenceCase} style={buttonStyle}>句子格式</button>
            <button onClick={reverseText} style={buttonStyle}>反转文本</button>
            <button onClick={removeExtraSpaces} style={buttonStyle}>去除多余空格</button>
          </div>
        )}

        {activeTab === 'lines' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <button onClick={trimLines} style={buttonStyle}>修剪每行</button>
            <button onClick={removeEmptyLines} style={buttonStyle}>删除空行</button>
            <button onClick={sortLinesAsc} style={buttonStyle}>行升序</button>
            <button onClick={sortLinesDesc} style={buttonStyle}>行降序</button>
            <button onClick={uniqueLines} style={buttonStyle}>去重行</button>
            <button onClick={countLines} style={buttonStyle}>添加行号</button>
          </div>
        )}

        {activeTab === 'encode' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <button onClick={base64Encode} style={buttonStyle}>Base64 编码</button>
            <button onClick={base64Decode} style={buttonStyle}>Base64 解码</button>
            <button onClick={urlEncode} style={buttonStyle}>URL 编码</button>
            <button onClick={urlDecode} style={buttonStyle}>URL 解码</button>
          </div>
        )}
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid var(--border-color)',
  background: 'var(--card-bg)',
  color: 'var(--text-color)',
  cursor: 'pointer',
  borderRadius: 6,
  fontSize: 13,
  transition: 'all 0.15s ease'
}
