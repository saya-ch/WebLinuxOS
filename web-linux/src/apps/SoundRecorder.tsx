import { useState, useRef, useEffect } from 'react'

interface SoundRecording {
  id: string
  name: string
  duration: string
  date: string
  size: string
}

const mockRecordings: SoundRecording[] = [
  { id: '1', name: '会议录音.wav', duration: '32:15', date: '2024-05-15', size: '180 MB' },
  { id: '2', name: '语音备忘录.wav', duration: '02:45', date: '2024-05-16', size: '15 MB' },
  { id: '3', name: '演示录音.wav', duration: '05:10', date: '2024-05-17', size: '28 MB' },
]

export default function SoundRecorder() {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [recordings] = useState<SoundRecording[]>(mockRecordings)
  const [selectedRecording, setSelectedRecording] = useState<SoundRecording | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animationId: number
    if (recording && waveRef.current) {
      const animate = () => {
        if (waveRef.current) {
          const bars = waveRef.current.children
          for (let i = 0; i < bars.length; i++) {
            const bar = bars[i] as HTMLElement
            const height = 4 + Math.random() * 40
            bar.style.height = `${height}px`
          }
        }
        animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
    }
    return () => cancelAnimationFrame(animationId)
  }, [recording])

  const toggleRecording = () => {
    if (recording) {
      if (timerRef.current) clearInterval(timerRef.current)
      setRecording(false)
    } else {
      setElapsed(0)
      setRecording(true)
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #313244', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
          {recording ? '🔴 正在录音' : '🎙️ 录音机'}
        </div>

        <div
          ref={waveRef}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
            height: '48px', margin: '12px 0',
          }}
        >
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '4px', height: recording ? '8px' : '4px',
                background: recording ? '#f38ba8' : '#45475a',
                borderRadius: '2px', transition: recording ? 'none' : 'height 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: '24px', fontFamily: 'monospace', color: recording ? '#f38ba8' : '#cdd6f4', marginBottom: '12px' }}>
          {formatTime(elapsed)}
        </div>

        <button
          onClick={toggleRecording}
          style={{
            width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: recording ? '#f38ba8' : '#f38ba8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
            fontSize: '20px',
          }}
        >
          {recording ? '⏹' : '🎤'}
        </button>
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>录音列表</div>
        {recordings.map((rec) => (
          <div
            key={rec.id}
            onClick={() => setSelectedRecording(rec)}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 12px',
              background: selectedRecording?.id === rec.id ? '#313244' : 'transparent',
              borderRadius: '8px', marginBottom: '4px', cursor: 'pointer', fontSize: '12px', gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🎵</span>
            <span style={{ fontWeight: 600, flex: 1 }}>{rec.name}</span>
            <span style={{ color: '#a6adc8' }}>{rec.duration}</span>
            <span style={{ color: '#89b4fa' }}>{rec.size}</span>
            <span style={{ color: '#6c7086' }}>{rec.date}</span>
          </div>
        ))}

        {selectedRecording && (
          <div style={{ marginTop: '12px', background: '#313244', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{selectedRecording.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginBottom: '8px' }}>
              {[
                { label: '时长', value: selectedRecording.duration },
                { label: '大小', value: selectedRecording.size },
                { label: '格式', value: 'WAV' },
                { label: '日期', value: selectedRecording.date },
              ].map((item) => (
                <div key={item.label}>
                  <span style={{ color: '#6c7086' }}>{item.label}: </span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                padding: '4px 12px', background: '#313244', color: '#cdd6f4',
                border: '1px solid #45475a', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              }}>
                ▶ 播放
              </button>
              <button style={{
                padding: '4px 12px', background: '#313244', color: '#cdd6f4',
                border: '1px solid #45475a', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              }}>
                导出
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}