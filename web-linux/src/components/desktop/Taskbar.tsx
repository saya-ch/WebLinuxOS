import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../../store'
import { TerminalIcon, SearchIcon, WifiIcon, Volume2, VolumeX, BatteryIcon, BellIcon, SettingsIcon, PinIcon, BluetoothIcon, GlobeIcon, SunIcon, WifiOffIcon, PowerIcon, MinusIcon, SquareIcon, XIcon, RefreshCwIcon, MoonIcon } from '../../icons'

interface WindowContextMenuProps {
  winId: string
  x: number
  y: number
  onClose: () => void
}

const WindowContextMenu = memo(function WindowContextMenu({
  winId,
  x,
  y,
  onClose,
}: WindowContextMenuProps) {
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const restoreWindow = useStore((s) => s.restoreWindow)
  const win = useStore((s) => s.windows.find((w) => w.id === winId))

  useEffect(() => {
    const handleClickOutside = () => onClose()
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    background: 'var(--context-menu-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: '8px',
    padding: '4px',
    zIndex: 99999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    minWidth: '160px',
    backdropFilter: 'blur(10px)',
  }

  const itemStyle: React.CSSProperties = {
    padding: '7px 12px',
    fontSize: '12px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.15s',
  }

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) =>
      (e.currentTarget.style.background = 'var(--context-menu-hover)'),
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) =>
      (e.currentTarget.style.background = 'transparent'),
  }

  return (
    <div style={style} onClick={(e) => e.stopPropagation()}>
      <div
        style={itemStyle}
        {...hoverHandlers}
        onClick={() => {
          restoreWindow(winId)
          onClose()
        }}
      >
        <span><RefreshCwIcon size={14} /></span>
        <span>还原</span>
      </div>
      <div
        style={itemStyle}
        {...hoverHandlers}
        onClick={() => {
          minimizeWindow(winId)
          onClose()
        }}
      >
        <span><MinusIcon size={14} /></span>
        <span>最小化</span>
      </div>
      <div
        style={itemStyle}
        {...hoverHandlers}
        onClick={() => {
          if (win) maximizeWindow(winId)
          onClose()
        }}
      >
        <span><SquareIcon size={14} /></span>
        <span>{win?.maximized ? '还原' : '最大化'}</span>
      </div>
      <div
        style={{ ...itemStyle, color: '#ff6b6b' }}
        {...hoverHandlers}
        onClick={() => {
          closeWindow(winId)
          onClose()
        }}
      >
        <span><XIcon size={14} /></span>
        <span>关闭</span>
      </div>
    </div>
  )
})

interface TaskbarContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

const TaskbarContextMenu = memo(function TaskbarContextMenu({
  x,
  y,
  onClose,
}: TaskbarContextMenuProps) {
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const handleClickOutside = () => onClose()
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    background: 'var(--context-menu-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: '8px',
    padding: '4px',
    zIndex: 99999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    minWidth: '200px',
    backdropFilter: 'blur(10px)',
  }

  const itemStyle: React.CSSProperties = {
    padding: '7px 12px',
    fontSize: '12px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.15s',
  }

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) =>
      (e.currentTarget.style.background = 'var(--context-menu-hover)'),
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) =>
      (e.currentTarget.style.background = 'transparent'),
  }

  return (
    <div style={style} onClick={(e) => e.stopPropagation()}>
      <div style={itemStyle} {...hoverHandlers} onClick={() => setShowSettings(!showSettings)}>
        <span><SettingsIcon size={14} /></span>
        <span>任务栏设置</span>
      </div>
      {showSettings && (
        <div style={{ padding: '6px 12px', borderTop: '1px solid var(--window-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            （仅 UI 展示）
          </div>
          <div
            style={{ ...itemStyle, fontSize: '11px' }}
            {...hoverHandlers}
            onClick={(e) => e.stopPropagation()}
          >
            <span><PinIcon size={12} /></span>
            <span>位置：底部</span>
          </div>
          <div
            style={{ ...itemStyle, fontSize: '11px' }}
            {...hoverHandlers}
            onClick={(e) => e.stopPropagation()}
          >
            <span><PinIcon size={12} /></span>
            <span>显示已固定应用</span>
          </div>
          <div
            style={{ ...itemStyle, fontSize: '11px' }}
            {...hoverHandlers}
            onClick={(e) => e.stopPropagation()}
          >
            <span><BellIcon size={12} /></span>
            <span>显示通知</span>
          </div>
        </div>
      )}
    </div>
  )
})

