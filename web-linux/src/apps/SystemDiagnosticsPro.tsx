import { useState, useEffect, useMemo, useCallback } from 'react'
import { ActivityIcon, RefreshCwIcon, AlertTriangleIcon, CheckCircleIcon } from '../icons'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  history: number[]
}

interface DiagnosticResult {
  category: string
  status: 'passed' | 'warning' | 'failed'
  message: string
  details?: string
}

export default function SystemDiagnosticsPro() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [lastScan, setLastScan] = useState<Date | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'diagnostics'>('overview')

  // 模拟性能数据收集
  const collectMetrics = useCallback(async () => {
    setIsScanning(true)
    setScanProgress(0)

    const newMetrics: PerformanceMetric[] = []
    const categories = [
      { name: 'CPU使用率', min: 15, max: 85, unit: '%' },
      { name: '内存占用', min: 40, max: 75, unit: '%' },
      { name: 'GPU负载', min: 10, max: 60, unit: '%' },
      { name: '网络延迟', min: 5, max: 50, unit: 'ms' },
      { name: '磁盘读写', min: 20, max: 80, unit: 'MB/s' },
      { name: '电池健康', min: 85, max: 100, unit: '%' },
      { name: '温度', min: 35, max: 65, unit: '°C' },
      { name: 'FPS', min: 30, max: 60, unit: 'fps' },
    ]

    for (let i = 0; i < categories.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const cat = categories[i]
      const value = Math.round(cat.min + Math.random() * (cat.max - cat.min))
      const status = value > 80 ? 'critical' : value > 60 ? 'warning' : 'good'
      
      newMetrics.push({
        name: cat.name,
        value,
        unit: cat.unit,
        status: status as 'good' | 'warning' | 'critical',
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        history: Array.from({ length: 20 }, () => 
          Math.round(cat.min + Math.random() * (cat.max - cat.min))
        )
      })
      
      setScanProgress(Math.round(((i + 1) / categories.length) * 100))
      setMetrics([...newMetrics])
    }

    // 诊断结果
    const newDiagnostics: DiagnosticResult[] = [
      {
        category: '内存管理',
        status: newMetrics[1].value > 70 ? 'warning' : 'passed',
        message: newMetrics[1].value > 70 
          ? '内存使用率较高，建议关闭不必要的应用' 
          : '内存使用正常',
        details: `当前使用 ${newMetrics[1].value}%，可用内存充足`
      },
      {
        category: 'CPU性能',
        status: newMetrics[0].value > 75 ? 'warning' : 'passed',
        message: newMetrics[0].value > 75 
          ? 'CPU负载较高，可能影响响应速度' 
          : 'CPU性能表现良好',
        details: `核心负载 ${newMetrics[0].value}%，多核利用率良好`
      },
      {
        category: '网络连接',
        status: newMetrics[3].value > 40 ? 'warning' : 'passed',
        message: newMetrics[3].value > 40 
          ? '网络延迟偏高，可能影响实时通信' 
          : '网络连接稳定',
        details: `延迟 ${newMetrics[3].value}ms，丢包率 0%`
      },
      {
        category: '电池状态',
        status: newMetrics[5].value < 90 ? 'warning' : 'passed',
        message: newMetrics[5].value < 90 
          ? '电池健康度下降，建议检查电源管理' 
          : '电池状态良好',
        details: `健康度 ${newMetrics[5].value}%，循环次数正常`
      },
      {
        category: '磁盘性能',
        status: newMetrics[4].value < 30 ? 'warning' : 'passed',
        message: newMetrics[4].value < 30 
          ? '磁盘读写速度较慢，建议清理磁盘空间' 
          : '磁盘性能正常',
        details: `读写速度 ${newMetrics[4].value} MB/s`
      },
      {
        category: '系统温度',
        status: newMetrics[6].value > 60 ? 'warning' : 'passed',
        message: newMetrics[6].value > 60 
          ? '系统温度偏高，请检查散热' 
          : '系统温度正常',
        details: `当前温度 ${newMetrics[6].value}°C`
      },
      {
        category: '渲染性能',
        status: newMetrics[7].value < 45 ? 'warning' : 'passed',
        message: newMetrics[7].value < 45 
          ? '帧率偏低，可能影响动画流畅度' 
          : '渲染性能良好',
        details: `平均帧率 ${newMetrics[7].value} fps`
      },
      {
        category: '安全检查',
        status: 'passed',
        message: '未检测到安全风险',
        details: 'HTTPS连接正常，CSP策略有效'
      },
      {
        category: '存储空间',
        status: 'passed',
        message: '存储空间充足',
        details: 'LocalStorage使用正常，无越界风险'
      },
      {
        category: '浏览器兼容',
        status: 'passed',
        message: '浏览器特性支持良好',
        details: 'WebGL、Service Worker、IndexedDB均可用'
      }
    ]

    setDiagnostics(newDiagnostics)
    setLastScan(new Date())
    setIsScanning(false)
  }, [])

  useEffect(() => {
    collectMetrics()
  }, [collectMetrics])

  const overallScore = useMemo(() => {
    if (metrics.length === 0) return 0
    const goodCount = metrics.filter(m => m.status === 'good').length
    const warningCount = metrics.filter(m => m.status === 'warning').length
    return Math.round((goodCount * 10 + warningCount * 6) / metrics.length * 10)
  }, [metrics])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#22c55e'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ActivityIcon size={24} style={{ color: '#8b5cf6' }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>系统诊断与性能分析</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              {lastScan ? `上次扫描: ${lastScan.toLocaleTimeString()}` : '正在扫描...'}
            </p>
          </div>
        </div>
        <button
          onClick={collectMetrics}
          disabled={isScanning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: isScanning ? '#475569' : '#8b5cf6',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: isScanning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCwIcon size={14} style={{ 
            animation: isScanning ? 'spin 1s linear infinite' : 'none' 
          }} />
          {isScanning ? '扫描中...' : '重新扫描'}
        </button>
      </div>

      {/* 标签页 */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {['overview', 'metrics', 'diagnostics'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            style={{
              padding: '8px 16px',
              background: selectedTab === tab ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              border: selectedTab === tab ? '1px solid #8b5cf6' : '1px solid transparent',
              borderRadius: 6,
              color: selectedTab === tab ? '#a78bfa' : '#94a3b8',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'overview' ? '概览' : tab === 'metrics' ? '性能指标' : '诊断结果'}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {selectedTab === 'overview' && (
          <div>
            {/* 总分卡片 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              border: '1px solid rgba(139, 92, 246, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>系统健康评分</div>
              <div style={{
                fontSize: 64,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#f59e0b' : '#ef4444'} 0%, #fff 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {overallScore}
              </div>
              <div style={{ 
                fontSize: 14, 
                color: overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#f59e0b' : '#ef4444',
                marginTop: 4
              }}>
                {overallScore >= 80 ? '系统状态良好' : overallScore >= 60 ? '系统状态一般' : '系统状态较差'}
              </div>
              
              {isScanning && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    height: 4,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${scanProgress}%`,
                      background: '#8b5cf6',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    扫描进度: {scanProgress}%
                  </div>
                </div>
              )}
            </div>

            {/* 快速指标网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12
            }}>
              {metrics.slice(0, 6).map((metric, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${getStatusColor(metric.status)}20`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{metric.name}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: `${getStatusColor(metric.status)}20`,
                      color: getStatusColor(metric.status)
                    }}>
                      {metric.status === 'good' ? '正常' : metric.status === 'warning' ? '警告' : '严重'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 600 }}>{metric.value}</span>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'metrics' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {metrics.map((metric, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{metric.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>实时监控</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 600, color: getStatusColor(metric.status) }}>
                      {metric.value}
                    </span>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{metric.unit}</span>
                  </div>
                </div>
                
                {/* 历史趋势图 */}
                <div style={{ 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: 2,
                  padding: '8px 0'
                }}>
                  {metric.history.map((val, j) => (
                    <div
                      key={j}
                      style={{
                        flex: 1,
                        height: `${(val / 100) * 100}%`,
                        background: `linear-gradient(to top, ${getStatusColor(metric.status)}40, ${getStatusColor(metric.status)}20)`,
                        borderRadius: 2,
                        minWidth: 4
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'diagnostics' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {diagnostics.map((diag, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: 16,
                border: `1px solid ${getStatusColor(diag.status)}20`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <div style={{
                  padding: 8,
                  borderRadius: 8,
                  background: `${getStatusColor(diag.status)}15`,
                  color: getStatusColor(diag.status)
                }}>
                  {diag.status === 'passed' ? <CheckCircleIcon size={20} /> : <AlertTriangleIcon size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{diag.category}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: `${getStatusColor(diag.status)}20`,
                      color: getStatusColor(diag.status)
                    }}>
                      {diag.status === 'passed' ? '通过' : '警告'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>{diag.message}</div>
                  {diag.details && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>{diag.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}