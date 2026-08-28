import React, { useState, useCallback, useMemo } from 'react'
import { Eye, Palette, AlertTriangle, Check, X, Download, RotateCcw } from 'lucide-react'

/* ========== 颜色工具函数 ========== */

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

function isValidHex(v: string): boolean {
  return /^#?([0-9a-fA-F]{6})$/.test(v)
}

/* WCAG 2.1 相对亮度计算 */
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

/* ========== 色盲模拟矩阵 ========== */

type CBType =
  | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
  | 'protanomaly' | 'deuteranomaly' | 'tritanomaly' | 'achromatomaly'

const CB_MATRICES: Record<CBType, [number, number, number, number, number, number, number, number, number]> = {
  // 全色盲
  protanopia:    [0.567, 0.433, 0,     0.558, 0.442, 0,     0,     0.242, 0.758],
  deuteranopia:  [0.625, 0.375, 0,     0.7,   0.3,   0,     0,     0.3,   0.7  ],
  tritanopia:    [0.95,  0.05,  0,     0,     0.433, 0.567, 0,     0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
  // 部分色盲
  protanomaly:   [0.817, 0.183, 0,     0.333, 0.667, 0,     0,     0.125, 0.875],
  deuteranomaly: [0.8,   0.2,   0,     0.258, 0.742, 0,     0,     0.142, 0.858],
  tritanomaly:   [0.967, 0.033, 0,     0,     0.733, 0.267, 0,     0.183, 0.817],
  achromatomaly: [0.618, 0.320, 0.062, 0.163, 0.775, 0.062, 0.049, 0.427, 0.524],
}

const CB_LABELS: Record<CBType, string> = {
  protanopia: '红色盲', deuteranopia: '绿色盲', tritanopia: '蓝色盲',
  achromatopsia: '全色盲', protanomaly: '红色弱', deuteranomaly: '绿色弱',
  tritanomaly: '蓝色弱', achromatomaly: '全色弱',
}

function simulateColorBlindness(hex: string, type: CBType): string {
  const [r, g, b] = hexToRgb(hex)
  const m = CB_MATRICES[type]
  const nr = m[0] * r + m[1] * g + m[2] * b
  const ng = m[3] * r + m[4] * g + m[5] * b
  const nb = m[6] * r + m[7] * g + m[8] * b
  return rgbToHex(clamp(Math.round(nr), 0, 255), clamp(Math.round(ng), 0, 255), clamp(Math.round(nb), 0, 255))
}

/* ========== 建议修复 ========== */

function suggestFix(fg: string, _bg: string): { fg: string; bg: string } {
  const ratio = contrastRatio(fg, _bg)
  if (ratio >= 4.5) return { fg, bg: _bg }

  const [fR, fG, fB] = hexToRgb(fg)
  const [bR, bG, bB] = hexToRgb(_bg)

  // 调整前景亮度
  let bestFg = fg
  let bestBg = _bg
  let bestRatio = ratio

  for (let step = 0; step <= 255; step += 3) {
    for (const dir of [-1, 1]) {
      const nr = clamp(fR + step * dir, 0, 255)
      const ng = clamp(fG + step * dir, 0, 255)
      const nb = clamp(fB + step * dir, 0, 255)
      const candidate = rgbToHex(nr, ng, nb)
      const r = contrastRatio(candidate, _bg)
      if (r > bestRatio) {
        bestRatio = r
        bestFg = candidate
      }
    }
  }

  // 调整背景亮度
  for (let step = 0; step <= 255; step += 3) {
    for (const dir of [-1, 1]) {
      const nr = clamp(bR + step * dir, 0, 255)
      const ng = clamp(bG + step * dir, 0, 255)
      const nb = clamp(bB + step * dir, 0, 255)
      const candidate = rgbToHex(nr, ng, nb)
      const r = contrastRatio(fg, candidate)
      if (r > bestRatio) {
        bestRatio = r
        bestBg = candidate
      }
    }
  }

  return { fg: bestFg, bg: bestBg }
}

/* ========== 标签 ========== */

type TabKey = 'contrast' | 'blindness' | 'palette'

const CB_TYPES: CBType[] = [
  'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia',
  'protanomaly', 'deuteranomaly', 'tritanomaly', 'achromatomaly',
]

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'contrast', label: '对比度检测', icon: <Eye size={16} /> },
  { key: 'blindness', label: '色盲模拟', icon: <Palette size={16} /> },
  { key: 'palette', label: '调色板分析', icon: <AlertTriangle size={16} /> },
]

