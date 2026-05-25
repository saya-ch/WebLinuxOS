import { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react'
import { useStore } from '../../store'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  color: string
  vx: number
  vy: number
}

interface Connection {
  from: number
  to: number
  opacity: number
}

const wallpapers = [
  '',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #1a1a2e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
  'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
  'linear-gradient(135deg, #6a0572 0%, #ab83a1 100%)',
  'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  'linear-gradient(135deg, #ffb7b2 0%, #e2f0cb 100%)',
  'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  'linear-gradient(135deg, #000000 0%, #434343 100%)',
  'linear-gradient(135deg, #355c7d 0%, #c96b8a 50%, #f67280 100%)',
  'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
]

interface MenuItem {
  label: string
  icon: string
  action: () => void
}

interface MenuSeparator {
  type: 'separator'
}

type MenuEntry = MenuItem | MenuSeparator

const Desktop = memo(function Desktop() {
  const desktopIcons = useStore((s) => s.desktopIcons)
  const openApp = useStore((s) => s.openApp)
  const contextMenu = useStore((s) => s.contextMenu)
  const showContextMenu = useStore((s) => s.showContextMenu)
  const hideContextMenu = useStore((s) => s.hideContextMenu)
  const wallpaper = useStore((s) => s.wallpaper)
  const setWallpaper = useStore((s) => s.setWallpaper)
  const liveWallpaper = useStore((s) => s.liveWallpaper)
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const toggleLiveWallpaper = useStore((s) => s.toggleLiveWallpaper)
  const setLiveWallpaper = useStore((s) => s.setLiveWallpaper)

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  const lastClickRef = useRef<{ id: string; time: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  const particleRef = useRef({ x: 0, y: 0 })

  const initializeParticles = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      speed: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.5 ? 'rgba(139, 124, 240, 0.5)' : 'rgba(0, 206, 201, 0.4)',
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    initializeParticles()
  }, [initializeParticles])

  useEffect(() => {
    if (!liveWallpaperEnabled) return
    
    let animationId: number
    let lastTime = 0
    const targetFPS = 30
    const frameInterval = 1000 / targetFPS
    
    const animate = (currentTime: number) => {
      if (lastTime === 0) lastTime = currentTime
      const deltaTime = currentTime - lastTime
      
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)
        
        setParticles(prev => {
          const newParticles = prev.map(p => {
            let newX = p.x + p.vx
            let newY = p.y + p.vy
            let newVx = p.vx
            let newVy = p.vy

            if (newX <= 0 || newX >= 100) {
              newVx = -newVx
              newX = Math.max(0, Math.min(100, newX))
            }
            if (newY <= 0 || newY >= 100) {
              newVy = -newVy
              newY = Math.max(0, Math.min(100, newY))
            }

            if (liveWallpaper === 'interactive') {
              const dx = (mousePos.x - p.x) / 100
              const dy = (mousePos.y - p.y) / 100
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 0.3 && dist > 0) {
                newVx -= dx * 0.01
                newVy -= dy * 0.01
              }
            }

            newVx += (Math.random() - 0.5) * 0.01
            newVy += (Math.random() - 0.5) * 0.01

            const maxSpeed = 0.5
            const speed = Math.sqrt(newVx * newVx + newVy * newVy)
            if (speed > maxSpeed) {
              newVx = (newVx / speed) * maxSpeed
              newVy = (newVy / speed) * maxSpeed
            }

            return { ...p, x: newX, y: newY, vx: newVx, vy: newVy }
          })
          
          if (liveWallpaper !== 'particles') {
            const newConnections: Connection[] = []
            for (let i = 0; i < newParticles.length; i++) {
              for (let j = i + 1; j < newParticles.length; j++) {
                const p1 = newParticles[i]
                const p2 = newParticles[j]
                const dx = p1.x - p2.x
                const dy = p1.y - p2.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 20) {
                  newConnections.push({
                    from: i,
                    to: j,
                    opacity: (1 - dist / 20) * 0.3
                  })
                }
              }
            }
            setConnections(newConnections)
          } else {
            setConnections([])
          }
          
          return newParticles
        })
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [liveWallpaperEnabled, liveWallpaper, mousePos])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleIconClick = useCallback(
    (appId: string, iconId: string) => {
      const now = Date.now()
      if (lastClickRef.current?.id === iconId && now - lastClickRef.current.time < 400) {
        openApp(appId)
        lastClickRef.current = null
        setSelectedIconId(null)
      } else {
        setSelectedIconId(iconId)
        lastClickRef.current = { id: iconId, time: now }
      }
    },
    [openApp],
  )

  const handleIconDoubleClick = useCallback(
    (appId: string) => {
      openApp(appId)
      setSelectedIconId(null)
    },
    [openApp],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      showContextMenu(e.clientX, e.clientY)
    },
    [showContextMenu],
  )

  const handleDesktopClick = useCallback(() => {
    setSelectedIconId(null)
    hideContextMenu()
  }, [hideContextMenu])

  useEffect(() => {
    const handleGlobalClick = () => hideContextMenu()
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [hideContextMenu])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIconId(null)
        hideContextMenu()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hideContextMenu])

  const handleWallpaperChange = useCallback(() => {
    const idx = wallpapers.indexOf(wallpaper)
    const next = wallpapers[(idx + 1) % wallpapers.length]
    setWallpaper(next)
  }, [wallpaper, setWallpaper])

  const cycleLiveWallpaper = useCallback(() => {
    const types = ['particles', 'interactive', 'waves']
    const idx = types.indexOf(liveWallpaper)
    const next = types[(idx + 1) % types.length]
    setLiveWallpaper(next)
  }, [liveWallpaper, setLiveWallpaper])

  const menuItems: MenuEntry[] = [
    { label: '打开终端', icon: '💻', action: () => openApp('terminal') },
    { label: '打开文件管理器', icon: '📁', action: () => openApp('files') },
    { label: '打开浏览器', icon: '🌐', action: () => openApp('browser') },
    { type: 'separator' },
    { label: '更换壁纸', icon: '🖼️', action: handleWallpaperChange },
    { label: liveWallpaperEnabled ? '关闭动态壁纸' : '开启动态壁纸', icon: '✨', action: toggleLiveWallpaper },
    { label: '切换动态壁纸', icon: '🎨', action: cycleLiveWallpaper },
    { label: '显示设置', icon: '⚙️', action: () => openApp('settings') },
    { type: 'separator' },
    { label: '打开计算器', icon: '🔢', action: () => openApp('calculator') },
    { label: '打开记事本', icon: '📝', action: () => openApp('notepad') },
    { type: 'separator' },
    { label: '系统信息', icon: 'ℹ️', action: () => openApp('about') },
    { label: '帮助', icon: '❓', action: () => openApp('help') },
  ]

  const wallpaperStyle = wallpaper
    ? wallpaper.startsWith('linear-gradient')
      ? { background: wallpaper }
      : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' as const }
    : undefined

  if (showSplash) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeOut 0.5s ease-out 1.5s forwards',
        }}
      >
        <div
          style={{
            fontSize: '72px',
            marginBottom: '24px',
            animation: 'bounceIn 0.6s ease-out',
          }}
        >
          🐧
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#e0e0e8',
            marginBottom: '8px',
            animation: 'slideUp 0.6s ease-out 0.2s both',
          }}
        >
          WebLinuxOS
        </div>
        <div
          style={{
            fontSize: '14px',
            color: '#9090a4',
            animation: 'fadeIn 0.6s ease-out 0.4s both',
          }}
        >
          正在启动桌面环境...
        </div>
        <div
          style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            marginTop: '24px',
            overflow: 'hidden',
            animation: 'slideUp 0.6s ease-out 0.6s both',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
              borderRadius: '2px',
              animation: 'loadingBar 1.5s ease-out forwards',
            }}
          />
        </div>
        <style>{`
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.3); }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; visibility: hidden; }
          }
          @keyframes loadingBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      className="desktop"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
      onMouseMove={handleMouseMove}
      style={{
        ...wallpaperStyle,
        background: wallpaper ? (wallpaper.startsWith('linear-gradient') ? wallpaper : undefined) : 
          'radial-gradient(ellipse at 10% 20%, rgba(139, 124, 240, 0.15) 0%, transparent 50%), ' +
          'radial-gradient(ellipse at 90% 80%, rgba(0, 206, 201, 0.12) 0%, transparent 50%), ' +
          'linear-gradient(135deg, #0f0f23 0%, #1a1a35 50%, #0f0f23 100%)'
      }}
      role="application"
      aria-label="桌面环境"
      tabIndex={-1}
    >
      {/* Animated background overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Live wallpaper particles */}
      {liveWallpaperEnabled && (
        <>
          {particles.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: p.color,
                boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
                pointerEvents: 'none',
                transition: 'left 0.02s linear, top 0.02s linear'
              }}
            />
          ))}
          
          {/* Connecting lines for particles (waves/network effect) */}
          {liveWallpaper !== 'particles' && (
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {connections.map((conn, idx) => {
                const p1 = particles[conn.from]
                const p2 = particles[conn.to]
                if (!p1 || !p2) return null
                return (
                  <line
                    key={idx}
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke={`rgba(139, 124, 240, ${conn.opacity})`}
                    strokeWidth={1}
                  />
                )
              })}
            </svg>
          )}
        </>
      )}
      
      <div className="sr-only" role="status" aria-live="polite">
        Web Linux 桌面环境 - 右键可打开上下文菜单
      </div>
      {desktopIcons.map((icon) => (
        <div
          key={icon.id}
          className={`desktop-icon ${selectedIconId === icon.id ? 'selected' : ''}`}
          style={{ left: icon.x, top: icon.y }}
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick(icon.appId, icon.id)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            handleIconDoubleClick(icon.appId)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (selectedIconId === icon.id) {
                openApp(icon.appId)
                setSelectedIconId(null)
              } else {
                setSelectedIconId(icon.id)
              }
            }
            if (e.key === 'Delete' && selectedIconId === icon.id) {
              e.preventDefault()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${icon.name} - 双击打开`}
          aria-pressed={selectedIconId === icon.id}
        >
          <span className="desktop-icon-icon" aria-hidden="true">{icon.icon}</span>
          <span className="desktop-icon-name">{icon.name}</span>
        </div>
      ))}

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {menuItems.map((item, i) =>
            'type' in item ? (
              <div key={i} className="context-menu-separator" />
            ) : (
              <div
                key={i}
                className="context-menu-item"
                role="menuitem"
                tabIndex={0}
                onClick={() => {
                  item.action()
                  hideContextMenu()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    item.action()
                    hideContextMenu()
                  }
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
})

export default Desktop