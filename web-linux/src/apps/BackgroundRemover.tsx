import { useState, useRef, useCallback } from 'react'
import { useStore } from '../store'

type RemoveMode = 'auto' | 'color' | 'edge' | 'manual'

interface ProcessResult {
  dataUrl: string
  width: number
  height: number
  pixelsProcessed: number
}

export default function BackgroundRemover() {
  const addNotification = useStore((s) => s.addNotification)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [processedResult, setProcessedResult] = useState<ProcessResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [mode, setMode] = useState<RemoveMode>('auto')
  const [threshold, setThreshold] = useState(30)
  const [tolerance, setTolerance] = useState(50)
  const [edgeSensitivity, setEdgeSensitivity] = useState(50)
  const [selectedColor, setSelectedColor] = useState<{ r: number; g: number; b: number } | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<ProcessResult[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [autoDetectBgColor, setAutoDetectBgColor] = useState(true)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addNotification({ title: '错误', message: '请选择图片文件', type: 'error' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      addNotification({ title: '错误', message: '图片大小不能超过 10MB', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        setProcessedResult(null)
        setHistory([])
        setSelectedColor(null)
        loadImageToCanvas(img)
        addNotification({ title: '成功', message: '图片加载成功', type: 'success' })
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [addNotification])

  const loadImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    const tempCanvas = tempCanvasRef.current
    if (!canvas || !tempCanvas) return

    const maxSize = 800
    let { width, height } = img
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    [canvas, tempCanvas].forEach((c) => {
      c.width = width
      c.height = height
    })

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
  }, [])

  const detectBackgroundColor = useCallback((imageData: ImageData): { r: number; g: number; b: number } => {
    const { data, width, height } = imageData
    const cornerSize = Math.min(50, Math.floor(Math.min(width, height) * 0.1))
    const colorCounts = new Map<string, { r: number; g: number; b: number; count: number }>()

    const samplePixels = (x: number, y: number, w: number, h: number) => {
      for (let i = y; i < y + h; i += 2) {
        for (let j = x; j < x + w; j += 2) {
          const idx = (i * width + j) * 4
          const r = Math.round(data[idx] / 10) * 10
          const g = Math.round(data[idx + 1] / 10) * 10
          const b = Math.round(data[idx + 2] / 10) * 10
          const key = `${r},${g},${b}`
          const existing = colorCounts.get(key)
          if (existing) {
            existing.count++
          } else {
            colorCounts.set(key, { r, g, b, count: 1 })
          }
        }
      }
    }

    samplePixels(0, 0, cornerSize, cornerSize)
    samplePixels(width - cornerSize, 0, cornerSize, cornerSize)
    samplePixels(0, height - cornerSize, cornerSize, cornerSize)
    samplePixels(width - cornerSize, height - cornerSize, cornerSize, cornerSize)

    let mostCommon: { r: number; g: number; b: number; count: number } | null = null
    for (const entry of colorCounts.values()) {
      if (!mostCommon || entry.count > mostCommon.count) {
        mostCommon = entry
      }
    }

    if (mostCommon) {
      return { r: mostCommon.r, g: mostCommon.g, b: mostCommon.b }
    }
    return { r: 255, g: 255, b: 255 }
  }, [])

  const removeBackgroundAuto = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !originalImage) return

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data, width, height } = imageData

      setProcessingProgress(20)

      let bgColor = selectedColor
      if (!bgColor && autoDetectBgColor) {
        bgColor = detectBackgroundColor(imageData)
        setSelectedColor(bgColor)
      }

      if (!bgColor) {
        bgColor = { r: 255, g: 255, b: 255 }
      }

      setProcessingProgress(50)

      const thresholdValue = threshold
      const toleranceValue = tolerance

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const distance = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
          Math.pow(g - bgColor.g, 2) +
          Math.pow(b - bgColor.b, 2)
        )

        if (distance < thresholdValue) {
          data[i + 3] = 0
        } else if (distance < thresholdValue + toleranceValue) {
          const alpha = Math.max(0, (distance - thresholdValue) / toleranceValue)
          data[i + 3] = Math.round(alpha * 255)
        }
      }

      setProcessingProgress(80)

      ctx.putImageData(imageData, 0, 0)

      const result: ProcessResult = {
        dataUrl: canvas.toDataURL('image/png'),
        width,
        height,
        pixelsProcessed: width * height,
      }

      setProcessedResult(result)
      setHistory((prev) => [...prev.slice(-4), result])
      setProcessingProgress(100)
      addNotification({ title: '成功', message: '背景移除完成', type: 'success' })
    } catch {
      addNotification({ title: '错误', message: '处理失败，请重试', type: 'error' })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress(0), 500)
    }
  }, [originalImage, threshold, tolerance, selectedColor, autoDetectBgColor, detectBackgroundColor, addNotification])

  const removeBackgroundEdge = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsProcessing(true)
    setProcessingProgress(10)

    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data, width, height } = imageData

      setProcessingProgress(30)

      const grayData = new Float32Array(width * height)
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        grayData[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }

      setProcessingProgress(50)

      const edgeData = new Float32Array(width * height)
      const sensitivityValue = edgeSensitivity * 2

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x
          const gx = grayData[(y) * width + (x + 1)] - grayData[(y) * width + (x - 1)]
          const gy = grayData[(y + 1) * width + (x)] - grayData[(y - 1) * width + (x)]
          edgeData[idx] = Math.sqrt(gx * gx + gy * gy)
        }
      }

      setProcessingProgress(70)

      const visited = new Uint8Array(width * height)
      const queue: number[] = []

      for (let x = 0; x < width; x++) {
        const topIdx = x
        const bottomIdx = (height - 1) * width + x
        if (edgeData[topIdx] < sensitivityValue) {
          queue.push(topIdx)
          visited[topIdx] = 1
        }
        if (edgeData[bottomIdx] < sensitivityValue) {
          queue.push(bottomIdx)
          visited[bottomIdx] = 1
        }
      }
      for (let y = 0; y < height; y++) {
        const leftIdx = y * width
        const rightIdx = y * width + (width - 1)
        if (edgeData[leftIdx] < sensitivityValue) {
          queue.push(leftIdx)
          visited[leftIdx] = 1
        }
        if (edgeData[rightIdx] < sensitivityValue) {
          queue.push(rightIdx)
          visited[rightIdx] = 1
        }
      }

      while (queue.length > 0) {
        const idx = queue.shift()!
        const x = idx % width
        const y = Math.floor(idx / width)

        if (x > 0) {
          const nIdx = idx - 1
          if (!visited[nIdx] && edgeData[nIdx] < sensitivityValue) {
            visited[nIdx] = 1
            queue.push(nIdx)
          }
        }
        if (x < width - 1) {
          const nIdx = idx + 1
          if (!visited[nIdx] && edgeData[nIdx] < sensitivityValue) {
            visited[nIdx] = 1
            queue.push(nIdx)
          }
        }
        if (y > 0) {
          const nIdx = idx - width
          if (!visited[nIdx] && edgeData[nIdx] < sensitivityValue) {
            visited[nIdx] = 1
            queue.push(nIdx)
          }
        }
        if (y < height - 1) {
          const nIdx = idx + width
          if (!visited[nIdx] && edgeData[nIdx] < sensitivityValue) {
            visited[nIdx] = 1
            queue.push(nIdx)
          }
        }
      }

      setProcessingProgress(85)

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        if (visited[j]) {
          data[i + 3] = 0
        } else if (edgeData[j] < sensitivityValue * 1.5) {
          const alpha = (edgeData[j] - sensitivityValue) / (sensitivityValue * 0.5)
          data[i + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
        }
      }

      ctx.putImageData(imageData, 0, 0)

      const result: ProcessResult = {
        dataUrl: canvas.toDataURL('image/png'),
        width,
        height,
        pixelsProcessed: width * height,
      }

      setProcessedResult(result)
      setHistory((prev) => [...prev.slice(-4), result])
      addNotification({ title: '成功', message: '边缘检测背景移除完成', type: 'success' })
    } catch {
      addNotification({ title: '错误', message: '处理失败，请重试', type: 'error' })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(100)
      setTimeout(() => setProcessingProgress(0), 500)
    }
  }, [originalImage, edgeSensitivity, addNotification])

  const removeBackgroundColor = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data, width, height } = imageData

      setProcessingProgress(50)

      const targetColor = selectedColor || { r: 255, g: 255, b: 255 }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const distance = Math.sqrt(
          Math.pow(r - targetColor.r, 2) +
          Math.pow(g - targetColor.g, 2) +
          Math.pow(b - targetColor.b, 2)
        )

        const thresholdValue = threshold + tolerance
        if (distance < thresholdValue) {
          const alpha = Math.max(0, 1 - distance / thresholdValue)
          data[i + 3] = Math.round((1 - alpha) * 255)
        }
      }

      setProcessingProgress(80)

      ctx.putImageData(imageData, 0, 0)

      const result: ProcessResult = {
        dataUrl: canvas.toDataURL('image/png'),
        width,
        height,
        pixelsProcessed: width * height,
      }

      setProcessedResult(result)
      setHistory((prev) => [...prev.slice(-4), result])
      setProcessingProgress(100)
      addNotification({ title: '成功', message: '颜色背景移除完成', type: 'success' })
    } catch {
      addNotification({ title: '错误', message: '处理失败，请重试', type: 'error' })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress(0), 500)
    }
  }, [selectedColor, threshold, tolerance, addNotification])

  const handleRemove = useCallback(async () => {
    if (!originalImage) {
      addNotification({ title: '错误', message: '请先上传图片', type: 'error' })
      return
    }

    // Reset canvas to original
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx && originalImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)
      }
    }

    switch (mode) {
      case 'auto':
        await removeBackgroundAuto()
        break
      case 'color':
        if (!selectedColor) {
          if (autoDetectBgColor) {
            // Auto detect color first, then remove
            const tempCanvas = tempCanvasRef.current
            if (tempCanvas) {
              const tempCtx = tempCanvas.getContext('2d')
              if (tempCtx) {
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
                tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height)
                const tempData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
                const detectedColor = detectBackgroundColor(tempData)
                setSelectedColor(detectedColor)
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            }
          } else {
            addNotification({ title: '警告', message: '请选择要移除的颜色', type: 'warning' })
            return
          }
        }
        await removeBackgroundColor()
        break
      case 'edge':
        await removeBackgroundEdge()
        break
    }
  }, [originalImage, mode, selectedColor, autoDetectBgColor, removeBackgroundAuto, removeBackgroundColor, removeBackgroundEdge, detectBackgroundColor, addNotification])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!manualMode && mode !== 'color') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))

    if (mode === 'color' && !manualMode) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const pixelData = ctx.getImageData(x, y, 1, 1).data
      setSelectedColor({ r: pixelData[0], g: pixelData[1], b: pixelData[2] })
      addNotification({ title: '信息', message: '已选择颜色', type: 'info' })
    }
  }, [mode, manualMode, addNotification])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!manualMode) return
    setIsDrawing(true)
    handleCanvasClick(e)
  }, [manualMode, handleCanvasClick])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !manualMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))

    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }, [isDrawing, manualMode, brushSize])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const handleDownload = useCallback(() => {
    if (!processedResult) return

    const link = document.createElement('a')
    link.download = `background-removed-${Date.now()}.png`
    link.href = processedResult.dataUrl
    link.click()
    addNotification({ title: '成功', message: '下载开始', type: 'success' })
  }, [processedResult, addNotification])

  const handleReset = useCallback(() => {
    if (originalImage && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(originalImage, 0, 0, canvasRef.current.width, canvasRef.current.height)
        setProcessedResult(null)
        setSelectedColor(null)
        setHistory([])
        addNotification({ title: '信息', message: '已重置', type: 'info' })
      }
    }
  }, [originalImage, addNotification])

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const prevResult = history[history.length - 1]
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
            ctx.drawImage(img, 0, 0)
          }
          img.src = prevResult.dataUrl
        }
      }
      addNotification({ title: '信息', message: '已撤销', type: 'info' })
    }
  }, [history, addNotification])

  const modes: { id: RemoveMode; name: string; icon: string; desc: string }[] = [
    { id: 'auto', name: '智能自动', icon: '✨', desc: '自动检测并移除背景色' },
    { id: 'color', name: '颜色选择', icon: '🎯', desc: '点击图片选择要移除的颜色' },
    { id: 'edge', name: '边缘检测', icon: '📐', desc: '基于边缘检测分离主体' },
  ]

  return (
    <div style={{
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      height: '100%',
      overflow: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 32,
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>🖼️</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>AI 背景移除工具</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              使用 Canvas 智能算法移除图片背景 · 支持多种模式
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {processedResult && (
            <>
              <button onClick={handleUndo} disabled={history.length === 0} style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                opacity: history.length === 0 ? 0.5 : 1,
                fontSize: 13,
              }}>↩️ 撤销</button>
              <button onClick={handleReset} style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
              }}>🔄 重置</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div style={{
          background: 'var(--window-bg)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--text-primary)' }}>1. 上传图片</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current?.click()} style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '2px dashed var(--accent)',
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}>
              📁 选择图片
            </button>
            <p style={{ margin: '8px 0 0 0', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
              支持 PNG、JPG、WebP · 最大 10MB
            </p>
          </div>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--text-primary)' }}>2. 选择模式</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: mode === m.id ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                    background: mode === m.id ? 'var(--accent-bg)' : 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'auto' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-primary)' }}>参数设置</h3>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  阈值: {threshold}
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', margin: '8px 0 4px 0' }}>
                  边缘柔和度: {tolerance}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={autoDetectBgColor}
                    onChange={(e) => setAutoDetectBgColor(e.target.checked)}
                  />
                  自动检测背景色
                </label>
              </div>
            )}

            {mode === 'color' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-primary)' }}>颜色选择</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  点击图片选取要移除的颜色
                </p>
                {selectedColor && (
                  <div style={{
                    padding: 8,
                    borderRadius: 8,
                    background: 'var(--window-bg)',
                    border: '1px solid var(--window-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: `rgb(${selectedColor.r},${selectedColor.g},${selectedColor.b})`,
                    }} />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                      RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
                    </span>
                  </div>
                )}
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', margin: '8px 0 4px 0' }}>
                  阈值: {threshold + tolerance}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={threshold + tolerance}
                  onChange={(e) => {
                    setThreshold(Math.floor(Number(e.target.value) / 2))
                    setTolerance(Number(e.target.value) - Math.floor(Number(e.target.value) / 2))
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {mode === 'edge' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-primary)' }}>边缘检测</h3>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  检测灵敏度: {edgeSensitivity}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={edgeSensitivity}
                  onChange={(e) => setEdgeSensitivity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                  灵敏度越低，保留的主体区域越多
                </p>
              </div>
            )}

            {manualMode && (
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-primary)' }}>手动擦除</h3>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  画笔大小: {brushSize}px
                </label>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleRemove}
            disabled={!originalImage || isProcessing}
            style={{
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: originalImage && !isProcessing ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--window-border)',
              color: '#fff',
              cursor: !originalImage || isProcessing ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 600,
              opacity: !originalImage || isProcessing ? 0.6 : 1,
            }}
          >
            {isProcessing ? '⏳ 处理中...' : '🪄 开始移除背景'}
          </button>

          {originalImage && (
            <button
              onClick={() => setManualMode(!manualMode)}
              style={{
                padding: '10px',
                borderRadius: 8,
                border: manualMode ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                background: manualMode ? 'var(--accent-bg)' : 'var(--window-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {manualMode ? '✅ 完成手动编辑' : '✏️ 手动擦除模式'}
            </button>
          )}
        </div>

        <div style={{
          background: 'var(--window-bg)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 400,
        }}>
          {isProcessing && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.8)',
              padding: '20px 40px',
              borderRadius: 12,
              color: '#fff',
              textAlign: 'center',
              zIndex: 10,
            }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>🪄 正在处理...</div>
              <div style={{
                width: 200,
                height: 8,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 4,
                overflow: 'hidden',
                margin: '0 auto',
              }}>
                <div style={{
                  width: `${processingProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, marginTop: 8 }}>{processingProgress}%</div>
            </div>
          )}

          {originalImage ? (
            <div style={{
              display: 'flex',
              gap: 16,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {showCompare && processedResult ? (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>原始图片</div>
                    <canvas
                      ref={tempCanvasRef}
                      style={{
                        maxWidth: 400,
                        maxHeight: 400,
                        borderRadius: 8,
                        border: '1px solid var(--window-border)',
                        backgroundImage: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 20px 20px',
                      }}
                    />
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: 24 }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>处理结果</div>
                    <img
                      src={processedResult.dataUrl}
                      alt="处理结果"
                      style={{
                        maxWidth: 400,
                        maxHeight: 400,
                        borderRadius: 8,
                        border: '1px solid var(--window-border)',
                        backgroundImage: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 20px 20px',
                      }}
                    />
                  </div>
                </>
              ) : (
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 500,
                    borderRadius: 8,
                    border: '1px solid var(--window-border)',
                    cursor: mode === 'color' ? 'crosshair' : manualMode ? 'cell' : 'default',
                    backgroundImage: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 20px 20px',
                  }}
                />
              )}
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🖼️</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>请上传一张图片开始</div>
              <div style={{ fontSize: 12 }}>支持 PNG、JPG、WebP 格式</div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--window-bg)',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
          }}>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              {originalImage && (
                <>
                  <span>📐 {canvasRef.current?.width} × {canvasRef.current?.height}</span>
                  <span>🎨 模式: {modes.find(m => m.id === mode)?.name}</span>
                  {selectedColor && <span>🎯 RGB({selectedColor.r},{selectedColor.g},{selectedColor.b})</span>}
                </>
              )}
              {processedResult && (
                <span style={{ color: 'var(--accent)' }}>✅ 处理完成</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {processedResult && (
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {showCompare ? '🔍 编辑模式' : '👁️ 对比模式'}
                </button>
              )}
              {processedResult && (
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  💾 下载 PNG
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
