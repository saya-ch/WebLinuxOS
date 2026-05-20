import { useState, useRef, useEffect, useCallback } from 'react'

interface Recording {
  id: string
  name: string
  duration: number
  date: string
  blob: Blob | null
  url: string
}

export default function SoundRecorder() {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const selectedRecording = recordings.find(r => r.id === selectedId) || null

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = '#181825'
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(69, 71, 90, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, (h / 4) * i)
      ctx.lineTo(w, (h / 4) * i)
      ctx.stroke()
    }

    const gradient = ctx.createLinearGradient(0, 0, w, 0)
    gradient.addColorStop(0, '#f38ba8')
    gradient.addColorStop(0.5, '#fab387')
    gradient.addColorStop(1, '#f38ba8')

    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.beginPath()

    const sliceWidth = w / bufferLength
    let x = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * h) / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.lineTo(w, h / 2)
    ctx.stroke()

    ctx.fillStyle = 'rgba(243, 139, 168, 0.08)'
    ctx.beginPath()
    x = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * h) / 2
      if (i === 0) { ctx.moveTo(x, y) }
      else ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()

    animRef.current = requestAnimationFrame(drawWaveform)
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setHasPermission(true)

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      audioContextRef.current = audioCtx
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const newRecording: Recording = {
          id: Date.now().toString(),
          name: `录音 ${recordings.length + 1}`,
          duration: elapsed,
          date: new Date().toLocaleDateString('zh-CN'),
          blob,
          url,
        }
        setRecordings(prev => [newRecording, ...prev])
        setSelectedId(newRecording.id)
      }

      mediaRecorder.start(100)
      setRecording(true)
      setPaused(false)
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)

      drawWaveform()
    } catch {
      setHasPermission(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    cancelAnimationFrame(animRef.current)
    setRecording(false)
    setPaused(false)
  }

  const togglePause = () => {
    if (!mediaRecorderRef.current) return
    if (paused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
    } else {
      mediaRecorderRef.current.pause()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    setPaused(!paused)
  }

  const playRecording = (rec: Recording) => {
    if (playingId === rec.id) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      setPlayingId(null)
      return
    }
    if (audioRef.current) { audioRef.current.pause() }
    const audio = new Audio(rec.url)
    audio.onended = () => setPlayingId(null)
    audio.play()
    audioRef.current = audio
    setPlayingId(rec.id)
  }

  const deleteRecording = (id: string) => {
    const rec = recordings.find(r => r.id === id)
    if (rec) URL.revokeObjectURL(rec.url)
    setRecordings(prev => prev.filter(r => r.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (playingId === id && audioRef.current) { audioRef.current.pause(); setPlayingId(null) }
  }

  const startRename = (rec: Recording) => {
    setEditingId(rec.id)
    setEditName(rec.name)
  }

  const finishRename = (id: string) => {
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, name: editName || r.name } : r))
    setEditingId(null)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioContextRef.current) audioContextRef.current.close()
      if (audioRef.current) audioRef.current.pause()
      recordings.forEach(r => URL.revokeObjectURL(r.url))
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)

    if (!recording) {
      const ctx2 = canvas.getContext('2d')
      if (!ctx2) return
      const w = rect.width
      const h = rect.height
      ctx2.fillStyle = '#181825'
      ctx2.fillRect(0, 0, w, h)
      for (let i = 0; i < 4; i++) {
        ctx2.strokeStyle = 'rgba(69, 71, 90, 0.3)'
        ctx2.lineWidth = 1
        ctx2.beginPath()
        ctx2.moveTo(0, (h / 4) * i)
        ctx2.lineTo(w, (h / 4) * i)
        ctx2.stroke()
      }
      ctx2.strokeStyle = '#45475a'
      ctx2.lineWidth = 2
      ctx2.beginPath()
      ctx2.moveTo(0, h / 2)
      ctx2.lineTo(w, h / 2)
      ctx2.stroke()
    }
  }, [recording])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #313244', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
          {recording ? (paused ? '⏸ 录音已暂停' : '🔴 正在录音') : '🎙️ 录音机'}
        </div>

        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: '64px', borderRadius: '8px',
            margin: '12px 0', display: 'block',
          }}
        />

        <div style={{ fontSize: '28px', fontFamily: 'monospace', color: recording ? '#f38ba8' : '#cdd6f4', marginBottom: '12px' }}>
          {formatTime(elapsed)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {!recording ? (
            <button
              onClick={startRecording}
              style={{
                width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: '#f38ba8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', color: '#1e1e2e',
              }}
            >
              🎤
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                style={{
                  width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: '#f9e2af', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {paused ? '▶' : '⏸'}
              </button>
              <button
                onClick={stopRecording}
                style={{
                  width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: '#f38ba8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                ⏹
              </button>
            </>
          )}
        </div>

        {hasPermission === false && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#f38ba8' }}>
            无法访问麦克风，请授权后重试
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          录音列表 ({recordings.length})
        </div>

        {recordings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#6c7086', fontSize: '12px' }}>
            暂无录音，点击麦克风按钮开始录音
          </div>
        )}

        {recordings.map((rec) => (
          <div
            key={rec.id}
            onClick={() => setSelectedId(rec.id)}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 12px',
              background: selectedId === rec.id ? '#313244' : 'transparent',
              borderRadius: '8px', marginBottom: '4px', cursor: 'pointer', fontSize: '12px', gap: '10px',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); playRecording(rec) }}
              style={{
                width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: playingId === rec.id ? '#f38ba8' : '#45475a',
                color: '#cdd6f4', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {playingId === rec.id ? '⏹' : '▶'}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              {editingId === rec.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => finishRename(rec.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') finishRename(rec.id) }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{
                    width: '100%', padding: '2px 6px', background: '#181825',
                    border: '1px solid #89b4fa', borderRadius: '4px', color: '#cdd6f4', fontSize: '12px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rec.name}
                </div>
              )}
              <div style={{ color: '#6c7086', fontSize: '11px' }}>
                {formatTime(rec.duration)} · {rec.date}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button
                onClick={(e) => { e.stopPropagation(); startRename(rec) }}
                style={{
                  padding: '4px 6px', background: 'transparent', border: 'none',
                  color: '#a6adc8', cursor: 'pointer', fontSize: '12px', borderRadius: '4px',
                }}
                title="重命名"
              >
                ✏️
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteRecording(rec.id) }}
                style={{
                  padding: '4px 6px', background: 'transparent', border: 'none',
                  color: '#f38ba8', cursor: 'pointer', fontSize: '12px', borderRadius: '4px',
                }}
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {selectedRecording && (
          <div style={{ marginTop: '12px', background: '#313244', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{selectedRecording.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginBottom: '8px' }}>
              {[
                { label: '时长', value: formatTime(selectedRecording.duration) },
                { label: '格式', value: 'WebM' },
                { label: '大小', value: selectedRecording.blob ? `${(selectedRecording.blob.size / 1024).toFixed(1)} KB` : '-' },
                { label: '日期', value: selectedRecording.date },
              ].map((item) => (
                <div key={item.label}>
                  <span style={{ color: '#6c7086' }}>{item.label}: </span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => playRecording(selectedRecording)}
                style={{
                  padding: '4px 12px', background: '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                }}
              >
                {playingId === selectedRecording.id ? '⏹ 停止' : '▶ 播放'}
              </button>
              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = selectedRecording.url
                  a.download = `${selectedRecording.name}.webm`
                  a.click()
                }}
                style={{
                  padding: '4px 12px', background: '#313244', color: '#cdd6f4',
                  border: '1px solid #45475a', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                }}
              >
                💾 导出
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
