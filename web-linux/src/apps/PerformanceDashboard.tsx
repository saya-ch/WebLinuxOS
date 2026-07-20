import { useState, useEffect, useCallback, useMemo } from 'react'
import { ActivityIcon, CpuIcon, HardDriveIcon, WifiIcon, ClockIcon, TrendingUpIcon, AlertTriangleIcon } from '../icons'

interface PerformanceMetrics {
  fps: number
  memoryUsed: number
  memoryTotal: number
  cpuCores: number
  networkLatency: number
  storageUsed: number
  storageQuota: number
  timestamp: Date
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical'
  message: string
  timestamp: Date
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [history, setHistory] = useState<PerformanceMetrics[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  const measurePerformance = useCallback(async (): Promise<PerformanceMetrics> => {
    const start = performance.now()

    // 测量FPS
    const fps = await new Promise<number>((resolve) => {
      let frameCount = 0
      const startTime = performance.now()
      const countFrames = () => {
        frameCount++
        if (performance.now() - startTime >= 1000) {
          resolve(Math.round(frameCount))
        } else {
          requestAnimationFrame(countFrames)
        }
      }
      requestAnimationFrame(countFrames)
    })

    // 获取内存信息
    const memory = (performance as any).memory
    const memoryUsed = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0
    const memoryTotal = memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : 0

    // CPU核心数
    const cpuCores = navigator.hardwareConcurrency || 1

    // 网络延迟（模拟）
    const networkLatency = Math.round(performance.now() - start)

    // 存储使用情况
    let storageUsed = 0
    let storageQuota = 0
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        storageUsed = Math.round((estimate.usage || 0) / 1024 / 1024)
        storageQuota = Math.round((estimate.quota || 0) / 1024 / 1024)
      } catch (e) {
        // 浏览器不支持
      }
    }

    return {
      fps,
      memoryUsed,
      memoryTotal,
      cpuCores,
      networkLatency,
      storageUsed,
      storageQuota,
      timestamp: new Date()
    }
  }, [])

  const checkForAlerts = useCallback((metrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = []

    // 检查FPS
    if (metrics.fps < 30) {
      newAlerts.push({
        id: `fps-${Date.now()}`,
        type: 'critical',
        message: `FPS过低 (${metrics.fps})，可能影响用户体验`,
        timestamp: new Date()
      })
    } else if (metrics.fps < 50) {
      newAlerts.push({
        id: `fps-warn-${Date.now()}`,
        type: 'warning',
        message: `FPS略低 (${metrics.fps})，建议优化性能`,
        timestamp: new Date()
      })
    }

    // 检查内存
    if (metrics.memoryTotal > 0) {
      const memoryPercent = (metrics.memoryUsed / metrics.memoryTotal) * 100
      if (memoryPercent > 90) {
        newAlerts.push({
          id: `mem-${Date.now()}`,
          type: 'critical',
          message: `内存使用率过高 (${memoryPercent.toFixed(1)}%)，存在内存泄漏风险`,
          timestamp: new Date()
        })
      } else if (memoryPercent > 75) {
        newAlerts.push({
          id: `mem-warn-${Date.now()}`,
          type: 'warning',
          message: `内存使用率偏高 (${memoryPercent.toFixed(1)}%)`,
          timestamp: new Date()
        })
      }
    }

    // 检查存储
    if (metrics.storageQuota > 0) {
      const storagePercent = (metrics.storageUsed / metrics.storageQuota) * 100
      if (storagePercent > 90) {
        newAlerts.push({
          id: `storage-${Date.now()}`,
          type: 'critical',
          message: `存储空间不足 (${storagePercent.toFixed(1)}%)`,
          timestamp: new Date()
        })
      }
    }

    return newAlerts
  }, [])

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(async () => {
      const newMetrics = await measurePerformance()
      setMetrics(newMetrics)
      setHistory(prev => [...prev.slice(-59), newMetrics]) // 保留最近60个数据点

      const newAlerts = checkForAlerts(newMetrics)
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]) // 保留最近5条警告
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isMonitoring, measurePerformance, checkForAlerts])

  useEffect(() => {
    // 初始测量
    measurePerformance().then(setMetrics)
  }, [measurePerformance])

  const formatBytes = (mb: number) => {
    if (mb < 1024) return `${mb} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  const metricsCards = useMemo(() => {
    if (!metrics) return null

    const memoryPercent = metrics.memoryTotal > 0
      ? ((metrics.memoryUsed / metrics.memoryTotal) * 100).toFixed(1)
      : '0'

    const storagePercent = metrics.storageQuota > 0
      ? ((metrics.storageUsed / metrics.storageQuota) * 100).toFixed(1)
      : '0'

    return [
      {
        icon: <ActivityIcon className="w-5 h-5" />,
        title: 'FPS',
        value: metrics.fps,
        unit: '帧/秒',
        color: metrics.fps >= 50 ? 'text-green-500' : metrics.fps >= 30 ? 'text-yellow-500' : 'text-red-500'
      },
      {
        icon: <CpuIcon className="w-5 h-5" />,
        title: 'CPU核心',
        value: metrics.cpuCores,
        unit: '核心',
        color: 'text-blue-500'
      },
      {
        icon: <HardDriveIcon className="w-5 h-5" />,
        title: '内存使用',
        value: `${formatBytes(metrics.memoryUsed)} / ${formatBytes(metrics.memoryTotal)}`,
        subValue: `${memoryPercent}%`,
        color: parseFloat(memoryPercent) > 75 ? 'text-red-500' : 'text-blue-500'
      },
      {
        icon: <WifiIcon className="w-5 h-5" />,
        title: '网络延迟',
        value: metrics.networkLatency,
        unit: 'ms',
        color: metrics.networkLatency < 100 ? 'text-green-500' : 'text-yellow-500'
      },
      {
        icon: <HardDriveIcon className="w-5 h-5" />,
        title: '存储使用',
        value: `${formatBytes(metrics.storageUsed)} / ${formatBytes(metrics.storageQuota)}`,
        subValue: `${storagePercent}%`,
        color: parseFloat(storagePercent) > 75 ? 'text-red-500' : 'text-purple-500'
      },
      {
        icon: <ClockIcon className="w-5 h-5" />,
        title: '监控时长',
        value: history.length,
        unit: '秒',
        color: 'text-gray-500'
      }
    ]
  }, [metrics, history.length])

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 overflow-auto">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUpIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold">性能监控面板</h1>
        </div>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isMonitoring
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isMonitoring ? '停止监控' : '开始监控'}
        </button>
      </div>

      {/* 性能指标卡片 */}
      {metricsCards && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {metricsCards.map((card, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={card.color}>{card.icon}</div>
                <span className="text-sm text-gray-400">{card.title}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </span>
                {card.unit && <span className="text-sm text-gray-400">{card.unit}</span>}
              </div>
              {card.subValue && (
                <div className="text-xs text-gray-500 mt-1">{card.subValue}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 性能警告 */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
            性能警告 ({alerts.length})
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.type === 'critical'
                    ? 'bg-red-900/20 border-red-700 text-red-300'
                    : 'bg-yellow-900/20 border-yellow-700 text-yellow-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4" />
                  <span className="text-sm">{alert.message}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 性能历史图表 */}
      {history.length > 1 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">FPS 历史</h2>
          <div className="h-32 flex items-end gap-1">
            {history.slice(-50).map((m, index) => (
              <div
                key={index}
                className="flex-1 rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${(m.fps / 60) * 100}%`,
                  backgroundColor: m.fps >= 50 ? '#10b981' : m.fps >= 30 ? '#f59e0b' : '#ef4444'
                }}
                title={`FPS: ${m.fps}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{history[0]?.timestamp.toLocaleTimeString()}</span>
            <span>{history[history.length - 1]?.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* 系统信息 */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-3">系统信息</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">浏览器：</span>
            <span>{navigator.userAgent.split(' ').slice(-1)[0]}</span>
          </div>
          <div>
            <span className="text-gray-400">平台：</span>
            <span>{navigator.platform}</span>
          </div>
          <div>
            <span className="text-gray-400">语言：</span>
            <span>{navigator.language}</span>
          </div>
          <div>
            <span className="text-gray-400">在线状态：</span>
            <span className={navigator.onLine ? 'text-green-400' : 'text-red-400'}>
              {navigator.onLine ? '在线' : '离线'}
            </span>
          </div>
        </div>
      </div>

      {/* 性能建议 */}
      <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-700">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUpIcon className="w-5 h-5 text-blue-400" />
          性能优化建议
        </h2>
        <ul className="text-sm space-y-2 text-gray-300">
          <li>• 关闭不使用的应用程序以释放内存</li>
          <li>• 定期清理浏览器缓存和LocalStorage数据</li>
          <li>• 如果FPS持续低于30，建议减少桌面特效</li>
          <li>• 避免同时打开过多窗口（建议不超过10个）</li>
          <li>• 使用Chrome DevTools分析性能瓶颈</li>
        </ul>
      </div>
    </div>
  )
}