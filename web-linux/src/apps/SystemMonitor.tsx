import { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, Cpu, HardDrive, Wifi, Battery, MemoryStick, Clock, Monitor, Play, Pause, Server } from 'lucide-react'
import { useStore } from '../store'

// --- Type declarations for browser APIs not in standard TypeScript lib ---

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface NetworkConnection {
  downlink?: number
  effectiveType?: string
  type?: string
  rtt?: number
  saveData?: boolean
  addEventListener?: (type: string, handler: () => void) => void
  removeEventListener?: (type: string, handler: () => void) => void
}

// --- Data interfaces (unchanged) ---

interface ProcessInfo {
  id: string
  name: string
  cpu: number
  memory: number
  status: 'running' | 'sleeping' | 'zombie'
}

interface NetActivity {
  time: string
  down: number
  up: number
}

interface CpuHistory {
  time: string
  value: number
}

interface DiskPartition {
  name: string
  used: number
  total: number
}

// --- Linux process definitions with base resource profiles ---

const LINUX_PROCESSES: Array<{ name: string; baseCpu: number; baseMemMB: number; defaultStatus: ProcessInfo['status'] }> = [
  { name: 'systemd', baseCpu: 0.1, baseMemMB: 12, defaultStatus: 'running' },
  { name: 'bash', baseCpu: 0.2, baseMemMB: 5, defaultStatus: 'sleeping' },
  { name: 'python3', baseCpu: 2.5, baseMemMB: 45, defaultStatus: 'running' },
  { name: 'node', baseCpu: 3.0, baseMemMB: 80, defaultStatus: 'running' },
  { name: 'nginx', baseCpu: 0.5, baseMemMB: 8, defaultStatus: 'running' },
  { name: 'postgres', baseCpu: 1.2, baseMemMB: 60, defaultStatus: 'running' },
  { name: 'redis-server', baseCpu: 0.8, baseMemMB: 15, defaultStatus: 'running' },
  { name: 'docker', baseCpu: 1.5, baseMemMB: 120, defaultStatus: 'running' },
  { name: 'sshd', baseCpu: 0.1, baseMemMB: 4, defaultStatus: 'sleeping' },
  { name: 'cron', baseCpu: 0.05, baseMemMB: 2, defaultStatus: 'sleeping' },
  { name: 'Xorg', baseCpu: 2.0, baseMemMB: 90, defaultStatus: 'running' },
  { name: 'pulseaudio', baseCpu: 0.3, baseMemMB: 10, defaultStatus: 'running' },
  { name: 'NetworkManager', baseCpu: 0.2, baseMemMB: 18, defaultStatus: 'running' },
  { name: 'dbus-daemon', baseCpu: 0.1, baseMemMB: 6, defaultStatus: 'sleeping' },
  { name: 'journald', baseCpu: 0.2, baseMemMB: 14, defaultStatus: 'running' },
  { name: 'udev', baseCpu: 0.05, baseMemMB: 8, defaultStatus: 'sleeping' },
  { name: 'rsyslogd', baseCpu: 0.1, baseMemMB: 5, defaultStatus: 'running' },
  { name: 'gunicorn', baseCpu: 1.8, baseMemMB: 55, defaultStatus: 'running' },
  { name: 'mongod', baseCpu: 2.2, baseMemMB: 150, defaultStatus: 'running' },
  { name: 'memcached', baseCpu: 0.4, baseMemMB: 20, defaultStatus: 'running' },
  { name: 'agetty', baseCpu: 0.01, baseMemMB: 2, defaultStatus: 'sleeping' },
  { name: 'polkitd', baseCpu: 0.1, baseMemMB: 12, defaultStatus: 'sleeping' },
  { name: 'crond', baseCpu: 0.05, baseMemMB: 3, defaultStatus: 'sleeping' },
]

// --- Browser API accessors (safe, null-returning) ---

function getPerformanceMemory(): PerformanceMemory | null {
  const perf = performance as Performance & { memory?: PerformanceMemory }
  return perf.memory ?? null
}

function getDeviceMemoryGB(): number | null {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return nav.deviceMemory ?? null
}

function getNetworkConnection(): NetworkConnection | null {
  const nav = navigator as Navigator & { connection?: NetworkConnection }
  return nav.connection ?? null
}

async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate()
      return { usage: est.usage ?? 0, quota: est.quota ?? 0 }
    } catch {
      return null
    }
  }
  return null
}

function getLocalStorageUsageBytes(): number {
  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        total += key.length + (localStorage.getItem(key)?.length ?? 0)
      }
    }
  } catch {
    // localStorage may be inaccessible
  }
  return total * 2 // UTF-16 = 2 bytes per character
}

