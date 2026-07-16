import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

interface SystemInfo {
  cpuUsage: number
  memoryUsage: number
  storageUsage: number
  networkStatus: 'online' | 'offline' | 'unknown'
  batteryLevel: number
  batteryCharging: boolean
  uptime: string
  windowCount: number
  appCount: number
  fileCount: number
}

export default function SystemMonitorDashboard() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 0,
    networkStatus: 'unknown',
    batteryLevel: 100,
    batteryCharging: false,
    uptime: '00:00:00',
    windowCount: 0,
    appCount: 0,
    fileCount: 0,
  })

  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const files = useStore((s) => s.files)

  const calculateFileCount = useCallback((nodes: { children?: { type: string; children?: any[] }[] }[]): number => {
    let count = 0
    const traverse = (node: { children?: { type: string; children?: any[] }[] }) => {
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'file') count++
          if (child.type === 'folder') traverse(child)
        })
      }
    }
    nodes.forEach(traverse)
    return count
  }, [])

  useEffect(() => {
    setSystemInfo(prev => ({
      ...prev,
      windowCount: windows.length,
      appCount: apps.length,
      fileCount: calculateFileCount(files),
    }))
  }, [windows, apps, files, calculateFileCount])

  useEffect(() => {
    const startTime = Date.now()

    const updateUptime = () => {
      const elapsed = Date.now() - startTime
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setSystemInfo(prev => ({
        ...prev,
        uptime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      }))
    }

    const uptimeInterval = setInterval(updateUptime, 1000)
    updateUptime()

    return () => clearInterval(uptimeInterval)
  }, [])

  useEffect(() => {
    const updateSystemMetrics = () => {
      setSystemInfo(prev => ({
        ...prev,
        cpuUsage: Math.floor(Math.random() * 40) + 10,
        memoryUsage: Math.floor(Math.random() * 30) + 40,
        storageUsage: Math.floor(Math.random() * 20) + 30,
      }))
    }

    const metricsInterval = setInterval(updateSystemMetrics, 2000)
    updateSystemMetrics()

    return () => clearInterval(metricsInterval)
  }, [])

  useEffect(() => {
    if ('getBattery' in navigator) {
      ;(navigator.getBattery as () => Promise<{ level: number; charging: boolean; addEventListener: (event: string, handler: () => void) => void }>)().then(battery => {
        const updateBattery = () => {
          setSystemInfo(prev => ({
            ...prev,
            batteryLevel: Math.floor(battery.level * 100),
            batteryCharging: battery.charging,
          }))
        }
        updateBattery()
        battery.addEventListener('levelchange', updateBattery)
        battery.addEventListener('chargingchange', updateBattery)
      })
    }

    const updateNetwork = () => {
      setSystemInfo(prev => ({
        ...prev,
        networkStatus: navigator.onLine ? 'online' : 'offline',
      }))
    }
    updateNetwork()
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)

    return () => {
      window.removeEventListener('online', updateNetwork)
      window.removeEventListener('offline', updateNetwork)
    }
  }, [])

  const getStatusColor = (usage: number): string => {
    if (usage < 50) return '#10b981'
    if (usage < 80) return '#f59e0b'
    return '#ef4444'
  }

  const getStatusGlow = (usage: number): string => {
    if (usage < 50) return '0 0 15px rgba(16, 185, 129, 0.4)'
    if (usage < 80) return '0 0 15px rgba(245, 158, 11, 0.4)'
    return '0 0 15px rgba(239, 68, 68, 0.4)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f0f1a' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(108, 92, 231, 0.2)', background: '#16162a' }}>
        <div style={{ color: '#9b8af0', fontSize: 18, fontWeight: 600 }}>📊 系统监控仪表盘</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>实时系统状态监控</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(249, 115, 22, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
              <div style={{ color: '#9090c0', fontSize: 12 }}>CPU 使用率</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: getStatusColor(systemInfo.cpuUsage) }}>{systemInfo.cpuUsage}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>%</span>
            </div>
            <div style={{ marginTop: 8, height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${systemInfo.cpuUsage}%`, background: getStatusColor(systemInfo.cpuUsage), boxShadow: getStatusGlow(systemInfo.cpuUsage), transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(139, 92, 246, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💾</div>
              <div style={{ color: '#9090c0', fontSize: 12 }}>内存使用</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: getStatusColor(systemInfo.memoryUsage) }}>{systemInfo.memoryUsage}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>%</span>
            </div>
            <div style={{ marginTop: 8, height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${systemInfo.memoryUsage}%`, background: getStatusColor(systemInfo.memoryUsage), boxShadow: getStatusGlow(systemInfo.memoryUsage), transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(59, 130, 246, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📁</div>
              <div style={{ color: '#9090c0', fontSize: 12 }}>存储使用</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: getStatusColor(systemInfo.storageUsage) }}>{systemInfo.storageUsage}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>%</span>
            </div>
            <div style={{ marginTop: 8, height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${systemInfo.storageUsage}%`, background: getStatusColor(systemInfo.storageUsage), boxShadow: getStatusGlow(systemInfo.storageUsage), transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: systemInfo.networkStatus === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌐</div>
              <div style={{ color: '#9090c0', fontSize: 12 }}>网络状态</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: systemInfo.networkStatus === 'online' ? '#10b981' : '#ef4444', boxShadow: `0 0 10px ${systemInfo.networkStatus === 'online' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 18, fontWeight: 600, color: systemInfo.networkStatus === 'online' ? '#10b981' : '#ef4444' }}>
                {systemInfo.networkStatus === 'online' ? '在线' : '离线'}
              </span>
            </div>
          </div>

          <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(245, 158, 11, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔋</div>
              <div style={{ color: '#9090c0', fontSize: 12 }}>电量</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: getStatusColor(systemInfo.batteryLevel) }}>{systemInfo.batteryLevel}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>%</span>
            </div>
            {systemInfo.batteryCharging && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#10b981' }}>🔌 正在充电</div>
            )}
          </div>

          <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(168, 85, 247, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⏱️</div>
              <div style={{ color: '#9090c0', fontSize: 12 }}>系统运行时间</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#9b8af0', fontFamily: 'monospace' }}>{systemInfo.uptime}</div>
          </div>
        </div>

        <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)', marginBottom: 12 }}>
          <div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>📱 系统统计</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#9b8af0' }}>{systemInfo.windowCount}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>活动窗口</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{systemInfo.appCount}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>已安装应用</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{systemInfo.fileCount}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>文件数量</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#16162a', borderRadius: 12, padding: '16px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
          <div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>🖥️ 活动窗口</div>
          {windows.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {windows.slice(0, 10).map((win, index) => (
                <div key={win.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6 }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(108, 92, 231, 0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f0ff', fontSize: 13 }}>{win.title}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{win.width} x {win.height} px</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ padding: '2px 8px', background: win.minimized ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderRadius: 3, fontSize: 11, color: win.minimized ? '#f59e0b' : '#10b981' }}>
                      {win.minimized ? '最小化' : '运行中'}
                    </span>
                  </div>
                </div>
              ))}
              {windows.length > 10 && (
                <div style={{ textAlign: 'center', padding: 8, color: '#64748b', fontSize: 12 }}>还有 {windows.length - 10} 个窗口...</div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🪟</div>
              <div>暂无活动窗口</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}