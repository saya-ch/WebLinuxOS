import { useState, useEffect, useCallback, useMemo } from 'react'
import { Copy, Check, Palette, RotateCcw, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'color-converter-history'
const MAX_HISTORY = 12

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function rgbToCmyk(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - rn - k) / (1 - k)
  const m = (1 - gn - k) / (1 - k)
  const y = (1 - bn - k) / (1 - k)
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function getContrastRatio(hex1: string, hex2: string) {
  const luminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    const [rs, gs, bs] = [r, g, b].map(c => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  const l1 = luminance(hex1), l2 = luminance(hex2)
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function generateHarmonies(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)

  const complementaryHue = (h + 180) % 360
  const complementary = hslToRgb(complementaryHue, s, l)

  const analog1 = hslToRgb((h + 30) % 360, s, l)
  const analog2 = hslToRgb((h - 30 + 360) % 360, s, l)

  const triad1 = hslToRgb((h + 120) % 360, s, l)
  const triad2 = hslToRgb((h + 240) % 360, s, l)

  return {
    complementary: rgbToHex(complementary.r, complementary.g, complementary.b),
    analogous: [
      rgbToHex(analog1.r, analog1.g, analog1.b),
      rgbToHex(analog2.r, analog2.g, analog2.b),
    ],
    triadic: [
      rgbToHex(triad1.r, triad1.g, triad2.b),
      rgbToHex(triad2.r, triad2.g, triad2.b),
    ],
  }
}

function generateShades(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s } = rgbToHsl(r, g, b)
  const result: { hex: string; level: number; lightness: number }[] = []
  for (let i = 0; i < 11; i++) {
    const newL = Math.round(10 + i * 8)
    const rgb = hslToRgb(h, s, newL)
    result.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      level: i,
      lightness: newL,
    })
  }
  return result
}

interface HistoryItem {
  hex: string
  timestamp: number
}

