import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Palette,
  Droplets,
  Shuffle,
  Copy,
  Check,
  Undo2,
  Trash2,
  Download,
  Layers,
  Sparkles,
  RotateCcw,
  Sliders,
  Type,
} from 'lucide-react'

type HarmonyType =
  | 'complementary'
  | 'triadic'
  | 'splitComplementary'
  | 'square'
  | 'analogous'
  | 'monochromatic'

type TabType = 'mixer' | 'harmony' | 'palette' | 'convert' | 'export'

interface HistoryEntry {
  colors: string[]
  timestamp: number
}

interface SavedPalette {
  name: string
  colors: string[]
  timestamp: number
}

interface ColorState {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): ColorState {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn)
  let h = 0,
    s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
        break
      case gn:
        h = ((bn - rn) / d + 2) * 60
        break
      case bn:
        h = ((rn - gn) / d + 4) * 60
        break
    }
  }
  return [h, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100,
    ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0,
    g = 0,
    b = 0
  if (hp >= 0 && hp < 1) {
    r = c; g = x; b = 0
  } else if (hp < 2) {
    r = x; g = c; b = 0
  } else if (hp < 3) {
    r = 0; g = c; b = x
  } else if (hp < 4) {
    r = 0; g = x; b = c
  } else if (hp < 5) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }
  const m = ln - c / 2
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return [0, 0, 0, 100]
  const c = (1 - rn - k) / (1 - k)
  const m = (1 - gn - k) / (1 - k)
  const y = (1 - bn - k) / (1 - k)
  return [c * 100, m * 100, y * 100, k * 100]
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255
  const l = 0.4122214708 * rn + 0.5363325363 * gn + 0.0514459929 * bn
  const m = 0.2119034982 * rn + 0.6806995451 * gn + 0.1073969566 * bn
  const s = 0.0883024619 * rn + 0.2817188376 * gn + 0.6299787005 * bn
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s)
  const okl = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const okm = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const oks = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  const lightness = okl * 100
  const chroma = Math.sqrt(okm * okm + oks * oks) * 100
  const hue = ((Math.atan2(oks, okm) * 180) / Math.PI + 360) % 360
  return [lightness, chroma, hue]
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return luminance(r, g, b)
}

function mixColors(hex1: string, hex2: string, ratio: number): string {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  const t = Math.max(0, Math.min(1, ratio))
  const r = Math.round(c1.r * (1 - t) + c2.r * t)
  const g = Math.round(c1.g * (1 - t) + c2.g * t)
  const b = Math.round(c1.b * (1 - t) + c2.b * t)
  return rgbToHex(r, g, b)
}

