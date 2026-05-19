import { useState, useRef, useCallback } from 'react'

const PLAYLIST = [
  { title: 'Web Linux 宣传片', duration: '3:24', thumbnail: '#e94560', src: '' },
  { title: 'React 入门教程', duration: '12:08', thumbnail: '#0f3460', src: '' },
  { title: 'Vite 构建工具介绍', duration: '8:45', thumbnail: '#4ecca3', src: '' },
  { title: 'TypeScript 进阶', duration: '25:30', thumbnail: '#f5c542', src: '' },
  { title: 'Linux 桌面环境', duration: '6:15', thumbnail: '#7b68ee', src: '' },
]

export default function VideoPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentVideo = PLAYLIST[currentIndex]
  const totalSeconds = currentVideo.duration.split(':').reduce((m, s) => m * 60 + parseInt(s), 0)

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
    setCurrentTime(0); pause()
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : PLAYLIST.length - 1)
  }

  const handleNext = useCallback(() => {
    setCurrentTime(0); pause()
    setCurrentIndex(currentIndex < PLAYLIST.length - 1 ? currentIndex + 1 : 0)
  }, [currentIndex])

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value))
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false) }, 3000)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    setVolume(v)
    setIsMuted(v === 0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <div
        style={{ flex: 1, position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { if (isPlaying) setShowControls(false) }}
      >
        <video
          ref={videoRef}
          src=""
          style={{ display: 'none' }}
        />

        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, ${currentVideo.thumbnail}, ${currentVideo.thumbnail}44, #1a1a2e)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 64, opacity: 0.6, marginBottom: 16 }}>🎬</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{currentVideo.title}</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>{currentVideo.duration}</div>
          {!isPlaying && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24,
              padding: '8px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', cursor: 'pointer'
            }}
              onClick={handlePlayPause}
            >
              <span style={{ fontSize: 36 }}>▶</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>点击播放</span>
            </div>
          )}
          {isPlaying && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              fontSize: 48, opacity: 0.2, animation: 'pulse 2s ease-in-out infinite'
            }}>
              ▶
            </div>
          )}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }`}</style>
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 12px 8px',
          opacity: showControls || !isPlaying ? 1 : 0, transition: 'opacity 0.3s'
        }}>
          <div style={{ marginBottom: 4 }}>
            <input
              type="range"
              min={0}
              max={totalSeconds}
              value={currentTime}
              onChange={seek}
              style={{ width: '100%', accentColor: '#e94560', height: 3, margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handlePlayPause} style={vidBtn}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={handlePrev} style={vidBtn}>⏮</button>
            <button onClick={handleNext} style={vidBtn}>⏭</button>
            <span style={{ fontSize: 11, color: '#aaa' }}>{formatTime(currentTime)} / {currentVideo.duration}</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => { setIsMuted(!isMuted); setVolume(isMuted ? 50 : 0) }} style={vidBtn}>{isMuted ? '🔇' : '🔊'}</button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: 60, accentColor: '#e94560', height: 3 }}
            />
            <button onClick={() => setIsFullscreen(!isFullscreen)} style={vidBtn}>⛶</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderTop: '1px solid #333', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#aaa' }}>播放列表</div>
        <div style={{ display: 'flex', overflow: 'auto', padding: '0 8px 8px', gap: 8 }}>
          {PLAYLIST.map((vid, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0, width: 140, cursor: 'pointer', borderRadius: 6, overflow: 'hidden',
                border: i === currentIndex ? '2px solid #e94560' : '2px solid transparent'
              }}
              onClick={() => { setCurrentIndex(i); setCurrentTime(0); pause() }}
            >
              <div style={{ height: 78, background: vid.thumbnail, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                🎬
              </div>
              <div style={{ padding: '6px 8px', background: '#222' }}>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {vid.title}
                </div>
                <div style={{ fontSize: 10, color: '#888' }}>{vid.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const vidBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
  fontSize: 16, padding: '4px 6px', borderRadius: 3
}