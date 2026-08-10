import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

interface SystemProcess {
  pid: number
  name: string
  appId?: string
  type: 'system' | 'application' | 'window'
  cpu: number
  memory: number
  status: 'running' | 'sleeping' | 'zombie'
  details: string
  windowId?: string
}

const SYSTEM_PROCESSES: SystemProcess[] = [
  { pid: 1, name: 'kernel_task', type: 'system', cpu: 0.5, memory: 12, status: 'running', details: '系统内核任务调度器' },
  { pid: 2, name: 'weblinux_os', type: 'system', cpu: 2.1, memory: 156, status: 'running', details: 'WebLinuxOS 核心服务' },
  { pid: 3, name: 'window_manager', type: 'system', cpu: 0.8, memory: 45, status: 'running', details: '窗口管理器进程' },
  { pid: 4, name: 'file_system', type: 'system', cpu: 0.3, memory: 28, status: 'running', details: '虚拟文件系统服务' },
  { pid: 5, name: 'render_engine', type: 'system', cpu: 3.2, memory: 234, status: 'running', details: 'React 渲染引擎' },
  { pid: 6, name: 'terminal_daemon', type: 'system', cpu: 0.1, memory: 8, status: 'sleeping', details: '终端后台服务' },
  { pid: 7, name: 'network_service', type: 'system', cpu: 0.4, memory: 15, status: 'running', details: '网络状态监控' },
  { pid: 8, name: 'storage_engine', type: 'system', cpu: 0.2, memory: 32, status: 'running', details: 'LocalStorage 存储引擎' },
]

