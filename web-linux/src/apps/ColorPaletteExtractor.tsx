import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react'

interface Swatch {
  hex: string
  rgb: [number, number, number]
  count: number
  ratio: number
}

// 使用 4-bit 桶（每通道 16 个等级）做颜色量化
function quantizeColor(r: number, g: number, b: number): string {
  const q = (v: number) => Math.floor(v / 16) * 16
  return `${q(r)},${q(g)},${q(b)}`
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

// 相对亮度（WCAG）
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1)
  const l2 = relativeLuminance(...rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function wcagGrade(ratio: number, large = false): { grade: string; pass: boolean } {
  if (large) {
    if (ratio >= 4.5) return { grade: 'AAA', pass: true }
    if (ratio >= 3) return { grade: 'AA', pass: true }
    return { grade: '不通过', pass: false }
  }
  if (ratio >= 7) return { grade: 'AAA', pass: true }
  if (ratio >= 4.5) return { grade: 'AA', pass: true }
  return { grade: '不通过', pass: false }
}

interface SwatchCardProps {
  swatch: Swatch
  onCopy: (text: string) => void
  isBase: boolean
  onSetBase: () => void
}

const SwatchCard = memo(function SwatchCard({ swatch, onCopy, isBase, onSetBase }: SwatchCardProps) {
  const textColor = relativeLuminance(...swatch.rgb) > 0.5 ? '#1a1a2e' : '#ffffff'
  return (
    <div
      style={{
        background: swatch.hex,
        borderRadius: 12,
        padding: 14,
        minHeight: 110,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: textColor,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isBase ? '0 0 0 2px #8b7cf0' : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onClick={() => onCopy(swatch.hex)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600 }}>
          {swatch.hex}
        </span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{swatch.ratio.toFixed(1)}%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, opacity: 0.85 }}>
          rgb({swatch.rgb.join(', ')})
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSetBase()
          }}
          title="设为对比基准色"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: textColor,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          基准
        </button>
      </div>
    </div>
  )
})

interface ContrastPairProps {
  base: Swatch
  target: Swatch
  ratio: number
}

