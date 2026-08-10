import { useState, useRef, useEffect, useCallback, memo } from 'react'
import {
  Activity, Play, Pause, Square, RotateCcw, Download,
  Settings2, BarChart3, Volume2, VolumeX, Trash2,
  Zap, Waves, GitBranch, ArrowUpDown,
  AlertTriangle, CheckCircle, TrendingUp
} from 'lucide-react'

type DataPattern = 'sine' | 'randomWalk' | 'step' | 'ramp'

interface ChannelConfig {
  id: number
  name: string
  pattern: DataPattern
  color: string
  amplitude: number
  frequency: number
  phase: number
  offset: number
  noise: number
  enabled: boolean
  threshold: number
  alertEnabled: boolean
}

interface DataPoint {
  timestamp: number
  values: number[]
}

interface ChannelStats {
  mean: number
  variance: number
  max: number
  min: number
  count: number
}

const PATTERN_LABELS: Record<DataPattern, string> = {
  sine: '正弦波',
  randomWalk: '随机游走',
  step: '阶跃函数',
  ramp: '斜坡函数',
}

const PATTERN_ICONS: Record<DataPattern, React.ReactNode> = {
  sine: <Waves size={14} />,
  randomWalk: <GitBranch size={14} />,
  step: <ArrowUpDown size={14} />,
  ramp: <TrendingUp size={14} />,
}

const DEFAULT_COLORS = ['#00d4ff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8', '#f06595']

