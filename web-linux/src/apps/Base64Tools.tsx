import { useState } from 'react'

export default function Base64Tools() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [fileInput, setFileInput] = useState<File | null>(null)

  const encodeText = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(inputText)))
      setOutputText(encoded)
    } catch (e) {
      setOutputText('编码错误')
    }
  }

  const decodeText = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(inputText)))
      setOutputText(decoded)
    } catch (e) {
      setOutputText('解码错误: 无效的 Base64 字符串')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileInput(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setOutputText(result.split(',')[1])
        setInputText(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const downloadOutput = () => {
    const blob = new Blob([outputText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'encode' ? 'encoded.txt' : 'decoded.txt'
    a.click()
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>🔐 Base64 工具箱</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>Base64 编码/解码，支持文本和文件</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '16px 20px', borderBottom: '1px solid #313244' }}>
        <button
          onClick={() => setMode('encode')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            background: mode === 'encode' ? 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)' : '#313244',
            color: mode === 'encode' ? '#1e1e2e' : '#cdd6f4',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          编码 (Encode)
        </button>
        <button
          onClick={() => setMode('decode')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            background: mode === 'decode' ? 'linear-gradient(135deg, #a6e3a1 0%, #8bd5ca 100%)' : '#313244',
            color: mode === 'decode' ? '#1e1e2e' : '#cdd6f4',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          解码 (Decode)
        </button>
      </div>

      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>输入</div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64 字符串...'}
            style={{
              width: '100%',
              minHeight: '140px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: '10px',
              padding: '14px',
              color: '#cdd6f4',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ padding: '8px 16px', background: '#45475a', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
              📁 选择文件
              <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {fileInput && <span style={{ fontSize: '12px', color: '#a6adc8' }}>{fileInput.name}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={mode === 'encode' ? encodeText : decodeText} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '10px', color: '#1e1e2e', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
            {mode === 'encode' ? '➡️ 编码' : '⬅️ 解码'}
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a6adc8' }}>输出</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={copyOutput} style={{ padding: '6px 10px', background: '#313244', border: 'none', borderRadius: '6px', color: '#cdd6f4', cursor: 'pointer', fontSize: '11px' }}>复制</button>
              <button onClick={downloadOutput} style={{ padding: '6px 10px', background: '#313244', border: 'none', borderRadius: '6px', color: '#cdd6f4', cursor: 'pointer', fontSize: '11px' }}>下载</button>
            </div>
          </div>
          <textarea
            value={outputText}
            readOnly
            placeholder="结果将显示在这里..."
            style={{
              width: '100%',
              minHeight: '140px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: '10px',
              padding: '14px',
              color: '#a6e3a1',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>
  )
}
