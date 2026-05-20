import { useState, useRef, useEffect } from 'react'

interface Recording {
  id: string
  name: string
  duration: number
  size: string
  date: string
  fps: number
  quality: string
  blobUrl: string
}

export default function ScreenRecorder() {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [fps, setFps] = useState(30)
  const [quality, setQuality] = useState('high')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getDisplayMedia)
  }, [])

  const qualityBitrate: Record<string, number> = { low: 1000000, medium: 2500000, high: 5000000, ultra: 8000000 }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream, { videoBitsPerSecond: qualityBitrate[quality] || 5000000 })
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const blobUrl = URL.createObjectURL(blob)
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1)
        const newRec: Recording = {
          id: Date.now().toString(),
          name: `录制_${new Date().toLocaleTimeString('zh-CN').replace(/:/g, '-')}.webm`,
          duration: elapsed,
          size: `${sizeMB} MB`,
          date: new Date().toLocaleDateString('zh-CN'),
          fps,
          quality: quality === 'low' ? '低' : quality === 'medium' ? '中' : quality === 'high' ? '高' : '超高',
          blobUrl,
        }
        setRecordings((prev) => [newRec, ...prev])
        setElapsed(0)
      }
      const videoTrack = stream.getVideoTracks()[0]
      videoTrack.onended = () => { stopRecording() }
      mediaRecorder.start(1000)
      setRecording(true)
      setPaused(false)
      setElapsed(0)
      timerRef.current = setInterval(() => { setElapsed((p) => p + 1) }, 1000)
    } catch { /* user cancelled */ }
  }

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setRecording(false)
    setPaused(false)
  }

  const togglePause = () => {
    if (!mediaRecorderRef.current) return
    if (paused) { mediaRecorderRef.current.resume(); timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000) }
    else { mediaRecorderRef.current.pause(); if (timerRef.current) clearInterval(timerRef.current) }
    setPaused(!paused)
  }

  const deleteRecording = (id: string) => {
    setRecordings((prev) => { const r = prev.find((x) => x.id === id); if (r) URL.revokeObjectURL(r.blobUrl); return prev.filter((x) => x.id !== id) })
    if (selectedRecording?.id === id) setSelectedRecording(null)
    if (playingUrl) setPlayingUrl(null)
  }

  const exportRecording = (rec: Recording) => {
    const a = document.createElement('a'); a.href = rec.blobUrl; a.download = rec.name; a.click()
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!supported) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1e1e2e', color: '#cdd6f4', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>⏺</div>
        <div style={{ fontSize: 14 }}>您的浏览器不支持屏幕录制功能</div>
        <div style={{ fontSize: 12, color: '#6c7086' }}>请使用 Chrome、Firefox 或 Edge 浏览器</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #313244' }}>
        <div style={{ padding: 20, textAlign: 'center', borderBottom: '1px solid #313244' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {recording && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f38ba8', animation: 'blink 1s infinite' }} />}
            {recording ? (paused ? '已暂停' : '正在录制') : '屏幕录制器'}
          </div>
          <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
          <div style={{ fontSize: 36, fontFamily: 'monospace', color: recording ? '#f38ba8' : '#cdd6f4', margin: '12px 0' }}>{formatTime(elapsed)}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {!recording ? (
              <button onClick={startRecording} style={{ padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#f38ba8', color: '#fff' }}>开始录制</button>
            ) : (
              <>
                <button onClick={togglePause} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#f9e2af', color: '#1e1e2e' }}>{paused ? '继续' : '暂停'}</button>
                <button onClick={stopRecording} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#f38ba8', color: '#fff' }}>停止</button>
              </>
            )}
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>帧率</label>
            <select value={fps} onChange={(e) => setFps(Number(e.target.value))} disabled={recording} style={{ padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none' }}>
              <option value={24}>24 FPS</option><option value={30}>30 FPS</option><option value={60}>60 FPS</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>质量</label>
            <select value={quality} onChange={(e) => setQuality(e.target.value)} disabled={recording} style={{ padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none' }}>
              <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="ultra">超高</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end', fontSize: 11, color: '#6c7086' }}>
            比特率: {((qualityBitrate[quality] || 5000000) / 1000000).toFixed(1)} Mbps
          </div>
        </div>
        {playingUrl && (
          <div style={{ flex: 1, padding: 12 }}>
            <video src={playingUrl} controls style={{ width: '100%', maxHeight: '100%', borderRadius: 8, background: '#000' }} />
          </div>
        )}
      </div>
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244' }}>录制历史 ({recordings.length})</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {recordings.length === 0 && <div style={{ fontSize: 12, color: '#6c7086', textAlign: 'center', marginTop: 20 }}>暂无录制记录</div>}
          {recordings.map((rec) => (
            <div key={rec.id} onClick={() => { setSelectedRecording(rec); setPlayingUrl(null) }} style={{ padding: '8px 10px', background: selectedRecording?.id === rec.id ? '#313244' : 'transparent', borderRadius: 6, marginBottom: 2, cursor: 'pointer', fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{rec.name}</div>
              <div style={{ color: '#6c7086', fontSize: 11 }}>{formatTime(rec.duration)} | {rec.size} | {rec.date}</div>
            </div>
          ))}
        </div>
        {selectedRecording && (
          <div style={{ padding: 12, borderTop: '1px solid #313244', background: '#313244' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{selectedRecording.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, marginBottom: 8 }}>
              <div><span style={{ color: '#6c7086' }}>时长: </span>{formatTime(selectedRecording.duration)}</div>
              <div><span style={{ color: '#6c7086' }}>大小: </span>{selectedRecording.size}</div>
              <div><span style={{ color: '#6c7086' }}>帧率: </span>{selectedRecording.fps} FPS</div>
              <div><span style={{ color: '#6c7086' }}>质量: </span>{selectedRecording.quality}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPlayingUrl(selectedRecording.blobUrl)} style={{ flex: 1, padding: '6px 0', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>播放</button>
              <button onClick={() => exportRecording(selectedRecording)} style={{ flex: 1, padding: '6px 0', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>导出</button>
              <button onClick={() => deleteRecording(selectedRecording.id)} style={{ flex: 1, padding: '6px 0', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>删除</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