// --- Formatting helpers (unchanged) ---

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}天 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getUsageColor(usage: number): string {
  if (usage > 80) return '#ef4444'
  if (usage > 60) return '#f59e0b'
  if (usage > 40) return '#3b82f6'
  return '#22c55e'
}

// --- Process generation using Linux names + real JS heap ---

function generateProcesses(
  count: number,
  prev: ProcessInfo[] | undefined,
  jsHeapUsedMB: number,
  cpuEstimate: number,
): ProcessInfo[] {
  const now = Date.now()
  const result: ProcessInfo[] = []
  const usedNames = new Set<string>()

  // Shuffle and pick `count` processes
  const shuffled = [...LINUX_PROCESSES].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, count)

  for (let i = 0; i < picked.length; i++) {
    const proc = picked[i]
    if (usedNames.has(proc.name)) continue
    usedNames.add(proc.name)

    // Carry over from previous tick for smooth transitions
    const prevEntry = prev?.find((p) => p.name === proc.name)
    const prevCpu = prevEntry?.cpu ?? proc.baseCpu
    const prevMem = prevEntry?.memory ?? proc.baseMemMB

    // CPU: drift from base + influence from real CPU estimate
    const cpuInfluence = (cpuEstimate - 30) * 0.02 // scale real CPU into per-process nudge
    const cpuDrift = (Math.random() - 0.45) * 3 + cpuInfluence
    const cpu = Math.max(0, Math.min(100, prevCpu + cpuDrift))

    // Memory: for "node" process, use real JS heap; otherwise drift from base
    let mem: number
    if (proc.name === 'node' && jsHeapUsedMB > 0) {
      mem = Math.max(10, jsHeapUsedMB + (Math.random() - 0.5) * 10)
    } else {
      const memDrift = (Math.random() - 0.5) * 8
      mem = Math.max(2, Math.min(1024, prevMem + memDrift))
    }

    // Status: mostly follow default, small chance of transition
    let status = prevEntry?.status ?? proc.defaultStatus
    if (Math.random() < 0.05) {
      const statuses: ProcessInfo['status'][] = ['running', 'sleeping', 'zombie']
      status = statuses[Math.floor(Math.random() * 3)]
    }

    result.push({
      id: prevEntry?.id ?? `pid-${now}-${i}`,
      name: proc.name,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(mem * 10) / 10,
      status,
    })
  }
  return result.sort((a, b) => b.cpu - a.cpu)
}

// --- CPU history: estimate from FPS + long tasks ---

function generateCpuHistory(prev: CpuHistory[], fps: number, longTaskCount: number): CpuHistory[] {
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // Base idle CPU ~8-15%
  const baseIdle = 10
  // FPS penalty: below 55 fps, each missing frame adds ~1.5% CPU
  const fpsPenalty = fps < 55 ? (55 - fps) * 1.5 : 0
  // Long task penalty: each long task detected adds ~4% CPU
  const longTaskPenalty = longTaskCount * 4
  // Small random jitter
  const jitter = (Math.random() - 0.5) * 4
  // Mean-reversion pull
  const lastVal = prev.length > 0 ? prev[prev.length - 1].value : baseIdle
  const pull = (baseIdle - lastVal) * 0.05

  const next = Math.max(2, Math.min(98, lastVal + pull + jitter + fpsPenalty + longTaskPenalty))
  const point = { time: now, value: Math.round(next * 10) / 10 }
  const history = [...prev, point]
  return history.length > 30 ? history.slice(-30) : history
}

// --- Net history: seed from navigator.connection ---

function generateNetActivity(prev: NetActivity[], baseDown: number): NetActivity[] {
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const lastDown = prev.length > 0 ? prev[prev.length - 1].down : baseDown
  const lastUp = prev.length > 0 ? prev[prev.length - 1].up : baseDown * 0.2
  const point = {
    time: now,
    down: Math.max(0.1, lastDown + (Math.random() - 0.5) * 2 + (Math.random() > 0.92 ? 5 : 0)),
    up: Math.max(0.1, lastUp + (Math.random() - 0.5) * 1 + (Math.random() > 0.95 ? 3 : 0)),
  }
  const history = [...prev, point]
  return history.length > 30 ? history.slice(-30) : history
}

// --- Component ---

