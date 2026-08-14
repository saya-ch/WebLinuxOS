import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Upload, Image, Download, Trash2, Eye, Settings,
  Wand, Droplets, Sun, Contrast, RotateCcw, X, Check,
  FileText, Loader2,
} from 'lucide-react'

interface ImageItem {
  id: string
  file: File
  name: string
  size: number
  width: number
  height: number
  originalUrl: string
  processedUrl?: string
  processedBlob?: Blob
  processedSize?: number
  exif?: ExifData
  selected: boolean
  status: 'pending' | 'processing' | 'done' | 'error'
  type?: string
}

interface ExifData {
  width: number
  height: number
  size: number
  type: string
  lastModified: string
}

interface ProcessOptions {
  resizeEnabled: boolean
  maxWidth: number
  maxHeight: number
  maintainAspect: boolean
  format: 'image/jpeg' | 'image/png' | 'image/webp'
  quality: number
  watermark: WatermarkOptions
  filter: FilterOptions
}

interface WatermarkOptions {
  enabled: boolean
  text: string
  opacity: number
  fontSize: number
  color: string
  position: 'tl' | 'tr' | 'bl' | 'br' | 'center'
}

interface FilterOptions {
  brightness: number
  contrast: number
  saturate: number
  grayscale: number
  sepia: number
  blur: number
}

type TabType = 'upload' | 'process' | 'preview' | 'exif'

const DEFAULT_OPTIONS: ProcessOptions = {
  resizeEnabled: false,
  maxWidth: 1920,
  maxHeight: 1080,
  maintainAspect: true,
  format: 'image/jpeg',
  quality: 0.9,
  watermark: {
    enabled: false,
    text: '© 2024',
    opacity: 0.3,
    fontSize: 24,
    color: '#ffffff',
    position: 'br',
  },
  filter: {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  },
}

const FORMAT_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = document.createElement('img')
    img.onload = () => { resolve(img); URL.revokeObjectURL(url) }
    img.onerror = reject
    img.src = url
  })
}

function getExifData(file: File): ExifData {
  return {
    width: 0,
    height: 0,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleString('zh-CN'),
  }
}

