import { useState, useRef, useEffect } from 'react'

export default function QRCodeGenerator() {
  const [text, setText] = useState('')
  const [size, setSize] = useState(200)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // QR Code generation using canvas
  useEffect(() => {
    if (!text || !canvasRef.current) return
    generateQRCode(text, size)
  }, [text, size])

  const generateQRCode = (data: string, size: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Simple QR-like pattern generation (for demo)
    // In production, use a proper QR library
    const moduleCount = 25
    const moduleSize = size / moduleCount
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    
    // Generate pattern based on data
    const pattern = generatePattern(data, moduleCount)
    
    ctx.fillStyle = '#000000'
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (pattern[row][col]) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize)
        }
      }
    }
    
    // Add finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, moduleSize)
    drawFinderPattern(ctx, moduleCount - 7, 0, moduleSize)
    drawFinderPattern(ctx, 0, moduleCount - 7, moduleSize)
  }

  const generatePattern = (data: string, size: number): boolean[][] => {
    const pattern: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false))
    
    // Convert data to binary-like pattern
    const hash = data.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const seed = hash % 10000
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Skip finder pattern areas
        if ((i < 8 && j < 8) || (i < 8 && j >= size - 8) || (i >= size - 8 && j < 8)) continue
        
        // Generate pseudo-random pattern
        const val = ((seed + i * j + i + j) % 3)
        pattern[i][j] = val === 0
      }
    }
    
    return pattern
  }

  const drawFinderPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) => {
    // Outer black square
    ctx.fillStyle = '#000000'
    ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize)
    
    // Inner white square
    ctx.fillStyle = '#ffffff'
    ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize)
    
    // Center black square
    ctx.fillStyle = '#000000'
    ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize)
  }

  const downloadQRCode = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qrcode-${text.slice(0, 20)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="app-container" style={{ background: '#1e1e1e', color: '#fff', padding: 20, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#aaa' }}>
          输入文本或链接
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入要编码的内容..."
          style={{
            width: '100%',
            height: 80,
            padding: 12,
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#888' }}>尺寸</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              background: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
            }}
          >
            <option value={150}>150px</option>
            <option value={200}>200px</option>
            <option value={300}>300px</option>
            <option value={400}>400px</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#888' }}>容错级别</label>
          <select
            value={errorLevel}
            onChange={(e) => setErrorLevel(e.target.value as any)}
            style={{
              padding: '8px 12px',
              background: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
            }}
          >
            <option value="L">L - 低 (7%)</option>
            <option value="M">M - 中 (15%)</option>
            <option value="Q">Q - 较高 (25%)</option>
            <option value="H">H - 高 (30%)</option>
          </select>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {text ? (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ border: '4px solid #333', borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              background: '#2d2d2d',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: 14,
              margin: '0 auto',
            }}
          >
            输入内容生成二维码
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={downloadQRCode}
          disabled={!text}
          style={{
            padding: '10px 20px',
            background: text ? '#0078d4' : '#333',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14,
            cursor: text ? 'pointer' : 'not-allowed',
          }}
        >
          下载 PNG
        </button>
        <button
          onClick={copyToClipboard}
          disabled={!text}
          style={{
            padding: '10px 20px',
            background: text ? '#2d2d2d' : '#333',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14,
            cursor: text ? 'pointer' : 'not-allowed',
          }}
        >
          复制文本
        </button>
      </div>

      <div style={{ marginTop: 20, padding: 12, background: '#2d2d2d', borderRadius: 8, fontSize: 12, color: '#888' }}>
        <strong style={{ color: '#aaa' }}>提示:</strong> 二维码可以编码网址、文本、电话号码、WiFi配置等信息。
        容错级别越高，二维码即使部分损坏也能被识别。
      </div>
    </div>
  )
}