import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Activity, HardDrive, Gauge as GaugeIcon,
  RefreshCw, AlertTriangle, CheckCircle,
  Play, Pause, Sparkles, Rocket, Eye, Clock,
  Trash2, Wrench, BarChart3, PieChart, Timer, Server
} from 'lucide-react'

interface SystemMetrics {
  fps: number
  fpsMin: number
  fpsMax: number
  memoryUsed: number
  memoryTotal: number
  memoryPercent: number
  memoryTrend: 'stable' | 'up' | 'down'
  storageUsed: number
  storageQuota: number
  storagePercent: number
  startupTime: number
  domReadyTime: number
  loadTime: number
  ttfbTime: number
  resourceCount: number
  resourceTypes: Record<string, number>
  networkType: string
  downlink: number
  online: boolean
  cores: number
  deviceMemory: number
  dpr: number
  screenWidth: number
  screenHeight: number
  colorDepth: number
  batteryLevel: number | null
  batteryCharging: boolean | null
  hasWebGL: boolean
  hasWebGPU: boolean
  hasWASM: boolean
  hasServiceWorker: boolean
  hasFileSystemAccess: boolean
  cpuEstimate: number
  longTasks: PerformanceEntry[]
}

interface HistoryPoint {
  time: number
  fps: number
  memory: number
  cpu: number
}

interface Recommendation {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: 'performance' | 'memory' | 'startup' | 'cleanup' | 'network'
  action?: string
}

interface GaugeProps {
  value: number
  max: number
  label: string
  unit: string
  size?: number
  sublabel?: string
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const getGaugeGradient = (percent: number): string => {
  if (percent >= 80) return '#ef4444'
  if (percent >= 60) return '#f59e0b'
  return '#22c55e'
}

function Gauge({ value, max, label, unit, size = 120, sublabel }: GaugeProps) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const percent = clamp((value / max) * 100, 0, 100)
  const offset = circumference - (percent / 100) * circumference
  const strokeColor = getGaugeGradient(percent)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: strokeColor }}>
            {Math.round(value)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{unit}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sublabel}</div>}
    </div>
  )
}

