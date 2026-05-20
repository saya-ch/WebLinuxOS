import { useState, useRef, useEffect, useCallback } from 'react'

const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const
type Level = (typeof levels)[number]

interface LogEntry {
  time: string
  level: Level
  message: string
  isNew?: boolean
}

const initialLogs: LogEntry[] = [
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

const logTemplates: { level: Level; messages: string[] }[] = [
  {
    level: 'INFO',
    messages: [
      'sshd: 新连接来自 192.168.1.{n}',
      'systemd: 服务 {s} 启动成功',
      'NetworkManager: eth0 已连接',
      'cron: 执行定时任务 /etc/cron.d/{s}',
      'kernel: USB 设备已接入',
      'dbus: 会话总线已建立',
      'avahi-daemon: 服务注册成功',
      'bluetoothd: 设备 {s} 已配对',
      'udisksd: 磁盘 /dev/sd{n} 已挂载',
      'polkitd: 授权操作 {s}',
      'accounts-daemon: 用户会话已创建',
      'colord: 显示器颜色配置文件已加载',
      'fwupd: 固件更新检查完成',
      'packagekit: 事务 {n} 已完成',
      'rtkit: 实时线程优先级已设置',
    ],
  },
  {
    level: 'WARN',
    messages: [
      'systemd-resolved: DNS 解析超时',
      'thermald: CPU 温度接近阈值 ({n}°C)',
      'NetworkManager: 连接不稳定，丢包率 {n}%',
      'smartd: 磁盘 /dev/sda SMART 警告',
      'fwupd: 固件更新需要重启',
      'packagekit: 依赖冲突已自动解决',
      'udisksd: 磁盘空间不足 (/var 使用率 {n}%)',
      'bluetoothd: 连接超时，正在重试',
      'avahi-daemon: 主机名冲突检测',
      'logind: 会话 {n} 空闲超时',
    ],
  },
  {
    level: 'ERROR',
    messages: [
      'dockerd: 容器 {s} 启动失败 - 端口已被占用',
      'mysql: 连接被拒绝 (连接数已达上限)',
      'nginx: 502 Bad Gateway - 上游服务器无响应',
      'systemd: 服务 {s} 崩溃 (exit code {n})',
      'pulseaudio: 音频设备访问被拒绝',
      'cups: 打印任务失败 - 打印机离线',
      'sshd: 认证失败 (用户 {s} 从 10.0.0.{n})',
      'kernel: I/O error on /dev/sda{n}',
      'dbus: 连接被强制断开',
      'crash: 核心转储已写入 /var/crash/{s}',
    ],
  },
  {
    level: 'DEBUG',
    messages: [
      'kernel: 进程调度: CPU{n} 负载 {n}%',
      'systemd: 单元 {s} 状态变更',
      'dbus: 方法调用 org.freedesktop.{s}',
      'glib: 主循环迭代 {n}',
      'network: 路由表更新',
      'kernel: 页面换入/换出: {n} 页',
      'x11: 窗口属性更新 (wid={n})',
      'pipewire: 节点 {s} 状态变更',
      'gdk: 帧绘制完成 ({n}ms)',
      'gio: 文件监控事件: /home/user/{s}',
    ],
  },
]

const services = ['nginx', 'postgres', 'redis', 'docker', 'sshd', 'cron', 'dbus', 'bluetooth', 'cups', 'avahi']
const users = ['admin', 'root', 'user', 'deploy', 'www-data']

function generateLog(): LogEntry {
  const now = new Date()
  const time = now.toTimeString().slice(0, 8)
  const templateGroup = logTemplates[Math.floor(Math.random() * logTemplates.length)]
  const level = templateGroup.level
  let message = templateGroup.messages[Math.floor(Math.random() * templateGroup.messages.length)]
  message = message.replace('{n}', String(Math.floor(Math.random() * 100)))
  message = message.replace('{s}', services[Math.floor(Math.random() * services.length)])
  message = message.replace('{n}', String(Math.floor(Math.random() * 100)))
  message = message.replace('{s}', users[Math.floor(Math.random() * users.length)])
  return { time, level, message, isNew: true }
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [filter, setFilter] = useState<Set<Level>>(new Set(levels))
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [paused, setPaused] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const delay = 2000 + Math.random() * 3000
    timerRef.current = setTimeout(() => {
      setLogs((prev) => [...prev, generateLog()])
    }, delay)
  }, [])

  useEffect(() => {
    if (!paused) {
      scheduleNext()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [paused, scheduleNext])

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

  const stats = {
    INFO: logs.filter((l) => l.level === 'INFO').length,
    WARN: logs.filter((l) => l.level === 'WARN').length,
    ERROR: logs.filter((l) => l.level === 'ERROR').length,
    DEBUG: logs.filter((l) => l.level === 'DEBUG').length,
  }

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

  const handleClear = () => {
    if (showClearConfirm) {
      setLogs([])
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
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
          onClick={() => setPaused(!paused)}
          style={{
            padding: '4px 10px', background: paused ? '#a6e3a1' : '#f9e2af', color: '#1e1e2e',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
          }}
        >
          {paused ? '▶ 恢复' : '⏸ 暂停'}
        </button>
        <button
          onClick={handleExport}
          style={{ padding: '4px 10px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
        >
          导出
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '4px 10px', background: showClearConfirm ? '#f38ba8' : '#313244',
            color: showClearConfirm ? '#1e1e2e' : '#cdd6f4', border: 'none', borderRadius: '4px',
            cursor: 'pointer', fontSize: '11px',
          }}
        >
          {showClearConfirm ? '确认清空?' : '清空'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #313244', background: '#181825' }}>
        {levels.map((level) => (
          <div key={level} style={{ flex: 1, background: '#313244', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLevelColor(level), flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#a6adc8' }}>{level}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: getLevelColor(level), marginLeft: 'auto' }}>{stats[level]}</span>
          </div>
        ))}
        <div style={{ flex: 1, background: '#313244', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cdd6f4', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#a6adc8' }}>总计</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#cdd6f4', marginLeft: 'auto' }}>{logs.length}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1, overflowY: 'auto', background: '#11111b', fontFamily: 'monospace',
          fontSize: '12px', lineHeight: 1.6, padding: '8px 0',
        }}
      >
        {filtered.map((log, i) => (
          <div
            key={`${log.time}-${i}`}
            style={{
              display: 'flex', padding: '2px 16px',
              animation: log.isNew ? 'logFadeIn 0.5s ease-out' : 'none',
              opacity: log.isNew ? undefined : 1,
            }}
          >
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

      <div style={{ padding: '6px 12px', borderTop: '1px solid #313244', fontSize: '11px', color: '#6c7086', display: 'flex', justifyContent: 'space-between' }}>
        <span>共 {logs.length} 条日志，当前显示 {filtered.length} 条</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: paused ? '#f38ba8' : '#a6e3a1' }} />
          {paused ? '已暂停' : '实时更新中'}
        </span>
      </div>

      <style>{`
        @keyframes logFadeIn {
          from { opacity: 0; transform: translateY(-4px); background: rgba(137, 180, 250, 0.08); }
          to { opacity: 1; transform: translateY(0); background: transparent; }
        }
      `}</style>
    </div>
  )
}
