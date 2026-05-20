import { useState, useRef, useEffect, useCallback } from 'react'

interface Process {
  pid: number
  name: string
  cpu: number
  mem: number
  status: 'running' | 'sleeping' | 'stopped'
  user: string
}

const generateProcesses = (): Process[] => {
  const names = ['systemd', 'bash', 'node', 'chrome', 'vscode', 'python3', 'nginx', 'postgres', 'redis', 'docker', 'sshd', 'cron', 'pulseaudio', 'Xorg', 'dbus-daemon', 'NetworkManager', 'snapd', 'irqbalance', 'rsyslogd', 'accounts-daemon', 'gdm3', 'polkitd', 'udev', 'kworker/0', 'jbd2/sda1', 'ext4-rsv-conver', 'migration/0', 'ksoftirqd/0', 'rcu_sched', 'watchdog/0']
  return names.map((name, i) => ({
    pid: 100 + i * 37 + Math.floor(Math.random() * 10),
    name,
    cpu: Math.random() * 15,
    mem: Math.random() * 8 + 0.1,
    status: Math.random() > 0.2 ? 'running' as const : 'sleeping' as const,
    user: Math.random() > 0.5 ? 'root' : 'user',
  }))
}

type SortKey = 'pid' | 'name' | 'cpu' | 'mem'

