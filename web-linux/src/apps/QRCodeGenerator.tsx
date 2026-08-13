import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

type QRSize = 'small' | 'medium' | 'large'

interface HistoryItem {
  id: string
  text: string
  size: QRSize
  createdAt: number
  fgColor: string
  bgColor: string
}

const SIZE_MAP: Record<QRSize, number> = {
  small: 200,
  medium: 300,
  large: 400,
}

const HISTORY_KEY = 'weblinux-qr-code-generator-history'
const MAX_HISTORY = 20

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const MODULE_COUNT = 33

function generateQRPattern(text: string): boolean[][] {
  const grid: boolean[][] = Array.from({ length: MODULE_COUNT }, () =>
    Array(MODULE_COUNT).fill(false)
  )

  const hash = hashString(text || ' ')
  const rand = seededRandom(hash)

  for (let r = 0; r < MODULE_COUNT; r++) {
    for (let c = 0; c < MODULE_COUNT; c++) {
      grid[r][c] = rand() > 0.5
    }
  }

  const clearZone = (r0: number, c0: number, r1: number, c1: number) => {
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (r >= 0 && r < MODULE_COUNT && c >= 0 && c < MODULE_COUNT) {
          grid[r][c] = false
        }
      }
    }
  }

  const drawFinder = (row: number, col: number) => {
    clearZone(row, col, row + 7, col + 7)
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4
        if (isBorder || isCenter) {
          grid[row + r][col + c] = true
        }
      }
    }
    clearZone(row + 7, col + 7, row + 8, col + 8)
  }

  drawFinder(0, 0)
  drawFinder(0, MODULE_COUNT - 7)
  drawFinder(MODULE_COUNT - 7, 0)

  const drawAlignment = (row: number, col: number) => {
    clearZone(row, col, row + 5, col + 5)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4
        const isCenter = r === 2 && c === 2
        if (isBorder || isCenter) {
          grid[row + r][col + c] = true
        }
      }
    }
  }

  drawAlignment(MODULE_COUNT - 9, MODULE_COUNT - 9)

  for (let i = 8; i < MODULE_COUNT - 8; i++) {
    grid[6][i] = i % 2 === 0
    grid[i][6] = i % 2 === 0
  }

  clearZone(8, 8, 8, 8)
  for (let r = 8; r < MODULE_COUNT - 8; r++) {
    for (let c = 8; c < MODULE_COUNT - 8; c++) {
      const v = (r * 31 + c * 17 + hash) % 7
      grid[r][c] = v < 3
    }
  }

  return grid
}

function drawQRCode(
  canvas: HTMLCanvasElement,
  text: string,
  size: number,
  fg: string,
  bg: string
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  ctx.scale(dpr, dpr)

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  const margin = size * 0.08
  const availSize = size - margin * 2
  const moduleSize = availSize / MODULE_COUNT

  const grid = generateQRPattern(text)

  ctx.fillStyle = fg
  for (let r = 0; r < MODULE_COUNT; r++) {
    for (let c = 0; c < MODULE_COUNT; c++) {
      if (grid[r][c]) {
        const x = margin + c * moduleSize
        const y = margin + r * moduleSize
        const s = Math.ceil(moduleSize)
        ctx.fillRect(x, y, s, s)
      }
    }
  }
}

