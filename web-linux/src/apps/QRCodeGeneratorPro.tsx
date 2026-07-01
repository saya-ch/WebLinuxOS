import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { QrCode, Download, Copy, Share2, Palette, History } from 'lucide-react'

interface QRHistory {
  content: string
  timestamp: Date
}

const STORAGE_KEY = 'weblinux-qr-history'

export default function QRCodeGeneratorPro() {
  const [content, setContent] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [size, setSize] = useState(300)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<QRHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const addNotification = useStore((s) => s.addNotification)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved).map((item: QRHistory) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      }
    } catch {}
  }, [])

  // 使用 QRCode.js 库生成二维码 (通过 CDN 加载)
  useEffect(() => {
    // 动态加载 QRCode 库
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
    script.async = true
    document.head.appendChild(script)
    
    script.onload = () => {
      console.log('QRCode library loaded')
    }
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // 生成二维码
  const generateQR = useCallback(async () => {
    if (!content.trim()) {
      addNotification({
        title: '提示',
        message: '请输入要生成二维码的内容',
        type: 'warning'
      })
      return
    }

    setLoading(true)
    
    try {
      // 使用 goQR.me API（免费，无需密钥）
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&ecc=${errorLevel}`
      
      setQrUrl(url)
      
      // 保存历史
      const newEntry: QRHistory = {
        content: content.trim(),
        timestamp: new Date()
      }
      const newHistory = [newEntry, ...history.filter(h => h.content !== content.trim())].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      
      addNotification({
        title: '生成成功',
        message: '二维码已生成',
        type: 'success',
        duration: 2000
      })
    } catch (err) {
      addNotification({
        title: '生成失败',
        message: err instanceof Error ? err.message : '二维码生成失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [content, size, fgColor, bgColor, errorLevel, history, addNotification])

  // 下载二维码
  const downloadQR = useCallback(() => {
    if (!qrUrl) return
    
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    addNotification({
      title: '下载成功',
      message: '二维码已保存到本地',
      type: 'success',
      duration: 2000
    })
  }, [qrUrl, addNotification])

  // 复制二维码链接
  const copyUrl = useCallback(async () => {
    if (!qrUrl) return
    
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addNotification({
        title: '复制成功',
        message: '二维码链接已复制',
        type: 'success',
        duration: 2000
      })
    } catch {
      addNotification({
        title: '复制失败',
        message: '无法复制到剪贴板',
        type: 'error'
      })
    }
  }, [qrUrl, addNotification])

  // 从历史选择
  const selectFromHistory = useCallback((item: QRHistory) => {
    setContent(item.content)
    setShowHistory(false)
  }, [])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e8e8f4',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <QrCode size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>QR码生成器</div>
            <div style={{ fontSize: '12px', color: '#a0a0c8' }}>
              专业版 · 自定义样式
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 12px',
            background: showHistory ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${showHistory ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '8px',
            color: showHistory ? '#8b5cf6' : '#a0a0c8',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <History size={14} />
          历史 ({history.length})
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(139, 92, 246, 0.05)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#a0a0c8', fontSize: '13px', padding: '16px' }}>
              暂无历史记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.slice(0, 10).map((item, index) => (
                <button
                  key={index}
                  onClick={() => selectFromHistory(item)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#e8e8f4',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.content.slice(0, 40)}...
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '10px',
                    color: '#a0a0c8'
                  }}>
                    {item.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '20px', flex: 1 }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            display: 'block',
            color: '#a0a0c8'
          }}>
            内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入网址、文本、电话号码等..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '10px',
              color: '#e8e8f4',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Settings */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '8px',
              display: 'block',
              color: '#a0a0c8'
            }}>
              尺寸: {size}px
            </label>
            <input
              type="range"
              min="100"
              max="500"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#8b5cf6'
              }}
            />
          </div>

          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '8px',
              display: 'block',
              color: '#a0a0c8'
            }}>
              错误纠正级别
            </label>
            <select
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                color: '#e8e8f4',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="L">低 (7%)</option>
              <option value="M">中 (15%)</option>
              <option value="Q">高 (25%)</option>
              <option value="H">最高 (30%)</option>
            </select>
          </div>

          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '8px',
              display: 'block',
              color: '#a0a0c8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Palette size={12} />
              前景色
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '8px',
              display: 'block',
              color: '#a0a0c8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Palette size={12} />
              背景色
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f4',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateQR}
          disabled={!content.trim() || loading}
          style={{
            width: '100%',
            padding: '14px',
            background: content.trim() && !loading
              ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)'
              : 'rgba(139, 92, 246, 0.2)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: content.trim() && !loading ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            opacity: content.trim() && !loading ? 1 : 0.5,
            marginBottom: '20px'
          }}
        >
          {loading ? '生成中...' : '生成二维码'}
        </button>

        {/* QR Display */}
        {qrUrl && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: bgColor,
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <img
              src={qrUrl}
              alt="QR Code"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px'
              }}
            />
          </div>
        )}

        {/* Actions */}
        {qrUrl && (
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <button
              onClick={downloadQR}
              style={{
                padding: '10px 16px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                color: '#22c55e',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              下载
            </button>
            <button
              onClick={copyUrl}
              style={{
                padding: '10px 16px',
                background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                borderRadius: '8px',
                color: copied ? '#22c55e' : '#8b5cf6',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Copy size={14} />
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '11px',
        color: '#a0a0c8',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        使用 goQR.me API · 免费 · 支持自定义颜色和大小
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}