export default function ColorConverter() {
  const [color, setColor] = useState('#7C6CF0')
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveHistory = useCallback((hex: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.hex.toLowerCase() !== hex.toLowerCase())
      const next = [{ hex, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const current = useMemo(() => {
    const { r, g, b } = hexToRgb(color)
    const hsl = rgbToHsl(r, g, b)
    const hsv = rgbToHsv(r, g, b)
    const cmyk = rgbToCmyk(r, g, b)
    return {
      hex: color.toUpperCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgbValues: { r, g, b },
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hslValues: hsl,
      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      hsvValues: hsv,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      cmykValues: cmyk,
    }
  }, [color])

  const harmonies = useMemo(() => generateHarmonies(color), [color])
  const shades = useMemo(() => generateShades(color), [color])

  const bgContrast = getContrastRatio(color, '#000000')
  const fgColor = bgContrast > 3 ? '#000000' : '#ffffff'

  const cssVar = useMemo(() => {
    const safeHex = color.replace('#', '').toUpperCase()
    const { r, g, b } = current.rgbValues
    return `--color-primary: #${safeHex};\n--color-primary-rgb: ${r}, ${g}, ${b};\n--color-light: hsl(${current.hslValues.h}, ${current.hslValues.s}%, ${Math.min(95, current.hslValues.l + 15)}%);\n--color-dark: hsl(${current.hslValues.h}, ${current.hslValues.s}%, ${Math.max(5, current.hslValues.l - 15)}%);`
  }, [color, current])

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1200)
    } catch {}
  }

  const handleColorChange = (hex: string) => {
    setColor(hex)
    saveHistory(hex)
  }

  const handleRandom = () => {
    const random = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()
    handleColorChange(random)
  }

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  const textColorForBg = (hex: string) => {
    const ratio = getContrastRatio(hex, '#ffffff')
    return ratio > 3 ? '#ffffff' : '#1a1a2e'
  }

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--window-bg, #0e0e18)',
        color: 'var(--text-primary, #f0f0ff)',
        overflow: 'auto',
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
      }}
    >
      <style>{`
        .cc-card {
          background: var(--glass-bg, rgba(255,255,255,0.04));
          border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
          border-radius: var(--radius-md, 12px);
          padding: 14px;
        }
        .cc-row { display: flex; align-items: center; gap: 8px; }
        .cc-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: var(--radius-sm, 8px);
          background: var(--accent-bg, rgba(155,138,240,0.2));
          border: 1px solid transparent; color: var(--text-primary);
          cursor: pointer; font-size: 12px; font-family: inherit;
          transition: all 0.2s ease;
        }
        .cc-btn:hover { background: var(--accent, #9b8af0); color: #fff; }
        .cc-btn-sm { padding: 3px 7px; font-size: 11px; }
        .cc-input {
          background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
          border-radius: var(--radius-sm, 8px); color: var(--text-primary);
          padding: 6px 10px; font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace;
          outline: none; transition: border-color 0.2s;
        }
        .cc-input:focus { border-color: var(--accent, #9b8af0); }
        .cc-label {
          font-size: 11px; color: var(--text-secondary, #9090c0);
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }
        .cc-section-title {
          font-size: 12px; font-weight: 600; color: var(--accent, #9b8af0);
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }
        .cc-shade {
          display: flex; align-items: flex-end; justify-content: center;
          border-radius: 6px; font-size: 9px; cursor: pointer;
          transition: transform 0.15s; padding: 4px 2px;
          min-height: 36px; font-family: 'SF Mono', monospace;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .cc-shade:hover { transform: scaleY(1.15); }
        .cc-swatch {
          width: 24px; height: 24px; border-radius: 6px; cursor: pointer;
          border: 2px solid rgba(255,255,255,0.2);
          transition: transform 0.15s, border-color 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .cc-swatch:hover { transform: scale(1.15); border-color: var(--accent); }
        .cc-harmony-swatch {
          flex: 1; min-height: 48px; border-radius: var(--radius-sm, 8px);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-family: 'SF Mono', monospace; cursor: pointer;
          transition: transform 0.15s; border: 2px solid transparent;
        }
        .cc-harmony-swatch:hover { transform: scaleY(1.1); border-color: var(--accent); }
        .cc-check-icon { color: var(--success, #00e896); }
        .cc-grid { display: grid; gap: 12px; }
        .cc-copy-btn {
          background: transparent; border: none; cursor: pointer;
          padding: 4px; border-radius: 6px; color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .cc-copy-btn:hover { background: var(--accent-bg); color: var(--accent); }
      `}</style>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Header */}
        <div className="cc-row" style={{ marginBottom: 14, gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'var(--accent-gradient, linear-gradient(135deg, #7c6cf0, #9b8af0))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow, 0 0 25px rgba(155,138,240,0.45))',
          }}>
            <Palette size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>色彩转换</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary, #9090c0)' }}>
              颜色格式转换 · 调色板 · CSS变量
            </div>
          </div>
          <button onClick={handleRandom} className="cc-btn cc-btn-sm" title="随机颜色">
            <Sparkles size={12} /> 随机
          </button>
        </div>

        {/* Main Picker */}
        <div className="cc-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{
                  position: 'absolute', inset: -6, width: 84, height: 84,
                  border: 'none', cursor: 'pointer', background: 'transparent',
                }}
              />
            </div>
            <div style={{
              flex: 1, height: 72, borderRadius: 14, background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-soft, 0 6px 24px rgba(0,0,0,0.3))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
            }}>
              <span style={{
                fontFamily: 'SF Mono, monospace', fontSize: 18, fontWeight: 700,
                color: fgColor, letterSpacing: 1,
              }}>
                {current.hex}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={color}
              onChange={(e) => {
                let val = e.target.value
                if (!val.startsWith('#')) val = '#' + val
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setColor(val.length > 7 ? val.slice(0, 7) : val)
              }}
              onBlur={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  saveHistory(e.target.value)
                }
              }}
              className="cc-input"
              style={{ flex: 1, textTransform: 'uppercase' }}
              placeholder="#7C6CF0"
              maxLength={7}
            />
            <button
              onClick={() => copyValue(current.hex)}
              className="cc-btn cc-btn-sm"
            >
              {copied === current.hex ? <Check size={12} className="cc-check-icon" /> : <Copy size={12} />}
              {copied === current.hex ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* Color Values */}
        <div className="cc-card" style={{ marginBottom: 12 }}>
          <div className="cc-section-title">
            <Palette size={13} /> 色彩值
          </div>
          <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'HEX', value: current.hex },
              { label: 'RGB', value: current.rgb },
              { label: 'HSL', value: current.hsl },
              { label: 'HSV', value: current.hsv },
              { label: 'CMYK', value: current.cmyk },
              { label: '对比度(黑)', value: bgContrast.toFixed(2) + ':1' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm, 8px)',
                  padding: '8px 10px',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="cc-label">{label}</span>
                  <button
                    className="cc-copy-btn"
                    onClick={() => copyValue(value)}
                    title="复制"
                  >
                    {copied === value ? <Check size={11} className="cc-check-icon" /> : <Copy size={11} />}
                  </button>
                </div>
                <span style={{ fontFamily: 'SF Mono, monospace', fontSize: 12, wordBreak: 'break-all' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shade/Tint Generator */}
        <div className="cc-card" style={{ marginBottom: 12 }}>
          <div className="cc-section-title">
            <Sparkles size={13} /> 色阶 / 明度渐变
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 3 }}>
            {shades.map((s) => (
              <div
                key={s.level}
                className="cc-shade"
                style={{
                  background: s.hex,
                  color: textColorForBg(s.hex),
                }}
                onClick={() => handleColorChange(s.hex)}
                title={`${s.hex} · L:${s.lightness}%`}
              >
                {s.hex.slice(1)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--text-secondary)' }}>
            <span>明度 10%</span>
            <span>→</span>
            <span>明度 90%</span>
          </div>
        </div>

        {/* Color Harmonies */}
        <div className="cc-card" style={{ marginBottom: 12 }}>
          <div className="cc-section-title">
            <Palette size={13} /> 色彩和谐
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div className="cc-label" style={{ marginBottom: 4 }}>互补色 (Complementary)</div>
              <div
                className="cc-harmony-swatch"
                style={{ background: harmonies.complementary, color: textColorForBg(harmonies.complementary) }}
                onClick={() => handleColorChange(harmonies.complementary)}
                title={harmonies.complementary}
              >
                {harmonies.complementary}
              </div>
            </div>
            <div>
              <div className="cc-label" style={{ marginBottom: 4 }}>类似色 (Analogous)</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {harmonies.analogous.map((hex) => (
                  <div
                    key={hex}
                    className="cc-harmony-swatch"
                    style={{ background: hex, color: textColorForBg(hex) }}
                    onClick={() => handleColorChange(hex)}
                    title={hex}
                  >
                    {hex}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="cc-label" style={{ marginBottom: 4 }}>三角色 (Triadic)</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {harmonies.triadic.map((hex) => (
                  <div
                    key={hex}
                    className="cc-harmony-swatch"
                    style={{ background: hex, color: textColorForBg(hex) }}
                    onClick={() => handleColorChange(hex)}
                    title={hex}
                  >
                    {hex}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CSS Variable Generator */}
        <div className="cc-card" style={{ marginBottom: 12 }}>
          <div className="cc-section-title" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code2Icon /> CSS 变量
            </span>
            <button
              onClick={() => copyValue(cssVar)}
              className="cc-btn cc-btn-sm"
            >
              {copied === cssVar ? <Check size={11} className="cc-check-icon" /> : <Copy size={11} />}
              {copied === cssVar ? '已复制' : '复制'}
            </button>
          </div>
          <pre
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '10px 12px',
              fontSize: 11,
              fontFamily: 'SF Mono, "Fira Code", monospace',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
{`:root {\n  ${cssVar}\n}`}
          </pre>
        </div>

        {/* Recent Colors */}
        <div className="cc-card">
          <div className="cc-section-title" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={13} /> 历史记录
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="cc-btn cc-btn-sm"
                style={{ padding: '2px 6px' }}
              >
                清空
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }}>
              暂无历史记录，选择的颜色将自动保存
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {history.map((item) => (
                <div
                  key={item.timestamp}
                  className="cc-swatch"
                  style={{ background: item.hex }}
                  onClick={() => handleColorChange(item.hex)}
                  title={item.hex}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Code2Icon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}