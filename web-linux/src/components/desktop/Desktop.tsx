import { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react'
import { useStore } from '../../store'
import { TerminalIcon, FolderIcon, GlobeIcon, SettingsIcon, InfoIcon, CalculatorIcon, StickyNoteIcon, ImageIcon, SparklesIcon, PaletteIcon, HelpIcon, CodeIcon } from '../../icons'

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

const DesktopIcon = memo(function DesktopIcon({ 
  icon, 
  selectedIconId, 
  onClick, 
  onDoubleClick 
}: { 
  icon: { id: string; x: number; y: number; name: string; icon: React.ReactNode }
  selectedIconId: string | null
  onClick: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      className={`desktop-icon ${selectedIconId === icon.id ? 'selected' : ''}`}
      style={{ left: icon.x, top: icon.y }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (selectedIconId === icon.id) {
            onDoubleClick(e)
          } else {
            onClick(e)
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
  )
})

interface MenuItem {
  label: string
  icon: React.ReactNode
  action: () => void
}

interface MenuSeparator {
  type: 'separator'
}

type MenuEntry = MenuItem | MenuSeparator

const ContextMenu = memo(function ContextMenu({ 
  menuItems, 
  position, 
  onClose 
}: { 
  menuItems: MenuEntry[]
  position: { x: number; y: number }
  onClose: () => void
}) {
  return (
    <div
      className="context-menu"
      style={{ left: position.x, top: position.y }}
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
              onClose()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                item.action()
                onClose()
              }
            }}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ),
      )}
    </div>
  )
})

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
  const mousePosRef = useRef({ x: 0, y: 0 })
  const liveWallpaperRef = useRef(liveWallpaper)
  const liveWallpaperEnabledRef = useRef(liveWallpaperEnabled)

  useEffect(() => {
    liveWallpaperRef.current = liveWallpaper
  }, [liveWallpaper])

  useEffect(() => {
    liveWallpaperEnabledRef.current = liveWallpaperEnabled
  }, [liveWallpaperEnabled])

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

  const particlesRef = useRef<Particle[]>([])
  
  useEffect(() => {
    initializeParticles()
  }, [initializeParticles])

  useEffect(() => {
    if (!liveWallpaperEnabled) return

    let animationId: number
    let lastTime = 0
    let running = true
    const targetFPS = 30
    const frameInterval = 1000 / targetFPS
    let connectionBatchCounter = 0

    const computeConnections = (list: Particle[]): Connection[] => {
      const active: Connection[] = []
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const p1 = list[i]
          const p2 = list[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 12) {
            active.push({ from: i, to: j, opacity: 1 - dist / 12 })
          }
        }
      }
      return active
    }

    const animate = (currentTime: number) => {
      if (!running) return
      if (lastTime === 0) lastTime = currentTime
      const deltaTime = currentTime - lastTime

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)
        const mp = mousePosRef.current
        const currentMode = liveWallpaperRef.current

        setParticles((prev) => {
          if (prev.length === 0) return prev
          const newParticles: Particle[] = new Array(prev.length)
          for (let i = 0; i < prev.length; i++) {
            const p = prev[i]
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

            if (currentMode === 'interactive') {
              const dx = (mp.x - newX) / 100
              const dy = (mp.y - newY) / 100
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 0.25 && dist > 0.001) {
                newVx -= dx * 0.01
                newVy -= dy * 0.01
              }
            }

            newVx += (Math.random() - 0.5) * 0.005
            newVy += (Math.random() - 0.5) * 0.005

            const maxSpeed = 0.4
            const speed = Math.sqrt(newVx * newVx + newVy * newVy)
            if (speed > maxSpeed) {
              newVx = (newVx / speed) * maxSpeed
              newVy = (newVy / speed) * maxSpeed
            }

            newParticles[i] = { ...p, x: newX, y: newY, vx: newVx, vy: newVy }
          }

          particlesRef.current = newParticles

          if (currentMode !== 'particles') {
            connectionBatchCounter++
            if (connectionBatchCounter % 3 === 0) {
              setConnections(computeConnections(newParticles))
            }
          } else {
            if (connectionBatchCounter % 5 === 0) setConnections([])
            connectionBatchCounter = 0
          }

          return newParticles
        })
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      running = false
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [liveWallpaperEnabled])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mousePosRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    }
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

  const menuItems: MenuEntry[] = useMemo(() => [
    { label: '打开终端', icon: <TerminalIcon size={16} />, action: () => openApp('terminal') },
    { label: '打开文件管理器', icon: <FolderIcon size={16} />, action: () => openApp('files') },
    { label: '打开浏览器', icon: <GlobeIcon size={16} />, action: () => openApp('browser') },
    { type: 'separator' as const },
    { label: '更换壁纸', icon: <ImageIcon size={16} />, action: handleWallpaperChange },
    { label: liveWallpaperEnabled ? '关闭动态壁纸' : '开启动态壁纸', icon: <SparklesIcon size={16} />, action: toggleLiveWallpaper },
    { label: '切换动态壁纸', icon: <PaletteIcon size={16} />, action: cycleLiveWallpaper },
    { label: '显示设置', icon: <SettingsIcon size={16} />, action: () => openApp('settings') },
    { type: 'separator' as const },
    { label: '打开计算器', icon: <CalculatorIcon size={16} />, action: () => openApp('calculator') },
    { label: '打开记事本', icon: <StickyNoteIcon size={16} />, action: () => openApp('notepad') },
    { type: 'separator' as const },
    { label: '系统信息', icon: <InfoIcon size={16} />, action: () => openApp('about') },
    { label: '帮助', icon: <HelpIcon size={16} />, action: () => openApp('help') },
  ], [openApp, handleWallpaperChange, liveWallpaperEnabled, toggleLiveWallpaper, cycleLiveWallpaper])

  const wallpaperStyle = wallpaper
    ? wallpaper.startsWith('linear-gradient')
      ? { background: wallpaper }
      : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' as const }
    : undefined

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-screen-orb">
          <div className="splash-screen-orb-1" />
          <div className="splash-screen-orb-2" />
          <div className="splash-screen-orb-3" />
          <div className="splash-screen-orb-4" />
        </div>
        
        <div className="splash-logo">
          <TerminalIcon size={48} />
        </div>
        <div className="splash-title">
          WebLinuxOS
        </div>
        <div className="splash-subtitle">
          Web-Based Linux Desktop Environment
        </div>
        <div className="splash-status">
          正在启动桌面环境...
        </div>
        <div className="splash-progress-container">
          <div className="splash-progress-bar" />
        </div>
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
          'radial-gradient(ellipse at 10% 20%, rgba(139, 124, 240, 0.3) 0%, transparent 50%), ' +
          'radial-gradient(ellipse at 90% 80%, rgba(0, 206, 201, 0.25) 0%, transparent 50%), ' +
          'radial-gradient(ellipse at 50% 50%, rgba(255, 107, 107, 0.12) 0%, transparent 60%), ' +
          'linear-gradient(135deg, #0a0a18 0%, #161630 30%, #0f0f23 70%, #161630 100%)'
      }}
      role="application"
      aria-label="桌面环境"
      tabIndex={-1}
    >
      {/* Enhanced animated background layers */}
      <div className="desktop-background-layer" />
      
      {/* Aurora effect overlay */}
      <div className="desktop-aurora-effect" />
      
      {/* Floating gradient orbs */}
      <div className="desktop-gradient-orb">
        <div className="desktop-gradient-orb-1" />
        <div className="desktop-gradient-orb-2" />
        <div className="desktop-gradient-orb-3" />
      </div>
      
      {/* Live wallpaper particles */}
      {liveWallpaperEnabled && (
        <>
          {particles.map(p => (
            <div
              key={p.id}
              className="desktop-live-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 6}px ${p.color}, 0 0 ${p.size * 12}px ${p.color}`,
              }}
            />
          ))}
          
          {/* Connecting lines for particles (waves/network effect) */}
          {liveWallpaper !== 'particles' && (
            <svg className="desktop-particle-connections">
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
        <DesktopIcon
          key={icon.id}
          icon={icon}
          selectedIconId={selectedIconId}
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick(icon.appId, icon.id)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            handleIconDoubleClick(icon.appId)
          }}
        />
      ))}

      {contextMenu.visible && (
        <ContextMenu
          menuItems={menuItems}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={hideContextMenu}
        />
      )}
    </div>
  )
})

export default Desktop