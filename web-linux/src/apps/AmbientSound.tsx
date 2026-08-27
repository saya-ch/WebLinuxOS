import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { Volume2, VolumeX, Clock, Play, Pause, RotateCcw } from 'lucide-react'

/**
 * AmbientSound - 环境音播放器
 * 使用 Web Audio API 实时合成环境音效（雨声、风声、火焰、海浪、森林、白噪声等）
 * 无需外部音频文件，纯代码生成，支持多音混合、独立音量控制、定时器
 */

interface SoundChannel {
  id: string
  name: string
  icon: string
  color: string
  volume: number
  active: boolean
  gainNode: GainNode | null
  nodes: AudioNode[]
}

type TimerDuration = 0 | 15 | 30 | 60 | 90 | 120

const TIMER_OPTIONS: { value: TimerDuration; label: string }[] = [
  { value: 0, label: '不限时' },
  { value: 15, label: '15分钟' },
  { value: 30, label: '30分钟' },
  { value: 60, label: '60分钟' },
  { value: 90, label: '90分钟' },
  { value: 120, label: '120分钟' },
]

const SOUND_PRESETS: Omit<SoundChannel, 'gainNode' | 'nodes' | 'volume' | 'active'>[] = [
  { id: 'rain', name: '雨声', icon: '🌧️', color: '#60a5fa' },
  { id: 'thunder', name: '雷声', icon: '⛈️', color: '#818cf8' },
  { id: 'wind', name: '风声', icon: '🌬️', color: '#6ee7b7' },
  { id: 'fire', name: '火焰', icon: '🔥', color: '#f97316' },
  { id: 'ocean', name: '海浪', icon: '🌊', color: '#38bdf8' },
  { id: 'forest', name: '森林', icon: '🌳', color: '#4ade80' },
  { id: 'birds', name: '鸟鸣', icon: '🐦', color: '#fbbf24' },
  { id: 'cafe', name: '咖啡馆', icon: '☕', color: '#a78bfa' },
  { id: 'whitenoise', name: '白噪声', icon: '📻', color: '#94a3b8' },
  { id: 'brownnoise', name: '粉噪声', icon: '📡', color: '#c084fc' },
  { id: 'keyboard', name: '键盘声', icon: '⌨️', color: '#34d399' },
  { id: 'clock', name: '钟表声', icon: '🕰️', color: '#f472b6' },
]

const STORAGE_KEY = 'ambient-sound-prefs'

