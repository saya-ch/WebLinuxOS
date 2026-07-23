import { useState, useEffect, useCallback } from 'react'
import { Activity, HardDrive, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

interface NetworkInfo {
  online: boolean
  effectiveType: string
  downlink: number
  rtt: number
}

interface MemoryInfo {
  total: number
  used: number
  percentage: number
}

export default function RealSystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)
  const [performanceData, setPerformanceData] = useState<number[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const getPerformanceRating = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'critical'
  }

  const collectMetrics = useCallback(() => {
    const newMetrics: SystemMetric[] = []
    const newPerformanceData: number[] = []

    // 内存使用情况 (真实数据)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory
      const usedJSHeapSize = memory.usedJSHeapSize
      const totalJSHeapSize = memory.totalJSHeapSize
      const percentage = (usedJSHeapSize / totalJSHeapSize) * 100

      setMemoryInfo({
        total: Math.round(totalJSHeapSize / 1024 / 1024),
        used: Math.round(usedJSHeapSize / 1024 / 1024),
        percentage: Math.round(percentage)
      })

      newMetrics.push({
        name: '内存使用',
        value: Math.round(percentage),
        unit: '%',
        status: getPerformanceRating(percentage, { good: 50, warning: 80 }),
        trend: percentage > 70 ? 'up' : 'stable'
      })

      newPerformanceData.push(percentage)
    }

    // 网络状态 (真实数据)
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        setNetworkInfo({
          online: navigator.onLine,
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        })

        newMetrics.push({
          name: '网络速度',
          value: connection.downlink || 0,
          unit: 'Mbps',
          status: connection.downlink > 10 ? 'good' : connection.downlink > 5 ? 'warning' : 'critical',
          trend: 'stable'
        })
      }
    } else {
      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      })
    }

    // 页面性能指标 (真实数据)
    if ('performance' in window) {
      const timing = performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart

      if (loadTime > 0) {
        newMetrics.push({
          name: '页面加载时间',
          value: Math.round(loadTime),
          unit: 'ms',
          status: getPerformanceRating(loadTime, { good: 2000, warning: 5000 }),
          trend: 'stable'
        })

        newPerformanceData.push(loadTime / 50) // 归一化
      }

      if (domReady > 0) {
        newMetrics.push({
          name: 'DOM就绪时间',
          value: Math.round(domReady),
          unit: 'ms',
          status: getPerformanceRating(domReady, { good: 1000, warning: 3000 }),
          trend: 'stable'
        })
      }

      // FPS 计算
      let fps = 60
      const start = performance.now()
      let frameCount = 0

      const measureFPS = () => {
        frameCount++
        const elapsed = performance.now() - start
        if (elapsed >= 1000) {
          fps = Math.round((frameCount * 1000) / elapsed)
          newMetrics.push({
            name: '刷新率',
            value: fps,
            unit: 'FPS',
            status: fps >= 55 ? 'good' : fps >= 30 ? 'warning' : 'critical',
            trend: fps > 55 ? 'stable' : 'down'
          })
          setLastUpdated(new Date())
        } else {
          requestAnimationFrame(measureFPS)
        }
      }

      requestAnimationFrame(measureFPS)
    }

    // CPU核心数 (真实数据)
    if ('navigator' in window && 'hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency || 1
      newMetrics.push({
        name: 'CPU核心数',
        value: cores,
        unit: '',
        status: 'good',
        trend: 'stable'
      })
    }

    // 本地存储使用情况 (真实数据)
    let storageUsed = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        storageUsed += localStorage.getItem(key)?.length || 0
      }
    }
    const storageUsedMB = (storageUsed / 1024 / 1024).toFixed(2)

    newMetrics.push({
      name: '本地存储',
      value: parseFloat(storageUsedMB),
      unit: 'MB',
      status: getPerformanceRating(parseFloat(storageUsedMB), { good: 5, warning: 15 }),
      trend: 'stable'
    })

    // 窗口数量 (真实数据)
    const windowCount = (window as any).__weblinux_window_count__ || 1
    newMetrics.push({
      name: '活动窗口',
      value: windowCount,
      unit: '',
      status: windowCount < 10 ? 'good' : windowCount < 20 ? 'warning' : 'critical',
      trend: 'stable'
    })

    setMetrics(newMetrics)
    setPerformanceData(prev => [...prev, ...newPerformanceData].slice(-20))
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    collectMetrics()
  }, [collectMetrics])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(collectMetrics, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, collectMetrics])

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'var(--accent)'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return 'var(--text-secondary)'
    }
  }

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
      case 'warning': return <AlertCircle size={16} style={{ color: '#f59e0b' }} />
      case 'critical': return <AlertCircle size={16} style={{ color: '#ef4444' }} />
      default: return null
    }
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--window-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={24} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>实时系统监控</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              最后更新: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={collectMetrics}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} />
            刷新
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 16px',
              background: autoRefresh ? 'var(--accent-bg)' : 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {autoRefresh ? '自动刷新: 开' : '自动刷新: 关'}
          </button>
        </div>
      </div>

      {/* Network Status Card */}
      {networkInfo && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: networkInfo.online ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)',
          borderRadius: '12px',
          border: `1px solid ${networkInfo.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Wifi size={20} style={{ color: networkInfo.online ? '#10b981' : '#ef4444' }} />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>
              {networkInfo.online ? '网络连接正常' : '网络已断开'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>连接类型</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{networkInfo.effectiveType.toUpperCase()}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>下行速度</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{networkInfo.downlink} Mbps</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>往返延迟</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{networkInfo.rtt} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Usage Card */}
      {memoryInfo && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--window-bg)',
          borderRadius: '12px',
          border: '1px solid var(--window-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <HardDrive size={20} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>JavaScript 堆内存</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已使用: {memoryInfo.used} MB</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总计: {memoryInfo.total} MB</span>
            </div>
            <div style={{
              height: '8px',
              background: 'var(--window-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${memoryInfo.percentage}%`,
                background: `linear-gradient(90deg, ${getStatusColor(metrics.find(m => m.name === '内存使用')?.status || 'good')}, var(--accent))`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', color: getStatusColor(metrics.find(m => m.name === '内存使用')?.status || 'good') }}>
            {memoryInfo.percentage}%
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {metrics.map((metric, index) => (
          <div key={index} style={{
            padding: '16px',
            background: 'var(--window-bg)',
            borderRadius: '12px',
            border: '1px solid var(--window-border)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusIcon(metric.status)}
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{metric.name}</span>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: `${getStatusColor(metric.status)}20`,
                color: getStatusColor(metric.status),
                fontWeight: 500
              }}>
                {metric.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: getStatusColor(metric.status) }}>
                {metric.value}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {metric.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'var(--window-bg)',
          borderRadius: '12px',
          border: '1px solid var(--window-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>性能趋势 (最近20个数据点)</span>
          </div>

          <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
            {performanceData.slice(-20).map((value, index) => (
              <div key={index} style={{
                flex: 1,
                height: `${Math.min(100, value)}%`,
                background: 'linear-gradient(to top, var(--accent), var(--accent-glow))',
                borderRadius: '2px 2px 0 0',
                opacity: 0.6 + (index / 20) * 0.4,
                transition: 'height 0.3s ease'
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'var(--window-border)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        所有数据均来自浏览器 API，真实反映系统状态。自动刷新间隔: 3秒
      </div>
    </div>
  )
}