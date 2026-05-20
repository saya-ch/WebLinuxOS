import { useState, useRef, useEffect, useCallback } from 'react'

const PLAYLIST = [
  { title: '粒子宇宙', duration: 180, color: '#e94560' },
  { title: '波形律动', duration: 240, color: '#0f3460' },
  { title: '霓虹脉冲', duration: 150, color: '#4ecca3' },
  { title: '星尘旋涡', duration: 200, color: '#f5c542' },
  { title: '数字雨', duration: 160, color: '#7b68ee' },
]

export default function VideoPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; life: number }>>([])
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentVideo = PLAYLIST[currentIndex]
  const totalSeconds = currentVideo.duration

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const initParticles = useCallback((w: number, h: number) => {
    const particles: typeof particlesRef.current = []
    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: currentVideo.color,
        life: Math.random(),
      })
    }
    particlesRef.current = particles
  }, [currentVideo.color])

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const elapsed = (timestamp - startTimeRef.current) / 1000 * playbackRate
    setCurrentTime(Math.min(elapsed, totalSeconds))

    if (elapsed >= totalSeconds) {
      setIsPlaying(false)
      return
    }

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0, 0, w, h)

    const idx = currentIndex
    if (idx === 0) {
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.002
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        if (p.life <= 0) {
          p.x = Math.random() * w
          p.y = Math.random() * h
          p.life = 1
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(233, 69, 96, ${p.life})`
        ctx.fill()
      })
      particlesRef.current.forEach((p, i) => {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(233, 69, 96, ${0.3 * (1 - dist / 80)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
    } else if (idx === 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y = h / 2 + Math.sin(x * 0.02 + elapsed * 2 + i * 0.8) * (40 + i * 20) + Math.sin(x * 0.005 + elapsed * 0.5) * 30
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        const colors = ['#e94560', '#f5c542', '#4ecca3', '#7b68ee', '#ff6b6b']
        ctx.strokeStyle = colors[i]
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    } else if (idx === 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + elapsed * 0.5
        const radius = 80 + Math.sin(elapsed * 2 + i) * 40
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius
        const size = 5 + Math.sin(elapsed * 3 + i * 0.5) * 3
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(78, 204, 163, ${0.5 + Math.sin(elapsed + i) * 0.3})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(78, 204, 163, 0.1)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(cx, cy, 20 + Math.sin(elapsed * 4) * 10, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(78, 204, 163, 0.3)'
      ctx.fill()
    } else if (idx === 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      for (let i = 0; i < 300; i++) {
        const angle = i * 0.1 + elapsed * 0.3
        const dist = i * 0.8 + Math.sin(elapsed + i * 0.05) * 20
        const px = cx + Math.cos(angle) * dist
        const py = cy + Math.sin(angle) * dist
        if (px >= 0 && px <= w && py >= 0 && py <= h) {
          const size = 1 + (i % 3)
          ctx.beginPath()
          ctx.arc(px, py, size, 0, Math.PI * 2)
          const hue = (i * 2 + elapsed * 20) % 360
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.7)`
          ctx.fill()
        }
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(0, 0, w, h)
      const cols = Math.floor(w / 14)
      for (let c = 0; c < cols; c++) {
        const charH = Math.floor(Math.random() * 20 + 5)
        for (let j = 0; j < charH; j++) {
          const y = (Math.floor(elapsed * 10 + c * 7) + j) % Math.ceil(h / 14) * 14
          if (y < h) {
            const char = String.fromCharCode(0x30A0 + Math.random() * 96)
            ctx.fillStyle = j === 0 ? '#fff' : `rgba(123, 104, 238, ${0.8 - j * 0.04})`
            ctx.font = '14px monospace'
            ctx.fillText(char, c * 14, y)
          }
        }
      }
    }

    animRef.current = requestAnimationFrame(drawFrame)
  }, [currentIndex, playbackRate, totalSeconds])

  const play = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * (window.devicePixelRatio || 1)
    canvas.height = rect.height * (window.devicePixelRatio || 1)
    initParticles(canvas.width, canvas.height)

    startTimeRef.current = performance.now() - pausedTimeRef.current * 1000 / playbackRate
    setIsPlaying(true)
    animRef.current = requestAnimationFrame(drawFrame)
  }, [drawFrame, initParticles, playbackRate])

  const pause = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    setIsPlaying(false)
    pausedTimeRef.current = currentTime
  }, [currentTime])

  const handlePlayPause = () => {
    if (isPlaying) pause()
    else play()
  }

  const handlePrev = () => {
    cancelAnimationFrame(animRef.current)
    setIsPlaying(false)
    setCurrentTime(0)
    pausedTimeRef.current = 0
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : PLAYLIST.length - 1)
  }

  const handleNext = () => {
    cancelAnimationFrame(animRef.current)
    setIsPlaying(false)
    setCurrentTime(0)
    pausedTimeRef.current = 0
    setCurrentIndex(currentIndex < PLAYLIST.length - 1 ? currentIndex + 1 : 0)
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseInt(e.target.value)
    setCurrentTime(t)
    pausedTimeRef.current = t
    if (isPlaying) {
      startTimeRef.current = performance.now() - t * 1000 / playbackRate
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false) }, 3000)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    setVolume(v)
    setIsMuted(v === 0)
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <div
        style={{ flex: 1, position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { if (isPlaying) setShowControls(false) }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onClick={handlePlayPause}
        />

        {!isPlaying && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{currentVideo.title}</div>
            <div style={{ fontSize: 13, color: '#aaa' }}>{formatTime(totalSeconds)}</div>
            <div style={{
              padding: '12px 28px', borderRadius: 8, background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer', backdropFilter: 'blur(4px)',
            }} onClick={handlePlayPause}>
              <span style={{ fontSize: 36 }}>▶</span>
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 12px 8px',
          opacity: showControls || !isPlaying ? 1 : 0, transition: 'opacity 0.3s',
        }}>
          <div style={{ marginBottom: 4 }}>
            <input
              type="range"
              min={0}
              max={totalSeconds}
              value={Math.min(currentTime, totalSeconds)}
              onChange={seek}
              style={{ width: '100%', accentColor: currentVideo.color, height: 3, margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handlePlayPause} style={vidBtn}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={handlePrev} style={vidBtn}>⏮</button>
            <button onClick={handleNext} style={vidBtn}>⏭</button>
            <span style={{ fontSize: 11, color: '#aaa' }}>{formatTime(currentTime)} / {formatTime(totalSeconds)}</span>
            <div style={{ flex: 1 }} />
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              style={{ background: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: 3, fontSize: 11, padding: '2px 4px', cursor: 'pointer' }}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                <option key={r} value={r} style={{ background: '#333' }}>{r}x</option>
              ))}
            </select>
            <button onClick={() => { setIsMuted(!isMuted); setVolume(isMuted ? 50 : 0) }} style={vidBtn}>{isMuted ? '🔇' : '🔊'}</button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: 60, accentColor: currentVideo.color, height: 3 }}
            />
            <button onClick={() => setIsFullscreen(!isFullscreen)} style={vidBtn}>⛶</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderTop: '1px solid #333', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#aaa' }}>播放列表</div>
        <div style={{ display: 'flex', overflow: 'auto', padding: '0 8px 8px', gap: 8 }}>
          {PLAYLIST.map((vid, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0, width: 140, cursor: 'pointer', borderRadius: 6, overflow: 'hidden',
                border: i === currentIndex ? '2px solid ' + vid.color : '2px solid transparent',
              }}
              onClick={() => {
                cancelAnimationFrame(animRef.current)
                setIsPlaying(false)
                setCurrentTime(0)
                pausedTimeRef.current = 0
                setCurrentIndex(i)
              }}
            >
              <div style={{ height: 78, background: vid.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.8 }}>
                🎬
              </div>
              <div style={{ padding: '6px 8px', background: '#222' }}>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {vid.title}
                </div>
                <div style={{ fontSize: 10, color: '#888' }}>{formatTime(vid.duration)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const vidBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
  fontSize: 16, padding: '4px 6px', borderRadius: 3
}