const LiveDataPipeline = memo(function LiveDataPipeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const dataBufferRef = useRef<DataPoint[]>([])
  const timeRef = useRef(0)
  const lastFrameRef = useRef(0)
  const phaseAccumRef = useRef<number[]>([0, 0, 0, 0])
  const stepStateRef = useRef<number[]>([0, 0, 0, 0])
  const rwStateRef = useRef<number[]>([0, 0, 0, 0])
  const prevValuesRef = useRef<number[]>([0, 0, 0, 0])
  const recordingRef = useRef(false)
  const recordedDataRef = useRef<DataPoint[]>([])
  const playbackRef = useRef(false)
  const playbackIndexRef = useRef(0)
  const playbackDataRef = useRef<DataPoint[]>([])
  const statsAccumRef = useRef<{ sum: number; sumSq: number; max: number; min: number; count: number }[]>([])
  const renderFrameCbRef = useRef<(timestamp: number) => void>(() => {})

  const [isRunning, setIsRunning] = useState(false)
  const [sampleRate, setSampleRate] = useState(50)
  const [bufferSize, setBufferSize] = useState(500)
  const [channels, setChannels] = useState<ChannelConfig[]>([
    { id: 0, name: '通道 A', pattern: 'sine', color: DEFAULT_COLORS[0], amplitude: 10, frequency: 1, phase: 0, offset: 0, noise: 0.5, enabled: true, threshold: 8, alertEnabled: true },
    { id: 1, name: '通道 B', pattern: 'randomWalk', color: DEFAULT_COLORS[1], amplitude: 5, frequency: 1, phase: 0, offset: 0, noise: 0.3, enabled: true, threshold: 15, alertEnabled: true },
    { id: 2, name: '通道 C', pattern: 'step', color: DEFAULT_COLORS[2], amplitude: 8, frequency: 0.5, phase: 0, offset: 0, noise: 0.2, enabled: true, threshold: 12, alertEnabled: false },
    { id: 3, name: '通道 D', pattern: 'ramp', color: DEFAULT_COLORS[3], amplitude: 6, frequency: 0.3, phase: 0, offset: 0, noise: 0.4, enabled: false, threshold: 10, alertEnabled: false },
  ])
  const [stats, setStats] = useState<ChannelStats[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPlayback, setIsPlayback] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showConfig, setShowConfig] = useState(true)
  const [alertFlash, setAlertFlash] = useState<Record<number, number>>({})
  const [newAlert, setNewAlert] = useState(false)
  const [bufferCount, setBufferCount] = useState(0)
  const [recordedCount, setRecordedCount] = useState(0)
  const [playbackIdx, setPlaybackIdx] = useState(0)
  const [playbackTotal, setPlaybackTotal] = useState(0)

  const channelsRef = useRef(channels)
  const isRunningRef = useRef(isRunning)
  const bufferSizeRef = useRef(bufferSize)
  const sampleRateRef = useRef(sampleRate)
  const soundEnabledRef = useRef(soundEnabled)
  const alertFlashRef = useRef(alertFlash)

  useEffect(() => { channelsRef.current = channels }, [channels])
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])
  useEffect(() => { bufferSizeRef.current = bufferSize }, [bufferSize])
  useEffect(() => { sampleRateRef.current = sampleRate }, [sampleRate])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { alertFlashRef.current = alertFlash }, [alertFlash])

  const generateValueFn = useCallback((ch: ChannelConfig, t: number, dt: number): number => {
    phaseAccumRef.current[ch.id] += dt * ch.frequency * Math.PI * 2
    const phase = phaseAccumRef.current[ch.id] + ch.phase

    let value = 0
    switch (ch.pattern) {
      case 'sine':
        value = ch.amplitude * Math.sin(phase) + ch.offset
        break
      case 'randomWalk': {
        const step = (Math.random() - 0.5) * ch.amplitude * 0.3
        rwStateRef.current[ch.id] = Math.max(-ch.amplitude * 2, Math.min(ch.amplitude * 2, rwStateRef.current[ch.id] + step))
        value = rwStateRef.current[ch.id] + ch.offset
        break
      }
      case 'step': {
        if (Math.random() < dt * ch.frequency) {
          stepStateRef.current[ch.id] = (Math.random() - 0.5) * ch.amplitude * 2
        }
        value = stepStateRef.current[ch.id] + ch.offset
        break
      }
      case 'ramp': {
        const period = 1 / Math.max(ch.frequency, 0.01)
        const sawtooth = ((t % period) / period) * 2 - 1
        value = sawtooth * ch.amplitude + ch.offset
        break
      }
    }

    value += (Math.random() - 0.5) * ch.noise
    prevValuesRef.current[ch.id] = value
    return value
  }, [])

  const generateValueRef = useRef(generateValueFn)
  useEffect(() => { generateValueRef.current = generateValueFn }, [generateValueFn])

  const playAlertSoundFn = useCallback((channelId: number, enabled: boolean) => {
    if (!enabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 440 + channelId * 80
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      /* ignore */
    }
  }, [])

  const playAlertSoundRef = useRef(playAlertSoundFn)
  useEffect(() => { playAlertSoundRef.current = playAlertSoundFn }, [playAlertSoundFn])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const dpr = window.devicePixelRatio

    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)'
    ctx.lineWidth = 1 * dpr
    const gridRows = 6
    const gridCols = 10
    for (let i = 0; i <= gridRows; i++) {
      const y = (i / gridRows) * h
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    for (let i = 0; i <= gridCols; i++) {
      const x = (i / gridCols) * w
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }

    const data = playbackRef.current
      ? playbackDataRef.current.slice(0, playbackIndexRef.current + 1)
      : dataBufferRef.current

    if (data.length < 2) return

    const enabledChannels = channelsRef.current.filter(c => c.enabled)
    const allValues: number[] = []
    for (const d of data) {
      for (const ch of enabledChannels) {
        if (d.values[ch.id] !== undefined) allValues.push(d.values[ch.id])
      }
    }

    if (allValues.length === 0) return

    const dataMin = Math.min(...allValues)
    const dataMax = Math.max(...allValues)
    const range = Math.max(dataMax - dataMin, 1)
    const padding = range * 0.2
    const yMin = dataMin - padding
    const yMax = dataMax + padding
    const yRange = yMax - yMin

    const leftPad = 50 * dpr
    const rightPad = 10 * dpr
    const topPad = 10 * dpr
    const bottomPad = 24 * dpr
    const plotW = w - leftPad - rightPad
    const plotH = h - topPad - bottomPad

    ctx.fillStyle = 'rgba(0, 212, 255, 0.6)'
    ctx.font = `${10 * dpr}px monospace`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 5; i++) {
      const y = topPad + (i / 5) * plotH
      const val = yMax - (i / 5) * yRange
      ctx.fillText(val.toFixed(1), leftPad - 6 * dpr, y)
    }

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)'
    ctx.lineWidth = 1 * dpr
    ctx.beginPath()
    ctx.moveTo(leftPad, topPad)
    ctx.lineTo(leftPad, h - bottomPad)
    ctx.lineTo(w - rightPad, h - bottomPad)
    ctx.stroke()

    for (const ch of enabledChannels) {
      const thresholdY = topPad + ((yMax - ch.threshold) / yRange) * plotH
      if (thresholdY >= topPad && thresholdY <= h - bottomPad) {
        ctx.strokeStyle = ch.color + '40'
        ctx.lineWidth = 1 * dpr
        ctx.setLineDash([4 * dpr, 4 * dpr])
        ctx.beginPath()
        ctx.moveTo(leftPad, thresholdY)
        ctx.lineTo(w - rightPad, thresholdY)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = ch.color + '80'
        ctx.font = `${9 * dpr}px monospace`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`${ch.name} 阈值: ${ch.threshold.toFixed(1)}`, leftPad + 4 * dpr, thresholdY - 2 * dpr)
      }
    }

    for (const ch of enabledChannels) {
      ctx.strokeStyle = ch.color
      ctx.lineWidth = 2 * dpr
      ctx.lineJoin = 'round'
      ctx.shadowColor = ch.color
      ctx.shadowBlur = 8 * dpr

      ctx.beginPath()
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        const v = d.values[ch.id]
        if (v === undefined) continue
        const x = leftPad + (i / Math.max(data.length - 1, 1)) * plotW
        const y = topPad + ((yMax - v) / yRange) * plotH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.shadowBlur = 0

      const lastPoint = data[data.length - 1]
      const lastVal = lastPoint.values[ch.id]
      if (lastVal !== undefined) {
        const x = leftPad + plotW
        const y = topPad + ((yMax - lastVal) / yRange) * plotH
        ctx.fillStyle = ch.color
        ctx.beginPath()
        ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = ch.color
        ctx.font = `bold ${10 * dpr}px monospace`
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(lastVal.toFixed(2), x - 6 * dpr, y)
      }
    }

    const timeLabels = 6
    ctx.fillStyle = 'rgba(0, 212, 255, 0.5)'
    ctx.font = `${9 * dpr}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const sr = sampleRateRef.current
    for (let i = 0; i <= timeLabels; i++) {
      const x = leftPad + (i / timeLabels) * plotW
      const t = timeRef.current - (1 - i / timeLabels) * (data.length / Math.max(sr, 1))
      ctx.fillText(t.toFixed(1) + 's', x, h - bottomPad + 4 * dpr)
    }
  }, [])

  const drawCanvasRef = useRef(drawCanvas)
  useEffect(() => { drawCanvasRef.current = drawCanvas }, [drawCanvas])

  const renderFrameRef = useCallback((timestamp: number) => {
    if (!lastFrameRef.current) lastFrameRef.current = timestamp
    const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.1)
    lastFrameRef.current = timestamp

    const channels = channelsRef.current
    const isRunning = isRunningRef.current
    const bufferSize = bufferSizeRef.current
    const sampleRate = sampleRateRef.current
    const soundEnabled = soundEnabledRef.current

    if (isRunning && !playbackRef.current) {
      timeRef.current += dt
      const enabledChannels = channels.filter(c => c.enabled)
      const values: number[] = new Array(channels.length).fill(0)

      for (const ch of enabledChannels) {
        values[ch.id] = generateValueRef.current(ch, timeRef.current, dt)
      }

      const point: DataPoint = { timestamp: timeRef.current, values }

      if (recordingRef.current) {
        recordedDataRef.current.push(point)

        for (const ch of enabledChannels) {
          if (ch.alertEnabled && Math.abs(values[ch.id]) > ch.threshold) {
            const key = ch.id
            const last = alertFlashRef.current[key] || 0
            if (timeRef.current - last > 0.5) {
              alertFlashRef.current[key] = timeRef.current
              setAlertFlash(prev => ({ ...prev, [key]: timeRef.current }))
              setNewAlert(true)
              setTimeout(() => setNewAlert(false), 300)
              playAlertSoundRef.current(ch.id, soundEnabled)
            }
          }
        }
      }

      dataBufferRef.current.push(point)
      if (dataBufferRef.current.length > bufferSize) {
        dataBufferRef.current.shift()
      }

      for (const ch of enabledChannels) {
        const v = values[ch.id]
        const acc = statsAccumRef.current[ch.id] || { sum: 0, sumSq: 0, max: -Infinity, min: Infinity, count: 0 }
        acc.sum += v
        acc.sumSq += v * v
        acc.max = Math.max(acc.max, v)
        acc.min = Math.min(acc.min, v)
        acc.count += 1
        statsAccumRef.current[ch.id] = acc
      }

      if (Math.floor(timeRef.current * 4) !== Math.floor((timeRef.current - dt) * 4)) {
        const newStats: ChannelStats[] = channels.map((_ch, i) => {
          const acc = statsAccumRef.current[i]
          if (!acc || acc.count === 0) return { mean: 0, variance: 0, max: 0, min: 0, count: 0 }
          const mean = acc.sum / acc.count
          const variance = (acc.sumSq / acc.count) - (mean * mean)
          return { mean, variance: Math.max(0, variance), max: acc.max, min: acc.min, count: acc.count }
        })
        setStats(newStats)
      }

      setBufferCount(dataBufferRef.current.length)
      if (recordingRef.current) {
        setRecordedCount(recordedDataRef.current.length)
        setRecordingDuration(Math.floor(timeRef.current))
      }
    }

    if (playbackRef.current) {
      const data = playbackDataRef.current
      if (data.length > 0) {
        const idx = Math.min(Math.floor(timestamp / (1000 / Math.max(sampleRate, 1))), data.length - 1)
        playbackIndexRef.current = idx
        setPlaybackIdx(idx)
      }
    }

    drawCanvasRef.current()
    animationRef.current = requestAnimationFrame(renderFrameCbRef.current)
  }, [])

  useEffect(() => { renderFrameCbRef.current = renderFrameRef }, [renderFrameRef])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(container)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(renderFrameCbRef.current)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const toggleRun = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const clearData = useCallback(() => {
    dataBufferRef.current = []
    timeRef.current = 0
    rwStateRef.current = [0, 0, 0, 0]
    stepStateRef.current = [0, 0, 0, 0]
    phaseAccumRef.current = [0, 0, 0, 0]
    prevValuesRef.current = [0, 0, 0, 0]
    statsAccumRef.current = []
    recordedDataRef.current = []
    playbackDataRef.current = []
    playbackRef.current = false
    playbackIndexRef.current = 0
    setIsPlayback(false)
    setIsRecording(false)
    setRecordingDuration(0)
    setStats([])
    setBufferCount(0)
    setRecordedCount(0)
    setPlaybackIdx(0)
    setPlaybackTotal(0)
  }, [])

  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      recordedDataRef.current = []
      recordingRef.current = true
      setIsRecording(true)
      setRecordingDuration(0)
      setRecordedCount(0)
    } else {
      recordingRef.current = false
      setIsRecording(false)
    }
  }, [isRecording])

  const togglePlayback = useCallback(() => {
    if (isPlayback) {
      playbackRef.current = false
      setIsPlayback(false)
      return
    }
    if (recordedDataRef.current.length === 0) return
    playbackDataRef.current = [...recordedDataRef.current]
    dataBufferRef.current = [...recordedDataRef.current]
    playbackIndexRef.current = 0
    playbackRef.current = true
    setIsPlayback(true)
    setIsRunning(false)
    setPlaybackTotal(recordedDataRef.current.length)
    setPlaybackIdx(0)
  }, [isPlayback])

  const exportCSV = useCallback(() => {
    const data = recordedDataRef.current.length > 0
      ? recordedDataRef.current
      : dataBufferRef.current

    if (data.length === 0) return

    const enabledCh = channelsRef.current.filter(c => c.enabled)
    const headers = ['timestamp', ...enabledCh.map(c => c.name)].join(',')
    const rows = data.map(d => {
      const vals = enabledCh.map(c => d.values[c.id]?.toFixed(4) ?? '0')
      return [d.timestamp.toFixed(3), ...vals].join(',')
    })
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-pipeline-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const updateChannel = useCallback((id: number, patch: Partial<ChannelConfig>) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [])

  const hasRecorded = recordedCount > 0
  const enabledChannels = channels.filter(c => c.enabled)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #0a0e1a 0%, #0f1525 100%)',
      color: '#e0e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(10, 14, 26, 0.9)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>LiveDataPipeline</div>
            <div style={{ fontSize: 11, color: 'rgba(0, 212, 255, 0.6)' }}>
              实时数据流处理与可视化
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {newAlert && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              borderRadius: 6,
              fontSize: 11,
              color: '#ff6b6b',
              animation: 'pulse 0.5s ease-in-out',
            }}>
              <AlertTriangle size={12} />
              阈值触发
            </div>
          )}

          <button
            onClick={toggleRun}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: isRunning
                ? 'linear-gradient(135deg, #ff6b6b, #ee5a5a)'
                : 'linear-gradient(135deg, #00d4ff, #0099cc)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: isRunning ? '0 0 15px rgba(255, 107, 107, 0.4)' : '0 0 15px rgba(0, 212, 255, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? '暂停' : '开始'}
          </button>

          <button
            onClick={clearData}
            title="清除数据"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(0, 212, 255, 0.2)',
              background: 'rgba(0, 212, 255, 0.05)',
              color: 'rgba(0, 212, 255, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={toggleRecording}
            title={isRecording ? '停止录制' : '开始录制'}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: isRecording ? '1px solid #ff6b6b' : '1px solid rgba(0, 212, 255, 0.2)',
              background: isRecording ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 212, 255, 0.05)',
              color: isRecording ? '#ff6b6b' : 'rgba(0, 212, 255, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none',
            }}
          >
            <Square size={12} />
          </button>

          <button
            onClick={togglePlayback}
            disabled={!hasRecorded}
            title="回放录制数据"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: isPlayback ? '1px solid #51cf66' : '1px solid rgba(0, 212, 255, 0.2)',
              background: isPlayback ? 'rgba(81, 207, 102, 0.2)' : 'rgba(0, 212, 255, 0.05)',
              color: isPlayback ? '#51cf66' : 'rgba(0, 212, 255, 0.8)',
              cursor: hasRecorded ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: hasRecorded ? 1 : 0.4,
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={exportCSV}
            title="导出 CSV"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(0, 212, 255, 0.2)',
              background: 'rgba(0, 212, 255, 0.05)',
              color: 'rgba(0, 212, 255, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={14} />
          </button>

          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? '关闭声音' : '开启声音'}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: soundEnabled ? '1px solid #ffd43b' : '1px solid rgba(0, 212, 255, 0.2)',
              background: soundEnabled ? 'rgba(255, 212, 59, 0.1)' : 'rgba(0, 212, 255, 0.05)',
              color: soundEnabled ? '#ffd43b' : 'rgba(0, 212, 255, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button
            onClick={() => setShowConfig(prev => !prev)}
            title={showConfig ? '隐藏配置' : '显示配置'}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(0, 212, 255, 0.2)',
              background: showConfig ? 'rgba(0, 212, 255, 0.15)' : 'rgba(0, 212, 255, 0.05)',
              color: 'rgba(0, 212, 255, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1px',
        padding: '8px 12px',
        background: 'rgba(10, 14, 26, 0.7)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {channels.map(ch => (
            <div
              key={ch.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: ch.enabled ? ch.color + '15' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${ch.enabled ? ch.color + '40' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: ch.enabled ? 1 : 0.4,
              }}
              onClick={() => updateChannel(ch.id, { enabled: !ch.enabled })}
            >
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: ch.color,
                boxShadow: ch.enabled ? `0 0 8px ${ch.color}` : 'none',
              }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{ch.name}</span>
              {ch.alertEnabled && ch.enabled && (
                <Zap size={10} style={{ color: ch.color }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'rgba(0, 212, 255, 0.6)' }}>
          <span>
            <BarChart3 size={12} style={{ display: 'inline', marginRight: 4 }} />
            {bufferCount} / {bufferSize}
          </span>
          {isRecording && (
            <span style={{ color: '#ff6b6b' }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ff6b6b',
                marginRight: 4,
                animation: 'pulse 1s infinite',
              }} />
              REC {recordingDuration}s ({recordedCount} 点)
            </span>
          )}
          {isPlayback && (
            <span style={{ color: '#51cf66' }}>
              <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
              回放中 {playbackIdx}/{playbackTotal}
            </span>
          )}
          <span>采样率: {sampleRate}Hz</span>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            borderRadius: 12,
            background: '#0a0e1a',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.05)',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>

        {showConfig && (
          <div style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflow: 'auto',
            flexShrink: 0,
          }}>
            <div style={{
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(0, 212, 255, 0.03)',
              border: '1px solid rgba(0, 212, 255, 0.15)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'rgba(0, 212, 255, 0.8)' }}>
                全局参数
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(0, 212, 255, 0.6)', display: 'block', marginBottom: 4 }}>
                    采样率: {sampleRate} Hz
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={sampleRate}
                    onChange={(e) => setSampleRate(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#00d4ff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(0, 212, 255, 0.6)', display: 'block', marginBottom: 4 }}>
                    缓冲区: {bufferSize} 点
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={50}
                    value={bufferSize}
                    onChange={(e) => setBufferSize(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#00d4ff' }}
                  />
                </div>
              </div>
            </div>

            {channels.map(ch => (
              <div
                key={ch.id}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  background: ch.enabled ? ch.color + '08' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${ch.enabled ? ch.color + '30' : 'rgba(255,255,255,0.08)'}`,
                  opacity: ch.enabled ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: ch.color,
                      boxShadow: `0 0 8px ${ch.color}`,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{ch.name}</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(0, 212, 255, 0.6)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ch.alertEnabled}
                      onChange={(e) => updateChannel(ch.id, { alertEnabled: e.target.checked })}
                      style={{ accentColor: '#ffd43b' }}
                    />
                    警报
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'rgba(0, 212, 255, 0.5)', display: 'block', marginBottom: 3 }}>
                      数据模式
                    </label>
                    <select
                      value={ch.pattern}
                      onChange={(e) => updateChannel(ch.id, { pattern: e.target.value as DataPattern })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        borderRadius: 4,
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        color: '#e0e8f0',
                        fontSize: 11,
                      }}
                    >
                      {Object.entries(PATTERN_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: 'rgba(0, 212, 255, 0.5)', display: 'block', marginBottom: 3 }}>
                      振幅: {ch.amplitude.toFixed(1)}
                    </label>
                    <input
                      type="range" min={0.5} max={20} step={0.5}
                      value={ch.amplitude}
                      onChange={(e) => updateChannel(ch.id, { amplitude: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: ch.color }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: 'rgba(0, 212, 255, 0.5)', display: 'block', marginBottom: 3 }}>
                      频率: {ch.frequency.toFixed(2)} Hz
                    </label>
                    <input
                      type="range" min={0.05} max={5} step={0.05}
                      value={ch.frequency}
                      onChange={(e) => updateChannel(ch.id, { frequency: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: ch.color }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: 'rgba(0, 212, 255, 0.5)', display: 'block', marginBottom: 3 }}>
                      噪声: {ch.noise.toFixed(1)}
                    </label>
                    <input
                      type="range" min={0} max={5} step={0.1}
                      value={ch.noise}
                      onChange={(e) => updateChannel(ch.id, { noise: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: ch.color }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: 'rgba(0, 212, 255, 0.5)', display: 'block', marginBottom: 3 }}>
                      阈值: {ch.threshold.toFixed(1)}
                    </label>
                    <input
                      type="range" min={0} max={25} step={0.5}
                      value={ch.threshold}
                      onChange={(e) => updateChannel(ch.id, { threshold: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: ch.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '8px 12px 12px',
        background: 'rgba(10, 14, 26, 0.9)',
        borderTop: '1px solid rgba(0, 212, 255, 0.1)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {enabledChannels.map(ch => {
          const s = stats[ch.id]
          return (
            <div
              key={ch.id}
              style={{
                flex: '1 0 160px',
                minWidth: 160,
                padding: '10px 14px',
                borderRadius: 10,
                background: ch.color + '10',
                border: `1px solid ${ch.color}30`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: ch.color,
                  boxShadow: `0 0 6px ${ch.color}`,
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: ch.color }}>{ch.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                  {PATTERN_ICONS[ch.pattern]} {PATTERN_LABELS[ch.pattern]}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px',
                fontSize: 11,
              }}>
                <StatItem label="均值" value={s?.mean ?? 0} color={ch.color} />
                <StatItem label="方差" value={s?.variance ?? 0} color={ch.color} />
                <StatItem label="最大" value={s?.max ?? 0} color="#ff6b6b" />
                <StatItem label="最小" value={s?.min ?? 0} color="#51cf66" />
                <StatItem label="数量" value={s?.count ?? 0} color="#ffd43b" isInt />
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
})

function StatItem({ label, value, color, isInt }: { label: string; value: number; color: string; isInt?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color,
        fontFamily: 'monospace',
      }}>
        {isInt ? Math.floor(value).toString() : value.toFixed(2)}
      </div>
    </div>
  )
}

export default LiveDataPipeline
