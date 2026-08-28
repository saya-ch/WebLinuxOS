import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// 音乐旋律定义 - 每首歌有独特的音符序列、波形和速度
const SONGS = [
  { id: 1, title: '星空下的旋律', artist: 'SynthWave', duration: 180, album: '星夜', bpm: 120, waveform: 'sine' as OscillatorType, notes: [60,64,67,72,67,64,60,62,65,69,65,62,57,60,64,67] },
  { id: 2, title: '城市夜行', artist: 'Digital Pulse', duration: 210, album: '城市声音', bpm: 128, waveform: 'sawtooth' as OscillatorType, notes: [48,51,55,58,55,51,48,53,57,60,57,53,46,48,51,55] },
  { id: 3, title: '清晨的咖啡', artist: 'Lo-Fi Beats', duration: 240, album: 'Morning Brew', bpm: 85, waveform: 'triangle' as OscillatorType, notes: [60,62,64,65,67,65,64,62,60,59,57,59,60,62,64,60] },
  { id: 4, title: '远方的风', artist: 'Ambient Sky', duration: 195, album: '旅途', bpm: 90, waveform: 'sine' as OscillatorType, notes: [64,67,71,72,71,67,64,60,64,67,71,74,71,67,64,60] },
  { id: 5, title: '代码之夜', artist: 'Binary Beats', duration: 225, album: 'Digital Dreams', bpm: 140, waveform: 'square' as OscillatorType, notes: [48,60,48,60,51,63,51,63,55,67,55,67,53,65,53,65] },
  { id: 6, title: '雨天旋律', artist: 'Piano Rain', duration: 250, album: '雨后', bpm: 72, waveform: 'sine' as OscillatorType, notes: [60,63,67,72,75,72,67,63,60,55,59,63,67,63,59,55] },
  { id: 7, title: '夏日回忆', artist: 'Sun Coast', duration: 195, album: 'Summer Hits', bpm: 110, waveform: 'triangle' as OscillatorType, notes: [64,67,69,72,74,72,69,67,64,62,60,62,64,67,69,64] },
  { id: 8, title: '月光小夜曲', artist: 'Night Classics', duration: 270, album: '月下', bpm: 68, waveform: 'sine' as OscillatorType, notes: [60,64,67,72,71,67,64,60,59,62,65,69,67,65,62,59] },
  { id: 9, title: '电子脉冲', artist: 'Circuit Break', duration: 200, album: 'Voltage', bpm: 150, waveform: 'sawtooth' as OscillatorType, notes: [48,55,60,67,60,55,48,53,60,65,60,53,50,57,62,69] },
  { id: 10, title: '森林漫步', artist: 'Nature Sound', duration: 230, album: '绿色', bpm: 78, waveform: 'triangle' as OscillatorType, notes: [60,64,67,72,67,64,60,57,60,64,67,71,67,64,60,57] },
]

