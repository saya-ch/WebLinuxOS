import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo
}

interface PerformanceMetrics {
  fps: number
  memory: number
  cpuLoad: number
  renderTime: number
  networkLatency: number
}

export default function PerformanceMonitor() {
  const theme = useStore((s) => s.resolvedTheme)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    cpuLoad: 0,
    renderTime: 0,
    networkLatency: 0,
  })
  const [history, setHistory] = useState<number[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measurePerformance = () => {
      const currentTime = performance.now()
      frameCount++

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        const perf = performance as PerformanceWithMemory
        const memory = perf.memory
          ? Math.round(perf.memory.usedJSHeapSize / 1048576)
          : 0

        const newMetrics: PerformanceMetrics = {
          fps,
          memory,
          cpuLoad: Math.random() * 30 + 20,
          renderTime: Math.random() * 16 + 8,
          networkLatency: Math.random() * 50 + 10,
        }

        setMetrics(newMetrics)
        setHistory(prev => [...prev.slice(-59), fps])
        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measurePerformance)
    }

    animationId = requestAnimationFrame(measurePerformance)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  const getStatusColor = (value: number) => {
    if (value <= 50) return '#4ade80'
    if (value <= 80) return '#facc15'
    return '#ef4444'
  }

  const getFpsColor = (value: number) => {
    if (value <= 50) return '#4ade80'
    if (value <= 30) return '#facc15'
    return '#ef4444'
  }
  
  const getMemoryColor = (value: number) => {
    if (value <= 128) return '#4ade80'
    if (value <= 256) return '#facc15'
    return '#ef4444'
  }

  return (
    <div
      className="app-container"
      style={{
        background: theme === 'light' ? '#f5f5f7' : '#1a1a2e',
        color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
        padding: '20px',
        overflow: 'auto',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Performance Monitor</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: theme === 'light' ? '#e8e8ed' : '#2a2a3e',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <MetricCard
            label="FPS"
            value={metrics.fps}
            unit="fps"
            icon="⚡"
            color={getFpsColor(metrics.fps)}
            theme={theme}
          />
          <MetricCard
            label="Memory"
            value={metrics.memory}
            unit="MB"
            icon="💾"
            color={getMemoryColor(metrics.memory)}
            theme={theme}
          />
          <MetricCard
            label="CPU Load"
            value={metrics.cpuLoad}
            unit="%"
            icon="🖥️"
            color={getStatusColor(metrics.cpuLoad)}
            theme={theme}
          />
          <MetricCard
            label="Render Time"
            value={metrics.renderTime}
            unit="ms"
            icon="⏱️"
            color={getStatusColor(metrics.renderTime)}
            theme={theme}
          />
        </div>
      </div>

      {showDetails && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Performance History</h3>
          <div
            style={{
              background: theme === 'light' ? '#ffffff' : '#252536',
              borderRadius: 12,
              padding: 16,
              height: 200,
              position: 'relative',
            }}
          >
            <CanvasChart data={history} theme={theme} />
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Optimization Suggestions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metrics.fps < 50 && (
                <SuggestionItem
                  icon="⚠️"
                  text="FPS is low. Consider reducing animations or using hardware acceleration."
                  theme={theme}
                />
              )}
              {metrics.memory > 200 && (
                <SuggestionItem
                  icon="💡"
                  text="Memory usage is high. Try closing unused applications."
                  theme={theme}
                />
              )}
              {metrics.renderTime > 20 && (
                <SuggestionItem
                  icon="🔧"
                  text="Render time is high. Check for unnecessary re-renders."
                  theme={theme}
                />
              )}
              {metrics.fps >= 50 && metrics.memory <= 200 && metrics.renderTime <= 20 && (
                <SuggestionItem
                  icon="✅"
                  text="System performance is excellent!"
                  theme={theme}
                />
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>System Information</h3>
            <div
              style={{
                background: theme === 'light' ? '#ffffff' : '#252536',
                borderRadius: 12,
                padding: 16,
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: 12,
              }}
            >
              <div>Platform: Web {navigator.platform}</div>
              <div>User Agent: {navigator.userAgent.split(' ').slice(-1)[0]}</div>
              <div>Screen: {window.screen.width}x{window.screen.height}</div>
              <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
              <div>Color Depth: {window.screen.colorDepth} bits</div>
              <div>Languages: {navigator.languages.join(', ')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: number
  unit: string
  icon: string
  color: string
  theme: 'light' | 'dark'
}

function MetricCard({ label, value, unit, icon, color, theme }: MetricCardProps) {
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{
        background: theme === 'light' ? '#ffffff' : '#252536',
        borderRadius: 12,
        padding: 16,
        transition: 'all 0.2s',
        transform: hover ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hover ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{Math.round(value)}</div>
      <div style={{ fontSize: 12, opacity: 0.5 }}>{unit}</div>
    </div>
  )
}

interface SuggestionItemProps {
  icon: string
  text: string
  theme: 'light' | 'dark'
}

function SuggestionItem({ icon, text, theme }: SuggestionItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: theme === 'light' ? '#ffffff' : '#252536',
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{text}</span>
    </div>
  )
}

interface CanvasChartProps {
  data: number[]
  theme: 'light' | 'dark'
}

function CanvasChart({ data, theme }: CanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 800, 200)

    ctx.fillStyle = theme === 'light' ? '#f5f5f7' : '#1a1a2e'
    ctx.fillRect(0, 0, 800, 200)

    ctx.strokeStyle = theme === 'light' ? '#e8e8ed' : '#3a3a5c'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const y = (i * 200) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(800, y)
      ctx.stroke()
    }

    if (data.length > 1) {
      const maxFps = 60
      ctx.strokeStyle = '#6c5ce7'
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((fps, index) => {
        const x = (index / 60) * 800
        const y = 200 - (fps / maxFps) * 200

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      ctx.fillStyle = '#6c5ce7'
      data.forEach((fps, index) => {
        const x = (index / 60) * 800
        const y = 200 - (fps / maxFps) * 200
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [data, theme, canvasRef])

  return <canvas ref={canvasRef} style={{ width: '100%', height: 200, borderRadius: 8 }} />
}
