import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Cable, Send, Trash2, Clock, CheckCircle, XCircle,
  Settings, Search, Play, Square, Copy, Download,
  MessageSquare, ArrowRight, ArrowLeft, X,
  Activity, FileJson, Database, Gauge,
  History
} from 'lucide-react'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'closing'
type MessageDirection = 'sent' | 'received' | 'system' | 'error'
type MessageFormat = 'text' | 'json' | 'binary'

interface LogEntry {
  id: string
  direction: MessageDirection
  content: string
  timestamp: number
  format: MessageFormat
  type?: string
}

interface Stats {
  sent: number
  received: number
  connectedAt: number | null
}

const PRESET_SERVERS = [
  { name: 'echo.websocket.org', url: 'wss://echo.websocket.org' },
  { name: 'WebSocket.org 测试', url: 'wss://ws.postman-echo.com/raw' },
  { name: 'Piesocket 演示', url: 'wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self' },
  { name: '本地开发服务器', url: 'ws://localhost:8080' },
  { name: '本地开发服务器 (HTTPS)', url: 'wss://localhost:8443' },
]

const MAX_LOG_ENTRIES = 500

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function isJsonString(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: '已连接', pulse: true }
    case 'connecting':
      return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: '连接中', pulse: true }
    case 'closing':
      return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: '关闭中', pulse: true }
    default:
      return { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '已断开', pulse: false }
  }
}

function getDirectionConfig(dir: MessageDirection) {
  switch (dir) {
    case 'sent':
      return { color: '#89b4fa', bg: 'rgba(137,180,250,0.12)', label: '发送', icon: ArrowRight }
    case 'received':
      return { color: '#a6e3a1', bg: 'rgba(166,227,161,0.12)', label: '接收', icon: ArrowLeft }
    case 'system':
      return { color: '#cba6f7', bg: 'rgba(203,166,247,0.12)', label: '系统', icon: Settings }
    case 'error':
      return { color: '#f38ba8', bg: 'rgba(243,139,168,0.12)', label: '错误', icon: XCircle }
  }
}

