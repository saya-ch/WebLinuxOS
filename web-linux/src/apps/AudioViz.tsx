import { useState, useRef, useEffect, useCallback, memo } from 'react'
import {
  Play, Pause, Square, Volume2, Mic, Music, Radio, Palette,
  BarChart3, Activity, Circle, Sparkles, Waves, Upload,
  SkipForward, SkipBack, Settings2
} from 'lucide-react'

type VizType = 'bars' | 'wave' | 'circle' | 'particles' | 'pulse'
type SourceType = 'mic' | 'file' | 'demo' | 'system'
type ThemeName = 'purple' | 'neon' | 'aurora' | 'fire' | 'ocean'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  hue: number
}

const themes: Record<ThemeName, { primary: string; secondary: string; accent: string; bg: string; colors: string[] }> = {
  purple: {
    primary: '#a78bfa',
    secondary: '#7c3aed',
    accent: '#c4b5fd',
    bg: 'rgba(30, 20, 60, 0.85)',
    colors: ['#a78bfa', '#7c3aed', '#c4b5fd', '#8b5cf6', '#6d28d9'],
  },
  neon: {
    primary: '#00ff88',
    secondary: '#00d4ff',
    accent: '#ff00ff',
    bg: 'rgba(10, 20, 30, 0.85)',
    colors: ['#00ff88', '#00d4ff', '#ff00ff', '#ffff00', '#ff6600'],
  },
  aurora: {
    primary: '#4ade80',
    secondary: '#22d3ee',
    accent: '#a78bfa',
    bg: 'rgba(10, 30, 40, 0.85)',
    colors: ['#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#60a5fa'],
  },
  fire: {
    primary: '#f97316',
    secondary: '#ef4444',
    accent: '#fbbf24',
    bg: 'rgba(40, 15, 10, 0.85)',
    colors: ['#f97316', '#ef4444', '#fbbf24', '#dc2626', '#f59e0b'],
  },
  ocean: {
    primary: '#3b82f6',
    secondary: '#06b6d4',
    accent: '#8b5cf6',
    bg: 'rgba(10, 25, 50, 0.85)',
    colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#14b8a6', '#6366f1'],
  },
}

const visualizers: { id: VizType; name: string; icon: typeof BarChart3 }[] = [
  { id: 'bars', name: '频谱柱状图', icon: BarChart3 },
  { id: 'wave', name: '波形图', icon: Activity },
  { id: 'circle', name: '圆形频谱', icon: Circle },
  { id: 'particles', name: '粒子效果', icon: Sparkles },
  { id: 'pulse', name: '脉冲圆环', icon: Waves },
]

const sources: { id: SourceType; name: string; icon: typeof Mic }[] = [
  { id: 'mic', name: '麦克风', icon: Mic },
  { id: 'file', name: '本地文件', icon: Music },
  { id: 'demo', name: '演示模式', icon: Radio },
  { id: 'system', name: '系统音频', icon: Volume2 },
]

const themeList: { id: ThemeName; name: string }[] = [
  { id: 'purple', name: '紫色' },
  { id: 'neon', name: '霓虹' },
  { id: 'aurora', name: '极光' },
  { id: 'fire', name: '火焰' },
  { id: 'ocean', name: '海洋' },
]

