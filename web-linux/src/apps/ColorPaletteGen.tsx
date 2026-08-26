import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Palette,
  Shuffle,
  Copy,
  Check,
  Lock,
  Unlock,
  Save,
  Trash2,
  Droplets,
  RotateCcw,
  Download,
  Eye,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'

// ─── Color Utility Functions ─────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  let h = 0
  let s = 0
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
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sn = s / 100
  const ln = l / 100
  const a = sn * Math.min(ln, 1 - ln)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }
  return { r: f(0), g: f(8), b: f(4) }
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

function getContrastRatio(color1: string, color2: string): number {
  function relativeLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex)
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  const l1 = relativeLuminance(color1)
  const l2 = relativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function wcagLevel(ratio: number): { label: string; pass: boolean; color: string } {
  if (ratio >= 7) return { label: 'AAA', pass: true, color: '#4CAF50' }
  if (ratio >= 4.5) return { label: 'AA', pass: true, color: '#FFC107' }
  if (ratio >= 3) return { label: 'AA Large', pass: true, color: '#FF9800' }
  return { label: 'Fail', pass: false, color: '#F44336' }
}

function generateRandomHex(): string {
  const hex = Math.floor(Math.random() * 16777215).toString(16)
  return '#' + hex.padStart(6, '0').toUpperCase()
}

// ─── Palette Generation ──────────────────────────────────────────────────────

type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'splitComplementary'
  | 'tetradic'

function generateHarmony(baseHex: string, type: HarmonyType, count: number = 5): string[] {
  const { h, s, l } = hexToHsl(baseHex)

  const wrapHue = (hue: number): number => ((hue % 360) + 360) % 360

  switch (type) {
    case 'complementary': {
      const base = hslToHex(h, s, l)
      const comp = hslToHex(wrapHue(h + 180), s, l)
      const mid1 = hslToHex(wrapHue(h + 10), Math.max(0, s - 10), Math.min(100, l + 15))
      const mid2 = hslToHex(wrapHue(h + 170), Math.max(0, s - 10), Math.min(100, l + 15))
      const accent = hslToHex(wrapHue(h + 180), Math.min(100, s + 10), Math.max(0, l - 15))
      return [base, mid1, comp, mid2, accent].slice(0, count)
    }
    case 'analogous': {
      const step = 30
      const startAngle = h - step * 2
      return Array.from({ length: count }, (_, i) =>
        hslToHex(wrapHue(startAngle + step * i), s, l)
      )
    }
    case 'triadic': {
      const base = hslToHex(h, s, l)
      const tri1 = hslToHex(wrapHue(h + 120), s, l)
      const tri2 = hslToHex(wrapHue(h + 240), s, l)
      const mid1 = hslToHex(wrapHue(h + 60), Math.max(0, s - 15), Math.min(100, l + 10))
      const mid2 = hslToHex(wrapHue(h + 180), Math.max(0, s - 15), Math.min(100, l + 10))
      return [base, mid1, tri1, mid2, tri2].slice(0, count)
    }
    case 'splitComplementary': {
      const base = hslToHex(h, s, l)
      const split1 = hslToHex(wrapHue(h + 150), s, l)
      const split2 = hslToHex(wrapHue(h + 210), s, l)
      const mid1 = hslToHex(wrapHue(h + 20), Math.max(0, s - 10), Math.min(100, l + 12))
      const mid2 = hslToHex(wrapHue(h + 180), Math.max(0, s - 20), Math.min(100, l + 20))
      return [base, mid1, split1, mid2, split2].slice(0, count)
    }
    case 'tetradic': {
      const base = hslToHex(h, s, l)
      const t1 = hslToHex(wrapHue(h + 90), s, l)
      const t2 = hslToHex(wrapHue(h + 180), s, l)
      const t3 = hslToHex(wrapHue(h + 270), s, l)
      return [base, t1, t2, t3, hslToHex(h, Math.max(0, s - 20), Math.min(100, l + 15))].slice(
        0,
        count
      )
    }
    default:
      return Array.from({ length: count }, () => generateRandomHex())
  }
}

