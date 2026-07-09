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

const LiveWallpaper = memo(function LiveWallpaper() {
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const liveWallpaper = useStore((s) => s.liveWallpaper)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [time, setTime] = useState(Date.now())
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const initParticles = useCallback((count: number = 60): Particle[] => {
    const colors = [
      'rgba(139, 92, 246, 1)',    // Purple
      'rgba(6, 182, 212, 1)',      // Cyan
      'rgba(155, 138, 240, 1)',   // Light purple
      'rgba(124, 108, 240, 1)',   // Deep purple
      'rgba(168, 85, 247, 1)',    // Violet
    ]
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 5 + 1.5,
      opacity: Math.random() * 0.7 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2
    }))
  }, [])

  const [particles, setParticles] = useState<Particle[]>(initParticles(60))

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

    const targetParticles = liveWallpaper === 'interactive' ? 80 : 50
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

            if (newX < 0 || newX > 100) {
              newVx = -newVx * 0.95
              newX = Math.max(0, Math.min(100, newX))
            }
            if (newY < 0 || newY > 100) {
              newVy = -newVy * 0.95
              newY = Math.max(0, Math.min(100, newY))
            }

            if (liveWallpaper === 'interactive') {
              const dx = mousePos.x - newX
              const dy = mousePos.y - newY
              const dist = Math.sqrt(dx * dx + dy * dy)
              const influence = Math.max(0, 1 - dist / 30)

              newVx -= (dx / dist || 0) * influence * 0.02
              newVy -= (dy / dist || 0) * influence * 0.02
            }

            newVx += (Math.random() - 0.5) * 0.005
            newVy += (Math.random() - 0.5) * 0.005

            const maxSpeed = 0.4
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
              vy: newVy
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
        return 'radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(6, 182, 212, 0.12) 0%, transparent 50%)'
      case 'interactive':
        return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(139, 92, 246, 0.2) 0%, transparent 40%), radial-gradient(circle at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(6, 182, 212, 0.15) 0%, transparent 40%)`
      case 'waves':
        return 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(236, 72, 153, 0.06) 100%)'
      default:
        return ''
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
        transition: liveWallpaper === 'interactive' ? 'background 0.3s ease' : 'none'
      }}
    >
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
            background: `rgba(139, 92, 246, ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 2}px rgba(139, 92, 246, ${p.opacity * 0.5}), 0 0 ${p.size * 4}px rgba(6, 182, 212, ${p.opacity * 0.3})`,
            transform: 'translate(-50%, -50%)',
            willChange: 'left, top',
            transition: 'left 16ms linear, top 16ms linear'
          }}
        />
      ))}

      {liveWallpaper === 'waves' && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.6
          }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.3)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 0.4)" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 ${50 + Math.sin(time / 1000) * 10} Q 25 ${30 + Math.sin(time / 800) * 15} 50 ${50 + Math.sin(time / 1200) * 10} T 100 ${50 + Math.sin(time / 1000) * 10}`}
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="2"
            style={{
              animation: 'waveMove 8s ease-in-out infinite'
            }}
          />
        </svg>
      )}

      <style>{`
        @keyframes waveMove {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
      `}</style>
    </div>
  )
})

export default LiveWallpaper
