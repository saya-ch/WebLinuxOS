import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../store'
import { WifiIcon, VolumeIcon, BatteryIcon, GridIcon } from '../../icons'

export default function Taskbar() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const launcherOpen = useStore((s) => s.launcherOpen)

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTaskbarButtonClick = useCallback(
    (appId: string, winId: string, focused: boolean, minimized: boolean) => {
      if (focused && !minimized) {
        minimizeWindow(winId)
      } else {
        openApp(appId)
      }
    },
    [minimizeWindow, openApp],
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
          title="启动器"
        >
          <GridIcon />
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
              title={win.title}
            >
              <span className="taskbar-button-icon">{app?.icon}</span>
              <span className="taskbar-button-title">{win.title}</span>
            </button>
          )
        })}
      </div>

      <div className="taskbar-right">
        <div className="taskbar-tray-item" title="网络"><WifiIcon /></div>
        <div className="taskbar-tray-item" title="音量"><VolumeIcon /></div>
        <div className="taskbar-tray-item" title="电源"><BatteryIcon /></div>
        <div className="taskbar-clock">
          <div style={{ fontSize: 12, lineHeight: 1.2 }}>{formatTime(time)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.2 }}>{formatDate(time)}</div>
        </div>
      </div>
    </div>
  )
}