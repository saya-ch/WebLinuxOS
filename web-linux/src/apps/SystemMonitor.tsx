import { useState, useEffect, useCallback, memo } from 'react'

interface SystemInfo {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
  fps: number
}

interface Process {
  id: string
  name: string
  cpu: number
  memory: number
  status: 'running' | 'idle' | 'stopped'
}

const mockProcesses: Process[] = [
  { id: '1', name: 'Desktop Environment', cpu: 15, memory: 120, status: 'running' },
  { id: '2', name: 'Window Manager', cpu: 8, memory: 45, status: 'running' },
  { id: '3', name: 'Terminal', cpu: 2, memory: 25, status: 'running' },
  { id: '4', name: 'Code Editor', cpu: 12, memory: 80, status: 'running' },
  { id: '5', name: 'Weather App', cpu: 1, memory: 15, status: 'idle' },
  { id: '6', name: 'File Manager', cpu: 3, memory: 35, status: 'idle' },
  { id: '7', name: 'Browser', cpu: 25, memory: 150, status: 'running' },
  { id: '8', name: 'Music Player', cpu: 5, memory: 40, status: 'running' },
]

const SystemMonitor = memo(function SystemMonitor() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpuUsage: 35,
    memoryUsage: 45,
    diskUsage: 60,
    networkLatency: 50,
    fps: 60
  })
  
  const [processes, setProcesses] = useState<Process[]>(mockProcesses)
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'processes' | 'performance'>('overview')
  const [historyData, setHistoryData] = useState<{ cpu: number[]; memory: number[] }>({
    cpu: [],
    memory: []
  })
  
  // 模拟系统数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      // 模拟CPU和内存使用波动
      const cpuDelta = (Math.random() - 0.5) * 10
      const memoryDelta = (Math.random() - 0.5) * 5
      
      setSystemInfo(prev => ({
        ...prev,
        cpuUsage: Math.max(5, Math.min(95, prev.cpuUsage + cpuDelta)),
        memoryUsage: Math.max(20, Math.min(90, prev.memoryUsage + memoryDelta)),
        fps: Math.floor(55 + Math.random() * 10)
      }))
      
      // 更新历史数据
      setHistoryData(prev => ({
        cpu: [...prev.cpu.slice(-30), systemInfo.cpuUsage],
        memory: [...prev.memory.slice(-30), systemInfo.memoryUsage]
      }))
      
      // 更新进程数据
      setProcesses(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0, Math.min(100, p.cpu + (Math.random() - 0.5) * 5)),
        memory: Math.max(5, p.memory + (Math.random() - 0.5) * 10)
      })))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [systemInfo.cpuUsage, systemInfo.memoryUsage])
  
  const getUsageColor = useCallback((usage: number) => {
    if (usage < 50) return '#22c55e'
    if (usage < 75) return '#eab308'
    return '#ef4444'
  }, [])
  
  const renderProgressBar = useCallback((value: number, max: number = 100) => {
    const percentage = (value / max) * 100
    return (
      <div style={{
        width: '100%',
        height: 24,
        background: '#1f2937',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: getUsageColor(percentage),
          borderRadius: 12,
          transition: 'width 0.5s ease'
        }} />
      </div>
    )
  }, [getUsageColor])
  
  const renderMiniGraph = useCallback((data: number[], color: string) => {
    const max = Math.max(...data, 100)
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - (v / max) * 100
      return `${x},${y}`
    }).join(' ')
    
    return (
      <svg style={{ width: '100%', height: 60 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
        <polyline
          fill={`${color}20`}
          stroke="none"
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    )
  }, [])
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 标签导航 */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid #1e293b'
      }}>
        {(['overview', 'processes', 'performance'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: viewMode === mode ? '#1e293b' : 'transparent',
              color: viewMode === mode ? '#3b82f6' : '#94a3b8',
              cursor: 'pointer',
              borderBottom: viewMode === mode ? '2px solid #3b82f6' : 'none',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            {mode === 'overview' ? '概览' : mode === 'processes' ? '进程' : '性能'}
          </button>
        ))}
      </div>
      
      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {viewMode === 'overview' && (
          <div>
            {/* 主要指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              marginBottom: 24
            }}>
              {/* CPU */}
              <div style={{
                padding: 20,
                background: '#1e293b',
                borderRadius: 12,
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>CPU 使用率</span>
                  <span style={{ fontSize: 24, fontWeight: 'bold', color: getUsageColor(systemInfo.cpuUsage) }}>
                    {systemInfo.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                {renderProgressBar(systemInfo.cpuUsage)}
                <div style={{ marginTop: 12 }}>
                  {renderMiniGraph(historyData.cpu, '#3b82f6')}
                </div>
              </div>
              
              {/* 内存 */}
              <div style={{
                padding: 20,
                background: '#1e293b',
                borderRadius: 12,
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>内存使用率</span>
                  <span style={{ fontSize: 24, fontWeight: 'bold', color: getUsageColor(systemInfo.memoryUsage) }}>
                    {systemInfo.memoryUsage.toFixed(1)}%
                  </span>
                </div>
                {renderProgressBar(systemInfo.memoryUsage)}
                <div style={{ marginTop: 12 }}>
                  {renderMiniGraph(historyData.memory, '#8b5cf6')}
                </div>
              </div>
            </div>
            
            {/* 其他指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16
            }}>
              {/* 网络延迟 */}
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: '#22c55e' }}>
                  {systemInfo.networkLatency}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>ms</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>网络延迟</div>
              </div>
              
              {/* FPS */}
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: '#3b82f6' }}>
                  {systemInfo.fps}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>FPS</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>帧率</div>
              </div>
              
              {/* 磁盘 */}
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: getUsageColor(systemInfo.diskUsage) }}>
                  {systemInfo.diskUsage}%
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>60 GB / 100 GB</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>磁盘使用</div>
              </div>
            </div>
            
            {/* 系统信息 */}
            <div style={{
              marginTop: 24,
              padding: 20,
              background: '#1e293b',
              borderRadius: 12,
              border: '1px solid #334155'
            }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>系统信息</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                fontSize: 13
              }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>操作系统: </span>
                  <span>WebLinuxOS 5.5.0</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>内核版本: </span>
                  <span>WebKernel 2.0</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>处理器: </span>
                  <span>Virtual CPU @ 2.4GHz</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>内存: </span>
                  <span>8 GB RAM</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>运行时间: </span>
                  <span>{Math.floor(performance.now() / 1000 / 60)} 分钟</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>进程数: </span>
                  <span>{processes.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {viewMode === 'processes' && (
          <div>
            {/* 进程列表 */}
            <div style={{
              background: '#1e293b',
              borderRadius: 12,
              border: '1px solid #334155',
              overflow: 'hidden'
            }}>
              {/* 表头 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 80px 80px 80px',
                padding: '12px 16px',
                background: '#334155',
                fontSize: 12,
                color: '#94a3b8',
                fontWeight: 500
              }}>
                <div>ID</div>
                <div>进程名</div>
                <div>CPU %</div>
                <div>内存 MB</div>
                <div>状态</div>
              </div>
              
              {/* 进程行 */}
              {processes.map(process => (
                <div
                  key={process.id}
                  onClick={() => setSelectedProcess(process.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 80px 80px 80px',
                    padding: '12px 16px',
                    background: selectedProcess === process.id ? '#334155' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    borderBottom: '1px solid #334155'
                  }}
                >
                  <div style={{ color: '#64748b' }}>{process.id}</div>
                  <div>{process.name}</div>
                  <div style={{ color: getUsageColor(process.cpu) }}>{process.cpu.toFixed(1)}%</div>
                  <div style={{ color: '#8b5cf6' }}>{process.memory.toFixed(0)}</div>
                  <div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      background: process.status === 'running' ? '#22c55e20' : '#64748b20',
                      color: process.status === 'running' ? '#22c55e' : '#64748b'
                    }}>
                      {process.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 进程操作 */}
            {selectedProcess && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                display: 'flex',
                gap: 12
              }}>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  结束进程
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  查看详情
                </button>
              </div>
            )}
          </div>
        )}
        
        {viewMode === 'performance' && (
          <div>
            {/* 实时图表 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16
            }}>
              {/* CPU历史 */}
              <div style={{
                padding: 20,
                background: '#1e293b',
                borderRadius: 12,
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>CPU 使用历史</div>
                <div style={{ height: 150 }}>
                  {renderMiniGraph(historyData.cpu, '#3b82f6')}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  fontSize: 12,
                  color: '#64748b'
                }}>
                  <span>30秒前</span>
                  <span>现在</span>
                </div>
              </div>
              
              {/* 内存历史 */}
              <div style={{
                padding: 20,
                background: '#1e293b',
                borderRadius: 12,
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>内存使用历史</div>
                <div style={{ height: 150 }}>
                  {renderMiniGraph(historyData.memory, '#8b5cf6')}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  fontSize: 12,
                  color: '#64748b'
                }}>
                  <span>30秒前</span>
                  <span>现在</span>
                </div>
              </div>
            </div>
            
            {/* 性能统计 */}
            <div style={{
              marginTop: 24,
              padding: 20,
              background: '#1e293b',
              borderRadius: 12,
              border: '1px solid #334155'
            }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>性能统计</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                    {historyData.cpu.length > 0 ? (historyData.cpu.reduce((a, b) => a + b, 0) / historyData.cpu.length).toFixed(1) : 0}%
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>平均CPU</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#8b5cf6' }}>
                    {historyData.memory.length > 0 ? (historyData.memory.reduce((a, b) => a + b, 0) / historyData.memory.length).toFixed(1) : 0}%
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>平均内存</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#22c55e' }}>
                    {Math.max(...historyData.cpu, 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>峰值CPU</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f97316' }}>
                    {Math.min(...historyData.cpu, 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>最低CPU</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#1e293b',
        borderTop: '1px solid #334155',
        fontSize: 12,
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>CPU: {systemInfo.cpuUsage.toFixed(1)}%</span>
          <span>内存: {systemInfo.memoryUsage.toFixed(1)}%</span>
          <span>进程: {processes.length}</span>
        </div>
        <div>
          更新间隔: 1秒
        </div>
      </div>
    </div>
  )
})

export default SystemMonitor