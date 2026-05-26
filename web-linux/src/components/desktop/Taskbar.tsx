import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../../store'

interface DesktopMenuProps {
  winId: string
  onClose: () => void
}

const DesktopMenu = memo(function DesktopMenu({ winId, onClose }: DesktopMenuProps) {
  const moveWindowToDesktop = useStore((s) => s.moveWindowToDesktop)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const totalDesktops = useStore((s) => s.totalDesktops)

  useEffect(() => {
    const handleClickOutside = () => onClose()
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        background: 'var(--context-menu-bg)',
        border: '1px solid var(--window-border)',
        borderRadius: '8px',
        padding: '4px',
        zIndex: 99999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        minWidth: '180px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(30, 30, 50, 0.95)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {Array.from({ length: totalDesktops }, (_, i) => i + 1).map((dnum) => (
        <div
          key={dnum}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={() => {
            moveWindowToDesktop(winId, dnum)
            onClose()
          }}
        >
          <span style={{ width: '20px', textAlign: 'center' }}>{dnum}</span>
          <span>{dnum === currentDesktop ? '当前工作区' : `移动到工作区 ${dnum}`}</span>
        </div>
      ))}
    </div>
  )
})

const Taskbar = memo(function Taskbar() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
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

  const [time, setTime] = useState(new Date())
  const [volume, setVolume] = useState(80)
  const [brightness, setBrightness] = useState(80)
  const [battery, setBattery] = useState(94)
  const [isCharging, setIsCharging] = useState(false)
  const [showQuickSettings, setShowQuickSettings] = useState(false)
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; winId: string }>({
    visible: false,
    winId: '',
  })

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

  const handleDesktopSwitch = useCallback((num: number) => {
    switchDesktop(num)
  }, [switchDesktop])

  const desktopNumbers = Array.from({ length: totalDesktops }, (_, i) => i + 1)

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
                <span className="taskbar-desktop-dot"></span>
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
        {windows
          .filter((win) => (windowsPerDesktop[currentDesktop] || []).includes(win.id))
          .map((win) => {
            const app = apps.find((a) => a.id === win.appId)
            return (
              <button
                key={win.id}
                className={`taskbar-button ${win.focused && !win.minimized ? 'active' : ''}`}
                onClick={() => handleTaskbarButtonClick(win.appId, win.id, win.focused, win.minimized)}
                title={`${win.title}${win.minimized ? ' (已最小化)' : ''}`}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setContextMenu({
                    visible: true,
                    winId: win.id,
                  })
                }}
              >
                <span className="taskbar-button-icon">{app?.icon}</span>
                <span className="taskbar-button-title">{win.title}</span>
              </button>
            )
          })}
      </div>

      <div className="taskbar-right">
        <div className="taskbar-tray-item" title="快速设置" onClick={(e) => { e.stopPropagation(); setShowQuickSettings(!showQuickSettings) }} style={{ cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}>⚡</div>
        <div className="taskbar-tray-item" title="网络已连接" onClick={() => openApp('network-monitor')} style={{ cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}>📶</div>
        <div className="taskbar-tray-item" title={`音量: ${volume}%`} onClick={() => setVolume( v => v === 0 ? 80 : v - 20)} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>{getVolumeIcon()}</div>
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

      {contextMenu.visible && (
        <DesktopMenu
          winId={contextMenu.winId}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        />
      )}

      {showQuickSettings && (
        <div className="quick-settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="quick-settings-grid">
            <div
              className={`quick-settings-item ${wifiEnabled ? 'active' : ''}`}
              onClick={() => setWifiEnabled(!wifiEnabled)}
              title="Wi-Fi"
            >
              📶
            </div>
            <div
              className={`quick-settings-item ${bluetoothEnabled ? 'active' : ''}`}
              onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
              title="蓝牙"
            >
              🔵
            </div>
            <div
              className={`quick-settings-item ${nightMode ? 'active' : ''}`}
              onClick={() => {
                setNightMode(!nightMode)
                setTheme(nightMode ? 'light' : 'dark')
              }}
              title="夜间模式"
            >
              🌙
            </div>
            <div
              className="quick-settings-item"
              onClick={() => openApp('network-monitor')}
              title="网络设置"
            >
              🌐
            </div>
            <div
              className="quick-settings-item"
              onClick={() => openApp('settings')}
              title="系统设置"
            >
              ⚙️
            </div>
            <div
              className="quick-settings-item"
              onClick={() => openApp('power-manager')}
              title="电源管理"
            >
              ⚡
            </div>
          </div>

          <div className="quick-settings-slider">
            <span>🔊</span>
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
            <span>💡</span>
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
            <span>🔋</span>
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
