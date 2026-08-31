import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Palette, Pipette, Accessibility, Code2, Blend,
  History, Copy, Check, RotateCcw, ChevronDown, Info
} from 'lucide-react'

// ─── 颜色算法工具函数 ───

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
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
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
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
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

// ─── WCAG 对比度 ───

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
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

function wcagLevel(ratio: number) {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  }
}

// ─── 调色板生成 ───

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'splitComplementary'

function generateHarmony(hex: string, type: HarmonyType, steps: number = 5): string[] {
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const result: string[] = []

  switch (type) {
    case 'complementary': {
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1)
        const mixH = h + t * 180
        result.push(hslToHex(mixH % 360, s, l))
      }
      break
    }
    case 'analogous': {
      const spread = 30
      for (let i = 0; i < steps; i++) {
        const offset = ((i / (steps - 1)) - 0.5) * spread * 2
        result.push(hslToHex((h + offset + 360) % 360, s, l))
      }
      break
    }
    case 'triadic': {
      for (let i = 0; i < steps; i++) {
        const baseHue = (h + (i * 120)) % 360
        const shade = l + ((i % 2 === 0 ? -1 : 1) * 5)
        result.push(hslToHex(baseHue, s, Math.max(10, Math.min(90, shade))))
      }
      break
    }
    case 'splitComplementary': {
      const angles = [0, 150, 210]
      for (let i = 0; i < steps; i++) {
        const angle = angles[i % angles.length]
        const shade = l + (Math.floor(i / angles.length) * 8 - 4)
        result.push(hslToHex((h + angle) % 360, s, Math.max(10, Math.min(90, shade))))
      }
      break
    }
  }
  return result
}

// ─── 验证 HEX ───

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

function normalizeHex(input: string): string {
  let v = input.trim()
  if (!v.startsWith('#')) v = '#' + v
  if (v.length === 4) {
    v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]
  }
  return v.toUpperCase()
}

// ─── 共享样式 ───

const sectionStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#6c7086', fontWeight: 500, minWidth: 32,
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: '#181825', border: '1px solid #313244',
  borderRadius: 6, padding: '6px 10px', color: '#cdd6f4',
  fontSize: 13, fontFamily: 'monospace', outline: 'none',
}

// ─── 标签页类型 ───

type TabKey = 'palette' | 'converter' | 'contrast' | 'picker' | 'export' | 'gradient'

// ─── 主组件 ───

export default function ColorToolkit() {
  const [activeTab, setActiveTab] = useState<TabKey>('palette')
  const [primaryColor, setPrimaryColor] = useState('#5B8DEF')
  const [colorHistory, setColorHistory] = useState<string[]>([
    '#5B8DEF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
  ])
  const [copiedItem, setCopiedItem] = useState('')

  const addToHistory = useCallback((hex: string) => {
    const normalized = normalizeHex(hex)
    if (!isValidHex(normalized)) return
    setColorHistory((prev) =>
      [normalized, ...prev.filter((c) => c !== normalized)].slice(0, 20)
    )
  }, [])

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItem(label)
      setTimeout(() => setCopiedItem(''), 1500)
    }).catch(() => {})
  }, [])

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'palette', label: '调色板', icon: <Palette size={15} /> },
    { key: 'converter', label: '颜色转换', icon: <RotateCcw size={15} /> },
    { key: 'contrast', label: '对比度', icon: <Accessibility size={15} /> },
    { key: 'picker', label: '拾色器', icon: <Pipette size={15} /> },
    { key: 'export', label: 'CSS 导出', icon: <Code2 size={15} /> },
    { key: 'gradient', label: '渐变', icon: <Blend size={15} /> },
  ]

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      {/* 标题栏 */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #313244',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Palette size={18} style={{ color: '#89b4fa' }} />
        <span style={{ fontSize: 15, fontWeight: 600 }}>颜色工具箱</span>
        <span style={{ fontSize: 11, color: '#6c7086', marginLeft: 4 }}>
          综合色彩工具集
        </span>
      </div>

      {/* 标签页 */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #313244', background: '#181825',
        overflowX: 'auto', flexShrink: 0,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? '#1e1e2e' : 'transparent',
              color: activeTab === tab.key ? '#89b4fa' : '#6c7086',
              fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400,
              borderBottom: activeTab === tab.key ? '2px solid #89b4fa' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {activeTab === 'palette' && (
          <PalettePanel
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            addToHistory={addToHistory}
            copyToClipboard={copyToClipboard}
            copiedItem={copiedItem}
          />
        )}
        {activeTab === 'converter' && (
          <ConverterPanel
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            addToHistory={addToHistory}
          />
        )}
        {activeTab === 'contrast' && (
          <ContrastPanel
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
          />
        )}
        {activeTab === 'picker' && (
          <PickerPanel
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            addToHistory={addToHistory}
          />
        )}
        {activeTab === 'export' && (
          <ExportPanel
            colorHistory={colorHistory}
            copyToClipboard={copyToClipboard}
            copiedItem={copiedItem}
          />
        )}
        {activeTab === 'gradient' && (
          <GradientPanel
            primaryColor={primaryColor}
            copyToClipboard={copyToClipboard}
            copiedItem={copiedItem}
          />
        )}
      </div>

      {/* 底部颜色历史 */}
      <ColorHistoryBar
        colorHistory={colorHistory}
        setPrimaryColor={setPrimaryColor}
        setActiveTab={setActiveTab}
        copyToClipboard={copyToClipboard}
        copiedItem={copiedItem}
      />
    </div>
  )
}

