import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Activity, Cpu, HardDrive, Wifi, Gauge,
  TrendingDown, RefreshCw, AlertTriangle, CheckCircle,
  Settings, Download, Sparkles, Play, Pause, BarChart3
} from 'lucide-react'

interface SystemMetrics {
  fps: number
  fpsMin: number
  fpsMax: number
  memoryUsed: number
  memoryTotal: number
  memoryPercent: number
  cpuEstimate: number
  storageUsed: number
  storageQuota: number
  storagePercent: number
  networkType: string
  downlink: number
  online: boolean
  batteryLevel: number | null
  batteryCharging: boolean | null
  devicePixelRatio: number
  screenWidth: number
  screenHeight: number
  colorDepth: number
  pixelRatio: number
  cores: number
  maxMemory: number
  hasWebGL: boolean
  hasWebGPU: boolean
  hasWASM: boolean
  hasServiceWorker: boolean
  hasFileSystemAccess: boolean
  hasWebSerial: boolean
  hasBluetooth: boolean
}

interface HistoryPoint {
  time: number
  fps: number
  memory: number
  cpu: number
}

export default function SystemOptimizer() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [optimizations, setOptimizations] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'optimize' | 'benchmark'>('dashboard')
  const [benchmarkResult, setBenchmarkResult] = useState<number | null>(null)
  const [isBenchmarking, setIsBenchmarking] = useState(false)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const rafRef = useRef<number | null>(null)
  const frameCallbackRef = useRef<((time: number) => void) | null>(null)

  const collectMetrics = useCallback((): SystemMetrics => {
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; saveData?: boolean; type?: string }
      hardwareConcurrency?: number
      deviceMemory?: number
      getBattery?: () => Promise<{ level: number; charging: boolean }>
    }

    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }

    let memoryUsed = 0
    let memoryTotal = 0
    let memoryPercent = 0
    if (perf.memory) {
      memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)
      memoryTotal = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024)
      memoryPercent = Math.round((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100)
    }

    let storageUsed = 0
    let storageQuota = 0
    let storagePercent = 0
    try {
      const storage = navigator.storage as unknown as { estimate?: () => Promise<{ usage: number; quota: number }> }
      if (storage?.estimate) {
        storage.estimate().then((est) => {
          storageUsed = Math.round(est.usage / 1024 / 1024)
          storageQuota = Math.round(est.quota / 1024 / 1024)
          storagePercent = Math.round((est.usage / est.quota) * 100)
        })
      }
    } catch {}

    const conn = nav.connection
    let networkType = conn?.effectiveType || 'unknown'
    let downlink = conn?.downlink || 0

    let batteryLevel: number | null = null
    let batteryCharging: boolean | null = null

    return {
      fps: frameCountRef.current,
      fpsMin: 0,
      fpsMax: 0,
      memoryUsed,
      memoryTotal,
      memoryPercent,
      cpuEstimate: 0,
      storageUsed,
      storageQuota,
      storagePercent,
      networkType,
      downlink,
      online: navigator.onLine,
      batteryLevel,
      batteryCharging,
      devicePixelRatio: window.devicePixelRatio,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      cores: nav.hardwareConcurrency || 0,
      maxMemory: nav.deviceMemory || 0,
      hasWebGL: !!document.querySelector('canvas') ? (() => {
        try {
          const canvas = document.createElement('canvas')
          return !!canvas.getContext('webgl')
        } catch { return false }
      })() : false,
      hasWebGPU: 'gpu' in navigator,
      hasWASM: typeof WebAssembly !== 'undefined',
      hasServiceWorker: 'serviceWorker' in navigator,
      hasFileSystemAccess: 'showOpenFilePicker' in window,
      hasWebSerial: 'serial' in navigator,
      hasBluetooth: 'bluetooth' in navigator,
    }
  }, [])

  const updateMetrics = useCallback(() => {
    const newMetrics = collectMetrics()
    setMetrics(newMetrics)
    setHistory(prev => {
      const next = [...prev, {
        time: Date.now(),
        fps: newMetrics.fps,
        memory: newMetrics.memoryPercent,
        cpu: newMetrics.cpuEstimate
      }]
      return next.slice(-60)
    })
  }, [collectMetrics])

  const calculateOptimizations = useCallback((m: SystemMetrics): string[] => {
    const opts: string[] = []
    if (m.memoryPercent > 80) {
      opts.push('内存使用率较高，建议关闭不必要的标签页或重启浏览器')
    }
    if (m.memoryPercent > 60 && m.memoryPercent <= 80) {
      opts.push('内存使用率中等，注意监控内存增长趋势')
    }
    if (m.networkType === '2g' || m.networkType === 'slow-2g') {
      opts.push('网络连接较慢，建议启用浏览器数据节省模式')
    }
    if (m.cores <= 2) {
      opts.push('CPU核心数较少，建议减少同时运行的应用数量')
    }
    if (m.hasWebGPU === false && m.hasWebGL === false) {
      opts.push('浏览器不支持GPU加速，图形渲染性能可能受限')
    }
    if (m.devicePixelRatio > 2) {
      opts.push('高DPI屏幕，页面渲染开销较大')
    }
    return opts
  }, [])

  useEffect(() => {
    updateMetrics()
  }, [updateMetrics])

  useEffect(() => {
    if (!metrics) return
    setOptimizations(calculateOptimizations(metrics))
  }, [metrics, calculateOptimizations])

  useEffect(() => {
    if (!isMonitoring) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsTimeRef.current >= 1000) {
      frameCountRef.current = 0
      lastFpsTimeRef.current = now
      updateMetrics()
    }
    frameCallbackRef.current = () => {
      if (isMonitoring) {
        frameCountRef.current++
        rafRef.current = requestAnimationFrame(frameCallbackRef.current!)
      }
    }
    rafRef.current = requestAnimationFrame(frameCallbackRef.current)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isMonitoring, updateMetrics])

  const runBenchmark = async () => {
    setIsBenchmarking(true)
    setBenchmarkResult(null)
    
    const start = performance.now()
    let operations = 0
    const testDuration = 3000
    
    while (performance.now() - start < testDuration) {
      const arr = new Array(1000).fill(0).map((_, i) => i)
      const sorted = arr.sort((a, b) => b - a)
      sorted.map(x => Math.sqrt(x) * Math.PI)
      operations++
    }
    
    const elapsed = performance.now() - start
    const opsPerSec = Math.round((operations / elapsed) * 1000)
    setBenchmarkResult(opsPerSec)
    setIsBenchmarking(false)
  }

  const exportReport = () => {
    if (!metrics) return
    const report = {
      generatedAt: new Date().toISOString(),
      metrics,
      optimizations,
      history: history.slice(0, 10),
      benchmark: benchmarkResult,
      recommendations: [
        '定期清理浏览器缓存和Cookie',
        '使用浏览器内置的任务管理器（Shift+Esc）监控标签页',
        '保持浏览器和操作系统更新',
        '对于开发者：使用Chrome DevTools的Performance面板分析性能',
        '考虑使用Service Worker优化离线体验',
      ]
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!metrics) {
    return (
      <div style={{
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        color: '#fff',
        fontFamily: 'Space Grotesk, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={48} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, color: '#94a3b8' }}>正在收集系统指标...</p>
        </div>
      </div>
    )
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24
  }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, rgba(30,30,50,0.9), rgba(20,20,35,0.9))',
    borderRadius: 16,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    overflow: 'hidden'
  }

  const iconBgStyle = (color: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    background: `${color}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  })

  const progressBarStyle = (): React.CSSProperties => ({
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 8
  })

  const progressFillStyle = (percent: number, color: string): React.CSSProperties => ({
    height: '100%',
    width: `${Math.min(100, percent)}%`,
    borderRadius: 3,
    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
    transition: 'width 0.3s ease'
  })

  return (
    <div style={{
      padding: '24px',
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      color: '#e0e0e8',
      fontFamily: 'Space Grotesk, "Noto Sans SC", sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Gauge size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #f5f3ff, #c4b5fd)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              系统优化器
            </h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              实时浏览器性能分析与优化建议
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setIsMonitoring(!isMonitoring)} style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: isMonitoring ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600
          }}>
            {isMonitoring ? <><Pause size={14} /> 停止监控</> : <><Play size={14} /> 开始监控</>}
          </button>
          <button onClick={updateMetrics} style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#e0e0e8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={exportReport} style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#e0e0e8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Download size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['dashboard', 'optimize', 'benchmark'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === tab ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.05)',
            color: activeTab === tab ? 'white' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.2s'
          }}>
            {tab === 'dashboard' ? '仪表板' : tab === 'optimize' ? '优化建议' : '性能基准'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={iconBgStyle('#7c3aed')}>
                <Activity size={20} color="#a78bfa" />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>当前帧率</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: metrics.fps >= 55 ? '#4ade80' : metrics.fps >= 30 ? '#fbbf24' : '#ef4444' }}>
                {metrics.fps} <span style={{ fontSize: 14, fontWeight: 500 }}>FPS</span>
              </div>
              <div style={progressBarStyle()}>
                <div style={progressFillStyle(metrics.fps * 1.6, metrics.fps >= 55 ? '#4ade80' : '#fbbf24')} />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBgStyle('#38bdf8')}>
                <Cpu size={20} color="#38bdf8" />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>CPU 核心</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {metrics.cores || 'N/A'} <span style={{ fontSize: 14, fontWeight: 500 }}>核</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {metrics.maxMemory ? `${metrics.maxMemory}GB 最大内存` : '未知'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBgStyle('#22c55e')}>
                <HardDrive size={20} color="#22c55e" />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>内存使用</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: metrics.memoryPercent > 80 ? '#ef4444' : '#e0e0e8' }}>
                {metrics.memoryPercent}%
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {metrics.memoryUsed} / {metrics.memoryTotal} MB
              </div>
              <div style={progressBarStyle()}>
                <div style={progressFillStyle(metrics.memoryPercent, metrics.memoryPercent > 80 ? '#ef4444' : '#22c55e')} />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBgStyle('#f59e0b')}>
                <Wifi size={20} color="#f59e0b" />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>网络状态</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: metrics.online ? '#4ade80' : '#ef4444' }}>
                {metrics.online ? '在线' : '离线'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {metrics.networkType} {metrics.downlink ? `· ${metrics.downlink}Mbps` : ''}
              </div>
            </div>
          </div>

          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ ...iconBgStyle('#ec4899'), display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <BarChart3 size={18} color="#ec4899" />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>性能历史 (最近60秒)</div>
              <div style={{
                height: 80,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                padding: '8px 0'
              }}>
                {history.length > 0 ? history.slice(-30).map((p, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${Math.min(100, p.fps * 1.6)}%`,
                    background: `linear-gradient(180deg, #7c3aed, #38bdf8)`,
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.3 + (i / 30) * 0.7
                  }} />
                )) : Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: '10%',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px 2px 0 0'
                  }} />
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Settings size={18} color="#94a3b8" />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>系统信息</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#cbd5e1' }}>
                <div>屏幕: {metrics.screenWidth} x {metrics.screenHeight}</div>
                <div>像素比: {metrics.pixelRatio}x · 色深: {metrics.colorDepth}-bit</div>
                <div>设备内存: {metrics.maxMemory || '未知'} GB</div>
              </div>
            </div>

            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={18} color="#facc15" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>浏览器能力检测</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {[
                  { key: 'WebGL', support: metrics.hasWebGL },
                  { key: 'WebGPU', support: metrics.hasWebGPU },
                  { key: 'WebAssembly', support: metrics.hasWASM },
                  { key: 'Service Worker', support: metrics.hasServiceWorker },
                  { key: 'File System API', support: metrics.hasFileSystemAccess },
                  { key: 'Web Serial', support: metrics.hasWebSerial },
                  { key: 'Web Bluetooth', support: metrics.hasBluetooth },
                ].map(({ key, support }) => (
                  <div key={key} style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: support ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${support ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12
                  }}>
                    {support ? <CheckCircle size={14} color="#4ade80" /> : <AlertTriangle size={14} color="#ef4444" />}
                    <span style={{ color: support ? '#4ade80' : '#ef4444' }}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'optimize' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={20} color="#facc15" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>智能优化建议</span>
          </div>
          {optimizations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {optimizations.map((opt, i) => (
                <div key={i} style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <TrendingDown size={16} color="#a78bfa" />
                  </div>
                  <div style={{ fontSize: 14, color: '#e0e0e8', lineHeight: 1.6 }}>
                    {opt}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 16px' }} />
              <p>当前系统状态良好，暂无优化建议</p>
              <p style={{ fontSize: 12 }}>继续保持良好的使用习惯</p>
            </div>
          )}

          <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Sparkles size={18} color="#38bdf8" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#38bdf8' }}>通用优化技巧</span>
            </div>
            <ul style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>定期清理浏览器缓存和Cookie（建议每月一次）</li>
              <li>使用浏览器任务管理器（Chrome: Shift+Esc）监控资源占用</li>
              <li>保持浏览器和操作系统及时更新</li>
              <li>开启硬件加速（设置 → 系统 → 可用时使用硬件加速）</li>
              <li>减少同时打开的标签页数量</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'benchmark' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Gauge size={20} color="#facc15" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>JavaScript 性能基准测试</span>
          </div>
          
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 160, height: 160, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(56,189,248,0.2))',
              border: '2px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              position: 'relative'
            }}>
              {isBenchmarking ? (
                <RefreshCw size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#a78bfa' }}>
                    {benchmarkResult ? benchmarkResult.toLocaleString() : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {benchmarkResult ? 'ops/sec' : '等待测试'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={runBenchmark}
              disabled={isBenchmarking}
              style={{
                padding: '12px 32px',
                borderRadius: 12,
                border: 'none',
                background: isBenchmarking ? '#374151' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white',
                cursor: isBenchmarking ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}>
              {isBenchmarking ? <>测试中...</> : <><Play size={16} /> 开始测试</>}
            </button>

            {benchmarkResult && !isBenchmarking && (
              <div style={{ marginTop: 24, fontSize: 13, color: '#94a3b8' }}>
                {benchmarkResult > 1000000 ? (
                  <span style={{ color: '#4ade80' }}>性能优秀！你的JavaScript执行速度非常快。</span>
                ) : benchmarkResult > 500000 ? (
                  <span style={{ color: '#22c55e' }}>性能良好，日常使用完全足够。</span>
                ) : benchmarkResult > 100000 ? (
                  <span style={{ color: '#fbbf24' }}>性能中等，可考虑关闭其他标签页提升性能。</span>
                ) : (
                  <span style={{ color: '#ef4444' }}>性能较低，建议关闭其他程序或重启浏览器。</span>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', fontSize: 12, color: '#64748b' }}>
            测试说明：本测试在3秒内执行数组排序、映射和数学运算，测量每秒操作数。测试仅作参考，实际性能因浏览器、设备和系统负载而异。
          </div>
        </div>
      )}
    </div>
  )
}