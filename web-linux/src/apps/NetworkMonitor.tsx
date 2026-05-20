import { useState, useRef, useEffect, useCallback } from 'react'

interface Connection {
  id: string
  protocol: string
  local: string
  remote: string
  state: string
  pid: number
  process: string
}

interface FirewallRule {
  id: string
  action: 'ALLOW' | 'DENY'
  direction: 'IN' | 'OUT'
  protocol: string
  port: string
  source: string
  enabled: boolean
}

const generateConnections = (): Connection[] => [
  { id: '1', protocol: 'TCP', local: '0.0.0.0:80', remote: '*:*', state: 'LISTEN', pid: 1024, process: 'nginx' },
  { id: '2', protocol: 'TCP', local: '0.0.0.0:443', remote: '*:*', state: 'LISTEN', pid: 1024, process: 'nginx' },
  { id: '3', protocol: 'TCP', local: '192.168.1.10:52341', remote: '142.250.80.46:443', state: 'ESTABLISHED', pid: 2048, process: 'chrome' },
  { id: '4', protocol: 'TCP', local: '192.168.1.10:48920', remote: '140.82.121.4:22', state: 'ESTABLISHED', pid: 3072, process: 'ssh' },
  { id: '5', protocol: 'TCP', local: '192.168.1.10:33100', remote: '151.101.1.69:443', state: 'ESTABLISHED', pid: 2048, process: 'chrome' },
  { id: '6', protocol: 'UDP', local: '0.0.0.0:53', remote: '*:*', state: '', pid: 4096, process: 'dnsmasq' },
  { id: '7', protocol: 'TCP', local: '0.0.0.0:22', remote: '*:*', state: 'LISTEN', pid: 5120, process: 'sshd' },
  { id: '8', protocol: 'TCP', local: '192.168.1.10:60100', remote: '34.120.108.7:443', state: 'TIME_WAIT', pid: 2048, process: 'chrome' },
  { id: '9', protocol: 'TCP', local: '192.168.1.10:54321', remote: '10.0.0.5:5432', state: 'ESTABLISHED', pid: 6144, process: 'postgres' },
  { id: '10', protocol: 'UDP', local: '0.0.0.0:68', remote: '*:*', state: '', pid: 7168, process: 'dhclient' },
  { id: '11', protocol: 'TCP', local: '0.0.0.0:3000', remote: '*:*', state: 'LISTEN', pid: 8192, process: 'node' },
  { id: '12', protocol: 'TCP', local: '192.168.1.10:55000', remote: '172.217.14.99:443', state: 'ESTABLISHED', pid: 2048, process: 'chrome' },
]

const firewallRules: FirewallRule[] = [
  { id: '1', action: 'ALLOW', direction: 'IN', protocol: 'TCP', port: '80', source: '0.0.0.0/0', enabled: true },
  { id: '2', action: 'ALLOW', direction: 'IN', protocol: 'TCP', port: '443', source: '0.0.0.0/0', enabled: true },
  { id: '3', action: 'ALLOW', direction: 'IN', protocol: 'TCP', port: '22', source: '0.0.0.0/0', enabled: true },
  { id: '4', action: 'DENY', direction: 'IN', protocol: 'TCP', port: '3306', source: '0.0.0.0/0', enabled: true },
  { id: '5', action: 'DENY', direction: 'IN', protocol: 'TCP', port: '5432', source: '!10.0.0.0/8', enabled: true },
  { id: '6', action: 'ALLOW', direction: 'OUT', protocol: 'TCP', port: '*', source: '0.0.0.0/0', enabled: true },
  { id: '7', action: 'ALLOW', direction: 'OUT', protocol: 'UDP', port: '53', source: '0.0.0.0/0', enabled: true },
  { id: '8', action: 'DENY', direction: 'IN', protocol: 'ICMP', port: '-', source: '0.0.0.0/0', enabled: false },
  { id: '9', action: 'DENY', direction: 'IN', protocol: 'TCP', port: '8080', source: '0.0.0.0/0', enabled: true },
  { id: '10', action: 'ALLOW', direction: 'IN', protocol: 'TCP', port: '3000', source: '127.0.0.1', enabled: true },
]

