import { useCallback, useRef, useEffect, useState } from 'react'
import { useStore } from '../../store'
import type { WindowState } from '../../types'

interface WindowProps {
  window: WindowState
  children: React.ReactNode
}

export default function Window({ window: win, children }: WindowProps) {
  const focusWindow = useStore((s) => s.focusWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const updateWindowPosition = useStore((s) => s.updateWindowPosition)
  const updateWindowSize = useStore((s) => s.updateWindowSize)
  const apps = useStore((s) => s.apps)

  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState<'bottom' | 'right' | 'left' | 'corner' | null>(null)
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

    const handleMouseMove = (e: MouseEvent) => {
      const ref = stateRef.current
      if (dragging) {
        const dx = e.clientX - ref.startX
        const dy = e.clientY - ref.startY
        updateWindowPosition(win.id, ref.startWindowX + dx, ref.startWindowY + dy)
      }
      if (resizing) {
        const dx = e.clientX - ref.startX
        const dy = e.clientY - ref.startY
        let newWidth = ref.startWidth
        let newHeight = ref.startHeight
        let newX = ref.startWindowX
        const _newY = ref.startWindowY

        if (resizing === 'right' || resizing === 'corner') {
          newWidth = ref.startWidth + dx
        }
        if (resizing === 'left') {
          newWidth = ref.startWidth - dx
          newX = ref.startWindowX + dx
        }
        if (resizing === 'bottom' || resizing === 'corner') {
          newHeight = ref.startHeight + dy
        }

        if (resizing === 'left') {
          updateWindowPosition(win.id, newX, _newY)
        }
        updateWindowSize(win.id, newWidth, newHeight)
      }
    }

    const handleMouseUp = () => {
      setDragging(false)
      setResizing(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, resizing, win.id, updateWindowPosition, updateWindowSize])

  const handleWindowClick = useCallback(() => {
    focusWindow(win.id)
  }, [win.id, focusWindow])

  return (
    <div
      className={`window ${win.focused ? 'focused' : ''} ${win.maximized ? 'maximized' : ''}`}
      style={{
        left: win.maximized ? 0 : win.x,
        top: win.maximized ? 0 : win.y,
        width: win.maximized ? '100%' : win.width,
        height: win.maximized ? 'calc(100% - 40px)' : win.height,
        zIndex: win.zIndex,
        display: win.minimized ? 'none' : 'flex',
      }}
      onMouseDown={handleWindowClick}
    >
      <div className="window-titlebar">
        <div className="window-titlebar-drag" onMouseDown={handleDragStart}>
          <span className="window-titlebar-icon">{app?.icon}</span>
          <span className="window-titlebar-title">{win.title}</span>
        </div>
        <div className="window-titlebar-buttons">
          <button
            className="window-titlebar-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => minimizeWindow(win.id)}
          >
            &#x2014;
          </button>
          <button
            className="window-titlebar-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => maximizeWindow(win.id)}
          >
            {win.maximized ? '❐' : '□'}
          </button>
          <button
            className="window-titlebar-button close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => closeWindow(win.id)}
          >
            &#x2715;
          </button>
        </div>
      </div>
      <div className="window-content">{children}</div>
      {win.resizable && !win.maximized && (
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
}