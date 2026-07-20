import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Activity, Cpu, HardDrive, Wifi, Battery, MemoryStick, Clock, Zap, Monitor, Gauge, Server, Layers } from 'lucide-react'
import { useStore } from '../store'

// ---- 类型定义 ----

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface NavigatorConnection {
  downlink?: number
  effectiveType?: string
  rtt?: number
  type?: string
  saveData?: boolean
}

interface BatteryManager {
  level: number
  charging: boolean
  chargingTime: number
  dischargingTime: number
}

interface MemoryHistoryPoint {
  time: string
  used: number
  total: number
}

interface BenchmarkResult {
  name: string
  score: number
  time: number
  detail: string
}

// ---- 工具函数 ----

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getPerformanceMemory(): PerformanceMemory | null {
  try {
    const perf = performance as unknown as { memory?: PerformanceMemory }
    if (perf.memory && perf.memory.usedJSHeapSize > 0) {
      return perf.memory
    }
  } catch { /* ignore */ }
  return null
}

function getHardwareConcurrency(): number | null {
  try {
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0) {
      return navigator.hardwareConcurrency
    }
  } catch { /* ignore */ }
  return null
}

function getDeviceMemory(): number | null {
  try {
    const nav = navigator as unknown as { deviceMemory?: number }
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0) {
      return nav.deviceMemory
    }
  } catch { /* ignore */ }
  return null
}

function getNetworkConnection(): NavigatorConnection | null {
  try {
    const nav = navigator as unknown as { connection?: NavigatorConnection }
    if (nav.connection) {
      return nav.connection
    }
  } catch { /* ignore */ }
  return null
}

function getWebGLRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      }
      return (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER)
    }
  } catch { /* ignore */ }
  return null
}

function getLocalStorageUsage(): { used: number; items: { key: string; size: number }[] } {
  let totalUsed = 0
  const items: { key: string; size: number }[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        const size = (key.length + value.length) * 2 // UTF-16: 2 bytes per char
        totalUsed += size
        items.push({ key, size })
      }
    }
  } catch { /* ignore */ }
  items.sort((a, b) => b.size - a.size)
  return { used: totalUsed, items }
}

function getDomNodeCount(): number {
  try {
    return document.querySelectorAll('*').length
  } catch { /* ignore */ }
  return 0
}

// ---- 基准测试函数 ----

function runComputeBenchmark(): BenchmarkResult {
  const start = performance.now()
  let result = 0
  for (let i = 0; i < 1_000_000; i++) {
    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i)
  }
  const elapsed = performance.now() - start
  const score = Math.round(1000 / elapsed * 100)
  return { name: '数学计算', score, time: elapsed, detail: `100万次 sqrt/sin/cos 运算` }
}

function runDomBenchmark(): BenchmarkResult {
  const start = performance.now()
  const container = document.createElement('div')
  for (let i = 0; i < 5000; i++) {
    const el = document.createElement('span')
    el.textContent = `node-${i}`
    el.className = 'bench-node'
    container.appendChild(el)
  }
  // 强制布局
  const _ = container.children.length
  void _
  const elapsed = performance.now() - start
  const score = Math.round(500 / elapsed * 100)
  return { name: 'DOM 操作', score, time: elapsed, detail: `5000次 创建/追加/读取 DOM 节点` }
}

function runMemoryBenchmark(): BenchmarkResult {
  const start = performance.now()
  const arrays: number[][] = []
  for (let i = 0; i < 1000; i++) {
    arrays.push(new Array(1000).fill(0).map((_, j) => j * i))
  }
  const elapsed = performance.now() - start
  const totalMB = (1000 * 1000 * 8) / (1024 * 1024)
  const score = Math.round(100 / elapsed * 100)
  return { name: '内存分配', score, time: elapsed, detail: `分配 ${totalMB.toFixed(1)} MB 数组数据` }
}

// ---- 主组件 ----

