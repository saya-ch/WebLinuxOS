import { useState, useEffect, useMemo } from 'react'

interface MemoryInfo {
  total: number
  used: number
  free: number
  percentage: number
}

interface CPUInfo {
  usage: number
  cores: number
  model: string
}

interface DiskInfo {
  total: number
  used: number
  free: number
  percentage: number
}

interface NetworkInfo {
  bytesSent: number
  bytesReceived: number
  packetsSent: number
  packetsReceived: number
}

interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  memory: number
  status: 'running' | 'sleeping' | 'idle'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function GaugeChart({ value, label, color }: { value: number; label: string; color: string }) {
  const percentage = Math.min(100, Math.max(0, value))
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">
          {percentage.toFixed(0)}%
        </text>
        <text x="50" y="62" textAnchor="middle" fill="#888" fontSize="10">
          {label}
        </text>
      </svg>
    </div>
  )
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height="60" viewBox="0 0 100 60" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${points.split(' ').map((p, i) => `${i === 0 ? '' : 'L'}${p}`).join(' ')} L 100,60 L 0,60 Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SystemMonitor() {
  // 基于真实浏览器 API 增强。注意: 许多真实 API 仅在某些浏览器可用
  const detectCores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency || 4
  const detectDeviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const totalMemMB = detectDeviceMemory ? detectDeviceMemory * 1024 : 8192

  const [memory, setMemory] = useState<MemoryInfo>({
    total: totalMemMB,
    used: Math.round(totalMemMB * 0.5),
    free: Math.round(totalMemMB * 0.5),
    percentage: 50
  })
  const [cpu, setCpu] = useState<CPUInfo>({
    usage: 25,
    cores: detectCores,
    model: `${detectCores} 核心浏览器运行时`
  })
  const [disk] = useState<DiskInfo>({ total: 50 * 1024, used: 15 * 1024, free: 35 * 1024, percentage: 30 })
  const [network, setNetwork] = useState<NetworkInfo>({ bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 })
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(25))
  const [memHistory, setMemHistory] = useState<number[]>(Array(20).fill(50))
  const [uptime, setUptime] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 })
  const [fps, setFps] = useState<number>(60)

  useEffect(() => {
    const startTime = Date.now()
    const generateProcesses = () => {
      const processNames = ['systemd', 'terminal', 'browser', 'file-manager', 'code-editor', 'music-player', 'weather', 'calculator', 'task-manager', 'settings', 'ai-helper', 'system-monitor']
      const newProcesses: ProcessInfo[] = processNames.map((name, i) => ({
        pid: 1000 + i,
        name,
        cpu: Math.random() * 15 + 0.1,
        memory: Math.random() * 5 + 0.5,
        status: Math.random() > 0.3 ? 'running' : 'sleeping' as const,
      }))
      setProcesses(newProcesses)
    }

    generateProcesses()

    // FPS 监控
    let frameCount = 0
    let lastFpsTime = performance.now()
    const fpsObserver = () => {
      frameCount++
      const now = performance.now()
      if (now - lastFpsTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastFpsTime)))
        frameCount = 0
        lastFpsTime = now
      }
      requestAnimationFrame(fpsObserver)
    }
    const rafId = requestAnimationFrame(fpsObserver)

    const interval = setInterval(() => {
      // 使用 performance.memory (Chrome only) 如果不可用则回退到模拟
      const perf = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      let newMemUsage: number
      let usedMB: number
      if (perf && perf.jsHeapSizeLimit > 0) {
        usedMB = (perf.usedJSHeapSize / (1024 * 1024))
        const limitMB = perf.jsHeapSizeLimit / (1024 * 1024)
        newMemUsage = Math.min(100, Math.max(5, (usedMB / Math.max(limitMB, 1)) * 10))
      } else {
        newMemUsage = Math.random() * 30 + 40
        usedMB = (totalMemMB * newMemUsage) / 100
      }

      // 模拟 CPU 但基于主线程计时测量 FPS 以获得一些现实感
      const simulatedCpu = Math.min(100, Math.max(5, 100 - fps / 1.5)) + (Math.random() - 0.5) * 10
      const newCpuUsage = Math.min(100, Math.max(0, simulatedCpu))

      setCpu(prev => ({
        ...prev,
        usage: newCpuUsage,
        cores: detectCores,
        model: `${detectCores} 核心浏览器运行时`
      }))

      setMemory(() => ({
        total: totalMemMB,
        used: Math.round(usedMB),
        free: Math.round(totalMemMB - usedMB),
        percentage: (usedMB / totalMemMB) * 100
      }))

      // 网络: 使用 navigator.connection 若可用
      const conn = (navigator as Navigator & { connection?: { downlink: number; rtt: number } }).connection
      if (conn) {
        const received = conn.downlink > 0 ? conn.downlink * 1024 * 1024 / 8 : Math.random() * 50000
        setNetwork(prev => ({
          bytesSent: prev.bytesSent + Math.floor(Math.random() * 10000),
          bytesReceived: prev.bytesReceived + Math.floor(received),
          packetsSent: prev.packetsSent + Math.floor(Math.random() * 100),
          packetsReceived: prev.packetsReceived + Math.floor(Math.random() * 200)
        }))
      } else {
        setNetwork(prev => ({
          bytesSent: prev.bytesSent + Math.floor(Math.random() * 10000),
          bytesReceived: prev.bytesReceived + Math.floor(Math.random() * 50000),
          packetsSent: prev.packetsSent + Math.floor(Math.random() * 100),
          packetsReceived: prev.packetsReceived + Math.floor(Math.random() * 200)
        }))
      }

      setCpuHistory(prev => [...prev.slice(1), newCpuUsage])
      setMemHistory(prev => [...prev.slice(1), (usedMB / totalMemMB) * 100])

      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setUptime({
        hours: Math.floor(elapsed / 3600),
        minutes: Math.floor((elapsed % 3600) / 60)
      })

      generateProcesses()
    }, 2000)

    return () => {
      clearInterval(interval)
      cancelAnimationFrame(rafId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const topProcesses = useMemo(() => {
    return [...processes]
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 8)
  }, [processes])

  return (
    <div style={{
      padding: '24px',
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #0a0a12 0%, #12121f 100%)',
      color: '#e8e8f4',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        系统监视器
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <GaugeChart value={cpu.usage} label="CPU" color="#6c5ce7" />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
            <div>核心数: {cpu.cores}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>{cpu.model}</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <GaugeChart value={memory.percentage} label="内存" color="#00cec9" />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
            <div>{formatBytes(memory.used)} / {formatBytes(memory.total)}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
              可用: {formatBytes(memory.free)}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <GaugeChart value={disk.percentage} label="磁盘" color="#fdcb6e" />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
            <div>{formatBytes(disk.used)} / {formatBytes(disk.total)}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
              可用: {formatBytes(disk.free)}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6c5ce7' }}>
              {uptime.hours.toString().padStart(2, '0')}:{uptime.minutes.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '14px', color: '#888' }}>系统运行时间</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>CPU 使用率</div>
          <MiniChart data={cpuHistory} color="#6c5ce7" />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>内存使用率</div>
          <MiniChart data={memHistory} color="#00cec9" />
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>网络统计</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>已发送</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#6c5ce7' }}>{formatBytes(network.bytesSent)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>已接收</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#00cec9' }}>{formatBytes(network.bytesReceived)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>发送数据包</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{network.packetsSent.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>接收数据包</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{network.packetsReceived.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>热门进程</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>PID</th>
                <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>进程名</th>
                <th style={{ padding: '8px', textAlign: 'right', color: '#888' }}>CPU %</th>
                <th style={{ padding: '8px', textAlign: 'right', color: '#888' }}>内存 %</th>
                <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {topProcesses.map(proc => (
                <tr key={proc.pid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px', color: '#666' }}>{proc.pid}</td>
                  <td style={{ padding: '8px', fontWeight: '500' }}>{proc.name}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: proc.cpu > 10 ? '#ff7675' : '#6c5ce7' }}>
                    {proc.cpu.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', color: proc.memory > 3 ? '#fdcb6e' : '#00cec9' }}>
                    {proc.memory.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: proc.status === 'running' ? 'rgba(108, 92, 231, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: proc.status === 'running' ? '#6c5ce7' : '#888'
                    }}>
                      {proc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
