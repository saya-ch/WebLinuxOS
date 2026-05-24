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
  const [cpuCores, setCpuCores] = useState<number[]>([12, 18, 15, 22, 8, 25, 14, 19])
  const [memoryUsed, setMemoryUsed] = useState(3400)
  const [memoryTotal] = useState(8192)
  const [diskUsed, setDiskUsed] = useState(45)
  const [netDown, setNetDown] = useState(1.2)
  const [netUp, setNetUp] = useState(0.3)
  const [processes, setProcesses] = useState<Process[]>([])
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(60).fill(0))
  const [memHistory, setMemHistory] = useState<number[]>(Array(60).fill(0))
  const [netHistoryDown, setNetHistoryDown] = useState<number[]>(Array(60).fill(0))
  const [netHistoryUp, setNetHistoryUp] = useState<number[]>(Array(60).fill(0))
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'performance'>('overview')
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null)
  const memCanvasRef = useRef<HTMLCanvasElement>(null)
  const netCanvasRef = useRef<HTMLCanvasElement>(null)

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
      { pid: 1123, name: 'system-monitor', cpu: 1.2, memory: 42.8, status: '运行中' },
      { pid: 1234, name: 'about', cpu: 0.3, memory: 15.6, status: '运行中' },
    ]
    requestAnimationFrame(() => {
      setProcesses(procs)
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prevCpu) => {
        const newCpu = Math.max(2, Math.min(95, prevCpu + (Math.random() - 0.5) * 10))
        return Math.round(newCpu * 10) / 10
      })
      
      setCpuCores(prev => prev.map(c => Math.max(2, Math.min(98, c + (Math.random() - 0.5) * 8))))
      
      const memVal = Math.round((3400 + (Math.random() - 0.5) * 200) * 10) / 10
      setMemoryUsed(memVal)
      
      setDiskUsed(Math.round((45 + (Math.random() - 0.5) * 0.5) * 10) / 10)
      
      const newDown = Math.round((1.2 + (Math.random() - 0.5) * 0.5) * 10) / 10
      const newUp = Math.round((0.3 + (Math.random() - 0.5) * 0.2) * 10) / 10
      setNetDown(newDown)
      setNetUp(newUp)
      
      setCpuHistory((prev) => {
        const lastVal = prev[prev.length - 1]
        const newVal = Math.max(2, Math.min(95, lastVal + (Math.random() - 0.5) * 10))
        return [...prev.slice(1), Math.round(newVal)]
      })
      
      setMemHistory(prev => {
        const lastVal = prev[prev.length - 1]
        const newVal = Math.max(30, Math.min(90, lastVal + (Math.random() - 0.5) * 5))
        return [...prev.slice(1), Math.round(newVal)]
      })
      
      setNetHistoryDown(prev => {
        const lastVal = prev[prev.length - 1]
        const newVal = Math.max(0, Math.min(10, lastVal + (Math.random() - 0.5) * 2))
        return [...prev.slice(1), Math.round(newVal * 10) / 10]
      })
      
      setNetHistoryUp(prev => {
        const lastVal = prev[prev.length - 1]
        const newVal = Math.max(0, Math.min(5, lastVal + (Math.random() - 0.5) * 1))
        return [...prev.slice(1), Math.round(newVal * 10) / 10]
      })

      setProcesses((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: Math.max(0.1, Math.round((p.cpu + (Math.random() - 0.5) * 0.5) * 10) / 10),
          memory: Math.round((p.memory + (Math.random() - 0.5) * 2) * 10) / 10,
        }))
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const drawChart = (canvas: HTMLCanvasElement | null, data: number[], color: string, maxVal: number = 100) => {
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

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    const stepX = w / (data.length - 1)
    data.forEach((val, i) => {
      const x = i * stepX
      const y = h - (val / maxVal) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.fillStyle = color.replace(')', ', 0.1)').replace('rgb', 'rgba')
    ctx.beginPath()
    data.forEach((val, i) => {
      const x = i * stepX
      const y = h - (val / maxVal) * h
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
  }

  useEffect(() => {
    drawChart(cpuCanvasRef.current, cpuHistory, '#0078d4')
  }, [cpuHistory])
  
  useEffect(() => {
    drawChart(memCanvasRef.current, memHistory, '#10b981')
  }, [memHistory])
  
  useEffect(() => {
    if (netCanvasRef.current) {
      const canvas = netCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      
      // Draw grid
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      for (let i = 0; i < 4; i++) {
        const y = (h / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      
      const maxNet = Math.max(...netHistoryDown, ...netHistoryUp, 1)
      const stepX = w / (netHistoryDown.length - 1)
      
      // Draw download
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      ctx.beginPath()
      netHistoryDown.forEach((val, i) => {
        const x = i * stepX
        const y = h - (val / maxNet) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      
      // Draw upload
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      netHistoryUp.forEach((val, i) => {
        const x = i * stepX
        const y = h - (val / maxNet) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
  }, [netHistoryDown, netHistoryUp])

  return (
    <div className="app-container app-system-monitor" style={{ background: '#1e1e1e', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        {(['overview', 'processes', 'performance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: activeTab === tab ? '#0078d4' : '#2d2d2d',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.2s'
            }}
          >
            {tab === 'overview' ? '概览' : tab === 'processes' ? '进程' : '性能'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>CPU 使用率</div>
                <div style={{ fontSize: 28, fontWeight: 300 }}>{cpuUsage}%</div>
                <canvas
                  ref={cpuCanvasRef}
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
                  <div style={{ height: '100%', width: `${(memoryUsed / memoryTotal) * 100}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 4, transition: 'width 1s ease' }} />
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

            <div style={{ background: '#2d2d2d', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>CPU 核心使用 (8 核)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {cpuCores.map((core, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>核心 {i + 1}</div>
                    <div style={{ 
                      width: '100%', 
                      height: 40, 
                      background: '#444', 
                      borderRadius: 4, 
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ 
                        width: '100%', 
                        height: `${core}%`, 
                        background: `linear-gradient(to top, #0078d4, #00bcd4)`,
                        transition: 'height 0.5s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, fontFamily: 'monospace' }}>{core}%</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'processes' && (
          <div style={{ background: '#2d2d2d', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #444', fontSize: 14, fontWeight: 600 }}>进程列表</div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#2d2d2d' }}>
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
        )}

        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>CPU 历史</div>
              <canvas
                ref={cpuCanvasRef}
                width={600}
                height={120}
                style={{ width: '100%', height: 120 }}
              />
            </div>
            <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>内存使用</div>
              <canvas
                ref={memCanvasRef}
                width={600}
                height={120}
                style={{ width: '100%', height: 120 }}
              />
            </div>
            <div style={{ padding: 16, background: '#2d2d2d', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>网络带宽</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: '#8b5cf6' }}>⬇ 下载</span>
                  <span style={{ color: '#f59e0b' }}>⬆ 上传</span>
                </div>
              </div>
              <canvas
                ref={netCanvasRef}
                width={600}
                height={120}
                style={{ width: '100%', height: 120 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}