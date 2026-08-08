import { useState, useMemo, useCallback } from 'react'
import { Search, Copy, Check, Palette, Droplets, Lightbulb, Eye, EyeOff, Shuffle } from 'lucide-react'

const htmlColors: { name: string; hex: string }[] = [
  { name: 'AliceBlue', hex: '#F0F8FF' }, { name: 'AntiqueWhite', hex: '#FAEBD7' },
  { name: 'Aqua', hex: '#00FFFF' }, { name: 'Aquamarine', hex: '#7FFFD4' },
  { name: 'Azure', hex: '#F0FFFF' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Bisque', hex: '#FFE4C4' }, { name: 'Black', hex: '#000000' },
  { name: 'BlanchedAlmond', hex: '#FFEBCD' }, { name: 'Blue', hex: '#0000FF' },
  { name: 'BlueViolet', hex: '#8A2BE2' }, { name: 'Brown', hex: '#A52A2A' },
  { name: 'BurlyWood', hex: '#DEB887' }, { name: 'CadetBlue', hex: '#5F9EA0' },
  { name: 'Chartreuse', hex: '#7FFF00' }, { name: 'Chocolate', hex: '#D2691E' },
  { name: 'Coral', hex: '#FF7F50' }, { name: 'CornflowerBlue', hex: '#6495ED' },
  { name: 'Cornsilk', hex: '#FFF8DC' }, { name: 'Crimson', hex: '#DC143C' },
  { name: 'Cyan', hex: '#00FFFF' }, { name: 'DarkBlue', hex: '#00008B' },
  { name: 'DarkCyan', hex: '#008B8B' }, { name: 'DarkGoldenRod', hex: '#B8860B' },
  { name: 'DarkGray', hex: '#A9A9A9' }, { name: 'DarkGreen', hex: '#006400' },
  { name: 'DarkKhaki', hex: '#BDB76B' }, { name: 'DarkMagenta', hex: '#8B008B' },
  { name: 'DarkOliveGreen', hex: '#556B2F' }, { name: 'DarkOrange', hex: '#FF8C00' },
  { name: 'DarkOrchid', hex: '#9932CC' }, { name: 'DarkRed', hex: '#8B0000' },
  { name: 'DarkSalmon', hex: '#E9967A' }, { name: 'DarkSeaGreen', hex: '#8FBC8F' },
  { name: 'DarkSlateBlue', hex: '#483D8B' }, { name: 'DarkSlateGray', hex: '#2F4F4F' },
  { name: 'DarkTurquoise', hex: '#00CED1' }, { name: 'DarkViolet', hex: '#9400D3' },
  { name: 'DeepPink', hex: '#FF1493' }, { name: 'DeepSkyBlue', hex: '#00BFFF' },
  { name: 'DimGray', hex: '#696969' }, { name: 'DodgerBlue', hex: '#1E90FF' },
  { name: 'FireBrick', hex: '#B22222' }, { name: 'FloralWhite', hex: '#FFFAF0' },
  { name: 'ForestGreen', hex: '#228B22' }, { name: 'Fuchsia', hex: '#FF00FF' },
  { name: 'Gainsboro', hex: '#DCDCDC' }, { name: 'GhostWhite', hex: '#F8F8FF' },
  { name: 'Gold', hex: '#FFD700' }, { name: 'GoldenRod', hex: '#DAA520' },
  { name: 'Gray', hex: '#808080' }, { name: 'Green', hex: '#008000' },
  { name: 'GreenYellow', hex: '#ADFF2F' }, { name: 'HoneyDew', hex: '#F0FFF0' },
  { name: 'HotPink', hex: '#FF69B4' }, { name: 'IndianRed', hex: '#CD5C5C' },
  { name: 'Indigo', hex: '#4B0082' }, { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Khaki', hex: '#F0E68C' }, { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'LavenderBlush', hex: '#FFF0F5' }, { name: 'LawnGreen', hex: '#7CFC00' },
  { name: 'LemonChiffon', hex: '#FFFACD' }, { name: 'LightBlue', hex: '#ADD8E6' },
  { name: 'LightCoral', hex: '#F08080' }, { name: 'LightCyan', hex: '#E0FFFF' },
  { name: 'LightGoldenRodYellow', hex: '#FAFAD2' }, { name: 'LightGray', hex: '#D3D3D3' },
  { name: 'LightGreen', hex: '#90EE90' }, { name: 'LightPink', hex: '#FFB6C1' },
  { name: 'LightSalmon', hex: '#FFA07A' }, { name: 'LightSeaGreen', hex: '#20B2AA' },
  { name: 'LightSkyBlue', hex: '#87CEFA' }, { name: 'LightSlateGray', hex: '#778899' },
  { name: 'LightSteelBlue', hex: '#B0C4DE' }, { name: 'LightYellow', hex: '#FFFFE0' },
  { name: 'Lime', hex: '#00FF00' }, { name: 'LimeGreen', hex: '#32CD32' },
  { name: 'Linen', hex: '#FAF0E6' }, { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Maroon', hex: '#800000' }, { name: 'MediumAquaMarine', hex: '#66CDAA' },
  { name: 'MediumBlue', hex: '#0000CD' }, { name: 'MediumOrchid', hex: '#BA55D3' },
  { name: 'MediumPurple', hex: '#9370DB' }, { name: 'MediumSeaGreen', hex: '#3CB371' },
  { name: 'MediumSlateBlue', hex: '#7B68EE' }, { name: 'MediumSpringGreen', hex: '#00FA9A' },
  { name: 'MediumTurquoise', hex: '#48D1CC' }, { name: 'MediumVioletRed', hex: '#C71585' },
  { name: 'MidnightBlue', hex: '#191970' }, { name: 'MintCream', hex: '#F5FFFA' },
  { name: 'MistyRose', hex: '#FFE4E1' }, { name: 'Moccasin', hex: '#FFE4B5' },
  { name: 'NavajoWhite', hex: '#FFDEAD' }, { name: 'Navy', hex: '#000080' },
  { name: 'OldLace', hex: '#FDF5E6' }, { name: 'Olive', hex: '#808000' },
  { name: 'OliveDrab', hex: '#6B8E23' }, { name: 'Orange', hex: '#FFA500' },
  { name: 'OrangeRed', hex: '#FF4500' }, { name: 'Orchid', hex: '#DA70D6' },
  { name: 'PaleGoldenRod', hex: '#EEE8AA' }, { name: 'PaleGreen', hex: '#98FB98' },
  { name: 'PaleTurquoise', hex: '#AFEEEE' }, { name: 'PaleVioletRed', hex: '#DB7093' },
  { name: 'PapayaWhip', hex: '#FFEFD5' }, { name: 'PeachPuff', hex: '#FFDAB9' },
  { name: 'Peru', hex: '#CD853F' }, { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Plum', hex: '#DDA0DD' }, { name: 'PowderBlue', hex: '#B0E0E6' },
  { name: 'Purple', hex: '#800080' }, { name: 'RosyBrown', hex: '#BC8F8F' },
  { name: 'RoyalBlue', hex: '#4169E1' }, { name: 'SaddleBrown', hex: '#8B4513' },
  { name: 'Salmon', hex: '#FA8072' }, { name: 'SandyBrown', hex: '#F4A460' },
  { name: 'SeaGreen', hex: '#2E8B57' }, { name: 'SeaShell', hex: '#FFF5EE' },
  { name: 'Sienna', hex: '#A0522D' }, { name: 'Silver', hex: '#C0C0C0' },
  { name: 'SkyBlue', hex: '#87CEEB' }, { name: 'SlateBlue', hex: '#6A5ACD' },
  { name: 'SlateGray', hex: '#708090' }, { name: 'Snow', hex: '#FFFAFA' },
  { name: 'SpringGreen', hex: '#00FF7F' }, { name: 'SteelBlue', hex: '#4682B4' },
  { name: 'Tan', hex: '#D2B48C' }, { name: 'Teal', hex: '#008080' },
  { name: 'Thistle', hex: '#D8BFD8' }, { name: 'Tomato', hex: '#FF6347' },
  { name: 'Turquoise', hex: '#40E0D0' }, { name: 'Violet', hex: '#EE82EE' },
  { name: 'Wheat', hex: '#F5DEB3' }, { name: 'White', hex: '#FFFFFF' },
  { name: 'WhiteSmoke', hex: '#F5F5F5' }, { name: 'Yellow', hex: '#FFFF00' },
  { name: 'YellowGreen', hex: '#9ACD32' },
]

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
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

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export default function ColorName() {
  const [search, setSearch] = useState('')
  const [selectedColor, setSelectedColor] = useState('#667eea')
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const [showPalette, setShowPalette] = useState(false)
  const [paletteColors, setPaletteColors] = useState<string[]>([])

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return htmlColors
    return htmlColors.filter(c => c.name.toLowerCase().includes(s) || c.hex.toLowerCase().includes(s))
  }, [search])

  const currentColor = useMemo(() => {
    const rgb = hexToRgb(selectedColor)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    return {
      hex: selectedColor.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      r: rgb.r, g: rgb.g, b: rgb.b,
      h: hsl.h, s: hsl.s, l: hsl.l,
    }
  }, [selectedColor])

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => {})
    setCopiedValue(value)
    setTimeout(() => setCopiedValue(null), 1500)
  }

  const generatePalette = useCallback(() => {
    const { h, s, l } = currentColor
    const result: string[] = []
    const steps = [0, 15, 30, 45, 60, 75, 90]
    steps.forEach(step => {
      const newL = Math.min(95, Math.max(5, l + (step - 45) * 0.8))
      result.push(`hsl(${h}, ${s}%, ${newL}%)`)
    })
    setPaletteColors(result)
    setShowPalette(true)
  }, [currentColor])

  const randomColor = () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()
    setSelectedColor(randomHex)
  }

  const whiteRatio = getContrastRatio(selectedColor, '#FFFFFF')
  const blackRatio = getContrastRatio(selectedColor, '#000000')
  const bgForWhite = getRelativeLuminance(selectedColor) > 0.5 ? '#000' : '#fff'

  const wcagLevel = (ratio: number) => {
    if (ratio >= 7) return { text: 'AAA', color: '#4ade80' }
    if (ratio >= 4.5) return { text: 'AA', color: '#22c55e' }
    if (ratio >= 3) return { text: 'AA 大字体', color: '#eab308' }
    return { text: '不达标', color: '#ef4444' }
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#e0e0f0',
      overflow: 'auto',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .cn-card { transition: all 0.3s ease; }
        .cn-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .cn-fade-in { animation: cnFadeIn 0.4s ease-out; }
        @keyframes cnFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .cn-btn { transition: all 0.25s ease; }
        .cn-btn:hover { transform: translateY(-1px); }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* 顶部栏 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
          }}>
            <Palette size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>颜色命名工具</div>
            <div style={{ fontSize: 12, color: '#8888aa' }}>HTML 颜色大全 · 格式转换 · 调色板 · 对比度</div>
          </div>
          <button onClick={randomColor} className="cn-btn" style={{
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#aaaacc',
            cursor: 'pointer', fontSize: 13, display: 'flex',
            alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}>
            <Shuffle size={14} /> 随机颜色
          </button>
        </div>

        {/* 主颜色预览 */}
        <div className="cn-fade-in" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: 24, marginBottom: 20,
          display: 'flex', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              width: 160, height: 160, borderRadius: 16,
              background: selectedColor,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  opacity: 0, cursor: 'pointer', border: 'none', background: 'none',
                }}
              />
              <span style={{ color: bgForWhite === '#fff' ? '#fff' : '#000', fontWeight: 700, fontSize: 14, pointerEvents: 'none' }}>
                {selectedColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e0e0f0' }}>颜色值</h3>
            {[
              { label: 'HEX', value: currentColor.hex },
              { label: 'RGB', value: currentColor.rgb },
              { label: 'HSL', value: currentColor.hsl },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#8888aa', width: 42 }}>{label}</span>
                <code style={{ flex: 1, fontSize: 13, color: '#e0e0f0', fontFamily: 'monospace' }}>{value}</code>
                <button onClick={() => copyValue(value)} className="cn-btn" style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: copiedValue === value ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)',
                  color: copiedValue === value ? '#4ade80' : '#aaaacc',
                  cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'inherit',
                }}>
                  {copiedValue === value ? <Check size={12} /> : <Copy size={12} />}
                  {copiedValue === value ? '已复制' : '复制'}
                </button>
              </div>
            ))}

            {/* 对比度检查 */}
            <div style={{ marginTop: 4 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#e0e0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={16} /> 对比度检查
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { bg: '#FFFFFF', ratio: whiteRatio, label: '白色文字' },
                  { bg: '#000000', ratio: blackRatio, label: '黑色文字' },
                ].map(({ bg, ratio, label }) => {
                  const level = wcagLevel(ratio)
                  return (
                    <div key={bg} style={{
                      flex: 1, minWidth: 120,
                      padding: 12, borderRadius: 12,
                      background: bg,
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: bg === '#FFFFFF' ? '#000' : '#fff',
                      }}>Aa {label}</div>
                      <div style={{ fontSize: 12, color: bg === '#FFFFFF' ? '#333' : '#ccc', marginTop: 4 }}>
                        {ratio.toFixed(2)}:1
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: level.color }}>{level.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <button onClick={generatePalette} className="cn-btn" style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
              }}>
                <Lightbulb size={14} /> 生成调色板
              </button>
            </div>
          </div>
        </div>

        {/* 调色板展示 */}
        {showPalette && paletteColors.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
            padding: 20, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Droplets size={18} style={{ color: '#a29bfe' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>调色板</span>
              <button onClick={() => setShowPalette(false)} className="cn-btn" style={{
                marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#aaaacc', cursor: 'pointer',
                fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
              }}>
                <EyeOff size={12} /> 隐藏
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
              {paletteColors.map((c, i) => (
                <div key={i} className="cn-card" style={{
                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                }} onClick={() => {
                  const temp = document.createElement('div')
                  temp.style.background = c
                  document.body.appendChild(temp)
                  const rgb = getComputedStyle(temp).backgroundColor
                  document.body.removeChild(temp)
                  const match = rgb.match(/\d+/g)
                  if (match) setSelectedColor(rgbToHex(parseInt(match[0]), parseInt(match[1]), parseInt(match[2])))
                }}>
                  <div style={{ background: c, height: 70 }} />
                  <div style={{ padding: 8, fontSize: 10, color: '#aaaacc', fontFamily: 'monospace', textAlign: 'center', background: 'rgba(255,255,255,0.04)' }}>
                    {c.replace('hsl(', '').replace(')', '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 颜色网格 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Palette size={18} style={{ color: '#a29bfe' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>HTML 命名颜色</span>
              <span style={{ fontSize: 12, color: '#6666aa' }}>({filtered.length} / {htmlColors.length})</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', background: 'rgba(255,255,255,0.06)',
              borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', width: 260,
            }}>
              <Search size={14} style={{ color: '#8888aa' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索颜色名或 HEX..."
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#e0e0f0', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  background: 'none', border: 'none', color: '#6666aa', cursor: 'pointer',
                  padding: 0,
                }}>✕</button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
            {filtered.map(c => (
              <div
                key={c.name}
                className="cn-card"
                onClick={() => setSelectedColor(c.hex)}
                style={{
                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  border: selectedColor.toUpperCase() === c.hex ? '2px solid #a29bfe' : '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ background: c.hex, height: 50 }} />
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e0e0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: '#8888aa', fontFamily: 'monospace' }}>{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}