export default function SystemOptimizer() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'optimize' | 'benchmark' | 'cleanup'>('dashboard')
  const [benchmarkResult, setBenchmarkResult] = useState<number | null>(null)
  const [isBenchmarking, setIsBenchmarking] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [performanceScore, setPerformanceScore] = useState(0)
  const [startupAnalysis, setStartupAnalysis] = useState<string[]>([])
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const rafRef = useRef<number | null>(null)
  const frameCallbackRef = useRef<((time: number) => void) | null>(null)
  const fpsValuesRef = useRef<number[]>([])
  const memoryValuesRef = useRef<number[]>([])
  const navigationEntryRef = useRef<PerformanceNavigationTiming | null>(null)
  const longTaskObserverRef = useRef<PerformanceObserver | null>(null)

  const computePerformanceScore = useCallback((m: SystemMetrics): number => {
    let score = 100

    if (m.fps < 60) score -= (60 - m.fps) * 0.8
    if (m.fps < 30) score -= 15

    if (m.memoryPercent > 50) score -= (m.memoryPercent - 50) * 0.6
    if (m.memoryPercent > 80) score -= 20

    if (m.cpuEstimate > 50) score -= (m.cpuEstimate - 50) * 0.5
    if (m.cpuEstimate > 80) score -= 15

    if (m.startupTime > 3000) score -= 15
    else if (m.startupTime > 1500) score -= 8

    if (m.longTasks.length > 3) score -= 10

    if (m.storagePercent > 80) score -= 5

    return clamp(Math.round(score), 0, 100)
  }, [])

  const generateRecommendations = useCallback((m: SystemMetrics): Recommendation[] => {
    const recs: Recommendation[] = []

    if (m.fps < 30) {
      recs.push({
        id: 'fps-critical',
        title: '帧率严重过低',
        description: `当前 FPS 仅 ${m.fps}，远低于 60 FPS 标准。可能存在大量重计算或渲染瓶颈。`,
        severity: 'critical',
        category: 'performance',
        action: '建议关闭其他标签页，或检查是否存在占用资源的脚本'
      })
    } else if (m.fps < 50) {
      recs.push({
        id: 'fps-warning',
        title: '帧率低于标准',
        description: `当前 FPS 为 ${m.fps}，低于 60 FPS 标准。`,
        severity: 'warning',
        category: 'performance',
        action: '考虑减少页面动画和复杂 DOM 操作'
      })
    }

    if (m.memoryPercent > 85) {
      recs.push({
        id: 'memory-critical',
        title: '内存使用率过高',
        description: `JavaScript 堆内存使用率已达 ${m.memoryPercent}%，有内存泄漏风险。`,
        severity: 'critical',
        category: 'memory',
        action: '建议立即刷新页面或关闭浏览器标签页，防止内存溢出'
      })
    } else if (m.memoryPercent > 70) {
      recs.push({
        id: 'memory-warning',
        title: '内存使用率偏高',
        description: `当前内存使用率 ${m.memoryPercent}%，建议关注内存增长趋势。`,
        severity: 'warning',
        category: 'memory',
        action: '尝试关闭不必要的标签页或使用内存清理工具'
      })
    }

    if (m.startupTime > 3000) {
      recs.push({
        id: 'startup-slow',
        title: '页面启动时间过长',
        description: `启动耗时 ${Math.round(m.startupTime)}ms，远超 3 秒标准。TTFB: ${Math.round(m.ttfbTime)}ms, DOM 就绪: ${Math.round(m.domReadyTime)}ms。`,
        severity: 'warning',
        category: 'startup',
        action: '优化首屏加载资源，考虑代码分割和懒加载'
      })
    } else if (m.startupTime > 1500) {
      recs.push({
        id: 'startup-moderate',
        title: '页面启动时间偏长',
        description: `启动耗时 ${Math.round(m.startupTime)}ms。`,
        severity: 'info',
        category: 'startup',
        action: '可考虑优化关键资源加载顺序'
      })
    }

    if (m.longTasks.length > 5) {
      recs.push({
        id: 'long-tasks',
        title: '检测到大量长任务',
        description: `检测到 ${m.longTasks.length} 个超过 50ms 的长任务，主线程存在阻塞。`,
        severity: 'warning',
        category: 'performance',
        action: '使用 Performance 面板分析长任务来源，考虑代码分块执行'
      })
    }

    if (m.storagePercent > 80) {
      recs.push({
        id: 'storage-full',
        title: '存储空间即将耗尽',
        description: `浏览器存储已使用 ${m.storagePercent}% (${m.storageUsed}MB / ${m.storageQuota}MB)。`,
        severity: 'warning',
        category: 'cleanup',
        action: '清理不必要的 localStorage/sessionStorage 数据'
      })
    }

    if (m.resourceCount > 50) {
      recs.push({
        id: 'resource-heavy',
        title: '页面资源过多',
        description: `当前页面加载了 ${m.resourceCount} 个资源，可能影响加载速度。`,
        severity: 'info',
        category: 'cleanup',
        action: '检查是否有未使用的脚本和样式文件'
      })
    }

    if (m.deviceMemory > 0 && m.memoryPercent < 30) {
      recs.push({
        id: 'memory-good',
        title: '内存状态良好',
        description: `当前内存使用率 ${m.memoryPercent}%，状态健康。`,
        severity: 'info',
        category: 'memory'
      })
    }

    if (recs.length === 0) {
      recs.push({
        id: 'all-good',
        title: '系统状态优良',
        description: '所有指标均在正常范围内，系统运行状态良好。',
        severity: 'info',
        category: 'performance'
      })
    }

    return recs
  }, [])

  const analyzeStartup = useCallback((nav: PerformanceNavigationTiming | null): string[] => {
    const findings: string[] = []
    if (!nav) {
      findings.push('无法获取导航时序数据，可能由于浏览器限制或跨域原因。')
      return findings
    }

    const ttfb = nav.responseStart - nav.requestStart
    if (ttfb > 600) findings.push(`⚠️ TTFB (首字节时间) 为 ${Math.round(ttfb)}ms，超过 600ms 建议标准。`)
    else findings.push(`✅ TTFB 正常: ${Math.round(ttfb)}ms`)

    const domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime
    if (domContentLoaded > 2500) findings.push(`⚠️ DOM 就绪耗时 ${Math.round(domContentLoaded)}ms，建议优化关键渲染路径。`)
    else findings.push(`✅ DOM 就绪正常: ${Math.round(domContentLoaded)}ms`)

    const loadTime = nav.loadEventEnd - nav.startTime
    if (loadTime > 3000) findings.push(`⚠️ 页面加载耗时 ${Math.round(loadTime)}ms，属于慢速加载。`)
    else findings.push(`✅ 页面加载正常: ${Math.round(loadTime)}ms`)

    const parseTime = nav.domInteractive - nav.startTime
    if (parseTime > 1500) findings.push(`💡 HTML 解析耗时 ${Math.round(parseTime)}ms，建议检查 DOM 复杂度。`)

    const connTime = nav.connectEnd - nav.connectStart
    if (connTime > 500) findings.push(`💡 网络连接耗时 ${Math.round(connTime)}ms，可能受网络延迟影响。`)

    return findings
  }, [])

  const collectMetrics = useCallback((): SystemMetrics => {
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; saveData?: boolean; type?: string }
      hardwareConcurrency?: number
      deviceMemory?: number
      getBattery?: () => Promise<{ level: number; charging: boolean }>
    }

    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }

    let memoryUsed = 0
    let memoryTotal = 0
    let memoryPercent = 0
    let memoryTrend: 'stable' | 'up' | 'down' = 'stable'

    if (perf.memory) {
      memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)
      memoryTotal = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024)
      memoryPercent = Math.round((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100)

      const prev = memoryValuesRef.current[memoryValuesRef.current.length - 1]
      if (prev !== undefined) {
        if (memoryPercent > prev + 2) memoryTrend = 'up'
        else if (memoryPercent < prev - 2) memoryTrend = 'down'
      }
      memoryValuesRef.current.push(memoryPercent)
      if (memoryValuesRef.current.length > 30) memoryValuesRef.current.shift()
    }

    let storageUsed = 0
    let storageQuota = 0
    let storagePercent = 0
    try {
      const storage = navigator.storage as unknown as { estimate?: () => Promise<{ usage: number; quota: number }> }
      if (storage?.estimate) {
        storage.estimate().then((est) => {
          storageUsed = Math.round(est.usage / 1024 / 1024)
          storageQuota = Math.round(est.quota / 1024 / 1024)
          storagePercent = Math.round((est.usage / est.quota) * 100)
        })
      }
    } catch {}

    let startupTime = 0
    let domReadyTime = 0
    let loadTime = 0
    let ttfbTime = 0

    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        const navEntry = navEntries[0]
        navigationEntryRef.current = navEntry
        startupTime = navEntry.loadEventEnd - navEntry.startTime
        domReadyTime = navEntry.domContentLoadedEventEnd - navEntry.startTime
        loadTime = navEntry.loadEventEnd - navEntry.startTime
        ttfbTime = navEntry.responseStart - navEntry.requestStart
      }
    } catch {}

    const resourceEntries = performance.getEntriesByType('resource')
    const resourceCount = resourceEntries.length
    const resourceTypes: Record<string, number> = {}
    resourceEntries.forEach((entry) => {
      const initiator = (entry as PerformanceResourceTiming).initiatorType || 'other'
      resourceTypes[initiator] = (resourceTypes[initiator] || 0) + 1
    })

    const conn = nav.connection
    const networkType = conn?.effectiveType || 'unknown'
    const downlink = conn?.downlink || 0

    const avgFps = fpsValuesRef.current.length > 0
      ? Math.round(fpsValuesRef.current.reduce((a, b) => a + b, 0) / fpsValuesRef.current.length)
      : 60

    const cpuEstimate = clamp(
      100 - (avgFps / 60) * 100 + (memoryPercent > 70 ? 15 : 0),
      0, 100
    )

    return {
      fps: frameCountRef.current,
      fpsMin: 0,
      fpsMax: 0,
      memoryUsed,
      memoryTotal,
      memoryPercent,
      memoryTrend,
      storageUsed,
      storageQuota,
      storagePercent,
      startupTime,
      domReadyTime,
      loadTime,
      ttfbTime,
      resourceCount,
      resourceTypes,
      networkType,
      downlink,
      online: navigator.onLine,
      cores: nav.hardwareConcurrency || 0,
      deviceMemory: nav.deviceMemory || 0,
      dpr: window.devicePixelRatio,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      batteryLevel: null,
      batteryCharging: null,
      hasWebGL: (() => {
        try {
          const canvas = document.createElement('canvas')
          return !!canvas.getContext('webgl')
        } catch { return false }
      })(),
      hasWebGPU: 'gpu' in navigator,
      hasWASM: typeof WebAssembly !== 'undefined',
      hasServiceWorker: 'serviceWorker' in navigator,
      hasFileSystemAccess: 'showOpenFilePicker' in window,
      cpuEstimate,
      longTasks: longTaskObserverRef.current ? [] : [],
    }
  }, [])

  const updateMetrics = useCallback(() => {
    const newMetrics = collectMetrics()
    setMetrics(newMetrics)
    setHistory(prev => {
      const next = [...prev, {
        time: Date.now(),
        fps: newMetrics.fps,
        memory: newMetrics.memoryPercent,
        cpu: newMetrics.cpuEstimate
      }]
      return next.slice(-60)
    })
    fpsValuesRef.current.push(newMetrics.fps)
    if (fpsValuesRef.current.length > 30) fpsValuesRef.current.shift()
  }, [collectMetrics])

  useEffect(() => {
    if (!metrics) return
    setPerformanceScore(computePerformanceScore(metrics))
    setRecommendations(generateRecommendations(metrics))
    setStartupAnalysis(analyzeStartup(navigationEntryRef.current))
  }, [metrics, computePerformanceScore, generateRecommendations, analyzeStartup])

  useEffect(() => {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (metrics) {
            setMetrics(prev => prev ? {
              ...prev,
              longTasks: [...prev.longTasks, ...entries].slice(-20)
            } : prev)
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
        longTaskObserverRef.current = observer
      }
    } catch {}

    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        navigationEntryRef.current = navEntries[0]
      }
    } catch {}

    return () => {
      if (longTaskObserverRef.current) {
        longTaskObserverRef.current.disconnect()
        longTaskObserverRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    updateMetrics()
  }, [updateMetrics])

  useEffect(() => {
    if (!isMonitoring) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    frameCountRef.current = 0
    lastFpsTimeRef.current = performance.now()

    frameCallbackRef.current = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastFpsTimeRef.current >= 1000) {
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
        updateMetrics()
      }
      rafRef.current = requestAnimationFrame(frameCallbackRef.current!)
    }
    rafRef.current = requestAnimationFrame(frameCallbackRef.current)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isMonitoring, updateMetrics])

  const runBenchmark = async () => {
    setIsBenchmarking(true)
    setBenchmarkResult(null)

    const start = performance.now()
    let operations = 0
    const testDuration = 3000

    while (performance.now() - start < testDuration) {
      const arr = new Array(1000).fill(0).map((_, i) => i)
      const sorted = arr.sort((a, b) => b - a)
      sorted.map(x => Math.sqrt(x) * Math.PI)
      operations++
    }

    const elapsed = performance.now() - start
    const opsPerSec = Math.round((operations / elapsed) * 1000)
    setBenchmarkResult(opsPerSec)
    setIsBenchmarking(false)
  }

  const runGarbageCollection = () => {
    if (typeof (window as any).gc === 'function') {
      try {
        ;(window as any).gc()
        updateMetrics()
      } catch {}
    }
  }

  const clearStorage = (type: 'local' | 'session') => {
    const storage = type === 'local' ? localStorage : sessionStorage
    const before = storage.length
    storage.clear()
    const after = storage.length
    updateMetrics()
    return { before, after }
  }

  const severityColor = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
    }
  }

  const severityBg = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'critical': return 'rgba(239,68,68,0.1)'
      case 'warning': return 'rgba(245,158,11,0.1)'
      case 'info': return 'rgba(59,130,246,0.1)'
    }
  }

  const scoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    if (score >= 40) return '#f97316'
    return '#ef4444'
  }

  if (!metrics) {
    return (
      <div style={{
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        color: '#fff',
        fontFamily: 'Space Grotesk, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, color: '#94a3b8' }}>正在收集系统指标...</p>
        </div>
      </div>
    )
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 24
  }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, rgba(30,30,50,0.9), rgba(20,20,35,0.9))',
    borderRadius: 16,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    overflow: 'hidden'
  }

  return (
    <div style={{
      padding: '24px',
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      color: '#e0e0e8',
      fontFamily: 'Space Grotesk, "Noto Sans SC", sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GaugeIcon size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #f5f3ff, #c4b5fd)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              系统优化器
            </h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              实时浏览器性能分析与优化建议
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setIsMonitoring(!isMonitoring)} style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: isMonitoring ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600
          }}>
            {isMonitoring ? <><Pause size={14} /> 停止监控</> : <><Play size={14} /> 开始监控</>}
          </button>
          <button onClick={updateMetrics} style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#e0e0e8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { key: 'dashboard', label: '仪表板', icon: <GaugeIcon size={14} /> },
          { key: 'optimize', label: '优化建议', icon: <Sparkles size={14} /> },
          { key: 'cleanup', label: '资源清理', icon: <Trash2 size={14} /> },
          { key: 'benchmark', label: '性能基准', icon: <Rocket size={14} /> },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === tab.key ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.05)',
            color: activeTab === tab.key ? 'white' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Performance Score Hero */}
          <div style={{ ...cardStyle, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle cx="70" cy="70" r="58" fill="none"
                  stroke={scoreColor(performanceScore)}
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 58}
                  strokeDashoffset={2 * Math.PI * 58 * (1 - performanceScore / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor(performanceScore) }}>
                  {performanceScore}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>性能评分</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>综合性能指数</div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8 }}>
                {performanceScore >= 80 && '🌟 系统运行流畅，各项指标优秀'}
                {performanceScore >= 60 && performanceScore < 80 && '✨ 系统运行良好，部分指标可优化'}
                {performanceScore >= 40 && performanceScore < 60 && '⚠️ 系统性能一般，建议查看优化建议'}
                {performanceScore < 40 && '🚨 系统性能较差，强烈建议进行优化'}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>FPS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: metrics.fps >= 55 ? '#4ade80' : metrics.fps >= 30 ? '#fbbf24' : '#ef4444' }}>
                    {metrics.fps}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>内存</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: metrics.memoryPercent > 80 ? '#ef4444' : '#22c55e' }}>
                    {metrics.memoryPercent}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>CPU估算</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: metrics.cpuEstimate > 80 ? '#ef4444' : metrics.cpuEstimate > 50 ? '#fbbf24' : '#22c55e' }}>
                    {Math.round(metrics.cpuEstimate)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>启动</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: metrics.startupTime > 3000 ? '#ef4444' : metrics.startupTime > 1500 ? '#fbbf24' : '#22c55e' }}>
                    {metrics.startupTime > 0 ? `${Math.round(metrics.startupTime)}ms` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gauges Row */}
          <div style={{ ...gridStyle, marginBottom: 24 }}>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge
                value={metrics.fps}
                max={60}
                label="实时帧率"
                unit="FPS"
                size={130}
                sublabel={metrics.fps >= 55 ? '流畅' : metrics.fps >= 30 ? '一般' : '卡顿'}
              />
            </div>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge
                value={metrics.memoryPercent}
                max={100}
                label="内存占用"
                unit="%"
                size={130}
                sublabel={`${metrics.memoryUsed} / ${metrics.memoryTotal} MB`}
              />
            </div>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge
                value={Math.round(metrics.cpuEstimate)}
                max={100}
                label="CPU 负载估算"
                unit="%"
                size={130}
                sublabel={`${metrics.cores || '?'} 核心`}
              />
            </div>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge
                value={metrics.storagePercent}
                max={100}
                label="存储使用"
                unit="%"
                size={130}
                sublabel={`${metrics.storageUsed} / ${metrics.storageQuota} MB`}
              />
            </div>
          </div>

          {/* Charts Row */}
          <div style={gridStyle}>
            {/* FPS / Memory Line Chart */}
            <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Activity size={18} color="#a78bfa" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>性能趋势 (最近60秒)</span>
              </div>
              <PerformanceChart history={history} />
            </div>

            {/* Startup Time Analysis */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Timer size={18} color="#38bdf8" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>启动时序分析</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StartupBar label="TTFB" value={metrics.ttfbTime} warning={600} />
                <StartupBar label="DOM 就绪" value={metrics.domReadyTime} warning={2500} />
                <StartupBar label="页面加载" value={metrics.loadTime} warning={3000} />
                <StartupBar label="总启动时间" value={metrics.startupTime} warning={3000} highlight />
              </div>
            </div>

            {/* Resource Breakdown */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <PieChart size={18} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>资源加载分析</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                共加载 <span style={{ color: '#e0e0e8', fontWeight: 600 }}>{metrics.resourceCount}</span> 个资源
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(metrics.resourceTypes)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{type}</div>
                      <div style={{
                        flex: 1, height: 6, borderRadius: 3,
                        background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(count / Math.max(metrics.resourceCount, 1)) * 100}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #38bdf8)',
                          borderRadius: 3,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <div style={{ width: 32, fontSize: 11, color: '#cbd5e1', textAlign: 'right' }}>{count}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* System Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Server size={18} color="#22c55e" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>系统信息</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 2, color: '#cbd5e1' }}>
                <div>屏幕: {metrics.screenWidth} × {metrics.screenHeight}</div>
                <div>像素比: {metrics.dpr}x · 色深: {metrics.colorDepth}-bit</div>
                <div>CPU 核心: {metrics.cores || '未知'} · 内存: {metrics.deviceMemory || '未知'}GB</div>
                <div>网络: {metrics.online ? '🟢 在线' : '🔴 离线'} · {metrics.networkType.toUpperCase()}</div>
                {metrics.downlink > 0 && <div>下行速率: {metrics.downlink} Mbps</div>}
              </div>
            </div>

            {/* Browser Capabilities */}
            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={18} color="#facc15" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>浏览器能力检测</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {[
                  { key: 'WebGL', support: metrics.hasWebGL },
                  { key: 'WebGPU', support: metrics.hasWebGPU },
                  { key: 'WebAssembly', support: metrics.hasWASM },
                  { key: 'Service Worker', support: metrics.hasServiceWorker },
                  { key: 'File System API', support: metrics.hasFileSystemAccess },
                ].map(({ key, support }) => (
                  <div key={key} style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: support ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${support ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12
                  }}>
                    {support ? <CheckCircle size={14} color="#4ade80" /> : <AlertTriangle size={14} color="#ef4444" />}
                    <span style={{ color: support ? '#4ade80' : '#ef4444' }}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'optimize' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={20} color="#facc15" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>智能优化建议</span>
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
              共 {recommendations.length} 条建议
            </span>
          </div>
          {recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recommendations.map(rec => (
                <div key={rec.id} style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: severityBg(rec.severity),
                  border: `1px solid ${severityColor(rec.severity)}33`,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${severityColor(rec.severity)}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {rec.severity === 'critical' && <AlertTriangle size={18} color={severityColor(rec.severity)} />}
                    {rec.severity === 'warning' && <Wrench size={18} color={severityColor(rec.severity)} />}
                    {rec.severity === 'info' && <CheckCircle size={18} color={severityColor(rec.severity)} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e8' }}>{rec.title}</span>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: `${severityColor(rec.severity)}20`,
                        color: severityColor(rec.severity),
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>{rec.severity}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                      {rec.description}
                    </div>
                    {rec.action && (
                      <div style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: severityColor(rec.severity),
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8,
                        border: `1px dashed ${severityColor(rec.severity)}40`
                      }}>
                        💡 {rec.action}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 16px' }} />
              <p>当前系统状态良好，暂无优化建议</p>
            </div>
          )}

          {/* Startup Analysis Findings */}
          {startupAnalysis.length > 0 && (
            <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Clock size={18} color="#38bdf8" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#38bdf8' }}>启动时序详细分析</span>
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.8 }}>
                {startupAnalysis.map((finding, i) => (
                  <div key={i}>{finding}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cleanup' && (
        <div>
          {/* Cleanup Actions */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Trash2 size={20} color="#f97316" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>一键清理</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <CleanupButton
                label="清理 LocalStorage"
                description={`${localStorage.length} 项数据`}
                onClick={() => {
                  const { before } = clearStorage('local')
                  updateMetrics()
                  return `已清理 ${before} 项数据`
                }}
              />
              <CleanupButton
                label="清理 SessionStorage"
                description={`${sessionStorage.length} 项数据`}
                onClick={() => {
                  const { before } = clearStorage('session')
                  updateMetrics()
                  return `已清理 ${before} 项数据`
                }}
              />
              <CleanupButton
                label="触发 GC (如可用)"
                description="强制垃圾回收"
                onClick={() => {
                  runGarbageCollection()
                  updateMetrics()
                  return '已触发垃圾回收'
                }}
              />
              <CleanupButton
                label="刷新页面"
                description="重置所有状态"
                onClick={() => {
                  window.location.reload()
                  return '正在刷新...'
                }}
              />
            </div>
          </div>

          {/* Resource Breakdown for Cleanup */}
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <HardDrive size={18} color="#22c55e" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>存储详情</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 2, color: '#cbd5e1' }}>
                <div>LocalStorage: <span style={{ color: '#e0e0e8', fontWeight: 600 }}>{localStorage.length}</span> 项</div>
                <div>SessionStorage: <span style={{ color: '#e0e0e8', fontWeight: 600 }}>{sessionStorage.length}</span> 项</div>
                <div>IndexedDB: <span style={{ color: '#e0e0e8', fontWeight: 600 }}>检测中...</span></div>
                <div>Cookie 数: <span style={{ color: '#e0e0e8', fontWeight: 600 }}>{document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0}</span></div>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#64748b' }}>
                存储使用: {metrics.storageUsed}MB / {metrics.storageQuota}MB ({metrics.storagePercent}%)
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BarChart3 size={18} color="#38bdf8" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>页面资源类型</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(metrics.resourceTypes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 70, fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{type}</div>
                      <div style={{
                        flex: 1, height: 8, borderRadius: 4,
                        background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(count / Math.max(metrics.resourceCount, 1)) * 100}%`,
                          background: 'linear-gradient(90deg, #38bdf8, #22c55e)',
                          borderRadius: 4
                        }} />
                      </div>
                      <div style={{ width: 32, fontSize: 12, color: '#e0e0e8', textAlign: 'right', fontWeight: 600 }}>{count}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Eye size={18} color="#a78bfa" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>优化检查清单</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ChecklistItem label="关闭不必要的标签页" done={metrics.memoryPercent < 50} />
                <ChecklistItem label="清理浏览器缓存" done={metrics.storagePercent < 50} />
                <ChecklistItem label="禁用无用的浏览器扩展" done={true} />
                <ChecklistItem label="启用硬件加速" done={metrics.hasWebGL} />
                <ChecklistItem label="保持浏览器更新" done={true} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'benchmark' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Rocket size={20} color="#facc15" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>JavaScript 性能基准测试</span>
          </div>

          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 180, height: 180, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(56,189,248,0.2))',
              border: '2px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              position: 'relative'
            }}>
              {isBenchmarking ? (
                <RefreshCw size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#a78bfa' }}>
                    {benchmarkResult ? benchmarkResult.toLocaleString() : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {benchmarkResult ? 'ops/sec' : '等待测试'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={runBenchmark}
              disabled={isBenchmarking}
              style={{
                padding: '14px 36px',
                borderRadius: 12,
                border: 'none',
                background: isBenchmarking ? '#374151' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white',
                cursor: isBenchmarking ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}>
              {isBenchmarking ? <>测试中...</> : <><Play size={16} /> 开始测试</>}
            </button>

            {benchmarkResult && !isBenchmarking && (
              <div style={{ marginTop: 24, fontSize: 13, color: '#94a3b8' }}>
                {benchmarkResult > 1000000 ? (
                  <span style={{ color: '#4ade80' }}>🌟 性能优秀！你的 JavaScript 执行速度非常快。</span>
                ) : benchmarkResult > 500000 ? (
                  <span style={{ color: '#22c55e' }}>✨ 性能良好，日常使用完全足够。</span>
                ) : benchmarkResult > 100000 ? (
                  <span style={{ color: '#fbbf24' }}>⚠️ 性能中等，可考虑关闭其他标签页提升性能。</span>
                ) : (
                  <span style={{ color: '#ef4444' }}>🚨 性能较低，建议关闭其他程序或重启浏览器。</span>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', fontSize: 12, color: '#64748b' }}>
            测试说明：本测试在 3 秒内执行数组排序、映射和数学运算，测量每秒操作数。测试仅作参考，实际性能因浏览器、设备和系统负载而异。
          </div>
        </div>
      )}
    </div>
  )
}

function PerformanceChart({ history }: { history: HistoryPoint[] }) {
  const width = 600
  const height = 140
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const fpsMax = 60
  const memMax = 100
  const count = Math.max(history.length, 1)

  const toPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  }

  const fpsPoints = history.map((p, i) => ({
    x: padding.left + (i / Math.max(count - 1, 1)) * chartW,
    y: padding.top + chartH - (p.fps / fpsMax) * chartH
  }))

  const memPoints = history.map((p, i) => ({
    x: padding.left + (i / Math.max(count - 1, 1)) * chartW,
    y: padding.top + chartH - (p.memory / memMax) * chartH
  }))

  const fpsAreaPath = history.length > 1
    ? `${toPath(fpsPoints)} L${fpsPoints[fpsPoints.length - 1].x},${padding.top + chartH} L${fpsPoints[0].x},${padding.top + chartH} Z`
    : ''

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: height }}>
        <defs>
          <linearGradient id="fpsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i}
            x1={padding.left} y1={padding.top + t * chartH}
            x2={padding.left + chartW} y2={padding.top + t * chartH}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
        ))}

        {history.length > 1 && (
          <>
            <path d={fpsAreaPath} fill="url(#fpsGrad)" />
            <path d={toPath(fpsPoints)} fill="none" stroke="#a78bfa" strokeWidth="2" />
            <path d={toPath(memPoints)} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
          </>
        )}

        {history.length === 0 && (
          <text x={width / 2} y={height / 2} fill="#64748b" fontSize="12" textAnchor="middle">
            等待数据中...
          </text>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: '#a78bfa', display: 'inline-block' }} /> FPS
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: '#38bdf8', display: 'inline-block' }} /> 内存
        </span>
      </div>
    </div>
  )
}

function StartupBar({ label, value, warning, highlight }: { label: string; value: number; warning: number; highlight?: boolean }) {
  const percent = clamp((value / (warning * 2)) * 100, 0, 100)
  const color = value > warning ? '#ef4444' : value > warning * 0.7 ? '#f59e0b' : '#22c55e'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: highlight ? '#facc15' : '#94a3b8', fontWeight: highlight ? 600 : 400 }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value > 0 ? `${Math.round(value)}ms` : 'N/A'}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  )
}

function CleanupButton({ label, description, onClick }: { label: string; description: string; onClick: () => string }) {
  const [toast, setToast] = useState<string | null>(null)

  const handleClick = () => {
    const result = onClick()
    setToast(result)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <button onClick={handleClick} style={{
      padding: '16px',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.03)',
      color: '#e0e0e8',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      transition: 'all 0.2s',
      position: 'relative'
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
    >
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{description}</div>
      {toast && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: -8,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'rgba(34,197,94,0.9)',
          color: 'white',
          fontSize: 11,
          fontWeight: 600
        }}>
          {toast}
        </div>
      )}
    </button>
  )
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {done ? (
        <CheckCircle size={16} color="#4ade80" />
      ) : (
        <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid rgba(255,255,255,0.2)' }} />
      )}
      <span style={{ fontSize: 12, color: done ? '#4ade80' : '#94a3b8' }}>{label}</span>
    </div>
  )
}