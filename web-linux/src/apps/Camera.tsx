import { useState, useRef, useEffect, useCallback } from 'react'

type FilterOption = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'saturate'

interface FilterConfig {
  key: FilterOption
  label: string
  css: string
  canvas: string
}

const FILTERS: FilterConfig[] = [
  { key: 'none', label: '正常', css: 'none', canvas: 'none' },
  { key: 'grayscale', label: '灰度', css: 'grayscale(100%)', canvas: 'grayscale(100%)' },
  { key: 'invert', label: '反转', css: 'invert(100%)', canvas: 'invert(100%)' },
  { key: 'sepia', label: '复古', css: 'sepia(100%)', canvas: 'sepia(100%)' },
  { key: 'blur', label: '模糊', css: 'blur(3px)', canvas: 'blur(3px)' },
  { key: 'saturate', label: '饱和', css: 'saturate(200%)', canvas: 'saturate(200%)' },
]

type CameraErrorType = 'unsupported' | 'denied' | 'notfound' | 'unknown' | null

function getErrorInfo(error: CameraErrorType): { icon: string; title: string; detail: string } {
  switch (error) {
    case 'unsupported':
      return { icon: '🚫', title: '浏览器不支持摄像头', detail: '您的浏览器不支持 getUserMedia API，请使用现代浏览器（Chrome、Firefox、Edge 等）' }
    case 'denied':
      return { icon: '🔒', title: '摄像头权限被拒绝', detail: '请在浏览器地址栏中点击锁图标，允许摄像头访问后刷新页面' }
    case 'notfound':
      return { icon: '📷', title: '未检测到摄像头', detail: '未找到可用的摄像头设备，请确认设备已正确连接' }
    default:
      return { icon: '⚠️', title: '摄像头启动失败', detail: '无法访问摄像头，请检查设备连接和权限设置' }
  }
}

const isCameraSupported = !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [filter, setFilter] = useState<FilterOption>('none')
  const [photos, setPhotos] = useState<string[]>([])
  const [cameraError, setCameraError] = useState<CameraErrorType>(isCameraSupported ? null : 'unsupported')
  const [flash, setFlash] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('photo.png')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isCameraSupported) return

    let cancelled = false

    const init = async () => {
      stopStream()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
            if (!cancelled) {
              setStreaming(true)
              setCameraError(null)
            }
          } catch {
            if (!cancelled) {
              setCameraError('unknown')
            }
          }
        }
      } catch (err: unknown) {
        if (cancelled) return
        const domErr = err as DOMException
        if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
          setCameraError('denied')
        } else if (domErr.name === 'NotFoundError' || domErr.name === 'DevicesNotFoundError') {
          setCameraError('notfound')
        } else {
          setCameraError('unknown')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [facingMode, stopStream])

  const retryCamera = useCallback(() => {
    setCameraError(null)
    setFacingMode((prev) => prev)
  }, [])

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !streaming) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentFilter = FILTERS.find((f) => f.key === filter)
    if (currentFilter && currentFilter.canvas !== 'none') {
      ctx.filter = currentFilter.canvas
    } else {
      ctx.filter = 'none'
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'

    const dataUrl = canvas.toDataURL('image/png')
    setPhotos((prev) => [dataUrl, ...prev].slice(0, 20))

    setFlash(true)
    setTimeout(() => setFlash(false), 200)
  }

  const toggleCamera = () => {
    setStreaming(false)
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  const openPreview = (photo: string) => {
    setDownloadName(`photo-${photos.length}.png`)
    setPreviewPhoto(photo)
  }

  const currentFilterConfig = FILTERS.find((f) => f.key === filter)!
  const videoStyle: React.CSSProperties = {
    filter: currentFilterConfig.css,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
  }

  const errorInfo = cameraError ? getErrorInfo(cameraError) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', minHeight: 0 }}>
        <div style={{ flex: 1, background: '#11111b', borderRadius: '8px', overflow: 'hidden', position: 'relative', minHeight: '180px' }}>
          {cameraError ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: '8px', padding: '16px',
            }}>
              <span style={{ fontSize: '48px' }}>{errorInfo?.icon}</span>
              <span style={{ color: '#f38ba8', fontSize: '14px', fontWeight: 600 }}>{errorInfo?.title}</span>
              <span style={{ color: '#a6adc8', fontSize: '11px', textAlign: 'center', lineHeight: 1.5 }}>{errorInfo?.detail}</span>
              <button
                onClick={retryCamera}
                style={{
                  marginTop: '8px', padding: '6px 16px', border: 'none', borderRadius: '6px',
                  background: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                }}
              >
                重试
              </button>
            </div>
          ) : !streaming ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{
                width: '48px', height: '48px', border: '3px solid #45475a', borderTopColor: '#89b4fa',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <span style={{ color: '#a6adc8', fontSize: '12px' }}>正在启动摄像头…</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={videoStyle}
            />
          )}

          {flash && (
            <div style={{
              position: 'absolute', inset: 0, background: '#fff', borderRadius: '8px',
              opacity: 0.6, pointerEvents: 'none', transition: 'opacity 0.2s ease-out',
            }} />
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={takePhoto}
            disabled={!streaming}
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: streaming ? '#f38ba8' : '#45475a',
              border: '3px solid #fff', cursor: streaming ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              transition: 'background 0.2s',
            }}
          >
            📸
          </button>

          {streaming && (
            <button
              onClick={toggleCamera}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#313244', border: '1px solid #45475a', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                color: '#cdd6f4',
              }}
              title="切换前后摄像头"
            >
              🔄
            </button>
          )}

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                  background: filter === f.key ? '#89b4fa' : '#313244',
                  color: filter === f.key ? '#1e1e2e' : '#cdd6f4',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {photos.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>相册 ({photos.length})</div>
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              {photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`photo-${i}`}
                  onClick={() => openPreview(photo)}
                  style={{
                    width: '48px', height: '36px', borderRadius: '4px',
                    objectFit: 'cover', border: '1px solid #45475a',
                    cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.borderColor = '#89b4fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = '#45475a'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px', zIndex: 10, cursor: 'pointer',
          }}
        >
          <img
            src={previewPhoto}
            alt="preview"
            style={{ maxWidth: '90%', maxHeight: '75%', borderRadius: '8px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={previewPhoto}
              download={downloadName}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '6px 16px', borderRadius: '6px', background: '#89b4fa',
                color: '#1e1e2e', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💾 保存
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreviewPhoto(null)
              }}
              style={{
                padding: '6px 16px', borderRadius: '6px', background: '#45475a',
                color: '#cdd6f4', border: 'none', fontSize: '12px', cursor: 'pointer',
              }}
            >
              ✕ 关闭
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
