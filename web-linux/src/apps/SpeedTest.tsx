import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Wifi as WifiIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Gauge as GaugeIcon,
  Clock as ClockIcon,
  RefreshCw as RefreshCwIcon,
  Check as CheckIcon,
  AlertTriangle as AlertTriangleIcon,
} from 'lucide-react'
import { useStore } from '../store'

interface SpeedTestResult {
  id: string
  download: number
  upload: number
  latency: number
  jitter: number
  timestamp: number
  server: string
}

type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'done' | 'error'

const PING_SERVERS = [
  { name: 'Cloudflare', url: 'https://www.cloudflare.com/cdn-cgi/trace' },
  { name: 'Google', url: 'https://www.google.com/favicon.ico' },
  { name: 'GitHub', url: 'https://github.com/favicon.ico' },
  { name: 'Hetzner', url: 'https://speed.hetzner.de/1MB.bin' },
]

const DOWNLOAD_URLS = [
  'https://speed.hetzner.de/1MB.bin',
  'https://speed.hetzner.de/10MB.bin',
]

const UPLOAD_URL = 'https://httpbin.org/post'
const HISTORY_KEY = 'weblinux-speedtest-history'
const MAX_HISTORY = 20

function formatSpeed(speed: number): string {
  if (speed === 0) return '0.0'
  if (speed < 1) return speed.toFixed(2)
  if (speed < 100) return speed.toFixed(1)
  return speed.toFixed(0)
}

function getSpeedRating(speed: number): { label: string; color: string } {
  if (speed >= 200) return { label: '极速', color: '#06b6d4' }
  if (speed >= 100) return { label: '极快', color: '#22c55e' }
  if (speed >= 50) return { label: '快速', color: '#84cc16' }
  if (speed >= 25) return { label: '良好', color: '#eab308' }
  if (speed >= 10) return { label: '一般', color: '#f97316' }
  return { label: '较慢', color: '#ef4444' }
}

