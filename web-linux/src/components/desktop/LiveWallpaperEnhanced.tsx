import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  phase: number
}

interface Connection {
  from: number
  to: number
  opacity: number
}

const COLORS = [
  '#8b7cf0',   // Purple
  '#06b6d4',   // Cyan
  '#9b8af0',   // Light purple
  '#7c6cf0',   // Deep purple
  '#a855f7',   // Violet
  '#c084fc',   // Light violet
]

const LiveWallpaperEnhanced = memo(function LiveWallpaperEnhanced() {
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const liveWallpaper = useStore((s) => s.liveWallpaper)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [time, setTime] = useState(Date.now())
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const initParticles = useCallback((count: number = 80): Particle[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2
    }))
  }, [])

  const [particles, setParticles] = useState<Particle[]>(initParticles(80))

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }, [])

  useEffect(() => {
    if (!liveWallpaperEnabled) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const targetParticles = liveWallpaper === 'interactive' ? 100 : 70
    if (particles.length !== targetParticles) {
      setParticles(initParticles(targetParticles))
      particlesRef.current = initParticles(targetParticles)
    } else {
      particlesRef.current = particles
    }

    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      if (lastTime === 0) lastTime = currentTime
      const deltaTime = currentTime - lastTime

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)
        setTime(currentTime)

        setParticles(prev => {
          const newParticles = prev.map(p => {
            let newX = p.x + p.vx
            let newY = p.y + p.vy
            let newVx = p.vx
            let newVy = p.vy
            let newOpacity = p.opacity

            // 脉冲效果
            newOpacity = 0.5 + 0.4 * Math.sin(currentTime / 1000 + p.phase)

            // 边界反弹
            if (newX < 0 || newX > 100) {
              newVx = -newVx * 0.92
              newX = Math.max(0, Math.min(100, newX))
            }
            if (newY < 0 || newY > 100) {
              newVy = -newVy * 0.92
              newY = Math.max(0, Math.min(100, newY))
            }

            // 鼠标交互
            if (liveWallpaper === 'interactive') {
              const dx = mousePos.x - newX
              const dy = mousePos.y - newY
              const dist = Math.sqrt(dx * dx + dy * dy)
              const influence = Math.max(0, 1 - dist / 25)

              // 鼠标排斥效果
              newVx -= (dx / dist || 0) * influence * 0.03
              newVy -= (dy / dist || 0) * influence * 0.03
            }

            // 随机漂移
            newVx += (Math.random() - 0.5) * 0.003
            newVy += (Math.random() - 0.5) * 0.003

            // 速度限制
            const maxSpeed = 0.35
            const speed = Math.sqrt(newVx * newVx + newVy * newVy)
            if (speed > maxSpeed) {
              newVx = (newVx / speed) * maxSpeed
              newVy = (newVy / speed) * maxSpeed
            }

            return {
              ...p,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
              opacity: newOpacity
            }
          })

          particlesRef.current = newParticles
          return newParticles
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [liveWallpaperEnabled, liveWallpaper, mousePos, particles.length, initParticles])

  if (!liveWallpaperEnabled) return null

  const getGradient = () => {
    switch (liveWallpaper) {
      case 'particles':
        return `
          radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(6, 182, 212, 0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 70%)
        `
      case 'interactive':
        return `
          radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(139, 92, 246, 0.18) 0%, transparent 35%),
          radial-gradient(circle at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(6, 182, 212, 0.12) 0%, transparent 35%),
          radial-gradient(ellipse at 50% 50%, rgba(124, 108, 240, 0.04) 0%, transparent 80%)
        `
      case 'waves':
        return `
          linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.06) 40%, rgba(168, 85, 247, 0.04) 80%),
          radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.10) 0%, transparent 40%)
        `
      default:
        return ''
    }
  }

  // 计算粒子连接
  const connections: Connection[] = []
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 12) {
        connections.push({
          from: i,
          to: j,
          opacity: Math.max(0, (12 - dist) / 12) * 0.15
        })
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: getGradient(),
        transition: liveWallpaper === 'interactive' ? 'background 0.25s ease' : 'none'
      }}
    >
      {/* 连接线 */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.6
        }}
      >
        {connections.map((conn, idx) => {
          const p1 = particles[conn.from]
          const p2 = particles[conn.to]
          return (
            <line
              key={idx}
              x1={`${p1.x}%`}
              y1={`${p1.y}%`}
              x2={`${p2.x}%`}
              y2={`${p2.y}%`}
              stroke="rgba(139, 92, 246, 1)"
              strokeWidth="0.5"
              opacity={conn.opacity}
              style={{
                transition: 'opacity 0.1s ease'
              }}
            />
          )
        })}
      </svg>

      {/* 粒子 */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `
              0 0 ${p.size * 1.5}px ${p.color},
              0 0 ${p.size * 3}px rgba(139, 92, 246, 0.4)
            `,
            transform: 'translate(-50%, -50%)',
            willChange: 'left, top, opacity',
            opacity: p.opacity,
            transition: 'left 16ms linear, top 16ms linear, opacity 0.3s ease'
          }}
        />
      ))}

      {/* 波浪效果 */}
      {liveWallpaper === 'waves' && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.7
          }}
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.25)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(124, 108, 240, 0.2)" />
              <stop offset="50%" stopColor="rgba(192, 132, 252, 0.15)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.2)" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 ${50 + Math.sin(time / 1000) * 12} Q 25 ${30 + Math.sin(time / 800) * 18} 50 ${50 + Math.sin(time / 1200) * 12} T 100 ${50 + Math.sin(time / 1000) * 12}`}
            fill="none"
            stroke="url(#waveGradient1)"
            strokeWidth="2"
          />
          <path
            d={`M 0 ${60 + Math.sin(time / 1100) * 10} Q 25 ${40 + Math.sin(time / 900) * 15} 50 ${60 + Math.sin(time / 1300) * 10} T 100 ${60 + Math.sin(time / 1100) * 10}`}
            fill="none"
            stroke="url(#waveGradient2)"
            strokeWidth="1.5"
          />
          <path
            d={`M 0 ${70 + Math.sin(time / 1200) * 8} Q 25 ${50 + Math.sin(time / 1000) * 12} 50 ${70 + Math.sin(time / 1400) * 8} T 100 ${70 + Math.sin(time / 1200) * 8}`}
            fill="none"
            stroke="rgba(168, 85, 247, 0.2)"
            strokeWidth="1"
          />
        </svg>
      )}

      {/* 网格效果 */}
      {liveWallpaper === 'particles' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            opacity: 0.5,
            animation: 'gridShift 20s linear infinite'
          }}
        />
      )}

      {/* 背景光晕 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 60%),
            radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(6, 182, 212, 0.08) 0%, transparent 30%)
          `,
          opacity: liveWallpaper === 'interactive' ? 1 : 0.6,
          transition: 'opacity 0.5s ease'
        }}
      />

      <style>{`
        @keyframes gridShift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
      `}</style>
    </div>
  )
})

export default LiveWallpaperEnhanced