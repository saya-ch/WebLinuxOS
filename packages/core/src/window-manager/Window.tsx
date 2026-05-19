import React, { useRef, useState, useEffect } from 'react';
import { TitleBar } from './TitleBar';
import { WindowState, useAppStore } from '../context/store';

interface WindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ windowState, children }) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useAppStore();

  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(windowState.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowState.position.x,
      y: e.clientY - windowState.position.y,
    });
  };

  const handleResizeMouseDown = (direction: typeof isResizing) => (e: React.MouseEvent) => {
    e.stopPropagation();
    focusWindow(windowState.id);
    setIsResizing(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: windowState.size.width,
      height: windowState.size.height,
      left: windowState.position.x,
      top: windowState.position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = Math.max(0, e.clientY - dragOffset.y);
        updateWindowPosition(windowState.id, newX, newY);
      }

      if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newLeft = resizeStart.left;
        let newTop = resizeStart.top;

        if (isResizing.includes('e')) {
          newWidth = Math.max(300, resizeStart.width + dx);
        }
        if (isResizing.includes('w')) {
          newWidth = Math.max(300, resizeStart.width - dx);
          newLeft = resizeStart.left + (resizeStart.width - newWidth);
        }
        if (isResizing.includes('s')) {
          newHeight = Math.max(200, resizeStart.height + dy);
        }
        if (isResizing.includes('n')) {
          newHeight = Math.max(200, resizeStart.height - dy);
          newTop = Math.max(0, resizeStart.top + (resizeStart.height - newHeight));
        }

        updateWindowSize(windowState.id, newWidth, newHeight);
        if (isResizing.includes('w') || isResizing.includes('n')) {
          updateWindowPosition(windowState.id, newLeft, newTop);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, windowState.id, updateWindowPosition, updateWindowSize, focusWindow]);

  if (windowState.minimized) return null;

  const isActive = useAppStore((state) => state.activeWindowId === windowState.id);

  return (
    <div
      ref={windowRef}
      style={{
        left: windowState.maximized ? 0 : windowState.position.x,
        top: windowState.maximized ? 48 : windowState.position.y,
        width: windowState.maximized ? '100%' : windowState.size.width,
        height: windowState.maximized ? 'calc(100% - 96px)' : windowState.size.height,
        zIndex: windowState.zIndex,
      }}
      className={`absolute flex flex-col bg-[#1e1e1e] border rounded shadow-lg overflow-hidden transition-shadow ${isActive ? 'border-[#007acc] shadow-xl' : 'border-[#3c3c3c]'}`}
      onMouseDown={() => focusWindow(windowState.id)}
    >
      <div onMouseDown={handleMouseDown} className="cursor-default">
        <TitleBar
          title={windowState.title}
          icon={windowState.icon}
          onMinimize={() => minimizeWindow(windowState.id)}
          onMaximize={() => maximizeWindow(windowState.id)}
          onClose={() => closeWindow(windowState.id)}
          maximized={windowState.maximized}
        />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
      {!windowState.maximized && (
        <>
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={handleResizeMouseDown('se')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={handleResizeMouseDown('sw')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={handleResizeMouseDown('ne')} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={handleResizeMouseDown('nw')} />
          <div className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize" onMouseDown={handleResizeMouseDown('e')} />
          <div className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize" onMouseDown={handleResizeMouseDown('w')} />
          <div className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize" onMouseDown={handleResizeMouseDown('s')} />
          <div className="absolute top-0 left-3 right-3 h-1 cursor-n-resize" onMouseDown={handleResizeMouseDown('n')} />
        </>
      )}
    </div>
  );
};
