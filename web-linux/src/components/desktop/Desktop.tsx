import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { useStore } from '../../store'

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

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)
  const lastClickRef = useRef<{ id: string; time: number } | null>(null)

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

  const menuItems: MenuEntry[] = [
    { label: '打开终端', icon: '💻', action: () => openApp('terminal') },
    { label: '打开文件管理器', icon: '📁', action: () => openApp('files') },
    { type: 'separator' },
    { label: '更换壁纸', icon: '🖼️', action: handleWallpaperChange },
    { label: '显示设置', icon: '⚙️', action: () => openApp('settings') },
  ]

  const wallpaperStyle = wallpaper
    ? wallpaper.startsWith('linear-gradient')
      ? { background: wallpaper }
      : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' as const }
    : undefined

  return (
    <div
      className="desktop"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
      style={wallpaperStyle}
    >
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
              }
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`打开 ${icon.name}`}
        >
          <span className="desktop-icon-icon">{icon.icon}</span>
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