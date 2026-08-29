/**
 * Base64Toolkit - 全功能 Base64 编解码工具
 * 支持文本/文件编码解码、URL安全Base64、Data URL生成、拖拽上传
 */
import { useState, useRef, useCallback } from 'react'

type Mode = 'text' | 'file'

function Base64Toolkit() {
  const [mode, setMode] = useState<Mode>('text')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode')
  const [urlSafe, setUrlSafe] = useState(false)
  const [showDataUrl, setShowDataUrl] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processText = useCallback((text: string, dir: 'encode' | 'decode', useUrlSafe: boolean) => {
    setError('')
    if (!text.trim()) { setOutput(''); return }
    try {
      if (dir === 'encode') {
        const encoder = new TextEncoder()
        const bytes = encoder.encode(text)
        let b64 = btoa(String.fromCharCode(...bytes))
        if (useUrlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        setOutput(b64)
      } else {
        let b64 = text.trim()
        if (useUrlSafe) {
          b64 = b64.replace(/-/g, '+').replace(/_/g, '/')
          while (b64.length % 4) b64 += '='
        }
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        setOutput(new TextDecoder().decode(bytes))
      }
    } catch (e) {
      setError(`解码失败: ${e instanceof Error ? e.message : '无效的 Base64 数据'}`)
      setOutput('')
    }
  }, [])

  const handleInputChange = useCallback((val: string) => {
    setInput(val)
    processText(val, direction, urlSafe)
  }, [direction, urlSafe, processText])

  const handleDirectionChange = useCallback((dir: 'encode' | 'decode') => {
    setDirection(dir)
    processText(input, dir, urlSafe)
  }, [input, urlSafe, processText])

  const handleUrlSafeChange = useCallback((us: boolean) => {
    setUrlSafe(us)
    processText(input, direction, us)
  }, [input, direction, processText])

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    setFileType(file.type || 'application/octet-stream')
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result is data:mime;base64,XXX
      const b64 = result.split(',')[1] || ''
      let encoded = b64
      if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      if (direction === 'encode') {
        setOutput(encoded)
        setInput(`// 文件: ${file.name} (${file.type}, ${formatSize(file.size)})`)
      } else {
        // 尝试解码
        try {
          let toDecode = encoded
          if (urlSafe) { toDecode = toDecode.replace(/-/g, '+').replace(/_/g, '/'); while (toDecode.length % 4) toDecode += '=' }
          const binary = atob(toDecode)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          setOutput(new TextDecoder().decode(bytes))
          setInput(encoded.slice(0, 100) + (encoded.length > 100 ? '...' : ''))
        } catch (e) {
          setError(`文件解码失败: ${e instanceof Error ? e.message : ''}`)
        }
      }
    }
    reader.readAsDataURL(file)
  }, [direction, urlSafe])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  const handleSwap = useCallback(() => {
    if (!output) return
    setInput(output)
    const newDir = direction === 'encode' ? 'decode' : 'encode'
    setDirection(newDir)
    processText(output, newDir, urlSafe)
  }, [output, direction, urlSafe, processText])

  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `base64-output-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const stats = {
    inputSize: new TextEncoder().encode(input).length,
    outputSize: new TextEncoder().encode(output).length,
    ratio: input ? (new TextEncoder().encode(output).length / Math.max(1, new TextEncoder().encode(input).length) * 100).toFixed(1) : '-',
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Base64 编解码工具</h2>
        <span style={styles.subtitle}>文本与文件的 Base64 编码 / 解码</span>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.btnGroup}>
          <button style={{ ...styles.toggleBtn, ...(direction === 'encode' ? styles.toggleBtnActive : {}) }} onClick={() => handleDirectionChange('encode')}>编码</button>
          <button style={{ ...styles.toggleBtn, ...(direction === 'decode' ? styles.toggleBtnActive : {}) }} onClick={() => handleDirectionChange('decode')}>解码</button>
        </div>
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={urlSafe} onChange={(e) => handleUrlSafeChange(e.target.checked)} />
          URL 安全
        </label>
        <div style={{ ...styles.btnGroup }}>
          <button style={{ ...styles.toggleBtn, ...(mode === 'text' ? styles.toggleBtnActive : {}) }} onClick={() => setMode('text')}>文本</button>
          <button style={{ ...styles.toggleBtn, ...(mode === 'file' ? styles.toggleBtnActive : {}) }} onClick={() => setMode('file')}>文件</button>
        </div>
      </div>

      {mode === 'text' ? (
        <div style={styles.panels}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelLabel}>{direction === 'encode' ? '输入文本' : '输入 Base64'}</span>
              <span style={styles.panelStats}>{stats.inputSize} bytes</span>
            </div>
            <textarea
              style={styles.textarea}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={direction === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'}
              spellCheck={false}
            />
          </div>
          <div style={styles.swapCol}>
            <button style={styles.swapBtn} onClick={handleSwap} title="交换输入输出">&harr;</button>
          </div>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelLabel}>{direction === 'encode' ? 'Base64 输出' : '解码输出'}</span>
              <span style={styles.panelStats}>{stats.outputSize} bytes</span>
            </div>
            <textarea
              style={{ ...styles.textarea, background: 'var(--bg-tertiary, #f0fdf4)' }}
              value={output}
              readOnly
              placeholder="输出结果将显示在这里..."
            />
          </div>
        </div>
      ) : (
        <div
          style={{ ...styles.dropZone, ...(dragOver ? styles.dropZoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          <div style={styles.dropIcon}>{fileName ? '📄' : '📁'}</div>
          <div style={styles.dropText}>{fileName ? `已选择: ${fileName}` : '拖拽文件到此处，或点击选择文件'}</div>
          {fileType && <div style={styles.dropMeta}>{fileType}</div>}
          {output && (
            <textarea
              style={{ ...styles.textarea, marginTop: '12px', maxHeight: '200px' }}
              value={output}
              readOnly
              onClick={(e) => e.stopPropagation()}
              placeholder="输出结果..."
            />
          )}
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {output && (
        <div style={styles.resultBar}>
          <span style={styles.ratio}>编码比: {stats.ratio}%</span>
          {direction === 'encode' && output.length < 1000 && (
            <label style={styles.checkLabel}>
              <input type="checkbox" checked={showDataUrl} onChange={(e) => setShowDataUrl(e.target.checked)} />
              Data URL 格式
            </label>
          )}
          <div style={styles.resultActions}>
            <button style={styles.actionBtn} onClick={handleCopy}>{copied ? '已复制' : '复制'}</button>
            <button style={styles.actionBtn} onClick={handleDownload}>下载</button>
          </div>
        </div>
      )}

      {showDataUrl && direction === 'encode' && output && (
        <div style={styles.dataUrl}>
          <code style={styles.code}>data:{fileType || 'text/plain'};base64,{output.slice(0, 200)}{output.length > 200 ? '...' : ''}</code>
        </div>
      )}

      <div style={styles.presets}>
        <span style={styles.presetLabel}>快速示例:</span>
        {['Hello, WebLinuxOS!', 'https://github.com/saya-ch/WebLinuxOS', '{"name":"WebLinuxOS","version":"138"}'].map((ex) => (
          <button key={ex} style={styles.presetBtn} onClick={() => { setInput(ex); setDirection('encode'); processText(ex, 'encode', urlSafe) }}>
            {ex.length > 30 ? ex.slice(0, 30) + '...' : ex}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: 'var(--text-primary, #1a1a2e)', background: 'var(--bg-primary, #ffffff)', overflow: 'hidden' },
  header: { display: 'flex', flexDirection: 'column', gap: '2px' },
  title: { margin: 0, fontSize: '18px', fontWeight: 600 },
  subtitle: { fontSize: '12px', color: 'var(--text-secondary, #6b7280)' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  btnGroup: { display: 'flex', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', overflow: 'hidden' },
  toggleBtn: { padding: '6px 14px', border: 'none', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text-secondary, #6b7280)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' },
  toggleBtnActive: { background: 'var(--accent-color, #3b82f6)', color: '#fff' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary, #6b7280)', cursor: 'pointer' },
  panels: { flex: 1, display: 'flex', gap: '8px', minHeight: 0 },
  panel: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  panelLabel: { fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #6b7280)' },
  panelStats: { fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' },
  textarea: { flex: 1, padding: '10px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', resize: 'none', outline: 'none', background: 'var(--bg-input, #f9fafb)', color: 'var(--text-primary, #1a1a2e)', minHeight: '120px' },
  swapCol: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  swapBtn: { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-secondary, #f9fafb)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  error: { padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '12px' },
  resultBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary, #f9fafb)', flexWrap: 'wrap' },
  ratio: { fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #6b7280)' },
  resultActions: { display: 'flex', gap: '6px', marginLeft: 'auto' },
  actionBtn: { padding: '5px 12px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '6px', background: 'var(--bg-primary, #fff)', color: 'var(--text-primary, #1a1a2e)', fontSize: '12px', cursor: 'pointer' },
  dataUrl: { padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary, #f9fafb)', border: '1px solid var(--border-color, #e5e7eb)' },
  code: { fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', wordBreak: 'break-all', color: 'var(--text-secondary, #6b7280)' },
  presets: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  presetLabel: { fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' },
  presetBtn: { padding: '4px 10px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '6px', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text-primary, #1a1a2e)', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' },
  dropZone: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color, #e5e7eb)', borderRadius: '12px', padding: '32px', cursor: 'pointer', transition: 'all 0.2s', minHeight: '200px' },
  dropZoneActive: { borderColor: 'var(--accent-color, #3b82f6)', background: 'rgba(59, 130, 246, 0.05)' },
  dropIcon: { fontSize: '48px', marginBottom: '8px' },
  dropText: { fontSize: '14px', color: 'var(--text-secondary, #6b7280)' },
  dropMeta: { fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', marginTop: '4px' },
}

export default Base64Toolkit
