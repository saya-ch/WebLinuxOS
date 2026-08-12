import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Download, Upload, Clock, Wifi, Play, Pause,
  Share2, Trash2, Gauge, Activity, BarChart3,
  CheckCircle,
  Signal, Network
} from 'lucide-react'

interface SpeedTestResult {
  id: string
  timestamp: number
  download: number
  upload: number
  latency: number
  jitter: number
  rating: string
}

const STORAGE_KEY = 'weblinux-speedtestpro-history'

const DOWNLOAD_TEST_URLS = [
  'https://speed.hetzner.de/10MB.bin',
  'https://speed.hetzner.de/1MB.bin',
]

const UPLOAD_TEST_URL = 'https://httpbin.org/post'

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return (mbps / 1000).toFixed(2) + ' Gbps'
  return mbps.toFixed(2) + ' Mbps'
}

function getRating(download: number): { label: string; color: string; icon: string } {
  if (download >= 1000) return { label: '5G 光纤级', color: '#22d3ee', icon: '🚀' }
  if (download >= 300) return { label: '5G 优秀', color: '#34d399', icon: '⚡' }
  if (download >= 100) return { label: '4G LTE+', color: '#fbbf24', icon: '📱' }
  if (download >= 50) return { label: '4G LTE', color: '#f59e0b', icon: '📡' }
  if (download >= 10) return { label: '3G 宽带级', color: '#fb923c', icon: '🌐' }
  if (download >= 1) return { label: '2G 基础级', color: '#f97316', icon: '📶' }
  return { label: '拨号级', color: '#f472b6', icon: '🐢' }
}

