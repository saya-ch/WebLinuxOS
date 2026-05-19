import { useState } from 'react'

const sampleImages = [
  {
    name: '几何图案', render: () => (
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e94560" /><stop offset="100%" stopColor="#0f3460" />
          </linearGradient>
          <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ecca3" /><stop offset="100%" stopColor="#f5c542" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#g1)" />
        <circle cx="200" cy="150" r="80" fill="url(#g2)" opacity="0.8" />
        <rect x="120" y="70" width="160" height="160" rx="20" fill="none" stroke="#fff" strokeWidth="3" opacity="0.6" transform="rotate(45 200 150)" />
        <polygon points="200,50 260,180 140,180" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
      </svg>
    )
  },
  {
    name: '渐变色块', render: () => (
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" /><stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#g3)" />
        <circle cx="80" cy="80" r="50" fill="rgba(255,255,255,0.15)" />
        <circle cx="320" cy="80" r="70" fill="rgba(255,255,255,0.1)" />
        <circle cx="200" cy="200" r="90" fill="rgba(255,255,255,0.12)" />
        <circle cx="100" cy="250" r="40" fill="rgba(255,255,255,0.08)" />
        <circle cx="340" cy="220" r="55" fill="rgba(255,255,255,0.1)" />
      </svg>
    )
  },
  {
    name: '星空夜景', render: () => (
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="star1"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        </defs>
        <rect width="400" height="300" fill="#0a0a2e" />
        <rect width="400" height="300" fill="url(#g3)" opacity="0.3" />
        <circle cx="300" cy="80" r="30" fill="#f5c542" opacity="0.9" />
        <circle cx="300" cy="80" r="40" fill="#f5c542" opacity="0.2" />
        {Array.from({ length: 50 }, (_, i) => (
          <circle key={i} cx={Math.random() * 400} cy={Math.random() * 300} r={Math.random() * 2 + 0.5}
            fill="#fff" opacity={Math.random() * 0.8 + 0.2} />
        ))}
        <rect x="0" y="200" width="400" height="100" fill="#0f0f3a" opacity="0.8" />
        <polygon points="0,200 20,180 40,200 60,170 80,200 100,160 120,200 140,175 160,200 180,165 200,200 220,180 240,200 260,170 280,200 300,175 320,200 340,160 360,200 380,170 400,200" fill="#0f0f3a" />
        <polygon points="0,220 30,200 60,220 90,195 120,220 150,200 180,220 210,190 240,220 270,200 300,220 330,195 360,220 390,200 400,210 400,300 0,300" fill="#0a0a2e" />
      </svg>
    )
  },
  {
    name: '波浪线条', render: () => (
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#1a1a2e" />
        <path d="M0,150 C100,50 200,250 400,150" fill="none" stroke="#e94560" strokeWidth="4" opacity="0.8" />
        <path d="M0,180 C100,80 200,280 400,180" fill="none" stroke="#f5c542" strokeWidth="4" opacity="0.6" />
        <path d="M0,120 C100,20 200,220 400,120" fill="none" stroke="#4ecca3" strokeWidth="4" opacity="0.7" />
        <path d="M0,210 C100,110 200,310 400,210" fill="none" stroke="#7b68ee" strokeWidth="4" opacity="0.5" />
        <path d="M0,90 C100,-10 200,190 400,90" fill="none" stroke="#ff6b6b" strokeWidth="3" opacity="0.5" />
      </svg>
    )
  },
  {
    name: '抽象艺术', render: () => (
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#2d2d2d" />
        <rect x="50" y="50" width="100" height="80" rx="10" fill="#e94560" opacity="0.7" />
        <rect x="160" y="30" width="80" height="130" rx="40" fill="#4ecca3" opacity="0.6" />
        <rect x="250" y="70" width="90" height="90" rx="5" fill="#f5c542" opacity="0.7" transform="rotate(15 295 115)" />
        <circle cx="100" cy="210" r="45" fill="#7b68ee" opacity="0.6" />
        <circle cx="230" cy="200" r="35" fill="#48dbfb" opacity="0.5" />
        <rect x="280" y="180" width="70" height="70" rx="35" fill="#ff6b6b" opacity="0.5" />
        <line x1="30" y1="140" x2="370" y2="140" stroke="#fff" strokeWidth="1" opacity="0.15" />
        <line x1="200" y1="20" x2="200" y2="280" stroke="#fff" strokeWidth="1" opacity="0.15" />
      </svg>
    )
  },
  {
    name: '棋盘格', render: () => (
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#f0f0f0" />
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => (
            <rect key={`${r}-${c}`} x={c * 40} y={r * 37.5} width={40} height={37.5}
              fill={(r + c) % 2 === 0 ? '#333' : '#e94560'} opacity={(r + c) % 2 === 0 ? 0.9 : 0.7} />
          ))
        )}
      </svg>
    )
  },
]

export default function ImageViewer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'original'>('fit')

  const handlePrev = () => setCurrentIndex((p) => (p > 0 ? p - 1 : sampleImages.length - 1))
  const handleNext = () => setCurrentIndex((p) => (p < sampleImages.length - 1 ? p + 1 : 0))
  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4))
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25))
  const fitToWindow = () => { setFitMode('fit'); setScale(1) }
  const actualSize = () => { setFitMode('original'); setScale(1) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #333' }}>
        <button onClick={handlePrev} style={imgBtn}>◀ 上一张</button>
        <button onClick={handleNext} style={imgBtn}>下一张 ▶</button>
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 4px' }} />
        <button onClick={zoomOut} style={imgBtn}>🔍−</button>
        <span style={{ fontSize: 12, color: '#aaa', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} style={imgBtn}>🔍+</button>
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 4px' }} />
        <button onClick={fitToWindow} style={{ ...imgBtn, background: fitMode === 'fit' ? '#007acc' : 'transparent' }}>适应窗口</button>
        <button onClick={actualSize} style={{ ...imgBtn, background: fitMode === 'original' ? '#007acc' : 'transparent' }}>原始尺寸</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#aaa' }}>{currentIndex + 1} / {sampleImages.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', overflow: 'hidden', position: 'relative' }}>
        <button onClick={handlePrev} style={{ ...navArrow, left: 8 }}>‹</button>
        <div style={{
          transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.2s',
          maxWidth: fitMode === 'fit' ? '90%' : 'none', maxHeight: fitMode === 'fit' ? '90%' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto'
        }}>
          <div style={{ width: 640, height: 480, maxWidth: '100%', maxHeight: '100%' }}>
            {sampleImages[currentIndex].render()}
          </div>
        </div>
        <button onClick={handleNext} style={{ ...navArrow, right: 8 }}>›</button>
      </div>

      <div style={{ background: '#252526', borderTop: '1px solid #333', padding: '6px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 6, padding: '0 8px', overflow: 'auto' }}>
          {sampleImages.map((img, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0, width: 64, height: 48, cursor: 'pointer', borderRadius: 4, overflow: 'hidden',
                border: i === currentIndex ? '2px solid #007acc' : '2px solid transparent',
                opacity: i === currentIndex ? 1 : 0.6
              }}
              onClick={() => setCurrentIndex(i)}
            >
              <div style={{ width: '100%', height: '100%', transform: 'scale(0.16)', transformOrigin: 'top left' }}>
                {img.render()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const imgBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer',
  padding: '4px 10px', borderRadius: 3, fontSize: 12
}

const navArrow: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
  background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer',
  fontSize: 36, padding: '8px 12px', borderRadius: 4, lineHeight: 1
}