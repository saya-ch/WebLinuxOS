import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useStore } from '../store'

interface ResourceData {
  cpu: number
  memory: number
  disk: number
  timestamp: number
}

interface OptimizationSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
}

interface CleanupTask {
  id: string
  name: string
  description: string
  size: string
  completed: boolean
}

interface HealthScore {
  overall: number
  cpu: number
  memory: number
  disk: number
}

const SystemOptimizer = memo(function SystemOptimizer() {
  const theme = useStore((s) => s.theme)
  const [activeTab, setActiveTab] = useState<'overview' | 'optimize' | 'cleanup' | 'health'>('overview')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [cleanupTasks, setCleanupTasks] = useState<CleanupTask[]>([
    { id: '1', name: '系统缓存', description: '清理系统临时缓存文件', size: '256 MB', completed: false },
    { id: '2', name: '浏览器缓存', description: '清理浏览器缓存数据', size: '128 MB', completed: false },
    { id: '3', name: '日志文件', description: '清理过期日志文件', size: '64 MB', completed: false },
    { id: '4', name: '临时文件', description: '清理系统临时文件', size: '32 MB', completed: false },
    { id: '5', name: '下载缓存', description: '清理下载目录缓存', size: '48 MB', completed: false },
  ])
  const [resourceData, setResourceData] = useState<ResourceData[]>([])
  const [currentResources, setCurrentResources] = useState<ResourceData>({
    cpu: 35,
    memory: 45,
    disk: 60,
    timestamp: Date.now()
  })
  const [healthScore, setHealthScore] = useState<HealthScore>({
    overall: 85,
    cpu: 90,
    memory: 80,
    disk: 75
  })
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maxDataPoints = 60

  // 生成资源数据
  const generateResourceData = useCallback((): ResourceData => {
    return {
      cpu: 20 + Math.random() * 40 + (Math.sin(Date.now() / 5000) * 10),
      memory: 40 + Math.random() * 20 + (Math.cos(Date.now() / 4000) * 5),
      disk: 55 + Math.random() * 10,
      timestamp: Date.now()
    }
  }, [])

  // 计算健康评分
  const calculateHealthScore = useCallback((cpu: number, memory: number, disk: number): HealthScore => {
    const cpuScore = Math.max(0, 100 - cpu)
    const memoryScore = Math.max(0, 100 - memory)
    const diskScore = Math.max(0, 100 - disk)
    const overall = Math.round((cpuScore * 0.4 + memoryScore * 0.35 + diskScore * 0.25))
    
    return { overall, cpu: cpuScore, memory: memoryScore, disk: diskScore }
  }, [])

  // 生成优化建议
  const generateSuggestions = useCallback((cpu: number, memory: number, disk: number) => {
    const newSuggestions: OptimizationSuggestion[] = []
    
    if (cpu > 60) {
      newSuggestions.push({
        id: '1',
        priority: 'high',
        title: 'CPU 使用率偏高',
        description: '当前CPU负载较高，建议关闭不必要的后台进程',
        action: '优化进程'
      })
    }
    
    if (memory > 70) {
      newSuggestions.push({
        id: '2',
        priority: 'high',
        title: '内存占用过大',
        description: '内存使用接近上限，建议释放内存空间',
        action: '释放内存'
      })
    }
    
    if (disk > 80) {
      newSuggestions.push({
        id: '3',
        priority: 'medium',
        title: '磁盘空间不足',
        description: '磁盘使用率较高，建议清理无用文件',
        action: '清理磁盘'
      })
    }
    
    if (newSuggestions.length === 0) {
      newSuggestions.push({
        id: '4',
        priority: 'low',
        title: '系统状态良好',
        description: '当前系统资源使用正常，保持定期维护即可',
        action: '保持现状'
      })
    }
    
    setSuggestions(newSuggestions)
  }, [])

  // 初始化数据
  useEffect(() => {
    const initialData: ResourceData[] = []
    for (let i = 0; i < 30; i++) {
      initialData.push(generateResourceData())
    }
    setResourceData(initialData)
    const initialResource = generateResourceData()
    setCurrentResources(initialResource)
    setHealthScore(calculateHealthScore(initialResource.cpu, initialResource.memory, initialResource.disk))
    generateSuggestions(initialResource.cpu, initialResource.memory, initialResource.disk)
  }, [generateResourceData, calculateHealthScore, generateSuggestions])

  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateResourceData()
      setCurrentResources(newData)
      setResourceData(prev => [...prev.slice(-(maxDataPoints - 1)), newData])
      setHealthScore(calculateHealthScore(newData.cpu, newData.memory, newData.disk))
      generateSuggestions(newData.cpu, newData.memory, newData.disk)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [generateResourceData, calculateHealthScore, generateSuggestions])

  // 绘制图表
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || resourceData.length < 2) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    const padding = 30
    
    ctx.clearRect(0, 0, width, height)
    
    // 背景
    const bgColor = theme === 'light' ? '#f8f9fa' : '#1e293b'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
    
    // 网格线
    const gridColor = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * (i / 4)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }
    
    // 绘制线条
    const drawLine = (data: number[], color: string, fillColor: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      
      data.forEach((value, i) => {
        const x = padding + (i / (maxDataPoints - 1)) * (width - 2 * padding)
        const y = height - padding - (value / 100) * (height - 2 * padding)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      
      // 填充区域
      ctx.fillStyle = fillColor
      ctx.beginPath()
      data.forEach((value, i) => {
        const x = padding + (i / (maxDataPoints - 1)) * (width - 2 * padding)
        const y = height - padding - (value / 100) * (height - 2 * padding)
        if (i === 0) ctx.moveTo(x, height - padding)
        ctx.lineTo(x, y)
      })
      ctx.lineTo(width - padding, height - padding)
      ctx.closePath()
      ctx.fill()
    }
    
    const cpuData = resourceData.map(r => r.cpu)
    const memoryData = resourceData.map(r => r.memory)
    const diskData = resourceData.map(r => r.disk)
    
    drawLine(cpuData, '#3b82f6', 'rgba(59, 130, 246, 0.1)')
    drawLine(memoryData, '#8b5cf6', 'rgba(139, 92, 246, 0.1)')
    drawLine(diskData, '#10b981', 'rgba(16, 185, 129, 0.1)')
    
    // Y轴标签
    ctx.fillStyle = theme === 'light' ? '#666' : '#94a3b8'
    ctx.font = '11px system-ui'
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * (i / 4)
      ctx.fillText(`${100 - i * 25}%`, 5, y + 4)
    }
  }, [resourceData, theme])

  // 模拟清理操作
  const handleCleanup = useCallback((taskId: string) => {
    setIsOptimizing(true)
    
    setTimeout(() => {
      setCleanupTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      ))
      setIsOptimizing(false)
    }, 1500)
  }, [])

  // 执行一键优化
  const handleFullOptimize = useCallback(() => {
    setIsOptimizing(true)
    
    let completedCount = 0
    const totalTasks = cleanupTasks.filter(t => !t.completed).length
    
    cleanupTasks.forEach((task, index) => {
      if (!task.completed) {
        setTimeout(() => {
          setCleanupTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, completed: true } : t
          ))
          completedCount++
          
          if (completedCount === totalTasks) {
            setIsOptimizing(false)
            // 优化后降低资源使用
            setCurrentResources(prev => ({
              ...prev,
              cpu: Math.max(15, prev.cpu - 20),
              memory: Math.max(30, prev.memory - 15),
              timestamp: Date.now()
            }))
          }
        }, (index + 1) * 800)
      }
    })
    
    if (totalTasks === 0) {
      setIsOptimizing(false)
    }
  }, [cleanupTasks])

  // 获取颜色
  const getStatusColor = useCallback((value: number) => {
    if (value < 50) return '#22c55e'
    if (value < 75) return '#f59e0b'
    return '#ef4444'
  }, [])

  const getHealthColor = useCallback((score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
    if (priority === 'high') return '#ef4444'
    if (priority === 'medium') return '#f59e0b'
    return '#22c55e'
  }, [])

  const bgMain = theme === 'light' ? '#f8fafc' : '#0f172a'
  const bgCard = theme === 'light' ? '#ffffff' : '#1e293b'
  const bgCardHover = theme === 'light' ? '#f1f5f9' : '#334155'
  const textPrimary = theme === 'light' ? '#1e293b' : '#f1f5f9'
  const textSecondary = theme === 'light' ? '#64748b' : '#94a3b8'
  const borderColor = theme === 'light' ? '#e2e8f0' : '#334155'

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: bgMain,
      color: textPrimary,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        padding: '16px 20px',
        background: bgCard,
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>⚡</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>系统资源优化器</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: textSecondary }}>
              智能优化 · 实时监控 · 一键清理
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: getHealthColor(healthScore.overall) }}>
              {healthScore.overall}
            </span>
            <span style={{ fontSize: '12px', color: textSecondary }}>健康评分</span>
          </div>
          {isOptimizing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#3b82f6'
            }}>
              <span className="optimizing-spinner">⏳</span>
              正在优化...
            </div>
          )}
        </div>
      </div>

      {/* 标签导航 */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: `1px solid ${borderColor}`,
        background: bgCard
      }}>
        {([
          { id: 'overview', label: '资源监控', icon: '📊' },
          { id: 'optimize', label: '优化建议', icon: '💡' },
          { id: 'cleanup', label: '清理工具', icon: '🧹' },
          { id: 'health', label: '健康评分', icon: '❤️' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.id ? bgCardHover : 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : textSecondary,
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 500,
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* 资源监控 */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 资源卡片 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16
            }}>
              {[
                { label: 'CPU 使用率', value: currentResources.cpu, icon: '🖥️', unit: '%', color: '#3b82f6' },
                { label: '内存使用', value: currentResources.memory, icon: '🧠', unit: '%', color: '#8b5cf6' },
                { label: '磁盘使用', value: currentResources.disk, icon: '💾', unit: '%', color: '#10b981' }
              ].map((resource, i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    background: bgCard,
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '32px' }}>{resource.icon}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: getStatusColor(resource.value)
                      }}>
                        {resource.value.toFixed(1)}{resource.unit}
                      </div>
                      <div style={{ fontSize: '12px', color: textSecondary, marginTop: 4 }}>
                        {resource.label}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    marginTop: 16,
                    height: 6,
                    background: theme === 'light' ? '#e2e8f0' : '#334155',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${resource.value}%`,
                      background: `linear-gradient(90deg, ${resource.color}, ${resource.color}88)`,
                      borderRadius: 3,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 实时图表 */}
            <div style={{
              padding: 20,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>📈 实时资源趋势</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: 2 }} />
                    CPU
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '3px', background: '#8b5cf6', borderRadius: 2 }} />
                    内存
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: 2 }} />
                    磁盘
                  </span>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={800}
                height={180}
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 12,
                fontSize: '11px',
                color: textSecondary
              }}>
                <span>60秒前</span>
                <span>30秒前</span>
                <span>现在</span>
              </div>
            </div>

            {/* 系统信息 */}
            <div style={{
              padding: 20,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>💻 系统信息</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                fontSize: 13
              }}>
                {[
                  { label: '系统版本', value: 'WebLinuxOS 5.5.0' },
                  { label: '内核版本', value: 'WebKernel 2.0' },
                  { label: '处理器', value: 'Virtual CPU @ 2.4GHz' },
                  { label: '总内存', value: '8 GB RAM' },
                  { label: '运行时间', value: `${Math.floor(performance.now() / 1000 / 60)} 分钟` },
                  { label: '活跃进程', value: `${Math.floor(Math.random() * 20 + 80)} 个` }
                ].map((info, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: bgCardHover,
                    borderRadius: 6
                  }}>
                    <span style={{ color: textSecondary }}>{info.label}</span>
                    <span style={{ fontWeight: 500 }}>{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 优化建议 */}
        {activeTab === 'optimize' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 一键优化 */}
            <div style={{
              padding: 24,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`,
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '48px' }}>🚀</span>
              <h3 style={{ margin: '16px 0 8px 0', fontSize: '18px', fontWeight: 600 }}>一键智能优化</h3>
              <p style={{ margin: '0 0 20px 0', color: textSecondary, fontSize: '14px' }}>
                自动分析系统状态并执行最优优化方案
              </p>
              <button
                onClick={handleFullOptimize}
                disabled={isOptimizing}
                style={{
                  padding: '12px 32px',
                  background: isOptimizing ? textSecondary : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: isOptimizing ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease'
                }}
              >
                {isOptimizing ? '⏳ 正在优化...' : '⚡ 开始优化'}
              </button>
            </div>

            {/* 优化建议列表 */}
            <div style={{
              padding: 20,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>💡 优化建议</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    style={{
                      padding: 16,
                      background: bgCardHover,
                      borderRadius: 8,
                      border: `1px solid ${getPriorityColor(suggestion.priority)}30`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{suggestion.title}</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: `${getPriorityColor(suggestion.priority)}20`,
                        color: getPriorityColor(suggestion.priority),
                        fontWeight: 600
                      }}>
                        {suggestion.priority === 'high' ? '高优先' : 
                         suggestion.priority === 'medium' ? '中优先' : '低优先'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: textSecondary }}>
                      {suggestion.description}
                    </p>
                    <button
                      style={{
                        padding: '6px 14px',
                        background: bgCard,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 6,
                        color: textPrimary,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      {suggestion.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 清理工具 */}
        {activeTab === 'cleanup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 清理统计 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16
            }}>
              <div style={{
                padding: 16,
                background: bgCard,
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', color: '#3b82f6' }}>
                  {cleanupTasks.filter(t => t.completed).length}
                </div>
                <div style={{ fontSize: '12px', color: textSecondary, marginTop: 4 }}>
                  已完成清理
                </div>
              </div>
              <div style={{
                padding: 16,
                background: bgCard,
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', color: '#f59e0b' }}>
                  {cleanupTasks.filter(t => !t.completed).length}
                </div>
                <div style={{ fontSize: '12px', color: textSecondary, marginTop: 4 }}>
                  待清理项目
                </div>
              </div>
              <div style={{
                padding: 16,
                background: bgCard,
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', color: '#22c55e' }}>
                  {cleanupTasks.reduce((acc, t) => acc + (t.completed ? parseInt(t.size) : 0), 0)} MB
                </div>
                <div style={{ fontSize: '12px', color: textSecondary, marginTop: 4 }}>
                  已释放空间
                </div>
              </div>
            </div>

            {/* 清理任务列表 */}
            <div style={{
              padding: 20,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>🧹 清理任务</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cleanupTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      background: task.completed ? `${bgCardHover}` : bgCardHover,
                      borderRadius: 8,
                      opacity: task.completed ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: task.completed ? '#22c55e' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#fff'
                      }}>
                        {task.completed ? '✓' : '○'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{task.name}</div>
                        <div style={{ fontSize: '12px', color: textSecondary }}>{task.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        padding: '4px 10px',
                        background: bgCard,
                        borderRadius: 6,
                        fontSize: 12,
                        color: textSecondary
                      }}>
                        {task.size}
                      </span>
                      {!task.completed && (
                        <button
                          onClick={() => handleCleanup(task.id)}
                          disabled={isOptimizing}
                          style={{
                            padding: '6px 14px',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 6,
                            color: '#fff',
                            cursor: isOptimizing ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 500
                          }}
                        >
                          清理
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 重置按钮 */}
            <button
              onClick={() => setCleanupTasks(prev => prev.map(t => ({ ...t, completed: false })))}
              style={{
                padding: '10px 20px',
                background: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                color: textSecondary,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                alignSelf: 'center'
              }}
            >
              重置清理状态
            </button>
          </div>
        )}

        {/* 健康评分 */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 总体评分 */}
            <div style={{
              padding: 32,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`,
              textAlign: 'center'
            }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: `conic-gradient(${getHealthColor(healthScore.overall)} ${healthScore.overall}%, ${bgCardHover} ${healthScore.overall}%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                position: 'relative'
              }}>
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: bgCard,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    color: getHealthColor(healthScore.overall)
                  }}>
                    {healthScore.overall}
                  </span>
                  <span style={{ fontSize: '12px', color: textSecondary }}>分</span>
                </div>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
                系统健康状态
              </h3>
              <p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>
                {healthScore.overall >= 80 ? '系统运行良好，各项指标正常' :
                 healthScore.overall >= 60 ? '系统状态一般，建议进行优化' :
                 '系统状态较差，需要立即优化'}
              </p>
            </div>

            {/* 各项评分 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16
            }}>
              {[
                { label: 'CPU 健康', score: healthScore.cpu, icon: '🖥️', desc: '处理器性能状态' },
                { label: '内存健康', score: healthScore.memory, icon: '🧠', desc: '内存使用状态' },
                { label: '磁盘健康', score: healthScore.disk, icon: '💾', desc: '存储空间状态' }
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    background: bgCard,
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{item.icon}</span>
                  <div style={{
                    marginTop: 12,
                    fontSize: '24px',
                    fontWeight: 700,
                    color: getHealthColor(item.score)
                  }}>
                    {item.score}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: 8 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary, marginTop: 4 }}>
                    {item.desc}
                  </div>
                  <div style={{
                    marginTop: 12,
                    height: 4,
                    background: bgCardHover,
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${item.score}%`,
                      background: getHealthColor(item.score),
                      borderRadius: 2
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 健康建议 */}
            <div style={{
              padding: 20,
              background: bgCard,
              borderRadius: 12,
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>📋 健康改善建议</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {healthScore.cpu < 70 && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 8,
                    fontSize: '13px'
                  }}>
                    ⚡ CPU 健康度偏低，建议减少后台进程数量
                  </div>
                )}
                {healthScore.memory < 70 && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: 8,
                    fontSize: '13px'
                  }}>
                    🧠 内存健康度偏低，建议清理缓存释放空间
                  </div>
                )}
                {healthScore.disk < 70 && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 8,
                    fontSize: '13px'
                  }}>
                    💾 磁盘健康度偏低，建议清理无用文件
                  </div>
                )}
                {healthScore.overall >= 80 && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 8,
                    fontSize: '13px'
                  }}>
                    ✅ 系统整体健康状态良好，继续保持即可
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: bgCard,
        borderTop: `1px solid ${borderColor}`,
        fontSize: '12px',
        color: textSecondary
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            实时监控中
          </span>
          <span>CPU: {currentResources.cpu.toFixed(1)}%</span>
          <span>内存: {currentResources.memory.toFixed(1)}%</span>
          <span>磁盘: {currentResources.disk.toFixed(1)}%</span>
        </div>
        <div>
          更新频率: 1秒/次
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        .optimizing-spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default SystemOptimizer