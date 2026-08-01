import React, { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { useStore } from '../store'

/* ========== 色彩工具函数 ========== */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

function isValidHex(v: string): boolean {
  return /^#?([0-9a-fA-F]{6})$/.test(v)
}

/* WCAG 2.1 对比度计算 */
function relativeLuminance(r: number, g: number, b: number): number {
  const convert = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b)
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getWcagLevel(ratio: number): { aa: boolean; aaa: boolean; aaLarge: boolean; aaaLarge: boolean } {
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  }
}

/* 色盲模拟 */
function simulateColorBlindness(r: number, g: number, b: number, type: string): [number, number, number] {
  let nr = r, ng = g, nb = b
  switch (type) {
    case 'achromatopsia': {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      nr = ng = nb = gray
      break
    }
    case 'protanopia': {
      nr = 0.567 * r + 0.433 * g
      ng = 0.558 * r + 0.442 * g
      nb = 0.242 * r + 0.758 * b
      break
    }
    case 'deuteranopia': {
      nr = 0.625 * r + 0.375 * g
      ng = 0.7 * r + 0.3 * g
      nb = 0.3 * g + 0.7 * b
      break
    }
    case 'tritanopia': {
      nr = 0.95 * r + 0.05 * b
      ng = 0.95 * g + 0.05 * b
      nb = 0.433 * r + 0.567 * b
      break
    }
  }
  return [clamp(nr, 0, 255), clamp(ng, 0, 255), clamp(nb, 0, 255)]
}

/* ========== 子组件 ========== */

const Panel: React.FC<{ children: React.ReactNode; title?: string; dark: boolean }> = ({ children, title, dark }) => (
  <div style={{
    background: dark ? '#1e1e2e' : '#fff',
    borderRadius: 12,
    padding: 18,
    border: `1px solid ${dark ? '#313244' : '#e0e0e0'}`,
    boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.08)',
  }}>
    {title && (
      <h3 style={{
        margin: '0 0 14px',
        fontSize: 15,
        fontWeight: 700,
        color: dark ? '#cdd6f4' : '#333',
        letterSpacing: 0.3,
      }}>{title}</h3>
    )}
    {children}
  </div>
)

const CopyButton: React.FC<{ text: string; dark: boolean }> = ({ text, dark }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }).catch(() => {})
  }, [text])
  return (
    <button onClick={handleCopy} style={{
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      background: copied ? '#a6e3a1' : dark ? '#45475a' : '#e0e0e0',
      color: copied ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
      transition: 'all 0.2s',
    }}>{copied ? '✓ 已复制' : '复制'}</button>
  )
}

/* ========== 1. 颜色转换面板 ========== */

const ConverterPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [color, setColor] = useState('#89b4fa')
  const [hexInput, setHexInput] = useState('#89b4fa')
  const [rgbInput, setRgbInput] = useState({ r: 137, g: 180, b: 250 })
  const [hslInput, setHslInput] = useState({ h: 217, s: 92, l: 76 })

  const syncFromHex = useCallback((hex: string) => {
    setColor(hex)
    setHexInput(hex)
    const [r, g, b] = hexToRgb(hex)
    setRgbInput({ r, g, b })
    const [h, s, l] = rgbToHsl(r, g, b)
    setHslInput({ h, s, l })
  }, [])

  const handleHexChange = (v: string) => {
    setHexInput(v)
    if (isValidHex(v)) syncFromHex(v.startsWith('#') ? v : `#${v}`)
  }

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: number) => {
    const v = clamp(Math.round(val), 0, 255)
    const next = { ...rgbInput, [key]: v }
    setRgbInput(next)
    const hex = rgbToHex(next.r, next.g, next.b)
    syncFromHex(hex)
  }

  const handleHslChange = (key: 'h' | 's' | 'l', val: number) => {
    const v = key === 'h' ? clamp(Math.round(val), 0, 360) : clamp(Math.round(val), 0, 100)
    const next = { ...hslInput, [key]: v }
    setHslInput(next)
    const hex = hslToHex(next.h, next.s, next.l)
    syncFromHex(hex)
  }

  const presetColors = [
    '#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5',
    '#89dceb', '#74c7ec', '#89b4fa', '#b4befe', '#cba6f7', '#f5c2e7',
    '#1e1e2e', '#313244', '#45475a', '#6c7086', '#89dceb', '#74c7ec',
  ]

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  }
  const labelStyle: React.CSSProperties = {
    width: 50, fontSize: 12, fontWeight: 700, color: dark ? '#a6adc8' : '#555',
  }
  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 10px', fontSize: 13, borderRadius: 8,
    border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
    background: dark ? '#313244' : '#f8f8f8',
    color: dark ? '#cdd6f4' : '#333', fontFamily: 'monospace',
  }

  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 280px', minWidth: 280 }}>
        <Panel dark={dark} title="颜色预览">
          <div style={{
            height: 140, borderRadius: 10, background: color,
            border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
            boxShadow: `0 8px 32px ${color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              fontFamily: 'monospace',
            }}>{color.toUpperCase()}</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={color} onChange={(e) => syncFromHex(e.target.value)} style={{
              width: 48, height: 48, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={hexInput.startsWith('#') ? hexInput : `#${hexInput}`}
                  onChange={(e) => handleHexChange(e.target.value)} style={inputStyle} />
                <CopyButton text={color} dark={dark} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555', marginBottom: 8 }}>预设颜色</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {presetColors.map((c) => (
                <div key={c} onClick={() => syncFromHex(c)} style={{
                  width: 28, height: 28, borderRadius: 6, background: c, cursor: 'pointer',
                  border: color.toLowerCase() === c.toLowerCase() ? '2px solid #fff' : `1px solid ${dark ? '#45475a' : '#ddd'}`,
                  transition: 'transform 0.15s',
                  transform: color.toLowerCase() === c.toLowerCase() ? 'scale(1.15)' : 'scale(1)',
                }} />
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ flex: '1 1 280px', minWidth: 280 }}>
        <Panel dark={dark} title="格式转换">
          <div style={rowStyle}>
            <span style={labelStyle}>HEX</span>
            <input type="text" value={hexInput.startsWith('#') ? hexInput.toUpperCase() : hexInput.toUpperCase()}
              onChange={(e) => handleHexChange(e.target.value)} style={inputStyle} />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>R</span>
            <input type="number" min={0} max={255} value={rgbInput.r}
              onChange={(e) => handleRgbChange('r', Number(e.target.value))} style={{ ...inputStyle, color: '#f38ba8' }} />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>G</span>
            <input type="number" min={0} max={255} value={rgbInput.g}
              onChange={(e) => handleRgbChange('g', Number(e.target.value))} style={{ ...inputStyle, color: '#a6e3a1' }} />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>B</span>
            <input type="number" min={0} max={255} value={rgbInput.b}
              onChange={(e) => handleRgbChange('b', Number(e.target.value))} style={{ ...inputStyle, color: '#89b4fa' }} />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>H</span>
            <input type="number" min={0} max={360} value={hslInput.h}
              onChange={(e) => handleHslChange('h', Number(e.target.value))} style={{ ...inputStyle, color: '#f9e2af' }} />
            <span style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555' }}>°</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>S</span>
            <input type="number" min={0} max={100} value={hslInput.s}
              onChange={(e) => handleHslChange('s', Number(e.target.value))} style={{ ...inputStyle, color: '#fab387' }} />
            <span style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555' }}>%</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>L</span>
            <input type="number" min={0} max={100} value={hslInput.l}
              onChange={(e) => handleHslChange('l', Number(e.target.value))} style={{ ...inputStyle, color: '#cba6f7' }} />
            <span style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555' }}>%</span>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ========== 2. 调色板面板 ========== */

const PalettePanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [baseColor, setBaseColor] = useState('#89b4fa')
  const [paletteType, setPaletteType] = useState<'complementary' | 'triadic' | 'analogous' | 'split-complementary'>('complementary')
  const [favorites, setFavorites] = useState<string[][]>(() => {
    try {
      const saved = localStorage.getItem('colorlab_favorites')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem('colorlab_favorites', JSON.stringify(favorites)) } catch {}
  }, [favorites])

  const [h, s, l] = useMemo(() => hexToHsl(baseColor), [baseColor])

  const palette = useMemo(() => {
    switch (paletteType) {
      case 'complementary':
        return [baseColor, hslToHex((h + 180) % 360, s, l)]
      case 'triadic':
        return [baseColor, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)]
      case 'analogous':
        return [
          hslToHex((h - 30 + 360) % 360, s, l),
          hslToHex((h - 15 + 360) % 360, s, l),
          baseColor,
          hslToHex((h + 15) % 360, s, l),
          hslToHex((h + 30) % 360, s, l),
        ]
      case 'split-complementary':
        return [baseColor, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)]
      default:
        return [baseColor]
    }
  }, [baseColor, paletteType, h, s, l])

  const saveFavorite = () => {
    setFavorites((prev) => [palette, ...prev].slice(0, 20))
  }
  const removeFavorite = (idx: number) => {
    setFavorites((prev) => prev.filter((_, i) => i !== idx))
  }

  const typeLabels: Record<string, string> = {
    'complementary': '互补色',
    'triadic': '三角色',
    'analogous': '类似色',
    'split-complementary': '分裂互补',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel dark={dark} title="调色板生成">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555', fontWeight: 600 }}>主色:</span>
            <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} style={{
              width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent',
            }} />
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: dark ? '#cdd6f4' : '#333' }}>{baseColor.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button key={key} onClick={() => setPaletteType(key as any)} style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                border: `1px solid ${paletteType === key ? '#89b4fa' : dark ? '#45475a' : '#ddd'}`,
                background: paletteType === key ? '#89b4fa' : dark ? '#313244' : '#f5f5f5',
                color: paletteType === key ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
          <button onClick={saveFavorite} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
            border: 'none', cursor: 'pointer', background: '#a6e3a1', color: '#1e1e2e',
          }}>⭐ 收藏调色板</button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {palette.map((c, i) => (
            <div key={i} onClick={() => setBaseColor(c)} style={{
              flex: '1 1 100px', minHeight: 90, borderRadius: 10, background: c, cursor: 'pointer',
              border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
              display: 'flex', alignItems: 'flex-end', padding: 10, transition: 'transform 0.2s',
              boxShadow: `0 4px 16px ${c}44`,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'monospace',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}>{c.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </Panel>

      {favorites.length > 0 && (
        <Panel dark={dark} title={`收藏的调色板 (${favorites.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favorites.map((pal, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 10,
                background: dark ? '#313244' : '#f5f5f5', borderRadius: 8,
              }}>
                <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                  {pal.map((c, i) => (
                    <div key={i} style={{
                      flex: 1, height: 36, borderRadius: 4, background: c,
                      border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
                    }} onClick={() => setBaseColor(c)} />
                  ))}
                </div>
                <button onClick={() => removeFavorite(idx)} style={{
                  padding: '4px 8px', fontSize: 11, borderRadius: 6, border: 'none',
                  background: '#f38ba8', color: '#1e1e2e', cursor: 'pointer', fontWeight: 700,
                }}>删除</button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

/* ========== 3. 渐变编辑器 ========== */

interface GradStop { id: string; color: string; pos: number }

const GradientPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [gradType, setGradType] = useState<'linear' | 'radial'>('linear')
  const [angle, setAngle] = useState(135)
  const [radialShape, setRadialShape] = useState<'circle' | 'ellipse'>('circle')
  const [stops, setStops] = useState<GradStop[]>([
    { id: 's1', color: '#667eea', pos: 0 },
    { id: 's2', color: '#764ba2', pos: 100 },
  ])
  const [copiedCss, setCopiedCss] = useState(false)

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.pos - b.pos), [stops])

  const gradientCss = useMemo(() => {
    const stopStr = sortedStops.map((s) => `${s.color} ${s.pos}%`).join(', ')
    return gradType === 'linear'
      ? `linear-gradient(${angle}deg, ${stopStr})`
      : `radial-gradient(${radialShape}, ${stopStr})`
  }, [gradType, angle, radialShape, sortedStops])

  const cssCode = `.my-element {\n  background: ${gradientCss};\n}`

  const addStop = () => {
    const newPos = stops.length > 0 ? 50 : 50
    setStops([...stops, { id: `s${Date.now()}`, color: '#ffffff', pos: newPos }])
  }
  const removeStop = (id: string) => {
    if (stops.length <= 2) return
    setStops(stops.filter((s) => s.id !== id))
  }
  const updateStop = (id: string, patch: Partial<GradStop>) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const copyCss = () => {
    navigator.clipboard.writeText(cssCode).then(() => {
      setCopiedCss(true)
      setTimeout(() => setCopiedCss(false), 1200)
    }).catch(() => {})
  }

  const presets = [
    { name: '现代', stops: [{ color: '#667eea', pos: 0 }, { color: '#764ba2', pos: 100 }] },
    { name: '日落', stops: [{ color: '#ff9a9e', pos: 0 }, { color: '#fad0c4', pos: 100 }] },
    { name: '海洋', stops: [{ color: '#2193b0', pos: 0 }, { color: '#6dd5ed', pos: 100 }] },
    { name: '霓虹', stops: [{ color: '#ff0080', pos: 0 }, { color: '#ff8c00', pos: 50 }, { color: '#40e0d0', pos: 100 }] },
    { name: '深空', stops: [{ color: '#0f2027', pos: 0 }, { color: '#203a43', pos: 50 }, { color: '#2c5364', pos: 100 }] },
    { name: '极光', stops: [{ color: '#00c6ff', pos: 0 }, { color: '#0072ff', pos: 100 }] },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
      <Panel dark={dark} title="实时预览">
        <div style={{
          height: 200, borderRadius: 12, background: gradientCss,
          border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}>
          <span style={{
            fontSize: 18, fontWeight: 700, color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>预览效果</span>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <button key={p.name} onClick={() => setStops(p.stops.map((s, i) => ({ id: `p${i}`, color: s.color, pos: s.pos })))} style={{
              padding: '6px 12px', fontSize: 12, borderRadius: 8, border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
              background: dark ? '#313244' : '#f5f5f5', color: dark ? '#cdd6f4' : '#333', cursor: 'pointer',
            }}>{p.name}</button>
          ))}
        </div>
      </Panel>

      <Panel dark={dark} title="渐变设置">
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setGradType('linear')} style={{
            flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            border: `1px solid ${gradType === 'linear' ? '#89b4fa' : dark ? '#45475a' : '#ddd'}`,
            background: gradType === 'linear' ? '#89b4fa' : dark ? '#313244' : '#f5f5f5',
            color: gradType === 'linear' ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
            cursor: 'pointer',
          }}>线性渐变</button>
          <button onClick={() => setGradType('radial')} style={{
            flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            border: `1px solid ${gradType === 'radial' ? '#89b4fa' : dark ? '#45475a' : '#ddd'}`,
            background: gradType === 'radial' ? '#89b4fa' : dark ? '#313244' : '#f5f5f5',
            color: gradType === 'radial' ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
            cursor: 'pointer',
          }}>径向渐变</button>
        </div>

        {gradType === 'linear' ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555' }}>角度: {angle}°</span>
            </div>
            <input type="range" min={0} max={360} value={angle}
              onChange={(e) => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: '#89b4fa' }} />
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setRadialShape('circle')} style={{
                flex: 1, padding: '6px', fontSize: 12, borderRadius: 6,
                border: `1px solid ${radialShape === 'circle' ? '#89b4fa' : dark ? '#45475a' : '#ddd'}`,
                background: radialShape === 'circle' ? '#89b4fa' : dark ? '#313244' : '#f5f5f5',
                color: radialShape === 'circle' ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
                cursor: 'pointer',
              }}>圆形</button>
              <button onClick={() => setRadialShape('ellipse')} style={{
                flex: 1, padding: '6px', fontSize: 12, borderRadius: 6,
                border: `1px solid ${radialShape === 'ellipse' ? '#89b4fa' : dark ? '#45475a' : '#ddd'}`,
                background: radialShape === 'ellipse' ? '#89b4fa' : dark ? '#313244' : '#f5f5f5',
                color: radialShape === 'ellipse' ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
                cursor: 'pointer',
              }}>椭圆</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: dark ? '#cdd6f4' : '#333' }}>颜色节点</span>
          <button onClick={addStop} style={{
            padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
            border: 'none', background: '#a6e3a1', color: '#1e1e2e', cursor: 'pointer',
          }}>+ 添加</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
          {sortedStops.map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 8,
              background: dark ? '#313244' : '#f5f5f5', borderRadius: 8,
            }}>
              <input type="color" value={s.color} onChange={(e) => updateStop(s.id, { color: e.target.value })} style={{
                width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent',
              }} />
              <input type="range" min={0} max={100} value={s.pos}
                onChange={(e) => updateStop(s.id, { pos: Number(e.target.value) })} style={{ flex: 1, accentColor: '#89b4fa' }} />
              <span style={{ fontSize: 11, color: dark ? '#a6adc8' : '#555', width: 30, textAlign: 'right' }}>{s.pos}%</span>
              <button onClick={() => removeStop(s.id)} disabled={stops.length <= 2} style={{
                padding: '2px 8px', fontSize: 14, borderRadius: 4, border: 'none',
                background: stops.length <= 2 ? (dark ? '#45475a' : '#ddd') : '#f38ba8',
                color: stops.length <= 2 ? (dark ? '#6c7086' : '#999') : '#1e1e2e',
                cursor: stops.length <= 2 ? 'not-allowed' : 'pointer', fontWeight: 700,
              }}>×</button>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ gridColumn: '1 / -1' }}>
        <Panel dark={dark} title="CSS 代码">
          <div style={{ position: 'relative' }}>
            <button onClick={copyCss} style={{
              position: 'absolute', top: 10, right: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 6, border: 'none', cursor: 'pointer',
              background: copiedCss ? '#a6e3a1' : '#89b4fa', color: '#1e1e2e',
            }}>{copiedCss ? '✓ 已复制' : '一键复制'}</button>
            <pre style={{
              background: dark ? '#181825' : '#f8f8f8', padding: 16, borderRadius: 8,
              fontSize: 13, fontFamily: 'monospace', color: dark ? '#cdd6f4' : '#333',
              overflowX: 'auto', border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
              margin: 0,
            }}><code>{cssCode}</code></pre>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ========== 4. 对比度检查面板 ========== */

const ContrastPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [fgColor, setFgColor] = useState('#cdd6f4')
  const [bgColor, setBgColor] = useState('#1e1e2e')

  const ratio = useMemo(() => contrastRatio(fgColor, bgColor), [fgColor, bgColor])
  const levels = useMemo(() => getWcagLevel(ratio), [ratio])

  const testText = '示例文字 Abc 123'

  const boxStyle = (color: string, isBg: boolean): React.CSSProperties => ({
    padding: 20, borderRadius: 10,
    background: isBg ? color : bgColor,
    color: isBg ? fgColor : color,
    border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
    transition: 'all 0.15s',
  })

  const badge = (pass: boolean, _label: string) => ({
    display: 'inline-block', padding: '4px 10px', fontSize: 11, fontWeight: 700,
    borderRadius: 6, marginRight: 6, marginBottom: 6,
    background: pass ? '#a6e3a1' : '#f38ba8',
    color: pass ? '#1e1e2e' : '#1e1e2e',
  })

  const inputStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      <Panel dark={dark} title="颜色设置">
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={inputStyle}>
            <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#a6adc8' : '#555', width: 60 }}>前景色</span>
            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{
              width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent',
            }} />
            <input type="text" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{
              flex: 1, padding: '8px 10px', fontSize: 13, borderRadius: 8,
              border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
              background: dark ? '#313244' : '#f8f8f8',
              color: dark ? '#cdd6f4' : '#333', fontFamily: 'monospace',
            }} />
          </div>
          <div style={inputStyle}>
            <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#a6adc8' : '#555', width: 60 }}>背景色</span>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{
              width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent',
            }} />
            <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{
              flex: 1, padding: '8px 10px', fontSize: 13, borderRadius: 8,
              border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
              background: dark ? '#313244' : '#f8f8f8',
              color: dark ? '#cdd6f4' : '#333', fontFamily: 'monospace',
            }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: 20, borderRadius: 10, background: bgColor, color: fgColor, border: `1px solid ${dark ? '#45475a' : '#ddd'}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{testText}</div>
          <div style={{ fontSize: 12 }}>{testText}</div>
        </div>
      </Panel>

      <Panel dark={dark} title="WCAG 2.1 合规检查">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 48, fontWeight: 800, fontFamily: 'monospace',
            color: ratio >= 4.5 ? '#a6e3a1' : '#f38ba8',
            textShadow: `0 0 20px ${ratio >= 4.5 ? '#a6e3a144' : '#f38ba844'}`,
          }}>{ratio.toFixed(2)}:1</div>
          <div style={{ fontSize: 12, color: dark ? '#a6adc8' : '#555' }}>对比度比率</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#cdd6f4' : '#333', marginBottom: 8 }}>小文本</div>
          <span style={badge(levels.aaa, 'AAA ✓')}>{levels.aaa ? '通过' : '未通过'}</span>
          <span style={badge(levels.aa, 'AA ✓')}>{levels.aa ? '通过' : '未通过'}</span>
          <div style={{ fontSize: 11, color: dark ? '#a6adc8' : '#555', marginTop: 4 }}>
            AAA ≥ 7:1 · AA ≥ 4.5:1
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#cdd6f4' : '#333', marginBottom: 8 }}>大文本</div>
          <span style={badge(levels.aaaLarge, 'AAA ✓')}>{levels.aaaLarge ? '通过' : '未通过'}</span>
          <span style={badge(levels.aaLarge, 'AA ✓')}>{levels.aaLarge ? '通过' : '未通过'}</span>
          <div style={{ fontSize: 11, color: dark ? '#a6adc8' : '#555', marginTop: 4 }}>
            AAA ≥ 4.5:1 · AA ≥ 3:1
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={boxStyle('', false)}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>大号文字预览</span>
          </div>
          <div style={boxStyle('', false)}>
            <span style={{ fontSize: 14 }}>小号文字预览 - The quick brown fox jumps over the lazy dog</span>
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* ========== 5. 色盲模拟面板 ========== */

const ColorBlindPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [color, setColor] = useState('#89b4fa')
  const [selectedBlind, setSelectedBlind] = useState('protanopia')

  const types = [
    { key: 'protanopia', label: '红色盲' },
    { key: 'deuteranopia', label: '绿色盲' },
    { key: 'tritanopia', label: '蓝色盲' },
    { key: 'achromatopsia', label: '全色盲' },
  ]

  const [r, g, b] = useMemo(() => hexToRgb(color), [color])

  const normal = color
  const simulated = useMemo(() => {
    const [nr, ng, nb] = simulateColorBlindness(r, g, b, selectedBlind)
    return rgbToHex(nr, ng, nb)
  }, [r, g, b, selectedBlind])

  const paletteColors = useMemo(() => {
    const [h, s, l] = rgbToHsl(r, g, b)
    return [
      hslToHex(h, s, l),
      hslToHex((h + 30) % 360, s, l),
      hslToHex((h + 60) % 360, s, l),
      hslToHex((h + 90) % 360, s, l),
      hslToHex((h + 120) % 360, s, l),
      hslToHex((h + 150) % 360, s, l),
      hslToHex((h + 180) % 360, s, l),
      hslToHex((h + 210) % 360, s, l),
      hslToHex((h + 240) % 360, s, l),
      hslToHex((h + 270) % 360, s, l),
      hslToHex((h + 300) % 360, s, l),
      hslToHex((h + 330) % 360, s, l),
    ]
  }, [r, g, b])

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  }
  const labelStyle: React.CSSProperties = {
    width: 60, fontSize: 12, fontWeight: 700, color: dark ? '#a6adc8' : '#555',
  }
  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 10px', fontSize: 13, borderRadius: 8,
    border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
    background: dark ? '#313244' : '#f8f8f8',
    color: dark ? '#cdd6f4' : '#333', fontFamily: 'monospace',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      <Panel dark={dark} title="颜色选择">
        <div style={{
          height: 120, borderRadius: 10, background: color, marginBottom: 14,
          border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 24px ${color}55`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            {color.toUpperCase()}
          </span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>HEX</span>
          <input type="text" value={color} onChange={(e) => { if (isValidHex(e.target.value)) setColor(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`) }} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{
            width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent',
          }} />
          <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#89dceb', '#89b4fa', '#cba6f7'].map((c) => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: 32, height: 32, borderRadius: 6, background: c, cursor: 'pointer',
                border: color.toLowerCase() === c.toLowerCase() ? '2px solid #fff' : `1px solid ${dark ? '#45475a' : '#ddd'}`,
              }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#cdd6f4' : '#333', marginBottom: 8 }}>色盲类型</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {types.map((t) => (
              <button key={t.key} onClick={() => setSelectedBlind(t.key)} style={{
                padding: '10px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                border: `1px solid ${selectedBlind === t.key ? '#89b4fa' : dark ? '#45475a' : '#ddd'}`,
                background: selectedBlind === t.key ? '#89b4fa' : dark ? '#313244' : '#f5f5f5',
                color: selectedBlind === t.key ? '#1e1e2e' : dark ? '#cdd6f4' : '#333',
                cursor: 'pointer', textAlign: 'left',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel dark={dark} title="单色模拟对比">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{
              height: 100, borderRadius: 10, background: normal,
              display: 'flex', alignItems: 'flex-end', padding: 8,
              border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>正常 {normal.toUpperCase()}</span>
            </div>
            <div style={{
              height: 100, borderRadius: 10, background: simulated,
              display: 'flex', alignItems: 'flex-end', padding: 8,
              border: `1px solid ${dark ? '#45475a' : '#ddd'}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {types.find((t) => t.key === selectedBlind)?.label} {simulated.toUpperCase()}
              </span>
            </div>
          </div>
        </Panel>

        <Panel dark={dark} title="色彩范围模拟">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: dark ? '#a6adc8' : '#555', marginBottom: 6 }}>正常视觉</div>
              <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', border: `1px solid ${dark ? '#45475a' : '#ddd'}` }}>
                {paletteColors.map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c }} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: dark ? '#a6adc8' : '#555', marginBottom: 6 }}>
                {types.find((t) => t.key === selectedBlind)?.label}
              </div>
              <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', border: `1px solid ${dark ? '#45475a' : '#ddd'}` }}>
                {paletteColors.map((c, i) => {
                  const [cr, cg, cb] = hexToRgb(c)
                  const [sr, sg, sb] = simulateColorBlindness(cr, cg, cb, selectedBlind)
                  return <div key={i} style={{ flex: 1, background: rgbToHex(sr, sg, sb) }} />
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel dark={dark} title="模拟色块">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {paletteColors.slice(0, 8).map((c, i) => {
              const [cr, cg, cb] = hexToRgb(c)
              const [sr, sg, sb] = simulateColorBlindness(cr, cg, cb, selectedBlind)
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ height: 40, borderRadius: 6, background: c, border: `1px solid ${dark ? '#45475a' : '#ddd'}` }} />
                  <div style={{ height: 40, borderRadius: 6, background: rgbToHex(sr, sg, sb), border: `1px solid ${dark ? '#45475a' : '#ddd'}` }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: dark ? '#a6adc8' : '#555' }}>
            <span>原始色</span>
            <span>模拟色</span>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ========== 主组件 ========== */

const TABS = [
  { key: 'converter', label: '转换', icon: '🔄' },
  { key: 'palette', label: '调色板', icon: '🎨' },
  { key: 'gradient', label: '渐变', icon: '🌈' },
  { key: 'contrast', label: '对比度', icon: '⚖️' },
  { key: 'colorblind', label: '色盲模拟', icon: '👁️' },
]

const ColorLab: React.FC = () => {
  const theme = useStore((s) => s.theme)
  const dark = theme === 'dark'
  const [activeTab, setActiveTab] = useState('converter')

  const bgColor = dark ? '#11111b' : '#f5f5f5'
  const headerGradient = 'linear-gradient(135deg, #89b4fa 0%, #cba6f7 50%, #f38ba8 100%)'

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'converter': return <ConverterPanel dark={dark} />
      case 'palette': return <PalettePanel dark={dark} />
      case 'gradient': return <GradientPanel dark={dark} />
      case 'contrast': return <ContrastPanel dark={dark} />
      case 'colorblind': return <ColorBlindPanel dark={dark} />
      default: return null
    }
  }, [activeTab, dark])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: bgColor,
      backgroundImage: dark
        ? 'radial-gradient(ellipse at top left, rgba(137,180,250,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(243,139,168,0.06) 0%, transparent 50%)'
        : 'radial-gradient(ellipse at top left, rgba(137,180,250,0.1) 0%, transparent 50%)',
      color: dark ? '#cdd6f4' : '#333',
    }}>
      <div style={{
        padding: '14px 20px',
        background: dark ? 'rgba(30,30,46,0.7)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${dark ? '#313244' : '#e0e0e0'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: headerGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 16px rgba(137,180,250,0.3)',
          }}>🎨</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: 0.5 }}>色彩工具箱</h1>
            <p style={{ margin: 0, fontSize: 12, color: dark ? '#a6adc8' : '#666' }}>Color Lab · 专业的色彩设计工具</p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px',
        background: dark ? 'rgba(30,30,46,0.5)' : 'rgba(255,255,255,0.5)',
        borderBottom: `1px solid ${dark ? '#313244' : '#e0e0e0'}`,
        overflowX: 'auto',
      }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
            border: `1px solid ${activeTab === t.key ? '#89b4fa' : 'transparent'}`,
            background: activeTab === t.key
              ? (dark ? 'linear-gradient(135deg, #89b4fa, #74c7ec)' : 'linear-gradient(135deg, #89b4fa, #74c7ec)')
              : (dark ? '#313244' : '#f0f0f0'),
            color: activeTab === t.key ? '#1e1e2e' : (dark ? '#a6adc8' : '#555'),
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
            boxShadow: activeTab === t.key ? '0 4px 12px rgba(137,180,250,0.4)' : 'none',
          }}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default memo(ColorLab)