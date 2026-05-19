import { useState, useRef, useEffect } from 'react'

const presetColors = [
  '#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5',
  '#89dceb', '#74c7ec', '#89b4fa', '#b4befe', '#cba6f7', '#f5c2e7',
  '#f2cdcd', '#f5e0dc', '#bac2de', '#a6adc8', '#9399b2', '#7f849c',
  '#6c7086', '#585b70', '#45475a', '#313244', '#1e1e2e', '#11111b',
]

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
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

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

export default function ColorPicker() {
  const [color, setColor] = useState('#89b4fa')
  const [hue, setHue] = useState(217)
  const [sat, setSat] = useState(75)
  const [light, setLight] = useState(76)
  const [recentColors, setRecentColors] = useState<string[]>(['#f38ba8', '#a6e3a1', '#f9e2af'])
  const [copied, setCopied] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const [h, s, l] = hexToHsl(color)
    setHue(h)
    setSat(s)
    setLight(l)
  }, [color])

  const handleSatLightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height
    const newColor = hslToHex(hue, Math.round(x * 100), Math.round(y * 100))
    setColor(newColor)
    setRecentColors((prev) => {
      const next = [newColor, ...prev.filter((c) => c !== newColor)].slice(0, 10)
      return next
    })
  }

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Number(e.target.value)
    setHue(h)
    const newColor = hslToHex(h, sat, light)
    setColor(newColor)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const hueColor = hslToHex(hue, 100, 50)
    const whiteGrad = ctx.createLinearGradient(0, 0, w, 0)
    whiteGrad.addColorStop(0, '#ffffff')
    whiteGrad.addColorStop(1, hueColor)
    ctx.fillStyle = whiteGrad
    ctx.fillRect(0, 0, w, h)

    const blackGrad = ctx.createLinearGradient(0, 0, 0, h)
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)')
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = blackGrad
    ctx.fillRect(0, 0, w, h)

    const sx = (sat / 100) * w
    const sy = (1 - light / 100) * h
    ctx.beginPath()
    ctx.arc(sx, sy, 6, 0, Math.PI * 2)
    ctx.strokeStyle = light > 50 ? '#000' : '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(sx, sy, 5, 0, Math.PI * 2)
    ctx.strokeStyle = light > 50 ? '#fff' : '#000'
    ctx.lineWidth = 1
    ctx.stroke()
  }, [hue, sat, light])

  const copyValue = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(text)
    setTimeout(() => setCopied(''), 1500)
  }

  const [r, g, b] = hexToRgb(color)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', padding: '12px', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <canvas
            ref={canvasRef}
            width={200}
            height={160}
            onClick={handleSatLightClick}
            style={{ width: '100%', borderRadius: '8px', cursor: 'crosshair' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '100%', height: '20px', borderRadius: '10px',
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={handleHueChange}
                style={{
                  width: '100%', height: '20px', margin: 0, opacity: 0, cursor: 'pointer',
                  WebkitAppearance: 'none', appearance: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ width: '60px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: color, border: '2px solid #45475a' }} />
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: color, border: '2px solid #45475a', opacity: 0.5 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
        {[
          { label: 'HEX', value: color, format: 'hex' },
          { label: 'RGB', value: `rgb(${r}, ${g}, ${b})`, format: 'rgb' },
          { label: 'HSL', value: `hsl(${hue}, ${sat}%, ${light}%)`, format: 'hsl' },
        ].map((item) => (
          <div
            key={item.label}
            onClick={() => copyValue(item.value)}
            style={{
              display: 'flex', alignItems: 'center', padding: '6px 10px', background: '#313244',
              borderRadius: '6px', cursor: 'pointer', justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#a6adc8', fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontFamily: 'monospace' }}>{item.value}</span>
            <span style={{ color: '#a6e3a1', fontSize: '10px', width: '40px', textAlign: 'right' }}>
              {copied === item.value ? '已复制' : '复制'}
            </span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '6px' }}>最近使用的颜色</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {recentColors.map((c, i) => (
            <div
              key={i}
              onClick={() => setColor(c)}
              style={{
                width: '28px', height: '28px', background: c, borderRadius: '4px', cursor: 'pointer',
                border: color === c ? '2px solid #fff' : '2px solid transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '6px' }}>预设颜色</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {presetColors.map((c, i) => (
            <div
              key={i}
              onClick={() => setColor(c)}
              style={{
                width: '24px', height: '24px', background: c, borderRadius: '4px', cursor: 'pointer',
                border: color === c ? '2px solid #fff' : '1px solid #45475a',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}