function applyFilter(ctx: CanvasRenderingContext2D, _w: number, _h: number, filter: FilterOptions) {
  ctx.filter = `brightness(${filter.brightness}%) contrast(${filter.contrast}%) saturate(${filter.saturate}%) grayscale(${filter.grayscale}%) sepia(${filter.sepia}%) blur(${filter.blur}px)`
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, wm: WatermarkOptions) {
  if (!wm.enabled || !wm.text) return
  ctx.save()
  ctx.globalAlpha = wm.opacity
  ctx.fillStyle = wm.color
  ctx.font = `bold ${wm.fontSize}px 'Inter', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const padding = 20
  let x = w / 2, y = h / 2
  switch (wm.position) {
    case 'tl': x = padding + wm.fontSize / 2; y = padding + wm.fontSize / 2; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; break
    case 'tr': x = w - padding - wm.fontSize / 2; y = padding + wm.fontSize / 2; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; break
    case 'bl': x = padding + wm.fontSize / 2; y = h - padding - wm.fontSize / 2; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; break
    case 'br': x = w - padding - wm.fontSize / 2; y = h - padding - wm.fontSize / 2; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; break
    default: break
  }
  ctx.fillText(wm.text, x, y)
  ctx.restore()
}

async function processImage(
  item: ImageItem,
  options: ProcessOptions
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  const img = await loadImage(item.file)
  let targetW = img.width
  let targetH = img.height

  if (options.resizeEnabled) {
    if (options.maintainAspect) {
      const ratio = img.width / img.height
      if (img.width > options.maxWidth) {
        targetW = options.maxWidth
        targetH = Math.round(options.maxWidth / ratio)
      }
      if (targetH > options.maxHeight) {
        targetH = options.maxHeight
        targetW = Math.round(options.maxHeight * ratio)
      }
      if (img.width <= options.maxWidth && img.height <= options.maxHeight) {
        targetW = img.width
        targetH = img.height
      }
    } else {
      targetW = options.maxWidth
      targetH = options.maxHeight
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')!

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  applyFilter(ctx, targetW, targetH, options.filter)
  ctx.drawImage(img, 0, 0, targetW, targetH)
  ctx.filter = 'none'

  drawWatermark(ctx, targetW, targetH, options.watermark)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          resolve({ blob, url, width: targetW, height: targetH })
        } else {
          reject(new Error('导出失败'))
        }
      },
      options.format,
      options.quality
    )
  })
}

export default function BatchImageProcessor() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [images, setImages] = useState<ImageItem[]>([])
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [dragging, setDragging] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const copyToClipboard = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedValue(label || text)
      setTimeout(() => setCopiedValue(null), 1500)
    })
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const newItems: ImageItem[] = arr.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name,
      size: file.size,
      width: 0,
      height: 0,
      originalUrl: URL.createObjectURL(file),
      selected: true,
      status: 'pending',
      exif: getExifData(file),
    }))
    setImages((prev) => [...prev, ...newItems])
    Promise.all(newItems.map(async (item) => {
      try {
        const img = await loadImage(item.file)
        setImages((prev) => prev.map((p) => p.id === item.id ? { ...p, width: img.width, height: img.height } : p))
      } catch {}
    }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }, [addFiles])

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) {
        URL.revokeObjectURL(item.originalUrl)
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl)
      }
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl)
    })
    setImages([])
  }, [images])

  const toggleSelect = useCallback((id: string) => {
    setImages((prev) => prev.map((p) => p.id === id ? { ...p, selected: !p.selected } : p))
  }, [])

  const selectAll = useCallback((selected: boolean) => {
    setImages((prev) => prev.map((p) => ({ ...p, selected })))
  }, [])

  const processAll = useCallback(async () => {
    const toProcess = images.filter((i) => i.selected && i.status !== 'done')
    if (toProcess.length === 0) return
    setIsProcessing(true)
    setProgress(0)
    let processed = 0
    for (const item of toProcess) {
      setImages((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'processing' } : p))
      try {
        const result = await processImage(item, options)
        setImages((prev) => prev.map((p) => {
          if (p.id === item.id) {
            if (p.processedUrl) URL.revokeObjectURL(p.processedUrl)
            return { ...p, processedUrl: result.url, processedBlob: result.blob, processedSize: result.blob.size, width: result.width, height: result.height, status: 'done' }
          }
          return p
        }))
      } catch (e) {
        setImages((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'error' } : p))
      }
      processed++
      setProgress(Math.round((processed / toProcess.length) * 100))
    }
    setIsProcessing(false)
  }, [images, options])

  const downloadImage = useCallback((item: ImageItem) => {
    if (!item.processedBlob) return
    const ext = FORMAT_EXT[options.format] || '.jpg'
    const baseName = item.name.replace(/\.[^.]+$/, '')
    const url = URL.createObjectURL(item.processedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}_processed${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [options.format])

  const downloadAll = useCallback(() => {
    const processed = images.filter((i) => i.processedBlob)
    if (processed.length === 0) return
    processed.forEach((i, idx) => {
      setTimeout(() => downloadImage(i), idx * 100)
    })
    copyToClipboard(`已开始下载 ${processed.length} 张图片`, '下载队列已启动')
  }, [images, downloadImage, copyToClipboard])

  const totalOriginalSize = useMemo(() => images.reduce((s, i) => s + i.size, 0), [images])
  const totalProcessedSize = useMemo(() => images.reduce((s, i) => s + (i.processedSize || 0), 0), [images])
  const compressionRate = useMemo(() => {
    if (totalOriginalSize === 0 || totalProcessedSize === 0) return 0
    return Math.round((1 - totalProcessedSize / totalOriginalSize) * 100)
  }, [totalOriginalSize, totalProcessedSize])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: '上传', icon: <Upload size={16} /> },
    { id: 'process', label: '处理', icon: <Settings size={16} /> },
    { id: 'preview', label: '预览', icon: <Eye size={16} /> },
    { id: 'exif', label: 'EXIF', icon: <FileText size={16} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e4e4e7', fontFamily: "'Inter','Noto Sans SC',-apple-system,sans-serif", overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #fb923c, #f472b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(251,146,60,0.4)' }}>
            <Image size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>批量图片处理</div>
            <div style={{ fontSize: 11, color: '#71717a' }}>{images.length} 张图片 · {formatBytes(totalOriginalSize)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(251,146,60,0.15)', borderRadius: 8, fontSize: 12, color: '#fb923c' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              处理中 {progress}%
            </div>
          )}
          {totalProcessedSize > 0 && (
            <div style={{ padding: '6px 12px', background: compressionRate > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 12, color: compressionRate > 0 ? '#86efac' : '#f87171', fontWeight: 600 }}>
              {compressionRate > 0 ? `-${compressionRate}%` : `+${Math.abs(compressionRate)}%`}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexShrink: 0, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', background: 'transparent', border: 'none', borderBottom: activeTab === t.id ? '2px solid #fb923c' : '2px solid transparent', color: activeTab === t.id ? '#fb923c' : '#71717a', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400 }}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Upload size={18} />} title="上传图片" />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#fb923c' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 16,
                  padding: 40,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                }}
              >
                <Upload size={48} style={{ color: dragging ? '#fb923c' : '#52525b', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>拖拽图片到这里</div>
                <div style={{ fontSize: 12, color: '#71717a' }}>或点击选择文件 · 支持 JPEG / PNG / WebP</div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => selectAll(true)} style={smallBtnStyle}>全选</button>
                <button onClick={() => selectAll(false)} style={smallBtnStyle}>取消全选</button>
                <button onClick={clearAll} style={{ ...smallBtnStyle, color: '#f87171' }}>
                  <Trash2 size={12} /> 清空
                </button>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Image size={18} />} title={`图片列表 (${images.length})`} />
              <div style={{ maxHeight: 350, overflow: 'auto' }}>
                {images.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>暂无图片</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => toggleSelect(img.id)}
                        style={{
                          position: 'relative',
                          borderRadius: 10,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: img.selected ? '2px solid #fb923c' : '2px solid transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <img src={img.originalUrl} alt={img.name} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', fontSize: 9 }}>
                          <div style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</div>
                          <div style={{ color: '#a1a1aa' }}>{img.width}×{img.height} · {formatBytes(img.size)}</div>
                        </div>
                        {img.status === 'done' && (
                          <div style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#fff" />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                          style={{ position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#fff' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'process' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Settings size={18} />} title="处理设置" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SettingRow label="启用尺寸调整" checked={options.resizeEnabled} onChange={(v) => setOptions((p) => ({ ...p, resizeEnabled: v }))} />
                {options.resizeEnabled && (
                  <div style={{ paddingLeft: 16, borderLeft: '2px solid rgba(251,146,60,0.3)' }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>最大宽度</label>
                        <input type="number" value={options.maxWidth} onChange={(e) => setOptions((p) => ({ ...p, maxWidth: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>最大高度</label>
                        <input type="number" value={options.maxHeight} onChange={(e) => setOptions((p) => ({ ...p, maxHeight: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <SettingRow label="保持宽高比" checked={options.maintainAspect} onChange={(v) => setOptions((p) => ({ ...p, maintainAspect: v }))} />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>输出格式</label>
                  <select value={options.format} onChange={(e) => setOptions((p) => ({ ...p, format: e.target.value as any }))} style={inputStyle}>
                    <option value="image/jpeg">JPEG (.jpg) - 有损压缩</option>
                    <option value="image/png">PNG (.png) - 无损压缩</option>
                    <option value="image/webp">WebP (.webp) - 新一代格式</option>
                  </select>
                </div>

                {options.format !== 'image/png' && (
                  <div>
                    <label style={labelStyle}>压缩质量: {Math.round(options.quality * 100)}%</label>
                    <input type="range" min={10} max={100} value={options.quality * 100} onChange={(e) => setOptions((p) => ({ ...p, quality: Number(e.target.value) / 100 }))} style={{ width: '100%', accentColor: '#fb923c' }} />
                  </div>
                )}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Droplets size={14} /> 水印设置
                  </div>
                  <SettingRow label="启用水印" checked={options.watermark.enabled} onChange={(v) => setOptions((p) => ({ ...p, watermark: { ...p.watermark, enabled: v } }))} />
                  {options.watermark.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                      <input type="text" value={options.watermark.text} onChange={(e) => setOptions((p) => ({ ...p, watermark: { ...p.watermark, text: e.target.value } }))} placeholder="水印文字" style={inputStyle} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>透明度</label>
                          <input type="range" min={5} max={100} value={options.watermark.opacity * 100} onChange={(e) => setOptions((p) => ({ ...p, watermark: { ...p.watermark, opacity: Number(e.target.value) / 100 } }))} style={{ width: '100%', accentColor: '#fb923c' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>字号</label>
                          <input type="number" value={options.watermark.fontSize} onChange={(e) => setOptions((p) => ({ ...p, watermark: { ...p.watermark, fontSize: Number(e.target.value) } }))} style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>位置</label>
                        <select value={options.watermark.position} onChange={(e) => setOptions((p) => ({ ...p, watermark: { ...p.watermark, position: e.target.value as any } }))} style={inputStyle}>
                          <option value="tl">左上</option>
                          <option value="tr">右上</option>
                          <option value="bl">左下</option>
                          <option value="br">右下</option>
                          <option value="center">居中</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>颜色</label>
                        <input type="color" value={options.watermark.color} onChange={(e) => setOptions((p) => ({ ...p, watermark: { ...p.watermark, color: e.target.value } }))} style={{ width: '100%', height: 36, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, background: 'transparent' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Wand size={18} />} title="滤镜调整" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SliderRow label="亮度" value={options.filter.brightness} min={0} max={200} onChange={(v) => setOptions((p) => ({ ...p, filter: { ...p.filter, brightness: v } }))} icon={<Sun size={14} />} />
                <SliderRow label="对比度" value={options.filter.contrast} min={0} max={200} onChange={(v) => setOptions((p) => ({ ...p, filter: { ...p.filter, contrast: v } }))} icon={<Contrast size={14} />} />
                <SliderRow label="饱和度" value={options.filter.saturate} min={0} max={200} onChange={(v) => setOptions((p) => ({ ...p, filter: { ...p.filter, saturate: v } }))} icon={<Droplets size={14} />} />
                <SliderRow label="灰度" value={options.filter.grayscale} min={0} max={100} onChange={(v) => setOptions((p) => ({ ...p, filter: { ...p.filter, grayscale: v } }))} />
                <SliderRow label="褐色" value={options.filter.sepia} min={0} max={100} onChange={(v) => setOptions((p) => ({ ...p, filter: { ...p.filter, sepia: v } }))} />
                <SliderRow label="模糊" value={options.filter.blur} min={0} max={20} onChange={(v) => setOptions((p) => ({ ...p, filter: { ...p.filter, blur: v } }))} />

                <button onClick={() => setOptions((p) => ({ ...p, filter: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 } }))} style={{ ...smallBtnStyle, marginTop: 8 }}>
                  <RotateCcw size={12} /> 重置滤镜
                </button>
              </div>

              <div style={{ marginTop: 20, padding: 16, background: 'rgba(251,146,60,0.1)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#fb923c', marginBottom: 8 }}>将处理 {images.filter((i) => i.selected).length} / {images.length} 张图片</div>
                <button
                  onClick={processAll}
                  disabled={isProcessing || images.filter((i) => i.selected && i.status !== 'done').length === 0}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: isProcessing || images.filter((i) => i.selected && i.status !== 'done').length === 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #fb923c, #f472b6)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    opacity: isProcessing ? 0.6 : 1,
                  }}
                >
                  {isProcessing ? `处理中 ${progress}%` : '开始批量处理'}
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'preview' && (
          <GlassCard>
            <SectionHeader icon={<Eye size={18} />} title="预览对比" />
            {images.filter((i) => i.processedUrl).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>暂无已处理图片</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {images.filter((i) => i.processedUrl).map((img) => (
                  <div key={img.id} style={{ padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{img.name}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => downloadImage(img)} style={{ ...smallBtnStyle }}><Download size={12} /> 下载</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>原图 · {formatBytes(img.size)}</div>
                        <img src={img.originalUrl} alt="original" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.04)' }} />
                        <div style={{ fontSize: 10, color: '#52525b', marginTop: 4 }}>{img.width}×{img.height}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>处理后 · {img.processedSize ? formatBytes(img.processedSize) : '-'}</div>
                        <img src={img.processedUrl} alt="processed" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.04)' }} />
                        <div style={{ fontSize: 10, color: img.processedSize && img.processedSize < img.size ? '#86efac' : '#f87171', marginTop: 4 }}>
                          {img.processedSize && img.processedSize < img.size
                            ? `-${Math.round((1 - img.processedSize / img.size) * 100)}%`
                            : img.processedSize ? `+${Math.round((img.processedSize / img.size - 1) * 100)}%` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={downloadAll} style={{ ...buttonStyle, marginTop: 8 }}>
                  <Download size={14} /> 下载全部
                </button>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'exif' && (
          <GlassCard>
            <SectionHeader icon={<FileText size={18} />} title="EXIF 信息" />
            {images.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>暂无图片</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 10, cursor: 'pointer', border: selectedImage?.id === img.id ? '1px solid #fb923c' : '1px solid transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <img src={img.originalUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</div>
                        <div style={{ fontSize: 10, color: '#71717a' }}>{img.width}×{img.height}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10 }}>
                      <div><span style={{ color: '#52525b' }}>大小:</span> {formatBytes(img.size)}</div>
                      <div><span style={{ color: '#52525b' }}>类型:</span> {img.file.type.split('/')[1]?.toUpperCase()}</div>
                      <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#52525b' }}>修改时间:</span> {new Date(img.file.lastModified).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedImage && (
              <div style={{ marginTop: 16, padding: 16, background: 'rgba(251,146,60,0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#fb923c' }}>
                  详细信息: {selectedImage.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                  <InfoItem label="文件名" value={selectedImage.name} />
                  <InfoItem label="文件大小" value={formatBytes(selectedImage.size)} />
                  <InfoItem label="尺寸" value={`${selectedImage.width}×${selectedImage.height}`} />
                  <InfoItem label="类型" value={selectedImage.type || selectedImage.file.type} />
                  <InfoItem label="修改时间" value={new Date(selectedImage.file.lastModified).toLocaleString('zh-CN')} />
                  {selectedImage.processedSize && (
                    <InfoItem label="处理后大小" value={formatBytes(selectedImage.processedSize)} />
                  )}
                  {selectedImage.processedSize && (
                    <InfoItem
                      label="压缩率"
                      value={`${Math.round((1 - selectedImage.processedSize / selectedImage.size) * 100)}%`}
                    />
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {copiedValue && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: 'rgba(16,185,129,0.9)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 10000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={16} /> 已复制 {copiedValue}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13,
}

const labelStyle: React.CSSProperties = { fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }
const smallBtnStyle: React.CSSProperties = { padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#a1a1aa', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }
const buttonStyle: React.CSSProperties = { padding: '10px 16px', background: '#fb923c', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }

function GlassCard({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)' }}>{children}</div>
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(251,146,60,0.3), rgba(244,114,182,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c' }}>{icon}</div>
    <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
  </div>
}

function SettingRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
    <span>{label}</span>
    <div onClick={(e) => { e.preventDefault(); onChange(!checked) }} style={{ width: 40, height: 22, background: checked ? '#fb923c' : 'rgba(255,255,255,0.1)', borderRadius: 11, position: 'relative', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
    </div>
  </label>
}

function SliderRow({ label, value, min, max, onChange, icon }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; icon?: React.ReactNode }) {
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#fb923c' }}>{value}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#fb923c' }} />
  </div>
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
    <div style={{ fontSize: 10, color: '#52525b' }}>{label}</div>
    <div style={{ fontSize: 12, color: '#e4e4e7', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
  </div>
}