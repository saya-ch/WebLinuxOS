import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

interface MetricData {
  label: string
  value: number
  max: number
  color: string
  history: number[]
}

interface SystemStat {
  time: number
  cpu: number
  memory: number
  network: number
}

const SystemDashboard = () => {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const totalDesktops = useStore((s) => s.totalDesktops)
  const openApp = useStore((s) => s.openApp)

  const [stats, setStats] = useState<SystemStat[]>([])
  const [uptime, setUpTime] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'apps' | 'storage'>('overview')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startTime = useRef<number>(0)

  useEffect(() => {
    startTime.current = Date.now()
    // Collect initial stats
    const initialStats: SystemStat[] = []
    const now = Date.now()
    for (let i = 0; i < 20; i++) {
      initialStats.push({
        time: now - (20 - i) * 1000,
        cpu: 30 + Math.random() * 40,
        memory: 40 + Math.random() * 30,
        network: 10 + Math.random() * 50
      })
    }
    setStats(initialStats)

    // Update stats every second
    const interval = setInterval(() => {
      setStats(prev => {
        const newStat: SystemStat = {
          time: Date.now(),
          cpu: Math.max(0, Math.min(100, (prev[prev.length - 1]?.cpu || 50) + (Math.random() - 0.5) * 20)),
          memory: Math.max(0, Math.min(100, (prev[prev.length - 1]?.memory || 50) + (Math.random() - 0.5) * 10)),
          network: Math.max(0, Math.min(100, Math.random() * 100))
        }
        return [...prev.slice(-49), newStat]
      })

      setUpTime(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    data: SystemStat[],
    key: keyof SystemStat,
    rect: DOMRect,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    color: string,
    fillColor: string
  ) => {
    if (data.length < 2) return

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'

    const startX = padding
    const maxX = rect.width - padding

    data.forEach((point, i) => {
      const x = startX + (i / (data.length - 1)) * chartWidth
      const y = padding + chartHeight - (point[key] / 100) * chartHeight
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.lineTo(maxX, padding + chartHeight)
    ctx.lineTo(startX, padding + chartHeight)
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      if (stats.length < 2) return

      const padding = 40
      const chartWidth = rect.width - padding * 2
      const chartHeight = rect.height - padding * 2

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(rect.width - padding, y)
        ctx.stroke()
      }

      drawLine(ctx, stats, 'cpu', rect, padding, chartWidth, chartHeight, 'rgba(139, 124, 240, 0.8)', 'rgba(139, 124, 240, 0.2)')

      drawLine(ctx, stats, 'memory', rect, padding, chartWidth, chartHeight, 'rgba(0, 206, 201, 0.8)', 'rgba(0, 206, 201, 0.2)')

      drawLine(ctx, stats, 'network', rect, padding, chartWidth, chartHeight, 'rgba(255, 159, 67, 0.8)', 'rgba(255, 159, 67, 0.2)')

      requestAnimationFrame(draw)
    }
    const animationId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [stats])

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const currentStats = stats[stats.length - 1] || { cpu: 0, memory: 0, network: 0 }

  const metrics: MetricData[] = [
    { label: 'CPU', value: currentStats.cpu, max: 100, color: 'from-purple-500 to-purple-600', history: stats.map(s => s.cpu) },
    { label: '内存', value: currentStats.memory, max: 100, color: 'from-cyan-500 to-cyan-600', history: stats.map(s => s.memory) },
    { label: '网络', value: currentStats.network, max: 100, color: 'from-orange-500 to-orange-600', history: stats.map(s => s.network) },
    { label: '窗口', value: windows.length, max: 50, color: 'from-green-500 to-green-600', history: [] }
  ]

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a35 100%)',
      color: '#e0e0e8',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: 600,
          background: 'linear-gradient(90deg, #8b7cf0, #00cec9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          📊 系统仪表盘
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#888' }}>
          运行时间: {formatUptime(uptime)} | 桌面 {currentDesktop}/{totalDesktops}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {(['overview', 'performance', 'apps', 'storage'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab ? 'linear-gradient(90deg, #8b7cf0, #00cec9)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === tab ? '#fff' : '#aaa',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab === 'overview' && '📋 概览'}
            {tab === 'performance' && '⚡ 性能'}
            {tab === 'apps' && '📱 应用'}
            {tab === 'storage' && '💾 存储'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#888' }}>{metric.label}</span>
                    <span style={{ fontSize: '24px', fontWeight: 700 }}>
                      {Math.round(metric.value)}{metric.max === 100 ? '%' : ''}
                    </span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(metric.value / metric.max) * 100}%`,
                      background: `linear-gradient(90deg, ${metric.color.includes('purple') ? '#8b7cf0' : metric.color.includes('cyan') ? '#00cec9' : metric.color.includes('orange') ? '#ff9f43' : '#00d2d3'})`,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#aaa' }}>⚡ 快捷操作</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'terminal', icon: '💻', label: '终端' },
                  { id: 'files', icon: '📁', label: '文件管理' },
                  { id: 'settings', icon: '⚙️', label: '设置' },
                  { id: 'system-monitor', icon: '📈', label: '系统监控' },
                  { id: 'task-manager', icon: '📋', label: '任务管理' },
                  { id: 'calculator', icon: '🔢', label: '计算器' }
                ].map(app => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#e0e0e8',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 124, 240, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(139, 124, 240, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>{app.icon}</span>
                    <span style={{ fontSize: '13px' }}>{app.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Chart */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '300px'
            }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b7cf0' }} />
                  <span style={{ fontSize: '14px' }}>CPU</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00cec9' }} />
                  <span style={{ fontSize: '14px' }}>内存</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff9f43' }} />
                  <span style={{ fontSize: '14px' }}>网络</span>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 'calc(100% - 50px)'
                }}
              />
            </div>

            {/* Detailed Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { label: 'CPU 使用率', value: `${currentStats.cpu.toFixed(1)}%`, color: '#8b7cf0' },
                { label: '内存使用', value: `${currentStats.memory.toFixed(1)}%`, color: '#00cec9' },
                { label: '网络流量', value: `${currentStats.network.toFixed(0)} KB/s`, color: '#ff9f43' },
                { label: '活动窗口', value: windows.length.toString(), color: '#00d2d3' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>打开的应用 ({windows.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {windows.length === 0 ? (
                  <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>
                    没有打开的应用
                  </div>
                ) : (
                  windows.map((win) => {
                    const app = apps.find(a => a.id === win.appId)
                    return (
                      <div key={win.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        border: win.focused ? '1px solid rgba(139, 124, 240, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>{app?.icon || '📄'}</span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{win.title}</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              {win.appId} • {win.focused ? '✅ 活动' : '⏸️ 后台'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#666', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                            {win.maximized ? '最大化' : win.minimized ? '最小化' : '正常'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>所有应用 ({apps.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {apps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '16px',
                      cursor: 'pointer',
                      color: '#e0e0e8',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 124, 240, 0.1)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{app.icon}</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{app.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{app.category}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0' }}>📦 存储概览</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { name: '系统', used: 45, total: 100, color: '#8b7cf0' },
                  { name: '应用', used: 30, total: 100, color: '#00cec9' },
                  { name: '文档', used: 15, total: 100, color: '#ff9f43' },
                  { name: '其他', used: 10, total: 100, color: '#00d2d3' }
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: '#888' }}>{item.used}%</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${item.used}%`,
                        background: item.color,
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>🛠️ 存储工具</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'disk-usage', icon: '💽', label: '磁盘分析' },
                  { id: 'disk-utility', icon: '🔧', label: '磁盘工具' },
                  { id: 'backup-tool', icon: '💾', label: '备份工具' },
                  { id: 'archive-manager', icon: '📦', label: '归档管理' }
                ].map(app => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#e0e0e8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{app.icon}</span>
                    <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500 }}>{app.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemDashboard
