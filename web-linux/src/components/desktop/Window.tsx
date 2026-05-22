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
  const stateRef = useRef({
    startX: 0,
    startY: 0,
    startWindowX: 0,
    startWindowY: 0,
    startWidth: 0,
    startHeight: 0,
  })

  const app = apps.find((a) => a.id === win.appId)

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
          const newY = Math.max(0, ref.startWindowY + dy)
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
            newWidth = Math.max(win.minWidth, ref.startWidth + dx)
          }
          if (resizing === 'left') {
            newWidth = Math.max(win.minWidth, ref.startWidth - dx)
            if (newWidth === win.minWidth && dx > 0) {
              newX = ref.startWindowX + ref.startWidth - win.minWidth
            } else {
              newX = Math.max(-newWidth + 100, ref.startWindowX + dx)
            }
          }
          if (resizing === 'bottom' || resizing === 'corner') {
            newHeight = Math.max(win.minHeight, ref.startHeight + dy)
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
  }, [dragging, resizing, win.id, win.minWidth, win.minHeight, updateWindowPosition, updateWindowSize])

  const handleWindowClick = useCallback(() => {
    focusWindow(win.id)
  }, [win.id, focusWindow])

  const handleDoubleClickTitlebar = useCallback(() => {
    maximizeWindow(win.id)
  }, [win.id, maximizeWindow])

  const [isMinimizing, setIsMinimizing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      closeWindow(win.id)
    }, 150)
  }, [win.id, closeWindow])

  const handleMinimize = useCallback(() => {
    setIsMinimizing(true)
    setTimeout(() => {
      minimizeWindow(win.id)
      setIsMinimizing(false)
    }, 150)
  }, [win.id, minimizeWindow])

  return (
    <div
      className={`window ${win.focused ? 'focused' : ''} ${win.maximized ? 'maximized' : ''} ${isClosing ? 'closing' : ''} ${isMinimizing ? 'minimizing' : ''}`}
      style={{
        left: win.maximized ? 0 : win.x,
        top: win.maximized ? 0 : win.y,
        width: win.maximized ? '100%' : win.width,
        height: win.maximized ? '100%' : win.height,
        zIndex: win.zIndex,
        display: win.minimized ? 'none' : 'flex',
      }}
      onMouseDown={handleWindowClick}
    >
      <div className="window-titlebar">
        <div className="window-titlebar-drag" onMouseDown={handleDragStart} onDoubleClick={handleDoubleClickTitlebar}>
          <span className="window-titlebar-icon">{app?.icon}</span>
          <span className="window-titlebar-title">{win.title}</span>
        </div>
        <div className="window-titlebar-buttons">
          <button
            className="window-titlebar-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            &#x2014;
          </button>
          <button
            className="window-titlebar-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => maximizeWindow(win.id)}
            aria-label={win.maximized ? 'Restore' : 'Maximize'}
          >
            {win.maximized ? '❐' : '□'}
          </button>
          <button
            className="window-titlebar-button close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>
      </div>
      <div className="window-content">{children}</div>
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