interface NotificationCenterProps {
  onClose: () => void
}

const NotificationCenter = memo(function NotificationCenter({ onClose }: NotificationCenterProps) {
  const notifications = useStore((s) => s.notifications)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.notification-center-panel')) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  return (
    <div
      className="notification-center-panel"
      style={{
        position: 'fixed',
        bottom: '58px',
        right: '10px',
        width: '340px',
        maxHeight: '500px',
        background: 'var(--taskbar-bg)',
        border: '1px solid var(--taskbar-border)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 99998,
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--window-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BellIcon size={14} /> 通知中心</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>
          {notifications.length} 条
        </span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '30px 12px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            暂无通知
          </div>
        ) : (
          notifications.slice().reverse().map((n) => (
            <div
              key={n.id}
              style={{
                padding: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {n.title}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                {n.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

const Taskbar = memo(function Taskbar() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const pinnedApps = useStore((s) => s.pinnedApps)
  const notificationCenterOpen = useStore((s) => s.notificationCenterOpen)
  const notifications = useStore((s) => s.notifications)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const totalDesktops = useStore((s) => s.totalDesktops)
  const windowsPerDesktop = useStore((s) => s.windowsPerDesktop)

  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const restoreWindow = useStore((s) => s.restoreWindow)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const launcherOpen = useStore((s) => s.launcherOpen)
  const openApp = useStore((s) => s.openApp)
  const focusWindow = useStore((s) => s.focusWindow)
  const switchDesktop = useStore((s) => s.switchDesktop)
  const addDesktop = useStore((s) => s.addDesktop)
  const removeDesktop = useStore((s) => s.removeDesktop)
  const setTheme = useStore((s) => s.setTheme)
  const toggleNotificationCenter = useStore((s) => s.toggleNotificationCenter)

  const [time, setTime] = useState(new Date())
  const [volume, setVolume] = useState(80)
  const [brightness, setBrightness] = useState(80)
  const [battery, setBattery] = useState(94)
  const [isCharging, setIsCharging] = useState(false)
  const [showQuickSettings, setShowQuickSettings] = useState(false)
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [windowContextMenu, setWindowContextMenu] = useState<{
    visible: boolean
    winId: string
    x: number
    y: number
  }>({ visible: false, winId: '', x: 0, y: 0 })
  const [taskbarContextMenu, setTaskbarContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
  }>({ visible: false, x: 0, y: 0 })
  const [hoveredWinId, setHoveredWinId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`
  }, [brightness])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      if (showQuickSettings) setShowQuickSettings(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showQuickSettings])

  useEffect(() => {
    const batteryTimer = setInterval(() => {
      setBattery((prev) => {
        const newBattery = Math.max(10, Math.min(100, prev + (isCharging ? 1 : -0.5)))
        if (newBattery <= 20) setIsCharging(true)
        if (newBattery >= 95) setIsCharging(false)
        return newBattery
      })
    }, 60000)
    return () => clearInterval(batteryTimer)
  }, [isCharging])

  const handleTaskbarButtonClick = useCallback(
    (winId: string, focused: boolean, minimized: boolean) => {
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
    const secs = d.getSeconds().toString().padStart(2, '0')
    return `${hours}:${mins}:${secs}`
  }

  const formatTimeShort = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${hours}:${mins}`
  }

  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return `${year}/${month}/${day} ${weekday}`
  }

  const getBatteryIcon = () => {
    if (isCharging) return <PowerIcon size={14} />
    if (battery <= 10) return <BatteryIcon size={14} />
    if (battery <= 30) return <BatteryIcon size={14} />
    return <BatteryIcon size={14} />
  }

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={14} />
    if (volume < 50) return <Volume2 size={14} />
    return <Volume2 size={14} />
  }

  const handleDesktopSwitch = useCallback(
    (num: number) => {
      switchDesktop(num)
    },
    [switchDesktop],
  )

  const desktopNumbers = Array.from({ length: totalDesktops }, (_, i) => i + 1)

  const currentDesktopWindows = windowsPerDesktop[currentDesktop] || []
  const currentOpenWindows = windows.filter((w) => currentDesktopWindows.includes(w.id))

  const pinnedAppObjects = pinnedApps
    .map((appId) => apps.find((a) => a.id === appId))
    .filter((a): a is (typeof apps)[number] => Boolean(a))

  const hoveredWin = hoveredWinId ? windows.find((w) => w.id === hoveredWinId) : null

  return (
    <div className="taskbar" onContextMenu={(e) => {
      e.preventDefault()
      setTaskbarContextMenu({ visible: true, x: e.clientX, y: e.clientY })
      setWindowContextMenu({ visible: false, winId: '', x: 0, y: 0 })
    }}>
      <div className="taskbar-left">
        <div
          className={`taskbar-launcher ${launcherOpen ? 'active' : ''}`}
          onClick={toggleLauncher}
          title="启动器 (Ctrl+Shift+L)"
        >
          <TerminalIcon size={18} />
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--window-border)', margin: '0 4px' }} />

        {pinnedAppObjects.map((app) => {
          const openWin = currentOpenWindows.find((w) => w.appId === app.id)
          const isOpen = Boolean(openWin)
          return (
            <button
              key={`pinned-${app.id}`}
              className={`taskbar-button ${openWin?.focused && !openWin?.minimized ? 'active' : ''}`}
              title={app.name}
              onClick={() => {
                if (openWin) {
                  handleTaskbarButtonClick(openWin.id, openWin.focused, openWin.minimized)
                } else {
                  openApp(app.id)
                }
              }}
              onMouseEnter={() => openWin && setHoveredWinId(openWin.id)}
              onMouseLeave={() => setHoveredWinId(null)}
            >
              <span className="taskbar-button-icon">{app.icon}</span>
              {isOpen && <span className="taskbar-button-title">{app.name}</span>}
            </button>
          )
        })}

        <div style={{ width: '1px', height: '24px', background: 'var(--window-border)', margin: '0 4px' }} />

        <div className="taskbar-desktops">
          {desktopNumbers.map((num) => (
            <button
              key={num}
              className={`taskbar-desktop-btn ${currentDesktop === num ? 'active' : ''}`}
              onClick={() => handleDesktopSwitch(num)}
              title={`工作区 ${num} (${windowsPerDesktop[num]?.length || 0} 个窗口)`}
              onContextMenu={(e) => {
                e.preventDefault()
                if (totalDesktops > 1) removeDesktop(num)
              }}
            >
              <span>{num}</span>
              {windowsPerDesktop[num] && windowsPerDesktop[num].length > 0 && (
                <span className="taskbar-desktop-dot" />
              )}
            </button>
          ))}
          <button
            className="taskbar-desktop-add"
            onClick={addDesktop}
            title="添加工作区"
          >
            +
          </button>
        </div>
      </div>

      <div className="taskbar-center">
        {currentOpenWindows
          .filter((win) => !pinnedApps.includes(win.appId))
          .map((win) => {
            const app = apps.find((a) => a.id === win.appId)
            return (
              <button
                key={win.id}
                className={`taskbar-button ${win.focused && !win.minimized ? 'active' : ''} ${win.minimized ? '' : ''}`}
                style={win.minimized ? { opacity: 0.6 } : undefined}
                onClick={() => handleTaskbarButtonClick(win.id, win.focused, win.minimized)}
                title={`${win.title}${win.minimized ? ' (已最小化)' : ''}`}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setWindowContextMenu({
                    visible: true,
                    winId: win.id,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }}
                onMouseEnter={() => setHoveredWinId(win.id)}
                onMouseLeave={() => setHoveredWinId(null)}
              >
                <span className="taskbar-button-icon">{app?.icon}</span>
                <span className="taskbar-button-title">{win.title}</span>
              </button>
            )
          })}
      </div>

      <div className="taskbar-right">
        <div
          className="taskbar-tray-item"
          title="全局搜索 (Ctrl+F)"
          onClick={(e) => {
            e.stopPropagation()
            if (!launcherOpen) toggleLauncher()
          }}
          style={{ cursor: 'pointer' }}
        >
          <SearchIcon size={14} />
        </div>
        <div
          className="taskbar-tray-item"
          title="快速设置"
          onClick={(e) => {
            e.stopPropagation()
            setShowQuickSettings(!showQuickSettings)
          }}
          style={{ cursor: 'pointer' }}
        >
          <PowerIcon size={14} />
        </div>
        <div
          className="taskbar-tray-item"
          title={wifiEnabled ? '网络已连接' : '网络已断开'}
          onClick={() => openApp('network-monitor')}
          style={{ cursor: 'pointer' }}
        >
          {wifiEnabled ? <WifiIcon size={14} /> : <WifiOffIcon size={14} />}
        </div>
        <div
          className="taskbar-tray-item"
          title={`音量: ${volume}%`}
          onClick={() => setVolume((v) => (v === 0 ? 80 : v - 20))}
          style={{ cursor: 'pointer' }}
        >
          {getVolumeIcon()}
        </div>
        <div
          className="taskbar-tray-item"
          title={`电池: ${Math.round(battery)}% ${isCharging ? '(充电中)' : ''}`}
          onClick={() => openApp('power-manager')}
          style={{ cursor: 'pointer' }}
        >
          {getBatteryIcon()}
        </div>
        <div
          className="taskbar-tray-item"
          title={`通知 (${notifications.length})`}
          onClick={(e) => {
            e.stopPropagation()
            toggleNotificationCenter()
          }}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <BellIcon size={14} />
          {notifications.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </div>
        <div
          className="taskbar-clock"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            toggleNotificationCenter()
          }}
        >
          <div style={{ fontSize: 12, lineHeight: 1.2, fontWeight: 500, textAlign: 'right' }}>
            {formatTimeShort(time)}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-secondary)',
              lineHeight: 1.2,
              textAlign: 'right',
              marginTop: '2px',
            }}
          >
            {formatDate(time)}
          </div>
        </div>
      </div>

      {hoveredWin && (
        <div
          style={{
            position: 'fixed',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--window-bg)',
            border: '1px solid var(--window-border)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 10000,
            minWidth: '180px',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ fontSize: '16px' }}>
              {apps.find((a) => a.id === hoveredWin.appId)?.icon}
            </span>
            <span style={{ fontWeight: 500 }}>{hoveredWin.title}</span>
            {hoveredWin.minimized && (
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>(已最小化)</span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {formatTime(time)}
          </div>
        </div>
      )}

      {windowContextMenu.visible && (
        <WindowContextMenu
          winId={windowContextMenu.winId}
          x={windowContextMenu.x}
          y={windowContextMenu.y}
          onClose={() => setWindowContextMenu({ visible: false, winId: '', x: 0, y: 0 })}
        />
      )}

      {taskbarContextMenu.visible && (
        <TaskbarContextMenu
          x={taskbarContextMenu.x}
          y={taskbarContextMenu.y}
          onClose={() => setTaskbarContextMenu({ visible: false, x: 0, y: 0 })}
        />
      )}

      {notificationCenterOpen && <NotificationCenter onClose={toggleNotificationCenter} />}

      {showQuickSettings && (
        <div className="quick-settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="quick-settings-grid">
            <div
              className={`quick-settings-item ${wifiEnabled ? 'active' : ''}`}
              onClick={() => setWifiEnabled(!wifiEnabled)}
              title="Wi-Fi"
            >
              <WifiIcon size={16} />
            </div>
            <div
              className={`quick-settings-item ${bluetoothEnabled ? 'active' : ''}`}
              onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
              title="蓝牙"
            >
              <BluetoothIcon size={16} />
            </div>
            <div
              className={`quick-settings-item ${nightMode ? 'active' : ''}`}
              onClick={() => {
                setNightMode(!nightMode)
                setTheme(nightMode ? 'light' : 'dark')
              }}
              title="夜间模式"
            >
              {nightMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </div>
            <div className="quick-settings-item" onClick={() => openApp('network-monitor')} title="网络设置">
              <GlobeIcon size={16} />
            </div>
            <div className="quick-settings-item" onClick={() => openApp('settings')} title="系统设置">
              <SettingsIcon size={16} />
            </div>
            <div className="quick-settings-item" onClick={() => openApp('power-manager')} title="电源管理">
              <PowerIcon size={16} />
            </div>
          </div>

          <div className="quick-settings-slider">
            <Volume2 size={14} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <span style={{ minWidth: '35px', textAlign: 'right', fontSize: 12 }}>{volume}%</span>
          </div>

          <div className="quick-settings-slider">
            <SunIcon size={14} />
            <input
              type="range"
              min="30"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
            <span style={{ minWidth: '35px', textAlign: 'right', fontSize: 12 }}>{brightness}%</span>
          </div>

          <div className="quick-settings-slider">
            <BatteryIcon size={14} />
            <input
              type="range"
              min="0"
              max="100"
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
            />
            <span style={{ minWidth: '45px', textAlign: 'right', fontSize: 12 }}>
              {Math.round(battery)}%{isCharging ? ' ⚡' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
})

export default Taskbar
