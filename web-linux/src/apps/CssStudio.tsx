import { useState, useMemo, useCallback } from 'react'

/**
 * CssStudio — CSS 工具箱
 *
 * 六大功能：
 *  1. CSS 渐变编辑器（实时预览）
 *  2. Box Shadow 生成器
 *  3. Border Radius 生成器
 *  4. CSS 动画关键帧编辑器
 *  5. 颜色转换器（HEX / RGB / HSL）
 *  6. Flexbox 布局预览器
 */

type Tab = 'gradient' | 'shadow' | 'radius' | 'animation' | 'color' | 'flex'

// ─── 颜色转换工具 ─────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100; l /= 100; h /= 360
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v } }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

// ─── 样式常量 ────────────────────────────────────────────

const C = {
  bg: '#0c0a14',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  accent: '#ec4899',
  accentDark: '#be185d',
  accentLight: '#f472b6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#fbbf24',
  blue: '#38bdf8',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
}

const container: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: `radial-gradient(ellipse at top, #1f0a1a 0%, ${C.bg} 60%)`,
  color: C.text,
  fontFamily: C.mono,
  padding: 16,
  overflow: 'hidden',
  boxSizing: 'border-box',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  gap: 12,
  flexWrap: 'wrap',
}

const logoStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: 20,
  fontWeight: 900,
  boxShadow: `0 6px 16px rgba(236,72,153,0.35)`,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 21,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  background: `linear-gradient(135deg, #fbcfe8 0%, ${C.accentLight} 50%, ${C.accent} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const subtitleStyle: React.CSSProperties = { margin: '2px 0 0 0', fontSize: 11, color: C.textDim }

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 3,
  background: C.surface,
  padding: 3,
  borderRadius: 9,
  marginBottom: 12,
  width: 'fit-content',
  flexWrap: 'wrap',
}

const tabBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const contentStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto', gap: 10 }

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 6,
  flexWrap: 'wrap',
}

const labelStyle: React.CSSProperties = { color: C.textDim, fontSize: 12, minWidth: 60, flexShrink: 0 }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`,
  color: C.text,
  padding: '5px 9px',
  borderRadius: 5,
  fontFamily: 'inherit',
  fontSize: 12,
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  padding: '5px 11px',
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}

const codeBlockStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 10,
  fontFamily: C.mono,
  fontSize: 12,
  lineHeight: 1.6,
  color: C.green,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  overflow: 'auto',
  maxHeight: 120,
}

const sectionStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: 12,
}

// ─── 主组件 ──────────────────────────────────────────────