export default function WebSocketClient() {
  const [url, setUrl] = useState('wss://echo.websocket.org')
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [log, setLog] = useState<LogEntry[]>([])
  const [message, setMessage] = useState('')
  const [messageFormat, setMessageFormat] = useState<MessageFormat>('text')
  const [subprotocols, setSubprotocols] = useState('')
  const [heartbeatInterval, setHeartbeatInterval] = useState(0)
  const [maxLogEntries, setMaxLogEntries] = useState(MAX_LOG_ENTRIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDirection, setFilterDirection] = useState<MessageDirection | 'all'>('all')
  const [stats, setStats] = useState<Stats>({ sent: 0, received: 0, connectedAt: null })
  const [latency, setLatency] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const pingStartRef = useRef<number | null>(null)
  const elapsedIntervalRef = useRef<number | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((direction: MessageDirection, content: string, format: MessageFormat = 'text', type?: string) => {
    setLog(prev => {
      const entry: LogEntry = {
        id: genId(),
        direction,
        content,
        timestamp: Date.now(),
        format,
        type,
      }
      const next = [...prev, entry]
      if (next.length > maxLogEntries) {
        return next.slice(next.length - maxLogEntries)
      }
      return next
    })
  }, [maxLogEntries])

  const updateStats = useCallback((dir: 'sent' | 'received') => {
    setStats(prev => ({
      ...prev,
      sent: dir === 'sent' ? prev.sent + 1 : prev.sent,
      received: dir === 'received' ? prev.received + 1 : prev.received,
    }))
  }, [])

  const startElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
    }
    elapsedIntervalRef.current = window.setInterval(() => {
      setStats(prev => {
        if (!prev.connectedAt) return prev
        const diff = Math.floor((Date.now() - prev.connectedAt) / 1000)
        const h = String(Math.floor(diff / 3600)).padStart(2, '0')
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
        const s = String(diff % 60).padStart(2, '0')
        setElapsedTime(`${h}:${m}:${s}`)
        return prev
      })
    }, 1000)
  }, [])

  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }
    if (heartbeatInterval > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      heartbeatRef.current = window.setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          pingStartRef.current = performance.now()
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        }
      }, heartbeatInterval * 1000)
    }
  }, [heartbeatInterval])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!url.trim()) return
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    setStatus('connecting')
    addLog('system', `正在连接到 ${url}...`)

    try {
      const protocols = subprotocols
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)

      const ws = protocols.length > 0
        ? new WebSocket(url, protocols)
        : new WebSocket(url)

      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        setStats(prev => ({ ...prev, connectedAt: Date.now(), sent: 0, received: 0 }))
        setElapsedTime('00:00:00')
        setLatency(null)
        addLog('system', `已连接到 ${url}`)
        startHeartbeat()
        startElapsedTimer()
      }

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          event.data.text().then(text => {
            handleIncomingMessage(text, 'binary')
          })
        } else if (event.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder()
          const text = decoder.decode(event.data)
          handleIncomingMessage(text, 'binary')
        } else if (typeof event.data === 'string') {
          try {
            const parsed = JSON.parse(event.data)
            if (parsed.type === 'pong' || (pingStartRef.current !== null && parsed.type === 'ping')) {
              if (parsed.type === 'pong' && pingStartRef.current !== null) {
                const latencyMs = Math.round(performance.now() - pingStartRef.current)
                setLatency(latencyMs)
                pingStartRef.current = null
                addLog('system', `心跳响应: ${latencyMs}ms`)
                return
              }
            }
            if (parsed.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
              return
            }
          } catch {
            // not JSON, treat as plain text
          }
          handleIncomingMessage(event.data, isJsonString(event.data) ? 'json' : 'text')
        }
      }

      ws.onerror = () => {
        setStatus('disconnected')
        addLog('error', '连接发生错误')
      }

      ws.onclose = (event) => {
        setStatus('disconnected')
        addLog('system', `连接已关闭 (代码: ${event.code}${event.reason ? `, 原因: ${event.reason}` : ''})`)
        setStats(prev => ({ ...prev, connectedAt: null }))
        setLatency(null)
        stopHeartbeat()
        stopElapsedTimer()
      }
    } catch (err) {
      setStatus('disconnected')
      addLog('error', `创建连接失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [url, subprotocols, addLog, startHeartbeat, startElapsedTimer, stopHeartbeat, stopElapsedTimer])

  const handleIncomingMessage = useCallback((data: string, format: MessageFormat) => {
    addLog('received', data, format)
    updateStats('received')
  }, [addLog, updateStats])

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      setStatus('closing')
      stopHeartbeat()
      wsRef.current.close(1000, 'Client disconnect')
    }
  }, [stopHeartbeat])

  const sendMessage = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('error', '未连接到 WebSocket 服务器')
      return
    }
    if (!message.trim()) return

    try {
      let dataToSend: string | ArrayBuffer

      if (messageFormat === 'binary') {
        const binaryStr = atob(message)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }
        dataToSend = bytes.buffer
      } else if (messageFormat === 'json') {
        try {
          JSON.parse(message)
          dataToSend = message
        } catch {
          addLog('error', 'JSON 格式无效')
          return
        }
      } else {
        dataToSend = message
      }

      wsRef.current.send(dataToSend)
      addLog('sent', message, messageFormat)
      updateStats('sent')
    } catch (err) {
      addLog('error', `发送失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [message, messageFormat, addLog, updateStats])

  const clearLog = useCallback(() => {
    setLog([])
  }, [])

  const copyMessage = useCallback((entry: LogEntry) => {
    navigator.clipboard.writeText(entry.content).then(() => {
      setCopiedId(entry.id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }, [])

  const exportLog = useCallback(() => {
    const data = log.map(e => ({
      direction: e.direction,
      timestamp: new Date(e.timestamp).toISOString(),
      format: e.format,
      content: e.content,
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `websocket-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [log])

  const filteredLog = log.filter(entry => {
    const matchesSearch = searchTerm === '' ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDirection = filterDirection === 'all' || entry.direction === filterDirection
    return matchesSearch && matchesDirection
  })

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  useEffect(() => {
    return () => {
      stopHeartbeat()
      stopElapsedTimer()
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
        wsRef.current.close()
      }
    }
  }, [stopHeartbeat, stopElapsedTimer])

  useEffect(() => {
    if (status === 'connected') {
      startHeartbeat()
    } else {
      stopHeartbeat()
    }
  }, [status, heartbeatInterval, startHeartbeat, stopHeartbeat])

  const statusConfig = getStatusConfig(status)
  const isConnected = status === 'connected'
  const canConnect = status === 'disconnected'
  const canSend = isConnected && message.trim().length > 0

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      background: 'var(--desktop-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* 头部标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--window-bg)',
        border: '1px solid var(--window-border)',
        boxShadow: 'var(--shadow-elevation-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-accent)',
          }}>
            <Cable size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em' }}>WebSocket 客户端</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>实时消息通信调试工具</div>
          </div>
        </div>

        {/* 状态指示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: statusConfig.bg,
            border: `1px solid ${statusConfig.color}40`,
          }}>
            {statusConfig.pulse && (
              <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: statusConfig.color,
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
            )}
            {!statusConfig.pulse && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusConfig.color }} />
            )}
            <span style={{ fontSize: '13px', fontWeight: 500, color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>

          {isConnected && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Clock size={14} />
                <span style={{ fontFamily: 'monospace' }}>{elapsedTime}</span>
              </div>
              {latency !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Gauge size={14} />
                  <span style={{ fontFamily: 'monospace', color: '#10b981' }}>{latency}ms</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 主体内容 */}
      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        {/* 左侧：连接面板 + 消息发送 + 设置 */}
        <div style={{
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexShrink: 0,
          overflow: 'auto',
        }}>
          {/* 连接面板 */}
          <Panel title="连接" icon={<Cable size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>服务器 URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="wss://example.com/ws"
                  disabled={isConnected || status === 'connecting'}
                  style={{
                    ...inputStyle,
                    width: '100%',
                    fontFamily: 'monospace',
                    cursor: isConnected || status === 'connecting' ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>预设服务器</label>
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setUrl(e.target.value) }}
                  disabled={isConnected || status === 'connecting'}
                  style={{
                    ...inputStyle,
                    width: '100%',
                    cursor: isConnected || status === 'connecting' ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="">-- 选择预设服务器 --</option>
                  {PRESET_SERVERS.map(s => (
                    <option key={s.url} value={s.url}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {canConnect ? (
                  <button onClick={connect} style={{ ...buttonStyle, ...primaryButtonStyle, flex: 1 }}>
                    <Play size={16} /> 连接
                  </button>
                ) : (
                  <button
                    onClick={disconnect}
                    disabled={status === 'closing'}
                    style={{
                      ...buttonStyle,
                      ...dangerButtonStyle,
                      flex: 1,
                      opacity: status === 'closing' ? 0.6 : 1,
                    }}
                  >
                    <Square size={16} /> {status === 'closing' ? '关闭中...' : '断开'}
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(v => !v)}
                  style={{
                    ...buttonStyle,
                    padding: '8px 10px',
                    background: showSettings ? 'var(--accent-bg)' : 'transparent',
                    border: '1px solid var(--color-border)',
                  }}
                  title="设置"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </Panel>

          {/* 设置面板 */}
          {showSettings && (
            <Panel title="设置" icon={<Settings size={16} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>
                    协议子协议（可选，逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={subprotocols}
                    onChange={(e) => setSubprotocols(e.target.value)}
                    placeholder="chat, superchat"
                    style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    心跳间隔（秒，0 = 禁用）
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={3600}
                    value={heartbeatInterval}
                    onChange={(e) => setHeartbeatInterval(Number(e.target.value))}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    最大消息数限制
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    step={50}
                    value={maxLogEntries}
                    onChange={(e) => setMaxLogEntries(Number(e.target.value))}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              </div>
            </Panel>
          )}

          {/* 消息发送区 */}
          <Panel title="发送消息" icon={<Send size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['text', 'json', 'binary'] as MessageFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setMessageFormat(fmt)}
                    style={{
                      ...formatButtonStyle,
                      ...(messageFormat === fmt ? activeFormatStyle : {}),
                    }}
                  >
                    {fmt === 'text' && <MessageSquare size={12} />}
                    {fmt === 'json' && <FileJson size={12} />}
                    {fmt === 'binary' && <Database size={12} />}
                    {fmt === 'text' ? '文本' : fmt === 'json' ? 'JSON' : '二进制'}
                  </button>
                ))}
              </div>

              {messageFormat === 'json' && !isJsonString(message) && message.trim() !== '' && (
                <div style={{ fontSize: '11px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={12} /> JSON 格式无效
                </div>
              )}

              {messageFormat === 'binary' && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  输入 Base64 编码字符串，发送时自动解码为二进制
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  messageFormat === 'json'
                    ? '{\n  "key": "value"\n}'
                    : messageFormat === 'binary'
                    ? 'Base64 编码字符串...'
                    : '输入消息内容...'
                }
                style={{
                  ...textareaStyle,
                  fontFamily: 'monospace',
                  minHeight: '120px',
                  maxHeight: '200px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!canSend}
                style={{
                  ...buttonStyle,
                  ...primaryButtonStyle,
                  opacity: !canSend ? 0.5 : 1,
                  cursor: !canSend ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={16} /> 发送
              </button>
            </div>
          </Panel>

          {/* 统计 */}
          <Panel title="统计" icon={<Activity size={16} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <StatCard
                label="发送"
                value={stats.sent}
                color="#89b4fa"
                icon={<ArrowRight size={16} />}
              />
              <StatCard
                label="接收"
                value={stats.received}
                color="#a6e3a1"
                icon={<ArrowLeft size={16} />}
              />
            </div>
          </Panel>
        </div>

        {/* 右侧：消息日志 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-md)',
          background: 'var(--window-bg)',
          border: '1px solid var(--window-border)',
          boxShadow: 'var(--shadow-elevation-1)',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* 日志工具栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>消息日志</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
              }}>
                {log.length} 条
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* 搜索 */}
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '6px',
                padding: '4px 8px',
                border: '1px solid var(--color-border)',
              }}>
                <Search size={14} style={{ color: 'var(--text-secondary)', marginRight: '6px' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    width: '120px',
                  }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={iconButtonSmallStyle}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* 方向过滤 */}
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value as MessageDirection | 'all')}
                style={{
                  ...inputStyle,
                  padding: '4px 8px',
                  fontSize: '12px',
                  width: 'auto',
                }}
              >
                <option value="all">全部</option>
                <option value="sent">仅发送</option>
                <option value="received">仅接收</option>
                <option value="system">仅系统</option>
                <option value="error">仅错误</option>
              </select>

              <button onClick={exportLog} style={iconButtonStyle} title="导出日志">
                <Download size={14} />
              </button>
              <button onClick={clearLog} style={iconButtonStyle} title="清空日志">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* 日志列表 */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {filteredLog.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                gap: '10px',
              }}>
                <MessageSquare size={40} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: '13px' }}>
                  {log.length === 0 ? '暂无消息记录' : '无匹配的消息'}
                </span>
              </div>
            ) : (
              filteredLog.map(entry => {
                const dirConfig = getDirectionConfig(entry.direction)
                const DirIcon = dirConfig.icon
                const isJson = entry.format === 'json' || (entry.format === 'text' && isJsonString(entry.content))
                const formattedContent = isJson ? formatJson(entry.content) : entry.content

                return (
                  <div key={entry.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--radius-sm)',
                    background: dirConfig.bg,
                    border: `1px solid ${dirConfig.color}25`,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: `1px solid ${dirConfig.color}20`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DirIcon size={12} style={{ color: dirConfig.color }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: dirConfig.color }}>
                          {dirConfig.label}
                        </span>
                        {entry.format === 'json' && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            background: 'rgba(137,180,250,0.2)',
                            color: '#89b4fa',
                          }}>
                            JSON
                          </span>
                        )}
                        {entry.format === 'binary' && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            background: 'rgba(203,166,247,0.2)',
                            color: '#cba6f7',
                          }}>
                            BINARY
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={() => copyMessage(entry)}
                        style={{
                          ...iconButtonSmallStyle,
                          opacity: copiedId === entry.id ? 1 : 0.5,
                          color: copiedId === entry.id ? '#10b981' : 'var(--text-secondary)',
                        }}
                        title={copiedId === entry.id ? '已复制' : '复制'}
                      >
                        {copiedId === entry.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '10px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: '200px',
                      overflow: 'auto',
                    }}>
                      {formattedContent}
                    </pre>
                  </div>
                )
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}

// ============ 辅助组件 ============

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      background: 'var(--window-bg)',
      border: '1px solid var(--window-border)',
      boxShadow: 'var(--shadow-elevation-1)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ padding: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{
        width: '32px', height: '32px',
        borderRadius: '8px',
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color }}>{value}</div>
      </div>
    </div>
  )
}

// ============ 样式常量 ============

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--color-border)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const textareaStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--color-border)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  resize: 'vertical',
  transition: 'border-color 0.2s',
  lineHeight: 1.5,
}

const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  color: '#fff',
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  boxShadow: 'var(--glow-accent)',
}

const dangerButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ef4444, #f38ba8)',
}

const formatButtonStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  background: 'rgba(255,255,255,0.02)',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const activeFormatStyle: React.CSSProperties = {
  background: 'var(--accent-bg)',
  borderColor: 'var(--accent)',
  color: 'var(--accent)',
}

const iconButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  background: 'rgba(255,255,255,0.02)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  padding: 0,
}

const iconButtonSmallStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: 0,
}