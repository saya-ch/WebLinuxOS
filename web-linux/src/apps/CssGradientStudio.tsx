import { useState, useMemo } from 'react'

/**
 * CSS 渐变工作室
 *
 * 提供可视化创建 CSS linear-gradient / radial-gradient / conic-gradient
 * 的能力，支持：
 *  - 实时预览
 *  - 颜色停止点编辑
 *  - 角度控制
 *  - 一键复制 CSS 代码
 *  - 预设调色板
 *  - 导出 PNG 截图（通过 Canvas）
 */

type GradientType = 'linear' | 'radial' | 'conic'

interface ColorStop {
  id: string
  color: string
  position: number
}

const PRESET_PALETTES: Array<{ name: string; colors: string[] }> = [
  { name: '日落', colors: ['#ff6b6b', '#ffa15c', '#ffd86b', '#a0e7a0'] },
  { name: '海洋', colors: ['#0f3057', '#00587a', '#008891', '#75e6da'] },
  { name: '极光', colors: ['#5b86e5', '#36d1dc', '#5ee7df', '#b490ca'] },
  { name: '森林', colors: ['#134e5e', '#71b280', '#a8e6cf', '#dcedc1'] },
  { name: '紫罗兰', colors: ['#7f00ff', '#e100ff', '#ff7eb3', '#ff758c'] },
  { name: '极简', colors: ['#ffffff', '#e0e0e0', '#a0a0a0', '#000000'] },
  { name: '霓虹', colors: ['#fc466b', '#3f5efb', '#0ff0fc', '#f9f871'] },
  { name: '复古', colors: ['#d1913c', '#ffd194', '#d3a37c', '#5a3921'] },
  { name: '春日', colors: ['#a8e063', '#56ab2f', '#f9d423', '#ff4e50'] },
  { name: '深夜', colors: ['#0f2027', '#203a43', '#2c5364', '#73c8a9'] },
]

const CssGradientStudio = () => {
  const [gradientType, setGradientType] = useState<GradientType>('linear')
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState<ColorStop[]>([
    { id: '1', color: '#8b5cf6', position: 0 },
    { id: '2', color: '#06b6d4', position: 100 },
  ])

  const gradientCss = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    const stopsStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ')
    if (gradientType === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsStr})`
    }
    if (gradientType === 'radial') {
      return `radial-gradient(circle at center, ${stopsStr})`
    }
    return `conic-gradient(from ${angle}deg at center, ${stopsStr})`
  }, [gradientType, angle, stops])

  const [copied, setCopied] = useState(false)
  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(`background: ${gradientCss};`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback: 选中文字
      const range = document.createRange()
      const sel = window.getSelection()
      const node = document.getElementById('css-output')
      if (node && sel) {
        range.selectNodeContents(node)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }

  const applyPreset = (colors: string[]) => {
    const newStops = colors.map((c, i) => ({
      id: String(Date.now() + i),
      color: c,
      position: (i / (colors.length - 1)) * 100,
    }))
    setStops(newStops)
  }

  const addStop = () => {
    const last = stops[stops.length - 1]
    const newStop: ColorStop = {
      id: String(Date.now()),
      color: last?.color || '#000000',
      position: Math.min(100, (last?.position ?? 50) + 10),
    }
    setStops([...stops, newStop])
  }

  const removeStop = (id: string) => {
    if (stops.length <= 2) return
    setStops(stops.filter(s => s.id !== id))
  }

  const updateStop = (id: string, field: keyof ColorStop, value: string | number) => {
    setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      {/* 左侧：预览 */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: 20, gap: 16, overflow: 'auto' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>预览</h2>
        <div
          style={{
            flex: 1,
            minHeight: 300,
            borderRadius: 12,
            background: gradientCss,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            transition: 'background 0.2s',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>CSS 代码</span>
            <button
              onClick={copyCss}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                background: copied ? '#10b981' : 'var(--accent, #8b5cf6)',
                color: '#fff',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {copied ? '已复制 ✓' : '复制 CSS'}
            </button>
          </div>
          <pre
            id="css-output"
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 6,
              background: 'rgba(0,0,0,0.3)',
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            background: {gradientCss};
          </pre>
        </div>
      </div>

      {/* 右侧：控制面板 */}
      <div style={{
        borderLeft: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        overflow: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary, #888)', display: 'block', marginBottom: 8 }}>渐变类型</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {(['linear', 'radial', 'conic'] as GradientType[]).map((t) => (
              <button
                key={t}
                onClick={() => setGradientType(t)}
                style={{
                  padding: '8px 4px',
                  border: '1px solid',
                  borderColor: gradientType === t ? 'var(--accent, #8b5cf6)' : 'var(--window-border, rgba(255,255,255,0.1))',
                  background: gradientType === t ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'transparent',
                  color: gradientType === t ? 'var(--accent, #8b5cf6)' : 'inherit',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {t === 'linear' ? '线性' : t === 'radial' ? '径向' : '锥形'}
              </button>
            ))}
          </div>
        </div>

        {gradientType !== 'radial' && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary, #888)', display: 'flex', justifyContent: 'space-between' }}>
              <span>角度</span>
              <span style={{ fontFamily: 'monospace' }}>{angle}°</span>
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>颜色停止点</label>
            <button
              onClick={addStop}
              style={{
                padding: '2px 8px',
                border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                background: 'transparent',
                color: 'inherit',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              + 添加
            </button>
          </div>
          {/* 渐变条 */}
          <div style={{
            height: 24,
            borderRadius: 4,
            background: gradientCss,
            marginBottom: 12,
            border: '1px solid rgba(255,255,255,0.1)',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stops.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => updateStop(s.id, 'color', e.target.value)}
                  style={{
                    width: 32,
                    height: 32,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={s.color}
                  onChange={(e) => updateStop(s.id, 'color', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    minWidth: 0,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={s.position}
                  onChange={(e) => updateStop(s.id, 'position', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  style={{
                    width: 50,
                    padding: '4px 6px',
                    border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={() => removeStop(s.id)}
                  disabled={stops.length <= 2}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    background: 'transparent',
                    color: stops.length <= 2 ? '#444' : '#ef4444',
                    borderRadius: 4,
                    fontSize: 14,
                    cursor: stops.length <= 2 ? 'not-allowed' : 'pointer',
                  }}
                  title="删除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary, #888)', display: 'block', marginBottom: 8 }}>预设调色板</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PRESET_PALETTES.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.colors)}
                style={{
                  border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                  background: 'transparent',
                  borderRadius: 6,
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
                title={`应用 ${p.name} 调色板`}
              >
                <div style={{
                  display: 'flex',
                  height: 24,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  {p.colors.map((c, i) => (
                    <div key={i} style={{ flex: 1, background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CssGradientStudio
