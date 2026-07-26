import { useState, useCallback, useMemo } from 'react'

type ToolId = 'palette' | 'gradient' | 'shadows' | 'typography' | 'contrast' | 'units'

interface Tool {
  id: ToolId
  name: string
  description: string
  icon: string
}

const tools: Tool[] = [
  { id: 'palette', name: '调色板生成', description: '从基础色生成和谐配色方案', icon: '🎨' },
  { id: 'gradient', name: '渐变编辑器', description: '创建精美的 CSS 渐变', icon: '🌈' },
  { id: 'shadows', name: '阴影生成器', description: '设计柔和或硬朗的阴影效果', icon: '🌓' },
  { id: 'typography', name: '字体预览', description: '预览和比较字体效果', icon: '🔤' },
  { id: 'contrast', name: '对比度检查', description: 'WCAG 可访问性颜色对比', icon: '◐' },
  { id: 'units', name: '单位转换', description: 'px / rem / em / vh 互换', icon: '📐' },
]

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function generatePalette(baseHex: string): { name: string; hex: string; hsl: string; l: number }[] {
  const { h, s, l } = hexToHsl(baseHex)
  return [
    { name: '50',  hex: hslToHex(h, s, Math.min(97, l + 42)), hsl: `${h}, ${s}%, ${Math.min(97, l + 42)}%`, l: Math.min(97, l + 42) },
    { name: '100', hex: hslToHex(h, s, Math.min(94, l + 35)), hsl: `${h}, ${s}%, ${Math.min(94, l + 35)}%`, l: Math.min(94, l + 35) },
    { name: '200', hex: hslToHex(h, s, Math.min(86, l + 26)), hsl: `${h}, ${s}%, ${Math.min(86, l + 26)}%`, l: Math.min(86, l + 26) },
    { name: '300', hex: hslToHex(h, s, Math.min(72, l + 15)), hsl: `${h}, ${s}%, ${Math.min(72, l + 15)}%`, l: Math.min(72, l + 15) },
    { name: '400', hex: hslToHex(h, s, Math.min(58, l + 6)),  hsl: `${h}, ${s}%, ${Math.min(58, l + 6)}%`, l: Math.min(58, l + 6) },
    { name: '500', hex: baseHex, hsl: `${h}, ${s}%, ${l}%`, l },
    { name: '600', hex: hslToHex(h, s, Math.max(10, l - 10)), hsl: `${h}, ${s}%, ${Math.max(10, l - 10)}%`, l: Math.max(10, l - 10) },
    { name: '700', hex: hslToHex(h, s, Math.max(8, l - 20)),  hsl: `${h}, ${s}%, ${Math.max(8, l - 20)}%`, l: Math.max(8, l - 20) },
    { name: '800', hex: hslToHex(h, s, Math.max(6, l - 30)),  hsl: `${h}, ${s}%, ${Math.max(6, l - 30)}%`, l: Math.max(6, l - 30) },
    { name: '900', hex: hslToHex(h, s, Math.max(4, l - 40)),  hsl: `${h}, ${s}%, ${Math.max(4, l - 40)}%`, l: Math.max(4, l - 40) },
    { name: '950', hex: hslToHex(h, s, Math.max(2, l - 48)),  hsl: `${h}, ${s}%, ${Math.max(2, l - 48)}%`, l: Math.max(2, l - 48) },
  ]
}

function generateAnalogous(baseHex: string): string[] {
  const { h, s, l } = hexToHsl(baseHex)
  return [
    hslToHex((h - 30 + 360) % 360, s, l),
    baseHex,
    hslToHex((h + 30) % 360, s, l),
  ]
}

function generateComplementary(baseHex: string): string[] {
  const { h, s, l } = hexToHsl(baseHex)
  return [baseHex, hslToHex((h + 180) % 360, s, l)]
}

function generateTriadic(baseHex: string): string[] {
  const { h, s, l } = hexToHsl(baseHex)
  return [
    baseHex,
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l),
  ]
}

function generateSplitComplementary(baseHex: string): string[] {
  const { h, s, l } = hexToHsl(baseHex)
  return [
    baseHex,
    hslToHex((h + 150) % 360, s, l),
    hslToHex((h + 210) % 360, s, l),
  ]
}

function getContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return 0
    const rgb = [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      .map(c => {
        c /= 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getWcagLevel(ratio: number): { level: string; pass: boolean; color: string } {
  if (ratio >= 7) return { level: 'AAA', pass: true, color: '#10b981' }
  if (ratio >= 4.5) return { level: 'AA', pass: true, color: '#10b981' }
  if (ratio >= 3) return { level: 'AA Large', pass: true, color: '#f59e0b' }
  return { level: 'Fail', pass: false, color: '#ef4444' }
}

export default function StudioSuite() {
  const [activeTool, setActiveTool] = useState<ToolId>('palette')
  const [baseColor, setBaseColor] = useState('#7c6cf0')
  const [paletteMode, setPaletteMode] = useState<'shades' | 'analogous' | 'complementary' | 'triadic' | 'split'>('shades')
  const [copied, setCopied] = useState<string | null>(null)
  const [gradientColors, setGradientColors] = useState(['#7c6cf0', '#00d6c1'])
  const [gradientAngle, setGradientAngle] = useState(135)
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')
  const [shadowX, setShadowX] = useState(0)
  const [shadowY, setShadowY] = useState(10)
  const [shadowBlur, setShadowBlur] = useState(40)
  const [shadowSpread, setShadowSpread] = useState(0)
  const [shadowOpacity, setShadowOpacity] = useState(0.15)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowLayers, setShadowLayers] = useState(2)
  const [contrastBg, setContrastBg] = useState('#1a1a2e')
  const [contrastFg, setContrastFg] = useState('#ffffff')
  const [pxValue, setPxValue] = useState(16)
  const [baseFontSize, setBaseFontSize] = useState(16)
  const [viewportWidth, setViewportWidth] = useState(1440)

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    })
  }, [])

  const palette = useMemo(() => generatePalette(baseColor), [baseColor])
  const analogousColors = useMemo(() => generateAnalogous(baseColor), [baseColor])
  const complementaryColors = useMemo(() => generateComplementary(baseColor), [baseColor])
  const triadicColors = useMemo(() => generateTriadic(baseColor), [baseColor])
  const splitColors = useMemo(() => generateSplitComplementary(baseColor), [baseColor])
  const contrastRatio = useMemo(() => getContrastRatio(contrastFg, contrastBg), [contrastFg, contrastBg])
  const wcag = useMemo(() => getWcagLevel(contrastRatio), [contrastRatio])

  const gradientCss = useMemo(() => {
    if (gradientColors.length < 2) return gradientColors[0] || '#7c6cf0'
    if (gradientType === 'radial') {
      return `radial-gradient(circle, ${gradientColors.join(', ')})`
    }
    return `linear-gradient(${gradientAngle}deg, ${gradientColors.join(', ')})`
  }, [gradientColors, gradientAngle, gradientType])

  const shadowCss = useMemo(() => {
    const hex = shadowColor
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const shadows: string[] = []
    for (let i = 0; i < shadowLayers; i++) {
      const factor = (i + 1) / shadowLayers
      const x = Math.round(shadowX * factor)
      const y = Math.round(shadowY * (0.5 + factor * 0.5))
      const blur = Math.round(shadowBlur * (0.3 + factor * 0.7))
      const spread = Math.round(shadowSpread * factor)
      const opacity = (shadowOpacity * (0.4 + factor * 0.6)).toFixed(3)
      shadows.push(`${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity})`)
    }
    return shadows.join(', ')
  }, [shadowX, shadowY, shadowBlur, shadowSpread, shadowOpacity, shadowColor, shadowLayers])

  const remValue = useMemo(() => (pxValue / baseFontSize).toFixed(4), [pxValue, baseFontSize])
  const emValue = remValue
  const vwValue = useMemo(() => ((pxValue / viewportWidth) * 100).toFixed(4), [pxValue, viewportWidth])
  const percentageValue = useMemo(() => ((pxValue / viewportWidth) * 100).toFixed(2), [pxValue, viewportWidth])

  const addGradientColor = () => {
    if (gradientColors.length < 5) {
      setGradientColors([...gradientColors, '#ffffff'])
    }
  }

  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index))
    }
  }

  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...gradientColors]
    newColors[index] = color
    setGradientColors(newColors)
  }

  const randomColor = () => {
    const h = Math.floor(Math.random() * 360)
    const s = 60 + Math.floor(Math.random() * 30)
    const l = 45 + Math.floor(Math.random() * 20)
    return hslToHex(h, s, l)
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '24px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c6cf0 0%, #00d6c1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 20px rgba(124, 108, 240, 0.4)',
          }}>
            ✨
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Studio Suite</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>创意设计工具箱 · 为设计师与开发者打造</div>
          </div>
        </div>
        <div style={{
          fontSize: 11,
          padding: '6px 12px',
          borderRadius: 20,
          background: 'rgba(124, 108, 240, 0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(124, 108, 240, 0.2)',
          fontWeight: 500,
        }}>
          v1.0
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: 200,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '8px 10px 12px',
          }}>
            工具集
          </div>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: activeTool === tool.id 
                  ? 'linear-gradient(135deg, rgba(124, 108, 240, 0.18) 0%, rgba(0, 214, 193, 0.08) 100%)'
                  : 'transparent',
                color: activeTool === tool.id ? '#e0e7ff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderLeft: activeTool === tool.id ? '3px solid #7c6cf0' : '3px solid transparent',
              }}
              onMouseEnter={e => {
                if (activeTool !== tool.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }
              }}
              onMouseLeave={e => {
                if (activeTool !== tool.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{tool.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{tool.name}</span>
              </div>
              <div style={{ fontSize: 11, color: '#475569', paddingLeft: 28, lineHeight: 1.4 }}>
                {tool.description}
              </div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {activeTool === 'palette' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.02em' }}>调色板生成器</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>从一个基础色生成完整的配色系统</p>
              </div>

              <div style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                padding: 20,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div style={{
                    width: 60, height: 60,
                    borderRadius: 14,
                    background: baseColor,
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }} />
                  <input
                    type="color"
                    value={baseColor}
                    onChange={e => setBaseColor(e.target.value)}
                    style={{ width: 60, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748b', width: 40 }}>HEX</span>
                    <input
                      type="text"
                      value={baseColor}
                      onChange={e => setBaseColor(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: '#e2e8f0',
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                    <button
                      onClick={() => setBaseColor(randomColor())}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(124, 108, 240, 0.3)',
                        background: 'rgba(124, 108, 240, 0.1)',
                        color: '#a78bfa',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      🎲 随机
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['shades', 'analogous', 'complementary', 'triadic', 'split'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaletteMode(mode)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: paletteMode === mode ? 'rgba(124, 108, 240, 0.5)' : 'rgba(255,255,255,0.08)',
                      background: paletteMode === mode ? 'rgba(124, 108, 240, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: paletteMode === mode ? '#c4b5fd' : '#64748b',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    {mode === 'shades' && '色阶阴影'}
                    {mode === 'analogous' && '邻近色'}
                    {mode === 'complementary' && '互补色'}
                    {mode === 'triadic' && '三元色'}
                    {mode === 'split' && '分裂互补'}
                  </button>
                ))}
              </div>

              {paletteMode === 'shades' && (
                <div style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {palette.map((shade, i) => (
                    <div
                      key={shade.name}
                      onClick={() => copyToClipboard(shade.hex, `shade-${i}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 20px',
                        height: 56,
                        background: shade.hex,
                        color: shade.l > 50 ? '#1e293b' : '#f1f5f9',
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 13, width: 50 }}>{shade.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, opacity: 0.8 }}>
                        {shade.hex.toUpperCase()}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>
                        {copied === `shade-${i}` ? '已复制!' : '点击复制'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {paletteMode !== 'shades' && (
                <div style={{ display: 'flex', gap: 0, borderRadius: 16, overflow: 'hidden', height: 200 }}>
                  {(paletteMode === 'analogous' ? analogousColors :
                    paletteMode === 'complementary' ? complementaryColors :
                    paletteMode === 'triadic' ? triadicColors : splitColors
                  ).map((color, i) => (
                    <div
                      key={i}
                      onClick={() => copyToClipboard(color, `harmony-${i}`)}
                      style={{
                        flex: 1,
                        background: color,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: 16,
                        cursor: 'pointer',
                        color: hexToHsl(color).l > 50 ? '#1e293b' : '#f1f5f9',
                        transition: 'flex 0.3s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.flex = '1.3' }}
                      onMouseLeave={e => { e.currentTarget.style.flex = '1' }}
                    >
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                        {color.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                        {copied === `harmony-${i}` ? '已复制!' : '点击复制'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'gradient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.02em' }}>渐变编辑器</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>创建和微调 CSS 渐变效果</p>
              </div>

              <div style={{
                height: 220,
                borderRadius: 16,
                background: gradientCss,
                boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: 16,
              }}
              onClick={() => copyToClipboard(`background: ${gradientCss};`, 'gradient-css')}
              >
                <div style={{
                  padding: '8px 14px',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#fff',
                }}>
                  {copied === 'gradient-css' ? '已复制 CSS!' : '点击复制 CSS'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setGradientType('linear')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: gradientType === 'linear' ? 'rgba(124, 108, 240, 0.5)' : 'rgba(255,255,255,0.08)',
                    background: gradientType === 'linear' ? 'rgba(124, 108, 240, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: gradientType === 'linear' ? '#c4b5fd' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >线性渐变</button>
                <button
                  onClick={() => setGradientType('radial')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: gradientType === 'radial' ? 'rgba(124, 108, 240, 0.5)' : 'rgba(255,255,255,0.08)',
                    background: gradientType === 'radial' ? 'rgba(124, 108, 240, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: gradientType === 'radial' ? '#c4b5fd' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >径向渐变</button>
              </div>

              {gradientType === 'linear' && (
                <div style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>角度</span>
                    <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#a78bfa' }}>{gradientAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={gradientAngle}
                    onChange={e => setGradientAngle(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c6cf0' }}
                  />
                </div>
              )}

              <div style={{
                padding: 20,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>颜色节点</span>
                  <button
                    onClick={addGradientColor}
                    disabled={gradientColors.length >= 5}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: gradientColors.length >= 5 ? 'rgba(255,255,255,0.02)' : 'rgba(124, 108, 240, 0.15)',
                      color: gradientColors.length >= 5 ? '#475569' : '#a78bfa',
                      cursor: gradientColors.length >= 5 ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                    }}
                  >+ 添加</button>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {gradientColors.map((color, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={color}
                        onChange={e => updateGradientColor(i, e.target.value)}
                        style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={e => updateGradientColor(i, e.target.value)}
                        style={{
                          width: 90,
                          padding: '6px 10px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6,
                          color: '#e2e8f0',
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      />
                      {gradientColors.length > 2 && (
                        <button
                          onClick={() => removeGradientColor(i)}
                          style={{
                            width: 28, height: 28,
                            borderRadius: 6,
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: 14,
                          }}
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'shadows' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.02em' }}>阴影生成器</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>设计自然柔和的 box-shadow 效果</p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 40px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div
                  onClick={() => copyToClipboard(`box-shadow: ${shadowCss};`, 'shadow-css')}
                  style={{
                    width: 220,
                    height: 140,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    boxShadow: shadowCss,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {copied === 'shadow-css' ? '已复制!' : '点击复制 CSS'}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}>
                {[
                  { label: 'X 偏移', value: shadowX, setter: setShadowX, min: -50, max: 50, unit: 'px' },
                  { label: 'Y 偏移', value: shadowY, setter: setShadowY, min: 0, max: 100, unit: 'px' },
                  { label: '模糊半径', value: shadowBlur, setter: setShadowBlur, min: 0, max: 100, unit: 'px' },
                  { label: '扩散范围', value: shadowSpread, setter: setShadowSpread, min: -20, max: 20, unit: 'px' },
                  { label: '透明度', value: Math.round(shadowOpacity * 100), setter: (v: number) => setShadowOpacity(v / 100), min: 1, max: 100, unit: '%' },
                  { label: '层数', value: shadowLayers, setter: setShadowLayers, min: 1, max: 4, unit: '层' },
                ].map(slider => (
                  <div key={slider.label} style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{slider.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#a78bfa' }}>
                        {slider.value}{slider.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={slider.value}
                      onChange={e => slider.setter(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#7c6cf0' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#94a3b8', width: 60 }}>颜色</span>
                <input
                  type="color"
                  value={shadowColor}
                  onChange={e => setShadowColor(e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>{shadowColor}</span>
              </div>
            </div>
          )}

          {activeTool === 'typography' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.02em' }}>字体预览</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>预览和比较不同字体的显示效果</p>
              </div>

              {[
                { name: '系统默认', font: 'system-ui, -apple-system, sans-serif' },
                { name: 'Inter / Sans-serif', font: "'Inter', 'Segoe UI', Roboto, sans-serif" },
                { name: 'Space Grotesk', font: "'Space Grotesk', sans-serif" },
                { name: 'JetBrains Mono', font: "'JetBrains Mono', monospace" },
                { name: 'Fraunces / Serif', font: "'Fraunces', Georgia, serif" },
                { name: 'Outfit', font: "'Outfit', sans-serif" },
                { name: 'Sora', font: "'Sora', sans-serif" },
                { name: 'Plus Jakarta Sans', font: "'Plus Jakarta Sans', sans-serif" },
              ].map(font => (
                <div
                  key={font.name}
                  onClick={() => copyToClipboard(`font-family: ${font.font};`, `font-${font.name}`)}
                  style={{
                    padding: '24px 28px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(124, 108, 240, 0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {font.name}
                  </div>
                  <div style={{ fontSize: 28, fontFamily: font.font, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                    设计的力量 The quick brown fox
                  </div>
                  <div style={{ fontSize: 14, fontFamily: font.font, color: '#94a3b8', marginTop: 8, lineHeight: 1.6 }}>
                    好的排版让阅读成为享受。Typography is the art and technique of arranging type.
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                    {copied === `font-${font.name}` ? '✓ 已复制 font-family' : '点击复制'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTool === 'contrast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.02em' }}>对比度检查器</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>WCAG 2.1 可访问性颜色对比度检查</p>
              </div>

              <div style={{
                padding: 28,
                borderRadius: 16,
                background: contrastBg,
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: contrastFg, letterSpacing: '-0.02em' }}>
                  Aa 文字预览
                </div>
                <div style={{ fontSize: 14, color: contrastFg, opacity: 0.7 }}>
                  这是一段测试文本，用于检查颜色对比度是否达标
                </div>
                <div style={{ fontSize: 12, color: contrastFg, opacity: 0.5 }}>
                  Small text for testing contrast ratio
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>背景色</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={contrastBg} onChange={e => setContrastBg(e.target.value)}
                      style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                    <input type="text" value={contrastBg} onChange={e => setContrastBg(e.target.value)}
                      style={{
                        flex: 1, padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: '#e2e8f0',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                      }} />
                  </div>
                </div>
                <div style={{ flex: 1, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>前景色</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={contrastFg} onChange={e => setContrastFg(e.target.value)}
                      style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                    <input type="text" value={contrastFg} onChange={e => setContrastFg(e.target.value)}
                      style={{
                        flex: 1, padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: '#e2e8f0',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                      }} />
                  </div>
                </div>
              </div>

              <div style={{
                padding: 24,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>对比度</div>
                    <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em' }}>
                      {contrastRatio.toFixed(2)}:1
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: wcag.pass ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${wcag.pass ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: wcag.color,
                    fontSize: 20,
                    fontWeight: 700,
                  }}>
                    {wcag.level}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { name: 'AA 正常文本', required: 4.5 },
                    { name: 'AA 大文本', required: 3 },
                    { name: 'AAA 正常文本', required: 7 },
                  ].map(item => {
                    const pass = contrastRatio >= item.required
                    return (
                      <div key={item.name} style={{
                        padding: 14,
                        borderRadius: 10,
                        background: pass ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                        border: `1px solid ${pass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{pass ? '✓' : '✗'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: pass ? '#34d399' : '#f87171' }}>
                          ≥ {item.required}:1
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'units' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.02em' }}>单位转换器</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>px / rem / em / vh / vw 快速换算</p>
              </div>

              <div style={{
                padding: 24,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>像素值 (px)</div>
                    <input
                      type="number"
                      value={pxValue}
                      onChange={e => setPxValue(Number(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(124, 108, 240, 0.3)',
                        borderRadius: 10,
                        color: '#e2e8f0',
                        fontSize: 18,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>基准字号</div>
                    <input
                      type="number"
                      value={baseFontSize}
                      onChange={e => setBaseFontSize(Number(e.target.value) || 16)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        color: '#e2e8f0',
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>视口宽度</div>
                    <input
                      type="number"
                      value={viewportWidth}
                      onChange={e => setViewportWidth(Number(e.target.value) || 1440)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        color: '#e2e8f0',
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { label: 'REM', value: `${remValue}rem`, desc: `相对于根元素 (基准: ${baseFontSize}px)` },
                  { label: 'EM', value: `${emValue}em`, desc: '相对于父元素字体大小' },
                  { label: 'VW', value: `${vwValue}vw`, desc: `视口宽度的百分比 (${viewportWidth}px)` },
                  { label: '百分比', value: `${percentageValue}%`, desc: `相对于父元素宽度` },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => copyToClipboard(item.value, `unit-${item.label}`)}
                    style={{
                      padding: '20px 24px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(124, 108, 240, 0.06)'
                      e.currentTarget.style.borderColor = 'rgba(124, 108, 240, 0.2)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 8,
                    }}>{item.label}</div>
                    <div style={{
                      fontSize: 24,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '-0.02em',
                      color: '#c4b5fd',
                    }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                      {copied === `unit-${item.label}` ? '✓ 已复制' : item.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: 16,
                background: 'rgba(124, 108, 240, 0.06)',
                borderRadius: 12,
                border: '1px solid rgba(124, 108, 240, 0.15)',
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.7,
              }}>
                <div style={{ color: '#a78bfa', fontWeight: 500, marginBottom: 6 }}>💡 提示</div>
                1rem = 1em = 基准字号 (默认 16px)。使用 rem 可以保证用户调整浏览器字号时界面同步缩放。
                vw/vh 适合响应式设计，1vw 等于视口宽度的 1%。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
