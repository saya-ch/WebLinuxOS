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
  const [snapHint, setSnapHint] = useState<string | null>(null)
  const stateRef = useRef({
    startX: 0,
    startY: 0,
    startWindowX: 0,
    startWindowY: 0,
    startWidth: 0,
    startHeight: 0,
  })
  const dragStartPos = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)

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
      document.body.style.setProperty('cursor', '')
      document.body.style.userSelect = ''
    }
    return () => {
      if (!resizing) {
        document.body.style.setProperty('cursor', '')
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
      document.body.style.setProperty('cursor', '')
      document.body.style.userSelect = ''
    }
    return () => {
      if (!dragging) {
        document.body.style.setProperty('cursor', '')
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
      if (win.maximized) {
        // 从最大化状态拖动时，先还原窗口，并基于鼠标位置智能还原
        const newW = Math.min(win.width, window.innerWidth - 80)
        const newH = Math.min(win.height, window.innerHeight - 80)
        const newX = Math.max(8, Math.min(window.innerWidth - newW - 8, e.clientX - newW / 2))
        const newY = Math.max(8, Math.min(window.innerHeight - newH - 48, e.clientY - 20))
        updateWindowPosition(win.id, newX, newY)
        updateWindowSize(win.id, newW, newH)
        maximizeWindow(win.id) // 切换回非最大化
        stateRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startWindowX: newX,
          startWindowY: newY,
          startWidth: newW,
          startHeight: newH,
        }
      } else {
        focusWindow(win.id)
        stateRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startWindowX: win.x,
          startWindowY: win.y,
          startWidth: win.width,
          startHeight: win.height,
        }
      }
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      hasDragged.current = false
      setDragging(true)
      e.stopPropagation()
      e.preventDefault()
    },
    [win.id, win.x, win.y, win.width, win.height, win.maximized, focusWindow, updateWindowPosition, updateWindowSize, maximizeWindow],
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

  const handleSnapLayout = useCallback((e: MouseEvent) => {
    const screenW = window.innerWidth
    const screenH = window.innerHeight - 40
    const mouseX = e.clientX
    const mouseY = e.clientY

    const SNAP_THRESHOLD = 50
    const EDGE_THRESHOLD = 20

    const halfWidth = screenW / 2
    const halfHeight = screenH / 2
    const thirdWidth = screenW / 3
    const twoThirdsWidth = (screenW * 2) / 3

    // 检查边缘吸附
    if (mouseX < EDGE_THRESHOLD) {
      if (mouseY < EDGE_THRESHOLD) {
        return { x: 0, y: 0, width: halfWidth, height: halfHeight, snap: 'TOP-LEFT' }
      } else if (mouseY > screenH - EDGE_THRESHOLD) {
        return { x: 0, y: halfHeight, width: halfWidth, height: halfHeight, snap: 'BOTTOM-LEFT' }
      } else if (Math.abs(mouseY - halfHeight) < SNAP_THRESHOLD) {
        return { x: 0, y: 0, width: halfWidth, height: screenH, snap: 'LEFT' }
      }
      return null
    }

    if (mouseX > screenW - EDGE_THRESHOLD) {
      if (mouseY < EDGE_THRESHOLD) {
        return { x: halfWidth, y: 0, width: halfWidth, height: halfHeight, snap: 'TOP-RIGHT' }
      } else if (mouseY > screenH - EDGE_THRESHOLD) {
        return { x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight, snap: 'BOTTOM-RIGHT' }
      } else if (Math.abs(mouseY - halfHeight) < SNAP_THRESHOLD) {
        return { x: halfWidth, y: 0, width: halfWidth, height: screenH, snap: 'RIGHT' }
      }
      return null
    }

    if (Math.abs(mouseX - halfWidth) < SNAP_THRESHOLD) {
      if (mouseY < EDGE_THRESHOLD) {
        return { x: 0, y: 0, width: screenW, height: halfHeight, snap: 'TOP' }
      } else if (mouseY > screenH - EDGE_THRESHOLD) {
        return { x: 0, y: halfHeight, width: screenW, height: halfHeight, snap: 'BOTTOM' }
      }
      return null
    }

    if (Math.abs(mouseX - thirdWidth) < SNAP_THRESHOLD) {
      return { x: 0, y: 0, width: thirdWidth, height: screenH, snap: 'LEFT-THIRD' }
    }

    if (Math.abs(mouseX - twoThirdsWidth) < SNAP_THRESHOLD) {
      return { x: twoThirdsWidth, y: 0, width: thirdWidth, height: screenH, snap: 'RIGHT-THIRD' }
    }

    return null
  }, [])

  useEffect(() => {
    if (!dragging && !resizing) return

    let rafId: number | null = null
    let lastUpdateTime = 0
    let snapLayout: ReturnType<typeof handleSnapLayout> | null = null

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastUpdateTime < 16) return
      lastUpdateTime = now

      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const ref = stateRef.current
        
        if (dragging) {
          // 检查分屏吸附布局
          snapLayout = handleSnapLayout(e)
          
          if (snapLayout) {
            setSnapHint(snapLayout.snap)
            return
          }

          const dx = e.clientX - ref.startX
          const dy = e.clientY - ref.startY

          if (!hasDragged.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            hasDragged.current = true
          }

          const screenW = window.innerWidth
          const screenH = window.innerHeight
          let newX = ref.startWindowX + dx
          let newY = ref.startWindowY + dy

          const SNAP_THRESHOLD = 20
          const w = ref.startWidth
          const h = ref.startHeight

          let newSnap: string | null = null

          if (Math.abs(newX) < SNAP_THRESHOLD) { newX = 0; newSnap = 'LEFT' }
          else if (Math.abs(newX + w - screenW) < SNAP_THRESHOLD) { newX = screenW - w; newSnap = 'RIGHT' }

          if (Math.abs(newY) < SNAP_THRESHOLD) { newY = 0; newSnap = newSnap ? newSnap + '+TOP' : 'TOP' }
          else if (Math.abs(newY + h - (screenH - 40)) < SNAP_THRESHOLD) { newY = screenH - h - 40; newSnap = newSnap ? newSnap + '+BOTTOM' : 'BOTTOM' }

          if (dragging && e.clientY < 8) {
            newSnap = 'MAXIMIZE'
          }

          newX = Math.max(-w + 80, Math.min(newX, screenW - 80))
          newY = Math.max(0, Math.min(newY, screenH - 40 - 40))

          setSnapHint(newSnap)
          updateWindowPosition(win.id, newX, newY)
        }
        if (resizing) {
          const dx = e.clientX - ref.startX
          const dy = e.clientY - ref.startY
          let newWidth = ref.startWidth
          let newHeight = ref.startHeight
          let newX = ref.startWindowX
          const newY = ref.startWindowY
          const maxW = window.innerWidth - newX - 8
          const maxH = window.innerHeight - 40 - newY - 8
          const minW = Math.max(win.minWidth || 320, win.minWidth)
          const minH = Math.max(win.minHeight || 240, win.minHeight)

          if (resizing === 'right' || resizing === 'corner') {
            newWidth = Math.max(minW, Math.min(ref.startWidth + dx, maxW))
          }
          if (resizing === 'left') {
            const rawWidth = ref.startWidth - dx
            newWidth = Math.max(minW, Math.min(rawWidth, ref.startWindowX + ref.startWidth - 8))
            if (newWidth === minW && dx > 0) {
              newX = ref.startWindowX + ref.startWidth - minW
            } else {
              newX = ref.startWindowX + (ref.startWidth - newWidth)
            }
            newX = Math.max(8, newX)
          }
          if (resizing === 'bottom' || resizing === 'corner') {
            newHeight = Math.max(minH, Math.min(ref.startHeight + dy, maxH))
          }

          updateWindowPosition(win.id, newX, newY)
          updateWindowSize(win.id, newWidth, newHeight)
        }
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      if (dragging && snapLayout) {
        updateWindowPosition(win.id, snapLayout.x, snapLayout.y)
        updateWindowSize(win.id, snapLayout.width, snapLayout.height)
      } else if (dragging && e.clientY < 8 && !win.maximized) {
        maximizeWindow(win.id)
      }
      
      setDragging(false)
      setResizing(null)
      setSnapHint(null)
      snapLayout = null
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, resizing, win.id, win.minWidth, win.minHeight, win.maximized, updateWindowPosition, updateWindowSize, maximizeWindow, handleSnapLayout])

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
      {snapHint && (
        <div
          className="window-snap-hint"
          aria-hidden="true"
          data-snap={snapHint}
        />
      )}
    </div>
  )
})

export default Window