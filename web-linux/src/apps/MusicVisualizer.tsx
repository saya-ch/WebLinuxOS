import React, { useEffect, useRef, useState } from 'react'

type VisualizerMode = 'bars' | 'wave' | 'circular' | 'particles'
type ColorTheme = 'neon' | 'fire' | 'ocean' | 'sunset'

const MusicVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const [mode, setMode] = useState<VisualizerMode>('bars')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('neon')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [songName, setSongName] = useState('🎵 选择音乐文件')
  
  const colorThemes: Record<ColorTheme, (i: number, total: number) => string> = {
    neon: (i: number, total: number) => `hsl(${(i / total) * 360}, 100%, 60%)`,
    fire: (i: number, total: number) => `hsl(${(i / total) * 60}, 100%, ${50 + Math.sin(i / total * Math.PI) * 30}%)`,
    ocean: (i: number, total: number) => `hsl(${180 + (i / total) * 60}, 80%, ${40 + Math.sin(i / total * Math.PI) * 30}%)`,
    sunset: (i: number, total: number) => `hsl(${340 + (i / total) * 40}, 100%, ${50 + Math.sin(i / total * Math.PI) * 25}%)`
  }
  
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    initAudio()
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    
    const url = URL.createObjectURL(file)
    audioRef.current = new Audio(url)
    audioRef.current.volume = volume
    
    const audioContext = audioContextRef.current!
    const analyser = analyserRef.current!
    
    if (sourceRef.current) {
      sourceRef.current.disconnect()
    }
    
    sourceRef.current = audioContext.createMediaElementSource(audioRef.current) as MediaElementAudioSourceNode
    sourceRef.current.connect(analyser)
    analyser.connect(audioContext.destination)
    
    setSongName(`🎵 ${file.name}`)
    
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false)
    })
  }
  
  const togglePlay = async () => {
    if (!audioRef.current) {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
      return
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }
  
  const drawBars = (ctx: CanvasRenderingContext2D, width: number, height: number, dataArray: Uint8Array) => {
    const barWidth = (width / dataArray.length) * 2.5
    let x = 0
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height
      
      ctx.fillStyle = colorThemes[colorTheme](i, dataArray.length)
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
      
      ctx.shadowBlur = 15
      ctx.shadowColor = colorThemes[colorTheme](i, dataArray.length)
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
      
      x += barWidth
    }
  }
  
  const drawWave = (ctx: CanvasRenderingContext2D, width: number, height: number, dataArray: Uint8Array) => {
    ctx.lineWidth = 3
    ctx.beginPath()
    
    const sliceWidth = width / dataArray.length
    let x = 0
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * height) / 2
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      
      ctx.strokeStyle = colorThemes[colorTheme](i, dataArray.length)
      x += sliceWidth
    }
    
    ctx.lineTo(width, height / 2)
    ctx.shadowBlur = 20
    ctx.shadowColor = colorThemes[colorTheme](0, dataArray.length)
    ctx.stroke()
  }
  
  const drawCircular = (ctx: CanvasRenderingContext2D, width: number, height: number, dataArray: Uint8Array) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 4
    
    ctx.beginPath()
    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2
      const amplitude = (dataArray[i] / 255) * radius
      const x = centerX + Math.cos(angle) * (radius + amplitude)
      const y = centerY + Math.sin(angle) * (radius + amplitude)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      
      ctx.strokeStyle = colorThemes[colorTheme](i, dataArray.length)
    }
    ctx.closePath()
    ctx.lineWidth = 3
    ctx.shadowBlur = 20
    ctx.shadowColor = colorThemes[colorTheme](0, dataArray.length)
    ctx.stroke()
  }
  
  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number, dataArray: Uint8Array) => {
    const centerX = width / 2
    const centerY = height / 2
    
    for (let i = 0; i < dataArray.length; i += 2) {
      const angle = (i / dataArray.length) * Math.PI * 2
      const distance = (dataArray[i] / 255) * Math.min(width, height) * 0.4
      const size = (dataArray[i + 1] / 255) * 10 + 2
      
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance
      
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = colorThemes[colorTheme](i, dataArray.length)
      ctx.shadowBlur = 15
      ctx.shadowColor = colorThemes[colorTheme](i, dataArray.length)
      ctx.fill()
    }
  }
  
  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const analyser = analyserRef.current
    if (!analyser) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)
    
    ctx.fillStyle = 'rgba(10, 10, 26, 0.2)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.shadowBlur = 0
    
    switch (mode) {
      case 'bars':
        drawBars(ctx, canvas.width, canvas.height, dataArray)
        break
      case 'wave':
        drawWave(ctx, canvas.width, canvas.height, dataArray)
        break
      case 'circular':
        drawCircular(ctx, canvas.width, canvas.height, dataArray)
        break
      case 'particles':
        drawParticles(ctx, canvas.width, canvas.height, dataArray)
        break
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mode, colorTheme])
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
      overflow: 'hidden'
    }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          flex: 1, 
          display: 'block',
          cursor: 'pointer'
        }}
      />
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        background: 'rgba(30, 30, 60, 0.9)',
        borderTop: '1px solid rgba(100, 150, 255, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flex: 1,
            minWidth: '200px'
          }}>
            <button 
              onClick={togglePlay}
              style={{
                padding: '10px 20px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </button>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="audio/*" 
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(100, 150, 255, 0.2)',
                color: '#a0c0ff',
                border: '1px solid rgba(100, 150, 255, 0.3)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📁 选择文件
            </button>
            
            <span style={{ 
              color: '#c0c0e0', 
              fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {songName}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a0a0c0', fontSize: '12px' }}>🔊</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={volume} 
              onChange={handleVolumeChange}
              style={{ width: '100px' }}
            />
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ color: '#a0a0c0', fontSize: '12px' }}>可视化模式</label>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as VisualizerMode)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#2a2a4a',
                color: '#e0e0e0',
                border: '1px solid rgba(100, 150, 255, 0.3)'
              }}
            >
              <option value="bars">🎚️ 条形图</option>
              <option value="wave">〰️ 波形图</option>
              <option value="circular">⭕ 圆形图</option>
              <option value="particles">✨ 粒子</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ color: '#a0a0c0', fontSize: '12px' }}>配色主题</label>
            <select 
              value={colorTheme}
              onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#2a2a4a',
                color: '#e0e0e0',
                border: '1px solid rgba(100, 150, 255, 0.3)'
              }}
            >
              <option value="neon">🌈 霓虹</option>
              <option value="fire">🔥 火焰</option>
              <option value="ocean">🌊 海洋</option>
              <option value="sunset">🌅 日落</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MusicVisualizer