const AudioViz = memo(function AudioViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const bufferLengthRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sourceNodeRef = useRef<AudioNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const demoGainRef = useRef<GainNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [sensitivity, setSensitivity] = useState(1.0)
  const [vizType, setVizType] = useState<VizType>('bars')
  const [sourceType, setSourceType] = useState<SourceType>('demo')
  const [theme, setTheme] = useState<ThemeName>('purple')
  const [fileName, setFileName] = useState('')
  const [demoFreq, setDemoFreq] = useState(440)
  const [_isInitialized, _setIsInitialized] = useState(false)
  const [error, setError] = useState('')

  const currentTheme = themes[theme]

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.8
      bufferLengthRef.current = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLengthRef.current)
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = volume
      gainNodeRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }, [volume])

  const disconnectSource = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect() } catch { /* ignore */ }
      sourceNodeRef.current = null
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop() } catch { /* ignore */ }
      oscillatorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
  }, [])

  const startDemo = useCallback(() => {
    if (!audioContextRef.current || !gainNodeRef.current) return
    disconnectSource()

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()

    oscillator.type = 'sawtooth'
    oscillator.frequency.value = demoFreq
    gain.gain.value = 0.3

    lfo.type = 'sine'
    lfo.frequency.value = 0.5
    lfoGain.gain.value = 100
    lfo.connect(lfoGain)
    lfoGain.connect(oscillator.frequency)
    lfo.start()

    oscillator.connect(gain)
    gain.connect(gainNodeRef.current)
    oscillator.start()

    oscillatorRef.current = oscillator
    demoGainRef.current = gain
    sourceNodeRef.current = oscillator
  }, [demoFreq, disconnectSource])

  const startMic = useCallback(async () => {
    if (!audioContextRef.current || !gainNodeRef.current) return
    disconnectSource()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(gainNodeRef.current)
      sourceNodeRef.current = source
      setError('')
    } catch (e) {
      setError('无法访问麦克风，请检查权限设置')
      setIsPlaying(false)
    }
  }, [disconnectSource])

  const startFile = useCallback((file: File) => {
    if (!audioContextRef.current || !gainNodeRef.current) return
    disconnectSource()

    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.crossOrigin = 'anonymous'
    audioElementRef.current = audio

    const source = audioContextRef.current.createMediaElementSource(audio)
    source.connect(gainNodeRef.current)
    sourceNodeRef.current = source

    audio.play().catch(() => {
      setError('音频文件播放失败')
    })
    setFileName(file.name)
  }, [disconnectSource])

  const startSystemAudio = useCallback(async () => {
    if (!audioContextRef.current || !gainNodeRef.current) return
    disconnectSource()
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      const audioTracks = displayStream.getAudioTracks()
      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach(t => t.stop())
        setError('当前屏幕共享未选择系统音频，请在屏幕共享时勾选"共享系统音频"')
        setIsPlaying(false)
        return
      }
      const audioStream = new MediaStream(audioTracks)
      displayStream.getVideoTracks().forEach(t => t.stop())
      streamRef.current = audioStream
      const source = audioContextRef.current.createMediaStreamSource(audioStream)
      source.connect(gainNodeRef.current)
      sourceNodeRef.current = source
      setError('')
    } catch (e) {
      setError('无法捕获系统音频，请确保浏览器支持屏幕共享音频捕获')
      setIsPlaying(false)
    }
  }, [disconnectSource])

  const togglePlay = useCallback(async () => {
    initAudio()
    if (!isPlaying) {
      setIsPlaying(true)
      setError('')
      switch (sourceType) {
        case 'demo':
          startDemo()
          break
        case 'mic':
          await startMic()
          break
        case 'system':
          await startSystemAudio()
          break
        case 'file':
          if (audioElementRef.current) {
            audioElementRef.current.play().catch(() => {
              setError('请先选择一个音频文件')
              setIsPlaying(false)
            })
          } else {
            fileInputRef.current?.click()
          }
          break
      }
    } else {
      setIsPlaying(false)
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop() } catch { /* ignore */ }
        oscillatorRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [isPlaying, sourceType, initAudio, startDemo, startMic, startSystemAudio])

  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    disconnectSource()
    setFileName('')
  }, [disconnectSource])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      initAudio()
      setIsPlaying(true)
      startFile(file)
    }
  }, [initAudio, startFile])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
  }, [volume])

  useEffect(() => {
    if (oscillatorRef.current && isPlaying && sourceType === 'demo') {
      oscillatorRef.current.frequency.setValueAtTime(demoFreq, audioContextRef.current?.currentTime || 0)
    }
  }, [demoFreq, isPlaying, sourceType])

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
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      timeRef.current += 0.016

      const width = canvas.width
      const height = canvas.height
      const dpr = window.devicePixelRatio

      if (!analyserRef.current || !dataArrayRef.current || !isPlaying) {
        ctx.fillStyle = currentTheme.bg
        ctx.fillRect(0, 0, width, height)
        drawIdleState(ctx, width, height)
        return
      }

      const buffer = new Uint8Array(bufferLengthRef.current)
      analyserRef.current.getByteFrequencyData(buffer)
      const timeBuffer = new Uint8Array(bufferLengthRef.current)
      analyserRef.current.getByteTimeDomainData(timeBuffer)

      const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length
      const adjusted = buffer.map(v => Math.min(255, v * sensitivity))

      ctx.fillStyle = currentTheme.bg
      ctx.fillRect(0, 0, width, height)

      switch (vizType) {
        case 'bars':
          drawBars(ctx, width, height, adjusted, dpr)
          break
        case 'wave':
          drawWave(ctx, width, height, timeBuffer, dpr)
          break
        case 'circle':
          drawCircleViz(ctx, width, height, adjusted, dpr)
          break
        case 'particles':
          drawParticles(ctx, width, height, adjusted, avg, dpr)
          break
        case 'pulse':
          drawPulse(ctx, width, height, avg, dpr)
          break
      }
    }

    draw()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [vizType, isPlaying, sensitivity, currentTheme])

  const drawIdleState = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const t = timeRef.current

    ctx.save()
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 5; i++) {
      const radius = 50 + i * 30 + Math.sin(t + i) * 10
      ctx.strokeStyle = currentTheme.colors[i % currentTheme.colors.length]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.fillStyle = currentTheme.primary
    ctx.font = `${16 * window.devicePixelRatio}px sans-serif`
    ctx.textAlign = 'center'
    ctx.globalAlpha = 0.6
    ctx.fillText('点击播放开始可视化', cx, cy + 120 * window.devicePixelRatio)
    ctx.restore()
  }

  const drawBars = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, dpr: number) => {
    const barCount = 64
    const step = Math.floor(data.length / barCount)
    const barWidth = w * 0.8 / barCount
    const gap = barWidth * 0.3
    const startX = w * 0.1

    for (let i = 0; i < barCount; i++) {
      const value = data[i * step] / 255
      const barHeight = value * h * 0.7
      const x = startX + i * (barWidth + gap)
      const y = h - barHeight - h * 0.1

      const gradient = ctx.createLinearGradient(0, y, 0, h - h * 0.1)
      gradient.addColorStop(0, currentTheme.colors[i % currentTheme.colors.length])
      gradient.addColorStop(1, currentTheme.secondary)

      ctx.fillStyle = gradient
      ctx.shadowColor = currentTheme.primary
      ctx.shadowBlur = 15 * dpr

      const radius = barWidth / 2
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth - gap, barHeight, [radius, radius, 0, 0])
      ctx.fill()

      ctx.shadowBlur = 0
    }
  }

  const drawWave = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, dpr: number) => {
    const sliceWidth = w / data.length
    let x = 0

    ctx.lineWidth = 3 * dpr
    ctx.strokeStyle = currentTheme.primary
    ctx.shadowColor = currentTheme.primary
    ctx.shadowBlur = 20 * dpr

    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0
      const y = (v * h) / 2
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }
    ctx.stroke()

    ctx.lineTo(w, h / 2)
    ctx.lineTo(0, h / 2)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, currentTheme.primary + '40')
    gradient.addColorStop(0.5, currentTheme.secondary + '20')
    gradient.addColorStop(1, currentTheme.primary + '40')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.shadowBlur = 0

    ctx.strokeStyle = currentTheme.accent + '60'
    ctx.lineWidth = 1 * dpr
    ctx.beginPath()
    x = 0
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0
      const y = (v * h) / 2 + h * 0.1
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }
    ctx.stroke()
  }

  const drawCircleViz = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, dpr: number) => {
    const cx = w / 2
    const cy = h / 2
    const baseRadius = Math.min(w, h) * 0.2
    const barCount = 128
    const step = Math.floor(data.length / barCount)

    ctx.save()
    ctx.translate(cx, cy)

    for (let i = 0; i < barCount; i++) {
      const value = data[i * step] / 255
      const barHeight = value * baseRadius * 1.5
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2

      const x1 = Math.cos(angle) * baseRadius
      const y1 = Math.sin(angle) * baseRadius
      const x2 = Math.cos(angle) * (baseRadius + barHeight)
      const y2 = Math.sin(angle) * (baseRadius + barHeight)

      ctx.strokeStyle = currentTheme.colors[i % currentTheme.colors.length]
      ctx.lineWidth = 3 * dpr
      ctx.lineCap = 'round'
      ctx.shadowColor = currentTheme.primary
      ctx.shadowBlur = 10 * dpr

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(0, 0, baseRadius * 0.8, 0, Math.PI * 2)
    ctx.fillStyle = currentTheme.bg
    ctx.fill()
    ctx.strokeStyle = currentTheme.primary
    ctx.lineWidth = 2 * dpr
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(0, 0, baseRadius * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = currentTheme.primary + '30'
    ctx.fill()

    ctx.restore()
  }

  const drawParticles = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, _avg: number, dpr: number) => {
    const particles = particlesRef.current
    const bass = data.slice(0, 20).reduce((a, b) => a + b, 0) / 20 / 255
    const treble = data.slice(80, 120).reduce((a, b) => a + b, 0) / 40 / 255

    if (bass > 0.3 && Math.random() < bass * 0.5) {
      for (let i = 0; i < Math.floor(bass * 5); i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + bass * 8
        particles.push({
          x: w / 2,
          y: h / 2,
          vx: Math.cos(angle) * speed * dpr,
          vy: Math.sin(angle) * speed * dpr,
          size: (3 + Math.random() * 5) * dpr,
          life: 1,
          maxLife: 60 + Math.random() * 60,
          hue: Math.random() * 360,
        })
      }
    }

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05 * dpr
      p.life -= 1 / p.maxLife

      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      const colorIndex = Math.floor(p.hue / 72) % currentTheme.colors.length
      ctx.fillStyle = currentTheme.colors[colorIndex]
      ctx.globalAlpha = p.life * (0.5 + treble * 0.5)
      ctx.shadowColor = currentTheme.colors[colorIndex]
      ctx.shadowBlur = 10 * dpr

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (0.5 + bass * 0.5), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()

    if (particles.length > 500) {
      particles.splice(0, particles.length - 500)
    }
  }

  const drawPulse = (ctx: CanvasRenderingContext2D, w: number, h: number, avg: number, dpr: number) => {
    const cx = w / 2
    const cy = h / 2
    const maxRadius = Math.min(w, h) * 0.4
    const t = timeRef.current
    const intensity = avg / 255

    ctx.save()

    for (let i = 4; i >= 0; i--) {
      const phase = (t * 0.5 + i * 0.2) % 1
      const radius = maxRadius * phase
      const alpha = (1 - phase) * intensity * 2

      if (alpha > 0) {
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = currentTheme.colors[i % currentTheme.colors.length]
        ctx.globalAlpha = alpha * 0.6
        ctx.lineWidth = (3 + intensity * 5) * dpr
        ctx.shadowColor = currentTheme.primary
        ctx.shadowBlur = 20 * dpr
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    const centerRadius = maxRadius * 0.3 * (1 + intensity * 0.3)
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerRadius)
    gradient.addColorStop(0, currentTheme.primary)
    gradient.addColorStop(0.7, currentTheme.secondary + '80')
    gradient.addColorStop(1, currentTheme.secondary + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2)
    ctx.fill()

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + t * 0.3
      const dist = maxRadius * 0.7 + Math.sin(t * 2 + i) * 20 * dpr
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      const dotSize = (4 + intensity * 6) * dpr

      ctx.fillStyle = currentTheme.colors[i % currentTheme.colors.length]
      ctx.shadowColor = currentTheme.primary
      ctx.shadowBlur = 10 * dpr
      ctx.beginPath()
      ctx.arc(x, y, dotSize, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  const handleSourceChange = (source: SourceType) => {
    if (isPlaying) {
      stopPlayback()
    }
    setSourceType(source)
    setError('')
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${currentTheme.primary}50`,
              }}
            >
              <Waves size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>AudioViz 音乐可视化</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {sources.find(s => s.id === sourceType)?.name}
                {fileName ? ` · ${fileName}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {visualizers.map(v => {
            const Icon = v.icon
            return (
              <button
                key={v.id}
                onClick={() => setVizType(v.id)}
                title={v.name}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: 'none',
                  background: vizType === v.id
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
                    : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: vizType === v.id ? `0 0 15px ${currentTheme.primary}50` : 'none',
                }}
              >
                <Icon size={16} />
              </button>
            )
          })}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {error && (
          <div
            style={{
              margin: '0 20px 12px',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              fontSize: 12,
              color: '#fca5a5',
              pointerEvents: 'auto',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: '16px 20px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {sources.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => handleSourceChange(s.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: sourceType === s.id
                      ? `1px solid ${currentTheme.primary}`
                      : '1px solid rgba(255,255,255,0.1)',
                    background: sourceType === s.id
                      ? `${currentTheme.primary}20`
                      : 'rgba(255,255,255,0.05)',
                    color: sourceType === s.id ? currentTheme.primary : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={14} />
                  {s.name}
                </button>
              )
            })}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            {sourceType === 'file' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <Upload size={14} />
                上传文件
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 16,
            }}
          >
            {sourceType === 'demo' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setDemoFreq(Math.max(100, demoFreq - 50))}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipBack size={14} />
                </button>
                <span style={{ fontSize: 11, opacity: 0.7, minWidth: 60, textAlign: 'center' }}>
                  {demoFreq} Hz
                </span>
                <button
                  onClick={() => setDemoFreq(Math.min(2000, demoFreq + 50))}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipForward size={14} />
                </button>
              </div>
            )}

            <button
              onClick={stopPlayback}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <Square size={16} />
            </button>

            <button
              onClick={togglePlay}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: 'none',
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 20px ${currentTheme.primary}60`,
                transition: 'all 0.2s',
                transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
              <Volume2 size={16} style={{ opacity: 0.7 }} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  appearance: 'none',
                  background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings2 size={14} style={{ opacity: 0.7 }} />
              <span style={{ fontSize: 11, opacity: 0.7 }}>灵敏度</span>
              <input
                type="range"
                min="0.3"
                max="2"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                style={{
                  width: 100,
                  height: 4,
                  borderRadius: 2,
                  appearance: 'none',
                  background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${((sensitivity - 0.3) / 1.7) * 100}%, rgba(255,255,255,0.1) ${((sensitivity - 0.3) / 1.7) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: 11, opacity: 0.7, minWidth: 30 }}>
                {sensitivity.toFixed(1)}x
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={14} style={{ opacity: 0.7 }} />
              {themeList.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.name}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: theme === t.id ? '2px solid #fff' : '2px solid transparent',
                    background: `linear-gradient(135deg, ${themes[t.id].primary}, ${themes[t.id].secondary})`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: theme === t.id ? `0 0 10px ${themes[t.id].primary}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
`}</style>
    </div>
  )
})

export default AudioViz
