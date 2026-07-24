import { useState, useRef, useCallback, useEffect } from 'react'

type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

interface HashResult {
  algorithm: HashAlgo
  hash: string
  time: number
}

const ALGO_OPTIONS: HashAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function FileHashCalc() {
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [textInput, setTextInput] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [selectedAlgos, setSelectedAlgos] = useState<HashAlgo[]>(['SHA-256'])
  const [results, setResults] = useState<HashResult[]>([])
  const [computing, setComputing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number>(-1)
  const [error, setError] = useState('')

  const fileRef = useRef<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chunkSize = 1024 * 1024

  useEffect(() => {
    if (copiedIdx >= 0) {
      const t = setTimeout(() => setCopiedIdx(-1), 2000)
      return () => clearTimeout(t)
    }
  }, [copiedIdx])

  const toggleAlgo = (algo: HashAlgo) => {
    setSelectedAlgos((prev) => (prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo]))
  }

  const computeHashForData = async (data: ArrayBuffer | Uint8Array, algo: HashAlgo): Promise<string> => {
    const buf = data instanceof Uint8Array ? data.buffer as ArrayBuffer : data
    const hashBuffer = await crypto.subtle.digest(algo, buf)
    return bufferToHex(hashBuffer)
  }

  const processFile = useCallback(async (file: File) => {
    if (selectedAlgos.length === 0) {
      setError('请至少选择一种哈希算法')
      return
    }
    setError('')
    fileRef.current = file
    setFileName(file.name)
    setFileSize(file.size)
    setResults([])
    setComputing(true)
    setProgress(0)

    try {
      const buffer = await file.arrayBuffer()
      const totalSize = buffer.byteLength
      const allResults: HashResult[] = []

      for (let ai = 0; ai < selectedAlgos.length; ai++) {
        const algo = selectedAlgos[ai]
        const start = performance.now()

        if (totalSize <= chunkSize * 10) {
          const hash = await computeHashForData(buffer, algo)
          const elapsed = performance.now() - start
          allResults.push({ algorithm: algo, hash, time: elapsed })
        } else {
          const chunks = Math.ceil(totalSize / chunkSize)
          for (let i = 0; i < chunks; i++) {
            const startOffset = i * chunkSize
            const endOffset = Math.min(startOffset + chunkSize, totalSize)
            const _chunk = buffer.slice(startOffset, endOffset)
            await computeHashForData(_chunk, algo)
            setProgress(Math.round(((ai * chunks + i + 1) / (selectedAlgos.length * chunks)) * 100))
          }
          const fullHash = await computeHashForData(buffer, algo)
          const elapsed = performance.now() - start
          allResults.push({ algorithm: algo, hash: fullHash, time: elapsed })
        }
        setProgress(Math.round(((ai + 1) / selectedAlgos.length) * 100))
      }

      setResults(allResults)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算失败')
    } finally {
      setComputing(false)
    }
  }, [selectedAlgos, chunkSize])

  const computeTextHash = useCallback(async () => {
    if (!textInput.trim()) {
      setError('请输入文本内容')
      return
    }
    if (selectedAlgos.length === 0) {
      setError('请至少选择一种哈希算法')
      return
    }
    setError('')
    setResults([])
    setComputing(true)
    setProgress(0)

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(textInput)
      const allResults: HashResult[] = []

      for (let i = 0; i < selectedAlgos.length; i++) {
        const algo = selectedAlgos[i]
        const start = performance.now()
        const hash = await computeHashForData(data, algo)
        const elapsed = performance.now() - start
        allResults.push({ algorithm: algo, hash, time: elapsed })
        setProgress(Math.round(((i + 1) / selectedAlgos.length) * 100))
      }

      setResults(allResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算失败')
    } finally {
      setComputing(false)
    }
  }, [textInput, selectedAlgos])

  const copyHash = async (hash: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedIdx(idx)
    } catch {
      /* ignore */
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const compareMatch = compareA && compareB && compareA.toLowerCase() === compareB.toLowerCase()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(14,14,24,0.95)', color: '#cdd6f4', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔐</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>文件哈希计算器</span>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#6c7086' }}>Web Crypto API</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setMode('file')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${mode === 'file' ? '#6c5ce7' : 'rgba(108,92,231,0.2)'}`,
              background: mode === 'file' ? 'rgba(108,92,231,0.2)' : 'rgba(14,14,24,0.6)', color: mode === 'file' ? '#a78bfa' : '#a0a0b8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            📁 文件模式
          </button>
          <button
            onClick={() => setMode('text')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${mode === 'text' ? '#6c5ce7' : 'rgba(108,92,231,0.2)'}`,
              background: mode === 'text' ? 'rgba(108,92,231,0.2)' : 'rgba(14,14,24,0.6)', color: mode === 'text' ? '#a78bfa' : '#a0a0b8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            ✏️ 文本模式
          </button>
        </div>

        {/* File Drop Zone */}
        {mode === 'file' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              background: dragOver ? 'rgba(108,92,231,0.12)' : 'rgba(30,30,50,0.6)',
              border: `2px dashed ${dragOver ? '#6c5ce7' : 'rgba(108,92,231,0.25)'}`,
              borderRadius: 10,
              padding: 30,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(12px)',
            }}
          >
            <input ref={inputRef} type="file" onChange={handleFileInput} style={{ display: 'none' }} />
            <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>拖拽文件到此处或点击选择</div>
            <div style={{ fontSize: 12, color: '#6c7086', marginTop: 4 }}>支持任意文件类型</div>
            {fileName && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(14,14,24,0.6)', borderRadius: 6, fontSize: 12, display: 'inline-block' }}>
                📄 {fileName} <span style={{ color: '#6c7086' }}>({formatSize(fileSize)})</span>
              </div>
            )}
          </div>
        )}

        {/* Text Input */}
        {mode === 'text' && (
          <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="输入要计算哈希的文本内容..."
              style={{
                width: '100%', minHeight: 100, resize: 'vertical',
                background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.15)',
                borderRadius: 8, padding: 12, color: '#cdd6f4', fontSize: 14,
                lineHeight: 1.6, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* Algorithm Selection */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#a78bfa' }}>🧮 哈希算法</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALGO_OPTIONS.map((algo) => (
              <button
                key={algo}
                onClick={() => toggleAlgo(algo)}
                disabled={computing}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${selectedAlgos.includes(algo) ? '#6c5ce7' : 'rgba(108,92,231,0.2)'}`,
                  background: selectedAlgos.includes(algo) ? 'rgba(108,92,231,0.2)' : 'rgba(14,14,24,0.6)',
                  color: selectedAlgos.includes(algo) ? '#a78bfa' : '#a0a0b8',
                  fontSize: 12, fontWeight: 600, cursor: computing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {algo}
              </button>
            ))}
          </div>
        </div>

        {/* Compute Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={mode === 'file' ? () => { if (fileRef.current) processFile(fileRef.current) } : computeTextHash}
            disabled={computing || selectedAlgos.length === 0}
            style={{
              padding: '10px 40px', borderRadius: 8, border: 'none',
              background: computing ? '#2d2d44' : 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: computing || selectedAlgos.length === 0 ? 'not-allowed' : 'pointer',
              opacity: computing || selectedAlgos.length === 0 ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {computing ? '⏳ 计算中...' : '🔍 计算哈希'}
          </button>
        </div>

        {/* Progress */}
        {computing && (
          <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#a0a0b8' }}>计算进度</span>
              <span style={{ color: '#6c5ce7', fontWeight: 600 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#2d2d44', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6c5ce7, #a78bfa)', borderRadius: 3, transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#a78bfa' }}>📊 计算结果</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((r, idx) => (
                <div key={r.algorithm} style={{ padding: '10px 12px', background: 'rgba(14,14,24,0.6)', border: '1px solid rgba(108,92,231,0.12)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{r.algorithm}</span>
                    <span style={{ fontSize: 11, color: '#6c7086' }}>⏱ {r.time.toFixed(2)} ms</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5, color: '#cdd6f4', background: 'rgba(14,14,24,0.6)', padding: '6px 8px', borderRadius: 4 }}>
                      {r.hash}
                    </code>
                    <button
                      onClick={() => copyHash(r.hash, idx)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(108,92,231,0.25)',
                        background: 'rgba(108,92,231,0.12)', color: copiedIdx === idx ? '#22c55e' : '#a78bfa',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s',
                      }}
                    >
                      {copiedIdx === idx ? '✓ 已复制' : '复制'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compare */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#a78bfa' }}>⚖️ 哈希对比</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              placeholder="哈希值 A"
              style={{
                width: '100%', background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.15)',
                borderRadius: 8, padding: '8px 12px', color: '#cdd6f4', fontSize: 12, fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <input
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              placeholder="哈希值 B"
              style={{
                width: '100%', background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.15)',
                borderRadius: 8, padding: '8px 12px', color: '#cdd6f4', fontSize: 12, fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            {compareA && compareB && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: compareMatch ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${compareMatch ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: compareMatch ? '#22c55e' : '#f87171',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {compareMatch ? '✅ 哈希值匹配' : '❌ 哈希值不匹配'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
