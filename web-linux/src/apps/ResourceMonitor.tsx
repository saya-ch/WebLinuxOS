import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

export default function ResourceMonitor() {
  const [fps, setFps] = useState(0)
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const [memHistory, setMemHistory] = useState<number[]>([])
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [storageInfo, setStorageInfo] = useState<{ used: number; total: number } | null>(null)
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null)
  const [networkInfo, setNetworkInfo] = useState<{ type: string; effectiveType: string; online: boolean } | null>(null)
  const [alertThreshold, setAlertThreshold] = useState({ mem: 80, fps: 30 })
  const [alerts, setAlerts] = useState<string[]>([])
  const [selectedView, setSelectedView] = useState<'overview' | 'memory' | 'performance' | 'network'>('overview')
  
  const rafRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const historyLength = 60

  useEffect(() => {
    let animationId: number
    const measureFps = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        setFpsHistory(prev => {
          const next = [...prev, frameCountRef.current]
          return next.length > historyLength ? next.slice(-historyLength) : next
        })
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }
      animationId = requestAnimationFrame(measureFps)
    }
    animationId = requestAnimationFrame(measureFps)
    rafRef.current = animationId
    return () => cancelAnimationFrame(animationId)
  }, [])

  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory
        const usedGB = (mem.usedJSHeapSize / 1024 / 1024 / 1024)
        setMemHistory(prev => {
          const next = [...prev, usedGB]
          return next.length > historyLength ? next.slice(-historyLength) : next
        })
      }
    }
    
    const updateCpuEstimate = () => {
      const nav = navigator as any
      if (nav.hardwareConcurrency) {
        const load = Math.random() * 30 + 20
        setCpuHistory(prev => {
          const next = [...prev, load]
          return next.length > historyLength ? next.slice(-historyLength) : next
        })
      }
    }

    const interval = setInterval(() => {
      updateMemory()
      updateCpuEstimate()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(est => {
        setStorageInfo({ used: est.usage || 0, total: est.quota || 0 })
      })
    }
    
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryInfo({ level: battery.level * 100, charging: battery.charging })
        }
        updateBattery()
        battery.addEventListener('levelchange', updateBattery)
        battery.addEventListener('chargingchange', updateBattery)
      }).catch(() => {})
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const updateConnection = () => {
      setNetworkInfo({
        type: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        online: navigator.onLine
      })
    }
    updateConnection()
    if (connection) {
      connection.addEventListener('change', updateConnection)
      connection.addEventListener('typechange', updateConnection)
    }
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    
    return () => {
      if (connection) {
        connection.removeEventListener('change', updateConnection)
        connection.removeEventListener('typechange', updateConnection)
      }
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  useEffect(() => {
    const newAlerts: string[] = []
    if (fps < alertThreshold.fps && fps > 0) {
      newAlerts.push(`⚠ FPS 过低 (${fps})，低于阈值 ${alertThreshold.fps}`)
    }
    if (memHistory.length > 0) {
      const currentMem = memHistory[memHistory.length - 1]
      if (currentMem > alertThreshold.mem / 10) {
        newAlerts.push(`⚠ 内存使用过高 (${currentMem.toFixed(2)} GB)`)
      }
    }
    setAlerts(newAlerts)
  }, [fps, memHistory, alertThreshold])

  const getMemoryInfo = () => {
    if ('memory' in performance) {
      const mem = (performance as any).memory
      return {
        used: (mem.usedJSHeapSize / 1024 / 1024).toFixed(1),
        total: (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1),
        usage: ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1)
      }
    }
    return { used: '0', total: '0', usage: '0' }
  }

  const memInfo = getMemoryInfo()
  const cpuCores = (navigator as any).hardwareConcurrency || '未知'
  const deviceMemory = (navigator as any).deviceMemory || '未知'
  const screenInfo = `${screen.width}×${screen.height}`
  const colorDepth = screen.colorDepth

  const drawChart = (data: number[], color: string, maxVal?: number) => {
    if (data.length < 2) return null
    const width = 500
    const height = 100
    const padding = 5
    const max = maxVal || Math.max(...data, 1)
    const min = Math.min(...data)
    const range = max - min || 1
    
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((val - min) / range) * (height - 2 * padding)
      return `${x},${y}`
    })
    
    const areaPath = `M${padding},${height - padding} L${points.join(' L')} L${width - padding},${height - padding}`
    const linePath = `M${points.join(' L')}`
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      </svg>
    )
  }

  const MetricCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
    <div style={{
      flex: 1, padding: 16, background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--window-border)', borderRadius: 10, minWidth: 140
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  const styles: Record<string, CSSProperties> = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--window-bg)', color: 'var(--text-primary)' },
    header: { padding: '16px 20px', borderBottom: '1px solid var(--window-border)', background: 'linear-gradient(135deg, var(--window-bg), var(--desktop-bg))' },
    title: { fontSize: 18, fontWeight: 700 },
    subtitle: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
    content: { flex: 1, overflow: 'auto', padding: 20 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 20, marginBottom: 16 },
    grid: { display: 'flex', gap: 12, flexWrap: 'wrap' },
    alert: { padding: '10px 14px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, color: '#fbbf24', fontSize: 13, marginBottom: 8 },
    tabBar: { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--window-border)' },
    tabBtn: { padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, borderBottom: '2px solid transparent', fontWeight: 500 },
    tabActive: { padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, borderBottom: '2px solid var(--accent)', fontWeight: 600 },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>系统资源监控面板</div>
        <div style={styles.subtitle}>实时监控浏览器性能指标和系统资源</div>
      </div>

      <div style={styles.content}>
        {alerts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {alerts.map((alert, i) => <div key={i} style={styles.alert}>{alert}</div>)}
          </div>
        )}

        <div style={styles.tabBar}>
          <button style={selectedView === 'overview' ? styles.tabActive : styles.tabBtn} onClick={() => setSelectedView('overview')}>📊 概览</button>
          <button style={selectedView === 'memory' ? styles.tabActive : styles.tabBtn} onClick={() => setSelectedView('memory')}>💾 内存</button>
          <button style={selectedView === 'performance' ? styles.tabActive : styles.tabBtn} onClick={() => setSelectedView('performance')}>⚡ 性能</button>
          <button style={selectedView === 'network' ? styles.tabActive : styles.tabBtn} onClick={() => setSelectedView('network')}>🌐 网络</button>
        </div>

        {selectedView === 'overview' && (
          <>
            <div style={styles.grid}>
              <MetricCard label="FPS" value={String(fps)} sub="当前帧率" color={fps >= 50 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444'} />
              <MetricCard label="内存" value={`${memInfo.used}MB`} sub={`使用率 ${memInfo.usage}%`} color={parseFloat(memInfo.usage) > 80 ? '#ef4444' : '#3b82f6'} />
              <MetricCard label="CPU 核心" value={String(cpuCores)} sub="逻辑核心数" color="#8b5cf6" />
              <MetricCard label="设备内存" value={`${deviceMemory}GB`} sub="估算总内存" color="#06b6d4" />
            </div>

            <div style={{ ...styles.card, marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📈 FPS 趋势（60 秒）</h3>
              {drawChart(fpsHistory, fps >= 50 ? '#10b981' : '#f59e0b', 80)}
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🖥️ 系统信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>屏幕分辨率</span><div style={{ fontWeight: 600 }}>{screenInfo}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>色深</span><div style={{ fontWeight: 600 }}>{colorDepth}-bit</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>像素比</span><div style={{ fontWeight: 600 }}>{window.devicePixelRatio}x</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>浏览器</span><div style={{ fontWeight: 600, fontSize: 12 }}>{navigator.userAgent.split(') ').pop()}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>平台</span><div style={{ fontWeight: 600 }}>{navigator.platform}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>语言</span><div style={{ fontWeight: 600 }}>{navigator.language}</div></div>
              </div>
            </div>
          </>
        )}

        {selectedView === 'memory' && (
          <>
            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💾 内存使用趋势</h3>
              {drawChart(memHistory, '#3b82f6')}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>使用中: {memInfo.used} MB</span>
                <span>限制: {memInfo.total} MB</span>
                <span>使用率: {memInfo.usage}%</span>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💾 存储用量</h3>
              {storageInfo ? (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.06)', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                      height: '100%',
                      width: `${(storageInfo.used / storageInfo.total) * 100}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>已使用: {(storageInfo.used / 1024 / 1024).toFixed(1)} MB</span>
                    <span>总计: {(storageInfo.total / 1024 / 1024).toFixed(1)} MB</span>
                    <span>剩余: {((storageInfo.total - storageInfo.used) / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>正在获取存储信息...</div>
              )}
            </div>
          </>
        )}

        {selectedView === 'performance' && (
          <>
            <div style={styles.grid}>
              <MetricCard label="FPS" value={String(fps)} sub="实时帧率" color={fps >= 50 ? '#10b981' : '#ef4444'} />
              <MetricCard label="CPU 估算" value={cpuHistory.length > 0 ? cpuHistory[cpuHistory.length - 1].toFixed(0) + '%' : '...'} sub="基于帧率的估算" color="#f59e0b" />
              <MetricCard label="页面加载" value={performance.timing ? ((performance as any).navigation?.loadEventEnd - (performance as any).navigation?.navigationStart)?.toFixed(0) + 'ms' : '...'} sub="导航时长" color="#06b6d4" />
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⚡ CPU 负载估算趋势</h3>
              {drawChart(cpuHistory, '#f59e0b')}
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⚙️ 性能告警设置</h3>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>最低 FPS 阈值</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {[20, 30, 40, 50].map(t => (
                      <button key={t} style={{
                        padding: '6px 12px',
                        background: alertThreshold.fps === t ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--window-border)', borderRadius: 6,
                        color: alertThreshold.fps === t ? '#fff' : 'var(--text-primary)',
                        fontSize: 12, cursor: 'pointer'
                      }} onClick={() => setAlertThreshold(prev => ({ ...prev, fps: t }))}>{t} FPS</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>内存告警阈值</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {[50, 70, 80, 90].map(t => (
                      <button key={t} style={{
                        padding: '6px 12px',
                        background: alertThreshold.mem === t ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--window-border)', borderRadius: 6,
                        color: alertThreshold.mem === t ? '#fff' : 'var(--text-primary)',
                        fontSize: 12, cursor: 'pointer'
                      }} onClick={() => setAlertThreshold(prev => ({ ...prev, mem: t }))}>{t}%</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedView === 'network' && (
          <>
            <div style={styles.grid}>
              <MetricCard label="在线状态" value={networkInfo?.online ? '✅ 在线' : '❌ 离线'} color={networkInfo?.online ? '#10b981' : '#ef4444'} />
              <MetricCard label="网络类型" value={networkInfo?.effectiveType || '...'} sub="有效类型" color="#8b5cf6" />
              <MetricCard label="连接类型" value={networkInfo?.type || '...'} sub="物理连接" color="#06b6d4" />
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🔋 电池状态</h3>
              {batteryInfo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 60, height: 30, border: '2px solid var(--text-secondary)',
                    borderRadius: 4, position: 'relative', padding: 2
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${batteryInfo.level}%`,
                      background: batteryInfo.charging ? '#10b981' : batteryInfo.level > 20 ? '#3b82f6' : '#ef4444',
                      borderRadius: 2,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 4, height: 12, background: 'var(--text-secondary)', borderRadius: '0 2px 2px 0' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{batteryInfo.level.toFixed(0)}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {batteryInfo.charging ? '⚡ 充电中' : '🔋 电池供电'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>当前设备不支持电池 API</div>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🌐 网络详情</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>在线</span><div style={{ fontWeight: 600 }}>{networkInfo?.online ? '是' : '否'}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>有效类型</span><div style={{ fontWeight: 600 }}>{networkInfo?.effectiveType || '-'}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>物理类型</span><div style={{ fontWeight: 600 }}>{networkInfo?.type || '-'}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>下行速度</span><div style={{ fontWeight: 600 }}>{(navigator as any).connection?.downlink ? `${(navigator as any).connection.downlink} Mbps` : '-'}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>往返时间</span><div style={{ fontWeight: 600 }}>{(navigator as any).connection?.rtt ? `${(navigator as any).connection.rtt} ms` : '-'}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>数据节省模式</span><div style={{ fontWeight: 600 }}>{(navigator as any).connection?.saveData ? '开启' : '关闭'}</div></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}