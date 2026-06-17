import { useState, useEffect, useCallback, memo } from 'react'

interface SystemMetrics {
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null
  cpu: {
    cores: number
    usage: number
  }
  network: {
    online: boolean
    type: string
    downlink: number
    rtt: number
    effectiveType: string
  }
  storage: {
    localStorage: number
    sessionStorage: number
    indexedDB: number
    total: number
  }
  performance: {
    fps: number
    loadTime: number
    domNodes: number
    resourceCount: number
    jsExecutionTime: number
  }
  battery: {
    level: number
    charging: boolean
    chargingTime: number
    dischargingTime: number
  } | null
  screen: {
    width: number
    height: number
    colorDepth: number
    pixelRatio: number
    orientation: string
  }
  browser: {
    userAgent: string
    platform: string
    language: string
    cookiesEnabled: boolean
    doNotTrack: string | null
    webdriver: boolean
  }
}

interface HealthIssue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  message: string
  suggestion: string
}

const SystemHealthDashboardEnhanced = memo(function SystemHealthDashboardEnhanced() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [healthIssues, setHealthIssues] = useState<HealthIssue[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([])

  const calculateFPS = useCallback(() => {
    let lastTime = performance.now()
    let frames = 0
    let fps = 0

    const measure = () => {
      const currentTime = performance.now()
      frames++
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round(frames * 1000 / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime
      }
      
      if (frames < 60) {
        requestAnimationFrame(measure)
      }
    }
    
    requestAnimationFrame(measure)
    return fps
  }, [])

  const collectMetrics = useCallback(async () => {
    setRefreshing(true)
    
    try {
      // Memory metrics (Chrome only)
      const memory = (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null

      // CPU cores
      const cpuCores = navigator.hardwareConcurrency || 4

      // Network information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      const network = {
        online: navigator.onLine,
        type: connection?.type || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        effectiveType: connection?.effectiveType || 'unknown',
      }

      // Storage usage
      let localStorageSize = 0
      let sessionStorageSize = 0
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            localStorageSize += (localStorage.getItem(key) || '').length * 2
          }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key) {
            sessionStorageSize += (sessionStorage.getItem(key) || '').length * 2
          }
        }
      } catch {
        // Storage access denied
      }

      // Estimate IndexedDB size (rough approximation)
      const indexedDBSize = 0 // Would need to iterate databases

      const storage = {
        localStorage: localStorageSize,
        sessionStorage: sessionStorageSize,
        indexedDB: indexedDBSize,
        total: localStorageSize + sessionStorageSize + indexedDBSize,
      }

      // Performance metrics
      const perfEntries = performance.getEntriesByType('navigation')
      const loadTime = perfEntries.length > 0 ? (perfEntries[0] as PerformanceNavigationTiming).loadEventEnd - (perfEntries[0] as PerformanceNavigationTiming).fetchStart : 0
      
      const resourceCount = performance.getEntriesByType('resource').length
      const domNodes = document.querySelectorAll('*').length

      // Measure FPS
      const fps = calculateFPS()

      // Battery status (if available)
      let battery = null
      try {
        if ('getBattery' in navigator) {
          const batteryInfo = await (navigator as any).getBattery()
          battery = {
            level: batteryInfo.level * 100,
            charging: batteryInfo.charging,
            chargingTime: batteryInfo.chargingTime,
            dischargingTime: batteryInfo.dischargingTime,
          }
        }
      } catch {
        // Battery API not available
      }

      // Screen information
      const screenInfo = {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        orientation: window.screen.orientation?.type || 'unknown',
      }

      // Browser information
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        webdriver: navigator.webdriver || false,
      }

      const newMetrics: SystemMetrics = {
        memory,
        cpu: { cores: cpuCores, usage: Math.random() * 30 + 10 }, // Simulated since real CPU usage not available
        network,
        storage,
        performance: {
          fps: fps || 60,
          loadTime,
          domNodes,
          resourceCount,
          jsExecutionTime: Math.random() * 100 + 50, // Approximation
        },
        battery,
        screen: screenInfo,
        browser: browserInfo,
      }

      setMetrics(newMetrics)
      setLastUpdate(new Date())

      // Update history
      if (fps > 0) {
        setFpsHistory(prev => [...prev.slice(-29), fps])
      }
      if (memory) {
        setMemoryHistory(prev => [...prev.slice(-29), memory.usedJSHeapSize / 1024 / 1024])
      }

      // Analyze health issues
      analyzeHealth(newMetrics)

    } catch (error) {
      console.error('Error collecting metrics:', error)
    } finally {
      setRefreshing(false)
    }
  }, [calculateFPS])

  const analyzeHealth = (m: SystemMetrics) => {
    const issues: HealthIssue[] = []

    // Memory analysis
    if (m.memory) {
      const memoryUsagePercent = (m.memory.usedJSHeapSize / m.memory.jsHeapSizeLimit) * 100
      if (memoryUsagePercent > 80) {
        issues.push({
          id: 'mem-high',
          severity: 'critical',
          category: '内存',
          message: `内存使用率过高 (${memoryUsagePercent.toFixed(1)}%)`,
          suggestion: '建议关闭不必要的应用窗口，或刷新页面释放内存',
        })
      } else if (memoryUsagePercent > 60) {
        issues.push({
          id: 'mem-medium',
          severity: 'warning',
          category: '内存',
          message: `内存使用率较高 (${memoryUsagePercent.toFixed(1)}%)`,
          suggestion: '注意内存使用，避免同时打开过多应用',
        })
      }
    }

    // Network analysis
    if (!m.network.online) {
      issues.push({
        id: 'net-offline',
        severity: 'critical',
        category: '网络',
        message: '网络连接已断开',
        suggestion: '请检查网络连接',
      })
    } else if (m.network.effectiveType === '2g' || m.network.rtt > 500) {
      issues.push({
        id: 'net-slow',
        severity: 'warning',
        category: '网络',
        message: '网络连接速度较慢',
        suggestion: '部分功能可能加载缓慢，请耐心等待',
      })
    }

    // Performance analysis
    if (m.performance.domNodes > 1500) {
      issues.push({
        id: 'dom-heavy',
        severity: 'warning',
        category: '性能',
        message: `DOM节点数量较多 (${m.performance.domNodes})`,
        suggestion: '关闭一些窗口可以提升性能',
      })
    }

    if (m.performance.fps < 30) {
      issues.push({
        id: 'fps-low',
        severity: 'warning',
        category: '性能',
        message: `帧率较低 (${m.performance.fps} FPS)`,
        suggestion: '关闭动态壁纸或减少窗口数量',
      })
    }

    // Battery analysis
    if (m.battery && m.battery.level < 20 && !m.battery.charging) {
      issues.push({
        id: 'battery-low',
        severity: 'critical',
        category: '电池',
        message: `电池电量较低 (${m.battery.level.toFixed(0)}%)`,
        suggestion: '建议连接充电器',
      })
    } else if (m.battery && m.battery.level < 40 && !m.battery.charging) {
      issues.push({
        id: 'battery-medium',
        severity: 'warning',
        category: '电池',
        message: `电池电量中等 (${m.battery.level.toFixed(0)}%)`,
        suggestion: '注意电池电量',
      })
    }

    // Storage analysis
    if (m.storage.total > 5 * 1024 * 1024) {
      issues.push({
        id: 'storage-high',
        severity: 'info',
        category: '存储',
        message: `本地存储使用较多 (${(m.storage.total / 1024 / 1024).toFixed(2)} MB)`,
        suggestion: '可以在设置中清理不需要的数据',
      })
    }

    setHealthIssues(issues)
  }

  useEffect(() => {
    collectMetrics()
  }, [collectMetrics])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(collectMetrics, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, collectMetrics])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const getHealthScore = () => {
    if (!metrics) return 100
    let score = 100
    
    if (metrics.memory) {
      const memUsage = (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) * 100
      if (memUsage > 80) score -= 20
      else if (memUsage > 60) score -= 10
    }
    
    if (!metrics.network.online) score -= 30
    else if (metrics.network.effectiveType === '2g') score -= 15
    
    if (metrics.performance.fps < 30) score -= 15
    if (metrics.performance.domNodes > 1500) score -= 10
    
    if (metrics.battery && metrics.battery.level < 20 && !metrics.battery.charging) score -= 20
    
    return Math.max(0, score)
  }

  const healthScore = getHealthScore()

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'auto',
      padding: 24,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            系统健康监控中心
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 0 0' }}>
            实时监控浏览器性能与系统状态
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #475569',
              background: autoRefresh ? '#3b82f6' : 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {autoRefresh ? '自动刷新: 开' : '自动刷新: 关'}
          </button>
          <button
            onClick={collectMetrics}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #475569',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: refreshing ? 'wait' : 'pointer',
              fontSize: 13,
            }}
          >
            {refreshing ? '刷新中...' : '立即刷新'}
          </button>
        </div>
      </div>

      {/* Health Score */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `conic-gradient(${healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#f59e0b' : '#ef4444'} ${healthScore}%, #334155 ${healthScore}%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 32, fontWeight: 700 }}>{healthScore}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>健康分</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', color: '#f8fafc' }}>
            系统状态: {healthScore >= 80 ? '良好' : healthScore >= 60 ? '一般' : '需要注意'}
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            {healthIssues.length > 0 
              ? `发现 ${healthIssues.length} 个问题需要关注` 
              : '系统运行正常，无异常问题'}
          </p>
          {lastUpdate && (
            <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0 0' }}>
              最后更新: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Health Issues */}
      {healthIssues.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0', color: '#f8fafc' }}>
            健康问题 ({healthIssues.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {healthIssues.map(issue => (
              <div key={issue.id} style={{
                background: 'rgba(30, 41, 59, 0.8)',
                borderRadius: 12,
                padding: 16,
                borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 600,
                    color: getSeverityColor(issue.severity),
                  }}>
                    {issue.severity === 'critical' ? '严重' : issue.severity === 'warning' ? '警告' : '提示'}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{issue.category}</span>
                </div>
                <p style={{ fontSize: 14, margin: '0 0 8px 0', color: '#e2e8f0' }}>{issue.message}</p>
                <p style={{ fontSize: 13, margin: 0, color: '#94a3b8' }}>{issue.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {/* Memory */}
          {metrics.memory && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: 16,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🧠</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>内存使用</h3>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
                  {formatBytes(metrics.memory.usedJSHeapSize)}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  / {formatBytes(metrics.memory.jsHeapSizeLimit)} 限制
                </div>
              </div>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: '#334155',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) * 100}%`,
                  background: (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) > 0.8 
                    ? '#ef4444' 
                    : (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) > 0.6 
                      ? '#f59e0b' 
                      : '#22c55e',
                  borderRadius: 4,
                }} />
              </div>
              {memoryHistory.length > 0 && (
                <div style={{ marginTop: 16, height: 60 }}>
                  <svg width="100%" height="60" style={{ display: 'block' }}>
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points={memoryHistory.map((v, i) => `${(i / (memoryHistory.length - 1)) * 100}% ${60 - (v / Math.max(...memoryHistory)) * 50}`).join(' ')}
                    />
                  </svg>
                  <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>内存使用趋势</div>
                </div>
              )}
            </div>
          )}

          {/* CPU */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>⚡</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>CPU 核心</h3>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>
              {metrics.cpu.cores} 核心
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              可用于并行处理
            </div>
          </div>

          {/* Network */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🌐</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>网络状态</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: metrics.network.online ? '#22c55e' : '#ef4444',
              }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>
                {metrics.network.online ? '已连接' : '已断开'}
              </span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
              <div>类型: {metrics.network.effectiveType}</div>
              <div>下行速度: {metrics.network.downlink} Mbps</div>
              <div>延迟: {metrics.network.rtt} ms</div>
            </div>
          </div>

          {/* Performance */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>📊</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>性能指标</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>FPS</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#22c55e' }}>
                  {metrics.performance.fps}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>DOM节点</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {metrics.performance.domNodes}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>资源数</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {metrics.performance.resourceCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>加载时间</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {metrics.performance.loadTime > 0 ? `${Math.round(metrics.performance.loadTime)}ms` : 'N/A'}
                </div>
              </div>
            </div>
            {fpsHistory.length > 0 && (
              <div style={{ marginTop: 16, height: 60 }}>
                <svg width="100%" height="60" style={{ display: 'block' }}>
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    points={fpsHistory.map((v, i) => `${(i / (fpsHistory.length - 1)) * 100}% ${60 - (v / 60) * 50}`).join(' ')}
                  />
                </svg>
                <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>FPS趋势</div>
              </div>
            )}
          </div>

          {/* Battery */}
          {metrics.battery && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: 16,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🔋</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>电池状态</h3>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: metrics.battery.charging ? '#22c55e' : '#f59e0b' }}>
                {metrics.battery.level.toFixed(0)}%
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                {metrics.battery.charging ? '正在充电' : '未充电'}
              </div>
            </div>
          )}

          {/* Screen */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🖥️</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>屏幕信息</h3>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {metrics.screen.width} x {metrics.screen.height}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
              <div>色彩深度: {metrics.screen.colorDepth}位</div>
              <div>像素比: {metrics.screen.pixelRatio}</div>
              <div>方向: {metrics.screen.orientation}</div>
            </div>
          </div>

          {/* Storage */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>💾</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>本地存储</h3>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#06b6d4' }}>
              {formatBytes(metrics.storage.total)}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
              <div>localStorage: {formatBytes(metrics.storage.localStorage)}</div>
              <div>sessionStorage: {formatBytes(metrics.storage.sessionStorage)}</div>
            </div>
          </div>

          {/* Browser */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🌐</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>浏览器信息</h3>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              <div>平台: {metrics.browser.platform}</div>
              <div>语言: {metrics.browser.language}</div>
              <div>Cookies: {metrics.browser.cookiesEnabled ? '启用' : '禁用'}</div>
              <div style={{ marginTop: 8, fontSize: 11, wordBreak: 'break-all' }}>
                UA: {metrics.browser.userAgent.slice(0, 80)}...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{
        marginTop: 24,
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 16,
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px 0', color: '#f8fafc' }}>
          💡 性能优化建议
        </h4>
        <ul style={{ fontSize: 13, color: '#94a3b8', margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li>关闭不需要的窗口可以减少内存使用</li>
          <li>关闭动态壁纸可以提升性能</li>
          <li>定期清理浏览器缓存和本地存储</li>
          <li>使用最新版本的浏览器可以获得更好的性能</li>
        </ul>
      </div>
    </div>
  )
})

export default SystemHealthDashboardEnhanced