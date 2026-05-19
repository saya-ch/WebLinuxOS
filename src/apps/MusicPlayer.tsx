import { useState, useRef, useCallback } from 'react'

const PRESET_SONGS = [
  { title: '星空下的旋律', artist: '林若曦', duration: '4:32', album: '星夜' },
  { title: '城市夜行', artist: '暗潮乐队', duration: '3:58', album: '城市声音' },
  { title: '清晨的咖啡', artist: 'Jazz Trio', duration: '5:12', album: 'Morning Brew' },
  { title: '远方的风', artist: '山川与海', duration: '4:05', album: '旅途' },
  { title: '代码之夜', artist: 'Binary Beats', duration: '3:45', album: 'Digital Dreams' },
  { title: '雨天旋律', artist: '钢琴与雨', duration: '6:18', album: '雨后' },
  { title: '夏日回忆', artist: '阳光海岸', duration: '3:30', album: 'Summer Hits' },
  { title: '月光小夜曲', artist: '古典之夜', duration: '5:55', album: '月下' },
]

const COLORS = ['#e94560', '#0f3460', '#4ecca3', '#f5c542', '#7b68ee', '#ff6b6b', '#48dbfb', '#ff9ff3']

export default function MusicPlayer() {
  const [playlist] = useState(PRESET_SONGS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentSong = playlist[currentIndex]
  const totalSeconds = currentSong.duration.split(':').reduce((m, s) => m * 60 + parseInt(s), 0)

  const play = useCallback(() => {
    setIsPlaying(true)
    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalSeconds) {
          handleNext()
          return 0
        }
        return prev + 1
      })
    }, 1000)
  }, [totalSeconds])

  const pause = useCallback(() => {
    setIsPlaying(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const handlePlayPause = () => { isPlaying ? pause() : play() }

  const handlePrev = () => {
    setCurrentTime(0)
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
    else setCurrentIndex(playlist.length - 1)
    if (!isPlaying) play()
  }

  const handleNext = useCallback(() => {
    setCurrentTime(0)
    if (repeat === 'one') {
      if (!isPlaying) play()
    } else if (shuffle) {
      const next = Math.floor(Math.random() * playlist.length)
      setCurrentIndex(next)
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      if (repeat === 'all') setCurrentIndex(0)
      else { setCurrentIndex(0); pause() }
    }
    if (!isPlaying) play()
  }, [currentIndex, isPlaying, playlist.length, repeat, shuffle])

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value))
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const volPct = volume

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
            boxShadow: `0 8px 32px ${getCoverColor()}44`, marginBottom: 24
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
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>{currentSong.artist} · {currentSong.album}</div>

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#888', width: 32 }}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={totalSeconds}
              value={currentTime}
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
            <span style={{ fontSize: 12, color: '#aaa', width: 30 }}>{volPct}%</span>
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
          {filteredPlaylist.map((song, i) => (
            <div
              key={i}
              style={{
                padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                background: i === currentIndex ? '#242424' : 'transparent',
                borderLeft: i === currentIndex ? '3px solid #4ecca3' : '3px solid transparent'
              }}
              onClick={() => { setCurrentIndex(i); setCurrentTime(0); if (!isPlaying) play() }}
              onMouseEnter={(e) => { if (i !== currentIndex) e.currentTarget.style.background = '#1f1f1f' }}
              onMouseLeave={(e) => { if (i !== currentIndex) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 4, flexShrink: 0,
                background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
              }}>
                {i === currentIndex && isPlaying ? '▶' : '🎵'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: i === currentIndex ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.title}
                </div>
                <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.artist}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#666', flexShrink: 0 }}>{song.duration}</div>
            </div>
          ))}
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