export default function CssStudio() {
  const [tab, setTab] = useState<Tab>('gradient')

  // ── 渐变编辑器 ──
  const [gradType, setGradType] = useState<'linear' | 'radial' | 'conic'>('linear')
  const [gradAngle, setGradAngle] = useState(135)
  const [gradStops, setGradStops] = useState([
    { color: '#8b5cf6', pos: 0 },
    { color: '#ec4899', pos: 50 },
    { color: '#f59e0b', pos: 100 },
  ])

  const gradCSS = useMemo(() => {
    const stops = gradStops.map(s => `${s.color} ${s.pos}%`).join(', ')
    if (gradType === 'linear') return `linear-gradient(${gradAngle}deg, ${stops})`
    if (gradType === 'radial') return `radial-gradient(circle, ${stops})`
    return `conic-gradient(from ${gradAngle}deg, ${stops})`
  }, [gradType, gradAngle, gradStops])

  const addGradStop = useCallback(() => {
    setGradStops(prev => [...prev, { color: '#ffffff', pos: Math.round((prev[prev.length - 1]?.pos ?? 0 + 100) / 2) }])
  }, [])
  const removeGradStop = useCallback((i: number) => {
    setGradStops(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev)
  }, [])

  // ── Box Shadow ──
  const [shadows, setShadows] = useState([{
    inset: false, x: 4, y: 4, blur: 12, spread: 0, color: '#000000', alpha: 40
  }])

  const shadowCSS = useMemo(() => {
    return shadows.map(s =>
      `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}${Math.round(s.alpha * 2.55).toString(16).padStart(2, '0')}`
    ).join(',\n  ')
  }, [shadows])

  // ── Border Radius ──
  const [radius, setRadius] = useState({ tl: 16, tr: 16, br: 16, bl: 16 })
  const [radiusUnit, setRadiusUnit] = useState<'px' | '%' | 'rem'>('px')

  const radiusCSS = useMemo(() => {
    const v = (n: number) => `${n}${radiusUnit}`
    if (radius.tl === radius.tr && radius.tr === radius.br && radius.br === radius.bl) {
      return `border-radius: ${v(radius.tl)};`
    }
    return `border-radius: ${v(radius.tl)} ${v(radius.tr)} ${v(radius.br)} ${v(radius.bl)};`
  }, [radius, radiusUnit])

  // ── 动画关键帧 ──
  const [animName, setAnimName] = useState('bounce')
  const [animDuration, setAnimDuration] = useState(1)
  const [animTiming, setAnimTiming] = useState('ease-in-out')
  const [animIter, setAnimIter] = useState('infinite')
  const [animFrames, setAnimFrames] = useState([
    { pct: 0, props: 'transform: scale(1);' },
    { pct: 50, props: 'transform: scale(1.2);' },
    { pct: 100, props: 'transform: scale(1);' },
  ])

  const animKeyframesCSS = useMemo(() => {
    const frames = animFrames.map(f => `  ${f.pct}% {\n    ${f.props}\n  }`).join('\n')
    return `@keyframes ${animName} {\n${frames}\n}`
  }, [animName, animFrames])

  const animUsageCSS = useMemo(() => {
    return `animation: ${animName} ${animDuration}s ${animTiming} ${animIter};`
  }, [animName, animDuration, animTiming, animIter])

  // ── 颜色转换 ──
  const [hexVal, setHexVal] = useState('#8b5cf6')

  const colorConv = useMemo(() => {
    const rgb = hexToRgb(hexVal)
    if (!rgb) return null
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb, hsl }
  }, [hexVal])

  // ── Flexbox ──
  const [flexDir, setFlexDir] = useState('row')
  const [flexWrap, setFlexWrap] = useState('nowrap')
  const [justifyContent, setJustifyContent] = useState('flex-start')
  const [alignItems, setAlignItems] = useState('stretch')
  const [flexGap, setFlexGap] = useState(8)
  const [flexItems, setFlexItems] = useState([
    { label: 'A', grow: 1, shrink: 1, basis: 'auto', w: 60, h: 60 },
    { label: 'B', grow: 1, shrink: 1, basis: 'auto', w: 80, h: 80 },
    { label: 'C', grow: 0, shrink: 1, basis: 'auto', w: 50, h: 50 },
  ])

  const flexContainerCSS = useMemo(() => {
    return `display: flex;\nflex-direction: ${flexDir};\nflex-wrap: ${flexWrap};\njustify-content: ${justifyContent};\nalign-items: ${alignItems};\ngap: ${flexGap}px;`
  }, [flexDir, flexWrap, justifyContent, alignItems, flexGap])

  // ── 复制工具 ──
  const [copiedKey, setCopiedKey] = useState('')
  const copyText = useCallback(async (text: string, key: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 1200)
    } catch { /* noop */ }
  }, [])

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copyText(text, id)} style={{ ...btnStyle, padding: '3px 10px', fontSize: 11 }}>
      {copiedKey === id ? '✓ 已复制' : '复制'}
    </button>
  )

  // ── 范围滑块组件 ──
  const Slider = ({ value, min, max, step = 1, onChange, unit = '' }: {
    value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: C.accent, height: 4, cursor: 'pointer' }}
      />
      <span style={{ color: C.text, fontSize: 11, minWidth: 48, textAlign: 'right', fontFamily: C.mono }}>
        {value}{unit}
      </span>
    </div>
  )

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'gradient', label: '渐变', icon: '🎨' },
    { id: 'shadow', label: '阴影', icon: '💫' },
    { id: 'radius', label: '圆角', icon: '⭕' },
    { id: 'animation', label: '动画', icon: '🎬' },
    { id: 'color', label: '颜色', icon: '🌈' },
    { id: 'flex', label: 'Flex', icon: '📐' },
  ]

  return (
    <div style={container}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={logoStyle}>C</div>
          <div>
            <h1 style={titleStyle}>CssStudio</h1>
            <p style={subtitleStyle}>CSS 工具箱 · 渐变 / 阴影 / 圆角 / 动画 / 颜色 / Flex</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={tabsStyle}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              background: tab === t.id ? `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)` : 'transparent',
              color: tab === t.id ? '#fff' : C.textDim,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={contentStyle}>
        {/* ── 渐变编辑器 ── */}
        {tab === 'gradient' && (
          <>
            {/* 预览 */}
            <div style={{ height: 100, borderRadius: 10, background: gradCSS, border: `1px solid ${C.border}` }} />

            {/* 类型选择 */}
            <div style={rowStyle}>
              <span style={labelStyle}>类型</span>
              {(['linear', 'radial', 'conic'] as const).map(t => (
                <button key={t} onClick={() => setGradType(t)} style={{
                  ...btnStyle,
                  background: gradType === t ? C.accent : C.surface,
                  color: gradType === t ? '#fff' : C.textDim,
                  border: gradType === t ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                }}>
                  {t === 'linear' ? '线性' : t === 'radial' ? '径向' : '锥形'}
                </button>
              ))}
            </div>

            {/* 角度 */}
            {gradType !== 'radial' && (
              <div style={rowStyle}>
                <span style={labelStyle}>角度</span>
                <Slider value={gradAngle} min={0} max={360} onChange={setGradAngle} unit="°" />
              </div>
            )}

            {/* 色标 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>色标</span>
                <button onClick={addGradStop} style={{ ...btnStyle, padding: '3px 10px', fontSize: 11 }}>+ 添加</button>
              </div>
              {gradStops.map((stop, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <input type="color" value={stop.color} onChange={e => {
                    setGradStops(prev => prev.map((s, idx) => idx === i ? { ...s, color: e.target.value } : s))
                  }} style={{ width: 32, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                  <span style={{ color: C.textMuted, fontSize: 11 }}>{stop.color}</span>
                  <input type="range" min={0} max={100} value={stop.pos} onChange={e => {
                    setGradStops(prev => prev.map((s, idx) => idx === i ? { ...s, pos: parseInt(e.target.value) } : s))
                  }} style={{ flex: 1, accentColor: C.accent, height: 3, cursor: 'pointer' }} />
                  <span style={{ color: C.text, fontSize: 11, minWidth: 30 }}>{stop.pos}%</span>
                  {gradStops.length > 2 && (
                    <button onClick={() => removeGradStop(i)} style={{ ...btnStyle, padding: '2px 6px', fontSize: 10, color: C.red }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* CSS 代码 */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}><CopyBtn text={`background: ${gradCSS};`} id="grad" /></div>
              <pre style={codeBlockStyle}>{`background: ${gradCSS};`}</pre>
            </div>
          </>
        )}

        {/* ── Box Shadow ── */}
        {tab === 'shadow' && (
          <>
            {/* 预览 */}
            <div style={{
              height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1a1a2e', borderRadius: 10, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 80, height: 80, background: '#2a2a4a', borderRadius: 12,
                boxShadow: shadows.map(s =>
                  `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}${Math.round(s.alpha * 2.55).toString(16).padStart(2, '0')}`
                ).join(', '),
              }} />
            </div>

            {shadows.map((shadow, i) => (
              <div key={i} style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>阴影层 {i + 1}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, inset: !s.inset } : s))} style={{
                      ...btnStyle, padding: '3px 8px', fontSize: 11,
                      background: shadow.inset ? C.accent : C.surface,
                      color: shadow.inset ? '#fff' : C.textDim,
                    }}>inset</button>
                    {shadows.length > 1 && (
                      <button onClick={() => setShadows(prev => prev.filter((_, idx) => idx !== i))} style={{ ...btnStyle, padding: '3px 6px', fontSize: 10, color: C.red }}>✕</button>
                    )}
                  </div>
                </div>
                <div style={rowStyle}>
                  <span style={{ ...labelStyle, minWidth: 30 }}>X</span>
                  <Slider value={shadow.x} min={-50} max={50} onChange={v => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, x: v } : s))} unit="px" />
                </div>
                <div style={rowStyle}>
                  <span style={{ ...labelStyle, minWidth: 30 }}>Y</span>
                  <Slider value={shadow.y} min={-50} max={50} onChange={v => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, y: v } : s))} unit="px" />
                </div>
                <div style={rowStyle}>
                  <span style={{ ...labelStyle, minWidth: 30 }}>模糊</span>
                  <Slider value={shadow.blur} min={0} max={100} onChange={v => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, blur: v } : s))} unit="px" />
                </div>
                <div style={rowStyle}>
                  <span style={{ ...labelStyle, minWidth: 30 }}>扩展</span>
                  <Slider value={shadow.spread} min={-50} max={50} onChange={v => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, spread: v } : s))} unit="px" />
                </div>
                <div style={rowStyle}>
                  <span style={{ ...labelStyle, minWidth: 30 }}>透明</span>
                  <Slider value={shadow.alpha} min={0} max={100} onChange={v => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, alpha: v } : s))} unit="%" />
                </div>
                <div style={rowStyle}>
                  <span style={{ ...labelStyle, minWidth: 30 }}>色</span>
                  <input type="color" value={shadow.color} onChange={e => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, color: e.target.value } : s))}
                    style={{ width: 32, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                  <span style={{ color: C.textMuted, fontSize: 11 }}>{shadow.color}</span>
                </div>
              </div>
            ))}

            <button onClick={() => setShadows(prev => [...prev, { inset: false, x: 2, y: 2, blur: 8, spread: 0, color: '#000000', alpha: 30 }])}
              style={{ ...btnStyle, alignSelf: 'flex-start' }}>+ 添加阴影层</button>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}><CopyBtn text={`box-shadow: ${shadowCSS};`} id="shadow" /></div>
              <pre style={codeBlockStyle}>{`box-shadow: ${shadowCSS};`}</pre>
            </div>
          </>
        )}

        {/* ── Border Radius ── */}
        {tab === 'radius' && (
          <>
            {/* 预览 */}
            <div style={{
              height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1a1a2e', borderRadius: 10, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 90, height: 90, background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)`,
                borderRadius: `${radius.tl}${radiusUnit} ${radius.tr}${radiusUnit} ${radius.br}${radiusUnit} ${radius.bl}${radiusUnit}`,
              }} />
            </div>

            {/* 可视化编辑器 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>圆角编辑</span>
                <select value={radiusUnit} onChange={e => setRadiusUnit(e.target.value as 'px' | '%' | 'rem')} style={{ ...inputStyle, padding: '3px 6px', fontSize: 11 }}>
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="rem">rem</option>
                </select>
              </div>
              {/* 可视化方块 */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  <div style={{
                    width: 160, height: 160,
                    border: `2px dashed ${C.accent}`,
                    borderRadius: `${radius.tl}${radiusUnit} ${radius.tr}${radiusUnit} ${radius.br}${radiusUnit} ${radius.bl}${radiusUnit}`,
                    background: 'rgba(236,72,153,0.06)',
                  }} />
                  {/* 角标签 */}
                  <span style={{ position: 'absolute', top: 4, left: 8, color: C.accentLight, fontSize: 11, fontWeight: 600 }}>{radius.tl}</span>
                  <span style={{ position: 'absolute', top: 4, right: 8, color: C.accentLight, fontSize: 11, fontWeight: 600 }}>{radius.tr}</span>
                  <span style={{ position: 'absolute', bottom: 4, right: 8, color: C.accentLight, fontSize: 11, fontWeight: 600 }}>{radius.br}</span>
                  <span style={{ position: 'absolute', bottom: 4, left: 8, color: C.accentLight, fontSize: 11, fontWeight: 600 }}>{radius.bl}</span>
                </div>
              </div>
              {(['tl', 'tr', 'br', 'bl'] as const).map((corner, i) => {
                const labels = ['左上', '右上', '右下', '左下']
                return (
                  <div key={corner} style={rowStyle}>
                    <span style={labelStyle}>{labels[i]}</span>
                    <Slider value={radius[corner]} min={0} max={radiusUnit === '%' ? 100 : 100} onChange={v => setRadius(prev => ({ ...prev, [corner]: v }))} unit={radiusUnit} />
                  </div>
                )
              })}
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}><CopyBtn text={radiusCSS} id="radius" /></div>
              <pre style={codeBlockStyle}>{radiusCSS}</pre>
            </div>
          </>
        )}

        {/* ── 动画关键帧 ── */}
        {tab === 'animation' && (
          <>
            {/* 预览 */}
            <div style={{
              height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1a1a2e', borderRadius: 10, border: `1px solid ${C.border}`,
            }}>
              <style>{`
                @keyframes cssStudioPreview {
                  ${animFrames.map(f => `${f.pct}% { ${f.props} }`).join(' ')}
                }
              `}</style>
              <div style={{
                width: 50, height: 50, background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)`,
                borderRadius: 10, animation: `cssStudioPreview ${animDuration}s ${animTiming} ${animIter}`,
              }} />
            </div>

            <div style={sectionStyle}>
              <div style={rowStyle}>
                <span style={labelStyle}>名称</span>
                <input value={animName} onChange={e => setAnimName(e.target.value)} style={{ ...inputStyle, width: 120 }} />
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>时长</span>
                <Slider value={animDuration} min={0.1} max={10} step={0.1} onChange={setAnimDuration} unit="s" />
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>缓动</span>
                <select value={animTiming} onChange={e => setAnimTiming(e.target.value)} style={inputStyle}>
                  {['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>次数</span>
                <select value={animIter} onChange={e => setAnimIter(e.target.value)} style={inputStyle}>
                  {['infinite', '1', '2', '3', '5'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* 关键帧列表 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>关键帧</span>
                <button onClick={() => setAnimFrames(prev => [...prev, { pct: 100, props: 'transform: none;' }])} style={{ ...btnStyle, padding: '3px 10px', fontSize: 11 }}>+ 添加帧</button>
              </div>
              {animFrames.map((frame, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: C.yellow, fontSize: 12, fontWeight: 600, minWidth: 36 }}>{frame.pct}%</span>
                  <input type="range" min={0} max={100} value={frame.pct} onChange={e => {
                    setAnimFrames(prev => prev.map((f, idx) => idx === i ? { ...f, pct: parseInt(e.target.value) } : f))
                  }} style={{ width: 80, accentColor: C.accent, cursor: 'pointer' }} />
                  <input value={frame.props} onChange={e => {
                    setAnimFrames(prev => prev.map((f, idx) => idx === i ? { ...f, props: e.target.value } : f))
                  }} style={{ ...inputStyle, flex: 1 }} placeholder="transform: scale(1);" />
                  {animFrames.length > 2 && (
                    <button onClick={() => setAnimFrames(prev => prev.filter((_, idx) => idx !== i))} style={{ ...btnStyle, padding: '2px 6px', fontSize: 10, color: C.red }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}><CopyBtn text={`${animKeyframesCSS}\n\n.${animName}-element {\n  ${animUsageCSS}\n}`} id="anim" /></div>
              <pre style={codeBlockStyle}>{`${animKeyframesCSS}\n\n.${animName}-element {\n  ${animUsageCSS}\n}`}</pre>
            </div>
          </>
        )}

        {/* ── 颜色转换 ── */}
        {tab === 'color' && (
          <>
            {/* 预览色块 */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 4 }}>
              <div style={{ flex: 1, height: 80, borderRadius: 10, background: hexVal, border: `1px solid ${C.border}` }} />
              <div style={{ flex: 1, height: 80, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* HSL 色相条 */}
                <div style={{ flex: 1, background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))' }} />
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={rowStyle}>
                <span style={labelStyle}>HEX</span>
                <input type="color" value={hexVal} onChange={e => setHexVal(e.target.value)}
                  style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                <input value={hexVal} onChange={e => setHexVal(e.target.value)} style={{ ...inputStyle, width: 90, fontFamily: C.mono }} />
              </div>

              {colorConv && (
                <>
                  <div style={rowStyle}>
                    <span style={labelStyle}>RGB</span>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {['r', 'g', 'b'].map((ch, i) => {
                        const val = [colorConv.rgb.r, colorConv.rgb.g, colorConv.rgb.b][i]
                        return (
                          <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <span style={{ color: C.textMuted, fontSize: 11 }}>{ch}</span>
                            <input type="range" min={0} max={255} value={val}
                              onChange={e => {
                                const rgb = { ...colorConv.rgb, [ch]: parseInt(e.target.value) }
                                setHexVal(rgbToHex(rgb.r, rgb.g, rgb.b))
                              }}
                              style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }} />
                            <span style={{ color: C.text, fontSize: 11, minWidth: 24 }}>{val}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={rowStyle}>
                    <span style={labelStyle}>HSL</span>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {(['h', 's', 'l'] as const).map((ch, i) => {
                        const val = [colorConv.hsl.h, colorConv.hsl.s, colorConv.hsl.l][i]
                        const max = [360, 100, 100][i]
                        const unit = ['°', '%', '%'][i]
                        return (
                          <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <span style={{ color: C.textMuted, fontSize: 11 }}>{ch}</span>
                            <input type="range" min={0} max={max} value={val}
                              onChange={e => {
                                const hsl = { ...colorConv.hsl, [ch]: parseInt(e.target.value) }
                                const rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
                                setHexVal(rgbToHex(rgb.r, rgb.g, rgb.b))
                              }}
                              style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }} />
                            <span style={{ color: C.text, fontSize: 11, minWidth: 30 }}>{val}{unit}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {colorConv && (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
                  <CopyBtn text={`${hexVal}\nrgb(${colorConv.rgb.r}, ${colorConv.rgb.g}, ${colorConv.rgb.b})\nhsl(${colorConv.hsl.h}, ${colorConv.hsl.s}%, ${colorConv.hsl.l}%)`} id="color" />
                </div>
                <pre style={codeBlockStyle}>{[
                  `hex: ${colorConv.hex}`,
                  `rgb: rgb(${colorConv.rgb.r}, ${colorConv.rgb.g}, ${colorConv.rgb.b})`,
                  `hsl: hsl(${colorConv.hsl.h}, ${colorConv.hsl.s}%, ${colorConv.hsl.l}%)`,
                ].join('\n')}</pre>
              </div>
            )}
          </>
        )}

        {/* ── Flexbox 布局 ── */}
        {tab === 'flex' && (
          <>
            {/* 预览 */}
            <div style={{
              padding: 12, background: '#1a1a2e', borderRadius: 10, border: `1px solid ${C.border}`,
              display: 'flex', flexDirection: flexDir as React.CSSProperties['flexDirection'],
              flexWrap: flexWrap as React.CSSProperties['flexWrap'],
              justifyContent: justifyContent as React.CSSProperties['justifyContent'],
              alignItems: alignItems as React.CSSProperties['alignItems'],
              gap: flexGap, minHeight: 120,
            }}>
              {flexItems.map((item, i) => (
                <div key={i} style={{
                  width: item.w, height: item.h,
                  background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)`,
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  flexGrow: item.grow, flexShrink: item.shrink,
                  flexBasis: item.basis as React.CSSProperties['flexBasis'],
                }}>
                  {item.label}
                </div>
              ))}
            </div>

            {/* 容器属性 */}
            <div style={sectionStyle}>
              <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>容器属性</span>
              <div style={rowStyle}>
                <span style={labelStyle}>方向</span>
                <select value={flexDir} onChange={e => setFlexDir(e.target.value)} style={inputStyle}>
                  {['row', 'row-reverse', 'column', 'column-reverse'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>换行</span>
                <select value={flexWrap} onChange={e => setFlexWrap(e.target.value)} style={inputStyle}>
                  {['nowrap', 'wrap', 'wrap-reverse'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>主轴</span>
                <select value={justifyContent} onChange={e => setJustifyContent(e.target.value)} style={inputStyle}>
                  {['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>交叉轴</span>
                <select value={alignItems} onChange={e => setAlignItems(e.target.value)} style={inputStyle}>
                  {['stretch', 'flex-start', 'center', 'flex-end', 'baseline'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>间距</span>
                <Slider value={flexGap} min={0} max={40} onChange={setFlexGap} unit="px" />
              </div>
            </div>

            {/* 子项 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>子项属性</span>
                <button onClick={() => setFlexItems(prev => [...prev, { label: String.fromCharCode(65 + prev.length), grow: 0, shrink: 1, basis: 'auto', w: 60, h: 60 }])}
                  style={{ ...btnStyle, padding: '3px 10px', fontSize: 11 }}>+ 添加</button>
              </div>
              {flexItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ color: C.accentLight, fontSize: 13, fontWeight: 700, minWidth: 20 }}>{item.label}</span>
                  <span style={{ color: C.textMuted, fontSize: 10 }}>grow</span>
                  <input type="number" min={0} max={10} value={item.grow} onChange={e => setFlexItems(prev => prev.map((it, idx) => idx === i ? { ...it, grow: parseInt(e.target.value) || 0 } : it))}
                    style={{ ...inputStyle, width: 40, padding: '2px 4px' }} />
                  <span style={{ color: C.textMuted, fontSize: 10 }}>shrink</span>
                  <input type="number" min={0} max={10} value={item.shrink} onChange={e => setFlexItems(prev => prev.map((it, idx) => idx === i ? { ...it, shrink: parseInt(e.target.value) || 0 } : it))}
                    style={{ ...inputStyle, width: 40, padding: '2px 4px' }} />
                  <span style={{ color: C.textMuted, fontSize: 10 }}>W</span>
                  <input type="number" min={20} max={200} value={item.w} onChange={e => setFlexItems(prev => prev.map((it, idx) => idx === i ? { ...it, w: parseInt(e.target.value) || 40 } : it))}
                    style={{ ...inputStyle, width: 44, padding: '2px 4px' }} />
                  <span style={{ color: C.textMuted, fontSize: 10 }}>H</span>
                  <input type="number" min={20} max={200} value={item.h} onChange={e => setFlexItems(prev => prev.map((it, idx) => idx === i ? { ...it, h: parseInt(e.target.value) || 40 } : it))}
                    style={{ ...inputStyle, width: 44, padding: '2px 4px' }} />
                  {flexItems.length > 1 && (
                    <button onClick={() => setFlexItems(prev => prev.filter((_, idx) => idx !== i))} style={{ ...btnStyle, padding: '2px 6px', fontSize: 10, color: C.red }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}><CopyBtn text={flexContainerCSS} id="flex" /></div>
              <pre style={codeBlockStyle}>{`.flex-container {\n  ${flexContainerCSS.split('\n').join('\n  ')}\n}`}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
