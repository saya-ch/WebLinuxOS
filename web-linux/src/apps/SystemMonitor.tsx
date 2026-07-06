import { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, Cpu, HardDrive, Wifi, Battery, MemoryStick, Clock, TrendingUp, TrendingDown } from 'lucide-react'

interface SystemInfo {
  cpu: number
  memory: number
  network: number
  disk: number
  battery: number
  uptime: string
}

interface Process {
  id: number
  name: string
  cpu: number
  memory: number
  status: 'running' | 'sleeping' | 'idle'
}

const SystemMonitor = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpu: 0,
    memory: 0,
    network: 0,
    disk: 45,
    battery: 87,
    uptime: '00:00:00',
  })
  
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedTab, setSelectedTab] = useState<'overview' | 'processes' | 'network' | 'storage'>('overview')
  const [history, setHistory] = useState<{ time: string; cpu: number; memory: number }[]>([])
  const startTime = useRef(Date.now())

  const generateProcesses = useCallback(() => {
    const processNames = [
      'systemd', 'chrome', 'node', 'python', 'firefox', 'vscode', 'nginx', 'postgres',
      'redis', 'docker', 'git', 'npm', 'electron', 'java', 'dotnet', 'rustc',
      'webpack', 'babel', 'eslint', 'prettier', 'tailwind', 'sass', 'gulp', 'webpack-dev-server'
    ]
    
    const newProcesses: Process[] = []
    for (let i = 0; i < 25; i++) {
      newProcesses.push({
        id: Math.floor(Math.random() * 65535),
        name: processNames[Math.floor(Math.random() * processNames.length)],
        cpu: Math.random() * 30,
        memory: Math.random() * 15,
        status: Math.random() > 0.7 ? 'running' : Math.random() > 0.5 ? 'sleeping' : 'idle',
      })
    }
    
    return newProcesses.sort((a, b) => b.cpu - a.cpu)
  }, [])

  useEffect(() => {
    setProcesses(generateProcesses())
  }, [generateProcesses])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      
      setSystemInfo(prev => ({
        ...prev,
        cpu: Math.min(100, prev.cpu + (Math.random() - 0.5) * 10),
        memory: Math.min(100, prev.memory + (Math.random() - 0.5) * 5),
        network: Math.random() * 100,
        uptime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      }))
      
      setHistory(prev => {
        const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const newHistory = [...prev, { time: now, cpu: systemInfo.cpu, memory: systemInfo.memory }]
        if (newHistory.length > 30) newHistory.shift()
        return newHistory
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [systemInfo.cpu, systemInfo.memory])

  const getStatusColor = (status: Process['status']) => {
    switch (status) {
      case 'running': return '#22c55e'
      case 'sleeping': return '#eab308'
      case 'idle': return '#6b7280'
    }
  }

  const getStatusText = (status: Process['status']) => {
    switch (status) {
      case 'running': return '运行中'
      case 'sleeping': return '睡眠'
      case 'idle': return '空闲'
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage > 80) return '#ef4444'
    if (usage > 60) return '#f59e0b'
    return '#22c55e'
  }

  const renderGauge = (label: string, value: number, icon: React.ReactNode, color?: string) => {
    const actualColor = color || getUsageColor(value)
    return (
      <div className="gauge-card">
        <div className="gauge-header">
          {icon}
          <span>{label}</span>
        </div>
        <div className="gauge-value">
          <span style={{ color: actualColor }}>{value.toFixed(1)}%</span>
        </div>
        <div className="gauge-bar">
          <div className="gauge-fill" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: actualColor }} />
        </div>
      </div>
    )
  }

  const renderChart = () => {
    if (history.length < 2) return null
    
    const maxValue = 100
    const width = 100 / history.length
    
    return (
      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-label">CPU</span>
          <span className="chart-label memory">内存</span>
        </div>
        <div className="chart-area">
          {history.map((point, index) => (
            <div key={index} className="chart-bar-group" style={{ width: `${width}%` }}>
              <div 
                className="chart-bar cpu" 
                style={{ height: `${(point.cpu / maxValue) * 100}%` }}
                title={`CPU: ${point.cpu.toFixed(1)}%`}
              />
              <div 
                className="chart-bar memory" 
                style={{ height: `${(point.memory / maxValue) * 100}%` }}
                title={`内存: ${point.memory.toFixed(1)}%`}
              />
            </div>
          ))}
        </div>
        <div className="chart-footer">
          <span>{history[0]?.time}</span>
          <span>{history[history.length - 1]?.time}</span>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="tab-content">
      <div className="gauges-grid">
        {renderGauge('CPU使用率', systemInfo.cpu, <Cpu size={20} />)}
        {renderGauge('内存使用', systemInfo.memory, <MemoryStick size={20} />)}
        {renderGauge('磁盘空间', systemInfo.disk, <HardDrive size={20} />)}
        {renderGauge('网络流量', systemInfo.network, <Wifi size={20} />)}
        {renderGauge('电池电量', systemInfo.battery, <Battery size={20} />, systemInfo.battery < 20 ? '#ef4444' : '#22c55e')}
      </div>
      
      <div className="uptime-card">
        <div className="uptime-header">
          <Clock size={20} />
          <span>系统运行时间</span>
        </div>
        <div className="uptime-value">{systemInfo.uptime}</div>
      </div>
      
      {renderChart()}
    </div>
  )

  const renderProcesses = () => (
    <div className="tab-content processes-tab">
      <div className="processes-header">
        <span>进程列表</span>
        <span className="count">{processes.length} 个进程</span>
      </div>
      <div className="processes-table">
        <div className="table-header">
          <span>PID</span>
          <span>进程名</span>
          <span>CPU</span>
          <span>内存</span>
          <span>状态</span>
        </div>
        <div className="table-body">
          {processes.map((proc, index) => (
            <div key={index} className="table-row">
              <span className="pid">{proc.id}</span>
              <span className="name">{proc.name}</span>
              <span className="cpu">{proc.cpu.toFixed(1)}%</span>
              <span className="memory">{proc.memory.toFixed(1)}%</span>
              <span className="status" style={{ color: getStatusColor(proc.status) }}>
                {getStatusText(proc.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderNetwork = () => (
    <div className="tab-content network-tab">
      <div className="network-status">
        <div className="status-item online">
          <Wifi size={24} />
          <div>
            <span className="status-label">网络状态</span>
            <span className="status-value">已连接</span>
          </div>
        </div>
        <div className="status-item">
          <Activity size={24} />
          <div>
            <span className="status-label">IP地址</span>
            <span className="status-value">192.168.1.100</span>
          </div>
        </div>
        <div className="status-item">
          <TrendingUp size={24} />
          <div>
            <span className="status-label">上传速度</span>
            <span className="status-value">{(Math.random() * 10).toFixed(2)} MB/s</span>
          </div>
        </div>
        <div className="status-item">
          <TrendingDown size={24} />
          <div>
            <span className="status-label">下载速度</span>
            <span className="status-value">{(Math.random() * 50).toFixed(2)} MB/s</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStorage = () => (
    <div className="tab-content storage-tab">
      <div className="storage-card">
        <div className="storage-header">
          <HardDrive size={20} />
          <span>本地存储</span>
        </div>
        <div className="storage-info">
          <div className="storage-bar">
            <div className="storage-fill" style={{ width: `${systemInfo.disk}%` }} />
          </div>
          <div className="storage-text">
            <span>已用: {systemInfo.disk.toFixed(0)}%</span>
            <span>可用: {(100 - systemInfo.disk).toFixed(0)}%</span>
          </div>
        </div>
        <div className="storage-details">
          <div className="detail-item">
            <span>总容量</span>
            <span>512 GB</span>
          </div>
          <div className="detail-item">
            <span>已使用</span>
            <span>{(512 * systemInfo.disk / 100).toFixed(0)} GB</span>
          </div>
          <div className="detail-item">
            <span>剩余空间</span>
            <span>{(512 * (100 - systemInfo.disk) / 100).toFixed(0)} GB</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="system-monitor">
      <div className="monitor-header">
        <div className="header-left">
          <Activity className="header-icon" />
          <h2>系统监视器</h2>
        </div>
        <div className="header-right">
          <span className="system-status online">● 在线</span>
        </div>
      </div>

      <div className="monitor-tabs">
        {[
          { id: 'overview', label: '概览' },
          { id: 'processes', label: '进程' },
          { id: 'network', label: '网络' },
          { id: 'storage', label: '存储' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'processes' && renderProcesses()}
      {selectedTab === 'network' && renderNetwork()}
      {selectedTab === 'storage' && renderStorage()}

      <style>{`
        .system-monitor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--window-bg, #1a1a2e);
          color: var(--text-color, #e0e0e0);
          padding: 16px;
          overflow: hidden;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #333);
          margin-bottom: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          width: 24px;
          height: 24px;
          color: #61afef;
        }

        .header-left h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .system-status.online {
          color: #22c55e;
        }

        .monitor-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
        }

        .tab-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #9ca3af;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
        }

        .tab-btn.active {
          background: #61afef;
          color: #1a1a2e;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
        }

        .gauges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .gauge-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid var(--border-color, #333);
        }

        .gauge-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .gauge-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .gauge-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .gauge-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .uptime-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color, #333);
          margin-bottom: 16px;
        }

        .uptime-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .uptime-value {
          font-size: 32px;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
          color: #61afef;
        }

        .chart-container {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color, #333);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .chart-label {
          font-size: 12px;
          color: #61afef;
        }

        .chart-label.memory {
          color: #a855f7;
        }

        .chart-area {
          display: flex;
          align-items: flex-end;
          height: 120px;
          gap: 2px;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          gap: 2px;
        }

        .chart-bar {
          width: 6px;
          border-radius: 3px;
          transition: height 0.3s ease;
        }

        .chart-bar.cpu {
          background: #61afef;
        }

        .chart-bar.memory {
          background: #a855f7;
        }

        .chart-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 11px;
          color: #6b7280;
        }

        .processes-tab {
          display: flex;
          flex-direction: column;
        }

        .processes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .processes-header .count {
          color: #6b7280;
          font-size: 12px;
        }

        .processes-table {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          border: 1px solid var(--border-color, #333);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 80px 1fr 60px 60px 80px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .table-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: 80px 1fr 60px 60px 80px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color, #333);
          font-size: 13px;
          transition: background 0.1s;
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .table-row .pid {
          font-family: 'Monaco', monospace;
          color: #61afef;
        }

        .table-row .name {
          font-weight: 500;
        }

        .table-row .cpu {
          color: #f59e0b;
        }

        .table-row .memory {
          color: #a855f7;
        }

        .network-tab {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .network-status {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .status-item {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color, #333);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-item.online {
          border-color: #22c55e;
        }

        .status-item > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .status-label {
          font-size: 12px;
          color: #9ca3af;
        }

        .status-value {
          font-size: 16px;
          font-weight: 600;
          color: #e0e0e0;
        }

        .storage-tab {
          display: flex;
          flex-direction: column;
        }

        .storage-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color, #333);
        }

        .storage-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .storage-info {
          margin-bottom: 16px;
        }

        .storage-bar {
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .storage-fill {
          height: 100%;
          background: linear-gradient(90deg, #61afef, #a855f7);
          border-radius: 12px;
          transition: width 0.3s ease;
        }

        .storage-text {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9ca3af;
        }

        .storage-details {
          display: flex;
          gap: 24px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item span:first-child {
          font-size: 12px;
          color: #9ca3af;
        }

        .detail-item span:last-child {
          font-size: 14px;
          font-weight: 600;
          color: #e0e0e0;
        }

        @media (prefers-color-scheme: light) {
          .system-monitor {
            background: #f5f5f5;
            color: #1f2937;
          }
          
          .gauge-card, .uptime-card, .chart-container, .processes-table, .status-item, .storage-card {
            background: white;
            border-color: #e5e7eb;
          }
          
          .table-header {
            background: #f3f4f6;
          }
          
          .table-row:hover {
            background: #f9fafb;
          }
        }
      `}</style>
    </div>
  )
}

export default SystemMonitor