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
  const setWindowSnapshot = useStore((s) => s.setWindowSnapshot)
  const removeWindowSnapshot = useStore((s) => s.removeWindowSnapshot)
  
  const contentRef = useRef<HTMLDivElement>(null)

  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState<'bottom' | 'right' | 'left' | 'corner' | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragOpacity, setDragOpacity] = useState(1)
  const [snapHint, setSnapHint] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] })
  
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
  const resizeRafRef = useRef<number | null>(null)
  const dragRafRef = useRef<number | null>(null)

  const app = apps.find((a) => a.id === win.appId)

  const [isMinimizing, setIsMinimizing] = useState(false)
  const [isOpening, setIsOpening] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsOpening(false), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isOpening) return
    
    const captureSnapshot = () => {
      const content = contentRef.current
      if (!content) return
      
      const canvas = document.createElement('canvas')
      const previewWidth = 280
      const previewHeight = 160
      canvas.width = previewWidth
      canvas.height = previewHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, previewWidth, previewHeight)
      
      ctx.fillStyle = '#16213e'
      ctx.fillRect(0, 0, previewWidth, 28)
      
      ctx.fillStyle = '#e94560'
      ctx.beginPath()
      ctx.arc(8, 14, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f39c12'
      ctx.beginPath()
      ctx.arc(20, 14, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#27ae60'
      ctx.beginPath()
      ctx.arc(32, 14, 5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(win.title, 42, 14)
      
      const textContent = content.innerText || ''
      const lines = textContent.split('\n').filter(line => line.trim()).slice(0, 8)
      
      ctx.fillStyle = '#4a5568'
      ctx.font = '10px monospace'
      
      lines.forEach((line, i) => {
        const y = 40 + i * 14
        if (y < previewHeight) {
          ctx.fillText(line.substring(0, 50), 8, y)
        }
      })
      
      if (lines.length === 0) {
        ctx.fillStyle = '#718096'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('点击查看窗口内容', previewWidth / 2, previewHeight / 2)
      }
      
      setWindowSnapshot(win.id, canvas.toDataURL('image/png'))
    }
    
    let debounceTimer: ReturnType<typeof setTimeout>
    const handleBlur = () => {
      debounceTimer = setTimeout(captureSnapshot, 100)
    }
    
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('blur', handleBlur)
      clearTimeout(debounceTimer)
    }
  }, [win.id, win.title, isOpening, setWindowSnapshot])

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
    removeWindowSnapshot(win.id)
    setTimeout(() => {
      closeWindow(win.id)
    }, 250)
  }, [win.id, closeWindow, removeWindowSnapshot])

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
        const newW = Math.min(win.width, window.innerWidth - 80)
        const newH = Math.min(win.height, window.innerHeight - 80)
        const newX = Math.max(8, Math.min(window.innerWidth - newW - 8, e.clientX - newW / 2))
        const newY = Math.max(8, Math.min(window.innerHeight - newH - 48, e.clientY - 20))
        updateWindowPosition(win.id, newX, newY)
        updateWindowSize(win.id, newW, newH)
        maximizeWindow(win.id)
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
    const quarterWidth = screenW / 4
    const threeQuartersWidth = (screenW * 3) / 4

    if (mouseX < EDGE_THRESHOLD) {
      if (mouseY < EDGE_THRESHOLD) {
        return { x: 0, y: 0, width: halfWidth, height: halfHeight, snap: '左上四分之一' }
      } else if (mouseY > screenH - EDGE_THRESHOLD) {
        return { x: 0, y: halfHeight, width: halfWidth, height: halfHeight, snap: '左下四分之一' }
      } else if (Math.abs(mouseY - halfHeight) < SNAP_THRESHOLD) {
        return { x: 0, y: 0, width: halfWidth, height: screenH, snap: '左侧半屏' }
      }
      return null
    }

    if (mouseX > screenW - EDGE_THRESHOLD) {
      if (mouseY < EDGE_THRESHOLD) {
        return { x: halfWidth, y: 0, width: halfWidth, height: halfHeight, snap: '右上四分之一' }
      } else if (mouseY > screenH - EDGE_THRESHOLD) {
        return { x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight, snap: '右下四分之一' }
      } else if (Math.abs(mouseY - halfHeight) < SNAP_THRESHOLD) {
        return { x: halfWidth, y: 0, width: halfWidth, height: screenH, snap: '右侧半屏' }
      }
      return null
    }

    if (Math.abs(mouseX - halfWidth) < SNAP_THRESHOLD) {
      if (mouseY < EDGE_THRESHOLD) {
        return { x: 0, y: 0, width: screenW, height: halfHeight, snap: '顶部半屏' }
      } else if (mouseY > screenH - EDGE_THRESHOLD) {
        return { x: 0, y: halfHeight, width: screenW, height: halfHeight, snap: '底部半屏' }
      }
      return null
    }

    if (Math.abs(mouseX - thirdWidth) < SNAP_THRESHOLD) {
      return { x: 0, y: 0, width: thirdWidth, height: screenH, snap: '左三分之一' }
    }

    if (Math.abs(mouseX - twoThirdsWidth) < SNAP_THRESHOLD) {
      return { x: twoThirdsWidth, y: 0, width: thirdWidth, height: screenH, snap: '右三分之一' }
    }

    if (Math.abs(mouseX - quarterWidth) < SNAP_THRESHOLD) {
      return { x: 0, y: 0, width: quarterWidth, height: screenH, snap: '左四分之一' }
    }

    if (Math.abs(mouseX - threeQuartersWidth) < SNAP_THRESHOLD) {
      return { x: threeQuartersWidth, y: 0, width: quarterWidth, height: screenH, snap: '右四分之一' }
    }

    return null
  }, [])

  useEffect(() => {
    if (!dragging && !resizing) return

    let lastUpdateTime = 0
    let snapLayout: ReturnType<typeof handleSnapLayout> | null = null

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastUpdateTime < 16) return
      lastUpdateTime = now

      const ref = stateRef.current
      
      if (dragging) {
        snapLayout = handleSnapLayout(e)
        
        if (snapLayout) {
          setSnapHint(snapLayout.snap)
          setAlignmentGuides({ vertical: [], horizontal: [] })
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
        const ALIGN_THRESHOLD = 8
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

        const allWindows = useStore.getState().windows
        const otherWindows = allWindows.filter(w => w.id !== win.id && !w.minimized)
        const verticalGuides: number[] = []
        const horizontalGuides: number[] = []

        const currentCenterX = newX + w / 2
        const currentCenterY = newY + h / 2

        for (const other of otherWindows) {
          const otherCenterX = other.x + other.width / 2
          const otherCenterY = other.y + other.height / 2

          if (Math.abs(currentCenterX - otherCenterX) < ALIGN_THRESHOLD) {
            newX = other.x + other.width / 2 - w / 2
            if (!verticalGuides.includes(otherCenterX)) {
              verticalGuides.push(otherCenterX)
            }
          }

          if (Math.abs(currentCenterY - otherCenterY) < ALIGN_THRESHOLD) {
            newY = other.y + other.height / 2 - h / 2
            if (!horizontalGuides.includes(otherCenterY)) {
              horizontalGuides.push(otherCenterY)
            }
          }

          if (Math.abs(newX - other.x) < ALIGN_THRESHOLD) {
            newX = other.x
            if (!verticalGuides.includes(other.x)) {
              verticalGuides.push(other.x)
            }
          }

          if (Math.abs(newX + w - (other.x + other.width)) < ALIGN_THRESHOLD) {
            newX = other.x + other.width - w
            if (!verticalGuides.includes(other.x + other.width)) {
              verticalGuides.push(other.x + other.width)
            }
          }

          if (Math.abs(newY - other.y) < ALIGN_THRESHOLD) {
            newY = other.y
            if (!horizontalGuides.includes(other.y)) {
              horizontalGuides.push(other.y)
            }
          }

          if (Math.abs(newY + h - (other.y + other.height)) < ALIGN_THRESHOLD) {
            newY = other.y + other.height - h
            if (!horizontalGuides.includes(other.y + other.height)) {
              horizontalGuides.push(other.y + other.height)
            }
          }
        }

        setAlignmentGuides({ vertical: verticalGuides, horizontal: horizontalGuides })

        newX = Math.max(-w + 80, Math.min(newX, screenW - 8))
        newY = Math.max(0, Math.min(newY, screenH - 48))

        setSnapHint(newSnap)
        
        if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = requestAnimationFrame(() => {
          updateWindowPosition(win.id, newX, newY)
        })
      }
      
      if (dragging && snapLayout) {
        const ghostStyle: React.CSSProperties = {
          position: 'fixed',
          left: snapLayout.x,
          top: snapLayout.y,
          width: snapLayout.width,
          height: snapLayout.height,
          border: '2px dashed rgba(139, 124, 240, 0.6)',
          borderRadius: 8,
          backgroundColor: 'rgba(139, 124, 240, 0.1)',
          pointerEvents: 'none',
          zIndex: 999999,
          boxShadow: '0 0 30px rgba(139, 124, 240, 0.3)',
          transition: 'all 0.15s ease',
        }
        
        const ghostDiv = document.getElementById('window-snap-ghost')
        if (ghostDiv) {
          Object.assign(ghostDiv.style, ghostStyle)
        } else {
          const newGhost = document.createElement('div')
          newGhost.id = 'window-snap-ghost'
          Object.assign(newGhost.style, ghostStyle)
          document.body.appendChild(newGhost)
        }
      } else {
        const ghostDiv = document.getElementById('window-snap-ghost')
        if (ghostDiv) ghostDiv.remove()
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
        const minW = win.minWidth || 320
        const minH = win.minHeight || 240

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

        if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = requestAnimationFrame(() => {
          updateWindowPosition(win.id, newX, newY)
          updateWindowSize(win.id, newWidth, newHeight)
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = null
      }

      const ghostDiv = document.getElementById('window-snap-ghost')
      if (ghostDiv) ghostDiv.remove()

      if (dragging && snapLayout) {
        updateWindowPosition(win.id, snapLayout.x, snapLayout.y)
        updateWindowSize(win.id, snapLayout.width, snapLayout.height)
      } else if (dragging && e.clientY < 8 && !win.maximized) {
        maximizeWindow(win.id)
      }
      
      setDragging(false)
      setResizing(null)
      setSnapHint(null)
      setAlignmentGuides({ vertical: [], horizontal: [] })
      snapLayout = null
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
    return () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current)
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current)
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

  // 使用useMemo优化窗口样式计算，减少重新渲染
  const windowStyle = useMemo((): React.CSSProperties => {
    const isActive = win.focused && !win.maximized
    const isDraggingOrResizing = dragging || resizing
    
    return {
      left: win.maximized ? 0 : win.x,
      top: win.maximized ? 0 : win.y,
      width: win.maximized ? '100%' : win.width,
      height: win.maximized ? '100%' : win.height,
      zIndex: win.zIndex,
      display: win.minimized ? 'none' : 'flex',
      backdropFilter: 'blur(24px) saturate(180%)',
      border: win.focused ? '1px solid rgba(139, 124, 240, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: win.maximized ? '0' : '12px',
      transform: 'translateZ(0)',
      willChange: isDraggingOrResizing ? 'transform, opacity' : 'auto',
      contain: 'strict',
      backfaceVisibility: 'hidden',
      perspective: '1000px',
      opacity: dragOpacity,
      transition: isDraggingOrResizing 
        ? 'opacity 0.15s ease' 
        : win.maximized 
          ? 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
          : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isActive
        ? (isHovered 
            ? '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(139, 124, 240, 0.6), 0 24px 80px rgba(139, 124, 240, 0.35)'
            : '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 124, 240, 0.5), 0 16px 50px rgba(139, 124, 240, 0.3)')
        : (!win.maximized 
            ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
            : 'none'),
      background: win.focused 
        ? 'linear-gradient(135deg, rgba(30, 30, 45, 0.92) 0%, rgba(25, 25, 38, 0.95) 100%)' 
        : 'linear-gradient(135deg, rgba(35, 35, 50, 0.88) 0%, rgba(30, 30, 42, 0.92) 100%)'
    }
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
          <button
            className="window-titlebar-button menu"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu((v) => !v)
            }}
            aria-label="窗口菜单"
            title="窗口菜单"
          >
            ☰
          </button>
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
      <div ref={contentRef} className="window-content" id={`${win.id}-content`} tabIndex={-1} aria-label={`${win.title} 窗口内容`}>{children}</div>
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
      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: win.zIndex + 1,
            }}
          />
          <div
            className="window-menu"
            style={{
              position: 'absolute',
              top: 32,
              left: 8,
              background: 'var(--window-bg, #1a1a1a)',
              border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
              borderRadius: 8,
              padding: 4,
              zIndex: win.zIndex + 2,
              minWidth: 140,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              fontSize: 12,
              color: 'var(--text-primary, #fff)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                handleMinimize()
                setShowMenu(false)
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                textAlign: 'left',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--window-border, rgba(255,255,255,0.08))'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <span>—</span>
              <span>最小化</span>
              <span style={{ marginLeft: 'auto', opacity: 0.5 }}>Ctrl+M</span>
            </button>
            <button
              onClick={() => {
                maximizeWindow(win.id)
                setShowMenu(false)
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                textAlign: 'left',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--window-border, rgba(255,255,255,0.08))'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <span>{win.maximized ? '❐' : '□'}</span>
              <span>{win.maximized ? '还原' : '最大化'}</span>
              <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                {win.maximized ? 'Esc' : 'Ctrl+Shift+M'}
              </span>
            </button>
            <div
              style={{
                height: 1,
                background: 'var(--window-border, rgba(255,255,255,0.1))',
                margin: '4px 8px',
              }}
            />
            <button
              onClick={() => {
                handleClose()
                setShowMenu(false)
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                color: '#ff6b6b',
                textAlign: 'left',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.1)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <span>✕</span>
              <span>关闭</span>
              <span style={{ marginLeft: 'auto', opacity: 0.5 }}>Ctrl+W</span>
            </button>
          </div>
        </>
      )}
      {snapHint && (
        <div
          className="window-snap-hint"
          aria-hidden="true"
          data-snap={snapHint}
        />
      )}
      {(alignmentGuides.vertical.length > 0 || alignmentGuides.horizontal.length > 0) && (
        <div className="alignment-guides-container" aria-hidden="true">
          {alignmentGuides.vertical.map((x, i) => (
            <div
              key={`v-${i}`}
              className="alignment-guide vertical"
              style={{ left: x }}
            />
          ))}
          {alignmentGuides.horizontal.map((y, i) => (
            <div
              key={`h-${i}`}
              className="alignment-guide horizontal"
              style={{ top: y }}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default Window