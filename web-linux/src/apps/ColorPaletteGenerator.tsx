import { useState, useEffect, useCallback, memo } from 'react'
import { RefreshCw, Save, Palette, Heart, Trash2, Check } from 'lucide-react'

interface Color {
  id: string
  hex: string
  locked: boolean
}

interface Palette {
  id: string
  name: string
  colors: string[]
  createdAt: string
}

const ColorPaletteGenerator = memo(function ColorPaletteGenerator() {
  const [colors, setColors] = useState<Color[]>([
    { id: '1', hex: '#7C6CF0', locked: false },
    { id: '2', hex: '#9B8AF0', locked: false },
    { id: '3', hex: '#B8A8FF', locked: false },
    { id: '4', hex: '#D8D0FF', locked: false },
    { id: '5', hex: '#F0EEFF', locked: false },
  ])
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'random' | 'analogous' | 'complementary' | 'triadic' | 'monochromatic'>('random')
  const [newPaletteName, setNewPaletteName] = useState('')

  // 加载保存的调色板
  useEffect(() => {
    const saved = localStorage.getItem('weblinuxos-color-palettes')
    if (saved) {
      setPalettes(JSON.parse(saved))
    }
  }, [])

  // 保存调色板到localStorage
  const savePalettesToStorage = useCallback((updatedPalettes: Palette[]) => {
    setPalettes(updatedPalettes)
    localStorage.setItem('weblinuxos-color-palettes', JSON.stringify(updatedPalettes))
  }, [])

  // 生成随机颜色
  const getRandomColor = () => {
    const hex = Math.floor(Math.random() * 16777215).toString(16)
    return '#' + hex.padStart(6, '0')
  }

  // HEX转HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  // HSL转HEX
  const hslToHex = (h: number, s: number, l: number) => {
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

  // 生成新调色板
  const generatePalette = useCallback(() => {
    setColors(prevColors => {
      const newColors = [...prevColors]
      const baseColor = newColors.find(c => c.locked) || newColors[0]
      const baseHsl = hexToHsl(baseColor.hex)

      for (let i = 0; i < newColors.length; i++) {
        if (newColors[i].locked) continue

        let newColor: string
        switch (selectedMode) {
          case 'analogous':
            const angle = (i - 2) * 30
            newColor = hslToHex((baseHsl.h + angle + 360) % 360, baseHsl.s, baseHsl.l)
            break
          case 'complementary':
            newColor = hslToHex((baseHsl.h + (i % 2 === 0 ? 0 : 180)) % 360, baseHsl.s, baseHsl.l - (i * 10))
            break
          case 'triadic':
            const triAngle = (i * 120) % 360
            newColor = hslToHex((baseHsl.h + triAngle) % 360, baseHsl.s, baseHsl.l - (i * 5))
            break
          case 'monochromatic':
            newColor = hslToHex(baseHsl.h, baseHsl.s, 20 + i * 15)
            break
          default:
            newColor = getRandomColor()
        }
        newColors[i] = { ...newColors[i], hex: newColor }
      }
      return newColors
    })
  }, [selectedMode])

  // 锁定/解锁颜色
  const toggleLock = useCallback((id: string) => {
    setColors(prevColors => prevColors.map(c => 
      c.id === id ? { ...c, locked: !c.locked } : c
    ))
  }, [])

  // 复制颜色
  const copyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  // 保存当前调色板
  const saveCurrentPalette = useCallback(() => {
    if (!newPaletteName.trim()) return
    const newPalette: Palette = {
      id: Date.now().toString(),
      name: newPaletteName,
      colors: colors.map(c => c.hex),
      createdAt: new Date().toISOString(),
    }
    savePalettesToStorage([...palettes, newPalette])
    setNewPaletteName('')
  }, [colors, newPaletteName, palettes, savePalettesToStorage])

  // 删除调色板
  const deletePalette = useCallback((id: string) => {
    savePalettesToStorage(palettes.filter(p => p.id !== id))
  }, [palettes, savePalettesToStorage])

  // 加载调色板
  const loadPalette = useCallback((palette: Palette) => {
    const newColors = palette.colors.slice(0, 5).map((hex, i) => ({
      id: (i + 1).toString(),
      hex,
      locked: false,
    }))
    while (newColors.length < 5) {
      newColors.push({
        id: (newColors.length + 1).toString(),
        hex: getRandomColor(),
        locked: false,
      })
    }
    setColors(newColors)
  }, [])

  // 计算文本颜色（确保对比度）
  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: '20px',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette size={24} />
          配色方案生成器
        </h2>
        <button 
          onClick={generatePalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--accent-glow)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <RefreshCw size={18} />
          生成新配色
        </button>
      </div>

      {/* 生成模式选择 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          生成模式
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'random', name: '随机' },
            { id: 'analogous', name: '类比' },
            { id: 'complementary', name: '互补' },
            { id: 'triadic', name: '三元' },
            { id: 'monochromatic', name: '单色' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id as any)}
              style={{
                padding: '8px 16px',
                background: selectedMode === mode.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
                border: selectedMode === mode.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* 颜色展示 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px', 
        marginBottom: '24px',
        height: '220px'
      }}>
        {colors.map((color) => (
          <div key={color.id} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{
              background: color.hex,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '16px',
              cursor: 'pointer'
            }} onClick={() => copyColor(color.hex)}>
              <div style={{
                color: getContrastColor(color.hex),
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                {color.hex.toUpperCase()}
              </div>
              {copied === color.hex && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '4px',
                  color: getContrastColor(color.hex),
                  fontSize: '12px'
                }}>
                  <Check size={14} /> 已复制
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleLock(color.id) }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              {color.locked ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}
            </button>
          </div>
        ))}
      </div>

      {/* 保存调色板 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '16px',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)'
      }}>
        <input
          type="text"
          placeholder="给配色起个名字..."
          value={newPaletteName}
          onChange={(e) => setNewPaletteName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && saveCurrentPalette()}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
        <button
          onClick={saveCurrentPalette}
          disabled={!newPaletteName.trim()}
          style={{
            padding: '10px 20px',
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            borderRadius: '8px',
            color: 'var(--success)',
            cursor: newPaletteName.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Save size={16} />
          保存
        </button>
      </div>

      {/* 已保存的调色板 */}
      {palettes.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            已保存的配色方案 ({palettes.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {palettes.map((palette) => (
              <div
                key={palette.id}
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => loadPalette(palette)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '40px' }}>
                  {palette.colors.slice(0, 5).map((color, i) => (
                    <div key={i} style={{ flex: 1, background: color }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{palette.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePalette(palette.id) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--error)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default ColorPaletteGenerator
