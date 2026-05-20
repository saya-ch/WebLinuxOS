import { useState, useRef, useEffect, useCallback } from 'react'

const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const
type Level = (typeof levels)[number]

interface LogEntry {
  id: number
  time: string
  level: Level
  message: string
}

const LOG_TEMPLATES: Record<Level, string[]> = {
  INFO: [
    '系统服务 {service} 已启动',
    '网络接口 {iface} 已连接',
    '文件 {file} 已保存',
    '定时任务 {task} 执行完成',
    '用户会话已建立',
    '系统服务 {service} 已停止',
    'DNS 解析成功: {domain}',
    '防火墙规则已更新',
    '系统时钟同步完成',
  ],
  WARN: [
    '磁盘空间不足: /dev/sda1 使用率 {percent}%',
    '内存使用率较高: {percent}%',
    '网络延迟增加: {ms}ms',
    '服务 {service} 响应超时',
    'CPU 温度过高: {temp}°C',
    '交换空间使用率: {percent}%',
    '连接数接近上限: {active}/{total}',
  ],
  ERROR: [
    '服务 {service} 异常退出 (code: {code})',
    '文件系统错误: 无法读取 {file}',
    '网络连接中断: {iface}',
    '权限被拒绝: {path}',
    '数据库连接失败: 连接超时',
    'SSL 证书验证失败: {domain}',
    '内核: OOM killer 已终止进程 {pid}',
  ],
  DEBUG: [
    'GC 回收 {size}MB 内存',
    '缓存命中率: {percent}%',
    '线程池状态: {active}/{total}',
    '数据库查询耗时: {ms}ms',
    'HTTP 请求: GET {path} {code}',
    '消息队列: {count} 条待处理',
  ],
}

const SERVICES = ['sshd', 'nginx', 'dockerd', 'cron', 'dbus', 'systemd', 'NetworkManager', 'firewalld', 'rsyslogd', 'postgresql']
const IFACES = ['eth0', 'wlan0', 'lo', 'docker0', 'br0']
const FILES = ['/var/log/syslog', '/etc/hosts', '/home/user/.bashrc', '/tmp/cache.tmp', '/var/lib/data.db', '/etc/nginx/nginx.conf']
const TASKS = ['backup-daily', 'logrotate', 'apt-update', 'cache-clean', 'health-check']
const DOMAINS = ['example.com', 'api.service.local', 'cdn.example.org', 'registry.internal']
const PATHS = ['/root/.ssh', '/var/log/audit', '/etc/shadow', '/opt/data/secure']
const PIDS = ['1234', '5678', '9012', '3456', '7890']

const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min: number, max: number): string => String(Math.floor(Math.random() * (max - min + 1)) + min)

const fillTemplate = (tpl: string): string => {
  return tpl
    .replace('{service}', randomPick(SERVICES))
    .replace('{iface}', randomPick(IFACES))
    .replace('{file}', randomPick(FILES))
    .replace('{task}', randomPick(TASKS))
    .replace('{percent}', randomInt(70, 99))
    .replace('{ms}', randomInt(100, 5000))
    .replace('{code}', randomInt(1, 139))
    .replace('{path}', randomPick(PATHS))
    .replace('{domain}', randomPick(DOMAINS))
    .replace('{temp}', randomInt(75, 95))
    .replace('{active}', randomInt(80, 200))
    .replace('{total}', '256')
    .replace('{size}', randomInt(50, 500))
    .replace('{count}', randomInt(10, 500))
    .replace('{pid}', randomPick(PIDS))
}

const generateLog = (id: number): LogEntry => {
  const levelIdx = Math.floor(Math.random() * levels.length)
  const level = levels[levelIdx]
  const template = randomPick(LOG_TEMPLATES[level])
  const now = new Date()
  const time = now.toLocaleTimeString('zh-CN', { hour12: false })
  return { id, time, level, message: fillTemplate(template) }
}

const getLevelColor = (level: Level): string => {
  switch (level) {
    case 'INFO': return '#89b4fa'
    case 'WARN': return '#f9e2af'
    case 'ERROR': return '#f38ba8'
    case 'DEBUG': return '#a6adc8'
  }
}

let logIdCounter = 0

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const initial: LogEntry[] = []
    for (let i = 0; i < 20; i++) {
      initial.push(generateLog(++logIdCounter))
    }
    return initial
  })
  const [filter, setFilter] = useState<Set<Level>>(new Set(levels))
  const [search, setSearch] = useState('')
  const [paused, setPaused] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      const newLog = generateLog(++logIdCounter)
      setLogs((prev) => [...prev, newLog])
      setNewLogIds((prev) => {
        const next = new Set(prev)
        next.add(newLog.id)
        return next
      })
      setTimeout(() => {
        setNewLogIds((prev) => {
          const next = new Set(prev)
          next.delete(newLog.id)
          return next
        })
      }, 1000)
    }, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [paused])

  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
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

  const stats = levels.map((level) => ({
    level,
    count: logs.filter((l) => l.level === level).length,
    color: getLevelColor(level),
  }))

  const handleExport = useCallback(() => {
    const text = filtered.map((l) => `[${l.time}] [${l.level}] ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'system.log'
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  const handleClear = useCallback(() => {
    if (confirmClear) {
      setLogs([])
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }, [confirmClear])

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
          onClick={() => setShowStats(!showStats)}
          style={{
            padding: '4px 10px', background: showStats ? '#89b4fa' : '#313244', color: showStats ? '#1e1e2e' : '#cdd6f4',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
          }}
        >
          统计
        </button>
        <button
          onClick={handleExport}
          style={{ padding: '4px 10px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
        >
          导出
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '4px 10px', background: confirmClear ? '#f38ba8' : '#313244', color: confirmClear ? '#1e1e2e' : '#cdd6f4',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
          }}
        >
          {confirmClear ? '确认清空?' : '清空'}
        </button>
      </div>

      {showStats && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '12px' }}>
          {stats.map((s) => (
            <div key={s.level} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
              <span style={{ color: '#a6adc8' }}>{s.level}:</span>
              <span style={{ color: s.color, fontWeight: 600 }}>{s.count}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#a6adc8' }}>
            总计: <span style={{ color: '#cdd6f4', fontWeight: 600 }}>{logs.length}</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        onMouseEnter={() => { autoScrollRef.current = false }}
        onMouseLeave={() => { autoScrollRef.current = true }}
        style={{
          flex: 1, overflowY: 'auto', background: '#11111b', fontFamily: 'monospace',
          fontSize: '12px', lineHeight: 1.6, padding: '8px 0',
        }}
      >
        {filtered.map((log) => (
          <div
            key={log.id}
            style={{
              display: 'flex', padding: '2px 16px',
              opacity: newLogIds.has(log.id) ? undefined : 1,
              animation: newLogIds.has(log.id) ? 'logFadeIn 0.5s ease' : undefined,
            }}
          >
            <span style={{ color: '#6c7086', width: '80px', flexShrink: 0 }}>{log.time}</span>
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
        <span>{paused ? '⏸ 已暂停' : '● 实时监控中'}</span>
      </div>

      <style>{`
        @keyframes logFadeIn {
          from { opacity: 0; transform: translateY(-4px); background: rgba(137, 180, 250, 0.1); }
          to { opacity: 1; transform: translateY(0); background: transparent; }
        }
      `}</style>
    </div>
  )
}