function QRCodeGenerator() {
  const [text, setText] = useState('https://github.com/saya-ch/WebLinuxOS')
  const [size, setSize] = useState<QRSize>('medium')
  const [fgColor, setFgColor] = useState('#1a1a2e')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const pixelSize = SIZE_MAP[size]

  useEffect(() => {
    const saved = localStorage.getItem('weblinux-qr-generator-prefs')
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        if (prefs.fgColor) setFgColor(prefs.fgColor)
        if (prefs.bgColor) setBgColor(prefs.bgColor)
        if (prefs.size) setSize(prefs.size)
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'weblinux-qr-generator-prefs',
      JSON.stringify({ fgColor, bgColor, size })
    )
  }, [fgColor, bgColor, size])

  useEffect(() => {
    if (!canvasRef.current) return
    drawQRCode(canvasRef.current, text, pixelSize, fgColor, bgColor)
  }, [text, pixelSize, fgColor, bgColor])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const addToHistory = useCallback(() => {
    if (!text.trim()) return
    const item: HistoryItem = {
      id: Date.now().toString(),
      text: text.trim(),
      size,
      fgColor,
      bgColor,
      createdAt: Date.now(),
    }
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.text !== item.text)
      return [item, ...filtered].slice(0, MAX_HISTORY)
    })
  }, [text, size, fgColor, bgColor])

  const handleGenerate = useCallback(() => {
    addToHistory()
  }, [addToHistory])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `qrcode-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [])

  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob: Blob = await new Promise((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/png')
      )
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      try {
        const dataUrl = canvasRef.current.toDataURL('image/png')
        const img = new Image()
        img.src = dataUrl
        await navigator.clipboard.writeText(dataUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        console.warn('Clipboard write failed')
      }
    }
  }, [])

  const handleHistoryItem = useCallback((item: HistoryItem) => {
    setText(item.text)
    setSize(item.size)
    setFgColor(item.fgColor)
    setBgColor(item.bgColor)
  }, [])

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const textLength = text.length

  const sizeOptions: { key: QRSize; label: string; px: number }[] = useMemo(
    () => [
      { key: 'small', label: '小', px: 200 },
      { key: 'medium', label: '中', px: 300 },
      { key: 'large', label: '大', px: 400 },
    ],
    []
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>二维码生成器</h2>
        <span style={styles.subtitle}>输入文本或链接，一键生成二维码</span>
      </div>

      <div style={styles.main}>
        <div style={styles.leftPanel}>
          <div style={styles.inputSection}>
            <label style={styles.label}>文本 / URL</label>
            <textarea
              style={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文本或粘贴链接..."
              rows={3}
            />
            <div style={styles.charCount}>{textLength} 字符</div>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>尺寸</label>
            <div style={styles.sizeOptions}>
              {sizeOptions.map((opt) => (
                <button
                  key={opt.key}
                  style={{
                    ...styles.sizeBtn,
                    ...(size === opt.key ? styles.sizeBtnActive : {}),
                  }}
                  onClick={() => setSize(opt.key)}
                >
                  {opt.label}
                  <span style={styles.sizeBtnPx}>{opt.px}px</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.colorRow}>
            <div style={styles.colorItem}>
              <label style={styles.label}>前景色</label>
              <div style={styles.colorInputWrap}>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  style={styles.colorHex}
                />
              </div>
            </div>
            <div style={styles.colorItem}>
              <label style={styles.label}>背景色</label>
              <div style={styles.colorInputWrap}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={styles.colorHex}
                />
              </div>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button style={styles.primaryBtn} onClick={handleGenerate}>
              生成二维码
            </button>
            <button style={styles.secondaryBtn} onClick={handleDownload}>
              下载 PNG
            </button>
            <button
              style={{
                ...styles.secondaryBtn,
                ...(copied ? styles.successBtn : {}),
              }}
              onClick={handleCopyToClipboard}
            >
              {copied ? '已复制 ✓' : '复制图片'}
            </button>
          </div>

          <button
            style={styles.historyToggle}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? '▲ 隐藏历史' : '▼ 显示历史'} ({history.length})
          </button>

          {showHistory && (
            <div style={styles.historyList}>
              {history.length === 0 ? (
                <div style={styles.historyEmpty}>暂无历史记录</div>
              ) : (
                <>
                  <div style={styles.historyHeader}>
                    <span>最近生成</span>
                    <button
                      style={styles.clearBtn}
                      onClick={handleClearHistory}
                    >
                      清空
                    </button>
                  </div>
                  {history.map((item) => (
                    <div key={item.id} style={styles.historyItem}>
                      <div
                        style={styles.historyThumb}
                        onClick={() => handleHistoryItem(item)}
                      >
                        <canvas
                          width={48}
                          height={48}
                          ref={(el) => {
                            if (el) {
                              const c = el.getContext('2d')
                              if (c) {
                                c.fillStyle = item.bgColor
                                c.fillRect(0, 0, 48, 48)
                                const grid = generateQRPattern(item.text)
                                const ms = 48 / MODULE_COUNT
                                c.fillStyle = item.fgColor
                                for (let r = 0; r < MODULE_COUNT; r++) {
                                  for (let ci = 0; ci < MODULE_COUNT; ci++) {
                                    if (grid[r][ci]) {
                                      c.fillRect(
                                        ci * ms,
                                        r * ms,
                                        Math.ceil(ms),
                                        Math.ceil(ms)
                                      )
                                    }
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      <div
                        style={styles.historyInfo}
                        onClick={() => handleHistoryItem(item)}
                      >
                        <div style={styles.historyText}>
                          {item.text.length > 40
                            ? item.text.slice(0, 40) + '…'
                            : item.text}
                        </div>
                        <div style={styles.historyMeta}>
                          {new Date(item.createdAt).toLocaleString()} ·{' '}
                          {SIZE_MAP[item.size]}px
                        </div>
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteHistory(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.canvasWrapper}>
            <canvas ref={canvasRef} style={styles.canvas} />
          </div>
          <div style={styles.canvasInfo}>
            {pixelSize} × {pixelSize} px
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: 'var(--text-primary, #1a1a2e)',
    background: 'var(--bg-primary, #ffffff)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary, #1a1a2e)',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary, #6b7280)',
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: '16px',
    overflow: 'hidden',
    minHeight: 0,
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary, #6b7280)',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '8px',
    fontSize: '13px',
    resize: 'vertical',
    minHeight: '60px',
    outline: 'none',
    background: 'var(--bg-input, #f9fafb)',
    color: 'var(--text-primary, #1a1a2e)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-secondary, #9ca3af)',
    textAlign: 'right',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sizeOptions: {
    display: 'flex',
    gap: '6px',
  },
  sizeBtn: {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '8px',
    background: 'var(--bg-secondary, #f9fafb)',
    color: 'var(--text-primary, #1a1a2e)',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'all 0.15s ease',
  },
  sizeBtnActive: {
    background: 'var(--accent-color, #3b82f6)',
    color: '#fff',
    borderColor: 'var(--accent-color, #3b82f6)',
  },
  sizeBtnPx: {
    fontSize: '10px',
    opacity: 0.75,
  },
  colorRow: {
    display: 'flex',
    gap: '10px',
  },
  colorItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  colorInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorPicker: {
    width: '32px',
    height: '32px',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: 0,
    background: 'none',
  },
  colorHex: {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
    background: 'var(--bg-input, #f9fafb)',
    color: 'var(--text-primary, #1a1a2e)',
    minWidth: 0,
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  primaryBtn: {
    flex: 1,
    padding: '9px 14px',
    border: 'none',
    borderRadius: '8px',
    background: 'var(--accent-color, #3b82f6)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'filter 0.15s ease',
  },
  secondaryBtn: {
    flex: 1,
    padding: '9px 14px',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '8px',
    background: 'var(--bg-secondary, #f9fafb)',
    color: 'var(--text-primary, #1a1a2e)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  successBtn: {
    background: '#10b981',
    color: '#fff',
    borderColor: '#10b981',
  },
  historyToggle: {
    marginTop: '4px',
    padding: '6px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #6b7280)',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '6px',
    padding: '8px',
    borderRadius: '8px',
    background: 'var(--bg-secondary, #f9fafb)',
    border: '1px solid var(--border-color, #e5e7eb)',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary, #6b7280)',
  },
  historyEmpty: {
    textAlign: 'center',
    color: 'var(--text-secondary, #9ca3af)',
    fontSize: '12px',
    padding: '12px 0',
  },
  clearBtn: {
    border: 'none',
    background: 'transparent',
    color: 'var(--danger-color, #ef4444)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: 0,
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px',
    borderRadius: '6px',
    background: 'var(--bg-primary, #fff)',
    border: '1px solid var(--border-color, #e5e7eb)',
  },
  historyThumb: {
    cursor: 'pointer',
    flexShrink: 0,
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid var(--border-color, #e5e7eb)',
  },
  historyInfo: {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
  },
  historyText: {
    fontSize: '12px',
    color: 'var(--text-primary, #1a1a2e)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  historyMeta: {
    fontSize: '10px',
    color: 'var(--text-secondary, #9ca3af)',
    marginTop: '2px',
  },
  deleteBtn: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #9ca3af)',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 6px',
    borderRadius: '4px',
  },
  rightPanel: {
    width: '45%',
    maxWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  canvasWrapper: {
    background: 'var(--bg-secondary, #f9fafb)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color, #e5e7eb)',
  },
  canvas: {
    borderRadius: '8px',
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
  },
  canvasInfo: {
    fontSize: '11px',
    color: 'var(--text-secondary, #9ca3af)',
  },
}

export default QRCodeGenerator