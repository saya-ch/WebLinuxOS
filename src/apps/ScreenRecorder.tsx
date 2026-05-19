import { useState, useRef } from 'react'

interface Recording {
  id: string
  name: string
  duration: string
  size: string
  date: string
  fps: number
  quality: string
}

const mockRecordings: Recording[] = [
  { id: '1', name: '演示视频.mp4', duration: '05:32', size: '128 MB', date: '2024-05-15', fps: 30, quality: '高' },
  { id: '2', name: '教程录制.mp4', duration: '15:20', size: '356 MB', date: '2024-05-16', fps: 60, quality: '超高' },
  { id: '3', name: '快速演示.mp4', duration: '01:45', size: '42 MB', date: '2024-05-17', fps: 24, quality: '中' },
]

export default function ScreenRecorder() {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [fps, setFps] = useState(30)
  const [quality, setQuality] = useState('高')
  const [recordings] = useState<Recording[]>(mockRecordings)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      <div style={{ padding: '16px', borderBottom: '1px solid #313244', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
          {recording ? '🔴 正在录制' : '⏺️ 屏幕录制器'}
        </div>
        <div style={{ fontSize: '28px', fontFamily: 'monospace', color: recording ? '#f38ba8' : '#cdd6f4', margin: '8px 0' }}>
          {formatTime(elapsed)}
        </div>
        <button
          onClick={toggleRecording}
          style={{
            padding: '12px 28px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            background: recording ? '#f38ba8' : '#f38ba8',
            color: '#fff',
          }}
        >
          {recording ? '⏹ 停止录制' : '⏺ 开始录制'}
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', gap: '16px' }}>
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
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>录制历史</div>
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
            <span style={{ fontSize: '20px' }}>🎬</span>
            <span style={{ fontWeight: 600, flex: 1 }}>{rec.name}</span>
            <span style={{ color: '#a6adc8' }}>{rec.duration}</span>
            <span style={{ color: '#89b4fa' }}>{rec.size}</span>
            <span style={{ color: '#6c7086' }}>{rec.date}</span>
          </div>
        ))}

        {selectedRecording && (
          <div style={{ marginTop: '12px', background: '#313244', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{selectedRecording.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
              {[
                { label: '时长', value: selectedRecording.duration },
                { label: '大小', value: selectedRecording.size },
                { label: '帧率', value: `${selectedRecording.fps} FPS` },
                { label: '质量', value: selectedRecording.quality },
                { label: '日期', value: selectedRecording.date },
                { label: '格式', value: 'MP4' },
              ].map((item) => (
                <div key={item.label}>
                  <span style={{ color: '#6c7086' }}>{item.label}: </span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button style={{ padding: '6px 14px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                播放
              </button>
              <button style={{ padding: '6px 14px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                导出
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}