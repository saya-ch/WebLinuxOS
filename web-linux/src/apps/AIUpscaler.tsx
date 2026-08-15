import { useState, useRef, useCallback } from 'react'

type ProcessStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

interface HistoryItem {
  id: string
  originalUrl: string
  processedUrl: string
  originalSize: { w: number; h: number }
  processedSize: { w: number; h: number }
  timestamp: number
  scale: number
}

const API_BASE = 'https://image.pollinations.ai/prompt'

const PRESET_PROMPTS = [
  { label: '高清放大', value: 'high quality, ultra detailed, sharp, 4k' },
  { label: '艺术增强', value: 'high quality, artistic, enhanced details, vivid colors' },
  { label: '人像优化', value: 'high quality, portrait enhancement, smooth skin, detailed features' },
  { label: '风景优化', value: 'high quality, landscape enhancement, vibrant colors, sharp details' },
  { label: '通用优化', value: 'high quality, enhanced, ultra detailed, professional' },
]

export default function AIUpscaler() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<ProcessStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [scale, setScale] = useState(2)
  const [customPrompt, setCustomPrompt] = useState(PRESET_PROMPTS[0].value)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('aiupscaler_history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [compareMode, setCompareMode] = useState(false)
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [processedSize, setProcessedSize] = useState({ w: 0, h: 0 })
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const compareRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const saveHistory = useCallback((item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 20)
    setHistory(newHistory)
    try { localStorage.setItem('aiupscaler_history', JSON.stringify(newHistory)) } catch {}
  }, [history])

  const loadFromHistory = (item: HistoryItem) => {
    setOriginalUrl(item.originalUrl)
    setProcessedUrl(item.processedUrl)
    setOriginalSize(item.originalSize)
    setProcessedSize(item.processedSize)
    setScale(item.scale)
    setStatus('done')
    setError('')
  }

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem('aiupscaler_history') } catch {}
  }

  const handleFile = async (file: File) => {
    setError('')
    setProcessedUrl(null)
    setStatus('uploading')
    setProgress(10)

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件大小不能超过 10MB')
      }

      const url = URL.createObjectURL(file)
      setProgress(30)
      setOriginalUrl(url)

      const img = new Image()
      img.onload = () => {
        setOriginalSize({ w: img.width, h: img.height })
        setProgress(50)
      }
      img.onerror = () => {
        setError('图片加载失败')
        setStatus('error')
      }
      img.src = url
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败')
      setStatus('error')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    } else {
      setError('请上传图片文件')
      setStatus('error')
    }
  }

  const handleUrlInput = async () => {
    const url = prompt('请输入图片URL：')
    if (!url) return

    setError('')
    setProcessedUrl(null)
    setStatus('uploading')

    try {
      setOriginalUrl(url)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setOriginalSize({ w: img.width, h: img.height })
        setStatus('idle')
      }
      img.onerror = () => {
        setError('无法加载该URL的图片')
        setStatus('error')
      }
      img.src = url
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setStatus('error')
    }
  }

  const processImage = useCallback(async () => {
    if (!originalUrl) return

    setStatus('processing')
    setError('')
    setProgress(10)

    try {
      const enhancedPrompt = encodeURIComponent(`${customPrompt}, upscaled ${scale}x, higher resolution`)
      const targetW = originalSize.w * scale
      const targetH = originalSize.h * scale
      const imageUrl = encodeURIComponent(originalUrl)

      const apiUrl = `${API_BASE}/${enhancedPrompt}?image=${imageUrl}&width=${targetW}&height=${targetH}&nologo=true&enhance=true&model=flux`

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 8, 85))
      }, 500)

      const response = await fetch(apiUrl)

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`API 请求失败：${response.status}`)
      }

      const blob = await response.blob()
      const processedImgUrl = URL.createObjectURL(blob)

      const processedImg = new Image()
      processedImg.onload = () => {
        setProcessedUrl(processedImgUrl)
        setProcessedSize({ w: processedImg.width, h: processedImg.height })
        setProgress(100)
        setStatus('done')

        saveHistory({
          id: Date.now().toString(),
          originalUrl,
          processedUrl: processedImgUrl,
          originalSize,
          processedSize: { w: processedImg.width, h: processedImg.height },
          timestamp: Date.now(),
          scale,
        })
      }
      processedImg.onerror = () => {
        setError('处理结果加载失败')
        setStatus('error')
      }
      processedImg.src = processedImgUrl

    } catch (e) {
      setError(e instanceof Error ? e.message : '处理失败，请重试')
      setStatus('error')
    }
  }, [originalUrl, customPrompt, scale, originalSize, saveHistory])

  const downloadResult = () => {
    if (!processedUrl) return
    const a = document.createElement('a')
    a.href = processedUrl
    a.download = `upscaled_${scale}x_${Date.now()}.png`
    a.click()
  }

  const handleCompareMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true
    if (compareRef.current) {
      const rect = compareRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      compareRef.current.style.setProperty('--compare-x', `${x}%`)
    }
  }

  const handleCompareMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !compareRef.current) return
    const rect = compareRef.current.getBoundingClientRect()
    let x = ((e.clientX - rect.left) / rect.width) * 100
    x = Math.max(0, Math.min(100, x))
    compareRef.current.style.setProperty('--compare-x', `${x}%`)
  }

  const handleCompareMouseUp = () => {
    draggingRef.current = false
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: 'white', fontFamily: "'Noto Sans SC', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      <style>{`
        .compare-container {
          --compare-x: 50%;
          position: relative;
          overflow: hidden;
          user-select: none;
        }
        .compare-container img {
          width: 100%;
          display: block;
          pointer-events: none;
        }
        .compare-original {
          position: absolute;
          top: 0; left: 0;
          clip-path: inset(0 calc(100% - var(--compare-x)) 0 0);
        }
        .compare-slider {
          position: absolute;
          top: 0;
          left: var(--compare-x);
          width: 3px;
          height: 100%;
          background: white;
          cursor: ew-resize;
          transform: translateX(-50%);
          box-shadow: 0 0 10px rgba(255,255,255,0.8);
        }
        .compare-slider::before {
          content: '⇔';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          color: #1a1a2e;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade-in { animation: fade-in 0.3s ease; }
      `}</style>

      <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔍</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>AI 图像放大</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>基于 Pollinations AI 的智能图像增强</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '40px 20px',
              border: `2px dashed ${dragOver ? '#667eea' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 16, textAlign: 'center',
              background: dragOver ? 'rgba(102,126,234,0.1)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>点击或拖拽上传</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>支持 PNG / JPG / WebP，最大 10MB</div>
            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={handleFileInput} style={{ display: 'none' }} />
          </div>

          <button onClick={handleUrlInput} style={{
            padding: '10px 16px', background: 'rgba(255,255,255,0.08)',
            color: 'white', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, cursor: 'pointer', fontSize: 13,
          }}>🌐 从 URL 加载</button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, opacity: 0.7 }}>放大倍数</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1.5, 2, 3, 4].map(s => (
                <button key={s} onClick={() => setScale(s)} style={{
                  flex: 1, padding: '8px 0',
                  background: scale === s ? '#667eea' : 'rgba(255,255,255,0.08)',
                  color: 'white', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13,
                }}>{s}×</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, opacity: 0.7 }}>增强预设</label>
            <select value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} style={{
              padding: '8px 12px', background: 'rgba(255,255,255,0.08)',
              color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, fontSize: 13,
            }}>
              {PRESET_PROMPTS.map(p => (
                <option key={p.label} value={p.value} style={{ color: 'black' }}>{p.label}</option>
              ))}
            </select>
          </div>

          {originalUrl && status === 'idle' && (
            <button onClick={processImage} style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: 12,
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
            }}>
              🚀 开始放大处理
            </button>
          )}

          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
              fontSize: 13, color: '#fca5a5',
            }}>
              ⚠ {error}
            </div>
          )}

          {history.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, opacity: 0.7 }}>历史记录</span>
                <button onClick={clearHistory} style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  fontSize: 12,
                }}>清空</button>
              </div>
              <div style={{ maxHeight: 150, overflow: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {history.map(item => (
                  <div key={item.id} onClick={() => loadFromHistory(item)} style={{
                    width: 60, height: 60, borderRadius: 8,
                    overflow: 'hidden', cursor: 'pointer',
                    border: '2px solid rgba(255,255,255,0.1)',
                    transition: 'border-color 0.3s',
                  }}>
                    <img src={item.processedUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 400 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16, padding: 16,
            minHeight: 400,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {status === 'uploading' && (
              <div style={{
                flex: 1, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 350,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>正在加载图片...</div>
                </div>
              </div>
            )}

            {(status === 'idle' || status === 'processing' || status === 'done' || status === 'error') && originalUrl && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>
                    原图 {originalSize.w}×{originalSize.h}
                  </div>
                  <img src={originalUrl} alt="Original" style={{
                    width: '100%', maxHeight: 300,
                    objectFit: 'contain', borderRadius: 8,
                    background: 'rgba(0,0,0,0.2)',
                  }} />
                </div>

                {processedUrl && !compareMode && (
                  <div style={{ flex: '1 1 250px' }}>
                    <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>
                      放大后 {processedSize.w}×{processedSize.h}
                    </div>
                    <img src={processedUrl} alt="Processed" style={{
                      width: '100%', maxHeight: 300,
                      objectFit: 'contain', borderRadius: 8,
                      background: 'rgba(0,0,0,0.2)',
                    }} />
                  </div>
                )}
              </div>
            )}

            {compareMode && originalUrl && processedUrl && (
              <div
                ref={compareRef}
                className="compare-container fade-in"
                onMouseDown={handleCompareMouseDown}
                onMouseMove={handleCompareMouseMove}
                onMouseUp={handleCompareMouseUp}
                onMouseLeave={handleCompareMouseUp}
                style={{ maxWidth: 500 }}>
                <img src={processedUrl} alt="Processed" />
                <div className="compare-original">
                  <img src={originalUrl} alt="Original" />
                </div>
                <div className="compare-slider" />
              </div>
            )}

            {status === 'processing' && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 14, marginBottom: 12 }}>
                  AI 正在处理中... {Math.round(progress)}%
                </div>
                <div style={{
                  height: 8, background: 'rgba(255,255,255,0.1)',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            )}

            {status === 'done' && processedUrl && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setCompareMode(!compareMode)} style={{
                  padding: '10px 20px',
                  background: compareMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10, cursor: 'pointer', fontSize: 13,
                }}>
                  {compareMode ? '📷 并排对比' : '🔍 滑动对比'}
                </button>
                <button onClick={downloadResult} style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', border: 'none',
                  borderRadius: 10, cursor: 'pointer', fontSize: 13,
                }}>
                  💾 下载结果
                </button>
              </div>
            )}

            {status === 'idle' && !originalUrl && (
              <div style={{
                flex: 1, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 350,
              }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>上传图片开始</div>
                  <div style={{ fontSize: 13 }}>支持本地文件或URL</div>
                </div>
              </div>
            )}
          </div>

          {originalSize.w > 0 && processedSize.w > 0 && (
            <div style={{
              marginTop: 12,
              padding: '12px 16px',
              background: 'rgba(102,126,234,0.1)',
              border: '1px solid rgba(102,126,234,0.2)',
              borderRadius: 12,
              display: 'flex', gap: 24,
              fontSize: 13,
            }}>
              <div>
                <div style={{ opacity: 0.6 }}>原图</div>
                <div>{originalSize.w}×{originalSize.h}</div>
              </div>
              <div>
                <div style={{ opacity: 0.6 }}>放大后</div>
                <div style={{ color: '#a5b4fc' }}>{processedSize.w}×{processedSize.h}</div>
              </div>
              <div>
                <div style={{ opacity: 0.6 }}>像素提升</div>
                <div style={{ color: '#34d399' }}>
                  {((processedSize.w * processedSize.h) / (originalSize.w * originalSize.h)).toFixed(1)}×
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
