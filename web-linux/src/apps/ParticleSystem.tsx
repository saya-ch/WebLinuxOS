import React, { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  size: number
  color: string
}

const ParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particleCount, setParticleCount] = useState(200)
  const [speed, setSpeed] = useState(1)
  const [size, setSize] = useState(3)
  const [colorMode, setColorMode] = useState<'rainbow' | 'blue' | 'fire'>('rainbow')
  const [interactionMode, setInteractionMode] = useState<'gravity' | 'repel' | 'none'>('gravity')
  
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, z: 0, active: false })
  const rotationRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  const colors = {
    rainbow: () => `hsl(${Math.random() * 360}, 80%, 60%)`,
    blue: () => `hsl(${200 + Math.random() * 40}, 80%, 60%)`,
    fire: () => `hsl(${Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`
  }

  const initParticles = (width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 0.8,
        y: (Math.random() - 0.5) * height * 0.8,
        z: (Math.random() - 0.5) * 400,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        size: size + Math.random() * size,
        color: colors[colorMode]()
      })
    }
    particlesRef.current = particles
  }

  const project = (x: number, y: number, z: number, width: number, height: number) => {
    const fov = 500
    const scale = fov / (fov + z)
    return {
      x: x * scale + width / 2,
      y: y * scale + height / 2,
      scale
    }
  }

  const animate = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time
    const delta = (time - lastTimeRef.current) / 16
    lastTimeRef.current = time

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = 'rgba(10, 10, 26, 0.3)'
    ctx.fillRect(0, 0, width, height)

    rotationRef.current.x += 0.002 * delta * speed
    rotationRef.current.y += 0.003 * delta * speed

    particlesRef.current.forEach(p => {
      if (mouseRef.current.active && interactionMode !== 'none') {
        const dx = p.x - mouseRef.current.x
        const dy = p.y - mouseRef.current.y
        const dz = p.z - mouseRef.current.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.5
          const dir = interactionMode === 'gravity' ? -1 : 1
          p.vx += (dx / dist) * force * dir
          p.vy += (dy / dist) * force * dir
          p.vz += (dz / dist) * force * dir
        }
      }

      p.vx *= 0.99
      p.vy *= 0.99
      p.vz *= 0.99

      p.x += p.vx * delta * speed
      p.y += p.vy * delta * speed
      p.z += p.vz * delta * speed

      const rotX = p.x
      const rotY = p.y * Math.cos(rotationRef.current.x) - p.z * Math.sin(rotationRef.current.x)
      const rotZ = p.y * Math.sin(rotationRef.current.x) + p.z * Math.cos(rotationRef.current.x)
      
      const finalX = rotX * Math.cos(rotationRef.current.y) + rotZ * Math.sin(rotationRef.current.y)
      const finalY = rotY
      const finalZ = -rotX * Math.sin(rotationRef.current.y) + rotZ * Math.cos(rotationRef.current.y)

      const projected = project(finalX, finalY, finalZ, width, height)
      
      const alpha = Math.max(0.2, Math.min(1, 1 - (finalZ + 200) / 400))
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(projected.x, projected.y, p.size * projected.scale, 0, Math.PI * 2)
      ctx.fill()

      const bounds = 300
      if (p.x < -bounds || p.x > bounds) p.vx *= -1
      if (p.y < -bounds || p.y > bounds) p.vy *= -1
      if (p.z < -bounds || p.z > bounds) p.vz *= -1
    })

    ctx.globalAlpha = 1
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)'
    ctx.lineWidth = 0.5
    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const p1 = particlesRef.current[i]
        const p2 = particlesRef.current[j]
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const dz = p1.z - p2.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (dist < 80) {
          const p1p = project(p1.x, p1.y, p1.z, width, height)
          const p2p = project(p2.x, p2.y, p2.z, width, height)
          
          ctx.globalAlpha = (1 - dist / 80) * 0.2
          ctx.beginPath()
          ctx.moveTo(p1p.x, p1p.y)
          ctx.lineTo(p2p.x, p2p.y)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1

    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      initParticles(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left - rect.width / 2),
        y: (e.clientY - rect.top - rect.height / 2),
        z: 0,
        active: true
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const currentCount = particlesRef.current.length
    if (particleCount > currentCount) {
      for (let i = currentCount; i < particleCount; i++) {
        particlesRef.current.push({
          x: (Math.random() - 0.5) * canvas.width * 0.8,
          y: (Math.random() - 0.5) * canvas.height * 0.8,
          z: (Math.random() - 0.5) * 400,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 0.5,
          size: size + Math.random() * size,
          color: colors[colorMode]()
        })
      }
    } else if (particleCount < currentCount) {
      particlesRef.current = particlesRef.current.slice(0, particleCount)
    }
  }, [particleCount, colorMode, size])

  const resetParticles = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    initParticles(canvas.width, canvas.height)
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
      overflow: 'hidden'
    }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          flex: 1, 
          display: 'block',
          cursor: 'crosshair'
        }}
      />
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px',
        background: 'rgba(30, 30, 60, 0.8)',
        borderTop: '1px solid rgba(100, 150, 255, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#a0a0c0', fontSize: '12px' }}>Particles: {particleCount}</label>
          <input 
            type="range" 
            min="50" 
            max="500" 
            value={particleCount} 
            onChange={(e) => setParticleCount(Number(e.target.value))}
            style={{ width: '120px' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#a0a0c0', fontSize: '12px' }}>Speed: {speed.toFixed(1)}</label>
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1" 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: '120px' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#a0a0c0', fontSize: '12px' }}>Size: {size}</label>
          <input 
            type="range" 
            min="1" 
            max="8" 
            step="0.5" 
            value={size} 
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ width: '120px' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#a0a0c0', fontSize: '12px' }}>Color</label>
          <select 
            value={colorMode}
            onChange={(e) => {
              setColorMode(e.target.value as any)
              resetParticles()
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: '#2a2a4a',
              color: '#e0e0e0',
              border: '1px solid rgba(100, 150, 255, 0.3)'
            }}
          >
            <option value="rainbow">Rainbow</option>
            <option value="blue">Blue</option>
            <option value="fire">Fire</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#a0a0c0', fontSize: '12px' }}>Interaction</label>
          <select 
            value={interactionMode}
            onChange={(e) => setInteractionMode(e.target.value as any)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: '#2a2a4a',
              color: '#e0e0e0',
              border: '1px solid rgba(100, 150, 255, 0.3)'
            }}
          >
            <option value="gravity">Gravity</option>
            <option value="repel">Repel</option>
            <option value="none">None</option>
          </select>
        </div>
        
        <button 
          onClick={resetParticles}
          style={{
            alignSelf: 'flex-end',
            padding: '6px 16px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default ParticleSystem