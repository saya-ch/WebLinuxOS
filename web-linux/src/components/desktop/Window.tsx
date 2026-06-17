import { useCallback, useRef, useEffect, useState, useMemo, memo } from 'react'
import { useStore } from '../../store'
import type { WindowState } from '../../types'

interface WindowProps {
  window: WindowState
  children: React.ReactNode
}

const Window = memo(function Window({ window: win, children }: WindowProps) {
  const focusWindow = useStore((s) => s.focusWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const updateWindowPosition = useStore((s) => s.updateWindowPosition)
  const updateWindowSize = useStore((s) => s.updateWindowSize)
  const apps = useStore((s) => s.apps)

  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState<'bottom' | 'right' | 'left' | 'corner' | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragOpacity, setDragOpacity] = useState(1)
  const stateRef = useRef({
    startX: 0,
    startY: 0,
    startWindowX: 0,
    startWindowY: 0,
    startWidth: 0,
    startHeight: 0,
  })

  const app = apps.find((a) => a.id === win.appId)

  const [isMinimizing, setIsMinimizing] = useState(false)
  const [isOpening, setIsOpening] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsOpening(false), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (dragging) {
      setDragOpacity(0.85)
      document.body.style.setProperty('cursor', 'grabbing', 'important')
      document.body.style.userSelect = 'none'
    } else if (!resizing) {
      setDragOpacity(1)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    return () => {
      if (!resizing) {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [dragging, resizing])

  useEffect(() => {
    if (resizing) {
      document.body.style.userSelect = 'none'
      const cursorMap: Record<string, string> = {
        corner: 'nwse-resize',
        bottom: 'ns-resize',
        right: 'ew-resize',
        left: 'ew-resize',
      }
      document.body.style.setProperty('cursor', cursorMap[resizing] || 'default', 'important')
    } else if (!dragging) {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    return () => {
      if (!dragging) {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizing, dragging])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      closeWindow(win.id)
    }, 250)
  }, [win.id, closeWindow])

  const handleMinimize = useCallback(() => {
    setIsMinimizing(true)
    setTimeout(() => {
      minimizeWindow(win.id)
      setIsMinimizing(false)
    }, 250)
  }, [win.id, minimizeWindow])

  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    if (!win.focused) return
    
    const isMod = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    
    if (isMod && e.key === 'w') {
      e.preventDefault()
      handleClose()
      return
    }
    
    if (isMod && e.key === 'm' && !isShift) {
      e.preventDefault()
      handleMinimize()
      return
    }
    
    if (isMod && isShift && e.key.toLowerCase() === 'm') {
      e.preventDefault()
      maximizeWindow(win.id)
      return
    }
    
    if (e.key === 'Escape' && win.maximized) {
      e.preventDefault()
      maximizeWindow(win.id)
    }
  }, [win.focused, win.id, win.maximized, handleClose, handleMinimize, maximizeWindow])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [handleKeyboardShortcuts])

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (win.maximized) return
      focusWindow(win.id)
      setDragging(true)
      stateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWindowX: win.x,
        startWindowY: win.y,
        startWidth: win.width,
        startHeight: win.height,
      }
      e.stopPropagation()
      e.preventDefault()
    },
    [win.id, win.x, win.y, win.width, win.height, win.maximized, focusWindow],
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: 'bottom' | 'right' | 'left' | 'corner') => {
      if (win.maximized) return
      e.stopPropagation()
      e.preventDefault()
      setResizing(direction)
      stateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWindowX: win.x,
        startWindowY: win.y,
        startWidth: win.width,
        startHeight: win.height,
      }
    },
    [win.x, win.y, win.width, win.height, win.maximized],
  )

  useEffect(() => {
    if (!dragging && !resizing) return

    let rafId: number | null = null
    let lastUpdateTime = 0

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastUpdateTime < 16) return
      lastUpdateTime = now

      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        const ref = stateRef.current
        if (dragging) {
          const dx = e.clientX - ref.startX
          const dy = e.clientY - ref.startY
          const newX = Math.max(-ref.startWidth + 100, ref.startWindowX + dx)
          const newY = Math.max(0, Math.min(ref.startWindowY + dy, window.innerHeight - 40))
          updateWindowPosition(win.id, newX, newY)
        }
        if (resizing) {
          const dx = e.clientX - ref.startX
          const dy = e.clientY - ref.startY
          let newWidth = ref.startWidth
          let newHeight = ref.startHeight
          let newX = ref.startWindowX
          const newY = ref.startWindowY
          const maxW = win.maxWidth || Math.max(win.minWidth, window.innerWidth - ref.startWindowX - 8)
          const maxH = win.maxHeight || Math.max(win.minHeight, window.innerHeight - 40 - ref.startWindowY - 8)

          if (resizing === 'right' || resizing === 'corner') {
            newWidth = Math.max(win.minWidth, Math.min(ref.startWidth + dx, maxW))
          }
          if (resizing === 'left') {
            const rawWidth = ref.startWidth - dx
            newWidth = Math.max(win.minWidth, Math.min(rawWidth, ref.startWindowX + ref.startWidth - 8))
            if (newWidth === win.minWidth && dx > 0) {
              newX = ref.startWindowX + ref.startWidth - win.minWidth
            } else {
              newX = ref.startWindowX + (ref.startWidth - newWidth)
            }
            newX = Math.max(8, newX)
          }
          if (resizing === 'bottom' || resizing === 'corner') {
            newHeight = Math.max(win.minHeight, Math.min(ref.startHeight + dy, maxH))
          }

          updateWindowPosition(win.id, newX, newY)
          updateWindowSize(win.id, newWidth, newHeight)
        }
      })
    }

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      setDragging(false)
      setResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, resizing, win.id, win.minWidth, win.minHeight, win.maxWidth, win.maxHeight, updateWindowPosition, updateWindowSize])

  const handleWindowClick = useCallback(() => {
    focusWindow(win.id)
  }, [win.id, focusWindow])

  const handleDoubleClickTitlebar = useCallback(() => {
    maximizeWindow(win.id)
  }, [win.id, maximizeWindow])

  const windowStyle = useMemo((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      left: win.maximized ? 0 : win.x,
      top: win.maximized ? 0 : win.y,
      width: win.maximized ? '100%' : win.width,
      height: win.maximized ? '100%' : win.height,
      zIndex: win.zIndex,
      display: win.minimized ? 'none' : 'flex',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: win.focused ? '1px solid rgba(139, 124, 240, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
      transform: 'translateZ(0)',
      willChange: dragging || resizing ? 'transform, opacity' : 'auto',
      contain: 'strict',
      backfaceVisibility: 'hidden',
      perspective: '1000px',
      opacity: dragOpacity,
      transition: dragging || resizing ? 'opacity 0.15s ease' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }

    if (win.focused && !win.maximized) {
      baseStyle.boxShadow = isHovered
        ? '0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 124, 240, 0.5), 0 16px 60px rgba(139, 124, 240, 0.3)'
        : '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 124, 240, 0.4), 0 12px 40px rgba(139, 124, 240, 0.25)'
    } else if (!win.maximized) {
      baseStyle.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    }

    return baseStyle
  }, [win, isHovered, dragging, resizing, dragOpacity])

  return (
    <div
      className={`window ${win.focused ? 'focused' : ''} ${win.maximized ? 'maximized' : ''} ${isClosing ? 'closing' : ''} ${isMinimizing ? 'minimizing' : ''} ${isOpening ? 'opening' : ''}`}
      style={windowStyle}
      onMouseDown={handleWindowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="dialog"
      aria-label={win.title}
      aria-modal="false"
      aria-describedby={`${win.id}-content`}
    >
      <div className="window-titlebar">
        <div className="window-titlebar-drag" onMouseDown={handleDragStart} onDoubleClick={handleDoubleClickTitlebar} role="toolbar" aria-label="窗口标题栏">
          <span className="window-titlebar-icon" aria-hidden="true">{app?.icon}</span>
          <span className="window-titlebar-title">{win.title}</span>
        </div>
        <div className="window-titlebar-buttons" role="toolbar" aria-label="窗口控制">
          <button
            className="window-titlebar-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMinimize}
            aria-label="最小化 (Ctrl+M)"
            title="最小化 (Ctrl+M)"
          >
            &#x2014;
          </button>
          <button
            className="window-titlebar-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => maximizeWindow(win.id)}
            aria-label={win.maximized ? '还原' : '最大化 (Ctrl+Shift+M)'}
            title={win.maximized ? '还原' : '最大化 (Ctrl+Shift+M)'}
          >
            {win.maximized ? '❐' : '□'}
          </button>
          <button
            className="window-titlebar-button close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            aria-label="关闭 (Ctrl+W)"
            title="关闭 (Ctrl+W)"
          >
            &#x2715;
          </button>
        </div>
      </div>
      <div className="window-content" id={`${win.id}-content`} tabIndex={-1} aria-label={`${win.title} 窗口内容`}>{children}</div>
      {!win.maximized && win.resizable && (
        <>
          <div
            className="window-resize-edge-bottom"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="window-resize-edge-right"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          <div
            className="window-resize-edge-left"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="window-resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'corner')}
          />
        </>
      )}
    </div>
  )
})

export default Window