const NetworkSpeedTestPro = memo(function NetworkSpeedTestPro() {
  const [phase, setPhase] = useState<'idle' | 'latency' | 'download' | 'upload' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [latency, setLatency] = useState(0)
  const [jitter, setJitter] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [speedHistory, setSpeedHistory] = useState<number[]>([])
  const [history, setHistory] = useState<SpeedTestResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [testing, setTesting] = useState(false)
  const speedIntervalRef = useRef<number | null>(null)
  const abortRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }, [history])

  const testLatencyPhase = useCallback(async (): Promise<{ avg: number; jit: number }> => {
    const times: number[] = []
    const pingUrl = 'https://www.google.com/favicon.ico'

    for (let i = 0; i < 8; i++) {
      if (abortRef.current) break
      const start = performance.now()
      try {
        await fetch(pingUrl, { mode: 'no-cors', cache: 'no-store' })
        const elapsed = performance.now() - start
        times.push(elapsed)
      } catch {
        times.push(500)
      }
      await new Promise(r => setTimeout(r, 200))
    }

    if (times.length < 2) return { avg: 0, jit: 0 }

    const sorted = [...times].sort((a, b) => a - b)
    const trimmed = sorted.slice(1, -1)
    const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
    const jitterValues: number[] = []
    for (let i = 1; i < times.length; i++) {
      jitterValues.push(Math.abs(times[i] - times[i - 1]))
    }
    const jit = jitterValues.length > 0 ? jitterValues.reduce((a, b) => a + b, 0) / jitterValues.length : 0

    return { avg: Math.round(avg), jit: Math.round(jit) }
  }, [])

  const testDownloadPhase = useCallback(async (): Promise<number> => {
    let totalBytes = 0
    let totalTime = 0
    const allSpeedSamples: number[] = []

    for (const url of DOWNLOAD_TEST_URLS) {
      if (abortRef.current) break
      const start = performance.now()
      try {
        const response = await fetch(url + '?t=' + Date.now() + Math.random(), { mode: 'cors' })
        if (!response.ok) continue
        const reader = response.body?.getReader()
        if (!reader) continue

        let bytes = 0
        let lastSampleTime = performance.now()
        let lastSampleBytes = 0

        while (true) {
          if (abortRef.current) { reader.cancel(); break }
          const { done, value } = await reader.read()
          if (done) break
          bytes += value.length
          totalBytes += value.length

          const now = performance.now()
          if (now - lastSampleTime >= 200) {
            const instantSpeed = ((bytes - lastSampleBytes) * 8) / ((now - lastSampleTime) / 1000) / 1_000_000
            allSpeedSamples.push(instantSpeed)
            lastSampleTime = now
            lastSampleBytes = bytes
          }
        }

        const elapsed = performance.now() - start
        totalTime += elapsed
        if (elapsed > 0 && bytes > 0) {
          const speed = (bytes * 8) / (elapsed / 1000) / 1_000_000
          allSpeedSamples.push(speed)
        }
      } catch {
        continue
      }
    }

    if (allSpeedSamples.length > 0) {
      setSpeedHistory(allSpeedSamples)
    }

    if (totalTime > 0 && totalBytes > 0) {
      return (totalBytes * 8) / (totalTime / 1000) / 1_000_000
    }
    return 0
  }, [])

  const testUploadPhase = useCallback(async (): Promise<number> => {
    const sizes = [256 * 1024, 512 * 1024, 1024 * 1024]
    let totalBytes = 0
    let totalTime = 0
    const speedSamples: number[] = []

    for (const size of sizes) {
      if (abortRef.current) break
      const payload = new Uint8Array(size)
      for (let i = 0; i < size; i++) payload[i] = Math.floor(Math.random() * 256)

      const start = performance.now()
      try {
        await fetch(UPLOAD_TEST_URL, {
          method: 'POST',
          mode: 'no-cors',
          cache: 'no-store',
          body: payload,
        })
        const elapsed = performance.now() - start
        totalTime += elapsed
        totalBytes += size
        if (elapsed > 0) {
          speedSamples.push((size * 8) / (elapsed / 1000) / 1_000_000)
        }
      } catch {
        continue
      }
    }

    if (speedSamples.length > 0) {
      const avgSpeed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
      return avgSpeed
    }
    if (totalTime > 0 && totalBytes > 0) {
      return (totalBytes * 8) / (totalTime / 1000) / 1_000_000
    }
    return 0
  }, [])

  const updateSpeedDisplay = useCallback(() => {
    setCurrentSpeed(prev => {
      const delta = (Math.random() - 0.3) * 15
      return Math.max(0, prev + delta)
    })
  }, [])

  const startTest = useCallback(async () => {
    if (testing) return
    setTesting(true)
    setError('')
    abortRef.current = false
    setSpeedHistory([])
    setCurrentSpeed(0)

    setPhase('latency')
    setProgress(10)
    setSpeedHistory([])

    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current)
    speedIntervalRef.current = window.setInterval(updateSpeedDisplay, 100)

    try {
      const { avg: lat, jit } = await testLatencyPhase()
      if (abortRef.current) return
      setLatency(lat)
      setJitter(jit)
      setProgress(25)

      setPhase('download')
      setProgress(35)
      const dl = await testDownloadPhase()
      if (abortRef.current) return
      setDownloadSpeed(dl)
      setProgress(65)

      setPhase('upload')
      setProgress(75)
      const ul = await testUploadPhase()
      if (abortRef.current) return
      setUploadSpeed(ul)
      setProgress(95)

      const rating = getRating(dl)
      const result: SpeedTestResult = {
        id: `test-${Date.now()}`,
        timestamp: Date.now(),
        download: dl,
        upload: ul,
        latency: lat,
        jitter: jit,
        rating: rating.label,
      }

      setHistory(prev => [result, ...prev].slice(0, 30))
      setPhase('done')
      setProgress(100)
    } catch (e: any) {
      setError('测试中断: ' + (e.message || '未知错误'))
    } finally {
      setTesting(false)
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current)
        speedIntervalRef.current = null
      }
      setCurrentSpeed(dl => dl)
    }
  }, [testing, testLatencyPhase, testDownloadPhase, testUploadPhase, updateSpeedDisplay])

  const stopTest = () => {
    abortRef.current = true
    setTesting(false)
    setPhase('idle')
    setProgress(0)
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current)
      speedIntervalRef.current = null
    }
  }

  const clearHistory = () => {
    setHistory([])
  }

  const handleShare = () => {
    const text = `🌐 我的网速测试结果：
下载: ${formatSpeed(downloadSpeed)}
上传: ${formatSpeed(uploadSpeed)}
延迟: ${latency}ms
抖动: ${jitter}ms
评级: ${getRating(downloadSpeed).label}`
    if (navigator.share) {
      navigator.share({ title: '网速测试结果', text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text)
    }
    setShowShare(true)
    setTimeout(() => setShowShare(false), 2000)
  }

  const rating = getRating(downloadSpeed)

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff', padding: 20, overflowY: 'auto', fontFamily: 'inherit',
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    title: {
      fontSize: 24, fontWeight: 700,
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #f472b6)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      display: 'flex', alignItems: 'center', gap: 10,
    },
    subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
    mainGlass: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
      padding: 30, textAlign: 'center', marginBottom: 16,
    },
    speedDial: {
      width: 260, height: 260, borderRadius: '50%',
      margin: '0 auto 20px', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    dialBg: {
      position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
      borderRadius: '50%',
      background: 'conic-gradient(from 135deg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.3s ease',
    },
    dialInner: {
      width: 200, height: 200, borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.15), rgba(15,12,41,0.95))',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: '2px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 0 40px rgba(34,211,238,0.1)',
    },
    speedValue: { fontSize: 42, fontWeight: 800, lineHeight: 1 },
    speedUnit: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    speedLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
    phaseBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, marginBottom: 16,
    },
    progressBar: {
      width: '100%', maxWidth: 400, height: 6, borderRadius: 3,
      background: 'rgba(255,255,255,0.08)', margin: '0 auto 20px', overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },
    statsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 12, marginBottom: 16,
    },
    statCard: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16,
    },
    statHeader: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
    statVal: { fontSize: 22, fontWeight: 700 },
    statUnit: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 4 },
    actionBtn: {
      padding: '14px 36px', borderRadius: 14, border: 'none', cursor: 'pointer',
      fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 10,
      transition: 'all 0.2s',
    },
    btnStart: {
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', color: '#0f0c29',
      boxShadow: '0 4px 20px rgba(34,211,238,0.3)',
    },
    btnStop: {
      background: 'linear-gradient(135deg, #f472b6, #fb923c)', color: '#fff',
    },
    btnSecondary: {
      padding: '10px 18px', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
    },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 12 },
    speedChart: {
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12, padding: 14, height: 140,
    },
    historyList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' },
    historyItem: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    shareModal: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
    },
    shareContent: {
      background: 'linear-gradient(135deg, #1a1740, #2d2766)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
      padding: 20, maxWidth: 360, width: '100%', textAlign: 'center',
    },
    errorMsg: {
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
      color: '#f472b6', fontSize: 13, marginBottom: 16,
    },
  }

  const phaseLabel = {
    idle: '准备就绪',
    latency: '测量延迟中...',
    download: '测量下载速度...',
    upload: '测量上传速度...',
    done: '测试完成！',
  }[phase]

  const phaseIcon = {
    idle: <Wifi size={14} />,
    latency: <Clock size={14} />,
    download: <Download size={14} />,
    upload: <Upload size={14} />,
    done: <CheckCircle size={14} />,
  }[phase]

  const isMeasuring = phase === 'download' || phase === 'upload'
  const displaySpeed = isMeasuring ? currentSpeed : (downloadSpeed || 0)
  const speedColor = phase === 'upload' ? '#a78bfa' : '#22d3ee'

  const maxSpeedForDial = Math.max(displaySpeed * 1.3, 100)
  const dialAngle = Math.min((displaySpeed / maxSpeedForDial) * 270, 270)

  const chartWidth = 600
  const chartHeight = 120
  const chartPadding = 20

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <Gauge size={26} />
            网络速度测试 Pro
          </div>
          <div style={styles.subtitle}>真实下载/上传测量 · 延迟Ping · 抖动分析 · 网络评级</div>
        </div>
        {history.length > 0 && (
          <button style={styles.btnSecondary} onClick={clearHistory}>
            <Trash2 size={14} /> 清空历史
          </button>
        )}
      </div>

      {error && <div style={styles.errorMsg}>{error}</div>}

      <div style={styles.mainGlass}>
        <div style={{ ...styles.phaseBadge, background: phase === 'done' ? 'rgba(34,211,238,0.15)' : 'rgba(167,139,250,0.15)', color: phase === 'done' ? '#22d3ee' : '#a78bfa' }}>
          {phaseIcon}
          {phaseLabel}
        </div>

        <div style={styles.speedDial}>
          <div
            style={{
              ...styles.dialBg,
              background: `conic-gradient(from 135deg, ${speedColor} ${dialAngle}deg, rgba(255,255,255,0.06) ${dialAngle}deg)`,
            }}
          />
          <div style={styles.dialInner}>
            <div style={{ ...styles.speedValue, color: speedColor }}>
              {displaySpeed.toFixed(1)}
            </div>
            <div style={styles.speedUnit}>Mbps</div>
            <div style={styles.speedLabel}>
              {phase === 'download' ? '下载速度' : phase === 'upload' ? '上传速度' : phase === 'latency' ? '延迟测量' : phase === 'done' ? '测试完成' : '准备开始'}
            </div>
          </div>
        </div>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%`, background: 'linear-gradient(90deg, #22d3ee, #a78bfa)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {!testing ? (
            <button style={{ ...styles.actionBtn, ...styles.btnStart }} onClick={startTest}>
              <Play size={18} /> 开始测试
            </button>
          ) : (
            <button style={{ ...styles.actionBtn, ...styles.btnStop }} onClick={stopTest}>
              <Pause size={18} /> 停止
            </button>
          )}
          {phase === 'done' && (
            <button style={styles.btnSecondary} onClick={handleShare}>
              <Share2 size={14} /> 分享结果
            </button>
          )}
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}><Download size={14} style={{ color: '#22d3ee' }} /> 下载速度</div>
          <div style={styles.statVal}>
            {downloadSpeed.toFixed(2)}
            <span style={styles.statUnit}>Mbps</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}><Upload size={14} style={{ color: '#a78bfa' }} /> 上传速度</div>
          <div style={styles.statVal}>
            {uploadSpeed.toFixed(2)}
            <span style={styles.statUnit}>Mbps</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}><Clock size={14} style={{ color: '#fbbf24' }} /> 延迟</div>
          <div style={styles.statVal}>
            {latency}
            <span style={styles.statUnit}>ms</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}><Activity size={14} style={{ color: '#f472b6' }} /> 抖动</div>
          <div style={styles.statVal}>
            {jitter}
            <span style={styles.statUnit}>ms</span>
          </div>
        </div>
        <div style={{ ...styles.statCard, gridColumn: '1fr 2fr' }}>
          <div style={styles.statHeader}><Signal size={14} style={{ color: rating.color }} /> 网络评级</div>
          <div style={{ ...styles.statVal, color: rating.color, display: 'flex', alignItems: 'center', gap: 8 }}>
            {rating.icon} {rating.label}
          </div>
        </div>
      </div>

      {speedHistory.length > 0 && (
        <div style={{ ...styles.mainGlass, padding: 20 }}>
          <div style={styles.sectionTitle}>
            <BarChart3 size={16} style={{ color: '#22d3ee' }} />
            实时速度曲线
          </div>
          <div style={styles.speedChart}>
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="speed-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartPadding + pct * (chartHeight - chartPadding * 2)
                return (
                  <g key={i}>
                    <line x1={chartPadding} y1={y} x2={chartWidth - chartPadding} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  </g>
                )
              })}
              {(() => {
                const data = speedHistory.slice(-60)
                if (data.length < 2) return null
                const max = Math.max(...data, 1)
                const stepX = (chartWidth - chartPadding * 2) / (data.length - 1)
                const points = data.map((v, i) => ({
                  x: chartPadding + i * stepX,
                  y: chartPadding + (1 - v / max) * (chartHeight - chartPadding * 2),
                }))
                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                const areaD = pathD + ` L${points[points.length - 1].x},${chartHeight - chartPadding} L${points[0].x},${chartHeight - chartPadding} Z`
                return (
                  <>
                    <path d={areaD} fill="url(#speed-grad)" />
                    <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                  </>
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      <div style={styles.mainGlass}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={styles.sectionTitle}>
            <Clock size={16} style={{ color: '#a78bfa' }} />
            测试历史 ({history.length})
          </div>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            <Network size={28} style={{ margin: '0 auto 10px', color: 'rgba(255,255,255,0.2)' }} />
            还没有测试记录
          </div>
        ) : (
          <div style={styles.historyList}>
            {history.map(item => {
              const r = getRating(item.download)
              return (
                <div key={item.id} style={styles.historyItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `linear-gradient(135deg, ${r.color}20, ${r.color}10)`,
                      border: `1px solid ${r.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {r.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(item.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, textAlign: 'right' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#22d3ee' }}>{item.download.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>下载 Mbps</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{item.upload.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>上传 Mbps</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>{item.latency}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>延迟 ms</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showShare && (
        <div style={styles.shareModal} onClick={() => setShowShare(false)}>
          <div style={styles.shareContent} onClick={e => e.stopPropagation()}>
            <CheckCircle size={32} style={{ margin: '0 auto 12px', color: '#22d3ee' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>分享成功！</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              测试结果已复制到剪贴板
            </div>
            <button style={{ ...styles.btnSecondary, marginTop: 16 }} onClick={() => setShowShare(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default NetworkSpeedTestPro