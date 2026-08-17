import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play, Pause, RotateCcw, Plus, Trash2, Volume2, VolumeX,
  Music, Activity, Download, Save, FolderOpen,
  ChevronRight, Trash,
} from 'lucide-react'
import { useStore } from '../store'

const SCALES: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11, 12],
  'Minor': [0, 2, 3, 5, 7, 8, 10, 12],
  'Pentatonic': [0, 2, 4, 7, 9, 12],
  'Blues': [0, 3, 5, 6, 7, 10, 12],
  'Dorian': [0, 2, 3, 5, 7, 9, 10, 12],
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const TRACK_TYPES = {
  kick: { name: '底鼓', icon: '🥁', type: 'drum' as const, color: '#ef4444', freqs: [60, 40] },
  snare: { name: '军鼓', icon: '🥁', type: 'drum' as const, color: '#f59e0b', freqs: [200] },
  hihat: { name: '踩镲', icon: '🎩', type: 'drum' as const, color: '#10b981', freqs: [8000] },
  clap: { name: '拍手', icon: '👏', type: 'drum' as const, color: '#3b82f6', freqs: [1500] },
  tom: { name: '通鼓', icon: '🥁', type: 'drum' as const, color: '#8b5cf6', freqs: [150, 100] },
  crash: { name: '叮叮镲', icon: '🎵', type: 'drum' as const, color: '#ec4899', freqs: [4000] },
  bass: { name: '贝斯', icon: '🎸', type: 'bass' as const, color: '#14b8a6', freqs: [82.41, 98, 110, 73.42] },
  lead: { name: '主旋律', icon: '🎹', type: 'lead' as const, color: '#f97316', freqs: [440, 523, 587, 659, 698, 784] },
  pad: { name: '合成器', icon: '🎛️', type: 'pad' as const, color: '#6366f1', freqs: [220, 261, 329, 392] },
}

const STORAGE_KEY = 'weblinux-musicstudio-projects-v1'
const CURRENT_KEY = 'weblinux-musicstudio-current-v1'

interface Track {
  id: string
  name: string
  type: keyof typeof TRACK_TYPES
  steps: boolean[]
  notes: number[]
  volume: number
  enabled: boolean
  muted: boolean
}

interface Project {
  id: string
  name: string
  tempo: number
  key: number
  scale: string
  tracks: Track[]
  savedAt: number
}

const defaultTracks = (): Track[] => [
  { id: 't1', name: '底鼓', type: 'kick', steps: new Array(16).fill(false).map((_, i) => i % 4 === 0), notes: [0], volume: 0.8, enabled: true, muted: false },
  { id: 't2', name: '军鼓', type: 'snare', steps: new Array(16).fill(false).map((_, i) => i % 8 === 4), notes: [0], volume: 0.7, enabled: true, muted: false },
  { id: 't3', name: '踩镲', type: 'hihat', steps: new Array(16).fill(false).map((_, i) => i % 2 === 0), notes: [0], volume: 0.5, enabled: true, muted: false },
  { id: 't4', name: '贝斯', type: 'bass', steps: new Array(16).fill(false).map((_, i) => i % 4 === 0 || i % 8 === 6), notes: [0, 7, 3, 10], volume: 0.7, enabled: true, muted: false },
  { id: 't5', name: '主旋律', type: 'lead', steps: new Array(16).fill(false).map((_, i) => i % 2 === 0 && i % 4 !== 3), notes: [0, 4, 7, 12, 7, 4], volume: 0.6, enabled: true, muted: false },
]

const STEPS = 16

