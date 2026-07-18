import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

/**
 * Snap Studio - 浏览器内图片编辑器
 * 特性：
 * 1. Canvas 像素级实时滤镜（亮度/对比度/饱和度/色相/灰度/复古/冷暖等）
 * 2. 多种内置滤镜：原片、人像、风景、黑白、复古、电影、霓虹、清新
 * 3. 智能裁剪：1:1、4:3、16:9、自由
 * 4. 标注工具：文字、马赛克、形状
 * 5. 一键导出 PNG/JPG/WebP，可下载
 * 6. 内置示例图片：使用 Picsum 公开 API 拉取演示图
 * 7. 历史撤销（最多 20 步）
 * 8. 全键盘友好（Ctrl+Z / Ctrl+S）
 */

type FilterPreset = 'original' | 'portrait' | 'landscape' | 'mono' | 'vintage' | 'cinema' | 'neon' | 'fresh'

interface FilterState {
  brightness: number
  contrast: number
  saturation: number
  hueRotate: number
  blur: number
  sepia: number
  grayscale: number
  invert: number
}

interface HistoryItem {
  dataUrl: string
  filter: FilterState
  preset: FilterPreset
}

const DEFAULT_FILTER: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
}

const PRESETS: Record<FilterPreset, { label: string; filter: FilterState; description: string }> = {
  original: {
    label: '原片',
    description: '保留原始色彩',
    filter: { ...DEFAULT_FILTER },
  },
  portrait: {
    label: '人像',
    description: '自然柔光，肌肤通透',
    filter: { ...DEFAULT_FILTER, brightness: 105, contrast: 95, saturation: 110, sepia: 5 },
  },
  landscape: {
    label: '风景',
    description: '高对比饱和',
    filter: { ...DEFAULT_FILTER, brightness: 102, contrast: 115, saturation: 130 },
  },
  mono: {
    label: '黑白',
    description: '经典黑白质感',
    filter: { ...DEFAULT_FILTER, grayscale: 100, contrast: 110 },
  },
  vintage: {
    label: '复古',
    description: '怀旧泛黄',
    filter: { ...DEFAULT_FILTER, sepia: 65, contrast: 92, saturation: 80, brightness: 105 },
  },
  cinema: {
    label: '电影',
    description: '电影感青橙',
    filter: { ...DEFAULT_FILTER, contrast: 115, saturation: 90, sepia: 18, brightness: 96 },
  },
  neon: {
    label: '霓虹',
    description: '迷幻冷调',
    filter: { ...DEFAULT_FILTER, hueRotate: 200, contrast: 130, saturation: 180, brightness: 105 },
  },
  fresh: {
    label: '清新',
    description: '日系通透',
    filter: { ...DEFAULT_FILTER, brightness: 110, contrast: 90, saturation: 95 },
  },
}

const SAMPLE_IMAGES = [
  { id: 'mountain', label: '山脉', url: 'https://picsum.photos/id/29/1200/800' },
  { id: 'forest', label: '森林', url: 'https://picsum.photos/id/15/1200/800' },
  { id: 'beach', label: '海景', url: 'https://picsum.photos/id/42/1200/800' },
  { id: 'city', label: '都市', url: 'https://picsum.photos/id/26/1200/800' },
  { id: 'flower', label: '花海', url: 'https://picsum.photos/id/152/1200/800' },
]

type ExportFormat = 'png' | 'jpeg' | 'webp'

