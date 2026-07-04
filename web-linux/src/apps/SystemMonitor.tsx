import { useState, useEffect, useCallback, useRef, memo } from 'react'

interface SystemInfo {
  cpuUsage: number
  memoryUsage: number
  memoryUsed: number
  memoryTotal: number
  diskUsage: number
  networkLatency: number
  networkDownload: number
  networkUpload: number
  networkStatus: 'online' | 'offline' | 'slow'
  fps: number
  jsHeapUsed: number
  jsHeapTotal: number
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
    memoryUsed: 3.2,
    memoryTotal: 8,
    diskUsage: 60,
    networkLatency: 50,
    networkDownload: 0,
    networkUpload: 0,
    networkStatus: 'online',
    fps: 60,
    jsHeapUsed: 0,
    jsHeapTotal: 0,
  })
  
  const [processes, setProcesses] = useState<Process[]>(mockProcesses)
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'processes' | 'performance'>('overview')
  const [historyData, setHistoryData] = useState<{ cpu: number[]; memory: number[]; fps: number[]; latency: number[] }>({
    cpu: [],
    memory: [],
    fps: [],
    latency: []
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const fpsRef = useRef(60)

  const getMemoryInfo = useCallback((): { used: number; total: number; percent: number } => {
    const performanceMemory = (window.performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    
    if (performanceMemory) {
      const usedMB = performanceMemory.usedJSHeapSize / (1024 * 1024)
      const limitMB = performanceMemory.jsHeapSizeLimit / (1024 * 1024)
      return {
        used: usedMB,
        total: limitMB,
        percent: (usedMB / limitMB) * 100
      }
    }
    
    const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8
    return {
      used: deviceMemory * 0.4,
      total: deviceMemory,
      percent: 40
    }
  }, [])

  const measureFPS = useCallback(() => {
    frameCountRef.current++
    const currentTime = performance.now()
    
    if (currentTime - lastTimeRef.current >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current))
      frameCountRef.current = 0
      lastTimeRef.current = currentTime
    }
    
    requestAnimationFrame(measureFPS)
  }, [])

  const measureNetworkLatency = useCallback(async (): Promise<{ latency: number; status: 'online' | 'offline' | 'slow' }> => {
    const startTime = performance.now()
    try {
      await fetch('https://api.github.com/repos/saya-ch/WebLinuxOS', {
        method: 'HEAD',
        cache: 'no-store'
      })
      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)
      
      const status: 'online' | 'offline' | 'slow' = latency > 500 ? 'slow' : 'online'
      
      return { latency, status }
    } catch {
      return { latency: 999, status: 'offline' }
    }
  }, [])

  const measureNetworkSpeed = useCallback(async () => {
    const startTime = performance.now()
    try {
      const response = await fetch('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', {
        cache: 'no-store'
      })
      const blob = await response.blob()
      const endTime = performance.now()
      const duration = (endTime - startTime) / 1000
      const bytes = blob.size
      const speedMbps = (bytes * 8 / 1024 / 1024 / duration).toFixed(2)
      
      return parseFloat(speedMbps)
    } catch {
      return 0
    }
  }, [])
  
  useEffect(() => {
    requestAnimationFrame(measureFPS)
  }, [measureFPS])
  
  useEffect(() => {
    const interval = setInterval(() => {
      const memInfo = getMemoryInfo()
      
      setSystemInfo(prev => {
        const newCpuUsage = Math.max(5, Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 10))
        const newMemoryUsage = Math.max(20, Math.min(90, memInfo.percent + (Math.random() - 0.5) * 5))
        
        setHistoryData(hPrev => ({
          cpu: [...hPrev.cpu.slice(-30), newCpuUsage],
          memory: [...hPrev.memory.slice(-30), newMemoryUsage],
          fps: [...hPrev.fps.slice(-30), fpsRef.current],
          latency: [...hPrev.latency.slice(-30), prev.networkLatency]
        }))
        
        return {
          ...prev,
          cpuUsage: newCpuUsage,
          memoryUsage: newMemoryUsage,
          memoryUsed: parseFloat(memInfo.used.toFixed(1)),
          memoryTotal: parseFloat(memInfo.total.toFixed(1)),
          jsHeapUsed: parseFloat((memInfo.used / 1024).toFixed(2)),
          jsHeapTotal: parseFloat((memInfo.total / 1024).toFixed(2)),
          fps: fpsRef.current,
        }
      })
      
      setProcesses(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0, Math.min(100, p.cpu + (Math.random() - 0.5) * 5)),
        memory: Math.max(5, p.memory + (Math.random() - 0.5) * 10)
      })))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [getMemoryInfo])

  useEffect(() => {
    const checkNetwork = async () => {
      const { latency, status } = await measureNetworkLatency()
      const downloadSpeed = await measureNetworkSpeed()
      
      setSystemInfo(prev => ({
        ...prev,
        networkLatency: latency,
        networkDownload: downloadSpeed,
        networkUpload: downloadSpeed * 0.3,
        networkStatus: status
      }))
    }

    checkNetwork()
    const networkInterval = setInterval(checkNetwork, 10000)
    
    return () => clearInterval(networkInterval)
  }, [measureNetworkLatency, measureNetworkSpeed])

  useEffect(() => {
    const handleOnline = () => {
      setSystemInfo(prev => ({ ...prev, networkStatus: 'online' }))
    }
    const handleOffline = () => {
      setSystemInfo(prev => ({ ...prev, networkStatus: 'offline', networkLatency: 999 }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
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
    if (data.length < 2) return null
    
    const max = Math.max(...data, 100)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((v - min) / range) * 100
      return `${x},${y}`
    }).join(' ')
    
    return (
      <svg style={{ width: '100%', height: 60 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill={`url(#gradient-${color.replace('#', '')})`}
          stroke={color}
          strokeWidth="2"
          points={`0,100 ${points} 100,100`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }, [])

  const hardwareConcurrency = (navigator as unknown as { hardwareConcurrency?: number }).hardwareConcurrency || 4
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
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
      
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {viewMode === 'overview' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              marginBottom: 24
            }}>
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
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  逻辑核心: {hardwareConcurrency}
                </div>
              </div>
              
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
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  已用: {systemInfo.memoryUsed.toFixed(1)} GB / {systemInfo.memoryTotal.toFixed(1)} GB
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 16
            }}>
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: systemInfo.networkLatency > 500 ? '#ef4444' : systemInfo.networkLatency > 200 ? '#eab308' : '#22c55e' }}>
                  {systemInfo.networkLatency}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>ms</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>网络延迟</div>
              </div>
              
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: '#3b82f6' }}>
                  {systemInfo.networkDownload > 0 ? systemInfo.networkDownload.toFixed(2) : '--'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Mbps</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>下载速度</div>
              </div>
              
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: '#8b5cf6' }}>
                  {systemInfo.networkUpload > 0 ? systemInfo.networkUpload.toFixed(2) : '--'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Mbps</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>上传速度</div>
              </div>
              
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
                <div style={{ fontSize: 14, color: '#64748b' }}>实时帧率</div>
              </div>
              
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
              
              <div style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, color: '#f97316' }}>
                  {systemInfo.jsHeapUsed > 0 ? systemInfo.jsHeapUsed.toFixed(2) : '--'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>GB</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>JS堆内存</div>
              </div>
            </div>
            
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
                  <span>WebLinuxOS 9.2.0</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>浏览器: </span>
                  <span>{navigator.userAgent.split(' ').slice(-1)[0]}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>处理器: </span>
                  <span>{hardwareConcurrency} 核心 Virtual CPU</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>内存: </span>
                  <span>{deviceMemory} GB RAM</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>运行时间: </span>
                  <span>{Math.floor(performance.now() / 1000 / 60)} 分钟</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>进程数: </span>
                  <span>{processes.length}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>屏幕分辨率: </span>
                  <span>{window.screen.width} x {window.screen.height}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>语言: </span>
                  <span>{navigator.language}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {viewMode === 'processes' && (
          <div>
            <div style={{
              background: '#1e293b',
              borderRadius: 12,
              border: '1px solid #334155',
              overflow: 'hidden'
            }}>
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
                      {process.status === 'running' ? '运行中' : process.status === 'idle' ? '空闲' : '已停止'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
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
            <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16
          }}>
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
              
              <div style={{
                padding: 20,
                background: '#1e293b',
                borderRadius: 12,
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>帧率历史</div>
                <div style={{ height: 150 }}>
                  {renderMiniGraph(historyData.fps, '#22c55e')}
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
              
              <div style={{
                padding: 20,
                background: '#1e293b',
                borderRadius: 12,
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>网络延迟历史</div>
                <div style={{ height: 150 }}>
                  {renderMiniGraph(historyData.latency, '#f97316')}
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
                gridTemplateColumns: 'repeat(6, 1fr)',
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
                    {historyData.fps.length > 0 ? (historyData.fps.reduce((a, b) => a + b, 0) / historyData.fps.length).toFixed(1) : 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>平均FPS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
                    {Math.max(...historyData.cpu, 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>峰值CPU</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f97316' }}>
                    {Math.max(...historyData.memory, 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>峰值内存</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#eab308' }}>
                    {Math.min(...historyData.fps, 100).toFixed(0)}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>最低FPS</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
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
          <span>FPS: {systemInfo.fps}</span>
        </div>
        <div>
          实时更新
        </div>
      </div>
    </div>
  )
})

export default SystemMonitor