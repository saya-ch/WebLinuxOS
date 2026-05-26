import { useState, useEffect, useMemo } from 'react'

interface HealthMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'danger'
  description: string
  icon: string
}

interface SystemCheckResult {
  id: string
  name: string
  status: 'passed' | 'warning' | 'failed'
  details: string
  icon: string
}

export default function SystemHealthCheck() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [checks, setChecks] = useState<SystemCheckResult[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isScanning, setIsScanning] = useState(false)

  const generateMetrics = () => {
    const cpuUsage = 20 + Math.random() * 50
    const memoryUsage = 40 + Math.random() * 35
    const diskUsage = 30 + Math.random() * 40
    const networkLatency = 20 + Math.random() * 80

    const newMetrics: HealthMetric[] = [
      {
        name: 'CPU 使用率',
        value: Math.round(cpuUsage),
        unit: '%',
        status: cpuUsage < 60 ? 'good' : cpuUsage < 80 ? 'warning' : 'danger',
        description: '处理器当前负载情况',
        icon: '⚡',
      },
      {
        name: '内存使用率',
        value: Math.round(memoryUsage),
        unit: '%',
        status: memoryUsage < 70 ? 'good' : memoryUsage < 85 ? 'warning' : 'danger',
        description: 'RAM 占用情况',
        icon: '🧠',
      },
      {
        name: '磁盘空间',
        value: Math.round(diskUsage),
        unit: '%',
        status: diskUsage < 70 ? 'good' : diskUsage < 85 ? 'warning' : 'danger',
        description: '存储使用情况',
        icon: '💾',
      },
      {
        name: '网络延迟',
        value: Math.round(networkLatency),
        unit: 'ms',
        status: networkLatency < 100 ? 'good' : networkLatency < 200 ? 'warning' : 'danger',
        description: '网络响应时间',
        icon: '🌐',
      },
      {
        name: '系统负载',
        value: 0.5 + Math.random() * 1.5,
        unit: 'x',
        status: Math.random() > 0.1 ? 'good' : 'warning',
        description: '系统整体压力',
        icon: '📊',
      },
      {
        name: '电池健康',
        value: 85 + Math.random() * 10,
        unit: '%',
        status: 'good',
        description: '电池状态',
        icon: '🔋',
      },
    ]
    setMetrics(newMetrics)
  }

  const runSystemChecks = () => {
    setIsScanning(true)
    setTimeout(() => {
      const newChecks: SystemCheckResult[] = [
        {
          id: 'memory',
          name: '内存完整性',
          status: 'passed',
          details: '内存区域检查通过，无泄漏检测',
          icon: '✅',
        },
        {
          id: 'storage',
          name: '文件系统',
          status: 'passed',
          details: '文件系统健康，无损坏扇区',
          icon: '✅',
        },
        {
          id: 'network',
          name: '网络连接',
          status: 'passed',
          details: '网络连接稳定，所有接口正常',
          icon: '✅',
        },
        {
          id: 'security',
          name: '安全检查',
          status: Math.random() > 0.3 ? 'passed' : 'warning',
          details: '系统安全配置良好',
          icon: Math.random() > 0.3 ? '✅' : '⚠️',
        },
        {
          id: 'performance',
          name: '性能优化',
          status: 'passed',
          details: '系统性能良好，响应迅速',
          icon: '✅',
        },
        {
          id: 'updates',
          name: '系统更新',
          status: Math.random() > 0.5 ? 'passed' : 'warning',
          details: '系统已更新到最新版本',
          icon: Math.random() > 0.5 ? '✅' : '⚠️',
        },
      ]
      setChecks(newChecks)
      setIsScanning(false)
      setLastUpdated(new Date())
    }, 1500)
  }

  useEffect(() => {
    generateMetrics()
    runSystemChecks()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      generateMetrics()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const healthScore = useMemo(() => {
    const scores = metrics.map(m => {
      if (m.status === 'good') return 100
      if (m.status === 'warning') return 70
      return 40
    })
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }, [metrics])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'passed':
        return '#22c55e'
      case 'warning':
        return '#f59e0b'
      case 'danger':
      case 'failed':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 60) return '一般'
    return '需要注意'
  }

  return (
    <div 
      className="app-container app-system-health" 
      style={{ 
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', 
        color: '#fff', 
        padding: 20,
        overflow: 'auto',
        minHeight: '100%',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🩺 系统健康检查</h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>实时监控您的 Web 系统状态</p>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)', 
        borderRadius: 24, 
        padding: 24, 
        marginBottom: 24,
        border: '1px solid rgba(34, 197, 94, 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>综合健康指数</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: getScoreColor(healthScore) }}>
              {healthScore}
              <span style={{ fontSize: 20, fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: getScoreColor(healthScore), marginTop: 4 }}>
              {getScoreLabel(healthScore)}
            </div>
          </div>
          <div style={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            background: `conic-gradient(${getScoreColor(healthScore)} ${healthScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ 
              width: 90, 
              height: 90, 
              borderRadius: '50%', 
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}>
              {healthScore >= 80 ? '🏆' : healthScore >= 60 ? '⚠️' : '🚨'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>📈 实时指标</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            更新于 {lastUpdated.toLocaleTimeString('zh-CN')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {metrics.map((metric, i) => (
            <div 
              key={i}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: 16, 
                padding: 16,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{metric.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{metric.name}</span>
                </div>
                <span 
                  style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: getStatusColor(metric.status),
                    background: `${getStatusColor(metric.status)}20`,
                    padding: '4px 10px',
                    borderRadius: 8,
                  }}
                >
                  {metric.status === 'good' ? '良好' : metric.status === 'warning' ? '警告' : '危险'}
                </span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800 }}>
                  {metric.value}
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>{metric.unit}</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(metric.value, 100)}%`,
                    background: `linear-gradient(90deg, ${getStatusColor(metric.status)}, ${getStatusColor(metric.status)}88)`,
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>🔍 系统检查</h3>
          <button
            onClick={() => {
              generateMetrics()
              runSystemChecks()
            }}
            disabled={isScanning}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: isScanning ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.2)',
              color: isScanning ? '#64748b' : '#60a5fa',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {isScanning ? '🔄 扫描中...' : '🔄 重新检查'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {checks.length > 0 ? checks.map((check) => (
            <div
              key={check.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontSize: 20 }}>{check.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{check.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{check.details}</div>
              </div>
              <span 
                style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: getStatusColor(check.status),
                }}
              >
                {check.status === 'passed' ? '通过' : check.status === 'warning' ? '警告' : '失败'}
              </span>
            </div>
          )) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                }}
              >
                <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: 120, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 10, width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        background: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: 16, 
        padding: 16,
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: 13,
        color: '#93c5fd',
        textAlign: 'center',
      }}>
        💡 提示：这是一个模拟的系统健康检查器，运行在 WebLinux 环境中。实际系统指标取决于您的浏览器和设备。
      </div>
    </div>
  )
}
