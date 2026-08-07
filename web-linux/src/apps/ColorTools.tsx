import { useState, useMemo, useCallback } from 'react'

type HarmonyType = 'monochromatic' | 'complementary' | 'triadic' | 'analogous' | 'splitComplementary'
type TabType = 'picker' | 'palette' | 'gradient' | 'contrast' | 'blindness' | 'tailwind'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60; break
      case gn: h = ((bn - rn) / d + 2) * 60; break
      case bn: h = ((rn - gn) / d + 4) * 60; break
    }
  }
  return [h, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp >= 0 && hp < 1) { r = c; g = x; b = 0 }
  else if (hp < 2) { r = x; g = c; b = 0 }
  else if (hp < 3) { r = 0; g = c; b = x }
  else if (hp < 4) { r = 0; g = x; b = c }
  else if (hp < 5) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const m = ln - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const l = 0.4122214708 * rn + 0.5363325363 * gn + 0.0514459929 * bn
  const m = 0.2119034982 * rn + 0.6806995451 * gn + 0.1073969566 * bn
  const s = 0.0883024619 * rn + 0.2817188376 * gn + 0.6299787005 * bn
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  const okl = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const okm = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const oks = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  const lightness = okl * 100
  const chroma = Math.sqrt(okm * okm + oks * oks) * 100
  const hue = (Math.atan2(oks, okm) * 180 / Math.PI + 360) % 360
  return [lightness, chroma, hue]
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(c1: string, c2: string): number {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  const l1 = luminance(r1, g1, b1)
  const l2 = luminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function generatePalette(baseHex: string, type: HarmonyType, count: number): string[] {
  const [r, g, b] = hexToRgb(baseHex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const palette: string[] = []

  switch (type) {
    case 'monochromatic':
      for (let i = 0; i < count; i++) {
        const newL = Math.max(10, Math.min(95, l - 40 + (i * 80) / (count - 1)))
        const [rr, gg, bb] = hslToRgb(h, s, newL)
        palette.push(rgbToHex(rr, gg, bb))
      }
      break
    case 'complementary':
      for (let i = 0; i < count; i++) {
        const newH = (h + i * (360 / count)) % 360
        const [rr, gg, bb] = hslToRgb(newH, s, l)
        palette.push(rgbToHex(rr, gg, bb))
      }
      break
    case 'triadic':
      for (let i = 0; i < count; i++) {
        const newH = (h + i * 120) % 360
        const [rr, gg, bb] = hslToRgb(newH, s, l)
        palette.push(rgbToHex(rr, gg, bb))
      }
      break
    case 'analogous':
      for (let i = 0; i < count; i++) {
        const newH = (h - 30 + i * (60 / (count - 1)) + 360) % 360
        const [rr, gg, bb] = hslToRgb(newH, s, l)
        palette.push(rgbToHex(rr, gg, bb))
      }
      break
    case 'splitComplementary':
      for (let i = 0; i < count; i++) {
        const newH = i === 0 ? h : i === 1 ? (h + 150) % 360 : (h + 210) % 360
        const [rr, gg, bb] = hslToRgb(newH, s, l)
        palette.push(rgbToHex(rr, gg, bb))
      }
      break
  }
  return palette
}

const COLORBLIND_FILTERS: Record<string, { name: string; filter: string }> = {
  protanopia: { name: '红色盲 Protanopia', filter: 'hue-rotate(20deg) saturate(0.7)' },
  deuteranopia: { name: '绿色盲 Deuteranopia', filter: 'hue-rotate(-20deg) saturate(0.7)' },
  tritanopia: { name: '蓝色盲 Tritanopia', filter: 'hue-rotate(120deg) saturate(0.7)' },
  achromatopsia: { name: '全色盲 Achromatopsia', filter: 'grayscale(100%)' },
  protanomaly: { name: '红色弱 Protanomaly', filter: 'hue-rotate(10deg) saturate(0.8)' },
  deuteranomaly: { name: '绿色弱 Deuteranomaly', filter: 'hue-rotate(-10deg) saturate(0.8)' },
}

export default function ColorTools() {
  const [tab, setTab] = useState<TabType>('picker')
  const [baseColor, setBaseColor] = useState('#7C6CF0')
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary')
  const [paletteCount, setPaletteCount] = useState(6)
  const [fgColor, setFgColor] = useState('#FFFFFF')
  const [bgColor, setBgColor] = useState('#7C6CF0')
  const [gradientStart, setGradientStart] = useState('#7C6CF0')
  const [gradientEnd, setGradientEnd] = useState('#00D6C1')
  const [gradientAngle, setGradientAngle] = useState(135)
  const [blindnessType, setBlindnessType] = useState<string>('protanopia')
  const [tailwindColorName, setTailwindColorName] = useState('custom')

  const [r, g, b] = useMemo(() => hexToRgb(baseColor), [baseColor])
  const [h, s, l] = useMemo(() => rgbToHsl(r, g, b), [r, g, b])
  const [l2, c2, h2] = useMemo(() => rgbToOklch(r, g, b), [r, g, b])

  const palette = useMemo(
    () => generatePalette(baseColor, harmonyType, paletteCount),
    [baseColor, harmonyType, paletteCount]
  )

  const ratio = useMemo(() => contrastRatio(fgColor, bgColor), [fgColor, bgColor])

  const wcagGrade = useMemo(() => {
    if (ratio >= 7) return { aa: 'AAA', aaLarge: 'AAA', normal: 'AAA' }
    if (ratio >= 4.5) return { aa: 'AA', aaLarge: 'AAA', normal: 'AA' }
    if (ratio >= 3) return { aa: 'Fail', aaLarge: 'AA', normal: 'Fail' }
    return { aa: 'Fail', aaLarge: 'Fail', normal: 'Fail' }
  }, [ratio])

  const tailwindShades = useMemo(() => {
    const shades: Record<number, string> = {}
    const [br, bg, bb] = hexToRgb(baseColor)
    const [bh, bs] = rgbToHsl(br, bg, bb)
    const lightnessMap: Record<number, number> = {
      50: 95, 100: 90, 200: 80, 300: 70, 400: 60,
      500: 50, 600: 40, 700: 30, 800: 20, 900: 10, 950: 5,
    }
    for (const [shade, targetL] of Object.entries(lightnessMap)) {
      const [rr, gg, bb] = hslToRgb(bh, bs * 0.9, targetL)
      shades[parseInt(shade)] = rgbToHex(rr, gg, bb)
    }
    return shades
  }, [baseColor])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'picker', label: '颜色拾取', icon: '🎨' },
    { id: 'palette', label: '调色板', icon: '🎭' },
    { id: 'gradient', label: '渐变编辑', icon: '🌈' },
    { id: 'contrast', label: '对比度', icon: '⚖️' },
    { id: 'blindness', label: '色盲模拟', icon: '👁️' },
    { id: 'tailwind', label: 'Tailwind', icon: '💨' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)',
        flexShrink: 0,
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: tab === t.id ? 'var(--accent-bg)' : 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: tab === t.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <span>{t.icon}</span>
            <span style={{ display: 'inline-block' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {tab === 'picker' && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 280px' }}>
              <div style={{
                width: '240px',
                height: '240px',
                borderRadius: '16px',
                background: baseColor,
                boxShadow: `0 8px 32px ${baseColor}66, inset 0 0 0 1px rgba(255,255,255,0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                transition: 'background 0.2s',
              }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: luminance(r, g, b) > 0.5 ? '#000' : '#fff',
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>{baseColor}</span>
              </div>

              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  border: '1px solid var(--window-border)',
                  borderRadius: '12px',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              />

              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>HEX 输入</label>
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) setBaseColor(v)
                    else if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBaseColor(v)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--window-bg)',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '300px' }}>
              <ColorValueDisplay
                label="HEX"
                value={baseColor}
                onCopy={copyToClipboard}
              />
              <ColorValueDisplay
                label="RGB"
                value={`rgb(${r}, ${g}, ${b})`}
                onCopy={copyToClipboard}
              />
              <ColorValueDisplay
                label="HSL"
                value={`hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`}
                onCopy={copyToClipboard}
              />
              <ColorValueDisplay
                label="OKLCH"
                value={`oklch(${l2.toFixed(1)}% ${c2.toFixed(1)} ${Math.round(h2)})`}
                onCopy={copyToClipboard}
              />
              <ColorValueDisplay
                label="OKLCH (hex)"
                value={`oklch(${l2.toFixed(1)}% ${c2.toFixed(1)} ${Math.round(h2)} / 1)`}
                onCopy={copyToClipboard}
              />

              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(124, 108, 240, 0.1)',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>色彩心理学</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <div>色相角 {Math.round(h)}° — {describeHue(h)}</div>
                  <div>饱和度 {Math.round(s)}% — {describeSaturation(s)}</div>
                  <div>亮度 {Math.round(l)}% — {describeLightness(l)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'palette' && (
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>基色</label>
                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} style={{ width: '60px', height: '36px', border: '1px solid var(--window-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}> harmony 类型</label>
                <select value={harmonyType} onChange={(e) => setHarmonyType(e.target.value as HarmonyType)} style={{ padding: '8px 12px', background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: '6px', color: 'var(--text-primary)' }}>
                  <option value="monochromatic">单色 Monochromatic</option>
                  <option value="complementary">互补 Complementary</option>
                  <option value="triadic">三角色 Triadic</option>
                  <option value="analogous">类似 Analogous</option>
                  <option value="splitComplementary">分裂互补 Split-Complementary</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>颜色数量</label>
                <input type="range" min={2} max={12} value={paletteCount} onChange={(e) => setPaletteCount(parseInt(e.target.value))} style={{ width: '120px' }} />
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>{paletteCount}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(paletteCount, 8)}, 1fr)`, gap: '8px' }}>
              {palette.map((color, i) => (
                <div
                  key={i}
                  onClick={() => { setBaseColor(color); copyToClipboard(color) }}
                  style={{
                    background: color,
                    height: '80px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    padding: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'transform 0.15s',
                    border: color.toLowerCase() === baseColor.toLowerCase() ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: luminance(...hexToRgb(color)) > 0.5 ? '#000' : '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}>{color}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const css = `:root {\n  ${palette.map((c, i) => `--color-${i + 1}: ${c};`).join('\n  ')}\n}`
                copyToClipboard(css)
              }}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              复制 CSS 变量
            </button>
          </div>
        )}

        {tab === 'gradient' && (
          <div>
            <div style={{
              height: '120px',
              borderRadius: '16px',
              background: `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              marginBottom: '20px',
            }} />

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>起始色</label>
                <input type="color" value={gradientStart} onChange={(e) => setGradientStart(e.target.value)} style={{ width: '60px', height: '36px', border: '1px solid var(--window-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>结束色</label>
                <input type="color" value={gradientEnd} onChange={(e) => setGradientEnd(e.target.value)} style={{ width: '60px', height: '36px', border: '1px solid var(--window-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>角度: {gradientAngle}°</label>
                <input type="range" min={0} max={360} value={gradientAngle} onChange={(e) => setGradientAngle(parseInt(e.target.value))} style={{ width: '180px' }} />
              </div>
            </div>

            <ColorValueDisplay
              label="CSS"
              value={`linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`}
              onCopy={copyToClipboard}
            />
            <ColorValueDisplay
              label="Tailwind"
              value={`bg-gradient-to-br from-[${gradientStart}] to-[${gradientEnd}]`}
              onCopy={copyToClipboard}
            />

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>预设渐变</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {[
                  ['#7C6CF0', '#00D6C1', '品牌渐变'],
                  ['#f093fb', '#f5576c', '日落'],
                  ['#4facfe', '#00f2fe', '海洋'],
                  ['#43e97b', '#38f9d7', '森林'],
                  ['#fa709a', '#fee140', '玫瑰金'],
                  ['#30cfd0', '#330867', '深空'],
                ].map(([s, e, name]) => (
                  <div
                    key={name}
                    onClick={() => { setGradientStart(s); setGradientEnd(e) }}
                    style={{
                      height: '50px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${s}, ${e})`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(ev) => (ev.currentTarget.style.transform = 'scale(1)')}
                  >{name}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'contrast' && (
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>前景色</label>
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{ width: '60px', height: '36px', border: '1px solid var(--window-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>背景色</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '60px', height: '36px', border: '1px solid var(--window-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
              </div>
            </div>

            <div style={{
              padding: '40px',
              background: bgColor,
              borderRadius: '16px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <div style={{ color: fgColor, fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
                示例文本 Preview Text
              </div>
              <div style={{ color: fgColor, fontSize: '16px' }}>
                这是一段较长的示例文本，用于展示颜色对比度。This is a longer sample text to demonstrate color contrast.
              </div>
              <div style={{ color: fgColor, fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                辅助文字辅助信息
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <ContrastCard label="普通文本 (4.5:1)" ratio={ratio} threshold={4.5} grade={wcagGrade.normal} />
              <ContrastCard label="大文本 (3:1)" ratio={ratio} threshold={3} grade={wcagGrade.aaLarge} />
              <ContrastCard label="AAA 级 (7:1)" ratio={ratio} threshold={7} grade={ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'} />
            </div>
          </div>
        )}

        {tab === 'blindness' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>色盲类型</label>
              <select value={blindnessType} onChange={(e) => setBlindnessType(e.target.value)} style={{ padding: '8px 12px', background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                {Object.entries(COLORBLIND_FILTERS).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {[true, false].map((simulate) => (
                <div key={String(simulate)}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {simulate ? '模拟视图' : '正常视图'}
                  </div>
                  <div
                    style={{
                      padding: '24px',
                      background: `linear-gradient(135deg, ${palette.slice(0, 3).join(', ')})`,
                      borderRadius: '12px',
                      filter: simulate ? COLORBLIND_FILTERS[blindnessType].filter : 'none',
                      minHeight: '120px',
                    }}
                  >
                    <div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>色觉测试图</div>
                    <div style={{ color: '#fff', fontSize: '13px', marginTop: '8px', opacity: 0.9 }}>
                      The quick brown fox jumps over the lazy dog.
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>全色盲模拟</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {palette.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: c,
                      filter: COLORBLIND_FILTERS[blindnessType].filter,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'tailwind' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Tailwind CSS 主题生成器
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} style={{ width: '60px', height: '36px', border: '1px solid var(--window-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
                <input
                  type="text"
                  value={tailwindColorName}
                  onChange={(e) => setTailwindColorName(e.target.value)}
                  style={{ padding: '8px 12px', background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: '6px', color: 'var(--text-primary)', width: '120px' }}
                  placeholder="颜色名"
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  基色: {baseColor}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginBottom: '20px' }}>
              {Object.entries(tailwindShades).map(([shade, color]) => (
                <div
                  key={shade}
                  onClick={() => { copyToClipboard(color); setBaseColor(color) }}
                  style={{
                    background: color,
                    padding: '12px 8px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: luminance(...hexToRgb(color)) > 0.5 ? '#000' : '#fff',
                  }}>{shade}</div>
                  <div style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: luminance(...hexToRgb(color)) > 0.5 ? '#333' : 'rgba(255,255,255,0.8)',
                  }}>{color}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>tailwind.config.js</div>
              <pre style={{
                background: '#1a1a2e',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px',
                lineHeight: '1.6',
                fontFamily: 'monospace',
                color: '#e0e0e0',
              }}>
{`module.exports = {
  theme: {
    extend: {
      colors: {
        ${tailwindColorName}: {
          ${Object.entries(tailwindShades).map(([shade, color]) => `${shade}: '${color}'`).join(',\n          ')
        }
      }
    }
  }
}`}
              </pre>
              <button
                onClick={() => {
                  const config = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${tailwindColorName}: {\n          ${Object.entries(tailwindShades).map(([s, c]) => `${s}: '${c}'`).join(',\n          ')}\n        }\n      }\n    }\n  }\n}`
                  copyToClipboard(config)
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                复制配置
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ColorValueDisplay({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      marginBottom: '8px',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: '8px',
    }}>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '60px', fontWeight: 600 }}>{label}</span>
      <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-primary)' }}>{value}</code>
      <button
        onClick={() => onCopy(value)}
        style={{
          padding: '4px 10px',
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        复制
      </button>
    </div>
  )
}

function ContrastCard({ label, ratio, threshold, grade }: { label: string; ratio: number; threshold: number; grade: string }) {
  const pass = ratio >= threshold
  return (
    <div style={{
      padding: '16px',
      background: pass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${pass ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: pass ? '#10b981' : '#ef4444' }}>
        {ratio.toFixed(2)}:1
      </div>
      <div style={{ fontSize: '12px', color: pass ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: '4px' }}>
        {pass ? `✓ 通过 ${grade}` : `✗ 未达标 (需 ${threshold}:1)`}
      </div>
    </div>
  )
}

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

function describeSaturation(s: number): string {
  if (s < 10) return '灰调 Achromatic'
  if (s < 30) return '低饱和 Muted'
  if (s < 60) return '中饱和 Moderate'
  if (s < 85) return '高饱和 Vivid'
  return '极高饱和 Saturated'
}

function describeLightness(l: number): string {
  if (l < 15) return '极暗 Very Dark'
  if (l < 30) return '暗色 Dark'
  if (l < 50) return '中暗 Medium-Dark'
  if (l < 70) return '中亮 Medium-Light'
  if (l < 85) return '亮色 Light'
  return '极暗 Very Light'
}
