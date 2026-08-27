import React, { useState, useCallback, useRef } from 'react'
import { Lock, Copy, Download, Upload, Hash, FileText, ArrowRightLeft, AlertCircle, Check } from 'lucide-react'

const COLORS = {
  bg: '#1a1a2e',
  panelBg: '#0d1117',
  text: '#e6e6e6',
  textMuted: '#8b949e',
  accent: '#7c6cf0',
  accentHover: '#6a5ce0',
  border: 'rgba(255,255,255,0.08)',
  headerBg: 'rgba(13,17,23,0.9)',
  btnBg: 'rgba(255,255,255,0.06)',
  hoverBg: 'rgba(124,108,240,0.1)',
  activeBg: 'rgba(124,108,240,0.15)',
  success: '#3fb950',
  error: '#f85149',
  dropBorder: '#7c6cf0',
}

type ToolId = 'base64' | 'url' | 'html' | 'utf8' | 'hash'

interface ToolDef {
  id: ToolId
  name: string
  description: string
  icon: React.ReactNode
}

const TOOLS: ToolDef[] = [
  { id: 'base64', name: 'Base64 编解码', description: 'Base64 编码与解码', icon: <Lock size={16} /> },
  { id: 'url', name: 'URL 编解码', description: 'URL 编码与解码', icon: <ArrowRightLeft size={16} /> },
  { id: 'html', name: 'HTML 实体编解码', description: 'HTML 实体编码与解码', icon: <FileText size={16} /> },
  { id: 'utf8', name: 'UTF-8 字节计数', description: '统计文本的 UTF-8 字节数', icon: <Hash size={16} /> },
  { id: 'hash', name: 'SHA-256 哈希', description: '计算文本的 SHA-256 哈希值', icon: <Hash size={16} /> },
]