/* ========== 主组件 ========== */

interface Props { onClose: () => void }

const ColorAccessibility = ({ onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<TabKey>('contrast')
  const [fgColor, setFgColor] = useState('#FFFFFF')
  const [bgColor, setBgColor] = useState('#1a1a2e')
  const [fgInput, setFgInput] = useState('#FFFFFF')
  const [bgInput, setBgInput] = useState('#1a1a2e')
  const [palette, setPalette] = useState<string[]>(['#FFFFFF', '#1a1a2e', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'])
  const [paletteInputs, setPaletteInputs] = useState<string[]>(palette)
  const [copied, setCopied] = useState(false)
  const [exportMsg, setExportMsg] = useState(false)

  /* 对比度计算 */
  const ratio = useMemo(() => contrastRatio(fgColor, bgColor), [fgColor, bgColor])

  const wcagResults = useMemo(() => ({
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
    ui: ratio >= 3,
  }), [ratio])

  /* 色盲模拟预览 */
  const cbPreview = useMemo(() =>
    CB_TYPES.map(type => ({
      type,
      label: CB_LABELS[type],
      fg: simulateColorBlindness(fgColor, type),
      bg: simulateColorBlindness(bgColor, type),
      ratio: contrastRatio(
        simulateColorBlindness(fgColor, type),
        simulateColorBlindness(bgColor, type),
      ),
    })),
    [fgColor, bgColor],
  )

  /* 调色板矩阵 */
  const paletteMatrix = useMemo(() => {
    const n = palette.length
    const matrix: { fg: string; bg: string; ratio: number; pass: boolean }[][] = []
    for (let i = 0; i < n; i++) {
      const row: { fg: string; bg: string; ratio: number; pass: boolean }[] = []
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push({ fg: palette[i], bg: palette[j], ratio: 0, pass: false })
        } else {
          const r = contrastRatio(palette[i], palette[j])
          row.push({ fg: palette[i], bg: palette[j], ratio: r, pass: r >= 4.5 })
        }
      }
      matrix.push(row)
    }
    return matrix
  }, [palette])

  const fixSuggestion = useMemo(() => {
    if (ratio >= 4.5) return null
    return suggestFix(fgColor, bgColor)
  }, [fgColor, bgColor, ratio])

  /* 事件处理 */
  const applyFgInput = useCallback(() => {
    if (isValidHex(fgInput)) setFgColor('#' + fgInput.replace('#', '').toLowerCase())
  }, [fgInput])

  const applyBgInput = useCallback(() => {
    if (isValidHex(bgInput)) setBgColor('#' + bgInput.replace('#', '').toLowerCase())
  }, [bgInput])

  const handlePaletteChange = useCallback((idx: number, val: string) => {
    const next = [...paletteInputs]
    next[idx] = val
    setPaletteInputs(next)
  }, [paletteInputs])

  const applyPaletteColor = useCallback((idx: number) => {
    if (isValidHex(paletteInputs[idx])) {
      const next = [...palette]
      next[idx] = '#' + paletteInputs[idx].replace('#', '').toLowerCase()
      setPalette(next)
    }
  }, [paletteInputs, palette])

  const resetColors = useCallback(() => {
    setFgColor('#FFFFFF')
    setBgColor('#1a1a2e')
    setFgInput('#FFFFFF')
    setBgInput('#1a1a2e')
  }, [])

  const copyColor = useCallback((color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const exportResults = useCallback(() => {
    const data = {
      foreground: fgColor,
      background: bgColor,
      contrastRatio: +ratio.toFixed(2),
      wcagResults,
      colorBlindness: cbPreview.map(c => ({
        type: c.type,
        label: c.label,
        simulatedFg: c.fg,
        simulatedBg: c.bg,
        ratio: +c.ratio.toFixed(2),
      })),
      palette: palette.map((c, i) => ({ color: c, index: i })),
      paletteMatrix: paletteMatrix.map((row, i) =>
        row.map((cell, j) => ({ from: palette[i], to: palette[j], ratio: +cell.ratio.toFixed(2), pass: cell.pass }))
      ),
      suggestedFix: fixSuggestion,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'wcag-report.json'; a.click()
    URL.revokeObjectURL(url)
    setExportMsg(true)
    setTimeout(() => setExportMsg(false), 2000)
  }, [fgColor, bgColor, ratio, wcagResults, cbPreview, palette, paletteMatrix, fixSuggestion])

  /* ========== 样式 ========== */

  const S = {
    root: {
      height: '100%', display: 'flex', flexDirection: 'column' as const,
      background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(20px)',
      borderRadius: 16, color: '#e2e8f0', fontFamily: "'Noto Sans SC', sans-serif",
      overflow: 'hidden', userSelect: 'none' as const,
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: '1px solid rgba(139,92,246,0.15)',
      background: 'rgba(139,92,246,0.06)',
    },
    title: { fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa' },
    headerActions: { display: 'flex', gap: 8 },
    iconBtn: {
      width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      transition: 'all 0.2s',
    },
    tabs: {
      display: 'flex', gap: 4, padding: '10px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    tab: (active: boolean) => ({
      padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
      border: 'none', display: 'flex', alignItems: 'center', gap: 6,
      background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
      color: active ? '#a78bfa' : '#64748b',
      transition: 'all 0.2s',
    }),
    body: { flex: 1, overflow: 'auto', padding: '16px 20px' },
    row: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const },
    card: {
      flex: 1, minWidth: 200, borderRadius: 12, padding: 16,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    },
    label: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 },
    colorInput: {
      display: 'flex', alignItems: 'center', gap: 10, marginTop: 6,
    },
    colorPreview: (c: string) => ({
      width: 36, height: 36, borderRadius: 8, border: '2px solid rgba(255,255,255,0.1)',
      background: c, cursor: 'pointer', flexShrink: 0,
    }),
    textInput: {
      flex: 1, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', padding: '0 10px',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none',
    },
    ratioBig: {
      fontSize: 36, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
      textAlign: 'center' as const, margin: '8px 0',
      color: ratio >= 7 ? '#22c55e' : ratio >= 4.5 ? '#f59e0b' : '#ef4444',
    },
    ratioLabel: { textAlign: 'center' as const, fontSize: 12, color: '#64748b' },
    preview: {
      borderRadius: 12, padding: 24, margin: '12px 0', textAlign: 'center' as const,
      background: bgColor, color: fgColor, fontSize: 18, fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.08)',
    },
    badge: (pass: boolean) => ({
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
      borderRadius: 6, fontSize: 12, fontWeight: 600,
      background: pass ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color: pass ? '#22c55e' : '#ef4444',
    }),
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    cbGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 12,
    },
    cbCard: {
      borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
    },
    cbPreview: (bg: string, fg: string) => ({
      borderRadius: 8, padding: '10px 12px', background: bg, color: fg,
      fontSize: 13, fontWeight: 600, marginBottom: 8, textAlign: 'center' as const,
    }),
    matrixCell: (pass: boolean) => ({
      width: '100%', aspectRatio: '1', borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
      background: pass ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
      color: pass ? '#22c55e' : '#ef4444',
    }),
    suggest: {
      marginTop: 14, padding: 14, borderRadius: 10,
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
    },
    suggestTitle: { fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
    chip: (_bg: string) => ({
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 6, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
    }),
    chipDot: (c: string) => ({
      width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.15)',
    }),
    select: {
      height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', padding: '0 8px',
      fontSize: 13, outline: 'none',
    },
    toast: {
      position: 'fixed' as const, bottom: 60, left: '50%', transform: 'translateX(-50%)',
      padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: 'rgba(139,92,246,0.9)', color: '#fff', zIndex: 999,
      boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
    },
  }

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>
          <Eye size={18} /> 颜色无障碍检测
        </div>
        <div style={S.headerActions}>
          <button
            style={S.iconBtn}
            onClick={exportResults}
            title="导出 JSON"
          >
            <Download size={14} />
          </button>
          <button
            style={S.iconBtn}
            onClick={resetColors}
            title="重置"
          >
            <RotateCcw size={14} />
          </button>
          <button
            style={{ ...S.iconBtn, color: '#ef4444' }}
            onClick={onClose}
            title="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={S.body}>
        {/* ====== 对比度检测 ====== */}
        {activeTab === 'contrast' && (
          <div>
            <div style={S.row}>
              {/* 前景色 */}
              <div style={S.card}>
                <div style={S.label}>前景色 (文字)</div>
                <div style={S.colorInput}>
                  <div style={S.colorPreview(fgColor)} onClick={() => copyColor(fgColor)} title="点击复制" />
                  <input
                    style={S.textInput}
                    value={fgInput}
                    onChange={e => setFgInput(e.target.value)}
                    onBlur={applyFgInput}
                    onKeyDown={e => e.key === 'Enter' && applyFgInput()}
                    maxLength={7}
                  />
                </div>
              </div>
              {/* 背景色 */}
              <div style={S.card}>
                <div style={S.label}>背景色</div>
                <div style={S.colorInput}>
                  <div style={S.colorPreview(bgColor)} onClick={() => copyColor(bgColor)} title="点击复制" />
                  <input
                    style={S.textInput}
                    value={bgInput}
                    onChange={e => setBgInput(e.target.value)}
                    onBlur={applyBgInput}
                    onKeyDown={e => e.key === 'Enter' && applyBgInput()}
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* 对比度预览 */}
            <div style={S.preview}>
              预览文字 — The quick brown fox jumps over the lazy dog
            </div>

            {/* 比率 + WCAG */}
            <div style={S.row}>
              <div style={{ ...S.card, flex: '0 0 200px', textAlign: 'center' }}>
                <div style={S.label}>对比度</div>
                <div style={S.ratioBig}>{ratio.toFixed(2)}</div>
                <div style={S.ratioLabel}>: 1</div>
              </div>
              <div style={{ ...S.card, flex: 1 }}>
                <div style={S.label}>WCAG 2.1 合规性</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([
                    ['正常文字 AA', wcagResults.normalAA, '≥ 4.5:1'],
                    ['正常文字 AAA', wcagResults.normalAAA, '≥ 7:1'],
                    ['大文字 AA', wcagResults.largeAA, '≥ 3:1'],
                    ['大文字 AAA', wcagResults.largeAAA, '≥ 4.5:1'],
                    ['UI 组件', wcagResults.ui, '≥ 3:1'],
                  ] as [string, boolean, string][]).map(([label, pass, thresh]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: pass ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                      <span style={S.badge(pass)}>
                        {pass ? <Check size={12} /> : <X size={12} />}
                        {pass ? '通过' : '未通过'} ({thresh})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 建议修复 */}
            {fixSuggestion && (
              <div style={S.suggest}>
                <div style={S.suggestTitle}>
                  <AlertTriangle size={14} /> 建议调整 — 达到 AA 标准
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>调整前景</div>
                    <div
                      style={S.chip(fixSuggestion.fg)}
                      onClick={() => { setFgColor(fixSuggestion.fg); setFgInput(fixSuggestion.fg); copyColor(fixSuggestion.fg) }}
                    >
                      <span style={S.chipDot(fixSuggestion.fg)} />
                      {fixSuggestion.fg}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>调整背景</div>
                    <div
                      style={S.chip(fixSuggestion.bg)}
                      onClick={() => { setBgColor(fixSuggestion.bg); setBgInput(fixSuggestion.bg); copyColor(fixSuggestion.bg) }}
                    >
                      <span style={S.chipDot(fixSuggestion.bg)} />
                      {fixSuggestion.bg}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== 色盲模拟 ====== */}
        {activeTab === 'blindness' && (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>当前前景/背景：</span>
              <span style={S.chip(fgColor)} onClick={() => copyColor(fgColor)}>
                <span style={S.chipDot(fgColor)} /> {fgColor}
              </span>
              <span style={{ color: '#475569' }}>/</span>
              <span style={S.chip(bgColor)} onClick={() => copyColor(bgColor)}>
                <span style={S.chipDot(bgColor)} /> {bgColor}
              </span>
            </div>
            <div style={S.cbGrid}>
              {cbPreview.map(cb => (
                <div key={cb.type} style={S.cbCard}>
                  <div style={S.cbPreview(cb.bg, cb.fg)}>
                    示例文字 Abc
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{cb.label}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{cb.type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: cb.ratio >= 4.5 ? '#22c55e' : cb.ratio >= 3 ? '#f59e0b' : '#ef4444' }}>
                        {cb.ratio.toFixed(2)}:1
                      </div>
                      <span style={S.badge(cb.ratio >= 4.5)}>
                        {cb.ratio >= 4.5 ? <Check size={10} /> : <X size={10} />}
                        {cb.ratio >= 4.5 ? 'AA 通过' : 'AA 未通过'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== 调色板分析 ====== */}
        {activeTab === 'palette' && (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>调色板（点击色块复制）：</span>
              {palette.map((c, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                  onClick={() => copyColor(c)}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                  <input
                    style={{ width: 72, height: 24, borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: '0 4px', outline: 'none' }}
                    value={paletteInputs[i]}
                    onChange={e => handlePaletteChange(i, e.target.value)}
                    onBlur={() => applyPaletteColor(i)}
                    onKeyDown={e => e.key === 'Enter' && applyPaletteColor(i)}
                    maxLength={7}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>

            {/* 对比度矩阵 */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${palette.length + 1}, 60px)`, gap: 4, minWidth: 'fit-content' }}>
                {/* 表头 */}
                <div />
                {palette.map((c, i) => (
                  <div key={`h${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{c}</span>
                  </div>
                ))}
                {/* 矩阵行 */}
                {paletteMatrix.map((row, i) => (
                  <React.Fragment key={`row${i}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: palette[i], border: '1px solid rgba(255,255,255,0.15)' }} />
                    </div>
                    {row.map((cell, j) => (
                      <div
                        key={`c${i}${j}`}
                        style={S.matrixCell(cell.pass)}
                        title={i === j ? '自身' : `${cell.fg} / ${cell.bg}: ${cell.ratio.toFixed(2)}:1`}
                      >
                        {i === j ? '—' : cell.ratio.toFixed(1)}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 不通过的配对建议 */}
            {paletteMatrix.some((row, i) => row.some((cell, j) => i !== j && !cell.pass)) && (
              <div style={{ marginTop: 16 }}>
                <div style={S.label}>未通过 AA 的配对 — 修复建议</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paletteMatrix.flatMap((row, i) =>
                    row.filter((cell, j) => i !== j && !cell.pass).map((cell, k) => {
                      const fix = suggestFix(cell.fg, cell.bg)
                      return (
                        <div key={`${i}-${k}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)', flexWrap: 'wrap' }}>
                          <span style={S.chip(cell.fg)}>
                            <span style={S.chipDot(cell.fg)} /> {cell.fg}
                          </span>
                          <span style={{ color: '#475569', fontSize: 12 }}>↔</span>
                          <span style={S.chip(cell.bg)}>
                            <span style={S.chipDot(cell.bg)} /> {cell.bg}
                          </span>
                          <span style={{ fontSize: 12, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>{cell.ratio.toFixed(2)}:1</span>
                          <span style={{ color: '#64748b', fontSize: 12 }}>→</span>
                          <span
                            style={{ ...S.chip(fix.fg), cursor: 'pointer' }}
                            onClick={() => copyColor(fix.fg)}
                            title="点击复制建议前景"
                          >
                            <span style={S.chipDot(fix.fg)} /> {fix.fg}
                          </span>
                          <span style={{ color: '#64748b', fontSize: 12 }}>/</span>
                          <span
                            style={{ ...S.chip(fix.bg), cursor: 'pointer' }}
                            onClick={() => copyColor(fix.bg)}
                            title="点击复制建议背景"
                          >
                            <span style={S.chipDot(fix.bg)} /> {fix.bg}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      {copied && <div style={S.toast}>已复制到剪贴板</div>}
      {exportMsg && <div style={S.toast}>JSON 报告已导出</div>}
    </div>
  )
}

export default React.memo(ColorAccessibility)
