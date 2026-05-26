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
  const [memory, setMemory] = useState<MemoryInfo>({ total: 16384, used: 8192, free: 8192, percentage: 50 })
  const [cpu, setCpu] = useState<CPUInfo>({ usage: 25, cores: 8, model: 'WebAssembly Virtual CPU' })
  const [disk] = useState<DiskInfo>({ total: 50 * 1024, used: 15 * 1024, free: 35 * 1024, percentage: 30 })
  const [network, setNetwork] = useState<NetworkInfo>({ bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 })
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(25))
  const [memHistory, setMemHistory] = useState<number[]>(Array(20).fill(50))
  const [uptime, setUptime] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 })

  useEffect(() => {
    const startTime = Date.now()
    const generateProcesses = () => {
      const processNames = ['systemd', 'terminal', 'browser', 'file-manager', 'code-editor', 'music-player', 'weather', 'calculator', 'task-manager', 'settings']
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

    const interval = setInterval(() => {
      const newCpuUsage = Math.random() * 30 + 10
      const newMemUsage = Math.random() * 20 + 40

      setCpu(prev => ({ ...prev, usage: newCpuUsage }))
      setMemory(prev => ({
        ...prev,
        used: (newMemUsage / 100) * prev.total,
        free: prev.total - (newMemUsage / 100) * prev.total,
        percentage: newMemUsage,
      }))

      setNetwork(prev => ({
        bytesSent: prev.bytesSent + Math.floor(Math.random() * 1000),
        bytesReceived: prev.bytesReceived + Math.floor(Math.random() * 1500),
        packetsSent: prev.packetsSent + Math.floor(Math.random() * 10),
        packetsReceived: prev.packetsReceived + Math.floor(Math.random() * 15),
      }))

      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      setUptime({
        hours: Math.floor(elapsedSeconds / 3600),
        minutes: Math.floor((elapsedSeconds % 3600) / 60)
      })

      setCpuHistory(prev => [...prev.slice(1), newCpuUsage])
      setMemHistory(prev => [...prev.slice(1), newMemUsage])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const topProcesses = useMemo(() => {
    return [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 5)
  }, [processes])

  return (
    <div className="app-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      overflow: 'auto',
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>📊 系统监控</h2>
        <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '13px' }}>
          实时监控系统资源使用情况
        </p>
      </div>

      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            gridColumn: '1 / 2',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <GaugeChart value={cpu.usage} label="CPU" color="#3b82f6" />
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px' }}>核心数</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{cpu.cores} 核心</div>
            </div>
          </div>

          <div style={{
            gridColumn: '2 / 3',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <GaugeChart value={memory.percentage} label="内存" color="#10b981" />
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px' }}>已使用</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                {formatBytes(memory.used * 1024 * 1024)} / {formatBytes(memory.total * 1024 * 1024)}
              </div>
            </div>
          </div>

          <div style={{
            gridColumn: '3 / 4',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <GaugeChart value={disk.percentage} label="磁盘" color="#f59e0b" />
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px' }}>已使用</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                {formatBytes(disk.used * 1024 * 1024)} / {formatBytes(disk.total * 1024 * 1024)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>📈 CPU 使用趋势</span>
              <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}>{cpu.usage.toFixed(1)}%</span>
            </div>
            <MiniChart data={cpuHistory} color="#3b82f6" />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>💾 内存使用趋势</span>
              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600 }}>{memory.percentage.toFixed(1)}%</span>
            </div>
            <MiniChart data={memHistory} color="#10b981" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>🌐 网络活动</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>📤 发送</span>
                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 500 }}>
                  {formatBytes(network.bytesSent)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>📥 接收</span>
                <span style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 500 }}>
                  {formatBytes(network.bytesReceived)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>📦 发送包数</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {network.packetsSent.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>📦 接收包数</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {network.packetsReceived.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>💻 系统信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>CPU 型号</span>
                <span style={{ color: '#fff', fontSize: '13px' }}>{cpu.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>系统架构</span>
                <span style={{ color: '#fff', fontSize: '13px' }}>WebAssembly x86_64</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>内核版本</span>
                <span style={{ color: '#fff', fontSize: '13px' }}>6.15.0-web</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>运行时间</span>
                <span style={{ color: '#fff', fontSize: '13px' }}>
                  {uptime.hours}小时 {uptime.minutes}分钟
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>⚙️ 进程列表 (CPU占用Top 5)</span>
            <span style={{ color: '#888', fontSize: '12px' }}>共 {processes.length} 个进程</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topProcesses.map((process) => (
              <div
                key={process.pid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: process.status === 'running' ? '#10b981' : '#888',
                }} />
                <span style={{ width: '60px', fontFamily: 'monospace', color: '#888', fontSize: '12px' }}>
                  {process.pid}
                </span>
                <span style={{ flex: 1, color: '#fff', fontSize: '13px' }}>{process.name}</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ textAlign: 'right', width: '80px' }}>
                    <div style={{ color: '#888', fontSize: '10px' }}>CPU</div>
                    <div style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 500 }}>
                      {process.cpu.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', width: '80px' }}>
                    <div style={{ color: '#888', fontSize: '10px' }}>内存</div>
                    <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 500 }}>
                      {process.memory.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}