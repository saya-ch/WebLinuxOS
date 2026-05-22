import { useCallback, useRef, useEffect, useState, memo } from 'react'
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

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      closeWindow(win.id)
    }, 200)
  }, [win.id, closeWindow])

  const handleMinimize = useCallback(() => {
    setIsMinimizing(true)
    setTimeout(() => {
      minimizeWindow(win.id)
      setIsMinimizing(false)
    }, 200)
  }, [win.id, minimizeWindow])

  // 添加键盘快捷键支持
  useEffect(() => {
    if (!win.focused) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        handleClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        handleMinimize();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        maximizeWindow(win.id);
      }
      if (e.key === 'Escape' && win.maximized) {
        e.preventDefault();
        maximizeWindow(win.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [win.focused, win.id, win.maximized, handleClose, handleMinimize, maximizeWindow]);

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

    const handleMouseMove = (e: MouseEvent) => {
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

          if (resizing === 'right' || resizing === 'corner') {
            newWidth = Math.max(win.minWidth, Math.min(ref.startWidth + dx, win.maxWidth || window.innerWidth))
          }
          if (resizing === 'left') {
            newWidth = Math.max(win.minWidth, Math.min(ref.startWidth - dx, win.maxWidth || window.innerWidth))
            if (newWidth === win.minWidth && dx > 0) {
              newX = ref.startWindowX + ref.startWidth - win.minWidth
            } else {
              newX = Math.max(-newWidth + 100, ref.startWindowX + dx)
            }
          }
          if (resizing === 'bottom' || resizing === 'corner') {
            newHeight = Math.max(win.minHeight, Math.min(ref.startHeight + dy, (win.maxHeight || window.innerHeight) - 40))
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

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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

  const getWindowStyle = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      left: win.maximized ? 0 : win.x,
      top: win.maximized ? 0 : win.y,
      width: win.maximized ? '100%' : win.width,
      height: win.maximized ? '100%' : win.height,
      zIndex: win.zIndex,
      display: win.minimized ? 'none' : 'flex',
    }

    if (win.focused && !win.maximized) {
      baseStyle.boxShadow = isHovered
        ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--accent), 0 12px 40px rgba(108, 92, 231, 0.25)'
        : '0 4px 28px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--accent), 0 8px 32px rgba(108, 92, 231, 0.2)'
    }

    return baseStyle
  }, [win, isHovered])

  return (
    <div
      className={`window ${win.focused ? 'focused' : ''} ${win.maximized ? 'maximized' : ''} ${isClosing ? 'closing' : ''} ${isMinimizing ? 'minimizing' : ''}`}
      style={getWindowStyle()}
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
      <div className="window-content" id={`${win.id}-content`}>{children}</div>
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