import { useState, useRef, useEffect } from 'react'

const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const
type Level = (typeof levels)[number]

const initialLogs: { time: string; level: Level; message: string }[] = [
  { time: '08:00:01', level: 'INFO', message: '系统启动完成' },
  { time: '08:00:02', level: 'INFO', message: '内核版本: Linux 6.8.0-web' },
  { time: '08:00:03', level: 'INFO', message: '初始化网络接口 eth0' },
  { time: '08:00:04', level: 'INFO', message: 'eth0: link up, 1000Mbps' },
  { time: '08:00:05', level: 'DEBUG', message: '加载模块: nvidia-drm' },
  { time: '08:00:06', level: 'INFO', message: 'sshd: Listening on port 22' },
  { time: '08:00:07', level: 'INFO', message: 'cron: 守护进程已启动' },
  { time: '08:00:08', level: 'DEBUG', message: 'dbus: 服务已注册' },
  { time: '08:00:10', level: 'WARN', message: 'systemd-resolved: 缓存刷新延迟' },
  { time: '08:01:15', level: 'INFO', message: '用户 user 登录 (tty1)' },
  { time: '08:02:30', level: 'ERROR', message: 'pulseaudio: 无法找到默认输出设备' },
  { time: '08:03:45', level: 'WARN', message: 'NetworkManager: wlan0 信号弱 (35%)' },
  { time: '08:05:00', level: 'INFO', message: 'apt: 检查更新完成' },
  { time: '08:05:01', level: 'DEBUG', message: 'apt: 缓存中有 12 个可更新包' },
  { time: '08:10:22', level: 'ERROR', message: 'dockerd: 无法连接到 Docker 守护进程' },
  { time: '08:11:30', level: 'INFO', message: 'firewalld: 规则集已重新加载' },
  { time: '08:15:00', level: 'WARN', message: '磁盘使用率: /dev/sda1 达到 78%' },
  { time: '08:20:10', level: 'INFO', message: 'CUPS: 打印服务已就绪' },
  { time: '08:25:00', level: 'DEBUG', message: 'systemd: timer 检查完成 (0 个过期)' },
  { time: '08:30:15', level: 'ERROR', message: 'mysql: [Warning] 连接池耗尽' },
  { time: '08:35:40', level: 'INFO', message: 'logrotate: 日志轮转完成' },
  { time: '08:40:00', level: 'INFO', message: 'rsyslogd: 接收来自远程的连接' },
  { time: '08:45:22', level: 'WARN', message: '内存使用率超过 80%' },
  { time: '08:50:00', level: 'DEBUG', message: 'ACPI: 电池状态更新 85%' },
]

export default function LogViewer() {
  const [logs] = useState(initialLogs)
  const [filter, setFilter] = useState<Set<Level>>(new Set(levels))
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  })

  const toggleLevel = (level: Level) => {
    const next = new Set(filter)
    if (next.has(level)) next.delete(level)
    else next.add(level)
    setFilter(next)
  }

  const filtered = logs.filter((l) => {
    if (!filter.has(l.level)) return false
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getLevelColor = (level: Level) => {
    switch (level) {
      case 'INFO': return '#89b4fa'
      case 'WARN': return '#f9e2af'
      case 'ERROR': return '#f38ba8'
      case 'DEBUG': return '#a6adc8'
    }
  }

  const handleExport = () => {
    const text = filtered.map((l) => `[${l.time}] [${l.level}] ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'system.log'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => toggleLevel(level)}
            style={{
              padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer',
              background: filter.has(level) ? getLevelColor(level) : '#313244',
              color: filter.has(level) ? '#1e1e2e' : '#a6adc8', fontSize: '11px', fontWeight: 600,
            }}
          >
            {level}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索日志..."
          style={{
            flex: 1, minWidth: '120px', padding: '4px 10px', background: '#313244',
            border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a6adc8', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          自动滚动
        </label>
        <button
          onClick={handleExport}
          style={{ padding: '4px 10px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
        >
          导出
        </button>
        <button
          onClick={() => containerRef.current?.scrollTo({ top: 0 })}
          style={{ padding: '4px 10px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
        >
          清除
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1, overflowY: 'auto', background: '#11111b', fontFamily: 'monospace',
          fontSize: '12px', lineHeight: 1.6, padding: '8px 0',
        }}
      >
        {filtered.map((log, i) => (
          <div key={i} style={{ display: 'flex', padding: '2px 16px' }}>
            <span style={{ color: '#6c7086', width: '70px', flexShrink: 0 }}>{log.time}</span>
            <span style={{ color: getLevelColor(log.level), width: '60px', flexShrink: 0, fontWeight: 600 }}>
              {log.level}
            </span>
            <span>{log.message}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086' }}>没有匹配的日志条目</div>
        )}
      </div>

      <div style={{ padding: '6px 12px', borderTop: '1px solid #313244', fontSize: '11px', color: '#6c7086' }}>
        共 {logs.length} 条日志，当前显示 {filtered.length} 条
      </div>
    </div>
  )
}