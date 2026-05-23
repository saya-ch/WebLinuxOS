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
  const [volume, setVolume] = useState(80)
  const [battery, setBattery] = useState(94)
  const [isCharging, setIsCharging] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const batteryTimer = setInterval(() => {
      setBattery(prev => {
        const newBattery = Math.max(10, Math.min(100, prev + (isCharging ? 1 : -0.5)))
        if (newBattery <= 20) setIsCharging(true)
        if (newBattery >= 95) setIsCharging(false)
        return newBattery
      })
    }, 60000)
    return () => clearInterval(batteryTimer)
  }, [isCharging])

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
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return `${month}月${day}日 ${weekday}`
  }

  const getBatteryIcon = () => {
    if (isCharging) return '⚡'
    if (battery <= 10) return '🪫'
    if (battery <= 30) return '🔋'
    return '🔋'
  }

  const getVolumeIcon = () => {
    if (volume === 0) return '🔇'
    if (volume < 50) return '🔉'
    return '🔊'
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
        <div className="taskbar-tray-item" title="网络已连接" onClick={() => openApp('network-monitor')} style={{ cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}>📶</div>
        <div className="taskbar-tray-item" title={`音量: ${volume}%`} onClick={() => setVolume(v => v === 0 ? 80 : v - 20)} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>{getVolumeIcon()}</div>
        <div className="taskbar-tray-item" title={`电池: ${Math.round(battery)}% ${isCharging ? '(充电中)' : ''}`} onClick={() => openApp('power-manager')} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>{getBatteryIcon()}</div>
        <div
          className="taskbar-tray-item"
          title="系统通知"
          onClick={() => openApp('settings')}
          style={{ cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}
        >
          🔔
        </div>
        <div className="taskbar-clock" style={{ cursor: 'pointer' }} onClick={() => openApp('calendar')}>
          <div style={{ fontSize: 12, lineHeight: 1.1, fontWeight: 500 }}>{formatTime(time)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.1 }}>{formatDate(time)}</div>
        </div>
      </div>
    </div>
  )
})

export default Taskbar