function getLatencyRating(latency: number): { label: string; color: string } {
  if (latency < 20) return { label: '极佳', color: '#22c55e' }
  if (latency < 50) return { label: '优秀', color: '#84cc16' }
  if (latency < 100) return { label: '良好', color: '#eab308' }
  if (latency < 200) return { label: '一般', color: '#f97316' }
  return { label: '较差', color: '#ef4444' }
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: 'rgba(59, 130, 246, 0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function GaugeRing({ value, max, label, unit, color, icon: Icon }: {
  value: number; max: number; label: string; unit: string; color: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
}) {
  const size = 160
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const [animatedOffset, setAnimatedOffset] = useState(circumference)
  const targetOffset = circumference * (1 - Math.min(value / max, 1))

  useEffect(() => {
    const t = setTimeout(() => setAnimatedOffset(targetOffset), 50)
    return () => clearTimeout(t)
  }, [targetOffset])

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={animatedOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon size={18} style={{ color, marginBottom: 2 }} />
        <div className="text-2xl font-light text-white tabular-nums">
          {value > 0 ? formatSpeed(value) : '--'}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{unit}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

function SpeedTest() {
  const [phase, setPhase] = useState<TestPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [latency, setLatency] = useState(0)
  const [jitter, setJitter] = useState(0)
  const [pingResults, setPingResults] = useState<{ name: string; latency: number }[]>([])
  const [history, setHistory] = useState<SpeedTestResult[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(false)
  const speedAnimRef = useRef<number | null>(null)
  const addNotification = useStore((s) => s.addNotification)

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) } catch { /* ignore */ }
  }, [history])

  const stopSpeedAnim = useCallback(() => {
    if (speedAnimRef.current !== null) {
      clearInterval(speedAnimRef.current)
      speedAnimRef.current = null
    }
  }, [])

  const animateSpeed = useCallback((target: number, duration: number) => {
    stopSpeedAnim()
    const start = performance.now()
    const from = currentSpeed
    speedAnimRef.current = window.setInterval(() => {
      const t = Math.min((performance.now() - start) / duration, 1)
      setCurrentSpeed(from + (target - from) * (1 - Math.pow(1 - t, 3)))
      if (t >= 1 && speedAnimRef.current !== null) {
        clearInterval(speedAnimRef.current)
        speedAnimRef.current = null
      }
    }, 50)
  }, [currentSpeed, stopSpeedAnim])

  const testLatency = useCallback(async () => {
    const all: { name: string; latency: number }[] = []
    for (const srv of PING_SERVERS) {
      if (abortRef.current) break
      const times: number[] = []
      for (let i = 0; i < 4; i++) {
        if (abortRef.current) break
        const t0 = performance.now()
        try {
          await fetch(`${srv.url}?_=${Date.now()}`, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
          times.push(performance.now() - t0)
        } catch { /* noop */ }
        await new Promise((r) => setTimeout(r, 100))
      }
      if (times.length) all.push({ name: srv.name, latency: Math.round(times.reduce((a, b) => a + b, 0) / times.length) })
    }
    if (!all.length) return { avgLatency: 0, jitter: 0, results: [] as { name: string; latency: number }[] }
    const lats = all.map((r) => r.latency)
    const avg = lats.reduce((a, b) => a + b, 0) / lats.length
    const jit = Math.sqrt(lats.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lats.length)
    return { avgLatency: Math.round(avg), jitter: Math.round(jit), results: all }
  }, [])

  const testDownload = useCallback(async () => {
    let totalBytes = 0, totalTime = 0
    const speeds: number[] = []
    for (let round = 0; round < 2; round++) {
      if (abortRef.current) break
      const url = DOWNLOAD_URLS[round % DOWNLOAD_URLS.length]
      const t0 = performance.now()
      try {
        const res = await fetch(`${url}?_=${Date.now()}`, { mode: 'cors', cache: 'no-store' })
        const reader = res.body?.getReader()
        if (!reader) continue
        while (true) {
          if (abortRef.current) break
          const { done, value } = await reader.read()
          if (done) break
          totalBytes += value.length
          const el = (performance.now() - t0) / 1000
          if (el > 0.1) setCurrentSpeed((totalBytes * 8) / (el * 1000000))
        }
      } catch { continue }
      const t1 = performance.now()
      const rt = (t1 - t0) / 1000
      totalTime += rt
      if (rt > 0) speeds.push((totalBytes * 8) / (rt * 1000000))
    }
    if (abortRef.current || !totalTime || !totalBytes) return 0
    return Math.round((speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : (totalBytes * 8) / (totalTime * 1000000)) * 10) / 10
  }, [])

  const testUpload = useCallback(async () => {
    const sizes = [256 * 1024, 512 * 1024, 1024 * 1024]
    const speeds: number[] = []
    for (const sz of sizes) {
      if (abortRef.current) break
      const data = new Uint8Array(sz)
      for (let i = 0; i < sz; i += 4096) {
        const ch = Math.min(4096, sz - i)
        for (let j = 0; j < ch; j++) data[i + j] = Math.floor(Math.random() * 256)
      }
      const t0 = performance.now()
      try {
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: data, mode: 'cors' })
        await res.text()
        const time = (performance.now() - t0) / 1000
        if (time > 0.5) {
          const sp = (sz * 8) / (time * 1000000)
          speeds.push(sp)
          animateSpeed(sp, 300)
        }
      } catch {
        try {
          const t0b = performance.now()
          await fetch(UPLOAD_URL, { method: 'POST', body: data.slice(0, Math.min(sz, 65536)), mode: 'no-cors' })
          const t2 = (performance.now() - t0b) / 1000
          if (t2 > 0.05) speeds.push((sz * 8) / (t2 * 1000000))
        } catch { /* noop */ }
      }
    }
    if (abortRef.current) return 0
    return speeds.length ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10 : 0
  }, [animateSpeed])

  const runTest = useCallback(async () => {
    stopSpeedAnim()
    setError(null); setPhase('idle'); setProgress(0); setCurrentSpeed(0)
    setDownloadSpeed(0); setUploadSpeed(0); setLatency(0); setJitter(0)
    setPingResults([]); abortRef.current = false

    try {
      setPhase('latency'); setProgress(5)
      const lat = await testLatency()
      if (abortRef.current) return
      setLatency(lat.avgLatency); setJitter(lat.jitter); setPingResults(lat.results)
      setProgress(20)

      setPhase('download'); setProgress(25)
      const dSpeed = await testDownload()
      if (abortRef.current) return
      setDownloadSpeed(dSpeed); animateSpeed(dSpeed, 800); setProgress(70)

      setPhase('upload'); setProgress(75)
      const uSpeed = await testUpload()
      if (abortRef.current) return
      setUploadSpeed(uSpeed); animateSpeed(uSpeed, 800); setProgress(95)

      setPhase('done'); setProgress(100)
      const bestSrv = lat.results.length ? lat.results.reduce((a, b) => a.latency < b.latency ? a : b).name : 'Unknown'
      setHistory((prev) => [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        download: dSpeed, upload: uSpeed, latency: lat.avgLatency,
        jitter: lat.jitter, timestamp: Date.now(), server: bestSrv,
      }, ...prev].slice(0, MAX_HISTORY))

      addNotification({
        title: '速度测试完成',
        message: `下载 ${dSpeed} Mbps · 上传 ${uSpeed} Mbps · 延迟 ${lat.avgLatency} ms`,
        type: 'success',
      })
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : '未知错误')
      addNotification({ title: '测试失败', message: err instanceof Error ? err.message : '未知错误', type: 'error' })
    }
  }, [testLatency, testDownload, testUpload, animateSpeed, stopSpeedAnim, addNotification])

  const stopTest = useCallback(() => {
    abortRef.current = true; stopSpeedAnim()
    setPhase('idle'); setProgress(0); setCurrentSpeed(0)
  }, [stopSpeedAnim])

  const clearHistory = useCallback(() => {
    setHistory([])
    try { localStorage.removeItem(HISTORY_KEY) } catch { /* ignore */ }
  }, [])

  const isTesting = phase === 'latency' || phase === 'download' || phase === 'upload'
  const dRating = useMemo(() => getSpeedRating(downloadSpeed), [downloadSpeed])
  const uRating = useMemo(() => getSpeedRating(uploadSpeed), [uploadSpeed])
  const lRating = useMemo(() => getLatencyRating(latency), [latency])
  const fastestRecord = useMemo(() => history.length ? history.reduce((b, r) => r.download > b.download ? r : b) : null, [history])

  useEffect(() => () => { abortRef.current = true; stopSpeedAnim() }, [stopSpeedAnim])

  const showD = phase === 'download' || phase === 'done'
  const showU = phase === 'upload' || phase === 'done'
  const showL = phase === 'latency' || phase === 'done'

  const ratingBadge = (rating: { label: string; color: string }, visible: boolean) =>
    visible ? (
      <div style={{ marginTop: 10, padding: '3px 10px', borderRadius: 16, background: `${rating.color}22`, color: rating.color, fontSize: 11, fontWeight: 600 }}>
        {rating.label}
      </div>
    ) : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #0f0f1a, #1a1a2e 40%, #16213e)', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'auto' }}>
      <div style={{ padding: '20px 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
            <WifiIcon size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>网络速度测试</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>测量您的网络性能</div>
          </div>
        </div>
        <button onClick={isTesting ? stopTest : runTest} style={{
          padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
          background: isTesting ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff', boxShadow: isTesting ? '0 4px 12px rgba(239,68,68,0.4)' : '0 4px 12px rgba(59,130,246,0.4)',
        }}>
          {isTesting ? (<><AlertTriangleIcon size={14} />停止</>) : (<><RefreshCwIcon size={14} />{phase === 'done' ? '重新测试' : '开始测试'}</>)}
        </button>
      </div>

      <div style={{ padding: '0 24px' }}>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`,
            background: phase === 'error' ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            borderRadius: 3, transition: 'width 0.3s ease', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
          <span>{phase === 'idle' ? '准备就绪' : phase === 'latency' ? '测试延迟中...' : phase === 'download' ? '下载测试中...' : phase === 'upload' ? '上传测试中...' : phase === 'done' ? '测试完成' : '测试出错'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={cardStyle}>
          <GaugeRing value={showD ? (phase === 'download' ? currentSpeed : downloadSpeed) : 0} max={200} label="下载速度" unit="Mbps" color="#3b82f6" icon={DownloadIcon} />
          {ratingBadge(dRating, phase === 'done' && downloadSpeed > 0)}
        </div>
        <div style={cardStyle}>
          <GaugeRing value={showU ? (phase === 'upload' ? currentSpeed : uploadSpeed) : 0} max={100} label="上传速度" unit="Mbps" color="#8b5cf6" icon={UploadIcon} />
          {ratingBadge(uRating, phase === 'done' && uploadSpeed > 0)}
        </div>
        <div style={cardStyle}>
          <GaugeRing value={showL ? latency : 0} max={500} label="延迟" unit="ms" color="#22c55e" icon={ClockIcon} />
          {ratingBadge(lRating, phase === 'done' && latency > 0)}
          {phase === 'done' && jitter > 0 && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>抖动: {jitter} ms</div>}
        </div>
      </div>

      {phase === 'latency' && pingResults.length > 0 && (
        <div style={{ padding: '0 24px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {pingResults.map((r) => (
            <div key={r.name} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(255,255,255,0.06)' }}>
              <WifiIcon size={10} style={{ color: '#64748b' }} />
              <span style={{ color: '#94a3b8' }}>{r.name}</span>
              <span style={{ color: r.latency < 100 ? '#22c55e' : '#f97316', fontWeight: 600 }}>{r.latency}ms</span>
            </div>
          ))}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 24px 12px' }}>
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckIcon size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>
              {downloadSpeed >= 25 ? '网络良好，适合高清流媒体和在线游戏。' : downloadSpeed >= 10 ? '网络适中，可满足日常浏览。' : '网络较慢，建议检查连接。'}
              {' '}下载 {downloadSpeed} · 上传 {uploadSpeed} · 延迟 {latency}ms
            </div>
          </div>
        </div>
      )}

      {phase === 'error' && error && (
        <div style={{ padding: '0 24px 12px' }}>
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangleIcon size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaugeIcon size={14} style={{ color: '#64748b' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>历史记录</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>({history.length})</span>
            </div>
            <button onClick={clearHistory} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, color: '#fca5a5', cursor: 'pointer', fontSize: 11 }}>清空</button>
          </div>

          {fastestRecord && history.length >= 2 && (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🏆</span>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>
                最快: <strong style={{ color: '#fff' }}>{fastestRecord.download}</strong> Mbps ↓ · <strong style={{ color: '#fff' }}>{fastestRecord.upload}</strong> Mbps ↑ · {new Date(fastestRecord.timestamp).toLocaleString('zh-CN')}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflow: 'auto' }}>
            {history.map((r) => (
              <div key={r.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={iconBtnStyle}><ClockIcon size={12} style={{ color: '#60a5fa' }} /></div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.timestamp).toLocaleString('zh-CN')}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <DownloadIcon size={10} style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600 }}>{formatSpeed(r.download)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <UploadIcon size={10} style={{ color: '#c4b5fd' }} />
                    <span style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 600 }}>{formatSpeed(r.upload)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <GaugeIcon size={10} style={{ color: '#86efac' }} />
                    <span style={{ fontSize: 12, color: '#86efac', fontWeight: 600 }}>{r.latency}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '10px 24px', textAlign: 'center', fontSize: 10, color: '#475569', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        测试数据来自公共服务器 · 结果仅供参考
      </div>
    </div>
  )
}

export default SpeedTest