export default function MusicStudio() {
  const addNotification = useStore((s) => s.addNotification)
  const [tracks, setTracks] = useState<Track[]>(defaultTracks)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempo, setTempo] = useState(120)
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [masterMuted, setMasterMuted] = useState(false)
  const [rootKey, setRootKey] = useState(0)
  const [scale, setScale] = useState('Minor')
  const [projects, setProjects] = useState<Project[]>([])
  const [showProjects, setShowProjects] = useState(false)
  const [projectName, setProjectName] = useState('我的音乐')
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)
  const stepTimeRef = useRef(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setProjects(JSON.parse(raw))
      const cur = localStorage.getItem(CURRENT_KEY)
      if (cur) {
        const p = JSON.parse(cur)
        setTempo(p.tempo || 120)
        setRootKey(p.key || 0)
        setScale(p.scale || 'Minor')
        setProjectName(p.name || '我的音乐')
      }
    } catch {}
  }, [])

  const saveProjects = (ps: Project[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ps)) } catch {}
  }

  const saveCurrent = () => {
    try {
      localStorage.setItem(CURRENT_KEY, JSON.stringify({ tempo, key: rootKey, scale, name: projectName }))
    } catch {}
  }

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = masterMuted ? 0 : masterVolume
      gainNodeRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }
  }, [masterVolume, masterMuted])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = masterMuted ? 0 : masterVolume
    }
  }, [masterVolume, masterMuted])

  const playNote = useCallback((track: Track, step: number, time: number) => {
    if (!audioContextRef.current || !track.enabled || track.muted) return
    const ctx = audioContextRef.current
    const meta = TRACK_TYPES[track.type]

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(gainNodeRef.current!)

    const scaleNotes = SCALES[scale] || SCALES.Minor
    const noteIdx = track.notes[step % track.notes.length] || 0
    const noteOffset = scaleNotes[((noteIdx % scaleNotes.length) + scaleNotes.length) % scaleNotes.length]
    const midiNote = 60 + rootKey + noteOffset
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12)

    if (meta.type === 'drum') {
      if (track.type === 'kick') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(150, time)
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)
        gain.gain.setValueAtTime(track.volume * 0.8, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
      } else if (track.type === 'snare') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220, time)
        gain.gain.setValueAtTime(track.volume * 0.4, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
      } else if (track.type === 'hihat') {
        osc.type = 'square'
        osc.frequency.setValueAtTime(6000 + Math.random() * 2000, time)
        gain.gain.setValueAtTime(track.volume * 0.15, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      } else if (track.type === 'clap') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(800 + Math.random() * 400, time)
        gain.gain.setValueAtTime(track.volume * 0.3, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
      } else if (track.type === 'tom') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(180, time)
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.2)
        gain.gain.setValueAtTime(track.volume * 0.6, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
      } else if (track.type === 'crash') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(4000 + Math.random() * 2000, time)
        gain.gain.setValueAtTime(track.volume * 0.2, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
      }
    } else if (meta.type === 'bass') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq / 2, time)
      gain.gain.setValueAtTime(track.volume * 0.5, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25)
    } else if (meta.type === 'lead') {
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(track.volume * 0.35, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
    } else if (meta.type === 'pad') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(track.volume * 0.2, time)
      gain.gain.linearRampToValueAtTime(track.volume * 0.3, time + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4)
    }

    osc.start(time)
    osc.stop(time + 0.5)
  }, [scale, rootKey])

  const togglePlay = useCallback(() => {
    initAudio()
    if (!isPlaying) {
      setIsPlaying(true)
      stepTimeRef.current = 0
      const stepDuration = (60 / tempo) / 4
      const playStep = () => {
        const step = stepTimeRef.current
        setCurrentStep(step)
        const now = audioContextRef.current!.currentTime
        tracks.forEach((t) => {
          if (t.steps[step]) playNote(t, step, now)
        })
        stepTimeRef.current = (stepTimeRef.current + 1) % STEPS
      }
      playStep()
      intervalRef.current = window.setInterval(playStep, stepDuration * 1000)
    } else {
      setIsPlaying(false)
      setCurrentStep(-1)
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [isPlaying, tempo, tracks, initAudio, playNote])

  useEffect(() => {
    if (isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current)
      const stepDuration = (60 / tempo) / 4
      intervalRef.current = window.setInterval(() => {
        const step = stepTimeRef.current
        setCurrentStep(step)
        const now = audioContextRef.current!.currentTime
        tracks.forEach((t) => {
          if (t.steps[step]) playNote(t, step, now)
        })
        stepTimeRef.current = (stepTimeRef.current + 1) % STEPS
      }, stepDuration * 1000)
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [tempo, tracks, isPlaying, playNote])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlay])

  const toggleStep = (trackId: string, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, steps: t.steps.map((s, i) => (i === stepIndex ? !s : s)) }
          : t
      )
    )
  }

  const addTrack = () => {
    const types = Object.keys(TRACK_TYPES) as (keyof typeof TRACK_TYPES)[]
    const usedTypes = new Set(tracks.map((t) => t.type))
    const nextType = types.find((t) => !usedTypes.has(t)) || 'lead'
    const newTrack: Track = {
      id: `t${Date.now()}`,
      name: TRACK_TYPES[nextType].name,
      type: nextType,
      steps: new Array(STEPS).fill(false),
      notes: [0, 4, 7, 12],
      volume: 0.6,
      enabled: true,
      muted: false,
    }
    setTracks([...tracks, newTrack])
  }

  const removeTrack = (trackId: string) => {
    if (tracks.length <= 1) return
    setTracks(tracks.filter((t) => t.id !== trackId))
    if (selectedTrackId === trackId) setSelectedTrackId(null)
  }

  const clearPattern = () => {
    setTracks(tracks.map((t) => ({ ...t, steps: new Array(STEPS).fill(false) })))
    addNotification({ title: '已清空', message: '所有轨道已清空', type: 'info', duration: 2000 })
  }

  const randomPattern = () => {
    setTracks((prev) =>
      prev.map((t) => {
        const density = TRACK_TYPES[t.type].type === 'drum' ? 0.4 : 0.25
        return { ...t, steps: new Array(STEPS).fill(false).map(() => Math.random() < density) }
      })
    )
    addNotification({ title: '随机生成', message: '已生成随机节奏模式', type: 'success', duration: 2000 })
  }

  const saveProject = () => {
    const p: Project = {
      id: `proj-${Date.now()}`,
      name: projectName || '未命名项目',
      tempo, key: rootKey, scale,
      tracks, savedAt: Date.now(),
    }
    const next = [p, ...projects]
    setProjects(next)
    saveProjects(next)
    saveCurrent()
    addNotification({ title: '项目已保存', message: `${p.name} 已保存`, type: 'success', duration: 2500 })
  }

  const loadProject = (id: string) => {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    setTracks(p.tracks)
    setTempo(p.tempo)
    setRootKey(p.key)
    setScale(p.scale)
    setProjectName(p.name)
    saveCurrent()
    setShowProjects(false)
    addNotification({ title: '项目已加载', message: p.name, type: 'success', duration: 2500 })
  }

  const deleteProject = (id: string) => {
    const next = projects.filter((p) => p.id !== id)
    setProjects(next)
    saveProjects(next)
  }

  const exportWAV = async () => {
    if (!audioContextRef.current) initAudio()
    addNotification({ title: '导出中', message: '正在录制并导出 WAV 文件…', type: 'info', duration: 3000 })

    const sampleRate = 44100
    const duration = (STEPS * (60 / tempo / 4))
    const numSamples = Math.floor(sampleRate * duration)
    const offline = new OfflineAudioContext(2, numSamples, sampleRate)
    const masterGain = offline.createGain()
    masterGain.gain.value = 0.8
    masterGain.connect(offline.destination)

    const stepDur = (60 / tempo) / 4
    for (let step = 0; step < STEPS; step++) {
      const time = step * stepDur
      tracks.forEach((t) => {
        if (t.steps[step] && t.enabled && !t.muted) {
          const ctx = offline
          const meta = TRACK_TYPES[t.type]
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(masterGain)

          const scaleNotes = SCALES[scale] || SCALES.Minor
          const noteIdx = t.notes[step % t.notes.length] || 0
          const noteOffset = scaleNotes[((noteIdx % scaleNotes.length) + scaleNotes.length) % scaleNotes.length]
          const midiNote = 60 + rootKey + noteOffset
          const freq = 440 * Math.pow(2, (midiNote - 69) / 12)

          if (meta.type === 'drum' && t.type === 'kick') {
            osc.type = 'sine'
            osc.frequency.setValueAtTime(150, time)
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)
            gain.gain.setValueAtTime(t.volume * 0.8, time)
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
          } else if (meta.type === 'drum') {
            osc.type = 'square'
            osc.frequency.setValueAtTime(freq, time)
            gain.gain.setValueAtTime(t.volume * 0.3, time)
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
          } else {
            osc.type = t.type === 'bass' ? 'sawtooth' : 'square'
            osc.frequency.setValueAtTime(freq, time)
            gain.gain.setValueAtTime(t.volume * 0.4, time)
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
          }
          osc.start(time)
          osc.stop(time + 0.5)
        }
      })
    }

    try {
      const buffer = await offline.startRendering()
      const wavBuffer = audioBufferToWav(buffer)
      const blob = new Blob([wavBuffer], { type: 'audio/wav' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${projectName || 'music'}-${Date.now()}.wav`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      addNotification({ title: '导出成功', message: 'WAV 文件已下载', type: 'success', duration: 3000 })
    } catch {
      addNotification({ title: '导出失败', message: '浏览器不支持 OfflineAudioContext', type: 'error', duration: 3000 })
    }
  }

  function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const numSamples = buffer.length
    const bytesPerSample = 2
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = numSamples * blockAlign
    const bufferSize = 44 + dataSize

    const ab = new ArrayBuffer(bufferSize)
    const view = new DataView(ab)

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
    }

    writeString(0, 'RIFF')
    view.setUint32(4, bufferSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    const channels: Float32Array[] = []
    for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i))

    let offset = 44
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
        offset += 2
      }
    }
    return ab
  }

  const toggleTrackMute = (trackId: string) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)))
  }

  const toggleTrackEnabled = (trackId: string) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, enabled: !t.enabled } : t)))
  }

  const updateTrackVolume = (trackId: string, volume: number) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)))
  }

  const updateTrackNotes = (trackId: string, notes: number[]) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, notes } : t)))
  }

  const c: React.CSSProperties = {
    width: '100%', height: '100%',
    background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(14,165,233,0.06) 100%)',
    display: 'flex', flexDirection: 'column', color: 'var(--text-primary)',
    fontFamily: 'inherit', overflow: 'hidden',
  }
  const hdr: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderBottom: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', gap: 12, flexWrap: 'wrap',
  }
  const bb: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
    borderRadius: 8, border: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)',
    cursor: 'pointer', fontSize: 12, transition: 'all 0.18s ease',
  }
  const pb: React.CSSProperties = {
    ...bb,
    background: isPlaying ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none', color: '#fff', fontWeight: 600, padding: '10px 20px', fontSize: 13,
    boxShadow: isPlaying ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px rgba(16,185,129,0.35)',
  }
  const sect: React.CSSProperties = {
    background: 'var(--window-bg)', border: '1px solid var(--window-border)',
    borderRadius: 12, padding: 14, backdropFilter: 'blur(10px)',
  }

  return (
    <div style={c}>
      <div style={hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          }}>
            <Music size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>音乐工作室</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Web Audio API · 多轨合成 · 导出 WAV</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--window-border)',
              borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px',
              fontSize: 12, outline: 'none', width: 140,
            }}
            placeholder="项目名称"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>速度</span>
            <input type="range" min="60" max="200" value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              style={{ width: 80, accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontSize: 11, fontFamily: 'monospace', minWidth: 40 }}>{tempo}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>调</span>
            <select value={rootKey} onChange={(e) => setRootKey(Number(e.target.value))}
              style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--window-border)',
                borderRadius: 6, color: 'var(--text-primary)', padding: '5px 8px', fontSize: 12,
              }}>
              {NOTES.map((n, i) => <option key={i} value={i} style={{ color: '#000' }}>{n}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>音阶</span>
            <select value={scale} onChange={(e) => setScale(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--window-border)',
                borderRadius: 6, color: 'var(--text-primary)', padding: '5px 8px', fontSize: 12,
              }}>
              {Object.keys(SCALES).map((s) => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setMasterMuted(!masterMuted)} style={bb} title="静音">
              {masterMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input type="range" min="0" max="1" step="0.01" value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              style={{ width: 80, accentColor: 'var(--color-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={pb} onClick={togglePlay}>
            {isPlaying ? <><Pause size={16} /> 停止</> : <><Play size={16} /> 播放</>}
          </button>
          <button style={bb} onClick={randomPattern} title="随机模式">
            <RotateCcw size={14} /> 随机
          </button>
          <button style={bb} onClick={clearPattern} title="清空">
            <Trash size={14} /> 清空
          </button>
          <button style={bb} onClick={() => setShowProjects(true)} title="项目">
            <FolderOpen size={14} /> 项目
          </button>
          <button style={{ ...bb, background: 'var(--color-success)', color: '#fff', border: 'none' }} onClick={saveProject} title="保存">
            <Save size={14} /> 保存
          </button>
          <button style={{ ...bb, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', border: 'none' }} onClick={exportWAV} title="导出 WAV">
            <Download size={14} /> 导出 WAV
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tracks.map((track) => {
            const meta = TRACK_TYPES[track.type]
            return (
              <div key={track.id} style={{ ...sect, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{ minWidth: 80 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{track.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {meta.type === 'drum' ? '打击乐' : meta.type === 'bass' ? '贝斯' : meta.type === 'lead' ? '主旋律' : '合成器'}
                    </div>
                  </div>
                  <button onClick={() => toggleTrackEnabled(track.id)}
                    style={{
                      width: 32, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: track.enabled ? '#10b981' : '#6b7280', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}
                    title={track.enabled ? '启用' : '禁用'}
                  >
                    {track.enabled ? <Activity size={14} /> : <span style={{ fontSize: 10 }}>OFF</span>}
                  </button>
                  <button onClick={() => toggleTrackMute(track.id)}
                    style={{
                      width: 32, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: track.muted ? '#ef4444' : 'rgba(255,255,255,0.1)', color: track.muted ? '#fff' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600,
                    }}
                    title={track.muted ? '取消静音' : '静音'}
                  >
                    {track.muted ? '🔇' : '🔊'}
                  </button>
                  <input type="range" min="0" max="1" step="0.01" value={track.volume}
                    onChange={(e) => updateTrackVolume(track.id, Number(e.target.value))}
                    style={{ width: 80, accentColor: meta.color }}
                  />
                  <input type="number" min="0" max="127" value={track.notes[0] ?? 0}
                    onChange={(e) => updateTrackNotes(track.id, [Number(e.target.value), ...track.notes.slice(1)])}
                    style={{
                      width: 50, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--window-border)',
                      borderRadius: 6, color: 'var(--text-primary)', padding: '4px 8px', fontSize: 12,
                    }}
                    title="根音 (半音偏移)"
                  />
                  <button onClick={() => removeTrack(track.id)}
                    style={{ ...bb, padding: '4px 8px', fontSize: 11, color: 'var(--color-error)' }}
                    disabled={tracks.length <= 1}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 2 }}>
                  {track.steps.map((active, stepIdx) => (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(track.id, stepIdx)}
                      style={{
                        flex: 1, aspectRatio: '1 / 1', minWidth: 0,
                        borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: active
                          ? meta.color
                          : stepIdx % 4 === 0
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(255,255,255,0.03)',
                        boxShadow: currentStep === stepIdx && isPlaying ? '0 0 0 2px #fff, 0 0 8px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.08s ease',
                        opacity: active ? 1 : 0.5,
                        transform: currentStep === stepIdx && isPlaying ? 'scale(0.95)' : 'scale(1)',
                      }}
                      title={`步骤 ${stepIdx + 1}`}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                  {[0, 1, 2, 3].map((bar) => (
                    <div key={bar} style={{
                      flex: 1, textAlign: 'center', fontSize: 9,
                      color: bar === Math.floor(currentStep / 4) ? meta.color : 'var(--text-secondary)',
                      fontWeight: bar === Math.floor(currentStep / 4) ? 700 : 400,
                    }}>
                      {bar + 1}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <button onClick={addTrack} style={{
            padding: '14px', border: '2px dashed var(--window-border)', borderRadius: 12,
            background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13,
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--window-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          >
            <Plus size={18} /> 添加轨道
          </button>
        </div>
      </div>

      {showProjects && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center',
        }} onClick={() => setShowProjects(false)}>
          <div style={{
            width: 'min(520px, 92%)', maxHeight: '80vh',
            background: 'var(--window-bg)', border: '1px solid var(--window-border)',
            borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'fadeIn 0.25s ease',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--window-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>项目库</div>
              <button style={bb} onClick={() => setShowProjects(false)}>✕ 关闭</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
                  <div style={{ fontSize: 13 }}>还没有保存的项目</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {projects.map((p) => (
                    <div key={p.id} style={{
                      padding: 12, border: '1px solid var(--window-border)', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      background: 'rgba(255,255,255,0.02)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {p.tempo} BPM · {NOTES[p.key]} {p.scale} · {p.tracks.length} 轨 · {new Date(p.savedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...bb, padding: '6px 10px', fontSize: 11 }} onClick={() => loadProject(p.id)}>
                          <ChevronRight size={12} /> 加载
                        </button>
                        <button style={{ ...bb, padding: '6px 10px', fontSize: 11, color: 'var(--color-error)' }} onClick={() => deleteProject(p.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}