const ContrastPair = memo(function ContrastPair({ base, target, ratio }: ContrastPairProps) {
  const textOnBase = relativeLuminance(...base.rgb) > 0.5 ? '#1a1a2e' : '#ffffff'
  const textOnTarget = relativeLuminance(...target.rgb) > 0.5 ? '#1a1a2e' : '#ffffff'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 8, overflow: 'hidden', height: 50 }}>
      <div
        style={{
          background: base.hex,
          color: textOnBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Aa 文本示例
      </div>
      <div
        style={{
          background: target.hex,
          color: textOnTarget,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Aa 文本示例
      </div>
      <div
        style={{
          gridColumn: '1 / span 2',
          background: 'rgba(15, 15, 26, 0.85)',
          color: '#cdd6f4',
          padding: '4px 10px',
          fontSize: 11,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {base.hex} ↔ {target.hex}
        </span>
        <span>
          {ratio.toFixed(2)}:1 · 普通 {wcagGrade(ratio, false).grade} · 大字 {wcagGrade(ratio, true).grade}
        </span>
      </div>
    </div>
  )
})

const DEFAULT_PALETTE: Swatch[] = [
  { hex: '#0F0F1A', rgb: [15, 15, 26], count: 1, ratio: 18 },
  { hex: '#1A1A2E', rgb: [26, 26, 46], count: 1, ratio: 14 },
  { hex: '#8B7CF0', rgb: [139, 124, 240], count: 1, ratio: 12 },
  { hex: '#A29BFE', rgb: [162, 155, 254], count: 1, ratio: 10 },
  { hex: '#22C55E', rgb: [34, 197, 94], count: 1, ratio: 8 },
  { hex: '#4ADE80', rgb: [74, 222, 128], count: 1, ratio: 6 },
  { hex: '#FBBF24', rgb: [251, 191, 36], count: 1, ratio: 5 },
  { hex: '#F472B6', rgb: [244, 114, 182], count: 1, ratio: 4 },
]

export default function ColorPaletteExtractor() {
  const [palette, setPalette] = useState<Swatch[]>(DEFAULT_PALETTE)
  const [baseIndex, setBaseIndex] = useState(2)
  const [imageInfo, setImageInfo] = useState<{ name: string; width: number; height: number } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'css' | 'scss' | 'json' | 'tailwind'>('css')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const copyHintTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (copyHintTimerRef.current) window.clearTimeout(copyHintTimerRef.current)
  }, [])

  const extractFromImage = useCallback((img: HTMLImageElement, fileName: string) => {
    const canvas = canvasRef.current ?? (canvasRef.current = document.createElement('canvas'))
    const maxDim = 240
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      setError('浏览器不支持 Canvas 2D 上下文')
      return
    }
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const buckets = new Map<string, { rgb: [number, number, number]; count: number }>()
      let total = 0
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]
        if (a < 200) continue
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const key = quantizeColor(r, g, b)
        const entry = buckets.get(key)
        if (entry) {
          entry.count++
        } else {
          buckets.set(key, { rgb: [r, g, b], count: 1 })
        }
        total++
      }
      if (total === 0) {
        setError('图像中未发现可见像素')
        return
      }
      const sorted = Array.from(buckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        const swatches: Swatch[] = sorted.map((entry) => ({
          hex: rgbToHex(entry.rgb[0], entry.rgb[1], entry.rgb[2]),
          rgb: entry.rgb,
          count: entry.count,
          ratio: (entry.count / total) * 100,
        }))
      setPalette(swatches)
      setBaseIndex(0)
      setImageInfo({ name: fileName, width: img.naturalWidth, height: img.naturalHeight })
      setError(null)
    } catch (err) {
      setError('读取图像数据失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件（PNG / JPG / WebP / GIF）')
        return
      }
      setExtracting(true)
      setError(null)
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        extractFromImage(img, file.name)
        URL.revokeObjectURL(url)
        setExtracting(false)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setError('图片加载失败，请尝试其他文件')
        setExtracting(false)
      }
      img.src = url
    },
    [extractFromImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyHint(`已复制 ${text}`)
        if (copyHintTimerRef.current) window.clearTimeout(copyHintTimerRef.current)
        copyHintTimerRef.current = window.setTimeout(() => setCopyHint(null), 1500)
      })
      .catch(() => {
        setCopyHint('复制失败，请手动复制')
        if (copyHintTimerRef.current) window.clearTimeout(copyHintTimerRef.current)
        copyHintTimerRef.current = window.setTimeout(() => setCopyHint(null), 1500)
      })
  }, [])

  const exportedCode = useMemo(() => {
    const nameOf = (hex: string, idx: number) => {
      const cleaned = hex.replace('#', '').toLowerCase()
      return `color-${idx + 1}-${cleaned}`
    }
    if (exportFormat === 'css') {
      return `:root {\n${palette.map((s, i) => `  --${nameOf(s.hex, i)}: ${s.hex};`).join('\n')}\n}`
    }
    if (exportFormat === 'scss') {
      return palette.map((s, i) => `$${nameOf(s.hex, i)}: ${s.hex};`).join('\n')
    }
    if (exportFormat === 'tailwind') {
      const lines = palette.map((s, i) => {
        const key = nameOf(s.hex, i).split('-').slice(2).join('-')
        return `        'brand-${key}': '${s.hex}',`
      })
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join('\n')}\n      }\n    }\n  }\n}`
    }
    return JSON.stringify(
      palette.reduce<Record<string, string>>((acc, s, i) => {
        acc[nameOf(s.hex, i)] = s.hex
        return acc
      }, {}),
      null,
      2,
    )
  }, [palette, exportFormat])

  const baseSwatch = palette[baseIndex] ?? palette[0]

  return (
    <div
      className="app-container"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>配色方案提取器</h3>
          <p style={{ color: '#8b93b8', margin: '4px 0 0', fontSize: 12 }}>
            上传图片自动提取主色，附带 WCAG 对比度与多格式导出
          </p>
        </div>
        {imageInfo && (
          <span style={{ color: '#a0a8c0', fontSize: 11 }}>
            {imageInfo.name} · {imageInfo.width}×{imageInfo.height}
          </span>
        )}
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '20px 12px',
          border: '2px dashed rgba(139, 124, 240, 0.4)',
          borderRadius: 10,
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(139, 124, 240, 0.05)',
          color: '#a29bfe',
          fontSize: 13,
          transition: 'background 0.2s ease',
        }}
      >
        {extracting ? '正在提取主色…' : '点击或拖拽图片到此处（PNG / JPG / WebP / GIF）'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {palette.map((s, i) => (
          <SwatchCard
            key={`${s.hex}-${i}`}
            swatch={s}
            isBase={i === baseIndex}
            onSetBase={() => setBaseIndex(i)}
            onCopy={handleCopy}
          />
        ))}
      </div>

      {copyHint && (
        <div
          style={{
            alignSelf: 'center',
            padding: '4px 10px',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#86efac',
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          {copyHint}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <div style={{ color: '#8b93b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            对比度检查 · 基准色 {baseSwatch.hex}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', maxHeight: '100%' }}>
            {palette.map((s, i) => {
              if (i === baseIndex) return null
              const ratio = contrastRatio(baseSwatch.rgb, s.rgb)
              return <ContrastPair key={`${baseSwatch.hex}-${s.hex}-${i}`} base={baseSwatch} target={s} ratio={ratio} />
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['css', 'scss', 'json', 'tailwind'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid rgba(139, 124, 240, 0.3)',
                  background:
                    exportFormat === fmt ? 'rgba(139, 124, 240, 0.3)' : 'rgba(139, 124, 240, 0.08)',
                  color: '#a29bfe',
                  cursor: 'pointer',
                }}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => handleCopy(exportedCode)}
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                fontSize: 12,
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 6,
                color: '#86efac',
                cursor: 'pointer',
              }}
            >
              复制全部
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              flex: 1,
              background: 'rgba(15, 15, 26, 0.7)',
              border: '1px solid rgba(139, 124, 240, 0.18)',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#cdd6f4',
              overflow: 'auto',
            }}
          >
            {exportedCode}
          </pre>
        </div>
      </div>
    </div>
  )
}