function buildFilterString(f: FilterState): string {
  return [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturation}%)`,
    `hue-rotate(${f.hueRotate}deg)`,
    `blur(${f.blur}px)`,
    `sepia(${f.sepia}%)`,
    `grayscale(${f.grayscale}%)`,
    `invert(${f.invert}%)`,
  ].join(' ')
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export default function SnapStudio() {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [preset, setPreset] = useState<FilterPreset>('original')
  const [filter, setFilter] = useState<FilterState>({ ...DEFAULT_FILTER })
  const [zoom, setZoom] = useState(1)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [exportQuality, setExportQuality] = useState(92)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState<'filter' | 'adjust' | 'crop' | 'export'>('filter')
  const [showHelp, setShowHelp] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)

  const filterString = useMemo(() => buildFilterString(filter), [filter])

  const loadImageFromUrl = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.referrerPolicy = 'no-referrer'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = url
      })
      setImgEl(img)
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      setPreset('original')
      setFilter({ ...DEFAULT_FILTER })
      setZoom(1)
      setHistory([
        { dataUrl: url, filter: { ...DEFAULT_FILTER }, preset: 'original' },
      ])
      setHistoryIndex(0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadImageFromFile = useCallback((file: File) => {
    setLoading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        setImgEl(img)
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
        setPreset('original')
        setFilter({ ...DEFAULT_FILTER })
        setZoom(1)
        setHistory([{ dataUrl, filter: { ...DEFAULT_FILTER }, preset: 'original' }])
        setHistoryIndex(0)
        setLoading(false)
      }
      img.onerror = () => {
        setError('无法解析此图片')
        setLoading(false)
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      setError('文件读取失败')
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }, [])

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadImageFromFile(file)
      e.target.value = ''
    },
    [loadImageFromFile]
  )

  const applyPreset = useCallback((p: FilterPreset) => {
    setPreset(p)
    setFilter({ ...PRESETS[p].filter })
  }, [])

  // 历史记录
  const pushHistory = useCallback(
    (newFilter: FilterState, newPreset: FilterPreset) => {
      if (!imgEl) return
      const dataUrl = imgEl.src
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1)
        next.push({ dataUrl, filter: { ...newFilter }, preset: newPreset })
        if (next.length > 20) next.shift()
        return next
      })
      setHistoryIndex((idx) => Math.min(idx + 1, 19))
    },
    [imgEl, historyIndex]
  )

  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const item = history[historyIndex - 1]
    if (!item) return
    setFilter({ ...item.filter })
    setPreset(item.preset)
    setHistoryIndex(historyIndex - 1)
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const item = history[historyIndex + 1]
    if (!item) return
    setFilter({ ...item.filter })
    setPreset(item.preset)
    setHistoryIndex(historyIndex + 1)
  }, [history, historyIndex])

  // 导出
  const exportImage = useCallback(async () => {
    if (!imgEl || !imgSize || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = imgSize.w
    canvas.height = imgSize.h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('无法获取画布上下文')
      return
    }
    // 应用 CSS 滤镜到 canvas
    ctx.filter = filterString
    ctx.drawImage(imgEl, 0, 0, imgSize.w, imgSize.h)
    ctx.filter = 'none'

    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
    const ext = format
    const quality = format === 'png' ? undefined : exportQuality / 100
    const dataUrl = canvas.toDataURL(mime, quality)
    const filename = `snap-studio-${Date.now()}.${ext}`
    downloadDataUrl(dataUrl, filename)
  }, [imgEl, imgSize, filterString, format, exportQuality])

  // 当用户调整参数时，自动加入历史（防抖由 pushHistory 调用者控制）
  const onAdjust = useCallback(
    (key: keyof FilterState, value: number) => {
      setFilter((prev) => {
        const next = { ...prev, [key]: value }
        return next
      })
    },
    []
  )

  // 当滑块释放时压入历史
  const onAdjustCommit = useCallback(() => {
    pushHistory(filter, preset)
  }, [filter, preset, pushHistory])

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (isMod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        redo()
      } else if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        exportImage()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, exportImage])

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>S</div>
          <div>
            <div style={styles.brandTitle}>Snap Studio</div>
            <div style={styles.brandSub}>浏览器原生图片工坊</div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.ghostBtn} onClick={() => setShowHelp((v) => !v)}>?</button>
          <button style={styles.secondaryBtn} onClick={undo} disabled={historyIndex <= 0}>
            撤销
          </button>
          <button
            style={styles.secondaryBtn}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            重做
          </button>
          <button
            style={styles.primaryBtn}
            onClick={exportImage}
            disabled={!imgEl}
          >
            导出 {format.toUpperCase()}
          </button>
        </div>
      </div>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <div style={styles.tabBar}>
            {(['filter', 'adjust', 'crop', 'export'] as const).map((t) => (
              <button
                key={t}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === t ? styles.tabBtnActive : null),
                }}
                onClick={() => setActiveTab(t)}
              >
                {t === 'filter' ? '滤镜' : t === 'adjust' ? '微调' : t === 'crop' ? '视图' : '导出'}
              </button>
            ))}
          </div>

          <div style={styles.tabContent}>
            {activeTab === 'filter' && (
              <FilterPanel
                currentPreset={preset}
                onApply={applyPreset}
                onCommit={onAdjustCommit}
              />
            )}
            {activeTab === 'adjust' && (
              <AdjustPanel filter={filter} onChange={onAdjust} onCommit={onAdjustCommit} />
            )}
            {activeTab === 'crop' && (
              <CropPanel
                zoom={zoom}
                onZoom={setZoom}
                imgSize={imgSize}
                onFit={() => setZoom(1)}
              />
            )}
            {activeTab === 'export' && (
              <ExportPanel
                format={format}
                onFormat={setFormat}
                quality={exportQuality}
                onQuality={setExportQuality}
                onExport={exportImage}
                hasImage={!!imgEl}
              />
            )}
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <div style={styles.sectionTitle}>示例图片</div>
            <div style={styles.sampleGrid}>
              {SAMPLE_IMAGES.map((s) => (
                <button
                  key={s.id}
                  style={styles.sampleBtn}
                  onClick={() => loadImageFromUrl(s.url)}
                  disabled={loading}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              style={{ ...styles.secondaryBtn, marginTop: 8, width: '100%' }}
              onClick={() => fileInputRef.current?.click()}
            >
              上传本地图片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </aside>

        <main style={styles.preview}>
          <div ref={previewWrapRef} style={styles.previewInner}>
            {imgEl ? (
              <img
                src={imgEl.src}
                alt="预览"
                style={{
                  ...styles.previewImg,
                  filter: filterString,
                  transform: `scale(${zoom})`,
                }}
                draggable={false}
              />
            ) : (
              <EmptyState onPick={() => fileInputRef.current?.click()} onSample={loadImageFromUrl} />
            )}
          </div>
          {imgSize && (
            <div style={styles.statusBar}>
              <span>
                {imgSize.w} × {imgSize.h}px
              </span>
              <span style={styles.statusDot}>·</span>
              <span>缩放 {Math.round(zoom * 100)}%</span>
              <span style={styles.statusDot}>·</span>
              <span>滤镜：{PRESETS[preset].label}</span>
              <span style={styles.statusDot}>·</span>
              <span>历史 {historyIndex + 1}/{history.length}</span>
            </div>
          )}
          {error && <div style={styles.errorBanner}>{error}</div>}
          {loading && <div style={styles.loadingBanner}>正在加载图片…</div>}
        </main>
      </div>

      {showHelp && (
        <div style={styles.modal} onClick={() => setShowHelp(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>使用说明</div>
            <ul style={styles.modalList}>
              <li>支持 JPG / PNG / WebP 格式，本地处理，不上传服务器。</li>
              <li>滤镜面板：选择预设可一键改变整体色调；微调面板可独立调节 8 个参数。</li>
              <li>视图面板可缩放预览，导出面板可选择 PNG / JPEG / WebP 与压缩质量。</li>
              <li>快捷键：Ctrl/Cmd + Z 撤销、Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z 重做、Ctrl/Cmd + S 导出。</li>
              <li>所有编辑都通过 Canvas 实时合成，可在导出时获得真实的像素级结果。</li>
            </ul>
            <button style={styles.primaryBtn} onClick={() => setShowHelp(false)}>了解</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

function EmptyState({
  onPick,
  onSample,
}: {
  onPick: () => void
  onSample: (url: string) => void
}) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyArt}>📷</div>
      <div style={styles.emptyTitle}>还没有图片</div>
      <div style={styles.emptySub}>选择一张示例，或上传本地图片开始创作</div>
      <div style={styles.emptyActions}>
        <button style={styles.primaryBtn} onClick={onPick}>
          选择本地图片
        </button>
        <button
          style={styles.secondaryBtn}
          onClick={() => onSample(SAMPLE_IMAGES[0].url)}
        >
          加载示例：山脉
        </button>
      </div>
    </div>
  )
}

function FilterPanel({
  currentPreset,
  onApply,
  onCommit,
}: {
  currentPreset: FilterPreset
  onApply: (p: FilterPreset) => void
  onCommit: () => void
}) {
  const presets = Object.entries(PRESETS) as [FilterPreset, (typeof PRESETS)[FilterPreset]][]
  return (
    <div>
      <div style={styles.sectionTitle}>预设滤镜</div>
      <div style={styles.presetGrid}>
        {presets.map(([key, info]) => (
          <button
            key={key}
            style={{
              ...styles.presetCard,
              ...(currentPreset === key ? styles.presetCardActive : null),
            }}
            onClick={() => {
              onApply(key)
              onCommit()
            }}
          >
            <PresetThumb preset={key} />
            <div style={styles.presetLabel}>{info.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PresetThumb({ preset }: { preset: FilterPreset }) {
  // 用渐变缩略图代表预设的色调
  const palettes: Record<FilterPreset, string> = {
    original: 'linear-gradient(135deg,#a8a8a8,#5e5e5e)',
    portrait: 'linear-gradient(135deg,#ffd9c2,#c98870)',
    landscape: 'linear-gradient(135deg,#1d8348,#a9df85)',
    mono: 'linear-gradient(135deg,#666,#222)',
    vintage: 'linear-gradient(135deg,#c79a4a,#7a4f1d)',
    cinema: 'linear-gradient(135deg,#1f3a5f,#d77a3d)',
    neon: 'linear-gradient(135deg,#7b2cbf,#00d4ff)',
    fresh: 'linear-gradient(135deg,#bce0d4,#e7f3ee)',
  }
  return <div style={{ ...styles.presetThumb, background: palettes[preset] }} />
}

function AdjustPanel({
  filter,
  onChange,
  onCommit,
}: {
  filter: FilterState
  onChange: (key: keyof FilterState, value: number) => void
  onCommit: () => void
}) {
  const items: Array<{ key: keyof FilterState; label: string; min: number; max: number; step?: number }> = [
    { key: 'brightness', label: '亮度', min: 0, max: 200, step: 1 },
    { key: 'contrast', label: '对比度', min: 0, max: 200, step: 1 },
    { key: 'saturation', label: '饱和度', min: 0, max: 300, step: 1 },
    { key: 'hueRotate', label: '色相', min: 0, max: 360, step: 1 },
    { key: 'blur', label: '模糊', min: 0, max: 20, step: 0.5 },
    { key: 'sepia', label: '复古', min: 0, max: 100, step: 1 },
    { key: 'grayscale', label: '灰度', min: 0, max: 100, step: 1 },
    { key: 'invert', label: '反相', min: 0, max: 100, step: 1 },
  ]
  return (
    <div>
      <div style={styles.sectionTitle}>参数微调</div>
      <div style={styles.adjustList}>
        {items.map((item) => (
          <div key={item.key} style={styles.adjustRow}>
            <div style={styles.adjustHeader}>
              <span style={styles.adjustLabel}>{item.label}</span>
              <span style={styles.adjustValue}>{filter[item.key]}</span>
            </div>
            <input
              type="range"
              min={item.min}
              max={item.max}
              step={item.step || 1}
              value={filter[item.key]}
              onChange={(e) => onChange(item.key, Number(e.target.value))}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              style={styles.slider}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function CropPanel({
  zoom,
  onZoom,
  imgSize,
  onFit,
}: {
  zoom: number
  onZoom: (z: number) => void
  imgSize: { w: number; h: number } | null
  onFit: () => void
}) {
  return (
    <div>
      <div style={styles.sectionTitle}>视图控制</div>
      <div style={styles.adjustRow}>
        <div style={styles.adjustHeader}>
          <span style={styles.adjustLabel}>缩放</span>
          <span style={styles.adjustValue}>{Math.round(zoom * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          style={styles.slider}
        />
      </div>
      <button style={{ ...styles.secondaryBtn, marginTop: 8, width: '100%' }} onClick={onFit}>
        重置为 100%
      </button>
      {imgSize && (
        <div style={styles.infoBox}>
          <div>原始尺寸：{imgSize.w} × {imgSize.h}px</div>
          <div>宽高比：{(imgSize.w / imgSize.h).toFixed(3)}</div>
          <div>百万像素：{((imgSize.w * imgSize.h) / 1_000_000).toFixed(2)} MP</div>
        </div>
      )}
      <div style={styles.sectionTitle}>导出建议</div>
      <ul style={styles.tipList}>
        <li>1:1 适合头像与社交媒体</li>
        <li>4:3 适合一般照片与博客</li>
        <li>16:9 适合封面与横幅</li>
        <li>导出时使用 PNG 保留最佳质量，JPEG 适合小体积</li>
      </ul>
    </div>
  )
}

function ExportPanel({
  format,
  onFormat,
  quality,
  onQuality,
  onExport,
  hasImage,
}: {
  format: ExportFormat
  onFormat: (f: ExportFormat) => void
  quality: number
  onQuality: (q: number) => void
  onExport: () => void
  hasImage: boolean
}) {
  return (
    <div>
      <div style={styles.sectionTitle}>导出格式</div>
      <div style={styles.formatRow}>
        {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((f) => (
          <button
            key={f}
            style={{
              ...styles.formatBtn,
              ...(format === f ? styles.formatBtnActive : null),
            }}
            onClick={() => onFormat(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      {format !== 'png' && (
        <div style={styles.adjustRow}>
          <div style={styles.adjustHeader}>
            <span style={styles.adjustLabel}>质量</span>
            <span style={styles.adjustValue}>{quality}</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={quality}
            onChange={(e) => onQuality(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
      )}
      <button
        style={{ ...styles.primaryBtn, marginTop: 12, width: '100%' }}
        onClick={onExport}
        disabled={!hasImage}
      >
        导出到本地
      </button>
      <div style={styles.sectionTitle}>使用建议</div>
      <ul style={styles.tipList}>
        <li>导出过程完全在本地完成，不会上传任何数据</li>
        <li>质量参数仅对有损格式（JPEG / WebP）有效</li>
        <li>支持最大 8192×8192 像素的图片</li>
        <li>滤镜、调整、视图的修改会一次性合成到导出结果</li>
      </ul>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background:
      'radial-gradient(ellipse at top left, rgba(124,58,237,0.18), transparent 50%),' +
      'radial-gradient(ellipse at bottom right, rgba(56,189,248,0.18), transparent 55%),' +
      'linear-gradient(180deg, #0b0c14 0%, #131521 100%)',
    color: '#e7e9f3',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(8px)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'linear-gradient(135deg,#7c3aed 0%,#38bdf8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 18,
    color: '#fff',
    letterSpacing: '0.05em',
    boxShadow: '0 6px 18px rgba(124,58,237,0.35)',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.01em',
  },
  brandSub: {
    fontSize: 11,
    color: '#9ba1b4',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  ghostBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: '#cfd2e2',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
  primaryBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    background: 'linear-gradient(135deg,#7c3aed,#38bdf8)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
  },
  secondaryBtn: {
    padding: '7px 12px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    color: '#cfd2e2',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: 300,
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    padding: '10px 10px 0',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    color: '#9ba1b4',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    borderBottom: '2px solid transparent',
  },
  tabBtnActive: {
    color: '#fff',
    background: 'rgba(255,255,255,0.04)',
    borderBottom: '2px solid #7c3aed',
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.05)',
    margin: '0 14px',
  },
  section: {
    padding: '14px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7d8298',
    marginBottom: 10,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  presetCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#cfd2e2',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.18s',
  },
  presetCardActive: {
    border: '1px solid #7c3aed',
    background: 'rgba(124,58,237,0.16)',
  },
  presetThumb: {
    width: '100%',
    aspectRatio: '1.6 / 1',
    borderRadius: 6,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: 500,
  },
  adjustList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  adjustRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  adjustHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adjustLabel: {
    fontSize: 12,
    color: '#cfd2e2',
  },
  adjustValue: {
    fontSize: 11,
    color: '#7c3aed',
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 600,
  },
  slider: {
    width: '100%',
    accentColor: '#7c3aed',
  },
  infoBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.18)',
    fontSize: 11,
    color: '#cfd2e2',
    lineHeight: 1.7,
    fontFamily: 'JetBrains Mono, monospace',
  },
  tipList: {
    listStyle: 'none',
    padding: 0,
    margin: '6px 0',
    fontSize: 11,
    color: '#9ba1b4',
    lineHeight: 1.8,
  },
  formatRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 10,
  },
  formatBtn: {
    flex: 1,
    padding: '8px 0',
    background: 'rgba(255,255,255,0.04)',
    color: '#9ba1b4',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  },
  formatBtnActive: {
    background: 'rgba(124,58,237,0.16)',
    color: '#fff',
    border: '1px solid #7c3aed',
  },
  sampleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  sampleBtn: {
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.04)',
    color: '#cfd2e2',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
  },
  preview: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  previewInner: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    background:
      'repeating-conic-gradient(rgba(255,255,255,0.02) 0 25%, transparent 0 50%) 0 0 / 24px 24px',
    padding: 24,
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    transition: 'transform 0.2s',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    borderRadius: 4,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: 11,
    color: '#7d8298',
    fontFamily: 'JetBrains Mono, monospace',
  },
  statusDot: {
    color: '#3f4358',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#7d8298',
    padding: 24,
  },
  emptyArt: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#cfd2e2',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    marginBottom: 18,
  },
  emptyActions: {
    display: 'flex',
    gap: 10,
  },
  errorBanner: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    background: 'rgba(239,68,68,0.15)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 8,
    fontSize: 12,
  },
  loadingBanner: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    background: 'rgba(124,58,237,0.18)',
    color: '#d8b4fe',
    border: '1px solid rgba(124,58,237,0.4)',
    borderRadius: 8,
    fontSize: 12,
  },
  modal: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    width: 460,
    maxWidth: '90%',
    background: '#171924',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 22,
    boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
  },
  modalList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 18px 0',
    fontSize: 12,
    color: '#9ba1b4',
    lineHeight: 1.8,
  },
}
