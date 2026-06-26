import { useState, useEffect, memo, useCallback } from 'react'
import { useStore } from '../store'

interface NetworkMetrics {
  bandwidth: { download: number; upload: number }
  latency: number
  packetLoss: number
  connectionStatus: 'connected' | 'disconnected' | 'weak' | 'excellent'
  jitter: number
}

interface NetworkInterface {
  id: string
  name: string
  type: 'ethernet' | 'wifi' | 'vpn' | 'loopback'
  status: 'up' | 'down'
  ip: string
  mac: string
  speed: string
  rxBytes: number
  txBytes: number
}

interface DNSRecord {
  domain: string
  resolvedIP: string
  status: 'success' | 'failed' | 'pending'
  responseTime: number
  timestamp: Date
}

interface ConnectionHistory {
  id: string
  time: Date
  event: 'connect' | 'disconnect' | 'latency_spike' | 'packet_loss'
  details: string
}

const mockInterfaces: NetworkInterface[] = [
  { id: '1', name: 'eth0', type: 'ethernet', status: 'up', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5E', speed: '1000 Mbps', rxBytes: 1048576, txBytes: 524288 },
  { id: '2', name: 'wlan0', type: 'wifi', status: 'up', ip: '192.168.1.101', mac: 'AA:BB:CC:DD:EE:FF', speed: '866 Mbps', rxBytes: 2097152, txBytes: 1048576 },
  { id: '3', name: 'lo', type: 'loopback', status: 'up', ip: '127.0.0.1', mac: '00:00:00:00:00:00', speed: '-', rxBytes: 1024, txBytes: 1024 },
  { id: '4', name: 'tun0', type: 'vpn', status: 'up', ip: '10.8.0.1', mac: '-', speed: '100 Mbps', rxBytes: 512000, txBytes: 256000 },
]

const mockDNSRecords: DNSRecord[] = [
  { domain: 'google.com', resolvedIP: '142.250.185.46', status: 'success', responseTime: 12, timestamp: new Date() },
  { domain: 'github.com', resolvedIP: '140.82.121.4', status: 'success', responseTime: 18, timestamp: new Date() },
  { domain: 'cloudflare.com', resolvedIP: '104.16.132.229', status: 'success', responseTime: 8, timestamp: new Date() },
]

const NetworkStatusDashboard = memo(function NetworkStatusDashboard() {
  const { theme } = useStore()
  const isDark = theme === 'dark'

  const [metrics, setMetrics] = useState<NetworkMetrics>({
    bandwidth: { download: 45.2, upload: 12.8 },
    latency: 28,
    packetLoss: 0.1,
    connectionStatus: 'excellent',
    jitter: 2.5,
  })

  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(mockInterfaces)
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>(mockDNSRecords)
  const [connectionHistory, setConnectionHistory] = useState<ConnectionHistory[]>([])
  const [bandwidthHistory, setBandwidthHistory] = useState<{ download: number[]; upload: number[] }>({
    download: [],
    upload: [],
  })
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'overview' | 'interfaces' | 'dns' | 'history'>('overview')

  // 实时更新网络指标
  useEffect(() => {
    const updateMetrics = () => {
      const download = +(Math.random() * 80 + 10).toFixed(1)
      const upload = +(Math.random() * 30 + 2).toFixed(1)
      const latency = Math.floor(Math.random() * 50 + 10)
      const jitter = +(Math.random() * 5 + 1).toFixed(1)
      const packetLoss = +(Math.random() * 0.5).toFixed(2)

      let status: NetworkMetrics['connectionStatus'] = 'excellent'
      if (latency > 100 || packetLoss > 1) status = 'weak'
      else if (latency > 50 || packetLoss > 0.3) status = 'connected'
      else if (latency > 30) status = 'connected'

      setMetrics({
        bandwidth: { download, upload },
        latency,
        packetLoss,
        connectionStatus: status,
        jitter,
      })

      setBandwidthHistory(prev => ({
        download: [...prev.download.slice(-30), download],
        upload: [...prev.upload.slice(-30), upload],
      }))

      setLatencyHistory(prev => [...prev.slice(-30), latency])

      // 更新接口流量
      setInterfaces(prev => prev.map(iface => ({
        ...iface,
        rxBytes: iface.rxBytes + Math.floor(Math.random() * 100000),
        txBytes: iface.txBytes + Math.floor(Math.random() * 50000),
      })))

      setLastUpdate(new Date())

      // 添加历史记录
      if (Math.random() > 0.8) {
        const eventTypes: ConnectionHistory['event'][] = ['connect', 'disconnect', 'latency_spike', 'packet_loss']
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        const detailsMap = {
          connect: '新设备连接到网络',
          disconnect: '设备断开连接',
          latency_spike: `延迟突然升高至 ${latency}ms`,
          packet_loss: `检测到 ${packetLoss}% 丢包`,
        }
        setConnectionHistory(prev => [
          { id: Date.now().toString(), time: new Date(), event, details: detailsMap[event] },
          ...prev.slice(0, 19),
        ])
      }
    }

    const interval = setInterval(updateMetrics, 1000)
    updateMetrics()

    return () => clearInterval(interval)
  }, [])

  // DNS 模拟解析
  useEffect(() => {
    const domains = ['google.com', 'github.com', 'cloudflare.com', 'amazon.com', 'microsoft.com']
    const interval = setInterval(() => {
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const success = Math.random() > 0.1
      setDnsRecords(prev => [
        {
          domain,
          resolvedIP: success ? `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : '-',
          status: success ? 'success' : 'failed',
          responseTime: Math.floor(Math.random() * 50 + 5),
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = useCallback((status: NetworkMetrics['connectionStatus']) => {
    const colors = {
      excellent: isDark ? '#10b981' : '#059669',
      connected: isDark ? '#3b82f6' : '#2563eb',
      weak: isDark ? '#f97316' : '#ea580c',
      disconnected: isDark ? '#ef4444' : '#dc2626',
    }
    return colors[status]
  }, [isDark])

  const getLatencyColor = useCallback((latency: number) => {
    if (latency < 30) return isDark ? '#10b981' : '#059669'
    if (latency < 60) return isDark ? '#3b82f6' : '#2563eb'
    if (latency < 100) return isDark ? '#f97316' : '#ea580c'
    return isDark ? '#ef4444' : '#dc2626'
  }, [isDark])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1073741824).toFixed(2)} GB`
  }

  const renderBandwidthChart = useCallback(() => {
    const maxVal = Math.max(...bandwidthHistory.download, ...bandwidthHistory.upload, 100)
    return (
      <div style={{
        height: '120px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        padding: '8px',
        background: isDark ? '#181825' : '#f1f5f9',
        borderRadius: '8px',
      }}>
        {bandwidthHistory.download.map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', height: '100%' }}>
            <div
              style={{
                height: `${(bandwidthHistory.download[i] / maxVal) * 60}%`,
                background: isDark ? '#89b4fa' : '#3b82f6',
                borderRadius: '2px',
                minHeight: '2px',
                transition: 'height 0.3s ease',
              }}
            />
            <div
              style={{
                height: `${(bandwidthHistory.upload[i] / maxVal) * 40}%`,
                background: isDark ? '#a6e3a1' : '#10b981',
                borderRadius: '2px',
                minHeight: '2px',
                transition: 'height 0.3s ease',
              }}
            />
          </div>
        ))}
      </div>
    )
  }, [bandwidthHistory, isDark])

  const renderLatencyChart = useCallback(() => {
    const maxVal = Math.max(...latencyHistory, 100)
    return (
      <div style={{ height: '80px', position: 'relative', padding: '8px' }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isDark ? '#89b4fa' : '#3b82f6'} />
              <stop offset="100%" stopColor={isDark ? '#cba6f7' : '#8b5cf6'} />
            </linearGradient>
          </defs>
          {latencyHistory.length > 1 && (
            <polyline
              fill="none"
              stroke="url(#latencyGradient)"
              strokeWidth="2"
              points={latencyHistory.map((v, i) => {
                const x = (i / (latencyHistory.length - 1)) * 100
                const y = 100 - (v / maxVal) * 80
                return `${x},${y}`
              }).join(' ')}
              style={{ transition: 'all 0.3s ease' }}
            />
          )}
        </svg>
      </div>
    )
  }, [latencyHistory, isDark])

  const baseColors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#e2e8f0' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    accent: isDark ? '#3b82f6' : '#2563eb',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f97316' : '#ea580c',
    error: isDark ? '#ef4444' : '#dc2626',
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: baseColors.bg,
      color: baseColors.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${baseColors.cardBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '24px',
              animation: 'pulse 2s infinite',
            }}>🌐</span>
            网络状态监控仪表盘
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: baseColors.textSecondary }}>
            实时监控网络性能与连接状态
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <div style={{ color: baseColors.textSecondary }}>最后更新</div>
          <div style={{
            color: baseColors.accent,
            fontWeight: 600,
            fontSize: '14px',
          }}>
            {lastUpdate.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${baseColors.cardBorder}`,
      }}>
        {(['overview', 'interfaces', 'dns', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === tab ? baseColors.cardBg : 'transparent',
              color: activeTab === tab ? baseColors.accent : baseColors.textSecondary,
              cursor: 'pointer',
              borderBottom: activeTab === tab ? `2px solid ${baseColors.accent}` : 'none',
              fontSize: '14px',
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
          >
            {tab === 'overview' && '📊 概览'}
            {tab === 'interfaces' && '🔌 接口'}
            {tab === 'dns' && '📡 DNS'}
            {tab === 'history' && '📜 历史'}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'overview' && (
          <div>
            {/* 主要指标卡片 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '20px',
            }}>
              {/* 连接状态 */}
              <div style={{
                padding: '20px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `${getStatusColor(metrics.connectionStatus)}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  animation: metrics.connectionStatus === 'excellent' ? 'pulse 1.5s infinite' : 'none',
                }}>
                  <span style={{
                    fontSize: '28px',
                    color: getStatusColor(metrics.connectionStatus),
                  }}>
                    {metrics.connectionStatus === 'excellent' ? '✓' : 
                     metrics.connectionStatus === 'connected' ? '○' :
                     metrics.connectionStatus === 'weak' ? '△' : '✗'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: baseColors.textSecondary, marginBottom: '4px' }}>连接状态</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: getStatusColor(metrics.connectionStatus),
                }}>
                  {metrics.connectionStatus === 'excellent' ? '优秀' :
                   metrics.connectionStatus === 'connected' ? '正常' :
                   metrics.connectionStatus === 'weak' ? '较弱' : '断开'}
                </div>
              </div>

              {/* 带宽下载 */}
              <div style={{
                padding: '20px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '14px', color: baseColors.textSecondary, marginBottom: '8px' }}>下载带宽</div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: isDark ? '#89b4fa' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                }}>
                  {metrics.bandwidth.download}
                  <span style={{ fontSize: '14px', fontWeight: 400 }}>Mbps</span>
                </div>
                <div style={{
                  marginTop: '8px',
                  height: '4px',
                  background: isDark ? '#1e293b' : '#e2e8f0',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(metrics.bandwidth.download / 100) * 100}%`,
                    height: '100%',
                    background: isDark ? '#89b4fa' : '#3b82f6',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* 带宽上传 */}
              <div style={{
                padding: '20px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '14px', color: baseColors.textSecondary, marginBottom: '8px' }}>上传带宽</div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: baseColors.success,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                }}>
                  {metrics.bandwidth.upload}
                  <span style={{ fontSize: '14px', fontWeight: 400 }}>Mbps</span>
                </div>
                <div style={{
                  marginTop: '8px',
                  height: '4px',
                  background: isDark ? '#1e293b' : '#e2e8f0',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(metrics.bandwidth.upload / 50) * 100}%`,
                    height: '100%',
                    background: baseColors.success,
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* 延迟 */}
              <div style={{
                padding: '20px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '14px', color: baseColors.textSecondary, marginBottom: '8px' }}>网络延迟</div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: getLatencyColor(metrics.latency),
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                }}>
                  {metrics.latency}
                  <span style={{ fontSize: '14px', fontWeight: 400 }}>ms</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: baseColors.textSecondary }}>
                  抖动: {metrics.jitter}ms | 丢包: {metrics.packetLoss}%
                </div>
              </div>
            </div>

            {/* 实时图表 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}>
              {/* 带宽历史图表 */}
              <div style={{
                padding: '20px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>📈</span> 带宽实时监控
                </div>
                {renderBandwidthChart()}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: baseColors.textSecondary,
                }}>
                  <span><span style={{ color: isDark ? '#89b4fa' : '#3b82f6' }}>▼</span> 下载</span>
                  <span><span style={{ color: baseColors.success }}>▲</span> 上传</span>
                  <span>最近 30 秒</span>
                </div>
              </div>

              {/* 延迟历史图表 */}
              <div style={{
                padding: '20px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>⚡</span> 延迟趋势
                </div>
                {renderLatencyChart()}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '12px',
                  color: baseColors.textSecondary,
                }}>
                  <span>当前: {metrics.latency}ms</span>
                  <span>平均: {latencyHistory.length > 0 ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length) : 0}ms</span>
                </div>
              </div>
            </div>

            {/* 快速统计 */}
            <div style={{
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>活跃接口</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{interfaces.filter(i => i.status === 'up').length}</div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>总接收</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: isDark ? '#89b4fa' : '#3b82f6' }}>
                  {formatBytes(interfaces.reduce((sum, i) => sum + i.rxBytes, 0))}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>总发送</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: baseColors.success }}>
                  {formatBytes(interfaces.reduce((sum, i) => sum + i.txBytes, 0))}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>DNS缓存</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{dnsRecords.length}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interfaces' && (
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: baseColors.text,
            }}>网络接口状态</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              {interfaces.map(iface => (
                <div
                  key={iface.id}
                  style={{
                    padding: '20px',
                    background: baseColors.cardBg,
                    borderRadius: '12px',
                    border: `1px solid ${baseColors.cardBorder}`,
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: iface.status === 'up' ? `${baseColors.success}20` : `${baseColors.error}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}>
                      {iface.type === 'ethernet' ? '🔗' : 
                       iface.type === 'wifi' ? '📶' : 
                       iface.type === 'vpn' ? '🔒' : '🔄'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: baseColors.text,
                      }}>{iface.name}</div>
                      <div style={{
                        fontSize: '12px',
                        color: baseColors.textSecondary,
                      }}>
                        {iface.type === 'ethernet' ? '以太网' :
                         iface.type === 'wifi' ? '无线网络' :
                         iface.type === 'vpn' ? 'VPN隧道' : '回环接口'}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: iface.status === 'up' ? `${baseColors.success}20` : `${baseColors.error}20`,
                      color: iface.status === 'up' ? baseColors.success : baseColors.error,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {iface.status === 'up' ? '在线' : '离线'}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '13px',
                  }}>
                    <div>
                      <div style={{ color: baseColors.textSecondary, fontSize: '11px' }}>IP 地址</div>
                      <div style={{ color: baseColors.accent, fontWeight: 500 }}>{iface.ip}</div>
                    </div>
                    <div>
                      <div style={{ color: baseColors.textSecondary, fontSize: '11px' }}>MAC 地址</div>
                      <div style={{ color: baseColors.text }}>{iface.mac}</div>
                    </div>
                    <div>
                      <div style={{ color: baseColors.textSecondary, fontSize: '11px' }}>连接速度</div>
                      <div style={{ color: baseColors.text }}>{iface.speed}</div>
                    </div>
                    <div>
                      <div style={{ color: baseColors.textSecondary, fontSize: '11px' }}>接收流量</div>
                      <div style={{ color: isDark ? '#89b4fa' : '#3b82f6' }}>{formatBytes(iface.rxBytes)}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ color: baseColors.textSecondary, fontSize: '11px' }}>发送流量</div>
                      <div style={{ color: baseColors.success }}>{formatBytes(iface.txBytes)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dns' && (
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: baseColors.text,
            }}>DNS 解析状态</div>
            <div style={{
              background: baseColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${baseColors.cardBorder}`,
              overflow: 'hidden',
            }}>
              {/* 表头 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 80px 80px 120px',
                padding: '12px 16px',
                background: isDark ? '#334155' : '#f1f5f9',
                fontSize: '12px',
                color: baseColors.textSecondary,
                fontWeight: 600,
              }}>
                <div>域名</div>
                <div>解析IP</div>
                <div>状态</div>
                <div>响应时间</div>
                <div>时间戳</div>
              </div>

              {/* 记录行 */}
              {dnsRecords.map((record, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 80px 80px 120px',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${baseColors.cardBorder}`,
                    fontSize: '13px',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{
                    fontWeight: 500,
                    color: baseColors.text,
                  }}>{record.domain}</div>
                  <div style={{
                    color: record.status === 'success' ? baseColors.accent : baseColors.error,
                  }}>{record.resolvedIP}</div>
                  <div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: record.status === 'success' ? `${baseColors.success}20` : `${baseColors.error}20`,
                      color: record.status === 'success' ? baseColors.success : baseColors.error,
                      fontSize: '11px',
                    }}>
                      {record.status === 'success' ? '成功' : '失败'}
                    </span>
                  </div>
                  <div style={{
                    color: record.responseTime < 20 ? baseColors.success : 
                           record.responseTime < 40 ? baseColors.accent : baseColors.warning,
                  }}>{record.responseTime}ms</div>
                  <div style={{ color: baseColors.textSecondary, fontSize: '12px' }}>
                    {record.timestamp.toLocaleTimeString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>

            {/* DNS 统计 */}
            <div style={{
              marginTop: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>成功解析</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: baseColors.success }}>
                  {dnsRecords.filter(r => r.status === 'success').length}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>平均响应</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: baseColors.accent }}>
                  {dnsRecords.length > 0 ? Math.round(dnsRecords.reduce((sum, r) => sum + r.responseTime, 0) / dnsRecords.length) : 0}ms
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>解析失败</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: baseColors.error }}>
                  {dnsRecords.filter(r => r.status === 'failed').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: baseColors.text,
            }}>网络连接历史记录</div>
            
            {connectionHistory.length === 0 ? (
              <div style={{
                padding: '40px',
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
                color: baseColors.textSecondary,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <div>暂无历史记录，正在监控网络事件...</div>
              </div>
            ) : (
              <div style={{
                background: baseColors.cardBg,
                borderRadius: '12px',
                border: `1px solid ${baseColors.cardBorder}`,
                overflow: 'hidden',
              }}>
                {connectionHistory.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 16px',
                      borderBottom: index < connectionHistory.length - 1 ? `1px solid ${baseColors.cardBorder}` : 'none',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: item.event === 'connect' ? `${baseColors.success}20` :
                                  item.event === 'disconnect' ? `${baseColors.error}20` :
                                  item.event === 'latency_spike' ? `${baseColors.warning}20` : `${baseColors.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      {item.event === 'connect' ? '🔗' :
                       item.event === 'disconnect' ? '❌' :
                       item.event === 'latency_spike' ? '⚡' : '📦'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 500,
                        color: baseColors.text,
                      }}>
                        {item.event === 'connect' ? '连接事件' :
                         item.event === 'disconnect' ? '断开事件' :
                         item.event === 'latency_spike' ? '延迟峰值' : '丢包警告'}
                      </div>
                      <div style={{
                        color: baseColors.textSecondary,
                        fontSize: '12px',
                      }}>{item.details}</div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      fontSize: '12px',
                      color: baseColors.textSecondary,
                    }}>
                      {item.time.toLocaleTimeString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 统计信息 */}
            <div style={{
              marginTop: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>连接次数</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: baseColors.success }}>
                  {connectionHistory.filter(h => h.event === 'connect').length}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>断开次数</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: baseColors.error }}>
                  {connectionHistory.filter(h => h.event === 'disconnect').length}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>延迟峰值</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: baseColors.warning }}>
                  {connectionHistory.filter(h => h.event === 'latency_spike').length}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: baseColors.cardBg,
                borderRadius: '10px',
                border: `1px solid ${baseColors.cardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: baseColors.textSecondary }}>丢包事件</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: baseColors.accent }}>
                  {connectionHistory.filter(h => h.event === 'packet_loss').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
        background: baseColors.cardBg,
        borderTop: `1px solid ${baseColors.cardBorder}`,
        fontSize: '12px',
        color: baseColors.textSecondary,
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusColor(metrics.connectionStatus),
              animation: 'pulse 2s infinite',
            }} />
            状态: {metrics.connectionStatus === 'excellent' ? '优秀' : metrics.connectionStatus === 'connected' ? '正常' : metrics.connectionStatus === 'weak' ? '较弱' : '断开'}
          </span>
          <span>延迟: {metrics.latency}ms</span>
          <span>丢包: {metrics.packetLoss}%</span>
        </div>
        <div>更新频率: 1秒</div>
      </div>

      {/* CSS 动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
})

export default NetworkStatusDashboard