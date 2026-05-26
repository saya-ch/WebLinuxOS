import { useState, useRef } from 'react'
import { Upload, Download, Image, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, Trash2, Copy, Check } from 'lucide-react'

export default function ImageOptimizer() {
  const [image, setImage] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState<number>(0)
  const [optimizedSize, setOptimizedSize] = useState<number>(0)
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg')
  const [transforms, setTransforms] = useState({
    rotation: 0,
    flipH: false,
    flipV: false,
    scale: 1,
  })
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
      setOriginalSize(file.size)
      setOptimizedSize(0)
      setTransforms({ rotation: 0, flipH: false, flipV: false, scale: 1 })
    }
    reader.readAsDataURL(file)
  }

  const applyTransforms = () => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      const maxSize = 2048
      let width = img.width * transforms.scale
      let height = img.height * transforms.scale

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      ctx.clearRect(0, 0, width, height)
      ctx.save()

      const centerX = width / 2
      const centerY = height / 2

      ctx.translate(centerX, centerY)
      ctx.rotate((transforms.rotation * Math.PI) / 180)
      ctx.scale(transforms.flipH ? -1 : 1, transforms.flipV ? -1 : 1)

      ctx.drawImage(img, -width / 2, -height / 2, width, height)
      ctx.restore()

      const mimeType = `image/${format}`
      const qualityValue = quality / 100

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setOptimizedSize(blob.size)
          }
        },
        mimeType,
        qualityValue
      )
    }
    img.src = image
  }

  const downloadOptimized = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const mimeType = `image/${format}`
    const qualityValue = quality / 100

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `optimized.${format}`
          a.click()
          URL.revokeObjectURL(url)
        }
      },
      mimeType,
      qualityValue
    )
  }

  const copyToClipboard = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const mimeType = `image/${format}`
    const qualityValue = quality / 100

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [mimeType]: blob })
          ])
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error('复制失败:', err)
        }
      }
    }, mimeType, qualityValue)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const compressionRatio = originalSize > 0 && optimizedSize > 0
    ? Math.round((1 - optimizedSize / originalSize) * 100)
    : 0

  return (
    <div className="app-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 12px',
            background: 'var(--button-primary)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
        >
          <Upload size={14} />
          上传图片
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>格式:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>质量:</label>
          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            style={{ width: 100 }}
          />
          <span style={{ fontSize: 13, minWidth: 40 }}>{quality}%</span>
        </div>

        {image && (
          <>
            <button
              onClick={downloadOptimized}
              style={{
                padding: '8px 12px',
                background: 'var(--button-primary)',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
            >
              <Download size={14} />
              下载
            </button>

            <button
              onClick={copyToClipboard}
              style={{
                padding: '8px 12px',
                background: copied ? '#2ecc71' : 'var(--button-secondary)',
                border: 'none',
                borderRadius: 6,
                color: copied ? 'white' : 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '复制'}
            </button>
          </>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>图片预览</div>
            {image && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setTransforms(t => ({ ...t, rotation: t.rotation - 90 }))}
                  style={{
                    padding: '6px 8px',
                    background: 'var(--button-secondary)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <RotateCw size={14} />
                  旋转
                </button>
                <button
                  onClick={() => setTransforms(t => ({ ...t, flipH: !t.flipH }))}
                  style={{
                    padding: '6px 8px',
                    background: transforms.flipH ? 'var(--button-primary)' : 'var(--button-secondary)',
                    border: 'none',
                    borderRadius: 4,
                    color: transforms.flipH ? 'white' : 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <FlipHorizontal size={14} />
                  水平翻转
                </button>
                <button
                  onClick={() => setTransforms(t => ({ ...t, flipV: !t.flipV }))}
                  style={{
                    padding: '6px 8px',
                    background: transforms.flipV ? 'var(--button-primary)' : 'var(--button-secondary)',
                    border: 'none',
                    borderRadius: 4,
                    color: transforms.flipV ? 'white' : 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <FlipVertical size={14} />
                  垂直翻转
                </button>
                <button
                  onClick={() => setTransforms(t => ({ ...t, scale: Math.max(0.1, t.scale - 0.1) }))}
                  style={{
                    padding: '6px 8px',
                    background: 'var(--button-secondary)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <ZoomOut size={14} />
                  缩小
                </button>
                <button
                  onClick={() => setTransforms(t => ({ ...t, scale: Math.min(3, t.scale + 0.1) }))}
                  style={{
                    padding: '6px 8px',
                    background: 'var(--button-secondary)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <ZoomIn size={14} />
                  放大
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            {image ? (
              <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Image size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: 14 }}>点击"上传图片"开始优化</div>
              </div>
            )}
          </div>
        </div>

        {image && (
          <div style={{ width: 280, borderLeft: '1px solid var(--border-color)', padding: 16, overflow: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>优化结果</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>原始大小</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{formatBytes(originalSize)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>优化后</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{optimizedSize > 0 ? formatBytes(optimizedSize) : '-'}</div>
            </div>

            {compressionRatio > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(46, 204, 113, 0.1)', borderRadius: 8, border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>节省空间</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2ecc71' }}>{compressionRatio}%</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>格式</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{format.toUpperCase()}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>质量</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{quality}%</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>缩放</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{Math.round(transforms.scale * 100)}%</div>
            </div>

            <button
              onClick={applyTransforms}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--button-primary)',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              应用优化
            </button>

            <button
              onClick={() => {
                setImage(null)
                setOriginalSize(0)
                setOptimizedSize(0)
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--button-secondary)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={14} />
              清空
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
