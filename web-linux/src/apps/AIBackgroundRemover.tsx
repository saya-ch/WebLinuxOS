import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  Link2,
  Image as ImageIcon,
  Download,
  Loader2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Check,
  X,
  Layers,
  Zap,
  ChevronRight,
  History,
  Sliders,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

type ProcessStatus = 'pending' | 'processing' | 'done' | 'error' | 'uploading'

interface ImageItem {
  id: string
  file: File | null
  originalUrl: string
  processedUrl: string | null
  originalName: string
  originalSize: number
  width: number
  height: number
  status: ProcessStatus
  progress: number
  error?: string
}

interface HistoryRecord {
  id: string
  originalUrl: string
  processedUrl: string
  timestamp: number
  originalName: string
}

const MAX_BATCH = 5
const HISTORY_KEY = 'ai-bg-remover-history'
const HISTORY_LIMIT = 20

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const BG_REMOVE_PROMPT = 'remove background, transparent background, cutout, product photography, professional cutout, clean background removal'
const DEFAULT_SUBJECT = 'person, product, object'

export default function AIBackgroundRemover() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [subjectPrompt, setSubjectPrompt] = useState(DEFAULT_SUBJECT)
  const [isProcessing, setIsProcessing] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  void compareMode
  const [comparePosition, setComparePosition] = useState(50)
  const [activeCompareId, setActiveCompareId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const dragRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const compareRef = useRef<HTMLDivElement>(null)
  const compareDragging = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const saveHistory = useCallback((record: HistoryRecord) => {
    setHistory(prev => {
      const next = [record, ...prev].slice(0, HISTORY_LIMIT)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
    showToast('历史记录已清空')
  }, [showToast])

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    if (images.length === 0) return
    setImages([])
    setActiveCompareId(null)
    showToast('已清空所有图片')
  }, [images.length, showToast])

  const addImageFromFile = useCallback((file: File) => {
    if (images.length >= MAX_BATCH) {
      showToast(`最多支持 ${MAX_BATCH} 张图片`)
      return
    }
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片大小不能超过 10MB')
      return
    }

    const id = generateId()
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImages(prev => [...prev, {
        id,
        file,
        originalUrl: url,
        processedUrl: null,
        originalName: file.name,
        originalSize: file.size,
        width: img.width,
        height: img.height,
        status: 'pending',
        progress: 0,
      }])
    }
    img.onerror = () => {
      showToast('图片加载失败')
    }
    img.src = url
  }, [images.length, showToast])

  const addImageFromUrl = useCallback(async (url: string) => {
    if (images.length >= MAX_BATCH) {
      showToast(`最多支持 ${MAX_BATCH} 张图片`)
      return
    }
    const trimmed = url.trim()
    if (!trimmed) {
      showToast('请输入图片 URL')
      return
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      showToast('请输入有效的 HTTP/HTTPS URL')
      return
    }

    const id = generateId()
    setImages(prev => [...prev, {
      id,
      file: null,
      originalUrl: trimmed,
      processedUrl: null,
      originalName: trimmed.split('/').pop() || 'image.jpg',
      originalSize: 0,
      width: 0,
      height: 0,
      status: 'uploading',
      progress: 0,
    }])

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('图片加载超时')), 15000)
        img.onload = () => { clearTimeout(t); resolve() }
        img.onerror = () => { clearTimeout(t); reject(new Error('图片加载失败')) }
        img.src = trimmed
      })
      setImages(prev => prev.map(i => i.id === id ? {
        ...i,
        width: img.width,
        height: img.height,
        status: 'pending',
      } : i))
    } catch (e) {
      setImages(prev => prev.map(i => i.id === id ? {
        ...i,
        status: 'error',
        error: handleApiError(e, '图片加载'),
      } : i))
      showToast(`URL 加载失败`)
    }
  }, [images.length, showToast])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(addImageFromFile)
    e.target.value = ''
  }, [addImageFromFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (!files) return
    Array.from(files).forEach(addImageFromFile)
  }, [addImageFromFile])

  const processImage = useCallback(async (item: ImageItem): Promise<ImageItem> => {
    const subject = subjectPrompt.trim() || DEFAULT_SUBJECT
    const prompt = encodeURIComponent(`${BG_REMOVE_PROMPT}, ${subject}`)
    const imageUrl = encodeURIComponent(item.originalUrl)
    const maskSubject = encodeURIComponent(subject)

    const apiUrl = `${API_CONFIG.pollinations.imageBaseUrl}/prompt/${prompt}?image=${imageUrl}&mask=${maskSubject}&model=flux&nologo=true&enhance=true`

    setImages(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing', progress: 10 } : i))

    const progressInterval = setInterval(() => {
      setImages(prev => prev.map(i => {
        if (i.id !== item.id || i.status !== 'processing') return i
        const next = Math.min(i.progress + Math.random() * 8, 85)
        return { ...i, progress: next }
      }))
    }, 500)

    try {
      const response = await fetchWithTimeout(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'image/*' },
      }, 120000)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const processedUrl = URL.createObjectURL(blob)

      setImages(prev => prev.map(i => i.id === item.id ? { ...i, progress: 100 } : i))

      return {
        ...item,
        processedUrl,
        status: 'done',
        progress: 100,
      }
    } catch (e) {
      return {
        ...item,
        status: 'error',
        error: handleApiError(e, '背景移除'),
      }
    } finally {
      clearInterval(progressInterval)
    }
  }, [subjectPrompt])

  const processAll = useCallback(async () => {
    const pending = images.filter(i => i.status === 'pending' || i.status === 'error')
    if (pending.length === 0) {
      showToast('没有待处理的图片')
      return
    }
    setIsProcessing(true)
    showToast(`开始处理 ${pending.length} 张图片...`)

    const results = await Promise.all(pending.map(processImage))

    setImages(prev => {
      const map = new Map(results.map(r => [r.id, r]))
      return prev.map(i => map.get(i.id) || i)
    })

    results.forEach(r => {
      if (r.status === 'done' && r.processedUrl) {
        saveHistory({
          id: generateId(),
          originalUrl: r.originalUrl,
          processedUrl: r.processedUrl,
          timestamp: Date.now(),
          originalName: r.originalName,
        })
      }
    })

    setIsProcessing(false)
    const successCount = results.filter(r => r.status === 'done').length
    showToast(`处理完成：${successCount}/${pending.length} 张成功`)
  }, [images, processImage, saveHistory, showToast])

  const processSingle = useCallback(async (id: string) => {
    const item = images.find(i => i.id === id)
    if (!item) return

    setIsProcessing(true)
    const result = await processImage(item)
    setImages(prev => prev.map(i => i.id === id ? result : i))

    if (result.status === 'done' && result.processedUrl) {
      saveHistory({
        id: generateId(),
        originalUrl: result.originalUrl,
        processedUrl: result.processedUrl,
        timestamp: Date.now(),
        originalName: result.originalName,
      })
      showToast('背景移除成功')
    } else {
      showToast(result.error || '处理失败')
    }
    setIsProcessing(false)
  }, [images, processImage, saveHistory, showToast])

  const downloadImage = useCallback((item: ImageItem) => {
    if (!item.processedUrl) return
    const a = document.createElement('a')
    a.href = item.processedUrl
    const baseName = item.originalName.replace(/\.[^.]+$/, '')
    a.download = `${baseName}-no-bg.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('开始下载')
  }, [showToast])

  const downloadAll = useCallback(() => {
    const done = images.filter(i => i.status === 'done' && i.processedUrl)
    if (done.length === 0) {
      showToast('没有可下载的图片')
      return
    }
    done.forEach((item, idx) => {
      setTimeout(() => downloadImage(item), idx * 200)
    })
  }, [images, downloadImage, showToast])

  const toggleCompare = useCallback((id: string) => {
    if (activeCompareId === id) {
      setActiveCompareId(null)
      setCompareMode(false)
    } else {
      setActiveCompareId(id)
      setCompareMode(true)
      setComparePosition(50)
    }
  }, [activeCompareId])

  const handleCompareMouseDown = useCallback((e: React.MouseEvent) => {
    compareDragging.current = true
    updateComparePosition(e.clientX)
  }, [])

  const handleCompareTouchStart = useCallback((e: React.TouchEvent) => {
    compareDragging.current = true
    const touch = e.touches[0]
    updateComparePosition(touch.clientX)
  }, [])

  const updateComparePosition = useCallback((clientX: number) => {
    if (!compareRef.current) return
    const rect = compareRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setComparePosition(pct)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (compareDragging.current) updateComparePosition(e.clientX)
    }
    const handleMouseUp = () => {
      compareDragging.current = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateComparePosition])

  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.originalUrl.startsWith('blob:')) URL.revokeObjectURL(img.originalUrl)
        if (img.processedUrl?.startsWith('blob:')) URL.revokeObjectURL(img.processedUrl)
      })
    }
  }, [images])

  const activeCompareItem = images.find(i => i.id === activeCompareId)

  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(150deg, #05051a 0%, #0f0f2a 50%, #1a1040 100%)',
      color: '#e8e8ff', fontFamily: 'inherit',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(139,92,246,0.18)',
        background: 'rgba(10,10,25,0.6)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(139,92,246,0.5)',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
              AI 背景移除工具
            </div>
            <div style={{ fontSize: 11, color: '#8b8bbf', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={11} style={{ color: '#06b6d4' }} />
              基于 Pollinations AI · 免费公开 API · 零配置直连
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.08)',
              background: showHistory ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: showHistory ? '#c4b5fd' : '#b9b9e5',
              transition: 'all 0.18s',
            }}
          >
            <History size={14} />
            历史 ({history.length})
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '340px 1fr' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              ref={dragRef}
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDragEnter={e => { e.preventDefault(); e.stopPropagation() }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation() }}
              onDrop={handleDrop}
              style={{
                padding: 24,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(139,92,246,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: 180,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(139,92,246,0.08)'
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={36} style={{ color: '#8b5cf6', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#e0e0ff' }}>
                拖拽图片到此处
              </div>
              <div style={{ fontSize: 11, color: '#8b8bbf', textAlign: 'center' }}>
                或点击选择文件<br />
                支持 JPG / PNG / WebP · 最多 {MAX_BATCH} 张 · 最大 10MB
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
            </div>

            <div style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a5a5d5', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={12} />
                从 URL 导入
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addImageFromUrl(urlInput); setUrlInput('') } }}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, outline: 'none',
                    color: '#ececff', fontSize: 12,
                  }}
                />
                <button
                  onClick={() => { addImageFromUrl(urlInput); setUrlInput('') }}
                  style={{
                    padding: '0 14px', borderRadius: 8, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    border: 'none', color: '#fff', fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <ChevronRight size={14} />
                  添加
                </button>
              </div>
            </div>

            <div style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a5a5d5', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={12} />
                主体识别提示
              </div>
              <input
                type="text"
                value={subjectPrompt}
                onChange={e => setSubjectPrompt(e.target.value)}
                placeholder="描述图中需要保留的主体"
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, outline: 'none',
                  color: '#ececff', fontSize: 12, marginBottom: 8,
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['人物', '商品', '动物', '车辆', '植物', '标志'].map(tag => (
                  <button key={tag}
                    onClick={() => setSubjectPrompt(tag)}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      fontSize: 11, cursor: 'pointer',
                      background: 'rgba(139,92,246,0.12)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      color: '#c4b5fd',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.12)',
              fontSize: 11, color: '#8b8bbf', lineHeight: 1.65,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <AlertCircle size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
              AI 背景移除完全免费，由 Pollinations.ai 提供算力。支持批量处理最多 {MAX_BATCH} 张图片，建议主体描述清晰以获得最佳效果。
            </div>

            {images.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={processAll}
                  disabled={isProcessing}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 12,
                    border: 'none', fontSize: 13, fontWeight: 700,
                    background: isProcessing
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
                    color: isProcessing ? '#6a6a9a' : '#fff',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: isProcessing ? 'none' : '0 8px 28px rgba(139,92,246,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isProcessing ? (
                    <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> 处理中...</>
                  ) : (
                    <><Sparkles size={15} /> 开始批量处理</>
                  )}
                </button>
                <button
                  onClick={clearAll}
                  disabled={isProcessing}
                  style={{
                    padding: '0 14px', borderRadius: 12, cursor: isProcessing ? 'not-allowed' : 'pointer',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#b5b5dd', fontSize: 12,
                  }}
                  title="清空所有"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {images.some(i => i.status === 'done') && (
              <button
                onClick={downloadAll}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.12)',
                  color: '#5eead4', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Download size={14} />
                下载全部结果
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {images.length === 0 && !showHistory && (
              <div style={{
                flex: 1,
                borderRadius: 18,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 400,
                color: '#55558a',
              }}>
                <ImageIcon size={56} style={{ marginBottom: 16, opacity: 0.3 }} />
                <div style={{ fontSize: 14, marginBottom: 4 }}>还没有上传任何图片</div>
                <div style={{ fontSize: 12, color: '#3a3a6a' }}>上传图片或从 URL 添加以开始使用 AI 背景移除</div>
              </div>
            )}

            {showHistory && (
              <div style={{
                borderRadius: 18,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={16} style={{ color: '#8b5cf6' }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>历史记录</span>
                    <span style={{ fontSize: 11, color: '#8b8bbf' }}>({history.length} 条)</span>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#fca5a5', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Trash2 size={12} />
                      清空
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#55558a', fontSize: 12 }}>
                    暂无历史记录
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {history.map((h) => (
                      <div key={h.id} style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div style={{ position: 'relative', aspectRatio: '1', background: '#000' }}>
                          <img src={h.processedUrl} alt={h.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        </div>
                        <div style={{ padding: 8, fontSize: 11, color: '#8b8bbf', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {h.originalName}
                          </span>
                          <button
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = h.processedUrl
                              a.download = `${h.originalName}-no-bg.png`
                              a.click()
                            }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#8b5cf6', padding: 2,
                            }}
                            title="下载"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!showHistory && images.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {images.map((item) => (
                  <div key={item.id} style={{
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                  }}>
                    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                      {item.status === 'processing' ? (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(10,10,25,0.85)', zIndex: 2, gap: 8,
                        }}>
                          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />
                          <div style={{ fontSize: 11, color: '#c4b5fd' }}>{Math.round(item.progress)}%</div>
                        </div>
                      ) : item.status === 'uploading' ? (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(10,10,25,0.85)', zIndex: 2, gap: 8,
                        }}>
                          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
                          <div style={{ fontSize: 11, color: '#c4b5fd' }}>加载中...</div>
                        </div>
                      ) : null}
                      <img
                        src={activeCompareId === item.id && item.processedUrl ? item.processedUrl : item.originalUrl}
                        alt={item.originalName}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          filter: item.status === 'done' && activeCompareId !== item.id ? 'none' : 'none',
                        }}
                      />
                      {item.status === 'done' && activeCompareId !== item.id && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                          backgroundSize: '10px 10px',
                          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
                          opacity: 0.15,
                          pointerEvents: 'none',
                        }} />
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: '#e0e0ff',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, marginRight: 8,
                        }}>
                          {item.originalName}
                        </div>
                        <button
                          onClick={() => removeImage(item.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#6a6a9a', padding: 4, display: 'flex',
                          }}
                          title="移除"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ fontSize: 11, color: '#8b8bbf', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {item.width > 0 && <span>{item.width}×{item.height}</span>}
                        {item.originalSize > 0 && <span>{formatBytes(item.originalSize)}</span>}
                        <span style={{
                          color: item.status === 'done' ? '#34d399'
                            : item.status === 'processing' ? '#06b6d4'
                            : item.status === 'error' ? '#f87171'
                            : '#8b8bbf',
                        }}>
                          {item.status === 'done' ? '✓ 已完成'
                            : item.status === 'processing' ? '处理中'
                            : item.status === 'uploading' ? '加载中'
                            : item.status === 'error' ? '失败'
                            : '待处理'}
                        </span>
                      </div>

                      {item.status === 'processing' && (
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: 'rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${item.progress}%`,
                            background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      )}

                      {item.status === 'error' && item.error && (
                        <div style={{
                          padding: '6px 10px', borderRadius: 8,
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          fontSize: 11, color: '#fca5a5',
                        }}>
                          {item.error}
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <button
                          onClick={() => processSingle(item.id)}
                          disabled={isProcessing}
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            border: 'none', fontSize: 11, fontWeight: 600,
                            background: isProcessing ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.18)',
                            color: isProcessing ? '#6a6a9a' : '#c4b5fd',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Zap size={12} />
                          处理此图
                        </button>
                      )}

                      {item.status === 'done' && item.processedUrl && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                          <button
                            onClick={() => toggleCompare(item.id)}
                            style={{
                              padding: '6px 12px', borderRadius: 8,
                              background: activeCompareId === item.id ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${activeCompareId === item.id ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.06)'}`,
                              color: activeCompareId === item.id ? '#67e8f9' : '#b9b9e5',
                              fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Eye size={12} />
                            {activeCompareId === item.id ? '关闭对比' : '对比效果'}
                          </button>
                          <button
                            onClick={() => downloadImage(item)}
                            style={{
                              padding: '6px 12px', borderRadius: 8,
                              background: 'rgba(16,185,129,0.12)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              color: '#5eead4',
                              fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Download size={12} />
                            下载
                          </button>
                          <button
                            onClick={() => processSingle(item.id)}
                            disabled={isProcessing}
                            style={{
                              padding: 6, borderRadius: 8,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              color: '#b9b9e5',
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            title="重新处理"
                          >
                            <RefreshCw size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeCompareItem && activeCompareItem.processedUrl && (
              <div style={{
                borderRadius: 18,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(139,92,246,0.2)',
                padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={16} style={{ color: '#06b6d4' }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>对比预览</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8b8bbf', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <EyeOff size={12} /> 原图
                    <span style={{ color: '#06b6d4' }}>|</span>
                    <Eye size={12} /> 处理后
                  </div>
                </div>

                <div
                  ref={compareRef}
                  onMouseDown={handleCompareMouseDown}
                  onTouchStart={handleCompareTouchStart}
                  style={{
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#000',
                    cursor: 'col-resize',
                    userSelect: 'none',
                    touchAction: 'none',
                    aspectRatio: activeCompareItem.width > 0 ? `${activeCompareItem.width}/${activeCompareItem.height}` : '16/9',
                    maxHeight: '60vh',
                  }}
                >
                  <img
                    src={activeCompareItem.processedUrl}
                    alt="处理后"
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    overflow: 'hidden',
                    width: `${comparePosition}%`,
                  }}>
                    <img
                      src={activeCompareItem.originalUrl}
                      alt="原图"
                      style={{
                        position: 'absolute', inset: 0,
                        width: `${(100 / comparePosition) * 100}%`,
                        height: '100%',
                        objectFit: 'contain',
                        maxWidth: 'none',
                      }}
                    />
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: `${comparePosition}%`,
                    width: 2,
                    background: '#fff',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 12px rgba(255,255,255,0.6)',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}>
                      <Layers size={16} style={{ color: '#8b5cf6' }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#8b8bbf' }}>
                  拖动中间滑块对比原图与处理效果
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => downloadImage(activeCompareItem)}
                    style={{
                      padding: '8px 18px', borderRadius: 10,
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.35)',
                      color: '#5eead4', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Download size={14} />
                    下载结果
                  </button>
                  <button
                    onClick={() => toggleCompare(activeCompareItem.id)}
                    style={{
                      padding: '8px 18px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#b5b5dd', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <X size={14} />
                    关闭
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)',
          padding: '10px 16px', background: 'rgba(16,185,129,0.95)',
          color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          display: 'flex', alignItems: 'center', gap: 6, zIndex: 999,
          animation: 'toastIn 0.25s ease-out',
        }}>
          <Check size={14} />
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform: translate(-50%, 10px);} to {opacity:1; transform: translate(-50%,0);} }`}</style>
        </div>
      )}
    </div>
  )
}