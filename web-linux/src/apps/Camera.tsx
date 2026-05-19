import { useState, useRef, useEffect } from 'react'

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [filter, setFilter] = useState('none')
  const [photos, setPhotos] = useState<string[]>([])
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setStreaming(true)
        }
      } catch {
        setCameraError(true)
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (filter !== 'none') {
      ctx.filter = getFilterValue(filter)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/png')
    setPhotos((prev) => [dataUrl, ...prev].slice(0, 8))
    ctx.filter = 'none'
  }

  const getFilterValue = (f: string): string => {
    switch (f) {
      case 'grayscale': return 'grayscale(100%)'
      case 'sepia': return 'sepia(100%)'
      case 'invert': return 'invert(100%)'
      case 'blur': return 'blur(3px)'
      case 'saturate': return 'saturate(200%)'
      default: return 'none'
    }
  }

  const videoStyle: React.CSSProperties = {
    filter: getFilterValue(filter),
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px' }}>
        <div style={{ flex: 1, background: '#11111b', borderRadius: '8px', overflow: 'hidden', position: 'relative', minHeight: '180px' }}>
          {cameraError || !streaming ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: '8px',
            }}>
              <span style={{ fontSize: '48px' }}>📷</span>
              <span style={{ color: '#a6adc8', fontSize: '13px' }}>
                {cameraError ? '无法访问摄像头 (模拟模式)' : '摄像头已就绪'}
              </span>
              <div style={{
                width: '100px', height: '100px', background: '#313244', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
              }}>
                🎥
              </div>
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
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={takePhoto}
            style={{
              width: '48px', height: '48px', borderRadius: '50%', background: '#f38ba8',
              border: '3px solid #fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}
          >
            📸
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { key: 'none', label: '无' },
              { key: 'grayscale', label: '黑白' },
              { key: 'sepia', label: '复古' },
              { key: 'invert', label: '反转' },
              { key: 'blur', label: '模糊' },
              { key: 'saturate', label: '饱和' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                  background: filter === f.key ? '#89b4fa' : '#313244',
                  color: filter === f.key ? '#1e1e2e' : '#cdd6f4',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {photos.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>相册 ({photos.length})</div>
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`photo-${i}`}
                  style={{
                    width: '48px', height: '36px', borderRadius: '4px',
                    objectFit: 'cover', border: '1px solid #45475a',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}