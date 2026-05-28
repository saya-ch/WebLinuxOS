import { useState, useEffect, memo, useCallback } from 'react'

interface MetricData {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
}

interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  memory: number
}

function generateMockData(): MetricData {
  return {
    cpu: Math.random() * 30 + 20,
    memory: Math.random() * 20 + 40,
    disk: Math.random() * 10 + 30,
    network: Math.random() * 100,
    uptime: Date.now() / 1000 - Math.random() * 86400 * 7
  }
}

function generateMockProcesses(): ProcessInfo[] {
  const processes = [
    { pid: 1, name: 'systemd', baseCpu: 0.5, baseMem: 1.2 },
    { pid: 1234, name: 'firefox', baseCpu: 8.5, baseMem: 12.3 },
    { pid: 2345, name: 'code', baseCpu: 5.2, baseMem: 8.7 },
    { pid: 3456, name: 'terminal', baseCpu: 1.3, baseMem: 2.1 },
    { pid: 4567, name: 'node', baseCpu: 3.7, baseMem: 4.5 },
    { pid: 5678, name: 'python', baseCpu: 2.9, baseMem: 3.8 },
    { pid: 6789, name: 'docker', baseCpu: 1.8, baseMem: 5.2 },
    { pid: 7890, name: 'nginx', baseCpu: 0.8, baseMem: 1.5 },
    { pid: 8901, name: 'postgres', baseCpu: 2.1, baseMem: 6.4 },
    { pid: 9012, name: 'redis', baseCpu: 0.9, baseMem: 2.8 }
  ]

  return processes.map(p => ({
    pid: p.pid,
    name: p.name,
    cpu: Math.max(0, p.baseCpu + (Math.random() - 0.5) * 2),
    memory: Math.max(0.1, p.baseMem + (Math.random() - 0.5) * 3)
  }))
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getMetricColor(value: number, type: string): string {
  if (type === 'network') {
    return value > 80 ? '#f87171' : value > 50 ? '#fbbf24' : '#4ade80'
  }
  return value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981'
}

const EnhancedSystemDashboard = memo(function EnhancedSystemDashboard() {
  const [metrics, setMetrics] = useState<MetricData>(generateMockData)
  const [processes, setProcesses] = useState<ProcessInfo[]>(generateMockProcesses)
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'cpu' | 'memory'>('cpu')

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMockData())
      setProcesses(generateMockProcesses())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleSort = useCallback((key: 'cpu' | 'memory') => {
    setSortBy(key)
    setProcesses(prev => [...prev].sort((a, b) => b[key] - a[key]))
  }, [])

  const sortedProcesses = [...processes].sort((a, b) => b[sortBy] - a[sortBy])

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px',
      background: 'linear-gradient(180deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          icon="💻"
          label="CPU 使用率"
          value={metrics.cpu}
          unit="%"
          color={getMetricColor(metrics.cpu, 'cpu')}
        />
        <MetricCard
          icon="🧠"
          label="内存使用"
          value={metrics.memory}
          unit="%"
          color={getMetricColor(metrics.memory, 'memory')}
        />
        <MetricCard
          icon="💾"
          label="磁盘使用"
          value={metrics.disk}
          unit="%"
          color={getMetricColor(metrics.disk, 'disk')}
        />
        <MetricCard
          icon="🌐"
          label="网络活动"
          value={metrics.network}
          unit="KB/s"
          color={getMetricColor(metrics.network, 'network')}
        />
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e8e8f4' }}>
            系统信息
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <InfoCard label="运行时间" value={formatUptime(metrics.uptime)} icon="⏱️" />
          <InfoCard label="主机名" value="web-linux" icon="🖥️" />
          <InfoCard label="操作系统" value="WebLinuxOS 4.3" icon="🐧" />
          <InfoCard label="内核版本" value="6.1.0-web" icon="⚙️" />
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e8e8f4' }}>
            进程监控
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleSort('cpu')}
              style={{
                padding: '6px 12px',
                background: sortBy === 'cpu' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${sortBy === 'cpu' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '8px',
                color: sortBy === 'cpu' ? '#e8e8f4' : '#a0a0c8',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              CPU
            </button>
            <button
              onClick={() => handleSort('memory')}
              style={{
                padding: '6px 12px',
                background: sortBy === 'memory' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${sortBy === 'memory' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '8px',
                color: sortBy === 'memory' ? '#e8e8f4' : '#a0a0c8',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              内存
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: '#a0a0c8', fontWeight: 500 }}>PID</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#a0a0c8', fontWeight: 500 }}>进程名称</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#a0a0c8', fontWeight: 500 }}>CPU %</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#a0a0c8', fontWeight: 500 }}>内存 %</th>
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map((proc) => (
                <tr
                  key={proc.pid}
                  onClick={() => setSelectedProcess(proc.pid)}
                  style={{
                    cursor: 'pointer',
                    background: selectedProcess === proc.pid ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <td style={{ padding: '10px 8px', color: '#a0a0c8', fontFamily: 'monospace' }}>{proc.pid}</td>
                  <td style={{ padding: '10px 8px', color: '#e8e8f4' }}>{proc.name}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: getMetricColor(proc.cpu, 'cpu'), fontFamily: 'monospace' }}>
                    {proc.cpu.toFixed(1)}%
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: getMetricColor(proc.memory, 'memory'), fontFamily: 'monospace' }}>
                    {proc.memory.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#a0a0c8',
        textAlign: 'center'
      }}>
        实时系统监控 | 数据每2秒刷新 | 模拟数据仅供演示
      </div>
    </div>
  )
})

function MetricCard({ icon, label, value, unit, color }: { icon: string; label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${color}30`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <span style={{ fontSize: '14px', color: '#a0a0c8' }}>{label}</span>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '32px', fontWeight: '700', color: '#e8e8f4' }}>
          {value.toFixed(1)}
        </span>
        <span style={{ fontSize: '14px', color: '#a0a0c8', marginLeft: '4px' }}>{unit}</span>
      </div>
      <div style={{
        height: '6px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, value)}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      padding: '12px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: '#a0a0c8', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#e8e8f4' }}>{value}</div>
      </div>
    </div>
  )
}

export default EnhancedSystemDashboard
