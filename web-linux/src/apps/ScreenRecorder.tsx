import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

interface Recording {
  id: string
  name: string
  duration: number
  size: string
  date: string
  fps: number
  quality: string
  url: string
}

export default function ScreenRecorder() {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [fps, setFps] = useState(30)
  const [quality, setQuality] = useState('高')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const isUnsupported = !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const elapsedRef = useRef(0)
  const fpsRef = useRef(fps)
  const qualityRef = useRef(quality)

  useEffect(() => {
    fpsRef.current = fps
  }, [fps])

  useEffect(() => {
    qualityRef.current = quality
  }, [quality])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const getBitrate = useCallback(() => {
    const baseBitrate = fpsRef.current * 100000
    const qualityMultiplier: Record<string, number> = { '低': 0.5, '中': 1, '高': 2, '超高': 4 }
    return baseBitrate * (qualityMultiplier[qualityRef.current] || 1)
  }, [])

  const displayBitrate = useMemo(() => {
    const baseBitrate = fps * 100000
    const qualityMultiplier: Record<string, number> = { '低': 0.5, '中': 1, '高': 2, '超高': 4 }
    return ((baseBitrate * (qualityMultiplier[quality] || 1)) / 1000000).toFixed(1)
  }, [fps, quality])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      streamRef.current = stream
      chunksRef.current = []
      elapsedRef.current = 0

      const bitrate = getBitrate()
      let mediaRecorder: MediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, { videoBitsPerSecond: bitrate })
      } catch {
        mediaRecorder = new MediaRecorder(stream)
      }
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const duration = elapsedRef.current
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1) + ' MB'
        const now = new Date()
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

        const newRecording: Recording = {
          id: `rec-${Date.now()}`,
          name: `录制_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.webm`,
          duration,
          size: sizeMB,
          date: dateStr,
          fps: fpsRef.current,
          quality: qualityRef.current,
          url,
        }

        setRecordings(prev => [newRecording, ...prev])
        setSelectedRecording(newRecording)

        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setRecording(false)
        setPaused(false)
        setElapsed(0)
        elapsedRef.current = 0
      }

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      }

      mediaRecorder.start(1000)
      setElapsed(0)
      setRecording(true)
      setPaused(false)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          elapsedRef.current = next
          return next
        })
      }, 1000)
    } catch {
      // user cancelled or not supported
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  const togglePause = () => {
    if (!mediaRecorderRef.current) return
    if (paused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          elapsedRef.current = next
          return next
        })
      }, 1000)
    } else {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    setPaused(!paused)
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const downloadRecording = (rec: Recording) => {
    const a = document.createElement('a')
    a.href = rec.url
    a.download = rec.name
    a.click()
  }

  const deleteRecording = (rec: Recording) => {
    URL.revokeObjectURL(rec.url)
    setRecordings(prev => prev.filter(r => r.id !== rec.id))
    if (selectedRecording?.id === rec.id) {
      setSelectedRecording(null)
      setPlayingUrl(null)
    }
  }

  if (isUnsupported) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>不支持屏幕录制</div>
        <div style={{ fontSize: '13px', color: '#a6adc8', lineHeight: 1.6 }}>
          您的浏览器不支持 getDisplayMedia API。<br />
          请使用最新版 Chrome、Edge 或 Firefox 浏览器。
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {recording && !paused && (
            <span className="rec-blink" style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f38ba8' }} />
          )}
          {recording ? (paused ? '⏸ 录制已暂停' : '正在录制') : '⏺️ 屏幕录制器'}
        </div>
        <div style={{ fontSize: '28px', fontFamily: 'monospace', color: recording ? '#f38ba8' : '#cdd6f4', margin: '8px 0' }}>
          {formatTime(elapsed)}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {!recording ? (
            <button
              onClick={startRecording}
              style={{
                padding: '12px 28px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                background: '#f38ba8', color: '#fff',
              }}
            >
              ⏺ 开始录制
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                style={{
                  padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  background: '#f9e2af', color: '#1e1e2e',
                }}
              >
                {paused ? '▶ 继续' : '⏸ 暂停'}
              </button>
              <button
                onClick={stopRecording}
                style={{
                  padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  background: '#f38ba8', color: '#fff',
                }}
              >
                ⏹ 停止录制
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#a6adc8', display: 'block', marginBottom: '4px' }}>帧率</label>
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            disabled={recording}
            style={{
              padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
              borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none',
            }}
          >
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#a6adc8', display: 'block', marginBottom: '4px' }}>质量</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            disabled={recording}
            style={{
              padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
              borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none',
            }}
          >
            <option value="低">低</option>
            <option value="中">中</option>
            <option value="高">高</option>
            <option value="超高">超高</option>
          </select>
        </div>
        <div style={{ fontSize: '11px', color: '#6c7086', paddingBottom: '8px' }}>
          比特率: {displayBitrate} Mbps
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          录制历史 {recordings.length > 0 && `(${recordings.length})`}
        </div>
        {recordings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6c7086', fontSize: '13px' }}>
            暂无录制记录，点击上方按钮开始录制
          </div>
        )}
        {recordings.map((rec) => (
          <div
            key={rec.id}
            onClick={() => { setSelectedRecording(rec); setPlayingUrl(null) }}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 12px',
              background: selectedRecording?.id === rec.id ? '#313244' : 'transparent',
              borderRadius: '8px', marginBottom: '4px', cursor: 'pointer', fontSize: '12px', gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🎬</span>
            <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</span>
            <span style={{ color: '#a6adc8' }}>{formatTime(rec.duration)}</span>
            <span style={{ color: '#89b4fa' }}>{rec.size}</span>
          </div>
        ))}

        {selectedRecording && (
          <div style={{ marginTop: '12px', background: '#313244', borderRadius: '8px', padding: '12px' }}>
            {playingUrl && (
              <video
                src={playingUrl}
                controls
                autoPlay
                style={{ width: '100%', borderRadius: '6px', marginBottom: '8px', background: '#000', maxHeight: '200px' }}
              />
            )}
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{selectedRecording.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
              {[
                { label: '时长', value: formatTime(selectedRecording.duration) },
                { label: '大小', value: selectedRecording.size },
                { label: '帧率', value: `${selectedRecording.fps} FPS` },
                { label: '质量', value: selectedRecording.quality },
                { label: '日期', value: selectedRecording.date },
                { label: '格式', value: 'WebM' },
              ].map((item) => (
                <div key={item.label}>
                  <span style={{ color: '#6c7086' }}>{item.label}: </span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setPlayingUrl(playingUrl === selectedRecording.url ? null : selectedRecording.url)}
                style={{ padding: '6px 14px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                {playingUrl === selectedRecording.url ? '关闭播放' : '播放'}
              </button>
              <button
                onClick={() => downloadRecording(selectedRecording)}
                style={{ padding: '6px 14px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                导出
              </button>
              <button
                onClick={() => deleteRecording(selectedRecording)}
                style={{ padding: '6px 14px', background: 'transparent', color: '#f38ba8', border: '1px solid #f38ba8', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes rec-blink-anim{0%,100%{opacity:1}50%{opacity:.3}}.rec-blink{animation:rec-blink-anim 1s infinite}`}</style>
    </div>
  )
}
