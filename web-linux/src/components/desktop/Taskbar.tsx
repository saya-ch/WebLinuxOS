import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../../store'

const Taskbar = memo(function Taskbar() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)

  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const restoreWindow = useStore((s) => s.restoreWindow)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const launcherOpen = useStore((s) => s.launcherOpen)
  const openApp = useStore((s) => s.openApp)
  const focusWindow = useStore((s) => s.focusWindow)

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTaskbarButtonClick = useCallback(
    (_appId: string, winId: string, focused: boolean, minimized: boolean) => {
      if (minimized) {
        restoreWindow(winId)
      } else if (focused) {
        minimizeWindow(winId)
      } else {
        focusWindow(winId)
      }
    },
    [minimizeWindow, restoreWindow, focusWindow],
  )

  const formatTime = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${hours}:${mins}`
  }

  const formatDate = (d: Date) => {
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${month}月${day}日`
  }

  return (
    <div className="taskbar">
      <div className="taskbar-left">
        <div
          className={`taskbar-launcher ${launcherOpen ? 'active' : ''}`}
          onClick={toggleLauncher}
          title="启动器 (Ctrl+Shift+L)"
        >
          🐧
        </div>
      </div>

      <div className="taskbar-center">
        {windows.map((win) => {
          const app = apps.find((a) => a.id === win.appId)
          return (
            <button
              key={win.id}
              className={`taskbar-button ${win.focused && !win.minimized ? 'active' : ''}`}
              onClick={() => handleTaskbarButtonClick(win.appId, win.id, win.focused, win.minimized)}
              title={`${win.title}${win.minimized ? ' (已最小化)' : ''}`}
            >
              <span className="taskbar-button-icon">{app?.icon}</span>
              <span className="taskbar-button-title">{win.title}</span>
            </button>
          )
        })}
      </div>

      <div className="taskbar-right">
        <div className="taskbar-tray-item" title="网络已连接" onClick={() => openApp('network-monitor')}>📶</div>
        <div className="taskbar-tray-item" title={`音量: ${80}%`}>🔊</div>
        <div className="taskbar-tray-item" title="电池: 100%" onClick={() => openApp('power-manager')}>🔋</div>
        <div className="taskbar-clock">
          <div style={{ fontSize: 12, lineHeight: 1.2 }}>{formatTime(time)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.2 }}>{formatDate(time)}</div>
        </div>
      </div>
    </div>
  )
})

export default Taskbar