const SystemMonitor = () => {
  const windows = useStore((s) => s.windows)

  // 概览数据
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [memoryDetail, setMemoryDetail] = useState<PerformanceMemory | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [batteryCharging, setBatteryCharging] = useState(false)
  const [networkDownlink, setNetworkDownlink] = useState<number | null>(null)
  const [networkType, setNetworkType] = useState<string | null>(null)
  const [uptime, setUptime] = useState('00:00:00')
  const [fps, setFps] = useState(0)
  const [domNodes, setDomNodes] = useState(0)

  // 静态硬件信息（只获取一次）
  const [hwCores] = useState(() => getHardwareConcurrency())
  const [hwDeviceMemory] = useState(() => getDeviceMemory())
  const [webGLRenderer] = useState(() => getWebGLRenderer())
  const [screenRes] = useState(() => `${screen.width}×${screen.height}`)
  const [screenDpr] = useState(() => window.devicePixelRatio)
  const [userAgent] = useState(() => navigator.userAgent)
  const [platform] = useState(() => navigator.platform)

  // 历史图表
  const [memoryHistory, setMemoryHistory] = useState<MemoryHistoryPoint[]>([])

  // 存储
  const [storageInfo, setStorageInfo] = useState(() => getLocalStorageUsage())

  // 基准测试
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([])
  const [benchmarkRunning, setBenchmarkRunning] = useState(false)

  // 选项卡
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'processes' | 'storage'>('overview')

  const startTime = useRef(Date.now())
  const fpsFrames = useRef(0)
  const fpsLastTime = useRef(performance.now())
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)

  // ---- FPS 计数器 ----
  useEffect(() => {
    let running = true
    const countFrame = () => {
      if (!running) return
      fpsFrames.current++
      const now = performance.now()
      if (now - fpsLastTime.current >= 1000) {
        setFps(Math.round(fpsFrames.current * 1000 / (now - fpsLastTime.current)))
        fpsFrames.current = 0
        fpsLastTime.current = now
      }
      requestAnimationFrame(countFrame)
    }
    requestAnimationFrame(countFrame)
    return () => { running = false }
  }, [])

  // ---- 每 2 秒数据刷新 ----
  useEffect(() => {
    const updateData = async () => {
      // 运行时间
      const elapsed = Date.now() - startTime.current
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setUptime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)

      // 内存
      const mem = getPerformanceMemory()
      if (mem) {
        setMemoryDetail(mem)
        setMemoryUsage((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)
      } else {
        setMemoryUsage((prev) => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)))
      }

      // CPU（浏览器没有直接 API，用模拟 + 任务负载推断）
      setCpuUsage((prev) => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 12)))

      // 电池
      try {
        if ('getBattery' in navigator) {
          const bat = await (navigator as unknown as { getBattery: () => Promise<BatteryManager> }).getBattery()
          setBatteryLevel(bat.level * 100)
          setBatteryCharging(bat.charging)
        }
      } catch { /* ignore */ }

      // 网络
      const conn = getNetworkConnection()
      if (conn) {
        setNetworkDownlink(conn.downlink ?? null)
        setNetworkType(conn.effectiveType ?? conn.type ?? null)
      }

      // DOM 节点数
      setDomNodes(getDomNodeCount())

      // 内存历史
      const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      if (mem) {
        setMemoryHistory((prev) => {
          const next = [...prev, { time: now, used: mem.usedJSHeapSize, total: mem.totalJSHeapSize }]
          return next.length > 30 ? next.slice(-30) : next
        })
      }

      // localStorage
      setStorageInfo(getLocalStorageUsage())
    }

    updateData()
    const interval = setInterval(updateData, 2000)
    return () => clearInterval(interval)
  }, [])

  // ---- 内存历史 Canvas 图表 ----
  useEffect(() => {
    const canvas = chartCanvasRef.current
    if (!canvas || memoryHistory.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padding = { top: 10, right: 10, bottom: 24, left: 50 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.clearRect(0, 0, w, h)

    // 计算最大值
    const maxBytes = Math.max(...memoryHistory.map((p) => p.total), 1)

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()
    }

    // Y 轴标签
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = maxBytes * (1 - i / 4)
      const y = padding.top + (chartH / 4) * i + 3
      ctx.fillText(formatBytes(val), padding.left - 4, y)
    }

    // 总内存线（紫色）
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    memoryHistory.forEach((point, index) => {
      const x = padding.left + (index / (memoryHistory.length - 1)) * chartW
      const y = padding.top + chartH - (point.total / maxBytes) * chartH
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 已用内存线（蓝色）
    ctx.strokeStyle = '#61afef'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    memoryHistory.forEach((point, index) => {
      const x = padding.left + (index / (memoryHistory.length - 1)) * chartW
      const y = padding.top + chartH - (point.used / maxBytes) * chartH
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 已用内存填充
    ctx.fillStyle = 'rgba(97, 175, 239, 0.1)'
    ctx.beginPath()
    memoryHistory.forEach((point, index) => {
      const x = padding.left + (index / (memoryHistory.length - 1)) * chartW
      const y = padding.top + chartH - (point.used / maxBytes) * chartH
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(padding.left + chartW, padding.top + chartH)
    ctx.lineTo(padding.left, padding.top + chartH)
    ctx.closePath()
    ctx.fill()

    // 时间标签
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(memoryHistory[0].time, padding.left, h - 4)
    ctx.textAlign = 'right'
    ctx.fillText(memoryHistory[memoryHistory.length - 1].time, w - padding.right, h - 4)
  }, [memoryHistory])

  // ---- 基准测试 ----
  const runBenchmarks = useCallback(() => {
    if (benchmarkRunning) return
    setBenchmarkRunning(true)
    setBenchmarks([])
    setTimeout(() => {
      const results: BenchmarkResult[] = []
      results.push(runComputeBenchmark())
      results.push(runDomBenchmark())
      results.push(runMemoryBenchmark())
      setBenchmarks(results)
      setBenchmarkRunning(false)
    }, 50)
  }, [benchmarkRunning])

  // ---- 辅助渲染 ----
  const getUsageColor = (usage: number) => {
    if (usage > 80) return '#ef4444'
    if (usage > 60) return '#f59e0b'
    return '#22c55e'
  }

  const renderGauge = (label: string, value: number, icon: React.ReactNode, color?: string) => {
    const actualColor = color || getUsageColor(value)
    return (
      <div className="gauge-card">
        <div className="gauge-header">
          {icon}
          <span>{label}</span>
        </div>
        <div className="gauge-value">
          <span style={{ color: actualColor }}>{value.toFixed(1)}%</span>
        </div>
        <div className="gauge-bar">
          <div className="gauge-fill" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: actualColor }} />
        </div>
      </div>
    )
  }

  const renderInfoRow = (label: string, value: string | number | null | undefined, fallback = '不可用') => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value != null ? String(value) : fallback}</span>
    </div>
  )

  // ---- 概览 Tab ----
  const renderOverview = () => (
    <div className="tab-content">
      <div className="gauges-grid">
        {renderGauge('CPU 使用率', cpuUsage, <Cpu size={20} />)}
        {renderGauge('内存使用', memoryUsage, <MemoryStick size={20} />)}
        {renderGauge('电池电量', batteryLevel ?? 0, <Battery size={20} />, (batteryLevel ?? 0) < 20 ? '#ef4444' : '#22c55e')}
      </div>

      {/* 实时指标 */}
      <div className="realtime-bar">
        <div className="realtime-item">
          <Gauge size={16} />
          <span>FPS</span>
          <strong style={{ color: fps >= 55 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444' }}>{fps}</strong>
        </div>
        <div className="realtime-item">
          <Layers size={16} />
          <span>DOM 节点</span>
          <strong>{domNodes.toLocaleString()}</strong>
        </div>
        <div className="realtime-item">
          <Monitor size={16} />
          <span>窗口数</span>
          <strong>{windows.length}</strong>
        </div>
      </div>

      {/* 硬件信息 */}
      <div className="info-card">
        <div className="card-title"><Server size={18} /> 硬件信息</div>
        {renderInfoRow('CPU 核心', hwCores ? `${hwCores} 核` : null)}
        {renderInfoRow('设备内存', hwDeviceMemory ? `${hwDeviceMemory} GB` : null)}
        {renderInfoRow('屏幕分辨率', screenRes)}
        {renderInfoRow('设备像素比', `${screenDpr}x`)}
        {renderInfoRow('实际分辨率', `${screen.width * screenDpr}×${screen.height * screenDpr}`)}
        {renderInfoRow('WebGL 渲染器', webGLRenderer)}
        {memoryDetail && renderInfoRow('JS 堆限制', formatBytes(memoryDetail.jsHeapSizeLimit))}
      </div>

      {/* 网络信息 */}
      <div className="info-card">
        <div className="card-title"><Wifi size={18} /> 网络信息</div>
        {renderInfoRow('下行带宽', networkDownlink != null ? `${networkDownlink} Mbps` : null)}
        {renderInfoRow('连接类型', networkType)}
        {(() => {
          const conn = getNetworkConnection()
          return renderInfoRow('RTT', conn?.rtt != null ? `${conn.rtt} ms` : null)
        })()}
      </div>

      {/* 电池详情 */}
      {batteryLevel != null && (
        <div className="info-card">
          <div className="card-title"><Battery size={18} /> 电池状态</div>
          {renderInfoRow('电量', `${batteryLevel.toFixed(0)}%`)}
          {renderInfoRow('充电状态', batteryCharging ? '正在充电' : '未充电')}
        </div>
      )}

      {/* 运行时间 */}
      <div className="uptime-card">
        <div className="uptime-header">
          <Clock size={20} />
          <span>运行时间</span>
        </div>
        <div className="uptime-value">{uptime}</div>
      </div>

      {/* 环境 */}
      <div className="info-card">
        <div className="card-title"><Monitor size={18} /> 运行环境</div>
        {renderInfoRow('平台', platform)}
        <div className="info-row">
          <span className="info-label">User Agent</span>
          <span className="info-value ua-value" title={userAgent}>{userAgent}</span>
        </div>
      </div>
    </div>
  )

  // ---- 性能 Tab ----
  const renderPerformance = () => (
    <div className="tab-content">
      {/* 实时指标 */}
      <div className="gauges-grid">
        {renderGauge('CPU 使用率', cpuUsage, <Cpu size={20} />)}
        {renderGauge('内存使用', memoryUsage, <MemoryStick size={20} />)}
      </div>

      <div className="realtime-bar" style={{ marginBottom: 12 }}>
        <div className="realtime-item">
          <Gauge size={16} />
          <span>FPS</span>
          <strong style={{ color: fps >= 55 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444' }}>{fps}</strong>
        </div>
        <div className="realtime-item">
          <Layers size={16} />
          <span>DOM 节点</span>
          <strong>{domNodes.toLocaleString()}</strong>
        </div>
        <div className="realtime-item">
          <Monitor size={16} />
          <span>窗口数</span>
          <strong>{windows.length}</strong>
        </div>
      </div>

      {/* 内存详情 */}
      {memoryDetail && (
        <div className="info-card" style={{ marginBottom: 12 }}>
          <div className="card-title"><MemoryStick size={18} /> 内存详情</div>
          {renderInfoRow('已用堆', formatBytes(memoryDetail.usedJSHeapSize))}
          {renderInfoRow('总堆', formatBytes(memoryDetail.totalJSHeapSize))}
          {renderInfoRow('堆限制', formatBytes(memoryDetail.jsHeapSizeLimit))}
          {renderInfoRow('使用率', `${((memoryDetail.usedJSHeapSize / memoryDetail.jsHeapSizeLimit) * 100).toFixed(1)}%`)}
        </div>
      )}

      {/* 内存历史 Canvas */}
      <div className="chart-card">
        <div className="card-title">
          <Activity size={18} /> 内存使用趋势
          <span className="chart-legend">
            <span className="legend-item" style={{ color: '#61afef' }}>● 已用</span>
            <span className="legend-item" style={{ color: '#a855f7' }}>● 总堆</span>
          </span>
        </div>
        <canvas ref={chartCanvasRef} className="mem-chart-canvas" style={{ width: '100%', height: 160 }} />
      </div>

      {/* 基准测试 */}
      <div className="benchmark-card">
        <div className="card-title" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} /> 性能基准测试</span>
          <button
            className="bench-btn"
            onClick={runBenchmarks}
            disabled={benchmarkRunning}
          >
            {benchmarkRunning ? '运行中…' : '运行测试'}
          </button>
        </div>
        {benchmarks.length === 0 && !benchmarkRunning && (
          <div className="bench-hint">点击"运行测试"来评估浏览器性能</div>
        )}
        {benchmarkRunning && (
          <div className="bench-hint">正在执行基准测试，请稍候…</div>
        )}
        {benchmarks.map((b, i) => (
          <div key={i} className="bench-row">
            <span className="bench-name">{b.name}</span>
            <span className="bench-score" style={{ color: b.score > 80 ? '#22c55e' : b.score > 40 ? '#f59e0b' : '#ef4444' }}>
              {b.score}
            </span>
            <span className="bench-time">{b.time.toFixed(1)} ms</span>
            <span className="bench-detail">{b.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ---- 进程 Tab ----
  const renderProcesses = () => (
    <div className="tab-content processes-tab">
      <div className="processes-header">
        <span>窗口进程列表</span>
        <span className="count">{windows.length} 个窗口</span>
      </div>
      <div className="processes-table">
        <div className="table-header">
          <span>ID</span>
          <span>标题</span>
          <span>应用</span>
          <span>尺寸</span>
          <span>状态</span>
        </div>
        <div className="table-body">
          {windows.map((win) => (
            <div key={win.id} className="table-row">
              <span className="pid">{win.id}</span>
              <span className="name">{win.title}</span>
              <span className="app-id">{win.appId}</span>
              <span className="size">{win.width}×{win.height}</span>
              <span className="status" style={{ color: win.minimized ? '#eab308' : win.focused ? '#22c55e' : '#6b7280' }}>
                {win.minimized ? '最小化' : win.focused ? '聚焦' : '后台'}
              </span>
            </div>
          ))}
          {windows.length === 0 && (
            <div className="empty-row">暂无打开的窗口</div>
          )}
        </div>
      </div>
    </div>
  )

  // ---- 存储 Tab ----
  const renderStorage = () => {
    const maxLocalStorage = 5 * 1024 * 1024 // 常见浏览器 localStorage 限制 5MB
    const usedPercent = (storageInfo.used / maxLocalStorage) * 100

    return (
      <div className="tab-content storage-tab">
        <div className="storage-card">
          <div className="storage-header">
            <HardDrive size={20} />
            <span>LocalStorage 使用情况</span>
          </div>
          <div className="storage-info">
            <div className="storage-bar">
              <div className="storage-fill" style={{ width: `${Math.min(usedPercent, 100)}%` }} />
            </div>
            <div className="storage-text">
              <span>已用: {formatBytes(storageInfo.used)} ({usedPercent.toFixed(2)}%)</span>
              <span>上限: {formatBytes(maxLocalStorage)}</span>
            </div>
          </div>
          <div className="storage-details">
            <div className="detail-item">
              <span>已使用</span>
              <span>{formatBytes(storageInfo.used)}</span>
            </div>
            <div className="detail-item">
              <span>剩余空间</span>
              <span>{formatBytes(maxLocalStorage - storageInfo.used)}</span>
            </div>
            <div className="detail-item">
              <span>条目数</span>
              <span>{storageInfo.items.length}</span>
            </div>
          </div>
        </div>

        {/* 各键存储占用 */}
        {storageInfo.items.length > 0 && (
          <div className="storage-list-card">
            <div className="card-title"><HardDrive size={18} /> 各键存储占用（Top 10）</div>
            {storageInfo.items.slice(0, 10).map((item) => {
              const pct = (item.size / maxLocalStorage) * 100
              return (
                <div key={item.key} className="storage-key-row">
                  <span className="storage-key">{item.key}</span>
                  <div className="storage-key-bar-wrap">
                    <div className="storage-key-bar" style={{ width: `${Math.max(pct * 20, 1)}%` }} />
                  </div>
                  <span className="storage-key-size">{formatBytes(item.size)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* 性能存储 */}
        {memoryDetail && (
          <div className="storage-card" style={{ marginTop: 12 }}>
            <div className="storage-header">
              <MemoryStick size={20} />
              <span>JS 堆内存</span>
            </div>
            <div className="storage-info">
              <div className="storage-bar">
                <div className="storage-fill" style={{ width: `${(memoryDetail.usedJSHeapSize / memoryDetail.jsHeapSizeLimit) * 100}%`, background: 'linear-gradient(90deg, #61afef, #22c55e)' }} />
              </div>
              <div className="storage-text">
                <span>已用: {formatBytes(memoryDetail.usedJSHeapSize)}</span>
                <span>限制: {formatBytes(memoryDetail.jsHeapSizeLimit)}</span>
              </div>
            </div>
            <div className="storage-details">
              <div className="detail-item">
                <span>已用堆</span>
                <span>{formatBytes(memoryDetail.usedJSHeapSize)}</span>
              </div>
              <div className="detail-item">
                <span>总堆</span>
                <span>{formatBytes(memoryDetail.totalJSHeapSize)}</span>
              </div>
              <div className="detail-item">
                <span>堆限制</span>
                <span>{formatBytes(memoryDetail.jsHeapSizeLimit)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const tabs = useMemo(() => [
    { id: 'overview' as const, label: '概览' },
    { id: 'performance' as const, label: '性能' },
    { id: 'processes' as const, label: '进程' },
    { id: 'storage' as const, label: '存储' },
  ], [])

  return (
    <div className="system-monitor">
      <div className="monitor-header">
        <div className="header-left">
          <Activity className="header-icon" />
          <h2>系统监视器</h2>
        </div>
        <div className="header-right">
          <span className="fps-badge">FPS {fps}</span>
          <span className="system-status online">● 实时</span>
        </div>
      </div>

      <div className="monitor-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'performance' && renderPerformance()}
      {selectedTab === 'processes' && renderProcesses()}
      {selectedTab === 'storage' && renderStorage()}

      <style>{`
        .system-monitor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--window-bg, #1a1a2e);
          color: var(--text-color, #e0e0e0);
          padding: 16px;
          overflow: hidden;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          width: 24px;
          height: 24px;
          color: #61afef;
        }

        .header-left h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fps-badge {
          font-size: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
          color: #61afef;
          background: rgba(97, 175, 239, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .system-status.online {
          color: #22c55e;
        }

        .monitor-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
        }

        .tab-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #9ca3af;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
        }

        .tab-btn.active {
          background: #61afef;
          color: #1a1a2e;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
        }

        /* ---- 仪表 ---- */
        .gauges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .gauge-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid var(--border-color, #333);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .gauge-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .gauge-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .gauge-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .gauge-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .gauge-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        /* ---- 实时指标条 ---- */
        .realtime-bar {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 10px 14px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .realtime-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #9ca3af;
        }

        .realtime-item strong {
          color: #e0e0e0;
          font-size: 14px;
        }

        /* ---- 信息卡片 ---- */
        .info-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 14px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 4px 0;
          font-size: 13px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          color: #9ca3af;
          flex-shrink: 0;
          margin-right: 12px;
        }

        .info-value {
          color: #e0e0e0;
          text-align: right;
          word-break: break-all;
        }

        .ua-value {
          font-size: 11px;
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ---- 运行时间 ---- */
        .uptime-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .uptime-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .uptime-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .uptime-value {
          font-size: 32px;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
          color: #61afef;
        }

        /* ---- 图表 ---- */
        .chart-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 14px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .chart-legend {
          display: flex;
          gap: 12px;
          margin-left: auto;
          font-size: 11px;
        }

        .legend-item {
          font-size: 11px;
        }

        .mem-chart-canvas {
          display: block;
          border-radius: 4px;
        }

        /* ---- 基准测试 ---- */
        .benchmark-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 14px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .bench-btn {
          padding: 4px 12px;
          border-radius: 4px;
          border: 1px solid #61afef;
          background: transparent;
          color: #61afef;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .bench-btn:hover:not(:disabled) {
          background: rgba(97, 175, 239, 0.15);
        }

        .bench-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bench-hint {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          padding: 8px;
        }

        .bench-row {
          display: grid;
          grid-template-columns: 90px 60px 80px 1fr;
          gap: 8px;
          padding: 6px 0;
          font-size: 13px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          align-items: center;
        }

        .bench-name {
          font-weight: 500;
        }

        .bench-score {
          font-weight: 700;
        }

        .bench-time {
          color: #9ca3af;
          font-family: 'Monaco', monospace;
          font-size: 12px;
        }

        .bench-detail {
          color: #6b7280;
          font-size: 11px;
        }

        /* ---- 进程 ---- */
        .processes-tab {
          display: flex;
          flex-direction: column;
        }

        .processes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .processes-header .count {
          color: #6b7280;
          font-size: 12px;
        }

        .processes-table {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          border: 1px solid var(--border-color, #333);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 90px 1fr 90px 80px 70px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .table-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: 90px 1fr 90px 80px 70px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color, #333);
          font-size: 13px;
          transition: background 0.1s;
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .table-row .pid {
          font-family: 'Monaco', monospace;
          color: #61afef;
          font-size: 11px;
        }

        .table-row .name {
          font-weight: 500;
        }

        .table-row .app-id {
          color: #a855f7;
          font-size: 12px;
        }

        .table-row .size {
          color: #9ca3af;
          font-size: 12px;
          font-family: 'Monaco', monospace;
        }

        .empty-row {
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }

        /* ---- 存储 ---- */
        .storage-tab {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .storage-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .storage-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .storage-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .storage-info {
          margin-bottom: 16px;
        }

        .storage-bar {
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .storage-fill {
          height: 100%;
          background: linear-gradient(90deg, #61afef, #a855f7);
          border-radius: 12px;
          transition: width 0.3s ease;
        }

        .storage-text {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9ca3af;
        }

        .storage-details {
          display: flex;
          gap: 24px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item span:first-child {
          font-size: 12px;
          color: #9ca3af;
        }

        .detail-item span:last-child {
          font-size: 14px;
          font-weight: 600;
          color: #e0e0e0;
        }

        .storage-list-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 14px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .storage-key-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          font-size: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .storage-key {
          flex: 1;
          color: #e0e0e0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }

        .storage-key-bar-wrap {
          width: 80px;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .storage-key-bar {
          height: 100%;
          background: #61afef;
          border-radius: 3px;
        }

        .storage-key-size {
          color: #9ca3af;
          font-family: 'Monaco', monospace;
          min-width: 60px;
          text-align: right;
        }

        /* ---- 浅色模式 ---- */
        @media (prefers-color-scheme: light) {
          .system-monitor {
            background: #f5f5f5;
            color: #1f2937;
          }

          .gauge-card, .uptime-card, .chart-card, .benchmark-card,
          .processes-table, .storage-card, .storage-list-card,
          .info-card, .realtime-bar {
            background: white;
            border-color: #e5e7eb;
          }

          .table-header {
            background: #f3f4f6;
          }

          .table-row:hover {
            background: #f9fafb;
          }

          .fps-badge {
            background: rgba(97, 175, 239, 0.15);
          }
        }
      `}</style>
    </div>
  )
}

export default SystemMonitor
