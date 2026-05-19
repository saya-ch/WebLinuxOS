import { useState, useEffect, useCallback } from 'react'

interface Process {
  pid: number
  name: string
  user: string
  cpu: number
  memory: number
  status: 'running' | 'sleeping' | 'stopped'
  command: string
}

const processNames = [
  'systemd', 'chrome', 'vscode', 'node', 'postgres', 'nginx',
  'docker', 'mysql', 'redis', 'python3', 'bash', 'ssh', 'Xorg',
  'gnome-shell', 'pulseaudio', 'NetworkManager',
]

const users = ['root', 'user', 'www-data', 'postgres', 'mysql', 'redis']

function generateProcesses(): Process[] {
  return processNames.map((name, i) => ({
    pid: 1000 + i * 137,
    name,
    user: users[i % users.length],
    cpu: +(Math.random() * 25 + 0.1).toFixed(1),
    memory: +(Math.random() * 800 + 10).toFixed(1),
    status: (['running', 'sleeping', 'stopped'] as const)[i % 3],
    command: `/usr/bin/${name} --config=/etc/${name}.conf`,
  }))
}

export default function ProcessMonitor() {
  const [processes, setProcesses] = useState<Process[]>(generateProcesses())
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof Process>('cpu')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses((prev) =>
        prev.map((p) => ({ ...p, cpu: +(Math.random() * 25 + 0.1).toFixed(1) }))
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSort = (key: keyof Process) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const killProcess = useCallback((pid: number) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid))
  }, [])

  const filtered = processes
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.command.toLowerCase().includes(q) || String(p.pid).includes(q)
    })
    .sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })

  const getSortIndicator = (key: keyof Process) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const columns: { key: keyof Process; label: string; width: string }[] = [
    { key: 'pid', label: 'PID', width: '70px' },
    { key: 'name', label: '名称', width: '130px' },
    { key: 'user', label: '用户', width: '80px' },
    { key: 'cpu', label: 'CPU %', width: '70px' },
    { key: 'memory', label: '内存 MB', width: '80px' },
    { key: 'status', label: '状态', width: '70px' },
    { key: 'command', label: '命令', width: 'auto' },
  ]

  const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0).toFixed(1)
  const totalMem = processes.reduce((sum, p) => sum + p.memory, 0).toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索进程..."
          style={{
            flex: 1, padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
            borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none',
          }}
        />
        <span style={{ fontSize: '11px', color: '#a6adc8' }}>
          CPU: {totalCpu}% | 内存: {totalMem} MB | 进程: {processes.length}
        </span>
      </div>

      <div style={{
        display: 'flex', padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#a6adc8',
        borderBottom: '1px solid #45475a', background: '#181825',
      }}>
        {columns.map((col) => (
          <div
            key={col.key}
            onClick={() => handleSort(col.key)}
            style={{ width: col.key === 'command' ? undefined : col.width, flex: col.key === 'command' ? 1 : undefined, padding: '0 4px', cursor: 'pointer' }}
          >
            {col.label}{getSortIndicator(col.key)}
          </div>
        ))}
        <div style={{ width: '60px' }}>操作</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((proc) => (
          <div
            key={proc.pid}
            style={{
              display: 'flex', padding: '7px 12px', fontSize: '12px', borderBottom: '1px solid #313244',
              alignItems: 'center',
            }}
          >
            <span style={{ width: '70px', color: '#89b4fa' }}>{proc.pid}</span>
            <span style={{ width: '130px', fontWeight: 600 }}>{proc.name}</span>
            <span style={{ width: '80px', color: '#a6adc8' }}>{proc.user}</span>
            <span style={{ width: '70px', color: proc.cpu > 20 ? '#f38ba8' : proc.cpu > 10 ? '#f9e2af' : '#a6e3a1' }}>
              {proc.cpu}%
            </span>
            <span style={{ width: '80px', color: '#a6adc8' }}>{proc.memory}</span>
            <span style={{
              width: '70px',
              color: proc.status === 'running' ? '#a6e3a1' : proc.status === 'sleeping' ? '#89b4fa' : '#f38ba8',
            }}>
              {proc.status === 'running' ? '运行中' : proc.status === 'sleeping' ? '休眠' : '已停止'}
            </span>
            <span style={{ flex: 1, color: '#6c7086', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {proc.command}
            </span>
            <button
              onClick={() => killProcess(proc.pid)}
              style={{
                width: '60px', padding: '4px 8px', background: '#f38ba8', color: '#1e1e2e',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              }}
            >
              结束
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}