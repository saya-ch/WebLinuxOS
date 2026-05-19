import { useState, useEffect, useRef } from 'react'

interface Process {
  pid: number
  name: string
  cpu: number
  memory: number
  status: string
}

export default function SystemMonitor() {
  const [cpuUsage, setCpuUsage] = useState(15)
  const [memoryUsed, setMemoryUsed] = useState(3400)
  const [memoryTotal] = useState(8192)
  const [diskUsed, setDiskUsed] = useState(45)
  const [netDown, setNetDown] = useState(1.2)
  const [netUp, setNetUp] = useState(0.3)
  const [processes, setProcesses] = useState<Process[]>([])
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(60).fill(0))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const procs: Process[] = [
      { pid: 1, name: 'systemd', cpu: 0.1, memory: 12.5, status: '运行中' },
      { pid: 234, name: 'terminal', cpu: 2.3, memory: 45.2, status: '运行中' },
      { pid: 345, name: 'file-manager', cpu: 1.5, memory: 67.8, status: '运行中' },
      { pid: 456, name: 'browser', cpu: 8.7, memory: 234.5, status: '运行中' },
      { pid: 567, name: 'code-editor', cpu: 3.2, memory: 156.3, status: '运行中' },
      { pid: 678, name: 'music-player', cpu: 1.8, memory: 89.1, status: '运行中' },
      { pid: 789, name: 'settings', cpu: 0.5, memory: 34.7, status: '运行中' },
      { pid: 890, name: 'weather', cpu: 0.3, memory: 22.4, status: '休眠' },
      { pid: 901, name: 'calendar', cpu: 0.2, memory: 18.9, status: '运行中' },
      { pid: 1012, name: 'clock', cpu: 0.1, memory: 10.2, status: '运行中' },
    ]
    setProcesses(procs)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newCpu = Math.max(2, Math.min(95, cpuUsage + (Math.random() - 0.5) * 10))
      setCpuUsage(Math.round(newCpu * 10) / 10)
      setMemoryUsed(Math.round((3400 + (Math.random() - 0.5) * 200) * 10) / 10)
      setDiskUsed(Math.round((45 + (Math.random() - 0.5) * 0.5) * 10) / 10)
      setNetDown(Math.round((1.2 + (Math.random() - 0.5) * 0.5) * 10) / 10)
      setNetUp(Math.round((0.3 + (Math.random() - 0.5) * 0.2) * 10) / 10)
      setCpuHistory((prev) => [...prev.slice(1), Math.round(newCpu)])

      setProcesses((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: Math.max(0.1, Math.round((p.cpu + (Math.random() - 0.5) * 0.5) * 10) / 10),
          memory: Math.round((p.memory + (Math.random() - 0.5) * 2) * 10) / 10,
        }))
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [cpuUsage])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i < 4; i++) {
      const y = (h / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    ctx.strokeStyle = '#0078d4'
    ctx.lineWidth = 2
    ctx.beginPath()
    const stepX = w / (cpuHistory.length - 1)
    cpuHistory.forEach((val, i) => {
      const x = i * stepX
      const y = h - (val / 100) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.fillStyle = 'rgba(0, 120, 212, 0.1)'
    ctx.beginPath()
    cpuHistory.forEach((val, i) => {
      const x = i * stepX
      const y = h - (val / 100) * h
      if (i === 0) {
        ctx.moveTo(x, h)
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
  }, [cpuHistory])

  return (
    <div className="app-container app-system-monitor" style={{ background: '#1e1e1e', color: '#fff', padding: 16, overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>CPU 使用率</div>
          <div style={{ fontSize: 28, fontWeight: 300 }}>{cpuUsage}%</div>
          <canvas
            ref={canvasRef}
            width={280}
            height={60}
            style={{ width: '100%', height: 60, marginTop: 8 }}
          />
        </div>
        <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>内存</div>
          <div style={{ fontSize: 28, fontWeight: 300 }}>{memoryUsed} MB</div>
          <div style={{ fontSize: 12, color: '#888' }}>/ {memoryTotal} MB</div>
          <div style={{ marginTop: 8, height: 8, background: '#444', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(memoryUsed / memoryTotal) * 100}%`, background: 'linear-gradient(90deg, #0078d4, #00bcd4)', borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>磁盘</div>
          <div style={{ fontSize: 28, fontWeight: 300 }}>{diskUsed}%</div>
          <div style={{ fontSize: 12, color: '#888' }}>50.0 GB 总容量</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 6, background: '#444', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${diskUsed}%`, background: 'linear-gradient(90deg, #ff9800, #f44336)', borderRadius: 3 }} />
            </div>
          </div>
        </div>
        <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>网络</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#888' }}>⬇ 下载</div>
              <div style={{ fontSize: 22, fontWeight: 300 }}>{netDown} MB/s</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888' }}>⬆ 上传</div>
              <div style={{ fontSize: 22, fontWeight: 300 }}>{netUp} MB/s</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#2d2d2d', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #444', fontSize: 14, fontWeight: 600 }}>进程列表</div>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#888', borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '6px 16px' }}>PID</th>
                <th style={{ textAlign: 'left', padding: '6px 16px' }}>进程名</th>
                <th style={{ textAlign: 'right', padding: '6px 16px' }}>CPU</th>
                <th style={{ textAlign: 'right', padding: '6px 16px' }}>内存</th>
                <th style={{ textAlign: 'left', padding: '6px 16px' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((proc) => (
                <tr key={proc.pid} style={{ borderBottom: '1px solid #3a3a3a' }}>
                  <td style={{ padding: '8px 16px' }}>{proc.pid}</td>
                  <td style={{ padding: '8px 16px' }}>{proc.name}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{proc.cpu}%</td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{proc.memory} MB</td>
                  <td style={{ padding: '8px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: proc.status === '运行中' ? '#4caf50' : '#ff9800',
                      marginRight: 6,
                    }} />
                    {proc.status}
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