const SystemMonitor = () => {
  const windows = useStore((s) => s.windows)

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(2000)
  const [uptime, setUptime] = useState(0)

  // Real performance tracking refs
  const fpsRef = useRef(60)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const longTaskCountRef = useRef(0)

  // CPU history
  const [cpuHistory, setCpuHistory] = useState<CpuHistory[]>(() => {
    const init: CpuHistory[] = []
    const now = Date.now()
    for (let i = 29; i >= 0; i--) {
      const t = new Date(now - i * 2000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      init.push({ time: t, value: 8 + Math.random() * 7 })
    }
    return init
  })

  // Net history — seed from real connection
  const connRef = useRef<NetworkConnection | null>(null)
  const [netHistory, setNetHistory] = useState<NetActivity[]>(() => {
    const conn = getNetworkConnection()
    connRef.current = conn
    const baseDown = conn?.downlink ?? 5
    const init: NetActivity[] = []
    const now = Date.now()
    for (let i = 29; i >= 0; i--) {
      const t = new Date(now - i * 2000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      init.push({
        time: t,
        down: Math.max(0.1, baseDown + (Math.random() - 0.5) * 2),
        up: Math.max(0.1, baseDown * 0.2 + (Math.random() - 0.5) * 1),
      })
    }
    return init
  })

  // Processes — Linux names
  const [processes, setProcesses] = useState<ProcessInfo[]>(() => generateProcesses(12, undefined, 0, 10))

  // Disk — updated with real storage estimate
  const [disk, setDisk] = useState<DiskPartition[]>([
    { name: '/ (root)', used: 28 * 1024 * 1024 * 1024, total: 60 * 1024 * 1024 * 1024 },
    { name: '/home', used: 85 * 1024 * 1024 * 1024, total: 200 * 1024 * 1024 * 1024 },
    { name: '/tmp', used: 512 * 1024 * 1024, total: 2 * 1024 * 1024 * 1024 },
  ])

  // Memory — based on real device memory
  const [memory, setMemory] = useState(() => {
    const devMem = getDeviceMemoryGB()
    const total = devMem ? devMem * 1024 * 1024 * 1024 : 16 * 1024 * 1024 * 1024
    return { total, used: 0, cached: 0 }
  })

  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null)
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine)

  // Derived display values
  const [currentFps, setCurrentFps] = useState(60)
  const [jsHeapUsed, setJsHeapUsed] = useState(0)
  const [jsHeapTotal, setJsHeapTotal] = useState(0)
  const [localStorageBytes, setLocalStorageBytes] = useState(0)

  const startTime = useRef(Date.now())

  // --- FPS tracking via requestAnimationFrame (pauses when page is hidden) ---
  useEffect(() => {
    let animId: number
    let running = true
    const measure = () => {
      if (!running) return
      // 页面不可见时暂停RAF，减少CPU消耗
      if (document.hidden) {
        animId = requestAnimationFrame(measure)
        return
      }
      frameCountRef.current++
      const now = performance.now()
      const elapsed = now - lastFpsTimeRef.current
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed)
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }
      animId = requestAnimationFrame(measure)
    }
    animId = requestAnimationFrame(measure)
    return () => {
      running = false
      cancelAnimationFrame(animId)
    }
  }, [])

  // --- PerformanceObserver for long tasks ---
  useEffect(() => {
    let observer: PerformanceObserver | null = null
    try {
      if (typeof PerformanceObserver !== 'undefined') {
        observer = new PerformanceObserver((list) => {
          longTaskCountRef.current += list.getEntries().length
        })
        observer.observe({ type: 'longtask', buffered: false })
      }
    } catch {
      // longtask type not supported
    }
    return () => observer?.disconnect()
  }, [])

  // --- Storage estimate (async, once) ---
  useEffect(() => {
    getStorageEstimate().then((est) => {
      if (est && est.quota > 0) {
        const usageRatio = est.usage / est.quota
        // Map browser storage to realistic Linux partition sizes
        const rootTotal = 60 * 1024 * 1024 * 1024
        const homeTotal = 200 * 1024 * 1024 * 1024
        const tmpTotal = 2 * 1024 * 1024 * 1024
        setDisk([
          { name: '/ (root)', used: Math.round(rootTotal * Math.min(usageRatio * 1.2, 0.95)), total: rootTotal },
          { name: '/home', used: Math.round(homeTotal * Math.min(usageRatio * 0.8, 0.9)), total: homeTotal },
          { name: '/tmp', used: Math.round(tmpTotal * Math.min(usageRatio * 0.3, 0.5)), total: tmpTotal },
        ])
      }
    })
  }, [])

  // --- Battery (unchanged) ---
  useEffect(() => {
    if ('getBattery' in navigator) {
      type BatteryInfo = { level: number; charging: boolean; addEventListener: (type: string, handler: () => void) => void }
      ;(navigator as Navigator & { getBattery: () => Promise<BatteryInfo> })
        .getBattery()
        .then((bat) => {
          setBattery({ level: bat.level * 100, charging: bat.charging })
          const onLevelChange = () => setBattery({ level: bat.level * 100, charging: bat.charging })
          bat.addEventListener('levelchange', onLevelChange)
          bat.addEventListener('chargingchange', onLevelChange)
        })
        .catch(() => {})
    }
  }, [])

  // --- Network online/offline (unchanged) ---
  useEffect(() => {
    const onOnline = () => setNetworkOnline(true)
    const onOffline = () => setNetworkOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // --- Main tick: update all data ---
  const tick = useCallback(() => {
    setUptime(Date.now() - startTime.current)

    // Read real FPS
    const fps = fpsRef.current
    setCurrentFps(fps)

    // Read long tasks count and reset
    const longTasks = longTaskCountRef.current
    longTaskCountRef.current = 0

    // CPU estimate from FPS + long tasks
    const cpuEstimate = Math.min(98, Math.max(2, 10 + (fps < 55 ? (55 - fps) * 1.5 : 0) + longTasks * 4))
    setCpuHistory((prev) => generateCpuHistory(prev, fps, longTasks))

    // Net history with real base downlink
    const baseDown = connRef.current?.downlink ?? 5
    setNetHistory((prev) => generateNetActivity(prev, baseDown))

    // Real JS heap
    const mem = getPerformanceMemory()
    const heapUsedMB = mem ? mem.usedJSHeapSize / (1024 * 1024) : 0
    const heapTotalMB = mem ? mem.totalJSHeapSize / (1024 * 1024) : 0
    setJsHeapUsed(heapUsedMB)
    setJsHeapTotal(heapTotalMB)

    // Processes with real JS heap for "node"
    setProcesses((prev) => generateProcesses(
      Math.max(8, Math.min(16, prev.length + (Math.random() > 0.5 ? 1 : -1))),
      prev,
      heapUsedMB,
      cpuEstimate,
    ))

    // Memory: real device memory + JS heap influence
    const devMemGB = getDeviceMemoryGB()
    const totalMem = devMemGB ? devMemGB * 1024 * 1024 * 1024 : 16 * 1024 * 1024 * 1024

    // Estimate "used" memory: scale JS heap to represent the web runtime + simulated system overhead
    // JS heap is just the browser tab; scale up by ~10x to simulate full OS memory usage
    const jsHeapScale = mem ? (mem.usedJSHeapSize / mem.jsHeapSizeLimit) : 0.35
    const baseUsedRatio = 0.25 + jsHeapScale * 0.4 // 25%-65% range driven by real heap usage
    const usedJitter = (Math.random() - 0.5) * 0.03
    const usedMem = totalMem * Math.min(0.9, Math.max(0.15, baseUsedRatio + usedJitter))

    // Cache/buffer: typically 10-25% of total
    const cachedRatio = 0.12 + Math.random() * 0.08
    const cachedMem = totalMem * cachedRatio

    setMemory({ total: totalMem, used: usedMem, cached: cachedMem })

    // Local storage usage
    setLocalStorageBytes(getLocalStorageUsageBytes())
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    tick()
    const id = setInterval(tick, refreshInterval)
    return () => clearInterval(id)
  }, [autoRefresh, refreshInterval, tick])

  // --- Computed display values ---

  const cpuUsage = cpuHistory.length > 0 ? cpuHistory[cpuHistory.length - 1].value : 0
  const netDown = netHistory.length > 0 ? netHistory[netHistory.length - 1].down : 0
  const netUp = netHistory.length > 0 ? netHistory[netHistory.length - 1].up : 0

  const memUsed = memory.used
  const memCached = memory.cached
  const memPercent = memory.total > 0 ? ((memUsed + memCached) / memory.total) * 100 : 0
  const swapUsed = Math.round(memUsed / (1024 * 1024 * 1024) * 10) / 10
  const swapCached = Math.round(memCached / (1024 * 1024 * 1024) * 10) / 10

  const totalDiskUsed = disk.reduce((s, d) => s + d.used, 0)
  const totalDiskTotal = disk.reduce((s, d) => s + d.total, 0)
  const totalDiskPercent = totalDiskTotal > 0 ? (totalDiskUsed / totalDiskTotal) * 100 : 0

  const maxCpu = Math.max(...cpuHistory.map((p) => p.value), 1)
  const maxNet = Math.max(...netHistory.map((p) => Math.max(p.down, p.up)), 1)

  // Connection info for display
  const connInfo = getNetworkConnection()

  const renderCpuChart = () => {
    const bars = cpuHistory.slice(-20)
    return (
      <div className="cm-chart">
        <div className="cm-bars">
          {bars.map((p, i) => (
            <div
              key={i}
              className="cm-bar"
              style={{
                height: `${(p.value / maxCpu) * 100}%`,
                background: `linear-gradient(180deg, ${getUsageColor(p.value)}, ${getUsageColor(p.value)}88)`,
              }}
              title={`${p.time}: ${p.value.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="cm-axis">
          <span>{bars[0]?.time}</span>
          <span>{bars[bars.length - 1]?.time}</span>
        </div>
      </div>
    )
  }

  const renderNetChart = () => {
    const bars = netHistory.slice(-20)
    return (
      <div className="cm-chart">
        <div className="cm-bars">
          {bars.map((p, i) => (
            <div key={i} className="cm-bar-pair">
              <div
                className="cm-bar net-down"
                style={{ height: `${(p.down / maxNet) * 100}%` }}
                title={`↓ ${p.down.toFixed(1)} Mbps`}
              />
              <div
                className="cm-bar net-up"
                style={{ height: `${(p.up / maxNet) * 100}%` }}
                title={`↑ ${p.up.toFixed(1)} Mbps`}
              />
            </div>
          ))}
        </div>
        <div className="cm-axis">
          <span>{bars[0]?.time}</span>
          <span>{bars[bars.length - 1]?.time}</span>
        </div>
      </div>
    )
  }

  const currentCpuColor = getUsageColor(cpuUsage)
  const currentMemColor = getUsageColor(memPercent)

  return (
    <div className="sm-root">
      <header className="sm-header">
        <div className="sm-header-left">
          <Activity size={20} className="sm-logo" />
          <h1>系统监控</h1>
        </div>
        <div className="sm-header-right">
          <label className="sm-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="sm-toggle-slider" />
            <span className="sm-toggle-label">{autoRefresh ? '自动刷新' : '已暂停'}</span>
          </label>
          <select
            className="sm-interval"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
          >
            <option value={1000}>1秒</option>
            <option value={2000}>2秒</option>
            <option value={5000}>5秒</option>
          </select>
          <button
            className="sm-refresh-btn"
            onClick={tick}
            disabled={autoRefresh}
            title="手动刷新"
          >
            {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </header>

      <div className="sm-grid">
        <div className="sm-col sm-col-left">
          <div className="sm-card sm-card-gauge">
            <div className="sm-card-head">
              <Cpu size={16} />
              <span>CPU 使用率</span>
              <span className="sm-badge" style={{ color: currentCpuColor }}>{cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="sm-gauge-bar">
              <div className="sm-gauge-fill" style={{ width: `${Math.min(cpuUsage, 100)}%`, background: currentCpuColor }} />
            </div>
            {renderCpuChart()}
          </div>

          <div className="sm-card sm-card-gauge">
            <div className="sm-card-head">
              <MemoryStick size={16} />
              <span>内存使用</span>
              <span className="sm-badge" style={{ color: currentMemColor }}>{memPercent.toFixed(1)}%</span>
            </div>
            <div className="sm-gauge-bar">
              <div className="sm-gauge-fill" style={{ width: `${Math.min(memPercent, 100)}%`, background: currentMemColor }} />
            </div>
            <div className="sm-sub-grid">
              <div className="sm-sub-item">
                <span className="sm-sub-label">已用</span>
                <span className="sm-sub-value">{swapUsed} GB</span>
              </div>
              <div className="sm-sub-item">
                <span className="sm-sub-label">缓存</span>
                <span className="sm-sub-value">{swapCached} GB</span>
              </div>
              <div className="sm-sub-item">
                <span className="sm-sub-label">总计</span>
                <span className="sm-sub-value">{formatBytes(memory.total)}</span>
              </div>
            </div>
            {jsHeapUsed > 0 && (
              <div className="sm-sub-grid" style={{ marginTop: 8, borderTop: '1px solid var(--window-border, #2a2a3e)', paddingTop: 8 }}>
                <div className="sm-sub-item">
                  <span className="sm-sub-label">JS 堆已用</span>
                  <span className="sm-sub-value">{jsHeapUsed.toFixed(1)} MB</span>
                </div>
                <div className="sm-sub-item">
                  <span className="sm-sub-label">JS 堆总计</span>
                  <span className="sm-sub-value">{jsHeapTotal.toFixed(1)} MB</span>
                </div>
                <div className="sm-sub-item">
                  <span className="sm-sub-label">LocalStorage</span>
                  <span className="sm-sub-value">{formatBytes(localStorageBytes)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="sm-card">
            <div className="sm-card-head">
              <HardDrive size={16} />
              <span>磁盘空间</span>
              <span className="sm-badge" style={{ color: getUsageColor(totalDiskPercent) }}>
                {totalDiskPercent.toFixed(1)}%
              </span>
            </div>
            <div className="sm-gauge-bar">
              <div
                className="sm-gauge-fill"
                style={{ width: `${Math.min(totalDiskPercent, 100)}%`, background: getUsageColor(totalDiskPercent) }}
              />
            </div>
            <div className="sm-disk-list">
              {disk.map((d) => {
                const pct = d.total > 0 ? (d.used / d.total) * 100 : 0
                return (
                  <div key={d.name} className="sm-disk-item">
                    <div className="sm-disk-name">
                      <span>{d.name}</span>
                      <span className="sm-disk-pct" style={{ color: getUsageColor(pct) }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="sm-gauge-bar sm-gauge-bar-sm">
                      <div
                        className="sm-gauge-fill"
                        style={{ width: `${Math.min(pct, 100)}%`, background: getUsageColor(pct) }}
                      />
                    </div>
                    <div className="sm-disk-detail">
                      已用 {formatBytes(d.used)} / 共 {formatBytes(d.total)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="sm-card">
            <div className="sm-card-head">
              <Wifi size={16} />
              <span>网络活动</span>
              <span className="sm-net-status" style={{ color: networkOnline ? '#22c55e' : '#ef4444' }}>
                {networkOnline ? '● 在线' : '● 离线'}
              </span>
            </div>
            <div className="sm-net-grid">
              <div className="sm-net-item">
                <span className="sm-net-label">↓ 下载</span>
                <span className="sm-net-value">{netDown.toFixed(1)} <small>Mbps</small></span>
              </div>
              <div className="sm-net-item">
                <span className="sm-net-label">↑ 上传</span>
                <span className="sm-net-value">{netUp.toFixed(1)} <small>Mbps</small></span>
              </div>
            </div>
            {connInfo && (
              <div className="sm-sub-grid" style={{ marginBottom: 8 }}>
                {connInfo.effectiveType && (
                  <div className="sm-sub-item">
                    <span className="sm-sub-label">连接类型</span>
                    <span className="sm-sub-value">{connInfo.effectiveType}</span>
                  </div>
                )}
                {connInfo.rtt !== undefined && (
                  <div className="sm-sub-item">
                    <span className="sm-sub-label">RTT</span>
                    <span className="sm-sub-value">{connInfo.rtt} ms</span>
                  </div>
                )}
                {connInfo.downlink !== undefined && (
                  <div className="sm-sub-item">
                    <span className="sm-sub-label">下行带宽</span>
                    <span className="sm-sub-value">{connInfo.downlink} Mbps</span>
                  </div>
                )}
              </div>
            )}
            {renderNetChart()}
          </div>
        </div>

        <div className="sm-col sm-col-right">
          <div className="sm-card">
            <div className="sm-card-head">
              <Clock size={16} />
              <span>系统运行时间</span>
            </div>
            <div className="sm-uptime">{formatUptime(uptime)}</div>
          </div>

          <div className="sm-card">
            <div className="sm-card-head">
              <Battery size={16} />
              <span>电池状态</span>
            </div>
            {battery ? (
              <>
                <div className="sm-battery-row">
                  <div className="sm-battery-bar">
                    <div
                      className="sm-battery-fill"
                      style={{
                        width: `${battery.level}%`,
                        background: battery.charging
                          ? 'linear-gradient(90deg, #22c55e, #3b82f6)'
                          : battery.level < 20
                            ? '#ef4444'
                            : '#22c55e',
                      }}
                    />
                  </div>
                  <span className="sm-battery-pct">{battery.level.toFixed(0)}%</span>
                </div>
                <div className="sm-battery-status">
                  {battery.charging ? '⚡ 正在充电' : '🔋 使用电池中'}
                </div>
              </>
            ) : (
              <div className="sm-no-battery">此设备无电池信息</div>
            )}
          </div>

          <div className="sm-card">
            <div className="sm-card-head">
              <Monitor size={16} />
              <span>系统信息</span>
            </div>
            <div className="sm-info-list">
              <div className="sm-info-row">
                <span>CPU 核心</span>
                <strong>{navigator.hardwareConcurrency || '—'} 核</strong>
              </div>
              <div className="sm-info-row">
                <span>设备内存</span>
                <strong>
                  {'deviceMemory' in navigator
                    ? `${(navigator as Navigator & { deviceMemory: number }).deviceMemory} GB`
                    : '—'}
                </strong>
              </div>
              <div className="sm-info-row">
                <span>屏幕</span>
                <strong>{screen.width}×{screen.height}</strong>
              </div>
              <div className="sm-info-row">
                <span>帧率</span>
                <strong style={{ color: currentFps >= 55 ? '#22c55e' : currentFps >= 30 ? '#f59e0b' : '#ef4444' }}>
                  {currentFps} FPS
                </strong>
              </div>
              <div className="sm-info-row">
                <span>窗口数</span>
                <strong>{windows.length}</strong>
              </div>
              <div className="sm-info-row">
                <span>平台</span>
                <strong>{navigator.platform || '—'}</strong>
              </div>
            </div>
          </div>

          <div className="sm-card sm-card-process">
            <div className="sm-card-head">
              <Server size={16} />
              <span>进程列表</span>
              <span className="sm-count">{processes.length}</span>
            </div>
            <div className="sm-process-header">
              <span>进程名</span>
              <span style={{ textAlign: 'right' }}>CPU</span>
              <span style={{ textAlign: 'right' }}>内存</span>
              <span style={{ textAlign: 'center' }}>状态</span>
            </div>
            <div className="sm-process-body">
              {processes.slice(0, 12).map((p) => (
                <div key={p.id} className="sm-process-row">
                  <span className="sm-p-name" title={p.name}>{p.name}</span>
                  <span className="sm-p-cpu" style={{ color: getUsageColor(p.cpu) }}>
                    {p.cpu.toFixed(0)}%
                  </span>
                  <span className="sm-p-mem">{p.memory.toFixed(0)} MB</span>
                  <span
                    className={`sm-p-status sm-p-${p.status}`}
                    title={p.status}
                  >
                    ●
                  </span>
                </div>
              ))}
              {processes.length === 0 && (
                <div className="sm-process-empty">暂无进程</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sm-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--window-bg, #0f0f1a);
          color: var(--text-color, #e4e4e7);
          padding: 12px;
          gap: 10px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .sm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--card-bg, #1a1a2e);
          border-radius: 10px;
          border: 1px solid var(--window-border, #2a2a3e);
        }

        .sm-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sm-logo {
          color: var(--accent, #61afef);
        }

        .sm-header h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .sm-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sm-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
        }

        .sm-toggle input {
          display: none;
        }

        .sm-toggle-slider {
          position: relative;
          width: 32px;
          height: 16px;
          background: var(--window-border, #3a3a4e);
          border-radius: 8px;
          transition: background 0.2s;
        }

        .sm-toggle-slider::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          transition: left 0.2s;
        }

        .sm-toggle input:checked + .sm-toggle-slider {
          background: var(--accent, #61afef);
        }

        .sm-toggle input:checked + .sm-toggle-slider::after {
          left: 18px;
        }

        .sm-toggle-label {
          font-size: 12px;
        }

        .sm-interval {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid var(--window-border, #3a3a4e);
          background: var(--window-bg, #0f0f1a);
          color: var(--text-color, #e4e4e7);
          font-size: 12px;
          cursor: pointer;
        }

        .sm-interval:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sm-refresh-btn {
          padding: 6px;
          border-radius: 6px;
          border: 1px solid var(--window-border, #3a3a4e);
          background: var(--window-bg, #0f0f1a);
          color: var(--text-color, #e4e4e7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .sm-refresh-btn:hover:not(:disabled) {
          border-color: var(--accent, #61afef);
          color: var(--accent, #61afef);
        }

        .sm-refresh-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .sm-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          min-height: 0;
        }

        .sm-card {
          background: var(--card-bg, #1a1a2e);
          border-radius: 10px;
          border: 1px solid var(--window-border, #2a2a3e);
          padding: 12px;
        }

        .sm-card-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #9ca3af);
          margin-bottom: 10px;
        }

        .sm-card-head svg {
          color: var(--accent, #61afef);
        }

        .sm-card-head span {
          flex: 1;
        }

        .sm-badge {
          font-size: 14px;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .sm-gauge-bar {
          height: 8px;
          background: var(--window-border, #2a2a3e);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .sm-gauge-bar-sm {
          height: 4px;
          margin: 4px 0;
        }

        .sm-gauge-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .sm-chart {
          margin-top: 8px;
        }

        .sm-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 60px;
          padding: 2px;
          background: var(--window-bg, #0f0f1a);
          border-radius: 6px;
        }

        .sm-bar {
          flex: 1;
          border-radius: 2px 2px 0 0;
          min-height: 2px;
          transition: height 0.3s ease;
        }

        .sm-bar-pair {
          display: flex;
          gap: 1px;
          flex: 1;
          height: 100%;
          align-items: flex-end;
        }

        .sm-bar-pair .cm-bar {
          flex: 1;
        }

        .net-down {
          background: linear-gradient(180deg, #61afef, #3b82f6) !important;
        }

        .net-up {
          background: linear-gradient(180deg, #f59e0b, #d97706) !important;
        }

        .sm-axis {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
          margin-top: 3px;
        }

        .sm-sub-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .sm-sub-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sm-sub-label {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .sm-sub-value {
          font-size: 13px;
          font-weight: 600;
          font-family: 'Monaco', monospace;
        }

        .sm-disk-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sm-disk-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sm-disk-name {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .sm-disk-pct {
          font-weight: 600;
          font-family: 'Monaco', monospace;
        }

        .sm-disk-detail {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .sm-net-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }

        .sm-net-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px;
          background: var(--window-bg, #0f0f1a);
          border-radius: 6px;
        }

        .sm-net-label {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .sm-net-value {
          font-size: 18px;
          font-weight: 700;
          font-family: 'Monaco', monospace;
          color: var(--accent, #61afef);
        }

        .sm-net-value small {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-weight: 400;
        }

        .sm-net-status {
          font-size: 12px;
          font-weight: 500;
        }

        .sm-uptime {
          font-size: 28px;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
          color: var(--accent, #61afef);
          letter-spacing: 1px;
        }

        .sm-battery-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sm-battery-bar {
          flex: 1;
          height: 16px;
          background: var(--window-border, #2a2a3e);
          border-radius: 3px;
          overflow: hidden;
        }

        .sm-battery-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .sm-battery-pct {
          font-size: 16px;
          font-weight: 700;
          font-family: 'Monaco', monospace;
          min-width: 50px;
          text-align: right;
        }

        .sm-battery-status {
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
        }

        .sm-no-battery {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          text-align: center;
          padding: 12px;
        }

        .sm-info-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sm-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 3px 0;
          border-bottom: 1px solid var(--window-border, #1a1a2e);
        }

        .sm-info-row:last-child {
          border-bottom: none;
        }

        .sm-info-row span {
          color: var(--text-secondary, #9ca3af);
        }

        .sm-info-row strong {
          color: var(--text-color, #e4e4e7);
          font-weight: 500;
        }

        .sm-card-process {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .sm-count {
          background: var(--accent, #61afef);
          color: #fff;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .sm-process-header {
          display: grid;
          grid-template-columns: 1fr 60px 80px 40px;
          gap: 8px;
          padding: 4px 6px;
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-weight: 600;
          border-bottom: 1px solid var(--window-border, #2a2a3e);
        }

        .sm-process-body {
          flex: 1;
          overflow-y: auto;
          max-height: 260px;
        }

        .sm-process-row {
          display: grid;
          grid-template-columns: 1fr 60px 80px 40px;
          gap: 8px;
          padding: 5px 6px;
          font-size: 12px;
          border-bottom: 1px solid var(--window-border, #1a1a2e);
          align-items: center;
        }

        .sm-p-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Monaco', monospace;
        }

        .sm-p-cpu {
          text-align: right;
          font-weight: 600;
          font-family: 'Monaco', monospace;
        }

        .sm-p-mem {
          text-align: right;
          color: var(--text-secondary, #9ca3af);
          font-family: 'Monaco', monospace;
        }

        .sm-p-status {
          text-align: center;
        }

        .sm-p-running {
          color: #22c55e;
        }

        .sm-p-sleeping {
          color: #f59e0b;
        }

        .sm-p-zombie {
          color: #ef4444;
        }

        .sm-process-empty {
          padding: 20px;
          text-align: center;
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
        }

        @media (prefers-color-scheme: light) {
          .sm-root {
            background: #f5f5f7;
            color: #1f2937;
          }
          .sm-header {
            background: #fff;
            border-color: #e5e7eb;
          }
          .sm-card {
            background: #fff;
            border-color: #e5e7eb;
          }
          .sm-gauge-bar,
          .sm-bars,
          .sm-net-item,
          .sm-info-row {
            background: #f3f4f6;
          }
          .sm-info-row {
            border-bottom-color: #e5e7eb;
          }
          .sm-process-header {
            border-bottom-color: #e5e7eb;
          }
          .sm-process-row {
            border-bottom-color: #f3f4f6;
          }
          .sm-toggle-slider {
            background: #d1d5db;
          }
          .sm-interval {
            background: #fff;
            border-color: #e5e7eb;
            color: #1f2937;
          }
          .sm-refresh-btn {
            background: #fff;
            border-color: #e5e7eb;
            color: #1f2937;
          }
        }
      `}</style>
    </div>
  )
}

export default SystemMonitor