function htmlEncode(str: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return str.replace(/[&<>"']/g, c => map[c])
}

function getUTF8Details(str: string): { total: number; chars: number; breakdown: { char: string; bytes: number }[] } {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  const breakdown: { char: string; bytes: number }[] = []
  let i = 0
  const chars = [...str]
  for (const ch of chars) {
    const charBytes = encoder.encode(ch).length
    breakdown.push({ char: ch.length === 1 ? ch : `[${ch.codePointAt(0)?.toString(16)}]`, bytes: charBytes })
    i++
    if (i >= 200) break
  }
  return { total: encoded.length, chars: chars.length, breakdown }
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function EncodingToolkit() {
  const [activeTool, setActiveTool] = useState<ToolId>('base64')
  const [input, setInput] = useState('Hello, 你好世界! 🌍')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [hashResult, setHashResult] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const process = useCallback(async () => {
    setError('')
    setOutput('')
    setHashResult('')

    if (!input.trim() && activeTool !== 'hash') {
      setError('请输入内容')
      return
    }

    try {
      switch (activeTool) {
        case 'base64': {
          try {
            const encoded = btoa(unescape(encodeURIComponent(input)))
            setOutput(encoded)
          } catch {
            try {
              const decoded = decodeURIComponent(escape(atob(input)))
              setOutput(decoded)
            } catch {
              setError('Base64 编码/解码失败：请检查输入是否有效')
            }
          }
          break
        }
        case 'url': {
          try {
            const encoded = encodeURIComponent(input)
            setOutput(encoded)
          } catch {
            setError('URL 编码失败')
          }
          break
        }
        case 'html': {
          setOutput(htmlEncode(input))
          break
        }
        case 'utf8': {
          const details = getUTF8Details(input)
          const lines = [
            `总字节数: ${details.total}`,
            `字符数: ${details.chars}`,
            '',
            '字符详情:',
            ...details.breakdown.map(d => `  '${d.char}' → ${d.bytes} 字节${d.bytes > 1 ? ` (多字节)` : ''}`)
          ]
          setOutput(lines.join('\n'))
          break
        }
        case 'hash': {
          const hash = await sha256(input)
          setHashResult(hash)
          setOutput(hash)
          break
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '处理失败')
    }
  }, [input, activeTool])

  const handleCopyOutput = useCallback(() => {
    const text = hashResult || output
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('已复制!')
      setTimeout(() => setCopyFeedback(''), 2000)
    }).catch(() => {
      setCopyFeedback('复制失败')
      setTimeout(() => setCopyFeedback(''), 2000)
    })
  }, [output, hashResult])

  const handleDownload = useCallback(() => {
    const text = hashResult || output
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `encoding-result-${activeTool}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output, hashResult, activeTool])

  const handleSwap = useCallback(() => {
    if (output && activeTool !== 'utf8') {
      setInput(output)
      setOutput('')
      setHashResult('')
    }
  }, [output, activeTool])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer)
      setInput(content.slice(0, 10000))
    }
    reader.readAsText(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleToolChange = useCallback((toolId: ToolId) => {
    setActiveTool(toolId)
    setOutput('')
    setError('')
    setHashResult('')
  }, [])

  const renderOutput = () => {
    const displayText = hashResult || output
    if (!displayText && !error) {
      return (
        <div style={{ color: COLORS.textMuted, textAlign: 'center', padding: 40, fontSize: 13 }}>
          {activeTool === 'hash' ? '点击"执行"按钮计算 SHA-256 哈希值' : '点击"执行"按钮进行转换'}
        </div>
      )
    }
    if (error) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.error, padding: 16, background: 'rgba(248,81,73,0.06)', borderRadius: 6, margin: 12 }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )
    }
    return (
      <pre style={{ margin: 0, padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, lineHeight: '20px', color: COLORS.text }}>
        {displayText}
      </pre>
    )
  }

  return (
    <div style={{ background: COLORS.bg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>编码/解码工具箱</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={handleSwap} style={{ display: 'flex', alignItems: 'center', gap: 4, background: COLORS.btnBg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: '3px 10px', borderRadius: 4, cursor: output ? 'pointer' : 'default', fontSize: 12, opacity: output ? 1 : 0.4, transition: 'all 0.2s' }}
            onMouseEnter={e => { if (output) { e.currentTarget.style.background = COLORS.hoverBg; e.currentTarget.style.color = COLORS.accent } }}
            onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg; e.currentTarget.style.color = COLORS.textMuted }}>
            ⇄ 交换
          </button>
          <button onClick={handleCopyOutput} disabled={!output && !hashResult} style={{ display: 'flex', alignItems: 'center', gap: 4, background: COLORS.btnBg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: '3px 10px', borderRadius: 4, cursor: (output || hashResult) ? 'pointer' : 'default', fontSize: 12, opacity: (output || hashResult) ? 1 : 0.4, transition: 'all 0.2s' }}
            onMouseEnter={e => { if (output || hashResult) { e.currentTarget.style.background = COLORS.hoverBg; e.currentTarget.style.color = COLORS.accent } }}
            onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg; e.currentTarget.style.color = COLORS.textMuted }}>
            <Copy size={12} />
            {copyFeedback || '复制结果'}
          </button>
          <button onClick={handleDownload} disabled={!output && !hashResult} style={{ display: 'flex', alignItems: 'center', gap: 4, background: COLORS.btnBg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: '3px 10px', borderRadius: 4, cursor: (output || hashResult) ? 'pointer' : 'default', fontSize: 12, opacity: (output || hashResult) ? 1 : 0.4, transition: 'all 0.2s' }}
            onMouseEnter={e => { if (output || hashResult) { e.currentTarget.style.background = COLORS.hoverBg; e.currentTarget.style.color = COLORS.accent } }}
            onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg; e.currentTarget.style.color = COLORS.textMuted }}>
            <Download size={12} />
            下载
          </button>
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Tool List */}
        <div style={{ width: 180, background: COLORS.panelBg, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'auto' }}>
          <div style={{ padding: '12px 12px 8px', fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, flexShrink: 0 }}>工具列表</div>
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => handleToolChange(tool.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: activeTool === tool.id ? COLORS.activeBg : 'transparent',
                border: 'none', borderLeft: activeTool === tool.id ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                color: activeTool === tool.id ? COLORS.accent : COLORS.textMuted,
                cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', width: '100%',
              }}
              onMouseEnter={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = COLORS.hoverBg; e.currentTarget.style.color = COLORS.text } }}
              onMouseLeave={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted } }}>
              {tool.icon}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{tool.name}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{tool.description}</div>
              </div>
            </button>
          ))}
        </div>
        {/* Operation Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Input Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${COLORS.border}`, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: COLORS.panelBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>输入</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 3, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = COLORS.accent }}
                  onMouseLeave={e => { e.currentTarget.style.color = COLORS.textMuted }}>
                  <Upload size={11} />
                  导入文件
                </button>
                <button onClick={() => { setInput(''); setOutput(''); setError(''); setHashResult('') }} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 3, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = COLORS.error }}
                  onMouseLeave={e => { e.currentTarget.style.color = COLORS.textMuted }}>
                  清空
                </button>
              </div>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const content = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer)
                  setInput(content.slice(0, 10000))
                }
                reader.readAsText(file)
                e.target.value = ''
              }} />
            </div>
            <div
              style={{ flex: 1, position: 'relative', minHeight: 0 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isDragOver && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,108,240,0.1)', border: `2px dashed ${COLORS.dropBorder}`, borderRadius: 8, zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ textAlign: 'center', color: COLORS.accent }}>
                    <Upload size={32} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 500 }}>拖放文件到此处</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>支持文本文件导入</div>
                  </div>
                </div>
              )}
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ width: '100%', height: '100%', background: COLORS.panelBg, color: COLORS.text, border: 'none', outline: 'none', resize: 'none', padding: 16, fontSize: 13, lineHeight: '20px', fontFamily: "'SF Mono','Fira Code',monospace", boxSizing: 'border-box' }}
                spellCheck={false}
                placeholder="在此输入文本或拖放文件..."
              />
            </div>
          </div>
          {/* Execute Button */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', background: COLORS.bg, flexShrink: 0 }}>
            <button onClick={process} style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.accent, border: 'none', color: '#fff', padding: '6px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = COLORS.accentHover }}
              onMouseLeave={e => { e.currentTarget.style.background = COLORS.accent }}>
              <ArrowRightLeft size={14} />
              {activeTool === 'hash' ? '计算哈希' : '执行转换'}
            </button>
          </div>
          {/* Output Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: COLORS.panelBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>输出</span>
              {(output || hashResult) && (
                <button onClick={handleCopyOutput} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'transparent', border: 'none', color: copyFeedback ? COLORS.success : COLORS.textMuted, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 3, transition: 'all 0.2s' }}>
                  {copyFeedback ? <Check size={11} /> : <Copy size={11} />}
                  {copyFeedback || '复制'}
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: COLORS.panelBg, minHeight: 0 }}>
              {renderOutput()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