export default function SystemTaskManager() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const closeWindow = useStore((s) => s.closeWindow)
  const focusWindow = useStore((s) => s.focusWindow)
  const systemStats = useStore((s) => s.systemStats)
  const refreshSystemStats = useStore((s) => s.refreshSystemStats)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'system' | 'application' | 'window'>('all')
  const [selectedPid, setSelectedPid] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<keyof SystemProcess>('cpu')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    refreshSystemStats()
  }, [refreshSystemStats])

  const windowProcesses = useMemo<SystemProcess[]>(() => {
    return windows.map((win, idx) => {
      const app = apps.find((a) => a.id === win.appId)
      return {
        pid: 10000 + idx,
        name: app?.name || win.appId,
        appId: win.appId,
        type: 'window' as const,
        cpu: win.focused ? Math.random() * 8 + 2 : Math.random() * 2,
        memory: Math.random() * 120 + 30,
        status: win.minimized ? ('sleeping' as const) : ('running' as const),
        details: `窗口进程 - ${win.width}x${win.height} @ (${Math.round(win.x)}, ${Math.round(win.y)})`,
        windowId: win.id,
      }
    })
  }, [windows, apps])

  const allProcesses = useMemo(() => {
    const appProcesses: SystemProcess[] = apps
      .filter((a) => a.id !== 'terminal' && a.id !== 'files' && a.id !== 'settings')
      .slice(0, 5)
      .map((app, idx) => ({
        pid: 20000 + idx,
        name: app.name,
        appId: app.id,
        type: 'application' as const,
        cpu: Math.random() * 3,
        memory: Math.random() * 60 + 10,
        status: 'running' as const,
        details: `${app.category} 类应用 - ${app.description || ''}`,
      }))

    return [...SYSTEM_PROCESSES, ...windowProcesses, ...appProcesses]
  }, [windowProcesses, apps])

  const filteredProcesses = useMemo(() => {
    let result = allProcesses

    if (filter !== 'all') {
      result = result.filter((p) => p.type === filter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.details.toLowerCase().includes(q) ||
          String(p.pid).includes(q)
      )
    }

    return result.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [allProcesses, search, filter, sortKey, sortDir])

  const handleSort = (key: keyof SystemProcess) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const killProcess = useCallback(
    (pid: number) => {
      const proc = allProcesses.find((p) => p.pid === pid)
      if (proc?.windowId) {
        closeWindow(proc.windowId)
      }
      setSelectedPid(null)
    },
    [allProcesses, closeWindow]
  )

  const focusProcess = useCallback(
    (pid: number) => {
      const proc = allProcesses.find((p) => p.pid === pid)
      if (proc?.windowId) {
        focusWindow(proc.windowId)
      }
    },
    [allProcesses, focusWindow]
  )

  const stats = useMemo(() => {
    const running = allProcesses.filter((p) => p.status === 'running').length
    const sleeping = allProcesses.filter((p) => p.status === 'sleeping').length
    const totalCpu = allProcesses.reduce((sum, p) => sum + p.cpu, 0)
    const totalMem = allProcesses.reduce((sum, p) => sum + p.memory, 0)
    return { running, sleeping, totalCpu: totalCpu.toFixed(1), totalMem: totalMem.toFixed(0) }
  }, [allProcesses])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '⚙️'
      case 'application':
        return '📦'
      case 'window':
        return '🪟'
      default:
        return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#10b981'
      case 'sleeping':
        return '#f59e0b'
      case 'zombie':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #0d0d1a 0%, #12122a 100%)',
      color: '#f0f0ff',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(139, 124, 240, 0.2)',
        background: 'rgba(20, 20, 40, 0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>🖥️</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>系统任务管理器</span>
          <span style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            background: 'rgba(139, 124, 240, 0.2)',
            borderRadius: '12px',
            fontSize: '11px',
            color: '#b8a8ff',
          }}>
            PID {allProcesses.length} | 运行 {stats.running} | 休眠 {stats.sleeping}
          </span>
        </div>

        {/* System stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {[
            { label: 'CPU', value: `${systemStats.cpuUsage}%`, color: '#7c6cf0', icon: '⚡' },
            { label: '内存', value: `${systemStats.memoryUsage}%`, color: '#00d6c1', icon: '💾' },
            { label: '存储', value: `${systemStats.storageUsage}%`, color: '#f59e0b', icon: '📀' },
            { label: '网络', value: `${systemStats.networkUsage}%`, color: '#10b981', icon: '🌐' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px' }}>{stat.icon}</span>
                <span style={{ fontSize: '11px', color: '#9090c0' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: stat.color }}>{stat.value}</div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                marginTop: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${parseFloat(stat.value)}%`,
                  height: '100%',
                  background: stat.color,
                  borderRadius: '2px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 搜索进程名/PID/详情..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(139, 124, 240, 0.2)',
              borderRadius: '6px',
              color: '#f0f0ff',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          {(['all', 'system', 'application', 'window'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                background: filter === f ? 'rgba(139, 124, 240, 0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filter === f ? 'rgba(139, 124, 240, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                color: filter === f ? '#b8a8ff' : '#9090c0',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f === 'all' ? '全部' : f === 'system' ? '系统' : f === 'application' ? '应用' : '窗口'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'rgba(20, 20, 40, 0.9)' }}>
              {[
                { key: 'pid', label: 'PID', width: '70px' },
                { key: 'name', label: '进程名', width: '180px' },
                { key: 'type', label: '类型', width: '80px' },
                { key: 'status', label: '状态', width: '80px' },
                { key: 'cpu', label: 'CPU %', width: '90px' },
                { key: 'memory', label: '内存 (MB)', width: '100px' },
                { key: 'details', label: '详情', width: 'auto' },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof SystemProcess)}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid rgba(139, 124, 240, 0.2)',
                    cursor: 'pointer',
                    color: '#9090c0',
                    fontWeight: 500,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
              <th style={{ padding: '10px', width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredProcesses.map((proc) => (
              <tr
                key={proc.pid}
                onClick={() => setSelectedPid(proc.pid)}
                style={{
                  background: selectedPid === proc.pid ? 'rgba(139, 124, 240, 0.15)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedPid !== proc.pid) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPid !== proc.pid) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }
                }}
              >
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#9090c0' }}>
                  {proc.pid}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 500 }}>
                  <span style={{ marginRight: '6px' }}>{getTypeIcon(proc.type)}</span>
                  {proc.name}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#9090c0' }}>
                  {proc.type === 'system' ? '系统' : proc.type === 'application' ? '应用' : '窗口'}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    background: `${getStatusColor(proc.status)}20`,
                    color: getStatusColor(proc.status),
                    border: `1px solid ${getStatusColor(proc.status)}40`,
                  }}>
                    {proc.status === 'running' ? '运行中' : proc.status === 'sleeping' ? '休眠' : '僵尸'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '40px',
                      height: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(100, proc.cpu * 5)}%`,
                        height: '100%',
                        background: proc.cpu > 5 ? '#ef4444' : proc.cpu > 2 ? '#f59e0b' : '#10b981',
                        borderRadius: '2px',
                      }} />
                    </div>
                    <span style={{ color: proc.cpu > 5 ? '#ef4444' : '#f0f0ff', fontSize: '11px' }}>
                      {proc.cpu.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#9090c0' }}>
                  {proc.memory.toFixed(0)}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#6b7280', fontSize: '11px' }}>
                  {proc.details}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {proc.windowId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          focusProcess(proc.pid)
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(139, 124, 240, 0.2)',
                          border: '1px solid rgba(139, 124, 240, 0.4)',
                          borderRadius: '4px',
                          color: '#b8a8ff',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        聚焦
                      </button>
                    )}
                    {(proc.type === 'window' || proc.type === 'application') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          killProcess(proc.pid)
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#f87171',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        终止
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProcesses.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: '#6b7280',
          }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</span>
            <div>没有找到匹配的进程</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(139, 124, 240, 0.15)',
        background: 'rgba(20, 20, 40, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#6b7280',
      }}>
        <span>总进程数: {allProcesses.length} | CPU: {stats.totalCpu}% | 内存: {stats.totalMem}MB</span>
        <span>WebLinuxOS v{__APP_VERSION__} | 实时监控</span>
      </div>
    </div>
  )
}