export default function SystemMonitor() {
  const [processes, setProcesses] = useState<Process[]>(generateProcesses)
  const [sortKey, setSortKey] = useState<SortKey>('cpu')
  const [sortAsc, setSortAsc] = useState(false)
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(60).fill(0))
  const [memHistory, setMemHistory] = useState<number[]>(Array(60).fill(0))
  const [netHistory, setNetHistory] = useState<number[]>(Array(60).fill(0))
  const [loadAvg, setLoadAvg] = useState([0.5, 0.4, 0.3])
  const [uptime, setUptime] = useState(0)
  const [killedPids, setKilledPids] = useState<Set<number>>(new Set())

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startTimeRef = useRef(Date.now())

  const sortedProcesses = [...processes]
    .filter(p => !killedPids.has(p.pid))
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1
      if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
      return mul * ((a[sortKey] as number) - (b[sortKey] as number))
    })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const killProcess = (pid: number) => {
    setKilledPids(prev => new Set([...prev, pid]))
  }

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = canvas.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const chartH = h / 3

    const drawLineChart = (data: number[], y: number, height: number, color: string, label: string, maxVal: number) => {
      ctx.fillStyle = '#11111b'
      ctx.fillRect(0, y, w, height)

      ctx.strokeStyle = 'rgba(69, 71, 90, 0.3)'
      ctx.lineWidth = 0.5
      for (let i = 1; i <= 4; i++) {
        const gy = y + (height / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, gy)
        ctx.lineTo(w, gy)
        ctx.stroke()
      }

      ctx.fillStyle = '#6c7086'
      ctx.font = '10px sans-serif'
      ctx.fillText(label, 4, y + 14)
      ctx.fillText(`${data[data.length - 1]?.toFixed(1)}%`, w - 40, y + 14)

      const step = w / (data.length - 1)
      ctx.beginPath()
      data.forEach((val, i) => {
        const x = i * step
        const vy = y + height - (val / maxVal) * (height - 20)
        if (i === 0) ctx.moveTo(x, vy)
        else ctx.lineTo(x, vy)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.lineTo(w, y + height)
      ctx.lineTo(0, y + height)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, y, 0, y + height)
      grad.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'))
      grad.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'))
      ctx.fillStyle = grad
      ctx.fill()
    }

    drawLineChart(cpuHistory, 0, chartH, 'rgb(243, 139, 168)', 'CPU', 100)
    drawLineChart(memHistory, chartH, chartH, 'rgb(137, 180, 250)', 'MEM', 100)
    drawLineChart(netHistory, chartH * 2, chartH, 'rgb(166, 227, 161)', 'NET', 100)
  }, [cpuHistory, memHistory, netHistory])

  useEffect(() => {
    const interval = setInterval(() => {
      const cpuVal = 20 + Math.random() * 40 + Math.sin(Date.now() / 5000) * 15
      const memVal = 45 + Math.random() * 15 + Math.sin(Date.now() / 8000) * 8
      const netVal = 10 + Math.random() * 30 + Math.sin(Date.now() / 3000) * 10

      setCpuHistory(prev => [...prev.slice(1), Math.min(100, Math.max(0, cpuVal))])
      setMemHistory(prev => [...prev.slice(1), Math.min(100, Math.max(0, memVal))])
      setNetHistory(prev => [...prev.slice(1), Math.min(100, Math.max(0, netVal))])

      setLoadAvg([
        0.3 + Math.random() * 1.2,
        0.3 + Math.random() * 1.0,
        0.2 + Math.random() * 0.8,
      ])

      setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000))

      setProcesses(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 3),
        mem: Math.max(0.1, p.mem + (Math.random() - 0.5) * 0.5),
        status: Math.random() > 0.05 ? p.status : (p.status === 'running' ? 'sleeping' as const : 'running' as const),
      })))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}h ${m}m ${sec}s`
  }

  const currentCpu = cpuHistory[cpuHistory.length - 1]
  const currentMem = memHistory[memHistory.length - 1]
  const currentNet = netHistory[netHistory.length - 1]

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ width: 300, borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', fontSize: 13, fontWeight: 700 }}>
          系统监控
        </div>
        <div style={{ flex: 1 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #313244', fontSize: 11 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <span style={{ color: '#f38ba8' }}>CPU:</span> {currentCpu?.toFixed(1)}%
            </div>
            <div>
              <span style={{ color: '#89b4fa' }}>MEM:</span> {currentMem?.toFixed(1)}%
            </div>
            <div>
              <span style={{ color: '#a6e3a1' }}>NET:</span> {currentNet?.toFixed(1)}%
            </div>
            <div>
              <span style={{ color: '#f9e2af' }}>UP:</span> {formatUptime(uptime)}
            </div>
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={{ color: '#cba6f7' }}>Load:</span> {loadAvg.map(v => v.toFixed(2)).join(' / ')}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '6px 12px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>进程列表</span>
          <span style={{ color: '#6c7086', fontSize: 11 }}>({sortedProcesses.length})</span>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#181825', zIndex: 1 }}>
                {[
                  { key: 'pid' as SortKey, label: 'PID', width: 60 },
                  { key: 'name' as SortKey, label: '名称', width: undefined },
                  { key: 'cpu' as SortKey, label: 'CPU%', width: 70 },
                  { key: 'mem' as SortKey, label: 'MEM%', width: 70 },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    style={{
                      padding: '6px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #313244',
                      color: sortKey === col.key ? '#89b4fa' : '#6c7086', fontWeight: 600, width: col.width,
                      userSelect: 'none',
                    }}>
                    {col.label}{sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #313244', color: '#6c7086', width: 60 }}>状态</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #313244', color: '#6c7086', width: 50 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map(p => (
                <tr key={p.pid} style={{ borderBottom: '1px solid #31324422' }}>
                  <td style={{ padding: '4px 8px', color: '#6c7086' }}>{p.pid}</td>
                  <td style={{ padding: '4px 8px' }}>{p.name}</td>
                  <td style={{ padding: '4px 8px', color: p.cpu > 10 ? '#f38ba8' : p.cpu > 5 ? '#f9e2af' : '#a6e3a1' }}>
                    {p.cpu.toFixed(1)}
                  </td>
                  <td style={{ padding: '4px 8px', color: p.mem > 5 ? '#f38ba8' : p.mem > 3 ? '#f9e2af' : '#a6e3a1' }}>
                    {p.mem.toFixed(1)}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 3, fontSize: 10,
                      background: p.status === 'running' ? '#a6e3a122' : '#6c708622',
                      color: p.status === 'running' ? '#a6e3a1' : '#6c7086',
                    }}>
                      {p.status === 'running' ? '运行' : '休眠'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <button onClick={() => killProcess(p.pid)}
                      style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 11, padding: '2px 4px' }}>
                      终止
                    </button>
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