type Tab = 'overview' | 'connections' | 'scan' | 'firewall'

export default function NetworkMonitor() {
  const [tab, setTab] = useState<Tab>('overview')
  const [connections] = useState<Connection[]>(generateConnections)
  const [rules, setRules] = useState<FirewallRule[]>(firewallRules)
  const [uploadHistory, setUploadHistory] = useState<number[]>(Array(60).fill(0))
  const [downloadHistory, setDownloadHistory] = useState<number[]>(Array(60).fill(0))
  const [scanRange, setScanRange] = useState('192.168.1.1-100')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<Array<{ port: number; state: string; service: string }>>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(69, 71, 90, 0.3)'
    ctx.lineWidth = 0.5
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (h / 4) * i)
      ctx.lineTo(w, (h / 4) * i)
      ctx.stroke()
    }

    const maxVal = 100
    const step = w / (uploadHistory.length - 1)

    const drawLine = (data: number[], color: string, label: string) => {
      ctx.beginPath()
      data.forEach((val, i) => {
        const x = i * step
        const y = h - (val / maxVal) * (h - 20) - 4
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'))
      grad.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'))
      ctx.fillStyle = grad
      ctx.fill()

      ctx.fillStyle = color
      ctx.font = '10px sans-serif'
      ctx.fillText(label, 4, 12)
    }

    drawLine(downloadHistory, 'rgb(166, 227, 161)', '↓ 下载')
    drawLine(uploadHistory, 'rgb(243, 139, 168)', '↑ 上传')

    const dl = downloadHistory[downloadHistory.length - 1]
    const ul = uploadHistory[uploadHistory.length - 1]
    ctx.fillStyle = '#cdd6f4'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`↓ ${dl?.toFixed(1)} MB/s  ↑ ${ul?.toFixed(1)} MB/s`, w - 4, 14)
    ctx.textAlign = 'left'
  }, [uploadHistory, downloadHistory])

  useEffect(() => {
    const interval = setInterval(() => {
      const dlVal = 15 + Math.random() * 40 + Math.sin(Date.now() / 4000) * 10
      const ulVal = 3 + Math.random() * 10 + Math.sin(Date.now() / 6000) * 3
      setDownloadHistory(prev => [...prev.slice(1), Math.min(100, Math.max(0, dlVal))])
      setUploadHistory(prev => [...prev.slice(1), Math.min(100, Math.max(0, ulVal))])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const startScan = () => {
    setScanning(true)
    setScanProgress(0)
    setScanResults([])

    const commonPorts = [
      { port: 21, service: 'FTP' }, { port: 22, service: 'SSH' }, { port: 23, service: 'Telnet' },
      { port: 25, service: 'SMTP' }, { port: 53, service: 'DNS' }, { port: 80, service: 'HTTP' },
      { port: 110, service: 'POP3' }, { port: 143, service: 'IMAP' }, { port: 443, service: 'HTTPS' },
      { port: 993, service: 'IMAPS' }, { port: 995, service: 'POP3S' }, { port: 3306, service: 'MySQL' },
      { port: 5432, service: 'PostgreSQL' }, { port: 6379, service: 'Redis' }, { port: 8080, service: 'HTTP-Alt' },
      { port: 27017, service: 'MongoDB' },
    ]

    let idx = 0
    scanTimerRef.current = setInterval(() => {
      idx++
      setScanProgress(Math.round((idx / commonPorts.length) * 100))

      if (idx <= commonPorts.length) {
        const p = commonPorts[idx - 1]
        const isOpen = Math.random() > 0.6
        setScanResults(prev => [...prev, {
          port: p.port,
          state: isOpen ? '开放' : '关闭',
          service: p.service,
        }])
      }

      if (idx >= commonPorts.length) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current)
        setScanning(false)
      }
    }, 300)
  }

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const currentDl = downloadHistory[downloadHistory.length - 1]
  const currentUl = uploadHistory[uploadHistory.length - 1]

  const tabs: Array<{ key: Tab; label: string; icon: string }> = [
    { key: 'overview', label: '概览', icon: '📊' },
    { key: 'connections', label: '连接', icon: '🔗' },
    { key: 'scan', label: '扫描', icon: '🔍' },
    { key: 'firewall', label: '防火墙', icon: '🛡️' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #313244', background: '#181825' }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', cursor: 'pointer', fontSize: 12,
              borderBottom: tab === t.key ? '2px solid #89b4fa' : '2px solid transparent',
              color: tab === t.key ? '#89b4fa' : '#6c7086',
            }}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 200 }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #313244' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: '下载速度', value: `${currentDl?.toFixed(1)} MB/s`, color: '#a6e3a1' },
                { label: '上传速度', value: `${currentUl?.toFixed(1)} MB/s`, color: '#f38ba8' },
                { label: '活跃连接', value: connections.filter(c => c.state === 'ESTABLISHED').length.toString(), color: '#89b4fa' },
                { label: '监听端口', value: connections.filter(c => c.state === 'LISTEN').length.toString(), color: '#f9e2af' },
              ].map(item => (
                <div key={item.label} style={{ background: '#181825', borderRadius: 6, padding: '10px 12px', border: '1px solid #313244' }}>
                  <div style={{ fontSize: 10, color: '#6c7086', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'connections' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#181825', zIndex: 1 }}>
                {['协议', '本地地址', '远程地址', '状态', 'PID', '进程'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #313244', color: '#6c7086', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {connections.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #31324422' }}>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ padding: '1px 4px', borderRadius: 2, background: c.protocol === 'TCP' ? '#89b4fa22' : '#a6e3a122', color: c.protocol === 'TCP' ? '#89b4fa' : '#a6e3a1', fontSize: 10 }}>
                      {c.protocol}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{c.local}</td>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{c.remote}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ color: c.state === 'ESTABLISHED' ? '#a6e3a1' : c.state === 'LISTEN' ? '#f9e2af' : '#6c7086' }}>
                      {c.state || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px', color: '#6c7086' }}>{c.pid}</td>
                  <td style={{ padding: '4px 8px' }}>{c.process}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'scan' && (
        <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input
              type="text" value={scanRange} onChange={(e) => setScanRange(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #45475a', background: '#181825', color: '#cdd6f4', fontSize: 12, width: 200, outline: 'none' }}
              placeholder="IP范围"
            />
            <button onClick={startScan} disabled={scanning}
              style={{
                padding: '6px 16px', borderRadius: 4, border: 'none',
                background: scanning ? '#45475a' : '#89b4fa', color: '#1e1e2e',
                cursor: scanning ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12,
              }}>
              {scanning ? '扫描中...' : '开始扫描'}
            </button>
            {scanning && (
              <div style={{ flex: 1, height: 6, background: '#313244', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${scanProgress}%`, height: '100%', background: '#89b4fa', transition: 'width 0.3s' }} />
              </div>
            )}
          </div>

          {scanResults.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['端口', '状态', '服务'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #313244', color: '#6c7086', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scanResults.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #31324422' }}>
                    <td style={{ padding: '4px 8px' }}>{r.port}</td>
                    <td style={{ padding: '4px 8px' }}>
                      <span style={{ color: r.state === '开放' ? '#a6e3a1' : '#f38ba8' }}>{r.state}</span>
                    </td>
                    <td style={{ padding: '4px 8px', color: '#a6adc8' }}>{r.service}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'firewall' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#181825', zIndex: 1 }}>
                {['操作', '方向', '协议', '端口', '来源', '状态'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #313244', color: '#6c7086', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid #31324422', opacity: rule.enabled ? 1 : 0.5 }}>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, background: rule.action === 'ALLOW' ? '#a6e3a122' : '#f38ba822', color: rule.action === 'ALLOW' ? '#a6e3a1' : '#f38ba8' }}>
                      {rule.action}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px' }}>{rule.direction}</td>
                  <td style={{ padding: '4px 8px' }}>{rule.protocol}</td>
                  <td style={{ padding: '4px 8px' }}>{rule.port}</td>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontSize: 10 }}>{rule.source}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <button onClick={() => toggleRule(rule.id)}
                      style={{
                        padding: '2px 8px', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: 10,
                        background: rule.enabled ? '#a6e3a133' : '#f38ba833',
                        color: rule.enabled ? '#a6e3a1' : '#f38ba8',
                      }}>
                      {rule.enabled ? '启用' : '禁用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
