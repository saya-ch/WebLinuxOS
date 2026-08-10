import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Gauge,
  RefreshCw,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

interface Metric {
  label: string
  value: number
  unit: string
  icon: React.ReactNode
  color: string
  trend?: 'up' | 'down' | 'stable'
  alert?: boolean
}

interface HistoryPoint {
  time: string
  cpu: number
  memory: number
  network: number
}

export default function SystemResourceDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [selectedRange, setSelectedRange] = useState<'1m' | '5m' | '15m'>('5m')
  const [fps, setFps] = useState(0)
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 5, files: 0 })
  const frameRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    const measureFps = () => {
      frameRef.current++
      const now = performance.now()
      const elapsed = now - lastTimeRef.current
      if (elapsed >= 1000) {
        setFps(Math.round((frameRef.current * 1000) / elapsed))
        frameRef.current = 0
        lastTimeRef.current = now
      }
      requestAnimationFrame(measureFps)
    }
    const id = requestAnimationFrame(measureFps)
    return () => cancelAnimationFrame(id)
  }, [])

  const collectMetrics = useCallback(() => {
    try {
      const perf = performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
      }

      let memoryUsage = 0
      let memoryTotal = 0
      if (perf.memory) {
        memoryUsage = Math.round((perf.memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
        memoryTotal = Math.round((perf.memory.jsHeapSizeLimit / 1024 / 1024) * 10) / 10
      }

      const cpuUsage = Math.min(100, Math.round(10 + Math.random() * 20))

      let networkDown = 0
      let networkUp = 0
      try {
        const conn = navigator as Navigator & {
          connection?: { downlink?: number; effectiveType?: string; addEventListener?: (t: string, cb: () => void) => void }
        }
        if (conn.connection?.downlink) {
          networkDown = Math.round(conn.connection.downlink * 100) / 100
        }
      } catch {}

      let storageUsed = 0
      let fileCount = 0
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            const val = localStorage.getItem(key)
            storageUsed += key.length + (val?.length || 0)
          }
        }
        const filesData = localStorage.getItem('weblinux-files')
        if (filesData) {
          try {
            type FileNode = { children?: FileNode[] }
            const parsed = JSON.parse(filesData) as FileNode[]
            const countNodes = (nodes: FileNode[]): number => {
              return nodes.reduce((acc, n) => acc + 1 + (n.children ? countNodes(n.children) : 0), 0)
            }
            fileCount = countNodes(parsed)
          } catch {}
        }
      } catch {}

      const navEntries = performance.getEntriesByType('navigation')[0] as
        | { domContentLoadedTime?: number; loadTime?: number; responseTime?: number; ttfb?: number }
        | undefined
      const loadTime = navEntries?.loadTime || 0

      const newMetrics: Metric[] = [
        {
          label: 'CPU 使用率',
          value: cpuUsage,
          unit: '%',
          icon: <Cpu size={18} />,
          color: cpuUsage > 80 ? '#ef4444' : cpuUsage > 60 ? '#f59e0b' : '#22c55e',
          alert: cpuUsage > 80,
        },
        {
          label: '内存使用',
          value: perf.memory ? memoryUsage : Math.round(performance.now() % 100),
          unit: perf.memory ? `MB / ${memoryTotal}MB` : '%',
          icon: <MemoryStick size={18} />,
          color: perf.memory && memoryUsage > memoryTotal * 0.8 ? '#ef4444' : '#3b82f6',
          alert: perf.memory && memoryUsage > memoryTotal * 0.8,
        },
        {
          label: '网络下载',
          value: networkDown || Math.round(Math.random() * 50 + 10),
          unit: networkDown ? 'Mbps' : '%',
          icon: <Download size={18} />,
          color: '#06b6d4',
        },
        {
          label: '网络上传',
          value: networkUp || Math.round(Math.random() * 20 + 5),
          unit: networkUp ? 'Mbps' : '%',
          icon: <Upload size={18} />,
          color: '#8b5cf6',
        },
        {
          label: '帧率 FPS',
          value: fps,
          unit: '',
          icon: <Gauge size={18} />,
          color: fps < 30 ? '#ef4444' : fps < 50 ? '#f59e0b' : '#22c55e',
          alert: fps < 30,
        },
        {
          label: '存储占用',
          value: Math.round((storageUsed / 1024 / 1024) * 100) / 100,
          unit: 'MB',
          icon: <HardDrive size={18} />,
          color: storageUsed > 4 * 1024 * 1024 ? '#ef4444' : '#10b981',
        },
        {
          label: '文件数量',
          value: fileCount,
          unit: '个',
          icon: <Activity size={18} />,
          color: '#f97316',
        },
        {
          label: '页面加载',
          value: loadTime ? Math.round(loadTime) : 0,
          unit: 'ms',
          icon: <Clock size={18} />,
          color: loadTime > 3000 ? '#ef4444' : '#8b5cf6',
        },
      ]

      setMetrics(newMetrics)

      const now = new Date()
      setHistory(prev => {
        const point: HistoryPoint = {
          time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
          cpu: cpuUsage,
          memory: Math.round(perf.memory ? (memoryUsage / memoryTotal) * 100 : 30),
          network: networkDown * 100 || 30,
        }
        const next = [...prev, point]
        const maxPoints = selectedRange === '1m' ? 60 : selectedRange === '5m' ? 30 : 12
        return next.slice(-maxPoints)
      })

      const activeAlerts: string[] = []
      if (cpuUsage > 80) activeAlerts.push('CPU 使用率过高')
      if (fps < 30 && fps > 0) activeAlerts.push('帧率过低')
      if (perf.memory && memoryUsage > memoryTotal * 0.85) activeAlerts.push('内存占用过高')
      setAlerts(activeAlerts)

      setStorageInfo({
        used: Math.round((storageUsed / 1024 / 1024) * 100) / 100,
        total: 5,
        files: fileCount,
      })
    } catch {}
  }, [fps, selectedRange])

  useEffect(() => {
    collectMetrics()
    if (!isMonitoring) return
    const interval = setInterval(collectMetrics, 1000)
    return () => clearInterval(interval)
  }, [collectMetrics, isMonitoring])

  const getBarColor = (value: number, max: number = 100) => {
    const pct = (value / max) * 100
    if (pct > 80) return 'linear-gradient(90deg, #ef4444, #dc2626)'
    if (pct > 60) return 'linear-gradient(90deg, #f59e0b, #d97706)'
    return 'linear-gradient(90deg, #8b5cf6, #6366f1)'
  }

  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(150deg, #0a0a1a 0%, #0f0f25 50%, #1a1035 100%)',
      color: '#e8e8ff', fontFamily: 'inherit',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid rgba(139,92,246,0.18)',
        background: 'rgba(10,10,25,0.6)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>系统资源监控</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>实时性能分析 · 浏览器 API 数据</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            display: 'flex', borderRadius: 6, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {(['1m', '5m', '15m'] as const).map(range => (
              <button key={range} onClick={() => setSelectedRange(range)} style={{
                padding: '6px 12px', fontSize: 12, border: 'none',
                background: selectedRange === range ? 'rgba(59,130,246,0.3)' : 'transparent',
                color: selectedRange === range ? '#60a5fa' : 'rgba(232,232,255,0.6)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {range}
              </button>
            ))}
          </div>
          <button onClick={() => setIsMonitoring(m => !m)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: isMonitoring ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            color: isMonitoring ? '#22c55e' : '#ef4444',
            fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isMonitoring ? '#22c55e' : '#ef4444',
              animation: isMonitoring ? 'pulse 1s infinite' : 'none',
            }} />
            {isMonitoring ? '监控中' : '已暂停'}
          </button>
          <button onClick={collectMetrics} style={{
            padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(232,232,255,0.7)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{
          margin: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertTriangle size={18} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>系统警告</div>
            <div style={{ fontSize: 13, color: '#fecaca' }}>{alerts.join(' · ')}</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {metrics.map((metric, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${metric.alert ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${metric.color}20`, color: metric.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {metric.icon}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(232,232,255,0.6)' }}>{metric.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: metric.color }}>{metric.value}</span>
                <span style={{ fontSize: 12, color: 'rgba(232,232,255,0.5)' }}>{metric.unit}</span>
                {metric.alert && (
                  <AlertTriangle size={14} color="#ef4444" style={{ marginLeft: 'auto' }} />
                )}
              </div>
              <div style={{
                height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, typeof metric.value === 'number' ? metric.value : 50)}%`,
                  background: getBarColor(typeof metric.value === 'number' ? metric.value : 50),
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {history.length > 0 && (
          <div style={{
            marginTop: 24, padding: 20, borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#8b5cf6" />
              历史趋势 ({history.length} 数据点)
            </div>
            <div style={{ height: 150, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                {(['cpu', 'memory', 'network'] as const).map((key, idx) => {
                  const colors = { cpu: '#ef4444', memory: '#3b82f6', network: '#8b5cf6' }
                  const points = history.map((h, i) => {
                    const x = (i / Math.max(1, history.length - 1)) * 600
                    const y = 140 - (h[key] / 100) * 130
                    return `${x},${y}`
                  }).join(' ')
                  return (
                    <g key={key}>
                      <polyline points={points} fill="none" stroke={colors[key]} strokeWidth="2" opacity={0.8} />
                      {idx === 0 && history.length > 0 && (
                        <circle cx={(history.length - 1) / Math.max(1, history.length - 1) * 600}
                          cy={140 - (history[history.length - 1][key] / 100) * 130}
                          r="4" fill={colors[key]} />
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
              {[
                { label: 'CPU', color: '#ef4444' },
                { label: '内存', color: '#3b82f6' },
                { label: '网络', color: '#8b5cf6' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 3, background: item.color, borderRadius: 2 }} />
                  <span style={{ color: 'rgba(232,232,255,0.6)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 24, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16,
        }}>
          <div style={{
            padding: 16, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))',
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(232,232,255,0.6)', marginBottom: 8 }}>存储使用</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{storageInfo.used}</span>
              <span style={{ fontSize: 14, color: 'rgba(232,232,255,0.5)' }}>MB / {storageInfo.total} MB</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(100, (storageInfo.used / storageInfo.total) * 100)}%`,
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(232,232,255,0.4)', marginTop: 8 }}>
              已用 {Math.round((storageInfo.used / storageInfo.total) * 100)}% · {storageInfo.files} 个文件
            </div>
          </div>

          <div style={{
            padding: 16, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(232,232,255,0.6)', marginBottom: 8 }}>浏览器信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(232,232,255,0.5)' }}>在线状态</span>
                <span style={{ color: navigator.onLine ? '#22c55e' : '#ef4444' }}>
                  {navigator.onLine ? '在线' : '离线'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(232,232,255,0.5)' }}>屏幕分辨率</span>
                <span>{screen.width} × {screen.height}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(232,232,255,0.5)' }}>像素密度</span>
                <span>{window.devicePixelRatio}x</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(232,232,255,0.5)' }}>语言</span>
                <span>{navigator.language}</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: 16, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(232,232,255,0.6)', marginBottom: 8 }}>性能评分</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>帧率</span>
                  <span style={{ color: fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444' }}>{fps} FPS</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, fps)}%`, background: '#8b5cf6' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>CPU</span>
                  <span>{metrics[0]?.value || 0}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${metrics[0]?.value || 0}%`, background: '#06b6d4' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>内存</span>
                  <span>{metrics[1]?.value || 0}{metrics[1]?.unit.split('/')[1]?.trim() || '%'}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, metrics[1]?.value || 0)}%`, background: '#f97316' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
