import { useState, useRef, useCallback, useEffect } from 'react'

type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

interface HashResult {
  algorithm: HashAlgorithm
  lowercase: string
  uppercase: string
}

interface FileInfo {
  name: string
  size: number
}

const ALGORITHMS: HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

const ALGO_DESCRIPTIONS: Record<HashAlgorithm, string> = {
  'SHA-1': '160 位',
  'SHA-256': '256 位',
  'SHA-384': '384 位',
  'SHA-512': '512 位',
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

async function computeAllHashes(data: ArrayBuffer | Uint8Array): Promise<HashResult[]> {
  const results: HashResult[] = []
  for (const algo of ALGORITHMS) {
    const hashBuffer = await crypto.subtle.digest(algo, new Uint8Array(data))
    const hex = bufferToHex(hashBuffer)
    results.push({
      algorithm: algo,
      lowercase: hex,
      uppercase: hex.toUpperCase(),
    })
  }
  return results
}

export default function HashCalculator() {
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [textInput, setTextInput] = useState('')
  const [results, setResults] = useState<HashResult[]>([])
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [computing, setComputing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number>(-1)
  const [copiedCase, setCopiedCase] = useState<'lower' | 'upper' | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (copiedIndex >= 0) {
      const t = setTimeout(() => {
        setCopiedIndex(-1)
        setCopiedCase(null)
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [copiedIndex, copiedCase])

  const computeTextHashes = useCallback(async () => {
    if (!textInput.trim()) {
      setResults([])
      setError('')
      return
    }
    setError('')
    setComputing(true)
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(textInput)
      const allResults = await computeAllHashes(data)
      setResults(allResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算哈希值失败')
      setResults([])
    } finally {
      setComputing(false)
    }
  }, [textInput])

  const computeFileHashes = useCallback(async (file: File) => {
    setError('')
    setComputing(true)
    setResults([])
    setFileInfo({ name: file.name, size: file.size })
    fileRef.current = file
    try {
      const buffer = await file.arrayBuffer()
      const allResults = await computeAllHashes(buffer)
      setResults(allResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算文件哈希值失败')
      setResults([])
    } finally {
      setComputing(false)
    }
  }, [])

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return
      computeFileHashes(file)
    },
    [computeFileHashes]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const copyToClipboard = useCallback(async (text: string, index: number, type: 'lower' | 'upper') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setCopiedCase(type)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedIndex(index)
      setCopiedCase(type)
    }
  }, [])

  const clearAll = useCallback(() => {
    setTextInput('')
    setResults([])
    setFileInfo(null)
    setError('')
    setCopiedIndex(-1)
    setCopiedCase(null)
    fileRef.current = null
  }, [])

  const handleModeSwitch = useCallback(
    (newMode: 'text' | 'file') => {
      setMode(newMode)
      setResults([])
      setFileInfo(null)
      setError('')
      setCopiedIndex(-1)
      setCopiedCase(null)
    },
    []
  )

  const styles = getStyles()

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconBadge}>🔢</div>
          <div>
            <h2 style={styles.title}>哈希计算器</h2>
            <p style={styles.subtitle}>基于 Web Crypto API，支持文本与文件哈希计算</p>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={clearAll} style={styles.clearBtn}>
            清除结果
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div style={styles.tabBar}>
        <button
          onClick={() => handleModeSwitch('text')}
          style={{
            ...styles.tab,
            ...(mode === 'text' ? styles.tabActive : {}),
          }}
        >
          📝 文本输入
        </button>
        <button
          onClick={() => handleModeSwitch('file')}
          style={{
            ...styles.tab,
            ...(mode === 'file' ? styles.tabActive : {}),
          }}
        >
          📁 文件上传
        </button>
      </div>

      {/* Input Area */}
      {mode === 'text' ? (
        <div style={styles.inputSection}>
          <textarea
            ref={textareaRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="输入要计算哈希值的文本内容..."
            style={styles.textarea}
          />
          <div style={styles.inputActions}>
            <span style={styles.charCount}>
              {textInput.length > 0
                ? `${textInput.length} 字符 · ${new TextEncoder().encode(textInput).length} 字节`
                : '等待输入...'}
            </span>
            <button
              onClick={computeTextHashes}
              disabled={computing || !textInput.trim()}
              style={{
                ...styles.computeBtn,
                ...(computing || !textInput.trim() ? styles.computeBtnDisabled : {}),
              }}
            >
              {computing ? '计算中...' : '开始计算'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...styles.dropZone,
            ...(dragOver ? styles.dropZoneActive : {}),
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
          <div style={styles.dropIcon}>{computing ? '⏳' : '📂'}</div>
          <p style={styles.dropText}>
            {computing
              ? '正在计算文件哈希值...'
              : '点击选择文件或拖拽文件到此处'}
          </p>
          <p style={styles.dropHint}>支持任意文件类型，文件大小不限</p>
          {fileInfo && (
            <div style={styles.fileInfoCard}>
              <span style={styles.fileInfoName}>📄 {fileInfo.name}</span>
              <span style={styles.fileInfoSize}>{formatFileSize(fileInfo.size)}</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBar}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsHeader}>
            <h3 style={styles.resultsTitle}>计算结果</h3>
            {fileInfo && (
              <div style={styles.fileTag}>
                📄 {fileInfo.name} ({formatFileSize(fileInfo.size)})
              </div>
            )}
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>算法</th>
                  <th style={styles.th}>哈希值 (小写)</th>
                  <th style={styles.th}>哈希值 (大写)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.algorithm} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.tdAlgo}>
                      <div style={styles.algoName}>{r.algorithm}</div>
                      <div style={styles.algoBit}>{ALGO_DESCRIPTIONS[r.algorithm]}</div>
                    </td>
                    <td style={styles.tdHash}>
                      <div style={styles.hashValue}>{r.lowercase}</div>
                      <button
                        onClick={() => copyToClipboard(r.lowercase, i, 'lower')}
                        style={{
                          ...styles.copyBtn,
                          ...(copiedIndex === i && copiedCase === 'lower' ? styles.copyBtnCopied : {}),
                        }}
                      >
                        {copiedIndex === i && copiedCase === 'lower' ? '✓ 已复制' : '📋 复制'}
                      </button>
                    </td>
                    <td style={styles.tdHash}>
                      <div style={styles.hashValueUpper}>{r.uppercase}</div>
                      <button
                        onClick={() => copyToClipboard(r.uppercase, i, 'upper')}
                        style={{
                          ...styles.copyBtn,
                          ...(copiedIndex === i && copiedCase === 'upper' ? styles.copyBtnCopied : {}),
                        }}
                      >
                        {copiedIndex === i && copiedCase === 'upper' ? '✓ 已复制' : '📋 复制'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Copy All */}
          <div style={styles.quickCopyBar}>
            <button
              onClick={() => {
                const allText = results
                  .map((r) => `${r.algorithm} (小写): ${r.lowercase}\n${r.algorithm} (大写): ${r.uppercase}`)
                  .join('\n\n')
                copyToClipboard(allText, -1, 'lower')
              }}
              style={styles.copyAllBtn}
            >
              📋 复制全部结果
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function getStyles(): Record<string, React.CSSProperties> {
  return {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      overflow: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    },
    iconBadge: {
      fontSize: '32px',
      width: '52px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(99, 102, 241, 0.15)',
      borderRadius: '14px',
      border: '1px solid rgba(99, 102, 241, 0.3)',
    },
    title: {
      margin: 0,
      color: '#e2e8f0',
      fontSize: '22px',
      fontWeight: '700',
      letterSpacing: '-0.3px',
    },
    subtitle: {
      margin: '4px 0 0 0',
      color: '#94a3b8',
      fontSize: '13px',
    },
    clearBtn: {
      padding: '7px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#f87171',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap' as const,
    },
    tabBar: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '4px',
      borderRadius: '12px',
      width: 'fit-content' as const,
      backdropFilter: 'blur(10px)',
    },
    tab: {
      padding: '9px 22px',
      borderRadius: '9px',
      border: 'none',
      background: 'transparent',
      color: '#94a3b8',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s',
    },
    tabActive: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(99, 102, 241, 0.35)',
    },
    inputSection: {
      marginBottom: '20px',
    },
    textarea: {
      width: '100%',
      minHeight: '140px',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(12px)',
      color: '#e2e8f0',
      fontSize: '14px',
      fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
      lineHeight: '1.6',
      resize: 'vertical' as const,
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s',
    },
    inputActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '12px',
    },
    charCount: {
      color: '#64748b',
      fontSize: '12px',
    },
    computeBtn: {
      padding: '10px 28px',
      borderRadius: '10px',
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 2px 12px rgba(99, 102, 241, 0.35)',
      transition: 'all 0.2s',
    },
    computeBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    dropZone: {
      padding: '40px 20px',
      borderRadius: '14px',
      border: '2px dashed rgba(99, 102, 241, 0.35)',
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(12px)',
      cursor: 'pointer',
      textAlign: 'center' as const,
      marginBottom: '20px',
      transition: 'all 0.25s',
    },
    dropZoneActive: {
      borderColor: '#6366f1',
      background: 'rgba(99, 102, 241, 0.08)',
      boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
    },
    dropIcon: {
      fontSize: '42px',
      marginBottom: '12px',
    },
    dropText: {
      margin: '0 0 6px 0',
      color: '#cbd5e1',
      fontSize: '15px',
      fontWeight: '500',
    },
    dropHint: {
      margin: 0,
      color: '#64748b',
      fontSize: '12px',
    },
    fileInfoCard: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '16px',
      padding: '10px 18px',
      borderRadius: '10px',
      background: 'rgba(99, 102, 241, 0.1)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
    },
    fileInfoName: {
      color: '#c7d2fe',
      fontSize: '13px',
      fontWeight: '500',
      maxWidth: '300px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    fileInfoSize: {
      color: '#818cf8',
      fontSize: '12px',
      fontWeight: '600',
    },
    errorBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#fca5a5',
      fontSize: '13px',
      marginBottom: '16px',
    },
    resultsContainer: {
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(16px)',
      borderRadius: '14px',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      overflow: 'hidden',
      marginBottom: '12px',
    },
    resultsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px 12px',
      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    },
    resultsTitle: {
      margin: 0,
      color: '#e2e8f0',
      fontSize: '16px',
      fontWeight: '600',
    },
    fileTag: {
      color: '#818cf8',
      fontSize: '12px',
      fontWeight: '500',
      background: 'rgba(99, 102, 241, 0.1)',
      padding: '4px 10px',
      borderRadius: '6px',
    },
    tableWrapper: {
      overflowX: 'auto' as const,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      tableLayout: 'auto' as const,
    },
    th: {
      padding: '10px 16px',
      textAlign: 'left' as const,
      color: '#94a3b8',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    },
    trEven: {
      background: 'rgba(255, 255, 255, 0.02)',
    },
    trOdd: {
      background: 'transparent',
    },
    tdAlgo: {
      padding: '14px 16px',
      verticalAlign: 'middle' as const,
      borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    algoName: {
      color: '#e2e8f0',
      fontSize: '14px',
      fontWeight: '600',
    },
    algoBit: {
      color: '#64748b',
      fontSize: '11px',
      marginTop: '2px',
    },
    tdHash: {
      padding: '14px 16px',
      verticalAlign: 'middle' as const,
      borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
      maxWidth: '420px',
    },
    hashValue: {
      color: '#a5f3fc',
      fontSize: '12px',
      fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
      wordBreak: 'break-all' as const,
      lineHeight: '1.6',
      marginBottom: '6px',
    },
    hashValueUpper: {
      color: '#c7d2fe',
      fontSize: '12px',
      fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
      wordBreak: 'break-all' as const,
      lineHeight: '1.6',
      marginBottom: '6px',
    },
    copyBtn: {
      padding: '4px 10px',
      borderRadius: '6px',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#94a3b8',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: '500',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap' as const,
    },
    copyBtnCopied: {
      background: 'rgba(34, 197, 94, 0.15)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      color: '#4ade80',
    },
    quickCopyBar: {
      padding: '12px 20px',
      borderTop: '1px solid rgba(148, 163, 184, 0.08)',
      display: 'flex',
      justifyContent: 'center',
    },
    copyAllBtn: {
      padding: '8px 20px',
      borderRadius: '8px',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      background: 'rgba(99, 102, 241, 0.1)',
      color: '#a5b4fc',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s',
    },
  }
}
