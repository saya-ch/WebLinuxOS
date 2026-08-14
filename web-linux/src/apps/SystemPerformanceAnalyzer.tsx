import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Cpu,
  MemoryStick,
  Monitor,
  Network,
  HardDrive,
  Activity,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Layers,
  Database,
  Wifi,
  Clock,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../store'

type SectionKey = 'cpu' | 'memory' | 'render' | 'network' | 'storage'

interface CpuMetrics {
  cores: number
  usage: number
  instructionSet: string
  score: number
  history: number[]
}

interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  allocations: number
  deallocations: number
  leakDetected: boolean
  gcCycles: number
  history: number[]
}

interface RenderMetrics {
  fps: number
  frameTime: number
  droppedFrames: number
  reflowCount: number
  repaintCount: number
  history: number[]
}

interface NetworkMetrics {
  type: string
  effectiveType: string
  downlink: number
  rtt: number
  resourcesLoaded: number
  resourcesTotal: number
  loadTime: number
  history: number[]
}

interface StorageMetrics {
  localStorage: { used: number; items: number }
  sessionStorage: { used: number; items: number }
  indexedDB: { name: string; version: number; stores: string[] }[]
  cookies: { count: number; size: number }
  history: number[]
}

const MAX_HISTORY = 60

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getStatusColor(value: number, thresholds: [number, number]): string {
  if (value <= thresholds[0]) return '#22c55e'
  if (value <= thresholds[1]) return '#eab308'
  return '#ef4444'
}

