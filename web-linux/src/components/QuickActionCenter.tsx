import { memo } from 'react'
import { useStore } from '../store'
import {
  Power,
  RotateCcw,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  BatteryCharging,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Settings,
  Lock,
  Layers,
  Zap,
  Thermometer,
} from 'lucide-react'

interface QuickActionCenterProps {
  isOpen: boolean
  onClose: () => void
}

const QuickActionCenter = memo(function QuickActionCenter({ isOpen, onClose }: QuickActionCenterProps) {
  const systemStats = useStore((s) => s.systemStats)
  const theme = useStore((s) => s.theme)
  const systemStatus = useStore((s) => s.systemStatus)
  const setTheme = useStore((s) => s.setTheme)
  const toggleLiveWallpaper = useStore((s) => s.toggleLiveWallpaper)
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const openApp = useStore((s) => s.openApp)
  const resetToDefaults = useStore((s) => s.resetToDefaults)

  if (!isOpen) return null

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getStatusColor = (usage: number) => {
    if (usage < 50) return 'var(--color-success)'
    if (usage < 80) return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">系统面板</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-light transition-colors"
            >
              <span className="text-gray-400 text-xl">&times;</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={16} className="text-primary" />
                <span className="text-xs text-gray-400">CPU</span>
              </div>
              <div className="text-2xl font-bold text-white">{systemStats.cpuUsage}%</div>
              <div
                className="h-1.5 bg-surface-dark rounded-full mt-2 overflow-hidden"
                style={{ width: '100%' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${systemStats.cpuUsage}%`,
                    backgroundColor: getStatusColor(systemStats.cpuUsage),
                  }}
                />
              </div>
            </div>

            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick size={16} className="text-secondary" />
                <span className="text-xs text-gray-400">内存</span>
              </div>
              <div className="text-2xl font-bold text-white">{systemStats.memoryUsage}%</div>
              <div
                className="h-1.5 bg-surface-dark rounded-full mt-2 overflow-hidden"
                style={{ width: '100%' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${systemStats.memoryUsage}%`,
                    backgroundColor: getStatusColor(systemStats.memoryUsage),
                  }}
                />
              </div>
            </div>

            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive size={16} className="text-warning" />
                <span className="text-xs text-gray-400">存储</span>
              </div>
              <div className="text-2xl font-bold text-white">{systemStats.storageUsage}%</div>
              <div
                className="h-1.5 bg-surface-dark rounded-full mt-2 overflow-hidden"
                style={{ width: '100%' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${systemStats.storageUsage}%`,
                    backgroundColor: getStatusColor(systemStats.storageUsage),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-success" />
                <span className="text-xs text-gray-400">网络</span>
              </div>
              <div className="flex items-center gap-2">
                {systemStatus === 'online' ? (
                  <Wifi size={20} className="text-success" />
                ) : (
                  <WifiOff size={20} className="text-error" />
                )}
                <span className="text-sm font-medium text-white">
                  {systemStatus === 'online' ? '在线' : '离线'}
                </span>
              </div>
            </div>

            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-warning" />
                <span className="text-xs text-gray-400">运行时间</span>
              </div>
              <div className="text-lg font-medium text-white">{formatUptime(systemStats.uptime)}</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">快捷操作</h3>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-surface-dark transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun size={20} className="text-warning" />
                ) : (
                  <Moon size={20} className="text-primary" />
                )}
                <span className="text-xs text-gray-300">
                  {theme === 'dark' ? '浅色' : '深色'}
                </span>
              </button>

              <button
                onClick={() => {
                  toggleLiveWallpaper()
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-surface-dark transition-colors"
              >
                <Layers size={20} className={liveWallpaperEnabled ? 'text-secondary' : 'text-gray-400'} />
                <span className="text-xs text-gray-300">壁纸</span>
              </button>

              <button
                onClick={() => {
                  openApp('settings')
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-surface-dark transition-colors"
              >
                <Settings size={20} className="text-gray-400" />
                <span className="text-xs text-gray-300">设置</span>
              </button>

              <button
                onClick={() => {
                  openApp('system-monitor')
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-surface-dark transition-colors"
              >
                <Thermometer size={20} className="text-error" />
                <span className="text-xs text-gray-300">监控</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">系统管理</h3>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => {
                  openApp('terminal')
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-surface-dark transition-colors"
              >
                <Activity size={20} className="text-success" />
                <span className="text-xs text-gray-300">终端</span>
              </button>

              <button
                onClick={() => {
                  resetToDefaults()
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-error/20 transition-colors"
              >
                <RotateCcw size={20} className="text-warning" />
                <span className="text-xs text-gray-300">重置</span>
              </button>

              <button
                onClick={() => {
                  openApp('lock-screen')
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-surface-dark transition-colors"
              >
                <Lock size={20} className="text-gray-400" />
                <span className="text-xs text-gray-300">锁定</span>
              </button>

              <button
                onClick={() => {
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-surface-light rounded-xl hover:bg-error/20 transition-colors"
              >
                <Power size={20} className="text-error" />
                <span className="text-xs text-gray-300">退出</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
            <BatteryCharging size={16} className="text-success" />
            <span className="text-xs text-gray-500">WebLinuxOS v{__APP_VERSION__}</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-500">{__BUILD_TIME__}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default QuickActionCenter