const COLORS = ['#e94560', '#0f3460', '#4ecca3', '#f5c542', '#7b68ee', '#ff6b6b', '#48dbfb', '#ff9ff3', '#a29bfe', '#fd79a8']

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Web Audio 合成器
class SynthEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private currentOscillators: OscillatorNode[] = []
  private isPlaying = false
  private timerId: ReturnType<typeof setTimeout> | null = null
  private noteIndex = 0
  private song: typeof SONGS[0] | null = null
  private onTimeUpdate: ((time: number) => void) | null = null
  private startTime = 0
  private pauseTime = 0
  private _volume = 0.7

  getAnalyser(): AnalyserNode | null { return this.analyser }
  getAudioContext(): AudioContext | null { return this.ctx }

  init() {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = this._volume
    this.gainNode.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }

  setVolume(v: number) {
    this._volume = v
    if (this.gainNode) this.gainNode.gain.value = v
  }

  play(song: typeof SONGS[0], startNoteIndex = 0, onTimeUpdate?: (time: number) => void) {
    this.init()
    this.stop()
    this.song = song
    this.noteIndex = startNoteIndex
    this.isPlaying = true
    this.startTime = (this.ctx?.currentTime || 0) - this.pauseTime
    this.onTimeUpdate = onTimeUpdate ?? null
    this._scheduleNextNote()
  }

  pause() {
    this.isPlaying = false
    this.pauseTime = this.startTime ? (this.ctx?.currentTime || 0) - this.startTime : 0
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null }
    this._stopCurrentOscillators()
  }

  resume() {
    if (!this.song || this.isPlaying) return
    this.isPlaying = true
    this.startTime = (this.ctx?.currentTime || 0) - this.pauseTime
    this._scheduleNextNote()
  }

  stop() {
    this.isPlaying = false
    this.pauseTime = 0
    this.noteIndex = 0
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null }
    this._stopCurrentOscillators()
  }

  seekToTime(seconds: number, song: typeof SONGS[0]) {
    this.pauseTime = seconds
    this.song = song
    const beatDuration = 60 / song.bpm
    this.noteIndex = Math.floor(seconds / beatDuration) % song.notes.length
    this.startTime = (this.ctx?.currentTime || 0) - seconds
  }

  getCurrentTime(): number {
    if (!this.ctx) return 0
    if (!this.isPlaying) return this.pauseTime
    return this.ctx.currentTime - this.startTime
  }

  private _stopCurrentOscillators() {
    this.currentOscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.currentOscillators = []
  }

  private _scheduleNextNote() {
    if (!this.isPlaying || !this.song || !this.ctx || !this.gainNode) return

    const song = this.song
    const beatDuration = 60 / song.bpm
    const note = song.notes[this.noteIndex % song.notes.length]

    // 创建双振荡器以获得更丰富的音色
    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const noteGain = this.ctx.createGain()

    osc1.type = song.waveform
    osc1.frequency.value = 440 * Math.pow(2, (note - 69) / 12)

    osc2.type = song.waveform === 'sine' ? 'triangle' : 'sine'
    osc2.frequency.value = osc1.frequency.value * 0.5 // 低八度叠加

    const noteGainValue = 0.3
    noteGain.gain.setValueAtTime(0, this.ctx.currentTime)
    noteGain.gain.linearRampToValueAtTime(noteGainValue, this.ctx.currentTime + 0.02)
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + beatDuration * 0.9)

    osc1.connect(noteGain)
    osc2.connect(noteGain)
    noteGain.connect(this.gainNode)

    osc1.start(this.ctx.currentTime)
    osc2.start(this.ctx.currentTime)
    osc1.stop(this.ctx.currentTime + beatDuration)
    osc2.stop(this.ctx.currentTime + beatDuration)

    this.currentOscillators = [osc1, osc2]

    this.noteIndex++
    const currentTime = this.getCurrentTime()
    this.onTimeUpdate?.(currentTime)

    this.timerId = setTimeout(() => {
      if (this.isPlaying) this._scheduleNextNote()
    }, beatDuration * 1000)
  }

  destroy() {
    this.stop()
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close()
    }
    this.ctx = null
    this.analyser = null
    this.gainNode = null
  }
}

