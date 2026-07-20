import { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react'
import { useStore } from '../../store'
import { TerminalIcon, FolderIcon, GlobeIcon, SettingsIcon, InfoIcon, CalculatorIcon, StickyNoteIcon, ImageIcon, SparklesIcon, PaletteIcon, HelpIcon, SearchIcon, CommandIcon, TrashIcon } from '../../icons'
import DesktopWidgets, {
  getWidgetVisibility,
  setWidgetVisibility,
  WIDGET_IDS,
  WIDGET_TITLES,
  type WidgetId,
} from './DesktopWidgets'
import AuroraWallpaper from './AuroraWallpaper'
import { loadFromStorage, debouncedSaveToStorage } from '../../store/storageUtils'

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
  'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #2a1a3e 100%)',
  'linear-gradient(135deg, #1a2a3a 0%, #2a4a5a 50%, #1a3a4a 100%)',
  'linear-gradient(135deg, #2d1b4e 0%, #1a2a4e 50%, #0a1a3e 100%)',
  'linear-gradient(135deg, #0f1a2a 0%, #1a2a3a 50%, #0a2a4a 100%)',
]

/* ── Desktop Clock Widget ── */
const DesktopClock = memo(function DesktopClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()
  const h12 = hours % 12 || 12
  const ampm = hours < 12 ? 'AM' : 'PM'
  const timeStr = `${h12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const secStr = seconds.toString().padStart(2, '0')
  const dateStr = time.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="desktop-clock-widget">
      <div className="desktop-clock-time">
        {timeStr}<span className="desktop-clock-seconds">:{secStr}</span>
        <span className="desktop-clock-ampm">{ampm}</span>
      </div>
      <div className="desktop-clock-date">{dateStr}</div>
    </div>
  )
})

/* ── Draggable Desktop Icon ── */
const DesktopIcon = memo(function DesktopIcon({ 
  icon, 
  selectedIconId, 
  onClick, 
  onDoubleClick,
  index = 0,
  booted,
  onDragEnd,
}: { 
  icon: { id: string; x: number; y: number; name: string; icon: React.ReactNode }
  selectedIconId: string | null
  onClick: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void
  index?: number
  booted: boolean
  onDragEnd: (id: string, x: number, y: number) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const dragStartRef = useRef<{ mx: number; my: number; ix: number; iy: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dragStartRef.current = {
      mx: e.clientX,
      my: e.clientY,
      ix: icon.x,
      iy: icon.y,
    }
    setDragging(true)
  }, [icon.x, icon.y])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => {
      const start = dragStartRef.current
      if (!start) return
      const dx = e.clientX - start.mx
      const dy = e.clientY - start.my
      setDragPos({ x: start.ix + dx, y: start.iy + dy })
    }
    const handleUp = (e: MouseEvent) => {
      const start = dragStartRef.current
      setDragging(false)
      setDragPos(null)
      dragStartRef.current = null
      if (start) {
        const dx = e.clientX - start.mx
        const dy = e.clientY - start.my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 5) {
          onDragEnd(icon.id, start.ix + dx, start.iy + dy)
        }
      }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, icon.id, onDragEnd])

  const currentX = dragPos ? dragPos.x : icon.x
  const currentY = dragPos ? dragPos.y : icon.y
  const bootedClass = booted ? 'desktop-icon-booted' : 'desktop-icon-booting'

  return (
    <div
      className={`desktop-icon ${bootedClass} ${selectedIconId === icon.id ? 'selected' : ''} ${dragging ? 'desktop-icon-dragging' : ''}`}
      style={{
        left: currentX,
        top: currentY,
        '--boot-index': index,
      } as React.CSSProperties}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
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
      <span className="desktop-icon-glass-bg" aria-hidden="true" />
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
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`context-menu context-menu-enhanced ${visible ? 'context-menu-visible' : ''}`}
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
            <span className="context-menu-item-icon" aria-hidden="true">{item.icon}</span>
            <span className="context-menu-item-label">{item.label}</span>
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
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const updateDesktopIconPosition = useStore((s) => s.updateDesktopIconPosition)

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  // 开机动画：图标交错淡入
  const [booted, setBooted] = useState(false)
  // 桌面小部件总开关与单项可见性，持久化到 localStorage
  const [widgetsVisible, setWidgetsVisible] = useState<boolean>(() =>
    loadFromStorage<boolean>('weblinux-widgets-on', true)
  )
  const [widgetVisibility, setWidgetVisibilityState] = useState<Record<string, boolean>>(() =>
    getWidgetVisibility()
  )
  const lastClickRef = useRef<{ id: string; time: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const mousePosRef = useRef({ x: 0, y: 0 })
  const liveWallpaperRef = useRef(liveWallpaper)
  const liveWallpaperEnabledRef = useRef(liveWallpaperEnabled)

  // 显示桌面过渡效果
  const [showDesktopEffect, setShowDesktopEffect] = useState(false)

  // 使用useMemo生成星星位置，避免每次渲染时重新生成
  const nebulaStars = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      opacity: Math.random() * 0.7 + 0.3,
    })), []
  )

  useEffect(() => {
    liveWallpaperRef.current = liveWallpaper
  }, [liveWallpaper])

  useEffect(() => {
    liveWallpaperEnabledRef.current = liveWallpaperEnabled
  }, [liveWallpaperEnabled])

  const initializeParticles = useCallback(() => {
    // 粒子数量根据设备性能动态调整，避免低性能设备卡顿
    const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    const particleCount = isLowPerformance ? 30 : 60;
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      speed: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.5 ? 'rgba(139, 124, 240, 0.6)' : 'rgba(0, 206, 201, 0.5)',
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
    // 根据设备性能动态调整目标帧率
    const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    const targetFPS = isLowPerformance ? 20 : 30
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

  // 开机后延迟启动图标交错动画
  useEffect(() => {
    if (showSplash) return
    const timer = setTimeout(() => setBooted(true), 100)
    return () => clearTimeout(timer)
  }, [showSplash])

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

  // 点击桌面区域 - 显示桌面过渡效果（最小化所有窗口）
  const handleDesktopClick = useCallback(() => {
    setSelectedIconId(null)
    hideContextMenu()
    // 触发显示桌面过渡效果
    const windows = useStore.getState().windows
    const visibleWindows = windows.filter(w => !w.minimized)
    if (visibleWindows.length > 0) {
      setShowDesktopEffect(true)
      // 依次最小化窗口，带延迟产生动画效果
      visibleWindows.forEach((w, i) => {
        setTimeout(() => {
          minimizeWindow(w.id)
        }, i * 60)
      })
      setTimeout(() => setShowDesktopEffect(false), visibleWindows.length * 60 + 400)
    }
  }, [hideContextMenu, minimizeWindow])

  const handleIconDragEnd = useCallback((id: string, x: number, y: number) => {
    updateDesktopIconPosition(id, x, y)
  }, [updateDesktopIconPosition])

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
    const types = ['particles', 'interactive', 'waves', 'nebula', 'aurora', 'aurora-storm']
    const idx = types.indexOf(liveWallpaper)
    const next = types[(idx + 1) % types.length]
    setLiveWallpaper(next)
  }, [liveWallpaper, setLiveWallpaper])

  // 切换小部件总开关
  const toggleWidgets = useCallback(() => {
    setWidgetsVisible((prev) => {
      const next = !prev
      debouncedSaveToStorage('weblinux-widgets-on', next, 100)
      return next
    })
  }, [])

  // 切换单个小部件可见性
  const handleToggleWidget = useCallback((id: WidgetId) => {
    const current = getWidgetVisibility()
    const next = !current[id]
    setWidgetVisibility(id, next)
    setWidgetVisibilityState(getWidgetVisibility())
  }, [])

  // 监听小部件外部变更（例如小部件自身关闭按钮）
  useEffect(() => {
    const handler = () => setWidgetVisibilityState(getWidgetVisibility())
    window.addEventListener('weblinux-widgets-change', handler)
    return () => window.removeEventListener('weblinux-widgets-change', handler)
  }, [])

  const menuItems: MenuEntry[] = useMemo(() => [
    { label: '打开终端', icon: <TerminalIcon size={16} />, action: () => openApp('terminal') },
    { label: '打开文件管理器', icon: <FolderIcon size={16} />, action: () => openApp('files') },
    { label: '打开浏览器', icon: <GlobeIcon size={16} />, action: () => openApp('browser') },
    { type: 'separator' as const },
    { label: '全局搜索', icon: <SearchIcon size={16} />, action: () => {
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
      window.dispatchEvent(event)
    }},
    { label: '命令面板', icon: <CommandIcon size={16} />, action: () => {
      const event = new KeyboardEvent('keydown', { key: 'p', metaKey: true, bubbles: true })
      window.dispatchEvent(event)
    }},
    { type: 'separator' as const },
    { label: '更换壁纸', icon: <ImageIcon size={16} />, action: handleWallpaperChange },
    { label: liveWallpaperEnabled ? '关闭动态壁纸' : '开启动态壁纸', icon: <SparklesIcon size={16} />, action: toggleLiveWallpaper },
    { label: '切换动态壁纸', icon: <PaletteIcon size={16} />, action: cycleLiveWallpaper },
    { label: '显示设置', icon: <SettingsIcon size={16} />, action: () => openApp('settings') },
    { type: 'separator' as const },
    { label: widgetsVisible ? '隐藏桌面小部件' : '显示桌面小部件', icon: <SparklesIcon size={16} />, action: toggleWidgets },
    ...WIDGET_IDS.map((id) => ({
      label: `${widgetVisibility[id] ? '✓' : '　'} ${WIDGET_TITLES[id]}`,
      icon: <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: widgetVisibility[id] ? 'var(--accent)' : 'transparent', border: widgetVisibility[id] ? 'none' : '1px solid var(--text-secondary)' }} /></span>,
      action: () => handleToggleWidget(id),
    })),
    { type: 'separator' as const },
    { label: '打开计算器', icon: <CalculatorIcon size={16} />, action: () => openApp('calculator') },
    { label: '打开记事本', icon: <StickyNoteIcon size={16} />, action: () => openApp('notepad') },
    { type: 'separator' as const },
    { label: '清理所有窗口', icon: <TrashIcon size={16} />, action: () => {
      const windows = useStore.getState().windows
      windows.forEach(w => useStore.getState().closeWindow(w.id))
    }},
    { type: 'separator' as const },
    { label: '系统信息', icon: <InfoIcon size={16} />, action: () => openApp('about') },
    { label: '帮助', icon: <HelpIcon size={16} />, action: () => openApp('help') },
  ], [openApp, handleWallpaperChange, liveWallpaperEnabled, toggleLiveWallpaper, cycleLiveWallpaper, widgetsVisible, widgetVisibility, toggleWidgets, handleToggleWidget])

  const wallpaperStyle = wallpaper
    ? wallpaper.startsWith('linear-gradient')
      ? { background: wallpaper }
      : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' as const }
    : {
        background: 'radial-gradient(ellipse at 10% 20%, rgba(139, 124, 240, 0.3) 0%, transparent 50%), ' +
          'radial-gradient(ellipse at 90% 80%, rgba(0, 206, 201, 0.25) 0%, transparent 50%), ' +
          'radial-gradient(ellipse at 50% 50%, rgba(255, 107, 107, 0.12) 0%, transparent 60%), ' +
          'linear-gradient(135deg, #0a0a18 0%, #161630 30%, #0f0f23 70%, #161630 100%)'
      }

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
      className={`desktop ${booted ? 'desktop-booted' : ''}`}
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
      onMouseMove={handleMouseMove}
      style={wallpaperStyle}
      role="application"
      aria-label="桌面环境"
      tabIndex={-1}
    >
      {/* Aurora canvas wallpaper */}
      <AuroraWallpaper />

      {/* Enhanced animated background layers */}
      <div className="desktop-background-layer" />
      
      {/* Aurora effect overlay */}
      <div className="desktop-aurora-effect" />

      {/* Depth gradient overlay - 增加深度的微妙渐变层 */}
      <div className="desktop-depth-gradient" />
      
      {/* Floating gradient orbs */}
      <div className="desktop-gradient-orb">
        <div className="desktop-gradient-orb-1" />
        <div className="desktop-gradient-orb-2" />
        <div className="desktop-gradient-orb-3" />
      </div>
      
      {/* Live wallpaper particles */}
      {liveWallpaperEnabled && (
        <>
          {liveWallpaper === 'nebula' ? (
            <>
              <div className="desktop-nebula-layer">
                <div className="desktop-nebula-cloud desktop-nebula-cloud-1" />
                <div className="desktop-nebula-cloud desktop-nebula-cloud-2" />
                <div className="desktop-nebula-cloud desktop-nebula-cloud-3" />
                <div className="desktop-nebula-stars">
                  {nebulaStars.map(star => (
                    <div
                      key={star.id}
                      className="desktop-nebula-star"
                      style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        animationDelay: `${star.delay}s`,
                        opacity: star.opacity,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
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
        </>
      )}
      
      <div className="sr-only" role="status" aria-live="polite">
        Web Linux 桌面环境 - 右键可打开上下文菜单
      </div>

      {/* 桌面右上角时钟小部件 */}
      <DesktopClock />

      {/* 桌面小部件系统：时钟 / 系统脉搏 / 天气 / 便签 / 专注计时器 */}
      <DesktopWidgets visible={widgetsVisible} />

      {desktopIcons.map((icon, index) => (
        <DesktopIcon
          key={icon.id}
          icon={icon}
          selectedIconId={selectedIconId}
          index={index}
          booted={booted}
          onDragEnd={handleIconDragEnd}
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

      {/* 显示桌面过渡效果 - 闪光波纹 */}
      {showDesktopEffect && (
        <div className="desktop-show-effect" />
      )}

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
