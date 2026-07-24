import { useState, useRef, useEffect, useCallback } from 'react'

interface RecordingItem {
  id: string
  name: string
  duration: number
  size: string
  date: string
  format: string
  blobUrl: string
}

type RecStatus = 'idle' | 'recording' | 'paused'

export default function ScreenCapture() {
  const [status, setStatus] = useState<RecStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [format, setFormat] = useState('video/webm')
  const [recordings, setRecordings] = useState<RecordingItem[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const [dotVisible, setDotVisible] = useState(true)
  const [error, setError] = useState('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getDisplayMedia)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (dotTimerRef.current) clearInterval(dotTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (status === 'recording') {
      dotTimerRef.current = setInterval(() => setDotVisible((v) => !v), 500)
    } else {
      if (dotTimerRef.current) clearInterval(dotTimerRef.current)
      setDotVisible(true)
    }
    return () => {
      if (dotTimerRef.current) clearInterval(dotTimerRef.current)
    }
  }, [status])

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported(format) ? format : 'video/webm'
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const blobUrl = URL.createObjectURL(blob)
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1)
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const newRec: RecordingItem = {
          id: Date.now().toString(),
          name: `屏幕录制_${new Date().toLocaleTimeString('zh-CN').replace(/:/g, '-')}.${ext}`,
          duration: elapsed,
          size: `${sizeMB} MB`,
          date: new Date().toLocaleDateString('zh-CN'),
          format: ext.toUpperCase(),
          blobUrl,
        }
        setRecordings((prev) => [newRec, ...prev])

        const a = document.createElement('a')
        a.href = blobUrl
        a.download = newRec.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      const videoTrack = stream.getVideoTracks()[0]
      videoTrack.onended = () => {
        stopRecording()
      }

      mediaRecorder.start(1000)
      setStatus('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    } catch (err) {
      setError('无法获取屏幕分享权限，请允许屏幕共享后重试')
    }
  }, [format, elapsed])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setStatus('idle')
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setStatus('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setStatus('recording')
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    }
  }, [])

  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id)
      if (rec) URL.revokeObjectURL(rec.blobUrl)
      return prev.filter((r) => r.id !== id)
    })
    if (previewUrl) setPreviewUrl(null)
  }, [previewUrl])

  if (!supported) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,24,0.95)', color: '#a0a0b8', padding: 40, textAlign: 'center' as const }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#cdd6f4' }}>浏览器不支持屏幕录制</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>请使用 Chrome 或 Edge 浏览器并确保 HTTPS 环境</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(14,14,24,0.95)', color: '#cdd6f4', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🎬</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>屏幕录制工具</span>
        {status === 'recording' && (
          <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotVisible ? '#ef4444' : 'transparent', transition: 'background 0.2s' }} />
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>REC</span>
          </div>
        )}
        {status === 'paused' && (
          <span style={{ marginLeft: 12, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⏸ 已暂停</span>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: status === 'recording' ? '#ef4444' : status === 'paused' ? '#f59e0b' : '#6c7086', letterSpacing: 2 }}>
          {formatTime(elapsed)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Format Selection */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#a78bfa' }}>📐 录制格式</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['video/webm', 'video/webm;codecs=vp9', 'video/mp4'].map((f) => {
              const isSupported = MediaRecorder.isTypeSupported(f)
              const label = f.includes('mp4') ? 'MP4' : f.includes('vp9') ? 'WebM (VP9)' : 'WebM'
              return (
                <button
                  key={f}
                  onClick={() => isSupported && setFormat(f)}
                  disabled={!isSupported || status !== 'idle'}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${format === f ? '#6c5ce7' : 'rgba(108,92,231,0.2)'}`,
                    background: format === f ? 'rgba(108,92,231,0.2)' : 'rgba(14,14,24,0.6)',
                    color: format === f ? '#a78bfa' : isSupported ? '#a0a0b8' : '#4a4a5a',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: !isSupported || status !== 'idle' ? 'not-allowed' : 'pointer',
                    opacity: !isSupported ? 0.4 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#a78bfa' }}>🎮 录制控制</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {status === 'idle' ? (
              <button
                onClick={startRecording}
                style={{
                  padding: '12px 36px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                }}
              >
                ⏺ 开始录制
              </button>
            ) : (
              <>
                {status === 'recording' && (
                  <button
                    onClick={pauseRecording}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: '1px solid rgba(245,158,11,0.35)',
                      background: 'rgba(245,158,11,0.12)',
                      color: '#f59e0b',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ⏸ 暂停
                  </button>
                )}
                {status === 'paused' && (
                  <button
                    onClick={resumeRecording}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: '1px solid rgba(34,197,94,0.35)',
                      background: 'rgba(34,197,94,0.12)',
                      color: '#22c55e',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ▶ 继续
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ⏹ 停止录制
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>👀 录制预览</span>
              <button
                onClick={() => setPreviewUrl(null)}
                style={{ background: 'none', border: 'none', color: '#a0a0b8', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            <video
              src={previewUrl}
              controls
              style={{ width: '100%', maxHeight: 240, borderRadius: 8, background: '#000' }}
            />
          </div>
        )}

        {/* Recordings List */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#a78bfa' }}>📋 录制历史 ({recordings.length})</div>
          {recordings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#6c7086', fontSize: 13 }}>暂无录制记录</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recordings.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'rgba(14,14,24,0.6)',
                    border: '1px solid rgba(108,92,231,0.12)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🎥</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{rec.name}</div>
                    <div style={{ color: '#6c7086', marginTop: 2 }}>
                      {formatTime(rec.duration)} · {rec.size} · {rec.format} · {rec.date}
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewUrl(rec.blobUrl)}
                    style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.25)', color: '#a78bfa', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >
                    播放
                  </button>
                  <button
                    onClick={() => deleteRecording(rec.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
