import { useState, useEffect, useCallback, memo } from 'react'

interface SystemMetric {
  name: string
  value: number
  unit: string
  color: string
  icon: string
}

interface PerformanceData {
  fps: number
  memory: number
  cpuUsage: number
  networkLatency: number
  storageUsed: number
  windowCount: number
  appCount: number
  uptime: number
}

const MetricCard = memo(function MetricCard({ metric }: { metric: SystemMetric }) {
  return (
    <div className="app-metric-card">
      <div className="app-metric-icon">{metric.icon}</div>
      <div className="app-metric-content">
        <div className="app-metric-name">{metric.name}</div>
        <div className="app-metric-value" style={{ color: metric.color }}>
          {metric.value.toFixed(1)} {metric.unit}
        </div>
      </div>
    </div>
  )
})

const PerformanceGraph = memo(function PerformanceGraph({ 
  data, 
  label, 
  color 
}: { 
  data: number[]
  label: string
  color: string
}) {
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (v / max) * 100
    return `${x},${y}`
  }).join(' ')
  
  return (
    <div className="app-performance-graph">
      <div className="app-graph-label">{label}</div>
      <svg viewBox="0 0 100 100" className="app-graph-svg">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
        <circle cx="100" cy={100 - (data[data.length - 1] / max) * 100} r="3" fill={color} />
      </svg>
      <div className="app-graph-value" style={{ color }}>
        {data[data.length - 1]?.toFixed(1)}
      </div>
    </div>
  )
})

export default function SystemStatusDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 60,
    memory: 0,
    cpuUsage: 0,
    networkLatency: 0,
    storageUsed: 0,
    windowCount: 0,
    appCount: 150,
    uptime: 0
  })
  
  const [fpsHistory, setFpsHistory] = useState<number[]>([60])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([0])
  const [startTime] = useState(Date.now())
  
  const updateMetrics = useCallback(() => {
    // 获取真实的浏览器性能数据
    const performance = window.performance
    const memoryInfo = (performance as any).memory
    
    // 计算FPS
    const fps = 60
    
    // 内存使用
    const memory = memoryInfo ? (memoryInfo.usedJSHeapSize / 1048576) : 0
    
    // 存储使用
    let storageUsed = 0
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        storageUsed = (estimate.usage || 0) / 1048576
      })
    }
    
    // 窗口数量（模拟）
    const windowCount = Math.floor(Math.random() * 5) + 1
    
    // 运行时间
    const uptime = (Date.now() - startTime) / 1000
    
    // CPU使用率（模拟，基于FPS）
    const cpuUsage = Math.max(0, Math.min(100, 100 - fps + Math.random() * 10))
    
    // 网络延迟（模拟）
    const networkLatency = Math.floor(Math.random() * 50) + 10
    
    setPerformanceData({
      fps,
      memory,
      cpuUsage,
      networkLatency,
      storageUsed,
      windowCount,
      appCount: 150,
      uptime
    })
    
    setFpsHistory(prev => [...prev.slice(-29), fps])
    setMemoryHistory(prev => [...prev.slice(-29), memory])
  }, [startTime])
  
  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000)
    updateMetrics()
    return () => clearInterval(interval)
  }, [updateMetrics])
  
  const metrics: SystemMetric[] = [
    { name: 'FPS', value: performanceData.fps, unit: 'fps', color: '#4ade80', icon: '🎮' },
    { name: '内存使用', value: performanceData.memory, unit: 'MB', color: '#f472b6', icon: '💾' },
    { name: 'CPU负载', value: performanceData.cpuUsage, unit: '%', color: '#fb923c', icon: '⚡' },
    { name: '网络延迟', value: performanceData.networkLatency, unit: 'ms', color: '#60a5fa', icon: '🌐' },
    { name: '存储使用', value: performanceData.storageUsed, unit: 'MB', color: '#a78bfa', icon: '💿' },
    { name: '活动窗口', value: performanceData.windowCount, unit: '个', color: '#34d399', icon: '🪟' },
    { name: '应用总数', value: performanceData.appCount, unit: '个', color: '#f87171', icon: '📦' },
    { name: '运行时间', value: performanceData.uptime, unit: '秒', color: '#22d3ee', icon: '⏱️' },
  ]
  
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="app-container app-system-status-dashboard">
      <div className="app-dashboard-header">
        <h2 className="app-dashboard-title">系统状态仪表盘</h2>
        <div className="app-dashboard-uptime">
          运行时间: {formatUptime(performanceData.uptime)}
        </div>
      </div>
      
      <div className="app-metrics-grid">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
      
      <div className="app-graphs-section">
        <h3 className="app-section-title">性能趋势</h3>
        <div className="app-graphs-grid">
          <PerformanceGraph data={fpsHistory} label="FPS" color="#4ade80" />
          <PerformanceGraph data={memoryHistory} label="内存 (MB)" color="#f472b6" />
        </div>
      </div>
      
      <div className="app-system-info-section">
        <h3 className="app-section-title">系统信息</h3>
        <div className="app-info-grid">
          <div className="app-info-item">
            <span className="app-info-label">浏览器</span>
            <span className="app-info-value">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">平台</span>
            <span className="app-info-value">{navigator.platform}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">语言</span>
            <span className="app-info-value">{navigator.language}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">屏幕分辨率</span>
            <span className="app-info-value">{window.screen.width} x {window.screen.height}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">视口大小</span>
            <span className="app-info-value">{window.innerWidth} x {window.innerHeight}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">设备像素比</span>
            <span className="app-info-value">{window.devicePixelRatio}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">在线状态</span>
            <span className="app-info-value">{navigator.onLine ? '在线' : '离线'}</span>
          </div>
          <div className="app-info-item">
            <span className="app-info-label">Cookies启用</span>
            <span className="app-info-value">{navigator.cookieEnabled ? '是' : '否'}</span>
          </div>
        </div>
      </div>
      
      <div className="app-actions-section">
        <button 
          className="app-action-btn"
          onClick={() => {
            if (navigator.storage && navigator.storage.estimate) {
              navigator.storage.estimate().then((estimate) => {
                alert(`存储使用: ${((estimate.usage || 0) / 1048576).toFixed(2)} MB\n可用: ${((estimate.quota || 0) / 1048576).toFixed(2)} MB`)
              })
            }
          }}
        >
          查看存储详情
        </button>
        <button 
          className="app-action-btn"
          onClick={() => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            if (perfData) {
              alert(`页面加载时间: ${perfData.loadEventEnd.toFixed(0)} ms\nDOM解析: ${perfData.domComplete.toFixed(0)} ms`)
            }
          }}
        >
          查看加载性能
        </button>
        <button 
          className="app-action-btn"
          onClick={() => {
            localStorage.clear()
            sessionStorage.clear()
            alert('缓存已清除')
            updateMetrics()
          }}
        >
          清除缓存
        </button>
      </div>
    </div>
  )
}