// 音频可视化条组件
function AudioVisualizer({ analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        const hue = (i / bufferLength) * 360
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${isPlaying ? 0.8 : 0.3})`
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        x += barWidth
        if (x > canvas.width) break
      }
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [analyser, isPlaying])

  return <canvas ref={canvasRef} width={360} height={80} style={{ width: '100%', height: 80, borderRadius: 8, marginTop: 12 }} />
}

export default function MusicPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const engineRef = useRef<SynthEngine | null>(null)

  const currentSong = SONGS[currentIndex]
  const totalSeconds = currentSong.duration

  // 初始化引擎
  useEffect(() => {
    engineRef.current = new SynthEngine()
    return () => { engineRef.current?.destroy() }
  }, [])

  // 更新 analyser
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.init()
    setAnalyserNode(engine.getAnalyser())
  }, [])

  const playSong = useCallback((index: number, startTime = 0) => {
    const engine = engineRef.current
    if (!engine) return
    const song = SONGS[index]
    engine.init()
    setAnalyserNode(engine.getAnalyser())

    const onTimeUpdate = (time: number) => {
      setCurrentTime(time)
      if (time >= song.duration) {
        // 歌曲结束 - 自动下一首
        setCurrentTime(0)
        setIsPlaying(false)
        engine.stop()
        // 自动播放下一首
        setTimeout(() => {
          setCurrentIndex(prev => {
            const next = shuffle
              ? Math.floor(Math.random() * SONGS.length)
              : prev < SONGS.length - 1 ? prev + 1 : repeat === 'all' ? 0 : prev
            if (repeat === 'one' || prev >= SONGS.length - 1 && repeat === 'none') {
              if (repeat === 'one') {
                playSong(prev, 0)
              }
              return prev
            }
            playSong(next, 0)
            return next
          })
        }, 100)
      }
    }

    if (startTime > 0) {
      engine.seekToTime(startTime, song)
    }
    engine.play(song, 0, onTimeUpdate)
    setIsPlaying(true)
  }, [shuffle, repeat])

  const handlePlayPause = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (isPlaying) {
      engine.pause()
      setIsPlaying(false)
    } else {
      engine.init()
      setAnalyserNode(engine.getAnalyser())
      const onTimeUpdate = (time: number) => {
        setCurrentTime(time)
        if (time >= currentSong.duration) {
          setCurrentTime(0)
          setIsPlaying(false)
          engine.stop()
          setTimeout(() => {
            setCurrentIndex(prev => {
              const next = shuffle
                ? Math.floor(Math.random() * SONGS.length)
                : prev < SONGS.length - 1 ? prev + 1 : repeat === 'all' ? 0 : prev
              if (repeat === 'one' || (prev >= SONGS.length - 1 && repeat === 'none')) {
                if (repeat === 'one') playSong(prev, 0)
                return prev
              }
              playSong(next, 0)
              return next
            })
          }, 100)
        }
      }
      if (currentTime > 0) {
        engine.seekToTime(currentTime, currentSong)
      }
      engine.play(currentSong, 0, onTimeUpdate)
      setIsPlaying(true)
    }
  }, [isPlaying, currentTime, currentSong, shuffle, repeat, playSong])

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : SONGS.length - 1
    setCurrentIndex(newIndex)
    setCurrentTime(0)
    playSong(newIndex, 0)
  }, [currentIndex, playSong])

  const handleNext = useCallback(() => {
    const newIndex = shuffle
      ? Math.floor(Math.random() * SONGS.length)
      : currentIndex < SONGS.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
    setCurrentTime(0)
    playSong(newIndex, 0)
  }, [currentIndex, shuffle, playSong])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseInt(e.target.value)
    setCurrentTime(time)
    const engine = engineRef.current
    if (engine && isPlaying) {
      engine.stop()
      engine.seekToTime(time, currentSong)
      const onTimeUpdate = (t: number) => {
        setCurrentTime(t)
        if (t >= currentSong.duration) {
          setCurrentTime(0)
          setIsPlaying(false)
          engine.stop()
          handleNext()
        }
      }
      engine.play(currentSong, 0, onTimeUpdate)
    }
  }, [isPlaying, currentSong, handleNext])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    setVolume(v)
    engineRef.current?.setVolume(v / 100)
  }, [])

  // 搜索过滤
  const filteredSongs = useMemo(() => {
    if (!searchQuery) return SONGS
    const q = searchQuery.toLowerCase()
    return SONGS.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
  }, [searchQuery])

  const handleSelectSong = useCallback((songId: number) => {
    const idx = SONGS.findIndex(s => s.id === songId)
    if (idx === -1) return
    setCurrentIndex(idx)
    setCurrentTime(0)
    playSong(idx, 0)
  }, [playSong])

  const getCoverGradient = () => {
    const c = COLORS[currentIndex % COLORS.length]
    return `linear-gradient(135deg, ${c}, ${c}88)`
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0d1117', color: '#e6edf3', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', userSelect: 'none' }}>
      {/* 主区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 头部 */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #21262d' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e' }}>
            <span style={{ color: '#58a6ff' }}>Web</span>Music · Synth Player
          </div>
          <div style={{ fontSize: 11, color: '#484f58' }}>
            Web Audio API 驱动
          </div>
        </div>

        {/* 封面 + 可视化 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: 0 }}>
          <div style={{
            width: 180, height: 180, borderRadius: 16,
            background: getCoverGradient(),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 12px 40px ${COLORS[currentIndex % COLORS.length]}33`,
            marginBottom: 20, position: 'relative', overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* 旋转动画 */}
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              position: 'absolute',
              animation: isPlaying ? 'spin 3s linear infinite' : 'none'
            }} />
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)',
              position: 'absolute', zIndex: 1
            }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* 歌曲信息 */}
          <div style={{ textAlign: 'center', marginBottom: 16, width: '100%', maxWidth: 400 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSong.title}
            </div>
            <div style={{ color: '#8b949e', fontSize: 13 }}>
              {currentSong.artist} · {currentSong.album}
            </div>
          </div>

          {/* 可视化 */}
          <div style={{ width: '100%', maxWidth: 400 }}>
            <AudioVisualizer analyser={analyserNode} isPlaying={isPlaying} />
          </div>

          {/* 进度条 */}
          <div style={{ width: '100%', maxWidth: 400, display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 11, color: '#8b949e', width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={totalSeconds}
              value={Math.min(currentTime, totalSeconds)}
              onChange={handleSeek}
              style={{
                flex: 1, height: 4, accentColor: COLORS[currentIndex % COLORS.length],
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: 11, color: '#8b949e', width: 36, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(totalSeconds)}
            </span>
          </div>

          {/* 控制按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button onClick={() => setShuffle(!shuffle)} style={{ ...ctrlBtn, color: shuffle ? COLORS[currentIndex % COLORS.length] : '#8b949e' }} title="随机播放">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
            </button>
            <button onClick={handlePrev} style={ctrlBtn} title="上一首">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={handlePlayPause} style={{
              ...ctrlBtn, width: 52, height: 52, borderRadius: '50%',
              background: COLORS[currentIndex % COLORS.length], color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${COLORS[currentIndex % COLORS.length]}44`
            }} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={handleNext} style={ctrlBtn} title="下一首">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button
              onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
              style={{ ...ctrlBtn, color: repeat !== 'none' ? COLORS[currentIndex % COLORS.length] : '#8b949e' }}
              title={repeat === 'none' ? '循环关闭' : repeat === 'all' ? '全部循环' : '单曲循环'}
            >
              {repeat === 'one' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="15" fontSize="8" fill="currentColor" textAnchor="middle" stroke="none">1</text></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              )}
            </button>
          </div>

          {/* 音量 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
              {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
            </svg>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              style={{ width: 100, height: 4, accentColor: COLORS[currentIndex % COLORS.length], cursor: 'pointer' }}
            />
            <span style={{ fontSize: 11, color: '#8b949e', width: 30, fontVariantNumeric: 'tabular-nums' }}>{volume}%</span>
          </div>
        </div>
      </div>

      {/* 播放列表侧边栏 */}
      <div style={{ width: 300, background: '#161b22', borderLeft: '1px solid #21262d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: '#8b949e', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>播放列表</span>
          <span style={{ fontSize: 11, color: '#484f58' }}>{SONGS.length} 首</span>
        </div>
        {/* 搜索 */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              placeholder="搜索歌曲..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6,
                border: '1px solid #21262d', background: '#0d1117', color: '#c9d1d9',
                fontSize: 12, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#58a6ff'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#21262d'}
            />
          </div>
        </div>
        {/* 歌曲列表 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredSongs.map((song) => {
            const idx = SONGS.indexOf(song)
            const isActive = idx === currentIndex
            return (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song.id)}
                style={{
                  padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive ? '#1c2129' : 'transparent',
                  borderLeft: isActive ? `3px solid ${COLORS[idx % COLORS.length]}` : '3px solid transparent',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#1c1f26' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                  background: `linear-gradient(135deg, ${COLORS[idx % COLORS.length]}, ${COLORS[idx % COLORS.length]}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700
                }}>
                  {isActive && isPlaying ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                      {[0.6, 1, 0.5].map((h, i) => (
                        <div key={i} style={{
                          width: 3, height: h * 14, background: '#fff', borderRadius: 1,
                          animation: `eqBar ${0.3 + i * 0.1}s ease-in-out infinite alternate`
                        }} />
                      ))}
                      <style>{`@keyframes eqBar { from { height: 20%; } to { height: 100%; } }`}</style>
                    </div>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#e6edf3' : '#c9d1d9',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.artist}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#484f58', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(song.duration)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const ctrlBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer',
  padding: 8, borderRadius: '50%', width: 38, height: 38,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s'
}