const AmbientSound = memo(function AmbientSound() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const channelsRef = useRef<Map<string, SoundChannel>>(new Map())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [channels, setChannels] = useState<SoundChannel[]>(
    SOUND_PRESETS.map(p => ({ ...p, volume: 0.5, active: false, gainNode: null, nodes: [] }))
  )
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(0)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [masterGainNode, setMasterGainNode] = useState<GainNode | null>(null)

  // 初始化 AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  // 创建白噪声缓冲
  const createNoiseBuffer = useCallback((ctx: AudioContext, type: 'white' | 'brown' | 'pink'): AudioBuffer => {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * 4
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      if (type === 'white') {
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1
        }
      } else if (type === 'brown') {
        let lastOut = 0
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1
          data[i] = (lastOut + 0.02 * white) / 1.02
          lastOut = data[i]
          data[i] *= 3.5
        }
      } else {
        // Pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
          b6 = white * 0.115926
        }
      }
    }
    return buffer
  }, [])

  // 为每种声音类型创建特定的音效合成链
  const createSoundNodes = useCallback((ctx: AudioContext, soundId: string, gainNode: GainNode): AudioNode[] => {
    const nodes: AudioNode[] = []

    switch (soundId) {
      case 'rain': {
        // 雨声 = 粉噪声 + 低通滤波 + 随机雨滴声
        const noiseBuffer = createNoiseBuffer(ctx, 'pink')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const lpf = ctx.createBiquadFilter()
        lpf.type = 'lowpass'
        lpf.frequency.value = 3000
        lpf.Q.value = 0.5
        noise.connect(lpf)
        lpf.connect(gainNode)
        noise.start()
        nodes.push(noise, lpf)
        break
      }
      case 'thunder': {
        // 雷声 = 低频噪声 + 不规则脉冲
        const noiseBuffer = createNoiseBuffer(ctx, 'brown')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const lpf = ctx.createBiquadFilter()
        lpf.type = 'lowpass'
        lpf.frequency.value = 200
        lpf.Q.value = 1
        const volume = ctx.createGain()
        volume.gain.value = 0.3
        // 随机音量脉冲模拟雷声
        const pulseGain = ctx.createGain()
        pulseGain.gain.value = 0.1
        const schedulePulse = () => {
          const now = ctx.currentTime
          const delay = 3 + Math.random() * 8
          pulseGain.gain.setValueAtTime(0.05, now + delay)
          pulseGain.gain.linearRampToValueAtTime(0.8 + Math.random() * 0.2, now + delay + 0.1)
          pulseGain.gain.exponentialRampToValueAtTime(0.05, now + delay + 1.5 + Math.random())
          schedulePulseTimer = setTimeout(schedulePulse, (delay + 3) * 1000)
        }
        let schedulePulseTimer: ReturnType<typeof setTimeout> = setTimeout(schedulePulse, 1000)
        noise.connect(lpf)
        lpf.connect(volume)
        volume.connect(pulseGain)
        pulseGain.connect(gainNode)
        noise.start()
        nodes.push(noise, lpf, volume, pulseGain)
        // 清理定时器
        const origStop = noise.stop.bind(noise)
        noise.stop = () => { clearTimeout(schedulePulseTimer); origStop() }
        break
      }
      case 'wind': {
        // 风声 = 白噪声 + 带通滤波 + LFO调制
        const noiseBuffer = createNoiseBuffer(ctx, 'white')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const bpf = ctx.createBiquadFilter()
        bpf.type = 'bandpass'
        bpf.frequency.value = 800
        bpf.Q.value = 0.3
        // LFO for wind gusts
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.value = 0.15
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 400
        lfo.connect(lfoGain)
        lfoGain.connect(bpf.frequency)
        lfo.start()
        noise.connect(bpf)
        bpf.connect(gainNode)
        noise.start()
        nodes.push(noise, bpf, lfo, lfoGain)
        break
      }
      case 'fire': {
        // 火焰声 = 棕噪声 + 高通滤波 + 随机爆裂声
        const noiseBuffer = createNoiseBuffer(ctx, 'brown')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const hpf = ctx.createBiquadFilter()
        hpf.type = 'highpass'
        hpf.frequency.value = 400
        const volume = ctx.createGain()
        volume.gain.value = 0.6
        // 爆裂声合成
        const crackleBuffer = createNoiseBuffer(ctx, 'white')
        const crackle = ctx.createBufferSource()
        crackle.buffer = crackleBuffer
        crackle.loop = true
        const crackleFilter = ctx.createBiquadFilter()
        crackleFilter.type = 'bandpass'
        crackleFilter.frequency.value = 2000
        crackleFilter.Q.value = 5
        const crackleGain = ctx.createGain()
        crackleGain.gain.value = 0.08
        // 随机爆裂
        const scheduleCrackle = () => {
          const now = ctx.currentTime
          const delay = 0.1 + Math.random() * 0.5
          crackleGain.gain.setValueAtTime(0.02, now + delay)
          crackleGain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.1, now + delay + 0.02)
          crackleGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08)
          scheduleCrackleTimer = setTimeout(scheduleCrackle, (delay + 0.2) * 1000)
        }
        let scheduleCrackleTimer: ReturnType<typeof setTimeout> = setTimeout(scheduleCrackle, 100)
        noise.connect(hpf)
        hpf.connect(volume)
        volume.connect(gainNode)
        crackle.connect(crackleFilter)
        crackleFilter.connect(crackleGain)
        crackleGain.connect(gainNode)
        noise.start()
        crackle.start()
        nodes.push(noise, hpf, volume, crackle, crackleFilter, crackleGain)
        const origStop = noise.stop.bind(noise)
        noise.stop = () => { clearTimeout(scheduleCrackleTimer); origStop(); crackle.stop() }
        break
      }
      case 'ocean': {
        // 海浪 = 粉噪声 + 低通 + LFO调制音量模拟潮汐
        const noiseBuffer = createNoiseBuffer(ctx, 'pink')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const lpf = ctx.createBiquadFilter()
        lpf.type = 'lowpass'
        lpf.frequency.value = 2000
        // 潮汐 LFO
        const tideLfo = ctx.createOscillator()
        tideLfo.type = 'sine'
        tideLfo.frequency.value = 0.08
        const tideGain = ctx.createGain()
        tideGain.gain.value = 0.3
        const tideOffset = ctx.createConstantSource()
        tideOffset.offset.value = 0.5
        tideLfo.connect(tideGain)
        tideGain.connect(gainNode.gain)
        tideOffset.connect(gainNode.gain)
        tideLfo.start()
        tideOffset.start()
        noise.connect(lpf)
        lpf.connect(gainNode)
        noise.start()
        nodes.push(noise, lpf, tideLfo, tideGain, tideOffset)
        break
      }
      case 'forest': {
        // 森林 = 粉噪声(风) + 高频啁啾(鸟)
        const noiseBuffer = createNoiseBuffer(ctx, 'pink')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const lpf = ctx.createBiquadFilter()
        lpf.type = 'lowpass'
        lpf.frequency.value = 1500
        const windVol = ctx.createGain()
        windVol.gain.value = 0.4
        noise.connect(lpf)
        lpf.connect(windVol)
        windVol.connect(gainNode)
        noise.start()
        // 鸟鸣合成
        const birdOsc = ctx.createOscillator()
        birdOsc.type = 'sine'
        birdOsc.frequency.value = 2000
        const birdLfo = ctx.createOscillator()
        birdLfo.type = 'sine'
        birdLfo.frequency.value = 6
        const birdLfoGain = ctx.createGain()
        birdLfoGain.gain.value = 800
        birdLfo.connect(birdLfoGain)
        birdLfoGain.connect(birdOsc.frequency)
        const birdVol = ctx.createGain()
        birdVol.gain.value = 0.03
        birdOsc.connect(birdVol)
        birdVol.connect(gainNode)
        birdOsc.start()
        birdLfo.start()
        nodes.push(noise, lpf, windVol, birdOsc, birdLfo, birdLfoGain, birdVol)
        break
      }
      case 'birds': {
        // 多只鸟鸣合成
        const createBird = (freq: number, rate: number, vol: number) => {
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = freq
          const lfo = ctx.createOscillator()
          lfo.type = 'sine'
          lfo.frequency.value = rate
          const lfoGain = ctx.createGain()
          lfoGain.gain.value = freq * 0.4
          lfo.connect(lfoGain)
          lfoGain.connect(osc.frequency)
          const g = ctx.createGain()
          g.gain.value = vol
          osc.connect(g)
          g.connect(gainNode)
          osc.start()
          lfo.start()
          nodes.push(osc, lfo, lfoGain, g)
        }
        createBird(2200, 5, 0.02)
        createBird(3000, 7, 0.015)
        createBird(1800, 4, 0.025)
        createBird(4000, 8, 0.01)
        break
      }
      case 'cafe': {
        // 咖啡馆 = 棕噪声(人声) + 轻微餐具声
        const noiseBuffer = createNoiseBuffer(ctx, 'brown')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const bpf = ctx.createBiquadFilter()
        bpf.type = 'bandpass'
        bpf.frequency.value = 600
        bpf.Q.value = 0.8
        const vol = ctx.createGain()
        vol.gain.value = 0.5
        noise.connect(bpf)
        bpf.connect(vol)
        vol.connect(gainNode)
        noise.start()
        // 餐具碰撞
        const clinkBuffer = createNoiseBuffer(ctx, 'white')
        const clink = ctx.createBufferSource()
        clink.buffer = clinkBuffer
        clink.loop = true
        const clinkFilter = ctx.createBiquadFilter()
        clinkFilter.type = 'bandpass'
        clinkFilter.frequency.value = 4000
        clinkFilter.Q.value = 10
        const clinkGain = ctx.createGain()
        clinkGain.gain.value = 0.01
        clink.connect(clinkFilter)
        clinkFilter.connect(clinkGain)
        clinkGain.connect(gainNode)
        clink.start()
        nodes.push(noise, bpf, vol, clink, clinkFilter, clinkGain)
        break
      }
      case 'whitenoise': {
        const noiseBuffer = createNoiseBuffer(ctx, 'white')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const vol = ctx.createGain()
        vol.gain.value = 0.3
        noise.connect(vol)
        vol.connect(gainNode)
        noise.start()
        nodes.push(noise, vol)
        break
      }
      case 'brownnoise': {
        const noiseBuffer = createNoiseBuffer(ctx, 'brown')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const vol = ctx.createGain()
        vol.gain.value = 0.4
        noise.connect(vol)
        vol.connect(gainNode)
        noise.start()
        nodes.push(noise, vol)
        break
      }
      case 'keyboard': {
        // 键盘打字声 = 短促白噪声脉冲
        const noiseBuffer = createNoiseBuffer(ctx, 'white')
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        const hpf = ctx.createBiquadFilter()
        hpf.type = 'highpass'
        hpf.frequency.value = 3000
        // LFO 模拟不规则打字节奏
        const lfo = ctx.createOscillator()
        lfo.type = 'square'
        lfo.frequency.value = 8
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.5
        const vol = ctx.createGain()
        vol.gain.value = 0.15
        lfo.connect(lfoGain)
        lfoGain.connect(vol.gain)
        noise.connect(hpf)
        hpf.connect(vol)
        vol.connect(gainNode)
        noise.start()
        lfo.start()
        nodes.push(noise, hpf, lfo, lfoGain, vol)
        break
      }
      case 'clock': {
        // 钟表滴答声
        const tickOsc = ctx.createOscillator()
        tickOsc.type = 'sine'
        tickOsc.frequency.value = 1000
        const tickLfo = ctx.createOscillator()
        tickLfo.type = 'square'
        tickLfo.frequency.value = 1
        const tickLfoGain = ctx.createGain()
        tickLfoGain.gain.value = 0.5
        const tickVol = ctx.createGain()
        tickVol.gain.value = 0.08
        tickLfo.connect(tickLfoGain)
        tickLfoGain.connect(tickVol.gain)
        tickOsc.connect(tickVol)
        tickVol.connect(gainNode)
        tickOsc.start()
        tickLfo.start()
        // 第二个音调 (tock)
        const tockOsc = ctx.createOscillator()
        tockOsc.type = 'sine'
        tockOsc.frequency.value = 800
        const tockLfo = ctx.createOscillator()
        tockLfo.type = 'square'
        tockLfo.frequency.value = 1
        tockLfo.detune.value = 500
        const tockLfoGain = ctx.createGain()
        tockLfoGain.gain.value = 0.5
        const tockVol = ctx.createGain()
        tockVol.gain.value = 0.06
        tockLfo.connect(tockLfoGain)
        tockLfoGain.connect(tockVol.gain)
        tockOsc.connect(tockVol)
        tockVol.connect(gainNode)
        tockOsc.start()
        tockLfo.start()
        nodes.push(tickOsc, tickLfo, tickLfoGain, tickVol, tockOsc, tockLfo, tockLfoGain, tockVol)
        break
      }
    }
    return nodes
  }, [createNoiseBuffer])

  // 切换声音通道
  const toggleChannel = useCallback((channelId: string) => {
    const ctx = getAudioContext()
    const channel = channelsRef.current.get(channelId)
    if (!channel) return

    if (channel.active) {
      // 停止
      channel.nodes.forEach(n => { try { if ('stop' in n) (n as AudioBufferSourceNode).stop() } catch {} })
      channel.nodes = []
      if (channel.gainNode) {
        channel.gainNode.disconnect()
        channel.gainNode = null
      }
      channel.active = false
    } else {
      // 启动
      const gainNode = ctx.createGain()
      gainNode.gain.value = channel.volume
      const nodes = createSoundNodes(ctx, channelId, gainNode)
      channel.gainNode = gainNode
      channel.nodes = nodes
      channel.active = true
    }

    channelsRef.current.set(channelId, { ...channel })
    setChannels(prev => prev.map(c =>
      c.id === channelId ? { ...c, active: channel.active, gainNode: channel.gainNode, nodes: channel.nodes } : c
    ))

    // 检查是否有任何活跃通道
    const anyActive = Array.from(channelsRef.current.values()).some(ch => ch.active)
    setIsPlaying(anyActive)
  }, [getAudioContext, createSoundNodes])

  // 更新通道音量
  const updateChannelVolume = useCallback((channelId: string, vol: number) => {
    const channel = channelsRef.current.get(channelId)
    if (!channel) return
    if (channel.gainNode) {
      channel.gainNode.gain.value = vol
    }
    channel.volume = vol
    channelsRef.current.set(channelId, { ...channel })
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, volume: vol } : c))
  }, [])

  // 全局停止
  const stopAll = useCallback(() => {
    channelsRef.current.forEach((channel) => {
      if (channel.active) {
        channel.nodes.forEach(n => { try { if ('stop' in n) (n as AudioBufferSourceNode).stop() } catch {} })
        channel.nodes = []
        if (channel.gainNode) { channel.gainNode.disconnect(); channel.gainNode = null }
        channel.active = false
      }
    })
    setChannels(prev => prev.map(c => ({ ...c, active: false, gainNode: null, nodes: [] })))
    setIsPlaying(false)
  }, [])

  // 主音量
  useEffect(() => {
    if (masterGainNode) {
      masterGainNode.gain.value = masterVolume
    }
  }, [masterVolume, masterGainNode])

  // 初始化 master gain
  useEffect(() => {
    const ctx = getAudioContext()
    const mg = ctx.createGain()
    mg.gain.value = masterVolume
    mg.connect(ctx.destination)
    setMasterGainNode(mg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 计时器
  useEffect(() => {
    if (timerDuration > 0 && isPlaying) {
      setTimerRemaining(timerDuration * 60)
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            stopAll()
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerDuration, isPlaying, stopAll])

  // 加载保存的偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const prefs = JSON.parse(saved)
        if (prefs.masterVolume !== undefined) setMasterVolume(prefs.masterVolume)
        if (prefs.timerDuration !== undefined) setTimerDuration(prefs.timerDuration)
      }
    } catch { /* ignore */ }
  }, [])

  // 保存偏好
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ masterVolume, timerDuration }))
    } catch { /* ignore */ }
  }, [masterVolume, timerDuration])

  // 格式化计时器
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const activeCount = channels.filter(c => c.active).length

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f172a 100%)',
      color: '#e2e8f0', fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24 }}>🎧</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>AmbientSound</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              环境音播放器 · Web Audio 实时合成
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {activeCount > 0 && (
            <span style={{ fontSize: 12, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: 20 }}>
              {activeCount} 个音效播放中
            </span>
          )}
          {timerRemaining > 0 && (
            <span style={{ fontSize: 13, color: '#fbbf24', fontFamily: 'monospace', fontWeight: 600 }}>
              ⏱ {formatTime(timerRemaining)}
            </span>
          )}
          <button
            onClick={stopAll}
            style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RotateCcw size={14} /> 停止全部
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sound Grid */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {channels.map(ch => (
              <div
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                style={{
                  background: ch.active
                    ? `linear-gradient(135deg, ${ch.color}15, ${ch.color}08)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${ch.active ? ch.color + '50' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16, padding: 20, cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  if (!ch.active) e.currentTarget.style.borderColor = ch.color + '30'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  if (!ch.active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {ch.active && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${ch.color}, transparent)`,
                  }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>{ch.icon}</span>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: ch.active ? ch.color + '20' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {ch.active
                      ? <Pause size={16} color={ch.color} />
                      : <Play size={16} color="#94a3b8" />
                    }
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{ch.name}</div>
                {ch.active && (
                  <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                    <input
                      type="range" min={0} max={100} value={ch.volume * 100}
                      onChange={e => updateChannelVolume(ch.id, Number(e.target.value) / 100)}
                      style={{
                        width: '100%', height: 4, appearance: 'none', background: `linear-gradient(to right, ${ch.color} ${ch.volume * 100}%, rgba(255,255,255,0.1) ${ch.volume * 100}%)`,
                        borderRadius: 4, outline: 'none', cursor: 'pointer'
                      }}
                    />
                    <div style={{ fontSize: 10, color: '#64748b', textAlign: 'right', marginTop: 2 }}>
                      {Math.round(ch.volume * 100)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Master Volume + Timer */}
        <div style={{
          width: 220, borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: 20, display: 'flex', flexDirection: 'column', gap: 24,
          background: 'rgba(255,255,255,0.01)'
        }}>
          {/* Master Volume */}
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              主音量
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {masterVolume === 0 ? <VolumeX size={16} color="#64748b" /> : <Volume2 size={16} color="#60a5fa" />}
              <input
                type="range" min={0} max={100} value={masterVolume * 100}
                onChange={e => setMasterVolume(Number(e.target.value) / 100)}
                style={{
                  flex: 1, height: 4, appearance: 'none',
                  background: `linear-gradient(to right, #60a5fa ${masterVolume * 100}%, rgba(255,255,255,0.1) ${masterVolume * 100}%)`,
                  borderRadius: 4, outline: 'none', cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Timer */}
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> 定时关闭
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TIMER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimerDuration(opt.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, textAlign: 'left',
                    background: timerDuration === opt.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                    color: timerDuration === opt.value ? '#60a5fa' : '#94a3b8',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              快速场景
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { name: '专注工作', sounds: ['rain', 'keyboard'], desc: '雨声 + 键盘' },
                { name: '深度睡眠', sounds: ['brownnoise'], desc: '棕噪声' },
                { name: '自然放松', sounds: ['ocean', 'birds', 'wind'], desc: '海浪 + 鸟鸣 + 风' },
                { name: '咖啡时光', sounds: ['cafe'], desc: '咖啡馆氛围' },
                { name: '篝火夜晚', sounds: ['fire', 'crickets'], desc: '火焰 + 虫鸣' },
              ].map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    stopAll()
                    setTimeout(() => {
                      preset.sounds.forEach(id => {
                        if (channelsRef.current.has(id)) {
                          toggleChannel(id)
                        }
                      })
                    }, 100)
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', color: '#cbd5e1',
                    fontSize: 12, textAlign: 'left', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ fontWeight: 600 }}>{preset.name}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11, color: '#475569', display: 'flex', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <span>Web Audio API 实时合成 · 无需外部音频文件</span>
        <span>所有音效均在本地浏览器生成</span>
      </div>
    </div>
  )
})

export default AmbientSound
