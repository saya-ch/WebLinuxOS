import { useState, useEffect, useRef } from 'react'

const MAX_POINTS = 60

type TabKey = 'overview' | 'cpu' | 'memory' | 'network' | 'storage' | 'device'

function buildPath(points: number[], width: number, height: number, max: number, min: number): string {
  if (points.length === 0) return ''
  const span = max - min || 1
  const stepX = points.length > 1 ? width / (points.length - 1) : 0
  return points
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / span) * height
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function buildAreaPath(points: number[], width: number, height: number, max: number, min: number): string {
  if (points.length === 0) return ''
  const line = buildPath(points, width, height, max, min)
  const stepX = points.length > 1 ? width / (points.length - 1) : 0
  return `${line} L${(points.length - 1) * stepX},${height} L0,${height} Z`
}

interface ChartProps {
  data: number[]
  color?: string
  height?: number
  label?: string
  unit?: string
  yMin?: number
  yMax?: number
}

function Chart({ data, color = '#7c6cf0', height = 160, label = '', unit = '', yMin, yMax }: ChartProps) {
  const width = 500
  const current = data[data.length - 1] ?? 0
  const computedMin = yMin !== undefined ? yMin : Math.min(...data, 0)
  const computedMax = yMax !== undefined ? yMax : Math.max(...data, 1)
  const linePath = buildPath(data, width, height - 20, computedMax, computedMin)
  const areaPath = buildAreaPath(data, width, height - 20, computedMax, computedMin)
  const gradId = `grad-${color.replace('#', '')}`
  const lineId = `line-${color.replace('#', '')}`

  const gridY = [0.25, 0.5, 0.75]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {current.toFixed(unit === '%' ? 1 : 0)}{unit}
        </span>
      </div>
      <div style={{ background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)', padding: 8 }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
          {gridY.map((g, i) => (
            <line
              key={i}
              x1={0}
              x2={width}
              y1={(height - 20) * g}
              y2={(height - 20) * g}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
          ))}
          <line x1={0} x2={width} y1={height - 20} y2={height - 20} stroke="rgba(255,255,255,0.1)" />
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={`url(#${lineId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const SystemMonitorPro: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview')
  const [cpuData, setCpuData] = useState<number[]>([])
  const [_fpsData, setFpsData] = useState<number[]>([])
  const [memData, setMemData] = useState<number[]>([])
  const [currentCPU, setCurrentCPU] = useState<number>(0)
  const [currentFPS, setCurrentFPS] = useState<number>(0)
  const [currentMem, setCurrentMem] = useState<{ used: number; total: number; available: boolean }>({ used: 0, total: 0, available: false })
  const [network, setNetwork] = useState<{ type: string; downlink: string; effectiveType: string; rtt: number; online: boolean }>({
    type: '未知', downlink: '—', effectiveType: '—', rtt: 0, online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  })
  const [storage, setStorage] = useState<{ quota: number; usage: number; available: boolean; localStorageUsed: number; localStorageQuota: number }>({
    quota: 0, usage: 0, available: false, localStorageUsed: 0, localStorageQuota: 5 * 1024 * 1024,
  })

  const cpuSamplesRef = useRef<number[]>([])
  const lastTickRef = useRef<number>(performance.now())
  const frameCountRef = useRef<number>(0)
  const lastFpsRef = useRef<number>(performance.now())
  const rafRef = useRef<number>(0)
  const sampleTimerRef = useRef<number>(0)
  const updateTimerRef = useRef<number>(0)

  useEffect(() => {
    const tick = () => {
      const now = performance.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      cpuSamplesRef.current.push(delta)
      if (cpuSamplesRef.current.length > 300) cpuSamplesRef.current.shift()
      frameCountRef.current++
      if (now - lastFpsRef.current >= 1000) {
        const elapsed = (now - lastFpsRef.current) / 1000
        const fps = frameCountRef.current / Math.max(elapsed, 0.01)
        setCurrentFPS(fps)
        setFpsData((prev) => {
          const next = [...prev, fps]
          return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next
        })
        frameCountRef.current = 0
        lastFpsRef.current = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    sampleTimerRef.current = window.setInterval(() => {
      const samples = cpuSamplesRef.current.slice(-10)
      const sum = samples.reduce((a, b) => a + b, 0)
      const avgFrameGap = samples.length > 0 ? sum / samples.length : 16
      const ideal = 16.67
      const busy = Math.min(100, Math.max(0, (avgFrameGap - ideal) / ideal * 100 + (avgFrameGap > 25 ? 15 : 0)))
      const smoothed = Math.min(100, Math.max(0, busy))
      setCurrentCPU(smoothed)
      setCpuData((prev) => {
        const next = [...prev, smoothed]
        return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next
      })

      const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit?: number } }
      if (perf.memory) {
        const used = perf.memory.usedJSHeapSize / (1024 * 1024)
        const total = (perf.memory.jsHeapSizeLimit || perf.memory.totalJSHeapSize) / (1024 * 1024)
        setCurrentMem({ used, total, available: true })
        setMemData((prev) => {
          const next = [...prev, used]
          return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next
        })
      } else {
        setCurrentMem({ used: 0, total: 0, available: false })
      }

      const conn = (navigator as unknown as { connection?: { effectiveType: string; downlink: number; rtt: number; type?: string } }).connection
      if (conn) {
        setNetwork({
          type: conn.type || '浏览器',
          effectiveType: conn.effectiveType || '—',
          downlink: conn.downlink ? `${conn.downlink} Mbps` : '—',
          rtt: conn.rtt || 0,
          online: navigator.onLine,
        })
      } else {
        setNetwork((n) => ({ ...n, online: navigator.onLine }))
      }
    }, 1000)

    updateTimerRef.current = window.setInterval(async () => {
      try {
        if ('storage' in navigator && 'estimate' in (navigator as { storage: { estimate: () => Promise<{ quota: number; usage: number }> } }).storage) {
          const est = await (navigator as { storage: { estimate: () => Promise<{ quota: number; usage: number }> } }).storage.estimate()
          let lsUsed = 0
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i) || ''
              const v = localStorage.getItem(k) || ''
              lsUsed += k.length + v.length
            }
            lsUsed *= 2
          } catch {
            // ignore
          }
          setStorage({ quota: est.quota, usage: est.usage, available: true, localStorageUsed: lsUsed, localStorageQuota: 5 * 1024 * 1024 })
        }
      } catch {
        // ignore
      }
    }, 2000)

    const handleOnline = () => setNetwork((n) => ({ ...n, online: true }))
    const handleOffline = () => setNetwork((n) => ({ ...n, online: false }))
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(sampleTimerRef.current)
      clearInterval(updateTimerRef.current)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: '概览', icon: '📊' },
    { key: 'cpu', label: 'CPU', icon: '⚡' },
    { key: 'memory', label: '内存', icon: '💾' },
    { key: 'network', label: '网络', icon: '🌐' },
    { key: 'storage', label: '存储', icon: '🗂️' },
    { key: 'device', label: '设备', icon: '🖥️' },
  ]

  const tabBtn = (t: TabKey) => ({
    padding: '10px 16px',
    background: tab === t ? 'var(--accent-bg)' : 'transparent',
    color: tab === t ? 'var(--accent)' : 'var(--text-primary)',
    border: 'none',
    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background 0.15s',
  })

  const fmtBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let n = bytes
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
  }

  return (
    <div className="app-shell" style={{ gap: 0 }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--window-border)', flexWrap: 'wrap', flexShrink: 0 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(t.key) as React.CSSProperties}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {(tab === 'overview' || tab === 'cpu') && (
          <div className="app-card" style={{ padding: 16, marginBottom: 16 }}>
            <Chart data={cpuData} color="#7c6cf0" label="主线程忙碌度 (CPU 估算)" unit="%" yMin={0} yMax={100} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 10 }}>
              <MetricTile title="当前 CPU" value={`${currentCPU.toFixed(1)}%`} color="#7c6cf0" />
              <MetricTile title="平均 CPU" value={`${(cpuData.reduce((a, b) => a + b, 0) / Math.max(cpuData.length, 1)).toFixed(1)}%`} color="#a78bfa" />
              <MetricTile title="采样点" value={`${cpuData.length}`} color="#64748b" />
              <MetricTile title="FPS" value={`${currentFPS.toFixed(0)}`} color="#10b981" />
            </div>
          </div>
        )}

        {(tab === 'overview' || tab === 'memory') && (
          <div className="app-card" style={{ padding: 16, marginBottom: 16 }}>
            {currentMem.available ? (
              <>
                <Chart data={memData} color="#f59e0b" label="JS Heap 占用 (MB)" unit=" MB" yMin={0} yMax={Math.max(currentMem.total, 1)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 10 }}>
                  <MetricTile title="已用" value={`${currentMem.used.toFixed(1)} MB`} color="#f59e0b" />
                  <MetricTile title="总量" value={`${currentMem.total.toFixed(1)} MB`} color="#fbbf24" />
                  <MetricTile title="占用率" value={`${currentMem.total > 0 ? ((currentMem.used / currentMem.total) * 100).toFixed(1) : '0'}%`} color="#f97316" />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                当前浏览器未暴露 <code style={{ fontFamily: 'monospace' }}>performance.memory</code>（通常非 Chromium 系）。无法读取 JS Heap 内存使用。
              </div>
            )}
          </div>
        )}

        {(tab === 'overview' || tab === 'network') && (
          <div className="app-card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>🌐 网络状态</h3>
              <span
                className="chip"
                style={{
                  background: network.online ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: network.online ? '#10b981' : '#ef4444',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                }}
              >
                {network.online ? '● 在线' : '○ 离线'}
              </span>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
              <InfoRow label="有效网络类型" value={network.effectiveType.toUpperCase()} />
              <InfoRow label="下行速率" value={network.downlink} />
              <InfoRow label="RTT (往返延迟)" value={network.rtt ? `${network.rtt} ms` : '—'} />
              <InfoRow label="连接类型" value={network.type} />
              <InfoRow label="浏览器在线状态" value={network.online ? '在线' : '离线'} />
              <InfoRow label="User-Agent" value={(navigator.userAgent || '—').slice(0, 60) + (navigator.userAgent && navigator.userAgent.length > 60 ? '...' : '')} mono={false} />
            </div>
          </div>
        )}

        {(tab === 'overview' || tab === 'storage') && (
          <div className="app-card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>🗂️ 存储使用</h3>
            </div>
            {storage.available ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 12 }}>
                  <MetricTile title="配额" value={fmtBytes(storage.quota)} color="#06b6d4" />
                  <MetricTile title="已用" value={fmtBytes(storage.usage)} color="#0ea5e9" />
                  <MetricTile title="使用率" value={storage.quota > 0 ? `${((storage.usage / storage.quota) * 100).toFixed(2)}%` : '—'} color="#22d3ee" />
                </div>
                <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 12, border: '1px solid var(--window-border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: 6, color: 'var(--text-primary)', fontSize: 13 }}>localStorage 使用</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{fmtBytes(storage.localStorageUsed)} / {fmtBytes(storage.localStorageQuota)}</span>
                    <span>{((storage.localStorageUsed / storage.localStorageQuota) * 100).toFixed(2)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (storage.localStorageUsed / storage.localStorageQuota) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                浏览器未提供 <code>navigator.storage.estimate()</code> 或读取失败。
              </div>
            )}
          </div>
        )}

        {tab === 'cpu' && (
          <div className="app-card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, marginBottom: 12 }}>⚡ CPU 性能指标</h3>
            <div style={{ background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
              <InfoRow label="当前主线程忙碌度" value={`${currentCPU.toFixed(1)}%`} />
              <InfoRow label="最近 10 秒峰值" value={`${cpuData.length > 0 ? Math.max(...cpuData).toFixed(1) : '0'}%`} />
              <InfoRow label="10 秒平均" value={`${(cpuData.reduce((a, b) => a + b, 0) / Math.max(cpuData.length, 1)).toFixed(1)}%`} />
              <InfoRow label="采样间隔" value="1 秒" />
              <InfoRow label="硬件并发" value={navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} 个逻辑核心` : '—'} />
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, padding: 12, background: 'rgba(139,124,240,0.08)', borderRadius: 8 }}>
              <strong>说明：</strong> 由于浏览器安全限制，Web 应用无法直接读取系统 CPU 使用率。此处通过测量 <code>requestAnimationFrame</code> 帧间隔估算主线程忙碌程度，可反映页面自身的 JS/渲染负载。
            </div>
          </div>
        )}

        {(tab === 'overview' || tab === 'device') && (
          <div className="app-card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, marginBottom: 12 }}>🖥️ 设备信息</h3>
            <div style={{ background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
              <InfoRow label="屏幕分辨率" value={`${screen.width} × ${screen.height}`} />
              <InfoRow label="视口尺寸" value={`${window.innerWidth} × ${window.innerHeight}`} />
              <InfoRow label="像素比" value={`${window.devicePixelRatio}x`} />
              <InfoRow label="颜色深度" value={`${screen.colorDepth} bit`} />
              <InfoRow label="逻辑核心" value={navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '—'} />
              <InfoRow label="设备内存" value={(navigator as unknown as { deviceMemory?: number }).deviceMemory ? `${(navigator as unknown as { deviceMemory: number }).deviceMemory} GB` : '—'} />
              <InfoRow label="时区" value={Intl.DateTimeFormat().resolvedOptions().timeZone || '—'} mono={false} />
              <InfoRow label="语言" value={`${navigator.language}${navigator.languages ? ` / ${navigator.languages.join(', ')}` : ''}`} mono={false} />
              <InfoRow label="平台" value={navigator.platform || '—'} mono={false} />
              <InfoRow label="当前 FPS" value={`${currentFPS.toFixed(0)} fps`} />
              <InfoRow label="在线状态" value={network.online ? '在线' : '离线'} mono={false} />
              <InfoRow label="UA" value={(navigator.userAgent || '—').slice(0, 80) + (navigator.userAgent && navigator.userAgent.length > 80 ? '...' : '')} mono={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricTile({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: '#1a1a2e',
        border: `1px solid ${color}33`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 0.3 }}>{title}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

export default SystemMonitorPro