function generateHarmony(baseHex: string, type: HarmonyType): string[] {
  const { r, g, b } = hexToRgb(baseHex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const result: string[] = []

  switch (type) {
    case 'complementary':
      result.push(baseHex)
      result.push(rgbToHex(...hslToRgb((h + 180) % 360, s, l)))
      break
    case 'triadic':
      result.push(baseHex)
      result.push(rgbToHex(...hslToRgb((h + 120) % 360, s, l)))
      result.push(rgbToHex(...hslToRgb((h + 240) % 360, s, l)))
      break
    case 'splitComplementary':
      result.push(baseHex)
      result.push(rgbToHex(...hslToRgb((h + 150) % 360, s, l)))
      result.push(rgbToHex(...hslToRgb((h + 210) % 360, s, l)))
      break
    case 'square':
      result.push(baseHex)
      result.push(rgbToHex(...hslToRgb((h + 90) % 360, s, l)))
      result.push(rgbToHex(...hslToRgb((h + 180) % 360, s, l)))
      result.push(rgbToHex(...hslToRgb((h + 270) % 360, s, l)))
      break
    case 'analogous':
      for (let i = -3; i <= 3; i++) {
        result.push(rgbToHex(...hslToRgb((h + i * 30 + 360) % 360, s, l)))
      }
      break
    case 'monochromatic':
      for (let i = 0; i < 7; i++) {
        const newL = Math.max(10, Math.min(95, l - 40 + (i * 80) / 6))
        result.push(rgbToHex(...hslToRgb(h, s, newL)))
      }
      break
  }
  return result
}

const STORAGE_KEY_HISTORY = 'colormixer_history'
const STORAGE_KEY_PALETTES = 'colormixer_saved_palettes'

const HarmonyTypes: { value: HarmonyType; label: string; desc: string }[] = [
  { value: 'complementary', label: '互补色', desc: ' opposites attract' },
  { value: 'triadic', label: '三角色', desc: 'triangular balance' },
  { value: 'splitComplementary', label: '分裂互补', desc: 'base + 2 adjacent' },
  { value: 'square', label: '方形', desc: '4-color scheme' },
  { value: 'analogous', label: '类似色', desc: 'neighboring hues' },
  { value: 'monochromatic', label: '单色', desc: 'same hue, diff lightness' },
]

function describeHue(h: number): string {
  if (h < 15 || h >= 345) return '红色 Red'
  if (h < 45) return '橙色 Orange'
  if (h < 75) return '黄色 Yellow'
  if (h < 165) return '绿色 Green'
  if (h < 195) return '青色 Cyan'
  if (h < 255) return '蓝色 Blue'
  if (h < 285) return '紫色 Purple'
  if (h < 315) return '品红 Magenta'
  return '粉红色 Pink'
}

export default function ColorMixerPro() {
  const [activeTab, setActiveTab] = useState<TabType>('mixer')
  const [baseColor, setBaseColor] = useState('#7C6CF0')
  const [blendColor, setBlendColor] = useState('#00D6C1')
  const [blendRatio, setBlendRatio] = useState(0.5)
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary')
  const [paletteSize, setPaletteSize] = useState(6)
  const [paletteColors, setPaletteColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('colormixer_palette_colors')
      return saved ? JSON.parse(saved) : ['#7C6CF0', '#00D6C1', '#F472B6', '#FCD34D', '#86EFAC', '#569CD6']
    } catch {
      return ['#7C6CF0', '#00D6C1', '#F472B6', '#FCD34D', '#86EFAC', '#569CD6']
    }
  })
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PALETTES)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const [newPaletteName, setNewPaletteName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor])
  const [baseH, baseS, baseL] = useMemo(() => rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b), [baseRgb])
  const [baseL2, baseC2, baseH2] = useMemo(() => rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b), [baseRgb])
  const [baseC, baseM, baseY, baseK] = useMemo(() => rgbToCmyk(baseRgb.r, baseRgb.g, baseRgb.b), [baseRgb])

  const mixedColor = useMemo(() => mixColors(baseColor, blendColor, blendRatio), [baseColor, blendColor, blendRatio])
  const harmony = useMemo(() => generateHarmony(baseColor, harmonyType), [baseColor, harmonyType])

  const generatePalette = useCallback(() => {
    const colors: string[] = []
    const forgyPalette = [
      '#5DADE2', '#58D68D', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8B500', '#00CED1', '#FF6B6B', '#C7F464', '#FF8C42',
      '#A8E6CF', '#DCEDC8', '#FFD3B6', '#FFAAA5', '#FF8B94',
      '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA',
    ]
    for (let i = 0; i < paletteSize; i++) {
      const { r: gr, g: gg, b: gb } = hexToRgb(forgyPalette[Math.floor(Math.random() * forgyPalette.length)])
      const [h] = rgbToHsl(gr, gg, gb)
      const adjustedS = 50 + Math.random() * 40
      const adjustedL = 40 + Math.random() * 30
      colors.push(rgbToHex(...hslToRgb(h, adjustedS, adjustedL)))
    }
    setPaletteColors(colors)
    addToHistory(colors)
  }, [paletteSize])

  const addToHistory = useCallback((colors: string[]) => {
    setHistory((prev) => {
      const entry: HistoryEntry = { colors, timestamp: Date.now() }
      const next = [entry, ...prev].slice(0, 30)
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('colormixer_palette_colors', JSON.stringify(paletteColors))
    } catch {}
  }, [paletteColors])

  const copyToClipboard = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedValue(label || text)
      setTimeout(() => setCopiedValue(null), 1500)
    })
  }, [])

  const savePalette = useCallback(() => {
    const name = newPaletteName.trim() || `调色板 ${savedPalettes.length + 1}`
    const newSaved: SavedPalette = {
      name,
      colors: [...paletteColors],
      timestamp: Date.now(),
    }
    setSavedPalettes((prev) => {
      const next = [newSaved, ...prev]
      try {
        localStorage.setItem(STORAGE_KEY_PALETTES, JSON.stringify(next))
      } catch {}
      return next
    })
    setNewPaletteName('')
  }, [newPaletteName, paletteColors, savedPalettes.length])

  const deletePalette = useCallback((index: number) => {
    setSavedPalettes((prev) => {
      const next = prev.filter((_, i) => i !== index)
      try {
        localStorage.setItem(STORAGE_KEY_PALETTES, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY)
    } catch {}
  }, [])

  const undoLastColor = useCallback(() => {
    if (history.length === 0) return
    setPaletteColors(history[0].colors)
  }, [history])

  const generateCSSVars = useCallback(() => {
    const lines = [':root {']
    paletteColors.forEach((c, i) => {
      const name = `--color-${String.fromCharCode(97 + i)}`
      lines.push(`  ${name}: ${c};`)
    })
    lines.push('}')
    return lines.join('\n')
  }, [paletteColors])

  const generateTailwindConfig = useCallback(() => {
    const lines: string[] = []
    lines.push('module.exports = {')
    lines.push('  theme: {')
    lines.push('    extend: {')
    lines.push('      colors: {')
    paletteColors.forEach((c, i) => {
      const shades = generateTailwindShades(c)
      lines.push(`        palette-${i + 1}: {`)
      Object.entries(shades).forEach(([shade, hex]) => {
        lines.push(`          '${shade}': '${hex}',`)
      })
      lines.push('        },')
    })
    lines.push('      }')
    lines.push('    }')
    lines.push('  }')
    lines.push('}')
    return lines.join('\n')
  }, [paletteColors])

  function generateTailwindShades(hex: string): Record<number, string> {
    const shades: Record<number, string> = {}
    const { r, g, b } = hexToRgb(hex)
    const [h, s] = rgbToHsl(r, g, b)
    const lightnessMap: Record<number, number> = {
      50: 95, 100: 90, 200: 80, 300: 70, 400: 60,
      500: 50, 600: 40, 700: 30, 800: 20, 900: 10,
    }
    for (const [shade, targetL] of Object.entries(lightnessMap)) {
      shades[parseInt(shade)] = rgbToHex(...hslToRgb(h, s * 0.9, targetL))
    }
    return shades
  }

  const generateRandomPalette = useCallback(() => {
    const count = paletteSize
    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      const h = Math.random() * 360
      const s = 50 + Math.random() * 40
      const l = 45 + Math.random() * 25
      colors.push(rgbToHex(...hslToRgb(h, s, l)))
    }
    setPaletteColors(colors)
    addToHistory(colors)
  }, [paletteSize, addToHistory])

  const generateFromBase = useCallback(() => {
    const colors: string[] = []
    const { r: gfr, g: gfg, b: gfb } = hexToRgb(baseColor)
    const [h, s, l] = rgbToHsl(gfr, gfg, gfb)
    for (let i = 0; i < paletteSize; i++) {
      const newH = (h + (i * 360) / paletteSize) % 360
      colors.push(rgbToHex(...hslToRgb(newH, s, l)))
    }
    setPaletteColors(colors)
    addToHistory(colors)
  }, [baseColor, paletteSize, addToHistory])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const radius = Math.min(w, h) / 2 - 20

    ctx.clearRect(0, 0, w, h)

    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius)
    const { r: br, g: bg, b: bb } = hexToRgb(baseColor)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.3, `rgb(${br},${bg},${bb})`)
    gradient.addColorStop(1, '#000000')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    harmony.forEach((color, i) => {
      const angle = (i / harmony.length) * Math.PI * 2 - Math.PI / 2
      const dotX = cx + Math.cos(angle) * radius * 0.7
      const dotY = cy + Math.sin(angle) * radius * 0.7
      ctx.beginPath()
      ctx.arc(dotX, dotY, 10, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [baseColor, harmony])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'mixer', label: '混合器', icon: <Droplets size={16} /> },
    { id: 'harmony', label: '和谐度', icon: <Sparkles size={16} /> },
    { id: 'palette', label: '调色板', icon: <Palette size={16} /> },
    { id: 'convert', label: '转换器', icon: <Layers size={16} /> },
    { id: 'export', label: '导出', icon: <Download size={16} /> },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e4e4e7',
        fontFamily: "'Inter', 'Noto Sans SC', -apple-system, sans-serif",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C6CF0, #00D6C1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,108,240,0.4)',
            }}
          >
            <Palette size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
              配色混合器 Pro
            </div>
            <div style={{ fontSize: 11, color: '#71717a' }}>专业色彩工具集</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton title="生成调色板" onClick={generatePalette}>
            <Shuffle size={16} />
          </IconButton>
          <IconButton title="撤销" onClick={undoLastColor} disabled={history.length === 0}>
            <Undo2 size={16} />
          </IconButton>
          <IconButton title="清空历史" onClick={clearHistory} disabled={history.length === 0}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexShrink: 0,
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #7C6CF0' : '2px solid transparent',
              color: activeTab === t.id ? '#a78bfa' : '#71717a',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === t.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'mixer' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Droplets size={18} />} title="颜色混合" />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <ColorInput value={baseColor} onChange={setBaseColor} label="基色" />
                <div
                  style={{
                    flex: 1,
                    height: 60,
                    borderRadius: 16,
                    background: `linear-gradient(90deg, ${baseColor} 0%, ${blendColor} 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${blendRatio * 100}%`,
                      width: 4,
                      height: '100%',
                      background: '#fff',
                      transform: 'translateX(-50%)',
                      boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                    }}
                  />
                </div>
                <ColorInput value={blendColor} onChange={setBlendColor} label="混合色" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: 13,
                    color: '#a1a1aa',
                  }}
                >
                  <span>混合比例</span>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                    {Math.round(blendRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blendRatio * 100}
                  onChange={(e) => setBlendRatio(Number(e.target.value) / 100)}
                  style={{ width: '100%', accentColor: '#7C6CF0' }}
                />
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: mixedColor,
                  textAlign: 'center',
                  boxShadow: `0 12px 32px ${mixedColor}55`,
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: relativeLuminance(mixedColor) > 0.5 ? '#000' : '#fff',
                    marginBottom: 4,
                    opacity: 0.8,
                  }}
                >
                  混合结果
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: relativeLuminance(mixedColor) > 0.5 ? '#000' : '#fff',
                    fontFamily: 'monospace',
                  }}
                >
                  {mixedColor}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => copyToClipboard(mixedColor, 'HEX')}
                  style={buttonStyle('#7C6CF0')}
                >
                  <Copy size={14} /> 复制 HEX
                </button>
                <button
                  onClick={() => copyToClipboard(`rgb(${hexToRgb(mixedColor).r}, ${hexToRgb(mixedColor).g}, ${hexToRgb(mixedColor).b})`, 'RGB')}
                  style={{ ...buttonStyle('transparent'), borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  复制 RGB
                </button>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Sliders size={18} />} title="调色板可视化" />
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                style={{
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 16,
                  display: 'block',
                  margin: '0 auto 16px',
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${harmony.length}, 1fr)`,
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                {harmony.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => setBaseColor(c)}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      background: c,
                      cursor: 'pointer',
                      border: c.toLowerCase() === baseColor.toLowerCase() ? '2px solid #fff' : '2px solid transparent',
                      transition: 'transform 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: relativeLuminance(c) > 0.5 ? '#000' : '#fff',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {c}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={generateFromBase}
                  style={{ ...buttonStyle('#7C6CF0'), flex: 1 }}
                >
                  <Sparkles size={14} /> 基于基色生成
                </button>
                <button
                  onClick={generateRandomPalette}
                  style={{ ...buttonStyle('transparent'), borderColor: 'rgba(255,255,255,0.2)', flex: 1 }}
                >
                  <Shuffle size={14} /> 随机生成
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'harmony' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Sparkles size={18} />} title="色彩和谐度" />
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>
                  基色
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    style={{
                      width: 48,
                      height: 48,
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={baseColor}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) setBaseColor(v)
                      else if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBaseColor(v)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {HarmonyTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setHarmonyType(t.value)}
                    style={{
                      padding: '12px',
                      background: harmonyType === t.value ? 'rgba(124,108,240,0.2)' : 'rgba(255,255,255,0.04)',
                      border: harmonyType === t.value ? '1px solid #7C6CF0' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      color: harmonyType === t.value ? '#a78bfa' : '#a1a1aa',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Palette size={18} />} title={`${HarmonyTypes.find((t) => t.value === harmonyType)?.label} 配色`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {harmony.map((c, i) => {
                  const { r, g, b } = hexToRgb(c)
                  const lum = luminance(r, g, b)
                  return (
                    <div
                      key={i}
                      onClick={() => { setBaseColor(c); copyToClipboard(c) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        background: c,
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                        color: lum > 0.5 ? '#000' : '#fff',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <span style={{ fontSize: 11, opacity: 0.7 }}>#{i + 1}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>{c}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>
                        {Math.round(rgbToHsl(r, g, b)[0])}° · {Math.round(rgbToHsl(r, g, b)[1])}% · {Math.round(rgbToHsl(r, g, b)[2])}%
                      </span>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setPaletteColors(harmony); addToHistory(harmony) }}
                  style={{ ...buttonStyle('#7C6CF0'), flex: 1 }}
                >
                  <Copy size={14} /> 应用到调色板
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'palette' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Palette size={18} />} title="调色板管理" />
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>
                    颜色数量
                  </label>
                  <select
                    value={paletteSize}
                    onChange={(e) => setPaletteSize(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n} 种颜色</option>
                    ))}
                  </select>
                </div>
                <button onClick={generateRandomPalette} style={buttonStyle('#7C6CF0')}>
                  <Shuffle size={14} /> 随机
                </button>
                <button onClick={generatePalette} style={{ ...buttonStyle('transparent'), borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Sparkles size={14} /> 灵感
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(paletteColors.length, 5)}, 1fr)`,
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {paletteColors.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    onClick={() => setSelectedPaletteIndex(selectedPaletteIndex === i ? null : i)}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div
                      style={{
                        height: 80,
                        background: c,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        padding: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: relativeLuminance(c) > 0.5 ? '#000' : '#fff',
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      >
                        {c}
                      </span>
                    </div>
                    {selectedPaletteIndex === i && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.7)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(c) }}
                          style={iconBtnStyle}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const colors = [...paletteColors]
                            colors.splice(i, 1)
                            setPaletteColors(colors)
                          }}
                          style={iconBtnStyle}
                        >
                          <Trash2 size={14} />
                        </button>
                        <input
                          type="color"
                          value={c}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const colors = [...paletteColors]
                            colors[i] = e.target.value
                            setPaletteColors(colors)
                          }}
                          style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedPaletteIndex !== null && (
                <div style={{ fontSize: 12, color: '#a78bfa', textAlign: 'center' }}>
                  点击色块外部关闭操作面板
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  type="text"
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  placeholder="调色板名称（可选）"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                  }}
                />
                <button onClick={savePalette} style={buttonStyle('#00D6C1')}>
                  保存
                </button>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Layers size={18} />} title="历史记录" />
              <div style={{ maxHeight: 300, overflow: 'auto', marginBottom: 16 }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#52525b' }}>
                    暂无历史记录
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {history.slice(0, 15).map((entry, i) => (
                      <div
                        key={i}
                        onClick={() => setPaletteColors(entry.colors)}
                        style={{
                          display: 'flex',
                          gap: 2,
                          padding: 8,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      >
                        {entry.colors.map((c, j) => (
                          <div
                            key={j}
                            style={{
                              flex: 1,
                              height: 28,
                              borderRadius: 4,
                              background: c,
                            }}
                          />
                        ))}
                        <span style={{ fontSize: 9, color: '#52525b', marginLeft: 8, alignSelf: 'center' }}>
                          {new Date(entry.timestamp).toLocaleTimeString('zh-CN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {savedPalettes.length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#a1a1aa' }}>
                    已保存的调色板
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedPalettes.slice(0, 10).map((p, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 10,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => setPaletteColors(p.colors)}
                              style={{
                                padding: '2px 8px',
                                background: 'rgba(124,108,240,0.2)',
                                border: 'none',
                                borderRadius: 4,
                                color: '#a78bfa',
                                fontSize: 10,
                                cursor: 'pointer',
                              }}
                            >
                              加载
                            </button>
                            <button
                              onClick={() => deletePalette(i)}
                              style={{
                                padding: '2px 8px',
                                background: 'rgba(239,68,68,0.2)',
                                border: 'none',
                                borderRadius: 4,
                                color: '#f87171',
                                fontSize: 10,
                                cursor: 'pointer',
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {p.colors.map((c, j) => (
                            <div key={j} style={{ flex: 1, height: 20, borderRadius: 3, background: c }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        )}

        {activeTab === 'convert' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<RotateCcw size={18} />} title="颜色转换器" />
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 16,
                    background: baseColor,
                    boxShadow: `0 8px 32px ${baseColor}55`,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: relativeLuminance(baseColor) > 0.5 ? '#000' : '#fff',
                      fontFamily: 'monospace',
                    }}
                  >
                    {baseColor}
                  </span>
                </div>
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <ConversionRow label="HEX" value={baseColor} onCopy={copyToClipboard} />
              <ConversionRow
                label="RGB"
                value={`rgb(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b})`}
                onCopy={copyToClipboard}
              />
              <ConversionRow
                label="HSL"
                value={`hsl(${Math.round(baseH)}, ${Math.round(baseS)}%, ${Math.round(baseL)}%)`}
                onCopy={copyToClipboard}
              />
              <ConversionRow
                label="CMYK"
                value={`cmyk(${Math.round(baseC)}%, ${Math.round(baseM)}%, ${Math.round(baseY)}%, ${Math.round(baseK)}%)`}
                onCopy={copyToClipboard}
              />
              <ConversionRow
                label="OKLCH"
                value={`oklch(${baseL2.toFixed(1)}% ${baseC2.toFixed(1)} ${Math.round(baseH2)})`}
                onCopy={copyToClipboard}
              />
              <ConversionRow
                label="OKLCH Hex"
                value={`oklch(${baseL2.toFixed(1)}% ${baseC2.toFixed(1)} ${Math.round(baseH2)} / 1)`}
                onCopy={copyToClipboard}
              />
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Type size={18} />} title="色彩分析" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <InfoBox label="色相角" value={`${Math.round(baseH)}°`} accent="#f472b6" />
                <InfoBox label="饱和度" value={`${Math.round(baseS)}%`} accent="#818cf8" />
                <InfoBox label="亮度" value={`${Math.round(baseL)}%`} accent="#86efac" />
                <InfoBox label="相对亮度" value={relativeLuminance(baseColor).toFixed(3)} accent="#fcd34d" />
              </div>

              <div
                style={{
                  padding: 16,
                  background: 'rgba(124,108,240,0.1)',
                  border: '1px solid rgba(124,108,240,0.2)',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#a78bfa' }}>
                  色彩心理学
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.8 }}>
                  <div>
                    <span style={{ color: '#71717a' }}>色相：</span>
                    {describeHue(baseH)}
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>温度：</span>
                    {baseH < 60 || baseH > 300 ? '暖色 Warm' : baseH < 180 ? '凉爽 Cool' : '中性 Neutral'}
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>情绪：</span>
                    {baseS > 70 ? '鲜艳生动 Vivid' : baseS > 40 ? '适中 Moderate' : '柔和 Muted'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                WCAG 对比度检测
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { fg: baseColor, bg: '#000000', label: '黑色背景' },
                  { fg: baseColor, bg: '#FFFFFF', label: '白色背景' },
                  { fg: '#FFFFFF', bg: baseColor, label: '白色文字' },
                  { fg: '#000000', bg: baseColor, label: '黑色文字' },
                ].map((test, i) => {
                  const lum1 = relativeLuminance(test.fg)
                  const lum2 = relativeLuminance(test.bg)
                  const lighter = Math.max(lum1, lum2)
                  const darker = Math.min(lum1, lum2)
                  const ratio = (lighter + 0.05) / (darker + 0.05)
                  return (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>{test.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: ratio >= 4.5 ? '#86efac' : '#f87171' }}>
                        {ratio.toFixed(2)}:1
                      </div>
                      <div style={{ fontSize: 10, color: '#71717a' }}>
                        {ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'export' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Download size={18} />} title="CSS 变量导出" />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => copyToClipboard(generateCSSVars(), 'CSS Variables')}
                  style={buttonStyle('#7C6CF0')}
                >
                  <Copy size={14} /> 复制 CSS
                </button>
              </div>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: 16,
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  color: '#a5f3fc',
                  maxHeight: 300,
                }}
              >
                {generateCSSVars()}
              </pre>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Layers size={18} />} title="Tailwind 配置生成" />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => copyToClipboard(generateTailwindConfig(), 'Tailwind Config')}
                  style={buttonStyle('#00D6C1')}
                >
                  <Copy size={14} /> 复制配置
                </button>
              </div>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: 16,
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  color: '#c4b5fd',
                  maxHeight: 300,
                }}
              >
                {generateTailwindConfig()}
              </pre>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Type size={18} />} title="SCSS 变量导出" />
              <pre
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: 16,
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  color: '#fda4af',
                  maxHeight: 200,
                }}
              >
                {`$palette: (\n${paletteColors
                  .map((c, i) => `  '${String.fromCharCode(97 + i)}': ${c}`)
                  .join(',\n')}\n);`}
              </pre>
              <button
                onClick={() => {
                  const scss = `$palette: (\n${paletteColors
                    .map((c, i) => `  '${String.fromCharCode(97 + i)}': ${c}`)
                    .join(',\n')}\n);`
                  copyToClipboard(scss, 'SCSS')
                }}
                style={{ ...buttonStyle('#7C6CF0'), marginTop: 12 }}
              >
                <Copy size={14} /> 复制 SCSS
              </button>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Sparkles size={18} />} title="导出所有调色板色值" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['HEX', 'RGB', 'HSL', 'OKLCH'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      const values = paletteColors.map((c) => {
                        if (fmt === 'HEX') return c
                        if (fmt === 'RGB') {
                          const { r, g, b } = hexToRgb(c)
                          return `rgb(${r}, ${g}, ${b})`
                        }
                        if (fmt === 'HSL') {
                          const { r, g, b } = hexToRgb(c)
                          const [h, s, l] = rgbToHsl(r, g, b)
                          return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
                        }
                        const { r, g, b } = hexToRgb(c)
                        const [l2, c2, h2] = rgbToOklch(r, g, b)
                        return `oklch(${l2.toFixed(1)}% ${c2.toFixed(1)} ${Math.round(h2)})`
                      })
                      copyToClipboard(values.join(', '), fmt)
                    }}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#e4e4e7',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{fmt} 格式</span>
                    <Copy size={14} />
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {copiedValue && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(16,185,129,0.9)',
            color: '#fff',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Check size={16} /> 已复制 {copiedValue}
        </div>
      )}
    </div>
  )
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(124,108,240,0.3), rgba(0,214,193,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a78bfa',
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
    </div>
  )
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#71717a' }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 44,
          height: 44,
          border: '2px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          background: 'transparent',
          cursor: 'pointer',
          padding: 2,
        }}
      />
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a1a1aa' }}>{value}</span>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: '#a1a1aa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
    >
      {children}
    </button>
  )
}

function ConversionRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 8,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
      }}
    >
      <span style={{ fontSize: 11, color: '#71717a', width: 70, fontWeight: 600 }}>{label}</span>
      <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#e4e4e7' }}>{value}</code>
      <button
        onClick={() => onCopy(value)}
        style={{
          padding: '4px 10px',
          background: 'rgba(124,108,240,0.2)',
          color: '#a78bfa',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        复制
      </button>
    </div>
  )
}

function InfoBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        padding: 10,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  )
}

const buttonStyle = (color: string): React.CSSProperties => ({
  padding: '10px 16px',
  background: color,
  color: color === 'transparent' ? '#e4e4e7' : '#fff',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.15s',
})

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
}