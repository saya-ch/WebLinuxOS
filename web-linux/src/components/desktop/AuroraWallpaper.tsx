import { memo, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store'

const AuroraWallpaper = memo(function AuroraWallpaper() {
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const liveWallpaper = useStore((s) => s.liveWallpaper)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 })
  const isPausedRef = useRef(false)

  const isAurora = liveWallpaper === 'aurora' || liveWallpaper === 'aurora-storm'
  const shouldRender = liveWallpaperEnabled && isAurora

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.targetX = e.clientX / window.innerWidth
    mouseRef.current.targetY = e.clientY / window.innerHeight
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
    const intensity = liveWallpaper === 'aurora-storm' ? 1.6 : 1
    const baseBlobCount = liveWallpaper === 'aurora-storm' ? 7 : 5
    const blobCount = isLowEnd ? Math.max(3, baseBlobCount - 2) : baseBlobCount
    const starCount = isLowEnd ? 40 : 80

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

    const blobs = Array.from({ length: blobCount }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.7,
      radius: Math.max(w, h) * (0.35 + Math.random() * 0.25),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
      hue: 260 + i * 25 + Math.random() * 30,
      hueSpeed: (Math.random() - 0.5) * 0.08,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.002 + Math.random() * 0.003,
    }))

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
    }))

    let lastTime = 0
    const targetFps = isLowEnd ? 30 : 60
    const frameInterval = 1000 / targetFps

    const render = (timestamp: number) => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(render)
        return
      }

      const delta = timestamp - lastTime
      if (delta < frameInterval) {
        animationRef.current = requestAnimationFrame(render)
        return
      }
      lastTime = timestamp - (delta % frameInterval)

      const m = mouseRef.current
      m.x += (m.targetX - m.x) * 0.03
      m.y += (m.targetY - m.y) * 0.03

      ctx.fillStyle = '#06060f'
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        s.twinkle += s.twinkleSpeed
        const alpha = Math.sin(s.twinkle) * 0.4 + 0.6
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        b.phase += b.phaseSpeed
        b.hue += b.hueSpeed
        b.x += b.vx + Math.sin(b.phase) * 0.5
        b.y += b.vy + Math.cos(b.phase * 0.7) * 0.3

        if (b.x < -b.radius) b.x = w + b.radius
        if (b.x > w + b.radius) b.x = -b.radius
        if (b.y < -b.radius * 0.5) b.y = h * 0.7
        if (b.y > h * 0.85) b.y = -b.radius * 0.5

        const offsetX = (m.x - 0.5) * 40 * (i % 2 === 0 ? 1 : -1)
        const offsetY = (m.y - 0.5) * 20 * (i % 3 === 0 ? 1 : -1)

        const gradient = ctx.createRadialGradient(
          b.x + offsetX,
          b.y + offsetY,
          0,
          b.x + offsetX,
          b.y + offsetY,
          b.radius
        )

        const hue = b.hue + Math.sin(b.phase * 2) * 20
        gradient.addColorStop(0, `hsla(${hue}, 80%, 55%, ${0.35 * intensity})`)
        gradient.addColorStop(0.4, `hsla(${hue + 20}, 70%, 50%, ${0.2 * intensity})`)
        gradient.addColorStop(1, `hsla(${hue + 40}, 60%, 45%, 0)`)

        ctx.beginPath()
        ctx.arc(b.x + offsetX, b.y + offsetY, b.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'

      const vignette = ctx.createLinearGradient(0, h * 0.5, 0, h)
      vignette.addColorStop(0, 'rgba(6, 6, 15, 0)')
      vignette.addColorStop(0.5, 'rgba(6, 6, 15, 0.5)')
      vignette.addColorStop(1, 'rgba(6, 6, 15, 0.9)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

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

export default AuroraWallpaper
