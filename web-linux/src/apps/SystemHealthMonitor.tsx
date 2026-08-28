import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Activity, Cpu, HardDrive, Wifi, Monitor, 
  AlertTriangle, CheckCircle, RefreshCw, Download,
  Shield, Zap, Globe, MemoryStick
} from 'lucide-react'

interface HealthMetric {
  id: string
  name: string
  value: number | string
  unit: string
  status: 'excellent' | 'good' | 'warning' | 'critical'
  icon: React.ReactNode
  description: string
  history: number[]
}

interface SystemInfo {
  userAgent: string
  platform: string
  language: string
  cores: number
  memory: number | null
  cookiesEnabled: boolean
  doNotTrack: string | null
  online: boolean
  screenResolution: string
  colorDepth: number
  timezone: string
  devicePixelRatio: number
}

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  memoryTotal: number
  localStorageSize: number
  sessionStorageSize: number
  domNodes: number
  resources: number
  paintMetrics: { firstPaint: number; firstContentfulPaint: number }
  navigationMetrics: { domContentLoaded: number; loadEvent: number; domInteractive: number }
}

export default function SystemHealthMonitor() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'details' | 'history'>('dashboard')
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())
  const fpsRef = useRef(60)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981'
      case 'good': return '#3b82f6'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return '优秀'
      case 'good': return '良好'
      case 'warning': return '警告'
      case 'critical': return '严重'
      default: return '未知'
    }
  }

  const getPerformanceStatus = (value: number, thresholds: { excellent: number; good: number; warning: number }, inverse = false) => {
    if (inverse) {
      if (value >= thresholds.excellent) return 'excellent'
      if (value >= thresholds.good) return 'good'
      if (value >= thresholds.warning) return 'warning'
      return 'critical'
    }
    if (value <= thresholds.excellent) return 'excellent'
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'critical'
  }

  const collectSystemInfo = useCallback(() => {
    const nav = navigator
    const info: SystemInfo = {
      userAgent: nav.userAgent,
      platform: nav.platform || 'Unknown',
      language: nav.language || 'Unknown',
      cores: nav.hardwareConcurrency || 1,
      memory: (nav as Navigator & { deviceMemory?: number }).deviceMemory || null,
      cookiesEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,
      online: nav.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      devicePixelRatio: window.devicePixelRatio || 1
    }
    setSystemInfo(info)
  }, [])

  const calculateStorageSize = (storage: Storage): number => {
    let total = 0
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key) {
          const value = storage.getItem(key) || ''
          total += key.length + value.length
        }
      }
    } catch {
      // SecurityError or other
    }
    return total
  }

  const collectPerformanceMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const perf = performance
    const perfMemory = (perf as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory

    // FPS measurement
    const measureFps = (): Promise<number> => {
      return new Promise((resolve) => {
        let frames = 0
        const start = performance.now()
        const count = () => {
          frames++
          if (performance.now() - start < 1000) {
            requestAnimationFrame(count)
          } else {
            resolve(frames)
          }
        }
        requestAnimationFrame(count)
      })
    }

    // DOM node count
    const domNodes = document.getElementsByTagName('*').length

    // Resource count
    const resources = perf.getEntriesByType('resource').length

    // Paint metrics
    let firstPaint = 0
    let firstContentfulPaint = 0
    try {
      const paintEntries = perf.getEntriesByType('paint')
      for (const entry of paintEntries) {
        if (entry.name === 'first-paint') firstPaint = entry.startTime
        if (entry.name === 'first-contentful-paint') firstContentfulPaint = entry.startTime
      }
    } catch {
      // Paint API not supported
    }

    // Navigation metrics
    let domContentLoaded = 0
    let loadEvent = 0
    let domInteractive = 0
    try {
      const navEntries = perf.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming
        domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime
        loadEvent = nav.loadEventEnd - nav.startTime
        domInteractive = nav.domInteractive - nav.startTime
      }
    } catch {
      // Navigation API not supported
    }

    // Memory
    let memoryUsage = 0
    let memoryTotal = 0
    if (perfMemory) {
      memoryUsage = perfMemory.usedJSHeapSize
      memoryTotal = perfMemory.totalJSHeapSize
    }

    // Storage sizes
    const localStorageSize = calculateStorageSize(localStorage)
    const sessionStorageSize = calculateStorageSize(sessionStorage)

    // FPS
    const fps = await measureFps()
    fpsRef.current = fps

    return {
      fps,
      memoryUsage,
      memoryTotal,
      localStorageSize,
      sessionStorageSize,
      domNodes,
      resources,
      paintMetrics: { firstPaint, firstContentfulPaint },
      navigationMetrics: { domContentLoaded, loadEvent, domInteractive }
    }
  }, [])

  const collectMetrics = useCallback(async () => {
    setIsRefreshing(true)
    
    try {
      collectSystemInfo()
      const perfData = await collectPerformanceMetrics()
      setPerformanceData(perfData)

      const newMetrics: HealthMetric[] = []

      // FPS Metric
      newMetrics.push({
        id: 'fps',
        name: '刷新率 (FPS)',
        value: perfData.fps,
        unit: 'FPS',
        status: getPerformanceStatus(perfData.fps, { excellent: 58, good: 50, warning: 30 }),
        icon: <Monitor size={20} />,
        description: '屏幕刷新率，影响动画流畅度',
        history: [...(metrics.find(m => m.id === 'fps')?.history || []).slice(-19), perfData.fps]
      })

      // Memory Usage
      const memoryPercent = perfData.memoryTotal > 0 
        ? Math.round((perfData.memoryUsage / perfData.memoryTotal) * 100) 
        : 0
      newMetrics.push({
        id: 'memory',
        name: 'JavaScript 堆内存',
        value: memoryPercent,
        unit: '%',
        status: getPerformanceStatus(memoryPercent, { excellent: 30, good: 60, warning: 80 }),
        icon: <MemoryStick size={20} />,
        description: `${(perfData.memoryUsage / 1024 / 1024).toFixed(1)}MB / ${(perfData.memoryTotal / 1024 / 1024).toFixed(1)}MB`,
        history: [...(metrics.find(m => m.id === 'memory')?.history || []).slice(-19), memoryPercent]
      })

      // DOM Nodes
      newMetrics.push({
        id: 'dom',
        name: 'DOM 节点数',
        value: perfData.domNodes,
        unit: '',
        status: getPerformanceStatus(perfData.domNodes, { excellent: 500, good: 1500, warning: 3000 }),
        icon: <Globe size={20} />,
        description: '页面DOM节点数量，影响渲染性能',
        history: [...(metrics.find(m => m.id === 'dom')?.history || []).slice(-19), perfData.domNodes]
      })

      // Resources
      newMetrics.push({
        id: 'resources',
        name: '加载资源数',
        value: perfData.resources,
        unit: '',
        status: getPerformanceStatus(perfData.resources, { excellent: 20, good: 50, warning: 100 }),
        icon: <HardDrive size={20} />,
        description: '页面加载的资源总数',
        history: [...(metrics.find(m => m.id === 'resources')?.history || []).slice(-19), perfData.resources]
      })

      // First Contentful Paint
      newMetrics.push({
        id: 'fcp',
        name: '首次内容绘制 (FCP)',
        value: Math.round(perfData.paintMetrics.firstContentfulPaint),
        unit: 'ms',
        status: getPerformanceStatus(perfData.paintMetrics.firstContentfulPaint, { excellent: 1000, good: 2000, warning: 3000 }),
        icon: <Zap size={20} />,
        description: '首次渲染内容的时间',
        history: [...(metrics.find(m => m.id === 'fcp')?.history || []).slice(-19), Math.round(perfData.paintMetrics.firstContentfulPaint)]
      })

      // DOM Content Loaded
      newMetrics.push({
        id: 'dcl',
        name: 'DOM 加载完成',
        value: Math.round(perfData.navigationMetrics.domContentLoaded),
        unit: 'ms',
        status: getPerformanceStatus(perfData.navigationMetrics.domContentLoaded, { excellent: 1500, good: 3000, warning: 5000 }),
        icon: <Activity size={20} />,
        description: 'DOM解析完成时间',
        history: [...(metrics.find(m => m.id === 'dcl')?.history || []).slice(-19), Math.round(perfData.navigationMetrics.domContentLoaded)]
      })

      // Local Storage
      const localStorageMB = (perfData.localStorageSize / 1024 / 1024).toFixed(2)
      newMetrics.push({
        id: 'localStorage',
        name: 'LocalStorage 占用',
        value: parseFloat(localStorageMB),
        unit: 'MB',
        status: getPerformanceStatus(parseFloat(localStorageMB), { excellent: 1, good: 3, warning: 4.5 }),
        icon: <HardDrive size={20} />,
        description: `${perfData.localStorageSize.toLocaleString()} 字节`,
        history: [...(metrics.find(m => m.id === 'localStorage')?.history || []).slice(-19), parseFloat(localStorageMB)]
      })

      // Network Status
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection
      newMetrics.push({
        id: 'network',
        name: '网络状态',
        value: navigator.onLine ? (connection?.effectiveType || '在线') : '离线',
        unit: '',
        status: navigator.onLine ? 'excellent' : 'critical',
        icon: <Wifi size={20} />,
        description: connection ? `${connection.downlink || 0}Mbps / RTT ${connection.rtt || 0}ms` : '在线',
        history: [...(metrics.find(m => m.id === 'network')?.history || []).slice(-19), navigator.onLine ? 1 : 0]
      })

      // CPU Cores
      newMetrics.push({
        id: 'cpu',
        name: 'CPU 核心数',
        value: systemInfo?.cores || navigator.hardwareConcurrency || 1,
        unit: '',
        status: 'excellent',
        icon: <Cpu size={20} />,
        description: '可用CPU核心数',
        history: [...(metrics.find(m => m.id === 'cpu')?.history || []).slice(-19), systemInfo?.cores || 1]
      })

      setMetrics(newMetrics)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to collect metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [collectSystemInfo, collectPerformanceMetrics, metrics, systemInfo])

  useEffect(() => {
    collectMetrics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(collectMetrics, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, collectMetrics])

  // FPS tracking with requestAnimationFrame
  useEffect(() => {
    let animationId: number
    const trackFps = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastFrameTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current
        frameCountRef.current = 0
        lastFrameTimeRef.current = now
      }
      animationId = requestAnimationFrame(trackFps)
    }
    animationId = requestAnimationFrame(trackFps)
    return () => cancelAnimationFrame(animationId)
  }, [])

  const getOverallHealthScore = (): number => {
    if (metrics.length === 0) return 0
    const scores = metrics.map(m => {
      switch (m.status) {
        case 'excellent': return 100
        case 'good': return 75
        case 'warning': return 50
        case 'critical': return 25
        default: return 0
      }
    })
    const sum = scores.reduce<number>((a, b) => a + b, 0)
    return Math.round(sum / scores.length)
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 70) return '#3b82f6'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 90) return '系统状态优秀'
    if (score >= 70) return '系统状态良好'
    if (score >= 50) return '系统需要优化'
    return '系统状态警告'
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: getOverallHealthScore(),
      systemInfo,
      performanceData,
      metrics: metrics.map(m => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        status: m.status,
        description: m.description
      }))
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-health-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderMiniChart = (data: number[], color: string) => {
    if (data.length < 2) return null
    const max = Math.max(...data, 1)
    const width = 80
    const height = 30
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (v / max) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} style={{ opacity: 0.6 }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'var(--text-primary, #e2e8f0)',
      background: 'var(--bg-primary, #0f172a)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color, #1e293b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary, #1e293b)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={24} color={getHealthColor(getOverallHealthScore())} />
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>系统健康监控</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
              实时监控浏览器性能与系统状态
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary, #94a3b8)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: '#3b82f6' }}
            />
            自动刷新 (3秒)
          </label>
          <button
            onClick={collectMetrics}
            disabled={isRefreshing}
            style={{
              padding: '8px 12px',
              background: 'var(--accent-color, #3b82f6)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isRefreshing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              opacity: isRefreshing ? 0.7 : 1
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
            刷新
          </button>
          <button
            onClick={exportReport}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary, #334155)',
              color: 'var(--text-primary, #e2e8f0)',
              border: '1px solid var(--border-color, #475569)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Download size={14} />
            导出报告
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, var(--bg-secondary, #1e293b) 0%, var(--bg-tertiary, #334155) 100%)',
        borderBottom: '1px solid var(--border-color, #1e293b)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Circular Score */}
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--bg-tertiary, #334155)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getHealthColor(getOverallHealthScore())}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(getOverallHealthScore() / 100) * 283} 283`}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: getHealthColor(getOverallHealthScore()) }}>
                {getOverallHealthScore()}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)' }}>分</div>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '20px', 
              color: getHealthColor(getOverallHealthScore())
            }}>
              {getHealthLabel(getOverallHealthScore())}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              上次刷新: {lastRefresh.toLocaleTimeString('zh-CN')}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginTop: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#10b981" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                  {metrics.filter(m => m.status === 'excellent' || m.status === 'good').length} 正常
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                  {metrics.filter(m => m.status === 'warning').length} 警告
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                  {metrics.filter(m => m.status === 'critical').length} 严重
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color, #1e293b)',
        background: 'var(--bg-secondary, #1e293b)'
      }}>
        {[
          { id: 'dashboard', label: '仪表盘', icon: <Monitor size={16} /> },
          { id: 'details', label: '详细信息', icon: <Cpu size={16} /> },
          { id: 'history', label: '历史趋势', icon: <Activity size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id ? 'var(--bg-primary, #0f172a)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-color, #3b82f6)' : 'var(--text-secondary, #94a3b8)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-color, #3b82f6)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'dashboard' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {metrics.map(metric => (
              <div
                key={metric.id}
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary, #1e293b)',
                  borderRadius: '12px',
                  border: `1px solid ${getStatusColor(metric.status)}20`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    color: getStatusColor(metric.status)
                  }}>
                    {metric.icon}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #e2e8f0)' }}>
                        {metric.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                        {metric.description}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: `${getStatusColor(metric.status)}20`,
                    color: getStatusColor(metric.status)
                  }}>
                    {getStatusLabel(metric.status)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: getStatusColor(metric.status) }}>
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)' }}>
                    {metric.unit}
                  </span>
                </div>

                {metric.history.length > 1 && (
                  <div style={{ 
                    padding: '8px', 
                    background: 'var(--bg-primary, #0f172a)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {renderMiniChart(metric.history, getStatusColor(metric.status))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'details' && systemInfo && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {/* System Information */}
            <div style={{
              padding: '16px',
              background: 'var(--bg-secondary, #1e293b)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #1e293b)'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: 'var(--text-primary, #e2e8f0)'
              }}>
                <Monitor size={18} />
                系统信息
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: '平台', value: systemInfo.platform },
                  { label: '语言', value: systemInfo.language },
                  { label: 'CPU 核心', value: `${systemInfo.cores} 核` },
                  { label: '设备内存', value: systemInfo.memory ? `${systemInfo.memory} GB` : '未知' },
                  { label: '屏幕分辨率', value: systemInfo.screenResolution },
                  { label: '色彩深度', value: `${systemInfo.colorDepth} bit` },
                  { label: '时区', value: systemInfo.timezone },
                  { label: '像素比', value: `${systemInfo.devicePixelRatio}x` },
                  { label: 'Cookie', value: systemInfo.cookiesEnabled ? '启用' : '禁用' },
                  { label: 'Do Not Track', value: systemInfo.doNotTrack || '未设置' }
                ].map(item => (
                  <div key={item.label} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-primary, #0f172a)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #e2e8f0)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            {performanceData && (
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary, #1e293b)',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #1e293b)'
              }}>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: 'var(--text-primary, #e2e8f0)'
                }}>
                  <Zap size={18} />
                  性能指标
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'FPS', value: `${performanceData.fps} FPS`, status: performanceData.fps >= 55 ? 'good' : 'warning' },
                    { label: '内存使用', value: `${(performanceData.memoryUsage / 1024 / 1024).toFixed(1)} MB`, status: 'good' },
                    { label: '内存总量', value: `${(performanceData.memoryTotal / 1024 / 1024).toFixed(1)} MB`, status: 'good' },
                    { label: 'LocalStorage', value: `${(performanceData.localStorageSize / 1024).toFixed(1)} KB`, status: 'good' },
                    { label: 'SessionStorage', value: `${(performanceData.sessionStorageSize / 1024).toFixed(1)} KB`, status: 'good' },
                    { label: 'DOM 节点', value: performanceData.domNodes.toLocaleString(), status: performanceData.domNodes < 1500 ? 'good' : 'warning' },
                    { label: '加载资源', value: performanceData.resources.toString(), status: 'good' },
                    { label: 'FCP', value: `${Math.round(performanceData.paintMetrics.firstContentfulPaint)} ms`, status: performanceData.paintMetrics.firstContentfulPaint < 2000 ? 'good' : 'warning' },
                    { label: 'DOM Ready', value: `${Math.round(performanceData.navigationMetrics.domContentLoaded)} ms`, status: 'good' },
                    { label: 'Load Event', value: `${Math.round(performanceData.navigationMetrics.loadEvent)} ms`, status: 'good' }
                  ].map(item => (
                    <div key={item.label} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-primary, #0f172a)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #e2e8f0)' }}>{item.value}</span>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.status === 'good' ? '#10b981' : '#f59e0b'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Agent */}
            <div style={{
              padding: '16px',
              background: 'var(--bg-secondary, #1e293b)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #1e293b)',
              gridColumn: 'span 2'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: 'var(--text-primary, #e2e8f0)'
              }}>
                <Shield size={18} />
                浏览器标识
              </h3>
              <div style={{
                padding: '12px',
                background: 'var(--bg-primary, #0f172a)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--text-secondary, #94a3b8)',
                wordBreak: 'break-all',
                lineHeight: 1.6
              }}>
                {systemInfo.userAgent}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {metrics.map(metric => (
              <div
                key={metric.id}
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary, #1e293b)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #1e293b)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: getStatusColor(metric.status) }}>{metric.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #e2e8f0)' }}>
                      {metric.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                    {metric.unit}
                  </span>
                </div>
                
                <div style={{
                  padding: '12px',
                  background: 'var(--bg-primary, #0f172a)',
                  borderRadius: '8px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {metric.history.length > 1 ? (
                    <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${metric.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={getStatusColor(metric.status)} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={getStatusColor(metric.status)} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polyline
                        points={metric.history.map((v, i) => {
                          const max = Math.max(...metric.history, 1)
                          const x = (i / (metric.history.length - 1)) * 200
                          const y = 55 - (v / max) * 50
                          return `${x},${y}`
                        }).join(' ')}
                        fill="none"
                        stroke={getStatusColor(metric.status)}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                      收集数据中...
                    </span>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '11px',
                  color: 'var(--text-secondary, #94a3b8)'
                }}>
                  <span>最小: {metric.history.length > 0 ? Math.min(...metric.history).toLocaleString() : '-'}</span>
                  <span>最大: {metric.history.length > 0 ? Math.max(...metric.history).toLocaleString() : '-'}</span>
                  <span>当前: {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-color, #1e293b)',
        background: 'var(--bg-secondary, #1e293b)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--text-secondary, #94a3b8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={12} />
            {navigator.onLine ? '在线' : '离线'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={12} />
            {navigator.hardwareConcurrency || 1} 核
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Monitor size={12} />
            {screen.width}x{screen.height}
          </span>
        </div>
        <span>
          WebLinuxOS v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
        </span>
      </div>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
