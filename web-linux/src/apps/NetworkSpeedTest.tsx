import { useState, useEffect, useRef } from 'react'
import { Download, Upload, Clock, Wifi, Play, Pause } from 'lucide-react'

interface SpeedTestResult {
  download: number
  upload: number
  latency: number
  timestamp: Date
}

export default function NetworkSpeedTest() {
  const [testing, setTesting] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'latency' | 'download' | 'upload' | 'done'>('idle')
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<SpeedTestResult[]>([])
  const [history, setHistory] = useState<SpeedTestResult[]>(() => {
    const saved = localStorage.getItem('weblinux-speedtest-history')
    return saved ? JSON.parse(saved) : []
  })
  const abortRef = useRef(false)

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('weblinux-speedtest-history', JSON.stringify(history))
    }
  }, [history])

  const testLatency = async (): Promise<number> => {
    const times: number[] = []
    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      try {
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
        const end = performance.now()
        times.push(end - start)
      } catch {
        times.push(999)
      }
    }
    return Math.round(times.sort((a, b) => a - b).slice(1, -1).reduce((a, b) => a + b, 0) / 3)
  }

  const testDownload = async (): Promise<number> => {
    const testUrls = [
      'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
      'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    ]

    let totalBytes = 0
    let totalTime = 0

    for (const url of testUrls) {
      const start = performance.now()
      try {
        const response = await fetch(url + '?cachebust=' + Math.random(), { mode: 'cors' })
        const blob = await response.blob()
        const end = performance.now()

        totalBytes += blob.size
        totalTime += (end - start) / 1000
      } catch {
        continue
      }
    }

    if (totalTime === 0) return 0
    return Math.round((totalBytes * 8) / (totalTime * 1000000) * 10) / 10
  }

  const testUpload = async (): Promise<number> => {
    const sizes = [1024 * 1024, 512 * 1024, 256 * 1024]
    const results: number[] = []

    for (const size of sizes) {
      const data = new Uint8Array(size)
      for (let i = 0; i < size; i++) {
        data[i] = Math.floor(Math.random() * 256)
      }

      const start = performance.now()
      try {
        await fetch('https://httpbin.org/post', {
          method: 'POST',
          body: data,
          mode: 'no-cors',
        })
        const end = performance.now()
        const time = (end - start) / 1000
        const speed = Math.round((size * 8) / (time * 1000000) * 10) / 10
        results.push(speed)
      } catch {
        continue
      }
    }

    return results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0
  }

  const runTest = async () => {
    setTesting(true)
    abortRef.current = false

    try {
      setPhase('latency')
      setCurrentSpeed(0)
      setProgress(0)

      if (abortRef.current) return
      const latency = await testLatency()

      if (abortRef.current) return
      setPhase('download')
      setCurrentSpeed(0)

      let downloadProgress = 0
      const downloadSpeed = await testDownload()
      for (let i = 0; i <= 100; i += 20) {
        if (abortRef.current) return
        downloadProgress = i
        setProgress(downloadProgress)
        setCurrentSpeed(downloadSpeed * (i / 100))
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (abortRef.current) return
      setPhase('upload')
      setCurrentSpeed(0)

      let uploadProgress = 0
      const uploadSpeed = await testUpload()
      for (let i = 0; i <= 100; i += 20) {
        if (abortRef.current) return
        uploadProgress = i
        setProgress(uploadProgress)
        setCurrentSpeed(uploadSpeed * (i / 100))
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (abortRef.current) return
      setPhase('done')

      const result: SpeedTestResult = {
        download: downloadSpeed,
        upload: uploadSpeed,
        latency,
        timestamp: new Date(),
      }

      setResults([result])
      setHistory(prev => [result, ...prev.slice(0, 9)])
      setCurrentSpeed(0)
      setProgress(100)
    } catch (error) {
      console.error('测试失败:', error)
    } finally {
      setTesting(false)
    }
  }

  const stopTest = () => {
    abortRef.current = true
    setTesting(false)
    setPhase('idle')
    setCurrentSpeed(0)
    setProgress(0)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('weblinux-speedtest-history')
  }

  const formatSpeed = (speed: number): string => {
    if (speed === 0) return '- Mbps'
    return `${speed.toFixed(1)} Mbps`
  }

  const getSpeedRating = (speed: number): { label: string; color: string } => {
    if (speed >= 100) return { label: '极快', color: '#2ecc71' }
    if (speed >= 50) return { label: '很快', color: '#27ae60' }
    if (speed >= 25) return { label: '较快', color: '#f39c12' }
    if (speed >= 10) return { label: '一般', color: '#e67e22' }
    return { label: '较慢', color: '#e74c3c' }
  }

  return (
    <div className="app-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          <Wifi size={32} style={{ color: 'var(--accent-color)' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>网络速度测试</h2>
        </div>

        <div style={{
          fontSize: 64,
          fontWeight: 200,
          margin: '20px 0',
          fontFamily: 'monospace',
          color: phase === 'idle' ? 'var(--text-primary)' : 'var(--accent-color)',
        }}>
          {formatSpeed(testing ? currentSpeed : results[0]?.download || 0)}
        </div>

        <div style={{ marginBottom: 20 }}>
          {phase === 'idle' && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              点击"开始测试"检测您的网络速度
            </div>
          )}
          {phase === 'latency' && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              测试延迟中...
            </div>
          )}
          {phase === 'download' && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              下载速度测试中...
            </div>
          )}
          {phase === 'upload' && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              上传速度测试中...
            </div>
          )}
          {phase === 'done' && results[0] && (
            <div style={{ fontSize: 14, color: 'var(--accent-color)', fontWeight: 600 }}>
              测试完成! 您的网络 {getSpeedRating(results[0].download).label}
            </div>
          )}
        </div>

        {testing && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              height: 6,
              background: 'var(--bg-secondary)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent-color)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        <button
          onClick={testing ? stopTest : runTest}
          style={{
            padding: '12px 32px',
            background: testing ? '#e74c3c' : 'var(--button-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {testing ? (
            <>
              <Pause size={18} />
              停止
            </>
          ) : (
            <>
              <Play size={18} />
              {phase === 'done' ? '重新测试' : '开始测试'}
            </>
          )}
        </button>
      </div>

      {results[0] && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>测试结果</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <Download size={24} style={{ color: '#3498db', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>下载</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{results[0].download.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mbps</div>
            </div>

            <div style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <Upload size={24} style={{ color: '#2ecc71', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>上传</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{results[0].upload.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mbps</div>
            </div>

            <div style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <Clock size={24} style={{ color: '#9b59b6', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>延迟</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{results[0].latency}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ms</div>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>历史记录</h3>
            <button
              onClick={clearHistory}
              style={{
                padding: '6px 12px',
                background: 'var(--button-secondary)',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              清空
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((result, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {result.timestamp.toLocaleString('zh-CN')}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: '#3498db' }}>
                    <Download size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {result.download.toFixed(1)} Mbps
                  </span>
                  <span style={{ color: '#2ecc71' }}>
                    <Upload size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {result.upload.toFixed(1)} Mbps
                  </span>
                  <span style={{ color: '#9b59b6' }}>
                    <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {result.latency} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
