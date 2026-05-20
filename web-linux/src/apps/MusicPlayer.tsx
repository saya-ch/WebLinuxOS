import { useState, useRef, useCallback, useEffect } from 'react'

const NOTE_FREQS: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
}

interface SongNote {
  note: string
  duration: number
}

const SONGS_DATA: { title: string; artist: string; duration: string; album: string; notes: SongNote[]; tempo: number; wave: OscillatorType }[] = [
  {
    title: '小星星', artist: '莫扎特', duration: '0:32', album: '经典旋律',
    tempo: 300, wave: 'sine',
    notes: [
      { note: 'C4', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'G4', duration: 1 }, { note: 'G4', duration: 1 },
      { note: 'A4', duration: 1 }, { note: 'A4', duration: 1 }, { note: 'G4', duration: 2 },
      { note: 'F4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'D4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 2 },
      { note: 'G4', duration: 1 }, { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'F4', duration: 1 },
      { note: 'E4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 2 },
      { note: 'G4', duration: 1 }, { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'F4', duration: 1 },
      { note: 'E4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 2 },
      { note: 'C4', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'G4', duration: 1 }, { note: 'G4', duration: 1 },
      { note: 'A4', duration: 1 }, { note: 'A4', duration: 1 }, { note: 'G4', duration: 2 },
      { note: 'F4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'D4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 2 },
    ]
  },
  {
    title: '欢乐颂', artist: '贝多芬', duration: '0:28', album: '经典旋律',
    tempo: 280, wave: 'sine',
    notes: [
      { note: 'E4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'G4', duration: 1 },
      { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 },
      { note: 'C4', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'E4', duration: 1.5 }, { note: 'D4', duration: 0.5 }, { note: 'D4', duration: 2 },
      { note: 'E4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'G4', duration: 1 },
      { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 },
      { note: 'C4', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'D4', duration: 1.5 }, { note: 'C4', duration: 0.5 }, { note: 'C4', duration: 2 },
    ]
  },
  {
    title: '两只老虎', artist: '法国民歌', duration: '0:24', album: '经典旋律',
    tempo: 250, wave: 'triangle',
    notes: [
      { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'E4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'G4', duration: 2 },
      { note: 'E4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'G4', duration: 2 },
      { note: 'G4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'G4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'C4', duration: 1 }, { note: 'G3', duration: 1 }, { note: 'C4', duration: 2 },
      { note: 'C4', duration: 1 }, { note: 'G3', duration: 1 }, { note: 'C4', duration: 2 },
    ]
  },
  {
    title: '生日快乐', artist: '传统', duration: '0:22', album: '经典旋律',
    tempo: 300, wave: 'sine',
    notes: [
      { note: 'C4', duration: 0.75 }, { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'F4', duration: 1 }, { note: 'E4', duration: 2 },
      { note: 'C4', duration: 0.75 }, { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'G4', duration: 1 }, { note: 'F4', duration: 2 },
      { note: 'C4', duration: 0.75 }, { note: 'C4', duration: 0.25 }, { note: 'C5', duration: 1 }, { note: 'A4', duration: 1 },
      { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 },
      { note: 'B4', duration: 0.75 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 1 }, { note: 'F4', duration: 1 },
      { note: 'G4', duration: 1 }, { note: 'F4', duration: 2 },
    ]
  },
  {
    title: '电子节拍', artist: 'Binary Beats', duration: '0:20', album: 'Digital Dreams',
    tempo: 150, wave: 'square',
    notes: [
      { note: 'C4', duration: 0.5 }, { note: 'C4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
      { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 1 },
      { note: 'F4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
      { note: 'D4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 1 },
      { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
      { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
      { note: 'D4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'C4', duration: 1 },
      { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
      { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 1 },
    ]
  },
  {
    title: '忧伤圆舞曲', artist: '钢琴与雨', duration: '0:30', album: '雨后',
    tempo: 400, wave: 'sine',
    notes: [
      { note: 'A3', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'A4', duration: 1 },
      { note: 'G4', duration: 1.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 },
      { note: 'C4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'A3', duration: 2 },
      { note: 'A3', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'A4', duration: 1 },
      { note: 'B4', duration: 1.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 },
      { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 2 },
      { note: 'D4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'A3', duration: 2 }, { note: 'A3', duration: 2 },
    ]
  },
  {
    title: '樱花', artist: '日本民歌', duration: '0:26', album: '世界民谣',
    tempo: 450, wave: 'sine',
    notes: [
      { note: 'E4', duration: 1 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 }, { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
      { note: 'E4', duration: 2 },
      { note: 'F4', duration: 1 }, { note: 'E4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'C4', duration: 2 },
    ]
  },
  {
    title: '卡农', artist: '帕赫贝尔', duration: '0:30', album: '古典之夜',
    tempo: 350, wave: 'sine',
    notes: [
      { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'B3', duration: 1 }, { note: 'A3', duration: 1 }, { note: 'G3', duration: 1 }, { note: 'A3', duration: 1 },
      { note: 'B3', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'A3', duration: 1 }, { note: 'G3', duration: 1 },
      { note: 'A3', duration: 1 }, { note: 'B3', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 },
      { note: 'E4', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'F4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'B3', duration: 1 }, { note: 'C4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 1 },
      { note: 'A3', duration: 1 }, { note: 'G3', duration: 1 }, { note: 'A3', duration: 2 },
    ]
  },
]

const COLORS = ['#e94560', '#0f3460', '#4ecca3', '#f5c542', '#7b68ee', '#ff6b6b', '#48dbfb', '#ff9ff3']

export default function MusicPlayer() {
  const [playlist] = useState(SONGS_DATA)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [noteIndex, setNoteIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const currentOscRef = useRef<OscillatorNode | null>(null)

  const currentSong = playlist[currentIndex]
  const totalSeconds = currentSong.duration.split(':').reduce((m, s) => m * 60 + parseInt(s), 0)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
      gainNodeRef.current = audioCtxRef.current.createGain()
      gainNodeRef.current.connect(audioCtxRef.current.destination)
      gainNodeRef.current.gain.value = volume / 100 * 0.3
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return { ctx: audioCtxRef.current, gain: gainNodeRef.current! }
  }, [volume])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100 * 0.3
    }
  }, [volume])

  const playNote = useCallback((noteName: string, durationMs: number, wave: OscillatorType) => {
    try {
      const { ctx, gain } = getAudioCtx()
      if (currentOscRef.current) {
        try { currentOscRef.current.stop() } catch {}
      }
      const freq = NOTE_FREQS[noteName]
      if (!freq) return
      const osc = ctx.createOscillator()
      osc.type = wave
      osc.frequency.value = freq
      const noteGain = ctx.createGain()
      noteGain.gain.setValueAtTime(0.3, ctx.currentTime)
      noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000 * 0.9)
      osc.connect(noteGain)
      noteGain.connect(gain)
      osc.start()
      osc.stop(ctx.currentTime + durationMs / 1000)
      currentOscRef.current = osc
    } catch {}
  }, [getAudioCtx])

  const stopAudio = useCallback(() => {
    if (currentOscRef.current) {
      try { currentOscRef.current.stop() } catch {}
      currentOscRef.current = null
    }
  }, [])

  const play = useCallback(() => {
    setIsPlaying(true)
    const song = playlist[currentIndex]
    let ni = noteIndex
    let elapsed = currentTime

    intervalRef.current = setInterval(() => {
      elapsed += 0.1
      setCurrentTime(elapsed)

      const note = song.notes[ni]
      if (!note) {
        if (repeat === 'one') {
          ni = 0
          elapsed = 0
          setCurrentTime(0)
          setNoteIndex(0)
        } else if (shuffle) {
          const next = Math.floor(Math.random() * playlist.length)
          setCurrentIndex(next)
          ni = 0
          elapsed = 0
          setCurrentTime(0)
          setNoteIndex(0)
        } else if (currentIndex < playlist.length - 1) {
          setCurrentIndex(prev => prev + 1)
          ni = 0
          elapsed = 0
          setCurrentTime(0)
          setNoteIndex(0)
        } else if (repeat === 'all') {
          setCurrentIndex(0)
          ni = 0
          elapsed = 0
          setCurrentTime(0)
          setNoteIndex(0)
        } else {
          setIsPlaying(false)
          setCurrentTime(0)
          setNoteIndex(0)
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
          stopAudio()
        }
        return
      }

      const noteDurationSec = note.duration * song.tempo / 1000
      if (elapsed >= noteDurationSec * 0.95) {
        playNote(note.note, noteDurationSec * 900, song.wave)
        ni++
        setNoteIndex(ni)
        elapsed = 0
        setCurrentTime(0)
      }
    }, 100)
  }, [currentIndex, noteIndex, currentTime, playlist, repeat, shuffle, playNote, stopAudio])

  const pause = useCallback(() => {
    setIsPlaying(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    stopAudio()
  }, [stopAudio])

  const handlePlayPause = () => { isPlaying ? pause() : play() }

  const handlePrev = () => {
    pause()
    setCurrentTime(0)
    setNoteIndex(0)
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
    else setCurrentIndex(playlist.length - 1)
  }

  const handleNext = useCallback(() => {
    pause()
    setCurrentTime(0)
    setNoteIndex(0)
    if (shuffle) {
      const next = Math.floor(Math.random() * playlist.length)
      setCurrentIndex(next)
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      if (repeat === 'all') setCurrentIndex(0)
      else setCurrentIndex(0)
    }
  }, [currentIndex, pause, playlist.length, shuffle, repeat])

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value))
    setNoteIndex(0)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopAudio()
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [stopAudio])

  const filteredPlaylist = searchQuery
    ? playlist.filter((s) => s.title.includes(searchQuery) || s.artist.includes(searchQuery))
    : playlist

  const getCoverColor = () => COLORS[currentIndex % COLORS.length]

  return (
    <div style={{ display: 'flex', height: '100%', background: '#121212', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: 160, height: 160, borderRadius: 12,
            background: `linear-gradient(135deg, ${getCoverColor()}, ${getCoverColor()}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 32px ${getCoverColor()}44`, marginBottom: 24, position: 'relative'
          }}>
            <div style={{ fontSize: 48, opacity: 0.7 }}>🎵</div>
            {isPlaying && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }}>
                {[0.6, 1, 0.4, 0.8, 0.5].map((h, i) => (
                  <div key={i} style={{
                    width: 4, height: h * 30, background: '#fff', borderRadius: 2,
                    animation: `equalizer ${0.4 + i * 0.15}s ease-in-out infinite alternate`
                  }} />
                ))}
              </div>
            )}
          </div>
          <style>{`@keyframes equalizer { 0% { height: 30%; } 100% { height: 100%; } }`}</style>

          <div style={{ fontWeight: 700, fontSize: 18, textAlign: 'center', marginBottom: 4 }}>{currentSong.title}</div>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>{currentSong.artist} · {currentSong.album}</div>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 16 }}>
            🎹 Web Audio API 合成 · {currentSong.wave === 'sine' ? '正弦波' : currentSong.wave === 'triangle' ? '三角波' : currentSong.wave === 'square' ? '方波' : '锯齿波'}
          </div>

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#888', width: 32 }}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={totalSeconds}
              value={Math.min(currentTime, totalSeconds)}
              onChange={seek}
              style={{ flex: 1, accentColor: '#4ecca3', height: 4 }}
            />
            <span style={{ fontSize: 11, color: '#888', width: 32 }}>{currentSong.duration}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <button onClick={() => setShuffle(!shuffle)} style={{ ...ctrlBtn, color: shuffle ? '#4ecca3' : '#aaa' }}>🔀</button>
            <button onClick={handlePrev} style={ctrlBtn}>⏮</button>
            <button onClick={handlePlayPause} style={{ ...ctrlBtn, fontSize: 28, width: 48, height: 48, borderRadius: '50%', background: '#4ecca3', color: '#121212' }}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={handleNext} style={ctrlBtn}>⏭</button>
            <button
              onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
              style={{ ...ctrlBtn, color: repeat !== 'none' ? '#4ecca3' : '#aaa' }}
            >
              {repeat === 'one' ? '🔂' : '🔁'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <span style={{ fontSize: 14 }}>🔈</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              style={{ width: 100, accentColor: '#4ecca3', height: 4 }}
            />
            <span style={{ fontSize: 12, color: '#aaa', width: 30 }}>{volume}%</span>
          </div>
        </div>
      </div>

      <div style={{ width: 280, background: '#181818', borderLeft: '1px solid #282828', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid #282828' }}>
          播放列表 ({playlist.length})
        </div>
        <div style={{ padding: '0 8px' }}>
          <input
            placeholder="搜索歌曲..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px', margin: '8px 0', borderRadius: 16,
              border: '1px solid #333', background: '#242424', color: '#ccc', fontSize: 12, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredPlaylist.map((song, i) => {
            const realIndex = playlist.indexOf(song)
            return (
              <div
                key={i}
                style={{
                  padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: realIndex === currentIndex ? '#242424' : 'transparent',
                  borderLeft: realIndex === currentIndex ? '3px solid #4ecca3' : '3px solid transparent'
                }}
                onClick={() => {
                  pause()
                  setCurrentIndex(realIndex)
                  setCurrentTime(0)
                  setNoteIndex(0)
                  setTimeout(() => play(), 100)
                }}
                onMouseEnter={(e) => { if (realIndex !== currentIndex) e.currentTarget.style.background = '#1f1f1f' }}
                onMouseLeave={(e) => { if (realIndex !== currentIndex) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 4, flexShrink: 0,
                  background: `linear-gradient(135deg, ${COLORS[realIndex % COLORS.length]}, ${COLORS[realIndex % COLORS.length]}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                }}>
                  {realIndex === currentIndex && isPlaying ? '▶' : '🎵'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: realIndex === currentIndex ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.artist}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#666', flexShrink: 0 }}>{song.duration}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const ctrlBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer',
  fontSize: 18, padding: 6, borderRadius: '50%', width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}