function generateRandomPalette(count: number = 5): string[] {
  const baseHue = Math.random() * 360
  const saturation = 50 + Math.random() * 40
  return Array.from({ length: count }, (_, i) => {
    const hue = (baseHue + (Math.random() - 0.5) * 60 + (360 / count) * i) % 360
    const l = 35 + Math.random() * 35
    return hslToHex(((hue % 360) + 360) % 360, saturation, l)
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaletteSlot {
  id: string
  hex: string
  locked: boolean
}

interface SavedPalette {
  id: string
  name: string
  colors: string[]
  createdAt: string
}

// ─── Component ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weblinuxos-color-palette-gen'

export default function ColorPaletteGen() {
  const [baseColor, setBaseColor] = useState('#6366F1')
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary')
  const [slots, setSlots] = useState<PaletteSlot[]>(() =>
    generateHarmony('#6366F1', 'complementary').map((hex, i) => ({
      id: String(i),
      hex,
      locked: false,
    }))
  )
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [fgColor, setFgColor] = useState('#000000')
  const [harmonyDropdownOpen, setHarmonyDropdownOpen] = useState(false)

  // Load saved palettes from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSavedPalettes(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const persistPalettes = useCallback((pals: SavedPalette[]) => {
    setSavedPalettes(pals)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pals))
  }, [])

  // Regenerate unlocked colors based on base and harmony
  const regenerate = useCallback(() => {
    const generated = generateHarmony(baseColor, harmonyType, slots.length)
    setSlots((prev) =>
      prev.map((slot, i) => (slot.locked ? slot : { ...slot, hex: generated[i] || generateRandomHex() }))
    )
  }, [baseColor, harmonyType, slots.length])

  // Generate fully random palette
  const randomize = useCallback(() => {
    const randomHex = generateRandomHex()
    setBaseColor(randomHex)
    const generated = generateRandomPalette(slots.length)
    setSlots((prev) =>
      prev.map((slot, i) => (slot.locked ? slot : { ...slot, hex: generated[i] }))
    )
  }, [slots.length])

  // Toggle lock on a slot
  const toggleLock = useCallback((id: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)))
  }, [])

  // Copy to clipboard
  const copyValue = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }, [])

  // Save current palette
  const savePalette = useCallback(() => {
    const name = `Palette ${savedPalettes.length + 1}`
    const newPal: SavedPalette = {
      id: Date.now().toString(),
      name,
      colors: slots.map((s) => s.hex),
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    persistPalettes([...savedPalettes, newPal])
  }, [slots, savedPalettes, persistPalettes])

  // Load saved palette
  const loadPalette = useCallback((pal: SavedPalette) => {
    setSlots(
      pal.colors.map((hex, i) => ({
        id: String(i),
        hex,
        locked: false,
      }))
    )
    setBaseColor(pal.colors[0] || '#6366F1')
  }, [])

  // Delete saved palette
  const deletePalette = useCallback(
    (id: string) => {
      persistPalettes(savedPalettes.filter((p) => p.id !== id))
    },
    [savedPalettes, persistPalettes]
  )

  // Export CSS
  const exportCSS = useCallback(() => {
    const lines = slots.map((s, i) => `  --palette-${i + 1}: ${s.hex};`)
    const css = `:root {\n${lines.join('\n')}\n}`
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'palette.css'
    a.click()
    URL.revokeObjectURL(url)
  }, [slots])

  // Apply base color from a slot
  const setAsBase = useCallback((hex: string) => {
    setBaseColor(hex)
  }, [])

  // Contrast ratio computation
  const contrastInfo = useMemo(() => {
    const ratio = getContrastRatio(fgColor, bgColor)
    const level = wcagLevel(ratio)
    return { ratio, ...level }
  }, [fgColor, bgColor])

  const harmonyOptions: { key: HarmonyType; label: string; desc: string }[] = [
    { key: 'complementary', label: '互补色', desc: '色轮对面的颜色' },
    { key: 'analogous', label: '类似色', desc: '色轮相邻的颜色' },
    { key: 'triadic', label: '三角色', desc: '色轮等距三色' },
    { key: 'splitComplementary', label: '分裂互补', desc: '互补色两侧的颜色' },
    { key: 'tetradic', label: '四角色', desc: '色轮矩形四色' },
  ]

  const currentHarmony = harmonyOptions.find((o) => o.key === harmonyType)!

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Palette size={24} color="var(--accent-color)" />
          <div>
            <h2 style={styles.title}>调色板生成器</h2>
            <p style={styles.subtitle}>色彩和谐 · 对比度检测 · 一键保存</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.iconBtn}
            onClick={randomize}
            title="完全随机"
          >
            <Shuffle size={16} />
            <span>随机</span>
          </button>
          <button
            style={{ ...styles.iconBtn, backgroundColor: 'var(--accent-color)' }}
            onClick={regenerate}
            title="重新生成"
          >
            <RotateCcw size={16} />
            <span>生成</span>
          </button>
          <button style={styles.iconBtn} onClick={savePalette} title="保存调色板">
            <Save size={16} />
            <span>保存</span>
          </button>
          <button style={styles.iconBtn} onClick={exportCSS} title="导出 CSS">
            <Download size={16} />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.body}>
        {/* Left: Base color + Harmony selector + Palettes */}
        <div style={styles.leftPanel}>
          {/* Base Color Picker */}
          <div style={styles.card}>
            <label style={styles.cardTitle}>基准颜色</label>
            <div style={styles.baseColorRow}>
              <div
                style={{
                  ...styles.baseColorPreview,
                  backgroundColor: baseColor,
                }}
              />
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value.toUpperCase())}
                style={styles.colorInput}
              />
              <input
                type="text"
                value={baseColor}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBaseColor(v.toUpperCase())
                }}
                style={styles.hexInput}
                maxLength={7}
              />
            </div>
          </div>

          {/* Harmony Type Selector */}
          <div style={styles.card}>
            <label style={styles.cardTitle}>色彩和谐模式</label>
            <div style={styles.harmonyDropdownWrapper}>
              <button
                style={styles.harmonyDropdownBtn}
                onClick={() => setHarmonyDropdownOpen(!harmonyDropdownOpen)}
              >
                <Droplets size={14} />
                <span>{currentHarmony.label}</span>
                <span style={styles.harmonyDesc}>{currentHarmony.desc}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: harmonyDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    marginLeft: 'auto',
                  }}
                />
              </button>
              {harmonyDropdownOpen && (
                <div style={styles.harmonyDropdown}>
                  {harmonyOptions.map((opt) => (
                    <button
                      key={opt.key}
                      style={{
                        ...styles.harmonyOption,
                        backgroundColor:
                          harmonyType === opt.key ? 'var(--bg-secondary)' : 'transparent',
                      }}
                      onClick={() => {
                        setHarmonyType(opt.key)
                        setHarmonyDropdownOpen(false)
                        // Auto-regenerate with new harmony
                        const generated = generateHarmony(baseColor, opt.key, slots.length)
                        setSlots((prev) =>
                          prev.map((s, i) =>
                            s.locked ? s : { ...s, hex: generated[i] || generateRandomHex() }
                          )
                        )
                      }}
                    >
                      <strong>{opt.label}</strong>
                      <span style={{ fontSize: 11, opacity: 0.6 }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Palette Swatches */}
          <div style={styles.card}>
            <label style={styles.cardTitle}>
              生成的调色板
              <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400, marginLeft: 8 }}>
                {slots.length} 色
              </span>
            </label>
            <div style={styles.swatchesRow}>
              {slots.map((slot) => {
                const { r, g, b } = hexToRgb(slot.hex)
                const hsl = hexToHsl(slot.hex)
                const textColor =
                  hsl.l > 55 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'

                return (
                  <div key={slot.id} style={styles.swatchCard}>
                    <div
                      style={{
                        ...styles.swatchColor,
                        backgroundColor: slot.hex,
                        color: textColor,
                      }}
                    >
                      <button
                        style={{ ...styles.swatchLockBtn, color: textColor }}
                        onClick={() => toggleLock(slot.id)}
                        title={slot.locked ? '解锁' : '锁定'}
                      >
                        {slot.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button
                        style={{ ...styles.swatchUseBtn, color: textColor }}
                        onClick={() => setAsBase(slot.hex)}
                        title="设为基准色"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                    <div style={styles.swatchInfo}>
                      <button
                        style={styles.valueRow}
                        onClick={() => copyValue(slot.hex, `${slot.id}-hex`)}
                        title="点击复制"
                      >
                        <span style={styles.valueLabel}>HEX</span>
                        <span style={styles.valueText}>{slot.hex}</span>
                        {copiedId === `${slot.id}-hex` ? (
                          <Check size={12} color="#4CAF50" />
                        ) : (
                          <Copy size={10} style={{ opacity: 0.3 }} />
                        )}
                      </button>
                      <button
                        style={styles.valueRow}
                        onClick={() => copyValue(`rgb(${r}, ${g}, ${b})`, `${slot.id}-rgb`)}
                        title="点击复制"
                      >
                        <span style={styles.valueLabel}>RGB</span>
                        <span style={styles.valueText}>
                          {r}, {g}, {b}
                        </span>
                        {copiedId === `${slot.id}-rgb` ? (
                          <Check size={12} color="#4CAF50" />
                        ) : (
                          <Copy size={10} style={{ opacity: 0.3 }} />
                        )}
                      </button>
                      <button
                        style={styles.valueRow}
                        onClick={() =>
                          copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, `${slot.id}-hsl`)
                        }
                        title="点击复制"
                      >
                        <span style={styles.valueLabel}>HSL</span>
                        <span style={styles.valueText}>
                          {hsl.h}, {hsl.s}%, {hsl.l}%
                        </span>
                        {copiedId === `${slot.id}-hsl` ? (
                          <Check size={12} color="#4CAF50" />
                        ) : (
                          <Copy size={10} style={{ opacity: 0.3 }} />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contrast Checker */}
          <div style={styles.card}>
            <label style={styles.cardTitle}>
              <Eye size={14} style={{ marginRight: 6 }} />
              对比度检测 (WCAG)
            </label>
            <div style={styles.contrastSection}>
              <div style={styles.contrastPickers}>
                <div style={styles.contrastPickerGroup}>
                  <span style={styles.contrastLabel}>前景色</span>
                  <div style={styles.contrastColorRow}>
                    <div
                      style={{
                        ...styles.contrastPreview,
                        backgroundColor: fgColor,
                      }}
                    />
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value.toUpperCase())}
                      style={styles.colorInputSmall}
                    />
                    <span style={styles.contrastHex}>{fgColor}</span>
                  </div>
                </div>
                <button
                  style={styles.swapBtn}
                  onClick={() => {
                    const t = fgColor
                    setFgColor(bgColor)
                    setBgColor(t)
                  }}
                  title="交换颜色"
                >
                  ⇄
                </button>
                <div style={styles.contrastPickerGroup}>
                  <span style={styles.contrastLabel}>背景色</span>
                  <div style={styles.contrastColorRow}>
                    <div
                      style={{
                        ...styles.contrastPreview,
                        backgroundColor: bgColor,
                        border: '1px solid var(--border-color)',
                      }}
                    />
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                      style={styles.colorInputSmall}
                    />
                    <span style={styles.contrastHex}>{bgColor}</span>
                  </div>
                </div>
              </div>
              <div style={styles.contrastPreviewArea}>
                <div
                  style={{
                    ...styles.contrastDemoBox,
                    backgroundColor: bgColor,
                    color: fgColor,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Aa 示例文本</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Sample Text 123</span>
                </div>
                <div style={styles.contrastResult}>
                  <div style={styles.contrastRatioDisplay}>
                    <span style={styles.ratioNumber}>{contrastInfo.ratio.toFixed(2)}</span>
                    <span style={styles.ratioLabel}>: 1</span>
                  </div>
                  <div
                    style={{
                      ...styles.wcagBadge,
                      backgroundColor: contrastInfo.color + '22',
                      color: contrastInfo.color,
                      border: `1px solid ${contrastInfo.color}44`,
                    }}
                  >
                    {contrastInfo.pass ? <Check size={12} /> : <AlertTriangle size={12} />}
                    {contrastInfo.label}
                  </div>
                </div>
              </div>
              {/* Quick contrast from palette colors */}
              <div style={styles.quickContrastSection}>
                <span style={styles.quickContrastTitle}>快速对比检测</span>
                <div style={styles.quickContrastGrid}>
                  {slots.map((s1) =>
                    slots
                      .filter((s2) => s2.id !== s1.id)
                      .slice(0, 2)
                      .map((s2) => {
                        const ratio = getContrastRatio(s1.hex, s2.hex)
                        const level = wcagLevel(ratio)
                        return (
                          <button
                            key={`${s1.id}-${s2.id}`}
                            style={styles.quickContrastItem}
                            onClick={() => {
                              setFgColor(s1.hex)
                              setBgColor(s2.hex)
                            }}
                            title="点击查看详细对比度"
                          >
                            <div
                              style={{
                                ...styles.quickContrastSwatch,
                                backgroundColor: s2.hex,
                                color: s1.hex,
                              }}
                            >
                              Aa
                            </div>
                            <div style={styles.quickContrastInfo}>
                              <span style={{ fontSize: 10 }}>{ratio.toFixed(1)}:1</span>
                              <span style={{ fontSize: 9, color: level.color }}>{level.label}</span>
                            </div>
                          </button>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Saved Palettes */}
        <div style={styles.rightPanel}>
          <div style={styles.card}>
            <label style={styles.cardTitle}>
              <Save size={14} style={{ marginRight: 6 }} />
              已保存的调色板
              <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400, marginLeft: 8 }}>
                {savedPalettes.length}
              </span>
            </label>
            {savedPalettes.length === 0 ? (
              <div style={styles.emptyState}>
                <Palette size={32} style={{ opacity: 0.2 }} />
                <p style={{ opacity: 0.4, fontSize: 13, marginTop: 8 }}>暂无保存的调色板</p>
                <p style={{ opacity: 0.3, fontSize: 11 }}>点击顶部「保存」按钮保存当前调色板</p>
              </div>
            ) : (
              <div style={styles.savedList}>
                {savedPalettes.map((pal) => (
                  <div key={pal.id} style={styles.savedItem}>
                    <div
                      style={styles.savedSwatches}
                      onClick={() => loadPalette(pal)}
                      title="点击加载此调色板"
                    >
                      {pal.colors.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            ...styles.savedSwatchColor,
                            backgroundColor: c,
                          }}
                        />
                      ))}
                    </div>
                    <div style={styles.savedInfo}>
                      <span style={styles.savedName}>{pal.name}</span>
                      <span style={styles.savedDate}>{pal.createdAt}</span>
                    </div>
                    <button
                      style={styles.savedDeleteBtn}
                      onClick={() => deletePalette(pal.id)}
                      title="删除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Color Wheel Preview */}
          <div style={styles.card}>
            <label style={styles.cardTitle}>色轮预览</label>
            <div style={styles.colorWheelContainer}>
              <svg viewBox="0 0 200 200" style={styles.colorWheel}>
                <defs>
                  {Array.from({ length: 360 }, (_, i) => {
                    const angle = (i * Math.PI) / 180
                    const nextAngle = ((i + 1) * Math.PI) / 180
                    const x1 = 100 + 80 * Math.cos(angle)
                    const y1 = 100 + 80 * Math.sin(angle)
                    const x2 = 100 + 80 * Math.cos(nextAngle)
                    const y2 = 100 + 80 * Math.sin(nextAngle)
                    return (
                      <path
                        key={i}
                        d={`M100,100 L${x1},${y1} L${x2},${y2} Z`}
                        fill={`hsl(${i}, 70%, 55%)`}
                        stroke={`hsl(${i}, 70%, 55%)`}
                        strokeWidth="0.5"
                      />
                    )
                  })}
                </defs>
                <circle cx="100" cy="100" r="35" fill="var(--bg-primary)" />
                {/* Plot harmony points */}
                {slots.map((slot, i) => {
                  const hsl = hexToHsl(slot.hex)
                  const angle = (hsl.h * Math.PI) / 180 - Math.PI / 2
                  const radius = 60 - (hsl.l - 50) * 0.3
                  const x = 100 + radius * Math.cos(angle)
                  const y = 100 + radius * Math.sin(angle)
                  return (
                    <g key={slot.id}>
                      <circle cx={x} cy={y} r={i === 0 ? 9 : 7} fill={slot.hex} stroke="white" strokeWidth="2" />
                      {slot.locked && (
                        <circle cx={x} cy={y} r={11} fill="none" stroke="white" strokeWidth="1" strokeDasharray="2,2" />
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    opacity: 0.5,
    lineHeight: 1.3,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'auto',
    gap: 0,
  },
  leftPanel: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'auto',
  },
  rightPanel: {
    width: 300,
    minWidth: 260,
    padding: 16,
    borderLeft: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'auto',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  baseColorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  baseColorPreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: '2px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  colorInput: {
    width: 48,
    height: 48,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    padding: 0,
  },
  hexInput: {
    flex: 1,
    maxWidth: 120,
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  harmonyDropdownWrapper: {
    position: 'relative',
  },
  harmonyDropdownBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
  },
  harmonyDesc: {
    fontSize: 11,
    opacity: 0.5,
    flex: 1,
  },
  harmonyDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    padding: 4,
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  harmonyOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 8,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  swatchesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
  },
  swatchCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
  },
  swatchColor: {
    height: 90,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 8,
    position: 'relative',
  },
  swatchLockBtn: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    borderRadius: 6,
    padding: '4px 6px',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  swatchUseBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    borderRadius: 6,
    padding: '4px 6px',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  swatchInfo: {
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  valueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 4px',
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'monospace',
    transition: 'background 0.1s',
    width: '100%',
    textAlign: 'left',
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: 700,
    opacity: 0.4,
    width: 28,
    flexShrink: 0,
    textTransform: 'uppercase',
  },
  valueText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contrastSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  contrastPickers: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  contrastPickerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  contrastLabel: {
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  contrastColorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  contrastPreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  colorInputSmall: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    padding: 0,
  },
  contrastHex: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contrastPreviewArea: {
    display: 'flex',
    gap: 16,
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  contrastDemoBox: {
    flex: 1,
    minWidth: 180,
    padding: '16px 20px',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  contrastResult: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 100,
  },
  contrastRatioDisplay: {
    display: 'flex',
    alignItems: 'baseline',
  },
  ratioNumber: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
    fontFamily: 'monospace',
  },
  ratioLabel: {
    fontSize: 12,
    opacity: 0.5,
  },
  wcagBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
  quickContrastSection: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: 12,
  },
  quickContrastTitle: {
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.5,
    display: 'block',
    marginBottom: 8,
  },
  quickContrastGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickContrastItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  quickContrastSwatch: {
    width: 28,
    height: 20,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
  quickContrastInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.2,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
    textAlign: 'center' as const,
  },
  savedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  savedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
  },
  savedSwatches: {
    display: 'flex',
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
  },
  savedSwatchColor: {
    width: 20,
    height: 28,
  },
  savedInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflow: 'hidden',
  },
  savedName: {
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  savedDate: {
    fontSize: 10,
    opacity: 0.4,
  },
  savedDeleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    opacity: 0.3,
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  colorWheelContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0',
  },
  colorWheel: {
    width: 180,
    height: 180,
  },
}