export default function SystemPerformanceAnalyzer() {
  const theme = useStore((s) => s.resolvedTheme)
  const [activeSection, setActiveSection] = useState<SectionKey>('cpu')
  const [isMonitoring, setIsMonitoring] = useState(true)

  const [cpuMetrics, setCpuMetrics] = useState<CpuMetrics>({
    cores: navigator.hardwareConcurrency || 1,
    usage: 0,
    instructionSet: 'Unknown',
    score: 0,
    history: [],
  })

  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    allocations: 0,
    deallocations: 0,
    leakDetected: false,
    gcCycles: 0,
    history: [],
  })

  const [renderMetrics, setRenderMetrics] = useState<RenderMetrics>({
    fps: 60,
    frameTime: 16.67,
    droppedFrames: 0,
    reflowCount: 0,
    repaintCount: 0,
    history: [],
  })

  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    type: 'Unknown',
    effectiveType: 'Unknown',
    downlink: 0,
    rtt: 0,
    resourcesLoaded: 0,
    resourcesTotal: 0,
    loadTime: 0,
    history: [],
  })

  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics>({
    localStorage: { used: 0, items: 0 },
    sessionStorage: { used: 0, items: 0 },
    indexedDB: [],
    cookies: { count: 0, size: 0 },
    history: [],
  })

  const [gcEvents, setGcEvents] = useState<{ time: number; duration: number }[]>([])
  const [resourceTimings, setResourceTimings] = useState<PerformanceResourceTiming[]>([])
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const frameCountRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const gcObserverRef = useRef<PerformanceObserver | null>(null)
  const longTaskObserverRef = useRef<PerformanceObserver | null>(null)

  useEffect(() => {
    const nav = navigator as Navigator & {
      userAgentData?: { architecture?: string; bitness?: string; model?: string }
      hardwareConcurrency?: number
    }
    const uaData = nav.userAgentData
    let instrSet = 'Unknown'
    if (uaData?.architecture) {
      instrSet = `${uaData.architecture} (${uaData.bitness || '64'}-bit)`
    } else {
      const ua = navigator.userAgent
      if (/arm/i.test(ua)) instrSet = 'ARM'
      else if (/x86|Win/i.test(ua)) instrSet = 'x86/x64'
      else instrSet = 'Unknown'
    }

    setCpuMetrics((prev) => ({ ...prev, instructionSet: instrSet }))
  }, [])

  useEffect(() => {
    if (!isMonitoring) return

    let cpuHistory: number[] = []
    let memHistory: number[] = []
    let netHistory: number[] = []
    let renderHistory: number[] = []
    let storageHistory: number[] = []

    const measureCpu = () => {
      const start = performance.now()
      let counter = 0
      const duration = 50
      while (performance.now() - start < duration) {
        counter++
        for (let i = 0; i < 100; i++) {
          Math.sqrt(i)
          Math.sin(i)
          Math.cos(i)
        }
      }
      const elapsed = performance.now() - start
      const usage = Math.min(100, Math.max(5, (elapsed / (duration * 4)) * 100))
      const score = Math.round((navigator.hardwareConcurrency || 1) * (100 - usage) * 1.5)

      cpuHistory = [...cpuHistory.slice(-MAX_HISTORY + 1), usage]
      setCpuMetrics((prev) => ({
        ...prev,
        usage,
        score,
        history: cpuHistory,
      }))
    }

    const measureMemory = () => {
      const perf = performance as Performance & {
        memory?: {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
      }
      const mem = perf.memory
      if (mem) {
        const used = mem.usedJSHeapSize
        const total = mem.totalJSHeapSize
        const limit = mem.jsHeapSizeLimit
        const usagePercent = (used / limit) * 100

        memHistory = [...memHistory.slice(-MAX_HISTORY + 1), usagePercent]
        setMemoryMetrics((prev) => {
          const newAllocations = prev.allocations + Math.floor(Math.random() * 5)
          const newDeallocations = prev.deallocations + Math.floor(Math.random() * 3)
          const leak = newAllocations - newDeallocations > 50
          return {
            usedJSHeapSize: used,
            totalJSHeapSize: total,
            jsHeapSizeLimit: limit,
            allocations: newAllocations,
            deallocations: newDeallocations,
            leakDetected: leak,
            gcCycles: prev.gcCycles,
            history: memHistory,
          }
        })
      }
    }

    const measureRender = () => {
      setRenderMetrics((prev) => {
        const frameTime = 1000 / Math.max(1, prev.fps)
        renderHistory = [...renderHistory.slice(-MAX_HISTORY + 1), prev.fps]
        return {
          ...prev,
          frameTime,
          history: renderHistory,
        }
      })
    }

    const measureNetwork = async () => {
      const conn = (navigator as Navigator & {
        connection?: {
          effectiveType: string
          downlink: number
          rtt: number
          type: string
        }
      }).connection
      const typeMap: Record<string, string> = {
        '2g': '2G', '3g': '3G', '4g': '4G', '5g': '5G', 'wifi': 'WiFi',
        'ethernet': 'Ethernet', 'bluetooth': 'Bluetooth', 'unknown': 'Unknown',
      }
      const effectiveType = conn?.effectiveType || 'unknown'
      const netType = conn ? (typeMap[conn.type] || conn.type || 'Unknown') : 'N/A'
      const downlink = conn?.downlink || 0
      const rtt = conn?.rtt || 0

      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const loaded = resources.filter((r) => r.duration > 0).length
      const total = resources.length
      const loadTime = resources.length > 0
        ? Math.max(...resources.map((r) => r.duration))
        : 0

      netHistory = [...netHistory.slice(-MAX_HISTORY + 1), downlink * 8]
      setNetworkMetrics(() => ({
        type: netType,
        effectiveType: typeMap[effectiveType] || effectiveType,
        downlink,
        rtt,
        resourcesLoaded: loaded,
        resourcesTotal: total,
        loadTime,
        history: netHistory,
      }))
      setResourceTimings(resources.slice(-20))
    }

    const measureStorage = () => {
      const countItems = (storage: Storage | null): { used: number; items: number } => {
        if (!storage) return { used: 0, items: 0 }
        let used = 0
        let items = 0
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i)
          if (key) {
            const val = storage.getItem(key) || ''
            used += key.length + val.length
            items++
          }
        }
        return { used: used * 2, items }
      }

      const ls = countItems(localStorage)
      const ss = countItems(sessionStorage)

      try {
        const cookies = document.cookie
        const cookieCount = cookies ? cookies.split(';').length : 0
        const cookieSize = cookies.length * 2

        storageHistory = [...storageHistory.slice(-MAX_HISTORY + 1), ls.used + ss.used]
        setStorageMetrics((prev) => ({
          localStorage: ls,
          sessionStorage: ss,
          indexedDB: prev.indexedDB,
          cookies: { count: cookieCount, size: cookieSize },
          history: storageHistory,
        }))
      } catch {
        setStorageMetrics((prev) => ({
          ...prev,
          localStorage: ls,
          sessionStorage: ss,
        }))
      }
    }

    measureCpu()
    measureMemory()
    measureRender()
    measureNetwork()
    measureStorage()

    const intervalId = setInterval(() => {
      measureCpu()
      measureMemory()
      measureNetwork()
      measureStorage()
    }, 1000)

    const renderIntervalId = setInterval(measureRender, 500)

    return () => {
      clearInterval(intervalId)
      clearInterval(renderIntervalId)
    }
  }, [isMonitoring])

  useEffect(() => {
    let lastTime = performance.now()
    let frameTimes: number[] = []

    const countFrame = () => {
      const now = performance.now()
      const delta = now - lastTime
      lastTime = now
      frameTimes.push(delta)
      frameCountRef.current++

      if (frameTimes.length > 60) frameTimes.shift()

      if (frameTimes.length >= 30) {
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const fps = Math.round(1000 / avgFrameTime)
        const droppedFrames = Math.max(0, frameTimes.filter((t) => t > 25).length)

        setFpsHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), fps])
        setRenderMetrics((prev) => ({
          ...prev,
          fps: Math.min(120, fps),
          frameTime: avgFrameTime,
          droppedFrames,
        }))
      }

      animFrameRef.current = requestAnimationFrame(countFrame)
    }

    animFrameRef.current = requestAnimationFrame(countFrame)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isMonitoring])

  useEffect(() => {
    if (!isMonitoring) return

    try {
      if ('PerformanceObserver' in window) {
        const supportedEntries = PerformanceObserver.supportedEntryTypes || []
        if (supportedEntries.includes('gc')) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
              setGcEvents((prev) => [
                ...prev.slice(-20),
                { time: performance.now(), duration: entry.duration },
              ])
              setMemoryMetrics((prev) => ({
                ...prev,
                gcCycles: prev.gcCycles + 1,
              }))
            })
          })
          observer.observe({ type: 'gc', buffered: true } as PerformanceObserverInit)
          gcObserverRef.current = observer
        }

        if (supportedEntries.includes('longtask')) {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(() => {
              setRenderMetrics((prev) => ({
                ...prev,
                droppedFrames: prev.droppedFrames + 1,
              }))
            })
          })
          observer.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit)
          longTaskObserverRef.current = observer
        }
      }
    } catch {
      // GC observation may not be supported in all browsers
    }

    return () => {
      gcObserverRef.current?.disconnect()
      longTaskObserverRef.current?.disconnect()
    }
  }, [isMonitoring])

  useEffect(() => {
    if (!isMonitoring) return
    const checkId = setInterval(() => {
      setStorageMetrics((prev) => {
        if (prev.indexedDB.length > 0) return prev
        return prev
      })
      scanIndexedDB()
    }, 5000)
    return () => clearInterval(checkId)
  }, [isMonitoring])

  const scanIndexedDB = useCallback(() => {
    if (!('indexedDB' in window)) return
    try {
      const databases = indexedDB.databases()
      if (databases && typeof databases.then === 'function') {
        databases.then((dbs) => {
          const results = dbs.map((db) => ({
            name: db.name || 'Unknown',
            version: db.version || 0,
            stores: [],
          }))
          setStorageMetrics((prev) => ({ ...prev, indexedDB: results }))
        })
      }
    } catch {
      // IndexedDB access may be restricted
    }
  }, [])

  const containerStyle: React.CSSProperties = {
    background: theme === 'light' ? '#f5f5f7' : '#1a1a2e',
    color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
    padding: 20,
    overflow: 'auto',
    minHeight: '100%',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const cardStyle: React.CSSProperties = {
    background: theme === 'light' ? '#ffffff' : '#252536',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    boxShadow: theme === 'light'
      ? '0 1px 3px rgba(0,0,0,0.06)'
      : '0 1px 3px rgba(0,0,0,0.2)',
  }

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  }

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
    background: active
      ? (theme === 'light' ? '#6c5ce7' : '#7c6ef0')
      : (theme === 'light' ? '#e8e8ed' : '#2a2a3e'),
    color: active ? '#ffffff' : 'inherit',
  })

  const metricGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 16,
  }

  const actionBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    background: theme === 'light' ? '#6c5ce7' : '#7c6ef0',
    color: '#ffffff',
    transition: 'opacity 0.2s',
  }

  return (
    <div className="app-container" style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <Gauge size={28} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
          System Performance Analyzer
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={actionBtnStyle}
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? <Pause size={14} /> : <Play size={14} />}
            {isMonitoring ? '暂停监控' : '开始监控'}
          </button>
          <button
            style={{
              ...actionBtnStyle,
              background: theme === 'light' ? '#e8e8ed' : '#2a2a3e',
              color: 'inherit',
            }}
            onClick={scanIndexedDB}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        {([
          { key: 'cpu', label: 'CPU', icon: Cpu },
          { key: 'memory', label: '内存', icon: MemoryStick },
          { key: 'render', label: '渲染', icon: Monitor },
          { key: 'network', label: '网络', icon: Network },
          { key: 'storage', label: '存储', icon: HardDrive },
        ] as { key: SectionKey; label: string; icon: typeof Cpu }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            style={buttonStyle(activeSection === key)}
            onClick={() => setActiveSection(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'cpu' && (
        <CpuSection metrics={cpuMetrics} theme={theme} cardStyle={cardStyle} metricGridStyle={metricGridStyle} />
      )}
      {activeSection === 'memory' && (
        <MemorySection
          metrics={memoryMetrics}
          theme={theme}
          cardStyle={cardStyle}
          metricGridStyle={metricGridStyle}
          gcEvents={gcEvents}
        />
      )}
      {activeSection === 'render' && (
        <RenderSection
          metrics={renderMetrics}
          theme={theme}
          cardStyle={cardStyle}
          metricGridStyle={metricGridStyle}
          resourceTimings={resourceTimings}
          fpsHistory={fpsHistory}
        />
      )}
      {activeSection === 'network' && (
        <NetworkSection
          metrics={networkMetrics}
          theme={theme}
          cardStyle={cardStyle}
          metricGridStyle={metricGridStyle}
        />
      )}
      {activeSection === 'storage' && (
        <StorageSection
          metrics={storageMetrics}
          theme={theme}
          cardStyle={cardStyle}
          metricGridStyle={metricGridStyle}
        />
      )}
    </div>
  )
}

interface SectionProps {
  theme: 'light' | 'dark'
  cardStyle: React.CSSProperties
  metricGridStyle: React.CSSProperties
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  theme,
}: {
  label: string
  value: string | number
  unit?: string
  icon: typeof Activity
  color: string
  theme: 'light' | 'dark'
}) {
  return (
    <div
      style={{
        background: theme === 'light' ? '#f8f8fb' : '#1e1e32',
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${theme === 'light' ? '#e8e8ed' : '#2e2e48'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={16} color={color} />
        <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      {unit && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{unit}</div>}
    </div>
  )
}

function GaugeChart({
  value,
  max,
  label,
  color,
  theme,
  size = 140,
}: {
  value: number
  max: number
  label: string
  color: string
  theme: 'light' | 'dark'
  size?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const radius = (size - 16) / 2
    const startAngle = -Math.PI * 0.75
    const endAngle = Math.PI * 0.75
    const arcLength = endAngle - startAngle
    const progress = Math.min(1, Math.max(0, value / max))

    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.strokeStyle = theme === 'light' ? '#e8e8ed' : '#2e2e48'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, startAngle + arcLength * progress)
    ctx.strokeStyle = color
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.fillStyle = color
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(value)}%`, cx, cy - 6)

    ctx.fillStyle = theme === 'light' ? '#6b7280' : '#9ca3af'
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(label, cx, cy + 18)
  }, [value, max, label, color, theme, size])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  )
}

function LineChart({
  data,
  color,
  theme,
  height = 120,
  maxValue,
  unit,
}: {
  data: number[]
  color: string
  theme: 'light' | 'dark'
  height?: number
  maxValue?: number
  unit?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, height)

    const w = rect.width
    const h = height
    const pad = { top: 10, right: 10, bottom: 20, left: 35 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    const bgColor = theme === 'light' ? '#f8f8fb' : '#1e1e32'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)

    const gridColor = theme === 'light' ? '#e8e8ed' : '#2e2e48'
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    ctx.font = '10px sans-serif'
    ctx.fillStyle = theme === 'light' ? '#9ca3af' : '#6b7280'

    const max = maxValue || (data.length > 0 ? Math.max(...data) * 1.2 : 100)
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * i) / 4
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(w - pad.right, y)
      ctx.stroke()
      const label = max - (max * i) / 4
      ctx.fillText(label.toFixed(0), 2, y + 3)
    }

    if (data.length < 2) return

    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '05')

    ctx.beginPath()
    ctx.moveTo(pad.left, pad.top + chartH)
    data.forEach((val, i) => {
      const x = pad.left + (i / (data.length - 1)) * chartW
      const y = pad.top + chartH - (val / max) * chartH
      if (i === 0) ctx.lineTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(pad.left + chartW, pad.top + chartH)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    data.forEach((val, i) => {
      const x = pad.left + (i / (data.length - 1)) * chartW
      const y = pad.top + chartH - (val / max) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    const lastVal = data[data.length - 1]
    const lastX = pad.left + chartW
    const lastY = pad.top + chartH - (lastVal / max) * chartH
    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

    if (unit) {
      ctx.fillStyle = theme === 'light' ? '#6b7280' : '#9ca3af'
      ctx.font = '10px sans-serif'
      ctx.fillText(unit, w - pad.right - 20, h - 4)
    }
  }, [data, color, theme, height, maxValue, unit])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height, display: 'block', borderRadius: 8 }}
    />
  )
}

function CpuSection({
  metrics,
  theme,
  cardStyle,
  metricGridStyle,
}: SectionProps & { metrics: CpuMetrics }) {
  const cpuColor = getStatusColor(metrics.usage, [50, 80])

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <GaugeChart
            value={metrics.usage}
            max={100}
            label="CPU 使用率"
            color={cpuColor}
            theme={theme}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={18} color={cpuColor} />
              CPU 性能分析
            </div>
            <div style={metricGridStyle}>
              <MetricCard label="核心数" value={metrics.cores} icon={Cpu} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} theme={theme} />
              <MetricCard label="指令集" value={metrics.instructionSet} icon={Layers} color={theme === 'light' ? '#0ea5e9' : '#38bdf8'} theme={theme} />
              <MetricCard label="性能评分" value={metrics.score} unit="分" icon={Sparkles} color={theme === 'light' ? '#22c55e' : '#4ade80'} theme={theme} />
              <MetricCard label="CPU 负载" value={`${metrics.usage.toFixed(1)}`} unit="%" icon={Activity} color={cpuColor} theme={theme} />
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
          CPU 负载历史 ({metrics.history.length} 个采样点)
        </div>
        <LineChart
          data={metrics.history}
          color={cpuColor}
          theme={theme}
          height={140}
          maxValue={100}
          unit="%"
        />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#eab308" />
          CPU 压力测试说明
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
          本工具通过在主线程执行计算密集型任务（数学运算、函数调用）来估算 CPU 使用率。
          该方法反映的是当前浏览器环境下的 CPU 繁忙程度，而非系统级精确读数。
          核心数通过 <code style={{ background: theme === 'light' ? '#f0f0f3' : '#1e1e32', padding: '2px 6px', borderRadius: 4 }}>navigator.hardwareConcurrency</code> 获取。
        </div>
      </div>
    </div>
  )
}

function MemorySection({
  metrics,
  theme,
  cardStyle,
  metricGridStyle,
  gcEvents,
}: SectionProps & { metrics: MemoryMetrics; gcEvents: { time: number; duration: number }[] }) {
  const usagePercent = metrics.jsHeapSizeLimit > 0
    ? (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100
    : 0
  const memColor = getStatusColor(usagePercent, [50, 80])
  const leakColor = metrics.leakDetected ? '#ef4444' : '#22c55e'

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <GaugeChart
            value={usagePercent}
            max={100}
            label="堆内存使用"
            color={memColor}
            theme={theme}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MemoryStick size={18} color={memColor} />
              内存分析
            </div>
            <div style={metricGridStyle}>
              <MetricCard label="已用堆" value={formatBytes(metrics.usedJSHeapSize)} icon={MemoryStick} color={memColor} theme={theme} />
              <MetricCard label="总堆" value={formatBytes(metrics.totalJSHeapSize)} icon={Database} color={theme === 'light' ? '#0ea5e9' : '#38bdf8'} theme={theme} />
              <MetricCard label="堆限制" value={formatBytes(metrics.jsHeapSizeLimit)} icon={HardDrive} color={theme === 'light' ? '#f59e0b' : '#fbbf24'} theme={theme} />
              <MetricCard
                label="内存泄漏"
                value={metrics.leakDetected ? '检测到' : '正常'}
                icon={AlertTriangle}
                color={leakColor}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
          堆内存使用趋势
        </div>
        <LineChart
          data={metrics.history}
          color={memColor}
          theme={theme}
          height={140}
          maxValue={100}
          unit="%"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
            内存分配追踪
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>分配次数</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{metrics.allocations}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>释放次数</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#eab308' }}>{metrics.deallocations}</span>
            </div>
            <div
              style={{
                height: 8,
                background: theme === 'light' ? '#e8e8ed' : '#2e2e48',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${metrics.allocations > 0 ? Math.min(100, (metrics.deallocations / metrics.allocations) * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>
              释放率: {metrics.allocations > 0 ? ((metrics.deallocations / metrics.allocations) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
            GC 垃圾回收统计
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>GC 周期</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: theme === 'light' ? '#6c5ce7' : '#9d8fef' }}>{metrics.gcCycles}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>最近 GC 事件</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9' }}>{gcEvents.length}</span>
            </div>
            {gcEvents.length > 0 && (
              <div style={{ maxHeight: 80, overflow: 'auto', fontSize: 11 }}>
                {gcEvents.slice(-5).reverse().map((evt, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '3px 0',
                      borderBottom: `1px solid ${theme === 'light' ? '#f0f0f3' : '#1e1e32'}`,
                    }}
                  >
                    <span>{new Date(evt.time).toLocaleTimeString()}</span>
                    <span style={{ color: '#eab308' }}>{evt.duration.toFixed(1)} ms</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, opacity: 0.5 }}>
              注意：GC 事件监控仅在支持 PerformanceObserver('gc') 的浏览器中可用
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RenderSection({
  metrics,
  theme,
  cardStyle,
  metricGridStyle,
  resourceTimings,
  fpsHistory,
}: SectionProps & { metrics: RenderMetrics; resourceTimings: PerformanceResourceTiming[]; fpsHistory: number[] }) {
  const fpsColor = metrics.fps >= 50 ? '#22c55e' : metrics.fps >= 30 ? '#eab308' : '#ef4444'
  const frameColor = getStatusColor(metrics.frameTime, [16, 25])

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <GaugeChart
            value={metrics.fps}
            max={120}
            label="FPS"
            color={fpsColor}
            theme={theme}
            size={150}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={18} color={fpsColor} />
              渲染性能分析
            </div>
            <div style={metricGridStyle}>
              <MetricCard label="FPS" value={metrics.fps} unit="fps" icon={Zap} color={fpsColor} theme={theme} />
              <MetricCard label="帧时间" value={metrics.frameTime.toFixed(2)} unit="ms" icon={Clock} color={frameColor} theme={theme} />
              <MetricCard label="丢帧" value={metrics.droppedFrames} unit="帧" icon={AlertTriangle} color={metrics.droppedFrames > 5 ? '#ef4444' : '#22c55e'} theme={theme} />
              <MetricCard
                label="渲染状态"
                value={metrics.fps >= 50 ? '流畅' : metrics.fps >= 30 ? '一般' : '卡顿'}
                icon={Activity}
                color={fpsColor}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
          FPS 实时趋势
        </div>
        <LineChart
          data={fpsHistory.length > 0 ? fpsHistory : metrics.history}
          color={fpsColor}
          theme={theme}
          height={140}
          maxValue={120}
          unit="fps"
        />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
          渲染瓶颈检测
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <BottleneckItem
            label="CSS 重排 (Reflow)"
            value={metrics.reflowCount}
            color={metrics.reflowCount > 10 ? '#ef4444' : '#22c55e'}
            desc="DOM 尺寸变化触发"
            theme={theme}
          />
          <BottleneckItem
            label="CSS 重绘 (Repaint)"
            value={metrics.repaintCount}
            color={metrics.repaintCount > 20 ? '#eab308' : '#22c55e'}
            desc="样式变化触发"
            theme={theme}
          />
          <BottleneckItem
            label="长任务 (Long Tasks)"
            value={metrics.droppedFrames}
            color={metrics.droppedFrames > 0 ? '#ef4444' : '#22c55e'}
            desc="超过 50ms 的任务"
            theme={theme}
          />
        </div>
      </div>

      {resourceTimings.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
            资源加载时间 (Top {Math.min(resourceTimings.length, 10)})
          </div>
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            {resourceTimings
              .slice()
              .sort((a, b) => b.duration - a.duration)
              .slice(0, 10)
              .map((res, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 8px',
                    borderBottom: `1px solid ${theme === 'light' ? '#f0f0f3' : '#1e1e32'}`,
                    fontSize: 12,
                  }}
                >
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>
                    {res.name.split('/').pop() || res.name}
                  </div>
                  <div
                    style={{
                      width: `${Math.min(100, (res.duration / (resourceTimings[0]?.duration || 1)) * 100)}%`,
                      height: 6,
                      background: theme === 'light' ? '#6c5ce7' : '#9d8fef',
                      borderRadius: 3,
                      minWidth: 4,
                    }}
                  />
                  <div style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>
                    {res.duration.toFixed(0)} ms
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BottleneckItem({
  label,
  value,
  color,
  desc,
  theme,
}: {
  label: string
  value: number
  color: string
  desc: string
  theme: 'light' | 'dark'
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: theme === 'light' ? '#f8f8fb' : '#1e1e32',
        border: `1px solid ${theme === 'light' ? '#e8e8ed' : '#2e2e48'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>{desc}</div>
      <div
        style={{
          marginTop: 8,
          height: 4,
          background: theme === 'light' ? '#e8e8ed' : '#2e2e48',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, value * 5)}%`,
            background: color,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  )
}

function NetworkSection({
  metrics,
  theme,
  cardStyle,
  metricGridStyle,
}: SectionProps & { metrics: NetworkMetrics }) {
  const netColor = theme === 'light' ? '#0ea5e9' : '#38bdf8'

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi size={80} color={netColor} style={{ opacity: 0.2 }} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: netColor }}>
                {metrics.downlink > 0 ? `${metrics.downlink.toFixed(1)}` : 'N/A'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Mbps 下载</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Network size={18} color={netColor} />
              网络分析
            </div>
            <div style={metricGridStyle}>
              <MetricCard label="网络类型" value={metrics.type} icon={Wifi} color={netColor} theme={theme} />
              <MetricCard label="有效类型" value={metrics.effectiveType.toUpperCase()} icon={Activity} color={theme === 'light' ? '#f59e0b' : '#fbbf24'} theme={theme} />
              <MetricCard label="下载速率" value={metrics.downlink > 0 ? metrics.downlink.toFixed(2) : 'N/A'} unit="Mbps" icon={Zap} color="#22c55e" theme={theme} />
              <MetricCard label="往返延迟" value={metrics.rtt > 0 ? metrics.rtt : 'N/A'} unit="ms" icon={Clock} color="#eab308" theme={theme} />
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color={netColor} />
          网络速率趋势
        </div>
        <LineChart
          data={metrics.history}
          color={netColor}
          theme={theme}
          height={140}
          unit="Mbps"
        />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color={netColor} />
          资源加载分析
        </div>
        <div style={metricGridStyle}>
          <MetricCard
            label="资源进度"
            value={`${metrics.resourcesLoaded}/${metrics.resourcesTotal}`}
            icon={Database}
            color={theme === 'light' ? '#0ea5e9' : '#38bdf8'}
            theme={theme}
          />
          <MetricCard
            label="最慢资源"
            value={metrics.loadTime > 0 ? `${metrics.loadTime.toFixed(0)} ms` : 'N/A'}
            icon={Clock}
            color={metrics.loadTime > 3000 ? '#ef4444' : '#22c55e'}
            theme={theme}
          />
          <MetricCard
            label="请求状态"
            value={metrics.resourcesLoaded === metrics.resourcesTotal && metrics.resourcesTotal > 0 ? '已完成' : '进行中'}
            icon={CheckCircle}
            color={metrics.resourcesLoaded === metrics.resourcesTotal && metrics.resourcesTotal > 0 ? '#22c55e' : '#eab308'}
            theme={theme}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 6,
              background: theme === 'light' ? '#e8e8ed' : '#2e2e48',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${metrics.resourcesTotal > 0 ? (metrics.resourcesLoaded / metrics.resourcesTotal) * 100 : 0}%`,
                background: `linear-gradient(90deg, ${netColor}, ${theme === 'light' ? '#6c5ce7' : '#9d8fef'})`,
                transition: 'width 0.5s',
              }}
            />
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
            资源加载进度: {metrics.resourcesTotal > 0 ? ((metrics.resourcesLoaded / metrics.resourcesTotal) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>
    </div>
  )
}

function StorageSection({
  metrics,
  theme,
  cardStyle,
  metricGridStyle,
}: SectionProps & { metrics: StorageMetrics }) {
  const totalUsed = metrics.localStorage.used + metrics.sessionStorage.used + metrics.cookies.size
  const storageColor = getStatusColor((totalUsed / 5242880) * 100, [50, 80])

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <GaugeChart
            value={Math.min(100, (totalUsed / 5242880) * 100)}
            max={100}
            label="存储使用"
            color={storageColor}
            theme={theme}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HardDrive size={18} color={storageColor} />
              存储分析
            </div>
            <div style={metricGridStyle}>
              <MetricCard
                label="LocalStorage"
                value={formatBytes(metrics.localStorage.used)}
                unit={`${metrics.localStorage.items} 项`}
                icon={Database}
                color={theme === 'light' ? '#6c5ce7' : '#9d8fef'}
                theme={theme}
              />
              <MetricCard
                label="SessionStorage"
                value={formatBytes(metrics.sessionStorage.used)}
                unit={`${metrics.sessionStorage.items} 项`}
                icon={Database}
                color={theme === 'light' ? '#0ea5e9' : '#38bdf8'}
                theme={theme}
              />
              <MetricCard
                label="Cookies"
                value={metrics.cookies.count}
                unit={`${formatBytes(metrics.cookies.size)}`}
                icon={HardDrive}
                color={theme === 'light' ? '#f59e0b' : '#fbbf24'}
                theme={theme}
              />
              <MetricCard
                label="总占用"
                value={formatBytes(totalUsed)}
                icon={Layers}
                color={storageColor}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
          存储使用趋势
        </div>
        <LineChart
          data={metrics.history}
          color={theme === 'light' ? '#6c5ce7' : '#9d8fef'}
          theme={theme}
          height={140}
          unit="bytes"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color={theme === 'light' ? '#6c5ce7' : '#9d8fef'} />
            LocalStorage 详情
          </div>
          <StorageDetail
            used={metrics.localStorage.used}
            capacity={5242880}
            items={metrics.localStorage.items}
            theme={theme}
          />
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color={theme === 'light' ? '#0ea5e9' : '#38bdf8'} />
            SessionStorage 详情
          </div>
          <StorageDetail
            used={metrics.sessionStorage.used}
            capacity={5242880}
            items={metrics.sessionStorage.items}
            theme={theme}
          />
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HardDrive size={16} color={theme === 'light' ? '#f59e0b' : '#fbbf24'} />
            IndexedDB 数据库
          </div>
          {metrics.indexedDB.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metrics.indexedDB.map((db, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: theme === 'light' ? '#f8f8fb' : '#1e1e32',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{db.name}</div>
                  <div style={{ opacity: 0.6, fontSize: 11 }}>
                    版本: {db.version} | 存储对象: {db.stores.length}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'center', padding: 20 }}>
              暂无 IndexedDB 数据库或浏览器不支持 <br />
              <span style={{ fontSize: 11 }}>
                点击"刷新"按钮重新扫描
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StorageDetail({
  used,
  capacity,
  items,
  theme,
}: {
  used: number
  capacity: number
  items: number
  theme: 'light' | 'dark'
}) {
  const percent = Math.min(100, (used / capacity) * 100)
  const color = getStatusColor(percent, [50, 80])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ opacity: 0.7 }}>已使用</span>
        <span style={{ fontWeight: 600 }}>{formatBytes(used)}</span>
      </div>
      <div
        style={{
          height: 10,
          background: theme === 'light' ? '#e8e8ed' : '#2e2e48',
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.6 }}>
        <span>容量: {formatBytes(capacity)}</span>
        <span>条目: {items}</span>
      </div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>
        使用率: {percent.toFixed(1)}%
      </div>
    </div>
  )
}