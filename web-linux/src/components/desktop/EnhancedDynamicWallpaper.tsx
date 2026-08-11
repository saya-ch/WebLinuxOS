import { memo, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store'

const EnhancedDynamicWallpaper = memo(function EnhancedDynamicWallpaper() {
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const liveWallpaper = useStore((s) => s.liveWallpaper)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const isPausedRef = useRef(false)

  const shouldRender = liveWallpaperEnabled && (
    liveWallpaper === 'particles' || 
    liveWallpaper === 'flow-field' || 
    liveWallpaper === 'gradient-wave' ||
    liveWallpaper === 'constellation'
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX / window.innerWidth
    mouseRef.current.y = e.clientY / window.innerHeight
  }, [])

  const handleVisibilityChange = useCallback(() => {
    isPausedRef.current = document.hidden
  }, [])

  useEffect(() => {
    if (!shouldRender) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isLowEnd = (navigator as any).hardwareConcurrency 
      ? (navigator as any).hardwareConcurrency <= 4 
      : false

    let w = window.innerWidth
    let h = window.innerHeight

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isLowEnd ? 1.5 : 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (liveWallpaper === 'particles') {
      // 粒子系统
      const particleCount = isLowEnd ? 60 : 120
      const particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 0.5,
        hue: Math.random() * 360,
        life: Math.random() * 1,
        lifeSpeed: 0.005 + Math.random() * 0.01
      }))

      const render = (timestamp: number) => {
        if (isPausedRef.current) {
          animationRef.current = requestAnimationFrame(render)
          return
        }

        ctx.fillStyle = 'rgba(10, 10, 20, 0.15)'
        ctx.fillRect(0, 0, w, h)

        const m = mouseRef.current

        particles.forEach((p) => {
          // 鼠标交互
          const dx = m.x * w - p.x
          const dy = m.y * h - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            const force = (150 - dist) / 150
            p.vx -= (dx / dist) * force * 0.5
            p.vy -= (dy / dist) * force * 0.5
          }

          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.99
          p.vy *= 0.99

          if (p.x < 0) p.x = w
          if (p.x > w) p.x = 0
          if (p.y < 0) p.y = h
          if (p.y > h) p.y = 0

          p.life += p.lifeSpeed
          const alpha = Math.sin(p.life * Math.PI * 2) * 0.5 + 0.5

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue + timestamp * 0.02}, 70%, 60%, ${alpha})`
          ctx.fill()
        })

        // 粒子连线
        ctx.globalCompositeOperation = 'lighter'
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist < 100) {
              const alpha = (1 - dist / 100) * 0.2
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }
        ctx.globalCompositeOperation = 'source-over'

        animationRef.current = requestAnimationFrame(render)
      }

      animationRef.current = requestAnimationFrame(render)
    } else if (liveWallpaper === 'flow-field') {
      // 流场
      const scale = 0.003

      const render = (timestamp: number) => {
        if (isPausedRef.current) {
          animationRef.current = requestAnimationFrame(render)
          return
        }

        ctx.fillStyle = 'rgba(5, 5, 15, 0.1)'
        ctx.fillRect(0, 0, w, h)

        const m = mouseRef.current
        const time = timestamp * 0.0005

        // 绘制流线
        const stepSize = isLowEnd ? 15 : 8
        const maxSteps = 100

        for (let i = 0; i < 50; i++) {
          let x = Math.random() * w
          let y = Math.random() * h
          ctx.beginPath()
          ctx.moveTo(x, y)

          for (let step = 0; step < maxSteps; step++) {
            const nx = x * scale + m.x * 2 - 1
            const ny = y * scale + m.y * 2 - 1
            const angle = Math.sin(nx * 2 + time) * Math.cos(ny * 2 - time) * Math.PI +
                         Math.sin(nx + ny + time * 0.5) * Math.PI
            
            x += Math.cos(angle) * stepSize
            y += Math.sin(angle) * stepSize

            if (x < 0 || x > w || y < 0 || y > h) break
            ctx.lineTo(x, y)
          }

          const hue = (timestamp * 0.02 + i * 10) % 360
          ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.3)`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        animationRef.current = requestAnimationFrame(render)
      }

      animationRef.current = requestAnimationFrame(render)
    } else if (liveWallpaper === 'gradient-wave') {
      // 渐变波浪
      const render = (timestamp: number) => {
        if (isPausedRef.current) {
          animationRef.current = requestAnimationFrame(render)
          return
        }

        const m = mouseRef.current
        const time = timestamp * 0.0003

        // 多层渐变
        const colors = [
          { hue: 250, y: 0.3, amplitude: 0.15, frequency: 0.005, speed: 1 },
          { hue: 280, y: 0.5, amplitude: 0.12, frequency: 0.004, speed: -0.8 },
          { hue: 200, y: 0.7, amplitude: 0.1, frequency: 0.006, speed: 0.6 },
          { hue: 180, y: 0.85, amplitude: 0.08, frequency: 0.003, speed: -0.4 },
        ]

        colors.forEach((c, i) => {
          ctx.beginPath()
          ctx.moveTo(0, h)
          
          const mouseInfluence = (m.x - 0.5) * 50
          
          for (let x = 0; x <= w; x += 5) {
            const wave = Math.sin(x * c.frequency + time * c.speed + i) * c.amplitude * h
            const mouseEffect = Math.sin((x + mouseInfluence) * 0.01 + time) * 20
            const y = h * c.y + wave + mouseEffect
            ctx.lineTo(x, y)
          }
          
          ctx.lineTo(w, h)
          ctx.closePath()

          const gradient = ctx.createLinearGradient(0, 0, 0, h)
          gradient.addColorStop(0, `hsla(${c.hue}, 70%, 40%, 0.4)`)
          gradient.addColorStop(1, `hsla(${c.hue}, 80%, 20%, 0.8)`)
          ctx.fillStyle = gradient
          ctx.fill()
        })

        // 星空背景
        ctx.fillStyle = '#050510'
        ctx.fillRect(0, 0, w, h)

        // 重新绘制波浪在星空上
        colors.forEach((c, i) => {
          ctx.beginPath()
          ctx.moveTo(0, h)
          
          for (let x = 0; x <= w; x += 5) {
            const wave = Math.sin(x * c.frequency + time * c.speed + i) * c.amplitude * h
            const y = h * c.y + wave
            ctx.lineTo(x, y)
          }
          
          ctx.lineTo(w, h)
          ctx.closePath()

          const gradient = ctx.createLinearGradient(0, 0, 0, h)
          gradient.addColorStop(0, `hsla(${c.hue}, 70%, 40%, 0.6)`)
          gradient.addColorStop(1, `hsla(${c.hue}, 80%, 20%, 0.9)`)
          ctx.fillStyle = gradient
          ctx.fill()
        })

        animationRef.current = requestAnimationFrame(render)
      }

      // 先绘制背景
      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(render)
    } else if (liveWallpaper === 'constellation') {
      // 星座连接
      const starCount = isLowEnd ? 50 : 100
      const stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2
      }))

      const render = (_timestamp: number) => {
        if (isPausedRef.current) {
          animationRef.current = requestAnimationFrame(render)
          return
        }

        // 渐变背景
        const gradient = ctx.createRadialGradient(
          w / 2 + (mouseRef.current.x - 0.5) * 100,
          h / 2 + (mouseRef.current.y - 0.5) * 100,
          0,
          w / 2,
          h / 2,
          Math.max(w, h)
        )
        gradient.addColorStop(0, '#0a0a2e')
        gradient.addColorStop(0.5, '#050515')
        gradient.addColorStop(1, '#000000')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)

        const m = mouseRef.current

        // 更新星星位置和闪烁
        stars.forEach(s => {
          s.x += s.vx
          s.y += s.vy

          if (s.x < 0) s.x = w
          if (s.x > w) s.x = 0
          if (s.y < 0) s.y = h
          if (s.y > h) s.y = 0

          s.twinkle += s.twinkleSpeed
        })

        // 绘制连线
        ctx.globalCompositeOperation = 'lighter'
        for (let i = 0; i < stars.length; i++) {
          // 鼠标连线
          const mdx = m.x * w - stars[i].x
          const mdy = m.y * h - stars[i].y
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
          
          if (mdist < 200) {
            const alpha = (1 - mdist / 200) * 0.5
            ctx.beginPath()
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(m.x * w, m.y * h)
            ctx.strokeStyle = `rgba(150, 200, 255, ${alpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }

          // 星星间连线
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x
            const dy = stars[i].y - stars[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist < 120) {
              const alpha = (1 - dist / 120) * 0.2
              ctx.beginPath()
              ctx.moveTo(stars[i].x, stars[i].y)
              ctx.lineTo(stars[j].x, stars[j].y)
              ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }

        // 绘制星星
        stars.forEach(s => {
          const alpha = Math.sin(s.twinkle) * 0.4 + 0.6
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.fill()
        })

        // 鼠标光晕
        const glowGradient = ctx.createRadialGradient(
          m.x * w, m.y * h, 0,
          m.x * w, m.y * h, 100
        )
        glowGradient.addColorStop(0, 'rgba(100, 150, 255, 0.2)')
        glowGradient.addColorStop(1, 'rgba(100, 150, 255, 0)')
        ctx.fillStyle = glowGradient
        ctx.fillRect(m.x * w - 100, m.y * h - 100, 200, 200)

        ctx.globalCompositeOperation = 'source-over'

        animationRef.current = requestAnimationFrame(render)
      }

      animationRef.current = requestAnimationFrame(render)
    }

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [shouldRender, liveWallpaper, handleMouseMove, handleVisibilityChange])

  if (!shouldRender) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  )
})

export default EnhancedDynamicWallpaper