// ─── 颜色输入组件 ───

function ColorInput({
  label, value, onChange, style,
}: {
  label: string; value: string; onChange: (v: string) => void; style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <label style={{ fontSize: 11, color: '#6c7086', fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 32, height: 32, border: '1px solid #45475a',
            borderRadius: 6, cursor: 'pointer', background: 'transparent', padding: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = normalizeHex(e.target.value)
            if (isValidHex(v)) onChange(v)
          }}
          style={{
            flex: 1, background: '#181825', border: '1px solid #313244',
            borderRadius: 6, padding: '6px 10px', color: '#cdd6f4',
            fontSize: 13, fontFamily: 'monospace', outline: 'none', width: 90,
          }}
        />
      </div>
    </div>
  )
}

// ─── 调色板面板 ───

function PalettePanel({
  primaryColor, setPrimaryColor, addToHistory, copyToClipboard, copiedItem,
}: {
  primaryColor: string
  setPrimaryColor: (c: string) => void
  addToHistory: (c: string) => void
  copyToClipboard: (t: string, l: string) => void
  copiedItem: string
}) {
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary')
  const [steps, setSteps] = useState(5)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const palette = useMemo(
    () => generateHarmony(primaryColor, harmonyType, steps),
    [primaryColor, harmonyType, steps]
  )

  const harmonyOptions: { value: HarmonyType; label: string }[] = [
    { value: 'complementary', label: '互补色' },
    { value: 'analogous', label: '类似色' },
    { value: 'triadic', label: '三色组' },
    { value: 'splitComplementary', label: '分裂互补' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <ColorInput label="主色" value={primaryColor} onChange={setPrimaryColor} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6c7086', fontWeight: 500 }}>和谐类型</label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: '#181825', border: '1px solid #313244', borderRadius: 6,
                padding: '7px 12px', color: '#cdd6f4', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, minWidth: 120,
              }}
            >
              {harmonyOptions.find((o) => o.value === harmonyType)?.label}
              <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 100,
                background: '#313244', border: '1px solid #45475a', borderRadius: 6,
                overflow: 'hidden', minWidth: 130, marginTop: 2,
              }}>
                {harmonyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setHarmonyType(opt.value); setDropdownOpen(false) }}
                    style={{
                      display: 'block', width: '100%', padding: '7px 12px',
                      background: harmonyType === opt.value ? '#45475a' : 'transparent',
                      border: 'none', color: '#cdd6f4', fontSize: 12,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6c7086', fontWeight: 500 }}>色数: {steps}</label>
          <input
            type="range" min={3} max={10} value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            style={{ width: 120, accentColor: '#89b4fa' }}
          />
        </div>
      </div>

      {/* 调色板条 */}
      <div style={{
        display: 'flex', borderRadius: 10, overflow: 'hidden', height: 100,
        border: '1px solid #313244',
      }}>
        {palette.map((c, i) => (
          <div
            key={i}
            onClick={() => { addToHistory(c); copyToClipboard(c, 'pal-' + i) }}
            style={{
              flex: 1, background: c, cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: 6, transition: 'flex 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.flex = '1.5' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.flex = '1' }}
          >
            <span style={{
              fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
              color: rgbToHsl(...hexToRgb(c))[2] > 55 ? '#1e1e2e' : '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}>
              {copiedItem === 'pal-' + i ? <Check size={12} /> : c}
            </span>
          </div>
        ))}
      </div>

      {/* 详细色卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {palette.map((c, i) => {
          const [cr, cg, cb] = hexToRgb(c)
          const [ch, cs, cl] = rgbToHsl(cr, cg, cb)
          return (
            <div
              key={i}
              onClick={() => { addToHistory(c); copyToClipboard(c, 'card-' + i) }}
              style={{
                background: '#181825', border: '1px solid #313244', borderRadius: 8,
                overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#45475a' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#313244' }}
            >
              <div style={{ height: 50, background: c }} />
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>{c}</div>
                <div style={{ fontSize: 10, color: '#6c7086', marginTop: 2 }}>
                  RGB({cr}, {cg}, {cb})
                </div>
                <div style={{ fontSize: 10, color: '#6c7086' }}>
                  HSL({ch}°, {cs}%, {cl}%)
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 颜色转换面板 ───

function ConverterPanel({
  primaryColor, setPrimaryColor, addToHistory,
}: {
  primaryColor: string; setPrimaryColor: (c: string) => void; addToHistory: (c: string) => void
}) {
  const [r, g, b] = hexToRgb(primaryColor)
  const [h, s, l] = rgbToHsl(r, g, b)

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: string) => {
    const num = Math.max(0, Math.min(255, parseInt(val) || 0))
    const nr = channel === 'r' ? num : r
    const ng = channel === 'g' ? num : g
    const nb = channel === 'b' ? num : b
    setPrimaryColor(rgbToHex(nr, ng, nb))
  }

  const handleHslChange = (channel: 'h' | 's' | 'l', val: string) => {
    const max = channel === 'h' ? 360 : 100
    const num = Math.max(0, Math.min(max, parseInt(val) || 0))
    const nh = channel === 'h' ? num : h
    const ns = channel === 's' ? num : s
    const nl = channel === 'l' ? num : l
    setPrimaryColor(hslToHex(nh, ns, nl))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 大色块预览 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{
          width: 140, height: 140, borderRadius: 12, background: primaryColor,
          border: '1px solid #313244', display: 'flex', alignItems: 'flex-end',
          padding: 10, flexShrink: 0,
        }}>
          <span style={{
            fontSize: 14, fontFamily: 'monospace', fontWeight: 700,
            color: l > 55 ? '#1e1e2e' : '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}>
            {primaryColor}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={sectionStyle}>
            <span style={labelStyle}>HEX</span>
            <input
              value={primaryColor}
              onChange={(e) => {
                const v = normalizeHex(e.target.value)
                if (isValidHex(v)) setPrimaryColor(v)
              }}
              onBlur={() => addToHistory(primaryColor)}
              style={inputStyle}
            />
          </div>

          <div style={sectionStyle}>
            <span style={labelStyle}>RGB</span>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {(['r', 'g', 'b'] as const).map((ch, idx) => (
                <input
                  key={ch}
                  type="number" min={0} max={255}
                  value={[r, g, b][idx]}
                  onChange={(e) => handleRgbChange(ch, e.target.value)}
                  onBlur={() => addToHistory(primaryColor)}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder={ch.toUpperCase()}
                />
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <span style={labelStyle}>HSL</span>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {(['h', 's', 'l'] as const).map((ch, idx) => (
                <input
                  key={ch}
                  type="number" min={0} max={ch === 'h' ? 360 : 100}
                  value={[h, s, l][idx]}
                  onChange={(e) => handleHslChange(ch, e.target.value)}
                  onBlur={() => addToHistory(primaryColor)}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder={ch.toUpperCase()}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HSL 色相滑块 */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>色相选择</label>
        <div style={{
          height: 20, borderRadius: 10,
          background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          position: 'relative', cursor: 'pointer',
        }}>
          <input
            type="range" min={0} max={360} value={h}
            onChange={(e) => setPrimaryColor(hslToHex(Number(e.target.value), s, l))}
            onMouseUp={() => addToHistory(primaryColor)}
            style={{
              width: '100%', height: 20, opacity: 0, cursor: 'pointer',
              position: 'absolute', top: 0, left: 0,
            }}
          />
          <div style={{
            position: 'absolute', top: -4,
            left: `${(h / 360) * 100}%`, transform: 'translateX(-50%)',
            width: 16, height: 28, borderRadius: 8,
            border: '2px solid #fff', background: primaryColor,
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }} />
        </div>
      </div>

      {/* 格式化输出 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {[
          { label: 'CSS HEX', value: primaryColor },
          { label: 'CSS RGB', value: `rgb(${r}, ${g}, ${b})` },
          { label: 'CSS HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
          { label: '无 # HEX', value: primaryColor.replace('#', '') },
        ].map((item) => (
          <div key={item.label}
            onClick={() => navigator.clipboard.writeText(item.value)}
            style={{
              background: '#181825', border: '1px solid #313244', borderRadius: 8,
              padding: '8px 12px', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 10, color: '#6c7086', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 对比度检查面板 ───

function ContrastPanel({
  primaryColor, setPrimaryColor,
}: {
  primaryColor: string; setPrimaryColor: (c: string) => void
}) {
  const [fg, setFg] = useState('#FFFFFF')
  const [bg, setBg] = useState(primaryColor)

  useEffect(() => { setBg(primaryColor) }, [primaryColor])

  const ratio = contrastRatio(fg, bg)
  const levels = wcagLevel(ratio)

  const Badge = ({ pass, label }: { pass: boolean; label: string }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
      background: pass ? 'rgba(166,227,161,0.15)' : 'rgba(243,139,168,0.15)',
      color: pass ? '#a6e3a1' : '#f38ba8',
    }}>
      {pass
        ? <Check size={13} />
        : <span style={{ width: 13, height: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✗</span>
      }
      {label}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <ColorInput label="前景色" value={fg} onChange={(v) => { setFg(v); setPrimaryColor(v) }} />
        <ColorInput label="背景色" value={bg} onChange={setBg} />
        <button
          onClick={() => { const tmp = fg; setFg(bg); setBg(tmp) }}
          style={{
            background: '#313244', border: '1px solid #45475a',
            borderRadius: 6, padding: '7px 14px', color: '#cdd6f4', fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <RotateCcw size={13} />
          互换
        </button>
      </div>

      {/* 预览 */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #313244' }}>
        <div style={{ background: bg, padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ color: fg, fontSize: 28, fontWeight: 700 }}>大号文本预览 Aa</span>
          <span style={{ color: fg, fontSize: 16 }}>
            普通文本：The quick brown fox jumps over the lazy dog.
          </span>
          <span style={{ color: fg, fontSize: 12 }}>小号文本：0123456789 ABCDEFG abcdefg</span>
        </div>
      </div>

      {/* 对比度数值 */}
      <div style={{
        background: '#181825', border: '1px solid #313244', borderRadius: 12,
        padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{
            fontSize: 36, fontWeight: 800,
            color: ratio >= 7 ? '#a6e3a1' : ratio >= 4.5 ? '#f9e2af' : '#f38ba8',
          }}>
            {ratio.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: '#6c7086', marginTop: 2 }}>对比度</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge pass={levels.aaNormal} label="AA 普通文本" />
            <Badge pass={levels.aaLarge} label="AA 大号文本" />
            <Badge pass={levels.aaaNormal} label="AAA 普通文本" />
            <Badge pass={levels.aaaLarge} label="AAA 大号文本" />
          </div>
          <div style={{ fontSize: 11, color: '#6c7086', marginTop: 4 }}>
            <Info size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
            WCAG 2.1：普通文本 AA ≥ 4.5:1，AAA ≥ 7:1；大号文本 AA ≥ 3:1，AAA ≥ 4.5:1
          </div>
        </div>
      </div>

      {/* 快捷背景色 */}
      <div>
        <div style={{ ...labelStyle, marginBottom: 8 }}>快捷背景色</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['#FFFFFF', '#F5F5F5', '#1e1e2e', '#000000', '#181825', '#f38ba8', '#a6e3a1', '#89b4fa'].map((c) => (
            <div
              key={c}
              onClick={() => setBg(c)}
              style={{
                width: 32, height: 32, borderRadius: 6, background: c, cursor: 'pointer',
                border: bg === c ? '2px solid #89b4fa' : '1px solid #45475a',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 拾色器面板 ───

function PickerPanel({
  primaryColor, setPrimaryColor, addToHistory,
}: {
  primaryColor: string; setPrimaryColor: (c: string) => void; addToHistory: (c: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hue, setHue] = useState(220)
  const [pointerPos, setPointerPos] = useState({ x: 75, y: 43 })

  useEffect(() => {
    const [ch] = hexToHsl(primaryColor)
    setHue(ch)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const ht = canvas.height

    // 饱和度-亮度面板
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < ht; y++) {
        const s = (x / w) * 100
        const l = 100 - (y / ht) * 100
        ctx.fillStyle = hslToHex(hue, s, l)
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }, [hue])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const sx = (x / rect.width) * 100
    const ly = 100 - (y / rect.height) * 100
    setPointerPos({ x, y })
    const newColor = hslToHex(hue, Math.round(sx), Math.round(ly))
    setPrimaryColor(newColor)
  }

  const handleCanvasDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) handleCanvasClick(e)
  }

  const [h, s, l] = hexToHsl(primaryColor)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 色板 */}
        <div>
          <canvas
            ref={canvasRef}
            width={280}
            height={200}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasDrag}
            style={{
              borderRadius: 8, cursor: 'crosshair', border: '1px solid #313244',
              display: 'block',
            }}
          />
          {/* 指示点 */}
          <div style={{
            position: 'relative', width: 280, height: 0,
          }}>
            <div style={{
              position: 'absolute', left: pointerPos.x - 7, top: -200 + pointerPos.y - 7,
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid #fff', background: primaryColor,
              boxShadow: '0 1px 4px rgba(0,0,0,0.5)', pointerEvents: 'none',
            }} />
          </div>

          {/* 色相条 */}
          <div style={{
            height: 20, borderRadius: 10, marginTop: 12,
            background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            position: 'relative', cursor: 'pointer', border: '1px solid #313244',
          }}>
            <input
              type="range" min={0} max={360} value={hue}
              onChange={(e) => {
                const newH = Number(e.target.value)
                setHue(newH)
                const newColor = hslToHex(newH, s, l)
                setPrimaryColor(newColor)
              }}
              onMouseUp={() => addToHistory(primaryColor)}
              style={{
                width: '100%', height: 20, opacity: 0, cursor: 'pointer',
                position: 'absolute', top: 0, left: 0,
              }}
            />
            <div style={{
              position: 'absolute', top: -3,
              left: `${(hue / 360) * 100}%`, transform: 'translateX(-50%)',
              width: 14, height: 26, borderRadius: 7,
              border: '2px solid #fff', background: hslToHex(hue, 100, 50),
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }} />
          </div>

          {/* 亮度滑块 */}
          <div style={{
            height: 20, borderRadius: 10, marginTop: 8,
            background: `linear-gradient(to right, ${hslToHex(hue, s, 0)}, ${hslToHex(hue, s, 50)}, ${hslToHex(hue, s, 100)})`,
            position: 'relative', cursor: 'pointer', border: '1px solid #313244',
          }}>
            <input
              type="range" min={0} max={100} value={l}
              onChange={(e) => {
                const newL = Number(e.target.value)
                const newColor = hslToHex(hue, s, newL)
                setPrimaryColor(newColor)
              }}
              onMouseUp={() => addToHistory(primaryColor)}
              style={{
                width: '100%', height: 20, opacity: 0, cursor: 'pointer',
                position: 'absolute', top: 0, left: 0,
              }}
            />
            <div style={{
              position: 'absolute', top: -3,
              left: `${l}%`, transform: 'translateX(-50%)',
              width: 14, height: 26, borderRadius: 7,
              border: '2px solid #fff', background: primaryColor,
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }} />
          </div>
        </div>

        {/* 颜色信息 */}
        <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            width: 120, height: 120, borderRadius: 12, background: primaryColor,
            border: '1px solid #313244', display: 'flex', alignItems: 'flex-end', padding: 8,
          }}>
            <span style={{
              fontSize: 13, fontFamily: 'monospace', fontWeight: 700,
              color: l > 55 ? '#1e1e2e' : '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>
              {primaryColor}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'HEX', value: primaryColor },
              { label: 'RGB', value: `rgb(${hexToRgb(primaryColor).join(', ')})` },
              { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
            ].map((item) => (
              <div key={item.label} style={{
                background: '#181825', border: '1px solid #313244', borderRadius: 6,
                padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: '#6c7086' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* 预设色 */}
          <div>
            <div style={{ fontSize: 11, color: '#6c7086', marginBottom: 6 }}>预设色</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89b4fa', '#b4befe', '#cba6f7',
                '#f5c2e7', '#eba0ac', '#74c7ec', '#89dceb'].map((c) => (
                <div
                  key={c}
                  onClick={() => { setPrimaryColor(c); addToHistory(c) }}
                  style={{
                    width: 22, height: 22, borderRadius: 4, background: c, cursor: 'pointer',
                    border: primaryColor === c ? '2px solid #fff' : '1px solid #45475a',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CSS 变量导出面板 ───

function ExportPanel({
  colorHistory, copyToClipboard, copiedItem,
}: {
  colorHistory: string[]
  copyToClipboard: (t: string, l: string) => void
  copiedItem: string
}) {
  const [selectedColors, setSelectedColors] = useState<string[]>(colorHistory.slice(0, 8))
  const [prefix, setPrefix] = useState('color')

  useEffect(() => {
    setSelectedColors(colorHistory.slice(0, 8))
  }, [colorHistory])

  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const cssCode = useMemo(() => {
    const lines = selectedColors.map((c, i) => {
      const [r, g, b] = hexToRgb(c)
      return `  --${prefix}-${i + 1}: ${c}; /* rgb(${r}, ${g}, ${b}) */`
    })
    return `:root {\n${lines.join('\n')}\n}`
  }, [selectedColors, prefix])

  const scssCode = useMemo(() => {
    return selectedColors
      .map((c, i) => `$${prefix}-${i + 1}: ${c};`)
      .join('\n')
  }, [selectedColors, prefix])

  const tailwindCode = useMemo(() => {
    const entries = selectedColors.map((c, i) => {
      return `      '${prefix}-${i + 1}': '${c}',`
    })
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries.join('\n')}\n      }\n    }\n  }\n}`
  }, [selectedColors, prefix])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6c7086', fontWeight: 500 }}>变量前缀</label>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
            style={{
              ...inputStyle, width: 140,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#6c7086', paddingBottom: 8 }}>
          已选 {selectedColors.length} 种颜色
        </div>
      </div>

      {/* 可选颜色 */}
      <div style={{
        background: '#181825', border: '1px solid #313244', borderRadius: 10,
        padding: 12,
      }}>
        <div style={{ fontSize: 11, color: '#6c7086', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <History size={12} />
          点击选择/取消颜色
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {colorHistory.map((c) => (
            <div
              key={c}
              onClick={() => toggleColor(c)}
              style={{
                width: 36, height: 36, borderRadius: 8, background: c, cursor: 'pointer',
                border: selectedColors.includes(c) ? '2px solid #89b4fa' : '1px solid #45475a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border 0.15s',
              }}
            >
              {selectedColors.includes(c) && <Check size={14} style={{ color: rgbToHsl(...hexToRgb(c))[2] > 55 ? '#1e1e2e' : '#fff' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* 代码输出 */}
      {[
        { label: 'CSS 变量', code: cssCode, copyKey: 'css-var' },
        { label: 'SCSS 变量', code: scssCode, copyKey: 'scss' },
        { label: 'Tailwind 配置', code: tailwindCode, copyKey: 'tailwind' },
      ].map((item) => (
        <div key={item.copyKey}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a6adc8' }}>{item.label}</span>
            <button
              onClick={() => copyToClipboard(item.code, item.copyKey)}
              style={{
                background: '#313244', border: '1px solid #45475a', borderRadius: 5,
                padding: '3px 10px', color: '#cdd6f4', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {copiedItem === item.copyKey ? <Check size={12} /> : <Copy size={12} />}
              {copiedItem === item.copyKey ? '已复制' : '复制'}
            </button>
          </div>
          <pre style={{
            background: '#181825', border: '1px solid #313244', borderRadius: 8,
            padding: 14, fontSize: 12, fontFamily: 'monospace', color: '#a6e3a1',
            overflow: 'auto', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {item.code}
          </pre>
        </div>
      ))}
    </div>
  )
}

// ─── 渐变生成器面板 ───

function GradientPanel({
  primaryColor,
  copyToClipboard,
  copiedItem,
}: {
  primaryColor: string
  copyToClipboard: (t: string, l: string) => void
  copiedItem: string
}) {
  const [color1, setColor1] = useState('#5B8DEF')
  const [color2, setColor2] = useState('#FF6B6B')
  const [angle, setAngle] = useState(135)
  const [type, setType] = useState<'linear' | 'radial'>('linear')

  useEffect(() => {
    setColor1(primaryColor)
  }, [primaryColor])

  const gradientCSS = type === 'linear'
    ? `linear-gradient(${angle}deg, ${color1}, ${color2})`
    : `radial-gradient(circle, ${color1}, ${color2})`

  const cssCode = `background: ${gradientCSS};`

  const [c1h, c1s, c1l] = hexToHsl(color1)
  const [c2h, c2s, c2l] = hexToHsl(color2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <ColorInput label="起始色" value={color1} onChange={setColor1} />
        <ColorInput label="终止色" value={color2} onChange={setColor2} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6c7086', fontWeight: 500 }}>类型</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['linear', 'radial'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: '1px solid ' + (type === t ? '#89b4fa' : '#313244'),
                  background: type === t ? 'rgba(137,180,250,0.15)' : '#181825',
                  color: type === t ? '#89b4fa' : '#6c7086',
                }}
              >
                {t === 'linear' ? '线性' : '径向'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 角度控制 */}
      {type === 'linear' && (
        <div>
          <label style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>
            角度: {angle}°
          </label>
          <input
            type="range" min={0} max={360} value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#89b4fa' }}
          />
        </div>
      )}

      {/* 渐变预览 */}
      <div style={{
        height: 160, borderRadius: 12,
        background: gradientCSS,
        border: '1px solid #313244',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 12,
      }}>
        <span style={{
          fontSize: 13, fontFamily: 'monospace', fontWeight: 600,
          color: '#ffffff', textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: 6,
        }}>
          渐变预览
        </span>
      </div>

      {/* 颜色信息 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1, background: '#181825', border: '1px solid #313244', borderRadius: 8,
          padding: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: color1, border: '1px solid #45475a' }} />
          <div>
            <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{color1}</div>
            <div style={{ fontSize: 10, color: '#6c7086' }}>HSL({c1h}°, {c1s}%, {c1l}%)</div>
          </div>
        </div>
        <div style={{
          flex: 1, background: '#181825', border: '1px solid #313244', borderRadius: 8,
          padding: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: color2, border: '1px solid #45475a' }} />
          <div>
            <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{color2}</div>
            <div style={{ fontSize: 10, color: '#6c7086' }}>HSL({c2h}°, {c2s}%, {c2l}%)</div>
          </div>
        </div>
      </div>

      {/* 预设渐变 */}
      <div>
        <div style={{ fontSize: 11, color: '#6c7086', marginBottom: 8 }}>预设渐变</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {[
            { c1: '#667eea', c2: '#764ba2', name: '紫罗兰' },
            { c1: '#f093fb', c2: '#f5576c', name: '粉红' },
            { c1: '#4facfe', c2: '#00f2fe', name: '海洋' },
            { c1: '#43e97b', c2: '#38f9d7', name: '翡翠' },
            { c1: '#fa709a', c2: '#fee140', name: '日落' },
            { c1: '#a18cd1', c2: '#fbc2eb', name: '薰衣草' },
            { c1: '#fccb90', c2: '#d57eeb', name: '糖果' },
            { c1: '#ff9a9e', c2: '#fecfef', name: '玫瑰' },
          ].map((g) => (
            <div
              key={g.name}
              onClick={() => { setColor1(g.c1); setColor2(g.c2) }}
              style={{
                height: 50, borderRadius: 8, cursor: 'pointer',
                background: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: 4, border: '1px solid #45475a',
              }}
            >
              <span style={{
                fontSize: 9, color: '#fff', fontWeight: 600,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}>
                {g.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 代码输出 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#a6adc8' }}>CSS 代码</span>
          <button
            onClick={() => copyToClipboard(cssCode, 'gradient-css')}
            style={{
              background: '#313244', border: '1px solid #45475a', borderRadius: 5,
              padding: '3px 10px', color: '#cdd6f4', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {copiedItem === 'gradient-css' ? <Check size={12} /> : <Copy size={12} />}
            {copiedItem === 'gradient-css' ? '已复制' : '复制'}
          </button>
        </div>
        <pre style={{
          background: '#181825', border: '1px solid #313244', borderRadius: 8,
          padding: 14, fontSize: 12, fontFamily: 'monospace', color: '#a6e3a1',
          overflow: 'auto', margin: 0, lineHeight: 1.6,
        }}>
          {cssCode}
        </pre>
      </div>
    </div>
  )
}

// ─── 底部颜色历史条 ───

function ColorHistoryBar({
  colorHistory, setPrimaryColor, setActiveTab, copyToClipboard, copiedItem,
}: {
  colorHistory: string[]
  setPrimaryColor: (c: string) => void
  setActiveTab: (t: TabKey) => void
  copyToClipboard: (t: string, l: string) => void
  copiedItem: string
}) {
  return (
    <div style={{
      borderTop: '1px solid #313244', padding: '6px 16px',
      display: 'flex', alignItems: 'center', gap: 8, background: '#181825',
      flexShrink: 0,
    }}>
      <History size={12} style={{ color: '#6c7086', flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: '#6c7086', flexShrink: 0 }}>历史</span>
      <div style={{ display: 'flex', gap: 4, overflow: 'auto', flex: 1 }}>
        {colorHistory.map((c, i) => (
          <div
            key={c + i}
            onClick={() => { setPrimaryColor(c); setActiveTab('palette') }}
            onDoubleClick={() => copyToClipboard(c, 'hist-' + i)}
            title={`${c} (单击选用，双击复制)`}
            style={{
              width: 22, height: 22, borderRadius: 4, background: c, cursor: 'pointer',
              border: '1px solid #45475a', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {copiedItem === 'hist-' + i && <Check size={10} style={{ color: '#fff' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}
