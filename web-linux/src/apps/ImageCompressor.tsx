import { useState, useCallback, useRef, useEffect } from 'react'

type Format = 'jpeg' | 'png' | 'webp' | 'avif'
type Filter = 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'saturate'

interface ImageItem {
  id: string
  file: File
  originalUrl: string
  processedUrl: string
  originalSize: number
  processedSize: number
  width: number
  height: number
  processedWidth: number
  processedHeight: number
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

const formatLabels: Record<Format, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
}

const filterLabels: Record<Filter, string> = {
  none: '无',
  grayscale: '黑白',
  sepia: '复古',
  blur: '模糊',
  brightness: '亮度',
  contrast: '对比度',
  saturate: '饱和',
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function ImageCompressor() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [targetFormat, setTargetFormat] = useState<Format>('webp')
  const [quality, setQuality] = useState(0.8)
  const [maxWidth, setMaxWidth] = useState(0)
  const [maintainAspect, setMaintainAspect] = useState(true)
  const [filter, setFilter] = useState<Filter>('none')
  const [filterValue, setFilterValue] = useState(1)
  const [processing, setProcessing] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback(async (item: ImageItem, options: {
    format: Format
    quality: number
    maxWidth: number
    maintainAspect: boolean
    filter: Filter
    filterValue: number
  }): Promise<ImageItem> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          let width = img.width
          let height = img.height

          if (options.maxWidth > 0 && width > options.maxWidth) {
            if (options.maintainAspect) {
              height = Math.round(height * (options.maxWidth / width))
            }
            width = options.maxWidth
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'))
            return
          }

          let filterStr = ''
          switch (options.filter) {
            case 'grayscale': filterStr = `grayscale(${options.filterValue})`; break
            case 'sepia': filterStr = `sepia(${options.filterValue})`; break
            case 'blur': filterStr = `blur(${options.filterValue * 2}px)`; break
            case 'brightness': filterStr = `brightness(${options.filterValue})`; break
            case 'contrast': filterStr = `contrast(${options.filterValue})`; break
            case 'saturate': filterStr = `saturate(${options.filterValue})`; break
          }

          if (filterStr) {
            ctx.filter = filterStr
          }

          ctx.drawImage(img, 0, 0, width, height)

          const mimeType = `image/${options.format}`
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('图片处理失败'))
              return
            }

            const url = URL.createObjectURL(blob)
            resolve({
              ...item,
              processedUrl: url,
              processedSize: blob.size,
              processedWidth: width,
              processedHeight: height,
              status: 'done' as const,
            })
          }, mimeType, options.quality)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = item.originalUrl
    })
  }, [])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    
    const newItems: ImageItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        originalUrl: URL.createObjectURL(file),
        processedUrl: '',
        originalSize: file.size,
        processedSize: 0,
        width: 0,
        height: 0,
        processedWidth: 0,
        processedHeight: 0,
        status: 'pending',
      }))
    
    setImages(prev => [...prev, ...newItems])
  }, [])

  const processAll = useCallback(async () => {
    setProcessing(true)
    setImages(prev => prev.map(img => img.status === 'pending' ? { ...img, status: 'processing' } : img))

    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error')
    
    for (const item of pendingImages) {
      setImages(prev => prev.map(img => 
        img.id === item.id ? { ...img, status: 'processing' } : img
      ))
      
      try {
        const result = await processImage(item, {
          format: targetFormat,
          quality,
          maxWidth,
          maintainAspect,
          filter,
          filterValue,
        })
        setImages(prev => prev.map(img => img.id === item.id ? result : img))
      } catch (err) {
        setImages(prev => prev.map(img => img.id === item.id ? {
          ...img,
          status: 'error' as const,
          error: err instanceof Error ? err.message : '处理失败',
        } : img))
      }
    }
    
    setProcessing(false)
  }, [images, targetFormat, quality, maxWidth, maintainAspect, filter, filterValue, processImage])

  const downloadImage = useCallback((item: ImageItem) => {
    if (!item.processedUrl) return
    const a = document.createElement('a')
    a.href = item.processedUrl
    const baseName = item.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}_compressed.${targetFormat}`
    a.click()
  }, [targetFormat])

  const downloadAll = useCallback(() => {
    images.filter(img => img.status === 'done').forEach((img, i) => {
      setTimeout(() => downloadImage(img), i * 200)
    })
  }, [images, downloadImage])

  const removeItem = useCallback((id: string) => {
    setImages(prev => {
      const item = prev.find(i => i.id === id)
      if (item) {
        URL.revokeObjectURL(item.originalUrl)
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl)
      }
      return prev.filter(i => i.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl)
    })
    setImages([])
  }, [images])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl)
      })
    }
  }, [])

  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
  const totalProcessedSize = images.filter(img => img.status === 'done').reduce((sum, img) => sum + img.processedSize, 0)
  const totalSaved = totalOriginalSize - totalProcessedSize
  const savedPercent = totalOriginalSize > 0 && totalProcessedSize > 0 
    ? ((totalSaved / totalOriginalSize) * 100).toFixed(1) 
    : '0'

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e4e4e7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fade-in 0.25s ease-out; }
        .scroll-custom::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroll-custom::-webkit-scrollbar-track { background: transparent; }
        .scroll-custom::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .scroll-custom::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>🖼️</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>图像压缩工具</h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>浏览器内图片压缩、格式转换、滤镜处理</p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Settings Panel */}
        <div style={{
          width: '280px',
          padding: '16px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          overflow: 'auto',
          flexShrink: 0,
        }} className="scroll-custom">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
              输出格式
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {(Object.keys(formatLabels) as Format[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setTargetFormat(fmt)}
                  style={{
                    padding: '8px',
                    background: targetFormat === fmt ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                    border: targetFormat === fmt ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: targetFormat === fmt ? '#34d399' : '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: targetFormat === fmt ? 600 : 400,
                  }}
                >
                  {formatLabels[fmt]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>压缩质量</label>
              <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range" min={0.1} max={1} step={0.05}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              <span>小体积</span><span>高质量</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
              最大宽度 (像素)
            </label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="number" min={0} value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                placeholder="0 = 不限制"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e4e4e7',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[0, 800, 1280, 1920].map(w => (
                <button key={w} onClick={() => setMaxWidth(w)} style={{
                  padding: '4px 8px',
                  background: maxWidth === w ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}>
                  {w === 0 ? '原尺寸' : `${w}px`}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
              <input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} />
              保持宽高比
            </label>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
              滤镜效果
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {(Object.keys(filterLabels) as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px',
                    background: filter === f ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                    border: filter === f ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: filter === f ? '#34d399' : '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
            {filter !== 'none' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px' }}>强度</span>
                  <span style={{ fontSize: '12px', color: '#34d399' }}>{filterValue.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min={0} max={3} step={0.1}
                  value={filterValue}
                  onChange={(e) => setFilterValue(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </>
            )}
          </div>

          {/* Stats */}
          {images.length > 0 && (
            <div style={{
              padding: '12px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '10px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>存储统计</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px' }}>原图总大小</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatBytes(totalOriginalSize)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px' }}>压缩后大小</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>{formatBytes(totalProcessedSize)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px' }}>节省空间</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>
                  {totalSaved > 0 ? `-${formatBytes(totalSaved)} (${savedPercent}%)` : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={processAll}
            disabled={processing || images.filter(i => i.status === 'pending').length === 0}
            style={{
              width: '100%',
              padding: '12px',
              background: processing 
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: processing ? 'not-allowed' : 'pointer',
              marginBottom: '10px',
              opacity: processing || images.filter(i => i.status === 'pending').length === 0 ? 0.6 : 1,
            }}
          >
            {processing ? '⏳ 处理中...' : `🚀 处理全部 (${images.filter(i => i.status === 'pending').length})`}
          </button>

          <button
            onClick={downloadAll}
            disabled={images.filter(i => i.status === 'done').length === 0}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: '10px',
              color: '#60a5fa',
              fontWeight: 500,
              fontSize: '13px',
              cursor: images.filter(i => i.status === 'done').length === 0 ? 'not-allowed' : 'pointer',
              marginBottom: '10px',
              opacity: images.filter(i => i.status === 'done').length === 0 ? 0.5 : 1,
            }}
          >
            📥 下载全部 ({images.filter(i => i.status === 'done').length})
          </button>

          {images.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🗑️ 清空列表
            </button>
          )}
        </div>

        {/* Image List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }} className="scroll-custom">
          {/* Drop zone when empty */}
          {images.length === 0 ? (
            <div
              ref={dragRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                height: '100%',
                minHeight: '400px',
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'rgba(255,255,255,0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                e.currentTarget.style.background = 'rgba(16,185,129,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              <span style={{ fontSize: '64px' }}>📷</span>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>拖拽图片到这里</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>或者点击选择文件</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
                支持 JPEG、PNG、WebP、GIF 等格式
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {images.map(item => (
                <div
                  key={item.id}
                  className="fade-in"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Preview */}
                  <div style={{
                    position: 'relative',
                    paddingTop: '75%',
                    background: 'rgba(0,0,0,0.2)',
                  }}>
                    <img
                      src={item.processedUrl || item.originalUrl}
                      alt={item.file.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {item.status === 'processing' && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span className="pulse" style={{ fontSize: '14px', color: '#34d399' }}>处理中...</span>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(239,68,68,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#fca5a5',
                        padding: '8px',
                        textAlign: 'center',
                      }}>
                        {item.error || '处理失败'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }} title={item.file.name}>
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                      {item.width > 0 && `${item.width}×${item.height}`} · {formatBytes(item.originalSize)}
                    </div>
                    
                    {item.status === 'done' && (
                      <>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          fontSize: '12px',
                        }}>
                          <span style={{ color: '#94a3b8' }}>压缩后</span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {formatBytes(item.processedSize)}
                          </span>
                        </div>
                        <div style={{
                          height: '4px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          marginBottom: '8px',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (1 - item.processedSize / item.originalSize) * 100)}%`,
                            background: '#10b981',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => downloadImage(item)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            📥 下载
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{
                              padding: '8px',
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              color: '#94a3b8',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}

                    {item.status !== 'done' && (
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#94a3b8',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        移除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
